import { SharedResources } from "../DocumentScanner";
import DocumentScannerView from "./DocumentScannerView";
import { NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { createControls } from "./utils";
import DocumentCorrectionView from "./DocumentCorrectionView";
import { DDS_ICONS } from "./utils/icons";
import { ControlButton, DocumentScanResult, EnumResultStatus } from "./utils/types";

export interface ScanResultViewControlIcons {
  exportBtn?: Pick<ControlButton, "icon" | "text">;
  correctImageBtn?: Pick<ControlButton, "icon" | "text">;
  retakeBtn?: Pick<ControlButton, "icon" | "text">;
  completeBtn?: Pick<ControlButton, "icon" | "text">;
  containerStyle?: Partial<CSSStyleDeclaration>;
}

export interface ScanResultViewConfig {
  container: HTMLElement;
  controlIcons: ScanResultViewControlIcons;
  onComplete?: (result: DocumentScanResult) => Promise<void>;
  onExport?: (result: DocumentScanResult) => Promise<void>;
}

export default class ScanResultView {
  private container: HTMLElement;
  private currentScanResultViewResolver?: (result: DocumentScanResult) => void;

  constructor(
    private resources: SharedResources,
    private config: ScanResultViewConfig,
    private scannerView: DocumentScannerView,
    private correctionView: DocumentCorrectionView
  ) {}

  async launch(): Promise<DocumentScanResult> {
    try {
      this.config.container.textContent = "";
      await this.initialize();
      this.config.container.style.display = "flex";

      // Return promise that resolves when user clicks complete
      return new Promise((resolve) => {
        this.currentScanResultViewResolver = resolve;
      });
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      throw errMsg;
    }
  }

  private async handleExport() {
    try {
      const { result } = this.resources;
      if (!result?.correctedImageResult) {
        throw new Error("No image to export");
      }

      if (this.config?.onExport) {
        await this.config.onExport(result);
      } else {
        // Convert to canvas and then to blob
        const blob = await (result.correctedImageResult as NormalizedImageResultItem).toBlob("image/png");

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `document-${Date.now()}.png`;

        // Trigger download
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Failed to export");
    }
  }

  private async handleCorrectImage() {
    try {
      this.hideView();
      const result = await this.correctionView.launch();

      // After normalization is complete, show scan result view again with updated image
      if (result.correctedImageResult) {
        // Update the shared resources with new corrected result
        if (this.resources.onResultUpdated) {
          this.resources.onResultUpdated({
            ...this.resources.result,
            correctedImageResult: result.correctedImageResult,
          });
        }

        // Clear current scan result view and reinitialize with new image
        this.dispose(true); // true = preserve resolver
        await this.initialize();
        this.config.container.style.display = "flex";
      }
    } catch (error) {
      console.error("ScanResultView - Handle Correction View Error:", error);
      // Make sure to resolve with error if something goes wrong
      if (this.currentScanResultViewResolver) {
        this.currentScanResultViewResolver({
          status: {
            code: EnumResultStatus.RS_FAILED,
            message: error?.message || error,
          },
        });
      }
      throw error;
    }
  }

  private async handleRetake() {
    try {
      this.hideView();
      const result = await this.scannerView.launch();

      if (this.currentScanResultViewResolver && result?.status?.code === EnumResultStatus.RS_FAILED) {
        this.currentScanResultViewResolver(result);

        return;
      }

      // Handle success case
      if (this.resources.onResultUpdated) {
        if (result?.status.code === EnumResultStatus.RS_CANCELLED) {
          this.resources.onResultUpdated(this.resources.result);
        } else if (result?.status.code === EnumResultStatus.RS_SUCCESS) {
          this.resources.onResultUpdated(result);
        }
      }

      this.dispose(true);
      await this.initialize();
      this.config.container.style.display = "flex";
    } catch (error) {
      console.error("Error in retake handler:", error);
      // Make sure to resolve with error if something goes wrong
      if (this.currentScanResultViewResolver) {
        this.currentScanResultViewResolver({
          status: {
            code: EnumResultStatus.RS_FAILED,
            message: error?.message || error,
          },
        });
      }
      throw error;
    }
  }

  private async handleComplete() {
    try {
      if (this.config?.onComplete) {
        await this.config.onComplete(this.resources.result);
      }

      // Resolve with current result
      if (this.currentScanResultViewResolver && this.resources.result) {
        this.currentScanResultViewResolver(this.resources.result);
      }

      // Clean up
      this.hideView();
      this.dispose();
    } catch (error) {
      console.error("Error in complete handler:", error);
      // Make sure to resolve with error if something goes wrong
      if (this.currentScanResultViewResolver) {
        this.currentScanResultViewResolver({
          status: {
            code: EnumResultStatus.RS_FAILED,
            message: error?.message || error,
          },
        });
      }
      throw error;
    }
  }

  private createControls(): HTMLElement {
    const { controlIcons } = this.config;

    const buttons: ControlButton[] = [
      {
        icon: controlIcons?.exportBtn?.icon || DDS_ICONS.export,
        text: controlIcons?.exportBtn?.text || "Export Image",
        onClick: () => this.handleExport(),
      },
      {
        icon: controlIcons?.correctImageBtn?.icon || DDS_ICONS.normalize,
        text: controlIcons?.correctImageBtn?.text || "Correct Image",
        onClick: () => this.handleCorrectImage(),
      },
      {
        icon: controlIcons?.retakeBtn?.icon || DDS_ICONS.retake,
        text: controlIcons?.retakeBtn?.text || "Re-take",
        onClick: () => this.handleRetake(),
      },
      {
        icon: controlIcons?.completeBtn?.icon || DDS_ICONS.complete,
        text: controlIcons?.completeBtn?.text || "Complete",
        onClick: () => this.handleComplete(),
      },
    ];

    return createControls(buttons, controlIcons?.containerStyle);
  }

  private setupScanResultViewControls() {
    try {
      const controlContainer = this.createControls();
      this.config.container.appendChild(controlContainer);
    } catch (error) {
      console.error("Error setting up scan result view controls:", error);
      throw new Error(`Failed to setup scan result view controls: ${error.message}`);
    }
  }

  async initialize(): Promise<void> {
    try {
      if (!this.resources.result) {
        throw Error("Captured image is missing. Please capture an image first!");
      }

      if (!this.config.container) {
        throw new Error("Please create a Scan Result View Container element");
      }

      // Add basic styling to container
      Object.assign(this.config.container.style, {
        display: "flex",
        width: "100%",
        backgroundColor: "#575757",
        fontSize: "12px",
        flexDirection: "column",
        alignItems: "center",
      });

      // Create and add scan result view image container
      const scanResultViewImageContainer = document.createElement("div");
      Object.assign(scanResultViewImageContainer.style, {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "0",
      });

      // Add scan result image
      const scanResultImg = (this.resources.result.correctedImageResult as NormalizedImageResultItem)?.toCanvas();
      Object.assign(scanResultImg.style, {
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
      });

      scanResultViewImageContainer.appendChild(scanResultImg);
      this.config.container.appendChild(scanResultViewImageContainer);

      // Set up controls
      this.setupScanResultViewControls();
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
    }
  }

  hideView(): void {
    this.config.container.style.display = "none";
  }

  dispose(preserveResolver: boolean = false): void {
    // Clean up the container
    this.config.container.textContent = "";

    // Clear resolver only if not preserving
    if (!preserveResolver) {
      this.currentScanResultViewResolver = undefined;
    }
  }
}

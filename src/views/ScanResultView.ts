import { SharedResources } from "../DocumentScanner";
import DocumentScannerView from "./DocumentScannerView";
import { NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { createControls, shouldCorrectImage } from "./utils";
import DocumentCorrectionView from "./DocumentCorrectionView";
import { DDS_ICONS } from "./utils/icons";
import { ControlButton, DocumentScanResult, EnumResultStatus } from "./utils/types";

export interface ScanResultViewControlIcons {
  uploadBtn?: Pick<ControlButton, "icon" | "text">;
  correctImageBtn?: Pick<ControlButton, "icon" | "text">;
  retakeBtn?: Pick<ControlButton, "icon" | "text">;
  doneBtn?: Pick<ControlButton, "icon" | "text">;
  containerStyle?: Partial<CSSStyleDeclaration>;
}

export interface ScanResultViewConfig {
  container?: HTMLElement;
  controlIcons?: ScanResultViewControlIcons;
  onDone?: (result: DocumentScanResult) => Promise<void>;
  onUpload?: (result: DocumentScanResult) => Promise<void>;
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

      // Return promise that resolves when user clicks done
      return new Promise((resolve) => {
        this.currentScanResultViewResolver = resolve;
      });
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      throw errMsg;
    }
  }

  private async handleUploadAndShareBtn() {
    try {
      const { result } = this.resources;
      if (!result?.correctedImageResult) {
        throw new Error("No image to upload");
      }

      if (this.config?.onUpload) {
        await this.config.onUpload(result);
      } else {
        await this.handleShare();
      }
    } catch (error) {
      console.error("Error on upload/share:", error);
      alert("Failed");
    }
  }

  private async handleShare() {
    try {
      const { result } = this.resources;

      // Validate input
      if (!result?.correctedImageResult) {
        throw new Error("No image result provided");
      }

      // Convert to blob
      const blob = await (result.correctedImageResult as NormalizedImageResultItem).toBlob("image/png");
      if (!blob) {
        throw new Error("Failed to convert image to blob");
      }

      // For Windows, we'll create a download fallback if sharing isn't supported
      const file = new File([blob], `document-${Date.now()}.png`, {
        type: blob.type,
      });

      // Try Web Share API first
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Dynamsoft Document Scanner Shared Image",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      return true;
    } catch (ex: any) {
      // Only show error if it's not a user cancellation
      if (ex.name !== "AbortError") {
        let errMsg = ex?.message || ex;
        console.error("Error sharing image:", errMsg);
        alert(`Error sharing image: ${errMsg}`);
      }
    }
  }

  private async handleCorrectImage() {
    try {
      if (!this.correctionView) {
        console.error("Correction View not initialized");
        return;
      }

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
      if (!this.scannerView) {
        console.error("Correction View not initialized");
        return;
      }

      this.hideView();
      const result = await this.scannerView.launch();

      if (result?.status?.code === EnumResultStatus.RS_FAILED) {
        if (this.currentScanResultViewResolver) {
          this.currentScanResultViewResolver(result);
        }
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

      if (this.correctionView && result?._flowType) {
        if (shouldCorrectImage(result?._flowType)) {
          await this.handleCorrectImage();
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

  private async handleDone() {
    try {
      if (this.config?.onDone) {
        await this.config.onDone(this.resources.result);
      }

      // Resolve with current result
      if (this.currentScanResultViewResolver && this.resources.result) {
        this.currentScanResultViewResolver(this.resources.result);
      }

      // Clean up
      this.hideView();
      this.dispose();
    } catch (error) {
      console.error("Error in done handler:", error);
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
    const { controlIcons, onUpload } = this.config;

    // Check if share is possible
    const testImageBlob = new Blob(["mock-png-data"], { type: "image/png" });
    const testFile = new File([testImageBlob], "test.png", { type: "image/png" });
    const canShare = "share" in navigator && navigator.canShare({ files: [testFile] });

    const buttons: ControlButton[] = [
      {
        icon:
          controlIcons?.uploadBtn?.icon ||
          (onUpload ? DDS_ICONS.upload : canShare ? DDS_ICONS.share : DDS_ICONS.downloadPNG),
        text: controlIcons?.uploadBtn?.text || (onUpload ? "Upload" : canShare ? "Share" : "Download"),
        onClick: () => this.handleUploadAndShareBtn(),
      },
      {
        icon: controlIcons?.correctImageBtn?.icon || DDS_ICONS.normalize,
        text: controlIcons?.correctImageBtn?.text || "Correction",
        onClick: () => this.handleCorrectImage(),
        disabled: !this.correctionView,
      },
      {
        icon: controlIcons?.retakeBtn?.icon || DDS_ICONS.retake,
        text: controlIcons?.retakeBtn?.text || "Re-take",
        onClick: () => this.handleRetake(),
        disabled: !this.scannerView,
      },
      {
        icon: controlIcons?.doneBtn?.icon || DDS_ICONS.complete,
        text: controlIcons?.doneBtn?.text || "Done",
        onClick: () => this.handleDone(),
      },
    ];

    return createControls(buttons, controlIcons?.containerStyle);
  }

  async initialize(): Promise<void> {
    try {
      if (!this.resources.result) {
        throw Error("Captured image is missing. Please capture an image first!");
      }

      if (!this.config.container) {
        throw new Error("Please create a Scan Result View Container element");
      }

      // Create a wrapper div that preserves container dimensions
      const resultViewWrapper = document.createElement("div");
      Object.assign(resultViewWrapper.style, {
        display: "flex",
        width: "100%",
        height: "100%",
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
      resultViewWrapper.appendChild(scanResultViewImageContainer);

      // Set up controls
      const controlContainer = this.createControls();
      resultViewWrapper.appendChild(controlContainer);

      this.config.container.appendChild(resultViewWrapper);
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

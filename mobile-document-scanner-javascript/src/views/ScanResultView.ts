import { DocumentScannerConfig, SharedResources } from "../DocumentScanner";
import DocumentScannerView, { DocumentScanResult, EnumResultStatusCode } from "./DocumentScannerView";
import { NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { bindControlButton } from "./utils";
import DocumentNormalizerView from "./DocumentNormalizerView";
import { MWC_ICONS } from "./utils/icons";

interface ScanResultViewControls {
  exportBtn?: HTMLElement | string;
  normalizeBtn?: HTMLElement | string;
  retakeBtn?: HTMLElement | string;
  continueBtn?: HTMLElement | string;
  useDefaultControls?: boolean;
  containerStyle?: Partial<CSSStyleDeclaration>;
}

export interface ScanResultViewConfig {
  container: HTMLElement;
  controls: ScanResultViewControls;
  onContinue?: (result: DocumentScanResult) => Promise<void>;
  onExport?: (result: DocumentScanResult) => Promise<void>;
}

export default class ScanResultView {
  private container: HTMLElement;
  private controls: ScanResultViewControls;
  private currentScanResultViewResolver?: (result: DocumentScanResult) => void;

  constructor(
    private resources: SharedResources,
    private config: DocumentScannerConfig,
    private scanner: DocumentScannerView,
    private normalizerView: DocumentNormalizerView
  ) {}

  async launch(): Promise<DocumentScanResult> {
    try {
      this.config.scanResultViewConfig.container.textContent = "";
      await this.initialize();
      this.config.scanResultViewConfig.container.style.display = "flex";

      // Return promise that resolves when user clicks continue
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
      if (!result?.normalizedImageResult) {
        throw new Error("No image to export");
      }

      if (this.config.scanResultViewConfig.onExport) {
        await this.config.scanResultViewConfig.onExport(result);
      } else {
        // Convert to canvas and then to blob
        const blob = await (result.normalizedImageResult as NormalizedImageResultItem).toBlob("image/png");

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

  private async handleNormalize() {
    try {
      this.hidePreview();
      const result = await this.normalizerView.launch();

      // After normalization is complete, show preview again with updated image
      if (result.normalizedImageResult) {
        // Update the shared resources with new normalized result
        if (this.resources.onResultUpdated) {
          this.resources.onResultUpdated({
            ...this.resources.result,
            normalizedImageResult: result.normalizedImageResult,
          });
        }

        // Clear current preview and reinitialize with new image
        this.dispose(true); // true = preserve resolver
        await this.initialize();
        this.config.scanResultViewConfig.container.style.display = "flex";
      }
    } catch (error) {
      console.error("Error in normalize handler:", error);
      // Make sure to resolve with error if something goes wrong
      if (this.currentScanResultViewResolver) {
        this.currentScanResultViewResolver({
          status: {
            code: EnumResultStatusCode.FAILED,
            message: error?.message || error,
          },
        });
      }
      throw error;
    }
  }

  private async handleRetake() {
    try {
      this.hidePreview();
      const result = await this.scanner.launch();

      if (this.currentScanResultViewResolver && result?.status?.code === EnumResultStatusCode.FAILED) {
        this.currentScanResultViewResolver(result);

        return;
      }

      // Handle success case
      if (this.resources.onResultUpdated) {
        if (result?.status.code === EnumResultStatusCode.CANCELLED) {
          this.resources.onResultUpdated(this.resources.result);
        } else if (result?.status.code === EnumResultStatusCode.SUCCESS) {
          this.resources.onResultUpdated(result);
        }
      }

      this.dispose(true);
      await this.initialize();
      this.config.scanResultViewConfig.container.style.display = "flex";
    } catch (error) {
      console.error("Error in retake handler:", error);
      // Make sure to resolve with error if something goes wrong
      if (this.currentScanResultViewResolver) {
        this.currentScanResultViewResolver({
          status: {
            code: EnumResultStatusCode.FAILED,
            message: error?.message || error,
          },
        });
      }
      throw error;
    }
  }

  private async handleContinue() {
    try {
      if (this.config.scanResultViewConfig?.onContinue) {
        await this.config.scanResultViewConfig.onContinue(this.resources.result);
      }

      // Resolve with current result
      if (this.currentScanResultViewResolver && this.resources.result) {
        this.currentScanResultViewResolver(this.resources.result);
      }

      // Clean up
      this.dispose();
      this.hidePreview();
    } catch (error) {
      console.error("Error in continue handler:", error);
      // Make sure to resolve with error if something goes wrong
      if (this.currentScanResultViewResolver) {
        this.currentScanResultViewResolver({
          status: {
            code: EnumResultStatusCode.FAILED,
            message: error?.message || error,
          },
        });
      }
      throw error;
    }
  }

  private createDefaultControls(): HTMLElement {
    // Create style
    const styleSheet = document.createElement("style");
    styleSheet.textContent = DEFAULT_PREVIEW_CONTROLS_STYLE;
    document.head.appendChild(styleSheet);

    const container = document.createElement("div");
    container.className = "mwc-preview-controls";
    container.innerHTML = `
      ${DEFAULT_PREVIEW_CONTROLS_HTML}
    `;
    return container;
  }

  private setupPreviewControls() {
    const { container, controls } = this.config.scanResultViewConfig;

    try {
      if (!controls || controls.useDefaultControls) {
        const controlContainer = this.createDefaultControls();

        if (controls?.containerStyle) {
          Object.assign(controlContainer.style, controls.containerStyle);
        }

        container.appendChild(controlContainer);

        const children = controlContainer.children;
        if (children.length < 4) {
          throw new Error("Default controls container missing required elements");
        }

        this.controls = {
          exportBtn: bindControlButton(controls?.exportBtn, children[0] as HTMLElement, () => this.handleExport()),
          normalizeBtn: bindControlButton(
            controls?.normalizeBtn,
            children[1] as HTMLElement,
            async () => await this.handleNormalize()
          ),
          retakeBtn: bindControlButton(
            controls?.retakeBtn,
            children[2] as HTMLElement,
            async () => await this.handleRetake()
          ),
          continueBtn: bindControlButton(
            controls?.continueBtn,
            children[3] as HTMLElement,
            async () => await this.handleContinue()
          ),
        };
      } else {
        // Custom controls
        if (!controls.exportBtn || !controls.normalizeBtn || !controls.retakeBtn || !controls.continueBtn) {
          throw new Error("All custom buttons must be provided when not using default controls");
        }

        this.controls = {
          exportBtn: bindControlButton(controls.exportBtn, null, () => this.handleExport()),
          normalizeBtn: bindControlButton(controls.normalizeBtn, null, async () => await this.handleNormalize()),
          retakeBtn: bindControlButton(controls.retakeBtn, null, async () => await this.handleRetake()),
          continueBtn: bindControlButton(controls.continueBtn, null, async () => await this.handleContinue()),
        };
      }
    } catch (error) {
      console.error("Error setting up preview controls:", error);
      throw new Error(`Failed to setup preview controls: ${error.message}`);
    }
  }

  async initialize(): Promise<void> {
    try {
      if (!this.resources.result) {
        throw Error("Captured image is missing. Please capture an image first!");
      }

      if (!this.config.scanResultViewConfig.container) {
        throw new Error("Please create a Preview Container element");
      }

      // Add basic styling to container
      Object.assign(this.config.scanResultViewConfig.container.style, {
        display: "flex",
        width: "100%",
        backgroundColor: "#575757",
        fontSize: "12px",
        flexDirection: "column",
        alignItems: "center",
      });

      // Create and add preview image container
      const previewImageContainer = document.createElement("div");
      Object.assign(previewImageContainer.style, {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "0",
      });

      // Add preview image
      const previewImage = (this.resources.result.normalizedImageResult as NormalizedImageResultItem)?.toCanvas();
      Object.assign(previewImage.style, {
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
      });

      previewImageContainer.appendChild(previewImage);
      this.config.scanResultViewConfig.container.appendChild(previewImageContainer);

      // Set up controls
      this.setupPreviewControls();
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
    }
  }

  hidePreview(): void {
    this.config.scanResultViewConfig.container.style.display = "none";
  }

  dispose(preserveResolver: boolean = false): void {
    // Clean up the container
    this.config.scanResultViewConfig.container.textContent = "";

    // Clear resolver only if not preserving
    if (!preserveResolver) {
      this.currentScanResultViewResolver = undefined;
    }
  }
}

const DEFAULT_PREVIEW_CONTROLS_STYLE = `
.mwc-preview-controls {
  display: flex;
  height: 6rem;
  background-color: #323234;
  align-items: center;
  font-size: 12px;
  font-family: Verdana;
  color: white;
  width: 100%;
}

.mwc-preview-control-btn {
  background-color: #323234;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  width: 100%;
  gap: 0.5rem;
  text-align: center;
  user-select: none;
}

.mwc-preview-control-btn div:last-child {
  padding-bottom: 0.5rem;
}

.mwc-preview-control-btn.continue {
  background-color: #000000;
  color: #fe8e14;
}

.mwc-preview-control-icon svg {
  padding-top: 0.5rem;
  width: 24px;
  height: 24px;
  fill: #fe8e14;
}
`;

const DEFAULT_PREVIEW_CONTROLS_HTML = `
  <div class="mwc-preview-control-btn">
    <div class="mwc-preview-control-icon">${MWC_ICONS.export}</div>
    <div>Export Image</div>
  </div>
  <div class="mwc-preview-control-btn">
    <div class="mwc-preview-control-icon">${MWC_ICONS.normalize}</div>
    <div>Normalize</div>
  </div>
  <div class="mwc-preview-control-btn">
    <div class="mwc-preview-control-icon">${MWC_ICONS.retake}</div>
    <div>Re-take</div>
  </div>
  <div class="mwc-preview-control-btn continue">
    <div class="mwc-preview-control-icon">${MWC_ICONS.continue}</div>
    <div>Continue</div>
  </div>
`;

import { MobileDocumentScannerConfig, SharedResources } from "../core/MobileDocumentScanner";
import DocumentScannerView, { DocumentScanResult } from "./DocumentScannerView";
import { NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { bindControlButton } from "../util";
import DocumentNormalizerView from "./DocumentNormalizerView";

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
    private config: MobileDocumentScannerConfig,
    private scanner: DocumentScannerView,
    private normalizerView: DocumentNormalizerView
  ) {}

  async showPreview(): Promise<DocumentScanResult> {
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
      const result = await this.normalizerView.showEditor();

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
          success: false,
          error: error as Error,
        });
      }
      throw error;
    }
  }

  private async handleRetake() {
    try {
      this.hidePreview();
      const result = await this.scanner.scanImage();

      // After retake is complete, show preview again with updated image
      if (result) {
        // Update shared resources with new scan result
        if (this.resources.onResultUpdated) {
          this.resources.onResultUpdated(result);
        }

        // Clear current preview and reinitialize with new image
        this.dispose(true); // true = preserve resolver
        await this.initialize();
        this.config.scanResultViewConfig.container.style.display = "flex";
      }
    } catch (error) {
      console.error("Error in retake handler:", error);
      // Make sure to resolve with error if something goes wrong
      if (this.currentScanResultViewResolver) {
        this.currentScanResultViewResolver({
          success: false,
          error: error as Error,
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
          success: false,
          error: error as Error,
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

const ICONS = {
  exportImage: `<svg id="export-image" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="28" height="24" viewBox="0 0 28 24">
  <defs>
    <clipPath id="clip-path">
      <rect id="Rectangle_2771" data-name="Rectangle 2771" width="28" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_576" data-name="Group 576" clip-path="url(#clip-path)">
    <path id="Path_1508" data-name="Path 1508" d="M23.043,18.684a.545.545,0,0,0-.546.546v3.679H1.091V5.806h4.9a.546.546,0,1,0,0-1.091H.545A.545.545,0,0,0,0,5.261V23.454A.545.545,0,0,0,.545,24h22.5a.545.545,0,0,0,.545-.546V19.23a.545.545,0,0,0-.545-.546" fill="#fff"/>
    <path id="Path_1509" data-name="Path 1509" d="M27.852,8.681,19.864.173a.544.544,0,0,0-.942.372V4.957C5.88,6.261,5.517,17.278,5.514,17.39a.546.546,0,0,0,.363.524.523.523,0,0,0,.183.032.543.543,0,0,0,.428-.208c5.011-6.366,10.948-5.778,12.538-5.481v4.21a.547.547,0,0,0,.329.5.552.552,0,0,0,.59-.1l7.883-7.414a.543.543,0,0,0,.024-.77M20.117,15.2V11.819a.547.547,0,0,0-.4-.526c-.071-.019-6.923-1.828-12.87,4.37C7.517,12.646,10.037,6.747,19.51,6a.546.546,0,0,0,.5-.544V1.924L26.684,9.03Z" fill="#fff"/>
  </g>
</svg>
`,
  normalize: `<svg id="normalize" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="19" height="24" viewBox="0 0 19 24">
  <defs>
    <clipPath id="clip-path">
      <rect id="Rectangle_2772" data-name="Rectangle 2772" width="19" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_578" data-name="Group 578" clip-path="url(#clip-path)">
    <path id="Path_1510" data-name="Path 1510" d="M3.483,18.987a.521.521,0,0,0,.52.522H14.9a.522.522,0,0,0,0-1.044H4a.521.521,0,0,0-.52.522" fill="#fff"/>
    <path id="Path_1511" data-name="Path 1511" d="M4,13.52h8.75a.522.522,0,0,0,0-1.043H4A.522.522,0,0,0,4,13.52" fill="#fff"/>
    <path id="Path_1512" data-name="Path 1512" d="M4,10.526h7.448a.522.522,0,0,0,0-1.043H4a.522.522,0,0,0,0,1.043" fill="#fff"/>
    <path id="Path_1513" data-name="Path 1513" d="M4,7.532H9.927a.522.522,0,0,0,0-1.043H4A.522.522,0,0,0,4,7.532" fill="#fff"/>
    <path id="Path_1514" data-name="Path 1514" d="M4.005,15.471H4a.522.522,0,0,0,0,1.043l9.79.039h0a.522.522,0,0,0,0-1.043Z" fill="#fff"/>
    <path id="Path_1515" data-name="Path 1515" d="M9.33,1.044H11.5A.522.522,0,0,0,11.5,0H9.33a.522.522,0,0,0,0,1.043" fill="#fff"/>
    <path id="Path_1516" data-name="Path 1516" d="M13.679,1.044h2.174a.522.522,0,0,0,0-1.043H13.679a.522.522,0,0,0,0,1.043" fill="#fff"/>
    <path id="Path_1517" data-name="Path 1517" d="M18.48,17.548a.516.516,0,0,0-.367.152c-.572-3.035-1.506-7.61-3.012-14.546a.524.524,0,0,0-.139-.256,1.432,1.432,0,0,0-.972-.437L6.806,1.044h.349A.522.522,0,0,0,7.155,0H4.981A.522.522,0,0,0,4.46.522a.426.426,0,0,0,.013.062L3.291.351A.516.516,0,0,0,2.805,0H1.765a.515.515,0,0,0-.124.025L1.515,0A1.52,1.52,0,0,0,0,1.52V22.481A1.519,1.519,0,0,0,1.515,24H18.432a.142.142,0,0,0,.022,0,.238.238,0,0,0,.026,0,.52.52,0,0,0,.52-.521V22.435a.522.522,0,0,0-.152-.369c-.047-.358-.111-.8-.2-1.329A.516.516,0,0,0,19,20.25V18.069a.519.519,0,0,0-.52-.521M1.515,22.957a.475.475,0,0,1-.474-.476V1.52a.491.491,0,0,1,.373-.486L13.89,3.495a.468.468,0,0,1,.233.061c1.449,6.682,3.613,17.143,3.823,19.4Z" fill="#fff"/>
    <path id="Path_1518" data-name="Path 1518" d="M18.48,4.461a.52.52,0,0,0-.52.522v2.18a.52.52,0,1,0,1.04,0V4.983a.52.52,0,0,0-.52-.522" fill="#fff"/>
    <path id="Path_1519" data-name="Path 1519" d="M18.29.366a.521.521,0,0,0-.638.824.827.827,0,0,1,.308.653V2.8A.52.52,0,1,0,19,2.8V1.843A1.877,1.877,0,0,0,18.29.366" fill="#fff"/>
    <path id="Path_1520" data-name="Path 1520" d="M18.48,13.185a.52.52,0,0,0-.52.522v2.181a.52.52,0,1,0,1.04,0V13.707a.52.52,0,0,0-.52-.522" fill="#fff"/>
    <path id="Path_1521" data-name="Path 1521" d="M18.48,8.823a.52.52,0,0,0-.52.522v2.181a.52.52,0,1,0,1.04,0V9.345a.52.52,0,0,0-.52-.522" fill="#fff"/>
  </g>
</svg>
`,
  retake: `<svg id="capture-another" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="28.761" height="23" viewBox="0 0 28.761 23">
  <defs>
    <clipPath id="clip-path">
      <rect id="Rectangle_2777" data-name="Rectangle 2777" width="28.761" height="23" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_589" data-name="Group 589" clip-path="url(#clip-path)">
    <path id="Path_1544" data-name="Path 1544" d="M25.877,3.639H21.663a.7.7,0,0,1-.575-.288l-.575-.764C19.264.961,18.59,0,17.44,0H11.4C10.151,0,9.486.961,8.336,2.588l-.674.764a.7.7,0,0,1-.575.288H2.875C.476,3.639,0,5.077,0,6.227v13.9C0,22.041,1.051,23,2.974,23H25.787c1.914,0,2.974-.961,2.974-2.776v-14c-.008-1.147-.485-2.585-2.884-2.585m-.1,18.411H2.974c-1.339,0-2.013-.575-2.013-1.824v-14c0-.863.189-1.626,1.914-1.626H7.188a1.666,1.666,0,0,0,1.339-.674L9.1,3.162c1.15-1.626,1.536-2.2,2.2-2.2H17.34c.674,0,1.15.575,2.3,2.2l.575.764a1.562,1.562,0,0,0,1.339.674h4.313c1.725,0,1.914.764,1.914,1.626v14h.009c0,1.249-.673,1.824-2.012,1.824" fill="#fff"/>
    <path id="Path_1545" data-name="Path 1545" d="M14.38,6.194a6.5,6.5,0,1,0,6.5,6.5,6.508,6.508,0,0,0-6.5-6.5m0,12a5.5,5.5,0,1,1,5.5-5.5,5.507,5.507,0,0,1-5.5,5.5" fill="#fff"/>
    <path id="Path_1546" data-name="Path 1546" d="M17.381,12.194h-2.5v-2.5a.5.5,0,0,0-1,0v2.5h-2.5a.5.5,0,0,0,0,1h2.5v2.5a.5.5,0,1,0,1,0v-2.5h2.5a.5.5,0,0,0,0-1" fill="#fff"/>
  </g>
</svg>

`,
  finish: `<svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fe8e14"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="24"
              height="24"
              stroke-width="1"
            >
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path>
              <path d="M9 12l2 2l4 -4"></path>
            </svg>`,
};

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
  border: 1px solid #575757;
  text-align: center;
  user-select: none;
}

.mwc-preview-control-btn div:last-child {
  padding-bottom: 0.5rem;
}

.mwc-preview-control-btn.finish {
  background-color: #000000;
  color: #fe8e14;
}

.mwc-preview-control-icon svg {
  padding-top: 0.5rem;
  width: max(3vmin, 24px);
  height: max(3vmin, 24px);
}
`;

const DEFAULT_PREVIEW_CONTROLS_HTML = `
  <div class="mwc-preview-control-btn">
    <div class="mwc-preview-control-icon">${ICONS.exportImage}</div>
    <div>Export Image</div>
  </div>
  <div class="mwc-preview-control-btn">
    <div class="mwc-preview-control-icon">${ICONS.normalize}</div>
    <div>Normalize</div>
  </div>
  <div class="mwc-preview-control-btn">
    <div class="mwc-preview-control-icon">${ICONS.retake}</div>
    <div>Re-take</div>
  </div>
  <div class="mwc-preview-control-btn finish">
    <div class="mwc-preview-control-icon">${ICONS.finish}</div>
    <div>Continue</div>
  </div>
`;

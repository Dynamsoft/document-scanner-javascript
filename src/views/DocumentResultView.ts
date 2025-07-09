import { SharedResources } from "../DocumentScanner";
import DocumentScannerView from "./DocumentScannerView";
import { NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { createControls, createStyle, getElement, shouldCorrectImage } from "./utils";
import DocumentCorrectionView from "./DocumentCorrectionView";
import { DDS_ICONS } from "./utils/icons";
import { DocumentResult, EnumFlowType, EnumResultStatus, ToolbarButton, ToolbarButtonConfig } from "./utils/types";
import { ImageFilterHandler, BlackwhiteFilter, InvertFilter, GrayscaleFilter, SepiaFilter, GaussianBlurFilter } from 'image-filter-js'; // Third party image filter support

export interface DocumentResultViewToolbarButtonsConfig {
  retake?: ToolbarButtonConfig;
  correct?: ToolbarButtonConfig;
  share?: ToolbarButtonConfig;
  upload?: ToolbarButtonConfig;
  done?: ToolbarButtonConfig;

  // Rotation and Filtering customization
  rotate?: ToolbarButtonConfig;
  filter?: ToolbarButtonConfig;
}

type DocumentResultViewToolbarButtons = Record<keyof DocumentResultViewToolbarButtonsConfig, HTMLElement>;

type ImageFilters = {
  blackWhiteFilter: BlackwhiteFilter;
  invertFilter: InvertFilter;
  grayscaleFilter: GrayscaleFilter;
  sepiaFilter: SepiaFilter;
  gaussianBlurFilter: GaussianBlurFilter;
};

export interface DocumentResultViewConfig {
  container?: HTMLElement | string;
  toolbarButtonsConfig?: DocumentResultViewToolbarButtonsConfig;

  onDone?: (result: DocumentResult) => Promise<void>;
  onUpload?: (result: DocumentResult) => Promise<void>;
}

export default class DocumentResultView {
  private currentScanResultViewResolver?: (result: DocumentResult) => void;
  private toolbarBtn: DocumentResultViewToolbarButtons = {
    retake: null,
    correct: null,
    share: null,
    upload: null,
    done: null,

    // Rotation and Filtering customization
    rotate: null,
    filter: null,
  };

  constructor(
    private resources: SharedResources,
    private config: DocumentResultViewConfig,
    private scannerView: DocumentScannerView,
    private correctionView: DocumentCorrectionView,
    // Custom image filters
    private filters: {
      blackWhiteFilter: BlackwhiteFilter,
      invertFilter: InvertFilter,
      grayscaleFilter: GrayscaleFilter,
      sepiaFilter: SepiaFilter,
      gaussianBlurFilter: GaussianBlurFilter,
    }
  ) {}

  async launch(): Promise<DocumentResult> {
    try {
      getElement(this.config.container).textContent = "";
      await this.initialize();
      getElement(this.config.container).style.display = "flex";

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

  private async handleUploadAndShareBtn(mode?: "share" | "upload") {
    try {
      const { result } = this.resources;
      if (!result?.correctedImageResult) {
        throw new Error("No image to upload");
      }

      if (mode === "upload" && this.config?.onUpload) {
        await this.config.onUpload(result);
      } else if (mode === "share") {
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
        getElement(this.config.container).style.display = "flex";
      }
    } catch (error) {
      console.error("DocumentResultView - Handle Correction View Error:", error);
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
      getElement(this.config.container).style.display = "flex";
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
    const { toolbarButtonsConfig, onUpload } = this.config;

    // Check if share is possible
    const testImageBlob = new Blob(["mock-png-data"], { type: "image/png" });
    const testFile = new File([testImageBlob], "test.png", { type: "image/png" });
    const canShare = "share" in navigator && navigator.canShare({ files: [testFile] });

    const buttons: ToolbarButton[] = [
      {
        id: `dds-scanResult-retake`,
        icon: toolbarButtonsConfig?.retake?.icon || DDS_ICONS.retake,
        label: toolbarButtonsConfig?.retake?.label || "Re-take",
        onClick: () => this.handleRetake(),
        className: `${toolbarButtonsConfig?.retake?.className || ""}`,
        isHidden: toolbarButtonsConfig?.retake?.isHidden || false,
        isDisabled: !this.scannerView,
      },
      // Custom rotate button
      {
        id: `dds-scanResult-rotate`,
        icon: toolbarButtonsConfig?.rotate.icon,
        label: toolbarButtonsConfig?.rotate?.label || "Rotate",
        onClick: () => this.handleRotate(),
        className: `${toolbarButtonsConfig?.rotate?.className || ""}`,
        isHidden: toolbarButtonsConfig?.rotate?.isHidden || false,
        isDisabled: !this.scannerView,
      },
      // Custom filter button
      {
        id: `dds-scanResult-filter`,
        icon: toolbarButtonsConfig?.filter?.icon,
        label: toolbarButtonsConfig?.filter?.label || "Filter",
        onClick: () => this.handleFilter(),
        className: `${toolbarButtonsConfig?.filter?.className || ""}`,
        isHidden: toolbarButtonsConfig?.filter?.isHidden || false,
        isDisabled: !this.scannerView,
      },
      {
        id: `dds-scanResult-correct`,
        icon: toolbarButtonsConfig?.correct?.icon || DDS_ICONS.normalize,
        label: toolbarButtonsConfig?.correct?.label || "Correction",
        onClick: () => this.handleCorrectImage(),
        className: `${toolbarButtonsConfig?.correct?.className || ""}`,
        isHidden: toolbarButtonsConfig?.correct?.isHidden || false,
        isDisabled: !this.correctionView,
      },
      {
        id: `dds-scanResult-share`,
        icon: toolbarButtonsConfig?.share?.icon || (canShare ? DDS_ICONS.share : DDS_ICONS.downloadPNG),
        label: toolbarButtonsConfig?.share?.label || (canShare ? "Share" : "Download"),
        className: `${toolbarButtonsConfig?.share?.className || ""}`,
        isHidden: toolbarButtonsConfig?.share?.isHidden || false,
        onClick: () => this.handleUploadAndShareBtn("share"),
      },
      {
        id: `dds-scanResult-upload`,
        icon: toolbarButtonsConfig?.upload?.icon || DDS_ICONS.upload,
        label: toolbarButtonsConfig?.upload?.label || "Upload",
        className: `${toolbarButtonsConfig?.upload?.className || ""}`,
        isHidden: !onUpload ? true : toolbarButtonsConfig?.upload?.isHidden || false,
        isDisabled: !onUpload,
        onClick: () => this.handleUploadAndShareBtn("upload"),
      },
      {
        id: `dds-scanResult-done`,
        icon: toolbarButtonsConfig?.done?.icon || DDS_ICONS.complete,
        label: toolbarButtonsConfig?.done?.label || "Done",
        className: `${toolbarButtonsConfig?.done?.className || ""}`,
        isHidden: toolbarButtonsConfig?.done?.isHidden || false,
        onClick: () => this.handleDone(),
      },
    ];

    return createControls(buttons);
  }

  // Custom image filter menu
  private handleFilter(): void {
    const filterBtn = this.toolbarBtn.filter;

    // Check if menu already exists
    let menu = filterBtn.querySelector(".dds-filter-menu");

    if (!menu) {
      createStyle("dds-filter-dropdown-style", FILTER_DROPDOWN_STYLE);

      menu = document.createElement("div");
      menu.className = "dds-filter-menu";
      menu.innerHTML = `
        <button class="dds-filter-option black-white">
        Black & White
          <span>Capture</span>
        </button>
        <button class="dds-filter-option invert">
        Invert Colors
          <span>Import</span>
        </button>
        <button class="dds-filter-option grayscale">
        Grayscale
          <span>Capture</span>
        </button>
        <button class="dds-filter-option sepia">
        Sepia
          <span>Import</span>
        </button>
        <button class="dds-filter-option gaussian-blur">
        Gaussian Blur
          <span>Import</span>
        </button>
        // Can add icon entry by adding icon at /src/views/utils/icons.ts and inserting the following:
        // <button class="dds-filter-option FilterWithIcon">
        // \${DDS_ICONS.FilterIcon}
        //   <span>Import</span>
        // </button>
      `;

      // Get scanned image as blob
      const blob = new Blob([this.resources.result.originalImageResult.bytes], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.src = url;

      // Add click handlers
      const blackWhiteBtn = menu.querySelector(".black-white");
      blackWhiteBtn.addEventListener("click", async (e: any) => {
        if (menu.classList.contains("show")) {
          menu.classList.remove("show");
        }
        this.filters.blackWhiteFilter?.process(img);
        e.stopPropagation();
      });

      const invertBtn = menu.querySelector(".invert");
      blackWhiteBtn.addEventListener("click", async (e: any) => {
        if (menu.classList.contains("show")) {
          menu.classList.remove("show");
        }
        this.filters.invertFilter?.process(img);
        e.stopPropagation();
      });

      const grayscaleBtn = menu.querySelector(".grayscale");
      blackWhiteBtn.addEventListener("click", async (e: any) => {
        if (menu.classList.contains("show")) {
          menu.classList.remove("show");
        }
        this.filters.grayscaleFilter?.process(img);
        e.stopPropagation();
      });

      const sepiaBtn = menu.querySelector(".sepia");
      blackWhiteBtn.addEventListener("click", async (e: any) => {
        if (menu.classList.contains("show")) {
          menu.classList.remove("show");
        }
        this.filters.sepiaFilter?.process(img);
        e.stopPropagation();
      });

      const gaussianBlurBtn = menu.querySelector(".gaussian-blur");
      blackWhiteBtn.addEventListener("click", async (e: any) => {
        if (menu.classList.contains("show")) {
          menu.classList.remove("show");
        }
        this.filters.gaussianBlurFilter?.process(img);
        e.stopPropagation();
      });

      // Add click outside handler
      document.addEventListener("click", (e) => {
        if (!filterBtn.contains(e.target as Node) && menu.classList.contains("show")) {
          menu.classList.remove("show");
        }
      });

      // Add menu to button
      filterBtn.querySelector(".icon").prepend(menu);
      menu.classList.toggle("show");
    } else {
      // Toggle menu visibility
      menu.classList.toggle("show");
    }
  }

  private handleRotate() {
    let png = (this.resources.result?.correctedImageResult as NormalizedImageResultItem).toCanvas();

  }

  async initialize(): Promise<void> {
    try {
      if (!this.resources.result) {
        throw Error("Captured image is missing. Please capture an image first!");
      }

      if (!this.config.container) {
        throw new Error("Please create a Scan Result View Container element");
      }

      createStyle("dds-result-view-style", DEFAULT_RESULT_VIEW_CSS);

      // Create a wrapper div that preserves container dimensions
      const resultViewWrapper = document.createElement("div");
      resultViewWrapper.className = "dds-result-view-container";

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

      getElement(this.config.container).appendChild(resultViewWrapper);

      // Hide retake button on flow.STATIC_FILE
      if (this.resources.result._flowType === EnumFlowType.STATIC_FILE) {
        const retakeBtn = document.querySelector("#dds-scanResult-retake") as HTMLElement;
        retakeBtn.style.display = "none";
      }
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
    }
  }

  hideView(): void {
    getElement(this.config.container).style.display = "none";
  }

  dispose(preserveResolver: boolean = false): void {
    // Clean up the container
    getElement(this.config.container).textContent = "";

    // Clear resolver only if not preserving
    if (!preserveResolver) {
      this.currentScanResultViewResolver = undefined;
    }
  }
}

const DEFAULT_RESULT_VIEW_CSS = `
  .dds-result-view-container {
    display: flex;
    width: 100%;
    height: 100%;
    background-color:#575757;
    font-size: 12px;
    flex-direction: column;
    align-items: center;
  }

  @media (orientation: landscape) and (max-width: 1024px) {
    .dds-result-view-container {
      flex-direction: row;
    }
  }
`;

const FILTER_DROPDOWN_STYLE = ` /* Filter button customization */
  .dds-view-controls-btn {
    position: relative; /* Add this to make the absolute positioning work relative to button */
  }

  .dds-filter-menu {
    position: absolute;
    bottom: 6rem;
    transform: translate(-50%);
    left: 50%;
    right: 50%;
    width: max-content;
    background-color: #323234;
    border-radius: 0.5rem;
    overflow: visible;
    display: none;
    margin-bottom: 0.5px; /* Add some spacing between menu and button */
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2); /* Add shadow for better visibility */
  }

  .dds-filter-menu::after {
    content: '';
    position: absolute;
    bottom: -8px; /* Triangle */
    left: 50%;
    right: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #323234; /* Same color as menu background */
  }


  .dds-filter-menu.show {
    display: block;
  }

  .dds-filter-option {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    color: white;
    background: none;
    border: none;
    cursor: pointer;
    font-family: Verdana;
    font-size: 14px;
    width: 100%;
    box-sizing: border-box;
  }

  .dds-filter-option svg {
    width: 24px;
    height: 24px;
  }

  .dds-filter-option span {
    cursor: pointer;
  }

  .dds-filter-option:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .dds-filter-option:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

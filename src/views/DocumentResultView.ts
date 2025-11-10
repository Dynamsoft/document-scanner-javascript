import { SharedResources } from "../DocumentScanner";
import DocumentScannerView from "./DocumentScannerView";
import { DeskewedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { createControls, createStyle, getElement } from "./utils";
import DocumentCorrectionView from "./DocumentCorrectionView";
import { DDS_ICONS } from "./utils/icons";
import { DocumentResult, EnumFlowType, EnumResultStatus, ToolbarButton, ToolbarButtonConfig } from "./utils/types";

export interface DocumentResultViewToolbarButtonsConfig {
  retake?: ToolbarButtonConfig;
  correct?: ToolbarButtonConfig;
  share?: ToolbarButtonConfig;
  upload?: ToolbarButtonConfig;
  done?: ToolbarButtonConfig;
}

/**
 * The `DocumentResultViewConfig` interface passes settings to the {@link DocumentScanner} constructor through the {@link DocumentScannerConfig} to apply UI and business logic customizations for the {@link DocumentResultView}.
 * 
 * @remarks
 * Only rare and edge-case scenarios require editing MDS source code. MDS uses sane default values for all omitted properties.
 * 
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
 *     resultViewConfig: {
 *         onDone: async (result) =>
 *         {
 *             const canvas = result.correctedImageResult.toCanvas();
 *             resultContainer.appendChild(canvas);
 *         }
 *     }
 * });
 * ```
 * 
 * @public
 */
export interface DocumentResultViewConfig {
  /**
   * The HTML container element or selector for the {@link DocumentResultView} UI.
   * 
   * @public
   */
  container?: HTMLElement | string;
  /**
   * Configures the appearance and labels of the buttons for the {@link DocumentResultView} UI.
   * 
   * @see {@link DocumentResultViewToolbarButtonsConfig}
   * 
   * @public
   */
  toolbarButtonsConfig?: DocumentResultViewToolbarButtonsConfig;
  /**
   * Handler called when the user clicks the "Done" button.
   * 
   * @param result result of the scan, including the original image, corrected image, detected boundaries, and scan status
   * @see {@link DocumentResult}
   * 
   * @public
   */
  onDone?: (result: DocumentResult) => Promise<void>;
  /**
   * Handler called when the user clicks the "Upload" button.
   * 
   * @param result result of the scan, including the original image, corrected image, detected boundaries, and scan status
   * @see {@link DocumentResult}
   * 
   * @public
   */
  onUpload?: (result: DocumentResult) => Promise<void>;
}

export default class DocumentResultView {
  private currentScanResultViewResolver?: (result: DocumentResult) => void;

  constructor(
    private resources: SharedResources,
    private config: DocumentResultViewConfig,
    private scannerView: DocumentScannerView,
    private correctionView: DocumentCorrectionView
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
      const blob = await (result.correctedImageResult as DeskewedImageResultItem).toBlob("image/png");
      if (!blob) {
        throw new Error("Failed to convert image to blob");
      }

      const file = new File([blob], `document-${Date.now()}.png`, {
        type: blob.type,
      });

      // Detect mobile devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Try Web Share API only on mobile devices
      if (isMobile && navigator.share) {
        // Check if file sharing is supported
        const canShareFiles = navigator.canShare?.({ files: [file] }) ?? false;

        if (canShareFiles) {
          try {
            await navigator.share({
              files: [file],
              title: "Dynamsoft Document Scanner Shared Image",
            });
            return true;
          } catch (shareError: any) {
            // Handle different error types per MDN documentation
            if (shareError.name === "AbortError") {
              // User cancelled the share dialog - this is normal, don't show error
              return true;
            } else if (shareError.name === "NotAllowedError") {
              // Permission denied or no user activation - fall back to download
              console.log("Share permission denied, falling back to download");
            } else if (shareError.name === "TypeError") {
              // Invalid data or unsupported file type - fall back to download
              console.log("File type not supported for sharing, falling back to download");
            } else if (shareError.name === "DataError") {
              // Issue with share target - fall back to download
              console.log("Share target error, falling back to download");
            } else {
              // Unknown error - log and fall back
              console.warn("Share failed with unexpected error:", shareError);
            }
            // Fall through to download fallback
          }
        }
      }

      // Fallback: download the file (always used on desktop)
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (ex: any) {
      // Unexpected error in the overall process
      let errMsg = ex?.message || ex;
      console.error("Error in share/download process:", errMsg);
      alert(`Error processing image: ${errMsg}`);
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
        this.resources.onResultUpdated?.({
          ...this.resources.result,
          correctedImageResult: result.correctedImageResult,
        });

        // Clear current scan result view and reinitialize with new image
        this.dispose(true); // true = preserve resolver
        await this.initialize();
        getElement(this.config.container).style.display = "flex";
      }
    } catch (error) {
      console.error("DocumentResultView - Handle Correction View Error:", error);
      // Make sure to resolve with error if something goes wrong
      this.currentScanResultViewResolver?.({
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: error?.message || error,
        },
      });
      throw error;
    }
  }

  private async handleRetake() {
    try {
      if (!this.scannerView) {
        console.error("Scanner View not initialized");
        return;
      }

      this.hideView();

      // Show scanner view
      if (this.scannerView) {
        getElement((this.scannerView as any).config.container).style.display = "flex";
      }

      // Wait for new scan
      const result = await this.scannerView.launch();

      // Handle cancelled or failed results - resolve and exit
      if (result?.status?.code === EnumResultStatus.RS_CANCELLED || result?.status?.code === EnumResultStatus.RS_FAILED) {
        this.currentScanResultViewResolver?.(result);
        return;
      }

      // Handle success case - update resources and re-enter result flow
      if (result?.status.code === EnumResultStatus.RS_SUCCESS) {
        this.resources.onResultUpdated?.(result);

        // Stop capturing before hiding scanner view
        if (this.scannerView) {
          this.scannerView.stopCapturing();
        }

        // Hide scanner view
        if (this.scannerView) {
          getElement((this.scannerView as any).config.container).style.display = "none";
        }

        // Route through correction view if it exists (always go through correction during retake when it's configured)
        if (this.correctionView) {
          // Hide result view temporarily
          this.dispose(true); // preserve resolver

          // Show and launch correction view
          const correctionResult = await this.correctionView.launch();

          // Handle cancelled/failed from correction view
          if (correctionResult?.status?.code === EnumResultStatus.RS_CANCELLED || correctionResult?.status?.code === EnumResultStatus.RS_FAILED) {
            this.currentScanResultViewResolver?.(correctionResult);
            return;
          }

          // After correction completes successfully, resources are already updated by correction view's confirmCorrection
        }

        // Refresh the result view with new data
        this.dispose(true); // preserve resolver
        await this.initialize();
        getElement(this.config.container).style.display = "flex";
      }
    } catch (error) {
      console.error("Error in retake handler:", error);
      // Make sure to resolve with error if something goes wrong
      this.currentScanResultViewResolver?.({
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: error?.message || error,
        },
      });
      throw error;
    }
  }

  private async handleDone() {
    try {
      await this.config?.onDone?.(this.resources.result);

      // Resolve with current result
      this.currentScanResultViewResolver?.(this.resources.result);

      // Clean up
      this.hideView();
      this.dispose();
    } catch (error) {
      console.error("Error in done handler:", error);
      // Make sure to resolve with error if something goes wrong
      this.currentScanResultViewResolver?.({
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: error?.message || error,
        },
      });
      throw error;
    }
  }

  private createControls(): HTMLElement {
    const { toolbarButtonsConfig, onUpload } = this.config;

    // Helper to detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Check if share is possible - only enable on mobile devices
    const testImageBlob = new Blob(["mock-png-data"], { type: "image/png" });
    const testFile = new File([testImageBlob], "test.png", { type: "image/png" });
    const canShare = isMobile && "share" in navigator && navigator.canShare({ files: [testFile] });

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
        label: toolbarButtonsConfig?.done?.label || (this.resources.enableContinuousScanning ? "Keep Scan" : "Done"),
        className: `${toolbarButtonsConfig?.done?.className || ""}`,
        isHidden: toolbarButtonsConfig?.done?.isHidden || false,
        onClick: () => this.handleDone(),
      },
    ];

    return createControls(buttons);
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
      const scanResultImg = (this.resources.result.correctedImageResult as DeskewedImageResultItem)?.toCanvas();
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

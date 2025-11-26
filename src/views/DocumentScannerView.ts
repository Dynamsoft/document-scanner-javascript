import {
  EnumCapturedResultItemType,
  EnumImagePixelFormat,
  OriginalImageResultItem,
  Quadrilateral,
  CapturedResultReceiver,
  CapturedResult,
  DetectedQuadResultItem,
  DeskewedImageResultItem,
  EnhancedImageResultItem,
  MultiFrameResultCrossFilter,
  EnumImageColourMode,
} from "dynamsoft-capture-vision-bundle";
import { SharedResources } from "../DocumentScanner";
import {
  DEFAULT_TEMPLATE_NAMES,
  DocumentResult,
  EnumFlowType,
  EnumResultStatus,
  UtilizedTemplateNames,
} from "./utils/types";
import { DEFAULT_LOADING_SCREEN_STYLE, showLoadingScreen } from "./utils/LoadingScreen";
import { createStyle, findClosestResolutionLevel, getElement, isEmptyObject } from "./utils";

const DEFAULT_MIN_VERIFIED_FRAMES_FOR_CAPTURE = 2;

/**
 * Set the scan region within the {@link DocumentScannerView} viewfinder for document scanning from the {@link DocumentScannerViewConfig}.
 *
 * @remarks
 * MDS determines the scan region with the following steps:
 * 1. Use {@link ScanRegion.ratio} to set the height-to-width ratio of the rectangular scanning region, then scale the rectangle up to fit within the viewfinder.
 * 2. Translate the rectangle upward by the number of pixels specified by {@link ScanRegion.regionBottomMargin}.
 * 3. Create a visual border for the scanning region boundary on the viewfinder with a given stroke width in pixels and stroke color.
 *
 * @example
 * Create a scan region with a height-to-width ratio of 3:2, translated upwards by 20 pixels, with a green, 3 pixel-wide border in the viewfinder:
 *
 * ```javascript
 * scanRegion {
 *   ratio: {
 *     width: 2,
 *     height: 3,
 *   },
 *   regionBottomMargin: 20,
 *   style: {
 *     strokeWidth: 3,
 *     strokeColor: "green",
 *   },
 * }
 * ```
 *
 * @public
 */
export interface ScanRegion {
  /**
   * The aspect ratio of the rectangular scan region.
   *
   * @public
   */
  ratio: {
    /**
     * The width of the rectangular scan region.
     */
    width: number;
    /**
     * The height of the rectangular scan region.
     *
     * @public
     */
    height: number;
  };
  /**
   * Bottom margin below the scan region measured in pixels.
   *
   * @public
   */
  regionBottomMargin: number;
  /**
   * The styling for the scan region outline in the viewfinder.
   *
   * @public
   */
  style: {
    /**
     * The pixel width of the outline of the scan region.
     *
     * @public
     */
    strokeWidth: number;
    /**
     * The color of the outline of the scan region.
     *
     * @public
     */
    strokeColor: string;
  };
}

/**
 * The `DocumentScannerViewConfig` interface passes settings to the {@link DocumentScanner} constructor through the {@link DocumentScannerConfig} to apply UI and business logic customizations for the {@link DocumentScannerView}.
 *
 * @remarks
 * Only rare and edge-case scenarios require editing the UI template or MDS source code. MDS uses sensible default values for all omitted properties.
 * 
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace with your actual license key
 *     scannerViewConfig: {
 *         cameraEnhancerUIPath: "../dist/document-scanner.ui.xml", // Use the local file
 *     },
 * });
 ```
 
 @public
 */
export interface DocumentScannerViewConfig {
  /**
   * @privateRemarks
   * Removes Smart Capture if the {@link DocumentCorrectionView} is not available.
   *
   * @internal
   */
  _showCorrectionView?: boolean;
  /**
   * @privateRemarks
   * Indicates if {@link DocumentResultView} is shown.
   *
   * @internal
   */
  _showResultView?: boolean;
  /**
   * Path to the Capture Vision template file for scanning configuration.
   *
   * @public
   */
  templateFilePath?: string;
  /**
   * Path to the UI definition file (`.xml`) for the {@link DocumentScannerView}.
   *
   * @remarks
   * This typically does not need to be set as MDS provides a default template for general use. You may set custom paths to self-host or customize the template, or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
   *
   * @defaultValue {@link DEFAULT_DCE_UI_PATH}
   *
   * @public
   */
  cameraEnhancerUIPath?: string;
  /**
   * The HTML container element or selector for the {@link DocumentScannerView} UI.
   *
   * @public
   */
  container?: HTMLElement | string;
  /**
   * Capture Vision template names for document detection and normalization.
   *
   * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
   *
   * @remarks
   * This typically does not need to be set as MDS provides a default template for general use. You may set custom names to self-host resources or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
   * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV templates}
   *
   * @public
   */
  utilizedTemplateNames?: UtilizedTemplateNames;
  /**
   * Set the document Bounds Detection mode effective upon entering the {@link DocumentScannerView} UI.
   *
   * @remarks
   * Bounds Detection mode gets enabled when Smart Capture mode is enabled.
   *
   * @defaultValue true
   *
   * @public
   */
  enableBoundsDetectionMode?: boolean;
  /**
   * Set the Smart Capture mode effective upon entering the {@link DocumentScannerView} UI.
   *
   * @remarks
   * Enabling Smart Capture mode also enables Bounds Detection mode. Smart Capture mode is enabled when Auto-Capture mode is enabled.
   *
   * @defaultValue false
   *
   * @public
   */
  enableSmartCaptureMode?: boolean;
  /**
   * Set the Auto-Crop mode effective upon entering the {@link DocumentScannerView} UI.
   *
   * @remarks
   * Enabling Auto-Crop mode also enables Smart Capture mode.
   *
   * @defaultValue false
   *
   * @public
   */
  enableAutoCropMode?: boolean;
  /**
   * Define the region within the viewport to detect documents.
   *
   * @see {@link ScanRegion}
   *
   * @public
   */
  scanRegion?: ScanRegion;
  /**
   * Set the minimum number of camera frames to detect document boundaries in Smart Capture mode.
   *
   * @remarks
   * Accepts integer values between 1 and 5, inclusive.
   *
   * @defaultValue 2
   *
   * @public
   */
  minVerifiedFramesForAutoCapture?: number;
  /**
   * Set the visibility of the mode selector menu.
   *
   * @defaultValue true
   *
   * @public
   */
  showSubfooter?: boolean;
  /**
   * Set the visibility of the Dynamsoft branding message.
   *
   * @defaultValue true
   *
   * @public
   */
  showPoweredByDynamsoft?: boolean;
  /**
   * Enable automatic frame verification for best quality capture.
   * When enabled, track clarity scores to find the clearest frame.
   *
   * @defaultValue true
   * @public
   */
  enableFrameVerification?: boolean;
}

/**
 * Internal interface mapping DOM elements from the Camera Enhancer UI.
 *
 * @remarks
 * This interface holds references to all interactive UI elements within the {@link DocumentScannerView}, including control buttons, mode toggles, and preview elements. These references are populated during initialization by querying the Camera Enhancer's shadow DOM.
 *
 * @internal
 */
interface DCEElements {
  /**
   * Button for selecting a different camera device.
   *
   * @internal
   */
  selectCameraBtn: HTMLElement | null;
  /**
   * Button for uploading an image file from the device.
   *
   * @internal
   */
  uploadImageBtn: HTMLElement | null;
  /**
   * Button for closing the scanner view and canceling the scan operation.
   *
   * @internal
   */
  closeScannerBtn: HTMLElement | null;
  /**
   * Button for manually capturing a photo in manual capture mode.
   *
   * @internal
   */
  takePhotoBtn: HTMLElement | null;
  /**
   * Button for toggling bounds detection mode on/off.
   *
   * @internal
   */
  boundsDetectionBtn: HTMLElement | null;
  /**
   * Button for toggling smart capture mode on/off.
   *
   * @internal
   */
  smartCaptureBtn: HTMLElement | null;
  /**
   * Button for toggling auto-crop mode on/off.
   *
   * @internal
   */
  autoCropBtn: HTMLElement | null;
  /**
   * Button for completing continuous scanning and exiting the scanner view.
   *
   * @remarks
   * Only visible when {@link DocumentScannerConfig.enableContinuousScanning} is enabled and at least one scan has been completed.
   *
   * @internal
   */
  continuousScanDoneBtn: HTMLElement | null;
  /**
   * Container element for the thumbnail preview in continuous scanning mode.
   *
   * @internal
   */
  thumbnailPreview: HTMLElement | null;
  /**
   * Image element displaying the thumbnail of the most recent scan.
   *
   * @internal
   */
  thumbnailImg: HTMLImageElement | null;
  /**
   * Container element for the floating animation image during continuous scanning.
   *
   * @internal
   */
  floatingImage: HTMLElement | null;
  /**
   * Image element for the floating animation that moves from the viewfinder to the thumbnail.
   *
   * @internal
   */
  floatingImageImg: HTMLImageElement | null;
}

// Implementation
export default class DocumentScannerView {
  // Capture Mode
  private boundsDetectionEnabled: boolean = true;
  private smartCaptureEnabled: boolean = false;
  private autoCropEnabled: boolean = false;
  private isCapturing: boolean = false;
  private isClosing: boolean = false;

  private resizeTimer: number | null = null;

  // Used for Smart Capture Mode - use crossVerificationStatus
  private crossVerificationCount: number;

  // Continuous scanning cooldown
  private lastCaptureTimestamp = 0;
  private readonly CONTINUOUS_SCAN_COOLDOWN_MS = 2000;

  // Frame verification properties (for clarity-based capture)
  private frameVerificationEnabled = true;
  private currentFrameId = 0;
  private maxClarity = 0;
  private maxClarityTimestamp = 0;
  private maxClarityImg: OriginalImageResultItem["imageData"] | null = null;
  private maxClarityFrameId = 0;
  private nonImprovingClarityFrameCount = 0;
  private clearestFrameId = 0;
  private clarityHistory: number[] = [];

  // Used for ImageEditorView (In NornalizerView)
  private capturedResultItems: CapturedResult["items"] = [];
  private originalImageData: OriginalImageResultItem["imageData"] | null = null;

  private initialized: boolean = false;
  private initializedDCE: boolean = false;

  // Elements
  private DCE_ELEMENTS: DCEElements = {
    selectCameraBtn: null,
    uploadImageBtn: null,
    closeScannerBtn: null,
    takePhotoBtn: null,
    boundsDetectionBtn: null,
    smartCaptureBtn: null,
    autoCropBtn: null,
    continuousScanDoneBtn: null,
    thumbnailPreview: null,
    thumbnailImg: null,
    floatingImage: null,
    floatingImageImg: null,
  };

  // Scan Resolve
  private currentScanResolver?: (result: DocumentResult) => void;

  private loadingScreen: ReturnType<typeof showLoadingScreen> | null = null;
  private toastObserver: MutationObserver | null = null;

  /**
   * Display a loading overlay on top of the scanner view.
   *
   * @param message - Optional message to display in the loading overlay
   *
   * @remarks
   * Called during initialization and upload processing.
   *
   * @internal
   */
  private showScannerLoadingOverlay(message?: string) {
    const configContainer = getElement(this.config.container);
    this.loadingScreen = showLoadingScreen(configContainer, { message });
    configContainer.style.display = "block";
    configContainer.style.position = "relative";
  }

  /**
   * Hide the loading overlay displayed over the scanner view.
   *
   * @param hideContainer - Whether to also hide the scanner container element. Defaults to `false`.
   *
   * @remarks
   * This method removes the loading screen overlay created by {@link showScannerLoadingOverlay}.
   * If `hideContainer` is `true`, it also hides the entire scanner container element by setting
   * its display style to "none".
   *
   * Use `hideContainer: true` when the scanning operation is complete and you want to hide the
   * entire scanner view (e.g., after successful capture in single-scan mode).
   * Use `hideContainer: false` when you want to keep the scanner visible after removing the loading
   * overlay (e.g., after initialization or in continuous scanning mode).
   *
   * @see {@link showScannerLoadingOverlay} - To show the loading overlay
   *
   * @internal
   */
  private hideScannerLoadingOverlay(hideContainer: boolean = false) {
    this.loadingScreen?.hide();

    if (hideContainer) {
      getElement(this.config.container).style.display = "none";
    }
  }

  /**
   * Get the validated minimum number of verified frames required for automatic capture in Smart Capture mode.
   *
   * @returns The validated minimum verified frames count, clamped between 1 and 5
   *
   * @remarks
   * Higher values increase accuracy but require steadier hands. Lower values enable faster capture.
   *
   * @internal
   */
  private getMinVerifiedFramesForAutoCapture() {
    // 1 <= minVerifiedFramesForAutoCapture <= 5
    if (
      !this.config?.minVerifiedFramesForAutoCapture ||
      this.config?.minVerifiedFramesForAutoCapture <= 0 ||
      this.config?.minVerifiedFramesForAutoCapture > 5
    )
      return DEFAULT_MIN_VERIFIED_FRAMES_FOR_CAPTURE;

    return this.config?.minVerifiedFramesForAutoCapture;
  }

  constructor(private resources: SharedResources, private config: DocumentScannerViewConfig) {
    this.config.utilizedTemplateNames = {
      detect: config.utilizedTemplateNames?.detect || DEFAULT_TEMPLATE_NAMES.detect,
      normalize: config.utilizedTemplateNames?.normalize || DEFAULT_TEMPLATE_NAMES.normalize,
    };
  }

  async initialize(): Promise<void> {
    // Set default value for autoCrop, smartCapture and boundsDetection modes
    this.boundsDetectionEnabled =
      this.config?.enableBoundsDetectionMode ??
      this.config?.enableSmartCaptureMode ??
      this.config?.enableAutoCropMode ??
      true; // Enabling any mode enables boundsDetection mode
    this.smartCaptureEnabled = (this.config?.enableSmartCaptureMode || this.config?.enableAutoCropMode) ?? false; // If autoCrop mode is enabled, smartCapture mode should be too
    this.autoCropEnabled = this.config?.enableAutoCropMode ?? false;
    this.frameVerificationEnabled = this.config?.enableFrameVerification ?? true; // Default enabled

    this.config.minVerifiedFramesForAutoCapture = this.getMinVerifiedFramesForAutoCapture();

    if (this.initialized) {
      return;
    }

    // Create loading screen style
    createStyle("dds-loading-screen-style", DEFAULT_LOADING_SCREEN_STYLE);

    try {
      const { cameraView, cameraEnhancer, cvRouter } = this.resources;

      // Set up cameraView styling
      cameraView.setScanRegionMaskStyle({
        ...cameraView.getScanRegionMaskStyle(),
        lineWidth: this.config?.scanRegion?.style?.strokeWidth ?? 2,
        strokeStyle: this.config?.scanRegion?.style?.strokeColor ?? "transparent",
      });
      cameraView.setVideoFit("cover");

      // Set cameraEnhancer as input for CaptureVisionRouter
      cvRouter.setInput(cameraEnhancer);

      // Add filter for smart capture
      const filter = new MultiFrameResultCrossFilter();
      filter.enableResultCrossVerification(EnumCapturedResultItemType.CRIT_DETECTED_QUAD, true);
      filter.enableResultDeduplication(EnumCapturedResultItemType.CRIT_DETECTED_QUAD, true);
      await cvRouter.addResultFilter(filter);

      if (this.config.templateFilePath) {
        await cvRouter.initSettings(this.config.templateFilePath);
      }

      let newSettings = await cvRouter.getSimplifiedSettings(this.config.utilizedTemplateNames.detect);
      newSettings.outputOriginalImage = true;
      newSettings.documentSettings.scaleDownThreshold = 1000;
      await cvRouter.updateSettings(this.config.utilizedTemplateNames.detect, newSettings);

      cvRouter.maxImageSideLength = Infinity;

      const resultReceiver = new CapturedResultReceiver();
      resultReceiver.onCapturedResultReceived = (result) => this.handleBoundsDetection(result);
      await cvRouter.addResultReceiver(resultReceiver);

      this.initialized = true;
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
      this.closeCamera();
      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "DDS Init error",
        },
      };
      this.currentScanResolver(result);
    }
  }

  /**
   * Initialize UI element references from the Camera Enhancer shadow DOM.
   *
   * @remarks
   * Locates shadow DOM, queries UI elements, attaches event handlers, configures visibility.
   * Called by {@link openCamera}.
   *
   * @throws {Error} If shadow root not found
   *
   * @internal
   */
  private async initializeElements() {
    const configContainer = getElement(this.config.container);

    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) {
      throw new Error("Shadow root not found");
    }

    this.DCE_ELEMENTS = {
      selectCameraBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-select-camera-icon"),
      uploadImageBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-upload-image-icon"),
      closeScannerBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-close"),
      takePhotoBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-take-photo"),
      boundsDetectionBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection"),
      smartCaptureBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-smart-capture"),
      autoCropBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-auto-crop"),
      continuousScanDoneBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-continuous-scan-done-btn"),
      thumbnailPreview: DCEContainer.shadowRoot.querySelector(".dce-mn-thumbnail-preview"),
      thumbnailImg: DCEContainer.shadowRoot.querySelector(".dce-mn-thumbnail-img"),
      floatingImage: DCEContainer.shadowRoot.querySelector(".dce-mn-floating-image"),
      floatingImageImg: DCEContainer.shadowRoot.querySelector(".dce-mn-floating-image-img"),
    };

    this.assignDCEClickEvents();

    // Temporary: Setup toast message filtering until DCE updates
    this.setupSmartToastFilter(DCEContainer.shadowRoot);

    // If showCorrectionView is false, hide smartCapture
    if (this.config._showCorrectionView === false) {
      this.DCE_ELEMENTS.smartCaptureBtn.style.display = "none";
    }

    // Hide subfooter or showPoweredByDynamsoft message
    if (this.config?.showSubfooter === false) {
      const subFooter = DCEContainer.shadowRoot.querySelector(".dce-subfooter") as HTMLElement;
      subFooter.style.display = "none";
    }
    if (this.config?.showPoweredByDynamsoft === false) {
      const poweredByDynamsoft = DCEContainer.shadowRoot.querySelector(".dce-mn-msg-poweredby") as HTMLElement;
      poweredByDynamsoft.style.display = "none";
    }

    // Add orange border to thumbnail preview if onThumbnailClicked callback is provided
    if (this.resources.onThumbnailClicked && this.DCE_ELEMENTS.thumbnailPreview) {
      (this.DCE_ELEMENTS.thumbnailPreview as HTMLElement).style.border = "2px solid #fe8e14";
      (this.DCE_ELEMENTS.thumbnailPreview as HTMLElement).style.cursor = "pointer";
    }

    this.initializedDCE = true;
  }

  /**
   * Attach event handlers to all interactive UI elements in the Camera Enhancer interface.
   *
   * @remarks
   * Sets up click handlers for buttons, prevents double-tap zoom on touch elements.
   * Called by {@link initializeElements}.
   *
   * @throws {Error} If required elements not found
   *
   * @internal
   */
  private assignDCEClickEvents() {
    // Check that required elements exist (continuousScanDoneBtn is optional)
    const requiredElements = [
      this.DCE_ELEMENTS.selectCameraBtn,
      this.DCE_ELEMENTS.uploadImageBtn,
      this.DCE_ELEMENTS.closeScannerBtn,
      this.DCE_ELEMENTS.takePhotoBtn,
      this.DCE_ELEMENTS.boundsDetectionBtn,
      this.DCE_ELEMENTS.smartCaptureBtn,
      this.DCE_ELEMENTS.autoCropBtn,
    ];

    if (!requiredElements.every(Boolean)) {
      throw new Error("Camera control elements not found");
    }

    this.takePhoto = this.takePhoto.bind(this);
    this.toggleBoundsDetection = this.toggleBoundsDetection.bind(this);
    this.toggleSmartCapture = this.toggleSmartCapture.bind(this);
    this.toggleAutoCrop = this.toggleAutoCrop.bind(this);
    this.closeCamera = this.closeCamera.bind(this);

    // Using onclick instead of addEventListener
    this.DCE_ELEMENTS.takePhotoBtn.onclick = this.takePhoto;

    this.DCE_ELEMENTS.boundsDetectionBtn.onclick = async () => {
      await this.toggleBoundsDetection();
    };

    this.DCE_ELEMENTS.smartCaptureBtn.onclick = async () => {
      await this.toggleSmartCapture();
    };

    this.DCE_ELEMENTS.autoCropBtn.onclick = async () => {
      await this.toggleAutoCrop();
    };

    this.DCE_ELEMENTS.closeScannerBtn.onclick = async () => {
      await this.handleCloseBtn();
    };

    this.DCE_ELEMENTS.selectCameraBtn.onclick = (event) => {
      event.stopPropagation();
      this.toggleSelectCameraBox();
    };

    this.DCE_ELEMENTS.uploadImageBtn.onclick = () => {
      this.uploadImage();
    };

    // Optional: continuous scan done button
    if (this.DCE_ELEMENTS.continuousScanDoneBtn) {
      this.DCE_ELEMENTS.continuousScanDoneBtn.onclick = () => {
        this.handleContinuousScanDone();
      };
    }

    // Prevent double-tap zoom on thumbnail
    this.DCE_ELEMENTS.thumbnailPreview?.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );

    this.DCE_ELEMENTS.thumbnailPreview?.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );

    this.DCE_ELEMENTS.thumbnailPreview?.addEventListener("dblclick", (e) => {
      e.preventDefault();
    });

    // Add click handler for thumbnail
    this.DCE_ELEMENTS.thumbnailPreview?.addEventListener("click", async (e) => {
      e.preventDefault();
      // Only invoke callback if it's defined and we have a result
      if (this.resources.onThumbnailClicked && this.resources.result) {
        await this.resources.onThumbnailClicked(this.resources.result);
      }
    });

    // Prevent double-tap zoom on torch button
    const DCEContainer = getElement(this.config.container).children[
      getElement(this.config.container).children.length - 1
    ];
    const torchButton = DCEContainer?.shadowRoot?.querySelector(".dce-mn-torch") as HTMLElement;
    if (torchButton) {
      torchButton.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
        },
        { passive: false }
      );

      torchButton.addEventListener(
        "touchend",
        (e) => {
          e.preventDefault();
        },
        { passive: false }
      );

      torchButton.addEventListener("dblclick", (e) => {
        e.preventDefault();
      });
    }
  }

  /**
   * Handle the "Done" button click in continuous scanning mode to complete the scanning session.
   *
   * @remarks
   * Closes camera and resolves with cancelled status. Prevents closing during capture.
   *
   * @internal
   */
  private handleContinuousScanDone() {
    if (this.isCapturing || this.isClosing) {
      return;
    }

    this.isClosing = true;
    this.closeCamera();
    this.currentScanResolver?.({
      status: {
        code: EnumResultStatus.RS_CANCELLED,
        message: "Continuous scanning stopped by user",
      },
    });
  }

  /**
   * Update the "Done" button visibility and text based on the number of completed scans.
   *
   * @remarks
   * Shows button if completedScansCount > 0, displays "Done (N)".
   *
   * @internal
   */
  private updateContinuousScanDoneButton() {
    if (!this.DCE_ELEMENTS.continuousScanDoneBtn) return;

    // Show/hide button based on completedScansCount
    if (this.resources.completedScansCount > 0) {
      this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "block";
    } else {
      this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "none";
    }

    const textEl = this.DCE_ELEMENTS.continuousScanDoneBtn?.querySelector(".dce-mn-continuous-scan-done-text");
    if (textEl) {
      textEl.textContent = `Done (${this.resources.completedScansCount || 0})`;
    }
  }

  /**
   * Update the thumbnail preview image with the most recently scanned document.
   *
   * @param canvas - The canvas containing the corrected/cropped document image to display
   *
   * @remarks
   * Converts to JPEG data URL (0.8 quality), updates thumbnail image src. Only in continuous mode.
   *
   * @internal
   */
  private updateThumbnail(canvas: HTMLCanvasElement) {
    if (!this.DCE_ELEMENTS.thumbnailPreview || !this.DCE_ELEMENTS.thumbnailImg) return;
    if (!this.resources.enableContinuousScanning) return;

    // Convert canvas to data URL and set as thumbnail image source
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    this.DCE_ELEMENTS.thumbnailImg.src = dataUrl;
    this.DCE_ELEMENTS.thumbnailPreview.style.display = "block";
  }

  /**
   * Detect if device is running iOS.
   *
   * @returns `true` if iOS device
   *
   * @remarks
   * Checks user agent for iPad/iPhone/iPod, also detects iPad Pro (MacIntel + touch).
   *
   * @internal
   */
  private isIOS(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }

  /**
   * Toast message filter - temporary measure, can be removed when DCE updates toast behavior.
   *
   * @param shadowRoot - The shadow root containing the toast element to observe
   *
   * @remarks
   * Set up MutationObserver to control toast visibility based on device. Hides toast on desktop/iOS, shows on Android mobile, and also hides torch on desktop.
   *
   * @internal
   */
  private setupSmartToastFilter(shadowRoot: ShadowRoot) {
    const toastElement = shadowRoot.querySelector(".dce-mn-toast") as HTMLElement;
    if (!toastElement) return;

    const checkToastContent = () => {
      const text = toastElement.textContent?.trim() || "";

      if (text === "Torch Not Supported") {
        const { cameraEnhancer } = this.resources;
        if (cameraEnhancer?.isOpen()) {
          try {
            const capabilities = cameraEnhancer.getCapabilities?.() as any;
            const isTorchSupported = !!capabilities?.torch;

            if (isTorchSupported) {
              toastElement.style.display = "none";
              return;
            }
          } catch (error) {
            console.warn("Error checking torch capabilities:", error);
          }
        }
      }

      if (text) {
        toastElement.style.display = "";
      } else {
        toastElement.style.display = "none";
      }
    };

    this.toastObserver = new MutationObserver(() => {
      checkToastContent();
    });

    this.toastObserver.observe(toastElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    checkToastContent();
  }

  /**
   * Animate a captured document image flying from the viewfinder to the thumbnail preview.
   *
   * @param canvas - The canvas containing the captured document image to animate
   * @returns Promise that resolves when the animation completes (after 500ms)
   *
   * @remarks
   * Calculates transform to move/scale floating image to thumbnail position. Uses CSS custom properties and requestAnimationFrame.
   *
   * @internal
   */
  private async animateFloatingImage(canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve) => {
      if (
        !this.DCE_ELEMENTS.floatingImage ||
        !this.DCE_ELEMENTS.floatingImageImg ||
        !this.DCE_ELEMENTS.thumbnailPreview ||
        !this.DCE_ELEMENTS.thumbnailImg
      ) {
        resolve();
        return;
      }

      // Convert canvas to data URL and set as floating image source
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      this.DCE_ELEMENTS.floatingImageImg.src = dataUrl;

      // Hide the thumbnail image during animation (but keep the border visible)
      this.DCE_ELEMENTS.thumbnailImg.style.opacity = "0";

      // Show the floating image first (before calculating positions)
      this.DCE_ELEMENTS.floatingImage.style.display = "block";
      this.DCE_ELEMENTS.floatingImage.classList.remove("animating");

      // Use requestAnimationFrame to ensure layout is complete before calculating positions
      requestAnimationFrame(() => {
        if (!this.DCE_ELEMENTS.floatingImage || !this.DCE_ELEMENTS.thumbnailPreview) {
          resolve();
          return;
        }

        // Calculate exact position to move to
        const floatingRect = this.DCE_ELEMENTS.floatingImage.getBoundingClientRect();
        const thumbnailRect = this.DCE_ELEMENTS.thumbnailPreview.getBoundingClientRect();

        // Calculate the center of both elements
        const floatingCenterX = floatingRect.left + floatingRect.width / 2;
        const floatingCenterY = floatingRect.top + floatingRect.height / 2;
        const thumbnailCenterX = thumbnailRect.left + thumbnailRect.width / 2;
        const thumbnailCenterY = thumbnailRect.top + thumbnailRect.height / 2;

        // Calculate translation needed
        const translateX = thumbnailCenterX - floatingCenterX;
        const translateY = thumbnailCenterY - floatingCenterY;

        // Calculate scale to match thumbnail size
        const scale = Math.min(thumbnailRect.width / floatingRect.width, thumbnailRect.height / floatingRect.height);

        // Set CSS custom properties for the animation
        this.DCE_ELEMENTS.floatingImage.style.setProperty("--translate-x", `${translateX}px`);
        this.DCE_ELEMENTS.floatingImage.style.setProperty("--translate-y", `${translateY}px`);
        this.DCE_ELEMENTS.floatingImage.style.setProperty("--scale", `${scale}`);

        // Trigger reflow to ensure the custom properties are set
        void this.DCE_ELEMENTS.floatingImage.offsetWidth;

        // Start the shrinking animation
        this.DCE_ELEMENTS.floatingImage.classList.add("animating");

        // Wait for animation to complete (0.5 seconds as defined in CSS)
        setTimeout(() => {
          if (this.DCE_ELEMENTS.floatingImage) {
            this.DCE_ELEMENTS.floatingImage.style.display = "none";
            this.DCE_ELEMENTS.floatingImage.classList.remove("animating");
          }
          // Show the thumbnail image now that the animation is complete
          if (this.DCE_ELEMENTS.thumbnailImg) {
            this.DCE_ELEMENTS.thumbnailImg.style.opacity = "1";
          }
          resolve();
        }, 500);
      });
    });
  }

  /**
   * Handle the close button (X) click to cancel scanning and exit the scanner view.
   *
   * @remarks
   * Prevents closing during capture. Closes camera and resolves with cancelled status.
   *
   * @internal
   */
  async handleCloseBtn() {
    if (this.isCapturing) {
      console.warn("Cannot close during image capture");
      return;
    }

    this.closeCamera();

    this.currentScanResolver?.({
      status: {
        code: EnumResultStatus.RS_CANCELLED,
        message: "Cancelled",
      },
    });
  }

  /**
   * Attach click event listeners to camera and resolution selection options.
   *
   * @remarks
   * Handles camera switching and resolution changes. Closes dropdown after selection.
   *
   * @internal
   */
  private attachOptionClickListeners() {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];
    if (!DCEContainer?.shadowRoot) return;

    const settingsContainer = DCEContainer.shadowRoot.querySelector(
      ".dce-mn-camera-and-resolution-settings"
    ) as HTMLElement;

    const cameraOptions = DCEContainer.shadowRoot.querySelectorAll(".dce-mn-camera-option");
    const resolutionOptions = DCEContainer.shadowRoot.querySelectorAll(".dce-mn-resolution-option");

    // Add click handlers to all options
    [...cameraOptions, ...resolutionOptions].forEach((option) => {
      (option as HTMLElement).onclick = () => {
        const deviceId = option.getAttribute("data-device-id");
        const resHeight = option.getAttribute("data-height");
        const resWidth = option.getAttribute("data-width");
        if (deviceId) {
          this.resources.cameraEnhancer?.selectCamera(deviceId).then(() => {
            this.toggleScanGuide(true);
          });
        } else if (resHeight && resWidth) {
          this.resources.cameraEnhancer
            ?.setResolution({
              width: parseInt(resWidth),
              height: parseInt(resHeight),
            })
            .then(() => {
              this.toggleScanGuide(true);
            });
        }

        if (settingsContainer.style.display !== "none") {
          this.toggleSelectCameraBox();
        }
      };
    });
  }

  /**
   * Highlight the currently selected camera and resolution options in the settings dropdown.
   *
   * @remarks
   * This method visually indicates which camera and resolution are currently active by
   * applying a distinctive orange border (2px solid #fe814a) to the selected options.
   *
   * **Camera highlighting:**
   * - Queries the currently selected camera via {@link CameraEnhancer.getSelectedCamera}
   * - Compares the `deviceId` with each camera option's `data-device-id` attribute
   * - Applies border styling to the matching option
   *
   * **Resolution highlighting:**
   * - Queries the current resolution via {@link CameraEnhancer.getResolution}
   * - Finds the closest standard resolution level (480p, 720p, 1080p, 2k, 4k) using {@link findClosestResolutionLevel}
   * - Maps the resolution level to pixel height (e.g., "720p" → "720")
   * - Applies border styling to the option with matching `data-height` attribute
   *
   * The method handles the resolution mapping because cameras may report actual resolutions
   * (e.g., 1280x720) that need to be matched to standard preset options.
   *
   * Called by {@link toggleSelectCameraBox} before displaying the settings dropdown to
   * ensure the current selections are properly highlighted.
   *
   * @see {@link toggleSelectCameraBox} - Opens the settings dropdown
   * @see {@link attachOptionClickListeners} - Handles option selection
   * @see {@link findClosestResolutionLevel} - Utility to map actual resolution to preset level
   * @see {@link CameraEnhancer.getSelectedCamera} - Gets the active camera
   * @see {@link CameraEnhancer.getResolution} - Gets the current resolution
   *
   * @internal
   */
  private highlightCameraAndResolutionOption() {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];
    if (!DCEContainer?.shadowRoot) return;

    const settingsContainer = DCEContainer.shadowRoot.querySelector(
      ".dce-mn-camera-and-resolution-settings"
    ) as HTMLElement;
    const cameraOptions = settingsContainer.querySelectorAll(".dce-mn-camera-option");
    const resOptions = settingsContainer.querySelectorAll(".dce-mn-resolution-option");

    const selectedCamera = this.resources.cameraEnhancer?.getSelectedCamera();
    const selectedResolution = this.resources.cameraEnhancer?.getResolution();

    cameraOptions.forEach((options) => {
      const o = options as HTMLElement;
      if (o.getAttribute("data-device-id") === selectedCamera?.deviceId) {
        o.style.border = "2px solid #fe814a";
      } else {
        o.style.border = "none";
      }
    });

    const heightMap: Record<string, string> = {
      "480p": "480",
      "720p": "720",
      "1080p": "1080",
      "2k": "1440",
      "4k": "2160",
    };
    const resolutionLvl = findClosestResolutionLevel(selectedResolution);

    resOptions.forEach((options) => {
      const o = options as HTMLElement;
      const height = o.getAttribute("data-height");

      if (height === heightMap[resolutionLvl]) {
        o.style.border = "2px solid #fe814a";
      } else {
        o.style.border = "none";
      }
    });
  }

  /**
   * Toggle the visibility of the camera and resolution selection dropdown.
   *
   * @remarks
   * This method opens or closes the camera/resolution settings dropdown by simulating a
   * click on the settings box element. Before opening, it:
   * 1. Highlights the currently selected camera and resolution via {@link highlightCameraAndResolutionOption}
   * 2. Attaches click event listeners to all options via {@link attachOptionClickListeners}
   * 3. Updates the scan region guide via {@link toggleScanGuide}
   *
   * The dropdown allows users to:
   * - Switch between available cameras (front/back on mobile, multiple webcams on desktop)
   * - Change the camera resolution (480p, 720p, 1080p, 2k, 4k)
   *
   * Higher resolutions improve document detection accuracy but may reduce performance on
   * lower-end devices. The scanner defaults to 2k resolution (2560x1440) when the camera opens.
   *
   * The settings box element is provided by the Camera Enhancer UI template and contains
   * dynamically populated camera and resolution options.
   *
   * Called by the "Select Camera" button click handler set up in {@link assignDCEClickEvents}.
   *
   * @see {@link highlightCameraAndResolutionOption} - Highlights current selections
   * @see {@link attachOptionClickListeners} - Attaches option click handlers
   * @see {@link toggleScanGuide} - Updates the scan region overlay
   * @see {@link assignDCEClickEvents} - Where the select camera button handler is set up
   * @see {@link openCamera} - Sets default 2k resolution
   *
   * @internal
   */
  private toggleSelectCameraBox() {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const settingsBox = DCEContainer.shadowRoot.querySelector(".dce-mn-resolution-box") as HTMLElement;

    // Highlight current camera and resolution
    this.highlightCameraAndResolutionOption();

    // Attach highlighting camera and resolution options on option click
    this.attachOptionClickListeners();

    settingsBox.click();

    this.toggleScanGuide(true);
  }

  /**
   * Open a file picker dialog to upload and process an image file for document scanning.
   *
   * @remarks
   * This method provides an alternative to camera capture by allowing users to select and
   * process existing image files from their device. The complete workflow includes:
   *
   * **File Selection:**
   * 1. Creates a hidden file input element accepting PNG and JPEG images
   * 2. Programmatically triggers the file picker dialog
   * 3. Validates the selected file is an image type
   *
   * **Image Processing:**
   * 1. Converts the file to a blob via {@link fileToBlob}
   * 2. Detects document boundaries using {@link CaptureVisionRouter.capture} with the detection template
   * 3. Falls back to full image bounds if no document is detected
   * 4. Performs perspective correction via {@link normalizeImage}
   * 5. Creates a {@link DocumentResult} with {@link EnumFlowType.UPLOADED_IMAGE} flow type
   *
   * **Mode-Specific Behavior:**
   *
   * **Single Scan Mode:**
   * - Closes the camera via {@link closeCamera}
   * - Hides the scanner container after processing
   * - Resolves the scan promise to route through correction/result views
   *
   * **Continuous Scan Mode:**
   * - Stops capturing during upload processing (resumes after)
   * - If no correction/result views: shows animation via {@link animateFloatingImage} and updates thumbnail via {@link updateThumbnail}
   * - If correction/result views enabled: routes through those views
   * - Keeps the scanner visible for additional captures
   *
   * Error handling includes user-friendly alerts and proper cleanup of the file input element.
   *
   * Called by the "Upload Image" button click handler set up in {@link assignDCEClickEvents}.
   *
   * @see {@link fileToBlob} - Converts File to Blob with image dimensions
   * @see {@link normalizeImage} - Performs perspective correction
   * @see {@link animateFloatingImage} - Animates the captured image (continuous mode)
   * @see {@link updateThumbnail} - Updates thumbnail preview (continuous mode)
   * @see {@link closeCamera} - Closes camera (single scan mode)
   * @see {@link EnumFlowType.UPLOADED_IMAGE} - The flow type for uploaded images
   * @see {@link assignDCEClickEvents} - Where the upload button handler is set up
   *
   * @internal
   */
  private async uploadImage() {
    // Create hidden file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg";
    input.style.display = "none";
    document.body.appendChild(input);

    try {
      this.showScannerLoadingOverlay("Processing image...");

      // Get file from input
      const file = await new Promise<File>((resolve, reject) => {
        input.onchange = (e: Event) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (!f?.type.startsWith("image/")) {
            reject(new Error("Please select an image file"));
            return;
          }
          resolve(f);
        };

        input.addEventListener("cancel", () => this.hideScannerLoadingOverlay(false));
        input.click();
      });

      if (!file) {
        this.hideScannerLoadingOverlay(false);
        return;
      }

      // Only close camera in single scan mode
      if (!this.resources.enableContinuousScanning) {
        this.closeCamera(false);
      } else {
        // In continuous mode, stop capturing during upload processing
        this.resources.cvRouter.stopCapturing();
      }

      // Convert file to blob
      const { blob } = await this.fileToBlob(file);

      this.capturedResultItems = (
        await this.resources.cvRouter.capture(blob, this.config.utilizedTemplateNames.detect)
      ).items;
      this.originalImageData = (this.capturedResultItems[0] as OriginalImageResultItem)?.imageData;

      // Reset captured items if not using bounds detection
      let detectedQuadrilateral: Quadrilateral = null;
      const useImageDimensions = this.capturedResultItems?.length <= 1;
      if (useImageDimensions) {
        this.capturedResultItems = [];
        const { width, height } = this.originalImageData;
        detectedQuadrilateral = {
          points: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
          ],
          area: height * width,
        } as Quadrilateral;
      } else {
        detectedQuadrilateral = (
          this.capturedResultItems.find(
            (item) => item.type === EnumCapturedResultItemType.CRIT_DETECTED_QUAD
          ) as DetectedQuadResultItem
        )?.location;
      }

      const correctedImageResult = await this.normalizeImage(detectedQuadrilateral.points, this.originalImageData);

      const result = {
        status: {
          code: EnumResultStatus.RS_SUCCESS,
          message: "Success",
        },
        originalImageResult: this.originalImageData,
        correctedImageResult,
        detectedQuadrilateral,
        _flowType: EnumFlowType.UPLOADED_IMAGE,
      };

      // Update shared resources
      this.resources.onResultUpdated?.(result);

      // In continuous scanning mode, treat upload like a capture
      if (this.resources.enableContinuousScanning) {
        // Only show animation if not routing through correction/result views
        if (!this.config._showCorrectionView && !this.config._showResultView) {
          // No correction/result views - show animation and stay in scanner
          const canvas = correctedImageResult.toCanvas();
          this.updateThumbnail(canvas);
          await this.animateFloatingImage(canvas);

          // Restart capturing after upload processing
          await this.resources.cvRouter.startCapturing(this.config.utilizedTemplateNames.detect);
        }

        this.hideScannerLoadingOverlay(false);
      } else {
        this.hideScannerLoadingOverlay(true);
      }

      // Resolve scan promise to go through correction/result views
      this.currentScanResolver(result);
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
      this.closeCamera();

      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "Error processing uploaded image",
        },
      };
      this.currentScanResolver(result);
    } finally {
      document.body.removeChild(input);
    }
  }

  /**
   * Convert an image File object to a Blob with extracted image dimensions.
   *
   * @param file - The File object to convert (must be an image file)
   * @returns Promise resolving to an object containing the blob, width, and height
   *
   * @remarks
   * This method converts an image file to a blob format suitable for processing by the
   * Dynamsoft Capture Vision SDK while preserving the original image format and dimensions.
   *
   * **Conversion Process:**
   * 1. Creates an {@link https://developer.mozilla.org/en-US/docs/Web/API/Image | Image} element and loads the file via {@link https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static | URL.createObjectURL}
   * 2. Extracts the image's natural width and height once loaded
   * 3. Draws the image to a canvas at full resolution (no scaling)
   * 4. Converts the canvas to a blob using {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob}
   * 5. Preserves the original file's MIME type (e.g., "image/jpeg", "image/png")
   * 6. Returns the blob along with dimensions for downstream processing
   *
   * **Why This Approach:**
   * - The Dynamsoft SDK's {@link CaptureVisionRouter.capture} method accepts Blob inputs
   * - The canvas intermediate step ensures consistent processing across different browsers
   * - Extracting dimensions separately avoids redundant image analysis in later steps
   *
   * This method is called by {@link uploadImage} to prepare uploaded files for document
   * detection and normalization.
   *
   * @throws {Error} If the image fails to load or blob creation fails
   *
   * @see {@link uploadImage} - Calls this method to process uploaded files
   * @see {@link CaptureVisionRouter.capture} - Processes the blob for document detection
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Blob | Blob API} - The blob format returned
   *
   * @internal
   */
  private async fileToBlob(file: File): Promise<{ blob: Blob; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, width: img.width, height: img.height });
          } else {
            reject(new Error("Failed to create blob"));
          }
        }, file.type);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }



  /**
   * Toggle bounds detection mode to enable/disable real-time document boundary detection.
   *
   * @param enabled - Optional explicit state: `true` to enable, `false` to disable, `undefined` to toggle current state
   *
   * @remarks
   * Bounds detection mode uses the Dynamsoft Document Normalizer to detect document boundaries
   * in real-time as the camera captures frames. When enabled, detected boundaries are drawn
   * as an overlay on the camera view, helping users align their documents properly.
   *
   * **Mode Hierarchy and Dependencies:**
   * - **Bounds Detection** is the foundation for all automatic capture modes
   * - **Smart Capture** requires Bounds Detection to be enabled
   * - **Auto Crop** requires both Smart Capture and Bounds Detection to be enabled
   *
   * **Enabling Bounds Detection:**
   * - Starts frame capture via {@link CaptureVisionRouter.startCapturing} with the detection template
   * - Updates the scan region guide via {@link toggleScanGuide}
   * - Changes UI button color to orange (#fe814a) to indicate active state
   * - Swaps button icon from "off" to "on" state
   *
   * **Disabling Bounds Detection:**
   * - Automatically disables Smart Capture via {@link toggleSmartCapture}
   * - Also disables Auto Crop if {@link DocumentScannerViewConfig._showCorrectionView} is `false`
   * - Stops frame capture via {@link stopCapturing}
   * - Changes UI button color to white (#fff) to indicate inactive state
   *
   * This mode can be configured as the default via {@link DocumentScannerViewConfig.enableBoundsDetectionMode}.
   *
   * Called by:
   * - User clicking the Bounds Detection button (via {@link assignDCEClickEvents})
   * - {@link toggleSmartCapture} when Smart Capture is enabled (to ensure Bounds Detection is on)
   * - {@link toggleAutoCrop} when Auto Crop is enabled (to ensure Bounds Detection is on)
   * - {@link openCamera} to apply the initial configured mode
   *
   * @see {@link toggleSmartCapture} - The next level in the mode hierarchy
   * @see {@link toggleAutoCrop} - The highest level in the mode hierarchy
   * @see {@link DocumentScannerViewConfig.enableBoundsDetectionMode} - Default configuration
   * @see {@link stopCapturing} - Stops frame capture
   * @see {@link toggleScanGuide} - Updates scan region overlay
   *
   * @internal
   */
  async toggleBoundsDetection(enabled?: boolean) {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const container = DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection") as HTMLElement;
    const onIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection-on") as HTMLElement;
    const offIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection-off") as HTMLElement;

    if (!onIcon || !offIcon) return;

    const newBoundsDetectionState = enabled !== undefined ? enabled : !this.boundsDetectionEnabled;

    // If we're turning off bounds detection, ensure smart capture is turned off
    if (!newBoundsDetectionState) {
      await this.toggleSmartCapture(false);
      // Also turn off auto crop when correction view is disabled
      if (this.config._showCorrectionView === false) {
        await this.toggleAutoCrop(false);
      }
    }

    const { cvRouter } = this.resources;

    this.boundsDetectionEnabled = newBoundsDetectionState;
    container.style.color = this.boundsDetectionEnabled ? "#fe814a" : "#fff";
    offIcon.style.display = this.boundsDetectionEnabled ? "none" : "block";
    onIcon.style.display = this.boundsDetectionEnabled ? "block" : "none";

    if (this.initialized && this.boundsDetectionEnabled) {
      await cvRouter.startCapturing(this.config.utilizedTemplateNames.detect);

      this.toggleScanGuide(true);
    } else if (this.initialized && !this.boundsDetectionEnabled) {
      this.stopCapturing();
    }
  }

  /**
   * Toggle Smart Capture mode to enable/disable automatic document capture when stable boundaries are detected.
   *
   * @param mode - Optional explicit state: `true` to enable, `false` to disable, `undefined` to toggle current state
   *
   * @remarks
   * Smart Capture mode automatically triggers document capture when the scanner detects consistent
   * document boundaries across multiple consecutive frames, eliminating the need for users to
   * manually press the capture button.
   *
   * **How Smart Capture Works:**
   * 1. Requires {@link DocumentScannerViewConfig.minVerifiedFramesForAutoCapture} consecutive frames (default: 2) with matching boundaries
   * 2. Uses Dynamsoft's {@link MultiFrameResultCrossFilter} for cross-verification of detected boundaries
   * 3. When verification count is reached, automatically calls {@link takePhoto}
   * 4. After capture, routes to {@link DocumentCorrectionView} for manual boundary adjustment (if enabled)
   *
   * **Mode Hierarchy and Dependencies:**
   * - **Requires:** Bounds Detection mode must be enabled
   * - **Optional:** Can be combined with Auto Crop mode
   * - **When disabled:** Also disables Auto Crop mode (if {@link DocumentScannerViewConfig._showCorrectionView} is not `false`)
   *
   * **Enabling Smart Capture:**
   * - Automatically enables Bounds Detection via {@link toggleBoundsDetection} if not already enabled
   * - Changes UI button color to orange (#fe814a) to indicate active state
   * - Swaps button icon from "off" to "on" state
   * - Resets {@link crossVerificationCount} to start fresh verification tracking
   *
   * **Disabling Smart Capture:**
   * - Automatically disables Auto Crop (when correction view is enabled)
   * - Changes UI button color to white (#fff) to indicate inactive state
   * - Resets {@link crossVerificationCount}
   *
   * This mode can be configured as the default via {@link DocumentScannerViewConfig.enableSmartCaptureMode}.
   * When {@link DocumentScannerViewConfig._showCorrectionView} is `false`, Smart Capture button is hidden from the UI.
   *
   * Called by:
   * - User clicking the Smart Capture button (via {@link assignDCEClickEvents})
   * - {@link toggleBoundsDetection} when Bounds Detection is disabled (to disable Smart Capture)
   * - {@link toggleAutoCrop} when Auto Crop is enabled/disabled (to ensure Smart Capture state)
   * - {@link openCamera} to apply the initial configured mode
   *
   * @see {@link toggleBoundsDetection} - The prerequisite mode
   * @see {@link toggleAutoCrop} - The next level in the mode hierarchy
   * @see {@link handleAutoCaptureMode} - Where auto-capture is triggered
   * @see {@link DocumentScannerViewConfig.enableSmartCaptureMode} - Default configuration
   * @see {@link DocumentScannerViewConfig.minVerifiedFramesForAutoCapture} - Verification frame count
   * @see {@link DocumentCorrectionView} - Where the user can adjust detected boundaries
   *
   * @internal
   */
  async toggleSmartCapture(mode?: boolean) {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const container = DCEContainer.shadowRoot.querySelector(".dce-mn-smart-capture") as HTMLElement;
    const onIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-smart-capture-on") as HTMLElement;
    const offIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-smart-capture-off") as HTMLElement;

    if (!onIcon || !offIcon) return;

    const newSmartCaptureState = mode !== undefined ? mode : !this.smartCaptureEnabled;

    // If trying to turn on auto capture, ensure bounds detection is on
    // If turning off auto capture, ensure auto crop is off
    if (newSmartCaptureState && !this.boundsDetectionEnabled) {
      await this.toggleBoundsDetection(true);
    } else if (!newSmartCaptureState && this.config._showCorrectionView !== false) {
      // Handle correctionView
      await this.toggleAutoCrop(false);
    }

    this.smartCaptureEnabled = newSmartCaptureState;
    container.style.color = this.smartCaptureEnabled ? "#fe814a" : "#fff";
    offIcon.style.display = this.smartCaptureEnabled ? "none" : "block";
    onIcon.style.display = this.smartCaptureEnabled ? "block" : "none";

    // Reset crossVerificationCount whenever we toggle the smart capture
    this.crossVerificationCount = 0;
  }

  /**
   * Toggle Auto Crop mode to enable/disable automatic capture with immediate perspective correction.
   *
   * @param mode - Optional explicit state: `true` to enable, `false` to disable, `undefined` to toggle current state
   *
   * @remarks
   * Auto Crop mode combines Smart Capture's automatic triggering with immediate perspective
   * correction, bypassing the {@link DocumentCorrectionView} for a fully automated scanning
   * experience. This is ideal for high-volume scanning workflows where speed is prioritized
   * over manual boundary adjustment.
   *
   * **How Auto Crop Works:**
   * 1. Detects stable document boundaries like Smart Capture mode
   * 2. Automatically captures the document when verification threshold is met
   * 3. Immediately performs perspective correction via {@link normalizeImage}
   * 4. Skips {@link DocumentCorrectionView} and routes directly to {@link DocumentResultView} (if enabled)
   * 5. In continuous mode without result view, shows animation and stays in scanner for next capture
   *
   * **Mode Hierarchy and Dependencies:**
   * - **Requires:** Both Bounds Detection and Smart Capture modes must be enabled
   * - **Highest level:** This is the most automated capture mode
   * - **When disabled and correction view is disabled:** Also disables Smart Capture mode
   *
   * **Enabling Auto Crop:**
   * - Automatically enables Bounds Detection via {@link toggleBoundsDetection} if not already enabled
   * - Automatically enables Smart Capture via {@link toggleSmartCapture} if not already enabled
   * - Changes UI button color to orange (#fe814a) to indicate active state
   * - Swaps button icon from "off" to "on" state
   *
   * **Disabling Auto Crop:**
   * - If {@link DocumentScannerViewConfig._showCorrectionView} is `false`, also disables Smart Capture
   * - Changes UI button color to white (#fff) to indicate inactive state
   *
   * This mode can be configured as the default via {@link DocumentScannerViewConfig.enableAutoCropMode}.
   * Enabling Auto Crop also enables Smart Capture and Bounds Detection automatically.
   *
   * **Use Cases:**
   * - High-volume document scanning (invoices, receipts, forms)
   * - Documents with clear, well-defined boundaries
   * - Workflows prioritizing speed over manual adjustment
   * - Continuous scanning of multiple similar documents
   *
   * Called by:
   * - User clicking the Auto Crop button (via {@link assignDCEClickEvents})
   * - {@link toggleBoundsDetection} when Bounds Detection is disabled (to disable Auto Crop if correction view disabled)
   * - {@link toggleSmartCapture} when Smart Capture is disabled (to disable Auto Crop if correction view enabled)
   * - {@link openCamera} to apply the initial configured mode
   *
   * @see {@link toggleBoundsDetection} - The foundational prerequisite mode
   * @see {@link toggleSmartCapture} - The intermediate prerequisite mode
   * @see {@link handleAutoCaptureMode} - Where auto-capture is triggered
   * @see {@link normalizeImage} - Performs perspective correction
   * @see {@link DocumentScannerViewConfig.enableAutoCropMode} - Default configuration
   * @see {@link DocumentResultView} - Where corrected images are displayed (if enabled)
   *
   * @internal
   */
  async toggleAutoCrop(mode?: boolean) {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const container = DCEContainer.shadowRoot.querySelector(".dce-mn-auto-crop") as HTMLElement;
    const onIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-auto-crop-on") as HTMLElement;
    const offIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-auto-crop-off") as HTMLElement;

    if (!onIcon || !offIcon) return;

    const newSmartCaptureState = mode !== undefined ? mode : !this.autoCropEnabled;

    // If trying to turn on auto capture, ensure bounds detection is on
    if (newSmartCaptureState && (!this.boundsDetectionEnabled || !this.smartCaptureEnabled)) {
      // Turn on bouds detection first
      await this.toggleBoundsDetection(true);
      await this.toggleSmartCapture(true);
    }

    // If turning off auto crop and _showCorrectionView is false, also turn off smartCapture
    if (!newSmartCaptureState && this.config._showCorrectionView === false) {
      await this.toggleSmartCapture(false);
    }

    this.autoCropEnabled = newSmartCaptureState;
    container.style.color = this.autoCropEnabled ? "#fe814a" : "#fff";
    offIcon.style.display = this.autoCropEnabled ? "none" : "block";
    onIcon.style.display = this.autoCropEnabled ? "block" : "none";
  }

  /**
   * Handle viewport resize events by debouncing scan region recalculation.
   *
   * @remarks
   * This event handler responds to window resize events (e.g., device rotation, browser window
   * resizing, virtual keyboard appearance) by temporarily hiding the scan region guide and
   * recalculating its position after the resize operation stabilizes.
   *
   * **Debouncing Logic:**
   * 1. Immediately hides the scan region guide via {@link toggleScanGuide}(false) to prevent visual glitches
   * 2. Clears any existing resize timer to reset the debounce delay
   * 3. Sets a new timer that triggers after 500ms of resize inactivity
   * 4. When the timer fires, recalculates and re-shows the scan guide via {@link toggleScanGuide}(true)
   *
   * The 500ms delay ensures the guide isn't constantly recalculated during animated resizes
   * or smooth orientation changes, improving performance and preventing visual flickering.
   *
   * **Common Resize Triggers:**
   * - Device orientation change (portrait ↔ landscape)
   * - Browser window resizing on desktop
   * - Virtual keyboard appearing/disappearing on mobile
   * - Split-screen mode changes on tablets
   * - Fullscreen mode toggling
   *
   * This handler is attached during {@link openCamera} and removed during {@link closeCamera}
   * to ensure proper lifecycle management.
   *
   * @see {@link toggleScanGuide} - Shows/hides and recalculates the scan region
   * @see {@link calculateScanRegion} - Performs the actual region calculation
   * @see {@link openCamera} - Attaches this resize listener
   * @see {@link closeCamera} - Removes this resize listener
   *
   * @internal
   */
  private handleResize = () => {
    // Hide all guides first
    this.toggleScanGuide(false);

    // Clear existing timer
    if (this.resizeTimer) {
      window.clearTimeout(this.resizeTimer);
    }

    // Set new timer
    this.resizeTimer = window.setTimeout(() => {
      // Re-show guides and update scan region
      this.toggleScanGuide(true);
    }, 500);
  };

  /**
   * Toggle the visibility of the scan region guide and trigger recalculation if enabled.
   *
   * @param enabled - Whether to show the scan region guide. If `true` and a scan region ratio is configured, recalculates the region.
   *
   * @remarks
   * This method controls the scan region guide (the visual border/overlay indicating where
   * documents should be positioned within the viewfinder). It only operates when a scan region
   * ratio is configured via {@link DocumentScannerViewConfig.scanRegion}.
   *
   * **When enabled is `true`:**
   * - Checks if {@link ScanRegion.ratio} is configured (not empty)
   * - If configured, calls {@link calculateScanRegion} to compute and display the guide
   * - If not configured, does nothing (no guide to show)
   *
   * **When enabled is `false` or `undefined`:**
   * - Does nothing (guide remains hidden or in current state)
   *
   * The scan region guide helps users:
   * - Align documents properly within the viewfinder
   * - Understand where document detection will occur
   * - Ensure documents fit within the capture area
   * - Maintain consistent framing across multiple scans
   *
   * Called by:
   * - {@link handleResize} - To hide/show guide during resize events
   * - {@link toggleBoundsDetection} - To show guide when bounds detection is enabled
   * - {@link toggleSelectCameraBox} - To update guide after camera/resolution changes
   * - {@link attachOptionClickListeners} - To update guide after selecting camera/resolution options
   *
   * @see {@link calculateScanRegion} - Performs the scan region calculation
   * @see {@link ScanRegion} - The scan region configuration interface
   * @see {@link DocumentScannerViewConfig.scanRegion} - Where the region ratio is configured
   * @see {@link handleResize} - Debounced resize handler that calls this method
   *
   * @internal
   */
  private toggleScanGuide(enabled?: boolean) {
    if (enabled && !isEmptyObject(this.config?.scanRegion?.ratio)) {
      this.calculateScanRegion();
    }
  }

  /**
   * Calculate and apply the scan region guide based on configured aspect ratio and viewport dimensions.
   *
   * @remarks
   * This method performs complex calculations to determine the optimal scan region (the rectangular
   * guide overlay in the viewfinder) that helps users frame documents consistently. The calculation
   * adapts to different device orientations, screen sizes, and configured document aspect ratios.
   *
   * **Calculation Process:**
   *
   * 1. **Get Viewport Dimensions:**
   *    - Retrieves the visible region of the video feed (may be cropped by camera view styling)
   *    - Gets the full video dimensions from the video element
   *
   * 2. **Apply Bottom Margin:**
   *    - Subtracts {@link ScanRegion.regionBottomMargin} from visible height
   *    - Allows positioning the guide higher in the viewport (useful for avoiding UI elements)
   *
   * 3. **Calculate Base Unit (Orientation-Aware):**
   *    - **Landscape:** Uses 75% of effective height as constraint, scales to target aspect ratio
   *    - **Portrait:** Uses 90% of width as constraint, scales to target aspect ratio
   *    - Adjusts if calculated dimensions exceed viewport bounds
   *
   * 4. **Scale to Actual Dimensions:**
   *    - Multiplies base unit by {@link ScanRegion.ratio} width and height
   *    - Results in pixel dimensions that fit within viewport while maintaining aspect ratio
   *
   * 5. **Center the Region:**
   *    - Calculates offsets to horizontally center the region
   *    - Vertically centers within the effective height (after bottom margin)
   *
   * 6. **Convert to Percentage Coordinates:**
   *    - Transforms pixel coordinates to percentages relative to full video dimensions
   *    - Accounts for visible region offset (in case video is cropped)
   *    - Rounds percentages to integers for clean rendering
   *
   * 7. **Apply to Camera View:**
   *    - Makes the scan region mask visible via {@link CameraView.setScanRegionMaskVisible}
   *    - Sets the region bounds via {@link CameraEnhancer.setScanRegion}
   *    - The mask is styled with {@link ScanRegion.style} (border width and color)
   *
   * **Example Configuration:**
   * For a 3:2 aspect ratio document with 20px bottom margin and green 3px border:
   * ```typescript
   * scanRegion: {
   *   ratio: { width: 2, height: 3 },
   *   regionBottomMargin: 20,
   *   style: { strokeWidth: 3, strokeColor: "green" }
   * }
   * ```
   *
   * The method gracefully handles edge cases:
   * - Camera not open: exits early without calculation
   * - No visible region: exits early without calculation
   * - Extreme aspect ratios: adjusts to fit within viewport constraints
   *
   * Called by {@link toggleScanGuide} whenever the scan region needs to be shown or recalculated.
   *
   * @see {@link ScanRegion} - The scan region configuration interface
   * @see {@link DocumentScannerViewConfig.scanRegion} - Where the region is configured
   * @see {@link toggleScanGuide} - Controls when this calculation is triggered
   * @see {@link handleResize} - Triggers recalculation on viewport resize
   * @see {@link CameraView.setScanRegionMaskVisible} - Shows/hides the region overlay
   * @see {@link CameraEnhancer.setScanRegion} - Applies the calculated region bounds
   *
   * @internal
   */
  private calculateScanRegion() {
    const { cameraEnhancer, cameraView } = this.resources;

    if (!cameraEnhancer?.isOpen()) return;

    // Get visible region of video
    const visibleRegion = cameraView.getVisibleRegionOfVideo({ inPixels: true });

    if (!visibleRegion) return;

    // Get the total video dimensions
    const video = cameraView.getVideoElement();
    const totalWidth = video.videoWidth;
    const totalHeight = video.videoHeight;

    // Get the document ratio for the specific document type

    const targetRatio = this.config?.scanRegion?.ratio;

    // Calculate the base unit to scale the document dimensions
    let baseUnit: number;

    // Calculate bottom margin
    const bottomMarginPx = this.config?.scanRegion?.regionBottomMargin ?? 0; // 5 * 16 is 5rem in pixels
    const effectiveHeightWithMargin = visibleRegion.height - bottomMarginPx;

    if (visibleRegion.width > visibleRegion.height) {
      // Landscape orientation
      const availableHeight = effectiveHeightWithMargin * 0.75;
      baseUnit = availableHeight / targetRatio.height;

      // Check if width would exceed bounds
      const resultingWidth = baseUnit * targetRatio.width;
      if (resultingWidth > visibleRegion.width * 0.9) {
        // If too wide, recalculate using width as reference
        baseUnit = (visibleRegion.width * 0.9) / targetRatio.width;
      }
    } else {
      // Portrait orientation
      const availableWidth = visibleRegion.width * 0.9;
      baseUnit = availableWidth / targetRatio.width;

      // Check if height would exceed bounds
      const resultingHeight = baseUnit * targetRatio.height;
      if (resultingHeight > effectiveHeightWithMargin * 0.75) {
        // If too tall, recalculate using height as reference
        baseUnit = (effectiveHeightWithMargin * 0.75) / targetRatio.height;
      }
    }

    // Calculate actual dimensions in pixels
    const actualWidth = baseUnit * targetRatio.width;
    const actualHeight = baseUnit * targetRatio.height;

    // Calculate the offsets to center the region horizontally and vertically
    const leftOffset = (visibleRegion.width - actualWidth) / 2;
    const topOffset = (effectiveHeightWithMargin - actualHeight) / 2;

    // Calculate pixel coordinates of the scan region relative to the visible region
    const scanLeft = leftOffset;
    const scanRight = leftOffset + actualWidth;
    const scanTop = topOffset;
    const scanBottom = topOffset + actualHeight;

    // Convert to percentages relative to the TOTAL video size, considering the visible region offset
    const absoluteLeft = visibleRegion.x + scanLeft;
    const absoluteRight = visibleRegion.x + scanRight;
    const absoluteTop = visibleRegion.y + scanTop;
    const absoluteBottom = visibleRegion.y + scanBottom;

    const left = (absoluteLeft / totalWidth) * 100;
    const right = (absoluteRight / totalWidth) * 100;
    const top = (absoluteTop / totalHeight) * 100;
    const bottom = (absoluteBottom / totalHeight) * 100;

    // Apply scan region
    const region = {
      left: Math.round(left),
      right: Math.round(right),
      top: Math.round(top),
      bottom: Math.round(bottom),
      isMeasuredInPercentage: true,
    };

    cameraView?.setScanRegionMaskVisible(true);
    cameraEnhancer.setScanRegion(region);
  }

  /**
   * Open and initialize the camera with configured capture modes and UI elements.
   *
   * @returns Promise that resolves when the camera is fully initialized and ready
   *
   * @remarks
   * This method is the primary entry point for camera initialization and performs comprehensive
   * setup of the camera, UI elements, capture modes, and event listeners.
   *
   * **Continuous Scanning Mode Optimization:**
   * When {@link SharedResources.enableContinuousScanning} is true and the camera is already open:
   * - Skips full reinitialization to improve performance
   * - Shows the scanner container
   * - Updates the continuous scan "Done" button via {@link updateContinuousScanDoneButton}
   * - Restarts frame capturing if it was stopped (when returning from correction/result views)
   * - Returns early without full initialization
   *
   * **Full Initialization Steps:**
   *
   * 1. **Display Loading Overlay:**
   *    - Shows "Initializing camera..." message via {@link showScannerLoadingOverlay}
   *    - Makes the scanner container visible
   *
   * 2. **Open Camera Feed:**
   *    - Appends Camera Enhancer UI element to container if not already present
   *    - Opens the camera via {@link CameraEnhancer.open}
   *    - Resumes camera if it was paused via {@link CameraEnhancer.resume}
   *    - Handles camera access errors (e.g., camera in use by another application)
   *
   * 3. **Set Default Resolution:**
   *    - Attempts to set 2K resolution (2560x1440) for optimal document detection
   *    - Gracefully handles resolution errors (logs warning, continues with available resolution)
   *
   * 4. **Initialize UI Elements:**
   *    - Calls {@link initializeElements} to query shadow DOM and attach event handlers
   *    - Only performed once (tracked by `initializedDCE` flag)
   *
   * 5. **Attach Resize Listener:**
   *    - Adds {@link handleResize} to window resize events for scan region recalculation
   *
   * 6. **Apply Capture Modes:**
   *    - Enables Bounds Detection via {@link toggleBoundsDetection} (based on configuration)
   *    - Enables Smart Capture via {@link toggleSmartCapture} (based on configuration)
   *    - Enables Auto Crop via {@link toggleAutoCrop} (based on configuration)
   *
   * 7. **Configure Continuous Scan UI:**
   *    - Shows/updates the "Done" button if there are completed scans
   *    - Hides the "Done" button if no scans completed yet
   *
   * 8. **Hide Loading Overlay:**
   *    - Removes the loading overlay via {@link hideScannerLoadingOverlay}
   *
   * **Error Handling:**
   * - Camera access errors show user-friendly messages (e.g., "camera in use")
   * - Resolution errors are logged but don't block initialization
   * - All errors trigger camera cleanup via {@link closeCamera}
   * - Scan promise resolves with {@link EnumResultStatus.RS_FAILED} status
   *
   * Called by {@link launch} when starting a scan operation.
   *
   * @throws {Error} If camera access is denied or camera initialization fails
   *
   * @see {@link closeCamera} - Closes the camera and releases resources
   * @see {@link initializeElements} - Initializes UI element references
   * @see {@link toggleBoundsDetection} - Enables bounds detection mode
   * @see {@link toggleSmartCapture} - Enables smart capture mode
   * @see {@link toggleAutoCrop} - Enables auto crop mode
   * @see {@link handleResize} - Handles viewport resize events
   * @see {@link CameraEnhancer.open} - Dynamsoft method to open camera
   * @see {@link CameraEnhancer.setResolution} - Dynamsoft method to set camera resolution
   *
   * @internal
   */
  async openCamera(): Promise<void> {
    try {
      const { cameraEnhancer, cameraView } = this.resources;
      const configContainer = getElement(this.config.container);

      // In continuous scanning mode, if camera is already open, skip reinitialization
      if (this.resources.enableContinuousScanning && cameraEnhancer?.isOpen()) {
        configContainer.style.display = "block";
        // Just update the done button and return early
        if (this.DCE_ELEMENTS.continuousScanDoneBtn) {
          if (this.resources.completedScansCount > 0) {
            this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "block";
            this.updateContinuousScanDoneButton();
          } else {
            this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "none";
          }
        }
        // Restart capturing if it was stopped (when returning from correction/result view)
        if ((this.resources.cvRouter as any)._isPauseScan) {
          await this.resources.cvRouter.startCapturing(this.config.utilizedTemplateNames.detect);
        }
        return;
      }

      this.showScannerLoadingOverlay("Initializing camera...");

      configContainer.style.display = "block";

      if (!cameraEnhancer?.isOpen()) {
        const currentCameraView = cameraView.getUIElement();
        if (!currentCameraView.parentElement) {
          configContainer.append(currentCameraView);
        }

        try {
          await cameraEnhancer.open();
        } catch (error: any) {
          // Handle camera access errors (e.g., camera already in use by another tab)
          const errorMessage = error?.message || error;
          if (errorMessage.includes("in use") || errorMessage.includes("not available")) {
            throw new Error(
              "Camera is already in use by another tab or application. Please close other tabs/applications using the camera and try again."
            );
          }
          throw error;
        }
      } else if (cameraEnhancer?.isPaused()) {
        try {
          await cameraEnhancer.resume();
        } catch (error) {
          console.warn("Camera error (openCamera - resume after pause):", error);
        }
      }

      // Try to set default as 2k
      if (cameraEnhancer?.isOpen()) {
        try {
          await cameraEnhancer.setResolution({
            width: 2560,
            height: 1440,
          });
        } catch (error) {
          console.warn("Camera error (openCamera - setResolution):", error);
        }
      }

      // Assign boundsDetection, smartCapture, and takePhoto element
      if (!this.initializedDCE && cameraEnhancer?.isOpen()) {
        await this.initializeElements();
      }

      // Add resize
      window.addEventListener("resize", this.handleResize);

      // Toggle capture modes
      await this.toggleBoundsDetection(this.boundsDetectionEnabled);
      await this.toggleSmartCapture(this.smartCaptureEnabled);
      await this.toggleAutoCrop(this.autoCropEnabled);

      // Show/hide and update continuous scan done button
      if (this.DCE_ELEMENTS.continuousScanDoneBtn) {
        if (this.resources.enableContinuousScanning && this.resources.completedScansCount > 0) {
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "block";
          this.updateContinuousScanDoneButton();
        } else {
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "none";
        }
      }
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);
      this.closeCamera();
      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "DDS Open Camera Error",
        },
      };
      this.currentScanResolver(result);
    } finally {
      this.hideScannerLoadingOverlay();
    }
  }

  /**
   * Close the camera and clean up all associated resources and event listeners.
   *
   * @param hideContainer - Whether to hide the scanner container element. Defaults to `true`.
   *
   * @remarks
   * This method performs comprehensive cleanup of camera resources, UI elements, and event
   * listeners. It's designed to handle cleanup gracefully even if the camera is already closed.
   *
   * **Cleanup Steps:**
   *
   * 1. **Remove Event Listeners:**
   *    - Removes the window resize listener ({@link handleResize})
   *    - Clears any pending resize timer to prevent delayed execution
   *
   * 2. **Disconnect Observers:**
   *    - Disconnects the toast {@link MutationObserver} created by {@link setupToastObserver}
   *
   * 3. **Update Container Visibility:**
   *    - If `hideContainer` is `true`: Hides the scanner container (display: none)
   *    - If `hideContainer` is `false`: Keeps the container visible
   *
   * 4. **Remove Camera View UI:**
   *    - Removes the Camera Enhancer UI element from the DOM
   *    - Only removes if it's currently attached to a parent
   *
   * 5. **Close Camera:**
   *    - Closes the camera feed via {@link CameraEnhancer.close}
   *    - Gracefully handles errors (camera may already be closed)
   *    - Errors are logged as warnings but don't throw exceptions
   *
   * 6. **Stop Frame Capturing:**
   *    - Stops the Capture Vision Router from processing frames via {@link stopCapturing}
   *    - Clears any drawn overlays from the camera view
   *
   * **When to Use:**
   * - **hideContainer = true (default):** When exiting the scanner completely (scan complete, user cancelled)
   * - **hideContainer = false:** When keeping the scanner visible but closing the camera (e.g., processing uploaded file)
   *
   * **Error Handling:**
   * All camera-related errors are caught and logged as warnings instead of throwing, ensuring
   * cleanup completes even if the camera is in an unexpected state.
   *
   * Called by:
   * - {@link handleCloseBtn} - User clicks the close (X) button
   * - {@link handleContinuousScanDone} - User clicks the "Done" button in continuous mode
   * - {@link takePhoto} - After capture in single-scan mode
   * - {@link uploadImage} - On error or in single-scan mode
   * - {@link openCamera} - On initialization error (cleanup)
   *
   * @see {@link openCamera} - Opens the camera and initializes resources
   * @see {@link stopCapturing} - Stops frame capture and clears overlays
   * @see {@link pauseCamera} - Pauses the camera without full cleanup
   * @see {@link handleResize} - The resize handler that gets removed
   * @see {@link setupToastObserver} - Creates the observer that gets disconnected
   *
   * @internal
   */
  closeCamera(hideContainer: boolean = true) {
    // Remove resize event listener
    window.removeEventListener("resize", this.handleResize);
    // Clear any existing resize timer
    this.resizeTimer && window.clearTimeout(this.resizeTimer);

    // Temporary: Cleanup toast observer (can be removed when DCE updates)
    this.toastObserver?.disconnect();

    const { cameraEnhancer, cameraView } = this.resources;

    const configContainer = getElement(this.config.container);
    configContainer.style.display = hideContainer ? "none" : "block";

    if (cameraView.getUIElement().parentElement) {
      configContainer.removeChild(cameraView.getUIElement());
    }

    try {
      cameraEnhancer?.close();
    } catch (error) {
      console.warn("Camera error (closeCamera):", error);
    }
    this.stopCapturing();
    this.isClosing = false;
  }

  /**
   * Pause the camera feed without releasing camera resources.
   *
   * @remarks
   * This method temporarily pauses the camera video stream while keeping the camera device
   * allocated. This is useful for temporarily suspending the video feed during processing
   * operations while maintaining the ability to quickly resume.
   *
   * **Use Cases:**
   * - Pausing during image normalization in continuous scanning mode
   * - Temporarily stopping video during animations
   * - Reducing resource usage during non-critical operations
   *
   * **Difference from {@link closeCamera}:**
   * - `pauseCamera`: Pauses the video stream, camera remains allocated, quick to resume
   * - `closeCamera`: Fully closes camera, releases device, requires full reinitialization
   *
   * The camera can be resumed via {@link CameraEnhancer.resume} or {@link openCamera}.
   *
   * Errors during pause are logged as warnings but don't throw exceptions, ensuring
   * the calling code can continue even if the camera is in an unexpected state.
   *
   * Called by {@link takePhoto} during image processing in continuous scanning mode.
   *
   * @see {@link openCamera} - Opens or resumes the camera
   * @see {@link closeCamera} - Fully closes the camera
   * @see {@link CameraEnhancer.pause} - Dynamsoft method to pause the camera
   * @see {@link CameraEnhancer.resume} - Dynamsoft method to resume the camera
   *
   * @internal
   */
  pauseCamera() {
    const { cameraEnhancer } = this.resources;
    try {
      cameraEnhancer?.pause();
    } catch (error) {
      // Silently handle camera pause errors
      console.warn("Camera error (pauseCamera):", error);
    }
  }

  /**
   * Stop frame capturing and clear all visual overlays from the camera view.
   *
   * @remarks
   * This method stops the Capture Vision Router from processing camera frames and removes
   * all drawn overlays (such as detected document boundaries) from the camera view.
   *
   * **What it does:**
   * 1. Stops the {@link CaptureVisionRouter} from capturing and analyzing frames
   * 2. Clears all inner drawing items (boundary overlays, guides) from the {@link CameraView}
   *
   * **What it doesn't do:**
   * - Doesn't close the camera (video continues streaming)
   * - Doesn't release camera resources
   * - Doesn't remove event listeners or observers
   *
   * This method is typically called when:
   * - Bounds Detection mode is disabled (no need to analyze frames)
   * - The camera is being closed (as part of {@link closeCamera})
   * - Switching between different capture modes
   *
   * The camera view is cleared to remove stale boundary overlays that may no longer be
   * relevant after stopping frame analysis.
   *
   * Called by:
   * - {@link closeCamera} - During camera cleanup
   * - {@link toggleBoundsDetection} - When disabling bounds detection
   *
   * @see {@link toggleBoundsDetection} - Starts/stops bounds detection mode
   * @see {@link closeCamera} - Full camera cleanup including stopping capture
   * @see {@link CaptureVisionRouter.stopCapturing} - Dynamsoft method to stop frame capture
   * @see {@link CameraView.clearAllInnerDrawingItems} - Dynamsoft method to clear overlays
   *
   * @internal
   */
  stopCapturing() {
    const { cameraView, cvRouter } = this.resources;

    cvRouter.stopCapturing();
    cameraView.clearAllInnerDrawingItems();
  }

  /**
   * Determine the current capture flow type based on enabled capture modes.
   *
   * @returns The {@link EnumFlowType} representing the current capture workflow
   *
   * @remarks
   * This method returns the flow type that will be recorded in the {@link DocumentResult},
   * allowing downstream components to understand how the document was captured. The flow
   * type is determined by checking capture mode flags in priority order.
   *
   * **Priority Order (highest to lowest):**
   * 1. **Auto Crop** ({@link EnumFlowType.AUTO_CROP}): If {@link autoCropEnabled} is true
   * 2. **Smart Capture** ({@link EnumFlowType.SMART_CAPTURE}): If {@link smartCaptureEnabled} is true
   * 3. **Manual** ({@link EnumFlowType.MANUAL}): Default if no automatic modes are enabled
   *
   * The flow type provides context for:
   * - Analytics and usage tracking
   * - Determining which views to route through (correction, result)
   * - Understanding user behavior and mode preferences
   * - Debugging and support scenarios
   *
   * Called by {@link takePhoto} to set the `_flowType` property in the {@link DocumentResult}.
   *
   * @see {@link EnumFlowType} - All possible flow type values
   * @see {@link takePhoto} - Uses this method to determine the flow type
   * @see {@link DocumentResult._flowType} - Where the flow type is stored
   * @see {@link toggleAutoCrop} - Sets {@link autoCropEnabled}
   * @see {@link toggleSmartCapture} - Sets {@link smartCaptureEnabled}
   *
   * @internal
   */
  private getFlowType(): EnumFlowType {
    // Find flow type
    return this.autoCropEnabled
      ? EnumFlowType.AUTO_CROP
      : this.smartCaptureEnabled
      ? EnumFlowType.SMART_CAPTURE
      : EnumFlowType.MANUAL;
  }

  /**
   * Track frame clarity scores to identify the clearest frame for optimal capture quality.
   *
   * @param result - The {@link CapturedResult} containing clarity information for the current frame
   *
   * @remarks
   * This method implements frame verification by analyzing clarity scores across multiple frames
   * to automatically select the clearest (sharpest) frame for capture. This significantly
   * improves capture quality by avoiding blurry frames caused by camera shake or poor focus.
   *
   * **Algorithm Overview:**
   *
   * 1. **Extract Clarity Score:**
   *    - Reads the internal `_clarity` property from the {@link CapturedResult}
   *    - Returns early if no clarity score is available
   *
   * 2. **Reset Max Clarity (Timeout):**
   *    - If 3 seconds have passed since the last max clarity update, resets to 0
   *    - Prevents stale clarity values from influencing new capture attempts
   *
   * 3. **Update Max Clarity:**
   *    - If current clarity exceeds the maximum, updates all tracking variables:
   *      - `maxClarity`: The highest clarity score seen
   *      - `maxClarityTimestamp`: When this max was recorded
   *      - `maxClarityImg`: The image data from this frame
   *      - `maxClarityFrameId`: The frame ID
   *      - Resets `nonImprovingClarityFrameCount` to 0
   *
   * 4. **Track Non-Improving Frames:**
   *    - Increments `nonImprovingClarityFrameCount` if clarity doesn't improve
   *    - Resets to 0 if clarity improves
   *    - Used to detect when clarity has stabilized
   *
   * 5. **Confirm Clearest Frame:**
   *    - After 1 second stabilization time
   *    - And 2+ consecutive non-improving frames
   *    - Sets `clearestFrameId` to `maxClarityFrameId`
   *    - This confirms the clearest frame is ready for capture
   *
   * 6. **Maintain Clarity History:**
   *    - Stores last 50 clarity scores in `clarityHistory`
   *    - Used for trend analysis and non-improving frame detection
   *
   * **Configuration Constants:**
   * - `maxClarityResetTimeoutMs`: 3000ms - Reset max clarity after this timeout
   * - `minStabilizationTimeMs`: 1000ms - Wait this long before confirming clearest frame
   * - `minNonImprovingClarityFramesToConfirm`: 2 - Require this many non-improving frames
   *
   * This feature is enabled by {@link DocumentScannerViewConfig.enableFrameVerification} (default: true).
   * When enabled, {@link takePhoto} uses `maxClarityImg` instead of the latest frame for
   * optimal quality.
   *
   * Called by {@link handleBoundsDetection} for each frame when frame verification is enabled.
   *
   * @see {@link takePhoto} - Uses the clearest frame image for capture
   * @see {@link handleBoundsDetection} - Calls this method for each processed frame
   * @see {@link DocumentScannerViewConfig.enableFrameVerification} - Configuration flag
   *
   * @internal
   */
  private trackFrameClarity(result: CapturedResult) {
    ++this.currentFrameId;
    const clarity = (result as any)._clarity;

    if (!clarity) return;

    const currentTime = Date.now();
    const maxClarityResetTimeoutMs = 3000;
    const minStabilizationTimeMs = 1000;
    const minNonImprovingClarityFramesToConfirm = 2;

    if (this.maxClarityTimestamp < currentTime - maxClarityResetTimeoutMs) {
      this.maxClarity = 0;
    }

    if (clarity > this.maxClarity) {
      this.maxClarity = clarity;
      this.maxClarityTimestamp = currentTime;
      this.maxClarityImg = this.originalImageData;
      this.maxClarityFrameId = this.currentFrameId;
      this.nonImprovingClarityFrameCount = 0;
    }

    if (clarity <= this.clarityHistory[this.clarityHistory.length - 1]) {
      ++this.nonImprovingClarityFrameCount;
    } else {
      this.nonImprovingClarityFrameCount = 0;
    }

    if (
      this.clearestFrameId != this.maxClarityFrameId &&
      this.maxClarityTimestamp + minStabilizationTimeMs <= currentTime &&
      this.nonImprovingClarityFrameCount >= minNonImprovingClarityFramesToConfirm
    ) {
      this.clearestFrameId = this.maxClarityFrameId;
    }

    this.clarityHistory.push(clarity);
    if (this.clarityHistory.length > 50) {
      this.clarityHistory.shift();
    }
  }

  async takePhoto() {
    // Prevent concurrent captures
    if (this.isCapturing) {
      return;
    }
    this.isCapturing = true;

    try {
      const { cameraEnhancer, onResultUpdated } = this.resources;

      const shouldUseLatestFrame =
        !this.boundsDetectionEnabled || (this.boundsDetectionEnabled && this.capturedResultItems?.length <= 1);

      if (this.frameVerificationEnabled && this.maxClarityImg && !shouldUseLatestFrame) {
        this.originalImageData = this.maxClarityImg;
      } else {
        this.originalImageData = shouldUseLatestFrame ? cameraEnhancer?.fetchImage() : this.originalImageData;
      }

      // Reset captured items if not using bounds detection
      let correctedImageResult = null;
      let detectedQuadrilateral: Quadrilateral = null;
      if (shouldUseLatestFrame) {
        this.capturedResultItems = [];
        const { width, height } = this.originalImageData;
        detectedQuadrilateral = {
          points: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
          ],
          area: height * width,
        } as Quadrilateral;
      } else {
        detectedQuadrilateral = (
          this.capturedResultItems.find(
            (item) => item.type === EnumCapturedResultItemType.CRIT_DETECTED_QUAD
          ) as DetectedQuadResultItem
        )?.location;
      }

      // If theres no detected quads, we shouldnt convert to scanRegionCoordinates since we're using the full image.
      if (!isEmptyObject(this.config?.scanRegion?.ratio) && !shouldUseLatestFrame) {
        // If scan region is enabled, convert to scanRegionCoordinates
        detectedQuadrilateral.points = detectedQuadrilateral.points.map(
          (point) => this.resources.cameraEnhancer?.convertToScanRegionCoordinates(point) || point
        ) as Quadrilateral["points"];
      }

      const flowType = this.getFlowType();

      // Show loading indicator and disable buttons
      if (this.resources.enableContinuousScanning) {
        // Disable the capture button during processing
        if (this.DCE_ELEMENTS.takePhotoBtn) {
          this.DCE_ELEMENTS.takePhotoBtn.style.pointerEvents = "none";
          this.DCE_ELEMENTS.takePhotoBtn.style.opacity = "0.5";
        }
        // Disable the done button during processing
        if (this.DCE_ELEMENTS.continuousScanDoneBtn) {
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.pointerEvents = "none";
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.opacity = "0.5";
        }
      } else {
        this.showScannerLoadingOverlay("Processing image...");
      }

      // Pause camera before normalizing image (only in continuous scanning mode)
      if (this.resources.enableContinuousScanning) {
        this.resources.cameraEnhancer?.pause();
      }

      // Retrieve corrected image result
      correctedImageResult = await this.normalizeImage(detectedQuadrilateral.points, this.originalImageData);

      // Resume camera after normalization (only in continuous scanning mode)
      if (this.resources.enableContinuousScanning) {
        await this.resources.cameraEnhancer?.resume();
      }

      // Clean up camera and capture (only in single scan mode)
      if (!this.resources.enableContinuousScanning) {
        // turn off smart capture (and also auto crop) before closing camera
        await this.toggleSmartCapture(false);
        this.closeCamera();
      }

      // Hide loading indicator and re-enable buttons
      if (this.resources.enableContinuousScanning) {
        // Re-enable the capture button after processing
        if (this.DCE_ELEMENTS.takePhotoBtn) {
          this.DCE_ELEMENTS.takePhotoBtn.style.pointerEvents = "auto";
          this.DCE_ELEMENTS.takePhotoBtn.style.opacity = "1";
        }
        // Re-enable the done button after processing
        if (this.DCE_ELEMENTS.continuousScanDoneBtn) {
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.pointerEvents = "auto";
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.opacity = "1";
        }
      } else {
        this.hideScannerLoadingOverlay(true);
      }

      const result: DocumentResult = {
        status: {
          code: EnumResultStatus.RS_SUCCESS,
          message: "Success",
        },
        originalImageResult: this.originalImageData,
        correctedImageResult,
        detectedQuadrilateral,
        _flowType: flowType,
      };

      // Show animation in continuous scanning mode
      if (this.resources.enableContinuousScanning) {
        // Only show animation if not routing through correction/result views
        if (!this.config._showCorrectionView && !this.config._showResultView) {
          const canvas = correctedImageResult.toCanvas();

          // Update thumbnail first so we can calculate its position
          this.updateThumbnail(canvas);

          // Pause camera during animation
          this.resources.cameraEnhancer?.pause();

          // Show floating image animation and wait for it to complete
          await this.animateFloatingImage(canvas);

          // Resume camera after animation
          await this.resources.cameraEnhancer?.resume();
        }
      }

      // Emit result through shared resources
      onResultUpdated?.(result);

      // Resolve scan promise
      this.currentScanResolver(result);
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);

      // Clean up overlay and re-enable buttons
      if (this.resources.enableContinuousScanning) {
        // Re-enable the capture button
        if (this.DCE_ELEMENTS.takePhotoBtn) {
          this.DCE_ELEMENTS.takePhotoBtn.style.pointerEvents = "auto";
          this.DCE_ELEMENTS.takePhotoBtn.style.opacity = "1";
        }
        // Re-enable the done button
        if (this.DCE_ELEMENTS.continuousScanDoneBtn) {
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.pointerEvents = "auto";
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.opacity = "1";
        }
        // Resume camera if it was paused (check if camera enhancer still exists)
        if (this.resources.cameraEnhancer?.isPaused()) {
          try {
            await this.resources.cameraEnhancer.resume();
          } catch (error) {
            console.warn("Camera error (after correction/result - resume):", error);
          }
        }
      } else {
        this.closeCamera();
      }

      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "Error capturing image",
        },
      };
      this.currentScanResolver(result);
    } finally {
      // Reset capturing flag
      this.isCapturing = false;
    }
  }

  async handleBoundsDetection(result: CapturedResult) {
    this.capturedResultItems = result.items;

    if (!result.items?.length) return;

    const originalImage = result.items.filter(
      (item) => item.type === EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE
    ) as OriginalImageResultItem[];
    this.originalImageData = originalImage[0]?.imageData;

    if (this.frameVerificationEnabled && this.boundsDetectionEnabled) {
      this.trackFrameClarity(result);
    }

    if (this.smartCaptureEnabled || this.autoCropEnabled) {
      this.handleAutoCaptureMode(result);
    }
  }

  /**
   * Normalize an image with DDN given a set of points
   * @param points - points provided by either users or DDN's detect quad
   * @returns normalized image by DDN
   */
  private async handleAutoCaptureMode(result: CapturedResult) {
    /** If "Smart Capture" or "Auto Crop" is checked, the library uses the document boundaries found in consecutive
     * cross verified frames to decide whether conditions are suitable for automatic normalization.
     */
    if (result.items.length <= 1) {
      this.crossVerificationCount = 0;
      return;
    }

    if (this.resources.enableContinuousScanning) {
      const timeSinceLastCapture = Date.now() - this.lastCaptureTimestamp;
      if (timeSinceLastCapture < this.CONTINUOUS_SCAN_COOLDOWN_MS) {
        return;
      }
    }

    if ((result.processedDocumentResult?.detectedQuadResultItems?.[0] as any)?.crossVerificationStatus === 1)
      this.crossVerificationCount++;

    /**
     * In our case, we determine a good condition for "automatic normalization" to be
     * "getting document boundary detected after 2 cross verified results".
     */
    if (this.crossVerificationCount >= this.config?.minVerifiedFramesForAutoCapture) {
      this.crossVerificationCount = 0;
      this.lastCaptureTimestamp = Date.now();

      await this.takePhoto();
    }
  }

  async launch(): Promise<DocumentResult> {
    try {
      await this.initialize();

      const { cvRouter, cameraEnhancer } = this.resources;

      return new Promise(async (resolve) => {
        this.currentScanResolver = resolve;

        // Start capturing
        await this.openCamera();

        if (this.boundsDetectionEnabled) {
          await cvRouter.startCapturing(this.config.utilizedTemplateNames.detect);
        }

        this.toggleScanGuide(true);

        // By default, cameraEnhancer captures grayscale images to optimize performance.
        // To capture RGB Images, we set the Pixel Format to EnumImagePixelFormat.IPF_ABGR_8888
        if (cameraEnhancer?.isOpen()) {
          try {
            cameraEnhancer.setPixelFormat(EnumImagePixelFormat.IPF_ABGR_8888);
          } catch (error) {
            console.warn("Camera error (takePhoto - setPixelFormat):", error);
          }
        }

        // Reset crossVerificationCount
        this.crossVerificationCount = 0;
      });
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error("DDS Launch error: ", errMsg);
      this.closeCamera();
      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "DDS Launch error",
        },
      };
      this.currentScanResolver(result);
    }
  }

  async normalizeImage(
    points: Quadrilateral["points"],
    originalImageData: OriginalImageResultItem["imageData"]
  ): Promise<DeskewedImageResultItem | EnhancedImageResultItem> {
    const { cvRouter } = this.resources;

    const settings = await cvRouter.getSimplifiedSettings(this.config.utilizedTemplateNames.normalize);
    settings.roiMeasuredInPercentage = false;
    settings.roi.points = points;
    if (this.resources.binaryImage) {
      settings.documentSettings.colourMode = EnumImageColourMode.ICM_BINARY;
    }
    await cvRouter.updateSettings(this.config.utilizedTemplateNames.normalize, settings);

    const result = await cvRouter.capture(originalImageData, this.config.utilizedTemplateNames.normalize);
    
    // When binaryImage is enabled, the result is in enhancedImageResultItems (from ST_IMAGE_ENHANCEMENT stage)
    // Otherwise, it's in deskewedImageResultItems (from ST_DOCUMENT_DESKEWING stage)
    if (this.resources.binaryImage && result?.processedDocumentResult?.enhancedImageResultItems?.[0]) {
      return result.processedDocumentResult.enhancedImageResultItems[0];
    }
    if (result?.processedDocumentResult?.deskewedImageResultItems?.[0]) {
      return result.processedDocumentResult.deskewedImageResultItems[0];
    }
  }
}

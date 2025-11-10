import {
  EnumCapturedResultItemType,
  EnumImagePixelFormat,
  OriginalImageResultItem,
  Quadrilateral,
  CapturedResultReceiver,
  CapturedResult,
  DetectedQuadResultItem,
  DeskewedImageResultItem,
  MultiFrameResultCrossFilter,
} from "dynamsoft-capture-vision-bundle";
import { SharedResources } from "../DocumentScanner";
import {
  DEFAULT_TEMPLATE_NAMES,
  DocumentResult,
  EnumFlowType,
  EnumResultStatus,
  UtilizedTemplateNames,
} from "./utils/types";
import { DEFAULT_LOADING_SCREEN_STYLE, showLoadingScreen, showMinimalSpinner } from "./utils/LoadingScreen";
import { createStyle, findClosestResolutionLevel, getElement, isEmptyObject } from "./utils";

const DEFAULT_MIN_VERIFIED_FRAMES_FOR_CAPTURE = 2;

/**
 * Sets the scan region within the {@link DocumentScannerView} viewfinder for document scanning from the {@link @DocumentScannerViewConfig}.
 *
 * @remarks
 * MDS determines the scan region with the following steps:
 * 1. Use {@link ScanRegion.ratio} to set the height-to-width of the rectangular scanning region, then scale the rectangle up to fit within the viewfinder.
 * 2. Translate the rectangular up by the number of pixels specified by {@link ScanRegion.regionBottomMargin}.
 * 3. Create a visual border for the scanning region boundary on the viewfinder with a given stroke width in pixels, and a stroke color.
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
 * Only rare and edge-case scenarios require editing the UI template or MDS source code. MDS uses sane default values for all omitted properties.
 * 
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace with your actual license key
 *     scannerViewConfig: {
 *         cameraEnhancerUIPath: "../dist/document-scanner.ui.html", // Use the local file
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
   * Path to a Capture Vision template for scanning configuration.
   *
   * @public
   */
  templateFilePath?: string;
  /**
   * Path to the UI definition file (`.html`) for the {@link DocumentScannerView}.
   *
   * @remarks
   * This typically does not need to be set as MDS provides a default template for general use. You may set custom paths to self-host or customize the template, or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | self-hosting resources}
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
   * Capture Vision template names for detection and correction.
   *
   * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
   *
   * @remarks
   * This typically does not need to be set as MDS provides a default template for general use. You may set custom names to self-host resources, or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | self-hosting resources}
   * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV Templates}
   *
   * @public
   */
  utilizedTemplateNames?: UtilizedTemplateNames;
  /**
   * Set the document Bounds-Detection mode effective upon entering the {@link DocumentScannerView} UI.
   * 
   * @remarks
   * Bounds-Detection mode gets enabled when Smart Capture mode is enabled.
   *
   * @defaultValue True
   *
   * @public
   */
  enableBoundsDetectionMode?: boolean;
  /**
   * Set the Smart Capture mode effective upon entering the {@link DocumentScannerView} UI.
   * 
   * @remarks
   * Enabling Smart Capture mode enables Bounds-Detection mode too. Smart Capture mode gets enabled when Auto-Capture mode is enabled.
   *
   * @defaultValue False
   *
   * @public
   */
  enableSmartCaptureMode?: boolean;
  /**
   * Set the Auto-Crop mode effective upon entering the {@link DocumentScannerView} UI.
   * 
   * @remarks
   * Enabling Auto-Crop mode enables Smart Capture mode too.
   *
   * @defaultValue False
   *
   * @public
   */
  enableAutoCropMode?: boolean;
  /**
   * Defines the region within the viewport to detect documents.
   *
   * @see {@link ScanRegion}
   *
   * @public
   */
  scanRegion?: ScanRegion;
  /**
   * Sets minimum number of camera frames to detect document boundaries on Smart Capture mode.
   *
   * @remarks
   * Takes integer values between 1 and 5, inclusive.
   *
   * @defaultValue 2
   *
   * @public
   */
  minVerifiedFramesForAutoCapture?: number;
  /**
   * Sets the visibility of the mode selector menu.
   *
   * @defaultValue True
   *
   * @public
   */
  showSubfooter?: boolean;
  /**
   * Sets the visibility of the Dynamsoft branding message.
   *
   * @defaultValue True
   *
   * @public
   */
  showPoweredByDynamsoft?: boolean;
}

interface DCEElements {
  selectCameraBtn: HTMLElement | null;
  uploadImageBtn: HTMLElement | null;
  closeScannerBtn: HTMLElement | null;
  takePhotoBtn: HTMLElement | null;
  boundsDetectionBtn: HTMLElement | null;
  smartCaptureBtn: HTMLElement | null;
  autoCropBtn: HTMLElement | null;
  continuousScanDoneBtn: HTMLElement | null;
  thumbnailPreview: HTMLElement | null;
  thumbnailImg: HTMLImageElement | null;
  floatingImage: HTMLElement | null;
  floatingImageImg: HTMLImageElement | null;
}

// Implementation
export default class DocumentScannerView {
  // Capture Mode
  private boundsDetectionEnabled: boolean = true;
  private smartCaptureEnabled: boolean = false;
  private autoCropEnabled: boolean = false;
  private isCapturing: boolean = false;

  private resizeTimer: number | null = null;

  // Used for Smart Capture Mode - use crossVerificationStatus
  private crossVerificationCount: number;

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
  private minimalSpinner: ReturnType<typeof showMinimalSpinner> | null = null;
  private toastObserver: MutationObserver | null = null;

  private showScannerLoadingOverlay(message?: string) {
    const configContainer = getElement(this.config.container);
    this.loadingScreen = showLoadingScreen(configContainer, { message });
    configContainer.style.display = "block";
    configContainer.style.position = "relative";
  }

  private hideScannerLoadingOverlay(hideContainer: boolean = false) {
    this.loadingScreen?.hide();

    if (hideContainer) {
      getElement(this.config.container).style.display = "none";
    }
  }

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
    this.boundsDetectionEnabled = this.config?.enableBoundsDetectionMode ?? this.config?.enableSmartCaptureMode ?? this.config?.enableAutoCropMode ?? true; // Enabling any mode enables boundsDetection mode
    this.smartCaptureEnabled = (this.config?.enableSmartCaptureMode || this.config?.enableAutoCropMode) ?? false; // If autoCrop mode is enabled, smartCapture mode should be too
    this.autoCropEnabled = this.config?.enableAutoCropMode ?? false;

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
      (newSettings as any).documentSettings.scaleDownThreshold = 1000;
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

    // Setup toast observer to hide all toast messages on desktop
    this.setupToastObserver(DCEContainer.shadowRoot);

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

    this.initializedDCE = true;
  }

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
    this.DCE_ELEMENTS.thumbnailPreview?.addEventListener('touchstart', (e) => {
      e.preventDefault();
    }, { passive: false });

    this.DCE_ELEMENTS.thumbnailPreview?.addEventListener('touchend', (e) => {
      e.preventDefault();
    }, { passive: false });

    this.DCE_ELEMENTS.thumbnailPreview?.addEventListener('dblclick', (e) => {
      e.preventDefault();
    });

    // Add click handler for thumbnail
    this.DCE_ELEMENTS.thumbnailPreview?.addEventListener('click', async (e) => {
      e.preventDefault();
      // Only invoke callback if it's defined and we have a result
      if (this.resources.onThumbnailClicked && this.resources.result) {
        await this.resources.onThumbnailClicked(this.resources.result);
      }
    });

    // Prevent double-tap zoom on torch button
    const DCEContainer = getElement(this.config.container).children[getElement(this.config.container).children.length - 1];
    const torchButton = DCEContainer?.shadowRoot?.querySelector('.dce-mn-torch') as HTMLElement;
    if (torchButton) {
      torchButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
      }, { passive: false });

      torchButton.addEventListener('touchend', (e) => {
        e.preventDefault();
      }, { passive: false });

      torchButton.addEventListener('dblclick', (e) => {
        e.preventDefault();
      });
    }
  }

  private handleContinuousScanDone() {
    // Don't allow closing if a capture is in progress
    if (this.isCapturing) {
      console.warn('Cannot close during image capture');
      return;
    }

    // Stop continuous scanning by resolving with a cancelled status
    this.closeCamera();
    this.currentScanResolver?.({
      status: {
        code: EnumResultStatus.RS_CANCELLED,
        message: "Continuous scanning stopped by user",
      },
    });
  }

  private updateContinuousScanDoneButton() {
    if (!this.DCE_ELEMENTS.continuousScanDoneBtn) return;

    // Show/hide button based on completedScansCount
    if (this.resources.completedScansCount > 0) {
      this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "block";
    } else {
      this.DCE_ELEMENTS.continuousScanDoneBtn.style.display = "none";
    }

    const textEl = this.DCE_ELEMENTS.continuousScanDoneBtn?.querySelector('.dce-mn-continuous-scan-done-text');
    if (textEl) {
      textEl.textContent = `Done (${this.resources.completedScansCount || 0})`;
    }
  }

  private updateThumbnail(canvas: HTMLCanvasElement) {
    if (!this.DCE_ELEMENTS.thumbnailPreview || !this.DCE_ELEMENTS.thumbnailImg) return;
    if (!this.resources.enableContinuousScanning) return;

    // Convert canvas to data URL and set as thumbnail image source
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    this.DCE_ELEMENTS.thumbnailImg.src = dataUrl;
    this.DCE_ELEMENTS.thumbnailPreview.style.display = "block";
  }

  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  private setupToastObserver(shadowRoot: ShadowRoot) {
    const toastElement = shadowRoot.querySelector('.dce-mn-toast') as HTMLElement;
    if (!toastElement) return;

    // Check if device is desktop (fine pointer typically indicates mouse/trackpad)
    const isDesktop = window.matchMedia('(pointer: fine)').matches;
    const isIOSDevice = this.isIOS();

    // Hide the toast element by default on iOS and desktop to prevent any flash
    if (isIOSDevice || isDesktop) {
      toastElement.style.display = 'none';
    }

    // Also hide torch button on desktop with inline styles to ensure it takes precedence
    if (isDesktop) {
      const torchElement = shadowRoot.querySelector('.dce-mn-torch') as HTMLElement;
      if (torchElement) {
        torchElement.style.display = 'none';
      }
    }

    // Helper function to check and hide/show toast based on device type
    const checkToastContent = () => {
      // On desktop and iOS, always hide toast messages regardless of content
      if (isDesktop || isIOSDevice) {
        toastElement.style.display = 'none';
      } else {
        // On Android mobile, allow toast to show if it has content
        const text = toastElement.textContent || '';
        if (text.trim()) {
          toastElement.style.display = '';
        }
      }
    };

    // Create observer to watch for toast content changes
    this.toastObserver = new MutationObserver(() => {
      checkToastContent();
    });

    // Observe changes to the toast element and its children
    this.toastObserver.observe(toastElement, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true
    });

    // Run initial check
    checkToastContent();
  }

  private async animateFloatingImage(canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve) => {
      if (!this.DCE_ELEMENTS.floatingImage || !this.DCE_ELEMENTS.floatingImageImg || !this.DCE_ELEMENTS.thumbnailPreview || !this.DCE_ELEMENTS.thumbnailImg) {
        resolve();
        return;
      }

      // Convert canvas to data URL and set as floating image source
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
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
        this.DCE_ELEMENTS.floatingImage.style.setProperty('--translate-x', `${translateX}px`);
        this.DCE_ELEMENTS.floatingImage.style.setProperty('--translate-y', `${translateY}px`);
        this.DCE_ELEMENTS.floatingImage.style.setProperty('--scale', `${scale}`);

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

  async handleCloseBtn() {
    this.closeCamera();

    this.currentScanResolver?.({
      status: {
        code: EnumResultStatus.RS_CANCELLED,
        message: "Cancelled",
      },
    });
  }

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

  async toggleAutoCaptureAnimation(enabled?: boolean) {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const loadingAnimation = DCEContainer.shadowRoot.querySelector(
      ".dce-loading-auto-capture-animation"
    ) as HTMLElement;

    loadingAnimation.style.borderLeftColor = enabled ? "transparent" : "#fe8e14";
    loadingAnimation.style.borderBottomColor = enabled ? "transparent" : "#fe8e14";
  }

  async toggleBoundsDetection(enabled?: boolean) {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const container = DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection") as HTMLElement;
    const onIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection-on") as HTMLElement;
    const offIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection-off") as HTMLElement;

    if (!onIcon || !offIcon) return;

    this.toggleAutoCaptureAnimation(false);
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

  async toggleSmartCapture(mode?: boolean) {
    const configContainer = getElement(this.config.container);
    const DCEContainer = configContainer.children[configContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const container = DCEContainer.shadowRoot.querySelector(".dce-mn-smart-capture") as HTMLElement;
    const onIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-smart-capture-on") as HTMLElement;
    const offIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-smart-capture-off") as HTMLElement;

    if (!onIcon || !offIcon) return;

    const newSmartCaptureState = mode !== undefined ? mode : !this.smartCaptureEnabled;
    this.toggleAutoCaptureAnimation(newSmartCaptureState);

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

  private toggleScanGuide(enabled?: boolean) {
    if (enabled && !isEmptyObject(this.config?.scanRegion?.ratio)) {
      this.calculateScanRegion();
    }
  }

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
          if (errorMessage.includes('in use') || errorMessage.includes('not available')) {
            throw new Error('Camera is already in use by another tab or application. Please close other tabs/applications using the camera and try again.');
          }
          throw error;
        }
      } else if (cameraEnhancer?.isPaused()) {
        try {
          await cameraEnhancer.resume();
        } catch (error) {
          console.warn('Camera error (openCamera - resume after pause):', error);
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
          console.warn('Camera error (openCamera - setResolution):', error);
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

  closeCamera(hideContainer: boolean = true) {
    // Remove resize event listener
    window.removeEventListener("resize", this.handleResize);
    // Clear any existing resize timer
    this.resizeTimer && window.clearTimeout(this.resizeTimer);

    // Disconnect toast observer if it exists
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
      // Silently handle camera close errors - camera may already be closed
      console.warn('Camera error (closeCamera):', error);
    }
    this.stopCapturing();
  }

  pauseCamera() {
    const { cameraEnhancer } = this.resources;
    try {
      cameraEnhancer?.pause();
    } catch (error) {
      // Silently handle camera pause errors
      console.warn('Camera error (pauseCamera):', error);
    }
  }

  stopCapturing() {
    const { cameraView, cvRouter } = this.resources;

    cvRouter.stopCapturing();
    cameraView.clearAllInnerDrawingItems();
  }

  private getFlowType(): EnumFlowType {
    // Find flow type
    return this.autoCropEnabled
      ? EnumFlowType.AUTO_CROP
      : this.smartCaptureEnabled
      ? EnumFlowType.SMART_CAPTURE
      : EnumFlowType.MANUAL;
  }

  async takePhoto() {
    // Prevent concurrent captures
    if (this.isCapturing) {
      return;
    }
    this.isCapturing = true;

    try {
      const { cameraEnhancer, onResultUpdated } = this.resources;

      // Set the original image based on bounds detection and captured results
      const shouldUseLatestFrame =
        !this.boundsDetectionEnabled || (this.boundsDetectionEnabled && this.capturedResultItems?.length <= 1); // Starts at one bc result always includes original image

      this.originalImageData = shouldUseLatestFrame ? cameraEnhancer?.fetchImage() : this.originalImageData;

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

      // Show loading indicator (use minimal spinner for continuous scanning, full overlay otherwise)
      if (this.resources.enableContinuousScanning) {
        // Clean up any existing spinner first
        if (this.minimalSpinner) {
          this.minimalSpinner.hide();
          this.minimalSpinner = null;
        }

        const configContainer = getElement(this.config.container);
        this.minimalSpinner = showMinimalSpinner(configContainer);
        // Disable the capture button during processing
        if (this.DCE_ELEMENTS.takePhotoBtn) {
          this.DCE_ELEMENTS.takePhotoBtn.style.pointerEvents = 'none';
          this.DCE_ELEMENTS.takePhotoBtn.style.opacity = '0.5';
        }
        // Disable the done button during processing
        if (this.DCE_ELEMENTS.continuousScanDoneBtn) {
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.pointerEvents = 'none';
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.opacity = '0.5';
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

      // Hide loading indicator
      if (this.resources.enableContinuousScanning) {
        this.minimalSpinner?.hide();
        // Re-enable the capture button after processing
        if (this.DCE_ELEMENTS.takePhotoBtn) {
          this.DCE_ELEMENTS.takePhotoBtn.style.pointerEvents = 'auto';
          this.DCE_ELEMENTS.takePhotoBtn.style.opacity = '1';
        }
        // Re-enable the done button after processing
        if (this.DCE_ELEMENTS.continuousScanDoneBtn) {
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.pointerEvents = 'auto';
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.opacity = '1';
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

      // Clean up spinner/overlay and re-enable button
      if (this.resources.enableContinuousScanning) {
        this.minimalSpinner?.hide();
        // Re-enable the capture button
        if (this.DCE_ELEMENTS.takePhotoBtn) {
          this.DCE_ELEMENTS.takePhotoBtn.style.pointerEvents = 'auto';
          this.DCE_ELEMENTS.takePhotoBtn.style.opacity = '1';
        }
        // Re-enable the done button
        if (this.DCE_ELEMENTS.continuousScanDoneBtn) {
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.pointerEvents = 'auto';
          this.DCE_ELEMENTS.continuousScanDoneBtn.style.opacity = '1';
        }
        // Resume camera if it was paused (check if camera enhancer still exists)
        if (this.resources.cameraEnhancer?.isPaused()) {
          try {
            await this.resources.cameraEnhancer.resume();
          } catch (error) {
            console.warn('Camera error (after correction/result - resume):', error);
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

    if ((result.processedDocumentResult?.detectedQuadResultItems?.[0] as any)?.crossVerificationStatus === 1)
      this.crossVerificationCount++;

    /**
     * In our case, we determine a good condition for "automatic normalization" to be
     * "getting document boundary detected after 2 cross verified results".
     */
    if (this.crossVerificationCount >= this.config?.minVerifiedFramesForAutoCapture) {
      this.crossVerificationCount = 0;

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
            console.warn('Camera error (takePhoto - setPixelFormat):', error);
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
  ): Promise<DeskewedImageResultItem> {
    const { cvRouter, cameraEnhancer } = this.resources;

    const settings = await cvRouter.getSimplifiedSettings(this.config.utilizedTemplateNames.normalize);
    settings.roiMeasuredInPercentage = false;
    settings.roi.points = points;
    await cvRouter.updateSettings(this.config.utilizedTemplateNames.normalize, settings);

    const result = await cvRouter.capture(originalImageData, this.config.utilizedTemplateNames.normalize);
    // If deskewed result found
    if (result?.processedDocumentResult?.deskewedImageResultItems?.[0]) {
      return result.processedDocumentResult.deskewedImageResultItems[0];
    }
  }
}

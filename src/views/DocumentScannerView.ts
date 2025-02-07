import {
  EnumCapturedResultItemType,
  EnumImagePixelFormat,
  OriginalImageResultItem,
  Quadrilateral,
} from "dynamsoft-core";
import { CapturedResultReceiver, CapturedResult } from "dynamsoft-capture-vision-router";
import { DetectedQuadResultItem, NormalizedImageResultItem } from "dynamsoft-document-normalizer";
import { MultiFrameResultCrossFilter } from "dynamsoft-utility";
import { SharedResources } from "../DocumentScanner";
import {
  DEFAULT_TEMPLATE_NAMES,
  DocumentResult,
  EnumFlowType,
  EnumResultStatus,
  UtilizedTemplateNames,
} from "./utils/types";
import { DEFAULT_LOADING_SCREEN_STYLE, showLoadingScreen } from "./utils/LoadingScreen";
import { createStyle, getElement } from "./utils";

export interface DocumentScannerViewConfig {
  _showCorrectionView?: boolean; // Internal use, to remove Smart Capture if correctionView is not available

  templateFilePath?: string;
  cameraEnhancerUIPath?: string;
  container?: HTMLElement | string;
  // consecutiveResultFramesBeforeNormalization?: number;
  utilizedTemplateNames?: UtilizedTemplateNames;
}

interface DCEElements {
  selectCameraBtn: HTMLElement | null;
  uploadImageBtn: HTMLElement | null;
  closeScannerBtn: HTMLElement | null;
  takePhotoBtn: HTMLElement | null;
  boundsDetectionBtn: HTMLElement | null;
  smartCaptureBtn: HTMLElement | null;
  autoCropBtn: HTMLElement | null;
}

// Implementation
export default class DocumentScannerView {
  // Capture Mode
  private boundsDetectionEnabled: boolean = false;
  private smartCaptureEnabled: boolean = false;
  private autoCropEnabled: boolean = false;

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
  };

  // Scan Resolve
  private currentScanResolver?: (result: DocumentResult) => void;

  private loadingScreen: ReturnType<typeof showLoadingScreen> | null = null;

  private showScannerLoadingOverlay(message?: string) {
    const configContainer = getElement(this.config.container);
    this.loadingScreen = showLoadingScreen(configContainer, { message });
    configContainer.style.display = "block";
    configContainer.style.position = "relative";
  }

  private hideScannerLoadingOverlay(hideContainer: boolean = false) {
    if (this.loadingScreen) {
      this.loadingScreen.hide();
      this.loadingScreen = null;

      if (hideContainer) {
        getElement(this.config.container).style.display = "none";
      }
    }
  }

  constructor(private resources: SharedResources, private config: DocumentScannerViewConfig) {
    this.config.utilizedTemplateNames = {
      detect: config.utilizedTemplateNames?.detect || DEFAULT_TEMPLATE_NAMES.detect,
      normalize: config.utilizedTemplateNames?.normalize || DEFAULT_TEMPLATE_NAMES.normalize,
    };
    // this.config.consecutiveResultFramesBeforeNormalization = config.consecutiveResultFramesBeforeNormalization || 15;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Create loading screen style
    createStyle("dds-loading-screen-style", DEFAULT_LOADING_SCREEN_STYLE);

    try {
      const { cameraView, cameraEnhancer, cvRouter } = this.resources;

      // Set up cameraView styling
      // cameraView.getVideoElement().style.objectPosition = "center";
      cameraView.setScanRegionMaskStyle({
        ...cameraView.getScanRegionMaskStyle(),
        strokeStyle: "transparent",
      });

      // Set cameraEnhancer as input for CaptureVisionRouter
      cvRouter.setInput(cameraEnhancer);

      // Add filter for smart capture
      const filter = new MultiFrameResultCrossFilter();
      filter.enableResultCrossVerification(EnumCapturedResultItemType.CRIT_DETECTED_QUAD, true);
      filter.enableResultDeduplication(EnumCapturedResultItemType.CRIT_DETECTED_QUAD, true);
      await cvRouter.addResultFilter(filter);

      // Initialize the template parameters for DL scanning4
      if (this.config.templateFilePath) {
        await cvRouter.initSettings(this.config.templateFilePath);
      } else {
        let newSettings = await cvRouter.getSimplifiedSettings(this.config.utilizedTemplateNames.detect);
        newSettings.capturedResultItemTypes |= EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE;
        await cvRouter.updateSettings(this.config.utilizedTemplateNames.detect, newSettings);
      }
      cvRouter.maxImageSideLength = Infinity;

      const resultReceiver = new CapturedResultReceiver();
      resultReceiver.onCapturedResultReceived = (result) => this.handleBoundsDetection(result);
      await cvRouter.addResultReceiver(resultReceiver);

      // Set default value for smartCapture and boundsDetection modes
      this.smartCaptureEnabled = false;
      this.boundsDetectionEnabled = true;

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
    };

    await this.toggleBoundsDetection(this.boundsDetectionEnabled);
    await this.toggleSmartCapture(this.smartCaptureEnabled);
    await this.toggleAutoCrop(this.autoCropEnabled);

    this.assignDCEClickEvents();

    // If showCorrectionView is false, hide smartCapture
    if (this.config._showCorrectionView === false) {
      this.DCE_ELEMENTS.smartCaptureBtn.style.display = "none";
    }

    this.initializedDCE = true;
  }

  private assignDCEClickEvents() {
    if (!Object.values(this.DCE_ELEMENTS).every(Boolean)) {
      throw new Error("Camera control elements not found");
    }

    // Use passive event listeners for better performance
    const eventOptions = { passive: true };

    this.takePhoto = this.takePhoto.bind(this);
    this.toggleBoundsDetection = this.toggleBoundsDetection.bind(this);
    this.toggleSmartCapture = this.toggleSmartCapture.bind(this);
    this.toggleAutoCrop = this.toggleAutoCrop.bind(this);
    this.closeCamera = this.closeCamera.bind(this);

    this.DCE_ELEMENTS.takePhotoBtn.addEventListener("click", this.takePhoto, eventOptions);

    this.DCE_ELEMENTS.boundsDetectionBtn.addEventListener(
      "click",
      async () => await this.toggleBoundsDetection(),
      eventOptions
    );

    this.DCE_ELEMENTS.smartCaptureBtn.addEventListener(
      "click",
      async () => await this.toggleSmartCapture(),
      eventOptions
    );

    this.DCE_ELEMENTS.autoCropBtn.addEventListener("click", async () => await this.toggleAutoCrop(), eventOptions);

    this.DCE_ELEMENTS.closeScannerBtn.addEventListener("click", async () => await this.handleCloseBtn(), eventOptions);

    this.DCE_ELEMENTS.selectCameraBtn.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();
        this.toggleSelectCameraBox();
      },
      eventOptions
    );

    this.DCE_ELEMENTS.uploadImageBtn.addEventListener("click", () => this.uploadImage(), eventOptions);
  }

  async handleCloseBtn() {
    this.closeCamera();

    if (this.currentScanResolver) {
      this.currentScanResolver({
        status: {
          code: EnumResultStatus.RS_CANCELLED,
          message: "Cancelled",
        },
      });
    }
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
      option.addEventListener("click", () => {
        if (settingsContainer.style.display !== "none") {
          this.toggleSelectCameraBox();
        }
      });
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

    const selectedCamera = this.resources.cameraEnhancer.getSelectedCamera();
    const selectedResolution = this.resources.cameraEnhancer.getResolution();

    cameraOptions.forEach((options) => {
      const o = options as HTMLElement;
      if (o.getAttribute("data-davice-id") === selectedCamera?.deviceId) {
        o.style.border = "2px solid #fe814a";
      } else {
        o.style.border = "none";
      }
    });

    resOptions.forEach((options) => {
      const o = options as HTMLElement;
      if (o.getAttribute("data-height") === `${selectedResolution.height}`) {
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
  }

  private async uploadImage() {
    // Create hidden file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
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

      this.closeCamera(false);

      // Convert file to blob
      const { blob } = await this.fileToBlob(file);

      this.capturedResultItems = (
        await this.resources.cvRouter.capture(blob, this.config.utilizedTemplateNames.detect)
      ).items;
      this.originalImageData = (this.capturedResultItems[0] as OriginalImageResultItem)?.imageData;

      // Reset captured items if not using bounds detection
      let detectedQuadrilateral: Quadrilateral = null;
      if (this.capturedResultItems?.length <= 1) {
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

      // Emit result through shared resources
      this.resources.onResultUpdated?.(result);

      // Resolve scan promise
      this.currentScanResolver(result);

      // Done processing
      this.hideScannerLoadingOverlay(true);
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
    }

    const { cvRouter } = this.resources;

    this.boundsDetectionEnabled = newBoundsDetectionState;
    container.style.color = this.boundsDetectionEnabled ? "#fe814a" : "#fff";
    offIcon.style.display = this.boundsDetectionEnabled ? "none" : "block";
    onIcon.style.display = this.boundsDetectionEnabled ? "block" : "none";

    if (this.initialized && this.boundsDetectionEnabled) {
      await cvRouter.startCapturing(this.config.utilizedTemplateNames.detect);
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

  async openCamera(): Promise<void> {
    try {
      this.showScannerLoadingOverlay("Initializing camera...");

      const { cameraEnhancer, cameraView } = this.resources;

      const configContainer = getElement(this.config.container);
      configContainer.style.display = "block";

      if (!cameraEnhancer.isOpen()) {
        const currentCameraView = cameraView.getUIElement();
        if (!currentCameraView.parentElement) {
          configContainer.append(currentCameraView);
        }

        await cameraEnhancer.open();
      } else if (cameraEnhancer.isPaused()) {
        await cameraEnhancer.resume();
      }

      // Assign boundsDetection, smartCapture, and takePhoto element
      if (!this.initializedDCE && cameraEnhancer.isOpen()) {
        await this.initializeElements();
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
    const { cameraEnhancer, cameraView } = this.resources;

    const configContainer = getElement(this.config.container);
    configContainer.style.display = hideContainer ? "none" : "block";

    if (cameraView.getUIElement().parentElement) {
      configContainer.removeChild(cameraView.getUIElement());
    }

    cameraEnhancer.close();
    this.stopCapturing();
  }

  pauseCamera() {
    const { cameraEnhancer } = this.resources;
    cameraEnhancer.pause();
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
    try {
      const { cameraEnhancer, onResultUpdated } = this.resources;

      // Set the original image based on bounds detection and captured results
      const shouldUseLatestFrame =
        !this.boundsDetectionEnabled || (this.boundsDetectionEnabled && this.capturedResultItems?.length <= 1); // Starts at one bc result always includes original image

      this.originalImageData = shouldUseLatestFrame ? cameraEnhancer.fetchImage() : this.originalImageData;

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

      const flowType = this.getFlowType();
      // turn off smart capture (and also auto crop) before closin camera
      await this.toggleSmartCapture(false);

      // Clean up camera and capture
      this.closeCamera();

      // Show loading screen
      this.showScannerLoadingOverlay("Processing image...");

      // Retrieve corrected image result
      correctedImageResult = await this.normalizeImage(detectedQuadrilateral.points, this.originalImageData);

      // Hide loading screen
      this.hideScannerLoadingOverlay(true);

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

      // Emit result through shared resources
      onResultUpdated?.(result);

      // Resolve scan promise
      this.currentScanResolver(result);
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      alert(errMsg);

      this.closeCamera();
      const result = {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: "Error capturing image",
        },
      };
      this.currentScanResolver(result);
    }
  }

  async handleBoundsDetection(result: CapturedResult) {
    this.capturedResultItems = result.items;

    if (!result.items?.length) return;

    const originalImage = result.items.filter(
      (item) => item.type === EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE
    ) as OriginalImageResultItem[];
    this.originalImageData = originalImage.length && originalImage[0].imageData;

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

    if ((result.detectedQuadResultItems[0] as any).crossVerificationStatus === 1) this.crossVerificationCount++;

    /**
     * In our case, we determine a good condition for "automatic normalization" to be
     * "getting document boundary detected after 2 cross verified results".
     */
    if (this.crossVerificationCount >= 2) {
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

        // By default, cameraEnhancer captures grayscale images to optimize performance.
        // To capture RGB Images, we set the Pixel Format to EnumImagePixelFormat.IPF_ABGR_8888
        cameraEnhancer.setPixelFormat(EnumImagePixelFormat.IPF_ABGR_8888);

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
  ): Promise<NormalizedImageResultItem> {
    const { cvRouter, cameraEnhancer } = this.resources;

    const settings = await cvRouter.getSimplifiedSettings(this.config.utilizedTemplateNames.normalize);
    settings.roiMeasuredInPercentage = false;
    settings.roi.points = points;
    await cvRouter.updateSettings(this.config.utilizedTemplateNames.normalize, settings);

    const result = await cvRouter.capture(originalImageData, this.config.utilizedTemplateNames.normalize);
    // If normalized result found
    if (result?.normalizedImageResultItems?.[0]) {
      return result.normalizedImageResultItems[0];
    }
  }
}

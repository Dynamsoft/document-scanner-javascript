import {
  DSImageData,
  EnumCapturedResultItemType,
  EnumImagePixelFormat,
  OriginalImageResultItem,
  Quadrilateral,
} from "dynamsoft-core";
import { CapturedResultReceiver, CapturedResult } from "dynamsoft-capture-vision-router";
import { DetectedQuadResultItem, NormalizedImageResultItem } from "dynamsoft-document-normalizer";
import { MultiFrameResultCrossFilter } from "dynamsoft-utility";
import { SharedResources } from "../DocumentScanner";
import { DEFAULT_TEMPLATE_NAMES, DocumentScanResult, EnumResultStatus, UtilizedTemplateNames } from "./utils/types";
import { DEFAULT_LOADING_SCREEN_STYLE, showLoadingScreen } from "./utils/LoadingScreen";

export interface DocumentScannerViewConfig {
  templateFilePath?: string;
  cameraEnhancerUIPath?: string;
  container?: HTMLElement;
  // consecutiveResultFramesBeforeNormalization?: number;
  utilizedTemplateNames?: UtilizedTemplateNames;
}

interface DCEElements {
  selectCameraBtn: HTMLElement | null;
  uploadImageBtn: HTMLElement | null;
  closeScannerBtn: HTMLElement | null;
  takePhotoBtn: HTMLElement | null;
  boundsDetectionBtn: HTMLElement | null;
  autoCaptureBtn: HTMLElement | null;
}

// Implementation
export default class DocumentScannerView {
  // Capture Mode
  private boundsDetectionEnabled: boolean = false;
  private autoCaptureEnabled: boolean = false;

  // Used for Auto Capture Mode - use crossVerificationStatus
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
    autoCaptureBtn: null,
  };

  // Scan Resolve
  private currentScanResolver?: (result: DocumentScanResult) => void;

  private loadingScreen: ReturnType<typeof showLoadingScreen> | null = null;

  private showScannerLoadingOverlay(message?: string) {
    this.loadingScreen = showLoadingScreen(this.config.container, { message });
    this.config.container.style.display = "block";
    this.config.container.style.position = "relative";
  }

  private hideScannerLoadingOverlay(hideContainer: boolean = false) {
    if (this.loadingScreen) {
      this.loadingScreen.hide();
      this.loadingScreen = null;

      if (hideContainer) {
        this.config.container.style.display = "none";
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
    const styleSheet = document.createElement("style");
    styleSheet.textContent = DEFAULT_LOADING_SCREEN_STYLE;
    document.head.appendChild(styleSheet);

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

      // Add filter for Auto capture
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

      const resultReceiver = new CapturedResultReceiver();
      resultReceiver.onCapturedResultReceived = (result) => this.handleBoundsDetection(result);
      await cvRouter.addResultReceiver(resultReceiver);

      // Set default value for autoCapture and boundsDetection modes
      this.autoCaptureEnabled = false;
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
    const DCEContainer = this.config.container.children[this.config.container.children.length - 1];

    if (!DCEContainer?.shadowRoot) {
      throw new Error("Shadow root not found");
    }

    this.DCE_ELEMENTS = {
      selectCameraBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-select-camera-icon"),
      uploadImageBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-upload-image-icon"),
      closeScannerBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-close"),
      takePhotoBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-take-photo"),
      boundsDetectionBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection"),
      autoCaptureBtn: DCEContainer.shadowRoot.querySelector(".dce-mn-auto-capture"),
    };

    await this.toggleBoundsDetection(this.boundsDetectionEnabled);
    await this.toggleAutoCapture(this.autoCaptureEnabled);

    this.assignDCEClickEvents();

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
    this.toggleAutoCapture = this.toggleAutoCapture.bind(this);
    this.closeCamera = this.closeCamera.bind(this);

    this.DCE_ELEMENTS.takePhotoBtn.addEventListener("click", this.takePhoto, eventOptions);

    this.DCE_ELEMENTS.boundsDetectionBtn.addEventListener(
      "click",
      async () => await this.toggleBoundsDetection(),
      eventOptions
    );

    this.DCE_ELEMENTS.autoCaptureBtn.addEventListener(
      "click",
      async () => await this.toggleAutoCapture(),
      eventOptions
    );

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
    const DCEContainer = this.config.container.children[this.config.container.children.length - 1];
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
    const DCEContainer = this.config.container.children[this.config.container.children.length - 1];
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
    const DCEContainer = this.config.container.children[this.config.container.children.length - 1];
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
      const { width, height } = this.originalImageData;
      this.capturedResultItems = [];
      const detectedQuadrilateral = {
        points: [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ],
        area: height * width,
      } as Quadrilateral;

      const correctedImageResult = await this.normalizeImage(detectedQuadrilateral.points, this.originalImageData);

      const result = {
        status: {
          code: EnumResultStatus.RS_SUCCESS,
          message: "Success",
        },
        originalImageResult: this.originalImageData,
        correctedImageResult,
        detectedQuadrilateral,
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

  async toggleBoundsDetection(enabled?: boolean) {
    const DCEContainer = this.config.container.children[this.config.container.children.length - 1];
    if (!DCEContainer?.shadowRoot) return;

    const container = DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection") as HTMLElement;
    const onIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection-on") as HTMLElement;
    const offIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-bounds-detection-off") as HTMLElement;

    if (!onIcon || !offIcon) return;

    const newBoundsDetectionState = enabled !== undefined ? enabled : !this.boundsDetectionEnabled;

    // If we're turning off bounds detection, ensure auto capture is turned off
    if (!newBoundsDetectionState) {
      await this.toggleAutoCapture(false);
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

  async toggleAutoCapture(mode?: boolean) {
    const DCEContainer = this.config.container.children[this.config.container.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const container = DCEContainer.shadowRoot.querySelector(".dce-mn-auto-capture") as HTMLElement;
    const onIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-auto-capture-on") as HTMLElement;
    const offIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-auto-capture-off") as HTMLElement;
    const takePhotoBtn = DCEContainer.shadowRoot.querySelector(".dce-mn-take-photo") as HTMLElement;
    const loadingAutoCapture = DCEContainer.shadowRoot.querySelector(
      ".dce-loading-auto-capture-container"
    ) as HTMLElement;

    if (!onIcon || !offIcon || !takePhotoBtn || !loadingAutoCapture) return;

    const newAutoCaptureState = mode !== undefined ? mode : !this.autoCaptureEnabled;

    // If trying to turn on auto capture, ensure bounds detection is on
    if (newAutoCaptureState && !this.boundsDetectionEnabled) {
      // Turn on bouds detection first
      await this.toggleBoundsDetection(true);
    }

    this.autoCaptureEnabled = newAutoCaptureState;
    container.style.color = this.autoCaptureEnabled ? "#fe814a" : "#fff";
    offIcon.style.display = this.autoCaptureEnabled ? "none" : "block";
    onIcon.style.display = this.autoCaptureEnabled ? "block" : "none";

    // Toggle display of take photo button and loading animation
    takePhotoBtn.style.display = newAutoCaptureState ? "none" : "flex";
    loadingAutoCapture.style.display = newAutoCaptureState ? "flex" : "none";

    // Reset crossVerificationCount whenever we toggle the auto capture
    this.crossVerificationCount = 0;
    // this.updateLoadingProgress(this.crossVerificationCount);
  }

  async openCamera(): Promise<void> {
    try {
      this.showScannerLoadingOverlay("Initializing camera...");

      const { cameraEnhancer, cameraView } = this.resources;

      this.config.container.style.display = "block";

      if (!cameraEnhancer.isOpen()) {
        const currentCameraView = cameraView.getUIElement();
        if (!currentCameraView.parentElement) {
          this.config.container.append(currentCameraView);
        }

        await cameraEnhancer.open();

        // cvRouter start capture? TODO
      } else if (cameraEnhancer.isPaused()) {
        await cameraEnhancer.resume();
        // cvRouter start capture? TODO
      }

      // Assign boundsDetection, autoCapture, and takePhoto element
      if (!this.initializedDCE) {
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

    this.config.container.style.display = hideContainer ? "none" : "block";

    if (cameraView.getUIElement().parentElement) {
      this.config.container.removeChild(cameraView.getUIElement());
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

      // Clean up camera and capture
      this.closeCamera();

      // Show loading screen
      this.showScannerLoadingOverlay("Processing image...");

      // Retrieve corrected image result
      correctedImageResult = await this.normalizeImage(detectedQuadrilateral.points, this.originalImageData);

      // Hide loading screen
      this.hideScannerLoadingOverlay(true);

      const result = {
        status: {
          code: EnumResultStatus.RS_SUCCESS,
          message: "Success",
        },
        originalImageResult: this.originalImageData,
        correctedImageResult,
        detectedQuadrilateral,
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

    if (this.autoCaptureEnabled) {
      this.handleAutoCaptureMode(result);
    }
  }

  // private updateLoadingProgress(progress: number) {
  //   const DCEContainer = this.config.container.children[this.config.container.children.length - 1];
  //   if (!DCEContainer?.shadowRoot) return;

  //   const progressPath = DCEContainer.shadowRoot.querySelector(".dce-loading-auto-capture-progress") as SVGPathElement;
  //   if (!progressPath) return;

  //   // The circumference of the circle (2 * PI * r)
  //   const circumference = 100.53096491487338; // 2 * Math.PI * 16

  //   // Calculate the stroke dash offset based on progress
  //   const dashOffset = ((100 - progress) / 100) * circumference;
  //   progressPath.style.strokeDashoffset = String(dashOffset);
  // }
  /**
   * Normalize an image with DDN given a set of points
   * @param points - points provided by either users or DDN's detect quad
   * @returns normalized image by DDN
   */
  private async handleAutoCaptureMode(result: CapturedResult) {
    /** If "Auto Capture" is checked, the library uses the document boundaries found in consecutive
     * cross verified frames to decide whether conditions are suitable for automatic normalization.
     */
    if (result.items.length <= 1) {
      this.crossVerificationCount = 0;
      // this.updateLoadingProgress(0);
      return;
    }

    if ((result.detectedQuadResultItems[0] as any).crossVerificationStatus === 1) this.crossVerificationCount++;
    // const progress = Math.min(100, Math.round((this.crossVerificationCount / 2) * 100));
    // this.updateLoadingProgress(progress);

    /**
     * In our case, we determine a good condition for "automatic normalization" to be
     * "getting document boundary detected after 2 cross verified reuslts".
     */
    if (this.crossVerificationCount >= 2) {
      this.crossVerificationCount = 0;
      await this.toggleAutoCapture(false); // turn off auto capture

      await this.takePhoto();
    }
  }

  async launch(): Promise<DocumentScanResult> {
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

import {
  DSImageData,
  EnumCapturedResultItemType,
  EnumImagePixelFormat,
  OriginalImageResultItem,
  Quadrilateral,
} from "dynamsoft-core";
import { CapturedResultReceiver, CapturedResult } from "dynamsoft-capture-vision-router";
import { DetectedQuadResultItem, NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { MobileDocumentScannerConfig, SharedResources } from "../core/MobileDocumentScanner";

export interface DocumentScanResult {
  success: boolean;
  normalizedImageResult?: NormalizedImageResultItem | DSImageData;
  originalImageResult?: OriginalImageResultItem["imageData"];
  detectedQuadrilateral?: Quadrilateral;
  error?: Error;
}

interface DCEElements {
  takePhotoBtn: HTMLElement | null;
  boundsDetectionBtn: HTMLElement | null;
  autoCaptureBtn: HTMLElement | null;
}

// Implementation
export default class DocumentScannerView {
  // Capture Mode
  private boundsDetectionEnabled: boolean = false;
  private autoCaptureEnabled: boolean = false;

  // Used for Auto Capture Mode
  private frameCount: number;

  // Used for ImageEditorView (In NornalizerView)
  private capturedResultItems: CapturedResult["items"] = [];
  private originalImageData: OriginalImageResultItem["imageData"] | null = null;

  private initialized: boolean = false;
  private initializedDCE: boolean = false;

  // Elements
  private DCE_ELEMENTS: DCEElements = {
    takePhotoBtn: null,
    boundsDetectionBtn: null,
    autoCaptureBtn: null,
  };

  // Scan Resolve
  private currentScanResolver?: (result: DocumentScanResult) => void;

  constructor(private resources: SharedResources, private config: MobileDocumentScannerConfig) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

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

      // Initialize the template parameters for DL scanning4
      if (this.config.templateFilePath) {
        await cvRouter.initSettings(this.config.templateFilePath);
      } else {
        let newSettings = await cvRouter.getSimplifiedSettings("DetectDocumentBoundaries_Default");
        newSettings.capturedResultItemTypes |= EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE;
        await cvRouter.updateSettings("DetectDocumentBoundaries_Default", newSettings);
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
    }
  }

  private async initializeElements() {
    const DCEContainer = this.config.cameraViewContainer.children[this.config.cameraViewContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) {
      throw new Error("Shadow root not found");
    }

    this.DCE_ELEMENTS = {
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
    if (!this.DCE_ELEMENTS.takePhotoBtn || !this.DCE_ELEMENTS.boundsDetectionBtn || !this.DCE_ELEMENTS.autoCaptureBtn) {
      throw new Error("Camera control elements not found");
    }

    // Use passive event listeners for better performance
    const eventOptions = { passive: true };

    this.takePhoto = this.takePhoto.bind(this);
    this.toggleBoundsDetection = this.toggleBoundsDetection.bind(this);
    this.toggleAutoCapture = this.toggleAutoCapture.bind(this);

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
  }

  async toggleBoundsDetection(enabled?: boolean) {
    const DCEContainer = this.config.cameraViewContainer.children[this.config.cameraViewContainer.children.length - 1];
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
    container.style.color = this.boundsDetectionEnabled ? "#fe8e14" : "white";
    offIcon.style.display = this.boundsDetectionEnabled ? "none" : "block";
    onIcon.style.display = this.boundsDetectionEnabled ? "block" : "none";

    if (this.initialized && this.boundsDetectionEnabled) {
      await cvRouter.startCapturing(this.config.utilizedTemplateNames.detect);
    } else if (this.initialized && !this.boundsDetectionEnabled) {
      this.stopCapturing();
    }
  }

  async toggleAutoCapture(mode?: boolean) {
    const DCEContainer = this.config.cameraViewContainer.children[this.config.cameraViewContainer.children.length - 1];

    if (!DCEContainer?.shadowRoot) return;

    const container = DCEContainer.shadowRoot.querySelector(".dce-mn-auto-capture") as HTMLElement;
    const onIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-auto-capture-on") as HTMLElement;
    const offIcon = DCEContainer.shadowRoot.querySelector(".dce-mn-auto-capture-off") as HTMLElement;

    if (!onIcon || !offIcon) return;

    const newAutoCaptureState = mode !== undefined ? mode : !this.autoCaptureEnabled;

    // If trying to turn on auto capture, ensure bounds detection is on
    if (newAutoCaptureState && !this.boundsDetectionEnabled) {
      // Turn on bouds detection first
      await this.toggleBoundsDetection(true);
    }

    this.autoCaptureEnabled = newAutoCaptureState;
    container.style.color = this.autoCaptureEnabled ? "#fe8e14" : "white";
    offIcon.style.display = this.autoCaptureEnabled ? "none" : "block";
    onIcon.style.display = this.autoCaptureEnabled ? "block" : "none";

    // Reset frameCount whenever we toggle the auto capture
    this.frameCount = 0;
  }

  async openCamera(): Promise<void> {
    try {
      const { cameraEnhancer, cameraView } = this.resources;

      this.config.cameraViewContainer.style.display = "block";

      if (!cameraEnhancer.isOpen()) {
        const currentCameraView = cameraView.getUIElement();
        if (!currentCameraView.parentElement) {
          this.config.cameraViewContainer.append(currentCameraView);
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
    }
  }

  async closeCamera(): Promise<void> {
    const { cameraEnhancer, cameraView } = this.resources;

    this.config.cameraViewContainer.style.display = "none";

    if (cameraView.getUIElement().parentElement) {
      this.config.cameraViewContainer.removeChild(cameraView.getUIElement());
    }

    await cameraEnhancer.close();
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
      let normalizedImageResult = null;
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

      // Retrieve normalized image result
      normalizedImageResult = await this.normalizeImage(detectedQuadrilateral.points, this.originalImageData);

      // Clean up camera and capture
      this.closeCamera();

      const result = {
        success: true,
        originalImageResult: this.originalImageData,
        normalizedImageResult,
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
    }
  }

  async handleBoundsDetection(result: CapturedResult) {
    this.capturedResultItems = result.items;

    if (!result.items?.length) return;

    const originalImage = result.items.filter((item) => item.type === 1) as OriginalImageResultItem[];
    this.originalImageData = originalImage.length && originalImage[0].imageData;

    if (this.autoCaptureEnabled) {
      this.handleAutoCaptureMode(result);
    }
  }

  private async handleAutoCaptureMode(result: CapturedResult) {
    /** If "Normalize Automatically" is checked, the library uses the document boundaries found in consecutive
     * image frames to decide whether conditions are suitable for automatic normalization.
     */
    if (result.items.length <= 1) {
      this.frameCount = 0;
      return;
    }

    this.frameCount++;
    /**
     * In our case, we determine a good condition for "automatic normalization" to be
     * "getting document boundary detected for 30 consecutive frames".
     *
     * NOTE that this condition will not be valid should you add a CapturedResultFilter
     * with ResultDeduplication enabled.
     */
    if (this.frameCount >= this.config.consecutiveResultFramesBeforeNormalization) {
      this.frameCount = 0;
      await this.toggleAutoCapture(false); // turn off auto capture

      await this.takePhoto();
    }
  }

  async scanImage(): Promise<DocumentScanResult> {
    await this.initialize();

    const { cvRouter, cameraEnhancer } = this.resources;

    return new Promise(async (resolve) => {
      this.currentScanResolver = resolve;
      /* Defines the result receiver to scan front side of license.*/

      // Start capturing
      await this.openCamera();

      if (this.boundsDetectionEnabled) {
        await cvRouter.startCapturing(this.config.utilizedTemplateNames.detect);
      }

      // By default, cameraEnhancer captures grayscale images to optimize performance.
      // To capture RGB Images, we set the Pixel Format to EnumImagePixelFormat.IPF_ABGR_8888
      cameraEnhancer.setPixelFormat(EnumImagePixelFormat.IPF_ABGR_8888);

      // Reset frameCount
      this.frameCount = 0;
    });
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

    const normalizedResult = await cvRouter.capture(originalImageData, this.config.utilizedTemplateNames.normalize);
    // If normalized result found
    if (normalizedResult?.normalizedImageResultItems?.[0]) {
      return normalizedResult.normalizedImageResultItems[0];
    }
  }
}

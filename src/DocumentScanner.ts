import {
  LicenseManager,
  CoreModule,
  EngineResourcePaths,
  EnumCapturedResultItemType,
  Quadrilateral,
  CaptureVisionRouter,
  CameraEnhancer,
  CameraView,
  DetectedQuadResultItem,
} from "dynamsoft-capture-vision-bundle";
import DocumentCorrectionView, { DocumentCorrectionViewConfig } from "./views/DocumentCorrectionView";
import DocumentScannerView, { DocumentScannerViewConfig } from "./views/DocumentScannerView";
import DocumentResultView, { DocumentResultViewConfig } from "./views/DocumentResultView";
import {
  DEFAULT_TEMPLATE_NAMES,
  DocumentResult,
  EnumDDSViews,
  EnumFlowType,
  EnumResultStatus,
  UtilizedTemplateNames,
} from "./views/utils/types";
import { getElement, isEmptyObject, shouldCorrectImage } from "./views/utils";
import { showLoadingScreen } from "./views/utils/LoadingScreen";

// Default DCE UI path
const DEFAULT_DCE_UI_PATH =
  "https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.3.0/dist/document-scanner.ui.html";
const DEFAULT_DCV_ENGINE_RESOURCE_PATHS = { rootDirectory: "https://cdn.jsdelivr.net/npm/" };
const DEFAULT_CONTAINER_HEIGHT = "100dvh";

/**
 * The `DocumentScannerConfig` interface passes settings to the {@link DocumentScanner} constructor to apply a comprehensive set of UI and business logic customizations.
 *
 * @remarks
 * Only advanced require editing the UI template or MDS source code. {@link DocumentScannerConfig.license} is the only property required to be passed to instantiate a {@link DocumentScanner} object. MDS uses sane default values for all other omitted properties.
 *
 * @example
 * ```typescript
 * const config = {
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     scannerViewConfig: {
 *         cameraEnhancerUIPath: "./dist/document-scanner.ui.html", // Use the local file
 *     },
 *     engineResourcePaths: {
 *         std: "./dist/libs/dynamsoft-capture-vision-std/dist/",
 *         dip: "./dist/libs/dynamsoft-image-processing/dist/",
 *         core: "./dist/libs/dynamsoft-core/dist/",
 *         license: "./dist/libs/dynamsoft-license/dist/",
 *         cvr: "./dist/libs/dynamsoft-capture-vision-router/dist/",
 *         ddn: "./dist/libs/dynamsoft-document-normalizer/dist/",
 *     },
 * };
 * ```
 *
 * @public
 * @stable
 */
export interface DocumentScannerConfig {
  /**
   * The license key for using the {@link DocumentScanner}.
   *
   * @remarks
   * This is the only property required to be passed to instantiate a {@link DocumentScanner} object.
   *
   * @public
   */
  license?: string;
  /**
   * The container element or selector for the {@link DocumentScanner} UI.
   *
   * @public
   */
  container?: HTMLElement | string;
  /**
   * The file path to the document template used for scanning.
   *
   * @remarks
   * You may set custom paths to self-host the template, or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | self-hosting resources}
   *
   * @public
   */
  templateFilePath?: string;
  /**
   * Capture Vision template names for detection and correction.
   *
   * @remarks
   * This typically does not need to be set as MDS provides a default template for general use. You may set custom names to self-host resources, or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | self-hosting resources}
   * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV Templates}
   *
   * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
   *
   * @public
   */
  utilizedTemplateNames?: UtilizedTemplateNames;
  /**
   * Paths to the necessary resources (such as `.wasm` files) for the scanning engine.
   *
   * @remarks
   * The default paths point to CDNs and so may be left unset. You may set custom paths to self-host resources, or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | self-hosting resources}
   *
   * @public
   */
  engineResourcePaths?: EngineResourcePaths;
  /**
   * Configuration settings for the {@link DocumentScannerView}.
   *
   * @remarks
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#workflow-customization | workflow customization}
   *
   * @public
   */
  scannerViewConfig?: Omit<
    DocumentScannerViewConfig,
    "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView"
  >;
  /**
   * Configuration settings for the {@link DocumentResultView}.
   *
   * @remarks
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#workflow-customization | workflow customization}
   *
   * @public
   */
  resultViewConfig?: DocumentResultViewConfig;
  correctionViewConfig?: Omit<
    DocumentCorrectionViewConfig,
    "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView"
  >;
  /**
   * Sets the visibility of the {@link DocumentResultView}.
   *
   * @defaultValue true
   * @public
   */
  showResultView?: boolean;
  /**
   * Sets the visibility of the {@link DocumentCorrectionView}.
   *
   * @defaultValue true
   * @public
   */
  showCorrectionView?: boolean;
}

export interface SharedResources {
  cvRouter?: CaptureVisionRouter;
  cameraEnhancer?: CameraEnhancer;
  cameraView?: CameraView;
  result?: DocumentResult;
  onResultUpdated?: (result: DocumentResult) => void;
}

/**
 * {@label DOCUMENT_SCANNER}
 */
class DocumentScanner {
  private scannerView?: DocumentScannerView;
  private scanResultView?: DocumentResultView;
  private correctionView?: DocumentCorrectionView;
  private resources: Partial<SharedResources> = {};
  private isInitialized = false;
  private isCapturing = false;

  private loadingScreen: ReturnType<typeof showLoadingScreen> | null = null;

  private showScannerLoadingOverlay(message?: string) {
    const configContainer = getElement(this.config.scannerViewConfig.container);
    this.loadingScreen = showLoadingScreen(configContainer, { message });
    configContainer.style.display = "block";
    configContainer.style.position = "relative";
  }

  /**
   *
   * @privateRemark
   */
  private hideScannerLoadingOverlay(hideContainer: boolean = false) {
    if (this.loadingScreen) {
      this.loadingScreen.hide();
      this.loadingScreen = null;

      if (hideContainer) {
        const configContainer = getElement(this.config.scannerViewConfig.container);
        configContainer.style.display = "none";
      }
    }
  }

  /**
   * Create a DocumentScanner instance with settings specified by a `DocumentScannerConfig` object.
   *
   * @param config {@link DocumentScannerConfig} set all main configurations, including UI toggles, data workflow callbacks, etc. You must set a valid license key with the `license` property. See {@link DocumentScannerConfig} for a complete description.
   *
   * @example
   * HTML:
   * ```html
   * <div id="myDocumentScannerContainer" style="width: 80vw; height: 80vh;"></div>
   * ```
   * JavaScript:
   * ```javascript
   * const documentScanner = new Dynamsoft.DocumentScanner({
   *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
   *     scannerViewConfig: {
   *         container: document.getElementById("myDocumentScannerViewContainer") // Use this container for the scanner view
   *     }
   * });
   * ```
   *
   * @public
   */
  constructor(private config: DocumentScannerConfig) {}

  async initialize(): Promise<{
    resources: SharedResources;
    components: {
      scannerView?: DocumentScannerView;
      correctionView?: DocumentCorrectionView;
      scanResultView?: DocumentResultView;
    };
  }> {
    if (this.isInitialized) {
      return {
        resources: this.resources as SharedResources,
        components: {
          scannerView: this.scannerView,
          correctionView: this.correctionView,
          scanResultView: this.scanResultView,
        },
      };
    }

    try {
      this.initializeDDSConfig();

      await this.initializeDCVResources();

      this.resources.onResultUpdated = (result) => {
        this.resources.result = result;
      };

      const components: {
        scannerView?: DocumentScannerView;
        correctionView?: DocumentCorrectionView;
        scanResultView?: DocumentResultView;
      } = {};

      // Only initialize components that are configured
      if (this.config.scannerViewConfig) {
        this.scannerView = new DocumentScannerView(this.resources, this.config.scannerViewConfig);
        components.scannerView = this.scannerView;
        await this.scannerView.initialize();
      }

      if (this.config.correctionViewConfig) {
        this.correctionView = new DocumentCorrectionView(
          this.resources,
          this.config.correctionViewConfig,
          this.scannerView
        );
        components.correctionView = this.correctionView;
      }

      if (this.config.resultViewConfig) {
        this.scanResultView = new DocumentResultView(
          this.resources,
          this.config.resultViewConfig,
          this.scannerView,
          this.correctionView
        );
        components.scanResultView = this.scanResultView;
      }

      this.isInitialized = true;

      return { resources: this.resources, components };
    } catch (ex: any) {
      this.isInitialized = false;

      let errMsg = ex?.message || ex;
      throw new Error(`Initialization Failed: ${errMsg}`);
    }
  }

  private async initializeDCVResources(): Promise<void> {
    try {
      //The following code uses the jsDelivr CDN, feel free to change it to your own location of these files
      CoreModule.engineResourcePaths = isEmptyObject(this.config?.engineResourcePaths)
        ? DEFAULT_DCV_ENGINE_RESOURCE_PATHS
        : this.config.engineResourcePaths;

      // Change trial link to include product and deploymenttype
      (LicenseManager as any)._onAuthMessage = (message: string) =>
        message.replace(
          "(https://www.dynamsoft.com/customer/license/trialLicense?product=unknown&deploymenttype=unknown)",
          "(https://www.dynamsoft.com/customer/license/trialLicense?product=mwc&deploymenttype=web)"
        );

      LicenseManager.initLicense(this.config?.license || "", true);

      // Optional. Used to load wasm resources in advance, reducing latency between video playing and document modules.
      CoreModule.loadWasm();

      this.resources.cameraView = await CameraView.createInstance(this.config.scannerViewConfig?.cameraEnhancerUIPath);
      this.resources.cameraEnhancer = await CameraEnhancer.createInstance(this.resources.cameraView);
      this.resources.cvRouter = await CaptureVisionRouter.createInstance();
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      throw new Error(`Resource Initialization Failed: ${errMsg}`);
    }
  }

  private shouldCreateDefaultContainer(): boolean {
    const hasNoMainContainer = !this.config.container;
    const hasNoViewContainers = !(
      this.config.scannerViewConfig?.container ||
      this.config.resultViewConfig?.container ||
      this.config.correctionViewConfig?.container
    );
    return hasNoMainContainer && hasNoViewContainers;
  }

  private createDefaultDDSContainer(): HTMLElement {
    const container = document.createElement("div");
    container.className = "dds-main-container";
    Object.assign(container.style, {
      display: "none",
      height: DEFAULT_CONTAINER_HEIGHT,
      width: "100%",
      /* Adding the following CSS rules to make sure the "default" container appears on top and over other elements. */
      position: "absolute",
      left: "0",
      top: "0",
      zIndex: "999",
    });
    document.body.append(container);
    return container;
  }

  private checkForTemporaryLicense(license?: string) {
    return !license?.length ||
      license?.startsWith("A") ||
      license?.startsWith("L") ||
      license?.startsWith("P") ||
      license?.startsWith("Y")
      ? "DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9"
      : license;
  }

  private validateViewConfigs() {
    // Only validate if there's no main container
    if (!this.config.container) {
      // Check correction view
      if (this.config.showCorrectionView && !this.config.correctionViewConfig?.container) {
        throw new Error(
          "CorrectionView container is required when showCorrectionView is true and no main container is provided"
        );
      }

      // Check result view
      if (this.config.showResultView && !this.config.resultViewConfig?.container) {
        throw new Error(
          "ResultView container is required when showResultView is true and no main container is provided"
        );
      }
    }
  }

  private showCorrectionView() {
    if (this.config.showCorrectionView === false) return false;

    // If we have a main container, follow existing logic
    if (this.config.container) {
      if (
        this.config.showCorrectionView === undefined &&
        (this.config.correctionViewConfig?.container || this.config.container)
      ) {
        return true;
      }
      return !!this.config.showCorrectionView;
    }

    // Without main container, require specific container
    return this.config.showCorrectionView && !!this.config.correctionViewConfig?.container;
  }

  private showResultView() {
    if (this.config.showResultView === false) return false;

    // If we have a main container, follow existing logic
    if (this.config.container) {
      if (
        this.config.showResultView === undefined &&
        (this.config.resultViewConfig?.container || this.config.container)
      ) {
        return true;
      }
      return !!this.config.showResultView;
    }

    // Without main container, require specific container
    return this.config.showResultView && !!this.config.resultViewConfig?.container;
  }

  private initializeDDSConfig() {
    this.validateViewConfigs();

    if (this.shouldCreateDefaultContainer()) {
      this.config.container = this.createDefaultDDSContainer();
    } else if (this.config.container) {
      this.config.container = getElement(this.config.container);
    }
    const viewContainers = this.config.container ? this.createViewContainers(getElement(this.config.container)) : {};

    const baseConfig = {
      license: this.checkForTemporaryLicense(this.config.license),
      utilizedTemplateNames: {
        detect: this.config.utilizedTemplateNames?.detect || DEFAULT_TEMPLATE_NAMES.detect,
        normalize: this.config.utilizedTemplateNames?.normalize || DEFAULT_TEMPLATE_NAMES.normalize,
      },
      templateFilePath: this.config?.templateFilePath || null,
    };

    // Views Config
    const scannerViewConfig = {
      ...this.config.scannerViewConfig,
      container: viewContainers[EnumDDSViews.Scanner] || this.config.scannerViewConfig?.container || null,
      cameraEnhancerUIPath: this.config.scannerViewConfig?.cameraEnhancerUIPath || DEFAULT_DCE_UI_PATH,
      templateFilePath: baseConfig.templateFilePath,
      utilizedTemplateNames: baseConfig.utilizedTemplateNames,
      _showCorrectionView: this.showCorrectionView(),
    };
    const correctionViewConfig = this.showCorrectionView()
      ? {
          ...this.config.correctionViewConfig,
          container: viewContainers[EnumDDSViews.Correction] || this.config.correctionViewConfig?.container || null,
          templateFilePath: baseConfig.templateFilePath,
          utilizedTemplateNames: baseConfig.utilizedTemplateNames,
          _showResultView: this.showResultView(),
        }
      : undefined;
    const resultViewConfig = this.showResultView()
      ? {
          ...this.config.resultViewConfig,
          container: viewContainers[EnumDDSViews.Result] || this.config.resultViewConfig?.container || null,
        }
      : undefined;

    Object.assign(this.config, {
      ...baseConfig,
      scannerViewConfig,
      correctionViewConfig,
      resultViewConfig,
    });
  }

  private createViewContainers(mainContainer: HTMLElement): Record<string, HTMLElement> {
    mainContainer.textContent = "";

    const views: EnumDDSViews[] = [EnumDDSViews.Scanner];

    if (this.showCorrectionView()) views.push(EnumDDSViews.Correction);
    if (this.showResultView()) views.push(EnumDDSViews.Result);

    return views.reduce((containers, view) => {
      const viewContainer = document.createElement("div");
      viewContainer.className = `dds-${view}-view-container`;

      Object.assign(viewContainer.style, {
        height: "100%",
        width: "100%",
        display: "none",
        position: "relative",
      });

      mainContainer.append(viewContainer);
      containers[view] = viewContainer;
      return containers;
    }, {} as Record<string, HTMLElement>);
  }

  /**
   * Clean up resources and hide UI components.
   *
   * @example
   * ```js
   * documentScanner.dispose();
   * console.log("Scanner resources released.");
   * ```
   *
   * @public
   */
  dispose(): void {
    if (this.scanResultView) {
      this.scanResultView.dispose();
      this.scanResultView = null;
    }

    if (this.correctionView) {
      this.correctionView.dispose();
      this.correctionView = null;
    }

    this.scannerView = null;

    // Dispose resources
    if (this.resources.cameraEnhancer) {
      this.resources.cameraEnhancer.dispose();
      this.resources.cameraEnhancer = null;
    }

    if (this.resources.cameraView) {
      this.resources.cameraView.dispose();
      this.resources.cameraView = null;
    }

    if (this.resources.cvRouter) {
      this.resources.cvRouter.dispose();
      this.resources.cvRouter = null;
    }

    this.resources.result = null;
    this.resources.onResultUpdated = null;

    // Hide and clean containers
    const cleanContainer = (container?: HTMLElement | string) => {
      const element = getElement(container);
      if (element) {
        element.style.display = "none";
        element.textContent = "";
      }
    };

    cleanContainer(this.config.container);
    cleanContainer(this.config.scannerViewConfig?.container);
    cleanContainer(this.config.correctionViewConfig?.container);
    cleanContainer(this.config.resultViewConfig?.container);

    this.isInitialized = false;
  }

  /**
   * Process a File object to extract image information
   * @param file The File object to process
   * @returns Promise with the processed image blob and dimensions
   */
  private async processFileToBlob(file: File): Promise<{ blob: Blob; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        reject(new Error("Please select an image file"));
        return;
      }

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
            reject(new Error("Failed to create blob from image"));
          }
        }, file.type);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Processes an uploaded image file
   * @param file The file to process
   * @returns Promise with the document result
   */
  private async processUploadedFile(file: File): Promise<DocumentResult> {
    try {
      this.showScannerLoadingOverlay("Processing image...");

      // Process the file to get blob
      const { blob } = await this.processFileToBlob(file);

      // Use CaptureVisionRouter to process the image
      const resultItems = (await this.resources.cvRouter.capture(blob, this.config.utilizedTemplateNames.detect)).items;

      // Get the original image data from the first result item
      const originalImageData = (resultItems[0] as any)?.imageData;
      if (!originalImageData) {
        throw new Error("Failed to extract image data");
      }

      // Determine quadrilateral (document boundaries)
      let detectedQuadrilateral: Quadrilateral;
      if (resultItems.length <= 1) {
        // No boundaries detected, use full image
        const { width, height } = originalImageData;
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
        // Use detected quadrilateral
        detectedQuadrilateral = (
          resultItems.find(
            (item) => item.type === EnumCapturedResultItemType.CRIT_DETECTED_QUAD
          ) as DetectedQuadResultItem
        )?.location;
      }

      // Normalize the image (perspective correction)
      const settings = await this.resources.cvRouter.getSimplifiedSettings(this.config.utilizedTemplateNames.normalize);
      settings.roiMeasuredInPercentage = false;
      settings.roi.points = detectedQuadrilateral.points;
      await this.resources.cvRouter.updateSettings(this.config.utilizedTemplateNames.normalize, settings);

      const normalizedResult = await this.resources.cvRouter.capture(
        originalImageData,
        this.config.utilizedTemplateNames.normalize
      );

      const correctedImageResult = normalizedResult?.processedDocumentResult?.deskewedImageResultItems?.[0];

      // Create result object
      const result: DocumentResult = {
        status: {
          code: EnumResultStatus.RS_SUCCESS,
          message: "Success",
        },
        originalImageResult: originalImageData,
        correctedImageResult,
        detectedQuadrilateral,
        _flowType: EnumFlowType.STATIC_FILE,
      };

      // Update shared resources
      this.resources.onResultUpdated?.(result);

      // Done processing
      this.hideScannerLoadingOverlay(true);
    } catch (error) {
      console.error("Failed to process uploaded file:", error);
      return {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: `Failed to process image: ${error.message || error}`,
        },
      };
    }
  }

  /**
   * Start the document scanning workflow at the {@link DocumentScannerView | `DocumentScannerView`} by default.
   *
   * @remarks
   * {@link File | Passing a file path of an image} to `file` allows scanning from the image and bypassing camera input as well as the {@link DocumentScannerView | `DocumentScannerView`}.
   *
   * @param
   * `file` - process the file and skip the {@link DocumentScannerView | `DocumentScannerView`} if passed
   *
   * @returns
   * results of the scan, including the original image, corrected image, detected boundaries, and scan status
   *
   * @example
   * ```javascript
   * const result = await documentScanner.launch();
   *
   * if (result?.correctedImageResult) {
   * 	 resultContainer.innerHTML = "";
   * 	 const canvas = result.correctedImageResult.toCanvas();
   * 	 resultContainer.appendChild(canvas);
   * } else {
   *   resultContainer.innerHTML = "<p>No image scanned. Please try again.</p>";
   * }
   * ```
   *
   * @public
   */
  async launch(file?: File): Promise<DocumentResult> {
    if (this.isCapturing) {
      throw new Error("Capture session already in progress");
    }

    try {
      this.isCapturing = true;

      const { components } = await this.initialize();

      if (this.config.container) {
        getElement(this.config.container).style.display = "block";
      }

      // Handle direct file upload if provided
      if (file) {
        components.scannerView = null;
        await this.processUploadedFile(file);
      }

      // Special case handling for direct views with existing results
      if (!components.scannerView && this.resources.result) {
        if (components.correctionView && !components.scanResultView) return await components.correctionView.launch();
        if (components.scanResultView && !components.correctionView) return await components.scanResultView.launch();
        if (components.scanResultView && components.correctionView) {
          await components.correctionView.launch();
          return await components.scanResultView.launch();
        }
      }

      // Scanner view is required if no existing result
      if (!components.scannerView && !this.resources.result) {
        throw new Error("Scanner view is required when no previous result exists");
      }

      // Main Flow
      if (components.scannerView) {
        const scanResult = await components.scannerView.launch();

        if (scanResult?.status.code !== EnumResultStatus.RS_SUCCESS) {
          return {
            status: {
              code: scanResult?.status.code,
              message: scanResult?.status.message || "Failed to capture image",
            },
          };
        }

        // Route based on capture method
        if (components.correctionView && components.scanResultView) {
          if (shouldCorrectImage(scanResult._flowType)) {
            await components.correctionView.launch();
            return await components.scanResultView.launch();
          }
        }

        // Default routing
        if (components.correctionView && !components.scanResultView) {
          return await components.correctionView.launch();
        }
        if (components.scanResultView) {
          return await components.scanResultView.launch();
        }
      }

      // If no additional views, return current result
      return this.resources.result;
    } catch (error) {
      console.error("Document capture flow failed:", error?.message || error);
      return {
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: `Document capture flow failed. ${error?.message || error}`,
        },
      };
    } finally {
      this.isCapturing = false;
      this.dispose();
    }
  }
}

export default DocumentScanner;

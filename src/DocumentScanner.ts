import { LicenseManager } from "dynamsoft-license";
import { CoreModule, EngineResourcePaths } from "dynamsoft-core";
import { CaptureVisionRouter } from "dynamsoft-capture-vision-router";
import { CameraEnhancer, CameraView } from "dynamsoft-camera-enhancer";
import DocumentCorrectionView, { DocumentCorrectionViewConfig } from "./views/DocumentCorrectionView";
import DocumentScannerView, { DocumentScannerViewConfig } from "./views/DocumentScannerView";
import DocumentResultView, { DocumentResultViewConfig } from "./views/DocumentResultView";
import {
  DEFAULT_TEMPLATE_NAMES,
  DocumentResult,
  EnumDDSViews,
  EnumResultStatus,
  UtilizedTemplateNames,
} from "./views/utils/types";
import { getElement, isEmptyObject, shouldCorrectImage } from "./views/utils";

// Default DCE UI path
const DEFAULT_DCE_UI_PATH =
  "https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.1.0/dist/document-scanner.ui.html";
const DEFAULT_DCV_ENGINE_RESOURCE_PATHS = { rootDirectory: "https://cdn.jsdelivr.net/npm/" };
const DEFAULT_CONTAINER_HEIGHT = "100dvh";

export interface DocumentScannerConfig {
  license?: string;
  container?: HTMLElement | string;

  // DCV specific configs
  templateFilePath?: string;
  utilizedTemplateNames?: UtilizedTemplateNames;
  engineResourcePaths?: EngineResourcePaths;

  // Views Config
  scannerViewConfig?: Omit<
    DocumentScannerViewConfig,
    "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView"
  >;

  resultViewConfig?: DocumentResultViewConfig;
  correctionViewConfig?: Omit<
    DocumentCorrectionViewConfig,
    "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView"
  >;
  showResultView?: boolean;
  showCorrectionView?: boolean;
}

export interface SharedResources {
  cvRouter?: CaptureVisionRouter;
  cameraEnhancer?: CameraEnhancer;
  cameraView?: CameraView;
  result?: DocumentResult;
  onResultUpdated?: (result: DocumentResult) => void;
}

class DocumentScanner {
  private scannerView?: DocumentScannerView;
  private scanResultView?: DocumentResultView;
  private correctionView?: DocumentCorrectionView;
  private resources: Partial<SharedResources> = {};
  private isInitialized = false;
  private isCapturing = false;

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
        this.correctionView = new DocumentCorrectionView(this.resources, this.config.correctionViewConfig);
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
      LicenseManager.initLicense(this.config?.license || "", true);

      //The following code uses the jsDelivr CDN, feel free to change it to your own location of these files
      CoreModule.engineResourcePaths = isEmptyObject(this.config?.engineResourcePaths)
        ? DEFAULT_DCV_ENGINE_RESOURCE_PATHS
        : this.config.engineResourcePaths;

      // Optional. Used to load wasm resources in advance, reducing latency between video playing and document modules.
      CoreModule.loadWasm(["DDN"]);

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
   * Launches the document scanning process.
   *
   * Configuration Requirements:
   * 1. A container must be provided either through:
   *    - A main container in config.container, OR
   *    - Individual view containers in viewConfig.container when corresponding show flags are true
   * 2. If no main container is provided:
   *    - showCorrectionView: true requires correctionViewConfig.container
   *    - showResultView: true requires resultViewConfig.container
   *
   * Flow paths based on view configurations and capture method:
   *
   * 1. All views enabled (Scanner, Correction, Result):
   *    A. Auto-capture paths:
   *       - Smart Capture: Scanner -> Correction -> Result
   *       - Auto Crop: Scanner -> Result
   *    B. Manual paths:
   *       - Upload Image: Scanner -> Correction -> Result
   *       - Manual Capture: Scanner -> Result
   *
   * 2. Scanner + Result only:
   *    - Flow: Scanner -> Result
   *    - Requires: showCorrectionView: false or undefined
   *
   * 3. Scanner + Correction only:
   *    - Flow: Scanner -> Correction
   *    - Requires: showResultView: false or undefined
   *
   * 4. Special cases:
   *    - Scanner only: Returns scan result directly
   *    - Correction only + existing result: Goes to Correction
   *    - Result only + existing result: Goes to Result
   *
   * @returns Promise<DocumentResult> containing:
   *  - status: Success/Failed/Cancelled with message
   *  - originalImageResult: Raw captured image
   *  - correctedImageResult: Normalized image (if correction applied)
   *  - detectedQuadrilateral: Document boundaries
   *  - _flowType: Internal routing flag for different capture methods
   *
   * @throws Error if:
   *  - Capture session is already running
   *  - Scanner view is required but not configured
   *  - No container is provided when showCorrectionView or showResultView is true
   */
  async launch(): Promise<DocumentResult> {
    if (this.isCapturing) {
      throw new Error("Capture session already in progress");
    }

    try {
      this.isCapturing = true;
      const { components } = await this.initialize();

      if (this.config.container) {
        getElement(this.config.container).style.display = "block";
      }

      // Special case handling for direct views with existing results
      if (!components.scannerView && this.resources.result) {
        if (components.correctionView) return await components.correctionView.launch();
        if (components.scanResultView) return await components.scanResultView.launch();
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

import { LicenseManager } from "dynamsoft-license";
import { CoreModule } from "dynamsoft-core";
import { CaptureVisionRouter } from "dynamsoft-capture-vision-router";
import { CameraEnhancer, CameraView } from "dynamsoft-camera-enhancer";
import DocumentCorrectionView, { DocumentCorrectionViewConfig } from "./views/DocumentCorrectionView";
import DocumentScannerView, { DocumentScannerViewConfig } from "./views/DocumentScannerView";
import ScanResultView, { ScanResultViewConfig } from "./views/ScanResultView";
import { DocumentScanResult, EnumResultStatus, UtilizedTemplateNames } from "./views/utils/types";
import { getElement } from "./views/utils";

// Default DCE UI path
const DEFAULT_DCE_UI_PATH = "../dist/document-scanner.ui.html";
//"https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner-trial@latest/dist/document-scanner.ui.html";
const DEFAULT_TEMPLATE_NAMES = {
  detect: "DetectDocumentBoundaries_Default",
  normalize: "NormalizeDocument_Default",
};
const DEFAULT_CONTAINER_HEIGHT = "100dvh";

export interface DocumentScannerConfig {
  license?: string;
  container?: HTMLElement | string;
  scannerViewConfig?: DocumentScannerViewConfig;
  scanResultViewConfig?: ScanResultViewConfig;
  correctionViewConfig?: DocumentCorrectionViewConfig;
  utilizedTemplateNames?: UtilizedTemplateNames;
}

export interface SharedResources {
  cvRouter?: CaptureVisionRouter;
  cameraEnhancer?: CameraEnhancer;
  cameraView?: CameraView;
  result?: DocumentScanResult;
  onResultUpdated?: (result: DocumentScanResult) => void;
}

// Main class
class DocumentScanner {
  private scannerView?: DocumentScannerView;
  private scanResultView?: ScanResultView;
  private correctionView?: DocumentCorrectionView;
  private resources: Partial<SharedResources> = {};
  private isCapturing = false;

  private shouldCreateDefaultContainer(): boolean {
    const hasNoMainContainer = !this.config.container;
    const hasNoViewContainers = !(
      this.config.scannerViewConfig?.container ||
      this.config.scanResultViewConfig?.container ||
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
      position: "fixed",
      left: "0px",
      top: "0px",
      zIndex: "999",
    });
    document.body.append(container);
    return container;
  }

  private hasAnyViewConfig(): boolean {
    return !!(
      this.config.scannerViewConfig?.container ||
      this.config.scanResultViewConfig?.container ||
      this.config.correctionViewConfig?.container
    );
  }

  private createViewContainers(mainContainer: HTMLElement): Record<string, HTMLElement> {
    const views: string[] = [];

    if (this.config.container || !this.config.scannerViewConfig?.container) {
      // If main container provided or no specific view containers, create all views
      views.push("scanner", "correction", "scan-result");
    } else {
      // Only create containers for specifically configured views
      if (this.config.scannerViewConfig?.container) views.push("scanner");
      if (this.config.correctionViewConfig?.container) views.push("correction");
      if (this.config.scanResultViewConfig?.container) views.push("scan-result");
    }

    mainContainer.textContent = "";

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

  constructor(private config: DocumentScannerConfig) {}

  async initializeConfig() {
    if (this.shouldCreateDefaultContainer()) {
      this.config.container = this.createDefaultDDSContainer();
    } else if (this.config.container) {
      this.config.container = getElement(this.config.container);
    }

    const viewContainers = this.config.container ? this.createViewContainers(getElement(this.config.container)) : {};

    // Base configuration
    const baseConfig = {
      license: this.config.license || "YOUR_LICENSE_HERE",
      utilizedTemplateNames: {
        detect: this.config.utilizedTemplateNames?.detect || DEFAULT_TEMPLATE_NAMES.detect,
        normalize: this.config.utilizedTemplateNames?.normalize || DEFAULT_TEMPLATE_NAMES.normalize,
      },
    };

    // Only initialize configs for views that should exist
    const shouldInitScanner = this.config.container || this.config.scannerViewConfig?.container;
    const shouldInitCorrection = this.config.container || this.config.correctionViewConfig?.container;
    const shouldInitResult = this.config.container || this.config.scanResultViewConfig?.container;

    Object.assign(this.config, {
      ...baseConfig,
      scannerViewConfig: shouldInitScanner
        ? {
            container: viewContainers["scanner"] || this.config.scannerViewConfig?.container || null,
            templateFilePath: this.config.scannerViewConfig?.templateFilePath || null,
            cameraEnhancerUIPath: this.config.scannerViewConfig?.cameraEnhancerUIPath || DEFAULT_DCE_UI_PATH,
            consecutiveResultFramesBeforeNormalization:
              this.config.scannerViewConfig?.consecutiveResultFramesBeforeNormalization || 30,
            utilizedTemplateNames: baseConfig.utilizedTemplateNames,
          }
        : undefined,
      correctionViewConfig: shouldInitCorrection
        ? {
            container: viewContainers["correction"] || this.config.correctionViewConfig?.container || null,
            onFinish: this.config.correctionViewConfig?.onFinish,
            utilizedTemplateNames: baseConfig.utilizedTemplateNames,
          }
        : undefined,
      scanResultViewConfig: shouldInitResult
        ? {
            container: viewContainers["scan-result"] || this.config.scanResultViewConfig?.container || null,
            onDone: this.config.scanResultViewConfig?.onDone,
          }
        : undefined,
    });
  }

  async initialize(): Promise<{
    scannerView?: DocumentScannerView;
    correctionView?: DocumentCorrectionView;
    scanResultView?: ScanResultView;
  }> {
    try {
      await this.initializeConfig();
      await this.initializeResources();

      this.resources.onResultUpdated = (result) => {
        this.resources.result = result;
      };

      const components: {
        scannerView?: DocumentScannerView;
        correctionView?: DocumentCorrectionView;
        scanResultView?: ScanResultView;
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

      if (this.config.scanResultViewConfig) {
        this.scanResultView = new ScanResultView(
          this.resources,
          this.config.scanResultViewConfig,
          this.scannerView,
          this.correctionView
        );
        components.scanResultView = this.scanResultView;
      }

      return components;
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      throw new Error(`DDS Initialization Failed: ${errMsg}`);
    }
  }

  private async initializeResources(): Promise<void> {
    try {
      LicenseManager.initLicense(this.config?.license || "", true);

      //The following code uses the jsDelivr CDN, feel free to change it to your own location of these files
      CoreModule.engineResourcePaths.rootDirectory = "https://cdn.jsdelivr.net/npm/";

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
    cleanContainer(this.config.scanResultViewConfig?.container);
  }

  // Workflow
  /**
   * Launches the document scanning process.
   *
   * The flow varies based on which view containers are configured:
   *
   * 1. All views present (scanner, correction, scanResult):
   *    - Flow: Scanner -> ScanResult (correction available in ScanResult)
   *
   * 2. Only scanner + scanResult:
   *    - Flow: Scanner -> ScanResult
   *
   * 3. Only scanner + correction:
   *    - Flow: Scanner -> Correction
   *
   * 4. Only correction:
   *    - Flow: Correction (uses existing result if available)
   *
   * 5. Only scanResult:
   *    - Flow: ScanResult (uses existing result if available)
   *
   * 6. Only scanner:
   *    - Flow: Scanner (returns scan result)
   *
   * @returns Promise<DocumentScanResult> - Resolves with the scan result which includes:
   *  - status: Success/Failed/Cancelled
   *  - originalImageResult: Original captured image (if scanner used)
   *  - correctedImageResult: Normalized image (if correction performed)
   *  - detectedQuadrilateral: Document boundaries
   *
   * @throws Error if a capture session is already in progress
   */
  async launch(): Promise<DocumentScanResult> {
    if (this.isCapturing) {
      throw new Error("Capture session already in progress");
    }

    try {
      this.isCapturing = true;
      const components = await this.initialize();

      if (this.config.container) {
        getElement(this.config.container).style.display = "block";
      }

      // Handle direct correction view
      if (!components.scannerView && components.correctionView && this.resources.result) {
        return await components.correctionView.launch();
      }

      // Handle direct scan result view
      if (!components.scannerView && components.scanResultView && this.resources.result) {
        return await components.scanResultView.launch();
      }

      // Scanner view is required if no existing result
      if (!components.scannerView && !this.resources.result) {
        throw new Error("Scanner view is required when no previous result exists");
      }

      // If scanner view exists, start with scanning
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
      }

      // Determine next view in flow
      if (components.correctionView && !components.scanResultView) {
        // Scanner -> Correction or direct Correction
        return await components.correctionView.launch();
      } else if (components.scanResultView) {
        // Scanner -> ScanResult or direct ScanResult
        return await components.scanResultView.launch();
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

  /**
   * Checks if a capture session is currently in progress
   */
  isCapturingImage(): boolean {
    return this.isCapturing;
  }
}

export default DocumentScanner;

import { LicenseManager } from "dynamsoft-license";
import { CoreModule } from "dynamsoft-core";
import { CaptureVisionRouter } from "dynamsoft-capture-vision-router";
import { CameraEnhancer, CameraView } from "dynamsoft-camera-enhancer";
import DocumentCorrectionView, { DocumentCorrectionViewConfig } from "./views/DocumentCorrectionView";
import DocumentScannerView, { DocumentScannerViewConfig } from "./views/DocumentScannerView";
import ScanResultView, { ScanResultViewConfig } from "./views/ScanResultView";
import { DocumentScanResult, EnumResultStatusCode, UtilizedTemplateNames } from "./views/utils/types";
import { getElement } from "./views/utils";

// Default DCE UI path
const DEFAULT_DCE_UI_PATH =
  "https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner-trial@latest/dist/document-scanner.ui.html";
const DEFAULT_TEMPLATE_NAMES = {
  detect: "DetectDocumentBoundaries_Default",
  normalize: "NormalizeDocument_Default",
};
const DEFAULT_CONTAINER_HEIGHT = "100vh";

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
    return (
      !this.config.container &&
      !this.config.scannerViewConfig?.container &&
      !this.config.scanResultViewConfig?.container &&
      !this.config.correctionViewConfig?.container
    );
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

  private createViewContainers(mainContainer: HTMLElement): Record<string, HTMLElement> {
    const views = ["scanner", "correction", "scan-result"];
    mainContainer.textContent = ""; // Clear container

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
    // If users provide container through DDS, create the containers for them
    if (this.shouldCreateDefaultContainer()) {
      this.config.container = this.createDefaultDDSContainer();
    } else if (this.config.container) {
      this.config.container = getElement(this.config.container);
    }

    const viewContainers = this.config.container ? this.createViewContainers(getElement(this.config.container)) : {};

    Object.assign(this.config, {
      license: this.config.license || "YOUR_LICENSE_HERE",
      scannerViewConfig: {
        container: viewContainers["scanner"] || this.config.scannerViewConfig?.container || null,
        templateFilePath: this.config.scannerViewConfig?.templateFilePath || null,
        cameraEnhancerUIPath: this.config.scannerViewConfig?.cameraEnhancerUIPath || DEFAULT_DCE_UI_PATH,
        consecutiveResultFramesBeforeNormalization:
          this.config.scannerViewConfig?.consecutiveResultFramesBeforeNormalization || 30,
        utilizedTemplateNames: {
          detect: this.config.utilizedTemplateNames?.detect || DEFAULT_TEMPLATE_NAMES.detect,
          normalize: this.config.utilizedTemplateNames?.normalize || DEFAULT_TEMPLATE_NAMES.normalize,
        },
      },
      scanResultViewConfig: {
        container: viewContainers["scan-result"] || this.config.scanResultViewConfig?.container || null,
        controls: this.config.scanResultViewConfig?.controls,
        onContinue: this.config.scanResultViewConfig?.onContinue,
      },
      correctionViewConfig: {
        container: viewContainers["correction"] || this.config.correctionViewConfig?.container || null,
        controls: this.config.correctionViewConfig?.controls,
        onFinish: this.config.correctionViewConfig?.onFinish,
        utilizedTemplateNames: {
          detect: this.config.utilizedTemplateNames?.detect || DEFAULT_TEMPLATE_NAMES.detect,
          normalize: this.config.utilizedTemplateNames?.normalize || DEFAULT_TEMPLATE_NAMES.normalize,
        },
      },
    });
  }

  async initialize(): Promise<{
    scannerView: DocumentScannerView;
    correctionView: DocumentCorrectionView;
    scanResultView: ScanResultView;
  }> {
    try {
      this.initializeConfig();

      // Initialize shared resources
      await this.initializeResources();

      // Setup Result Updating
      this.resources.onResultUpdated = (result) => {
        this.resources.result = result;
      };

      // Create components
      this.scannerView = new DocumentScannerView(this.resources, this.config.scannerViewConfig);
      this.correctionView = new DocumentCorrectionView(this.resources, this.config.correctionViewConfig);
      // Create scan result view with references to scanner view and correction view
      this.scanResultView = new ScanResultView(
        this.resources,
        this.config.scanResultViewConfig,
        this.scannerView,
        this.correctionView
      );

      // Initialize components
      await this.scannerView.initialize();

      return {
        scannerView: this.scannerView,
        scanResultView: this.scanResultView,
        correctionView: this.correctionView,
      };
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
    this.scanResultView?.dispose();
    this.correctionView?.dispose();
    this.scanResultView = null;
    this.correctionView = null;
    this.scannerView = null;

    this.resources.cameraEnhancer?.dispose();
    this.resources.cvRouter?.dispose();
    this.resources.result = null;

    if (this.config.container) {
      getElement(this.config.container).style.display = "none";
    }
  }

  // Workflow
  /**
   * Starts the complete Image capture flow:
   * 1. Initializes camera and scanning
   * 2. Captures the Image
   * 3. Shows preview with options to correct (normalize)
   * @returns Promise that resolves with the final scan results
   */
  async launch(): Promise<DocumentScanResult> {
    // Prevent multiple capture sessions
    if (this.isCapturing) {
      throw new Error("Capture session already in progress");
    }

    try {
      this.isCapturing = true;

      // InitializeInitialize components if not already done
      const components = await this.initialize();
      this.scannerView = components.scannerView;
      this.scanResultView = components.scanResultView;
      this.correctionView = components.correctionView;

      // Show container if exist
      if (this.config.container) {
        getElement(this.config.container).style.display = "block";
      }

      // Start scanning process
      const scanResult = await this.scannerView.launch();

      if (scanResult?.status.code !== EnumResultStatusCode.SUCCESS) {
        return {
          status: {
            code: scanResult?.status.code,
            message: scanResult?.status.message || "Failed to capture image",
          },
        };
      }

      // Show scanResultView with the captured result
      const scanResultView = await this.scanResultView.launch();

      return scanResultView;
    } catch (error) {
      console.error("Document capture flow failed:", error?.message || error);
      return {
        status: {
          code: EnumResultStatusCode.FAILED,
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

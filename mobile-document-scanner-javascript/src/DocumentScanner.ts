import { LicenseManager } from "dynamsoft-license";
import { CoreModule } from "dynamsoft-core";
import { CaptureVisionRouter } from "dynamsoft-capture-vision-router";
import { CameraEnhancer, CameraView } from "dynamsoft-camera-enhancer";
import DocumentCorrectionView, { DocumentCorrectionViewConfig } from "./views/DocumentCorrectionView";
import DocumentScannerView, { DocumentScannerViewConfig } from "./views/DocumentScannerView";
import ScanResultView, { ScanResultViewConfig } from "./views/ScanResultView";
import { DocumentScanResult, EnumResultStatusCode, UtilizedTemplateNames } from "./views/utils/types";

// Default DCE UI path
const DEFAULT_DCE_UI_PATH = "../dist/document-scanner.ui.html";
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
      height: DEFAULT_CONTAINER_HEIGHT,
      width: "100%",
    });
    document.body.append(container);
    return container;
  }

  private getContainer(containerConfig: string | HTMLElement): HTMLElement | null {
    if (typeof containerConfig === "string") {
      return document.querySelector(containerConfig);
    }
    return containerConfig instanceof HTMLElement ? containerConfig : null;
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
      });

      mainContainer.append(viewContainer);
      containers[view] = viewContainer;
      return containers;
    }, {} as Record<string, HTMLElement>);
  }

  constructor(private config: DocumentScannerConfig) {
    // If users provide container through DDS, create the containers for them
    this.config.container = this.shouldCreateDefaultContainer()
      ? this.createDefaultDDSContainer()
      : this.config.container;

    const viewContainers = this.config.container
      ? this.createViewContainers(this.getContainer(this.config.container))
      : {};

    this.config = {
      license: config.license || "YOUR_LICENSE_HERE",
      scannerViewConfig: {
        container: viewContainers["scanner"] || config.scannerViewConfig?.container || null,
        templateFilePath: config.scannerViewConfig?.templateFilePath || null,
        cameraEnhancerUIPath: config.scannerViewConfig?.cameraEnhancerUIPath || DEFAULT_DCE_UI_PATH,
        consecutiveResultFramesBeforeNormalization:
          config.scannerViewConfig?.consecutiveResultFramesBeforeNormalization || 30,
        utilizedTemplateNames: {
          detect: config.utilizedTemplateNames?.detect || DEFAULT_TEMPLATE_NAMES.detect,
          normalize: config.utilizedTemplateNames?.normalize || DEFAULT_TEMPLATE_NAMES.normalize,
        },
      },
      scanResultViewConfig: {
        container: viewContainers["scan-result"] || config.scanResultViewConfig?.container || null,
        controls: config.scanResultViewConfig?.controls,
        onContinue: config.scanResultViewConfig?.onContinue,
      },
      correctionViewConfig: {
        container: viewContainers["correction"] || config.correctionViewConfig?.container || null,
        controls: config.correctionViewConfig?.controls,
        onFinish: config.correctionViewConfig?.onFinish,
        utilizedTemplateNames: {
          detect: config.utilizedTemplateNames?.detect || DEFAULT_TEMPLATE_NAMES.detect,
          normalize: config.utilizedTemplateNames?.normalize || DEFAULT_TEMPLATE_NAMES.normalize,
        },
      },
    };
  }

  async initialize(): Promise<{
    scannerView: DocumentScannerView;
    correctionView: DocumentCorrectionView;
    scanResultView: ScanResultView;
  }> {
    try {
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
    this.resources.cameraEnhancer?.close();
    this.resources.cvRouter?.dispose();
    this.resources.result = null;
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

      // Initialize components if not already done
      if (!this.scannerView || !this.scanResultView || !this.correctionView) {
        const components = await this.initialize();
        this.scannerView = components.scannerView;
        this.scanResultView = components.scanResultView;
        this.correctionView = components.correctionView;
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
    }
  }

  /**
   * Checks if a capture session is currently in progress
   */
  isCapturingImage(): boolean {
    return this.isCapturing;
  }

  /**
   * Cancels the current capture session if one is in progress
   */
  async cancelImageCapture(): Promise<void> {
    if (!this.isCapturing) {
      return;
    }

    try {
      // Close camera if open
      await this.scannerView?.closeCamera();

      // Hide scan result view if showing
      this.scanResultView?.hideView();

      // Hide correction view if showing
      this.correctionView?.hideView();

      // Reset state
      this.isCapturing = false;

      this.dispose();
    } catch (error) {
      console.error("Error canceling capture:", error);
      throw error;
    }
  }
}

export default DocumentScanner;

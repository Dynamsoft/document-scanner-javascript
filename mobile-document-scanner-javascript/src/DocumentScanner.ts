import { LicenseManager } from "dynamsoft-license";
import { CoreModule } from "dynamsoft-core";
import { CaptureVisionRouter } from "dynamsoft-capture-vision-router";
import { CameraEnhancer, CameraView } from "dynamsoft-camera-enhancer";
import DocumentNormalizerView, { DocumentNormalizerViewConfig } from "./views/DocumentNormalizerView";
import DocumentScannerView, { DocumentScanResult, EnumResultStatusCode } from "./views/DocumentScannerView";
import ScanResultView, { ScanResultViewConfig } from "./views/ScanResultView";

// Default DCE UI path
const DEFAULT_DCE_UI_PATH = "../dist/document-scanner.ui.html";

// Interfaces
export interface UtilizedTemplateNames {
  detect: string;
  normalize: string;
}

export interface DocumentScannerConfig {
  license?: string;
  templateFilePath?: string;
  cameraEnhancerUIPath?: string;
  cameraViewContainer: HTMLElement;
  scanResultViewConfig?: ScanResultViewConfig;
  documentNormalizerViewConfig?: DocumentNormalizerViewConfig;
  consecutiveResultFramesBeforeNormalization?: number;
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
  private normalizerView?: DocumentNormalizerView;
  private resources: Partial<SharedResources> = {};
  private isCapturing = false;

  constructor(private config: DocumentScannerConfig) {
    this.config = {
      license: config.license || "",
      templateFilePath: config.templateFilePath || null,
      cameraEnhancerUIPath: config.cameraEnhancerUIPath || DEFAULT_DCE_UI_PATH,
      cameraViewContainer: config.cameraViewContainer || null,
      scanResultViewConfig: {
        container: config.scanResultViewConfig?.container || null,
        controls: config.scanResultViewConfig?.controls,
        onContinue: config.scanResultViewConfig?.onContinue,
      },
      documentNormalizerViewConfig: {
        container: config.documentNormalizerViewConfig?.container || null,
        controls: config.documentNormalizerViewConfig?.controls,
        onFinish: config.documentNormalizerViewConfig?.onFinish,
      },
      consecutiveResultFramesBeforeNormalization: config.consecutiveResultFramesBeforeNormalization || 30,
      utilizedTemplateNames: {
        detect: config.utilizedTemplateNames?.detect || "DetectDocumentBoundaries_Default",
        normalize: config.utilizedTemplateNames?.normalize || "NormalizeDocument_Default",
      },
    };

    if (config.license) {
      LicenseManager.initLicense(config.license, true);

      // Currently if no license is provided, uses trial license

      // TODO remove if not needed Recalculate the scan region when the window size changes TODO
      // window.addEventListener("resize", this.handleResize.bind(this));
    }

    if (!config.cameraViewContainer) {
      throw new Error("Please create a Camera View Container element");
    }
  }

  async initialize(): Promise<{
    scannerView: DocumentScannerView;
    normalizerView: DocumentNormalizerView;
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
      this.scannerView = new DocumentScannerView(this.resources, this.config);
      this.normalizerView = new DocumentNormalizerView(this.resources, this.config);
      // Create preview with references to scanner and normalizer
      this.scanResultView = new ScanResultView(this.resources, this.config, this.scannerView, this.normalizerView);

      // Initialize components
      await this.scannerView.initialize();

      return {
        scannerView: this.scannerView,
        scanResultView: this.scanResultView,
        normalizerView: this.normalizerView,
      };
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error("Initialization Failed:", errMsg);
      alert("Initialization Failed");
    }
  }

  private async initializeResources(): Promise<void> {
    //The following code uses the jsDelivr CDN, feel free to change it to your own location of these files
    CoreModule.engineResourcePaths.rootDirectory = "https://cdn.jsdelivr.net/npm/";
    CoreModule.engineResourcePaths.dce =
      "https://cdn.jsdelivr.net/npm/dynamsoft-camera-enhancer@4.1.0-beta-202410310121/dist/";

    // Optional. Used to load wasm resources in advance, reducing latency between video playing and document modules.
    CoreModule.loadWasm(["DDN"]);

    this.resources.cameraView = await CameraView.createInstance(this.config.cameraEnhancerUIPath);
    this.resources.cameraEnhancer = await CameraEnhancer.createInstance(this.resources.cameraView);
    this.resources.cvRouter = await CaptureVisionRouter.createInstance();
  }

  dispose(): void {
    this.scanResultView?.dispose();
    this.normalizerView?.dispose();
    this.resources.cameraEnhancer?.close();
    this.resources.cvRouter?.dispose();
    this.resources.result = null;
  }

  // Workflow
  /**
   * Starts the complete Image capture flow:
   * 1. Initializes camera and scanning
   * 2. Captures the Image
   * 3. Shows preview with options to edit/normalize
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
      if (!this.scannerView || !this.scanResultView || !this.normalizerView) {
        const components = await this.initialize();
        this.scannerView = components.scannerView;
        this.scanResultView = components.scanResultView;
        this.normalizerView = components.normalizerView;
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

      // Hide preview if showing
      this.scanResultView?.hidePreview();

      // Hide normalizer if showing
      this.normalizerView?.hideEditor();

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

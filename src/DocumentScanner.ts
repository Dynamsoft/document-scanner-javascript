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
  MultiFrameResultCrossFilter,
  OriginalImageResultItem,
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

/**
 * Default path to the Dynamsoft Camera Enhancer UI XML configuration file.
 *
 * @remarks
 * This CDN-hosted XML file defines the camera view UI layout and controls for the scanner view.
 * You can override this by setting {@link DocumentScannerConfig.scannerViewConfig.cameraEnhancerUIPath} to self-host or customize the resource.
 *
 * @defaultValue "https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.4.0/dist/document-scanner.ui.xml"
 *
 * @internal
 */
const DEFAULT_DCE_UI_PATH =
  "https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.4.0/dist/document-scanner.ui.xml";

/**
 * Default paths to Dynamsoft Capture Vision engine resources (WASM files and dependencies).
 *
 * @remarks
 * Points to the `jsDelivr` CDN root directory where engine resources are hosted.
 * You can override this by setting {@link DocumentScannerConfig.engineResourcePaths} to self-host or customize the resource.
 *
 * @defaultValue { rootDirectory: "https://cdn.jsdelivr.net/npm/" }
 *
 * @internal
 */
const DEFAULT_DCV_ENGINE_RESOURCE_PATHS = { rootDirectory: "https://cdn.jsdelivr.net/npm/" };

/**
 * Default height for the main {@link DocumentScanner} container.
 *
 * @remarks
 * Uses dynamic viewport height (`100dvh`) to fill the entire viewport height,
 * accounting for browser UI elements on mobile devices.
 *
 * @defaultValue "100dvh"
 *
 * @internal
 */
const DEFAULT_CONTAINER_HEIGHT = "100dvh";

/**
 * The `DocumentScannerConfig` interface passes settings to the {@link DocumentScanner} constructor to apply a comprehensive set of UI and business logic customizations.
 *
 * @remarks
 * Only advanced scenarios require editing the UI template or MDS source code. {@link DocumentScannerConfig.license} is the only property required to instantiate a {@link DocumentScanner} object. MDS uses sensible default values for all other omitted properties.
 *
 * @example
 * ```typescript
 * const config = {
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     scannerViewConfig: {
 *         cameraEnhancerUIPath: "./dist/document-scanner.ui.xml", // Use the local file
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
   * This is the only required property to instantiate a {@link DocumentScanner} object.
   *
   * @public
   * @stable
   */
  license?: string;
  /**
   * The container element or selector for the {@link DocumentScanner} UI.
   *
   * @public
   * @stable
   */
  container?: HTMLElement | string;
  /**
   * The file path to the Capture Vision template used for document scanning.
   *
   * @remarks
   * You may set custom paths to self-host the template or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
   *
   * @public
   * @stable
   */
  templateFilePath?: string;
  /**
   * Capture Vision template names for document detection and normalization.
   *
   * @remarks
   * This typically does not need to be set as MDS provides a default template for general use. You may set custom names to self-host resources or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
   * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV templates}
   *
   * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
   *
   * @public
   * @stable
   */
  utilizedTemplateNames?: UtilizedTemplateNames;
  /**
   * Paths to the necessary engine resources (such as `.wasm` files) for the scanning engine.
   *
   * @remarks
   * The default paths point to CDNs so this may be left unset. You may set custom paths to self-host resources or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
   *
   * @public
   * @stable
   */
  engineResourcePaths?: EngineResourcePaths;
  /**
   * Configuration settings for the {@link DocumentScannerView}.
   *
   * @remarks
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#workflow-customization | Workflow customization}
   *
   * @public
   * @stable
   */
  scannerViewConfig?: Omit<
    DocumentScannerViewConfig,
    "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView"
  >;
  /**
   * Configuration settings for the {@link DocumentResultView}.
   *
   * @remarks
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#workflow-customization | Workflow customization}
   *
   * @public
   * @stable
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
   * @stable
   */
  showResultView?: boolean;
  /**
   * Sets the visibility of the {@link DocumentCorrectionView}.
   *
   * @defaultValue true
   * @public
   * @stable
   */
  showCorrectionView?: boolean;
  /**
   * Enable continuous scanning mode where the scanner loops back after each successful scan instead of exiting. {@link DocumentScanner.launch} only resolves to the last scanned result. Use {@link onDocumentScanned} callback to get scan results.
   *
   * @remarks
   * When enabled:
   * - The scanner automatically loops back to capture another document after each successful scan
   * - The {@link onDocumentScanned} callback triggers after each scan with the result; this is the only way to get the scanned results as {@link DocumentScanner.launch} only returns the last scanned result
   * - Users can exit by clicking the close button (X) or by calling {@link DocumentScanner.stopContinuousScanning}
   * - The DocumentScanner only retains the most recent scan result
   *
   * @defaultValue false
   * @public
   * @stable
   */
  enableContinuousScanning?: boolean;
  /**
   * Callback invoked after each successful scan in continuous scanning mode.
   *
   * @remarks
   * This callback is only called when {@link enableContinuousScanning} is true. The scanner loops back to capture another document after this callback completes. The callback receives a {@link DocumentResult} containing the original image, corrected image, detected boundaries, and scan status.
   *
   * @param result - The {@link DocumentResult} of the scan
   *
   * @example
   * ```javascript
   * const documentScanner = new Dynamsoft.DocumentScanner({
   *     license: "YOUR_LICENSE_KEY_HERE",
   *     enableContinuousScanning: true,
   *     onDocumentScanned: async (result) => {
   *         // Process each scanned document
   *         const canvas = result.correctedImageResult.toCanvas();
   *         document.getElementById("results").appendChild(canvas);
   *     }
   * });
   * ```
   *
   * @public
   * @stable
   */
  onDocumentScanned?: (result: DocumentResult) => void | Promise<void>;
  /**
   * Callback invoked when the thumbnail preview is clicked in continuous scanning mode.
   *
   * @remarks
   * This callback is only invoked when:
   * - {@link enableContinuousScanning} is enabled
   * - {@link showCorrectionView} is disabled
   * - {@link showResultView} is disabled
   *
   * The thumbnail preview displays the most recently scanned document. By default, clicking it does nothing unless this callback is defined, allowing you to implement custom behavior such as re-editing the image.
   *
   * @param result - The {@link DocumentResult} of the last scanned document
   *
   * @example
   * ```javascript
   * const documentScanner = new Dynamsoft.DocumentScanner({
   *     license: "YOUR_LICENSE_KEY_HERE",
   *     enableContinuousScanning: true,
   *     showCorrectionView: false,
   *     showResultView: false,
   *     onThumbnailClicked: async (result) => {
   *         // Handle thumbnail click event
   *         console.log('Thumbnail clicked', result);
   *         // Could open a custom editor, display metadata, etc.
   *     }
   * });
   * ```
   *
   * @public
   * @stable
   */
  onThumbnailClicked?: (result: DocumentResult) => void | Promise<void>;
  /**
   * Enable automatic frame verification for best quality capture.
   *
   * @remarks
   * When enabled, uses clarity detection and cross-filtering to automatically find the clearest frame.
   * This uses the same algorithm as the React reference implementation.
   *
   * @defaultValue true
   * @public
   * @stable
   */
  enableFrameVerification?: boolean;
}

/**
 * Internal interface for shared resources used across different views in the {@link DocumentScanner}.
 *
 * @remarks
 * This interface manages the coordination of resources between {@link DocumentScannerView}, {@link DocumentCorrectionView}, and {@link DocumentResultView}. It holds references to the Dynamsoft Capture Vision components, the current scan result, and callbacks for handling result updates and user interactions.
 *
 * @internal
 */
export interface SharedResources {
  /**
   * The Capture Vision Router instance for processing images and detecting document boundaries.
   *
   * @internal
   */
  cvRouter?: CaptureVisionRouter;
  /**
   * The Camera Enhancer instance for camera control and video streaming.
   *
   * @internal
   */
  cameraEnhancer?: CameraEnhancer;
  /**
   * The Camera View instance for displaying the camera feed and UI overlays.
   *
   * @internal
   */
  cameraView?: CameraView;
  /**
   * The current document scan result containing the original image, corrected image, and detected boundaries.
   *
   * @internal
   */
  result?: DocumentResult;
  /**
   * Callback invoked when the scan result is updated.
   *
   * @param result - The updated {@link DocumentResult}
   *
   * @internal
   */
  onResultUpdated?: (result: DocumentResult) => void;
  /**
   * Flag indicating whether continuous scanning mode is enabled.
   *
   * @remarks
   * Corresponds to {@link DocumentScannerConfig.enableContinuousScanning}.
   *
   * @internal
   */
  enableContinuousScanning?: boolean;
  /**
   * Counter tracking the number of successfully completed scans in continuous scanning mode.
   *
   * @internal
   */
  completedScansCount?: number;
  /**
   * Callback invoked when the thumbnail preview is clicked in continuous scanning mode.
   *
   * @remarks
   * Corresponds to {@link DocumentScannerConfig.onThumbnailClicked}.
   *
   * @param result - The {@link DocumentResult} associated with the thumbnail
   *
   * @internal
   */
  onThumbnailClicked?: (result: DocumentResult) => void | Promise<void>;
}

/**
 * Main class for document scanning functionality with camera capture, document detection, perspective correction, and result management.
 *
 * @remarks
 * The `DocumentScanner` class provides a complete document scanning solution that integrates camera access, real-time document boundary detection, manual boundary adjustment, and image perspective correction. It orchestrates three main views:
 * - {@link DocumentScannerView}: Camera interface with document detection and capture modes
 * - {@link DocumentCorrectionView}: Manual boundary adjustment interface
 * - {@link DocumentResultView}: Result preview and action interface
 *
 * The class supports both single-scan and continuous scanning modes. In continuous mode, the scanner loops back after each successful scan, allowing multiple documents to be captured in sequence.
 *
 * @example
 * Basic usage with default configuration:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE"
 * });
 *
 * const result = await documentScanner.launch();
 * if (result?.correctedImageResult) {
 *     const canvas = result.correctedImageResult.toCanvas();
 *     document.body.appendChild(canvas);
 * }
 * ```
 *
 * @example
 * Continuous scanning mode:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     enableContinuousScanning: true,
 *     onDocumentScanned: async (result) => {
 *         // Process each scanned document
 *         await uploadToServer(result.correctedImageResult);
 *     }
 * });
 *
 * await documentScanner.launch();
 * ```
 *
 * @example
 * Process an existing image file:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE"
 * });
 *
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const result = await documentScanner.launch(file);
 * ```
 *
 * @public
 * @stable
 */
class DocumentScanner {
  private scannerView?: DocumentScannerView;
  private scanResultView?: DocumentResultView;
  private correctionView?: DocumentCorrectionView;
  private resources: Partial<SharedResources> = {};
  private isInitialized = false;
  private isCapturing = false;
  private shouldStopContinuousScanning = false; // Signals to break out of continuous scanning

  private loadingScreen: ReturnType<typeof showLoadingScreen> | null = null;

  /**
   * Display a loading overlay on top of the {@link DocumentScannerView}.
   *
   * @param message - Optional message to display in the loading overlay
   *
   * @remarks
   * This method shows a loading screen over the scanner container with an optional custom message.
   * It also ensures the container is visible and properly positioned.
   * 
   * Used internally during {@link initialize} and when processing uploaded files via {@link processUploadedFile}.
   * Call {@link hideScannerLoadingOverlay} to remove the overlay.
   *
   * @internal
   */
  private showScannerLoadingOverlay(message?: string) {
    const configContainer = getElement(this.config.scannerViewConfig.container);
    this.loadingScreen = showLoadingScreen(configContainer, { message });
    configContainer.style.display = "block";
    configContainer.style.position = "relative";
  }

  /**
   * Hide the loading overlay displayed over the scanner view.
   *
   * @param hideContainer - Whether to also hide the scanner container.
   *
   * @remarks
   * This method removes the loading screen overlay created by {@link showScannerLoadingOverlay}. 
   * If `hideContainer` is true, it also hides the entire scanner container element.
   *
   * @internal
   */
  private hideScannerLoadingOverlay(hideContainer: boolean = false) {
    this.loadingScreen?.hide();

    if (hideContainer) {
      const configContainer = getElement(this.config.scannerViewConfig.container);
      configContainer.style.display = "none";
    }
  }

  /**
   * Create a DocumentScanner instance with settings specified by a {@link DocumentScannerConfig} object.
   *
   * @param config - The {@link DocumentScannerConfig} to set all main configurations, including UI toggles, data workflow callbacks, etc. You must set a valid license key with the `license` property. See {@link DocumentScannerConfig} for a complete description.
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

  /**
   * Initialize the DocumentScanner by setting up Dynamsoft Capture Vision resources and view components.
   *
   * @remarks
   * **This method is called automatically by {@link launch} and typically does not need to be invoked manually.**
   *
   * This method performs the following initialization steps:
   * 1. Validates and processes the configuration provided to the constructor
   * 2. Initializes Dynamsoft Capture Vision engine resources (license, camera, router)
   * 3. Creates and initializes the configured view components (scanner, correction, result)
   * 4. Sets up shared resources and callbacks for communication between views
   *
   * The method is idempotent - calling it multiple times will return the same resources and components without re-initialization.
   *
   * @returns A promise that resolves to an object containing:
   * - `resources`: The {@link SharedResources} object containing camera, router, and state
   * - `components`: An object with references to the initialized view components ({@link DocumentScannerView | scannerView}, {@link DocumentCorrectionView | correctionView}, {@link DocumentResultView | scanResultView})
   *
   * @throws {Error} If initialization fails due to invalid configuration, missing license, or resource loading errors
   *
   * @example
   * Manual initialization (**rarely needed**):
   * ```javascript
   * const documentScanner = new Dynamsoft.DocumentScanner({
   *     license: "YOUR_LICENSE_KEY_HERE"
   * });
   *
   * try {
   *     const { resources, components } = await documentScanner.initialize();
   *     console.log("Scanner initialized successfully");
   * } catch (error) {
   *     console.error("Initialization failed:", error);
   * }
   * ```
   *
   * @public
   */
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
      this.resources.enableContinuousScanning = this.config.enableContinuousScanning || false;
      this.resources.completedScansCount = 0;
      this.resources.onThumbnailClicked = this.config.onThumbnailClicked;

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

  /**
   * Initialize Dynamsoft Capture Vision (DCV) engine resources.
   *
   * @remarks
   * This method sets up the core Dynamsoft SDK components:
   * - Configures engine resource paths (WASM files and dependencies) using {@link DocumentScannerConfig.engineResourcePaths} or {@link DEFAULT_DCV_ENGINE_RESOURCE_PATHS}
   * - Initializes the license manager with the provided license key from {@link DocumentScannerConfig.license}
   * - Pre-loads WASM resources to reduce latency
   * - Creates instances of {@link CameraView}, {@link CameraEnhancer}, and {@link CaptureVisionRouter}
   * - Stores references in {@link SharedResources}
   *
   * The method customizes the trial license URL to specify the product type and deployment context.
   * Called automatically by {@link initialize}.
   *
   * @throws {Error} If resource initialization fails due to network issues, invalid license, or SDK errors
   *
   * @internal
   */
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

  /**
   * Determine whether to create a default container for the {@link DocumentScanner} instance automatically.
   *
   * @returns `true` if no containers are specified in the configuration, `false` otherwise
   *
   * @remarks
   * Returns true when no main container and no individual view containers are specified.
   *
   * @internal
   */
  private shouldCreateDefaultContainer(): boolean {
    const hasNoMainContainer = !this.config.container;
    const hasNoViewContainers = !(
      this.config.scannerViewConfig?.container ||
      this.config.resultViewConfig?.container ||
      this.config.correctionViewConfig?.container
    );
    return hasNoMainContainer && hasNoViewContainers;
  }

  /**
   * Create a default container element for the {@link DocumentScanner}.
   *
   * @returns The created container element
   *
   * @remarks
   * This method creates a full-screen overlay container with the following characteristics:
   * - Class name: `dds-main-container`
   * - Positioned absolutely at the top-left corner of the viewport
   * - Full width and dynamic viewport height using {@link DEFAULT_CONTAINER_HEIGHT}
   * - High z-index (999) to appear above other page content
   * - Initially hidden (display: none)
   *
   * The container is automatically appended to the document body and serves as the
   * parent for all view containers when no custom container is provided.
   * Called by {@link initializeDDSConfig} when {@link shouldCreateDefaultContainer} returns true.
   *
   * @internal
   */
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

  /**
   * Check if the provided license is a temporary/trial license and return an appropriate license key.
   *
   * @param license - The license key to check
   * @returns The validated license key or a default trial license
   *
   * @remarks
   * This method detects temporary/trial licenses by checking if the license:
   * - Is empty or undefined
   * - Starts with specific prefixes: "A", "L", "P", or "Y"
   *
   * If a temporary license is detected, it returns a default trial license key.
   * Otherwise, it returns the original license unchanged.
   * 
   * Called by {@link initializeDDSConfig} during configuration initialization to check key from {@link DocumentScannerConfig.license}
   *
   * @internal
   */
  private checkForTemporaryLicense(license?: string) {
    return !license?.length ||
      license?.startsWith("A") ||
      license?.startsWith("L") ||
      license?.startsWith("P") ||
      license?.startsWith("Y")
      ? "DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9"
      : license;
  }

  /**
   * Validate that required view containers are properly configured.
   *
   * @throws {Error} If a view is enabled but has no container and no default container will be created
   *
   * @remarks
   * Ensures enabled views have valid containers when no main container and no default container will be created.
   *
   * @internal
   */
  private validateViewConfigs() {
    // Only validate if there's no main container AND default container won't be created
    if (!this.config.container) {
      // Only throw errors if default container won't be created
      if (!this.shouldCreateDefaultContainer()) {
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
  }

  /**
   * Determine whether the {@link DocumentCorrectionView} should be displayed.
   *
   * @returns `true` if the correction view should be shown
   *
   * @remarks
   * The correction view is shown when:
   * - {@link DocumentScannerConfig.showCorrectionView} is explicitly set to true, OR
   * - {@link DocumentScannerConfig.showCorrectionView} is undefined **AND** a {@link DocumentCorrectionViewConfig.container} is configured
   *
   * The correction view is **NOT** shown when:
   * - {@link DocumentScannerConfig.showCorrectionView} is explicitly set to false
   * - No main {@link DocumentScannerConfig.container} **AND** no {@link DocumentCorrectionViewConfig.container} is provided
   *
   * Called by {@link initializeDDSConfig} to determine whether to create the correction view configuration.
   *
   * @internal
   */
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

  /**
   * Determine whether the {@link DocumentResultView} should be displayed.
   *
   * @returns true if the result view should be shown
   *
   * @remarks
   * The result view is shown when:
   * - {@link DocumentScannerConfig.showResultView} is explicitly set to true, **OR**
   * - {@link DocumentScannerConfig.showResultView} is undefined **AND** a {@link DocumentResultViewConfig.container} is configured
   *
   * The result view is NOT shown when:
   * - {@link DocumentScannerConfig.showResultView} is explicitly set to false
   * - No main {@link DocumentScannerConfig.container} **AND** no {@link DocumentResultViewConfig.container} is provided
   *
   * Called by {@link initializeDDSConfig} to determine whether to create the result view configuration.
   *
   * @internal
   */
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

  /**
   * Initialize and normalize the {@link DocumentScanner} configuration.
   *
   * @remarks
   * This method performs comprehensive configuration initialization:
   * 1. Validates view container requirements via {@link validateViewConfigs}
   * 2. Creates a default container if needed via {@link shouldCreateDefaultContainer} and {@link createDefaultDDSContainer}
   * 3. Creates individual view containers within the main container via {@link createViewContainers}
   * 4. Sets up base configuration (license via {@link checkForTemporaryLicense}, template names from {@link DocumentScannerConfig.utilizedTemplateNames}, template file path)
   * 5. Configures each view ({@link DocumentScannerView}, {@link DocumentCorrectionView}, {@link DocumentResultView}) with merged settings
   *
   * The configuration is normalized to ensure all views have proper containers,
   * default values are applied (like {@link DEFAULT_DCE_UI_PATH} for {@link DocumentScannerView} camera UI), and internal flags are set correctly.
   * 
   * Called by {@link initialize} before creating view instances.
   *
   * @internal
   */
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
      _showResultView: this.showResultView(),
      enableFrameVerification: this.config.enableFrameVerification !== false, // Default true
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


  /**
   * Create individual view containers within the main container.
   *
   * @param mainContainer - The main container element
   * @returns A record mapping {@link EnumDDSViews} view names to their container elements
   *
   * @remarks
   * This method creates container elements for each enabled view:
   * - {@link DocumentScannerView} (always created)
   * - {@link DocumentCorrectionView} (if {@link showCorrectionView} returns true)
   * - {@link DocumentResultView} (if {@link showResultView} returns true)
   *
   * Each view container:
   * - Has a class name in the format `dds-{viewName}-view-container`
   * - Is initially hidden (display: none)
   * - Takes full width and height of the parent
   * - Is positioned relatively
   * - Has user selection disabled
   *
   * The main container is cleared before creating the view containers.
   * Called by {@link initializeDDSConfig} when a main container is available.
   *
   * @internal
   */
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
        userSelect: "none",
      });

      mainContainer.append(viewContainer);
      containers[view] = viewContainer;
      return containers;
    }, {} as Record<string, HTMLElement>);
  }

  /**
   * Stop continuous scanning and exit the scanning loop.
   *
   * @remarks
   * When called with {@link DocumentScannerConfig.enableContinuousScanning} enabled and {@link launch} running, signal the scanner to stop looping and return from {@link launch} with the last scanned result.
   *
   * This provides an alternative to using the close button (X) for exiting continuous scanning mode,
   * allowing you to implement custom exit logic based on conditions such as:
   * - Maximum number of scanned documents reached
   * - Time limits
   * - User interaction with custom UI elements
   * - External events or triggers
   *
   * @example
   * Stop after scanning 5 documents:
   * ```javascript
   * let scannedCount = 0;
   * const scanner = new Dynamsoft.DocumentScanner({
   *     license: "YOUR_LICENSE_KEY_HERE",
   *     enableContinuousScanning: true,
   *     onDocumentScanned: async (result) => {
   *         scannedCount++;
   *         console.log(`Scanned document ${scannedCount}`);
   *         
   *         if (scannedCount >= 5) {
   *             scanner.stopContinuousScanning();
   *         }
   *     }
   * });
   * 
   * await scanner.launch(); // Exits after 5 scans
   * ```
   *
   * @example
   * Stop from external button:
   * ```javascript
   * const scanner = new Dynamsoft.DocumentScanner({
   *     license: "YOUR_LICENSE_KEY_HERE",
   *     enableContinuousScanning: true,
   *     onDocumentScanned: async (result) => {
   *         // Process each scanned document
   *         saveDocument(result);
   *     }
   * });
   * 
   * // Bind to custom stop button
   * document.getElementById('stopBtn').addEventListener('click', () => {
   *     scanner.stopContinuousScanning();
   * });
   * 
   * await scanner.launch(); // Will exit when stopBtn is clicked
   * ```
   *
   * @public
   */
  stopContinuousScanning(): void {
    this.shouldStopContinuousScanning = true;
  }

  /**
   * Clean up and release all resources used by the DocumentScanner.
   *
   * @remarks
   * **This method is called automatically at the end of {@link launch}, so manual invocation is typically only needed if you want to clean up resources before the scanning workflow completes.**
   * 
   * This method performs comprehensive cleanup by:
   * - Disposing all view components (scanner, correction, result)
   * - Releasing Dynamsoft Capture Vision resources (camera, router)
   * - Clearing all container elements
   * - Resetting internal state
   *
   * After calling dispose, you can create a new DocumentScanner instance if you need to scan again.
   *
   * @example
   * Manual cleanup:
   * ```javascript
   * const documentScanner = new Dynamsoft.DocumentScanner({
   *     license: "YOUR_LICENSE_KEY_HERE"
   * });
   *
   * await documentScanner.launch();
   *
   * // Clean up is automatic after launch completes
   * // But you can also call it manually if needed:
   * documentScanner.dispose();
   * console.log("Scanner resources released");
   * ```
   *
   * @public
   */
  dispose(): void {
    this.scanResultView?.dispose();

    this.correctionView?.dispose();

    this.scannerView = null;

    // Dispose resources
    this.resources.cameraEnhancer?.dispose();

    this.resources.cameraView?.dispose();

    this.resources.cvRouter?.dispose();

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
   * Process a File object to extract image information as a blob.
   *
   * @param file - The File object to process (must be an image file)
   * @returns Promise resolving to blob with dimensions
   *
   * @throws {Error} If the file is not an image or if blob creation fails
   *
   * @remarks
   * Validates MIME type, loads image, draws to canvas, and converts to blob.
   *
   * @internal
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
   * Process an uploaded image file for document detection and normalization.
   *
   * @param file - The image file to process
   * @returns Promise resolving to a {@link DocumentResult}
   *
   * @remarks
   * Converts to blob, detects boundaries (or uses full image), performs normalization, and updates shared result.
   * Returns failed status on error.
   *
   * @internal
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
          message: `Failed to process image: ${error?.message || error}`,
        },
      };
    }
  }

  /**
   * Perform a single scan operation through the complete workflow.
   *
   * @param file - Optional image file to process instead of using camera
   * @returns Promise resolving to the {@link DocumentResult}
   *
   * @remarks
   * This method orchestrates a complete single-scan workflow:
   * 1. Initializes all components via {@link initialize} if not already initialized
   * 2. Shows the main container ({@link DocumentScannerConfig.container})
   * 3. If a file is provided, processes it via {@link processUploadedFile} instead of using the camera
   * 4. Routes through the enabled views in sequence:
   *    - {@link DocumentScannerView}: Camera capture and document detection
   *    - {@link DocumentCorrectionView}: Manual boundary adjustment (if enabled by {@link showCorrectionView})
   *    - {@link DocumentResultView}: Result preview and actions (if enabled by {@link showResultView})
   * 5. Returns the final {@link DocumentResult}
   *
   * The method handles various combinations of enabled/disabled views and ensures
   * proper transitions between them (stopping capture, hiding containers, etc.).
   * 
   * Called by {@link launch} for single-scan mode, or repeatedly in continuous scanning mode 
   * when {@link DocumentScannerConfig.enableContinuousScanning} is true.
   *
   * @internal
   */
  private async performSingleScan(file?: File): Promise<DocumentResult> {
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

      // Stop capturing and hide scanner before showing next view
      if (components.scannerView) {
        components.scannerView.stopCapturing();
        if (this.config.scannerViewConfig?.container) {
          getElement(this.config.scannerViewConfig.container).style.display = "none";
        }
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

    // If no correction or result views, return current result
    return this.resources.result;
  }

  /**
   * Start the document scanning workflow.
   *
   * @remarks
   * This is the primary method for initiating document scanning. It performs the following:
   * 1. Automatically calls {@link initialize} if not already initialized
   * 2. Opens the camera and displays the {@link DocumentScannerView} (unless a file is provided)
   * 3. Guides the user through the configured workflow (scan → correction → result)
   * 4. Returns the final {@link DocumentResult} when the workflow completes
   * 5. Automatically calls {@link dispose} to clean up resources
   *
   * **Scanning Modes:**
   * - **Single-scan mode (default)**: Captures one document and returns the result
   * - **Continuous scanning mode** ({@link DocumentScannerConfig.enableContinuousScanning}): Loops after each scan, invoking {@link DocumentScannerConfig.onDocumentScanned} with each result. The loop continues until the user clicks the close button (X) or {@link stopContinuousScanning} is called. Returns the last scanned result.
   *
   * **File Processing:**
   * Passing a {@link File} object allows processing an existing image file, bypassing camera input and the {@link DocumentScannerView}.
   *
   * @param file - Optional image file to process instead of using the camera
   *
   * @returns Promise resolving to the {@link DocumentResult}, which includes:
   * - `status`: Scan status (success, cancelled, or failed)
   * - `correctedImageResult`: Perspective-corrected document image
   * - `originalImageResult`: Original captured image
   * - `detectedQuadrilateral`: Detected document boundaries
   *
   * @throws {Error} If a capture session is already in progress
   *
   * @example
   * Basic single-scan usage:
   * ```javascript
   * const documentScanner = new Dynamsoft.DocumentScanner({
   *     license: "YOUR_LICENSE_KEY_HERE"
   * });
   *
   * const result = await documentScanner.launch();
   *
   * if (result?.correctedImageResult) {
   *     resultContainer.innerHTML = "";
   *     const canvas = result.correctedImageResult.toCanvas();
   *     resultContainer.appendChild(canvas);
   * } else {
   *     resultContainer.innerHTML = "<p>No image scanned. Please try again.</p>";
   * }
   * ```
   *
   * @example
   * Process an existing image file:
   * ```javascript
   * const documentScanner = new Dynamsoft.DocumentScanner({
   *     license: "YOUR_LICENSE_KEY_HERE"
   * });
   *
   * const fileInput = document.querySelector('input[type="file"]');
   * const file = fileInput.files[0];
   * const result = await documentScanner.launch(file);
   * ```
   *
   * @example
   * Continuous scanning mode:
   * ```javascript
   * const scannedDocs = [];
   * const documentScanner = new Dynamsoft.DocumentScanner({
   *     license: "YOUR_LICENSE_KEY_HERE",
   *     enableContinuousScanning: true,
   *     onDocumentScanned: async (result) => {
   *         scannedDocs.push(result);
   *         console.log(`Scanned ${scannedDocs.length} documents`);
   *     }
   * });
   *
   * // This will return the last scanned result when user exits
   * const lastResult = await documentScanner.launch();
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

      // Disable body scrolling to prevent scrolling away from scanner view
      document.body.style.overflow = 'hidden';

      // Handle continuous scanning mode
      if (this.config.enableContinuousScanning) {
        this.shouldStopContinuousScanning = false;

        while (!this.shouldStopContinuousScanning) {
          const result = await this.performSingleScan(file);

          // Exit on cancellation (user clicked close button)
          if (result.status.code === EnumResultStatus.RS_CANCELLED) {
            break;
          }

          // Exit on failure
          if (result.status.code === EnumResultStatus.RS_FAILED) {
            return result;
          }

          // On success, invoke callback and continue loop
          if (result.status.code === EnumResultStatus.RS_SUCCESS) {
            this.resources.completedScansCount++;
            await this.config.onDocumentScanned?.(result);
            // Loop back to scan next document
            continue;
          }
        }

        // Return the last scanned result
        return this.resources.result || {
          status: {
            code: EnumResultStatus.RS_CANCELLED,
            message: "Continuous scanning stopped",
          },
        };
      }

      // Standard single-scan mode
      const result = await this.performSingleScan(file);

      // If onDocumentScanned callback is defined and scan was successful, invoke it
      if (result.status.code === EnumResultStatus.RS_SUCCESS) {
        await this.config.onDocumentScanned?.(result);
      }

      return result;
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
      // Re-enable body scrolling when scanning session ends
      document.body.style.overflow = '';
      this.dispose();
    }
  }
}

export default DocumentScanner;

import { CameraEnhancer } from 'dynamsoft-capture-vision-bundle';
import { CameraEnhancerModule } from 'dynamsoft-capture-vision-bundle';
import { CameraManager } from 'dynamsoft-capture-vision-bundle';
import { CameraView } from 'dynamsoft-capture-vision-bundle';
import { CapturedResult } from 'dynamsoft-capture-vision-bundle';
import { CapturedResultReceiver } from 'dynamsoft-capture-vision-bundle';
import { CaptureVisionRouter } from 'dynamsoft-capture-vision-bundle';
import { CaptureVisionRouterModule } from 'dynamsoft-capture-vision-bundle';
import { CoreModule } from 'dynamsoft-capture-vision-bundle';
import { DeskewedImageResultItem } from 'dynamsoft-capture-vision-bundle';
import { DetectedQuadResultItem } from 'dynamsoft-capture-vision-bundle';
import { DocumentNormalizerModule } from 'dynamsoft-capture-vision-bundle';
import { DSFile } from 'dynamsoft-capture-vision-bundle';
import { DSImageData } from 'dynamsoft-capture-vision-bundle';
import { DSRect } from 'dynamsoft-capture-vision-bundle';
import { EngineResourcePaths } from 'dynamsoft-capture-vision-bundle';
import { EnumBufferOverflowProtectionMode } from 'dynamsoft-capture-vision-bundle';
import { EnumCapturedResultItemType } from 'dynamsoft-capture-vision-bundle';
import { EnumErrorCode } from 'dynamsoft-capture-vision-bundle';
import { EnumImagePixelFormat } from 'dynamsoft-capture-vision-bundle';
import { handleEngineResourcePaths } from 'dynamsoft-capture-vision-bundle';
import { ImageDrawer } from 'dynamsoft-capture-vision-bundle';
import { ImageIO } from 'dynamsoft-capture-vision-bundle';
import { ImageProcessor } from 'dynamsoft-capture-vision-bundle';
import { innerVersions } from 'dynamsoft-capture-vision-bundle';
import { IntermediateResultReceiver } from 'dynamsoft-capture-vision-bundle';
import { isDSImageData } from 'dynamsoft-capture-vision-bundle';
import { isDSRect } from 'dynamsoft-capture-vision-bundle';
import { isPoint } from 'dynamsoft-capture-vision-bundle';
import { isQuad } from 'dynamsoft-capture-vision-bundle';
import { LicenseManager } from 'dynamsoft-capture-vision-bundle';
import { LicenseModule } from 'dynamsoft-capture-vision-bundle';
import { MultiFrameResultCrossFilter } from 'dynamsoft-capture-vision-bundle';
import { OriginalImageResultItem } from 'dynamsoft-capture-vision-bundle';
import { Point } from 'dynamsoft-capture-vision-bundle';
import { Quadrilateral } from 'dynamsoft-capture-vision-bundle';
import { UtilityModule } from 'dynamsoft-capture-vision-bundle';

export { CameraEnhancer }

export { CameraEnhancerModule }

export { CameraManager }

export { CameraView }

export { CapturedResult }

export { CapturedResultReceiver }

export { CaptureVisionRouter }

export { CaptureVisionRouterModule }

export { CoreModule }

export declare const DDS: {
    DocumentScanner: typeof DocumentScanner;
    DocumentNormalizerView: typeof DocumentNormalizerView;
    DocumentScannerView: typeof DocumentScannerView;
    DocumentResultView: typeof DocumentResultView;
    EnumResultStatus: typeof EnumResultStatus;
    EnumFlowType: typeof EnumFlowType;
    EnumDDSViews: typeof EnumDDSViews;
};

export { DeskewedImageResultItem }

export { DetectedQuadResultItem }

/**
 * The `DocumentCorrectionViewConfig` interface passes settings to the {@link DocumentScanner} constructor through the {@link DocumentScannerConfig} to apply UI and business logic customizations for the {@link DocumentCorrectionView}.
 *
 * @remarks
 * Only rare and edge-case scenarios require editing MDS source code. MDS uses sensible default values for all omitted properties.
 *
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
 *     correctionViewConfig: {
 *         onFinish: (result) => {
 *             const canvas = result.correctedImageResult.toCanvas();
 *             resultContainer.appendChild(canvas);
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
export declare interface DocumentCorrectionViewConfig {
    /**
     * The HTML container element or selector for the {@link DocumentCorrectionView} UI.
     *
     * @public
     */
    container?: HTMLElement | string;
    /**
     * Configure the appearance and labels of the buttons for the {@link DocumentCorrectionView} UI.
     *
     * @see {@link DocumentCorrectionViewToolbarButtonsConfig}
     *
     * @public
     */
    toolbarButtonsConfig?: DocumentCorrectionViewToolbarButtonsConfig;
    /**
     * Path to the Capture Vision template file for scanning configuration.
     *
     * @remarks
     * This typically does not need to be set as MDS provides a default template for general use. You may set custom paths to self-host resources or fully self-host MDS.
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
     * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV templates}
     *
     * @defaultValue {@link DEFAULT_DCE_UI_PATH}
     *
     * @public
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
     */
    utilizedTemplateNames?: UtilizedTemplateNames;
    /**
     * Handler called when the user clicks the "Apply" button.
     *
     * @param result - The {@link DocumentResult} of the scan, including the original image, corrected image, detected boundaries, and scan status
     *
     * @public
     */
    onFinish?: (result: DocumentResult) => void;
    /* Excluded from this release type: _showResultView */
}

/**
 * Configuration interface for customizing toolbar buttons in the {@link DocumentCorrectionView}.
 *
 * @remarks
 * This interface allows you to customize the appearance and behavior of the toolbar buttons displayed in the {@link DocumentCorrectionView}. Each button can be configured using a {@link ToolbarButtonConfig} object to modify its icon, label, CSS class, or visibility.
 *
 * The behaviors described for each button below are the default behaviors. You can override the default behavior by providing a custom {@link ToolbarButton.onClick} handler through the {@link ToolbarButtonConfig}.
 *
 * @example
 * Customize button appearance:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     correctionViewConfig: {
 *         toolbarButtonsConfig: {
 *             fullImage: {
 *                 isHidden: true
 *             },
 *             detectBorders: {
 *                 icon: "path/to/new_icon.png",
 *                 label: "Custom Label"
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @example
 * Override button behavior with custom onClick handler:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     correctionViewConfig: {
 *         toolbarButtonsConfig: {
 *             apply: {
 *                 label: "Confirm",
 *                 onClick: async () => {
 *                     // Custom confirmation logic
 *                     await validateBoundaries();
 *                     console.log("Boundaries confirmed!");
 *                 }
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
export declare interface DocumentCorrectionViewToolbarButtonsConfig {
    /**
     * Configuration for the retake button. Default behavior: returns to the {@link DocumentScannerView} to capture a new image.
     *
     * @public
     */
    retake?: ToolbarButtonConfig;
    /**
     * Configuration for the full image button. Default behavior: sets the document boundaries to match the full image dimensions.
     *
     * @public
     */
    fullImage?: ToolbarButtonConfig;
    /**
     * Configuration for the detect borders button. Default behavior: automatically detects document boundaries using the document detection algorithm.
     *
     * @public
     */
    detectBorders?: ToolbarButtonConfig;
    /**
     * Configuration for the apply button. Default behavior: applies the current boundary adjustments and proceeds with the workflow.
     *
     * @remarks
     * In continuous scanning mode ({@link DocumentScannerConfig.enableContinuousScanning}) when {@link DocumentResultView} is disabled, this button is labeled "Keep Scan" by default and returns to the {@link DocumentScannerView} for the next scan. Otherwise, it is labeled "Apply" when {@link DocumentResultView} is shown, or labeled "Done" otherwise.
     *
     * @public
     */
    apply?: ToolbarButtonConfig;
}

export { DocumentNormalizerModule }

export declare class DocumentNormalizerView {
    private resources;
    private config;
    private scannerView?;
    private imageEditorView;
    private layer;
    private currentCorrectionResolver?;
    private quadColor;
    /**
     * The current scan result, guaranteed present while the correction view is active.
     *
     * @throws {Error} If no image has been captured yet.
     */
    private get result();
    /**
     * The original captured image, required for boundary detection and correction.
     *
     * @throws {Error} If the scan result has no original image.
     */
    private get originalImage();
    constructor(resources: SharedResources, config: DocumentCorrectionViewConfig, scannerView?: DocumentScannerView | undefined);
    initialize(): Promise<void>;
    /* Excluded from this release type: setupDrawingLayerStyle */
    /* Excluded from this release type: setupQuadConstraints */
    /* Excluded from this release type: getCanvasBounds */
    /* Excluded from this release type: addQuadToLayer */
    /* Excluded from this release type: setupInitialDetectedQuad */
    /* Excluded from this release type: createControls */
    /* Excluded from this release type: setupCorrectionControls */
    /* Excluded from this release type: handleRetake */
    /**
     * Reset the document boundary to match the full image dimensions.
     *
     * @throws {Error} If no captured image is available in {@link SharedResources.result}
     *
     * @remarks
     * This method creates a quadrilateral boundary that encompasses the entire image, effectively
     * disabling perspective correction. The quadrilateral corners are positioned at:
     * - Top-left: (0, 0)
     * - Top-right: (width, 0)
     * - Bottom-right: (width, height)
     * - Bottom-left: (0, height)
     *
     * This is useful when:
     * - The document occupies the entire image with no background visible
     * - Automatic boundary detection failed or detected incorrect boundaries
     * - Users want to skip perspective correction and use the original image dimensions
     *
     * The created quadrilateral is added to the {@link DrawingLayer} via {@link addQuadToLayer},
     * replacing any existing boundary. Users can still manually adjust the corners after reset.
     *
     * Triggered by clicking the "Full Image" button created in {@link createControls}.
     *
     * @see {@link SharedResources.result} - Contains the original image dimensions
     * @see {@link QuadDrawingItem} - The quadrilateral type added to the drawing layer
     * @see {@link addQuadToLayer} - Adds the full-image quadrilateral to the layer
     * @see {@link setBoundaryAutomatically} - Alternative method for automatic boundary detection
     *
     * @public
     */
    setFullImageBoundary(): void;
    /**
     * Automatically detect document boundaries using Dynamsoft Document Normalizer (DDN).
     *
     * @remarks
     * This method re-runs document boundary detection on the current image using the
     * {@link CaptureVisionRouter} and DDN (Dynamsoft Document Normalizer) engine. The process:
     *
     * 1. Initializes settings from {@link DocumentCorrectionViewConfig.templateFilePath} if provided
     * 2. Retrieves the detection template settings via {@link DocumentCorrectionViewConfig.utilizedTemplateNames}
     * 3. Configures the router to:
     *    - Output the original image for further processing
     *    - Process images at full resolution (no downscaling via `maxImageSideLength = Infinity`)
     * 4. Captures and analyzes the image to detect document boundaries
     * 5. Handles the detection result:
     *    - **Boundary detected**: Creates a {@link QuadDrawingItem} from the detected {@link Quadrilateral}
     *      and adds it to the layer via {@link addQuadToLayer}
     *    - **No boundary detected**: Falls back to {@link setFullImageBoundary} to use full image dimensions
     *
     * This allows users to retry automatic detection if:
     * - Manual adjustments were made but proved unsatisfactory
     * - Initial detection failed due to lighting or positioning issues that were later corrected
     * - The image was uploaded without initial detection
     *
     * Triggered by clicking the "Detect Borders" button created in {@link createControls}.
     *
     * @see {@link CaptureVisionRouter} - Processes the image for boundary detection
     * @see {@link DetectedQuadResultItem} - Contains the detected document boundaries
     * @see {@link addQuadToLayer} - Adds the detected quadrilateral to the drawing layer
     * @see {@link setFullImageBoundary} - Fallback when no boundaries are detected
     * @see {@link SharedResources.cvRouter} - The router instance used for detection
     *
     * @public
     */
    setBoundaryAutomatically(): Promise<void>;
    /**
     * Confirm the boundary adjustments and apply perspective correction to the image.
     *
     * @throws {Error} If no quadrilateral boundary is found on the drawing layer
     *
     * @remarks
     * Retrieves boundary, performs correction via {@link correctImage}, updates result, invokes callback, resolves promise.
     *
     * @public
     */
    confirmCorrection(): Promise<void>;
    launch(): Promise<DocumentResult>;
    /**
     * Hide the correction view by setting its container display to "none".
     *
     * @remarks
     * Sets container display to "none" without disposing resources.
     *
     * @public
     */
    hideView(): void;
    /**
     * Apply perspective correction to the document image using Dynamsoft Document Normalizer (DDN).
     *
     * @param points - The quadrilateral corner points defining the document boundary
     * @returns The perspective-corrected (deskewed) image, or undefined if correction fails
     *
     * @remarks
     * Configures ROI with quadrilateral points, processes image with normalization template.
     *
     * @public
     */
    correctImage(points: Quadrilateral["points"]): Promise<DeskewedImageResultItem | undefined>;
    /**
     * Clean up and release resources.
     *
     * @param preserveResolver - Whether to preserve the {@link currentCorrectionResolver} promise resolver
     *
     * @remarks
     * Disposes {@link ImageEditorView}, clears layer and container. Optionally preserves resolver for {@link handleRetake}.
     *
     * @public
     */
    dispose(preserveResolver?: boolean): void;
}

/**
 * Represents the complete output of a document scanning operation.
 *
 * @remarks
 * Optional properties present only on successful scans.
 *
 * @example
 * ```typescript
 * const result = await scanner.scan();
 * if (result.status.code === EnumResultStatus.RS_SUCCESS) {
 *   const correctedImage = result.correctedImageResult;
 *   const originalImage = result.originalImageResult;
 *   const boundaries = result.detectedQuadrilateral;
 * }
 * ```
 *
 * @public
 */
export declare interface DocumentResult {
    /**
     * Status of the scan operation.
     * @public
     */
    status: ResultStatus;
    /**
     * Perspective-corrected and enhanced image.
     * @public
     */
    correctedImageResult?: DeskewedImageResultItem;
    /**
     * Original captured image before processing.
     * @public
     */
    originalImageResult?: DSImageData;
    /**
     * Detected document boundaries (quadrilateral).
     * @public
     */
    detectedQuadrilateral?: Quadrilateral;
    /* Excluded from this release type: _flowType */
}

export declare class DocumentResultView {
    private resources;
    private config;
    private scannerView?;
    private correctionView?;
    private currentScanResultViewResolver?;
    private editState;
    private baseCorrectedImage?;
    private pristineCanvas?;
    private displayCanvas?;
    private filterMenuOutsideClick?;
    private lastRotateClickAt;
    constructor(resources: SharedResources, config: DocumentResultViewConfig, scannerView?: DocumentScannerView | undefined, correctionView?: DocumentNormalizerView | undefined);
    launch(): Promise<DocumentResult>;
    /* Excluded from this release type: handleUploadAndShareBtn */
    /* Excluded from this release type: handleShare */
    /* Excluded from this release type: handleCorrectImage */
    /* Excluded from this release type: handleRetake */
    /* Excluded from this release type: handleDone */
    /* Excluded from this release type: handleRotate */
    /* Excluded from this release type: handleFilter */
    /* Excluded from this release type: applyEdits */
    /* Excluded from this release type: createControls */
    initialize(): Promise<void>;
    /* Excluded from this release type: createScanMoreButton */
    /* Excluded from this release type: hideView */
    /* Excluded from this release type: dispose */
}

/**
 * The `DocumentResultViewConfig` interface passes settings to the {@link DocumentScanner} constructor through the {@link DocumentScannerConfig} to apply UI and business logic customizations for the {@link DocumentResultView}.
 *
 * @remarks
 * Only rare and edge-case scenarios require editing MDS source code. MDS uses sensible default values for all omitted properties.
 *
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
 *     resultViewConfig: {
 *         onDone: async (result) =>
 *         {
 *             const canvas = result.correctedImageResult.toCanvas();
 *             resultContainer.appendChild(canvas);
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
export declare interface DocumentResultViewConfig {
    /**
     * The HTML container element or selector for the {@link DocumentResultView} UI.
     *
     * @public
     */
    container?: HTMLElement | string;
    /**
     * Configure the appearance and labels of the buttons for the {@link DocumentResultView} UI.
     *
     * @see {@link DocumentResultViewToolbarButtonsConfig}
     *
     * @public
     */
    toolbarButtonsConfig?: DocumentResultViewToolbarButtonsConfig;
    /**
     * Handler called when the user clicks the "Done" button.
     *
     * @param result - The {@link DocumentResult} of the scan, including the original image, corrected image, detected boundaries, and scan status
     *
     * @public
     */
    onDone?: (result: DocumentResult) => Promise<void>;
    /**
     * Handler called when the user clicks the "Upload" button.
     *
     * @param result - The {@link DocumentResult} of the scan, including the original image, corrected image, detected boundaries, and scan status
     *
     * @public
     */
    onUpload?: (result: DocumentResult) => Promise<void>;
}

/**
 * Configuration interface for customizing toolbar buttons in the {@link DocumentResultView}.
 *
 * @remarks
 * This interface allows you to customize the appearance and behavior of the toolbar buttons displayed in the {@link DocumentResultView}. Each button can be configured using a {@link ToolbarButtonConfig} object to modify its icon, label, CSS class, or visibility.
 *
 * The behaviors described for each button below are the default behaviors. You can override the default behavior by providing a custom {@link ToolbarButton.onClick} handler through the {@link ToolbarButtonConfig}.
 *
 * @example
 * Customize button appearance:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     resultViewConfig: {
 *         toolbarButtonsConfig: {
 *             retake: {
 *                 isHidden: true
 *             },
 *             share: {
 *                 icon: "path/to/new_icon.png",
 *                 label: "Custom Label"
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @example
 * Override button behavior with custom onClick handler:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     resultViewConfig: {
 *         toolbarButtonsConfig: {
 *             done: {
 *                 label: "Save",
 *                 onClick: async () => {
 *                     // Custom save logic
 *                     await saveToServer(documentScanner.result);
 *                     console.log("Document saved!");
 *                 }
 *             },
 *             share: {
 *                 onClick: async () => {
 *                     // Custom share logic
 *                     await sendViaEmail(documentScanner.result);
 *                 }
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
export declare interface DocumentResultViewToolbarButtonsConfig {
    /**
     * Configuration for the retake button. Default behavior: returns to the {@link DocumentScannerView} to capture a new image.
     *
     * @public
     */
    retake?: ToolbarButtonConfig;
    /**
     * Configuration for the correct button. Default behavior: enters the {@link DocumentCorrectionView} to adjust document boundaries.
     *
     * @public
     */
    correct?: ToolbarButtonConfig;
    /**
     * Configuration for the share button. Default behavior: shares or downloads the scanned document.
     *
     * @remarks
     * On mobile devices with Web Share API support, this button triggers the native share dialog. On desktop or devices without share support, it downloads the image instead.
     *
     * @public
     */
    share?: ToolbarButtonConfig;
    /**
     * Configuration for the upload button. Default behavior: triggers the {@link DocumentResultViewConfig.onUpload} callback.
     *
     * @remarks
     * This button is only visible when {@link DocumentResultViewConfig.onUpload} is defined.
     *
     * @public
     */
    upload?: ToolbarButtonConfig;
    /**
     * Configuration for the done button. Default behavior: completes the scanning workflow.
     *
     * @remarks
     * In continuous scanning mode ({@link DocumentScannerConfig.enableContinuousScanning}), a separate floating "Scan More" button keeps the current scan and loops back to the {@link DocumentScannerView} for the next capture.
     *
     * @public
     */
    done?: ToolbarButtonConfig;
    /**
     * Configuration for the done button. Default behavior: rotate the image 90 degrees clockwise.
     *
     * @public
     */
    rotate?: ToolbarButtonConfig;
    /**
     * Configuration for the filter button. Default behavior: reveal drop-up menu with the following filters:
     *
     * 1. Original
     * 2. Grayscale
     * 3. Black & White
     * 4. Sepia
     * 5. Inverted
     *
     * @public
     */
    filter?: ToolbarButtonConfig;
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
export declare class DocumentScanner {
    private config;
    private scannerView?;
    private scanResultView?;
    private correctionView?;
    private resources;
    private isInitialized;
    private isCapturing;
    private shouldStopContinuousScanning;
    private loadingScreen;
    /* Excluded from this release type: showScannerLoadingOverlay */
    /* Excluded from this release type: hideScannerLoadingOverlay */
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
    constructor(config: DocumentScannerConfig);
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
    initialize(): Promise<{
        resources: SharedResources;
        components: {
            scannerView?: DocumentScannerView;
            correctionView?: DocumentNormalizerView;
            scanResultView?: DocumentResultView;
        };
    }>;
    /* Excluded from this release type: initializeDCVResources */
    /* Excluded from this release type: shouldCreateDefaultContainer */
    /* Excluded from this release type: createDefaultDDSContainer */
    /* Excluded from this release type: checkForTemporaryLicense */
    /* Excluded from this release type: validateViewConfigs */
    /* Excluded from this release type: showCorrectionView */
    /* Excluded from this release type: showResultView */
    /* Excluded from this release type: initializeDDSConfig */
    /* Excluded from this release type: createViewContainers */
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
    stopContinuousScanning(): void;
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
    dispose(): void;
    /* Excluded from this release type: processFileToBlob */
    /* Excluded from this release type: processUploadedFile */
    /* Excluded from this release type: performSingleScan */
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
     * - **Continuous scanning mode** ({@link DocumentScannerConfig.enableContinuousScanning}): Invokes {@link DocumentScannerConfig.onDocumentScanned} with each scan, and loops back to capture another document whenever the user taps "Scan More". The loop ends when the user taps "Done", clicks the close button (X), or {@link stopContinuousScanning} is called. Returns the last scanned result.
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
    launch(file?: File): Promise<DocumentResult>;
}

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
export declare interface DocumentScannerConfig {
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
    scannerViewConfig?: Omit<DocumentScannerViewConfig, "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView">;
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
    correctionViewConfig?: Omit<DocumentCorrectionViewConfig, "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView">;
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
     * Enable continuous scanning mode where the scanner can loop back to capture more documents instead of exiting after a single scan. {@link DocumentScanner.launch} only resolves to the last scanned result. Use {@link onDocumentScanned} callback to get scan results.
     *
     * @remarks
     * When enabled:
     * - The result view shows a "Scan More" button alongside "Done"; tapping "Scan More" loops back to capture another document, while "Done" ends the session
     * - The {@link onDocumentScanned} callback triggers after each scan with the result; this is the only way to get the scanned results as {@link DocumentScanner.launch} only returns the last scanned result
     * - Users can also exit by clicking the close button (X) or by calling {@link DocumentScanner.stopContinuousScanning}
     * - The DocumentScanner only retains the most recent scan result
     * - A thumbnail preview of the last scan appears in the camera view, but only when both {@link showCorrectionView} and {@link showResultView} are disabled (otherwise scans route through those views instead). See {@link onThumbnailClicked} to make it clickable.
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
     * This callback is only called when {@link enableContinuousScanning} is true, after each scan the user keeps (via either "Scan More" or "Done"). The callback receives a {@link DocumentResult} containing the original image, corrected image, detected boundaries, and scan status.
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
     * The thumbnail preview itself only appears (and this callback only fires) when:
     * - {@link enableContinuousScanning} is enabled
     * - {@link showCorrectionView} is disabled
     * - {@link showResultView} is disabled
     *
     * The thumbnail displays the most recently scanned document. Defining this callback also gives it a primary-coloured border and pointer cursor; without it, clicking does nothing. Use it to implement custom behaviour such as re-editing the image.
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
    /**
     * Override the default colors used across all views and the loading screen.
     *
     * @see {@link ThemeColor} for the full list of themeable fields.
     *
     * @example
     * ```typescript
     * new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE",
     *     themeColor: {
     *         primary: "#0066cc",
     *         backgroundView: "#1a1a1a",
     *     }
     * });
     * ```
     *
     * @public
     * @stable
     */
    themeColor?: ThemeColor;
    /**
     * Override the default user-facing strings (loading messages, share dialog
     * title, download filename prefix, alert text, etc.).
     *
     * @remarks
     * Toolbar button labels (Re-take, Apply, Done, Share, Upload, Correction, Full
     * Image, Detect Borders) are not configured here — use
     * {@link DocumentCorrectionViewConfig.toolbarButtonsConfig} and
     * {@link DocumentResultViewConfig.toolbarButtonsConfig} for those.
     *
     * The resolved string config is process-global: instantiating a new
     * {@link DocumentScanner} replaces any previously applied config. Running two
     * scanners with different `stringConfig` values in the same page is not
     * supported — the most recently constructed scanner wins for all of them.
     *
     * @see {@link StringConfig} for the full list of customizable strings.
     *
     * @example
     * ```typescript
     * new Dynamsoft.DocumentScanner({
     *     license: "YOUR_LICENSE_KEY_HERE",
     *     stringConfig: {
     *         loadingMsg: "Cargando...",
     *         continuousScanDoneBtn: "Listo ({count})",
     *         downloadFilenamePrefix: "invoice",
     *     }
     * });
     * ```
     *
     * @public
     * @stable
     */
    stringConfig?: StringConfig;
}

export declare class DocumentScannerView {
    private resources;
    private config;
    private boundsDetectionEnabled;
    private smartCaptureEnabled;
    private autoCropEnabled;
    private isCapturing;
    private isClosing;
    private resizeTimer;
    private crossVerificationCount;
    private lastCaptureTimestamp;
    private readonly CONTINUOUS_SCAN_COOLDOWN_MS;
    private frameVerificationEnabled;
    private currentFrameId;
    private maxClarity;
    private maxClarityTimestamp;
    private maxClarityImg;
    private maxClarityFrameId;
    private nonImprovingClarityFrameCount;
    private clearestFrameId;
    private clarityHistory;
    private capturedResultItems;
    private originalImageData;
    private initialized;
    private initializedDCE;
    private DCE_ELEMENTS;
    private currentScanResolver?;
    private loadingScreen;
    private toastObserver;
    /* Excluded from this release type: showScannerLoadingOverlay */
    /* Excluded from this release type: hideScannerLoadingOverlay */
    /* Excluded from this release type: getMinVerifiedFramesForAutoCapture */
    /**
     * The Capture Vision Router, guaranteed present after {@link initialize}.
     * @throws {Error} If accessed before the shared resources are initialized.
     */
    private get cvRouter();
    /**
     * The Camera View, guaranteed present after {@link initialize}.
     * @throws {Error} If accessed before the shared resources are initialized.
     */
    private get cameraView();
    /**
     * The Camera Enhancer, guaranteed present after {@link initialize}.
     * @throws {Error} If accessed before the shared resources are initialized.
     */
    private get cameraEnhancer();
    /**
     * The template names for detection and normalization, falling back to defaults.
     */
    private get templateNames();
    constructor(resources: SharedResources, config: DocumentScannerViewConfig);
    initialize(): Promise<void>;
    /* Excluded from this release type: initializeElements */
    /* Excluded from this release type: applyDCEStringOverrides */
    /* Excluded from this release type: assignDCEClickEvents */
    /* Excluded from this release type: handleContinuousScanDone */
    /* Excluded from this release type: updateContinuousScanDoneButton */
    /* Excluded from this release type: updateThumbnail */
    /* Excluded from this release type: isIOS */
    /* Excluded from this release type: setupSmartToastFilter */
    /* Excluded from this release type: animateFloatingImage */
    /* Excluded from this release type: handleCloseBtn */
    /* Excluded from this release type: attachOptionClickListeners */
    /* Excluded from this release type: highlightCameraAndResolutionOption */
    /* Excluded from this release type: toggleSelectCameraBox */
    /* Excluded from this release type: uploadImage */
    /* Excluded from this release type: fileToBlob */
    /* Excluded from this release type: toggleBoundsDetection */
    /* Excluded from this release type: toggleSmartCapture */
    /* Excluded from this release type: toggleAutoCrop */
    /* Excluded from this release type: handleResize */
    /* Excluded from this release type: toggleScanGuide */
    /* Excluded from this release type: calculateScanRegion */
    /* Excluded from this release type: openCamera */
    /* Excluded from this release type: closeCamera */
    /* Excluded from this release type: pauseCamera */
    /* Excluded from this release type: stopCapturing */
    /* Excluded from this release type: getFlowType */
    /* Excluded from this release type: trackFrameClarity */
    takePhoto(): Promise<void>;
    handleBoundsDetection(result: CapturedResult): Promise<void>;
    /**
     * Normalize an image with DDN given a set of points
     * @param points - points provided by either users or DDN's detect quad
     * @returns normalized image by DDN
     */
    private handleAutoCaptureMode;
    /** Close the camera and settle any in-flight {@link launch} promise so callers don't hang when disposed mid-capture. */
    dispose(): void;
    launch(): Promise<DocumentResult>;
    normalizeImage(points: Quadrilateral["points"], originalImageData: OriginalImageResultItem["imageData"]): Promise<DeskewedImageResultItem>;
}

/**
 * The `DocumentScannerViewConfig` interface passes settings to the {@link DocumentScanner} constructor through the {@link DocumentScannerConfig} to apply UI and business logic customizations for the {@link DocumentScannerView}.
 *
 * @remarks
 * Only rare and edge-case scenarios require editing the UI template or MDS source code. MDS uses sensible default values for all omitted properties.
 *
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace with your actual license key
 *     scannerViewConfig: {
 *         cameraEnhancerUIPath: "../dist/document-scanner.ui.xml", // Use the local file
 *     },
 * });
 ```

 @public
 */
export declare interface DocumentScannerViewConfig {
    /* Excluded from this release type: _showCorrectionView */
    /* Excluded from this release type: _showResultView */
    /**
     * Path to the Capture Vision template file for scanning configuration.
     *
     * @public
     */
    templateFilePath?: string;
    /**
     * Path to the UI definition file (`.xml`) for the {@link DocumentScannerView}.
     *
     * @remarks
     * This typically does not need to be set as MDS provides a default template for general use. You may set custom paths to self-host or customize the template, or fully self-host MDS.
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
     *
     * @defaultValue {@link DEFAULT_DCE_UI_PATH}
     *
     * @public
     */
    cameraEnhancerUIPath?: string;
    /**
     * The HTML container element or selector for the {@link DocumentScannerView} UI.
     *
     * @public
     */
    container?: HTMLElement | string;
    /**
     * Capture Vision template names for document detection and normalization.
     *
     * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
     *
     * @remarks
     * This typically does not need to be set as MDS provides a default template for general use. You may set custom names to self-host resources or fully self-host MDS.
     * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
     * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV templates}
     *
     * @public
     */
    utilizedTemplateNames?: UtilizedTemplateNames;
    /**
     * Set the document Bounds Detection mode effective upon entering the {@link DocumentScannerView} UI.
     *
     * @remarks
     * Bounds Detection mode gets enabled when Smart Capture mode is enabled.
     *
     * @defaultValue true
     *
     * @public
     */
    enableBoundsDetectionMode?: boolean;
    /**
     * Set the Smart Capture mode effective upon entering the {@link DocumentScannerView} UI.
     *
     * @remarks
     * Enabling Smart Capture mode also enables Bounds Detection mode. Smart Capture mode is enabled when Auto-Capture mode is enabled.
     *
     * @defaultValue false
     *
     * @public
     */
    enableSmartCaptureMode?: boolean;
    /**
     * Set the Auto-Crop mode effective upon entering the {@link DocumentScannerView} UI.
     *
     * @remarks
     * Enabling Auto-Crop mode also enables Smart Capture mode.
     *
     * @defaultValue false
     *
     * @public
     */
    enableAutoCropMode?: boolean;
    /**
     * Define the region within the viewport to detect documents.
     *
     * @see {@link ScanRegion}
     *
     * @public
     */
    scanRegion?: ScanRegion;
    /**
     * Set the minimum number of camera frames to detect document boundaries in Smart Capture mode.
     *
     * @remarks
     * Accepts integer values between 1 and 5, inclusive.
     *
     * @defaultValue 2
     *
     * @public
     */
    minVerifiedFramesForAutoCapture?: number;
    /**
     * Set the visibility of the mode selector menu.
     *
     * @defaultValue true
     *
     * @public
     */
    showSubfooter?: boolean;
    /**
     * Set the visibility of the Dynamsoft branding message.
     *
     * @defaultValue true
     *
     * @public
     */
    showPoweredByDynamsoft?: boolean;
    /**
     * Enable automatic frame verification for best quality capture.
     * When enabled, track clarity scores to find the clearest frame.
     *
     * @defaultValue true
     * @public
     */
    enableFrameVerification?: boolean;
}

export { DSFile }

export { DSImageData }

export { DSRect }

export { EngineResourcePaths }

export { EnumBufferOverflowProtectionMode }

export { EnumCapturedResultItemType }

/**
 * Enumeration of available view types in the Document Scanner system.
 *
 * @remarks
 * Scanner: camera view, Result: final view, Correction: boundary adjustment view.
 *
 * @public
 */
declare enum EnumDDSViews {
    /**
     * Main camera view for capturing documents.
     */
    Scanner = "scanner",
    /**
     * Final view displaying processed document results.
     */
    Result = "scan-result",
    /**
     * Intermediate view for adjusting detected document boundaries.
     */
    Correction = "correction"
}

export { EnumErrorCode }

/**
 * Enumeration of document scanning flow types indicating capture method.
 *
 * @remarks
 * Tracks how document was captured. Used by {@link shouldCorrectImage} to determine correction behavior.
 *
 * @public
 */
declare enum EnumFlowType {
    /**
     * User manually captured the document via camera button.
     */
    MANUAL = "manual",
    /**
     * Document was automatically captured when stable boundaries were detected.
     */
    SMART_CAPTURE = "smartCapture",
    /**
     * Document was detected and cropped automatically without user intervention.
     */
    AUTO_CROP = "autoCrop",
    /**
     * Document image was uploaded from device storage.
     */
    UPLOADED_IMAGE = "uploadedImage",
    /**
     * Document was loaded from a static file path or URL.
     */
    STATIC_FILE = "staticFile"
}

export { EnumImagePixelFormat }

/**
 * Enumeration of result status codes for document scanning operations.
 *
 * @remarks
 * RS_SUCCESS: successful scan, RS_CANCELLED: user cancelled, RS_FAILED: error occurred.
 *
 * @public
 */
export declare enum EnumResultStatus {
    /**
     * Document was successfully captured and processed.
     */
    RS_SUCCESS = 0,
    /**
     * User cancelled the scanning operation.
     */
    RS_CANCELLED = 1,
    /**
     * Scanning or processing failed due to an error.
     */
    RS_FAILED = 2
}

export { handleEngineResourcePaths }

export { ImageDrawer }

export { ImageIO }

export { ImageProcessor }

export { innerVersions }

export { IntermediateResultReceiver }

export { isDSImageData }

export { isDSRect }

export { isPoint }

export { isQuad }

export { LicenseManager }

export { LicenseModule }

export { MultiFrameResultCrossFilter }

export { OriginalImageResultItem }

export { Point }

export { Quadrilateral }

/**
 * Type representing the status of a document scanning operation.
 *
 * @remarks
 * Combines status code with optional error message.
 *
 * @example
 * ```typescript
 * if (result.status.code === EnumResultStatus.RS_SUCCESS) {
 *   console.log("Scan successful!");
 * } else if (result.status.code === EnumResultStatus.RS_FAILED) {
 *   console.error("Scan failed:", result.status.message);
 * }
 * ```
 *
 * @public
 */
export declare type ResultStatus = {
    /**
     * Status code (success, cancellation, or failure).
     * @see {@link EnumResultStatus}
     */
    code: EnumResultStatus;
    /**
     * Optional error message (typically populated when failed).
     */
    message?: string;
};

/**
 * Set the scan region within the {@link DocumentScannerView} viewfinder for document scanning from the {@link DocumentScannerViewConfig}.
 *
 * @remarks
 * MDS determines the scan region with the following steps:
 * 1. Use {@link ScanRegion.ratio} to set the height-to-width ratio of the rectangular scanning region, then scale the rectangle up to fit within the viewfinder.
 * 2. Translate the rectangle upward by the number of pixels specified by {@link ScanRegion.regionBottomMargin}.
 * 3. Create a visual border for the scanning region boundary on the viewfinder with a given stroke width in pixels and stroke color.
 *
 * @example
 * Create a scan region with a height-to-width ratio of 3:2, translated upwards by 20 pixels, with a green, 3 pixel-wide border in the viewfinder:
 *
 * ```javascript
 * scanRegion {
 *   ratio: {
 *     width: 2,
 *     height: 3,
 *   },
 *   regionBottomMargin: 20,
 *   style: {
 *     strokeWidth: 3,
 *     strokeColor: "green",
 *   },
 * }
 * ```
 *
 * @public
 */
declare interface ScanRegion {
    /**
     * The aspect ratio of the rectangular scan region.
     *
     * @public
     */
    ratio: {
        /**
         * The width of the rectangular scan region.
         */
        width: number;
        /**
         * The height of the rectangular scan region.
         *
         * @public
         */
        height: number;
    };
    /**
     * Bottom margin below the scan region measured in pixels.
     *
     * @public
     */
    regionBottomMargin: number;
    /**
     * The styling for the scan region outline in the viewfinder.
     *
     * @public
     */
    style: {
        /**
         * The pixel width of the outline of the scan region.
         *
         * @public
         */
        strokeWidth: number;
        /**
         * The color of the outline of the scan region.
         *
         * @public
         */
        strokeColor: string;
    };
}

/* Excluded from this release type: SharedResources */

/**
 * Override the default user-facing strings displayed by the DocumentScanner. Every
 * field is optional; unset fields fall back to the library default. Toolbar button
 * labels (Re-take, Apply, Done, etc.) are not configured here — use
 * `correctionViewConfig.toolbarButtonsConfig` and `resultViewConfig.toolbarButtonsConfig`
 * for those.
 *
 * Strings that include a `{count}` or `{error}` placeholder are noted inline; the
 * placeholder is substituted at render time.
 *
 * @public
 */
declare interface StringConfig {
    /** Loading overlay message shown during initial DCV load. @defaultValue "Loading..." */
    loadingMsg?: string;
    /** Loading overlay message shown while opening the camera. @defaultValue "Initializing camera..." */
    initializingCameraMsg?: string;
    /** Loading overlay message shown while processing a captured or uploaded image. @defaultValue "Processing image..." */
    processingImageMsg?: string;
    /**
     * Label of the "Done" button in continuous scanning mode. The literal substring
     * `{count}` is replaced with the current scan count at render time.
     *
     * @defaultValue "Done ({count})"
     */
    continuousScanDoneBtn?: string;
    /** `title` field passed to the Web Share API when sharing the corrected image. @defaultValue "Scanned Document" */
    shareTitle?: string;
    /** Filename prefix for downloaded images. Final filename is `{prefix}-{timestamp}.png`. @defaultValue "document" */
    downloadFilenamePrefix?: string;
    /** Alert shown when the upload or share button handler throws. @defaultValue "Failed" */
    uploadShareFailedAlert?: string;
    /**
     * Alert shown when the share/download flow throws. The literal substring `{error}`
     * is replaced with the error message at render time.
     *
     * @defaultValue "Error processing image: {error}"
     */
    shareErrorAlert?: string;
    /** Tooltip on the scanner view header button that opens the camera/resolution picker. @defaultValue "Select Camera or Resolution" */
    selectCameraBtnTitle?: string;
    /** Tooltip on the scanner view header button that uploads an image file. @defaultValue "Upload Image" */
    uploadImageBtnTitle?: string;
    /** Tooltip on the scanner view header close (X) button. @defaultValue "Close" */
    closeScannerBtnTitle?: string;
    /** Section heading above the list of cameras in the camera switcher menu. @defaultValue "Camera" */
    cameraSwitcherCameraLabel?: string;
    /** Section heading above the list of resolutions in the camera switcher menu. @defaultValue "Resolution" */
    cameraSwitcherResolutionLabel?: string;
    /** Tooltip / accessible label on the shutter (take photo) button. @defaultValue "Take Photo" */
    takePhotoBtnTitle?: string;
    /** Label of the continuous-mode "Scan More" button. @defaultValue "Scan More" */
    scanMoreBtn?: string;
    /** Result view filter menu: the "no filter" option. @defaultValue "Original" */
    filterOriginalBtn?: string;
    /** Result view filter menu: the grayscale option. @defaultValue "Grayscale" */
    filterGrayscaleBtn?: string;
    /** Result view filter menu: the black & white option. @defaultValue "Black & White" */
    filterBlackWhiteBtn?: string;
    /** Result view filter menu: the sepia option. @defaultValue "Sepia" */
    filterSepiaBtn?: string;
    /** Result view filter menu: the inverted option. @defaultValue "Inverted" */
    filterInvertedBtn?: string;
}

/**
 * Override the default colors used across all views. Every field is optional;
 * unset fields fall back to the library default.
 *
 * @public
 */
declare interface ThemeColor {
    /**
     * Brand accent. Themes the shutter button, the continuous-mode "Done" button,
     * active toggle labels in the scanner mode selector, selected camera/resolution
     * option borders, and the pressed state of correction/result toolbar buttons.
     *
     * @defaultValue "#fe8e14"
     * @public
     */
    primary?: string;
    /**
     * Default color for toolbar and navigation buttons: correction/result toolbar
     * icons & labels at rest, the scanner header nav icons (camera select, upload,
     * torch, close), and inactive toggle labels in the scanner mode selector.
     *
     * @defaultValue "#ffffff"
     * @public
     */
    toolbarButtonInactive?: string;
    /**
     * "On" status indicator color on scanner mode selector toggles.
     *
     * @defaultValue "#43cc48"
     * @public
     */
    activeIndicator?: string;
    /**
     * "Off" status indicator color on scanner mode selector toggles.
     *
     * @defaultValue "#575757"
     * @public
     */
    inactiveIndicator?: string;
    /**
     * Stroke and corner-handle color of the boundary quadrilateral in the
     * correction view. Independent of {@link ThemeColor.primary}.
     *
     * @defaultValue "#fe8e14"
     * @public
     */
    correctionQuad?: string;
    /**
     * Body background for the correction and result views.
     *
     * @defaultValue "#575757"
     * @public
     */
    backgroundView?: string;
    /**
     * Chrome background: the toolbar in correction/result views, the scanner
     * header bar, and the loading screen overlay.
     *
     * @defaultValue "#323234"
     * @public
     */
    backgroundToolbar?: string;
    /**
     * Panel background of the result view filter drop-up menu.
     *
     * @defaultValue "#323234"
     * @public
     */
    filterMenuBackground?: string;
    /**
     * Text color of the result view filter menu options.
     *
     * @defaultValue "#ffffff"
     * @public
     */
    filterMenuText?: string;
    /**
     * Background of the continuous-mode "Scan More" button.
     *
     * @defaultValue "#323234"
     * @public
     */
    scanMoreBackground?: string;
    /**
     * Text color of the continuous-mode "Scan More" button.
     *
     * @defaultValue "#ffffff"
     * @public
     */
    scanMoreText?: string;
}

/**
 * Interface defining toolbar button properties and behavior.
 *
 * @remarks
 * Used internally to create toolbar buttons. Customize via {@link ToolbarButtonConfig}.
 *
 * @public
 */
declare interface ToolbarButton {
    /**
     * Unique identifier for the button.
     *
     * @public
     */
    id: string;
    /**
     * Path or data URL to the button icon image.
     *
     * @public
     */
    icon: string;
    /**
     * Text label displayed below the button icon.
     *
     * @public
     */
    label: string;
    /**
     * Click handler function invoked when the button is clicked.
     *
     * @remarks
     * This handler can be synchronous or asynchronous. When provided through {@link ToolbarButtonConfig}, it overrides the button's default behavior.
     *
     * @public
     */
    onClick?: () => void | Promise<void>;
    /**
     * Additional CSS class name to apply to the button element.
     *
     * @public
     */
    className?: string;
    /**
     * Flag indicating whether the button is disabled (non-interactive).
     *
     * @defaultValue false
     *
     * @public
     */
    isDisabled?: boolean;
    /**
     * Flag indicating whether the button is hidden from the toolbar.
     *
     * @defaultValue false
     *
     * @public
     */
    isHidden?: boolean;
}

/**
 * A simplified configuration type for toolbar buttons.
 *
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
 *     correctionViewConfig: {
 *         toolbarButtonsConfig: {
 *             fullImage: {
 *                 isHidden: true
 *             },
 *             detectBorders: {
 *                 icon: "path/to/new_icon.png", // Change to the actual path of the new icon
 *                 label: "Custom Label"
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
export declare type ToolbarButtonConfig = Partial<Pick<ToolbarButton, "icon" | "label" | "className" | "isHidden">>;

export { UtilityModule }

/**
 * Capture Vision template names for document detection and normalization.
 *
 * @remarks
 * Override to self-host resources.
 * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting}
 *
 * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
 * @public
 */
export declare interface UtilizedTemplateNames {
    detect: string;
    normalize: string;
}

export { }

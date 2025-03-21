import { DSImageData, OriginalImageResultItem, Quadrilateral, EngineResourcePaths } from 'dynamsoft-core';
import * as dynamsoftCore from 'dynamsoft-core';
export { dynamsoftCore as Core };
import * as dynamsoftLicense from 'dynamsoft-license';
export { dynamsoftLicense as License };
import { CapturedResult, CaptureVisionRouter } from 'dynamsoft-capture-vision-router';
import * as dynamsoftCaptureVisionRouter from 'dynamsoft-capture-vision-router';
export { dynamsoftCaptureVisionRouter as CVR };
import { CameraEnhancer, CameraView } from 'dynamsoft-camera-enhancer';
import * as dynamsoftCameraEnhancer from 'dynamsoft-camera-enhancer';
export { dynamsoftCameraEnhancer as DCE };
import { NormalizedImageResultItem } from 'dynamsoft-document-normalizer';
import * as dynamsoftDocumentNormalizer from 'dynamsoft-document-normalizer';
export { dynamsoftDocumentNormalizer as DDN };
import * as dynamsoftUtility from 'dynamsoft-utility';
export { dynamsoftUtility as Utility };
export { NormalizedImageResultItem, PlayCallbackInfo, Point, Rect, VideoDeviceInfo } from 'dynamsoft-capture-vision-bundle';

declare enum EnumDDSViews {
    Scanner = "scanner",
    Result = "scan-result",
    Correction = "correction"
}
interface UtilizedTemplateNames {
    detect: string;
    normalize: string;
}
declare enum EnumResultStatus {
    RS_SUCCESS = 0,
    RS_CANCELLED = 1,
    RS_FAILED = 2
}
declare enum EnumFlowType {
    MANUAL = "manual",
    SMART_CAPTURE = "smartCapture",
    AUTO_CROP = "autoCrop",
    UPLOADED_IMAGE = "uploadedImage"
}
type ResultStatus = {
    code: EnumResultStatus;
    message?: string;
};
interface DocumentResult {
    status: ResultStatus;
    correctedImageResult?: NormalizedImageResultItem | DSImageData;
    originalImageResult?: OriginalImageResultItem["imageData"];
    detectedQuadrilateral?: Quadrilateral;
    _flowType?: EnumFlowType;
}
type ToolbarButtonConfig = Pick<ToolbarButton, "icon" | "label" | "className" | "isHidden">;
interface ToolbarButton {
    id: string;
    icon: string;
    label: string;
    onClick?: () => void | Promise<void>;
    className?: string;
    isDisabled?: boolean;
    isHidden?: boolean;
}

interface DocumentCorrectionViewToolbarButtonsConfig {
    fullImage?: ToolbarButtonConfig;
    detectBorders?: ToolbarButtonConfig;
    apply?: ToolbarButtonConfig;
}
interface DocumentCorrectionViewConfig {
    container?: HTMLElement | string;
    toolbarButtonsConfig?: DocumentCorrectionViewToolbarButtonsConfig;
    templateFilePath?: string;
    utilizedTemplateNames?: UtilizedTemplateNames;
    onFinish?: (result: DocumentResult) => void;
    _showResultView?: boolean;
}
declare class DocumentCorrectionView {
    private resources;
    private config;
    private imageEditorView;
    private layer;
    private currentCorrectionResolver?;
    constructor(resources: SharedResources, config: DocumentCorrectionViewConfig);
    initialize(): Promise<void>;
    private setupDrawingLayerStyle;
    private setupQuadConstraints;
    private getCanvasBounds;
    private addQuadToLayer;
    private setupInitialDetectedQuad;
    private createControls;
    private setupCorrectionControls;
    setFullImageBoundary(): void;
    setBoundaryAutomatically(): Promise<void>;
    confirmCorrection(): Promise<void>;
    launch(): Promise<DocumentResult>;
    hideView(): void;
    /**
     * Normalize an image with DDN given a set of points
     * @param points - points provided by either users or DDN's detect quad
     * @returns normalized image by DDN
     */
    correctImage(points: Quadrilateral["points"]): Promise<NormalizedImageResultItem>;
    dispose(): void;
}

declare enum _DEMO_CAMERA_LIST {
    DEMO_IDEAL_DOC = "demo1",
    DEMO_SIMILAR_BG = "demo2",
    PHYSICAL_CAMERA = "camera"
}
type _DEMO_CameraType = _DEMO_CAMERA_LIST;
interface DocumentScannerViewConfig {
    _showCorrectionView?: boolean;
    templateFilePath?: string;
    cameraEnhancerUIPath?: string;
    container?: HTMLElement | string;
    utilizedTemplateNames?: UtilizedTemplateNames;
}
declare class DocumentScannerView {
    private resources;
    private config;
    private demoScanningMode;
    private demoScanningResolution;
    private boundsDetectionEnabled;
    private smartCaptureEnabled;
    private autoCropEnabled;
    private crossVerificationCount;
    private capturedResultItems;
    private originalImageData;
    private initialized;
    private initializedDCE;
    private DCE_ELEMENTS;
    private currentScanResolver?;
    private loadingScreen;
    private showScannerLoadingOverlay;
    private hideScannerLoadingOverlay;
    constructor(resources: SharedResources, config: DocumentScannerViewConfig);
    initialize(): Promise<void>;
    private initializeElements;
    private assignDCEClickEvents;
    handleCloseBtn(): Promise<void>;
    private attachOptionClickListeners;
    private highlightCameraAndResolutionOption;
    private toggleSelectCameraBox;
    private _demo_CheckForFakeCamera;
    private _demo_AddFakeCameras;
    private _demo_AttachFakeEventsToCameras;
    private _demo_playVideoWithRes;
    private uploadImage;
    private fileToBlob;
    toggleAutoCaptureAnimation(enabled?: boolean): Promise<void>;
    toggleBoundsDetection(enabled?: boolean): Promise<void>;
    toggleSmartCapture(mode?: boolean): Promise<void>;
    toggleAutoCrop(mode?: boolean): Promise<void>;
    private get _demo_IsFirefoxAndroid();
    private _demo_saveSelectedCamera;
    openCamera(_demo_cameraType?: _DEMO_CameraType): Promise<void>;
    closeCamera(hideContainer?: boolean): void;
    pauseCamera(): void;
    stopCapturing(): void;
    private getFlowType;
    takePhoto(): Promise<void>;
    handleBoundsDetection(result: CapturedResult): Promise<void>;
    /**
     * Normalize an image with DDN given a set of points
     * @param points - points provided by either users or DDN's detect quad
     * @returns normalized image by DDN
     */
    private handleAutoCaptureMode;
    launch(_demo_cameraType?: _DEMO_CameraType): Promise<DocumentResult>;
    normalizeImage(points: Quadrilateral["points"], originalImageData: OriginalImageResultItem["imageData"]): Promise<NormalizedImageResultItem>;
}

interface DocumentResultViewToolbarButtonsConfig {
    retake?: ToolbarButtonConfig;
    correct?: ToolbarButtonConfig;
    share?: ToolbarButtonConfig;
    upload?: ToolbarButtonConfig;
    done?: ToolbarButtonConfig;
}
interface DocumentResultViewConfig {
    container?: HTMLElement | string;
    toolbarButtonsConfig?: DocumentResultViewToolbarButtonsConfig;
    onDone?: (result: DocumentResult) => Promise<void>;
    onUpload?: (result: DocumentResult) => Promise<void>;
}
declare class DocumentResultView {
    private resources;
    private config;
    private scannerView;
    private correctionView;
    private currentScanResultViewResolver?;
    constructor(resources: SharedResources, config: DocumentResultViewConfig, scannerView: DocumentScannerView, correctionView: DocumentCorrectionView);
    launch(): Promise<DocumentResult>;
    private handleUploadAndShareBtn;
    private handleShare;
    private handleCorrectImage;
    private handleRetake;
    private handleDone;
    private createControls;
    initialize(): Promise<void>;
    hideView(): void;
    dispose(preserveResolver?: boolean): void;
}

interface DocumentScannerConfig {
    license?: string;
    container?: HTMLElement | string;
    templateFilePath?: string;
    utilizedTemplateNames?: UtilizedTemplateNames;
    engineResourcePaths?: EngineResourcePaths;
    scannerViewConfig?: Omit<DocumentScannerViewConfig, "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView">;
    resultViewConfig?: DocumentResultViewConfig;
    correctionViewConfig?: Omit<DocumentCorrectionViewConfig, "templateFilePath" | "utilizedTemplateNames" | "_showCorrectionView">;
    showResultView?: boolean;
    showCorrectionView?: boolean;
}
interface SharedResources {
    cvRouter?: CaptureVisionRouter;
    cameraEnhancer?: CameraEnhancer;
    cameraView?: CameraView;
    result?: DocumentResult;
    onResultUpdated?: (result: DocumentResult) => void;
}
declare class DocumentScanner {
    private config;
    private scannerView?;
    private scanResultView?;
    private correctionView?;
    private resources;
    private isInitialized;
    private isCapturing;
    constructor(config: DocumentScannerConfig);
    initialize(): Promise<{
        resources: SharedResources;
        components: {
            scannerView?: DocumentScannerView;
            correctionView?: DocumentCorrectionView;
            scanResultView?: DocumentResultView;
        };
    }>;
    private initializeDCVResources;
    private shouldCreateDefaultContainer;
    private createDefaultDDSContainer;
    private checkForTemporaryLicense;
    private validateViewConfigs;
    private showCorrectionView;
    private showResultView;
    private initializeDDSConfig;
    private createViewContainers;
    dispose(): void;
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
    launch(_demo_cameraType?: _DEMO_CameraType): Promise<DocumentResult>;
}

declare const DDS: {
    DocumentScanner: typeof DocumentScanner;
    DocumentNormalizerView: typeof DocumentCorrectionView;
    DocumentScannerView: typeof DocumentScannerView;
    DocumentResultView: typeof DocumentResultView;
    EnumResultStatus: typeof EnumResultStatus;
    EnumFlowType: typeof EnumFlowType;
    EnumDDSViews: typeof EnumDDSViews;
};

export { DDS, DocumentCorrectionViewConfig, DocumentCorrectionViewToolbarButtonsConfig, DocumentCorrectionView as DocumentNormalizerView, DocumentResult, DocumentResultView, DocumentResultViewConfig, DocumentResultViewToolbarButtonsConfig, DocumentScanner, DocumentScannerConfig, DocumentScannerView, DocumentScannerViewConfig, EnumResultStatus, ResultStatus, SharedResources, ToolbarButtonConfig, UtilizedTemplateNames };

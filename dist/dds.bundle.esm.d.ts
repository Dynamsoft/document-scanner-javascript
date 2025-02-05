import { DSImageData, OriginalImageResultItem, Quadrilateral } from 'dynamsoft-core';
export * from 'dynamsoft-core';
export * from 'dynamsoft-license';
import { CapturedResult, CaptureVisionRouter } from 'dynamsoft-capture-vision-router';
export * from 'dynamsoft-capture-vision-router';
import { CameraEnhancer, CameraView } from 'dynamsoft-camera-enhancer';
export * from 'dynamsoft-camera-enhancer';
import { NormalizedImageResultItem } from 'dynamsoft-document-normalizer';
export * from 'dynamsoft-document-normalizer';
export * from 'dynamsoft-utility';
export { NormalizedImageResultItem, PlayCallbackInfo, Point, Rect, VideoDeviceInfo } from 'dynamsoft-capture-vision-bundle';

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
    container?: HTMLElement;
    toolbarButtonsConfig?: DocumentCorrectionViewToolbarButtonsConfig;
    templateFilePath?: string;
    utilizedTemplateNames?: UtilizedTemplateNames;
    onFinish?: (result: DocumentResult) => void;
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
    templateFilePath?: string;
    cameraEnhancerUIPath?: string;
    container?: HTMLElement;
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
    container?: HTMLElement;
    toolbarButtonsConfig?: DocumentResultViewToolbarButtonsConfig;
    onDone?: (result: DocumentResult) => Promise<void>;
    onUpload?: (result: DocumentResult) => Promise<void>;
}
declare class DocumentResultView {
    private resources;
    private config;
    private scannerView;
    private correctionView;
    private container;
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
    scannerViewConfig?: DocumentScannerViewConfig;
    resultViewConfig?: DocumentResultViewConfig;
    correctionViewConfig?: DocumentCorrectionViewConfig;
    utilizedTemplateNames?: UtilizedTemplateNames;
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
    private isCapturing;
    private shouldCreateDefaultContainer;
    private createDefaultDDSContainer;
    private createViewContainers;
    constructor(config: DocumentScannerConfig);
    initializeConfig(): Promise<void>;
    initialize(): Promise<{
        resources: SharedResources;
        components: {
            scannerView?: DocumentScannerView;
            correctionView?: DocumentCorrectionView;
            scanResultView?: DocumentResultView;
        };
    }>;
    private initializeResources;
    dispose(): void;
    /**
     * Launches the document scanning process.
     *
     * Flow paths based on which view containers are configured and the capture method:
     *
     * View Container Configurations
     * 1. All views present (Scanner, Correction, ScanResult)
     *    Flow:
     *      A. Auto-capture paths:
     *         - Smart Capture: Scanner -> Correction -> ScanResult
     *         - Auto Crop: Scanner -> ScanResult
     *
     *      B. Manual paths:
     *         - Upload Image: Scanner -> Correction -> ScanResult
     *         - Manual Capture: Scanner -> ScanResult
     * 2. Scanner + ScanResult
     *    Flow: Scanner -> ScanResult
     *
     * 3. Scanner + Correction
     *    Flow: Scanner -> Correction
     *
     * 4. Special cases:
     *    - Only Scanner available: Returns scan result directly
     *    - Only Correction available + existing result: Goes to Correction
     *    - Only ScanResult available + existing result: Goes to ScanResult
     *
     * @returns Promise<DocumentResult> containing:
     *  - status: Success/Failed/Cancelled with message
     *  - originalImageResult: Raw captured image
     *  - correctedImageResult: Normalized image (if correction applied)
     *  - detectedQuadrilateral: Document boundaries
     *  - _flowType: Internal routing flag for different capture methods
     *
     * @throws Error if capture session already running
     */
    launch(_demo_cameraType?: _DEMO_CameraType): Promise<DocumentResult>;
    /**
     * Checks if a capture session is currently in progress
     */
    isCapturingImage(): boolean;
}

declare const DDS: {
    DocumentScanner: typeof DocumentScanner;
    DocumentNormalizerView: typeof DocumentCorrectionView;
    DocumentScannerView: typeof DocumentScannerView;
    DocumentResultView: typeof DocumentResultView;
    EnumResultStatus: typeof EnumResultStatus;
};

export { DDS, DocumentCorrectionViewConfig, DocumentCorrectionViewToolbarButtonsConfig, DocumentCorrectionView as DocumentNormalizerView, DocumentResult, DocumentResultView, DocumentResultViewConfig, DocumentResultViewToolbarButtonsConfig, DocumentScanner, DocumentScannerConfig, DocumentScannerView, DocumentScannerViewConfig, EnumFlowType, EnumResultStatus, ResultStatus, SharedResources, ToolbarButtonConfig, UtilizedTemplateNames };

import { DSImageData, Quadrilateral, OriginalImageResultItem, EngineResourcePaths } from 'dynamsoft-core';
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
    UPLOADED_IMAGE = "uploadedImage",
    STATIC_FILE = "staticFile"
}
type ResultStatus = {
    code: EnumResultStatus;
    message?: string;
};
interface DocumentResult {
    status: ResultStatus;
    correctedImageResult?: NormalizedImageResultItem | DSImageData;
    originalImageResult?: DSImageData;
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

interface ScanRegion {
    ratio: {
        width: number;
        height: number;
    };
    regionBottomMargin: number;
    style: {
        strokeWidth: number;
        strokeColor: string;
    };
}
interface DocumentScannerViewConfig {
    _showCorrectionView?: boolean;
    templateFilePath?: string;
    cameraEnhancerUIPath?: string;
    container?: HTMLElement | string;
    utilizedTemplateNames?: UtilizedTemplateNames;
    enableAutoCropMode?: boolean;
    enableSmartCaptureMode?: boolean;
    scanRegion: ScanRegion;
    minVerifiedFramesForAutoCapture: number;
    showSubfooter?: boolean;
    showPoweredByDynamsoft?: boolean;
}
declare class DocumentScannerView {
    private resources;
    private config;
    private boundsDetectionEnabled;
    private smartCaptureEnabled;
    private autoCropEnabled;
    private resizeTimer;
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
    private getMinVerifiedFramesForAutoCapture;
    constructor(resources: SharedResources, config: DocumentScannerViewConfig);
    initialize(): Promise<void>;
    private initializeElements;
    private assignDCEClickEvents;
    handleCloseBtn(): Promise<void>;
    private attachOptionClickListeners;
    private highlightCameraAndResolutionOption;
    private toggleSelectCameraBox;
    private uploadImage;
    private fileToBlob;
    toggleAutoCaptureAnimation(enabled?: boolean): Promise<void>;
    toggleBoundsDetection(enabled?: boolean): Promise<void>;
    toggleSmartCapture(mode?: boolean): Promise<void>;
    toggleAutoCrop(mode?: boolean): Promise<void>;
    private handleResize;
    private toggleScanGuide;
    private calculateScanRegion;
    openCamera(): Promise<void>;
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
    launch(): Promise<DocumentResult>;
    normalizeImage(points: Quadrilateral["points"], originalImageData: OriginalImageResultItem["imageData"]): Promise<NormalizedImageResultItem>;
}

interface DocumentCorrectionViewToolbarButtonsConfig {
    retake?: ToolbarButtonConfig;
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
    private scannerView;
    private imageEditorView;
    private layer;
    private currentCorrectionResolver?;
    constructor(resources: SharedResources, config: DocumentCorrectionViewConfig, scannerView: DocumentScannerView);
    initialize(): Promise<void>;
    private setupDrawingLayerStyle;
    private setupQuadConstraints;
    private getCanvasBounds;
    private addQuadToLayer;
    private setupInitialDetectedQuad;
    private createControls;
    private setupCorrectionControls;
    private handleRetake;
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
    dispose(preserveResolver?: boolean): void;
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
    private loadingScreen;
    private showScannerLoadingOverlay;
    private hideScannerLoadingOverlay;
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
     * Process a File object to extract image information
     * @param file The File object to process
     * @returns Promise with the processed image blob and dimensions
     */
    private processFileToBlob;
    /**
     * Processes an uploaded image file
     * @param file The file to process
     * @returns Promise with the document result
     */
    private processUploadedFile;
    /**
     * Launches the document scanning process.
     *
     * @param file Optional File object to process instead of using the camera
     * @returns Promise<DocumentResult> containing scan results
     */
    launch(file?: File): Promise<DocumentResult>;
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

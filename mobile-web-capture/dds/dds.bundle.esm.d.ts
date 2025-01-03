import { DSImageData, OriginalImageResultItem, Quadrilateral } from 'dynamsoft-core';
export * from 'dynamsoft-core';
export * from 'dynamsoft-license';
import { CapturedResult, CaptureVisionRouter } from 'dynamsoft-capture-vision-router';
export * from 'dynamsoft-capture-vision-router';
import { CameraEnhancer, CameraView } from 'dynamsoft-camera-enhancer';
export * from 'dynamsoft-camera-enhancer';
export * from 'dynamsoft-code-parser';
import { NormalizedImageResultItem } from 'dynamsoft-document-normalizer';
export * from 'dynamsoft-document-normalizer';
export * from 'dynamsoft-utility';

interface UtilizedTemplateNames {
    detect: string;
    normalize: string;
}
declare enum EnumResultStatusCode {
    SUCCESS = 0,
    CANCELLED = 1,
    FAILED = 2
}
type ResultStatus = {
    code: EnumResultStatusCode;
    message?: string;
};
interface DocumentScanResult {
    status: ResultStatus;
    correctedImageResult?: NormalizedImageResultItem | DSImageData;
    originalImageResult?: OriginalImageResultItem["imageData"];
    detectedQuadrilateral?: Quadrilateral;
}

interface DocumentCorrectionViewControls {
    fullImageBtn?: HTMLElement | string;
    autoBoundsBtn?: HTMLElement | string;
    finishBtn?: HTMLElement | string;
    containerStyle?: Partial<CSSStyleDeclaration>;
}
interface DocumentCorrectionViewConfig {
    container: HTMLElement;
    controls: DocumentCorrectionViewControls;
    utilizedTemplateNames: UtilizedTemplateNames;
    onFinish?: (result: DocumentScanResult) => void;
}
declare class DocumentCorrectionView {
    private resources;
    private config;
    private imageEditorView;
    private layer;
    private controls;
    private currentCorrectionResolver?;
    constructor(resources: SharedResources, config: DocumentCorrectionViewConfig);
    initialize(): Promise<void>;
    private setupDrawingLayerStyle;
    private setupQuadConstraints;
    private getCanvasBounds;
    private addQuadToLayer;
    private setupInitialDetectedQuad;
    private createDefaultControls;
    private setupCorrectionControls;
    setFullImageBoundary(): void;
    setBoundaryAutomatically(): Promise<void>;
    confirmCorrection(): Promise<void>;
    launch(): Promise<DocumentScanResult>;
    hideView(): void;
    /**
     * Normalize an image with DDN given a set of points
     * @param points - points provided by either users or DDN's detect quad
     * @returns normalized image by DDN
     */
    normalizeImage(points: Quadrilateral["points"]): Promise<NormalizedImageResultItem>;
    dispose(): void;
}

interface DocumentScannerViewConfig {
    templateFilePath?: string;
    cameraEnhancerUIPath?: string;
    container: HTMLElement;
    consecutiveResultFramesBeforeNormalization?: number;
    utilizedTemplateNames?: UtilizedTemplateNames;
}
declare class DocumentScannerView {
    private resources;
    private config;
    private boundsDetectionEnabled;
    private autoCaptureEnabled;
    private frameCount;
    private capturedResultItems;
    private originalImageData;
    private initialized;
    private initializedDCE;
    private DCE_ELEMENTS;
    private currentScanResolver?;
    constructor(resources: SharedResources, config: DocumentScannerViewConfig);
    initialize(): Promise<void>;
    private initializeElements;
    private assignDCEClickEvents;
    handleCloseBtn(): Promise<void>;
    toggleBoundsDetection(enabled?: boolean): Promise<void>;
    toggleAutoCapture(mode?: boolean): Promise<void>;
    openCamera(): Promise<void>;
    closeCamera(): Promise<void>;
    pauseCamera(): void;
    stopCapturing(): void;
    takePhoto(): Promise<void>;
    handleBoundsDetection(result: CapturedResult): Promise<void>;
    /**
     * Normalize an image with DDN given a set of points
     * @param points - points provided by either users or DDN's detect quad
     * @returns normalized image by DDN
     */
    private handleAutoCaptureMode;
    launch(): Promise<DocumentScanResult>;
    normalizeImage(points: Quadrilateral["points"], originalImageData: OriginalImageResultItem["imageData"]): Promise<NormalizedImageResultItem>;
}

interface ScanResultViewControls {
    exportBtn?: HTMLElement | string;
    correctionBtn?: HTMLElement | string;
    retakeBtn?: HTMLElement | string;
    continueBtn?: HTMLElement | string;
    useDefaultControls?: boolean;
    containerStyle?: Partial<CSSStyleDeclaration>;
}
interface ScanResultViewConfig {
    container: HTMLElement;
    controls: ScanResultViewControls;
    onContinue?: (result: DocumentScanResult) => Promise<void>;
    onExport?: (result: DocumentScanResult) => Promise<void>;
}
declare class ScanResultView {
    private resources;
    private config;
    private scannerView;
    private correctionView;
    private container;
    private controls;
    private currentScanResultViewResolver?;
    constructor(resources: SharedResources, config: ScanResultViewConfig, scannerView: DocumentScannerView, correctionView: DocumentCorrectionView);
    launch(): Promise<DocumentScanResult>;
    private handleExport;
    private handleNormalize;
    private handleRetake;
    private handleContinue;
    private createDefaultControls;
    private setupScanResultViewControls;
    initialize(): Promise<void>;
    hideView(): void;
    dispose(preserveResolver?: boolean): void;
}

interface DocumentScannerConfig {
    license?: string;
    container?: HTMLElement | string;
    scannerViewConfig?: DocumentScannerViewConfig;
    scanResultViewConfig?: ScanResultViewConfig;
    correctionViewConfig?: DocumentCorrectionViewConfig;
    utilizedTemplateNames?: UtilizedTemplateNames;
}
interface SharedResources {
    cvRouter?: CaptureVisionRouter;
    cameraEnhancer?: CameraEnhancer;
    cameraView?: CameraView;
    result?: DocumentScanResult;
    onResultUpdated?: (result: DocumentScanResult) => void;
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
    private getContainer;
    private createViewContainers;
    constructor(config: DocumentScannerConfig);
    initialize(): Promise<{
        scannerView: DocumentScannerView;
        correctionView: DocumentCorrectionView;
        scanResultView: ScanResultView;
    }>;
    private initializeResources;
    dispose(): void;
    /**
     * Starts the complete Image capture flow:
     * 1. Initializes camera and scanning
     * 2. Captures the Image
     * 3. Shows preview with options to correct (normalize)
     * @returns Promise that resolves with the final scan results
     */
    launch(): Promise<DocumentScanResult>;
    /**
     * Checks if a capture session is currently in progress
     */
    isCapturingImage(): boolean;
    /**
     * Cancels the current capture session if one is in progress
     */
    cancelImageCapture(): Promise<void>;
}

declare const DDS: {
    DocumentScanner: typeof DocumentScanner;
    DocumentNormalizerView: typeof DocumentCorrectionView;
    DocumentScannerView: typeof DocumentScannerView;
    ScanResultView: typeof ScanResultView;
    EnumResultStatusCode: typeof EnumResultStatusCode;
};

export { DDS, DocumentCorrectionViewConfig, DocumentCorrectionViewControls, DocumentCorrectionView as DocumentNormalizerView, DocumentScanResult, DocumentScanner, DocumentScannerConfig, DocumentScannerView, DocumentScannerViewConfig, EnumResultStatusCode, ResultStatus, ScanResultView, ScanResultViewConfig, ScanResultViewControls, SharedResources, UtilizedTemplateNames };

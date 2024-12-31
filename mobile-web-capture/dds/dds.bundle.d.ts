import { DSImageData, OriginalImageResultItem, Quadrilateral } from 'dynamsoft-core';
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
import * as dynamsoftCodeParser from 'dynamsoft-code-parser';
export { dynamsoftCodeParser as DCP };
import { NormalizedImageResultItem } from 'dynamsoft-document-normalizer';
import * as dynamsoftDocumentNormalizer from 'dynamsoft-document-normalizer';
export { dynamsoftDocumentNormalizer as DDN };
import * as dynamsoftUtility from 'dynamsoft-utility';
export { dynamsoftUtility as Utility };

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
    normalizedImageResult?: NormalizedImageResultItem | DSImageData;
    originalImageResult?: OriginalImageResultItem["imageData"];
    detectedQuadrilateral?: Quadrilateral;
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
    constructor(resources: SharedResources, config: DocumentScannerConfig);
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
    private handleAutoCaptureMode;
    launch(): Promise<DocumentScanResult>;
    normalizeImage(points: Quadrilateral["points"], originalImageData: OriginalImageResultItem["imageData"]): Promise<NormalizedImageResultItem>;
}

interface DocumentNormalizerViewControls {
    fullImageBtn?: HTMLElement | string;
    autoBoundsBtn?: HTMLElement | string;
    finishBtn?: HTMLElement | string;
    containerStyle?: Partial<CSSStyleDeclaration>;
}
interface DocumentNormalizerViewConfig {
    container: HTMLElement;
    controls: DocumentNormalizerViewControls;
    onFinish?: (result: DocumentScanResult) => void;
}
declare class DocumentNormalizerView {
    private resources;
    private config;
    private imageEditorView;
    private layer;
    private controls;
    private currentNormalizerResolver?;
    constructor(resources: SharedResources, config: DocumentScannerConfig);
    initialize(): Promise<void>;
    private setupDrawingLayerStyle;
    private setupQuadConstraints;
    private getCanvasBounds;
    private addQuadToLayer;
    private setupInitialDetectedQuad;
    private createDefaultControls;
    private setupNormalizerControls;
    setFullImageBoundary(): void;
    setBoundaryAutomatically(): Promise<void>;
    confirmNormalization(): Promise<void>;
    launch(): Promise<DocumentScanResult>;
    hideEditor(): void;
    normalizeImage(points: Quadrilateral["points"]): Promise<NormalizedImageResultItem>;
    dispose(): void;
}

interface ScanResultViewControls {
    exportBtn?: HTMLElement | string;
    normalizeBtn?: HTMLElement | string;
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
    private scanner;
    private normalizerView;
    private container;
    private controls;
    private currentScanResultViewResolver?;
    constructor(resources: SharedResources, config: DocumentScannerConfig, scanner: DocumentScannerView, normalizerView: DocumentNormalizerView);
    launch(): Promise<DocumentScanResult>;
    private handleExport;
    private handleNormalize;
    private handleRetake;
    private handleContinue;
    private createDefaultControls;
    private setupPreviewControls;
    initialize(): Promise<void>;
    hidePreview(): void;
    dispose(preserveResolver?: boolean): void;
}

interface UtilizedTemplateNames {
    detect: string;
    normalize: string;
}
interface DocumentScannerConfig {
    license?: string;
    templateFilePath?: string;
    cameraEnhancerUIPath?: string;
    cameraViewContainer: HTMLElement;
    scanResultViewConfig?: ScanResultViewConfig;
    documentNormalizerViewConfig?: DocumentNormalizerViewConfig;
    consecutiveResultFramesBeforeNormalization?: number;
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
    private normalizerView?;
    private resources;
    private isCapturing;
    constructor(config: DocumentScannerConfig);
    initialize(): Promise<{
        scannerView: DocumentScannerView;
        normalizerView: DocumentNormalizerView;
        scanResultView: ScanResultView;
    }>;
    private initializeResources;
    dispose(): void;
    /**
     * Starts the complete Image capture flow:
     * 1. Initializes camera and scanning
     * 2. Captures the Image
     * 3. Shows preview with options to edit/normalize
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
    DocumentNormalizerView: typeof DocumentNormalizerView;
    DocumentScannerView: typeof DocumentScannerView;
    ScanResultView: typeof ScanResultView;
};

export { DDS, DocumentNormalizerView, DocumentNormalizerViewConfig, DocumentScanResult, DocumentScanner, DocumentScannerConfig, DocumentScannerView, EnumResultStatusCode, ScanResultView, ScanResultViewConfig, SharedResources, UtilizedTemplateNames };

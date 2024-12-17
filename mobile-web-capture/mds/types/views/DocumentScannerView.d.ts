import { DSImageData, OriginalImageResultItem, Quadrilateral } from "dynamsoft-core";
import { CapturedResult } from "dynamsoft-capture-vision-router";
import { NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { MobileDocumentScannerConfig, SharedResources } from "../MobileDocumentScanner";
export interface DocumentScanResult {
    success: boolean;
    normalizedImageResult?: NormalizedImageResultItem | DSImageData;
    originalImageResult?: OriginalImageResultItem["imageData"];
    detectedQuadrilateral?: Quadrilateral;
    error?: Error;
}
export default class DocumentScannerView {
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
    constructor(resources: SharedResources, config: MobileDocumentScannerConfig);
    initialize(): Promise<void>;
    private initializeElements;
    private assignDCEClickEvents;
    toggleBoundsDetection(enabled?: boolean): Promise<void>;
    toggleAutoCapture(mode?: boolean): Promise<void>;
    openCamera(): Promise<void>;
    closeCamera(): Promise<void>;
    pauseCamera(): void;
    stopCapturing(): void;
    takePhoto(): Promise<void>;
    handleBoundsDetection(result: CapturedResult): Promise<void>;
    private handleAutoCaptureMode;
    scanImage(): Promise<DocumentScanResult>;
    normalizeImage(points: Quadrilateral["points"], originalImageData: OriginalImageResultItem["imageData"]): Promise<NormalizedImageResultItem>;
}
//# sourceMappingURL=DocumentScannerView.d.ts.map
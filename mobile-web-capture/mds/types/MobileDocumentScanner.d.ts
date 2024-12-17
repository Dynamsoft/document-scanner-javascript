import { CaptureVisionRouter } from "dynamsoft-capture-vision-router";
import { CameraEnhancer, CameraView } from "dynamsoft-camera-enhancer";
import DocumentNormalizerView, { DocumentNormalizerViewConfig } from "./views/DocumentNormalizerView";
import DocumentScannerView, { DocumentScanResult } from "./views/DocumentScannerView";
import ScanResultView, { ScanResultViewConfig } from "./views/ScanResultView";
interface UtilizedTemplateNames {
    detect: string;
    normalize: string;
}
export interface MobileDocumentScannerConfig {
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
declare class MobileDocumentScanner {
    private config;
    private scannerView?;
    private scanResultView?;
    private normalizerView?;
    private resources;
    private isCapturing;
    constructor(config: MobileDocumentScannerConfig);
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
    startImageCapture(): Promise<DocumentScanResult>;
    /**
     * Checks if a capture session is currently in progress
     */
    isCapturingImage(): boolean;
    /**
     * Cancels the current capture session if one is in progress
     */
    cancelImageCapture(): Promise<void>;
}
export default MobileDocumentScanner;
//# sourceMappingURL=MobileDocumentScanner.d.ts.map
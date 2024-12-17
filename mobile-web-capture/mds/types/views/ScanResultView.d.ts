import { MobileDocumentScannerConfig, SharedResources } from "../MobileDocumentScanner";
import DocumentScannerView, { DocumentScanResult } from "./DocumentScannerView";
import DocumentNormalizerView from "./DocumentNormalizerView";
interface ScanResultViewControls {
    exportBtn?: HTMLElement | string;
    normalizeBtn?: HTMLElement | string;
    retakeBtn?: HTMLElement | string;
    continueBtn?: HTMLElement | string;
    useDefaultControls?: boolean;
    containerStyle?: Partial<CSSStyleDeclaration>;
}
export interface ScanResultViewConfig {
    container: HTMLElement;
    controls: ScanResultViewControls;
    onContinue?: (result: DocumentScanResult) => Promise<void>;
    onExport?: (result: DocumentScanResult) => Promise<void>;
}
export default class ScanResultView {
    private resources;
    private config;
    private scanner;
    private normalizerView;
    private container;
    private controls;
    private currentScanResultViewResolver?;
    constructor(resources: SharedResources, config: MobileDocumentScannerConfig, scanner: DocumentScannerView, normalizerView: DocumentNormalizerView);
    showPreview(): Promise<DocumentScanResult>;
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
export {};
//# sourceMappingURL=ScanResultView.d.ts.map
import { Quadrilateral } from "dynamsoft-core";
import { NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { MobileDocumentScannerConfig, SharedResources } from "../MobileDocumentScanner";
import { DocumentScanResult } from "./DocumentScannerView";
interface DocumentNormalizerViewControls {
    fullImageBtn?: HTMLElement | string;
    autoBoundsBtn?: HTMLElement | string;
    finishBtn?: HTMLElement | string;
    containerStyle?: Partial<CSSStyleDeclaration>;
}
export interface DocumentNormalizerViewConfig {
    container: HTMLElement;
    controls: DocumentNormalizerViewControls;
    onFinish?: (result: DocumentScanResult) => void;
}
export default class DocumentNormalizerView {
    private resources;
    private config;
    private imageEditorView;
    private layer;
    private controls;
    private currentNormalizerResolver?;
    constructor(resources: SharedResources, config: MobileDocumentScannerConfig);
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
    showEditor(): Promise<DocumentScanResult>;
    hideEditor(): void;
    normalizeImage(points: Quadrilateral["points"]): Promise<NormalizedImageResultItem>;
    dispose(): void;
}
export {};
//# sourceMappingURL=DocumentNormalizerView.d.ts.map
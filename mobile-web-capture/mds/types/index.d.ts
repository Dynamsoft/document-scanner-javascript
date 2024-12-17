// mds/types/index.d.ts

import { DSImageData, Quadrilateral, OriginalImageResultItem } from "dynamsoft-core";
import { NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";

declare module "dynamsoft-mobile-document-scanner" {
  // Core Interfaces
  export interface UtilizedTemplateNames {
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
    cvRouter?: any; // CaptureVisionRouter
    cameraEnhancer?: any; // CameraEnhancer
    cameraView?: any; // CameraView
    result?: DocumentScanResult;
    onResultUpdated?: (result: DocumentScanResult) => void;
  }

  // Result Interfaces
  export interface DocumentScanResult {
    success: boolean;
    normalizedImageResult?: NormalizedImageResultItem | DSImageData;
    originalImageResult?: OriginalImageResultItem["imageData"];
    detectedQuadrilateral?: Quadrilateral;
    error?: Error;
  }

  // View Configurations
  export interface ScanResultViewControls {
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

  export interface DocumentNormalizerViewControls {
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

  // Main Class
  export default class MobileDocumentScanner {
    constructor(config: MobileDocumentScannerConfig);

    initialize(): Promise<{
      scannerView: any; // DocumentScannerView
      normalizerView: any; // DocumentNormalizerView
      scanResultView: any; // ScanResultView
    }>;

    dispose(): void;

    startImageCapture(): Promise<DocumentScanResult>;

    isCapturingImage(): boolean;

    cancelImageCapture(): Promise<void>;
  }
}

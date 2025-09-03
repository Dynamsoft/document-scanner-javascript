/// <reference types="vite/client" />

declare module 'dynamsoft-document-scanner' {
  export interface DocumentScannerConfig {
    license: string;
  }

  export interface CorrectedImageResult {
    toCanvas(): HTMLCanvasElement;
  }

  export interface ScanResult {
    correctedImageResult?: CorrectedImageResult;
  }

  export class DocumentScanner {
    constructor(config: DocumentScannerConfig);
    launch(): Promise<ScanResult | undefined>;
  }
}
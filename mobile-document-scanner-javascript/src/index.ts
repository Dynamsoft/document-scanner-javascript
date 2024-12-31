import DocumentScanner from "./DocumentScanner";
import DocumentNormalizerView from "./views/DocumentNormalizerView";
import DocumentScannerView from "./views/DocumentScannerView";
import ScanResultView from "./views/ScanResultView";

export const DDS = {
  DocumentScanner,
  DocumentNormalizerView,
  DocumentScannerView,
  ScanResultView,
};

export type { DocumentScannerConfig, SharedResources, UtilizedTemplateNames } from "./DocumentScanner";
export type { DocumentNormalizerViewConfig } from "./views/DocumentNormalizerView";
export type { DocumentScanResult, EnumResultStatusCode } from "./views/DocumentScannerView";
export type { ScanResultViewConfig } from "./views/ScanResultView";

export { DocumentScanner, DocumentNormalizerView, DocumentScannerView, ScanResultView };

export default DDS;

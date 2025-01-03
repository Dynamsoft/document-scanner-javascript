import DocumentScanner from "./DocumentScanner";
import DocumentNormalizerView from "./views/DocumentCorrectionView";
import DocumentScannerView from "./views/DocumentScannerView";
import ScanResultView from "./views/ScanResultView";
import { EnumResultStatusCode } from "./views/utils/types";

export const DDS = {
  DocumentScanner,
  DocumentNormalizerView,
  DocumentScannerView,
  ScanResultView,
  EnumResultStatusCode,
};

export type { DocumentScannerConfig, SharedResources } from "./DocumentScanner";
export type { DocumentScannerViewConfig } from "./views/DocumentScannerView";
export type { DocumentCorrectionViewConfig, DocumentCorrectionViewControls } from "./views/DocumentCorrectionView";
export type { ScanResultViewConfig, ScanResultViewControls } from "./views/ScanResultView";
export type { DocumentScanResult, UtilizedTemplateNames, ResultStatus } from "./views/utils/types";

export { DocumentScanner, DocumentNormalizerView, DocumentScannerView, ScanResultView, EnumResultStatusCode };

export default DDS;

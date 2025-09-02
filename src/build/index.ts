import DocumentScanner from "../DocumentScanner";
import DocumentNormalizerView from "../views/DocumentCorrectionView";
import DocumentScannerView from "../views/DocumentScannerView";
import DocumentResultView from "../views/DocumentResultView";
import { EnumResultStatus, EnumFlowType, EnumDDSViews } from "../views/utils/types";

export const DDS = {
  DocumentScanner,
  DocumentNormalizerView,
  DocumentScannerView,
  DocumentResultView,
  EnumResultStatus,
  EnumFlowType,
  EnumDDSViews,
};

export type { DocumentScannerConfig, SharedResources } from "../DocumentScanner";
export type { DocumentScannerViewConfig } from "../views/DocumentScannerView";
export type {
  DocumentCorrectionViewConfig,
  DocumentCorrectionViewToolbarButtonsConfig,
} from "../views/DocumentCorrectionView";
export type { DocumentResultViewConfig, DocumentResultViewToolbarButtonsConfig } from "../views/DocumentResultView";
export type { DocumentResult, UtilizedTemplateNames, ResultStatus, ToolbarButtonConfig } from "../views/utils/types";

export { DocumentScanner, DocumentNormalizerView, DocumentScannerView, DocumentResultView, EnumResultStatus };

export default DDS;

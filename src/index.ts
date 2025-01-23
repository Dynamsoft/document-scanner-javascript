import DocumentScanner from "./DocumentScanner";
import DocumentNormalizerView from "./views/DocumentCorrectionView";
import DocumentScannerView from "./views/DocumentScannerView";
import ScanResultView from "./views/ScanResultView";
import { EnumResultStatus } from "./views/utils/types";
import {
  PlayCallbackInfo,
  Point,
  Rect,
  VideoDeviceInfo,
  NormalizedImageResultItem,
} from "dynamsoft-capture-vision-bundle";

export const DDS = {
  DocumentScanner,
  DocumentNormalizerView,
  DocumentScannerView,
  ScanResultView,
  EnumResultStatus,
};

export type { NormalizedImageResultItem, PlayCallbackInfo, Point, Rect, VideoDeviceInfo };
export type { DocumentScannerConfig, SharedResources } from "./DocumentScanner";
export type { DocumentScannerViewConfig } from "./views/DocumentScannerView";
export type { DocumentCorrectionViewConfig, DocumentCorrectionViewControlIcons } from "./views/DocumentCorrectionView";
export type { ScanResultViewConfig, ScanResultViewControlIcons } from "./views/ScanResultView";
export type {
  DocumentScanResult,
  UtilizedTemplateNames,
  ResultStatus,
  ControlButton,
  EnumFlowType,
} from "./views/utils/types";

export { DocumentScanner, DocumentNormalizerView, DocumentScannerView, ScanResultView, EnumResultStatus };

export default DDS;

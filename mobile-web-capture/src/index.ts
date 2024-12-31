import MobileWebCapture from "./MobileWebCapture";
import { LibraryView } from "./views/LibraryView";
import { DocumentView } from "./views/DocumentView";
import { PageView } from "./views/PageView";
import { TransferView } from "./views/TransferView";

export const MWC = {
  MobileWebCapture,
  LibraryView,
  DocumentView,
  PageView,
  TransferView,
};

export type { MobileWebCaptureConfig, UploadedDocument, ExportConfig, UploadStatus } from "./MobileWebCapture";
export type { LibraryViewConfig } from "./views/LibraryView";
export type { DocumentViewConfig } from "./views/DocumentView";
export type { PageViewConfig } from "./views/PageView";
export type { TransferViewConfig } from "./views/TransferView";

export { MobileWebCapture, LibraryView, DocumentView, PageView, TransferView };

export default MWC;

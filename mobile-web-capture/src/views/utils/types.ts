// Common types
export type UploadStatus = "success" | "failed";

export type UploadedDocument = {
  fileName: string;
  downloadUrl: string;
  status: UploadStatus;
  uploadTime?: string;
};

export interface ExportConfig {
  uploadToServer?: (fileName: string, blob: Blob) => void | UploadedDocument;
  downloadFromServer?: (doc: UploadedDocument) => void;
  deleteFromServer?: (doc: UploadedDocument) => void;
}

import { DSImageData, OriginalImageResultItem, Quadrilateral } from "dynamsoft-core";
import { NormalizedImageResultItem } from "dynamsoft-document-normalizer";

export const DEFAULT_TEMPLATE_NAMES = {
  detect: "DetectDocumentBoundaries_Default",
  normalize: "NormalizeDocument_Default",
};

// Common types
export interface UtilizedTemplateNames {
  detect: string;
  normalize: string;
}

export enum EnumResultStatus {
  RS_SUCCESS = 0,
  RS_CANCELLED = 1,
  RS_FAILED = 2,
}

export enum EnumFlowType {
  MANUAL = "manual",
  SMART_CAPTURE = "smartCapture",
  AUTO_CROP = "autoCrop",
  UPLOADED_IMAGE = "uploadedImage",
}

export type ResultStatus = {
  code: EnumResultStatus;
  message?: string;
};

export interface DocumentScanResult {
  status: ResultStatus;
  correctedImageResult?: NormalizedImageResultItem | DSImageData;
  originalImageResult?: OriginalImageResultItem["imageData"];
  detectedQuadrilateral?: Quadrilateral;
  _flowType?: EnumFlowType;
}

export interface ControlButton {
  icon: string;
  text: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
}

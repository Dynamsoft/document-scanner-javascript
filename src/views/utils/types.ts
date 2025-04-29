import { DSImageData, Quadrilateral } from "dynamsoft-core";
import { NormalizedImageResultItem } from "dynamsoft-document-normalizer";

export enum EnumDDSViews {
  Scanner = "scanner",
  Result = "scan-result",
  Correction = "correction",
}

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
  STATIC_FILE = "staticFile",
}

export type ResultStatus = {
  code: EnumResultStatus;
  message?: string;
};

export interface DocumentResult {
  status: ResultStatus;
  correctedImageResult?: NormalizedImageResultItem | DSImageData;
  originalImageResult?: DSImageData;
  detectedQuadrilateral?: Quadrilateral;
  _flowType?: EnumFlowType;
}

export type ToolbarButtonConfig = Pick<ToolbarButton, "icon" | "label" | "className" | "isHidden">;

export interface ToolbarButton {
  id: string;
  icon: string;
  label: string;
  onClick?: () => void | Promise<void>;
  className?: string;
  isDisabled?: boolean;
  isHidden?: boolean;
}

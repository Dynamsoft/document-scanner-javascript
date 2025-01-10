import { DSImageData, OriginalImageResultItem, Quadrilateral } from "dynamsoft-core";
import { NormalizedImageResultItem } from "dynamsoft-document-normalizer";

// Common types
export interface UtilizedTemplateNames {
  detect: string;
  normalize: string;
}

export enum EnumResultStatusCode {
  SUCCESS = 0,
  CANCELLED = 1,
  FAILED = 2,
}

export type ResultStatus = {
  code: EnumResultStatusCode;
  message?: string;
};

export interface DocumentScanResult {
  status: ResultStatus;
  correctedImageResult?: NormalizedImageResultItem | DSImageData;
  originalImageResult?: OriginalImageResultItem["imageData"];
  detectedQuadrilateral?: Quadrilateral;
}

export interface ControlButton {
  icon: string;
  text: string;
  onClick?: () => void | Promise<void>;
}

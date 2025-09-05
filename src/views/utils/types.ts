import { DSImageData, Quadrilateral, DeskewedImageResultItem } from "dynamsoft-capture-vision-bundle";

export enum EnumDDSViews {
  Scanner = "scanner",
  Result = "scan-result",
  Correction = "correction",
}

export const DEFAULT_TEMPLATE_NAMES = {
  detect: "DetectDocumentBoundaries_Default",
  normalize: "NormalizeDocument_Default",
};

/**
 * Capture Vision template names for detection and correction.
 * 
 * @remarks
 * You may set custom names to self-host resources, or fully self-host MDS.
 * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | self-hosting resources}
 * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV Templates}
 * 
 * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
 * 
 * @public
 */
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

/**
 * Represents the output of a scan, including the original image, the corrected image, detected boundaries, and scan status.
 * 
 * @public
 */
export interface DocumentResult {
  /**
   * The status of the document scan (success, failed, canceled).
   * 
   * @see {@link ResultStatus}
   * 
   * @public
   */
  status: ResultStatus;
  /**
   * The processed (corrected) image.
   */
  correctedImageResult?: DeskewedImageResultItem;
  /**
   * The original captured image before correction.
   * 
   * @public
   */
  originalImageResult?: DSImageData;
  /**
   * The detected document boundaries.
   * 
   * @public
   */
  detectedQuadrilateral?: Quadrilateral;
  _flowType?: EnumFlowType;
}

/**
 * A simplified configuration type for toolbar buttons.
 * 
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
 *     correctionViewConfig: {
 *         toolbarButtonsConfig: {
 *             fullImage: {
 *                 isHidden: true
 *             },
 *             detectBorders: {
 *                 icon: "path/to/new_icon.png", // Change to the actual path of the new icon
 *                 label: "Custom Label"
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
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

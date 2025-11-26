import { DSImageData, Quadrilateral, DeskewedImageResultItem, EnhancedImageResultItem } from "dynamsoft-capture-vision-bundle";

/**
 * Enumeration of available view types in the Document Scanner system.
 *
 * @remarks
 * Scanner: camera view, Result: final view, Correction: boundary adjustment view.
 *
 * @public
 */
export enum EnumDDSViews {
  /**
   * Main camera view for capturing documents.
   */
  Scanner = "scanner",
  /**
   * Final view displaying processed document results.
   */
  Result = "scan-result",
  /**
   * Intermediate view for adjusting detected document boundaries.
   */
  Correction = "correction",
}

/**
 * Default Capture Vision template names for document detection and normalization.
 *
 * @remarks
 * Override via {@link UtilizedTemplateNames} to use custom templates for self-hosted resources.
 * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting}
 *
 * @public
 */
export const DEFAULT_TEMPLATE_NAMES = {
  /**
   * Template name for detecting document boundaries.
   * @defaultValue "DetectDocumentBoundaries_Default"
   */
  detect: "DetectDocumentBoundaries_Default",
  /**
   * Template name for normalizing (correcting and enhancing) detected documents.
   * @defaultValue "NormalizeDocument_Default"
   */
  normalize: "NormalizeDocument_Default",
};

/**
 * Capture Vision template names for document detection and normalization.
 *
 * @remarks
 * Override to self-host resources.
 * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting}
 *
 * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
 * @public
 */
export interface UtilizedTemplateNames {
  detect: string;
  normalize: string;
}

/**
 * Enumeration of result status codes for document scanning operations.
 *
 * @remarks
 * RS_SUCCESS: successful scan, RS_CANCELLED: user cancelled, RS_FAILED: error occurred.
 *
 * @public
 */
export enum EnumResultStatus {
  /**
   * Document was successfully captured and processed.
   */
  RS_SUCCESS = 0,
  /**
   * User cancelled the scanning operation.
   */
  RS_CANCELLED = 1,
  /**
   * Scanning or processing failed due to an error.
   */
  RS_FAILED = 2,
}

/**
 * Enumeration of document scanning flow types indicating capture method.
 *
 * @remarks
 * Tracks how document was captured. Used by {@link shouldCorrectImage} to determine correction behavior.
 *
 * @public
 */
export enum EnumFlowType {
  /**
   * User manually captured the document via camera button.
   */
  MANUAL = "manual",
  /**
   * Document was automatically captured when stable boundaries were detected.
   */
  SMART_CAPTURE = "smartCapture",
  /**
   * Document was detected and cropped automatically without user intervention.
   */
  AUTO_CROP = "autoCrop",
  /**
   * Document image was uploaded from device storage.
   */
  UPLOADED_IMAGE = "uploadedImage",
  /**
   * Document was loaded from a static file path or URL.
   */
  STATIC_FILE = "staticFile",
}

/**
 * Type representing the status of a document scanning operation.
 *
 * @remarks
 * Combines status code with optional error message.
 *
 * @example
 * ```typescript
 * if (result.status.code === EnumResultStatus.RS_SUCCESS) {
 *   console.log("Scan successful!");
 * } else if (result.status.code === EnumResultStatus.RS_FAILED) {
 *   console.error("Scan failed:", result.status.message);
 * }
 * ```
 *
 * @public
 */
export type ResultStatus = {
  /**
   * Status code (success, cancellation, or failure).
   * @see {@link EnumResultStatus}
   */
  code: EnumResultStatus;
  /**
   * Optional error message (typically populated when failed).
   */
  message?: string;
};

/**
 * Represents the complete output of a document scanning operation.
 *
 * @remarks
 * Optional properties present only on successful scans.
 *
 * @example
 * ```typescript
 * const result = await scanner.scan();
 * if (result.status.code === EnumResultStatus.RS_SUCCESS) {
 *   const correctedImage = result.correctedImageResult;
 *   const originalImage = result.originalImageResult;
 *   const boundaries = result.detectedQuadrilateral;
 * }
 * ```
 *
 * @public
 */
export interface DocumentResult {
  /**
   * Status of the scan operation.
   * @public
   */
  status: ResultStatus;
  /**
   * Perspective-corrected and enhanced image.
   * When binaryImage is enabled, this will be an EnhancedImageResultItem.
   * @public
   */
  correctedImageResult?: DeskewedImageResultItem | EnhancedImageResultItem;
  /**
   * Original captured image before processing.
   * @public
   */
  originalImageResult?: DSImageData;
  /**
   * Detected document boundaries (quadrilateral).
   * @public
   */
  detectedQuadrilateral?: Quadrilateral;
  /**
   * Internal property tracking capture method.
   * @internal
   */
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
 export type ToolbarButtonConfig = Partial<Pick<ToolbarButton, "icon" | "label" | "className" | "isHidden">>;

/**
 * Interface defining toolbar button properties and behavior.
 *
 * @remarks
 * Used internally to create toolbar buttons. Customize via {@link ToolbarButtonConfig}.
 *
 * @public
 */
export interface ToolbarButton {
  /**
   * Unique identifier for the button.
   *
   * @public
   */
  id: string;
  /**
   * Path or data URL to the button icon image.
   *
   * @public
   */
  icon: string;
  /**
   * Text label displayed below the button icon.
   *
   * @public
   */
  label: string;
  /**
   * Click handler function invoked when the button is clicked.
   *
   * @remarks
   * This handler can be synchronous or asynchronous. When provided through {@link ToolbarButtonConfig}, it overrides the button's default behavior.
   *
   * @public
   */
  onClick?: () => void | Promise<void>;
  /**
   * Additional CSS class name to apply to the button element.
   *
   * @public
   */
  className?: string;
  /**
   * Flag indicating whether the button is disabled (non-interactive).
   *
   * @defaultValue false
   *
   * @public
   */
  isDisabled?: boolean;
  /**
   * Flag indicating whether the button is hidden from the toolbar.
   *
   * @defaultValue false
   *
   * @public
   */
  isHidden?: boolean;
}

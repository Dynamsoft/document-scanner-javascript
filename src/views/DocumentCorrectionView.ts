import { 
  EnumCapturedResultItemType, 
  Point, 
  Quadrilateral,
  DrawingLayer, 
  DrawingStyleManager, 
  ImageEditorView, 
  QuadDrawingItem,
  DetectedQuadResultItem,
  DeskewedImageResultItem
} from "dynamsoft-capture-vision-bundle";
import { SharedResources } from "../DocumentScanner";
import { createControls, createStyle, getElement } from "./utils";
import { DDS_ICONS } from "./utils/icons";
import {
  ToolbarButtonConfig,
  DEFAULT_TEMPLATE_NAMES,
  DocumentResult,
  EnumResultStatus,
  UtilizedTemplateNames,
  ToolbarButton,
  EnumFlowType,
} from "./utils/types";
import DocumentScannerView from "./DocumentScannerView";

/**
 * Configuration interface for customizing toolbar buttons in the {@link DocumentCorrectionView}.
 *
 * @remarks
 * This interface allows you to customize the appearance and behavior of the toolbar buttons displayed in the {@link DocumentCorrectionView}. Each button can be configured using a {@link ToolbarButtonConfig} object to modify its icon, label, CSS class, or visibility.
 *
 * The behaviors described for each button below are the default behaviors. You can override the default behavior by providing a custom {@link ToolbarButton.onClick} handler through the {@link ToolbarButtonConfig}.
 *
 * @example
 * Customize button appearance:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     correctionViewConfig: {
 *         toolbarButtonsConfig: {
 *             fullImage: {
 *                 isHidden: true
 *             },
 *             detectBorders: {
 *                 icon: "path/to/new_icon.png",
 *                 label: "Custom Label"
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @example
 * Override button behavior with custom onClick handler:
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE",
 *     correctionViewConfig: {
 *         toolbarButtonsConfig: {
 *             apply: {
 *                 label: "Confirm",
 *                 onClick: async () => {
 *                     // Custom confirmation logic
 *                     await validateBoundaries();
 *                     console.log("Boundaries confirmed!");
 *                 }
 *             }
 *         }
 *     }
 * });
 * ```
 *
 * @public
 */
export interface DocumentCorrectionViewToolbarButtonsConfig {
  /**
   * Configuration for the retake button. Default behavior: returns to the {@link DocumentScannerView} to capture a new image.
   *
   * @public
   */
  retake?: ToolbarButtonConfig;
  /**
   * Configuration for the full image button. Default behavior: sets the document boundaries to match the full image dimensions.
   *
   * @public
   */
  fullImage?: ToolbarButtonConfig;
  /**
   * Configuration for the detect borders button. Default behavior: automatically detects document boundaries using the document detection algorithm.
   *
   * @public
   */
  detectBorders?: ToolbarButtonConfig;
  /**
   * Configuration for the apply button. Default behavior: applies the current boundary adjustments and proceeds with the workflow.
   *
   * @remarks
   * In continuous scanning mode ({@link DocumentScannerConfig.enableContinuousScanning}) when {@link DocumentResultView} is disabled, this button is labeled "Keep Scan" by default and returns to the {@link DocumentScannerView} for the next scan. Otherwise, it is labeled "Apply" when {@link DocumentResultView} is shown, or labeled "Done" otherwise.
   *
   * @public
   */
  apply?: ToolbarButtonConfig;
}

/**
 * The `DocumentCorrectionViewConfig` interface passes settings to the {@link DocumentScanner} constructor through the {@link DocumentScannerConfig} to apply UI and business logic customizations for the {@link DocumentCorrectionView}.
 *
 * @remarks
 * Only rare and edge-case scenarios require editing MDS source code. MDS uses sensible default values for all omitted properties.
 * 
 * @example
 * ```javascript
 * const documentScanner = new Dynamsoft.DocumentScanner({
 *     license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
 *     correctionViewConfig: {
 *         onFinish: (result) => {
 *             const canvas = result.correctedImageResult.toCanvas();
 *             resultContainer.appendChild(canvas);
 *         }
 *     }
 * });
 * ```
 * 
 * @public
 */
export interface DocumentCorrectionViewConfig {
  /**
   * The HTML container element or selector for the {@link DocumentCorrectionView} UI.
   * 
   * @public
   */
  container?: HTMLElement | string;
  /**
   * Configure the appearance and labels of the buttons for the {@link DocumentCorrectionView} UI.
   *
   * @see {@link DocumentCorrectionViewToolbarButtonsConfig}
   *
   * @public
   */
  toolbarButtonsConfig?: DocumentCorrectionViewToolbarButtonsConfig;
  /**
   * Path to the Capture Vision template file for scanning configuration.
   *
   * @remarks
   * This typically does not need to be set as MDS provides a default template for general use. You may set custom paths to self-host resources or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
   * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV templates}
   *
   * @defaultValue {@link DEFAULT_DCE_UI_PATH}
   *
   * @public
   */
  templateFilePath?: string;
  /**
   * Capture Vision template names for document detection and normalization.
   *
   * @remarks
   * This typically does not need to be set as MDS provides a default template for general use. You may set custom names to self-host resources or fully self-host MDS.
   * @see {@link https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html#self-host-resources | Self-hosting resources}
   * @see {@link https://www.dynamsoft.com/capture-vision/docs/core/parameters/file/capture-vision-template.html?lang=javascript | DCV templates}
   *
   * @defaultValue {@link DEFAULT_TEMPLATE_NAMES}
   *
   * @public
   */
  utilizedTemplateNames?: UtilizedTemplateNames;
  /**
   * Handler called when the user clicks the "Apply" button.
   *
   * @param result - The {@link DocumentResult} of the scan, including the original image, corrected image, detected boundaries, and scan status
   *
   * @public
   */
  onFinish?: (result: DocumentResult) => void;
  /**
   * @privateRemarks
   * Changes the label of the "Apply" button to "Done" if the {@link DocumentResultView} is not configured.
   * 
   * @internal
   */
  _showResultView?: boolean;
}

export default class DocumentCorrectionView {
  private imageEditorView: ImageEditorView = null;
  private layer: DrawingLayer = null;
  private currentCorrectionResolver?: (result: DocumentResult) => void;

  constructor(
    private resources: SharedResources,
    private config: DocumentCorrectionViewConfig,
    private scannerView: DocumentScannerView
  ) {
    this.config.utilizedTemplateNames = {
      detect: config.utilizedTemplateNames?.detect || DEFAULT_TEMPLATE_NAMES.detect,
      normalize: config.utilizedTemplateNames?.normalize || DEFAULT_TEMPLATE_NAMES.normalize,
    };
  }

  async initialize(): Promise<void> {
    if (!this.resources.result) {
      throw Error("Captured image is missing. Please capture an image first!");
    }

    if (!this.config.container) {
      throw new Error("Please create an Correction View Container element");
    }

    createStyle("dds-correction-view-style", DEFAULT_CORRECTION_VIEW_CSS);

    // Create a wrapper div that preserves container dimensions
    const correctionViewWrapper = document.createElement("div");
    correctionViewWrapper.className = "dds-correction-view-container";

    // Add image editor view from DCE to correct documents
    const imageEditorViewElement = document.createElement("div");
    Object.assign(imageEditorViewElement.style, {
      width: "100%",
      height: "100%",
    });

    correctionViewWrapper.appendChild(imageEditorViewElement);
    getElement(this.config.container).appendChild(correctionViewWrapper);

    this.imageEditorView = await ImageEditorView.createInstance(imageEditorViewElement);
    this.layer = this.imageEditorView.createDrawingLayer();
    this.imageEditorView.setOriginalImage(this.resources.result.originalImageResult);

    this.setupDrawingLayerStyle(); // Set style for drawing layer
    this.setupInitialDetectedQuad();
    this.setupCorrectionControls();
    this.setupQuadConstraints();

    // Hide retake button on flow.STATIC_FILE
    if (this.resources.result._flowType === EnumFlowType.STATIC_FILE) {
      const retakeBtn = document.querySelector("#dds-correction-retake") as HTMLElement;
      retakeBtn.style.display = "none";
    }
  }

  /**
   * Configure the visual appearance of the drawing layer used to display and manipulate document boundaries.
   *
   * @remarks
   * Sets 5px orange (#FE8E14) stroke, transparent fill. Called by {@link initialize}.
   *
   * @internal
   */
  private setupDrawingLayerStyle() {
    const styleID = DrawingStyleManager.createDrawingStyle({
      lineWidth: 5,
      fillStyle: "transparent",
      strokeStyle: "#FE8E14",
      paintMode: "stroke",
    });

    this.layer.setDefaultStyle(styleID);
  }

  /**
   * Set up boundary constraints and cursor behavior for the document boundary quadrilateral.
   *
   * @remarks
   * Constrains corner points to canvas bounds during drag operations. Called by {@link initialize}.
   *
   * @internal
   */
  private setupQuadConstraints() {
    const canvas = this.layer.fabricCanvas;

    canvas.defaultCursor = "default";
    canvas.hoverCursor = "default";
    canvas.moveCursor = "default";

    canvas.on("object:scaling", (e: any) => {
      const obj = e.target;
      const points = obj.points;
      const bounds = this.getCanvasBounds();

      // Constrain scaling to canvas bounds
      points.forEach((point: Point) => {
        point.x = Math.max(0, Math.min(bounds.width, point.x));
        point.y = Math.max(0, Math.min(bounds.height, point.y));
      });

      obj.set({
        points: points,
        dirty: true,
      });
      canvas.renderAll();
    });

    canvas.on("object:modified", (e: any) => {
      const obj = e.target;
      if (!obj) return;

      const points = obj.points;
      const bounds = this.getCanvasBounds();

      // Ensure all points stay within bounds
      let needsConstraint = false;
      points.forEach((point: Point) => {
        if (point.x < 0 || point.x > bounds.width || point.y < 0 || point.y > bounds.height) {
          needsConstraint = true;
        }
      });

      if (needsConstraint) {
        points.forEach((point: Point) => {
          point.x = Math.max(0, Math.min(bounds.width, point.x));
          point.y = Math.max(0, Math.min(bounds.height, point.y));
        });

        obj.set({
          points: points,
          dirty: true,
        });
        canvas.renderAll();
      }
    });
  }

  /**
   * Retrieve the dimensions of the canvas used for rendering the document image and boundary overlay.
   *
   * @returns Canvas width and height in pixels
   *
   * @internal
   */
  private getCanvasBounds() {
    const canvas = this.layer.fabricCanvas;
    return {
      width: canvas.getWidth(),
      height: canvas.getHeight(),
    };
  }

  /**
   * Add a quadrilateral boundary to the drawing layer for user manipulation.
   *
   * @param newQuad - The {@link QuadDrawingItem} representing the document boundary to display
   *
   * @remarks
   * This method configures and adds a quadrilateral boundary overlay to the {@link DrawingLayer},
   * allowing users to manually adjust document boundaries by dragging corner points. The process:
   * 
   * 1. Clears any existing quadrilaterals from the layer
   * 2. Retrieves the Fabric.js object from the {@link QuadDrawingItem}
   * 3. Calculates corner control size as 10% of the smaller image dimension for touch-friendly interaction
   * 4. Locks the quadrilateral position (prevents dragging the entire shape)
   * 5. Configures corner controls to be draggable for boundary adjustment
   * 6. Sets up visual feedback: corners become transparent during drag, orange (#FE8E14) when released
   * 7. Adds the quadrilateral to the layer and makes it the active selection
   * 
   * The quadrilateral corners can be manipulated by the user, but the constraints set up by
   * {@link setupQuadConstraints} ensure corners remain within the image bounds.
   * 
   * Called by {@link setupInitialDetectedQuad}, {@link setFullImageBoundary}, and {@link setBoundaryAutomatically}
   * whenever the document boundary needs to be updated or reset.
   *
   * @see {@link QuadDrawingItem} - The drawing item type for quadrilateral boundaries
   * @see {@link DrawingLayer} - The layer where the quadrilateral is rendered
   * @see {@link setupQuadConstraints} - Ensures corner points stay within valid bounds
   * @see {@link setupDrawingLayerStyle} - Configures the visual appearance of the quadrilateral
   *
   * @internal
   */
  private addQuadToLayer(newQuad: QuadDrawingItem) {
    this.layer.clearDrawingItems();

    const fabricObject = newQuad._getFabricObject();

    const cornerSize =
      Math.min(this.resources.result.originalImageResult?.width, this.resources.result.originalImageResult?.height) *
      0.1;

    fabricObject.cornerSize = cornerSize;

    // Make quad non-draggable but keep corner controls
    fabricObject.lockMovementX = true;
    fabricObject.lockMovementY = true;

    // Make circle transparent to show corner on drag
    fabricObject.on("mousedown", function (e: any) {
      if (e.target?.controls) {
        this.cornerColor = "transparent";
        this.dirty = true;
        this.canvas?.renderAll();
      }
    });

    fabricObject.on("mouseup", function () {
      this.cornerColor = "#FE8E14";
      this.dirty = true;
      this.canvas?.renderAll();
    });

    this.layer.renderAll();
    this.layer.addDrawingItems([newQuad]);

    // Select the quad immediately after adding it
    this.layer.fabricCanvas.setActiveObject(fabricObject);
    this.layer.fabricCanvas.renderAll();
  }

  /**
   * Display the initial document boundary quadrilateral on the correction view.
   *
   * @remarks
   * This method sets up the initial document boundary overlay based on the scan result from
   * {@link DocumentScannerView}. It follows this logic:
   * 
   * 1. If {@link DocumentResult.detectedQuadrilateral} exists (from automatic document detection),
   *    creates a {@link QuadDrawingItem} from the detected boundaries
   * 2. If no quadrilateral was detected, creates a default quadrilateral matching the full image
   *    dimensions, with corners at (0,0), (width,0), (width,height), and (0,height)
   * 
   * The created quadrilateral is then added to the {@link DrawingLayer} via {@link addQuadToLayer},
   * where users can manually adjust the corner points to refine the document boundaries before
   * perspective correction is applied.
   * 
   * This fallback to full image bounds ensures users always have a starting point for boundary
   * adjustment, even when automatic detection fails or is disabled.
   * 
   * Called internally by {@link initialize} during view setup, after the {@link ImageEditorView}
   * and {@link DrawingLayer} have been configured.
   *
   * @see {@link DocumentResult} - Contains the detected quadrilateral from document scanning
   * @see {@link QuadDrawingItem} - The drawing item type for quadrilateral boundaries
   * @see {@link addQuadToLayer} - Adds the quadrilateral to the drawing layer
   * @see {@link SharedResources.result} - The current scan result
   *
   * @internal
   */
  private setupInitialDetectedQuad() {
    let quad: QuadDrawingItem;
    // Draw the detected quadrilateral
    if (this.resources.result.detectedQuadrilateral) {
      quad = new QuadDrawingItem(this.resources.result.detectedQuadrilateral);
    } else {
      // If no quad detected, draw full image quad
      const { width, height } = this.resources.result.originalImageResult;
      quad = new QuadDrawingItem({
        points: [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ],
        area: width * height,
      } as Quadrilateral);
    }

    this.addQuadToLayer(quad);
  }

  /**
   * Create the toolbar control buttons for the correction view.
   *
   * @returns The HTML element containing all toolbar buttons
   *
   * @remarks
   * This method builds the correction view toolbar with four action buttons, each configurable
   * through {@link DocumentCorrectionViewToolbarButtonsConfig}:
   * 
   * 1. **Retake Button**: Returns to {@link DocumentScannerView} to capture a new image
   *    - Default icon: {@link DDS_ICONS.retake}
   *    - Default label: "Re-take"
   *    - Handler: {@link handleRetake}
   *    - Disabled when no scanner view is available
   * 
   * 2. **Full Image Button**: Sets document boundaries to match the full image dimensions
   *    - Default icon: {@link DDS_ICONS.fullImage}
   *    - Default label: "Full Image"
   *    - Handler: {@link setFullImageBoundary}
   * 
   * 3. **Detect Borders Button**: Automatically detects document boundaries using DDN
   *    - Default icon: {@link DDS_ICONS.autoBounds}
   *    - Default label: "Detect Borders"
   *    - Handler: {@link setBoundaryAutomatically}
   * 
   * 4. **Apply Button**: Confirms boundary adjustments and proceeds with the workflow
   *    - Default icon: {@link DDS_ICONS.finish} (or {@link DDS_ICONS.complete} if no result view)
   *    - Default label: Context-dependent ("Apply", "Done", or "Keep Scan")
   *    - Handler: {@link confirmCorrection}
   * 
   * Each button's appearance and behavior can be customized through {@link ToolbarButtonConfig}.
   * The buttons are passed to the {@link createControls} utility function which generates the HTML.
   * 
   * Called internally by {@link setupCorrectionControls} during view initialization.
   *
   * @see {@link DocumentCorrectionViewToolbarButtonsConfig} - Configuration interface for button customization
   * @see {@link ToolbarButton} - Button definition interface
   * @see {@link createControls} - Utility function that generates the toolbar HTML
   * @see {@link setupCorrectionControls} - Adds the created controls to the view container
   *
   * @internal
   */
  private createControls(): HTMLElement {
    const { toolbarButtonsConfig } = this.config;

    const buttons: ToolbarButton[] = [
      {
        id: `dds-correction-retake`,
        icon: toolbarButtonsConfig?.retake?.icon || DDS_ICONS.retake,
        label: toolbarButtonsConfig?.retake?.label || "Re-take",
        onClick: () => this.handleRetake(),
        className: `${toolbarButtonsConfig?.retake?.className || ""}`,
        isHidden: toolbarButtonsConfig?.retake?.isHidden || false,
        isDisabled: !this.scannerView,
      },
      {
        id: `dds-correction-fullImage`,
        icon: toolbarButtonsConfig?.fullImage?.icon || DDS_ICONS.fullImage,
        label: toolbarButtonsConfig?.fullImage?.label || "Full Image",
        className: `${toolbarButtonsConfig?.fullImage?.className || ""}`,
        isHidden: toolbarButtonsConfig?.fullImage?.isHidden || false,
        onClick: () => this.setFullImageBoundary(),
      },
      {
        id: `dds-correction-detectBorders`,
        icon: toolbarButtonsConfig?.detectBorders?.icon || DDS_ICONS.autoBounds,
        label: toolbarButtonsConfig?.detectBorders?.label || "Detect Borders",
        className: `${toolbarButtonsConfig?.detectBorders?.className || ""}`,
        isHidden: toolbarButtonsConfig?.detectBorders?.isHidden || false,
        onClick: () => this.setBoundaryAutomatically(),
      },
      {
        id: `dds-correction-apply`,
        icon:
          toolbarButtonsConfig?.apply?.icon ||
          (this.config?._showResultView === false ? DDS_ICONS.complete : DDS_ICONS.finish),
        label: toolbarButtonsConfig?.apply?.label || (
          this.resources.enableContinuousScanning && this.config?._showResultView === false
            ? "Keep Scan"
            : (this.config?._showResultView === false ? "Done" : "Apply")
        ),
        className: `${toolbarButtonsConfig?.apply?.className || ""}`,
        isHidden: toolbarButtonsConfig?.apply?.isHidden || false,

        onClick: () => this.confirmCorrection(),
      },
    ];

    return createControls(buttons);
  }

  /**
   * Add the correction toolbar controls to the view container.
   *
   * @throws {Error} If control setup fails
   *
   * @internal
   */
  private setupCorrectionControls() {
    try {
      const controlContainer = this.createControls();
      const wrapper = getElement(this.config.container).firstElementChild as HTMLElement;
      if (wrapper) {
        wrapper.appendChild(controlContainer);
      }
    } catch (error) {
      console.error("Error setting up correction controls:", error);
      throw new Error(`Failed to setup correction controls: ${error?.message || error}`);
    }
  }

  /**
   * Handle the retake button action to return to camera capture for a new scan.
   *
   * @throws {Error} If an error occurs during the retake workflow
   *
   * @remarks
   * This method implements the retake workflow, allowing users to discard the current image
   * and capture a new one using the {@link DocumentScannerView}. The process:
   * 
   * 1. Validates that {@link DocumentScannerView} is available (required for camera capture)
   * 2. Hides the current correction view via {@link hideView}
   * 3. Shows the scanner view container and launches camera capture via {@link DocumentScannerView.launch}
   * 4. Handles the scan result:
   *    - **Cancelled/Failed**: Resolves the correction promise with the failed status and exits
   *    - **Success**: Updates {@link SharedResources.result}, stops capture, hides scanner view,
   *      reinitializes the correction view with new image data, and shows the refreshed correction view
   * 
   * The method preserves the {@link currentCorrectionResolver} during reinitialization (via
   * {@link dispose} with `preserveResolver: true`) to ensure the correction workflow promise
   * chain remains intact.
   * 
   * If any error occurs during the workflow, the promise is resolved with {@link EnumResultStatus.RS_FAILED}
   * status before re-throwing the error.
   * 
   * Triggered by clicking the retake button created in {@link createControls}.
   *
   * @see {@link DocumentScannerView} - Handles camera capture for new scans
   * @see {@link SharedResources.result} - Updated with the new scan result
   * @see {@link hideView} - Hides the correction view
   * @see {@link initialize} - Reinitializes the view with new image data
   * @see {@link dispose} - Cleans up before reinitialization
   *
   * @internal
   */
  private async handleRetake() {
    try {
      if (!this.scannerView) {
        console.error("Scanner View not initialized");
        return;
      }

      this.hideView();

      // Show scanner view
      if (this.scannerView) {
        getElement((this.scannerView as any).config.container).style.display = "flex";
      }

      // Wait for new scan
      const result = await this.scannerView.launch();

      // Handle cancelled or failed results - resolve and exit
      if (result?.status?.code === EnumResultStatus.RS_CANCELLED || result?.status?.code === EnumResultStatus.RS_FAILED) {
        this.currentCorrectionResolver?.(result);
        return;
      }

      // Handle success case - update resources and re-enter correction flow
      if (result?.status.code === EnumResultStatus.RS_SUCCESS) {
        this.resources.onResultUpdated?.(result);

        // Stop capturing before hiding scanner view
        this.scannerView?.stopCapturing();

        // Hide scanner view
        if (this.scannerView) {
          getElement((this.scannerView as any).config.container).style.display = "none";
        }

        // Refresh the correction view with new data
        this.dispose(true); // preserve resolver
        await this.initialize();
        getElement(this.config.container).style.display = "flex";
      }
    } catch (error) {
      console.error("Error in retake handler:", error);
      // Make sure to resolve with error if something goes wrong
      this.currentCorrectionResolver?.({
        status: {
          code: EnumResultStatus.RS_FAILED,
          message: error?.message || error,
        },
      });
      throw error;
    }
  }

  /**
   * Reset the document boundary to match the full image dimensions.
   *
   * @throws {Error} If no captured image is available in {@link SharedResources.result}
   *
   * @remarks
   * This method creates a quadrilateral boundary that encompasses the entire image, effectively
   * disabling perspective correction. The quadrilateral corners are positioned at:
   * - Top-left: (0, 0)
   * - Top-right: (width, 0)
   * - Bottom-right: (width, height)
   * - Bottom-left: (0, height)
   * 
   * This is useful when:
   * - The document occupies the entire image with no background visible
   * - Automatic boundary detection failed or detected incorrect boundaries
   * - Users want to skip perspective correction and use the original image dimensions
   * 
   * The created quadrilateral is added to the {@link DrawingLayer} via {@link addQuadToLayer},
   * replacing any existing boundary. Users can still manually adjust the corners after reset.
   * 
   * Triggered by clicking the "Full Image" button created in {@link createControls}.
   *
   * @see {@link SharedResources.result} - Contains the original image dimensions
   * @see {@link QuadDrawingItem} - The quadrilateral type added to the drawing layer
   * @see {@link addQuadToLayer} - Adds the full-image quadrilateral to the layer
   * @see {@link setBoundaryAutomatically} - Alternative method for automatic boundary detection
   *
   * @public
   */
  setFullImageBoundary() {
    if (!this.resources.result) {
      throw Error("Captured image is missing. Please capture an image first!");
    }

    // Reset quad to full image
    const { width, height } = this.resources.result.originalImageResult;
    const fullQuad = new QuadDrawingItem({
      points: [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ],
      area: width * height,
    } as Quadrilateral);

    this.addQuadToLayer(fullQuad);
  }

  /**
   * Automatically detect document boundaries using Dynamsoft Document Normalizer (DDN).
   *
   * @remarks
   * This method re-runs document boundary detection on the current image using the
   * {@link CaptureVisionRouter} and DDN (Dynamsoft Document Normalizer) engine. The process:
   * 
   * 1. Initializes settings from {@link DocumentCorrectionViewConfig.templateFilePath} if provided
   * 2. Retrieves the detection template settings via {@link DocumentCorrectionViewConfig.utilizedTemplateNames}
   * 3. Configures the router to:
   *    - Output the original image for further processing
   *    - Process images at full resolution (no downscaling via `maxImageSideLength = Infinity`)
   * 4. Captures and analyzes the image to detect document boundaries
   * 5. Handles the detection result:
   *    - **Boundary detected**: Creates a {@link QuadDrawingItem} from the detected {@link Quadrilateral}
   *      and adds it to the layer via {@link addQuadToLayer}
   *    - **No boundary detected**: Falls back to {@link setFullImageBoundary} to use full image dimensions
   * 
   * This allows users to retry automatic detection if:
   * - Manual adjustments were made but proved unsatisfactory
   * - Initial detection failed due to lighting or positioning issues that were later corrected
   * - The image was uploaded without initial detection
   * 
   * Triggered by clicking the "Detect Borders" button created in {@link createControls}.
   *
   * @see {@link CaptureVisionRouter} - Processes the image for boundary detection
   * @see {@link DetectedQuadResultItem} - Contains the detected document boundaries
   * @see {@link addQuadToLayer} - Adds the detected quadrilateral to the drawing layer
   * @see {@link setFullImageBoundary} - Fallback when no boundaries are detected
   * @see {@link SharedResources.cvRouter} - The router instance used for detection
   *
   * @public
   */
  async setBoundaryAutomatically() {
    // Auto detect bounds
    if (this.config.templateFilePath) {
      await this.resources.cvRouter.initSettings(this.config.templateFilePath);
    }

    let newSettings = await this.resources.cvRouter.getSimplifiedSettings(this.config.utilizedTemplateNames.detect);
    newSettings.outputOriginalImage = true;
    await this.resources.cvRouter.updateSettings(this.config.utilizedTemplateNames.detect, newSettings);

    this.resources.cvRouter.maxImageSideLength = Infinity;

    const result = await this.resources.cvRouter.capture(
      this.resources.result.originalImageResult,
      "DetectDocumentBoundaries_Default"
    );

    const quad = (
      result.items.find((item) => item.type === EnumCapturedResultItemType.CRIT_DETECTED_QUAD) as DetectedQuadResultItem
    )?.location;

    if (quad) {
      this.addQuadToLayer(new QuadDrawingItem(quad));
    } else {
      this.setFullImageBoundary();
    }
  }

  /**
   * Confirm the boundary adjustments and apply perspective correction to the image.
   *
   * @throws {Error} If no quadrilateral boundary is found on the drawing layer
   *
   * @remarks
   * Retrieves boundary, performs correction via {@link correctImage}, updates result, invokes callback, resolves promise.
   *
   * @public
   */
  async confirmCorrection() {
    const drawingItem = this.layer.getDrawingItems()[0] as QuadDrawingItem;
    if (!drawingItem) {
      throw new Error("No quad drawing item found");
    }
    const quad = drawingItem.getQuad();
    const correctedImg = await this.correctImage(quad?.points);
    if (correctedImg) {
      const updatedResult = {
        ...this.resources.result,
        correctedImageResult: correctedImg,
        detectedQuadrilateral: quad,
      };

      // Update the result with new corrected image and quad
      this.resources.onResultUpdated?.(updatedResult);

      // Call onFinish callback if provided
      this.config?.onFinish?.(updatedResult);

      // Resolve the promise with corrected image
      this.currentCorrectionResolver?.(updatedResult);
    } else {
      this.currentCorrectionResolver?.(this.resources.result);
    }

    // Clean up and hide
    this.dispose();
    this.hideView();
  }

  async launch(): Promise<DocumentResult> {
    try {
      if (!this.resources.result?.correctedImageResult) {
        return {
          status: {
            code: EnumResultStatus.RS_FAILED,
            message: "No image available for correction",
          },
        };
      }

      getElement(this.config.container).textContent = "";
      await this.initialize();
      getElement(this.config.container).style.display = "flex";

      // Return promise that resolves when user clicks finish
      return new Promise((resolve) => {
        this.currentCorrectionResolver = resolve;
      });
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      if (!this.resources.result?.correctedImageResult) {
        return {
          status: {
            code: EnumResultStatus.RS_FAILED,
            message: errMsg,
          },
        };
      }
    }
  }

  /**
   * Hide the correction view by setting its container display to "none".
   *
   * @remarks
   * Sets container display to "none" without disposing resources.
   *
   * @public
   */
  hideView(): void {
    getElement(this.config.container).style.display = "none";
  }

  /**
   * Apply perspective correction to the document image using Dynamsoft Document Normalizer (DDN).
   *
   * @param points - The quadrilateral corner points defining the document boundary
   * @returns The perspective-corrected (deskewed) image, or undefined if correction fails
   *
   * @remarks
   * Configures ROI with quadrilateral points, processes image with normalization template.
   *
   * @public
   */
  async correctImage(points: Quadrilateral["points"]): Promise<DeskewedImageResultItem> {
    const { cvRouter } = this.resources;

    if (this.config.templateFilePath) {
      await this.resources.cvRouter.initSettings(this.config.templateFilePath);
    }

    const settings = await cvRouter.getSimplifiedSettings(this.config.utilizedTemplateNames.normalize);
    settings.roiMeasuredInPercentage = false;
    settings.roi.points = points;
    await cvRouter.updateSettings(this.config.utilizedTemplateNames.normalize, settings);

    const result = await cvRouter.capture(
      this.resources.result.originalImageResult,
      this.config.utilizedTemplateNames.normalize
    );

    // If deskewed result found by DDN
    if (result?.processedDocumentResult?.deskewedImageResultItems?.[0]) {
      return result.processedDocumentResult.deskewedImageResultItems[0];
    }
  }

  /**
   * Clean up and release resources.
   *
   * @param preserveResolver - Whether to preserve the {@link currentCorrectionResolver} promise resolver
   *
   * @remarks
   * Disposes {@link ImageEditorView}, clears layer and container. Optionally preserves resolver for {@link handleRetake}.
   *
   * @public
   */
  dispose(preserveResolver: boolean = false): void {
    // Clean up resources
    this.imageEditorView?.dispose?.();
    this.layer = null;

    // Clean up the container
    if (this.config?.container) {
      getElement(this.config.container).textContent = "";
    }

    // Clear resolver only if not preserving
    if (!preserveResolver) {
      this.currentCorrectionResolver = undefined;
    }
  }
}

const DEFAULT_CORRECTION_VIEW_CSS = `
  .dds-correction-view-container {
    display: flex;
    width: 100%;
    height: 100%;
    background-color:#575757;
    font-size: 12px;
    flex-direction: column;
    align-items: center;
  }

  @media (orientation: landscape) and (max-width: 1024px) {
    .dds-correction-view-container {
      flex-direction: row;
    }
  }
`;

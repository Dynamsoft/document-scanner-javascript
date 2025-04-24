import { EnumCapturedResultItemType, Point, Quadrilateral } from "dynamsoft-core";
import { DrawingLayer, DrawingStyleManager, ImageEditorView, QuadDrawingItem } from "dynamsoft-camera-enhancer";
import { DetectedQuadResultItem, NormalizedImageResultItem } from "dynamsoft-document-normalizer";
import { SharedResources } from "../DocumentScanner";
import { createControls, createStyle, getElement, shouldCorrectImage } from "./utils";
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
import DocumentResultView from "./DocumentResultView";

const DEFAULT_CORNER_SIZE = 60;

export interface DocumentCorrectionViewToolbarButtonsConfig {
  retake?: ToolbarButtonConfig;
  fullImage?: ToolbarButtonConfig;
  detectBorders?: ToolbarButtonConfig;
  apply?: ToolbarButtonConfig;
}

export interface DocumentCorrectionViewConfig {
  container?: HTMLElement | string;
  toolbarButtonsConfig?: DocumentCorrectionViewToolbarButtonsConfig;
  templateFilePath?: string;
  utilizedTemplateNames?: UtilizedTemplateNames;
  onFinish?: (result: DocumentResult) => void;

  _showResultView?: boolean; // Internal use, to change Apply -> Done if result view is not configured
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

  private setupDrawingLayerStyle() {
    const styleID = DrawingStyleManager.createDrawingStyle({
      lineWidth: 5,
      fillStyle: "transparent",
      strokeStyle: "#FE8E14",
      paintMode: "stroke",
    });

    this.layer.setDefaultStyle(styleID);
  }

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

  private getCanvasBounds() {
    const canvas = this.layer.fabricCanvas;
    return {
      width: canvas.getWidth(),
      height: canvas.getHeight(),
    };
  }

  private addQuadToLayer(newQuad: QuadDrawingItem) {
    this.layer.clearDrawingItems();

    const fabricObject = newQuad._getFabricObject();
    fabricObject.cornerSize = DEFAULT_CORNER_SIZE;

    // Make quad non-draggable but keep corner controls
    fabricObject.lockMovementX = true;
    fabricObject.lockMovementY = true;

    // Make circle transparent to show corner on drag
    fabricObject.on("mousedown", function (e: any) {
      if (e.target && e.target.controls) {
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
        label: toolbarButtonsConfig?.apply?.label || (this.config?._showResultView === false ? "Done" : "Apply"),
        className: `${toolbarButtonsConfig?.apply?.className || ""}`,
        isHidden: toolbarButtonsConfig?.apply?.isHidden || false,

        onClick: () => this.confirmCorrection(),
      },
    ];

    return createControls(buttons);
  }

  private setupCorrectionControls() {
    try {
      const controlContainer = this.createControls();
      const wrapper = getElement(this.config.container).firstElementChild as HTMLElement;
      if (wrapper) {
        wrapper.appendChild(controlContainer);
      }
    } catch (error) {
      console.error("Error setting up correction controls:", error);
      throw new Error(`Failed to setup correction controls: ${error.message}`);
    }
  }

  private async handleRetake() {
    try {
      if (!this.scannerView) {
        console.error("Correction View not initialized");
        return;
      }

      this.hideView();
      const result = await this.scannerView.launch();

      if (result?.status?.code === EnumResultStatus.RS_FAILED) {
        if (this.currentCorrectionResolver) {
          this.currentCorrectionResolver(result);
        }
        return;
      }

      // Handle success case
      if (this.resources.onResultUpdated) {
        if (result?.status.code === EnumResultStatus.RS_CANCELLED) {
          this.resources.onResultUpdated(this.resources.result);
        } else if (result?.status.code === EnumResultStatus.RS_SUCCESS) {
          this.resources.onResultUpdated(result);
        }
      }

      this.dispose(true);
      await this.initialize();
      getElement(this.config.container).style.display = "flex";
    } catch (error) {
      console.error("Error in retake handler:", error);
      // Make sure to resolve with error if something goes wrong
      if (this.currentCorrectionResolver) {
        this.currentCorrectionResolver({
          status: {
            code: EnumResultStatus.RS_FAILED,
            message: error?.message || error,
          },
        });
      }
      throw error;
    }
  }

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

  async setBoundaryAutomatically() {
    // Auto detect bounds
    if (this.config.templateFilePath) {
      await this.resources.cvRouter.initSettings(this.config.templateFilePath);
    }

    let newSettings = await this.resources.cvRouter.getSimplifiedSettings(this.config.utilizedTemplateNames.detect);
    newSettings.capturedResultItemTypes |= EnumCapturedResultItemType.CRIT_ORIGINAL_IMAGE;
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

      if (this.resources.onResultUpdated) {
        // Update the result with new corrected image and quad
        this.resources.onResultUpdated(updatedResult);
      }

      // Call onFinish callback if provided
      if (this.config?.onFinish) {
        this.config.onFinish(updatedResult);
      }

      // Resolve the promise with corrected image
      if (this.currentCorrectionResolver) {
        this.currentCorrectionResolver(updatedResult);
      }
    } else {
      if (this.currentCorrectionResolver) {
        this.currentCorrectionResolver(this.resources.result);
      }
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

  hideView(): void {
    getElement(this.config.container).style.display = "none";
  }

  /**
   * Normalize an image with DDN given a set of points
   * @param points - points provided by either users or DDN's detect quad
   * @returns normalized image by DDN
   */
  async correctImage(points: Quadrilateral["points"]): Promise<NormalizedImageResultItem> {
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

    // If normalized result found by DDN
    if (result?.normalizedImageResultItems?.[0]) {
      return result.normalizedImageResultItems[0];
    }
  }

  dispose(preserveResolver: boolean = false): void {
    // Clean up resources
    if (this.imageEditorView?.dispose) {
      this.imageEditorView.dispose();
    }
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

import { EnumCapturedResultItemType, Point, Quadrilateral } from "dynamsoft-core";
import { DrawingLayer, DrawingStyleManager, ImageEditorView, QuadDrawingItem } from "dynamsoft-camera-enhancer";
import { DetectedQuadResultItem, NormalizedImageResultItem } from "dynamsoft-document-normalizer";
import { SharedResources } from "../DocumentScanner";
import { bindControlButton } from "./utils";
import { MWC_ICONS } from "./utils/icons";
import { DocumentScanResult, EnumResultStatusCode, UtilizedTemplateNames } from "./utils/types";

const DEFAULT_CORNER_SIZE = 60;

export interface DocumentCorrectionViewControls {
  fullImageBtn?: HTMLElement | string;
  autoBoundsBtn?: HTMLElement | string;
  finishBtn?: HTMLElement | string;
  containerStyle?: Partial<CSSStyleDeclaration>; // Optional styling
}

export interface DocumentCorrectionViewConfig {
  container: HTMLElement;
  controls: DocumentCorrectionViewControls;
  utilizedTemplateNames: UtilizedTemplateNames;
  onFinish?: (result: DocumentScanResult) => void;
}

export default class DocumentCorrectionView {
  private imageEditorView: ImageEditorView = null;
  private layer: DrawingLayer = null;
  private controls: DocumentCorrectionViewControls;
  private currentCorrectionResolver?: (result: DocumentScanResult) => void;

  constructor(private resources: SharedResources, private config: DocumentCorrectionViewConfig) {}

  async initialize(): Promise<void> {
    if (!this.resources.result) {
      throw Error("Captured image is missing. Please capture an image first!");
    }

    if (!this.config.container) {
      throw new Error("Please create an Correction View Container element");
    }

    // Add basic styling to container
    Object.assign(this.config.container.style, {
      display: "flex",
      width: "100%",
      "background-color": "#575757",
      "font-size": "12px",
      "flex-direction": "column",
      "align-items": "center",
    });

    // Add image editor view from DCE to correct documents
    const imageEditorViewElement = document.createElement("div");
    Object.assign(imageEditorViewElement.style, {
      width: "100%",
      height: "100%",
    });

    this.config.container.appendChild(imageEditorViewElement);

    this.imageEditorView = await ImageEditorView.createInstance(imageEditorViewElement);
    this.layer = this.imageEditorView.createDrawingLayer();
    this.imageEditorView.setOriginalImage(this.resources.result.originalImageResult);

    this.setupDrawingLayerStyle(); // Set style for drawing layer
    this.setupInitialDetectedQuad();
    this.setupCorrectionControls();
    this.setupQuadConstraints();
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

  private createDefaultControls(): HTMLElement {
    // Create style
    const styleSheet = document.createElement("style");
    styleSheet.textContent = DEFAULT_CORRECTION_CONTROLS_STYLE;
    document.head.appendChild(styleSheet);

    const container = document.createElement("div");
    container.className = "mwc-document-correction-controls";
    container.innerHTML = `
      ${DEFAULT_CORRECTION_CONTROLS_HTML}
    `;
    return container;
  }

  private setupCorrectionControls() {
    const { container, controls } = this.config;

    try {
      if (!controls) {
        const controlContainer = this.createDefaultControls();
        // Apply custom styles if provided
        if (controls?.containerStyle) {
          Object.assign(controlContainer.style, controls.containerStyle);
        }

        // Append controls to container
        container.appendChild(controlContainer);

        // Ensure we have the expected children
        if (controlContainer.children.length < 3) {
          throw new Error("Default controls container missing required elements");
        }

        this.controls = {
          fullImageBtn: bindControlButton(controls?.fullImageBtn, controlContainer.children[0] as HTMLElement, () =>
            this.setFullImageBoundary()
          ),
          autoBoundsBtn: bindControlButton(controls?.autoBoundsBtn, controlContainer.children[1] as HTMLElement, () =>
            this.setBoundaryAutomatically()
          ),
          finishBtn: bindControlButton(controls?.finishBtn, controlContainer.children[2] as HTMLElement, async () =>
            this.confirmCorrection()
          ),
        };
      } else {
        // Verify all required custom buttons are provided
        if (!controls.fullImageBtn || !controls.autoBoundsBtn || !controls.finishBtn) {
          throw new Error("All custom buttons must be provided when not using default controls");
        }

        // Bind custom buttons
        this.controls = {
          fullImageBtn: bindControlButton(controls.fullImageBtn, null, () => this.setFullImageBoundary()),
          autoBoundsBtn: bindControlButton(controls.autoBoundsBtn, null, () => this.setBoundaryAutomatically()),
          finishBtn: bindControlButton(controls.finishBtn, null, async () => this.confirmCorrection()),
        };
      }
    } catch (error) {
      console.error("Error setting up correction view controls:", error);
      throw new Error(`Failed to setup correction view controls: ${error.message}`);
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
    const correctedImg = await this.normalizeImage(quad?.points);
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

  async launch(): Promise<DocumentScanResult> {
    try {
      if (!this.resources.result?.correctedImageResult) {
        return {
          status: {
            code: EnumResultStatusCode.FAILED,
            message: "No image available for correction",
          },
        };
      }

      this.config.container.textContent = "";
      await this.initialize();
      this.config.container.style.display = "flex";

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
            code: EnumResultStatusCode.FAILED,
            message: errMsg,
          },
        };
      }
    }
  }

  hideView(): void {
    this.config.container.style.display = "none";
  }

  /**
   * Normalize an image with DDN given a set of points
   * @param points - points provided by either users or DDN's detect quad
   * @returns normalized image by DDN
   */
  async normalizeImage(points: Quadrilateral["points"]): Promise<NormalizedImageResultItem> {
    const { cvRouter } = this.resources;
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

  dispose(): void {
    // Clean up resources
    this.imageEditorView?.dispose();
    this.layer = null;

    // Clean up the container
    this.config.container.textContent = "";

    // Clear resolver
    this.currentCorrectionResolver = undefined;
  }
}

const DEFAULT_CORRECTION_CONTROLS_STYLE = `
.mwc-document-correction-controls {
  display: flex;
  height: 8rem;
  background-color: #323234;
  align-items: center;
  font-size: 12px;
  font-family: Verdana;
  color: white;
  width: 100%;
}

.mwc-document-correction-control-btn {
  background-color: #323234;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  width: 100%;
  gap: 0.5rem;
  text-align: center;
  user-select: none;
}

.mwc-document-correction-control-btn div:last-child {
  padding-bottom: 0.5rem;
}

.mwc-document-correction-control-btn.finish {
  background-color: #000000;
  color: #fe8e14;
}

.mwc-document-correction-control-icon svg {
  padding-top: 0.5rem;
  width: 32px;
  height: 32px;
}
`;

const DEFAULT_CORRECTION_CONTROLS_HTML = `
  <div class="mwc-document-correction-control-btn">
    <div class="mwc-document-correction-control-icon">${MWC_ICONS.fullImage}</div>
    <div>Full Image</div>
  </div>
  <div class="mwc-document-correction-control-btn">
    <div class="mwc-document-correction-control-icon">${MWC_ICONS.autoBounds}</div>
    <div>Auto Bounds Detection</div>
  </div>
  <div class="mwc-document-correction-control-btn finish">
    <div class="mwc-document-correction-control-icon">${MWC_ICONS.finish}</div>
    <div>Finish</div>
  </div>
`;

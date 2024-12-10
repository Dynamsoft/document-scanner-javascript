import { EnumCapturedResultItemType, Point, Quadrilateral } from "dynamsoft-core";
import { DrawingLayer, DrawingStyleManager, ImageEditorView, QuadDrawingItem } from "dynamsoft-camera-enhancer";
import { DetectedQuadResultItem, NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";
import { MobileDocumentScannerConfig, SharedResources } from "../core/MobileDocumentScanner";
import { bindControlButton } from "../util";
import { DocumentScanResult } from "./DocumentScannerView";

const DEFAULT_CORNER_SIZE = 60;
interface DocumentNormalizerViewControls {
  fullImageBtn?: HTMLElement | string; // Can be element or selector
  autoBoundsBtn?: HTMLElement | string;
  finishBtn?: HTMLElement | string;
  containerStyle?: Partial<CSSStyleDeclaration>; // Optional styling
}

export interface DocumentNormalizerViewConfig {
  container: HTMLElement;
  controls: DocumentNormalizerViewControls;
  onFinish?: (result: DocumentScanResult) => void;
}

export default class DocumentNormalizerView {
  private imageEditorView: ImageEditorView = null;
  private layer: DrawingLayer = null;
  private controls: DocumentNormalizerViewControls;
  private currentNormalizerResolver?: (result: DocumentScanResult) => void;

  constructor(private resources: SharedResources, private config: MobileDocumentScannerConfig) {}

  async initialize(): Promise<void> {
    if (!this.resources.result) {
      throw Error("Captured image is missing. Please capture an image first!");
    }

    if (!this.config.documentNormalizerViewConfig.container) {
      throw new Error("Please create an Normalizer View Container element");
    }

    // Add basic styling to container
    Object.assign(this.config.documentNormalizerViewConfig.container.style, {
      display: "flex",
      width: "100%",
      "background-color": "#575757",
      "font-size": "12px",
      "flex-direction": "column",
      "align-items": "center",
    });

    // Add normalizer
    const imageEditorViewElement = document.createElement("div");
    Object.assign(imageEditorViewElement.style, {
      width: "100%",
      height: "100%",
    });

    this.config.documentNormalizerViewConfig.container.appendChild(imageEditorViewElement);

    this.imageEditorView = await ImageEditorView.createInstance(imageEditorViewElement);
    this.layer = this.imageEditorView.createDrawingLayer();
    this.imageEditorView.setOriginalImage(this.resources.result.originalImageResult);

    this.setupDrawingLayerStyle(); // Set style for drawing layer
    this.setupInitialDetectedQuad();
    this.setupNormalizerControls();
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
    styleSheet.textContent = DEFAULT_NORMALIZER_CONTROLS_STYLE;
    document.head.appendChild(styleSheet);

    const container = document.createElement("div");
    container.className = "mwc-image-normalizer-controls";
    container.innerHTML = `
      ${DEFAULT_NORMALIZER_CONTROLS_HTML}
    `;
    return container;
  }

  private setupNormalizerControls() {
    const { container, controls } = this.config.documentNormalizerViewConfig;

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
            this.confirmNormalization()
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
          finishBtn: bindControlButton(controls.finishBtn, null, async () => this.confirmNormalization()),
        };
      }
    } catch (error) {
      console.error("Error setting up normalizer controls:", error);
      throw new Error(`Failed to setup normalizer controls: ${error.message}`);
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

  async confirmNormalization() {
    const drawingItem = this.layer.getDrawingItems()[0] as QuadDrawingItem;
    if (!drawingItem) {
      throw new Error("No quad drawing item found");
    }
    const quad = drawingItem.getQuad();
    const normalizedImage = await this.normalizeImage(quad?.points);
    if (normalizedImage) {
      const updatedResult = {
        ...this.resources.result,
        normalizedImageResult: normalizedImage,
        detectedQuadrilateral: quad,
      };

      if (this.resources.onResultUpdated) {
        // Update the result with new normalized image and quad
        this.resources.onResultUpdated(updatedResult);
      }

      // Call onFinish callback if provided
      if (this.config.documentNormalizerViewConfig?.onFinish) {
        this.config.documentNormalizerViewConfig.onFinish(updatedResult);
      }

      // Resolve the promise with normalized image
      if (this.currentNormalizerResolver) {
        this.currentNormalizerResolver(updatedResult);
      }
    } else {
      if (this.currentNormalizerResolver) {
        this.currentNormalizerResolver(this.resources.result);
      }
    }

    // Clean up and hide
    this.dispose();
    this.hideEditor();
  }

  async showEditor(): Promise<DocumentScanResult> {
    try {
      this.config.documentNormalizerViewConfig.container.textContent = "";
      await this.initialize();
      this.config.documentNormalizerViewConfig.container.style.display = "flex";

      // Return promise that resolves when user clicks finish
      return new Promise((resolve) => {
        this.currentNormalizerResolver = resolve;
      });
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      console.error(errMsg);
      throw errMsg;
    }
  }

  hideEditor(): void {
    this.config.documentNormalizerViewConfig.container.style.display = "none";
  }

  async normalizeImage(points: Quadrilateral["points"]): Promise<NormalizedImageResultItem> {
    const { cvRouter } = this.resources;
    const settings = await cvRouter.getSimplifiedSettings(this.config.utilizedTemplateNames.normalize);
    settings.roiMeasuredInPercentage = false;
    settings.roi.points = points;
    await cvRouter.updateSettings(this.config.utilizedTemplateNames.normalize, settings);

    const normalizedResult = await cvRouter.capture(
      this.resources.result.originalImageResult,
      this.config.utilizedTemplateNames.normalize
    );

    // If normalized result found
    if (normalizedResult?.normalizedImageResultItems?.[0]) {
      return normalizedResult.normalizedImageResultItems[0];
    }
  }

  dispose(): void {
    // Clean up resources
    this.imageEditorView?.dispose();
    this.layer = null;

    // Clean up the container
    this.config.documentNormalizerViewConfig.container.textContent = "";

    // Clear resolver
    this.currentNormalizerResolver = undefined;
  }
}

const ICONS = {
  fullImage: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="25" height="25" viewBox="0 0 25 25">
  <defs>
    <clipPath id="clip-path">
      <rect id="Rectangle_2776" data-name="Rectangle 2776" width="25" height="25" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="full-image" transform="translate(0 0)">
    <g id="Group_586" data-name="Group 586" transform="translate(0 0)" clip-path="url(#clip-path)">
      <path id="Path_1528" data-name="Path 1528" d="M.621,3.618A.621.621,0,0,0,1.242,3V1.809a.569.569,0,0,1,.567-.567H3A.621.621,0,0,0,3,0H1.809A1.811,1.811,0,0,0,0,1.809V3a.621.621,0,0,0,.621.621" transform="translate(0 0)" fill="#fff"/>
      <path id="Path_1529" data-name="Path 1529" d="M17.842,1.242H19.03a.568.568,0,0,1,.566.567V3a.621.621,0,1,0,1.242,0V1.809A1.811,1.811,0,0,0,19.03,0H17.842a.621.621,0,0,0,0,1.242" transform="translate(4.162 0)" fill="#fff"/>
      <path id="Path_1530" data-name="Path 1530" d="M9.562,0H5.4a.621.621,0,0,0,0,1.242H9.562A.621.621,0,0,0,9.562,0" transform="translate(1.156 0)" fill="#fff"/>
      <path id="Path_1531" data-name="Path 1531" d="M11.623,1.242h4.158a.621.621,0,0,0,0-1.242H11.623a.621.621,0,0,0,0,1.242" transform="translate(2.659 0)" fill="#fff"/>
      <path id="Path_1532" data-name="Path 1532" d="M3,19.6H1.808a.568.568,0,0,1-.566-.567V17.841a.621.621,0,1,0-1.242,0v1.188a1.81,1.81,0,0,0,1.808,1.809H3A.621.621,0,0,0,3,19.6" transform="translate(0 4.161)" fill="#fff"/>
      <path id="Path_1533" data-name="Path 1533" d="M9.562,19.134H5.4a.621.621,0,1,0,0,1.242H9.562a.621.621,0,1,0,0-1.242" transform="translate(1.156 4.624)" fill="#fff"/>
      <path id="Path_1534" data-name="Path 1534" d="M.621,10.183a.621.621,0,0,0,.621-.621V5.4A.621.621,0,0,0,0,5.4V9.562a.621.621,0,0,0,.621.621" transform="translate(0 1.156)" fill="#fff"/>
      <path id="Path_1535" data-name="Path 1535" d="M.621,16.4a.621.621,0,0,0,.621-.621V11.624a.621.621,0,1,0-1.242,0v4.157a.621.621,0,0,0,.621.621" transform="translate(0 2.659)" fill="#fff"/>
      <path id="Path_1536" data-name="Path 1536" d="M20.376,5.4a.621.621,0,1,0-1.242,0V9.563a.621.621,0,1,0,1.242,0Z" transform="translate(4.624 1.156)" fill="#fff"/>
      <path id="Path_1537" data-name="Path 1537" d="M20.217,17.221a.621.621,0,0,0-.621.621V19.03a.568.568,0,0,1-.567.566H17.841a.621.621,0,1,0,0,1.242h1.188a1.811,1.811,0,0,0,1.809-1.808V17.842a.621.621,0,0,0-.621-.621" transform="translate(4.162 4.162)" fill="#fff"/>
      <path id="Path_1538" data-name="Path 1538" d="M15.781,19.134H11.623a.621.621,0,1,0,0,1.242h4.158a.621.621,0,0,0,0-1.242" transform="translate(2.659 4.624)" fill="#fff"/>
      <path id="Path_1539" data-name="Path 1539" d="M19.755,11a.621.621,0,0,0-.621.621v4.157a.621.621,0,0,0,1.242,0V11.624A.621.621,0,0,0,19.755,11" transform="translate(4.624 2.659)" fill="#fff"/>
      <path id="Path_1540" data-name="Path 1540" d="M7.5,18.3a.621.621,0,0,0-.621-.621H4.733l5.149-5.149A.621.621,0,0,0,9,11.656L3.855,16.806V14.579a.621.621,0,0,0-1.242,0V18.3a.611.611,0,0,0,.048.238A.606.606,0,0,0,3,18.877a.606.606,0,0,0,.238.048H6.878A.621.621,0,0,0,7.5,18.3" transform="translate(0.632 2.773)" fill="#fff"/>
      <path id="Path_1541" data-name="Path 1541" d="M14.173,3.409a.619.619,0,0,0,.621.621h1.836L11.483,9.178a.621.621,0,0,0,.878.878l5.148-5.148V6.744a.621.621,0,1,0,1.242,0V3.41a.606.606,0,0,0-.048-.238.612.612,0,0,0-.335-.335.606.606,0,0,0-.238-.048H14.794a.621.621,0,0,0-.621.621" transform="translate(2.731 0.673)" fill="#fff"/>
      <path id="Path_1542" data-name="Path 1542" d="M2.661,3.172a.615.615,0,0,0-.048.238V6.744a.621.621,0,0,0,1.242,0V4.908L9,10.057a.621.621,0,0,0,.878-.878L4.733,4.03H6.57a.621.621,0,1,0,0-1.242H3.235A.634.634,0,0,0,3,2.836a.624.624,0,0,0-.335.335" transform="translate(0.632 0.673)" fill="#fff"/>
      <path id="Path_1543" data-name="Path 1543" d="M18.7,18.545a.617.617,0,0,0,.048-.24h0V14.581a.62.62,0,1,0-1.24,0v2.226l-5.148-5.15a.621.621,0,0,0-.878.878l5.147,5.149H14.4a.621.621,0,0,0-.621.621.623.623,0,0,0,.621.621h3.71a.616.616,0,0,0,.453-.18.6.6,0,0,0,.117-.175c0-.009.012-.016.016-.025" transform="translate(2.731 2.773)" fill="#fff"/>
    </g>
  </g>
</svg>
`,
  autoBounds: `<svg xmlns="http://www.w3.org/2000/svg" width="25.04" height="25" viewBox="0 0 25.04 25">
  <g id="bounds-detection" transform="translate(0.02)">
    <g id="Group_306" data-name="Group 306" transform="translate(-0.02)">
      <path id="Path_982" data-name="Path 982" d="M.791,8.146h.02a.468.468,0,0,0,.516-.416.455.455,0,0,0,0-.063V1.927a1,1,0,0,1,1-1H7.957A.468.468,0,0,0,8.436.492.468.468,0,0,0,7.977.013H2.247A1.913,1.913,0,0,0,.333,1.927v5.74A.468.468,0,0,0,.791,8.146Z" transform="translate(-0.293 -0.012)" fill="#fff"/>
      <path id="Path_983" data-name="Path 983" d="M140.092,132.044a.468.468,0,0,0-.458-.478h-.02a.468.468,0,0,0-.478.458q0,.01,0,.02v5.74a1,1,0,0,1-1,1h-5.671a.5.5,0,0,0,0,1h5.711a1.913,1.913,0,0,0,1.915-1.912q0-.041,0-.081Z" transform="translate(-115.132 -114.777)" fill="#fff"/>
      <path id="Path_984" data-name="Path 984" d="M7.665,138.7H1.955a1,1,0,0,1-1-1v-5.661a.468.468,0,0,0-.458-.478H.48a.468.468,0,0,0-.478.458q0,.01,0,.02v5.74A1.914,1.914,0,0,0,1.914,139.7H7.665a.5.5,0,1,0,0-1Z" transform="translate(-0.001 -114.777)" fill="#fff"/>
      <path id="Path_985" data-name="Path 985" d="M138.405,0l-.081,0h-5.711a.468.468,0,0,0-.478.458q0,.01,0,.02a.468.468,0,0,0,.458.478h5.731a1,1,0,0,1,1,1v5.7a.5.5,0,0,0,1,0V1.915A1.913,1.913,0,0,0,138.405,0Z" transform="translate(-115.277)" fill="#fff"/>
      <path id="Path_986" data-name="Path 986" d="M32.226,33.132v14.81a1.227,1.227,0,0,0,1.227,1.227H48.265a1.217,1.217,0,0,0,1.227-1.206V33.132a1.217,1.217,0,0,0-1.206-1.227H33.453A1.227,1.227,0,0,0,32.226,33.132Zm16.251-.045a.19.19,0,0,1,0,.045v14.81a.19.19,0,0,1-.179.2H33.453a.19.19,0,0,1-.211-.168.182.182,0,0,1,0-.033V33.132a.19.19,0,0,1,.212-.212H48.265A.191.191,0,0,1,48.477,33.087Z" transform="translate(-28.359 -28.076)" fill="#fff"/>
      <path id="Path_987" data-name="Path 987" d="M59.363,95.652h9.209a.478.478,0,0,0,.478-.478.488.488,0,0,0-.478-.478H59.363a.488.488,0,0,0-.478.478A.478.478,0,0,0,59.363,95.652Z" transform="translate(-51.309 -82.838)" fill="#fff"/>
      <path id="Path_988" data-name="Path 988" d="M59.363,128.6h9.209a.478.478,0,0,0,.478-.478.488.488,0,0,0-.478-.478H59.363a.488.488,0,0,0-.478.478A.478.478,0,0,0,59.363,128.6Z" transform="translate(-51.309 -111.663)" fill="#fff"/>
      <path id="Path_989" data-name="Path 989" d="M59.364,64.6h4.285a.488.488,0,0,0,.478-.478.478.478,0,0,0-.478-.478H59.364a.468.468,0,0,0-.478.458q0,.01,0,.02A.478.478,0,0,0,59.364,64.6Z" transform="translate(-51.443 -55.678)" fill="#fff"/>
    </g>
  </g>
</svg>
`,
  finish: `<svg id="finish" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="clip-path">
      <rect id="Rectangle_2775" data-name="Rectangle 2775" width="24" height="24" fill="#fe8e14"/>
    </clipPath>
  </defs>
  <g id="Group_584" data-name="Group 584" clip-path="url(#clip-path)">
    <path id="Path_1526" data-name="Path 1526" d="M17.6,6.7l-6.691,9.081L6.313,12.11a.5.5,0,0,0-.625.781l5,4a.508.508,0,0,0,.378.1.493.493,0,0,0,.337-.2l7-9.5A.5.5,0,1,0,17.6,6.7" fill="#fe8e14"/>
    <path id="Path_1527" data-name="Path 1527" d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0m0,23A11,11,0,1,1,23,12,11.013,11.013,0,0,1,12,23" fill="#fe8e14"/>
  </g>
</svg>
`,
};

const DEFAULT_NORMALIZER_CONTROLS_STYLE = `
.mwc-image-normalizer-controls {
  display: flex;
  height: 6rem;
  background-color: #323234;
  align-items: center;
  font-size: 12px;
  font-family: Verdana;
  color: white;
  width: 100%;
}

.mwc-image-normalizer-control-btn {
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
  border: 1px solid #575757;
  text-align: center;
  user-select: none;
}

.mwc-image-normalizer-control-btn div:last-child {
  padding-bottom: 0.5rem;
}

.mwc-image-normalizer-control-btn.finish {
  background-color: #000000;
  color: #fe8e14;
}

.mwc-image-normalizer-control-icon svg {
  padding-top: 0.5rem;
  width: max(3vmin, 24px);
  height: max(3vmin, 24px);
}
`;

const DEFAULT_NORMALIZER_CONTROLS_HTML = `
  <div class="mwc-image-normalizer-control-btn">
    <div class="mwc-image-normalizer-control-icon">${ICONS.fullImage}</div>
    <div>Full Image</div>
  </div>
  <div class="mwc-image-normalizer-control-btn">
    <div class="mwc-image-normalizer-control-icon">${ICONS.autoBounds}</div>
    <div>Auto Bounds Detection</div>
  </div>
  <div class="mwc-image-normalizer-control-btn finish">
    <div class="mwc-image-normalizer-control-icon">${ICONS.finish}</div>
    <div>Finish</div>
  </div>
`;

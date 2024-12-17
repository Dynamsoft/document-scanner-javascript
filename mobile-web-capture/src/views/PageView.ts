import { DDV, DisplayModeEnum, EditViewer, UiConfig } from "dynamsoft-document-viewer";
import { mobileEditViewerUiConfig, mobileTopBarChildrenConfig } from "./utils/uiConfig";
import { isMobile, showInfoDialog } from "./utils";
import { MWC_ICONS } from "./utils/icons";

export interface PageViewConfig {
  container: HTMLElement;
  onDocumentClick?: () => void;
  onAddPage?: () => void;
}

export class PageView {
  private editViewer: EditViewer = null;

  toolbarContainer: HTMLElement;
  editToolbarContainer: HTMLElement;
  annotationToolbarContainer: HTMLElement;

  documentBtn: HTMLElement;
  exportBtn: HTMLElement;
  deletePageBtn: HTMLElement;
  captureAnotherBtn: HTMLElement;
  editBtn: HTMLElement;

  cropBtn: HTMLElement;
  rotateBtn: HTMLElement;
  annotateBtn: HTMLElement;
  finishBtn: HTMLElement;

  isCroppingMode: boolean = false;

  // DDV elements
  DDV_BUILT_IN_ELEMENTS: Record<"crop", Element> = {
    crop: null,
  };

  constructor(private config: PageViewConfig) {}

  initialize() {
    if (!this.config.container) {
      throw new Error("Please create a Page Container element");
    }

    // Set title
    DDV.Elements.setDisplayTextConfig({
      SelectAnnotation: "Select",
      EraseAnnotation: "Eraser",
      RectAnnotation: "Rect",
      EllipseAnnotation: "Ellipse",
      PolygonAnnotation: "Polygon",
      PolylineAnnotation: "Polyline",
      LineAnnotation: "Line",
      InkAnnotation: "Ink",
      TextBoxAnnotation: "Textbox",
      TextTypewriterAnnotation: "Text",
      StampIconAnnotation: "Stamp",
      StampImageAnnotation: "Image",
      BringForward: "Up",
      BringToFront: "Top",
      SendBackward: "Down",
      SendToBack: "Bottom",
    });

    // Create EditViewer with mobile UI config and annotation support
    this.editViewer = new DDV.EditViewer({
      container: this.config.container,
      uiConfig: mobileEditViewerUiConfig as UiConfig, // Using mobile UI config for consistent look
      viewerConfig: {
        scrollToLatest: true,
      },
    });
    this.editViewer.displayMode = DisplayModeEnum.SINGLE;

    this.createStylesheet();
    this.bindPageViewEvents();
    this.createToolbar();

    this.setVisible(false);
  }

  private createStylesheet() {
    // Create style
    const styleSheet = document.createElement("style");
    styleSheet.textContent = DEFAULT_PAGE_VIEW_STYLE;
    document.head.appendChild(styleSheet);

    // assign styling to container
    Object.assign(this.config.container.style, {
      position: "relative", // Used for showInfoDialog
      display: "flex",
      flexDirection: "column",
    });
  }

  private bindPageViewEvents() {
    this.editViewer.on("showDocumentPageByDelete", () => {
      showInfoDialog("Deleted", this.config.container);

      const count = this.editViewer.currentDocument.pages.length;

      if (!count) {
        // Simulate return to document
        this.handleDocumentBtn();
      }
    });

    this.editViewer.on("toolModeChanged", (e) => {
      if (e.oldToolMode === "crop") {
        this.cropBtn.classList.remove("selected");

        // Enable other buttons
        this.config.container
          .querySelectorAll(".mwc-page-view-controls.edit .mwc-page-view-control-btn")
          .forEach((btn) => (btn as HTMLElement).classList.remove("ddv-disable-button"));

        this.toggleDDVHeaderButtons(true);
        this.isCroppingMode = false;
      }
    });

    // Bind behavior to buttons in annotation mode
    let isFirstBind = false;
    const annotationSetButton = document.querySelector(".mwc-annotation-set");
    if (!isMobile() && annotationSetButton) {
      annotationSetButton.addEventListener("click", () => {
        const annotationModeBar = document.querySelector(".ddv-annotation-mode-box");
        if (!isFirstBind) {
          isFirstBind = true;
          let isFocused = false;

          annotationModeBar.addEventListener("mousedown", (e) => {
            let modeButton = e.target;
            if (e.target instanceof HTMLSpanElement) {
              modeButton = e.target.parentElement;
            }

            if ((modeButton as HTMLElement).classList.contains("ddv-button-focused")) {
              isFocused = true;
            }
          });

          annotationModeBar.addEventListener("click", (e) => {
            if (isFocused) {
              this.editViewer.toolMode = "pan";
              isFocused = false;
            }
          });
        }
      });
    }
  }

  private createToolbar() {
    this.toolbarContainer = document.createElement("div");
    this.toolbarContainer.className = "mwc-page-view-controls base";
    this.toolbarContainer.innerHTML = PAGE_VIEW_CONTROLS_HTML;

    this.editToolbarContainer = document.createElement("div");
    this.editToolbarContainer.className = "mwc-page-view-controls edit";
    this.editToolbarContainer.innerHTML = EDIT_TOOLBAR_CONTROLS_HTML;

    this.config.container.append(this.toolbarContainer);
    this.config.container.append(this.editToolbarContainer);

    this.toggleShowEditToolbar(false);
    this.bindToolbarEvents();
  }

  private toggleShowEditToolbar(show: boolean) {
    this.toolbarContainer.style.display = show ? "none" : "flex";
    this.editToolbarContainer.style.display = show ? "flex" : "none";
  }

  private bindToolbarEvents() {
    // Normal mode toolbar
    this.documentBtn = this.toolbarContainer.querySelector(".mwc-page-view-control-btn:nth-child(1)");
    this.exportBtn = this.toolbarContainer.querySelector(".mwc-page-view-control-btn:nth-child(2)");
    this.deletePageBtn = this.toolbarContainer.querySelector(".mwc-page-view-control-btn:nth-child(3)");
    this.captureAnotherBtn = this.toolbarContainer.querySelector(".mwc-page-view-control-btn:nth-child(4)");
    this.editBtn = this.toolbarContainer.querySelector(".mwc-page-view-control-btn:nth-child(5)");

    // Edit mode toolbar
    this.cropBtn = this.editToolbarContainer.querySelector(".mwc-page-view-control-btn:nth-child(1)");
    this.rotateBtn = this.editToolbarContainer.querySelector(".mwc-page-view-control-btn:nth-child(2)");
    this.annotateBtn = this.editToolbarContainer.querySelector(".mwc-page-view-control-btn:nth-child(3)");
    this.finishBtn = this.editToolbarContainer.querySelector(".mwc-page-view-control-btn:nth-child(4)");

    // Bind normal mode events
    this.documentBtn?.addEventListener("click", () => this.handleDocumentBtn());
    // this.exportBtn?.addEventListener("click", async () => await this.config.onCameraCapture());
    this.deletePageBtn?.addEventListener("click", () => this.handleDeletePage());
    this.captureAnotherBtn?.addEventListener("click", () => this.config.onAddPage());
    this.editBtn?.addEventListener("click", () => this.handleEditMode());

    // Bind Edit mode events
    this.cropBtn?.addEventListener("click", () => this.handleCrop());
    this.rotateBtn?.addEventListener("click", () => this.handleRotate());
    this.annotateBtn?.addEventListener("click", () => this.handleAnnotate());
    this.finishBtn?.addEventListener("click", () => this.handleFinishBtn());
  }

  async openPage(docId: string) {
    await this.editViewer.openDocument(docId);
    this.editViewer.show();
  }

  setVisible(visible: boolean) {
    this.config.container.style.display = visible ? "flex" : "none";

    // Handle viewer visibility
    if (visible) {
      this.editViewer?.show();
    } else {
      this.editViewer?.hide();
    }
  }

  private handleDocumentBtn() {
    this.editViewer.saveOperations();

    this.config.onDocumentClick();
  }

  private handleDeletePage() {
    (this.config.container.querySelector(".ddv-delete-current") as HTMLElement).click();
  }

  private updateEditViewTopbar(mode: "base" | "edit") {
    const uiConfig = this.editViewer.getUiConfig();
    uiConfig.children[0] = mobileTopBarChildrenConfig[mode] as any; // TODO fix any
    const status = this.editViewer.updateUiConfig(uiConfig);

    return status;
  }

  private handleEditMode() {
    try {
      const status = this.updateEditViewTopbar("edit");

      if (status) {
        this.toggleShowEditToolbar(true);
      } else {
        throw new Error("Failed to update edit viewer. Please contact our team for support!");
      }
    } catch (ex) {
      console.error(ex);
      alert(ex);
    }
  }

  private toggleDDVHeaderButtons(enable: boolean) {
    const headerContainer = this.config.container.querySelector(".ddv-edit-viewer-header-mobile");
    if (enable) {
      headerContainer.childNodes.forEach((btn) => (btn as HTMLElement).classList.remove("ddv-disable-button"));
    } else {
      headerContainer.childNodes.forEach((btn) => (btn as HTMLElement).classList.add("ddv-disable-button"));
    }
  }

  private handleCrop() {
    this.isCroppingMode = true;

    (this.config.container.querySelector(".ddv-button.ddv-crop") as HTMLElement).click();

    // Disable other buttons
    this.config.container
      .querySelectorAll(".mwc-page-view-controls.edit .mwc-page-view-control-btn")
      .forEach((btn) => (btn as HTMLElement).classList.add("ddv-disable-button"));
    this.cropBtn.classList.remove("ddv-disable-button");

    // Add selected to crop
    this.cropBtn.classList.add("selected");

    this.toggleDDVHeaderButtons(false);
  }

  private handleRotate() {
    this.editViewer.rotate(-90);
  }

  private handleAnnotate() {
    (this.config.container.querySelector(".mwc-annotation-set") as HTMLElement).click();
  }

  private handleFinishBtn() {
    try {
      const status = this.updateEditViewTopbar("base");

      if (status) {
        this.toggleShowEditToolbar(false);
      } else {
        throw new Error("Failed to update edit viewer. Please contact our team for support!");
      }
    } catch (ex) {
      console.error(ex);
      alert(ex);
    }
  }

  dispose() {
    // this.editViewer?.dispose();
    this.editViewer = null;
  }
}

const encodedBackBtn = (icon: string) => encodeURIComponent(icon.trim()).replace(/'/g, "%27").replace(/"/g, "%22");

const DEFAULT_PAGE_VIEW_STYLE = `
.mwc-icon.icon-back_arrow {
  background-image: url('data:image/svg+xml;utf8,${encodedBackBtn(MWC_ICONS.document)}');
  background-size: initial;
  background-repeat: no-repeat;
  background-position: center;
}

.mwc-page-view-controls {
  display: flex;
  height: 6rem;
  background-color: #323234;
  align-items: center;
  font-size: 12px;
  font-family: Verdana;
  color: white;
  width: 100%;
}

.mwc-page-view-control-btn {
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

.mwc-page-view-control-btn div:last-child {
  padding-bottom: 0.5rem;
}

.mwc-page-view-control-btn.finish {
  background-color: #000000;
  color: #fe8e14;
}

.mwc-page-view-control-icon svg {
  padding-top: 0.5rem;
  width: 24px;
  height: 24px;
  fill: white;
}

.mwc-page-view-control-btn.selected div {
  color: #fe8e14;
}

.mwc-page-view-control-btn.selected div svg {
  fill: #fe8e14;
}

.ddv-edit-viewer-footer-mobile{
  height: 0;
}

.ddv-annotation-mode-box,
.ddv-crop-box {
  top: unset !important;
  bottom: 0;
}

.ddv-disable-button {
  opacity: 0.3;
  pointer-events: none;
}

.mwc-annotation-mode-bar {
  overflow-y: hidden;
  height: 70px;

  scrollbar-width: thin;
  scrollbar-color: rgb(193,193,193) rgb(241,241,241); 
}

.mwc-annotation-mode-bar > .ddv-button {
  height: 50px;
  width: 50px;
}

.mwc-annotation-mode-bar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
  border-radius: 0px;
}

.mwc-annotation-mode-bar::-webkit-scrollbar-thumb { 
  border-radius: 0px;
  background-color: rgb(193,193,193);
}  

.mwc-annotation-mode-bar::-webkit-scrollbar-track {
  border-radius: 0px;
  background-color: rgb(241,241,241);
}
`;

const PAGE_VIEW_CONTROLS_HTML = `
  <div class="mwc-page-view-control-btn">
    <div class="mwc-page-view-control-icon">${MWC_ICONS.document}</div>
    <div>Document</div>
  </div>
  <div class="mwc-page-view-control-btn">
    <div class="mwc-page-view-control-icon">${MWC_ICONS.export}</div>
    <div>Export</div>
  </div>
  <div class="mwc-page-view-control-btn">
    <div class="mwc-page-view-control-icon">${MWC_ICONS.delete}</div>
    <div>Delete Page</div>
  </div>
  <div class="mwc-page-view-control-btn">
    <div class="mwc-page-view-control-icon">${MWC_ICONS.captureAnother}</div>
    <div>Add Page</div>
  </div>
  <div class="mwc-page-view-control-btn">
    <div class="mwc-page-view-control-icon">${MWC_ICONS.edit}</div>
    <div>Edit</div>
  </div>
`;

const EDIT_TOOLBAR_CONTROLS_HTML = `
  <div class="mwc-page-view-control-btn">
    <div class="mwc-page-view-control-icon">${MWC_ICONS.crop}</div>
    <div>Crop</div>
  </div>
  <div class="mwc-page-view-control-btn">
    <div class="mwc-page-view-control-icon">${MWC_ICONS.rotate}</div>
    <div>Rotate</div>
  </div>
  <div class="mwc-page-view-control-btn">
    <div class="mwc-page-view-control-icon">${MWC_ICONS.annotate}</div>
    <div>Annotate</div>
  </div>
  <div class="mwc-page-view-control-btn finish">
    <div class="mwc-page-view-control-icon">${MWC_ICONS.finish}</div>
    <div>Finish</div>
  </div>
`;

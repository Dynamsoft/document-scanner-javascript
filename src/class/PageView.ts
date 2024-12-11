import { DDV, DisplayModeEnum, EditViewer, UiConfig } from "dynamsoft-document-viewer";
import { mobileEditViewerUiConfig } from "../util/uiConfig";
import { showInfoDialog } from "../util";
import { MWC_ICONS } from "../util/icons";

export interface PageViewConfig {
  container: HTMLElement;
  onDocumentClick?: () => void;
}

export class PageView {
  private editViewer: EditViewer = null;

  constructor(private config: PageViewConfig) {}

  initialize() {
    if (!this.config.container) {
      throw new Error("Please create a Page Container element");
    }

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
    });
  }

  private bindPageViewEvents() {
    this.editViewer.on("backToDocument", () => this.config.onDocumentClick());

    this.editViewer.on("showThumbnailPageByClear", () => {
      showInfoDialog("Deleted", this.config.container);

      const count = this.editViewer.currentDocument.pages.length;

      if (!count) {
        // Simulate return to document
        this.config.onDocumentClick();
      }
    });
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

  dispose() {
    // this.editViewer?.dispose();
    this.editViewer = null;
  }
}

const encodedBackBtn = (icon: string) => encodeURIComponent(icon.trim()).replace(/'/g, "%27").replace(/"/g, "%22");

const DEFAULT_PAGE_VIEW_STYLE = `
.mwc-icon.icon-back_arrow {
  background-image: url('data:image/svg+xml;utf8,${encodedBackBtn(MWC_ICONS.documentBtn)}');
  background-size: initial;
  background-repeat: no-repeat;
  background-position: center;
}
`;

const DOCUMENT_VIEW_CONTROLS_HTML = `
  <div class="mwc-document-view-control-btn">
    <div class="mwc-document-view-control-icon">${MWC_ICONS.library}</div>
    <div>Library</div>
  </div>
  <div class="mwc-document-view-control-btn">
    <div class="mwc-document-view-control-icon">${MWC_ICONS.cameraCapture}</div>
    <div>Capture</div>
  </div>
  <div class="mwc-document-view-control-btn">
    <div class="mwc-document-view-control-icon">${MWC_ICONS.galleryImport}</div>
    <div>Import</div>
  </div>
    <div class="mwc-document-view-control-btn">
    <div class="mwc-document-view-control-icon">${MWC_ICONS.fileOperations}</div>
    <div>Manage</div>
  </div>
`;

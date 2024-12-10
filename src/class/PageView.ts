import { DDV, DisplayModeEnum, EditViewer, UiConfig } from "dynamsoft-document-viewer";
import { mobileEditViewerUiConfig } from "../util/uiConfig";

export interface PageViewConfig {
  container: HTMLElement;
  onDocumentClick?: () => void;
}

export class PageView {
  private editViewer: EditViewer = null;

  constructor(private config: PageViewConfig) {}

  async initialize() {
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

const ICONS = {
  documentBtn: `
<svg id="document" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="24" viewBox="0 0 20 24">
  <defs>
    <clipPath id="documentclip-path">
      <rect id="Rectangle_2779" data-name="Rectangle 2779" width="20" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_593" data-name="Group 593" clip-path="url(#documentclip-path)">
    <path id="Path_1549" data-name="Path 1549" d="M19.56,3.85,16.15.44A1.52,1.52,0,0,0,15.09,0H4.5A1.5,1.5,0,0,0,3,1.5V3H1.5A1.5,1.5,0,0,0,0,4.5v18A1.5,1.5,0,0,0,1.5,24h14A1.5,1.5,0,0,0,17,22.5V21h1.5A1.5,1.5,0,0,0,20,19.5V4.91a1.52,1.52,0,0,0-.44-1.06M16,22.5a.5.5,0,0,1-.5.5H1.5a.5.5,0,0,1-.5-.5V4.5A.5.5,0,0,1,1.5,4H3V19.5A1.5,1.5,0,0,0,4.5,21H16Zm3-3a.5.5,0,0,1-.5.5H4.5a.5.5,0,0,1-.5-.5V1.5A.5.5,0,0,1,4.5,1H15.09a.492.492,0,0,1,.35.15l3.41,3.41a.468.468,0,0,1,.15.35Z" fill="#fff"/>
    <path id="Path_1550" data-name="Path 1550" d="M7.66,6.4h5.18a.5.5,0,0,0,0-1H7.66a.5.5,0,0,0,0,1" fill="#fff"/>
    <path id="Path_1551" data-name="Path 1551" d="M15.5,9.08h-8a.5.5,0,1,0,0,1h8a.5.5,0,1,0,0-1" fill="#fff"/>
    <path id="Path_1552" data-name="Path 1552" d="M15.5,13.08h-8a.5.5,0,1,0,0,1h8a.5.5,0,0,0,0-1" fill="#fff"/>
  </g>
</svg>
`,
};

const encodedBackBtn = (icon: string) => encodeURIComponent(icon.trim()).replace(/'/g, "%27").replace(/"/g, "%22");

const DEFAULT_PAGE_VIEW_STYLE = `
.mwc-icon.icon-back_arrow {
  background-image: url('data:image/svg+xml;utf8,${encodedBackBtn(ICONS.documentBtn)}');
  background-size: initial;
  background-repeat: no-repeat;
  background-position: center;
}
`;

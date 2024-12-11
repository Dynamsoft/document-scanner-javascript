import { BrowseViewer, DDV } from "dynamsoft-document-viewer";
import { isMobile, showInfoDialog } from "../util";

export interface DocumentViewConfig {
  container: HTMLElement;
  onCameraCapture?: () => Promise<void>;
  onGalleryImport?: () => Promise<void>;
  onLibraryClick?: () => void;
  onPageClick?: (docId: string, pageIndex: number) => void;
  groupUid?: string;
}

export class DocumentView {
  browseViewer: BrowseViewer;

  isMultipleSelectMode: boolean = false;
  isDragged: boolean = false;

  headerContainer: HTMLElement;
  browseViewerContainer: HTMLElement;
  emptyContentContainer: HTMLElement;

  toolbarContainer: HTMLElement;
  selectedToolbarContainer: HTMLElement;

  libraryBtn: HTMLElement;
  cameraCaptureBtn: HTMLElement;
  galleryInputBtn: HTMLElement;
  fileOperationsBtn: HTMLElement;

  copyToBtn: HTMLElement;
  moveToBtn: HTMLElement;
  selectAllBtn: HTMLElement;
  deleteBtn: HTMLElement;
  backBtn: HTMLElement;

  constructor(private config: DocumentViewConfig) {}

  initialize() {
    if (!this.config.container) {
      throw new Error("Please create a Document View Container element");
    }

    this.createUI();
    // this.bindDocumentManagerEvents();
    this.setVisible(false);
  }

  setVisible(visible: boolean) {
    this.config.container.style.display = visible ? "flex" : "none";

    const doc = this.browseViewer.currentDocument;

    if (visible) {
      const hasDoc = doc && doc.pages.length > 0;
      this.updateHeaderTitle();
      this.toggleShowContentContainer(hasDoc);
    } else {
      this.toggleShowContentContainer(false);
    }
  }

  createUI() {
    // Reset Element
    this.config.container.textContent = "";

    this.createStylesheet();
    this.createHeader();
    this.createBrowseView();
    this.createToolbar();
  }

  private createStylesheet() {
    // Create style
    const styleSheet = document.createElement("style");
    styleSheet.textContent = DEFAULT_DOCUMENT_VIEW_STYLE;
    document.head.appendChild(styleSheet);

    // assign styling to container
    Object.assign(this.config.container.style, {
      display: "flex",
      flexDirection: "column",
      position: "relative", // Used for showInfoDialog
    });
  }

  private createHeader() {
    this.headerContainer = document.createElement("div");
    this.headerContainer.className = "mwc-document-view-header";
    this.headerContainer.textContent = "Document View"; // TODO change to name

    this.config.container.append(this.headerContainer);
  }

  private updateHeaderTitle() {
    const doc = this.browseViewer.currentDocument;
    const docName = doc?.name || "Document Name";

    this.headerContainer.textContent = docName;
  }

  private createBrowseView() {
    this.browseViewerContainer = document.createElement("div");
    this.browseViewerContainer.className = "mwc-document-view-browse-viewer";

    this.emptyContentContainer = document.createElement("div");
    this.emptyContentContainer.className = "mwc-document-view-content-empty";
    this.emptyContentContainer.innerHTML = EMPTY_CONTENT_CONTAINER_HTML;

    this.config.container.append(this.browseViewerContainer);
    this.config.container.append(this.emptyContentContainer);

    this.browseViewer = new DDV.BrowseViewer({
      container: this.browseViewerContainer,

      uiConfig: {
        type: DDV.Elements.Layout,
        style: {
          border: "none",
        },
        children: [DDV.Elements.MainView],
      },
      groupUid: this.config?.groupUid, // TODO
      viewerConfig: {
        canvasStyle: {
          background: "white",
        },
        checkboxStyle: {
          borderRadius: "1px",
          left: "6px",
          top: "6px",
          width: "24px",
          height: "24px",
          visibility: "hidden",
        },
        currentPageStyle: {
          border: "2px solid #FE8E14",
        },
        pageStyle: {
          background: "#F5F5F5",
        },
      },
    });

    this.browseViewer.setRowAndColumn(2, 2);

    this.bindBrowseViewerEvents();
  }

  private bindBrowseViewerEvents() {
    // Handle selected pages changes for toolbar updates
    this.browseViewer.on("selectedPagesChanged", (e) => {
      if (!this.isMultipleSelectMode) return;

      const doc = this.browseViewer?.currentDocument;
      if (!doc) return;

      this.updateToolbarState();
    });

    // Handle click events for page navigation
    this.browseViewer.on("click", (e) => {
      if (!this.isMultipleSelectMode) {
        if (!isMobile() && this.isDragged) {
          this.isDragged = false;
          return;
        }

        if (e.index > -1) {
          const currentDoc = this.browseViewer.currentDocument;
          if (this.config.onPageClick) {
            this.config.onPageClick(currentDoc.uid, e.index);
          }
        }
      }
    });

    this.browseViewer.on("pagesDragged", () => {
      this.isDragged = true;
    });
  }

  private toggleShowContentContainer(show: boolean) {
    this.emptyContentContainer.style.display = show ? "none" : "flex";
    this.browseViewerContainer.style.display = show ? "flex" : "none";
  }

  private createToolbar() {
    this.toolbarContainer = document.createElement("div");
    this.toolbarContainer.className = "mwc-document-view-controls";
    this.toolbarContainer.innerHTML = DOCUMENT_VIEW_CONTROLS_HTML;

    this.selectedToolbarContainer = document.createElement("div");
    this.selectedToolbarContainer.className = "mwc-document-view-controls";
    this.selectedToolbarContainer.innerHTML = SELECTED_DOCUMENT_VIEW_CONTROLS_HTML;

    this.config.container.append(this.toolbarContainer);
    this.config.container.append(this.selectedToolbarContainer);

    this.toggleShowSelectedToolbar(false);
    this.bindToolbarEvents();
  }

  private toggleShowSelectedToolbar(show: boolean) {
    this.toolbarContainer.style.display = show ? "none" : "flex";
    this.selectedToolbarContainer.style.display = show ? "flex" : "none";
  }

  private bindToolbarEvents() {
    // Normal mode toolbar
    this.libraryBtn = this.toolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(1)");
    this.cameraCaptureBtn = this.toolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(2)");
    this.galleryInputBtn = this.toolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(3)");
    this.fileOperationsBtn = this.toolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(4)");

    // Selection mode toolbar
    this.copyToBtn = this.selectedToolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(1)");
    this.moveToBtn = this.selectedToolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(2)");
    this.selectAllBtn = this.selectedToolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(3)");
    this.deleteBtn = this.selectedToolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(4)");
    this.backBtn = this.selectedToolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(5)");

    // Bind normal mode events
    this.libraryBtn?.addEventListener("click", () => this.config.onLibraryClick());
    this.cameraCaptureBtn?.addEventListener("click", async () => await this.config.onCameraCapture());
    this.galleryInputBtn?.addEventListener("click", () => this.config.onGalleryImport());
    this.fileOperationsBtn?.addEventListener("click", () => this.handleFileOperationsClick());

    // // Bind selection mode events
    // this.copyToBtn?.addEventListener("click", async () => await this.handleCopyTo());
    // this.moveToBtn?.addEventListener("click", () => this.handleMoveTo());
    this.selectAllBtn?.addEventListener("click", () => this.handleSelectAll());
    this.deleteBtn?.addEventListener("click", () => this.handleDelete());
    this.backBtn?.addEventListener("click", () => this.handleBackButton());
  }

  private updateToolbarState() {
    // Update button states based on selection
    const hasSelection = this.browseViewer.getSelectedPageIndices().length > 0;

    this.copyToBtn.classList.toggle("disabled", !hasSelection);
    this.moveToBtn.classList.toggle("disabled", !hasSelection);
    this.deleteBtn.classList.toggle("disabled", !hasSelection);

    // Update button click handlers
    [this.copyToBtn, this.moveToBtn, this.deleteBtn].forEach((btn) => {
      btn.style.pointerEvents = hasSelection ? "auto" : "none";
    });
  }

  private toggleSelectionMode(show?: boolean) {
    if (show === undefined) {
      show = !this.isMultipleSelectMode;
    }

    this.isMultipleSelectMode = show;
    this.browseViewer.multiselectMode = show;

    // Clear any existing selections
    this.browseViewer.selectPages([]);

    // Toggle toolbars
    this.toggleShowSelectedToolbar(show);

    // Update checkbox visibility
    this.browseViewer.updateStyle("checkboxStyle", {
      visibility: show ? "visible" : "hidden",
      border: "1px solid #707070",
    });
  }

  private handleFileOperationsClick() {
    this.updateToolbarState();
    this.toggleSelectionMode(true);
  }

  private handleSelectAll() {
    if (this.browseViewer.getSelectedPageIndices().length === this.browseViewer.currentDocument.pages.length) {
      this.browseViewer.selectPages([]);
    } else {
      this.browseViewer.selectAllPages();
    }

    this.updateToolbarState();
  }

  private handleDelete() {
    const selectedIndex = this.browseViewer.getSelectedPageIndices();
    if (selectedIndex.length > 0) {
      this.browseViewer.currentDocument.deletePages(selectedIndex);

      showInfoDialog("Deleted", this.config.container);
      if (this.browseViewer.currentDocument.pages.length === 0) {
        this.toggleShowContentContainer(false);
        this.handleBackButton();
      } else {
        const currentSelectedIndex = this.browseViewer.getSelectedPageIndices();
        if (currentSelectedIndex.length === 0) {
          this.updateToolbarState();
        }
      }
    }
  }

  private handleBackButton() {
    this.toggleSelectionMode(false);
  }
}

const DEFAULT_DOCUMENT_VIEW_STYLE = `
.mwc-document-view-header {
display: flex;
font-family: Verdana;
height: 48px;
font-size: 18px;
align-items: center;
justify-content: center;
background-color: #F5F5F5;
flex: 0 1 48px;
padding: 0.5rem;
user-select: none;
}

.mwc-document-view-browse-viewer {
  flex: 1 1 auto;
  display: none;
  margin-bottom: 30px;
}

.mwc-document-view-content-empty {
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  font-family: Verdana;
  align-items: center;
  padding: 1rem;
  user-select: none;
}

.mwc-document-view-content-empty svg {
  width: 300px;
  height: auto;
}

.mwc-document-view-content-empty .title {
  margin-top: 2rem;
  font-size: 24px;
}

.mwc-document-view-content-empty .desc {
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center
}

.mwc-document-view-controls {
  display: flex;
  height: 65px;
  background-color: #323234;
  align-items: center;
  font-size: 12px;
  font-family: Verdana;
  color: white;
  width: 100%;
  flex: 0 1 65px;
}

.mwc-document-view-control-btn {
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
  padding: 0.5rem;
}

.mwc-document-view-control-btn.selected {
  background-color: #E36605;
}

.mwc-document-view-control-btn.selected.back {
  background-color: #323234;
}

.mwc-document-view-control-btn.disabled {
  background-color: #323234;
  cursor: not-allowed;
}

.mwc-document-view-control-icon {
  height: 24px;
  width: 24px;
}

.mwc-document-view-control-icon svg {
  width: 24px;
  height: 24px;
}
`;

const ICONS = {
  library: `
<svg id="library" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="18" height="24" viewBox="0 0 18 24">
  <defs>
    <clipPath id="libraryclip-path">
      <rect id="Rectangle_2762" data-name="Rectangle 2762" width="18" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_556" data-name="Group 556" clip-path="url(#libraryclip-path)">
    <path id="Path_1486" data-name="Path 1486" d="M16.5,0H2.5A2.5,2.5,0,0,0,0,2.5v19A2.5,2.5,0,0,0,2.5,24h15a.5.5,0,0,0,0-1H2.5a1.5,1.5,0,0,1,0-3h15a.5.5,0,0,0,.5-.5V1.5A1.5,1.5,0,0,0,16.5,0M17,19H2.5a2.471,2.471,0,0,0-1.5.513V2.5A1.5,1.5,0,0,1,2.5,1h14a.5.5,0,0,1,.5.5Z" fill="#fff"/>
    <path id="Path_1487" data-name="Path 1487" d="M17.5,21H3.5a.5.5,0,0,0,0,1h14a.5.5,0,0,0,0-1" fill="#fff"/>
    <path id="Path_1488" data-name="Path 1488" d="M9.949,5.028a1.5,1.5,0,0,0-1.9,0L3.183,9.007a.5.5,0,0,0,.633.775L8.683,5.8a.5.5,0,0,1,.633,0l4.867,3.98a.5.5,0,1,0,.633-.775Z" fill="#fff"/>
    <path id="Path_1489" data-name="Path 1489" d="M13,9.9a.5.5,0,0,0-.5.5v3.5a.5.5,0,0,1-.5.5H10.5V12.9a1.5,1.5,0,0,0-3,0v1.5H6a.5.5,0,0,1-.5-.5V10.4a.5.5,0,0,0-1,0v3.5A1.5,1.5,0,0,0,6,15.4h6a1.5,1.5,0,0,0,1.5-1.5V10.4a.5.5,0,0,0-.5-.5M9.5,14.4h-1V12.9a.5.5,0,0,1,1,0Z" fill="#fff"/>
  </g>
</svg>
`,
  cameraCapture: `
<svg id="camera-capture" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="28" height="24" viewBox="0 0 28 24">
  <defs>
    <clipPath id="cameraCaptureclip-path">
      <rect id="Rectangle_2738" data-name="Rectangle 2738" width="28" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_529" data-name="Group 529" clip-path="url(#cameraCaptureclip-path)">
    <path id="Path_1455" data-name="Path 1455" d="M24.37,4.174H21.287a1.672,1.672,0,0,1-1.224-.635L18.387,1.066A2.726,2.726,0,0,0,16.356,0H11.615A2.725,2.725,0,0,0,9.6,1.09L7.5,4.174l-3.927,0A3.978,3.978,0,0,0,0,8.206V20.348A3.645,3.645,0,0,0,3.63,24H24.37A3.645,3.645,0,0,0,28,20.348V8.212a3.99,3.99,0,0,0-3.63-4.038m2.593,16.174a2.6,2.6,0,0,1-2.593,2.609H3.63a2.6,2.6,0,0,1-2.592-2.609V8.2A2.935,2.935,0,0,1,3.63,5.218H7.778a.521.521,0,0,0,.429-.228L10.436,1.7a1.663,1.663,0,0,1,1.208-.657h4.683a1.665,1.665,0,0,1,1.221.635l1.676,2.474a2.735,2.735,0,0,0,2.033,1.066l3.06,0a2.946,2.946,0,0,1,2.646,2.991Z" fill="#fff"/>
    <path id="Path_1456" data-name="Path 1456" d="M14,8.348a5.739,5.739,0,1,0,5.7,5.739A5.729,5.729,0,0,0,14,8.348m0,10.435a4.7,4.7,0,1,1,4.667-4.7A4.687,4.687,0,0,1,14,18.783" fill="#fff"/>
  </g>
</svg>
`,
  galleryImport: `
<svg id="gallery-import" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="galleryImportclip-path">
      <rect id="Rectangle_2739" data-name="Rectangle 2739" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_531" data-name="Group 531" clip-path="url(#galleryImportclip-path)">
    <path id="Path_1457" data-name="Path 1457" d="M19.7,18.1V1.6A1.6,1.6,0,0,0,18.1,0H1.6A1.6,1.6,0,0,0,0,1.6V18.1a1.6,1.6,0,0,0,1.6,1.6H18.1a1.6,1.6,0,0,0,1.6-1.6M1.6,1H18.1a.6.6,0,0,1,.6.6V15.4H16.236L13.472,8.489c-.258-.659-.695-.74-.872-.745a1.019,1.019,0,0,0-.911.7L9.722,12.768l-1.5-1.8A1.236,1.236,0,0,0,7.1,10.427a1.211,1.211,0,0,0-1,.659L3.516,15.4H1V1.6A.6.6,0,0,1,1.6,1M15.159,15.4H4.682l2.3-3.842a.236.236,0,0,1,.194-.134.273.273,0,0,1,.241.142L9.464,14.02a.5.5,0,0,0,.839-.113L12.57,8.924ZM1,18.1V16.4H18.7v1.7a.6.6,0,0,1-.6.6H1.6a.6.6,0,0,1-.6-.6" fill="#fff"/>
    <path id="Path_1458" data-name="Path 1458" d="M22.55,6.571l-1.1-.1a.5.5,0,0,0-.091,1l1.1.1a.6.6,0,0,1,.541.65l-1.3,14.24a.6.6,0,0,1-.653.54L5.714,21.6a.5.5,0,0,0-.09,1l15.332,1.4A1.414,1.414,0,0,0,21.1,24a1.606,1.606,0,0,0,1.593-1.45l1.3-14.243A1.606,1.606,0,0,0,22.55,6.571" fill="#fff"/>
    <path id="Path_1459" data-name="Path 1459" d="M5.449,7.6A2.15,2.15,0,1,0,3.3,5.45,2.152,2.152,0,0,0,5.449,7.6m0-3.3A1.15,1.15,0,1,1,4.3,5.45,1.151,1.151,0,0,1,5.449,4.3" fill="#fff"/>
  </g>
</svg>
`,
  fileOperations: `
<svg id="file-operations" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="fileOpclip-path">
      <rect id="Rectangle_2763" data-name="Rectangle 2763" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_558" data-name="Group 558" clip-path="url(#fileOpclip-path)">
    <path id="Path_1490" data-name="Path 1490" d="M13.5,19H9.949A3.494,3.494,0,0,0,6.5,16H1v-.5a.5.5,0,0,0-1,0v8a.5.5,0,0,0,1,0V23H16.5a.5.5,0,0,0,.5-.5A3.5,3.5,0,0,0,13.5,19M1,22V17H6.5a2.5,2.5,0,0,1,2.449,2H5.5a.5.5,0,0,0,0,1h8a2.5,2.5,0,0,1,2.45,2Z" fill="#fff"/>
    <path id="Path_1491" data-name="Path 1491" d="M23.56,3.854,20.146.44A1.492,1.492,0,0,0,19.085,0H8.5A1.5,1.5,0,0,0,7,1.5v12a.5.5,0,0,0,1,0V1.5A.5.5,0,0,1,8.5,1H19.085a.5.5,0,0,1,.354.147l3.414,3.414A.5.5,0,0,1,23,4.915V19.5a.5.5,0,0,1-.5.5H19a.5.5,0,1,0,0,1h3.5A1.5,1.5,0,0,0,24,19.5V4.915a1.491,1.491,0,0,0-.439-1.061" fill="#fff"/>
  </g>
</svg>  
`,
  copyTo: `
<svg id="copy-to" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="24" viewBox="0 0 20 24">
  <defs>
    <clipPath id="copyToclip-path">
      <rect id="Rectangle_2765" data-name="Rectangle 2765" width="20" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_562" data-name="Group 562" clip-path="url(#copyToclip-path)">
    <path id="Path_1504" data-name="Path 1504" d="M19.561,3.854,16.146.439A1.49,1.49,0,0,0,15.086,0H4.5A1.5,1.5,0,0,0,3,1.5V3H1.5A1.5,1.5,0,0,0,0,4.5v18A1.5,1.5,0,0,0,1.5,24h14A1.5,1.5,0,0,0,17,22.5V21h1.5A1.5,1.5,0,0,0,20,19.5V4.914a1.49,1.49,0,0,0-.439-1.06M16,22.5a.5.5,0,0,1-.5.5H1.5a.5.5,0,0,1-.5-.5V4.5A.5.5,0,0,1,1.5,4H3V19.5A1.5,1.5,0,0,0,4.5,21H16Zm3-3a.5.5,0,0,1-.5.5H4.5a.5.5,0,0,1-.5-.5V1.5A.5.5,0,0,1,4.5,1H15.086a.5.5,0,0,1,.353.146l3.415,3.415A.5.5,0,0,1,19,4.914Z" fill="#fff"/>
    <path id="Path_1505" data-name="Path 1505" d="M14.842,10.141l0-.007L12.6,7.885a.5.5,0,0,0-.719.695l.012.012,1.4,1.4h-4.8a.5.5,0,0,0,0,1h4.793l-1.4,1.4a.5.5,0,1,0,.707.707l2.249-2.25a.5.5,0,0,0,.109-.545.53.53,0,0,0-.109-.163" fill="#fff"/>
  </g>
</svg>
`,
  moveTo: `
<svg id="move-to" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="moveToclip-path">
      <rect id="Rectangle_2764" data-name="Rectangle 2764" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_560" data-name="Group 560" clip-path="url(#moveToclip-path)">
    <path id="Path_1492" data-name="Path 1492" d="M13.71,12.528l-1.147,1.146a.5.5,0,0,0,.708.708l2-2a.5.5,0,0,0,0-.708l-2-2a.5.5,0,0,0-.708.708l1.147,1.146H5.917c-.552,0-1.1,1,0,1Z" fill="#fff"/>
    <path id="Path_1493" data-name="Path 1493" d="M.5,13.241a.5.5,0,0,0-.5.5v1.87a1.6,1.6,0,0,0,.01.17A.474.474,0,0,0,.5,16.2a.375.375,0,0,0,.067,0A.522.522,0,0,0,1,15.611v-1.87a.5.5,0,0,0-.5-.5" fill="#fff"/>
    <path id="Path_1494" data-name="Path 1494" d="M.5,9.282a.5.5,0,0,0-.5.5v1.979a.5.5,0,0,0,1,0V9.782a.5.5,0,0,0-.5-.5" fill="#fff"/>
    <path id="Path_1495" data-name="Path 1495" d="M12.385,3.258a.4.4,0,0,1,.115.277v.958a.5.5,0,0,0,1,0V3.535a1.389,1.389,0,0,0-.407-.983l-.229-.229a.5.5,0,0,0-.707.707Z" fill="#fff"/>
    <path id="Path_1496" data-name="Path 1496" d="M9.415,1h.549a.4.4,0,0,1,.276.113l.517.517a.5.5,0,0,0,.719-.695L11.464.923,10.946.405A1.386,1.386,0,0,0,9.964,0H9.415a.5.5,0,0,0,0,1" fill="#fff"/>
    <path id="Path_1497" data-name="Path 1497" d="M.5,5.323a.5.5,0,0,0-.5.5V7.8a.5.5,0,0,0,1,0V5.823a.5.5,0,0,0-.5-.5" fill="#fff"/>
    <path id="Path_1498" data-name="Path 1498" d="M8.021,16H6.042a.5.5,0,0,0,0,1H8.021a.5.5,0,0,0,0-1" fill="#fff"/>
    <path id="Path_1499" data-name="Path 1499" d="M7.436,1a.5.5,0,0,0,0-1H5.457a.5.5,0,0,0,0,1Z" fill="#fff"/>
    <path id="Path_1500" data-name="Path 1500" d="M.5,1.364a.5.5,0,0,0-.5.5V3.843a.5.5,0,0,0,1,0V1.864a.5.5,0,0,0-.5-.5" fill="#fff"/>
    <path id="Path_1501" data-name="Path 1501" d="M4.062,16H2.082a.5.5,0,0,0,0,1h1.98a.5.5,0,0,0,0-1" fill="#fff"/>
    <path id="Path_1502" data-name="Path 1502" d="M3.977.5a.5.5,0,0,0-.5-.5H1.5a.5.5,0,0,0,0,1H3.477a.5.5,0,0,0,.5-.5" fill="#fff"/>
    <path id="Path_1503" data-name="Path 1503" d="M23.594,9.552,21.447,7.405A1.385,1.385,0,0,0,20.465,7H13.5V6.5a.5.5,0,0,0-1,0v1A.5.5,0,0,0,13,8h7.465a.4.4,0,0,1,.276.113l2.145,2.145a.4.4,0,0,1,.114.276V22.611a.39.39,0,0,1-.389.389H11.889a.39.39,0,0,1-.389-.389V16.5A.5.5,0,0,0,11,16H10a.5.5,0,0,0,0,1h.5v5.611A1.39,1.39,0,0,0,11.889,24H22.611A1.39,1.39,0,0,0,24,22.611V10.534a1.381,1.381,0,0,0-.406-.982" fill="#fff"/>
  </g>
</svg>
`,
  selectAll: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" stroke-width="1"> <path d="M9 11l3 3l8 -8"></path> <path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9"></path> </svg> 
`,
  download: `
<svg id="download" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="downloadclip-path">
      <rect id="Rectangle_2741" data-name="Rectangle 2741" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_535" data-name="Group 535" clip-path="url(#downloadclip-path)">
    <path id="Path_1463" data-name="Path 1463" d="M23.491,9.892a.507.507,0,0,0-.509.505V22.108a.87.87,0,0,1-.851.882H1.877a.874.874,0,0,1-.86-.89V10.4A.509.509,0,0,0,0,10.4V22.092A1.888,1.888,0,0,0,1.869,24h20.27A1.886,1.886,0,0,0,24,22.1V10.4a.507.507,0,0,0-.509-.505" fill="#fff"/>
    <path id="Path_1464" data-name="Path 1464" d="M11.64,18.578a.438.438,0,0,0,.086.056.5.5,0,0,0,.078.051.521.521,0,0,0,.194.039h0a.17.17,0,0,0,.024-.005.539.539,0,0,0,.168-.033.521.521,0,0,0,.17-.113l4.291-4.219a.5.5,0,0,0,0-.714.512.512,0,0,0-.72,0l-3.428,3.371V.5A.509.509,0,0,0,11.49.5v16.5L8.062,13.636a.513.513,0,0,0-.72,0,.5.5,0,0,0,0,.715Z" fill="#fff"/>
  </g>
</svg>
`,
  delete: `
<svg id="delete" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="deleteclip-path">
      <rect id="Rectangle_2735" data-name="Rectangle 2735" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_523" data-name="Group 523" clip-path="url(#deleteclip-path)">
    <path id="Path_1447" data-name="Path 1447" d="M23.5,4H17V1.5A1.5,1.5,0,0,0,15.5,0h-7A1.5,1.5,0,0,0,7,1.5V4H.5a.5.5,0,0,0,0,1H2.55L4.314,21.761A2.494,2.494,0,0,0,6.8,24H17.2a2.494,2.494,0,0,0,2.485-2.239L21.45,5H23.5a.5.5,0,0,0,0-1M8,1.5A.5.5,0,0,1,8.5,1h7a.5.5,0,0,1,.5.5V4H8ZM18.691,21.657A1.5,1.5,0,0,1,17.2,23H6.8a1.5,1.5,0,0,1-1.492-1.343L3.555,5h16.89Z" fill="#fff"/>
    <path id="Path_1448" data-name="Path 1448" d="M12,8.5a.5.5,0,0,0-.5.5V19.5a.5.5,0,0,0,1,0V9a.5.5,0,0,0-.5-.5" fill="#fff"/>
    <path id="Path_1449" data-name="Path 1449" d="M16,8.976l-.5,10.5a.5.5,0,0,0,.476.523H16a.5.5,0,0,0,.5-.476l.5-10.5a.5.5,0,1,0-1-.048" fill="#fff"/>
    <path id="Path_1450" data-name="Path 1450" d="M7.476,8.5A.5.5,0,0,0,7,9.024l.5,10.5A.5.5,0,0,0,8,20h.025a.5.5,0,0,0,.475-.523L8,8.977A.5.5,0,0,0,7.476,8.5" fill="#fff"/>
  </g>
</svg>
`,
  back: `
<svg id="back" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="backclip-path">
      <rect id="Rectangle_2781" data-name="Rectangle 2781" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_597" data-name="Group 597" clip-path="url(#backclip-path)">
    <path id="Path_1555" data-name="Path 1555" d="M0,12A12,12,0,1,0,12,0,12.013,12.013,0,0,0,0,12m1,0A11,11,0,1,1,12,23,11.013,11.013,0,0,1,1,12" fill="#fff"/>
    <path id="Path_1556" data-name="Path 1556" d="M4.138,12a.17.17,0,0,1,.005-.024.512.512,0,0,1,.033-.168.532.532,0,0,1,.113-.17l4.219-4.29a.5.5,0,0,1,.714,0,.51.51,0,0,1,0,.719L5.855,11.491h13.5a.509.509,0,0,1,0,1.018H5.853l3.373,3.428a.512.512,0,0,1,0,.72.5.5,0,0,1-.714,0L4.284,12.359a.438.438,0,0,1-.056-.086.5.5,0,0,1-.051-.078A.521.521,0,0,1,4.138,12h0" fill="#fff"/>
  </g>
</svg>
`,
  emptyLibrary: `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="291.648" height="257.641" viewBox="0 0 291.648 257.641">
  <defs>
    <clipPath id="emptyLibraryclip-path">
      <rect id="Rectangle_2706" data-name="Rectangle 2706" width="291.648" height="257.641" transform="translate(12.66)" fill="none"/>
    </clipPath>
  </defs>
  <g id="image-empty" transform="translate(-12.66)">
    <g id="Group_471" data-name="Group 471" clip-path="url(#emptyLibraryclip-path)">
      <path id="Path_1418" data-name="Path 1418" d="M160.751,255.727c-66.485,0-118.227-5.845-142.606-73.507-24.415-67.766,19.034-164.7,91.047-166.173,48.757-1,31.942,48.623,74.131,72.638,32.339,18.408,117.378-36.39,113.723,42.777-3.321,71.951-64.267,124.265-136.3,124.265" transform="translate(1.351 1.915)" fill="#f8f8f8"/>
      <path id="Path_1419" data-name="Path 1419" d="M18.1,93.9a9.048,9.048,0,1,1-9.048-9.048A9.048,9.048,0,0,1,18.1,93.9" transform="translate(12.66 5.997)" fill="#e0e0e0"/>
      <path id="Path_1420" data-name="Path 1420" d="M230.481,202.978a9.048,9.048,0,1,1-9.048-9.048,9.048,9.048,0,0,1,9.048,9.048" transform="translate(25.364 23.16)" fill="#e0e0e0"/>
      <path id="Path_1421" data-name="Path 1421" d="M34.644,204.233a5.928,5.928,0,1,1-5.928-5.928,5.928,5.928,0,0,1,5.928,5.928" transform="translate(2.721 23.683)" fill="#e0e0e0"/>
      <path id="Path_1422" data-name="Path 1422" d="M190.8,199.7c0,1.208-25.187,7.8-54.651,7.8S84.1,200.906,84.1,199.7s22.064-4.679,51.527-4.679S190.8,198.493,190.8,199.7" transform="translate(10.044 23.29)" fill="#e0e0e0"/>
      <path id="Path_1423" data-name="Path 1423" d="M278.22,131.008a13.14,13.14,0,1,1-13.141-13.14A13.142,13.142,0,0,1,278.22,131.008Z" transform="translate(23.088 14.076)" fill="none" stroke="#e0e0e0" stroke-miterlimit="10" stroke-width="2"/>
      <path id="Path_1424" data-name="Path 1424" d="M137.744,113.388V195.23L58.638,161.4V84.531s79.6,29.354,79.106,28.857" transform="translate(7.003 10.095)" fill="#fff4eb"/>
      <path id="Path_1425" data-name="Path 1425" d="M137.744,113.388V195.23L58.638,161.4V84.531S138.241,113.885,137.744,113.388Z" transform="translate(7.003 10.095)" fill="none" stroke="#f4cba2" stroke-miterlimit="10" stroke-width="1"/>
      <path id="Path_1426" data-name="Path 1426" d="M129.224,113.388V195.23L208.331,161.4V84.531s-79.6,29.354-79.106,28.857" transform="translate(15.432 10.095)" fill="#fff4eb"/>
      <path id="Path_1427" data-name="Path 1427" d="M129.224,113.388V195.23L208.331,161.4V84.531S128.727,113.885,129.224,113.388Z" transform="translate(15.432 10.095)" fill="none" stroke="#f4cba2" stroke-miterlimit="10" stroke-width="1"/>
      <path id="Path_1428" data-name="Path 1428" d="M136.187,63.156,58.139,86.447,137.649,116.3l79.6-29.7Z" transform="translate(6.943 7.542)" fill="#f2c097"/>
      <path id="Path_1429" data-name="Path 1429" d="M40.67,110.107l19.994-25.58L139.1,112.942l-22.392,26.6Z" transform="translate(4.857 10.095)" fill="#f9dec2"/>
      <path id="Path_1430" data-name="Path 1430" d="M60.952,85.263l77.3,28-21.618,25.681L41.672,109.928Zm-.382-1.329L39.861,110.427l77.116,29.851,23.165-27.519Z" transform="translate(4.76 10.024)" fill="#f4cba2"/>
      <path id="Path_1431" data-name="Path 1431" d="M129.194,113.529l23.321,27.861,75.561-30.038-19.4-26.836Z" transform="translate(15.429 10.093)" fill="#f9dec2"/>
      <path id="Path_1432" data-name="Path 1432" d="M129.194,113.529l23.321,27.861,75.561-30.038-19.4-26.836Z" transform="translate(15.429 10.093)" fill="none" stroke="#f4cba2" stroke-miterlimit="10" stroke-width="1"/>
      <line id="Line_79" data-name="Line 79" x1="29.852" y1="30.847" transform="translate(46.611 39.852)" fill="none" stroke="#e5e5e5" stroke-miterlimit="10" stroke-width="3"/>
      <line id="Line_80" data-name="Line 80" x1="13.433" y1="29.852" transform="translate(95.866 25.921)" fill="none" stroke="#e5e5e5" stroke-miterlimit="10" stroke-width="3"/>
      <line id="Line_81" data-name="Line 81" y1="49.255" x2="1.492" transform="translate(141.638 0.05)" fill="none" stroke="#e5e5e5" stroke-miterlimit="10" stroke-width="3"/>
      <line id="Line_82" data-name="Line 82" y1="30.847" x2="13.433" transform="translate(172.982 25.424)" fill="none" stroke="#e5e5e5" stroke-miterlimit="10" stroke-width="3"/>
      <line id="Line_83" data-name="Line 83" y1="30.847" x2="32.339" transform="translate(205.818 39.354)" fill="none" stroke="#e5e5e5" stroke-miterlimit="10" stroke-width="3"/>
    </g>
  </g>
</svg>
  `,
};

const EMPTY_CONTENT_CONTAINER_HTML = `
${ICONS.emptyLibrary}
<div class="title">
  Add your first page!
</div>
<div class="desc">
  <ul>
    <li>Click "<b>Capture</b>" for live images</li>
    <li>Click "<b>Import</b>" for existing images</li>
  </ul>
</div>
`;

const DOCUMENT_VIEW_CONTROLS_HTML = `
  <div class="mwc-document-view-control-btn">
    <div class="mwc-document-view-control-icon">${ICONS.library}</div>
    <div>Library</div>
  </div>
  <div class="mwc-document-view-control-btn">
    <div class="mwc-document-view-control-icon">${ICONS.cameraCapture}</div>
    <div>Capture</div>
  </div>
  <div class="mwc-document-view-control-btn">
    <div class="mwc-document-view-control-icon">${ICONS.galleryImport}</div>
    <div>Import</div>
  </div>
    <div class="mwc-document-view-control-btn">
    <div class="mwc-document-view-control-icon">${ICONS.fileOperations}</div>
    <div>Manage</div>
  </div>
`;

const SELECTED_DOCUMENT_VIEW_CONTROLS_HTML = `
  <div class="mwc-document-view-control-btn selected">
    <div class="mwc-document-view-control-icon">${ICONS.copyTo}</div>
    <div>Copy To</div>
  </div>
  <div class="mwc-document-view-control-btn selected">
    <div class="mwc-document-view-control-icon">${ICONS.moveTo}</div>
    <div>Move To</div>
  </div>
  <div class="mwc-document-view-control-btn selected">
    <div class="mwc-document-view-control-icon">${ICONS.selectAll}</div>
    <div>Select All</div>
  </div>
  <div class="mwc-document-view-control-btn selected">
    <div class="mwc-document-view-control-icon">${ICONS.delete}</div>
    <div>Delete</div>
  </div>
  <div class="mwc-document-view-control-btn selected back">
    <div class="mwc-document-view-control-icon">${ICONS.back}</div>
    <div>Back</div>
  </div>
`;

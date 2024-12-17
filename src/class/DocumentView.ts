import { BrowseViewer, DDV, IDocument } from "dynamsoft-document-viewer";
import { isMobile, showInfoDialog } from "../util";
import { MWC_ICONS } from "../util/icons";

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
  downloadBtn: HTMLElement;
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
    this.downloadBtn = this.toolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(4)");
    this.fileOperationsBtn = this.toolbarContainer.querySelector(".mwc-document-view-control-btn:nth-child(5)");

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
    this.downloadBtn?.addEventListener("click", () => DocumentView.handleDownload(this.browseViewer.currentDocument));
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

  static handleDownload(doc: IDocument) {
    if (doc?.pages?.length) {
      doc
        .saveToPdf({
          mimeType: "application/octet-stream",
          saveAnnotation: "annotation",
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${doc.name}.pdf`;
          a.click();
          a.remove();
        });
    } else {
      console.warn("Failed to download. Document contains no pages");
    }
  }

  static async handleUpload(doc: IDocument, uploadUrl: string) {
    const pdfBlob = await doc.saveToPdf({
      mimeType: "application/pdf",
      saveAnnotation: "annotation",
    });

    const formData = new FormData();
    formData.append("file", pdfBlob, `${doc.name}.pdf`);
    formData.append("documentName", doc.name);
    formData.append("uploadTime", new Date().toISOString());

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response;
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

const EMPTY_CONTENT_CONTAINER_HTML = `
${MWC_ICONS.emptyLibrary}
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
    <div class="mwc-document-view-control-icon">${MWC_ICONS.download}</div>
    <div>Download</div>
  </div>
  <div class="mwc-document-view-control-btn">
    <div class="mwc-document-view-control-icon">${MWC_ICONS.fileOperations}</div>
    <div>Manage</div>
  </div>
`;

const SELECTED_DOCUMENT_VIEW_CONTROLS_HTML = `
  <div class="mwc-document-view-control-btn selected">
    <div class="mwc-document-view-control-icon">${MWC_ICONS.copyTo}</div>
    <div>Copy To</div>
  </div>
  <div class="mwc-document-view-control-btn selected">
    <div class="mwc-document-view-control-icon">${MWC_ICONS.moveTo}</div>
    <div>Move To</div>
  </div>
  <div class="mwc-document-view-control-btn selected">
    <div class="mwc-document-view-control-icon">${MWC_ICONS.selectAll}</div>
    <div>Select All</div>
  </div>
  <div class="mwc-document-view-control-btn selected">
    <div class="mwc-document-view-control-icon">${MWC_ICONS.delete}</div>
    <div>Delete</div>
  </div>
  <div class="mwc-document-view-control-btn selected back">
    <div class="mwc-document-view-control-icon">${MWC_ICONS.back}</div>
    <div>Back</div>
  </div>
`;

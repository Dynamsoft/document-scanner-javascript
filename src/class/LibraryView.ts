import { DDV, IDocument } from "dynamsoft-document-viewer";
import { DocumentItem } from "../component/DocumentItem";
import { showInfoDialog } from "../util";
import { MWC_ICONS } from "../util/icons";

export interface LibraryViewConfig {
  container: HTMLElement;
  onCameraCapture?: () => Promise<void>;
  onGalleryImport?: () => Promise<void>;
  onDocumentCreated?: (docId: string) => void;
  onDocumentClick?: (docId: string) => void;
}

export class LibraryView {
  checkedDocUids: string[] = [];
  docItems: DocumentItem[] = [];

  docSelectAll: HTMLElement; // todo
  enterSelectionMode: HTMLElement; //todo
  cancelSelectionMode: HTMLElement; //todo

  headerContainer: HTMLElement;
  emptyContentContainer: HTMLElement;
  libraryContentContainer: HTMLElement;

  toolbarContainer: HTMLElement;
  selectedToolbarContainer: HTMLElement;

  addNewBtn: HTMLElement;
  cameraCaptureBtn: HTMLElement;
  galleryInputBtn: HTMLElement;
  uploadedFilesBtn: HTMLElement;

  shareBtn: HTMLElement;
  printBtn: HTMLElement;
  uploadBtn: HTMLElement;
  downloadBtn: HTMLElement;
  deleteBtn: HTMLElement;
  backBtn: HTMLElement;

  constructor(private config: LibraryViewConfig) {}

  initialize() {
    if (!this.config.container) {
      throw new Error("Please create a Library Container element");
    }

    this.createUI();
    this.bindDocumentManagerEvents();
    this.setVisible(false);
  }

  setVisible(visible: boolean) {
    this.config.container.style.display = visible ? "flex" : "none";

    this.toggleShowSelectedToolbar();

    if (visible) {
      const docs = DDV.documentManager.getAllDocuments();
      const docCount = docs.length;

      this.toggleShowContentContainer(!!docCount);

      if (docCount) {
        this.docItems.forEach((item) => {
          item.update();
          // item.toggleDocRenameMode(false);
        });
      }
    }
  }

  private createUI() {
    // Reset Element
    this.config.container.textContent = "";

    this.createStylesheet();
    this.createHeader();
    this.createLibraryDocuments();
    this.createToolbar();
  }

  private createStylesheet() {
    // Create style
    const styleSheet = document.createElement("style");
    styleSheet.textContent = DEFAULT_LIBRARY_STYLE;
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
    this.headerContainer.className = "mwc-library-header";
    this.headerContainer.textContent = "Library";

    this.config.container.append(this.headerContainer);
  }

  private createLibraryDocuments() {
    this.libraryContentContainer = document.createElement("div");
    this.libraryContentContainer.className = "mwc-library-content";

    this.emptyContentContainer = document.createElement("div");
    this.emptyContentContainer.className = "mwc-library-content-empty";
    this.emptyContentContainer.innerHTML = EMPTY_CONTENT_CONTAINER_HTML;

    this.config.container.append(this.libraryContentContainer);
    this.config.container.append(this.emptyContentContainer);
  }

  private createToolbar() {
    this.toolbarContainer = document.createElement("div");
    this.toolbarContainer.className = "mwc-library-controls";
    this.toolbarContainer.innerHTML = LIBRARY_CONTROLS_HTML;

    this.selectedToolbarContainer = document.createElement("div");
    this.selectedToolbarContainer.className = "mwc-library-controls";
    this.selectedToolbarContainer.innerHTML = SELECTED_LIBRARY_CONTROLS_HTML;

    this.config.container.append(this.toolbarContainer);
    this.config.container.append(this.selectedToolbarContainer);

    this.bindToolbarEvents();
  }

  private toggleShowContentContainer(show: boolean) {
    this.emptyContentContainer.style.display = show ? "none" : "flex";
    this.libraryContentContainer.style.display = show ? "flex" : "none";
  }

  private toggleShowSelectedToolbar() {
    this.checkedDocUids = [];
    this.docItems.forEach((item) => {
      if (item.checked) {
        this.checkedDocUids.push(item.getUid());
      }
    });
    const show = !!this.checkedDocUids.length;

    this.toolbarContainer.style.display = show ? "none" : "flex";
    this.selectedToolbarContainer.style.display = show ? "flex" : "none";

    // Set disabled attribute and class for buttons
    const isSingleSelection = this.checkedDocUids.length === 1;

    this.printBtn.classList.toggle("selected", isSingleSelection);
    this.printBtn.classList.toggle("disabled", !isSingleSelection);
    this.printBtn.setAttribute("disabled", isSingleSelection ? "false" : "true");
  }

  private bindDocumentManagerEvents() {
    DDV.documentManager.on("documentCreated", (e) => {
      // const emptyContainer = this.dom.getElementsByClassName("empty-container")[0];

      // if(emptyContainer.style.display !== "none") {
      //     this._showEmptyImageInfo(false)
      // }
      const docItem = new DocumentItem({
        docId: e.docUid,
        onCheckedChange: () => this.handleDocumentChecked(),
        onDocumentClick: (docId) => this.handleDocumentClick(docId),
      });

      // Add to start of array
      this.docItems.unshift(docItem);

      // Insert at beginning of container
      if (this.libraryContentContainer.firstChild) {
        this.libraryContentContainer.insertBefore(docItem.getDom(), this.libraryContentContainer.firstChild);
      } else {
        this.libraryContentContainer.appendChild(docItem.getDom());
      }
    });

    DDV.documentManager.on("documentDeleted", (e) => {
      this.docItems.forEach((item, index) => {
        if (item.getUid() === e.docUid) {
          item.dispose();
          this.docItems.splice(index, 1);
        }
      });
    });
  }

  private bindToolbarEvents() {
    // Normal mode toolbar
    this.addNewBtn = this.toolbarContainer.querySelector(".mwc-library-control-btn:nth-child(1)");
    this.cameraCaptureBtn = this.toolbarContainer.querySelector(".mwc-library-control-btn:nth-child(2)");
    this.galleryInputBtn = this.toolbarContainer.querySelector(".mwc-library-control-btn:nth-child(3)");
    this.uploadedFilesBtn = this.toolbarContainer.querySelector(".mwc-library-control-btn:nth-child(4)");

    // Selection mode toolbar
    this.shareBtn = this.selectedToolbarContainer.querySelector(".mwc-library-control-btn:nth-child(1)");
    this.printBtn = this.selectedToolbarContainer.querySelector(".mwc-library-control-btn:nth-child(2)");
    this.uploadBtn = this.selectedToolbarContainer.querySelector(".mwc-library-control-btn:nth-child(3)");
    this.downloadBtn = this.selectedToolbarContainer.querySelector(".mwc-library-control-btn:nth-child(4)");
    this.deleteBtn = this.selectedToolbarContainer.querySelector(".mwc-library-control-btn:nth-child(5)");
    this.backBtn = this.selectedToolbarContainer.querySelector(".mwc-library-control-btn:nth-child(6)");

    // Bind normal mode events
    this.addNewBtn?.addEventListener("click", async () => {
      await this.handleNewDocument();
      showInfoDialog("Created", this.config.container);
    });
    this.cameraCaptureBtn?.addEventListener("click", async () => await this.config.onCameraCapture());
    this.galleryInputBtn?.addEventListener("click", async () => await this.config.onGalleryImport());
    // this.uploadedFilesBtn?.addEventListener("click", () => this.handleUploadedFiles());

    // // Bind selection mode events
    this.shareBtn?.addEventListener("click", async () => await this.handleShare());
    this.printBtn?.addEventListener("click", () => this.handlePrint());
    // this.uploadBtn?.addEventListener("click", () => this.handleUpload());
    this.downloadBtn?.addEventListener("click", () => this.handleDownload());
    this.deleteBtn?.addEventListener("click", () => {
      this.handleDelete();
      showInfoDialog("Deleted", this.config.container);
    });
    this.backBtn?.addEventListener("click", () => this.handleBackButton());
  }

  private handleDocumentChecked() {
    this.toggleShowSelectedToolbar();
  }

  async createAndLoadDocument(
    sources?: Array<{
      convertMode: string;
      fileData: Blob;
      renderOptions?: {
        renderAnnotations?: string;
      };
    }>
  ) {
    try {
      // Create new document
      const doc = DDV.documentManager.createDocument({
        name: `Doc-${Date.now()}`,
      });

      // Load all sources
      if (sources) {
        await doc.loadSource(sources);
      }

      return doc;
    } catch (ex: any) {
      let errMsg = ex.message || ex;
      alert(`Failed to create and load document: ${errMsg}`);
      console.error("Failed to create and load document: ", errMsg);
    }
  }

  private async handleNewDocument() {
    await this.createAndLoadDocument();

    this.setVisible(true);
  }

  private async handleShare() {
    const files = [];

    for (let i = 0; i < this.checkedDocUids.length; i++) {
      const doc = DDV.documentManager.getDocument(this.checkedDocUids[i]);
      if (doc.pages.length) {
        const pdfBlob = await doc.saveToPdf({
          mimeType: "application/octet-stream",
          saveAnnotation: "annotation",
        });
        files.push(new File([pdfBlob], `${doc.name}.pdf`, { type: "application/pdf" }));
      }
    }

    if (navigator.canShare && navigator.canShare({ files })) {
      navigator.share({
        files,
        title: "PDF Files",
      });
    } else {
      alert(`Your system doesn't support sharing PDF files.`);
    }
  }

  private async handlePrint() {
    if (this.checkedDocUids.length > 1) {
      console.warn("Please select 1 document to print");
      return;
    }

    const docUid = this.checkedDocUids[0];
    const doc = DDV.documentManager.getDocument(docUid);

    if (doc.pages) {
      doc.print();
    }
  }

  private handleDownload() {
    const docDownload = (doc: IDocument) => {
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
    };

    this.checkedDocUids.forEach((uid) => {
      const doc = DDV.documentManager.getDocument(uid);
      if (doc.pages.length) {
        docDownload(doc);
      }
    });
  }

  private handleDelete() {
    DDV.documentManager.deleteDocuments([...this.checkedDocUids]);

    this.setVisible(true);
    this.toggleShowSelectedToolbar();
  }

  private handleBackButton() {
    // Uncheck all documents
    this.docItems.forEach((item) => item.uncheckDocument());
    this.checkedDocUids = [];

    this.toggleShowSelectedToolbar();
  }

  private handleDocumentClick(docId: string) {
    this.config.onDocumentClick?.(docId);
  }
}

const DEFAULT_LIBRARY_STYLE = `
.mwc-library-header {
display: flex;
font-family: Verdana;
height: 48px;
font-size: 24px;
align-items: center;
justify-content: center;
background-color: #F5F5F5;
flex: 0 1 48px;
padding: 0.5rem;
user-select: none;
}

.mwc-library-content {
  flex: 1 1 auto;
  overflow-y: auto;
  display: none;
  justify-content: start;
  flex-direction: column;
  padding: 15px;
  gap: 15px;
  margin-bottom: 30px;
}

.mwc-library-content-empty {
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

.mwc-library-content-empty .title {
  margin-top: 2rem;
  font-size: 24px;
}

.mwc-library-content-empty .desc {
  font-size: 16px;
}

.mwc-library-controls {
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

.mwc-library-control-btn {
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

.mwc-library-control-btn.selected {
  background-color: #E36605;
}

.mwc-library-control-btn.selected.back {
  background-color: #323234;
}

.mwc-library-control-btn.disabled {
  background-color: #323234;
  cursor: not-allowed;
}

.mwc-library-control-icon {
  height: 24px;
  width: 24px;
}

.mwc-library-control-icon svg {
  width: 24px;
  height: 24px;
}
`;

const LIBRARY_CONTROLS_HTML = `
  <div class="mwc-library-control-btn">
    <div class="mwc-library-control-icon">${MWC_ICONS.newDoc}</div>
    <div>New</div>
  </div>
  <div class="mwc-library-control-btn">
    <div class="mwc-library-control-icon">${MWC_ICONS.cameraCapture}</div>
    <div>Capture</div>
  </div>
  <div class="mwc-library-control-btn">
    <div class="mwc-library-control-icon">${MWC_ICONS.galleryImport}</div>
    <div>Import</div>
  </div>
    <div class="mwc-library-control-btn">
    <div class="mwc-library-control-icon">${MWC_ICONS.uploadedFiles}</div>
    <div>History</div>
  </div>
`;

const SELECTED_LIBRARY_CONTROLS_HTML = `
  <div class="mwc-library-control-btn selected">
    <div class="mwc-library-control-icon">${MWC_ICONS.share}</div>
    <div>Share</div>
  </div>
  <div class="mwc-library-control-btn selected">
    <div class="mwc-library-control-icon">${MWC_ICONS.print}</div>
    <div>Print</div>
  </div>
  <div class="mwc-library-control-btn selected">
    <div class="mwc-library-control-icon">${MWC_ICONS.upload}</div>
    <div>Upload</div>
  </div>
  <div class="mwc-library-control-btn selected">
    <div class="mwc-library-control-icon">${MWC_ICONS.download}</div>
    <div>Download</div>
  </div>
  <div class="mwc-library-control-btn selected">
    <div class="mwc-library-control-icon">${MWC_ICONS.delete}</div>
    <div>Delete</div>
  </div>
  <div class="mwc-library-control-btn selected back">
    <div class="mwc-library-control-icon">${MWC_ICONS.back}</div>
    <div>Back</div>
  </div>
`;

const EMPTY_CONTENT_CONTAINER_HTML = `
${MWC_ICONS.emptyLibrary}
<div class="title">
  Start your first document!
</div>
<div class="desc">
  <ul>
    <li>Click "<b>New</b>" to create a blank document</li>
    <li>Click "<b>Capture</b>" or "<b>Import</b>" to use images</li>
  </ul>
</div>
`;

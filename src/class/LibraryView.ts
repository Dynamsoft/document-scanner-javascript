import { DDV, IDocument } from "dynamsoft-document-viewer";
import { DocumentItem } from "../component/DocumentItem";
import { showInfoDialog } from "../util";

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

  async initialize() {
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

const ICONS = {
  newDoc: `
<svg id="add-new-doc" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="newDocclip-path">
      <rect id="Rectangle_2737" data-name="Rectangle 2737" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_527" data-name="Group 527" clip-path="url(#newDocclip-path)">
    <path id="Path_1453" data-name="Path 1453" d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0m0,22.957A10.957,10.957,0,1,1,22.957,12,10.97,10.97,0,0,1,12,22.957" fill="#fff"/>
    <path id="Path_1454" data-name="Path 1454" d="M17.739,11.478H12.522V6.261a.522.522,0,0,0-1.044,0v5.217H6.261a.522.522,0,1,0,0,1.043h5.217v5.218a.522.522,0,0,0,1.044,0V12.521h5.217a.522.522,0,1,0,0-1.043" fill="#fff"/>
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
  uploadedFiles: `
<svg id="uploaded-files" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="uploadedFilesclip-path">
      <rect id="Rectangle_2740" data-name="Rectangle 2740" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_533" data-name="Group 533" clip-path="url(#uploadedFilesclip-path)">
    <path id="Path_1460" data-name="Path 1460" d="M10,12c-5.3,0-9-1.845-9-3.5V6.482C2.6,7.984,5.986,9,10,9s7.4-1.016,9-2.518V9a.5.5,0,0,0,1,0V4.5C20,1.977,15.611,0,10,0S0,1.977,0,4.5v13c0,2.365,3.777,4.248,8.98,4.478H9a.5.5,0,0,0,.022-1C4.068,20.762,1,19,1,17.5V15.014c1.376,1.287,4.072,2.209,7.468,2.434H8.5a.5.5,0,0,0,.033-1C4.31,16.17,1,14.655,1,13V10.482C2.6,11.984,5.986,13,10,13a.5.5,0,0,0,0-1M10,1c5.305,0,9,1.845,9,3.5S15.307,8,10,8,1,6.155,1,4.5,4.7,1,10,1" fill="#fff"/>
    <path id="Path_1461" data-name="Path 1461" d="M17.5,11A6.5,6.5,0,1,0,24,17.5,6.508,6.508,0,0,0,17.5,11m0,12A5.5,5.5,0,1,1,23,17.5,5.507,5.507,0,0,1,17.5,23" fill="#fff"/>
    <path id="Path_1462" data-name="Path 1462" d="M19.5,17H18V14.5a.5.5,0,0,0-1,0v3a.5.5,0,0,0,.5.5h2a.5.5,0,0,0,0-1" fill="#fff"/>
  </g>
</svg>  
`,
  share: `
<svg id="share" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="shareclip-path">
      <rect id="Rectangle_2770" data-name="Rectangle 2770" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_574" data-name="Group 574" clip-path="url(#shareclip-path)">
    <path id="Path_1507" data-name="Path 1507" d="M19.489,15.009h0c-.008,0-.014,0-.022,0a4.465,4.465,0,0,0-3.749,2.052l-7-3.5a4.482,4.482,0,0,0,0-3.1l7-3.5a4.466,4.466,0,0,0,3.771,2.053l.018,0A4.516,4.516,0,1,0,15.282,6.06L8.257,9.574a4.49,4.49,0,1,0-4.793,6.814,4.548,4.548,0,0,0,1.043.122,4.468,4.468,0,0,0,3.755-2.056l7.018,3.511a4.485,4.485,0,1,0,4.209-2.956M17.13,1.914a3.508,3.508,0,1,1,2.366,6.1h-.01l-.011,0a3.476,3.476,0,0,1-3.112-1.932l0-.006a3.525,3.525,0,0,1,.769-4.162M3.693,15.415a3.5,3.5,0,1,1,3.931-4.967v0a3.47,3.47,0,0,1,0,3.119l0,0a3.479,3.479,0,0,1-3.931,1.842m17.636,7.066a3.5,3.5,0,0,1-4.971-4.53l0,0a3.477,3.477,0,0,1,3.126-1.936l.011,0a3.5,3.5,0,0,1,1.831,6.472" fill="#fff"/>
  </g>
</svg>
`,
  print: `
<svg id="print" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="printclip-path">
      <rect id="Rectangle_2742" data-name="Rectangle 2742" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_537" data-name="Group 537" clip-path="url(#printclip-path)">
    <path id="Path_1465" data-name="Path 1465" d="M16.5,19h-9a.5.5,0,0,0,0,1h9a.5.5,0,0,0,0-1" fill="#fff"/>
    <path id="Path_1466" data-name="Path 1466" d="M16.5,16h-9a.5.5,0,0,0,0,1h9a.5.5,0,0,0,0-1" fill="#fff"/>
    <path id="Path_1467" data-name="Path 1467" d="M21.5,6H2.5A2.512,2.512,0,0,0,0,8.5v6A2.511,2.511,0,0,0,2.5,17H5v5.5A1.5,1.5,0,0,0,6.5,24h11A1.5,1.5,0,0,0,19,22.5V17h2.5A2.51,2.51,0,0,0,24,14.5v-6A2.511,2.511,0,0,0,21.5,6M18,22.5a.5.5,0,0,1-.5.5H6.5a.5.5,0,0,1-.5-.5V14H18Zm5-8A1.509,1.509,0,0,1,21.5,16H19V13.5a.5.5,0,0,0-.5-.5H5.5a.5.5,0,0,0-.5.5V16H2.5A1.509,1.509,0,0,1,1,14.5v-6A1.509,1.509,0,0,1,2.5,7h19A1.509,1.509,0,0,1,23,8.5Z" fill="#fff"/>
    <path id="Path_1468" data-name="Path 1468" d="M5.5,5A.5.5,0,0,0,6,4.5V1h8V4.5a.5.5,0,0,0,.5.5h4a.5.5,0,0,0,.5-.5V3.913a1.49,1.49,0,0,0-.439-1.059L16.147.44A1.488,1.488,0,0,0,15.086,0H5.5A.5.5,0,0,0,5,.5v4a.5.5,0,0,0,.5.5m9.94-3.854,2.414,2.415A.5.5,0,0,1,18,3.913V4H15V1h.086a.508.508,0,0,1,.354.146" fill="#fff"/>
    <path id="Path_1469" data-name="Path 1469" d="M3.5,8A1.5,1.5,0,1,0,5,9.5,1.5,1.5,0,0,0,3.5,8m0,2A.5.5,0,1,1,4,9.5a.5.5,0,0,1-.5.5" fill="#fff"/>
  </g>
</svg>
`,
  upload: `
<svg id="upload" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <clipPath id="uploadclip-path">
      <rect id="Rectangle_2744" data-name="Rectangle 2744" width="24" height="24" fill="#fff"/>
    </clipPath>
  </defs>
  <g id="Group_541" data-name="Group 541" clip-path="url(#uploadclip-path)">
    <path id="Path_1472" data-name="Path 1472" d="M23.491,9.892a.507.507,0,0,0-.509.505V22.108a.87.87,0,0,1-.851.882H1.877a.874.874,0,0,1-.86-.89V10.4A.509.509,0,0,0,0,10.4V22.092A1.888,1.888,0,0,0,1.869,24h20.27A1.886,1.886,0,0,0,24,22.1V10.4a.507.507,0,0,0-.509-.505" fill="#fff"/>
    <path id="Path_1473" data-name="Path 1473" d="M12.358.146A.438.438,0,0,0,12.272.09a.5.5,0,0,0-.078-.051A.521.521,0,0,0,12,0h0a.169.169,0,0,0-.024,0,.539.539,0,0,0-.168.033.521.521,0,0,0-.17.113L7.346,4.37a.5.5,0,0,0,0,.714.512.512,0,0,0,.72,0L11.49,1.717v16.5a.509.509,0,0,0,1.017,0V1.715l3.429,3.373a.513.513,0,0,0,.72,0,.5.5,0,0,0,0-.715Z" fill="#fff"/>
  </g>
</svg>
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
    <div class="mwc-library-control-icon">${ICONS.newDoc}</div>
    <div>New</div>
  </div>
  <div class="mwc-library-control-btn">
    <div class="mwc-library-control-icon">${ICONS.cameraCapture}</div>
    <div>Capture</div>
  </div>
  <div class="mwc-library-control-btn">
    <div class="mwc-library-control-icon">${ICONS.galleryImport}</div>
    <div>Import</div>
  </div>
    <div class="mwc-library-control-btn">
    <div class="mwc-library-control-icon">${ICONS.uploadedFiles}</div>
    <div>History</div>
  </div>
`;

const SELECTED_LIBRARY_CONTROLS_HTML = `
  <div class="mwc-library-control-btn selected">
    <div class="mwc-library-control-icon">${ICONS.share}</div>
    <div>Share</div>
  </div>
  <div class="mwc-library-control-btn selected">
    <div class="mwc-library-control-icon">${ICONS.print}</div>
    <div>Print</div>
  </div>
  <div class="mwc-library-control-btn selected">
    <div class="mwc-library-control-icon">${ICONS.upload}</div>
    <div>Upload</div>
  </div>
  <div class="mwc-library-control-btn selected">
    <div class="mwc-library-control-icon">${ICONS.download}</div>
    <div>Download</div>
  </div>
  <div class="mwc-library-control-btn selected">
    <div class="mwc-library-control-icon">${ICONS.delete}</div>
    <div>Delete</div>
  </div>
  <div class="mwc-library-control-btn selected back">
    <div class="mwc-library-control-icon">${ICONS.back}</div>
    <div>Back</div>
  </div>
`;

const EMPTY_CONTENT_CONTAINER_HTML = `
${ICONS.emptyLibrary}
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

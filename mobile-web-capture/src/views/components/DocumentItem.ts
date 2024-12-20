import { DDV } from "dynamsoft-document-viewer";

export interface DocumentItemConfig {
  docId: string;
  onDocumentClick?: (docId: string) => void;
  onCheckedChange?: (docId: string, checked: boolean) => void;
}

export class DocumentItem {
  private dom: HTMLElement;
  private checkbox: HTMLInputElement;
  checked = false;
  isSelectMode = false;

  constructor(private config: DocumentItemConfig) {
    this.createUI();
    this.bindEvents();
  }

  private createUI(): void {
    this.createStylesheet();

    const doc = DDV.documentManager.getDocument(this.config.docId);
    const count = doc.pages.length;

    this.dom = document.createElement("div");
    this.dom.className = "mwc-document-item";
    this.dom.innerHTML = `
      <div class="mwc-document-info-container">
        <div class="mwc-document-thumbnail">
          ${ICONS.defaultDocument}
        </div>
        <div class="mwc-document-info">
          <div class="mwc-document-name">${doc.name}</div>
          <div class="mwc-document-pages">${count} pages</div>
        </div>
      </div>
      <input type="checkbox" class="mwc-document-checkbox">
    `;

    this.checkbox = this.dom.querySelector(".mwc-document-checkbox");
    this.updateThumbnail(doc);
  }

  private createStylesheet() {
    // Create style
    const styleSheet = document.createElement("style");
    styleSheet.textContent = DEFAULT_DOCUMENT_ITEM_STYLE;
    document.head.appendChild(styleSheet);
  }

  private async updateThumbnail(doc: any): Promise<void> {
    const thumbnailContainer = this.dom.querySelector(".mwc-document-thumbnail");
    thumbnailContainer.textContent = "";

    if (doc.pages[0]) {
      const data = await doc.getPageData(doc.pages[0]);
      const url = URL.createObjectURL(data.display.data);

      const img = document.createElement("img");
      img.className = "mwc-image-thumbnail";
      img.alt = "mwc-image-thumbnail";
      img.src = url;

      thumbnailContainer.append(img);
    } else {
      thumbnailContainer.innerHTML = ICONS.defaultDocument;
    }
  }

  private bindEvents(): void {
    this.dom.addEventListener("click", (e) => {
      if (e.target !== this.checkbox) {
        if (this.isSelectMode) {
          this.toggleCheck();
        } else {
          this.config.onDocumentClick?.(this.config.docId);
        }
      }
    });

    this.checkbox.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleCheck();
    });
  }

  setSelectMode(show: boolean): void {
    this.isSelectMode = show;

    if (!show) {
      this.uncheckDocument();
    }
  }

  toggleCheck(check?: boolean): void {
    this.checked = check ?? !this.checked;
    this.checkbox.checked = this.checked;
    this.dom.classList.toggle("selected", this.checked);
    this.config.onCheckedChange?.(this.config.docId, this.checked);
  }

  uncheckDocument(): void {
    this.checked = false;
    this.checkbox.checked = false;
    this.dom.classList.remove("selected");
  }

  getDom(): HTMLElement {
    return this.dom;
  }

  getUid() {
    return this.config.docId;
  }

  update(): void {
    const doc = DDV.documentManager.getDocument(this.config.docId);
    if (!doc) return;

    const nameElement = this.dom.querySelector(".mwc-document-name");
    const pagesElement = this.dom.querySelector(".mwc-document-pages");

    nameElement.textContent = doc.name;
    pagesElement.textContent = `${doc.pages.length} pages`;

    this.updateThumbnail(doc);
  }

  dispose() {
    this.dom.remove();
  }
}

const ICONS = {
  defaultDocument: `
<svg id="document" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="24" viewBox="0 0 20 24">
  <defs>
    <clipPath id="documentclip-path">
      <rect id="Rectangle_2779" data-name="Rectangle 2779" width="20" height="24" fill="#9AA0A6"/>
    </clipPath>
  </defs>
  <g id="Group_593" data-name="Group 593" clip-path="url(#documentclip-path)">
    <path id="Path_1549" data-name="Path 1549" d="M19.56,3.85,16.15.44A1.52,1.52,0,0,0,15.09,0H4.5A1.5,1.5,0,0,0,3,1.5V3H1.5A1.5,1.5,0,0,0,0,4.5v18A1.5,1.5,0,0,0,1.5,24h14A1.5,1.5,0,0,0,17,22.5V21h1.5A1.5,1.5,0,0,0,20,19.5V4.91a1.52,1.52,0,0,0-.44-1.06M16,22.5a.5.5,0,0,1-.5.5H1.5a.5.5,0,0,1-.5-.5V4.5A.5.5,0,0,1,1.5,4H3V19.5A1.5,1.5,0,0,0,4.5,21H16Zm3-3a.5.5,0,0,1-.5.5H4.5a.5.5,0,0,1-.5-.5V1.5A.5.5,0,0,1,4.5,1H15.09a.492.492,0,0,1,.35.15l3.41,3.41a.468.468,0,0,1,.15.35Z" fill="#9AA0A6"/>
    <path id="Path_1550" data-name="Path 1550" d="M7.66,6.4h5.18a.5.5,0,0,0,0-1H7.66a.5.5,0,0,0,0,1" fill="#9AA0A6"/>
    <path id="Path_1551" data-name="Path 1551" d="M15.5,9.08h-8a.5.5,0,1,0,0,1h8a.5.5,0,1,0,0-1" fill="#9AA0A6"/>
    <path id="Path_1552" data-name="Path 1552" d="M15.5,13.08h-8a.5.5,0,1,0,0,1h8a.5.5,0,0,0,0-1" fill="#9AA0A6"/>
  </g>
</svg>
`,
};

const DEFAULT_DOCUMENT_ITEM_STYLE = `
.mwc-document-item {
  display: flex;
  justify-content: space-between;
  align-items:center;
  background-color: #EFEFEF;
  cursor: pointer;
  font-family: Verdana;
}

.mwc-document-item.selected {
  border: 2px solid #FE8E14;
}

.mwc-document-info-container {
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.mwc-document-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mwc-document-item .mwc-document-name {
  font-size: 16px;
}

.mwc-document-item .mwc-document-pages {
  color: #888888;
}

.mwc-document-thumbnail {
  width: 70px;
  height: 70px;
  background-color: #DADCE0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mwc-document-thumbnail svg {
  width: 48px;
  height: 48px;
  padding: 1rem;
}

.mwc-image-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.mwc-document-checkbox {
  cursor: pointer;
  accent-color: #FE8E14;
  width: 24px;
  height: 24px;
  margin-right: 15px;
}
`;

import { DDV } from "dynamsoft-document-viewer";
import { MWC_ICONS } from "../utils/icons";

export interface DocumentItemConfig {
  docId: string;
  onDocumentClick?: (docId: string) => void;
  onCheckedChange?: (docId: string, checked: boolean) => void;
  onRename?: (docId: string) => void;
}

export class DocumentItem {
  private dom: HTMLElement;
  private checkbox: HTMLInputElement;
  private renameBtn: HTMLElement;

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
          ${MWC_ICONS.defaultDocument}
        </div>
        <div class="mwc-document-info">
          <div class="mwc-document-name-container">
            <div class="mwc-document-name">${doc.name}</div>
            <button type="button" class="mwc-document-rename-btn">
              ${MWC_ICONS.edit}
            </button>
          </div>
          <div class="mwc-document-pages">${count} pages</div>
        </div>
      </div>
      <input type="checkbox" class="mwc-document-checkbox">
    `;

    this.checkbox = this.dom.querySelector(".mwc-document-checkbox");
    this.renameBtn = this.dom.querySelector(".mwc-document-rename-btn");
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
      thumbnailContainer.innerHTML = MWC_ICONS.defaultDocument;
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

    // Add event listener
    this.renameBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.config.onRename?.(this.config.docId);
    });
  }

  setSelectMode(show: boolean): void {
    this.isSelectMode = show;

    if (!show) {
      this.toggleCheck(false);
    }
  }

  toggleCheck(check?: boolean): void {
    this.checked = check ?? !this.checked;
    this.checkbox.checked = this.checked;
    this.dom.classList.toggle("selected", this.checked);
    this.config.onCheckedChange?.(this.config.docId, this.checked);
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

const DEFAULT_DOCUMENT_ITEM_STYLE = `
.mwc-document-item {
  display: grid;
  grid-template-columns: 90% 10%;
  background-color: #EFEFEF;
  cursor: pointer;
  font-family: Verdana;
  padding: 15px;
  align-items: center
}

.mwc-document-item.selected {
  border: 2px solid #FE8E14;
}

.mwc-document-info-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mwc-document-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 1rem;
}

.mwc-document-item .mwc-document-name-container {
  display: grid;
  grid-template-columns: 90% 10%;
}

.mwc-document-item .mwc-document-name-container .mwc-document-name {
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mwc-document-item .mwc-document-name-container .mwc-document-rename-btn{
  background: none;
  border: none;
  cursor: pointer;
}

.mwc-document-item .mwc-document-name-container .mwc-document-rename-btn svg {
  width: 16px;
  height: 16px;
  stroke: black;
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
}
`;

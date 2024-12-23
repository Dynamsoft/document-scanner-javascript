import { DDV } from "dynamsoft-document-viewer";
import { MWC_ICONS } from "../utils/icons";

export interface TransferItemConfig {
  docId: string;
  onCheckedChange?: (docId: string, checked: boolean) => void;
}

export class TransferItem {
  private dom: HTMLElement;
  private selectedIcon: HTMLElement;

  checked = false;

  constructor(private config: TransferItemConfig) {
    this.createUI();
    this.bindEvents();

    // Initialize check to false
    this.toggleCheck(false);
  }

  private createUI(): void {
    this.createStylesheet();

    const doc = DDV.documentManager.getDocument(this.config.docId);
    const count = doc.pages.length;

    this.dom = document.createElement("div");
    this.dom.className = "mwc-document-item";
    this.dom.innerHTML = `
      <div class="mwc-transfer-info-container">
        <div class="mwc-transfer-thumbnail">
          ${MWC_ICONS.defaultDocument}
        </div>
        <div class="mwc-transfer-info">
          <div class="mwc-transfer-name-container">
            ${doc.name}           
          </div>
          <div class="mwc-transfer-pages">${count} pages</div>
        </div>
      </div>
      <div class="mwc-transfer-check-icon">
        ${MWC_ICONS.selectedCircle}
      </div>
    `;

    this.selectedIcon = this.dom.querySelector(".mwc-transfer-check-icon");
    this.updateThumbnail(doc);
  }

  private createStylesheet() {
    // Create style
    const styleSheet = document.createElement("style");
    styleSheet.textContent = DEFAULT_DOCUMENT_ITEM_STYLE;
    document.head.appendChild(styleSheet);
  }

  private async updateThumbnail(doc: any): Promise<void> {
    const thumbnailContainer = this.dom.querySelector(".mwc-transfer-thumbnail");
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
      this.toggleCheck();
    });
  }

  toggleCheck(check?: boolean): void {
    this.checked = check ?? !this.checked;
    this.selectedIcon.style.display = this.checked ? "flex" : "none";
    this.dom.style.border = this.checked ? "2px solid #FE8E14" : "none";
    this.config.onCheckedChange?.(this.config.docId, this.checked);
  }

  getDom(): HTMLElement {
    return this.dom;
  }

  getUid() {
    return this.config.docId;
  }

  dispose() {
    this.dom.remove();
  }
}

const DEFAULT_DOCUMENT_ITEM_STYLE = `
.mwc-transfer-item {
  display: grid;
  grid-template-columns: 90% 10%;
  background-color: #EFEFEF;
  cursor: pointer;
  font-family: Verdana;
  padding: 15px;
  align-items: center
}

.mwc-transfer-info-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mwc-transfer-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 1rem;
  overflow: hidden;
}

.mwc-transfer-info .mwc-transfer-name-container  {
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.mwc-transfer-info .mwc-transfer-pages {
  color: #888888;
}

.mwc-transfer-thumbnail {
  width: 70px;
  height: 70px;
  background-color: #DADCE0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mwc-transfer-thumbnail svg {
  width: 48px;
  height: 48px;
  padding: 1rem;
}

.mwc-image-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
`;

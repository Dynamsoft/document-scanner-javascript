import { DDV } from "dynamsoft-document-viewer";
import { TransferItem } from "./components/TransferItem";

export type TransferMode = "copy" | "move";

export interface TransferViewConfig {
  container: HTMLElement;
  onConfirmTransfer: (mode: TransferMode) => void;
  onCancelTransfer: () => void;
}

export class TransferView {
  checkedDocUids: string[] = [];
  docItems: TransferItem[] = [];

  transferMode: TransferMode = "copy";

  headerContainer: HTMLElement;
  headerTitleContainer: HTMLElement;

  emptyContentContainer: HTMLElement;
  transferContentContainer: HTMLElement;

  toolbarContainer: HTMLElement;

  cancelBtn: HTMLElement;
  actionBtn: HTMLElement;

  constructor(private config: TransferViewConfig) {}

  initialize() {
    if (!this.config.container) {
      throw new Error("Please create a Transfer Container element");
    }

    this.createUI();
    this.setVisible(false);
  }

  setVisible(visible: boolean, config?: { mode: TransferMode; docId: string; selectedIdx: number[] }) {
    this.config.container.style.display = visible ? "flex" : "none";
    if (visible) {
      this.transferContentContainer.textContent = "";

      this.transferMode = config.mode;
      this.updateHeaderAndAction();
      this.updateToolbarStyle();

      this.actionBtn.onclick = () => this.handleActionClick(config.docId, config.selectedIdx);

      // Filter current document on transferMode move
      const docs = DDV.documentManager
        .getAllDocuments()
        .filter((doc) => (this.transferMode === "move" ? doc.uid !== config.docId : true));
      const docCount = docs.length;

      this.showTransferContentContainer(!!docCount);

      if (docCount) {
        docs.forEach((item) => {
          const docItem = new TransferItem({
            docId: item.uid,
            onCheckedChange: (docId, checked) => this.handleDocumentChecked(docId, checked),
          });

          // Add to start of array
          this.docItems.unshift(docItem);

          // Insert at beginning of container
          if (this.transferContentContainer.firstChild) {
            this.transferContentContainer.insertBefore(docItem.getDom(), this.transferContentContainer.firstChild);
          } else {
            this.transferContentContainer.appendChild(docItem.getDom());
          }
        });
      }
    }
  }

  private createUI() {
    // Reset Element
    this.config.container.textContent = "";

    this.createStylesheet();
    this.createHeader();
    this.createTransferDocuments();
    this.createToolbar();
    this.updateHeaderAndAction();
  }

  private createStylesheet() {
    // Create style
    const styleSheet = document.createElement("style");
    styleSheet.textContent = DEFAULT_TRANSFER_VIEW_STYLE;
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
    this.headerContainer.className = "mwc-transfer-view-header";

    this.headerTitleContainer = document.createElement("div");
    this.headerTitleContainer.className = "mwc-transfer-view-header-title";
    this.headerTitleContainer.textContent = "Transfer Page";

    this.headerContainer.append(this.headerTitleContainer);
    this.config.container.append(this.headerContainer);
  }

  private updateHeaderAndAction() {
    switch (this.transferMode) {
      case "copy":
        this.headerTitleContainer.textContent = "Copy Selected Pages to";
        this.actionBtn.textContent = "Paste";
        break;
      case "move":
        this.headerTitleContainer.textContent = "Move Selected Pages to";
        this.actionBtn.textContent = "Confirm";
        break;
      default:
        this.headerTitleContainer.textContent = "Transfer Page";
    }
  }

  private createTransferDocuments() {
    this.transferContentContainer = document.createElement("div");
    this.transferContentContainer.className = "mwc-transfer-view-content";

    this.emptyContentContainer = document.createElement("div");
    this.emptyContentContainer.className = "mwc-transfer-view-content-empty";
    this.emptyContentContainer.innerHTML = EMPTY_CONTENT_CONTAINER_HTML;

    this.config.container.append(this.transferContentContainer);
    this.config.container.append(this.emptyContentContainer);
  }

  private createToolbar() {
    this.toolbarContainer = document.createElement("div");
    this.toolbarContainer.className = "mwc-transfer-view-controls";
    this.toolbarContainer.innerHTML = `
      <div class="mwc-transfer-view-control-btn">
        Cancel
      </div>
      <div class="mwc-transfer-view-control-btn" style="color: #fe8e14">
        Action
      </div>
    `;

    this.config.container.append(this.toolbarContainer);

    this.cancelBtn = this.toolbarContainer.querySelector(".mwc-transfer-view-control-btn:nth-child(1)");
    this.actionBtn = this.toolbarContainer.querySelector(".mwc-transfer-view-control-btn:nth-child(2)");
    this.cancelBtn?.addEventListener("click", () => this.handleCancelButton());
  }

  private showTransferContentContainer(show: boolean) {
    this.emptyContentContainer.style.display = show ? "none" : "flex";
    this.transferContentContainer.style.display = show ? "flex" : "none";
  }

  private handleCancelButton() {
    // Uncheck all documents
    this.checkedDocUids = [];

    this.docItems.forEach((item) => {
      item.toggleCheck(false);
      item.dispose();
    });

    this.docItems = [];

    // TODO
    this.config.onCancelTransfer();
  }

  private handleDocumentChecked(docId: string, checked: boolean) {
    if (checked) {
      this.checkedDocUids.push(docId);
    } else {
      this.checkedDocUids = this.checkedDocUids?.filter((uid) => uid !== docId);
    }

    this.updateToolbarStyle();
  }

  private updateToolbarStyle() {
    switch (this.transferMode) {
      case "copy":
        this.actionBtn.classList.toggle("disabled", this.checkedDocUids.length < 1);

        break;
      case "move":
        this.actionBtn.classList.toggle("disabled", this.checkedDocUids.length !== 1);
        break;
      default:
        this.headerTitleContainer.textContent = "Transfer Page";
    }
  }

  private handleActionClick(sourceDocId: string, sourceSelectedIdx: number[]) {
    if (this.actionBtn.classList.contains("disabled")) {
      console.warn("Please select a document");
      return;
    }

    if (this.transferMode === "copy") {
      this.checkedDocUids.forEach((docId: string) => {
        DDV.documentManager.copyPagesToDocument(sourceDocId, docId, {
          sourceIndices: [...sourceSelectedIdx],
        });
      });
    } else if (this.transferMode === "move") {
      DDV.documentManager.movePagesToDocument(sourceDocId, this.checkedDocUids[0], {
        sourceIndices: [...sourceSelectedIdx],
      });
    }
    this.config.onConfirmTransfer(this.transferMode);

    this.handleCancelButton();
  }
}

const DEFAULT_TRANSFER_VIEW_STYLE = `
.mwc-transfer-view-header {
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

.mwc-transfer-view-content {
  flex: 1 1 auto;
  overflow-y: auto;
  display: none;
  justify-content: start;
  flex-direction: column;
  padding: 15px;
  gap: 15px;
  margin-bottom: 30px;
}

.mwc-transfer-view-content-empty {
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  font-family: Verdana;
  align-items: center;
  padding: 1rem;
  user-select: none;
}

.mwc-transfer-view-content-empty .title {
  margin-top: 2rem;
  font-size: 24px;
  text-align: center;
}

.mwc-transfer-view-content-empty .desc {
  font-size: 16px;
}

.mwc-transfer-view-controls {
  display: flex;
  height: 6rem;
  background-color: #323234;
  align-items: center;
  font-size: 24px;
  font-family: Verdana;
  color: white;
  width: 100%;
  flex: 0 1 65px;
}

.mwc-transfer-view-control-btn {
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  text-align: center;
  user-select: none;
}

.mwc-transfer-view-control-btn.disabled {
  opacity: 0.4;
  pointer-events: none;
}
`;

const EMPTY_CONTENT_CONTAINER_HTML = `
<div class="title">
  No other documents to move the pages!
</div>
<div class="desc">
  Please create another document!
</div>
`;

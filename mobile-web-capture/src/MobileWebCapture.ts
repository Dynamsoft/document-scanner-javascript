import { DDV } from "dynamsoft-document-viewer";
import { LibraryView, LibraryViewConfig } from "./views/LibraryView";
import { DocumentScannerConfig, EnumResultStatusCode, DocumentScanner } from "dynamsoft-document-scanner";
import { LicenseManager } from "dynamsoft-license";
import { PageView, PageViewConfig } from "./views/PageView";
import { DocumentView, DocumentViewConfig } from "./views/DocumentView";
import { NormalizedImageResultItem } from "dynamsoft-document-normalizer";
import { TransferMode, TransferView, TransferViewConfig } from "./views/TransferView";
import { showInfoDialog } from "./views/utils";

const DEFAULT_CONTAINER_HEIGHT = "100dvh";

enum EnumMWCViews {
  Library = "library",
  Page = "page",
  Document = "document",
  Transfer = "transfer",
}

interface MWCView {
  instance?: LibraryView | DocumentView | PageView | TransferView;
  config: LibraryViewConfig | DocumentViewConfig | PageViewConfig | TransferViewConfig;
  isVisible: boolean;
}

export interface MobileWebCaptureConfig extends Omit<DocumentScannerConfig, "container"> {
  container: HTMLElement | string;
  libraryViewConfig?: LibraryViewConfig;
  documentViewConfig?: DocumentViewConfig;
  pageViewConfig?: PageViewConfig;
  transferViewConfig?: TransferViewConfig;
  exportConfig?: ExportConfig;
}

export type UploadStatus = "success" | "failed";

export type UploadedDocument = {
  fileName: string;
  downloadUrl: string;
  status: UploadStatus;
  uploadTime?: string;
};

export interface ExportConfig {
  uploadToServer?: (fileName: string, blob: Blob) => void | UploadedDocument;
  downloadFromServer?: (doc: UploadedDocument) => void;
  deleteFromServer?: (doc: UploadedDocument) => void;
}

class MobileWebCapture {
  private documentScanner: DocumentScanner;
  private mwcViews: Record<EnumMWCViews, MWCView>;

  private currentView: EnumMWCViews = null;

  private isInitialized = false;

  private uploadedFiles: UploadedDocument[] = [];

  private shouldCreateDefaultContainer(): boolean {
    const hasNoMainContainer = !this.config.container;

    const hasAnyMissingViewContainer =
      // DDV related views
      !this.config.libraryViewConfig?.container ||
      !this.config.documentViewConfig?.container ||
      !this.config.pageViewConfig?.container ||
      !this.config.transferViewConfig?.container ||
      // DDS related views
      !this.config.scannerViewConfig?.container ||
      !this.config.scanResultViewConfig?.container ||
      !this.config.correctionViewConfig?.container;

    return hasNoMainContainer && hasAnyMissingViewContainer;
  }

  private createDefaultMWCContainer(): HTMLElement {
    const container = document.createElement("div");
    container.className = "mwc-main-container";
    Object.assign(container.style, {
      height: DEFAULT_CONTAINER_HEIGHT,
      width: "100%",
      position: "absolute",
      left: 0,
      top: 0,
    });
    document.body.append(container);
    return container;
  }

  private getContainer(containerConfig: string | HTMLElement): HTMLElement | null {
    if (typeof containerConfig === "string") {
      return document.querySelector(containerConfig);
    }
    return containerConfig instanceof HTMLElement ? containerConfig : null;
  }

  private createViewContainers(mainContainer: HTMLElement): Record<string, HTMLElement> {
    const views = ["scanner", "correction", "scan-result", "library", "document", "page", "transfer"];
    mainContainer.textContent = ""; // Clear container

    return views.reduce((containers, view) => {
      const viewContainer = document.createElement("div");
      viewContainer.className = `mwc-${view}-view-container`;

      Object.assign(viewContainer.style, {
        height: "100%",
        width: "100%",
        display: "none",
      });

      mainContainer.append(viewContainer);
      containers[view] = viewContainer;
      return containers;
    }, {} as Record<string, HTMLElement>);
  }

  constructor(private config: MobileWebCaptureConfig) {
    const {
      libraryViewConfig,
      documentViewConfig,
      pageViewConfig,
      license,
      exportConfig,
      transferViewConfig,
      container,
      ...baseConfig // DDS Config
    } = config;

    // If users provide container through DDS, create the containers for them
    this.config.container = this.shouldCreateDefaultContainer()
      ? this.createDefaultMWCContainer()
      : this.config.container;

    const viewContainers = this.config.container
      ? this.createViewContainers(this.getContainer(this.config.container))
      : {};

    this.documentScanner = new DocumentScanner({
      license,
      ...baseConfig,
      scannerViewConfig: {
        ...baseConfig?.scannerViewConfig,
        container: viewContainers["scanner"] || baseConfig.scannerViewConfig?.container,
      },
      scanResultViewConfig: {
        ...baseConfig?.scanResultViewConfig,
        container: viewContainers["scan-result"] || baseConfig.scanResultViewConfig?.container,
      },
      correctionViewConfig: {
        ...baseConfig?.correctionViewConfig,
        container: viewContainers["correction"] || baseConfig.correctionViewConfig?.container,
      },
    });

    // Set up views object to keep track of the visibility of each views
    this.mwcViews = {
      [EnumMWCViews.Library]: {
        config: {
          container: viewContainers["library"] || libraryViewConfig.container,
          onCameraCapture: () => this.handleCameraCapture(EnumMWCViews.Library),
          onGalleryImport: () => this.handleGalleryImport(EnumMWCViews.Library),
          onDocumentClick: (docId) => this.handleDocumentClick(docId),
          exportConfig,
          uploadedFiles: this.uploadedFiles,
          updateUploadedFiles: this.updateUploadedFiles,
        },
        isVisible: false,
      },
      [EnumMWCViews.Document]: {
        config: {
          container: viewContainers["document"] || documentViewConfig.container,
          onCameraCapture: () => this.handleCameraCapture(EnumMWCViews.Document),
          onGalleryImport: () => this.handleGalleryImport(EnumMWCViews.Document),
          onLibraryClick: () => this.switchView(EnumMWCViews.Library),
          onPageClick: (docId) => this.handlePageClick(docId),
          exportConfig,
          uploadedFiles: this.uploadedFiles,
          updateUploadedFiles: this.updateUploadedFiles,
          onTransferPages: (mode, docId, selectedIdx) => this.handleTransferPage(mode, docId, selectedIdx),
        },
        isVisible: false,
      },
      [EnumMWCViews.Page]: {
        config: {
          container: viewContainers["page"] || pageViewConfig.container,
          onDocumentClick: () => this.switchView(EnumMWCViews.Document),
          onAddPage: () => this.handleCameraCapture(EnumMWCViews.Document),
          exportConfig,
          uploadedFiles: this.uploadedFiles,
          updateUploadedFiles: this.updateUploadedFiles,
        },
        isVisible: false,
      },
      [EnumMWCViews.Transfer]: {
        config: {
          container: viewContainers["transfer"] || transferViewConfig.container,
          onConfirmTransfer: (mode) => this.handleTransferPageConfirm(mode),
          onCancelTransfer: () => this.handleTransferPageCancel(),
        },
        isVisible: false,
      },
    };
  }

  //TODO type
  async initialize(): Promise<any> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Currently if no license is provided, uses trial license
      LicenseManager.initLicense(this.config?.license || "", true);
      DDV.Core.license = this.config?.license || "";
      DDV.Core.engineResourcePath = "https://cdn.jsdelivr.net/npm/dynamsoft-document-viewer@latest/dist/engine";

      const MobileDocumentScanner = await this.documentScanner.initialize();

      // Preload DDV Resource
      await DDV.Core.loadWasm();

      // Initialize DDV
      await DDV.Core.init();

      // Configure image filter feature which is in edit viewer
      DDV.setProcessingHandler("imageFilter", new DDV.ImageFilter());

      await this.initializeDDV();
      this.initializeViews();

      this.isInitialized = true;

      return MobileDocumentScanner;
    } catch (ex: any) {
      this.isInitialized = false;

      let errMsg = ex?.message || ex;
      console.error("Initialization Failed:", errMsg);
      alert("Initialization Failed");
      throw new Error(`Initialization Failed: ${errMsg}`);
    }
  }

  private async initializeDDV(): Promise<void> {
    await DDV.Core.loadWasm();
    await DDV.Core.init();
    DDV.setProcessingHandler("imageFilter", new DDV.ImageFilter());
  }

  private initializeViews() {
    const { Library, Document, Page, Transfer } = EnumMWCViews;
    this.mwcViews[Library].instance = new LibraryView(this.mwcViews[Library].config as LibraryViewConfig);
    this.mwcViews[Document].instance = new DocumentView(this.mwcViews[Document].config as DocumentViewConfig);
    this.mwcViews[Page].instance = new PageView(this.mwcViews[Page].config as PageViewConfig);
    this.mwcViews[Transfer].instance = new TransferView(this.mwcViews[Transfer].config as TransferViewConfig);

    this.mwcViews[Library].instance.initialize();
    this.mwcViews[Document].instance.initialize();
    this.mwcViews[Page].instance.initialize();
    this.mwcViews[Transfer].instance.initialize();
  }

  private switchView(targetView: EnumMWCViews, config?: any) {
    if (targetView === this.currentView) return;

    if (this.currentView) {
      // Hide current view
      const currentState = this.mwcViews[this.currentView];
      currentState.isVisible = false;
      currentState.instance?.setVisible?.(false, config);
    }

    // Show target view
    const targetState = this.mwcViews[targetView];
    targetState.isVisible = true;
    targetState.instance?.setVisible?.(true, config);

    this.currentView = targetView;
  }

  async launch(view: EnumMWCViews) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.switchView(view || EnumMWCViews.Library);
    } catch (ex: any) {
      let errMsg = ex?.message || ex;
      throw new Error(`Launch MWC Failed: ${errMsg}`);
    }
  }

  private async handleCameraCapture(sourceView: EnumMWCViews) {
    this.mwcViews[this.currentView].instance?.setVisible?.(false);

    try {
      const result = await this.documentScanner.launch();

      // Return to library view after successful capture
      if (result?.status.code === EnumResultStatusCode.SUCCESS) {
        const blob = await (result.correctedImageResult as NormalizedImageResultItem).toBlob("image/png");

        if (sourceView === EnumMWCViews.Library) {
          // Create new document when capturing from Library view
          const sources = [
            {
              convertMode: "cm/auto",
              fileData: blob,
            },
          ];
          const doc = await (this.mwcViews.library.instance as LibraryView).createAndLoadDocument(
            `Doc-${Date.now()}`,
            sources
          );

          this.handleDocumentClick(doc.uid);
        } else if (sourceView === EnumMWCViews.Document || sourceView === EnumMWCViews.Page) {
          // Add to current document when capturing from Document view
          const documentView = this.mwcViews[EnumMWCViews.Document].instance as DocumentView;
          const currentDoc = documentView.browseViewer.currentDocument;

          if (currentDoc) {
            await currentDoc.loadSource([
              {
                convertMode: "cm/auto",
                fileData: blob,
              },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Camera capture failed:", error);
    } finally {
      this.mwcViews[this.currentView].instance?.setVisible?.(true);
    }
  }

  private async handleGalleryImport(sourceView: EnumMWCViews) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.multiple = true;

    input.onchange = async () => {
      const files = Array.from(input.files || []);
      const len = files.length;
      const sourceArray = [];

      for (let i = 0; i < len; i++) {
        sourceArray.push({
          convertMode: "cm/auto",
          fileData: new Blob([files[i]], {
            type: files[i].type,
          }),
          renderOptions: {
            renderAnnotations: "loadAnnotations",
          },
        });
      }

      if (sourceArray.length > 0) {
        if (sourceView === EnumMWCViews.Library) {
          const doc = await (this.mwcViews.library.instance as LibraryView).createAndLoadDocument(
            `Doc-${Date.now()}`,
            sourceArray
          );

          this.handleDocumentClick(doc.uid);
        } else if (sourceView === EnumMWCViews.Document) {
          // Add to current document when capturing from Document view
          const documentView = this.mwcViews[EnumMWCViews.Document].instance as DocumentView;
          const currentDoc = documentView.browseViewer.currentDocument;

          if (currentDoc) {
            await currentDoc.loadSource(sourceArray);

            // Stay on document view with updated content
            documentView.setVisible(true);
          }
        }
      }
    };

    input.click();
  }

  private handleDocumentClick(docId: string) {
    // Get instance and open document
    const documentView = this.mwcViews[EnumMWCViews.Document].instance as DocumentView;
    documentView.browseViewer.openDocument(docId);

    // Switch to document view
    this.switchView(EnumMWCViews.Document);
  }

  private handlePageClick(docId: string) {
    const pageView = this.mwcViews[EnumMWCViews.Page].instance as PageView;

    pageView.openPage(docId);

    this.switchView(EnumMWCViews.Page);
  }

  private updateUploadedFiles(newUploadedFiles: UploadedDocument[]) {
    this.uploadedFiles = newUploadedFiles;
  }

  private handleTransferPage(mode: TransferMode, docId: string, selectedIdx: number[]) {
    // should use switchView
    this.switchView(EnumMWCViews.Transfer, {
      mode,
      docId,
      selectedIdx,
    });
  }

  private handleTransferPageConfirm(mode: TransferMode) {
    (this.mwcViews.document.instance as DocumentView).handleBackButton();
    showInfoDialog(
      mode === "copy" ? "Pasted" : mode === "move" ? "Moved" : "",
      this.mwcViews.document.config.container
    );
  }

  private handleTransferPageCancel() {
    this.switchView(EnumMWCViews.Document);
  }

  dispose() {
    Object.values(this.mwcViews).forEach((view) => {
      // if (view.instance && typeof view.instance.dispose === "function") {
      //   view.instance.dispose();
      // }
    });

    this.documentScanner.dispose();

    this.isInitialized = false;
  }
}

export default MobileWebCapture;

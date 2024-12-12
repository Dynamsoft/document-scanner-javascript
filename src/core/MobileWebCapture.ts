import { DDV } from "dynamsoft-document-viewer";
import { LibraryView, LibraryViewConfig } from "../class/LibraryView";
import MobileDocumentScanner, { MobileDocumentScannerConfig } from "./MobileDocumentScanner";
import { LicenseManager } from "dynamsoft-license";
import { PageView, PageViewConfig } from "../class/PageView";
import { DocumentView, DocumentViewConfig } from "../class/DocumentView";
import { NormalizedImageResultItem } from "dynamsoft-capture-vision-bundle";

enum EnumMWCViews {
  Library = "library",
  Page = "page",
  Document = "document",
}

interface MWCView {
  instance?: LibraryView | DocumentView | PageView;
  config: LibraryViewConfig | DocumentViewConfig | PageViewConfig;
  isVisible: boolean;
}

interface MobileWebCaptureConfig extends MobileDocumentScannerConfig {
  libraryViewConfig?: LibraryViewConfig;
  documentViewConfig?: DocumentViewConfig;
  pageViewConfig?: PageViewConfig;
}

class MobileWebCapture extends MobileDocumentScanner {
  private mwcViews: Record<EnumMWCViews, MWCView>;

  private currentView: EnumMWCViews = null;
  private navigationStack: EnumMWCViews[] = [];

  private isInitialized = false;

  constructor(config: MobileWebCaptureConfig) {
    // Pass the MobileDocumentScannerConfig portion to super
    const { libraryViewConfig, documentViewConfig, pageViewConfig, license, ...baseConfig } = config;
    super({ license, ...baseConfig });

    if (license) {
      LicenseManager.initLicense(license, true);
      DDV.Core.license = license;
      DDV.Core.engineResourcePath = "https://cdn.jsdelivr.net/npm/dynamsoft-document-viewer@latest/dist/engine";
      // Currently if no license is provided, uses trial license
    }

    // Set up views object to keep track of the visibility of each views
    this.mwcViews = {
      [EnumMWCViews.Library]: {
        config: {
          container: libraryViewConfig.container,
          onCameraCapture: () => this.handleCameraCapture(EnumMWCViews.Library),
          onGalleryImport: () => this.handleGalleryImport(EnumMWCViews.Library),
          onDocumentClick: (docId) => this.handleDocumentClick(docId),
        },
        isVisible: false,
      },
      [EnumMWCViews.Document]: {
        config: {
          container: documentViewConfig.container,
          onCameraCapture: () => this.handleCameraCapture(EnumMWCViews.Document),
          onGalleryImport: () => this.handleGalleryImport(EnumMWCViews.Document),
          onLibraryClick: () => this.switchView(EnumMWCViews.Library),
          onPageClick: (docId) => this.handlePageClick(docId),
        },
        isVisible: false,
      },
      [EnumMWCViews.Page]: {
        config: {
          container: pageViewConfig.container,
          onDocumentClick: () => this.switchView(EnumMWCViews.Document),
          onAddPage: () => this.handleCameraCapture(EnumMWCViews.Document),
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
      const MobileDocumentScanner = await super.initialize();

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
    }
  }

  private async initializeDDV(): Promise<void> {
    await DDV.Core.loadWasm();
    await DDV.Core.init();
    DDV.setProcessingHandler("imageFilter", new DDV.ImageFilter());
  }

  private initializeViews() {
    const { Library, Document, Page } = EnumMWCViews;
    this.mwcViews[Library].instance = new LibraryView(this.mwcViews[Library].config as LibraryViewConfig);
    this.mwcViews[Document].instance = new DocumentView(this.mwcViews[Document].config as DocumentViewConfig);
    this.mwcViews[Page].instance = new PageView(this.mwcViews[Page].config as PageViewConfig);

    this.mwcViews[Library].instance.initialize();
    this.mwcViews[Document].instance.initialize();
    this.mwcViews[Page].instance.initialize();
  }

  private switchView(targetView: EnumMWCViews) {
    if (targetView === this.currentView) return;

    if (this.currentView) {
      // Hide current view
      const currentState = this.mwcViews[this.currentView];
      currentState.isVisible = false;
      currentState.instance?.setVisible?.(false);
    }

    // Show target view
    const targetState = this.mwcViews[targetView];
    targetState.isVisible = true;
    targetState.instance?.setVisible?.(true);

    this.navigationStack.push(this.currentView);
    this.currentView = targetView;
  }

  async launch(view: EnumMWCViews) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.switchView(view || EnumMWCViews.Library);
  }

  async goBack() {
    const previousView = this.navigationStack.pop();
    if (!previousView) return false;

    this.switchView(previousView);
    return true;
  }

  private async handleCameraCapture(sourceView: EnumMWCViews) {
    this.mwcViews[this.currentView].instance?.setVisible?.(false);

    try {
      const result = await this.startImageCapture();
      // Return to library view after successful capture
      if (result.success) {
        const blob = await (result.normalizedImageResult as NormalizedImageResultItem).toBlob("image/png");

        if (sourceView === EnumMWCViews.Library) {
          // Create new document when capturing from Library view
          const sources = [
            {
              convertMode: "cm/auto",
              fileData: blob,
            },
          ];
          const doc = await (this.mwcViews.library.instance as LibraryView).createAndLoadDocument(sources);

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
          const doc = await (this.mwcViews.library.instance as LibraryView).createAndLoadDocument(sourceArray);

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

  dispose() {
    Object.values(this.mwcViews).forEach((view) => {
      // if (view.instance && typeof view.instance.dispose === "function") {
      //   view.instance.dispose();
      // }
    });

    super.dispose();

    this.isInitialized = false;
  }
}

export default MobileWebCapture;

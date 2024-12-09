import { DDV } from "dynamsoft-document-viewer";
import { LibraryView, LibraryViewConfig } from "../class/LibraryView";
import MobileDocumentScanner, { MobileDocumentScannerConfig } from "./MobileDocumentScanner";
import { LicenseManager } from "dynamsoft-license";
import { PageView, PageViewConfig } from "../class/PageView";
import { DocumentView, DocumentViewConfig } from "../class/DocumentView";
import { DSImageData, NormalizedImageResultItem, NormalizedImagesResult } from "dynamsoft-capture-vision-bundle";

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
        config: { container: libraryViewConfig.container, onCameraCapture: () => this.handleCameraCapture() },
        isVisible: false,
      },
      [EnumMWCViews.Document]: {
        config: libraryViewConfig,
        isVisible: false,
      },
      [EnumMWCViews.Page]: {
        config: libraryViewConfig,
        isVisible: false,
      },
    };
  }

  //TODO type
  async initialize(): Promise<any> {
    try {
      const MobileDocumentScanner = await super.initialize();

      // Preload DDV Resource
      await DDV.Core.loadWasm();

      // Initialize DDV
      await DDV.Core.init();

      // Configure image filter feature which is in edit viewer
      DDV.setProcessingHandler("imageFilter", new DDV.ImageFilter());

      await super.initialize();
      await this.initializeDDV();
      await this.initializeViews();

      return MobileDocumentScanner;
    } catch (ex: any) {
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

  private async initializeViews(): Promise<void> {
    const { Library, Document, Page } = EnumMWCViews;
    this.mwcViews[Library].instance = new LibraryView(this.mwcViews[Library].config as LibraryViewConfig);
    // this.mwcViews[Document].instance = new DocumentView(this.mwcViews[Document].config as DocumentViewConfig);
    // this.mwcViews[Page].instance = new PageView(this.mwcViews[Page].config as PageViewConfig);

    await Promise.all([
      this.mwcViews[Library].instance.initialize(),
      // this.mwcViews[Document].instance.initialize(),
      // this.mwcViews[Page].instance.initialize()
    ]);
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
    await this.initialize();
    this.switchView(view || EnumMWCViews.Library);
  }

  async goBack() {
    const previousView = this.navigationStack.pop();
    if (!previousView) return false;

    this.switchView(previousView);
    return true;
  }

  private async handleCameraCapture() {
    this.mwcViews[this.currentView].instance?.setVisible?.(false);

    try {
      const result = await this.startImageCapture();
      // Return to library view after successful capture
      if (result.success) {
        // Create new document and add captured image as first page
        const doc = DDV.documentManager.createDocument({
          name: `Doc-${Date.now()}`,
        });

        const blob = await (result.normalizedImageResult as NormalizedImageResultItem).toBlob("image/png");

        await doc.loadSource([
          {
            convertMode: "cm/auto",
            fileData: blob,
          },
        ]);

        // Return to library view after successful capture
        this.switchView(EnumMWCViews.Library);
      }
    } catch (error) {
      console.error("Camera capture failed:", error);
    } finally {
      this.mwcViews[this.currentView].instance?.setVisible?.(true);
    }
  }

  dispose() {
    Object.values(this.mwcViews).forEach((view) => {
      // view.instance?.dispose?.();
      // todo dispose
    });
    super.dispose();
  }
}

export default MobileWebCapture;

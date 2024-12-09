import { DDV, EditViewer } from "dynamsoft-document-viewer";

export interface PageViewConfig {
  container: HTMLElement;
}

export class PageView {
  private editView: EditViewer = null;

  constructor(private config: PageViewConfig) {}

  async startEditView() {
    if (!this.config.container) {
      throw new Error("Please create a Page Container element");
    }

    this.editView = new DDV.EditViewer({
      container: this.config.container,
      uiConfig: DDV.getDefaultUiConfig("editViewer", { includeAnnotationSet: true }),
    });
  }

  setVisible(visible: boolean) {
    this.config.container.style.display = visible ? "flex" : "none";
  }
}

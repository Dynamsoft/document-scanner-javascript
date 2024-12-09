export interface DocumentViewConfig {
  container: HTMLElement;
}

export class DocumentView {
  constructor(private config: DocumentViewConfig) {}

  setVisible(visible: boolean) {
    this.config.container.style.display = visible ? "flex" : "none";
  }
}

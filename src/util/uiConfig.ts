import { DDV } from "dynamsoft-document-viewer";

// Mobile Top Bar Children Configurations

export const mobileTopBarChildrenConfig: Record<"base" | "edit", any> = {
  base: {
    type: DDV.Elements.Layout,
    className: "ddv-edit-viewer-header-mobile",
    children: [DDV.Elements.Pagination],
  },
  edit: {
    type: DDV.Elements.Layout,
    className: "ddv-edit-viewer-header-mobile",
    children: [DDV.Elements.Undo, DDV.Elements.Redo],
  },
};

// Mobile EditViewer
export const mobileEditViewerUiConfig = {
  type: DDV.Elements.Layout,
  flexDirection: "column",
  className: "ddv-edit-viewer-mobile",
  children: [
    mobileTopBarChildrenConfig.base,
    DDV.Elements.MainView,
    {
      type: DDV.Elements.Layout,
      className: "ddv-edit-viewer-footer-mobile",
      children: [
        {
          type: DDV.Elements.DeleteCurrent,
          events: {
            click: "showDocumentPageByDelete",
          },
        },
        DDV.Elements.Crop,
        {
          type: DDV.Elements.AnnotationSet,
          className: "mwc-annotation-set",
          pullDownBox: {
            className: "mwc-annotation-mode-bar",
          },
        },
      ],
    },
  ],
};

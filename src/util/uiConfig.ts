import { DDV } from "dynamsoft-document-viewer";

// Mobile EditViewer
export const mobileEditViewerUiConfig = {
  type: DDV.Elements.Layout,
  flexDirection: "column",
  className: "ddv-edit-viewer-mobile",
  children: [
    {
      type: DDV.Elements.Layout,
      className: "ddv-edit-viewer-header-mobile",
      children: [
        DDV.Elements.DisplayMode,
        DDV.Elements.Pagination,
        {
          type: DDV.Elements.AnnotationSet,
          className: "mwc-annotation-set",
          pullDownBox: {
            className: "mwc-annotation-mode-bar",
          },
        },
      ],
    },
    DDV.Elements.MainView,
    {
      type: DDV.Elements.Layout,
      className: "ddv-edit-viewer-footer-mobile",
      children: [
        {
          type: DDV.Elements.Button,
          className: "mwc-icon icon-back_arrow",
          tooltip: "Back to Document",
          events: {
            click: "backToDocument",
          },
        },
        {
          type: DDV.Elements.Button,
          className: "mwc-icon icon-perspective",
          style: {
            fontSize: "22px",
          },
          events: {
            click: "showPerspectiveViewer",
          },
        },
        DDV.Elements.Filter,
        DDV.Elements.RotateLeft,
        {
          type: DDV.Elements.DeleteCurrent,
          events: {
            click: "showThumbnailPageByClear",
          },
        },
      ],
    },
  ],
};

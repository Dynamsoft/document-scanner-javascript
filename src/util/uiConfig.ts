import { DDV } from "dynamsoft-document-viewer";

// Mobile CaptureViewer
export const mobileCaptureViewerUiConfig = {
  type: DDV.Elements.Layout,
  flexDirection: "column",
  children: [
    {
      type: DDV.Elements.Layout,
      className: "ddv-capture-viewer-header-mobile",
      children: [
        {
          type: "CameraResolution",
          className: "ddv-capture-viewer-resolution",
        },
        {
          type: DDV.Elements.Layout,
          style: {
            width: "110px",
          },
          children: [
            DDV.Elements.Flashlight,
            {
              type: DDV.Elements.Button,
              style: {
                fontSize: "18px",
              },
              className: "ddv-button-close",
              events: {
                click: "closeCaptureViewer",
              },
            },
          ],
        },
      ],
    },
    DDV.Elements.MainView,
    {
      type: DDV.Elements.Layout,
      className: "ddv-capture-viewer-footer-mobile",
      children: [
        DDV.Elements.AutoDetect,
        DDV.Elements.AutoCapture,
        {
          type: "Capture",
          className: "ddv-capture-viewer-captureButton",
        },
        {
          type: DDV.Elements.ImagePreview,
          events: {
            click: "showThumbnailPage",
          },
        },
        DDV.Elements.CameraConvert,
      ],
    },
  ],
};

// Mobile PerspectiveViewer
export const mobilePerspectiveUiConfig = {
  type: DDV.Elements.Layout,
  flexDirection: "column",
  children: [
    {
      type: DDV.Elements.Layout,
      className: "ddv-perspective-viewer-header-mobile",
      children: [
        {
          type: DDV.Elements.Button,
          className: "mwc-icon icon-back_arrow",
          events: {
            click: "showEditViewer",
          },
        },
        DDV.Elements.Pagination,
        DDV.Elements.Blank,
      ],
    },
    DDV.Elements.MainView,
    {
      type: DDV.Elements.Layout,
      className: "ddv-perspective-viewer-footer-mobile",
      children: [
        DDV.Elements.FullQuad,
        DDV.Elements.Blank,
        DDV.Elements.Blank,
        DDV.Elements.Blank,
        {
          type: DDV.Elements.PerspectiveAll,
          events: {
            click: "showEditViewer",
          },
        },
      ],
    },
  ],
};

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
        {
          type: DDV.Elements.Button,
          className: "mwc-icon icon-back_arrow",
          events: {
            click: "backToThumbnailPage",
          },
        },
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
        DDV.Elements.DisplayMode,
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

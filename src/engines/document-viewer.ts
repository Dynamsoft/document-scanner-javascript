// Document Viewer's engine types. This file has no DOM code and no engine values.

type DocumentViewerModule = typeof import("dynamsoft-document-viewer");

/** Document Viewer's engine, as the document scanner loads it. */
export type DocumentViewerEngine = DocumentViewerModule["DDV"];

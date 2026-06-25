// DDV integration — owns the Document Viewer lifecycle: engine init, the shared
// document the scanner feeds pages into, and the edit-viewer hub the scan loop
// returns to.

import { DDV } from "dynamsoft-document-viewer";
import type { EditViewer, IDocument, UiConfig } from "dynamsoft-document-viewer";
import "dynamsoft-document-viewer/dist/ddv.css";
import { $, isMobile } from "./dom.js";
import { LICENSE } from "./license.js";

let doc: IDocument | null = null;
let hubViewer: EditViewer | null = null;

let ddvReady: Promise<void> | null = null;

// One-time engine + hub setup; later calls await the same promise.
export function ensureDdv(): Promise<void> {
	return (ddvReady ??= init());
}

async function init(): Promise<void> {
	DDV.Core.license = LICENSE;
	// Mirrored into public/ by vite.config.ts; absolute URL because the engine
	// files also load from worker contexts.
	DDV.Core.engineResourcePath = new URL(
		`${import.meta.env.BASE_URL}dynamsoft-document-viewer/dist/engine`,
		document.baseURI,
	).href;
	await DDV.Core.loadWasm();
	await DDV.Core.init();

	doc = DDV.documentManager.createDocument({ name: "scanned-document" });
	hubViewer = new DDV.EditViewer({
		container: $("edit-viewer-container"),
		uiConfig: isMobile ? mobileHubUiConfig() : desktopHubUiConfig(),
		viewerConfig: { scrollToLatest: true },
	});
	hubViewer.openDocument(doc.uid);
}

export function getDoc(): IDocument {
	if (!doc) throw new Error("DDV is not initialized — call ensureDdv() first");
	return doc;
}

// Empties the shared document (Restart scan starts a fresh set).
export function clearDocument(): void {
	doc?.deleteAllPages();
}

// ---- Hub edit viewer (page review between camera sessions) ----

// Custom toolbar buttons — clicks surface as named events on the viewer.
const scanButton: UiConfig = {
	type: DDV.Elements.Button,
	className: "scan-button",
	tooltip: "Scan more pages",
	events: { click: "handleScanClick" },
};

const closeButton: UiConfig = {
	type: DDV.Elements.Button,
	className: "finish-button",
	tooltip: "Finish and view result",
	events: { click: "close" },
};

// Recursively remove named elements from a uiConfig tree — the result view
// owns PDF export, so the hub must not offer its own Download/Print.
function stripElements(config: UiConfig, names: string[]): UiConfig {
	if (!config.children) return config;
	return {
		...config,
		children: config.children
			.filter((child) => typeof child !== "string" || !names.includes(child))
			.map((child) => (typeof child === "string" ? child : stripElements(child, names))),
	};
}

function desktopHubUiConfig(): UiConfig | undefined {
	const config = DDV.getDefaultUiConfig("editViewer");
	if (!config) return undefined;
	// Append the scan + close buttons to the header's right-hand group.
	const header = config.children?.[0];
	const group = typeof header === "object" ? header.children?.[1] : undefined;
	if (typeof group === "object") group.children?.push(scanButton, closeButton);
	return stripElements(config, [DDV.Elements.Download, DDV.Elements.Print]);
}

function mobileHubUiConfig(): UiConfig {
	return {
		type: DDV.Elements.Layout,
		flexDirection: "column",
		className: "ddv-edit-viewer-mobile",
		children: [
			// Header
			{
				type: DDV.Elements.Layout,
				className: "ddv-edit-viewer-header-mobile",
				children: [
					{
						type: DDV.Elements.Layout,
						children: [
							DDV.Elements.Print,
							DDV.Elements.Download,
							DDV.Elements.Pagination,
							DDV.Elements.Blank,
							closeButton,
						],
					},
				],
			},
			// Main document container
			DDV.Elements.MainView,
			// Footer
			{
				type: DDV.Elements.Layout,
				className: "ddv-edit-viewer-footer-mobile",
				children: [
					DDV.Elements.DisplayMode,
					DDV.Elements.RotateLeft,
					DDV.Elements.Crop,
					DDV.Elements.AnnotationSet,
					DDV.Elements.Undo,
					DDV.Elements.DeleteCurrent,
					DDV.Elements.Load,
					scanButton,
				],
			},
		],
	};
}

export function onScanClick(cb: () => void): void {
	hubViewer?.on("handleScanClick", cb);
}

export function onHubClose(cb: () => void): void {
	hubViewer?.on("close", cb);
}

import type { CanvasStyle } from "dynamsoft-document-viewer";
import { ScannerFault, describe } from "../faults";
import type { ThemeLiterals } from "../settings/theme";
import type { DocumentViewerEngine } from "../engines/document-viewer";
import { COMMON_STYLES, adoptStyles, adoptStylesheet, applyTheme } from "./styles";

/** The parts of the loaded engines that a viewer needs. */
export interface ViewerEngines {
	readonly documentViewer: DocumentViewerEngine;
	/** The URL of Document Viewer's stylesheet. */
	readonly stylesheet: string;
}

/**
 * The members of Document Viewer's two viewers that `mountViewer` uses, some
 * narrowed to what it passes.
 */
export interface SharedViewer {
	openDocument(docUid: string): void;
	updateStyle(name: "canvasStyle", style: CanvasStyle): boolean;
}

/** How a screen builds its viewer. `mountViewer` does the rest. */
export interface ViewerMount<V extends SharedViewer> {
	/** The uid of the document the viewer shows. */
	readonly document: string;
	/** The color behind the pages, from the theme. */
	readonly background: string;
	/** The screen's own stylesheets, adopted after Document Viewer's. */
	readonly styles: readonly string[];
	/** Construct the viewer in its area. */
	readonly build: (engine: DocumentViewerEngine) => V;
}

/** Mount a styled, themed viewer in `container`, and open its document. */
export async function mountViewer<V extends SharedViewer>(
	engines: ViewerEngines,
	container: HTMLElement,
	theme: ThemeLiterals,
	mount: ViewerMount<V>,
): Promise<V> {
	try {
		await adoptStylesheet(container, engines.stylesheet);
	} catch (cause) {
		throw new ScannerFault(
			{ kind: "engineLoad", engine: "documentViewer", message: describe(cause) },
			cause,
		);
	}
	// The screen's own sheets go after the engine's, so that they win where the two
	// overlap.
	for (const css of [COMMON_STYLES, ...mount.styles]) adoptStyles(container, css);
	applyTheme(container, theme);
	const viewer = mount.build(engines.documentViewer);
	// A viewer style object cannot read a CSS custom property.
	viewer.updateStyle("canvasStyle", { background: mount.background });
	viewer.openDocument(mount.document);
	return viewer;
}

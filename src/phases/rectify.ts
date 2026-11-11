import type { IDocument, PerspectiveViewer, Quad } from "dynamsoft-document-viewer";
import type { Quadrilateral } from "../results";
import { buttonSettings } from "../settings/settings";
import type { RectifyMode, ResolvedSettings } from "../settings/settings";
import type { DocumentViewerEngine } from "../engines/document-viewer";
import { RectifyScreen } from "./rectify-screen";
import type { PressAction } from "../ui/availability";
import type { RectifyPress } from "./rectify-screen";
import type { ViewerEngines } from "../ui/viewer-mount";
import type { FindBoundary } from "../boundaries/detection";
import { fromQuad, toQuad } from "../boundaries/quads";

/** Where the rectify screen reports each button pressed. */
type PressHandler = (press: RectifyPress) => PressAction;

/**
 * The image the rectify screen shows, and the boundary it starts on, in the
 * image's pixels, or `null` for the whole image.
 */
export interface RectifyImage {
	readonly image: Blob;
	readonly boundary: Quadrilateral | null;
}

/** The phase's screen, built the first time it shows and then kept. */
type RectifyState =
	| { readonly kind: "closed" }
	| {
			readonly kind: "built";
			readonly engine: DocumentViewerEngine;
			readonly screen: RectifyScreen;
			/** The screen's own document, holding the image it shows. */
			readonly document: IDocument;
	  };

/**
 * The rectify phase, where the user chooses the boundary of one image, such as a
 * page just taken or a page's original.
 *
 * The screen shows the image in a document of its own, so it needs no page in
 * the scanned document, and no camera. Undo takes back the changes to the
 * boundary since the image came in, one at a time.
 */
export class RectifyPhase {
	readonly #settings: ResolvedSettings;
	readonly #engines: ViewerEngines;
	readonly #detect: FindBoundary;
	#state: RectifyState = { kind: "closed" };
	/**
	 * The image on screen and where its buttons report, or `null` while the screen
	 * is hidden or its image is loading.
	 */
	#shown: { readonly image: Blob; readonly onPress: PressHandler } | null = null;
	/** The boundary before each change to the image on screen, the last change last. */
	#history: Quad[] = [];
	/** True while undo puts a boundary back, so that its change is not recorded. */
	#restoring = false;
	#released = false;

	/** `detect` serves `detectBoundary()`. */
	constructor(settings: ResolvedSettings, engines: ViewerEngines, detect: FindBoundary) {
		this.#settings = settings;
		this.#engines = engines;
		this.#detect = detect;
	}

	/** The live viewer, or `null` when the screen has not been built. */
	get viewer(): PerspectiveViewer | null {
		return this.#state.kind === "built" ? this.#state.screen.viewer : null;
	}

	/** The boundary on screen, in the image's pixels, or `null` for none. */
	selection(): Quadrilateral | null {
		const quad = this.viewer?.getQuadSelection();
		return quad ? fromQuad(quad) : null;
	}

	/**
	 * Make the screen in `container` ready, on `image`. `mode` is how the phase was
	 * reached. Each press on the screen reports to `onPress`. The screen is built in
	 * `container` on the first mount, and later mounts take the same element, which
	 * may have moved to another container since. The screen's styles were added only
	 * where it was built, so a move under another shadow root needs them there too.
	 */
	async mount(
		container: HTMLElement,
		mode: RectifyMode,
		{ image, boundary }: RectifyImage,
		onPress: PressHandler,
	): Promise<void> {
		const state = await this.#build(container);
		// Released while it was built, so what was built comes down again.
		if (this.#released) {
			this.release();
			return;
		}
		const { screen, document } = state;
		// The screen takes no presses and records no changes until the new image is in.
		this.#shown = null;
		this.#history = [];
		screen.setUndoable(false);
		screen.draw(mode);
		await document.loadSource(image);
		if (this.#released) return;
		screen.viewer.goToPage(0);
		// With no boundary, the viewer stays on the whole image.
		if (boundary) screen.viewer.setQuadSelection(toQuad(boundary));
		// Its buttons report only once its image is in.
		this.#shown = { image, onPress };
		screen.show();
	}

	/**
	 * Hide the screen, and keep it built for the next mount. Its image goes, since
	 * the browser's memory for images can be small.
	 */
	unmount(): void {
		if (this.#state.kind === "built") {
			this.#state.screen.hide();
			this.#state.document.deleteAllPages();
		}
		this.#shown = null;
	}

	/** Take the screen and its document down for good, at the end of the session. */
	release(): void {
		this.#released = true;
		const state = this.#state;
		if (state.kind === "built") {
			state.screen.destroy();
			state.engine.documentManager.deleteDocuments([state.document.uid]);
		}
		this.#state = { kind: "closed" };
		this.#shown = null;
	}

	/** Hold the screen's controls off while the session is busy, or let them go. */
	setControlsHeld(held: boolean): void {
		if (this.#state.kind === "built") this.#state.screen.setControlsHeld(held);
	}

	/** Set the boundary to the whole image. */
	fullImage(): void {
		if (this.#shown) this.viewer?.resetQuadSelection();
	}

	/** Put back the boundary from before the last change, if there is one. */
	undo(): void {
		const state = this.#state;
		if (state.kind !== "built" || !this.#shown) return;
		const previous = this.#history.pop();
		if (previous === undefined) return;
		// The viewer reports this change inside the call, and undo must not record it.
		this.#restoring = true;
		try {
			state.screen.viewer.setQuadSelection(previous);
		} finally {
			this.#restoring = false;
		}
		state.screen.setUndoable(this.#history.length > 0);
	}

	/**
	 * Find the image's edges and show them. Where none are found, nothing changes. A
	 * result that arrives once the screen is hidden, or shows another image, is
	 * dropped.
	 */
	async detectBoundary(): Promise<void> {
		const state = this.#state;
		const shown = this.#shown;
		if (state.kind !== "built" || !shown) return;
		const boundary = await this.#detect(shown.image);
		if (boundary && this.#shown === shown) state.screen.viewer.setQuadSelection(toQuad(boundary));
	}

	/** Build the screen on the first mount. Later mounts reuse it. */
	async #build(container: HTMLElement): Promise<Extract<RectifyState, { kind: "built" }>> {
		const state = this.#state;
		if (state.kind === "built") return state;
		const engine = this.#engines.documentViewer;
		const document = engine.documentManager.createDocument();
		const options = {
			...this.#settings,
			documentUid: document.uid,
			buttons: {
				afterCapture: buttonSettings(this.#settings, "rectify", "afterCapture"),
				fromEdit: buttonSettings(this.#settings, "rectify", "fromEdit"),
			},
			layout: this.#settings.phases.rectify?.layout,
		};
		let screen: RectifyScreen;
		try {
			// Its buttons report only while an image is shown.
			screen = await RectifyScreen.build(this.#engines, container, options, (press) =>
				this.#shown?.onPress(press),
			);
		} catch (thrown) {
			engine.documentManager.deleteDocuments([document.uid]);
			throw thrown;
		}
		// A drag reports once, when it ends. Detect borders and full image report too.
		screen.viewer.on("quadModified", ({ oldQuad }) => this.#record(oldQuad));
		const built = { kind: "built", engine, screen, document } as const;
		this.#state = built;
		return built;
	}

	/** Keep `before`, the boundary before a change on screen, for undo. */
	#record(before: Quad): void {
		// A change while an image loads, or undo's own change, is no step to take back.
		if (this.#state.kind !== "built" || !this.#shown || this.#restoring) return;
		this.#history.push(before);
		this.#state.screen.setUndoable(true);
	}
}

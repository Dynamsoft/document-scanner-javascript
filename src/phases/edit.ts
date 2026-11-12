import type { EditViewer } from "dynamsoft-document-viewer";
import { reportFault } from "../faults";
import { buttonSettings } from "../settings/settings";
import type { ResolvedSettings } from "../settings/settings";
import type { FilterName } from "../settings/filters";
import { EditScreen } from "./edit-screen";
import type { PressAction } from "../ui/availability";
import type { EditPress, PageOrders } from "./edit-screen";
import type { ViewerEngines } from "../ui/viewer-mount";
import type { ScannedDocument } from "../document/document";

/** Where the edit screen reports each button pressed. */
type PressHandler = (press: EditPress) => PressAction;

/** Where the edit screen reports the page orders around a drag in its thumbnails. */
type ReorderHandler = (orders: PageOrders) => void;

/**
 * The longer side of each filter preview, in pixels: enough for the size the
 * preview shows at on a screen of three device pixels to a CSS pixel.
 */
const PREVIEW_SIDE = 240;

/** The edit phase, where the user reviews the document and finishes. */
export class EditPhase {
	readonly #settings: ResolvedSettings;
	readonly #engines: ViewerEngines;
	readonly #scanned: ScannedDocument;
	#screen: EditScreen | null = null;
	#onPress: PressHandler | null = null;
	#onReordered: ReorderHandler | null = null;
	#released = false;
	/** What undo and redo can do, kept for a screen built later. */
	#history = { undoable: false, redoable: false };

	constructor(settings: ResolvedSettings, engines: ViewerEngines, scanned: ScannedDocument) {
		this.#settings = settings;
		this.#engines = engines;
		this.#scanned = scanned;
	}

	/** The live viewer, or `null` when the screen has not been built. */
	get viewer(): EditViewer | null {
		return this.#screen?.viewer ?? null;
	}

	/**
	 * The uid of the page showing, or `null` when the screen is not built or the
	 * document is empty.
	 */
	currentPage(): string | null {
		return this.#screen?.currentPage() ?? null;
	}

	/**
	 * The uids of the pages selected in the thumbnails while they show, or else of
	 * the page showing. Empty when the screen is not built or the document is empty.
	 */
	chosenPages(): string[] {
		return this.#screen?.chosenPages() ?? [];
	}

	/**
	 * Make the screen in `container` ready over the scanned document. The screen is
	 * built on the first mount. Its buttons report to `onPress`, and its drags of
	 * pages to `onReordered`.
	 */
	async mount(
		container: HTMLElement,
		onPress: PressHandler,
		onReordered: ReorderHandler,
	): Promise<void> {
		this.#onPress = onPress;
		this.#onReordered = onReordered;
		// Built on the first mount and then kept.
		const { strings, theme, maxPages } = this.#settings;
		this.#screen ??= await EditScreen.build(
			this.#engines,
			container,
			{
				strings,
				theme,
				maxPages,
				documentUid: this.#scanned.uid,
				canRectify: this.#settings.phases.rectify?.fromEdit != null,
				filters: this.#settings.phases.edit?.filters ?? [],
				buttons: buttonSettings(this.#settings, "edit"),
				// The filter mode is the edit screen's one mode, so it shows the mode bar.
				modeButtons: buttonSettings(this.#settings, "edit", "filter"),
				layout: this.#settings.phases.edit?.layout,
			},
			(press) => this.#onPress?.(press),
			(orders) => this.#onReordered?.(orders),
		);
		// Released while it was built, so it comes down again.
		if (this.#released) {
			this.release();
			return;
		}
		this.#screen.setHistory(this.#history.undoable, this.#history.redoable);
		this.#screen.show();
	}

	/** Hide the screen, and keep it built for the next mount. */
	unmount(): void {
		this.#screen?.hide();
	}

	/** Take the screen down for good, at the end of the session. */
	release(): void {
		this.#released = true;
		this.#screen?.destroy();
		this.#screen = null;
		this.#onPress = null;
		this.#onReordered = null;
	}

	/** Turn a page by `angle` degrees, clockwise. */
	rotate(pageUid: string, angle: number): void {
		this.#screen?.rotate(pageUid, angle);
	}

	/** Turn undo and redo on while each has a change to act on, or off. */
	setHistory(undoable: boolean, redoable: boolean): void {
		this.#history = { undoable, redoable };
		this.#screen?.setHistory(undoable, redoable);
	}

	/** Show the page before the one showing. */
	previousPage(): void {
		this.#screen?.previousPage();
	}

	/** Show the page after the one showing. */
	nextPage(): void {
		this.#screen?.nextPage();
	}

	/** Show the page `pageUid`, if the document still holds it. */
	showPage(pageUid: string): void {
		this.#screen?.showPage(pageUid);
	}

	/** Show the thumbnails of the pages, or hide them. */
	toggleThumbnails(): void {
		this.#screen?.toggleThumbnails();
	}

	/**
	 * Open the filter mode on a page that shows `chosen`, with a preview of the page
	 * under each filter the settings offer. If the previews cannot be made, the mode
	 * shows only the filters' names.
	 */
	async openFilterMode(pageUid: string, chosen: FilterName): Promise<void> {
		const filters = this.#settings.phases.edit?.filters ?? [];
		let previews: ReadonlyMap<FilterName, Blob> = new Map();
		try {
			previews = await this.#scanned.previews(pageUid, filters, PREVIEW_SIDE);
		} catch (thrown) {
			reportFault("the filter previews could not be made", thrown);
		}
		this.#screen?.openFilterMode(
			pageUid,
			filters,
			previews,
			chosen,
			this.#scanned.rotationOf(pageUid),
		);
	}

	/** Mark `filter` as the one the page of the filter mode shows. */
	showFilter(filter: FilterName): void {
		this.#screen?.showFilter(filter);
	}

	/** Close the open mode. */
	closeMode(): void {
		this.#screen?.closeMode();
	}

	/** Hold the screen's controls off while the session is busy, or let them go. */
	setControlsHeld(held: boolean): void {
		this.#screen?.setControlsHeld(held);
	}
}

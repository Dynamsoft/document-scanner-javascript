import type { EditViewer } from "dynamsoft-document-viewer";
import builtInLayout from "./edit-layout.html?raw";
import skeleton from "./edit-ui.html?raw";
import { BUTTON_ATTRIBUTE, EDIT_MODE_BUTTONS, EDIT_SCREEN_BUTTONS } from "../settings/buttons";
import type { EditModeButton, EditScreenButton, HiddenByName } from "../settings/buttons";
import { isDocumentFull } from "../settings/settings";
import type { EditLayout, ResolvedSettings } from "../settings/settings";
import type { FilterName } from "../settings/filters";
import { EDIT_ICON_BUTTONS } from "../settings/strings";
import type { EditIconButton, EditStrings, FilterStrings } from "../settings/strings";
import { Availability } from "../ui/availability";
import type { PressAction } from "../ui/availability";
import { refuseDrops } from "../ui/drops";
import { fillIcons } from "../ui/icons";
import { fillAreas, findControls, parseSkeleton } from "../ui/layout";
import { EDIT_STYLES } from "../ui/styles";
import { mountViewer } from "../ui/viewer-mount";
import type { ViewerEngines } from "../ui/viewer-mount";

// The edit screen. It is built from a skeleton whose header and footer each hold a
// template: the host application's, or else the built-in one. Document Viewer
// draws only the pages and their thumbnails, between them.

/**
 * A press on the edit screen. `rectify` opens the rectify screen on the page
 * showing. `filter` opens the filter mode, and in that mode, a filter chosen
 * names its filter. Apply and cancel close a mode. A filter chosen runs no
 * `onClick`, since `modeButtons` holds only apply and cancel.
 */
export type EditPress =
	| { readonly button: Exclude<EditScreenButton, "filter"> | EditModeButton }
	| { readonly button: "filter"; readonly filter?: FilterName };

/** The order of the pages before and after a drag in the thumbnails, by uid. */
export interface PageOrders {
	readonly before: readonly string[];
	readonly after: readonly string[];
}

/**
 * The order of the pages before a drag, from the order after it and the indices
 * that the dragged pages had. The pages that the drag did not move keep their
 * order among themselves.
 */
export function orderBefore(
	after: readonly string[],
	dragged: readonly string[],
	indicesBefore: readonly number[],
): readonly string[] {
	const before: (string | undefined)[] = Array.from(after, () => undefined);
	dragged.forEach((uid, at) => (before[indicesBefore[at]!] = uid));
	const rest = after.filter((uid) => !dragged.includes(uid));
	return before.map((uid) => uid ?? rest.shift()!);
}

/** What building the edit screen reads. */
export interface EditScreenOptions extends Pick<
	ResolvedSettings,
	"strings" | "theme" | "maxPages"
> {
	/** The uid of the scanned document the screen shows. */
	readonly documentUid: string;
	/** Whether the screen has the button that opens the rectify screen. */
	readonly canRectify: boolean;
	/** The filters the filter mode offers. With none, the screen has no filter button. */
	readonly filters: readonly FilterName[];
	/** Which of the screen's buttons the host application's settings hide. */
	readonly buttons: HiddenByName<EditScreenButton>;
	/** Which mode bar buttons the host application's settings hide, in every mode. */
	readonly modeButtons: HiddenByName<EditModeButton>;
	/** The host application's templates for the screen's areas. */
	readonly layout: EditLayout | undefined;
}

/** The setting that fills the screen's areas, as errors name it. */
const LAYOUT_SETTING = "phases.edit.layout";

/** Every copy of each control on the screen, by its button name. */
type Controls = Readonly<Record<EditScreenButton, readonly HTMLElement[]>>;

/** Each control of the mode bar, by its button name. */
type ModeControls = ReadonlyMap<EditModeButton, HTMLElement>;

/**
 * The edit screen: its bars from markup, around Document Viewer's edit viewer. It
 * starts hidden.
 */
export class EditScreen {
	/** The live viewer, which `getDdvViewer()` also returns to the host application. */
	readonly viewer: EditViewer;
	readonly #element: HTMLElement;
	readonly #controls: Controls;
	readonly #modeControls: ModeControls;
	readonly #options: EditScreenOptions;
	readonly #onPress: (press: EditPress) => PressAction;
	readonly #availability: Availability;
	#held = false;
	#undoable = false;
	#redoable = false;
	/**
	 * The open mode's page, which the screen holds still, and whether the thumbnails
	 * showed before the mode hid them. `null` with no mode open.
	 */
	#openMode: { readonly pageUid: string; readonly thumbnails: boolean } | null = null;
	/** The object URLs of the filter previews that show. */
	#previewUrls: string[] = [];

	private constructor(
		viewer: EditViewer,
		element: HTMLElement,
		controls: Controls,
		modeControls: ModeControls,
		options: EditScreenOptions,
		onPress: (press: EditPress) => PressAction,
		availability: Availability,
	) {
		this.viewer = viewer;
		this.#element = element;
		this.#controls = controls;
		this.#modeControls = modeControls;
		this.#options = options;
		this.#onPress = onPress;
		this.#availability = availability;
		viewer.on("paginationChanged", () => {
			// The edit viewer can turn off a swipe only when it is built, so a swipe can
			// still move it while a mode works on one page.
			const pageUid = this.#openMode?.pageUid;
			if (pageUid !== undefined && viewer.getCurrentPageUid() !== pageUid) {
				viewer.goToPage(viewer.uidToIndex(pageUid));
			}
			this.#refreshControls();
		});
		this.#refreshControls();
	}

	/**
	 * Build the screen, hidden, in `container`. Report each press on its buttons to
	 * `onPress`, and the page orders around each drag in the thumbnails to `onReordered`.
	 */
	static async build(
		engines: ViewerEngines,
		container: HTMLElement,
		options: EditScreenOptions,
		onPress: (press: EditPress) => PressAction,
		onReordered: (orders: PageOrders) => void,
	): Promise<EditScreen> {
		const element = parseSkeleton(skeleton);
		element.hidden = true;
		refuseDrops(element);
		fillAreas(element, options.layout, builtInLayout);
		fillIcons(element);
		const strings = options.strings.edit;
		const availability = new Availability();
		// A button that opens a mode shows only while its mode is on.
		const modeOff: Partial<Record<EditScreenButton, boolean>> = {
			rectify: !options.canRectify,
			filter: options.filters.length === 0,
		};
		// The mode bar has buttons of the same names, which are not the screen's own.
		const bars = element.querySelectorAll(
			":scope > :is(.mds-edit-header, .mds-edit-stage, .mds-edit-footer)",
		);
		const controls = findControls([...bars], EDIT_SCREEN_BUTTONS, LAYOUT_SETTING);
		for (const button of EDIT_SCREEN_BUTTONS) {
			const hidden = modeOff[button] || options.buttons?.[button]?.hidden === true;
			for (const control of controls[button]) {
				label(control, button, strings);
				availability.listen(control, () => onPress({ button }));
				if (hidden) control.hidden = true;
			}
		}
		element.querySelector(".mds-edit-filters")!.setAttribute("aria-label", strings.filter);
		const modeBar = element.querySelector<HTMLElement>(".mds-edit-mode-header")!;
		const modeControls: ModeControls = new Map(
			EDIT_MODE_BUTTONS.map((button) => {
				const control = modeBar.querySelector<HTMLElement>(`[${BUTTON_ATTRIBUTE}="${button}"]`)!;
				control.querySelector(".mds-edit-label")!.textContent = strings[MODE_LABELS[button]];
				availability.listen(control, () => onPress({ button }));
				if (options.modeButtons?.[button]?.hidden === true) control.hidden = true;
				return [button, control];
			}),
		);
		// In the page first, so that the viewer's styles reach the root it is in.
		container.append(element);
		const area = element.querySelector<HTMLElement>(".mds-edit-viewer")!;
		try {
			const viewer = await mountViewer<EditViewer>(engines, area, options.theme, {
				document: options.documentUid,
				background: options.theme.surface,
				styles: [EDIT_STYLES],
				build: (engine) => {
					const { primary, background, onSurface, surface } = options.theme;
					// Document Viewer's style objects cannot read a custom property, and it quotes
					// a font value that holds a space as one family name. Thus the page numbers get
					// the families of `--mds-font` with no spaces, which drops a family whose own
					// name has one.
					const font = getComputedStyle(element)
						.getPropertyValue("--mds-font")
						.split(",")
						.map((family) => family.trim())
						.filter((family) => !/\s/.test(family))
						.join(",");
					// The pages have no border, and must not show white under a scaled image.
					const page = { border: "0px solid transparent", background: "transparent" };
					const current = { ...page, border: `2px solid ${primary}` };
					const built = new engine.EditViewer({
						container: area,
						uiConfig: { type: engine.Elements.MainView },
						// A strip of thumbnails, one per row, beside the page. It starts hidden. A
						// drag in it moves a page, and a dropped file would pass `maxPages`.
						thumbnailConfig: {
							visibility: "hidden",
							position: "left",
							size: "88px",
							columns: 1,
							rows: 5,
							enableDragPage: true,
							enableLoadSourceByDrag: false,
							// A tap has no modifier keys, so on a touch screen each tap, or click, toggles
							// the selection of its page. Document Viewer detects touch with this test.
							multiselectMode: "ontouchstart" in document.documentElement,
							canvasStyle: { background: surface },
							pageStyle: page,
							hoveredPageStyle: page,
							selectedPageStyle: page,
							currentPageStyle: current,
							// Each page's number on a badge in its middle.
							pageNumberStyle: {
								onPage: true,
								left: "50%",
								top: "50%",
								translateX: "-50%",
								translateY: "-50%",
								width: "24px",
								height: "24px",
								borderRadius: "6px",
								background: onSurface,
								color: background,
								fontSize: "14px",
								fontFamily: font,
							},
							checkboxStyle: {
								left: "3px",
								top: "50%",
								translateY: "-50%",
								width: "16px",
								height: "16px",
								border: `2px solid ${primary}`,
								borderRadius: "4px",
								background: onSurface,
								checkMarkColor: primary,
								checkMarkLineWidth: "2px",
							},
						},
						viewerConfig: {
							pageStyle: page,
							currentPageStyle: page,
							// A dropped file would become a page past `maxPages`.
							enableLoadSourceByDrag: false,
						},
						// The session's history holds every change, so Document Viewer's own undo
						// must not run from the keyboard.
						keyboardInteractionConfig: { enableUndoRedo: false },
					});
					built.thumbnail.on("pagesDropped", ({ pageUids, indicesBefore, indicesAfter }) => {
						if (indicesBefore.every((index, at) => index === indicesAfter[at])) return;
						const after = built.currentDocument!.pages;
						onReordered({ before: orderBefore(after, pageUids, indicesBefore), after });
					});
					// One page at a time, which the page buttons move between.
					built.displayMode = "single";
					return built;
				},
			});
			return new EditScreen(
				viewer,
				element,
				controls,
				modeControls,
				options,
				onPress,
				availability,
			);
		} catch (thrown) {
			element.remove();
			throw thrown;
		}
	}

	/** The uid of the page showing, or `null` when the document is empty. */
	currentPage(): string | null {
		return this.viewer.getCurrentPageUid() || null;
	}

	/**
	 * The uids of the pages selected in the thumbnails while they show, or else of
	 * the page showing. Empty when the document is empty.
	 */
	chosenPages(): string[] {
		const { thumbnail } = this.viewer;
		// The selection outlives a hidden strip, where the user cannot see it.
		const selected = thumbnail.isVisible ? thumbnail.getSelectedPageIndices() : [];
		if (selected.length > 0) return selected.map((index) => this.viewer.indexToUid(index));
		const current = this.currentPage();
		return current ? [current] : [];
	}

	/** Turn a page by `angle` degrees, clockwise. */
	rotate(pageUid: string, angle: number): void {
		const index = this.viewer.uidToIndex(pageUid);
		if (index >= 0) this.viewer.rotate(angle, [index]);
	}

	/** Turn undo and redo on while each has a change to act on, or off. */
	setHistory(undoable: boolean, redoable: boolean): void {
		this.#undoable = undoable;
		this.#redoable = redoable;
		this.#refreshControls();
	}

	/** Show the page before the one showing, if any. */
	previousPage(): void {
		const index = this.viewer.getCurrentPageIndex();
		if (index > 0) this.viewer.goToPage(index - 1);
	}

	/** Show the page after the one showing, if any. */
	nextPage(): void {
		const index = this.viewer.getCurrentPageIndex();
		if (index + 1 < this.viewer.getPageCount()) this.viewer.goToPage(index + 1);
	}

	/** Show the page `pageUid`, if the document still holds it. */
	showPage(pageUid: string): void {
		const index = this.viewer.uidToIndex(pageUid);
		if (index >= 0 && this.viewer.getCurrentPageUid() !== pageUid) this.viewer.goToPage(index);
	}

	/** Show the thumbnails of the pages, or hide them. */
	toggleThumbnails(): void {
		const { thumbnail } = this.viewer;
		if (thumbnail.isVisible) thumbnail.hide();
		else thumbnail.show();
		this.#refreshControls();
	}

	/** Mark the controls unavailable while the session is busy, or available again. */
	setControlsHeld(held: boolean): void {
		this.#held = held;
		this.#refreshControls();
	}

	/** Make the screen visible. */
	show(): void {
		this.#element.hidden = false;
		// After the element shows, so that the viewer measures its area again.
		this.viewer.show();
		this.#refreshControls();
	}

	/** Make the screen invisible, and keep it built. */
	hide(): void {
		this.#element.hidden = true;
		this.viewer.hide();
	}

	/**
	 * Open the filter mode on the page `pageUid`. The mode bar takes the header's
	 * place, and a choice of each of `filters`, with its preview from `previews`
	 * where one exists, takes the footer's. The previews turn by `angle` degrees
	 * clockwise, as the page does. The page holds still meanwhile, so the thumbnails
	 * and the page moves hide.
	 */
	openFilterMode(
		pageUid: string,
		filters: readonly FilterName[],
		previews: ReadonlyMap<FilterName, Blob>,
		chosen: FilterName,
		angle: number,
	): void {
		const strip = this.#element.querySelector<HTMLElement>(".mds-edit-filters")!;
		strip.replaceChildren(
			...filters.map((filter) => this.#filterChoice(filter, previews.get(filter), angle)),
		);
		this.#element.querySelector(".mds-edit-title")!.textContent = this.#options.strings.edit.filter;
		this.#enterMode(pageUid);
		this.showFilter(chosen);
		// The button that opened the mode hides, so the focus moves to the mode.
		const shown = strip.querySelector<HTMLElement>('[aria-pressed="true"]');
		(shown ?? this.#modeControls.get("cancel")!).focus();
	}

	/** Mark the choice of `filter` as the one the page shows. */
	showFilter(filter: FilterName): void {
		for (const choice of this.#filterChoices()) {
			choice.setAttribute("aria-pressed", String(choice.dataset["mdsFilter"] === filter));
		}
	}

	/** Close the open mode, and bring the header, the footer, and the page moves back. */
	closeMode(): void {
		this.#leaveMode();
		this.#element.querySelector(".mds-edit-filters")!.replaceChildren();
		this.#revokePreviews();
		this.#controls.filter[0]?.focus();
	}

	/** Take the screen down for good. */
	destroy(): void {
		this.viewer.destroy();
		this.#element.remove();
		this.#revokePreviews();
	}

	/** Build the button that chooses `filter`, with its preview above its name. */
	#filterChoice(filter: FilterName, preview: Blob | undefined, angle: number): HTMLElement {
		const choice = document.createElement("button");
		choice.type = "button";
		choice.className = "mds-edit-filter";
		choice.dataset["mdsFilter"] = filter;
		if (preview) {
			const image = document.createElement("img");
			image.className = "mds-edit-filter-preview";
			image.alt = "";
			const url = URL.createObjectURL(preview);
			this.#previewUrls.push(url);
			image.src = url;
			image.style.rotate = `${angle}deg`;
			choice.append(image);
		}
		const name = document.createElement("span");
		name.className = "mds-edit-label";
		name.textContent = this.#options.strings.edit[FILTER_LABELS[filter]];
		choice.append(name);
		this.#availability.listen(choice, () => this.#onPress({ button: "filter", filter }));
		return choice;
	}

	/** The choices of the filter mode, while it is open. */
	#filterChoices(): NodeListOf<HTMLElement> {
		return this.#element.querySelectorAll<HTMLElement>(".mds-edit-filter");
	}

	/**
	 * Show the mode bar and the mode's choices in place of the screen's own bars,
	 * hide the thumbnails, and hold the viewer on the page `pageUid`.
	 */
	#enterMode(pageUid: string): void {
		this.#showBars(true);
		const { thumbnail } = this.viewer;
		this.#openMode ??= { pageUid, thumbnails: thumbnail.isVisible };
		thumbnail.hide();
		if (this.viewer.getCurrentPageUid() !== pageUid) {
			this.viewer.goToPage(this.viewer.uidToIndex(pageUid));
		}
		this.#refreshControls();
	}

	/** Put the screen's own bars back, and the thumbnails as they were. */
	#leaveMode(): void {
		this.#showBars(false);
		if (this.#openMode?.thumbnails) this.viewer.thumbnail.show();
		this.#openMode = null;
		this.#refreshControls();
	}

	/** Show the mode's bars and hide the screen's own, or the other way round. */
	#showBars(mode: boolean): void {
		// The layout can leave the header or the footer out.
		const own = ".mds-edit-header, .mds-edit-footer, .mds-edit-float-bar";
		for (const bar of this.#element.querySelectorAll<HTMLElement>(own)) bar.hidden = mode;
		for (const bar of this.#element.querySelectorAll<HTMLElement>(
			".mds-edit-mode-header, .mds-edit-filters",
		)) {
			bar.hidden = !mode;
		}
	}

	/** Release the object URLs of the previews that show. */
	#revokePreviews(): void {
		for (const url of this.#previewUrls.splice(0)) URL.revokeObjectURL(url);
	}

	/**
	 * Draw the page number and the state of each control. A control is off while it
	 * has nothing to act on.
	 */
	#refreshControls(): void {
		const count = this.viewer.getPageCount();
		const number = this.viewer.getCurrentPageIndex() + 1;
		this.#element.querySelector(".mds-edit-page-number")!.textContent = `${number}/${count}`;
		// Whether each control is off because it has nothing to act on.
		const off: Readonly<Partial<Record<EditScreenButton, boolean>>> = {
			addPage: isDocumentFull(this.#options, count),
			previousPage: number <= 1,
			nextPage: number >= count,
			// The buttons that act on the pages chosen or the page showing, and done,
			// since a scan with no pages is no result.
			delete: count === 0,
			done: count === 0,
			rectify: count === 0,
			rotate: count === 0,
			filter: count === 0,
			undo: !this.#undoable,
			redo: !this.#redoable,
		};
		for (const button of EDIT_SCREEN_BUTTONS) {
			for (const control of this.#controls[button]) {
				this.#availability.draw(control, { off: off[button], held: this.#held });
			}
		}
		for (const control of [...this.#modeControls.values(), ...this.#filterChoices()]) {
			this.#availability.draw(control, { held: this.#held });
		}
		for (const thumbnails of this.#controls.thumbnails) {
			thumbnails.setAttribute("aria-pressed", String(this.viewer.thumbnail.isVisible));
		}
	}
}

/**
 * Give `control` its text. A button that shows only an icon takes its label as
 * its accessible name, with a tooltip. Any other button shows its label.
 */
function label(control: HTMLElement, button: EditScreenButton, strings: EditStrings): void {
	const part = control.querySelector(".mds-edit-label");
	if (isIconButton(button)) {
		control.setAttribute("aria-label", strings[button]);
		control.setAttribute("title", strings[`${button}Tooltip`]);
	} else if (part) {
		part.textContent = strings[button];
	} else {
		// A copy without the part shows only its icon.
		control.setAttribute("aria-label", strings[button]);
	}
}

/** The key of each mode button's label in the edit strings. */
const MODE_LABELS: Readonly<Record<EditModeButton, keyof EditStrings>> = {
	cancel: "modeCancel",
	apply: "modeApply",
};

/** The key of each filter's name in the edit strings. */
const FILTER_LABELS: Readonly<Record<FilterName, keyof FilterStrings>> = {
	none: "filterNone",
	blackAndWhite: "filterBlackAndWhite",
	gray: "filterGray",
	removeShadow: "filterRemoveShadow",
	saveInk: "filterSaveInk",
	enhance: "filterEnhance",
};

function isIconButton(button: EditScreenButton): button is EditIconButton {
	return (EDIT_ICON_BUTTONS as readonly string[]).includes(button);
}

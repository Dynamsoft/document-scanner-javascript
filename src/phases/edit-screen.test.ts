import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { EDIT_SCREEN_BUTTONS } from "../settings/buttons";
import type { EditScreenButton } from "../settings/buttons";
import { FILTER_NAMES } from "../settings/filters";
import { DEFAULT_EDIT_STRINGS, DEFAULT_STRINGS } from "../settings/strings";
import { DEFAULT_THEME } from "../settings/theme";
import type { DocumentViewerEngine } from "../engines/document-viewer";
import { EditScreen, orderBefore } from "./edit-screen";
import type { EditPress, EditScreenOptions, PageOrders } from "./edit-screen";
import type { ViewerEngines } from "../ui/viewer-mount";

/**
 * A stand-in for Document Viewer's edit viewer over a document of `pageCount`
 * pages. It logs its calls, and a test raises its events with `emit`.
 */
class FakeViewer {
	readonly calls: string[] = [];
	readonly listeners = new Map<string, (event: unknown) => void>();
	pageCount = 0;
	index = -1;
	displayMode = "continuous";
	readonly thumbnail = {
		isVisible: false,
		show: () => void (this.thumbnail.isVisible = true),
		hide: () => void (this.thumbnail.isVisible = false),
		listeners: new Map<string, (event: unknown) => void>(),
		on: (event: string, listener: (event: unknown) => void) =>
			void this.thumbnail.listeners.set(event, listener),
		selected: [] as number[],
		getSelectedPageIndices: () => [...this.thumbnail.selected],
	};
	constructor(
		readonly options: {
			readonly container: HTMLElement;
			readonly uiConfig: unknown;
			readonly thumbnailConfig: unknown;
			readonly keyboardInteractionConfig: unknown;
			readonly viewerConfig: unknown;
		},
	) {}
	on(event: string, listener: (event: unknown) => void): void {
		this.listeners.set(event, listener);
	}
	emit(event: string, payload?: unknown): void {
		this.listeners.get(event)?.(payload);
	}
	/** Hold `pageCount` pages, showing the one at `index`, and say so. */
	showPages(pageCount: number, index: number): void {
		this.pageCount = pageCount;
		this.index = index;
		this.emit("paginationChanged");
	}
	getPageCount(): number {
		return this.pageCount;
	}
	getCurrentPageIndex(): number {
		return this.index;
	}
	getCurrentPageUid(): string {
		return this.index < 0 ? "" : `page${this.index + 1}`;
	}
	/** The uids of the document's pages, in order, as a drag leaves them. */
	order: string[] = [];
	get currentDocument() {
		return { pages: this.order };
	}
	indexToUid(index: number): string {
		return `page${index + 1}`;
	}
	uidToIndex(uid: string): number {
		const index = Number(uid.slice("page".length)) - 1;
		return index < this.pageCount ? index : -1;
	}
	goToPage(index: number): number {
		this.calls.push(`goToPage ${index}`);
		return index;
	}
	rotate(angle: number, indices: number[]): boolean {
		this.calls.push(`rotate ${angle} ${indices.join(" ")}`);
		return true;
	}

	updateStyle(): boolean {
		return true;
	}
	openDocument(uid: string): void {
		this.calls.push(`openDocument ${uid}`);
	}
	show(): void {
		this.calls.push("show");
	}
	hide(): void {
		this.calls.push("hide");
	}
	destroy(): void {
		this.calls.push("destroy");
	}
}

/** Document Viewer, with only what building the screen uses. */
const ENGINES: ViewerEngines = {
	documentViewer: {
		EditViewer: FakeViewer,
		Elements: { MainView: "MainView" },
	} as unknown as DocumentViewerEngine,
	stylesheet: `data:text/css,${encodeURIComponent(".ddv-test {}")}`,
};

const containers: HTMLElement[] = [];

afterEach(() => {
	for (const container of containers.splice(0)) container.remove();
	vi.restoreAllMocks();
});

/** Build an edit screen whose presses are logged in `presses`. */
async function editScreen(options: Partial<EditScreenOptions> = {}) {
	const container = document.body.appendChild(document.createElement("div"));
	// As in a session, where the screen gets the size variables from this element.
	container.className = "mds-scanner";
	containers.push(container);
	const presses: EditPress[] = [];
	const reordered: PageOrders[] = [];
	// The ends of the actions that presses start, once presses start actions.
	let actions: (() => void)[] | null = null;
	/** Start an action for a press, when presses start actions. */
	const act = () => (actions ? new Promise<void>((end) => actions!.push(end)) : undefined);
	const screen: EditScreen = await EditScreen.build(
		ENGINES,
		container,
		{
			strings: DEFAULT_STRINGS,
			theme: DEFAULT_THEME,
			maxPages: "unlimited",
			documentUid: "doc1",
			canRectify: true,
			filters: FILTER_NAMES,
			buttons: undefined,
			modeButtons: undefined,
			layout: undefined,
			...options,
		},
		(press) => {
			presses.push(press);
			return act();
		},
		(orders) => reordered.push(orders),
	);
	const root = container.querySelector<HTMLElement>(".mds-edit")!;
	/** Find one of the screen's controls by name. */
	const control = (name: EditScreenButton) =>
		root.querySelector<HTMLElement>(`[data-mds-button="${name}"]`)!;
	/** The names of the controls that are off. */
	const off = () =>
		EDIT_SCREEN_BUTTONS.filter((button) => control(button).hasAttribute("disabled"));
	return {
		screen,
		container,
		root,
		presses,
		reordered,
		/** Make each press start an action, which runs until `endActions()`. */
		startActions: () => void (actions = []),
		/** End every action started, and wait until the screen sees them end. */
		endActions: async () => {
			for (const end of actions!.splice(0)) end();
			await new Promise((resolve) => setTimeout(resolve));
		},
		control,
		off,
		pageNumber: () => root.querySelector(".mds-edit-page-number")!.textContent,
		viewer: screen.viewer as unknown as FakeViewer,
	};
}

describe("EditScreen.build()", () => {
	it("builds the screen hidden, with the viewer drawing one page and the thumbnails in its area", async () => {
		const { root, viewer } = await editScreen();
		expect(root.hidden).toBe(true);
		expect(viewer.options.container).toBe(root.querySelector(".mds-edit-viewer"));
		expect(viewer.options.uiConfig).toEqual({ type: "MainView" });
		expect(viewer.options.thumbnailConfig).toMatchObject({
			visibility: "hidden",
			columns: 1,
			enableDragPage: true,
			enableLoadSourceByDrag: false,
		});
		expect(viewer.options.viewerConfig).toMatchObject({ enableLoadSourceByDrag: false });
		expect(viewer.displayMode).toBe("single");
		expect(viewer.calls).toEqual(["openDocument doc1"]);
	});

	it("numbers the thumbnails in the font families of the screens, with no spaces", async () => {
		const { viewer } = await editScreen();
		expect(viewer.options.thumbnailConfig).toMatchObject({
			pageNumberStyle: { fontFamily: "Inter,system-ui,sans-serif" },
		});
	});

	it("leaves nothing in the container when the viewer cannot be built", async () => {
		const container = document.body.appendChild(document.createElement("div"));
		containers.push(container);
		const engines = { ...ENGINES, stylesheet: "/no-such-sheet.css" };
		const options = {
			strings: DEFAULT_STRINGS,
			theme: DEFAULT_THEME,
			maxPages: "unlimited",
			documentUid: "doc1",
			canRectify: true,
			filters: FILTER_NAMES,
			buttons: undefined,
			modeButtons: undefined,
			layout: undefined,
		} as const;
		await expect(
			EditScreen.build(
				engines,
				container,
				options,
				() => undefined,
				() => undefined,
			),
		).rejects.toThrow();
		expect(container.children).toHaveLength(0);
	});
});

describe("the edit screen's layout", () => {
	/** A template holding `markup`. */
	function template(markup: string): HTMLTemplateElement {
		const holder = document.createElement("template");
		holder.innerHTML = markup.trim();
		return holder;
	}

	it("fills its footer from the layout, and labels every copy of a button", async () => {
		const footer = template(`
			<button data-mds-button="rotate"><span class="mds-edit-label"></span></button>
			<button data-mds-button="rotate"><span class="mds-icon" data-mds-icon="rotate"></span></button>
		`);
		const { root, presses, viewer } = await editScreen({ layout: { footer } });
		viewer.showPages(1, 0);
		const [text, icon] = root.querySelectorAll<HTMLElement>('[data-mds-button="rotate"]');
		expect([text!.textContent?.trim(), icon!.getAttribute("aria-label")]).toEqual([
			"Rotate",
			"Rotate",
		]);
		icon!.click();
		expect(presses).toEqual([{ button: "rotate" }]);
	});

	it("opens and closes a mode with the header and footer left out", async () => {
		const { screen, root } = await editScreen({ layout: { header: false, footer: false } });
		screen.openFilterMode("page1", ["none"], new Map(), "none", 0);
		screen.closeMode();
		expect(root.querySelector(".mds-edit-mode-header")?.hasAttribute("hidden")).toBe(true);
	});
});

describe("the edit screen", () => {
	it("reports a press on each button by the button's name", async () => {
		const { screen, presses, control, viewer } = await editScreen();
		viewer.showPages(3, 1);
		screen.setHistory(true, true);
		for (const button of EDIT_SCREEN_BUTTONS) control(button).click();
		expect(presses.map((press) => press.button)).toEqual(EDIT_SCREEN_BUTTONS);
	});

	it("labels each button from the strings", async () => {
		const { control } = await editScreen({
			strings: { ...DEFAULT_STRINGS, edit: { ...DEFAULT_EDIT_STRINGS, rotate: "Turn" } },
		});
		expect(control("rotate").textContent?.trim()).toBe("Turn");
		expect(control("done").textContent?.trim()).toBe("Done");
		expect([control("cancel").ariaLabel, control("cancel").title]).toEqual([
			"Cancel",
			"Discard all pages and close",
		]);
		expect(control("nextPage").textContent?.trim()).toBe("");
	});

	it("has no button for the rectify screen when that screen cannot open from here", async () => {
		const { control } = await editScreen({ canRectify: false });
		expect(control("rectify").hidden).toBe(true);
	});

	it("has no filter button when the filter mode offers no filter", async () => {
		const { control } = await editScreen({ filters: [] });
		expect(control("filter").hidden).toBe(true);
	});

	it("shows the position of the page in the document", async () => {
		const { off, pageNumber, viewer } = await editScreen();
		viewer.showPages(3, 0);
		expect([pageNumber(), off()]).toEqual(["1/3", ["previousPage", "undo", "redo"]]);
		viewer.showPages(3, 1);
		expect([pageNumber(), off()]).toEqual(["2/3", ["undo", "redo"]]);
		viewer.showPages(3, 2);
		expect([pageNumber(), off()]).toEqual(["3/3", ["nextPage", "undo", "redo"]]);
	});

	it("turns off done and the buttons that act on a page while the document is empty", async () => {
		const { off, pageNumber, viewer } = await editScreen();
		viewer.showPages(0, -1);
		expect([pageNumber(), off()]).toEqual([
			"0/0",
			["done", "previousPage", "nextPage", "delete", "undo", "redo", "rectify", "rotate", "filter"],
		]);
	});

	it("turns undo and redo on while each has a change to act on", async () => {
		const { screen, off, viewer } = await editScreen();
		viewer.showPages(2, 0);
		screen.setHistory(true, false);
		expect(off()).toEqual(["previousPage", "redo"]);
		screen.setHistory(false, true);
		expect(off()).toEqual(["previousPage", "undo"]);
	});

	it("turns add page off while the document is full", async () => {
		const { off, viewer } = await editScreen({ maxPages: 2 });
		viewer.showPages(1, 0);
		expect(off()).not.toContain("addPage");
		viewer.showPages(2, 0);
		expect(off()).toContain("addPage");
	});

	it("holds every control without turning it off", async () => {
		const { screen, off, control, viewer } = await editScreen();
		viewer.showPages(3, 1);
		screen.setHistory(true, true);
		const unavailable = () =>
			EDIT_SCREEN_BUTTONS.filter(
				(button) => control(button).getAttribute("aria-disabled") === "true",
			);
		screen.show();
		control("rotate").focus();
		screen.setControlsHeld(true);
		expect([off(), unavailable()]).toEqual([[], EDIT_SCREEN_BUTTONS]);
		expect(document.activeElement).toBe(control("rotate"));
		screen.setControlsHeld(false);
		expect([off(), unavailable()]).toEqual([[], []]);
	});

	it("chooses the pages selected in the thumbnails while they show, or else the page showing", async () => {
		const { screen, viewer } = await editScreen();
		expect(screen.chosenPages()).toEqual([]);
		viewer.showPages(3, 1);
		expect(screen.chosenPages()).toEqual(["page2"]);
		viewer.thumbnail.selected = [0, 2];
		expect(screen.chosenPages()).toEqual(["page2"]);
		screen.toggleThumbnails();
		expect(screen.chosenPages()).toEqual(["page1", "page3"]);
	});

	it("keeps the buttons the host application hides hidden on the screen and on the mode bar", async () => {
		const { screen, root, control, viewer } = await editScreen({
			buttons: { addPage: { hidden: true } },
			modeButtons: { apply: { hidden: true } },
		});
		viewer.showPages(3, 1);
		const hidden = EDIT_SCREEN_BUTTONS.filter((button) => control(button).hidden);
		expect(hidden).toEqual(["addPage"]);
		screen.openFilterMode("page1", ["none"], new Map(), "none", 0);
		const apply = root.querySelector<HTMLElement>(
			'.mds-edit-mode-header [data-mds-button="apply"]',
		)!;
		expect(apply.hidden).toBe(true);
	});

	it("moves to and rotates only the pages that exist", async () => {
		const { screen, viewer } = await editScreen();
		viewer.showPages(2, 0);
		screen.previousPage();
		screen.nextPage();
		screen.rotate("page2", -90);
		viewer.showPages(2, 1);
		screen.nextPage();
		screen.previousPage();
		expect(viewer.calls.slice(1)).toEqual(["goToPage 1", "rotate -90 1", "goToPage 0"]);
		expect(screen.currentPage()).toBe("page2");
		viewer.showPages(0, -1);
		screen.rotate("page1", 90);
		expect(viewer.calls.at(-1)).toBe("goToPage 0");
		expect(screen.currentPage()).toBeNull();
	});

	it("shows a page by its uid, and no uid that the document lacks", async () => {
		const { screen, viewer } = await editScreen();
		viewer.showPages(3, 0);
		viewer.calls.length = 0;
		screen.showPage("page3");
		screen.showPage("page9");
		expect(viewer.calls).toEqual(["goToPage 2"]);
	});

	it("reports each drag in the thumbnails that changes the order", async () => {
		const { reordered, viewer } = await editScreen();
		const drop = viewer.thumbnail.listeners.get("pagesDropped")!;
		// A and B, dragged below D.
		viewer.order = ["C", "D", "A", "B"];
		drop({ pageUids: ["A", "B"], indicesBefore: [0, 1], indicesAfter: [2, 3] });
		drop({ pageUids: ["C"], indicesBefore: [0], indicesAfter: [0] });
		expect(reordered).toEqual([{ before: ["A", "B", "C", "D"], after: ["C", "D", "A", "B"] }]);
	});

	it("turns off the keyboard's undo and redo, which would act outside the history", async () => {
		const { viewer } = await editScreen();
		expect(viewer.options.keyboardInteractionConfig).toEqual({ enableUndoRedo: false });
	});

	it("shows the thumbnails while their toggle is pressed", async () => {
		const { screen, control, viewer } = await editScreen();
		expect(control("thumbnails").ariaPressed).toBe("false");
		screen.toggleThumbnails();
		expect([viewer.thumbnail.isVisible, control("thumbnails").ariaPressed]).toEqual([true, "true"]);
		screen.toggleThumbnails();
		expect([viewer.thumbnail.isVisible, control("thumbnails").ariaPressed]).toEqual([
			false,
			"false",
		]);
	});

	it("shows, hides, and takes down the element with the viewer", async () => {
		const { screen, root, container, viewer } = await editScreen();
		screen.show();
		expect(root.hidden).toBe(false);
		screen.hide();
		expect(root.hidden).toBe(true);
		screen.destroy();
		expect(viewer.calls.slice(1)).toEqual(["show", "hide", "destroy"]);
		expect(container.children).toHaveLength(0);
	});
});

describe("the edit screen's filter mode", () => {
	/** The bars of the screen that show, by class. */
	function shownBars(root: HTMLElement): string[] {
		const bars = [
			"mds-edit-header",
			"mds-edit-mode-header",
			"mds-edit-float-bar",
			"mds-edit-footer",
			"mds-edit-filters",
		];
		return bars.filter((bar) => !root.querySelector<HTMLElement>(`.${bar}`)!.hidden);
	}

	/** The choices of the filter mode, with their names, previews, and whether each shows. */
	function choices(root: HTMLElement) {
		return [...root.querySelectorAll<HTMLElement>(".mds-edit-filter")].map((choice) => ({
			name: choice.textContent,
			preview: choice.querySelector("img")?.style.rotate ?? null,
			shown: choice.getAttribute("aria-pressed"),
		}));
	}

	it("puts the mode bar and a choice of each filter, with its preview, in place of the bars", async () => {
		const { screen, root, viewer } = await editScreen();
		viewer.showPages(1, 0);
		const preview = new Blob(["a preview"], { type: "image/jpeg" });
		screen.openFilterMode("page1", ["none", "gray"], new Map([["gray", preview]]), "gray", 90);
		expect(shownBars(root)).toEqual(["mds-edit-mode-header", "mds-edit-filters"]);
		expect(root.querySelector(".mds-edit-title")!.textContent).toBe("Filter");
		expect(choices(root)).toEqual([
			{ name: "Original", preview: null, shown: "false" },
			{ name: "Grayscale", preview: "90deg", shown: "true" },
		]);
	});

	it("reports each press in the filter mode", async () => {
		const { screen, root, presses } = await editScreen();
		screen.openFilterMode("page1", ["none", "gray"], new Map(), "none", 0);
		root.querySelector<HTMLElement>('[data-mds-filter="gray"]')!.click();
		for (const button of ["apply", "cancel"]) {
			root
				.querySelector<HTMLElement>(`.mds-edit-mode-header [data-mds-button="${button}"]`)!
				.click();
		}
		expect(presses).toEqual([
			{ button: "filter", filter: "gray" },
			{ button: "apply" },
			{ button: "cancel" },
		]);
	});

	it("marks the filter the page shows", async () => {
		const { screen, root } = await editScreen();
		screen.openFilterMode("page1", ["none", "gray"], new Map(), "none", 0);
		screen.showFilter("gray");
		expect(choices(root).map(({ shown }) => shown)).toEqual(["false", "true"]);
	});

	it("closes back to the screen as it was", async () => {
		const { screen, root, viewer } = await editScreen();
		viewer.thumbnail.show();
		screen.openFilterMode("page1", ["none", "gray"], new Map(), "none", 0);
		expect(viewer.thumbnail.isVisible).toBe(false);
		screen.closeMode();
		expect(shownBars(root)).toEqual(["mds-edit-header", "mds-edit-float-bar", "mds-edit-footer"]);
		expect([viewer.thumbnail.isVisible, choices(root)]).toEqual([true, []]);
	});

	it("holds the viewer on the mode's page while the mode is open", async () => {
		const { screen, viewer } = await editScreen();
		viewer.showPages(3, 0);
		screen.openFilterMode("page2", ["none"], new Map(), "none", 0);
		expect(viewer.calls.filter((call) => call.startsWith("goToPage"))).toEqual(["goToPage 1"]);
		viewer.calls.length = 0;
		viewer.showPages(3, 2);
		expect(viewer.calls).toEqual(["goToPage 1"]);
		screen.closeMode();
		viewer.showPages(3, 0);
		expect(viewer.calls).toEqual(["goToPage 1"]);
	});

	it("moves the focus into the filter mode and back while the controls are held", async () => {
		const { screen, root, control, viewer } = await editScreen();
		viewer.showPages(1, 0);
		screen.show();
		// As in a session, where the mode opens and closes while the controls are held.
		const focusWhileHeld = (act: () => void) => {
			screen.setControlsHeld(true);
			act();
			const focused = document.activeElement;
			screen.setControlsHeld(false);
			return focused;
		};
		const opened = focusWhileHeld(() =>
			screen.openFilterMode("page1", ["none", "gray"], new Map(), "gray", 0),
		);
		expect(opened).toBe(root.querySelector('[data-mds-filter="gray"]'));
		expect(focusWhileHeld(() => screen.closeMode())).toBe(control("filter"));
	});

	it("moves the focus to cancel when the page's filter is not on offer", async () => {
		const { screen, root, viewer } = await editScreen();
		viewer.showPages(1, 0);
		screen.show();
		screen.openFilterMode("page1", ["gray"], new Map(), "none", 0);
		expect(document.activeElement).toBe(
			root.querySelector('.mds-edit-mode-header [data-mds-button="cancel"]'),
		);
	});

	it("frees the URLs of the previews when the mode closes", async () => {
		const revoked = vi.spyOn(URL, "revokeObjectURL");
		const { screen, root } = await editScreen();
		const preview = new Blob(["a preview"], { type: "image/jpeg" });
		screen.openFilterMode("page1", ["gray"], new Map([["gray", preview]]), "gray", 0);
		const url = root.querySelector(".mds-edit-filter img")!.getAttribute("src");
		screen.closeMode();
		expect(revoked).toHaveBeenCalledWith(url);
	});

	it("names the group of filters for assistive technology", async () => {
		const { root } = await editScreen();
		const strip = root.querySelector(".mds-edit-filters")!;
		expect([strip.getAttribute("role"), strip.getAttribute("aria-label")]).toEqual([
			"group",
			"Filter",
		]);
	});

	it("draws only the filter chosen as running while its action runs", async () => {
		const { root, screen, startActions, endActions } = await editScreen();
		screen.openFilterMode("page1", ["none", "gray"], new Map(), "none", 0);
		startActions();
		root.querySelector<HTMLElement>('[data-mds-filter="gray"]')!.click();
		const running = () => [...root.querySelectorAll("[data-mds-running]")];
		expect(running()).toEqual([root.querySelector('[data-mds-filter="gray"]')]);
		await endActions();
		expect(running()).toEqual([]);
	});

	it("marks the mode bar and the choices unavailable while held", async () => {
		const { screen, root } = await editScreen();
		screen.openFilterMode("page1", ["none"], new Map(), "none", 0);
		screen.setControlsHeld(true);
		const drawn = () =>
			[...root.querySelectorAll(".mds-edit-mode-header button, .mds-edit-filter")].map(
				(control) => [control.hasAttribute("disabled"), control.getAttribute("aria-disabled")],
			);
		expect(drawn()).toEqual([
			[false, "true"],
			[false, "true"],
			[false, "true"],
		]);
		screen.setControlsHeld(false);
		expect(drawn()).toEqual([
			[false, null],
			[false, null],
			[false, null],
		]);
	});
});

describe("orderBefore", () => {
	it("gives back the order before any drag of any pages to any place", () => {
		let seed = 7;
		const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
		for (let trial = 0; trial < 500; trial++) {
			const before = ["A", "B", "C", "D", "E", "F"].sort(() => random() - 0.5);
			const dragged = before.filter(() => random() < 0.4);
			if (dragged.length === 0) continue;
			// Document Viewer drops the dragged pages together, in their order, at one place.
			const rest = before.filter((uid) => !dragged.includes(uid));
			const at = Math.floor(random() * (rest.length + 1));
			const after = [...rest.slice(0, at), ...dragged, ...rest.slice(at)];
			const indicesBefore = dragged.map((uid) => before.indexOf(uid));
			expect(orderBefore(after, dragged, indicesBefore)).toEqual(before);
		}
	});
});

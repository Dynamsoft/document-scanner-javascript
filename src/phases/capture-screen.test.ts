import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
	BOUNDARY_CLASS,
	CAMERA_MENU_CLASS,
	CAMERA_MENU_ITEM_CLASS,
	ENGINE_LAYER_CLASS,
	ENGINE_VIEWFINDER_CLASS,
	HINT_CLASS,
	SCAN_REGION_CLASSES,
	SPINNER_CLASSES,
	THUMBNAIL_PART_CLASSES,
} from "./capture-contract";
import { CAPTURE_SCREEN_BUTTONS } from "../settings/buttons";
import type { CaptureScreenButton } from "../settings/buttons";
import { resolveSettings } from "../settings/settings";
import type { CaptureLayout, ScannerSettings } from "../settings/settings";
import { DEFAULT_CAPTURE_STRINGS } from "../settings/strings";
import { CaptureScreen } from "./capture-screen";
import type { Box, FrameSize } from "../boundaries/framing";
import type {
	CameraChoice,
	CapturePress,
	CaptureScreenCallbacks,
	CaptureScreenState,
} from "./capture-screen";

const PAGE = new Blob(["a page"], { type: "image/png" });

/** Callbacks for a screen whose presses and page reads a test ignores. */
const IGNORED: CaptureScreenCallbacks = {
	onPress: () => undefined,
	readPage: async () => PAGE,
};

/** A header with a camera switcher and no menu. */
const NO_MENU = `<button type="button" data-mds-button="cameraSwitcher"></button>`;

/** A template holding `markup`. */
function template(markup: string): HTMLTemplateElement {
	const holder = document.createElement("template");
	holder.innerHTML = markup.trim();
	return holder;
}

/** The settings for a capture layout. */
const layout = (areas: CaptureLayout): ScannerSettings => ({
	phases: { capture: { layout: areas } },
});

const TWO: readonly CameraChoice[] = [
	{ id: "rear", label: "Rear" },
	{ id: "front", label: "Front" },
];

const THREE: readonly CameraChoice[] = [
	{ id: "usb", label: "USB Webcam" },
	{ id: "built-in", label: "Integrated Camera" },
	{ id: "unnamed" },
];

/** Screens a test attached. `afterEach` detaches them. */
const attached: CaptureScreen[] = [];

afterEach(() => {
	for (const screen of attached.splice(0)) screen.detach();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

/**
 * Build a screen, with `header` as the content of its header when given, and attach it to
 * `document.body`. Its fake scanned document holds `pages`, and each image read
 * waits until the test calls `finish()` on it. Each press is logged in `presses`.
 * `draw()` draws the screen with the given changes on top of the last state drawn,
 * and with the pages as they are. The first state has nothing switched on.
 */
async function attachedScreen({
	header,
	settings = {},
	scanRegion = false,
	pages = [],
}: {
	readonly header?: string;
	readonly settings?: ScannerSettings;
	/** Whether the screen adds a scan region, which no setting turns on yet. */
	readonly scanRegion?: boolean;
	readonly pages?: string[];
} = {}) {
	const presses: CapturePress[] = [];
	const reads: { uid: string; finish: (page: Blob | null) => void }[] = [];
	// The ends of the actions that presses start, once presses start actions.
	let actions: (() => void)[] | null = null;
	/** Start an action for a press, when presses start actions. */
	const act = () => (actions ? new Promise<void>((end) => actions!.push(end)) : undefined);
	const callbacks: CaptureScreenCallbacks = {
		onPress: (press) => {
			presses.push(press);
			return act();
		},
		readPage: (uid) =>
			new Promise((resolve, reject) => {
				reads.push({
					uid,
					finish: (page) => (page ? resolve(page) : reject(new Error("unreadable"))),
				});
			}),
	};
	const capture = settings.phases?.capture;
	const resolved = resolveSettings(
		header === undefined
			? settings
			: {
					...settings,
					phases: {
						capture: { ...capture, layout: { ...capture?.layout, header: template(header) } },
					},
				},
	);
	const screen = new CaptureScreen({ ...resolved, scanRegion }, callbacks);
	screen.attach(document.body);
	attached.push(screen);

	let drawn: Omit<CaptureScreenState, "pageCount" | "newestPage"> = {
		cameraOpen: false,
		held: false,
		full: false,
		taking: "none",
		autoCapture: false,
		torch: "absent",
		cameras: [],
		activeCamera: undefined,
	};
	const draw = (changes: Partial<typeof drawn> = {}) => {
		drawn = { ...drawn, ...changes };
		screen.draw({ ...drawn, pageCount: pages.length, newestPage: pages.at(-1) });
	};
	/** Find a button by name. */
	const button = (name: CaptureScreenButton): HTMLButtonElement =>
		screen.element.querySelector(`[data-mds-button="${name}"]`)!;
	/** Read what is drawn on the thumbnail. */
	const thumbnail = () => ({
		count: button("thumbnail").querySelector(`.${THUMBNAIL_PART_CLASSES.count}`)?.textContent,
		disabled: button("thumbnail").disabled,
		image: button("thumbnail")
			.querySelector(`.${THUMBNAIL_PART_CLASSES.image} img`)
			?.getAttribute("src"),
	});
	const menu = screen.element.querySelector<HTMLElement>(`.${CAMERA_MENU_CLASS}`)!;
	/** The menu's entries, by label and whether each is checked. */
	const entries = () =>
		[...menu.querySelectorAll(`.${CAMERA_MENU_ITEM_CLASS}`)].map((item) => [
			item.textContent,
			item.getAttribute("aria-checked"),
		]);
	return {
		screen,
		presses,
		pages,
		reads,
		draw,
		button,
		thumbnail,
		menu,
		entries,
		/** Make each press start an action, which runs until the test ends. */
		startActions: () => void (actions = []),
	};
}

/** Send an element the pointerdown event that a tap starts with. */
function tap(element: Element): void {
	element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
}

/** Press a key on an element. */
function pressKey(element: Element, key: string): void {
	element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

/** Wait for the next frame, by which the browser moves the focus off a disabled control. */
function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Wait for the next task, so that images already read are drawn. */
function nextTask(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve));
}

describe("building the screen", () => {
	it("labels each button with the text from `strings` and fills in the icons", async () => {
		const { screen, button } = await attachedScreen({
			settings: { strings: { capture: { cancel: "Stop", shutterTooltip: "Take it" } } },
		});
		const strings = { ...DEFAULT_CAPTURE_STRINGS, cancel: "Stop", shutterTooltip: "Take it" };
		for (const name of CAPTURE_SCREEN_BUTTONS) {
			await expect.element(button(name)).toHaveAccessibleName(strings[name]);
			expect(button(name).title).toBe(strings[`${name}Tooltip`]);
		}
		for (const holder of screen.element.querySelectorAll("[data-mds-icon]")) {
			expect(holder.querySelector("svg")).not.toBeNull();
		}
	});

	it.each([
		[`<button data-mds-button="shuter"></button>`, 'has an unknown data-mds-button "shuter"'],
		[
			`<button data-mds-button="constructor"></button>`,
			'has an unknown data-mds-button "constructor"',
		],
		[
			`<div class="mds-camera-menu"></div><div class="mds-camera-menu"></div>`,
			"has more than one .mds-camera-menu",
		],
		...["aria-label", "aria-labelledby", "title"].map((attribute) => [
			`<button data-mds-button="shutter" ${attribute}="Snap"></button>`,
			`gives data-mds-button "shutter" its own ${attribute}`,
		]),
		[`<div data-mds-area="viewfinder"></div>`, "has more than one viewfinder area"],
		[`<div class="${ENGINE_VIEWFINDER_CLASS}"></div>`, "has more than one viewfinder area"],
	])("refuses the header %s", (header, error) => {
		const settings = resolveSettings(layout({ header: template(header) }));
		expect(() => new CaptureScreen(settings, IGNORED)).toThrow(`phases.capture.layout ${error}`);
	});

	it("applies the theme and adopts the styles into a shadow root", async () => {
		const { screen } = await attachedScreen({ settings: { theme: { primary: "#123456" } } });
		expect(screen.element.style.getPropertyValue("--mds-primary")).toBe("#123456");
		const host = document.createElement("div");
		const shadowRoot = host.attachShadow({ mode: "open" });
		const inside = document.createElement("div");
		shadowRoot.append(inside);
		document.body.append(host);
		try {
			screen.attach(inside);
			expect(shadowRoot.adoptedStyleSheets.length).toBeGreaterThan(0);
		} finally {
			host.remove();
		}
	});
});

describe("filling areas", () => {
	it("keeps the area and fills it with a copy of the whole template", async () => {
		const footer = template(`<style>.logo { width: 2em; }</style><img class="logo" /><p>Acme</p>`);
		const { screen, button } = await attachedScreen({ settings: layout({ footer }) });
		const area = screen.element.querySelector('[data-mds-area="footer"]')!;
		expect([...area.children].map((child) => child.tagName)).toEqual(["STYLE", "IMG", "P"]);
		expect(area.classList.contains("mds-capture-footer")).toBe(true);
		expect(button("shutter")).toBeNull();
		expect(footer.content.childElementCount).toBe(3);
	});

	it("empties an area for an empty template", async () => {
		const { screen } = await attachedScreen({ settings: layout({ footer: template("") }) });
		expect(screen.element.querySelector('[data-mds-area="footer"]')?.childElementCount).toBe(0);
	});

	it("gives the new content its icons, labels, and wiring", async () => {
		const header = template(`
			<button data-mds-button="cancel"><span data-mds-icon="cancel"></span></button>
			<span class="mds-icon" data-mds-icon="logo"><svg id="logo"></svg></span>
		`);
		const { screen, presses, button } = await attachedScreen({ settings: layout({ header }) });
		expect(button("cancel").getAttribute("aria-label")).toBe("Cancel");
		expect(button("cancel").querySelector("svg")).not.toBeNull();
		// An icon holder that brings its own icon keeps it.
		expect(screen.element.querySelector('[data-mds-icon="logo"] svg')?.id).toBe("logo");
		button("cancel").click();
		expect(presses).toEqual([{ button: "cancel" }]);
		expect(button("torch")).toBeNull();
	});

	it("gives every viewfinder the camera engine's class and an outline", async () => {
		const builtIn = (await attachedScreen()).screen.element;
		const viewfinder = template(`<div class="my-overlay"></div>`);
		const filled = (await attachedScreen({ settings: layout({ viewfinder }) })).screen.element;
		for (const element of [builtIn, filled]) {
			const area = element.querySelector('[data-mds-area="viewfinder"]');
			expect(area?.classList.contains(ENGINE_VIEWFINDER_CLASS)).toBe(true);
			expect(area?.querySelector(`.${BOUNDARY_CLASS}`)).not.toBeNull();
		}
		expect(filled.querySelector('[data-mds-area="viewfinder"] > .my-overlay')).not.toBeNull();
	});

	describe("with a scan region", () => {
		/** A screen of only its viewfinder, `width` by `height` pixels, with a scan region. */
		async function regionScreen(width: number, height: number) {
			const { screen } = await attachedScreen({
				settings: { phases: { capture: { layout: { header: false, footer: false } } } },
				scanRegion: true,
			});
			Object.assign(screen.element.style, { width: `${width}px`, height: `${height}px` });
			return screen;
		}

		/** The region of `screen` in a frame of `size`, once it is laid out. */
		async function laidOut(screen: CaptureScreen, size: FrameSize): Promise<Box> {
			let region: Box | null = null;
			await vi.waitFor(() => {
				region = screen.measureScanRegion(size);
				expect(region!.right).toBeGreaterThan(0);
			});
			return region!;
		}

		/** Expect `region` to be `expected`, each side to the nearest pixel. */
		function expectNear(region: Box, expected: Box): void {
			for (const side of ["left", "top", "right", "bottom"] as const) {
				expect(region[side], side).toBeCloseTo(expected[side], 0);
			}
		}

		it("has no scan region unless it is asked for, as the document scanner does not yet", async () => {
			const { screen } = await attachedScreen();
			expect(screen.element.querySelector(`.${SCAN_REGION_CLASSES.region}`)).toBeNull();
			expect(screen.measureScanRegion({ width: 1600, height: 900 })).toBeNull();
		});

		it("measures a centered A4 region on a landscape picture, in the frame's pixels", async () => {
			// The 1600 by 900 frame shows at 800 by 450. The region is 90% of that
			// height, 405, and 286.4 wide.
			const screen = await regionScreen(800, 600);
			const region = await laidOut(screen, { width: 1600, height: 900 });
			expectNear(region, { left: 513.6, top: 45, right: 1086.4, bottom: 855 });
		});

		it("measures it again when the frame turns to portrait", async () => {
			const screen = await regionScreen(800, 600);
			await laidOut(screen, { width: 1600, height: 900 });
			// The 900 by 1600 frame shows at 337.5 by 600. The region is 90% of that
			// width, 303.75, and 429.6 high.
			const portrait = { width: 900, height: 1600 };
			await vi.waitFor(() =>
				expectNear(screen.measureScanRegion(portrait)!, {
					left: 45,
					top: 227.2,
					right: 855,
					bottom: 1372.8,
				}),
			);
		});

		it("fits its box to the camera's picture again when the viewfinder changes size", async () => {
			const screen = await regionScreen(800, 600);
			await laidOut(screen, { width: 1600, height: 900 });
			screen.element.style.width = "400px";
			const picture = screen.element.querySelector(`.${SCAN_REGION_CLASSES.picture}`)!;
			// The frame shows at 400 by 225, centered in 400 by 600.
			const shown = picture.getBoundingClientRect();
			const viewfinder = picture.parentElement!.getBoundingClientRect();
			expect([shown.width, shown.height, shown.top - viewfinder.top]).toEqual([400, 225, 187.5]);
		});

		it("measures it again when the stylesheet changes the region alone", async () => {
			const screen = await regionScreen(800, 600);
			const size = { width: 1600, height: 900 };
			await laidOut(screen, size);
			const region = screen.element.querySelector<HTMLElement>(`.${SCAN_REGION_CLASSES.region}`)!;
			// A square of half the picture's height, 225 of 450, centered.
			Object.assign(region.style, { width: "225px", height: "225px" });
			await vi.waitFor(() =>
				expectNear(screen.measureScanRegion(size)!, {
					left: 575,
					top: 225,
					right: 1025,
					bottom: 675,
				}),
			);
		});

		it("finds no room for a page while the viewfinder has no size", async () => {
			const screen = await regionScreen(800, 600);
			const size = { width: 1600, height: 900 };
			await laidOut(screen, size);
			screen.element.style.display = "none";
			await vi.waitFor(() => {
				const region = screen.measureScanRegion(size)!;
				expect([region.right - region.left, region.bottom - region.top]).toEqual([0, 0]);
			});
		});

		it("keeps a region that the stylesheet makes larger than the picture inside the frame", async () => {
			const screen = await regionScreen(800, 600);
			const region = screen.element.querySelector<HTMLElement>(`.${SCAN_REGION_CLASSES.region}`)!;
			Object.assign(region.style, { width: "1000px", height: "1000px" });
			const size = { width: 1600, height: 900 };
			expect(await laidOut(screen, size)).toEqual({ left: 0, top: 0, right: 1600, bottom: 900 });
		});
	});

	describe("the hint", () => {
		it("shows each hint's text in a live region, and nothing without a hint", async () => {
			const { screen } = await attachedScreen();
			const hint = screen.element.querySelector(`[data-mds-area="viewfinder"] > .${HINT_CLASS}`)!;
			expect(hint.getAttribute("role")).toBe("status");
			expect(hint.textContent).toBe("");
			screen.drawHint("moveCloser");
			expect(hint.textContent).toBe(DEFAULT_CAPTURE_STRINGS.moveCloser);
			screen.drawHint("moveFarther");
			expect(hint.textContent).toBe(DEFAULT_CAPTURE_STRINGS.moveFarther);
			screen.clearHint();
			expect(hint.textContent).toBe("");
		});

		it("takes its text from the strings", async () => {
			const { screen } = await attachedScreen({
				settings: { strings: { capture: { moveCloser: "Näher heran" } } },
			});
			screen.drawHint("moveCloser");
			expect(screen.element.querySelector(`.${HINT_CLASS}`)?.textContent).toBe("Näher heran");
		});

		it("draws a background only while it shows a hint", async () => {
			const { screen } = await attachedScreen();
			const hint = screen.element.querySelector<HTMLElement>(`.${HINT_CLASS}`)!;
			const background = () => getComputedStyle(hint).backgroundColor;
			expect(background()).toBe("rgba(0, 0, 0, 0)");
			screen.drawHint("moveCloser");
			expect(background()).not.toBe("rgba(0, 0, 0, 0)");
		});

		it("lets a long hint use the viewfinder's width before it wraps", async () => {
			// About 640 pixels of text, more than half of the 800-pixel viewfinder.
			const long = "Gehen Sie näher an das Dokument heran, bis es den Rahmen füllt";
			const { screen } = await attachedScreen({
				settings: { strings: { capture: { moveCloser: long } } },
			});
			screen.element.style.width = "800px";
			screen.drawHint("moveCloser");
			const hint = screen.element.querySelector<HTMLElement>(`.${HINT_CLASS}`)!;
			const { width, height } = hint.getBoundingClientRect();
			expect(width).toBeGreaterThan(400);
			// One line of 24 pixels, and 8 pixels of padding above and below.
			expect(height).toBe(40);
		});
	});

	it("marks the viewfinder's child that holds the camera engine's video", async () => {
		const viewfinder = template(`<div class="mine"></div>`);
		const { screen } = await attachedScreen({ settings: layout({ viewfinder }) });
		const area = screen.element.querySelector('[data-mds-area="viewfinder"]')!;
		const layer = area.appendChild(document.createElement("div"));
		const video = layer
			.appendChild(document.createElement("div"))
			.appendChild(document.createElement("video"));
		// A host application's element after the engine's layer does not mislead it.
		area.append(document.createElement("div"));
		screen.markEngineLayer(video);
		// A video outside the viewfinder marks nothing.
		screen.markEngineLayer(document.createElement("video"));
		expect([...area.querySelectorAll(`.${ENGINE_LAYER_CLASS}`)]).toEqual([layer]);
	});

	it("keeps the built-in area for null", async () => {
		const { button } = await attachedScreen({
			settings: layout({ header: null } as unknown as CaptureLayout),
		});
		expect(button("cancel")).not.toBeNull();
	});

	it("leaves out the header and footer along with their buttons", async () => {
		const { screen, button } = await attachedScreen({
			settings: layout({ header: false, footer: false }),
		});
		const areas = [...screen.element.querySelectorAll("[data-mds-area]")];
		expect(areas.map((area) => area.getAttribute("data-mds-area"))).toEqual(["viewfinder"]);
		expect([button("cancel"), button("shutter"), button("thumbnail")]).toEqual([null, null, null]);
	});

	it("draws every copy of a control and reports a press on any of them", async () => {
		const header = template(`
			<div data-mds-button="shutter"><span class="mine"></span></div>
		`);
		const { screen, presses, draw } = await attachedScreen({ settings: layout({ header }) });
		const shutters = [
			...screen.element.querySelectorAll<HTMLElement>('[data-mds-button="shutter"]'),
		];
		draw({ cameraOpen: false });
		expect(shutters.map((shutter) => shutter.hasAttribute("disabled"))).toEqual([true, true]);
		expect(shutters.map((shutter) => shutter.getAttribute("aria-label"))).toEqual([
			DEFAULT_CAPTURE_STRINGS.shutter,
			DEFAULT_CAPTURE_STRINGS.shutter,
		]);
		// The first copy is a div. A disabled div still gets clicks.
		shutters[0]!.click();
		expect(presses).toEqual([]);
		draw({ cameraOpen: true });
		screen.element.querySelector<HTMLElement>(".mine")!.click();
		shutters[1]!.click();
		expect(presses).toEqual([{ button: "shutter" }, { button: "shutter" }]);
	});

	it("draws the newest page on every copy of the thumbnail", async () => {
		const revoked = vi.spyOn(URL, "revokeObjectURL");
		const header = template(`
			<button data-mds-button="thumbnail">
				<span class="mds-capture-thumbnail-image"></span>
				<span class="mds-capture-count"></span>
			</button>
		`);
		const { screen, pages, draw, reads } = await attachedScreen({
			settings: layout({ header }),
			pages: ["page1"],
		});
		const all = (selector: string) => [...screen.element.querySelectorAll<HTMLElement>(selector)];
		draw({ taking: "page" });
		expect(all(".mds-spinner-thumbnail").map((spinner) => spinner.hidden)).toEqual([false, false]);
		reads[0]?.finish(PAGE);
		await nextTask();
		expect(all(".mds-capture-count").map((count) => count.textContent)).toEqual(["1", "1"]);
		const [first, second] = all(".mds-capture-thumbnail-image img").map((image) =>
			image.getAttribute("src"),
		);
		expect(first).toMatch(/^blob:/);
		expect(second).toBe(first);
		pages.length = 0;
		draw({ taking: "none" });
		expect(all(".mds-capture-thumbnail-image img")).toEqual([]);
		expect(revoked).toHaveBeenCalledExactlyOnceWith(first);
	});
});

describe("drawing the controls and reporting presses", () => {
	it("draws the torch and auto-capture buttons from the state", async () => {
		const { draw, button } = await attachedScreen();
		const torch = button("torch");
		draw({ torch: "absent" });
		expect(torch.hidden).toBe(true);
		draw({ torch: "refused" });
		expect([torch.hidden, torch.disabled]).toEqual([false, true]);
		draw({ torch: "on", autoCapture: true });
		expect([torch.disabled, torch.getAttribute("aria-pressed")]).toEqual([false, "true"]);
		expect(button("autoCapture").getAttribute("aria-pressed")).toBe("true");
		draw({ torch: "off", autoCapture: false });
		expect(torch.getAttribute("aria-pressed")).toBe("false");
		expect(button("autoCapture").getAttribute("aria-pressed")).toBe("false");
	});

	it("shows the auto-capture icon of the state the toggle is in", async () => {
		const { draw, button } = await attachedScreen();
		const iconsShown = () =>
			[...button("autoCapture").querySelectorAll<HTMLElement>("[data-mds-icon]")]
				.filter((icon) => getComputedStyle(icon).display !== "none")
				.map((icon) => icon.dataset.mdsIcon);
		draw({ autoCapture: false });
		expect(iconsShown()).toEqual(["auto-capture-off"]);
		draw({ autoCapture: true });
		expect(iconsShown()).toEqual(["auto-capture-on"]);
	});

	it("sends a tap on the auto-capture icon to the toggle in both states", async () => {
		const { draw, button } = await attachedScreen();
		const toggle = button("autoCapture");
		/** The element under the center of the icon that shows. */
		const hit = (name: string) => {
			const box = toggle.querySelector(`[data-mds-icon="${name}"]`)!.getBoundingClientRect();
			return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
		};
		draw({ autoCapture: false });
		expect(hit("auto-capture-off")).toBe(toggle);
		draw({ autoCapture: true });
		expect(hit("auto-capture-on")).toBe(toggle);
	});

	it("holds every control but cancel while a page is taken", async () => {
		const { screen, draw, button } = await attachedScreen({ pages: ["page1"] });
		const held = CAPTURE_SCREEN_BUTTONS.filter((name) => name !== "cancel").sort();
		const drawn = () => ({
			off: CAPTURE_SCREEN_BUTTONS.filter((name) => button(name).disabled).sort(),
			held: CAPTURE_SCREEN_BUTTONS.filter(
				(name) => button(name).getAttribute("aria-disabled") === "true",
			).sort(),
			running: CAPTURE_SCREEN_BUTTONS.filter((name) =>
				button(name).hasAttribute("data-mds-running"),
			),
			viewfinderSpinner: !screen.element.querySelector<HTMLElement>(
				`.${SPINNER_CLASSES.viewfinder}`,
			)!.hidden,
			thumbnailSpinner: !screen.element.querySelector<HTMLElement>(`.${SPINNER_CLASSES.thumbnail}`)!
				.hidden,
		});
		const idle = {
			off: [],
			held: [],
			running: [],
			viewfinderSpinner: false,
			thumbnailSpinner: false,
		};
		draw({ cameraOpen: true, torch: "off", cameras: TWO });
		expect(drawn()).toEqual(idle);
		button("shutter").focus();
		draw({ held: true, taking: "photograph" });
		await nextFrame();
		expect(document.activeElement).toBe(button("shutter"));
		expect(drawn()).toEqual({
			off: [],
			held,
			// As auto-capture takes a page, with no press.
			running: ["shutter"],
			viewfinderSpinner: true,
			thumbnailSpinner: true,
		});
		draw({ taking: "page" });
		expect(drawn()).toEqual({
			off: [],
			held,
			running: ["shutter"],
			viewfinderSpinner: false,
			thumbnailSpinner: true,
		});
		draw({ held: false, taking: "none" });
		expect(drawn()).toEqual(idle);
		expect(
			screen.element.querySelector(`.${SPINNER_CLASSES.thumbnail}`)?.getAttribute("aria-hidden"),
		).toBe("true");
	});

	it("draws the switcher as running while a camera chosen from its menu switches", async () => {
		const { draw, button, menu, startActions } = await attachedScreen();
		draw({ cameraOpen: true, cameras: THREE, activeCamera: THREE[0]!.id });
		const running = () => button("cameraSwitcher").hasAttribute("data-mds-running");
		startActions();
		// Opening the menu starts no action.
		button("cameraSwitcher").click();
		expect(running()).toBe(false);
		menu.querySelectorAll<HTMLElement>(`.${CAMERA_MENU_ITEM_CLASS}`)[1]!.click();
		expect(running()).toBe(true);
	});

	it("keeps the buttons the host application hides hidden while the screen would show them", async () => {
		const { draw, button } = await attachedScreen({
			pages: ["page1"],
			settings: {
				phases: {
					capture: {
						buttons: {
							torch: { hidden: true },
							cameraSwitcher: { hidden: true },
							cancel: { hidden: true },
						},
					},
				},
			},
		});
		draw({ cameraOpen: true, torch: "off", cameras: TWO });
		const hidden = CAPTURE_SCREEN_BUTTONS.filter((name) => button(name).hidden).sort();
		expect(hidden).toEqual(["cameraSwitcher", "cancel", "torch"]);
	});

	it("turns the shutter and load image off while the document is full", async () => {
		const { draw, button } = await attachedScreen({ pages: ["page1"] });
		const off = () => CAPTURE_SCREEN_BUTTONS.filter((name) => button(name).disabled).sort();
		draw({ cameraOpen: true, torch: "off", cameras: TWO, full: true });
		expect(off()).toEqual(["loadImage", "shutter"]);
		draw({ full: false });
		expect(off()).toEqual([]);
	});

	it("draws without failing when the layout leaves out controls or their parts", async () => {
		const { button, draw, reads } = await attachedScreen({
			header: `<button data-mds-button="thumbnail"></button>`,
			settings: layout({ footer: false }),
			pages: ["p1"],
		});
		draw({ torch: "on", cameras: THREE });
		reads[0]?.finish(PAGE);
		await nextTask();
		expect(button("thumbnail").querySelector("img")).toBeNull();
	});

	it("reports each press by the button's name", async () => {
		const { presses, draw, button } = await attachedScreen({ pages: ["page1"] });
		draw({ cameraOpen: true, torch: "off" });
		const names = ["cancel", "autoCapture", "torch", "shutter", "loadImage", "thumbnail"] as const;
		for (const name of names) button(name).click();
		expect(presses.map((reported) => reported.button)).toEqual(names);
	});
});

describe("the image picker", () => {
	it("resolves with each image chosen in the picker", async () => {
		const { screen } = await attachedScreen();
		const clicked = vi
			.spyOn(HTMLInputElement.prototype, "click")
			.mockImplementation(() => undefined);
		const first = screen.pickImage();
		const picker = screen.element.querySelector<HTMLInputElement>('input[type="file"]')!;
		expect([picker.accept, picker.multiple, picker.hidden, clicked.mock.calls.length]).toEqual([
			"image/*",
			false,
			true,
			1,
		]);
		const file = new File(["a page"], "page.png", { type: "image/png" });
		const choose = () => {
			const chosen = new DataTransfer();
			chosen.items.add(file);
			picker.files = chosen.files;
			picker.dispatchEvent(new Event("change"));
		};
		choose();
		expect(await first).toBe(file);
		const second = screen.pickImage();
		expect(screen.element.querySelectorAll('input[type="file"]')).toHaveLength(1);
		choose();
		expect(await second).toBe(file);
	});

	it("resolves with no file when the picker closes without one", async () => {
		const { screen } = await attachedScreen();
		vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
		const cancelled = screen.pickImage();
		const picker = screen.element.querySelector<HTMLInputElement>('input[type="file"]')!;
		picker.dispatchEvent(new Event("cancel"));
		expect(await cancelled).toBeNull();
		const empty = screen.pickImage();
		picker.files = new DataTransfer().files;
		picker.dispatchEvent(new Event("change"));
		expect(await empty).toBeNull();
	});
});

describe("the camera switcher", () => {
	it("is hidden when there is only one camera", async () => {
		const { presses, draw, button } = await attachedScreen();
		draw({ cameras: TWO.slice(0, 1), activeCamera: "rear" });
		expect(button("cameraSwitcher").hidden).toBe(true);
		button("cameraSwitcher").click();
		expect(presses).toEqual([]);
	});

	it("switches straight to the other camera when there are two", async () => {
		const { screen, presses, draw, button, menu } = await attachedScreen();
		draw({ cameras: TWO, activeCamera: "front" });
		const switcher = button("cameraSwitcher");
		expect([switcher.hidden, switcher.hasAttribute("aria-haspopup")]).toEqual([false, false]);
		switcher.click();
		pressKey(screen.element, "Escape");
		tap(button("shutter"));
		expect(presses).toEqual([{ button: "cameraSwitcher", camera: "rear" }]);
		expect([menu.hidden, switcher.hasAttribute("aria-expanded")]).toEqual([true, false]);
	});

	it("opens a menu to choose from when there are three or more cameras", async () => {
		const { presses, draw, button, menu, entries } = await attachedScreen();
		draw({ cameras: THREE, activeCamera: "built-in" });
		const switcher = button("cameraSwitcher");
		expect(switcher.getAttribute("aria-haspopup")).toBe("menu");
		switcher.click();
		expect([menu.hidden, switcher.getAttribute("aria-expanded")]).toEqual([false, "true"]);
		expect(entries()).toEqual([
			["USB Webcam", "false"],
			["Integrated Camera", "true"],
			["Camera 3", "false"],
		]);
		menu.querySelector("button")?.click();
		expect(presses).toEqual([{ button: "cameraSwitcher", camera: "usb" }]);
		expect([menu.hidden, switcher.getAttribute("aria-expanded")]).toEqual([true, "false"]);
	});

	it("closes the menu on Escape, a tap outside it, or a second press", async () => {
		const { screen, draw, button, menu } = await attachedScreen();
		draw({ cameras: THREE });
		const switcher = button("cameraSwitcher");
		switcher.click();
		switcher.click();
		expect(menu.hidden).toBe(true);
		switcher.click();
		tap(menu);
		tap(switcher);
		pressKey(screen.element, "Enter");
		expect(menu.hidden).toBe(false);
		pressKey(screen.element, "Escape");
		expect(menu.hidden).toBe(true);
		switcher.click();
		tap(button("shutter"));
		expect(menu.hidden).toBe(true);
	});

	it("rebuilds the menu only when the cameras change", async () => {
		const { draw, button, menu, entries } = await attachedScreen();
		draw({ cameras: THREE });
		button("cameraSwitcher").click();
		draw({ cameras: THREE.map((camera) => ({ ...camera })) });
		expect(menu.hidden).toBe(false);
		draw({ cameras: [...THREE.slice(0, 2), { id: "unnamed", label: "Document Camera" }] });
		expect(menu.hidden).toBe(true);
		draw({ cameras: TWO, activeCamera: "rear" });
		expect(button("cameraSwitcher").hasAttribute("aria-haspopup")).toBe(false);
		expect(entries()).toEqual([]);
	});

	it("lets either copy of the switcher open and close the one menu", async () => {
		const { screen, draw, menu } = await attachedScreen({
			header: `
				<button data-mds-button="cameraSwitcher"></button>
				<button data-mds-button="cameraSwitcher"></button>
				<div class="mds-camera-menu" hidden></div>
			`,
			settings: layout({ footer: false }),
		});
		draw({ cameras: THREE });
		const [first, second] = screen.element.querySelectorAll<HTMLElement>("button");
		const expanded = () =>
			[first, second].map((switcher) => switcher!.getAttribute("aria-expanded"));
		first!.click();
		tap(second!);
		expect([menu.hidden, expanded()]).toEqual([false, ["true", "true"]]);
		second!.click();
		expect([menu.hidden, expanded()]).toEqual([true, ["false", "false"]]);
	});

	it("closes the menu while the controls are held", async () => {
		const { draw, button, menu } = await attachedScreen();
		draw({ cameras: THREE });
		button("cameraSwitcher").click();
		draw({ held: true });
		expect([menu.hidden, button("cameraSwitcher").getAttribute("aria-expanded")]).toEqual([
			true,
			"false",
		]);
	});

	it("opens no menu while the controls are held", async () => {
		const { draw, button, menu } = await attachedScreen();
		draw({ cameras: THREE, held: true });
		button("cameraSwitcher").click();
		expect(menu.hidden).toBe(true);
	});

	it("steps to the next camera when the layout has no menu", async () => {
		const { presses, draw, button } = await attachedScreen({ header: NO_MENU });
		draw({ cameras: THREE, activeCamera: "unnamed" });
		button("cameraSwitcher").click();
		expect(presses).toEqual([{ button: "cameraSwitcher", camera: "usb" }]);
	});
});

describe("the thumbnail", () => {
	it("draws the page count and the newest page", async () => {
		const { draw, reads, thumbnail } = await attachedScreen({ pages: ["page1", "page2"] });
		draw();
		draw({ autoCapture: true });
		expect(thumbnail()).toEqual({ count: "2", disabled: false, image: undefined });
		expect(reads.map((read) => read.uid)).toEqual(["page2"]);
		reads[0]?.finish(PAGE);
		await nextTask();
		expect(thumbnail().image).toMatch(/^blob:/);
	});

	it("adds the page count to its name while there are pages", async () => {
		const { draw, button, pages } = await attachedScreen({
			pages: ["page1", "page2"],
			settings: { strings: { capture: { thumbnail: "Scans" } } },
		});
		draw();
		await expect.element(button("thumbnail")).toHaveAccessibleName("Scans 2");
		// As a cancelled session leaves it.
		pages.splice(0);
		draw();
		await expect.element(button("thumbnail")).toHaveAccessibleName("Scans");
	});

	it("is disabled when there are no pages", async () => {
		const { draw, reads, thumbnail } = await attachedScreen();
		draw();
		expect(thumbnail()).toEqual({ count: "", disabled: true, image: undefined });
		expect(reads).toEqual([]);
	});

	it("reads the newest page again after the screen is attached again", async () => {
		const { screen, draw, reads } = await attachedScreen({ pages: ["page1"] });
		draw();
		screen.detach();
		screen.attach(document.body);
		draw();
		expect(reads.map((read) => read.uid)).toEqual(["page1", "page1"]);
	});

	it("keeps the old image when the new one cannot be read", async () => {
		const { pages, draw, reads, thumbnail } = await attachedScreen({ pages: ["page1"] });
		draw();
		reads[0]?.finish(PAGE);
		await nextTask();
		const before = thumbnail().image;
		pages.push("page2");
		draw();
		reads[1]?.finish(null);
		await nextTask();
		expect(thumbnail()).toEqual({ count: "2", disabled: false, image: before });
	});

	it("ignores an image that arrives after the screen is detached or a newer page is added", async () => {
		const detached = await attachedScreen({ pages: ["page1"] });
		detached.draw();
		detached.screen.detach();
		expect(detached.screen.element.isConnected).toBe(false);
		detached.reads[0]?.finish(PAGE);
		const overtaken = await attachedScreen({ pages: ["page1"] });
		overtaken.draw();
		overtaken.pages.push("page2");
		overtaken.draw();
		overtaken.reads[0]?.finish(PAGE);
		await nextTask();
		expect(detached.thumbnail().image).toBeUndefined();
		expect(overtaken.thumbnail().image).toBeUndefined();
	});

	it("frees each image's URL when the image is replaced or removed", async () => {
		const revoked = vi.spyOn(URL, "revokeObjectURL");
		const { pages, draw, reads, thumbnail } = await attachedScreen({ pages: ["page1"] });
		draw();
		reads[0]?.finish(PAGE);
		await nextTask();
		const first = thumbnail().image;
		pages.push("page2");
		draw();
		reads[1]?.finish(PAGE);
		await vi.waitFor(() => expect(revoked).toHaveBeenCalledWith(first));
		const second = thumbnail().image;
		pages.length = 0;
		draw();
		expect(revoked).toHaveBeenCalledWith(second);
		expect(thumbnail().image).toBeUndefined();
	});
});

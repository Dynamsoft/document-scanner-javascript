import { afterEach, describe, expect, it } from "vite-plus/test";
import { DEFAULT_RECTIFY_STRINGS, DEFAULT_STRINGS } from "../settings/strings";
import { DEFAULT_THEME } from "../settings/theme";
import type { DocumentViewerEngine } from "../engines/document-viewer";
import { RECTIFY_SCREEN_BUTTONS } from "../settings/buttons";
import { RectifyScreen } from "./rectify-screen";
import type { RectifyPress, RectifyScreenOptions } from "./rectify-screen";
import type { RectifyLayout } from "../settings/settings";
import type { ViewerEngines } from "../ui/viewer-mount";

/** A stand-in for Document Viewer's perspective viewer, which logs its calls. */
class FakeViewer {
	readonly calls: string[] = [];
	readonly styles = new Map<string, unknown>();
	constructor(
		readonly options: {
			readonly container: HTMLElement;
			readonly uiConfig: unknown;
			readonly viewerConfig: unknown;
		},
	) {}
	updateStyle(name: string, style: unknown): boolean {
		this.styles.set(name, style);
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
		PerspectiveViewer: FakeViewer,
		Elements: { MainView: "MainView" },
	} as unknown as DocumentViewerEngine,
	stylesheet: `data:text/css,${encodeURIComponent(".ddv-test {}")}`,
};

const containers: HTMLElement[] = [];

afterEach(() => {
	for (const container of containers.splice(0)) container.remove();
});

/** Build a rectify screen whose presses are logged in `presses`. */
async function rectifyScreen(
	strings = DEFAULT_RECTIFY_STRINGS,
	buttons: RectifyScreenOptions["buttons"] = { afterCapture: undefined, fromEdit: undefined },
	layout?: RectifyLayout,
) {
	const container = document.body.appendChild(document.createElement("div"));
	containers.push(container);
	const presses: RectifyPress[] = [];
	const options = {
		strings: { ...DEFAULT_STRINGS, rectify: strings },
		theme: DEFAULT_THEME,
		documentUid: "doc1",
		buttons,
		layout,
	};
	const screen: RectifyScreen = await RectifyScreen.build(
		ENGINES,
		container,
		options,
		(press) => void presses.push(press),
	);
	const root = container.querySelector<HTMLElement>(".mds-rectify")!;
	/** Find one of the screen's controls by name. */
	const control = (name: RectifyPress["button"]) =>
		root.querySelector<HTMLElement>(`[data-mds-button="${name}"]`)!;
	const title = root.querySelector<HTMLElement>(".mds-rectify-title")!;
	return {
		screen,
		container,
		root,
		presses,
		control,
		title,
		viewer: screen.viewer as unknown as FakeViewer,
	};
}

describe("RectifyScreen.build()", () => {
	it("builds the screen hidden, with the viewer drawing only the image in its area", async () => {
		const { root, viewer } = await rectifyScreen();
		expect(root.hidden).toBe(true);
		expect(viewer.options.container).toBe(root.querySelector(".mds-rectify-viewer"));
		expect(viewer.options.uiConfig).toEqual({ type: "MainView" });
		expect(viewer.options.viewerConfig).toMatchObject({ enableLoadSourceByDrag: false });
		expect(viewer.calls).toEqual(["openDocument doc1"]);
	});

	it("leaves nothing in the container when the viewer cannot be built", async () => {
		const container = document.body.appendChild(document.createElement("div"));
		containers.push(container);
		const engines = { ...ENGINES, stylesheet: "/no-such-sheet.css" };
		const options = {
			strings: DEFAULT_STRINGS,
			theme: DEFAULT_THEME,
			documentUid: "doc1",
			buttons: { afterCapture: undefined, fromEdit: undefined },
			layout: undefined,
		};
		await expect(
			RectifyScreen.build(engines, container, options, () => undefined),
		).rejects.toThrow();
		expect(container.children).toHaveLength(0);
	});
});

describe("the rectify screen's layout", () => {
	/** A template holding `markup`. */
	function template(markup: string): HTMLTemplateElement {
		const holder = document.createElement("template");
		holder.innerHTML = markup.trim();
		return holder;
	}

	it("fills its header from the layout, and labels every copy of a button", async () => {
		const header = template(`
			<button data-mds-button="apply"><span class="mds-rectify-label"></span></button>
			<button data-mds-button="apply"><span class="mds-icon" data-mds-icon="full-image"></span></button>
		`);
		const { screen, root, presses } = await rectifyScreen(DEFAULT_RECTIFY_STRINGS, undefined, {
			header,
		});
		screen.draw("afterCapture");
		const [text, icon] = root.querySelectorAll<HTMLElement>('[data-mds-button="apply"]');
		expect([text!.textContent?.trim(), icon!.getAttribute("aria-label")]).toEqual(["Keep", "Keep"]);
		icon!.click();
		expect(presses).toEqual([{ button: "apply" }]);
	});

	it("refuses a layout with a button that the screen does not have", async () => {
		const header = template(`<button data-mds-button="shutter"></button>`);
		await expect(rectifyScreen(DEFAULT_RECTIFY_STRINGS, undefined, { header })).rejects.toThrow(
			'phases.rectify.layout has an unknown data-mds-button "shutter"',
		);
	});
});

describe("the rectify screen", () => {
	it("reports a press on each button by the button's name", async () => {
		const { screen, presses, control } = await rectifyScreen();
		screen.setUndoable(true);
		for (const button of RECTIFY_SCREEN_BUTTONS) control(button).click();
		expect(presses.map((press) => press.button)).toEqual(RECTIFY_SCREEN_BUTTONS);
	});

	it("offers retake and keep after a capture, with no title", async () => {
		const { screen, control, title } = await rectifyScreen();
		screen.draw("afterCapture");
		expect(control("retake").hidden).toBe(false);
		expect(control("cancel").hidden).toBe(true);
		expect(control("apply").textContent?.trim()).toBe("Keep");
		expect(title.hidden).toBe(true);
	});

	it("offers cancel and apply under a title from the edit screen", async () => {
		const { screen, control, title } = await rectifyScreen();
		screen.draw("afterCapture");
		screen.draw("fromEdit");
		expect(control("retake").hidden).toBe(true);
		expect(control("cancel").hidden).toBe(false);
		expect(control("apply").textContent?.trim()).toBe("Apply");
		expect([title.hidden, title.textContent]).toEqual([false, "Adjust"]);
	});

	it("hides buttons as the settings of the mode that shows say", async () => {
		const { screen, control } = await rectifyScreen(DEFAULT_RECTIFY_STRINGS, {
			afterCapture: { apply: { hidden: true } },
			fromEdit: undefined,
		});
		const hidden = () => RECTIFY_SCREEN_BUTTONS.filter((button) => control(button).hidden);
		screen.draw("afterCapture");
		expect(hidden()).toEqual(["apply", "cancel"]);
		screen.setControlsHeld(false);
		expect(hidden()).toEqual(["apply", "cancel"]);
		// The other mode has no settings, so apply shows again.
		screen.draw("fromEdit");
		expect(hidden()).toEqual(["retake"]);
	});

	it("labels each button from the strings and fills in the icons", async () => {
		const { root, control } = await rectifyScreen({
			...DEFAULT_RECTIFY_STRINGS,
			fullImage: "Whole",
		});
		expect(control("fullImage").textContent?.trim()).toBe("Whole");
		expect(control("retake").textContent?.trim()).toBe("Retake");
		const holders = root.querySelectorAll("[data-mds-icon]");
		expect(holders).toHaveLength(3);
		for (const holder of holders) expect(holder.querySelector("svg")).not.toBeNull();
	});

	it("holds every control without turning it off", async () => {
		const { screen, control } = await rectifyScreen();
		screen.setUndoable(true);
		const drawn = () =>
			RECTIFY_SCREEN_BUTTONS.map((button) => [
				control(button).hasAttribute("disabled"),
				control(button).getAttribute("aria-disabled"),
			]);
		screen.show();
		control("detectBoundary").focus();
		screen.setControlsHeld(true);
		expect(drawn()).toEqual(RECTIFY_SCREEN_BUTTONS.map(() => [false, "true"]));
		expect(document.activeElement).toBe(control("detectBoundary"));
		screen.setControlsHeld(false);
		expect(drawn()).toEqual(RECTIFY_SCREEN_BUTTONS.map(() => [false, null]));
	});

	it("keeps undo off through a hold while there is nothing to take back", async () => {
		const { screen, control } = await rectifyScreen();
		const undoOff = () => control("undo").hasAttribute("disabled");
		expect(undoOff()).toBe(true);
		screen.setUndoable(true);
		expect(undoOff()).toBe(false);
		screen.setControlsHeld(true);
		screen.setControlsHeld(false);
		expect(undoOff()).toBe(false);
		screen.setUndoable(false);
		screen.setControlsHeld(true);
		screen.setControlsHeld(false);
		expect(undoOff()).toBe(true);
	});

	it("takes the sizes of the boundary from the page's CSS", async () => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(".mds-rectify { --mds-rectify-line: 3px; --mds-rectify-handle: 20px; }");
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
		try {
			const { viewer } = await rectifyScreen();
			expect(viewer.styles.get("quadSelectionStyle")).toMatchObject({
				border: `3px solid ${DEFAULT_THEME.primary}`,
				ctrlWidth: "20px",
				ctrlHeight: "20px",
			});
		} finally {
			document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
				(adopted) => adopted !== sheet,
			);
		}
	});

	it("shows, hides, and takes down the element with the viewer", async () => {
		const { screen, root, container, viewer } = await rectifyScreen();
		screen.show();
		expect(root.hidden).toBe(false);
		screen.hide();
		expect(root.hidden).toBe(true);
		screen.destroy();
		expect(viewer.calls.slice(1)).toEqual(["show", "hide", "destroy"]);
		expect(container.children).toHaveLength(0);
	});
});

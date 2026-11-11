import type { PerspectiveViewer } from "dynamsoft-document-viewer";
import builtInLayout from "./rectify-layout.html?raw";
import skeleton from "./rectify-ui.html?raw";
import { RECTIFY_SCREEN_BUTTONS } from "../settings/buttons";
import type { HiddenByName, RectifyScreenButton } from "../settings/buttons";
import type { RectifyLayout, RectifyMode, ResolvedSettings } from "../settings/settings";
import type { RectifyStrings } from "../settings/strings";
import { Availability } from "../ui/availability";
import type { PressAction } from "../ui/availability";
import { refuseDrops } from "../ui/drops";
import { fillIcons } from "../ui/icons";
import { fillAreas, findControls, parseSkeleton } from "../ui/layout";
import { RECTIFY_STYLES } from "../ui/styles";
import { mountViewer } from "../ui/viewer-mount";
import type { ViewerEngines } from "../ui/viewer-mount";

// The rectify screen. It is built from a skeleton whose header and footer each hold
// a template: the host application's, or else the built-in one. Document Viewer
// draws only the image and its boundary, between them.

/**
 * A press on the rectify screen. `apply` keeps a new page after a capture, and
 * applies the boundary to a page from the edit screen. Retake shows only after a
 * capture, and cancel only from the edit screen. Undo takes back the last change
 * to the boundary.
 */
export interface RectifyPress {
	readonly button: RectifyScreenButton;
}

/** What building the rectify screen reads. */
export interface RectifyScreenOptions extends Pick<ResolvedSettings, "strings" | "theme"> {
	/** The uid of the document that holds the image the screen shows. */
	readonly documentUid: string;
	/** Which buttons the host application's settings of each mode hide. */
	readonly buttons: Readonly<Record<RectifyMode, HiddenByName<RectifyScreenButton>>>;
	/** The host application's templates for the screen's areas. */
	readonly layout: RectifyLayout | undefined;
}

/** The setting that fills the screen's areas, as errors name it. */
const LAYOUT_SETTING = "phases.rectify.layout";

/** Every copy of each control on the screen, by its button name. */
type Controls = Readonly<Record<RectifyScreenButton, readonly HTMLElement[]>>;

/**
 * The rectify screen: its bars from markup, around Document Viewer's perspective
 * viewer. It starts hidden.
 */
export class RectifyScreen {
	/** The live viewer, which `getDdvViewer()` also returns to the host application. */
	readonly viewer: PerspectiveViewer;
	readonly #element: HTMLElement;
	readonly #controls: Controls;
	readonly #strings: RectifyStrings;
	readonly #buttons: RectifyScreenOptions["buttons"];
	readonly #availability: Availability;
	#held = false;
	#undoable = false;

	private constructor(
		viewer: PerspectiveViewer,
		element: HTMLElement,
		controls: Controls,
		strings: RectifyStrings,
		buttons: RectifyScreenOptions["buttons"],
		availability: Availability,
	) {
		this.viewer = viewer;
		this.#element = element;
		this.#controls = controls;
		this.#strings = strings;
		this.#buttons = buttons;
		this.#availability = availability;
		this.#refreshControls();
	}

	/**
	 * Build the screen, hidden, in `container`, and report each press on its buttons
	 * to `onPress`.
	 */
	static async build(
		engines: ViewerEngines,
		container: HTMLElement,
		options: RectifyScreenOptions,
		onPress: (press: RectifyPress) => PressAction,
	): Promise<RectifyScreen> {
		const element = parseSkeleton(skeleton);
		element.hidden = true;
		refuseDrops(element);
		fillAreas(element, options.layout, builtInLayout);
		const strings = options.strings.rectify;
		for (const title of element.querySelectorAll(".mds-rectify-title")) {
			title.textContent = strings.title;
		}
		fillIcons(element);
		const availability = new Availability();
		const controls = findControls([element], RECTIFY_SCREEN_BUTTONS, LAYOUT_SETTING);
		for (const button of RECTIFY_SCREEN_BUTTONS) {
			for (const control of controls[button]) {
				labelControl(control, strings[button]);
				availability.listen(control, () => onPress({ button }));
			}
		}
		// In the page first, so that the viewer's styles reach the root it is in.
		container.append(element);
		const area = element.querySelector<HTMLElement>(".mds-rectify-viewer")!;
		try {
			const viewer = await mountViewer<PerspectiveViewer>(engines, area, options.theme, {
				document: options.documentUid,
				background: options.theme.surface,
				styles: [RECTIFY_STYLES],
				build: (engine) =>
					new engine.PerspectiveViewer({
						container: area,
						uiConfig: { type: engine.Elements.MainView },
						// The image would slide sideways under a drag, as if to another page. A
						// dropped file would load into the screen's document.
						viewerConfig: { enableSlide: false, enableLoadSourceByDrag: false },
					}),
			});
			// The boundary and its handles in the theme's accent. The page has no border, and
			// must not show white under a scaled image.
			// The sizes come from the stylesheet, which page CSS can override.
			const { primary } = options.theme;
			const styles = getComputedStyle(element);
			const size = (name: string) => styles.getPropertyValue(`--mds-rectify-${name}`).trim();
			viewer.updateStyle("quadSelectionStyle", {
				border: `${size("line")} solid ${primary}`,
				// A handle border of "none" draws a black outline.
				ctrlBorder: `1px solid ${primary}`,
				ctrlBorderRadius: size("handle-radius"),
				ctrlWidth: size("handle"),
				ctrlHeight: size("handle"),
				ctrlBackground: primary,
			});
			// With a border of "none", Document Viewer draws no page at all.
			viewer.updateStyle("pageStyle", {
				border: "0px solid transparent",
				background: "transparent",
			});
			return new RectifyScreen(viewer, element, controls, strings, options.buttons, availability);
		} catch (thrown) {
			element.remove();
			throw thrown;
		}
	}

	/**
	 * Draw the screen for `mode`, with the host application's button settings of that
	 * mode. Retake shows after a capture, and cancel and the title show from the edit
	 * screen. Apply reads "Keep" after a capture.
	 */
	draw(mode: RectifyMode): void {
		const afterCapture = mode === "afterCapture";
		const buttons = this.#buttons[mode];
		const shown: Partial<Record<RectifyScreenButton, boolean>> = {
			retake: afterCapture,
			cancel: !afterCapture,
		};
		for (const button of RECTIFY_SCREEN_BUTTONS) {
			const hidden = !(shown[button] ?? true) || buttons?.[button]?.hidden === true;
			for (const control of this.#controls[button]) control.hidden = hidden;
		}
		for (const apply of this.#controls.apply) {
			labelControl(apply, afterCapture ? this.#strings.keep : this.#strings.apply);
		}
		for (const title of this.#element.querySelectorAll<HTMLElement>(".mds-rectify-title")) {
			title.hidden = afterCapture;
		}
	}

	/** Mark the controls unavailable while the session is busy, or available again. */
	setControlsHeld(held: boolean): void {
		this.#held = held;
		this.#refreshControls();
	}

	/** Turn undo on while there is a change to take back, or off. */
	setUndoable(undoable: boolean): void {
		this.#undoable = undoable;
		this.#refreshControls();
	}

	/** Make the screen visible. */
	show(): void {
		this.#element.hidden = false;
		// After the element shows, so that the viewer measures its area again.
		this.viewer.show();
	}

	/** Make the screen invisible, and keep it built. */
	hide(): void {
		this.#element.hidden = true;
		this.viewer.hide();
	}

	/** Take the screen down for good. */
	destroy(): void {
		this.viewer.destroy();
		this.#element.remove();
	}

	/** Draw each control, with undo off while it has nothing to take back. */
	#refreshControls(): void {
		for (const button of RECTIFY_SCREEN_BUTTONS) {
			for (const control of this.#controls[button]) {
				this.#availability.draw(control, {
					off: button === "undo" && !this.#undoable,
					held: this.#held,
				});
			}
		}
	}
}

/**
 * Give `control` its text: in its label part when the markup has one, or else as
 * its accessible name, since a control without the part shows only its icon.
 */
function labelControl(control: HTMLElement, text: string): void {
	const label = control.querySelector(".mds-rectify-label");
	if (label) label.textContent = text;
	else control.setAttribute("aria-label", text);
}

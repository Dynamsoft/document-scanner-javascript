import builtInLayout from "./capture-layout.html?raw";
import skeleton from "./capture-ui.html?raw";
import {
	CAMERA_MENU_CLASS,
	CAMERA_MENU_ITEM_CLASS,
	ENGINE_LAYER_CLASS,
	ENGINE_VIEWFINDER_CLASS,
	HINT_CLASS,
	SPINNER_CLASSES,
	THUMBNAIL_PART_CLASSES,
} from "./capture-contract";
import { BUTTON_ATTRIBUTE, CAPTURE_SCREEN_BUTTONS } from "../settings/buttons";
import type { CaptureScreenButton } from "../settings/buttons";
import type { TorchState } from "./capture-contract";
import type { Quadrilateral } from "../results";
import type { ResolvedCaptureSettings, ResolvedSettings } from "../settings/settings";
import type { ResolvedStrings } from "../settings/strings";
import { createBoundaryOutline } from "./boundary-outline";
import type { BoundaryOutline } from "./boundary-outline";
import { createScanRegion } from "./scan-region";
import type { ScanRegion } from "./scan-region";
import type { Box, FrameSize } from "../boundaries/framing";
import type { Hint } from "../boundaries/hint";
import { Availability } from "../ui/availability";
import type { PressAction } from "../ui/availability";
import { refuseDrops } from "../ui/drops";
import { fillIcons } from "../ui/icons";
import { AREA_ATTRIBUTE, fillAreas, findControls, parseSkeleton } from "../ui/layout";
import { CAPTURE_STYLES, COMMON_STYLES, adoptStyles, applyTheme } from "../ui/styles";

// The capture screen. It is built from a fixed skeleton whose areas each hold a
// template: the host application's, or else the built-in one. It draws its
// controls from the state the capture phase gives it.

/** The setting that fills the screen's areas, as errors name it. */
const LAYOUT_SETTING = "phases.capture.layout";

/** The settings that building the screen reads. */
type ScreenSettings = Pick<ResolvedSettings, "strings" | "theme"> & {
	readonly phases: { readonly capture: Pick<ResolvedCaptureSettings, "layout" | "buttons"> };
	/**
	 * Whether the screen adds a scan region. No setting turns it on yet, so the page
	 * needs only the whole frame, as in 1.5.0.
	 */
	readonly scanRegion?: boolean;
};

/** A camera the switcher can offer. The label appears only in the menu. */
export interface CameraChoice {
	readonly id: string;
	readonly label?: string;
}

/**
 * A button pressed on the capture screen. A camera switcher press carries the id
 * of the chosen camera.
 */
export type CapturePress =
	| { readonly button: Exclude<CaptureScreenButton, "cameraSwitcher"> }
	| { readonly button: "cameraSwitcher"; readonly camera: string };

/** What the capture screen calls on its owner. */
export interface CaptureScreenCallbacks {
	/** Act on a button pressed on the screen, and return the action it started, if any. */
	onPress(press: CapturePress): PressAction;
	/** Read the image of a page in the scanned document, for the thumbnail. */
	readPage(uid: string): Promise<Blob>;
}

/** The state the capture screen's controls are drawn from. */
export interface CaptureScreenState {
	/** Whether the camera is open. Until it is, the shutter is off and the viewfinder's spinner turns. */
	readonly cameraOpen: boolean;
	/**
	 * Whether the session holds the controls while it runs an action or the host
	 * application's `finish()`, such as taking a page or switching the camera.
	 * Presses on every control but cancel do nothing meanwhile, so the user can
	 * always leave, unless the host application hides cancel.
	 */
	readonly held: boolean;
	/**
	 * Whether the document holds as many pages as `maxPages` allows. While it is set,
	 * the shutter and load image are off.
	 */
	readonly full: boolean;
	/**
	 * What is being taken. `page` means a page is on its way to the document.
	 * `photograph` means a page is on its way and the viewfinder shows no usable view:
	 * the camera takes its photograph, or a file that the user picked loads.
	 */
	readonly taking: "none" | "page" | "photograph";
	readonly autoCapture: boolean;
	readonly torch: TorchState;
	/** The cameras the switcher offers, in its order. Empty until a camera is open. */
	readonly cameras: readonly CameraChoice[];
	/** The open camera's id, or `undefined` when none of `cameras` matches it. */
	readonly activeCamera: string | undefined;
	/** How many pages the scanned document holds. */
	readonly pageCount: number;
	/** The uid of the newest page, or `undefined` while there are none. */
	readonly newestPage: string | undefined;
}

/** A thumbnail control and the parts the screen draws in it. */
interface Thumbnail {
	readonly control: HTMLElement;
	readonly count: HTMLElement | null;
	readonly image: HTMLElement | null;
	/** The spinner the screen adds, for a page on its way. */
	readonly spinner: HTMLElement;
}

/**
 * The parts of the capture screen that `CaptureScreen` draws or listens to. Each
 * is set once, when the screen is built.
 */
interface Parts {
	/** Every copy of each control, in markup order. A control may have none. */
	readonly controls: Readonly<Record<CaptureScreenButton, readonly HTMLElement[]>>;
	readonly thumbnails: readonly Thumbnail[];
	/** The camera menu, or `null` when the markup has no menu or no camera switcher. */
	readonly menu: HTMLElement | null;
	/** The area the camera engine puts its video in. */
	readonly viewfinder: HTMLElement;
	/** The scan region the screen adds to the viewfinder, or `null` without one. */
	readonly scanRegion: ScanRegion | null;
	/** The outline the screen adds to the viewfinder. */
	readonly outline: BoundaryOutline;
	/** The spinner the screen adds to the viewfinder, for a photograph. */
	readonly viewfinderSpinner: HTMLElement;
	/** The hint the screen adds to the viewfinder, a live region that is empty without a hint. */
	readonly hint: HTMLElement;
}

/**
 * The capture screen, built once and kept for the camera's life. The capture
 * phase attaches the screen, opens the camera, and redraws the screen whenever its
 * state changes.
 */
export class CaptureScreen {
	/** The screen's element. The camera engine puts its video in the viewfinder. */
	readonly element: HTMLElement;
	readonly #parts: Parts;
	readonly #callbacks: CaptureScreenCallbacks;
	/** The thumbnail's label from the strings. Its name is this label, then the page count. */
	readonly #thumbnailLabel: string;
	/** The text of each hint, from the strings. */
	readonly #hintText: Readonly<Record<Hint, string>>;
	/** The buttons that the host application's settings hide. */
	readonly #hiddenBySettings: ReadonlySet<CaptureScreenButton>;
	readonly #availability = new Availability();
	/** The switcher that opened the camera menu, which a choice in the menu presses. */
	#menuOpener: HTMLElement | null = null;
	/**
	 * The cameras and the open camera drawn last. A draw rebuilds the menu only when
	 * either changes.
	 */
	#cameras: readonly CameraChoice[] = [];
	#activeCamera: string | undefined;
	/**
	 * The newest page the thumbnail has read or is reading. A draw for the same page
	 * skips the read, and an older read is dropped.
	 */
	#pageRead: { readonly uid: string } | null = null;
	/** The newest page's image on each thumbnail, while there is one. */
	#thumbnailImages: readonly HTMLImageElement[] = [];
	/** The URL every thumbnail image shows, or `null` while they show none. */
	#thumbnailUrl: string | null = null;
	/** The hidden file input that `pickImage()` opens, made on its first use. */
	#picker: HTMLInputElement | null = null;

	/**
	 * Build the screen, with each area filled from the template that
	 * `phases.capture.layout` gives, or else from the built-in one, and fill in its
	 * icons and its text.
	 */
	constructor(settings: ScreenSettings, callbacks: CaptureScreenCallbacks) {
		this.element = parseSkeleton(skeleton);
		refuseDrops(this.element);
		fillAreas(this.element, settings.phases.capture.layout, builtInLayout);
		this.#parts = buildParts(this.element, settings.scanRegion === true);
		fillIcons(this.element);
		fillStrings(this.#parts.controls, settings.strings);
		this.#hiddenBySettings = new Set(
			CAPTURE_SCREEN_BUTTONS.filter(
				(button) => settings.phases.capture.buttons?.[button]?.hidden === true,
			),
		);
		for (const button of this.#hiddenBySettings) {
			for (const control of this.#parts.controls[button]) control.hidden = true;
		}
		this.#thumbnailLabel = settings.strings.capture.thumbnail;
		this.#hintText = settings.strings.capture;
		applyTheme(this.element, settings.theme);
		this.#callbacks = callbacks;
		this.#listen();
	}

	/**
	 * Put the screen in `container`, styled for the root the container is in. A
	 * screen already there stays where it is. The next draw reads the newest page
	 * again, because it may have been rectified, rotated, or deleted since.
	 */
	attach(container: HTMLElement): void {
		// Appending it again would move it, and take the camera's video off the page.
		if (this.element.parentElement !== container) {
			container.append(this.element);
			// After appending, to adopt the sheets into the root the element is in.
			adoptStyles(this.element, COMMON_STYLES);
			adoptStyles(this.element, CAPTURE_STYLES);
		}
		this.#pageRead = null;
	}

	/**
	 * Open the browser's file picker for one image. Resolve with the file chosen when
	 * the picker closes, or with `null` when it closes with no file. Call it while
	 * the user's press is still being handled, or the browser refuses to open it.
	 */
	pickImage(): Promise<File | null> {
		if (!this.#picker) {
			this.#picker = document.createElement("input");
			this.#picker.type = "file";
			this.#picker.accept = "image/*";
			this.#picker.hidden = true;
			this.element.append(this.#picker);
		}
		const picker = this.#picker;
		const picked = new Promise<File | null>((resolve) => {
			// A file input always has a file list. Each call replaces the handlers of the
			// call before.
			picker.onchange = () => resolve(picker.files!.item(0));
			// The cancel event needs Chrome 113, Firefox 91, and Safari 16.4.
			picker.oncancel = () => resolve(null);
		});
		// Clear the value, so that the browser reports a change for the same file again.
		picker.value = "";
		picker.click();
		return picked;
	}

	/** Remove the screen from its container. A page image still being read is dropped. */
	detach(): void {
		this.element.remove();
		this.#pageRead = null;
	}

	/** Draw every copy of every control from `state`. */
	draw(state: CaptureScreenState): void {
		const { controls, viewfinderSpinner } = this.#parts;
		const availability = this.#availability;
		const { held } = state;
		// Running while a page is taken, also by auto-capture, which takes it with no press.
		const taking = state.taking !== "none";
		for (const shutter of controls.shutter) {
			availability.draw(shutter, { off: !state.cameraOpen || state.full, held, running: taking });
		}
		viewfinderSpinner.hidden = state.cameraOpen && state.taking !== "photograph";
		for (const torch of controls.torch) {
			torch.hidden = state.torch === "absent" || this.#hiddenBySettings.has("torch");
			availability.draw(torch, { off: state.torch === "refused", held });
			torch.setAttribute("aria-pressed", String(state.torch === "on"));
		}
		for (const toggle of controls.autoCapture) {
			toggle.setAttribute("aria-pressed", String(state.autoCapture));
			availability.draw(toggle, { held });
		}
		for (const switcher of controls.cameraSwitcher) availability.draw(switcher, { held });
		for (const loadImage of controls.loadImage) {
			availability.draw(loadImage, { off: state.full, held });
		}
		this.#drawSwitcher(state.cameras, state.activeCamera);
		// A camera chosen now would be dropped.
		if (state.held) this.#setMenuOpen(false);
		this.#drawThumbnail(state);
	}

	/**
	 * Outline a page found in the viewfinder. Its corners are in the pixels of
	 * `frame`, the camera's frame size.
	 */
	drawBoundary(boundary: Quadrilateral, frame: FrameSize): void {
		this.#parts.outline.draw(boundary, frame);
	}

	/**
	 * Measure the scan region in the pixels of a frame of `size`. Return `null`
	 * without a scan region.
	 */
	measureScanRegion(size: FrameSize): Box | null {
		return this.#parts.scanRegion?.measure(size) ?? null;
	}

	/**
	 * Mark the viewfinder's child that holds the camera engine's `video`, the layer
	 * the engine adds, so the stylesheet can fit it.
	 */
	markEngineLayer(video: Pick<Element, "parentElement">): void {
		let layer = video.parentElement;
		while (layer && layer.parentElement !== this.#parts.viewfinder) layer = layer.parentElement;
		layer?.classList.add(ENGINE_LAYER_CLASS);
	}

	/** Show `hint` over the viewfinder. A screen reader reads each new hint. */
	drawHint(hint: Hint): void {
		this.#writeHint(this.#hintText[hint]);
	}

	/** Take the hint away until the next `drawHint()`. */
	clearHint(): void {
		this.#writeHint("");
	}

	/**
	 * Write `text` into the hint if it changed, because a live region can announce
	 * the same text again on each write.
	 */
	#writeHint(text: string): void {
		if (this.#parts.hint.textContent !== text) this.#parts.hint.textContent = text;
	}

	/** Erase the outline until the next `drawBoundary()`. */
	clearBoundary(): void {
		this.#parts.outline.clear();
	}

	/**
	 * Report which control the user pressed. A camera switcher opens the menu or
	 * moves to the next camera instead.
	 */
	#listen(): void {
		const { controls, menu } = this.#parts;
		this.element.addEventListener("click", (event) => {
			const { target } = event;
			const control =
				target instanceof Element && target.closest<HTMLElement>(`[${BUTTON_ATTRIBUTE}]`);
			if (!control) return;
			// Only the controls found when the screen was built. closest() can also reach
			// the screen's root, or climb past it into the host application's page.
			const button = CAPTURE_SCREEN_BUTTONS.find((name) => controls[name].includes(control));
			// `disabled` does not stop clicks on a control that is not a `<button>` element,
			// and a held switcher would open its menu, which the session's hold does not stop.
			if (!button || control.matches('[disabled], [aria-disabled="true"]')) return;
			this.#availability.press(control, () =>
				button === "cameraSwitcher"
					? this.#onSwitcherPress(control)
					: this.#callbacks.onPress({ button }),
			);
		});
		if (!menu) return;
		// Close the menu on a tap outside it and the switchers, or on Escape.
		const keepOpen = [menu, ...controls.cameraSwitcher];
		this.element.addEventListener("pointerdown", (event) => {
			const path = event.composedPath();
			if (!keepOpen.some((part) => path.includes(part))) this.#setMenuOpen(false);
		});
		this.element.addEventListener("keydown", (event) => {
			if (event.key === "Escape") this.#setMenuOpen(false);
		});
	}

	/**
	 * The camera menu, or `null` when the switchers change camera directly. They
	 * open the menu for three or more cameras when the markup has one.
	 */
	#switcherMenu(): HTMLElement | null {
		return this.#cameras.length > 2 ? this.#parts.menu : null;
	}

	/**
	 * Open or close the camera menu, or choose the next camera and return the action
	 * that switches to it.
	 */
	#onSwitcherPress(switcher: HTMLElement): PressAction {
		const menu = this.#switcherMenu();
		if (menu) {
			this.#menuOpener = switcher;
			this.#setMenuOpen(Boolean(menu.hidden));
			return undefined;
		}
		const cameras = this.#cameras;
		if (cameras.length < 2) return undefined;
		const current = cameras.findIndex((camera) => camera.id === this.#activeCamera);
		const next = cameras[(current + 1) % cameras.length]!;
		return this.#callbacks.onPress({ button: "cameraSwitcher", camera: next.id });
	}

	/** Open or close the camera menu. Does nothing while the switchers change camera directly. */
	#setMenuOpen(open: boolean): void {
		const menu = this.#switcherMenu();
		if (!menu) return;
		menu.hidden = !open;
		for (const switcher of this.#parts.controls.cameraSwitcher) {
			switcher.setAttribute("aria-expanded", String(open));
		}
	}

	/**
	 * Draw the camera switchers and the menu from `cameras` and `active`. The
	 * switchers are hidden for fewer than two cameras. The menu is filled for three
	 * or more, when the markup has one.
	 */
	#drawSwitcher(cameras: readonly CameraChoice[], active: string | undefined): void {
		if (sameCameras(cameras, this.#cameras) && active === this.#activeCamera) return;
		this.#cameras = cameras;
		this.#activeCamera = active;
		// Close and empty the menu. It is filled again below for three or more cameras.
		const list = this.#parts.menu;
		if (list) {
			list.hidden = true;
			list.replaceChildren();
		}
		const switchers = this.#parts.controls.cameraSwitcher;
		const hidden = cameras.length < 2 || this.#hiddenBySettings.has("cameraSwitcher");
		for (const switcher of switchers) switcher.hidden = hidden;
		if (cameras.length < 2) return;
		const menu = this.#switcherMenu();
		for (const switcher of switchers) {
			if (menu) {
				switcher.setAttribute("aria-haspopup", "menu");
				switcher.setAttribute("aria-expanded", "false");
			} else {
				switcher.removeAttribute("aria-haspopup");
				switcher.removeAttribute("aria-expanded");
			}
		}
		menu?.replaceChildren(
			...cameras.map((camera, index) => {
				const item = document.createElement("button");
				item.type = "button";
				item.className = CAMERA_MENU_ITEM_CLASS;
				item.setAttribute("role", "menuitemradio");
				item.setAttribute("aria-checked", String(camera.id === active));
				// A browser may give a camera no label.
				item.textContent = camera.label || `Camera ${index + 1}`;
				item.addEventListener("click", () => {
					this.#setMenuOpen(false);
					// A choice in the menu presses the switcher that opened it.
					this.#availability.press(this.#menuOpener!, () =>
						this.#callbacks.onPress({ button: "cameraSwitcher", camera: camera.id }),
					);
				});
				return item;
			}),
		);
	}

	/**
	 * Draw the page count immediately, and the newest page once its image is read.
	 * An image that cannot be read leaves the last one in place.
	 */
	#drawThumbnail({ pageCount, newestPage, taking, held }: CaptureScreenState): void {
		for (const { control, count, spinner } of this.#parts.thumbnails) {
			this.#availability.draw(control, { off: pageCount === 0, held });
			// The stylesheet hides an empty badge.
			if (count) count.textContent = pageCount > 0 ? String(pageCount) : "";
			// An `aria-label` hides the content from the name, the badge too, so the name
			// carries the count itself.
			const label = this.#thumbnailLabel;
			control.setAttribute("aria-label", pageCount > 0 ? `${label} ${pageCount}` : label);
			spinner.hidden = taking === "none";
		}
		if (pageCount === 0 || newestPage === undefined) {
			// A cancelled session's last page must not linger.
			this.#pageRead = null;
			this.#removeThumbnailImages();
			return;
		}
		if (newestPage === this.#pageRead?.uid) return;
		const read = { uid: newestPage };
		this.#pageRead = read;
		void this.#callbacks.readPage(newestPage).then(
			(page) => {
				if (this.#pageRead === read) this.#setThumbnailImages(page);
			},
			() => undefined,
		);
	}

	/**
	 * Put a page's image on every thumbnail. The old URL is released only after the
	 * new images decode. That keeps the thumbnails from blinking.
	 */
	#setThumbnailImages(page: Blob): void {
		if (this.#thumbnailImages.length === 0) {
			this.#thumbnailImages = this.#parts.thumbnails.flatMap(({ image }) =>
				image ? [image.appendChild(document.createElement("img"))] : [],
			);
		}
		const images = this.#thumbnailImages;
		if (images.length === 0) return;
		const previous = this.#thumbnailUrl;
		const url = (this.#thumbnailUrl = URL.createObjectURL(page));
		for (const image of images) image.src = url;
		void Promise.allSettled(images.map((image) => image.decode())).then(() => {
			if (previous) URL.revokeObjectURL(previous);
		});
	}

	/** Remove the images from the thumbnails and release their URL. */
	#removeThumbnailImages(): void {
		if (this.#thumbnailUrl) URL.revokeObjectURL(this.#thumbnailUrl);
		for (const image of this.#thumbnailImages) image.remove();
		this.#thumbnailImages = [];
		this.#thumbnailUrl = null;
	}
}

/** Whether two camera lists offer the same cameras, in the same order. */
function sameCameras(a: readonly CameraChoice[], b: readonly CameraChoice[]): boolean {
	return (
		a.length === b.length &&
		a.every((camera, i) => camera.id === b[i]?.id && camera.label === b[i]?.label)
	);
}

/**
 * Set each control's label and tooltip from the strings in effect. Each draw adds
 * the page count to the thumbnail's label.
 */
function fillStrings(controls: Parts["controls"], strings: ResolvedStrings): void {
	for (const button of CAPTURE_SCREEN_BUTTONS) {
		for (const control of controls[button]) {
			control.setAttribute("aria-label", strings.capture[button]);
			control.setAttribute("title", strings.capture[`${button}Tooltip`]);
		}
	}
}

/**
 * Find each control by its `data-mds-button` name, and the other parts by their
 * class names in `capture-contract.ts`. Give the viewfinder the class the camera engine
 * puts its video in. Add the scan region if `scanRegion` is set, the outline, a
 * spinner, and the hint to the viewfinder, and a spinner to each thumbnail.
 */
function buildParts(root: HTMLElement, scanRegion: boolean): Parts {
	const controls = findControls([root], CAPTURE_SCREEN_BUTTONS, LAYOUT_SETTING);
	const menus = root.querySelectorAll<HTMLElement>(`.${CAMERA_MENU_CLASS}`);
	// A second menu would stay empty.
	if (menus.length > 1)
		throw new Error(`${LAYOUT_SETTING} has more than one .${CAMERA_MENU_CLASS}`);
	const viewfinders = `[${AREA_ATTRIBUTE}="viewfinder"], .${ENGINE_VIEWFINDER_CLASS}`;
	// The camera engine puts its video in the first element with its own class, so
	// such an element counts as a viewfinder.
	if (root.querySelectorAll(viewfinders).length > 1) {
		throw new Error(`${LAYOUT_SETTING} has more than one viewfinder area`);
	}
	// The skeleton has one, and the layout cannot leave it out.
	const viewfinder = root.querySelector<HTMLElement>(`[${AREA_ATTRIBUTE}="viewfinder"]`)!;
	viewfinder.classList.add(ENGINE_VIEWFINDER_CLASS);
	return {
		controls,
		thumbnails: controls.thumbnail.map((control) => ({
			control,
			count: control.querySelector<HTMLElement>(`.${THUMBNAIL_PART_CLASSES.count}`),
			image: control.querySelector<HTMLElement>(`.${THUMBNAIL_PART_CLASSES.image}`),
			spinner: createSpinner(control, "thumbnail"),
		})),
		menu: controls.cameraSwitcher.length > 0 ? (menus[0] ?? null) : null,
		viewfinder,
		// Before the outline, which draws over it.
		scanRegion: scanRegion ? createScanRegion(viewfinder) : null,
		outline: createBoundaryOutline(viewfinder),
		viewfinderSpinner: createSpinner(viewfinder, "viewfinder"),
		hint: createHint(viewfinder),
	};
}

/**
 * Create the empty hint in the viewfinder. It stays in the page while empty, so a
 * screen reader already watches it when the first hint arrives.
 */
function createHint(viewfinder: HTMLElement): HTMLElement {
	const hint = document.createElement("p");
	hint.className = HINT_CLASS;
	hint.setAttribute("role", "status");
	viewfinder.append(hint);
	return hint;
}

/** Create a hidden spinner in `parent`, the part it sits in. Screen readers skip it. */
function createSpinner(parent: HTMLElement, place: "viewfinder" | "thumbnail"): HTMLElement {
	const spinner = document.createElement("span");
	spinner.className = `${SPINNER_CLASSES.spinner} ${SPINNER_CLASSES[place]}`;
	spinner.hidden = true;
	spinner.setAttribute("aria-hidden", "true");
	parent.append(spinner);
	return spinner;
}

import type { EngineResourcePaths } from "dynamsoft-capture-vision-bundle";
import type {
	AfterCaptureButton,
	ButtonSettingsFor,
	ButtonsByName,
	CaptureScreenButton,
	EditModeButton,
	EditScreenButton,
	FromEditButton,
	RectifyScreenButton,
} from "./buttons";
import type { ImageEncoding, PhaseName } from "../results";
import { checkSettings } from "./checks";
import { FILTER_NAMES } from "./filters";
import type { FilterName } from "./filters";
import { DEFAULT_STRINGS } from "./strings";
import type { ResolvedStrings, StringSettings } from "./strings";
import { DEFAULT_THEME } from "./theme";
import type { ThemeLiterals, ThemeTokens } from "./theme";

// The type and default of every setting.

/** The default root directory of the runtime files of the engines. */
export const DEFAULT_RESOURCE_ROOT: string = "https://cdn.jsdelivr.net/npm/";

// The placeholder key of the samples, which stands for the public trial until the
// developer replaces it.
const LICENSE_PLACEHOLDER = "YOUR_LICENSE_KEY_HERE";

/** The settings of a {@link DocumentScanner}. Every setting is optional. */
export interface ScannerSettings {
	/**
	 * The license key of both engines. With an empty key, no key, or the placeholder
	 * key `"YOUR_LICENSE_KEY_HERE"` of the samples, the engines use the public trial
	 * license.
	 */
	license?: string;

	/** The locations of the runtime files of the engines. */
	resources?: ResourceSettings;

	/**
	 * Engine modules that the host application already imported. With them, the
	 * document scanner imports no engine of its own. Use this setting when the page
	 * would otherwise load two copies of an engine. Also use it when the page has no
	 * bundler for the package names that the document scanner imports.
	 */
	engines?: EngineSettings;

	/**
	 * The element that the document scanner shows in, or a selector for one. The
	 * capture screen always shows here. The edit screen also shows here, unless
	 * {@link EditSettings.container} names another element. For the rectify screen,
	 * see {@link RectifySettings.container}. In `document.body`, the `.mds-scanner`
	 * element of the document scanner covers the browser window.
	 *
	 * The stacking order is stable, and no minor release changes it. The element
	 * that covers the browser window is at z-index 2000000000. The dialogs open in the
	 * browser's top layer, above every z-index, and at z-index 2000000001 where the
	 * browser cannot open them modally. An element of the page with a z-index of
	 * 2000000002 or more shows above the document scanner, and one with less than
	 * 2000000000 stays below it.
	 *
	 * @defaultValue `document.body`
	 */
	container?: HTMLElement | string;

	/** The colors of the screens. */
	theme?: ThemeTokens;
	/** The text of the screens and the dialogs, in place of the built-in English text. */
	strings?: StringSettings;

	/**
	 * The encoded document that the result carries, such as one PDF of every page.
	 * Without it, the result carries only its pages, as {@link SuccessfulScan.pages}.
	 */
	output?: OutputSettings;

	/**
	 * The most pages that the document may hold: a whole number of at least 1, or
	 * `"unlimited"`. The count includes the pages that an earlier
	 * {@link DocumentScanner.finish | finish()} kept.
	 *
	 * When a new page fills the document, the edit screen opens. If the edit phase is
	 * off, the session ends with the pages. If the document is full when a session
	 * starts, the edit screen opens. If the edit phase is off, the capture screen
	 * opens instead, with a notice that no page can be added. The capture screen also
	 * shows that notice if the edit phase is off and the session cannot finish after
	 * the last page.
	 *
	 * @defaultValue `"unlimited"`
	 */
	maxPages?: number | "unlimited";

	/** The settings of each phase. */
	phases?: PhaseSettings;
}

// TODO: the compression and annotation options of each format.
/**
 * The encoded document that the result carries, in {@link SuccessfulScan.output}.
 * The result carries its pages in every format.
 */
export type OutputSettings =
	/** Every page in one PDF. */
	| { format: "pdf" }
	/** Every page in one TIFF. */
	| { format: "tiff" }
	/** One image per page, in page order. */
	| ({ format: "images" } & ImageEncoding);

/**
 * The locations of the runtime files of the engines. By default, the engines fetch
 * them from a CDN.
 */
export interface ResourceSettings {
	/**
	 * The resource paths of Capture Vision, in the shape of its own
	 * `engineResourcePaths`. The document scanner passes them to the engine as given.
	 *
	 * @defaultValue `{ rootDirectory: "https://cdn.jsdelivr.net/npm/" }`
	 */
	captureVision?: EngineResourcePaths;
	/**
	 * The directory of the runtime files of Document Viewer. The default directory is
	 * under the `rootDirectory` of {@link ResourceSettings.captureVision | captureVision},
	 * for the version of Document Viewer that the page loads.
	 *
	 * @defaultValue `<rootDirectory>/dynamsoft-document-viewer@<version>/dist/engine`
	 */
	documentViewer?: string;
}

/**
 * Engine modules that the host application already imported. If the major or minor
 * version of a module differs from the version that the document scanner supports,
 * the engines fail to load.
 */
export interface EngineSettings {
	/** The `dynamsoft-capture-vision-bundle` module. */
	captureVision?: typeof import("dynamsoft-capture-vision-bundle");
	/** The `dynamsoft-document-viewer` module. */
	documentViewer?: typeof import("dynamsoft-document-viewer");
}

/**
 * The settings of each phase. A phase without settings runs with its defaults. Set
 * `rectify` or `edit` to `false` to turn that phase off. If the edit phase is off,
 * the thumbnail of the capture screen finishes the session, and the rectify screen
 * opens only after a capture.
 */
export interface PhaseSettings {
	capture?: CaptureSettings;
	rectify?: RectifySettings | false;
	edit?: EditSettings | false;
}

/**
 * The settings of the capture phase. The capture screen shows in
 * {@link ScannerSettings.container}.
 */
export interface CaptureSettings {
	/**
	 * Whether auto-capture is on when a session starts. The viewfinder outlines the
	 * document either way. While auto-capture is on, the document scanner takes a page
	 * when the document holds still. While it is off, the user presses the shutter.
	 * The user can turn auto-capture on and off with the toggle in the header. The
	 * choice holds for the rest of the session.
	 *
	 * @defaultValue `true`
	 */
	autoCapture?: boolean;

	// TODO: the same count takes very different times on different devices, so the
	// default stays low.
	/**
	 * How many frames in a row must agree on where the document is before
	 * auto-capture takes the page. A higher count gives a steadier page, but a slower
	 * capture.
	 *
	 * @defaultValue `2`
	 */
	minStableFrames?: number;

	/**
	 * Whether auto-capture waits until the document is framed well. A document is
	 * framed well when it fills much of the view of the camera, and no side of the
	 * view cuts it off. While auto-capture waits, a hint over the viewfinder tells the
	 * user to move closer or farther away. The shutter takes a page however the
	 * document is framed. A minor release can improve how the document scanner judges
	 * the framing.
	 *
	 * @defaultValue `true`
	 */
	waitForFraming?: boolean;

	/**
	 * The areas of the capture screen to fill with other content, or to leave out.
	 * An area left unset keeps its built-in content. An element with a
	 * `data-mds-icon` attribute gets the icon it names. An element with a
	 * `data-mds-button` attribute, such as `data-mds-button="shutter"`, works like
	 * the built-in button of that name. A button may appear any number of times, or
	 * not at all. Each copy gets its label and tooltip from
	 * {@link StringSettings.capture | strings.capture}. Thus a button must not have its
	 * own `aria-label`, `aria-labelledby`, or `title`, and a button name must be a
	 * {@link CaptureScreenButton}. Each of these cases is an error.
	 */
	layout?: CaptureLayout;

	/**
	 * The settings of each button: whether the screen hides it, and a handler that
	 * runs before its default action. When auto-capture takes a page, nobody presses
	 * the shutter, so the handler of the shutter does not run.
	 */
	buttons?: ButtonSettingsFor<CaptureScreenButton>;
}

/**
 * New content for the areas of the capture screen. Each area takes a template. Each
 * time the document scanner builds the screen, it copies the template into the
 * area, in place of the built-in content. The area element stays, and the styles
 * of the document scanner still apply to it. An empty template leaves the area
 * empty. `false` removes the header or the footer, with its buttons.
 *
 * The document scanner does not copy the listeners of the template. Thus the host
 * application listens for its own buttons on {@link ScannerSettings.container}.
 * The published file `dist/defaults/capture-layout.xml` holds the built-in
 * template of each area, to copy and change.
 */
export interface CaptureLayout {
	/**
	 * The bar above the viewfinder. It holds the cancel button, the auto-capture
	 * toggle, the torch button, and the camera switcher. It also holds the camera
	 * menu, which is one element with the `mds-camera-menu` class. Without the menu,
	 * the camera switcher selects the next camera.
	 */
	header?: HTMLTemplateElement | false;
	/** The area that shows the video of the camera. The host application cannot remove it. */
	viewfinder?: HTMLTemplateElement;
	/**
	 * The bar below the viewfinder. It holds the import button, the shutter, and the
	 * thumbnail.
	 */
	footer?: HTMLTemplateElement | false;
}

/** The capture settings in effect, with their defaults filled in. */
export interface ResolvedCaptureSettings extends CaptureSettings {
	readonly autoCapture: boolean;
	readonly minStableFrames: number;
	readonly waitForFraming: boolean;
	readonly layout: CaptureLayout;
}

/** The settings of the rectify phase. */
export interface RectifySettings {
	/**
	 * The element that the rectify screen shows in, or a selector for one. Without it,
	 * the rectify screen shows in the element of the screen that opens it. After a
	 * capture, this is the element of the capture screen. From the edit screen, it is
	 * the element of the edit screen.
	 */
	container?: HTMLElement | string;

	/** The two ways to reach the screen. Set one to `false` to remove it. */
	modes?: RectifyModes;

	/**
	 * New content for the header or the footer of the rectify screen, in both modes.
	 * The areas work as {@link CaptureSettings.layout | phases.capture.layout} does,
	 * with the buttons of {@link RectifyScreenButton}. The published file
	 * `dist/defaults/rectify-layout.xml` holds the built-in template of each area, to
	 * copy and change.
	 */
	layout?: RectifyLayout;
}

/**
 * New content for the areas of the rectify screen. Each area takes a template, or
 * `false` to remove the area with its buttons. The document scanner always draws
 * the image and its boundary.
 */
export interface RectifyLayout {
	/** The bar above the image. It holds retake, cancel, the title, and apply. */
	header?: HTMLTemplateElement | false;
	/** The bar below the image. It holds undo, detect borders, and full image. */
	footer?: HTMLTemplateElement | false;
}

/**
 * The two modes of the rectify screen. If both modes are `false`, the rectify phase
 * is off, as with {@link PhaseSettings.rectify | phases.rectify} set to `false`.
 */
export interface RectifyModes {
	/**
	 * The mode after each capture, in which the user accepts or changes the boundary
	 * of the new page.
	 */
	afterCapture?: RectifyModeSettings<AfterCaptureButton> | false;
	/** The mode that the edit screen opens, for its current page. */
	fromEdit?: RectifyModeSettings<FromEditButton> | false;
}

/** The name of a mode of the rectify screen. */
export type RectifyMode = keyof RectifyModes;

/** The settings of one mode of the rectify screen, whose buttons are `Button`. */
export interface RectifyModeSettings<Button extends RectifyScreenButton = RectifyScreenButton> {
	/**
	 * The settings of each button: whether the screen hides it, and a handler that
	 * runs before its default action.
	 */
	buttons?: ButtonSettingsFor<Button>;
}

/** The settings of the edit phase. */
export interface EditSettings {
	/**
	 * The element that the edit screen shows in, or a selector for one.
	 *
	 * @defaultValue {@link ScannerSettings.container}
	 */
	container?: HTMLElement | string;

	/**
	 * The settings of each button: whether the screen hides it, and a handler that
	 * runs before its default action. If the host application hides the rectify
	 * button, the `fromEdit` mode of the rectify screen turns off. If it hides the
	 * filter button, the filter mode turns off. If either mode is off, its button
	 * does not show.
	 */
	buttons?: ButtonSettingsFor<EditScreenButton>;

	/** The modes that the edit screen opens. Set one to `false` to remove its button. */
	modes?: EditModes;

	/**
	 * The settings of the apply and cancel buttons of each mode: whether the screen
	 * hides them, and a handler that runs before their default action.
	 */
	modeButtons?: ButtonSettingsFor<EditModeButton>;

	/**
	 * New content for the header or the footer of the edit screen. The areas work as
	 * {@link CaptureSettings.layout | phases.capture.layout} does, with the buttons of
	 * {@link EditScreenButton}. The published file `dist/defaults/edit-layout.xml`
	 * holds the built-in template of each area, to copy and change.
	 */
	layout?: EditLayout;
}

/**
 * New content for the areas of the edit screen. Each area takes a template, or
 * `false` to remove the area with its buttons. The document scanner always draws
 * these parts: the pages, the buttons over the pages (thumbnails, previous page,
 * and next page), and the bar of a mode.
 */
export interface EditLayout {
	/** The bar above the pages. It holds cancel, add page, and done. */
	header?: HTMLTemplateElement | false;
	/**
	 * The bar below the pages. It holds delete, undo, redo, rectify, rotate, and
	 * filter.
	 */
	footer?: HTMLTemplateElement | false;
}

/** The modes of the edit screen, each opened by its own button. */
export interface EditModes {
	/** The filter mode, which changes the filter of the current page. */
	filter?: FilterModeSettings | false;
}

/**
 * The name of a mode of the edit screen.
 *
 * @useDeclaredType
 */
export type EditMode = keyof EditModes;

/** The settings of the filter mode. */
export interface FilterModeSettings {
	/**
	 * The filters that the mode offers, in the order that it shows them. A name given
	 * twice shows once, and an empty list removes the mode. For a page whose filter is
	 * not in the list, the mode opens with no filter marked.
	 *
	 * @defaultValue every {@link FilterName}
	 */
	available?: readonly FilterName[];
}

/**
 * The settings in effect, as the code reads them: each phase says what is on, and
 * nothing needs the shape the host application wrote. `written` keeps that shape
 * for `getSettings()`.
 */
export interface ResolvedSettings {
	readonly license: string;
	readonly resources: ResolvedResources;
	/** The element or selector the document scanner mounts into. */
	readonly container?: HTMLElement | string;
	readonly theme: ThemeLiterals;
	readonly strings: ResolvedStrings;
	/** Absent when nothing is encoded. That is the default. */
	readonly output?: OutputSettings;
	readonly maxPages: number | "unlimited";
	readonly phases: ResolvedPhases;
	/** The settings as a host application writes them, with every default filled in. */
	readonly written: DefaultSettings;
}

/** The resource locations in effect. */
export interface ResolvedResources {
	readonly captureVision: EngineResourcePaths;
	readonly documentViewer?: string;
}

/** What each phase does. */
export interface ResolvedPhases {
	readonly capture: ResolvedCaptureSettings;
	/** `null` while no way into the rectify screen is on. */
	readonly rectify: ResolvedRectifySettings | null;
	/** `null` while the edit phase is off. */
	readonly edit: ResolvedEditSettings | null;
}

/** The rectify phase, with each way into its screen. */
export interface ResolvedRectifySettings {
	readonly container?: HTMLElement | string;
	readonly layout: RectifyLayout;
	/** The after-capture mode's buttons, or `null` while the mode is off. */
	readonly afterCapture: ButtonSettingsFor<AfterCaptureButton> | null;
	/**
	 * The from-edit mode's buttons, or `null` while the mode is off, there is no edit
	 * phase, or the edit screen hides its rectify button.
	 */
	readonly fromEdit: ButtonSettingsFor<FromEditButton> | null;
}

/** The edit phase. */
export interface ResolvedEditSettings {
	readonly container?: HTMLElement | string;
	readonly layout: EditLayout;
	readonly buttons: ButtonSettingsFor<EditScreenButton>;
	readonly modeButtons: ButtonSettingsFor<EditModeButton>;
	/**
	 * The filters the filter mode offers, once each, in order. None while the mode or
	 * its button is off.
	 */
	readonly filters: readonly FilterName[];
}

/**
 * The default of every setting, in the shape a user writes them. Only `output` and
 * `container` may be absent, meaning encode nothing and use `document.body`.
 */
export type DefaultSettings = Required<Omit<ScannerSettings, "engines" | "output" | "container">> &
	Pick<ScannerSettings, "output" | "container">;

/** Build the defaults as a host application would write them, for the published file. */
export function defaultSettings(): DefaultSettings {
	return resolveSettings({}).written;
}

/** Whether a document of `pageCount` pages holds as many pages as `maxPages` allows. */
export function isDocumentFull(
	settings: Pick<ResolvedSettings, "maxPages">,
	pageCount: number,
): boolean {
	const { maxPages } = settings;
	return maxPages !== "unlimited" && pageCount >= maxPages;
}

/**
 * The host application's button settings for the screen of `phase` in `mode`, or
 * `undefined` when that phase or mode is off. Rectify always has a mode. An edit
 * mode takes the settings that every edit mode shares.
 */
export function buttonSettings(
	settings: ResolvedSettings,
	phase: PhaseName,
	mode?: RectifyMode | EditMode,
): ButtonsByName | undefined {
	const { capture, rectify, edit } = settings.phases;
	if (phase === "capture") return capture.buttons;
	if (phase === "edit") return mode === undefined ? edit?.buttons : edit?.modeButtons;
	if (mode !== "afterCapture" && mode !== "fromEdit") return undefined;
	return rectify?.[mode] ?? undefined;
}

/**
 * Lay the values that `given` names over `fallback`, key by key. A key given as
 * `undefined` or `null` keeps the fallback.
 */
function over<T extends object>(fallback: T, given: Readonly<Partial<T>> | undefined): Readonly<T> {
	const merged = { ...fallback };
	for (const [key, value] of Object.entries(given ?? {})) {
		if (value != null) (merged as Record<string, unknown>)[key] = value;
	}
	return Object.freeze(merged);
}

/**
 * Fill in every default, and work out what each phase does. An unknown key or a
 * wrong value throws a `TypeError` that names the setting.
 */
export function resolveSettings(settings: ScannerSettings): ResolvedSettings {
	checkSettings(settings);
	const { capture, rectify, edit } = settings.phases ?? {};
	const rectifyWritten = rectify === false ? false : writeRectify(rectify);
	const editWritten = edit === false ? false : writeEdit(edit);
	const written = Object.freeze({
		license: settings.license === LICENSE_PLACEHOLDER ? "" : (settings.license ?? ""),
		resources: Object.freeze({
			// Taken whole, since the engine reads keys that the defaults do not list.
			captureVision: settings.resources?.captureVision ?? { rootDirectory: DEFAULT_RESOURCE_ROOT },
			documentViewer: settings.resources?.documentViewer,
		}),
		container: settings.container,
		theme: over(DEFAULT_THEME, settings.theme),
		strings: Object.freeze({
			common: over(DEFAULT_STRINGS.common, settings.strings?.common),
			capture: over(DEFAULT_STRINGS.capture, settings.strings?.capture),
			rectify: over(DEFAULT_STRINGS.rectify, settings.strings?.rectify),
			edit: over(DEFAULT_STRINGS.edit, settings.strings?.edit),
		}),
		output: settings.output,
		maxPages: settings.maxPages ?? "unlimited",
		phases: Object.freeze({
			capture: Object.freeze({
				autoCapture: capture?.autoCapture ?? true,
				minStableFrames: capture?.minStableFrames ?? 2,
				waitForFraming: capture?.waitForFraming ?? true,
				layout: over<CaptureLayout>(
					{ header: undefined, viewfinder: undefined, footer: undefined },
					capture?.layout,
				),
				// Taken whole, as each button the host application names.
				buttons: capture?.buttons ?? {},
			}),
			rectify: rectifyWritten,
			edit: editWritten,
		}),
	}) satisfies DefaultSettings;
	const editOn = editWritten === false ? null : editWritten;
	const afterCapture = rectifyWritten === false ? false : rectifyWritten.modes.afterCapture;
	// The from-edit mode opens from the edit screen's rectify button, so it needs both.
	const fromEdit =
		rectifyWritten === false || editOn === null || editOn.buttons.rectify?.hidden === true
			? false
			: rectifyWritten.modes.fromEdit;
	const filter =
		editOn === null || editOn.buttons.filter?.hidden === true ? false : editOn.modes.filter;
	return Object.freeze({
		...written,
		phases: Object.freeze({
			capture: written.phases.capture,
			rectify:
				rectifyWritten === false || (afterCapture === false && fromEdit === false)
					? null
					: Object.freeze({
							container: rectifyWritten.container,
							layout: rectifyWritten.layout,
							afterCapture: afterCapture === false ? null : afterCapture.buttons,
							fromEdit: fromEdit === false ? null : fromEdit.buttons,
						}),
			edit:
				editOn === null
					? null
					: Object.freeze({
							container: editOn.container,
							layout: editOn.layout,
							buttons: editOn.buttons,
							modeButtons: editOn.modeButtons,
							filters: filter === false ? [] : Object.freeze([...new Set(filter.available)]),
						}),
		}),
		written,
	});
}

/** Fill in the rectify phase's defaults, in the shape a host application writes them. */
function writeRectify(given: RectifySettings | undefined) {
	const { afterCapture, fromEdit } = given?.modes ?? {};
	return Object.freeze({
		container: given?.container,
		modes: Object.freeze({ afterCapture: writeMode(afterCapture), fromEdit: writeMode(fromEdit) }),
		layout: over<RectifyLayout>({ header: undefined, footer: undefined }, given?.layout),
	});
}

/** Fill in a rectify mode's defaults. `false` turns the mode off. */
function writeMode<Button extends RectifyScreenButton>(
	given: RectifyModeSettings<Button> | false | undefined,
) {
	return given === false ? false : Object.freeze({ buttons: given?.buttons ?? {} });
}

/** Fill in the edit phase's defaults, in the shape a host application writes them. */
function writeEdit(given: EditSettings | undefined) {
	const filter = given?.modes?.filter;
	return Object.freeze({
		container: given?.container,
		buttons: given?.buttons ?? {},
		modes: Object.freeze({
			filter:
				filter === false ? false : Object.freeze({ available: filter?.available ?? FILTER_NAMES }),
		}),
		modeButtons: given?.modeButtons ?? {},
		layout: over<EditLayout>({ header: undefined, footer: undefined }, given?.layout),
	});
}

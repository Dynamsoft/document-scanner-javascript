import type { PhaseName } from "../results";
import type { EditMode, RectifyMode } from "./settings";

// The buttons of each screen, and the setting that lets the host application act on
// a press. Markup marks a button with its name in a `data-mds-button` attribute.

/**
 * The attribute that marks a button in a screen's markup. Its value is the
 * button's name on that screen, such as a `CaptureScreenButton`.
 */
export const BUTTON_ATTRIBUTE: string = "data-mds-button";

/**
 * The buttons of the capture screen. `strings.capture` holds the label and the
 * tooltip of each under the same name.
 */
export const CAPTURE_SCREEN_BUTTONS = [
	"cancel",
	"autoCapture",
	"torch",
	"cameraSwitcher",
	"shutter",
	"loadImage",
	"thumbnail",
] as const;

/**
 * A button of the capture screen.
 *
 * @useDeclaredType
 */
export type CaptureScreenButton = (typeof CAPTURE_SCREEN_BUTTONS)[number];

/** The buttons of the rectify screen, in the order they appear. */
export const RECTIFY_SCREEN_BUTTONS = [
	"apply",
	"retake",
	"cancel",
	"undo",
	"detectBoundary",
	"fullImage",
] as const;

/**
 * A button of the rectify screen.
 *
 * @useDeclaredType
 */
export type RectifyScreenButton = (typeof RECTIFY_SCREEN_BUTTONS)[number];

/** The rectify buttons after a capture, where retake shows and cancel does not. */
export type AfterCaptureButton = Exclude<RectifyScreenButton, "cancel">;

/** The rectify buttons from the edit screen, where cancel shows and retake does not. */
export type FromEditButton = Exclude<RectifyScreenButton, "retake">;

/** The buttons of the edit screen, in the order they appear. */
export const EDIT_SCREEN_BUTTONS = [
	"cancel",
	"addPage",
	"done",
	"thumbnails",
	"previousPage",
	"nextPage",
	"delete",
	"undo",
	"redo",
	"rectify",
	"rotate",
	"filter",
] as const;

/**
 * A button of the edit screen.
 *
 * @useDeclaredType
 */
export type EditScreenButton = (typeof EDIT_SCREEN_BUTTONS)[number];

/** The buttons that close a mode of the edit screen, which every mode shares. */
export const EDIT_MODE_BUTTONS = ["cancel", "apply"] as const;

/**
 * A button that closes a mode of the edit screen.
 *
 * @useDeclaredType
 */
export type EditModeButton = (typeof EDIT_MODE_BUTTONS)[number];

/**
 * The event that the {@link ButtonSettings.onClick | onClick} handler of a button
 * gets. It works like the DOM event that it replaces, with one difference. The
 * document scanner waits for the handler before it acts, so `preventDefault()`
 * still works after an `await`.
 */
export interface ButtonEvent<Button extends string = string> {
	/** The name of the button that the user pressed. */
	readonly button: Button;
	/** The phase of the screen that shows the button. */
	readonly phase: PhaseName;
	/** The mode that the screen shows, if it shows one. */
	readonly mode?: RectifyMode | EditMode;
	/** Stop the default action of the button. */
	preventDefault(): void;
	/** Whether the handler called `preventDefault()`. */
	readonly defaultPrevented: boolean;
}

/** The settings of one button. */
export interface ButtonSettings<Button extends string = string> {
	/**
	 * Whether the screen hides the button. A hidden toggle, such as `autoCapture`,
	 * keeps the value that the settings give it, so the user cannot change it. If the
	 * host application hides a way out of a screen, such as cancel, it must give the
	 * user another way out. If the host application hides the rectify button of the
	 * edit screen, the `fromEdit` mode of the rectify screen turns off. If it hides
	 * the filter button, the filter mode turns off.
	 *
	 * @defaultValue `false`
	 */
	hidden?: boolean;
	/**
	 * The handler that runs before the default action of the button. The default
	 * action then runs, unless the handler called
	 * {@link ButtonEvent.preventDefault | preventDefault()}. While the handler and the
	 * default action run, other presses do nothing. Only the cancel button of the
	 * capture screen still works. If the handler throws or its promise rejects, the
	 * document scanner reports the error to the console. The default action then
	 * runs, unless the handler called `preventDefault()` before the error.
	 */
	onClick?: (event: ButtonEvent<Button>) => void | Promise<void>;
}

/**
 * A screen's button settings, read by button name. Each handler takes the event of
 * its own button, so this type fits every screen's settings.
 */
export type ButtonsByName = {
	readonly [button: string]: Readonly<ButtonSettings<never>> | undefined;
};

/** The settings of some buttons of a screen, by the name of each button. */
export type ButtonSettingsFor<Button extends string> = {
	readonly [Name in Button]?: ButtonSettings<Name>;
};

/** Which of a screen's buttons the host application's settings hide, by name. */
export type HiddenByName<Button extends string> =
	| { readonly [Name in Button]?: Pick<ButtonSettings, "hidden"> }
	| undefined;

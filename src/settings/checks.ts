import {
	CAPTURE_SCREEN_BUTTONS,
	EDIT_MODE_BUTTONS,
	EDIT_SCREEN_BUTTONS,
	RECTIFY_SCREEN_BUTTONS,
} from "./buttons";
import { FILTER_NAMES } from "./filters";
import type { ButtonSettings } from "./buttons";
import type {
	CaptureLayout,
	CaptureSettings,
	EditLayout,
	EditModes,
	EditSettings,
	EngineSettings,
	FilterModeSettings,
	OutputSettings,
	PhaseSettings,
	RectifyLayout,
	RectifyModeSettings,
	RectifyModes,
	RectifySettings,
	ResourceSettings,
	ScannerSettings,
} from "./settings";
import { DEFAULT_STRINGS } from "./strings";
import type { StringSettings } from "./strings";
import { THEME_TOKENS } from "./theme";

// The check of the settings a host application passes. A key the document scanner
// does not know, or a value of the wrong kind, throws a `TypeError` that names the
// setting, so that a typo does not pass unnoticed. A key given as `undefined` or
// `null` keeps its default.

/** A check of one setting's value at `path`, which throws when the value is wrong. */
type Check = (value: unknown, path: string) => void;

/** Throw for the setting at `path`, which must be `expected`. */
function refuse(path: string, expected: string): never {
	throw new TypeError(
		path ? `The setting ${path} must be ${expected}` : `The settings must be ${expected}`,
	);
}

/** A check that the value is what `test` accepts, described as `expected`. */
const kind =
	(expected: string, test: (value: unknown) => boolean): Check =>
	(value, path) => {
		if (!test(value)) refuse(path, expected);
	};

const text = kind("a string", (value) => typeof value === "string");
const flag = kind("true or false", (value) => typeof value === "boolean");
const handler = kind("a function", (value) => typeof value === "function");
const anyObject = kind("an object", (value) => typeof value === "object");
const template = kind("a template element", (value) => value instanceof HTMLTemplateElement);
const elementOrSelector = kind(
	"an element or a selector",
	(value) => value instanceof HTMLElement || typeof value === "string",
);
const fraction = kind(
	"a number from 0 to 1",
	(value) => typeof value === "number" && value >= 0 && value <= 1,
);

/** A check that the value is a whole number of at least 1. */
const count = kind(
	"a whole number of at least 1",
	(value) => Number.isInteger(value) && (value as number) >= 1,
);

/** A check that the value is `false`, or else passes `check`. */
const orFalse =
	(check: Check): Check =>
	(value, path) => {
		if (value !== false) check(value, path);
	};

/** A check that the value is one of `values`. */
const oneOf = (values: readonly string[]): Check =>
	kind(`one of ${values.map((value) => JSON.stringify(value)).join(", ")}`, (value) =>
		values.includes(value as string),
	);

/** A check that the value is a list whose every item passes `check`. */
const list =
	(check: Check): Check =>
	(value, path) => {
		if (!Array.isArray(value)) refuse(path, "a list");
		value.forEach((item, index) => check(item, `${path}[${index}]`));
	};

/** Every key of `Settings`, also of each member when it is a union. */
type Keys<Settings> = Settings extends unknown ? keyof Settings : never;

/**
 * One check for each key of `Settings`. The type checker then finds a key that the
 * checks miss or add, so the types stay the one source of the settings' keys.
 */
type Shape<Settings> = { readonly [Key in Keys<Settings>]-?: Check };

/**
 * A check that the value is a group of `Settings`, whose keys are all in `shape`,
 * each passing its own check.
 */
const group = <Settings>(shape: Shape<Settings>): Check =>
	keyed(shape as Readonly<Record<string, Check>>);

/**
 * A check that the value is a group whose keys are all in `shape`, each passing its
 * own check.
 */
const keyed =
	(shape: Readonly<Record<string, Check>>): Check =>
	(value, path) => {
		if (typeof value !== "object" || value === null) refuse(path, "an object");
		for (const [key, item] of Object.entries(value)) {
			const at = path ? `${path}.${key}` : key;
			// Checked as an own key, since a name such as `constructor` is on every object.
			if (!Object.hasOwn(shape, key)) throw new TypeError(`Unknown setting ${at}`);
			if (item != null) shape[key]!(item, at);
		}
	};

/** A check that every key of a group is one of `keys`, each passing `check`. */
const each = (keys: readonly string[], check: Check): Check =>
	keyed(Object.fromEntries(keys.map((key) => [key, check])));

/** `names` without `left`. */
const without = (names: readonly string[], left: string): readonly string[] =>
	names.filter((name) => name !== left);

/** The settings of the buttons named in `names`. */
const buttons = (names: readonly string[]): Check =>
	each(names, group<ButtonSettings>({ hidden: flag, onClick: handler }));

/** The encoded output: its format, and the encoding of each image. */
const output: Check = (value, path) => {
	group<OutputSettings>({
		format: oneOf(["pdf", "tiff", "images"]),
		encoding: oneOf(["png", "jpeg"]),
		quality: fraction,
	})(value, path);
	if ((value as { format?: unknown }).format == null) refuse(`${path}.format`, "given");
};

/** A header or a footer: a template, or `false` to leave it out. */
const bar = orFalse(template);

/** The buttons of a rectify mode, which are every rectify button but `left`. */
const rectifyMode = (left: string): Check =>
	orFalse(group<RectifyModeSettings>({ buttons: buttons(without(RECTIFY_SCREEN_BUTTONS, left)) }));

/** The check of every setting. */
const SETTINGS: Check = group<ScannerSettings>({
	license: text,
	resources: group<ResourceSettings>({ captureVision: anyObject, documentViewer: text }),
	engines: group<EngineSettings>({ captureVision: anyObject, documentViewer: anyObject }),
	container: elementOrSelector,
	theme: each(THEME_TOKENS, text),
	strings: group<StringSettings>({
		common: each(Object.keys(DEFAULT_STRINGS.common), text),
		capture: each(Object.keys(DEFAULT_STRINGS.capture), text),
		rectify: each(Object.keys(DEFAULT_STRINGS.rectify), text),
		edit: each(Object.keys(DEFAULT_STRINGS.edit), text),
	}),
	output,
	maxPages: (value, path) => {
		if (value !== "unlimited") count(value, path);
	},
	phases: group<PhaseSettings>({
		capture: group<CaptureSettings>({
			autoCapture: flag,
			minStableFrames: count,
			waitForFraming: flag,
			layout: group<CaptureLayout>({ header: bar, viewfinder: template, footer: bar }),
			buttons: buttons(CAPTURE_SCREEN_BUTTONS),
		}),
		rectify: orFalse(
			group<RectifySettings>({
				container: elementOrSelector,
				modes: group<RectifyModes>({
					afterCapture: rectifyMode("cancel"),
					fromEdit: rectifyMode("retake"),
				}),
				layout: group<RectifyLayout>({ header: bar, footer: bar }),
			}),
		),
		edit: orFalse(
			group<EditSettings>({
				container: elementOrSelector,
				buttons: buttons(EDIT_SCREEN_BUTTONS),
				modes: group<EditModes>({
					filter: orFalse(group<FilterModeSettings>({ available: list(oneOf(FILTER_NAMES)) })),
				}),
				modeButtons: buttons(EDIT_MODE_BUTTONS),
				layout: group<EditLayout>({ header: bar, footer: bar }),
			}),
		),
	}),
});

/** Throw a `TypeError` that names the first unknown key or wrong value in `settings`. */
export function checkSettings(settings: unknown): void {
	SETTINGS(settings, "");
}

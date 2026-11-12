import { describe, expect, it } from "vite-plus/test";
import { DEFAULT_STRINGS } from "./strings";
import { DEFAULT_THEME } from "./theme";
import { buttonSettings, defaultSettings, resolveSettings } from "./settings";
import { FILTER_NAMES } from "./filters";
import type { ScannerSettings } from "./settings";

/** The filters that the filter mode offers under `settings`. */
const filtersOf = (settings: ScannerSettings) => resolveSettings(settings).phases.edit?.filters;

describe("buttonSettings()", () => {
	const onClick = () => undefined;

	it("gives the buttons of each phase and of each rectify mode", () => {
		const settings = resolveSettings({
			phases: {
				capture: { buttons: { shutter: { onClick } } },
				rectify: {
					modes: {
						afterCapture: { buttons: { retake: { onClick } } },
						fromEdit: { buttons: { cancel: { onClick } } },
					},
				},
				edit: { buttons: { done: { onClick } } },
			},
		});
		expect(buttonSettings(settings, "capture")).toEqual({ shutter: { onClick } });
		expect(buttonSettings(settings, "edit")).toEqual({ done: { onClick } });
		expect(buttonSettings(settings, "rectify", "afterCapture")).toEqual({ retake: { onClick } });
		expect(buttonSettings(settings, "rectify", "fromEdit")).toEqual({ cancel: { onClick } });
	});

	it("gives the edit modes' shared buttons while a mode of the edit screen shows", () => {
		const settings = resolveSettings({
			phases: { edit: { buttons: { done: { onClick } }, modeButtons: { apply: { onClick } } } },
		});
		expect(buttonSettings(settings, "edit", "filter")).toEqual({ apply: { onClick } });
	});

	it("gives no buttons where no phase or mode applies", () => {
		const off = resolveSettings({
			phases: { rectify: { modes: { afterCapture: false } }, edit: false },
		});
		expect(buttonSettings(off, "edit")).toBeUndefined();
		expect(buttonSettings(off, "rectify", "afterCapture")).toBeUndefined();
		expect(buttonSettings(off, "rectify")).toBeUndefined();
		expect(
			buttonSettings(resolveSettings({ phases: { rectify: false } }), "rectify", "fromEdit"),
		).toBeUndefined();
	});
});

describe("the filters on offer", () => {
	it("are every filter by default", () => {
		expect(filtersOf({})).toEqual(FILTER_NAMES);
	});

	it("are the filters named, once each, in the order of their first mention", () => {
		const named = {
			phases: { edit: { modes: { filter: { available: ["gray", "none", "gray"] } } } },
		} as const;
		expect(filtersOf(named)).toEqual(["gray", "none"]);
	});

	it("are none when the filter mode or its button is off", () => {
		const off = [
			{ phases: { edit: { modes: { filter: false } } } },
			{ phases: { edit: { modes: { filter: { available: [] } } } } },
			{ phases: { edit: { buttons: { filter: { hidden: true } } } } },
		] as const;
		expect(off.map(filtersOf)).toEqual([[], [], []]);
	});
});

describe("the ways into the rectify screen", () => {
	it("leave out the from-edit mode when the edit screen hides its rectify button", () => {
		const { rectify } = resolveSettings({
			phases: { edit: { buttons: { rectify: { hidden: true } } } },
		}).phases;
		expect([rectify?.afterCapture, rectify?.fromEdit]).toEqual([{}, null]);
	});

	it("leave the phase off when no mode is on", () => {
		const settings = {
			phases: { rectify: { modes: { afterCapture: false, fromEdit: false } } },
		} as const;
		expect(resolveSettings(settings).phases.rectify).toBeNull();
	});
});

describe("defaultSettings()", () => {
	it("resolves to the same settings as none at all", () => {
		expect(resolveSettings(defaultSettings())).toEqual(resolveSettings({}));
	});
});

describe("resolveSettings()", () => {
	it("fills in every setting left out with its default", () => {
		const settings = resolveSettings({});
		expect(settings.license).toBe("");
		expect(settings.output).toBeUndefined();
		expect(settings.theme).toEqual(DEFAULT_THEME);
		expect(settings.strings).toEqual(DEFAULT_STRINGS);
		expect(settings.phases.capture.autoCapture).toBe(true);
		expect(settings.phases.capture.waitForFraming).toBe(true);
	});

	it("takes the host application's value key by key and keeps the defaults beside it", () => {
		const settings = resolveSettings({
			theme: { primary: "#000000" },
			strings: { capture: { shutter: "Snap" } },
			phases: { capture: { autoCapture: false } },
		});
		expect(settings.theme.primary).toBe("#000000");
		expect(settings.theme.background).toBe(DEFAULT_THEME.background);
		expect(settings.strings.capture.shutter).toBe("Snap");
		expect(settings.strings.capture.torch).toBe(DEFAULT_STRINGS.capture.torch);
		expect(settings.phases.capture.autoCapture).toBe(false);
		expect(settings.phases.capture.minStableFrames).toBeGreaterThan(0);
	});

	it("keeps the default for a setting passed as undefined", () => {
		const settings = resolveSettings({
			license: undefined,
			theme: { primary: undefined },
			phases: { capture: { autoCapture: undefined } },
		});
		expect(settings.license).toBe("");
		expect(settings.theme.primary).toBe(DEFAULT_THEME.primary);
		expect(settings.phases.capture.autoCapture).toBe(true);
	});

	it("takes the placeholder key of the samples as no key", () => {
		expect(resolveSettings({ license: "YOUR_LICENSE_KEY_HERE" }).license).toBe("");
		expect(resolveSettings({ license: "a-real-key" }).license).toBe("a-real-key");
	});

	it("keeps every default in a group or phase passed as undefined, and leaves the phase on", () => {
		const settings = resolveSettings({ strings: undefined, phases: { rectify: undefined } });
		expect(settings.strings).toEqual(DEFAULT_STRINGS);
		expect(settings.phases.rectify).toEqual(resolveSettings({}).phases.rectify);
	});

	it("turns a phase off with false", () => {
		const settings = resolveSettings({ phases: { rectify: false, edit: false } });
		expect([settings.phases.rectify, settings.phases.edit]).toEqual([null, null]);
		expect(settings.written.phases.rectify).toBe(false);
	});

	it("takes the global container whole, as an element or a selector, and leaves it absent by default", () => {
		const element = document.createElement("div");
		expect(resolveSettings({ container: element }).container).toBe(element);
		expect(resolveSettings({ container: "#app" }).container).toBe("#app");
		expect(resolveSettings({}).container).toBeUndefined();
	});

	it("passes Capture Vision's resource map through whole, as given", () => {
		const captureVision = { rootDirectory: "/engines/", dcvBundle: "/bundle/" };
		expect(resolveSettings({ resources: { captureVision } }).resources.captureVision).toBe(
			captureVision,
		);
	});

	it("keeps false and templates in the capture layout as given", () => {
		const footer = document.createElement("template");
		const settings = resolveSettings({
			phases: { capture: { layout: { header: false, footer } } },
		});
		const { layout } = settings.phases.capture;
		expect([layout.header, layout.viewfinder, layout.footer]).toEqual([false, undefined, footer]);
		expect(layout.footer).toBe(footer);
	});

	it("gives each document scanner a default resource map of its own", () => {
		expect(resolveSettings({}).resources.captureVision).not.toBe(
			resolveSettings({}).resources.captureVision,
		);
	});
});

import { describe, expect, it } from "vite-plus/test";
import { checkSettings } from "./checks";
import { defaultSettings } from "./settings";

describe("checkSettings()", () => {
	it.each([
		[{ licence: "KEY" }, "Unknown setting licence"],
		[{ phases: { capture: { autoCaptur: false } } }, "Unknown setting phases.capture.autoCaptur"],
		[{ strings: { capture: { shuter: "Snap" } } }, "Unknown setting strings.capture.shuter"],
		[
			{ phases: { rectify: { modes: { afterCapture: { buttons: { cancel: {} } } } } } },
			"Unknown setting phases.rectify.modes.afterCapture.buttons.cancel",
		],
		["settings", "The settings must be an object"],
		[{ license: 1 }, "The setting license must be a string"],
		[{ maxPages: 0 }, "The setting maxPages must be a whole number of at least 1"],
		[{ maxPages: 1.5 }, "The setting maxPages must be a whole number of at least 1"],
		[{ container: 1 }, "The setting container must be an element or a selector"],
		[
			{ resources: { captureVision: "/" } },
			"The setting resources.captureVision must be an object",
		],
		[
			{ phases: { capture: { autoCapture: "no" } } },
			"The setting phases.capture.autoCapture must be true or false",
		],
		[
			{ phases: { capture: { layout: { viewfinder: false } } } },
			"The setting phases.capture.layout.viewfinder must be a template element",
		],
		[
			{ phases: { edit: { buttons: { done: { onClick: "finish" } } } } },
			"The setting phases.edit.buttons.done.onClick must be a function",
		],
		[
			{ phases: { edit: { modes: { filter: { available: "gray" } } } } },
			"The setting phases.edit.modes.filter.available must be a list",
		],
		[
			{ phases: { edit: { modes: { filter: { available: ["grey"] } } } } },
			"The setting phases.edit.modes.filter.available[0] must be one of",
		],
		[{ output: {} }, "The setting output.format must be given"],
		[
			{ output: { format: "images", encoding: "jpeg", quality: 80 } },
			"The setting output.quality must be a number from 0 to 1",
		],
	])("refuses %j", (settings, error) => {
		expect(() => checkSettings(settings)).toThrow(error);
	});

	it("takes every default as written, and a key given as null or undefined", () => {
		expect(() => checkSettings(defaultSettings())).not.toThrow();
		expect(() =>
			checkSettings({ maxPages: "unlimited", theme: { primary: null }, output: undefined }),
		).not.toThrow();
	});
});

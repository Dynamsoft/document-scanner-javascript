import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { ScannerError } from "../faults";
import { Events } from "./events";

/** A failure to report. */
const FAILURE: ScannerError = { kind: "internal", message: "broken" };

afterEach(() => {
	vi.restoreAllMocks();
});

describe("Events", () => {
	it("calls each listener of an event with its payload, until it is stopped", async () => {
		const events = new Events();
		const heard: string[] = [];
		const stop = events.on("error", ({ message }) => void heard.push(`first ${message}`));
		events.on("error", ({ message }) => void heard.push(`second ${message}`));
		await events.emit("error", FAILURE);
		stop();
		await events.emit("error", FAILURE);
		expect(heard).toEqual(["first broken", "second broken", "second broken"]);
		// An event that nobody listens to settles at once.
		await expect(new Events().emit("error", FAILURE)).resolves.toBeUndefined();
	});

	it("awaits each listener, and reports one that fails without stopping the others", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const events = new Events();
		let settled = false;
		events.on("error", async () => Promise.reject(new Error("listener bug")));
		events.on("error", async () => {
			await new Promise((resolve) => setTimeout(resolve));
			settled = true;
		});
		await events.emit("error", FAILURE);
		expect(settled).toBe(true);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("error event"), expect.any(Error));
	});

	it("refuses an event it does not have", () => {
		expect(() => new Events().on("finished" as "done", () => undefined)).toThrow(
			"Unknown event finished",
		);
	});
});

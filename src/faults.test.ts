import { describe, expect, it, vi } from "vite-plus/test";
import {
	ScannerFault,
	describe as describeThrown,
	reportFault,
	reportWarning,
	toScannerError,
} from "./faults";

describe("toScannerError", () => {
	it("hands back the error a fault carries", () => {
		const error = {
			kind: "license",
			message: "The license has expired.",
			reason: "expired",
		} as const;
		const fault = new ScannerFault(error, new Error("cause"));
		expect(toScannerError(fault)).toEqual(error);
		expect(fault.cause).toBeInstanceOf(Error);
	});

	it("reports anything else as internal, with its message", () => {
		expect(toScannerError(new Error("boom"))).toEqual({ kind: "internal", message: "boom" });
		expect(toScannerError("text")).toEqual({ kind: "internal", message: "text" });
	});
});

describe("describe", () => {
	it("gives an error's message and the string form of anything else", () => {
		expect(describeThrown(new TypeError("bad"))).toBe("bad");
		expect(describeThrown(42)).toBe("42");
	});
});

describe("reportFault", () => {
	it("warns on the console with what failed and why, passing the error along", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const error = new Error("no camera");
		reportFault("this page could not be captured", error);
		expect(warn).toHaveBeenCalledWith(
			"Mobile Document Scanner: this page could not be captured. no camera",
			error,
		);
		warn.mockRestore();
	});
});

describe("reportWarning", () => {
	it("warns on the console with the risk", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		reportWarning("another copy of Capture Vision loaded first");
		expect(warn).toHaveBeenCalledWith(
			"Mobile Document Scanner: another copy of Capture Vision loaded first.",
		);
		warn.mockRestore();
	});
});

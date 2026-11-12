import { describe, expect, it } from "vite-plus/test";
import { defaultSettings } from "../settings/settings";
import { DEFAULT_THEME } from "../settings/theme";
import { ScannerStateError } from "../faults";
import { DocumentScanner } from "./document-scanner";

describe("getSettings", () => {
	it("gives the settings in effect as a host application writes them, with every default filled in", () => {
		const settings = new DocumentScanner({ theme: { primary: "#000000" } }).getSettings();
		expect(settings).toEqual({
			...defaultSettings(),
			theme: { ...DEFAULT_THEME, primary: "#000000" },
		});
	});

	it("leaves out the engine modules, and freezes what it returns", () => {
		const settings = new DocumentScanner({ engines: {} }).getSettings();
		expect(settings).not.toHaveProperty("engines");
		expect(Object.isFrozen(settings)).toBe(true);
		expect(Object.isFrozen(settings.phases)).toBe(true);
	});
});

describe("finish", () => {
	it("resolves false with no session running", async () => {
		expect(await new DocumentScanner({}).finish()).toBe(false);
	});
});

describe("reset", () => {
	it("does nothing before the engines load", () => {
		expect(() => new DocumentScanner({}).reset()).not.toThrow();
	});
});

describe("misuse", () => {
	it("refuses to start work once the document scanner is disposed", async () => {
		const scanner = new DocumentScanner({});
		scanner.dispose();
		const disposed = { name: "InvalidStateError", reason: "disposed" };
		await expect(scanner.preload()).rejects.toMatchObject(disposed);
		await expect(scanner.scan()).rejects.toMatchObject(disposed);
		expect(() => scanner.reset()).toThrow(ScannerStateError);
	});

	it("refuses a file that is not a Blob", async () => {
		const scanner = new DocumentScanner({});
		await expect(scanner.scan("page.png" as unknown as Blob)).rejects.toThrow(TypeError);
		scanner.dispose();
	});
});

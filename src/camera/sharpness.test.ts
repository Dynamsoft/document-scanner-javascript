import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { sharpPage, softened } from "../../tests/drawn-pages";
import { encodeCanvas } from "../document/images";
import { keepsDetail, sharpness } from "./sharpness";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("sharpness", () => {
	it("says so when the browser gives no 2d drawing context", async () => {
		const page = sharpPage(480);
		vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
		await expect(sharpness(page)).rejects.toThrow("no 2d canvas context");
	});

	it("scores a page well above the same page out of focus", async () => {
		const page = sharpPage(1920);
		expect(await sharpness(page)).toBeGreaterThan((await sharpness(softened(page))) * 4);
	});

	it("scores the same page about the same at twice the size", async () => {
		const small = await sharpness(sharpPage(1920));
		const large = await sharpness(sharpPage(3840));
		expect(large).toBeGreaterThan(small * 0.75);
		expect(large).toBeLessThan(small * 1.25);
	});

	it("loses less than a quarter of the score to JPEG encoding", async () => {
		const page = sharpPage(1920);
		const encoded = await sharpness(await encodeCanvas(page, "image/jpeg", 0.92));
		expect(encoded).toBeGreaterThan((await sharpness(page)) * 0.75);
	});
});

describe("keepsDetail", () => {
	it("keeps a photograph as sharp as the frame", async () => {
		const photograph = await encodeCanvas(sharpPage(3840), "image/jpeg", 0.92);
		expect(await keepsDetail(photograph, sharpPage(1920))).toBe(true);
	});

	it("refuses a photograph softer than the frame", async () => {
		const photograph = await encodeCanvas(softened(sharpPage(3840)), "image/jpeg", 0.92);
		expect(await keepsDetail(photograph, sharpPage(1920))).toBe(false);
	});

	it("rejects a photograph that is not an image", async () => {
		await expect(keepsDetail(new Blob(["not an image"]), sharpPage(1920))).rejects.toThrow();
	});
});

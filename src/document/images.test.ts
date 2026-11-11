import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { drawImage, encodeCanvas, imageSize, originalFromFile } from "./images";

/** Make a blank PNG of the given size. */
function png(width: number, height: number): Promise<Blob> {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return encodeCanvas(canvas, "image/png");
}

/**
 * Make a JPEG of the given size whose EXIF data says to turn it a quarter turn
 * clockwise to show it, as a phone's camera writes a portrait photograph.
 */
async function sidewaysJpeg(width: number, height: number): Promise<Blob> {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const jpeg = new Uint8Array(await (await encodeCanvas(canvas, "image/jpeg")).arrayBuffer());
	// An APP1 segment: "Exif", a big-endian TIFF header, and one entry, Orientation = 6.
	const exif = [
		0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00,
		0x00, 0x08, 0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
	];
	// After the JFIF segment, when the browser wrote one, which must come first.
	const at = jpeg[3] === 0xe0 ? 4 + ((jpeg[4]! << 8) | jpeg[5]!) : 2;
	return new Blob([jpeg.slice(0, at), new Uint8Array(exif), jpeg.slice(at)], {
		type: "image/jpeg",
	});
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("images", () => {
	it("measures an encoded image in pixels", async () => {
		expect(await imageSize(await png(30, 20))).toEqual({ width: 30, height: 20 });
	});

	it("draws an image scaled, rounding to whole pixels and never below one", async () => {
		const blob = await png(30, 21);
		const half = await drawImage(blob, 0.5);
		expect([half.width, half.height]).toEqual([15, 11]);
		const tiny = await drawImage(blob, 0.001);
		expect([tiny.width, tiny.height]).toEqual([1, 1]);
	});

	it("says so when the browser gives no 2d drawing context", async () => {
		const blob = await png(4, 4);
		vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
		await expect(drawImage(blob, 1)).rejects.toThrow("no 2d canvas context");
	});

	it("encodes a canvas in the format asked for", async () => {
		const canvas = await drawImage(await png(8, 8), 1);
		expect((await encodeCanvas(canvas, "image/jpeg", 0.9)).type).toBe("image/jpeg");
	});

	it("turns an image file into a JPEG original of the same size", async () => {
		const original = await originalFromFile(await png(30, 20));
		expect(original.type).toBe("image/jpeg");
		expect(await imageSize(original)).toEqual({ width: 30, height: 20 });
	});

	it("stands an original upright as the file's orientation says", async () => {
		expect(await imageSize(await originalFromFile(await sidewaysJpeg(40, 20)))).toEqual({
			width: 20,
			height: 40,
		});
	});

	it("shrinks an original larger than the largest canvas to the same shape", async () => {
		const { width, height } = await imageSize(await originalFromFile(await png(8192, 2100)));
		expect(width * height).toBeLessThanOrEqual(4096 * 4096);
		expect(width / height).toBeCloseTo(8192 / 2100, 2);
	});

	it("rejects a file that the browser cannot open as an image", async () => {
		await expect(
			originalFromFile(new Blob(["not an image"], { type: "image/png" })),
		).rejects.toThrow();
	});

	it("names the format when the browser cannot encode it", async () => {
		const refusing = document.createElement("canvas");
		vi.spyOn(refusing, "toBlob").mockImplementation((done) => done(null));
		await expect(encodeCanvas(refusing, "image/webp")).rejects.toThrow("image/webp");
	});
});

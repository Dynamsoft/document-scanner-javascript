import { describe, expect, it, vi } from "vite-plus/test";
import type { Point, Quadrilateral } from "../results";
import { PAGE_QUALITY } from "./images";
import { rectifyImage } from "./rectification";
import type { EngineRectification } from "./rectification";

const BOUNDARY: Quadrilateral = {
	points: [
		{ x: 300, y: 200 },
		{ x: 1300, y: 260 },
		{ x: 1250, y: 1000 },
		{ x: 350, y: 950 },
	],
};

/** The image the fake engine hands from one call to the other. */
interface FakeImage {
	readonly rectified: true;
}

/** A fake engine that returns a fixed image and records its calls. */
function fakeEngine(canvas: HTMLCanvasElement) {
	const rectified: FakeImage = { rectified: true };
	const cropAndDeskewImage = vi.fn(
		async (_image: Blob, _roi: { points: [Point, Point, Point, Point] }) => rectified,
	);
	const toCanvas = vi.fn((_image: FakeImage) => canvas);
	const engine = {
		ImageProcessor: { cropAndDeskewImage },
		_toCanvas: toCanvas,
	} satisfies EngineRectification<FakeImage>;
	return { engine, rectified, cropAndDeskewImage, toCanvas };
}

describe("rectifyImage", () => {
	it("rectifies the original to its corners as a JPEG page", async () => {
		const canvas = document.createElement("canvas");
		const encode = vi.spyOn(canvas, "toBlob");
		const { engine, rectified, cropAndDeskewImage, toCanvas } = fakeEngine(canvas);
		const original = new Blob(["photo"], { type: "image/jpeg" });

		const page = await rectifyImage(engine, original, BOUNDARY);

		expect(cropAndDeskewImage).toHaveBeenCalledWith(original, { points: BOUNDARY.points });
		expect(toCanvas.mock.calls[0]?.[0]).toBe(rectified);
		expect(encode).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", PAGE_QUALITY);
		expect(page.type).toBe("image/jpeg");
	});
});

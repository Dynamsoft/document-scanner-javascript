import { describe, expect, it } from "vite-plus/test";
import { sharpPage, softened } from "../../tests/drawn-pages";
import type { Quadrilateral } from "../results";
import { encodeCanvas } from "../document/images";
import { chooseOriginal } from "./original";

// Choosing between the frame and the photograph taken for a page.

/** A page boundary in a 1280 by 720 frame. */
const IN_FRAME: Quadrilateral = {
	points: [
		{ x: 200, y: 100 },
		{ x: 1080, y: 110 },
		{ x: 1070, y: 620 },
		{ x: 210, y: 610 },
	],
};

/** Scale a boundary by `factor`. */
function scaled({ points }: Quadrilateral, factor: number): Quadrilateral {
	const [a, b, c, d] = points.map(({ x, y }) => ({ x: x * factor, y: y * factor }));
	return { points: [a!, b!, c!, d!] };
}

/**
 * A boundary with its first corner moved out near the top-left corner of the
 * image.
 */
function withFirstCornerAtOrigin(boundary: Quadrilateral): Quadrilateral {
	const [, second, third, fourth] = boundary.points;
	return { points: [{ x: 20, y: 20 }, second, third, fourth] };
}

/** Find `onPhoto` on the photograph, and `onFrame` on every other image. */
function pages(
	photograph: Blob | null,
	onPhoto: Quadrilateral | null,
	onFrame: Quadrilateral | null,
) {
	return async (image: Blob) => (image === photograph ? onPhoto : onFrame);
}

/**
 * A sharp 1280 by 720 frame, and a photograph of the same page, twice its size or
 * `size`, and blurred when `soft`.
 */
async function take({ size = { width: 2560, height: 1440 }, soft = false } = {}) {
	const drawn = sharpPage(size.width, size.height);
	const photograph = await encodeCanvas(soft ? softened(drawn) : drawn, "image/jpeg", 0.92);
	return { frame: sharpPage(1280, 720), photograph };
}

describe("chooseOriginal", () => {
	it("keeps the photograph, with its boundary, where it marks the page the frame shows", async () => {
		const captured = await take();
		const onPhoto = scaled(IN_FRAME, 2);
		const original = await chooseOriginal(captured, pages(captured.photograph, onPhoto, IN_FRAME));
		expect(original).toEqual({ image: captured.photograph, boundary: onPhoto });
	});

	it("keeps the frame, with its boundary, where no page is found on the photograph", async () => {
		const captured = await take();
		const original = await chooseOriginal(captured, pages(captured.photograph, null, IN_FRAME));
		expect([original.image === captured.photograph, original.boundary]).toEqual([false, IN_FRAME]);
	});

	it("keeps the frame, with its boundary, where the photograph's boundary marks another edge", async () => {
		const captured = await take();
		// The edge of a table, around the page.
		const table = withFirstCornerAtOrigin(scaled(IN_FRAME, 2));
		const original = await chooseOriginal(captured, pages(captured.photograph, table, IN_FRAME));
		expect([original.image === captured.photograph, original.boundary]).toEqual([false, IN_FRAME]);
	});

	it("keeps the photograph, with its boundary, where no page is found on the frame", async () => {
		const captured = await take();
		const onPhoto = scaled(IN_FRAME, 2);
		const original = await chooseOriginal(captured, pages(captured.photograph, onPhoto, null));
		expect(original).toEqual({ image: captured.photograph, boundary: onPhoto });
	});

	it("keeps the photograph, with its boundary unchecked, where its aspect ratio differs from the frame's", async () => {
		// A 4:3 photograph frames more of the scene than a 16:9 frame, so the corners
		// differ.
		const captured = await take({ size: { width: 2560, height: 1920 } });
		const onPhoto = withFirstCornerAtOrigin(scaled(IN_FRAME, 2));
		const original = await chooseOriginal(captured, pages(captured.photograph, onPhoto, IN_FRAME));
		expect(original).toEqual({ image: captured.photograph, boundary: onPhoto });
	});

	it("keeps the frame, with its boundary, where the photograph came out softer, even with the page on it", async () => {
		const captured = await take({ soft: true });
		const original = await chooseOriginal(
			captured,
			pages(captured.photograph, scaled(IN_FRAME, 2), IN_FRAME),
		);
		expect([original.image === captured.photograph, original.boundary]).toEqual([false, IN_FRAME]);
	});

	it("keeps the frame where the photograph is not an image", async () => {
		const captured = { frame: sharpPage(1280, 720), photograph: new Blob(["not an image"]) };
		const original = await chooseOriginal(captured, pages(captured.photograph, IN_FRAME, IN_FRAME));
		expect([original.image.type, original.boundary]).toEqual(["image/jpeg", IN_FRAME]);
	});
});

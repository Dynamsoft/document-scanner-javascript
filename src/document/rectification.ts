import type { Point, Quadrilateral } from "../results";
import { PAGE_QUALITY, encodeCanvas } from "./images";

// Rectifying a page with Capture Vision.

/**
 * The members of the Capture Vision module that `rectifyImage` uses. `Image` is
 * the engine's own image type, which only passes from one call to the other.
 */
export interface EngineRectification<Image> {
	readonly ImageProcessor: {
		cropAndDeskewImage(image: Blob, roi: { points: [Point, Point, Point, Point] }): Promise<Image>;
	};
	_toCanvas(image: Image): HTMLCanvasElement;
}

/**
 * Rectify a page: crop an image to `boundary`, correct the perspective, and encode
 * the result as a JPEG at `PAGE_QUALITY`. Check `isWholePage` first, because
 * rectifying to the whole image gives one pixel more each way. The canvas is
 * encoded here, because the engine's encoder takes no quality setting.
 */
export async function rectifyImage<Image>(
	engine: EngineRectification<Image>,
	image: Blob,
	boundary: Quadrilateral,
): Promise<Blob> {
	const rectified = await engine.ImageProcessor.cropAndDeskewImage(image, {
		points: [...boundary.points],
	});
	return encodeCanvas(engine._toCanvas(rectified), "image/jpeg", PAGE_QUALITY);
}

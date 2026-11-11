import { context2d } from "../document/images";

// Measuring how sharp an image is, to choose between two images of one scene.

/**
 * The width both images are scaled to before measuring. Missed focus still shows
 * at this width, but a photograph's extra fine grain no longer counts.
 */
const GAUGE_WIDTH = 480;

/**
 * The share of the frame's sharpness a photograph must reach to be kept. A focused
 * photograph scores about the same or higher, and a blurred one a small fraction. The
 * margin covers encoding and scaling differences.
 */
const ENOUGH_OF_THE_FRAME = 3 / 4;

/** The ITU-R BT.601 weights for turning RGB into gray. */
const LUMA = { red: 0.299, green: 0.587, blue: 0.114 } as const;

/**
 * Whether a photograph is sharp enough to replace the frame on screen when it was
 * taken. Rejects when the photograph cannot be decoded.
 */
export async function keepsDetail(photograph: Blob, frame: HTMLCanvasElement): Promise<boolean> {
	const [ofPhoto, ofFrame] = await Promise.all([sharpness(photograph), sharpness(frame)]);
	return ofPhoto >= ofFrame * ENOUGH_OF_THE_FRAME;
}

/**
 * Measure an image's sharpness as the Laplacian variance of a gray copy scaled to
 * `GAUGE_WIDTH`. Higher is sharper. Scores compare only between images of one
 * scene and framing, because more edges score higher at any focus.
 */
export async function sharpness(image: Blob | HTMLCanvasElement): Promise<number> {
	// The browser scales while it decodes, off the main thread. A browser that
	// ignores the option hands back the full image, and the draw below scales it.
	const bitmap = await createImageBitmap(image, {
		resizeWidth: GAUGE_WIDTH,
		resizeQuality: "medium",
	});
	try {
		const width = GAUGE_WIDTH;
		// The Laplacian skips the one-pixel border, and needs at least three rows.
		const height = Math.max(3, Math.round((bitmap.height * width) / bitmap.width));
		return laplacianVariance(grayCopy(bitmap, width, height), width, height);
	} finally {
		bitmap.close();
	}
}

/** Draw the image at `width` by `height` as one gray value per pixel. */
function grayCopy(bitmap: ImageBitmap, width: number, height: number): Float32Array {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = context2d(canvas, { willReadFrequently: true });
	context.drawImage(bitmap, 0, 0, width, height);
	const { data } = context.getImageData(0, 0, width, height);
	const gray = new Float32Array(width * height);
	for (let i = 0; i < gray.length; i++) {
		const at = i * 4;
		gray[i] = LUMA.red * data[at] + LUMA.green * data[at + 1] + LUMA.blue * data[at + 2];
	}
	return gray;
}

/**
 * Compute the variance of a gray image's Laplacian, inside the one-pixel border.
 * The Laplacian is large where a pixel differs from its four neighbors.
 */
function laplacianVariance(gray: Float32Array, width: number, height: number): number {
	let sum = 0;
	let squares = 0;
	let count = 0;
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const i = y * width + x;
			const edge = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - width] - gray[i + width];
			sum += edge;
			squares += edge * edge;
			count++;
		}
	}
	const mean = sum / count;
	return squares / count - mean * mean;
}

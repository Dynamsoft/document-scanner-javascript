// Measuring, drawing, and encoding images as blobs and canvases.

/**
 * JPEG quality for the viewfinder frames and rectified pages the document scanner
 * encodes.
 */
export const PAGE_QUALITY = 0.92;

/** The size of an image in pixels. */
export interface ImageSize {
	readonly width: number;
	readonly height: number;
}

/** Measure an encoded image. The browser decodes all of it, off the main thread. */
export async function imageSize(blob: Blob): Promise<ImageSize> {
	const bitmap = await createImageBitmap(blob);
	try {
		return { width: bitmap.width, height: bitmap.height };
	} finally {
		bitmap.close();
	}
}

/**
 * Whether the browser can still read `blob`. Once its memory for blobs is full, a
 * browser can make a blob whose contents it then cannot read.
 */
export function isReadable(blob: Blob): Promise<boolean> {
	return blob
		.slice(0, 1)
		.arrayBuffer()
		.then(
			() => true,
			() => false,
		);
}

/**
 * The most pixels in all that a canvas can hold in every supported browser. iOS
 * Safari limits the area of a canvas, and refuses a larger one. The limit on one
 * side is 32,767 pixels in each engine, so no original from a real photograph
 * reaches it.
 */
const MAX_CANVAS_PIXELS = 4096 * 4096;

/**
 * Turn an image file into an original in the same form as a photograph. The
 * original is a JPEG, upright as the file's orientation says, with at most
 * `MAX_CANVAS_PIXELS` pixels in all. Rejects when the browser cannot open the file
 * as an image.
 */
export async function originalFromFile(file: Blob): Promise<Blob> {
	// The browser applies the file's orientation as it decodes.
	const bitmap = await createImageBitmap(file);
	try {
		const scale = Math.min(1, Math.sqrt(MAX_CANVAS_PIXELS / (bitmap.width * bitmap.height)));
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.floor(bitmap.width * scale));
		canvas.height = Math.max(1, Math.floor(bitmap.height * scale));
		context2d(canvas).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		return await encodeCanvas(canvas, "image/jpeg", PAGE_QUALITY);
	} finally {
		bitmap.close();
	}
}

/** Draw a blob onto a new canvas, scaled. */
export async function drawImage(blob: Blob, scale: number): Promise<HTMLCanvasElement> {
	const bitmap = await createImageBitmap(blob);
	try {
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(bitmap.width * scale));
		canvas.height = Math.max(1, Math.round(bitmap.height * scale));
		context2d(canvas).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		return canvas;
	} finally {
		bitmap.close();
	}
}

/** Get a canvas's 2d drawing context, or throw when the browser gives none. */
export function context2d(
	canvas: HTMLCanvasElement,
	settings?: CanvasRenderingContext2DSettings,
): CanvasRenderingContext2D {
	const context = canvas.getContext("2d", settings);
	if (!context) throw new Error("This browser gave no 2d canvas context");
	return context;
}

/** Encode a canvas, or reject with an error that names the format. */
export function encodeCanvas(
	canvas: HTMLCanvasElement,
	type: string,
	quality?: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error(`The page could not be encoded as ${type}`));
			},
			type,
			quality,
		);
	});
}

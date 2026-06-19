import { BlackwhiteFilter, GrayscaleFilter, InvertFilter, SepiaFilter } from "image-filter-js";

import { DeskewedImageResultItem, EnumImagePixelFormat } from "dynamsoft-capture-vision-bundle";
import type { StringConfig } from "./index";

/**
 * A selectable image filter for the {@link DocumentResultView} filter menu.
 *
 * @remarks
 * `apply` draws `source` through the underlying `image-filter-js` filter and writes the result onto
 * `target` (each filter binds to the canvas passed to its constructor).
 *
 * @internal
 */
export interface FilterOption {
	id: string;
	/** {@link StringConfig} key for the menu label, so filter names are configurable. */
	labelKey: keyof StringConfig;
	apply: (source: HTMLCanvasElement, target: HTMLCanvasElement) => void;
}

/**
 * The image filters offered in the result view filter menu, backed by `image-filter-js`.
 *
 * @internal
 */
export const FILTER_OPTIONS: FilterOption[] = [
	{
		id: "grayscale",
		labelKey: "filterGrayscaleBtn",
		apply: (source, target) => new GrayscaleFilter(target).process(source),
	},
	{
		id: "black-white",
		labelKey: "filterBlackWhiteBtn",
		// threshold ignored when OTSU is enabled; adaptive thresholding disabled.
		apply: (source, target) => new BlackwhiteFilter(target, 128, true, false, 0, 0).process(source),
	},
	{
		id: "sepia",
		labelKey: "filterSepiaBtn",
		apply: (source, target) => new SepiaFilter(target).process(source),
	},
	{
		id: "invert",
		labelKey: "filterInvertedBtn",
		apply: (source, target) => new InvertFilter(target).process(source),
	},
];

/**
 * Return a new canvas containing `canvas` rotated clockwise by `degrees` (a multiple of 90).
 *
 * @internal
 */
export function rotateCanvas(canvas: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
	const normalized = ((degrees % 360) + 360) % 360;
	if (normalized === 0) return canvas;

	const rotated = document.createElement("canvas");
	const quarterTurn = normalized === 90 || normalized === 270;
	rotated.width = quarterTurn ? canvas.height : canvas.width;
	rotated.height = quarterTurn ? canvas.width : canvas.height;

	const ctx = rotated.getContext("2d");
	if (!ctx) return canvas;

	ctx.translate(rotated.width / 2, rotated.height / 2);
	ctx.rotate((normalized * Math.PI) / 180);
	ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
	return rotated;
}

/**
 * Wrap an edited canvas in a {@link DeskewedImageResultItem}-compatible object.
 *
 * @remarks
 * Lets the rest of the pipeline (display, share, upload, done) consume the edited image
 * transparently. Metadata from `base` is preserved; only the image-bearing members are replaced.
 *
 * @internal
 */
export function canvasToResultItem(
	canvas: HTMLCanvasElement,
	base: DeskewedImageResultItem,
): DeskewedImageResultItem {
	const ctx = canvas.getContext("2d");
	const pixels = ctx?.getImageData(0, 0, canvas.width, canvas.height);

	return {
		...base,
		imageData: {
			bytes: pixels ? new Uint8Array(pixels.data.buffer) : new Uint8Array(),
			width: canvas.width,
			height: canvas.height,
			stride: canvas.width * 4,
			format: EnumImagePixelFormat.IPF_ABGR_8888,
		},
		toCanvas: () => canvas,
		toImage: (mimeType) => {
			const image = new Image();
			image.src = canvas.toDataURL(mimeType);
			return image;
		},
		toBlob: (mimeType) =>
			new Promise((resolve, reject) => {
				canvas.toBlob(
					(blob) => (blob ? resolve(blob) : reject(new Error("Failed to convert canvas to blob"))),
					mimeType,
				);
			}),
	};
}

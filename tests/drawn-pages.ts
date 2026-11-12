import { context2d } from "../src/document/images";

// In-focus and out-of-focus pages for the sharpness tests.

/**
 * Draw a page of short black bars on white, like lines of text, 4:3 unless
 * `height` says otherwise. The bars scale with `width`, so every size shows the
 * same page.
 */
export function sharpPage(width: number, height = Math.round((width * 3) / 4)): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = context2d(canvas);
	context.fillStyle = "#fff";
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.fillStyle = "#000";
	const unit = width / 100;
	for (let y = unit * 8; y < canvas.height - unit * 8; y += unit * 4) {
		for (let x = unit * 8; x < width - unit * 8; x += unit * 3) {
			context.fillRect(x, y, unit * 2, unit);
		}
	}
	return canvas;
}

/**
 * Blur the page by scaling it down `factor` times and back up. Each edge smears
 * across about `factor` pixels.
 */
export function softened(page: HTMLCanvasElement, factor = 32): HTMLCanvasElement {
	const small = document.createElement("canvas");
	small.width = Math.max(1, Math.round(page.width / factor));
	small.height = Math.max(1, Math.round(page.height / factor));
	context2d(small).drawImage(page, 0, 0, small.width, small.height);
	const soft = document.createElement("canvas");
	soft.width = page.width;
	soft.height = page.height;
	context2d(soft).drawImage(small, 0, 0, soft.width, soft.height);
	return soft;
}

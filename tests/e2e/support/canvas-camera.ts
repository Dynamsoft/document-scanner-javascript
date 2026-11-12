import type { Scene } from "./scene";

/**
 * Fake the camera in WebKit, which Playwright gives none, with a canvas that plays
 * the scene's video. It runs through `page.addInitScript`, so it cannot import.
 */
export function canvasCamera({ width, height, fps, frames }: Scene): void {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d")!;
	let count = 0;
	const draw = (): void => {
		const rects = frames[count % frames.length] ?? [];
		count += 1;
		for (const rect of rects) {
			context.fillStyle = `rgb(${rect.shade}, ${rect.shade}, ${rect.shade})`;
			context.fillRect(rect.left, rect.top, rect.width, rect.height);
		}
	};
	draw();
	setInterval(draw, 1000 / fps);
	const device = {
		deviceId: "canvas-camera",
		groupId: "canvas",
		kind: "videoinput",
		label: "Canvas camera",
	} satisfies Omit<MediaDeviceInfo, "toJSON">;
	// Set on the prototype, because WebKit can replace `navigator.mediaDevices` after
	// a garbage collection.
	MediaDevices.prototype.getUserMedia = async () => canvas.captureStream(fps);
	MediaDevices.prototype.enumerateDevices = async () =>
		[{ ...device, toJSON: () => device }] satisfies MediaDeviceInfo[];
}

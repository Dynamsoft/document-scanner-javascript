import type * as CaptureVisionBundle from "dynamsoft-capture-vision-bundle";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { loadTestEngines } from "../../tests/engines";
import { ENGINE_VIEWFINDER_CLASS } from "../phases/capture-contract";
import { DETECT_TEMPLATE, createDetector } from "../boundaries/detection";
import type { LoadedEngines } from "./engines";

// What the document scanner relies on Capture Vision to do, checked against the real
// engine. Needs the test license and the network.

type CaptureVision = typeof CaptureVisionBundle;
type Enhancer = CaptureVisionBundle.CameraEnhancer;

let engines: LoadedEngines;
let cv: CaptureVision;

beforeAll(async () => {
	engines = await loadTestEngines();
	cv = engines.captureVision;
});

afterEach(() => {
	vi.restoreAllMocks();
});

/**
 * Draw a light page on a dark desk for the detector to find, at 1280 by 720 pixels
 * times `scale`.
 */
function photographOfPage(scale = 1): Promise<Blob> {
	const canvas = document.createElement("canvas");
	canvas.width = 1280 * scale;
	canvas.height = 720 * scale;
	const context = canvas.getContext("2d")!;
	context.scale(scale, scale);
	context.fillStyle = "rgb(40, 40, 40)";
	context.fillRect(0, 0, 1280, 720);
	context.fillStyle = "rgb(235, 235, 235)";
	context.fillRect(300, 50, 680, 620);
	context.fillStyle = "rgb(70, 70, 70)";
	for (let line = 0; line < 6; line += 1) context.fillRect(360, 140 + line * 70, 500, 26);
	return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/png"));
}

describe("the engine's version", () => {
	it("reports the core version the build read from its bundle", () => {
		// It reports the version with notes after it, about its worker and WebAssembly.
		expect(cv.CoreModule.getVersion().split(/[-(]/)[0]).toBe(
			import.meta.env.ENGINE_VERSIONS.captureVisionCore,
		);
	});
});

describe("finding a page", () => {
	it("works on an image, with no camera and without the engine's preset templates", async () => {
		const found = await createDetector(cv, engines.router).detect(await photographOfPage());
		expect(found).not.toBeNull();
		const expected = [
			[300, 50],
			[980, 50],
			[980, 670],
			[300, 670],
		];
		for (const [index, point] of (found?.points ?? []).entries()) {
			expect(Math.abs(point.x - expected[index]![0]!)).toBeLessThan(12);
			expect(Math.abs(point.y - expected[index]![1]!)).toBeLessThan(12);
		}
	});

	// The detector runs one detection at a time because of this fault. If this test
	// fails, the engine may no longer show it, and detections may overlap again.
	it("returns wrong corners when detections of two image sizes overlap", async () => {
		// Set the router up as the document scanner does.
		await createDetector(cv, engines.router).detect(await photographOfPage());
		// Both shorter sides are above the size the engine shrinks an image to. The
		// first corner of the page lies at x = 300 times the scale.
		const scales = [2, 4.2, 2, 4.2];
		const images = await Promise.all(scales.map((scale) => photographOfPage(scale)));
		let wrong = 0;
		for (let round = 0; round < 3; round += 1) {
			const results = await Promise.all(
				images.map((image) => engines.router.capture(image, DETECT_TEMPLATE)),
			);
			for (const [index, result] of results.entries()) {
				const corner = result.processedDocumentResult?.detectedQuadResultItems?.[0]?.location;
				expect(corner).toBeDefined();
				if (Math.abs(corner!.points[0].x - 300 * scales[index]!) > 12) wrong += 1;
			}
		}
		expect(wrong).toBeGreaterThan(0);
	});
});

describe("rectifying a page to its boundary", () => {
	const skewed = {
		points: [
			{ x: 300, y: 200 },
			{ x: 1300, y: 260 },
			{ x: 1250, y: 1000 },
			{ x: 350, y: 950 },
		] as [
			CaptureVisionBundle.Point,
			CaptureVisionBundle.Point,
			CaptureVisionBundle.Point,
			CaptureVisionBundle.Point,
		],
	};

	async function photograph(width: number, height: number): Promise<Blob> {
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg"));
	}

	it("comes out the mean length of each pair of opposite edges", async () => {
		const rectified = await cv.ImageProcessor.cropAndDeskewImage(
			await photograph(1600, 1200),
			skewed,
		);
		expect([rectified.width, rectified.height]).toEqual([952, 747]);
	});

	it("draws the rectified image onto a canvas of its size", async () => {
		const rectified = await cv.ImageProcessor.cropAndDeskewImage(
			await photograph(1600, 1200),
			skewed,
		);
		const canvas = cv._toCanvas(rectified);
		expect([canvas.width, canvas.height]).toEqual([952, 747]);
	});

	it("comes out a pixel larger each way for a boundary the whole image wide", async () => {
		const whole = {
			points: [
				{ x: 0, y: 0 },
				{ x: 1600, y: 0 },
				{ x: 1600, y: 1200 },
				{ x: 0, y: 1200 },
			] as typeof skewed.points,
		};
		const rectified = await cv.ImageProcessor.cropAndDeskewImage(
			await photograph(1600, 1200),
			whole,
		);
		expect([rectified.width, rectified.height]).toEqual([1601, 1201]);
	});
});

describe("the camera engine", () => {
	/** Add a screen element shaped like the capture screen's to the page. */
	function screenOnPage(): HTMLElement {
		const ui = document.createElement("div");
		ui.innerHTML = `<div class="${ENGINE_VIEWFINDER_CLASS}"></div>`;
		document.body.append(ui);
		return ui;
	}

	/** Stream a changing canvas as a stand-in camera. */
	function canvasCamera(): { readonly stream: MediaStream; stop(): void } {
		const canvas = document.createElement("canvas");
		canvas.width = 640;
		canvas.height = 480;
		const context = canvas.getContext("2d")!;
		const stream = canvas.captureStream(30);
		let shade = 0;
		const timer = setInterval(() => {
			context.fillStyle = `rgb(${(shade = (shade + 17) % 255)}, 80, 80)`;
			context.fillRect(0, 0, 640, 480);
		}, 30);
		return {
			stream,
			stop() {
				clearInterval(timer);
				for (const track of stream.getTracks()) track.stop();
			},
		};
	}

	async function engineCamera(ui: HTMLElement): Promise<Enhancer> {
		const camera = await cv.CameraEnhancer.createInstance(ui);
		// As the capture phase sets it: `false` passes a refusal on.
		camera._bTryAnotherCameraWhenFailToOpen = false;
		return camera;
	}

	it("puts its video inside a screen element that is already on the page", async () => {
		const ui = screenOnPage();
		const camera = await engineCamera(ui);
		try {
			expect(camera.getUIElement()).toBe(ui);
			expect(ui.isConnected).toBe(true);
			expect(ui.querySelector(`.${ENGINE_VIEWFINDER_CLASS}`)?.childElementCount).toBeGreaterThan(0);
		} finally {
			camera.dispose();
			ui.remove();
		}
	});

	it("hands the document scanner's constraints to the browser whole in one request", async () => {
		const source = canvasCamera();
		const getUserMedia = vi
			.spyOn(navigator.mediaDevices, "getUserMedia")
			.mockImplementation(async () => source.stream);
		const ui = screenOnPage();
		const camera = await engineCamera(ui);
		const asked = {
			facingMode: { ideal: "environment" },
			resizeMode: { exact: "none" },
			frameRate: { ideal: 30 },
			width: { min: 640, ideal: 1280, max: 1600 },
			height: { min: 480, ideal: 960, max: 1200 },
		};
		try {
			await camera.requestCamera(asked as MediaTrackConstraints);
			await camera.open();
			expect(getUserMedia).toHaveBeenCalledTimes(1);
			const video = getUserMedia.mock.calls[0]?.[0]?.video as Record<string, unknown>;
			expect(video.facingMode).toEqual(asked.facingMode);
			expect(video.resizeMode).toEqual(asked.resizeMode);
			expect(video.frameRate).toEqual(asked.frameRate);
			expect(video.width).toEqual(asked.width);
			expect(video.height).toEqual(asked.height);
		} finally {
			await camera.close();
			camera.dispose();
			source.stop();
			ui.remove();
		}
	});

	it.each(["OverconstrainedError", "NotAllowedError", "NotFoundError", "NotReadableError"])(
		"passes the browser's %s on, with no other camera tried",
		async (name) => {
			const refusal =
				name === "OverconstrainedError" && typeof OverconstrainedError === "function"
					? new OverconstrainedError("width", "no such size")
					: new DOMException("refused", name);
			const getUserMedia = vi
				.spyOn(navigator.mediaDevices, "getUserMedia")
				.mockRejectedValue(refusal);
			const ui = screenOnPage();
			const camera = await engineCamera(ui);
			try {
				const opening = (async () => {
					await camera.requestCamera({ width: { exact: 99999 } });
					await camera.open();
				})();
				await expect(opening).rejects.toMatchObject({ name });
				expect(getUserMedia).toHaveBeenCalledTimes(1);
			} finally {
				camera.dispose();
				ui.remove();
			}
		},
	);
});

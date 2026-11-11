import { expect, test as base } from "playwright/test";
import type { LaunchOptions, Locator, Page } from "playwright/test";
import type {
	DocumentScanner,
	ScanResult,
	ScannerError,
	ScannerSettings,
} from "../../../src/index";
import type { EditPress } from "../../../src/phases/edit-screen";
import type { RectifyPress } from "../../../src/phases/rectify-screen";
import { browserPath } from "../../../vite/browsers-container";
import { canvasCamera } from "./canvas-camera";
import { scene } from "./scene";
import type { VideoName } from "./scene";
import { videoFile } from "./videos";

// Helpers that drive tests/e2e/fixtures/scan.html through the public surface only.

/** The camera options a test file can set. */
interface CameraOptions {
	/**
	 * The video the fake camera plays, or `null` for the browser's own. Chromium
	 * takes it at launch, so it is set per worker. Firefox ignores it and skips
	 * tests tagged `@document`, which need a page in view.
	 */
	readonly camera: VideoName | null;
}

/** Playwright's `test` with a fake camera, and the trial notice dismissed. */
export const test = base.extend<{ fakeCamera: void }, CameraOptions>({
	camera: [null, { scope: "worker", option: true }],
	launchOptions: [
		async ({ browserName, camera }, use) => {
			await use(cameraLaunchOptions(browserName, camera));
		},
		{ scope: "worker" },
	],
	fakeCamera: [
		async ({ page, browserName, camera }, use) => {
			await page.addLocatorHandler(
				page.getByRole("button", { name: "Dismiss" }),
				async (button) => {
					await button.click();
				},
			);
			// With no video chosen, WebKit's canvas camera shows an empty desk.
			if (browserName === "webkit")
				await page.addInitScript(canvasCamera, scene(camera ?? "empty"));
			await use();
		},
		{ auto: true },
	],
});

export { expect };

/** Build the launch options that give a browser a fake camera. */
function cameraLaunchOptions(browserName: string, video: VideoName | null): LaunchOptions {
	switch (browserName) {
		case "chromium":
			return {
				args: [
					// Use a fake camera and accept its permission prompt.
					"--use-fake-device-for-media-stream",
					"--use-fake-ui-for-media-stream",
					...(video ? [`--use-file-for-fake-video-capture=${browserPath(videoFile(video))}`] : []),
				],
			};
		case "firefox":
			return {
				firefoxUserPrefs: {
					"media.navigator.streams.fake": true,
					"media.navigator.permission.disabled": true,
				},
			};
		default:
			return {};
	}
}

/**
 * Open the document scanner's test page with `settings` over its license and
 * engine resources. Functions and elements cannot pass into the page.
 */
export async function openScanner(page: Page, settings: ScannerSettings = {}): Promise<void> {
	await page.addInitScript((given) => {
		(window as typeof window & { scannerSettings: unknown }).scannerSettings = given;
	}, settings);
	await page.goto("/tests/e2e/fixtures/scan.html");
}

/**
 * Open the document scanner's test page as `openScanner()` does, but start its scan
 * from an image file of the still scene's page.
 */
export async function openScannerWithFile(
	page: Page,
	settings: ScannerSettings = {},
): Promise<void> {
	await page.addInitScript(({ width, height, frames }) => {
		const canvas = new OffscreenCanvas(width, height);
		const context = canvas.getContext("2d")!;
		for (const rect of frames[0] ?? []) {
			context.fillStyle = `rgb(${rect.shade}, ${rect.shade}, ${rect.shade})`;
			context.fillRect(rect.left, rect.top, rect.width, rect.height);
		}
		(window as typeof window & { scanFile: unknown }).scanFile = canvas.convertToBlob();
	}, scene("still"));
	await openScanner(page, settings);
}

/**
 * Count each request of the page for a camera, for `cameraRequests()`. It wraps the
 * fake camera, which the `fakeCamera` fixture puts in place before the test runs.
 */
export async function countCameraRequests(page: Page): Promise<void> {
	await page.addInitScript(() => {
		const scope = window as typeof window & { cameraRequests: number };
		scope.cameraRequests = 0;
		// On the prototype, because WebKit can replace `navigator.mediaDevices` after a
		// garbage collection.
		const request = Object.getOwnPropertyDescriptor(MediaDevices.prototype, "getUserMedia")!
			.value as MediaDevices["getUserMedia"];
		MediaDevices.prototype.getUserMedia = function (constraints) {
			scope.cameraRequests += 1;
			return request.call(this, constraints);
		};
	});
}

/** How many times the page asked the browser for a camera, since `countCameraRequests()`. */
export function cameraRequests(page: Page): Promise<number> {
	return page.evaluate(() => (window as typeof window & { cameraRequests: number }).cameraRequests);
}

/**
 * Open the test page that loads `version` of Capture Vision from the CDN before
 * the document scanner. With `license`, that copy is licensed with it first.
 */
export async function openAfterAnotherCopy(
	page: Page,
	version: string,
	license?: string,
): Promise<void> {
	await page.addInitScript(
		(otherCopy) => {
			(window as typeof window & { otherCopy: unknown }).otherCopy = otherCopy;
		},
		{ version, license },
	);
	await page.goto("/tests/e2e/fixtures/second-copy.html");
	// The page starts its scan once the other copy has loaded, which the load event
	// does not wait for.
	await page.waitForFunction(() => "scan" in window);
}

/**
 * Give the page a camera that takes photographs, as a phone's does, each twice the
 * size of the frame on screen. Chromium's fake camera offers no photograph larger
 * than its frames, so a page otherwise keeps the frame.
 */
export async function photographAtTwiceTheFrame(page: Page): Promise<void> {
	await page.addInitScript(() => {
		Object.assign(window, {
			ImageCapture: class {
				async getPhotoCapabilities() {
					return { imageWidth: { max: 8000 } };
				}
				async takePhoto() {
					const video = document.querySelector<HTMLVideoElement>(".mds-capture video")!;
					const canvas = document.createElement("canvas");
					canvas.width = video.videoWidth * 2;
					canvas.height = video.videoHeight * 2;
					canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
					return new Promise<Blob>((done) => canvas.toBlob((blob) => done(blob!), "image/jpeg"));
				}
			},
		});
	});
}

/** The edit screen. */
export function editScreen(page: Page): Locator {
	return page.locator(".mds-edit");
}

/** One of the edit screen's buttons, by name. */
export function editButton(page: Page, button: EditPress["button"]): Locator {
	return editScreen(page).getByTestId(button);
}

/** The rectify screen. */
export function rectifyScreen(page: Page): Locator {
	return page.locator(".mds-rectify");
}

/** One of the rectify screen's buttons, by name. */
export function rectifyButton(page: Page, button: RectifyPress["button"]): Locator {
	return rectifyScreen(page).getByTestId(button);
}

/** Wait until the capture screen's camera is giving frames. */
export async function cameraRunning(page: Page): Promise<void> {
	await expect
		.poll(
			() =>
				page.evaluate(
					() => document.querySelector<HTMLVideoElement>(".mds-capture video")?.videoWidth ?? 0,
				),
			{ timeout: 60_000 },
		)
		.toBeGreaterThan(0);
}

/** Which of a file drag's events the page cancelled. */
export interface DropRefusal {
	readonly enter: boolean;
	readonly over: boolean;
	readonly drop: boolean;
}

/**
 * Drag a file onto the middle of `area` and drop it there, on the innermost
 * element under that point, and report which events the page cancelled.
 */
export async function dropFile(page: Page, area: Locator): Promise<DropRefusal> {
	const box = (await area.boundingBox())!;
	return page.evaluate(
		({ x, y }) => {
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(new File(["page"], "page.png", { type: "image/png" }));
			let target = document.elementFromPoint(x, y)!;
			for (let inner = target.shadowRoot?.elementFromPoint(x, y); inner && inner !== target;) {
				target = inner;
				inner = target.shadowRoot?.elementFromPoint(x, y);
			}
			const cancelled = (type: string) =>
				!target.dispatchEvent(
					new DragEvent(type, {
						bubbles: true,
						composed: true,
						cancelable: true,
						dataTransfer,
						clientX: x,
						clientY: y,
					}),
				);
			return {
				enter: cancelled("dragenter"),
				over: cancelled("dragover"),
				drop: cancelled("drop"),
			};
		},
		{ x: box.x + box.width / 2, y: box.y + box.height / 2 },
	);
}

/** Read the page count on the capture screen's thumbnail. */
export function pageCount(page: Page): Promise<string> {
	return page.locator(".mds-capture-count").innerText();
}

/** Four corners as Document Viewer takes and gives them. */
export type Quad = [[number, number], [number, number], [number, number], [number, number]];

/** Set the rectify screen's corners, as if the user had dragged them there. */
export function selectQuad(page: Page, quad: Quad): Promise<void> {
	return page.evaluate((corners) => {
		const viewer = (window as ScanWindow).scan.scanner.getDdvViewer("perspectiveViewer") as Viewer;
		if (!viewer.setQuadSelection(corners)) throw new Error("The viewer refused the corners");
	}, quad);
}

/** Read the rectify screen's corners. */
export function quadSelection(page: Page): Promise<Quad | null> {
	return page.evaluate(() => {
		const viewer = (window as ScanWindow).scan.scanner.getDdvViewer(
			"perspectiveViewer",
		) as Viewer | null;
		return viewer?.getQuadSelection() ?? null;
	});
}

/** Measure the area of a quad's bounding box. */
export function boxArea(quad: Quad | null): number {
	if (!quad) return 0;
	const xs = quad.map(([x]) => x);
	const ys = quad.map(([, y]) => y);
	return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
}

/**
 * Report whether the rectify and edit screens show separate documents, and how
 * many pages the rectify screen's document has.
 */
export function viewerDocuments(
	page: Page,
): Promise<{ readonly separate: boolean; readonly rectifyPages: number }> {
	return page.evaluate(() => {
		const { scanner } = (window as ScanWindow).scan;
		const rectify = scanner.getDdvViewer("perspectiveViewer") as Viewer;
		const edit = scanner.getDdvViewer("editViewer") as Viewer;
		return {
			separate: rectify.currentDocument.uid !== edit.currentDocument.uid,
			rectifyPages: rectify.currentDocument.pages.length,
		};
	});
}

/** The first page on the edit screen, with its size as shown, in pixels. */
export interface EditPage {
	readonly uid: string;
	readonly width: number;
	readonly height: number;
	readonly rotation: number;
}

/** Read the first page on the edit screen. */
export function firstEditPage(page: Page): Promise<EditPage> {
	return page.evaluate(async () => {
		const viewer = (window as ScanWindow).scan.scanner.getDdvViewer("editViewer") as Viewer;
		const document_ = viewer.currentDocument;
		const uid = document_.pages[0]!;
		const data = document_.getPageData(uid);
		const { width, height } = await data.display();
		const { rotation } = data;
		data.destroy();
		return { uid, width, height, rotation };
	});
}

/**
 * Read the filter of the first page on the edit screen, and whether its image as
 * shown is black or white in the middle. The fake cameras never show pure black or
 * white there, so only the black and white filter makes it so.
 */
export function firstPageFilter(
	page: Page,
): Promise<{ readonly filter: unknown; readonly blackOrWhite: boolean }> {
	return page.evaluate(async () => {
		const viewer = (window as ScanWindow).scan.scanner.getDdvViewer("editViewer") as Viewer;
		const document_ = viewer.currentDocument;
		const uid = document_.pages[0]!;
		const record = (await document_.getPageCustomData(uid)) as { readonly filter?: unknown };
		const data = document_.getPageData(uid);
		const shown = await data.display();
		data.destroy();
		const bitmap = await createImageBitmap(shown.data);
		const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const context = canvas.getContext("2d")!;
		context.drawImage(bitmap, 0, 0);
		const middle = context.getImageData(bitmap.width >> 1, bitmap.height >> 1, 1, 1).data;
		const blackOrWhite = middle.slice(0, 3).every((value) => value % 255 === 0);
		return { filter: record.filter, blackOrWhite };
	});
}

/** The uids of the pages on the edit screen, in order. */
export function pageOrder(page: Page): Promise<string[]> {
	return page.evaluate(() => {
		const viewer = (window as ScanWindow).scan.scanner.getDdvViewer("editViewer") as Viewer;
		return [...viewer.currentDocument.pages];
	});
}

/** The indices of the pages selected in the thumbnails on the edit screen. */
export function selectedPages(page: Page): Promise<number[]> {
	return page.evaluate(() => {
		const viewer = (window as ScanWindow).scan.scanner.getDdvViewer("editViewer") as Viewer;
		return viewer.thumbnail.getSelectedPageIndices();
	});
}

/**
 * Find the middle of each row of the thumbnails on the edit screen, in page
 * coordinates. A fractional row lies between two middles.
 */
export async function thumbnailRows(
	page: Page,
): Promise<(row: number) => { x: number; y: number }> {
	const strip = (await editScreen(page).locator(".ddv-thumbnail-container").boundingBox())!;
	// The edit screen shows five rows of thumbnails.
	return (row) => ({
		x: strip.x + strip.width / 2,
		y: strip.y + (strip.height / 5) * (row + 0.5),
	});
}

/** Rotate the first page on the edit screen through the viewer. */
export function rotateFirstPage(page: Page, angle: number): Promise<void> {
	return page.evaluate((by) => {
		const viewer = (window as ScanWindow).scan.scanner.getDdvViewer("editViewer") as Viewer;
		viewer.rotate(by, [0]);
	}, angle);
}

/** The parts of a Document Viewer viewer that these tests use. */
interface Viewer {
	rotate(angle: number, indices: number[]): void;
	setQuadSelection(quad: Quad): boolean;
	getQuadSelection(): Quad | null;
	readonly currentDocument: {
		readonly uid: string;
		readonly pages: string[];
		getPageCustomData(uid: string): Promise<unknown>;
		getPageData(uid: string): {
			display(): Promise<{ readonly data: Blob; readonly width: number; readonly height: number }>;
			readonly rotation: number;
			destroy(): void;
		};
	};
	readonly thumbnail: { getSelectedPageIndices(): number[] };
}

/** One page of the result as plain values. */
export interface PageSummary {
	readonly origin: string;
	readonly original: readonly [number, number];
	readonly processed: readonly [number, number];
	readonly boundary: readonly { readonly x: number; readonly y: number }[];
}

/**
 * Finish the scan and summarize the pages in its result. Throws when the scan ends
 * cancelled or failed.
 */
export async function finishScan(page: Page): Promise<readonly PageSummary[]> {
	await page.evaluate(() => (window as ScanWindow).scan.scanner.finish());
	return scanPages(page);
}

/**
 * Wait for the scan to end, and summarize the pages in its result. Throws when it
 * ends cancelled or failed.
 */
export function scanPages(page: Page): Promise<readonly PageSummary[]> {
	return page.evaluate(async () => {
		const outcome = await (window as ScanWindow).scan.result;
		if (outcome.status !== "success") throw new Error(`The scan ended as ${outcome.status}`);
		return outcome.pages.map((each) => ({
			origin: each.origin,
			original: [each.original.width, each.original.height] as const,
			processed: [each.processed.width, each.processed.height] as const,
			boundary: each.boundary.points.map(({ x, y }) => ({ x, y })),
		}));
	});
}

/** Wait for the scan to fail, and return its error. Throws when it ends otherwise. */
export function scanFailure(page: Page): Promise<ScannerError> {
	return page.evaluate(async () => {
		const outcome = await (window as ScanWindow).scan.result;
		if (outcome.status !== "failed") throw new Error(`The scan ended as ${outcome.status}`);
		return outcome.error;
	});
}

/**
 * Wait for the license error to open over the capture screen, then dismiss it, and
 * return the error the scan failed with. Throws when the scan ends otherwise. An
 * expired key has a dialog of another title, which this does not wait for.
 */
export async function licenseFailure(page: Page): Promise<ScannerError> {
	const dialog = page.getByRole("dialog", { name: "License error" });
	// Counted, because a check that waits would let the test's handler dismiss it first.
	await expect.poll(() => dialog.count(), { timeout: 60_000 }).toBe(1);
	expect(await page.locator(".mds-capture").count()).toBe(1);
	// The test's handler presses Dismiss before this check.
	await expect(dialog).toHaveCount(0);
	const error = await scanFailure(page);
	expect(await page.locator(".mds-capture").count()).toBe(0);
	return error;
}

/** Cancel the page's scan. */
export function cancelScan(page: Page): Promise<void> {
	return page.evaluate(() => (window as ScanWindow).scan.scanner.cancel());
}

/**
 * Reset the page's document scanner during its scan and start another in the same
 * task, before the first scan's camera has closed. Return how the first scan ended.
 */
export function resetAndScanAgain(page: Page): Promise<ScanResult["status"]> {
	return page.evaluate(async () => {
		const { scan } = window as ScanWindow;
		const ended = scan.result;
		scan.scanner.reset();
		scan.result = scan.scanner.scan();
		return (await ended).status;
	});
}

/** Reset the page's document scanner. */
export function resetScanner(page: Page): Promise<void> {
	return page.evaluate(() => (window as ScanWindow).scan.scanner.reset());
}

/** Wait for the page's scan to end, and return how it ended. */
export function scanStatus(page: Page): Promise<ScanResult["status"]> {
	return page.evaluate(async () => (await (window as ScanWindow).scan.result).status);
}

/**
 * Call `scan()` again while the page's scan is running or waiting for the engines,
 * and return the message it rejects with.
 */
export function secondScanRefusal(page: Page): Promise<string> {
	return page.evaluate(async () => {
		try {
			await (window as ScanWindow).scan.scanner.scan();
		} catch (thrown) {
			return (thrown as Error).message;
		}
		throw new Error("The second scan() was not refused");
	});
}

/**
 * Cancel the page's scan while the engines load. Return in what order the scan
 * ended and the engines loaded, and how many `.mds-scanner` elements are on the
 * page just after.
 */
export function cancelWhileLoading(
	page: Page,
): Promise<{ readonly order: readonly string[]; readonly elements: number }> {
	return page.evaluate(async () => {
		const { scanner, result } = (window as ScanWindow).scan;
		const order: string[] = [];
		const ended = result.then(({ status }) => order.push(`scan ${status}`));
		const loaded = scanner.preload().then(() => order.push("engines loaded"));
		scanner.cancel();
		await Promise.all([ended, loaded]);
		// Time for a scan that carried on to have put its element on the page.
		await new Promise((resolve) => setTimeout(resolve, 500));
		return { order, elements: document.querySelectorAll(".mds-scanner").length };
	});
}

/**
 * Read the capture screen as it is right now: whether it shows, whether the
 * camera engine has added its layer yet, which it does only once the engines
 * have loaded, and how the shutter, the viewfinder's spinner, and cancel look.
 */
export function captureScreenNow(page: Page) {
	return page.evaluate(() => {
		const find = (selector: string) => document.querySelector<HTMLElement>(selector);
		return {
			shown: find(".mds-capture") !== null,
			cameraLayer: find(".mds-camera-layer") !== null,
			shutterOff: find('[data-mds-button="shutter"]')?.hasAttribute("disabled"),
			spinner: find(".mds-spinner-viewfinder")?.hidden === false,
			cancelOff: find('[data-mds-button="cancel"]')?.hasAttribute("disabled"),
		};
	});
}

/**
 * Press the capture screen's cancel button, and return whether the camera engine
 * had added its layer by then.
 */
export function pressCancelNow(page: Page): Promise<boolean> {
	return page.evaluate(() => {
		const cameraLayer = document.querySelector(".mds-camera-layer") !== null;
		document.querySelector<HTMLElement>('[data-mds-button="cancel"]')!.click();
		return cameraLayer;
	});
}

/** Start another scan on the page's document scanner. */
export function scanAgain(page: Page): Promise<void> {
	return page.evaluate(() => {
		const { scan } = window as ScanWindow;
		scan.result = scan.scanner.scan();
	});
}

/** Dispose of the document scanner, and return how its scan ended. */
export function disposeScanner(page: Page): Promise<ScanResult["status"]> {
	return page.evaluate(async () => {
		const { scanner, result } = (window as ScanWindow).scan;
		scanner.dispose();
		return (await result).status;
	});
}

/**
 * Once the engines have loaded, cancel the page's scan, start another, and dispose
 * of the document scanner before that scan can begin. Return how it ended.
 */
export function rescanAndDispose(page: Page): Promise<ScanResult["status"]> {
	return page.evaluate(async () => {
		const { scanner } = (window as ScanWindow).scan;
		await scanner.preload();
		scanner.cancel();
		const result = scanner.scan();
		scanner.dispose();
		return (await result).status;
	});
}

/** The fixture page's `window`, with what the page puts on it. */
export type ScanWindow = typeof window & {
	readonly scan: { readonly scanner: DocumentScanner; result: Promise<ScanResult> };
};

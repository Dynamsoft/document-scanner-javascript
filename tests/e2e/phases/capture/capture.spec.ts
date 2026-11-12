import {
	boxArea,
	cameraRunning,
	finishScan,
	expect,
	openScanner,
	quadSelection,
	rectifyButton,
	rectifyScreen,
	test,
} from "../../support/scanner";
import { FRAME } from "../../support/scene";

// The default flow, through the capture and rectify phases.

test.use({ camera: "moving" });

test(
	"captures a page by itself, reviews its boundary, and keeps it rectified",
	{ tag: "@document" },
	async ({ page }) => {
		await openScanner(page);

		await test.step("a document that holds still opens the rectify screen on the boundary found", async () => {
			await expect(rectifyScreen(page)).toBeVisible({ timeout: 60_000 });
			expect(await quadSelection(page)).not.toBeNull();
		});

		await test.step("detect borders puts the boundary back after full image", async () => {
			await rectifyButton(page, "fullImage").click();
			await expect
				.poll(async () => boxArea(await quadSelection(page)))
				.toBe(FRAME.width * FRAME.height);
			await rectifyButton(page, "detectBoundary").click();
			await expect
				.poll(async () => boxArea(await quadSelection(page)), { timeout: 10_000 })
				.toBeLessThan(FRAME.width * FRAME.height * 0.9);
		});

		await test.step("retake goes back to capture, which captures by itself again", async () => {
			await rectifyButton(page, "retake").click();
			await expect(rectifyScreen(page)).toBeHidden();
			await expect(rectifyScreen(page)).toBeVisible({ timeout: 30_000 });
		});

		await test.step("keep takes the page, and the session ends with it rectified to its boundary", async () => {
			await rectifyButton(page, "apply").click();
			await expect(rectifyScreen(page)).toBeHidden();
			const pages = await finishScan(page);
			expect(pages).toHaveLength(1);
			expect(pages[0]?.original).toEqual([FRAME.width, FRAME.height]);
			expect(pages[0]?.processed[0]).toBeLessThan(FRAME.width * 0.7);
		});
	},
);

test("shows the capture screen's controls before the camera gives frames", async ({ page }) => {
	await page.addInitScript(() => {
		const seen: { controls?: number; frames?: number } = {};
		(window as typeof window & { reveal: typeof seen }).reveal = seen;
		const watch = (): void => {
			const now = performance.now();
			const controls = document.querySelector(".mds-screen-capture:not([hidden]) .mds-capture");
			const video = document.querySelector<HTMLVideoElement>(".mds-capture video");
			if (controls) seen.controls ??= now;
			if (video && video.videoWidth > 0) seen.frames ??= now;
			if (seen.controls === undefined || seen.frames === undefined) requestAnimationFrame(watch);
		};
		requestAnimationFrame(watch);
	});
	await openScanner(page, { phases: { capture: { autoCapture: false } } });
	await cameraRunning(page);
	/** Read when the controls showed and when the first frames came. */
	const reveal = () =>
		page.evaluate(
			() => (window as typeof window & { reveal: { controls?: number; frames?: number } }).reveal,
		);
	// The watcher records the frames on the next animation frame.
	await expect.poll(async () => (await reveal()).frames).toBeDefined();
	const seen = await reveal();
	expect(seen.controls).toBeDefined();
	expect(seen.controls!).toBeLessThan(seen.frames!);
});

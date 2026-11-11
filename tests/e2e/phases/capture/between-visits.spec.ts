import {
	cameraRunning,
	expect,
	openScanner,
	rectifyButton,
	rectifyScreen,
	test,
} from "../../support/scanner";

// The camera's video between visits to the capture screen. It runs in every browser.

test("the camera's video stays on the page and keeps playing while another screen shows", async ({
	page,
}) => {
	// WebKit on iOS draws a camera video that starts again smaller than its box.
	await openScanner(page, { phases: { capture: { autoCapture: false } } });
	await cameraRunning(page);
	await page.evaluate(() => {
		const video = document.querySelector<HTMLVideoElement>(".mds-capture video")!;
		Object.assign(window, { cameraVideo: video, cameraPauses: 0 });
		video.addEventListener("pause", () => (window as any).cameraPauses++);
	});
	const video = () =>
		page.evaluate(() => {
			const { cameraVideo, cameraPauses } = window as any;
			return {
				same: document.querySelector(".mds-capture video") === cameraVideo,
				connected: cameraVideo.isConnected,
				paused: cameraVideo.paused,
				pauses: cameraPauses,
			};
		});

	await page.getByTestId("shutter").click();
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 30_000 });
	expect(await video()).toEqual({ same: true, connected: true, paused: false, pauses: 0 });
	// The capture screen behind takes no taps.
	await expect(page.getByTestId("shutter")).toBeHidden();

	await rectifyButton(page, "retake").click();
	await expect(rectifyScreen(page)).toBeHidden();
	await cameraRunning(page);
	expect(await video()).toEqual({ same: true, connected: true, paused: false, pauses: 0 });
});

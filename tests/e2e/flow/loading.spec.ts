import {
	cameraRunning,
	cancelScan,
	captureScreenNow,
	pressCancelNow,
	cancelWhileLoading,
	expect,
	openScanner,
	scanStatus,
	secondScanRefusal,
	test,
} from "../support/scanner";

// A scan started while the engines load. The page's scan is still loading them
// when the page has loaded.

test("refuses a second scan() while the first waits for the engines", async ({ page }) => {
	await openScanner(page);
	expect(await secondScanRefusal(page)).toBe("A session is already running; call cancel() first");
	await cameraRunning(page);
	await expect(page.locator(".mds-scanner")).toHaveCount(1);
	await cancelScan(page);
	expect(await scanStatus(page)).toBe("cancelled");
	await expect(page.locator(".mds-scanner")).toHaveCount(0);
});

test("cancel() while the engines load ends the session immediately and opens nothing", async ({
	page,
}) => {
	await openScanner(page);
	expect(await cancelWhileLoading(page)).toEqual({
		order: ["scan cancelled", "engines loaded"],
		elements: 0,
	});
});

test("shows the capture screen, waiting, before the engines have loaded", async ({ page }) => {
	await openScanner(page);
	expect(await captureScreenNow(page)).toEqual({
		shown: true,
		cameraLayer: false,
		shutterOff: true,
		spinner: true,
		cancelOff: false,
	});
	await cameraRunning(page);
	// The controls come on once the screen is usable, just after the camera.
	await expect
		.poll(() => captureScreenNow(page))
		.toMatchObject({ shutterOff: false, spinner: false });
});

test("ends the session when its cancel button is pressed before the engines have loaded", async ({
	page,
}) => {
	await openScanner(page);
	expect(await pressCancelNow(page)).toBe(false);
	expect(await scanStatus(page)).toBe("cancelled");
	await expect(page.locator(".mds-scanner")).toHaveCount(0);
});

import {
	cameraRequests,
	cameraRunning,
	countCameraRequests,
	editScreen,
	expect,
	finishScan,
	openScannerWithFile,
	rectifyButton,
	rectifyScreen,
	scanPages,
	test,
} from "../support/scanner";

// A scan that starts from an image file.

test("starts from an image file on the rectify screen, keeps its page, and opens no camera", async ({
	page,
}) => {
	await countCameraRequests(page);
	await openScannerWithFile(page);
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 30_000 });
	await rectifyButton(page, "apply").click();
	await expect(editScreen(page)).toBeVisible();
	expect(await finishScan(page)).toHaveLength(1);
	expect(await cameraRequests(page)).toBe(0);
});

test("adds the page of an image file straight away with rectify after capture off", async ({
	page,
}) => {
	await countCameraRequests(page);
	await openScannerWithFile(page, { phases: { rectify: { modes: { afterCapture: false } } } });
	await expect(editScreen(page)).toBeVisible({ timeout: 30_000 });
	expect(await finishScan(page)).toHaveLength(1);
	expect(await cameraRequests(page)).toBe(0);
});

test("opens the camera only when the user retakes the page of the file", async ({ page }) => {
	await countCameraRequests(page);
	await openScannerWithFile(page);
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 30_000 });
	expect(await cameraRequests(page)).toBe(0);
	await rectifyButton(page, "retake").click();
	await cameraRunning(page);
	expect(await cameraRequests(page)).toBeGreaterThan(0);
});

test("scans an image file with no screen at all when rectify and edit are off", async ({
	page,
}) => {
	await countCameraRequests(page);
	await openScannerWithFile(page, { phases: { rectify: false, edit: false } });
	expect(await scanPages(page)).toHaveLength(1);
	expect(await cameraRequests(page)).toBe(0);
});

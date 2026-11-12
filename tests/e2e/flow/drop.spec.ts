import {
	cameraRunning,
	dropFile,
	editScreen,
	expect,
	openScanner,
	rectifyButton,
	rectifyScreen,
	test,
} from "../support/scanner";

// A file dropped on a screen. A browser opens a file whose drop no element
// refuses, which would end the session. Document Viewer cancels dragenter only
// while it takes drops, and it would load the file as a page.

test.use({ camera: "still" });

/** A drop that the screen refuses, and that no viewer takes. */
const REFUSED = { enter: false, over: true, drop: true };

test("each screen refuses a dropped file, and no viewer takes it", async ({ page }) => {
	// Auto-capture is off, because it would take the page again after Keep.
	await openScanner(page, { phases: { capture: { autoCapture: false } } });
	await cameraRunning(page);
	expect(await dropFile(page, page.locator(".mds-capture"))).toEqual(REFUSED);

	await page.getByTestId("shutter").click();
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 60_000 });
	expect(await dropFile(page, rectifyScreen(page).locator(".mds-rectify-viewer"))).toEqual(REFUSED);

	await rectifyButton(page, "apply").click();
	await page.getByTestId("thumbnail").click();
	await expect(editScreen(page)).toBeVisible();
	expect(await dropFile(page, editScreen(page))).toEqual(REFUSED);
});

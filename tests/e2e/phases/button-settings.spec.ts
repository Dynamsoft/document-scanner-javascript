import {
	cameraRunning,
	editButton,
	editScreen,
	expect,
	openScanner,
	rectifyButton,
	rectifyScreen,
	test,
} from "../support/scanner";

// The host application's button settings reach the rectify and edit screens through
// their phases.

test("hides the buttons that the settings of each screen and mode hide", async ({ page }) => {
	await openScanner(page, {
		phases: {
			capture: { autoCapture: false },
			rectify: { modes: { afterCapture: { buttons: { retake: { hidden: true } } } } },
			edit: { buttons: { addPage: { hidden: true } } },
		},
	});
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 60_000 });
	await expect(rectifyButton(page, "retake")).toBeHidden();
	await rectifyButton(page, "apply").click();
	await expect(page.locator(".mds-capture-count")).toHaveText("1", { timeout: 30_000 });
	await page.getByTestId("thumbnail").click();
	await expect(editScreen(page)).toBeVisible();
	await expect(editButton(page, "addPage")).toBeHidden();
	await expect(editButton(page, "done")).toBeVisible();
});

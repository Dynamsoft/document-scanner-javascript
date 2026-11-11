import {
	cameraRunning,
	editScreen,
	expect,
	openScanner,
	rectifyButton,
	rectifyScreen,
	test,
} from "../support/scanner";

// A whole session with the shutter and no page in view. It runs in every browser.

test("captures with the shutter, retakes, keeps, and reaches the edit screen", async ({ page }) => {
	await openScanner(page, { phases: { capture: { autoCapture: false } } });
	await cameraRunning(page);

	await test.step("the thumbnail is dead while there are no pages", async () => {
		await expect(page.getByTestId("thumbnail")).toBeDisabled();
	});

	await test.step("the auto-capture toggle answers", async () => {
		const toggle = page.getByTestId("autoCapture");
		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-pressed", "true");
		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-pressed", "false");
	});

	await test.step("the shutter captures a page and opens the rectify screen", async () => {
		await page.getByTestId("shutter").click();
		await expect(rectifyScreen(page)).toBeVisible({ timeout: 30_000 });
	});

	await test.step("retake goes back to a live capture screen", async () => {
		await rectifyButton(page, "retake").click();
		await expect(rectifyScreen(page)).toBeHidden();
		await cameraRunning(page);
	});

	await test.step("a kept page opens the edit screen from the thumbnail", async () => {
		await page.getByTestId("shutter").click();
		await expect(rectifyScreen(page)).toBeVisible({ timeout: 30_000 });
		await rectifyButton(page, "apply").click();
		await expect(rectifyScreen(page)).toBeHidden();
		await expect(page.getByTestId("thumbnail")).toBeEnabled();
		await page.getByTestId("thumbnail").click();
		await expect(editScreen(page)).toBeVisible();
	});
});

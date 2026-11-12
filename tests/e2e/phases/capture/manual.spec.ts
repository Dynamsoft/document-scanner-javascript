import { cameraRunning, expect, openScanner, rectifyScreen, test } from "../../support/scanner";

// Capture with auto-capture starting off.

test.use({ camera: "moving" });

test(
	"waits for the user with auto-capture off, and captures once it is turned on",
	{ tag: "@document" },
	async ({ page }) => {
		await openScanner(page, { phases: { capture: { autoCapture: false } } });
		await cameraRunning(page);

		await test.step("auto-capture starts off, with the thumbnail dead while there are no pages", async () => {
			await expect(page.getByTestId("autoCapture")).toHaveAttribute("aria-pressed", "false");
			await expect(page.getByTestId("thumbnail")).toBeDisabled();
		});

		await test.step("the page is outlined, but nothing is captured by itself", async () => {
			await expect(page.locator(".mds-boundary polygon")).toHaveAttribute("points", /\d/, {
				timeout: 30_000,
			});
			await page.waitForTimeout(5_000);
			await expect(rectifyScreen(page)).toHaveCount(0);
		});

		await test.step("turned on, auto-capture captures by itself", async () => {
			await page.getByTestId("autoCapture").click();
			// Auto-capture can take a page and leave the capture screen before a check of
			// the toggle runs. The smoke scenario checks the toggle instead.
			await expect(rectifyScreen(page)).toBeVisible({ timeout: 30_000 });
		});
	},
);

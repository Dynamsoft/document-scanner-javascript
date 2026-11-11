import { cameraRunning, expect, openScanner, rectifyScreen, test } from "../../support/scanner";

// The hint while auto-capture waits for a page too far away.

test.use({ camera: "far" });

test(
	"asks the user to move closer to a page too far away, and does not take it",
	{ tag: "@document" },
	async ({ page }) => {
		await openScanner(page);
		await cameraRunning(page);
		const hint = page.getByRole("status");

		await test.step("the page is outlined, and the hint asks the user to move closer", async () => {
			await expect(page.locator(".mds-boundary polygon")).toHaveAttribute("points", /\d/, {
				timeout: 30_000,
			});
			await expect(hint).toHaveText("Move closer", { timeout: 10_000 });
		});

		await test.step("auto-capture leaves the page", async () => {
			await page.waitForTimeout(5_000);
			await expect(rectifyScreen(page)).toHaveCount(0);
			await expect(hint).toHaveText("Move closer");
		});
	},
);

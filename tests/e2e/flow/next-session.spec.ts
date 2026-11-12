import type { Page } from "playwright/test";
import {
	cameraRunning,
	cancelScan,
	finishScan,
	expect,
	openScanner,
	pageCount,
	rectifyButton,
	rectifyScreen,
	resetAndScanAgain,
	resetScanner,
	scanAgain,
	scanStatus,
	test,
} from "../support/scanner";

// What carries over from one session to the next.

test.use({ camera: "empty" });

test("keeps the user's auto-capture choice for the session, and starts the next from the settings", async ({
	page,
}) => {
	await openScanner(page);
	await cameraRunning(page);
	const toggle = page.getByTestId("autoCapture");
	await expect(toggle).toHaveAttribute("aria-pressed", "true");
	await toggle.click();
	await expect(toggle).toHaveAttribute("aria-pressed", "false");

	// A trip to rectify after capture and back stays within the session.
	await page.getByTestId("shutter").click();
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 60_000 });
	await rectifyButton(page, "retake").click();
	await cameraRunning(page);
	await expect(toggle).toHaveAttribute("aria-pressed", "false");

	await cancelScan(page);
	await scanAgain(page);
	await cameraRunning(page);
	await expect(toggle).toHaveAttribute("aria-pressed", "true");
});

/** Start a scan, take one page with the shutter, and finish, keeping the page. */
async function keepOnePage(page: Page): Promise<void> {
	await openScanner(page, {
		phases: { capture: { autoCapture: false }, rectify: { modes: { afterCapture: false } } },
	});
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("1");
	expect(await finishScan(page)).toHaveLength(1);
}

test("carries the kept pages into the next session, even past cancel() between sessions", async ({
	page,
}) => {
	await keepOnePage(page);
	await cancelScan(page);
	await scanAgain(page);
	await cameraRunning(page);
	expect(await finishScan(page)).toHaveLength(1);
});

test("starts the next session empty after reset()", async ({ page }) => {
	await keepOnePage(page);
	await resetScanner(page);
	await scanAgain(page);
	await cameraRunning(page);
	// The thumbnail is off only while the document is empty.
	await expect(page.getByTestId("thumbnail")).toBeDisabled();
});

test("ends a running session as cancelled on reset()", async ({ page }) => {
	await openScanner(page);
	await cameraRunning(page);
	await resetScanner(page);
	expect(await scanStatus(page)).toBe("cancelled");
	await expect(page.locator(".mds-scanner")).toHaveCount(0);
});

test("starts an empty session when scan() follows reset() during a session", async ({ page }) => {
	await openScanner(page, {
		phases: { capture: { autoCapture: false }, rectify: { modes: { afterCapture: false } } },
	});
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("1");
	expect(await resetAndScanAgain(page)).toBe("cancelled");
	await cameraRunning(page);
	// The thumbnail is off only while the document is empty.
	await expect(page.getByTestId("thumbnail")).toBeDisabled();
});

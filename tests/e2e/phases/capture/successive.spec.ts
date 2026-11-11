import { cameraRunning, expect, openScanner, pageCount, test } from "../../support/scanner";

// Auto-capture takes the next page only after the last has left the view.

test.use({ camera: "swapped" });

test("takes one page each time a page is put down", { tag: "@document" }, async ({ page }) => {
	await openScanner(page, { phases: { rectify: { modes: { afterCapture: false } } } });
	await cameraRunning(page);
	await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("1");
	await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("2");
	await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("3");
});

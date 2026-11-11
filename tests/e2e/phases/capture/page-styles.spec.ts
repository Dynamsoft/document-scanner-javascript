import { cameraRunning, expect, openScanner, test } from "../../support/scanner";

// The page's own styles and the capture screen. It runs in every browser.

test("a page's rule for every video leaves the camera video the size of the viewfinder", async ({
	page,
}) => {
	// A page that styles its own videos, as a page with a preview of its own does.
	await page.addInitScript(() =>
		document.addEventListener("DOMContentLoaded", () => {
			const sheet = document.createElement("style");
			sheet.textContent =
				"video { width: 50%; height: 50%; max-width: 40vw; max-height: 40vh; margin: 1rem; padding: 1rem; border: 4px solid; }";
			document.head.append(sheet);
		}),
	);
	await openScanner(page, { phases: { capture: { autoCapture: false } } });
	await cameraRunning(page);
	const boxes = await page.evaluate(() => {
		const box = (selector: string) => {
			const { x, y, width, height } = document.querySelector(selector)!.getBoundingClientRect();
			return { x, y, width, height };
		};
		return { video: box(".mds-capture video"), viewfinder: box('[data-mds-area="viewfinder"]') };
	});
	expect(boxes.video).toEqual(boxes.viewfinder);
});

import type { Page } from "playwright/test";
import {
	cameraRunning,
	editButton,
	editScreen,
	expect,
	openScanner,
	rectifyScreen,
	test,
} from "../support/scanner";

// The edges of Document Viewer's viewers where the area they fill has a fractional
// size, as a phone's layout gives it. The engine sizes its canvas in whole pixels,
// so a strip of what lies behind the canvas shows at the right and the bottom.

/** The ratio of device pixels to CSS pixels of a Pixel 7 Pro. */
const RATIO = 3.5;

test.use({ camera: "still", deviceScaleFactor: RATIO });

/**
 * Give the viewer area `area` a fractional size, and return the colors of the
 * device pixels between the canvas and the area's right and bottom edges.
 */
async function strip(page: Page, area: string): Promise<string[]> {
	await page.addStyleTag({
		content: `${area} { flex: none !important; width: 363.43px; height: 600.71px; }`,
	});
	await page.evaluate(() => window.dispatchEvent(new Event("resize")));
	// The page's own canvas, not that of the thumbnails inside the edit viewer.
	const main = page.locator(`${area} > .ddv-main-canvas`);
	const canvas = main.locator(
		":scope > .ddv-core > .ddv-main-and-thumbnail > .ddv-main-container .ddv-canvas-container",
	);
	await expect.poll(async () => (await canvas.boundingBox())?.width).toBe(363);
	const [outer, inner] = [(await main.boundingBox())!, (await canvas.boundingBox())!];
	const shot = await page.screenshot();
	return page.evaluate(
		async ({ png, outer, inner }) => {
			const bitmap = await createImageBitmap(
				await (await fetch(`data:image/png;base64,${png}`)).blob(),
			);
			// From the screenshot, since a browser can ignore the ratio asked for.
			const ratio = bitmap.width / innerWidth;
			const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext("2d")!;
			context.drawImage(bitmap, 0, 0);
			const device = (css: number) => Math.round(css * ratio);
			const color = (x: number, y: number) =>
				context.getImageData(x, y, 1, 1).data.slice(0, 3).join(",");
			const colors: string[] = [];
			for (let x = device(inner.x + inner.width); x < device(outer.x + outer.width); x++) {
				colors.push(color(x, device(outer.y + outer.height / 2)));
			}
			for (let y = device(inner.y + inner.height); y < device(outer.y + outer.height); y++) {
				// Left of the middle, where the edit screen's float bar does not reach.
				colors.push(color(device(outer.x + outer.width / 8), y));
			}
			return colors;
		},
		{ png: shot.toString("base64"), outer, inner },
	);
}

/** The color of the screen's stage behind the viewer, as the strip's pixels give it. */
async function stageColor(page: Page, stage: string): Promise<string> {
	return page.locator(stage).evaluate((element) => {
		const [red, green, blue] = getComputedStyle(element).backgroundColor.match(/\d+/g)!;
		return `${red},${green},${blue}`;
	});
}

test(
	"the rectify screen shows only its stage around the image at a fractional size",
	{ tag: "@document" },
	async ({ page }) => {
		await openScanner(page);
		await cameraRunning(page);
		await expect(rectifyScreen(page)).toBeVisible({ timeout: 60_000 });
		const colors = await strip(page, ".mds-rectify-viewer");
		expect(new Set(colors)).toEqual(new Set([await stageColor(page, ".mds-rectify-stage")]));
	},
);

test("the edit screen shows only its stage around the page at a fractional size", async ({
	page,
}) => {
	await openScanner(page, {
		phases: { capture: { autoCapture: false }, rectify: { modes: { afterCapture: false } } },
	});
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect(page.locator(".mds-capture-count")).toHaveText("1", { timeout: 30_000 });
	await page.getByTestId("thumbnail").click();
	await expect(editButton(page, "done")).toBeVisible();
	await expect(editScreen(page)).toBeVisible();
	const colors = await strip(page, ".mds-edit-viewer");
	expect(new Set(colors)).toEqual(new Set([await stageColor(page, ".mds-edit-stage")]));
});

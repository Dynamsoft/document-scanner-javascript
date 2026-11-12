import type { Page } from "playwright/test";
import {
	boxArea,
	cameraRunning,
	finishScan,
	editButton,
	editScreen,
	expect,
	firstEditPage,
	openScanner,
	quadSelection,
	rectifyButton,
	rectifyScreen,
	rotateFirstPage,
	selectQuad,
	test,
	viewerDocuments,
} from "../support/scanner";
import type { Quad } from "../support/scanner";
import { FRAME } from "../support/scene";

// The rectify screen opened from the edit screen.

test.use({ camera: "still" });

/** Corners inside any camera's frame. */
const CORNERS: Quad = [
	[100, 80],
	[500, 90],
	[490, 380],
	[110, 370],
];

/** Take a page with the shutter, keep it rectified to `CORNERS`, and open the edit screen. */
async function keepRectifiedPage(page: Page): Promise<void> {
	// Auto-capture is off, because it takes the page again after Keep.
	await openScanner(page, { phases: { capture: { autoCapture: false } } });
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 60_000 });
	await selectQuad(page, CORNERS);
	await rectifyButton(page, "apply").click();
	await expect(rectifyScreen(page)).toBeHidden();
	await page.getByTestId("thumbnail").click();
	await expect(editScreen(page)).toBeVisible();
}

test("starts from the page's original, and the whole page puts it back", async ({ page }) => {
	await keepRectifiedPage(page);

	await test.step("the closed rectify screen lets go of its image", async () => {
		expect(await viewerDocuments(page)).toEqual({ separate: true, rectifyPages: 0 });
	});

	await test.step("borders opens the rectify screen on the original, with the page's boundary", async () => {
		await editButton(page, "rectify").click();
		await expect(rectifyScreen(page)).toBeVisible();
		expect(await viewerDocuments(page)).toEqual({ separate: true, rectifyPages: 1 });
		expect(await quadSelection(page)).toEqual(CORNERS);
	});

	await test.step("a sideways drag leaves the image where it is", async () => {
		const area = rectifyScreen(page).locator(".mds-rectify-viewer");
		const box = (await area.boundingBox())!;
		const before = await area.screenshot();
		await page.mouse.move(box.x + box.width - 5, box.y + 60);
		await page.mouse.down();
		await page.mouse.move(box.x + 5, box.y + 60, { steps: 10 });
		const during = await area.screenshot();
		await page.mouse.up();
		expect(during.equals(before)).toBe(true);
	});

	await test.step("the whole page as the boundary puts the original back", async () => {
		await rectifyButton(page, "fullImage").click();
		await rectifyButton(page, "apply").click();
		await expect(editScreen(page)).toBeVisible();
		const [first] = await finishScan(page);
		const [width, height] = first!.original;
		expect(first?.processed).toEqual([width, height]);
		expect(first?.boundary).toEqual([
			{ x: 0, y: 0 },
			{ x: width, y: 0 },
			{ x: width, y: height },
			{ x: 0, y: height },
		]);
	});
});

test("apply with no corner moved keeps the page's rotation", async ({ page }) => {
	await keepRectifiedPage(page);
	await rotateFirstPage(page, 90);
	await expect.poll(async () => (await firstEditPage(page)).rotation).toBe(90);
	await editButton(page, "rectify").click();
	await expect(rectifyScreen(page)).toBeVisible();
	await rectifyButton(page, "apply").click();
	await expect(editScreen(page)).toBeVisible();
	expect((await firstEditPage(page)).rotation).toBe(90);
});

test("undo takes back each change to the boundary, and a new image starts with none", async ({
	page,
}) => {
	// Auto-capture is off, because it takes a page again after retake.
	await openScanner(page, { phases: { capture: { autoCapture: false } } });
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 60_000 });
	const undo = rectifyButton(page, "undo");
	const found = await quadSelection(page);
	await expect(undo).toBeDisabled();

	await test.step("each change is one step back, the newest first", async () => {
		await selectQuad(page, CORNERS);
		await rectifyButton(page, "fullImage").click();
		await undo.click();
		expect(await quadSelection(page)).toEqual(CORNERS);
		await undo.click();
		expect(await quadSelection(page)).toEqual(found);
		await expect(undo).toBeDisabled();
	});

	await test.step("the next image starts with nothing to take back", async () => {
		await selectQuad(page, CORNERS);
		await expect(undo).toBeEnabled();
		await rectifyButton(page, "retake").click();
		await cameraRunning(page);
		await page.getByTestId("shutter").click();
		await expect(rectifyScreen(page)).toBeVisible({ timeout: 60_000 });
		await expect(undo).toBeDisabled();
	});
});

test(
	"rectifies a page to the edges found when it was taken, and borders opens on them again",
	{ tag: "@document" },
	async ({ page }) => {
		// Auto-capture is off, because it takes the page again after Keep.
		await openScanner(page, { phases: { capture: { autoCapture: false } } });
		await cameraRunning(page);
		await page.getByTestId("shutter").click();
		await expect(rectifyScreen(page)).toBeVisible({ timeout: 60_000 });
		const found = await quadSelection(page);
		expect(boxArea(found)).toBeGreaterThan(0);
		expect(boxArea(found)).toBeLessThan(FRAME.width * FRAME.height * 0.9);
		await rectifyButton(page, "apply").click();
		await expect(rectifyScreen(page)).toBeHidden();
		await page.getByTestId("thumbnail").click();
		await expect(editScreen(page)).toBeVisible();
		const rectified = await firstEditPage(page);
		expect(rectified.width).toBeLessThan(FRAME.width * 0.7);

		await test.step("borders opens on the edges found, and the whole page puts the original back", async () => {
			await editButton(page, "rectify").click();
			await expect(rectifyScreen(page)).toBeVisible();
			expect(await quadSelection(page)).toEqual(found);
			await rectifyButton(page, "fullImage").click();
			await rectifyButton(page, "apply").click();
			await expect(editScreen(page)).toBeVisible();
			expect(await firstEditPage(page)).toMatchObject({
				uid: rectified.uid,
				width: FRAME.width,
				height: FRAME.height,
			});
		});

		await test.step("detect borders finds the same edges on the original, and apply rectifies it again", async () => {
			await editButton(page, "rectify").click();
			await expect(rectifyScreen(page)).toBeVisible();
			await rectifyButton(page, "detectBoundary").click();
			await expect.poll(() => quadSelection(page), { timeout: 10_000 }).toEqual(found);
			await rectifyButton(page, "apply").click();
			await expect(editScreen(page)).toBeVisible();
			expect(await firstEditPage(page)).toMatchObject({
				uid: rectified.uid,
				width: rectified.width,
				height: rectified.height,
			});
			const [first] = await finishScan(page);
			expect(first?.boundary).toEqual(found?.map(([x, y]) => ({ x, y })));
		});
	},
);

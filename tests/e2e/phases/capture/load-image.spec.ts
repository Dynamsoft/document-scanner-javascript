import type { Page } from "playwright/test";
import {
	cameraRunning,
	expect,
	openScanner,
	pageCount,
	rectifyButton,
	rectifyScreen,
	test,
} from "../../support/scanner";

// Load image on the capture screen, with files chosen in the browser's file picker.

/** Draw a light sheet of paper on a dark desk in the browser, and return the drawing as a PNG. */
async function photographOfPage(page: Page): Promise<Buffer> {
	const dataUrl = await page.evaluate(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 1200;
		canvas.height = 900;
		const context = canvas.getContext("2d")!;
		context.fillStyle = "#202020";
		context.fillRect(0, 0, 1200, 900);
		context.fillStyle = "#f4f4f4";
		context.fillRect(250, 120, 700, 660);
		return canvas.toDataURL("image/png");
	});
	return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
}

/** Press load image, and choose a file with `buffer` as its content. */
async function chooseFile(page: Page, name: string, buffer: Buffer): Promise<void> {
	const chooser = page.waitForEvent("filechooser");
	await page.getByTestId("loadImage").click();
	await (await chooser).setFiles({ name, mimeType: "image/png", buffer });
}

test("loads an image file onto the rectify screen, and keeps it as a page", async ({ page }) => {
	await openScanner(page, { phases: { capture: { autoCapture: false } } });
	await cameraRunning(page);
	await chooseFile(page, "page.png", await photographOfPage(page));
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 30_000 });
	await rectifyButton(page, "apply").click();
	await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("1");
});

test("shows a notice for a file that is not an image, and stays on the capture screen", async ({
	page,
}) => {
	await openScanner(page, { phases: { capture: { autoCapture: false } } });
	await cameraRunning(page);
	// The fixture dismisses each notice that has a Dismiss button. This test needs the
	// notice to stay.
	const dismiss = page.getByRole("button", { name: "Dismiss" });
	await page.removeLocatorHandler(dismiss);
	await chooseFile(page, "page.png", Buffer.from("not an image"));
	const notice = page.getByRole("dialog", { name: "Could not open the file" });
	await expect(notice).toBeVisible();
	await dismiss.click();
	await expect(notice).toBeHidden();
	await expect(rectifyScreen(page)).toBeHidden();
	await expect(page.getByTestId("thumbnail")).toBeDisabled();
});

import type { Page } from "playwright/test";
import {
	cameraRunning,
	editButton,
	editScreen,
	expect,
	finishScan,
	firstPageFilter,
	openScanner,
	pageOrder,
	selectedPages,
	thumbnailRows,
	test,
} from "../support/scanner";

// The edit screen's own buttons over Document Viewer's real edit viewer.

test("moves between pages, rotates with undo and redo, toggles the thumbnails, and deletes every page and brings them back", async ({
	page,
}) => {
	const errors: Error[] = [];
	page.on("pageerror", (error) => errors.push(error));
	await openScanner(page, {
		phases: { capture: { autoCapture: false }, rectify: { modes: { afterCapture: false } } },
	});
	await cameraRunning(page);
	const pageNumber = editScreen(page).locator(".mds-edit-page-number");
	/** The pages in the order they were taken. */
	let taken: string[] = [];

	await test.step("two pages taken open on the edit screen", async () => {
		for (const count of ["1", "2"]) {
			await page.getByTestId("shutter").click();
			await expect(page.locator(".mds-capture-count")).toHaveText(count, { timeout: 30_000 });
		}
		await page.getByTestId("thumbnail").click();
		await expect(editScreen(page)).toBeVisible();
		await expect(pageNumber).toHaveText("1/2");
		await expect(editButton(page, "previousPage")).toBeDisabled();
		taken = await pageOrder(page);
	});

	await test.step("the page buttons move between the pages", async () => {
		await editButton(page, "nextPage").click();
		await expect(pageNumber).toHaveText("2/2");
		await expect(editButton(page, "nextPage")).toBeDisabled();
		await editButton(page, "previousPage").click();
		await expect(pageNumber).toHaveText("1/2");
	});

	await test.step("undo starts on for the pages taken, and rotate ends redo", async () => {
		await expect(editButton(page, "undo")).toBeEnabled();
		await editButton(page, "rotate").click();
		await expect(editButton(page, "undo")).toBeEnabled();
		await expect(editButton(page, "redo")).toBeDisabled();
		await editButton(page, "undo").click();
		await expect(editButton(page, "redo")).toBeEnabled();
	});

	await test.step("the thumbnails show and hide again", async () => {
		const thumbnails = editButton(page, "thumbnails");
		await expect(thumbnails).toHaveAttribute("aria-pressed", "false");
		await thumbnails.click();
		await expect(thumbnails).toHaveAttribute("aria-pressed", "true");
		await thumbnails.click();
		await expect(thumbnails).toHaveAttribute("aria-pressed", "false");
	});

	await test.step("delete removes each page, and the screen stays up when none is left", async () => {
		await editButton(page, "delete").click();
		await expect(pageNumber).toHaveText("1/1");
		await editButton(page, "delete").click();
		await expect(pageNumber).toHaveText("0/0");
		await expect(editScreen(page)).toBeVisible();
		for (const button of ["done", "delete", "rectify", "rotate"] as const) {
			await expect(editButton(page, button)).toBeDisabled();
		}
	});

	await test.step("undo brings back each deleted page and shows it, and the scan finishes with them", async () => {
		await editButton(page, "undo").click();
		await expect(pageNumber).toHaveText("1/1");
		// The second undo puts the first page taken back in front, and the edit screen shows it.
		await editButton(page, "undo").click();
		await expect.poll(() => pageOrder(page)).toEqual(taken);
		await expect(pageNumber).toHaveText("1/2");
		for (const button of ["done", "delete", "rectify", "rotate", "redo"] as const) {
			await expect(editButton(page, button)).toBeEnabled();
		}
		expect(await finishScan(page)).toHaveLength(2);
	});

	expect(errors).toEqual([]);
});

/** Take `pageCount` pages, and open the edit screen on them with its thumbnails showing. */
async function editWithThumbnails(page: Page, pageCount: number): Promise<void> {
	await openScanner(page, {
		phases: { capture: { autoCapture: false }, rectify: { modes: { afterCapture: false } } },
	});
	await cameraRunning(page);
	for (let count = 1; count <= pageCount; count++) {
		await page.getByTestId("shutter").click();
		await expect(page.locator(".mds-capture-count")).toHaveText(String(count), {
			timeout: 30_000,
		});
	}
	await page.getByTestId("thumbnail").click();
	await expect(editScreen(page)).toBeVisible();
	await editButton(page, "thumbnails").click();
}

test("undo and redo of a drag of two thumbnails put each order back", async ({ page }) => {
	await editWithThumbnails(page, 4);
	const start = await pageOrder(page);
	/** The order of the pages, by their order at the start: ABCD. */
	const order = async () =>
		(await pageOrder(page)).map((uid) => "ABCD"[start.indexOf(uid)]).join("");

	await test.step("a click selects one page, Shift-click selects A and B, and a drag takes both below D", async () => {
		const row = await thumbnailRows(page);
		const { x } = row(0);
		await page.mouse.click(x, row(1).y);
		await expect.poll(() => selectedPages(page)).toEqual([1]);
		await page.mouse.click(x, row(0).y);
		await page.keyboard.down("Shift");
		await page.mouse.click(x, row(1).y);
		await page.keyboard.up("Shift");
		await page.mouse.move(x, row(0).y);
		await page.mouse.down();
		await page.mouse.move(x, row(3.45).y, { steps: 25 });
		await page.mouse.up();
		await expect.poll(order).toBe("CDAB");
	});

	await test.step("undo puts the first order back, and redo the order after the drag", async () => {
		await editButton(page, "undo").click();
		await expect.poll(order).toBe("ABCD");
		await editButton(page, "redo").click();
		await expect.poll(order).toBe("CDAB");
	});
});

test.describe("on a touch screen", () => {
	test.use({ hasTouch: true });

	test("each tap on a thumbnail adds its page to the selection, or takes it out", async ({
		page,
	}) => {
		await editWithThumbnails(page, 2);
		const row = await thumbnailRows(page);
		await expect.poll(() => selectedPages(page)).toEqual([]);
		await page.touchscreen.tap(row(0).x, row(0).y);
		await page.touchscreen.tap(row(1).x, row(1).y);
		await expect.poll(() => selectedPages(page)).toEqual([0, 1]);
		await page.touchscreen.tap(row(0).x, row(0).y);
		await expect.poll(() => selectedPages(page)).toEqual([1]);
	});

	test("delete removes every page selected, and undo brings them all back", async ({ page }) => {
		await editWithThumbnails(page, 3);
		const start = await pageOrder(page);
		const row = await thumbnailRows(page);
		await page.touchscreen.tap(row(0).x, row(0).y);
		await page.touchscreen.tap(row(2).x, row(2).y);
		await expect.poll(() => selectedPages(page)).toEqual([0, 2]);
		await editButton(page, "delete").click();
		await expect.poll(() => pageOrder(page)).toEqual([start[1]]);
		await editButton(page, "undo").click();
		await expect.poll(() => pageOrder(page)).toEqual(start);
	});
});

test("the filter mode changes the page's filter only on apply, as one change in the history", async ({
	page,
}) => {
	const errors: Error[] = [];
	page.on("pageerror", (error) => errors.push(error));
	await openScanner(page, {
		phases: { capture: { autoCapture: false }, rectify: { modes: { afterCapture: false } } },
	});
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect(page.locator(".mds-capture-count")).toHaveText("1", { timeout: 30_000 });
	await page.getByTestId("thumbnail").click();
	await expect(editScreen(page)).toBeVisible();
	const modeBar = editScreen(page).locator(".mds-edit-mode-header");
	const choice = (filter: string) => editScreen(page).locator(`[data-mds-filter="${filter}"]`);

	await test.step("the filter mode shows a preview of the page under each filter", async () => {
		await editButton(page, "filter").click();
		await expect(modeBar).toBeVisible();
		await expect(editScreen(page).locator(".mds-edit-filter-preview")).toHaveCount(6);
		await expect(choice("none")).toHaveAttribute("aria-pressed", "true");
	});

	await test.step("a filter chosen shows on the page, and cancel takes it back", async () => {
		await choice("blackAndWhite").click();
		await expect
			.poll(() => firstPageFilter(page))
			.toEqual({ filter: "blackAndWhite", blackOrWhite: true });
		await modeBar.getByTestId("cancel").click();
		await expect.poll(() => firstPageFilter(page)).toEqual({ filter: "none", blackOrWhite: false });
		await expect(modeBar).toBeHidden();
	});

	await test.step("apply keeps the filter, as one change for undo and redo", async () => {
		await editButton(page, "filter").click();
		await choice("blackAndWhite").click();
		await expect(choice("blackAndWhite")).toHaveAttribute("aria-pressed", "true");
		await modeBar.getByTestId("apply").click();
		await expect(modeBar).toBeHidden();
		await expect
			.poll(() => firstPageFilter(page))
			.toEqual({ filter: "blackAndWhite", blackOrWhite: true });
		await editButton(page, "undo").click();
		await expect.poll(() => firstPageFilter(page)).toEqual({ filter: "none", blackOrWhite: false });
		await editButton(page, "redo").click();
		await expect
			.poll(() => firstPageFilter(page))
			.toEqual({ filter: "blackAndWhite", blackOrWhite: true });
	});

	expect(errors).toEqual([]);
});

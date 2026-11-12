import type { Page } from "playwright/test";
import {
	cameraRunning,
	cancelScan,
	disposeScanner,
	editButton,
	editScreen,
	expect,
	openScanner,
	pageCount,
	quadSelection,
	rectifyButton,
	rectifyScreen,
	scanAgain,
	scanFailure,
	selectQuad,
	test,
} from "../support/scanner";
import type { Quad } from "../support/scanner";

// Where the document scanner's .mds-scanner element and its screens go, and the
// page's scroll behind them.

/** Read how the page's own scroller overflows. */
function pageOverflow(page: Page): Promise<string> {
	return page.evaluate(() => getComputedStyle(document.documentElement).overflow);
}

test("covers the viewport from document.body, the default container, and from a body named as one", async ({
	page,
}) => {
	const onBody = page.locator("body > .mds-scanner");
	/** Check that the element on the body is fixed over the whole viewport, painted. */
	const coversViewport = async (): Promise<void> => {
		await expect(onBody).toHaveCSS("position", "fixed");
		// The default theme's background, read from the theme's custom property.
		await expect(onBody).toHaveCSS("background-color", "rgb(0, 0, 0)");
		expect(await onBody.boundingBox()).toEqual({ x: 0, y: 0, ...page.viewportSize() });
	};
	await openScanner(page);
	await cameraRunning(page);
	await coversViewport();
	await cancelScan(page);
	await openScanner(page, { container: "body" });
	await cameraRunning(page);
	await coversViewport();
});

test("removes its element when each scan ends, and when it is disposed of during one", async ({
	page,
}) => {
	await openScanner(page);
	await cameraRunning(page);
	const element = page.locator("body > .mds-scanner");
	await expect(element).toHaveCount(1);

	await test.step("cancel() removes it", async () => {
		await cancelScan(page);
		await expect(element).toHaveCount(0);
	});

	await test.step("the next scan adds it again, and dispose() removes it", async () => {
		await scanAgain(page);
		await cameraRunning(page);
		await expect(element).toHaveCount(1);
		expect(await disposeScanner(page)).toBe("cancelled");
		await expect(element).toHaveCount(0);
	});
});

test("shows the edit screen in its own container uncovered, with capture on the body", async ({
	page,
}) => {
	await openScanner(page, {
		phases: {
			capture: { autoCapture: false },
			rectify: { modes: { afterCapture: false } },
			edit: { container: "#container" },
		},
	});
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("1");
	await page.getByTestId("thumbnail").click();
	await expect(editScreen(page)).toBeVisible();
	await expect(page.locator("body > .mds-scanner")).toBeHidden();
	// With nothing covering the viewport, the page scrolls again.
	expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
		"visible",
	);
	const onTop = await page.evaluate(() => {
		const top = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
		return document.querySelector("#container")?.contains(top) ?? false;
	});
	expect(onTop).toBe(true);
});

test("opens rectify where the screen that opened it is, and its viewer still works after the move", async ({
	page,
}) => {
	await openScanner(page, {
		phases: { capture: { autoCapture: false }, edit: { container: "#container" } },
	});
	// Smaller than the viewport, so the move changes the viewer's size.
	await page.evaluate(() => {
		document.querySelector<HTMLElement>("#container")!.style.inset = "0 50% 50% 0";
	});
	await cameraRunning(page);
	/** The rectify screen in the session's element in `container`. */
	const rectifyIn = (container: string) =>
		page.locator(`${container} > .mds-scanner > .mds-screen-rectify .mds-rectify`);

	await test.step("after a capture, on the body with the camera", async () => {
		await page.getByTestId("shutter").click();
		await expect(rectifyIn("body")).toBeVisible({ timeout: 60_000 });
		await rectifyButton(page, "apply").click();
		await expect(rectifyScreen(page)).toBeHidden();
	});

	await test.step("from edit, in the edit screen's container", async () => {
		await page.getByTestId("thumbnail").click();
		await expect(editScreen(page)).toBeVisible();
		await editButton(page, "rectify").click();
		await expect(rectifyIn("#container")).toBeVisible();
		await expect(page.locator("body > .mds-scanner")).toBeHidden();
		expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
			"visible",
		);
		// The viewer drew itself over the whole viewport first, and fits the container now.
		await expect
			.poll(() =>
				page.evaluate(() => {
					const box = document.querySelector("#container")!.getBoundingClientRect();
					const drawn = [...document.querySelectorAll(".mds-screen-rectify canvas")]
						.map((canvas) => canvas.getBoundingClientRect())
						.filter(({ width, height }) => width > 0 && height > 0);
					return (
						drawn.length > 0 &&
						drawn.every(
							(rect) =>
								rect.right <= box.right + 1 &&
								rect.bottom <= box.bottom + 1 &&
								rect.left >= box.left - 1 &&
								rect.top >= box.top - 1,
						)
					);
				}),
			)
			.toBe(true);
		// Small enough to sit inside any browser's own camera frame.
		const corners: Quad = [
			[20, 20],
			[200, 25],
			[195, 150],
			[25, 145],
		];
		await selectQuad(page, corners);
		expect(await quadSelection(page)).toEqual(corners);
		await rectifyButton(page, "apply").click();
		await expect(editScreen(page)).toBeVisible();
	});
});

test("fails the scan before the engines load when the edit container's selector matches nothing", async ({
	page,
}) => {
	const engineFiles: string[] = [];
	page.on("request", (request) => {
		if (new URL(request.url()).pathname.startsWith("/engine/")) engineFiles.push(request.url());
	});
	await openScanner(page, { phases: { edit: { container: "#nowhere" } } });
	expect(await scanFailure(page)).toMatchObject({ kind: "container", selector: "#nowhere" });
	expect(engineFiles).toEqual([]);
	await expect(page.locator(".mds-scanner")).toHaveCount(0);
});

test("holds the page's scroll while it covers the viewport, and gives back the page's own", async ({
	page,
}) => {
	await openScanner(page);
	await cameraRunning(page);
	expect(await pageOverflow(page)).toBe("hidden");
	await cancelScan(page);
	expect(await pageOverflow(page)).toBe("visible");

	await test.step("a page's own overflow comes back as it was", async () => {
		await page.evaluate(() => (document.documentElement.style.overflow = "scroll"));
		await scanAgain(page);
		await cameraRunning(page);
		expect(await pageOverflow(page)).toBe("hidden");
		await cancelScan(page);
		expect(await pageOverflow(page)).toBe("scroll");
	});
});

test("leaves the page's scroll alone in a container", async ({ page }) => {
	await openScanner(page, { container: "#container" });
	await cameraRunning(page);
	expect(await pageOverflow(page)).toBe("visible");
});

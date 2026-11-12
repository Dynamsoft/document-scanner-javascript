import {
	cameraRunning,
	expect,
	openScanner,
	pageCount,
	rectifyButton,
	rectifyScreen,
	test,
} from "../../support/scanner";

// Auto-capture never retakes a page left in place.

test.use({ camera: "still" });

test("a document left still is photographed once", { tag: "@document" }, async ({ page }) => {
	await openScanner(page, { phases: { rectify: { modes: { afterCapture: false } } } });
	await cameraRunning(page);
	await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("1");
	await page.waitForTimeout(6_000);
	expect(await pageCount(page)).toBe("1");
});

test(
	"a page the shutter took is not taken again by auto-capture",
	{ tag: "@document" },
	async ({ page }) => {
		await openScanner(page, { phases: { rectify: { modes: { afterCapture: false } } } });
		await cameraRunning(page);
		await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("1");
		// Take a second copy on purpose. Auto-capture must not add a third.
		await page.getByTestId("shutter").click();
		await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("2");
		await page.waitForTimeout(6_000);
		expect(await pageCount(page)).toBe("2");
	},
);

test(
	"a page the shutter took with auto-capture off is not taken again once it is turned on",
	{ tag: "@document" },
	async ({ page }) => {
		await openScanner(page, {
			phases: { capture: { autoCapture: false }, rectify: { modes: { afterCapture: false } } },
		});
		await cameraRunning(page);
		// The outline shows that detection has seen the page before the shutter.
		await expect(page.locator(".mds-boundary polygon")).toHaveAttribute("points", /\d/, {
			timeout: 30_000,
		});
		await page.getByTestId("shutter").click();
		await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("1");
		await page.getByTestId("autoCapture").click();
		await page.waitForTimeout(6_000);
		expect(await pageCount(page)).toBe("1");
	},
);

test("keep does not photograph the same page again", { tag: "@document" }, async ({ page }) => {
	// A reproduced bug, not fixed yet. Its fix removes this test.fail().
	test.fail();
	await openScanner(page);
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 60_000 });
	await rectifyButton(page, "apply").click();
	await expect(rectifyScreen(page)).toBeHidden();
	await page.waitForTimeout(6_000);
	await expect(rectifyScreen(page)).toBeHidden();
});

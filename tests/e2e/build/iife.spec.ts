import { expect, test } from "playwright/test";

// The IIFE build inlines both engines but must not start them on load. The global
// setup builds it.

test("loads the IIFE build without starting either engine", async ({ page }) => {
	await page.goto("/tests/e2e/fixtures/iife.html");
	const loaded = await page.evaluate(() => {
		const global = (window as typeof window & { Dynamsoft?: Record<string, unknown> }).Dynamsoft;
		return {
			scanner: typeof global?.DocumentScanner,
			captureVision: typeof (global?.Core as { CoreModule?: unknown } | undefined)?.CoreModule,
			documentViewer: typeof global?.DDV,
		};
	});
	expect(loaded).toEqual({
		scanner: "function",
		captureVision: "undefined",
		documentViewer: "undefined",
	});
});

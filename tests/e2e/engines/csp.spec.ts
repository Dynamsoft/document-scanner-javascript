import type { ScanResult } from "../../../src/index";
import type { Page } from "playwright/test";
import {
	cameraRunning,
	editButton,
	editScreen,
	expect,
	rectifyButton,
	rectifyScreen,
	test,
} from "../support/scanner";

// The fixture's policy allows only what the engines and the screens need. The
// engines load from the CDN on another origin.

type PolicyWindow = typeof window & {
	preloaded: Promise<string>;
	violations: string[];
	scanner: { scan(): Promise<ScanResult> };
	result: Promise<ScanResult>;
};

/** Open the fixture, and wait until both engines loaded or failed to load. */
async function openFixture(page: Page): Promise<string> {
	await page.goto("/tests/e2e/fixtures/csp.html");
	return page.evaluate(() => (window as PolicyWindow).preloaded);
}

/** The policy violations that the page reported. */
function violations(page: Page): Promise<string[]> {
	return page.evaluate(() => (window as PolicyWindow).violations);
}

test("loads both engines from the CDN under a restrictive content security policy", async ({
	page,
}) => {
	expect(await openFixture(page)).toBe("loaded");
	expect(await violations(page)).toEqual([]);
});

test("runs a whole scan under the same policy, through every screen, to a PDF", async ({
	page,
}) => {
	expect(await openFixture(page)).toBe("loaded");
	await page.evaluate(() => {
		const policyWindow = window as PolicyWindow;
		policyWindow.result = policyWindow.scanner.scan();
	});
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect(rectifyScreen(page)).toBeVisible({ timeout: 30_000 });
	await rectifyButton(page, "apply").click();
	await expect(rectifyScreen(page)).toBeHidden();
	await page.getByTestId("thumbnail").click();
	await expect(editScreen(page)).toBeVisible({ timeout: 30_000 });
	await editButton(page, "done").click();
	const outcome = await page.evaluate(async () => {
		const result = await (window as PolicyWindow).result;
		return result.status === "success"
			? { pages: result.pages.length, format: result.output?.format }
			: { status: result.status };
	});
	expect(outcome).toEqual({ pages: 1, format: "pdf" });
	expect(await violations(page)).toEqual([]);
});

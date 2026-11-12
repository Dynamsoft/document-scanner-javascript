import type { ScannerError } from "../../../src/index";
import {
	cameraRunning,
	expect,
	finishScan,
	openScanner,
	pageCount,
	scanFailure,
	test,
} from "../support/scanner";
import type { ScanWindow } from "../support/scanner";

// The document scanner's events, on the page that drives it.

test.use({ camera: "empty" });

test("fires done with the result while the screens are up, before scan() resolves", async ({
	page,
}) => {
	await openScanner(page, {
		phases: { capture: { autoCapture: false }, rectify: { modes: { afterCapture: false } } },
	});
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("1");
	await page.evaluate(() => {
		const scan = (window as ScanWindow).scan;
		const heard: string[] = [];
		(window as typeof window & { heard: string[] }).heard = heard;
		void scan.result.then(() => heard.push("resolved"));
		scan.scanner.on("done", async ({ pages }) => {
			const up = document.querySelector(".mds-scanner") !== null;
			heard.push(`done ${pages.length} ${up ? "up" : "down"}`);
		});
	});
	expect(await finishScan(page)).toHaveLength(1);
	expect(await page.evaluate(() => (window as typeof window & { heard: string[] }).heard)).toEqual([
		"done 1 up",
		"resolved",
	]);
});

test("fires documentChange with each page taken, as 1.5's onDocumentScanned did", async ({
	page,
}) => {
	await openScanner(page, {
		phases: { capture: { autoCapture: false }, rectify: { modes: { afterCapture: false } } },
	});
	await page.evaluate(() => {
		const heard: string[] = [];
		(window as typeof window & { heard: string[] }).heard = heard;
		(window as ScanWindow).scan.scanner.on("documentChange", (change) => {
			if (change.type === "pagesAdded")
				heard.push(`${change.pages.length} of ${change.state.pageCount}`);
		});
	});
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect
		.poll(() => page.evaluate(() => (window as typeof window & { heard: string[] }).heard), {
			timeout: 30_000,
		})
		.toEqual(["1 of 1"]);
});

test("fires navigate as a taken page opens the rectify screen in its after-capture mode", async ({
	page,
}) => {
	await openScanner(page, { phases: { capture: { autoCapture: false } } });
	await page.evaluate(() => {
		const heard: string[] = [];
		(window as typeof window & { heard: string[] }).heard = heard;
		(window as ScanWindow).scan.scanner.on("navigate", (move) => {
			if (move.type === "phase") heard.push(`${move.from} to ${move.to}`);
			if (move.type === "mode") heard.push(`${move.phase} ${move.from} to ${move.to}`);
		});
	});
	await cameraRunning(page);
	await page.getByTestId("shutter").click();
	await expect
		.poll(() => page.evaluate(() => (window as typeof window & { heard: string[] }).heard), {
			timeout: 30_000,
		})
		.toEqual(["capture to rectify", "rectify null to afterCapture"]);
});

test("fires error for a session that fails", async ({ page }) => {
	await openScanner(page, { container: "#no-such-container" });
	await scanFailure(page);
	const heard = await page.evaluate(async () => {
		const { scanner } = (window as ScanWindow).scan;
		const errors: ScannerError[] = [];
		scanner.on("error", (error) => void errors.push(error));
		await scanner.scan();
		return errors.map(({ kind }) => kind);
	});
	expect(heard).toEqual(["container"]);
});

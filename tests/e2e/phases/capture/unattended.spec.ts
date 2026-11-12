import {
	cameraRunning,
	finishScan,
	expect,
	openScanner,
	pageCount,
	photographAtTwiceTheFrame,
	rectifyScreen,
	test,
} from "../../support/scanner";
import { FRAME } from "../../support/scene";

// Capture with the after-capture screen off.

test.use({ camera: "still" });

test(
	"captures and rectifies a page without leaving the capture screen",
	{ tag: "@document" },
	async ({ page }) => {
		await openScanner(page, { phases: { rectify: { modes: { afterCapture: false } } } });
		await cameraRunning(page);

		await test.step("a page is captured with no change of screen", async () => {
			await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe("1");
			await expect(rectifyScreen(page)).toHaveCount(0);
		});

		await test.step("the capture screen's controls still take taps", async () => {
			for (const control of ["shutter", "autoCapture", "thumbnail"]) {
				const covered = await page.getByTestId(control).evaluate((element) => {
					const box = element.getBoundingClientRect();
					const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
					return !element.contains(top);
				});
				expect(covered, `${control} is covered`).toBe(false);
			}
		});

		await test.step("the page comes out rectified to the boundary found on it", async () => {
			const [first] = await finishScan(page);
			expect(first?.origin).toBe("camera");
			expect(first?.original).toEqual([FRAME.width, FRAME.height]);
			expect(first?.processed[0]).toBeLessThan(FRAME.width * 0.7);
			expect(first?.boundary).not.toContainEqual({ x: 0, y: 0 });
		});
	},
);

test(
	"keeps each page's boundary inside its own image, where the camera takes photographs",
	{ tag: "@document" },
	async ({ page, browserName }) => {
		test.skip(browserName === "firefox", "Firefox has no ImageCapture");
		await photographAtTwiceTheFrame(page);
		await openScanner(page, {
			phases: { capture: { autoCapture: false }, rectify: { modes: { afterCapture: false } } },
		});
		await cameraRunning(page);
		// The shutter takes a page as auto-capture does, and the scene holds still.
		for (const count of ["1", "2", "3", "4"]) {
			await page.getByTestId("shutter").click();
			await expect.poll(() => pageCount(page), { timeout: 30_000 }).toBe(count);
		}
		for (const { original, boundary } of await finishScan(page)) {
			const [width, height] = original;
			const inside = boundary.every(({ x, y }) => x >= 0 && x <= width && y >= 0 && y <= height);
			// A corner of the boundary on a corner of the image, as a whole page has.
			const onCorner = boundary.some(
				({ x, y }) => (x === 0 || x === width) && (y === 0 || y === height),
			);
			expect({ inside, onCorner }).toEqual({ inside: true, onCorner: false });
		}
	},
);

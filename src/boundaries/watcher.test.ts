import { describe, expect, it } from "vite-plus/test";
import type { Quadrilateral } from "../results";
import { Watcher } from "./watcher";
import type { Box, FrameSize } from "./framing";

/** The size of the frame, 1600 by 900 pixels. */
const SIZE: FrameSize = { width: 1600, height: 900 };

/** An outline `width` by `height` pixels, with its top-left corner at `left`, `top`. */
function outline(left: number, top: number, width: number, height: number): Quadrilateral {
	return {
		points: [
			{ x: left, y: top },
			{ x: left + width, y: top },
			{ x: left + width, y: top + height },
			{ x: left, y: top + height },
		],
	};
}

/**
 * A page's outline, 680 by 620 pixels, with its top-left corner at `left`, `top`.
 * It fills nearly a third of the frame.
 */
function page(left: number, top = 50): Quadrilateral {
	return outline(left, top, 680, 620);
}

/**
 * A watcher that needs `minStableFrames` still frames, and waits for a good framing
 * unless `waitForFraming` is false.
 */
function watcherOf(minStableFrames: number, waitForFraming = true): Watcher {
	return new Watcher({ minStableFrames, waitForFraming });
}

/**
 * Let the watcher see one boundary for `count` frames. Return which frames offered
 * a page.
 */
function seeFrames(
	watcher: Watcher,
	boundary: Quadrilateral | null,
	count: number,
	region: Box | null = null,
): boolean[] {
	return Array.from({ length: count }, () => watcher.see(boundary, SIZE, region).take);
}

describe("Watcher", () => {
	it("offers a page once it has held still for the frames asked for", () => {
		const watcher = watcherOf(2);
		// The first frame has nothing to compare with. The next two hold still.
		expect(seeFrames(watcher, page(300), 3)).toEqual([false, false, true]);
	});

	it("does not offer a page that keeps moving", () => {
		const watcher = watcherOf(2);
		const offered = Array.from(
			{ length: 10 },
			(_, frame) => watcher.see(page(300 + frame * 40), SIZE, null).take,
		);
		expect(offered).not.toContain(true);
	});

	it("takes a page left in place once", () => {
		const watcher = watcherOf(2);
		seeFrames(watcher, page(300), 3);
		expect(watcher.take()).toBe(true);
		watcher.finishTaking(true);
		expect(seeFrames(watcher, page(300), 30)).not.toContain(true);
	});

	it("keeps the last page taken through jitter, a missed frame and a slow drift", () => {
		const watcher = watcherOf(2);
		seeFrames(watcher, page(300), 3);
		watcher.take();
		watcher.finishTaking(true);
		// Jitter of a few pixels either way.
		expect(
			[page(303), page(298), page(301)].map((each) => watcher.see(each, SIZE, null).take),
		).not.toContain(true);
		// One frame where the detector found nothing.
		expect(seeFrames(watcher, null, 1)).toEqual([false]);
		expect(seeFrames(watcher, page(300), 5)).not.toContain(true);
		// A drift of two pixels a frame, 120 in all, keeps most of the overlap.
		const drift = Array.from(
			{ length: 60 },
			(_, frame) => watcher.see(page(300 + frame * 2), SIZE, null).take,
		);
		expect(drift).not.toContain(true);
	});

	it("offers a page again once the last one has been gone for five frames", () => {
		const watcher = watcherOf(2);
		seeFrames(watcher, page(300), 3);
		watcher.take();
		watcher.finishTaking(true);
		seeFrames(watcher, null, 4);
		// Four frames away is not enough.
		expect(seeFrames(watcher, page(300), 3)).toEqual([false, false, false]);
		seeFrames(watcher, null, 5);
		expect(seeFrames(watcher, page(300), 3)).toEqual([false, false, true]);
	});

	it("offers a page moved well away from the last one", () => {
		const watcher = watcherOf(2);
		seeFrames(watcher, page(100), 3);
		watcher.take();
		watcher.finishTaking(true);
		// 400 pixels over, the outlines share under half their area. The old page
		// counts as gone from the first frame and is forgotten on the fifth.
		expect(seeFrames(watcher, page(500), 5)).toEqual([false, false, false, false, true]);
	});

	it("offers a page moved straight up or down out of the last one's place", () => {
		const watcher = watcherOf(2);
		// A wide page, 900 by 400, that shares nothing with its old place.
		seeFrames(watcher, outline(300, 20, 900, 400), 3);
		watcher.take();
		watcher.finishTaking(true);
		expect(seeFrames(watcher, outline(300, 480, 900, 400), 5)).toEqual([
			false,
			false,
			false,
			false,
			true,
		]);
	});

	it("counts a flat outline, which covers no area, as sharing none with the next", () => {
		const flat: Quadrilateral = {
			points: [
				{ x: 300, y: 50 },
				{ x: 980, y: 50 },
				{ x: 980, y: 50 },
				{ x: 300, y: 50 },
			],
		};
		// A flat outline is too far away, so only a watcher that ignores the framing
		// takes it.
		const watcher = watcherOf(2, false);
		seeFrames(watcher, flat, 3);
		watcher.take();
		watcher.finishTaking(true);
		expect(seeFrames(watcher, flat, 5)).toEqual([false, false, false, false, true]);
	});

	it("takes one page at a time, from a frame or the shutter", () => {
		const watcher = watcherOf(2);
		expect(watcher.taking).toBe(false);
		expect(watcher.take()).toBe(true);
		expect(watcher.taking).toBe(true);
		expect(watcher.take()).toBe(false);
		// A page that holds still is not offered while another is being taken.
		expect(seeFrames(watcher, page(300), 3)).toEqual([false, false, false]);
		watcher.finishTaking(true);
		expect(watcher.taking).toBe(false);
		expect(watcher.take()).toBe(true);
	});

	it("remembers a page taken with the shutter", () => {
		const watcher = watcherOf(2);
		// Held still, but the frame that would offer it has not arrived yet.
		seeFrames(watcher, page(300), 2);
		watcher.take();
		watcher.finishTaking(true);
		expect(seeFrames(watcher, page(300), 10)).not.toContain(true);
	});

	it("does not count a page as taken when taking it failed", () => {
		const watcher = watcherOf(2);
		seeFrames(watcher, page(300), 3);
		watcher.take();
		watcher.finishTaking(false);
		expect(seeFrames(watcher, page(300), 1)).toEqual([true]);
	});

	it("forgets the last page taken, and the frames before, when told to", () => {
		const watcher = watcherOf(2);
		seeFrames(watcher, page(300), 3);
		watcher.take();
		watcher.finishTaking(true);
		watcher.forget();
		expect(seeFrames(watcher, page(300), 3)).toEqual([false, false, true]);
	});

	it("counts a frame with no page in it as the page gone even when nothing was taken", () => {
		const watcher = watcherOf(2);
		seeFrames(watcher, page(300), 2);
		// Losing the page resets the count of still frames.
		seeFrames(watcher, null, 1);
		expect(seeFrames(watcher, page(300), 3)).toEqual([false, false, true]);
	});
});

describe("Watcher, on the framing of each page", () => {
	/** A page 300 by 200 pixels, too far away in the frame. */
	const far = outline(600, 300, 300, 200);

	/** Let the watcher see `boundary` for `count` frames. Return the issue it waits for in each. */
	function waits(
		watcher: Watcher,
		boundary: Quadrilateral | null,
		count: number,
		region: Box | null = null,
	) {
		return Array.from({ length: count }, () => watcher.see(boundary, SIZE, region).waitsFor);
	}

	it("does not offer a page with a framing issue, however still it holds", () => {
		expect(seeFrames(watcherOf(2), far, 10)).not.toContain(true);
	});

	it("names the issue that holds the page back once it has lasted five frames", () => {
		expect(waits(watcherOf(2), far, 6)).toEqual([null, null, null, null, "tooFar", "tooFar"]);
	});

	it("keeps the issue through four frames with no page, and drops it on the fifth", () => {
		const watcher = watcherOf(2);
		waits(watcher, far, 5);
		expect(waits(watcher, null, 5)).toEqual(["tooFar", "tooFar", "tooFar", "tooFar", null]);
		// Back again, the page waits its five frames anew.
		expect(waits(watcher, far, 5)).toEqual([null, null, null, null, "tooFar"]);
	});

	it("waits for nothing while the page taken last is pulled back too far", () => {
		const watcher = watcherOf(2);
		seeFrames(watcher, page(300), 3);
		watcher.take();
		watcher.finishTaking(true);
		// 600 by 400 is too far away, but it covers most of the page taken.
		expect(waits(watcher, outline(340, 100, 600, 400), 10)).not.toContain("tooFar");
	});

	it("counts the frames again when the issue changes", () => {
		const watcher = watcherOf(2);
		waits(watcher, far, 5);
		const close = outline(300, 0, 680, 900);
		expect(waits(watcher, close, 5)).toEqual([null, null, null, null, "tooClose"]);
		expect(waits(watcher, page(300), 1)).toEqual([null]);
	});

	it("counts a frame with a framing issue as no page in the count of still frames", () => {
		const watcher = watcherOf(2);
		const still = outline(500, 250, 600, 400);
		// Too far away in the frame, but not in a region 1000 by 600.
		const region: Box = { left: 300, top: 150, right: 1300, bottom: 750 };
		seeFrames(watcher, still, 3);
		expect(seeFrames(watcher, still, 3, region)).toEqual([false, false, true]);
	});

	it("offers a page with a framing issue when told to ignore the framing, and waits for nothing", () => {
		const watcher = watcherOf(2, false);
		expect(seeFrames(watcher, far, 3)).toEqual([false, false, true]);
		expect(waits(watcher, far, 5)).toEqual([null, null, null, null, null]);
	});

	it("judges the page against the region it is given", () => {
		const region: Box = { left: 400, top: 100, right: 1200, bottom: 800 };
		expect(seeFrames(watcherOf(2), outline(500, 200, 600, 500), 3, region)).toEqual([
			false,
			false,
			true,
		]);
		// Clear of the frame's sides, but past the region's left side.
		expect(waits(watcherOf(2), outline(300, 200, 700, 500), 5, region).at(-1)).toBe("cutOff");
	});

	it("keeps the last page taken while it is pulled back too far", () => {
		const watcher = watcherOf(2);
		seeFrames(watcher, page(300), 3);
		watcher.take();
		watcher.finishTaking(true);
		// 600 by 400 is too far away, but it covers most of the page taken.
		seeFrames(watcher, outline(340, 100, 600, 400), 10);
		expect(seeFrames(watcher, page(300), 10)).not.toContain(true);
	});

	it("remembers a page with a framing issue taken with the shutter", () => {
		const watcher = watcherOf(2);
		seeFrames(watcher, outline(340, 100, 600, 400), 3);
		watcher.take();
		watcher.finishTaking(true);
		expect(seeFrames(watcher, page(300), 10)).not.toContain(true);
	});

	it("forgets the framing of the last page judged, when told to", () => {
		const watcher = watcherOf(2);
		// 790 is under half the width, and 804 over half. A page that was too far
		// needs 52%, or 832, to come close enough again.
		waits(watcher, outline(400, 230, 790, 440), 5);
		expect(waits(watcher, outline(400, 230, 804, 440), 1)).toEqual(["tooFar"]);
		watcher.forget();
		expect(waits(watcher, outline(400, 230, 804, 440), 5).at(-1)).toBeNull();
	});
});

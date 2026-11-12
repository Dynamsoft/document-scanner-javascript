import { describe, expect, it } from "vite-plus/test";
import type { Quadrilateral } from "../results";
import { Framing } from "./framing";
import type { Box, FrameSize, FramingIssue } from "./framing";

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
 * The issue of one page judged alone in a frame of `size`, inside `region`, or the
 * whole frame without one.
 */
function issueOf(
	page: Quadrilateral,
	region: Box | null = null,
	size: FrameSize = SIZE,
): FramingIssue | null {
	return new Framing().judge(page, size, region);
}

describe("Framing", () => {
	it("finds no issue in a page clear of the sides that fills half the frame's height", () => {
		expect(issueOf(outline(500, 200, 300, 450))).toBeNull();
	});

	it("finds no issue in a page clear of the sides that fills half the frame's width", () => {
		expect(issueOf(outline(400, 400, 800, 100))).toBeNull();
	});

	it("finds a page that fills less than half the frame's width and height to be too far away", () => {
		expect(issueOf(outline(500, 200, 799, 449))).toBe("tooFar");
	});

	it("finds a page that touches two opposite sides to be too close", () => {
		expect(issueOf(outline(300, 0, 680, 900))).toBe("tooClose");
		expect(issueOf(outline(0, 100, 1600, 600))).toBe("tooClose");
	});

	it("finds a page that touches one side, or two sides that meet, to be cut off", () => {
		expect(issueOf(outline(0, 100, 900, 600))).toBe("cutOff");
		expect(issueOf(outline(700, 300, 900, 600))).toBe("cutOff");
	});

	it("counts a side as touched at most one percent of the frame's shorter side away", () => {
		// One percent of 900 is 9 pixels.
		expect(issueOf(outline(9, 100, 900, 600))).toBe("cutOff");
		expect(issueOf(outline(10, 100, 900, 600))).toBeNull();
	});

	it("keeps a touched side touched until the page is more than two percent away", () => {
		const framing = new Framing();
		const issue = (left: number) => framing.judge(outline(left, 100, 900, 600), SIZE, null);
		expect([issue(0), issue(12), issue(18), issue(19), issue(12)]).toEqual([
			"cutOff",
			"cutOff",
			"cutOff",
			null,
			null,
		]);
	});

	it("widens the margin only of the side that was touched", () => {
		const framing = new Framing();
		expect(framing.judge(outline(0, 100, 1586, 600), SIZE, null)).toBe("cutOff");
		// 14 pixels from the right side, which it never touched, and clear of the left.
		expect(framing.judge(outline(20, 100, 1566, 600), SIZE, null)).toBeNull();
	});

	it("keeps a page too far away until it fills 52 percent", () => {
		const framing = new Framing();
		const issue = (width: number) => framing.judge(outline(300, 300, width, 200), SIZE, null);
		// Half of 1600 is 800, and 52 percent is 832.
		expect([issue(799), issue(800), issue(831), issue(832), issue(800)]).toEqual([
			"tooFar",
			"tooFar",
			"tooFar",
			null,
			null,
		]);
	});

	it("keeps what it judged through a frame with no page", () => {
		const framing = new Framing();
		framing.judge(outline(0, 100, 900, 600), SIZE, null);
		// A frame with no page is not judged. The page comes back 12 pixels away.
		expect(framing.judge(outline(12, 100, 900, 600), SIZE, null)).toBe("cutOff");
	});

	it("forgets what it judged when told to", () => {
		const framing = new Framing();
		framing.judge(outline(0, 100, 900, 600), SIZE, null);
		framing.forget();
		expect(framing.judge(outline(12, 100, 900, 600), SIZE, null)).toBeNull();
	});

	it("judges the page against the region it is given", () => {
		const region: Box = { left: 400, top: 100, right: 1200, bottom: 800 };
		// Clear of the frame's sides, but past the region's left side.
		expect(issueOf(outline(300, 200, 700, 500), region)).toBe("cutOff");
		// 400 by 300 is too far away in the frame, but fills half the region's width.
		expect(issueOf(outline(600, 300, 400, 300), region)).toBeNull();
	});

	describe("in a scan region 800 by 700 pixels, whose shorter side is 700", () => {
		const region: Box = { left: 400, top: 100, right: 1200, bottom: 800 };

		it("lets a page stick out past the region by five percent, or 35 pixels", () => {
			expect(issueOf(outline(366, 200, 700, 500), region)).toBeNull();
			expect(issueOf(outline(365, 200, 700, 500), region)).toBe("cutOff");
		});

		it("finds a page that sticks out past two opposite sides too close", () => {
			expect(issueOf(outline(350, 200, 900, 500), region)).toBe("tooClose");
		});

		it("keeps a side touched until the page sticks out by one percent less", () => {
			const framing = new Framing();
			const issue = (left: number) => framing.judge(outline(left, 200, 700, 500), SIZE, region);
			// Out by 36, 30, 28, and 27 pixels. It clears at 28 out, 35 less 1% of 700.
			expect([issue(364), issue(370), issue(372), issue(373)]).toEqual([
				"cutOff",
				"cutOff",
				"cutOff",
				null,
			]);
		});

		it("keeps the page clear of the frame's sides where the region reaches them", () => {
			const reaching: Box = { left: 0, top: 100, right: 1000, bottom: 800 };
			// Inside the region's allowance, but 5 pixels from the frame's left side.
			expect(issueOf(outline(5, 200, 700, 500), reaching)).toBe("cutOff");
		});
	});

	it("finds an issue in every page in a region with no area", () => {
		const empty: Box = { left: 800, top: 450, right: 800, bottom: 450 };
		expect(issueOf(outline(300, 50, 680, 620), empty)).not.toBeNull();
		expect(issueOf(outline(900, 500, 100, 100), empty)).not.toBeNull();
	});

	it("leaves room for a well-framed page of any shape, in a landscape or a portrait frame", () => {
		for (const size of [SIZE, { width: 900, height: 1600 }]) {
			const { width, height } = size;
			for (const aspect of [0.1, 0.2, 0.3, 0.5, 0.707, 1, 1.414, 2, 3, 5, 10]) {
				// The largest page of this shape at 90 percent of the frame, centered.
				const scale = 0.9 * Math.min(width / aspect, height);
				const [w, h] = [scale * aspect, scale];
				const page = outline((width - w) / 2, (height - h) / 2, w, h);
				expect(issueOf(page, null, size), `aspect ${aspect}`).toBeNull();
			}
		}
	});
});

import { describe, expect, it } from "vite-plus/test";
import type { Quadrilateral } from "../results";
import { fromQuad, isWholePage, sameBoundary, samePage, toQuad, wholePage } from "./quads";

const SKEWED: Quadrilateral = {
	points: [
		{ x: 300, y: 200 },
		{ x: 1300, y: 260 },
		{ x: 1250, y: 1000 },
		{ x: 350, y: 950 },
	],
};

describe("quads", () => {
	it("turns a quadrilateral into corner pairs and back without change", () => {
		expect(toQuad(SKEWED)).toEqual([
			[300, 200],
			[1300, 260],
			[1250, 1000],
			[350, 950],
		]);
		expect(fromQuad(toQuad(SKEWED))).toEqual(SKEWED);
	});

	it("bounds a page with nothing detected by the whole of it, clockwise from the top left", () => {
		expect(wholePage(1280, 720).points).toEqual([
			{ x: 0, y: 0 },
			{ x: 1280, y: 0 },
			{ x: 1280, y: 720 },
			{ x: 0, y: 720 },
		]);
	});

	it("counts a boundary within a pixel of every corner as the whole page", () => {
		const nearly: Quadrilateral = {
			points: [
				{ x: 1, y: 0 },
				{ x: 1279, y: 1 },
				{ x: 1280, y: 719 },
				{ x: 0, y: 720 },
			],
		};
		expect(isWholePage(wholePage(1280, 720), 1280, 720)).toBe(true);
		expect(isWholePage(nearly, 1280, 720)).toBe(true);
	});

	it("does not count a boundary two pixels in, or a detected page, as the whole page", () => {
		const inset: Quadrilateral = {
			points: [
				{ x: 2, y: 0 },
				{ x: 1280, y: 0 },
				{ x: 1280, y: 720 },
				{ x: 0, y: 720 },
			],
		};
		expect(isWholePage(inset, 1280, 720)).toBe(false);
		expect(isWholePage(SKEWED, 1600, 1200)).toBe(false);
	});

	it("counts boundaries within a pixel of each other at every corner as the same", () => {
		const moved = (by: number): Quadrilateral => ({
			points: [
				SKEWED.points[0],
				SKEWED.points[1],
				{ x: 1250 + by, y: 1000 - by },
				SKEWED.points[3],
			],
		});
		expect(sameBoundary(SKEWED, SKEWED)).toBe(true);
		expect(sameBoundary(SKEWED, moved(1))).toBe(true);
		expect(sameBoundary(SKEWED, moved(2))).toBe(false);
	});

	it("counts a corner as the same only within the share of the measured image's diagonal", () => {
		// The reference at half the size, with its first corner 150 pixels off once
		// scaled back, which is 7.5% of the diagonal of 2000.
		const [, b, c, d] = SKEWED.points.map(({ x, y }) => ({ x: x / 2, y: y / 2 }));
		const half: Quadrilateral = { points: [{ x: 150, y: 175 }, b!, c!, d!] };
		const big = { width: 1600, height: 1200 };
		const small = { width: 800, height: 600 };
		expect([
			samePage(SKEWED, big, half, small, 0.1),
			samePage(SKEWED, big, half, small, 0.05),
		]).toEqual([true, false]);
	});
});

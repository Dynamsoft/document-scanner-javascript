import type { Quadrilateral } from "../results";

// Judging how well each viewfinder frame's page sits in the region it must be inside,
// and in the frame.

/**
 * A page that fills less than this share of its region's width and of its height
 * is too far away. It could grow to twice its size and still fit.
 */
const FAR_FILL = 0.5;

/** A page that was too far away stays too far until it fills this share. */
const NEAR_FILL = 0.52;

/**
 * A page within this margin of a side of the frame, as a share of the frame's
 * shorter side, touches that side. The engine puts a corner that the frame cuts
 * at the side, or a pixel or two inside it.
 */
const TOUCH_MARGIN = 0.01;

/**
 * A page may stick out past a side of its region by this share of the region's
 * shorter side before it touches that side.
 */
const OUTSIDE_MARGIN = 0.05;

/**
 * A side that the page touched stays touched until the page is this much further
 * in, as a share of the same shorter side, so that a corner's jitter does not turn
 * the issue on and off.
 */
const CLEAR_MARGIN = 0.01;

/**
 * What is wrong with how a page sits in its region and in the frame. A page
 * touches a side when it sticks out past the region's side by more than a little,
 * or comes near the frame's side.
 * - `tooFar`: it fills less than half of the region's width and of its height.
 * - `tooClose`: it touches two opposite sides.
 * - `cutOff`: it touches one side, or two sides that meet, so the region or the
 *   frame probably cuts it off.
 */
export type FramingIssue = "tooFar" | "tooClose" | "cutOff";

/** An upright rectangle, in the frame's pixels. */
export interface Box {
	readonly left: number;
	readonly top: number;
	readonly right: number;
	readonly bottom: number;
}

/** The size of the camera's frames, in pixels. */
export interface FrameSize {
	readonly width: number;
	readonly height: number;
}

/** The box of a whole frame of `size`. */
function wholeFrame({ width, height }: FrameSize): Box {
	return { left: 0, top: 0, right: width, bottom: height };
}

/** The smallest upright rectangle around an outline. */
export function boundingBox({ points }: Quadrilateral): Box {
	const xs = points.map(({ x }) => x);
	const ys = points.map(({ y }) => y);
	return {
		left: Math.min(...xs),
		top: Math.min(...ys),
		right: Math.max(...xs),
		bottom: Math.max(...ys),
	};
}

/** Which sides the page touches, in its region or the frame, and whether it is too far away. */
interface Sides {
	readonly top: boolean;
	readonly right: boolean;
	readonly bottom: boolean;
	readonly left: boolean;
	readonly far: boolean;
}

const CLEAR: Sides = { top: false, right: false, bottom: false, left: false, far: false };

/**
 * Judges how well each frame's page sits in its region and in the frame. It
 * remembers the last page it judged, so that a page near a limit needs a wider
 * margin to cross it back. A frame with no page keeps that memory, since one
 * missed detection does not move the page. A region with no area finds an issue
 * in every page. Without a scan region, the region is the whole frame.
 */
export class Framing {
	#sides: Sides = CLEAR;

	/**
	 * Judge `page` in a frame of `size`, inside `region`, or inside the whole frame
	 * when `region` is `null`. Return what is wrong with it, or `null` for nothing.
	 */
	judge(page: Quadrilateral, size: FrameSize, region: Box | null): FramingIssue | null {
		const frame = wholeFrame(size);
		const sides = judgeSides(boundingBox(page), region ?? frame, frame, this.#sides);
		this.#sides = sides;
		if ((sides.top && sides.bottom) || (sides.left && sides.right)) return "tooClose";
		if (sides.top || sides.right || sides.bottom || sides.left) return "cutOff";
		return sides.far ? "tooFar" : null;
	}

	/** Forget the last page judged. */
	forget(): void {
		this.#sides = CLEAR;
	}
}

/**
 * Which sides the page in `outer` touches, in `region` and `frame`, given those it
 * touched `before`, and whether it is too far away in `region`.
 */
function judgeSides(outer: Box, region: Box, frame: Box, before: Sides): Sides {
	const width = region.right - region.left;
	const height = region.bottom - region.top;
	const regionSide = Math.min(width, height);
	const frameSide = Math.min(frame.right - frame.left, frame.bottom - frame.top);
	/**
	 * Whether a page `inRegion` and `inFrame` in from a side touches it. A margin
	 * below zero is outside.
	 */
	const touches = (inRegion: number, inFrame: number, touched: boolean) => {
		const clear = touched ? CLEAR_MARGIN : 0;
		const regionLimit = (clear - OUTSIDE_MARGIN) * regionSide;
		const frameLimit = (clear + TOUCH_MARGIN) * frameSide;
		return inRegion <= regionLimit || inFrame <= frameLimit;
	};
	const fill = Math.max((outer.right - outer.left) / width, (outer.bottom - outer.top) / height);
	return {
		top: touches(outer.top - region.top, outer.top - frame.top, before.top),
		right: touches(region.right - outer.right, frame.right - outer.right, before.right),
		bottom: touches(region.bottom - outer.bottom, frame.bottom - outer.bottom, before.bottom),
		left: touches(outer.left - region.left, outer.left - frame.left, before.left),
		far: fill < (before.far ? NEAR_FILL : FAR_FILL),
	};
}

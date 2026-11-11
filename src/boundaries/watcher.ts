import type { Quadrilateral } from "../results";
import { boundingBox, Framing } from "./framing";
import type { Box, FrameSize, FramingIssue } from "./framing";

// Deciding from each viewfinder frame's outline when to take a page.

/**
 * The most a corner may move between frames for the page to count as still, as
 * a fraction of the outline's diagonal. Hands shake, and the engine's outline
 * jitters by a pixel or two.
 */
const STILL_TOLERANCE = 0.02;

/**
 * The overlap below which the last page taken counts as gone. A camera drifting
 * in the hand keeps most of it.
 */
const LEAVE_OVERLAP = 0.5;

/**
 * How many frames in a row the last page taken must be gone before another may be
 * taken. It is about half a second. One missed detection is not enough.
 */
const LEAVE_FRAMES = 5;

/**
 * How many frames in a row a framing issue must hold the page back before the
 * watcher reports it. It is about half a second, so that a page passing through
 * is not reported.
 */
const WAIT_FRAMES = 5;

/** What the watcher makes of one frame. */
export interface Sighting {
	/** Whether to take the page now. */
	readonly take: boolean;
	/**
	 * The framing issue that has held the page back for `WAIT_FRAMES` frames, or
	 * `null`. A page that the detector misses for fewer than `LEAVE_FRAMES` frames
	 * keeps its issue. It is always `null` while the watcher ignores the framing, and
	 * for the page taken last.
	 */
	readonly waitsFor: FramingIssue | null;
}

/** How the watcher decides. */
export interface WatcherOptions {
	/** How many frames in a row a page must hold still before it is taken. */
	readonly minStableFrames: number;
	/** Whether a page with a framing issue counts as no page. */
	readonly waitForFraming: boolean;
}

/**
 * Decides from each frame's outline when to take a page. A page is taken once it
 * has held still, no other page is being taken, and the last page taken has left
 * the view. A page with a framing issue counts as no page, unless the watcher
 * ignores the framing.
 */
export class Watcher {
	readonly #options: WatcherOptions;
	readonly #framing = new Framing();
	/** The latest frame's outline, framing issue or not. */
	#latest: Quadrilateral | null = null;
	/** The previous frame's page, unless it counted as no page. */
	#previous: Quadrilateral | null = null;
	/** How many frames in a row the outline has held still. */
	#stillFrames = 0;
	/** The outline of the last page taken, until it leaves the view. */
	#taken: Quadrilateral | null = null;
	/** How many frames in a row the last page taken has been gone. */
	#goneFrames = 0;
	/** Whether a page is being taken and not yet stored. */
	#taking = false;
	/** The framing issue that holds the page back, and for how many frames it has. */
	#waiting: { readonly issue: FramingIssue | null; readonly frames: number } = NO_WAIT;
	/** How many frames in a row the detector has found no page. */
	#missedFrames = 0;

	/** A watcher that decides by `options`. */
	constructor(options: WatcherOptions) {
		this.#options = options;
	}

	/**
	 * Take in the outline of one frame of `size`, with the `region` that a page must
	 * be inside, or `null` for the whole frame. Say whether to take the page now, and
	 * which framing issue holds it back.
	 */
	see(boundary: Quadrilateral | null, size: FrameSize, region: Box | null): Sighting {
		const issue = boundary && this.#framing.judge(boundary, size, region);
		const page = issue && this.#options.waitForFraming ? null : boundary;
		const previous = this.#previous;
		const held = previous !== null && page !== null && holdsStill(previous, page);
		this.#stillFrames = held ? this.#stillFrames + 1 : 0;
		this.#previous = page;
		this.#latest = boundary;
		// A page pulled back too far is still the page taken, so the outline decides
		// whether it left, framing issue or not.
		if (this.#taken) {
			const gone = boundary === null || overlap(this.#taken, boundary) < LEAVE_OVERLAP;
			this.#goneFrames = gone ? this.#goneFrames + 1 : 0;
			if (this.#goneFrames >= LEAVE_FRAMES) this.#taken = null;
		}
		const take =
			page !== null &&
			this.#taken === null &&
			!this.#taking &&
			this.#stillFrames >= this.#options.minStableFrames;
		// Only an issue that alone keeps a new page from being taken. The page taken
		// last waits for nothing.
		const blocking = page === null && this.#taken === null ? issue : null;
		this.#wait(boundary === null ? undefined : blocking);
		const { issue: waitsFor, frames } = this.#waiting;
		return { take, waitsFor: frames >= WAIT_FRAMES ? waitsFor : null };
	}

	/**
	 * Count the frames that `issue` holds the page back, `null` for none, or
	 * `undefined` for a frame with no page. A short gap of frames with no page keeps
	 * the count.
	 */
	#wait(issue: FramingIssue | null | undefined): void {
		if (issue === undefined) {
			this.#missedFrames += 1;
			if (this.#missedFrames >= LEAVE_FRAMES) this.#waiting = NO_WAIT;
			return;
		}
		this.#missedFrames = 0;
		const { issue: was, frames } = this.#waiting;
		this.#waiting = { issue, frames: issue === was ? frames + 1 : 1 };
	}

	/** Whether a page is being taken, from `take()` until `finishTaking()`. */
	get taking(): boolean {
		return this.#taking;
	}

	/**
	 * Record that a page is being taken, unless one already is, and return whether
	 * it was recorded. The latest frame's page now counts as taken.
	 */
	take(): boolean {
		if (this.#taking) return false;
		this.#taking = true;
		this.#taken = this.#latest;
		this.#goneFrames = 0;
		return true;
	}

	/**
	 * Report that the page being taken was stored, or that taking it failed. A page
	 * that failed no longer counts as taken.
	 */
	finishTaking(stored: boolean): void {
		this.#taking = false;
		if (!stored) this.#taken = null;
	}

	/** Forget the frames and the last page taken. Called when watching stops. */
	forget(): void {
		this.#framing.forget();
		this.#waiting = NO_WAIT;
		this.#missedFrames = 0;
		this.#latest = null;
		this.#previous = null;
		this.#stillFrames = 0;
		this.#taken = null;
		this.#goneFrames = 0;
	}
}

/** No framing issue, counted for no frames. */
const NO_WAIT = { issue: null, frames: 0 } as const;

/** Whether every corner stayed within `STILL_TOLERANCE` of where it was. */
function holdsStill(before: Quadrilateral, now: Quadrilateral): boolean {
	const [corner, , opposite] = now.points;
	const limit = Math.hypot(opposite.x - corner.x, opposite.y - corner.y) * STILL_TOLERANCE;
	return now.points.every((point, index) => {
		const was = before.points[index];
		return Math.hypot(point.x - was.x, point.y - was.y) <= limit;
	});
}

/** The area two outlines' bounding boxes share divided by the area they cover. */
function overlap(first: Quadrilateral, second: Quadrilateral): number {
	const a = boundingBox(first);
	const b = boundingBox(second);
	const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
	const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
	const shared = width * height;
	const covered = area(a) + area(b) - shared;
	// Outlines that cover no area share none.
	return covered > 0 ? shared / covered : 0;
}

/** The area of an upright rectangle. */
function area({ left, top, right, bottom }: Box): number {
	return (right - left) * (bottom - top);
}

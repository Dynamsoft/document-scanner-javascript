// What the fake camera shows. A light page with dark lines lies on a dark desk.

/** Every frame's size in pixels. It is the first size the document scanner asks for. */
export const FRAME = { width: 1920, height: 1440 } as const;

/** The page's size and top edge, in pixels. */
const PAGE = { width: 1020, height: 1240, top: 100 } as const;

/** The brightness of the desk, paper, and lines, from 0 to 255. */
const SHADES = { desk: 40, paper: 235, ink: 70 } as const;

/** A dark bar for a line of text, placed from the page's top-left corner. */
interface Line {
	readonly left: number;
	readonly top: number;
	readonly width: number;
	readonly height: number;
}

/** The pages a video can show, told apart by their lines. */
const LAYOUTS = {
	/** Six narrow lines. */
	first: Array.from({ length: 6 }, (_, line) => ({
		left: 90,
		top: 180 + line * 140,
		width: 750,
		height: 52,
	})),
	/** Four wider lines, further apart. */
	second: Array.from({ length: 4 }, (_, line) => ({
		left: 120,
		top: 220 + line * 240,
		width: 660,
		height: 80,
	})),
} satisfies Record<string, readonly Line[]>;

/**
 * One frame's page, by left edge and layout, or `null` for an empty desk. `scale`
 * shrinks the page and its lines, and `top` moves its top edge. They default to 1
 * and the top of `PAGE`.
 */
type Frame = {
	readonly left: number;
	readonly layout: keyof typeof LAYOUTS;
	readonly scale?: number;
	readonly top?: number;
} | null;

/** A video's frame rate and its frames, played in a loop. */
interface Video {
	readonly fps: number;
	readonly frames: readonly Frame[];
}

const repeat = (frame: Frame, count: number): Frame[] => Array<Frame>(count).fill(frame);

/** The left and top edges of a page at `scale` of its size, centered in the frame. */
const centered = (scale: number) => ({
	left: Math.round((FRAME.width - PAGE.width * scale) / 2),
	top: Math.round((FRAME.height - PAGE.height * scale) / 2),
	scale,
});

/** The videos a test can ask for. */
export const VIDEOS = {
	/** An empty desk, because the browsers' own fake cameras show no page either. */
	empty: { fps: 30, frames: [null] },
	/** Drifts right six pixels a frame for a second, then jumps back. */
	moving: {
		fps: 15,
		frames: Array.from({ length: 15 }, (_, frame) => ({ left: 450 + frame * 6, layout: "first" })),
	},
	/** Never moves. */
	still: { fps: 30, frames: [{ left: 450, layout: "first" }] },
	/**
	 * A page at 55% of its size, centered and too far away to be taken. The detector
	 * finds no page at 40%.
	 */
	far: { fps: 30, frames: [{ ...centered(0.55), layout: "first" }] },
	/** 1.6 seconds each of a page, an empty desk, another page, and an empty desk. */
	swapped: {
		fps: 5,
		frames: [
			...repeat({ left: 450, layout: "first" }, 8),
			...repeat(null, 8),
			...repeat({ left: 450, layout: "second" }, 8),
			...repeat(null, 8),
		],
	},
} satisfies Record<string, Video>;

export type VideoName = keyof typeof VIDEOS;

/** A rectangle filled with one gray, in pixels. */
export interface Rect {
	readonly left: number;
	readonly top: number;
	readonly width: number;
	readonly height: number;
	readonly shade: number;
}

/**
 * Everything needed to draw a video: its size, its frame rate, and each frame as
 * rectangles painted in order. The canvas camera gets it whole.
 */
export interface Scene {
	readonly width: number;
	readonly height: number;
	readonly fps: number;
	readonly frames: readonly (readonly Rect[])[];
}

/** The scene for one video. */
export function scene(name: VideoName): Scene {
	const { fps, frames } = VIDEOS[name];
	return { ...FRAME, fps, frames: frames.map(rectangles) };
}

/** One frame's rectangles: the desk, then the page and its lines on top. */
function rectangles(shown: Frame): Rect[] {
	const desk = { left: 0, top: 0, ...FRAME, shade: SHADES.desk };
	if (!shown) return [desk];
	const { scale = 1, top = PAGE.top } = shown;
	// The video writer paints whole pixels.
	const scaled = (length: number) => Math.round(length * scale);
	const page = {
		left: shown.left,
		top,
		width: scaled(PAGE.width),
		height: scaled(PAGE.height),
		shade: SHADES.paper,
	};
	const lines = LAYOUTS[shown.layout].map((line) => ({
		left: page.left + scaled(line.left),
		top: page.top + scaled(line.top),
		width: scaled(line.width),
		height: scaled(line.height),
		shade: SHADES.ink,
	}));
	return [desk, page, ...lines];
}

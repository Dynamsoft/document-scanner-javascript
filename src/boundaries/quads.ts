import type { Quad } from "dynamsoft-document-viewer";
import type { Point, Quadrilateral } from "../results";
import type { ImageSize } from "../document/images";

// Converting between `Quadrilateral` and Document Viewer's `Quad`, building the
// whole-page boundary, and comparing boundaries.

/**
 * The most a corner may move and still count as the same corner, in pixels. A
 * corner left one pixel in from the page's corner is not a chosen boundary.
 */
const CORNER_TOLERANCE = 1;

/** Turn a `Quadrilateral` into the four corner pairs Document Viewer takes. */
export function toQuad(boundary: Quadrilateral): Quad {
	const [first, second, third, fourth] = boundary.points;
	return [
		[first.x, first.y],
		[second.x, second.y],
		[third.x, third.y],
		[fourth.x, fourth.y],
	];
}

/** Turn Document Viewer's four corner pairs into a `Quadrilateral`. */
export function fromQuad(quad: Quad): Quadrilateral {
	const [first, second, third, fourth] = quad;
	return { points: [point(first), point(second), point(third), point(fourth)] };
}

function point([x, y]: readonly [number, number]): Point {
	return { x, y };
}

/** Build the whole-page boundary for a page where nothing was detected. */
export function wholePage(width: number, height: number): Quadrilateral {
	return {
		points: [
			{ x: 0, y: 0 },
			{ x: width, y: 0 },
			{ x: width, y: height },
			{ x: 0, y: height },
		],
	};
}

/** Whether a boundary is the whole page, give or take a pixel at each corner. */
export function isWholePage(boundary: Quadrilateral, width: number, height: number): boolean {
	return sameBoundary(boundary, wholePage(width, height));
}

/** Whether two boundaries match, give or take a pixel at each corner. */
export function sameBoundary(one: Quadrilateral, other: Quadrilateral): boolean {
	return one.points.every(
		(corner, index) =>
			Math.abs(corner.x - other.points[index].x) <= CORNER_TOLERANCE &&
			Math.abs(corner.y - other.points[index].y) <= CORNER_TOLERANCE,
	);
}

/**
 * Whether two boundaries of one scene, each in the pixels of its own image, mark
 * the same page. Once the reference is scaled to the measured image, each of its
 * corners lies within `share` of the measured image's diagonal from the measured
 * boundary's. Both list their corners in the same order, as every
 * `Quadrilateral` does.
 */
export function samePage(
	measured: Quadrilateral,
	measuredSize: ImageSize,
	reference: Quadrilateral,
	referenceSize: ImageSize,
	share: number,
): boolean {
	const scaleX = measuredSize.width / referenceSize.width;
	const scaleY = measuredSize.height / referenceSize.height;
	const limit = share * Math.hypot(measuredSize.width, measuredSize.height);
	return measured.points.every((corner, index) => {
		const { x, y } = reference.points[index];
		return Math.hypot(corner.x - x * scaleX, corner.y - y * scaleY) <= limit;
	});
}

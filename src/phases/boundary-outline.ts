import { BOUNDARY_CLASS } from "./capture-contract";
import type { Quadrilateral } from "../results";
import type { FrameSize } from "../boundaries/framing";

// The outline drawn in the viewfinder around the document the engine finds.

const SVG_NS = "http://www.w3.org/2000/svg";

/** The outline in the viewfinder. */
export interface BoundaryOutline {
	/** Draw a boundary whose corners are in the pixels of `frame`. */
	draw(boundary: Quadrilateral, frame: FrameSize): void;
	/** Erase the boundary until the next `draw`. */
	clear(): void;
}

/**
 * Add an empty outline to the viewfinder. The SVG fits its box as the video does,
 * so corners in frame pixels line up.
 */
export function createBoundaryOutline(viewfinder: HTMLElement): BoundaryOutline {
	const svg = document.createElementNS(SVG_NS, "svg");
	svg.setAttribute("class", BOUNDARY_CLASS);
	svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
	svg.setAttribute("aria-hidden", "true");
	const polygon = document.createElementNS(SVG_NS, "polygon");
	// Keeps the line the same width on screen at any frame size.
	polygon.setAttribute("vector-effect", "non-scaling-stroke");
	svg.append(polygon);
	viewfinder.append(svg);
	return {
		draw(boundary, frame) {
			// A camera that has not delivered a frame yet reports no size.
			if (frame.width <= 0 || frame.height <= 0) return;
			svg.setAttribute("viewBox", `0 0 ${frame.width} ${frame.height}`);
			polygon.setAttribute("points", boundary.points.map(({ x, y }) => `${x},${y}`).join(" "));
		},
		clear() {
			polygon.removeAttribute("points");
		},
	};
}

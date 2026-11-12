import { beforeEach, describe, expect, it } from "vite-plus/test";
import { BOUNDARY_CLASS } from "./capture-contract";
import type { Quadrilateral } from "../results";
import { createBoundaryOutline } from "./boundary-outline";
import type { BoundaryOutline } from "./boundary-outline";

const PAGE: Quadrilateral = {
	points: [
		{ x: 300, y: 50 },
		{ x: 980, y: 50 },
		{ x: 980, y: 670 },
		{ x: 300, y: 670 },
	],
};

const FRAME = { width: 1280, height: 720 };

let viewfinder: HTMLElement;

beforeEach(() => {
	viewfinder = document.createElement("div");
});

describe("createBoundaryOutline", () => {
	it("adds an empty outline to the viewfinder that screen readers skip", () => {
		createBoundaryOutline(viewfinder);
		expect(viewfinder.children).toHaveLength(1);
		const svg = viewfinder.firstElementChild!;
		expect(svg.getAttribute("class")).toBe(BOUNDARY_CLASS);
		expect(svg.getAttribute("aria-hidden")).toBe("true");
		expect(svg.querySelector("polygon")?.hasAttribute("points")).toBe(false);
	});
});

describe("BoundaryOutline", () => {
	let outline: BoundaryOutline;
	let svg: SVGSVGElement;
	let polygon: SVGPolygonElement;

	beforeEach(() => {
		outline = createBoundaryOutline(viewfinder);
		svg = viewfinder.querySelector("svg")!;
		polygon = svg.querySelector("polygon")!;
	});

	it("draws the corners in the frame's own pixels", () => {
		outline.draw(PAGE, FRAME);
		expect(svg.getAttribute("viewBox")).toBe("0 0 1280 720");
		expect(polygon.getAttribute("points")).toBe("300,50 980,50 980,670 300,670");
	});

	it("draws nothing for a frame with no size yet", () => {
		outline.draw(PAGE, { width: 0, height: 720 });
		expect(svg.hasAttribute("viewBox")).toBe(false);
		expect(polygon.hasAttribute("points")).toBe(false);
	});

	it("erases the boundary until the next draw", () => {
		outline.draw(PAGE, FRAME);
		outline.clear();
		expect(polygon.hasAttribute("points")).toBe(false);
		outline.draw(PAGE, FRAME);
		expect(polygon.getAttribute("points")).toBe("300,50 980,50 980,670 300,670");
	});
});

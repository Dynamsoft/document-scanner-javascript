import { afterEach, describe, expect, it } from "vite-plus/test";
import { endFakeSessions, newContainer } from "../../tests/fake-session";
import { ScannerFault } from "../faults";
import { resolveSettings } from "../settings/settings";
import type { ScannerSettings } from "../settings/settings";
import { DEFAULT_THEME } from "../settings/theme";
import { ScannerElements, defaultContainer, resolveContainers } from "./containers";

afterEach(() => {
	endFakeSessions();
});

describe("resolveContainers", () => {
	const containersFor = (settings: ScannerSettings) => resolveContainers(resolveSettings(settings));

	/** The containers when every screen goes in `container`. */
	const allIn = (container: HTMLElement) => ({
		capture: container,
		edit: container,
		rectify: { afterCapture: container, fromEdit: container },
	});

	it("makes the body every screen's container when none is named", () => {
		expect(containersFor({})).toEqual(allIn(defaultContainer()));
	});

	it("makes the global container every screen's container", () => {
		const globalContainer = newContainer();
		expect(containersFor({ container: globalContainer })).toEqual(allIn(globalContainer));
	});

	it("puts rectify where the screen that opens it is, when it has no container of its own", () => {
		const globalContainer = newContainer();
		const review = newContainer();
		expect(
			containersFor({ container: globalContainer, phases: { edit: { container: review } } }),
		).toEqual({
			capture: globalContainer,
			edit: review,
			rectify: { afterCapture: globalContainer, fromEdit: review },
		});
	});

	it("gives edit and rectify their own containers, found by element or selector", () => {
		const globalContainer = newContainer();
		const review = newContainer();
		review.id = "review";
		const corners = newContainer();
		const containers = containersFor({
			container: globalContainer,
			phases: { rectify: { container: corners }, edit: { container: "#review" } },
		});
		expect(containers).toEqual({
			capture: globalContainer,
			edit: review,
			rectify: { afterCapture: corners, fromEdit: corners },
		});
	});

	it("looks up no container of its own for a phase that never shows", () => {
		const globalContainer = newContainer();
		const modes = { afterCapture: false, fromEdit: false } as const;
		expect(
			containersFor({
				container: globalContainer,
				phases: { rectify: { container: "#nowhere", modes } },
			}),
		).toEqual(allIn(globalContainer));
		expect(containersFor({ container: globalContainer, phases: { edit: false } })).toEqual(
			allIn(globalContainer),
		);
		// With no edit screen, rectify opens only after a capture.
		const afterCaptureOff = { container: "#nowhere", modes: { afterCapture: false } } as const;
		expect(
			containersFor({
				container: globalContainer,
				phases: { rectify: afterCaptureOff, edit: false },
			}),
		).toEqual(allIn(globalContainer));
	});

	it("throws a container fault for any phase's selector that matches nothing", () => {
		expect(() => containersFor({ container: "#nowhere" })).toThrow(ScannerFault);
		expect(() => containersFor({ phases: { edit: { container: "#nowhere" } } })).toThrow(
			ScannerFault,
		);
		expect(() => containersFor({ phases: { rectify: { container: "#nowhere" } } })).toThrow(
			ScannerFault,
		);
	});
});

describe("ScannerElements", () => {
	const pageOverflow = () => document.documentElement.style.overflow;

	it("holds the page's scroll while its one element covers the viewport", () => {
		const elements = new ScannerElements(DEFAULT_THEME);
		expect(elements.getOrCreateIn(document.body)).toBe(elements.getOrCreateIn(document.body));
		expect(pageOverflow()).toBe("hidden");
		elements.remove();
		expect(pageOverflow()).toBe("");
	});

	it("gives back the page's own overflow", () => {
		document.documentElement.style.overflow = "scroll";
		const elements = new ScannerElements(DEFAULT_THEME);
		elements.getOrCreateIn(document.body);
		elements.remove();
		expect(pageOverflow()).toBe("scroll");
		document.documentElement.style.overflow = "";
	});

	it("holds the scroll until the last of two holders lets it go", () => {
		const first = new ScannerElements(DEFAULT_THEME);
		const second = new ScannerElements(DEFAULT_THEME);
		first.getOrCreateIn(document.body);
		second.getOrCreateIn(document.body);
		first.remove();
		expect(pageOverflow()).toBe("hidden");
		second.remove();
		expect(pageOverflow()).toBe("");
	});

	it("gives the scroll back while it shows only a screen in a container", () => {
		const elements = new ScannerElements(DEFAULT_THEME);
		elements.getOrCreateIn(document.body);
		const screen = elements
			.getOrCreateIn(newContainer())
			.appendChild(document.createElement("div"));
		elements.showOnlyHolding(screen);
		expect(pageOverflow()).toBe("");
		elements.remove();
	});

	it("leaves the scroll alone for an element in a container", () => {
		const elements = new ScannerElements(DEFAULT_THEME);
		elements.getOrCreateIn(newContainer());
		expect(pageOverflow()).toBe("");
		elements.remove();
	});
});

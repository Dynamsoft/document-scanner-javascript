import { ScannerFault } from "../faults";
import type { RectifyMode, ResolvedSettings } from "../settings/settings";
import type { ThemeLiterals } from "../settings/theme";
import { COMMON_STYLES, adoptStyles, applyTheme } from "../ui/styles";

// The containers the screens go in, and the document scanner's own element in each.

/**
 * How many document scanners hold the page's scroll, and the page's own overflow
 * on `<html>` to give back once none does.
 */
const scrollLock = { holders: 0, pageOverflow: "" };

/**
 * A session's `.mds-scanner` elements, the document scanner's own element in each
 * container, which the screens go in.
 */
export class ScannerElements {
	readonly #theme: ThemeLiterals;
	readonly #elements = new Map<HTMLElement, HTMLElement>();
	/** Whether this session holds the page's scroll. */
	#holdingScroll = false;

	constructor(theme: ThemeLiterals) {
		this.#theme = theme;
	}

	/**
	 * Return the `.mds-scanner` element in `container`, creating it and adding it to
	 * the container on first use. On `document.body`, which has no size of its own,
	 * the stylesheet makes it cover the viewport.
	 */
	getOrCreateIn(container: HTMLElement): HTMLElement {
		const existing = this.#elements.get(container);
		if (existing) return existing;
		const element = document.createElement("div");
		element.className = "mds-scanner";
		// The screens inside, and the body's covering background, read the theme here.
		applyTheme(element, this.#theme);
		container.append(element);
		// Position and stacking come from common.css so that a page can override them.
		adoptStyles(element, COMMON_STYLES);
		this.#elements.set(container, element);
		this.#syncScroll();
		return element;
	}

	/** Show the `.mds-scanner` element holding `screen`, and hide the rest. */
	showOnlyHolding(screen: HTMLElement): void {
		for (const element of this.#elements.values()) element.hidden = !element.contains(screen);
		this.#syncScroll();
	}

	/** Remove every element. */
	remove(): void {
		for (const element of this.#elements.values()) element.remove();
		this.#elements.clear();
		this.#syncScroll();
	}

	/**
	 * Hold the page's scroll while the element covering the viewport shows, so the
	 * page cannot scroll behind it, and let it go otherwise.
	 */
	#syncScroll(): void {
		const cover = this.#elements.get(document.body);
		const hold = cover !== undefined && !cover.hidden;
		if (hold === this.#holdingScroll) return;
		this.#holdingScroll = hold;
		const root = document.documentElement;
		if (hold) {
			if (scrollLock.holders++ === 0) {
				scrollLock.pageOverflow = root.style.overflow;
				// On <html>, the page's own scroller, so it holds in every browser.
				root.style.overflow = "hidden";
			}
		} else if (--scrollLock.holders === 0) {
			root.style.overflow = scrollLock.pageOverflow;
		}
	}
}

/**
 * The containers the screens go in. A screen goes inside the session's
 * `.mds-scanner` element there, never straight into the container.
 */
export interface PhaseContainers {
	readonly capture: HTMLElement;
	readonly edit: HTMLElement;
	/** Rectify's, by the screen that opens it. */
	readonly rectify: Readonly<Record<RectifyMode, HTMLElement>>;
}

/**
 * Find the containers the screens go in. Capture's is the global container, or
 * else `document.body`. Edit's is its own, or else that one too. Rectify's is its
 * own, or else where the screen that opens it is. A selector that matches nothing
 * throws a `container` fault, except for a phase that never shows.
 */
export function resolveContainers(settings: ResolvedSettings): PhaseContainers {
	const shared = resolveContainer(settings.container) ?? defaultContainer();
	const { rectify, edit } = settings.phases;
	const editContainer = (edit ? resolveContainer(edit.container) : null) ?? shared;
	const rectifyContainer = rectify ? resolveContainer(rectify.container) : null;
	return {
		capture: shared,
		edit: editContainer,
		rectify: {
			afterCapture: rectifyContainer ?? shared,
			fromEdit: rectifyContainer ?? editContainer,
		},
	};
}

/** The container the screens go in when the settings name none. */
export function defaultContainer(): HTMLElement {
	return document.body;
}

/**
 * Find the element a container setting names, or `null` when it names none. A
 * selector uses its first match, and one that matches nothing throws a
 * `container` fault.
 */
function resolveContainer(container: HTMLElement | string | undefined): HTMLElement | null {
	if (container == null) return null;
	if (typeof container !== "string") return container;
	const found = document.querySelector<HTMLElement>(container);
	if (!found) {
		throw new ScannerFault({
			kind: "container",
			message: `No element matches the container selector "${container}"`,
			selector: container,
		});
	}
	return found;
}

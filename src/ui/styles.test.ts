import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DEFAULT_THEME, THEME_TOKENS, customProperty } from "../settings/theme";
import {
	CAPTURE_STYLES,
	COMMON_STYLES,
	EDIT_STYLES,
	OVERLAY_STYLES,
	RECTIFY_STYLES,
	adoptStyles,
	adoptStylesheet,
	applyTheme,
} from "./styles";

/** An element inside a fresh shadow root, so each test starts with no sheets. */
function inShadowRoot(): { root: ShadowRoot; element: HTMLElement } {
	const shadowHost = document.createElement("div");
	document.body.append(shadowHost);
	const root = shadowHost.attachShadow({ mode: "open" });
	const element = document.createElement("div");
	root.append(element);
	return { root, element };
}

const cssUrl = (rule: string): string => `data:text/css,${encodeURIComponent(rule)}`;

afterEach(() => {
	vi.restoreAllMocks();
});

describe("adoptStyles", () => {
	it("adopts a stylesheet into the element's own root once, however often it is asked", () => {
		const { root, element } = inShadowRoot();
		adoptStyles(element, ".a { color: red; }");
		adoptStyles(element, ".a { color: red; }");
		expect(root.adoptedStyleSheets).toHaveLength(1);
		expect(root.adoptedStyleSheets[0]?.cssRules[0]?.cssText).toContain(".a");
	});

	it("shares one parsed sheet between roots", () => {
		const first = inShadowRoot();
		const second = inShadowRoot();
		adoptStyles(first.element, ".shared { color: blue; }");
		adoptStyles(second.element, ".shared { color: blue; }");
		expect(first.root.adoptedStyleSheets[0]).toBe(second.root.adoptedStyleSheets[0]);
	});

	it("does nothing for an element that is in no document yet", () => {
		expect(() => adoptStyles(document.createElement("div"), ".x {}")).not.toThrow();
	});
});

describe("adoptStylesheet", () => {
	it("fetches a stylesheet and adopts it once per root", async () => {
		const { root, element } = inShadowRoot();
		const url = cssUrl(".fetched { color: green; }");
		await adoptStylesheet(element, url);
		await adoptStylesheet(element, url);
		expect(root.adoptedStyleSheets).toHaveLength(1);
	});

	it("adopts a sheet once when two mounts ask for it at the same time", async () => {
		const { root, element } = inShadowRoot();
		const url = cssUrl(".together { color: teal; }");
		await Promise.all([adoptStylesheet(element, url), adoptStylesheet(element, url)]);
		expect(root.adoptedStyleSheets).toHaveLength(1);
	});

	it("fetches nothing for an element that is in no document yet", async () => {
		const fetch = vi.spyOn(globalThis, "fetch");
		await adoptStylesheet(document.createElement("div"), cssUrl(".detached {}"));
		expect(fetch).not.toHaveBeenCalled();
	});

	it("names the missing file when the server answers with an error page", async () => {
		const { element } = inShadowRoot();
		await expect(adoptStylesheet(element, "/no-such-sheet.css")).rejects.toThrow(
			"/no-such-sheet.css",
		);
	});

	it("tries again on the next mount after a failed fetch", async () => {
		const { root, element } = inShadowRoot();
		const url = "/flaky-sheet.css";
		const fetch = vi.spyOn(globalThis, "fetch");
		fetch.mockRejectedValueOnce(new TypeError("offline"));
		fetch.mockResolvedValueOnce(new Response(".flaky { color: red; }", { status: 200 }));
		await expect(adoptStylesheet(element, url)).rejects.toThrow("offline");
		await adoptStylesheet(element, url);
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(root.adoptedStyleSheets).toHaveLength(1);
	});
});

describe("applyTheme", () => {
	it("sets every theme color as a custom property on the element", () => {
		const element = document.createElement("div");
		applyTheme(element, { ...DEFAULT_THEME, primary: "#123456" });
		expect(element.style.getPropertyValue("--mds-primary")).toBe("#123456");
		expect(element.style.getPropertyValue("--mds-on-surface")).toBe(DEFAULT_THEME.onSurface);
	});
});

/** Matches an `mds-` class, an `mds-` id, or a `data-mds-` attribute. */
const MDS_NAME = /[.#]mds-|\[data-mds-/;

/** List every rule, including the ones inside `@media`, other blocks, and nesting. */
function allRules(rules: CSSRuleList): CSSRule[] {
	return [...rules].flatMap((rule) =>
		rule instanceof CSSGroupingRule ? [rule, ...allRules(rule.cssRules)] : [rule],
	);
}

/**
 * The part of a selector that a page element could match: without `:not()` and
 * `:has()`, and without the siblings before a `~` or `+`.
 */
function matchedPart(selector: string): string {
	return selector
		.replace(/:(not|has)\(.*?\)/g, "")
		.split(/ [~+] /)
		.at(-1)!;
}

// The browser parses the sheets, so these tests see the rules the document scanner
// adopts. Each browser drops the rules it does not know, so all three run them.
describe("the stylesheets", () => {
	const rules = [
		COMMON_STYLES,
		CAPTURE_STYLES,
		OVERLAY_STYLES,
		RECTIFY_STYLES,
		EDIT_STYLES,
	].flatMap((css) => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(css);
		return allRules(sheet.cssRules);
	});
	const styleRules = rules.filter((rule) => rule instanceof CSSStyleRule);

	it("tie every selector to an mds- class, id, or data attribute", () => {
		// A comma inside :where() splits too. That can only fail a rule that is fine.
		const selectors = styleRules.flatMap((rule) => rule.selectorText.split(","));
		expect(selectors.length).toBeGreaterThan(0);
		expect(selectors.filter((selector) => !MDS_NAME.test(matchedPart(selector)))).toEqual([]);
	});

	it("name every animation with the mds- prefix", () => {
		const names = rules.filter((rule) => rule instanceof CSSKeyframesRule).map((rule) => rule.name);
		expect(names.filter((name) => !name.startsWith("mds-"))).toEqual([]);
	});

	it("read only the variables that the theme or a rule sets", () => {
		const declared = styleRules.flatMap((rule) =>
			[...rule.style].filter((name) => name.startsWith("--")),
		);
		const defined = new Set([...THEME_TOKENS.map(customProperty), ...declared]);
		const read = rules.flatMap((rule) =>
			[...rule.cssText.matchAll(/var\(\s*(--[\w-]+)/g)].map(([, name = ""]) => name),
		);
		expect(read.filter((name) => !defined.has(name))).toEqual([]);
	});
});

// The two values are a public contract (ScannerSettings.container), so host pages
// can place their own elements above or below the document scanner.
describe("the stacking order", () => {
	it("puts the document scanner at 2000000000, and a dialog that is not modal at 2000000001", () => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(COMMON_STYLES + OVERLAY_STYLES);
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
		const scanner = document.createElement("div");
		scanner.className = "mds-scanner";
		const dialog = document.createElement("dialog");
		dialog.className = "mds-overlay";
		document.body.append(scanner, dialog);
		dialog.show();
		try {
			expect(getComputedStyle(scanner).zIndex).toBe("2000000000");
			expect(getComputedStyle(dialog).zIndex).toBe("2000000001");
		} finally {
			scanner.remove();
			dialog.remove();
			document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
		}
	});
});

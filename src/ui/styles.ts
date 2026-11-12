import captureCss from "./styles/capture.css?inline";
import overlayCss from "./styles/overlay.css?inline";
import rectifyCss from "./styles/rectify.css?inline";
import editCss from "./styles/edit.css?inline";
import commonCss from "./styles/common.css?inline";
import { THEME_TOKENS, customProperty } from "../settings/theme";
import type { ThemeLiterals } from "../settings/theme";

// The document scanner's stylesheets, inlined at build time. Constructed sheets
// reach shadow roots and need no `style-src 'unsafe-inline'`.

/** Sizes, resets, and the looks that several screens share. Adopt it before any sheet below. */
export const COMMON_STYLES: string = commonCss;

/** The capture screen's styles. */
export const CAPTURE_STYLES: string = captureCss;
/** The rectify screen's styles. */
export const RECTIFY_STYLES: string = rectifyCss;
/** The edit screen's styles. */
export const EDIT_STYLES: string = editCss;
/** The dialogs' styles. */
export const OVERLAY_STYLES: string = overlayCss;

// Constructed sheets by CSS text, and fetched sheets by URL.
const sheets = new Map<string, CSSStyleSheet>();
const fetched = new Map<string, Promise<CSSStyleSheet>>();
// The sheets each root has adopted, keyed by CSS text or URL.
const adopted = new WeakMap<Document | ShadowRoot, Set<string>>();

/** Adopt an inlined sheet into the node's root, once per root. */
export function adoptStyles(node: Node, css: string): void {
	const root = styleRoot(node);
	if (!root || !claim(root, css)) return;
	let sheet = sheets.get(css);
	if (!sheet) {
		sheet = new CSSStyleSheet();
		sheet.replaceSync(css);
		sheets.set(css, sheet);
	}
	root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
}

/** Fetch a stylesheet and adopt it into the node's root, once per root. */
export async function adoptStylesheet(node: Node, url: string): Promise<void> {
	const root = styleRoot(node);
	if (!root || isClaimed(root, url)) return;
	let loading = fetched.get(url);
	if (!loading) fetched.set(url, (loading = loadStylesheet(url)));
	let sheet: CSSStyleSheet;
	try {
		sheet = await loading;
	} catch (error) {
		// Forget the failed fetch so a later mount tries again.
		fetched.delete(url);
		throw error;
	}
	// Another mount may have adopted it during the fetch.
	if (!claim(root, url)) return;
	root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
}

/** Set the theme's custom properties on an element, for its subtree. */
export function applyTheme(element: HTMLElement, theme: ThemeLiterals): void {
	for (const token of THEME_TOKENS) {
		element.style.setProperty(customProperty(token), theme[token]);
	}
}

function styleRoot(node: Node): Document | ShadowRoot | null {
	const root = node.getRootNode();
	return root instanceof Document || root instanceof ShadowRoot ? root : null;
}

function isClaimed(root: Document | ShadowRoot, key: string): boolean {
	return adopted.get(root)?.has(key) ?? false;
}

/** Mark the sheet adopted in this root. False when it already was. */
function claim(root: Document | ShadowRoot, key: string): boolean {
	let seen = adopted.get(root);
	if (!seen) adopted.set(root, (seen = new Set()));
	if (seen.has(key)) return false;
	seen.add(key);
	return true;
}

/**
 * Fetch and parse a stylesheet. A 404's error page would parse as an empty sheet,
 * so the status is checked.
 */
async function loadStylesheet(url: string): Promise<CSSStyleSheet> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Stylesheet not found at ${url} (${response.status}). ` +
				`Check the resource root, or copy the engine directory into the path you serve.`,
		);
	}
	const sheet = new CSSStyleSheet();
	await sheet.replace(await response.text());
	return sheet;
}

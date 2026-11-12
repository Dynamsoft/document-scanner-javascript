// Every color the document scanner uses. They are set as CSS custom properties on
// its root element when a screen mounts, and passed as plain values where CSS
// variables cannot be read.

/**
 * The colors of the screens of the document scanner, as CSS colors. A token without
 * a value keeps its default. The document scanner also sets each token as a CSS
 * custom property, such as `--mds-on-surface` for `onSurface`. Custom CSS can read
 * these properties.
 */
export interface ThemeTokens {
	/**
	 * The accent color of links, primary buttons, and the outline of a found document.
	 *
	 * @defaultValue `"#fe8e14"`
	 */
	primary?: string;
	/**
	 * The background color of the screens, behind the viewfinder and the pages, and of
	 * the dialogs.
	 *
	 * @defaultValue `"#000000"`
	 */
	background?: string;
	/**
	 * The background color behind the page on the rectify and edit screens.
	 *
	 * @defaultValue `"#323234"`
	 */
	surface?: string;
	/**
	 * The color of text and icons.
	 *
	 * @defaultValue `"#ffffff"`
	 */
	onSurface?: string;
	/**
	 * The color of a toggle that is on, and of the selected entry in a menu.
	 *
	 * @defaultValue `"#fe8e14"`
	 */
	active?: string;
	/**
	 * The color of a button that is off, under the finger, or busy with its action.
	 *
	 * @defaultValue `"#575757"`
	 */
	inactive?: string;
	/**
	 * The color of the badge that counts the pages on the thumbnail of the capture
	 * screen.
	 *
	 * @defaultValue `"#e65050"`
	 */
	badge?: string;
	/**
	 * The color of a button that destroys something, such as delete.
	 *
	 * @defaultValue `"#fb2c36"`
	 */
	error?: string;
}

/** The name of a theme color. */
export type ThemeToken = keyof ThemeTokens;

/** A complete set of theme colors, as CSS color strings. */
export type ThemeLiterals = Readonly<Required<ThemeTokens>>;

export const DEFAULT_THEME: ThemeLiterals = {
	primary: "#fe8e14",
	background: "#000000",
	surface: "#323234",
	onSurface: "#ffffff",
	active: "#fe8e14",
	inactive: "#575757",
	badge: "#e65050",
	error: "#fb2c36",
};

/**
 * Return a token's CSS custom property. For example, `onSurface` becomes
 * `--mds-on-surface`.
 */
export function customProperty(token: ThemeToken): string {
	return `--mds-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/** Every token name, in declaration order. */
export const THEME_TOKENS: readonly ThemeToken[] = Object.keys(DEFAULT_THEME) as ThemeToken[];

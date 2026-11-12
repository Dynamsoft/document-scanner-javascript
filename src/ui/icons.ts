/** The attribute that marks the element an icon is put into. */
const ICON_ATTRIBUTE = "data-mds-icon";

/**
 * The SVG source of each icon, by its file name without `.svg`. That is the name
 * a `data-mds-icon` placeholder uses. Supplied markup uses these names too, so
 * renaming a file breaks it. The files are inlined at build time.
 */
const ICONS: ReadonlyMap<string, string> = new Map(
	Object.entries(
		import.meta.glob<string>("./icons/*.svg", { query: "?raw", import: "default", eager: true }),
	).map(([path, svg]) => [path.slice("./icons/".length, -".svg".length), svg.trim()]),
);

/**
 * Fill each icon placeholder with the SVG it names. Names the document scanner does
 * not ship are left alone, because a supplied template may hold its own SVG there.
 */
export function fillIcons(root: HTMLElement): void {
	for (const holder of root.querySelectorAll<HTMLElement>(`[${ICON_ATTRIBUTE}]`)) {
		// The selector matched only elements with the attribute.
		const icon = ICONS.get(holder.getAttribute(ICON_ATTRIBUTE)!);
		if (icon !== undefined) holder.innerHTML = icon;
	}
}

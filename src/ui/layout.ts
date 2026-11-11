// The areas of a screen that a host application can fill from templates, and the
// controls in them. A screen with a `layout` setting has a skeleton with its areas,
// and a file with the built-in template of each area that has content.

import { BUTTON_ATTRIBUTE } from "../settings/buttons";

/** The attribute that marks an area of a screen, and the area of a built-in template. */
export const AREA_ATTRIBUTE = "data-mds-area";

/**
 * The attributes a control may not carry. The screen sets its label from `strings`,
 * and screen readers would prefer the control's own label, or `aria-labelledby`.
 */
const LABEL_ATTRIBUTES = ["aria-label", "aria-labelledby", "title"] as const;

/** Parse markup with one root element, the library's own, into a detached element. */
export function parseSkeleton(markup: string): HTMLElement {
	const holder = document.createElement("template");
	holder.innerHTML = markup.trim();
	return holder.content.firstElementChild as HTMLElement;
}

/**
 * Fill each area of `root` with a copy of the template that `layout` gives, or else
 * of the built-in one in `builtIn`, or remove the area for `false`. With no
 * `layout`, every area takes its built-in template. The settings check refused
 * any other value.
 */
export function fillAreas<Area extends string>(
	root: HTMLElement,
	layout: Readonly<Partial<Record<Area, HTMLTemplateElement | false | null>>> | undefined,
	builtIn: string,
): void {
	const templates = builtInTemplates(builtIn);
	for (const current of root.querySelectorAll(`[${AREA_ATTRIBUTE}]`)) {
		// The skeleton names only the screen's own areas.
		const area = current.getAttribute(AREA_ATTRIBUTE)! as Area;
		const given = layout?.[area] ?? templates.get(area);
		if (given === false) current.remove();
		else if (given) current.replaceChildren(given.content.cloneNode(true));
	}
}

/** The built-in templates in `markup`, by area. */
function builtInTemplates(markup: string): ReadonlyMap<string, HTMLTemplateElement> {
	const holder = document.createElement("template");
	holder.innerHTML = markup;
	const templates = holder.content.querySelectorAll<HTMLTemplateElement>(
		`template[${AREA_ATTRIBUTE}]`,
	);
	return new Map([...templates].map((each) => [each.getAttribute(AREA_ATTRIBUTE)!, each]));
}

/**
 * Find every copy of each of `buttons` in `roots`, by its `data-mds-button` name. A
 * name not in `buttons`, or a control with its own label, is an error that names
 * `setting`.
 */
export function findControls<Button extends string>(
	roots: readonly ParentNode[],
	buttons: readonly Button[],
	setting: string,
): Readonly<Record<Button, readonly HTMLElement[]>> {
	const controls = Object.fromEntries(
		buttons.map((button) => [button, [] as HTMLElement[]]),
	) as Record<Button, HTMLElement[]>;
	const found = roots.flatMap((root) => [
		...root.querySelectorAll<HTMLElement>(`[${BUTTON_ATTRIBUTE}]`),
	]);
	for (const control of found) {
		const name = control.getAttribute(BUTTON_ATTRIBUTE)! as Button;
		// Checked against the list, since a name such as `constructor` is on every object.
		if (!buttons.includes(name)) {
			throw new Error(`${setting} has an unknown data-mds-button "${name}"`);
		}
		const labelAttribute = LABEL_ATTRIBUTES.find((attribute) => control.hasAttribute(attribute));
		if (labelAttribute) {
			throw new Error(
				`${setting} gives data-mds-button "${name}" its own ${labelAttribute}; set its text through strings instead`,
			);
		}
		controls[name].push(control);
	}
	return controls;
}

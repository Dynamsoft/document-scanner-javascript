// A control of a screen is on, off, or held. Off means it has nothing to act on,
// so it is disabled. Held means the session holds the controls while an action
// runs, and ignores their presses. A held control keeps its look and the focus,
// and tells assistive technology that it is unavailable. A control whose press
// started an action also draws as running, in the off look, until that action
// ends.

/** The attribute that draws a control as running. */
const RUNNING_ATTRIBUTE = "data-mds-running";

/** The action that a press started, or `undefined` when the press started none. */
export type PressAction = Promise<void> | undefined;

/** The availability of one screen's controls, and which of them run an action. */
export class Availability {
	/** The controls whose press started an action that still runs. */
	readonly #running = new Set<Element>();

	/** Report each click on `control` through `report`, as `press()` does. */
	listen(control: HTMLElement, report: () => PressAction): void {
		control.addEventListener("click", () => this.press(control, report));
	}

	/**
	 * Report a press on `control` through `report`. The control draws as running
	 * until the action that the press started ends.
	 */
	press(control: HTMLElement, report: () => PressAction): void {
		const action = report();
		if (!action) return;
		this.#running.add(control);
		control.toggleAttribute(RUNNING_ATTRIBUTE, !control.hasAttribute("disabled"));
		void action.finally(() => {
			this.#running.delete(control);
			control.removeAttribute(RUNNING_ATTRIBUTE);
		});
	}

	/**
	 * Draw `control` as off when `off`, else as held when `held`. Unless it is off, it
	 * draws as running while its press's action runs, or when `running`.
	 */
	draw(
		control: HTMLElement,
		{
			off = false,
			held,
			running = false,
		}: { readonly off?: boolean; readonly held: boolean; readonly running?: boolean },
	): void {
		control.toggleAttribute("disabled", off);
		if (held && !off) control.setAttribute("aria-disabled", "true");
		else control.removeAttribute("aria-disabled");
		const runs = running || this.#running.has(control);
		control.toggleAttribute(RUNNING_ATTRIBUTE, !off && runs);
	}
}

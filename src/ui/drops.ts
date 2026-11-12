// Files dragged onto a screen of the document scanner. A browser opens a dropped
// file in place of the page unless the page refuses the drop, and that ends the
// session. Thus each screen refuses every drop.

/** Refuse each file dragged onto `element`, until `signal` aborts. */
export function refuseDrops(element: HTMLElement, signal?: AbortSignal): void {
	element.addEventListener(
		"dragover",
		(event) => {
			// The cursor shows that the drop is refused.
			event.preventDefault();
			if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
		},
		{ signal },
	);
	element.addEventListener("drop", (event) => event.preventDefault(), { signal });
}

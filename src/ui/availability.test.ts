import { describe, expect, it } from "vite-plus/test";
import { Availability } from "./availability";

/** What a control shows: disabled, held, and running. */
function drawn(control: HTMLElement) {
	return [
		control.hasAttribute("disabled"),
		control.getAttribute("aria-disabled"),
		control.hasAttribute("data-mds-running"),
	];
}

describe("Availability", () => {
	it("draws a pressed control as running until the action that the press started ends", async () => {
		const availability = new Availability();
		const control = document.createElement("button");
		let end = () => undefined as void;
		availability.listen(control, () => new Promise<void>((resolve) => (end = resolve)));
		control.click();
		// The session holds the controls meanwhile.
		availability.draw(control, { held: true });
		expect(drawn(control)).toEqual([false, "true", true]);
		end();
		await new Promise((resolve) => setTimeout(resolve));
		expect(drawn(control)).toEqual([false, "true", false]);
	});
});

import { describe, expect, it } from "vite-plus/test";
import { loadTestEngines } from "../../tests/engines";
import { UNKNOWN_LICENSE_KEY } from "../../tests/license-keys";

// With the engine's license dialog turned off, as the loader turns it off, a bad
// key must still fail the license check. Needs the license server.

describe("the license check with the engine's dialog turned off", () => {
	it("rejects a key the server does not know without a dialog of its own", async () => {
		// The engine also leaves a second rejection unhandled. This test catches it,
		// or the test runner reports a stray error.
		const catchStray = (event: PromiseRejectionEvent): void => event.preventDefault();
		window.addEventListener("unhandledrejection", catchStray);
		try {
			await expect(loadTestEngines({ license: UNKNOWN_LICENSE_KEY })).rejects.toThrow(
				"License Server",
			);
			expect(document.querySelector("dialog, .dls-license-mask, [class*='license']")).toBeNull();
			// Give the stray rejection time to arrive.
			await new Promise((resolve) => setTimeout(resolve, 100));
		} finally {
			window.removeEventListener("unhandledrejection", catchStray);
		}
	});
});

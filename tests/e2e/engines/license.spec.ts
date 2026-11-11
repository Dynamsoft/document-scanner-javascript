import { UNKNOWN_LICENSE_KEY } from "../../license-keys";
import { expect, licenseFailure, openScanner, test } from "../support/scanner";

// A license check that fails shows the license error over the capture screen, and
// the scan fails once the user dismisses it.

test("an unknown key fails the scan as rejected", async ({ page }) => {
	await openScanner(page, { license: UNKNOWN_LICENSE_KEY });
	expect(await licenseFailure(page)).toMatchObject({
		kind: "license",
		// The license server's own words, so the key reached it.
		message: expect.stringContaining("License Server"),
		reason: "rejected",
	});
});

test("a malformed key fails the scan as rejected", async ({ page }) => {
	// Capture Vision would take a malformed key as its trial.
	await openScanner(page, { license: "not-a-license-key" });
	expect(await licenseFailure(page)).toEqual({
		kind: "license",
		message: "License string is invalid.",
		reason: "rejected",
	});
});

test("a license server out of reach fails the scan as unreachable", async ({
	page,
	browserName,
}) => {
	test.skip(browserName === "webkit", "WebKit's routes miss the requests of the engine's worker");
	await page.context().route(
		(url) => url.hostname !== "localhost",
		(route) => route.abort(),
	);
	await openScanner(page);
	expect(await licenseFailure(page)).toMatchObject({ kind: "license", reason: "unreachable" });
});

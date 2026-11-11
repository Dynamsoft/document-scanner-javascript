import { disposeScanner, expect, openScanner, rescanAndDispose, test } from "../support/scanner";

// Disposing of the document scanner.

test("a scan ends cancelled when the document scanner is disposed while the engines load", async ({
	page,
}) => {
	// The page's scan is still loading the engines when the page has loaded.
	await openScanner(page);
	expect(await disposeScanner(page)).toBe("cancelled");
});

test("a scan ends cancelled when the document scanner is disposed right after scan(), with the engines loaded", async ({
	page,
}) => {
	await openScanner(page);
	expect(await rescanAndDispose(page)).toBe("cancelled");
});

import { describe, expect, it } from "vite-plus/test";

// How Document Viewer reports a failed init, checked against the real engine. The
// loader tells its license failures from its load failures by the code. Capture
// Vision is not loaded here, so Document Viewer checks the key itself. Needs the
// license server.

type DocumentViewer = (typeof import("dynamsoft-document-viewer"))["DDV"];

/**
 * Init Document Viewer with `license` and its files at `directory`, and return
 * the rejection.
 */
async function initRejection(
	DDV: DocumentViewer,
	license: string,
	directory: string,
): Promise<unknown> {
	DDV.Core.engineResourcePath = directory;
	DDV.Core.license = license;
	return DDV.Core.init().then(
		() => undefined,
		(error: unknown) => error,
	);
}

describe("a failed init of Document Viewer", () => {
	it("puts a license server's refusal in the error's cause, as the server's code plus 20000, negated", async () => {
		const { DDV } = await import("dynamsoft-document-viewer");
		const directory = `${location.origin}/engine/dynamsoft-document-viewer@${DDV.Core.versionInfo.viewer}/dist/engine`;
		// The setter takes any key that starts with "DLS", and the license server
		// refuses this one.
		const rejection = await initRejection(DDV, "DLS-not-a-real-license-key", directory);
		expect(rejection).toBeInstanceOf(Error);
		expect(rejection).not.toHaveProperty("code");
		expect(rejection).toMatchObject({ cause: { code: -20101 } });
	});

	it("gives files it cannot find a code outside its license codes", async () => {
		const { DDV } = await import("dynamsoft-document-viewer");
		const rejection = await initRejection(
			DDV,
			import.meta.env.VITE_TEST_LICENSE,
			`${location.origin}/nowhere/`,
		);
		expect(rejection).toMatchObject({ cause: { code: -80052 } });
	});
});

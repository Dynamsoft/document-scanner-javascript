import { captureVisionCoreVersion, engineVersion } from "../../../vite/engines";
import {
	cameraRunning,
	expect,
	licenseFailure,
	openAfterAnotherCopy,
	test,
} from "../support/scanner";

// The document scanner on a page where another copy of Capture Vision loaded
// first, as a copy nested under another Dynamsoft SDK does.

/**
 * The other copies to try, with the core version each reports. Add a newer one
 * once one is published.
 */
const OTHER_COPIES = [
	// Older: the version the MRZ scanner pins.
	{ version: "3.4.2001", core: "4.4.20" },
	// Older, in the same minor version: the one before 3.6.5000.
	{ version: "3.6.3200", core: "4.6.30" },
	// The installed version, loaded a second time.
	{ version: engineVersion("dynamsoft-capture-vision-bundle"), core: captureVisionCoreVersion() },
];

for (const { version, core } of OTHER_COPIES) {
	test(`warns, naming both versions, and still scans when ${version} loaded first`, async ({
		page,
	}) => {
		const warnings: string[] = [];
		page.on("console", (message) => {
			if (message.type() === "warning") warnings.push(message.text());
		});
		await openAfterAnotherCopy(page, version);
		await cameraRunning(page);
		const warning = warnings.find((text) =>
			text.includes("another copy of Dynamsoft Capture Vision"),
		);
		expect(warning).toContain(`core ${core}`);
		expect(warning).toContain(`whose core is ${captureVisionCoreVersion()}`);
	});
}

test("fails as a rejected license when another copy loaded first was licensed with a refused key", async ({
	page,
}) => {
	await openAfterAnotherCopy(page, "3.4.2001", "not-a-real-license-key");
	expect(await licenseFailure(page)).toMatchObject({ kind: "license", reason: "rejected" });
});

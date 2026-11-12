import { readFileSync } from "node:fs";
import { expect, it } from "vite-plus/test";

// The signatures of the published declarations, kept in the repository, so that
// every change to the public API shows in review as a diff that someone approves.
// Comments are left out, since they do not change what a host application can
// call. After a change on purpose, update the copy with
// `vp test run --project artifacts --update`.

it("publishes the signatures that the repository keeps", async () => {
	const declarations = readFileSync(
		new URL("../../dist/document-scanner.d.mts", import.meta.url),
		"utf-8",
	);
	const signatures = declarations
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/^\s*\/\/.*$/gm, "")
		.split("\n")
		.filter((line) => line.trim() !== "")
		.join("\n");
	await expect(
		`${signatures}\n`,
		"The public API changed. If the change is on purpose, accept it with `vp test run --project artifacts --update`, and commit the updated snapshot",
	).toMatchFileSnapshot("./__snapshots__/public-api.d.mts.snap");
});

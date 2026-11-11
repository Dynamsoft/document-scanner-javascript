import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";

// Checks that each bundle carries every license in THIRD-PARTY-NOTICES.md. A host
// application that loads only the IIFE file from a CDN gets no other copy of them.

const BUNDLES = ["document-scanner.mjs", "document-scanner.iife.js"];

/** Each non-empty line of the license blocks in the notices file. */
const LICENSE_LINES = [
	...readFileSync(new URL("../../THIRD-PARTY-NOTICES.md", import.meta.url), "utf-8").matchAll(
		/```\n([\s\S]*?)\n```/g,
	),
].flatMap(([, license]) => license!.split("\n").filter((line) => line.trim() !== ""));

describe.each(BUNDLES)("the built %s", (name) => {
	const code = readFileSync(new URL(`../../dist/${name}`, import.meta.url), "utf-8");

	it("carries every line of the third-party licenses", () => {
		expect(LICENSE_LINES).not.toHaveLength(0);
		expect(LICENSE_LINES.filter((line) => !code.includes(line))).toEqual([]);
	});
});

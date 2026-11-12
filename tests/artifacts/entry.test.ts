import { execFileSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vite-plus/test";

// Checks that the built ESM entry imports in Node with no DOM and loads no engine.

// A file URL, because the ESM loader of Node refuses a Windows path, which starts
// with a drive letter such as `C:`.
const ENTRY = new URL("../../dist/document-scanner.mjs", import.meta.url).href;

// A script that imports the entry in a fresh Node process and reports as JSON.
const PROBE = `
import { registerHooks } from "node:module";
const requested = [];
registerHooks({
	resolve(specifier, context, nextResolve) {
		requested.push(specifier);
		return nextResolve(specifier, context);
	},
});
const entry = await import(process.argv[1]);
console.log(JSON.stringify({
	scanner: typeof entry.DocumentScanner,
	requested,
	document: typeof globalThis.document,
}));
`;

interface Probe {
	readonly scanner: string;
	readonly requested: readonly string[];
	readonly document: string;
}

let probe: Probe;

beforeAll(() => {
	const output = execFileSync(process.execPath, ["--input-type=module", "-e", PROBE, ENTRY], {
		encoding: "utf-8",
	});
	probe = JSON.parse(output) as Probe;
});

describe("the built entry", () => {
	it("loads in Node, where there is no DOM, and exports the document scanner", () => {
		expect(probe.document).toBe("undefined");
		expect(probe.scanner).toBe("function");
	});

	it("loads neither engine until the document scanner asks for one", () => {
		// The entry being on the list shows the probe saw the import.
		expect(probe.requested).toContain(ENTRY);
		expect(probe.requested.filter((name) => name.startsWith("dynamsoft-"))).toEqual([]);
	});
});

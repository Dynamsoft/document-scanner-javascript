import { fileURLToPath } from "node:url";
import { loadEnv } from "vite-plus";

// The contract and end-to-end tests need a license that works on localhost.
// Vite reads it from VITE_TEST_LICENSE in the env files at the root.

const ROOT = fileURLToPath(new URL("../", import.meta.url));

/** Stop before any browser starts when the env files of `mode` hold no test license. */
export function requireTestLicense(mode: string): void {
	if (loadEnv(mode, ROOT, "VITE_").VITE_TEST_LICENSE) return;
	throw new Error(
		"VITE_TEST_LICENSE is empty. The contract and end-to-end tests need a license " +
			"that works on localhost.",
	);
}

/** Check the license, as a global setup of the Vitest project that needs it. */
export function setup(): void {
	requireTestLicense("test");
}

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Run with this Node, since node_modules/.bin holds a shell script on Windows.
const VP = fileURLToPath(new URL("../node_modules/vite-plus/bin/vp", import.meta.url));

/**
 * Build the package for the tests that read built files. Its stderr shows only in
 * the error a failed build throws.
 */
export default function build(): void {
	execFileSync(process.execPath, [VP, "pack"], { stdio: ["ignore", "ignore", "pipe"] });
}

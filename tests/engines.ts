import { resolveSettings } from "../src/settings/settings";
import type { ScannerSettings } from "../src/settings/settings";
import { engineImports, loadEngines } from "../src/engines/engines";
import type { LoadedEngines } from "../src/engines/engines";

// The real engines for the contract tests, loaded the way the document scanner
// loads them. Needs the test license and the network.

/**
 * Load both engines with the test license and this origin's engine files. Each
 * top-level setting in `settings` replaces that one whole.
 */
export function loadTestEngines(settings: ScannerSettings = {}): Promise<LoadedEngines> {
	return loadEngines(
		resolveSettings({
			license: import.meta.env.VITE_TEST_LICENSE,
			resources: { captureVision: { rootDirectory: `${location.origin}/engine/` } },
			...settings,
		}),
		engineImports(undefined),
	);
}

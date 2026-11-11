import build from "../../build";
import { requireTestLicense } from "../../license";
import { E2E_BROWSERS } from "../../../vite/browsers-container";
import { writeVideos } from "./videos";

/**
 * Check the test license, build for the tests that load built files, write the
 * videos, and start the browsers.
 */
export default function globalSetup(): Promise<() => Promise<void>> {
	// The dev server that serves the pages runs in this mode.
	requireTestLicense("development");
	build();
	writeVideos();
	return E2E_BROWSERS.start();
}

import { defineConfig, devices } from "playwright/test";
import { E2E_BROWSERS } from "./vite/browsers-container";

// End-to-end tests of whole pages on the dev server, with a fake camera.

// The suite starts its own dev server, on its own port, and never reuses one
// that runs already. Vite's default port 5173 can often be in use.
const PORT = 5199;
const ORIGIN = `https://localhost:${PORT}`;

// A phone's screen. It goes after each device preset, because a preset sets its
// own viewport. The presets stay for their user agents, which both engines read.
const VIEWPORT = { width: 420, height: 860 };

export default defineConfig({
	testDir: "tests/e2e",
	globalSetup: "./tests/e2e/support/global-setup.ts",
	// A capture, a review, and an export take most of a minute on a slow machine.
	timeout: 90_000,
	workers: process.env.CI ? 2 : 4,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [["github"], ["list"]] : "list",
	use: {
		baseURL: ORIGIN,
		connectOptions: E2E_BROWSERS.connectOptions,
		ignoreHTTPSErrors: true,
		trace: "retain-on-failure",
		// The capture screen marks each control with its name, so getByTestId finds it.
		testIdAttribute: "data-mds-button",
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: VIEWPORT } },
		{
			// Firefox's fake camera shows only its own test pattern, never a page.
			name: "firefox",
			grepInvert: /@document/,
			use: { ...devices["Desktop Firefox"], viewport: VIEWPORT },
		},
		{ name: "webkit", use: { ...devices["Desktop Safari"], viewport: VIEWPORT } },
	],
	webServer: {
		// Run vp with node, because node_modules/.bin/vp is a shell script on Windows.
		command: `node node_modules/vite-plus/bin/vp dev --port ${PORT} --strictPort`,
		url: `${ORIGIN}/`,
		ignoreHTTPSErrors: true,
		reuseExistingServer: false,
		timeout: 120_000,
	},
});

import { defineConfig, lazyPlugins } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import basicSsl from "@vitejs/plugin-basic-ssl";
import pkg from "./package.json" with { type: "json" };
import tsconfig from "./tsconfig.json" with { type: "json" };
import { defaultSettings } from "./src/settings/settings";
import { VITEST_BROWSERS } from "./vite/browsers-container";
import { devPageIndex, engineResources } from "./vite/dev-server";
import { ENGINES, captureVisionCoreVersion, engineVersion } from "./vite/engines";
import { rawImports } from "./vite/raw-imports";

// Pass tsconfig's target by hand, because `vp pack` does not read it.
const TARGET: string = tsconfig.compilerOptions.target;

// The entry point. `vp dev` maps the package name to it, so the pages in dev/ need no build.
const ENTRY = "src/index.ts";

// The capture screen's markup, published as written.
const CAPTURE_LAYOUT = "src/phases/capture-layout.html";
const RECTIFY_LAYOUT = "src/phases/rectify-layout.html";
const EDIT_LAYOUT = "src/phases/edit-layout.html";

const banner = `/*!
* Dynamsoft Mobile Document Scanner, JavaScript Edition
* @product Dynamsoft Mobile Document Scanner
* @website https://www.dynamsoft.com
* @copyright Copyright ${new Date().getUTCFullYear()}, Dynamsoft Corporation
* @author Dynamsoft
* @version ${pkg.version}
* @fileoverview Capture and enhance document images with automatic border detection, correction, review, and export. Built against ${ENGINES.map((name) => `${name}@${engineVersion(name)}`).join(", ")}.
* More info: https://www.dynamsoft.com/mobile-document-scanner/docs/web/index.html
*/
${thirdPartyNotices().join("\n")}`;

/**
 * Make one legal comment for each section of `THIRD-PARTY-NOTICES.md`, with its
 * heading and the license in its code block. The banner carries them, because an
 * app that loads only a bundle gets no other copy.
 */
function thirdPartyNotices(): string[] {
	// Resolve beside this file, so that the config loads from any working directory.
	const notices = readFileSync(new URL("THIRD-PARTY-NOTICES.md", import.meta.url), "utf-8");
	return notices
		.split(/^## /m)
		.slice(1)
		.map((section) => {
			const name = section.slice(0, section.indexOf("\n")).trim();
			const license = /```\n([\s\S]*?)\n```/.exec(section)?.[1];
			if (license === undefined)
				throw new Error(`THIRD-PARTY-NOTICES.md: ${name} has no license block`);
			// A "*/" in the text would end the comment early.
			const lines = [name, "", ...license.split("\n")].map((line) =>
				` * ${line.replaceAll("*/", "* /")}`.trimEnd(),
			);
			return `/*!\n${lines.join("\n")}\n */`;
		});
}

// The installed engines' versions, which an engine passed in through `engines`
// must match.
const ENGINE_DEFINES = {
	"import.meta.env.ENGINE_VERSIONS": JSON.stringify({
		captureVision: engineVersion("dynamsoft-capture-vision-bundle"),
		captureVisionCore: captureVisionCoreVersion(),
		documentViewer: engineVersion("dynamsoft-document-viewer"),
	}),
};

const ENGINE_IMPORT = {
	group: ["dynamsoft-*"],
	allowTypeImports: true,
	message: "only src/engines may import an engine for its value",
};

// The test servers need no console forwarding.
const QUIET_SERVER = { forwardConsole: false };

// Build browser mode per project. Vitest names browser instances after their
// project, so projects that share one object get the wrong names.
const browserMode = () => ({
	enabled: true,
	provider: playwright({ connectOptions: VITEST_BROWSERS.connectOptions }),
	headless: true,
	instances: (["chromium", "firefox", "webkit"] as const).map((browser) => ({ browser })),
});

export default defineConfig({
	// ---- Tasks (vp run) ----
	run: {
		tasks: {
			// Check the coverage floor, from the only instance that can report it.
			coverage: {
				command: 'vp test run --coverage --project "unit (chromium)"',
				cache: false,
			},
			// The end-to-end suite. Arguments go to `playwright test`.
			e2e: { command: "playwright test", cache: false },
			// Run every suite, stopping at the first that fails.
			"test:all": { command: ["vp test", "vp run coverage", "vp run e2e"], cache: false },
		},
	},

	// ---- Dev server (vp dev) ----
	plugins: lazyPlugins(() => [basicSsl(), devPageIndex(), engineResources()]),
	resolve: { alias: { [pkg.name]: fileURLToPath(new URL(ENTRY, import.meta.url)) } },
	appType: "mpa",
	define: ENGINE_DEFINES,
	// The test fixtures are listed so that bundling the engines does not reload the
	// first test's page.
	optimizeDeps: { entries: ["dev/*.html", "tests/e2e/fixtures/*.html"] },
	server: {
		host: "0.0.0.0",
		forwardConsole: { unhandledErrors: true, logLevels: ["error", "warn", "info", "log", "debug"] },
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
	},

	// ---- Tests (vp test) ----
	test: {
		projects: [
			{
				server: QUIET_SERVER,
				test: {
					name: "unit",
					globalSetup: ["vite/browsers-container.ts"],
					include: ["src/**/*.test.ts"],
					exclude: ["src/**/*.contract.test.ts"],
					browser: browserMode(),
				},
			},
			{
				server: QUIET_SERVER,
				test: {
					name: "contract",
					globalSetup: ["tests/license.ts", "vite/browsers-container.ts"],
					include: ["src/**/*.contract.test.ts"],
					// The engines load their WebAssembly on first use.
					testTimeout: 60_000,
					browser: browserMode(),
				},
			},
			{
				// These tests run in Node, so they skip the root config.
				extends: false,
				test: {
					name: "artifacts",
					// The checks read the built files, so they build first.
					globalSetup: ["tests/build.ts"],
					include: ["tests/artifacts/**/*.test.ts"],
					environment: "node",
				},
			},
		],
		// Only the Chromium instance can report v8 coverage.
		coverage: {
			include: ["src/**/*.ts"],
			exclude: [
				"src/**/*.test.ts",
				// Each drives the real engines, so only the end-to-end specs named run it.
				"src/flow/document-scanner.ts", // tests/e2e/flow/
				"src/phases/edit.ts", // tests/e2e/phases/edit.spec.ts
				"src/phases/rectify.ts", // tests/e2e/phases/rectify.spec.ts
			],
			thresholds: { 100: true, perFile: true },
		},
	},

	// ---- Static checks (vp check) ----
	staged: {
		"*": "vp check --fix",
		// The related unit tests, but not the contract tests, which need the license
		// server. Then the artifact suite, whose snapshot of the public API fails when
		// the API changed, so that a developer accepts the change before committing it.
		"{src/**/*,tests/*}.ts": [
			'vp test related --project "unit*"',
			() => "vp test run --project artifacts",
		],
	},
	fmt: {
		// oxfmt's markdown printer ignores useTabs.
		ignorePatterns: ["**/*.md"],
	},
	lint: {
		jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
		rules: {
			"vite-plus/prefer-vite-plus-imports": "error",
			// Its autofix strips the explicit `| undefined` that isolatedDeclarations
			// (vp pack dts) requires on optional parameter properties (TS9025).
			"typescript/no-duplicate-type-constituents": "off",
			"no-restricted-imports": ["error", { patterns: [ENGINE_IMPORT] }],
		},
		overrides: [
			{ files: ["src/engines/**"], rules: { "no-restricted-imports": "off" } },
			// The build reads only the settings, so it loads no screen or engine code. An
			// override replaces the whole rule, so it restates the engine pattern.
			{
				files: ["vite.config.ts"],
				rules: {
					"no-restricted-imports": [
						"error",
						{
							patterns: [
								{
									group: ["./src/**", "!./src/settings/**"],
									message: "vite.config.ts may import only src/settings",
								},
								ENGINE_IMPORT,
							],
						},
					],
				},
			},
		],
		options: { typeAware: true, typeCheck: true },
	},

	// ---- Library packaging (vp pack) ----
	// Two passes, because `external` applies to a whole bundle.
	pack: [
		{
			name: "esm",
			entry: { "document-scanner": ENTRY },
			format: ["esm"],
			platform: "browser",
			target: TARGET,
			deps: { neverBundle: ENGINES },
			// Use oxc, because tsc needs TypeScript installed. oxc needs each export's
			// type written out.
			dts: { generator: "oxc" },
			clean: true,
			define: ENGINE_DEFINES,
			banner: { js: banner },
			outputOptions: { exports: "named" },
			// Fixed names, because they are public URLs.
			hash: false,
			outExtensions: () => ({ js: ".mjs", dts: ".d.mts" }),
			plugins: [rawImports()],
			// Generate the published defaults from the library's own code.
			onSuccess: () => {
				mkdirSync("dist/defaults", { recursive: true });
				writeFileSync(
					"dist/defaults/settings.json",
					`${JSON.stringify(defaultSettings(), null, "\t")}\n`,
				);
				// The built-in templates of each screen's areas, for a host application to
				// copy into phases.<phase>.layout. The copies are .xml, because dev servers
				// inject a live-reload script into HTML.
				copyFileSync(CAPTURE_LAYOUT, "dist/defaults/capture-layout.xml");
				copyFileSync(RECTIFY_LAYOUT, "dist/defaults/rectify-layout.xml");
				copyFileSync(EDIT_LAYOUT, "dist/defaults/edit-layout.xml");
			},
			publint: { level: "error" },
			attw: { profile: "esm-only", level: "error" },
		},
		{
			name: "iife",
			entry: { "document-scanner": ENTRY },
			format: ["iife"],
			globalName: "Dynamsoft",
			platform: "browser",
			target: TARGET,
			deps: { alwaysBundle: ENGINES, onlyBundle: ENGINES },
			define: ENGINE_DEFINES,
			plugins: [rawImports()],
			dts: false,
			clean: false,
			minify: true,
			banner: { js: banner },
			hash: false,
			// `extend` adds to a Dynamsoft global the page already has.
			outputOptions: { exports: "named", extend: true },
		},
	],
});

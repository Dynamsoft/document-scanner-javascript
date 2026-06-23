import { defineConfig } from "vite";
import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import basicSsl from "@vitejs/plugin-basic-ssl";

const here = import.meta.dirname;
const nodeRequire = createRequire(import.meta.url);

// Mirror the SDKs' runtime resources from node_modules into public/

// DCV engine resources
for (const pkg of ["dynamsoft-capture-vision-bundle", "dynamsoft-capture-vision-data"]) {
	const src = resolve(here, `node_modules/${pkg}`);
	const dest = resolve(here, `public/${pkg}`);
	const srcVer: string = nodeRequire(`${src}/package.json`).version;
	const destVer = existsSync(`${dest}/package.json`)
		? nodeRequire(`${dest}/package.json`).version
		: null;
	if (srcVer !== destVer) cpSync(src, dest, { recursive: true });
}

// DDV engine — fetched at runtime by Document Viewer. Only dist/engine is
// needed (the viewer JS/CSS itself is bundled); package.json is the
// version gate.
{
	const src = resolve(here, "node_modules/dynamsoft-document-viewer");
	const dest = resolve(here, "public/dynamsoft-document-viewer");
	const srcVer: string = nodeRequire(`${src}/package.json`).version;
	const destVer = existsSync(`${dest}/package.json`)
		? nodeRequire(`${dest}/package.json`).version
		: null;
	if (srcVer !== destVer) {
		cpSync(`${src}/dist/engine`, `${dest}/dist/engine`, { recursive: true });
		copyFileSync(`${src}/package.json`, `${dest}/package.json`);
	}
}

// Camera UI template for the Document Scanner view. Tiny, so copied
// unconditionally.
{
	const src = resolve(here, "node_modules/dynamsoft-document-scanner/dist/document-scanner.ui.xml");
	mkdirSync(resolve(here, "public"), { recursive: true });
	copyFileSync(src, resolve(here, "public/document-scanner.ui.xml"));
}

export default defineConfig({
	// Emit relative paths in index.html so the demo also works under a
	// non-root deploy base like /document-scanner/.
	base: "./",
	plugins: [
		basicSsl(),
		// sanitize:begin iis-web-config
		{
			// IIS-specific MIME mapping (web.config) for `.data` files;
			// stripped from sanitized downstream builds.
			name: "copy-web-config",
			closeBundle() {
				const src = resolve(here, "web.config");
				if (existsSync(src)) cpSync(src, resolve(here, "dist/web.config"));
			},
		},
		// sanitize:end iis-web-config
	],
	server: {
		host: "0.0.0.0",
		// No COOP/COEP headers: crossOriginIsolated makes DCV pick its
		// multi-threaded (pthread) WASM variant, which is broken before DCV
		// 3.4.2000 (preset templates fail to load, error -10036) — and the
		// SDK pins ~3.2.5000. Re-add "Cross-Origin-Opener-Policy:
		// same-origin" + "Cross-Origin-Embedder-Policy: credentialless"
		// once the SDK's DCV line moves past 3.4.2000.
	},
});

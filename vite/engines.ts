// Where the engine packages are on disk.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pkg from "../package.json" with { type: "json" };

// Engine paths resolve against the project root.
const ROOT = new URL("../", import.meta.url);

/** The engine package names, from the peer dependencies. */
export const ENGINES: string[] = Object.keys(pkg.peerDependencies ?? {});

/** Resolve a path inside an installed engine package. */
export function engineFile(name: string, ...parts: string[]): string {
	return fileURLToPath(new URL(["node_modules", name, ...parts].join("/"), ROOT));
}

/**
 * Read an engine's installed version. Without an install, return the declared
 * range, so the config still loads.
 */
export function engineVersion(name: string): string {
	const manifest = engineFile(name, "package.json");
	return existsSync(manifest)
		? JSON.parse(readFileSync(manifest, "utf-8")).version
		: (pkg.peerDependencies as Record<string, string>)[name]!;
}

/**
 * Read the installed Capture Vision's core version from its bundle. The engine
 * reports only this version at runtime, through `CoreModule.getVersion()`.
 * Without an install, return an empty string, so the config still loads.
 */
export function captureVisionCoreVersion(): string {
	const bundle = engineFile("dynamsoft-capture-vision-bundle", "dist", "dcv.bundle.mjs");
	if (!existsSync(bundle)) return "";
	const found = /core:\{version:"(\d+\.\d+\.\d+)/.exec(readFileSync(bundle, "utf-8"));
	if (!found) throw new Error("dcv.bundle.mjs no longer names its core version where expected");
	return found[1]!;
}

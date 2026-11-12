// Browser servers in Playwright's image for the test runners on the host.

import { spawn } from "node:child_process";
import { once } from "node:events";
import { relative, sep } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import pkg from "../package.json" with { type: "json" };

// The checkout, mounted read-only at /work in the container.
const ROOT = fileURLToPath(new URL("../", import.meta.url));

const IMAGE = `mcr.microsoft.com/playwright:v${pkg.devDependencies.playwright}-noble`;

/** Map a file in the checkout to its path in the container. */
export function browserPath(path: string): string {
	return `/work/${relative(ROOT, path).split(sep).join("/")}`;
}

/** A browser server for one test runner. */
export interface BrowserServer {
	readonly connectOptions: { readonly wsEndpoint: string; readonly exposeNetwork: string };
	/**
	 * Start the server unless one already answers, and resolve to a function that
	 * stops it. A server that another run started is left for that run to stop.
	 */
	start(): Promise<() => Promise<void>>;
}

/**
 * Set up Playwright's browser server in its image, published on the host's
 * localhost. `--unsafe` lets runners pass the fake cameras' launch options. It
 * stops on an interrupt, which `--init` passes on.
 */
function browserServer(port: number): BrowserServer {
	const url = `http://127.0.0.1:${port}/`;
	const answers = () =>
		fetch(url)
			.then(() => true)
			.catch(() => false);
	return {
		connectOptions: { wsEndpoint: `ws://127.0.0.1:${port}/`, exposeNetwork: "<loopback>" },
		async start() {
			if (await answers()) return async () => {};
			// podman's own messages, such as the first pull of the image, go to stderr.
			const server = spawn(
				"podman",
				[
					"run",
					"--rm",
					"--init",
					"--ipc=host",
					`--publish=127.0.0.1:${port}:${port}`,
					`--volume=${ROOT}:/work:ro`,
					IMAGE,
					"node",
					"/work/node_modules/playwright/cli.js",
					"run-server",
					`--port=${port}`,
					"--host=0.0.0.0",
					"--unsafe",
				],
				{ stdio: ["ignore", "ignore", "inherit"] },
			);
			await once(server, "spawn");
			const exited = once(server, "exit");
			while (!(await answers())) {
				if ((server.exitCode ?? server.signalCode) !== null) {
					throw new Error("podman stopped before the browser server answered");
				}
				await delay(250);
			}
			return async () => {
				server.kill("SIGINT");
				await exited;
			};
		},
	};
}

/** The browsers of the unit and contract tests. */
export const VITEST_BROWSERS: BrowserServer = browserServer(9330);

/** Start the Vitest browsers, as the browser projects' global setup. */
export function setup(): Promise<() => Promise<void>> {
	return VITEST_BROWSERS.start();
}

/** The end-to-end browsers, kept apart so neither runner stops the other's. */
export const E2E_BROWSERS: BrowserServer = browserServer(9331);

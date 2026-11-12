// Middleware for `vp dev`.

import { createReadStream, readdirSync, statSync } from "node:fs";
import { extname, sep } from "node:path";
import type { Plugin } from "vite-plus";
import { ENGINES, engineFile, engineVersion } from "./engines";

/** Serve a list of the pages in dev/ at /. */
export function devPageIndex(): Plugin {
	return {
		name: "document-scanner:dev-page-index",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url !== "/") return next();
				const files = readdirSync("dev")
					.filter((f) => String(f).endsWith(".html"))
					.map((f) => `dev/${f}`);
				const links = files.map((f) => `<li><a href="/${f}">${f}</a></li>`).join("\n");
				res.setHeader("content-type", "text/html");
				res.end(
					`<meta name="viewport" content="width=device-width,initial-scale=1"><style>li{margin:.5rem 0}li a{font-size:1.25rem}</style><h2>Pages</h2><ul>${links}</ul>`,
				);
			});
		},
	};
}

const RESOURCE_TYPES: Record<string, string> = {
	".js": "text/javascript",
	".mjs": "text/javascript",
	".json": "application/json",
	".wasm": "application/wasm",
	".css": "text/css",
	".html": "text/html",
};

/**
 * Decode a request path, or return `null` when it cannot name a file. A bad escape
 * or a NUL would throw, even with `throwIfNoEntry`, and Vite would answer 500.
 */
function decodePath(raw: string): string | null {
	try {
		const path = decodeURIComponent(raw);
		return path.includes("\0") ? null : path;
	} catch {
		return null;
	}
}

/**
 * Serve the engines' runtime files from node_modules under `root`, for example
 *
 * 	/engine/dynamsoft-capture-vision-bundle@3.6.2000/dist/dcv.bundle.worker.js
 *
 * The unversioned form works too, for a page that pins one module path.
 */
export function engineResources(root = "/engine/"): Plugin {
	return {
		name: "document-scanner:engine-resources",
		apply: "serve",
		configureServer(server) {
			const headers = Object.entries(server.config.server.headers ?? {});
			server.middlewares.use((req, res, next) => {
				const path = decodePath((req.url ?? "").split("?")[0]!);
				if (path === null || !path.startsWith(root)) return next();
				const [request, ...rest] = path.slice(root.length).split("/");
				const [name = "", wanted] = request!.split("@");
				if (!ENGINES.includes(name)) return next();
				const installed = engineVersion(name);
				if (wanted && wanted !== installed) {
					server.config.logger.warnOnce(
						`[document-scanner] ${name}@${wanted} requested, ${installed} installed`,
					);
				}
				const file = engineFile(name, ...rest);
				// The decoded path may contain `..`, so keep it inside the package.
				if (!file.startsWith(engineFile(name) + sep)) return next();
				const stat = statSync(file, { throwIfNoEntry: false });
				if (!stat?.isFile()) return next();
				for (const [header, value] of headers) if (value != null) res.setHeader(header, value);
				res.setHeader("content-type", RESOURCE_TYPES[extname(file)] ?? "application/octet-stream");
				res.setHeader("content-length", stat.size);
				if (req.method === "HEAD") return void res.end();
				createReadStream(file).pipe(res);
			});
		},
	};
}

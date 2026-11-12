import { readFileSync } from "node:fs";
import type { Plugin } from "vite-plus";

const RAW = /\?raw$/;

/**
 * Load `?raw` imports as text in `vp pack`, whose rolldown has no loader for them.
 * `load` gets the absolute path with the query, so no `resolveId` is needed.
 */
export function rawImports(): Plugin {
	return {
		name: "document-scanner:raw-imports",
		load: {
			filter: { id: RAW },
			handler: (id) =>
				`export default ${JSON.stringify(readFileSync(id.replace(RAW, ""), "utf-8"))};`,
		},
	};
}

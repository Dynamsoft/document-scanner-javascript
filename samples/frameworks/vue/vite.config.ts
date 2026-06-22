import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { cpSync, existsSync } from "node:fs";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Mirror the SDK runtime resources from node_modules into public/ so the
// engine, runtime data, and camera UI are self-hosted from this origin.
const SDK_RESOURCES = [
	"dynamsoft-document-scanner/dist",
	"dynamsoft-capture-vision-bundle/dist",
	"dynamsoft-capture-vision-data",
];

for (const pkg of SDK_RESOURCES) {
	if (!existsSync(`public/${pkg}`)) {
		cpSync(`node_modules/${pkg}`, `public/${pkg}`, { recursive: true });
	}
}

export default defineConfig({
	plugins: [basicSsl(), vue()],
	server: {
		host: "0.0.0.0",
		forwardConsole: true,
	},
});

/// <reference types="vite/client" />

// Shim for editors/tsc; Volar type-checks the real SFCs.
declare module "*.vue" {
	import type { DefineComponent } from "vue";
	const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
	export default component;
}

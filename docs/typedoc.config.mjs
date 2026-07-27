import { defineDynamsoftTypedoc } from "@dynamsoft-docs/vitepress-docs/typedoc";

// defineDynamsoftTypedoc supplies the fleet-wide mechanics: the base
// options (markdown + vitepress plugins, `api/` wiped per run, no README
// page, private/internal excluded), the GitHub `sourceLinkTemplate` built
// from `repo`, and source links pointing at the branch being documented —
// see the theme README. Everything below is MDS-specific.
//
// Path-type options (out, docsRoot, basePath, tsconfig, entryPoints)
// resolve relative to this file.
export default defineDynamsoftTypedoc({
	name: "Mobile Document Scanner API Reference",
	repo: "Dynamsoft/document-scanner-javascript",
	entryPoints: ["../src/build/index.ts"],
	tsconfig: "../tsconfig.json",
	out: "api",
	// The v1.4.2-era TSDoc needs looser checking and the DCV custom
	// modifier tags; the v1.5 line dropped these, so they stay here
	// rather than in the theme's base options.
	skipErrorChecking: true,
	validation: {
		notExported: false,
		invalidLink: false,
	},
	compilerOptions: {
		ignoreDeprecations: "6.0",
	},
	modifierTags: [
		"@alpha",
		"@beta",
		"@eventProperty",
		"@experimental",
		"@internal",
		"@override",
		"@packageDocumentation",
		"@public",
		"@readonly",
		"@sealed",
		"@virtual",
		"@abstract",
		"@class",
		"@disableGroups",
		"@enum",
		"@event",
		"@expand",
		"@hidden",
		"@hideCategories",
		"@hideconstructor",
		"@hideGroups",
		"@ignore",
		"@inline",
		"@interface",
		"@namespace",
		"@function",
		"@overload",
		"@private",
		"@protected",
		"@reexport",
		"@showCategories",
		"@showGroups",
		"@useDeclaredType",
		"@primaryExport",
		"@stable",
	],
	externalSymbolLinkMappings: {
		typescript: {
			File: "https://developer.mozilla.org/en-US/docs/Web/API/File",
		},
		"dynamsoft-capture-vision-bundle": {
			ImageEditorView:
				"https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/api-reference/index.html",
			DetectedQuadResultItem:
				"https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/api-reference/index.html",
			DT_Quad:
				"https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/api-reference/index.html",
			Quadrilateral:
				"https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/api-reference/index.html",
			DrawingLayer:
				"https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/api-reference/index.html",
		},
	},
	basePath: "..",
});

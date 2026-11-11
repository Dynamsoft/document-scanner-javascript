import { defineDynamsoftTypedoc } from "@dynamsoft-docs/vitepress-docs/typedoc";

export default defineDynamsoftTypedoc({
	name: "Mobile Document Scanner API Reference",
	repo: "Dynamsoft/document-scanner-javascript",
	entryPoints: ["../src/index.ts"],
	tsconfig: "../tsconfig.json",
	out: "api",
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

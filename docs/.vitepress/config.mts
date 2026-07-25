import { defineDynamsoftConfig, loadApiSidebar } from "@dynamsoft-docs/vitepress-docs/config";

// defineDynamsoftConfig supplies the fleet-wide mechanics: versioned `base`
// from themeConfig.docsRoot + the DOCS_VERSION env var, GitHub-style GFM
// alerts, nav-bar banner conventions, local search, and theme bundling —
// see the theme README. Everything below is MDS-specific.
export default defineDynamsoftConfig({
	title: "Mobile Document Scanner JS Edition",
	description:
		"Documentation for Dynamsoft Mobile Document Scanner JavaScript Edition (MDS): scan, enhance, and correct document images in the browser.",
	// The React/Vue guides tell the reader to open the sample dev server
	// (e.g. http://localhost:8080/index) — instructions, not dead links.
	ignoreDeadLinks: [/^https?:\/\/localhost/],
	themeConfig: {
		// Root URL path of the published docs site on www.dynamsoft.com.
		docsRoot: "/mobile-document-scanner/docs/web/",
		dynamsoftChrome: true,
		breadcrumbLabels: {
			guide: "User Guide",
			api: "API Reference",
		},
		nav: [
			{ text: "Download", link: "https://www.dynamsoft.com/mobile-document-scanner/downloads/" },
		],
		sidebar: [
			{ text: "Introduction", link: "/introduction/" },
			{
				text: "User Guide",
				items: [
					{ text: "Developer Guide", link: "/guide/" },
					{ text: "Angular Guide", link: "/guide/angular" },
					{ text: "React Guide", link: "/guide/react" },
					{ text: "Vue Guide", link: "/guide/vue" },
				],
			},
			{
				text: "API Reference",
				link: "/api/",
				items: loadApiSidebar(),
			},
			{ text: "Changelog", link: "/changelog" },
		],
	},
});

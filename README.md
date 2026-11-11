# Mobile Document Scanner JavaScript Edition

Dynamsoft's **Mobile Document Scanner JavaScript Edition (MDS)** is a web SDK
for scanning documents in the browser. MDS captures images of documents with
automatic border detection, applies perspective correction, and enhances the
results to professional standards — all behind a ready-made, mobile-first UI
launched with a few lines of code.

**[User Guide](https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html)** ·
**[API Reference](https://www.dynamsoft.com/mobile-document-scanner/docs/web/api/index.html)** ·
**[Live Demo](https://demo.dynamsoft.com/document-scanner/)**

## Install

```shell
npm install @dynamsoft/document-scanner
```

Both engines — Dynamsoft Capture Vision and Dynamsoft Document Viewer — are peer
dependencies, and are installed alongside it.

Or load the script build from a CDN, which bundles both engines:

```html
<script src="https://cdn.jsdelivr.net/npm/@dynamsoft/document-scanner@2.0.0/dist/document-scanner.iife.js"></script>
```

## Quick Start

MDS requires a license key to run — request a
[free 30-day trial license](https://www.dynamsoft.com/customer/license/trialLicense/?product=mds&deploymenttype=web)
through the customer portal.

```html
<script src="https://cdn.jsdelivr.net/npm/@dynamsoft/document-scanner@2.0.0/dist/document-scanner.iife.js"></script>
<script type="module">
	const scanner = new Dynamsoft.DocumentScanner({ license: "YOUR_LICENSE_KEY_HERE" });

	const result = await scanner.scan();
	if (result.status === "success") {
		// result.pages carries the scanned pages; result.output, the file.
	}
</script>
```

Alternatively, clone this repository and run the Hello World page against the
source:

```shell
pnpm install
pnpm run dev
```

Then open [`hello-world.html`](dev/hello-world.html) at the address the dev
server prints.

## Documentation

The full documentation lives on the
[MDS documentation site](https://www.dynamsoft.com/mobile-document-scanner/docs/web/):

- [User Guide](https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html) —
	the Hello World sample explained, deployment tips, multi-page scanning,
	workflow and UI customization.
- [API Reference](https://www.dynamsoft.com/mobile-document-scanner/docs/web/api/index.html) —
	generated from the TSDoc in this repository's source.

For **multi-document processing** with advanced editing features, see the
**Mobile Web Capture (MWC)** sample project — read its
[User Guide](https://www.dynamsoft.com/mobile-document-scanner/docs/web/code-gallery/mobile-web-capture/index.html).

## License

- [Request a trial license](https://www.dynamsoft.com/customer/license/trialLicense/?product=mds&deploymenttype=web) —
	renewable twice for a total of two months of free access.
- [Contact us](https://www.dynamsoft.com/company/contact/) to purchase a
	full license.

<!--
	This page is the authored source of the user guide. The repository
	README.md is a hand-written landing stub. At publish time, publish.yml
	generates the npm README from this page with the docs theme's
	scripts/npm-readme.mjs.
-->

# Scan Documents with Mobile Document Scanner

> [!TIP]
> Read the [Introduction](/index.md) for common use cases, the screens, and the system requirements.

Dynamsoft's **Mobile Document Scanner JavaScript Edition (MDS)** is a web SDK for scanning documents with a camera. MDS finds the document in the camera view, takes a photo of it, and straightens it. The user can then check and edit the pages.

> [!NOTE]
> See it in action with the [Mobile Document Scanner Demo](https://demo.dynamsoft.com/document-scanner/).

This guide shows how to build a web page that scans a document of one or more pages and offers it as a PDF.

## License

### Get a Trial License

You can request a trial license for **Mobile Document Scanner** through our [customer portal](https://www.dynamsoft.com/customer/license/trialLicense/?product=mds&deploymenttype=web). You can renew the trial license twice, for a total of two months of free access.

### Get a Full License

[Contact us](https://www.dynamsoft.com/company/contact/) to purchase a full license.

## Quick Start

Choose one of these ways to start:

1. **Install from npm** – for a project that uses a bundler, such as Vite or webpack.
2. **Load from a CDN** – for a single HTML page, with one script tag.
3. **Run from source** – to try the Hello World sample from [GitHub repository](https://github.com/Dynamsoft/document-scanner-javascript), which allows you to modify the MDS library itself.

### Install from npm

MDS is the npm package [`@dynamsoft/document-scanner`](https://www.npmjs.com/package/@dynamsoft/document-scanner). It needs two `peerDependencies`, Dynamsoft Capture Vision and Dynamsoft Document Viewer. pnpm, npm, and bun install them with the package:

```shell [pnpm]
pnpm add @dynamsoft/document-scanner
```

```shell [npm]
npm install @dynamsoft/document-scanner
```

```shell [bun]
bun add @dynamsoft/document-scanner
```

Yarn does not install peer dependencies:

```shell [yarn]
yarn add @dynamsoft/document-scanner dynamsoft-capture-vision-bundle@~3.6.5000 dynamsoft-document-viewer@~5.0.1
```

Then import the document scanner and start a scan:

```javascript
import { DocumentScanner } from "@dynamsoft/document-scanner";

const scanner = new DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE", // Replace this with your license key.
	output: { format: "pdf" },
});
const result = await scanner.scan();
```

See the [framework samples](/guide/frameworks.md) for complete Angular, React, and Vue projects set up this way.

### Load from a CDN

The package also contains a build for a plain `<script>` tag, `dist/document-scanner.iife.js`. This bundle is self contained, and exposes the [`DocumentScanner`](/api/classes/DocumentScanner.md) class as [`Dynamsoft.DocumentScanner`](/api/classes/DocumentScanner.md):

```html
<script src="https://cdn.jsdelivr.net/npm/@dynamsoft/document-scanner@2.0.0/dist/document-scanner.iife.js"></script>
```

Below is the complete Hello World page with this script.

> [!IMPORTANT]
> Replace `"YOUR_LICENSE_KEY_HERE"` with your license key.

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Dynamsoft Mobile Document Scanner – Hello World</title>
		<script src="https://cdn.jsdelivr.net/npm/@dynamsoft/document-scanner@2.0.0/dist/document-scanner.iife.js"></script>
	</head>
	<body>
		<h1>Dynamsoft Mobile Document Scanner</h1>
		<p id="status" role="status">Scanning…</p>
		<a id="download" download="scan.pdf" hidden>Download the PDF</a>

		<script type="module">
			const scanner = new Dynamsoft.DocumentScanner({
				license: "YOUR_LICENSE_KEY_HERE", // Replace this with your license key.
				output: { format: "pdf" },
			});

			const result = await scanner.scan();
			const status = document.getElementById("status");
			if (result.status === "success") {
				status.textContent = `Scanned ${result.pages.length} page(s).`;
				if (result.output?.format === "pdf") {
					const download = document.getElementById("download");
					download.href = URL.createObjectURL(result.output.document);
					download.hidden = false;
				}
			} else if (result.status === "failed") {
				status.textContent = `The scan failed (${result.error.kind}): ${result.error.message}`;
			} else {
				status.textContent = "The scan was cancelled.";
			}
		</script>
	</body>
</html>
```

To run the page, save the code as `hello-world.html`, and serve it from a web server. The camera works only on a page served over HTTPS, or from `localhost`.

If you use VS Code, the [Five Server (Live Server) extension](https://marketplace.visualstudio.com/items?itemName=yandeu.five-server) serves a page quickly. Install the extension, open `hello-world.html`, and click "Go Live" in the bottom right corner of the editor. The page then opens at `http://127.0.0.1:5500/hello-world.html`.

### Run the Sample from Source

MDS is open source (but not its dependencies), so you can modify the library in case the configurations offered by the APIs are insufficient.

The [GitHub repository](https://github.com/Dynamsoft/document-scanner-javascript) contains the source code and a Hello World sample. Its development server runs the sample against the source code. You need [Node.js](https://nodejs.org/) 26 and [pnpm](https://pnpm.io/) 12.14 or later.

1. Clone the repository, or download it from GitHub as a ZIP file and extract it.

2. Set your [license key](#get-a-trial-license) in the Hello World sample. Open [`dev/hello-world.html`](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/dev/hello-world.html), search for `"YOUR_LICENSE_KEY_HERE"`, and replace it with your license key.

3. In a terminal at the root directory of the repository, install the dependencies and start the development server:

	```shell
	pnpm install
	pnpm dev
	```

4. Open the `https://` address that the development server prints, and choose `hello-world.html`. The server uses a self-signed certificate, so the browser shows a warning. Accept it to continue. To test on a phone on the same network, open the `Network` address.

> [!IMPORTANT]
> The `dev` server has hot reloading, so you can use `hello-world.html` to easily test modifications to the library itself.

## Hello World Page Explained

This section walks through the Hello World page of [Load from a CDN](#load-from-a-cdn).

> [!TIP]
> The [Hello World sample on GitHub](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/dev/hello-world.html) does the same as an ES module, and loads the engines' files from the development server.

### Load the Document Scanner

MDS comes in two builds:

- **The script build** (`document-scanner.iife.js`) suits a single HTML page, because it needs no `import` statement. Use [`Dynamsoft.DocumentScanner`](/api/classes/DocumentScanner.md).
- **The ES module** (`document-scanner.mjs`, the package's main entry point) suits a project with a bundler. Use `import { DocumentScanner } from "@dynamsoft/document-scanner"`.

The ES module imports the two engines by their package names, `dynamsoft-capture-vision-bundle` and `dynamsoft-document-viewer`. A bundler resolves these names. To load the ES module in a plain HTML page with no bundler, declare an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) before the module script. The import map tells the browser where to find these names:

```html
<script type="importmap">
	{
		"imports": {
			"@dynamsoft/document-scanner": "https://cdn.jsdelivr.net/npm/@dynamsoft/document-scanner@2.0.0/dist/document-scanner.mjs",
			"dynamsoft-capture-vision-bundle": "https://cdn.jsdelivr.net/npm/dynamsoft-capture-vision-bundle@3.6.5000/dist/dcv.bundle.esm.js",
			"dynamsoft-document-viewer": "https://cdn.jsdelivr.net/npm/dynamsoft-document-viewer@5.0.1/dist/ddv.es.js"
		}
	}
</script>
```

> [!NOTE]
> MDS loads the engines' runtime files, such as their `.wasm` files, from the jsDelivr CDN by default. To serve them yourself, see [Self-Host Resources](#self-host-resources).

### Create the Document Scanner

```javascript
const scanner = new Dynamsoft.DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE", // Replace this with your license key.
	output: { format: "pdf" },
});
```

If a setting has an unknown key or a wrong value, the constructor throws a `TypeError` that names the setting. The constructor loads nothing. The engines load at the first [`scan()`](/api/classes/DocumentScanner.md#scan), or earlier if you call [`preload()`](/api/classes/DocumentScanner.md#preload).

[`output: { format: "pdf" }`](/api/type-aliases/OutputSettings.md) asks for the scanned document as one PDF file. Without [`output`](/api/type-aliases/OutputSettings.md), the result holds only the pages.

By default, the document scanner covers the whole browser window while a scan runs. To show it inside an element of your page, set [`container`](/api/interfaces/ScannerSettings.md#container).

Use your own license key. With a key that the license server refuses, the scan fails with the error kind `"license"`.

### Run a Scan

```javascript
const result = await scanner.scan();
```

[`scan()`](/api/classes/DocumentScanner.md#scan) shows the document scanner, and resolves when the session ends. A session has three screens:

1. **The capture screen** shows the camera view and outlines the document that it finds. With auto-capture on, the document scanner takes a photo when the document holds still and fills enough of the view. Until then, a hint asks the user to move closer or farther away. The user can also press the shutter button, or import an image.
2. **The rectify screen** shows each page just taken, so that the user can check and adjust its corners.
3. **The edit screen** shows every page. The user can reorder, rotate, filter, and delete pages, undo and redo each change, add more pages, and finish the scan.

A session ends in one of three ways, and [`result.status`](/api/type-aliases/ScanResult.md) says which:

- `"success"`: the user finished the scan. [`result.pages`](/api/interfaces/SuccessfulScan.md#pages) holds the pages, and [`result.output`](/api/interfaces/SuccessfulScan.md#output) holds the file that [`output`](/api/type-aliases/OutputSettings.md) asks for.
- `"cancelled"`: the user cancelled, or your page called [`cancel()`](/api/classes/DocumentScanner.md#cancel), [`reset()`](/api/classes/DocumentScanner.md#reset), or [`dispose()`](/api/classes/DocumentScanner.md#dispose).
- `"failed"`: the scan could not go on. [`result.error.kind`](/api/type-aliases/ScannerError.md) names the cause, such as `"license"`, `"cameraPermission"`, or `"engineLoad"`.

[`scan()`](/api/classes/DocumentScanner.md#scan) never rejects for these outcomes. It rejects only when it cannot start a session: when the document scanner is disposed, when a session already runs, or when the file you pass is not a `Blob`.

To start a scan session from an existing image file, call [`scan(file)`](/api/classes/DocumentScanner.md#scan). The document scanner handles the image as if the user imported it, and it skips the camera. The camera opens only if the capture screen opens later when adding more pages, or retaking. If the browser cannot read the file as an image, a notice shows, and the capture screen opens.

### Use the Result

```javascript
const status = document.getElementById("status");
if (result.status === "success") {
	status.textContent = `Scanned ${result.pages.length} page(s).`;
	if (result.output?.format === "pdf") {
		const download = document.getElementById("download");
		download.href = URL.createObjectURL(result.output.document);
		download.hidden = false;
	}
}
```

[`result.output.document`](/api/type-aliases/ScanOutput.md) is the PDF as a `Blob`, and the page offers it through a download link.

Each page in [`result.pages`](/api/interfaces/SuccessfulScan.md#pages) has two images. [`original`](/api/interfaces/ScannedPage.md#original) is the photo as taken. [`processed`](/api/interfaces/ScannedPage.md#processed) is the page after the user's edits. To get an image as a `Blob`, call [`toBlob()`](/api/interfaces/PageImageBase.md#toblob). To get it as a `<canvas>`, call [`toCanvas()`](/api/interfaces/PageImageBase.md#tocanvas). [`processed`](/api/interfaces/ScannedPage.md#processed) stops working after [`cancel()`](/api/classes/DocumentScanner.md#cancel), [`reset()`](/api/classes/DocumentScanner.md#reset), or [`dispose()`](/api/classes/DocumentScanner.md#dispose), so call [`toBlob()`](/api/interfaces/PageImageBase.md#toblob) or [`toCanvas()`](/api/interfaces/PageImageBase.md#tocanvas) before then.

After a successful or failed scan, the pages stay in the document scanner, and the next [`scan()`](/api/classes/DocumentScanner.md#scan) starts with them. A cancelled scan drops them. To start the next scan empty, call [`reset()`](/api/classes/DocumentScanner.md#reset). When your page no longer needs the document scanner, call [`dispose()`](/api/classes/DocumentScanner.md#dispose) to release the engines.

## Deployment Tips

### Self-Host Resources

By default, MDS loads the engines' runtime files from the jsDelivr CDN. To serve them from your own server, copy them to it and set [`resources`](/api/interfaces/ResourceSettings.md). The license check still contacts the Dynamsoft license server.

Both engines use the same root directory, which you set in [`resources.captureVision.rootDirectory`](/api/interfaces/ResourceSettings.md#capturevision). Under that root, the files have the same layout as on the CDN:

- Capture Vision: `<root>/dynamsoft-capture-vision-bundle@<version>/dist/`.
- Document Viewer: `<root>/dynamsoft-document-viewer@<version>/dist/engine/`, with its stylesheet at `<root>/dynamsoft-document-viewer@<version>/dist/ddv.css`.

For example, with the engines installed from npm, copy the `dist` directory of each package to your server:

```text
node_modules/dynamsoft-capture-vision-bundle/dist/  ->  /libs/dynamsoft-capture-vision-bundle@3.6.5000/dist/
node_modules/dynamsoft-document-viewer/dist/        ->  /libs/dynamsoft-document-viewer@5.0.1/dist/
```

Then name the root directory in the settings:

```javascript
const scanner = new DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE",
	resources: {
		captureVision: { rootDirectory: "https://example.com/libs/" },
	},
});
```

The versions in the paths must be the versions of the engines that your page loads. The script build of MDS 2.0.0 includes Capture Vision 3.6.5000 and Document Viewer 5.0.1. To place Document Viewer's files somewhere else, set [`resources.documentViewer`](/api/interfaces/ResourceSettings.md#documentviewer) to the URL of its `dist/engine` directory. Keep `ddv.css` in the directory above it, matching the layout of the Document Viewer package.

### Set a Content Security Policy

If your web application sends [Content Security Policies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), you must add the following for MDS to function:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' blob: 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net https://*.dynamsoft.com https://*.dynamsoftonline.com; img-src 'self' blob:; style-src 'self' blob:; font-src 'self' data:
```

- `'wasm-unsafe-eval'` in `script-src` allows WebAssembly compilation.
- `blob:` in `script-src` and `worker-src` allows workers.
- `blob:` in `style-src` allows loading stylesheets.
- `blob:` in `img-src` lets the screens show scanned pages.
- `data:` in `font-src` allows embedded fonts.
- `connect-src` names the CDN and the Dynamsoft license servers. MDS and the engines fetch their runtime files from the CDN, unless you self-host them. The license check always contacts a Dynamsoft license server.

MDS itself needs no `'unsafe-inline'`. Adapt the policy to your page in these cases:

- If you [self-host the resources](#self-host-resources), replace `https://cdn.jsdelivr.net` with the origin that serves them.
- If you load the script build of MDS from the CDN, also add `https://cdn.jsdelivr.net` to `script-src`.
- If your page has inline scripts, give each one a nonce or a hash.

MDS requests the license from a worker. If the policy blocks the Dynamsoft license server, the scan fails with the error kind `"license"`. The page gets no `securitypolicyviolation` event for it.

### Serve over HTTPS

Serve your web application over **HTTPS** in production, for two reasons:

1. **Browser security** – browsers give access to the camera only on a secure page.

	> [!NOTE]
	> Browsers also treat `http://localhost` and `http://127.0.0.1` as secure, so the camera works there during development.

2. **Dynamsoft licenses** – a license works only on a secure page.

### Set the MIME Type

Some older web servers do not serve `.wasm` files with the `application/wasm` MIME type, which the browser needs. You have two options:

1. Upgrade your web server to one that supports the `application/wasm` MIME type.
2. Set the MIME type of `.wasm` files to `application/wasm` on your server. Each web server sets MIME types in its own way. See the instructions for [Apache](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Apache_Configuration_htaccess#media_types_and_character_encodings), [IIS](https://learn.microsoft.com/en-us/iis/configuration/system.webserver/staticcontent/mimemap), and [NGINX](https://nginx.org/en/docs/http/ngx_http_core_module.html#types).

### Cache the Resources

The `.wasm` files are large and can take several seconds to download. Set a long cache time for them with the `Cache-Control` HTTP header. For example, the `max-age` directive caches a file for a number of seconds:

```http
Cache-Control: max-age=31536000
```

See also:

- [`Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)

### Stack Page Elements with the Document Scanner

When the document scanner covers the browser window, it sits at z-index `2000000000`. Its dialogs open above every z-index, or at `2000000001` in a browser that cannot open them as modal dialogs. These values stay the same in every 2.x release. To show an element of your page above the document scanner, such as a chat button or a cookie banner, give it a z-index of `2000000002` or more. To keep an element below it, give it less than `2000000000`. See [`container`](/api/interfaces/ScannerSettings.md#container).

## Custom Usage

This section builds on the Hello World page, and changes what the document scanner does through its settings. The JavaScript examples import [`DocumentScanner`](/api/classes/DocumentScanner.md) from npm. With the script build, write [`Dynamsoft.DocumentScanner`](/api/classes/DocumentScanner.md) instead.

### Settings Overview

Every setting other than the [`license`](/api/interfaces/ScannerSettings.md#license) is optional. Pass them to the constructor:

| Setting | What it sets |
|---|---|
| [`license`](/api/interfaces/ScannerSettings.md#license) | The license key of both engines. |
| [`resources`](/api/interfaces/ResourceSettings.md) | Where the engines' runtime files come from. See [Self-Host Resources](#self-host-resources). |
| [`engines`](/api/interfaces/ScannerSettings.md#engines) | Engine modules that your page already imported, so that the page loads no second copy. |
| [`container`](/api/interfaces/ScannerSettings.md#container) | The element that the document scanner shows in. Without it, the document scanner covers the browser window. |
| [`theme`](/api/interfaces/ThemeTokens.md) | The colors of the screens. |
| [`strings`](/api/interfaces/StringSettings.md) | The text of the screens, for a translation or your own words. |
| [`output`](/api/type-aliases/OutputSettings.md) | The file that the result carries: a PDF, a TIFF, or one image per page. |
| [`maxPages`](/api/interfaces/ScannerSettings.md#maxpages) | The most pages that a document may hold. Unlimited by default. |
| [`phases`](/api/interfaces/PhaseSettings.md) | The settings of each screen. |

Each screen belongs to a phase: capture, rectify, or edit. [`phases`](/api/interfaces/PhaseSettings.md) holds the settings of each phase. To turn off the rectify or edit screen, set its phase to `false`. Some screens have modes. The rectify screen opens after each capture ([`afterCapture`](/api/interfaces/RectifyModes.md#aftercapture)) and from the edit screen ([`fromEdit`](/api/interfaces/RectifyModes.md#fromedit)). The edit screen opens the filter mode.

[`getSettings()`](/api/classes/DocumentScanner.md#getsettings) returns the settings in effect, with every default filled in. The package also lists every default, including each text and color, in `dist/defaults/settings.json`.

### Output Format

[`output`](/api/type-aliases/OutputSettings.md) sets the file that a successful result carries:

| [`output`](/api/type-aliases/OutputSettings.md) | [`result.output`](/api/interfaces/SuccessfulScan.md#output) |
|---|---|
| `{ format: "pdf" }` | `document`: one PDF with every page. |
| `{ format: "tiff" }` | `document`: one TIFF with every page. |
| `{ format: "images", encoding: "jpeg", quality: 0.9 }` | `images`: one JPEG per page, in page order. `quality` runs from 0 to 1. |
| `{ format: "images", encoding: "png" }` | `images`: one PNG per page, in page order. |
| absent | No file. The result holds only `pages`. |

### Multi-Page Scanning

By default, a session has no page limit. The thumbnail of the capture screen shows the newest page and the page count, and the edit screen shows every page. To limit the pages, set [`maxPages`](/api/interfaces/ScannerSettings.md#maxpages). When the document reaches the limit, the edit screen opens. If the edit phase is off, the scan ends.

```javascript
const scanner = new DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE",
	maxPages: 10,
	output: { format: "pdf" },
});
```

The done button of the edit screen finishes the scan. To finish it from your own code, call [`finish()`](/api/classes/DocumentScanner.md#finish). The pending [`scan()`](/api/classes/DocumentScanner.md#scan) then resolves with the pages, as if the user pressed done. [`finish()`](/api/classes/DocumentScanner.md#finish) resolves to whether the session ended. If the export fails, a notice tells the user, the session stays up, and [`finish()`](/api/classes/DocumentScanner.md#finish) resolves `false`.

### Events

[`on()`](/api/classes/DocumentScanner.md#on) adds a listener to an event, and returns a function that removes it:

| Event | When it fires |
|---|---|
| [`documentChange`](/api/interfaces/ScannerEvents.md#documentchange) | Pages came in, went out, or moved, a page changed, or what undo and redo can do changed. |
| [`navigate`](/api/interfaces/ScannerEvents.md#navigate) | The user moved to another screen or mode, or a notice or dialog opened or closed. |
| [`done`](/api/interfaces/ScannerEvents.md#done) | A scan succeeded. The document scanner waits for your listener before it closes its screens. |
| [`error`](/api/interfaces/ScannerEvents.md#error) | A scan failed, with the reason. |

To follow the pages while the user scans, listen to [`documentChange`](/api/interfaces/ScannerEvents.md#documentchange). Each change says what happened, such as [`"pagesAdded"`](/api/type-aliases/DocumentChange.md) or [`"pagesRemoved"`](/api/type-aliases/DocumentChange.md), and the state that it left:

```javascript
const stop = scanner.on("documentChange", (change) => {
	console.log(change.type, `${change.state.pageCount} page(s)`);
});
// Later, to stop listening:
stop();
```

To follow the screens, listen to [`navigate`](/api/interfaces/ScannerEvents.md#navigate). Each [move](/api/type-aliases/Navigation.md) says where the user went. Its `type` is `"phase"` for a screen, `"mode"` for a mode, or `"overlay"` for a notice or dialog. The API calls a notice or dialog an [overlay](/api/type-aliases/OverlayName.md):

```javascript
scanner.on("navigate", (move) => {
	if (move.type === "phase") console.log(`Now on the ${move.to} screen`);
});
```

A listener only reports. It cannot change what the document scanner does. To change what a button does, use its [`onClick`](/api/interfaces/ButtonSettings.md#onclick), as [Buttons](#buttons) shows.

### Workflow Customization

The examples below change the workflow of a document scanning session, and which screens a session uses.

#### Show the Document Scanner in an Element

By default, the document scanner covers the browser window. To show it inside an element of your page, name the element, or a selector for it, in [`container`](/api/interfaces/ScannerSettings.md#container), with a given element size:

```html
<div id="scanner" style="width: 100%; height: 600px"></div>

<script type="module">
	const scanner = new Dynamsoft.DocumentScanner({
		license: "YOUR_LICENSE_KEY_HERE",
		container: "#scanner",
	});
	const result = await scanner.scan();
</script>
```

If no element matches the selector, the scan fails with the error kind `"container"`.

#### Skip the Rectify and Edit Screens

To skip the rectify and edit screens, set their phases to `false`. The thumbnail of the capture screen then finishes the scan. With [`maxPages: 1`](/api/interfaces/ScannerSettings.md#maxpages), the scan ends as soon as the user takes one page:

```javascript
const scanner = new DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE",
	maxPages: 1,
	phases: { rectify: false, edit: false },
});
```

To keep the edit screen, and skip only the rectify screen after each new page, captured or imported, set [`afterCapture: false`](/api/interfaces/RectifyModes.md#aftercapture). The user can still open the rectify screen from the edit screen:

```javascript
const scanner = new DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE",
	phases: { rectify: { modes: { afterCapture: false } } },
});
```

#### Give Each Screen Its Own Element

The rectify and edit screens can show in their own elements, in the `container` of [`phases.rectify`](/api/interfaces/RectifySettings.md#container) and [`phases.edit`](/api/interfaces/EditSettings.md#container). The capture screen shows in [`container`](/api/interfaces/ScannerSettings.md#container). Give each element a size:

```html
<div id="capture" style="height: 600px"></div>
<div id="rectify" style="height: 600px"></div>
<div id="edit" style="height: 600px"></div>

<script type="module">
	const scanner = new Dynamsoft.DocumentScanner({
		license: "YOUR_LICENSE_KEY_HERE",
		container: "#capture",
		phases: {
			rectify: { container: "#rectify" },
			edit: { container: "#edit" },
		},
	});
</script>
```

#### Scan an Image File

To scan an image from your own file input, pass the file to [`scan()`](/api/classes/DocumentScanner.md#scan). [Run a Scan](#run-a-scan) says what the document scanner then does:

```html
<input id="file" type="file" accept="image/*" />

<script type="module">
	const scanner = new Dynamsoft.DocumentScanner({ license: "YOUR_LICENSE_KEY_HERE" });
	document.getElementById("file").addEventListener("change", async (event) => {
		const [file] = event.target.files;
		if (!file) return;
		const result = await scanner.scan(file);
		// Use the result as in "Use the Result".
	});
</script>
```

With the rectify and edit phases off, as in [Skip the Rectify and Edit Screens](#skip-the-rectify-and-edit-screens), a file that the browser can read gets imported headlessly. The capture screen opens only if the scan cannot finish.

### Screen Customization

The examples below change how the screens look and work, and what their buttons do.

#### Configure Auto-Capture

With auto-capture on, the document scanner takes a photo once the document holds still and fills enough of the view. The user can turn auto-capture on and off on the capture screen. Three capture settings control it:

```javascript
const scanner = new DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE",
	phases: {
		capture: {
			autoCapture: true, // Whether auto-capture is on when a scan starts. On by default.
			minStableFrames: 2, // How many frames in a row the document must hold still. 2 by default.
			waitForFraming: true, // Whether to wait until the document is framed well. On by default.
		},
	},
});
```

With [`waitForFraming: false`](/api/interfaces/CaptureSettings.md#waitforframing), auto-capture takes any document that holds still. The shutter takes a photo however the document is framed.

#### Theme Colors and Text

[`theme`](/api/interfaces/ThemeTokens.md) sets the colors, and [`strings`](/api/interfaces/StringSettings.md) sets the text of each screen. Each setting changes only the values that you give, and the others keep their defaults:

```javascript
const scanner = new DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE",
	theme: {
		primary: "#1a73e8", // Links, main buttons, and the outline of a found document.
		background: "#202124", // The background of the screens.
	},
	strings: {
		capture: { shutter: "Take photo", moveCloser: "Closer, please" },
		edit: { done: "Save" },
	},
});
```

#### Buttons

A [`buttons`](/api/type-aliases/ButtonSettingsFor.md) setting can hide a button, or run your code before its default action. The capture and edit phases each have one. The rectify screen has one for each mode, in [`modes.afterCapture.buttons`](/api/interfaces/RectifyModeSettings.md#buttons) and [`modes.fromEdit.buttons`](/api/interfaces/RectifyModeSettings.md#buttons). The names of the buttons are in [`CaptureScreenButton`](/api/type-aliases/CaptureScreenButton.md), [`RectifyScreenButton`](/api/type-aliases/RectifyScreenButton.md), and [`EditScreenButton`](/api/type-aliases/EditScreenButton.md). The apply and cancel buttons of an edit mode are in [`phases.edit.modeButtons`](/api/interfaces/EditSettings.md#modebuttons).

The handler gets an event. To stop the default action, call [`preventDefault()`](/api/interfaces/ButtonEvent.md#preventdefault) on the event. This also works after an `await`, because the document scanner waits for the handler:

```javascript
const scanner = new DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE",
	phases: {
		capture: {
			buttons: { loadImage: { hidden: true } },
		},
		edit: {
			buttons: {
				done: {
					onClick: async (event) => {
						if (!confirm("Finish the scan?")) event.preventDefault();
					},
				},
			},
		},
	},
});
```

If you hide a button that leaves a screen, such as cancel, give the user another way to leave the screen. If you hide the `rectify` or `filter` button of the edit screen, the mode that the button opens also turns off.

#### Screen Layouts

Each screen has a header and a footer, in its `layout` setting: [`CaptureLayout`](/api/interfaces/CaptureLayout.md), [`RectifyLayout`](/api/interfaces/RectifyLayout.md), or [`EditLayout`](/api/interfaces/EditLayout.md). You can fill each one with your own markup in a `<template>`, or leave it out with `false`. A button with a `data-mds-button` attribute works as the built-in button of that name. An element with a `data-mds-icon` attribute gets that icon. Labels, and tooltips where a button has one, come from [`strings`](/api/interfaces/StringSettings.md), so a button must not have an `aria-label`, `aria-labelledby`, or `title` of its own. The document scanner copies the markup but not its listeners. To handle a button of your own, listen on [`container`](/api/interfaces/ScannerSettings.md#container).

In this example, the header of the capture screen holds only a cancel button:

```html
<template id="capture-header">
	<button type="button" data-mds-button="cancel">
		<span class="mds-icon" data-mds-icon="cancel"></span>
	</button>
</template>

<script type="module">
	const scanner = new Dynamsoft.DocumentScanner({
		license: "YOUR_LICENSE_KEY_HERE",
		phases: {
			capture: { layout: { header: document.getElementById("capture-header") } },
		},
	});
</script>
```

The package contains the built-in templates of each screen, to copy and change: `dist/defaults/capture-layout.xml`, `dist/defaults/rectify-layout.xml`, and `dist/defaults/edit-layout.xml`. On the CDN, they are at addresses such as `https://cdn.jsdelivr.net/npm/@dynamsoft/document-scanner@2.0.0/dist/defaults/capture-layout.xml`.

#### Filters

The filter mode of the edit screen applies a filter to the current page. [`available`](/api/interfaces/FilterModeSettings.md#available) sets the filters that it offers, in order:

```javascript
const scanner = new DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE",
	phases: {
		edit: {
			modes: { filter: { available: ["none", "blackAndWhite", "gray"] } },
		},
	},
});
```

The [filters](/api/type-aliases/FilterName.md) are `none`, `blackAndWhite`, `gray`, `removeShadow`, `saveInk`, and `enhance`. To remove the filter mode, set [`modes: { filter: false }`](/api/interfaces/EditModes.md#filter), or give an empty [`available`](/api/interfaces/FilterModeSettings.md#available) list.

## Next Step

**MDS** is a fully functional, ready-to-use scanning SDK with built-in UI layouts. For **multi-document processing**, as well as advanced editing features, we developed **Mobile Web Capture (MWC)**. Read on to learn how to use this sample project in the [**Mobile Web Capture User Guide**](https://www.dynamsoft.com/mobile-document-scanner/docs/web/code-gallery/mobile-web-capture/index.html).

# Introduction

A hardware scanner is often the first choice to digitize a paper document. Without one on hand, the camera of a phone or a laptop can do the job. The **Mobile Document Scanner JavaScript Edition (MDS)** lets a web page scan documents with that camera.

> [!TIP]
> To use **hardware scanners** in a web application, see **Dynamsoft's** [**Dynamic Web TWAIN**](https://www.dynamsoft.com/web-twain/docs/introduction/index.html).

## Common Usage Scenarios

1. **A multi-page document** – Scan a contract or a report page by page, check and edit the pages, and get one PDF — all included within MDS.
2. **Multiple documents** – Handle several documents, PDF files, annotations, and more with the Mobile Web Capture sample project. See the [**online demo**](https://demo.dynamsoft.com/mobile-web-capture/), or read the [**developer guide**](https://www.dynamsoft.com/mobile-document-scanner/docs/web/code-gallery/mobile-web-capture/index.html).

## Design Principles

MDS follows three principles:

1. **Minimal code** – A few lines start a complete scan, and fewer lines cost less to build and maintain.
2. **Ready-to-use UI** – The screens come designed and built, so a page needs no UI work to start.
3. **Customization through settings** – [Settings](/api/interfaces/ScannerSettings.md) change the workflow, the colors, the text, the buttons, and the layout of each screen.

This example runs a complete scan, with every screen:

```javascript
const scanner = new Dynamsoft.DocumentScanner({
	license: "YOUR_LICENSE_KEY_HERE",
	output: { format: "pdf" },
});
const result = await scanner.scan();
```

The [result](/api/type-aliases/ScanResult.md) holds the pages as images. If you set [`output`](/api/type-aliases/OutputSettings.md), it also holds the document as one PDF, one TIFF, or one image per page. The user can also import images that are already on the device.

## Screens

A scan runs through three screens, each ready to use, and each customizable through its settings:

1. **The capture screen** shows the camera view, finds the document, and takes a photo of it, by itself or when the user presses the shutter.
2. **The rectify screen** shows each new page, so that the user can check and adjust its corners.
3. **The edit screen** shows every page. The user can reorder, rotate, filter, and delete pages, and undo each change.

[Run a Scan](/guide/index.md#run-a-scan) describes each screen, and [Screen Customization](/guide/index.md#screen-customization) describes its settings.

## System Requirements

### Secure Context (HTTPS Deployment)

Serve your web application over **HTTPS** in production. Browsers give access to the camera only on a secure page, and a Dynamsoft license works only on one. See [Serve over HTTPS](/guide/index.md#serve-over-https).

### Supported Browsers

MDS requires these browser features:

1. [`WebAssembly`](https://caniuse.com/wasm)
2. [Web Workers](https://caniuse.com/webworkers)
3. [`Blob`](https://caniuse.com/blobbuilder) and [`URL.createObjectURL()`](https://caniuse.com/bloburls)
4. [`color-mix()`](https://caniuse.com/mdn-css_types_color_color-mix) in CSS, for the colors of the screens
5. The [`cancel` event](https://caniuse.com/mdn-api_htmlinputelement_cancel_event) of a file input, for importing an image

The table below lists the **minimum versions** of browsers that have these features:

| Browser | Version |
| :-----: | :-----: |
| Chrome  |  v113+  |
| Edge    |  v113+  |
| Firefox |  v113+  |
| Safari  | v16.4+  |

## Next Step

Read the [Mobile Document Scanner user guide](/guide/index.md) to build your own document scanning web page. If your page uses MDS 1.x, read [Migrate from 1.x](/guide/migration.md) first.

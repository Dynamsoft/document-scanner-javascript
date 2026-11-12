# Migrate from 1.x

MDS 2.0 completely breaks the API from v1.x. It replaces the three views of 1.x with three screens (capture, rectify, and edit), the configuration with one set of [settings](/api/interfaces/ScannerSettings.md), and `launch()` with [`scan()`](/api/classes/DocumentScanner.md#scan). Below are various comparisons and migrations guides.

## The Package

| 1.x | 2.0 |
|---|---|
| The package `dynamsoft-document-scanner` | The package [`@dynamsoft/document-scanner`](https://www.npmjs.com/package/@dynamsoft/document-scanner) |
| `dist/dds.bundle.js`, for a `<script>` tag | `dist/document-scanner.iife.js`, which includes both engines. The class is still `Dynamsoft.DocumentScanner`. |
| `dist/dds.bundle.esm.js` | `dist/document-scanner.mjs`, the main entry point of the package |
| `require()` of the package, through its CommonJS export | None. 2.0 is an ES module only. Use `import`, or the script build. |
| `document-scanner.ui.xml`, fetched when the scan starts | Built into the package. To change the capture screen, copy the `<template>` of an area from `dist/defaults/capture-layout.xml` into your page, and pass it as [`phases.capture.layout`](/api/interfaces/CaptureLayout.md)`.header` or `.footer`. The rectify and edit screens have layouts too, which 1.x did not have. |

## The Dependencies

| Package | 1.x | 2.0 |
|---|---|---|
| [`dynamsoft-capture-vision-bundle`](https://www.npmjs.com/package/dynamsoft-capture-vision-bundle) | `~3.2.5000` | `~3.6.5000`, a peer dependency |
| [`dynamsoft-document-viewer`](https://www.npmjs.com/package/dynamsoft-document-viewer) | None | `~5.0.0`, a peer dependency |
| `dynamsoft-capture-vision-data` | `1.1.0` | None |
| `image-filter-js` | `^1.0.1` | None |

## The Methods

| 1.x | 2.0 |
|---|---|
| `initialize()` | [`preload()`](/api/classes/DocumentScanner.md#preload). It is optional, because `scan()` loads the engines too, and it resolves with nothing. |
| `launch()` | [`scan()`](/api/classes/DocumentScanner.md#scan). It resolves when the session ends. |
| `launch(file)` | [`scan(file)`](/api/classes/DocumentScanner.md#scan) |
| `stopContinuousScanning()` | [`finish()`](/api/classes/DocumentScanner.md#finish), which ends the session and keeps the pages. 1.x stopped only after the current page. |
| `dispose()` | [`dispose()`](/api/classes/DocumentScanner.md#dispose). 1.x released everything after each `launch()`. 2.0 keeps the engines loaded between scans, and `dispose()` is final: to scan again, construct a new document scanner. |
| None | New: [`cancel()`](/api/classes/DocumentScanner.md#cancel), [`reset()`](/api/classes/DocumentScanner.md#reset), [`on()`](/api/classes/DocumentScanner.md#on), [`getSettings()`](/api/classes/DocumentScanner.md#getsettings), and [`getDdvViewer()`](/api/classes/DocumentScanner.md#getddvviewer) |

## The Result

`launch()` resolved with one page. [`scan()`](/api/classes/DocumentScanner.md#scan) resolves with a [`ScanResult`](/api/type-aliases/ScanResult.md), which holds every page:

| 1.x | 2.0 |
|---|---|
| `result.status.code`, with `EnumResultStatus.RS_SUCCESS`, `RS_CANCELLED`, or `RS_FAILED` | `result.status`, with `"success"`, `"cancelled"`, or `"failed"` |
| `result.status.message` | `result.error.message`, with [`result.error.kind`](/api/type-aliases/ScannerError.md) for the cause |
| `result.correctedImageResult` | [`processed`](/api/interfaces/ScannedPage.md#processed) of each page in [`result.pages`](/api/interfaces/SuccessfulScan.md#pages) |
| `result.originalImageResult` | [`original`](/api/interfaces/ScannedPage.md#original) of each page |
| `result.detectedQuadrilateral` | [`boundary`](/api/interfaces/ScannedPage.md#boundary) of each page |
| None | [`result.output`](/api/interfaces/SuccessfulScan.md#output), the PDF, TIFF, or images that [`output`](/api/type-aliases/OutputSettings.md) asks for |

The images of a page work differently. In 1.x, `correctedImageResult.toCanvas()` was synchronous, and in 2.0, [`toCanvas()`](/api/interfaces/PageImageBase.md#tocanvas) and [`toBlob()`](/api/interfaces/PageImageBase.md#toblob) return promises. `processed` stops working after `cancel()`, `reset()`, or `dispose()`, so read it before then.

## The Settings

| 1.x | 2.0 |
|---|---|
| `scannerViewConfig` | [`phases.capture`](/api/interfaces/CaptureSettings.md) |
| `correctionViewConfig` | [`phases.rectify`](/api/interfaces/RectifySettings.md) |
| `resultViewConfig` | [`phases.edit`](/api/interfaces/EditSettings.md) |
| `container` and `scannerViewConfig.container` | [`container`](/api/interfaces/ScannerSettings.md#container). The capture screen has no container of its own. |
| `correctionViewConfig.container` | [`phases.rectify.container`](/api/interfaces/RectifySettings.md#container) |
| `resultViewConfig.container` | [`phases.edit.container`](/api/interfaces/EditSettings.md#container) |
| `themeColor` | [`theme`](/api/interfaces/ThemeTokens.md) |
| `stringConfig` | [`strings`](/api/interfaces/StringSettings.md) |
| `showCorrectionView: false` | [`phases.rectify: false`](/api/interfaces/PhaseSettings.md#rectify). To skip the rectify screen only after a capture, and keep it from the edit screen, set [`phases.rectify.modes.afterCapture: false`](/api/interfaces/RectifyModes.md#aftercapture). 1.x had no such setting. |
| `showResultView: false` | [`phases.edit: false`](/api/interfaces/PhaseSettings.md#edit) |
| `enableSmartCaptureMode` and `enableAutoCropMode` | [`phases.capture.autoCapture`](/api/interfaces/CaptureSettings.md#autocapture). The auto-crop mode of 1.x also skipped the correction view for its own captures. The nearest match adds `phases.rectify.modes.afterCapture: false`, which skips the rectify screen for every new page, from the shutter and from imports too. |
| `enableBoundsDetectionMode` | None. 2.0 always outlines the document. |
| `minVerifiedFramesForAutoCapture` | [`phases.capture.minStableFrames`](/api/interfaces/CaptureSettings.md#minstableframes) |
| `showSubfooter: false` | [`phases.capture.buttons.autoCapture.hidden`](/api/interfaces/ButtonSettings.md#hidden), which hides the one auto-capture toggle |
| `enableContinuousScanning` | [`maxPages`](/api/interfaces/ScannerSettings.md#maxpages). `false` becomes `1`, and `true` becomes `"unlimited"`. |
| `engineResourcePaths` | [`resources.captureVision`](/api/interfaces/ResourceSettings.md#capturevision), with the same shape. Document Viewer's files have their own setting, [`resources.documentViewer`](/api/interfaces/ResourceSettings.md#documentviewer). |
| `cameraEnhancerUIPath` | [`phases.capture.layout`](/api/interfaces/CaptureLayout.md), one template for each area |
| `onDocumentScanned` | [`on("documentChange")`](/api/interfaces/ScannerEvents.md#documentchange), with the change type `"pagesAdded"`. 1.x waited for the callback before the next scan, but 2.0 does not wait for the listener. `"pagesAdded"` also fires when undo or redo brings pages back. |
| `onThumbnailClicked` | [`phases.capture.buttons.thumbnail.onClick`](/api/interfaces/ButtonSettings.md#onclick). Its event carries no page, and the thumbnail then opens the edit screen, or finishes the scan. To keep the 1.x behavior, call `event.preventDefault()`. |
| `resultViewConfig.onDone` | [`on("done")`](/api/interfaces/ScannerEvents.md#done). The document scanner waits for the listener before `scan()` resolves. |
| `resultViewConfig.onUpload` | [`on("done")`](/api/interfaces/ScannerEvents.md#done), with your own upload. |
| `correctionViewConfig.onFinish` | [`on("documentChange")`](/api/interfaces/ScannerEvents.md#documentchange). After a capture, the page arrives as `"pagesAdded"`. From the edit screen, a new boundary arrives as `"pageEdited"`. To act on the press itself, use `phases.rectify.modes.afterCapture.buttons.apply.onClick`. |
| `toolbarButtonsConfig`, a button's `label` | [`strings`](/api/interfaces/StringSettings.md), by screen and button |
| `toolbarButtonsConfig`, a button's `isHidden` | [`hidden`](/api/interfaces/ButtonSettings.md#hidden) in the `buttons` of each screen. 2.0 also adds [`onClick`](/api/interfaces/ButtonSettings.md#onclick), which runs before the default action. To replace that action, call `event.preventDefault()`. See [Buttons](/guide/index.md#buttons). |
| `toolbarButtonsConfig`, a button's `icon` and `className` | Your own `<img>`, `<svg>`, and classes inside the button of a [screen layout](/guide/index.md#screen-layouts). A `data-mds-icon` attribute places only a built-in icon. |
| `templateFilePath`, `utilizedTemplateNames`, `enableFrameVerification`, `scanRegion`, and `showPoweredByDynamsoft` | None. 2.0 has no such settings. |

## The Buttons

| 1.x | 2.0 |
|---|---|
| Correction view: `retake`, `fullImage`, `detectBorders`, `apply` | Rectify screen: `retake`, `fullImage`, `detectBoundary`, `apply`, and also `cancel` and `undo` ([`RectifyScreenButton`](/api/type-aliases/RectifyScreenButton.md)) |
| Result view: `correct` | Edit screen: `rectify` ([`EditScreenButton`](/api/type-aliases/EditScreenButton.md)) |
| Result view: `retake` | Edit screen: `addPage`, which opens the capture screen for more pages |
| Result view: `rotate`, `filter`, `done` | Edit screen: `rotate`, `filter`, `done` |
| Result view: `share` and `upload` | None. Ask for a file with [`output`](/api/type-aliases/OutputSettings.md), and share or upload it in your [`on("done")`](/api/interfaces/ScannerEvents.md#done) listener. |

## Behavior That Changed

- **Unknown settings throw.** The constructor throws a `TypeError` that names any unknown key or wrong value. Thus a 1.x settings object passed unchanged fails at once, which shows each setting to move.
- **Auto-capture is on by default.** In 1.x, smart capture and auto-crop were off by default. For the 1.x behavior, set [`phases.capture.autoCapture: false`](/api/interfaces/CaptureSettings.md#autocapture).
- **Continuous scanning is the default.** 1.x scanned one page unless `enableContinuousScanning` was `true`. 2.0 scans until the user finishes. For one page, set [`maxPages: 1`](/api/interfaces/ScannerSettings.md#maxpages), and call `reset()` before each scan.
- **Pages stay between scans.** 1.x started each `launch()` empty. In 2.0, the pages of a successful or failed scan stay for the next [`scan()`](/api/classes/DocumentScanner.md#scan), and count toward `maxPages`. To start each scan empty, call [`reset()`](/api/classes/DocumentScanner.md#reset) before it.
- **The capture screen's markup is no longer fetched.** It comes with the package, so `cameraEnhancerUIPath` has no place to point.

As in 1.x, `scan()` resolves with `status: "failed"` and the [error](/api/type-aliases/ScannerError.md) when the scan fails. It rejects only when it cannot start a session, or when the file you pass is not a `Blob`.

# Changelog

All notable changes to the Mobile Document Scanner JavaScript Edition are
documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.5.0] - 2026-06-26

### Added

- Image filtering and rotation in the result view.
- String and theme color customization across the entire UI (`stringConfig`,
  `themeColor`).

### Changed

- Update the online demo to support multi-page scanning with DDV integration.

### Fixed

- Scanner view UI bugs.
- Inconsistent workflow on retake.

### Dependencies

- [Dynamsoft Capture Vision JS 3.2.5000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb-3.html#325000-12162025)
- [Dynamsoft Capture Vision Data 1.1.0](https://www.npmjs.com/package/dynamsoft-capture-vision-data)
  (runtime only)

## [1.4.2] - 2026-01-23

### Security

- Update Dynamsoft Capture Vision JS to 3.2.5000 to resolve a vulnerability
  from one of its dependencies.

### Changed

- Update Angular sample node dependencies.
- Synchronize minor documentation updates to the README.

### Dependencies

- [Dynamsoft Capture Vision JS 3.2.5000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb-3.html#325000-12162025)

## [1.4.0] - 2025-11-24

### Changed

- **Breaking:** rename `document-scanner.ui.html` to `document-scanner.ui.xml`
  to better reflect its purpose as a declarative UI configuration template.
  This affects self-hosting users only — update the path in the
  `scannerViewConfig.cameraEnhancerUIPath` property accordingly and rebuild
  the library.

### Added

- Frame verification: select the clearest of multiple video frames on scan
  with `enableFrameVerification` (default `true`).
- Continuous scanning mode to make multiple scans on a single `launch()`,
  enabled by `enableContinuousScanning` (default `false`):
  - `onDocumentScanned` handler to get single scan results in continuous
    scanning mode.
  - A thumbnail scan preview in the scanner view with an optional
    `onThumbnailClicked` click handler.
  - `stopContinuousScanning` to programmatically stop the scanning loop.
- `enableBoundsDetectionMode` to set the default bounds detection mode.
- Sample demonstrating minimal code to integrate MDS with Dynamsoft Document
  Viewer (DDV) to scan to PDF with continuous scanning.
- Minimal MDS-only continuous scanning sample.
- Guides on using continuous scan mode and integrating with DDV.
- Full [TSDoc](https://tsdoc.org/) annotation coverage for all MDS APIs to
  bring API references to IDEs and allow content extraction with compatible
  development tools.

### Removed

- The animated shutter spinner.

### Fixed

- "Torch not supported" message appearing unnecessarily.
- Memory leak caused by logging results to the console.

### Security

- Update framework sample dependencies to resolve security vulnerabilities.

### Dependencies

- [Dynamsoft Capture Vision JS 3.2.4000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb-3.html#324000-11112025)

## [1.3.1] - 2025-09-04

### Changed

- Upgrade [Dynamsoft Capture Vision JS](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/index.html)
  from 2.6.1000 to 3.0.6001. This upgrade improves document detection
  effectiveness, especially for white documents on white backgrounds, and
  simplifies the build and bundling approach.
- Improve TypeScript configuration and module resolution.
- Set `boundsDetectionEnabled` to `true` to make the code clearer, since its
  value was already overridden to `true` when instantiating the MDS object.

### Added

- Ready-made samples for Angular, React, and Vue, with developer guides for
  the framework samples.
- [TSDoc](https://tsdoc.org/) annotations to bring API references to IDEs
  and allow content extraction with compatible development tools.

### Fixed

- Change the type of `DocumentResult.correctedImageResult` from
  `DeskewedImageResultItem | DSImageData` to `DeskewedImageResultItem` to fix
  a TypeScript error when calling methods like `toCanvas()`.
- Create the `dds.esm.d.ts` declaration file to fix ESM import/export issues.

### Dependencies

- [Dynamsoft Capture Vision JS 3.0.6001](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb-3.html#30600108282025)

## [1.2.0] - 2025-04-30

### Added

- Scanner view configuration options:
  - `enableAutoCropMode` (default `false`).
  - `enableSmartCaptureMode` (default `false`).
  - `showSubfooter` (default `true`): toggle the sub-footer container that
    lets users switch scan modes (Detect border, Smart capture, Auto crop).
  - `showPoweredByDynamsoft` (default `true`): toggle the "Powered by
    Dynamsoft" message on the scanner view.
  - `minVerifiedFramesForAutoCapture` (default `2`): the minimum verified
    frames to auto-capture the document — lower it to make the capture
    faster, at a possible cost in accuracy or image quality.
  - `scanRegion`: confine scanning to a region of the viewfinder (region
    ratio, bottom margin, and border style).
- "Re-take" button in the correction view to retake/rescan the document.
- Landscape support for the scanner view (implemented in
  `document-scanner.ui.html`).
- `launch()` accepts a static image; a sample is provided under
  `sample/scenarios/use-file-input.html`.

### Changed

- Template optimization: update `scaleDownThreshold` to `1000`.
- Set the default camera resolution to 2K.
- Update the trial license banner link to lead to
  `https://www.dynamsoft.com/customer/license/trialLicense?product=mwc&deploymenttype=web`.

### Fixed

- Enable `OutputOriginalImage` on the template by default; previously it had
  to be enabled manually when using a custom template.
- Set `engineResourcePaths` before license initialization to prevent a bug
  when implementing a custom engine resource path.

### Dependencies

- [Dynamsoft Capture Vision JS 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

## [1.1.1] - 2025-02-07

### Fixed

- Icon not showing up on Firefox mobile.

### Dependencies

- [Dynamsoft Capture Vision JS 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

## [1.1.0] - 2025-02-07

### Added

- View control configuration options: `showCorrectionView` and
  `showResultView` toggle each view's visibility and workflow. When the
  correction view is hidden, the "Smart Capture" button is hidden on the
  scanner view; when the result view is hidden, "Apply" changes to "Done" in
  the correction view.
- Resource configuration options: `engineResourcePaths` to configure DCV
  engine resources and `templateFilePath` to set the template file location.
- `EnumDDSViews` enum (Scanner/Result/Correction).

### Fixed

- Button state issues with hidden views.
- `container` type flexibility in `DocumentScannerViewConfig`.

### Dependencies

- [Dynamsoft Capture Vision JS 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

## [1.0.3] - 2025-02-07

### Fixed

- Missing devDependency in `package.json`.

### Dependencies

- [Dynamsoft Capture Vision JS 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

## [1.0.2] - 2025-02-05

### Changed

- **Breaking:** rename `ScanResultView` to `DocumentResultView`.
- **Breaking:** rename `DocumentScanResult` to `DocumentResult`.
- **Breaking:** rename `scanResultViewConfig` to `resultViewConfig`.
- **Breaking:** rename `ControlButton` to `ToolbarConfig`.
- **Breaking:** change the `text` property for toolbar buttons to `label`.
- Update the "Share PNG" icon to match other products.
- Change the built-in server configuration to allow showcasing the "Upload"
  feature, and print URLs to specific pages when running `npm run serve`.

### Added

- Support for `<img>` tags on toolbar icons.
- An upload button, shown when an `onUpload` function is specified.
- A rotate message on `/demo.html` to handle landscape mode.

### Fixed

- Detected border positioned incorrectly when importing an image larger than
  the canvas dimensions (scale-down not working properly).
- Camera and resolution outline logic breaking when transitioning from the
  demo camera to the live camera.

### Dependencies

- [Dynamsoft Capture Vision JS 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

## [1.0.0] - 2025-01-27

Initial release.

### Dependencies

- [Dynamsoft Capture Vision JS 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

[1.5.0]: https://github.com/Dynamsoft/document-scanner-javascript/compare/v1.4.2...v1.5.0
[1.4.2]: https://github.com/Dynamsoft/document-scanner-javascript/compare/v1.4.0...v1.4.2
[1.4.0]: https://github.com/Dynamsoft/document-scanner-javascript/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/Dynamsoft/document-scanner-javascript/compare/v1.2.0...v1.3.1
[1.2.0]: https://github.com/Dynamsoft/document-scanner-javascript/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/Dynamsoft/document-scanner-javascript/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Dynamsoft/document-scanner-javascript/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/Dynamsoft/document-scanner-javascript/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Dynamsoft/document-scanner-javascript/compare/v1.0.0...v1.0.2
[1.0.0]: https://github.com/Dynamsoft/document-scanner-javascript/releases/tag/v1.0.0

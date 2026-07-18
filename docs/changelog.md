<!--
	Ported for the versioned docs build from the Jekyll docs repo at
	ebef2d269a114ac7763a6c0635d098a09cdcbf59 (the last v1.4.2 revision):
	frontmatter dropped, liquid site links made site-relative.
-->

# Mobile Document Scanner JavaScript Edition Release Notes

## 1.4.2 (23/01/2026)

### Breaking Changes

None

### Fixes

1. Update DCV JS to v3.2.5000 to resolve a vulnerability from its dependency.
2. Update Angular sample node dependencies.

### Documentation

1. Synchronize minor documentation updates to the README.

### Dependencies

- [Dynamsoft Capture Vision JS 3.2.5000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb-3.html#325000-12162025)

## 1.4.0 (24/11/2025)

### Features

#### Breaking Changes

- Rename `document-scanner.ui.html` to `document-scanner.ui.xml` to better reflect its purpose as a declarative UI configuration template.
  - This affects self hosting users only - you must update the path in the `scannerViewConfig.cameraEnhancerUIPath` property accordingly and rebuild the library.

#### Scanning Capabilities

- Select the clearest of multiple video frames on scan with `enableFrameVerification` (default `true`).
- Add continuous scanning mode to make multiple scans on a single `launch()`, enabled by `enableContinuousScanning` (default `false`).
  - Add `onDocumentScanned` handler to get single scan results in continuous scanning mode.
  - Add a thumbnail scan preview in the scanner view for continuous scanning mode with an optional `onThumbnailClicked` click handler.
  - Add `stopContinuousScanning` to programmatically stop the scanning loop.
- Add `enableBoundsDetectionMode` to set default bounds detection mode
  
#### UI/UX Improvements

- Remove the animated shutter spinner.

#### Samples

- Add sample demonstrating minimal code to integrate MDS with Dynamsoft Document Scanner (DDV) to scan to PDF with continuous scanning.
- Add minimal MDS-only continuous scanning sample.

### Fixes

- Fix "Torch not supported" message appearing unecessarily.
- Update framework sample dependencies to resolve security vulnerabilities.
- Remove memory leak caused by logging results to console.

### Documentation

- Add guides to using continuous scan mode and integrating with DDV.
- Add full [`tsdoc`](https://tsdoc.org/) annotation coverage for all MDS APIs to bring API references to IDEs and allow content extraction with compatible development tools.

### Dependencies

- [Dynamsoft Capture Vision JS 3.2.4000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb-3.html#324000-11112025)

## 1.3.1 (04/09/2025)

#### Features

- Upgrade to version 3.0.6001 of [Dynamsoft Capture Vision JS](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/index.html) (from version 2.6.1000).
  - This upgrade improves document detection effectiveness, especially for white documents on white backgrounds.
  - Simplify build and bundling approach.
- Improve TypeScript configuration and module resolution.
- Add ready-made samples for Angular, React, and Vue.

#### Fixes

- Set `boundsDetectionEnabled` to `true` to make code clearer, since its value already overridden to `true` when instantiating the MDS object.
- Change the type of `DocumentResult.correctedImageResult` from `DeskewedImageResultItem | DSImageData` to `DeskewedImageResultItem` to fix a TypeScript error when calling methods like `toCanvas()`.
- Create the `dds.esm.d.ts` declaration file to fix ESM import/export issues.

#### Dependencies

- [Dynamsoft Capture Vision JS 3.0.6001](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb-3.html#30600108282025)

### Documentation

- Add [`tsdoc`](https://tsdoc.org/) annotations to bring API references to IDEs and allow content extraction with compatible development tools.
- Add developer guides for JavaScript Framework samples.

## 1.2.0 (30/04/2025)

### Features

- `DocumentScanner` configuration options
  - `ScannerViewConfig`
    -   `enableAutoCropMode?: boolean; // False by default`
    -  `enableSmartCaptureMode?: boolean; // False by default`
    - `showSubfooter`: Toggle showing the sub-footer container that allows users to toggle scan modes (Detect border, Smart capture, Auto crop). `true` by default
    - `showPoweredByDynamsoft`: Toggle showing `Powered by Dynamsoft` message on the scanner view. `true` by default
    - `minVerifiedFramesForAutoCapture`: Change the minimum verified frames to auto capture the document. `2` frames are needed by default. Lower this number to make the capture faster (this could have an effect on accuracy/quality of image scanned).
    - `scanRegion`: allows users to set a scan region while scanning a document

```typescript
export interface ScanRegion {
  ratio: {
    width: number;
    height: number;
  }; // Ratio of the scan region
  regionBottomMargin: number; // Bottom margin calculated in pixel. This will "push" the scan region upwards
  style: {
    strokeWidth: number; // width of the scan region border
    strokeColor: string; // color of the scan region border
  };
}
```
  - Added `Re-take` button in Correction View. this will allow users to retake/rescan the document through the correction view.
  - Provide landscape support for the Document Scanner View (implemented in`document-scanner.ui.html`)
  - Template optimization: Updated `scaleDownThreshold` to `1000`
  - Allow `launch()` with a static image. A sample is provided under `sample/scenarios/use-file-input.html`
  - Set the default resolution when opening camera to `2K` resolution

### Fixes

- Enable `OutputOriginalImage` on the template by default. Before, it required us to enable it manually if we use a custom template.
- Set `engineResourcePaths` before `initLicense` to prevent a bug when a user implements a custom engineResourcePath.
- Update trial license banner link to lead to `https://www.dynamsoft.com/customer/license/trialLicense?product=mwc&deploymenttype=web`

### Dependencies

- [Dynamsoft Capture Vision JavaScript 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11


## 1.1.1 (07/02/2025)

### Fixes

- Fixed icon not showing up on Firefox mobile

### Dependencies

- [Dynamsoft Capture Vision JavaScript 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

## 1.1.0 (07/02/2025)

### Features

- `DocumentScanner` configuration options
  - View Control
    - `showCorrectionView`: Toggle correction view visibility and workflow
    - `showResultView`: Togle result view visibility and workflow
    - UI Changes
      - Hidden `DocumentCorrectionView` -> `Smart Capture` button hidden on `DocumentScannerView`
      - Hidden `DocumentResultView` -> `Apply` changes to `Done` in `DocumentCorrectionView`
  - Resource Configuration
    - `engineResourcePaths`: to configure DCV engine resources
    - `templateFilePath`: set template file location
- Added `EnumDDSViews` enum (Scanner/Result/Correction)

### Fixes

- Fixed button state issues with hidden views
- Fixed `container` type flexibility in `DocumentScannerViewConfig`

### Dependencies

- [Dynamsoft Capture Vision JavaScript 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

## 1.0.3 (07/02/2025)

### Fixes

- Fixed missing devDependency in `package.json`.

### Dependencies

- [Dynamsoft Capture Vision JavaScript 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

## 1.0.2 (05/02/2025)

### BREAKING CHANGES

- Renamed `ScanResultView` to `DocumentResultView`.
- Renamed `DocumentScanResult` to `DocumentResult`.
- Renamed `scanResultViewConfig` to `resultViewConfig`.
- Renamed `ControlButton` to `ToolbarConfig`.
- Changed `text` property for toolbar buttons to `label`.

### New Features

- Added support for `<img>` tags on toolbar icons.
- Updated the **Share PNG** icon to match other products.
- Added an **upload button** when users specify the `onUpload` function.

### Fixes

- Fixed an issue where importing an image larger than the canvas dimensions caused the detected border to be positioned incorrectly. This was due to **scaleDown** not working properly.

### Samples

#### Features

- Added a **rotate message** on `/demo.html` to handle landscape mode.

#### Fixes

- Fixed an issue where the **camera and resolution outline logic** would break when transitioning from the **Demo Camera** to the **Live Camera**.

### Built-in Server

- Changed the configuration to allow showcasing the **"Upload"** feature.
- Added URLs to specific pages when running `npm run serve`.

### Dependencies

- [Dynamsoft Capture Vision JavaScript 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

## 1.0.0 (27/01/2025)

Initial release

### Dependencies

- [Dynamsoft Capture Vision JavaScript 2.6.1000](https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/release-notes/dcvb.html#261000-01032025)
  - Dynamsoft Camera Enhancer 4.1.1
  - Dynamsoft Document Normalizer 2.6.11

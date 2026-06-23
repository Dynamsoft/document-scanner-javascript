# Mobile Document Scanner — Online Demo

A self-contained plain TypeScript + HTML + CSS sample of the [Dynamsoft Mobile Document Scanner SDK](https://www.dynamsoft.com/mobile-document-scanner/docs/web/introduction/index.html), deployed at <https://demo.dynamsoft.com/document-scanner/>. The demo has three phases — a landing screen, a multi-page scan loop, and a PDF result view. This is intended as the public demo for the SDK, a ready-to-fork template for integrators who want a similar end-to-end flow, and an end-to-end development guide for combining Mobile Document Scanner (MDS) with Document Viewer (DDV).

## Overview

1. **Landing**: a "Continue" button on mobile, or a QR code + "Continue on Desktop" on wide viewports so phone users get nudged to the better camera path.
2. **Scan loop**: the Document Scanner captures pages continuously (auto border detection + perspective correction); each corrected page lands in a shared DDV document. Exiting the camera drops into a DDV edit viewer where pages can be reviewed, rotated, cropped, reordered, or deleted — its toolbar relaunches the camera or finishes the session.
3. **Result**: the pages are exported to a single PDF, shown in a scrollable read-only inset, with Re-scan (discard and start over), Download, and Return-home actions.

## File layout

```
samples/demo/
├── index.html               # markup for all three phases
├── css/
│   ├── index.css            # shared stylesheet — palette in :root tokens, scanner stage
│   ├── landing.css          # landing page, one for mobile and desktop
│   ├── result.css           # result view — header, PDF inset, action footer
# third-party:begin widgets-css
│   └── widgets.css          # live-chat and cookies disclaimer
# third-party:end widgets-css
├── tsconfig.json            # IDE/LSP project config (Vite handles build)
├── vite.config.ts           # demo-build config: bundles src/ + mirrors SDK resources into public/
├── assets/                  # static assets (logo, QR code)
└── src/                     # TypeScript source
    ├── dom.ts               # $<T>(id) helper, isMobile
    ├── view.ts              # body[data-view] state, scanner-overlay sub-state, info menu
    ├── license.ts           # shared trial license key
    ├── ddv.ts               # DDV engine init, shared document, edit-viewer hub
    ├── scanner.ts           # DocumentScanner instance + flow orchestration
    ├── results.ts           # page-image inset, PDF export, download
# third-party:begin chrome-ts
    ├── chrome.ts            # live-chat bridge
# third-party:end chrome-ts
    └── index.ts             # entry — wires DOM events to the exports above
```

The build output lands in `samples/demo/dist/` (gitignored).

## Prerequisites — build the SDK first

The demo's `dynamsoft-document-scanner` dependency is the tarball packed from this repository, so the repo root must be built and packed **before** installing the demo's dependencies. From the repo root:

```shell
npm install
npm run pack:local      # builds dist/ and packs samples/dynamsoft-document-scanner-<version>.tgz
```

When the root package version changes, re-run `npm run pack:local` and update the tarball filename in `samples/demo/package.json`.

## Running locally

From the `samples/demo` directory:

```shell
npm install
npm run dev
```

Open the link in your browser as shown by Vite in the shell output (default `https://localhost:5173/`). Accept the self-signed cert.

This serves your source files directly, which has the benefit of live updates via Vite, so you can see your changes live without reloading (HMR). See below for running bundled files locally that you would deploy in production.

## Preview build

Once satisfied with the application, you can serve the production build files (from `/dist`) by running

```shell
npm run build
npm run preview
```

and opening the link to the Vite server (default `https://localhost:4173/`). Because `npm run build` is responsible for the build, `npm run preview` does not offer live reloads like `npm run dev`.

## Distributables

`vite build` reads `samples/demo/index.html`, bundles `src/*.ts` into `assets/index-<hash>.js` with all SDK imports resolved, and emits a self-contained `samples/demo/dist/` whose top level mirrors `public/`, which you can then deploy:

```
samples/demo/dist/
├── index.html
# third-party:begin web-config
├── web.config                            # IIS MIME map for .data files
# third-party:end web-config
├── assets/                               # bundled demo + SDK ESM + styles
│   ├── index-<hash>.js
│   └── index-<hash>.css
├── document-scanner.ui.xml               # camera UI template (scanner view)
├── dynamsoft-capture-vision-bundle/      # DCV engine (WASM, workers)
├── dynamsoft-capture-vision-data/        # DCV runtime data (preset templates, models)
└── dynamsoft-document-viewer/dist/engine # DDV engine (WASM, workers)
```

`vite.config.ts` sets `base: "./"` so all paths in `dist/index.html` are relative — the same output works under any deploy base URL.

## How the SDKs are loaded

The TypeScript imports both SDKs as ES modules:

```ts
import { DocumentScanner } from "dynamsoft-document-scanner";
import { DDV } from "dynamsoft-document-viewer";
```

Both engines are self-hosted: `vite.config.ts` mirrors `dynamsoft-capture-vision-bundle`, `dynamsoft-capture-vision-data` (the engine's preset templates and models), and DDV's `dist/engine` from `node_modules` into `public/`, and the demo points `engineResourcePaths` (scanner) and `DDV.Core.engineResourcePath` (viewer) at those mirrors — nothing is fetched from a CDN at runtime.

`dynamsoft-document-viewer` is pinned to an exact version: Dynamsoft packages ship breaking changes in minor releases, so upgrades should be deliberate and verified against the scan/review/export flow.

<!-- third-party:begin docs-section -->
## Third-party integrations

The deployed demo carries Google Tag Manager, the Comm100 live-chat widget, and an IIS `web.config`. All of it is fenced with `third-party:begin <name>` / `third-party:end <name>` markers, and the purely third-party files are `src/chrome.ts`, `css/widgets.css`, and `web.config`.

`mise run sanitize-public` strips these in place for review — it removes every fenced block and the whole third-party files (`src/chrome.ts`, `css/widgets.css`, `web.config`), along with lockfiles, `.npmrc`, the root `publishConfig`, and repo-specific `.github` data. To stage a public snapshot, `mise run export-public <branch>` merges this branch onto a downstream remote branch; run `sanitize-public` on the result, then commit and push.
<!-- third-party:end docs-section -->

## SDK API reference

- [User guide](https://www.dynamsoft.com/mobile-document-scanner/docs/web/guides/index.html)
- [`DocumentScanner` API](https://www.dynamsoft.com/mobile-document-scanner/docs/web/api-reference/index.html)
- [Dynamsoft Document Viewer docs](https://www.dynamsoft.com/document-viewer/docs/introduction/index.html)

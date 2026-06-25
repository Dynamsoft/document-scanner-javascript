# Mobile Document Scanner Samples

Here we present sample projects built with the Mobile Document Scanner, each a single HTML file to demonstrate a particular use case or feature of MDS.

These single-file samples are served by the repository's root vite dev server, which self-hosts the Dynamsoft Capture Vision engine and runtime data from `/public`. From the repository root, run:

```shell
npm install
npm run dev
```

Then open the URL printed in the console and pick a sample.

## Plain JavaScript Samples

1. [Hello World](./hello-world.html) - a minimal example to get started with scanning single page documents in under 2 minutes.
2. [Official Demo](./demo/index.html) - source code for the polished and integrated demo application on our website.
3. [Scanning to PDF](./scanning-to-pdf.html) - scan multi-page documents with MDS, and integrate with Dynamsoft Document Viewer (DDV) for viewing, editing, and PDF file output.
4. [Multi-Page Scanning](./multi-page-scanning.html) - scan multi-page documents with MDS and output as separate images on each successful scan for further fine-grain processing downstream.
5. [Image File Scanning](./image-file-scanning.html) - scan documents from file input instead of a camera feed for processing existing images.

## JavaScript Framework Samples

All three framework samples provide the same features as the plain JavaScript Hello World sample, each with its own vite (or Angular CLI) tooling. See [frameworks/README.md](./frameworks/README.md) for instructions.

1. [Angular](./frameworks/angular)
2. [React Hooks](./frameworks/react-hooks)
3. [Vue](./frameworks/vue)

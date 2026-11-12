# Development pages

Each page in this directory is one HTML file that uses the document scanner. The development server of the repository serves the pages against the source code, and serves the files of both engines from `node_modules` under `/engine/`. Thus nothing needs a build first.

From the root of the repository, run:

```shell
pnpm install
pnpm dev
```

Then open the address that the server prints, and choose a page.

- [Hello World](./hello-world.html) scans a document with the default settings.

The demo and the framework samples are in the [samples repository](https://github.com/Dynamsoft/document-scanner-javascript-samples).

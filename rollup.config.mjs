import fs from "fs";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json" assert { type: "json" };

const hasSourceMap = "production" !== process.env.BUILD;
const banner = `/*!
* mwc-2-module @version ${pkg.version} (${new Date().toISOString()})
*/`;

const external = [
  "dynamsoft-core",
  "dynamsoft-license",
  "dynamsoft-capture-vision-router",
  "dynamsoft-camera-enhancer",
  "dynamsoft-document-normalizer",
  "dynamsoft-document-viewer",
  "dynamsoft-utility",
];

const globals = {
  "dynamsoft-core": "Dynamsoft.Core",
  "dynamsoft-license": "Dynamsoft.License",
  "dynamsoft-capture-vision-router": "Dynamsoft.CVR",
  "dynamsoft-camera-enhancer": "Dynamsoft.DCE",
  "dynamsoft-document-normalizer": "Dynamsoft.DDN",
  "dynamsoft-document-viewer": "Dynamsoft",
  "dynamsoft-utility": "Dynamsoft.Utility",
};

const copyFiles = () => ({
  name: "copy-files",
  writeBundle() {
    fs.copyFileSync("src/mwc-2.ui.html", "dist/mwc-2.ui.html");
  },
});

export default async () => {
  fs.rmSync("dist", { recursive: true, force: true });

  return [
    {
      input: "src/index.ts",
      plugins: [nodeResolve(), typescript({ tsconfig: "./tsconfig.json", sourceMap: hasSourceMap }), copyFiles()],
      external: external,
      output: [
        {
          file: "dist/mwc-2.js",
          format: "umd",
          name: "MWC",
          exports: "named",
          banner,
          sourcemap: hasSourceMap,
          globals: globals,
          plugins: [terser({ ecma: 5 })],
        },
        {
          file: "dist/mwc-2.mjs",
          format: "es",
          exports: "named",
          banner,
          sourcemap: hasSourceMap,
          plugins: [
            terser({ ecma: 6 }),
            {
              writeBundle() {
                fs.cpSync("dist/mwc-2.mjs", "dist/mwc-2.esm.js");
              },
            },
          ],
        },
      ],
    },
    {
      input: "src/core/MobileWebCapture.ts",
      plugins: [nodeResolve(), typescript({ tsconfig: "./tsconfig.json", sourceMap: hasSourceMap }), copyFiles()],
      external: external,
      output: [
        {
          file: "dist/mobile-web-capture.js",
          format: "umd",
          name: "MobileWebCapture",
          exports: "default",
          banner,
          sourcemap: hasSourceMap,
          globals: globals,
          plugins: [terser({ ecma: 5 })],
        },
        {
          file: "dist/mobile-web-capture.mjs",
          format: "es",
          exports: "default",
          banner,
          sourcemap: hasSourceMap,
          plugins: [
            terser({ ecma: 6 }),
            {
              writeBundle() {
                fs.cpSync("dist/mobile-web-capture.mjs", "dist/mobile-web-capture.esm.js");
              },
            },
          ],
        },
      ],
    },
    {
      input: "src/core/MobileDocumentScanner.ts",
      plugins: [nodeResolve(), typescript({ tsconfig: "./tsconfig.json", sourceMap: hasSourceMap }), copyFiles()],
      external: external,
      output: [
        {
          file: "dist/mobile-document-capture.js",
          format: "umd",
          name: "MobileDocumentScanner",
          exports: "default",
          banner,
          sourcemap: hasSourceMap,
          globals: globals,
          plugins: [terser({ ecma: 5 })],
        },
        {
          file: "dist/mobile-document-capture.mjs",
          format: "es",
          exports: "default",
          banner,
          sourcemap: hasSourceMap,
          plugins: [
            terser({ ecma: 6 }),
            {
              writeBundle() {
                fs.cpSync("dist/mobile-document-capture.mjs", "dist/mobile-document-capture.esm.js");
              },
            },
          ],
        },
      ],
    },
  ];
};

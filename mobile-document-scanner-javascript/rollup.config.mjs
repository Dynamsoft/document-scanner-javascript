import fs from "fs";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import pkg from "./package.json" assert { type: "json" };

const hasSourceMap = "production" !== process.env.BUILD;
const banner = `/*!
* mobile-document-scanner @version ${pkg.version} (${new Date().toISOString()})
*/`;

const external = [
  "dynamsoft-core",
  "dynamsoft-license",
  "dynamsoft-capture-vision-router",
  "dynamsoft-camera-enhancer",
  "dynamsoft-document-normalizer",
  "dynamsoft-utility",
];

const globals = {
  "dynamsoft-core": "Dynamsoft.Core",
  "dynamsoft-license": "Dynamsoft.License",
  "dynamsoft-capture-vision-router": "Dynamsoft.CVR",
  "dynamsoft-camera-enhancer": "Dynamsoft.DCE",
  "dynamsoft-document-normalizer": "Dynamsoft.DDN",
  "dynamsoft-utility": "Dynamsoft.Utility",
};

const copyFiles = () => ({
  name: "copy-files",
  writeBundle() {
    fs.copyFileSync("src/mobile-document-scanner.ui.html", "dist/mobile-document-scanner.ui.html");
  },
});

export default async () => {
  fs.rmSync("dist", { recursive: true, force: true });

  return [
    {
      input: "src/MobileDocumentScanner.ts",
      plugins: [nodeResolve(), typescript({ tsconfig: "./tsconfig.json", sourceMap: hasSourceMap }), copyFiles()],
      external: external,
      output: [
        {
          file: "dist/mobile-document-scanner.js",
          format: "umd",
          name: "MobileDocumentScanner",
          exports: "default",
          banner,
          sourcemap: hasSourceMap,
          globals: globals,
          plugins: [terser({ ecma: 5 })],
        },
        {
          file: "dist/mobile-document-scanner.mjs",
          format: "es",
          exports: "default",
          banner,
          sourcemap: hasSourceMap,
          plugins: [
            terser({ ecma: 6 }),
            {
              writeBundle() {
                fs.cpSync("dist/mobile-document-scanner.mjs", "dist/mobile-document-scanner.esm.js");
              },
            },
          ],
        },
      ],
    },
  ];
};

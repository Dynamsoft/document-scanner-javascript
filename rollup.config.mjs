import fs from "fs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
// import replace from "@rollup/plugin-replace";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { dts } from "rollup-plugin-dts";

const pkg = JSON.parse(await fs.promises.readFile("./package.json"));
const version = pkg.version;

fs.rmSync("dist", { recursive: true, force: true });

const strProduct = "Dynamsoft Document Scanner JS Edition Bundle";

const terser_format = {
  // this func is run by eval in worker, so can't use variable outside
  comments: function (node, comment) {
    const text = comment.value;
    const type = comment.type;
    if (type == "comment2") {
      // multiline comment
      const strProduct = "Dynamsoft Document Scanner JS Edition Bundle";
      const regDyComment = new RegExp(String.raw`@product\s${strProduct}`, "i");
      return regDyComment.test(text);
    }
  },
};

const banner = `/*!
* Dynamsoft Document Scanner JavaScript Library
* @product ${strProduct}
* @website http://www.dynamsoft.com
* @copyright Copyright ${new Date().getUTCFullYear()}, Dynamsoft Corporation
* @author Dynamsoft
* @version ${version}
* @fileoverview Dynamsoft Document Scanner (DDS) is a ready-to-use SDK for capturing and enhancing document images with automatic border detection, correction, and customizable workflows. Uses Dynamsoft Capture Vision Bundle v3.0.6000.
* More info on DDS JS: https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/
*/`;

const plugin_terser_es6 = terser({ ecma: 6, format: terser_format });
const plugin_terser_es5 = terser({ ecma: 5, format: terser_format });

const DCV_CONFIG_PATH = `src/dcv-config`;
const BUNDLE_BUILD_PATH = `src/build`;
const TYPES_PATH = `dist/types/build`;

const copyFiles = () => ({
  name: "copy-files",
  writeBundle() {
    fs.copyFileSync(`${DCV_CONFIG_PATH}/document-scanner.ui.html`, "dist/document-scanner.ui.html");
  },
});

export default [
  // 1. UMD bundle
  {
    input: `${BUNDLE_BUILD_PATH}/dds.bundle.ts`,
    plugins: [
      nodeResolve({ browser: true }),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        sourceMap: false,
      }),
      plugin_terser_es5,
      copyFiles(),
      {
        writeBundle(options, bundle) {
          let txt = fs
            .readFileSync("dist/dds.bundle.js", { encoding: "utf8" })
            .replace(/Dynamsoft=\{\}/, "Dynamsoft=t.Dynamsoft||{}");
          fs.writeFileSync("dist/dds.bundle.js", txt);
        },
      },
    ],
    output: [
      {
        file: "dist/dds.bundle.js",
        format: "umd",
        name: "Dynamsoft",
        banner: banner,
        exports: "named",
        sourcemap: false,
      },
    ],
  },
  // 2. ESM bundle
  {
    input: `${BUNDLE_BUILD_PATH}/dds.bundle.esm.ts`,
    plugins: [
      nodeResolve({ browser: true }),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        sourceMap: false,
      }),
      plugin_terser_es6,
    ],
    output: [
      {
        file: "dist/dds.bundle.esm.js",
        format: "es",
        banner: banner,
        exports: "named",
        sourcemap: false,
      },
    ],
  },
  // 3. ESM bundle as .mjs
  {
    input: `${BUNDLE_BUILD_PATH}/dds.bundle.esm.ts`,
    plugins: [
      nodeResolve({ browser: true }),
      typescript({
        tsconfig: "./tsconfig.json",
        sourceMap: false,
      }),
      plugin_terser_es6,
    ],
    output: [
      {
        file: "dist/dds.bundle.mjs",
        format: "es",
        banner: banner,
        exports: "named",
        sourcemap: false,
      },
    ],
  },
  // 4. Single type declarations file
  {
    input: `${TYPES_PATH}/dds.bundle.esm.d.ts`,
    plugins: [
      dts({ respectExternal:true }),
      {
        writeBundle(options, bundle) {
          fs.rmSync("dist/types", { recursive: true, force: true });
          // change `export { type A }` to `export { A }`,
          // so project use old typescript still works.
          let txt = fs.readFileSync("dist/dds.bundle.d.ts", { encoding: "utf8" }).replace(/([{,]) type /g, "$1 ");
          fs.writeFileSync("dist/dds.bundle.d.ts", txt);
        },
      },
    ],
    output: [
      {
        file: "dist/dds.bundle.d.ts",
        format: "es",
      },
    ],
  },
];

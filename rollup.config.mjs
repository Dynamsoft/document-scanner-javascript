import fs from "fs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
// import replace from "@rollup/plugin-replace";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { dts } from "rollup-plugin-dts";

const pkg = JSON.parse(await fs.promises.readFile("./package.json"));
const version = pkg.version;

fs.rmSync("dist", { recursive: true, force: true });
// fs.cpSync("public", "dist", { recursive: true });

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
* Dynamsoft JavaScript Library
* @product ${strProduct}
* @website http://www.dynamsoft.com
* @copyright Copyright ${new Date().getUTCFullYear()}, Dynamsoft Corporation
* @author Dynamsoft
* @version ${version}
* @fileoverview Dynamsoft JavaScript Library for Capture Vision. Uses Dynamsoft Capture Vision Bundle v2.6.1000
* More info on DDS JS: https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/
*/`;

const plugin_terser_es6 = terser({ ecma: 6, format: terser_format });
const plugin_terser_es5 = terser({ ecma: 5, format: terser_format });

const copyFiles = () => ({
  name: "copy-files",
  writeBundle() {
    fs.copyFileSync("src/document-scanner.ui.html", "dist/document-scanner.ui.html");
  },
});

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

export default [
  // 1. Full bundle with all dependencies included (no externals)
  {
    input: "src/dds.bundle.ts",
    plugins: [
      nodeResolve({ browser: true }),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        sourceMap: true,
      }),
      plugin_terser_es5,
      copyFiles(),
      {
        // https://rollupjs.org/guide/en/#writebundle
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
        sourcemap: true,
      },
    ],
  },
  // 2. DDS ESM bundles for different use cases
  {
    input: "src/dds.bundle.esm.ts",
    plugins: [
      nodeResolve({ browser: true }),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
        sourceMap: true,
      }),
      plugin_terser_es6,
    ],
    output: [
      {
        file: "dist/dds.bundle.mjs",
        format: "es",
        banner: banner,
        exports: "named",
        sourcemap: true,
      },
    ],
  },
  // 3. Standard bundle with external dependencies
  {
    input: "src/dds.ts",
    external,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: true,
      }),
      plugin_terser_es5,
    ],
    output: [
      {
        file: "dist/dds.js",
        format: "umd",
        name: "Dynamsoft",
        globals,
        banner: banner,
        exports: "named",
        sourcemap: true,
        extend: true,
      },
    ],
  },
  // 2. DDS ESM for different use cases

  {
    input: "src/dds.ts",
    external,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      plugin_terser_es6,
    ],
    output: [
      {
        file: "dist/dds.mjs",
        format: "es",
        banner: banner,
        exports: "named",
        sourcemap: true,
      },
    ],
  },

  {
    input: "src/dds.no-content-bundle.esm.ts",
    external,
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      plugin_terser_es6,
    ],
    output: [
      {
        file: "dist/dds.no-content-bundle.esm.js",
        format: "es",
        banner: banner,
        exports: "named",
        sourcemap: true,
      },
    ],
  },

  {
    input: "dist/types/dds.bundle.d.ts",
    plugins: [
      dts(),
      {
        // https://rollupjs.org/guide/en/#writebundle
        writeBundle(options, bundle) {
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
  // 3. Type definitions (same as before)
  {
    input: "dist/types/dds.bundle.esm.d.ts",
    plugins: [
      dts(),
      {
        // https://rollupjs.org/guide/en/#writebundle
        writeBundle(options, bundle) {
          fs.rmSync("dist/types", { recursive: true, force: true });
          // change `export { type A }` to `export { A }`,
          // so project use old typescript still works.
          let txt = fs.readFileSync("dist/dds.bundle.esm.d.ts", { encoding: "utf8" }).replace(/([{,]) type /g, "$1 ");
          fs.writeFileSync("dist/dds.bundle.esm.d.ts", txt);
        },
      },
    ],
    output: [
      {
        file: "dist/dds.bundle.esm.d.ts",
        format: "es",
      },
    ],
  },
];

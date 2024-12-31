import fs from "fs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { dts } from "rollup-plugin-dts";

const pkg = JSON.parse(await fs.promises.readFile("./package.json"));
const version = pkg.version;

fs.rmSync("dist", { recursive: true, force: true });

const strProduct = "Mobile Web Capture JS Edition Bundle";

const terser_format = {
  comments: function (node, comment) {
    const text = comment.value;
    const type = comment.type;
    if (type == "comment2") {
      const strProduct = "Mobile Web Capture JS Edition Bundle";
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
* @fileoverview Dynamsoft JavaScript Library for Capture Vision
* More info on DDS JS: https://www.dynamsoft.com/capture-vision/docs/web/programming/javascript/
*/`;

const plugin_terser_es6 = terser({ ecma: 6, format: terser_format });
const plugin_terser_es5 = terser({ ecma: 5, format: terser_format });

const copyFiles = () => ({
  name: "copy-files",
  writeBundle() {
    fs.copyFileSync("dds/document-scanner.ui.html", "dist/document-scanner.ui.html");
  },
});

export default [
  {
    input: "src/mwc.bundle.ts",
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationDir: undefined,
      }),
      plugin_terser_es5,
      copyFiles(),
      {
        writeBundle(options, bundle) {
          let txt = fs
            .readFileSync("dist/mwc.bundle.js", { encoding: "utf8" })
            .replace(/Dynamsoft=\{\}/, "Dynamsoft=t.Dynamsoft||{}");
          fs.writeFileSync("dist/mwc.bundle.js", txt);
        },
      },
    ],
    output: [
      {
        file: "dist/mwc.bundle.js",
        format: "umd",
        name: "Dynamsoft",
        banner: banner,
        exports: "named",
        sourcemap: true,
        globals: {
          "dynamsoft-document-scanner": "DocumentScanner",
        },
      },
    ],
  },
  {
    input: "src/mwc.bundle.esm.ts",
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationDir: undefined,
      }),
      plugin_terser_es6,
    ],
    output: [
      {
        file: "dist/mwc.bundle.mjs",
        format: "es",
        banner: banner,
        exports: "named",
        sourcemap: true,
        globals: {
          "dynamsoft-document-scanner": "DocumentScanner",
        },
      },
    ],
  },
  {
    input: "src/mwc.no-content-bundle.esm.ts",
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      plugin_terser_es6,
      copyFiles(),
    ],
    output: [
      {
        file: "dist/mwc.no-content-bundle.esm.js",
        format: "es",
        banner: banner,
        exports: "named",
        sourcemap: true,
        globals: {
          "dynamsoft-document-scanner": "DocumentScanner",
        },
      },
    ],
  },
  {
    input: "dist/types/mwc.bundle.d.ts",
    plugins: [
      dts(),
      {
        writeBundle(options, bundle) {
          let txt = fs.readFileSync("dist/mwc.bundle.d.ts", { encoding: "utf8" }).replace(/([{,]) type /g, "$1 ");
          fs.writeFileSync("dist/mwc.bundle.d.ts", txt);
        },
      },
    ],
    output: [
      {
        file: "dist/mwc.bundle.d.ts",
        format: "es",
      },
    ],
  },
  {
    input: "dist/types/mwc.bundle.esm.d.ts",
    plugins: [
      dts(),
      {
        writeBundle(options, bundle) {
          fs.rmSync("dist/types", { recursive: true, force: true });
          let txt = fs.readFileSync("dist/mwc.bundle.esm.d.ts", { encoding: "utf8" }).replace(/([{,]) type /g, "$1 ");
          fs.writeFileSync("dist/mwc.bundle.esm.d.ts", txt);
        },
      },
    ],
    output: [
      {
        file: "dist/mwc.bundle.esm.d.ts",
        format: "es",
      },
    ],
  },
];

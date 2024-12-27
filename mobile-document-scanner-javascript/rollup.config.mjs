import fs from "fs";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { dts } from "rollup-plugin-dts";

const pkg = JSON.parse(await fs.promises.readFile("./package.json"));

const hasSourceMap = "production" !== process.env.BUILD;
const banner = `/*!
* document-scanner @version ${pkg.version} (${new Date().toISOString()})
*/`;

const terser_format = {
  comments: function (node, comment) {
    const text = comment.value;
    const type = comment.type;
    if (type == "comment2") {
      return /@product|@version|@fileoverview/.test(text);
    }
  },
};

const plugin_terser_es6 = terser({ ecma: 6, format: terser_format });
const plugin_terser_es5 = terser({ ecma: 5, format: terser_format });

const copyFiles = () => ({
  name: "copy-files",
  writeBundle() {
    fs.copyFileSync("src/document-scanner.ui.html", "dist/document-scanner.ui.html");
  },
});

export default async () => {
  fs.rmSync("dist", { recursive: true, force: true });

  return [
    // UMD bundle
    {
      input: "src/DocumentScanner.ts",
      plugins: [
        nodeResolve({
          browser: true,
          preferBuiltins: false,
        }),
        typescript({
          tsconfig: "./tsconfig.json",
          declaration: true,
          declarationDir: "dist/types",
        }),
        plugin_terser_es5,
        copyFiles(),
        {
          writeBundle(options, bundle) {
            let txt = fs
              .readFileSync("dist/document-scanner.js", { encoding: "utf8" })
              .replace(/Dynamsoft=\{\}/, "Dynamsoft=t.Dynamsoft||{}");
            fs.writeFileSync("dist/document-scanner.js", txt);
          },
        },
      ],
      output: [
        {
          file: "dist/document-scanner.js",
          format: "umd",
          name: "DocumentScanner",
          exports: "default",
          banner,
          sourcemap: hasSourceMap,
        },
      ],
    },
    // ESM bundle
    {
      input: "src/DocumentScanner.ts",
      plugins: [
        nodeResolve({
          browser: true,
          preferBuiltins: false,
        }),
        typescript({
          tsconfig: "./tsconfig.json",
          sourceMap: hasSourceMap,
        }),
        plugin_terser_es6,
        copyFiles(),
      ],
      output: [
        {
          file: "dist/document-scanner.mjs",
          format: "es",
          exports: "default",
          banner,
          sourcemap: hasSourceMap,
          plugins: [
            {
              writeBundle() {
                fs.cpSync("dist/document-scanner.mjs", "dist/document-scanner.esm.js");
              },
            },
          ],
        },
      ],
    },
    // TypeScript declarations
    {
      input: "dist/types/DocumentScanner.d.ts",
      plugins: [
        dts(),
        {
          writeBundle(options, bundle) {
            // Create index.d.ts for both CJS and ESM
            const dtsContent = fs.readFileSync("dist/document-scanner.d.ts", "utf8").replace(/([{,]) type /g, "$1 ");

            // Create dist/types directory if it doesn't exist
            if (!fs.existsSync("dist/types")) {
              fs.mkdirSync("dist/types", { recursive: true });
            }

            // Write ESM .d.ts
            fs.writeFileSync("dist/types/index.d.ts", dtsContent);

            // Write CJS .d.ts
            fs.writeFileSync("dist/types/index.d.cts", dtsContent);

            // Clean up intermediate files
            fs.unlinkSync("dist/document-scanner.d.ts");
            fs.rmSync("dist/types/src", { recursive: true, force: true });
          },
        },
      ],
      output: [
        {
          file: "dist/document-scanner.d.ts",
          format: "es",
        },
      ],
    },
  ];
};

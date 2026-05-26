import { defineConfig, type Plugin, type UserConfig } from "vite";
import { readFileSync, readdirSync, cpSync, copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import dts from "unplugin-dts/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const DCV = Object.keys(pkg.dependencies).find((k) =>
  k.includes("dynamsoft-capture-vision-bundle"),
)!;

const banner = `/*!
* Dynamsoft Document Scanner JavaScript Library
* @product Dynamsoft Document Scanner JS Edition Bundle
* @website http://www.dynamsoft.com
* @copyright Copyright ${new Date().getUTCFullYear()}, Dynamsoft Corporation
* @author Dynamsoft
* @version ${pkg.version}
* @fileoverview Dynamsoft Document Scanner (DDS) is a ready-to-use SDK for capturing and enhancing document images with automatic border detection, correction, and customizable workflows. Uses Dynamsoft Capture Vision Bundle v3.2.2000.
* More info on DDS JS: https://www.dynamsoft.com/mobile-document-scanner/docs/web/introduction/index.html
*/`;

// Copy the DCV UI XML alongside the UMD bundle (consumers fetch it at runtime).
function copyUiXml(): Plugin {
  return {
    name: "dds:copy-ui-xml",
    writeBundle() {
      copyFileSync("src/dcv-config/document-scanner.ui.xml", "dist/document-scanner.ui.xml");
    },
  };
}

/**
 * Preserve the rollup-era output set by emitting both dds.bundle.esm.js and
 * dds.bundle.mjs (identical content). unplugin-dts already writes the bundled
 * declaration to dds.bundle.d.ts directly, so no rename is needed.
 */
function preserveLegacyEsmOutputs(): Plugin {
  return {
    name: "dds:preserve-legacy-esm-outputs",
    writeBundle() {
      copyFileSync("dist/dds.bundle.esm.js", "dist/dds.bundle.mjs");
    },
  };
}

// Auto-generate sample listing at / from the samples directory for dev server.
function sampleIndex(): Plugin {
  return {
    name: "sample-index",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== "/") return next();
        const files = readdirSync("samples")
          .filter((f) => String(f).endsWith(".html"))
          .map((f) => `samples/${f}`);
        const links = files.map((f) => `<li><a href="/${f}">${f}</a></li>`).join("\n");
        res.setHeader("content-type", "text/html");
        res.end(
          `<meta name="viewport" content="width=device-width,initial-scale=1"><style>li{margin:.5rem 0}li a{font-size:1.25rem}</style><h2>Samples</h2><ul>${links}</ul>`,
        );
      });
    },
  };
}

export default defineConfig((env): UserConfig => {
  // ---- Dev server ----
  if (env.command === "serve") {
    // Serve dynamsoft-capture-vision-bundle in /public
    const nodeRequire = createRequire(import.meta.url);
    const sdkPkg = "dynamsoft-capture-vision-bundle";
    const srcVersion: string = nodeRequire(resolve(`node_modules/${sdkPkg}/package.json`)).version;
    const destPkgJson = resolve("public", sdkPkg, "package.json");
    const destVersion = existsSync(destPkgJson) ? nodeRequire(destPkgJson).version : null;
    if (srcVersion !== destVersion) {
      cpSync(`node_modules/${sdkPkg}`, `public/${sdkPkg}`, { recursive: true });
    }

    return {
      plugins: [basicSsl(), sampleIndex()],
      appType: "mpa",
      server: {
        host: "0.0.0.0",
        forwardConsole: true,
        // headers: {
        //   // Enable SharedArrayBuffer so DCV can use the multi-threaded (pthread)
        //   // WASM variant for better performance, do not use until upgraded to 3.4.2000
        //   "Cross-Origin-Opener-Policy": "same-origin",
        //   "Cross-Origin-Embedder-Policy": "require-corp",
        // },
      },
    };
  }

  /**
   * ----Library builds----
   * Pass 1: vite build              → dds.bundle.esm.js + dds.bundle.mjs + dds.bundle.d.ts (DCV external)
   * Pass 2: vite build --mode bundle → dds.bundle.js (UMD, DCV inlined) + document-scanner.ui.xml
   */
  const bundle = env.mode === "bundle";

  return {
    plugins: bundle
      ? [copyUiXml()]
      : [dts({ bundleTypes: true, tsconfigPath: "./tsconfig.json" }), preserveLegacyEsmOutputs()],
    resolve: {
      conditions: ["browser"],
      mainFields: ["browser", "module", "main"],
    },
    build: {
      emptyOutDir: !bundle,
      copyPublicDir: false,
      lib: {
        entry: resolve(
          import.meta.dirname,
          bundle ? "src/build/dds.bundle.ts" : "src/build/dds.bundle.esm.ts",
        ),
        name: "Dynamsoft",
        formats: bundle ? ["umd"] : ["es"],
        fileName: bundle ? () => "dds.bundle.js" : () => "dds.bundle.esm.js",
      },
      rollupOptions: {
        external: bundle ? [] : [DCV],
        output: {
          globals: { [DCV]: "Dynamsoft" },
          banner,
          exports: "named",
          extend: true,
        },
      },
    },
  };
});

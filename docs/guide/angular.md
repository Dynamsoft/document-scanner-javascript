<!--
	Ported for the versioned docs build from the Jekyll docs repo at
	ebef2d269a114ac7763a6c0635d098a09cdcbf59 (the last v1.4.2 revision):
	frontmatter dropped, liquid site links made site-relative.
-->

# Mobile Document Scanner - Angular

> [!IMPORTANT]
> This article builds on the prerequisite [MDS developer guide](/guide/index.md) for plain JavaScript; please read it before proceeding.

Mobile Document Scanner integrates easily with Angular applications. Just as in plain JavaScript, you can add document scanning in your **Angular application** in just a few lines of code, and achieve most customizations through the same accessible configuration object.

## Features

- Easy integration with pre-built UI
- Render MDS inside an Angular component
- **Standalone components** (modern Angular architecture)
- Capture and process documents from video stream
- Automatic document detection and cropping
- Mobile-optimized scanning interface
- TypeScript support with type definitions

## Requirements

- **Node.js 20.19.0 or later**
- [Base requirements](/introduction/index.md#system-requirements)

## License

### Get a Trial License

Try **MDS** by requesting a trial license through our [customer portal](https://www.dynamsoft.com/customer/license/trialLicense?product=mwc&utm_source=github_angular_readme). You can renew the license twice for up to a total of two months of free access.

### Get a Full License

[Contact us](https://www.dynamsoft.com/company/contact?product=mwc&utm_source=github_angular_readme) to purchase a full license.

## Quick Start

We publish **MDS** library files on [npm](https://www.npmjs.com/package/dynamsoft-document-scanner) to make them simple to reference from a CDN. We reference the library files in our _ready-made_ Hello World sample for Angular included in our GitHub source repository:

1. Download **MDS** from [GitHub](https://github.com/Dynamsoft/document-scanner-javascript) as a compressed folder.

2. Extract the contents of the archive, and open the extracted directory in a code editor.

3. Set your [license key](#get-a-trial-license) in the **Angular framework sample**:
    1. Open the sample at [`/samples/frameworks/angular/src/app/app.component.ts`](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/document-scanner-javascript-dev/samples/frameworks/angular/src/app/app.component.ts).
    2. Search for `"YOUR_LICENSE_KEY_HERE"`, then replace it with your actual license key.

### Install Dependencies

```bash
npm install
```

### Start the App

```bash
ng serve
```

> [!TIP]
> If you installed Angular locally, you can call the local version with
> ```shell
> npx ng serve
> ```

Open `http://localhost:4200/` to view the sample app.

> [!NOTE]
> Secure context requires HTTPS to provide camera access, but Angular CLI serves over HTTP by default. For mobile testing, you may need to configure HTTPS or use a reverse proxy.

## Self-Host Resources

You can self host the resources for the Hello World by following a few simple steps. Refer to the [plain JavaScript self-hosting guide](/guide/index.md#quick-start) for details.

### Set File Paths

First we set MDS to look resource paths where we will place the resources later:

```typescript
const documentScanner = new Dynamsoft.DocumentScanner({
  license: "YOUR_LICENSE_KEY_HERE",
  scannerViewConfig: {
    cameraEnhancerUIPath: "dist/libs/dynamsoft-document-scanner/dist/document-scanner.ui.html",
  },
  engineResourcePaths: {
    rootDirectory: "dist/libs/"
  },
});
```

### Move Resources

Now, add a script (`get-libs`) to automatically move the resources to their destination when building the project (`build`) in `samples/framework/angular/package.json`:

```json
"scripts": {
  "ng": "ng",
  "start": "ng serve --ssl",
  "build": "ng build && npm run get-libs",
  "get-libs": "npm install --no-save dynamsoft-capture-vision-data dynamsoft-capture-vision-bundle && npx mkdirp /dist/libs && npx cpx 'node_modules/dynamsoft-*/**/*' dist/libs/ --dereference",
  "watch": "ng build --watch --configuration development",
  "test": "ng test"
},
```

When building, **swap the build script** from `ng build` to `npm run build`. Continue using `ng serve` to serve the application.

## Customization

Please check the official [documentation](/guide/index.md).

## Support

If you have any questions, feel free to contact [Dynamsoft support](https://www.dynamsoft.com/company/contact?product=mwc&utm_source=github_angular_readme).

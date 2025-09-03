# Mobile Document Scanner - Angular

> [!IMPORTANT]
> This article builds on the prerequisite [MDS developer guide](https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html) for plain JavaScript; please read it before proceeding.

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
- [Base requirements](https://www.dynamsoft.com/mobile-document-scanner/docs/web/introduction/index.html#system-requirements)

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

```shell
npm install
```

### Start the App

```shell
ng serve
```

> [!TIP]
> If you installed Angular locally, you can call the local version with
> ```shell
> npx ng serve
> ```

Open `http://localhost:4200/` to view the sample app.

## Customization

Please check the official [documentation](https://www.dynamsoft.com/mobile-document-scanner/docs/web/guide/index.html).

## Support

If you have any questions, feel free to contact [Dynamsoft support](https://www.dynamsoft.com/company/contact?product=mwc&utm_source=github_angular_readme).

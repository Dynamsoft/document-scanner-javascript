# Scan Single-Page Documents with Dynamsoft Document Scanner

**Dynamsoft Document Scanner (DDS)** is an SDK designed for scanning single-page documents. It not only captures images of the documents but also enhances their quality to professional standards, making it an ideal tool for mobile document scanning.

> [!NOTE]
> See it in action with the [Dynamsoft Document Scanner Demo](https://demo.dynamsoft.com/document-scanner/).

This guide walks you through building a web application that scans single-page documents using **DDS**, with pre-defined configurations.

**Table of Contents**
- [License](#license)
  - [Get a Trial License](#get-a-trial-license)
  - [Get a Full License](#get-a-full-license)
- [Quick Start](#quick-start)
  - [Option 1: Build from Source](#option-1-build-from-source)
  - [Option 2: Use Precompiled Script](#option-2-use-precompiled-script)
- [Hello World Sample Explained](#hello-world-sample-explained)
  - [Reference DDS](#reference-dds)
  - [Instantiate DDS](#instantiate-dds)
  - [Launch DDS](#launch-dds)
  - [Display the Result](#display-the-result)
- [Custom Usage](#custom-usage)
  - [DocumentScannerConfig Overview](#documentscannerconfig-overview)
  - [Workflow Customization](#workflow-customization)
  - [View-Based Customization](#view-based-customization)
  - [Self-Hosting Resource Files](#self-hosting-resource-files)
- [Next Step](#next-step)

## License

### Get a Trial License

Try **DDS** by requesting a trial license through our [customer portal](https://www.dynamsoft.com/customer/license/trialLicense?product=mwc&source=guide). The trial can be renewed twice, providing a total of two months of free access.

> [!NOTE]
> The request link will indicate **Mobile Web Capture**. This is because **DDS** and **MWC** share the same license keys. If you already have a **MWC** license, you can use it for **DDS**, and vice versa.
 
### Get a Full License

To purchase a full license, [contact us](https://www.dynamsoft.com/company/contact/).

## Quick Start

The first step in using **DDS** is to obtain its library files. You can acquire them from one of the following sources:

1. [**GitHub**](https://github.com/Dynamsoft/document-scanner-javascript) – Contains the source files for the **DDS** SDK, which can be compiled into library files.
2. [**npm**](https://www.npmjs.com/package/dynamsoft-document-scanner) – Provides precompiled library files via npm for easier installation.
3. [**CDN**](https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner) – Delivers precompiled library files through a CDN for quick and seamless integration.

You can choose one of the following methods to set up a Hello World page:

1. **Build from Source** – Download the source files from GitHub and compile the resource script yourself.
2. **Using Precompiled Script** – Use the precompiled resource scripts from npm or the CDN for a quicker setup.

### Option 1: Build from Source

This method retrieves all **DDS** source files from its [GitHub Repository](https://github.com/Dynamsoft/document-scanner-javascript), compiles them into a distributable package, and then runs a *ready-made* Hello World sample page included in the repository.

Follow these steps:

1. Download **DDS** from [GitHub](https://github.com/Dynamsoft/document-scanner-javascript) as a compressed folder.
2. Extract the contents of the archive.
3. Enter the license key you received in [Get a Trial License](#get-a-trial-license) in the Hello World sample.
   > In your code editor, open the Hello World sample located at [`/samples/hello-world.html`](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/samples/hello-world.html). Search for `"YOUR_LICENSE_KEY_HERE"` and replace it with your actual license key.
4. Install project dependencies
    In the terminal, navigate to the project root directory and run:
    ```bash
    npm install
    ```
5. Build the project
    After the dependencies are installed, build the project by running:
    ```bash
    npm run build
    ```
6. Serve the project locally
    Start the local server by running:
    ```bash
    npm run serve
    ```
Once the server is running, open the application in a browser using the address provided in the terminal output after running `npm run serve`.

> [!TIP]
> See the server configuration details in [`/dev-server/index.js`](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/dev-server/index.js).

### Option 2: Use Precompiled Script

Since the **DDS** library files are published on [npm](https://www.npmjs.com/package/dynamsoft-document-scanner), it's easy to reference them from a CDN.

To use the precompiled script, simply include the following URL in a `<script>` tag:
```html
<script src="https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.2.0/dist/dds.bundle.js"></script>
```

Below is the complete Hello World sample page that uses this precompiled script from a CDN.

> [!TIP]
> The code is identical to the [`/samples/hello-world.html`](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/samples/hello-world.html) file mentioned in the [Build from Source](#option-1-build-from-source) section, except for the script source.

> [!WARNING]
> **Don't forget** to replace `"YOUR_LICENSE_KEY_HERE"` with your actual license key.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dynamsoft Document Scanner - Hello World</title>
    <script src="https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.2.0/dist/dds.bundle.js"></script>
  </head>
  <body>
    <h1 style="font-size: large">Dynamsoft Document Scanner</h1>
    <div id="results"></div>
    <script>
      const resultContainer = document.querySelector("#results");
      // Instantiate a Dynamsoft Document Scanner Object
      const documentScanner = new Dynamsoft.DocumentScanner({
        license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
      });
      (async () => {
        // Launch the scanner and wait for the result
        const result = await documentScanner.launch();
        console.log(result);

        // Clear the result container and display the scanned result as a canvas
        if (result?.correctedImageResult) {
          resultContainer.innerHTML = ""; // Clear placeholder content
          const canvas = result.correctedImageResult.toCanvas();
          resultContainer.appendChild(canvas);
        } else {
          resultContainer.innerHTML = "<p>No image scanned. Please try again.</p>";
        }
      })();
    </script>
  </body>
</html>
```

To run the sample, create a new file called `hello-world.html`, then copy and paste the code above into the file. Next, serve the page directly by deploying it to a server.

If you are using VS Code, a quick and easy way to serve the project is using the [Five Server VSCode extension](https://marketplace.visualstudio.com/items?itemName=yandeu.five-server). Simply install the extension, open the `hello-world.html` file in the editor, and click "Go Live" in the bottom right corner of the editor. This will serve the application at `http://127.0.0.1:5500/hello-world.html`.

Alternatively, you can use other methods like `IIS` or `Apache` to serve the project, though we won't cover those here for brevity.

## Hello World Sample Explained

Let’s walk through the code in the Hello World Sample to understand how it works.

> [!TIP]
> Instead of using the code above, an alternative way to view the full code is by visiting the [Dynamsoft Document Scanner Hello World Sample](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/samples/hello-world.html).

### Reference DDS

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dynamsoft Document Scanner - Hello World</title>
    <script src="../dist/dds.bundle.js"></script>
    <!--Alternatively, reference the script from CDN
    <script src="https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.2.0/dist/dds.bundle.js"></script>
    -->
  </head>
```

In this step, DDS is referenced using a relative local path in the `<head>` section of the HTML.

```html
<script src="../dist/dds.bundle.js"></script>
```

Alternatively, the script can be referenced from a CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.2.0/dist/dds.bundle.js"></script>
```

**DDS** wraps all its dependency scripts, so a **DDS** project only needs to include **DDS** itself as a single script. No additional dependency scripts are required.

> [!IMPORTANT]
> Even if you reference the script locally, supporting resources like `.wasm` engine files are still loaded from the CDN at runtime. If you require a **fully offline setup**, follow the instructions in [Self-Hosting Resource File](#self-hosting-resource-files).

### Instantiate DDS

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
});
```

API Reference: [`DocumentScanner()`](https://www.dynamsoft.com/mobile-web-capture/docs/api/document-scanner.html#documentscanner)

This step creates the **DDS** UI, which, occupies the entire visible area of the browser window by default when launched. If needed, you can specify a container to restrict the UI's size. For more details, refer to [Confine DocumentScanner UI to a Specific Container](#example-1-confine-documentscanner-ui-to-a-specific-container)

> [!WARNING]
> A license key is required for the instantiation.

### Launch DDS

```javascript
const result = await documentScanner.launch();
```

API Reference: [`launch()`](https://www.dynamsoft.com/mobile-web-capture/docs/api/document-scanner.html#launch)

This step launches the user into the document scanning workflow, beginning in the `DocumentScannerView`, where they can scan a document using one of three methods: 

* Option 1: Manually scan by pressing the **shutter button**.
* Option 2: Enable "**Smart Capture**" - the scanner will automatically capture an image once a document is detected.
* Option 3: Enable "**Auto Crop**" - the scanner will automatically capture an image, detect the document, and crop it out of the video frame.

> [!NOTE]
> For Options 1 & 2: The user is directed to `DocumentCorrectionView` to review detected document boundaries and make any necessary adjustments before applying corrections. Afterward, they proceed to `DocumentResultView`.
> 
> For Option 3: The `DocumentCorrectionView` step is skipped. Image correction is applied automatically, and the user is taken directly to `DocumentResultView`.

In `DocumentResultView`, if needed, the user can return to `DocumentCorrectionView` to make additional adjustments or press "Re-take" to restart the scanning process.

### Display the Result

The workflow returns a scanned image object of type `CorrectedImageResult`. To display the scanned `result` image, we use a `<div>` in the `<body>`:

```html
<body>
    <h1 style="font-size: large">Dynamsoft Document Scanner</h1>
    <div id="results"></div>
```

API Reference: [`DocumentResult`](https://www.dynamsoft.com/mobile-web-capture/docs/api/document-scanner.html#documentresult)

The following code clears the result container and displays the scanned result as a canvas:

```javascript
if (result?.correctedImageResult) {
    resultContainer.innerHTML = "";
    const canvas = result.correctedImageResult.toCanvas();
    resultContainer.appendChild(canvas);
} else {
    resultContainer.innerHTML = "<p>No image scanned. Please try again.</p>";
}
```

## Custom Usage

This section builds on the Hello World sample to demonstrate how to configure **DDS**, typically by adjusting the `DocumentScannerConfig` object.

### DocumentScannerConfig Overview

`DocumentScannerConfig` is the primary configuration object for customizing **DDS**. It includes the following properties:

1. `license`: The license key.
2. `container`: The HTML container for the entire workflow. If not specified (like in the Hello World Sample), one is created automatically.
3. `showCorrectionView`: Configures where or not to show `DocumentCorrectionView`.
4. `showResultView`: Configures where or not to show `DocumentResultView`.
5. `scannerViewConfig`: Configures the main scanner view with the following properties:
   1. `container`: The HTML container for the `DocumentScannerView`.
   2. `cameraEnhancerUIPath`: Path to the UI definition file (.html) for the `DocumentScannerView`.
   3. `enableAutoCropMode`: sets the default Auto-Crop mode.
   4. `enableSmartCaptureMode`: sets the default Smart Capture mode.
   5. `scanRegion`: sets the scan region within the viewfinder for document scanning.
   6. `minVerifiedFramesForSmartCapture`: sets minimum number of camera frames to detect document boundaries on Smart Capture mode.
   7. `showSubfooter`: sets the visibility of the mode selector menu.
   8. `showPoweredByDynamsoft`: sets the visibility of the Dynamsoft branding message.
6. `correctionViewConfig`: Configures the document correction view.
   1. `container`: The HTML container for the `DocumentCorrectionView`.
   2. `toolbarButtonsConfig`: Configures the appearance and labels of the buttons for the `DocumentCorrectionView` UI.
   3. `onFinish`: Handler called when the user clicks the "Apply" button.
7. `resultViewConfig`: Configures the result view with the following properties:
   1. `container`: The HTML container for the `DocumentResultView`.
   2. `toolbarButtonsConfig`: Configures the appearance and labels of the buttons for the `DocumentResultView` UI.
   3. `onDone`: Handler called when the user clicks the "Done" button.
   4. `onUpload`: Handler called when the user clicks the "Upload" button.
8. `templateFilePath`: Path to a Capture Vision template. Typically not needed as the default template is used.
9.  `utilizedTemplateNames`: Template names for detection and correction. Typically not needed as the default template is used.
10. `engineResourcePaths`: Paths to extra resources such as `.wasm` engine files.

We will discuss two main methods of customizing **DDS** with `DocumentScannerConfig`:

1. **Workflow Customization**: Through container definitions.
2. **View-Based Customization**: Through configuration objects.

The customization examples below will build on the Hello World code from the [previous section](#option-2-use-precompiled-script). The only change required is adjusting the constructor argument.

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    // Add more arguments
});
```

### Workflow Customization

In the Hello World sample, we use the complete workflow with minimum configuration:

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
});
// Launch the scanner and wait for the result
const result = await documentScanner.launch();
```

In this case, **DDS** automatically creates "containers" for its **Views**. In this section, we'll discuss a few examples to adjust the **DDS** workflow.

#### Example 1: Confine DocumentScanner UI to a Specific Container

As long as the `DocumentScanner` container is assigned, **DDS** will confine its **Views** within that container.

> [!NOTE]
> Containers assigned to its constituent **Views** will be ignored.

```html
<div id="myDocumentScannerContainer" style="width: 80vw; height: 80vh;"></div>
```

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    container: document.getElementById("myDocumentScannerContainer") , // Use this container for the full workflow
    scannerViewConfig: {
        container: document.getElementById("myDocumentScannerViewContainer") // This container is ignored
    }
});
```

#### Example 2: Show DocumentScannerView Only

In some cases, `DocumentResultView` and `DocumentCorrectionView` may not be needed, so they can be hidden:

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    showResultView: false,
    showCorrectionView: false
});
```

#### Example 3: Specify Individual View Containers

If only the `DocumentScannerView`, `DocumentResultView`, and `DocumentCorrectionView` containers are provided without the `DocumentScanner` container, **DDS** will render the full workflow using these three containers.

```html
<div id="myDocumentScannerViewContainer" style="width: 80vw; height: 80vh"></div>
<div id="myDocumentCorrectionViewContainer" style="width: 80vw; height: 80vh"></div>
<div id="myScanResultViewContainer" style="width: 80vw; height: 80vh"></div>
```

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    scannerViewConfig: {
        container: document.getElementById("myDocumentScannerViewContainer")
    },
    correctionViewConfig: {
        container: document.getElementById("myDocumentCorrectionViewContainer")
    },
    resultViewConfig: {
        container: document.getElementById("myScanResultViewContainer")
    }
});
```

#### Example 4: Scan Static Image Directly

To scan an image file directly without opening the Scanner View at all, you can pass a `File` object (from either a JPEG or PNG) to `launch()`. As an example, select an image file from the local disk:

```html
<input type="file" id="initialFile" accept="image/png,image/jpeg" />
```

Then get the input file as a `File` object, and pass that file object to `launch()` DDS with:

```js
document.getElementById("initialFile").onchange = async function () {
const files = Array.from(this.files || []);
if (files.length) {
    const result = await documentScanner.launch(files[0]);
    console.log(result);

    // Clear the result container and display the scanned result as a canvas
    if (result?.correctedImageResult) {
    resultContainer.innerHTML = ""; // Clear placeholder content
    const canvas = result.correctedImageResult.toCanvas();
    resultContainer.appendChild(canvas);
    } else {
    resultContainer.innerHTML = "<p>No image scanned. Please try again.</p>";
    }
}
};
```

This bypasses the Scanner View entirely and brings up the Correction View as the first View, after having detected document boundaries on the static image. The user can proceed through the rest of the workflow and further alter the document boundaries, re-take another image (to open up the Scanner View), etc.

### View-Based Customization

In addition to modifying the workflow, individual Views can be customized with configuration options for UI styling, button settings, and event handling.

##### Customizing the `DocumentScannerView` UI

Consider the following configuration interface used for customizing the `DocumentScannerView`:

```javascript
interface DocumentScannerViewConfig {
    container?: HTMLElement;
    templateFilePath?: string;
    cameraEnhancerUIPath?: string;
}
```

We previously covered `container` in [Workflow Customization](#workflow-customization), and changing `templateFilePath` is usually not required. Now, let's focus on `cameraEnhancerUIPath`.

> [!TIP]
> If **DDS** performance does not meet your needs in your usage scenario, you may require a customized algorithm template for better results. In this case, please contact our experienced [Technical Support Team](https://www.dynamsoft.com/company/contact/) to discuss your requirements. They will help tailor a suitable template for you, which you can then apply by updating `templateFilePath`.

By default, `cameraEnhancerUIPath` points to a file hosted on the jsDelivr CDN:  
[https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.2.0/dist/document-scanner.ui.html](https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.2.0/dist/document-scanner.ui.html).  

This file defines the UI for `DocumentScannerView`. However, since files on the CDN **cannot be modified directly**, you need to use a **local version** to customize the UI. `cameraEnhancerUIPath` is used to specify the local version.

##### Steps to Customize the UI for `DocumentScannerView`
1. Follow the instructions in [Build from Source](#option-1-build-from-source) to obtain the source files for **DDS**.  
2. Edit `/src/document-scanner.ui.html` to apply your customizations.  
3. Build the project to generate the updated file in `/dist/document-scanner.ui.html`:  

   ```bash
   npm run build
   ```
4. Update the configuration to use the local file instead of the CDN version:  

   ```javascript
   const documentScanner = new Dynamsoft.DocumentScanner({
       license: "YOUR_LICENSE_KEY_HERE", // Replace with your actual license key
       scannerViewConfig: {
           cameraEnhancerUIPath: "../dist/document-scanner.ui.html", // Use the local file
       },
   });

##### Customizing the Scanning Region

We can customize the scanning region in the viewfinder with the `scanRegion` property in the configuration object:

```js
interface ScanRegion {
  ratio: {
    width: number;
    height: number;
  };
  regionBottomMargin: number; // Bottom margin calculated in pixel
  style: {
    strokeWidth: number;
    strokeColor: string;
  };
}
```

Here is how the scanning region is set:

1. The `ratio` property sets the height-to-width of the scanning region rectangle, then scales the rectangle up to fit within the viewfinder.
2. Translate this rectangle up by the number of pixels specified by `regionBottomMargin`.
3. Create a visual border for the scanning region boundary on the viewfinder with a given stroke width in pixels, and a stroke color.

For example:

```js
scanRegion {
  ratio: {
    width: 2;
    height: 3;
  };
  regionBottomMargin: 20;
  style: {
    strokeWidth: 3;
    strokeColor: "green";
  };
}
```

This creates a scan region with a height-to-width ratio of 3:2, translated upwards by 20 pixels, with a green, 3 pixel-wide border in the viewfinder.

#### `DocumentCorrectionView` Configuration

Consider the following configuration interface used for customizing the `DocumentCorrectionView`:

```javascript
interface DocumentCorrectionViewConfig {
    container?: HTMLElement;
    toolbarButtonsConfig?: DocumentCorrectionViewToolbarButtonsConfig;
    onFinish?: (result: DocumentScanResult) => void;
}
```

`container` is covered in [Workflow Customization](#workflow-customization), we'll look at the other two properties below.

##### Styling Buttons

The `toolbarButtonsConfig` property, of type `DocumentCorrectionViewToolbarButtonsConfig`, customizes the appearance and functionality of the UI buttons. Here is its definition:

```javascript
type ToolbarButtonConfig = Pick<ToolbarButton, "icon" | "label" | "isHidden">;
interface DocumentCorrectionViewToolbarButtonsConfig {
    fullImage?: ToolbarButtonConfig;
    detectBorders?: ToolbarButtonConfig;
    apply?: ToolbarButtonConfig;
}
```

We can use it to change the icon and label of each of the three UI buttons individually or even hide them. Below is an example that sets a custom label and image icon for the "Detect Borders" button and hides the "fullImage" button:

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    correctionViewConfig: {
        toolbarButtonsConfig: {
            fullImage: {
                isHidden: true
            },
            detectBorders: {
                icon: "path/to/new_icon.png", // Change to the actual path of the new icon
                label: "Custom Label"
            }
        }
    }
});
```

##### Customizing Apply Button Callback

The `onFinish` callback is triggered after the user's corrections have been applied. For example, the code below displays the corrected image in a `resultContainer` after the user clicks "Apply":

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    correctionViewConfig: {
        onFinish: (result) => {
            const canvas = result.correctedImageResult.toCanvas();
            resultContainer.appendChild(canvas);
        }
    }
});
```

#### `DocumentResultView` Configuration

Consider the following configuration interface used for customizing the `DocumentResultView`:

```javascript
interface DocumentResultViewConfig {
  container?: HTMLElement;
  toolbarButtonsConfig?: DocumentResultViewToolbarButtonsConfig;
  onDone?: (result: DocumentResult) => Promise<void>;
  onUpload?: (result: DocumentResult) => Promise<void>;
}
```

Like with `DocumentCorrectionView`, we'll look at `toolbarButtonsConfig`, `onDone` and `onUpload`.

##### Styling Buttons

The `toolbarButtonsConfig` property, of type `DocumentResultViewToolbarButtonsConfig`, customizes the appearance and functionality of the UI buttons. Here is its definition:

```javascript
type ToolbarButtonConfig = Pick<ToolbarButton, "icon" | "label" | "isHidden">;
interface interface DocumentResultViewToolbarButtonsConfig {
  retake?: ToolbarButtonConfig;
  correct?: ToolbarButtonConfig;
  share?: ToolbarButtonConfig;
  upload?: ToolbarButtonConfig;
  done?: ToolbarButtonConfig;
}
```

We can use it to change the icon and label of each of the three UI buttons individually or even hide them.
Below is an example that sets a custom label and image icon for the "retake" button and hides the "share" button:

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    resultViewConfig: {
        toolbarButtonsConfig: {
            retake: {
                icon: "path/to/new_icon.png", // Change to the actual path of the new icon
                label: "Custom Label"
            },
            share: {
                isHidden: true
            }
        }
    }
});
```

##### Customizing the "Done" Button Callback

The `onDone` callback is triggered when the "Done" button is pressed. For example, the code below displays the result image in a `resultContainer` after the user clicks "Done":

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    resultViewConfig: {
        onDone: async (result) => 
        {
            const canvas = result.correctedImageResult.toCanvas();
            resultContainer.appendChild(canvas);
        }
    }
});
```
##### Customizing the "Upload" Button

The `onUpload` callback is triggered when the "Upload" button is pressed. Note that the Upload button _only appears_ if a callback function is defined for `onUpload`; otherwise, the button remains hidden.  

The following example demonstrates how to upload the result image to a server:

> [!NOTE]
> If you followed the steps in [Build from Source](#option-1-build-from-source) and are still using the predefined Express server setup, the following upload code will work correctly. The image will be uploaded directly to the dev server as "uploadedFile.png". See the server configuration details in [`/dev-server/index.js`](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/dev-server/index.js).

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    resultViewConfig: {
        onUpload: async (result) => {
            const host = window.location.origin;
            const blob = await result.correctedImageResult.toBlob();
            // Create form data
            const formData = new FormData();
            formData.append("uploadFile", blob, "uploadedFile.png");
            // Upload file
            const response = await fetch(
                `${host}/upload`, // Change this to your actul upload URL
                {
                    method: "POST",
                    body: formData,
                }
            );
        },
    },
});
```

### Self-Hosting Resource Files

By default, **DDS** relies on a CDN for resources such as `.wasm` engine files. If you require a **fully offline setup**, follow these steps:

> [!NOTE]
> These steps are based on [Build from Source](#option-1-build-from-source), meaning that all **DDS** source files must be available on your local machine.

#### Update the Engine Resource Paths and the UI Path:

> [!TIP]
> In this case, we reference local resource files that are copied during the build process. See [Modify the Build Script](#modify-the-build-script) for details. However, you can also reference your own copies, such as files hosted on your own server. If you need assistance, feel free to [contact us](https://www.dynamsoft.com/company/contact/).

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE",
    scannerViewConfig: {
        cameraEnhancerUIPath: "./dist/document-scanner.ui.html", // Use the local file
    },
    engineResourcePaths: {
        std: "./dist/libs/dynamsoft-capture-vision-std/dist/",
        dip: "./dist/libs/dynamsoft-image-processing/dist/",
        core: "./dist/libs/dynamsoft-core/dist/",
        license: "./dist/libs/dynamsoft-license/dist/",
        cvr: "./dist/libs/dynamsoft-capture-vision-router/dist/",
        ddn: "./dist/libs/dynamsoft-document-normalizer/dist/",
    },
});
```

#### Modify the Build Script

Update the `scripts` section in `package.json` to automatically copy the libraries during the build process:

```json
"scripts": {
    "serve": "node dev-server/index.js",
    "build": "rollup -c && npm run copy-libs",
    "copy-libs": "npx mkdirp dist/libs && npx cpx \"node_modules/dynamsoft-*/**/*\" dist/libs/ --dereference",
    "build:production": "rollup -c --environment BUILD:production"
},
```

#### Build the Project

Build the project by running:

```bash
npm run build
```

#### Serve the Project Locally

Start the local development server by running:
```bash
npm run serve
```

Once the server is running, open the application in a browser using the address provided in the terminal output.

Now, all required files will be **served locally** without relying on a CDN.

> [!IMPORTANT]
> * Certain legacy web application servers may lack support for the `application/wasm` mimetype for .wasm files. To address this, you have two options:
>   1. Upgrade your web application server to one that supports the `application/wasm` mimetype.
>   2. Manually define the mimetype on your server. You can refer to the guides for [apache](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Apache_Configuration_htaccess#media_types_and_character_encodings) / [IIS](https://docs.microsoft.com/en-us/iis/configuration/system.webserver/staticcontent/mimemap) / [nginx](https://www.nginx.com/resources/wiki/start/topics/examples/full/#mime-types).
> 
> * To work properly, the SDK requires a few engine files, which are relatively large and may take quite a few seconds to download. We recommend that you set a longer cache time for these engine files, to maximize the performance of your web application.
> 
>   ```
>   Cache-Control: max-age=31536000
>   ```
> 
>   Reference: [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control).

## Next Step

**DDS** is a fully functional, ready-to-use document scanning SDK with built-in UI layouts. However, to extend its capabilities for multi-page and multi-document processing, as well as advanced editing features, we developed **Mobile Web Capture (MWC)**.

Read on to learn how to use this web-based wrapper SDK in the [MWC Getting Started Guide](https://www.dynamsoft.com/mobile-web-capture/docs/guides/mobile-web-capture.html).
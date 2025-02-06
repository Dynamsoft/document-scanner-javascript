# Scan Single-Page Documents with Dynamsoft Document Scanner

**Dynamsoft Document Scanner (DDS)** is an SDK designed for scanning single-page documents. It not only captures images of the documents but also enhances their quality to professional standards, making it an ideal tool for mobile document scanning.

> See it in action with the [Dynamsoft Document Scanner Demo](https://demo.dynamsoft.com/document-scanner/).

This guide walks you through building a web application that scans single-page documents using **DDS**, with **pre-defined configurations**.

**Table of Contents**
- [Scan Single-Page Documents with Dynamsoft Document Scanner](#scan-single-page-documents-with-dynamsoft-document-scanner)
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
      - [Example 1: Specify the Container for DocumentScanner](#example-1-specify-the-container-for-documentscanner)
      - [Example 2: Specify Only the Container for DocumentScannerView](#example-2-specify-only-the-container-for-documentscannerview)
      - [Example 3: Specify Individual View Containers](#example-3-specify-individual-view-containers)
    - [View-Based Customization](#view-based-customization)
      - [`DocumentScannerView` Configuration](#documentscannerview-configuration)
        - [Steps to Customize the UI for `DocumentScannerView`](#steps-to-customize-the-ui-for-documentscannerview)
        - [Styling Buttons](#styling-buttons)
        - [Customizing Apply Button Callback](#customizing-apply-button-callback)
      - [`DocumentResultView` Configuration](#documentresultview-configuration)
        - [Styling Buttons](#styling-buttons-1)
        - [Customizing the "Done" Button Callback](#customizing-the-done-button-callback)
        - [Customizing the "Upload" Button](#customizing-the-upload-button)
    - [Self-Hosting Resource Files](#self-hosting-resource-files)
      - [Modify the Build Script](#modify-the-build-script)
      - [Update the Engine Resource Paths](#update-the-engine-resource-paths)
      - [Update the UI Configuration](#update-the-ui-configuration)
      - [Build the Project](#build-the-project)
      - [Serve the Project Locally](#serve-the-project-locally)
  - [Next Step](#next-step)

## License

### Get a Trial License

Try **DDS** by requesting a trial license through our [customer portal](https://www.dynamsoft.com/customer/license/trialLicense?product=mwc&source=guide). The trial can be renewed twice, providing a total of two months of free access. Note that **DDS** and **MWC** share the same license keys.

### Get a Full License

To purchase a full license, [contact us](https://www.dynamsoft.com/company/contact/).

## Quick Start

To use **DDS**, the first step is to obtain its **library files**. You can acquire them from one of the following sources:

1. [**GitHub**](https://github.com/Dynamsoft/document-scanner-javascript) – Contains the source files for the **DDS** SDK, which can be compiled into library files.
2. [**npm**](https://www.npmjs.com/package/dynamsoft-document-scanner) – Provides precompiled library files via **npm** for easier installation.
3. [**CDN**](https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner) – Delivers precompiled library files through a **CDN** for quick and seamless integration.

You can choose one of the following methods to set up a **Hello World** page:

1. **Build from Source** – Download the source files from **GitHub** and compile the resource script yourself.
2. **Using Precompiled Script** – Use the precompiled resource scripts from **npm** or the **CDN** for a quicker setup.

### Option 1: Build from Source

This method retrieves all **DDS source files** from its [GitHub Repository](https://github.com/Dynamsoft/document-scanner-javascript), compiles them into a distributable package, and then runs a *ready-made* **Hello World** sample page included in the repository.

Follow these steps:

1. **Download** **DDS** from [GitHub](https://github.com/Dynamsoft/document-scanner-javascript) as a compressed folder.
2. **Extract** the contents of the archive.
3. **Open** the root directory in a code editor.
   > We recommend using [VS Code](https://code.visualstudio.com) to follow along with this guide, though any code editor will work.
4. **Enter** the license key you received in [Get a Trial License](#get-a-trial-license).
   > Open the Hello World sample located at [`/samples/hello-world.html`](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/samples/hello-world.html). Search for `"YOUR_LICENSE_KEY_HERE"` and replace it with your actual license key.
5. **Install** project dependencies
    In the terminal, navigate to the project root directory and run:
    ```bash
    npm install
    ```
6. **Build** the project
    After the dependencies are installed, build the project by running:
    ```bash
    npm run build
    ```
7. **Serve** the project locally
    Start the local server by running:
    ```bash
    npm run serve
    ```
Once the server is running, open the application in a browser using the address provided in the terminal output after running `npm run serve`.
> See the server configuration details in [`/dev-server/index.js`](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/dev-server/index.js).

### Option 2: Use Precompiled Script

Since the **DDS library files** are published on [**npm**](https://www.npmjs.com/package/dynamsoft-document-scanner), it's easy to reference them from a CDN.

To use the precompiled script, simply include the following URL in a `<script>` tag:
```html
<script src="https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.0.3/dist/dds.bundle.js"></script>
```

Below is the complete **Hello World** sample page that uses this precompiled script from a CDN.
> The code is identical to the [`/samples/hello-world.html`](https://github.com/Dynamsoft/document-scanner-javascript/blob/main/samples/hello-world.html) file mentioned in the [Build from Source](#option-1-build-from-source) section, except for the script source.
>
> **Don't forget** to replace `"YOUR_LICENSE_KEY_HERE"` with your actual license key.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dynamsoft Document Scanner - Hello World</title>
    <script src="https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.0.3/dist/dds.bundle.js"></script>
  </head>
  <body>
    <h1 style="font-size: large">Dynamsoft Document Scanner</h1>
    <div id="results"></div>
    <script>
      const resultContainer = document.querySelector("#results");
      // Initialize the Dynamsoft Document Scanner
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

If you are using VS Code, a quick and easy way to serve the project is using the [**Five Server** VSCode extension](https://marketplace.visualstudio.com/items?itemName=yandeu.five-server). Simply install the extension, open the `hello-world.html` file in the editor, and click "Go Live" in the bottom right corner of the editor. This will serve the application at `http://127.0.0.1:5500/hello-world.html`.

Alternatively, you can use other methods like `IIS` or `Apache` to serve the project, though we won't cover those here for brevity.

## Hello World Sample Explained

Let’s walk through the code in the Hello World Sample to understand how it works.

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
    <script src="https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.0.3/dist/dds.bundle.js"></script>
    -->
  </head>
```

In this step, **DDS** is referenced using a relative local path in the `<head>` section of the HTML.

```html
<script src="../dist/dds.bundle.js"></script>
```

Alternatively, the script can be referenced from a CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.0.3/dist/dds.bundle.js"></script>
```

**DDS** wraps all its dependency scripts, so a **DDS** project only needs to include **DDS** itself as a single script. No additional dependency scripts are required.

> ⚠**IMPORTANT**: Even if you reference the script locally, supporting resources like `.wasm` engine files are **still loaded from the CDN at runtime**. If you require a **fully offline setup**, follow the instructions in [Self-Hosting Resource File](#self-hosting-resource-files).

### Instantiate DDS

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
});
```

API Reference: [`DocumentScanner()`](https://www.dynamsoft.com/mobile-web-capture/docs/api/document-scanner.html#documentscanner)

This step creates the **DDS** UI, which, when launched, occupies the entire visible area of the browser window by default. If needed, you can specify a container to restrict the UI's size. For more details, refer to [Specify the Container for DocumentScanner](#example-1-specify-the-container-for-documentscanner).

> A **license key** is required for the instantiation.

### Launch DDS

```javascript
const result = await documentScanner.launch();
```

API Reference: [`DocumentScanner.launch()`]({{ site.api }}document-scanner.html#documentscannerlaunch)

This step launches the user into the document scanning workflow, beginning in the `DocumentScannerView`, where they can scan a document using one of three methods: 

* **Option 1**: Manually scan by pressing the **shutter button**.
* **Option 2**: Enable "**Smart Capture**" - the scanner will pause once a document is detected.
* **Option 3**: Enable "**Auto Crop**" - the scanner will automatically detect the document and crop it out of the video frame.

> For Options 1 & 2: The user is directed to `DocumentCorrectionView` to review detected document boundaries and make any necessary adjustments before applying corrections. Afterward, they proceed to `DocumentResultView`.
> 
> For Option 3: The `DocumentCorrectionView` step is skipped. Image correction is applied automatically, and the user is taken directly to `DocumentResultView`.

On `DocumentResultView`, if needed, the user can return to `DocumentCorrectionView` to make additional adjustments or press "**Re-take**" to restart the scanning process.

### Display the Result

The workflow returns a scanned image object of type `CorrectedImageResult`. To display the scanned `result` image, we use a `<div>` in the `<body>`:

```html
<body>
    <h1 style="font-size: large">Dynamsoft Document Scanner</h1>
    <div id="results"></div>
```

API Reference: [`CorrectedImageResult`]({{ site.api }}document-scanner.html#correctedimageresult)

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

This section builds on the **Hello World** sample to demonstrate how to configure **DDS**, typically by adjusting the `DocumentScannerConfig` object.

### DocumentScannerConfig Overview

`DocumentScannerConfig` is the primary configuration object for customizing **DDS**. It includes the following properties:

1. `license`: The license key.
2. `container`: The HTML container for the entire workflow. If not specified (like in the Hello World Sample), one is created automatically.
3. `scannerViewConfig`: Configures the main scanner view with the following properties:
   1. `container`: The HTML container for the `DocumentScannerView`.
   2. `templateFilePath`: Path to a Capture Vision template. Typically not needed as the default template is used.
   3. `cameraEnhancerUIPath`: Path to the UI definition file (.html) for the `DocumentScannerView`.
4. `correctionViewConfig`: Configures the document correction view.
   1. `container`: The HTML container for the `DocumentCorrectionView`.
   2. `toolbarButtonsConfig`: Configures the appearance and labels of the buttons for the `DocumentCorrectionView` UI.
   4. `onFinish`: Handler called when the user clicks the "**Apply**" button.
5. `resultViewConfig`: Configures the result view with the following properties:
   1. `container`: The HTML container for the `DocumentResultView`.
   2. `toolbarButtonsConfig`: Configures the appearance and labels of the buttons for the `DocumentResultView` UI.
   3. `onDone`: Handler called when the user clicks the "**Done**" button.
   4. `onUpload`: Handler called when the user clicks the "**Upload**" button.
6. `utilizedTemplateNames`: Template names for detection and correction. Typically not needed as the default template is used.

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

**DDS** automatically creates containers for its **Views** if none are specified in the configuration. When containers are provided, the workflow adjusts accordingly.

The chart below outlines the different behaviors when specific **containers** are assigned for the `DocumentScanner` instance or its constituent **Views**. Note that other configuration options not covered here are not supported at this time.

- "✓": the container is provided in `DocumentScannerConfig`.
- "🗙": the container is not provided in `DocumentScannerConfig`.
- "✓/🗙": the container may or may not be provided in `DocumentScannerConfig`.

| DocumentScanner | DocumentScannerView | DocumentCorrectionView | DocumentResultView | Resulting Workflow                                                                                                                                  |
| :-------------: | :-----------------: | :--------------------: | :----------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
|        🗙        |          🗙          |           🗙            |         🗙          | DDS creates containers for the `DocumentScanner`, `DocumentScannerView`, `DocumentCorrectionView`, and `DocumentResultView` by default.             |
|        ✓        |         ✓/🗙         |          ✓/🗙           |        ✓/🗙         | DDS uses the container for the `DocumentScanner` and ignores any specified containers for the Views, creating its own instead.                      |
|        🗙        |          ✓          |           🗙            |         🗙          | DDS only makes the `DocumentScannerView` available and returns the scan result from `DocumentScanner.launch()` immediately after a successful scan. |
|        🗙        |          ✓          |           ✓            |         ✓          | DDS makes the full workflow available through the three specified containers.                                                                       |
|        🗙        |          ✓          |           ✓            |         🗙          | DDS does not create the `DocumentResultView`, so scans always move from the `DocumentScannerView` to the `DocumentCorrectionView`.                  |
|        🗙        |          ✓          |           🗙            |         ✓          | DDS uses those two containers during View creation but creates the `DocumentCorrectionView` with its own self-generated container.                  |

#### Example 1: Specify the Container for DocumentScanner

As long as the `DocumentScanner` container is assigned, **DDS** will ignore any other containers assigned to its constituent **Views**:

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

#### Example 2: Specify Only the Container for DocumentScannerView

If only the `DocumentScannerView` container is provided, **DDS** displays only the `DocumentScannerView` and returns the scan result from `DocumentScanner.launch()` immediately after a successful scan.

```html
<div id="myDocumentScannerViewContainer" style="width: 80vw; height: 80vh;"></div>
```

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    scannerViewConfig: {
        container: document.getElementById("myDocumentScannerViewContainer")
    }
});
```

#### Example 3: Specify Individual View Containers

If only the `DocumentScannerView` container is provided, **DDS** displays only the `DocumentScannerView` and returns the scan result from `DocumentScanner.launch()` immediately after a successful scan.

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

### View-Based Customization

In addition to modifying the workflow, individual **Views** can be customized with configuration options for **UI styling, button settings, and event handling**.

#### `DocumentScannerView` Configuration

Consider the following configuration interface used for customizing the `DocumentScannerView`:

```javascript
interface DocumentScannerViewConfig {
    container?: HTMLElement;
    templateFilePath?: string;
    cameraEnhancerUIPath?: string;
}
```

We previously covered `container` in [Workflow Customization](#workflow-customization), and changing `templateFilePath` is usually not required. Now, let's focus on `cameraEnhancerUIPath`.

> If **DDS** performance does not meet your needs in your usage scenario, you may require a customized algorithm template for better results. In this case, please contact our experienced [Technical Support Team](https://www.dynamsoft.com/company/contact/) to discuss your requirements. They will help tailor a suitable template for you, which you can then apply by updating `templateFilePath`.

By default, `cameraEnhancerUIPath` points to a file hosted on the jsDelivr CDN:  
[https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.0.3/dist/document-scanner.ui.html](https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.0.3/dist/document-scanner.ui.html).  

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

We can use it to change the **icon** and **label** of each of the three UI buttons individually or even hide them. Below is an example that sets a custom label and image icon for the "Detect Borders" button and hides the "fullImage" button:

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
                text: "Custom Label" // Capitalized for consistency, adjust as needed
            }
        }
    }
});
```

##### Customizing Apply Button Callback

The `onFinish` callback is triggered after the user's corrections have been applied. For example, the code below displays the corrected image in a `resultContainer` after the user clicks "**Apply**":

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

We can use it to change the **icon** and **label** of each of the three UI buttons individually or even hide them.
Below is an example that sets a custom label and image icon for the "retake" button and hides the "share" button:

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    resultViewConfig: {
        toolbarButtonsConfig: {
            retake: {
                icon: "path/to/new_icon.png", // Change to the actual path of the new icon
                text: "Custom Label" // Capitalized for consistency, adjust as needed
            },
            share: {
                isHidden: true
            }
        }
    }
});

```

##### Customizing the "Done" Button Callback

The `onDone` callback is triggered when the "**Done**" button is pressed. For example, the code below displays the result image in a `resultContainer` after the user clicks "**Done**":

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

The `onUpload` callback is triggered when the **"Upload"** button is pressed. Note that the **Upload** button **only appears** if a callback function is defined for `onUpload`; otherwise, the button remains hidden.  

The following example demonstrates how to upload the result image to a server:

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

By default, **DDS** relies on a **CDN** for resources such as `.wasm` engine files. If you require a **fully offline setup**, follow these steps:
> These steps are based on [Build from Source](#option-1-build-from-source), meaning that all **DDS** source files must be available on your local machine.

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

#### Update the Engine Resource Paths

Open `src/DocumentScanner.ts` and locate the following line:

```typescript
CoreModule.engineResourcePaths.rootDirectory = "https://cdn.jsdelivr.net/npm/";
```

Replace it with:

```typescript
CoreModule.engineResourcePaths = {
    "std": "./dist/libs/dynamsoft-capture-vision-std/dist/",
    "dip": "./dist/libs/dynamsoft-image-processing/dist/",
    "core": "./dist/libs/dynamsoft-core/dist/",
    "license": "./dist/libs/dynamsoft-license/dist/",
    "cvr": "./dist/libs/dynamsoft-capture-vision-router/dist/",
    "ddn": "./dist/libs/dynamsoft-document-normalizer/dist/"
};
```

#### Update the UI Configuration

Modify the UI configuration in your application (`/samples/hello-world.html` in our case) to reference the **local UI definition file** instead of the CDN:

```javascript
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE", // Replace this with your actual license key
    scannerViewConfig: {
        cameraEnhancerUIPath: "../dist/document-scanner.ui.html",
    },
});
```

#### Build the Project

Once all dependencies are installed, build the project by running:

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

## Next Step

**DDS** is a fully functional, ready-to-use document scanning SDK with built-in UI layouts. However, to extend its capabilities for multi-page and multi-document processing, as well as advanced editing features, we developed **Mobile Web Capture (MWC)**.

Read on to learn how to use this web-based wrapper SDK in the [MWC Developer Guide](https://www.dynamsoft.com/mobile-web-capture/docs/guides/mobile-web-capture.html).

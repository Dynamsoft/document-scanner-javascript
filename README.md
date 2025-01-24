# Dynamsoft Document Scanner for the Web

**Dynamsoft Document Scanner (DDS)** is designed to handle the following use case:

* Capturing a clear image of a physical document, such as a single-page patient intake form or the front side of a driver’s license. 

   > DDS not only captures the document but also enhances its quality to meet professional standards.

## Key Features

1. Capture single documents using mobile devices or webcams.
2. Import a single local image of a document.
3. Automatically detect document borders during image capture.
4. Automatically capture and correct images to align with detected document boundaries.
5. Export a single-page document as an image.

    > To deliver these features, DDS leverages the following Dynamsoft products:
    >
    > 1. **Dynamsoft Camera Enhancer (DCE)**: Focuses on image capture and video feed enhancement.
    > 2. **Dynamsoft Document Normalizer (DDN)**: Processes the captured document image, restoring its quality with cropping and perspective transformations.

## How to Use the SDK to Build a Web Page for Document Scanning

### Step 1: Get a License

DDS requires a license key to function. You can request a [30-day free trial license](https://www.dynamsoft.com/customer/license/trialLicense?product=mwc&source=readme) via our customer portal.

### Step 2: Create a "Hello World" Page

#### Option 1: Work with the GitHub Repository

If you're **working with the [GitHub Repository](https://github.com/Dynamsoft/document-scanner-javascript)**, the "hello-world.html" page is available under the [`/samples`](https://github.com/Dynamsoft/document-scanner-javascript/tree/main/samples) directory.

Find the following code snippet and replace `YOUR_LICENSE_KEY_HERE` with the license key you obtained in [Step 1](https://github.com/Dynamsoft/document-scanner-javascript/tree/main?tab=readme-ov-file#step-1-get-a-license).

```js
const documentScanner = new Dynamsoft.DocumentScanner({
    license: "YOUR_LICENSE_KEY_HERE",
});
```

#### Option 2: Create Your Own Page

Alternatively, you can create an empty file named `hello-world.html`, paste the following code into it, and replace `YOUR_LICENSE_KEY_HERE` with the license key you obtained in [Step 1](https://github.com/Dynamsoft/document-scanner-javascript/tree/main?tab=readme-ov-file#step-1-get-a-license):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dynamsoft Document Scanner - Hello World</title>
    <script src="https://cdn.jsdelivr.net/npm/dynamsoft-document-scanner@1.0.0/dist/dbr.bundle.js"></script>
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
      }
    </style>
  </head>

  <body>
    <h1 style="font-size: large">Dynamsoft Document Scanner</h1>
    <div id="results"></div>

    <script>
      const resultContainer = document.querySelector("#results");

      // Initialize the Dynamsoft Document Scanner
      const documentScanner = new Dynamsoft.DocumentScanner({
        license: "YOUR_LICENSE_KEY_HERE",
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

### Step 3: Run the "Hello World" Page

#### Option 1: Work with the GitHub Repository

If you're **working with the [GitHub Repository](https://github.com/Dynamsoft/document-scanner-javascript)**, follow these steps:

1. Install project dependencies:

```bash
npm install
```

2. Build the project:
 
```bash
npm run build
```

3. Serve the project locally:

```bash
npm run serve
```

4. Open the application:

After running `npm run serve`, the terminal will display the local address. Open the address in your browser to access the application.

> Notes on the Test Server (Development Only)
> 
> This sample uses the web server provided by Express (https://expressjs.com/). It is intended solely for local development and testing purposes, and it lacks production-grade features like advanced security, scalability, and detailed logging.
> 
> - The server is configured to run on **"localhost"** using port `3000` and on your computer's **local IP address** using port `3001` with SSL enabled via self-signed certificates.
> - To access the application from a mobile device or another computer on your network, use your computer's **local IP address** and ensure the device is connected to the same Local Area Network (LAN).
>   - If there are multiple **local IP addresses**, choose one that works.
>   - You will get an security alert in the browser for "self-signed certificates", click "Advanced" to continue

#### Option 2: Run the Page You Created

If you created your own `hello-world.html` file (as described in [Step 2, Option 2](https://github.com/Dynamsoft/document-scanner-javascript/tree/main?tab=readme-ov-file#option-2-create-your-own-page)), follow these steps to run it:

1. Deploy to a web server:

  - You can use a production server like IIS or Apache.
  - Alternatively, for local testing, use a simple server such as the [Five Server](https://marketplace.visualstudio.com/items?itemName=yandeu.five-server) extension for Visual Studio Code.

1. Access the file in your browser:

  Once the server is running, open the URL where the file is served (e.g., http://localhost/hello-world.html).

## Contact us

If you encounter any issues, need assistance, or have suggestions, please don’t hesitate to reach out to us. You can:

- **Submit an issue** directly in this repository.
- **Contact us through various channels** listed on our official [Contact Us](https://www.dynamsoft.com/contact/) page.

We’re here to help!
# Framework Samples

The Angular, React (with hooks), and Vue samples show how to use [`DocumentScanner`](/api/classes/DocumentScanner.md) in a framework app. They live in the [samples repository](https://github.com/Dynamsoft/document-scanner-javascript-samples), under `frameworks/`, beside the demo. Each sample is its own npm project.

## Features

- Each sample renders the document scanner inside a component of its framework: Angular (with the Angular CLI), React, or Vue.
- Each sample serves runtime resources from its own origin. The React and Vue samples copy them into `public/engine/` in `vite.config.ts`, and the Angular sample copies them through `angular.json`. The component points [`resources`](/api/interfaces/ResourceSettings.md) at them.

## Quick Start

1. In the directory of a sample, install the dependencies:

	```shell
	npm install
	```

2. Replace `"YOUR_LICENSE_KEY_HERE"` with your [license key](/guide/index.md#license) in the component: `src/app/app.component.ts` (Angular), `src/App.tsx` (React), or `src/App.vue` (Vue).

3. Start the development server, and open the `https://` address that it prints. The server uses a self-signed certificate, so the browser shows a warning. Accept it to continue. To test on a phone on the same network, open the `Network` address:

	```shell
	npm run dev
	```

4. To build for production, run:

	```shell
	npm run build
	```

	For the React and Vue samples, `npm run preview` serves the production build.

## User Guide

- [The user guide](/guide/index.md)
- [Self-Host Resources](/guide/index.md#self-host-resources)

## Support

If you have a question, [contact Dynamsoft Support](https://www.dynamsoft.com/company/contact?utm_source=mdsSampleReadme).

# Troubleshooting

## "Script error." in the Console on Firefox for iOS

### What You See

A message appears in the browser console, or a report arrives in your error tracking service, that reads:

```
Script error.
```

It has no file name, no line number and no stack trace. It shows up while **Mobile Document Scanner** is running, and it can appear more than once in a session. Safari and Chrome on iOS are not affected, and neither is any browser on Android or desktop.

> [!NOTE]
> Confirmed on Firefox for iOS 154.1 and 155.0, running on iOS 18.7. Updating iOS does not help, because the script that fails belongs to the Firefox app rather than to the browser engine that iOS provides.

### What Causes It

Firefox for iOS adds a little of its own JavaScript to every page it opens, which is how features such as form autofill work. One of those scripts watches for the moment the keyboard focus moves to a new element, and it fails whenever that element is anything other than a form field. A button, a link, a dropdown or a dialog will all set it off.

Moving focus is an ordinary thing for a web page to do, and **MDS** does it when it shows one of its message boxes, such as the trial license notice. The message box takes focus so that a screen reader announces it, the Escape key closes it, and a keyboard user reaches its buttons. That focus move is what Firefox's script trips over.

The failure happens inside Firefox's own code rather than inside your page, so the browser will not tell your page what went wrong. All it passes along is the phrase `Script error.` with the details stripped out. That is why there is nothing useful attached to it.

### What It Means for Your App

Nothing. The message is a report, not a failure. Scanning, correction, export and every other part of **MDS** carry on exactly as they do on any other browser, and your own code never sees the error that caused it.

The same message also appears on pages that have nothing to do with **MDS**. Any site that moves focus in JavaScript will produce it on Firefox for iOS, including your own application code and most UI frameworks, so you may well see it outside the scanner too.

### What You Can Do

There is nothing to fix on your side or ours. The error comes from the browser, so it cannot be caught or prevented by the page it appears on.

If the reports are cluttering an error tracking service, filter them out. Ignore any report whose message is exactly `Script error.` and that arrives with no file name and no stack trace, since a report with nothing attached to it cannot be acted on in any case. In Sentry, for example:

```javascript
Sentry.init({
	ignoreErrors: ["Script error."],
});
```

> [!TIP]
> Before you dismiss one of these, check that it really is empty. A genuine error from your own code arrives with a file name, a line number and a stack trace. If any of those are present, it is not this.

### Progress

This is a known problem in Firefox for iOS rather than in **MDS**, and it is being tracked in Mozilla's [firefox-ios repository](https://github.com/mozilla-mobile/firefox-ios/issues). A closely related report, [#24561](https://github.com/mozilla-mobile/firefox-ios/issues/24561), was fixed for form fields in early 2025; the same problem remains for every other kind of element.

## A Warning About Another Copy of Dynamsoft Capture Vision

### What You See

The browser console shows a warning from **MDS** when it loads its engines:

```
Mobile Document Scanner: another copy of Dynamsoft Capture Vision, core 4.4.20, loaded before this document scanner's Dynamsoft Capture Vision 3.6.5000, whose core is 4.6.50. Dynamsoft Document Viewer reads its license and file paths through whichever copy loaded first, so it may fail to load.
```

The versions in the warning depend on your page.

### What Causes It

Your page loads Capture Vision twice, usually because another Dynamsoft SDK on the page brings its own copy. Each copy keeps its own license and file paths. But only the copy that loads first shares them with the whole page, through `window.Dynamsoft`. Document Viewer, the other engine of **MDS**, reads them from there. Thus, if the other SDK licensed its copy or set a file path for Document Viewer, Document Viewer uses those values.

### What It Means for Your App

Often nothing. In our tests, **MDS** still opens the camera when another copy of Capture Vision 3.4 or 3.6 loads first, if that copy has no license and no file paths. But the values that the other SDK sets can break the scan:

- If the other SDK sets a license key that the license server refuses, the scan fails with the error kind `"license"` and the reason `"rejected"`. This happens even when your own key is valid.
- If the other SDK sets a file path for Document Viewer, Document Viewer looks for its files there, and the scan can fail.

### What You Can Do

Make your page load one copy of Capture Vision. Use one of these ways:

- Install one version of `dynamsoft-capture-vision-bundle` that both SDKs accept. **MDS** declares the engines as peer dependencies. If the other SDK does the same, the package manager installs one copy. If the other SDK pins its own exact version as a dependency, it always gets its own copy.
- Import the engine once, and pass it to **MDS** with the [`engines`](/api/interfaces/ScannerSettings.md#engines) setting. Then **MDS** loads no copy of its own. The engine must have the major and minor version that **MDS** supports, Capture Vision 3.6. Otherwise, the scan fails with the error kind `"engineLoad"`.

If your page must load two copies, **MDS** works as long as the other SDK sets no license and no file path for Document Viewer before **MDS** loads its engines.

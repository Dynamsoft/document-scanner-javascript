// Scan-flow orchestration — owns the DocumentScanner instance and the stage
// transitions between landing, the camera/edit-viewer loop, and the result view.

import { DocumentScanner } from "dynamsoft-document-scanner";
import { $ } from "./dom.js";
import { setScannerOverlayOpen, showLanding, showScanner } from "./view.js";
import { clearDocument, ensureDdv, getDoc, onHubClose, onScanClick } from "./ddv.js";
import { enterResult, leaveResult } from "./results.js";
import { LICENSE } from "./license.js";

const homeError = $("home-error");
const startCameraScanButton = $<HTMLButtonElement>("startCameraScan");
const desktopProceedButton = $<HTMLButtonElement>("desktop-proceed");

let documentScanner: DocumentScanner | null = null;
let scannerOpen = false;
let closeToLanding = false;
let ready: Promise<void> | null = null;

// Repurpose the scanner view's close (X): by default it ends the scan loop
// like "Done" and drops back to the hub. Flag the click (acted on once
// launch() resolves) so it leaves to the landing instead. The camera UI
// lives in an open shadow root, so match the composed path — event.target
// is retargeted to the host. Only ".dce-mn-close" matches; "Done" is unaffected.
// Registered once at module scope so init() retries don't stack listeners.
document.addEventListener(
	"click",
	(event) => {
		if (event.composedPath().some((el) => el instanceof Element && el.classList.contains("dce-mn-close")))
			closeToLanding = true;
	},
	true,
);

// One-time init of both SDKs, memoized. The DDV document must exist before
// onDocumentScanned can load pages into it, so ensureDdv() runs first.
function ensureScanner(): Promise<void> {
	return (ready ??= init());
}

async function init(): Promise<void> {
	await ensureDdv();
	documentScanner = new DocumentScanner({
		license: LICENSE,
		container: $("scanner-container"),
		engineResourcePaths: {
			dcvBundle: `${import.meta.env.BASE_URL}dynamsoft-capture-vision-bundle/dist`,
			dcvData: `${import.meta.env.BASE_URL}dynamsoft-capture-vision-data`,
		},
		scannerViewConfig: {
			cameraEnhancerUIPath: `${import.meta.env.BASE_URL}document-scanner.ui.xml`,
			enableAutoCropMode: true,
			enableSmartCaptureMode: true,
		},
		enableContinuousScanning: true,
		onDocumentScanned: async (result) => {
			try {
				const corrected = result.correctedImageResult;
				if (!corrected) return;
				// JPEG via canvas keeps the page blobs small before they enter the DDV document.
				const canvas = corrected.toCanvas();
				const blob = await new Promise<Blob | null>((resolve) => {
					canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9);
				});
				if (blob) await getDoc().loadSource([{ convertMode: "cm/auto", fileData: blob }]);
			} catch (error) {
				console.error("Error adding scanned page to the document:", error);
			}
		},
	});
	// The hub's toolbar buttons drive the flow from here on.
	onScanClick(() => void launchCamera());
	onHubClose(() => void finishScanning());
	// Warm the scanner's engines (DCV WASM, templates, camera UI) so the first
	// launch opens the camera without the init delay.
	await documentScanner.initialize();
}

// Mounts the camera overlay over the hub; resolves when the user exits the
// scanner (continuous mode collects pages via onDocumentScanned).
async function launchCamera(): Promise<void> {
	if (scannerOpen || !documentScanner) return;
	scannerOpen = true;
	closeToLanding = false;
	setScannerOverlayOpen(true);
	try {
		await documentScanner.launch();
	} finally {
		setScannerOverlayOpen(false);
		scannerOpen = false;
	}
	// Close (X) pressed: discard in-progress pages instead of going to the hub/result.
	if (closeToLanding) {
		clearDocument();
		showLanding();
	}
}

// Hub close button: nothing scanned → landing; otherwise → result view.
async function finishScanning(): Promise<void> {
	if (getDoc().pages.length === 0) {
		showLanding();
		return;
	}
	await enterResult();
}

// Falls back to the landing and shows the error inline.
function reportScanError(error: unknown): void {
	const message = error instanceof Error ? error.message : String(error);
	console.error("Scanning error:", error);
	showLanding();
	homeError.innerHTML = `<div class="error-message">Scanning error: ${message}</div>`;
}

// Show the scanner stage and open the camera, surfacing any failure.
async function openScanner(): Promise<void> {
	showScanner();
	try {
		await launchCamera();
	} catch (error) {
		reportScanError(error);
	}
}

// Kicks off SDK init while the user is still reading the landing page.
// Failures stay silent — the first user action retries init and surfaces it.
export function preloadScanner(): void {
	ensureScanner().catch((error) => {
		console.error("Scanner preload failed:", error);
		ready = null;
	});
}

// Landing entry point (mobile Continue + desktop camera button).
export async function startScanFlow(): Promise<void> {
	startCameraScanButton.disabled = true;
	desktopProceedButton.disabled = true;
	homeError.innerHTML = "";
	try {
		await ensureScanner();
		await openScanner();
	} catch (error) {
		reportScanError(error);
	} finally {
		startCameraScanButton.disabled = false;
		desktopProceedButton.disabled = false;
	}
}

// Result-view "Restart scan": discard the scanned pages and start a fresh set.
export async function restartScan(): Promise<void> {
	leaveResult();
	clearDocument();
	await openScanner();
}

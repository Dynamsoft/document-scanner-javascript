// Entry point — wires DOM events to the flow modules. The supporting modules
// attach their own listeners at import time.

import { $ } from "./dom.js";
import { preloadScanner, restartScan, startScanFlow } from "./scanner.js";
import { downloadPdf } from "./results.js";
// sanitize:begin comm100-bridge
import "./chrome.js";
// sanitize:end comm100-bridge

$<HTMLButtonElement>("startCameraScan").addEventListener("click", startScanFlow);
$<HTMLButtonElement>("desktop-proceed").addEventListener("click", startScanFlow);

document.querySelector<HTMLButtonElement>(".btn-rescan")!.addEventListener("click", restartScan);
document.querySelector<HTMLButtonElement>(".btn-download")!.addEventListener("click", downloadPdf);

// Warm both SDKs in the background so the first scan starts instantly.
preloadScanner();

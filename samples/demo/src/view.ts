// View-state — owns body[data-view] and the info-menu dropdown. The
// mobile/desktop landing swap is pure CSS (see landing.css).

import { $ } from "./dom.js";

const homeError = $("home-error");

export function showLanding(): void {
	document.body.dataset.view = "landing";
	homeError.innerHTML = "";
}

export function showResult(): void {
	document.body.dataset.view = "result";
}

// The scanner stage — hosts the edit-viewer hub and the camera overlay.
export function showScanner(): void {
	document.body.dataset.view = "scanner";
}

// Toggles body[data-scanner-open]; index.css swaps the camera overlay in
// front of the edit-viewer hub.
export function setScannerOverlayOpen(open: boolean): void {
	if (open) document.body.dataset.scannerOpen = "";
	else delete document.body.dataset.scannerOpen;
}

// ---- Info menu (dropdown in the result header) ----

const infoMenu = $("info-menu");
document.querySelector<HTMLButtonElement>(".info-btn")!.addEventListener("click", () => {
	infoMenu.classList.toggle("open");
});
document.addEventListener("click", (e) => {
	if (!infoMenu.contains(e.target as Node)) infoMenu.classList.remove("open");
});

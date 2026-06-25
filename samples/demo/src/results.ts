// Result stage — renders the scanned pages into the scrollable inset,
// generates the PDF at entry, and owns the blob URLs for both.

import { $ } from "./dom.js";
import { showResult } from "./view.js";
import { getDoc } from "./ddv.js";

const resultError = $("result-error");
const insetPages = $("inset-pages");
const downloadButton = document.querySelector<HTMLButtonElement>(".btn-download")!;

let pdfUrl: string | null = null;
let pageUrls: string[] = [];

// Exports the PDF up front (not on download click) so errors surface
// immediately and repeat downloads reuse one blob.
export async function enterResult(): Promise<void> {
	resultError.innerHTML = "";
	downloadButton.disabled = true;
	showResult();
	try {
		const doc = getDoc();
		// The display rendition includes any rotate/crop/filter edits from the
		// hub, so the inset always matches the exported PDF.
		insetPages.innerHTML = "";
		for (const [index, pageUid] of doc.pages.entries()) {
			const { data } = await doc.getPageData(pageUid).display();
			const url = URL.createObjectURL(data);
			pageUrls.push(url);
			const img = document.createElement("img");
			img.src = url;
			img.alt = `Scanned page ${index + 1}`;
			insetPages.appendChild(img);
		}
		const blob = await doc.saveToPdf();
		pdfUrl = URL.createObjectURL(blob);
		downloadButton.disabled = false;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("Result error:", error);
		resultError.innerHTML = `<div class="error-message">Failed to prepare the document: ${message}</div>`;
	}
}

// Revokes the blob URLs and clears the view; called before every exit.
export function leaveResult(): void {
	if (pdfUrl) URL.revokeObjectURL(pdfUrl);
	pdfUrl = null;
	for (const url of pageUrls) URL.revokeObjectURL(url);
	pageUrls = [];
	insetPages.innerHTML = "";
	downloadButton.disabled = true;
	resultError.innerHTML = "";
}

export function downloadPdf(): void {
	if (!pdfUrl) return;
	const link = document.createElement("a");
	link.href = pdfUrl;
	link.download = `document-${Date.now()}.pdf`;
	link.click();
}

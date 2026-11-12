import type { ScannerError } from "./faults";
import type { OverlayName } from "./ui/overlay";

/** The name of a phase: a stage of a session, with its own screen. */
export type PhaseName = "capture" | "rectify" | "edit";

/**
 * The name of a mode of the rectify or edit screen. The rectify screen always shows
 * one of its two modes. The edit screen shows its pages with no mode, or with one mode
 * over them.
 */
export type ModeName = "afterCapture" | "fromEdit" | "filter";

/**
 * A move of the user between screens, modes, and overlays, which the
 * {@link ScannerEvents.navigate | navigate} event reports. A minor release may add
 * a `type`, so a switch on `type` needs a default branch.
 */
export type Navigation =
	/** The screen of a phase opened, after the screen of another phase or after none. */
	| { readonly type: "phase"; readonly from: PhaseName | null; readonly to: PhaseName }
	/** A mode opened or closed on the screen of `phase`. */
	| {
			readonly type: "mode";
			readonly phase: "rectify" | "edit";
			readonly from: ModeName | null;
			readonly to: ModeName | null;
	  }
	/**
	 * An overlay opened or closed over the screen of `phase`. At most one overlay is
	 * open at a time.
	 */
	| {
			readonly type: "overlay";
			readonly phase: PhaseName;
			readonly overlay: OverlayName;
			readonly open: boolean;
	  };

/**
 * The identifier of a scanned page. The type checker refuses a plain string where
 * the API expects a `PageId`.
 */
export type PageId = string & { readonly __brand: "PageId" };

/**
 * The format of an encoded image. The `quality` of a JPEG image is a number from 0
 * to 1.
 */
export type ImageEncoding = { encoding: "png" } | { encoding: "jpeg"; quality?: number };

/** The members of every page image, raster or vector. */
export interface PageImageBase {
	/** The width of the image, in pixels for a raster image, or in points for a vector image. */
	readonly width: number;
	/** The height of the image, in the units of `width`. */
	readonly height: number;
	/**
	 * Draw the image on a new canvas.
	 *
	 * @param options - The canvas is `scale` times the size of the image. `scale` is 1
	 * by default.
	 * @returns The canvas, with the image drawn on it.
	 */
	toCanvas(options?: { scale?: number }): Promise<HTMLCanvasElement>;
	/**
	 * Get the image as a blob. The document scanner draws a vector image as pixels
	 * first.
	 *
	 * @param encoding - The format of the blob. Without it,
	 * {@link ScannedPage.original | original} gives the blob that the page arrived as,
	 * and {@link ScannedPage.processed | processed} gives a PNG image.
	 * @returns The encoded image.
	 */
	toBlob(encoding?: ImageEncoding): Promise<Blob>;
}

/** A bitmap image, such as a photo from the camera or an imported image. */
export interface RasterImage extends PageImageBase {
	readonly kind: "raster";
}

/**
 * A page from a PDF file that keeps the text and drawing objects of the page. The
 * document scanner does not import PDF files yet, so no page is a vector image.
 */
export interface VectorImage extends PageImageBase {
	readonly kind: "vector";
	/** Copy the page into a one-page PDF that keeps its text and drawing objects. */
	toPdf(): Promise<Blob>;
}

/**
 * The image of a page. The document scanner decodes or draws nothing until the host
 * application calls a method.
 *
 * {@link ScannedPage.original | original} keeps the blob that the page arrived as,
 * and works as long as the page object exists. The document scanner reads
 * {@link ScannedPage.processed | processed} again on each call. Thus the methods of
 * `processed` reject when the page is no longer in the document: after the user
 * deletes it, or after {@link DocumentScanner.cancel | cancel()},
 * {@link DocumentScanner.reset | reset()}, or {@link DocumentScanner.dispose | dispose()}
 * deletes the pages. To keep the processed image, call `toBlob()` or `toCanvas()`
 * before then.
 */
export type PageImage = RasterImage | VectorImage;

/**
 * Four corners in clockwise order, from the corner nearest the top-left corner of
 * the page.
 */
export interface Quadrilateral {
	readonly points: readonly [Point, Point, Point, Point];
}

/**
 * A position in the coordinates of an image, from its top-left corner, in the units
 * of {@link PageImageBase.width}.
 */
export interface Point {
	/** The distance from the left edge. */
	readonly x: number;
	/** The distance from the top edge. */
	readonly y: number;
}

/** A page of the scanned document. */
export interface ScannedPage {
	/** The identifier of the page, which stays the same when the page moves. */
	readonly id: PageId;
	/** The position of the page in the document when the document scanner made this object. */
	readonly index: number;
	/** Where the page came from. */
	readonly origin: "camera" | "file";
	/** The page as the camera or the file gave it, before any processing. */
	readonly original: PageImage;
	/**
	 * The page rectified to `boundary`, with every later edit applied. It can be a
	 * raster image when `original` is a vector image.
	 */
	readonly processed: PageImage;
	/**
	 * The boundary that the page was rectified to, in the coordinates of `original`.
	 * For a page that was not rectified, it is the whole image.
	 */
	readonly boundary: Quadrilateral;
}

/**
 * The state of the document after a change: the number of its pages, the current
 * page, and what undo and redo can do, with this change in the history.
 */
export interface DocumentState {
	/** The number of pages in the document. */
	readonly pageCount: number;
	/**
	 * The index of the page that the edit screen shows, or else of the newest page.
	 * `-1` while the document is empty.
	 */
	readonly currentIndex: number;
	/** How many changes undo can take back. */
	readonly undoCount: number;
	/** How many changes redo can make again. */
	readonly redoCount: number;
}

/**
 * A change to the document, and the state after it, which the
 * {@link ScannerEvents.documentChange | documentChange} event reports. A minor
 * release may add a `type`, so a switch on `type` needs a default branch.
 */
export type DocumentChange =
	/** Pages came into the document: new ones, or ones that undo or redo brought back. */
	| {
			readonly type: "pagesAdded";
			readonly pages: readonly ScannedPage[];
			readonly state: DocumentState;
	  }
	/** Pages left the document, from the indices they had. */
	| {
			readonly type: "pagesRemoved";
			readonly indices: readonly number[];
			readonly state: DocumentState;
	  }
	/** The pages changed their order. */
	| { readonly type: "pagesReordered"; readonly state: DocumentState }
	/** A page turned, or took a new boundary or filter. */
	| { readonly type: "pageEdited"; readonly page: ScannedPage; readonly state: DocumentState }
	/** What undo and redo can do changed. */
	| { readonly type: "historyChanged"; readonly state: DocumentState };

/**
 * The scanned document, encoded as {@link ScannerSettings.output} asks. Without
 * that setting, the result has no `ScanOutput`.
 */
export type ScanOutput =
	/** Every page in one PDF. */
	| { readonly format: "pdf"; readonly document: Blob }
	/** Every page in one TIFF. */
	| { readonly format: "tiff"; readonly document: Blob }
	/** One image per page, in page order. */
	| { readonly format: "images"; readonly images: readonly Blob[] };

/**
 * The pages of a successful session, in order. A successful session always has at
 * least one page, because a finish with no pages ends the session as cancelled.
 */
export type ScannedPages = readonly [ScannedPage, ...ScannedPage[]];

/** The result of a session that finished. */
export interface SuccessfulScan {
	/** Always `"success"`. */
	readonly status: "success";
	/** The pages of the document, in order. */
	readonly pages: ScannedPages;
	/**
	 * The whole document, encoded as {@link ScannerSettings.output} asks. It is absent
	 * without that setting.
	 */
	readonly output?: ScanOutput;
}

/**
 * The value that {@link DocumentScanner.scan | scan()} resolves with. A cancelled
 * session drops every page in the document. A failed session keeps the pages, as
 * {@link DocumentScanner.finish | finish()} does. Thus a later `scan()` starts with
 * them. {@link DocumentScanner.reset | reset()} drops them. Only a major release adds
 * a status.
 */
export type ScanResult =
	| SuccessfulScan
	| { readonly status: "cancelled" }
	| { readonly status: "failed"; readonly error: ScannerError };

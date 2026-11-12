import type { IPageData, PageImageInfo } from "dynamsoft-document-viewer";
import { reportFault } from "../faults";
import type {
	ImageEncoding,
	PageId,
	Quadrilateral,
	RasterImage,
	ScanOutput,
	ScannedPage,
} from "../results";
import { FILTER_NAMES } from "../settings/filters";
import type { OutputSettings } from "../settings/settings";
import type { FilterName } from "../settings/filters";
import { PAGE_QUALITY, drawImage, encodeCanvas, imageSize } from "./images";
import { isWholePage, sameBoundary, wholePage } from "../boundaries/quads";

// The scanned document, with a record of the original each page is rectified
// from and the filter it shows. An image decodes or encodes only when a caller
// asks for it.

/**
 * The members of Document Viewer's `IDocument` that `ScannedDocument` uses, some
 * narrowed to what it passes and reads.
 */
export interface EngineDocument {
	readonly uid: string;
	readonly pages: readonly string[];
	loadSource(fileData: Blob): Promise<string[]>;
	updatePage(pageUid: string, source: { fileData: Blob }): Promise<boolean>;
	setPageCustomData(pageUid: string, record: PageRecord): Promise<boolean>;
	getPageCustomData(pageUid: string): Promise<unknown>;
	getPageData(pageUid: string): EnginePage;
	deletePages(indices: number[]): boolean;
	deleteAllPages(): boolean;
	movePages(indices: number[], insertBeforeIndex: number): void;
	saveToPng(index: number): Promise<Blob>;
	saveToJpeg(index: number, settings: { quality?: number }): Promise<Blob>;
	saveToPdf(): Promise<Blob>;
	saveToTiff(): Promise<Blob>;
}

/** Document Viewer's documents that `ScannedDocument` works through. */
export interface EngineDocuments {
	/** The document that holds the pages. */
	readonly document: EngineDocument;
	/** A second document, which holds the pages set aside until undo puts them back. */
	readonly aside: EngineDocument;
	/** Move pages between documents, as Document Viewer's document manager does. */
	movePagesToDocument(
		sourceUid: string,
		targetUid: string,
		options: { sourceIndices: number[]; insertBeforeIndex?: number; includeAnnotations: boolean },
	): boolean;
}

/** The members of Document Viewer's `IPageData` that `ScannedDocument` uses. */
export type EnginePage = Pick<IPageData, "raw" | "display" | "thumbnail" | "rotation" | "destroy">;

/** What the document scanner keeps about a page, in the engine's custom data for it. */
export interface PageRecord {
	readonly origin: "camera" | "file";
	/** The page as captured or imported. Every rectification starts from it. */
	readonly original: Blob;
	/** The original's size in pixels. */
	readonly width: number;
	readonly height: number;
	/** The boundary the page is rectified to, in the original's pixels. */
	readonly boundary: Quadrilateral;
	/** The filter over the rectified image. */
	readonly filter: FilterName;
}

/** Rectify a page: make its image from its original and its boundary. */
export type Rectify = (original: Blob, boundary: Quadrilateral) => Promise<Blob>;

/** Make an image with a filter applied. */
export type FilterImage = (image: Blob, filter: FilterName) => Promise<Blob>;

/**
 * The scanned document. Each page shows its original rectified to its boundary,
 * or the original itself when the boundary is the whole page, with its filter
 * applied.
 */
export class ScannedDocument {
	readonly #engine: EngineDocuments;
	readonly #engineDocument: EngineDocument;
	readonly #rectify: Rectify;
	readonly #filterImage: FilterImage;
	/**
	 * The last rectification, kept so that each filter chosen for a page does not
	 * rectify its original again.
	 */
	#lastRectified: {
		readonly original: Blob;
		readonly boundary: Quadrilateral;
		readonly image: Promise<Blob>;
	} | null = null;

	constructor(engine: EngineDocuments, rectify: Rectify, filterImage: FilterImage) {
		this.#engine = engine;
		this.#engineDocument = engine.document;
		this.#rectify = rectify;
		this.#filterImage = filterImage;
	}

	/** The uid of the engine's document, for a viewer to open. */
	get uid(): string {
		return this.#engineDocument.uid;
	}

	/** The uids of both engine documents, the pages and the pages set aside. */
	get engineUids(): readonly string[] {
		return [this.#engineDocument.uid, this.#engine.aside.uid];
	}

	/** The number of pages. */
	get pageCount(): number {
		return this.#engineDocument.pages.length;
	}

	/** The uid of the last page, or `undefined` while there are none. */
	get lastPageUid(): string | undefined {
		return this.#engineDocument.pages.at(-1);
	}

	/**
	 * Add a page rectified to `boundary`, or the unrectified original without one,
	 * and return its uid. A rectification that fails is reported, and the original
	 * goes in unrectified.
	 */
	async add(
		original: Blob,
		origin: PageRecord["origin"],
		boundary: Quadrilateral | null,
	): Promise<string> {
		const { width, height } = await imageSize(original);
		const whole = wholePage(width, height);
		let record: PageRecord = {
			origin,
			original,
			width,
			height,
			boundary: boundary && !isWholePage(boundary, width, height) ? boundary : whole,
			filter: "none",
		};
		let image: Blob;
		try {
			image = await this.#rectified(record);
		} catch (thrown) {
			reportFault("this page could not be rectified", thrown);
			record = { ...record, boundary: whole };
			image = original;
		}
		const [uid] = await this.#engineDocument.loadSource(image);
		if (uid === undefined) throw new Error("The page could not be added to the document");
		await this.#engineDocument.setPageCustomData(uid, record);
		return uid;
	}

	/**
	 * Rectify a page to `boundary` from its original, or restore the original for
	 * the whole page or `null`, under the page's filter. Return the boundary the page
	 * had, or `undefined` when the page already has this one, which changes nothing.
	 * A rectification that fails rejects and leaves the page unmodified.
	 */
	async setBoundary(
		uid: string,
		boundary: Quadrilateral | null,
	): Promise<Quadrilateral | undefined> {
		const record = await this.recordOf(uid);
		const { width, height } = record;
		const whole = boundary === null || isWholePage(boundary, width, height);
		const chosen = whole ? wholePage(width, height) : boundary;
		if (sameBoundary(chosen, record.boundary)) return undefined;
		await this.#update(uid, { ...record, boundary: chosen });
		return record.boundary;
	}

	/**
	 * Show a page under `filter`. Return the filter the page had, or `undefined`
	 * when it already has this one, which changes nothing. A filter that fails
	 * rejects and leaves the page unmodified.
	 */
	async setFilter(uid: string, filter: FilterName): Promise<FilterName | undefined> {
		const record = await this.recordOf(uid);
		if (filter === record.filter) return undefined;
		await this.#update(uid, { ...record, filter });
		return record.filter;
	}

	/**
	 * Preview a page under each of `filters`, in order. Each preview starts from one
	 * copy of the page's rectified image, at most `longestSide` pixels on its longer
	 * side. The page's own filter does not apply. A preview that fails is reported
	 * and left out.
	 */
	async previews(
		uid: string,
		filters: readonly FilterName[],
		longestSide: number,
	): Promise<ReadonlyMap<FilterName, Blob>> {
		const page = await this.#rectified(await this.recordOf(uid));
		const { width, height } = await imageSize(page);
		const scale = Math.min(1, longestSide / Math.max(width, height));
		const small = await encodeCanvas(await drawImage(page, scale), "image/jpeg", PAGE_QUALITY);
		const previews = new Map<FilterName, Blob>();
		for (const filter of filters) {
			try {
				previews.set(filter, await this.#filtered(small, filter));
			} catch (thrown) {
				reportFault(`the preview of the ${filter} filter could not be made`, thrown);
			}
		}
		return previews;
	}

	/** Give a page the image its record describes, then the record. */
	async #update(uid: string, record: PageRecord): Promise<void> {
		const image = await this.#filtered(await this.#rectified(record), record.filter);
		await this.#engineDocument.updatePage(uid, { fileData: image });
		await this.#engineDocument.setPageCustomData(uid, record);
	}

	/** A page's original rectified to its boundary, or the original for the whole page. */
	#rectified({ original, width, height, boundary }: PageRecord): Promise<Blob> {
		if (isWholePage(boundary, width, height)) return Promise.resolve(original);
		const last = this.#lastRectified;
		if (last?.original === original && sameBoundary(last.boundary, boundary)) return last.image;
		const image = this.#rectify(original, boundary);
		this.#lastRectified = { original, boundary, image };
		// A rectification that fails is tried again next time.
		image.catch(() => {
			if (this.#lastRectified?.image === image) this.#lastRectified = null;
		});
		return image;
	}

	/** An image under `filter`, or the image itself for `none`. */
	#filtered(image: Blob, filter: FilterName): Promise<Blob> {
		return filter === "none" ? Promise.resolve(image) : this.#filterImage(image, filter);
	}

	/**
	 * A page's rotation, in degrees clockwise. A new boundary resets it to 0, because
	 * the engine replaces the page's image.
	 */
	rotationOf(uid: string): number {
		const page = this.#engineDocument.getPageData(uid);
		try {
			return page.rotation;
		} finally {
			page.destroy();
		}
	}

	/**
	 * A page's record. A page added outside `ScannedDocument`, such as by the edit
	 * screen's own controls, has none until its boundary or filter is set. Its image
	 * as loaded, before rotation, crop, or filter, stands in for the original.
	 */
	async recordOf(uid: string): Promise<PageRecord> {
		const stored = await this.#engineDocument.getPageCustomData(uid);
		if (isRecord(stored)) return stored;
		const { data, width, height } = await this.#read(uid, (page) => page.raw());
		const boundary = wholePage(width, height);
		return { origin: "file", original: data, width, height, boundary, filter: "none" };
	}

	/** Remove a page. Undo cannot bring it back. */
	remove(uid: string): void {
		const index = this.#engineDocument.pages.indexOf(uid);
		if (index >= 0) this.#engineDocument.deletePages([index]);
	}

	/** Remove every page, and every page set aside. */
	clear(): void {
		this.#engineDocument.deleteAllPages();
		this.dropAside();
	}

	/**
	 * Take a page out of the document, and keep it, with its record and its edits,
	 * for `putBack`. Return the index it had.
	 */
	setAside(uid: string): number {
		const index = indexIn(this.#engineDocument, uid);
		this.#move(this.#engineDocument, this.#engine.aside, index);
		return index;
	}

	/** Put a page set aside back into the document at `index`. */
	putBack(uid: string, index: number): void {
		this.#move(this.#engine.aside, this.#engineDocument, indexIn(this.#engine.aside, uid), index);
	}

	/** Remove the pages set aside for good. */
	dropAside(): void {
		this.#engine.aside.deleteAllPages();
	}

	/** The uids of the pages, in order. */
	get order(): readonly string[] {
		return [...this.#engineDocument.pages];
	}

	/**
	 * Put the pages in `order`, which holds each page once. Each page goes to its
	 * place in turn, from the first, so the pages before it are already in their places.
	 */
	arrange(order: readonly string[]): void {
		order.forEach((uid, index) => {
			const from = indexIn(this.#engineDocument, uid);
			if (from === index) return;
			// The engine counts the target in the order before the move. The target is
			// always before `from` here, because the pages before it are in place.
			this.#engineDocument.movePages([from], index);
		});
	}

	/** Move the page at `index` from one engine document to another. */
	#move(from: EngineDocument, to: EngineDocument, index: number, insertBeforeIndex?: number): void {
		const options = { sourceIndices: [index], insertBeforeIndex, includeAnnotations: true };
		if (!this.#engine.movePagesToDocument(from.uid, to.uid, options)) {
			throw new Error("The page could not be moved between documents");
		}
	}

	/** The page's thumbnail, as the engine draws it. */
	async thumbnail(uid: string): Promise<Blob> {
		return (await this.#read(uid, (page) => page.thumbnail())).data;
	}

	/** Read one page as a `ScannedPage`, with its index in the document. */
	page(uid: string): Promise<ScannedPage> {
		return this.#scannedPage(uid, indexIn(this.#engineDocument, uid));
	}

	/** Read every page as a `ScannedPage`, in order. */
	snapshot(): Promise<readonly ScannedPage[]> {
		return Promise.all(
			this.#engineDocument.pages.map((uid, index) => this.#scannedPage(uid, index)),
		);
	}

	/**
	 * Encode the whole document as `output` asks, or return `undefined` when there
	 * is no `output`. Pages are encoded with every later edit applied. Rejects with
	 * Document Viewer's error when it fails to encode the document.
	 */
	async export(output: OutputSettings | undefined): Promise<ScanOutput | undefined> {
		if (!output) return undefined;
		switch (output.format) {
			case "pdf":
				return { format: "pdf", document: await this.#engineDocument.saveToPdf() };
			case "tiff":
				return { format: "tiff", document: await this.#engineDocument.saveToTiff() };
			case "images":
				return { format: "images", images: await this.#saveEach(output) };
		}
	}

	/** Turn one page into a `ScannedPage`. */
	async #scannedPage(uid: string, index: number): Promise<ScannedPage> {
		const [record, shown] = await Promise.all([
			this.recordOf(uid),
			// The display image has the page's rotation and crop applied, and the page
			// exports at its size.
			this.#read(uid, (page) => page.display()),
		]);
		const { original, width, height } = record;
		return {
			id: uid as PageId,
			index,
			origin: record.origin,
			original: rasterImage((encoding) => reencode(original, encoding), width, height),
			// TODO: report a page imported from a PDF as a vector image. Its blob should
			// be that one page split out of the file.
			processed: rasterImage((encoding) => this.#save(uid, encoding), shown.width, shown.height),
			boundary: record.boundary,
		};
	}

	/** Encode each page as an image, in order. The engine has no call for the set. */
	async #saveEach(encoding: ImageEncoding): Promise<readonly Blob[]> {
		const images: Blob[] = [];
		for (const uid of this.#engineDocument.pages) images.push(await this.#save(uid, encoding));
		return images;
	}

	/**
	 * Encode a page with every later edit applied. Its position is looked up by uid,
	 * because pages can be deleted or reordered after the result is made.
	 */
	async #save(uid: string, encoding?: ImageEncoding): Promise<Blob> {
		const index = this.#engineDocument.pages.indexOf(uid);
		if (index < 0) throw new Error("This page has been deleted from the document");
		if (encoding?.encoding !== "jpeg") return this.#engineDocument.saveToPng(index);
		// The engine takes JPEG quality from 0 to 100, and `ImageEncoding` from 0 to 1.
		const { quality } = encoding;
		return this.#engineDocument.saveToJpeg(index, {
			quality: quality === undefined ? undefined : quality * 100,
		});
	}

	/** Read one of a page's images, and let go of the engine's page handle. */
	async #read(
		uid: string,
		image: (page: EnginePage) => Promise<PageImageInfo>,
	): Promise<PageImageInfo> {
		const page = this.#engineDocument.getPageData(uid);
		try {
			return await image(page);
		} finally {
			page.destroy();
		}
	}
}

/**
 * Whether a page's custom data is a record the document scanner wrote. Anyone with
 * the live viewer can write to it.
 */
function isRecord(data: unknown): data is PageRecord {
	if (typeof data !== "object" || data === null) return false;
	const record = data as Partial<PageRecord>;
	return (
		(record.origin === "camera" || record.origin === "file") &&
		record.original instanceof Blob &&
		typeof record.width === "number" &&
		typeof record.height === "number" &&
		record.boundary?.points?.length === 4 &&
		(FILTER_NAMES as readonly unknown[]).includes(record.filter)
	);
}

/**
 * Make a page image that decodes and encodes nothing until asked. `toBlob` makes
 * its blob, in the format asked for.
 */
function rasterImage(
	toBlob: (encoding?: ImageEncoding) => Promise<Blob>,
	width: number,
	height: number,
): RasterImage {
	return {
		kind: "raster",
		width,
		height,
		async toCanvas(options): Promise<HTMLCanvasElement> {
			return drawImage(await toBlob(), options?.scale ?? 1);
		},
		toBlob,
	};
}

/** Return the blob unchanged, or redraw and encode it when a format is asked for. */
async function reencode(blob: Blob, encoding?: ImageEncoding): Promise<Blob> {
	if (!encoding) return blob;
	const canvas = await drawImage(blob, 1);
	const quality = encoding.encoding === "jpeg" ? encoding.quality : undefined;
	return encodeCanvas(canvas, `image/${encoding.encoding}`, quality);
}

/** The index of a page in an engine document. Throws when the document lacks it. */
function indexIn(document: EngineDocument, uid: string): number {
	const index = document.pages.indexOf(uid);
	if (index < 0) throw new Error(`The document has no page ${uid}`);
	return index;
}

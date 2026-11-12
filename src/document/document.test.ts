import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { Quadrilateral } from "../results";
import type { FilterName } from "../settings/filters";
import { encodeCanvas, imageSize } from "./images";
import { ScannedDocument } from "./document";
import type { EngineDocument, PageRecord } from "./document";
import { wholePage } from "../boundaries/quads";

/** A page boundary inside a 400 by 300 original. */
const BOUNDARY: Quadrilateral = {
	points: [
		{ x: 40, y: 30 },
		{ x: 360, y: 40 },
		{ x: 350, y: 270 },
		{ x: 50, y: 260 },
	],
};

/** Make a blank PNG of the given size. */
function png(width: number, height: number): Promise<Blob> {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return encodeCanvas(canvas, "image/png");
}

/** One page of the fake document. */
interface FakePage {
	readonly uid: string;
	image: Blob;
	data: unknown;
	/** The page's rotation in degrees clockwise, which a new image resets. */
	rotation?: number;
	/**
	 * The size Document Viewer reports for the page as shown, when a test sets one.
	 * Without one, it is the image's own size.
	 */
	shown?: { readonly width: number; readonly height: number };
}

/**
 * A document held in memory, behaving as Document Viewer's does for the calls
 * `ScannedDocument` makes.
 */
function fakeEngineDocument(documentUid = "document") {
	const pages: FakePage[] = [];
	let added = 0;
	const find = (uid: string): FakePage => {
		const page = pages.find((each) => each.uid === uid);
		if (!page) throw new Error(`There is no page ${uid}`);
		return page;
	};
	const engineDocument = {
		uid: documentUid,
		get pages() {
			return pages.map(({ uid }) => uid);
		},
		loadSource: vi.fn(async (image: Blob) => {
			added += 1;
			const uid = `page-${added}`;
			pages.push({ uid, image, data: undefined });
			return [uid];
		}),
		// Replacing the image keeps the custom data.
		updatePage: vi.fn(async (uid: string, { fileData }: { fileData: Blob }) => {
			find(uid).image = fileData;
			return true;
		}),
		setPageCustomData: vi.fn(async (uid: string, data: unknown) => {
			find(uid).data = data;
			return true;
		}),
		getPageCustomData: async (uid: string) => find(uid).data,
		getPageData: (uid: string) => {
			const page = find(uid);
			const raw = async () => ({ data: page.image, ...(await imageSize(page.image)) });
			return {
				raw,
				display: async () => ({ ...(await raw()), ...page.shown }),
				thumbnail: raw,
				rotation: page.rotation ?? 0,
				destroy: () => undefined,
			};
		},
		deletePages: vi.fn((indices: number[]) => {
			for (const index of [...indices].sort((a, b) => b - a)) pages.splice(index, 1);
			return true;
		}),
		deleteAllPages: vi.fn(() => {
			pages.length = 0;
			return true;
		}),
		// As the engine does, it counts the target in the order before the move.
		movePages: (indices: number[], insertBeforeIndex: number) => {
			const [index] = indices;
			const [page] = pages.splice(index!, 1);
			pages.splice(
				insertBeforeIndex > index! ? insertBeforeIndex - 1 : insertBeforeIndex,
				0,
				page!,
			);
		},
		saveToPng: vi.fn(async (index: number) => new Blob([`page ${index}`], { type: "image/png" })),
		saveToJpeg: vi.fn(
			async (index: number, _settings: { quality?: number }) =>
				new Blob([`page ${index}`], { type: "image/jpeg" }),
		),
		saveToPdf: vi.fn(async () => new Blob(["pdf"], { type: "application/pdf" })),
		saveToTiff: vi.fn(async () => new Blob(["tiff"], { type: "image/tiff" })),
	} satisfies EngineDocument;
	return Object.assign(engineDocument, {
		/** Take the page at `index` out, for another fake document. */
		take: (index: number): FakePage => pages.splice(index, 1)[0]!,
		/** Put a page in before `index`, or at the end. */
		insert: (page: FakePage, index = pages.length) => void pages.splice(index, 0, page),
		/** Turn a page, as the edit viewer does. */
		setRotation: (uid: string, rotation: number) => void (find(uid).rotation = rotation),
		/** The image a page shows now. */
		imageOf: (uid: string) => find(uid).image,
		/**
		 * Report a size for the page as shown, as Document Viewer does once the user
		 * rotates or crops it.
		 */
		setShownSize: (uid: string, width: number, height: number) => {
			find(uid).shown = { width, height };
		},
	});
}

/**
 * A scanned document over a fake engine document, rectifying with a fake that
 * makes a 300 by 200 page, and filtering with a fake that tags its image.
 */
async function fakeScannedDocument(rectifyFails = false, moveFails = false) {
	const engineDocument = fakeEngineDocument();
	const aside = fakeEngineDocument("aside");
	const documents = new Map([engineDocument, aside].map((each) => [each.uid, each]));
	const rectified = await png(300, 200);
	const rectify = vi.fn(async (_image: Blob, _boundary: Quadrilateral) => {
		if (rectifyFails) throw new Error("The engine could not rectify the page");
		return rectified;
	});
	// Each image it makes names its source and its filter.
	const filterImage = vi.fn(async (source: Blob, filter: FilterName): Promise<Blob> =>
		Object.assign(new Blob([filter], { type: "image/jpeg" }), { source, filter }),
	);
	return {
		scanned: new ScannedDocument(
			{
				document: engineDocument,
				aside,
				movePagesToDocument: (source, target, { sourceIndices: [index], insertBeforeIndex }) => {
					if (moveFails) return false;
					const page = documents.get(source)!.take(index!);
					documents.get(target)!.insert(page, insertBeforeIndex);
					return true;
				},
			},
			rectify,
			filterImage,
		),
		engineDocument,
		aside,
		rectify,
		rectified,
		filterImage,
	};
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("ScannedDocument", () => {
	it("adds a page rectified to its boundary with a record of the original", async () => {
		const { scanned, engineDocument, rectify, rectified } = await fakeScannedDocument();
		const original = await png(400, 300);

		const uid = await scanned.add(original, "camera", BOUNDARY);

		expect(rectify).toHaveBeenCalledWith(original, BOUNDARY);
		expect(engineDocument.imageOf(uid)).toBe(rectified);
		expect(await scanned.recordOf(uid)).toEqual({
			origin: "camera",
			original,
			width: 400,
			height: 300,
			boundary: BOUNDARY,
			filter: "none",
		});
	});

	it("adds the original unrectified when there is no boundary, or the boundary is the whole page", async () => {
		const { scanned, engineDocument, rectify } = await fakeScannedDocument();
		const original = await png(400, 300);

		const bare = await scanned.add(original, "camera", null);
		const whole = await scanned.add(original, "file", wholePage(400, 300));

		expect(rectify).not.toHaveBeenCalled();
		expect(engineDocument.imageOf(bare)).toBe(original);
		expect(engineDocument.imageOf(whole)).toBe(original);
		expect((await scanned.recordOf(whole)).boundary).toEqual(wholePage(400, 300));
	});

	it("adds the original unrectified, bounded by the whole page, when rectifying fails", async () => {
		const { scanned, engineDocument } = await fakeScannedDocument(true);
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const original = await png(400, 300);

		const uid = await scanned.add(original, "camera", BOUNDARY);

		expect(engineDocument.imageOf(uid)).toBe(original);
		expect((await scanned.recordOf(uid)).boundary).toEqual(wholePage(400, 300));
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining("could not be rectified"),
			expect.any(Error),
		);
	});

	it("rectifies a page to a new boundary from its original", async () => {
		const { scanned, engineDocument, rectify, rectified } = await fakeScannedDocument();
		const original = await png(400, 300);
		const uid = await scanned.add(original, "camera", null);

		// It returns the boundary the page had, for undo.
		expect(await scanned.setBoundary(uid, BOUNDARY)).toEqual(wholePage(400, 300));

		expect(rectify).toHaveBeenCalledWith(original, BOUNDARY);
		expect(engineDocument.imageOf(uid)).toBe(rectified);
		const record: PageRecord = await scanned.recordOf(uid);
		expect(record).toEqual({
			origin: "camera",
			original,
			width: 400,
			height: 300,
			boundary: BOUNDARY,
			filter: "none",
		});
	});

	it("leaves a page unmodified when given the boundary it already has", async () => {
		const { scanned, engineDocument, rectify } = await fakeScannedDocument();
		const uid = await scanned.add(await png(400, 300), "camera", BOUNDARY);
		rectify.mockClear();

		const whole = await scanned.add(await png(400, 300), "camera", null);
		const changes = [
			await scanned.setBoundary(uid, BOUNDARY),
			await scanned.setBoundary(whole, null),
			await scanned.setBoundary(whole, wholePage(400, 300)),
		];

		expect(changes).toEqual([undefined, undefined, undefined]);
		expect(rectify).not.toHaveBeenCalled();
		expect(engineDocument.updatePage).not.toHaveBeenCalled();
	});

	it("puts the original back for the whole page, without rectifying", async () => {
		const { scanned, engineDocument, rectify } = await fakeScannedDocument();
		const original = await png(400, 300);
		const uid = await scanned.add(original, "camera", BOUNDARY);
		rectify.mockClear();

		await scanned.setBoundary(uid, null);

		expect(rectify).not.toHaveBeenCalled();
		expect(engineDocument.imageOf(uid)).toBe(original);
		expect((await scanned.recordOf(uid)).boundary).toEqual(wholePage(400, 300));
	});

	it("leaves a page unmodified when rectifying fails", async () => {
		const { scanned, engineDocument, rectify } = await fakeScannedDocument();
		const original = await png(400, 300);
		const uid = await scanned.add(original, "camera", null);
		rectify.mockRejectedValueOnce(new Error("The engine could not rectify the page"));

		await expect(scanned.setBoundary(uid, BOUNDARY)).rejects.toThrow("could not rectify");

		expect(engineDocument.imageOf(uid)).toBe(original);
		expect((await scanned.recordOf(uid)).boundary).toEqual(wholePage(400, 300));
	});

	it("filters a page from its rectified image", async () => {
		const { scanned, engineDocument, rectified } = await fakeScannedDocument();
		const uid = await scanned.add(await png(400, 300), "camera", BOUNDARY);

		expect(await scanned.setFilter(uid, "gray")).toBe("none");

		expect(engineDocument.imageOf(uid)).toMatchObject({ source: rectified, filter: "gray" });
		expect((await scanned.recordOf(uid)).filter).toBe("gray");
	});

	it("shows the rectified image again, unfiltered, for no filter", async () => {
		const { scanned, engineDocument, rectified, filterImage } = await fakeScannedDocument();
		const uid = await scanned.add(await png(400, 300), "camera", BOUNDARY);
		await scanned.setFilter(uid, "gray");
		filterImage.mockClear();

		expect(await scanned.setFilter(uid, "none")).toBe("gray");

		expect(filterImage).not.toHaveBeenCalled();
		expect(engineDocument.imageOf(uid)).toBe(rectified);
	});

	it("leaves a page unmodified when given the filter it already has", async () => {
		const { scanned, engineDocument, filterImage } = await fakeScannedDocument();
		const uid = await scanned.add(await png(400, 300), "camera", BOUNDARY);
		await scanned.setFilter(uid, "gray");
		engineDocument.updatePage.mockClear();
		filterImage.mockClear();

		expect(await scanned.setFilter(uid, "gray")).toBeUndefined();

		expect(filterImage).not.toHaveBeenCalled();
		expect(engineDocument.updatePage).not.toHaveBeenCalled();
	});

	it("keeps a page's filter through a new boundary", async () => {
		const { scanned, engineDocument, rectified } = await fakeScannedDocument();
		const original = await png(400, 300);
		const uid = await scanned.add(original, "camera", BOUNDARY);
		await scanned.setFilter(uid, "saveInk");

		await scanned.setBoundary(uid, null);
		expect(engineDocument.imageOf(uid)).toMatchObject({ source: original, filter: "saveInk" });
		await scanned.setBoundary(uid, BOUNDARY);
		expect(engineDocument.imageOf(uid)).toMatchObject({ source: rectified, filter: "saveInk" });
	});

	it("leaves a page unmodified when filtering fails", async () => {
		const { scanned, engineDocument, rectified, filterImage } = await fakeScannedDocument();
		const uid = await scanned.add(await png(400, 300), "camera", BOUNDARY);
		filterImage.mockRejectedValueOnce(new Error("The engine could not filter the page"));

		await expect(scanned.setFilter(uid, "gray")).rejects.toThrow("could not filter");

		expect(engineDocument.imageOf(uid)).toBe(rectified);
		expect((await scanned.recordOf(uid)).filter).toBe("none");
	});

	it("previews a page under each filter, from one small copy of its rectified image", async () => {
		const { scanned } = await fakeScannedDocument();
		const uid = await scanned.add(await png(400, 300), "camera", BOUNDARY);
		await scanned.setFilter(uid, "gray");

		const previews = await scanned.previews(uid, ["none", "enhance"], 60);

		const small = previews.get("none")!;
		// The fake rectifies to 300 by 200.
		expect(await imageSize(small)).toEqual({ width: 60, height: 40 });
		expect(previews.get("enhance")).toMatchObject({ source: small, filter: "enhance" });
		expect([...previews.keys()]).toEqual(["none", "enhance"]);
	});

	it("rectifies a page once for all the filters chosen after it was added", async () => {
		const { scanned, rectify } = await fakeScannedDocument();
		const uid = await scanned.add(await png(400, 300), "camera", BOUNDARY);
		await scanned.setFilter(uid, "gray");
		await scanned.setFilter(uid, "enhance");
		expect(rectify).toHaveBeenCalledOnce();
	});

	it("leaves out and reports a preview that fails", async () => {
		const { scanned, filterImage } = await fakeScannedDocument();
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const uid = await scanned.add(await png(400, 300), "camera", BOUNDARY);
		filterImage.mockRejectedValueOnce(new Error("The engine could not filter the page"));

		const previews = await scanned.previews(uid, ["gray", "enhance"], 60);

		expect([...previews.keys()]).toEqual(["enhance"]);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("gray"), expect.any(Error));
	});

	it("rectifies again for a boundary other than the last one", async () => {
		const { scanned, rectify } = await fakeScannedDocument();
		const uid = await scanned.add(await png(400, 300), "camera", BOUNDARY);
		const other: Quadrilateral = {
			points: [
				{ x: 10, y: 10 },
				{ x: 390, y: 10 },
				{ x: 390, y: 290 },
				{ x: 10, y: 290 },
			],
		};
		await scanned.setBoundary(uid, other);
		expect(rectify).toHaveBeenCalledTimes(2);
	});

	it("rectifies again after a rectification that failed", async () => {
		const { scanned, rectify } = await fakeScannedDocument();
		const uid = await scanned.add(await png(400, 300), "camera", null);
		rectify.mockRejectedValueOnce(new Error("The engine could not rectify the page"));
		await expect(scanned.setBoundary(uid, BOUNDARY)).rejects.toThrow("could not rectify");
		await scanned.setBoundary(uid, BOUNDARY);
		expect((await scanned.recordOf(uid)).boundary).toEqual(BOUNDARY);
	});

	it("keeps the last rectification when an earlier one fails after it", async () => {
		const { scanned, rectify } = await fakeScannedDocument();
		const first = await scanned.add(await png(400, 300), "camera", null);
		const second = await scanned.add(await png(400, 300), "camera", null);
		let fail = (_reason: Error): void => undefined;
		rectify.mockImplementationOnce(() => new Promise((_, reject) => (fail = reject)));
		const failing = scanned.setBoundary(first, BOUNDARY);
		await scanned.setBoundary(second, BOUNDARY);
		fail(new Error("The engine could not rectify the page"));
		await expect(failing).rejects.toThrow("could not rectify");
		await scanned.previews(second, ["none"], 60);
		expect(rectify).toHaveBeenCalledTimes(2);
	});

	it("uses the loaded image as the original of a page the document scanner did not add, until its boundary is set", async () => {
		const { scanned, engineDocument, rectify } = await fakeScannedDocument();
		const image = await png(400, 300);
		const [uid] = await engineDocument.loadSource(image);

		expect(await scanned.recordOf(uid!)).toEqual({
			origin: "file",
			original: image,
			width: 400,
			height: 300,
			boundary: wholePage(400, 300),
			filter: "none",
		});
		await scanned.setBoundary(uid!, BOUNDARY);
		expect(rectify).toHaveBeenCalledWith(image, BOUNDARY);
		expect(await scanned.recordOf(uid!)).toMatchObject({ original: image, boundary: BOUNDARY });
	});

	it("ignores custom data that the document scanner did not write", async () => {
		const { scanned, engineDocument } = await fakeScannedDocument();
		const image = await png(400, 300);
		const uid = await scanned.add(image, "camera", null);

		await engineDocument.setPageCustomData(uid, { origin: "camera", note: "someone else's" });
		expect(await scanned.recordOf(uid)).toMatchObject({ origin: "file", original: image });
		await engineDocument.setPageCustomData(uid, null);
		expect(await scanned.recordOf(uid)).toMatchObject({ origin: "file", original: image });
	});

	it("rejects when Document Viewer loads no page from the image", async () => {
		const { scanned, engineDocument } = await fakeScannedDocument();
		engineDocument.loadSource.mockResolvedValueOnce([]);
		await expect(scanned.add(await png(40, 30), "camera", null)).rejects.toThrow(
			"could not be added",
		);
	});

	it("reports its uid, its page count, and its last page", async () => {
		const { scanned } = await fakeScannedDocument();
		expect(scanned.uid).toBe("document");
		expect(scanned.engineUids).toEqual(["document", "aside"]);
		expect([scanned.pageCount, scanned.lastPageUid]).toEqual([0, undefined]);
		await scanned.add(await png(40, 30), "camera", null);
		const second = await scanned.add(await png(40, 30), "camera", null);
		expect([scanned.pageCount, scanned.lastPageUid]).toEqual([2, second]);
	});

	it("removes pages by uid or all at once", async () => {
		const { scanned } = await fakeScannedDocument();
		const first = await scanned.add(await png(40, 30), "camera", null);
		const second = await scanned.add(await png(40, 30), "camera", null);

		scanned.remove(second);
		scanned.remove("a uid not in the document");
		expect([scanned.pageCount, scanned.lastPageUid]).toEqual([1, first]);
		scanned.clear();
		expect(scanned.pageCount).toBe(0);
	});

	it("sets a page aside and puts it back where it was, with its record", async () => {
		const { scanned, aside } = await fakeScannedDocument();
		const original = await png(40, 30);
		const pages = [
			await scanned.add(original, "camera", null),
			await scanned.add(await png(40, 30), "camera", null),
			await scanned.add(await png(40, 30), "camera", null),
		];
		const record = await scanned.recordOf(pages[0]!);

		expect(scanned.setAside(pages[0]!)).toBe(0);
		expect([aside.pages, scanned.pageCount]).toEqual([[pages[0]], 2]);
		scanned.putBack(pages[0]!, 0);

		expect(aside.pages).toEqual([]);
		expect(await scanned.snapshot().then((all) => all.map((page) => page.id))).toEqual(pages);
		expect(await scanned.recordOf(pages[0]!)).toEqual(record);
	});

	it("drops the pages set aside, also when it clears every page", async () => {
		const { scanned, aside } = await fakeScannedDocument();
		const first = await scanned.add(await png(40, 30), "camera", null);
		const second = await scanned.add(await png(40, 30), "camera", null);
		scanned.setAside(first);
		scanned.dropAside();
		expect(aside.pages).toEqual([]);
		scanned.setAside(second);
		scanned.clear();
		expect(aside.pages).toEqual([]);
	});

	it("puts its pages in any order given", async () => {
		const { scanned, engineDocument } = await fakeScannedDocument();
		const pages: string[] = [];
		for (let page = 0; page < 5; page++) {
			pages.push(await scanned.add(await png(40, 30), "camera", null));
		}
		expect(scanned.order).toEqual(pages);
		// Random orders from a fixed seed, so that each run tests the same orders.
		let seed = 1;
		const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
		for (let trial = 0; trial < 200; trial++) {
			const order = [...pages].sort(() => random() - 0.5);
			scanned.arrange(order);
			expect(engineDocument.pages).toEqual(order);
		}
	});

	it("throws when a page cannot move between documents", async () => {
		const { scanned } = await fakeScannedDocument();
		expect(() => scanned.setAside("missing")).toThrow("The document has no page missing");
		expect(() => scanned.putBack("missing", 0)).toThrow("The document has no page missing");
		const stuck = (await fakeScannedDocument(false, true)).scanned;
		const uid = await stuck.add(await png(40, 30), "camera", null);
		expect(() => stuck.setAside(uid)).toThrow("The page could not be moved between documents");
	});

	it("reads a page's rotation from the document", async () => {
		const { scanned, engineDocument } = await fakeScannedDocument();
		const uid = await scanned.add(await png(40, 30), "camera", null);
		expect(scanned.rotationOf(uid)).toBe(0);
		engineDocument.setRotation(uid, 270);
		expect(scanned.rotationOf(uid)).toBe(270);
	});

	it("reads one page as a ScannedPage, with its index in the document", async () => {
		const { scanned } = await fakeScannedDocument();
		await scanned.add(await png(40, 30), "camera", null);
		const second = await scanned.add(await png(40, 30), "file", null);
		expect(await scanned.page(second)).toMatchObject({ id: second, index: 1, origin: "file" });
	});

	it("reads a page's thumbnail from the document", async () => {
		const { scanned, engineDocument } = await fakeScannedDocument();
		const uid = await scanned.add(await png(40, 30), "camera", null);
		expect(await scanned.thumbnail(uid)).toBe(engineDocument.imageOf(uid));
	});

	it("reports each page's sizes in pixels, the processed one as Document Viewer shows the page", async () => {
		const { scanned, engineDocument } = await fakeScannedDocument();
		const original = await png(400, 300);
		const rectifiedUid = await scanned.add(original, "camera", BOUNDARY);
		const turned = await scanned.add(await png(400, 300), "file", null);
		engineDocument.setShownSize(turned, 300, 400);

		const [first, second] = await scanned.snapshot();

		expect(first).toMatchObject({
			id: rectifiedUid,
			index: 0,
			origin: "camera",
			original: { kind: "raster", width: 400, height: 300 },
			processed: { kind: "raster", width: 300, height: 200 },
			boundary: BOUNDARY,
		});
		expect(second).toMatchObject({
			id: turned,
			index: 1,
			origin: "file",
			original: { width: 400, height: 300 },
			processed: { width: 300, height: 400 },
			boundary: wholePage(400, 300),
		});
		expect(await first?.original.toBlob()).toBe(original);
		expect((await first?.original.toBlob({ encoding: "jpeg", quality: 0.5 }))?.type).toBe(
			"image/jpeg",
		);
		expect((await first?.original.toBlob({ encoding: "png" }))?.type).toBe("image/png");
		expect((await first?.original.toCanvas())?.width).toBe(400);
		expect((await first?.original.toCanvas({ scale: 0.5 }))?.width).toBe(200);
	});

	it("encodes a page at its current position until it is removed", async () => {
		const { scanned, engineDocument } = await fakeScannedDocument();
		await scanned.add(await png(40, 30), "camera", null);
		const second = await scanned.add(await png(40, 30), "camera", null);
		const [, page] = await scanned.snapshot();
		scanned.remove(engineDocument.pages[0]!);

		await page?.processed.toBlob();
		await page?.processed.toBlob({ encoding: "jpeg", quality: 0.8 });
		await page?.processed.toBlob({ encoding: "jpeg" });

		expect(engineDocument.saveToPng).toHaveBeenCalledWith(0);
		expect(engineDocument.saveToJpeg).toHaveBeenNthCalledWith(1, 0, { quality: 80 });
		expect(engineDocument.saveToJpeg).toHaveBeenNthCalledWith(2, 0, { quality: undefined });
		scanned.remove(second);
		await expect(page!.processed.toBlob()).rejects.toThrow("deleted");
	});

	it("encodes the document in the format that `output` names", async () => {
		const { scanned, engineDocument } = await fakeScannedDocument();
		await scanned.add(await png(40, 30), "camera", null);
		await scanned.add(await png(40, 30), "camera", null);

		expect(await scanned.export(undefined)).toBeUndefined();
		expect(await scanned.export({ format: "pdf" })).toMatchObject({
			format: "pdf",
			document: { type: "application/pdf" },
		});
		expect(await scanned.export({ format: "tiff" })).toMatchObject({
			format: "tiff",
			document: { type: "image/tiff" },
		});
		expect(
			await scanned.export({ format: "images", encoding: "jpeg", quality: 0.5 }),
		).toMatchObject({
			format: "images",
			images: [{ type: "image/jpeg" }, { type: "image/jpeg" }],
		});
		expect(engineDocument.saveToJpeg.mock.calls).toEqual([
			[0, { quality: 50 }],
			[1, { quality: 50 }],
		]);
	});
});

import type {
	IPaginationChangedEvent,
	IQuadModifiedEvent,
	Quad,
	SavePdfSettings,
} from "dynamsoft-document-viewer";
import { beforeAll, describe, expect, expectTypeOf, it } from "vite-plus/test";
import { loadTestEngines } from "../../tests/engines";

// What the document scanner relies on Document Viewer to do, checked against the real
// engine, loaded with Capture Vision as the document scanner loads them.

type DocumentViewer = (typeof import("dynamsoft-document-viewer"))["DDV"];

let DDV: DocumentViewer;

beforeAll(async () => {
	({ documentViewer: DDV } = await loadTestEngines());
});

function photograph(width: number, height: number): Promise<Blob> {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg"));
}

/**
 * Open a perspective viewer on a new document. Its container needs a size for the
 * viewer to lay out.
 */
function perspectiveViewer() {
	const container = document.createElement("div");
	container.style.cssText = "width: 400px; height: 600px;";
	document.body.append(container);
	const document_ = DDV.documentManager.createDocument();
	const viewer = new DDV.PerspectiveViewer({ container });
	viewer.openDocument(document_);
	return {
		viewer,
		document: document_,
		dispose: () => {
			viewer.destroy();
			DDV.documentManager.deleteDocuments([document_.uid]);
			container.remove();
		},
	};
}

describe("types the document scanner relies on", () => {
	it("reports pagination in the fields DocumentState will read", () => {
		expectTypeOf<IPaginationChangedEvent>().toHaveProperty("pageCount").toBeNumber();
		expectTypeOf<IPaginationChangedEvent>().toHaveProperty("currentPageNumber").toBeNumber();
	});

	it("lets an export choose what happens to annotations", () => {
		expectTypeOf<SavePdfSettings>().toHaveProperty("saveAnnotation");
	});
});

describe("replacing a page's image", () => {
	it("keeps the page's uid, position, and custom data but not its rotation", async () => {
		const { viewer, document: document_, dispose } = perspectiveViewer();
		try {
			const [first] = await document_.loadSource(await photograph(1600, 1200));
			const [second] = await document_.loadSource(await photograph(800, 600));
			const record = { original: await photograph(1600, 1200), note: "kept" };
			await document_.setPageCustomData(first!, record);
			viewer.rotate(90, [0]);
			const rotated = document_.getPageData(first!);
			expect(rotated.rotation).toBe(90);
			rotated.destroy();

			expect(await document_.updatePage(first!, { fileData: await photograph(952, 747) })).toBe(
				true,
			);

			expect(document_.pages).toEqual([first, second]);
			const replaced = document_.getPageData(first!);
			expect(replaced.rotation).toBe(0);
			expect((await replaced.raw()).width).toBe(952);
			replaced.destroy();
			const kept = await document_.getPageCustomData(first!);
			expect(kept.note).toBe("kept");
			expect(kept.original).toBe(record.original);
		} finally {
			dispose();
		}
	});
});

describe("page sizes", () => {
	it("give the size of a turned and cropped page apart from its loaded image", async () => {
		const container = document.createElement("div");
		container.style.cssText = "width: 400px; height: 600px;";
		document.body.append(container);
		const document_ = DDV.documentManager.createDocument();
		const viewer = new DDV.EditViewer({ container });
		viewer.openDocument(document_);
		try {
			const [uid] = await document_.loadSource(await photograph(1600, 1200));
			viewer.rotate(90, [0]);
			viewer.crop({ left: 100, top: 50, width: 800, height: 600 }, [0]);

			const page = document_.getPageData(uid!);
			const shown = await page.display();
			expect([shown.width, shown.height]).toEqual([1067, 800]);
			expect([page.mediaBox.width, page.mediaBox.height]).toEqual([1200, 900]);
			// The document scanner takes this image as the original of a page it did
			// not add.
			const raw = await page.raw();
			expect([raw.width, raw.height]).toEqual([1600, 1200]);
			const loaded = await createImageBitmap(raw.data);
			expect([loaded.width, loaded.height]).toEqual([1600, 1200]);
			loaded.close();
			page.destroy();
			const exported = await createImageBitmap(await document_.saveToPng(0));
			expect([exported.width, exported.height]).toEqual([1067, 800]);
			exported.close();
		} finally {
			viewer.destroy();
			DDV.documentManager.deleteDocuments([document_.uid]);
			container.remove();
		}
	});
});

describe("page custom data", () => {
	it("copies plain values but keeps a blob by reference", async () => {
		const document_ = DDV.documentManager.createDocument();
		try {
			const [uid] = await document_.loadSource(await photograph(100, 100));
			const blob = await photograph(10, 10);
			const record = { size: { width: 1600 }, original: blob };
			await document_.setPageCustomData(uid!, record);
			record.size.width = 1;
			const first = await document_.getPageCustomData(uid!);
			expect(first.size.width).toBe(1600);
			expect(first.original).toBe(blob);
			first.size.width = 2;
			expect((await document_.getPageCustomData(uid!)).size.width).toBe(1600);
		} finally {
			DDV.documentManager.deleteDocuments([document_.uid]);
		}
	});
});

describe("the perspective viewer", () => {
	it("takes and gives a quad selection in the page's own pixels", async () => {
		const { viewer, document: document_, dispose } = perspectiveViewer();
		try {
			await document_.loadSource(await photograph(1600, 1200));
			viewer.goToPage(0);
			const quad: [[number, number], [number, number], [number, number], [number, number]] = [
				[300, 200],
				[1300, 260],
				[1250, 1000],
				[350, 950],
			];
			expect(viewer.setQuadSelection(quad)).toBe(true);
			expect(viewer.getQuadSelection()).toEqual(quad);
		} finally {
			dispose();
		}
	});

	it("reports each change of the quad selection once, inside the call that makes it", async () => {
		const { viewer, document: document_, dispose } = perspectiveViewer();
		try {
			await document_.loadSource(await photograph(1600, 1200));
			viewer.goToPage(0);
			const first: Quad = [
				[300, 200],
				[1300, 260],
				[1250, 1000],
				[350, 950],
			];
			viewer.setQuadSelection(first);
			const events: IQuadModifiedEvent[] = [];
			viewer.on("quadModified", (event) => events.push(event));
			const second: Quad = [
				[100, 100],
				[1500, 100],
				[1500, 1100],
				[100, 1100],
			];
			viewer.setQuadSelection(second);
			expect(events).toEqual([{ oldQuad: first, newQuad: second }]);
			viewer.setQuadSelection(second);
			expect(events).toHaveLength(1);
			viewer.resetQuadSelection();
			expect(events.slice(1)).toEqual([
				{
					oldQuad: second,
					newQuad: [
						[0, 0],
						[1600, 0],
						[1600, 1200],
						[0, 1200],
					],
				},
			]);
		} finally {
			dispose();
		}
	});
});

describe("the edit viewer", () => {
	it("reports the page number and the page count as pages come and go", async () => {
		const container = document.createElement("div");
		container.style.cssText = "width: 400px; height: 600px;";
		document.body.append(container);
		const document_ = DDV.documentManager.createDocument();
		const aside = DDV.documentManager.createDocument();
		const viewer = new DDV.EditViewer({ container, uiConfig: { type: DDV.Elements.MainView } });
		const pages: [number, number][] = [];
		viewer.on("paginationChanged", (event) =>
			pages.push([event.currentPageNumber, event.pageCount]),
		);
		try {
			viewer.openDocument(document_.uid);
			await document_.loadSource(await photograph(1600, 1200));
			await document_.loadSource(await photograph(800, 600));
			viewer.goToPage(1);
			expect(pages).toEqual([
				[1, 1],
				[1, 2],
				[2, 2],
			]);
			const move = (from: string, to: string, insertBeforeIndex?: number) =>
				DDV.documentManager.movePagesToDocument(from, to, {
					sourceIndices: [0],
					insertBeforeIndex,
					includeAnnotations: true,
				});
			// A page set aside and put back, as a delete and its undo do.
			move(document_.uid, aside.uid);
			move(aside.uid, document_.uid, 0);
			// The page showing stays the one that was showing.
			expect(pages.slice(3)).toEqual([
				[1, 1],
				[2, 2],
			]);
		} finally {
			viewer.destroy();
			DDV.documentManager.deleteDocuments([document_.uid, aside.uid]);
			container.remove();
		}
	});
});

describe("moving pages", () => {
	it("keeps a page's uid, custom data, and rotation through a round trip to another document", async () => {
		const container = document.createElement("div");
		container.style.cssText = "width: 400px; height: 600px;";
		document.body.append(container);
		const pages = DDV.documentManager.createDocument();
		const aside = DDV.documentManager.createDocument();
		const viewer = new DDV.EditViewer({ container, uiConfig: { type: DDV.Elements.MainView } });
		try {
			viewer.openDocument(pages.uid);
			const [first] = await pages.loadSource(await photograph(1600, 1200));
			const [second] = await pages.loadSource(await photograph(800, 600));
			const original = await photograph(10, 10);
			await pages.setPageCustomData(second!, { note: "kept", original });
			viewer.rotate(90, [1]);
			const options = { includeAnnotations: true };
			expect(
				DDV.documentManager.movePagesToDocument(pages.uid, aside.uid, {
					...options,
					sourceIndices: [1],
				}),
			).toBe(true);
			expect([pages.pages, aside.pages]).toEqual([[first], [second]]);
			DDV.documentManager.movePagesToDocument(aside.uid, pages.uid, {
				...options,
				sourceIndices: [0],
				insertBeforeIndex: 0,
			});
			expect(pages.pages).toEqual([second, first]);
			const record = await pages.getPageCustomData(second!);
			expect([record.note, record.original]).toEqual(["kept", original]);
			const page = pages.getPageData(second!);
			expect(page.rotation).toBe(90);
			page.destroy();
		} finally {
			viewer.destroy();
			DDV.documentManager.deleteDocuments([pages.uid, aside.uid]);
			container.remove();
		}
	});

	it("counts the target of a move within a document in the order before the move", async () => {
		const pages = DDV.documentManager.createDocument();
		try {
			const uids = [];
			for (let page = 0; page < 3; page++)
				uids.push(...(await pages.loadSource(await photograph(40, 30))));
			const [a, b, c] = uids;
			pages.movePages([0], 2);
			expect(pages.pages).toEqual([b, a, c]);
			pages.movePages([2], 0);
			expect(pages.pages).toEqual([c, b, a]);
		} finally {
			DDV.documentManager.deleteDocuments([pages.uid]);
		}
	});
});

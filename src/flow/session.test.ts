import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { TAKEN_IMAGE, endFakeSessions, fakeSession, newContainer } from "../../tests/fake-session";
import type { Faults } from "../../tests/fake-session";
import { ScannerFault } from "../faults";
import type { PhaseName } from "../results";
import { resolveSettings } from "../settings/settings";
import type { ScannerSettings } from "../settings/settings";
import type { FilterName } from "../settings/filters";
import type { ScanResult, ScannedPages } from "../results";
import type { EditPress } from "../phases/edit-screen";
import type { OverlaySpec } from "../ui/overlay";
import { CapturePhase } from "../phases/capture";
import { defaultContainer } from "./containers";
import { Session } from "./session";

// The moves between the capture, rectify, and edit screens, over fake phases and a
// fake document.

/** With the after-capture screen off, a page taken goes straight in. */
/** The button settings of the capture screen. */
type CaptureButtons = NonNullable<
	NonNullable<NonNullable<ScannerSettings["phases"]>["capture"]>["buttons"]
>;

const NO_REVIEW: ScannerSettings = { phases: { rectify: { modes: { afterCapture: false } } } };

/** The result of a completed scan of the fake document's pages, by uid. */
function succeeded(...uids: string[]): ScanResult {
	const pages = uids.map((uid) => ({ uid })) as unknown as ScannedPages;
	return { status: "success", pages, output: undefined };
}

afterEach(() => {
	endFakeSessions();
	vi.restoreAllMocks();
});

/** Wait one task, so the moves a press started can finish. */
function nextTask(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve));
}

/** An image file that the browser can open. */
async function imageFile(): Promise<File> {
	const canvas = document.createElement("canvas");
	canvas.width = 40;
	canvas.height = 30;
	const blob = await new Promise<Blob>((done) => canvas.toBlob((made) => done(made!)));
	return new File([blob], "page.png", { type: "image/png" });
}

/**
 * An image that the browser cannot read, as a new image is once the browser's
 * memory for blobs is full.
 */
function unreadableImage(): Blob {
	return new (class extends Blob {
		override slice(): Blob {
			return this;
		}
		override arrayBuffer(): Promise<ArrayBuffer> {
			return Promise.reject(new DOMException("The blob could not be read", "NotReadableError"));
		}
	})();
}

/**
 * Choose an image file on the capture screen, and wait until the session looks for
 * the page on it. A camera page arrives with its boundary, so only a file waits
 * for detection in the session.
 */
async function chooseFile(scan: ReturnType<typeof fakeSession>): Promise<void> {
	await settle(() => scan.capture("loadImage"));
	scan.pickFile(await imageFile());
	await vi.waitFor(() => expect(scan.calls).toContain("findBoundary"));
}

/** The pages the edit screen showed since the calls were last taken, in order. */
function shownPages(scan: { takeCalls(): string[] }): string[] {
	return scan
		.takeCalls()
		.filter((call) => call.startsWith("edit.showPage "))
		.map((call) => call.slice("edit.showPage ".length));
}

/**
 * Start a session over `NO_REVIEW`, or over `options.settings`, with `options`, store
 * `taken` pages, open the edit screen, and take the calls so far.
 */
async function openEdit(options: Parameters<typeof fakeSession>[0] = {}, taken = 0) {
	const scan = fakeSession({ settings: NO_REVIEW, ...options });
	await scan.session.start();
	for (let page = 0; page < taken; page++) await scan.store(TAKEN_IMAGE);
	await settle(() => scan.capture("thumbnail"));
	scan.takeCalls();
	return scan;
}

/** Start a session with `buttons` as the capture screen's button settings, and take the calls so far. */
async function withCaptureButtons(buttons: CaptureButtons) {
	const scan = fakeSession({ settings: { phases: { capture: { buttons } } } });
	await scan.session.start();
	scan.takeCalls();
	return scan;
}

/** Run `act`, such as a press, and let what it starts settle for one task. */
async function settle(act: () => void): Promise<void> {
	act();
	await nextTask();
}

/** Press a button on the edit screen, or choose a filter, and let the action finish. */
async function press(
	scan: ReturnType<typeof fakeSession>,
	pressed: EditPress["button"] | { readonly filter: FilterName },
) {
	if (typeof pressed === "string") scan.edit(pressed);
	else scan.chooseFilter(pressed.filter);
	await nextTask();
}

/** Silence the console warning a reported fault gives, and return its spy. */
function silenceFaults() {
	return vi.spyOn(console, "warn").mockImplementation(() => undefined);
}

describe("start()", () => {
	it("shows the capture screen before its mount finishes", async () => {
		const scan = fakeSession({ held: ["capture.mount"] });
		const started = scan.session.start();
		await nextTask();
		expect(scan.shown()).toBe("capture");
		scan.finish("capture.mount");
		await started;
	});

	it("puts the screen inside the session's .mds-scanner element", async () => {
		const scan = fakeSession({ containers: { capture: defaultContainer() } });
		await scan.session.start();
		expect(document.querySelector("body > .mds-scanner > .mds-screen-capture")).not.toBeNull();
		expect(document.querySelector("body > .mds-screen")).toBeNull();
	});
});

describe("capture", () => {
	it("drops a page still being added when the session is cancelled", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, held: ["document.add"] });
		await scan.session.start();
		const stored = scan.store(TAKEN_IMAGE);
		// Past finding its edges, and into the document.
		await nextTask();
		scan.capture("cancel");
		scan.finish("document.add");
		await stored;
		expect(scan.pages()).toEqual([]);
		expect(scan.calls).toContain("document.remove page1");
		expect(scan.ended).toEqual([{ status: "cancelled" }]);
	});

	it("keeps a page still being added when the session fails", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, held: ["document.add"] });
		await scan.session.start();
		const stored = scan.store(TAKEN_IMAGE);
		// Past finding its edges, and into the document.
		await nextTask();
		scan.session.end({ status: "failed", error: { kind: "internal", message: "broken" } });
		scan.finish("document.add");
		await stored;
		expect(scan.pages()).toEqual(["page1"]);
	});

	it("still adds an image file when the session fails while its edges are found", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, held: ["findBoundary"] });
		await scan.session.start();
		await chooseFile(scan);
		scan.session.end({ status: "failed", error: { kind: "internal", message: "broken" } });
		scan.finish("findBoundary");
		await vi.waitFor(() => expect(scan.pages()).toEqual(["page1"]));
	});

	it("stores nothing when the session is cancelled while an image file's edges are found", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, held: ["findBoundary"] });
		await scan.session.start();
		await chooseFile(scan);
		scan.capture("cancel");
		scan.finish("findBoundary");
		await nextTask();
		await nextTask();
		expect(scan.pages()).toEqual([]);
		expect(scan.calls.filter((call) => call.startsWith("document.add"))).toEqual([]);
	});

	it("opens the rectify screen on a page just taken before it adds the page", async () => {
		const scan = fakeSession();
		await scan.session.start();
		scan.takeCalls();
		await scan.store(TAKEN_IMAGE);
		expect(scan.calls).toEqual([
			"capture.unmount",
			"rectify.mount afterCapture on the page taken with the boundary found",
		]);
		expect(scan.pages()).toEqual([]);
		expect(scan.shown()).toBe("rectify");
	});

	it("keeps a page just taken and stays on the capture screen with the after-capture screen off", async () => {
		const scan = fakeSession({ settings: NO_REVIEW });
		await scan.session.start();
		scan.takeCalls();
		await scan.store(TAKEN_IMAGE);
		expect(scan.calls).toEqual(["document.add page1 with the boundary found"]);
		expect(scan.shown()).toBe("capture");
	});

	it("adds a page whose photograph arrives after the session began to finish", async () => {
		const scan = fakeSession({
			settings: { phases: { edit: false, rectify: { modes: { afterCapture: false } } } },
			held: ["capture.pageHandedOver"],
		});
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await settle(() => scan.capture("thumbnail"));
		// The photograph arrives after the thumbnail began the finish.
		const stored = scan.store(TAKEN_IMAGE);
		scan.finish("capture.pageHandedOver");
		await stored;
		await nextTask();
		expect(scan.pages()).toEqual(["page1", "page2"]);
		expect(scan.calls).toContain("document.snapshot page1 page2");
		expect(scan.ended).toEqual([succeeded("page1", "page2")]);
	});

	it("asks before cancel drops the pages, then ends the session as cancelled", async () => {
		const scan = fakeSession({ settings: NO_REVIEW });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		scan.takeCalls();
		scan.capture("cancel");
		expect(scan.notices).toEqual(["discardConfirmation"]);
		expect(scan.ended).toEqual([]);
		scan.answer("discardConfirmation", "Discard");
		expect(scan.calls).toEqual(expect.arrayContaining(["document.clear", "document.dropAside"]));
		expect(scan.ended).toEqual([{ status: "cancelled" }]);
		expect(scan.shown()).toBeNull();
	});
});

describe("while the engines load", () => {
	it("finishes only once the engines have loaded", async () => {
		const scan = fakeSession({ loadLater: true, pagesKept: 1 });
		void scan.session.start();
		const finishing = scan.session.finish();
		await nextTask();
		expect(scan.ended).toEqual([]);
		scan.finishLoading();
		await finishing;
		expect(scan.ended).toEqual([succeeded("page1")]);
	});

	it("passes the failure to finish() when the engines fail to load", async () => {
		silenceFaults();
		const scan = fakeSession({ loadLater: true });
		void scan.session.start();
		const finishing = scan.session.finish();
		scan.failLoading();
		await expect(finishing).rejects.toThrow("the engines could not load");
		expect(scan.ended).toMatchObject([{ status: "failed" }]);
	});
});

describe("over the real capture phase before the engines load", () => {
	/**
	 * A session over a real capture phase, both waiting on `engines`. Each end is
	 * logged with whether the capture screen was still on the page, and each overlay
	 * the session presents is kept.
	 */
	function sessionOver(engines: Promise<never>) {
		const container = newContainer();
		const capture = new CapturePhase(resolveSettings({}), engines);
		const ended: { readonly result: ScanResult; readonly screenUp: boolean }[] = [];
		const presented: OverlaySpec[] = [];
		const session = new Session({
			settings: resolveSettings({}),
			containers: {
				capture: container,
				edit: container,
				rectify: { afterCapture: container, fromEdit: container },
			},
			capture,
			loaded: engines,
			onSuccess: async () => undefined,
			onDocumentChange: () => undefined,
			onNavigate: () => undefined,
			onEnd: (result) =>
				ended.push({ result, screenUp: container.querySelector(".mds-capture") !== null }),
			present: (overlay) => presented.push(overlay),
		});
		return { session, container, ended, presented, capture };
	}

	it("takes the screen down at once when the session is cancelled", async () => {
		const { session, container, ended, capture } = sessionOver(new Promise<never>(() => undefined));
		void session.start();
		await vi.waitFor(() => expect(container.querySelector(".mds-capture")).not.toBeNull());
		session.cancel();
		expect(ended).toEqual([{ result: { status: "cancelled" }, screenUp: false }]);
		await capture.dispose();
	});

	it("takes the screen down before it ends as failed when the engines fail to load", async () => {
		silenceFaults();
		let fail = (_error: Error): void => undefined;
		const engines = new Promise<never>((_resolve, reject) => (fail = reject));
		const { session, container, ended, capture } = sessionOver(engines);
		void session.start();
		await vi.waitFor(() => expect(container.querySelector(".mds-capture")).not.toBeNull());
		fail(new Error("the engines could not load"));
		await vi.waitFor(() => expect(ended).toHaveLength(1));
		expect(ended[0]).toMatchObject({ result: { status: "failed" }, screenUp: false });
		await capture.dispose();
	});

	it("keeps the screen up under the license error until the error closes", async () => {
		const error = { kind: "license", message: "rejected", reason: "rejected" } as const;
		const { session, container, ended, presented, capture } = sessionOver(
			Promise.reject(new ScannerFault(error)),
		);
		await session.start();
		expect(presented.map(({ name }) => name)).toEqual(["licenseError"]);
		expect([ended, container.querySelector(".mds-capture") !== null]).toEqual([[], true]);
		presented[0]?.onClose?.();
		expect(ended).toEqual([{ result: { status: "failed", error }, screenUp: false }]);
		await capture.dispose();
	});

	it("ends as cancelled when the host application cancels while the license error shows", async () => {
		const error = { kind: "license", message: "rejected", reason: "rejected" } as const;
		const { session, ended, presented, capture } = sessionOver(
			Promise.reject(new ScannerFault(error)),
		);
		await session.start();
		session.cancel();
		// The document scanner closes its overlays when the session ends.
		presented[0]?.onClose?.();
		expect(ended).toEqual([{ result: { status: "cancelled" }, screenUp: false }]);
		await capture.dispose();
	});
});

describe("one action at a time", () => {
	it("returns an action only for a press that it takes", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, held: ["capture.takePage"] });
		await scan.session.start();
		scan.capture("shutter");
		const taking = scan.lastAction();
		scan.capture("torch");
		expect(scan.lastAction()).toBeUndefined();
		let ended = false;
		void taking?.then(() => (ended = true));
		await nextTask();
		expect(ended).toBe(false);
		scan.finish("capture.takePage");
		await taking;
		expect(ended).toBe(true);
	});

	it("holds the capture screen's controls off while the screen opens", async () => {
		const scan = fakeSession({ held: ["capture.mount"] });
		const started = scan.session.start();
		// Wait after each press, because the session ignores a press while the one before
		// still runs.
		const press = async () => {
			for (const button of ["shutter", "torch", "autoCapture"] as const) {
				await settle(() => scan.capture(button));
			}
			await settle(() => scan.capture({ button: "cameraSwitcher", camera: "rear" }));
		};
		await press();
		expect([scan.controlsHeld(), scan.takeCalls()]).toEqual([true, ["capture.mount"]]);
		scan.finish("capture.mount");
		await started;
		await press();
		expect([scan.controlsHeld(), scan.takeCalls()]).toEqual([
			false,
			[
				"capture.takePage",
				"capture.toggleTorch",
				"capture.toggleAutoCapture",
				"capture.switchCamera rear",
			],
		]);
	});

	it("holds the capture screen's controls off while the host application closes the session", async () => {
		silenceFaults();
		// The export fails, so the session stays up, and its controls come back.
		const scan = fakeSession({
			held: ["document.export"],
			faults: { export: true },
			pagesKept: 1,
		});
		await scan.session.start();
		const finishing = scan.session.finish();
		expect(scan.controlsHeld()).toBe(true);
		scan.finish("document.export");
		await finishing;
		expect(scan.controlsHeld()).toBe(false);
	});

	it("leaves the hold alone once the session has ended", async () => {
		const scan = fakeSession({ held: ["capture.mount"] });
		const started = scan.session.start();
		scan.capture("cancel");
		scan.takeHolds();
		scan.finish("capture.mount");
		await started;
		expect(scan.takeHolds()).toEqual([]);
	});

	it("ignores a camera switch that fails", async () => {
		const scan = fakeSession({ faults: { switchCamera: true } });
		await scan.session.start();
		scan.capture({ button: "cameraSwitcher", camera: "rear" });
		// An unhandled rejection would fail the test run.
		await nextTask();
		expect([scan.shown(), scan.controlsHeld()]).toEqual(["capture", false]);
	});

	it("lets the capture screen's cancel through while another action runs", async () => {
		const scan = fakeSession({ held: ["capture.unmount"] });
		await scan.session.start();
		scan.capture("thumbnail");
		scan.capture("cancel");
		expect(scan.ended).toEqual([{ status: "cancelled" }]);
		scan.finish("capture.unmount");
		await nextTask();
		expect(scan.calls).not.toContain("edit.mount");
		expect(scan.shown()).toBeNull();
	});

	it("takes Apply again after the page could not be kept", async () => {
		const warn = silenceFaults();
		const scan = fakeSession({ faults: { add: true } });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await settle(() => scan.rectify("apply"));
		await settle(() => scan.rectify("apply"));
		expect(warn).toHaveBeenCalledTimes(2);
		expect(scan.shown()).toBe("rectify");
	});

	it("runs auto-capture's request for a page as an action", async () => {
		const scan = fakeSession({ held: ["capture.takePage"] });
		await scan.session.start();
		scan.takeCalls();
		scan.autoTake();
		await settle(() => scan.capture("torch"));
		expect(scan.calls).toEqual(["capture.takePage"]);
		expect(scan.controlsHeld()).toBe(true);
		scan.finish("capture.takePage");
		await nextTask();
		expect(scan.controlsHeld()).toBe(false);
	});

	it("ignores auto-capture's request for a page while another action runs", async () => {
		const scan = fakeSession({ held: ["capture.takePage"] });
		await scan.session.start();
		scan.takeCalls();
		scan.capture("shutter");
		await settle(() => scan.autoTake());
		expect(scan.calls).toEqual(["capture.takePage"]);
	});
});

describe("the host application's onClick", () => {
	it("runs the handler before the button's default action", async () => {
		let callsWhenClicked: readonly string[] = ["not run"];
		const scan = await withCaptureButtons({
			torch: { onClick: () => void (callsWhenClicked = [...scan.calls]) },
		});
		await settle(() => scan.capture("torch"));
		expect(callsWhenClicked).toEqual([]);
		expect(scan.calls).toEqual(["capture.toggleTorch"]);
	});

	it("skips the default action when the handler calls preventDefault() after an await", async () => {
		let prevented = false;
		const scan = await withCaptureButtons({
			torch: {
				onClick: async (event) => {
					await nextTask();
					event.preventDefault();
					prevented = event.defaultPrevented;
				},
			},
		});
		await settle(() => scan.capture("torch"));
		await nextTask();
		expect([scan.calls, prevented]).toEqual([[], true]);
	});

	it("holds the controls and keeps presses out while the handler runs", async () => {
		let finishClick = (): void => undefined;
		const scan = await withCaptureButtons({
			torch: { onClick: () => new Promise<void>((resolve) => (finishClick = resolve)) },
		});
		scan.capture("torch");
		await settle(() => scan.capture("shutter"));
		expect(scan.calls).toEqual([]);
		expect(scan.controlsHeld()).toBe(true);
		finishClick();
		await nextTask();
		expect(scan.calls).toEqual(["capture.toggleTorch"]);
		expect(scan.controlsHeld()).toBe(false);
	});

	it("skips the default action after a handler that throws only if it prevented the action", async () => {
		const warn = silenceFaults();
		const scan = await withCaptureButtons({
			torch: {
				onClick: () => {
					throw new Error("a bug in the host application");
				},
			},
			shutter: {
				onClick: (event) => {
					event.preventDefault();
					throw new Error("a bug in the host application after preventDefault");
				},
			},
		});
		await settle(() => scan.capture("torch"));
		await settle(() => scan.capture("shutter"));
		expect(scan.calls).toEqual(["capture.toggleTorch"]);
		expect(warn).toHaveBeenCalledTimes(2);
	});

	it("runs the handler of the rectify mode that shows", async () => {
		const events: unknown[] = [];
		const scan = fakeSession({
			settings: {
				phases: {
					rectify: {
						modes: {
							afterCapture: {
								buttons: {
									detectBoundary: {
										onClick: (event) => {
											events.push({ button: event.button, phase: event.phase });
											event.preventDefault();
										},
									},
								},
							},
							fromEdit: {
								buttons: { detectBoundary: { onClick: () => void events.push("fromEdit") } },
							},
						},
					},
				},
			},
		});
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		scan.takeCalls();
		await settle(() => scan.rectify("detectBoundary"));
		expect(events).toEqual([{ button: "detectBoundary", phase: "rectify" }]);
		expect(scan.calls).toEqual([]);
	});
});

describe("rectify after a capture", () => {
	/** Start a session and take a page, so the rectify screen shows it. */
	async function reviewing(faults?: Faults) {
		const scan = fakeSession({ faults });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		scan.takeCalls();
		return scan;
	}

	it("adds the page with the chosen boundary and returns to capture on apply", async () => {
		const scan = await reviewing();
		await settle(() => scan.rectify("apply"));
		expect(scan.calls).toEqual([
			"document.add page1 with the chosen boundary",
			"rectify.unmount",
			"capture.mount",
		]);
		expect(scan.shown()).toBe("capture");
	});

	it("adds nothing and returns to capture on retake", async () => {
		const scan = await reviewing();
		await settle(() => scan.rectify("retake"));
		expect(scan.calls).toEqual(["rectify.unmount", "capture.mount"]);
		expect(scan.pages()).toEqual([]);
		expect(scan.shown()).toBe("capture");
	});

	it("passes undo, detect borders, and full image to the rectify phase without leaving the rectify screen", async () => {
		const scan = await reviewing();
		await settle(() => scan.rectify("undo"));
		await settle(() => scan.rectify("detectBoundary"));
		await settle(() => scan.rectify("fullImage"));
		expect(scan.calls).toEqual(["rectify.undo", "rectify.detectBoundary", "rectify.fullImage"]);
		expect(scan.shown()).toBe("rectify");
	});

	it("holds the rectify controls off while it detects the borders", async () => {
		const scan = fakeSession({ held: ["rectify.detectBoundary"] });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		scan.takeCalls();
		scan.rectify("detectBoundary");
		await settle(() => scan.rectify("apply"));
		expect(scan.calls).toEqual(["rectify.detectBoundary"]);
		expect(scan.rectifyControlsHeld()).toBe(true);
		scan.finish("rectify.detectBoundary");
		await nextTask();
		expect(scan.rectifyControlsHeld()).toBe(false);
		expect(scan.shown()).toBe("rectify");
	});
});

describe("the page limit", () => {
	it("moves on to edit only with the page that fills the document", async () => {
		const scan = fakeSession({ settings: { ...NO_REVIEW, maxPages: 2 } });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		expect(scan.shown()).toBe("capture");
		scan.takeCalls();
		await scan.store(TAKEN_IMAGE);
		expect(scan.calls).toEqual([
			"document.add page2 with the boundary found",
			"capture.unmount",
			"edit.mount",
		]);
		expect(scan.shown()).toBe("edit");
	});

	it("finishes the session with the page that fills the document when there is no edit phase", async () => {
		const scan = fakeSession({
			settings: {
				maxPages: 1,
				phases: { edit: false, rectify: { modes: { afterCapture: false } } },
			},
		});
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		expect(scan.calls).toContain("document.snapshot page1");
		expect(scan.ended).toEqual([succeeded("page1")]);
	});

	it("shows the finish error, then the page limit notice, on capture after Apply fills the document with no edit phase and the export fails", async () => {
		const warn = silenceFaults();
		const scan = fakeSession({
			settings: { maxPages: 1, phases: { edit: false } },
			faults: { export: true },
		});
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await settle(() => scan.rectify("apply"));
		expect([scan.shown(), scan.pages(), scan.notices]).toEqual([
			"capture",
			["page1"],
			["finishError", "pageLimitNotice"],
		]);
		expect(warn).toHaveBeenCalledOnce();
		// The thumbnail tries the finish again, and a failure shows both notices again.
		await settle(() => scan.capture("thumbnail"));
		expect(scan.calls.filter((call) => call === "document.export")).toHaveLength(2);
		expect(scan.notices).toEqual([
			"finishError",
			"pageLimitNotice",
			"finishError",
			"pageLimitNotice",
		]);
	});

	it("shows the finish error, then the page limit notice, when a page fills the document with no edit phase and the export fails", async () => {
		silenceFaults();
		const scan = fakeSession({
			settings: {
				maxPages: 1,
				phases: { edit: false, rectify: { modes: { afterCapture: false } } },
			},
			faults: { export: true },
		});
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		expect([scan.shown(), scan.notices]).toEqual(["capture", ["finishError", "pageLimitNotice"]]);
	});

	it("shows only the finish error when the thumbnail cannot finish a document that is not full and there is no edit phase", async () => {
		silenceFaults();
		const scan = fakeSession({
			settings: { phases: { edit: false, rectify: { modes: { afterCapture: false } } } },
			faults: { export: true },
		});
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await settle(() => scan.capture("thumbnail"));
		expect([scan.shown(), scan.notices]).toEqual(["capture", ["finishError"]]);
	});

	it("moves from rectify straight to edit when Apply fills the document", async () => {
		const scan = fakeSession({ settings: { maxPages: 1 } });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		scan.takeCalls();
		await settle(() => scan.rectify("apply"));
		expect(scan.calls).toEqual([
			"document.add page1 with the chosen boundary",
			"rectify.unmount",
			"edit.mount",
		]);
		expect(scan.shown()).toBe("edit");
	});

	it("opens on edit when the session starts with the document full", async () => {
		const scan = fakeSession({ settings: { maxPages: 1 }, pagesKept: 1 });
		await scan.session.start();
		expect(scan.calls).toEqual(["edit.mount"]);
		expect(scan.shown()).toBe("edit");
		expect(scan.notices).toEqual([]);
	});

	it("opens no edit screen for a page that fills the document while the host application finishes", async () => {
		const scan = fakeSession({ settings: { ...NO_REVIEW, maxPages: 1 }, held: ["document.add"] });
		await scan.session.start();
		const stored = scan.store(TAKEN_IMAGE);
		await nextTask();
		const finishing = scan.session.finish();
		scan.finish("document.add");
		await Promise.all([stored, finishing]);
		expect(scan.calls).toContain("document.snapshot page1");
		expect(scan.calls).not.toContain("edit.mount");
		expect(scan.ended).toEqual([succeeded("page1")]);
	});

	it("shows a notice for an image file whose page cannot be added, and goes on", async () => {
		const warn = silenceFaults();
		const scan = fakeSession({ settings: NO_REVIEW, faults: { add: true } });
		await scan.session.start();
		await settle(() => scan.capture("loadImage"));
		scan.pickFile(await imageFile());
		await vi.waitFor(() => expect(scan.notices).toContain("pageError"));
		await vi.waitFor(() => expect(warn).toHaveBeenCalledOnce());
		expect(scan.shown()).toBe("capture");
	});

	it("shows a notice for a photograph that the browser cannot read, and stays on capture", async () => {
		const scan = fakeSession();
		await scan.session.start();
		scan.takeCalls();
		await scan.store(unreadableImage());
		expect(scan.notices).toContain("pageError");
		expect(scan.shown()).toBe("capture");
		expect(scan.takeCalls()).toEqual([]);
	});

	it("stays on capture when the page that would fill the document cannot be added", async () => {
		const scan = fakeSession({ settings: { ...NO_REVIEW, maxPages: 1 }, faults: { add: true } });
		await scan.session.start();
		await expect(scan.store(TAKEN_IMAGE)).rejects.toThrow("the page could not be added");
		expect(scan.shown()).toBe("capture");
	});

	it("opens capture with the page limit notice when the document starts full with no edit phase", async () => {
		const scan = fakeSession({
			settings: { maxPages: 1, phases: { edit: false } },
			pagesKept: 1,
			held: ["capture.mount"],
		});
		const started = scan.session.start();
		await nextTask();
		// Before the camera opens.
		expect([scan.shown(), scan.notices]).toEqual(["capture", ["pageLimitNotice"]]);
		scan.finish("capture.mount");
		await started;
		await scan.store(TAKEN_IMAGE);
		expect(scan.shown()).toBe("capture");
		expect(scan.pages()).toEqual(["page1"]);
		await settle(() => scan.capture("thumbnail"));
		expect(scan.calls).toContain("document.snapshot page1");
		expect(scan.ended).toEqual([succeeded("page1")]);
	});
});

describe("load image", () => {
	/**
	 * Press load image and choose `file`. Return the calls made, once the image has
	 * reached the rectify screen or the document.
	 */
	async function load(scan: ReturnType<typeof fakeSession>, file: File): Promise<string[]> {
		scan.takeCalls();
		await settle(() => scan.capture("loadImage"));
		scan.pickFile(file);
		await vi.waitFor(() =>
			expect(scan.calls.some((call) => /^(rectify\.mount|document\.add)/.test(call))).toBe(true),
		);
		return scan.takeCalls();
	}

	it("keeps an image file chosen as a page from a file", async () => {
		const scan = fakeSession();
		await scan.session.start();
		expect(await load(scan, await imageFile())).toEqual([
			"capture.pickImage",
			"capture.showLoading",
			"findBoundary",
			"capture.unmount",
			"rectify.mount afterCapture on the original with the boundary found",
			"capture.showLoading ends",
		]);
		await settle(() => scan.rectify("apply"));
		expect(scan.pages()).toEqual(["page1"]);
		expect(scan.originOf("page1")).toBe("file");
	});

	it("shows a notice for a file that the browser cannot open", async () => {
		const scan = fakeSession();
		await scan.session.start();
		await settle(() => scan.capture("loadImage"));
		scan.pickFile(new File(["not an image"], "page.png", { type: "image/png" }));
		await vi.waitFor(() => expect(scan.notices).toEqual(["fileError"]));
		expect(scan.pages()).toEqual([]);
		expect(scan.shown()).toBe("capture");
	});

	it("holds an automatic take while the file picker is open", async () => {
		const scan = fakeSession();
		await scan.session.start();
		scan.takeCalls();
		await settle(() => scan.capture("loadImage"));
		await settle(() => scan.autoTake());
		expect(scan.calls).toEqual(["capture.pickImage"]);
		expect(scan.controlsHeld()).toBe(true);
		await settle(() => scan.pickFile(null));
		expect(scan.controlsHeld()).toBe(false);
		expect([scan.pages(), scan.notices, scan.shown()]).toEqual([[], [], "capture"]);
	});

	it("adds no image while the document is full", async () => {
		const scan = fakeSession({ settings: { maxPages: 1, phases: { edit: false } }, pagesKept: 1 });
		await scan.session.start();
		await settle(() => scan.capture("loadImage"));
		scan.pickFile(await imageFile());
		await nextTask();
		await nextTask();
		expect(scan.pages()).toEqual(["page1"]);
	});

	it("adds no image that finishes reading after the session was cancelled", async () => {
		const scan = fakeSession();
		await scan.session.start();
		await settle(() => scan.capture("loadImage"));
		scan.takeCalls();
		scan.pickFile(await imageFile());
		// The session starts to read the file, which takes more than a task.
		await nextTask();
		scan.session.cancel();
		await vi.waitFor(() => expect(scan.ended).toHaveLength(1));
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(scan.calls).not.toContain("findBoundary");
	});
});

describe("start() from a file", () => {
	it("adds the page of an image file and opens the edit screen, with no camera", async () => {
		const scan = fakeSession({ settings: NO_REVIEW });
		await scan.session.start(await imageFile());
		await vi.waitFor(() => expect(scan.shown()).toBe("edit"));
		expect(scan.pages()).toEqual(["page1"]);
		expect(scan.originOf("page1")).toBe("file");
		expect(scan.calls).not.toContain("capture.mount");
	});

	it("shows the page on the rectify screen first when rectify after capture is on", async () => {
		const scan = fakeSession();
		await scan.session.start(await imageFile());
		await vi.waitFor(() =>
			expect(scan.calls).toContain(
				"rectify.mount afterCapture on the original with the boundary found",
			),
		);
		expect(scan.pages()).toEqual([]);
		await settle(() => scan.rectify("apply"));
		await vi.waitFor(() => expect(scan.shown()).toBe("edit"));
		expect(scan.pages()).toEqual(["page1"]);
		expect(scan.calls).not.toContain("capture.mount");
	});

	it("opens the capture screen for another page when the user retakes the page of the file", async () => {
		const scan = fakeSession();
		await scan.session.start(await imageFile());
		await vi.waitFor(() => expect(scan.shown()).toBe("rectify"));
		await settle(() => scan.rectify("retake"));
		await vi.waitFor(() => expect(scan.shown()).toBe("capture"));
		expect(scan.pages()).toEqual([]);
	});

	it("finishes with the page of the file when the edit phase is off", async () => {
		const scan = fakeSession({
			settings: { phases: { rectify: { modes: { afterCapture: false } }, edit: false } },
		});
		await scan.session.start(await imageFile());
		await vi.waitFor(() => expect(scan.ended).toEqual([succeeded("page1")]));
		expect(scan.calls).not.toContain("capture.mount");
	});

	it("adds the page of the file and finishes with no screen when rectify and edit are off", async () => {
		const scan = fakeSession({ settings: { phases: { rectify: false, edit: false } } });
		await scan.session.start(await imageFile());
		await vi.waitFor(() => expect(scan.ended).toEqual([succeeded("page1")]));
		expect(scan.calls.filter((call) => call.includes(".mount"))).toEqual([]);
		expect(scan.moves).toEqual([]);
	});

	it("shows a notice and opens the capture screen at once for a file that the browser cannot open", async () => {
		const scan = fakeSession({ loadLater: true });
		void scan.session.start(new File(["not an image"], "page.png", { type: "image/png" }));
		// As with no file, the capture screen waits there while the engines load.
		await vi.waitFor(() => expect(scan.shown()).toBe("capture"));
		expect(scan.notices).toEqual(["fileError"]);
		expect(scan.pages()).toEqual([]);
	});

	it("finishes with the page of the file after apply when the edit phase is off", async () => {
		const scan = fakeSession({ settings: { phases: { edit: false } } });
		await scan.session.start(await imageFile());
		await vi.waitFor(() => expect(scan.shown()).toBe("rectify"));
		await settle(() => scan.rectify("apply"));
		await vi.waitFor(() => expect(scan.ended).toEqual([succeeded("page1")]));
	});

	it("shows a notice and opens the capture screen when the page of the file cannot go in", async () => {
		silenceFaults();
		const scan = fakeSession({ settings: NO_REVIEW, faults: { add: true } });
		await scan.session.start(await imageFile());
		await vi.waitFor(() => expect(scan.shown()).toBe("capture"));
		expect(scan.notices).toEqual(["pageError"]);
		expect(scan.pages()).toEqual([]);
	});

	it("says that a full document takes no page, and opens the edit screen", async () => {
		const scan = fakeSession({ settings: { maxPages: 1 }, pagesKept: 1 });
		await scan.session.start(await imageFile());
		await vi.waitFor(() => expect(scan.shown()).toBe("edit"));
		expect(scan.notices).toEqual(["pageLimitNotice"]);
		expect(scan.pages()).toEqual(["page1"]);
	});

	it("shows nothing until the engines load", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, loadLater: true });
		const started = scan.session.start(await imageFile());
		await nextTask();
		expect(scan.shown()).toBeNull();
		scan.finishLoading();
		await started;
		expect([scan.shown(), scan.pages()]).toEqual(["edit", ["page1"]]);
	});

	it("fails the session when the engines cannot load", async () => {
		const scan = fakeSession({ loadLater: true });
		const started = scan.session.start(await imageFile());
		scan.failLoading();
		await started;
		expect(scan.ended).toMatchObject([{ status: "failed" }]);
	});
});

describe("edit", () => {
	it("opens the rectify screen from borders on the original of the page showing", async () => {
		const scan = await openEdit({}, 1);
		await settle(() => scan.edit("rectify"));
		expect(scan.calls).toEqual([
			"edit.unmount",
			"document.recordOf page1",
			"rectify.mount fromEdit on the original with the boundary found",
		]);
		expect(scan.shown()).toBe("rectify");
	});

	it("opens the rectify screen with no boundary on a page bounded by the whole page", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, found: null });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await settle(() => scan.capture("thumbnail"));
		await settle(() => scan.edit("rectify"));
		expect(scan.calls).toContain("rectify.mount fromEdit on the original with no boundary");
	});

	it("stays on the edit screen when borders, delete, or rotate is pressed with no page showing", async () => {
		const scan = fakeSession();
		await scan.session.start();
		await settle(() => scan.capture("thumbnail"));
		scan.takeCalls();
		await settle(() => scan.edit("rectify"));
		await settle(() => scan.edit("delete"));
		await settle(() => scan.edit("rotate"));
		expect(scan.calls).toEqual([]);
		expect(scan.shown()).toBe("edit");
	});

	it("rectifies the page and returns to edit on apply from there", async () => {
		const scan = await openEdit({}, 1);
		await settle(() => scan.edit("rectify"));
		scan.takeCalls();
		await settle(() => scan.rectify("apply"));
		expect(scan.calls).toEqual([
			"document.setBoundary page1 with the chosen boundary",
			"rectify.unmount",
			"edit.mount",
		]);
		expect(scan.shown()).toBe("edit");
	});

	it("leaves the page as it was and returns to edit on cancel from there", async () => {
		const scan = await openEdit({}, 1);
		await settle(() => scan.edit("rectify"));
		scan.takeCalls();
		await settle(() => scan.rectify("cancel"));
		expect(scan.calls).toEqual(["rectify.unmount", "edit.mount"]);
		expect(scan.shown()).toBe("edit");
	});

	it("stays on the rectify screen when the page cannot be rectified", async () => {
		const warn = silenceFaults();
		const scan = await openEdit({ faults: { setBoundary: true } }, 1);
		await settle(() => scan.edit("rectify"));
		scan.takeCalls();
		await settle(() => scan.rectify("apply"));
		expect(scan.calls).toEqual(["document.setBoundary page1 with the chosen boundary"]);
		expect(scan.shown()).toBe("rectify");
		expect(warn).toHaveBeenCalledOnce();
	});

	it("ends the session with the pages on done", async () => {
		const scan = await openEdit({}, 1);
		await settle(() => scan.edit("done"));
		expect(scan.calls.slice(0, 2)).toEqual(["document.snapshot page1", "document.export"]);
		expect(scan.ended).toEqual([succeeded("page1")]);
		expect(scan.shown()).toBeNull();
	});

	it("shows a notice and lets done try again when the document cannot be exported", async () => {
		const warn = silenceFaults();
		const scan = await openEdit({ faults: { export: true } }, 1);
		await settle(() => scan.edit("done"));
		expect(scan.ended).toEqual([]);
		expect(scan.shown()).toBe("edit");
		expect(scan.notices).toEqual(["finishError"]);
		expect(warn).toHaveBeenCalledOnce();
		await settle(() => scan.edit("done"));
		expect(scan.calls.filter((call) => call === "document.export")).toHaveLength(2);
	});

	it("asks before cancel drops the pages, then ends the session as cancelled", async () => {
		const scan = await openEdit({}, 1);
		scan.edit("cancel");
		scan.answer("discardConfirmation", "Discard");
		expect(scan.pages()).toEqual([]);
		expect(scan.ended).toEqual([{ status: "cancelled" }]);
	});

	it("opens the capture screen for another page on add page", async () => {
		const scan = await openEdit({}, 1);
		await settle(() => scan.edit("addPage"));
		expect(scan.calls).toEqual(["edit.unmount", "capture.mount"]);
		expect(scan.shown()).toBe("capture");
	});

	it("stays on the edit screen on add page while the document is full", async () => {
		const scan = fakeSession({ settings: { maxPages: 1 }, pagesKept: 1 });
		await scan.session.start();
		await settle(() => scan.edit("addPage"));
		expect(scan.calls).toEqual(["edit.mount"]);
		expect(scan.shown()).toBe("edit");
	});

	it("hands the page tools to the edit screen", async () => {
		const scan = await openEdit({}, 1);
		for (const tool of ["previousPage", "nextPage", "thumbnails"] as const) {
			await settle(() => scan.edit(tool));
		}
		expect(scan.calls).toEqual(["edit.previousPage", "edit.nextPage", "edit.toggleThumbnails"]);
	});

	it("holds the edit controls off while done builds the result", async () => {
		const warn = silenceFaults();
		const scan = await openEdit({ faults: { export: true } }, 1);
		expect(scan.editControlsHeld()).toBe(false);
		scan.edit("done");
		expect(scan.editControlsHeld()).toBe(true);
		await nextTask();
		expect(scan.editControlsHeld()).toBe(false);
		expect(warn).toHaveBeenCalledOnce();
	});
});

describe("the edit screen's history", () => {
	it("deletes the selected pages as one change", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		scan.selectPages(["page1", "page3"]);
		await press(scan, "delete");
		expect(scan.pages()).toEqual(["page2"]);
		await press(scan, "undo");
		expect(scan.pages()).toEqual(["page1", "page2", "page3"]);
		await press(scan, "redo");
		expect(scan.pages()).toEqual(["page2"]);
	});

	it("brings back every page after the last one is deleted", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		for (let count = 0; count < 3; count++) await press(scan, "delete");
		expect(scan.pages()).toEqual([]);
		expect(scan.shown()).toBe("edit");
		for (let count = 0; count < 3; count++) await press(scan, "undo");
		expect(scan.pages()).toEqual(["page1", "page2", "page3"]);
	});

	it("takes back a page added from the capture screen", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, pagesKept: 1 });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await settle(() => scan.capture("thumbnail"));
		expect(scan.pages()).toEqual(["page1", "page2"]);
		await press(scan, "undo");
		expect(scan.pages()).toEqual(["page1"]);
		await press(scan, "redo");
		expect(scan.pages()).toEqual(["page1", "page2"]);
	});

	it("shows the first page that a delete brings back, and the page that takes its place", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		scan.selectPages(["page1", "page3"]);
		await press(scan, "delete");
		scan.takeCalls();
		await press(scan, "undo");
		expect(shownPages(scan)).toEqual(["page1"]);
		await press(scan, "redo");
		expect(shownPages(scan)).toEqual(["page2"]);
	});

	it("shows the pages in document order when the selection is out of order", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		scan.selectPages(["page3", "page1"]);
		await press(scan, "delete");
		scan.takeCalls();
		await press(scan, "undo");
		expect(shownPages(scan)).toEqual(["page1"]);
		await press(scan, "redo");
		expect(shownPages(scan)).toEqual(["page2"]);
	});

	it("shows the last page again on undo, and the page before it on redo", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		scan.selectPages(["page3"]);
		await press(scan, "delete");
		scan.takeCalls();
		await press(scan, "undo");
		expect(shownPages(scan)).toEqual(["page3"]);
		await press(scan, "redo");
		expect(shownPages(scan)).toEqual(["page2"]);
	});

	it("shows the first page that a drag moved, after each step", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		scan.dragPages(["page3", "page1", "page2"]);
		scan.takeCalls();
		await press(scan, "undo");
		expect(shownPages(scan)).toEqual(["page1"]);
		await press(scan, "redo");
		expect(shownPages(scan)).toEqual(["page3"]);
	});

	it("shows the changed page after each rotation and filter step", async () => {
		const scan = await openEdit({ pagesKept: 2 });
		await press(scan, "rotate");
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		await press(scan, "apply");
		scan.takeCalls();
		await press(scan, "undo");
		await press(scan, "undo");
		await press(scan, "redo");
		expect(shownPages(scan)).toEqual(["page2", "page2", "page2"]);
	});

	it("shows the page before an added page on undo, and the added page on redo", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, pagesKept: 1 });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await settle(() => scan.capture("thumbnail"));
		scan.takeCalls();
		await press(scan, "undo");
		expect(shownPages(scan)).toEqual(["page1"]);
		await press(scan, "redo");
		expect(shownPages(scan)).toEqual(["page2"]);
	});

	it("undoes and redoes a rotation", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		await press(scan, "rotate");
		expect(scan.angleOf("page3")).toBe(270);
		await press(scan, "undo");
		expect(scan.angleOf("page3")).toBe(0);
		await press(scan, "redo");
		expect(scan.angleOf("page3")).toBe(270);
	});

	it("keeps a page's rotation through a new boundary and its undo", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		await press(scan, "rotate");
		await press(scan, "rectify");
		await settle(() => scan.rectify("apply"));
		expect(scan.angleOf("page3")).toBe(270);
		await press(scan, "undo");
		expect(scan.angleOf("page3")).toBe(270);
		await press(scan, "undo");
		expect(scan.angleOf("page3")).toBe(0);
		await press(scan, "redo");
		await press(scan, "redo");
		expect(scan.angleOf("page3")).toBe(270);
	});

	it("sets the boundary a page had before the rectify screen changed it", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		await press(scan, "rectify");
		await settle(() => scan.rectify("apply"));
		scan.takeCalls();
		await press(scan, "undo");
		await press(scan, "redo");
		// The page had no boundary of its own, so undo sets the whole page.
		expect(scan.calls).toEqual([
			"document.setBoundary page3",
			"edit.showPage page3",
			"document.setBoundary page3 with the chosen boundary",
			"edit.showPage page3",
		]);
	});

	it("records no change when the rectify screen keeps the boundary the page has", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, pagesKept: 1 });
		await scan.session.start();
		await settle(() => scan.capture("thumbnail"));
		await press(scan, "rectify");
		await settle(() => scan.rectify("apply"));
		await press(scan, "rectify");
		await settle(() => scan.rectify("apply"));
		scan.takeCalls();
		await press(scan, "undo");
		await press(scan, "undo");
		expect(scan.calls.filter((call) => call.startsWith("document.setBoundary"))).toHaveLength(1);
	});

	it("undoes and redoes a drag of the pages", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		scan.dragPages(["page3", "page1", "page2"]);
		await press(scan, "undo");
		expect(scan.pages()).toEqual(["page1", "page2", "page3"]);
		await press(scan, "redo");
		expect(scan.pages()).toEqual(["page3", "page1", "page2"]);
	});

	it("tells the edit screen what undo and redo can do after each change", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		expect(scan.history()).toEqual([false, false]);
		await press(scan, "delete");
		expect(scan.history()).toEqual([true, false]);
		await press(scan, "undo");
		expect(scan.history()).toEqual([false, true]);
		await press(scan, "rotate");
		expect(scan.history()).toEqual([true, false]);
	});

	it("keeps a change that it cannot take back", async () => {
		const warn = silenceFaults();
		const scan = await openEdit({ pagesKept: 3 });
		await press(scan, "rectify");
		await settle(() => scan.rectify("apply"));
		scan.fail("setBoundary");
		await press(scan, "undo");
		expect(warn).toHaveBeenCalledOnce();
		expect(scan.history()).toEqual([true, false]);
	});
});

describe("the reports of changes to the document", () => {
	/**
	 * The type of each change reported, and the state that each left: the page count,
	 * the index of the page that shows, and the undo and redo counts.
	 */
	const reported = (scan: ReturnType<typeof fakeSession>) =>
		scan.changes.map(({ type, state }) => [
			type,
			state.pageCount,
			state.currentIndex,
			state.undoCount,
			state.redoCount,
		]);

	it("report a page added, then the history it grew, each with the state the change left", async () => {
		const scan = fakeSession({ settings: NO_REVIEW });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await vi.waitFor(() => expect(scan.changes).toHaveLength(2));
		expect(reported(scan)).toEqual([
			["pagesAdded", 1, 0, 1, 0],
			["historyChanged", 1, 0, 1, 0],
		]);
		expect(scan.changes[0]).toMatchObject({ pages: [{ uid: "page1" }] });
	});

	it("report pages removed, and brought back by undo, each with the state the change left", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		scan.selectPages(["page1", "page3"]);
		await press(scan, "delete");
		await press(scan, "undo");
		await vi.waitFor(() => expect(scan.changes).toHaveLength(4));
		// Undo shows page1, the first page it brings back.
		expect(reported(scan)).toEqual([
			["pagesRemoved", 1, 0, 1, 0],
			["historyChanged", 1, 0, 1, 0],
			["pagesAdded", 3, 0, 0, 1],
			["historyChanged", 3, 0, 0, 1],
		]);
		expect(scan.changes[0]).toMatchObject({ indices: [0, 1] });
	});

	it("report an undo and a redo with the page each shows and the history after it", async () => {
		const scan = await openEdit({ pagesKept: 2 });
		await press(scan, "rotate");
		await press(scan, "previousPage");
		await press(scan, "undo");
		await press(scan, "previousPage");
		await press(scan, "redo");
		await vi.waitFor(() => expect(scan.changes).toHaveLength(6));
		// Each turns page2 and shows it, at index 1, though page1 showed before.
		expect(reported(scan).slice(2)).toEqual([
			["pageEdited", 2, 1, 0, 1],
			["historyChanged", 2, 1, 0, 1],
			["pageEdited", 2, 1, 1, 0],
			["historyChanged", 2, 1, 1, 0],
		]);
	});

	it("report a boundary kept from the edit screen with the page it changed and its history", async () => {
		const scan = await openEdit({ pagesKept: 3 });
		await press(scan, "previousPage");
		await press(scan, "rectify");
		await settle(() => scan.rectify("apply"));
		await vi.waitFor(() => expect(scan.changes).toHaveLength(2));
		expect(reported(scan)).toEqual([
			["pageEdited", 3, 1, 1, 0],
			["historyChanged", 3, 1, 1, 0],
		]);
	});

	it("report a turn and a drag, and their undo, as edits and reorders", async () => {
		const scan = await openEdit({ pagesKept: 2 });
		await press(scan, "rotate");
		await press(scan, "undo");
		scan.dragPages(["page2", "page1"]);
		await press(scan, "undo");
		await vi.waitFor(() => expect(scan.changes).toHaveLength(8));
		expect(scan.changes.map(({ type }) => type)).toEqual([
			"pageEdited",
			"historyChanged",
			"pageEdited",
			"historyChanged",
			"pagesReordered",
			"historyChanged",
			"pagesReordered",
			"historyChanged",
		]);
	});

	it("report a fault, and go on, for a page that left before its report read it", async () => {
		const warn = silenceFaults();
		const scan = fakeSession({ settings: NO_REVIEW, held: ["document.page"] });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		scan.session.cancel();
		scan.finish("document.page");
		await vi.waitFor(() => expect(warn).toHaveBeenCalledOnce());
		expect(scan.changes.map(({ type }) => type)).toEqual(["historyChanged", "pagesRemoved"]);
	});

	it("report every page removed by a cancel", async () => {
		const scan = await openEdit({ pagesKept: 2 });
		scan.session.cancel();
		await vi.waitFor(() => expect(scan.changes).toHaveLength(1));
		expect(scan.changes[0]).toMatchObject({ type: "pagesRemoved", indices: [0, 1] });
	});
});

describe("the reports of moves", () => {
	it("report each phase, with the end of the mode it left and the mode it began", async () => {
		const scan = fakeSession();
		expect(scan.session.phase).toBeNull();
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await settle(() => scan.rectify("apply"));
		expect(scan.session.phase).toBe("capture");
		scan.session.cancel();
		expect(scan.session.phase).toBeNull();
		expect(scan.moves).toEqual([
			{ type: "phase", from: null, to: "capture" },
			{ type: "phase", from: "capture", to: "rectify" },
			{ type: "mode", phase: "rectify", from: null, to: "afterCapture" },
			{ type: "mode", phase: "rectify", from: "afterCapture", to: null },
			{ type: "phase", from: "rectify", to: "capture" },
		]);
	});

	it("report the filter mode opening and closing on the edit screen", async () => {
		const scan = await openEdit({ pagesKept: 1 });
		const before = scan.moves.length;
		await press(scan, "filter");
		await press(scan, "cancel");
		expect(scan.moves.slice(before)).toEqual([
			{ type: "mode", phase: "edit", from: null, to: "filter" },
			{ type: "mode", phase: "edit", from: "filter", to: null },
		]);
	});
});

describe("done", () => {
	it("hands over the result while the screens are still up, and ends once it settles", async () => {
		const scan = await openEdit({ pagesKept: 1, held: ["done"] });
		const finishing = scan.session.finish();
		await vi.waitFor(() => expect(scan.succeeded).toHaveLength(1));
		expect([scan.ended, scan.calls.includes("capture.release")]).toEqual([[], false]);
		scan.finish("done");
		expect(await finishing).toBe(true);
		expect(scan.ended).toEqual(scan.succeeded);
	});
});

describe("the filter mode", () => {
	it("shows each filter chosen on the page that showed when the mode opened", async () => {
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		await press(scan, { filter: "saveInk" });
		expect(scan.calls).toEqual([
			"document.recordOf page1",
			"edit.openFilterMode page1 none",
			"document.setFilter page1 gray",
			"edit.showFilter gray",
			"document.setFilter page1 saveInk",
			"edit.showFilter saveInk",
		]);
	});

	it("keeps the last filter chosen on apply as one change", async () => {
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		await press(scan, { filter: "saveInk" });
		await press(scan, "apply");
		expect([scan.filterOf("page1"), scan.history(), scan.calls.at(-1)]).toEqual([
			"saveInk",
			[true, false],
			"edit.closeMode",
		]);
		await press(scan, "undo");
		expect(scan.filterOf("page1")).toBe("none");
		await press(scan, "redo");
		expect(scan.filterOf("page1")).toBe("saveInk");
	});

	it("puts back the filter it opened with on cancel", async () => {
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		await press(scan, "cancel");
		expect([scan.filterOf("page1"), scan.history(), scan.ended]).toEqual([
			"none",
			[false, false],
			[],
		]);
		expect(scan.calls.at(-1)).toBe("edit.closeMode");
	});

	it("records nothing when apply keeps the filter the page had", async () => {
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		await press(scan, { filter: "none" });
		await press(scan, "apply");
		expect([scan.filterOf("page1"), scan.history()]).toEqual(["none", [false, false]]);
	});

	it("keeps the page's rotation through each filter and its undo", async () => {
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "rotate");
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		await press(scan, "apply");
		expect(scan.angleOf("page1")).toBe(270);
		await press(scan, "undo");
		expect(scan.angleOf("page1")).toBe(270);
	});

	it("stays open with the page as it was when a filter cannot be applied", async () => {
		const warn = silenceFaults();
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "filter");
		scan.fail("setFilter");
		await press(scan, { filter: "gray" });
		expect([scan.filterOf("page1"), scan.calls.at(-1)]).toEqual([
			"none",
			"document.setFilter page1 gray",
		]);
		expect(warn).toHaveBeenCalledOnce();
	});

	it("stays open with the filter chosen when cancel cannot take it back", async () => {
		const warn = silenceFaults();
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		scan.fail("setFilter");
		await press(scan, "cancel");
		expect([scan.filterOf("page1"), scan.calls.includes("edit.closeMode")]).toEqual([
			"gray",
			false,
		]);
		expect(warn).toHaveBeenCalledOnce();
	});

	it("shows a notice and stays up when the host application finishes and the filter shown cannot be taken back", async () => {
		const warn = silenceFaults();
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		scan.fail("setFilter");
		expect(await scan.session.finish()).toBe(false);
		expect([scan.filterOf("page1"), scan.ended]).toEqual(["gray", []]);
		expect(scan.notices).toEqual(["finishError"]);
		expect(warn).toHaveBeenCalledOnce();
	});

	it("leaves out of the result a filter still being applied when the host application finishes", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, pagesKept: 1, held: ["document.setFilter"] });
		await scan.session.start();
		await settle(() => scan.capture("thumbnail"));
		await settle(() => scan.edit("filter"));
		await settle(() => scan.chooseFilter("gray"));
		const finishing = scan.session.finish();
		scan.finish("document.setFilter");
		expect(await finishing).toBe(true);
		expect([scan.filterOf("page1"), scan.ended]).toEqual(["none", [succeeded("page1")]]);
	});

	it("closes a mode still opening when the host application finishes", async () => {
		const scan = await openEdit({ pagesKept: 1, held: ["edit.openFilterMode"] });
		await settle(() => scan.edit("filter"));
		const finishing = scan.session.finish();
		await nextTask();
		scan.finish("edit.openFilterMode");
		expect(await finishing).toBe(true);
		expect(scan.calls.slice(1, 3)).toEqual(["edit.openFilterMode page1 none", "edit.closeMode"]);
	});

	it("leaves out of the result a filter that shows and was not applied", async () => {
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		expect(await scan.session.finish()).toBe(true);
		expect(scan.filterOf("page1")).toBe("none");
		expect(scan.ended).toEqual([succeeded("page1")]);
	});

	it("runs the onClick of the mode buttons from modeButtons", async () => {
		const clicked: string[] = [];
		const scan = await openEdit({
			settings: {
				...NO_REVIEW,
				phases: {
					...NO_REVIEW.phases,
					edit: {
						buttons: { cancel: { onClick: () => void clicked.push("screen cancel") } },
						modeButtons: {
							cancel: {
								onClick: ({ button, phase, mode }) =>
									void clicked.push(`${phase} ${mode} ${button}`),
							},
							apply: {
								onClick: ({ button, phase, mode }) =>
									void clicked.push(`${phase} ${mode} ${button}`),
							},
						},
					},
				},
			},
			pagesKept: 1,
		});
		await press(scan, "filter");
		await press(scan, "cancel");
		await press(scan, "filter");
		await press(scan, "apply");
		expect([clicked, scan.ended]).toEqual([["edit filter cancel", "edit filter apply"], []]);
	});

	it("has no mode to open when the page showing is gone", async () => {
		const scan = await openEdit();
		await press(scan, "filter");
		expect(scan.calls).toEqual([]);
	});

	it("applies nothing for the filter that already shows", async () => {
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		await press(scan, { filter: "gray" });
		expect(scan.calls.filter((call) => call.startsWith("document.setFilter"))).toHaveLength(1);
	});

	it("opens no mode when the session is cancelled while it reads the page's filter", async () => {
		const scan = await openEdit({ pagesKept: 1, held: ["document.recordOf"] });
		await settle(() => scan.edit("filter"));
		scan.session.cancel();
		scan.finish("document.recordOf");
		await nextTask();
		expect(scan.calls).not.toContain("edit.openFilterMode page1 none");
	});

	it("shows no filter that finishes after the session was cancelled", async () => {
		const scan = await openEdit({ pagesKept: 1, held: ["document.setFilter"] });
		await press(scan, "filter");
		await settle(() => scan.chooseFilter("gray"));
		scan.session.cancel();
		scan.finish("document.setFilter");
		await nextTask();
		expect(scan.calls).not.toContain("edit.showFilter gray");
	});

	it("closes no mode whose cancel finishes after the session was cancelled", async () => {
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "filter");
		await press(scan, { filter: "gray" });
		scan.hold("document.setFilter");
		await settle(() => scan.edit("cancel"));
		scan.session.cancel();
		scan.finish("document.setFilter");
		await nextTask();
		expect(scan.calls).not.toContain("edit.closeMode");
	});
});

describe("ending", () => {
	it("keeps the session and its pages when the user dismisses the discard confirmation", async () => {
		const scan = await openEdit({ pagesKept: 1 });
		await press(scan, "cancel");
		scan.answer("discardConfirmation", null);
		expect(scan.ended).toEqual([]);
		expect(scan.pages()).toEqual(["page1"]);
		expect(scan.shown()).toBe("edit");
	});

	it("cancels at once with no pages, and when the host application calls cancel()", async () => {
		const empty = fakeSession();
		await empty.session.start();
		await settle(() => empty.capture("cancel"));
		expect(empty.ended).toEqual([{ status: "cancelled" }]);
		const called = fakeSession({ pagesKept: 1 });
		await called.session.start();
		called.session.cancel();
		expect(called.ended).toEqual([{ status: "cancelled" }]);
		expect([...empty.notices, ...called.notices]).toEqual([]);
	});

	it("shows no rectify screen when the host application finishes the session while an image file's edges are found", async () => {
		const scan = fakeSession({ held: ["findBoundary", "document.export"], pagesKept: 1 });
		await scan.session.start();
		await chooseFile(scan);
		const finishing = scan.session.finish();
		scan.finish("findBoundary");
		await nextTask();
		expect(scan.shown()).toBe("capture");
		scan.finish("document.export");
		await finishing;
		await nextTask();
		expect(scan.calls.filter((call) => call.startsWith("rectify.mount"))).toEqual([]);
		expect(scan.ended).toEqual([succeeded("page1")]);
	});

	it("opens the rectify screen on an image file chosen while finishing once the export fails", async () => {
		silenceFaults();
		const scan = fakeSession({
			held: ["findBoundary", "document.export"],
			faults: { export: true },
			pagesKept: 1,
		});
		await scan.session.start();
		await chooseFile(scan);
		const finishing = scan.session.finish();
		scan.finish("findBoundary");
		await nextTask();
		expect(scan.shown()).toBe("capture");
		scan.finish("document.export");
		await finishing;
		await vi.waitFor(() => expect(scan.shown()).toBe("rectify"));
		expect(scan.ended).toEqual([]);
	});

	it("leaves out a page on the rectify screen when the host application finishes the session", async () => {
		const scan = fakeSession({ pagesKept: 1 });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await scan.session.finish();
		// The snapshot's log line lists the pages in it, here only the kept one.
		expect(scan.calls).toContain("document.snapshot page1");
		expect(scan.ended).toEqual([succeeded("page1")]);
	});

	it("ends as cancelled when it finishes with no pages", async () => {
		const scan = fakeSession();
		await scan.session.start();
		// Under review, so not yet in the document.
		await scan.store(TAKEN_IMAGE);
		scan.takeCalls();
		expect(await scan.session.finish()).toBe(true);
		expect(scan.calls).not.toContain("document.export");
		expect(scan.ended).toEqual([{ status: "cancelled" }]);
	});

	it("opens no rectify screen when the session ends while the page's record is read", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, held: ["document.recordOf"] });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		await settle(() => scan.capture("thumbnail"));
		await settle(() => scan.edit("rectify"));
		scan.session.cancel();
		scan.finish("document.recordOf");
		await nextTask();
		expect(scan.calls.filter((call) => call.startsWith("rectify.mount"))).toEqual([]);
	});

	it("opens no rectify screen when the session fails while an image file's edges are found", async () => {
		const scan = fakeSession({ held: ["findBoundary"] });
		await scan.session.start();
		await chooseFile(scan);
		scan.session.end({ status: "failed", error: { kind: "internal", message: "broken" } });
		scan.finish("findBoundary");
		await nextTask();
		await nextTask();
		expect(scan.calls.filter((call) => call.startsWith("rectify.mount"))).toEqual([]);
		expect(scan.pages()).toEqual([]);
	});

	it("reports nothing when a screen fails because the session ended during its mount", async () => {
		const warn = silenceFaults();
		const scan = fakeSession({ held: ["capture.mount"], faults: { mount: "capture" } });
		const started = scan.session.start();
		scan.session.cancel();
		scan.finish("capture.mount");
		await started;
		expect(scan.ended).toEqual([{ status: "cancelled" }]);
		expect(warn).not.toHaveBeenCalled();
	});

	it("reports no export fault when a cancel empties the document while the result is built", async () => {
		const warn = silenceFaults();
		const scan = fakeSession({
			held: ["document.export"],
			faults: { export: true },
			pagesKept: 1,
		});
		await scan.session.start();
		const finishing = scan.session.finish();
		await nextTask();
		expect(scan.calls).toContain("document.export");
		scan.session.cancel();
		scan.finish("document.export");
		await finishing;
		expect(warn).not.toHaveBeenCalled();
		expect(scan.ended).toEqual([{ status: "cancelled" }]);
	});

	it("reports an export fault, and shows no notice, when the session fails while the result is built", async () => {
		const warn = silenceFaults();
		const scan = fakeSession({
			held: ["document.export"],
			faults: { export: true },
			pagesKept: 1,
		});
		await scan.session.start();
		const finishing = scan.session.finish();
		await nextTask();
		expect(scan.calls).toContain("document.export");
		scan.session.end({ status: "failed", error: { kind: "internal", message: "broken" } });
		scan.finish("document.export");
		await finishing;
		expect(warn).toHaveBeenCalledOnce();
		expect(scan.notices).toEqual([]);
	});

	it("shows no notice for a page that fails to go in after the session was cancelled", async () => {
		const scan = fakeSession({
			settings: NO_REVIEW,
			held: ["document.add"],
			faults: { add: true },
		});
		await scan.session.start();
		const stored = scan.store(TAKEN_IMAGE);
		// Past finding its edges, and into the document.
		await nextTask();
		scan.session.cancel();
		scan.finish("document.add");
		await expect(stored).rejects.toThrow("the page could not be added");
		expect(scan.notices).toEqual([]);
	});

	it("builds no result when a cancel comes while the result waits for a page", async () => {
		const scan = fakeSession({ settings: NO_REVIEW, held: ["document.add"] });
		await scan.session.start();
		const stored = scan.store(TAKEN_IMAGE);
		await nextTask();
		const finishing = scan.session.finish();
		scan.session.cancel();
		scan.finish("document.add");
		await Promise.all([stored, finishing]);
		expect(scan.calls.filter((call) => call.startsWith("document.snapshot"))).toEqual([]);
		expect(scan.ended).toEqual([{ status: "cancelled" }]);
	});

	it.for<PhaseName>(["capture", "rectify", "edit"])(
		"ends the session as failed when the %s screen cannot open",
		async (phase) => {
			const scan = fakeSession({ faults: { mount: phase } });
			await scan.session.start();
			if (phase === "rectify") await scan.store(TAKEN_IMAGE);
			if (phase === "edit") scan.capture("thumbnail");
			await nextTask();
			expect(scan.ended).toEqual([
				{
					status: "failed",
					error: expect.objectContaining({ message: `the ${phase} screen could not open` }),
				},
			]);
			expect(scan.shown()).toBeNull();
		},
	);

	it("ends once and then ignores every button", async () => {
		const scan = fakeSession();
		await scan.session.start();
		// Through every screen, so each has its buttons.
		await scan.store(TAKEN_IMAGE);
		await settle(() => scan.rectify("apply"));
		await settle(() => scan.capture("thumbnail"));
		await settle(() => scan.edit("rectify"));
		scan.session.end({ status: "cancelled" });
		scan.session.end({ status: "cancelled" });
		scan.takeCalls();
		scan.rectify("apply");
		scan.rectify("retake");
		scan.rectify("cancel");
		scan.edit("rectify");
		scan.edit("done");
		scan.capture("thumbnail");
		scan.capture("cancel");
		await scan.store(TAKEN_IMAGE);
		await scan.session.start();
		await scan.session.finish();
		scan.session.cancel();
		await nextTask();
		expect(scan.ended).toEqual([{ status: "cancelled" }]);
		expect(scan.calls).toEqual([]);
	});

	it("reports the end even when a screen fails to come down", async () => {
		const scan = fakeSession({ faults: { release: true } });
		await scan.session.start();
		expect(() => scan.session.end({ status: "cancelled" })).toThrow(
			"the edit screen could not come down",
		);
		expect(scan.ended).toEqual([{ status: "cancelled" }]);
	});
});

describe("rectify's screen", () => {
	/** Whether the rectify screen is in the session's `.mds-scanner` element in `container`. */
	const rectifyIn = (container: HTMLElement): boolean =>
		container.querySelector(":scope > .mds-scanner > .mds-screen-rectify") !== null;

	it("opens in the container of the screen that opened it", async () => {
		const afterCapture = newContainer();
		const fromEdit = newContainer();
		const scan = fakeSession({ containers: { rectify: { afterCapture, fromEdit } } });
		await scan.session.start();
		await scan.store(TAKEN_IMAGE);
		expect(rectifyIn(afterCapture)).toBe(true);
		await settle(() => scan.rectify("apply"));
		await settle(() => scan.capture("thumbnail"));
		await settle(() => scan.edit("rectify"));
		expect(rectifyIn(fromEdit)).toBe(true);
		expect(rectifyIn(afterCapture)).toBe(false);
		expect(scan.shown()).toBe("rectify");
	});
});

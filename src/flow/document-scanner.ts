import type { IImageFilter } from "dynamsoft-document-viewer";
import { ScannerStateError, toScannerError } from "../faults";
import { Events } from "./events";
import type { ScannerEventName, ScannerEvents } from "./events";
import type { ScanResult } from "../results";
import { resolveSettings } from "../settings/settings";
import type { EngineSettings, ResolvedSettings, ScannerSettings } from "../settings/settings";
import { CapturePhase } from "../phases/capture";
import { boundaryFinder, createDetector } from "../boundaries/detection";
import type { Detector, FindBoundary } from "../boundaries/detection";
import { ScannedDocument } from "../document/document";
import { EditPhase } from "../phases/edit";
import { engineImports, loadEngines } from "../engines/engines";
import type { LoadedEngines } from "../engines/engines";
import { drawImage, encodeCanvas } from "../document/images";
import { rectifyImage } from "../document/rectification";
import { RectifyPhase } from "../phases/rectify";
import { resolveContainers } from "./containers";
import type { PhaseContainers } from "./containers";
import { Session } from "./session";
import { OverlayLayer, noticeOverlay } from "../ui/overlay";

/** The image types Document Viewer's image filter reads. */
const ENGINE_IMAGE_TYPES: ReadonlySet<string> = new Set(["image/jpeg", "image/png"]);

/** A session under way, from `scan()` until it ends. */
interface Scanning {
	readonly kind: "scanning";
	readonly session: Session;
	/** The session's Document Viewer screens, which `getDdvViewer()` reads, once the engines have loaded. */
	phases: { readonly rectify: RectifyPhase; readonly edit: EditPhase } | null;
}

/** Whether the document scanner is between sessions, running one, or disposed. */
type ScannerState = { readonly kind: "idle" } | Scanning | { readonly kind: "disposed" };

/**
 * What the document scanner builds once the engines have loaded. It outlives each
 * session.
 */
interface Loaded {
	readonly engines: LoadedEngines;
	readonly document: ScannedDocument;
	readonly detector: Detector;
	readonly findBoundary: FindBoundary;
}

/** What `releaseEngines` frees. */
interface HeldEngines {
	readonly capture: CapturePhase;
	readonly router: LoadedEngines["router"];
}

/** What `releasePages` frees. */
interface HeldPages {
	readonly manager: LoadedEngines["documentViewer"]["documentManager"];
	/** The engine documents of the pages and of the pages set aside. */
	readonly uids: readonly string[];
}

/** Release the camera object, then the router. */
function releaseEngines({ capture, router }: HeldEngines): void {
	void capture.dispose().finally(() => router.dispose());
}

/** Delete a scanned document's pages from Document Viewer. */
function releasePages({ manager, uids }: HeldPages): void {
	manager.deleteDocuments([...uids]);
}

/**
 * Release what a document scanner holds once the host application drops it without
 * `dispose()`. The browser decides when, and may never, so this only limits the
 * leak. Each holds only what it frees, so it keeps nothing else alive.
 */
const enginesDropped = new FinalizationRegistry(releaseEngines);
const pagesDropped = new FinalizationRegistry(releasePages);

/**
 * A document scanner. It loads both engines, and runs each session through its
 * screens: capture, rectify, and edit.
 *
 * @example
 * ```ts
 * const scanner = new DocumentScanner({ license: "YOUR_LICENSE_KEY_HERE" });
 * const result = await scanner.scan();
 * if (result.status === "success") {
 * 	// result.pages holds the scanned pages.
 * }
 * ```
 */
export class DocumentScanner {
	readonly #settings: ResolvedSettings;
	/** The settings in effect, as `getSettings()` returns them. */
	readonly #written: ScannerSettings;
	/** The listeners of the document scanner's events. */
	readonly #events = new Events();
	readonly #supplied: EngineSettings | undefined;
	readonly #overlays: OverlayLayer;
	#state: ScannerState = { kind: "idle" };
	/**
	 * The load of the engines, and the capture phase that waits for it, both
	 * started by the first `preload()` or `scan()`. Every caller shares the load,
	 * and a failed load stays failed.
	 */
	#loading: { readonly loaded: Promise<Loaded>; readonly capture: CapturePhase } | null = null;
	/** What the load built, until `dispose()` releases it. */
	#loaded: Loaded | null = null;
	// Whether this document scanner has shown the trial notice.
	#noticedTrial = false;

	/**
	 * Make a document scanner. The constructor loads nothing, and shows nothing.
	 *
	 * @param settings - The settings, each of them optional.
	 * @throws `TypeError` that names the setting, when `settings` is not an object, or
	 * holds an unknown key or a wrong value.
	 */
	constructor(settings: ScannerSettings) {
		this.#settings = resolveSettings(settings);
		this.#written = this.#settings.written;
		this.#supplied = settings.engines;
		this.#overlays = new OverlayLayer(this.#settings, (overlay, open) => {
			const state = this.#state;
			// An overlay shows over the session's screen, or over capture's, which comes
			// first, before any screen shows.
			const phase = (state.kind === "scanning" && state.session.phase) || "capture";
			void this.#events.emit("navigate", { type: "overlay", phase, overlay, open });
		});
	}

	/**
	 * Load the engines before the first {@link DocumentScanner.scan | scan()}, and
	 * show nothing. The call is optional, because `scan()` also loads the engines. If
	 * the load fails, every later `preload()` and `scan()` fails in the same way. To
	 * try again, make a new document scanner after the cause is gone.
	 *
	 * @returns A promise that resolves when the engines load, or when
	 * {@link DocumentScanner.dispose | dispose()} stops the load.
	 * @throws {@link ScannerStateError} (as a rejection) when the document scanner is
	 * disposed.
	 */
	preload(): Promise<void> {
		if (this.#state.kind === "disposed") return Promise.reject(new ScannerStateError("disposed"));
		return this.#startLoading().loaded.then(
			() => undefined,
			(thrown) => {
				// A dispose during the load is not a failure of it.
				if (this.#state.kind !== "disposed") throw thrown;
			},
		);
	}

	/**
	 * Start loading the engines, once, and build the capture phase, which shows its
	 * screen before they arrive.
	 */
	#startLoading(): { readonly loaded: Promise<Loaded>; readonly capture: CapturePhase } {
		if (this.#loading) return this.#loading;
		const loaded = this.#load();
		const capture = new CapturePhase(this.#settings, loaded);
		loaded.then(
			({ engines }) => enginesDropped.register(this, { capture, router: engines.router }, this),
			() => undefined,
		);
		return (this.#loading = { loaded, capture });
	}

	/**
	 * Load the engines, then build the scanned document and the detector. A
	 * `dispose()` during the load wins, and nothing is built.
	 */
	async #load(): Promise<Loaded> {
		const engines = await loadEngines(this.#settings, engineImports(this.#supplied));
		if (this.#state.kind === "disposed") {
			engines.router.dispose();
			throw new ScannerStateError("disposed");
		}
		const { documentManager: manager, ImageFilter, EnumImageDataType } = engines.documentViewer;
		const imageFilter: IImageFilter = new ImageFilter();
		const document = new ScannedDocument(
			{
				document: manager.createDocument(),
				aside: manager.createDocument(),
				movePagesToDocument: (source, target, options) =>
					manager.movePagesToDocument(source, target, options),
			},
			(image, boundary) => rectifyImage(engines.captureVision, image, boundary),
			async (image, filter) => {
				// The engine reads only JPEG and PNG.
				const readable = ENGINE_IMAGE_TYPES.has(image.type)
					? image
					: await encodeCanvas(await drawImage(image, 1), "image/png");
				const type = readable.type === "image/png" ? EnumImageDataType.PNG : EnumImageDataType.JPEG;
				return imageFilter.applyFilter({ type, data: readable }, filter);
			},
		);
		const detector = createDetector(engines.captureVision, engines.router);
		const loaded: Loaded = { engines, document, detector, findBoundary: boundaryFinder(detector) };
		this.#loaded = loaded;
		// Scan results read their pages from the document, so the pages go only once
		// no result can reach it either.
		pagesDropped.register(document, { manager, uids: document.engineUids }, document);
		return loaded;
	}

	/**
	 * Run a session, which lasts from this call until the promise resolves. Without
	 * `file`, the capture screen shows at once, and waits while the engines load. If
	 * the document is full, the edit screen shows instead.
	 *
	 * With `file`, the session starts from that image. The document scanner handles
	 * the image as if the user imported it. When
	 * {@link RectifyModes.afterCapture | phases.rectify.modes.afterCapture} is on, the
	 * rectify screen shows the page first. Then the edit screen opens, or the session
	 * finishes if the edit phase is off. No screen shows until the engines load. The
	 * camera opens only when the capture screen opens, for example after a retake. If
	 * the browser cannot open `file` as an image, a notice shows, and the capture
	 * screen opens as it does without a file. If the document already holds
	 * {@link ScannerSettings.maxPages | maxPages} pages, a notice says so, and the
	 * document scanner does not add the file.
	 *
	 * @param file - An image to start from, such as a `File` from a file input.
	 * @returns The result of the session, with the status `"success"`, `"cancelled"`,
	 * or `"failed"`.
	 * @throws {@link ScannerStateError} (as a rejection) when the document scanner is
	 * disposed, or when a session already runs.
	 * @throws `TypeError` (as a rejection) when `file` is not a `Blob`.
	 */
	async scan(file?: Blob): Promise<ScanResult> {
		if (this.#state.kind === "disposed") throw new ScannerStateError("disposed");
		if (this.#state.kind !== "idle") throw new ScannerStateError("sessionRunning");
		if (file !== undefined && !(file instanceof Blob)) {
			throw new TypeError("The file must be a Blob, such as a File");
		}
		let containers: PhaseContainers;
		try {
			// First, so a selector that matches nothing fails the session immediately.
			containers = resolveContainers(this.#settings);
		} catch (thrown) {
			const error = toScannerError(thrown);
			await this.#events.emit("error", error);
			return { status: "failed", error };
		}
		const { loaded: loading, capture } = this.#startLoading();
		return new Promise<ScanResult>((resolve) => {
			const settings = this.#settings;
			const parts = (loaded: Loaded) => ({
				// Each session builds its own, because they are bound to its elements.
				rectify: new RectifyPhase(settings, loaded.engines, loaded.findBoundary),
				edit: new EditPhase(settings, loaded.engines, loaded.document),
				document: loaded.document,
				findBoundary: loaded.findBoundary,
			});
			// Directly once the engines have loaded, because pages kept from an earlier
			// session need the document at once.
			const ready = this.#loaded ? parts(this.#loaded) : null;
			const later = ready ? null : loading.then(parts);
			const session = new Session({
				settings,
				containers,
				capture,
				loaded: ready ?? later!,
				onSuccess: (result) => this.#events.emit("done", result),
				onDocumentChange: (change) => void this.#events.emit("documentChange", change),
				onNavigate: (navigation) => void this.#events.emit("navigate", navigation),
				onEnd: (result) => {
					this.#state = { kind: "idle" };
					// Overlays belong to the session.
					this.#overlays.closeAll();
					if (result.status !== "failed") return resolve(result);
					// The session has ended, so the listeners only report.
					void this.#events.emit("error", result.error).then(() => resolve(result));
				},
				present: (overlay) => this.#overlays.present(overlay),
			});
			const scanning: Scanning = { kind: "scanning", session, phases: ready };
			later?.then(
				(loaded) => (scanning.phases = loaded),
				() => undefined,
			);
			this.#state = scanning;
			void session.start(file);
			// A failed load is the session's to report.
			loading.then(
				({ engines }) => {
					if (this.#state === scanning) this.#noticeTrial(engines.trial);
				},
				() => undefined,
			);
		});
	}

	/**
	 * Finish the session from code, as the done button of the edit screen does, or
	 * the thumbnail when the edit phase is off. The pending
	 * {@link DocumentScanner.scan | scan()} resolves with the pages, and with the
	 * encoded document if {@link ScannerSettings.output | output} asks for one. The
	 * pages stay in the document for the next `scan()`, until
	 * {@link DocumentScanner.reset | reset()}. If the session cannot finish, for
	 * example because the export fails, a notice tells the user. The session then
	 * stays open, so that the user can try again. If the document holds no pages, the
	 * session ends as cancelled.
	 *
	 * @returns Whether the session ended. It is `false` when the session stays open,
	 * and when no session runs.
	 */
	async finish(): Promise<boolean> {
		return this.#state.kind === "scanning" && (await this.#state.session.finish());
	}

	/**
	 * Abandon the session, as the cancel button of the capture screen does. The
	 * document scanner drops every page in the document, including the pages from
	 * earlier sessions. The pending {@link DocumentScanner.scan | scan()} resolves as
	 * cancelled, even while it waits for the engines. When no session runs, the call
	 * does nothing. To empty the document between sessions, call
	 * {@link DocumentScanner.reset | reset()}.
	 */
	cancel(): void {
		if (this.#state.kind === "scanning") this.#state.session.cancel();
	}

	/**
	 * Return the document scanner to its state just after
	 * {@link DocumentScanner.preload | preload()}. It then has no pages, the camera
	 * that it opens first, auto-capture as the settings set it, and the torch off.
	 * A running session ends first, and its `scan()` resolves as cancelled. The
	 * loaded engines stay loaded.
	 *
	 * @throws {@link ScannerStateError} when the document scanner is disposed.
	 */
	reset(): void {
		if (this.#state.kind === "disposed") throw new ScannerStateError("disposed");
		// Ending a session already puts the camera, auto-capture, and torch back.
		this.cancel();
		const document = this.#loaded?.document;
		if (!document || document.pageCount === 0) return;
		const indices = document.order.map((_, index) => index);
		document.clear();
		const state = { pageCount: 0, currentIndex: -1, undoCount: 0, redoCount: 0 };
		void this.#events.emit("documentChange", { type: "pagesRemoved", indices, state });
	}

	/**
	 * Cancel any session, and release the engines and the pages. After this call, the
	 * document scanner cannot run another session.
	 */
	dispose(): void {
		// First, while the state still holds the scan to end.
		this.cancel();
		this.#state = { kind: "disposed" };
		this.#overlays.closeAll();
		const capture = this.#loading?.capture;
		const loaded = this.#loaded;
		// A load in flight releases its own engines when it finishes.
		if (!loaded) {
			void capture?.dispose();
			return;
		}
		this.#loaded = null;
		const { engines, document } = loaded;
		enginesDropped.unregister(this);
		pagesDropped.unregister(document);
		releasePages({ manager: engines.documentViewer.documentManager, uids: document.engineUids });
		// The capture phase is built with the load, so it exists here.
		if (capture) releaseEngines({ capture, router: engines.router });
	}

	/**
	 * Return the settings in effect, in the shape that the host application writes
	 * them, with a value for every default. Objects that the host application gave,
	 * such as the {@link ResourceSettings.captureVision | resources.captureVision} map
	 * or a container element, are the same objects in the result. The result leaves
	 * out `engines`.
	 *
	 * @returns The settings, frozen.
	 */
	getSettings(): ScannerSettings {
		return this.#written;
	}

	/**
	 * Call `listener` with each payload of `event`. If a listener throws or rejects, the
	 * document scanner reports the error to the console, and the other listeners and
	 * the document scanner continue.
	 *
	 * @param event - The name of the event, from {@link ScannerEvents}.
	 * @param listener - The function to call with each payload.
	 * @returns A function that removes the listener.
	 * @throws `TypeError` when `event` is not the name of an event.
	 */
	on<Name extends ScannerEventName>(
		event: Name,
		listener: (payload: ScannerEvents[Name]) => void | Promise<void>,
	): () => void {
		return this.#events.on(event, listener);
	}

	/**
	 * Return the live Document Viewer object of a screen. The object belongs to
	 * Document Viewer, so its interface follows the versions of Document Viewer. Thus
	 * a release of the document scanner can change it.
	 *
	 * @param type - `"editViewer"` for the edit screen, or `"perspectiveViewer"` for
	 * the rectify screen.
	 * @returns The viewer, or `null` when no session runs, or when the session has not
	 * built that screen yet.
	 * @experimental
	 */
	getDdvViewer(type: "editViewer" | "perspectiveViewer"): unknown {
		const state = this.#state;
		if (state.kind !== "scanning" || !state.phases) return null;
		const { edit, rectify } = state.phases;
		return (type === "editViewer" ? edit.viewer : rectify.viewer) ?? null;
	}

	/**
	 * Show the trial notice once per document scanner. It waits for a session, because
	 * `preload()` has no screen to show it on.
	 *
	 * TODO: show it in capture-only builds too. Their Document Viewer never loads,
	 * and never reports a trial.
	 */
	#noticeTrial(trial: boolean): void {
		if (this.#noticedTrial || !trial) return;
		this.#noticedTrial = true;
		this.#overlays.present(noticeOverlay(this.#settings.strings, "trialNotice"));
	}
}

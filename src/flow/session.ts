import type { ButtonEvent } from "../settings/buttons";
import { reportFault, toScannerError } from "../faults";
import type {
	DocumentChange,
	DocumentState,
	ModeName,
	Navigation,
	PhaseName,
	Quadrilateral,
	ScanResult,
	ScannedPage,
	ScannedPages,
	SuccessfulScan,
} from "../results";
import { buttonSettings, isDocumentFull } from "../settings/settings";
import type { RectifyMode, ResolvedSettings } from "../settings/settings";
import type { FilterName } from "../settings/filters";
import type { CapturePhase } from "../phases/capture";
import type { FindBoundary } from "../boundaries/detection";
import type { PageRecord, ScannedDocument } from "../document/document";
import type { EditPhase } from "../phases/edit";
import { History, inverse } from "../document/history";
import type { Change } from "../document/history";
import { isReadable, originalFromFile } from "../document/images";
import { isWholePage } from "../boundaries/quads";
import type { RectifyImage, RectifyPhase } from "../phases/rectify";
import type { CapturePress } from "../phases/capture-screen";
import type { EditPress, PageOrders } from "../phases/edit-screen";
import { discardOverlay, licenseErrorOverlay, noticeOverlay } from "../ui/overlay";
import type { OverlaySpec } from "../ui/overlay";
import type { RectifyPress } from "../phases/rectify-screen";
import { ScannerElements } from "./containers";
import type { PhaseContainers } from "./containers";

/**
 * What a session works with. The document scanner passes in the real phases and
 * document, and the tests pass in fakes.
 */
export interface SessionInit {
	readonly settings: ResolvedSettings;
	/** The container each phase's screen goes in, resolved when the scan started. */
	readonly containers: PhaseContainers;
	readonly capture: Pick<
		CapturePhase,
		| "mount"
		| "unmount"
		| "release"
		| "takePage"
		| "toggleTorch"
		| "toggleAutoCapture"
		| "switchCamera"
		| "setControlsHeld"
		| "pageHandedOver"
		| "pickImage"
		| "showLoading"
	>;
	/**
	 * What the session needs from the engines, or a promise of it while they load.
	 * Only the capture screen shows before it arrives, and no page exists until then.
	 * Pass it directly once it exists: pages kept from an earlier session need the
	 * document at once, to start on a full document or to drop them on a cancel.
	 */
	readonly loaded: SessionLoaded | Promise<SessionLoaded>;
	/**
	 * Called once a session succeeds, with its result, before its screens come
	 * down. The session ends once it settles.
	 */
	readonly onSuccess: (result: SuccessfulScan) => Promise<void>;
	/** Called with each move between screens and modes, in order. */
	readonly onNavigate: (navigation: Navigation) => void;
	/** Called with each change to the document, in the order of the changes. */
	readonly onDocumentChange: (change: DocumentChange) => void;
	/** Called once, with how the session ended. */
	readonly onEnd: (result: ScanResult) => void;
	/**
	 * Show an overlay over the screen once those presented before it have closed,
	 * and call its `onClose` once when it closes. A failed license check ends the
	 * session only through that call. An overlay whose name already shows or waits
	 * is left out. The session shows no overlay once it has ended, and the caller
	 * closes the one still open at the end and drops those that wait.
	 */
	readonly present: (overlay: OverlaySpec) => void;
}

/** The parts of a session that need the engines. */
export interface SessionLoaded {
	readonly rectify: Pick<
		RectifyPhase,
		| "mount"
		| "unmount"
		| "release"
		| "selection"
		| "undo"
		| "detectBoundary"
		| "fullImage"
		| "setControlsHeld"
	>;
	readonly edit: Pick<
		EditPhase,
		| "mount"
		| "unmount"
		| "release"
		| "currentPage"
		| "chosenPages"
		| "rotate"
		| "setHistory"
		| "previousPage"
		| "nextPage"
		| "showPage"
		| "toggleThumbnails"
		| "setControlsHeld"
		| "openFilterMode"
		| "showFilter"
		| "closeMode"
	>;
	readonly document: Pick<
		ScannedDocument,
		| "pageCount"
		| "add"
		| "setBoundary"
		| "setFilter"
		| "recordOf"
		| "rotationOf"
		| "remove"
		| "clear"
		| "setAside"
		| "putBack"
		| "dropAside"
		| "arrange"
		| "snapshot"
		| "export"
		| "order"
		| "page"
	>;
	/** Finds the boundary on a page just taken. */
	readonly findBoundary: FindBoundary;
}

/** Where a page came from: the camera, or a file the user chose. */
type PageOrigin = PageRecord["origin"];

/** Which screen is up, if any. */
type PhaseState =
	/** The session has not shown a screen yet. */
	| { readonly kind: "none" }
	| { readonly kind: "capture" }
	| { readonly kind: "rectify"; readonly mode: RectifyMode; readonly after: AfterRectify }
	| { readonly kind: "edit"; readonly mode: FilterMode | null }
	/** The session is over, and its screens are gone. */
	| { readonly kind: "ended"; readonly status: ScanResult["status"] };

/**
 * The filter mode, open on the edit screen. It shows `chosen` on the page, which
 * had `entry` when the mode opened.
 */
interface FilterMode {
	readonly name: "filter";
	readonly pageUid: string;
	readonly entry: FilterName;
	readonly chosen: FilterName;
}

/** A change to report, which builds its payload from the state that the change left. */
type PendingReport = (state: DocumentState) => DocumentChange | Promise<DocumentChange>;

/**
 * What the code that opened the rectify screen does with the user's answer. Apply
 * keeps the page and then goes onward, and retake and cancel only go back. The
 * session always leaves the rectify screen, so a page kept there cannot go in
 * again.
 */
interface AfterRectify {
	/** Keep the page, rectified to the boundary the user chose, or whole for `null`. */
	readonly keep: (boundary: Quadrilateral | null) => Promise<void>;
	/** Leave the rectify screen once the page is kept. */
	readonly onward: () => Promise<void>;
	/** Leave the rectify screen with nothing kept, for the screen that opened it. */
	readonly back: () => Promise<void>;
}

/** The presses each phase's screen reports. */
interface Presses {
	readonly capture: CapturePress;
	readonly rectify: RectifyPress;
	readonly edit: EditPress;
}

/**
 * What each button does, phase by phase. Each action gets the press that ran it. A
 * camera switcher press also names the chosen camera.
 */
type DefaultActions = {
	readonly [Phase in PhaseName]: {
		readonly [Button in Presses[Phase]["button"]]: (
			press: Extract<Presses[Phase], { readonly button: Button }>,
		) => unknown;
	};
};

/**
 * A running scan. It moves between the capture, rectify, and edit screens as their
 * buttons ask, and ends with a result.
 */
export class Session {
	readonly #settings: ResolvedSettings;
	readonly #containers: PhaseContainers;
	readonly #capture: SessionInit["capture"];
	/** The parts that need the engines, once they have loaded. */
	#loaded: SessionLoaded | null = null;
	readonly #loading: Promise<SessionLoaded>;
	readonly #onSuccess: SessionInit["onSuccess"];
	readonly #onDocumentChange: SessionInit["onDocumentChange"];
	readonly #onNavigate: SessionInit["onNavigate"];
	/** The reports sent but not yet delivered, which go out one at a time, in order. */
	#reporting: Promise<void> = Promise.resolve();
	/** The changes made but not yet sent, which wait until each change is complete. */
	#unsent: PendingReport[] = [];
	readonly #onEnd: SessionInit["onEnd"];
	readonly #present: SessionInit["present"];
	/** The session's `.mds-scanner` elements, removed when it ends. */
	readonly #elements: ScannerElements;
	/** Each phase's screen, inside one of the `.mds-scanner` elements. */
	readonly #screens = new Map<PhaseName, HTMLElement>();
	/**
	 * Which screen is up. Each move sets it before it takes the old screen down, so
	 * an end or another move during the wait is noticed.
	 */
	#phase: PhaseState = { kind: "none" };
	/** The page being added to the document, if any, which `finish()` waits for. */
	#adding: Promise<unknown> = Promise.resolve();
	/** The finish under way, if any, which a second call joins and a move waits for. */
	#finishing: Promise<void> | null = null;
	/** The step of the edit screen's mode under way, if any, which `finish()` waits for. */
	#modeStep: Promise<unknown> = Promise.resolve();
	/** Whether an action is running, during which other presses do nothing. */
	#busy = false;
	/** The session's changes to the document, which the edit screen's undo and redo walk. */
	readonly #history = new History();
	readonly #actions: DefaultActions = {
		capture: {
			cancel: () => this.#cancelPressed(),
			thumbnail: () => this.#moveOn(),
			shutter: () => this.#capture.takePage(),
			torch: () => this.#capture.toggleTorch(),
			autoCapture: () => this.#capture.toggleAutoCapture(),
			// If the switch fails, the menu keeps marking the camera that stayed open.
			cameraSwitcher: ({ camera }) => this.#capture.switchCamera(camera).catch(() => undefined),
			// The action lasts while the picker is open, so no automatic take or other
			// press can come between the press and the file.
			loadImage: async () => {
				const file = await this.#capture.pickImage();
				// The capture screen shows progress while the file is read and its page found.
				if (file) {
					await this.#capture.showLoading(() =>
						this.#loadImage(file, () => this.#captureOrMoveOn()),
					);
				}
			},
		},
		rectify: {
			apply: () => this.#keepPage(this.#ready.rectify.selection()),
			retake: () => this.#afterRectify()?.back(),
			cancel: () => this.#afterRectify()?.back(),
			undo: () => this.#ready.rectify.undo(),
			detectBoundary: () => this.#ready.rectify.detectBoundary(),
			fullImage: () => this.#ready.rectify.fullImage(),
		},
		edit: {
			// Cancel closes an open mode, and the session otherwise.
			cancel: () =>
				this.#editMode() ? this.#runModeStep(this.#closeMode(false)) : this.#cancelPressed(),
			apply: () => this.#runModeStep(this.#closeMode(true)),
			// A filter press opens the filter mode, and a filter chosen in it names its filter.
			filter: ({ filter }) =>
				this.#runModeStep(
					filter === undefined ? this.#openFilterMode() : this.#chooseFilter(filter),
				),
			// The screen draws add page as off while the document is full.
			addPage: () => (this.#isFull() ? undefined : this.#enterCapture()),
			done: () => this.finish(),
			thumbnails: () => this.#ready.edit.toggleThumbnails(),
			previousPage: () => this.#ready.edit.previousPage(),
			nextPage: () => this.#ready.edit.nextPage(),
			delete: () => this.#deletePages(),
			undo: () => this.#walkHistory(() => this.#history.undo()),
			redo: () => this.#walkHistory(() => this.#history.redo()),
			rectify: () => this.#rectifyFromEdit(),
			rotate: () => this.#rotatePage(),
		},
	};

	constructor(init: SessionInit) {
		const { settings } = init;
		this.#settings = settings;
		this.#containers = init.containers;
		this.#capture = init.capture;
		if (init.loaded instanceof Promise) {
			// When the engines fail to load, the mount of the capture screen rejects, and
			// the session fails there. Here it only makes `finish()` reject.
			init.loaded.then(
				(loaded) => (this.#loaded = loaded),
				() => undefined,
			);
		} else {
			this.#loaded = init.loaded;
		}
		this.#loading = Promise.resolve(init.loaded);
		this.#onSuccess = init.onSuccess;
		this.#onDocumentChange = init.onDocumentChange;
		this.#onNavigate = init.onNavigate;
		this.#onEnd = init.onEnd;
		// An ended session has no screen for an overlay to cover.
		this.#present = (overlay) => {
			if (!this.#hasEnded()) init.present(overlay);
		};
		this.#elements = new ScannerElements(settings.theme);
	}

	/**
	 * Open the capture screen, or the edit screen when the document is already full.
	 * With no edit phase, a full document still opens capture, where no page can be
	 * added, a notice says so, and the thumbnail finishes. With `file`, an image, the
	 * page of the file goes in first, as a loaded image does, and then the session
	 * moves on as the thumbnail does. Until then, nothing shows, and the camera stays
	 * closed. A file that cannot go in opens the first screen as no file does, with a
	 * notice that says why.
	 */
	start(file?: Blob): Promise<void> {
		return this.#run(async () => {
			const onward = () => this.#moveOn();
			// A failed load fails the session on the capture screen, and a page that
			// cannot go in shows its own notice.
			if (file !== undefined && (await this.#loadImage(file, onward).catch(() => false))) return;
			const full = this.#isFull() && this.#settings.phases.edit !== null;
			// With no edit phase, the capture screen says that the document is full.
			if (file !== undefined && full) {
				this.#present(noticeOverlay(this.#settings.strings, "pageLimitNotice"));
			}
			await (full ? this.#enterEdit() : this.#enterCapture());
		});
	}

	/**
	 * Build the result and end the session with it, as the edit screen's done
	 * button does, or the thumbnail with no edit phase. Resolve to whether the
	 * session ended. If the session cannot finish, for example because the export
	 * fails, a notice tells the user, and the session stays up so that the user can
	 * try again. A call while one is under way joins it.
	 */
	async finish(): Promise<boolean> {
		this.#finishing ??= this.#finish().finally(() => {
			this.#finishing = null;
			this.#updateControlsHeld();
		});
		this.#updateControlsHeld();
		await this.#finishing;
		return this.#hasEnded();
	}

	async #finish(): Promise<void> {
		if (this.#hasEnded()) return;
		const { document } = await this.#loading;
		// A page still being taken or added goes into the result. With rectify after
		// capture on, it is left out. One that fails is reported elsewhere.
		await this.#capture.pageHandedOver();
		await Promise.allSettled([this.#adding, this.#modeStep]);
		// The result leaves out what an open mode shows and has not applied. If that
		// cannot be taken back, the session stays up, as when the export fails.
		if (!(await this.#closeMode(false))) {
			this.#present(noticeOverlay(this.#settings.strings, "finishError"));
			return;
		}
		if (this.#hasEnded()) return;
		let result: SuccessfulScan;
		try {
			const pages = await document.snapshot();
			// With no pages there is nothing to finish, so the session ends as a cancel
			// ends it.
			if (!hasPages(pages)) return this.cancel();
			result = { status: "success", pages, output: await document.export(this.#settings.output) };
		} catch (thrown) {
			// A cancel meanwhile dropped the pages, so this is no fault.
			if (this.#wasCancelled()) return;
			// Ending the session would lose the user's pages.
			reportFault("the scanned document could not be exported", thrown);
			this.#present(noticeOverlay(this.#settings.strings, "finishError"));
			return;
		}
		// With the screens still up, so the host application can act on the result.
		await this.#onSuccess(result);
		this.end(result);
	}

	/**
	 * Drop the pages and end the session as cancelled, as the capture screen's
	 * cancel button does.
	 */
	cancel(): void {
		if (this.#hasEnded()) return;
		if (this.#loaded) {
			const { document } = this.#loaded;
			const indices = document.order.map((_, index) => index);
			document.clear();
			if (indices.length > 0) this.#report((state) => ({ type: "pagesRemoved", indices, state }));
		}
		this.end({ status: "cancelled" });
	}

	/** Cancel for the user's press, but ask first when the document has pages. */
	#cancelPressed(): void {
		if (this.#loaded && this.#loaded.document.pageCount > 0) {
			this.#present(discardOverlay(this.#settings.strings, () => this.cancel()));
		} else {
			this.cancel();
		}
	}

	/** End the session with `result`, and take its screens off the page. */
	end(result: ScanResult): void {
		if (this.#hasEnded()) return;
		this.#phase = { kind: "ended", status: result.status };
		// Nothing can change the document after the end, so its reports are complete.
		this.#sendReports();
		try {
			void this.#capture.release();
			if (this.#loaded) {
				// The history ends with the session, so nothing can put these pages back.
				this.#loaded.document.dropAside();
				this.#loaded.rectify.release();
				this.#loaded.edit.release();
			}
			this.#elements.remove();
		} finally {
			// Even when a screen fails to come down, so the document scanner can scan again.
			this.#onEnd(result);
		}
	}

	/**
	 * Return the press handler for a phase's screen. Each press runs the host
	 * application's `onClick` for the button, if any, and then the button's default
	 * action, unless the handler prevented it. One press runs at a time. While one
	 * runs, and until the screen it moves to is usable, other presses do nothing. The
	 * same goes while the host application's own `finish()` runs. Only the capture
	 * screen's cancel always works, unless the host application hides it.
	 */
	#pressHandler<Phase extends PhaseName>(
		phase: Phase,
	): (press: Presses[Phase]) => Promise<void> | undefined {
		return (press) => {
			// TypeScript cannot match the looked-up action to this press, so we need a cast.
			const action = this.#actions[phase][press.button as Presses[Phase]["button"]] as (
				press: Presses[Phase],
			) => unknown;
			const mode = this.#phase.kind === "rectify" ? this.#phase.mode : this.#editMode()?.name;
			const onClick = buttonSettings(this.#settings, phase, mode)?.[press.button]?.onClick;
			// Without a handler the action runs immediately.
			const pressed = onClick
				? async (): Promise<void> => {
						if (!(await this.#prevented(phase, mode, press.button, onClick))) await action(press);
					}
				: () => action(press);
			if (phase === "capture" && press.button === "cancel") return void pressed();
			return this.#runIfIdle(pressed);
		};
	}

	/**
	 * Run the host application's `onClick` for `button` on `phase`'s screen in
	 * `mode`, and tell whether it prevented the default action. A handler that throws
	 * is reported, and counts only if it called `preventDefault()` first.
	 */
	async #prevented(
		phase: PhaseName,
		mode: ButtonEvent["mode"],
		button: string,
		onClick: (event: ButtonEvent<never>) => void | Promise<void>,
	): Promise<boolean> {
		let prevented = false;
		const event: ButtonEvent = {
			button,
			phase,
			mode,
			preventDefault: () => void (prevented = true),
			get defaultPrevented() {
				return prevented;
			},
		};
		try {
			// The handler is the pressed button's own, so the event fits it.
			await onClick(event as ButtonEvent<never>);
		} catch (thrown) {
			reportFault(`the onClick of the ${phase} button ${button} failed`, thrown);
		}
		return prevented;
	}

	/**
	 * Run `action` as a press would, unless another action or a finish runs. Return
	 * the run, or `undefined` when it does not run.
	 */
	#runIfIdle(action: () => unknown): Promise<void> | undefined {
		if (this.#busy || this.#finishing) return undefined;
		return this.#run(action);
	}

	/**
	 * Hold the controls of every screen while an action or the host application's
	 * `finish()` runs. Presses on them do nothing meanwhile, but the capture screen
	 * keeps its cancel usable. An ended session leaves the hold alone, since the
	 * capture phase serves the next session.
	 */
	#updateControlsHeld(): void {
		if (this.#hasEnded()) return;
		const held = this.#busy || this.#finishing !== null;
		this.#capture.setControlsHeld(held);
		this.#loaded?.rectify.setControlsHeld(held);
		this.#loaded?.edit.setControlsHeld(held);
	}

	/**
	 * The parts that need the engines. Only code that runs once a page exists, or a
	 * screen other than capture is up, uses this. Neither can happen before the
	 * engines load.
	 */
	get #ready(): SessionLoaded {
		return this.#loaded!;
	}

	/** Take a phase's screen down. Rectify and edit exist only once the engines have loaded. */
	#unmount(kind: PhaseName): Promise<void> | void {
		return kind === "capture" ? this.#capture.unmount() : this.#ready[kind].unmount();
	}

	/** Run one action, keeping presses out until it has finished. */
	async #run(action: () => unknown): Promise<void> {
		this.#busy = true;
		this.#updateControlsHeld();
		try {
			await action();
		} catch (thrown) {
			// Nothing above the action handles it, and the session goes on.
			reportFault("this action failed", thrown);
		} finally {
			this.#busy = false;
			this.#updateControlsHeld();
		}
	}

	/**
	 * End the session as failed. A failed license check first shows its error over
	 * the screen, and the session ends when the user closes it.
	 */
	#fail(thrown: unknown): void {
		const error = toScannerError(thrown);
		const end = () => this.end({ status: "failed", error });
		if (error.kind === "license") {
			this.#present({ ...licenseErrorOverlay(this.#settings.strings, error.reason), onClose: end });
		} else {
			end();
		}
	}

	/**
	 * Whether the session has ended. A method, because TypeScript would keep an
	 * inline check's answer across an await.
	 */
	#hasEnded(): boolean {
		return this.#phase.kind === "ended";
	}

	/** Whether the document holds as many pages as `maxPages` allows. */
	#isFull(): boolean {
		return this.#loaded !== null && isDocumentFull(this.#settings, this.#loaded.document.pageCount);
	}

	/**
	 * Go to the edit screen, or with no edit phase, finish the session. If the finish
	 * fails, the capture screen shows, where the thumbnail tries again.
	 */
	async #moveOn(): Promise<void> {
		if (this.#settings.phases.edit !== null) return this.#enterEdit();
		if (!(await this.finish())) await this.#enterCapture();
	}

	/** Go to the capture screen for another page, or move on once the document is full. */
	#captureOrMoveOn(): Promise<void> {
		return this.#isFull() ? this.#moveOn() : this.#enterCapture();
	}

	/**
	 * Move to the phase state `next`, and report what changed: when the phase
	 * changes, the end of the mode it left, the move, and the mode it began; within
	 * a phase, the change of mode, if any.
	 */
	#setPhase(next: PhaseState & { readonly kind: PhaseName }): void {
		const leaving = this.#phase;
		this.#phase = next;
		const left = modeOf(leaving);
		const began = modeOf(next);
		if (leaving.kind === next.kind) {
			const changed = began ?? left;
			if (!changed || left?.mode === began?.mode) return;
			const from = left?.mode ?? null;
			this.#onNavigate({ type: "mode", phase: changed.phase, from, to: began?.mode ?? null });
			return;
		}
		if (left) this.#onNavigate({ type: "mode", phase: left.phase, from: left.mode, to: null });
		this.#onNavigate({ type: "phase", from: phaseName(leaving), to: next.kind });
		if (began) this.#onNavigate({ type: "mode", phase: began.phase, from: null, to: began.mode });
	}

	/** The phase that shows now, or `null` before the first screen and after the end. */
	get phase(): PhaseName | null {
		return phaseName(this.#phase);
	}

	/** Whether the session ended with a cancel, which drops its pages. */
	#wasCancelled(): boolean {
		return this.#phase.kind === "ended" && this.#phase.status === "cancelled";
	}

	/**
	 * Leave the screen showing, show `next`'s screen in `container`, then mount it. A move while the
	 * session finishes waits for the finish, so finishing never shows a new screen,
	 * and goes ahead only if the export failed and the session is still up. A move
	 * to the screen already up, or after the session ended, does nothing. A failure
	 * ends the session, unless it has already ended.
	 */
	async #enter(
		next: Exclude<PhaseState, { kind: "none" | "ended" }>,
		container: HTMLElement,
		mount: (screen: HTMLElement) => Promise<void>,
	): Promise<void> {
		if (this.#finishing) await Promise.allSettled([this.#finishing]);
		const leaving = this.#phase;
		if (leaving.kind === next.kind || leaving.kind === "ended") return;
		this.#setPhase(next);
		try {
			if (leaving.kind !== "none") await this.#unmount(leaving.kind);
			// Presses wait for a move, so only an end can come while the old screen comes down.
			if (this.#hasEnded()) return;
			const screen = this.#screen(next.kind, container);
			this.#show(screen);
			await mount(screen);
		} catch (error) {
			// Not when the session ended, since that is what took the screen down.
			if (!this.#hasEnded()) this.#fail(error);
		}
	}

	/**
	 * Show the capture screen. On a full document, a notice over it says that no page
	 * can be added.
	 */
	#enterCapture(): Promise<void> {
		// Before the move, which does nothing while capture already shows.
		if (this.#isFull()) this.#present(noticeOverlay(this.#settings.strings, "pageLimitNotice"));
		return this.#enter({ kind: "capture" }, this.#containers.capture, (screen) =>
			this.#capture.mount(
				screen,
				this.#pressHandler("capture"),
				async ({ image, boundary }) => {
					await this.#storePage(image, "camera", boundary, () => this.#captureOrMoveOn());
				},
				// An automatic take runs as an action of its own, and is no press.
				() => this.#runIfIdle(() => this.#capture.takePage()),
			),
		);
	}

	/**
	 * Store an image file as a page, in the same way as a photograph, once the
	 * engines have loaded, and then go `onward`. Resolve to whether the page went on,
	 * into the document or to the rectify screen. A file that the browser cannot open
	 * as an image shows a notice, at once. A full document takes no page.
	 */
	async #loadImage(file: Blob, onward: () => Promise<void>): Promise<boolean> {
		if (this.#hasEnded() || this.#isFull()) return false;
		const original = await originalFromFile(file).catch(() => null);
		if (!original) {
			this.#present(noticeOverlay(this.#settings.strings, "fileError"));
			return false;
		}
		await this.#loading;
		// The file took time to read, so the session may have ended or filled meanwhile.
		if (this.#hasEnded() || this.#isFull()) return false;
		return this.#storePage(original, "file", this.#ready.findBoundary(original), onward);
	}

	/**
	 * Store a page just taken or loaded, with the boundary `found` on it, and resolve
	 * to whether it went on. With rectify after capture on, the rectify screen opens
	 * on it first, and the page goes in only if the user keeps it. Once the page is
	 * in, the session goes `onward`. A page that cannot go in shows a notice, and the
	 * session stays where it is.
	 */
	async #storePage(
		original: Blob,
		origin: PageOrigin,
		found: Quadrilateral | null | Promise<Quadrilateral | null>,
		onward: () => Promise<void>,
	): Promise<boolean> {
		if (this.#hasEnded() || this.#isFull()) return false;
		if (!this.#settings.phases.rectify?.afterCapture) {
			await this.#addPage(original, origin, found);
			await onward();
			return true;
		}
		const boundary = await found;
		// The rectify screen could not show the image, and the session would fail.
		if (!(await isReadable(original))) {
			this.#present(noticeOverlay(this.#settings.strings, "pageError"));
			return false;
		}
		await this.#enterRectify("afterCapture", async () => ({ image: original, boundary }), {
			keep: (chosen) => this.#addPage(original, origin, chosen),
			onward,
			// A page reaches this screen only while the document has room.
			back: () => this.#enterCapture(),
		});
		return true;
	}

	/**
	 * Add a page to the document, rectified to `boundary` once it is known. The page
	 * belongs to the session from here, so a cancel drops it with the rest, and any
	 * other end keeps it, as it keeps the pages before it. `finish()` waits for it.
	 */
	#addPage(
		original: Blob,
		origin: PageOrigin,
		boundary: Quadrilateral | null | Promise<Quadrilateral | null>,
	): Promise<void> {
		const add = async (): Promise<void> => {
			const found = await boundary;
			if (this.#wasCancelled()) return;
			const { document } = this.#ready;
			let pageUid: string;
			try {
				pageUid = await document.add(original, origin, found);
			} catch (thrown) {
				// The user must learn that the page is lost. Each caller decides what comes next.
				this.#present(noticeOverlay(this.#settings.strings, "pageError"));
				throw thrown;
			}
			if (this.#wasCancelled()) {
				document.remove(pageUid);
				return;
			}
			this.#reportAdded([pageUid]);
			// Its undo takes the page out, and its redo puts it back.
			this.#record(inverse(this.#pagesOut([pageUid])));
		};
		const adding = add();
		this.#adding = adding;
		return adding;
	}

	/**
	 * Delete the pages chosen on the edit screen, as one change. The screen stays up,
	 * even when the document is empty, so that undo can bring the pages back.
	 */
	#deletePages(): void {
		const { document } = this.#ready;
		// The selection may come in any order, but the undo and redo rules need document order.
		const [first, ...rest] = this.#ready.edit
			.chosenPages()
			.sort((a, b) => document.order.indexOf(a) - document.order.indexOf(b));
		if (first === undefined) return;
		const change = this.#pagesOut([first, ...rest]);
		void change.redo();
		this.#record(change);
	}

	/** Turn the page the edit screen shows a quarter turn to the left. */
	#rotatePage(): void {
		const pageUid = this.#ready.edit.currentPage();
		if (!pageUid) return;
		const { document, edit } = this.#ready;
		const before = document.rotationOf(pageUid);
		edit.rotate(pageUid, -90);
		this.#reportEdited(pageUid);
		const after = document.rotationOf(pageUid);
		// The angles themselves, because a new boundary in between resets the angle.
		const turn = (angle: number) => () => {
			this.#turnTo(pageUid, angle);
			this.#reportEdited(pageUid);
			return pageUid;
		};
		this.#record({ undo: turn(before), redo: turn(after) });
	}

	/**
	 * Turn a page to `angle`, in degrees clockwise, whatever angle it has now.
	 * Document Viewer turns a page only through a viewer. The edit screen's
	 * viewer exists whenever a page can turn, so the session turns it there.
	 */
	#turnTo(pageUid: string, angle: number): void {
		const turn = (((angle - this.#ready.document.rotationOf(pageUid)) % 360) + 360) % 360;
		if (turn !== 0) this.#ready.edit.rotate(pageUid, turn);
	}

	/**
	 * Set a page's boundary, and keep its rotation, which the new image would reset.
	 * Return the boundary the page had, or `undefined` when it already had this one.
	 */
	#setBoundary(
		pageUid: string,
		boundary: Quadrilateral | null,
	): Promise<Quadrilateral | undefined> {
		return this.#keepingRotation(pageUid, () =>
			this.#ready.document.setBoundary(pageUid, boundary),
		);
	}

	/**
	 * Set a page's filter, and keep its rotation. Return the filter the page had, or
	 * `undefined` when it already had this one.
	 */
	#setFilter(pageUid: string, filter: FilterName): Promise<FilterName | undefined> {
		return this.#keepingRotation(pageUid, () => this.#ready.document.setFilter(pageUid, filter));
	}

	/**
	 * Run `change`, which replaces a page's image and returns what it replaced, or
	 * `undefined` when it changed nothing. The engine resets a new image's rotation,
	 * so the page turns back to the angle it had.
	 */
	async #keepingRotation<T>(
		pageUid: string,
		change: () => Promise<T | undefined>,
	): Promise<T | undefined> {
		const angle = this.#ready.document.rotationOf(pageUid);
		const before = await change();
		if (before === undefined) return before;
		this.#turnTo(pageUid, angle);
		this.#reportEdited(pageUid);
		return before;
	}

	/** The mode open on the edit screen, or `null` when none is. */
	#editMode(): FilterMode | null {
		return this.#phase.kind === "edit" ? this.#phase.mode : null;
	}

	/** Open the filter mode on the page the edit screen shows. */
	async #openFilterMode(): Promise<void> {
		const pageUid = this.#ready.edit.currentPage();
		if (!pageUid || this.#phase.kind !== "edit" || this.#phase.mode) return;
		const { filter } = await this.#ready.document.recordOf(pageUid);
		if (this.#hasEnded()) return;
		this.#setPhase({
			kind: "edit",
			mode: { name: "filter", pageUid, entry: filter, chosen: filter },
		});
		await this.#ready.edit.openFilterMode(pageUid, filter);
	}

	/** Keep a step of the edit screen's mode as the one under way, for `finish()`. */
	#runModeStep(step: Promise<unknown>): Promise<unknown> {
		this.#modeStep = step;
		return step;
	}

	/**
	 * Show the page of the filter mode under `filter`. If that fails, the page stays
	 * as it was.
	 */
	async #chooseFilter(filter: FilterName): Promise<void> {
		const mode = this.#editMode();
		if (!mode || filter === mode.chosen) return;
		try {
			await this.#setFilter(mode.pageUid, filter);
		} catch (thrown) {
			reportFault("this filter could not be applied", thrown);
			return;
		} finally {
			// A filter on show is no change in the history.
			this.#sendReports();
		}
		if (this.#hasEnded()) return;
		this.#setPhase({ kind: "edit", mode: { ...mode, chosen: filter } });
		this.#ready.edit.showFilter(filter);
	}

	/**
	 * Close the edit screen's mode, and resolve to whether no mode is open. Apply
	 * keeps what the mode changed, as one change in the history. Cancel takes it
	 * back, and if that fails, the mode stays open.
	 */
	async #closeMode(apply: boolean): Promise<boolean> {
		const mode = this.#editMode();
		if (!mode) return true;
		const { pageUid, entry, chosen } = mode;
		if (chosen !== entry && apply) {
			this.#record({
				undo: this.#pageStep(pageUid, () => this.#setFilter(pageUid, entry)),
				redo: this.#pageStep(pageUid, () => this.#setFilter(pageUid, chosen)),
			});
		} else if (chosen !== entry) {
			try {
				await this.#setFilter(pageUid, entry);
			} catch (thrown) {
				reportFault("this filter could not be taken back", thrown);
				return false;
			} finally {
				this.#sendReports();
			}
			if (this.#hasEnded()) return true;
		}
		this.#setPhase({ kind: "edit", mode: null });
		this.#ready.edit.closeMode();
		return true;
	}

	/** Record the reorder that a drag in the edit screen's thumbnails made. */
	#pagesReordered({ before, after }: PageOrders): void {
		const { document } = this.#ready;
		// The first page that moved, as the order stands after the step. The caller reports
		// only a drag that changed the order, so `first` is never -1.
		const first = before.findIndex((pageUid, index) => pageUid !== after[index]);
		const arrange = (order: readonly string[]) => () => {
			document.arrange(order);
			this.#report((state) => ({ type: "pagesReordered", state }));
			return order[first];
		};
		this.#report((state) => ({ type: "pagesReordered", state }));
		this.#record({ undo: arrange(before), redo: arrange(after) });
	}

	/**
	 * The change that takes pages out of the document, in document order. Redo sets
	 * each page aside and remembers its index, and undo puts each back at that index.
	 */
	#pagesOut(pageUids: readonly [string, ...string[]]): Change {
		const { document } = this.#ready;
		let aside: { readonly pageUid: string; readonly index: number }[] = [];
		return {
			// In reverse, so that each page goes back to the index it had as it went out.
			// The pages that come back show the first of them, in document order.
			undo: () => {
				for (const { pageUid, index } of [...aside].reverse()) document.putBack(pageUid, index);
				this.#reportAdded(pageUids);
				return pageUids[0];
			},
			// The page that moves into the place of the first page set aside shows, or else the last page.
			redo: () => {
				// The first page goes out first, so its place is its index now.
				const place = document.order.indexOf(pageUids[0]);
				aside = pageUids.map((pageUid) => ({ pageUid, index: document.setAside(pageUid) }));
				const indices = aside.map(({ index }) => index);
				this.#report((state) => ({ type: "pagesRemoved", indices, state }));
				const { order } = document;
				return order[Math.min(place, order.length - 1)];
			},
		};
	}

	/** A history step that runs `step` on a page, and leaves that page in focus. */
	#pageStep(pageUid: string, step: () => Promise<unknown>): () => Promise<string> {
		return async () => {
			await step();
			return pageUid;
		};
	}

	/** Add a change just made to the history, and show what undo and redo can do. */
	#record(change: Change): void {
		this.#history.record(change);
		this.#showHistory();
	}

	/**
	 * Report a change to the host application, once it is complete, with the state
	 * that it leaves. A change is complete when the history moves, in
	 * `#showHistory()`, or else where `#sendReports()` runs: at the end of the
	 * session, and after a filter that the filter mode shows or takes back. `change`
	 * may build its payload later, since a page is read from the document.
	 */
	#report(change: PendingReport): void {
		this.#unsent.push(change);
	}

	/**
	 * Send the changes made so far, each with the state the document is in now, in
	 * order. Each payload starts at once, so a later change cannot reach it.
	 */
	#sendReports(): void {
		if (this.#unsent.length === 0) return;
		const state = this.#documentState();
		for (const change of this.#unsent.splice(0)) {
			const built = (async () => change(state))();
			const report = this.#reporting.then(async () => this.#onDocumentChange(await built));
			this.#reporting = report.catch((thrown) =>
				reportFault("a change to the document could not be reported", thrown),
			);
		}
	}

	/** Report the pages that came into the document. */
	#reportAdded(pageUids: readonly string[]): void {
		const { document } = this.#ready;
		this.#report(async (state) => ({
			type: "pagesAdded",
			pages: await Promise.all(pageUids.map((pageUid) => document.page(pageUid))),
			state,
		}));
	}

	/** Report a page whose image or rotation changed. */
	#reportEdited(pageUid: string): void {
		const { document } = this.#ready;
		this.#report(async (state) => ({
			type: "pageEdited",
			page: await document.page(pageUid),
			state,
		}));
	}

	/** The document as it is now. Only a loaded session changes it. */
	#documentState(): DocumentState {
		const { document, edit } = this.#ready;
		const { pageCount } = document;
		// The rectify screen opened from edit works on the page that edit shows.
		const fromEdit = this.#phase.kind === "rectify" && this.#phase.mode === "fromEdit";
		const showing = this.#phase.kind === "edit" || fromEdit ? edit.currentPage() : null;
		return {
			pageCount,
			currentIndex: showing ? document.order.indexOf(showing) : pageCount - 1,
			undoCount: this.#history.undoCount,
			redoCount: this.#history.redoCount,
		};
	}

	/** Undo or redo a change, show the page it leaves in focus, and show what undo and redo can do then. */
	async #walkHistory(walk: () => Promise<string | undefined>): Promise<void> {
		let shown: string | undefined;
		try {
			shown = await walk();
		} catch (thrown) {
			reportFault("this change could not be taken back or made again", thrown);
		}
		if (shown !== undefined) this.#loaded?.edit.showPage(shown);
		this.#showHistory();
	}

	/**
	 * Turn the edit screen's undo and redo on while each has a change to act on, and
	 * send the reports of the change that moved the history.
	 */
	#showHistory(): void {
		const { undoCount, redoCount } = this.#history;
		this.#loaded?.edit.setHistory(undoCount > 0, redoCount > 0);
		this.#report((state) => ({ type: "historyChanged", state }));
		this.#sendReports();
	}

	/** Open the rectify screen on the page the edit screen shows, and come back to edit. */
	async #rectifyFromEdit(): Promise<void> {
		const pageUid = this.#ready.edit.currentPage();
		if (!pageUid) return;
		const page = async (): Promise<RectifyImage> => {
			const { original, width, height, boundary } = await this.#ready.document.recordOf(pageUid);
			return { image: original, boundary: isWholePage(boundary, width, height) ? null : boundary };
		};
		await this.#enterRectify("fromEdit", page, {
			keep: async (chosen) => {
				const before = await this.#setBoundary(pageUid, chosen);
				if (before === undefined) return;
				this.#record({
					undo: this.#pageStep(pageUid, () => this.#setBoundary(pageUid, before)),
					redo: this.#pageStep(pageUid, () => this.#setBoundary(pageUid, chosen)),
				});
			},
			onward: () => this.#enterEdit(),
			back: () => this.#enterEdit(),
		});
	}

	/**
	 * Show the rectify screen on the image `image` gives. The code that opened it
	 * decides, through `after`, what the user's answer does.
	 */
	#enterRectify(
		mode: RectifyMode,
		image: () => Promise<RectifyImage>,
		after: AfterRectify,
	): Promise<void> {
		return this.#enter(
			{ kind: "rectify", mode, after },
			this.#containers.rectify[mode],
			async (screen) => {
				const shown = await image();
				// Presses wait for a move, so only an end can come while the image is read.
				if (this.#hasEnded()) return;
				await this.#ready.rectify.mount(screen, mode, shown, this.#pressHandler("rectify"));
			},
		);
	}

	/** What the code that opened the rectify screen does with the answer, while it is up. */
	#afterRectify(): AfterRectify | null {
		return this.#phase.kind === "rectify" ? this.#phase.after : null;
	}

	/**
	 * Keep the page on the rectify screen with the chosen boundary, and go onward. If keeping
	 * it fails, the screen stays up, so the user can try again or go back.
	 */
	async #keepPage(boundary: Quadrilateral | null): Promise<void> {
		const after = this.#afterRectify();
		if (!after) return;
		try {
			await after.keep(boundary);
		} catch (thrown) {
			reportFault("this page could not be saved", thrown);
			return;
		}
		await after.onward();
	}

	/** Show the edit screen. */
	#enterEdit(): Promise<void> {
		return this.#enter({ kind: "edit", mode: null }, this.#containers.edit, (screen) =>
			this.#ready.edit.mount(screen, this.#pressHandler("edit"), (orders) =>
				this.#pagesReordered(orders),
			),
		);
	}

	/**
	 * Return a phase's screen in this session's `.mds-scanner` element in
	 * `container`, creating it on first use. Each phase gets its own, because
	 * Document Viewer empties the element it is given. Rectify's screen moves, with
	 * its viewer, when it opens in another container.
	 */
	#screen(phase: PhaseName, container: HTMLElement): HTMLElement {
		let screen = this.#screens.get(phase);
		if (!screen) {
			screen = document.createElement("div");
			screen.className = `mds-screen mds-screen-${phase}`;
			// Hidden until its phase shows. A visible screen takes taps meant for the one
			// below, even when empty.
			screen.hidden = true;
			this.#screens.set(phase, screen);
		}
		const element = this.#elements.getOrCreateIn(container);
		if (screen.parentElement !== element) element.append(screen);
		return screen;
	}

	/**
	 * Show `shown`, one of the screens, and the `.mds-scanner` element it is in, and
	 * hide the others. A screen in another container must not stay covered by the
	 * element over the viewport.
	 */
	#show(shown: HTMLElement): void {
		for (const screen of this.#screens.values()) screen.hidden = screen !== shown;
		this.#elements.showOnlyHolding(shown);
	}
}

/** Whether a scan's pages hold at least one page. */
function hasPages(pages: readonly ScannedPage[]): pages is ScannedPages {
	return pages.length > 0;
}

/** The phase of `state`, or `null` before the first screen and after the end. */
function phaseName(state: PhaseState): PhaseName | null {
	return state.kind === "none" || state.kind === "ended" ? null : state.kind;
}

/** The mode that `state` shows, with its phase, or `null` for none. */
function modeOf(
	state: PhaseState,
): { readonly phase: "rectify" | "edit"; readonly mode: ModeName } | null {
	if (state.kind === "rectify") return { phase: "rectify", mode: state.mode };
	if (state.kind === "edit" && state.mode) return { phase: "edit", mode: state.mode.name };
	return null;
}

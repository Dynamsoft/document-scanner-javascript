import { reportFault } from "../faults";
import type { Quadrilateral } from "../results";
import { isDocumentFull } from "../settings/settings";
import type { ResolvedSettings } from "../settings/settings";
import { CaptureScreen } from "./capture-screen";
import type { PressAction } from "../ui/availability";
import type { CapturePress } from "./capture-screen";
import { Camera } from "../camera/camera";
import type { CameraList, EngineCameraModule } from "../camera/camera";
import type { Detector, FindBoundary } from "../boundaries/detection";
import type { LoadedEngines } from "../engines/engines";
import type { RectifyImage } from "./rectify";
import { chooseOriginal } from "../camera/original";
import type { CapturedImages } from "../camera/original";
import { hintFor } from "../boundaries/hint";
import { Watcher } from "../boundaries/watcher";

// The capture phase. It joins the screen, the camera, and auto-capture.

/** One visit to the capture screen, from `mount()` until `unmount()` or `release()`. */
interface Visit {
	/** Where every press on the screen is reported. */
	readonly onPress: PressHandler;
	readonly store: StorePage;
	readonly autoTake: AutoTake;
	/** Set as soon as the screen starts to close. Its buttons and auto-capture check it and stop. */
	ended: boolean;
	/** Whether a file picked on this visit still loads, which the screen draws as a photograph. */
	loadingFile: boolean;
}

/**
 * What the camera is doing, for the screen only. A spinner shows over the
 * viewfinder while a photograph freezes it, and the torch is hidden while the
 * camera switches. The session holds the controls off meanwhile.
 */
type CameraBusy = "no" | "photographing" | "switching";

/**
 * The phase's state once its screen is built, before the engines have arrived. A
 * visit can begin here, so cancel works while the engines load.
 */
interface BuiltState {
	readonly kind: "built";
	readonly screen: CaptureScreen;
	visit: Visit | null;
}

/**
 * The phase's state once its camera exists, open or not. The screen lives here,
 * because the engine keeps one element for the camera's life.
 */
interface AcquiredState {
	readonly kind: "acquired";
	readonly camera: Camera;
	readonly screen: CaptureScreen;
	readonly watcher: Watcher;
	readonly detector: CaptureEngines["detector"];
	readonly findBoundary: FindBoundary;
	readonly document: ThumbnailSource;
	/** Whether auto-capture is on. The user's choice holds for the session. */
	autoCapture: boolean;
	/** The switcher's cameras, listed again each time the camera opens. */
	cameras: CameraList;
	busy: CameraBusy;
	visit: Visit | null;
}

/**
 * Everything the phase owns, in each of its states. One `AcquiredState` lasts as
 * long as its camera, and a step compares it across an `await` to tell whether it
 * still holds.
 */
type CaptureState =
	| { readonly kind: "idle" }
	| BuiltState
	| AcquiredState
	| { readonly kind: "disposed" };

const DISPOSED = "This capture phase is disposed; construct a new one";

/** The switcher's cameras before a camera has opened. */
const NO_CAMERAS: CameraList = { options: [], active: undefined };

/** The members of the scanned document that the capture screen's thumbnail reads. */
export interface ThumbnailSource {
	readonly pageCount: number;
	readonly lastPageUid: string | undefined;
	thumbnail(uid: string): Promise<Blob>;
}

/**
 * What the capture phase needs from the engines. They may arrive after the phase,
 * so its screen can be built before them.
 */
export interface CaptureEngines {
	readonly engines: {
		readonly captureVision: EngineCameraModule;
		readonly router: Pick<LoadedEngines["router"], "setInput">;
	};
	/** Finds the page in each camera frame. */
	readonly detector: Pick<Detector, "start" | "stop">;
	/**
	 * Finds the page on an image captured from the camera. It shares the detector
	 * above, which runs one detection at a time and keeps them apart from the
	 * camera's frames.
	 */
	readonly findBoundary: FindBoundary;
	readonly document: ThumbnailSource;
}

/** Where the capture screen reports each button pressed. */
type PressHandler = (press: CapturePress) => PressAction;

/**
 * Where the capture phase hands each page it takes, with the boundary of the page
 * found on it. No other page is taken until this one is stored or storing it
 * fails, and a failure is reported as a failed capture.
 */
export type StorePage = (original: RectifyImage) => Promise<void>;

/**
 * Where the capture phase asks for a page when auto-capture finds one ready. The
 * session runs `takePage()` for it as an action, or ignores it while another runs.
 */
export type AutoTake = () => void;

/** The capture phase. It runs the capture screen, the camera, and auto-capture. */
export class CapturePhase {
	readonly #settings: ResolvedSettings;
	readonly #engines: Promise<CaptureEngines>;
	#state: CaptureState = { kind: "idle" };
	#queue: Promise<unknown> = Promise.resolve();
	/** Whether the session holds every control but cancel, while it runs an action. */
	#held = false;
	/** Resolves once the page being taken, if any, has gone to `store` or failed. */
	#handedOver: Promise<void> = Promise.resolve();

	constructor(settings: ResolvedSettings, engines: Promise<CaptureEngines>) {
		this.#settings = settings;
		this.#engines = engines;
		// Only a mount that waits for the engines sees a failed load.
		engines.catch(() => undefined);
	}

	/**
	 * Hold every control but cancel while the session runs an action. The session
	 * ignores presses and automatic takes meanwhile, and the screen marks the
	 * controls unavailable.
	 */
	setControlsHeld(held: boolean): void {
		this.#held = held;
		this.#redraw();
	}

	/** The visit under way, or `null` when the screen is not up. */
	get #visit(): Visit | null {
		const state = this.#state;
		return state.kind === "built" || state.kind === "acquired" ? state.visit : null;
	}

	/**
	 * Attach the screen to `container` and open the camera. The first mount also
	 * builds the screen, and the camera once the engines have loaded. Every press on
	 * the screen goes to `onPress`, each page taken goes to `store`, and auto-capture
	 * asks `autoTake` for a page. If the engines fail to load, it rejects with the
	 * screen still up, for the caller to unmount.
	 */
	async mount(
		container: HTMLElement,
		onPress: PressHandler,
		store: StorePage,
		autoTake: AutoTake,
	): Promise<void> {
		const visit = await this.#queueStep(() =>
			this.#startVisit(container, { onPress, store, autoTake, ended: false, loadingFile: false }),
		);
		// Outside the queue, so leaving the screen never waits for the engines.
		const engines = await this.#engines;
		await this.#queueStep(() => this.#openCamera(visit, engines));
	}

	/**
	 * Leave the screen, which stays in place for the session to hide, and keep the
	 * camera running. Firefox asks for permission again when a closed camera
	 * reopens.
	 */
	unmount(): Promise<void> {
		// The screen's buttons and auto-capture stop immediately, even while a camera
		// step runs.
		this.#endVisit();
		return this.#queueStep(() => this.#leave(false));
	}

	/**
	 * Leave the screen, close the camera, and forget the user's auto-capture choice,
	 * when the session ends.
	 */
	release(): Promise<void> {
		this.#endVisit();
		// The next session starts with its own hold.
		this.#held = false;
		return this.#queueStep(() => this.#leave(true));
	}

	/**
	 * Release the screen and the camera. The phase cannot be used again. Resolves
	 * once the camera is released, after any open or close in flight.
	 */
	async dispose(): Promise<void> {
		this.#endVisit();
		const state = this.#state;
		this.#state = { kind: "disposed" };
		if (state.kind === "built" || state.kind === "acquired") state.screen.detach();
		if (state.kind !== "acquired") return;
		// After any step that started the detector.
		await this.#queueStep(async () => {
			this.#stopWatching(state);
			state.camera.dispose();
		});
	}

	/** End the visit, stopping the screen's buttons and auto-capture immediately. */
	#endVisit(): void {
		const visit = this.#visit;
		if (visit) visit.ended = true;
	}

	/**
	 * Draw the screen from the phase's state and the document, while the screen is
	 * up. It reads only the current state, so any visit may call it.
	 */
	#draw(state: AcquiredState): void {
		if (this.#state !== state || !state.visit) return;
		const { camera, busy, watcher } = state;
		state.screen.draw({
			cameraOpen: state.camera.isOpen,
			held: this.#held,
			full: this.#isFull(state),
			taking:
				busy === "photographing" || state.visit.loadingFile
					? "photograph"
					: watcher.taking
						? "page"
						: "none",
			autoCapture: state.autoCapture,
			torch: busy === "switching" ? "absent" : camera.torch,
			cameras: state.cameras.options,
			activeCamera: state.cameras.active,
			pageCount: state.document.pageCount,
			newestPage: state.document.lastPageUid,
		});
	}

	/** Whether a page can be taken now: the camera is open, and the document has room. */
	#canTake(state: AcquiredState): boolean {
		return state.camera.isOpen && !this.#isFull(state);
	}

	/** Whether the document holds as many pages as `maxPages` allows, so no page is taken. */
	#isFull(state: AcquiredState): boolean {
		return isDocumentFull(this.#settings, state.document.pageCount);
	}

	/**
	 * Run a camera step after any in flight, because the engine misbehaves when two
	 * overlap.
	 */
	#queueStep<T>(step: () => Promise<T>): Promise<T> {
		const result = this.#queue.then(step, step);
		// A failed step must not stall the rest. The caller still gets its rejection.
		this.#queue = result.then(
			() => undefined,
			() => undefined,
		);
		return result;
	}

	/**
	 * Return the screen's state, building the screen on first entry. It works before
	 * the engines load.
	 */
	#buildScreen(): BuiltState | AcquiredState {
		const state = this.#state;
		if (state.kind === "disposed") throw new Error(DISPOSED);
		if (state.kind !== "idle") return state;
		const screen = new CaptureScreen(this.#settings, {
			onPress: (pressed) => this.#onPress(pressed),
			// Thumbnails appear only once there are pages, so after the engines load.
			readPage: async (uid) => (await this.#engines).document.thumbnail(uid),
		});
		const built: BuiltState = { kind: "built", screen, visit: null };
		this.#state = built;
		return built;
	}

	/** Put the capture screen into `container`, and start `visit` on it. */
	async #startVisit(container: HTMLElement, visit: Visit): Promise<Visit> {
		const state = this.#buildScreen();
		this.#endVisit();
		state.visit = visit;
		state.screen.attach(container);
		if (state.kind === "acquired") {
			// Hidden until the camera is open and can report a torch or a second camera.
			state.cameras = NO_CAMERAS;
			this.#draw(state);
		} else {
			this.#drawWaiting(state);
		}
		return visit;
	}

	/**
	 * Draw the screen as it waits for the engines: every control but cancel held, and
	 * the viewfinder's spinner turning. No page exists before the engines load.
	 */
	#drawWaiting(state: BuiltState): void {
		state.screen.draw({
			cameraOpen: false,
			held: true,
			full: false,
			taking: "none",
			autoCapture: this.#settings.phases.capture.autoCapture,
			torch: "absent",
			cameras: [],
			activeCamera: undefined,
			pageCount: 0,
			newestPage: undefined,
		});
	}

	/**
	 * Return the acquired state, creating the camera around the screen and the
	 * watcher on first entry, once the engines have loaded.
	 */
	async #acquireCamera(state: BuiltState, loaded: CaptureEngines): Promise<AcquiredState> {
		const { engines, detector, findBoundary, document } = loaded;
		const camera = await Camera.create(engines.captureVision, state.screen.element);
		// A dispose() during the await wins. The camera it missed is released here.
		if (this.#state !== state) {
			camera.dispose();
			throw new Error(DISPOSED);
		}
		state.screen.markEngineLayer(camera.video);
		// The camera stays the router's input through every visit and reopen.
		engines.router.setInput(camera.input);
		const capture = this.#settings.phases.capture;
		const acquired: AcquiredState = {
			kind: "acquired",
			camera,
			screen: state.screen,
			watcher: new Watcher(capture),
			detector,
			findBoundary,
			document,
			autoCapture: capture.autoCapture,
			cameras: NO_CAMERAS,
			busy: "no",
			visit: state.visit,
		};
		this.#state = acquired;
		return acquired;
	}

	/** Open the camera for `visit`, unless the screen came down while the engines loaded. */
	async #openCamera(visit: Visit, loaded: CaptureEngines): Promise<void> {
		const current = this.#state;
		if (visit.ended || (current.kind !== "built" && current.kind !== "acquired")) return;
		const state =
			current.kind === "acquired" ? current : await this.#acquireCamera(current, loaded);
		// The screen may have come down while the camera was created.
		if (visit.ended) return;
		this.#draw(state);
		await state.camera.open();
		// The torch is drawn once the camera is open and can say whether it has one.
		this.#draw(state);
		// The mount ends here, so the controls come on with the camera. Watch first,
		// because the lens list costs a round trip to the browser.
		void this.#queueStep(async () => {
			if (visit.ended) return;
			await this.#watch(state, visit);
			if (visit.ended) return;
			await this.#listCameras(state);
		}).catch((thrown) => reportFault("the cameras could not be listed", thrown));
	}

	/**
	 * Leave the screen in place, with its camera running and its torch off. With
	 * `release`, take the screen down, close the camera, and forget the user's
	 * auto-capture choice.
	 */
	async #leave(release: boolean): Promise<void> {
		const state = this.#state;
		if (state.kind !== "built" && state.kind !== "acquired") return;
		this.#endVisit();
		if (state.kind === "acquired") {
			this.#stopWatching(state);
			// The user's choice lasts only for the session.
			if (release) state.autoCapture = this.#settings.phases.capture.autoCapture;
			// The video stays on the page and plays on. WebKit on iOS draws a camera
			// video that starts again smaller than its box, and no event says when a
			// layout would fix it.
			await (release ? state.camera.close() : state.camera.darken());
		}
		if (release) state.screen.detach();
		state.visit = null;
	}

	/** Pass a press on to the press handler that `mount()` was given, while the screen is up. */
	#onPress(pressed: CapturePress): PressAction {
		const visit = this.#visit;
		return visit && !visit.ended ? visit.onPress(pressed) : undefined;
	}

	/** List the open camera's choices for the switcher, and draw them. */
	async #listCameras(state: AcquiredState): Promise<void> {
		state.cameras = await state.camera.listCameras();
		this.#draw(state);
	}

	/** Switch to the chosen camera and redraw the screen. */
	switchCamera(id: string): Promise<void> {
		// Judged at the press, since the step may wait behind another.
		const pressed = this.#state;
		if (pressed.kind !== "acquired" || !pressed.visit) return Promise.resolve();
		return this.#queueStep(async () => {
			const state = this.#state;
			if (state.kind !== "acquired" || !state.visit) return;
			state.busy = "switching";
			this.#draw(state);
			// Another camera frames the page differently.
			this.#forgetFrames(state);
			try {
				await state.camera.switchTo(id);
			} finally {
				state.busy = "no";
				this.#draw(state);
				await this.#listCameras(state);
			}
		});
	}

	/**
	 * Start finding the page in each frame. A detector that fails to start costs the
	 * outline and auto-capture.
	 */
	async #watch(state: AcquiredState, visit: Visit): Promise<void> {
		try {
			await state.detector.start((boundary) => this.#onFrame(state, visit, boundary));
		} catch (thrown) {
			reportFault("the document detector could not be started", thrown);
		}
	}

	/** Stop watching and forget what was seen. */
	#stopWatching(state: AcquiredState): void {
		state.detector.stop();
		this.#forgetFrames(state);
	}

	/** Forget the frames seen, and erase the outline and the hint drawn from them. */
	#forgetFrames(state: AcquiredState): void {
		state.watcher.forget();
		state.screen.clearBoundary();
		state.screen.clearHint();
	}

	/**
	 * Outline the page found in a frame, and ask for it if auto-capture is on and the
	 * watcher says so. The corners are in the frame's pixels, matching `frameSize`.
	 * The watcher judges the framing against the scan region, or the whole frame.
	 * While only the framing keeps auto-capture from taking the page, a hint says how
	 * to move.
	 */
	#onFrame(state: AcquiredState, visit: Visit, boundary: Quadrilateral | null): void {
		// A frame after the screen came down has nothing to draw on.
		if (state.visit !== visit) return;
		const size = state.camera.frameSize;
		const { take, waitsFor } = state.watcher.see(
			boundary,
			size,
			state.screen.measureScanRegion(size),
		);
		if (boundary) state.screen.drawBoundary(boundary, size);
		else state.screen.clearBoundary();
		// The hint would mislead while something else keeps auto-capture from taking it.
		const armed = state.autoCapture && !this.#held && this.#canTake(state) && !state.watcher.taking;
		const hint = armed ? hintFor(waitsFor) : null;
		if (hint) state.screen.drawHint(hint);
		else state.screen.clearHint();
		if (take && state.autoCapture) visit.autoTake();
	}

	/**
	 * Take a page, hand it over to be stored, and draw it on the thumbnail. A call
	 * does nothing while the screen is down, the camera is closed, the document is
	 * full, or a page is still on its way.
	 */
	async takePage(): Promise<void> {
		const state = this.#state;
		const visit = this.#visit;
		if (state.kind !== "acquired" || !visit || visit.ended) return;
		if (!this.#canTake(state) || !state.watcher.take()) return;
		// A spinner shows on the thumbnail until the page is in.
		this.#draw(state);
		let handOver!: () => void;
		this.#handedOver = new Promise((resolve) => (handOver = resolve));
		let stored = false;
		try {
			const captured = await this.#captureImages(state);
			// Outside the camera's queue, so the camera moves on while the page is found.
			// The screen can come down meanwhile, and the session decides what an end
			// does with the page.
			const storing = visit.store(await chooseOriginal(captured, state.findBoundary));
			// Before the store finishes, since with rectify after capture on, the store
			// waits for the session to finish.
			handOver();
			await storing;
			stored = true;
		} catch (thrown) {
			// A failure loses only this page.
			// TODO: end the session when the camera is lost, once the document scanner
			// can tell that apart from a failed capture.
			reportFault("this page could not be captured", thrown);
		} finally {
			handOver();
			state.watcher.finishTaking(stored);
			this.#draw(state);
		}
	}

	/**
	 * Resolve once the page being taken, if any, has gone to the `store` that
	 * `mount()` was given, or failed. The session waits on this before it finishes.
	 */
	pageHandedOver(): Promise<void> {
		return this.#handedOver;
	}

	/** Capture the images of one page at the best quality this browser can manage. */
	#captureImages(state: AcquiredState): Promise<CapturedImages> {
		// Queued, like every camera step.
		return this.#queueStep(async () => {
			if (this.#state !== state) throw new Error("The camera is not open");
			try {
				// Only a photograph freezes the viewfinder. A frame is taken immediately.
				return await state.camera.captureImages(() => {
					state.busy = "photographing";
					this.#draw(state);
				});
			} finally {
				state.busy = "no";
				this.#draw(state);
			}
		});
	}

	/**
	 * Open the file picker for one image, and resolve with the file chosen, or with
	 * `null` when the picker closes with no file or the screen is not built.
	 */
	async pickImage(): Promise<File | null> {
		const state = this.#state;
		if (state.kind !== "built" && state.kind !== "acquired") return null;
		return state.screen.pickImage();
	}

	/**
	 * Run `load`, the reading of a file that the user picked, and show the spinners of
	 * a photograph on this visit until it settles. A later visit shows none of them.
	 */
	async showLoading<T>(load: () => Promise<T>): Promise<T> {
		const visit = this.#visit;
		if (visit) visit.loadingFile = true;
		this.#redraw();
		try {
			return await load();
		} finally {
			if (visit) visit.loadingFile = false;
			this.#redraw();
		}
	}

	/** Draw the screen again, once its camera exists. */
	#redraw(): void {
		const state = this.#state;
		if (state.kind === "acquired") this.#draw(state);
	}

	/** Turn auto-capture on or off. The choice holds for the rest of the session. */
	toggleAutoCapture(): void {
		const state = this.#state;
		if (state.kind !== "acquired" || !state.visit) return;
		state.autoCapture = !state.autoCapture;
		this.#draw(state);
	}

	/** Toggle the torch and draw its new state. */
	async toggleTorch(): Promise<void> {
		const state = this.#state;
		if (state.kind !== "acquired" || !state.visit) return;
		await state.camera.toggleTorch();
		this.#draw(state);
	}
}

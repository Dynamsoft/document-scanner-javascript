import { ScannerFault, describe } from "../faults";
import type { FrameSize } from "../boundaries/framing";
import type { TorchState } from "../phases/capture-contract";
import { cameraOptions, mainRearCamera } from "./camera-choice";
import type { CameraOption, ListedCamera } from "./camera-choice";
import { REAR_CAMERA, cameraLadder } from "./camera-constraints";
import type { CameraConstraints } from "./camera-constraints";
import { captureImages } from "./original";
import type { CapturedImages, CapturingCamera } from "./original";

// The camera. It opens, switches lenses, drives the torch, and captures the images
// of a page.

/**
 * The members of Capture Vision's `CameraEnhancer` that `Camera` uses, some
 * narrowed to what it passes and reads. Passing the engine to `create` type-checks
 * that its camera has them all.
 */
export interface EngineCamera extends CapturingCamera {
	shouldCloseWhenNotInDOM: boolean;
	_bTryAnotherCameraWhenFailToOpen: boolean;
	enableEnhancedFeatures(feature: number): void;
	setVideoFit(fit: "fill"): void;
	getVideoElement(): Pick<
		HTMLVideoElement,
		| "srcObject"
		| "videoWidth"
		| "videoHeight"
		| "disablePictureInPicture"
		| "setAttribute"
		| "parentElement"
		| "addEventListener"
		| "style"
		| "offsetHeight"
	> &
		Partial<Pick<HTMLVideoElement, "requestVideoFrameCallback">>;
	getAllDrawingLayers(): readonly { setVisible(visible: boolean): void }[];
	requestCamera(constraints: CameraConstraints): Promise<void>;
	/** Resolves with what was opened. `Camera` ignores it. */
	open(): Promise<unknown>;
	close(): Promise<void>;
	dispose(): void;
	isOpen(): boolean;
	/** Also while the browser has paused the video, or the track has ended. */
	isPaused(): boolean;
	getAllCameras(): Promise<readonly ListedCamera[]>;
	getSelectedCamera(): { readonly deviceId: string };
	readonly isSupportTorch: boolean;
	readonly isTorchOn: boolean | undefined;
	turnOnTorch(): Promise<void>;
	turnOffTorch(): Promise<void>;
}

/** The member of the Capture Vision module that camera setup uses. */
export interface EngineFeatures {
	readonly EnumEnhancedFeatures: { readonly EF_TAP_TO_FOCUS: number };
}

/** The members of the Capture Vision module that `Camera.create` uses. */
export interface EngineCameraModule extends EngineFeatures {
	readonly CameraEnhancer: { createInstance(ui: HTMLElement): Promise<EngineCamera> };
}

/**
 * Track capabilities with a torch. The DOM types omit it, because only Chromium
 * reports it.
 */
type TorchCapability = MediaTrackCapabilities & { torch?: boolean };

/** The cameras the switcher offers. */
export interface CameraList {
	readonly options: readonly CameraOption[];
	/** The entry matching the open camera, or `undefined` if none does. */
	readonly active: string | undefined;
}

/**
 * The capture screen's camera. Calls that change its state must not overlap,
 * because the engine misbehaves when they do.
 */
export class Camera {
	readonly #camera: EngineCamera;
	/** The request for the camera that is open, or opens next, size included. */
	#request: CameraConstraints = REAR_CAMERA;
	/**
	 * The request the search for the largest size and the main lens settled on, or
	 * `null` until it has. Later opens skip the search, and each session starts on
	 * this request again. A search where the main lens failed to open settles
	 * nothing, so the next session searches again.
	 */
	#home: CameraConstraints | null = null;
	/** The switcher's last options, each with the constraints that open it. */
	#options: readonly CameraOption[] = [];
	/**
	 * Whether a track has reported that it faces the rear. A desktop webcam can
	 * report that it faces the user, but a desktop has no rear camera to flip to.
	 */
	#rearSeen = false;
	/** Whether the torch should be lit whenever the camera is open. */
	#torchWanted = false;
	/** The track whose camera claimed a torch and then refused to light it. */
	#refusedTrack: MediaStreamTrack | undefined;
	/** Whether the torch is switching. Presses meanwhile are ignored. */
	#torchBusy = false;

	/**
	 * Create the engine's camera around the capture screen's element. The engine's
	 * default screen comes from a package the document scanner does not deploy.
	 */
	static async create(engine: EngineCameraModule, ui: HTMLElement): Promise<Camera> {
		return new Camera(await engine.CameraEnhancer.createInstance(ui), engine);
	}

	/** Set up an engine camera for the capture screen. */
	constructor(camera: EngineCamera, engine: EngineFeatures) {
		this.#camera = camera;
		// The engine would close the camera when its element leaves the DOM. `Camera`
		// closes it itself.
		camera.shouldCloseWhenNotInDOM = false;
		// Stop the engine from trying the default camera on a refusal. The size ladder
		// needs the refusal.
		camera._bTryAnotherCameraWhenFailToOpen = false;
		// Firefox and Safari have no manual focus and ignore this.
		camera.enableEnhancedFeatures(engine.EnumEnhancedFeatures.EF_TAP_TO_FOCUS);
		// "fill" turns off the engine's object-fit emulation. Firefox and Chromium
		// render it differently, and capture.css fits the video.
		camera.setVideoFit("fill");
		// Picture-in-picture would keep the viewfinder running over other apps.
		const video = camera.getVideoElement();
		video.disablePictureInPicture = true;
		video.setAttribute("disablepictureinpicture", "");
		// WebKit on iOS draws a camera video that opens smaller than its box, until
		// the next layout (WebKit bug 260195). A layout at its first frame fixes it.
		// Safari has requestVideoFrameCallback since 15.4, and Firefox since 132.
		video.addEventListener("playing", () =>
			video.requestVideoFrameCallback?.(() => layOutAgain(video)),
		);
		// The engine's outline assumes the video fills its box, so the document
		// scanner draws its own.
		for (const layer of camera.getAllDrawingLayers()) layer.setVisible(false);
	}

	/** The engine's camera, for the router's input. */
	get input(): EngineCamera {
		return this.#camera;
	}

	/** Whether frames are coming. The engine counts a paused camera as open. */
	get isOpen(): boolean {
		return this.#camera.isOpen() && !this.#camera.isPaused();
	}

	/** The engine's video element, from which the screen finds the engine's layer. */
	get video(): Pick<HTMLVideoElement, "parentElement"> {
		return this.#camera.getVideoElement();
	}

	/** The size of the frames, or zeroes while the camera is closed. */
	get frameSize(): FrameSize {
		const video = this.#camera.getVideoElement();
		return { width: video.videoWidth, height: video.videoHeight };
	}

	/**
	 * Open the camera, relighting the torch if it was on. A paused camera resumes
	 * where it was. A closed one opens on the request the search settled on, or
	 * searches again for the largest size and the main rear lens if it never settled.
	 * A refusal of the browser rejects as a `cameraPermission` or `cameraUnavailable`
	 * fault.
	 */
	async open(): Promise<void> {
		try {
			// The engine counts a paused camera as open.
			if (this.#home || this.#camera.isOpen()) await this.#camera.open();
			else {
				await this.#openBest(REAR_CAMERA);
				if (await this.#openMainRearCamera()) this.#home = this.#request;
			}
		} catch (thrown) {
			throw cameraFault(thrown);
		}
		await this.#relight();
	}

	/**
	 * Capture the images of one page: the frame, and a photograph where the camera
	 * gives a larger one. `onPhotographing` is called only when a photograph is
	 * taken, because that freezes the frames.
	 */
	async captureImages(onPhotographing: () => void): Promise<CapturedImages> {
		if (!this.#camera.isOpen()) throw new Error("The camera is not open");
		return captureImages(this.#camera, onPhotographing);
	}

	/**
	 * Close the camera at the end of the session, and forget the torch was on and
	 * any camera the user switched to, so the next session starts on the camera the
	 * search settled on, at the size it measured.
	 */
	async close(): Promise<void> {
		this.#torchWanted = false;
		await this.darken();
		await this.#camera.close();
		if (!this.#home) return;
		// A closed camera only notes the request, and its next open uses it.
		await this.#camera.requestCamera(this.#home);
		this.#request = this.#home;
	}

	/** Release the camera. It cannot be used again. */
	dispose(): void {
		this.#camera.dispose();
	}

	/**
	 * The torch of the open camera. It is read from the track, because the
	 * engine's answer is blank while a camera is open. The engine's guess also
	 * counts, because WebKit lights a torch it does not report.
	 */
	get torch(): TorchState {
		const track = this.#track;
		const offered = capabilitiesOf(track).torch === true || this.#camera.isSupportTorch;
		if (!this.isOpen || !track || !offered) return "absent";
		if (track === this.#refusedTrack) return "refused";
		return this.#camera.isTorchOn === true ? "on" : "off";
	}

	/**
	 * Switch the torch, keeping the choice for the session on every camera with one.
	 * Does nothing while it is switching, absent, or refused.
	 */
	async toggleTorch(): Promise<void> {
		const torch = this.torch;
		if (this.#torchBusy || (torch !== "on" && torch !== "off")) return;
		this.#torchWanted = torch === "off";
		await this.#switchTorch(this.#torchWanted);
	}

	/**
	 * List the switcher's options and which one is open. The options flip sides only
	 * once a camera has faced the rear. Call it only while a camera is open, or the
	 * engine probes every device and Firefox prompts for each.
	 */
	async listCameras(): Promise<CameraList> {
		const cameras = await this.#camera.getAllCameras();
		const facing = this.#track?.getSettings().facingMode;
		if (facing === "environment") this.#rearSeen = true;
		const options = cameraOptions(cameras, this.#rearSeen ? facing : undefined);
		this.#options = options;
		const open = this.#camera.getSelectedCamera().deviceId;
		return { options, active: options.find((o) => o.id === facing || o.id === open)?.id };
	}

	/**
	 * Open the camera for an entry of the last list, ignoring an unknown one. If the
	 * new camera refuses, the previous one reopens and the error is rethrown.
	 */
	async switchTo(id: string): Promise<void> {
		const selector = this.#options.find((option) => option.id === id)?.selector;
		if (!selector) return;
		const previous = this.#request;
		await this.#camera.close();
		try {
			await this.#openBest(selector);
		} catch (cause) {
			// In use, unplugged, or refusing every size. The previous camera opened with
			// this request moments ago, so it needs no new search.
			// TODO: a camera lost mid-session has no way to say so.
			await this.#camera.requestCamera(previous);
			await this.#camera.open();
			throw cause;
		} finally {
			await this.#relight();
		}
	}

	/** The track the camera is running on, or undefined while it is closed. */
	get #track(): MediaStreamTrack | undefined {
		const source = this.#camera.getVideoElement().srcObject;
		return source instanceof MediaStream ? source.getVideoTracks()[0] : undefined;
	}

	/** Relight the torch if it was on and this camera has one. */
	async #relight(): Promise<void> {
		if (this.#torchWanted && this.torch === "off") await this.#switchTorch(true);
	}

	/** Switch the torch, remembering the track if it refuses to light. */
	async #switchTorch(on: boolean): Promise<void> {
		this.#torchBusy = true;
		try {
			await (on ? this.#camera.turnOnTorch() : this.#camera.turnOffTorch());
		} catch {
			if (on) this.#refusedTrack = this.#track;
		} finally {
			this.#torchBusy = false;
		}
	}

	/**
	 * Turn the torch off, and light it again on the next `open()` if it was on. A
	 * track keeps it lit until the track stops.
	 */
	async darken(): Promise<void> {
		if (this.#camera.isTorchOn) await this.#camera.turnOffTorch().catch(() => undefined);
	}

	/**
	 * Open the camera a selector names at the largest size it accepts. Browsers do
	 * not list a camera's sizes. Each size is tried, largest first.
	 *
	 * TODO: support the `resolution` setting, replacing the top entry.
	 */
	async #openBest(selector: CameraConstraints): Promise<void> {
		const ladder = cameraLadder();
		for (const [rung, constraints] of ladder.entries()) {
			const request = { ...selector, ...constraints };
			try {
				await this.#camera.requestCamera(request);
				await this.#camera.open();
				this.#request = request;
				return;
			} catch (cause) {
				const last = rung === ladder.length - 1;
				if (last || (cause as { name?: string } | null)?.name !== "OverconstrainedError") {
					throw cause;
				}
			}
		}
	}

	/**
	 * Move to the main rear lens if the first open landed on another. Labels need an
	 * open camera, and only Chromium on Android names the main lens. Returns `false`
	 * when the main lens failed to open and another lens opened instead.
	 */
	async #openMainRearCamera(): Promise<boolean> {
		const main = mainRearCamera(await this.#camera.getAllCameras());
		if (main === undefined || main === this.#camera.getSelectedCamera().deviceId) return true;
		await this.#camera.close();
		try {
			await this.#openBest({ deviceId: { exact: main } });
			return true;
		} catch {
			// In use, or refusing every size. A worse lens beats no viewfinder.
			await this.#openBest(REAR_CAMERA);
			return false;
		}
	}
}

/** What the track says it can do. Firefox before 132 cannot say. */
function capabilitiesOf(track: MediaStreamTrack | undefined): TorchCapability {
	return typeof track?.getCapabilities === "function" ? track.getCapabilities() : {};
}

/** Lay `element` out again, in one task, so that no frame shows it hidden. */
function layOutAgain(element: Pick<HTMLElement, "style" | "offsetHeight">): void {
	const { display } = element.style;
	element.style.display = "none";
	void element.offsetHeight;
	element.style.display = display;
}

/**
 * The names of the `DOMException`s with which a browser refuses to open a camera,
 * by the `ScannerError` kind each one means. The camera engine passes them on
 * unchanged.
 */
const CAMERA_REFUSALS: Readonly<Record<string, "cameraPermission" | "cameraUnavailable">> = {
	NotAllowedError: "cameraPermission",
	SecurityError: "cameraPermission",
	NotFoundError: "cameraUnavailable",
	NotReadableError: "cameraUnavailable",
	OverconstrainedError: "cameraUnavailable",
	AbortError: "cameraUnavailable",
};

/** Turn the browser's refusal to open a camera into a fault of its kind. */
function cameraFault(thrown: unknown): unknown {
	const kind = thrown instanceof DOMException && CAMERA_REFUSALS[thrown.name];
	return kind ? new ScannerFault({ kind, message: describe(thrown) }, thrown) : thrown;
}

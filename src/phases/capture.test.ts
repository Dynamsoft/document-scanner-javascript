import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ENGINE, fakeEngineCamera, stubImageCapture } from "../../tests/fake-camera";
import { resolveSettings } from "../settings/settings";
import type { ScannerSettings } from "../settings/settings";
import { DEFAULT_CAPTURE_STRINGS } from "../settings/strings";
import { HINT_CLASS } from "./capture-contract";
import type { Quadrilateral } from "../results";
import type { CapturePress } from "./capture-screen";
import type { EngineCamera } from "../camera/camera";
import { CapturePhase } from "./capture";
import type { CaptureEngines, StorePage } from "./capture";
import type { FindBoundary } from "../boundaries/detection";

// The capture phase over fake engines, a fake camera, and an empty document.

/** A promise and the means to settle it from the test. */
function deferred<T>() {
	let resolve = (_value: T): void => undefined;
	let reject = (_reason: unknown): void => undefined;
	const promise = new Promise<T>((settle, fail) => {
		resolve = settle;
		reject = fail;
	});
	return { promise, resolve, reject };
}

/** The page that the fake detector reports in a frame. It fills half the frame. */
const PAGE: Quadrilateral = {
	points: [
		{ x: 200, y: 100 },
		{ x: 1080, y: 110 },
		{ x: 1070, y: 620 },
		{ x: 210, y: 610 },
	],
};

/** A page that the fake detector reports too far away, in a sixth of the frame's width. */
const FAR: Quadrilateral = {
	points: [
		{ x: 500, y: 300 },
		{ x: 700, y: 300 },
		{ x: 700, y: 450 },
		{ x: 500, y: 450 },
	],
};

/** Phases a test built, and their containers. `afterEach` disposes and removes them. */
const built: { readonly phase: CapturePhase; readonly container: HTMLElement }[] = [];

afterEach(async () => {
	const done = built.splice(0);
	await Promise.all(done.map(({ phase }) => phase.dispose()));
	for (const { container } of done) container.remove();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

/**
 * A capture phase over fake engines. With `loaded: false`, the engines wait for
 * `load()`. With `created: false`, the camera waits for `create()`. Each press is
 * logged in `presses`.
 */
function capturePhase({
	loaded = true,
	created = true,
	camera = fakeEngineCamera(),
	store = async () => undefined,
	findBoundary = async () => null,
	pageCount = 0,
	settings = {},
}: {
	readonly loaded?: boolean;
	readonly created?: boolean;
	readonly camera?: EngineCamera;
	readonly store?: StorePage;
	readonly findBoundary?: FindBoundary;
	/** How many pages the document holds, the newest being `page<count>`. */
	readonly pageCount?: number;
	readonly settings?: ScannerSettings;
} = {}) {
	const creating = deferred<EngineCamera>();
	if (created) creating.resolve(camera);
	const createInstance = vi.fn(() => creating.promise);
	const detector = {
		start: vi.fn(async (_onBoundary: (boundary: Quadrilateral | null) => void) => undefined),
		stop: vi.fn(),
	};
	const thumbnail = vi.fn(async (_uid: string) => new Blob());
	const engines: CaptureEngines = {
		engines: {
			captureVision: { ...ENGINE, CameraEnhancer: { createInstance } },
			router: { setInput: vi.fn() },
		},
		detector,
		findBoundary,
		document: {
			pageCount,
			lastPageUid: pageCount ? `page${pageCount}` : undefined,
			thumbnail,
		},
	};
	const loading = deferred<CaptureEngines>();
	if (loaded) loading.resolve(engines);
	const phase = new CapturePhase(resolveSettings(settings), loading.promise);
	const container = document.body.appendChild(document.createElement("div"));
	built.push({ phase, container });
	const presses: CapturePress[] = [];
	let autoTakes = 0;
	const mount = () =>
		phase.mount(
			container,
			(press) => void presses.push(press),
			store,
			() => autoTakes++,
		);
	return {
		phase,
		container,
		presses,
		mount,
		/** How many times auto-capture asked for a page. */
		autoTakes: () => autoTakes,
		/** Report a frame to the phase, as the detector does. */
		frame: (boundary: Quadrilateral | null) => detector.start.mock.calls.at(-1)![0](boundary),
		createInstance,
		startDetector: detector.start,
		load: () => loading.resolve(engines),
		failLoading: () => loading.reject(new Error("No WebAssembly")),
		thumbnail,
		create: () => creating.resolve(camera),
		/** Find one of the screen's controls by name. */
		control: (name: string) =>
			container.querySelector<HTMLButtonElement>(`[data-mds-button="${name}"]`),
	};
}

describe("before the engines load", () => {
	it("shows its screen and reports presses on it", async () => {
		const { mount, control, presses } = capturePhase({ loaded: false });
		void mount();
		await vi.waitFor(() => expect(control("cancel")).not.toBeNull());
		control("cancel")!.click();
		expect(presses).toEqual([{ button: "cancel" }]);
	});

	it("creates no camera when the screen is left before the engines arrive", async () => {
		const { mount, control, phase, load, createInstance } = capturePhase({ loaded: false });
		const mounted = mount();
		await vi.waitFor(() => expect(control("cancel")).not.toBeNull());
		await phase.unmount();
		load();
		await mounted;
		expect(createInstance).not.toHaveBeenCalled();
	});
});

describe("the camera", () => {
	it("is thrown away when the phase is disposed while it is created", async () => {
		const camera = fakeEngineCamera();
		const { mount, phase, create, createInstance } = capturePhase({ created: false, camera });
		const mounted = mount();
		await vi.waitFor(() => expect(createInstance).toHaveBeenCalled());
		void phase.dispose();
		create();
		await expect(mounted).rejects.toThrow("disposed");
		expect(camera.dispose).toHaveBeenCalled();
	});
});

describe("between visits", () => {
	it("leaves its screen in place, for the session to hide, so that the camera's video stays on the page", async () => {
		const { mount, control, phase } = capturePhase();
		await mount();
		const screen = control("cancel")!.closest(".mds-capture")!;
		const container = screen.parentElement!;
		await phase.unmount();
		expect(screen.isConnected).toBe(true);
		const moves = new MutationObserver(() => undefined);
		moves.observe(container, { childList: true });
		await mount();
		expect(moves.takeRecords()).toEqual([]);
		expect(control("cancel")!.closest(".mds-capture")).toBe(screen);
	});
});

describe("release()", () => {
	it("takes its screen down", async () => {
		const { mount, control, phase } = capturePhase();
		await mount();
		await phase.release();
		expect(control("cancel")).toBeNull();
	});

	it("clears the session's hold and the user's auto-capture choice", async () => {
		const { mount, control, phase } = capturePhase();
		await mount();
		phase.toggleAutoCapture();
		phase.setControlsHeld(true);
		expect(control("autoCapture")?.getAttribute("aria-pressed")).toBe("false");
		expect(control("autoCapture")?.getAttribute("aria-disabled")).toBe("true");
		await phase.release();
		await mount();
		expect(control("autoCapture")?.getAttribute("aria-pressed")).toBe("true");
		expect(control("autoCapture")?.hasAttribute("aria-disabled")).toBe(false);
	});
});

describe("a page on its way", () => {
	it("is handed over before the store finishes storing it", async () => {
		const store = vi.fn(() => new Promise<void>(() => undefined));
		const { mount, phase } = capturePhase({ store });
		await mount();
		void phase.takePage();
		await phase.pageHandedOver();
		expect(store).toHaveBeenCalledTimes(1);
	});

	it("is handed over only once the page is found on it", async () => {
		const finding = deferred<Quadrilateral | null>();
		const store = vi.fn(async () => undefined);
		const { mount, phase } = capturePhase({ store, findBoundary: () => finding.promise });
		await mount();
		void phase.takePage();
		let handedOver = false;
		void phase.pageHandedOver().then(() => (handedOver = true));
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect([handedOver, store.mock.calls.length]).toEqual([false, 0]);
		finding.resolve(null);
		await vi.waitFor(() => expect(handedOver).toBe(true));
		expect(store).toHaveBeenCalledTimes(1);
	});

	it("resolves without storing anything when taking the page fails", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const camera = Object.assign(fakeEngineCamera(), {
			fetchImage: () => {
				throw new Error("no frame");
			},
		});
		const store = vi.fn(async () => undefined);
		const { mount, phase } = capturePhase({ camera, store });
		await mount();
		await phase.takePage();
		await phase.pageHandedOver();
		expect(store).not.toHaveBeenCalled();
	});
});

describe("auto-capture", () => {
	it("leaves the steady page to the session to take", async () => {
		const store = vi.fn(async () => undefined);
		const { mount, frame, autoTakes } = capturePhase({ store });
		await mount();
		await vi.waitFor(() => frame(PAGE));
		for (let seen = 0; seen < 10 && autoTakes() === 0; seen++) frame(PAGE);
		expect(autoTakes()).toBeGreaterThan(0);
		expect(store).not.toHaveBeenCalled();
	});

	it("waits while the page is too far away", async () => {
		const { mount, frame, autoTakes } = capturePhase();
		await mount();
		await vi.waitFor(() => frame(FAR));
		for (let seen = 0; seen < 10; seen++) frame(FAR);
		expect(autoTakes()).toBe(0);
	});

	/** Report `boundary` in `count` frames, as the detector does. */
	const frames = (
		frame: (boundary: Quadrilateral | null) => void,
		boundary: Quadrilateral,
		count: number,
	) => {
		for (let seen = 0; seen < count; seen++) frame(boundary);
	};

	/** The text of the hint in `container`. */
	const hintIn = (container: HTMLElement) => container.querySelector(`.${HINT_CLASS}`)!.textContent;

	it("asks the user to move closer once a page stays too far away for five frames", async () => {
		const { mount, frame, container } = capturePhase();
		await mount();
		await vi.waitFor(() => frame(PAGE));
		frames(frame, FAR, 4);
		expect(hintIn(container)).toBe("");
		frame(FAR);
		expect(hintIn(container)).toBe(DEFAULT_CAPTURE_STRINGS.moveCloser);
		// Brought closer, the page needs no hint.
		frame(PAGE);
		expect(hintIn(container)).toBe("");
	});

	it.each([
		["auto-capture is off", { autoCapture: false }],
		["auto-capture does not wait for the framing", { waitForFraming: false }],
	])("gives no hint while %s", async (_, capture) => {
		const { mount, frame, container } = capturePhase({ settings: { phases: { capture } } });
		await mount();
		await vi.waitFor(() => frame(FAR));
		frames(frame, FAR, 10);
		expect(hintIn(container)).toBe("");
	});

	it("gives no hint while the document is full", async () => {
		const { mount, frame, container } = capturePhase({
			pageCount: 1,
			settings: { maxPages: 1 },
		});
		await mount();
		await vi.waitFor(() => frame(FAR));
		frames(frame, FAR, 10);
		expect(hintIn(container)).toBe("");
	});

	it("takes the hint away when the user turns auto-capture off", async () => {
		const { phase, mount, frame, container } = capturePhase();
		await mount();
		await vi.waitFor(() => frame(FAR));
		frames(frame, FAR, 5);
		expect(hintIn(container)).toBe(DEFAULT_CAPTURE_STRINGS.moveCloser);
		phase.toggleAutoCapture();
		frame(FAR);
		expect(hintIn(container)).toBe("");
	});

	it("takes a page too far away when told to ignore the framing", async () => {
		const { mount, frame, autoTakes } = capturePhase({
			settings: { phases: { capture: { waitForFraming: false } } },
		});
		await mount();
		await vi.waitFor(() => frame(FAR));
		for (let seen = 0; seen < 10 && autoTakes() === 0; seen++) frame(FAR);
		expect(autoTakes()).toBeGreaterThan(0);
	});
});

/** Two cameras with no facing, which the switcher swaps between. */
const TWO_CAMERAS = [
	{ deviceId: "usb", label: "USB Webcam" },
	{ deviceId: "built-in", label: "Integrated Camera" },
];

/** A track that reports a size and a torch. */
const TORCH_TRACK = {
	getSettings: () => ({ width: 1920, height: 1440 }),
	getCapabilities: () => ({ torch: true }) as MediaTrackCapabilities,
} as MediaStreamTrack;

/** Whether the screen outlines a page. */
const outlined = (container: HTMLElement) =>
	container.querySelector(".mds-boundary polygon")?.hasAttribute("points");

/** Wait until the switcher has the cameras: the open lists them once, and the screen again. */
async function camerasListed(camera: ReturnType<typeof fakeEngineCamera>): Promise<void> {
	await vi.waitFor(() => expect(camera.getAllCameras).toHaveBeenCalledTimes(2));
	await new Promise((resolve) => setTimeout(resolve));
}

/**
 * A mounted phase over two listed cameras, on "usb". The camera's next close, as
 * a switch starts, waits until `release()`.
 */
async function switchingPhase(options: Parameters<typeof capturePhase>[0] = {}) {
	const camera = fakeEngineCamera({ cameras: TWO_CAMERAS, selected: "usb", track: TORCH_TRACK });
	const built = capturePhase({ ...options, camera });
	await built.mount();
	await camerasListed(camera);
	const closing = deferred<void>();
	camera.close.mockImplementationOnce(() => closing.promise);
	return { ...built, camera, release: () => closing.resolve() };
}

describe("the camera controls", () => {
	it("hide the torch while the camera switches, then show the new camera", async () => {
		const { phase, control, camera, release } = await switchingPhase();
		const switching = phase.switchCamera("built-in");
		await vi.waitFor(() => expect(control("torch")!.hidden).toBe(true));
		release();
		await switching;
		expect(camera.requests.at(-1)?.deviceId).toEqual({ exact: "built-in" });
		expect(control("torch")!.hidden).toBe(false);
	});

	it("toggle the torch", async () => {
		const { mount, phase, control } = capturePhase({
			camera: fakeEngineCamera({ track: TORCH_TRACK }),
		});
		await mount();
		await phase.toggleTorch();
		expect(control("torch")!.getAttribute("aria-pressed")).toBe("true");
	});

	it("open the file picker on the screen", async () => {
		vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
		const { mount, phase, container } = capturePhase();
		await mount();
		const picking = phase.pickImage();
		container.querySelector("input[type=file]")!.dispatchEvent(new Event("cancel"));
		expect(await picking).toBeNull();
	});

	it("do nothing while the screen is down", async () => {
		const camera = fakeEngineCamera({ cameras: TWO_CAMERAS, track: TORCH_TRACK });
		const store = vi.fn(async () => undefined);
		const { mount, phase, control } = capturePhase({ camera, store });
		const pressAll = async () => {
			await phase.switchCamera("built-in");
			await phase.toggleTorch();
			phase.toggleAutoCapture();
			await phase.takePage();
		};
		await pressAll();
		expect(await phase.pickImage()).toBeNull();
		// Leaving a screen that never showed does nothing either.
		await phase.unmount();
		await mount();
		await camerasListed(camera);
		const requests = camera.requests.length;
		await phase.unmount();
		await pressAll();
		await mount();
		expect([camera.requests.length, camera.turnOnTorch.mock.calls.length]).toEqual([requests, 0]);
		expect(store).not.toHaveBeenCalled();
		expect(control("autoCapture")!.getAttribute("aria-pressed")).toBe("true");
	});
});

describe("the outline", () => {
	it("follows the page and clears when a frame has none", async () => {
		const { mount, frame, container } = capturePhase();
		await mount();
		await vi.waitFor(() => frame(PAGE));
		expect(outlined(container)).toBe(true);
		frame(null);
		expect(outlined(container)).toBe(false);
	});

	it("ignores a frame that arrives after the screen came down", async () => {
		const { mount, phase, frame, container } = capturePhase();
		await mount();
		await vi.waitFor(() => frame(null));
		await phase.unmount();
		frame(PAGE);
		expect(outlined(container)).toBe(false);
	});
});

describe("a camera step that waits its turn", () => {
	it("opens no camera when the screen is left while the camera is created", async () => {
		const camera = fakeEngineCamera();
		const { mount, phase, create, createInstance } = capturePhase({ created: false, camera });
		const mounted = mount();
		await vi.waitFor(() => expect(createInstance).toHaveBeenCalled());
		const leaving = phase.unmount();
		create();
		await mounted;
		await leaving;
		expect(camera.open).not.toHaveBeenCalled();
	});

	it("watches no frames when the screen is left while the camera opens", async () => {
		const camera = fakeEngineCamera();
		const opening = deferred<void>();
		camera.open.mockImplementationOnce(() => opening.promise);
		const { mount, phase, startDetector } = capturePhase({ camera });
		const mounted = mount();
		await vi.waitFor(() => expect(camera.open).toHaveBeenCalled());
		const leaving = phase.unmount();
		opening.resolve();
		await Promise.all([mounted, leaving]);
		expect(startDetector).not.toHaveBeenCalled();
	});

	it("skips a camera switch pressed just before the screen was left", async () => {
		const { phase, camera, release } = await switchingPhase();
		const first = phase.switchCamera("built-in");
		const leaving = phase.unmount();
		// Pressed while the screen still shows, so it waits behind the leave.
		const second = phase.switchCamera("usb");
		release();
		await Promise.all([first, leaving, second]);
		expect(camera.requests.at(-1)?.deviceId).toEqual({ exact: "built-in" });
	});

	it("takes no page once the phase is disposed before the camera's turn", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const store = vi.fn(async () => undefined);
		const { phase, release } = await switchingPhase({ store });
		const switching = phase.switchCamera("built-in");
		const taking = phase.takePage();
		const disposing = phase.dispose();
		release();
		await Promise.all([switching, taking, disposing]);
		expect(store).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("captured"), expect.any(Error));
	});

	it("reports cameras that cannot be listed", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const camera = fakeEngineCamera();
		// The first list is the open's own, which looks for the main rear lens.
		camera.getAllCameras.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error("no devices"));
		const { mount } = capturePhase({ camera });
		await mount();
		await vi.waitFor(() =>
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("listed"), expect.any(Error)),
		);
	});
});

describe("the phase's life", () => {
	it("rejects the mount, with the screen up, when the engines fail to load", async () => {
		const { mount, control, failLoading } = capturePhase({ loaded: false });
		const mounted = mount();
		await vi.waitFor(() => expect(control("cancel")).not.toBeNull());
		failLoading();
		await expect(mounted).rejects.toThrow("No WebAssembly");
		expect(control("cancel")).not.toBeNull();
	});

	it("applies a hold that the session set before the camera existed", async () => {
		const { mount, phase, control } = capturePhase();
		phase.setControlsHeld(true);
		await mount();
		expect(control("autoCapture")!.getAttribute("aria-disabled")).toBe("true");
	});

	it("draws the newest page on the thumbnail", async () => {
		const { mount, thumbnail } = capturePhase({ pageCount: 2 });
		await mount();
		await vi.waitFor(() => expect(thumbnail).toHaveBeenCalledWith("page2"));
	});

	it("reports no press after its screen is left", async () => {
		const { mount, phase, control, presses } = capturePhase();
		await mount();
		await phase.unmount();
		control("cancel")!.click();
		expect(presses).toEqual([]);
	});

	it("refuses a mount once disposed", async () => {
		const { mount, phase } = capturePhase();
		await phase.dispose();
		await expect(mount()).rejects.toThrow("disposed");
	});

	it("keeps its screen when the detector cannot start, and reports it", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const { mount, startDetector, control } = capturePhase();
		startDetector.mockRejectedValueOnce(new Error("no template"));
		await mount();
		await vi.waitFor(() =>
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("detector"), expect.any(Error)),
		);
		expect(control("cancel")).not.toBeNull();
	});
});

describe("taking a page", () => {
	it("takes one page at a time", async () => {
		const handing = deferred<void>();
		const store = vi.fn(() => handing.promise);
		const { mount, phase } = capturePhase({ store });
		await mount();
		const first = phase.takePage();
		await phase.takePage();
		handing.resolve();
		await first;
		expect(store).toHaveBeenCalledOnce();
	});

	it("shows the viewfinder's spinner while a photograph is taken", async () => {
		const photographing = deferred<Blob>();
		stubImageCapture(4080, photographing.promise);
		const camera = fakeEngineCamera({ track: TORCH_TRACK });
		const { mount, phase, container } = capturePhase({ camera });
		await mount();
		const taking = phase.takePage();
		const spinner = container.querySelector<HTMLElement>(".mds-spinner-viewfinder")!;
		await vi.waitFor(() => expect(spinner.hidden).toBe(false));
		photographing.resolve(new Blob(["not an image"]));
		await taking;
		expect(spinner.hidden).toBe(true);
	});
});

describe("loading a file", () => {
	/** The spinners and the shutter, as a photograph draws them. */
	function progress({ container, control }: ReturnType<typeof capturePhase>) {
		const viewfinder = container.querySelector<HTMLElement>(".mds-spinner-viewfinder")!;
		const thumbnail = container.querySelector<HTMLElement>(".mds-spinner-thumbnail")!;
		return {
			viewfinder: !viewfinder.hidden,
			thumbnail: !thumbnail.hidden,
			shutter: control("shutter")!.hasAttribute("data-mds-running"),
		};
	}

	it("shows the spinners of a photograph until the load ends", async () => {
		const reading = deferred<string>();
		const scan = capturePhase();
		const { mount, phase } = scan;
		await mount();
		const loading = phase.showLoading(() => reading.promise);
		expect(progress(scan)).toEqual({ viewfinder: true, thumbnail: true, shutter: true });
		reading.resolve("read");
		expect(await loading).toBe("read");
		expect(progress(scan)).toEqual({ viewfinder: false, thumbnail: false, shutter: false });
	});

	it("ends them when the load fails", async () => {
		const scan = capturePhase();
		const { mount, phase } = scan;
		await mount();
		await expect(
			phase.showLoading(async () => Promise.reject(new Error("bad file"))),
		).rejects.toThrow("bad file");
		expect(progress(scan)).toEqual({ viewfinder: false, thumbnail: false, shutter: false });
	});

	it("runs the load with no capture screen up", async () => {
		const { phase } = capturePhase();
		expect(await phase.showLoading(async () => "read")).toBe("read");
	});

	it("shows none of them on a later visit while the load still runs", async () => {
		const reading = deferred<void>();
		const scan = capturePhase();
		const { mount, phase } = scan;
		await mount();
		const loading = phase.showLoading(() => reading.promise);
		await phase.unmount();
		await mount();
		expect(progress(scan)).toEqual({ viewfinder: false, thumbnail: false, shutter: false });
		reading.resolve();
		await loading;
	});
});

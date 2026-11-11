import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { sharpPage } from "../../tests/drawn-pages";
import { Camera } from "./camera";
import type { EngineCamera, EngineCameraModule } from "./camera";
import { REAR_CAMERA, cameraLadder } from "./camera-constraints";
import { ENGINE, fakeEngineCamera, streamOf, stubImageCapture } from "../../tests/fake-camera";
import type { FakeOptions } from "../../tests/fake-camera";

function cameraOver(fake: EngineCamera): Camera {
	return new Camera(fake, ENGINE);
}

/** A refusal that sends the camera down the size ladder. */
const overconstrained = (): Error =>
	Object.assign(new Error("too big"), { name: "OverconstrainedError" });

/** A refusal that ends the walk down the ladder. */
const notReadable = (): Error => Object.assign(new Error("in use"), { name: "NotReadableError" });

/** A track with only the given parts. */
function fakeTrack(parts: Partial<Pick<MediaStreamTrack, "getSettings" | "getCapabilities">>) {
	return parts as MediaStreamTrack;
}

/** A track that reports a size, and optionally a torch and a facing mode. */
function track(settings: MediaTrackSettings = {}, torch = false): MediaStreamTrack {
	return fakeTrack({
		getSettings: () => ({ width: 1920, height: 1440, ...settings }),
		getCapabilities: () => ({ torch }) as MediaTrackCapabilities,
	});
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("opening the camera", () => {
	/** A phone's rear lenses as Chromium on Android labels them, main one second. */
	const rearLenses = [
		{ deviceId: "wide", label: "camera 2, facing back" },
		{ deviceId: "main", label: "camera 0, facing back" },
	];

	it("walks down the size ladder past every refused size and opens at the first accepted", async () => {
		const fake = fakeEngineCamera({ refusals: [overconstrained()] });
		await cameraOver(fake).open();
		const ladder = cameraLadder();
		expect(fake.requests).toEqual([
			{ ...REAR_CAMERA, ...ladder[0] },
			{ ...REAR_CAMERA, ...ladder[1] },
		]);
		expect(fake.open).toHaveBeenCalledTimes(1);
	});

	it("stops at a refusal that is not about size", async () => {
		const fake = fakeEngineCamera({ refusals: [notReadable()] });
		await expect(cameraOver(fake).open()).rejects.toThrow("in use");
		expect(fake.requests).toHaveLength(1);
	});

	it.each([
		["NotAllowedError", "cameraPermission"],
		["NotFoundError", "cameraUnavailable"],
		["NotReadableError", "cameraUnavailable"],
	])("fails a refusal named %s as %s", async (name, kind) => {
		const refusal = new DOMException("refused", name);
		const opening = cameraOver(fakeEngineCamera({ refusals: [refusal] })).open();
		await expect(opening).rejects.toMatchObject({ error: { kind, message: "refused" } });
	});

	it("gives up once the last size is refused too", async () => {
		const every = cameraLadder().map(() => overconstrained());
		const fake = fakeEngineCamera({ refusals: every });
		await expect(cameraOver(fake).open()).rejects.toThrow("too big");
		expect(fake.requests).toHaveLength(every.length);
	});

	it("goes straight back to what it settled on the next time", async () => {
		const fake = fakeEngineCamera();
		const camera = cameraOver(fake);
		await camera.open();
		fake.pauseVideo();
		await camera.open();
		expect(fake.requests).toHaveLength(1);
		expect(fake.open).toHaveBeenCalledTimes(2);
	});

	it("moves to the main rear lens when the first open landed on another one", async () => {
		const fake = fakeEngineCamera({
			selected: "wide",
			cameras: rearLenses,
		});
		await cameraOver(fake).open();
		expect(fake.close).toHaveBeenCalledTimes(1);
		expect(fake.requests.at(-1)?.deviceId).toEqual({ exact: "main" });
	});

	it("keeps a worse lens over no preview when the main rear lens fails to open", async () => {
		const fake = fakeEngineCamera({
			selected: "wide",
			refusals: [undefined, notReadable()],
			cameras: rearLenses,
		});
		await cameraOver(fake).open();
		expect(fake.requests.at(-1)?.facingMode).toEqual(REAR_CAMERA.facingMode);
	});

	it("tries the main rear lens again in the next session after it failed to open", async () => {
		const fake = fakeEngineCamera({
			selected: "wide",
			refusals: [undefined, notReadable()],
			cameras: rearLenses,
		});
		const camera = cameraOver(fake);
		await camera.open();
		await camera.close();
		await camera.open();
		expect(fake.requests.at(-1)?.deviceId).toEqual({ exact: "main" });
		// Settled now, so the session after goes straight back to it.
		await camera.close();
		const requests = fake.requests.length;
		await camera.open();
		expect(fake.requests).toHaveLength(requests);
	});

	it("resumes a paused camera without a new search, even after the main rear lens failed to open", async () => {
		const fake = fakeEngineCamera({
			selected: "wide",
			refusals: [undefined, notReadable()],
			cameras: rearLenses,
		});
		const camera = cameraOver(fake);
		await camera.open();
		const requests = fake.requests.length;
		fake.pauseVideo();
		await camera.open();
		expect(fake.requests).toHaveLength(requests);
		expect(camera.isOpen).toBe(true);
	});
});

describe("what the camera reports", () => {
	it("counts a camera whose video the browser paused as not open, since it has nothing to photograph", async () => {
		const fake = fakeEngineCamera();
		const camera = cameraOver(fake);
		expect(camera.isOpen).toBe(false);
		await camera.open();
		expect(camera.isOpen).toBe(true);
		fake.pauseVideo();
		expect(camera.isOpen).toBe(false);
	});

	it("lays its video out again at the first frame after each start, which WebKit on iOS needs", () => {
		const fake = fakeEngineCamera();
		cameraOver(fake);
		const video = fake.getVideoElement();
		video.style.display = "block";
		// What the video's display was each time its layout was read.
		const read: string[] = [];
		Object.defineProperty(video, "offsetHeight", {
			get: () => read.push(video.style.display),
		});
		// Without requestVideoFrameCallback, as in Firefox before 132, nothing happens.
		video.dispatchEvent(new Event("playing"));
		expect(read).toEqual([]);
		Object.assign(video, {
			requestVideoFrameCallback: (shown: VideoFrameRequestCallback) => shown(0, {} as never),
		});
		video.dispatchEvent(new Event("playing"));
		expect(read).toEqual(["none"]);
		expect(video.style.display).toBe("block");
	});

	it("gives the size of the frames coming out", () => {
		expect(cameraOver(fakeEngineCamera()).frameSize).toEqual({ width: 1280, height: 720 });
	});

	it("hands the engine object to the router, and releases it on dispose", () => {
		const fake = fakeEngineCamera();
		const camera = cameraOver(fake);
		expect(camera.input).toBe(fake);
		camera.dispose();
		expect(fake.dispose).toHaveBeenCalledTimes(1);
	});
});

describe("switching cameras", () => {
	const cameras = [
		{ deviceId: "usb", label: "USB Webcam" },
		{ deviceId: "built-in", label: "Integrated Camera" },
	];

	it("says which listed camera is open", async () => {
		const fake = fakeEngineCamera({ cameras, selected: "usb" });
		const camera = cameraOver(fake);
		await camera.open();
		const { options, active } = await camera.listCameras();
		expect(options.map((option) => option.id)).toEqual(["usb", "built-in"]);
		expect(active).toBe("usb");
	});

	it("offers a flip between the sides once a camera has faced the rear", async () => {
		let facing = "environment";
		const turning = fakeTrack({
			getSettings: () => ({ width: 1920, height: 1440, facingMode: facing }),
			getCapabilities: () => ({}),
		});
		const camera = cameraOver(fakeEngineCamera({ cameras, track: turning }));
		await camera.open();
		const rear = await camera.listCameras();
		expect([rear.options.map((option) => option.id), rear.active]).toEqual([
			["environment", "user"],
			"environment",
		]);
		facing = "user";
		expect((await camera.listCameras()).active).toBe("user");
	});

	it("lists every camera by its label while none has faced the rear, as on a desktop", async () => {
		const fake = fakeEngineCamera({ cameras, track: track({ facingMode: "user" }) });
		const camera = cameraOver(fake);
		await camera.open();
		const { options } = await camera.listCameras();
		expect(options.map((option) => option.id)).toEqual(["usb", "built-in"]);
	});

	it("ignores an entry it no longer knows", async () => {
		const fake = fakeEngineCamera({ cameras });
		const camera = cameraOver(fake);
		await camera.open();
		await camera.switchTo("gone");
		expect(fake.close).not.toHaveBeenCalled();
	});

	it("keeps a camera the user switched to through a pause of its video, within the session", async () => {
		const fake = fakeEngineCamera({ cameras });
		const camera = cameraOver(fake);
		await camera.open();
		await camera.listCameras();
		await camera.switchTo("built-in");
		fake.pauseVideo();
		await camera.open();
		expect(fake.requests.at(-1)?.deviceId).toEqual({ exact: "built-in" });
	});

	it("goes back to the camera it first settled on, at its size, once the session closes it", async () => {
		const fake = fakeEngineCamera({ cameras });
		const camera = cameraOver(fake);
		await camera.open();
		const first = fake.requests.at(-1);
		await camera.listCameras();
		await camera.switchTo("built-in");
		await camera.close();
		expect(fake.requests.at(-1)).toEqual(first);
		// Asked once the camera has closed, when the engine only notes it.
		const [closed] = fake.close.mock.invocationCallOrder.slice(-1);
		const [asked] = fake.requestCamera.mock.invocationCallOrder.slice(-1);
		expect(closed).toBeLessThan(asked!);
		const requests = fake.requests.length;
		await camera.open();
		// Straight back, with no walk down the size ladder.
		expect(fake.requests).toHaveLength(requests);
	});

	it("goes back to the main rear lens the first open moved to, after a switch to the front", async () => {
		const fake = fakeEngineCamera({
			selected: "wide",
			cameras: [
				{ deviceId: "wide", label: "camera 2, facing back" },
				{ deviceId: "main", label: "camera 0, facing back" },
				{ deviceId: "front", label: "camera 1, facing front" },
			],
		});
		const camera = cameraOver(fake);
		await camera.open();
		const first = fake.requests.at(-1);
		expect(first?.deviceId).toEqual({ exact: "main" });
		await camera.listCameras();
		await camera.switchTo("front");
		expect(fake.requests.at(-1)?.deviceId).toEqual({ exact: "front" });
		await camera.close();
		expect(fake.requests.at(-1)).toEqual(first);
	});

	it("goes back to the first camera even when a failed switch could not reopen the previous one", async () => {
		const fake = fakeEngineCamera({
			cameras,
			refusals: [undefined, undefined, notReadable(), notReadable()],
		});
		const camera = cameraOver(fake);
		await camera.open();
		const first = fake.requests.at(-1);
		await camera.listCameras();
		await camera.switchTo("built-in");
		await expect(camera.switchTo("usb")).rejects.toThrow("in use");
		expect(fake.requests.at(-1)?.deviceId).toEqual({ exact: "built-in" });
		await camera.close();
		expect(fake.requests.at(-1)).toEqual(first);
	});

	it("reopens the previous camera and passes the failure on when the new one refuses", async () => {
		const fake = fakeEngineCamera({ cameras, refusals: [undefined, notReadable()] });
		const camera = cameraOver(fake);
		await camera.open();
		await camera.listCameras();
		await expect(camera.switchTo("built-in")).rejects.toThrow("in use");
		expect(fake.requests.at(-2)?.deviceId).toEqual({ exact: "built-in" });
		expect(fake.requests.at(-1)?.facingMode).toEqual(REAR_CAMERA.facingMode);
		expect(fake.open).toHaveBeenCalledTimes(2);
	});
});

describe("the torch", () => {
	/** An open camera with a torch. */
	async function lit(options: FakeOptions = {}) {
		const fake = fakeEngineCamera({ track: track({}, true), ...options });
		const camera = cameraOver(fake);
		await camera.open();
		return { fake, camera };
	}

	it("is absent until a camera with a torch shows", async () => {
		const withTorch = cameraOver(fakeEngineCamera({ track: track({}, true) }));
		expect(withTorch.torch).toBe("absent");
		await withTorch.open();
		expect(withTorch.torch).toBe("off");
		const without = cameraOver(fakeEngineCamera({ track: track({}, false) }));
		await without.open();
		expect(without.torch).toBe("absent");
		// iOS, where the engine assumes a torch the track does not report.
		const assumed = cameraOver(fakeEngineCamera({ track: track({}, false), supportTorch: true }));
		await assumed.open();
		expect(assumed.torch).toBe("off");
	});

	it("is absent on a track that cannot say what it can do, as in Firefox before 132", async () => {
		const mute = fakeTrack({ getSettings: () => ({}) });
		const camera = cameraOver(fakeEngineCamera({ track: mute }));
		await camera.open();
		expect(camera.torch).toBe("absent");
	});

	it("stays on when it will not switch off", async () => {
		const { fake, camera } = await lit();
		await camera.toggleTorch();
		fake.turnOffTorch.mockRejectedValueOnce(new Error("stuck"));
		await camera.toggleTorch();
		expect(camera.torch).toBe("on");
	});

	it("ignores a press while the last one is still switching it", async () => {
		const { fake, camera } = await lit();
		let finish = (): void => undefined;
		fake.turnOnTorch.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					finish = () => {
						fake.isTorchOn = true;
						resolve();
					};
				}),
		);
		const first = camera.toggleTorch();
		await camera.toggleTorch();
		finish();
		await first;
		expect(camera.torch).toBe("on");
		expect(fake.turnOnTorch).toHaveBeenCalledTimes(1);
	});

	it("stays refused once it would not light", async () => {
		const { fake, camera } = await lit({ track: track({}, false), supportTorch: true });
		fake.turnOnTorch.mockRejectedValueOnce(new Error("no torch"));
		await camera.toggleTorch();
		expect(camera.torch).toBe("refused");
		await camera.darken();
		await camera.open();
		expect(camera.torch).toBe("refused");
		await camera.toggleTorch();
		expect(fake.turnOnTorch).toHaveBeenCalledTimes(1);
	});

	it("forgets a refusal once the camera runs on another track", async () => {
		const { fake, camera } = await lit();
		fake.turnOnTorch.mockRejectedValueOnce(new Error("busy"));
		await camera.toggleTorch();
		expect(camera.torch).toBe("refused");
		fake.getVideoElement().srcObject = streamOf(track({}, true));
		expect(camera.torch).toBe("off");
	});

	it("is lit again when the camera opens after a darkening, if it was on", async () => {
		const { fake, camera } = await lit();
		await camera.toggleTorch();
		await camera.darken();
		expect(fake.isTorchOn).toBe(false);
		await camera.open();
		expect(camera.torch).toBe("on");
	});

	it("stays off when the camera comes back, if it was switched off", async () => {
		const { fake, camera } = await lit();
		await camera.toggleTorch();
		await camera.toggleTorch();
		await camera.darken();
		await camera.open();
		expect(camera.torch).toBe("off");
		expect(fake.turnOnTorch).toHaveBeenCalledTimes(1);
	});

	it("is lit again on the camera switched to, if it was on", async () => {
		const cameras = [
			{ deviceId: "usb", label: "USB Webcam" },
			{ deviceId: "built-in", label: "Integrated Camera" },
		];
		const { camera } = await lit({ cameras, selected: "usb" });
		await camera.listCameras();
		await camera.toggleTorch();
		await camera.switchTo("built-in");
		expect(camera.torch).toBe("on");
	});

	it("forgets that it was on once the camera closes, since the session is over", async () => {
		const { camera } = await lit();
		await camera.toggleTorch();
		await camera.close();
		await camera.open();
		expect(camera.torch).toBe("off");
	});

	it("darkens without failing when the torch refuses to switch off", async () => {
		const fake = fakeEngineCamera();
		fake.isTorchOn = true;
		fake.turnOffTorch.mockRejectedValueOnce(new Error("torch stuck"));
		await expect(cameraOver(fake).darken()).resolves.toBeUndefined();
	});

	it("is switched off before the camera closes, since the track keeps it lit until it stops", async () => {
		const fake = fakeEngineCamera();
		fake.isTorchOn = true;
		await cameraOver(fake).close();
		expect(fake.turnOffTorch.mock.invocationCallOrder[0]).toBeLessThan(
			fake.close.mock.invocationCallOrder[0]!,
		);
	});
});

describe("capturing the images of a page", () => {
	it("refuses while no camera is open", async () => {
		await expect(cameraOver(fakeEngineCamera()).captureImages(() => undefined)).rejects.toThrow(
			"not open",
		);
	});

	it("takes the frame and a photograph where the camera gives more than the preview", async () => {
		const photograph = new Blob(["photograph"]);
		stubImageCapture(4080, photograph);
		const camera = cameraOver(fakeEngineCamera({ track: track(), frame: sharpPage(1280) }));
		await camera.open();
		const photographing = vi.fn();
		const { frame, photograph: taken } = await camera.captureImages(photographing);
		expect([frame.width, taken, photographing.mock.calls.length]).toEqual([1280, photograph, 1]);
	});

	it("takes no photograph where it would be no larger than the preview", async () => {
		stubImageCapture(1920, new Blob(["photograph"]));
		const camera = cameraOver(fakeEngineCamera({ track: track() }));
		await camera.open();
		const photographing = vi.fn();
		expect((await camera.captureImages(photographing)).photograph).toBeNull();
		expect(photographing).not.toHaveBeenCalled();
	});

	it("takes no photograph where the browser has no ImageCapture", async () => {
		vi.stubGlobal("ImageCapture", undefined);
		const camera = cameraOver(fakeEngineCamera({ track: track() }));
		await camera.open();
		expect((await camera.captureImages(() => undefined)).photograph).toBeNull();
	});

	it("asks each track once whether a photograph is worth taking", async () => {
		let asked = 0;
		vi.stubGlobal(
			"ImageCapture",
			class {
				async getPhotoCapabilities() {
					asked += 1;
					return { imageWidth: { max: 4080 } };
				}
				async takePhoto() {
					return new Blob(["photograph"]);
				}
			},
		);
		const camera = cameraOver(fakeEngineCamera({ track: track() }));
		await camera.open();
		await camera.captureImages(() => undefined);
		await camera.captureImages(() => undefined);
		expect(asked).toBe(1);
	});

	it("takes no photograph where the camera reports no photograph size", async () => {
		vi.stubGlobal(
			"ImageCapture",
			class {
				async getPhotoCapabilities() {
					return {};
				}
			},
		);
		const silent = fakeTrack({ getSettings: () => ({}), getCapabilities: () => ({}) });
		const camera = cameraOver(fakeEngineCamera({ track: silent }));
		await camera.open();
		const photographing = vi.fn();
		expect((await camera.captureImages(photographing)).photograph).toBeNull();
		expect(photographing).not.toHaveBeenCalled();
	});

	it("takes no photograph when the photograph fails", async () => {
		stubImageCapture(4080, new Error("refused"));
		const camera = cameraOver(fakeEngineCamera({ track: track() }));
		await camera.open();
		expect((await camera.captureImages(() => undefined)).photograph).toBeNull();
	});
});

describe("setting a camera up", () => {
	it("sets the engine's camera up the way the capture screen needs it", () => {
		const fake = fakeEngineCamera();
		const camera = cameraOver(fake);
		expect(camera.video).toBe(fake.getVideoElement());
		expect(fake.shouldCloseWhenNotInDOM).toBe(false);
		expect(fake._bTryAnotherCameraWhenFailToOpen).toBe(false);
		expect(fake.enableEnhancedFeatures).toHaveBeenCalledWith(4);
		expect(fake.setVideoFit).toHaveBeenCalledWith("fill");
		expect(fake.getVideoElement().disablePictureInPicture).toBe(true);
		expect(fake.drawingLayer.setVisible).toHaveBeenCalledWith(false);
	});

	it("creates the engine's camera around the screen element it is given", async () => {
		const fake = fakeEngineCamera();
		// The parts of the engine's module that creating a camera uses.
		const engine = {
			...ENGINE,
			CameraEnhancer: { createInstance: vi.fn(async () => fake) },
		} satisfies EngineCameraModule;
		const ui = document.createElement("div");
		await Camera.create(engine, ui);
		expect(engine.CameraEnhancer.createInstance).toHaveBeenCalledWith(ui);
		expect(fake.shouldCloseWhenNotInDOM).toBe(false);
	});
});

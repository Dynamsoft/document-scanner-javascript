import { vi } from "vite-plus/test";
import type { EngineCamera, EngineFeatures } from "../src/camera/camera";
import type { CameraConstraints } from "../src/camera/camera-constraints";

// A fake of the camera engine's camera, for the camera and capture phase tests.

export interface FakeOptions {
	/** How each request for a camera answers, in order. Absent means it opens. */
	readonly refusals?: readonly (Error | undefined)[];
	readonly cameras?: readonly { deviceId: string; label: string }[];
	readonly selected?: string;
	readonly track?: MediaStreamTrack;
	readonly supportTorch?: boolean;
	/** The viewfinder frame a page is taken from. Blank unless given. */
	readonly frame?: HTMLCanvasElement;
}

/**
 * A fake engine camera that opens whatever it is asked for unless told to refuse.
 * Tests can read its requests and its drawing layer.
 */
export function fakeEngineCamera(options: FakeOptions = {}) {
	const refusals = [...(options.refusals ?? [])];
	let selected = options.selected ?? "default";
	let open = false;
	let paused = false;
	const track = options.track;
	// An event target, so that a test can send it the events of a video.
	const video = Object.assign(new EventTarget(), {
		srcObject: track ? streamOf(track) : null,
		videoWidth: 1280,
		videoHeight: 720,
		disablePictureInPicture: false,
		setAttribute: vi.fn(),
		parentElement: null,
		style: document.createElement("video").style,
		offsetHeight: 0,
	});
	const frame = options.frame ?? blankFrame();
	const requests: CameraConstraints[] = [];
	const drawingLayer = { setVisible: vi.fn() };
	const camera = {
		track,
		isTorchOn: undefined as boolean | undefined,
		isSupportTorch: options.supportTorch ?? false,
		requestCamera: vi.fn(async (constraints: CameraConstraints) => {
			requests.push(constraints);
			const refusal = refusals.shift();
			if (refusal) throw refusal;
			const device = (constraints.deviceId as { exact?: string } | undefined)?.exact;
			if (device) selected = device;
		}),
		open: vi.fn(async () => {
			open = true;
			paused = false;
		}),
		close: vi.fn(async () => {
			open = false;
		}),
		dispose: vi.fn(),
		isOpen: () => open,
		isPaused: () => paused,
		getVideoElement: () => video,
		getAllCameras: vi.fn(async () => options.cameras ?? []),
		getSelectedCamera: () => ({ deviceId: selected }),
		turnOnTorch: vi.fn(async () => {
			camera.isTorchOn = true;
		}),
		turnOffTorch: vi.fn(async () => {
			camera.isTorchOn = false;
		}),
		fetchImage: () => ({ toCanvas: () => frame }),
		shouldCloseWhenNotInDOM: true,
		// The engine's default, which tries the default camera on a refusal.
		_bTryAnotherCameraWhenFailToOpen: true,
		enableEnhancedFeatures: vi.fn(),
		setVideoFit: vi.fn(),
		getAllDrawingLayers: () => [drawingLayer],
	} satisfies EngineCamera;
	/** Pause the video, as the browser can. The engine then counts the camera as paused. */
	const pauseVideo = () => {
		paused = true;
	};
	return Object.assign(camera, { requests, drawingLayer, pauseVideo });
}

/** The engine enum values a camera reads. */
export const ENGINE: EngineFeatures = { EnumEnhancedFeatures: { EF_TAP_TO_FOCUS: 4 } };

/** A stream with one video track, for the video's `srcObject`. */
export function streamOf(track: MediaStreamTrack): MediaStream {
	return Object.assign(Object.create(MediaStream.prototype) as MediaStream, {
		getVideoTracks: () => [track],
	});
}

/** A blank frame the size of the fake video. */
function blankFrame(): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = 1280;
	canvas.height = 720;
	return canvas;
}

/**
 * Stub the browser's ImageCapture, with photographs at most `largest` wide. Each
 * photograph is `photograph`, or fails with it.
 */
export function stubImageCapture(largest: number, photograph: Blob | Error | Promise<Blob>): void {
	vi.stubGlobal(
		"ImageCapture",
		class {
			async getPhotoCapabilities() {
				return { imageWidth: { max: largest } };
			}
			async takePhoto() {
				if (photograph instanceof Error) throw photograph;
				return photograph;
			}
		},
	);
}

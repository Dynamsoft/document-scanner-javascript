import type { Quadrilateral } from "../results";
import type { FindBoundary } from "../boundaries/detection";
import { PAGE_QUALITY, encodeCanvas, imageSize } from "../document/images";
import type { ImageSize } from "../document/images";
import { samePage } from "../boundaries/quads";
import type { RectifyImage } from "../phases/rectify";
import { keepsDetail } from "./sharpness";

// Take a page from the camera at the best quality the browser offers, and choose
// the image to keep, with the page found on it.

/**
 * The most each corner of a photograph's boundary may lie from the frame's, as a
 * share of the photograph's diagonal. A boundary further off is another edge,
 * such as the table's. A start value, to tune on phones.
 */
const SAME_PAGE = 0.1;

/**
 * The most the photograph's aspect ratio may differ from the frame's, as a share,
 * for their boundaries to compare. A photograph of another aspect ratio frames
 * another part of the scene, so beyond this it keeps its own boundary unchecked.
 */
const SAME_ASPECT_RATIO = 0.02;

/** The members of Capture Vision's `CameraEnhancer` that taking a page uses. */
export interface CapturingCamera {
	/** The frame on screen. */
	fetchImage(): { toCanvas(): HTMLCanvasElement };
	/** The track the camera runs on, or undefined while it is closed. */
	readonly track: MediaStreamTrack | undefined;
}

/**
 * The images taken for one page: the frame on screen, and a photograph where
 * there is one.
 */
export interface CapturedImages {
	readonly frame: HTMLCanvasElement;
	readonly photograph: Blob | null;
}

/**
 * Grab the frame on screen, then take a photograph if it would be larger than the
 * frame. `onPhotographing` is called only when a photograph is taken, because that
 * freezes the preview. The frame comes first, because the photograph can turn out
 * worse.
 */
export async function captureImages(
	camera: CapturingCamera,
	onPhotographing: () => void,
): Promise<CapturedImages> {
	const frame = camera.fetchImage().toCanvas();
	return { frame, photograph: await takePhotograph(camera, onPhotographing) };
}

/**
 * Choose which of the images taken for a page to keep, with the boundary
 * `findBoundary` finds on it. The photograph is kept if it is no softer than the
 * frame and shows a page that agrees with the page on the frame. Otherwise the
 * frame is kept, with the boundary found on it.
 */
export async function chooseOriginal(
	{ frame, photograph }: CapturedImages,
	findBoundary: FindBoundary,
): Promise<RectifyImage> {
	// The page is found on the frame while the photograph is measured.
	const framed = encodeCanvas(frame, "image/jpeg", PAGE_QUALITY).then(async (image) => ({
		image,
		boundary: await findBoundary(image),
	}));
	if (!photograph || !(await sharpEnough(photograph, frame))) return framed;
	const boundary = await findBoundary(photograph);
	const onFrame = await framed;
	if (boundary && (await agrees(boundary, photograph, onFrame.boundary, frame))) {
		return { image: photograph, boundary };
	}
	return onFrame;
}

/**
 * Whether the photograph's boundary marks the page that the frame's does. With no
 * page on the frame, or a frame of another aspect ratio, there is nothing to
 * compare.
 */
async function agrees(
	boundary: Quadrilateral,
	photograph: Blob,
	onFrame: Quadrilateral | null,
	frame: ImageSize,
): Promise<boolean> {
	if (!onFrame) return true;
	// The sharpness check decoded the photograph already, so its size can be read.
	const size = await imageSize(photograph);
	const ratio = size.width / size.height / (frame.width / frame.height);
	if (Math.abs(ratio - 1) > SAME_ASPECT_RATIO) return true;
	return samePage(boundary, size, onFrame, frame, SAME_PAGE);
}

/**
 * Take a photograph, or return `null` if it cannot be taken or would be no larger
 * than the viewfinder frame.
 */
async function takePhotograph(
	camera: CapturingCamera,
	onPhotographing: () => void,
): Promise<Blob | null> {
	const track = camera.track;
	// The DOM types say `ImageCapture` always exists, but Firefox lacks it.
	if (typeof ImageCapture === "undefined" || !track) return null;
	try {
		const capture = new ImageCapture(track);
		if (!(await worthPhotographing(capture, track))) return null;
		// Only now is a photograph certain, and the preview about to freeze.
		onPhotographing();
		return await capture.takePhoto();
	} catch {
		// It can still fail, on virtual cameras and now and then on iOS.
		return null;
	}
}

/**
 * Whether a photograph from this track would be larger than the frame. Asked once
 * per track, because asking costs a round trip to the camera. No photograph size
 * is asked for, because WebKit refuses the largest one it reports.
 */
async function worthPhotographing(
	capture: ImageCapture,
	track: MediaStreamTrack,
): Promise<boolean> {
	const remembered = PHOTOGRAPH_WORTH_IT.get(track);
	if (remembered !== undefined) return remembered;
	const { width = 0, height = 0 } = track.getSettings();
	const largest = (await capture.getPhotoCapabilities()).imageWidth?.max ?? 0;
	const worth = largest > Math.max(width, height);
	PHOTOGRAPH_WORTH_IT.set(track, worth);
	return worth;
}

/** The remembered answer for each track. */
const PHOTOGRAPH_WORTH_IT = new WeakMap<MediaStreamTrack, boolean>();

/**
 * Whether the photograph is sharp enough to replace the frame. A photograph that
 * cannot be measured did not decode, and is no use as a page.
 */
async function sharpEnough(photograph: Blob, frame: HTMLCanvasElement): Promise<boolean> {
	try {
		return await keepsDetail(photograph, frame);
	} catch {
		return false;
	}
}

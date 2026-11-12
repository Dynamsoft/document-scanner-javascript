import type * as CaptureVisionBundle from "dynamsoft-capture-vision-bundle";
import { reportFault } from "../faults";
import type { Point, Quadrilateral } from "../results";
import DETECT_SETTINGS from "./detect-template.json" with { type: "json" };

// Finding a document's edges in camera frames and in captured pages.

type Router = CaptureVisionBundle.CaptureVisionRouter;

/**
 * Find a page's boundary in an image, or `null` when there is none. It reports its
 * own failures, and then finds none.
 */
export type FindBoundary = (image: Blob) => Promise<Quadrilateral | null>;

/** The parts of the engine's captured result that `Detector` reads. */
export interface DetectionResult {
	readonly processedDocumentResult?: {
		readonly detectedQuadResultItems?: readonly {
			readonly location: Quadrilateral;
		}[];
	};
}

/** The member of the engine's result receiver that `Detector` sets. */
export interface ResultReceiver {
	onCapturedResultReceived?(result: DetectionResult): void;
}

/** The members of Capture Vision's `CaptureVisionRouter` that `Detector` uses. */
export interface EngineRouter {
	addResultReceiver(receiver: ResultReceiver): Promise<void>;
	startCapturing(templateName: string): Promise<void>;
	stopCapturing(): void;
	capture(image: Blob, templateName: string): Promise<DetectionResult>;
}

/** The member of the Capture Vision module that `Detector` uses. */
export interface EngineReceivers {
	readonly CapturedResultReceiver: new () => ResultReceiver;
}

/**
 * The name of the edge-detection template the document scanner ships.
 */
export const DETECT_TEMPLATE = "mds-detect";

/**
 * The shorter side, in pixels, that the engine may shrink an image to for speed.
 * The corners still come back in the full image's pixels.
 */
const SCALE_DOWN_THRESHOLD = 1000;

/**
 * The shortest gap between looks at the preview, in milliseconds. Ten a second
 * keep the outline smooth and spare the phone's processor.
 */
const CAPTURE_INTERVAL_MS = 100;

/**
 * Find page boundaries with `detector`. A detection that fails is reported, and
 * counts as none.
 */
export function boundaryFinder(detector: Pick<Detector, "detect">): FindBoundary {
	return (image) =>
		detector.detect(image).catch((thrown: unknown) => {
			reportFault("the edges of this page could not be found", thrown);
			return null;
		});
}

/**
 * Set a router up to find document edges, and return a detector that uses it. The
 * setup is slow, so it carries on while the detector waits for it.
 */
export function createDetector(engine: EngineReceivers, router: Router): Detector {
	const prepared = prepareDetection(router);
	prepared.catch(() => undefined); // reported by the first detection
	return new Detector(engine, router, prepared);
}

/**
 * Set a router up to find document edges. This is slow, because the template
 * loads the engine's document module.
 */
async function prepareDetection(router: Router): Promise<void> {
	await router.initSettings(DETECT_SETTINGS);
	const settings = await router.getSimplifiedSettings(DETECT_TEMPLATE);
	settings.documentSettings.scaleDownThreshold = SCALE_DOWN_THRESHOLD;
	settings.minImageCaptureInterval = CAPTURE_INTERVAL_MS;
	await router.updateSettings(DETECT_TEMPLATE, settings);
}

/**
 * Document detection for camera frames and captured pages. The engine keeps one
 * scale for all its detections, and scales the corners of each back up by it.
 * Thus a detection that overlaps another, or the camera's, can return corners at
 * the wrong scale. The detector runs one image detection at a time, and looks at
 * no camera frame until no image detection is left.
 */
export class Detector {
	readonly #engine: EngineReceivers;
	readonly #router: EngineRouter;
	/** The router's setup, which each detection waits for. */
	readonly #prepared: Promise<void>;
	/** Whether the router already reports to this detector. */
	#listening = false;
	#onBoundary: ((boundary: Quadrilateral | null) => void) | null = null;
	/** Whether camera frames are watched, from a `start()` that set up until `stop()`. */
	#watching = false;
	/** Whether the router looks at camera frames now. */
	#streaming = false;
	/** The image detections queued or under way. */
	#detections = 0;
	/** The image detection under way, if any, which the next one waits for. */
	#detecting: Promise<void> = Promise.resolve();

	constructor(engine: EngineReceivers, router: EngineRouter, prepared: Promise<void>) {
		this.#engine = engine;
		this.#router = router;
		this.#prepared = prepared;
	}

	/**
	 * Report each camera frame's outline, or `null` for a frame with no page. The
	 * camera must already be the router's input. A stop during setup wins. Frames
	 * wait for any image detection to end.
	 */
	async start(onBoundary: (boundary: Quadrilateral | null) => void): Promise<void> {
		this.#onBoundary = onBoundary;
		await this.#listen();
		if (this.#onBoundary !== onBoundary) return;
		this.#watching = true;
		await this.#settle();
	}

	/** Stop looking at camera frames. Safe to call when none are being looked at. */
	stop(): void {
		this.#onBoundary = null;
		this.#watching = false;
		void this.#settle();
	}

	/**
	 * Find a document's boundary in an image, or `null` when there is none. It waits
	 * for any image detection before it.
	 */
	detect(image: Blob): Promise<Quadrilateral | null> {
		this.#detections += 1;
		void this.#settle();
		const detecting = this.#detecting.then(() => this.#detectOne(image));
		this.#detecting = detecting.then(
			() => undefined,
			() => undefined,
		);
		return detecting.finally(() => {
			this.#detections -= 1;
			this.#settle().catch((thrown: unknown) =>
				reportFault("the document detector could not be started again", thrown),
			);
		});
	}

	async #detectOne(image: Blob): Promise<Quadrilateral | null> {
		await this.#prepared;
		return boundaryOf(await this.#router.capture(image, DETECT_TEMPLATE));
	}

	/**
	 * Have the router look at camera frames exactly while they are watched and no
	 * image detection is left. Rejects when the router cannot start, which it then
	 * tries again at the next change.
	 */
	async #settle(): Promise<void> {
		const wanted = this.#watching && this.#detections === 0;
		if (wanted === this.#streaming) return;
		this.#streaming = wanted;
		if (!wanted) {
			this.#router.stopCapturing();
			return;
		}
		try {
			await this.#router.startCapturing(DETECT_TEMPLATE);
		} catch (thrown) {
			this.#streaming = false;
			throw thrown;
		}
	}

	/** Wait for the router's setup, then have it report frames to this detector. */
	async #listen(): Promise<void> {
		await this.#prepared;
		if (this.#listening) return;
		this.#listening = true;
		const receiver = new this.#engine.CapturedResultReceiver();
		receiver.onCapturedResultReceived = (result) => this.#onBoundary?.(boundaryOf(result));
		await this.#router.addResultReceiver(receiver);
	}
}

/** The boundary in a captured result, or `null` when there is none. */
function boundaryOf(result: DetectionResult): Quadrilateral | null {
	const item = result.processedDocumentResult?.detectedQuadResultItems?.[0];
	return item ? toQuadrilateral(item.location) : null;
}

/**
 * Copy the corners of the engine's quadrilateral, without its bounding box and
 * area.
 */
function toQuadrilateral(quad: Quadrilateral): Quadrilateral {
	const [first, second, third, fourth] = quad.points;
	return { points: [point(first), point(second), point(third), point(fourth)] };
}

function point(from: Point): Point {
	return { x: from.x, y: from.y };
}

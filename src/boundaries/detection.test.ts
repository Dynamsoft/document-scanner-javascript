import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { Point, Quadrilateral } from "../results";
import { Detector, boundaryFinder, createDetector } from "./detection";
import type { DetectionResult, EngineReceivers, EngineRouter, ResultReceiver } from "./detection";

/** A stand-in for the engine's result receiver. */
class Receiver implements ResultReceiver {
	onCapturedResultReceived?: (result: DetectionResult) => void;
}

/**
 * A router that records its calls, passes results to its receivers, and answers
 * a capture with the next of `answers`.
 */
function fakeRouter(answers: DetectionResult[] = []) {
	const receivers: ResultReceiver[] = [];
	const calls: string[] = [];
	const captured: [Blob, string][] = [];
	const router = {
		capture: async (image: Blob, template: string) => {
			captured.push([image, template]);
			return answers.shift() ?? {};
		},
		addResultReceiver: async (receiver: ResultReceiver) => {
			receivers.push(receiver);
			calls.push("addResultReceiver");
		},
		startCapturing: async () => {
			calls.push("startCapturing");
		},
		stopCapturing: () => {
			calls.push("stopCapturing");
		},
	} satisfies EngineRouter;
	const send = (result: DetectionResult): void => {
		for (const receiver of receivers) receiver.onCapturedResultReceived?.(result);
	};
	return { router, calls, captured, send };
}

const ENGINE = { CapturedResultReceiver: Receiver } satisfies EngineReceivers;

afterEach(() => {
	vi.restoreAllMocks();
});

/** A captured result with one outline, in the engine's shape. */
function found(left: number): DetectionResult {
	const corners: [Point, Point, Point, Point] = [
		{ x: left, y: 50 },
		{ x: left + 680, y: 50 },
		{ x: left + 680, y: 670 },
		{ x: left, y: 670 },
	];
	return {
		processedDocumentResult: { detectedQuadResultItems: [{ location: { points: corners } }] },
	};
}

describe("Detector", () => {
	it("reports the outline in each frame, and null for a frame with none", async () => {
		const { router, send } = fakeRouter();
		const detector = new Detector(ENGINE, router, Promise.resolve());
		const seen: (Quadrilateral | null)[] = [];
		await detector.start((boundary) => seen.push(boundary));
		send(found(300));
		send({ processedDocumentResult: { detectedQuadResultItems: [] } });
		send({});
		expect(seen).toEqual([
			{
				points: [
					{ x: 300, y: 50 },
					{ x: 980, y: 50 },
					{ x: 980, y: 670 },
					{ x: 300, y: 670 },
				],
			},
			null,
			null,
		]);
	});

	it("reports nothing once stopped", async () => {
		const { router, calls, send } = fakeRouter();
		const detector = new Detector(ENGINE, router, Promise.resolve());
		const seen: unknown[] = [];
		await detector.start((boundary) => seen.push(boundary));
		detector.stop();
		send(found(300));
		expect(seen).toEqual([]);
		expect(calls).toContain("stopCapturing");
	});

	it("does not start capturing when stopped while the router is still being set up", async () => {
		const { router, calls } = fakeRouter();
		let ready: () => void = () => undefined;
		const prepared = new Promise<void>((done) => (ready = done));
		const detector = new Detector(ENGINE, router, prepared);
		const starting = detector.start(() => undefined);
		detector.stop();
		ready();
		await starting;
		expect(calls).not.toContain("startCapturing");
	});

	it("asks the router to report to it once, however often it starts", async () => {
		const { router, calls } = fakeRouter();
		const detector = new Detector(ENGINE, router, Promise.resolve());
		await detector.start(() => undefined);
		detector.stop();
		await detector.start(() => undefined);
		expect(calls.filter((call) => call === "addResultReceiver")).toHaveLength(1);
		expect(calls.filter((call) => call === "startCapturing")).toHaveLength(2);
	});

	it("finds the boundary in an image with the document scanner's template once the router is set up", async () => {
		const { router, captured } = fakeRouter([found(300), {}]);
		let ready: () => void = () => undefined;
		const prepared = new Promise<void>((done) => (ready = done));
		const detector = new Detector(ENGINE, router, prepared);
		const image = new Blob(["still"], { type: "image/jpeg" });

		const finding = detector.detect(image);
		await Promise.resolve();
		expect(captured).toEqual([]);
		ready();

		expect((await finding)?.points[0]).toEqual({ x: 300, y: 50 });
		expect(captured).toEqual([[image, "mds-detect"]]);
		expect(await detector.detect(image)).toBeNull();
	});
});

describe("Detector, on overlapping detections", () => {
	/**
	 * A router whose captures wait until the test answers them, in order, and log
	 * when each starts.
	 */
	function heldRouter() {
		const { router, calls } = fakeRouter();
		const answers: ((result: DetectionResult) => void)[] = [];
		router.capture = (image: Blob) => {
			calls.push(`capture ${image.size}`);
			return new Promise((resolve) => answers.push(resolve));
		};
		/** Answer the oldest capture still waiting. */
		const answer = async (result: DetectionResult = found(300)) => {
			answers.shift()?.(result);
			await settle();
		};
		return { router, calls, answer };
	}

	/** Let the detector's waiting steps run. */
	function settle(): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve));
	}

	it("detects images one at a time, in the order asked", async () => {
		const { router, calls, answer } = heldRouter();
		const detector = new Detector(ENGINE, router, Promise.resolve());
		const first = detector.detect(new Blob(["a"]));
		const second = detector.detect(new Blob(["bb"]));
		await settle();
		expect(calls).toEqual(["capture 1"]);
		await answer();
		expect(calls).toEqual(["capture 1", "capture 2"]);
		await answer();
		await Promise.all([first, second]);
	});

	it("pauses camera frames while it detects an image", async () => {
		const { router, calls, answer } = heldRouter();
		const detector = new Detector(ENGINE, router, Promise.resolve());
		await detector.start(() => undefined);
		calls.length = 0;
		const detecting = detector.detect(new Blob(["a"]));
		await settle();
		expect(calls).toEqual(["stopCapturing", "capture 1"]);
		await answer();
		await detecting;
		expect(calls).toEqual(["stopCapturing", "capture 1", "startCapturing"]);
	});

	it("does not look at camera frames again when stopped during a detection", async () => {
		const { router, calls, answer } = heldRouter();
		const detector = new Detector(ENGINE, router, Promise.resolve());
		await detector.start(() => undefined);
		const detecting = detector.detect(new Blob(["a"]));
		await settle();
		detector.stop();
		calls.length = 0;
		await answer();
		await detecting;
		expect(calls).toEqual([]);
	});

	it("leaves the camera's frames alone when none are watched", async () => {
		const { router, calls, answer } = heldRouter();
		const detector = new Detector(ENGINE, router, Promise.resolve());
		const detecting = detector.detect(new Blob(["a"]));
		await settle();
		await answer();
		await detecting;
		expect(calls).toEqual(["capture 1"]);
	});

	it("looks at no camera frame until the image detection ends when started during it", async () => {
		const { router, calls, answer } = heldRouter();
		const detector = new Detector(ENGINE, router, Promise.resolve());
		const detecting = detector.detect(new Blob(["a"]));
		await settle();
		await detector.start(() => undefined);
		expect(calls).not.toContain("startCapturing");
		await answer();
		await detecting;
		expect(calls.at(-1)).toBe("startCapturing");
	});

	it("keeps camera frames paused between two image detections in a row", async () => {
		const { router, calls, answer } = heldRouter();
		const detector = new Detector(ENGINE, router, Promise.resolve());
		await detector.start(() => undefined);
		calls.length = 0;
		const both = Promise.all([detector.detect(new Blob(["a"])), detector.detect(new Blob(["bb"]))]);
		await settle();
		await answer();
		await answer();
		await both;
		expect(calls).toEqual(["stopCapturing", "capture 1", "capture 2", "startCapturing"]);
	});

	it("returns the boundary found when camera frames cannot start again", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const { router, answer } = heldRouter();
		const detector = new Detector(ENGINE, router, Promise.resolve());
		await detector.start(() => undefined);
		router.startCapturing = async () => {
			throw new Error("the camera is gone");
		};
		const detecting = detector.detect(new Blob(["a"]));
		await settle();
		await answer(found(300));
		expect((await detecting)?.points[0]).toEqual({ x: 300, y: 50 });
		await settle();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("started again"), expect.any(Error));
	});

	it("detects the next image after one that failed", async () => {
		const { router } = fakeRouter([found(300)]);
		const capture = router.capture;
		let first = true;
		router.capture = async (image, template) => {
			if (!first) return capture(image, template);
			first = false;
			throw new Error("the engine could not read the image");
		};
		const detector = new Detector(ENGINE, router, Promise.resolve());
		const failed = detector.detect(new Blob(["a"]));
		const next = detector.detect(new Blob(["b"]));
		await expect(failed).rejects.toThrow("could not read");
		expect((await next)?.points[0]).toEqual({ x: 300, y: 50 });
	});
});

describe("createDetector", () => {
	it("sets the router up with the document scanner's template before the first detection", async () => {
		const { router, calls, captured } = fakeRouter([found(300)]);
		const settings = { documentSettings: {} };
		const setUp = Object.assign(router, {
			initSettings: async () => void calls.push("initSettings"),
			getSimplifiedSettings: async (template: string) => {
				calls.push(`getSimplifiedSettings ${template}`);
				return settings;
			},
			updateSettings: async (template: string, updated: unknown) => {
				calls.push(`updateSettings ${template} ${String(updated === settings)}`);
			},
		});
		const detector = createDetector(
			ENGINE,
			setUp as unknown as Parameters<typeof createDetector>[1],
		);
		expect((await detector.detect(new Blob(["still"])))?.points[0]).toEqual({ x: 300, y: 50 });
		expect(calls).toEqual([
			"initSettings",
			"getSimplifiedSettings mds-detect",
			"updateSettings mds-detect true",
		]);
		expect(captured).toHaveLength(1);
	});
	it("fails the first detection with the setup's error when the setup fails", async () => {
		const { router } = fakeRouter();
		const failing = Object.assign(router, {
			initSettings: async () => Promise.reject(new Error("no document module")),
		});
		const detector = createDetector(
			ENGINE,
			failing as unknown as Parameters<typeof createDetector>[1],
		);
		await expect(detector.detect(new Blob(["still"]))).rejects.toThrow("no document module");
	});
});

describe("boundaryFinder", () => {
	it("reports a detection that fails, and finds no page", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const find = boundaryFinder({ detect: async () => Promise.reject(new Error("no module")) });
		expect(await find(new Blob(["still"]))).toBeNull();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("edges"), expect.any(Error));
	});
});

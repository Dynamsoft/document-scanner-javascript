import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { REAR_CAMERA, cameraLadder } from "./camera-constraints";

/** Pretend the browser does or does not support `resizeMode`. */
function supportResizeMode(supported: boolean): void {
	vi.spyOn(navigator.mediaDevices, "getSupportedConstraints").mockReturnValue({
		resizeMode: supported,
	} as MediaTrackSupportedConstraints);
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("cameraLadder", () => {
	it("demands native camera modes where the browser supports resizeMode", () => {
		supportResizeMode(true);
		const ladder = cameraLadder();
		const rungs = ladder.slice(0, -1);
		expect(rungs.length).toBeGreaterThan(0);
		for (const rung of rungs) expect(rung.resizeMode).toEqual({ exact: "none" });
		expect(ladder.at(-1)).toEqual({ resizeMode: "none" });
	});

	it("asks for sizes alone where the browser does not support resizeMode", () => {
		supportResizeMode(false);
		const ladder = cameraLadder();
		for (const rung of ladder) expect(rung.resizeMode).toBeUndefined();
		expect(ladder.at(-1)).toEqual({});
	});

	it("tries the largest size first and never asks for a larger one later", () => {
		supportResizeMode(false);
		const ideals = cameraLadder()
			.slice(0, -1)
			.map((rung) => (rung.width as ConstrainULongRange).ideal ?? 0);
		expect(ideals).toEqual([...ideals].sort((a, b) => b - a));
	});
});

describe("REAR_CAMERA", () => {
	it("asks for the rear camera as a preference, so a desktop webcam still opens", () => {
		expect(REAR_CAMERA).toEqual({ facingMode: { ideal: "environment" } });
	});
});

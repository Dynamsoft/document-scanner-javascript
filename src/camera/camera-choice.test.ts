import { describe, expect, it } from "vite-plus/test";
import { cameraOptions, mainRearCamera } from "./camera-choice";

// TODO: iOS camera setups
// TODO: most common webcam/kiosk camera setups

const ANDROID = [
	{ deviceId: "wide", label: "camera 2, facing back" },
	{ deviceId: "selfie", label: "camera 1, facing front" },
	{ deviceId: "main", label: "camera 0, facing back" },
	{ deviceId: "tele", label: "camera 3, facing back" },
];

describe("mainRearCamera", () => {
	it("picks the lowest-numbered rear camera in Chromium's Android labels", () => {
		expect(mainRearCamera(ANDROID)).toBe("main");
	});

	it("reads the older camera2 form of the label", () => {
		expect(
			mainRearCamera([
				{ deviceId: "b", label: "camera2 4, facing back" },
				{ deviceId: "a", label: "camera2 1, facing back" },
			]),
		).toBe("a");
	});

	it("has no opinion where the labels follow no known form", () => {
		expect(mainRearCamera([{ deviceId: "x", label: "Back Camera" }])).toBeUndefined();
		expect(mainRearCamera([])).toBeUndefined();
	});
});

describe("cameraOptions", () => {
	it("offers a flip between the two sides when the open camera reports a facing", () => {
		expect(cameraOptions(ANDROID, "environment")).toEqual([
			{ id: "environment", selector: { deviceId: { exact: "main" } } },
			{ id: "user", selector: { facingMode: { exact: "user" } } },
		]);
	});

	it("flips by facing alone when no label names the main rear camera", () => {
		const cameras = [
			{ deviceId: "back", label: "Back Camera" },
			{ deviceId: "front", label: "Front Camera" },
		];
		expect(cameraOptions(cameras, "user")[0]).toEqual({
			id: "environment",
			selector: { facingMode: { exact: "environment" } },
		});
	});

	it("lists every camera under its own label where the browser reports no facing", () => {
		const cameras = [
			{ deviceId: "usb", label: "USB Webcam" },
			{ deviceId: "built-in", label: "Integrated Camera" },
		];
		expect(cameraOptions(cameras, undefined)).toEqual([
			{ id: "usb", label: "USB Webcam", selector: { deviceId: { exact: "usb" } } },
			{
				id: "built-in",
				label: "Integrated Camera",
				selector: { deviceId: { exact: "built-in" } },
			},
		]);
	});

	it("lists a single camera even when it reports a facing, since there is nothing to flip to", () => {
		const cameras = [{ deviceId: "only", label: "camera 0, facing back" }];
		expect(cameraOptions(cameras, "environment")).toEqual([
			{ id: "only", label: "camera 0, facing back", selector: { deviceId: { exact: "only" } } },
		]);
	});
});

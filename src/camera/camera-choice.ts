import type { CameraConstraints } from "./camera-constraints";

// Which rear camera to open and which cameras to offer. Browsers list only a
// device id and a label. Everything else is read from the label.

/** A camera as the browser listed it. */
export interface ListedCamera {
	readonly deviceId: string;
	readonly label: string;
}

/** A switcher entry with the constraints that open it. */
export interface CameraOption {
	readonly id: string;
	/** The browser's label, shown in the camera menu. A flip between sides has none. */
	readonly label?: string;
	readonly selector: CameraConstraints;
}

/**
 * Chromium's Android label for a rear camera, `camera <n>, facing back`. The
 * lowest `n` is the main one. Older Chromium wrote `camera2 <n>`.
 */
const CHROMIUM_REAR = /^camera2? (\d+), facing back\b/;

/** Flip requests. The facing is exact, because a flip must change sides. */
const FLIP_TO_REAR: CameraConstraints = { facingMode: { exact: "environment" } };
const FLIP_TO_FRONT: CameraConstraints = { facingMode: { exact: "user" } };

/**
 * Find the main rear camera's device id, when the labels name it. For a rear
 * facing, Chromium opens the first rear lens it lists. That can be the ultra wide.
 */
export function mainRearCamera(cameras: readonly ListedCamera[]): string | undefined {
	let main: string | undefined;
	let lowest = Infinity;
	for (const camera of cameras) {
		const match = CHROMIUM_REAR.exec(camera.label);
		if (!match) continue;
		const place = Number(match[1]);
		if (place >= lowest) continue;
		main = camera.deviceId;
		lowest = place;
	}
	return main;
}

/**
 * List the switcher's entries with the constraints that open each. When the open
 * track reports a `facing` and there is more than one camera, the entries flip
 * sides. Otherwise every camera is listed under its label.
 */
export function cameraOptions(
	cameras: readonly ListedCamera[],
	facing: string | undefined,
): CameraOption[] {
	if ((facing === "environment" || facing === "user") && cameras.length > 1) {
		const main = mainRearCamera(cameras);
		return [
			{ id: "environment", selector: main ? { deviceId: { exact: main } } : FLIP_TO_REAR },
			{ id: "user", selector: FLIP_TO_FRONT },
		];
	}
	return cameras.map((camera) => ({
		id: camera.deviceId,
		label: camera.label,
		selector: { deviceId: { exact: camera.deviceId } },
	}));
}

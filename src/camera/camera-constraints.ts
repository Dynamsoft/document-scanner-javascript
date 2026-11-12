// Media constraints for which camera to open and at what size.

/** Media track constraints plus `resizeMode`. TypeScript's DOM types lack it. */
export type CameraConstraints = MediaTrackConstraints & { resizeMode?: ConstrainDOMString };

/**
 * Preferred camera sizes, best first. The first is the largest size phones run
 * smoothly. All are landscape, because browsers swap them on a portrait phone.
 * Chromium picks by the ideal, and Firefox with `resizeMode: none` takes the
 * smallest mode above the minimum. Frame rate is only an ideal, because Firefox
 * misreports it.
 */
const SIZE_RUNGS: readonly CameraConstraints[] = [
	{
		frameRate: { ideal: 30 },
		width: { min: 1600, ideal: 1920, max: 2048 },
		height: { min: 1300, ideal: 1440, max: 1536 },
	},
	{
		frameRate: { ideal: 30 },
		width: { min: 1024, ideal: 1600, max: 2048 },
		height: { min: 768, ideal: 1200, max: 1536 },
	},
	{
		frameRate: { ideal: 30 },
		width: { min: 640, ideal: 1280, max: 1600 },
		height: { min: 480, ideal: 960, max: 1200 },
	},
];

/**
 * Return the constraints to try, best first, ending with one any camera meets.
 * `resizeMode: none` asks for a native mode, because a cropped or scaled one can
 * come out the wrong shape. It is `exact`, because browsers drop a preference to
 * hit a size.
 */
export function cameraLadder(): CameraConstraints[] {
	const supported = navigator.mediaDevices.getSupportedConstraints() as {
		resizeMode?: boolean;
	};
	if (!supported.resizeMode) return [...SIZE_RUNGS, {}];
	return [
		...SIZE_RUNGS.map((rung) => ({ resizeMode: { exact: "none" }, ...rung })),
		{ resizeMode: "none" },
	];
}

/**
 * The rear camera, by facing mode. The engine's `"back"` preset goes by labels,
 * and on Firefox for Android it opens the front camera.
 */
export const REAR_CAMERA: CameraConstraints = { facingMode: { ideal: "environment" } };

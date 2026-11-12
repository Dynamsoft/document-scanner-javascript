// The class names and attributes that tie the capture screen to its markup. This
// file has no DOM code.

/**
 * The name of an area of the capture screen. The names stay the same between
 * releases, but the markup inside each area may change.
 */
export type CaptureScreenArea = "header" | "viewfinder" | "footer";

/**
 * The class of the element the camera engine mounts its video in. The capture
 * screen gives it to the viewfinder area.
 */
export const ENGINE_VIEWFINDER_CLASS: string = "dm-camera-core-container";

/**
 * The state of the camera's torch. The torch button is drawn from it. `absent`
 * means no camera is open, the camera is switching, or the camera has no torch. `refused` means the camera
 * claimed a torch and then would not light it.
 */
export type TorchState = "absent" | "refused" | "off" | "on";

/** The classes of the thumbnail button's latest page and page count. */
export const THUMBNAIL_PART_CLASSES = {
	image: "mds-capture-thumbnail-image",
	count: "mds-capture-count",
} as const;

/**
 * The classes of the camera switcher's menu and its entries. The document scanner
 * adds the entries at runtime.
 */
export const CAMERA_MENU_CLASS: string = "mds-camera-menu";
export const CAMERA_MENU_ITEM_CLASS: string = "mds-camera-menu-item";

/**
 * The class the capture screen gives the camera engine's layer in the viewfinder,
 * once the engine has added it, so the stylesheet can fit it.
 */
export const ENGINE_LAYER_CLASS: string = "mds-camera-layer";

/** The class of the outline drawn around a document found in the viewfinder. */
export const BOUNDARY_CLASS: string = "mds-boundary";

/**
 * The class of the hint over the viewfinder, which tells the user to move closer or
 * farther away. It is empty while there is no hint.
 */
export const HINT_CLASS: string = "mds-capture-hint";

/**
 * The classes of the scan region and of the box that holds it. The box covers the
 * camera's picture in the viewfinder, which shows the whole frame. The stylesheet
 * places the region in the box.
 */
export const SCAN_REGION_CLASSES = {
	picture: "mds-camera-picture",
	region: "mds-scan-region",
} as const;

/**
 * The classes of the busy spinners the document scanner adds. Every spinner has
 * `spinner`. One of the other two says where it sits.
 */
export const SPINNER_CLASSES = {
	spinner: "mds-spinner",
	viewfinder: "mds-spinner-viewfinder",
	thumbnail: "mds-spinner-thumbnail",
} as const;

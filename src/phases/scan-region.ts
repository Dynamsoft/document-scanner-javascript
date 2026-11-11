import { SCAN_REGION_CLASSES } from "./capture-contract";
import type { Box, FrameSize } from "../boundaries/framing";

// The scan region in the viewfinder, the part of the camera's picture that a page
// must be inside. The stylesheet places and draws it, so a host application can
// move or reshape it with its own rules.

/** The scan region in the viewfinder. */
export interface ScanRegion {
	/**
	 * Measure the region in the pixels of a frame of `size`. It is empty until the
	 * region is first laid out, and while the viewfinder has no size. After the frame
	 * changes shape, the region keeps its old shares until the next layout.
	 */
	measure(size: FrameSize): Box;
}

/** The region's sides, each as a share of the picture's width or height. */
type Shares = Box;

const EMPTY: Box = { left: 0, top: 0, right: 0, bottom: 0 };

/**
 * Add a scan region to the viewfinder, in a box that the stylesheet fits over the
 * camera's picture from the frame size. Each time the box or the region changes
 * size, it measures the region as shares of the picture, after layout. A measure
 * for a frame then reads no layout.
 */
export function createScanRegion(viewfinder: HTMLElement): ScanRegion {
	const picture = document.createElement("div");
	picture.className = SCAN_REGION_CLASSES.picture;
	picture.setAttribute("aria-hidden", "true");
	const region = picture.appendChild(document.createElement("div"));
	region.className = SCAN_REGION_CLASSES.region;
	viewfinder.append(picture);
	let shares: Shares | null = null;
	let fitted: FrameSize | null = null;
	const observer = new ResizeObserver(() => {
		shares = measureShares(picture, region);
	});
	observer.observe(picture);
	observer.observe(region);
	return {
		measure(size) {
			if (fitted?.width !== size.width || fitted.height !== size.height) {
				picture.style.setProperty("--mds-frame-width", String(size.width));
				picture.style.setProperty("--mds-frame-height", String(size.height));
				fitted = size;
			}
			if (!shares) return EMPTY;
			return {
				left: shares.left * size.width,
				top: shares.top * size.height,
				right: shares.right * size.width,
				bottom: shares.bottom * size.height,
			};
		},
	};
}

/**
 * The part of `picture` that `region` covers, as shares of its width and height, or
 * `null` while the picture has no size.
 */
function measureShares(picture: HTMLElement, region: HTMLElement): Shares | null {
	const shown = picture.getBoundingClientRect();
	if (shown.width <= 0 || shown.height <= 0) return null;
	const placed = region.getBoundingClientRect();
	const share = (offset: number, length: number) => Math.min(Math.max(offset / length, 0), 1);
	return {
		left: share(placed.left - shown.left, shown.width),
		top: share(placed.top - shown.top, shown.height),
		right: share(placed.right - shown.left, shown.width),
		bottom: share(placed.bottom - shown.top, shown.height),
	};
}

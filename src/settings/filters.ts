// The filters the edit screen's filter mode offers.

/** Every filter, in the order the filter mode shows them by default. */
export const FILTER_NAMES = [
	"none",
	"blackAndWhite",
	"gray",
	"removeShadow",
	"saveInk",
	"enhance",
] as const;

/**
 * A filter for the image of a page. `none` shows the page as rectified.
 *
 * @useDeclaredType
 */
export type FilterName = (typeof FILTER_NAMES)[number];

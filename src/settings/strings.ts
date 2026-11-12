import type { CaptureScreenButton } from "./buttons";
import type { FilterName } from "./filters";

// Display text, grouped by screen.

// A label and a tooltip for each key, such as `torch` and `torchTooltip`.
type WithTooltips<K extends string> = { readonly [P in K | `${K}Tooltip`]: string };

/** Text shared by every screen, for the notices and the license dialogs. */
export type CommonStrings = Readonly<{
	dismiss: string;
	/** The notice for a file that the browser cannot open as an image. */
	fileErrorTitle: string;
	fileErrorMessage: string;
	/** The notice for a page that could not be added to the document. */
	pageErrorTitle: string;
	pageErrorMessage: string;
	/**
	 * The notice for a scan that could not be finished. The pages stay, so the user
	 * can try again.
	 */
	finishErrorTitle: string;
	finishErrorMessage: string;
	/** The notice for a capture screen on a full document. */
	pageLimitNoticeTitle: string;
	pageLimitNoticeMessage: string;
	/** The question before a cancel drops the pages, and its two answers. */
	discardTitle: string;
	discardMessage: string;
	discard: string;
	keepScanning: string;
	trialNoticeTitle: string;
	trialNoticeMessage: string;
	licenseExpiredTitle: string;
	licenseExpiredMessage: string;
	licenseErrorTitle: string;
	licenseErrorMessage: string;
}>;

/**
 * The label and tooltip of each button on the capture screen, and the hints over
 * the viewfinder. While the document has pages, the thumbnail's accessible name is
 * its label, a space, and the page count, such as "Pages 3".
 */
export type CaptureStrings = WithTooltips<CaptureScreenButton> &
	Readonly<{
		/** The hint while auto-capture waits for a document that is too far away. */
		moveCloser: string;
		/** The hint while auto-capture waits for a document that is too close. */
		moveFarther: string;
	}>;

/** Text for the rectify screen. */
export type RectifyStrings = Readonly<{
	/**
	 * The button that applies changes to a page already in the document, in
	 * `fromEdit` mode.
	 */
	apply: string;
	/** The button that keeps a newly captured page, in `afterCapture` mode. */
	keep: string;
	detectBoundary: string;
	fullImage: string;
	undo: string;
	retake: string;
	cancel: string;
	/** The screen's title. It shows only when the screen opens from the edit screen. */
	title: string;
}>;

/** The edit screen's buttons that show only an icon. */
export const EDIT_ICON_BUTTONS = ["cancel", "thumbnails", "previousPage", "nextPage"] as const;

/** A button of the edit screen that shows only an icon. */
export type EditIconButton = (typeof EDIT_ICON_BUTTONS)[number];

/** The name of each filter in the filter mode, such as `filterGray` for `gray`. */
export type FilterStrings = { readonly [F in FilterName as `filter${Capitalize<F>}`]: string };

/**
 * Text for the edit screen. Each button has a label, and the buttons that show
 * only an icon also have a tooltip. Such a button's label is its accessible name.
 */
export type EditStrings = WithTooltips<EditIconButton> &
	FilterStrings &
	Readonly<{
		addPage: string;
		done: string;
		delete: string;
		undo: string;
		redo: string;
		/** The button that opens the rectify screen on the page showing. */
		rectify: string;
		rotate: string;
		/** The button that opens the filter mode, and the title of that mode. */
		filter: string;
		/** The button that keeps what a mode changed, and closes the mode. */
		modeApply: string;
		/** The button that takes back what a mode changed, and closes the mode. */
		modeCancel: string;
	}>;

/**
 * The text of the screens and the dialogs, by screen. A key without a value keeps
 * its English default. The published file `dist/defaults/settings.json` holds every
 * default text, under `strings`.
 */
export interface StringSettings {
	/**
	 * The text of the dialogs that every screen shares: the notices, the discard
	 * question, and the license dialogs.
	 */
	common?: Partial<CommonStrings>;
	/**
	 * The text of the capture screen. Each {@link CaptureScreenButton} has a label
	 * under its name, and a tooltip under its name with `Tooltip` after it, such as
	 * `torchTooltip`. The hints over the viewfinder are `moveCloser` and
	 * `moveFarther`.
	 */
	capture?: Partial<CaptureStrings>;
	/** The text of the rectify screen: its title and the label of each button. */
	rectify?: Partial<RectifyStrings>;
	/**
	 * The text of the edit screen: the label of each button, and a tooltip for
	 * `cancel`, `thumbnails`, `previousPage`, and `nextPage`, such as `cancelTooltip`.
	 * The key of each filter label is `filter` followed by the capitalized filter
	 * name, such as `filterGray`.
	 */
	edit?: Partial<EditStrings>;
}

/** The display text in effect, by screen. */
export interface ResolvedStrings {
	readonly common: CommonStrings;
	readonly capture: CaptureStrings;
	readonly rectify: RectifyStrings;
	readonly edit: EditStrings;
}

export const DEFAULT_COMMON_STRINGS: CommonStrings = {
	dismiss: "Dismiss",
	fileErrorTitle: "Could not open the file",
	fileErrorMessage: "This browser cannot open the file as an image. Try a JPEG or PNG image.",
	pageErrorTitle: "Could not add the page",
	pageErrorMessage:
		"The page could not be added, possibly because there are too many pages. Finish the scan or delete pages, then try again.",
	finishErrorTitle: "Could not finish the scan",
	finishErrorMessage: "The pages are still here, so you can try again.",
	pageLimitNoticeTitle: "Page limit reached",
	pageLimitNoticeMessage:
		"No more pages can be added. Finish the scan to keep the pages scanned so far.",
	discardTitle: "Discard all pages?",
	discardMessage: "The pages scanned so far will be lost.",
	discard: "Discard",
	keepScanning: "Keep scanning",
	trialNoticeTitle: "Trial license",
	trialNoticeMessage:
		"This document scanner is running on a trial license. Request your own key at [dynamsoft.com](https://www.dynamsoft.com/customer/license/trialLicense/?product=mds&deploymenttype=web).",
	licenseExpiredTitle: "License expired",
	licenseExpiredMessage:
		"This document scanner's license has expired. Renew it at [dynamsoft.com](https://www.dynamsoft.com/customer/license/trialLicense/?product=mds&deploymenttype=web) to continue scanning.",
	licenseErrorTitle: "License error",
	licenseErrorMessage:
		"This document scanner's license could not be verified. Check the license key and the network connection, then reload the page. If you don't have a license key yet, request a free trial at [dynamsoft.com](https://www.dynamsoft.com/customer/license/trialLicense/?product=mds&deploymenttype=web).",
};

export const DEFAULT_CAPTURE_STRINGS: CaptureStrings = {
	cancel: "Cancel",
	cancelTooltip: "Discard all pages and close",
	autoCapture: "Auto",
	autoCaptureTooltip: "Capture automatically once the page holds still",
	torch: "Torch",
	torchTooltip: "Toggle the torch",
	cameraSwitcher: "Flip",
	cameraSwitcherTooltip: "Switch camera",
	shutter: "Capture",
	shutterTooltip: "Capture this page",
	loadImage: "Import",
	loadImageTooltip: "Import an image",
	thumbnail: "Pages",
	thumbnailTooltip: "Review scanned pages",
	moveCloser: "Move closer",
	moveFarther: "Move farther away",
};

export const DEFAULT_RECTIFY_STRINGS: RectifyStrings = {
	apply: "Apply",
	keep: "Keep",
	detectBoundary: "Detect borders",
	fullImage: "Full image",
	undo: "Undo",
	retake: "Retake",
	cancel: "Cancel",
	title: "Adjust",
};

export const DEFAULT_EDIT_STRINGS: EditStrings = {
	cancel: "Cancel",
	cancelTooltip: "Discard all pages and close",
	addPage: "Add page",
	done: "Done",
	thumbnails: "Pages",
	thumbnailsTooltip: "Show or hide the pages",
	previousPage: "Previous page",
	previousPageTooltip: "Go to the previous page",
	nextPage: "Next page",
	nextPageTooltip: "Go to the next page",
	delete: "Delete",
	undo: "Undo",
	redo: "Redo",
	rectify: "Borders",
	rotate: "Rotate",
	filter: "Filter",
	modeApply: "Apply",
	modeCancel: "Cancel",
	filterNone: "Original",
	filterBlackAndWhite: "Black & white",
	filterGray: "Grayscale",
	filterRemoveShadow: "Remove shadow",
	filterSaveInk: "Save ink",
	filterEnhance: "Enhance",
};

/** All the default text, by screen. */
export const DEFAULT_STRINGS: ResolvedStrings = {
	common: DEFAULT_COMMON_STRINGS,
	capture: DEFAULT_CAPTURE_STRINGS,
	rectify: DEFAULT_RECTIFY_STRINGS,
	edit: DEFAULT_EDIT_STRINGS,
};

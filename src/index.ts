/**
 * Dynamsoft Mobile Document Scanner. It captures document pages with the camera or
 * from image files, lets the user rectify, check, and edit them, and exports the
 * result.
 *
 * The host application is the web application that embeds the document scanner.
 * It gives the document scanner its settings and handlers, and receives the result.
 * The user is the person who scans.
 *
 * A session is one run of {@link DocumentScanner.scan | scan()}, from the call until
 * it resolves. The pages belong to the document scanner and outlive a session. A
 * finished or failed session keeps them for the next session. The pages go with
 * {@link DocumentScanner.cancel | cancel()}, {@link DocumentScanner.reset | reset()},
 * and {@link DocumentScanner.dispose | dispose()}.
 *
 * Make a {@link DocumentScanner} with {@link ScannerSettings}, and call `scan()`.
 * `scan()` resolves with a {@link ScanResult} when the session ends. An import of this module
 * has no side effects. The engines load on {@link DocumentScanner.preload | preload()}
 * or on the first `scan()`, so the module is safe to import during server-side
 * rendering.
 *
 * The package follows Semantic Versioning 2.0.0. Only a major release breaks the
 * public interface, with two exceptions. A minor release may add a member to a
 * union whose documentation says so, such as {@link ScannerError}. A member marked
 * as experimental can change in any release.
 *
 * @packageDocumentation
 */
export { DocumentScanner } from "./flow/document-scanner";
export type { ScannerEventName, ScannerEvents } from "./flow/events";
export type { CaptureScreenArea } from "./phases/capture-contract";
export type { OverlayName } from "./ui/overlay";
export type { ThemeToken, ThemeTokens } from "./settings/theme";
export type { FilterName } from "./settings/filters";
export type { StringSettings } from "./settings/strings";
export type {
	CaptureLayout,
	CaptureSettings,
	EditMode,
	EditLayout,
	EditModes,
	EditSettings,
	EngineSettings,
	FilterModeSettings,
	OutputSettings,
	PhaseSettings,
	RectifyMode,
	RectifyModes,
	RectifyModeSettings,
	RectifyLayout,
	RectifySettings,
	ResourceSettings,
	ScannerSettings,
} from "./settings/settings";
export type {
	AfterCaptureButton,
	ButtonEvent,
	CaptureScreenButton,
	ButtonSettings,
	ButtonSettingsFor,
	EditModeButton,
	EditScreenButton,
	FromEditButton,
	RectifyScreenButton,
} from "./settings/buttons";
export { ScannerStateError } from "./faults";
export type { LicenseErrorReason, ScannerError, ScannerStateReason } from "./faults";
export type {
	DocumentChange,
	DocumentState,
	ImageEncoding,
	ModeName,
	Navigation,
	PageId,
	PageImage,
	PageImageBase,
	PhaseName,
	Point,
	Quadrilateral,
	RasterImage,
	ScannedPage,
	ScannedPages,
	ScanOutput,
	ScanResult,
	SuccessfulScan,
	VectorImage,
} from "./results";

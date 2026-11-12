/**
 * The reason that a session failed. To handle the error, read `kind`, because the
 * wording of `message` can change. A minor release may add a kind, so
 * a switch on `kind` needs a default branch.
 */
export type ScannerError =
	/** The license check failed. {@link LicenseErrorReason | reason} says why. */
	| { readonly kind: "license"; readonly message: string; readonly reason: LicenseErrorReason }
	/** The user or the browser refused access to the camera. */
	| { readonly kind: "cameraPermission"; readonly message: string }
	/** The document scanner could not open a camera. */
	| { readonly kind: "cameraUnavailable"; readonly message: string }
	/** A container selector matched no element. `selector` names it. */
	| { readonly kind: "container"; readonly message: string; readonly selector?: string }
	/** An engine, or one of its runtime files, failed to load. `engine` names the engine. */
	| {
			readonly kind: "engineLoad";
			readonly message: string;
			readonly engine: "captureVision" | "documentViewer";
	  }
	/** Any other failure. */
	| { readonly kind: "internal"; readonly message: string };

/**
 * The reason that a license check failed: the key `expired`, the engines
 * `rejected` the key, or the document scanner reached no license server
 * (`unreachable`).
 */
export type LicenseErrorReason = "expired" | "rejected" | "unreachable";

/**
 * An `Error` that carries a `ScannerError`. `toScannerError` unwraps it when the
 * scan is reported.
 */
export class ScannerFault extends Error {
	readonly error: ScannerError;

	constructor(error: ScannerError, cause?: unknown) {
		super(error.message, { cause });
		this.name = "ScannerFault";
		this.error = error;
	}
}

/**
 * The reason that the document scanner could not start the work of a method: it is
 * `disposed`, or a session runs (`sessionRunning`).
 */
export type ScannerStateReason = "disposed" | "sessionRunning";

/** The message of each `ScannerStateReason`. */
const STATE_MESSAGES: Readonly<Record<ScannerStateReason, string>> = {
	disposed: "This document scanner is disposed; construct a new one",
	sessionRunning: "A session is already running; call cancel() first",
};

/**
 * The error of a method that starts work, when the document scanner cannot start
 * it. The methods are {@link DocumentScanner.preload | preload()},
 * {@link DocumentScanner.scan | scan()}, and {@link DocumentScanner.reset | reset()}.
 * As with the errors of the DOM for a call in the wrong state, it is a
 * `DOMException` with the name `InvalidStateError`.
 */
export class ScannerStateError extends DOMException {
	/** The reason that the method could not start. */
	readonly reason: ScannerStateReason;

	/**
	 * Make the error for `reason`, with the message of that reason.
	 *
	 * @param reason - The reason that the method could not start.
	 */
	constructor(reason: ScannerStateReason) {
		super(STATE_MESSAGES[reason], "InvalidStateError");
		this.reason = reason;
	}
}

/**
 * Convert anything thrown into a `ScannerError`. Unrecognized errors become
 * `internal`.
 */
export function toScannerError(thrown: unknown): ScannerError {
	if (thrown instanceof ScannerFault) return thrown.error;
	return { kind: "internal", message: describe(thrown) };
}

/**
 * Warn on the console about a failure the session survives, such as a page that
 * could not be captured.
 *
 * TODO: pass these to an `onError` setting once there is one.
 */
export function reportFault(what: string, thrown: unknown): void {
	console.warn(`Mobile Document Scanner: ${what}. ${describe(thrown)}`, thrown);
}

/** Warn on the console about a risk the document scanner carries on despite. */
export function reportWarning(message: string): void {
	console.warn(`Mobile Document Scanner: ${message}.`);
}

/** Return the message of an `Error`, or the string form of anything else thrown. */
export function describe(thrown: unknown): string {
	return thrown instanceof Error ? thrown.message : String(thrown);
}

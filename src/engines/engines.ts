import type * as CaptureVisionBundle from "dynamsoft-capture-vision-bundle";
import type { EngineResourcePaths } from "dynamsoft-capture-vision-bundle";
import { ScannerFault, describe, reportWarning } from "../faults";
import type { LicenseErrorReason } from "../faults";
import { DEFAULT_RESOURCE_ROOT } from "../settings/settings";
import type { EngineSettings, ResolvedSettings } from "../settings/settings";
import type { DocumentViewerEngine } from "./document-viewer";

// Loading Capture Vision and Document Viewer, in the order they need.

type CaptureVision = typeof CaptureVisionBundle;
type Router = CaptureVisionBundle.CaptureVisionRouter;

/** Both engines, loaded and licensed. */
export interface Engines<CV, R, DV> {
	readonly captureVision: CV;
	/** The router that finds page boundaries. */
	readonly router: R;
	readonly documentViewer: DV;
	/** The URL of Document Viewer's stylesheet. */
	readonly stylesheet: string;
	/** Whether the license is a trial. */
	readonly trial: boolean;
}

/** The engines the document scanner loads. */
export type LoadedEngines = Engines<CaptureVision, Router, DocumentViewerEngine>;

/** The members of the Capture Vision module that loading uses. */
export interface CaptureVisionLoading<R> {
	readonly CoreModule: { engineResourcePaths: EngineResourcePaths; getVersion(): string };
	readonly LicenseManager: {
		initLicense(license: string, options: { executeNow: boolean }): Promise<void>;
	};
	readonly CaptureVisionRouter: { createInstance(loadPresetTemplates: boolean): Promise<R> };
}

/** The members of Document Viewer's `DDV` that loading uses. */
export interface DocumentViewerLoading {
	readonly Core: {
		readonly versionInfo: { readonly viewer?: string };
		engineResourcePath: string;
		license: string;
		init(): Promise<{ readonly licenseInfo: { readonly trial: number } }>;
	};
}

/**
 * The installed engines' versions, read by the build. Capture Vision reports only
 * its core version at runtime, so the build reads that too.
 */
const BUILT: {
	readonly captureVision: string;
	readonly captureVisionCore: string;
	readonly documentViewer: string;
} = import.meta.env.ENGINE_VERSIONS;

/** The Capture Vision this document scanner was built against, by both versions. */
const BUILT_CAPTURE_VISION = `Dynamsoft Capture Vision ${BUILT.captureVision}, whose core is ${BUILT.captureVisionCore}`;

/** Where each engine module comes from. */
export interface EngineImports<CV, DV> {
	readonly captureVision: () => Promise<CV>;
	readonly documentViewer: () => Promise<{ readonly DDV: DV }>;
}

/**
 * The engine modules the settings supply, or else a dynamic import of each. The
 * imports are dynamic because the engines touch the DOM as they load.
 */
export function engineImports(
	supplied: EngineSettings | undefined,
): EngineImports<CaptureVision, DocumentViewerEngine> {
	return {
		captureVision: async () => {
			const engine = supplied?.captureVision;
			if (!engine) return import("dynamsoft-capture-vision-bundle");
			assertMatchingVersion(
				"The core of the Dynamsoft Capture Vision",
				coreVersion(engine.CoreModule),
				BUILT.captureVisionCore,
				BUILT_CAPTURE_VISION,
			);
			return engine;
		},
		documentViewer: async () => {
			const engine = supplied?.documentViewer;
			if (!engine) return import("dynamsoft-document-viewer");
			assertMatchingVersion(
				"The Dynamsoft Document Viewer",
				engine.DDV.Core.versionInfo.viewer,
				BUILT.documentViewer,
				`Dynamsoft Document Viewer ${BUILT.documentViewer}`,
			);
			return engine;
		},
	};
}

/**
 * Load both engines. Document Viewer checks the form of the key first, then
 * Capture Vision is licensed, because Document Viewer reuses its license result.
 * The router is created while Document Viewer starts.
 */
export async function loadEngines<CV, R extends { dispose(): void }, DV>(
	settings: ResolvedSettings,
	imports: EngineImports<CV & CaptureVisionLoading<R>, DV & DocumentViewerLoading>,
): Promise<Engines<CV, R, DV>> {
	const captureVision = await loadModule("captureVision", imports.captureVision);
	warnIfAnotherCopyLoadedFirst(captureVision.CoreModule);
	captureVision.CoreModule.engineResourcePaths = settings.resources.captureVision;
	// An undocumented flag that turns off the engine's license dialog. The document
	// scanner shows its own.
	Object.assign(captureVision.LicenseManager, { _bNeverShowDialog: true });
	const { DDV: documentViewer } = await loadModule("documentViewer", imports.documentViewer);
	const directory = documentViewerDirectory(settings, documentViewer.Core.versionInfo.viewer);
	documentViewer.Core.engineResourcePath = directory;
	// Document Viewer's setter refuses a malformed key. Capture Vision would take one
	// as its public trial, so the setter runs first. A key that passes still meets
	// every check of Capture Vision.
	try {
		documentViewer.Core.license = settings.license;
	} catch (cause) {
		throw new ScannerFault(
			{ kind: "license", message: "License string is invalid.", reason: "rejected" },
			cause,
		);
	}
	try {
		// An empty key means the public trial of both engines.
		await captureVision.LicenseManager.initLicense(settings.license, { executeNow: true });
	} catch (cause) {
		throw licenseFault(cause);
	}
	const [router, started] = await Promise.allSettled([
		// `false` to not load library-external preset templates.
		captureVision.CaptureVisionRouter.createInstance(false),
		startDocumentViewer(documentViewer),
	]);
	if (router.status === "rejected") {
		throw new ScannerFault(
			{ kind: "engineLoad", engine: "captureVision", message: describe(router.reason) },
			router.reason,
		);
	}
	if (started.status === "rejected") {
		router.value.dispose();
		throw started.reason;
	}
	return {
		captureVision,
		router: router.value,
		documentViewer,
		stylesheet: stylesheetUrl(directory),
		trial: started.value,
	};
}

/** Start Document Viewer, licensed with the key it was given, and say whether it is a trial. */
async function startDocumentViewer(documentViewer: DocumentViewerLoading): Promise<boolean> {
	// init() reuses the license result Capture Vision stored in
	// window.Dynamsoft.Core.mapPackageRegister. That skips this engine's trial
	// dialog. The dialog has no flag to turn it off.
	let result;
	try {
		result = await documentViewer.Core.init();
	} catch (cause) {
		// The engine puts its code in the error's cause. Its license codes run from
		// -80000 to its init and file codes at -80050, and it gives a license server's
		// code as that code plus 20000, negated.
		const code = (cause as { cause?: { code?: number } } | null)?.cause?.code;
		const license =
			typeof code === "number" &&
			((code <= -80000 && code > -80050) || (code < -20000 && code > -30000));
		throw license
			? licenseFault(cause, code)
			: new ScannerFault(
					{ kind: "engineLoad", engine: "documentViewer", message: describe(cause) },
					cause,
				);
	}
	// TODO: add a preloadPdfEngine setting that calls Core.loadWasm() here.
	return Boolean(result.licenseInfo.trial);
}

/**
 * Throw unless an engine passed in `engines` has the installed engine's major and
 * minor version. One that reports no version fails too. npm never saw it, so
 * nothing else checks its version.
 */
function assertMatchingVersion(
	what: string,
	reported: string | undefined,
	built: string,
	builtAgainst: string,
): void {
	if (majorMinor(reported) === majorMinor(built)) return;
	throw new Error(
		`${what} passed in \`engines\` reports ${reported ?? "no version"}, but this document scanner was built against ${builtAgainst}. Their major and minor versions must match`,
	);
}

/**
 * Warn if another copy of Capture Vision loaded first and owns the page-wide
 * `window.Dynamsoft` namespace. Document Viewer reads its license and file paths
 * through that copy, so a copy another SDK has set up can make it fail to load.
 */
function warnIfAnotherCopyLoadedFirst(ours: object): void {
	const page = globalThis as { Dynamsoft?: { Core?: { CoreModule?: { getVersion?(): string } } } };
	const owner = page.Dynamsoft?.Core?.CoreModule;
	if (!owner || owner === ours) return;
	const theirs = coreVersion(owner);
	reportWarning(
		`another copy of Dynamsoft Capture Vision, ${theirs ? `core ${theirs}` : "which reports no version"}, loaded before this document scanner's ${BUILT_CAPTURE_VISION}. Dynamsoft Document Viewer reads its license and file paths through whichever copy loaded first, so it may fail to load`,
	);
}

/** The core version a Capture Vision module reports, without the notes after it. */
function coreVersion(core: { getVersion?(): string }): string | undefined {
	return /^\d+\.\d+\.\d+/.exec(core.getVersion?.() ?? "")?.[0];
}

/** The major and minor numbers of a version, where compatibility breaks. */
function majorMinor(version: string | undefined): string | undefined {
	return version?.split(".", 2).join(".");
}

/** Document Viewer's code for an expired license. */
const DOCUMENT_VIEWER_LICENSE_EXPIRED = -80002;

/**
 * Make the error for a failed license check, with its reason read from the
 * engine's message and Document Viewer's code. Capture Vision rejects with only a
 * message, so its wording is read here and nowhere else.
 */
function licenseFault(cause: unknown, code?: number): ScannerFault {
	const message = describe(cause);
	let reason: LicenseErrorReason = "rejected";
	// Also when a cached license has expired, since going online fixes that too.
	if (/failed to (connect to|reach) .*license server/i.test(message)) reason = "unreachable";
	else if (code === DOCUMENT_VIEWER_LICENSE_EXPIRED || /expire/i.test(message)) reason = "expired";
	return new ScannerFault({ kind: "license", message, reason }, cause);
}

/** Import an engine module, reporting a failure as that engine's load fault. */
async function loadModule<M>(
	engine: "captureVision" | "documentViewer",
	load: () => Promise<M>,
): Promise<M> {
	try {
		return await load();
	} catch (cause) {
		throw new ScannerFault({ kind: "engineLoad", engine, message: describe(cause) }, cause);
	}
}

/**
 * Return the directory the settings name for Document Viewer's runtime files, or
 * else the engine version's directory under Capture Vision's resource root.
 */
function documentViewerDirectory(settings: ResolvedSettings, version: string | undefined): string {
	const explicit = settings.resources.documentViewer;
	if (explicit !== undefined) return explicit;
	if (!version) {
		// The version is optional in the engine's typings.
		throw new ScannerFault({
			kind: "engineLoad",
			engine: "documentViewer",
			message:
				"Dynamsoft Document Viewer reports no version, so its resource directory cannot be " +
				"composed. Set resources.documentViewer to the serving directory.",
		});
	}
	const root = trailingSlash(
		settings.resources.captureVision.rootDirectory ?? DEFAULT_RESOURCE_ROOT,
	);
	return `${root}dynamsoft-document-viewer@${version}/dist/engine`;
}

/**
 * Return the URL of the engine's stylesheet, `dist/ddv.css` beside `dist/engine/`.
 * This assumes the published directory layout.
 */
function stylesheetUrl(engineDirectory: string): string {
	return `${trailingSlash(engineDirectory).replace(/[^/]+\/$/, "")}ddv.css`;
}

function trailingSlash(path: string): string {
	return path.endsWith("/") ? path : `${path}/`;
}

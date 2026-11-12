import type { EngineResourcePaths } from "dynamsoft-capture-vision-bundle";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { toScannerError } from "../faults";
import type { LicenseErrorReason, ScannerError } from "../faults";
import { DEFAULT_RESOURCE_ROOT, resolveSettings } from "../settings/settings";
import type { ScannerSettings } from "../settings/settings";
import { engineImports, loadEngines } from "./engines";
import type { CaptureVisionLoading, DocumentViewerLoading, EngineImports } from "./engines";

/** A router that records whether it was disposed. */
class FakeRouter {
	disposed = false;

	dispose(): void {
		this.disposed = true;
	}
}

/** What each fake engine call does instead of succeeding. */
interface Failures {
	readonly captureVisionImport?: Error;
	readonly license?: Error;
	readonly router?: Error;
	readonly documentViewerImport?: Error;
	readonly documentViewerLicense?: Error;
	readonly init?: Error;
}

/** Fake engine modules that log each loading call in the order it is made. */
function fakeEngines(fail: Failures = {}, trial = 0) {
	const log: string[] = [];
	const router = new FakeRouter();
	const paths: EngineResourcePaths = {};
	let documentViewerKey = "";
	const captureVision = {
		CoreModule: {
			engineResourcePaths: paths,
			getVersion: () => reported(BUILT.captureVisionCore),
		},
		LicenseManager: {
			initLicense: async (license: string) => {
				log.push(`initLicense ${license}`);
				if (fail.license) throw fail.license;
			},
		},
		CaptureVisionRouter: {
			createInstance: async () => {
				log.push("createInstance");
				if (fail.router) throw fail.router;
				return router;
			},
		},
	} satisfies CaptureVisionLoading<FakeRouter>;
	const documentViewer = {
		Core: {
			versionInfo: { viewer: "3.2.0" },
			engineResourcePath: "",
			get license() {
				return documentViewerKey;
			},
			set license(key: string) {
				log.push(`license ${key}`);
				if (fail.documentViewerLicense) throw fail.documentViewerLicense;
				documentViewerKey = key;
			},
			init: async () => {
				log.push("init");
				if (fail.init) throw fail.init;
				return { licenseInfo: { trial } };
			},
		},
	} satisfies DocumentViewerLoading;
	const imports = {
		captureVision: async () => {
			log.push("import Capture Vision");
			if (fail.captureVisionImport) throw fail.captureVisionImport;
			return captureVision;
		},
		documentViewer: async () => {
			log.push("import Document Viewer");
			if (fail.documentViewerImport) throw fail.documentViewerImport;
			return { DDV: documentViewer };
		},
	} satisfies EngineImports<typeof captureVision, typeof documentViewer>;
	return { log, router, captureVision, documentViewer, imports };
}

/** The installed Capture Vision, as the build read it. */
const BUILT: {
	readonly captureVision: string;
	readonly captureVisionCore: string;
	readonly documentViewer: string;
} = import.meta.env.ENGINE_VERSIONS;

/** The installed Capture Vision, as the loader's messages name it. */
const BUILT_CAPTURE_VISION = `Dynamsoft Capture Vision ${BUILT.captureVision}, whose core is ${BUILT.captureVisionCore}`;

/** A core version as Capture Vision reports it, with its notes after it. */
const reported = (core: string) =>
	`${core}-dev-20260101000000(Worker: Not Loaded, Wasm: Not Loaded)`;

/**
 * Put a copy of Capture Vision's core module in the page-wide namespace, as the
 * first copy to load does.
 */
const ownNamespace = (CoreModule: object) => vi.stubGlobal("Dynamsoft", { Core: { CoreModule } });

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

/** Messages Capture Vision rejects its license check with, copied from the engine. */
const CAPTURE_VISION = {
	unknownKey:
		"An error occurred during authorization: Non-existent handshake code on Dynamsoft License Server. Contact the site administrator for more information.",
	malformedKey:
		"An error occurred during authorization: Organization id does not exist or lacks a configured default handshake. Contact the site administrator for more information.",
	expired: "The license has expired.",
	trialExpired:
		"The trial period expired. Please extend the trial or purchase a full license to continue;",
	noConnection:
		"Failed to connect to the Dynamsoft License Server: network connection error. Check your Internet connection or contact the site administrator for more information.",
	timedOut:
		"Failed to connect to the Dynamsoft License Server: network timed out. Check your Internet connection or contact the site administrator for more information.",
	cacheExpired:
		"Failed to connect to the Dynamsoft License Server: The cached license has expired. Please get connected to the network as soon as possible or contact the site administrator for more information.",
	notReached: "Failed to reach License Server.",
};

/** Document Viewer's message for a failed connection, copied from the engine. */
const DOCUMENT_VIEWER_NO_CONNECTION =
	"Failed to connect to the Dynamsoft License Server. The cached license has expired. Please get connected to the network as soon as possible or contact the site administrator for more information.";

const load = (fakes: ReturnType<typeof fakeEngines>, settings: ScannerSettings = {}) =>
	loadEngines(resolveSettings(settings), fakes.imports);

/** An error shaped as Document Viewer throws it, with its code in the cause. */
function documentViewerError(message: string, code: number): Error {
	return new Error(message, { cause: { code, message } });
}

/** The reason a load gives for a failed license check. */
async function reasonOf(fakes: ReturnType<typeof fakeEngines>): Promise<LicenseErrorReason> {
	const error = await failureOf(load(fakes));
	if (error.kind !== "license") throw new Error(`The load failed with ${error.kind}`);
	return error.reason;
}

/** The error a load fails with. */
async function failureOf(loading: Promise<unknown>): Promise<ScannerError> {
	try {
		await loading;
	} catch (thrown) {
		return toScannerError(thrown);
	}
	throw new Error("The load did not fail");
}

describe("loadEngines", () => {
	it("loads the engines in the order that the license check needs", async () => {
		const fakes = fakeEngines();
		await load(fakes, { license: "KEY" });
		expect(fakes.log).toEqual([
			"import Capture Vision",
			"import Document Viewer",
			"license KEY",
			"initLicense KEY",
			"createInstance",
			"init",
		]);
	});

	it("returns both engines, the router, and Document Viewer's stylesheet", async () => {
		const fakes = fakeEngines();
		const engines = await load(fakes, { resources: { captureVision: { rootDirectory: "/e/" } } });
		expect(engines).toEqual({
			captureVision: fakes.captureVision,
			router: fakes.router,
			documentViewer: fakes.documentViewer,
			stylesheet: "/e/dynamsoft-document-viewer@3.2.0/dist/ddv.css",
			trial: false,
		});
	});

	it("points both engines at their files and gives both the license key", async () => {
		const fakes = fakeEngines();
		const captureVision = { rootDirectory: "/e/" };
		await load(fakes, { license: "KEY", resources: { captureVision } });
		expect(fakes.captureVision.CoreModule.engineResourcePaths).toBe(captureVision);
		expect(fakes.documentViewer.Core.engineResourcePath).toBe(
			"/e/dynamsoft-document-viewer@3.2.0/dist/engine",
		);
		expect(fakes.documentViewer.Core.license).toBe("KEY");
	});

	it("points Document Viewer at the directory the settings name, and its stylesheet beside it", async () => {
		const fakes = fakeEngines();
		const engines = await load(fakes, {
			resources: { documentViewer: "/viewer/dist/engine" },
		});
		expect(fakes.documentViewer.Core.engineResourcePath).toBe("/viewer/dist/engine");
		expect(engines.stylesheet).toBe("/viewer/dist/ddv.css");
	});

	it("looks for Document Viewer under the default root when Capture Vision's map names none", async () => {
		const fakes = fakeEngines();
		await load(fakes, { resources: { captureVision: {} } });
		expect(fakes.documentViewer.Core.engineResourcePath).toBe(
			`${DEFAULT_RESOURCE_ROOT}dynamsoft-document-viewer@3.2.0/dist/engine`,
		);
	});

	it("fails as Document Viewer's load error when it reports no version and no directory is set", async () => {
		const fakes = fakeEngines();
		Object.assign(fakes.documentViewer.Core.versionInfo, { viewer: undefined });
		expect(await failureOf(load(fakes))).toMatchObject({
			kind: "engineLoad",
			engine: "documentViewer",
			message: expect.stringContaining("resources.documentViewer"),
		});
	});

	it("turns off Capture Vision's license dialog", async () => {
		const fakes = fakeEngines();
		await load(fakes);
		expect(fakes.captureVision.LicenseManager).toHaveProperty("_bNeverShowDialog", true);
	});

	it("reports a trial license", async () => {
		expect((await load(fakeEngines({}, 1))).trial).toBe(true);
	});

	it("loads nothing more after a failed license check", async () => {
		const fakes = fakeEngines({ license: new Error(CAPTURE_VISION.unknownKey) });
		expect(await failureOf(load(fakes))).toEqual({
			kind: "license",
			message: CAPTURE_VISION.unknownKey,
			reason: "rejected",
		});
		expect(fakes.log).not.toContain("createInstance");
		expect(fakes.log).not.toContain("init");
	});

	it.each<[string, LicenseErrorReason, Failures]>([
		["Capture Vision's unknown key", "rejected", { license: new Error(CAPTURE_VISION.unknownKey) }],
		[
			"Capture Vision's malformed key",
			"rejected",
			{ license: new Error(CAPTURE_VISION.malformedKey) },
		],
		["Capture Vision's expired key", "expired", { license: new Error(CAPTURE_VISION.expired) }],
		[
			"Capture Vision's ended trial",
			"expired",
			{ license: new Error(CAPTURE_VISION.trialExpired) },
		],
		[
			"Capture Vision's lost connection",
			"unreachable",
			{ license: new Error(CAPTURE_VISION.noConnection) },
		],
		["Capture Vision's timeout", "unreachable", { license: new Error(CAPTURE_VISION.timedOut) }],
		[
			"Capture Vision's expired cache, with no server",
			"unreachable",
			{ license: new Error(CAPTURE_VISION.cacheExpired) },
		],
		[
			"Capture Vision's unreached server",
			"unreachable",
			{ license: new Error(CAPTURE_VISION.notReached) },
		],
		[
			"Document Viewer's invalid key",
			"rejected",
			{ init: documentViewerError("License string is invalid.", -80001) },
		],
		[
			"Document Viewer's code for a server's refusal",
			"rejected",
			{ init: documentViewerError(CAPTURE_VISION.unknownKey, -20101) },
		],
		[
			"Document Viewer's expired key",
			"expired",
			{ init: documentViewerError("The license is no longer valid.", -80002) },
		],
		[
			// Document Viewer gives a failed connection its code for an invalid key.
			"Document Viewer's lost connection",
			"unreachable",
			{ init: documentViewerError(DOCUMENT_VIEWER_NO_CONNECTION, -80001) },
		],
	])("reads %s as a license error that is %s", async (_, reason, failures) => {
		expect(await reasonOf(fakeEngines(failures))).toBe(reason);
	});

	it("reports an engine module that fails to import as that engine's load error", async () => {
		const captureVision = fakeEngines({ captureVisionImport: new Error("No bundle") });
		expect(await failureOf(load(captureVision))).toEqual({
			kind: "engineLoad",
			engine: "captureVision",
			message: "No bundle",
		});
		const documentViewer = fakeEngines({ documentViewerImport: new Error("No viewer") });
		expect(await failureOf(load(documentViewer))).toEqual({
			kind: "engineLoad",
			engine: "documentViewer",
			message: "No viewer",
		});
	});

	it("reports a router that fails to load as Capture Vision's load error", async () => {
		const fakes = fakeEngines({ router: new Error("No WebAssembly") });
		expect(await failureOf(load(fakes))).toEqual({
			kind: "engineLoad",
			engine: "captureVision",
			message: "No WebAssembly",
		});
	});

	it("reports Document Viewer's codes outside its license codes as its load error", async () => {
		const missing = documentViewerError(
			"DDV.Core.init: Resource is not found from the specified engineResourcePath.",
			-80052,
		);
		expect(await failureOf(load(fakeEngines({ init: missing })))).toMatchObject({
			kind: "engineLoad",
			engine: "documentViewer",
		});
		const other = documentViewerError("No worker", -1);
		expect(await failureOf(load(fakeEngines({ init: other })))).toEqual({
			kind: "engineLoad",
			engine: "documentViewer",
			message: "No worker",
		});
	});

	it("rejects a malformed key before Capture Vision would quietly take it as its public trial", async () => {
		const malformed = documentViewerError("DDV.Core.license: 'license' is invalid.", -80100);
		const fakes = fakeEngines({ documentViewerLicense: malformed });
		expect(await failureOf(load(fakes, { license: "YOUR_LICENSE_KEY_HERE" }))).toEqual({
			kind: "license",
			message: "License string is invalid.",
			reason: "rejected",
		});
		expect(fakes.log).not.toContain("initLicense YOUR_LICENSE_KEY_HERE");
		expect(fakes.log).not.toContain("init");
	});

	it("warns, naming both versions, when another copy of Capture Vision owns the page's namespace", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		ownNamespace({ getVersion: () => reported("4.4.20") });
		await load(fakeEngines());
		expect(warn).toHaveBeenCalledOnce();
		expect(warn.mock.calls[0]?.[0]).toContain("core 4.4.20");
		expect(warn.mock.calls[0]?.[0]).toContain(BUILT_CAPTURE_VISION);
	});

	it("warns of another copy that reports no version", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		ownNamespace({});
		await load(fakeEngines());
		expect(warn.mock.calls[0]?.[0]).toContain("which reports no version");
	});

	it("stays quiet when the namespace holds the document scanner's own copy", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const fakes = fakeEngines();
		ownNamespace(fakes.captureVision.CoreModule);
		await load(fakes);
		expect(warn).not.toHaveBeenCalled();
	});

	it("disposes the router when Document Viewer fails to load", async () => {
		const fakes = fakeEngines({ init: new Error("No worker") });
		await failureOf(load(fakes));
		expect(fakes.router.disposed).toBe(true);
	});
});

describe("engineImports", () => {
	it("returns the engine modules the settings supply, or else imports them", async () => {
		const captureVision = await import("dynamsoft-capture-vision-bundle");
		const documentViewer = await import("dynamsoft-document-viewer");
		const imported = engineImports(undefined);
		expect(await imported.captureVision()).toBe(captureVision);
		expect(await imported.documentViewer()).toBe(documentViewer);
		const own = { captureVision: { ...captureVision }, documentViewer: { ...documentViewer } };
		const supplied = engineImports(own);
		expect(await supplied.captureVision()).toBe(own.captureVision);
		expect(await supplied.documentViewer()).toBe(own.documentViewer);
	});

	it("refuses a supplied Capture Vision whose core is an older or newer minor version, or has none", async () => {
		const captureVision = await import("dynamsoft-capture-vision-bundle");
		const getVersion = vi.spyOn(captureVision.CoreModule, "getVersion");
		const supplied = engineImports({ captureVision });
		const builtAgainst = `but this document scanner was built against ${BUILT_CAPTURE_VISION}. Their major and minor versions must match`;
		getVersion.mockReturnValue(reported("4.4.20"));
		await expect(supplied.captureVision()).rejects.toThrow(
			`The core of the Dynamsoft Capture Vision passed in \`engines\` reports 4.4.20, ${builtAgainst}`,
		);
		getVersion.mockReturnValue(reported("4.8.0"));
		await expect(supplied.captureVision()).rejects.toThrow(`reports 4.8.0, ${builtAgainst}`);
		getVersion.mockReturnValue("");
		await expect(supplied.captureVision()).rejects.toThrow(`reports no version, ${builtAgainst}`);
	});

	it("refuses a supplied Document Viewer of an older or newer minor version", async () => {
		const documentViewer = await import("dynamsoft-document-viewer");
		const versionInfo = vi.spyOn(documentViewer.DDV.Core, "versionInfo", "get");
		const supplied = engineImports({ documentViewer });
		const builtAgainst = `but this document scanner was built against Dynamsoft Document Viewer ${BUILT.documentViewer}. Their major and minor versions must match`;
		versionInfo.mockReturnValue({ viewer: "5.1.0", engine: "" });
		await expect(supplied.documentViewer()).rejects.toThrow(
			`The Dynamsoft Document Viewer passed in \`engines\` reports 5.1.0, ${builtAgainst}`,
		);
		versionInfo.mockReturnValue({ viewer: "4.4.0", engine: "" });
		await expect(supplied.documentViewer()).rejects.toThrow(`reports 4.4.0, ${builtAgainst}`);
	});
});

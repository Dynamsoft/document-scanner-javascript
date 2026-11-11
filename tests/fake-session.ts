import type {
	DocumentChange,
	Navigation,
	PhaseName,
	Quadrilateral,
	ScanResult,
	ScannedPage,
} from "../src/results";
import { resolveSettings } from "../src/settings/settings";
import type { ScannerSettings } from "../src/settings/settings";
import type { FilterName } from "../src/settings/filters";
import type { CaptureScreenButton } from "../src/settings/buttons";
import type { AutoTake, StorePage } from "../src/phases/capture";
import type { EditPress, PageOrders } from "../src/phases/edit-screen";
import { wholePage } from "../src/boundaries/quads";
import { Session } from "../src/flow/session";
import type { SessionLoaded } from "../src/flow/session";
import type { PressAction } from "../src/ui/availability";
import type { CapturePress } from "../src/phases/capture-screen";
import type { RectifyPress } from "../src/phases/rectify-screen";
import type { PhaseContainers } from "../src/flow/containers";
import type { SessionInit } from "../src/flow/session";
import type { OverlayName, OverlaySpec } from "../src/ui/overlay";

// A session over fake phases, a fake document, and fake detection, for the
// session's tests.

/** The boundary the fake detection finds on every page. */
const FOUND: Quadrilateral = {
	points: [
		{ x: 10, y: 10 },
		{ x: 90, y: 10 },
		{ x: 90, y: 90 },
		{ x: 10, y: 90 },
	],
};

/** The boundary chosen on the fake rectify screen. */
const CHOSEN: Quadrilateral = {
	points: [
		{ x: 20, y: 20 },
		{ x: 80, y: 20 },
		{ x: 80, y: 80 },
		{ x: 20, y: 80 },
	],
};

/**
 * The page the tests hand capture, which the fake rectify screen logs as the
 * page taken.
 */
export const TAKEN_IMAGE = new Blob(["a page"]);

/** The original the fake document keeps for every page. */
const ORIGINAL = new Blob(["a page's original"]);

/** How a logged call names a boundary the tests made. */
function withBoundary(boundary: Quadrilateral | null): string {
	if (boundary === FOUND) return " with the boundary found";
	if (boundary === CHOSEN) return " with the chosen boundary";
	return boundary ? "" : " with no boundary";
}

/** The calls a fake makes fail. */
export interface Faults {
	/** The phase whose screen cannot open. */
	readonly mount?: PhaseName;
	readonly add?: true;
	readonly setBoundary?: true;
	readonly setFilter?: true;
	readonly export?: true;
	/** The edit screen cannot come down. */
	readonly release?: true;
	/** The camera cannot switch. */
	readonly switchCamera?: true;
}

/** A call a fake holds back until the test lets it finish. */
type Held =
	| "findBoundary"
	| "document.add"
	| "document.setBoundary"
	| "document.setFilter"
	| "edit.openFilterMode"
	| "document.recordOf"
	| "document.page"
	| "document.export"
	| "capture.pageHandedOver"
	| "done"
	| "capture.takePage"
	| "rectify.detectBoundary"
	| `${PhaseName}.mount`
	| `${PhaseName}.unmount`;

/** The sessions and containers the tests made, for `endFakeSessions()`. */
const sessions: Session[] = [];
const madeContainers: HTMLElement[] = [];

/** End every fake session, and remove every container `newContainer()` added. */
export function endFakeSessions(): void {
	// A session left covering the viewport would hold the page's scroll.
	for (const session of sessions.splice(0)) session.end({ status: "cancelled" });
	for (const container of madeContainers.splice(0)) container.remove();
}

/**
 * A session over fakes that log each call they get. A test presses a screen's
 * buttons, and hands capture a page, through what each phase was last mounted
 * with. Every screen goes in one new container unless the test names others. A
 * call in `held` waits until the test calls `finish()` with its name.
 */
export function fakeSession({
	settings = {},
	faults: given = {},
	containers: named = {},
	held = [],
	found = FOUND,
	pagesKept = 0,
	loadLater = false,
}: {
	readonly settings?: ScannerSettings;
	readonly faults?: Faults;
	readonly containers?: Partial<PhaseContainers>;
	readonly held?: readonly Held[];
	/** The boundary detection finds on every page. */
	readonly found?: Quadrilateral | null;
	/** How many pages an earlier session left in the document. */
	readonly pagesKept?: number;
	/** Whether the engines still load when the session starts, until `finishLoading()`. */
	readonly loadLater?: boolean;
} = {}) {
	const capture = named.capture ?? newContainer();
	const edit = named.edit ?? capture;
	const containers: PhaseContainers = {
		capture,
		edit,
		rectify: named.rectify ?? { afterCapture: capture, fromEdit: edit },
	};
	const calls: string[] = [];
	// A test can make a call fail later, with `fail()`.
	const faults: { -readonly [Fault in keyof Faults]: Faults[Fault] } = { ...given };
	const pages = Array.from({ length: pagesKept }, (_, index) => `page${index + 1}`);
	const boundaries = new Map<string, Quadrilateral>();
	/** Each page's rotation in degrees clockwise, while it is not 0. */
	const rotations = new Map<string, number>();
	const filters = new Map<string, FilterName>();
	/** The pages set aside, which undo can put back. */
	const aside: string[] = [];
	const pressHandlers: {
		capture?: (pressed: CapturePress) => PressAction;
		rectify?: (pressed: RectifyPress) => PressAction;
		edit?: (pressed: EditPress) => PressAction;
	} = {};
	let store: StorePage | undefined;
	let autoTake: AutoTake | undefined;
	const controlHolds: boolean[] = [];
	const rectifyHolds: boolean[] = [];
	const editHolds: boolean[] = [];
	/** What the session said undo and redo can do, each time it said so. */
	const histories: (readonly [boolean, boolean])[] = [];
	let reordered: ((orders: PageOrders) => void) | undefined;
	/** The pages selected in the edit screen's thumbnails. */
	let selected: string[] = [];
	/** The page the edit screen shows, once it moved from the newest. */
	let showing: string | null = null;
	/**
	 * The page that `showPage()`, `previousPage()`, or `nextPage()` showed last, while
	 * the document holds it, or else the newest page. The real viewer shows the page
	 * that moves into the place of one that leaves, which no test here needs.
	 */
	const shownPage = (): string | null =>
		showing && pages.includes(showing) ? showing : (pages.at(-1) ?? null);
	/** Show the page `by` places from the one that shows, if there is one. */
	const turnPage = (by: 1 | -1): void => {
		const shown = shownPage();
		if (shown === null) return;
		const next = pages[pages.indexOf(shown) + by];
		if (next) showing = next;
	};
	/** Closes the open file picker with a file, or with none. */
	let picked: ((file: File | null) => void) | undefined;
	/** Where each page came from, by uid. */
	const origins = new Map<string, string>();
	/** The overlays the session presented, by name, in order. */
	const notices: string[] = [];
	/** The overlays the session presented, for an answer to choose from. */
	const overlays: OverlaySpec[] = [];
	const ended: ScanResult[] = [];
	/** The moves between screens and modes that the session reported, in order. */
	const moves: Navigation[] = [];
	/** The changes to the document that the session reported, in order. */
	const changes: DocumentChange[] = [];
	/** The results that the session handed to `done`, before it ended. */
	const succeeded: ScanResult[] = [];
	/** A hold on a call, which waits until `finish()` runs. */
	const newHold = () => {
		let finish = (): void => undefined;
		const promise = new Promise<void>((resolve) => (finish = resolve));
		return { promise, finish };
	};
	const holds = new Map(held.map((name) => [name, newHold()] as const));
	/** Wait for the test to let a held call finish. Other calls go straight on. */
	const gate = async (name: Held): Promise<void> => holds.get(name)?.promise;

	/** Log a mount, let it finish, and fail it if asked to. */
	const mounted = async (phase: PhaseName, call: string): Promise<void> => {
		calls.push(call);
		await gate(`${phase}.mount`);
		if (faults.mount === phase) throw new Error(`the ${phase} screen could not open`);
	};

	const parts: SessionLoaded = {
		rectify: {
			async mount(_screen, mode, { image, boundary }, onPress) {
				pressHandlers.rectify = onPress;
				const shown = image === TAKEN_IMAGE ? "the page taken" : "the original";
				await mounted("rectify", `rectify.mount ${mode} on ${shown}${withBoundary(boundary)}`);
			},
			unmount() {
				calls.push("rectify.unmount");
			},
			release() {
				calls.push("rectify.release");
			},
			selection: () => CHOSEN,
			async detectBoundary() {
				calls.push("rectify.detectBoundary");
				await gate("rectify.detectBoundary");
			},
			setControlsHeld(held) {
				rectifyHolds.push(held);
			},
			undo() {
				calls.push("rectify.undo");
			},
			fullImage() {
				calls.push("rectify.fullImage");
			},
		},
		edit: {
			async mount(_screen, onPress, onReordered) {
				pressHandlers.edit = onPress;
				reordered = onReordered;
				await mounted("edit", "edit.mount");
			},
			unmount() {
				calls.push("edit.unmount");
			},
			release() {
				calls.push("edit.release");
				if (faults.release) throw new Error("the edit screen could not come down");
			},
			currentPage: shownPage,
			// The edit viewer drops a page from its selection as the page leaves.
			chosenPages: () => {
				const kept = selected.filter((uid) => pages.includes(uid));
				return kept.length > 0 ? kept : pages.slice(-1);
			},
			rotate(uid, angle) {
				calls.push(`edit.rotate ${uid} ${angle}`);
				rotations.set(uid, ((((rotations.get(uid) ?? 0) + angle) % 360) + 360) % 360);
			},
			setHistory: (undoable, redoable) => void histories.push([undoable, redoable]),
			previousPage: () => {
				calls.push("edit.previousPage");
				turnPage(-1);
			},
			nextPage: () => {
				calls.push("edit.nextPage");
				turnPage(1);
			},
			toggleThumbnails: () => void calls.push("edit.toggleThumbnails"),
			setControlsHeld(held) {
				editHolds.push(held);
			},
			async openFilterMode(uid, chosen) {
				// Logged once the mode shows, after any hold.
				await gate("edit.openFilterMode");
				calls.push(`edit.openFilterMode ${uid} ${chosen}`);
			},
			showPage: (uid) => {
				calls.push(`edit.showPage ${uid}`);
				showing = uid;
			},
			showFilter: (filter) => void calls.push(`edit.showFilter ${filter}`),
			closeMode: () => void calls.push("edit.closeMode"),
		},
		document: {
			get pageCount() {
				return pages.length;
			},
			async add(_original, origin, boundary) {
				await gate("document.add");
				if (faults.add) throw new Error("the page could not be added");
				const uid = `page${pages.length + 1}`;
				pages.push(uid);
				origins.set(uid, origin);
				if (boundary) boundaries.set(uid, boundary);
				calls.push(`document.add ${uid}${withBoundary(boundary)}`);
				return uid;
			},
			async setBoundary(uid, boundary) {
				calls.push(`document.setBoundary ${uid}${withBoundary(boundary)}`);
				await gate("document.setBoundary");
				if (faults.setBoundary) throw new Error("the page could not be rectified");
				// As the real one does, it reports no change for the boundary the page has.
				const before = boundaries.get(uid) ?? wholePage(100, 100);
				const after = boundary ?? wholePage(100, 100);
				if (JSON.stringify(after) === JSON.stringify(before)) return undefined;
				boundaries.set(uid, after);
				// As the engine does, the new image resets the rotation.
				rotations.delete(uid);
				return before;
			},
			async setFilter(uid, filter) {
				calls.push(`document.setFilter ${uid} ${filter}`);
				await gate("document.setFilter");
				if (faults.setFilter) throw new Error("the page could not be filtered");
				// As the real one does, it reports no change for the filter the page has.
				const before = filters.get(uid) ?? "none";
				if (filter === before) return undefined;
				filters.set(uid, filter);
				// As the engine does, the new image resets the rotation.
				rotations.delete(uid);
				return before;
			},
			async recordOf(uid) {
				calls.push(`document.recordOf ${uid}`);
				await gate("document.recordOf");
				const boundary = boundaries.get(uid) ?? wholePage(100, 100);
				const filter = filters.get(uid) ?? "none";
				return {
					origin: "camera",
					original: ORIGINAL,
					width: 100,
					height: 100,
					boundary,
					filter,
				};
			},
			rotationOf: (uid) => rotations.get(uid) ?? 0,
			remove(uid) {
				pages.splice(pages.indexOf(uid), 1);
				calls.push(`document.remove ${uid}`);
			},
			setAside(uid) {
				const index = pages.indexOf(uid);
				pages.splice(index, 1);
				aside.push(uid);
				calls.push(`document.setAside ${uid}`);
				return index;
			},
			putBack(uid, index) {
				aside.splice(aside.indexOf(uid), 1);
				pages.splice(index, 0, uid);
				calls.push(`document.putBack ${uid} at ${index}`);
			},
			dropAside() {
				aside.length = 0;
				calls.push("document.dropAside");
			},
			arrange(order) {
				pages.splice(0, pages.length, ...order);
				calls.push(`document.arrange ${order.join(" ")}`);
			},
			clear() {
				pages.length = 0;
				aside.length = 0;
				calls.push("document.clear");
			},
			get order() {
				return [...pages];
			},
			// Unlogged, since only the reports of changes read a page.
			async page(uid) {
				await gate("document.page");
				// As the real one does, it refuses a page no longer in the document.
				if (!pages.includes(uid)) throw new Error(`The document has no page ${uid}`);
				return { uid } as unknown as ScannedPage;
			},
			async snapshot() {
				calls.push(["document.snapshot", ...pages].join(" "));
				// Enough of each page for a test to tell them apart.
				return pages.map((uid) => ({ uid }) as unknown as ScannedPage);
			},
			async export() {
				calls.push("document.export");
				await gate("document.export");
				if (faults.export) throw new Error("the document could not be exported");
				return undefined;
			},
		},
		findBoundary: async () => {
			calls.push("findBoundary");
			await gate("findBoundary");
			return found;
		},
	};
	// Held back until the test calls finishLoading(), for a session whose engines still load.
	let finishLoading = (): void => undefined;
	let failLoading = (): void => undefined;
	const loading = new Promise<SessionLoaded>((resolve, reject) => {
		finishLoading = () => resolve(parts);
		failLoading = () => reject(new Error("the engines could not load"));
	});
	const init: SessionInit = {
		settings: resolveSettings(settings),
		containers,
		capture: {
			async mount(_screen, onPress, stored, autoTook) {
				pressHandlers.capture = onPress;
				store = stored;
				autoTake = autoTook;
				// As the real one waits for the engines before it opens the camera.
				if (loadLater) await loading;
				await mounted("capture", "capture.mount");
			},
			async unmount() {
				calls.push("capture.unmount");
				await gate("capture.unmount");
			},
			async release() {
				calls.push("capture.release");
			},
			async takePage() {
				calls.push("capture.takePage");
				await gate("capture.takePage");
			},
			async toggleTorch() {
				calls.push("capture.toggleTorch");
			},
			toggleAutoCapture() {
				calls.push("capture.toggleAutoCapture");
			},
			// A test holds it to stand for a page still being taken when the session finishes.
			pageHandedOver: () => gate("capture.pageHandedOver"),
			setControlsHeld(held) {
				controlHolds.push(held);
			},
			async switchCamera(id) {
				calls.push(`capture.switchCamera ${id}`);
				if (faults.switchCamera) throw new Error("the camera could not switch");
			},
			pickImage() {
				calls.push("capture.pickImage");
				return new Promise((resolve) => (picked = resolve));
			},
			async showLoading(load) {
				calls.push("capture.showLoading");
				try {
					return await load();
				} finally {
					calls.push("capture.showLoading ends");
				}
			},
		},
		loaded: loadLater ? loading : parts,
		onSuccess: async (result) => {
			succeeded.push(result);
			await gate("done");
		},
		onDocumentChange: (change) => changes.push(change),
		onNavigate: (navigation) => moves.push(navigation),
		onEnd: (result) => ended.push(result),
		present: (overlay) => {
			notices.push(overlay.name);
			overlays.push(overlay);
		},
	};

	const session = new Session(init);
	sessions.push(session);
	/** The action that the last press started, if any. */
	let lastAction: PressAction;
	/** Throw for a phase that never mounted, so a test cannot press nothing. */
	const mountedFor = <T>(phase: PhaseName, handler: T | undefined): T => {
		if (!handler) throw new Error(`The ${phase} screen never mounted`);
		return handler;
	};

	return {
		session,
		calls,
		ended,
		succeeded,
		changes,
		moves,
		/**
		 * Press a button on the capture screen. For a camera switch, pass the whole press
		 * with the chosen camera.
		 */
		capture: (pressed: Exclude<CaptureScreenButton, "cameraSwitcher"> | CapturePress) =>
			void (lastAction = mountedFor(
				"capture",
				pressHandlers.capture,
			)(typeof pressed === "string" ? { button: pressed } : pressed)),
		/** Press a button on the rectify screen. */
		rectify: (button: RectifyPress["button"]) =>
			void (lastAction = mountedFor("rectify", pressHandlers.rectify)({ button })),
		/** Press a button on the edit screen. */
		edit: (button: EditPress["button"]) =>
			void (lastAction = mountedFor("edit", pressHandlers.edit)({ button })),
		/** Choose a filter in the edit screen's filter mode. */
		chooseFilter: (filter: FilterName) =>
			void (lastAction = mountedFor("edit", pressHandlers.edit)({ button: "filter", filter })),
		/** The action that the last press started, or `undefined` when it started none. */
		lastAction: () => lastAction,
		/** A page's filter. */
		filterOf: (uid: string) => filters.get(uid) ?? "none",
		/** Whether the session holds the capture screen's controls off. */
		controlsHeld: () => controlHolds.at(-1) ?? false,
		/** Whether the session holds the rectify screen's controls off. */
		rectifyControlsHeld: () => rectifyHolds.at(-1) ?? false,
		/** Whether the session holds the edit screen's controls off. */
		editControlsHeld: () => editHolds.at(-1) ?? false,
		/** Close the picker that load image opened, with a file, or with `null` for none. */
		pickFile: (file: File | null) => mountedFor("capture", picked)(file),
		/** A page's rotation in degrees clockwise. */
		angleOf: (uid: string) => rotations.get(uid) ?? 0,
		/** Where a page came from. */
		originOf: (uid: string) => origins.get(uid),
		/** The overlays the session presented, by name, in order. */
		notices,
		/**
		 * Answer the last overlay named `name` with its button labelled `label`, or
		 * dismiss it with `null`.
		 */
		answer(name: OverlayName, label: string | null) {
			const overlay = overlays.filter((shown) => shown.name === name).at(-1);
			if (!overlay) throw new Error(`no ${name} overlay was shown`);
			if (label !== null) {
				const action = overlay.actions.find((shown) => shown.label === label);
				if (!action) throw new Error(`the ${name} overlay has no ${label} button`);
				action.onSelect?.();
			}
			overlay.onClose?.();
		},
		/** Make a call fail from now on. */
		fail: (fault: Exclude<keyof Faults, "mount">) => void (faults[fault] = true),
		/** What the session last said undo and redo can do, as `[undo, redo]`. */
		history: () => histories.at(-1) ?? [false, false],
		/**
		 * Reorder the pages as a drag in the edit screen's thumbnails does, and report
		 * the orders before and after it.
		 */
		dragPages(after: readonly string[]) {
			const before = [...pages];
			pages.splice(0, pages.length, ...after);
			mountedFor("edit", reordered)({ before, after });
		},
		/** Select pages in the edit screen's thumbnails, as taps or clicks there do. */
		selectPages: (uids: readonly string[]) => void (selected = [...uids]),
		/** Take the holds the session asked for so far, and start a new list. */
		takeHolds: () => controlHolds.splice(0),
		/** Ask for a page, as auto-capture does when it finds one ready. */
		autoTake: () => mountedFor("capture", autoTake)(),
		/** Hand the capture screen a page, as a capture does, with `found` as its boundary. */
		store: (original: Blob) => mountedFor("capture", store)({ image: original, boundary: found }),
		/** The phase whose screen is showing, or `null` for none. */
		shown(): PhaseName | null {
			const screen = [capture, edit, ...Object.values(containers.rectify)]
				.map((each) => each.querySelector(".mds-screen:not([hidden])"))
				.find(Boolean);
			return (screen?.className.replace("mds-screen mds-screen-", "") as PhaseName) ?? null;
		},
		/** Take the calls logged so far, and start a new log. */
		takeCalls(): string[] {
			return calls.splice(0);
		},
		/** The pages in the document. */
		pages: () => [...pages],
		/** Let the engines finish loading, for a session made with `loadLater`. */
		finishLoading: () => finishLoading(),
		/** Fail the engines' load, for a session made with `loadLater`. */
		failLoading: () => failLoading(),
		/** Hold the calls named `name` from now on, until `finish()`. */
		hold(name: Held): void {
			holds.set(name, newHold());
		},
		/** Let a held call finish. */
		finish(name: Held): void {
			const hold = holds.get(name);
			if (!hold) throw new Error(`${name} was not held`);
			hold.finish();
		},
	};
}

/** Add an empty container to the page, which `endFakeSessions()` removes. */
export function newContainer(): HTMLElement {
	const container = document.createElement("div");
	document.body.append(container);
	madeContainers.push(container);
	return container;
}

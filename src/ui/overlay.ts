import type { LicenseErrorReason } from "../faults";
import type { ResolvedSettings } from "../settings/settings";
import type { ResolvedStrings } from "../settings/strings";
import { OVERLAY_STYLES, COMMON_STYLES, adoptStyles, applyTheme } from "./styles";

/**
 * The name of a dialog that the document scanner shows over a screen. A minor
 * release may add a name, so a switch on the name needs a default branch.
 */
export type OverlayName =
	| "trialNotice"
	| "licenseError"
	| "fileError"
	| "pageError"
	| "finishError"
	| "pageLimitNotice"
	| "discardConfirmation";

/**
 * The name of a notice that `noticeOverlay` builds. The trial notice shows in place
 * of the engines' own dialogs.
 */
export type NoticeName = Exclude<OverlayName, "discardConfirmation">;

/** A button on an overlay. */
export interface OverlayAction {
	readonly label: string;
	/** Focused when the overlay opens. At most one per overlay. */
	readonly focused?: boolean;
	/** Drawn in the error color, for an answer that throws work away. */
	readonly destructive?: boolean;
	/** Called when the button is pressed. */
	readonly onSelect?: () => void;
}

/** What an overlay shows. */
export interface OverlaySpec {
	readonly name: OverlayName;
	readonly title: string;
	/** The body text. Links use the engines' `[label](url)` syntax. */
	readonly message: string;
	/** The buttons. Each also closes the overlay. */
	readonly actions: readonly OverlayAction[];
	/**
	 * Called once when the overlay closes after it showed, whatever closes it. An
	 * overlay that never shows never calls it.
	 */
	readonly onClose?: () => void;
}

/**
 * The dialogs shown over a screen, one at a time, in the order they come. Each
 * renders in a shadow root of its own.
 */
export class OverlayLayer {
	readonly #settings: ResolvedSettings;
	readonly #onChange: (name: OverlayName, open: boolean) => void;
	/** The overlays that show or wait, in order. The first one shows. */
	readonly #queue: OverlaySpec[] = [];
	/** The function that closes the dialog on the page, if any. */
	#dismiss: (() => void) | null = null;

	/**
	 * Show overlays drawn with `settings`, and tell `onChange` each time one opens or
	 * closes.
	 */
	constructor(
		settings: ResolvedSettings,
		onChange: (name: OverlayName, open: boolean) => void = () => undefined,
	) {
		this.#settings = settings;
		this.#onChange = onChange;
	}

	/**
	 * Show an overlay once those before it have closed. An overlay whose name already
	 * shows or waits is left out.
	 */
	present(spec: OverlaySpec): void {
		if (this.#queue.some((queued) => queued.name === spec.name)) return;
		this.#queue.push(spec);
		this.#showNext();
	}

	/** Close the overlay that shows. Those that wait never show. */
	closeAll(): void {
		this.#queue.length = 0;
		this.#dismiss?.();
	}

	/** Show the first overlay, unless its dialog is already on the page. */
	#showNext(): void {
		const next = this.#queue[0];
		if (next && !this.#dismiss) this.#show(next);
	}

	/** Show the dialog of `spec`. When it closes, the next overlay shows. */
	#show(spec: OverlaySpec): void {
		const listeners = new AbortController();
		const shadowHost = document.createElement("div");
		const root = shadowHost.attachShadow({ mode: "open" });
		const dialog = document.createElement("dialog");
		dialog.className = "mds-overlay";

		const teardown = (): void => {
			// Once only, though an action that ends the session closes the dialog before
			// its button does.
			if (listeners.signal.aborted) return;
			listeners.abort();
			shadowHost.remove();
			if (this.#queue[0] === spec) this.#queue.shift();
			this.#dismiss = null;
			this.#onChange(spec.name, false);
			// Before the next shows, since it can end the session, which closes them all.
			spec.onClose?.();
			this.#showNext();
		};
		const dismiss = (): void => {
			// Close first, so the browser releases focus and the top layer.
			if (dialog.open) dialog.close();
			teardown();
		};
		// Escape closes the dialog without dismiss(). Teardown removes this listener,
		// so a dismiss() does not tear down twice.
		dialog.addEventListener("close", teardown, { signal: listeners.signal });
		// A click on the dialog itself landed outside the panel.
		dialog.addEventListener(
			"click",
			(event) => {
				if (event.target === dialog) dismiss();
			},
			{ signal: listeners.signal },
		);

		const titleId = `mds-overlay-title-${spec.name}`;
		dialog.setAttribute("aria-labelledby", titleId);

		dialog.append(buildPanel(spec, titleId, dismiss, listeners.signal));
		root.append(dialog);
		adoptStyles(root, COMMON_STYLES);
		adoptStyles(root, OVERLAY_STYLES);
		applyTheme(shadowHost, this.#settings.theme);
		document.body.append(shadowHost);
		openDialog(dialog);
		this.#dismiss = dismiss;
		this.#onChange(spec.name, true);
	}
}

/** Build the dialog's panel with its title, message, and buttons. */
function buildPanel(
	spec: OverlaySpec,
	titleId: string,
	dismiss: () => void,
	signal: AbortSignal,
): HTMLElement {
	const panel = document.createElement("div");
	panel.className = "mds-overlay-panel";

	const title = document.createElement("h2");
	title.id = titleId;
	title.textContent = spec.title;

	const message = document.createElement("p");
	message.append(...renderLinks(spec.message));

	const actions = document.createElement("div");
	actions.className = "mds-overlay-actions";
	let claimed = false;
	for (const action of spec.actions) {
		const button = document.createElement("button");
		button.type = "button";
		if (action.destructive) button.className = "mds-overlay-destructive";
		button.textContent = action.label;
		button.addEventListener(
			"click",
			() => {
				action.onSelect?.();
				dismiss();
			},
			{ signal },
		);
		actions.append(button);
		// showModal() focuses whatever carries `autofocus`.
		if (action.focused && !claimed) {
			button.autofocus = true;
			claimed = true;
		}
	}

	// The title and the message are one block of text, apart from the buttons.
	const text = document.createElement("div");
	text.className = "mds-overlay-text";
	text.append(title, message);
	panel.append(text, actions);
	return panel;
}

/**
 * The license error dialog. An expired key gets its own wording, and every other
 * reason the general one, which asks to check both the key and the network.
 */
export function licenseErrorOverlay(
	strings: ResolvedStrings,
	reason: LicenseErrorReason,
): OverlaySpec {
	const notice = noticeOverlay(strings, "licenseError");
	if (reason !== "expired") return notice;
	const { common } = strings;
	return { ...notice, title: common.licenseExpiredTitle, message: common.licenseExpiredMessage };
}

/**
 * The notice `name`, worded by its `<name>Title` and `<name>Message` strings, with
 * Dismiss as its one button.
 */
export function noticeOverlay(strings: ResolvedStrings, name: NoticeName): OverlaySpec {
	const { common } = strings;
	return {
		name,
		title: common[`${name}Title`],
		message: common[`${name}Message`],
		actions: [{ label: common.dismiss, focused: true }],
	};
}

/**
 * The question before a cancel drops the pages. Discard calls `onDiscard`, and
 * Keep scanning, which has the focus, closes it with nothing else done.
 */
export function discardOverlay(strings: ResolvedStrings, onDiscard: () => void): OverlaySpec {
	const { common } = strings;
	return {
		name: "discardConfirmation",
		title: common.discardTitle,
		message: common.discardMessage,
		actions: [
			{ label: common.keepScanning, focused: true },
			{ label: common.discard, destructive: true, onSelect: onDiscard },
		],
	};
}

/** Open the dialog, modally where the browser allows. It never throws. */
function openDialog(dialog: HTMLDialogElement): void {
	try {
		dialog.showModal();
		return;
	} catch {
		// A dialog that is not modal has no top layer, focus trap, or Escape.
	}
	try {
		dialog.show();
		return;
	} catch {
		// No <dialog> support. The overlay's [open] CSS rule shows it.
	}
	dialog.setAttribute("open", "");
}

/** Turn every `[label](url)` in a string into a link. */
function renderLinks(text: string): (Node | string)[] {
	const nodes: (Node | string)[] = [];
	const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
	let last = 0;
	for (const match of text.matchAll(pattern)) {
		const [whole, label = "", href = ""] = match;
		if (match.index > last) nodes.push(text.slice(last, match.index));
		const link = document.createElement("a");
		link.textContent = label;
		link.href = href;
		link.target = "_blank";
		link.rel = "noreferrer";
		nodes.push(link);
		last = match.index + whole.length;
	}
	if (last < text.length) nodes.push(text.slice(last));
	return nodes;
}

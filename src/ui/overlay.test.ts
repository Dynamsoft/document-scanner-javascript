import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { resolveSettings } from "../settings/settings";
import { OverlayLayer, discardOverlay, licenseErrorOverlay, noticeOverlay } from "./overlay";
import type { OverlaySpec } from "./overlay";

const settings = resolveSettings({});

/** Find every overlay dialog still on the page, each in its own shadow root. */
function openDialogs(): HTMLDialogElement[] {
	return [...document.body.children].flatMap((shadowHost) => {
		const dialog = shadowHost.shadowRoot?.querySelector<HTMLDialogElement>("dialog.mds-overlay");
		return dialog ? [dialog] : [];
	});
}

/** Read the title of every overlay dialog still on the page. */
function shownTitles(): (string | undefined)[] {
	return openDialogs().map((dialog) => dialog.querySelector("h2")?.textContent);
}

/** Press the first button of the first overlay dialog on the page. */
function pressFirstButton(): void {
	openDialogs()[0]?.querySelector("button")?.click();
}

function spec(overrides: Partial<OverlaySpec> = {}): OverlaySpec {
	return {
		name: "trialNotice",
		title: "Trial license",
		message: "Plain text",
		actions: [{ label: "Dismiss", focused: true }],
		...overrides,
	};
}

const layer = new OverlayLayer(settings);

afterEach(() => {
	layer.closeAll();
	vi.restoreAllMocks();
});

describe("OverlayLayer", () => {
	it("shows a modal dialog with the title, message and actions it was given", () => {
		layer.present(spec());
		const [dialog] = openDialogs();
		expect(dialog?.open).toBe(true);
		expect(dialog?.querySelector("h2")?.textContent).toBe("Trial license");
		expect(dialog?.querySelector("p")?.textContent).toBe("Plain text");
		const button = dialog?.querySelector<HTMLButtonElement>("button");
		expect(button?.textContent).toBe("Dismiss");
		expect(dialog?.getAttribute("aria-labelledby")).toBe(dialog?.querySelector("h2")?.id);
	});

	it("turns only links written as [label](url) into markup", () => {
		layer.present(spec({ message: "See [the site](https://example.com/) <b>now</b>" }));
		const paragraph = openDialogs()[0]?.querySelector("p");
		const link = paragraph?.querySelector("a");
		expect(link?.textContent).toBe("the site");
		expect(link?.href).toBe("https://example.com/");
		expect(link?.target).toBe("_blank");
		expect(link?.rel).toBe("noreferrer");
		expect(paragraph?.querySelector("b")).toBeNull();
		expect(paragraph?.textContent).toBe("See the site <b>now</b>");
	});

	it("renders a message that is nothing but links", () => {
		layer.present(spec({ message: "[one](https://a.example/)[two](https://b.example/)" }));
		const paragraph = openDialogs()[0]?.querySelector("p");
		expect([...(paragraph?.childNodes ?? [])].map((node) => node.textContent)).toEqual([
			"one",
			"two",
		]);
	});

	it("runs an action and then closes the dialog", () => {
		const onSelect = vi.fn();
		layer.present(spec({ actions: [{ label: "OK", onSelect }] }));
		pressFirstButton();
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(openDialogs()).toHaveLength(0);
	});

	it("tears down a dialog the browser closed itself, as Escape does", async () => {
		layer.present(spec());
		openDialogs()[0]?.close();
		// The browser fires the close event after the call returns.
		await vi.waitFor(() => expect(openDialogs()).toHaveLength(0));
	});

	it("closes on a tap outside the panel, which lands on the dialog itself", () => {
		layer.present(spec());
		openDialogs()[0]?.click();
		expect(openDialogs()).toHaveLength(0);
	});

	it("stays open for a tap inside the panel", () => {
		layer.present(spec());
		openDialogs()[0]?.querySelector("h2")?.click();
		expect(openDialogs()).toHaveLength(1);
	});

	it("tears a dialog down whether or not the browser still has it open", () => {
		layer.present(spec());
		openDialogs()[0]?.removeAttribute("open");
		layer.closeAll();
		expect(openDialogs()).toHaveLength(0);
	});

	it("still shows the dialog, without the page behind it blocked, where it cannot open modally", () => {
		vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(() => {
			throw new DOMException("not allowed", "InvalidStateError");
		});
		layer.present(spec());
		expect(openDialogs()[0]?.open).toBe(true);
		expect(openDialogs()[0]?.matches(":modal")).toBe(false);
	});

	it("falls back to the open attribute where the browser has no dialog support at all", () => {
		const refuse = () => {
			throw new TypeError("not supported");
		};
		vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(refuse);
		vi.spyOn(HTMLDialogElement.prototype, "show").mockImplementation(refuse);
		layer.present(spec());
		expect(openDialogs()[0]?.hasAttribute("open")).toBe(true);
	});

	it("shows one dialog at a time, and the next in order when it closes", async () => {
		layer.present(spec({ name: "trialNotice", title: "First" }));
		layer.present(spec({ name: "finishError", title: "Second" }));
		layer.present(spec({ name: "pageLimitNotice", title: "Third" }));
		expect(shownTitles()).toEqual(["First"]);
		pressFirstButton();
		expect(shownTitles()).toEqual(["Second"]);
		// As Escape closes it. The browser fires the close event after the call returns.
		openDialogs()[0]?.close();
		await vi.waitFor(() => expect(shownTitles()).toEqual(["Third"]));
	});

	it("leaves out a dialog whose name already shows or waits", () => {
		layer.present(spec({ name: "trialNotice", title: "Shown" }));
		layer.present(spec({ name: "finishError", title: "Waiting" }));
		layer.present(spec({ name: "trialNotice", title: "Shown again" }));
		layer.present(spec({ name: "finishError", title: "Waiting again" }));
		expect(shownTitles()).toEqual(["Shown"]);
		pressFirstButton();
		expect(shownTitles()).toEqual(["Waiting"]);
		pressFirstButton();
		expect(openDialogs()).toHaveLength(0);
	});

	it("closes every dialog, and shows none of those that wait", () => {
		layer.present(spec({ name: "trialNotice" }));
		layer.present(spec({ name: "licenseError" }));
		layer.closeAll();
		expect(openDialogs()).toHaveLength(0);
	});

	it("calls onClose once, whatever closes the dialog", async () => {
		const onClose = vi.fn();
		const closers: (() => void)[] = [
			pressFirstButton,
			() => openDialogs()[0]?.click(),
			() => openDialogs()[0]?.close(),
			() => layer.closeAll(),
		];
		for (const close of closers) {
			layer.present(spec({ onClose }));
			close();
			// The browser fires the close event after the call returns.
			await vi.waitFor(() => expect(openDialogs()).toHaveLength(0));
		}
		expect(onClose).toHaveBeenCalledTimes(closers.length);
	});

	it("closes a dialog once, and shows none that wait, when its action closes them all", () => {
		const onClose = vi.fn();
		// As Discard does, since the end of the session closes every overlay.
		const actions = [{ label: "Discard", onSelect: () => layer.closeAll() }];
		layer.present(spec({ name: "discardConfirmation", actions, onClose }));
		layer.present(spec({ name: "finishError" }));
		pressFirstButton();
		expect(openDialogs()).toHaveLength(0);
		expect(onClose).toHaveBeenCalledOnce();
	});
});

describe("the overlay layer's reports", () => {
	/** A layer, and the reports it gives, each as "<name> <open>". */
	function reportingLayer(): { reporting: OverlayLayer; heard: string[] } {
		const heard: string[] = [];
		const reporting = new OverlayLayer(
			settings,
			(name, open) => void heard.push(`${name} ${open}`),
		);
		return { reporting, heard };
	}

	it("tell each overlay that opens and closes, in order", () => {
		const { reporting, heard } = reportingLayer();
		reporting.present(spec({ name: "trialNotice" }));
		reporting.present(spec({ name: "finishError" }));
		pressFirstButton();
		pressFirstButton();
		expect(heard).toEqual([
			"trialNotice true",
			"trialNotice false",
			"finishError true",
			"finishError false",
		]);
	});

	it("tell nothing of an overlay that closed before it showed", () => {
		const { reporting, heard } = reportingLayer();
		reporting.present(spec({ name: "trialNotice" }));
		reporting.present(spec({ name: "finishError" }));
		reporting.closeAll();
		expect(heard).toEqual(["trialNotice true", "trialNotice false"]);
	});

	it("tell nothing more once an onClose closes them all, as the end of a session does", () => {
		const { reporting, heard } = reportingLayer();
		reporting.present(spec({ name: "licenseError", onClose: () => reporting.closeAll() }));
		reporting.present(spec({ name: "finishError" }));
		pressFirstButton();
		expect(heard).toEqual(["licenseError true", "licenseError false"]);
	});
});

describe("the notices", () => {
	it("words a notice from its strings, with dismiss as its one button", () => {
		const { strings } = resolveSettings({
			strings: { common: { pageErrorTitle: "Title", pageErrorMessage: "Message", dismiss: "OK" } },
		});
		expect(noticeOverlay(strings, "pageError")).toEqual({
			name: "pageError",
			title: "Title",
			message: "Message",
			actions: [{ label: "OK", focused: true }],
		});
	});
});

describe("the discard confirmation", () => {
	it("focuses Keep scanning, and discards only for the Discard button, drawn as destructive", () => {
		const onDiscard = vi.fn();
		layer.present(discardOverlay(settings.strings, onDiscard));
		const dialog = openDialogs()[0]!;
		const [keep, discard] = dialog.querySelectorAll("button");
		expect((dialog.getRootNode() as ShadowRoot).activeElement).toBe(keep);
		expect([keep?.textContent, discard?.textContent]).toEqual(["Keep scanning", "Discard"]);
		expect(discard?.className).toBe("mds-overlay-destructive");
		keep!.click();
		expect(onDiscard).not.toHaveBeenCalled();
		layer.present(discardOverlay(settings.strings, onDiscard));
		openDialogs()[0]!.querySelectorAll("button")[1]!.click();
		expect(onDiscard).toHaveBeenCalledOnce();
	});
});

describe("the license dialogs", () => {
	const { common } = settings.strings;

	it("words the trial notice from the strings", () => {
		expect(noticeOverlay(settings.strings, "trialNotice")).toMatchObject({
			name: "trialNotice",
			title: common.trialNoticeTitle,
			message: common.trialNoticeMessage,
		});
	});

	it("words the license error for an expired key, or else for any other reason", () => {
		expect(licenseErrorOverlay(settings.strings, "expired").title).toBe(common.licenseExpiredTitle);
		expect(licenseErrorOverlay(settings.strings, "rejected").title).toBe(common.licenseErrorTitle);
		expect(licenseErrorOverlay(settings.strings, "unreachable").title).toBe(
			common.licenseErrorTitle,
		);
	});
});

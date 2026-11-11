import { describe, expect, it } from "vite-plus/test";
import { refuseDrops } from "./drops";

/** A drag event of `type` that carries one file. */
function fileDrag(type: "dragover" | "drop"): DragEvent {
	const dataTransfer = new DataTransfer();
	dataTransfer.items.add(new File(["page"], "page.png", { type: "image/png" }));
	return new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
}

describe("refuseDrops()", () => {
	it("refuses a file dragged over the element or a child", () => {
		const element = document.createElement("div");
		const child = element.appendChild(document.createElement("span"));
		refuseDrops(element);
		const over = fileDrag("dragover");
		child.dispatchEvent(over);
		expect([over.defaultPrevented, over.dataTransfer?.dropEffect]).toEqual([true, "none"]);
		const drop = fileDrag("drop");
		child.dispatchEvent(drop);
		expect(drop.defaultPrevented).toBe(true);
	});

	it("refuses a drag that carries no data", () => {
		const element = document.createElement("div");
		refuseDrops(element);
		const over = new DragEvent("dragover", { cancelable: true });
		element.dispatchEvent(over);
		expect(over.defaultPrevented).toBe(true);
	});

	it("leaves drops alone once its signal aborts", () => {
		const element = document.createElement("div");
		const refusal = new AbortController();
		refuseDrops(element, refusal.signal);
		refusal.abort();
		const over = fileDrag("dragover");
		element.dispatchEvent(over);
		const drop = fileDrag("drop");
		element.dispatchEvent(drop);
		expect([over.defaultPrevented, drop.defaultPrevented]).toEqual([false, false]);
	});
});

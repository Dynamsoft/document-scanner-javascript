import { describe, expect, it } from "vite-plus/test";
import { History, inverse } from "./history";
import type { Change } from "./history";

/** A counter, and a change that adds `amount` to it. */
function counter() {
	const state = { value: 0 };
	const add = (amount: number): Change => ({
		undo: () => {
			state.value -= amount;
			return undefined;
		},
		redo: () => {
			state.value += amount;
			return undefined;
		},
	});
	/** Make the change, as the code that records it does, and record it. */
	const make = (history: History, amount: number) => {
		state.value += amount;
		history.record(add(amount));
	};
	return { state, add, make };
}

describe("History", () => {
	it("takes back changes in reverse order, and makes them again in order", async () => {
		const history = new History();
		const { state, make } = counter();
		make(history, 1);
		make(history, 10);
		await history.undo();
		expect(state.value).toBe(1);
		await history.undo();
		expect(state.value).toBe(0);
		await history.redo();
		await history.redo();
		expect(state.value).toBe(11);
	});

	it("counts the changes that undo and redo can act on", async () => {
		const history = new History();
		const { make } = counter();
		expect([history.undoCount, history.redoCount]).toEqual([0, 0]);
		make(history, 1);
		expect([history.undoCount, history.redoCount]).toEqual([1, 0]);
		await history.undo();
		expect([history.undoCount, history.redoCount]).toEqual([0, 1]);
		make(history, 2);
		expect([history.undoCount, history.redoCount]).toEqual([1, 0]);
	});

	it("does nothing when there is no change to walk", async () => {
		const history = new History();
		await history.undo();
		await history.redo();
		expect([history.undoCount, history.redoCount]).toEqual([0, 0]);
	});

	it("returns the page that each step shows, and none from a step that shows no page", async () => {
		const history = new History();
		history.record({ undo: () => "page2", redo: () => undefined });
		history.record({ undo: () => Promise.resolve("page1"), redo: () => "page3" });
		expect(await history.undo()).toBe("page1");
		expect(await history.redo()).toBe("page3");
		expect(await history.undo()).toBe("page1");
		expect(await history.undo()).toBe("page2");
		expect(await history.redo()).toBeUndefined();
	});

	it("keeps a change in place when its step fails", async () => {
		const history = new History();
		history.record({
			undo: () => Promise.reject(new Error("the page could not come back")),
			redo: () => undefined,
		});
		await expect(history.undo()).rejects.toThrow("the page could not come back");
		expect([history.undoCount, history.redoCount]).toEqual([1, 0]);
	});
});

describe("inverse", () => {
	it("swaps the steps, so the inverse of the inverse acts as the change", () => {
		const { state, add } = counter();
		const change = add(3);
		void inverse(change).undo();
		expect(state.value).toBe(3);
		void inverse(inverse(change)).undo();
		expect(state.value).toBe(0);
	});
});

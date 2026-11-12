// The history of a session's changes to the document, which undo and redo walk.

/**
 * One change to the document, as a pair of inverse steps. `undo` takes the change
 * back, and `redo` makes it again, so `redo` after `undo` leaves the document as
 * the change left it. A step returns the uid of the page it leaves in focus, or
 * `undefined` when it leaves no page in focus.
 */
export interface Change {
	undo(): Promise<string | undefined> | string | undefined;
	redo(): Promise<string | undefined> | string | undefined;
}

/** The inverse of `change`: its undo is the change's redo, and the other way round. */
export function inverse(change: Change): Change {
	return { undo: () => change.redo(), redo: () => change.undo() };
}

/**
 * The changes made so far, in order. Undo takes back the latest change not yet
 * taken back, and redo makes the latest one taken back again. A new change ends
 * every redo.
 */
export class History {
	readonly #done: Change[] = [];
	readonly #undone: Change[] = [];

	/** How many changes undo can take back. */
	get undoCount(): number {
		return this.#done.length;
	}

	/** How many changes redo can make again. */
	get redoCount(): number {
		return this.#undone.length;
	}

	/** Add a change that was just made. */
	record(change: Change): void {
		this.#done.push(change);
		this.#undone.length = 0;
	}

	/**
	 * Take back the latest change, and resolve to the page it leaves showing, if any.
	 * If its step fails, the history stays as it was.
	 */
	undo(): Promise<string | undefined> {
		return walk(this.#done, this.#undone, (change) => change.undo());
	}

	/**
	 * Make the latest change taken back again, and resolve to the page it leaves
	 * showing, if any. If its step fails, the history stays as it was.
	 */
	redo(): Promise<string | undefined> {
		return walk(this.#undone, this.#done, (change) => change.redo());
	}
}

/** Run `step` on the last change of `from`, move that change to `to`, and return the page it leaves in focus, if any. */
async function walk(
	from: Change[],
	to: Change[],
	step: (change: Change) => Promise<string | undefined> | string | undefined,
): Promise<string | undefined> {
	const change = from.at(-1);
	if (!change) return undefined;
	const focused = await step(change);
	from.pop();
	to.push(change);
	return focused;
}

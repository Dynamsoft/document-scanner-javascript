import { reportFault } from "../faults";
import type { ScannerError } from "../faults";
import type { DocumentChange, Navigation, SuccessfulScan } from "../results";

// The events of the document scanner. They only report: a listener cannot change
// what the document scanner does. A setting such as a button's `onClick` decides.

/**
 * The events of the document scanner, by name, with the payload of each. Listen
 * with {@link DocumentScanner.on | on()}.
 */
export interface ScannerEvents {
	/**
	 * A change to the document: pages came in, went out, or moved, a page changed, or
	 * what undo and redo can do changed. Each change carries the state of
	 * the document after it.
	 */
	documentChange: DocumentChange;
	/**
	 * The success of a session. The document scanner waits for the listeners before
	 * it closes its screens and before {@link DocumentScanner.scan | scan()}
	 * resolves. Thus the host application can act on the result while the screens
	 * still show. The event fires once in each session, and not for a cancel or a
	 * failure.
	 */
	done: SuccessfulScan;
	/**
	 * The failure of a session, with its reason. The event fires once, before
	 * {@link DocumentScanner.scan | scan()} resolves.
	 */
	error: ScannerError;
	/**
	 * A move of the user to another screen or mode, or an overlay that opened or
	 * closed.
	 */
	navigate: Navigation;
}

/** The name of an event of the document scanner. */
export type ScannerEventName = keyof ScannerEvents;

/** Every event name. The type check fails until a new event is listed here. */
const EVENT_NAMES: readonly ScannerEventName[] = Object.keys({
	documentChange: null,
	done: null,
	error: null,
	navigate: null,
} satisfies Record<ScannerEventName, null>) as ScannerEventName[];

/** A listener of the event `Name`. */
type Listener<Name extends ScannerEventName> = (
	payload: ScannerEvents[Name],
) => void | Promise<void>;

/** The listeners of each event, and the means to call them. */
export class Events {
	readonly #listeners = new Map<ScannerEventName, Set<Listener<never>>>();

	/**
	 * Call `listener` with each payload of `event`, until the returned function
	 * stops it. An unknown event name throws a `TypeError`.
	 */
	on<Name extends ScannerEventName>(event: Name, listener: Listener<Name>): () => void {
		// Checked here too, because a host application written in JavaScript can pass anything.
		if (!EVENT_NAMES.includes(event)) throw new TypeError(`Unknown event ${String(event)}`);
		let listeners = this.#listeners.get(event);
		if (!listeners) this.#listeners.set(event, (listeners = new Set()));
		// The set holds listeners of this event only.
		const held = listener as Listener<never>;
		listeners.add(held);
		return () => void listeners.delete(held);
	}

	/**
	 * Call every listener of `event` with `payload`, and resolve once each has
	 * returned or settled. A listener that throws is reported to the console, and
	 * stops neither the others nor the document scanner.
	 */
	async emit<Name extends ScannerEventName>(
		event: Name,
		payload: ScannerEvents[Name],
	): Promise<void> {
		const listeners = [...(this.#listeners.get(event) ?? [])] as Listener<Name>[];
		await Promise.all(
			listeners.map(async (listener) => {
				try {
					await listener(payload);
				} catch (thrown) {
					reportFault(`a listener of the ${event} event failed`, thrown);
				}
			}),
		);
	}
}

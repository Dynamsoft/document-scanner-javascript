import type { FramingIssue } from "./framing";

// The hint that tells the user how to move, from the framing issue that holds the
// page back.

/** What the hint asks the user to do. */
export type Hint = "moveCloser" | "moveFarther";

/** The hint for each framing issue. A page cut off gets none. */
const HINTS: Readonly<Record<FramingIssue, Hint | null>> = {
	tooFar: "moveCloser",
	tooClose: "moveFarther",
	cutOff: null,
};

/** The hint for `issue`, or `null` for no issue or one without a hint. */
export function hintFor(issue: FramingIssue | null): Hint | null {
	return issue && HINTS[issue];
}

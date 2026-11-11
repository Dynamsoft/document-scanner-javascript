import { describe, expect, it } from "vite-plus/test";
import { hintFor } from "./hint";

describe("hintFor", () => {
	it("asks the user to move closer to a page too far away, and away from one too close", () => {
		expect(hintFor("tooFar")).toBe("moveCloser");
		expect(hintFor("tooClose")).toBe("moveFarther");
	});

	it("gives no hint for a page cut off, or for no issue", () => {
		expect(hintFor("cutOff")).toBeNull();
		expect(hintFor(null)).toBeNull();
	});
});

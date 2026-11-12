import { createHash } from "node:crypto";
import {
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	readdirSync,
	renameSync,
	rmSync,
	writeSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { VIDEOS, scene } from "./scene";
import type { Rect, Scene, VideoName } from "./scene";

// Chromium's fake camera videos, in the raw YUV4MPEG2 format it plays. They are
// generated because they are too big to commit.

/** Where the generated videos are kept between runs. */
const DIRECTORY = fileURLToPath(new URL("../.videos/", import.meta.url));

/**
 * Build the path of one video's file. The name holds a hash of the video's scene,
 * so a changed scene gets a new file.
 */
export function videoFile(name: VideoName): string {
	const hash = createHash("sha256")
		.update(JSON.stringify(scene(name)))
		.digest("hex");
	return join(DIRECTORY, `${name}-${hash.slice(0, 12)}.y4m`);
}

/** Write any missing videos, and delete every other file in the directory. */
export function writeVideos(): void {
	mkdirSync(DIRECTORY, { recursive: true });
	const current = new Set<string>();
	for (const name of Object.keys(VIDEOS) as VideoName[]) {
		const file = videoFile(name);
		current.add(file);
		if (existsSync(file)) continue;
		// Rename when done, so an interrupted run leaves no file that looks finished.
		const partial = `${file}.partial`;
		write(partial, scene(name));
		renameSync(partial, file);
	}
	for (const entry of readdirSync(DIRECTORY)) {
		const file = join(DIRECTORY, entry);
		if (!current.has(file)) rmSync(file);
	}
}

/** Write one video to `file`. */
function write(file: string, { width, height, fps, frames }: Scene): void {
	const handle = openSync(file, "w");
	try {
		writeSync(handle, `YUV4MPEG2 W${width} H${height} F${fps}:1 Ip A1:1 C420\n`);
		// The frames are all gray, so both color planes stay at their midpoint.
		const color = Buffer.alloc((width / 2) * (height / 2), 128);
		for (const rects of frames) {
			writeSync(handle, "FRAME\n");
			writeSync(handle, brightness(rects, width, height));
			writeSync(handle, color);
			writeSync(handle, color);
		}
	} finally {
		closeSync(handle);
	}
}

/** Paint one frame's rectangles into a brightness plane, row by row. */
function brightness(rects: readonly Rect[], width: number, height: number): Buffer {
	const plane = Buffer.alloc(width * height);
	for (const rect of rects) {
		for (let row = rect.top; row < rect.top + rect.height; row += 1) {
			const start = row * width + rect.left;
			plane.fill(rect.shade, start, start + rect.width);
		}
	}
	return plane;
}

#!/bin/sh
# Strip third-party integrations from the demo in place.
#
# Use this before publishing a sanitized copy of the demo, or wire it
# into a CI/git-hook/task that emits a downstream-ready snapshot.
# Idempotent — re-running is a no-op once stripped.
#
# What it does:
#   1. Removes every block bracketed by `third-party:begin` and
#      `third-party:end` marker lines in the target files.
#   2. Deletes files that are entirely third-party glue.
#
# Marker syntax (any line containing the literal phrases below):
#   HTML:  <!-- third-party:begin <name> -->   <!-- third-party:end <name> -->
#   CSS:   /* third-party:begin <name> */      /* third-party:end <name> */
#   TS/JS: // third-party:begin <name>         // third-party:end <name>

set -e
cd "$(dirname "$0")/.."

strip_blocks() {
	[ -f "$1" ] || return 0
	awk '
		/third-party:begin/ { skip = 1; next }
		/third-party:end/   { skip = 0; next }
		!skip
	' "$1" > "$1.tmp" && mv "$1.tmp" "$1"
	echo "stripped $1"
}

strip_blocks index.html
strip_blocks src/index.ts
strip_blocks vite.config.ts
strip_blocks css/index.css
strip_blocks css/landing.css

rm -f src/chrome.ts css/widgets.css web.config
echo "removed src/chrome.ts css/widgets.css web.config"

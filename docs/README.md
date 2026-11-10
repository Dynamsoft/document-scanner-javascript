# MDS Documentation Site

VitePress site for the Mobile Document Scanner JS Edition docs - see [vitepress-docs](https://github.com/dynamsoft-docs/vitepress-docs) for development instructions.

## MDS specifics

- `guide/index.md` is the authored source of the user guide. The repository
	`README.md` is a hand-written landing stub (intro, install, quick start,
	links here) that serves the GitHub repo page — edit each where it lives.
	npm still carries the full guide: `.github/workflows/publish.yml` runs
	the theme's `ds-docs-npm-readme` bin just before `npm pack` (best-effort;
	see the workflow comment), overwriting `README.md` in the CI workspace
	only — a generated README is never tracked in git.
- Guide links into the API reference follow the theme's handwritten
	site-relative convention (theme README → Content conventions).
- `changelog.md` single-sources the repository `CHANGELOG.md` (Keep a
	Changelog format, also shipped in the npm package via the `files` list) —
	edit `CHANGELOG.md`, never the stub.
- `index.md` (the site root — it doubles as the version switcher's fallback
	when a page has no counterpart in another version) and `guide/frameworks.md`
	are authored here, migrated from the Jekyll site's `introduction/index.md`
	and `samples/frameworks/README.md` respectively (the latter now holds a
	stub pointing back here). Images live next to the page that uses them
	(bundled as content-hashed `/assets/` files, so the server's webp rewrite
	can never shadow them with a stale Jekyll-era `.webp`); `public/` stays
	untracked scratch space.
- The old `introduction/` URL redirects to the root via `web.config` (see
	Deployment below); the sidebar's "Introduction" entry now links to `/`.
- The API reference is generated from `src/build/index.ts`; source links
	point at the public repository's `v1.5.0` tag with line anchors
	(`gitRevision` in `typedoc.json` — bump per release). This is valid because
	`src/` is identical between the dev and public repos (verified:
	`git diff main prod-main -- src` is empty and no `sanitize:` markers exist
	under `src/`). If sanitization ever starts touching `src/`, line anchors
	become wrong — set `"disableSources": true` in `typedoc.json` instead.
- `versions.json` currently tracks `main` for latest; older MDS/MWC versions
	(Jekyll-era) stay as frozen server copies, listed without a `branch`.
	Branches must contain the docs toolchain to be tracked.
- Doctests: evaluated `vite-plugin-doctest` (Vitest ≥4; `vp test` at the
	repo root is Vitest 4.x, so no new runner) in July 2026 and deferred —
	of the 27 TSDoc `@example` blocks, 23 use the `Dynamsoft.*` UMD global
	(deliberately, showing CDN-style usage; unresolvable in module scope)
	and 6 need a DOM, leaving 4 assertion-free blocks to gain. Revisit if
	examples ever migrate to import-style; the dependency would then be a
	repo-root devDependency (never the docs or theme package — they have no
	execution context for product code).

## Deployment

The Docs workflow is a thin caller of the theme's reusable workflow, which
owns the build/deploy job (theme README → Deployment); the site deploys
under `/mobile-document-scanner/docs/web/`. MDS specifics:

- `web.config` (docs package root, copied to the site root at build by the
	theme) owns the server's IIS config for the docs subtree —
	the webp rewrite and the legacy-URL redirect map, moved verbatim (with
	redirect targets made explicitly root-relative) from the Jekyll docs
	repo, which previously deployed it. Review it before the first
	production deploy; a future candidate is redirecting the frozen
	`release-notes/index.html` to the new `changelog.html`, but the frozen
	page also serves pre-1.5.0 history, so that is a deliberate call.
- The frozen Jekyll-era version copies (old MDS/MWC versions, the MWC
	pages, `assets/`) live only on the server and survive deploys untouched.

## MWC docs stay separate

The Jekyll-era site nests the Mobile Web Capture docs in the MDS sidebar
(`code-gallery/mobile-web-capture/`, plus legacy MWC 1.x–3.x version copies).
Decided (July 2026): do **not** carry that nesting into this site.

Nesting is technically possible (a sidebar group over markdown copied into
`docs/`) but breaks the versioning model: `versions.json` tracks branches of
*this* repository, while MWC is its own SDK repo (`mwc-js`, npm
`dynamsoft-mobile-web-capture`, 4.x) with its own release branches — an MWC
doc update would force a new MDS docs version and vice versa, and MWC's API
reference cannot be typedoc-generated from this repo's source. The Jekyll
site had the same coupling (cross-mapped versions in `product_version.yml`)
and it is one of the things this migration retires.

Instead, when MWC docs migrate, stand up the same toolchain in `mwc-js`
(theme README → "Setting up a docs site") under its own `docsRoot`, and
cross-link the guides with absolute URLs (the MDS guide's "Next Step"
already links to the MWC guide). Until then the frozen Jekyll-era MWC pages
stay live on the server — the FTP sync leaves them untouched — so existing
URLs keep working; once an MWC site exists, add redirects to the server's
`web.config`.

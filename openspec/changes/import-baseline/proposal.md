## Why

Every other change in the migration (restore the two routes, align Connect, E2E test, docs, labs
compliance, single commit) needs the Visualizer source code to be present in this repo and to be
known-good. Today this repo only holds a one-line `README.md`. Without a clean, reproducible copy
and a recorded "green" baseline we could not tell later whether a failure was caused by the copy,
by the old code, or by our own changes.

## What Changes

- Copy the working tree of `$SRC` into this repo with a
  single, explicit, repeatable `rsync` command that **excludes**: `.git`, `.github`, `.serena`,
  `.specify`, `.claude`, `.vscode`/`.idea`, `netlify.toml`, every `node_modules`,
  `visualizer/public` (build output), `google*.html`, `coverage`, `.DS_Store`, lock files of other
  package managers (`yarn.lock`, `pnpm-lock.yaml`), `visualizer/.env.local` and the Playwright
  session file `visualizer/scripts/screenshots/auth-state.json`.
- Keep the unusual nesting `visualizer/visualizer/` (Connect needs the folder name to equal
  `deployAs[].name`).
- Keep (for later changes to clean): `visualizer/.env`, `.gitignore`, `connect.yaml`,
  `CLAUDE.md`, `FEATURES.md`, `specs/`, `visualizer/docs/*`, `visualizer/scripts/screenshots/`.
- Protect local-only planning folders (`.claude/`, `openspec/`, `plans/`) from ever being
  committed, using the local file `.git/info/exclude` (not the public `.gitignore`).
- **Do not commit.** The final repo must have exactly one commit (change I).
- Install dependencies with `npm ci` and establish a recorded baseline for
  `typecheck`, `lint`, `test` and `build`.
- Make the baseline genuinely green: `lint` fails on the pristine copy (13 errors, all in the
  separate Playwright screenshot sub-project), so add `scripts/screenshots/**` to the ESLint
  `ignores` list (one-line, formatting-clean change to `visualizer/eslint.config.js`).
- Document the environment variables that `npm run build` needs, because the build fails
  without them.

## Capabilities

### New Capabilities
- `source-import-baseline`: the rules for how the Visualizer source is copied into this repo
  (what is included/excluded and why) and the recorded, reproducible green baseline
  (install, typecheck, lint, test, build) that later changes are measured against.

### Modified Capabilities
<!-- none: openspec/specs/ is empty -->

## Impact

- Adds ~302 files (about 10 MB, 50 Jest suites, 846 tests) under the repo root and `visualizer/`.
- Touches exactly one copied file: `visualizer/eslint.config.js` (lint ignore).
- Overwrites the tracked one-line `README.md` (it is replaced by the real README; the repo is
  history-reset later anyway, see owner question Q2).
- No change to the old repo (read-only), no network access except `npm ci`.
- Out of scope (handled later): editing `connect.yaml`/`.env`/README (E, G), SPDX/LICENSE (H),
  restoring the two routes (B, C, D), committing (I), pushing (J).

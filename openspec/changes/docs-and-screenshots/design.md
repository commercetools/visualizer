## Context

Glossary (read once):
- **MC** = commercetools Merchant Center (the admin web UI). The Visualizer is an **MC Custom Application**: a
  web app that MC loads in its own shell.
- **Connect** = commercetools' hosting service for connectors/apps. It builds and serves the app from a git repo.
- **spec-kit style** = one numbered folder per feature in `specs/`, each with `spec.md` (what/why, numbered
  functional requirements `FR-###`), `data-model.md` (shapes + API operations) and `quickstart.md` (how to build it).
- **Scrub** = remove strings that must not be public (here: `<internal-org>`, internal project key).
- **DevTools connector** = the Chrome DevTools MCP tools (`navigate_page`, `take_screenshot`, ...) that drive the
  owner's already-logged-in Chrome (manual step M1).

Current state (verified on the source repo `$SRC` and, after change A, in this repo):
- `README.md` (3 KB): lists 5 features, Installation is one vague sentence ("pre-packaged to run as a connect
  application"), no scopes, no config table, local-dev block uses `APPLICATION_URL`, 14 screenshots.
- `FEATURES.md`: line ~174 says "Former visualizations (`entity-diagram`, `visualize-drilldown`) ..."; mentions
  `netlify.toml`.
- `CLAUDE.md`: "Repo layout" mentions `netlify.toml`; "CI (`.github/workflows/ci.yml`) only runs ..." (line ~29);
  "Current feature areas ... explicitly **not** being reimplemented" (line ~86); "Specs / constitution" says
  "in-progress reimplementation".
- `specs/README.md`: intro says specs exist so the app "can be reimplemented"; constitution item 1; a blockquote
  at the end says the visualizations "are **not** being reimplemented ... drop their cards/routes".
- `specs/001-welcome/spec.md` lines ~33-44: lists the two cards and an open item "Either restore a target for it or drop the card".
- `<internal-org>` occurs only in 3 files: `specs/002-types/data-model.md:102`, `specs/003-states/data-model.md:61`,
  `specs/006-custom-objects/data-model.md:40` (all "Via `<private-shared-hooks-package>`").
- `<project-key>` (an internal sandbox project key) is the default in
  `visualizer/scripts/screenshots/capture.mjs:16`, `login.mjs:14` and its README line 26.
- The publication gate (change I) flags the three `data-model.md` lines as a framing WARN; we fix them now.

Constraints: no app code changes here; do not touch `plans/` or `.claude/` (local-only, never published). `openspec/` and `specs/` ARE published (owner decision 2026-10-08, Q5/Q6): this change does not rewrite OpenSpec files except the scrub of internal strings in step 4.6, and change H (task 2b) owns the final openspec scrub and `openspec/README.md`;
R4 (no GitHub Actions, no Netlify); R9 (junior-readable).

## Goals / Non-Goals

**Goals:** accurate, scrubbed, complete docs; reproducible screenshots; specs for the two restored views.

**Non-Goals:** the "unsupported" banner, SUPPORT/CONTRIBUTING/AUTHORS/LICENSE (change H); rewriting existing
specs 002-006 beyond the scrub; changing code.

## Decisions

### D1. README structure (exact section order)
1. `# commercetools Visualizer` + one-sentence description (this sentence is also reused as the GitHub repo
   description and `package.json` `description`, owner question Q10). **Leave one blank line after the title: H inserts the unsupported banner there.**
2. `## Features` - table: Area | What you can do | Docs link. Rows: Welcome, Types, States (flow diagram),
   Subscriptions, API Extensions, Custom Objects, **Entity Diagram**, **Visualize Drilldown**. Take wording from
   FEATURES.md and the specs written by changes B/C (do not invent behaviour; if unsure, open the screen in the app).
3. `## Installation (commercetools Connect)` - numbered steps copied from the Connect skill, Pattern 5
   (register in MC with placeholder URL -> deploy via Connect -> replace URL), then two tables:
   - **OAuth scopes** - generated from `custom-application-config.mjs` (view and manage lists, one line of "why" each).
   - **Configuration** - one row per `standardConfiguration` key of `connect.yaml`: key, required, default, meaning.
   Change E already writes these tables (R5); G keeps them verbatim if present and only fixes wording; if E is
   not done, G writes them from the two files above. Never keep a table that disagrees with the files.
4. `## Local development` - `.env.local` template identical to `visualizer/.env.example` (owner question Q8),
   `npm ci`, `npm start`, Node 22 / npm 10.9.2 (`.nvmrc`), how to register `http://localhost:3001` in MC.
5. `## Development` - `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` + the line "This repository
   has no GitHub Actions workflows; builds happen in Connect."
6. `## Known issues` - the two existing bullets + anything F found (read F's regression notes).
7. `## Screenshots` - 16 images, grouped as today, two new groups at the end: Entity Diagram, Visualize Drilldown.
8. `## Specifications` - one line pointing to `specs/README.md`.
(Licence/support sections are added in H.)

### D2. FEATURES.md
Keep the file's format (bullets + file paths). Add sections "Entity Diagram" and "Visualize Drilldown" with real file
paths from B/C (`src/components/entity-diagram`, `src/components/visualize-drilldown`; confirm with `ls`).
Delete the bullet about "Former visualizations ... removed". Replace "with a matching `netlify.toml` SPA rewrite for
local/preview hosting" by "hosted by commercetools Connect (no other hosting config is shipped)". Update `_Last updated:_` date.

### D3. CLAUDE.md
Edit only the three problem places named in Context plus the layout paragraph (list the real root files after A/E:
`connect.yaml`, `specs/`, `visualizer/`; no `netlify.toml`). The CI paragraph becomes: "There is no CI configuration
and no GitHub Actions in this repository by design; hosting/building is done by commercetools Connect. Run
`npm run lint`, `typecheck`, `test`, `build` locally before committing." Feature areas list gains the two views;
the "carts" removal remark stays (it is still true).

### D4. Specs for the two views - write them (Q5 default "keep"), not drop
Why: the repo's own constitution says specs are the source of truth; leaving the two views unspecified would make
`specs/` inconsistent. Cost is low because B/C already produce `specs/` deltas in their OpenSpec changes
(`openspec/changes/restore-entity-diagram/specs/**`, `restore-visualize-drilldown/specs/**`): **convert** those into
spec-kit files rather than re-deriving from code. Per spec: `spec.md` (user scenarios, `FR-###` list, edge cases,
permissions - View only), `data-model.md` (node/edge model resp. treemap node model, REST proxy operations: these two
views read via the REST API proxy `COMMERCETOOLS_PLATFORM`, see `specs/README.md` constitution item 2), `quickstart.md`.
No `contracts/*.graphql` (no GraphQL); say so in `specs/README.md` ("Per-feature artifacts").
Alternative considered: drop `specs/` entirely (Q5 "drop"). Rejected: default is keep; only do it if the owner answers so (then also delete the "Specifications" README section and CLAUDE.md "Specs / constitution").
Routes for the index: use exactly the `uriPath`s from `custom-application-config.mjs`/`routes.tsx` (`entity-diagram`, `visualize-drilldown`).

### D5. Screenshot method: Chrome DevTools connector (decided), Playwright script kept in sync
Options:
| | Playwright (`capture.mjs`) | DevTools connector |
|---|---|---|
| Login | needs `npm run login` (headed browser, manual login, saves `auth-state.json`) | reuses owner's logged-in tab (M1) which F already needs |
| Setup | downloads ~180 MB Chromium, pinned `playwright@1.61.0` | none |
| Reproducible by outsiders | yes | no |
| Known quirks | needs `--disable-features=ViewTransition` flag (documented in its README) | none known |
Decision: **take the shots with the DevTools connector** (zero extra owner effort, same session as F), because the
owner asked us not to depend on them. **Also** update `capture.mjs` so the public repo stays reproducible: add the
two new shots, make `MC_PROJECT_KEY` mandatory. We cannot run it without a Playwright login, so we only run
`node --check capture.mjs`; say so in the final report (accepted risk, low: copy of the existing pattern).
Format/size: 1440x900 viewport, `format: jpeg`, `quality: 90`, `fullPage: true` for lists/forms (same as old
script); keep `.png` names for the two Custom-Objects shots (png) to keep README links stable.
Tool calls (parameters verified from the tool schemas): `resize_page{pageId,width:1440,height:900}`,
`navigate_page{pageId,type:"url",url}`, `take_screenshot{pageId,format,quality,fullPage,filePath}` with an
**absolute** `filePath` under `<repo-root>/visualizer/docs/`.

### D6. Privacy review
Screenshots show MC chrome (project name in the top bar, user avatar/initials, project switcher). Use a sandbox project
whose name is neutral and data is sample data (M2). Look at each image (Read tool shows images) for: real person names/e-mails,
customer/prospect names, internal URLs, secrets in forms (Extensions destination forms: use obviously fake values like
`https://example.com/hook`; never real ARNs/keys). Retake or crop if any appears. Do not put the project key in file names.

### D7. Scrub list
`<internal-org>` (3 data-model.md lines -> "the shared data-fetching hooks"), `<project-key>` (3 places in the
screenshots dir; replace default with required env + friendly error). Also grep for e-mail addresses and `localhost` oddities.
The gate has the final say (change I), but G must leave zero hits so I does not have to edit after the commit.

## Risks / Trade-offs

- [Screenshot of an MC page leaks private data] -> D6 review checklist task 5.4; sandbox project only.
- [README scopes/config tables drift from files] -> verification commands in task 2.5 (grep loop).
- [capture.mjs untested] -> `node --check` + copy existing helpers; documented.
- [B/C/D/E change after G] -> by dependency rule G starts only after F; if code changes later, re-run tasks 2.5, 5.x.
- [Specs 007/008 become fiction] -> derive only from B/C artifacts and the running app; each FR must be checkable on screen.

## Migration Plan

All edits are plain working-tree edits (no commits - change I makes the single commit). Rollback = `git checkout -- <file>`
cannot be used (nothing committed): so before editing, copy originals: `mkdir -p ../scratch-docs-backup && cp README.md FEATURES.md CLAUDE.md ...`
(task 1.3).

## Open Questions

- Owner decisions: keep the specs and regenerate the screenshots (defaults used).

## Why

The documentation copied from the private repo describes a product that no longer matches what we publish:
it says two views were "not being reimplemented" (we restore them in B/C/D), says CI runs on GitHub Actions
(we ship **no** workflows, R4), points to Netlify (dropped), mentions the private org string
`<internal-org>`, and its screenshots miss the two restored views and may show private data. A public
commercetools-labs repo is read before it is cloned, so the docs must be correct, scrubbed and complete.

## What Changes

- Rewrite `README.md`: features (including the two restored views), install via Connect, scopes + config
  table, local development, known issues, screenshots. (The "unsupported" banner is added by change H.)
- Update `FEATURES.md` (add the two restored views, remove "former visualizations ... removed" and Netlify text).
- Update `CLAUDE.md` (remove "not being reimplemented", fix layout notes, replace the CI statement with
  "no GitHub Actions - Connect only").
- Update `specs/README.md`, `specs/001-welcome` and ADD two spec-kit style specs `007-entity-diagram` and
  `008-visualize-drilldown` (owner question Q5 default: keep `specs/`, scrubbed).
- Regenerate all screenshots in `visualizer/docs/` from a sandbox project with the Chrome DevTools connector
  and add two new ones; extend `visualizer/scripts/screenshots/capture.mjs` for the new views and remove the
  hard-coded internal project key.
- Scrub every `<internal-org>` string and the `<project-key>` project key from tracked docs/scripts.

## Capabilities

### New Capabilities
- `project-documentation`: README, FEATURES.md and CLAUDE.md are accurate, scrubbed, Connect-only and list the restored views.
- `feature-specs`: `specs/` is complete (incl. entity-diagram and drilldown), consistent with the code and free of internal names.
- `docs-screenshots`: every screenshot referenced by README exists, is current, is privacy-reviewed and reproducible.

### Modified Capabilities
<!-- none: openspec/specs/ is empty -->

## Impact

- Files: `README.md`, `FEATURES.md`, `CLAUDE.md`, `specs/**`, `visualizer/docs/*`, `visualizer/scripts/screenshots/*`; text-only scrub of internal strings in the published `openspec/**` (task 4.6; final pass in `labs-compliance`).
- No application source changes. Depends on F (running, verified app). Feeds H (banner is inserted into the README written here).
- Needs manual step M1 (owner logged-in Chrome) - already required by F.

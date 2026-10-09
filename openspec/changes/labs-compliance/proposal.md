## Why

A commercetools-labs repository must be MIT-licensed, carry an SPDX header in every source file, use
`@commercetools-labs/<name>` package names, and say "unsupported" in three places (file header, README banner,
`SUPPORT.md`). Without this the pre-publication gate (`gate.mjs`, change I) FAILs: on the source repo it reports
206 files without SPDX header, a tracked `.env`, no LICENSE/SUPPORT/CONTRIBUTING, and 2 wrong package names.
Also, 245 commits of contributor history will be squashed (R3), so the names must live on in `AUTHORS.md`.

## What Changes

- Run the skill's `ossify.mjs` (dry-run first, then `--apply --year 2026`): writes `LICENSE` (MIT), adds the SPDX
  header to source files, renames both `package.json` files to `@commercetools-labs/...`.
- Add `repository`, `bugs`, `homepage`, `license`, `description` to `visualizer/package.json` (ossify only
  repoints URLs that already exist; there are none today) and sync the lockfile name.
- Write `SUPPORT.md`, `CONTRIBUTING.md`, `AUTHORS.md` (full texts are in design.md).
- Insert the "unsupported" banner in `README.md` and add Licence/Support sections.
- Review ossify's refusals and third-party/dependency licences (including the treemap library chosen in change C); record the decisions.
- `openspec/` and `specs/` are published (owner decision): understand that ossify leaves `.md`/`.yaml`/`.json` without SPDX headers, scrub the openspec content of internal strings, personal paths and owner-only steps, and make the change records understandable to outsiders (`plans/` is not shipped).

## Capabilities

### New Capabilities
- `labs-licensing`: LICENSE, SPDX headers on every source file, package name and URL metadata.
- `support-terms`: "unsupported" in header + README banner + SUPPORT.md, CONTRIBUTING.md, AUTHORS.md.
- `third-party-review`: foreign-copyright refusals handled and dependency licences reviewed and recorded.

### Modified Capabilities
<!-- none -->

## Impact

- Touches almost every source file (a one-line-block header; no logic change) -> re-run typecheck/lint/test/build after.
- New root files: `LICENSE`, `SUPPORT.md`, `CONTRIBUTING.md`, `AUTHORS.md`.
- Requires G finished (README final) and every code-writing change (A-F) finished: later code changes need `ossify --apply` again.
- Must not copy the skill's `policy.json` anywhere in the repo or plans.

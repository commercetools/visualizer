## Context

Glossary:
- **commercetools-labs** = public commercetools GitHub repos that are reference code: MIT, freely available, **unsupported**.
- **SPDX** = a standard way to name a licence in a machine-readable line (`SPDX-License-Identifier: MIT`).
- **ossify** = the skill script that *prepares* a repo (writes LICENSE, adds headers, renames packages). It is advisory.
- **gate** = the skill script that *blocks* publication (change I). H must make the gate's licence checks pass.
- **Skill dir** (`SK`) = `$SK`.
  `policy.json` there lists customer names: **never copy or print it into this repo or `plans/`**.

What the scripts really do (read from the source of `ossify.mjs` and `gate.mjs`):

ossify
- Flags: `--repo <path>` (required), `--apply` (otherwise dry run), `--year YYYY` (default: current year).
- Walks the repo, skipping directories named `.git node_modules public dist build coverage .next .turbo .netlify Pods .build DerivedData .venv __pycache__`.
  It does NOT skip `.claude/`, `openspec/`, `plans/` (they contain only `.md/.json/.yaml/.gitkeep`, which are skipped by extension, so ossify never rewrites them - re-check at run time in the report). Consequence for the PUBLISHED `openspec/` and `specs/` (owner decision 2026-10-08): ossify adds **no SPDX header to any `.md`/`.yaml`/`.json`** (verified in `ossify.mjs`: `SKIP_EXT` contains `.md .json .yaml .yml ...`), which is exactly what we want, because OpenSpec parses `proposal.md`/`design.md`/`tasks.md`/`spec.md` and `.openspec.yaml`/`config.yaml` strictly (a leading comment block would not break YAML but would pollute Markdown headings the validator expects). The licence of these documents is covered by the root `LICENSE`; the gate does not require headers on `.md`. Never add SPDX comments to openspec files by hand. The gate, however, DOES scan the text of every tracked file (including `openspec/` and `specs/`) for internal infrastructure, customer-name and secret patterns - see D10.
- Never headers (extension skip list): `.json .lock .md .svg .png .jpg .jpeg .webp .gif .ico .woff .woff2 .ttf .otf .pdf .zip .mp4 .snap .txt .yaml .yml .toml ...`. So `package.json`, `schemas/ctp.json`, `connect.yaml`, `README.md`, images are untouched.
- Generated files skipped: paths matching `types/generated/`, `generated/`, `*.generated.*`, `graphql.ts`, `*-lock.*`.
  => `visualizer/src/types/generated/ctp.ts` is skipped (correct: `npm run generate-types:ctp` overwrites it).
- Comment styles: `/* ... */` block for `.ts .tsx .js .jsx .mjs .cjs .mts .cts .css .scss .java .kt`; `// ` for `.swift`; `# ` lines for `.graphql` and `.sh`.
  => **ossify DOES header all `.graphql` files** (41 in the source repo, incl. 5 in `specs/*/contracts/`), but the gate does not require it. Harmless (`#` is a GraphQL comment); `npm run lint` must still pass.
- Files with another extension and no style (e.g. `.gitignore`, `.prettierrc`, `.nvmrc`, `.env.example`) are listed under "no comment style": nothing to do.
- Shebang `#!` stays on line 1. A file whose first 800 chars already contain `SPDX-License-Identifier:` is left alone (idempotent).
- **Refuses** (prints under "FOREIGN COPYRIGHT") any file whose first 2000 chars hold a `Copyright ... / (c) YYYY` line that does not mention "commercetools". **Excludes** (prints under "THIRD-PARTY DIRECTORIES EXCLUDED") any sub-directory with its own `LICENSE|LICENCE|COPYING` or a `metadata.json` naming another organisation.
- package.json: name -> `@commercetools-labs/<unscoped name>`; rewrites the org in existing `homepage`, `repository`, `bugs` GitHub URLs to `commercetools`. Does **not** add missing fields, does **not** touch `package-lock.json`.
- LICENSE: always (over)writes root `LICENSE` with the MIT text; holder = "commercetools GmbH and the commercetools-labs contributors".

gate (licence-related checks only; the rest is change I)
- FAIL: forbidden files (`.env`, `.env.local`, `*.pem`, `*.p12`, `*.key`, `service-account*.json`, `.npmrc`), missing SPDX on `.ts .tsx .js .jsx .mjs .cjs .swift .kt .java` (generated paths excluded: `package-lock.json schemas/ src/types/generated/ types/generated/ public/ dist/ build/ .next/ ...`), foreign copyright in the first 2000 chars, any sub-directory with its own LICENSE, missing `LICENSE` / `SUPPORT.md` / `CONTRIBUTING.md`, any non-`@commercetools-labs/` package name.
- Note: gate does not require `FEATURES.md` for labs (only for ct-builders), and does not check README banner or AUTHORS.md: those checks are ours.

Facts about THIS repo (source repo `commercetools-visualizer`, gate run with `--no-history`):
- 206 files need SPDX (125 `.ts` + 72 `.tsx` + 7 `.js` + 3 `.mjs` minus the generated `ctp.ts`) plus whatever B/C/D add.
- 2 package names: `visualizer`, `visualizer-screenshots`.
- No `Copyright`/`(c) YYYY` text and no `LICENSE` anywhere in tracked source (grep verified) -> no foreign-copyright refusals expected.
- `visualizer/package.json` has no `repository`/`bugs`/`homepage`, `"description": ""`, `"private": true` (keep private: it is an app, not an npm package).
- The lockfile top-level `"name": "visualizer"` stays stale after ossify; `npm ci` still works (verified in a scratch copy) but we sync it anyway.

## Goals / Non-Goals

**Goals:** licensing/support compliance so the gate's licence checks are green; contributor names preserved.
**Non-Goals:** the scan for customer names/secrets/infra (change I), history rewrite (I), pushing (J), code changes.

## Decisions

### D1. Order of operations (why)
1. Add package.json metadata by hand (ossify cannot).
2. `ossify` dry run -> read -> decide -> `--apply`. Dry run first because `--apply` rewrites ~250 files in place and nothing is committed to roll back (we are in a single-commit workflow). Take a backup copy first (task 1.3).
3. Sync lockfile; write SUPPORT/CONTRIBUTING/AUTHORS; README banner.
4. Re-run ossify dry run (must be idempotent) + build/test/lint (headers must not break anything).
5. Dependency licence review.
Rule: any later change that adds/edits source files requires `ossify --apply` again (it only touches files lacking a header).

### D2. Year
`--year 2026` (first publication year; today is 2026-10-08). Do not use `$(date +%Y)` if the repo is released in a later year and you want 2026 - pass it explicitly.

### D3. Fields added to `visualizer/package.json`
```json
"description": "<README first sentence>",
"license": "MIT",
"repository": { "type": "git", "url": "git+https://github.com/commercetools/visualizer.git", "directory": "visualizer" },
"bugs": { "url": "https://github.com/commercetools/visualizer/issues" },
"homepage": "https://github.com/commercetools/visualizer#readme"
```
`scripts/screenshots/package.json` keeps `private: true`, gets only the rename (it is a helper, no URLs needed). Keep 2-space indentation and key order (ossify preserves it).

### D4. The "unsupported" banner (README, directly under the title; exact text)
```
> **UNSUPPORTED - commercetools-labs project.** This repository is reference code, freely available under the
> [MIT licence](./LICENSE), provided **AS IS** and **unsupported**: there is no support, SLA, roadmap or
> guarantee of maintenance. Use it as a starting point and take responsibility for what you run. See
> [SUPPORT.md](./SUPPORT.md).
```
Plus at the bottom of README a `## Licence and support` section: "MIT, see LICENSE. Unsupported, see SUPPORT.md. Contributions: CONTRIBUTING.md. Contributors: AUTHORS.md."

### D5. SUPPORT.md (full text)
```
# Support

This project is part of **commercetools-labs**. It is reference code that is **freely available, provided
AS IS and unsupported**.

- There is **no support**: no help desk, no SLA, no guaranteed response time, no commitment to fix bugs,
  to review pull requests or to keep the code compatible with future Merchant Center or commercetools API changes.
- commercetools Support and Professional Services **do not** support this repository.
- It is not part of the commercetools product roadmap and may be changed or archived at any time.
- You may open a GitHub issue to share a finding. It may never be answered.
- If you need a supported solution, build on the official commercetools products and documentation:
  https://docs.commercetools.com

You are welcome to fork the repository (MIT licence, see [LICENSE](./LICENSE)) and adapt it to your needs.
```

### D6. CONTRIBUTING.md (full text)
```
# Contributing

Thank you for your interest. This is an **unsupported** commercetools-labs project (see [SUPPORT.md](./SUPPORT.md)):
issues and pull requests are welcome, but there is **no promise that they will be read, reviewed or merged**.

## Ground rules
- By contributing you agree that your contribution is licensed under the [MIT licence](./LICENSE).
- Do not include secrets, customer data, real project keys or personal data in code, tests, issues or screenshots.
- Do not add GitHub Actions workflows. This project is built and hosted with commercetools Connect.
- Every new source file needs the SPDX header used in the other files
  (`SPDX-License-Identifier: MIT`, copyright line, "Freely available, AS IS and UNSUPPORTED. See LICENSE.").

## Develop locally
```shell
cd visualizer
npm ci
npm start            # needs a Merchant Center custom application registered for http://localhost:3001 (see README)
npm run typecheck && npm run lint && npm test && npm run build
```

## Pull requests
1. Fork, create a branch, keep the change small and focused.
2. Run the four commands above; they must pass.
3. Describe what and why. Add or update tests for changed behaviour.
```
(Inner code fence: write it with a 4-space or `~~~` fence in the real file so the markdown nests.)

### D7. AUTHORS.md (full text; names from `git shortlog` and trailers of the source repo `main`)
| Contributor | Evidence in source history (main, 245 commits) | Listed as |
|---|---|---|
| Philipp Hofmann | 230 commits as `philipp.hofmann@commercetools.com` + 1 as `philipp@philipp-hofmann.org` | Philipp Hofmann |
| Behnam Tehrani | 10 commits as `behnam777@gmail.com` + 1 merge as `15884572+behnamt@users.noreply.github.com` | Behnam Tehrani |
| mssirvi / "Manish" | 2 commits as `mssirvi@users.noreply.github.com` + 2 trailers `Manish <msirvi@mcfadyen.com>` (same person, deduped) | Manish (GitHub: mssirvi) |
| Chris Boyke | 1 commit (`cboyke@gmail.com`) | Chris Boyke |
| Claude (Anthropic) | trailers: Claude Sonnet 5 (49), Claude Sonnet 5.5 (11), Claude Opus 4.8 1M context (1) | AI assistants |
Not listed: `dependabot[bot]` (exists only on a side branch `dependabot/npm_and_yarn/...`, not in `main`; a bot).
File text:
```
# Authors

The commercetools Visualizer was developed in a private repository before it was published. Its history was squashed
into a single commit; the people and tools below contributed to that history.

- Philipp Hofmann
- Behnam Tehrani
- Chris Boyke
- Manish (GitHub: mssirvi)
- Claude Sonnet 5, Claude Sonnet 5.5 and Claude Opus 4.8 (AI assistants by Anthropic, credited as co-authors)

No e-mail addresses are listed here. Copyright holder for licensing purposes: commercetools GmbH and the
commercetools-labs contributors (see LICENSE).
```
Counts above are from `git shortlog -sne HEAD`; the master plan's "Philipp 230+1, Behnam 10+1" matches. The all-branches shortlog shows larger numbers (271/34) because side branches are included: we use `main` only (owner question QH1 asks to confirm).

### D8. Dependency licence review
Computed from the lockfile (source repo): 2473 MIT, 135 ISC, 113 Apache-2.0, 57 BSD-3, 36 BSD-2, 15 0BSD, 14 BlueOak, plus a long tail.
Non-permissive entries to record:
| Package | Licence | Decision |
|---|---|---|
| `@img/sharp-libvips-*`, `@img/sharp-win32-*`, `@img/sharp-wasm32` (optional platform binaries of `sharp`) | LGPL-3.0-or-later (some combined with Apache/MIT) | OK: installed from npm on the user's machine, never vendored or copied into this repo; not part of the browser bundle. Record. |
| `axe-core` | MPL-2.0 | OK: unmodified dependency (file-level copyleft only). |
| `dompurify`, `harmony-reflect` | dual MPL-2.0/Apache-2.0 etc. | OK (permissive option exists). |
| `caniuse-lite`, `@fortawesome/free-*-svg-icons` | CC-BY-4.0 (+MIT) | OK: data/icons shipped by their packages with attribution inside the package. |
| `argparse` | Python-2.0 | OK. |
| `@commercetools/nimbus` | **`license` field missing in the lockfile** | Verify with `npm view @commercetools/nimbus license` (expected MIT, commercetools-owned); record. |
| Any dependency added by B/C (e.g. `@visx/hierarchy` MIT, `@visx/group` MIT, `classnames` MIT, `d3-hierarchy@1` BSD-3-Clause, `@types/d3-hierarchy` MIT from change C; owner answered QC1/Q13: use an open-source library) | check | MIT/ISC/BSD/Apache OK; anything else -> stop and ask. If C fell back to another library (design C D1 ladder), review that one instead. |
No source code of third parties is vendored (no sub-directory with its own LICENSE; no foreign copyright lines). The old `@commercetools-uikit/*` packages remain only as transitive deps of the MC application kit.

### D10. Published `openspec/` and `specs/` content (owner decision 2026-10-08, Q5/Q6)
`openspec/` (config, active and archived changes, `openspec/specs/`) and `specs/` are committed and become public. `plans/`, `.claude/`, `.serena/` stay local and `.specify/` is not copied. Therefore:
- **Scrub**: no text in `openspec/**` or `specs/**` may contain internal strings that the gate flags (internal repo/org names, internal hostnames, customer names, secrets, personal absolute paths like `/Users/<name>/...`, personal e-mail addresses outside the intended trailers in change I). The plan text legitimately talks about the internal source repository; reword to neutral phrases ("the internal source repository", `$SRC`, `$SK`, `<repo-root>`) instead of literal names/paths. Do not print `policy.json`; let `gate.mjs` find hits and fix each one.
- **Makes sense publicly**: add a short "About these change records" paragraph to `openspec/config.yaml` context or (if the file is not suited) to the top of `openspec/README.md` (new, plain Markdown): these are the planning records of the project, written for coding agents and maintainers; they describe a one-off migration (import from an internal repo, relicensing, single-commit publication). State that `plans/` (owner notes) and tool folders are not part of the repository, so references to `plans/...` inside change files are historical. Rewrite or remove references that need `plans/owner-questions.md`/`plans/manual-steps.md` to be understood: inline the decision (one sentence) instead of the link. Remove owner-only manual steps (credentials, org admin clicks, scratchpad paths, `$BK` backup locations) from published tasks: either drop them or phrase them as "maintainer step". Tasks already ticked are fine to keep; unticked ones must not instruct anyone to touch private resources.
- **Archived changes**: `openspec/changes/archive/**` is published as is after the same scrub; do not delete it (history of decisions), but make sure each archived folder still validates (`openspec validate --all`).
- **Parsing safety**: edit text only; never reorder `## ` headings, `### Requirement:`/`#### Scenario:` lines, `- [ ]` checkboxes or the `.openspec.yaml` fields. Re-run `openspec validate --all` after every scrub pass.

### D9. Refusal handling procedure
1. A refused file -> open it, read the copyright line. If it is a false positive (e.g. text like "Copyright" in a sample string), reword the string; do NOT edit the header regex.
2. If it is genuine third-party code: either delete/replace it with our own code, or keep it with its original licence **and** list it in a `THIRD_PARTY_NOTICES.md` - but the gate will FAIL on it, so the owner must decide (new owner question). Never relicense.
3. An excluded directory with its own LICENSE: same decision; gate FAILs on it until removed.
Expected for this repo: none.

## Risks / Trade-offs

- [Header insertion breaks something] -> task 5 re-runs typecheck/lint/test/build; pitfalls: a file starting with `'use client'`/`// @ts-nocheck`/`/// <reference>` still works because the header is only comments before it; prettier may want a different blank line - `npm run lint` does not run prettier, so ignore unless `npm run format` is part of your flow.
- [ossify touches local-only dirs] -> task 2.3 inspects the dry-run list for `.claude/`, `openspec/`, `plans/`; none expected (only `.md/.yaml/.json` live there, all skipped by extension).
- [Published openspec text leaks internal names/paths or trips the gate] -> tasks 2b.x: scan with the gate on a scratch copy, scrub, validate.
- [AUTHORS.md exposes private info] -> names only (no e-mails); see owner questions QH1/QH2.
- [New code added later without header] -> gate in change I will FAIL; fix by `ossify --apply`.

## Migration Plan

Working tree only, no commits. Backup (task 1.3) is the rollback: restore with `rsync -a $SCR/h-backup/ ./`. After success, delete nothing; change I performs the single commit.

## Open Questions

Q10 (name/description), Q12 (holder line) from `plans/owner-questions.md`; new QH1 (contributors from `main` only, bots excluded), QH2 (AUTHORS.md lists names without e-mails).

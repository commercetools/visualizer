## Context

Glossary:
- **Single commit / root commit**: a commit with no parent. `git rev-list --count HEAD` prints `1`.
- **Trailer**: `Key: value` lines at the very end of a commit message. GitHub shows people named in `Co-authored-by:`
  trailers as co-authors of the commit (matched by e-mail address).
- **git bundle**: one file that contains a whole repository's history (a backup you can `git clone` from).
- **`.git/info/exclude`**: a per-clone ignore file that is NOT committed (unlike `.gitignore`). We use it so local
  planning folders stay on disk but never enter the commit. **It lives inside `.git`, so `rm -rf .git` deletes it** - we recreate it.
- **Gate**: `gate.mjs` (see change H design for what it checks). It refuses to run when `git status --porcelain` is non-empty
  (untracked files count!), scans the published tree plus every ancestor commit, exits 0 only when clear.
- **SK** = `$SK`; **SCR** = the
  scratchpad dir of the session; **SRC** = `$SRC` (the private source repo, read-only here).

Facts (verified):
- Target repo: branch `main`, remote `origin = git@github.com:commercetools/visualizer.git`, one commit `27b866d "first commit"`
  containing only `README.md` = `# visualizer`. Untracked: `.claude/ openspec/ plans/` (only `openspec/` is published). Local git config: `user.name=Behnam Tehrani`,
  `user.email=behnam777@gmail.com` (also the global one).
- Source `main` history: 245 commits. `git shortlog -sne HEAD`: Philipp Hofmann 230 (`philipp.hofmann@commercetools.com`) + 1
  (`philipp@philipp-hofmann.org`), Behnam Tehrani 10 (`behnam777@gmail.com`) + 1 (`15884572+behnamt@users.noreply.github.com`),
  mssirvi 2 (`mssirvi@users.noreply.github.com`), Chris Boyke 1 (`cboyke@gmail.com`).
  `Co-authored-by` trailers on `main`: Claude Sonnet 5 x49, Claude Sonnet 5.5 x11, Claude Opus 4.8 (1M context) x1 (all `<noreply@anthropic.com>`),
  `Manish <msirvi@mcfadyen.com>` x2 (= mssirvi, the two mssirvi commits). `dependabot[bot]` only exists on branch
  `origin/dependabot/npm_and_yarn/visualizer/flatted-3.4.2`, not on `main`. (`git shortlog --all` gives bigger numbers; ignore.)
- Source gate run (before H): the `.specify/` manifest files contain 64-hex-digit hashes that the gate's secret patterns match
  (23 FAILs) -> another reason `.specify/` must NOT be copied (A excludes it; Q6).
- **The build needs environment variables.** `mc-scripts build` resolves `${env:...}` placeholders in
  `custom-application-config.mjs`. In the private repo CI supplied `CLOUD_IDENTIFIER, CUSTOM_APPLICATION_ID, APPLICATION_URL,
  INITIAL_PROJECT_KEY` and the tracked `visualizer/.env` supplied `ENTRY_POINT_URI_PATH` (+ two CRA flags). `.env` is a gate-forbidden
  file, so in a clean clone the variables must be passed on the command line (task 8.4). Final names depend on change E's `connect.yaml`.

## Goals / Non-Goals

**Goals:** one reviewed commit crediting everyone, gate green, clean-clone proof, reversible until pushed.
**Non-Goals:** pushing, tags, repo settings (J); editing source (H/G) - only amend for gate findings.

## Decisions

### D1. Reset method: `rm -rf .git && git init -b main` (what the skill prescribes), plus remote + exclude restoration
Alternatives: `git checkout --orphan new && git commit` keeps the old objects reachable via reflog and the old branch
(a leak risk if anyone ever pushes `--all`); a fresh repo has none. We back up first, so deletion is safe.
Because `rm -rf .git` also deletes the remote, the exclude file and local git config, we save and restore them (tasks 3.x).

### D2. Local-only directories via `.git/info/exclude`
Content (anchored with a leading `/` so only the root-level folders match):
```
/plans/
/.claude/
/.serena/
```
`/openspec/` is intentionally absent: owner decision (2026-10-08, Q5/Q6) - `openspec/` and `specs/` are PUBLISHED, so they are committed and scanned by the gate; `.specify/` is not copied into this repo at all.
Why not `.gitignore`: a committed `.gitignore` entry would reveal the names and be part of the published tree. Why this matters for the gate:
the gate's dirty-tree check counts untracked files; ignored files are not reported by `git status --porcelain`.
Pitfall: `.claude/` also hides `.claude/commands` - fine, they are local tooling (Q6). `CLAUDE.md` (root, a document) is NOT excluded and is published.

### D3. `git add .` safety
The team's version-control hygiene rules forbid blind `git add -A` in shared checkouts (another session might add files). Here the repo is freshly
initialised and the tree was reviewed, so we use `git add .` as the skill does, but protected twice: (1) `git add --dry-run .` list reviewed
against the checklist in task 4.3 and saved; (2) after adding, `git diff --cached --name-only` must equal the saved list. Also run `git status` and check no sibling
session is editing (`ls -lt` newest files) right before.

### D4. Author and e-mails
Commit author = Behnam Tehrani (Q4 default). Default e-mail for the author: the GitHub noreply address already in history,
`15884572+behnamt@users.noreply.github.com`, instead of the personal gmail (set via `git config user.email` in the new repo only).
Owner answer (Q3/QI1, 2026-10-08): trailers use the REAL e-mails exactly as in history (personal gmail, employer addresses included). Author e-mail stays the GitHub noreply address of D4 unless the owner says otherwise (the gmail identity is credited via a trailer).

### D5. Contributor table -> trailers (one per distinct name + e-mail identity; exact text)
Re-derived on 2026-10-08 from `git -C $SRC log` (author, committer and `Co-Authored-By` data of `main`, 245 commits).
Rule: the trailer text is copied byte for byte from history (name and e-mail); a person with two identities gets two trailers (GitHub links both to the same account if it knows the e-mail). Identities that appear only as committer `GitHub <noreply@github.com>` are skipped.
| # | Trailer (exact) | Where it occurs in history |
|---|---|---|
| 1 | `Co-authored-by: Philipp Hofmann <philipp.hofmann@commercetools.com>` | author of 230 commits |
| 2 | `Co-authored-by: Philipp Hofmann <philipp@philipp-hofmann.org>` | author of 1 commit (GitHub web edit) |
| 3 | `Co-authored-by: Behnam Tehrani <behnam777@gmail.com>` | author+committer of 10 commits (the commit author of this change uses the noreply identity below, so this credits the gmail identity) |
| 4 | `Co-authored-by: Manish <msirvi@mcfadyen.com>` | `Co-Authored-By` trailer in 2 commits |
| 5 | `Co-authored-by: mssirvi <mssirvi@users.noreply.github.com>` | author of 2 commits |
| 6 | `Co-authored-by: Chris Boyke <cboyke@gmail.com>` | author of 1 commit |
| 7 | `Co-authored-by: Claude Sonnet 5 <noreply@anthropic.com>` | trailer in 49 commits |
| 8 | `Co-authored-by: Claude Sonnet 5.5 <noreply@anthropic.com>` | trailer in 11 commits (also the model assisting this migration) |
| 9 | `Co-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` | trailer in 1 commit |
Commit author (not a trailer): `Behnam Tehrani <15884572+behnamt@users.noreply.github.com>` (1 commit in history, GitHub web identity) per D4.
Excluded: `dependabot[bot]` (not on `main`; bot), committer `GitHub <noreply@github.com>`. GitHub merges the three Claude trailers into one account (same e-mail); we keep all
three so the model names stay in the log. Task 3.1 re-verifies this table against history (new names appear -> add trailers) before committing.
Consequence of the owner decision: personal and employer e-mail addresses become public permanently once pushed; trailers can still be amended until the push (J).

### D6. Commit message (template, file `$SCR/commit-msg.txt`, used with `git commit -F`)
```
Initial public release of the commercetools Visualizer

Merchant Center custom application to view, create and edit Types, States, Subscriptions,
API Extensions and Custom Objects, plus two read-only visualizations: Entity Diagram and
Visualize Drilldown. Hosted with commercetools Connect.

Published as a commercetools-labs project (MIT, unsupported). This single commit replaces
the history of an internal repository (245 commits, 2024-2026) to avoid publishing it.

What differs from the internal version:
- Entity Diagram and Visualize Drilldown ported from the legacy UIKit to Nimbus and routed again
- Connect-only: no GitHub Actions workflows, no Netlify configuration
- MIT LICENSE, SPDX headers, SUPPORT.md, CONTRIBUTING.md, AUTHORS.md, @commercetools-labs package names
- README, FEATURES.md and specs/ refreshed, screenshots regenerated
- openspec/ change history is published alongside the code (plans/ and tool folders are not)

Co-authored-by: Philipp Hofmann <philipp.hofmann@commercetools.com>
Co-authored-by: Philipp Hofmann <philipp@philipp-hofmann.org>
Co-authored-by: Behnam Tehrani <behnam777@gmail.com>
Co-authored-by: Manish <msirvi@mcfadyen.com>
Co-authored-by: mssirvi <mssirvi@users.noreply.github.com>
Co-authored-by: Chris Boyke <cboyke@gmail.com>
Co-authored-by: Claude Sonnet 5 <noreply@anthropic.com>
Co-authored-by: Claude Sonnet 5.5 <noreply@anthropic.com>
Co-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```
Rules: no blank line between trailers; trailers are the last paragraph; do not write `<internal-org>` or customer names in the message (the gate scans files, not messages, but this message becomes public).
The date range "2024-2026": verify with `git -C $SRC log --reverse --format=%ad --date=short | sed -n '1p;$p'` and fix.
The system-added trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` is the same identity as trailer 8: do not add it twice.

### D7. Reading the gate
Output blocks: header (commit sha, history count, file count), `FAIL - must be fixed` groups by check with `path:line`, `match`, context (max 15 per check), `WARN - read these`, summary, exit.
- FAIL = must change. After fixing, `git add <file>; git commit --amend --no-edit` (keeps ONE commit; a fixup commit would leave the old content in an ancestor and the gate scans ancestors).
- WARN ("name (review)", framing wording) = read the line. Real framing (a customer-specific sentence or a password) -> reword and amend. Harmless (e.g. the plain English word in a sentence about the commercetools sample data) -> re-run with `--ack` and write the justification in the task notes. `--ack` never clears a FAIL.
- Exit codes: 0 clear, 1 findings, 2 usage/dirty tree.
- Secrets check scans every file including lockfiles; a hit means look at the line, never "ack" it.

### D8. Clean clone proof, "anonymous style"
Clone from the local repo with the file protocol into the scratchpad (`git clone file://...`) so only committed content exists (no `node_modules`,
no `.env.local`, no `public/`). Run with an empty HOME (`env HOME=$SCR/fakehome`) so no `~/.npmrc` or `~/.commercetools` credentials
help the build. This approximates what a stranger does after J; the real anonymous clone (HTTPS, no auth) is repeated in J.

## Risks / Trade-offs

- [History destroyed by mistake] -> bundle + tarball verified before `rm -rf .git` (tasks 2.x); keep them until after J.
- [Forget to recreate exclude/remote] -> task 3.x verification commands; gate refuses a dirty tree, which would reveal missing exclude.
- [Gate green on commit A, then amend changes SHA] -> always re-run after any amend; record the SHA.
- [Private e-mails published permanently] -> owner accepted (Q3/QI1, 2026-10-08); trailers can still be changed until the push (amend).
- [Clean clone build fails for missing env] -> D-facts: pass dummy variables, document them in README (feedback to G/E).
- [Another Claude session edits the repo during reset] -> check `git status`/`ls -lt` first, announce.

## Migration Plan

Forward: tasks 1-9. Rollback before push: `rm -rf .git && git clone $BUNDLE tmp && mv tmp/.git .` (restores the old repo) - the working tree stays as is.
After push: do not rollback by force-push; follow change J (squash/amend + re-push is OK only while the repo is still private; once public, see J rollback).

## Open Questions

QI1 (answered: real e-mails), QI2 (confirm commit message wording incl. "internal repository" and date range), QI3 (keep the backup bundle where). Defaults above.

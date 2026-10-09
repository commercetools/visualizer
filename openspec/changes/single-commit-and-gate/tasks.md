Conventions: repo root = `<repo-root>`. `SK`, `SCR`, `SRC` as in design Context. Commands are single `zsh` lines unless stated. **Nothing in this change touches the network except step 1.3 (read-only).** Do NOT push.

## 1. Preconditions

- [ ] 1.1 H is done: `grep -c '\- \[ \]' openspec/changes/labs-compliance/tasks.md` prints `0`. Run `git status --short` - expected only `?? .claude/`, `?? openspec/`, `?? plans/` (openspec/ will be COMMITTED, the other two stay local - owner decision 2026-10-08), plus modified/new files (old repo still has its first commit, so new files show as `??`, README as ` M`).
- [ ] 1.2 No other session is working here: `ls -lt | head` and `find . -path ./node_modules -prune -o -type f -mmin -5 -print | grep -v '^./\(plans\|.claude\)/' | head` - nothing changed in the last 5 minutes except by you. If something did, ask the owner.
- [ ] 1.3 (read-only network, no approval needed) See what is on the remote, to know what J will face: `git fetch origin 2>&1 | tail -3; git ls-remote origin 2>&1 | head`. Possible results: (a) `ERROR: Repository not found` -> repo does not exist yet; (b) one line `<sha> refs/heads/main` -> it exists; if the SHA starts with `27b866d` it only has the old first commit; (c) other branches/commits -> write down and tell the owner (new risk for J). If SSH auth fails, note it and continue (J handles it).
- [ ] 1.4 Tools: `node -v` (>= 18), `git --version`, `ls $SK/scripts/gate.mjs`.

## 2. Backup (must be completed and verified before step 3)

- [ ] 2.1 Choose a durable folder outside the repo: `BK=$BK; mkdir -p $BK` (QI3). Expected: `ls -d $BK` works. Pitfall: do not use the scratchpad for this one, it is session-temporary.
- [ ] 2.2 Bundle: `git bundle create $BK/visualizer-pre-reset-$(date +%Y%m%d).bundle --all`. Expected: `Counting objects ... ` and file created. Verify: `git bundle verify $BK/visualizer-pre-reset-*.bundle` prints `... is okay`.
- [ ] 2.3 Working tree snapshot: `tar czf $BK/visualizer-worktree-$(date +%Y%m%d-%H%M).tgz --exclude=node_modules --exclude=./visualizer/public -C <home> visualizer`. Verify: `tar tzf $BK/visualizer-worktree-*.tgz | grep -c .` > 300 and it contains `visualizer/plans/00-master-plan.md`, `visualizer/visualizer/package.json`.
- [ ] 2.4 Save things that live inside `.git`: `cp .git/info/exclude $SCR/old-exclude.txt; git remote -v > $SCR/old-remote.txt; git config --local --list > $SCR/old-config.txt; cat $SCR/old-remote.txt`. Expected: remote `origin git@github.com:commercetools/visualizer.git` (fetch+push).
- [ ] 2.5 Compute the contributor list fresh from the source and compare with design D5 (if different, STOP and update D5 + AUTHORS.md first):
  `git -C $SRC shortlog -sne HEAD` ; `git -C $SRC log --format=%B HEAD | grep -i '^co-authored-by' | sort | uniq -c`.
  Expected: 230+1 Philipp, 10+1 Behnam, 2 mssirvi, 1 Chris Boyke; trailers Sonnet 5 (49), Sonnet 5.5 (11), Opus 4.8 (1), Manish (2). (If the source got new commits the numbers differ - fine, but new names need new trailers.)

## 3. Reset the repository

- [ ] 3.1 Write the commit message file now (needs no repo): create `$SCR/commit-msg.txt` from design D6. Verify the date range as D6 says. Verify trailer syntax: `git interpret-trailers --parse < $SCR/commit-msg.txt` prints exactly the 9 `Co-authored-by` lines of design D5 (real e-mails exactly as in history; compare with `git -C $SRC log --format='%(trailers:key=Co-authored-by,valueonly,separator=%x0a)' | sort -u` and the author/e-mail list `git -C $SRC log --format='%an <%ae>' | sort -u`).
- [ ] 3.2 Remove history: `rm -rf .git` then `git init -b main`. Expected: `Initialized empty Git repository in .../visualizer/.git/`. Pitfall: you must be in the repo root (`pwd` ends with `/commercetools-labs/visualizer`) - NOT in `visualizer/visualizer` (that has no `.git`, harmless) - and NOT in the parent. Double check with `pwd` in the same command: `pwd && rm -rf .git && git init -b main`.
- [ ] 3.3 Restore remote: `git remote add origin git@github.com:commercetools/visualizer.git; git remote -v` (compare with `$SCR/old-remote.txt`). Do not fetch/push.
- [ ] 3.4 Restore exclusions: `printf '/plans/\n/.claude/\n/.serena/\n' >> .git/info/exclude; cat .git/info/exclude`. `/openspec/` is deliberately NOT excluded (published; D2). Verify: `git status --short` no longer lists `plans/` and `.claude/` but still lists `?? openspec/` (to be added in 5.1); `.specify/` is simply not copied (it is not in this repo).
- [ ] 3.5 Identity (local to this repo): `git config user.name "Behnam Tehrani"; git config user.email "15884572+behnamt@users.noreply.github.com"` (default of D4; change per QI1). Verify `git config user.email`. Also `git config commit.gpgsign` - if `true` and no key is available, commit fails: then `git config commit.gpgsign false` locally.

## 4. Review what will be committed

- [ ] 4.1 Check stray files: `find . \( -name node_modules -o -name .git \) -prune -o -name .DS_Store -print` - if any, delete them (`find ... -delete`) or make sure `.gitignore` covers them.
- [ ] 4.2 Save the dry run: `git add --dry-run . > $SCR/add-dry-run.txt; wc -l $SCR/add-dry-run.txt`. Expected: roughly 400-480 lines of `add '<path>'` (source: 334 tracked files minus dropped dirs, plus new views, specs 007/008, 2 new screenshots, 4 new root docs).
- [ ] 4.3 Checklist - each command must print nothing (`NOTHING`) unless stated:
  - Unwanted: `grep -E "node_modules|visualizer/public/|/build/|\.env'|\.env\.local|auth-state|\.claude/|plans/|\.github/|\.specify|\.serena|netlify|\.DS_Store|\.pem|\.key|\.npmrc|\.bundle|\.tgz" $SCR/add-dry-run.txt` -> NOTHING (`.env.example` is allowed: check the grep pattern `\.env'` only matches a file ending exactly in `.env`).
  - Must be present (each prints 1 line): `for f in LICENSE SUPPORT.md CONTRIBUTING.md AUTHORS.md README.md FEATURES.md CLAUDE.md connect.yaml visualizer/package.json visualizer/package-lock.json visualizer/custom-application-config.mjs visualizer/.env.example visualizer/schemas/ctp.json visualizer/src/types/generated/ctp.ts .gitignore; do grep -c "add '$f'" $SCR/add-dry-run.txt | sed "s|^|$f: |"; done` -> every line ends with `: 1`.
  - Specs: `grep -c "add 'specs/00[78]" $SCR/add-dry-run.txt` -> >= 6.
  - Docs images: `grep -c "visualizer/docs/" $SCR/add-dry-run.txt` -> 16.
  - Big files are expected (`ctp.json` ~ 10 MB, lockfiles). `git add` warnings about CRLF/LF are fine.
  - Look at the whole list once by eye: `less $SCR/add-dry-run.txt` (or `cut -d/ -f1-3 | sort | uniq -c`).
- [ ] 4.4 Content spot-checks on the working tree (the gate will do it again, but earlier = cheaper): `grep -rIl "<internal-org>" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=plans --exclude-dir=.claude | head` -> NOTHING; `grep -rIn "<internal-sandbox>" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=plans --exclude-dir=.claude | head` -> NOTHING. `openspec/` is now INCLUDED in these scans: the scrub of its content is change H task 2b; any hit left there is fixed before committing (it would FAIL the gate).

## 5. Create the one commit

- [ ] 5.1 Stage: `git add .` (see design D3 for why this is acceptable here). Then `git diff --cached --name-only | sort > $SCR/staged.txt; sed "s/^add '//; s/'$//" $SCR/add-dry-run.txt | sort | diff - $SCR/staged.txt && echo SAME`. Expected: `SAME`.
- [ ] 5.2 Commit: `git commit -F $SCR/commit-msg.txt`. Expected: `[main (root-commit) <sha>] Initial public release of the commercetools Visualizer` and a files-changed summary.
- [ ] 5.3 Verify the commit:
  - `git rev-list --count HEAD` -> `1`
  - `git branch -a` -> only `* main`; `git tag` -> nothing
  - `git log -1 --format='%an <%ae>'` -> `Behnam Tehrani <...>` per D4
  - `git log -1 --format='%(trailers:key=Co-authored-by,valueonly)'` -> 9 lines equal to D5 (exact names and e-mails)
  - Every source-history name is credited: run `git -C $SRC log --format=%an HEAD | sort -u` (expect Behnam Tehrani, Chris Boyke, Philipp Hofmann, mssirvi) and check by eye that each appears in `git log -1 --format=%B` (trailers) or as the commit author, and in `AUTHORS.md`.
  - `git status --porcelain` -> NOTHING (clean). If it lists `?? plans/` etc., step 3.4 was missed.
  - `git remote -v` still shows origin; `git ls-files | grep -E '^(plans|\.claude|\.serena|\.specify)/'` -> NOTHING and `git ls-files openspec | head -3` shows tracked files (`openspec/config.yaml`, `openspec/changes/...`).

## 6. Run the gate

- [ ] 6.1 Run `node $SK/scripts/gate.mjs --repo . | tee $SCR/gate-run1.txt` and then read the exit code with `echo "exit=${pipestatus[1]}"` (zsh syntax; in bash it is `${PIPESTATUS[0]}`). Simpler: run it once without `tee` and look at `echo $?`. Expected header:
  ```
  gate - .
    commit  <sha8>  Initial public release of the commercetools Visualizer
    history 1 commit(s)
    files   ~440
  ...
    0 failure(s), N warning(s)
  ```
  Exit codes: 0 clear, 1 findings, 2 refused (dirty tree/usage). On exit 2: `git status --porcelain`, fix exclusion/untracked files, retry.
- [ ] 6.2 For each FAIL: read `path:line`, `match`, context. Typical causes here: missing SPDX (a new file added after H -> run `node $SK/scripts/ossify.mjs --repo . --apply --year 2026`), forbidden file (`.env` slipped in), package name, a customer/infra name in a new doc, a hex string looking like a secret. Fix the file, then `git add <file(s)> && git commit --amend --no-edit` (ONE commit stays; never create a second). Re-run 6.1.
- [ ] 6.3 For each WARN: classify real/harmless (design D7). Fix real ones + amend. Write one line per harmless one in the task notes (file:line - why fine). Then `node $SK/scripts/gate.mjs --repo . --ack`. Expected last line `CLEAR (warnings acknowledged).` and exit 0. (With zero warnings, no `--ack` needed and the last line is `CLEAR.`)
- [ ] 6.4 Record the gate SHA: `git rev-parse --short=8 HEAD` equals the `commit <sha8>` in the final gate output. Remember: ANY later amend invalidates this - J re-runs the gate right before the push.

## 7. Check the final tree equals the verified tree

- [ ] 7.1 `git status --porcelain` -> NOTHING; `git rev-list --count HEAD` -> `1`; `git ls-files | wc -l` (note the number); `git count-objects -vH` (size sanity: expect < 30 MB).

## 8. Clean-clone proof (scratchpad)

- [ ] 8.1 `rm -rf $SCR/clone-proof $SCR/fakehome; mkdir -p $SCR/fakehome; git clone file://$(pwd) $SCR/clone-proof`. Expected: `Cloning into ...` and `ls $SCR/clone-proof` shows `LICENSE README.md connect.yaml visualizer ...` and `openspec` (published) and NO `plans`, `.claude`, `.serena`, `.specify`, `.git`-excluded things.
- [ ] 8.2 Install: `cd $SCR/clone-proof/visualizer && env HOME=$SCR/fakehome npm ci`. Expected: `added ~2900 packages`, `postinstall` runs `chakra typegen` without error. Takes 1-3 min. Pitfall: run from `visualizer/visualizer` (the app folder), not the clone root.
- [ ] 8.3 `env HOME=$SCR/fakehome npm run typecheck && env HOME=$SCR/fakehome npm run lint && env HOME=$SCR/fakehome npm test` - all exit 0. (Tests do not need env vars. If a test needs one, document it - feedback to G.)
- [ ] 8.4 Build with the documented dummy environment (the build needs them, design Context): `env HOME=$SCR/fakehome ENTRY_POINT_URI_PATH=visualizer CLOUD_IDENTIFIER=gcp-eu CUSTOM_APPLICATION_ID=TODO APPLICATION_URL=https://example.com INITIAL_PROJECT_KEY=todo npm run build`. Expected: webpack/mc-scripts success and `public/` created inside the clone. If it fails on a missing variable, add that variable to the command, and report to the owner/G that README must list it (do not fix in the repo now unless you amend + re-run gate).
- [ ] 8.5 Confirm the clone is still clean of generated junk in git terms: `git -C $SCR/clone-proof status --porcelain` -> NOTHING (node_modules/public are ignored).
- [ ] 8.6 Count in the clone: `git -C $SCR/clone-proof rev-list --count HEAD` -> `1`.

## 9. Wrap up

- [ ] 9.1 Do NOT delete `$BK` backups until J is finished and the repo is public and verified.
- [ ] 9.2 Write into the task notes: commit SHA, gate result, warnings acknowledged and why, clone-proof results, trailer list, and the remote state found in 1.3. J reads this.
- [ ] 9.3 `openspec validate single-commit-and-gate`; tick all tasks. Stop. **Do not run `git push`.**

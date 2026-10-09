## How to use this file

- Work top to bottom. Tick a box (`- [x]`) only after its **Verify** step printed the **Expected** output.
- **Terminal rule**: every new terminal starts with section 0's two `export` lines. Variables are
  lost when a terminal closes.
- **Where to run**: "repo root" = `<repo-root>` (called `$DST`);
  "app folder" = `$DST/visualizer` (the nested folder that holds `package.json`).
- **Never**: edit anything in the source repo, run `git commit`, run `git add` for real, use
  `rsync --delete`, run `npm install` (use `npm ci`), run `npm audit fix`, or run
  `npm run generate-types:ctp` (needs an interactive browser login).
- If a command prints something different from "Expected", **stop** and read the Pitfalls line
  of that task before improvising. If still stuck, record the output as an open question
  style notes and ask.

## 0. Setup (each terminal)

- [x] 0.1 Define the two path variables
  - **Do**:
    ```bash
    export SRC=$SRC          # read-only source
    export DST=<repo-root>     # target (this repo)
    ```
  - **Why**: every later command uses `$SRC`/`$DST`, so a typo can only happen once.
  - **Verify**: `ls "$SRC/connect.yaml" "$DST/openspec/config.yaml"`
  - **Expected**: both paths are printed, no `No such file`.

- [x] 0.2 Check tool versions
  - **Do**: `node -v && npm -v && rsync --version | head -1 && git --version`
  - **Expected**: Node `v22.x.y` (the app's `.nvmrc` says `22`), npm `10.x`, an rsync line
    (`openrsync: protocol version 29` on macOS is fine), a git version.
  - **Why**: dependencies and the build are only tested on Node 22.
  - **Pitfalls**: if Node is not 22, run `nvm install 22 && nvm use 22` (or `fnm use 22`) and repeat.
  - **Verify**: the versions above are printed.

## 1. Pre-flight checks

- [x] 1.1 Confirm the source repo is clean and note its commit
  - **Do**: `git -C "$SRC" status --porcelain; git -C "$SRC" rev-parse --short HEAD; git -C "$SRC" branch --show-current`
  - **Expected**: **no** status lines (clean; ignored files such as `node_modules` are not shown), then a short SHA and the branch name. Write the SHA into the Baseline table (section 9).
  - **Why**: we want to be able to say "this baseline is source commit `<sha>`". Uncommitted edits in the source would silently be copied.
  - **Pitfalls**: if status lists files, stop and tell the owner; do not commit or stash in the source.

- [x] 1.2 Confirm the target is in the expected "empty" state
  - **Do**: `git -C "$DST" status --short; git -C "$DST" log --oneline; ls -a "$DST"`
  - **Expected**: status shows only `?? .claude/`, `?? openspec/`, `?? plans/`; log shows one line `27b866d first commit`; the folder lists `.git .claude README.md openspec plans`.
  - **Why**: proves nothing was copied yet and we know what we must not overwrite.
  - **Verify**: matches the expected lines.

- [x] 1.3 Hide local-only folders from git (local file, never pushed)
  - **Do**:
    ```bash
    cat >> "$DST/.git/info/exclude" <<'EOF'
    # local-only (migration planning, tooling) - never commit
    /.claude/
    /openspec/
    /plans/
    /.serena/
    /.specify/
    /.vscode/
    /.idea/
    /visualizer/.env.local
    EOF
    ```
  - **Why**: change I will do `git add .` for the single commit. Without this the planning folders (and later any tool caches) could be committed publicly. `.git/info/exclude` works like `.gitignore` but is private to this clone.
  - **Pitfalls**: run it **once** (re-running appends duplicates; harmless but untidy). Do not put these lines in `.gitignore`.
  - **Verify**: `git -C "$DST" status --short`
  - **Expected**: **no output at all** (the three untracked folders are now hidden). `git -C "$DST" check-ignore -v plans/00-master-plan.md` prints a line mentioning `.git/info/exclude`.

## 2. Copy the source tree

- [x] 2.1 Define the exclude list once
  - **Do** (copy-paste whole block; works in bash and zsh):
    ```bash
    EXCL=(
      --exclude='/.git'            --exclude='/.github'        --exclude='/.serena'
      --exclude='/.specify'        --exclude='/.claude'        --exclude='/.vscode'
      --exclude='/.idea'           --exclude='/netlify.toml'   --exclude='/node_modules'
      --exclude='/visualizer/node_modules' --exclude='/visualizer/public'
      --exclude='/visualizer/.env.local'
      --exclude='/visualizer/scripts/screenshots/node_modules'
      --exclude='/visualizer/scripts/screenshots/auth-state.json'
      --exclude='google*.html'     --exclude='coverage'        --exclude='.DS_Store'
      --exclude='yarn.lock'        --exclude='pnpm-lock.yaml'
    )
    ```
  - **Why**: one named list is reused by the dry run and the real run, so they cannot differ. The reason for each entry is in `design.md` D2. A leading `/` means "only at the top of the tree".
  - **Verify**: `echo "${#EXCL[@]}"`
  - **Expected**: `19`.
  - **Pitfalls**: in a new terminal the array is gone; re-run this block (and 0.1) before 2.2/2.3.

- [x] 2.2 Dry run (nothing is written)
  - **Do**: `rsync -an --itemize-changes "${EXCL[@]}" "$SRC/" "$DST/" | grep -c '^>f'`
  - **Expected**: `302` (number of files that would be transferred). Also run
    `rsync -an --itemize-changes "${EXCL[@]}" "$SRC/" "$DST/" | grep -E '^>f' | grep -v '^>f+++'` -> exactly one line: `>f.st..g. README.md` (the only file that already exists and will be overwritten).
  - **Why**: `-n` = "no changes, just show". Catches a wrong path or a missing slash before any damage.
  - **Pitfalls**: if the count is far above 302 (e.g. thousands), an exclude was not applied (typo or you started a new terminal and `EXCL` is empty). If paths start with `SRC/...` you forgot the trailing `/` after `$SRC`.

- [x] 2.3 Real copy
  - **Do**: `rsync -a "${EXCL[@]}" "$SRC/" "$DST/"`
  - **Expected**: no output, exit code 0 (`echo $?` prints `0`).
  - **Why**: `-a` = archive mode: copies recursively and keeps permissions/timestamps. No `--delete`, so `.claude/`, `openspec/`, `plans/` survive.
  - **Pitfalls**: do not "fix" anything inside the copy yet; the verification in 3 compares it byte for byte to the source.
  - **Verify**: `ls -a "$DST"`
  - **Expected**: lists `.claude .git .gitignore CLAUDE.md FEATURES.md README.md connect.yaml openspec plans specs visualizer`.

## 3. Verify the copy

- [x] 3.1 Same list of files as the source's tracked files (minus excluded)
  - **Do**:
    ```bash
    ( cd "$SRC" && git ls-files | grep -v -E '^(\.github/|\.serena/|\.specify/|\.claude/|\.vscode/|netlify\.toml$)' | sort ) > /tmp/a-src.txt
    ( cd "$DST" && find . -type f -not -path './.git/*' -not -path './.claude/*' -not -path './openspec/*' -not -path './plans/*' -not -path '*/node_modules/*' | sed 's|^\./||' | sort ) > /tmp/a-dst.txt
    diff /tmp/a-src.txt /tmp/a-dst.txt && echo LISTS-IDENTICAL; wc -l < /tmp/a-dst.txt
    ```
  - **Expected**: `LISTS-IDENTICAL` and `302` (no diff lines).
  - **Why**: `git ls-files` is the source's own idea of "the project files". Equality proves nothing is missing and no stray file (e.g. `.DS_Store`, `public/`) came along.
  - **Pitfalls**: if you already ran `npm ci` the `node_modules` path filter keeps it out of the list; `visualizer/public/` after a build would appear as extra lines - run this task **before** section 5.
  - **Note**: use the scratchpad directory instead of `/tmp` if your environment prefers it.

- [x] 3.2 Same content (SHA-256 of every file)
  - **Do**:
    ```bash
    ( cd "$SRC" && xargs shasum -a 256 < /tmp/a-src.txt ) > /tmp/h-src.txt
    ( cd "$DST" && xargs shasum -a 256 < /tmp/a-dst.txt ) > /tmp/h-dst.txt
    diff /tmp/h-src.txt /tmp/h-dst.txt && echo HASHES-IDENTICAL
    ```
  - **Expected**: `HASHES-IDENTICAL`.
  - **Why**: proves the copy did not alter any byte (line endings, permissions are irrelevant here). Re-run this check after 6.x to see that the **only** difference is `visualizer/eslint.config.js`.
  - **Pitfalls**: `xargs` breaks on file names with spaces; none exist today (`ls` shows none). If the diff shows `visualizer/eslint.config.js`, you ran the check after task 6.

- [x] 3.3 Negative check: excluded things are absent
  - **Do**:
    ```bash
    cd "$DST" && find . \( -name node_modules -o -name .DS_Store -o -name 'google*.html' -o -name coverage -o -name yarn.lock -o -name pnpm-lock.yaml -o -name auth-state.json -o -name .env.local \) -not -path './.git/*' -not -path './.claude/*' -prune -print
    ls -d .github .serena .specify netlify.toml visualizer/public 2>&1 | sed 's/^/  /'
    ```
  - **Expected**: the `find` prints nothing; the `ls` prints five `No such file or directory` lines.
  - **Why**: R4 (no workflows), privacy (no sessions/caches), and "build output is never source".

- [x] 3.4 Layout check (Connect rule)
  - **Do**: `ls "$DST/connect.yaml" "$DST/visualizer/package.json" "$DST/visualizer/custom-application-config.mjs" "$DST/visualizer/.nvmrc" && cat "$DST/visualizer/.nvmrc"`
  - **Expected**: four paths listed, then `22`.
  - **Why**: Connect finds the app through the folder named like `deployAs[].name` (`visualizer`) next to `connect.yaml`.

- [x] 3.5 Source untouched and nothing committed
  - **Do**: `git -C "$SRC" status --porcelain | wc -l; git -C "$DST" rev-list --count HEAD; git -C "$DST" log --oneline; git -C "$DST" status --short`
  - **Expected**: `0`, `1`, `27b866d first commit`, then exactly these lines (README is "modified" because the placeholder was replaced):
    ```
     M README.md
    ?? .gitignore
    ?? CLAUDE.md
    ?? FEATURES.md
    ?? connect.yaml
    ?? specs/
    ?? visualizer/
    ```
  - **Why**: the single-commit rule (R3) needs the working tree to carry all changes; the planning folders must be invisible (task 1.3).
  - **Pitfalls**: if `.claude/`, `openspec/` or `plans/` appear as `??`, redo 1.3.

- [x] 3.6 Dry-run staging check (nothing is staged)
  - **Do**: `git -C "$DST" add --dry-run . | grep -E "claude|openspec|plans|\.github|netlify|node_modules|visualizer/public" ; echo "exit=$?"`
  - **Expected**: no path lines, `exit=1` (grep found nothing). (`--dry-run` shows what *would* be added; it adds nothing.)
  - **Also record**: `git -C "$DST" add --dry-run . | wc -l` -> `302`. Note that `visualizer/.env` is in that list; change E removes it.

## 4. Install dependencies

- [x] 4.1 Install with `npm ci`
  - **Do**:
    ```bash
    cd "$DST/visualizer"
    shasum -a 256 package-lock.json > /tmp/lock-before.txt
    npm ci 2>&1 | tail -n 15
    ```
  - **Expected**: many `npm warn deprecated ...` lines (glob, eslint 9.39, uuid, ... are normal), ends with `added <about 2000> packages`, an "N vulnerabilities" notice and `Run npm audit for details.`. The `postinstall` script (`chakra typegen`) runs automatically. Exit code 0. Takes 1-3 minutes.
  - **Why**: `npm ci` installs exactly the locked versions, so the baseline is reproducible.
  - **Pitfalls**: use the **app folder**, not the repo root (no `package.json` at root -> `ENOENT`). If you see `EBADENGINE`/`Unsupported engine`, Node is not 22. If it asks about `npm install`, you ran the wrong command. Do not run `npm audit fix`.

- [x] 4.2 Lock file unchanged
  - **Do**: `cd "$DST/visualizer" && shasum -a 256 package-lock.json | diff - /tmp/lock-before.txt && echo LOCK-UNCHANGED`
  - **Expected**: `LOCK-UNCHANGED`.

- [x] 4.3 Confirm `node_modules` is ignored by git
  - **Do**: `git -C "$DST" status --short | grep -c node_modules; git -C "$DST" check-ignore -v visualizer/node_modules`
  - **Expected**: `0`, then a line `.gitignore:1:node_modules visualizer/node_modules`.

## 5. Baseline checks (run from the app folder `$DST/visualizer`)

- [x] 5.1 Typecheck
  - **Do**: `cd "$DST/visualizer" && npm run typecheck; echo "exit=$?"`
  - **Expected**: banner `> tsc --noEmit` then `exit=0` and **no** `error TS...` lines (about 20-60 s).
  - **Why**: `tsc --noEmit` type-checks all `src/` without writing files.
  - **Pitfalls**: `Cannot find type definition file for 'graphql-ctp'` = a stray empty folder under `@types-extensions` (see `CLAUDE.md`); none exists in this copy.

- [x] 5.2 Unit tests
  - **Do**: `cd "$DST/visualizer" && CI=true npm test 2>&1 | tail -n 8; echo "exit=${PIPESTATUS[0]}"`
  - **Expected**: `Test Suites: 50 passed, 50 total`, `Tests:       846 passed, 846 total`, `Snapshots:   0 total`, about 80 s, `exit=0`. (Use `echo "exit=${pipestatus[1]}"` in zsh.)
  - **Why**: proves the copied tests run against the copied code on this machine.
  - **Pitfalls**: `CI=true` stops Jest from entering interactive watch mode. Occasional `console.error` lines inside test output are normal; judge by the summary. If the counts differ from 50/846, record the real numbers - do not "fix" tests in this change.

- [x] 5.3 Lint - first, observe the pre-existing failure (do not skip, it teaches why 6 exists)
  - **Do**: `cd "$DST/visualizer" && npm run lint 2>&1 | tail -n 6; echo "exit=${PIPESTATUS[0]}"`
  - **Expected**: summary `14 warnings` and `13 errors`, `exit=1`. The errors are in `scripts/screenshots/capture.mjs` and `scripts/screenshots/login.mjs` (`prettier/prettier` formatting). Record these numbers.
  - **Why**: the original CI never ran lint, so this was never noticed. It is not caused by the copy.

- [x] 5.4 Build without environment variables (observe the failure)
  - **Do**: `cd "$DST/visualizer" && env -u CLOUD_IDENTIFIER -u CUSTOM_APPLICATION_ID -u APPLICATION_URL -u INITIAL_PROJECT_KEY npm run build 2>&1 | grep -E "^Error|Compiled|Missing" ; echo "exit=${PIPESTATUS[0]}"`
  - **Expected**: `Error: Missing environment variable 'CLOUD_IDENTIFIER' specified in config as 'env:CLOUD_IDENTIFIER'.` and `exit=1`. (Webpack finishes first, the HTML compile step then fails.)
  - **Why**: `custom-application-config.mjs` uses `${env:...}` placeholders; Connect injects the values at deploy time, locally you must provide them. See design D5.

## 6. Make lint genuinely green (the only code edit in this change)

- [x] 6.1 Add the screenshot sub-project to the ESLint ignores
  - **File**: `visualizer/eslint.config.js`, the first object of the exported array.
  - **Do**: change the line
    `ignores: ['public/**', 'src/types/generated/**', 'schemas/**'],`
    to
    `ignores: ['public/**', 'src/types/generated/**', 'schemas/**', 'scripts/screenshots/**'],`
    then format the file: `cd "$DST/visualizer" && npx prettier --write eslint.config.js`
    (prettier will wrap the array onto several lines - that is expected and required, otherwise lint reports a `prettier/prettier` error on this very file).
  - **Why**: `scripts/screenshots` is a separate project (own `package.json`, own dependency `playwright` that the root `npm ci` does not install), so linting it from the root can never pass (design D4).
  - **Pitfalls**: do not run prettier on the `.mjs` screenshot files (that only fixes 13 of 15 problems and changes files we want unchanged). Do not touch `package.json`.
  - **Verify**: `cd "$DST/visualizer" && npm run lint 2>&1 | tail -n 4; echo "exit=${PIPESTATUS[0]}"`
  - **Expected**: summary `14 warnings` and **no** `error` count line, `exit=0`.
  - **Also**: `git -C "$DST" diff --no-index --stat "$SRC/visualizer/eslint.config.js" "$DST/visualizer/eslint.config.js"` -> only this file differs, 1 file changed (about 6 insertions, 1 deletion).

- [x] 6.2 Re-run the hash comparison to prove nothing else changed
  - **Do**: repeat task 3.2.
  - **Expected**: the diff shows **only** the `visualizer/eslint.config.js` line (two lines: one `<`, one `>`). Any other file -> investigate.

## 7. Build with the documented environment variables

- [x] 7.1 Production build
  - **Do**:
    ```bash
    cd "$DST/visualizer"
    CLOUD_IDENTIFIER=gcp-eu CUSTOM_APPLICATION_ID=TODO APPLICATION_URL=https://example.com INITIAL_PROJECT_KEY=todo \
      npm run build > /tmp/a-build.log 2>&1; echo "exit=$?"; tail -n 4 /tmp/a-build.log
    ```
  - **Expected**: `exit=0`; the log ends with `Compiling index.html...` and `Compiled successfully.`. A harmless line `Filtering out chunk "commercetools-uikit-icons" because its configured dependencies does not exist` appears earlier. (`ENTRY_POINT_URI_PATH` is read from `visualizer/.env`, so it is not exported here.)
  - **Why**: the build is what Connect runs. Dummy values are fine; they are only substituted into `public/index.html`.
  - **Pitfalls**: values with spaces need quotes. `public/` will contain `google*.html` after the build - it is generated output, ignored by git, ignore it.

- [x] 7.2 Build output is ignored by git and looks sane
  - **Do**: `cd "$DST/visualizer" && ls public | wc -l; ls public/index.html public/index.html.template; git -C "$DST" status --short | grep -c public`
  - **Expected**: a number around `188-190`, both files listed, then `0` (git does not see `public/`).
  - **Why**: confirms `public/` can never slip into the single commit.

## 8. Final state check

- [x] 8.1 Git state is still "no commit, nothing staged"
  - **Do**: `git -C "$DST" rev-list --count HEAD; git -C "$DST" diff --cached --stat | wc -l; git -C "$DST" status --short`
  - **Expected**: `1`, `0`, then the same list as task 3.5 (` M README.md`, `?? .gitignore`, `?? CLAUDE.md`, `?? FEATURES.md`, `?? connect.yaml`, `?? specs/`, `?? visualizer/`).
  - **Why**: this change must leave the work in the working tree for the later changes and the final single commit.

- [x] 8.2 Delete temp files
  - **Do**: `rm -f /tmp/a-src.txt /tmp/a-dst.txt /tmp/h-src.txt /tmp/h-dst.txt /tmp/lock-before.txt /tmp/a-build.log`
  - **Expected**: no output.

## Apply-time notes (worktree run)

- Task 1.3 skipped on purpose: `.git/info/exclude` was already configured. Tasks 1.2/3.5/8.1 expectations differ: this is a git worktree on a feature branch (develop has `openspec/` committed, 2 commits, no `.claude/` or `plans/` in the tree). In 3.1/3.2 the only extra entry is the worktree's `.git` pointer file. Temp files were kept in the scratchpad.
- QA1: `scripts/screenshots/**` added to the ESLint ignores (prettier-wrapped).

## 9. Record the baseline (fill the table, then tick)

- [x] 9.1 Fill the "Measured" column from your own runs and keep the table in this file

| Item | Planning-time observation (scratch copy) | Measured at apply time |
|---|---|---|
| Source commit (task 1.1) | n/a (planning-time: source working tree was clean) | b18c1b9 (branch main, clean) ||
| Node / npm | v22.21.1 / 10.9.4 | v22.21.1 / 10.9.4 ||
| Files copied | 302 | 302 (lists identical; hashes identical except eslint.config.js) ||
| `npm ci` | exit 0, lock unchanged | exit 0, lock unchanged ||
| `typecheck` | exit 0, 0 errors | exit 0, 0 errors ||
| `test` | 50 suites, 846 tests, all pass, about 80 s | 50 suites, 846 tests, all pass, 53 s ||
| `lint` before fix | 13 errors, 14 warnings (all errors in `scripts/screenshots/*.mjs`) | 13 errors, 14 warnings, exit 1 ||
| `lint` after fix | 0 errors, 14 warnings | 0 errors, 14 warnings, exit 0 ||
| `build` without env | fails: Missing environment variable 'CLOUD_IDENTIFIER' | fails: Missing environment variable 'CLOUD_IDENTIFIER', exit 1 ||
| `build` with env | exit 0, 188-190 files in `public/` | exit 0, Compiled successfully, 190 files in `public/` ||

  - **Why**: later changes (B, C, D) add code; if a number gets worse we know exactly which change did it. Keep the 14 lint warnings as the reference; new code must not add warnings.

- [x] 9.2 Hand-over notes for later changes (copy into the matching change's tasks if not present)
  - E (`connect-alignment`): `visualizer/.env` is tracked and must become `.env.example`; build fails when `INITIAL_PROJECT_KEY` is undefined **even in production mode** (placeholder in the config's `development` section), so removing it from `connect.yaml` also requires a config-file change; `APPLICATION_URL` must be injected by Connect.
  - G (`docs-and-screenshots`): `CLAUDE.md` (lines about `netlify.toml`, `.github/workflows/ci.yml`) and `FEATURES.md` (netlify and CI paragraphs) describe files we removed.
  - H (`labs-compliance`): three `specs/*/data-model.md` contain `<internal-org>`; screenshot scripts default to the project key `<project-key>`; `visualizer/scripts/screenshots` has its own `package.json` + lock file (SPDX/ossify must treat it as part of the repo; its lint is now ignored); gate rejects any tracked `.env`.
  - F (`e2e-verification`): `scripts/screenshots/auth-state.json` is the Playwright login session file; it is git-ignored in that folder and must stay uncommitted.
  - **Verify**: the table has no empty cell in the last column.

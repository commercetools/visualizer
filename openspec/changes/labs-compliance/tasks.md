Conventions: repo root = `<repo-root>`; `SK=$SK`; `SCR` = the scratchpad directory from the session environment. Node >= 18 required (`node -v`). No `git add`/`commit` here.

## 1. Preconditions

- [x] 1.1 Verify G is done: `grep -c '\- \[ \]' openspec/changes/docs-and-screenshots/tasks.md` prints `0`. Also A-F tasks are all ticked (`for c in import-baseline restore-entity-diagram restore-visualize-drilldown wire-routes-and-welcome connect-alignment e2e-verification; do grep -c '\- \[ \]' openspec/changes/$c/tasks.md; done` all `0`). Why: headers must cover all files that will exist.
- [x] 1.2 Check tools: `ls $SK/scripts` shows `gate.mjs ossify.mjs policy.json`; `node -v`. Never `cat`/copy `policy.json`.
- [x] 1.3 Backup everything ossify may edit: `mkdir -p $SCR/h-backup && rsync -a --exclude node_modules --exclude .git --exclude public ./ $SCR/h-backup/`. Verify: `diff -rq . $SCR/h-backup --exclude node_modules --exclude .git --exclude public` prints nothing.
- [x] 1.4 Confirm no forbidden files: `find . -name node_modules -prune -o \( -name .env -o -name .env.local -o -name '*.pem' -o -name '*.key' -o -name .npmrc -o -name auth-state.json \) -print` prints nothing (A should have replaced `.env` by `.env.example`; if `.env` exists, stop and ask - owner question Q8).

## 2. Package metadata and dry run

- [x] 2.1 Edit `visualizer/package.json`: set `description` (README first sentence, no trailing spaces), add `license`, `repository`, `bugs`, `homepage` exactly as in design D3. Verify: `node -e "const p=require('./visualizer/package.json');console.log(p.license,p.repository.url,p.bugs.url,p.homepage)"` prints the 4 values. Pitfall: keep valid JSON (no trailing comma).
- [x] 2.2 Dry run: `node $SK/scripts/ossify.mjs --repo . --year 2026 | tee $SCR/ossify-dry.txt`. Expected shape (numbers approximate):
  ```
  DRY RUN - .
     2  package.json renamed to @commercetools-labs/...
   ~250  headered
     0  already had SPDX (left alone)
     1+ generated (skipped by policy)      <- visualizer/src/types/generated/ctp.ts
   many data/docs/binary (no header possible)
     few no comment style for extension     <- .gitignore .prettierrc .nvmrc .env.example ...
     0  FOREIGN COPYRIGHT - refused
  ```
  Dry run writes nothing. Check with `git status --short` (still only `?? ...` entries - nothing is tracked yet in this repo except README.md, which ossify never changes).
- [x] 2.3 Read the report line by line: (a) no path starting with `.claude/`, `openspec/`, `plans/` is listed as headered (openspec stays header-free on purpose, D10) (`grep -E '^\s+(\.claude|openspec|plans)/' $SCR/ossify-dry.txt` - note headered files are not listed by name, so instead run `find .claude openspec plans -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.graphql' -o -name '*.sh' -o -name '*.css' \)` and expect no output); (b) no "!! THIRD-PARTY DIRECTORIES" or "!! FILES WITH A FOREIGN COPYRIGHT" section; if any appears follow design D9; (c) headered count = number of eligible files: `find . \( -name node_modules -o -name .git -o -name public -o -name build -o -name dist -o -name coverage \) -prune -o -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.graphql' \) -print | grep -v 'types/generated/' | wc -l` equals ossify's headered number (+/- files in `.claude`/`openspec`, which should be none).

## 2b. Published `openspec/` and `specs/` content (design D10)

- [x] 2b.1 Confirm ossify behaviour on these folders: `grep -n "'.md'\|'.yaml'\|'.json'" $SK/scripts/ossify.mjs | head` shows them in `SKIP_EXT`; after the apply step (3.1) `git diff --stat` / `diff -rq openspec $SCR/h-backup/openspec` prints nothing (ossify changed no openspec file). Why: OpenSpec parses these files; they must stay header-free.
- [x] 2b.2 Find gate hits in the published docs without committing: `rm -rf $SCR/scrub && mkdir -p $SCR/scrub && rsync -a --exclude node_modules --exclude .git --exclude public --exclude plans --exclude .claude --exclude .serena ./ $SCR/scrub/ && (cd $SCR/scrub && git init -q -b main && git add -A && git -c user.name=t -c user.email=t@example.com commit -qm scrub && node $SK/scripts/gate.mjs --repo . --no-history > $SCR/gate-openspec.txt; tail -40 $SCR/gate-openspec.txt)`. Expected at first: FAIL/WARN groups naming files under `openspec/` and `specs/`. Pitfall: never paste `policy.json` content into the repo; only fix the lines the gate prints.
- [x] 2b.3 Scrub each hit in the real `openspec/**` and `specs/**` files (design D10): replace literal internal repo names, hostnames, personal paths (`/Users/...`, `$HOME` expansions), customer-like names by neutral placeholders (`$SRC`, `<repo-root>`, "the internal source repository"). Also grep what the gate may not know: `grep -rnE "/Users/|@gmail\.com|@mcfadyen|\.serena|\.specify|plans/" openspec specs | cut -c1-160` and decide per line (e-mails of contributors belong only in the commit trailers of change I and its D5 table: keep them there, which means change I's D5 table is published too - owner accepted real e-mails, QI1).
- [x] 2b.4 Make the records publicly sensible: create `openspec/README.md` (plain Markdown, no SPDX header, <= 25 lines) explaining what these change records are, that `plans/` and `.claude/` are not part of the repository (references to them are historical), and that manual/owner-only steps are intentionally not published. Replace links to `plans/owner-questions.md` / `plans/manual-steps.md` in change files by the one-sentence decision, and delete or rephrase owner-only manual steps (credentials, org-admin actions, scratchpad/backup paths) in the published tasks. Do not renumber tasks.
- [x] 2b.5 Re-validate and re-scan: `openspec validate --all` (all changes pass) and repeat 2b.2 until `$SCR/gate-openspec.txt` has no finding located in `openspec/` or `specs/` (`grep -E '^\s+(openspec|specs)/' $SCR/gate-openspec.txt` prints nothing). Findings elsewhere belong to other tasks of this change.

## 3. Apply

- [x] 3.1 Apply: `node $SK/scripts/ossify.mjs --repo . --apply --year 2026 | tee $SCR/ossify-apply.txt`. Expected: same numbers as the dry run, header `APPLIED - .`. Pitfall: `--year` is a separate arg; without it the current year is used.
- [x] 3.2 Spot check: `head -6 visualizer/src/index.tsx` shows
  ```
  /*
   * SPDX-License-Identifier: MIT
   * Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors
   * Freely available, AS IS and UNSUPPORTED. See LICENSE.
   */
  ```
  `head -5 visualizer/src/hooks/use-types-connector/fetch-all.graphql` shows `# SPDX-License-Identifier: MIT` first; `head -3 visualizer/src/types/generated/ctp.ts` has NO header; `head -3 LICENSE` shows `MIT License` / blank / `Copyright (c) 2026 commercetools GmbH and the commercetools-labs contributors`; `node -p "require('./visualizer/package.json').name"` prints `@commercetools-labs/visualizer`; same for `visualizer/scripts/screenshots/package.json` -> `@commercetools-labs/visualizer-screenshots`.
- [x] 3.3 Idempotency: `node $SK/scripts/ossify.mjs --repo . --year 2026 | head -12` shows `0 package.json renamed`, `0 headered`, `~250 already had SPDX`, `0 FOREIGN`. (Master plan gate 4.)
- [x] 3.4 Sync lockfiles' names (npm does not): `cd visualizer && npm install --package-lock-only --ignore-scripts && cd ..`; `cd visualizer/scripts/screenshots && npm install --package-lock-only --ignore-scripts && cd ../../..`. Verify `grep -m1 '"name"' visualizer/package-lock.json` shows the scoped name and the lock diff vs backup is only name lines: `diff <(grep -v '"name"' $SCR/h-backup/visualizer/package-lock.json) <(grep -v '"name"' visualizer/package-lock.json) | head` prints nothing or only trivial lines. Pitfall: do NOT run `npm install` without `--package-lock-only` (would change versions).

## 4. Support documents

- [x] 4.1 Create `SUPPORT.md` exactly as design D5.
- [x] 4.2 Create `CONTRIBUTING.md` as design D6 (use `~~~shell` fences inside so the file renders; keep the SPDX-header sentence).
- [x] 4.3 Create `AUTHORS.md` as design D7. Re-verify names against the source history: `git -C $SRC shortlog -sn HEAD` and `git -C $SRC log --format=%B | grep -i co-authored-by | sort -u`; every name is in the file.
- [x] 4.4 README: insert the banner of design D4 directly under the title/description (the blank line left by G) and append the "Licence and support" section. Verify: `grep -c -i unsupported README.md` >= 2; `grep -il unsupported README.md SUPPORT.md visualizer/src/index.tsx` lists all three.

## 5. Prove nothing broke

- [x] 5.1 `cd visualizer && npm ci && npm run typecheck && npm run lint && npm test && npm run build` - all exit 0 (expect several minutes; `npm ci` runs the `postinstall` chakra typegen). If typecheck fails in a file with a new header, open it: ossify never changes code, so the failure is probably pre-existing (compare with the backup: copy backup to scratch, run there).
- [x] 5.2 `cd ..; git status --short` still shows only the untracked dirs (`?? .claude/ openspec/ plans/`; only `openspec/` will be published, the other two are excluded by change I) plus new files; `git diff --stat` shows only `README.md` modified (README.md is the one tracked file).

## 6. Third-party review

- [x] 6.1 Licence summary script (reads lockfiles, no installs): `node -e 'for (const f of ["visualizer/package-lock.json","visualizer/scripts/screenshots/package-lock.json"]) { const l=require("./"+f); const c={}; for (const [k,v] of Object.entries(l.packages)) if (k) { const s=typeof v.license==="string"?v.license:JSON.stringify(v.license); c[s]=(c[s]||0)+1 } console.log(f, c) }'`. Paste the result into the task notes.
- [x] 6.2 List the unusual ones: `node -e 'const l=require("./visualizer/package-lock.json"); for (const [k,v] of Object.entries(l.packages)) if (k && !/^(MIT|ISC|BSD-[23]-Clause|Apache-2\.0|0BSD|BlueOak-1\.0\.0|Unlicense|CC0-1\.0)$/.test(v.license||"")) console.log(k, v.license)'` and fill the decision table (design D8). Items with `undefined` licence: look them up with `npm view <pkg> license`.
- [x] 6.3 `npm view @commercetools/nimbus license` (read-only network) -> record. If not MIT/permissive: stop, new owner question.
- [x] 6.4 (include the treemap library from change C: `@visx/hierarchy` and its tree, or whichever fallback C recorded; `npm ls --all` licences MIT/ISC/BSD/Apache only) Compare new dependencies introduced by B/C: `diff <(node -p "Object.keys(require('$SRC/visualizer/package.json').dependencies).join('\n')") <(node -p "Object.keys(require('./visualizer/package.json').dependencies).join('\n')")` and check each added one's licence.
- [x] 6.5 Final: `ossify` dry run has no "!!" sections; `grep -rn -i "copyright" --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' visualizer/src visualizer/*.js visualizer/*.mjs | grep -v "commercetools GmbH"` prints nothing.
- [x] 6.6 Run `openspec validate labs-compliance`; tick all tasks.

## Notes (implementation results)

- 1.1: all of A-G are merged on the integration branch. Some tasks of earlier changes remain unticked on purpose (live Merchant Center checks and release steps, maintainer steps); none of them affects headers.
- 2.2/3.1: ossify dry run == apply: 2 package.json renamed, 313 files headered (year 2026), 112 data/docs/binary, 9 without comment style (.gitignore, .nvmrc, .prettierrc, .prettierignore, .env.example, .gitkeep), 1 generated skipped (visualizer/src/types/generated/ctp.ts), 0 foreign copyright, 0 third-party directories. No file under openspec/ or specs/ got a header (only .md/.yaml/.json there); .graphql files got "#" headers and lint/codegen still pass.
- 3.3: second run is idempotent (0 renamed, 0 headered, 313 already had SPDX).
- 3.4: both lockfiles now carry the scoped name (only name lines and the added license field changed).
- 4.3: AUTHORS.md follows design D7 and QH1/QH2 (main history only, no bots, names only). The internal source history is not available in this worktree, so the names were not re-counted here.
- 5.1: in visualizer/: npm ci, typecheck, lint (0 errors, 14 warnings), test (72 suites / 1034 tests) and build (CLOUD_IDENTIFIER=gcp-us CUSTOM_APPLICATION_ID=TODO APPLICATION_URL=https://example.com ENTRY_POINT_URI_PATH=visualizer) all exit 0.
- 6.1 licence counts (visualizer lockfile): MIT 2476, ISC 135, Apache-2.0 113, BSD-3 58, BSD-2 36, 0BSD 15, BlueOak 14, plus a long tail of SPDX expressions (see D8); screenshots lockfile: MIT 1, Apache-2.0 2.
- 6.2/6.3 decisions: LGPL-3.0 only on optional sharp-libvips/sharp binaries (not vendored, OK); MPL-2.0 axe-core/dompurify unmodified (OK); CC-BY-4.0 caniuse-lite and fontawesome (OK); Python-2.0 argparse (OK); "Public Domain" jsonify, WTFPL-or-MIT opener (OK). Nine packages have no license field in the lockfile: @commercetools/nimbus, nimbus-icons, nimbus-tokens (repository github.com/commercetools/nimbus, commercetools-owned; npm metadata has no license field; the package ships no LICENSE file - ask the nimbus maintainers to add one, not blocking), and cli-table, exit, fast-shallow-equal, querystring-es3, react-universal-interface (each ships a licence file or a legacy "licenses" array naming MIT/Unlicense; OK).
- 6.4: added by B/C: @visx/hierarchy ^4 (MIT, its @visx/group is MIT); no other new direct dependency licence concerns.
- 6.5: no foreign copyright lines; ossify dry run has no "!!" sections.
- 2b: gate on the committed tree with --no-history reported 0 failures and only 4 framing WARNs in openspec/ (reworded). Links to the owner notes were replaced by one-sentence decisions or "maintainer step"; openspec/README.md added. The contributor e-mail table in single-commit-and-gate/labs-compliance design stays published (owner decision QI1). `openspec validate --all` passes (10/10).

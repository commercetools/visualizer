Conventions: run commands from `<repo-root>` (the "repo root") unless a task says otherwise.
Do not run `git add`/`git commit` anywhere in this change.

## 1. Preconditions and backup

- [ ] 1.1 Confirm F is finished: `grep -c '\- \[ \]' openspec/changes/e2e-verification/tasks.md` prints `0`. Why: screenshots must come from a verified app. If not 0, stop.
- [x] 1.2 Confirm the code is in place: `ls visualizer/src/components` shows `entity-diagram` and `visualize-drilldown`; `grep -c "entity-diagram" visualizer/custom-application-config.mjs` prints >= 1; `ls connect.yaml` exists; `ls .github` fails ("No such file") - R4.
- [ ] 1.3 Backup the docs you are about to edit (the working tree is uncommitted, so git cannot restore them): `SCR=$SCR; mkdir -p $SCR/docs-backup && cp -R README.md FEATURES.md CLAUDE.md specs visualizer/docs visualizer/scripts/screenshots $SCR/docs-backup/` (exclude `node_modules` if present). Verify: `ls $SCR/docs-backup` shows the copied names.
- [x] 1.4 Collect facts (read, do not edit): `cat connect.yaml`; `sed -n 1,200p visualizer/custom-application-config.mjs`; `cat visualizer/.env.example`; `cat openspec/changes/e2e-verification/tasks.md` (regression notes -> Known issues); `ls openspec/changes/restore-*/specs`.

## 2. README.md (design D1)

- [x] 2.1 Rewrite the top part: title, one-sentence description, blank line (leave room for H's banner), Features table with 8 rows. Pitfall: do NOT write the word "unsupported" banner yet; H owns it.
- [x] 2.2 Write "Installation (commercetools Connect)": numbered steps (1 register app in MC with placeholder URL and entry point `visualizer`; 2 note the Application ID; 3 push repo / stage / publish / deploy via Connect CLI with region + `CUSTOM_APPLICATION_ID`, `ENTRY_POINT_URI_PATH`, `CLOUD_IDENTIFIER`; 4 copy deployed URL into the MC registration). Link to https://docs.commercetools.com/merchant-center-customizations/deployment/commercetools-connect for details. Do not paste any real Application ID.
- [x] 2.3 Add the **Scopes** table and **Configuration** table (keep E's if present). Verify scopes: `for s in $(grep -o "'\(view\|manage\)_[a-z_]*'" visualizer/custom-application-config.mjs | tr -d "'" | sort -u); do grep -q "$s" README.md || echo "MISSING $s"; done` prints nothing. Verify config keys: `for k in $(grep -o 'key: [A-Z_]*' connect.yaml | cut -d' ' -f2); do grep -q "$k" README.md || echo "MISSING $k"; done` prints nothing.
- [x] 2.4 Write Local development / Development / Known issues / Specifications sections per D1. The `.env.local` block must equal `visualizer/.env.example` keys. State "no GitHub Actions".
- [x] 2.5 Re-run both verification loops from 2.3 and `grep -n -i "netlify\|github/workflows\|<internal-org>" README.md` (expected: no output, or only the sentence "no GitHub Actions / no Netlify").

## 3. FEATURES.md and CLAUDE.md (D2, D3)

- [x] 3.1 FEATURES.md: add "Entity Diagram" and "Visualize Drilldown" sections (bullets + real paths; check each path with `ls`), delete the "Former visualizations" bullet, replace the Netlify sentence, bump `_Last updated:_` to today (`date +%F`). Verify: `grep -n -i "netlify\|former visualizations" FEATURES.md` empty.
- [x] 3.2 CLAUDE.md: edit the layout paragraph, the CI paragraph, the "Current feature areas" paragraph and the "Specs / constitution" paragraph per D3. Verify: `grep -n -i "not being reimplemented\|ci.yml\|netlify" CLAUDE.md` shows only the new "no GitHub Actions" sentence. Pitfall: CLAUDE.md is also read by AI agents; keep commands accurate (`cd visualizer` etc.).

## 4. specs/ (D4, D7)

- [x] 4.1 Scrub the three lines: in `specs/002-types/data-model.md`, `specs/003-states/data-model.md`, `specs/006-custom-objects/data-model.md` replace `<private-shared-hooks-package>` by `the shared data-fetching hooks`. Verify: `git grep -n -i "<internal-org>" -- specs` (works on untracked? NO - `git grep` only sees tracked files; use `grep -rn -i "<internal-org>" specs`) prints nothing.
- [x] 4.2 Create `specs/007-entity-diagram/{spec.md,data-model.md,quickstart.md}` and `specs/008-visualize-drilldown/{...}` by converting B's/C's OpenSpec specs; follow the exact heading style of `specs/005-extensions/spec.md` (open it first and mirror it: User scenarios, FR-### list, edge cases, permissions). Each FR must be verifiable on screen.
- [x] 4.3 Edit `specs/README.md`: intro (no "so the app can be reimplemented" wording if it is no longer true; say specs describe the current behaviour), index table rows 007 and 008 with routes, delete the final "not being reimplemented" blockquote, add "007/008 have no `contracts/` (REST proxy)".
- [x] 4.4 Edit `specs/001-welcome/spec.md`: describe the two cards as they are on the Welcome screen (open the screen); delete the "Either restore a target..." item. Verify: `grep -n -i "either restore\|drop the card" specs/001-welcome/spec.md` empty.
- [x] 4.6 Published records check (openspec/ and specs/ are public): `grep -rn -i -e "<internal-org>" -e "<internal-sandbox>" -e "/Users/" openspec specs | cut -c1-160`. Replace each literal internal name, sandbox project key or personal path in the text by a neutral placeholder (`<project-key>`, `$SRC`, "the internal source repository"); do not touch headings, checkboxes or requirement/scenario lines. In `specs/README.md` add one sentence: "Planning records of how the project was prepared are in `openspec/`; `plans/` is not part of this repository." Final scrub and `openspec/README.md` belong to change `labs-compliance` (task 2b).
- [x] 4.5 Verify the index: `for d in specs/0*/; do test -f ${d}spec.md || echo "no spec in $d"; done` prints nothing; `ls specs` shows 001..008 + README.md.

## 5. Screenshots (D5, D6)

- [ ] 5.1 Make sure the app runs against the sandbox project: `cd visualizer && npm start` in the background; in Chrome (logged in, M1) open `http://localhost:3001/<PROJECT_KEY>/visualizer`. Expected: Welcome page with 8 cards. Use `list_pages` to get the `pageId`. Never type or request credentials.
- [ ] 5.2 `resize_page{pageId, width:1440, height:900}`.
- [ ] 5.3 Capture, per row of this table: `navigate_page{type:"url",url:"http://localhost:3001/<PROJECT_KEY>/visualizer<path>"}`, wait (`wait_for` on a known text, e.g. the page title) until data is loaded, do the click listed, then `take_screenshot{pageId, format:"jpeg", quality:90, fullPage:true, filePath:"<repo-root>/visualizer/docs/<file>"}` (use `format:"png"` for the two Custom-Objects files). Click via `take_snapshot` -> `click{uid}`.
  | File | Path | Extra action |
  |---|---|---|
  | Homescreen.jpg | `` (root) | first navigation must be the root (silent-auth quirk) |
  | Extensions-List.jpg / Extensions-New.jpg | `/extensions` | click "Add new extension" for New (use fake values only) |
  | States-List.jpg / States-Details.jpg / States-New.jpg | `/states` | click a flow node (react-flow, not a table row) / "Add new state" |
  | Subscriptions-List.jpg / -Details.jpg / -New.jpg | `/subscriptions`, `/subscription/new` | click first data row |
  | Types-List.jpg / Types-Details.jpg / Types-New.jpg | `/types` | detail is a slide-over: wait ~2.5 s before shooting |
  | Custom-Objects-List.png / Custom-Objects-Edit.png | `/custom-objects` | type a real container name in the search box, wait 1.5 s |
  | **Entity-Diagram.jpg** | `/entity-diagram` | wait until nodes are drawn |
  | **Visualize-Drilldown.jpg** | `/visualize-drilldown` | choose an entity so the treemap shows data |
  Expected: files overwritten, `ls -l visualizer/docs` shows 16 files with today's timestamps, each > 20 KB. Pitfall: a screenshot taken while a spinner shows is useless - re-take.
- [ ] 5.4 Privacy review: open every file with the Read tool (it displays images). For each, check D6 list; write one line per image in your task notes "reviewed - no personal/customer data". Retake or crop offending shots.
- [x] 5.5 Update `visualizer/scripts/screenshots/capture.mjs` and `login.mjs`: replace `process.env.MC_PROJECT_KEY || '<project-key>'` by a required value: `const PROJECT_KEY = process.env.MC_PROJECT_KEY; if (!PROJECT_KEY) { console.error('Set MC_PROJECT_KEY to your project key'); process.exit(1); }`; add the two new `goto`+`shot` blocks (mirror the Extensions block, with try/catch). Update its `README.md` (remove the internal default sentence; mention the two new shots).
- [x] 5.6 Verify scripts: `node --check visualizer/scripts/screenshots/capture.mjs && node --check visualizer/scripts/screenshots/login.mjs` must exit 0 (syntax only). We cannot run them end-to-end (needs a Playwright login by the owner); record "capture.mjs only syntax-checked" in your report.
- [x] 5.7 Make sure `visualizer/scripts/screenshots/auth-state.json` does not exist: `ls visualizer/scripts/screenshots/auth-state.json` -> "No such file". (It holds a login session; the gate does NOT list it as forbidden, so you are the only protection. `.gitignore` there already ignores it.)

## 6. Final checks

- [x] 6.1 Scrub: `grep -rn -i -e "<internal-org>" -e "<internal-sandbox>" README.md FEATURES.md CLAUDE.md specs openspec visualizer/scripts visualizer/docs 2>/dev/null` prints nothing (openspec/ included because it is published).
- [ ] 6.2 Image link check: `grep -o "visualizer/docs/[A-Za-z0-9_.-]*" README.md | sort -u | while read f; do test -f "$f" || echo "BROKEN $f"; done; ls visualizer/docs | while read f; do grep -q "docs/$f" README.md || echo "ORPHAN $f"; done; echo OK` prints only `OK`.
- [x] 6.3 Spec sanity: `openspec validate docs-and-screenshots` passes.
- [ ] 6.4 Stop the dev server (`kill` the background `npm start`). Tick all boxes. Report to the owner: list of changed files and "capture.mjs only syntax-checked".

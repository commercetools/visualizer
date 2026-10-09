## 1. Prepare (no browser yet)

- [ ] 1.1 Check prerequisites: change D `tasks.md` fully checked; `cd visualizer && npm ci && npm run typecheck && npm test && npm run build` green. Why: E2E on a broken build wastes time.
- [ ] 1.2 Check manual steps M1 and M2 in `plans/manual-steps.md` are done by the owner (logged-in Chrome; `visualizer/.env.local` with `CLOUD_IDENTIFIER`, `INITIAL_PROJECT_KEY`, `CUSTOM_APPLICATION_ID=TODO`, `APPLICATION_URL=http://localhost:3001`). Verify only that keys exist: `sed 's/=.*/=<set>/' visualizer/.env.local`. NEVER print or commit values of secrets; `.env.local` is gitignored. If missing, STOP and tell the owner.
- [ ] 1.3 Read `openspec/changes/restore-entity-diagram/specs/*/spec.md` and `openspec/changes/restore-visualize-drilldown/specs/*/spec.md`. Edit the Entity Diagram (E1-E3) and Drilldown (D1-D3) rows of the matrix in `openspec/changes/e2e-verification/design.md` F7 so the "must observe" text equals those requirements. Why: the two pages were ported, so wording may differ from the old UIKit version.
- [ ] 1.4 `mkdir -p plans/evidence/lighthouse`. Copy `plans/e2e-results.md` to keep the pristine template: `cp plans/e2e-results.md plans/e2e-results.template.md`; fill the header of `plans/e2e-results.md` (run id from `date +%Y%m%d-%H%M`, tree state from `git status --short | head`).
- [ ] 1.5 Load the browser tools: ToolSearch with query `select:mcp__chrome-devtools__list_pages,mcp__chrome-devtools__navigate_page,mcp__chrome-devtools__new_page,mcp__chrome-devtools__take_snapshot,mcp__chrome-devtools__take_screenshot,mcp__chrome-devtools__click,mcp__chrome-devtools__fill,mcp__chrome-devtools__fill_form,mcp__chrome-devtools__press_key,mcp__chrome-devtools__wait_for,mcp__chrome-devtools__list_console_messages,mcp__chrome-devtools__list_network_requests,mcp__chrome-devtools__get_network_request,mcp__chrome-devtools__evaluate_script,mcp__chrome-devtools__handle_dialog,mcp__chrome-devtools__resize_page,mcp__chrome-devtools__lighthouse_audit`. Expected: the tool schemas are returned. Pitfall: calling an unloaded tool gives "InputValidationError".

## 2. Start the app and log in probe (profile A)

- [ ] 2.1 Start the dev server in the background: Bash `cd <repo-root>/visualizer && npm start` with `run_in_background: true`. Why background: it never exits. Expected output contains `Compiled successfully` / `http://localhost:3001`. Pitfall: if port 3001 is busy (`lsof -i :3001`), stop the other process; do not change the port because MC redirects expect 3001.
- [ ] 2.2 Open the app: `list_pages` (note `pageId`); `navigate_page {pageId, type:"url", url:"http://localhost:3001/<INITIAL_PROJECT_KEY>/visualizer", timeout:60000}`; `resize_page {pageId, width:1440, height:900}`.
- [ ] 2.3 Login probe: `wait_for {pageId, text:["A visualizer for all non out-of-the-box types in Merchant Center","Log in","Sign in"], timeout:60000}` then `take_snapshot`. Expected: the Welcome heading. If a login form appears, STOP and ask the owner to log in (manual step M1); never type credentials. After login re-run 2.2. Repeat this probe before each later section.
- [ ] 2.4 Baseline hygiene: `list_console_messages {pageId, types:["error"]}`; expected empty. Anything here is logged in section 11 of the results as "baseline error" because it will pollute every later row.

## 3. Welcome and menu (W1-W3, N1)

- [ ] 3.1 W1: `take_snapshot`; check the 7 level-2 headings in order and that no two descriptions are equal. `take_screenshot {pageId, filePath:"<repo-root>/plans/evidence/W1.png"}`. Record status in `plans/e2e-results.md`.
- [ ] 3.2 N1: in the snapshot find the MC left menu; expected 7 submenu items. If the dev shell does not show a menu (dev mode only shows the app), mark N1 SKIPPED(dev mode) and re-test in profile B.
- [ ] 3.3 W2: for each of the 7 cards: `click {pageId, uid:<View button uid>}`, `wait_for` the target page heading, `evaluate_script {pageId, function:"() => location.pathname"}` must end with the target (`/types`, `/subscriptions`, `/states`, `/extensions`, `/custom-objects`, `/visualize-drilldown`, `/entity-diagram`), then `navigate_page {type:"back"}`. Take a fresh snapshot each time because uids change.
- [ ] 3.4 W3: `navigate_page` to `.../visualizer/visualize` and `.../visualizer/nonsense`; expected Welcome heading both times.
- [ ] 3.5 After each sub-step: `list_console_messages {types:["error"]}` empty.

## 4. Types (T1-T4)

- [ ] 4.1 T1: navigate to `.../types`; `wait_for` text "Types"; snapshot; click the Key column header (sort) and check order flips; if a pagination control exists, go to page 2 and back. Evidence `T1.png`.
- [ ] 4.2 T2: click "Add New Type" (or equivalent, snapshot to find it). Fill Key `labs-e2e-t2-type`, Name (every language field) `labs-e2e-t2 type`, choose resource type `customer`. First try an invalid key `a b` and expect an inline validation error and NO request (`list_network_requests {resourceTypes:["fetch","xhr"]}` shows no mutation). Then fix the key, add field definition `f1` of type String with label, Save. Expected: success notification, type appears in list. Evidence `T2.png`.
- [ ] 4.3 T3: open the type; edit description; add field `f2` Enum with two values; use Move up/Move down; delete `f1`; Save; reload (`navigate_page type:"reload"`) and confirm persisted values. Check the network request `UpdateType` returns 200 with the expected update actions (`get_network_request`).
- [ ] 4.4 T4: delete the type (confirm dialog; use `handle_dialog {action:"accept"}` only if a native dialog opens, else click the confirm button). Expected success notification and no longer in list.
- [ ] 4.5 Console and network checks after each of 4.1-4.4.

## 5. States (S1-S3)

- [ ] 5.1 S1: open `.../states`; snapshot: tabs per state type, flow graph present (nodes, arrows). Evidence `S1.png`.
- [ ] 5.2 S2: create `labs-e2e-s2-b` (type OrderState, initial off, transitions unrestricted) then `labs-e2e-s2-a` with "Only allow transitions to the selected states" ON and `labs-e2e-s2-b` selected. Expected: both appear; graph shows an arrow a -> b. Pitfall: create `b` first, since `a` points to it.
- [ ] 5.3 S3: edit `a` name; Save; then delete `a` first, then `b` (a state that other states point to may not be deletable). Evidence `S2.png`.

## 6. Subscriptions (U1-U4) and Extensions (X1-X6)

- [ ] 6.1 U1: open `.../subscriptions`; list loads; note existing subscriptions and their destination types in the results.
- [ ] 6.2 U2: open `.../subscription/new`. For each of the 7 destinations (GoogleCloudPubSub: topic+projectId; SQS: auth mode, queue URL, region, +keys when Credentials; Confluent Cloud: bootstrap server, API key, secret, acks, topic; SNS: auth mode, topic ARN; EventBridge: account id, region; Azure Service Bus: connection string; Azure Event Grid: URI, access key): select the type in the "Destination type" select, take a snapshot and confirm the expected fields are shown, press Save with a field empty (expected inline error, no request), then fill everything with obviously fake values using prefix `labs-e2e-u2-<type>` for the key and press Save. Capture the request with `list_network_requests` + `get_network_request` and confirm `destination.type` matches the discriminator. An API 400 ("cannot deliver") is EXPECTED; require a visible error notification and no console error. If it unexpectedly succeeds, delete it right away and note it. Evidence `U2-<type>.png` x7.
- [ ] 6.3 U3: for every existing subscription found in 6.1 (ideally one per type) open it and confirm the destination fields are filled (not empty). Types without an existing subscription: SKIPPED(no data).
- [ ] 6.4 U4: only if a real subscription exists or was created: edit key-unrelated fields (add a change type), Save, expect `changeDestination` NOT sent when destination untouched (inspect request body); delete it if its key starts with `labs-e2e-`.
- [ ] 6.5 X1: open `.../extensions`; list loads.
- [ ] 6.6 X2: `.../extensions/new`: key `labs-e2e-x2-ext`, destination HTTP, URL `https://example.invalid/labs-e2e`, authentication Authorization header `Bearer labs-e2e`, timeout `1000`, trigger `quote-request` with action Create. Save. Expected success (the API does not call the URL on creation). Remember the danger described in design F5: choose ONLY a quiet resource and delete in task 6.8.
- [ ] 6.7 X3/X4/X5: on the same new-extension form switch the destination to AWS Lambda (ARN/access key/secret) and to Google Cloud Function (URL), check required-field errors, and press Save with an obviously invalid ARN to see the API error handled (expected 400, visible notification). Triggers: tick/untick a Create/Update box and see the row appear/disappear in place; add condition `quote.state = "x"` on a row that has an action; expansion paths max 3.
- [ ] 6.8 X6: open `labs-e2e-x2-ext`, change timeout to 2000, Save, reload to confirm, then delete it. Expected: gone from list.

## 7. Custom Objects (C1-C2)

- [ ] 7.1 C1: open `.../custom-objects`; type `labs-e2e-c2-container` into the container filter, wait ~1.5 s (debounce 1000 ms), expect empty list.
- [ ] 7.2 C2: create container `labs-e2e-c2-container`, key `labs-e2e-c2-key`, value `{"a":1}`; try value `{` first and expect an error; save; open, change to `{"a":2}`, save, reload and check; delete. Evidence `C2.png`.

## 8. Entity Diagram and Visualize Drilldown (E1-E3, D1-D3)

- [ ] 8.1 Before touching the diagram, create a backup of the layout object: `evaluate_script` is not allowed to modify data, so use the Custom Objects page: open container `mc-link-data`, key `linkDataList` (and `locationDataList`) and copy the JSON values into `plans/evidence/backup-mc-link-data.json` via Write. If the objects do not exist, note "none to back up" and plan to delete the ones created.
- [ ] 8.2 E1: `navigate_page` to `.../entity-diagram`; `wait_for` the heading from the change B spec (timeout 60000); snapshot; expected nodes and edges are present (look for node labels in the text tree and, if the diagram is a canvas, use `evaluate_script {function:"() => document.querySelectorAll('.react-flow__node').length"}` - class names depend on the library, adjust to what B used). `take_screenshot` `E1.png`. `list_console_messages {types:["error"]}` empty; `list_network_requests {resourceTypes:["fetch","xhr"]}` no >= 400.
- [ ] 8.3 E2: interact as described in change B spec (drag a node, zoom with `press_key` `Control++` or the on-screen buttons, select a node). Expected state changes visible in snapshot. Evidence `E2.png`.
- [ ] 8.4 E3: perform the save action defined in change B (if any), reload, confirm persisted. Then restore the layout from the backup of 8.1 (Custom Objects page) or delete the objects created by the test.
- [ ] 8.5 D1: `navigate_page` to `.../visualize-drilldown`; `wait_for` its heading; screenshot `D1.png`; network list must show 200 for every proxied entity request (business-units, customers, stores, channels, products, categories, product-selections, cart-discounts, standalone-prices, customer-groups). A 403 is a missing scope: log it as app bug owned by change D (design D4 table).
- [ ] 8.6 D2: click a treemap tile; expect children and breadcrumb; click the breadcrumb to go back. `D2.png`.
- [ ] 8.7 D3: use search, sort, legend toggle and info panel exactly as in change C spec. `D3.png`.
- [ ] 8.8 For both pages call `list_console_messages` with `types:["error","warn"]`; errors must be 0; warnings go to the allow-list table.

## 9. Permissions, Lighthouse

- [ ] 9.1 P2 (Manage): rows above already ran with a Manage user; mark PASS if all create/delete actions worked.
- [ ] 9.2 P1 (View-only): only if manual step M9 was done (second user). Log in as that user in the same Chrome (owner action), open Types/States/Subscriptions/Extensions/Custom Objects/Entity Diagram: forms must be read-only, buttons disabled (not hidden), no page crash, no 403 spam. Else SKIPPED(no second user).
- [ ] 9.3 L1/L2 Lighthouse: `lighthouse_audit {pageId, mode:"navigation", device:"desktop", outputDirPath:"<repo-root>/plans/evidence/lighthouse"}` while on `.../entity-diagram`, then again on `.../visualize-drilldown`. Copy the accessibility and best-practices scores and top 5 failed audits into the results file. Policy: a11y >= 90 pass; 80-89 warn + follow-up task; < 80 FAIL owned by change B or C. Note: the MC dev shell adds some of its own failures; classify those as "environment", not app bugs. Pitfall: navigation mode reloads the page, so re-login probe after.

## 10. Cleanup and triage

- [ ] 10.1 Z1 sweep: open Types, States, Subscriptions, Extensions, Custom Objects; search/scan for `labs-e2e-`; delete leftovers; record "none left" with one screenshot `Z1.png`. Also check `mc-link-data` is back to its backup.
- [ ] 10.2 For each FAIL do the triage in design F8: re-run once; save snapshot/console/network under `plans/evidence/FAIL-<ID>.*`; classify; add a row in the "Failures log"; if app bug, open a one-line task in the owning change's `tasks.md` (do not fix inside this change); after the fix re-run the failing row plus the Welcome and console checks; keep both results in the log.
- [ ] 10.3 Stop the dev server: `TaskStop` the background Bash job (or `lsof -ti :3001 | xargs kill`). Expected: `lsof -i :3001` prints nothing.

## 11. Optional profile B (Connect-served / registered app)

- [ ] 11.1 Only when manual steps M3 and M7 are done and change E finished: open `https://mc.<region-host>/<project-key>/visualizer` in the same Chrome and re-run sections 3, 8, 9.3 (smoke). Record under "Mode: Connect-served". Expected: the same results; any difference is a Connect/config bug owned by change E. Otherwise write "Profile B: SKIPPED (needs M3/M7)".

## 12. Close out

- [ ] 12.1 Fill section 5 Summary of `plans/e2e-results.md` (totals, console errors total = 0, decision GO/NO-GO). NO-GO if any FAIL remains or any console error is unexplained.
- [ ] 12.2 Copy the best screenshots (Welcome with 7 cards, Entity Diagram, Visualize Drilldown, plus list/detail views of the five older features) to a list at the bottom of the results file titled "Candidates for docs (change G)". Do not write to `visualizer/docs/` here.
- [ ] 12.3 Make sure `plans/evidence/` and `plans/e2e-results*.md` are not tracked: `git check-ignore -v plans/evidence/W1.png || echo "will be excluded by change I (plans/ dropped, owner Q6)"`. Do not commit.
- [ ] 12.4 `openspec validate e2e-verification` returns valid.

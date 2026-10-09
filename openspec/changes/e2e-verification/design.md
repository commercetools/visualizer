## Context

Glossary:
- **E2E (end-to-end) test**: we click through the real running app like a user, rather than testing code pieces.
- **Chrome DevTools MCP**: a tool server that lets Claude drive a Chrome browser. Its tools are named
  `mcp__chrome-devtools__*` and are "deferred": load their schemas first with
  `ToolSearch` query `select:mcp__chrome-devtools__navigate_page,mcp__chrome-devtools__take_snapshot,...`
  (or keyword `chrome-devtools`). Calling a tool before loading it fails.
- **uid**: every element in a `take_snapshot` result has an id such as `12_34`. `click`, `fill` need that uid.
  A uid is only valid for the snapshot that produced it: take a new snapshot after every page change.
- **Merchant Center (MC)**: commercetools' admin UI. **Dev mode** = `npm start` in `visualizer/`; the app runs on
  `http://localhost:3001` and signs in through MC's login page (package `mc-dev-authentication`), then talks to the
  real commercetools project through the MC API proxy. We do NOT need to register the app in MC for this.
- **Sandbox project**: a commercetools project that may be polluted. NEVER run this against a customer project.

Facts verified in the source repo `$SRC`:
- `visualizer/package.json`: `npm start` = `mc-scripts start`; default port 3001 (the screenshots tool in
  `visualizer/scripts/screenshots/` also assumes 3001).
- Local config comes from `visualizer/.env` (tracked: `ENTRY_POINT_URI_PATH="visualizer"`) plus gitignored
  `visualizer/.env.local` with `CLOUD_IDENTIFIER`, `CUSTOM_APPLICATION_ID`, `APPLICATION_URL`, `INITIAL_PROJECT_KEY`
  (README "Local Development").
- Dev URL pattern: `http://localhost:3001/<INITIAL_PROJECT_KEY>/visualizer[/<page>]`. Pages: `types`, `states`,
  `subscriptions`, `subscription/new`, `extensions`, `extensions/new`, `custom-objects`, `visualize-drilldown`, `entity-diagram`.
- Production-like URL (only when the app is registered in MC and served by Connect): `https://mc.<region-host>/<project-key>/visualizer/<page>`
  (for `gcp-us` the host is `mc.us-central1.gcp.commercetools.com`, `gcp-eu` -> `mc.europe-west1.gcp.commercetools.com`, per
  the commercetools region documentation). Needs manual steps M3 and M7; it is the OPTIONAL profile B below.
- Known tooling pitfall (CLAUDE.md of the source repo): the app starts with a CSS View Transition that can stall frame
  production; in Playwright it made every screenshot time out. The Chrome DevTools tool does not let us pass browser flags,
  so if `take_screenshot` hangs, fall back to `take_snapshot` (text) and record the screenshot row as SKIPPED(reason),
  or reload and retry after 5 s. Dev auth state is the browser profile cookie, not `auth-state.json`.
- Subscription types: 7 destinations (GoogleCloudPubSub, SQS, Confluent Cloud, SNS, EventBridge, Azure Service Bus,
  Azure Event Grid). Extension destinations: HTTP, AWSLambda, GoogleCloudFunction. Key rule: 2-256 chars `[a-zA-Z0-9-_]`.
  (spec files under `specs/00x-*/spec.md` of the source repo.)

Dependencies: change D (routes/cards/menu) must be done; B and C must be complete; E is optional (profile B).
Sibling changes `restore-entity-diagram` (test ids `entity-diagram-loading|error|empty|readonly`; View-only users see a read-only alert) / `restore-visualize-drilldown` (entity-type selector with Business Units, Stores, Customer Groups, Product Selections, Channels, Categories; treemap tiles are real buttons; breadcrumb; legend; detail drawer; `data-testid`s listed in its design.md "E2E hooks") define what the two pages show; rows E* and D* below are
written from the old behaviour and must be re-read against those changes' `specs/` before the run (task 1.3).

## Goals / Non-Goals

**Goals:** a junior-runnable, repeatable script; evidence; zero console errors; clean test data; a triage loop.
**Non-Goals:** load/performance testing (only a Lighthouse a11y/best-practices glance), cross-browser testing,
writing Playwright/Cypress code (could be a later improvement), testing against a customer project, handling
MC credentials (never type or store a password; login is manual step M1).

## Decisions

### F1. Run profile A (dev server) is the default; profile B (Connect-served) is optional
Why: A needs only M1+M2 and no org-admin rights. B proves the production build and Connect URL path (`ENTRY_POINT_URI_PATH`
injection) but depends on M3/M4/M7. If B is not possible, mark "Profile B: SKIPPED (needs M3/M7)" - not a failure.

### F2. Login is assumed, never automated
Assumed state: the Chrome controlled by the MCP is already logged in to MC for the sandbox project (M1). The run starts with a
"login probe" (task 2.3). If the probe lands on a login page, STOP and ask the owner to log in; do not fill credentials.

### F3. One shared page, deterministic navigation
Use a single tab; `pageId` comes from `list_pages` (first call). Navigate by `navigate_page {type:"url", url, pageId}`;
click through the UI only where the click itself is the thing being tested (menu, cards, buttons).

### F4. How each assertion is made
| Need | Tool call | Pass condition |
|---|---|---|
| page loaded | `wait_for {pageId, text:["<expected heading>"], timeout:30000}` | returns without timeout |
| content present | `take_snapshot {pageId}` then read it | expected texts/roles are in the text tree |
| no JS errors | `list_console_messages {pageId, types:["error"]}` | empty list |
| warnings recorded | same with `types:["warn"]` | each listed in results allow-list |
| no failed API | `list_network_requests {pageId, resourceTypes:["fetch","xhr"]}` | no status >= 400 (except where row says) |
| request body correct | `get_network_request {pageId, reqid}` | JSON body contains expected fields |
| evidence | `take_screenshot {pageId, filePath:"<repo-root>/plans/evidence/<ID>.png"}` | file exists |
Pitfall: `list_console_messages` and `list_network_requests` only show data "since last navigation" (or last 3 with
`includePreservedMessages`/`includePreservedRequests`). Check them BEFORE you navigate away. SPA clicks do not reset them.

### F5. Test data
Prefix every key/name with `labs-e2e-` plus the row id, e.g. `labs-e2e-t2-type`, `labs-e2e-s2-state-a`, `labs-e2e-x2-ext`,
`labs-e2e-c2-container` / key `labs-e2e-c2-key`. Never edit or delete anything that does not start with `labs-e2e-`.
Pre-existing project data may be read (Entity Diagram / Drilldown need it) but never modified, except the Entity Diagram's
own layout custom object (container `mc-link-data`): back it up first (task 8.2) and restore it afterwards.
Side-effect danger: an API Extension with a trigger on a busy resource (e.g. cart/order) is called by the platform
on every such action; if its URL fails, those actions fail project-wide. So test extensions only use a quiet resource
(`quote-request` or `business-unit`), an unroutable-but-valid URL `https://example.invalid/labs-e2e`, and are deleted within the same row.
Subscriptions: the API usually verifies it can deliver to the destination, so creating one against a fake queue is expected to
fail with HTTP 400. That is why rows U2 are "draft check": we assert the form validates and the request body (the draft) is correct,
and accept a visible error notification from the API. Only create a real one if the owner gives a throw-away queue (Q16).

### F6. Permission tests (P1/P2)
Console flags cannot downgrade a user. P1 needs a second MC user with View-only permission for this app (new manual step M9). Default if
unavailable: P1 = SKIPPED, and the read-only behaviour is covered by unit tests (`*.spec.tsx` pass `PERMISSIONS.View` only).
P2 is the normal run (the M1 user has Manage).

### F7. Test matrix (IDs match `plans/e2e-results.md`)
| ID | Steps (summary) | Must observe |
|---|---|---|
| W1 | open root | heading "A visualizer for all non out-of-the-box types in Merchant Center"; 7 card headings (Types, Subscriptions, States, API Extensions, Custom Objects, Visualize Drilldown, Entity Diagram) with different descriptions |
| W2 | click each "View ..." button | URL becomes `/<pk>/visualizer/<target>`; page heading changes |
| W3 | navigate to `/visualize` and `/nonsense` | Welcome shown |
| N1 | snapshot of MC side menu | 7 entries under "Visualizer" |
| T1-T4 | list; click sort; create `labs-e2e-t2-type` with resource type `customer`, field `f1` String; edit label, add field `f2` Enum, move up/down, delete a field; delete type | success notification each time; list reflects change; network `typeDefinitions` mutation 200; bad key `a b` shows validation error |
| S1-S3 | open states, switch tabs, read flow graph; create `labs-e2e-s2-a` and `-b` (type `OrderState`), a->b transition; edit name; delete both | graph shows nodes+arrow; validation; deletion order b then a (a referenced by b) |
| U1-U4 | list; open new; for EACH of 7 destinations select type, fill required fields (spec FR-005), assert fields shown, press Save with network capture | request body `destination.type` equals the API discriminator; missing field -> inline error and no request; open an existing subscription (if any) per type and assert destination fields are filled |
| X1-X6 | list; create HTTP with Authorization header auth, timeout 1000; Lambda form (ARN/key/secret); GCF form (URL); triggers: tick `quote-request` Create, add condition `quote.state = "x"` ; save; edit; delete | spec FR-004..FR-010 behaviours; trigger toggling in place; error when no trigger/destination missing |
| C1-C2 | filter container `labs-e2e-c2-container`; create container+key+JSON `{"a":1}`; invalid JSON shows error; edit to `{"a":2}`; delete | list updates; value persisted after reload |
| E1-E3 | open `/entity-diagram`; wait for diagram; interact; save layout (Manage) | nodes and edges rendered; no console error; layout persisted after reload; save disabled/hidden without Manage (P1) |
| D1-D3 | open `/visualize-drilldown`; click a treemap tile; breadcrumb back; search; sort; legend toggle; info panel | all entity requests 200 (no 403); drill shows children; back restores |
| L1-L2 | `lighthouse_audit {pageId, mode:"navigation", device:"desktop", outputDirPath:".../plans/evidence/lighthouse"}` on each new page | accessibility >= 90 pass; 80-89 warn; <80 fail |
| Z1 | open each list, search `labs-e2e-` | none left |

### F8. Failure triage (summary; steps in tasks section 10)
1. Re-run the step once (flaky waits). 2. Capture evidence (snapshot + console + failing request). 3. Classify:
(a) *script bug* (wrong text/uid) -> fix script in tasks/design; (b) *environment* (not logged in, API outage, rate limit) -> fix env, rerun;
(c) *expected API behaviour* (e.g. 400 for fake queue) -> mark expected in the row; (d) *app bug* -> write it in the Failures log, owner =
the change whose code is at fault (B entity-diagram, C drilldown, D routes/scopes, A baseline), fix there, rerun this row AND the neighbouring rows.
Typical symptoms: HTTP 403 on a proxy call -> missing scope (change D table D4); blank page + console "ChunkLoadError" -> stale dev server, restart;
GraphQL `Cannot query field` -> schema drift, check `visualizer/schemas/ctp.json`.

## Risks / Trade-offs
- [MC session expires mid-run] -> login probe at each section start (task 2.3 repeated); resume from last row.
- [Random UI wording differs from this plan] -> the first snapshot of each page defines truth; update the expected text in results, not silently.
- [Pollution of the sandbox] -> prefix, cleanup sweep Z1, extension trigger guard (F5).
- [Screenshot hangs] -> see Context pitfall.
- [Runs leak secrets] -> evidence screenshots may show the project key and user e-mail; `plans/evidence/` is excluded from the final commit (owner question Q6 default) and change G must re-capture its own doc screenshots from the sandbox.
- [Timing of E vs F] -> F profile A does not need E.

## Open Questions (defaults)
- Q16: may Claude create real subscriptions against a throw-away queue? Default: no, draft check only.
- M9 (manual): second View-only user for P1? Default: P1 SKIPPED, unit tests cover it.
- Q17: which sandbox project? Default: owner's M2 choice.

## Context

This is change **E** in `plans/dependency-plan.md`. It starts after A (files copied, baseline green) and
D (routes, menu links and scopes for the two restored pages are wired). Its job is to make the
delivery side correct for **commercetools Connect**, the only allowed delivery path (no GitHub Actions,
no Netlify).

Paths: repo root `<repo-root>` (`$DST`); the app is in
`$DST/visualizer` (nested on purpose: Connect requires the folder name to equal `deployAs[].name`).

### Jargon

- **Connect**: commercetools' hosting service. You give it a git repo + a release tag; it builds the app
  and serves it on a URL it generates.
- **Connector**: the thing Connect deploys. `ConnectorStaged` = your private, not yet published version.
  "Preview" = a temporary test deployment of a staged connector. "Publish" = make it deployable in
  production. "Deployment" = an installed running instance.
- **Merchant Center (MC) custom application**: a React app that the MC loads into its own page. It is
  *not* a backend: no server code, no endpoint, no secrets. It runs in the logged-in operator's browser
  and calls commercetools only through MC's API proxy using that user's permissions.
- **`connect.yaml`**: the manifest that tells Connect what to run and which settings the installer must
  supply.
- **Placeholder `${env:NAME}`**: text in `custom-application-config.mjs` that the build replaces with
  the value of environment variable `NAME`.
- **OAuth scope**: a permission string such as `view_states`. The app declares which ones it needs. A
  user with the app's **View** permission gets the `view_*` scopes; with **Manage** gets both.
- **Entry point URI path**: the URL segment of the app in MC, `https://<mc-host>/<project-key>/<entry-point>`.
- **Cloud identifier**: short code of the MC region (`gcp-eu`, ...).
- **Fail-open / fail-closed**: what happens to a business operation when an external dependency is down
  (let it pass vs block it). Only relevant when our code sits in the path of an API call.
- **Poison message / replay runbook**: handling of event messages that can never be processed. Only
  relevant for Subscription/event connectors.

## Facts verified at planning time (scratch copy of the source, not this repo)

| Experiment | Result |
|---|---|
| `npm run build` with `INITIAL_PROJECT_KEY` unset (other vars set) | **fails**: `Error: Missing environment variable 'INITIAL_PROJECT_KEY' specified in config as 'env:INITIAL_PROJECT_KEY'.` The build resolves *every* `${env:}` placeholder, including the `development` block, even in production mode. |
| Same, after changing the config to `initialProjectKey: process.env.INITIAL_PROJECT_KEY ?? 'your-project-key'` | build exit 0, `Compiled successfully.`, 188 files in `public/` |
| `INITIAL_PROJECT_KEY=from-dotenv` placed in `visualizer/.env.local`, `MC_APP_ENV=development npx mc-scripts compile-html` | generated `public/index.html` contains `"initialProjectKey":"from-dotenv"`: `.env.local` is loaded into `process.env` **before** the config file is evaluated, so `process.env.X` works in the config file |
| Build with **no** `visualizer/.env` and the four Connect variables exported | exit 0 (`ENABLE_NEW_JSX_TRANSFORM`/`FAST_REFRESH` from the old `.env` are not needed for a build) |
| `APPLICATION_URL` unset | build fails the same way (Connect injects it; locally set any URL) |
| `npm run start:prod:local` (builds HTML in dev mode, then `mc-scripts serve`) | prints `Running at http://localhost:3001`, `curl` returns HTTP 200 and an HTML page |
| Valid `cloudIdentifier` values from the installed `@commercetools-frontend/application-config` (`MC_API_URLS`) | `gcp-au`, `gcp-eu`, `gcp-us`, `aws-eu`, `aws-us` (+ legacy aliases `aws-fra`, `aws-ohio`) |
| `commercetools connect validate` (CLI 0.0.17) | needs a **running Docker daemon** (`Cannot connect to the Docker daemon` otherwise). It could not be run at planning time, so its success output is unknown: record the real output in `tasks.md` task 10 |
| `commercetools connect connectorstaged create --help` | `--supported-regions` accepts `us-central1.gcp`, `europe-west1.gcp`, `australia-southeast1.gcp`, `us-east-2.aws`, `eu-central-1.aws`; `--integration-types` includes `other` |

## Goals / Non-Goals

**Goals**: `connect.yaml`, config file, env files and README conform to the skill checklist
(`merchant-center-customizations.md` Checklist + `deployment-installation.md` Pattern 6); least-privilege
scopes proven by code; no other delivery path; `connect validate` green; clear owner runbook.

**Non-Goals**: executing any Connect/MC state-changing command (owner-gated: M3, M4, M7, and J);
changing features; writing docs beyond the Connect section (G does the rest); licence/SPDX (H).

## Decisions

### D1. Target `connect.yaml` (copy exactly)

```yaml
deployAs:
  - name: visualizer
    applicationType: merchant-center-custom-application
    configuration:
      standardConfiguration:
        - key: CUSTOM_APPLICATION_ID
          description: >-
            Application ID of the Custom Application you registered in the Merchant Center
            (Organization settings > Custom Applications). Shown on the application's detail page.
          required: true
        - key: ENTRY_POINT_URI_PATH
          description: >-
            Entry point URI path of the registered Custom Application; the app is served at
            https://<merchant-center-host>/<project-key>/<this value>. Unique per cloud region.
          required: true
          default: 'visualizer'
        - key: CLOUD_IDENTIFIER
          description: >-
            Merchant Center region of your commercetools project. One of: gcp-au, gcp-eu, gcp-us,
            aws-eu, aws-us. Deploy the connector in the matching Connect region.
          required: true
          default: 'gcp-eu'
```

Why each choice (skill `merchant-center-customizations.md` Pattern 5): no `endpoint` (not a service), no
`securedConfiguration` (the UI holds no secrets), no `APPLICATION_URL` (Connect provides it), no `scripts`
(no `postDeploy`/`preUndeploy`: nothing to register in the project), no `inheritAs.apiClient` (the app does
not use an API client of its own; the MC proxy uses the user's token). The old file's description for
`CLOUD_IDENTIFIER` listed four values and omitted `gcp-au`; the new text lists the five real ones. `>-`
makes a YAML folded string without a trailing newline.

### D2. `INITIAL_PROJECT_KEY` (owner question Q7, default: remove from Connect)

Used only by a developer machine: `mc-scripts start` (which project to open) and
`npm run generate-types:ctp` (`scripts/login.js`, `codegen.ctp.yml`, `graphql.config.yml`). A Connect
installer has no use for it. Removing it from `connect.yaml` alone would break the Connect build (see
facts table), so the config file changes to
`initialProjectKey: process.env.INITIAL_PROJECT_KEY ?? 'your-project-key'`. This mirrors the official
Connect/MC starter, whose `development.initialProjectKey` is a plain literal, never a placeholder.
Documented in README ("Local development") and `.env.example`. Fallback plan if the later Connect preview
(J) complains: re-add `INITIAL_PROJECT_KEY` to `connect.yaml` as `required: false` with `default: 'unused'`.

### D3. `CLOUD_IDENTIFIER` values versus the skill's region list

The skill lists **Connect regions** (used for `connect ... --region`); the config uses **cloud
identifiers** (used by MC). They map one-to-one (verified against `MC_API_URLS`):

| `CLOUD_IDENTIFIER` | Connect region (`--region`, `--supported-regions`) | Merchant Center host |
|---|---|---|
| `gcp-au` | `australia-southeast1.gcp` | `mc.australia-southeast1.gcp.commercetools.com` |
| `gcp-eu` | `europe-west1.gcp` | `mc.europe-west1.gcp.commercetools.com` |
| `gcp-us` | `us-central1.gcp` | `mc.us-central1.gcp.commercetools.com` |
| `aws-eu` | `eu-central-1.aws` | `mc.eu-central-1.aws.commercetools.com` |
| `aws-us` | `us-east-2.aws` | `mc.us-east-2.aws.commercetools.com` |

Default stays `gcp-eu` (same as the skill example and the source). The dev project of the owner lives on
`gcp-us` (MC host `mc.us-central1.gcp...`, see M1): they put `CLOUD_IDENTIFIER=gcp-us` in `.env.local` and
deploy the connector to `us-central1.gcp`. Rule from the skill: deploy in the **same region** as the
project. Do not use the legacy `aws-fra`/`aws-ohio`. A wrong value shows up as a blank page or MC API
403/404 (see runbook).

### D4. Env files

- Delete `visualizer/.env` (tracked in the source; the public gate rejects any `.env`; Q8 default).
- Add `visualizer/.env.example` (placeholders only, safe to publish) and tell developers to copy it to
  `.env.local` (git-ignored). Why not keep `.env`? Its `ENTRY_POINT_URI_PATH="visualizer"` could silently
  override or conflict with the value Connect injects, and `.env` files in public repos are a standard
  scanner finding.
- Root `.gitignore`: remove `!.env`; ignore `.env` and `.env.local`; keep `.env.example` tracked.
- `src/constants.ts` already falls back to `'visualizer'` when `ENTRY_POINT_URI_PATH` is absent, so tests
  need no env file.

Content of `.env.example` (final):

```dotenv
# Copy to .env.local (git-ignored) and adjust. Never commit real values.
# On Connect these are injected from connect.yaml / by Connect; they are only needed locally.

# Entry point URI path you registered for the Custom Application
ENTRY_POINT_URI_PATH=visualizer
# MC region: gcp-au | gcp-eu | gcp-us | aws-eu | aws-us
CLOUD_IDENTIFIER=gcp-eu
# Application ID of the registered Custom Application (any text works for local dev/build)
CUSTOM_APPLICATION_ID=TODO
# Connect injects the real URL on deployment. Any URL works locally.
APPLICATION_URL=https://localhost
# Project that `npm start` opens and that `npm run generate-types:ctp` logs in to (local only)
INITIAL_PROJECT_KEY=your-project-key
# Optional dev-server toggles
ENABLE_NEW_JSX_TRANSFORM="true"
FAST_REFRESH="true"
```

### D5. Scope audit method (how the junior proves each scope)

1. **Collect evidence from the code** (commands in tasks 4.1-4.3): every GraphQL operation name under
   `src/hooks/**/*.graphql` and every REST path the restored pages request through the MC API proxy.
2. **Map operation -> scope** using the commercetools scope reference
   (`https://docs.commercetools.com/api/scopes`, or MCP tool `commercetools-documentation-search`). Rules
   that matter here:
   - `manage_X` implies `view_X`; the app still lists `view_X` in the `view` group so that **View-only**
     users get read access.
   - `manage_subscriptions` and `manage_extensions` have **no** `view_` twin in the API. So for those two
     features even reading needs the `manage` group (see open question QE1).
   - `view_orders` also grants Cart Discounts, Zones, States, Custom Objects and Discount Codes "for backward
     compatibility", `view_products` also grants Product Types, Channels, Inventory, Reviews, Product Discounts,
     Categories, Tax Categories and Custom Objects; resource-specific scopes are preferred for *new* code.
3. **Write the audit table** (below) into this file's section and into the README, then compare with the
   config. A scope without an operation is removed; an operation without a scope is added.

Audit table (state at planning time; **re-derive in task 4, change D may have refined it**):

| Scope | Group | Used by (feature -> operations / endpoints) | Verdict |
|---|---|---|---|
| `view_states` | view | States list, detail, flow diagram -> `FetchStates`, `FetchState` | keep |
| `manage_states` | manage | States create/edit/delete -> `CreateState`, `UpdateState`, `DeleteState` | keep |
| `view_types` | view | Types -> `FetchTypes`, `FetchType`, `FetchTypeFieldTypes`, `FetchTypeWithDefinitionByName`; Entity Diagram (types) | keep |
| `manage_types` | manage | Types -> `CreateTypeDefinition`, `UpdateTypeDefinition`, `DeleteTypeDefintion` | keep |
| `manage_subscriptions` | manage | Subscriptions -> `FetchSubscriptions`, `FetchSubscription`, `CreateSubscription`, `UpdateSubscription`, `DeleteSubscription` (no `view_` scope exists) | keep |
| `manage_extensions` | manage | API Extensions -> `FetchExtensions`, `FetchExtensionDependencyCandidates`, `GetExtension`, `CreateExtension`, `UpdateExtension`, `DeleteExtension` (no `view_` scope exists) | keep |
| `view_key_value_documents` | view | Custom Objects list/detail -> `GetCustomObjects`, `GetCustomObject`; Entity Diagram reads containers `mc-custom-object-schema`, `mc-link-data` | keep |
| `manage_key_value_documents` | manage | Custom Objects edit/delete -> `CreateOrUpdateCustomObject`, `DeleteCustomObject`; Entity Diagram saves its layout | keep |
| `view_products` | view | Drilldown `GET /products`, `/channels`; Entity Diagram product types | keep (after B/C/D) |
| `view_customers` | view | Drilldown `GET /customers` (associates) and customer groups unless task finds a 403 | keep (after C/D) |
| `view_business_units` | view | Drilldown `GET /business-units` | keep (after C/D) |
| `view_stores` | view | Drilldown `GET /stores` | keep (after C/D) |
| `view_product_selections` | view | Drilldown `GET /product-selections`, `/products/{id}/product-selections` | keep (after C/D) |
| `view_categories` | view | Drilldown `GET /categories` | **add** (D) |
| `view_cart_discounts` | view | Drilldown `GET /cart-discounts` | **add** (D) |
| `view_standalone_prices` | view | Drilldown `GET /standalone-prices` | **add** (D; removed in `3d8e4ba`/`41a071c` while the page was gone) |
| `view_customer_groups` | view | Drilldown `GET /customer-groups` | only if a live 403 proves `view_customers` is not enough (D task 7.3) |
| `view_orders`, `manage_orders` | view/manage | no GraphQL operation or endpoint in the code | **remove** (D) |
| `view_shopping_lists`, `manage_shopping_lists` | view/manage | none | **remove** (D) |

Evidence for the REST list: old drilldown code `ENTITY_ENDPOINTS` (`git show e7cb4c4^:visualizer/src/components/visualize-drilldown/utils/relationship-contstants.ts` in the *source* repo); the
restored copy in this repo is authoritative once C is done.

### D6. Menu-link permissions

Today all five submenu links have the permission line **commented out** (`// permissions: [PERMISSIONS.View],`)
and the main link has `[PERMISSIONS.View]`. In MC an empty list means "always visible". Effective behaviour
is the same (to open the app one needs View anyway), but explicit is clearer and is what the skill/docs
checklist asks ("set `permissions` on `mainMenuLink`/`submenuLinks`"). Decision: **every link gets
`permissions: [PERMISSIONS.View]`**, including the two restored links. History: commit `aa95bd4` deliberately
moved Extensions and Subscriptions from Manage to View so View-only users can see the pages read-only; we
keep that (owner question QE1 records the API caveat).

Menu permission names are derived from the entry point (`ViewVisualizer`, `ManageVisualizer`) by
`entryPointUriPathToPermissionKeys` in `src/constants.ts`; nothing else to configure.

### D7. Removing other delivery paths

A already left out `netlify.toml` and `.github/`. E proves their absence, searches for references
(`CLAUDE.md` mentions both; `FEATURES.md` has three sentences; README has none) and edits **only those
sentences** so nothing points to missing files; G later rewrites the documents fully. No dependabot file
exists on `main` of the source (it lived only on a side branch), but the check covers it.

### D8. README "Deploy with commercetools Connect" (draft to adapt)

Insert after the existing "Installation" section and delete the one-line "pre-packaged to run as a connect
application" sentence. The scope table **must be copied from the final config** (task 8.2); the lists below
are the planning-time expectation.

````markdown
## Deploy with commercetools Connect

The Visualizer is a Merchant Center **custom application** (UI only). It is delivered as a Connect
application of type `merchant-center-custom-application`; the folder `visualizer/` matches the `name` in
[`connect.yaml`](./connect.yaml). It has **no backend**: no endpoint, no secrets, no Extension or
Subscription is registered in your project by this app.

### Configuration

| Key | In `connect.yaml` | Required | Default | Meaning |
|---|---|---|---|---|
| `CUSTOM_APPLICATION_ID` | standard | yes | - | Application ID of the Custom Application registered in the Merchant Center |
| `ENTRY_POINT_URI_PATH` | standard | yes | `visualizer` | Entry point URI path of that registration; the app is served at `<mc-host>/<project-key>/<value>` |
| `CLOUD_IDENTIFIER` | standard | yes | `gcp-eu` | Merchant Center region: `gcp-au`, `gcp-eu`, `gcp-us`, `aws-eu`, `aws-us` |
| `APPLICATION_URL` | not declared | - | - | Provided by Connect at deployment; used as the app URL |
| `INITIAL_PROJECT_KEY` | not declared | local only | `your-project-key` | Project opened by `npm start` / used by `npm run generate-types:ctp`; set in `visualizer/.env.local` |

There is no `securedConfiguration`: the app holds no secrets.

### Scopes (permissions)

<!-- paste the table generated in task 8.2: scope | permission group | used for -->

Users with the **View** permission of the app receive the `view_*` scopes; users with **Manage** receive all.
`manage_subscriptions` and `manage_extensions` have no `view_` counterpart in the commercetools API.
Keep the scopes registered in the Merchant Center identical to `visualizer/custom-application-config.mjs`
(`npm run sync` in `visualizer/` synchronises them).

### Failure behaviour

*Fail-open / fail-closed: not applicable.* The app is not in the request path of any commercetools API call:
it registers no API Extension and no Subscription, and no cart, order or other operation of your project
depends on it. If the app or Connect is unavailable, only this UI is unavailable.
*Poison messages / replay: not applicable.* The app receives and processes no messages.

### Installation and release order

1. Register the Custom Application in the Merchant Center (Organization > Custom Applications) with a
   placeholder URL (`https://example.com`), entry point `visualizer`, the scopes above and the menu links;
   note its **Application ID**.
2. Create a release **tag** of this repository.
3. Stage, preview, publish and deploy the connector with the Connect CLI (see the commands below), passing
   the three configuration values, in the **same region** as your project.
4. Read the deployment's application URL and put it into the Custom Application's *Application URL* in the
   Merchant Center. Install the application for your project and assign Teams the View/Manage permission.

### Operations runbook

| Symptom | Likely cause | What to do |
|---|---|---|
| Blank page / endless spinner after opening the app | Application URL in Merchant Center still the placeholder or wrong | Copy the deployment's application URL (`applications[].url`) into the registration |
| "Application not found" / 404 in the Merchant Center | `ENTRY_POINT_URI_PATH` or `CLOUD_IDENTIFIER` differs from the registration / region | Redeploy with the exact registered values (`deployment redeploy --configuration KEY=value`) |
| A page shows an error or empty list, browser network tab shows 403 | A needed scope is not registered in the Merchant Center | Compare the registered scopes with the table above, run `npm run sync`, re-login |
| Menu entry missing | The user's Team lacks View permission for the app | Assign the permission in Organization settings |
| Subscriptions / API Extensions pages empty for a View-only user | The commercetools API needs `manage_*` scopes for these resources | Give the Team the Manage permission |
| Change of configuration value | - | Redeploy (do not delete and recreate the deployment) |
| Where are the logs? | - | `commercetools connect deployment logs --key <deployment-key> --application visualizer` |
````

### D9. `connect validate` and the owner-gated release flow

`commercetools connect validate .` (from the repo root; Docker must be running) is the pre-flight gate.
Everything after it changes remote state or needs credentials and is **owner-gated**; E documents it
(README + this file) and does not run it:

| Step | Command (placeholders in `<>`) | Manual step |
|---|---|---|
| Register app in MC (placeholder URL, entry point, scopes, menu links) | MC UI, or `npm run sync` in `visualizer/` after `npm run login` | M3 (needs org admin) |
| Authenticate Connect CLI | `commercetools auth login --client-credentials --client-id <id> --client-secret <secret> --region <region> --project-key <key>` (never put secrets in files or chat) | M4 |
| Release tag | `git tag v1.0.0` + push (J, after the single commit exists) | J |
| Stage | `commercetools connect connectorstaged create --repository-url <https url> --repository-tag v1.0.0 --creator-email <email> --name visualizer --key visualizer --description "<text>" --integration-types other --supported-regions <regions>` | J |
| Preview test | `commercetools connect connectorstaged preview --key visualizer --deployment-key visualizer-preview --region <connect-region>` (needs `isPreviewable`, i.e. `updatePreviewable` first) | J |
| Publish (private) | `commercetools connect connectorstaged publish --key visualizer` | J |
| Deploy | `commercetools connect deployment create --connector-key visualizer --region <connect-region> --type production` + config values | J |
| Paste URL back into MC | `deployment describe` -> `applications[].url` -> MC registration | M7 |

Note: an HTTPS repository URL only works if the repository is **public**; a private repo needs SSH plus read
access for the machine user `connect-mu`. Since the labs repo is published public from day one (single
commit, then J), the Connect preview naturally happens **after** the public push. Owner question QE2 asks
whether to test earlier from a private scratch repo; the default is no.

### D10. Skill checklist coverage (used in the final task)

From `merchant-center-customizations.md`: app-vs-view chosen (application: own route + menu); config uses
`${env:}` placeholders; scopes least-privilege and UI gated (`useIsAuthorized`, menu permissions); tested
locally via the shell (Jest + `renderAppWithRedux` already in the repo) including a permission-denied path
(covered by existing specs, F re-tests with a View-only user); `connect.yaml` uses the right type with no
stray keys; register-first/URL-last followed; deployed in the project's region with matching
`cloudIdentifier`. From `deployment-installation.md` Pattern 6: README states fail stance, scopes,
configuration table, poison-message runbook (marked N/A with reason).

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `connect validate` behaves differently for MC apps than assumed (unverified: needs Docker) | Record its real output; if it demands fields that conflict with the skill (e.g. an `endpoint`), do **not** add them blindly: record the finding as an open question and keep the skill-conformant file |
| Connect's build may not accept a missing `INITIAL_PROJECT_KEY` any other way than D2 | D2 removes the dependency; fallback documented in D2 |
| Removing scopes that code uses indirectly breaks a page | Audit is evidence-based; F re-tests every page; rollback is re-adding one array line. A 403 names the missing scope |
| Registered MC scopes drift from the config | README says to run `npm run sync`; runbook row for 403 |
| View-only users cannot read Subscriptions/Extensions (API has no view scopes) | QE1; documented in README; F tests with the View-only user (M9) |
| Docs (CLAUDE.md/FEATURES.md) edited here and again in G | E touches only the sentences naming Netlify/CI; G rewrites on top |

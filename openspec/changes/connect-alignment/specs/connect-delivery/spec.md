## ADDED Requirements

### Requirement: connect.yaml follows the Merchant Center custom application contract
`connect.yaml` at the repo root SHALL contain exactly one `deployAs` entry named `visualizer` (equal to
the folder `./visualizer`) with `applicationType: merchant-center-custom-application`, and SHALL declare
only the `standardConfiguration` keys `CUSTOM_APPLICATION_ID` (required), `ENTRY_POINT_URI_PATH`
(required, default `visualizer`) and `CLOUD_IDENTIFIER` (required, default `gcp-eu`), each with a
non-empty `description`. It SHALL NOT contain `endpoint`, `securedConfiguration`, `scripts`,
`properties`, `inheritAs`, `APPLICATION_URL` or `INITIAL_PROJECT_KEY`.

#### Scenario: Forbidden keys are absent
- **WHEN** `grep -nE "endpoint|securedConfiguration|APPLICATION_URL|INITIAL_PROJECT_KEY|inheritAs|scripts:" connect.yaml` is run
- **THEN** it prints nothing

#### Scenario: Validation passes
- **WHEN** `commercetools connect validate .` is run from the repo root with Docker running
- **THEN** it exits 0 and reports no errors for the `visualizer` application

### Requirement: Build and dev do not depend on dev-only settings
The build SHALL succeed when only the Connect-provided variables (`ENTRY_POINT_URI_PATH`,
`CLOUD_IDENTIFIER`, `CUSTOM_APPLICATION_ID`, `APPLICATION_URL`) are set, and `INITIAL_PROJECT_KEY` SHALL
be read only for local development with a harmless fallback.

#### Scenario: Build without INITIAL_PROJECT_KEY
- **WHEN** `npm run build` is run in `visualizer/` with the four Connect variables set and `INITIAL_PROJECT_KEY` unset and no `.env` file present
- **THEN** it exits 0 and prints `Compiled successfully.`

#### Scenario: Local development key is honoured
- **WHEN** `visualizer/.env.local` contains `INITIAL_PROJECT_KEY=my-key` and `MC_APP_ENV=development npx mc-scripts compile-html` runs
- **THEN** the generated `public/index.html` contains `"initialProjectKey":"my-key"`

### Requirement: OAuth scopes are least-privilege and evidence-based
Every scope in `oAuthScopes.view` and `oAuthScopes.manage` of `custom-application-config.mjs` SHALL be
justified by at least one GraphQL operation or REST endpoint in the code, and every resource the code
reads or writes SHALL be covered by a declared scope. The scope table in `README.md` SHALL equal the
config exactly.

#### Scenario: No unused scope
- **WHEN** the audit table in `design.md` is regenerated from the code with the commands in `tasks.md`
- **THEN** every declared scope appears in the table with at least one operation, and the scope list in the README is identical to the config

#### Scenario: Orders and shopping-list scopes are gone
- **WHEN** `grep -nE "orders|shopping_lists" visualizer/custom-application-config.mjs` is run
- **THEN** it prints nothing (unless task 4.4 recorded a code use and a comment explains it)

### Requirement: Menu links carry explicit permissions
`mainMenuLink` and every `submenuLinks` entry SHALL define `permissions`, using `PERMISSIONS.View` unless
a documented reason requires `PERMISSIONS.Manage`.

#### Scenario: All links gated
- **WHEN** `grep -c "permissions:" visualizer/custom-application-config.mjs` is run
- **THEN** the number equals the number of links (1 main link + number of submenu links) and no `// permissions` commented line remains

### Requirement: Environment files and other delivery paths are removed
The repo SHALL NOT contain `visualizer/.env`, `visualizer/.env.local`, `netlify.toml`, a `.github/`
directory (workflows, dependabot), and SHALL contain `visualizer/.env.example` with placeholders only.
No tracked file SHALL reference `netlify.toml` or `.github/workflows`.

#### Scenario: Forbidden files absent
- **WHEN** `find . -name .env -o -name netlify.toml -o -name .github -o -name dependabot.yml` is run (excluding `node_modules`)
- **THEN** it prints nothing

#### Scenario: Example file present and ignored files protected
- **WHEN** `git check-ignore -v visualizer/.env visualizer/.env.local` and `git check-ignore visualizer/.env.example` are run
- **THEN** the first two paths are reported as ignored and the example file is not ignored

### Requirement: README states the connector contract
`README.md` SHALL contain a "Deploy with commercetools Connect" section with: a configuration table
listing every `connect.yaml` key (and the Connect-injected / local-only variables), the exact scopes,
an explicit statement that fail-open/fail-closed does not apply (UI only: no Extension, no Subscription,
no endpoint), a statement that poison-message/replay handling does not apply, an operations runbook, and
the install/deploy order of operations.

#### Scenario: Required statements present
- **WHEN** `grep -nE "fail-open|fail-closed|Poison|poison|Configuration|Scopes" README.md` is run
- **THEN** each of the four required topics (configuration table, scopes, fail stance, runbook) is found in the Connect section

### Requirement: Owner-gated release steps are documented, not executed
The change SHALL document the Merchant Center registration (M3), Connect CLI authentication (M4), and URL
update (M7) steps with exact commands, and SHALL NOT run `connectorstaged`, `deployment` or any command
that changes Merchant Center or Connect state.

#### Scenario: No remote state changed
- **WHEN** the change is complete
- **THEN** `commercetools connect connectorstaged list` was never run by this change and no tag or push was created

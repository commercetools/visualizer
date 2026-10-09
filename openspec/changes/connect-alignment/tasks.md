## How to use this file

- Work top to bottom; tick a box only after its **Verify** printed the **Expected** output.
- Paths: `$DST` = `<repo-root>` (repo root), app folder =
  `$DST/visualizer`. Read `design.md` first (jargon + decisions D1-D10 are referenced below).
- **Never run** in this change: `git commit`, `git tag`, `git push`, `commercetools connect connectorstaged ...`,
  `commercetools connect deployment ...`, `commercetools auth login`, `npm run sync` (changes Merchant Center).
  Those are owner-gated (section 11).
- **Never write secrets** into files, chat or logs. Values in this change are placeholders.
- This change starts only when A and D are finished (task 0.2 checks it).
- Code blocks below are indented by 4 spaces because they sit inside a list. When you paste a block that contains a `cat > file <<'EOF'` here-document, remove that indentation everywhere, including before the closing `EOF`, otherwise the file gets leading spaces (YAML breaks) or the shell waits forever.

## 0. Setup and prerequisites

- [x] 0.1 Variables and tool check
  - **Do**: `export DST=<repo-root> && cd "$DST" && node -v && npm -v && commercetools --version`
  - **Expected**: Node `v22.x`, npm `10.x`, `@commercetools/cli/0.0.17 darwin-arm64 node-v22...` (or newer).
  - **Why**: wrong Node major breaks the build; the Connect CLI is needed for `validate`.
  - **Pitfalls**: if `commercetools: command not found` run `npm install -g @commercetools/cli` (global install, not in the repo).

- [ ] 0.2 Confirm A and D are done (do not start earlier)
  - **Do**:
    ```bash
    ls "$DST/visualizer/node_modules/.bin/mc-scripts"
    grep -c "uriPath:" "$DST/visualizer/custom-application-config.mjs"
    grep -n "uriPath:" "$DST/visualizer/custom-application-config.mjs"
    ls "$DST/visualizer/src/components" | grep -E "entity-diagram|visualize-drilldown"
    ```
  - **Expected**: the `mc-scripts` path; `7`; seven `uriPath:` lines including `'visualize-drilldown'` and `'entity-diagram'`; both component folders listed.
  - **Why**: scopes in task 4 are derived from the restored pages; if they are missing the audit would wrongly delete scopes they need.
  - **Pitfalls**: `5` and no folders means B/C/D are not finished: **stop** and report. Do not add the links yourself.

- [ ] 0.3 Start Docker (needed only for `connect validate`, tasks 1.3 and 10)
  - **Do**: `docker ps >/dev/null 2>&1 && echo DOCKER-OK || (open -a Docker; echo "waiting"; sleep 45; docker ps | head -1)`
  - **Expected**: `DOCKER-OK`, or after waiting a header line `CONTAINER ID   IMAGE ...`.
  - **Why**: at planning time the Docker daemon was off and `connect validate` stopped with `Cannot connect to the Docker daemon`.
  - **Pitfalls**: if Docker cannot be started on this machine, continue with everything else and leave task 10 as a maintainer step.

## 1. Capture the "before" state

- [ ] 1.1 Back up the files this change edits (to compare later)
  - **Do**:
    ```bash
    mkdir -p /tmp/e-before && cd "$DST" && cp connect.yaml .gitignore README.md CLAUDE.md FEATURES.md visualizer/custom-application-config.mjs visualizer/.env /tmp/e-before/
    ls /tmp/e-before
    ```
  - **Expected**: seven names listed (`.env` is hidden: use `ls -a`).
  - **Why**: nothing is committed, so git cannot show "before"; this copy gives `diff` something to compare.

- [ ] 1.2 Record the unmodified `connect.yaml` problems
  - **Do**: `cd "$DST" && grep -nE "INITIAL_PROJECT_KEY|gcp-us|description: one of" connect.yaml`
  - **Expected**: lines for `INITIAL_PROJECT_KEY` (required, "development project key") and the `CLOUD_IDENTIFIER` description `one of the following gcp-us, gcp-eu, aws-us, aws-eu` (note: `gcp-au` is missing).
  - **Why**: confirms we are editing the file we think we are.

- [ ] 1.3 (optional, needs Docker) "before" validation
  - **Do**: `cd "$DST" && commercetools connect validate . > /tmp/e-validate-before.log 2>&1; echo "exit=$?"; tail -n 20 /tmp/e-validate-before.log`
  - **Expected**: unknown at planning time (Docker was off). Write exit code and the last lines into the **Notes** at the bottom of this file.
  - **Why**: if validate already fails *before* our edits for a reason unrelated to `connect.yaml` (e.g. test step), task 10 must not be blamed for it.
  - **Pitfalls**: this may run the project's tests in a container and take many minutes; let it finish. Use `--skip tests` or `--skip analysis` (only **one** `--skip` flag is allowed) if it hangs, and note which you used.

## 2. Rewrite `connect.yaml`

- [x] 2.1 Replace the whole file with the D1 content
  - **File**: `$DST/connect.yaml`
  - **Do**:
    ```bash
    cat > "$DST/connect.yaml" <<'EOF'
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
    EOF
    ```
    (If your shell indents the block, make sure the lines in the file start at column 0 exactly as shown, `deployAs:` first.)
  - **Why**: matches the official MC-on-Connect contract (design D1). Removed: `INITIAL_PROJECT_KEY`.
  - **Pitfalls**: YAML is whitespace sensitive: spaces only, 2 per level, no tabs. The key `name: visualizer` must equal the folder `visualizer/`.
  - **Verify**:
    ```bash
    cd "$DST/visualizer" && node -e "
    const y=require('js-yaml');const d=y.load(require('fs').readFileSync('../connect.yaml','utf8'));
    const a=d.deployAs[0];
    console.log(d.deployAs.length, a.name, a.applicationType, Object.keys(a).join(','));
    console.log(JSON.stringify(a.configuration.standardConfiguration.map(k=>[k.key,k.required,k.default||null,k.description.length>20])));"
    grep -nE "endpoint|securedConfiguration|APPLICATION_URL|INITIAL_PROJECT_KEY|inheritAs|scripts:" ../connect.yaml; echo "grep-exit=$?"
    ```
  - **Expected**: `1 visualizer merchant-center-custom-application name,applicationType,configuration`, then
    `[["CUSTOM_APPLICATION_ID",true,null,true],["ENTRY_POINT_URI_PATH",true,"visualizer",true],["CLOUD_IDENTIFIER",true,"gcp-eu",true]]`, then **no** grep lines and `grep-exit=1`.
    (`js-yaml` is already installed as a dependency of ESLint; a YAML syntax error prints a `YAMLException` with a line number.)

## 3. Config file: `INITIAL_PROJECT_KEY` and header comment

- [x] 3.1 Stop requiring `INITIAL_PROJECT_KEY` at build time
  - **File**: `visualizer/custom-application-config.mjs`
  - **Do**: replace the line
    `      initialProjectKey: '${env:INITIAL_PROJECT_KEY}',`
    with the three lines
    ```js
          // Local development only (`npm start`, `npm run login`); NOT a Connect setting.
          // Put your real project key in visualizer/.env.local (see .env.example).
          initialProjectKey: process.env.INITIAL_PROJECT_KEY ?? 'your-project-key',
    ```
    Leave `production: { applicationId, url }`, `entryPointUriPath` and `cloudIdentifier` placeholders **unchanged**.
  - **Why**: the build resolves every `${env:...}` placeholder, even the `development` ones, and aborts when one is undefined (design facts table). Connect will never set this key, so the placeholder must go. `process.env.X ?? 'default'` is plain JavaScript evaluated when the config is loaded; `.env.local` is already loaded by then.
  - **Pitfalls**: keep single quotes (Prettier/ESLint enforce them) and the line under 80 characters (it is 79). Do not turn `'${env:...}'` strings of the other fields into `process.env`: they must stay placeholders (the skill's contract, and `CUSTOM_APPLICATION_ID` etc. are substituted by Connect).
  - **Verify**: `cd "$DST/visualizer" && npx eslint custom-application-config.mjs && npx prettier --check custom-application-config.mjs`
  - **Expected**: no ESLint output; `All matched files use Prettier code style!`.

- [x] 3.2 Prove the build no longer needs the key (temporary shell, no files)
  - **Do**:
    ```bash
    cd "$DST/visualizer" && mv .env /tmp/e-before/.env.moved 2>/dev/null
    env -i PATH="$PATH" HOME="$HOME" ENTRY_POINT_URI_PATH=visualizer CLOUD_IDENTIFIER=gcp-eu CUSTOM_APPLICATION_ID=TODO APPLICATION_URL=https://localhost npm run build 2>&1 | tail -n 3; echo "exit=${PIPESTATUS[0]}"
    ```
    (zsh: `${pipestatus[1]}`.) `env -i` starts with an empty environment so nothing leaks in from your shell.
  - **Expected**: `Compiled successfully.` and `exit=0`. (`.env` was moved away in the first command on purpose; task 6 deletes it for good.)
  - **Why**: this is exactly Connect's situation: four injected variables, no `INITIAL_PROJECT_KEY`, no `.env`.
  - **Pitfalls**: `Missing environment variable 'INITIAL_PROJECT_KEY'` = task 3.1 not saved. `Missing ... 'APPLICATION_URL'` = you forgot it in the `env -i` line (Connect provides it; locally set any URL).

## 4. Scope audit (least privilege)

Goal: every scope in the config is used by something, and everything the app calls is covered. Evidence
first, edit second. Use the audit table in `design.md` D5 as the starting point.

- [ ] 4.1 List every GraphQL operation the app can send
  - **Do**: `cd "$DST/visualizer" && grep -rhoE "^(query|mutation) [A-Za-z]+" src --include='*.graphql' | sort`
  - **Expected**: at least these 27 (B/C may add more; each must be mapped in 4.4): `mutation CreateExtension, CreateOrUpdateCustomObject, CreateState, CreateSubscription, CreateTypeDefinition, DeleteCustomObject, DeleteExtension, DeleteState, DeleteSubscription, DeleteTypeDefintion, UpdateExtension, UpdateState, UpdateSubscription, UpdateTypeDefinition` and `query FetchExtensionDependencyCandidates, FetchExtensions, FetchState, FetchStates, FetchSubscription, FetchSubscriptions, FetchType, FetchTypeFieldTypes, FetchTypeWithDefinitionByName, FetchTypes, GetCustomObject, GetCustomObjects, GetExtension`.
  - **Why**: each name belongs to one resource (state, type, subscription, extension, custom object) and so to one scope pair.

- [ ] 4.2 List REST calls through the Merchant Center API proxy (the restored pages)
  - **Do**:
    ```bash
    cd "$DST/visualizer"
    grep -rnE "MC_API_PROXY_TARGETS|useAsyncDispatch|sdkActions|actions\.(get|post)" src --include='*.ts' --include='*.tsx' | grep -v -E "\.spec\.|types/generated"
    grep -rnE "'/(business-units|customers|stores|channels|products|categories|product-selections|cart-discounts|standalone-prices|customer-groups|product-types|types|custom-objects)[/'?{]" src --include='*.ts' --include='*.tsx' | grep -v -E "\.spec\.|types/generated"
    ```
  - **Expected**: matches in `src/components/visualize-drilldown/**` (and possibly `entity-diagram/**`): the drilldown reads `/business-units`, `/customers`, `/stores`, `/channels`, `/products`, `/categories`, `/product-selections`, `/cart-discounts`, `/standalone-prices`, `/customer-groups`, `/products/{id}/product-selections`, `/product-selections/{id}/products`; the diagram reads product types/types/custom objects. Write down the exact endpoint list you see.
  - **Why**: REST paths are the second source of scope needs (GraphQL files are only part of it).
  - **Pitfalls**: if nothing matches, C's code is not in the tree: go back to 0.2. If you find an endpoint not in design D5 (for example `/zones`), look it up (4.4) and add a row.

- [ ] 4.3 Prove orders / shopping lists / carts / quotes are not used
  - **Do**: `cd "$DST/visualizer" && grep -rnE "(^|[^A-Za-z])(orders|shoppingLists|carts)[[:space:]]*\(|/orders|/shopping-lists|/carts|/quote" src --include='*.ts' --include='*.tsx' --include='*.graphql' | grep -v -E "\.spec\.|types/generated|i18n"; echo "grep-exit=$?"`
  - **Expected**: no lines, `grep-exit=1` (planning-time result on the source). Words like `Order` in `state-types.ts` or in Extension resource-type lists are enum names, not API calls.
  - **Why**: justifies removing `view_orders`, `manage_orders`, `view_shopping_lists`, `manage_shopping_lists` (D and E agree; D normally already removed them).
  - **Pitfalls**: if lines appear, that code path needs the scope: keep it and add a comment in the config naming the file.

- [ ] 4.4 Map every operation/endpoint to a scope and fill the audit table
  - **Do**: for each name from 4.1/4.2 look up the scope in the commercetools scope reference
    (`https://docs.commercetools.com/api/scopes`, or MCP search "Merchant Center API scopes `<resource>`"). Copy the table from `design.md` D5 into a scratch note and fix it so that: every row cites at least one operation/endpoint from your lists; scopes needed but missing are marked **add**; scopes without operation are marked **remove**.
  - **Rules of thumb**: read-only call -> `view_<resource>` goes in `oAuthScopes.view`; any create/update/delete -> `manage_<resource>` goes in `oAuthScopes.manage`; subscriptions and API extensions only have `manage_`. Customer groups: `view_customers` is expected to cover them; only add `view_customer_groups` if change D/F saw a live 403 (see D task 7.3).
  - **Expected result at planning time** (re-derive, do not just copy):
    - `view`: `view_states`, `view_types`, `view_key_value_documents`, `view_products`, `view_customers`, `view_business_units`, `view_stores`, `view_product_selections`, `view_categories`, `view_cart_discounts`, `view_standalone_prices`
    - `manage`: `manage_states`, `manage_types`, `manage_subscriptions`, `manage_extensions`, `manage_key_value_documents`
    - removed: `view_orders`, `manage_orders`, `view_shopping_lists`, `manage_shopping_lists`
  - **Why**: a scope too many = users/admins grant data access the app never uses; a scope too few = a page silently shows empty data (403 from the proxy).
  - **Pitfalls**: `view_products` also covers Product Types and Channels (backward compatible, `view_product_types`/`view_channels` exist as narrower scopes); we keep `view_products` because the drilldown needs Products anyway. `view_categories` may overlap with `view_products` but resource-specific scopes are preferred; keep it.

- [ ] 4.5 Make the config equal the audit result
  - **File**: `visualizer/custom-application-config.mjs`, block `oAuthScopes`.
  - **Do**: edit the two arrays so they contain exactly the audited lists (one scope per line, `view` group first, keep the order of the audit). If D already did it, only verify.
  - **Verify**:
    ```bash
    cd "$DST/visualizer" && sed -n '/oAuthScopes/,/^  },/p' custom-application-config.mjs
    grep -nE "orders|shopping_lists" custom-application-config.mjs; echo "grep-exit=$?"
    ```
  - **Expected**: the `sed` prints the `oAuthScopes` block containing exactly your audited lists (`view: [...]` then `manage: [...]`); `grep-exit=1`.
  - **Pitfalls**: do not try `node -e "import ..."` on this file: it imports `./src/constants` (TypeScript), which plain Node cannot load.

- [ ] 4.6 Check the scope names exist (typos silently grant nothing)
  - **Do**: for every scope in the final lists, confirm the exact spelling in `https://docs.commercetools.com/api/scopes` (or the MCP tool `commercetools-documentation-search`, query "scopes `<name>`").
  - **Expected**: all 16 names are found (planning-time lookup already confirmed: `view_categories`, `view_cart_discounts`, `view_standalone_prices`, `view_types`, `manage_types`, `view_states`, `manage_states`, `view_key_value_documents`, `manage_key_value_documents`, `manage_extensions`, `manage_subscriptions`, `view_products`, `view_product_selections`, `view_stores`, `view_business_units`, `view_customers` all exist).
  - **Why**: R-quality: wrong names are only noticed when a user hits a 403.

## 5. Menu-link permissions

- [ ] 5.1 Make every link explicit
  - **File**: `visualizer/custom-application-config.mjs`, `mainMenuLink` and `submenuLinks`.
  - **Do**: in each submenu entry replace the comment `// permissions: [PERMISSIONS.View],` by `permissions: [PERMISSIONS.View],`; add the same line to the two restored entries (`visualize-drilldown`, `entity-diagram`) if D left them without; keep `mainMenuLink.permissions: [PERMISSIONS.View]`.
  - **Why**: skill checklist ("set permissions on menu links"); behaviour is unchanged because opening the app already needs View (design D6). `Manage` is **not** used for any link on purpose (commit `aa95bd4`).
  - **Pitfalls**: leave `labelAllLocales: []` as is. Do not use `Manage` for Subscriptions/Extensions even though their API needs `manage_` scopes (open question QE1 decides later).
  - **Verify**: `cd "$DST/visualizer" && grep -c "permissions:" custom-application-config.mjs; grep -n "// *permissions" custom-application-config.mjs; echo "grep-exit=$?"`
  - **Expected**: `8` (1 main link + 7 submenu links), then no commented lines and `grep-exit=1`.

- [ ] 5.2 Re-run lint and typecheck on the config
  - **Do**: `cd "$DST/visualizer" && npx eslint custom-application-config.mjs && npx prettier --check custom-application-config.mjs && npm run typecheck 2>&1 | tail -n 3`
  - **Expected**: no ESLint output, `All matched files use Prettier code style!`, typecheck banner with no `error TS`.

## 6. Environment files

- [x] 6.1 Create `visualizer/.env.example`
  - **File**: `$DST/visualizer/.env.example` (new)
  - **Do**:
    ```bash
    cat > "$DST/visualizer/.env.example" <<'EOF'
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
    EOF
    ```
    (Make sure there is no leading indentation in the file.)
  - **Why**: documents every variable in one place (D4). All values are harmless placeholders so the file is safe to publish.
  - **Verify**: `grep -cE "^[A-Z_]+=" "$DST/visualizer/.env.example"; grep -nE "KEY=|SECRET|TOKEN|PASSWORD" "$DST/visualizer/.env.example"`
  - **Expected**: `7`, then exactly one line `INITIAL_PROJECT_KEY=your-project-key` (a placeholder, not a secret) and nothing else.

- [x] 6.2 Delete the tracked `.env`
  - **Do**: `rm "$DST/visualizer/.env" /tmp/e-before/.env.moved 2>/dev/null; ls -a "$DST/visualizer" | grep -E "^\.env"`
  - **Expected**: only `.env.example` is listed (task 3.2 may already have moved `.env` to `/tmp`; the `rm` handles both cases, errors are hidden on purpose).
  - **Why**: the labs publish gate fails on any `.env` file, and a stray `ENTRY_POINT_URI_PATH` there could fight with Connect's value (D4). The copy of the original stays in `/tmp/e-before/.env`.

- [x] 6.3 Fix `.gitignore`
  - **File**: `$DST/.gitignore`
  - **Do**: replace the lines `!.env` and `.env.local` with
    ```
    .env
    .env.local
    .env.*.local
    ```
    Keep the other lines (`node_modules`, `coverage`, `.terraform`, `*.tfvars`, `.DS_Store`, `.vscode`, `.idea`, `build/`, `public/`). Do **not** add a rule that would ignore `.env.example`.
  - **Why**: the old `!.env` force-included the file in git; now real env files are ignored and the example stays tracked.
  - **Verify**:
    ```bash
    cd "$DST" && touch visualizer/.env visualizer/.env.local
    git check-ignore -v visualizer/.env visualizer/.env.local; git check-ignore visualizer/.env.example; echo "example-ignored-exit=$?"
    rm visualizer/.env visualizer/.env.local
    ```
  - **Expected**: two lines naming `.gitignore:` rules for `.env` and `.env.local`; nothing for the example and `example-ignored-exit=1`. (The `touch`/`rm` pair only creates throw-away files for the test.)

- [x] 6.4 Build and test with only `.env.local` (simulates a fresh clone)
  - **Do**:
    ```bash
    cd "$DST/visualizer" && cp .env.example .env.local
    env -i PATH="$PATH" HOME="$HOME" npm run build 2>&1 | tail -n 3; echo "build-exit=${PIPESTATUS[0]}"
    env -i PATH="$PATH" HOME="$HOME" CI=true npm test 2>&1 | grep -E "^(Test Suites|Tests):"
    ```
  - **Expected**: `Compiled successfully.` / `build-exit=0`; then `Test Suites: N passed, N total` and `Tests: M passed, M total`, with N and M **equal to the counts D recorded when it finished** (A baseline was 50 / 846; B/C/D add more; the numbers must not drop). About 1-2 minutes each.
  - **Why**: proves nothing depended on the deleted `.env` and that `.env.local` is picked up (it is how every developer and the clean-clone proof in change I will work).
  - **Pitfalls**: leave `.env.local` in place afterwards (it is git-ignored via `.git/info/exclude` and `.gitignore`); remove it only in change I's final cleanup if that task says so.

## 7. Remove other delivery paths and dangling references

- [x] 7.1 Prove the files are absent
  - **Do**:
    ```bash
    cd "$DST" && find . \( -name node_modules -o -name .git -o -name openspec -o -name plans -o -name .claude \) -prune -o \( -name netlify.toml -o -name .github -o -name dependabot.yml -o -name dependabot.yaml -o -name '.env' -o -name '.env.local' \) -print
    ls .github netlify.toml 2>&1 | head -n 2
    ```
  - **Expected**: the `find` prints only `./visualizer/.env.local` (the file from task 6.4, git-ignored, fine); `ls` prints two `No such file or directory` lines.
  - **Why**: R4 (no workflows) and the single delivery path.

- [x] 7.2 Find every textual reference
  - **Do**: `cd "$DST" && grep -rniE "netlify|dependabot|\.github|ci\.yml|github actions" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=public --exclude-dir=openspec --exclude-dir=plans --exclude-dir=.claude --exclude=package-lock.json --exclude=ctp.json | cut -c1-140`
  - **Expected** (planning-time): hits in `CLAUDE.md` (the "repo root only holds ... `netlify.toml`" sentence and the "CI (`.github/workflows/ci.yml`)" paragraph) and `FEATURES.md` (3 places: intro sentence, the "`netlify.toml` SPA rewrite" bullet, the "CI (`.github/workflows/ci.yml`)" bullet). **README.md has none.**

- [x] 7.3 Edit exactly those sentences
  - **Files / replacements**:
    - `CLAUDE.md` (lines ~9-11): `... only holds \`connect.yaml\` (the commercetools Connect\ndeployment descriptor), \`netlify.toml\`, and \`specs/\` ...` -> remove "`netlify.toml`, " so it reads "... deployment descriptor) and `specs/` ...".
    - `CLAUDE.md` (lines ~29-30, the "CI (...)" paragraph): replace with `There is no CI configuration in this repo (no GitHub Actions on purpose); delivery goes through commercetools Connect. Run \`npm run typecheck\`, \`npm run lint\`, \`npm test\` and \`npm run build\` yourself before a release.`
    - `CLAUDE.md` (lines ~62-68, "Environment / credentials" first bullet): replace the `.env`-is-checked-in bullet with `- \`visualizer/.env.example\` documents the variables; copy it to \`.env.local\` (git-ignored). On Connect the values come from \`connect.yaml\` and Connect itself. \`INITIAL_PROJECT_KEY\` is used only for local development and \`generate-types:ctp\`.`
    - `FEATURES.md` (line ~14): delete "with a matching `netlify.toml` SPA rewrite for local/preview hosting" (keep the rest of the sentence grammatical).
    - `FEATURES.md` (lines ~153-154): delete the whole "`netlify.toml` SPA rewrite" bullet (2 lines).
    - `FEATURES.md` (lines ~177-178): replace the CI bullet with `- No CI configuration is shipped (no GitHub Actions); delivery goes through Connect.`
    - `FEATURES.md` (lines ~148-149): the Connect bullet that lists `INITIAL_PROJECT_KEY`: remove that key from the list (three keys remain).
  - **Why**: no sentence may point at files that no longer exist. G rewrites these documents fully later; we only remove false statements.
  - **Pitfalls**: do not touch the lines about Former visualizations "not being reimplemented": D/G handle those. Keep Markdown list indentation.
  - **Verify**: rerun 7.2.
  - **Expected**: no output.

## 8. README connector section and local-dev text

- [x] 8.1 Replace the Installation text
  - **File**: `$DST/README.md`, section `## Installation` (currently one sentence "... pre-packaged to run as a connect application. Follow the public documentation ...").
  - **Do**: replace that sentence with: `The Visualizer is delivered through commercetools Connect. See [Deploy with commercetools Connect](#deploy-with-commercetools-connect).`
  - **Pitfalls**: other README sections (screenshots, feature list) belong to G: do not edit them.

- [ ] 8.2 Generate the scopes table from the config (so README = config)
  - **Do**: from the audit table (task 4.4) build rows `| scope | View/Manage | used for |`. One row per scope in the final config; e.g.
    ```
    | `view_states` | View | States list, detail and flow diagram |
    | `manage_states` | Manage | Create, edit, delete States |
    | `view_types` | View | Types; Entity Diagram |
    | `manage_types` | Manage | Create, edit, delete Types |
    | `manage_subscriptions` | Manage | Subscriptions (the API has no `view_` scope) |
    | `manage_extensions` | Manage | API Extensions (the API has no `view_` scope) |
    | `view_key_value_documents` | View | Custom Objects; Entity Diagram schemas |
    | `manage_key_value_documents` | Manage | Edit/delete Custom Objects; Entity Diagram saves its layout |
    | `view_products` | View | Visualize Drilldown: products, channels; Entity Diagram: product types |
    | `view_customers` | View | Visualize Drilldown: customers, associates, customer groups |
    | `view_business_units` | View | Visualize Drilldown: business units |
    | `view_stores` | View | Visualize Drilldown: stores |
    | `view_product_selections` | View | Visualize Drilldown: product selections |
    | `view_categories` | View | Visualize Drilldown: categories |
    | `view_cart_discounts` | View | Visualize Drilldown: cart discounts |
    | `view_standalone_prices` | View | Visualize Drilldown: standalone prices |
    ```
  - **Verify (config equals README)**:
    ```bash
    cd "$DST" && grep -oE "'(view|manage)_[a-z_]+'" visualizer/custom-application-config.mjs | tr -d "'" | sort -u > /tmp/e-scopes-config.txt
    grep -oE "^\| \`(view|manage)_[a-z_]+\`" README.md | tr -d '|` ' | sort -u > /tmp/e-scopes-readme.txt
    diff /tmp/e-scopes-config.txt /tmp/e-scopes-readme.txt && echo SCOPES-MATCH; wc -l < /tmp/e-scopes-config.txt
    ```
  - **Expected**: `SCOPES-MATCH` and `16` (or the audited count).
  - **Why**: the connector README must state the exact scopes (skill Pattern 6); a drift is a review finding.

- [x] 8.3 Insert the Connect section
  - **Do**: after `## Installation`, paste the markdown block of `design.md` D8 (from `## Deploy with commercetools Connect` to the end of the runbook table); replace the `<!-- paste the table ... -->` comment with the table from 8.2. Keep headings `Configuration`, `Scopes (permissions)`, `Failure behaviour`, `Installation and release order`, `Operations runbook`.
  - **Pitfalls**: the D8 block is wrapped in a four-backtick fence in the design file only to show nested code; do not paste the fence lines themselves. Check the table pipes `|` line up (a missing pipe breaks the table).
  - **Verify**: `cd "$DST" && grep -nE "^## Deploy with commercetools Connect|^### (Configuration|Scopes|Failure behaviour|Installation and release order|Operations runbook)" README.md; grep -ciE "fail-open|fail-closed" README.md; grep -ciE "poison" README.md`
  - **Expected**: six heading lines in that order; the last two numbers are each `>= 1`.

- [x] 8.4 Fix the "Local Development" section
  - **File**: `README.md`, section `## Local Development` (currently shows a `.env.local` template with `CLOUD_IDENTIFIER`, `CUSTOM_APPLICATION_ID`, `APPLICATION_URL`, `INITIAL_PROJECT_KEY`).
  - **Do**: replace the dotenv block and the sentence before it with
    `Copy the example file and set your project key (and region):` followed by a shell block
    `cd ./visualizer`, `cp .env.example .env.local`, `# edit .env.local: INITIAL_PROJECT_KEY, CLOUD_IDENTIFIER`, `npm ci`, `npm run login`, `npm start`;
    then one sentence: `The app opens at http://localhost:3001/<your-project-key>/visualizer once the Custom Application is registered with the local URL, see Merchant Center docs "Custom Applications".`
  - **Why**: `.env` no longer exists; `.env.example` is the single template. `npm run login` is `mc-scripts login` (interactive browser login).
  - **Pitfalls**: `npm start` works for development without registering the app only in the way documented in manual step M10; do not promise more.
  - **Verify**: `grep -n "\.env" README.md`
  - **Expected**: mentions of `.env.example` and `.env.local` only; no mention of plain `.env`.

## 9. Regression checks (everything still green)

- [x] 9.1 Typecheck, lint, tests, build
  - **Do**:
    ```bash
    cd "$DST/visualizer"
    npm run typecheck 2>&1 | tail -n 2; echo "typecheck=${PIPESTATUS[0]}"
    npm run lint 2>&1 | tail -n 4; echo "lint=${PIPESTATUS[0]}"
    CI=true npm test 2>&1 | grep -E "^(Test Suites|Tests):"
    npm run build 2>&1 | tail -n 2
    ```
  - **Expected**: `typecheck=0` with no `error TS`; `lint=0` and a summary of the same warning count D recorded (A baseline: `14 warnings`, 0 errors); test counts equal to D's; build `Compiled successfully.`.
  - **Why**: proves E broke nothing; any lint error in `custom-application-config.mjs` shows up here.

- [x] 9.2 Production bundle smoke test (the HTML Connect will serve)
  - **Do**:
    ```bash
    cd "$DST/visualizer" && (npm run start:prod:local > /tmp/e-serve.log 2>&1 &) ; sleep 30
    curl -s -o /dev/null -w "http=%{http_code}\n" http://localhost:3001/
    tail -n 2 /tmp/e-serve.log
    pkill -f "mc-scripts.*serve"; sleep 1; lsof -i :3001 | head -n 2
    ```
  - **Expected**: `http=200`; log shows `Running at http://localhost:3001`; after `pkill` the `lsof` prints nothing.
  - **Why**: `start:prod:local` compiles the HTML in development mode and serves the built `public/`; it is the closest local check of what Connect serves. (Full in-Merchant-Center testing is change F.)
  - **Pitfalls**: if port 3001 is busy (`EADDRINUSE`) stop the other dev server first. Always run the `pkill` line, otherwise a server keeps running.

## 10. `commercetools connect validate`

- [ ] 10.1 Run the validator from the repo root
  - **Do**: `cd "$DST" && commercetools connect validate . > /tmp/e-validate-after.log 2>&1; echo "exit=$?"; tail -n 30 /tmp/e-validate-after.log`
  - **Expected**: `exit=0` and a success message with no errors for application `visualizer`. The exact wording is **unknown** (could not run at planning time without Docker); paste the final 15 lines into **Notes**.
  - **Why**: the skill's gate before any staging (Pattern checklist: "`connect validate` passes").
  - **Pitfalls**:
    - `Cannot connect to the Docker daemon` -> task 0.3.
    - If it reports an unknown/forbidden field in `connect.yaml`, fix only that field and re-run; do **not** re-add `endpoint`, `securedConfiguration` or `APPLICATION_URL`.
    - If it complains about tests/analysis rather than the manifest, re-run once with `--skip tests` (or `--skip analysis`), note which step failed and why, and compare with the "before" log from task 1.3. A failure that already existed before your edits is **not** caused by this change: record it and tell the owner.
    - If it demands something that contradicts the skill, stop and record an open question (do not guess).
  - **Verify**: `exit=0` (or the documented, pre-existing exception).

## 11. Owner-gated release steps (document only, do NOT run)

- [x] 11.1 Confirm the runbook is complete
  - **Do**: re-read `design.md` D9 and the README section "Installation and release order"; make sure they mention, in this order: register in MC with placeholder URL (M3), Connect CLI login (M4), tag, `connectorstaged create`, `preview`, `publish`, `deployment create` in the same region, copy `applications[].url` into MC (M7), assign Team permissions.
  - **Expected**: all steps present, no secret values, every `<placeholder>` angle-bracketed.
  - **Why**: J will execute them with the owner; vague steps cause wrong-region deployments (the skill's most common failure).

- [x] 11.2 Check the owner lists contain the E items
  - **Do**: check the owner notes (not part of this repository) for the E questions QE1-QE3 and manual steps ME1-ME2
  - **Expected**: QE1, QE2, QE3 in `owner-questions.md`; ME1, ME2 in `manual-steps.md` (they were appended when this change was planned; if missing, append them from the design Risks table with the next free numbers; never overwrite existing rows).

## 12. Final review against the skill checklist

- [ ] 12.1 Tick the checklist (write the evidence next to each item in **Notes**)
  - [ ] App-vs-view deliberate: application (own route + menu). Evidence: `connect.yaml` type.
  - [ ] `${env:...}` placeholders for `applicationId`, `url`, `entryPointUriPath`, `cloudIdentifier`; no hard-coded per-project values (`initialProjectKey` fallback is dev-only). Evidence: `grep -n "\${env:" visualizer/custom-application-config.mjs` shows 4 placeholders (`ENTRY_POINT_URI_PATH`, `CLOUD_IDENTIFIER`, `CUSTOM_APPLICATION_ID`, `APPLICATION_URL`).
  - [ ] `oAuthScopes` only what the UI uses; menu permissions set. Evidence: task 4.5 and 5.1 output.
  - [ ] Tested locally through the shell (existing Jest specs with `renderAppWithRedux`) and the permission-denied path exists in specs: `grep -rln "useIsAuthorized\|PERMISSIONS" visualizer/src --include='*.spec.tsx' | head -n 3` lists at least one spec (if none, note it for F).
  - [ ] `connect.yaml` has no stray `endpoint`/`securedConfiguration`/`APPLICATION_URL`. Evidence: task 2.1 grep.
  - [ ] Register-first / URL-last documented. Evidence: README steps.
  - [ ] Region/cloudIdentifier consistency documented. Evidence: README table + design D3.
  - [ ] README documents configuration table, scopes, fail stance (N/A with reason), poison-message (N/A with reason), runbook.
  - [ ] No `.github`, `netlify.toml`, `.env` in the tree.
  - [ ] Nothing committed, tagged or pushed: `git -C "$DST" rev-list --count HEAD` prints `1`.

- [ ] 12.2 Hand-over to later changes (copy into their tasks if absent)
  - F: test with a View-only user (M9): Subscriptions/Extensions pages (QE1); Connect-served run only after M3.
  - G: README/CLAUDE.md/FEATURES.md were minimally edited by E; rewrite on top, do not reintroduce Netlify/CI.
  - H: `visualizer/.env.example` is a source file for the gate (no SPDX needed: not a source extension); `connect.yaml` has no header (YAML is not in `requireSpdx`).
  - I/J: the clean-clone proof must run `cp visualizer/.env.example visualizer/.env.local` before `npm run build`; J runs section 11 with the owner and tags the release.

## Notes (fill in while working)

- `connect validate` before (task 1.3): not run, Docker daemon off (manual, see plans/todos.md)
- `connect validate` after (task 10.1): not run, Docker daemon off (manual)
- Final scope list (task 4.5): owned by change D (config oAuthScopes/submenuLinks); README table written from the agreed final list (16 scopes), must be re-verified after D merges (tasks 0.2, 4.x, 5.x, 8.2, 12.x left open).
- Anything unexpected: D not merged in this branch (only 5 uriPaths), so 0.2 and the D-owned tasks stay open; 1.1-1.3 skipped (git history gives the before state; Docker off).

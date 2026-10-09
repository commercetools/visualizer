## Why

Requirements R4 and R5 of the migration: the Visualizer must be delivered **only through
commercetools Connect** (no GitHub Actions, no Netlify) and its `connect.yaml`, config file and README
must follow the official `commercetools-connect` skill for Merchant Center custom applications.
Today the copy still has gaps against that contract: a dev-only value (`INITIAL_PROJECT_KEY`) is
declared as a required Connect setting, the config lists scopes no code uses (and, after changes B-D,
lacks scopes the restored pages need), a tracked `.env` would fail the public-repo gate, Netlify and CI
leftovers are referenced in the docs, and the README has no connector contract (configuration table,
scopes, failure stance, runbook).

## What Changes

- Rewrite `connect.yaml` to the skill contract: `applicationType: merchant-center-custom-application`,
  **no** `endpoint`, **no** `securedConfiguration`, **no** `APPLICATION_URL`, only
  `CUSTOM_APPLICATION_ID`, `ENTRY_POINT_URI_PATH` (default `visualizer`) and `CLOUD_IDENTIFIER`
  (default `gcp-eu`, valid values documented), each with a clear description.
- Remove `INITIAL_PROJECT_KEY` from `connect.yaml` (owner default Q7) **and** change
  `custom-application-config.mjs` so the build no longer needs it (today the build fails without it,
  even in production mode).
- Audit `oAuthScopes` line by line against the GraphQL operations and REST endpoints the code really
  uses; remove unused scopes, keep/add exactly the ones needed (final list comes from change D, verified
  here); make every menu link carry an explicit `permissions` entry.
- Replace the tracked `visualizer/.env` with `visualizer/.env.example` (documented placeholders) and fix
  `.gitignore` so `.env`/`.env.local` are ignored.
- Make sure `netlify.toml`, `.github/` (workflows, dependabot) do not exist and nothing references them.
- Add a "Deploy with commercetools Connect" section to `README.md`: configuration table, scopes table,
  fail-open/fail-closed statement (not applicable, and why), operations runbook, install/deploy steps.
- Run `commercetools connect validate` and a local production-bundle smoke test.
- Document (not execute) the owner-gated release steps: register the app in Merchant Center (M3),
  authenticate the Connect CLI (M4), staged -> preview -> publish -> deploy, then paste the deployed URL
  back into Merchant Center (M7).

## Capabilities

### New Capabilities
- `connect-delivery`: how the Visualizer is configured and delivered through Connect: the
  `connect.yaml` contract, the config-file placeholders, least-privilege scopes and menu permissions,
  environment-file hygiene, absence of other delivery paths, and the README connector contract.

### Modified Capabilities
<!-- none: openspec/specs/ is empty -->

## Impact

- Files edited: `connect.yaml`, `visualizer/custom-application-config.mjs`, `.gitignore`, `README.md`,
  small sentences in `CLAUDE.md` and `FEATURES.md` that mention Netlify/CI.
- Files removed: `visualizer/.env` (replaced by `visualizer/.env.example`).
- Behaviour for users: unchanged (menu entries and permissions stay equivalent; only unused scopes
  disappear). Clean-clone build now needs `cp visualizer/.env.example visualizer/.env.local` first
  (handed over to change I / J for their clean-clone proof).
- Requires Docker running for `commercetools connect validate`.
- Out of scope: restoring the two routes (B-D), docs screenshots (G), SPDX/licence (H), the actual
  Connect staging/publish/deploy (J, owner-gated).

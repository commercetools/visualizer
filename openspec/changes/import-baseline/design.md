## Context

**Source** (read-only, never edit): `$SRC` (private repo
`<internal-org>/<source-repo>`, 245 commits). **Target** (we write here):
`<repo-root>` (remote `commercetools/visualizer`, one commit
`27b866d` containing only `README.md`; untracked `.claude/`, `openspec/`, `plans/`).

The source repo has a nesting that surprises people: the repo root holds `connect.yaml`, `specs/`,
docs and tooling, while the real application (its own `package.json`, `node_modules`, tests) is in
the sub-folder `visualizer/`. So the app is at `<repo>/visualizer/`. Commands such as
`npm ci` and `npm test` are always run **inside `visualizer/`**, never at the repo root.

This change is "A" in `plans/dependency-plan.md`. Every other change depends on it.

### Planning-time dry run (facts verified before writing this plan)

A throw-away copy was made in the scratchpad (not in this repo) using exactly the command below.
Results the junior developer should expect:

| Check | Result seen |
|---|---|
| Files copied | 302 (identical to `git ls-files` of the source minus excluded paths) |
| Size before `npm ci` | about 10 MB |
| `npm ci` | exit 0, many `npm warn deprecated ...` lines, ends with an `npm audit` notice; the `postinstall` hook runs `chakra typegen` |
| `npm run typecheck` | exit 0, prints only the `> tsc --noEmit` banner |
| `npm test` | `Test Suites: 50 passed, 50 total` / `Tests: 846 passed, 846 total`, about 80 s |
| `npm run lint` (as copied) | **exit 1: 13 errors**, all `prettier/prettier` in `scripts/screenshots/capture.mjs` (5) and `login.mjs` (8); 14 warnings |
| `npm run lint` (after prettier only) | still 2 errors: `import/no-unresolved` for `playwright` (that sub-folder has its own `package.json`, its dependencies are not installed by the root `npm ci`) |
| `npm run lint` (after adding `scripts/screenshots/**` to ignores) | **exit 0, 0 errors, 14 warnings** |
| `npm run build` without env vars | webpack compiles, then fails: `Error: Missing environment variable 'CLOUD_IDENTIFIER' specified in config as 'env:CLOUD_IDENTIFIER'.` (exit 1) |
| `npm run build` with env vars | exit 0, `Compiling index.html... Compiled successfully.`, 188-190 files in `public/` |

The original CI (`.github/workflows/ci.yml`) never ran `lint` or `typecheck`, which is why the
lint failure was never noticed. This is a **pre-existing** problem, not caused by the copy.

## Goals / Non-Goals

**Goals**
- A repeatable, explicit copy (anyone can re-run the same command and get the same tree).
- Never import history, workflows, secrets, machine-specific files or build output.
- Protect our local planning folders from accidental commit.
- A recorded baseline (numbers) so later changes can prove "I did not break anything".

**Non-Goals**
- No code changes except the one-line ESLint ignore.
- No cleanup of content (`.env`, README, `connect.yaml`, `specs/` names, SPDX): later changes.
- No commit, no push, no history work (change I/J).
- No upgrade of dependencies (versions stay as in `package-lock.json`).

## Jargon (read once)

- **rsync**: a command-line tool that copies a folder tree and can skip paths (`--exclude`).
  macOS ships `openrsync`; the flags below work with it.
- **Anchored pattern**: an exclude that starts with `/` (e.g. `/.claude`) matches only at the top
  of the copy, not in sub-folders. Unanchored `coverage` matches at any depth.
- **`npm ci`**: installs exactly what `package-lock.json` says and **fails** if the lock file and
  `package.json` disagree. `npm install` may rewrite the lock file, so we do not use it.
- **Baseline**: the measured state of checks right after the copy, before we change features.
- **`.git/info/exclude`**: a personal ignore list stored inside `.git/`; it is never committed or
  pushed (unlike `.gitignore`).
- **MC / Merchant Center**: the commercetools back-office UI that hosts this custom application.
- **Connect**: commercetools' hosting service; it builds and serves the app.

## Decisions

### D1. Use `rsync` with an explicit exclude list (not `git archive`)

`rsync -a SRC/ DST/` copies the working tree. We chose it because the exclude list is visible in
one command and can be dry-run (`-n`). `git archive` is the alternative (copies only committed
files, so `.git`, `node_modules`, `public`, `.DS_Store` are impossible by construction) and is used
here as the **independent cross-check**: the verification step compares the copied tree to
`git ls-files` of the source. If both agree, nothing was missed or added.

Never pass `--delete` to rsync: it would remove `.claude/`, `openspec/` and `plans/` from the
target because they do not exist in the source. Never copy `.git`.

### D2. The exclude list and why each entry exists

| Pattern (anchored with `/` = top level only) | Why it is excluded |
|---|---|
| `/.git` | The source history (245 commits, personal e-mails, possibly old secrets). We start a fresh single commit later (change I). Copying it would also destroy this repo's own `.git`. |
| `/.github` | Requirement R4: no GitHub workflows/Actions. Only `ci.yml` exists there; Connect is the delivery path. |
| `/netlify.toml` | Hosting moves to Connect; a Netlify config in a public repo suggests a second, unsupported deployment path. (E also checks it is gone.) |
| `/node_modules`, `/visualizer/node_modules` | Re-created by `npm ci`; huge and platform specific. (The source root has an empty-ish `node_modules`; the app one may be absent.) |
| `/visualizer/public` | Build output of `mc-scripts build` (about 41 MB, 190 files, gitignored in the source). It is regenerated by `npm run build`. |
| `google*.html` | A Google site-verification file that appears inside `visualizer/public/` after a build. Belt and braces: it must never be copied in case it exists elsewhere. |
| `/.serena` | Local Serena (code-assistant) cache and memories; private to the previous developer (owner decision Q6: drop). |
| `/.specify` | spec-kit tooling (scripts/templates/constitution). Not part of the product; Q6 default: drop. (The *output* `specs/` is kept, per Q5.) |
| `/.claude` | Source's Claude Code settings and skills. **This repo has its own `.claude/`** (the OpenSpec `opsx` commands we are using right now); copying would overwrite it. Also contains `settings.local.json` (machine specific). |
| `/.vscode`, `/.idea` | Editor settings, personal. |
| `/visualizer/.env.local` | Would hold personal project keys/secrets (none exist today; precaution). |
| `/visualizer/scripts/screenshots/node_modules`, `/visualizer/scripts/screenshots/auth-state.json` | Playwright dependencies and a saved **login session** (cookies). Must never be copied or published. |
| `coverage` | Jest coverage output, generated. |
| `.DS_Store` | macOS Finder metadata. |
| `yarn.lock`, `pnpm-lock.yaml` | The project uses npm (`package-lock.json`); a second lock file would confuse installs. None exist today; precaution. |

### D3. What is deliberately kept (and who cleans it)

| Kept path | Cleaned by | Note |
|---|---|---|
| `visualizer/.env` (tracked in source) | E | Public gate treats any `.env` as FAIL; E turns it into `.env.example`. We keep it now because `npm run build` reads `ENTRY_POINT_URI_PATH` from it. |
| `.gitignore` | E/H | Contains `!.env` (force-include). E flips this. |
| `connect.yaml` | E | Rewritten to the Connect contract. |
| `CLAUDE.md`, `FEATURES.md`, `README.md` | G | They still mention `netlify.toml` and `.github/workflows/ci.yml`. |
| `specs/` (23 files) | H | Three `data-model.md` files contain the string `<internal-org>` (gate FAIL until scrubbed). |
| `visualizer/docs/*.jpg/png` | G | README screenshots; Q9 default: regenerate. |
| `visualizer/scripts/screenshots/` | G | Separate Playwright sub-project with its own `package.json`; defaults to a project key `<project-key>` (review in H: internal-looking name). |
| `visualizer/schemas/ctp.json`, `src/types/generated/ctp.ts` | - | Generated GraphQL schema/types (large). Keep; the publish gate has a `generated` exclusion for them. Regenerating needs an interactive MC login, so we never run `generate-types:ctp` here. |

### D4. Lint fix = ignore the screenshot sub-project

Options: (a) run prettier on the two `.mjs` files (fixes 13 errors, leaves 2 `playwright`
resolution errors); (b) install Playwright at the root (adds a heavy dependency for a dev script);
(c) tell ESLint to ignore `scripts/screenshots/**` (the folder is a separate project with its own
`package.json`/lock file). We choose **(c)**: smallest, no new dependency, and the sub-project can
be linted in its own folder later. The edit is made in `visualizer/eslint.config.js` and then
formatted with `npx prettier --write` so that the file itself passes `prettier/prettier`.

### D5. Build environment variables

`custom-application-config.mjs` contains `${env:NAME}` placeholders. The build resolves **all** of
them, including the `development` section, and aborts on the first missing one. For the baseline
export these five variables (values are dummies, they are only substituted into the HTML):

```
ENTRY_POINT_URI_PATH=visualizer       # comes from visualizer/.env, nothing to export
CLOUD_IDENTIFIER=gcp-eu               # valid values: gcp-au gcp-eu gcp-us aws-eu aws-us (aws-fra/aws-ohio are legacy aliases)
CUSTOM_APPLICATION_ID=TODO
APPLICATION_URL=https://example.com
INITIAL_PROJECT_KEY=todo
```

Finding for change E: removing `INITIAL_PROJECT_KEY` from `connect.yaml` (owner decision Q7) is **not
enough**: the config file would still demand it at build time on Connect. E handles this. (A does
not change the config file.)

### D6. Local exclude instead of public `.gitignore`

`.claude/`, `openspec/`, `plans/` must exist on disk during the migration but not in the final
commit (Q6 default). Using `.git/info/exclude` keeps the public `.gitignore` free of
migration-specific noise. Change I re-verifies with `git add --dry-run .`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Re-running rsync later overwrites edits made in the target | Only run the copy once, at the very start. Later changes edit files in the target; the source is never copied again. If a re-copy is ever needed, use `-n` first and diff. |
| Wrong direction (target -> source) | Always type `$SRC/` first and `$DST/` second; the source is read-only by policy. The verification task checks `git -C $SRC status --porcelain` is still empty. |
| Missing trailing slash makes rsync create `SRC/SRC` | Both paths end with `/` in the command; verified by the layout check (`visualizer/package.json` exists). |
| `npm ci` pulls vulnerable/deprecated packages | Out of scope; record `npm audit` summary only. Do **not** run `npm audit fix`. |
| Node version drift (`.nvmrc` says 22; README says built on 22.16) | Use any Node 22.x; record the version in the baseline table. |
| 80 s test run seems "stuck" | It is normal; run with `CI=true npm test` to disable watch mode. |

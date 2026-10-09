## Context

**Everything marked REQUIRES OWNER APPROVAL changes something outside this laptop. Claude must not run it without the owner's explicit "go" in the conversation (manual step M6 for GitHub, M4/M7 for Connect/MC).** Read-only commands are marked READ-ONLY.

Glossary:
- **Public from the start**: GitHub keeps every pushed commit fetchable by its SHA even after a force-push or branch delete. So a repo that was ever public (or private-then-flipped with sensitive history) can leak. We therefore push the already-clean single commit and never publish history that was not gate-checked.
- **Custom property**: an org-wide typed label on repos. `commercetools-labs` (true/false) must be *defined* by an org admin before a repo can have a value (M5).
- **Topic**: a free-text tag on a repo page (`labs`).
- **Connect terms**: *connector* = the packaged app definition (from your git repo + tag); *staged* = registered privately; *preview/sandbox/production* = deployment types; *publish* = make a staged connector deployable to production in your org; *certify* = ask commercetools to list it publicly in the marketplace (not wanted, Q11).
- **MC Custom Application registration**: in Merchant Center Settings -> Custom Applications. It stores the app's name, entry point and URL; the **Application ID** it returns is `CUSTOM_APPLICATION_ID`.
- **SK**, **SCR**: as in change I.

Facts:
- Local state after change I: one commit, remote `origin` = `git@github.com:commercetools/visualizer.git`, nothing pushed. Backups in `$BK`.
- Old remote content (from the master plan): the target repo "currently has one commit `27b866d`" whose only file is README.md = `# visualizer` (verified locally before the reset; confirm what the remote really holds in task 1.4).
- Skill rules: create public (never private-then-flip), `gh repo create commercetools/<name> --public --description ...`, `git push -u origin main`, `gh api -X PATCH repos/commercetools/<name>/properties/values -f 'properties[][property_name]=commercetools-labs' -f 'properties[][value]=true'` (HTTP 422 = property not defined in org -> org admin, M5), `gh repo edit ... --add-topic labs`, then anonymous clone + `npm ci && npm run typecheck && npm test && npm run build`.
- Connect CLI (`@commercetools/cli`, command `commercetools`): `auth login`, `connect validate`, `connect connectorstaged create|describe|list|preview|publish|certify`, `connect deployment create|describe|logs|redeploy|list|delete`. (The master plan's M4 says "connect auth login"; the real command is `commercetools auth login ...`. Flags can change: always confirm with `--help`.) The CLI needs a git **repository URL + tag**, so the tag `v1.0.0` must be pushed first. The repo root must contain `connect.yaml` and a folder named exactly like `deployAs[].name` (`visualizer`) - already true.
- MC custom-app deployment order (Connect skill, Pattern 5): register with placeholder URL -> push + tag -> stage -> publish -> deploy -> read deployment URL -> update MC registration. M3 did the first step before F (placeholder `http://localhost:3001`).

## Goals / Non-Goals

**Goals:** public labs repo with one commit, marked, verified, released via Connect, with a tested rollback story.
**Non-Goals:** marketplace certification (Q11 default no), npm publishing (package stays `private: true`), adding GitHub Actions, content changes (those go through I again).

## Decisions

### D1. Decision tree for the remote (task 1.4 selects the branch)
| Detected state | Detection | Path |
|---|---|---|
| A. Repo does not exist | `gh repo view` fails with "Could not resolve to a Repository" / `git ls-remote` says "Repository not found" | `gh repo create commercetools/visualizer --public --description "<D3>"` then `git push -u origin main` |
| B. Exists, empty (no refs) | `gh repo view --json isEmpty` -> `true`; `git ls-remote origin` prints nothing | `git push -u origin main` (make sure it is **public**: if private, `gh repo edit ... --visibility public --accept-visibility-change-consequences` is fine because nothing old exists) |
| C. Exists with only the content-free first commit `27b866d` (README `# visualizer`) | `git ls-remote origin` -> one ref `refs/heads/main` whose SHA starts `27b866d`; `git fetch origin main && git show --stat FETCH_HEAD` shows only `README.md` | Replace it: `git push --force-with-lease=main:<full-27b866d-sha> -u origin main`. Accepted: old commit stays fetchable by SHA but contains only `# visualizer`. If the repo is private, push first, THEN make it public (still fine for this content-free commit). If branch protection blocks force-push, owner temporarily relaxes it, or deletes + recreates the repo (Path A). Default per Q2. |
| D. Exists with anything else (other branches, more commits, PRs, forks) | any other ref/commit | **STOP.** Report to the owner; do not force-push. Options: new repo name, or owner decides to delete+recreate (and check for forks first: forks keep old commits). |
Never use `--force` (always `--force-with-lease=<ref>:<expected-sha>` so you cannot overwrite something you have not seen).

### D2. Order of the outward steps (each needs approval; all are listed again as tasks)
gate -> create/push -> tag push -> property -> topic -> settings -> anonymous verification -> Connect (auth M4, stage, preview, publish, deploy) -> MC URL update (M7) -> smoke test in MC -> announcement (M8).
Why the property/topic come right after the push and before Connect: a repo without the labs marking in the `commercetools` org is a policy violation on its own; Connect stage reads the repo anonymously so it does not matter for it.

### D3. Repository metadata (defaults; Q10)
- Name `commercetools/visualizer`; visibility public.
- Description = the README first sentence, <= 350 chars, no trailing period needed. Draft: `Merchant Center custom application to view and edit Types, States, Subscriptions, API Extensions and Custom Objects, with entity-relation and drilldown visualizations. commercetools-labs: unsupported reference code.`
- Topic: `labs` (required). Optional extras: `merchant-center`, `custom-application`, `commercetools-connect` (QJ2).
- Homepage: leave empty (no website).

### D4. Settings
| Setting | Value | Command | Why |
|---|---|---|---|
| Issues | on | `gh repo edit commercetools/visualizer --enable-issues=true` | `bugs` URL in package.json points there |
| Wiki / Projects / Discussions | off | `--enable-wiki=false --enable-projects=false` (discussions via UI) | nothing maintained there (unsupported) |
| Delete branch on merge | on | `--delete-branch-on-merge` | tidy |
| GitHub Actions | disabled | `gh api -X PUT repos/commercetools/visualizer/actions/permissions -F enabled=false` | R4; org policy may refuse -> record |
| Secret scanning + push protection | enabled | `gh api -X PATCH repos/commercetools/visualizer -f 'security_and_analysis[secret_scanning][status]=enabled' -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'` | free on public repos; may already be on by org default |
| Branch protection on `main` | optional: block force-push and deletion | UI (Settings -> Rules) | keeps the single commit honest; QJ3 |
Each is REQUIRES OWNER APPROVAL (admin on the repo needed; if `gh` answers 403, the owner/org admin does it in the UI).

### D5. Rollback / what-if (rule: **squash, never fixup**)
A name removed in a newer commit is still public in its ancestor, and GitHub also serves unreachable commits by SHA.
| Situation | Action |
|---|---|
| Problem found **before** the push | Fix in the working tree, `git add`, `git commit --amend`, re-run gate (change I tasks 6.x). |
| Problem found after push, **repo still private** (path C/B before flip) | Amend + `git push --force-with-lease=main:<current-sha>`; old SHA remains fetchable by people with access: acceptable only if the leak is non-sensitive; otherwise delete + recreate. |
| Problem found after the repo is **public**, non-sensitive (typo, README wording) | Normal follow-up commit is fine (owner may prefer amend+force for purity; QJ4). |
| Problem found after public, **sensitive** (secret, customer name, private e-mail) | Treat as an incident: (1) `gh repo edit commercetools/visualizer --visibility private --accept-visibility-change-consequences` immediately; (2) rotate any secret; (3) fix with amend; (4) owner/org admin **deletes and recreates** the repo (a force-push alone does not purge SHAs; GitHub keeps the name via a rename redirect until the delete finishes - wait for it); (5) re-run gate and this runbook from task 1; (6) tell security if customer data. Do not add a "remove X" commit. |
| Connect deployment broken | `commercetools connect deployment redeploy --key ... --configuration KEY=value` for config; `deployment delete` to remove; staged connector problems: fix repo (new tag `v1.0.1`) and create a new staged version. |
| Wrong MC URL | edit the Custom Application in MC (M7) - instant. |
Local safety net: bundle/tarball from change I stay until the end of this change.

### D6. Anonymous verification (what "anonymous" means)
Run with no credentials: `env HOME=$SCR/fakehome GIT_TERMINAL_PROMPT=0 git clone https://github.com/commercetools/visualizer.git ...` (HTTPS, no SSH key, no `gh` token, no prompt). If it asks for a login or says "repository not found", the repo is not public.

### D7. Connect release specifics
- **Which project/region:** the sandbox project from M2 and its region (e.g. `gcp-us`/`us-central1.gcp` for the owner's MC; confirm with `commercetools connect deployment create --help` which spelling the CLI wants). Region must match `CLOUD_IDENTIFIER` and the MC host (`mc.us-central1.gcp.commercetools.com` per region gotchas).
- **Configuration keys** (from change E's `connect.yaml`): `CUSTOM_APPLICATION_ID` (from MC registration), `ENTRY_POINT_URI_PATH` (`visualizer`), `CLOUD_IDENTIFIER`. `APPLICATION_URL` is injected by Connect; `INITIAL_PROJECT_KEY` is dev-only (Q7). If E kept other keys, supply them too.
- **Creator e-mail** for `connectorstaged create`: the owner's commercetools e-mail (ask; do not guess).
- **Deployment key names:** `visualizer-preview`, `visualizer-sandbox`, `visualizer-prod` (free text; keep stable).
- Certification: not run (Q11).

### D8. Announcement (M8) - draft text for the owner to post (Slack/index), not posted by Claude
```
commercetools Visualizer is now a commercetools-labs project: https://github.com/commercetools/visualizer
A Merchant Center custom application to view, create and edit Types, States, Subscriptions, API Extensions and Custom Objects,
plus an Entity Diagram and a Drilldown treemap. MIT-licensed, hosted via Connect.
Heads-up: labs = reference code, AS IS and UNSUPPORTED (see SUPPORT.md). Install guide + scopes are in the README.
```
Optionally `gh release create v1.0.0 --title "v1.0.0" --notes "Initial public release"` (REQUIRES OWNER APPROVAL).

## Risks / Trade-offs

- [Public exposure of contributor e-mails] -> owner decided (2026-10-08): real e-mails exactly as in history (list in change I design D5, personal gmail and employer addresses included); trailers can still be amended before push, never after the repo is public.
- [Published `openspec/` and `specs/` leak internal text] -> they are part of the single commit and covered by the gate (tasks 1.7, 2.2); `plans/`, `.claude/`, `.serena/` are not in the commit and `.specify/` was never copied.
- [Gate stale] -> task 2.2 re-runs it right before pushing.
- [Force-push blocked by org rules] -> D1 path C fallbacks.
- [Org property not defined -> 422] -> M5 first (task 1.5 detects with a READ-ONLY call).
- [Connect cannot read repo / tag] -> repo public + tag pushed; `connectorstaged describe` shows the error text.
- [Build in Connect needs env] -> configuration list in D7; if build fails, `deployment logs` and fix via redeploy.
- [CLI flags drift] -> `--help` before each command; note differences in the task notes.

## Migration Plan

1 verify -> 2 push -> 3 mark -> 4 settings -> 5 anonymous check -> 6 Connect -> 7 MC -> 8 announce. Stop at any failure and use D5.

## Open Questions

QJ1 repo creation/admin rights (who runs `gh repo create`?), QJ2 extra topics, QJ3 branch protection, QJ4 amend-vs-follow-up policy after publication, Q11 certification, M5 property defined?

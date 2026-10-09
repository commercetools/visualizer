Conventions: repo root = `<repo-root>`; `SK`, `SCR` as before. **READ-ONLY** = safe to run. **REQUIRES OWNER APPROVAL** = wait for an explicit "go" message from the owner in the conversation; quote it in the task notes. If unsure, do not run.

## 1. Pre-flight (READ-ONLY)

- [ ] 1.1 Change I finished: `grep -c '\- \[ \]' openspec/changes/single-commit-and-gate/tasks.md` prints `0`; `git rev-list --count HEAD` prints `1`; `git status --porcelain` prints nothing; `git remote -v` shows `git@github.com:commercetools/visualizer.git`.
- [ ] 1.2 Tools and auth: `gh --version`; `gh auth status` (expected: logged in to github.com with an account that is a member of the `commercetools` org; scopes include `repo`, and `admin:org` is NOT needed). If not logged in: ask the owner to run `! gh auth login` themselves (interactive; never handle tokens).
- [ ] 1.3 Is the maintainer go-ahead on record (maintainer step)? Without it, STOP after group 1 and report the findings of 1.4/1.5.
- [ ] 1.4 Detect the repo state (D1): `gh repo view commercetools/visualizer --json name,visibility,isEmpty,defaultBranchRef,pushedAt,url 2>&1` and `git ls-remote origin 2>&1`.
  - "Could not resolve to a Repository" -> path A.
  - JSON with `"isEmpty": true` -> path B (note `visibility`).
  - one ref, SHA starts `27b866d` -> verify content: `git fetch origin main && git show --stat FETCH_HEAD | cat` shows only `README.md` (1 line `# visualizer`) -> path C. (Fetching into this repo adds an unrelated object; harmless, `git gc` later.)
  - anything else -> path D: STOP and report.
  Write the path letter and raw output in the task notes. Also check forks and open PRs for path C/D: `gh api repos/commercetools/visualizer --jq '{forks: .forks_count, issues: .open_issues_count}'`.
- [ ] 1.5 Is the labs property defined in the org? `gh api orgs/commercetools/properties/schema --jq '.[].property_name' 2>&1`. Expected: a list that contains `commercetools-labs`. If missing or 403: manual step M5 (org admin must create a true/false property named `commercetools-labs`); continue, but task 4.1 will fail with 422 until then.
- [ ] 1.6 Are tags clean? `git tag` prints nothing (no tag yet).

- [ ] 1.7 Published planning content is clean: `git ls-files openspec | head -3` lists tracked files; `git ls-files | grep -E '^(plans|\.claude|\.serena|\.specify)/'` prints NOTHING; `git ls-files | grep -E '^openspec/README.md$'` prints 1 line (explains that `plans/` is not shipped, from change H 2b.4); `git grep -n -i -E "/Users/|manual step|M[0-9]+ of plans|plans/(owner|manual)" -- openspec specs | head` prints nothing (no owner-only steps or links to unpublished plans). Why: everything in `openspec/` is public the moment 3.2 runs.
- [ ] 1.8 Trailers are the intended ones: `git log -1 --format='%(trailers:key=Co-authored-by,valueonly)'` equals the 9 lines of change I design D5 (real e-mails). Record the list in the task notes; this is the owner-approved exposure.

## 2. Fresh gate and tag (local only)

- [ ] 2.1 Confirm the commit equals the one gated in I: `git rev-parse --short=8 HEAD` equals the SHA written in change I's notes.
- [ ] 2.2 Run the gate again immediately before pushing: `node $SK/scripts/gate.mjs --repo .` (add `--ack` only if the same acknowledged warnings as in change I remain). Expected: `CLEAR.`/`CLEAR (warnings acknowledged).`, exit 0 and the same SHA. If anything is found: fix by amend (change I tasks 6.2-6.4) and restart group 2.
- [ ] 2.3 Create the release tag locally: `git tag -a v1.0.0 -m "Initial public release"`. Verify `git tag` shows `v1.0.0` and `git rev-list --count v1.0.0` is `1`. (A tag does not change the commit.)

## 3. Publish the repository - REQUIRES OWNER APPROVAL (M6) for every task in this group

- [ ] 3.1 (Path A only) Create the repo, public from the start: `gh repo create commercetools/visualizer --public --description "<D3 description>"`. Expected: prints `https://github.com/commercetools/visualizer`. Do NOT add `--source`/`--push`/`--add-readme`/`--license` (they would create a second commit or a conflicting remote). If it fails with 403/"must be an organization owner", ask the owner/admin (QJ1) to create the empty public repo and continue at 3.2.
- [ ] 3.2 Push the branch: Path A/B: `git push -u origin main`. Path C: `git push --force-with-lease=main:<FULL 27b866d sha from 1.4> -u origin main`. Expected: `* [new branch] main -> main` (A/B) or `+ 27b866d...<sha> main -> main (forced update)` (C). On `protected branch hook declined`: stop, tell the owner (D1 path C fallbacks). Never use plain `--force`.
- [ ] 3.3 Push the tag: `git push origin v1.0.0`. Expected `* [new tag] v1.0.0 -> v1.0.0`.
- [ ] 3.4 (Path B/C when the repo was private) Make it public: `gh repo edit commercetools/visualizer --visibility public --accept-visibility-change-consequences`. Verify: `gh repo view commercetools/visualizer --json visibility --jq .visibility` prints `PUBLIC`.
- [ ] 3.5 Quick sanity: `git ls-remote origin` shows exactly `refs/heads/main` and `refs/tags/v1.0.0` (+ peeled `^{}`), `main` SHA equals `git rev-parse HEAD`.

## 4. Mark and configure - REQUIRES OWNER APPROVAL (M6 covers; org admin may be needed)

- [ ] 4.1 Labs property: `gh api -X PATCH repos/commercetools/visualizer/properties/values -f 'properties[][property_name]=commercetools-labs' -f 'properties[][value]=true'`. Expected: empty 204 response. 422 -> the property is not defined: M5 (org admin) then retry. Verify (READ-ONLY): `gh api repos/commercetools/visualizer/properties/values --jq '.[] | select(.property_name=="commercetools-labs") | .value'` prints `true`.
- [ ] 4.2 Topic: `gh repo edit commercetools/visualizer --add-topic labs` (+ extras from QJ2). Verify: `gh repo view commercetools/visualizer --json repositoryTopics --jq '.repositoryTopics[].name'` lists `labs`.
- [ ] 4.3 Description (if not set in 3.1): `gh repo edit commercetools/visualizer --description "<D3 description>"`.
- [ ] 4.4 Settings from D4: `gh repo edit commercetools/visualizer --enable-issues=true --enable-wiki=false --enable-projects=false --delete-branch-on-merge`; then Actions: `gh api -X PUT repos/commercetools/visualizer/actions/permissions -F enabled=false`; then secret scanning/push protection PATCH. Verify each: `gh repo view commercetools/visualizer --json hasIssuesEnabled,hasWikiEnabled,hasProjectsEnabled,deleteBranchOnMerge`; `gh api repos/commercetools/visualizer/actions/permissions --jq .enabled` -> `false`. A 403/422 on any item: write down "needs org admin" and continue; none of these blocks verification.
- [ ] 4.5 Check the repo page in a browser tab (Chrome DevTools connector `navigate_page` to https://github.com/commercetools/visualizer, `take_snapshot`): README banner "UNSUPPORTED" visible, license "MIT" detected in the sidebar, "1 commit", topic `labs`, contributors list.

## 5. (reserved) Optional release object - REQUIRES OWNER APPROVAL

- [ ] 5.1 Only if the owner wants it: `gh release create v1.0.0 --title "v1.0.0" --notes "Initial public release"`. Otherwise skip and tick with note "skipped by owner".

## 6. Anonymous fresh-clone verification (READ-ONLY, do right after group 4)

- [ ] 6.1 `rm -rf $SCR/public-check $SCR/fakehome; mkdir -p $SCR/fakehome; env HOME=$SCR/fakehome GIT_TERMINAL_PROMPT=0 git clone https://github.com/commercetools/visualizer.git $SCR/public-check`. Expected: clone succeeds without any prompt. `Repository not found`/prompt = not public -> go back to 3.4.
- [ ] 6.2 `git -C $SCR/public-check rev-list --count HEAD` -> `1`; `git -C $SCR/public-check rev-parse --short=8 HEAD` equals the local one; `git -C $SCR/public-check tag` -> `v1.0.0`; `ls -a $SCR/public-check` has no `.github`, `plans`, `openspec`, `.claude`.
- [ ] 6.3 `cd $SCR/public-check/visualizer && env HOME=$SCR/fakehome npm ci && env HOME=$SCR/fakehome npm run typecheck && env HOME=$SCR/fakehome npm run lint && env HOME=$SCR/fakehome npm test` -> all exit 0.
- [ ] 6.4 Build with the dummy env documented in change I (task 8.4): `env HOME=$SCR/fakehome ENTRY_POINT_URI_PATH=visualizer CLOUD_IDENTIFIER=gcp-eu CUSTOM_APPLICATION_ID=TODO APPLICATION_URL=https://example.com INITIAL_PROJECT_KEY=todo npm run build` -> success.
- [ ] 6.5 Gate on the public clone: `node $SK/scripts/gate.mjs --repo $SCR/public-check` (add the same `--ack` as before) -> clear. This proves what the world sees is what was checked.
- [ ] 6.6 Failures here mean the published repo is broken: follow D5 (squash, never fixup) - stop and report to the owner before changing anything.

## 7. Connect release - each command REQUIRES OWNER APPROVAL; M4 (login) is done by the owner

- [ ] 7.1 Prerequisites: manual steps M2 (sandbox project key, cloud identifier) and M3 (MC Custom Application registered with placeholder URL; Application ID known) are done; `commercetools --version` works (`npm install -g @commercetools/cli` if not; approval needed for global install). Check `commercetools connect --help` and note flag spellings.
- [ ] 7.2 Owner logs in (M4): the owner runs `! commercetools auth login ...` themselves (OAuth/client credentials; Claude never sees secrets). Verify (READ-ONLY): `commercetools connect connectorstaged list` runs without an auth error.
- [ ] 7.3 Validate locally (READ-ONLY): `commercetools connect validate` in the repo root -> success (already done in E; repeat on the final tree).
- [ ] 7.4 Stage: `commercetools connect connectorstaged create --repository-url https://github.com/commercetools/visualizer.git --repository-tag v1.0.0 --creator-email <owner e-mail> --name visualizer`. Then `commercetools connect connectorstaged describe --key <connector-key printed above>` until the validation/build state is successful (poll every minute; the description shows errors if the repo/tag/connect.yaml is wrong).
- [ ] 7.5 Preview: `commercetools connect connectorstaged preview --key <connector-key> --deployment-key visualizer-preview --region <region>` (+ `--configuration CUSTOM_APPLICATION_ID=<id> --configuration ENTRY_POINT_URI_PATH=visualizer --configuration CLOUD_IDENTIFIER=<cloud>`; confirm the flag name in `--help`). Then `commercetools connect deployment describe --key visualizer-preview` -> status `Deployed` and note the deployment **URL**. If it fails: `commercetools connect deployment logs --key visualizer-preview --application visualizer --startDate <iso> --endDate <iso>`.
- [ ] 7.6 Publish (private/org-only; NOT certify): `commercetools connect connectorstaged publish --key <connector-key>`. Do not run `certify` (Q11).
- [ ] 7.7 Production-type deployment: `commercetools connect deployment create --connector-key <connector-key> --region <region> --type production --key visualizer-prod` with the same three configuration values. (Use `--type sandbox` if the owner wants a non-production project first.) `deployment describe --key visualizer-prod` -> `Deployed`; copy the URL.
- [ ] 7.8 MC handshake (manual step M7, owner): in Merchant Center -> Settings -> Custom Applications -> Visualizer, replace the placeholder URL with the deployment URL from 6.7. Chrome DevTools can verify but not edit credentials.
- [ ] 7.9 Smoke test in the real MC (owner's logged-in Chrome, M1): open `https://mc.<region>.commercetools.com/<project-key>/visualizer`; Welcome shows all cards; open Entity Diagram and Visualize Drilldown, one list page, and check the console for errors (`list_console_messages`). Record in notes.

## 8. Wrap-up

- [ ] 8.1 Announcement (M8): give the owner the D8 text; do NOT post it yourself.
- [ ] 8.2 Update the maintainer's local status notes (M4-M8: done/not done) and note the final URLs (repo, deployment) in the change notes.
- [ ] 8.3 Backups from change I may now be archived or deleted by the owner; leave them unless told.
- [ ] 8.4 `openspec validate publish-labs-repo`; tick all tasks; report: repo URL, commit SHA, tag, gate result, Connect deployment key + URL, anything that needed an org admin.

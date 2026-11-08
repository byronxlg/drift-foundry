---
project: drift-foundry
reviewed: 2026-11-08
deploy_path: push-to-main
rollback_minutes: 10
---

# drift-foundry: updates and rollback

## How a change ships

1. Branch, change, open a PR. `check.yml` runs `node --check` on every module and the balance gate
   (`node sim/balance.mjs 15` must finish between 4 h and 9 h, builder and `--abstract`).
2. Design changes: preview behind a query flag (`?ui=build`, `&ds=`), screenshots at phone and
   desktop, and Byron's yes in words before it becomes the default (management D71).
3. Merge to `main`. `pages.yml` reruns the balance gate and deploys the repo root to Pages;
   live within a few minutes.
4. Check: `curl -s -o /dev/null -w '%{http_code}' https://byronxlg.com/drift-foundry/` is 200 and
   the changed screen loads without console errors.

## Saves

Saves are versioned in `src/game.js` (`serialize` / `deserialize`) and `src/world.js`. A change that
alters the save shape must read the old shape or keep it under a backup key; never wipe a save.

## Rollback

`git revert <sha>` on a branch, PR, merge; `pages.yml` redeploys the previous state. A bad deploy
with a green gate can also be undone by re-running the last good `pages.yml` run
(`gh run rerun <id> -R byronxlg/drift-foundry`).

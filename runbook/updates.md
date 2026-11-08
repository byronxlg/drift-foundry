---
project: drift-foundry
reviewed: 2026-11-08
deploy_path: push-to-main
rollback_minutes: 10
---

# drift-foundry: updates and rollback

## How a change ships

1. Branch, change, open a PR. `check.yml` runs `node --check` on every module and the balance gate
   (`node sim/balance.mjs 15` must finish between 4 h and 9 h: the map on seeds 7, 11 and 23, and `--abstract`).
2. Design changes: preview behind a query flag (a new `?` param, read in `src/build.js`),
   screenshots at phone and desktop, and Byron's yes in words before it becomes the default
   (management D71).
3. Merge to `main`. `pages.yml` reruns the balance gate and deploys the repo root to Pages;
   live within a few minutes.
4. Check: `curl -s -o /dev/null -w '%{http_code}' https://byronxlg.com/drift-foundry/` is 200 and
   the changed screen loads without console errors.

## Saves

Saves are versioned in `src/game.js` (`serialize` / `deserialize`) and `src/world.js`. A change that
alters the save shape must read the old shape or keep it under a backup key; never wipe a save.

| Key | What | Read | Written |
| --- | --- | --- | --- |
| `drift-foundry/lines` | the game (supply lines; also the `?flow=lines` preview's key) | every load | every 5 s, on hide, at load |
| `drift-foundry/build` | belt builder, until 2026-11-08 | when there is no lines save or it was saved later: laid out again with lines | never |
| `drift-foundry/save` | list screens, retired 2026-11-08 | when neither of the above exists | never |
| `drift-foundry/lines.broken.*`, `.before-belts.*` | an unreadable lines save; a lines save set aside because the belt save was newer | never (kept for recovery) | once |

## Rollback

`git revert <sha>` on a branch, PR, merge; `pages.yml` redeploys the previous state. A bad deploy
with a green gate can also be undone by re-running the last good `pages.yml` run
(`gh run rerun <id> -R byronxlg/drift-foundry`).

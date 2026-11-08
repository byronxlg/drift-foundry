---
project: drift-foundry
tier: 3
owner: byron
lifecycle: production
reviewed: 2026-11-08
---

# drift-foundry runbook

A phone-first incremental factory game in the browser: build on a drifting rock, close a ring of
five segments, about six hours end to end. Static files, no build step, no server, no secrets;
saves live in the player's browser (localStorage). Tier 3: nothing to keep alive. "Live" means
https://byronxlg.com/drift-foundry/ returns 200 and the last `pages.yml` run is green.

## Where it runs

GitHub Pages, project site for `byronxlg/drift-foundry`, published from the repo root by
`pages.yml` on every push to `main`, after the balance gate (the bot must finish in 4 to 9 h).
Served at `byronxlg.com/drift-foundry/` through the user site's custom domain. Fonts come from
Google Fonts; if they fail the game falls back to system faces and still plays.

## Objectives

| Indicator | Target | Window | Measured by |
| --- | --- | --- | --- |
| The page returns 200 | 99% of checks | 30 days | `curl -s -o /dev/null -w '%{http_code}' https://byronxlg.com/drift-foundry/` |
| A push to `main` is live within 10 min | every push | per push | `gh run list -R byronxlg/drift-foundry --workflow pages.yml --limit 1` is `success` |

Recovery targets: RTO 14 days (the `restore` SLA in `projects.yaml`). RPO not applicable: the
repo is the source of truth; player saves are on players' devices and never reach us.

## Who is watching

| Watcher | Where it runs | Cadence | Checks | Alerts to | Run history |
| --- | --- | --- | --- | --- | --- |
| `check.yml` | GitHub Actions | every pull request | module syntax, balance gate (builder and count-only) | PR status | [actions](https://github.com/byronxlg/drift-foundry/actions) |
| `pages.yml` | GitHub Actions | push to `main` | balance gate, Pages deploy | GitHub's workflow failure email | [actions](https://github.com/byronxlg/drift-foundry/actions) |

No off-host monitor and none is required at tier 3. The weekly fleet review runs the objective
checks above.

## Files

| Question | File |
| --- | --- |
| How do changes reach the site, how do I roll back? | [updates.md](updates.md) |
| What is the design and the design system? | [../docs/design.md](../docs/design.md), [../docs/design-system.md](../docs/design-system.md) |

Tier 3 does not carry `health.md`, `recovery.md`, `dependencies.md` or `incidents/`; the
objectives table above is the whole health check, and rollback lives in `updates.md`.

## Schedules

| What | Where it runs | When | Notes |
| --- | --- | --- | --- |
| Deploy (`pages.yml`) | github-actions | push to `main`, manual dispatch | balance gate, upload the repo root, deploy to Pages |

## Dashboards and logs

- Actions runs: `gh run list -R byronxlg/drift-foundry --limit 5`.
- Pages: `gh api repos/byronxlg/drift-foundry/pages -q .status`.
- Pacing: `node sim/balance.mjs 15` prints the bot's play time and segment times.
- Review states without a save: `?demo=1..4`, builder `?ui=build`, design directions `&ds=a|b`.

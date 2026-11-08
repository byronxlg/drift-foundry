# Drift Foundry

A phone-first incremental factory game in the browser. Build drills, smelters, presses and
assemblers on a drifting rock, keep the power up, and deliver parts to close a five-segment ring.
About six hours end to end; the factory keeps running while you are away (2 h, 8 h after research).

Play: https://byronxlg.com/drift-foundry/ (direction B: `?skin=b`). Saves live in the browser.

- `src/game.js` the whole economy, no DOM
- `src/ui.js`, `src/style.css` the screen, two directions behind `?skin=`
- `sim/balance.mjs` a bot that plays it and prints segment times: `node sim/balance.mjs 15`
- `docs/design.md` the plan, borrowed patterns and state map

No build step: static files served by GitHub Pages from `main` via `.github/workflows/pages.yml`.

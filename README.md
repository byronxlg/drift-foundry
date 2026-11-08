# Drift Foundry

A phone-first incremental factory game in the browser. Build drills, smelters, presses and
assemblers on a drifting rock, keep the power up, and deliver parts to close a five-segment ring.
About six hours end to end; the factory keeps running while you are away (2 h, 8 h after research).

Play: https://byronxlg.com/drift-foundry/ - a full-screen map of the rock: drills on resource nodes,
supply lines from machine to machine and into the Hub, power reach, the ring as the goal. Saves
live in the browser; a save from the retired belt builder or list screens is laid out again with
lines the first time. `?demo=1..4` seeds a factory for review.

- `src/game.js` the whole economy, no DOM
- `src/world.js` the map: nodes, placement, supply lines and the flow along them, power reach
- `src/build.js`, `src/build.css` the game screen; `src/theme.js` the design tokens (direction B, Survey chart)
- `sim/balance.mjs` a bot that plays the map (places on nodes, links machines, chains poles) and prints segment times: `node sim/balance.mjs 15` (`--abstract` for the count-only model, `--seed=N` for another map)
- `docs/design.md` the plan, borrowed patterns and state map

No build step: static files served by GitHub Pages from `main` via `.github/workflows/pages.yml`.

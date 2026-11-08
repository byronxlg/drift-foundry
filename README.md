# Drift Foundry

A phone-first incremental factory game in the browser. Build drills, smelters, presses and
assemblers on a drifting rock, keep the power up, and deliver parts to close a five-segment ring.
About six hours end to end; the factory keeps running while you are away (2 h, 8 h after research).

Play: https://byronxlg.com/drift-foundry/ (direction B: `?skin=b`). Saves live in the browser.

Builder preview: https://byronxlg.com/drift-foundry/?ui=build - a full-screen map of the rock: drills on
resource nodes, belts to the Hub, power reach, the ring as the goal. Own save; an old list save is laid
out on the map the first time. `&demo=1..4` seeds a factory for review.

- `src/game.js` the whole economy, no DOM
- `src/ui.js`, `src/style.css` the list screens, two directions behind `?skin=`
- `src/world.js` the builder's map: nodes, placement, belts, power reach; writes the effective counts the engine ticks
- `src/build.js`, `src/build.css` the builder screen (`?ui=build`)
- `sim/balance.mjs` a bot that plays the builder (places on nodes, lays belts and poles) and prints segment times: `node sim/balance.mjs 15` (`--abstract` for counts only, `--seed=N` for another map)
- `docs/design.md` the plan, borrowed patterns and state map

No build step: static files served by GitHub Pages from `main` via `.github/workflows/pages.yml`.

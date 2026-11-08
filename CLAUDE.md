# drift-foundry

A phone-first incremental factory game in the browser (about six hours end to end): plain ES
modules, no build step, a static site on GitHub Pages at https://byronxlg.com/drift-foundry/.

Operational docs live in `runbook/` (`README.md` for what it is and what healthy means,
`updates.md` for how change ships and rolls back). Design: `docs/design.md` (game, state maps,
pacing) and `docs/design-system.md` (UI tokens, glyph language, components). Every PR must keep
`node sim/balance.mjs 15` between 4 h and 9 h; design changes go behind a preview query param until
Byron says yes.

# Design system, piece by piece

Byron picked direction B (Survey chart) and asked to go through the system piece by piece
(#19364880, 2026-11-08). Each piece is sent as one picture with 2-3 options and a pick; his answer
is applied to `src/theme.js` and `docs/design-system.md`, then the next piece goes out.

| # | Piece | Status |
| --- | --- | --- |
| 1 | Items: colour plus shape (`1-items.png`) | done 2026-11-08: Byron picked C, two tones (#19364881) |
| 2 | Machines: family silhouettes, output token (`2-machines.png`) | done 2026-11-08: Byron picked B plus C, silhouette per machine with the recipe inside (#19364882) |
| 3 | Map ground: nodes, buildable tiles, survey edge (first sheet 2026-11-08 conflated power, belts and ground, so split; `3-ground.png` redrawn ground only with supply lines: A as now / B rounded fields and build dots / C rounded fields with a rim and a smooth map edge, pick C) | done 2026-11-08: Byron picked C (#19364888), rounded fields with a rim, the map ends in a smooth line, the next ring shaded and hatched |
| 4 | Belts: the mechanic first (`4-belts.png`), A tether to the Hub / B real belts tile by tile / C supply lines (pick C) | done 2026-11-08: Byron picked C (#19364885), played the preview and said yes (#19364887); supply lines are the game, belts removed |
| 5 | Power: how reach shows (`5-power.png`): A teal squares while placing or tapping a generator (now) / B one soft teal area with a smooth edge / C the same area plus a thin wire from each pole to what powers it, always on (pick C) | done 2026-11-09: Byron picked A (#19364889), power stays as now: teal squares only while placing or tapping a generator |
| 6 | Status marks (`6-status.png`), cut to the basics at Byron's word (#19364891): five states, running / short of input (line in amber, dashed) / output piling up (items queue out in amber, line or no line; no separate no-line-out state) / no power (red bolt) / stood by (grey pause); first tap says Next | done 2026-11-09: Byron said yes (#19364892); in the game, `6-status-live.png` |
| 7 | Type (`7-type.png`, the real phone HUD per option): A as now, two fonts, five sizes / B goal numbers bigger, the two smallest sizes merged, four sizes / C one plain font (pick B) | done 2026-11-09: Byron picked C (#19364893), one plain font (Archivo) for words and figures, sizes as now; the stock strip scrolls, so long numbers are not cut off for good |
| 8 | Top bar, the line under each goal (`8-hud.png`, real phone, new game and later): A as now, red "not being made" at the start / B grey "not started", red only when it was coming in and stopped / C no line (pick B) | done 2026-11-09: Byron picked C (#19364894), no line under the goals; the bar and the Next box carry it, `8-hud-live.png` |
| 9 | Dock and hotbar, the machine buttons (`9-dock.png`, real phone, new game and later): A as now, picture, name and cost stacked / B picture beside name and cost, under three in view / C picture and cost, name on Next and the tapped one, five or six in view (pick C) | done 2026-11-09: Byron picked A (#19364895), the machine buttons stay as now: picture, name and cost stacked |
| 10 | The machine panel and short messages (`10-panel.png`, real phone, smelter tapped, a message up): A as now, panel fills the screen above the machine buttons, map hidden, message on the panel's name / B panel over the machine buttons from the bottom edge, tapped machine in view, all of it scrolls / C short panel (name, what it makes, buttons), lines behind a Lines button, tapped machine in view (pick C); B and C put the message just above the panel and drop the capitals on the small headings | done 2026-11-09: Byron picked B (#19364896), the panel comes up over the machine buttons, tapped machine in view, message just above it, small headings in sentence case; `10-panel-live.png` |

`1-items-palette.py` generates the B and C palettes to a target luminance and prints contrast
against the chart (`terrain`), the white panel and the machine body.

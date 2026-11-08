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
| 6 | Status marks (`6-status.png`), cut to the basics at Byron's word (#19364891): five states, running / short of input (line in amber, dashed) / output piling up (items queue out in amber, line or no line; no separate no-line-out state) / no power (red bolt) / stood by (grey pause); first tap says Next | sheet ready 2026-11-09, waiting on Byron's yes |
| 7 | Type | |
| 8 | HUD (known: red "not being made" under the first need before anything is built reads as an error) | |
| 9 | Dock and hotbar | |
| 10 | Drawers, sheets, toasts, motion | |

`1-items-palette.py` generates the B and C palettes to a target luminance and prints contrast
against the chart (`terrain`), the white panel and the machine body.

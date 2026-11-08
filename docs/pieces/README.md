# Design system, piece by piece

Byron picked direction B (Survey chart) and asked to go through the system piece by piece
(#19364880, 2026-11-08). Each piece is sent as one picture with 2-3 options and a pick; his answer
is applied to `src/theme.js` and `docs/design-system.md`, then the next piece goes out.

| # | Piece | Status |
| --- | --- | --- |
| 1 | Items: colour plus shape (`1-items.png`) | done 2026-11-08: Byron picked C, two tones (#19364881) |
| 2 | Machines: family silhouettes, output token (`2-machines.png`) | done 2026-11-08: Byron picked B plus C, silhouette per machine with the recipe inside (#19364882) |
| 3 | Map ground: nodes, buildable tiles, survey edge (`3-ground.png` shown 2026-11-08; Byron: it conflated power, belts and ground, so split) | after 4 |
| 4 | Belts: the mechanic first (`4-belts.png`), A tether to the Hub (now) / B real belts tile by tile / C supply lines (pick C) | sent 2026-11-08 (#19364883, #19364884) |
| 5 | Power: reach, poles, generators | after 4 |
| 6 | Status marks (known: fresh game marks the next ore node "Fix" while Next says "tap an ore node") | |
| 7 | Type | |
| 8 | HUD (known: red "not being made" under the first need before anything is built reads as an error) | |
| 9 | Dock and hotbar | |
| 10 | Drawers, sheets, toasts, motion | |

`1-items-palette.py` generates the B and C palettes to a target luminance and prints contrast
against the chart (`terrain`), the white panel and the machine body.

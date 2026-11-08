# Drift Foundry: design plan

Asked for by Byron on Telegram (#19364877, 2026-11-08): an incremental factory game in the
production-chain genre, played on a phone in the browser, about six hours end to end with some
idle time. It is also the first run of the design human-in-the-loop flow (D71): two directions,
one picture, his choice in words before anything is called finished.

## Idea

A factory on a drifting rock. The goal is not a number going up but an object: a ring of five
segments (Anchor, Spine, Lattice, Nerve, Engine) that carries the rock home. Each segment asks for
parts; delivering them unlocks the next tier of buildings. The ring is the game's face.

## The screen's one question

"What do I build next to finish this segment?" Focal point per state:

| State | Focal point |
| --- | --- |
| First open | Mine ore button (large) and the advice "Nothing makes ore yet. Build ore drill" |
| Playing | Current segment: per-part progress, stock waiting, ETA, and one build button for the bottleneck |
| Power short | Power meter turns red, advice names the generator to build |
| Fuel out | Generator rows say "no coal", advice is a coal drill |
| Segment done | Sheet: what is in place, what unlocked |
| Back after time away | Sheet: time away, what the foundry made, the cap if it was hit |
| Ring complete | Sheet then focus card "Ready to leave" with play time |

## Patterns borrowed

1. Factorio production stats: each item shows net rate per second next to stock, red when falling. Changes the stock grid from inventory to a flow readout.
2. Universal Paperclips progressive disclosure: lines, research and stock items appear only once reachable. No locked grey clutter on the first screen.
3. Melvor Idle / Cookie Clicker away summary: a sheet on return lists what was made while away and states the cap.
4. Apple Fitness rings: progress as a ring, closed segment by segment (direction A). Direction B uses a site-hoarding segment bar instead.
5. Kittens Game per-building on/off: "Stand by" on any building type, so a person can stop presses eating every ingot while saving up for a coal drill.
6. Mini Metro: one flat colour per item, used as a small swatch everywhere the item appears (recipes, costs, bars).
7. Google Maps "fastest route" style single recommendation: the advice line follows the slowest part upstream through starved inputs and offers one tap to build the fix.

## Two directions

- A "Survey": blueprint blue ground, amber accent, IBM Plex Sans Condensed and Plex Mono numerals, the ring drawn as a five-arc dial in a framed card.
- B "Yard": concrete grey ground, black and safety yellow, Barlow Condensed at large sizes, uppercase labels, ring as five hatched hoarding panels, no card frame.

Same structure and engine; `?skin=b` switches. `?demo=1..4` seeds a mid-game state for review
without touching a save.

## State map

| State | Actions | Way forward |
| --- | --- | --- |
| First open, nothing built | Tap mine; build drill when 10 ore | Drill, then smelter; advice names each |
| Cannot afford | Cost chips show the short item in red | Wait (ETA on ring rows), stand by consumers, tap ore |
| Input starved | Row shows "83%, short of ingot" | Advice walks upstream and offers the build |
| Power short | Meter red, rows "power 74%" | Build generator from advice or Power line |
| No coal | Generator rows "no coal" | Coal drill from advice |
| Deliver | Delivers every needed part in stock | Segment completes, sheet, new line appears |
| Research | Buy when affordable, row greys to Done | One-way, no dead end |
| Reload / close tab | Autosave every 5 s and on hide | Load and catch up (2 h cap, 8 h with Night shift) |
| Tab in background | rAF pauses | On return catch up, away sheet if over a minute |
| Corrupt save | Kept under a backup key, fresh game | Sheet explains |
| Ring complete | Sheet with totals | New game in footer |
| New game | Confirm dialog | Fresh state |

## Pacing

`node sim/balance.mjs <checkEverySeconds>` plays the game with a greedy bot. 2026-11-08: 5h 18m to
6h 14m at 15-45 s check intervals (5 s is slower: the bot over-uses stand-by). Segments land at
roughly 4 m, 25 m, 1 h, 2-4 h, 5-6 h. Away time counts at full rate up to the cap, which is the
idle part.

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

## Design system

The UI system (roles, items, glyph language, type, space, components, two directions) is in
[design-system.md](design-system.md).

## Builder (preview at `?ui=build`)

Byron, 2026-11-08, on directions A and B: "I want it to look like a full screen app no scrolling.
I want it to be more builder like. Satisfactory kind of thing." The list screens stay the default
until he says yes in words; the builder is a preview with its own save.

### Idea

The rock is the screen. A top-down map of the drifting rock fills the viewport; the Hub (the
lander) sits in the middle holding the shared stock, resource nodes lie in patches around it, and
everything you build is a tile on that map, joined to the Hub by belts you draw. The ring is the
goal and lives in the HUD; the factory is what you look at.

### Rules of the map

- Extractors go only on a matching node (ore, coal, stone, quartz). Other machines go on bare rock.
- A machine counts when it is on the Hub network: a belt path to the Hub, or touching a machine or
  belt that is. Touching machines hand items along, so a block of drills needs one belt, not one each.
- Power reach: the Hub covers 7 tiles, a burner 4, a turbine 6, a solar field 5, a power pole 5
  (free, chains from anything live). A machine that draws power and sits outside reach does not run.
- The engine is unchanged: the counts it ticks are the connected, powered, running machines; costs
  grow with what is placed. Demolish refunds half.
- The rock opens as segments close: survey radius 9, 14, 20, 26, 31 tiles. Coal appears with the
  Spine, stone with the Lattice, quartz with the Nerve; each ring has fresh ore.

### The one question and the focal point per state

"Where do I build next to finish this segment?"

| State | Focal point |
| --- | --- |
| First open | The Hub on an ore field; advice "Tap an ore node to dig; 10 ore buys a drill" |
| Placing | Valid tiles lit on the map; the chosen card in the build bar |
| Factory running | Items moving along belts into the Hub; segment bar in the HUD |
| Disconnected / no power | The machine itself: dashed red outline, or dark with a bolt; advice names the fix |
| Inspect | The tile ringed; drawer with status, rate, stand by, demolish |
| Map grows | Sheet names what was surveyed; camera eases out to show the new ring |

### Patterns borrowed

1. Satisfactory build gun: pick a building, the valid spots light up, tap to place, stay in the
   tool to place again. Changes the bottom bar into a hotbar and the map into the placement surface.
2. Satisfactory resource nodes: extractors only on nodes, nodes visible as coloured patches with
   their item. Changes where drills can go and makes exploring the rock matter.
3. Factorio belt drag: draw belts by dragging tile to tile; items ride them visibly. Changes the
   factory from numbers into motion along the map.
4. Factorio power pole reach and the "no power" icon: coverage drawn as a tint while placing; a
   machine out of reach shows a bolt. Changes power from one meter into a spatial constraint.
5. Mindustry core: one central core holds all items and everything delivers into it. Keeps the
   engine's global stock pool and makes "connected to the Hub" the only logistics rule.
6. Mini Motorways map growth: the playable area expands in steps; the next ring is drawn faint so
   there is always somewhere to build out to.
7. shapez hub goal: the central hub shows the current goal and its progress. Changes the Hub into
   the ring emblem and the HUD's segment bar into the reason for every build.

### Tokens

Ground `#14181c` (fog `#0b0e10`, surveyed rock `#1f262c`, tile seam `#262e35`), ink `#eef1f3`
(16.3:1 on ground), mute `#a3afb9` (8.4:1), accent FICSIT orange `#ff9a2e` (8.7:1, accent ink
`#1a1000` on it 9.9:1), power `#59c8ff`, ok `#6fdc8c`, warn `#ffc23d`, bad `#ff6b5b` (6.1:1).
Item colours carry over from the list screens. Barlow for text, Barlow Condensed for figures.
Panels are `#1b2127` at 94% over the map, radius 10, no shadows except sheets.

### State map

| State | Actions | Way forward |
| --- | --- | --- |
| First open | Tap ore node (+1 ore), pan, zoom, tap advice | Advice selects the ore drill once 10 ore |
| Placing | Tap a lit tile, change card, cancel (X or tap card again) | Placed: stays in the tool for the next one |
| Invalid tile | Tap shows the reason on the tile and in the hint line | Lit tiles stay lit; pick one of them |
| Cannot afford | Card shows short cost in red; tap says "Short of ingot" | Wait (rates in HUD), stand by consumers |
| Belt drawing | Drag tile to tile; lift to lay; pan with two fingers or right-drag | Belt joins the network, machine turns live |
| Disconnected | Red dashed outline; inspect says "No belt to the Hub" | Advice "N machines are not on a belt" opens the belt tool there |
| No power | Dark machine with bolt; inspect says "Outside power reach" | Advice opens the pole tool; reach tint shows where |
| Power short | Power meter red; machines run slower | Advice names the generator |
| Starved | Amber dot; inspect names the short input | Advice walks upstream to the build |
| Inspect | Stand by / start, demolish (refund shown), close | Back to the map; nothing locks |
| Demolish | Remove tool or inspect; refund half | Tile free again |
| Deliver | HUD Deliver button | Segment closes, sheet, map grows |
| Map grows | Sheet lists new nodes and buildings | Camera shows the new ring |
| Away / reload | Autosave 5 s and on hide | Catch-up, away sheet over a minute |
| Old list save | Imported once, laid out on the map automatically | Sheet says so; play on |
| Corrupt save | Kept under a backup key | Fresh rock, sheet explains |
| Ring complete | Sheet with totals | New game from the menu |

### Pacing

`sim/balance.mjs` now plays the builder by default: it places each building on the best tile (on
a node for extractors), lays the belt to the network and chains poles to reach. 2026-11-08: 6h 14m
at 15 s checks, 5h 18m to 6h 31m across 15-45 s, same on five map seeds; 293 machines, about 75 belt
tiles. `--abstract` runs the old count-only model.

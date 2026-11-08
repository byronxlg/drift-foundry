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

## Two directions (list screens, retired 2026-11-08)

The list screens below were replaced by the builder; `src/ui.js` and `src/style.css` were deleted
and old `?skin=` links now open the builder.

- A "Survey": blueprint blue ground, amber accent, IBM Plex Sans Condensed and Plex Mono numerals, the ring drawn as a five-arc dial in a framed card.
- B "Yard": concrete grey ground, black and safety yellow, Barlow Condensed at large sizes, uppercase labels, ring as five hatched hoarding panels, no card frame.

Same structure and engine; `?skin=b` switched. `?demo=1..4` seeds a mid-game state for review
without touching a save (still true in the builder).

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

The UI system (roles, items, glyph language, type, space, components, direction B) is in
[design-system.md](design-system.md).

## Builder (the game, default since 2026-11-08)

Byron, 2026-11-08, on directions A and B: "I want it to look like a full screen app no scrolling.
I want it to be more builder like. Satisfactory kind of thing." It was a preview at `?ui=build`
until he picked design system direction B for it (#19364880); it is now the only screen, `?ui=`,
`?ds=` and `?skin=` are ignored, and it keeps its own save key (`drift-foundry/build`).

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

Superseded by [design-system.md](design-system.md) direction B (light, `src/theme.js`); kept as the
first builder pass. Ground `#14181c` (fog `#0b0e10`, surveyed rock `#1f262c`, tile seam `#262e35`), ink `#eef1f3`
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

## Supply lines (piece 4, belts as a mechanic)

Byron picked C on the belts sheet (#19364885, 2026-11-08): items really move machine to machine,
so ratios and placement matter, but a link is one drag from one machine to another and the line
routes itself. It replaces the tether to the Hub. Preview at `?flow=lines` (own save key,
`drift-foundry/lines`) until he says yes; then it becomes the game and belts go.

### Rules

- A line joins a producer to a consumer: a machine that makes an item to a machine whose recipe
  uses it (coal to a burner or turbine counts), or to the Hub, which takes anything. One line per
  pair. Generators and solar fields make no item, so no line starts at them.
- The Hub is a sink: build costs, research and deliveries are paid from what lines bring it. It
  never feeds a machine, so a smelter runs only on ore a drill sends it.
- A producer splits its output evenly over its lines to machines; a machine that is full passes
  its share on to the others (water-fill). The Hub takes what is left over, so a Hub line is
  income from surplus, not a fixed share stolen from the factory. A producer with no room anywhere
  holds up to four cycles of output, then stops (backed up).
- Placing a machine links it for you: each input from the nearest producers of it until their
  output covers its want (at most two per input), and its output to the Hub (coal to the nearest
  generator). The line tool is for changing that, not for every link.
- A consumer keeps a buffer per input (six cycles of its recipe) and runs as far as its buffers
  allow. Generators burn coal from their own buffer.
- Lines are free, have no length cap and no throughput cap; they route along surveyed tiles
  around machines and the Hub, may cross each other and nodes, and re-route when something is
  placed on them. Placement matters through power reach, nodes and how many lines share a source.
- Power is unchanged (reach, poles, one shared pool); piece 5 decides its look and rules. Coal
  drills keep full speed in a brownout, so a short grid cannot starve its own fuel.
- Costs still grow with what is placed; demolishing a machine removes its lines and refunds half.

### Patterns borrowed

1. Mini Metro line drawing: drag from one station to another, the line routes itself. Changes the
   link from tile-by-tile belts to one gesture per link.
2. Factorio production stats and the Satisfactory inspect panel: per-machine "wanted vs getting"
   per input. Changes the inspect drawer into the ratio tool.
3. Dyson Sphere Program logistics stations: endpoints matter, not the path. Changes what the map
   asks of a person: where things sit relative to each other, not belt geometry.
4. Mindustry core: the Hub stays the only store; delivery and building draw from it.
5. Builderment's one-finger belt drag on phones: no rotation, no splitter pieces; splitting is the
   machine's job.

### State map

| State | Actions | Way forward |
| --- | --- | --- |
| Line tool, nothing chosen | Tap or press a machine with an output; tap the Hub (toast: lines end at the Hub) | Source chosen, valid targets lit |
| Source chosen | Tap or drag to a lit target; tap the source again or Done to cancel; pan with two fingers | Line laid, it routes itself, source stays chosen for the next link |
| Invalid target | Toast says why (does not use ore / same machine / already linked / empty rock) | Lit targets stay lit; pick one |
| New machine, no line out | Dashed outline; inspect "No line out"; advice opens the line tool on it | One line to the Hub or a consumer |
| Maker with an input that has no line in | Amber mark; inspect "No ore line in" | Advice opens the line tool on the nearest producer of it |
| Starved (getting under 90% of wanted) | Amber mark; inspect lists wanted vs getting per input | Link another producer, or build one (advice) |
| Backed up (held output full) | Amber mark; inspect "Backed up: nothing takes its ingot" | Line to the Hub or another consumer |
| Generator with no fuel line | Amber mark; inspect "No coal line in" | Advice opens the line tool on the nearest coal drill, or builds one |
| Hub gets none of an item it needs (cost or segment) | Needs row reads "none reaching the Hub" | Advice: line from a producer of it to the Hub |
| Inspect a machine | Lines in and out with their rate, remove any; stand by; demolish | Back to the map |
| Remove tool on a line | Removes the top line on that tile | Producers re-split at once |
| Demolish a machine | Its lines go with it, buffers lost, half refund | Neighbours re-split |
| Place a machine across a line | Allowed; the line re-routes, or is drawn straight if boxed in; never dropped | No state change |
| Reload / away | Buffers and held output are saved; catch-up runs the flow | Away sheet as before |
| First open of the preview with a builder save | Laid out again with lines, free, the builder save untouched | Sheet says so |

Review before build (2026-11-08, independent agent) folded in: Hub as overflow not a share,
auto-link on placing, coal drills ride out brownouts, fuel-line and Hub-income rows, boxed-in
lines kept. Left for later: a per-producer Hub reserve share, listing backed-up producers on the
away sheet.

### Pacing

2026-11-08: 6h 18m to 7h 42m across 15-45 s checks and seeds 7, 11, 23 (belts: 6h 14m); about 4 lines per machine, most laid by auto-link. Retune toward 6 h after the yes.

The bot places like a person (the same auto-link), then lays lines the way a careful person would: each new maker draws from the nearest producers
of each input until their shares cover its want, each new producer links to the Hub (coal to a
generator) and to the most starved consumer of its item, and every check it links a producer to
any consumer starved for a while and gives a backed-up producer a line to the Hub.

# Drift Foundry: design system (UI)

Asked for by Byron on Telegram (#19364879, 2026-11-08), after the builder preview: "Nice I like
the concept. Now let's nail down the design system focussing on ui." This file is the system: the
roles every screen draws from, the map's glyph language, the components, and what is banned. The
tokens live in `src/theme.js` (one object, direction B, read by both the CSS and the canvas).
Two directions were built on the same structure for Byron to choose from; he picked B, which is
now the only one and the default screen at `/`.

## What the before gets wrong

Screenshots of `?ui=build&demo=2` and `&demo=4`, phone 390 and desktop 1440:

1. Every machine is the same rounded square with a coloured outline. Smelter, kiln and refinery
   read alike; so do press, drawer and assembler. Colour is doing the work of shape.
2. A status dot on every machine, amber on most of them. Noise, and the one red thing that
   matters (out of coal) is lost among forty amber dots.
3. Twelve item colours, four of them grey-ish (coal, ingot, stone, concrete). The stock strip is
   swatch plus number with no name: a reader cannot tell coal from ingot.
4. The map draws a seam between every tile and a dim grid out to the next ring: ruled-grid texture
   behind everything.
5. The HUD's loudest red is the power figure, louder than the goal; Deliver and Next fight for
   the accent.
6. Tools are a row of same-weight words; Inspect is a filled white pill, the strongest object in
   the dock, for the mode that does least.

## The one question and the focal point

"Where do I build next to finish this segment?" One accent, used for three things only: the goal
(segment progress), the one suggested action (Next, and the tile it points at), and the current
selection. Everything else is ink, a tone step, or an item colour.

| State | Focal point |
| --- | --- |
| First open | The Hub on an ore field, the ore nodes, Next "Tap an ore node to dig" |
| Placing | Lit tiles on the map, the chosen hotbar slot |
| Running | Items riding supply lines, segment progress in the HUD |
| Something broken | The broken machine's mark (only broken machines carry one) and Next naming the fix |
| Inspect | The ringed tile and the drawer |
| Segment ready | Deliver turns accent; Next steps back to ink |

## Patterns borrowed (and what each changes on screen)

1. Factorio alt-mode: machines show their output item as an icon on the building. Each machine
   carries its output token; a smelter shows an ingot, a kiln concrete, a refinery silica.
2. Mini Metro station shapes: shape, not only colour, separates kinds. Each item gets a shape as
   well as a colour (raw: chunk; refined: bar, sheet, coil, block, grain; parts: frame, chip, rotor).
3. Factorio and Satisfactory alert icons: a machine shows a mark only when it needs you. Running
   is shown by motion (spinning bit, glowing mouth, moving items), not by a green dot.
4. Mindustry block footprints: a building family is a silhouette. Extractor round, furnace with a
   chimney notch, maker square with a feed slot, generator hexagonal, Hub large and keyed.
5. Apple Maps layered tone: terrain, built ground, and panels are three tone steps; no lines
   between tiles. The grid is implied by the buildings, drawn only while placing.
6. Linear's command bar and hotbar quietness: tools are icons with short labels; the active one
   is a tone step plus accent underline, not a filled white pill.
7. Factorio production stats: the stock strip shows name, amount and rate with sign and colour.
8. iOS sheets: drawers come from the bottom on a phone, side on desktop, with a grabber and one
   close; only floating things cast a shadow.

## Roles

Every colour on screen is one of these. Values in `src/theme.js`.

| Role | Used for |
| --- | --- |
| `fog` | past the ring that opens next |
| `terrain` | surveyed rock, one disc with no seams, ended by a smooth `ink2` line |
| `next`, `hatch`, `edgeNext` | the ring that opens next: one tone off fog, faint diagonal hatching, a dashed outer line |
| `surface` | HUD, dock, drawer |
| `raised` | controls on a surface (cards, tool slots, advice) |
| `ink`, `ink2` | text; ink2 for secondary only, never running text |
| `accent`, `accentInk` | goal progress, the one suggested action, selection |
| `power` | power reach, poles, generators, power figure |
| `warn`, `bad` | starved / power short; disconnected / no power / no coal |
| `machine`, `machineOff` | building body; stood-by or unpowered body |
| `supply` | supply lines (was `belt` until belts were removed, 2026-11-08) |
| 12 item hues, two tones each | items only. Deep (`items`): swatches, line cargo, node patches, anything on the chart or a panel. Light (`itemsOn`): output tokens and cycle bars on machine bodies |

Separation: A's accent is orange and its warn is yellow, and their marks differ in shape
(accent is never a mark on a machine). B's accent is cobalt, its bad is red.

Contrast floor: ink on surface 7:1, ink2 on surface 4.5:1, accentInk on accent 7:1, deep item
tones 5:1 or better on `terrain` and `surface`, light item tones 6:1 or better on `machine`
(`docs/pieces/1-items-palette.py` generates both to target luminance and prints the ratios).

## Items

Colour plus shape, everywhere an item appears (HUD needs, costs, stock strip, line cargo, output
token, node patch). One drawing function feeds both the DOM (inline SVG) and the canvas (Path2D).

| Item | Shape |
| --- | --- |
| ore | chunk (irregular hexagon) |
| coal | slab (flat lens) |
| stone | pebble (rounded) |
| quartz | crystal (tall hexagon) |
| ingot | bar (trapezoid) |
| plate | sheet (thin parallelogram) |
| wire | coil (ring) |
| concrete | bricks (two offset rows) |
| silica | grain (three dots) |
| frame | frame (square ring) |
| circuit | chip (square with legs) |
| motor | rotor (circle with a cross) |

Piece 1, Byron's pick C (2026-11-08, #19364881): one hue per item in two strengths, no outlines.
Deep on paper (chart, panels, lines), light on machines (tokens, cycle bars); the colour is the
same item everywhere, only its strength follows the ground. Node patches are the deep tone at
16% alpha. Raw items keep earthy hues; refined and parts get distinct hues so no two greys sit
side by side: coal near-black, ingot slate blue, stone sand, concrete warm grey (shape block, so
never confused with stone's chunk).

## Map glyph language

- Building = a silhouette per machine in `machine`, its recipe inside in the light item tone.
  Piece 2, Byron's pick B plus C (2026-11-08, #19364882): the family is the base shape, each
  sibling adds its own outline detail, and the building reads as input to output without a tap.
  Hub: 3x3, accent keyline, the five-segment ring inside.
- Families and siblings: extractor (circle with teeth: coal drill 2, ore drill 3, quarry 4, quartz
  drill 6; a bit turns when running; output token in the middle), furnace (square body with its
  own roof: smelter one chimney top-right, kiln a dome, refinery twin stacks), maker (square with
  a row of roof vents by tier: press 1, wire drawer 2, assembler 3, fabricator 4, motor works 5;
  cycle bar under the output), generator (hexagon: burner a flame, turbine a turning rotor; coal
  token bottom-left), solar (cell grid).
- Recipe on furnaces and makers: output token large right of centre (48% of the body), each input
  as a small token down the left edge, an arrow in the output tone between. A furnace's recipe is
  at 75% strength when idle and full when running. Under 20 px inputs, arrow and vents drop and
  only the silhouette and output show.
- Problem marks, five states (piece 6, Byron 2026-11-09): trouble shows where it is. Machine
  marks only for the machine's own trouble: no power = `bad` round badge with a white bolt, top
  right; stood by = `machineOff` body with a `surface` badge, `ink2` ring and pause. Line trouble
  on the line: short of input = the line coming in for the short item goes `warn`, thicker and
  dashed (no line in at all: a dashed `warn` stub on the way in); output piling up = the line out
  goes `warn` with three of the output queued at the door and no items moving (no line out is
  the same thing: a `warn` stub with the three queued, on a free side toward the Hub, never into
  it). Queues and stubs draw after the machines so a neighbour never hides them. Running = plain
  line, items moving. Power short = nothing per machine (the HUD says it once). No green dots;
  the map marker always says Next (no Fix).
- Level of detail by tile size: under 20 px body, token and status marks only; 20 px and up adds
  motion, recipe inputs, vents and cycle bars; 40 px and up adds the machine name under the Hub ring and on
  selected tiles. Status marks are drawn at every size. Zoom range 16 to 64 px per tile.
- Tiles: no seams, no grid lines. With a tool in hand, tiles where the machine would run at once fill
  with `accentSoft` and a centre dot; tiles that are valid but need a pole get a faint dot only; invalid tiles stay plain and a tap names
  why. Power reach is a `powerSoft` fill on the covered tiles (one path, so no seams where tiles meet), no circles (twenty overlapping circles read as a web of lines). It shows only while placing a machine or with a generator or pole selected; no wires (piece 5, Byron picked A, 2026-11-09).
- Rings: the selected tile gets an `ink` ring; the tile Next points at gets a one-off `accent`
  flash that expands and fades. The two never look alike.
- Nodes: each field (a group of touching node tiles) is one rounded patch, overlapping discs of
  0.72 tile, in the deep item tone at 18% (`nodeAlpha`) with a thin rim of the same tone at 60%
  (`rimAlpha`, `rimW` 0.052 tile); every node tile carries two chunks in the item's shape. Fields
  in the next ring are drawn at `nextDim` with their chunks at `nextNode`; none past it. Each
  field is drawn once per zoom step to its own off-screen canvas, one image per field per frame.
- Ground, piece 3, Byron's pick C (2026-11-08, #19364888): the surveyed rock is a disc around the
  Hub ended by a smooth `ink2` line (`edgeW` 2.5 px); a tile is buildable when its centre is
  inside the line (the same rule as `W.revealed`, so what is inside the line is what you can
  build on). The ring that opens next is shaded and hatched inside a dashed line, labelled "Opens
  when <segment> is in" in a white pill at the first spot in the ring where it fits on screen.
  Power reach is clipped to the line.

## Type

One plain font, Archivo, for words and figures alike (piece 7, Byron picked C, #19364893). Five
sizes, far apart:

| Step | Size | Use |
| --- | --- | --- |
| figure-l | 26 | segment name, drawer title |
| figure-m | 18 | need amounts, stock amounts |
| body | 15 | advice, drawer text, sheet text |
| label | 13 | item names, card names, tool labels |
| micro | 12 | rates, sub-lines (minimum) |

Figures are tabular, units and denominators in ink2 at the smaller step. Sentence case
throughout, no tracked capitals, no monospace.

## Space, radii, elevation, motion

- Spacing on a 4 px step: 4, 8, 12, 16, 24. Phone outer margin 10 (plus safe areas), desktop 16.
- Touch targets 44 px minimum for every control on a phone.
- Radii: two values (control, panel) plus fully round for poles and badges.
- Elevation by tone: map 0, surface 1, raised 2. Shadow only on what floats over the map without
  being docked: drawer on desktop, sheet, toast.
- Motion: press 90 ms scale 0.97; drawer 180 ms; camera glide 400 ms ease-out; flashes 900 ms.
  Map motion (bits, glow, cargo) is the only continuous motion. Reduced motion: no transitions,
  machines still, cargo static.

## Components

HUD (goal ring, segment name, power, needs row, Next, Deliver); dock (tools, stock strip, hotbar);
hotbar card (silhouette icon, name, owned count, cost); drawer (inspect, stock, research, menu);
sheet; toast; hint. Each component has rest, pressed, focus (2 px focus ring in ink), disabled
and, where it applies, selected and short-of-cost states.

## Banned (taste `tells.md`, applied to an app)

Gradients, glows, glass and backdrop blur, neon on black, violet or indigo, cream with
terracotta, emoji, monospace, tracked uppercase labels, index numbering, hairline grids and
seams, icons in tinted squares, a status dot on every object, decorative shapes, shadows on
docked panels, more than five type sizes, more than two typefaces.

## Direction: B, Survey chart (picked by Byron 2026-11-08, #19364880)

B is the only token set. A (Foundry floor, dark) was dropped with its tokens; its description is
kept below for the record. Both shared the same structure, components and glyph language.

- **A, Foundry floor (dropped).** Dark warm graphite, molten orange accent, solid filled silhouettes,
  square-ish corners (control 4, panel 6), panels docked flush to the screen edges on a phone.
  Barlow and Barlow Condensed for figures. Reads like a machine on a night shift.
- **B, Survey chart.** Light: the rock as a printed survey chart on pale cool stone, buildings in
  dark ink with item-colour tokens, panels white, accent cobalt (the surveyor's pencil, far from
  `bad` red), power teal, rounder
  (control 10, panel 16). Words and figures in plain Archivo. Reads like a plan you are
  drawing on, and holds up in daylight on a phone.

## State map

The builder's state map is in `docs/design.md` ("Builder", "State map"); every row there must be
reachable with the same controls. Added by this system:

| State | Actions | Way forward |
| --- | --- | --- |
| Hotbar slot short of cost | Tap: tool selected, toast names the short item | Wait (rate shown in strip), stand by consumers |
| Focus by keyboard | Tab through HUD, tools, hotbar, drawer | Enter activates, Escape closes drawer or drops tool |
| Nothing affordable and nothing producing | Tap ore nodes (always +1 ore, no cost) | Next says "Tap an ore node" whenever no build is affordable and income is zero |
| Tool in hand, drawer open | Opening a drawer drops the tool; the hint's Done button also drops it | Back to inspect |
| Deliver | Disabled (tone, ink2 label) until a needed part is in stock; accent when ready | Delivers, segment may close |
| Demolish | Inspect, Demolish, "Tap again" confirm with refund shown | Tile free; no undo, so the confirm states the refund |
| Research | Drawer lists unlocked upgrades with cost; buy when affordable | Row turns Done; one way |
| Menu | Drawer: stock, research, new game, save note | New game asks to confirm with the play time lost |
| Zoom | Pinch, wheel; clamps at 16 and 64 px; double tap the Hub re-centres | Never lost: the Hub button in the menu centres the camera |
| Map grown | Sheet names new nodes; camera eases out to the new radius | Carry on |
| Back after time away | Away sheet | Carry on |

## Review, 2026-11-08

Independent review of this guide before building: shape legibility at 26-30 px tiles, missing
roles (lit, invalid, reach, selection versus Next), accent clashing with warn (A) and bad (B),
missing state rows. All folded in above. Blind juror on before (P) and the two directions,
phone and desktop, early, late, inspect and placing: B 50/70, A 48/70, before 27/70. Its top
defects were fixed: the map now marks where Next goes (ghost of the machine, accent ring and
label), A's machine bodies lifted a tone, extractor tokens larger, Next text no longer cut off,
power reach drawn as a tint without circles. Contrast floors checked for both token sets.

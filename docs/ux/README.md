# UX pass: the flow of decisions

Byron, 2026-11-09 (#19364898), after the ten-piece design system run: "we need to figure out the
flow of decisions. Maybe we do UX now and then fix up the skill later depending on how that goes."
So this pass is two things: the game's UX, and a trial of how design decisions should flow. The
design-hitl skill is written from what this pass teaches (management G124).

## How decisions flow in this pass

Taken from the lessons of the design system run (bot msg 1559), to be tested here:

1. Agree the list and its order first (this file), big to small: what the player does before how
   it looks.
2. Per decision, write the steps and states in plain words and get a yes before drawing anything.
3. Then one picture per decision, from the real game: as now, the simplest, and at most one more.
   The pick leans toward less.
4. His answer goes in the game, then the next decision.
5. At the end, one before/after of the whole game and a play-through.

## The decisions, big to small

| # | Decision | Status |
| --- | --- | --- |
| 1 | The whole game: the five segments from start to finish, what each needs and opens, and where the player sees that road | drawn (`1-road.png`), waiting on his pick |
| 2 | First minutes: how a new player learns what to do (the advice line as now, a few guided steps, or nothing) | proposed |
| 3 | Building: pick a machine, place it, place again, cancel | proposed |
| 4 | Connecting: drawing a supply line from one machine to another, and undoing it | proposed |
| 5 | Trouble: from seeing a problem to fixing it (tap, Next, the fix) | proposed |
| 6 | Goals: knowing what to make next, delivering, and the map growing | proposed |
| 7 | Research: what it unlocks and when you see it | proposed |
| 8 | Coming back: the away summary and picking up where you were | proposed |
| 9 | Menu: save, new game, settings | proposed |

Byron, 2026-11-09 (#19364899), on the order: "Maybe the first one should show the overall
progression steps needed to complete the game". Added as decision 1; the rest move down one.

## 1. The whole game

The road today (from `src/game.js`, times from `sim/balance.mjs`):

| Segment | Asks for | Opens | Done by |
| --- | --- | --- | --- |
| Anchor | 300 ingots | ore drill, smelter (from the start) | 4 min |
| Spine | ingots, plates, wire | coal drill, burner, press, wire drawer | 20 min |
| Lattice | frames, concrete | quarry, kiln, assembler, turbine | 1 h 3 min |
| Nerve | circuits, frames, wire | quartz drill, refinery, fabricator | 1 h 46 min |
| Engine | motors, circuits, concrete | solar field, motor works | 6 h 7 min |

Then the ring is whole and the rock leaves.

What the player sees now: the five-arc ring in the top bar, and only the current segment's parts.
The four ahead have no names until reached.

Proposed steps, for Byron's yes:

1. Tap the ring in the top bar: a list of all five segments opens.
2. Done segments are ticked. The current one shows its parts and progress.
3. Segments ahead show their name and the parts they ask for. The machines they open stay hidden
   until reached, so the build bar never shows locked clutter.
4. Close goes back to the map. A new game opens this list once, so the first thing a player sees
   is where the game ends.

Byron, 2026-11-09 (#19364900), on the steps: "I want this to be visual". So the list is drawn,
`1-road.png` (real phone, `?demo=3`, Lattice under way, made by `1-road-shots.cjs` and `1-road.html`):

- A: as now, the small ring in the top bar and only the current segment.
- B: tap the ring, a road top to bottom. Done stops ticked; the current one with its parts and bars;
  ahead stops with their parts as item shapes and the machines they let you build as greyed
  pictures; ends at "The rock leaves". (pick)
- C: tap the ring, the ring drawn big and filling, the parts each segment needs listed below with
  item shapes; no machines.

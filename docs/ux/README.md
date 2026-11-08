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
| 1 | The whole game: how it unfolds over six hours (pacing), not a screen | front half as now; Engine as an efficiency stage, options sent |
| 2 | First minutes: how a new player learns what to do (the advice line as now, a few guided steps, or nothing) | proposed |
| 3 | Building: pick a machine, place it, place again, cancel | proposed |
| 4 | Connecting: drawing a supply line from one machine to another, and undoing it | proposed |
| 5 | Trouble: from seeing a problem to fixing it (tap, Next, the fix) | proposed |
| 6 | Goals: knowing what to make next, delivering, the map growing, and where the player sees the road ahead (the ring list, 1-road.png) | proposed |
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

Byron, 2026-11-09 (#19364901), on the screen picture (1-road.png): "This is a ui thing. We're
talking about how we design the progression. Something a user wouldn't see but they would
experience". So decision 1 is the pacing itself. Where the road is shown moves to decision 6.

### The progression, drawn

![how the game unfolds](1-progression.png)

Tall marks are moments something new arrives: a machine, a resource or a research.

- A, as now (bot, 15 s checks): parts done at 4 m, 20 m, 1 h 3 m, 1 h 46 m, 6 h 7 m. Every new
  thing comes with a part, so Engine is 4 h 21 m of building more of the same.
- B, steady climb: parts done at about 10 m, 40 m, 1 h 40 m, 3 h 20 m, 6 h. Each part a little
  longer than the last, and Nerve and Engine each open one research part way through, so
  something new arrives about every hour. Longest stretch 1 h 20 m.
- C, play then leave: the first three parts in one 40 min sitting, then Nerve and Engine sized
  to run while the player is away, with a "come back in about 2 h" line. Same six hours.

Pick B: closest to the six-hour game with some idle time that was asked for, and it is numbers
only (what each part asks for, when two research open); C needs a new come-back feature. After
the pick, the parts are retuned and the bot checks the times.

Drawn with `docs/ux/1-progression.py`.

Byron, 2026-11-09 (#19364902), on 1-progression.png: "I like the idea of getting to engine
quickly. But we need some creative freedom enabled so people can work on efficiency for the last
4 hours."

So the front half stays as A (Engine reached at about 1 h 46 m), and the last four hours become
an efficiency stage instead of more of the same. Today in Engine the only levers are more
machines (each costs 13% more than the last), the Line balancing research, and removing a
machine gives half its cost back, so rebuilding a layout is punished. Options, for his pick:

- A: other recipes. Engine opens two or three second ways to make the same part (a motor from
  plates and wire with no ingots; circuits with more wire and no silica). Each is cheaper in one
  thing and dearer in another, so the best mix depends on the player's map. (pick)
- B: rate goals. Engine asks for a rate held, not a pile: motors a minute kept up for ten
  minutes. A tidier factory finishes sooner; the end screen keeps the best time.
- C: free rebuild. In Engine, removing a machine gives its full cost back and the map opens
  wider with richer patches further out, so tearing down and laying out again pays.

Pick A, with C's full refund in Engine as well since it is one number: recipes give the choices,
the refund makes trying them free. Numbers and bot times follow his pick.

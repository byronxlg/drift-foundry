import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, FancyArrowPatch

# Decision 1, Engine efficiency: good / better / best as what a player builds early, mid and late
# game with kit C (Byron #19364905). Rates from src/game.js; a line carries 1 item a second.
# python3 docs/ux/1-builds.py docs/ux/1-builds.png
out = sys.argv[1]
ink, soft, ground, red, green = "#1d1f22", "#6b6f75", "#f6f3ee", "#b23a2a", "#2f6f4f"
MACH, HUB = "#ffffff", "#ece6da"
ORE, INGOT, PLATE = "#8a6a4f", "#9aa3ad", "#4d6b8a"

fig = plt.figure(figsize=(9, 16.2), dpi=120)
fig.patch.set_facecolor(ground)
fig.text(0.06, 0.972, "What a player builds: good, better, best", fontsize=21, weight="bold", color=ink)
fig.text(0.06, 0.952, "One job, plates to the hub, built with the kit at three points in the game.\n"
         "A line carries 1 item a second. Real rates: drill 1 ore/s, smelter 2 ore to 1 ingot,\n"
         "press 2 ingots to 1 plate, each 2 s.", fontsize=11.5, color=soft, va="top")


def machine(ax, x, y, label, w=1.5, h=0.75, fc=MACH, ec=ink, note=None, ncol=soft):
    ax.add_patch(FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle="round,pad=0.02,rounding_size=0.12", fc=fc, ec=ec, lw=1.4))
    ax.text(x, y, label, ha="center", va="center", fontsize=10, color=ink)
    if note:
        ax.text(x, y - h / 2 - 0.28, note, ha="center", va="center", fontsize=9, color=ncol, weight="bold")


def piece(ax, x, y, label, fc):
    ax.add_patch(Circle((x, y), 0.32, fc=fc, ec=ink, lw=1.4))
    ax.text(x, y, label, ha="center", va="center", fontsize=12, weight="bold", color="#ffffff")


def line(ax, a, b, col, lw=3.0, dashed=False):
    ax.add_patch(FancyArrowPatch(a, b, arrowstyle="-|>", mutation_scale=12, color=col, lw=lw,
                                 linestyle="--" if dashed else "-", shrinkA=22, shrinkB=22))


def area(top, h, ymax):
    ax = fig.add_axes([0.06, top - h, 0.88, h])
    ax.set_xlim(0, 13); ax.set_ylim(0, ymax); ax.axis("off"); ax.set_aspect("equal")
    return ax


def head(top, key, when, uses):
    fig.text(0.06, top, key, fontsize=22, weight="bold", color=ink)
    fig.text(0.26, top + 0.004, when, fontsize=13, color=ink, weight="bold")
    fig.text(0.26, top - 0.013, uses, fontsize=11, color=soft)


def facts(top, rows):
    for i, (k, v, col) in enumerate(rows):
        fig.text(0.06 + i * 0.30, top, k, fontsize=10, color=soft)
        fig.text(0.06 + i * 0.30, top - 0.017, v, fontsize=13, weight="bold", color=col)


# Good: early game (Anchor, Spine). Lines only, one per machine, straight chains.
t = 0.885
head(t, "Good", "Early game: Anchor and Spine", "Lines only. One drill, one smelter, one press, in a row.")
ax = area(t - 0.03, 0.12, 2.6)
machine(ax, 1.2, 1.4, "Drill")
machine(ax, 4.2, 1.4, "Smelter")
machine(ax, 7.2, 1.4, "Press", ec=red, note="idle half the time", ncol=red)
machine(ax, 10.8, 1.4, "Hub", w=1.3, fc=HUB)
line(ax, (1.2, 1.4), (4.2, 1.4), ORE, 3.0)
line(ax, (4.2, 1.4), (7.2, 1.4), INGOT, 1.6)
line(ax, (7.2, 1.4), (10.8, 1.4), PLATE, 1.0)
ax.text(5.7, 1.85, "0.5 ingot/s, press wants 1", ha="center", fontsize=9, color=soft)
facts(t - 0.175, [("Plates a second", "0.25", ink), ("Machines", "3", ink), ("Working", "2 of 3 full", red)])

# Better: mid game (Lattice, Nerve). A merger lets two smelters fill one press exactly.
t = 0.66
head(t, "Better", "Mid game: Lattice and Nerve", "Merger. Two smelters fill one press exactly.")
ax = area(t - 0.03, 0.13, 3.0)
for y in (2.3, 0.7):
    machine(ax, 1.2, y, "Drill")
    machine(ax, 4.2, y, "Smelter")
    line(ax, (1.2, y), (4.2, y), ORE, 3.0)
    line(ax, (4.2, y), (6.4, 1.5), INGOT, 1.6)
piece(ax, 6.4, 1.5, "M", "#4f6f8f")
machine(ax, 8.4, 1.5, "Press")
machine(ax, 11.4, 1.5, "Hub", w=1.3, fc=HUB)
line(ax, (6.4, 1.5), (8.4, 1.5), INGOT, 3.0)
line(ax, (8.4, 1.5), (11.4, 1.5), PLATE, 1.6)
ax.text(7.4, 1.95, "1 ingot/s", ha="center", fontsize=9, color=soft)
facts(t - 0.185, [("Plates a second", "0.5", ink), ("Machines", "5 + 1 piece", ink), ("Working", "all full", green)])
fig.text(0.06, t - 0.22, "Ends where one press is full. More plates means a second copy, and a second\n"
         "hub line, which is where the late game starts.", fontsize=10.5, color=soft, va="top")

# Best: late game (Engine). Blocks sized to the line, overflow gives priority, nothing stalls.
t = 0.385
head(t, "Best", "Late game: Engine", "Overflow too. Blocks sized to one full line; the spare goes on.")
ax = area(t - 0.03, 0.2, 4.6)
for i, y in enumerate([4.1, 3.0, 1.6, 0.5]):
    machine(ax, 0.8, y, "Drill", w=1.2, h=0.6)
    machine(ax, 2.9, y, "Smelter", w=1.4, h=0.6)
    line(ax, (0.8, y), (2.9, y), ORE, 3.0)
piece(ax, 4.7, 3.55, "M", "#4f6f8f")
piece(ax, 4.7, 1.05, "M", "#4f6f8f")
for y in (4.1, 3.0):
    line(ax, (2.9, y), (4.7, 3.55), INGOT, 1.6)
for y in (1.6, 0.5):
    line(ax, (2.9, y), (4.7, 1.05), INGOT, 1.6)
machine(ax, 6.6, 3.55, "Press", w=1.3, h=0.6)
machine(ax, 6.6, 1.05, "Press", w=1.3, h=0.6)
line(ax, (4.7, 3.55), (6.6, 3.55), INGOT, 3.0)
line(ax, (4.7, 1.05), (6.6, 1.05), INGOT, 3.0)
piece(ax, 8.3, 2.3, "M", "#4f6f8f")
line(ax, (6.6, 3.55), (8.3, 2.3), PLATE, 1.6)
line(ax, (6.6, 1.05), (8.3, 2.3), PLATE, 1.6)
piece(ax, 9.8, 2.3, "O", "#5f7f4f")
line(ax, (8.3, 2.3), (9.8, 2.3), PLATE, 3.0)
machine(ax, 11.8, 3.4, "Assembler", w=1.7, h=0.6)
machine(ax, 11.8, 1.2, "Hub", w=1.3, h=0.6, fc=HUB)
line(ax, (9.8, 2.3), (11.8, 3.4), PLATE, 3.0)
line(ax, (9.8, 2.3), (11.8, 1.2), PLATE, 1.2, dashed=True)
ax.text(11.8, 2.3, "first", ha="center", fontsize=9, color=green, weight="bold")
ax.text(11.8, 0.55, "only the spare", ha="center", fontsize=9, color=soft)
facts(t - 0.255, [("Plates a second", "1", ink), ("Machines", "10 + 4 pieces", ink), ("Working", "all full, nothing stalls", green)])
fig.text(0.06, t - 0.29, "Each block is sized to one full line (2 smelters feed 1 press), copied side by side.\n"
         "The overflow feeds the assembler first, so a full assembler never stops the presses.",
         fontsize=10.5, color=soft, va="top")

fig.text(0.06, 0.03, "We build none of this: the game gives the kit and the line limit; the player finds these layouts.\n"
         "Good wastes half its press; Better and Best keep every machine busy, Best at four times the plates.",
         fontsize=11, color=ink, va="bottom")
fig.savefig(out, facecolor=ground)

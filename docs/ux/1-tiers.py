import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, FancyArrowPatch

# Decision 1, Engine efficiency: good / better / best scope of the system (Byron #19364904).
# python3 docs/ux/1-tiers.py docs/ux/1-tiers.png
out = sys.argv[1]
ink, soft, ground, red, green = "#1d1f22", "#6b6f75", "#f6f3ee", "#b23a2a", "#2f6f4f"
MACH, HUB = "#ffffff", "#ece6da"
ORE, INGOT = "#8a6a4f", "#9aa3ad"

fig = plt.figure(figsize=(9, 15.6), dpi=120)
fig.patch.set_facecolor(ground)
fig.text(0.06, 0.968, "Engine efficiency: good, better, best", fontsize=22, weight="bold", color=ink)
fig.text(0.06, 0.946, "All three use C: merger, splitter, overflow, and lines that carry a set amount.\n"
         "Each step adds to the one before.", fontsize=12.5, color=soft, va="top")


def machine(ax, x, y, label, w=1.5, h=0.8, fc=MACH, ec=ink):
    ax.add_patch(FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle="round,pad=0.02,rounding_size=0.12", fc=fc, ec=ec, lw=1.4))
    ax.text(x, y, label, ha="center", va="center", fontsize=10.5, color=ink)


def piece(ax, x, y, label, fc):
    ax.add_patch(Circle((x, y), 0.36, fc=fc, ec=ink, lw=1.4))
    ax.text(x, y, label, ha="center", va="center", fontsize=13, weight="bold", color="#ffffff")


def line(ax, a, b, col, lw=3.0, dashed=False):
    ax.add_patch(FancyArrowPatch(a, b, arrowstyle="-|>", mutation_scale=13, color=col, lw=lw,
                                 linestyle="--" if dashed else "-", shrinkA=26, shrinkB=26))


def factory(ax, loads=False):
    # two drills -> merger -> splitter -> two smelters -> overflow -> motor works first, spare to hub
    w = {"a": 3.0, "b": 3.0, "m": 3.0, "s1": 3.0, "s2": 3.0, "i1": 3.0, "i2": 3.0, "o1": 3.0, "o2": 2.0}
    c = {k: ORE for k in w}
    if loads:  # line thickness = how full; red = backed up
        w = {"a": 5.0, "b": 2.0, "m": 5.5, "s1": 4.5, "s2": 1.4, "i1": 4.5, "i2": 1.4, "o1": 5.5, "o2": 1.2}
        c["a"] = red
    machine(ax, 0.9, 2.6, "Drill")
    machine(ax, 0.9, 0.8, "Drill")
    piece(ax, 2.9, 1.7, "M", "#4f6f8f")
    piece(ax, 4.5, 1.7, "S", "#8f5f3f")
    machine(ax, 6.4, 2.6, "Smelter", w=1.6, ec=ink)
    machine(ax, 6.4, 0.8, "Smelter", w=1.6, ec=(soft if loads else ink))
    piece(ax, 8.3, 1.7, "O", "#5f7f4f")
    machine(ax, 10.6, 2.6, "Motor works", w=1.9)
    machine(ax, 10.6, 0.8, "Hub", w=1.3, fc=HUB)
    line(ax, (0.9, 2.6), (2.9, 1.7), c["a"], w["a"])
    line(ax, (0.9, 0.8), (2.9, 1.7), ORE, w["b"])
    line(ax, (2.9, 1.7), (4.5, 1.7), ORE, w["m"])
    line(ax, (4.5, 1.7), (6.4, 2.6), ORE, w["s1"])
    line(ax, (4.5, 1.7), (6.4, 0.8), ORE, w["s2"])
    line(ax, (6.4, 2.6), (8.3, 1.7), INGOT, w["i1"])
    line(ax, (6.4, 0.8), (8.3, 1.7), INGOT, w["i2"])
    line(ax, (8.3, 1.7), (10.6, 2.6), INGOT, w["o1"])
    line(ax, (8.3, 1.7), (10.6, 0.8), INGOT, w["o2"], dashed=True)
    if loads:
        ax.text(0.9, 3.2, "backed up", ha="center", fontsize=10, color=red, weight="bold")
        ax.text(6.4, 0.05, "idle 60%", ha="center", fontsize=10, color=soft)


def head(top, key, name, pick):
    fig.text(0.06, top + 0.012, key, fontsize=24, weight="bold", color=ink)
    fig.text(0.06, top - 0.008, name, fontsize=14, color=soft)
    if pick:
        fig.text(0.94, top + 0.014, "pick", fontsize=13, weight="bold", color=ground, ha="right",
                 bbox=dict(boxstyle="round,pad=0.35", fc=green, ec="none"))


def area(top, h=0.12, x=0.06, wdt=0.88, xmax=12):
    ax = fig.add_axes([x, top - h - 0.03, wdt, h])
    ax.set_xlim(0, xmax); ax.set_ylim(0, 3.4); ax.axis("off"); ax.set_aspect("equal")
    return ax


def card(ax, x, y, w, h):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.15", fc=MACH, ec=ink, lw=1.2))


# Good
t = 0.882
head(t, "Good", "The kit", False)
factory(area(t))
fig.text(0.06, t - 0.16,
         "Lines carry about one a second. Merger, splitter and overflow open on the way to Engine.\n"
         "In Engine, taking a machine down gives all its cost back. The goal is still a pile.\n"
         "You feel a better layout only as Engine finishing sooner; nothing tells you why.",
         fontsize=12, color=ink, va="top", linespacing=1.4)

# Better
t = 0.635
head(t, "Better", "Good, plus see it and aim at it", True)
factory(area(t), loads=True)
ax = area(t - 0.14, h=0.05, xmax=24)
ax.set_ylim(0, 3.0)
card(ax, 0.3, 0.3, 23.4, 2.4)
ax.text(0.9, 1.95, "Motors a minute", fontsize=12, color=ink, weight="bold", va="center")
ax.text(23.0, 1.95, "12 of 15, held 6:20 of 10:00", fontsize=12, color=ink, ha="right", va="center")
ax.add_patch(FancyBboxPatch((0.9, 0.7), 22.2, 0.5, boxstyle="round,pad=0,rounding_size=0.25", fc="#e3ddd2", ec="none"))
ax.add_patch(FancyBboxPatch((0.9, 0.7), 22.2 * 12 / 15, 0.5, boxstyle="round,pad=0,rounding_size=0.25", fc=green, ec="none"))
fig.text(0.06, t - 0.23,
         "Lines get thicker as they fill and go red when backed up; a machine shows how often it sits\n"
         "idle. Engine asks for motors a minute kept up for ten minutes, in three steps, not a pile.\n"
         "You can see where it jams and you have a number to beat.",
         fontsize=12, color=ink, va="top", linespacing=1.4)

# Best
t = 0.315
head(t, "Best", "Better, plus a score to beat", False)
ax = area(t, h=0.13, xmax=24)
ax.set_ylim(0, 6.2)
card(ax, 0.3, 0.2, 23.4, 5.8)
ax.text(0.9, 5.25, "Ring whole. Your Engine factory, at 15 motors a minute:", fontsize=12, color=ink, weight="bold", va="center")
rows = [("Machines", "22", "aim 18", "your best 20"), ("Power", "310 MW", "aim 260", "your best 290"), ("Space", "41 squares", "aim 34", "your best 38")]
for i, (k, v, par, best) in enumerate(rows):
    y = 4.2 - i * 1.0
    ax.text(0.9, y, k, fontsize=12, color=soft, va="center")
    ax.text(7.0, y, v, fontsize=13, color=ink, weight="bold", va="center")
    ax.text(14.0, y, par, fontsize=12, color=soft, va="center")
    ax.text(19.0, y, best, fontsize=12, color=soft, va="center")
ax.text(0.9, 0.75, "Redo Engine on this map", fontsize=12, color=green, weight="bold", va="center")
fig.text(0.06, t - 0.175,
         "When the ring is whole, the Engine factory is scored on three counts: machines, power\n"
         "and space, each with an aim and your best. You can start Engine again on the same map\n"
         "to beat it. Kept on your device; no scores from other players.",
         fontsize=12, color=ink, va="top", linespacing=1.4)

fig.text(0.06, 0.082, "Pick Better: a target and a way to see what holds it back is what makes the pieces worth\n"
         "using. Best is a later add on top and changes nothing in Better.",
         fontsize=12, color=ink, va="top", linespacing=1.4)
fig.text(0.06, 0.028, "Better is close to shapez (goals at a rate) and Satisfactory (see what is starved);\n"
         "Best borrows Opus Magnum's three scores. Numbers are examples until the bot sets them.",
         fontsize=10.5, color=soft, va="top")
fig.savefig(out, facecolor=fig.get_facecolor())

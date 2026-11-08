import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, FancyArrowPatch

# Decision 1, the Engine stage: simple pieces the player combines (Byron #19364903).
# python3 docs/ux/1-pieces.py docs/ux/1-pieces.png
out = sys.argv[1]
ink, soft, ground, red, green = "#1d1f22", "#6b6f75", "#f6f3ee", "#b23a2a", "#2f6f4f"
MACH = "#ffffff"
ORE, INGOT = "#8a6a4f", "#9aa3ad"

fig = plt.figure(figsize=(9, 14), dpi=120)
fig.patch.set_facecolor(ground)
fig.text(0.06, 0.965, "Engine: simple pieces, your design", fontsize=22, weight="bold", color=ink)
fig.text(0.06, 0.94, "The last four hours are about building it better, not building more.\n"
         "What makes that possible: a few simple pieces and a reason to use them.", fontsize=12.5, color=soft, va="top")


def machine(ax, x, y, label, w=1.5, h=0.8, fc=MACH):
    ax.add_patch(FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle="round,pad=0.02,rounding_size=0.12", fc=fc, ec=ink, lw=1.4))
    ax.text(x, y, label, ha="center", va="center", fontsize=10.5, color=ink)


def piece(ax, x, y, label, fc):
    ax.add_patch(Circle((x, y), 0.36, fc=fc, ec=ink, lw=1.4))
    ax.text(x, y, label, ha="center", va="center", fontsize=13, weight="bold", color="#ffffff")


def line(ax, a, b, col, lw=3.2, dashed=False):
    ax.add_patch(FancyArrowPatch(a, b, arrowstyle="-|>", mutation_scale=13, color=col, lw=lw,
                                 linestyle="--" if dashed else "-", shrinkA=26, shrinkB=26))


def panel(top, key, name, pick, draw, text):
    fig.text(0.06, top + 0.012, key, fontsize=24, weight="bold", color=ink)
    fig.text(0.11, top + 0.014, name, fontsize=17, weight="bold", color=ink)
    if pick:
        fig.text(0.94, top + 0.014, "pick", fontsize=13, weight="bold", color=ground, ha="right",
                 bbox=dict(boxstyle="round,pad=0.35", fc=green, ec="none"))
    ax = fig.add_axes([0.06, top - 0.16, 0.88, 0.15])
    ax.set_xlim(0, 12); ax.set_ylim(0, 3.4); ax.axis("off"); ax.set_aspect("equal")
    draw(ax)
    fig.text(0.06, top - 0.17, text, fontsize=12.5, color=ink, va="top", linespacing=1.4)


def draw_a(ax):
    machine(ax, 1.4, 1.7, "Ore drill")
    machine(ax, 1.4, 0.5, "Ore drill")
    for y in (2.9, 1.7, 0.5):
        machine(ax, 6.2, y, "Smelter")
    machine(ax, 10.4, 1.7, "Hub", fc="#ece6da")
    for a in ((1.4, 1.7), (1.4, 0.5)):
        for y in (2.9, 1.7, 0.5):
            line(ax, a, (6.2, y), ORE, lw=1.4)
    for y in (2.9, 1.7, 0.5):
        line(ax, (6.2, y), (10.4, 1.7), INGOT, lw=1.4)
    ax.text(0.6, 3.1, "any number of lines, any amount", ha="left", fontsize=10, color=soft)


def draw_b(ax, overflow=False):
    machine(ax, 1.0, 2.5, "Ore drill")
    machine(ax, 1.0, 0.9, "Ore drill")
    piece(ax, 3.1, 1.7, "M", "#4f6f8f")
    piece(ax, 4.9, 1.7, "S", "#8f5f3f")
    machine(ax, 7.0, 2.6, "Smelter")
    machine(ax, 7.0, 0.8, "Smelter")
    line(ax, (1.0, 2.5), (3.1, 1.7), ORE)
    line(ax, (1.0, 0.9), (3.1, 1.7), ORE)
    line(ax, (3.1, 1.7), (4.9, 1.7), ORE)
    line(ax, (4.9, 1.7), (7.0, 2.6), ORE)
    line(ax, (4.9, 1.7), (7.0, 0.8), ORE)
    if overflow:
        piece(ax, 9.0, 1.7, "O", "#5f7f4f")
        line(ax, (7.0, 2.6), (9.0, 1.7), INGOT)
        line(ax, (7.0, 0.8), (9.0, 1.7), INGOT)
        machine(ax, 11.0, 2.6, "Press", w=1.3)
        machine(ax, 11.0, 0.8, "Hub", w=1.3, fc="#ece6da")
        line(ax, (9.0, 1.7), (11.0, 2.6), INGOT)
        line(ax, (9.0, 1.7), (11.0, 0.8), INGOT, lw=1.6, dashed=True)
        ax.text(11.0, 3.2, "first", ha="center", fontsize=10, color=soft)
        ax.text(11.0, 0.05, "only the spare", ha="center", fontsize=10, color=soft)
    else:
        machine(ax, 10.4, 1.7, "Hub", fc="#ece6da")
        line(ax, (7.0, 2.6), (10.4, 1.7), INGOT)
        line(ax, (7.0, 0.8), (10.4, 1.7), INGOT)
    ax.text(3.1, 2.3, "merger", ha="center", fontsize=10, color=soft)
    ax.text(4.9, 2.3, "splitter", ha="center", fontsize=10, color=soft)


panel(0.865, "A", "As now", False, draw_a,
      "A machine shares with every line it has, and a line carries any amount.\n"
      "Nothing to design: building more is the only way to make more.")
panel(0.60, "B", "Two pieces", True, draw_b,
      "A line carries a set amount (about one a second) and a machine has one line out.\n"
      "Merger joins up to three lines, splitter shares one out to up to three. A full side\n"
      "is skipped, so what you put first gets fed first. That is the whole kit.")
panel(0.335, "C", "Three pieces", False, lambda ax: draw_b(ax, overflow=True),
      "B plus an overflow: it fills its first line and sends only the spare on.\n"
      "One more piece to learn, one more way to set what gets fed first.")

fig.text(0.06, 0.112, "B and C: each piece opens on the way to Engine, one per part, and the advice line\n"
         "shows it once. In Engine the goal becomes motors a minute kept up, not a pile, and taking\n"
         "a machine down gives all its cost back, so pulling down a layout to make it better is free.",
         fontsize=11.5, color=ink, va="top", linespacing=1.4)
fig.text(0.06, 0.038, "From shapez, Factorio, Satisfactory, Mindustry and Opus Magnum: a handful of plain pieces\n"
         "plus a limit is what makes players design. Numbers and bot times follow your pick.",
         fontsize=10.5, color=soft, va="top")
fig.savefig(out, facecolor=fig.get_facecolor())

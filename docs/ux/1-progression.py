import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
out = sys.argv[1]
H = 60
SEG = ["Anchor", "Spine", "Lattice", "Nerve", "Engine"]
COL = ["#c9b8a0", "#9fb4c7", "#b9c99f", "#c7a9c0", "#e0b070"]
opts = [
  ("A", "As now", [4, 20, 63, 106, 367], [0, 4, 20, 63, 106],
   "Busy first hour and 46 min, then 4 h 21 m of Engine\nwith nothing new: more of the same machines."),
  ("B", "Steady climb", [10, 40, 100, 200, 360], [0, 10, 40, 100, 150, 200, 280],
   "Each part a little longer than the last.\nSomething new about every hour, to the end."),
  ("C", "Play, then leave", [5, 20, 40, 160, 360], [0, 5, 20, 40, 160],
   "One sitting of 40 min for the first three parts.\nNerve and Engine run while you are away; the game\nsays when to come back."),
]
fig = plt.figure(figsize=(9, 11.25), dpi=120)
fig.patch.set_facecolor("#f6f3ee")
ink, soft = "#1d1f22", "#6b6f75"
fig.text(0.06, 0.955, "Decision 1: how the game unfolds", fontsize=22, weight="bold", color=ink)
fig.text(0.06, 0.928, "Six hours start to finish. Tall marks are the moments something new arrives\n(a new machine, a new resource or a research).\nColours are the five ring parts: Anchor, Spine, Lattice, Nerve, Engine.", fontsize=12.5, color=soft, va="top")
tops = [0.80, 0.555, 0.31]
for (key, name, ends, news, feel), top in zip(opts, tops):
    ax = fig.add_axes([0.06, top - 0.075, 0.88, 0.075])
    ax.set_xlim(0, 370); ax.set_ylim(-1.2, 1.6); ax.axis("off")
    start = 0
    for i, e in enumerate(ends):
        e = min(e, 366)
        ax.add_patch(FancyBboxPatch((start + 0.6, -0.5), e - start - 1.2, 1.0, boxstyle="square,pad=0", fc=COL[i], ec="none"))
        cuts = [start] + [n for n in news if start < n < e] + [e]
        w, a0, b0 = max((b - a, a, b) for a, b in zip(cuts, cuts[1:]))
        if w > 28:
            ax.text((a0 + b0) / 2, 0, SEG[i], ha="center", va="center", fontsize=11, color=ink)
        start = e
    for n in news:
        ax.plot([n, n], [-0.5, 1.15], color=ink, lw=2.2, solid_capstyle="butt")
    gaps = [(b - a, a, b) for a, b in zip(news, news[1:] + [ends[-1]])]
    g, a, b = max(gaps)
    ax.annotate("", xy=(a + 1, -0.85), xytext=(b - 1, -0.85), arrowprops=dict(arrowstyle="<->", color="#b23a2a", lw=1.4))
    label = f"{g // 60} h {g % 60} m with nothing new" if g >= 60 else f"{g} m"
    if key == "C": label += " (you are away)"
    for h in range(7):
        ax.text(h * 60, -1.25, f"{h} h", ha="center", va="top", fontsize=9.5, color=soft)
    ax.text((a + b) / 2, -1.75, label, ha="center", va="top", fontsize=11, color="#b23a2a")
    fig.text(0.06, top + 0.045, f"{key}", fontsize=24, weight="bold", color=ink)
    fig.text(0.11, top + 0.047, name, fontsize=17, weight="bold", color=ink)
    if key == "B":
        fig.text(0.94, top + 0.047, "pick", fontsize=13, weight="bold", color="#f6f3ee", ha="right",
                 bbox=dict(boxstyle="round,pad=0.35", fc="#2f6f4f", ec="none"))
    fig.text(0.06, top - 0.12, feel, fontsize=12.5, color=ink, va="top", linespacing=1.4)
fig.text(0.06, 0.07, "A is measured by the play bot. B and C are targets: picking one means\nretuning how much each part asks for, then the bot checks the times.", fontsize=11, color=soft, va="top")
fig.savefig(out, facecolor=fig.get_facecolor())

"""Render the retained component and spatial evidence with Matplotlib; no transport."""
import base64
import io
import json
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

data = json.load(sys.stdin)
labels = ["P1 remainder", "Density", "Phase", "Sun columns", "Product grouping", "Split/combined", "Higher/ref gap"]
fig, axes = plt.subplots(1, 3, figsize=(19, 6.5), gridspec_kw={"width_ratios": [1.3, 1.2, 1.3]})
ax = axes[0]
matrix = np.array(data["summary"]["cosine"])
im = ax.imshow(matrix, vmin=-1, vmax=1, cmap="RdBu_r")
ax.set_xticks(range(7), labels, rotation=65, ha="right", fontsize=9)
ax.set_yticks(range(7), labels, fontsize=9)
for i in range(7):
    for j in range(7):
        ax.text(j, i, f"{matrix[i,j]:.2f}", ha="center", va="center", fontsize=8,
                color="white" if abs(matrix[i,j]) > .65 else "black")
ax.set_title("Aligned component opposition / reinforcement")
fig.colorbar(im, ax=ax, shrink=.6, label="Normalized dot product; negative opposes")

ax = axes[1]
rows = [r for r in data["rows"] if r["time"] == "12:30" and r["channel"] == 8]
if rows:
    points = ax.scatter([r["separation"] for r in rows], [r["elevation"] for r in rows],
                        c=[r["cancellation"] for r in rows], s=100, cmap="viridis", vmin=0, vmax=1)
    for r in rows:
        ax.annotate(f'{r["gridX"]},{r["gridY"]}', (r["separation"], r["elevation"]), xytext=(4, 5), textcoords="offset points", fontsize=8)
    fig.colorbar(points, ax=ax, shrink=.6, label="Pointwise amplitude cancellation")
ax.set_xlabel("Sun separation (degrees)")
ax.set_ylabel("Elevation (degrees)")
ax.set_ylim(-2, 94)
ax.axhline(20, color="gray", linewidth=.6, linestyle="--")
ax.set_title("Spatial witnesses: 12:30, 454 nm\nOnly retained points; no filled sky field")

ax = axes[2]
witnesses = data["orderWitnesses"]
x = np.arange(len(witnesses))
for offset, key, label in [(-.25, "firstErrorW", "Measured P1 error"), (0, "secondErrorW", "Measured P2 error"), (.25, "remainderW", "Unisolated remainder")]:
    ax.bar(x + offset, [r[key] * 1000 for r in witnesses], .24, label=label)
ax.scatter(x, [r["netW"] * 1000 for r in witnesses], marker="D", color="black", s=23, label="Net residual", zorder=3)
ax.axhline(0, color="black", linewidth=.6)
ax.set_xticks(x, [f'{r["time"]}\n{r["wavelength"]:g} nm' for r in witnesses], fontsize=8)
ax.set_ylabel("Signed spectral radiance discrepancy (mW)")
ax.set_title("Cancellation across scattering orders\nFour independent P2 scalar witnesses")
ax.legend(fontsize=8)
fig.suptitle("Paper-atmosphere cancellation map — retained libRadtran comparison", fontsize=16)
fig.text(.02, .015, "P1 attribution uses a declared conditional correction path. The higher/ref gap is not proven higher-order error. Reference qualification remains open.", fontsize=10)
fig.tight_layout(rect=(0, .06, 1, .92))
svg, png = io.BytesIO(), io.BytesIO()
fig.savefig(svg, format="svg")
fig.savefig(png, format="png", dpi=110)
print(json.dumps({"svg": svg.getvalue().decode(), "png": base64.b64encode(png.getvalue()).decode(), "matplotlib": matplotlib.__version__, "python": sys.version}))

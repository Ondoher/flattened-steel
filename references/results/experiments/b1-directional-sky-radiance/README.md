# B1: Current Production Algorithm32

[Experiment definition and reproduction command](../../../../scripts/experiments/b1-directional-sky-radiance/README.md)
· [Current GPU report](gpu/result.md)
· [Run and input identities](gpu/manifest.json)

Run `npm run generate:algorithm32:b1-production` from the repository root to
compile and render the full published benchmark profile with current production
Algorithm32. It replaces the current report, tables, manifest, and six figures;
previous official results remain in Git history.

## The Six Official Figures

1. [Per-time spectral radiance RMSE](gpu/figures/b1-per-time-rmse.svg)
2. [Aggregate spectral radiance RMSE](gpu/figures/b1-aggregate-rmse.svg)
3. [Algorithm32 relative-error dome, 10:15](gpu/figures/b1-figure5-algorithm32-10h15-z41.png)
4. [Algorithm32 relative-error dome, 11:15](gpu/figures/b1-figure5-algorithm32-11h15-z31.png)
5. [Algorithm32 relative-error dome, 13:15](gpu/figures/b1-figure5-algorithm32-13h15-z21.png)
6. [Figure 5: published models and Algorithm32](gpu/figures/b1-figure5-relative-error-domes.svg)

The error plots use the independent published benchmark. Basic Bruneton is a
figure-only display control; physical scoring reads all 40 channels before Color.
The current baseline excludes ozone and preserves the researched numerical
settings documented by the experiment. Hardware/browser identities belong to
the run manifest; bitwise agreement across different graphics stacks is not
assumed.

# P0 Holdout And Measurement Freeze v1

Status: approved input for F8 and the remaining F9 measurement policy.

## Partitions

Regression and holdout positions are generated in sigma/v coordinates and
converted to physical x,z through the selected dome. They are disjoint by
construction.

The regression set is the monitor grids defined by p0-monitor-metric-freeze-v1.
The holdout uses 1,024 positions per source case: 128 positions in each of
eight strata: ordinary interior, ground-adjacent, cap-adjacent, map-center,
source-axis/subpoint, near rim, near source distance, and far source distance.
Each stratum uses a Sobol sequence scrambled with seed 673711. Coordinates are
generated and written once before any DirectJ2 or cache result, then sealed by
SHA-256. Every noncentered source case receives its reflected partner from the
same unit-square samples.

## Resources And Timing

Projected resident bytes include full R32F J2 payload plus every structured
row endpoint, row length, node id, validity flag, chart, mapping, and fixed
stencil byte. Isolated measurement allocates declared shared inputs, records
that baseline, builds exactly one child, scores it, disposes it, and verifies
return to baseline.

Use process.hrtime.bigint, three unreported warmups, seven measured repeats,
median duration, and minimum/maximum dispersion. Build time includes geometry,
row/node realization, DirectJ2 node population, and cache allocation. Query
time includes cache lookup/interpolation only. Holdout DirectJ2 and metric
scoring are separately timed and excluded from query time. Browser, GPU,
renderer, and application timing are excluded.

## Report Schema

A child record contains family/source/level identity, all input hashes, N,
row dimensions, valid nodes, projected bytes, measured baseline/total/
incremental bytes, timing statistics, direct metrics by required bin, monitor
diagnostics, and holdout seal hash. Terminal outcomes are characterized,
structurally-rejected, or inconclusive-needs-new-family.


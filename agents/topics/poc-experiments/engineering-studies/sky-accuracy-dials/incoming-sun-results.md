# H68 Sun-focused incoming quadrature results

Status: complete through accepted00449 numerical evidence and00450 serialized
geometry/reduction verification. The [plan](incoming-sun-plan.md) owns the frozen
screen; the [execution summary](incoming-sun-execution.md) owns decisions and
verification. Production and every earlier run remain unchanged.

## Result

Sun-focused incoming sampling materially improves these sunset J2 integrals.
At1024 directions both focused families have roughly1-1.4% mean absolute relative
error across all12 cases, versus5.1% for ordinary1024 and130.2% for ordinary68.
This is a local incoming-operator result, not a rebuilt N4 cache or paper score.

Primary results retain the existing Mie phase-mass normalization. The metric is
the unweighted mean absolute relative local J2 error across the same four H67
points and three wavelengths, against their independent path estimates:

| Directions | Ordinary mean / worst | Sun-focused mean / worst | Sun+horizon mean / worst |
| --- | ---: | ---: | ---: |
|68|130.22% /542.73%|23.86% /126.17%|12.35% /34.29%|
|256|36.94% /173.81%|4.27% /18.56%|7.08% /43.26%|
|1024|5.08% /23.75%|1.37% /3.78%|1.05% /4.13%|

Redistribution therefore helps separately from increasing count. Sun-focused256
outperforms ordinary1024 on both mean and worst error in this screen while using
one quarter as many incoming evaluations. It still has an18.6% worst-case error.
Sun1024 has the best worst-case fit; hybrid1024 has the best mean fit. Differences
between those two fine rules are small relative to the independent sampling
uncertainties in many cases; this does not establish a universal winner.

- [Normalized J2 comparison heatmap](../../../../../tmp/experiments/sky-accuracy-dials/runs/00449-h68-incoming-sun/normalized.png)
- [Raw weighted J2 comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00449-h68-incoming-sun/raw.png)
- [Actual incoming nodes and weights](../../../../../tmp/experiments/sky-accuracy-dials/runs/00449-h68-incoming-sun/grids.png)
- [Every case and aggregate score](../../../../../tmp/experiments/sky-accuracy-dials/runs/00449-h68-incoming-sun/analysis.json)
- [Aggregate TSV](../../../../../tmp/experiments/sky-accuracy-dials/runs/00449-h68-incoming-sun/summary.tsv)
- [Verification receipt](../../../../../tmp/experiments/sky-accuracy-dials/runs/00450-h68-sun-verify/verification.json)

All three PNGs were visually inspected. They show ratios and node placement,
not sky colors. The source is sampled at469.7/532.3/626.3nm only. SVG versions
and compact complete incident-radiance/direction/weight payloads are retained.

## The red sunset witness

At the89.5degree sunlit ground node,626.3nm J2 divided by the independent mean is:

| Directions | Ordinary | Sun-focused | Sun+horizon |
| --- | ---: | ---: | ---: |
|68|6.427|2.262|0.657|
|256|2.738|1.186|1.433|
|1024|1.237|1.038|1.041|

Coarse hybrid68 reduces the huge excess by undershooting34.3%; hybrid256 then
overshoots43.3%. More nodes do not monotonically improve every quadrature case.
The fine focused estimates still exceed the saved independent mean by3.8-4.1%
here, versus its1.75% empirical95% half-width. Do not call every fine result
converged or statistically indistinguishable from the reference.

The shadowed90.5degree red node gives Sun-focused ratios0.765/0.944/1.005 at
68/256/1024. This illustrates why a Sun-only coarse grid is not automatically
accurate when the physical source is below the local ground horizon.

These are continuous-L1 angular calculations. The original stored H67 J2 also
contains its small native-L1 transport error. Later recurrence propagation,
off-grid reconstruction and source integration were not repaired by this run.

## Grids and correct weights

Ordinary68 uses the exact retained F68 directions and weights. Higher ordinary
counts generalize its pinned-latitude/reflection construction. Sun focus warps
that base around the physical source direction with k=.35, then applies the
solid-angle Jacobian to every integration weight. Unlike an outgoing lookup
warp, this is an integration measure and cannot be omitted.

The hybrid splits the same total count equally between a Sun proposal and a
horizon proposal. The latter uses a truncated Cauchy inverse CDF in radial
cosine, width0.1, centered on the actual spherical ground horizon at each
point's altitude. Its weights use the50:50 balance-mixture density. Every weight
is positive; neither family is rescaled to force constant-field area or a fit.
Each proposal preserves whole-sphere support. Outgoing physical directions,
phase/SSA, atmosphere, source and optical integration stay fixed.

The maps pass independent numerical checks: inverse residual1.34e-15, Sun
Jacobian relative difference1.12e-9, horizon Jacobian1.30e-8 and mixture identity
2.23e-16. Finite quadrature is still approximate. At the sunlit ground node,
constant-field area errors are:

| Directions | Sun-focused area error | Hybrid area error |
| --- | ---: | ---: |
|68|-0.3604%|-5.6750%|
|256|-0.0755%|-0.7182%|
|1024|+0.0052%|+0.4427%|

Nonzero first moments are retained too. Hybrid68's relatively poor constant and
moment behavior limits its use as a general incoming rule despite its improved
local mean J2 score. Sun-only has cleaner manufactured controls at the tested
fine counts. No manufactured error was silently normalized away.

## Effect of Mie mass normalization

Raw weighted integrals and existing normalized integrals are both retained.
Their mean absolute relative errors are:

| Rule | Normalized mean | Raw mean |
| --- | ---: | ---: |
|Ordinary68|130.22%|192.15%|
|Sun68|23.86%|22.73%|
|Sun256|4.27%|3.24%|
|Sun1024|1.37%|1.37%|
|Hybrid68|12.35%|15.38%|
|Hybrid256|7.08%|6.96%|
|Hybrid1024|1.05%|1.24%|

Normalization strongly helps the original coarse rule in aggregate but does not
consistently help every new rule. This is another controlled cancellation result,
not evidence to remove normalization globally without rebuilding/qualifying the
full recurrence. The local accuracy improvement persists with raw weights.

## Verification, cost and limits

Ordinary68 reproduces all12 H67 continuous-L1 normalized J2 values exactly:
maximum relative replay residual0. The independent means/intervals remain
immutable H67 references, with1.60-2.59% empirical95% half-widths. No Monte Carlo
or libRadtran job was rerun.

All108 cases compare view64/128. Maximum observed primary J2 change is0.01505%,
well below the1% refinement trigger, so no256 view refinement was needed.
This qualifies the view integration control rather than establishing global
angular convergence. Source-column quadrature remains128 as in H67.

Accepted00450 authenticates parent controls, regenerates all36 grids, replays
every raw/normalized reduction from recorded incident radiance, verifies all108
comparisons and exact baseline parity, and retains analytic map proofs. Separate
checks confirm36 unique grids,108 unique case keys, hardware renderers and zero
unrequested refinements. All owned browsers are closed and scratch is zero.

The numerical run finalized successfully before its first post-seal verifier
rejected a JSON signed-zero comparison: the horizon center serialized as0 while
regeneration produced-0. The repaired read-only verifier compares exact
JSON-representable geometry, then recomputes every arithmetic result without
tolerance changes. No grid, radiance, score, source run or image was modified or
rerun.00450 records the new qualification rather than claiming the original
post-seal comparison passed.

The numerical/report run took185.611seconds before sealing, including immutable
I/O, browser launch and image production. Sum of measured case evaluation times
was42.072seconds, including GL context/program setup, uploads/readback and both
view controls. Counts cover97056 direction evaluations including controls.
These are not measured production build-time multipliers. Final retained evidence
is766948749bytes (about731.419MiB), within736MiB; scratch0. Local types, document
links, self-review and whitespace checks pass; no dedicated reviewer/audit ran.

Any nonbaseline family passes the deliberately weak20%-improvement/worst-error
screen against F68. That screen identifies candidates, not sufficient accuracy.
The practical intermediate candidate is Sun-focused256; fine Sun/hybrid1024
provide stronger local accuracy checks. Runtime lookup and final cache storage
would not gain an incoming axis, but builder cost and intermediate L storage can
grow with count. Neither was benchmarked in a full build here.

No complete N4 cache, B1/paper RMSE test, new scene render, later-order refinement
or production promotion was performed. A full-cache candidate must still meet
the owner's paper-RMSE gate, and the noon/twilight balance needs qualification.

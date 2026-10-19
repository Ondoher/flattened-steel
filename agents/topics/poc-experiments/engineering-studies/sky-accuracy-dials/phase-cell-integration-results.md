# H97-H104: phase-aware cell integration results

The phase-only proposal fails its joint accuracy gates. Accurate cell weights
repair phase mass, but converge to an imperfect representation of incoming
illumination. Positive interpolation between retained light samples is a useful
local follow-on; it does not establish a robust, practical replacement builder.
The campaign has a negative phase-only and limited reconstruction disposition.
Production is unchanged. The experiment remains open.

The [execution record](phase-cell-integration-execution.md) owns decisions and
recoveries; the [plan](phase-cell-integration-plan.md) owns the registered gates.
[Accepted final replay00581](../../../../../tmp/experiments/sky-accuracy-dials/runs/00581-h104-phase-proof/summary.json)
verifies the scientific evidence, local types and cleanup. Conditional broad,
fresh validation, native recurrence, B1 and full-scene stages were not earned.

## What was measured

Accepted00566 proves84 observed geometry/grid/construction partitions plus20
aligned/limiting cases. The physical cells cover the sphere without negative
area or a bridge across a registered ground/horizontal discontinuity. Maximum
relative full-area error is1.27e-14; ground-cap area error is6.17e-7.

Accepted00570 contains72 local pure-J2 spectral fields: six exposed geometries,
two optical profiles, three bands and two concentration settings. Every incoming
L value is reused from authenticated earlier64/128path traces. Rayleigh remains
identical in all causal operators. No new illumination ray or reserved physical
validation reference was generated.

- A: original Gauss integration coefficients and point phase.
- B: actual cell solid angles and point phase.
- C: phase integrated over each physical cell, with one unchanged L per cell.
- C-star: outgoing-centered, independently refined integration of that same
  piecewise-constant illumination. It is a numerical operator check, not an
  independent physical atmosphere.

All72 cell-weight fields satisfy mass error<=1e-6 and both successive TV<=5e-4.
All72 independently checked normalized-output envelopes are<=0.1% of the frozen
reference/floor scale after the two targeted refinements authenticated by00575.
These are empirical numerical envelopes, not certified error bounds.

Mean absolute local-J2 error,18 fields per row:

| Profile | Concentration k | A original | B true-area point | C cell phase |
| --- | ---: | ---: | ---: | ---: |
| Paper | .5 | .595% | .770% | .734% |
| Toronto | .5 | 1.404% | 1.504% | 1.320% |
| Paper | .35 | .742% | .853% | .808% |
| Toronto | .35 | 1.161% | 1.744% | 1.464% |

These exposed-panel means are diagnostics, not full-cache RMSE or prospective
qualification. The complete Sun4096 controls remain separate whole comparisons.

## The decisive witnesses

Signed total-J2 errors against the retained physical reference:

| Toronto witness | k | A | C | Azimuth reconstruction | Bilinear reconstruction |
| --- | ---: | ---: | ---: | ---: | ---: |
| Near-Sun red | .5 | -4.872% | -3.086% | -2.875% | -.796% |
| Sideways green | .5 | +3.935% | +2.358% | +1.889% | -2.017% |
| Near-Sun red | .35 | +.265% | +1.814% | +2.019% | +2.495% |
| Sideways green | .35 | +6.326% | +6.183% | +5.390% | -3.033% |

For k=.5, C passes the sideways20% gain but fails the registered50% near-Sun
raw-Mie-defect reduction. For k=.35, C fails the sideways20% gain. Both failures
survive the paired shared-history reference analysis and numerical sensitivity.
Phase mass becoming one is an engine check, not a separate atmospheric gain.

The bounded reconstruction wave uses only positive, outgoing-independent donor
weights, with sector/physical-support checks and no new L traces. k=.5 bilinear
is the most promising local result: it substantially reduces the near-Sun
deficit. Its sideways gain is unresolved once reference sampling uncertainty is
included, and the complete protected panel was not qualified. At k=.35, neither
reconstruction qualifies; the azimuth variant has a resolved Toronto protected
regression. Bilinear also changes the paper sideways error from the complete
control's-.742% to-2.686% at k=.5 and-3.854% at k=.35. Avoid describing those
transfers as a general accuracy improvement.

## What this establishes

Integrating P accurately is possible. A sharper or displaced phase lobe can be
accounted for without retracing illumination for every outgoing direction.
Toronto's actual piecewise-linear phase table also permits an exact azimuth
integral between its cosine knots. The independent refined arc check agrees to
1.49e-10; no material fit or post-hoc phase-mass rescaling is involved.

However, integrating that phase function against a constant L in each cell is
still a choice about illumination. The original Gauss nodes are neither measured
cell averages nor general cell centroids. Replacing their integration weights
with actual areas already changes the answer; B-to-C isolates the additional
phase treatment. Near-Sun k=.5 Toronto B is closer than C, so the A-to-C gain
must not all be credited to phase integration.

The decomposition retains unchanged Rayleigh error, C-minus-C-star phase error,
and the remaining Mie residual. The last combines illumination reconstruction
and finite-path transport error. Fine phase convergence and small64/128 path
changes do not prove that the entire residual is reconstruction error. A matched
continuous finite-path contrast would be required for that stronger attribution.
Accepted00578 directly integrates the signed64/128 nodal difference under both
reconstructions at the k=.5 near-Sun witness. All four observed changes plus
their numerical envelopes are below1e-6 of the reference scale. This tightens
the loose maximum-node bound and preserves the bilinear raw-Mie gain; it still
does not certify convergence to continuous-path truth.

## Builder cost and conditional disposition

The inherited builder has8640physical rows,4374outgoing directions and40bands.
A dense4096cell weight tensor would occupy2.67GiB for one row across40bands,
or22.5TiB across all rows. Neither was allocated. Streaming bounds memory, but
does not make phase integration free. L2 needs the global J2 field before the
next order; retaining all K for N2-N4 or recomputing it on each global pass is a
real scheduling choice.

The qualified binary64 prototype takes394-2714ms per4096cell/outgoing field
(median542ms). The GPU pilot measures roughly100-1049ms at its tested orders,
but its Toronto float32 weights fail the1ppm mass gate. These are prototype
measurements with dispatch/readback overhead, not an optimized native benchmark
or a lower bound for future methods. The direct implementation is cost-limited;
sharing L alone does not establish practical total build cost.

H101 broad/fresh qualification, H102 native recurrence and H103 full-paper/scenes
were therefore not triggered. The phase-only rule fails scientifically; the
bounded reconstruction lead remains exploratory and lacks practical/protected
qualification. No B1 improvement, production fix, N4 benefit or standards-
compliance result is claimed. A future method could investigate reusable
positive illumination basis functions and their phase-weighted moments, with
cost measured before reopening broad qualification.

## Reviewable evidence

- [Causal screen image](../../../../../tmp/experiments/sky-accuracy-dials/runs/00577-h100-phase-view/causal-screen.png)
- [Positive reconstruction comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00577-h100-phase-view/light-reconstruction.png)
- [Toronto near-Sun cell/light/phase maps](../../../../../tmp/experiments/sky-accuracy-dials/runs/00571-h98-phase-maps/toronto-node-89-cells.png)
- [Toronto sideways cell/light/phase maps](../../../../../tmp/experiments/sky-accuracy-dials/runs/00571-h98-phase-maps/toronto-reserved-out-1-cells.png)
- [Final paired gates and uncertainty](../../../../../tmp/experiments/sky-accuracy-dials/runs/00579-h100-decisions/gates.json)

Images are numerical maps and signed spectral-band errors, not three-band sky
colors. Physical sky colors and scene renders remain conditional on a qualified
method with15/40band observer spectra.

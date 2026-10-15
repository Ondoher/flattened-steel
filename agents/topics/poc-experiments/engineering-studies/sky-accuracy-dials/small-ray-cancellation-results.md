# Small-Ray Cancellation: Separating Approximation From Reference Differences

Accepted **00251-h9-small-rays** joins the retained small-ray references without
new atmospheric integration. Open the
[offline tables](../../../../../tmp/experiments/sky-accuracy-dials/runs/00251-h9-small-rays/joined.html)
or [numerical evidence](../../../../../tmp/experiments/sky-accuracy-dials/runs/00251-h9-small-rays/joined.json).
This continues the [H8 map](cancellation-map-results.md). Fixed paper physical
inputs and the [libRadtran metric](reference-model-target.md#current-accuracy-metric)
remain in force; reference configuration/convergence equivalence is still open.

## Revised Attribution

The five original rays show that much of H8's negative unresolved remainder
persists in the cache-free calculation with all orders included in expectation.
At 454 nm, its continuous-solver/libRadtran deficit is 3.805-16.510 spectral mW,
whereas the aggregate higher-order approximation is only -1.082 to +2.451.
The latter is positive at four of those five scalars. The earlier suggestion
that the dominant gap generally represented insufficient cached higher light
was too broad. Missing orders matter, especially at 360 nm, but do not explain
the large near-Sun visible deficit by themselves.

This does not certify the cache-free solver as exact. Its shared-formulation
systematics, the reference configuration, and physical/model differences remain
possible causes of the continuous-solver/libRadtran gap. The two calculations
are evidence for separating hypotheses, not interchangeable authorities.

Let `A` be H8's original P1, `P` its independent physical P1, `H` the original
orders two through four, `C` the direct all-order estimate, and `R` retained
libRadtran. Then pointwise:

```text
P1 error                 = A - P
Higher approximation     = H - (C - P)
Continuous/reference gap = C - R
Net residual             = (A - P) + (H - C + P) + (C - R)
                         = A + H - R
```

The six conditional P1 terms remain available in the numerical evidence; the
seventh H8 term is replaced by higher approximation and continuous/reference gap.
The same sampled `C` enters those two new terms with opposite signs. Their
sampling uncertainties are correlated and cancel in the exact sum; do not treat
their intervals as independent or fit a regression to that algebraic opposition.

## Five Shared Rays

These are 00230's five original rays at four wavelengths, matched to H8's exact
geometry and 00103's physical coefficients. This remains the H8 H-hybrid baseline,
not the Native48 alternate baseline below. At **454 nm**, all quantities are
spectral mW m^-2 sr^-1 nm^-1:

| Ray | Elevation | Sun separation | P1 error | Higher approximation | Continuous/reference gap | Direct sampling +/-95% | Net |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A: 09:30, 5,7 | 33.75 | 14.73 | +16.963 | +2.451 | -15.771 | 0.577 | +3.644 |
| B: 12:30, 3,5 | 71.92 | 5.11 | +18.217 | +0.603 | -16.510 | 0.891 | +2.310 |
| C: 12:30, 3,4 | 71.92 | 12.82 | +13.628 | +1.184 | -12.042 | 0.653 | +2.770 |
| D: 12:30, 0,4 | 12.12 | 60.48 | +1.966 | -1.082 | -3.805 | 0.219 | -2.921 |
| E: 12:30, 4,4 | 90.00 | 22.16 | +6.748 | +0.722 | -5.645 | 0.340 | +1.825 |

Across all 20 scalars, P1 error is positive and the continuous/reference gap is
negative at every scalar. All 20 gap signs survive the retained marginal sampling
interval. Five original precision targets remain missed; their intervals and
flags are preserved rather than relabelled as qualified. The original
[direct convergence results](direct-convergence-results.md) own that precision
boundary and systematic-check limits.

Subset RMSE against retained libRadtran is **3.315** for H8's original baseline
and **8.547** for the direct solution. The measured P1-error RMS is **9.877**;
aggregate higher-approximation RMS is **2.102**. These selected-ray scores are
not a full-sky ranking or justification for retaining known reconstruction error.

### What Can Be Assigned To Later Orders

At the four independently qualified P2 scalars, subtract the known P2 error
from aggregate higher approximation. This leaves an orders-three-plus
approximation/truncation estimate relative to `C`:

| Ray | nm | P2 error | Orders-three-plus approximation | Direct sampling +/-95% |
| --- | ---: | ---: | ---: | ---: |
| A | 360 | +1.160 | -4.064 | 0.239 |
| A | 454 | +2.532 | -0.081 | 0.577 |
| B | 360 | +0.834 | -3.294 | 0.330 |
| B | 454 | +1.332 | -0.729 | 0.891 |

The 360 nm deficit is large compared with the sampling interval and retained
P1/P2 numerical allowances. Neither negative 454 nm tail sign is resolved by
the direct sampling interval alone. This is aggregate order-three-plus evidence,
not an allocation among transport quadrature, angular quadrature, reconstruction
and orders beyond four.

The matched N5/N6 increment supplies 2.071-4.963 mW at 360 nm but only
0.309-1.365 mW at 454 nm on these five rays. On the matched ten-scalar subset,
higher-approximation RMS falls from **2.794 to 1.316** after adding it. Individual
visible scalars can worsen: the morning 454 nm higher approximation rises from
+2.451 to +3.119. More orders and more accurate lower-order reconstruction need
to be assessed jointly; an extra positive order is not automatically a correction
to an already excessive sum.

## Six Alternate Rays: A Separate Baseline

The 00232 packet supplies six additional rays at five wavelengths, all at least
30 degrees from the Sun. Its original **Native48 control** is retained separately.
Across those 30 scalars, libRadtran RMSE improves from **2.410** for that control
to **1.463** for its direct solution. This reverses the score trend on the original
five-ray set. Do not pool the two baselines or infer a whole-sky result from either.

The afternoon low ray illustrates why opposition alone is insufficient. At
13:30, 12.115-degree elevation and 454 nm, approximation is **+9.412**, direct
minus libRadtran is **-3.732**, and their sum is **+5.680**. The opposing
approximation overshoots, leaving a larger absolute discrepancy than the direct
solution. The morning low ray has the reverse arrangement at 454 nm:
approximation **-1.273**, direct/reference gap **+1.911**, net **+0.637**.
Errors differ by location, time and wavelength; no single brightness adjustment
or universal score-driven correction follows.

## Actual Flat Horizon: Separate Physical Attribution

00245's 0.05/3/20-degree rays retain actual Flat local-Sun N1 contributions,
including species spectra and distance strata. Their Native15 basis, finite
source, geometry and physical input packet remain separate from the spherical
paper comparison. They cannot fill missing near-horizon libRadtran error cells.

At 3 degrees, total linear R/B is **0.9892**: blue Rayleigh has R/B **0.9039**,
while warmer Mie has R/B **1.5787**. Contributions beyond 100 km provide about
**25.4% of total R but 4.4% of total B**. This is physical light balancing in the
declared N1 equation, not independently measured species error. The
[H4 results](horizon-assumption-results.md#h4-where-the-contributions-arise) own
its exact fixed-extinction interpretation and controls.

## Testable Hypotheses

These hypotheses are selected for investigation, not established causes or
authorization for new compute. Freeze a specific bounded test before executing it.

| Hypothesis | Predicted discriminating observation | Test and falsifier |
| --- | --- | --- |
| **A. A phase/source-angle or reference-configuration difference contributes substantially to the near-Sun visible gap.** | Matching the actual phase law, angular convention and source/observer packet should preferentially reduce the 454 nm A/B/C deficits, rather than merely apply a common gain. | First authenticate the exact libRadtran input/phase/profile packet and compare it to the fixed paper solver. Use independent P1 and then selected order comparisons under the reconciled packet. If those inputs already agree and the gap survives qualified independent transport, this explanation is weakened; investigate solver systematics. Do not tune g or SSA to the score. |
| **B. Order truncation is a stronger numerical limitation at 360 nm than at 454 nm on these rays.** | Extending a consistently refined lower-order solution should preferentially reduce the 360 nm deficit; at A/454, adding orders alone can increase numerical excess. | Reuse the retained four/six-order prefixes and direct interval first; a future matched reconstruction-by-order comparison would distinguish truncation from lower-order bias. A visible deficit as large as the violet one after lower-order correction, or inadequate six-order prefix identity, would challenge the current interpretation. |
| **C. The afternoon low-ray overshoot is largely an approximation problem.** | Correcting the responsible cache/path representation at the frozen physical inputs should move the +9.412 mW approximation toward zero; the corrected total may still remain below libRadtran. | Isolate density, attenuation and higher-order reconstruction on that exact ray against the retained all-order estimate, with an upper-sky control. If those operations cannot account for a material part of the approximation, broaden numerical attribution rather than alter physical aerosol parameters. |
| **D. Flat N1 neutrality is mainly the retained species/path balance, so a numerical N1 repair alone will not necessarily restore orange.** | A cache correction that converges to the same continuous N1 equation should approach its near-neutral 3-degree spectrum while preserving the blue upper control. | Compare cache and continuous Rayleigh/Mie spectra at matched 0.05/3/20-degree rays and source geometry. A numerically qualified warm continuous N1 result under identical inputs, or a large unexplained cache species bias, would challenge this explanation. Flat higher orders remain a separate untested influence. |

The cheapest next discriminator is A's reference-input audit, alongside C's
retained-data numerical attribution where matching interventions exist. New
near-horizon all-order evidence remains necessary before transferring the
spherical order conclusions to the Flat gray band.

## Verification And Resources

The [definition](../../../../../tmp/experiments/sky-accuracy-dials/runs/00251-h9-small-rays/definition.json)
and [seal](../../../../../tmp/experiments/sky-accuracy-dials/runs/00251-h9-small-rays/sealed.json)
retain parent seals/artifact hashes, source snapshots, equations, tool identity,
parameters, correlated-uncertainty interpretation and output identities. Seal:
`e5ad837519c43766eaa1484eb64c229c3f9c2461f67b43eb45173caa2ba829e4`.

Parents are 00250, 00109, 00103, 00099, 00230, 00232, 00245 and the authenticated
published-model table. All earlier evidence remains immutable. Runtime source is
`experiments/sky-accuracy-dials/cancellation-map/join-small-rays.mjs`;
`node` plus that path allocates a fresh run.

The join verifies successful parent results; unique selectors; paper medium,
spectral coefficients, solar irradiance and ground albedo; original five-ray
origin/direction identity; alternate-ray derived elevation/Sun angle; exact
published-reference joins; stochastic order additivity; P1 numerical compatibility;
and Flat species/distance-stratum additivity. The complete experiment type check
passes. The HTML is a fixed offline table, without interpolation or browser/GPU
execution.

An initial check stopped before run allocation because it compared independently
integrated P1 estimates as if identical to 1e-10 W. Their largest difference,
3.171e-10 W, is below the original two-method empirical allowances. The join now
uses those unchanged allowances plus the direct CPU refinement difference, retains
each difference/allowance, and does not claim exact P1 identity. No historical
tolerance or evidence was modified, and no cap was exhausted.

Accepted execution through retention took **8.880 seconds** within the 60-second
ceiling. New retained evidence is **348,530 bytes**, within 2 MiB; total experiment
retention after sealing is **407,051,357 bytes**. Scratch peaked at **4,485 bytes**
and its owned directory is verified absent. The seal records zero live scratch
and **140,000,055,296 free disk bytes**. No simulation, GPU job, dependency install,
parameter search or production change was performed.

This coherent unit starts at
`.codex-tmp/review-standards/session-RwbPUa/baseline.json`. Its
[review receipt](../../../../../.codex-tmp/review-standards/session-RwbPUa/summary.md)
owns implementation completion; earlier review scopes and historical results
retain their original status.

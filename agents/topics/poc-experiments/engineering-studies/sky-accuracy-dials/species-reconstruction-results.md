# H15: Species-Specific Second-Scattering Reconstruction

## Decision

Accepted **00263-h15-species** supports density-normalized species reconstruction
at all four registered ray/species RMS comparisons. The large benefit is in Mie;
Rayleigh improves modestly and retains two individual regressions on the low ray.
Splitting the unmodified physical payload alone has negligible effect.

This is a local second-scattering source comparison against an independent
same-finite-rule query calculation. It does not measure integrated sky radiance,
horizon color, a complete regenerated recurrence or libRadtran agreement.

The [exact results](../../../../../tmp/experiments/sky-accuracy-dials/runs/00263-h15-species/results.json)
and [per-query CSV](../../../../../tmp/experiments/sky-accuracy-dials/runs/00263-h15-species/comparison.csv)
own the original observations. The [H15 registration](horizon-diagnosis-plan.md#h15-next-action-sparse-second-scattering-reconstruction)
owns the plan and fixed decision criteria.

## Controlled Comparison

The original Native48 afternoon low and upper rays, `p-1330-0-4` and
`p-1330-5-4`, each supply six points: one-third and two-thirds of the ray-distance
interval inside each of their first three altitude cells. Actual heights range
from about 624 to 3958 m. Ray elevations remain about 12.115 and 71.919 degrees;
these are near-ground sample positions, not immediate-horizon viewing directions.

All cases use 454 nm, original F68 vectors/weights, S20/T40 trapezoids, the fixed
paper atmosphere and source, and the original monotone-cubic solar, linear altitude
and cubed-sphere directional interpolation. The run registers exact geometry,
128 sparse source coordinates and all weights before evaluating candidate error.
Sixteen cache locations and twelve query locations supply actual finite first-order
incoming radiance, including direct-ground reflection and combined extinction.
No full cache or GPU recurrence is allocated.

| Variant | Stored Float32 quantity | Reconstruction |
| --- | --- | --- |
| A | Combined physical Rayleigh plus Mie source | Original interpolation |
| B | Separate physical species sources | Same interpolation, then sum |
| C | Separate sources divided by each species' exponential local density | Same interpolation; restore query density once, then sum |

The producer uses receiver-local phase arithmetic. The independent binary64
query/node reference uses world-direction cosines, separately written analytic
phase/density expressions and compensated summation. It shares the frozen actual
incoming L1 definition and F68 weights intentionally. This isolates reconstruction;
the incoming field and finite quadrature are not independently converged here.
Both species consume the same incoming light and total extinction.

## Component Accuracy

RMS errors are in W m^-3 sr^-1 nm^-1 over all six registered queries per ray.

| Ray | Species | B: physical-source RMS error | C: normalized RMS error | Reduction | Local regressions |
| --- | --- | ---: | ---: | ---: | ---: |
| Low | Rayleigh | 4.46217e-8 | 4.28070e-8 | 4.067% | 2 |
| Low | Mie | 2.34529e-7 | 8.69030e-9 | 96.295% | 0 |
| Upper | Rayleigh | 4.42767e-8 | 4.31565e-8 | 2.530% | 0 |
| Upper | Mie | 1.73146e-7 | 9.72338e-9 | 94.384% | 0 |

Each reduction exceeds its prospectively frozen RMS comparison screen:
8.18925e-13 for Rayleigh and 3.17973e-12 for Mie. Screens were derived from
independent node arithmetic, Float32 storage/restoration parity and source scales,
before off-node scoring. They are engineering reconstruction screens, not total
physical-solver error bounds. No failed point was removed from an RMS comparison.

The B-minus-A total response has RMS 4.08973e-14 and maximum 8.61139e-14,
below those screens. The measured improvement therefore comes from density
normalization rather than splitting alone. Total-source RMS error falls by
81.806% on the low ray and 74.252% on the upper ray; absolute total error decreases
at all twelve points. This does not establish that a complete rendered scene
would improve by those percentages.

## How The Calculation Errors Balance

At the upper ray's first point, about 625 m altitude, the signed errors are:

| Error contribution | B: physical-source interpolation | C: density-normalized interpolation |
| --- | ---: | ---: |
| Rayleigh | -9.945 | -9.736 |
| Mie | +32.691 | +1.896 |
| Sum | +22.746 | -7.839 |

This table uses units of **1e-8 W m^-3 sr^-1 nm^-1**. Density normalization removes
most of the excessive Mie contribution while leaving much of the Rayleigh deficit.
The sum changes sign and becomes closer to zero. That is a measured numerical
balance between two reconstruction errors, not a physical brightness adjustment.

The retained cross terms `2 * errorRayleigh * errorMie` quantify opposition at
each identical query. B has opposing species errors at two of six points on each
ray; C has opposition at two low-ray and four upper-ray points. Neither that count
nor total error alone substitutes for the component accuracy table. The remaining
Rayleigh discrepancy has not been isolated among the unchanged reconstruction
operations or shared finite incoming-light definition.

## Verification, Resources And Continuation

Independent unrounded producer/reference node differences are at most
5.29396e-22 for Rayleigh and 1.05879e-20 for Mie. Stored physical or restored
normalized node discrepancies are at most 4.47523e-14 and 1.05281e-13 respectively.
Logical node-collapse lookups verify interpolation/storage parity at exact logical
nodes; this is not a full GPU arithmetic or physical-coordinate rounding proof.
The runner also checks original ray identities, support sizes, original numerical
controls, species cancellation identities and complete six-query strata.

The experiment type check passes. Run sealing and full artifact verification pass.
Seal SHA-256: `ed0a2eaa720fab5df00967dfffa757d6bef294771e32cb22c9d324fe5685bd0e`.
Execution through verification took **11.813 seconds**, below ten minutes; no GPU
job or retry occurred. New retained evidence is **688,720 bytes**, below 4 MiB.
Final retained experiment evidence is 422,133,830 bytes, scratch is zero and free
disk is 138,004,107,264 bytes. Production and previous evidence are unchanged.

One coherent implementation/review unit starts at `f5b7c5ac`, with baseline
`.codex-tmp/review-standards/session-hHhJOA/baseline.json`. Matching native primary,
independent source/audit and validation records in that session own the final
implementation-review verdict; earlier receipts retain their original scopes.

Execution decisions: use the experiment-owned scientific output boundary; reuse
historical density-factor work as context rather than an accuracy oracle; hold
actual finite incoming light fixed; assign only a total error to combined A; use
Float32 storage with binary64 CPU reconstruction/reference; freeze node-based
screens before off-node errors; preserve all local regressions; and stop at this
registered local comparison. The run's JSON records question/decision reasons.

The supported next proposed qualification is integrated pure P2 on witnesses with
retained independent references, preserving their own profile identities. Full
later-order propagation and alternative species grids/interpolators remain separate
registrations. H15 alone selects no production change or new compute campaign.

# H33 Second-Order Species Attribution

## Finding

The selected distant-Sun probes identify a substantial **incoming-angular
integration error at the second scatter**. F68 underintegrates the aerosol phase
function in these viewing directions, even with constant incident light. With
the physical incoming field, it loses Mie source while overestimating Rayleigh
source. These errors partly cancel in total intensity and bias the source blue.
The continuous observer-column position approximation has a much smaller effect
on these probes. This is a specific calculation to investigate, rather than a
conclusion drawn only from aggregate accuracy scores or screenshots.

Qualified immutable evidence:

- `00276-h33-recover-r2`: accepted derivative qualifying the completed physical
  artifacts from **failed** `00272-h33-species`: four receivers, full Native15,
  actual/column primary source positions, F68 and boundary-split 16/32 rules.
- `00274-h33-phase-r2`: manufactured constant-incident-field qualification,
  boundary 16/32/64 versus F68 and the analytic normalized phase integral one.
  Earlier `00273-h33-phase` remains preserved: it projected global up rather than
  selecting the incoming owner's reference-axis branch explicitly. For this
  frozen Sun both projected axes coincide; the corrected qualification changes
  phase integrals by at most 6.7e-16. The explicit-branch run owns the conclusion.

The [registration](horizon-second-order-plan.md) owns scope and predictions.
Production and the external archive remain unchanged. The failed original run
has not been relabeled or reopened. Its source-integrity guard failed because
type/JSDoc annotations were edited while computation was active. Recovery
reconstructed both original executable files to their exact captured SHA256,
proved identical TypeScript-emitted executable text after removing comments and
type syntax, authenticated unchanged executable collaborators and recomputed all
eight F68 actual/column controls. Every retained species-history value reproduced
exactly. The accepted derivative preserves these proofs and copied data, while
the original execution remains failed. `00275-h33-recovery` is a separately
preserved interrupted repair, stopped because per-direction storage guards were
too expensive. Its first terminal seal records the observed stop; it supplied
no completed receiver result.

## The Calculation That Fails

At a receiver, second scattering integrates incoming radiance times a phase
function over solid angle. A physically normalized phase function integrates to
one against a unit constant radiance field. F68 covers total solid angle 4 pi,
but its nodes and weights do not resolve the narrow Mie phase distribution for
these near-horizontal outgoing directions:

| Outgoing elevation | F68 Rayleigh phase integral | F68 Mie phase integral | Independent 64-rule Mie integral |
| --- | ---: | ---: | ---: |
| 0.05 degrees | 1.000315 | 0.651484 | 1.000000 |
| 3 degrees | 1.000359 | 0.658506 | 1.000000 |

Thus it misses approximately **34-35% of Mie phase mass** in this manufactured
case. This is angular discretization, not a failure of the continuous phase
formula's normalization. No division by these phase integrals was applied to the
physical results: constant-field normalization would not fix all errors in a
directional incoming field. The independent frame uses the authenticated Sun
axis, the selected reference axis projected orthogonal to it, and their cross
product; it matches the source
frame construction, including its 0.95 reference-axis switch, in the selected
production incoming-direction owner. This
does not qualify all GPU/compiler frame branches or all source/view angles.

## Physical Incoming Light And Cancellation

The following signed errors compare F68 with the boundary-32 rule at
**563.667 nm**. Both use the same continuous N1 incoming field and the same
material, physical paths, attenuation, black ground and receiver factors.
These are local spectral source-density errors, not final pixel brightness.

| View elevation | Receiver altitude | Final Rayleigh source | Final Mie source | Combined P2 source |
| --- | ---: | ---: | ---: | ---: |
| 0.05 degrees | 5 m | +13.24% | -37.35% | -24.53% |
| 0.05 degrees | 250 m | +9.77% | -43.25% | -29.23% |
| 3 degrees | 5 m | +13.20% | -37.63% | -25.66% |
| 3 degrees | 250 m | +10.25% | -41.97% | -28.85% |

Separating first and second species shows the deficit follows the **second
Mie scatter**, regardless of which species supplied the incoming light. At the
0.05-degree, 5 m receiver:

| First scatter | Second scatter | F68 signed error at 563.667 nm |
| --- | --- | ---: |
| Rayleigh | Rayleigh | +8.34% |
| Rayleigh | Mie | -39.68% |
| Mie | Rayleigh | +21.05% |
| Mie | Mie | -28.52% |

The net deficit is spatial/angular too. At that receiver, the grazing incoming
region contributes -13.68 percentage points of the total reference source and
the remaining sky contributes -10.84 points; ground-ending directions contribute
only -0.0033 points. Grazing means absolute local vertical cosine below 0.1,
approximately within 5.7 degrees of horizontal. These region totals include both
species and signed cancellation. It is not principally a missing reflected-ground
term in this black-ground case.

The physical source becomes less blue with the refined rule. At the lowest
receiver its Native15 source chromaticity moves from F68 `(0.234886, 0.235931)`
to reference `(0.242996, 0.247286)`. This supports a plausible mechanism for an
overly blue/dim horizon contribution. A source-density chromaticity is not a
rendered horizon color, and the corrected source remains blue under these inputs.

## Position Approximation And Qualification

Replacing actual-point primary source evaluation with the continuous
observer-column approximation changes the refined total source by at most
**0.0787%** across all four receivers and 15 wavelengths. At the 5 m receivers
the maximum is below 0.0045%. This rejects a large effect from that particular
continuous positional substitution on these P2 probes. It does not reconstruct
old cache interpolation or exclude its errors at other angles/orders.

Boundary-16/32 differences are at most **0.0346%** of the total source over the
registered cells. Fixed preselected incoming directions checked with independent
path quadrature 8/16 differ by at most 2.35e-12 relative. This sampled path check
is not a certified global incoming-field bound. History/region closure errors
are below 6.6e-21 W/(m3 sr nm). The 3-degree F68 and boundary-32 results reproduce
the retained H19 sources at their three original wavelengths within 4.9e-15
relative. Constant-field boundary-64 phase integrals agree with one to roundoff.

## What This Explains And What Remains

The evidence now attributes a specific P2 imbalance to angular phase integration,
with a much smaller tested positional effect. It does **not** yet establish the
cause of the historical cache-migration appearance change: F68 was used on both
sides, and the archive metadata does not establish a one-factor comparison.
The [archive inventory](horizon-archive-evidence.md#h33-metadata-authentication)
owns authenticated display, solar-spectrum, observer and atmosphere facts.

Also, the current app's N4 total is brighter than the independent N4 reference,
whereas the tested F68 P2 source is deficient. Consequently this angular error
cannot alone explain that N4 excess. Cache reconstruction, transport and later
orders must supply other effects. No corrected full N2 view integral, regenerated
N4 candidate, local finite-source attribution, high-elevation phase map or matched
libRadtran horizon score is claimed. The next scientifically useful intervention
would propagate a qualified angular rule through matched orders while keeping
cache reconstruction and view integration fixed; it is not executed here.

## Execution And Review

Recorded producer/repair execution was 211.630 s + 5.060 s + 5.932 s + 88.280 s
+ 13.498 s: **324.400 s**, with zero GPU jobs and 3,931,311 retained bytes.
This includes one failed source-integrity run, one interrupted repair and a
superseded phase qualification. All five runs verified their immutable seals;
owned scratch was removed. This remains within the six-minute and 8 MiB package
allowances, including a conservative additional 30 s reservation for post-seal
verification and setup outside producer timing. Planning, implementation,
read-only archive inspection and standards
review are separate from that numerical timing.

The experiment type check passes. Declaration/read-only annotations were
tightened without changing executable arithmetic, but some edits occurred during
the physical run and caused its source-integrity failure. Their exact executable
equivalence and fresh control parity are qualified in 00276. H33 declarations
now live in the existing nearest `types.d.ts`. Required mapped review is
batched for this coherent unit. Implementation completion requires native CLEAN
validation at `.codex-tmp/review-standards/session-VcDmJv/validation.json`;
the validation file, rather than this link, owns the actual review state.

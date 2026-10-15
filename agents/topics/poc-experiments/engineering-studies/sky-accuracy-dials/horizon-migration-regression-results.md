# Distant-Horizon Migration Diagnosis: H28-H32

## Outcome And Scope

The owner-selected [plan](horizon-migration-regression-plan.md) has completed its
bounded available numerical comparisons as accepted **00271-h28-h32-migrate**.
The exact historical white-to-dark change remains unproven: its original images
and old N4 payloads are unavailable in this workspace. No production change was
made. The completed sparse controls establish these narrower findings:

1. The continuous N1 effect of replacing the observer column with actual-point
   illumination is very small at this San Jose noon state.
2. Uniform-15 view sampling strongly dims the immediate horizon and overbrightens
   the three-degree ray. Current quadratic-30 substantially reduces both errors.
3. Current retained app N4 is brighter and more blue-weighted than the independent
   N4 estimate at these rays. Their small direction-rounding mismatch remains a
   qualification limit; this is not exact N4 GPU parity or a libRadtran score.
4. A small observer-column overbrightness offsets part of the much larger
   uniform-view deficit on the lowest ray. This is a concrete N1 compensation,
   too small to explain a major historical appearance change by itself.

## H28-H29: What Can Be Reproduced

Git blobs on both sides of candidate commit `cd9d8a44` authenticate the display
factory, geometry direction mapping and Native15 profile. The old cache class
is deleted at the migration and replaced by the scene-cache class; both original
blobs are retained with full commit, Git blob and SHA-256 identities. Original
source is data, not executed historical production code.

The old representation has altitude and source-relative outgoing direction,
using a fixed observer reference column. The new representation adds actual-point
local solar zenith and a local source-relative direction frame. The old profile
defaults to 15 view intervals; its display factory selects Ferwerda by default,
whereas the migration selects the source-luminance-lift Bruneton model. Runtime
overrides and the exact old adaptation state are not authenticated here.

The former `tmp/extraterrestrial/` root is absent and `archives/` has no entries.
Thus there is no authenticated last-white/first-dark image pair, old N4 spectrum,
or historical display state to reproduce on the selected rays. Historical P6
descriptions remain documentary evidence. The controls below reproduce individual
continuous N1 operations, not complete old/new discrete implementations. The
missing historical N4 comparison cannot be replaced with an observer-angle clamp.

All new controls use the retained spherical/distant physical packet: five-meter
observer, source zenith about 13.89 degrees, canonical paper material, Native15,
black atmospheric ground, and independent physical sphere exits. The three
away-Sun rays are 0.05, 3 and 20 degrees above the local horizontal. Their medium
packets match all 45 retained reference groups exactly on a parsed-data comparison.

## H30-H31: Source Position Versus View Sampling

The observer-column control evaluates continuous primary scattering at
`[0, 0, R + altitude(actualPoint)]`, preserving the world outgoing direction and
parallel source. This is the continuous positional approximation underlying the
old representation; it does not recreate its discrete fields or interpolation.
The actual-point control evaluates the same source at the physical query position.
Both use the same real view extinction and physical endpoints.

| Elevation | Independent actual-point N1 Y, cd/m2 | Observer-column Y change | Uniform-15 actual-point Y error | Quadratic-30 Y error |
| --- | ---: | ---: | ---: | ---: |
| 0.05 degrees | 2,187.13 | +0.01059% | -37.676% | -0.888% |
| 3 degrees | 3,147.93 | +0.01037% | +7.276% | +0.165% |
| 20 degrees | 1,929.47 | +0.00243% | +1.622% | -0.046% |

At the lowest ray, quadratic 15/30/60/120 Y errors are respectively
-3.440%, -0.888%, -0.224% and -0.056%. The physical profile retains a brighter
band above the horizon even after independent integration. The calculation shows
how coarse view placement can exaggerate that contrast; it does not establish
that the old production run used these exact settings.

The positional change barely affects N1 here. On the lowest ray, local Sun zenith
changes from 13.890 degrees at the observer to 14.791 degrees at 100 km. This
modifies near-noon source extinction only slightly. That does not bound the effect
of the new axis in twilight, later scattering, cache interpolation or visibility
near a ground boundary. The axis remains physically necessary for those states.

Independent 16/32-node segmented source/view refinement differs by at most
4.55e-14 relative across the three rays. A separately structured logarithmic
128-node direct integral agrees within 4.08e-14. Local-frame round trips at
0/1/10/50/100 km pass 1e-12 absolute. These checks qualify the sparse continuous
control; they do not test actual production node addressing, packing, clamps or
interpolation. That part of H30 remains unsupported without compatible fields.

## H31: Current N4 Versus The Retained Independent Reference

N1 through N4 are summed inside each of the 16 original independent batches
before projecting Y and estimating its interval. The all-orders total is not
substituted for N4. Intervals below are marginal 95% Student sampling intervals;
they do not include all numerical/systematic uncertainty.

| Elevation | Independent N4 Y, cd/m2 | Retained app N4 Y, cd/m2 | App excess | Reference xy | App xy |
| --- | ---: | ---: | ---: | --- | --- |
| 0.05 degrees | 3,738.65 ± 15.98 | 4,204.62 | +12.46% | 0.28389, 0.29617 | 0.27611, 0.28591 |
| 3 degrees | 4,919.21 ± 14.70 | 5,425.26 | +10.29% | 0.28404, 0.30140 | 0.27827, 0.29249 |
| 20 degrees | 2,706.40 ± 5.61 | 2,947.17 | +8.90% | 0.24601, 0.25225 | 0.24507, 0.25016 |

The current app is not simply missing total horizon luminance relative to this
reference. It has a spectral excess, particularly blue at low elevations. This
reuses the earlier independently measured N4 discrepancy and supplies its
batch-preserving uncertainty and three-ray context; it is not a newly reproduced
historical regression or unique attribution to higher orders.

The retained app rays are Float32-rounded versions of the reference directions.
The largest N1 spectral sensitivity to that rounding is 1.81e-7 relatively.
That is not an N4 angular-error bound. Earlier H21-H26 qualification and its
remaining limits still apply; no new stochastic transport was performed here.
No verified matched libRadtran output exists for these exact horizon witnesses.

## H32: A Small, Identified Compensation

After the individual screens, `factorial-registration.json` fixes A as removing
the observer-column approximation and B as replacing uniform-15 integration with
the independently refined integral. The assessment reuses those completed N1
screen values; it is a descriptive factorial reduction, not an unseen prediction
or a new consistently regenerated N4 experiment. Its A+B cell is the continuous
target by construction and cannot serve as independent proof of an N4 correction.

On the 0.05-degree ray, the four Y values are:

| Cell | Y, cd/m2 | Spectral RMS against continuous actual-point N1, W/(m2 sr nm) |
| --- | ---: | ---: |
| Observer column + uniform 15 | 1,363.3963 | 0.01287061 |
| A: actual point + uniform 15 | 1,363.1150 | 0.01287397 |
| B: observer column + refined view | 2,187.3632 | 0.000003193 |
| A+B: actual point + refined view | 2,187.1315 | 0 by construction |

Correcting the positional approximation alone slightly worsens total error because
its old overbrightness had offset some view underweighting. Once view integration
is corrected, the same positional correction improves agreement. Each component
has its own continuous target, so this is stronger evidence than opposing deltas
alone. The positional brightness effect is only about 0.23-0.28 cd/m2, versus a
view deficit of roughly 824 cd/m2. It is a tiny compensation, not the missing
explanation of the visible band. At 3 and 20 degrees both corrections improve
the tested baseline error; compensation therefore depends on spatial location.

Complete spectral deltas, signed residuals, `deltaA dot deltaB`, interaction
`L_AB - L_A - L_B + L_0`, and exact delta-SSE checks are retained. Quadrature
refinement is far smaller than this effect. No descendant-regeneration claim,
new aggregate Kider score or full-paper libRadtran score is made.

## Display, Evidence And Disposition

The [comparison strips](../../../../../tmp/experiments/sky-accuracy-dials/runs/00271-h28-h32-migrate/comparison.svg)
show app N4, independent N4, continuous actual-point N1 and continuous column N1
under one p2 response, one recorded noon adaptation and independently integrated
CIE projection. They are diagnostic swatches, not historical screenshots.
Raw tone output and an explicit sRGB-transfer alternative are retained separately.
At this noon state p2 and base Bruneton differ by less than 0.00009 per channel
on these spectra. This does not reproduce the older Ferwerda/source-lift policies
or settle H27's final-encoding contract question.

`00271-h28-h32-migrate` retains `history.json`, `inputs.json`,
`individual-screens.json`, `factorial-registration.json`, `assessment.json`,
the SVG, and immutable definition/progress/seal records. Numerical execution
including retention and cleanup took **45.530 seconds**, with a conservative
30-second preflight reservation, zero GPU jobs and 2,849,074 bytes retained.
Owned scratch peaked at 7,231 bytes and cleanup passed. One pre-allocation Git
lookup attempted the deleted class at the new revision; selecting its replacement
scene-cache class corrected the source inventory. No successful science was retried.

Local type checking and immutable-run checks pass. One coherent mapped review
identified mutable nested input types beneath an outer readonly wrapper. The
runner now uses deeply readonly authenticated data and explicit owned copies
for legacy mutable-signature helpers. Input isolation, 30 source evaluations
and three complete uniform-15 traces preserve the retained numerical values
exactly; this contract repair does not rerun the full successful science job.
The refreshed mapped primary and source-first independent audit milestone is owned by
`.codex-tmp/review-standards/session-oqdBo1/validation.json`; implementation completion
requires that receipt to be CLEAN. Historical evidence and production are unchanged.

The bounded package is complete with explicit gaps: exact historical before/after
N4 and display reproduction, production interpolation/node parity, consistent
N4 intervention, N4 direction sensitivity and matched external horizon qualification.
Restoring authenticated historical screenshots/payloads would enable the precise
migration comparison. Sparse current N1/N4 cache-construction and interpolation
attribution is another possible follow-up; no further compute is selected here.

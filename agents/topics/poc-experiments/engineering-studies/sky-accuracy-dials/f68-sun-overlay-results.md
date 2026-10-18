# Original F68 plus Sun-focused incoming samples: H83-H88

Completed with a negative candidate disposition. Retaining the exact F68
backbone and adding Sun samples improves greatly over F68 alone, but none of
the tested overlays qualifies against competitive complete Sun-only controls.
Production is unchanged; the experiment remains open with no active job.
The [plan](f68-sun-overlay-plan.md) and [execution record](f68-sun-overlay-execution.md)
own scope, decisions, verification and recovery details.

## What we learned

**Keeping the original nodes does not preserve accurate broad coverage.** The
exact F68 quadrature has a first-moment residual of 2.941%, measured relative
to full-sphere solid angle. Both compact Sun replacement windows fail the
registered 2% geometry screen at every initial count. Independent split
Gauss64/128 integration shows that even an exact interior leaves a 2.628-3.362%
geometry residual from the fixed exterior. More Sun-region samples cannot
qualify those windows. This is a manufactured integration finding, not an
independent verdict about the physical horizon.

**A smooth full-sphere balance avoids that fixed exterior limit, but retains
an influential sparse numerator.** At +512 directions the red elevated-dusk
Toronto witness has a +44.16 percentage-point J2 residual. The aerosol source
accounts for +41.36 points, while sampled aerosol phase mass differs by only
-0.060%. The shared denominator is therefore not the main cause of that large
error. Increasing to +1024 reduces Toronto worst error to 24.09%, still far
above its equal-work complete control's 5.02%.

**Reducing the F68 share helps, but does not earn an advantage for retaining it.**
A preregistered follow-on keeps every physical sample and reduces the effective
F68 proposal share by factors4/16. The strongest attenuation approaches the
cheaper complete Sun1024 rule, without a resolved qualifying accuracy/cost
gain. No new radiance tracing was required: exact incident values were reused
and raw species integrals and phase mass were recomputed together. All original
and added directions remain charged in standalone cost.

## Complete development-panel comparison

Each entry has ten physical development targets and three spectral bands per
atmosphere. Values are mean / worst absolute relative **local atmospheric J2
source-density error**, in percent. These are not observer spectra, paper RMSE
or full-cache scattering-order results. References have retained uncertainty.

| Complete rule | Directions | Paper mean / worst | Toronto mean / worst |
| --- | ---: | ---: | ---: |
| Original F68, legacy diagnostic | 68 | 38.64 / 289.28 | 160.72 / 1717.44 |
| F68 + Sun512, count-based balance | 580 | 1.58 / 5.05 | 4.93 / 44.16 |
| Complete Sun580 | 580 | 1.45 / 6.29 | 2.75 / 9.28 |
| F68 + Sun1024, count-based balance | 1092 | 0.99 / 2.48 | 2.84 / 24.09 |
| Complete Sun1092 | 1092 | 0.89 / 3.30 | 1.64 / 5.02 |
| F68 + Sun1024, F68 share reduced4x | 1092 | 0.70 / 2.27 | 1.92 / 10.06 |
| F68 + Sun1024, F68 share reduced16x | 1092 | 0.68 / 2.56 | 1.73 / 6.51 |
| Retained complete Sun1024 | 1024 | 0.68 / 2.66 | 1.66 / 5.32 |
| Retained complete Sun1408 | 1408 | 0.78 / 2.00 | 1.15 / 3.71 |
| Retained complete Sun2048 | 2048 | 0.65 / 1.82 | 0.68 / 2.04 |

Some overlays improve an individual paper statistic. Shared-reference paired
analysis at both path resolutions nevertheless finds no registered advancement
route against a complete competitive control. Small differences remain
reference-limited; they are not proof that every possible F68 overlay is worse.
The +256 balance and both attenuated +512 rules are retained in the complete
figures and numerical report, including protected-case failures.

## Images and accepted evidence

- [Mathematical admission](../../../../../tmp/experiments/sky-accuracy-dials/runs/00486-h83-math-images/admission.png)
- [Exact backbone and added-node diagrams](../../../../../tmp/experiments/sky-accuracy-dials/runs/00486-h83-math-images/nodes.png)
- [First local comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00489-h85-report/comparison.png)
- [Final error/cost comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00494-h85-report/comparison.png)
- [Signed errors at every spectral witness](../../../../../tmp/experiments/sky-accuracy-dials/runs/00494-h85-report/witnesses.png)

00485 freezes both original grid identities, formulas, profiles, geometry,
placements, floors and decision rules.00486 owns the first mathematical images;
00487/00490 retain 360 spectral GPU/reused local cases.00488 independently
qualifies the compact-window mathematical limit.00492 registers the weights-only
mechanism before scoring;00493 derives 240 cases from authenticated exact-angle
incident values.00489/00494 own the progress/final reports and retained complete
control frontier. Accepted00495 independently replays all 600 new/derived case
reductions and verifies source weights, shared normalization, phase mass,
incoming-path controls, reference identities, types and immutable inventories.

The maximum path-resolution change across those cases is 0.0153%, far below
the large rejected errors. Shared-normalization closure is below 1e-12. Both
materials' reference cases remain qualified. Hardware GPU identity is retained
in the numerical packets and final verification; browser scratch is cleaned.

Failed00491 is preserved: a generic CLI verb activated an imported historical
registration entry point, whose figure spawn failed before any GPU or atmosphere
work. Unique command verbs prevent recurrence. No numerical payload was lost
or retraced because of that failure.

## Conditional work and limits

No prospective finalist passes the primary-placement advancement gate, so
second-placement atmospheric qualification, twelve reserved targets, native
J2/J3/J4 recurrence, full spectral B1 scoring and scenes are not triggered.
Both placements did receive mathematical preflight. A skipped conditional
phase is not a successful full-cache test; there is no new paper RMSE or
twilight-preservation claim.

No production horizon fault is inferred from this local experiment. The tested
calculation is the incoming angular integral during cache construction. It
does not correct final-view N1 outgoing interpolation or establish the expected
color of the flat/local horizon. No production code or cache was changed.

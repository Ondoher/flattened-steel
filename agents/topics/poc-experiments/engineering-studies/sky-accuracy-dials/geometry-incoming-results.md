# Geometry-driven incoming refinement: H75-H82

Completed with a negative candidate disposition. No tested refinement qualifies
against the complete Sun-only accuracy/cost controls. The experiment remains
open; production is unchanged. The [plan](geometry-incoming-refinement-plan.md)
and [execution summary](geometry-incoming-execution.md) retain scope and decisions.

## What the campaign established

The layered grid has a real placement-sensitive aerosol-numerator error. At the
sunlit-ground red witness, the width .03 Sun-heavy rule has a+12.24% J2 residual.
Two coincident base-layer rays carry 13.79% of its aerosol angular numerator.
Shifting only that layer by half the golden angle changes the residual to-2.02%;
shifting only the horizon layer leaves+12.93%. The exact Toronto phase mass and
species-resolved independent N2 references distinguish that numerator effect
from phase normalization and Rayleigh/Mie cancellation.

This is a local attribution, not a globally successful correction. The fixed
base shift moves a large error elsewhere in the development panel. Averaging
shifted and unshifted quadratures reduces placement extremes but still loses
to competitive complete controls. Coincident cubature points are not inherently
an invalid integral; their alignment with a sharp integrand explains this
particular numerical failure. This does not establish a production horizon fault.

Increasing resolution helps: the Sun-heavy rule improves Toronto mean/worst
errors from 3.45%/18.52% at 1024 directions to.85%/3.46% with 2048 and sharper
Sun concentration. Sun-only2048 nevertheless gives.68%/2.04%, with slightly
better paper results too. Sharpening everywhere is unsafe: Sun-only k .2 produces
paper high-altitude errors up to 19.27% at 1024, and Toronto worst18.44%.
Geometry-conditioned focus avoids the high-altitude failure but still fails
for a sideways near-ground outgoing direction.

## Comparable expanded-panel results

All entries below use the same10 physical development targets,3 spectral bands
and matched black-boundary local J2 references:30 cases per material. Values are
mean absolute relative error / worst absolute relative error, in percent. These
are numerical source-density probes, not full-cache observer radiance or B1 RMSE.

| Complete rule | Directions | Paper mean / worst | Toronto mean / worst |
| --- | ---: | ---: | ---: |
| Sun-only, k .35 |1024|0.68 / 2.66|1.66 / 5.32|
| Sun-only, k .35 |1408|0.78 / 2.00|1.15 / 3.71|
| Sun-only, k .35 |2048|0.65 / 1.82|0.68 / 2.04|
| Sun-heavy B, width .1 |1024|1.02 / 2.91|3.45 / 18.52|
| Sun-heavy B, width .1, k .2 |2048|0.69 / 2.11|0.85 / 3.46|
| Sun-heavy B, width .03 |1024|1.01 / 1.96|2.35 / 12.24|
| Width.03, base+horizon shifted |1024|0.97 / 2.97|2.08 / 9.63|
| Equal base-placement ensemble |1152-1280|0.99 / 2.36|1.82 / 6.36|
| Equal base+horizon ensemble |1280-1408|0.94 / 2.41|1.85 / 5.44|
| Finer base+horizon, fixed mixture |variable, up to 1408|0.87 / 2.44|1.67 / 5.23|

Ensembles average raw Rayleigh/Mie integrals and phase mass before normalization.
They share corresponding identical Sun directions; their counts are derived
standalone work, not measured build timings. Algebraic closure is 3.65e-15 and
shared incident values match exactly. Neither ensemble passes the registered
paired-reference improvement or lower-cost-equivalence route.

## Initial hypotheses and exploration disposition

- **Placement:** old B's endpoint placement improves Toronto on the original
  four-target panel, but fails the tighter manufactured geometry screen.
  Midpoint placement remains the controlled comparison; historical endpoint
  controls stay visible. Expanded-panel values above must not be compared as
  though they were the original12-case panel.
- **Sun share and additive coverage:** neither preserving more Sun samples nor
  retaining their exact positions while adding layers guarantees an improvement.
  Balance weights change, and sparse new layers can dominate a sharp numerator.
- **Horizon width:**.03 improves over.1; narrowing further to.01 reverses the
  benefit. Width-only refinement does not reach the complete-control frontier.
- **Focus/count:** sharper/doubled rules improve the rejected predecessor, but
  competitive Sun-only controls remain better. No4096 expansion of a dominated
  constant rule is justified.
- **Geometry-conditioned focus / sparse dusk:** rejected by Toronto protected
  cases; sparse versions also fail some.5% finalist moment screens.
- **Component phase:** base-only attribution succeeds locally, but the full
  shift variants fail the global gate. The follow-on shared-direction ensembles
  also fail. The subsequent component-only refinement uses saved finer rays while preserving
  the original mixture coefficients and Sun nodes. Base refinement helps more
  than horizon refinement; refining both gives Toronto 1.67%/5.23% at higher
  cost than Sun 1024's1.66%/5.32%. Neither this follow-on nor the ensembles earns
  advancement. These last two waves supply no transferable improvement or
  distinct untested mechanism warranting another refinement wave.

This rejects the tested formulas, not every possible adaptive angular rule.
Small paper differences are often reference-limited. Actual Toronto phase-mass
errors can remain large even for a good normalized total, so low total error
must not be called component-by-component mathematical correctness.

## Reviewable evidence

- [Placement comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00459-h79-report/comparison.png)
- [Allocation comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00463-h79-report/comparison.png)
- [Focus/count comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00469-h79-report/comparison.png)
- [Component-shift attribution](../../../../../tmp/experiments/sky-accuracy-dials/runs/00477-h79-report/components.png)
- [Final ensemble comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00478-h79-ensemble/comparison.png)
- [Component-only refinement](../../../../../tmp/experiments/sky-accuracy-dials/runs/00483-h79-partial/comparison.png)
- [Physical node diagrams](../../../../../tmp/experiments/sky-accuracy-dials/runs/00479-h79-grid-figure/nodes.png)

Accepted 00457-00479 preserve registrations, proofs, hardware results, independent
histories, numerical replay and figures.00483 adds component-resolution
derivatives.00484 owns final types/immutable-run verification; failed00480/00481
packaging receipts and the earlier accepted00482 proof remain immutable. There are2568 screen cases including repeated/reused controls,
plus 120 newly derived ensemble and 180 component-refinement cases. All 60 matched
local reference estimates qualify; the largest relative95% half-width is 2.59%.

No prospective finalist passes the primary-placement gate. Second-placement
radiance, fresh H80 validation, native recurrence, N4/full B1 scoring and scene
renders are therefore untriggered conditional work. Mathematical preflight at
both frozen placements is retained; it is not a claim of radiance robustness.
The12 reserved targets remain unexposed. There is no new paper RMSE, N4,
twilight-preservation or production-improvement claim.

# H113-H119: positive illumination-mixture results

The lead was followed through a 36-field local comparison, two representation/
species follow-ons, independent reference refinement and a working local GPU
weight prototype. The fixed midpoint improves the Toronto estimates substantially,
but worsens the paper-atmosphere estimates against complete Sun4096. No method
qualifies across both profiles. Production is unchanged; the experiment stays open.

The selected investigation is complete. [Accepted H119 replay](../../../../../tmp/experiments/sky-accuracy-dials/runs/00618-h119-final-proof/summary.json)
verifies 90 field derivatives, frozen statistics, operator checks, transport parity,
immutable parents and local types. The [execution record](positive-mixture-execution.md)
owns verification, timing and consequential decisions. The [plan](positive-mixture-plan.md)
retains the original gates and permitted adaptations.

## What changed in the evidence

The universal .5 midpoint was frozen throughout. It averages actual positive
phase/basis weights before numerator/denominator reduction, using the same 4096
incoming illumination samples. Its change from H100 is angular redistribution:
the measured denominator contribution is negligible. The original near-Sun
raw-Mie and opposite-Sun total-J gains reproduce and remain on the passing side
with refined references.

The midpoint was then evaluated at all six registered geometries, both profiles
and three bands: 36 fields. This is broader local evidence than the preceding
four-field result, but still one construction and exposed development cases.

The [final comparison image](../../../../../tmp/experiments/sky-accuracy-dials/runs/00616-h119-final-image/comparison.png)
shows every measured field against the same final references. Unmeasured
Sun-gated cells are labeled, rather than filled with a black placeholder.
These are signed-error diagnostic colors, not sky-color swatches or scene captures.
The image's original A is point quadrature on the candidate Bboth4096 grid;
it is not a deployed-production scene comparison.

Point estimates of floor-normalized absolute **local pure-J2 error**, percent:

| Method / 36 fields | Paper mean | Paper worst | Toronto mean | Toronto worst |
| --- | ---: | ---: | ---: | ---: |
| Complete Sun4096 control | 0.5212 | 0.9747 | 1.7380 | 3.5474 |
| Fixed midpoint, original Rayleigh | 0.6427 | 2.0816 | 0.8152 | 2.0408 |
| Midpoint with integrated Rayleigh | 0.7051 | 2.3277 | 0.8101 | 2.0622 |

These are not paper interval RMSE scores, observer radiance, N4 results or a
full-cache comparison. All share the registered physical inputs and black-boundary
local-J2 scope. Sampling uncertainty remains part of their interpretation.

The [final paired decisions](../../../../../tmp/experiments/sky-accuracy-dials/runs/00615-h119-mix-report/decisions.json)
retain 2000 resamples, shared spectral histories, independent target/profile
groups and frozen floors. Profiles are not pooled to conceal a regression.

## The follow-ons were tested

### Sun-gated representation

The attribution suggested different coordinate behavior near the Sun and on the
opposite side. A registered positive representation uses H100 inside 15 degrees
of incoming Sun angle, sector coordinates outside 30 degrees and a smooth
transition. Those angles were frozen before results; outgoing direction never
selects the donors. No mixture-fraction search or new illumination was used.

It strengthens the original near-Sun gain, but its Toronto opposite-Sun red error
reaches +5.5073%, versus the matched Sun4096 control's +3.5474%. On its 18-field
subset it fails both competitive mean/worst accuracy routes. It is not a complete
36-field alternative and is not presented as one. The independent angular
calibration supports the adverse witness; final replay retains a conservative
worst-error lower contrast rather than assuming every unmeasured field is correct.

### Integrating Rayleigh against the same midpoint illumination

An unchanged Rayleigh residual was a plausible limit, so it received a separate
registered diagnostic. The first two-field observation was subsequently
re-evaluated when the independent physical references improved. Its apparent
Toronto underprediction changed into a small excess; the Rayleigh integration
then moves that blue total from +0.4271% to +0.1946%. The paper green total instead
moves from -1.5145% to -1.7122%.

That new evidence earned a cheap extension to 12, then all 36 existing fields.
Rayleigh geometry weights were reused across bands/profiles only under exact
geometry/direction identity; Mie, source, atmosphere and illumination stayed fixed.
Nine analytic Rayleigh moment cases agree with independent Gauss integration.
The [complete component comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00614-h114-species-all/both-species.png)
shows that the extra correction is not a universal improvement: Toronto's mean
changes little and paper agreement worsens. This branch also fails to qualify.

## Numerical integration and physical accuracy remain separate

The GPU split-phase primitive passes nine actual Toronto zeroth/first moment
cases, maximum relative discrepancy 9.74e-8. The full hybrid pipeline generates
positive K at the two original Toronto witnesses, with mass within 1 ppm and
two successive weight changes below .0005. Its outputs match calibrated CPU K
closely. This is a working local GPU-assisted engine, not a qualified complete
GPU-native builder or proof for every material/geometry.

Independent outgoing-CDF calculations directly evaluate each illumination model
without using candidate K. Four critical witnesses per model were measured for
the midpoint and Sun-gated rule. All eight output envelopes are below 0.1% of
reference/floor. Tighter active-bound criteria are not silently passed:

- The midpoint near-Sun envelope is 0.01520%, above the approximately 0.00898%
  strict numerical budget for its close protection decision.
- Refined physical histories move the midpoint's joint protection upper margin
  below zero (-0.08974 percentage points), but a passing statistical margin alone
  does not close the stricter numerical-precision gate.
- Sun-gated's calibrated adverse witness can reject its competitive routes
  without spending further work certifying an irrelevant passing protection claim.
- Integrated Rayleigh has positive converged weights and analytic primitive
  checks; a direct independent same-model Rayleigh output oracle remains unqualified.

Thus the result is a useful local lead with explicit limits. It does not prove
an intrinsically faulty cache, a universally correct interpolation, or an N4 gain.
The fixed midpoint does not demonstrate the required joint 20% mean/worst gain
against Sun4096; its within-10% competitive alternative is inconclusive, and
no 25% whole-build saving is established. The speed/accuracy route is not admitted.

## The performance lead was followed too

The initial complete weight prototype revealed CPU preparation, browser payload
handling and CPU K assembly as major costs. It did not establish an intrinsic
GPU arithmetic limit. Two distinct measured follow-ons preserved the math:

| Complete local order-8 prototype | Near-Sun median | Opposite-Sun median |
| --- | ---: | ---: |
| Eight resident tiles per JSON dispatch | 13.22 s | 12.34 s |
| Binary loopback coefficient/moment transport | 7.97 s | 7.09 s |

Each row has three complete trials per witness. Binary transport retains
identical K and improves these elapsed medians by about 40-43%. Reducing call
count alone did not provide the same benefit. Earlier timings and every payload
are retained; CPU calibration overlapped these noninterleaved trials, so this is
prototype elapsed-time evidence rather than a native benchmark.

The accurate refined local engine still constructs millions of angular segments
per outgoing field. Geometry generation/assembly, phase reuse across bands,
global-order retention/recomputation and native scheduling are unqualified.
Streaming prevents a giant allocation; it does not remove the work. The retained
22.5 TiB dense all-band K estimate was never allocated. No per-frame integration
or production shader change was introduced.

## Reference precision, recovery and scientific scope

The study generated 30,670,848 independent validation path histories while
retaining the original illumination. Fifteen unique physical tuples were refined
across paper and Toronto; held-3 received a further authenticated 1:4 old/new pool.
Only pure J2 and its species tallies are qualified from the post-J2 roulette
estimator. Physical halfwidths and finite quadrature contrasts remain explicit.
No old target is called fresh; all eight reserved H97 tuples remain unexposed.

The remaining protection tail was traced to held-2's green/red bands. The earlier
held-3 refinement targeted the largest visible error before this casewise audit;
the execution record preserves that decision and correction. Refining the actual
driver resolved the statistical ambiguity without changing a method or criterion.

Run 00610 has complete sealed data and unchanged-source evidence but fails the
generic verifier because of a 43.183-second progress gap. It remains untouched.
[Accepted 00611 numerical replay](../../../../../tmp/experiments/sky-accuracy-dials/runs/00611-h114-ref-replay/replay.json)
authenticates its inventory and independently recomputes every raw-batch pooling
operation before deriving new reference evidence. It does not retroactively pass
the original monitoring contract. The generic verifier was not weakened and the
expensive histories were not repeated.

## Completion and resumption

The selected local investigation answers more than the preceding study: the
midpoint's benefits survive additional Toronto fields, their redistribution is
identified, a small GPU weight engine works, and transport can be improved.
Those successes do not supply a both-profile accuracy/cost survivor. The tested
alternatives transfer error rather than establishing the required joint gain.

H116 broader/repeated/fresh qualification, H117 native recurrence/twilight and
H118 full paper B1/domes/scenes were conditional and remain untriggered. Compatible
illumination exists at all 21 exposed geometries, but this route measured candidate
weights at the six-point local panel. Broader weight generation is possible;
the unmet local numerical/accuracy/cost admission does not justify claiming that
screen or native qualification. Resolving an isolated numerical bound alone would
not earn the full-cache expansion.

Keep the midpoint, calibrated operators, refined references and binary transport
as reusable evidence. Further work needs a distinct supported reconstruction or
practical GPU-resident route and the same joint gates. No new branch is selected
by this report, no production promotion occurred, and the experiment is not ended
or suspended. The execution record owns final verification, timings and checkpoint.
The scientific route is complete. The earlier Git write failure was resolved
by a successful host-route retry without changing permissions; the execution
record preserves the recovery and Git history owns the local checkpoint identity.

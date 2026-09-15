# What We Can Use From The Accuracy Experiments

Assessment through `00223-at-regions`; execution is paused for the owner's break. The work has produced a useful explanation
and several component corrections. It has not produced a generally qualified
replacement solver. The strongest result is predictable first-order source
refinement after correcting its representation. The recent angular work is
narrower: it diagnoses and repairs a defect in an experimental sampling rule.

## The Main Answer

More samples were improving individual calculations while exposing errors
elsewhere that had previously canceled them. Those errors are structured,
not random noise. We have separated several of them and demonstrated that
correcting related terms together can restore the expected convergence.
Scientific accuracy is measured against the declared equations and independent
numerical references; Kider agreement is reported separately.

## What Is Actionable

| Change                                                    | What the experiments establish                                                                                                                                                                                | Practical use and limit                                                                                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Correct first-order representation                        | Known density and phase should be evaluated explicitly. Reconstructing density-factored sunlight columns removes a major altitude-transmission error.                                                         | The best-supported candidate to extend to complete viewing rays. Existing tests cover selected first-order probes; the recurrence already evaluates direct first-order scattering at its own query points. |
| Increase sunlight-path samples after those corrections    | A previously unexecuted increase from 160 to 320 samples removed 74.95–74.97% of remaining component error. Its response was predicted within 0.165–0.183%, without fitting the target.                       | A predictable component accuracy/cost dial in the tested domain. It increases integration work without inherently enlarging the cache.                                                                     |
| Improve altitude representation or near-ground resolution | Independent first- and second-order references support substantial error reductions at the selected morning and noon rays.                                                                                    | Useful corrections, but a universal altitude-count prediction failed at the finer held setting. Do not promise that every added node follows one rate.                                                     |
| Choose angular coordinates that resolve the integrand     | A boundary-split cosine rule creates a slow endpoint/cancellation error. A matched polar-angle rule removes almost all of that error on analytic controls and passes one atmospheric channel's accuracy test. | A demonstrated mechanism and candidate method. The 99% atmospheric figure is relative to the problematic experimental Sun-aligned rule, not production. It is not yet a qualified general angular dial.    |
| Restore the direct-ground boundary contribution           | A missing positive contribution is real and measurable; its absence partly offsets a larger positive numerical error.                                                                                         | A correctness repair to preserve when combining changes, not a brightness parameter to tune for a favorable score.                                                                                         |

The [complete control map](accuracy-controls.md) also covers transport sampling,
incoming radial/azimuth counts, scattering orders, precision and reference work
allocation. Their qualification is uneven; none is silently counted as solved.

## Why The Work Expanded

The investigation followed two different paths. The first-order path reached
a strong result: identify the compensating terms, correct their representation,
then successfully predict a genuinely new sample count. The angular path took
longer because a promising Sun-aligned method failed on actual atmosphere.
Testing the same construction against a known exact integral revealed an
error introduced by its boundary-dependent node placement. The coordinate
correction confirmed that diagnosis, but this is partly reference/method
development rather than direct progress toward a production replacement.

Those controls were scientifically useful. Continuing to subdivide that local
angular question has diminishing value relative to consolidating the proven
first-order corrections. It should not be mistaken for completing the broader
algorithm-tuning objective.

## What We Still Cannot Claim

- Predictable accuracy of the combined changes through all scattering orders
  and the complete sky. A final-view reconstruction change does not regenerate
  higher orders; a source-integration or higher-order transport change does.
  Their effects must be tested at the stages they actually modify.
- A universal improvement from more altitude or incoming-angle samples.
  Several held predictions failed, and their failures remain evidence.
- A demonstrated full B1–B3 or Kider improvement from these new corrections.
  No new production change or full production comparison is represented here.
- A physical explanation for the entire morning measurement excess. On the
  selected ray, independently checked first plus second order already exceeds
  measurement before adding later positive orders. Missing positive scattering
  cannot remove that excess; its remaining cause is unassigned.

## Recommended Next Milestone

Prioritize a bounded experiment extending the corrected cached first-order
reconstruction from the bottom-interval probes to complete morning/noon viewing
rays. Compare with the established independent first-order references at fixed
source count and fixed higher-order fields; then report the separate effect on
total radiance and Kider. This tests the useful range of the correction without
claiming to change the recurrence.

The [existing first-radiance pass](../../../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js)
integrates direct scattering evaluated at each query; it does not reconstruct
the cached J1 field. Merely correcting the final-view J1 representation therefore
does not require regenerating its unchanged higher orders. Changing the source
integration count affects that direct pass and does require regenerating its
descendants. Higher-order reconstruction and transport remain separate
attribution targets. Freeze a prediction and resource admission for each actual
intervention rather than treating these different paths as one combined change.

The final [saved-node angular diagnostic](angular-theta-regions-plan.md) passed
both predictions in 00223: after the coordinate correction, the remaining
refinement response concentrates near the horizon. This localizes a response
and leaves the earlier reference uncertainty unchanged. It used no fresh
atmospheric solves. No new ladder was started; work is paused at the owner's
request, with the [agent handoff](handoff.md) ready for a later resumption.

The [detailed findings](attribution-results.md) own the measured values and
limitations. Direct evidence is available for the
[held first-order prediction](../../../../../tmp/experiments/sky-accuracy-dials/runs/00209-s320-target/report.md),
[endpoint mechanism](../../../../../tmp/experiments/sky-accuracy-dials/runs/00219-af-endpoint/report.md)
and [latest atmospheric correction](../../../../../tmp/experiments/sky-accuracy-dials/runs/00222-at-assess/report.md).
The [status](status.md) owns resource accounting and deferred verification.
Production code and historical evidence remain unchanged by this continuation.

# Sources Of Inaccuracy: Current Attribution

The current priority is to locate and quantify errors before choosing further
mitigations. This document owns the attribution inventory and next-test
decisions. The [findings](attribution-results.md) own numerical results and
their evidence; the [status](status.md) owns execution and review state.

The [correctness standard](continuation-goals.md#standard-of-correctness) is
scientific: governing physics, applicable mathematical properties and
independently checked numerical accuracy. Kider agreement is a separate
observation comparison. Its improvement or regression does not decide whether
a correction is valid. Each next test must name the scientific expectation
and the competing explanations it can distinguish.

## Established Findings And Their Limits

| Source or boundary                                                       | What the evidence establishes                                                                                                                                                                                                                                                                                                                          | What remains unresolved                                                                                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sunlight-path integration                                                | Coarse trapezoidal integration overestimates optical depth and reduces transmission on the tested lit columns. S160 removes about three-quarters of that error. Run 00201 also identifies a negative source contribution after the same nonlinear reconstruction, offsetting a larger positive reconstruction remainder in all four group projections. | Its contribution through recurrence and complete viewing integrals. The pilot does not establish GPU arithmetic parity or tangent/sunset behavior.                     |
| Cached density/altitude reconstruction                                   | The matching-sample controls separate raw density reconstruction, outgoing phase and transmission effects. Runs 00203-00205 trace the remaining transmission dimming to altitude interpolation and validate a representation based on known species density profiles, including the original solar-grid/source-count interaction.                      | Full viewing integrals, changes to computed grid values and subsequent recurrence remain distinct. A general count law and GPU implementation are not yet qualified.   |
| Recurrence path integration                                              | The earlier source/transport factorial demonstrates compensating finite-integration errors even without cache interpolation. Finer transport also reduces selected morning P2 error.                                                                                                                                                                   | A complete transport-error budget through later scattering orders and its interaction with representation changes.                                                     |
| Incoming angular integration                                             | Independent angular and positive-height tests identify resolution/distribution effects; radial and azimuth refinement have different responses.                                                                                                                                                                                                        | Their complete viewing-ray and later-order contributions. More directions do not automatically establish convergence.                                                  |
| Outgoing and solar reconstruction                                        | The outgoing contribution changes sign between conditions and can compensate transmission error. The crossed-coordinate test shows solar transmission interpolation is tiny relative to altitude error on these samples. Analytic phase plus corrected columns passes the original-grid control.                                                       | The result does not qualify all outgoing directions, solar conditions, higher orders or GPU arithmetic; geometric range limits remain.                                 |
| Exact-ground boundary                                                    | The controlled J2 correction confirms missing ground light. Its effect is 86-87% smaller on the finer altitude grid; correcting it increases morning P2 error on both grids.                                                                                                                                                                           | The larger positive error it offsets is not fully partitioned among reconstruction, angular and path contributions. Later-order boundary conventions remain unchanged. |
| Finite scattering order                                                  | Matched fifth/sixth orders add positive light, helping a shortfall and worsening an excess.                                                                                                                                                                                                                                                            | Their own numerical errors and all later orders. One-ray extrapolation did not predict the altitude interaction accurately enough.                                     |
| Reference geometry and work allocation                                   | Error allocation and a coordinate adapted to nearly tangent rays resolve specific independent-reference failures at unchanged tolerances.                                                                                                                                                                                                              | These reference-runner findings do not by themselves demonstrate the same defect in the production cache.                                                              |
| Physical inputs, observation comparison, or shared reference assumptions | At the selected morning ray, admitted physical P1+P2 already exceeds both measured channel values before any later orders. Nonnegative later scattering cannot erase that excess under those error budgets.                                                                                                                                            | Which assumption or input causes the discrepancy. Measurement uncertainty is not quantified; the bound is conditional on empirical reference allowances.               |

Application color conversion is separate from this spectral comparison. It may
matter to the observed near-ground appearance, but cannot by itself explain a
discrepancy already present before display conversion.

The [00201 source/reconstruction report](../../../../../tmp/experiments/sky-accuracy-dials/runs/00201-src-reconstruct/report.md)
uses fixed common weights on the retained bottom-interval samples. Its four
group projections have negative source contributions and larger positive
reconstruction remainders, so S160 increases the combined positive error while
improving source transmission. This is not a universal local trend: at the
first noon sample, 58.593 m, reconstruction and total error are negative in
both channels. The positive S160 response reduces absolute error in those two
local exceptions.

The [00202 phase/reconstruction report](../../../../../tmp/experiments/sky-accuracy-dials/runs/00202-phase-recon/report.md)
further separates the binary64 density-factored remainder as outgoing
interpolation, solar-phase coupling and transmission reconstruction. Removing
outgoing interpolation therefore makes the morning remainder more negative,
but reduces the noon remainder by more than half in both channels, passing
the registered noon magnitude and solar-phase gates. The final transmission
term is not a pure altitude error. These are sequential intervention terms
with propagated empirical allowances, using analytic phase for the declared
model. They use no Kider input and establish neither GPU arithmetic parity nor
a complete viewing integral.

The selected morning and noon rays also differ geometrically: the original C0
registration places them 14.727 and 5.106 degrees from the Sun, at elevations
33.749 and 71.919 degrees respectively. Their opposite residuals therefore do
not isolate time of day. Angular structure and observation geometry remain
alternatives to a time-varying atmosphere; this observation does not identify
a particular phase-function error.

## What “Compensating Errors” Now Means

Two mechanisms are established. Numerical components can offset each other,
as in finite source/transport integration and the source/reconstruction
decomposition in 00201. The positive morning outgoing term in 00202 also
offsets its negative transmission term. Separately, a numerical bias can
offset the remaining difference from measurement. Removing either offset can
worsen a combined error or score while improving the component that changed.

The failed fine-altitude prediction is consistent with competing contributions,
but does not identify a particular second error. A fitted competing-rate term
could also approximate omitted smooth terms or changes elsewhere in the field.
Its better fit is a reason for a causal test, not a boundary diagnosis.

## Next Decisions

The scientific tests behind those decisions are distinct from observation
scores. The following expectations identify what a result must explain; the
table does not declare every listed expectation already verified.

| Component                       | Scientific expectation and discriminating comparison                                                                                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source transmission             | Solve attenuation for the declared density field. Compare optical depth and transmission with independent column integration, and predict the discretization error from the integrand rather than from a brightness target.                  |
| Ground boundary                 | Recover the atmospheric-side limit of the declared reflected ground radiance. Compare the ground-row intervention with that limit and measure how interpolation spreads the endpoint error into a finite altitude interval.                  |
| Angular integration             | Preserve the applicable phase normalization and source-plane symmetry, and approach independently integrated scattering values. Separate radial and azimuth errors before interpreting a total-count change.                                 |
| Cached reconstruction           | Reconstruct the same physical field and compare at matching positions and directions. Separate errors in stored values from errors introduced between them; a better combined value alone does not isolate those terms.                      |
| Recurrence and order truncation | Propagate the declared scattering operator and boundary conditions. Separate numerical changes to retained orders from positive omitted-order contributions; a changing grouped reconstruction is not automatically a pure scattering order. |

Use measured component errors and their propagated allowances to connect these
tests. Do not add overlapping intervention effects as if they were independent
terms of a complete error budget. In particular, the source-column correction,
the ground-row correction and the altitude/factoring response are measured at
different stages of the calculation.

1. The boundary controls are complete and identify a compensating error. Keep
   this measured contribution distinct from the remaining positive numerical
   error; do not treat the boundary correction alone as a complete mitigation.
2. The noon reference is admitted. Both altitude/representation controls pass
   their registered numerical improvement tests there, while correcting the
   positive P2 bias worsens the separate observation shortfall as predicted.
   Preserve these distinct conclusions and the limited two-ray/channel scope.
3. Consolidate the resulting error budget before adding a mitigation, another
   count sweep, or a physical-parameter fitting exercise. Any next experiment
   should state which competing explanations its outcome will distinguish.
4. The matching-sample source, phase, altitude/solar and column-representation
   controls are complete through 00205. The original-grid interaction shows
   that source refinement becomes predictably accurate after the identified
   reconstruction errors are removed. Preserve its known-S160 and limited
   sample-domain qualifications. The
   [held S320 test](source-refinement-plan.md) now passes all twelve group and
   192 local checks in 00209. The new count removes about 75% of the component
   error, with the analytic response prediction accurate to 0.165-0.183%.
   This qualifies the tested first-order count ladder, not the entire recurrence.
5. Existing normalization sweeps make another generic constant-field test
   unnecessary. Run 00206 splits the observed factorial response: its
   constant-background phase-mass part is material, but directional atmospheric
   Mie variation explains most of the change. The
   [smooth angular partition](angular-regions-plan.md) passes all fourteen
   predictions in 00207 and locates most of the directional response toward
   the Sun. Other regions can partly cancel it; radial-only horizon response
   remains material. This identifies a sampling priority, not absolute angular
   error or a qualified new rule. The next
   [manufactured phase-lobe integral](angular-lobes-plan.md) passes all ten
   predictions in 00210. The phase peaks alone reproduce the morning response
   pattern. Equal-cost Sun-aligned sampling sharply improves the known
   integral at both geometries, while the radial/azimuth sensitivity changes
   with geometry. The actual boundary-aware comparison is assessed in 00217: both sign
   predictions pass, but the coarse rule overshoots and its four combined
   accuracy predicates remain unresolved under the frozen reference criterion.
   The accepted [frame/placement control](angular-frame-control-plan.md),
   00218, identifies polar node placement as sufficient to cause the large
   loss on the known smooth field; rotating azimuth preserves the accuracy
   threshold. The [endpoint/cancellation control](angular-endpoint-plan.md)
   passes its new-count predictions and matched-coordinate controls in 00219.
   The atmospheric extension passes one combined channel's accuracy test in
   00222; the second remains unresolved. The
   [saved-node regional test](angular-theta-regions-plan.md) passes both
   predictions in 00223 and locates the remaining atmospheric response near
   the horizon. It uses no new incident solves and does not establish absolute
   angular error. Execution is now paused at the owner's request; further
   angular ladders are not automatically admitted. The next substantial implementation priority is
   extending corrected cached first-order reconstruction to complete viewing
   rays, with fixed other controls and a bounded prospective test. Direct
   first-order scattering is already evaluated at recurrence query points,
   so this final-view change does not regenerate higher orders. Source-count
   and higher-transport changes require separate propagation tests.

No new broad implementation branches or recurring reviews are authorized by
this inventory. Existing source review remains deferred, and production code
and prior evidence remain unchanged.

The [accuracy-control map](accuracy-controls.md) records which numerical and
operational controls are qualified, their mechanisms, costs and remaining
limits.

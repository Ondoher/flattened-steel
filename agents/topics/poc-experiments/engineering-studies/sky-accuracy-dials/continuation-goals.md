# Sky Accuracy Dials: Continuation Goals

Current owner decision, 2026-10-14: judge numerical accuracy primarily by
agreement with a verified, matched libRadtran solution under the paper's fixed
physical parameters. The [reference-model target](reference-model-target.md#current-accuracy-metric)
owns scoring, reference qualification and geometry limits. Kider agreement is a
separate secondary empirical comparison. Existing results and consumed packages
retain their original criteria; this change selects no additional computation.

The [completed aerosol sensitivity](aerosol-sensitivity-results.md) provides
the first physical-input intervention. For current diagnosis the owner excludes
unsupported 360 nm: use the [454-712.5 nm analysis](aerosol-sensitivity-results.md#supported-wavelength-interpretation).
Phase and albedo each improve both controls separately; together they overshoot.
Distinguish changed mean phase/SSA from additional shape flexibility and retain
Sun-angle/time confounding before choosing more tests. Regional input is exploratory;
the adopted physical atmosphere and production algorithm remain unchanged.

The [follow-up guide](follow-up-context.md) preserves the current hypothesis
register, data leads, evidence ownership and owner constraints for resumption.

The [case evaluation](aerosol-cancellation-evaluation.md) assesses the owner's
working aerosol-model hypothesis against the specifically identified numerical
corrections. It separates internal numerical cancellation from the remaining
physical/observation mismatch, with broad visible angular shape and violet
spectral excess as distinct targets. This synthesis selects no new run and
does not establish aerosol dominance.

The completed [Sun-angle analysis](angular-residual-results.md) establishes a
shared angular component of visible Kider residuals after controlling exact
time/elevation means. The 360 nm excess has much weaker angular predictability.
Keep these separate when forming physical hypotheses; the conditional fits
are neither phase-function retrievals nor production corrections. No new run
is selected. The [alternate-ray reference](alternate-rays-results.md) and
[regional comparison](reference-comparison-results.md) remain the numerical
and full retained-data evidence. Preserve the adoption hold and near-Sun
samples in full benchmark scores.

The owner requested a direct implementation of the idealization with tunable
granularity and no caches, then explicitly accepted statistical uncertainty.
The [completed stochastic reference](direct-convergence-results.md) covers all
five rays and four wavelengths with no fixed scattering-order cutoff. The
large Kider disagreements persist; the report separates numerical precision
from observation residuals. No new execution is active.

Immediate assessment direction: qualify the retained libRadtran configuration
against the fixed paper problem before attributing the direct-reference gap.
The [idealized continuous algorithm](idealized-model.md) remains the equation
target for independent attribution; solving it accurately does not establish
the captured physical state or equivalence to a differently configured solver.
The completed aerosol/horizon studies remain physical sensitivities with their
original limits. Production corrections remain deferred. No new run is selected.

Earlier geometry context: the [solar-registration analysis](solar-registration-results.md) is
complete through accepted 00228. It identifies estimator bias and regional
inconsistency without qualifying replacement geometry. Preserve the owner's
[adoption hold](status.md#owner-decision-preserve-conclusions-defer-adoption).
The earlier [bounded second pass](remaining-factors-results.md) remains closed;
observation GPU sensitivity is unmeasured after two failed attempts. Overall
Bruneton RMSE improvement remains unestablished.

Current priority: reduce the qualified libRadtran radiance discrepancy under the
paper's fixed atmosphere, without selecting settings that balance known errors.
Preserve the tested first-order corrections and identify the remaining factors
that help or cancel, so implementation cost can be traded against better behavior.
Favor GPU evidence gathering and directional results over numerical precision;
reuse compatible existing data. The consumed targeted and remaining-factors plans own their fixed
scopes and three-hour stops. Earlier open-ended adaptive continuation authority
does not apply to this package.

## Central Objective

The owner's [reference-model target](reference-model-target.md#current-accuracy-metric)
defines the primary numerical criterion: reproduce qualified libRadtran radiance
for the same paper problem while measuring computational cost. Keep the full
Kider comparison as secondary empirical evidence. The retained five-ray
comparison is diagnostic, not a complete benchmark or qualified whole-solver oracle.

Locate departures from the governing physics and mathematical expectations,
explain how their errors propagate and interact, and develop controls that
predictably reduce those errors within a stated domain.

The desired result is a set of dials with an explained, prospectively tested
relationship between their settings, scientific correctness, numerical error
and computational cost. A matched, convergence-checked libRadtran solution is
the intended primary numerical reference for the paper comparison. Independently
checked solutions of the same equations support attribution and other geometries.
Kider measurements remain the empirical comparison; agreement between numerical
implementations alone does not validate the physical model.
Report both comparisons, without admitting known numerical errors merely
because they cancel a measurement residual.

## Standard Of Correctness

State the scientific expectation before testing a change, and justify why it
applies to the declared physical problem. Use the governing equations and
boundary conditions, applicable conservation and normalization properties,
nonnegativity, symmetry and limiting cases, and independently checked numerical
references. Select only properties that hold under the model's assumptions;
for example, energy accounting must include absorption and boundary fluxes.
Quantify tolerances and unresolved reference error rather than treating an
intuitive trend or a higher sample count as proof.

Distinguish three questions:

1. Is the physical formulation scientifically justified for the declared scope?
2. Does the implementation accurately solve that formulation, including its
   boundaries, show expected convergence and approach the qualified matched
   libRadtran reference where applicable?
3. How well does that solution agree with Kider observations?

The second question now owns numerical-accuracy selection. The third was the
practical selection objective for the completed bounded first pass and remains
a secondary empirical check. A Kider
improvement cannot validate an incorrect calculation; a Kider regression
cannot invalidate a demonstrated correctness improvement. A correctly solved
model can still omit relevant physics or use inappropriate physical inputs.
Likewise, correcting one component need not reduce the complete solver error
while other components remain inaccurate. State the level of each claim.

Known Kider residuals may guide where to investigate. They must not determine
the expected correct answer, numerical tolerances, or selection of a bias.
Preserve all previously registered score tests and outcomes as historical
measurement evidence; they do not override this clarified correctness standard.

This document owns the goals and success criteria for continuing the existing
experiment. The [active findings](attribution-results.md) own current numerical results
and limits; the [hypothesis report](results.md) preserves the first campaign; the [design](design.md) owns the current scientific and storage boundary;
the [status](status.md) owns execution and review state. The completed
[plan](plan.md) records the first campaign. The
[continuation execution plan](continuation-plan.md) turns these goals into
bounded experiments; the status document tracks execution.

## Meaning Of A Dial

A dial is any controllable numerical or operational choice that changes how
the solution is computed or represented. Dials are not limited to values saved
in the cache. They include numeric settings and choices between methods:

- Sample count, placement, distribution and adaptive sampling criteria.
- Integration and reconstruction methods, step allocation and stopping tolerances.
- Scattering-order count and numerical precision.
- Cache resolution, stored quantities and representation.
- Controls applied during cache generation, runtime evaluation, or both.

A runtime sampling change can qualify even when the stored cache is unchanged.
For every candidate, record where the control acts and whether it requires
regenerating the cache. Apply the same requirements for explained numerical
error, scientific expectations, interactions and cost to all of these controls.
Report predicted Kider effects separately wherever the comparison is available.

## What Must Be Explained

The first campaign established local predictions for several integration
controls, but a generally predictable accuracy model remains incomplete.
The continuation must address the broader set of factors rather than allowing
one successful refinement to stand in for that model.

| Question                                                                  | Explanation the next pass should produce                                                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Why can a more accurate component worsen the complete score?              | Identify the corrected error, the discrepancy it previously offset, and the residual after both effects are accounted for.              |
| Why do additional samples sometimes fail to follow a convergence law?     | Explain changes in the spatial and spectral response, including reconstruction boundaries and unresolved angular structure.             |
| Why does a local cache change affect distant directions and later orders? | Trace propagation through the actual recurrence and distinguish it from the final-view reconstruction effect.                           |
| When do two refinements reinforce, cancel or interact?                    | Predict the separate effects and the joint response, with an explicit estimate of the interaction.                                      |
| Why do the largest Kider residuals persist after integration refinement?  | Bound the remaining numerical contribution before attributing the discrepancy to physical assumptions, geometry or measurement effects. |
| Which settings provide a useful accuracy/cost tradeoff?                   | State a validated range, expected error and score response, costs, and conditions under which the prediction fails.                     |

Much of the cancellation observed so far involves structured, deterministic
biases. Repeated-run noise and measurement uncertainty are separate quantities;
averaging deterministic bias does not remove it.

## Goal 1: Establish A Credible Numerical Reference

Develop a reference, or a hierarchy of references, that solves the same declared
physical problem with demonstrably smaller and estimated remaining numerical
error. No result becomes an oracle merely because it uses more samples or
removes an approximation.

The reference work should:

- Separate integration, altitude reconstruction, outgoing reconstruction,
  incoming angular integration and scattering-tail errors before assessing
  their combined remainder.
- Use independent formulations or implementations for critical components,
  plus exact or manufactured cases where available, to expose shared bias.
- Check convergence of radiance patterns across directions and wavelengths,
  as well as norms and aggregate scores.
- State where the reference is only a component diagnostic, has frozen later
  contributions, or retains unresolved quadrature or truncation error.
- Estimate reference uncertainty tightly enough to distinguish the proposed
  dial's effect. Where that is not possible, retain an unresolved conclusion.

Success means a justified numerical comparison boundary with an explicit error
budget and scope. Agreement between two resolutions of the same method alone
is insufficient.

## Goal 2: Account For Compensation In The Measured Score

For computed radiance L_h, numerical reference L_* and measurement M, define
the numerical difference n = L_h - L_* and remaining discrepancy r = L_* - M.
For a fixed sample set and weighting, the score decomposition is

```text
L_h - M = n + r
SSE(L_h, M) = ||n||^2 + 2 n dot r + ||r||^2
```

The cross term measures reinforcement or cancellation. As numerical error
shrinks, a negative cancellation term can disappear and the measured score
can worsen. This identity provides an accounting method; the quality of its
interpretation depends on the reference and measurements.

For the important regressions, the next pass should quantify these terms,
locate their contributions in time, direction and wavelength, and explain
which changes caused them. The remaining discrepancy r must not automatically
be labelled physical error: it also includes reference uncertainty and
possible observation or measurement effects.

Use complete comparisons to distinguish two mechanisms:

- A refinement's radiance response changes under a different reconstruction
  or recurrence configuration: an actual numerical interaction.
- The same radiance response produces a different score change because the
  baseline residual changed: score dependence on existing error.

Both occurred in the first campaign. Opposite score trends alone do not prove
interpolation amplification or identify which physical assumption is wrong.

## Goal 3: Correct Related Errors Together

Use the identified mechanisms to test isolated and combined corrections.
When an individually more accurate calculation worsens Kider agreement,
identify and test the suspected compensating error rather than selecting the
old bias because its score was lower.

The investigation should maintain a coverage record for altitude nodes,
outgoing directions, incoming quadrature, source integration, recurrence
integration, final-view integration, first-order representation, density
factorization, solar-angle grid/interpolation, precision/geometry robustness
and scattering orders. Record unresolved factors explicitly; coverage does not
require an immediate experiment for every factor.

Priority relationships suggested by the completed evidence include:

- Density/first-order reconstruction with regenerated higher orders.
- Incoming angular integration with recurrence transport and reconstructed
  angular structure.
- Altitude reconstruction with view/path integration and order propagation.
- Source and transport refinement under changed representations.
- Sampling refinement with the remaining scattering tail.

These are investigation priorities, not a requirement to run every possible
combination. Choose discriminating tests that can falsify the proposed cause.
A frozen first-order substitution remains a diagnostic; qualification of a
changed solver requires regenerating the affected recurrence.

## Goal 4: Qualify Dials Through Prospective Predictions

Each candidate dial should have a claim recorded before its target runs:

| Required claim                   | Evidence needed                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Identifiable error being reduced | A controlled comparison with the appropriate numerical reference, including its uncertainty.                           |
| Expected response                | Predicted sign, magnitude and spatial/spectral pattern, with a stated range of validity.                               |
| Scientific expectation           | A justified equation, property or reference target with a declared scope and error allowance.                          |
| Separate Kider effect            | Where available, a forecast derived from radiance and baseline residuals; improvement is not required for correctness. |
| Interaction behavior             | Tested relevant combinations or explicit restrictions on combining the dial with other controls.                       |
| Cost                             | Measured work, runtime and memory/storage consequences, with measurement scope stated.                                 |
| Falsification                    | Predeclared tolerances and conditions that would reject the prediction or limit the claim.                             |

Assess complete radiance responses and per-condition/angular residuals; an
aggregate score must not conceal a failed spatial prediction. Set numerical
and any separate score-prediction tolerances before target execution. Preserve the first
campaign's failed gates and use new registrations for new hypotheses.

The existing Kider measurements are already known. Withholding a new
configuration's output tests an intervention prediction. Claims of transfer
require additional physical/observer conditions or genuinely independent
measurement evidence, with that distinction stated explicitly.

## Goal 5: Qualify Scientific Accuracy Separately From Measurement Agreement

The continuation has a primary deliverable and a separate observation report:

1. Controls with a predictable effect on scientifically justified properties
   and independently assessed numerical error, with their scope and interactions
   established.
2. The resulting Kider agreement, including any gains, regressions and unresolved
   discrepancies, without making a score gain a condition of the first result.

Improving Kider agreement does not make a correctness claim stronger by itself.
A candidate should not be selected because an under-resolved setting happens
to offset another known error.
Its benefit should be tested as the dominant related numerical errors are
corrected, with remaining dependencies and uncertainty disclosed.

| Observed outcome                                      | Interpretation                                                                                                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Numerical error falls and Kider improves as predicted | Candidate numerical accuracy dial plus a separate observation-agreement benefit; qualify its scientific scope, range and interactions.                   |
| Numerical error falls but Kider worsens               | Candidate numerical accuracy dial under the same scientific criteria; separately investigate the lost compensation or remaining observation discrepancy. |
| Kider improves while numerical error grows            | Evidence of a fit benefit from numerical bias; do not present it as an accuracy dial.                                                                    |
| Reference error or measurement effect is unresolved   | Limit the claim; a score change alone cannot settle the mechanism.                                                                                       |

Do not impose universal monotonic Kider improvement on numerical convergence.
A model can converge accurately while disagreeing with measurements. If the
remaining discrepancy exceeds the justified numerical and observation
uncertainty, investigate physical or observation assumptions in explicitly
separated experiments. Do not use numerical counts as hidden physical-model
calibration parameters.

## Completion Criteria And Handoff

Successful continuation should leave:

- An error budget that explains the major observed cases where a more accurate
  component worsens the complete score, including evidence for the proposed
  compensation and any unresolved remainder.
- A reference-backed comparison of the principal factors, with no factor
  silently treated as solved because another dial passed.
- A dial table giving the mechanism, validated setting range, predicted
  numerical and Kider effects, costs, combination restrictions and failures.
- Prospective confirmation on new intervention outputs, with explicit limits
  on transfer beyond the tested conditions.
- A clear account of persistent residuals, especially the solar hotspot and
  low-elevation errors, separating numerical attribution from untested
  physical or measurement explanations.
- Compact reproducible evidence and an honest outcome if a scientifically
  justified accuracy dial or its predictable domain remains unqualified.

The correctness and predictability objectives can succeed even if Kider
agreement worsens. Report reference-radiance accuracy and observation agreement
separately, naming the reference for every RMSE. A lower aggregate score alone
does not establish reference adequacy or the whole objective.

## Execution And Resource Boundary

This document owns scientific goals. The owner has separately authorized
execution of the continuation plan; its status is tracked in the status document.

Continue within the existing experiment and its
[source, immutable-run and storage rules](design.md#storage-and-execution-budget).
Existing evidence counts against the retained-data budget. Retain compact
spectra, predictions and derivations; use only the declared reproducible
scratch for disposable intermediates. Do not assume the owner's file-copy
operation frees space or delete prior evidence.

The [continuation execution plan](continuation-plan.md) owns bounded tests,
reference and prediction criteria, resource estimates and stopping conditions.
Production promotion and application display changes remain outside this
scientific continuation.

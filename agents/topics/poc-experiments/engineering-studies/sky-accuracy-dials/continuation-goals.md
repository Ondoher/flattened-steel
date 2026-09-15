# Sky Accuracy Dials: Continuation Goals

Status: goals defined; independent continuation execution is authorized.

Current priority: identify and quantify sources of inaccuracy before developing
additional mitigations or tuning rules, as the owner directed. Use established
causes, measured interactions and unresolved alternatives to choose the next
test. Prefer a discriminating component or causal control over another setting
sweep. A promising mitigation is not a substitute for locating its error source.
Keep this work bounded and reuse the existing evidence to limit credit use.

The owner explicitly authorizes adjusting the execution plan as needed to meet
these goals, using independent judgment while the owner is away. Completion of
a bounded batch does not establish completion of the scientific objective.
The active [compensation attribution plan](attribution-plan.md) follows that
authority within the experiment's production, evidence and resource boundaries.

## Central Objective

Locate departures from the governing physics and mathematical expectations,
explain how their errors propagate and interact, and develop controls that
predictably reduce those errors within a stated domain.

The desired result is a set of dials with an explained, prospectively tested
relationship between their settings, scientific correctness, numerical error
and computational cost. Kider agreement is a separately reported observation
comparison, not the standard of correctness or an admission gate for a
scientifically justified refinement.

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
   boundaries, and show the expected numerical convergence?
3. How well does that solution agree with Kider observations?

The third question cannot substitute for either of the first two. A Kider
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
agreement worsens. Report observation agreement separately; neither a lower
RMSE nor an explanation of one mechanism establishes the whole objective.

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

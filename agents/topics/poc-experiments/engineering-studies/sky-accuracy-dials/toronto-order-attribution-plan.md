# Toronto Horizon: Scattering-Order Error Attribution

## Selection And Objective

Completed under independent execution selected on 2026-10-16. The
[results](toronto-order-attribution-results.md) own findings and qualifications. The
[execution record](toronto-order-attribution-execution.md) owns progress,
questions, decisions and verification. The owner's later execution request
activates H48-H52 within this plan's contained boundaries.

Explain where the production algorithm's excess develops after first scattering
and distinguish errors introduced by angular integration, reconstruction and
transport from errors inherited from an earlier order. Begin with the
0.05-degree away-from-Sun horizon ray, where the divergence is large. Keep
the Toronto optical intervention, source, atmosphere and physical boundaries
fixed. No production change or promotion is selected.

The [H45-H47 results](libradtran-horizon-results.md) own the evidence and
qualifications motivating this plan. The independent GPU and libRadtran
all-order estimates agree closely. The independent N5+ luminance tail is below
0.81% for the three checked rays. The available evidence points to an error
within the first four orders; it does not establish one complete cause.

## Fixed Target And Terminology

- Use the H45 Toronto AERONET phase/SSA intervention at supported Native15
  centers above 440 nm. Keep canonical optics below 440 nm. Preserve original
  aerosol extinction, molecular coefficients, exponential heights, San Jose
  noon source, spherical geometry, 5 m observer and black ground.
- Use all 15 wavelengths for saved-data comparisons. Start new component
  probes at channels 3, 5 and 8 (approximately 469.7, 532.3 and 626.3 nm),
  with channel 2 (438.3 nm, unchanged canonical optics) as a control.
- Use cumulative radiance through each order for the primary comparison:
  C1, C2, C3 and C4. Independent pure orders are separately tallied.
- Jk means the local scattering source density of pure order k. Lk means
  radiance obtained by transporting that source field. Production uses
  intermediate pure-order fields for the recurrence and separately accumulates
  the final cache. A recurrence step is Jk -> Lk -> J(k+1).
- Differences of production cumulative *viewed radiance* are apparent stage
  increments. Nonlinear final interpolation means they must not be labelled
  exact isolated physical orders. Saved pure J fields can be examined directly
  at their stored nodes with their actual units and identities.
- LibRadtran supplies an all-order endpoint and an extrapolated first-order
  estimate, not a matched native order-2/order-3/order-4 sequence.

## Error Model And Testable Hypotheses

Each step can introduce a new numerical error and propagate an existing one.
For a fixed linear discrete transport/scattering operator, this is schematically
`error(k+1) = discreteOperator(error(k)) + operatorError(exactField(k))`.
The equation explains propagation; it is not an assertion that every nonlinear
reconstruction or final display operation obeys a single fixed linear matrix.

| Mechanism | How error enters the recurrence | Discriminating evidence |
| --- | --- | --- |
| Incoming angular integration | F68 can misweight a narrow aerosol forward peak, creating excess or missing scattered light. | Hold the incident field and transport fixed; refine only the angular integral. Check constant-field phase mass and nonconstant incident fields separately. |
| Spatial/directional reconstruction | Interpolating J between altitude, solar-angle and outgoing-direction nodes can flatten peaks, fill valleys or spread light across transitions. The reconstructed field becomes the next order's input. | Compare reconstructed J against independently evaluated J at physical off-grid points; check exact nodes separately and keep transport/angular settings fixed. |
| Transport integration and attenuation | The 15 cache-build intervals per segment approximate source accumulation and exponential attenuation along potentially long paths. | Hold the reconstructed source field fixed; refine path integration and attenuation, recording their separate effects where feasible. Final viewing-ray refinement alone cannot repair this step. |
| Error propagation | A biased J or L field illuminates the next pass, which may amplify, redistribute or partly cancel the bias. | Replay the next pass with one corrected input or operator stage and measure its effect on subsequent orders. |
| Coordinate/boundary handling | Direction-frame transforms, clamping or interpolation across visibility/ground boundaries can relocate light or mix incompatible states. | Audit exact transforms, branch lengths, domain support and one-sided boundary behavior at the selected samples before assigning a discrepancy to interpolation. |

Existing constant-field tests show aerosol phase-weight sums approaching six
at some outgoing nodes for Toronto optics. That is evidence of a discrete
angular-normalization defect, not proof that every physical incoming field
receives six times the correct radiance. Normalizing those weights alone is
not assumed to fix integration of a nonuniform field. Floating-point and
summation error remain controls rather than the leading explanation for the
large excess; retain measured parity where available.

## H48: Locate The Excess Using Saved Data

No cache rebuild, libRadtran solve or new Monte Carlo campaign is needed here.

1. Authenticate immutable production 00310, external/direct comparisons
   00316/00320 and independent GPU measurement 00323. Preserve their seals,
   source/material identities, units and complete derivation chains.
2. Select only the 0.05-degree ray. Use saved production Q30 cumulative
   C1-C4 and sum the independent GPU's pure orders to the same limits.
   Retain Q60/Q120 as existing final-view integration controls.
3. For each cumulative stage, calculate spectral signed/relative residuals,
   physical luminance, R/B and production's excess. Report absolute residuals
   alongside relative values so small denominators do not dominate attribution.
4. Compute independent sampling intervals from its per-batch cumulative sums,
   preserving covariance between orders and wavelengths. For successive
   differences, use paired batch differences; do not combine cumulative
   uncertainties as if they were independent. Keep production discretization
   uncertainty distinct from Monte Carlo sampling uncertainty.
5. Measure changes in the production-minus-independent excess between stages.
   Distinguish cumulative excess, apparent production increments and exact
   independent pure-order contributions in every label and conclusion.
6. Publish a paired C1-C4 swatch grid with fixed production p2 settings, spectral
   panels for each stage, and an excess-versus-order table/plot. Include the
   libRadtran all-order endpoint as context, not a per-order reference.

Deliver a first usable image at this stage before starting component probes.
Identify the first materially discrepant stage and the wavelengths driving
its brightness/color response. Report later jumps as well; do not stop the
analysis at the first detectable error.

## H49: Examine One Recurrence Step At A Time

Choose a small set of physical samples associated with the first discrepant
stage and the largest subsequent growth on the 0.05-degree viewing ray. Record
their positions, altitudes, local Sun angles, incoming/outgoing directions,
boundary classifications and cache stencils. Include exact grid nodes and
off-grid samples. Selection is diagnostic and must not be presented as a
representative whole-sky average.

Use saved intermediates where sufficient. Otherwise perform a contained
instrumented GPU rebuild with the same baseline configuration and record only
the necessary J/L fields and stage probes. Reproduce the saved baseline before
interpreting changed settings. Production files remain read-only.

At those samples retain:

- the prior pure-order J field, transported incoming L samples, angular weights
  and phase factors, species contributions, and resulting next-order J;
- transport sample positions, measures, reconstructed J and transmittance;
- actual coordinate transforms, interpolating nodes/weights, bounds and units.

Where an independent pointwise J reference is needed, qualify the Toronto GPU
probe's local source-density query at those points, including its order
accounting, geometry and sampling precision. Match quantities: J against J,
L against L, and final ray radiance against final ray radiance. A source-density
query is not interchangeable with the observer's integrated radiance.

Do not interpolate the sparse F68 L samples onto a denser direction set and
call that an independent angular reference. Evaluate incoming L at the new
directions from a specified fixed J reconstruction, or use independently
computed incoming light, and record exactly which field is held fixed.

## H50: Separate Newly Introduced Component Errors

Use local one-step controls before paying for another full recurrence.

1. **Angular control:** evaluate the same fixed incident-light function with
   F68 and progressively refined rules. For N2, independently integrated L1
   provides an especially useful incident field without inherited higher-order
   reconstruction. Retain phase-mass tests, actual-field tests and Rayleigh/Mie
   contributions separately. Require a refinement plateau relative to sampling
   and the observed excess before treating the refined value as a reference.
2. **Transport control:** hold the previous J reconstruction and angular rule
   fixed. Refine the 15-interval transport rule through at least two finer
   levels. Distinguish source-integral error from attenuation error by swapping
   one evaluator at a time where feasible. Record segment and boundary changes.
3. **Reconstruction control:** at matched physical points/directions compare
   cached J reconstruction against an independent continuous J estimate.
   Exact-node agreement with off-grid disagreement implicates representation;
   exact-node disagreement points to generation of the stored field as well.
   Do not call a denser interpolation of the same cache independent truth.
4. **Interactions:** after individual controls, use the smallest angular-by-
   transport combination needed to determine whether their effects reinforce
   or cancel. Add a reconstruction combination only when the preceding probes
   can supply a qualified alternative. Leave any unidentifiable contribution
   explicitly unresolved.

Keep the final view integrator fixed in these tests. Reuse its existing saved
refinement controls to avoid confusing viewing error with cache-build error.
Publish component residual spectra and a compact before/after image at the
first coherent attribution milestone, not after every diagnostic invocation.

## H51: Test Propagation And Cancellation

For the most strongly supported component, run a bounded corrected recurrence
on the selected spectral channels and relevant cache domain. Preserve baseline
physics and retain per-order outputs.

- Correct one stage or operator at a time and propagate it through the remaining
  orders. Compare with the unchanged recurrence.
- Distinguish a frozen-input one-step correction from a correction applied at
  every later pass. The former measures where an error enters; the latter also
  changes its propagation.
- Check whether reducing local mathematical error reduces the final ray's
  spectral/luminance excess against the independent estimate. Record cases
  where a correction worsens the final result because another error had been
  cancelling it.
- Retain N1 invariance for changes confined to higher-order processing. Treat
  unexpected N1 changes as a control failure requiring explanation.
- Use small sample sets/domain coverage only for the claims they support. A
  partial-domain replay must demonstrate required interpolation/transport
  coverage or be labelled a local test rather than a complete cache result.

Expand to all 15 channels only after a useful mechanism is demonstrated on
the selected channels. Higher viewing angles and different atmospheres remain
follow-on transfer tests, not prerequisites for this horizon attribution.

## H52: Findings And Completion

Produce an evidence-linked account of:

- the cumulative stage where excess first becomes significant and how it grows;
- measured angular, reconstruction and transport errors, with signs and spectra;
- inherited versus newly introduced error and any demonstrated cancellation;
- the correction response and the residual that remains unexplained;
- reviewed color images and spectral plots, including original versus corrected
  results if a qualified correction was tested.

A cause is supported when a controlled intervention changes the predicted
intermediate quantity and moves the final result in the expected direction.
Score improvement alone is insufficient causal evidence. Convergence on one
ray does not establish a global production fix. Production promotion remains
separate and must satisfy the full-cache paper-RMSE gate and its destination
architecture/verification requirements.

## Execution Rules

Prefer GPU for substantial probe/recurrence work. Use CPU for compact analysis,
independent mathematical checks and report generation where appropriate. Reuse
qualified external results; new libRadtran work is conditional on an actual
reference gap, not routine repetition.

Use about 60 minutes as execution guidance. Continue while monitored, positive
progress warrants it; do not stop solely because that duration elapsed. Start
with small pilots before expensive refinements, assess their measured runtime
and variance, and avoid an automatic full-grid parameter sweep. When an attempt
fails, preserve it, diagnose the cause, ensure owned jobs have exited, and use
a new run for a justified retry. No blanket prohibition on retries applies.

All authored work remains within this experiment's declared source/topic roots;
generated evidence and scratch use its declared output boundary. Authenticate
read-only parents, preserve complete derivations, use real-path/link checks,
monitor progress, and release owned resources. Check the local types after
code changes and verify immutable runs and images. Dedicated standards
reviewers/audits remain disabled; checkpoint advice remains active. Record
completion and limits in the owning results/status documents. No commit is
authorized by this plan.

# H59: Angular Interpolation And Scattering-Order Error

Status: executing; full-spectrum continuation awaits the owner disk-budget decision.
Under owner-selected independent execution, test whether cache
angular interpolation explains part of the N1 deficit and the later-order
excesses. Baseline Git: `73af9897`. The [execution record](angular-interpolation-execution.md)
owns progress, decisions and verification.
This stays within the open sky-accuracy-dials experiment; production and prior
evidence remain unchanged.

## Question And Hypotheses

Does reconstruction between stored outgoing directions introduce a material
error, and does that error affect final-ray reconstruction, subsequent cache
orders, or both?

- **H59-A, first-order readout:** interpolating the phase-bearing N1 field
  contributes to the selected rays' roughly 0.9-1.6% N1 deficits.
- **H59-B, higher-order lookup:** outgoing angular interpolation of a previous
  source field changes the next transport pass, producing errors that can be
  redistributed or magnified in later orders.
- **H59-C, separate angular mechanisms:** interpolation error and finite incoming
  angular integration error are distinct and can interact. Normalizing the Mie
  weights does not guarantee either angular shape is accurate.
- **H59-D, cancellation:** reducing one component error can expose another,
  improving a component while worsening total radiance or paper RMSE.

The purpose is attribution before selecting an interpolation replacement. A
larger grid or a better-looking swatch alone does not establish the cause.

## Fixed Problem, Rays And References

Use the exact H58 paper physical packet, all 40 Direct40 wavelengths, spherical
geometry, solar geometry, spectral grass, Rayleigh/Mie coefficients, SSA and
Cornette-Shanks phase. Preserve transport60, source-transmittance20, F68 incoming
directions, W27 outgoing nodes, 51 positions, 180 solar zeniths, Q30 view sampling,
and the existing normalization, except for the specifically named intervention.
Keep internal altitude/solar interpolation and final-view monotone-cubic solar
reconstruction separate and unchanged in angular-only tests.

| Witness | Paper time | Canonical ray | Elevation | Sun separation |
| --- | --- | ---: | ---: | ---: |
| Largest retained-libRadtran discrepancy | 09:30 | 67 | 33.7490 deg | 7.3689 deg |
| Second-largest discrepancy | 09:45 | 67 | 33.7490 deg | 10.4878 deg |
| Existing near-Sun witness | 11:00 | 57 | 53.3665 deg | 4.1932 deg |

Do not reselect rays after seeing intervention results. Add exact node, cell
centre and face-edge controls around their actual lookup stencils; these are
interpolation controls, not replacement benchmark rays. Trace only a bounded
set of contributing rows/points chosen from baseline geometry and weights.

Reuse [H58 results](worst-ray-orders-results.md), independent run00366, matched
libRadtran run00365, and final report00368 read-only, with complete identities.
For N1 use the existing dense binary64 direct integral as the primary tight
reference. Compare higher orders with same-order independent estimates and
their intervals. Matched libRadtran is an external cross-check; its broad
per-band intervals cannot resolve every small component difference.

The retained full-B1 libRadtran table is a separate screening/comparison target.
It is not a measured per-order oracle and has known setup differences from the
matched references. Preserve the original measured-paper RMSE target and gate.

## A. Map The Actual Lookup Paths And Reproduce The Baseline

Before instrumenting, record the selected generated compiler and final-view
paths with source/input hashes. Read the normalized60 derived compiler from
H55 as an authenticated parent; adapt it only inside this experiment.

The inspected source gives this starting map, which execution must verify:

| Path | Current behavior | Consequence for attribution |
| --- | --- | --- |
| Stored J1 | Direct coefficients multiplied by phase at W27 directions | Its off-grid reconstruction can contain angular interpolation error |
| L1 build | `directScatteringDensity` evaluated along incoming rays | It bypasses lookup of stored J1; a final J1 readout change should not automatically alter L1/J2 |
| J2-J4 build | F68 sum of preceding L values at native rows, with corrected Mie normalization | Incoming quadrature error is distinct from outgoing interpolation |
| L2/L3 build | `sampleJ` reconstructs the preceding J field, including `sampleJDirection` bilinear angular lookup | Angular lookup error can enter later recurrence passes here |
| Final view | `sampleDensity` reconstructs cumulative/pure fields, using angular weights, altitude weights and solar cubic | Final readout can differ even when compiled fields are identical |

Reproduce saved corrected spectra at the selected rays for channels 4,12,24
(407,501,642 nm). Freeze field identities, node values, physical frames, actual
stencils, integration samples and rounding controls. A tolerance must come from
an unchanged-path replay, not be widened to accept a candidate.

Saved H58 spectra are reusable, but do not assume complete J/L textures survived
the prior cleanup. Rebuild only the needed wavelengths. Inspect borrowed live
textures during their owning compiler callbacks, retain compact probes, and
release each wavelength's fields before proceeding.

## B. Isolate N1 Angular Reconstruction

At an exact altitude/solar row, use the same stored Rayleigh and Mie direct
coefficients to compare:

1. The current W27 bilinear interpolation of phase-bearing J1 values.
2. Evaluation of the same analytic phase at the requested direction, multiplied
   by those identical coefficients.

This changes only outgoing-angle reconstruction. It does not recompute density,
Sun transmission, source strength, altitude weights or solar weights at the
query point. Evaluate the phase in the correct receiver-local frame for **each
original spatial/solar anchor** before applying the original interpolation
operators. Do not pull it outside a nonlinear solar interpolation by assumption.

Require agreement at original outgoing nodes within measured Float32 rounding
allowance. Probe actual query directions, neighbouring cell centres, forward-lobe
regions and face boundaries. Record signed errors, angular distance to nodes,
cell coordinates and separate Rayleigh/Mie terms. Preserve native face selection
and duplicate-node conventions; a seam-handling change is a separately labelled
intervention.

Project both reconstructions through the same Q30 view samples and attenuation.
Compare their N1 integrals with the dense binary64 N1 reference. A separate
continuous physical evaluation at the query point may report remaining error,
but must not be labelled an angular-only replacement: it also changes other
interpolated quantities.

For total-ray diagnosis, keep higher fields frozen and retain the exact
replacement `Ck - C1 + C1_angle` at each cumulative order. Label it a frozen
increment diagnostic. Also retain the native grouping control: reconstructing
J1 and higher fields separately can differ from reconstructing their sum because
solar cubic is nonlinear. Do not attribute that grouping difference to angles.

**Required invariant:** this final-readout-only N1 intervention leaves compiled
L1 and J2-J4 unchanged. Do not artificially route it through L1 to manufacture
a propagation effect that the current algorithm does not have.

## C. Isolate Higher-Order Interpolation With Frozen Inputs

For J2, then J3 where affordable, freeze the actual preceding L texture. At a
native altitude/solar row define an angular control by evaluating the original
F68 scattering sum directly at the requested outgoing direction. Use the same
L entries, incoming vectors/weights, medium coefficients, summation convention
and corrected Mie normalization, including its dependence on outgoing direction.

Compare that control with W27 interpolation of J values computed from the
identical frozen L field. At original W27 nodes they must agree within the replay
rounding allowance. At interior/edge queries their difference isolates angular
reconstruction of this fixed discrete input.

This is a **fixed-input angular control**, not an independent physical solver:
it deliberately retains any error already present in L and in the F68 rule.
Keep actual point positions and the original altitude/solar stencils when
extending the control off native rows.

Apply the two lookup operators to identical transport samples at a bounded set
of native rows, initially at most eight rows selected from the baseline witness
stencils/traces. Compute all F68 output directions at those rows so subsequent
angular passes receive a coherent row. Keep transport60, branch splits,
attenuation, boundaries and ground terms fixed. Record J lookup differences and
their signed contribution to the resulting L2/L3 error separately.

Dense global W27 refinement is not the first test. A nested face width53 would
require texture width16854, exceeding a16384-wide single-texture limit. Prefer
direct queried-direction evaluation or bounded local cell subdivision; preflight
the actual hardware before proposing any alternative storage arrangement.

## D. Separate Interpolation From Incoming Quadrature

Hold F68 fixed for the decisive angular-only comparisons above. If those show a
material effect, make a small N2 fixed-point factorial control:

| | Current angular interpolation | Direct requested-angle evaluation |
| --- | --- | --- |
| F68 incoming rule | Native fixed-input control | Interpolation bypass |
| Refined incoming rule | Quadrature change only | Both changes |

At new incoming directions, evaluate L1 using the same direct-transport equation,
source20 and transport60 controls; validate it against native L1 at the original
F68 directions. Use a registered refinement pair, initially256/512 directions,
only at the bounded probe points. Do not interpolate the existing 68 L values
onto a denser rule and call that a clean quadrature reference.

Retain the interaction term rather than assigning the combined improvement to
interpolation alone. Do not reopen a whole-cache angular-quadrature sweep or
extend this control to later orders without a valid evaluator at the new
incoming directions. A costly refinement can remain explicitly unresolved.

## E. Trace Whether A Lookup Error Propagates

Distinguish readout changes from changes to an input used by a later build.

- **Frozen readout:** reconstruct J2/J3 at requested final-view angles using the
  fixed-input control; hold all other fields fixed. This measures final lookup.
- **One-stage recurrence intervention:** replace only the bounded selected L2
  rows with values from C's angular-bypass transport, then run native J3/L3/J4.
  Where useful, make a separate L3-only replacement before J4. Preserve every
  unmodified input entry and record the exact patched support.
- **Combined intervention:** only after the isolated effects are known, combine
  the selected readout and recurrence changes and retain their interaction.

For each intervention retain pure N1-N4 spectra, cumulative spectra, signed
brightness changes and errors against the same-order references. Track the
initial changed field and its downstream changes. Compare weighted norms only
between like fields with the same units/domains: for example deltaL2 to deltaL3,
or deltaJ3 to deltaJ4, using explicitly fixed positive row/direction weights.
Report those transfer ratios alongside absolute ray errors. A growing percentage
error in a diminishing N4 contribution is not by itself proof of amplification.

The bounded row replacement is a causal diagnostic, not a complete improved
cache. A null result on limited support cannot rule out interpolation elsewhere.
Do not confuse propagation of this intervention with removal of all existing
upstream errors. Preserve both signs and any cancellation exposed at the ray.

## F. Decision, Wider Validation And Images

Classify separately:

- **Demonstrated interpolation effect:** paired lookup/transport differences
  exceed the measured roundoff/replay allowance, node controls pass, and no
  unregistered input changed.
- **Material explanation:** pre-register a practical target of removing at
  least25% of the absolute baseline component residual on at least two of the
  three witnesses, with the third reported explicitly. Smaller real effects
  remain partial findings; opposite-sign effects are evidence too. Use dense
  N1 controls or the reference intervals as appropriate; do not manufacture a
  pass by ignoring noise or changing the target after inspection.
- **Propagation witness:** a verified isolated input change reaches later
  fields/orders with the recorded sign and support. Quantify growth/attenuation
  using the defined transfer metrics, not just N4 relative percentages.
- **Physical improvement:** movement toward matched same-order reference values,
  distinct from agreement with retained libRadtran or the measured paper target.

Begin with three screening bands, then validate any promising mechanism at
channels0,8,30,39 (360,454,712.5,818.25 nm). Use all40 wavelengths for final
photometric/color comparisons of a selected intervention; do not fabricate a
40-band spectrum or a sky-color swatch from three sampled bands.

Provide reviewable images after the first screen, after any propagation test,
and at the final decision: angular residual maps/curves, signed per-order error
bars, and all40-band common-CIE/p2 swatches when available. Clearly label
false-color error plots. Keep original gain and show Y/spectra when bright
swatches hide differences. Every diagnostic run need not render a scene.

If a broadly applicable candidate emerges, evaluate it across the full17-time,
81-ray,40-wavelength B1 boundary, with interval RMSE and a dome comparison.
Compare with both corrected60 and the original paper baseline (40 transport
intervals), using all 40 wavelengths for both. The unchanged
promotion gate is RMSE no worse than11.6229140283 mW,not merely an improvement
over corrected60's11.6684823920. Diagnose directional/order cancellation if the
component improves but that gate worsens. A local patch or sparse control is
not eligible for that full-cache claim. Production/twilight qualification remains
separate and is not part of this hypothesis test.

## Execution Boundaries And Completion

Planned authored source: `experiments/sky-accuracy-dials/angular-interpolation/`.
Generated runs/scratch stay under `tmp/experiments/sky-accuracy-dials/` using the
existing allocator, real-path checks, ownership and immutable-run contract.
Adapt existing live-field diagnostics within the owned experiment; production,
the ended angular-quadrature experiment and all prior runs remain read-only.

Prefer the GPU for native replay, queried-angle controls and recurrence passes.
Use CPU binary64 only for small analytic/roundoff controls and reductions. Run
one GPU job at a time, compile one wavelength at a time, and retain compact
probes/spectra instead of full textures. No new libRadtran campaign is planned.

Measure one screening wavelength before expanding.60minutes is guidance, not
an automatic stop while strong, monitored progress continues. Report actual
stage timings and remaining work. If a global bypass is too expensive, finish
the bounded causal tests and state the global question remains open; do not
silently substitute a different algorithm or launch an overnight sweep.

The current624MiB retained cap has about30.4MiB headroom after H58. Target at
most24MiB of new retained output including manifests/images, remeasure before
allocation, and preserve sealing reserve. Keep1GiB scratch and40GiB free-disk
bounds. A demonstrated shortage requires a specific measured capacity decision,
not deletion of old evidence. No system-memory or production-cache limits change.

Use focused self-verifying proof runners, not an experimental unit-test tree.
After authored code changes run the local type check and self-review the mapped
standards. Verify replay/node/frame/shape/unit/patch-support identities, separate
pure orders from cumulative reconstruction, inspect images, and check owned
resource cleanup. Dedicated reviewers/audits remain disabled; checkpoint advice
stays separate from scientific qualification.

Completion means a source-path map, isolated angular-error measurements, a
qualified propagation result or a clear bounded limitation, visual evidence,
and a results document explaining what is and is not established. Full-cache
improvement is conditional follow-on validation, not required to record a
negative or partial hypothesis result. The owner authorized execution after reviewing this saved plan.

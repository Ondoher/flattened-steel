# Distant-Horizon Migration Regression: H28-H32

## Purpose And Status

**Executed on 2026-10-15 at its bounded available/unsupported cells as accepted
00271.** The [results](horizon-migration-regression-results.md) own findings,
resources, deviations and the matching implementation-review receipt. The
following is the retained registration within the existing Sky Accuracy Dials
experiment. It tests the owner's observation that the distant-Sun horizon
changed from a gradient toward white to a darker gray/blue band when the cache
gained local solar zenith. The owner subsequently selected independent execution;
production changes remain outside scope. The [parent diagnosis plan](horizon-diagnosis-plan.md)
routes the work; [status](status.md) owns execution state.

Distinguish a localized numerical regression, removal of an older compensating
error, a display change, and combinations of those effects. Expected whiteness
is a witness for locating the change, not an accuracy oracle. A plausible
physical explanation of the current output does not explain its historical
change or establish that the implementation is correct.

## Evidence And Historical Boundary

- The [solar-zenith design](../../../production-algorithm32/caches/solar-zenith-cache-design.md#why-the-cache-needs-local-solar-zenith)
  explains why actual-point solar zenith is necessary: the old observer-column
  approximation loses position-dependent illumination and visibility.
- Its [P6 record](../../../production-algorithm32/caches/solar-zenith-cache-design.md)
  preserves rejected gray-band run 000524, weak response to radial refinement,
  persistence without aerosols, and the large correction from uniform to
  quadratic view integration in 000529/000530. These are historical findings,
  not a diagnosis of the current residual band.
- Its [validation contract](../../../production-algorithm32/caches/solar-zenith-cache-design.md#validation-contract)
  records improved matched aggregate scores. Subsequent
  [cache promotion](../../../production-algorithm32/caches/distant-sun-cache-optimization-design.md)
  explicitly leaves horizon appearance separately owned. Aggregate improvement
  does not qualify the immediate horizon; historical Kider scores retain their
  empirical metric and are not libRadtran errors.
- Commit `cd9d8a44` is a candidate migration boundary, not yet the proven last
  white/first dark pair. It changes the cache integration and display selection.
  Authenticate the actual visual witnesses before calling its parent a control.
- [H16-H20](horizon-algorithm-results.md),
  [H21-H26](independent-horizon-reference-results.md), and
  [H27](horizon-brightness-results.md) supply existing sparse transport,
  reference and display evidence. H27's local physical dip is not proof of the
  cause of the distant regression. Its output-encoding concern remains conditional.

## H28: Authenticate Versions And Freeze The Comparison

1. Identify the last demonstrably whiter and first demonstrably darker distant
   witnesses. Pin commit/blob identities, retained runs, exact physical inputs,
   cache format/numerical policies, view integration and display configuration.
   If no authenticated historical image exists, label the selected revision
   comparison as a reconstruction, not a reproduced visual regression.
2. Inventory bundled changes: source/density construction, altitude and direction
   domains, local-solar-zenith support, coordinate frames, interpolation, view
   placement/weights, ground visibility, spectral basis, projection and display.
   Preserve the independently verified historical ground-roundoff fixes as
   explicit factors rather than accidentally reverting them in a hybrid.
3. Freeze the retained San Jose solar-noon spherical/distant state. Start with
   three away-Sun rays at **0.05, 3 and 20 degrees** above the local horizontal,
   observer height five meters. Use exact authenticated directions where matching
   app/reference packets exist; quantify any rounding mismatch. Independently
   derive common physical endpoints. Camera FOV and historical pixel registration
   are recorded separately from these world-space ray definitions.
4. Hold the authenticated paper material, actual source spectrum, geometry,
   atmosphere/ground boundaries, units and spectral-bin semantics fixed.
   Atmospheric black ground and visible green scene ground remain distinct.
   Use N1 against N1 and N4 against N4; extra-order tails are reported separately.
   A historical atmosphere differing from this packet gets its own reproduction
   lane before a matched-input comparison, not a silent parameter substitution.
5. Prefer existing complete Native15 spectra. Compare another historical basis
   only through a declared compatible projection with retained conversion error;
   three wavelength probes cannot stand in for horizon color. Freeze selected
   source identities, ray packets, numerical checks and uncertainty allowances
   before evaluating interventions.

## H29: Reproduce And Locate The Difference

Evaluate the authenticated historical and current paths on the same three rays.
Preserve their historical view/display settings to reproduce the observed change,
then compare their physical results under one common, explicit display mapping.
Do not change physical parameters to recover a target appearance.

Retain spectral radiance, physical Y in cd/m2, chromaticity, signed linear RGB,
tone output and final encoded output as separate stages. Fix display gain across
versions in the controlled replay; report original adaptation values separately.
An explicit sRGB-transfer alternative is a display diagnostic, not an assumed
correction or new exposure calibration. Exclude solar disk and scene ground from
the sky rays, and record hit/depth classification and composition contributions.

If the historical observation cannot be faithfully reconstructed from retained
data and bounded source evaluation, complete the current/reference and applicable
component comparisons and mark the historical reproduction gap explicitly.

## H30: Attribute The Change To Calculations

Start with N1, where continuous source evaluation is independently accessible.
Inspect source density at matched physical points and accumulate it along the
same view ray. Expand to N2-N4 only with compatible retained fields or bounded
source evaluation. Retain pure-order increments and final-event Rayleigh/Mie
contributions when available; final-event labels do not identify full ancestry.

Test these operations separately, with all other inputs fixed:

| Factor | Intervention and discriminating evidence |
| --- | --- |
| Construction | Compare old/new sources at identical altitude, physical Sun state and outgoing direction. Separate changed recurrence values from consumer reconstruction. |
| Solar coordinate and frame | Derive actual local up, Sun zenith and source-relative outgoing direction independently. Check sign, units, knot/one-sided support and visibility at the low-ray samples. |
| Interpolation | Compare exact-node values, off-node reconstruction and continuous N1 at the same points. Isolate altitude, solar-angle and outgoing-direction effects without changing the field. |
| View integration | Hold the source field and endpoints fixed; replay historical placement, current placement and independently refined integration. Record distance/altitude/optical-depth contribution profiles and dominant samples. |
| Display | Feed an identical completed spectrum through each historical mapping and a fixed common mapping, separating physical changes from output brightness/color changes. |

Freezing the new field's solar coordinate to the observer value is an optional
consumer-sensitivity diagnostic. It does not recreate the old construction or
establish that the new physical axis is unnecessary. Mixed old/new implementations
must share coordinate, normalization and physical contracts; otherwise report
the incompatibility instead of attributing the resulting difference to one factor.

## H31: Establish Which Result Is More Accurate

Use the [current reference criterion](reference-model-target.md#current-accuracy-metric).
First compare N1 with cache-free binary64 integration, independent spherical
bounds and refined source/view extinction. Retain convergence evidence; matching
the production quadrature is not sufficient qualification.

For N4, reuse H21-H26 spectral batch data only after authenticating matching
medium, source, observer, direction, boundaries, phase and order definitions.
Derive N1-N4 from each correlated batch before estimating uncertainty; an
all-orders mean is not an N4 reference. Retain the later-order tail separately.
Allow a small new reference qualification only within the budget below. If the
reference or sampling precision remains inadequate, leave N4 attribution open.

Use libRadtran directly where verified matched output covers these exact rays
and settings. Otherwise label the result an independent numerical-reference
comparison with its own uncertainty, not a libRadtran score or full paper result.
Do not substitute the old Toronto cube or its aggregate score for a San Jose
immediate-horizon reference. No new libRadtran installation or acquisition is
part of this package.

## H32: Test Cancellation And Report Spatially

Keep each ray's signed spectral residual, Y and chromaticity beside its error
norm. Report the low horizon, band-above-horizon and upper control individually.
Reuse historical aggregate benchmark scores with their provenance; do not
recompute a full benchmark or claim a new aggregate score from three rays.

If H30 identifies two material calculation changes, select at most one pair
from its retained evidence and register the choice before running the four cells:
baseline, A, B, A+B. Use the same qualified reference, physical inputs and order
target. Retain spectral deltas, their opposing/aligned directions, and
`I_AB = L_AB - L_A - L_B + L_0`. For each correction delta, evaluate
`deltaSSE = 2 * (L_0 - L_ref) dot delta + norm(delta)^2`, carrying reference
uncertainty into the comparison.

Opposing deltas or nonzero interaction alone do not prove two errors cancel.
Confirm each implicated calculation's own deviation where independent evidence
exists, then show how their propagated signed effects offset in the same ray,
wavelengths and order contributions. Spatial differences in improvement are
reported separately from within-ray cancellation. Frozen higher-order hybrids
are sensitivities; they do not qualify consistently regenerated descendants.

| Measured outcome beyond uncertainty | Interpretation |
| --- | --- |
| New horizon is farther from the matched reference | Localized numerical regression within qualified scope. |
| New horizon is closer despite darker appearance | Improved numerical agreement; older whiteness may reflect an error or different display policy. |
| Independently established errors have opposing propagated effects | Supported compensation, localized by ray/wavelength/order; quantify residual interaction. |
| Physical spectra agree but displayed output differs | Presentation-path difference. |
| More than one mechanism contributes, or evidence is incomplete | Mixed attribution or unresolved; preserve the unsupported cells. |

## Execution Limits, Deliverables And Completion

Proposed allowance: **10 minutes aggregate numerical execution, including input
qualification, setup failures, retention and cleanup; at most one serial GPU job;
20 MiB new retained evidence.** Implementation and required review time are
measured separately. Start with retained-data CPU work. Refine only the three
registered rays; wider angular maps require a later bounded selection.

No full cache build, full-sky recurrence, full benchmark, film, parameter fitting,
production edit, historical checkout over the working tree, or external-repository
write is included. If an old path requires an expensive reconstruction, retain
the gap and finish the other comparisons. Repair setup faults in fresh sealed
runs within the remaining allowance; do not retry successful science without
an identified invalidation. Budget exhaustion closes the numerical package with
explicit supported/unsupported results rather than silently extending it.

Existing experiment rules govern source/output roots, real-path/link checks,
source/input/derivation identities, immutable evidence, scratch ownership,
progress heartbeats, terminal seals, disk limits and operational memory policy.
Historical production and Star evidence remain read-only. Authored adapters stay
under `experiments/sky-accuracy-dials/`; generated derivatives and authenticated
source material used for execution stay under the experiment's ignored output
boundary, in new runs or owned scratch. Consumers record complete parent chains.

Deliver a version/change inventory, three-ray spectral/stage comparison, component
and uncertainty table, brightness/color strips under shared display, cancellation
cells where supported, hypothesis verdicts, and resource accounting. Update the
canonical results/status owners without changing historical records.

Before authored implementation, capture one coherent review baseline and confirm
mapped readiness. Batch type checking and applicable primary/independent-audit
review at the stable H28-H32 milestone. Numerical acceptance and implementation
review completion remain distinct. The results identify which cells completed
and which remain unsupported. The matched full-app H27 encoding
check remains separately proposed; this package's spectral replay is not its
substitute.

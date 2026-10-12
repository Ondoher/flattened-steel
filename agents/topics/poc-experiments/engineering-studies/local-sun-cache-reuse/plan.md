# Local-Sun Cache Reuse Experiment Plan

## Status And Acceptance Question

Final disposition, 2026-10-11: **ended, accepted as a contained experiment**.
The owner accepted the v5 film and selected P7 closeout. The
[closeout](p7-closeout.md) records final findings, limitations, preserved evidence
and the idle topic handoff. The specifications below remain reproduction and
historical context; they select no further execution.

Activated on 2026-10-08 through `start-experiment` at the owner's request.
This is the canonical execution plan for the contained lane. P0–P5,
[P5-Celestial](#p5-celestial--integrate-the-sun-disc-and-stars) and the selected
celestial/camera follow-ups are delivered. The [status](status.md) owns phase
disposition and links each record's numerical and source-review authority.
The [successor handoff](handoff.md) routes current implementation and evidence.
Original P2 counterexamples and earlier prototype results remain historical
comparison evidence for the Euclidean source-centered replacement layout.

The owner selected creative P6 film work on 2026-10-11, including flexible
scene/camera design, one continuous shot without overlays, a one-to-two-minute
duration and autonomous AFK execution. The selected recipe below is 90 seconds
at San Jose on the winter-solstice basis. P7 is complete; production promotion,
push and publication remain unselected. The v4 film is delivered with preserved
[execution evidence](p6-execution.md). The owner liked v4 and selected a
[shadow revision](p6-shadow-revision.md) to show ground shadows as the Sun
traverses the sky. The v5 native 4K film and compact review copy are media-qualified
and accepted by the owner. P6 is complete under the revision record's
[owner acceptance](p6-shadow-revision.md#owner-acceptance) and exact `CLEAN`
source-review receipt. The recipe and gates below were frozen before capture.

Experiment identity: `local-sun-cache-reuse`.

Determine whether a Euclidean source-centered shell layout can defensibly
represent the declared local-Sun multiple-scattering model with useful measured memory
and construction cost, omitting nonintersecting inner bands from both storage
and calculation. Then establish its horizontal reuse region and in-app
rebuilding with coherent lighting. Layout accuracy, resource benefit and reuse
are separate conclusions. A change of source height rebuilds the cache in the
app; a separate Sun-angle axis or precomputed height inventory is not planned.

## Model Defensibility And Acceptance Basis

The owner selected this basis on 2026-10-09. Preserve inherited mathematics and
extrapolate its consequences under explicit flat/local geometry and source
inputs. Borrow demonstrated distant/spherical method support only where
equations, profiles and numerical assumptions are compatible. Qualify shell
approximation and reuse separately. A new globally converged independent
higher-order solver is no longer a prerequisite. No empirical validation of
the hypothetical geometry or source is claimed.

The [design](design.md#assumptions-and-abstraction-boundaries) owns assumptions
and conceptual contracts. P3-A0 below produces the mathematical abstraction
inventory and defense; [reference-method.md](reference-method.md#current-evidence-policy)
owns the current evidence policy. Do not rewrite working modules merely to
create a new abstraction framework.

The owner's subsequent clarification sets the current depth of defense:
interpolation and integration need a sound mathematical explanation, explicit
assumptions and ordinary correctness checks. Heavy research and experiments
to estimate error bounds are deferred to later owner-selected work; they are
not current completion or pre-recording gates. The
[evidence policy](reference-method.md#current-depth-of-numerical-defense) owns
this distinction. Do not claim a quantified accuracy result without measuring it.

| Claim                             | Required support                                                                                             | Limit on the conclusion                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Inherited method support          | Exact equation/implementation/profile mapping to actual distant/spherical qualification and its limitations. | Does not validate flat geometry, a local Sun or every new parameter regime.                      |
| Flat/local adaptation consistency | Analytic invariants, compatible shared-method comparisons and local geometry/source/ground contract checks.  | Does not establish a globally converged higher-order solution.                                   |
| Shell approximation and omission  | Mathematical rationale, stated assumptions/limits, complete support and compact/unculled equivalence.        | Quantified approximation error is deferred; old-cache agreement alone is not an accuracy target. |
| Reuse and application correctness | Same-policy fresh/reused fields/rays, admission, CPU/GPU checks and coherent lifecycle publication.          | Shared-implementation agreement alone cannot establish physical accuracy.                        |
| Visual and resource suitability   | Frozen five-state images, exact-time motion and bounded performance/memory measurements.                     | Attractive images or an offline film do not prove numerical accuracy.                            |

Each claim records supporting source/run identities, tested domain, result and
limitation. Keep existing numerical limits wherever their quantity, metric and
comparison role remain compatible. P3-A must version the changed evidence/gate
contract before scoring new results, explicitly superseding the old universal
reference prerequisite. Do not silently reinterpret the frozen old fixture.
Historical failures/inconclusive cells retain their original disposition.
Unresolved focused evidence limits its affected claim/domain; reproducible
contract violations block that claim. Neither can become a pass by relabeling.

The [transfer assessment](../../../production-algorithm32/caches/local-sun-transfer-assessment.md) owns the source
findings and initial probe. The probe did not build a complete cache or run a
GPU. Its 0.0540512% maximum held-amplitude difference is a shell-policy result,
not a bound on final sky error. This experiment must establish its own evidence.

## Scope

- Keep the current isotropic source, altitude-dependent atmosphere, homogeneous
  ground boundary and scalar spectral quantities. Reuse concerns atmospheric
  fields; moving scene objects and their shadow maps remain separate consumers.
- Preserve P0-P2 and their controls as comparison evidence. The new candidate
  uses [Euclidean source distance](design.md#preferred-spatial-reference),
  altitude-aware shell sampling, explicit cross-band interpolation and compact
  active-band addressing. Establish fresh-layout correctness before movement.
- Derive conservative atmosphere-intersection admission before allocating
  samples. Proven empty inner bands receive neither scattering storage nor
  construction work from the first prototype. Keep support and boundary bands
  when needed; integrated omission replaces the deferred pre-recording retrofit.
- Keep the original bilinear spatial grid as the comparison control. Preserve
  angular reconstruction, scalar R32F, spectral/order controls and fused GPU
  transport while adapting spatial addressing. Compact active-band storage is
  in scope; value compression, cubic spatial interpolation, paging, shadow API
  changes and receiver-light timeline
  smoothing are deferred for cache qualification. The owner-selected final
  film uses the creative scene/camera recipe and measured-light presentation
  described in P6. This film-only recipe
  does not change the ordinary shadow control or public API. A measured
  problem may motivate a separately scoped
  follow-up; it must not silently enlarge this experiment.
- Production source, completed experiments, archives and parent evidence remain
  read-only. A positive result is a recommendation for a separate production
  adaptation and qualification plan, not automatic promotion.

## Activated Boundaries

The `start-experiment` activation established these roots:

| Purpose                                                       | Root                                                                       |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Authored implementation, adapters, fixtures and proof runners | `experiments/local-sun-cache-reuse/`                                       |
| Design, execution plan and current status                     | `agents/topics/poc-experiments/engineering-studies/local-sun-cache-reuse/` |
| Ignored builds, caches, renders, reports, logs and progress   | `tmp/experiments/local-sun-cache-reuse/`                                   |

These roots were created for this experiment. The former prepared-plan
location links here. The [design](design.md) owns the isolation and run contract;
the [status](status.md) owns current execution and verification state.

Select folder standards through the repository manifest and overlay. Retain
canonical `types.md` in every applicable experiment assignment. The skill must
record which settings are permanent folder mappings and which temporary
settings expire when execution ends or is suspended. Use `end-experiment` for
either lifecycle transition; suspension must preserve a resumption boundary
and require a later owner selection. The permanent mapping remains in place.

## Early Visual Milestones

The owner wants reviewable images early enough to judge progress. V0-V2 are
preserved deliveries from P1/P2. In the recast work, deliver V3a as soon as a
fresh shell candidate renders, before completing the layout matrix or testing
reuse. Then deliver V3b and V3c separately. Do not defer early images until
full N4/W27 qualification or in-app lifecycle work.

| Milestone                    | When                                 | Reviewable artifact and question                                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V0: control sky              | First executable step in P1          | A newly rendered Union Glacier Flat 0 sky-only control with its fixed horizon and camera. Can the harness reproduce the familiar closest-approach state?                                                                                                               |
| V1: first rotation reuse     | Early P2, bounded diagnostic profile | Fresh versus reused skies for fixed-offset rotations derived from Flat 0, shown side by side and through a blink/wipe comparison, plus a labeled amplified difference image. Does reuse preserve the appearance?                                                       |
| V2: moving Sun               | Before declaring P2 complete         | A short fixed-offset rotation clip derived from Flat 0 and paired fresh/reused stills at selected non-cardinal poses. Are changes continuous, and do the paired poses agree? Repeat the decisive comparison at the selected profile before claiming its qualification. |
| V3a: first shell-layout sky  | P3-B, first fresh candidate fields   | Flat 0 current-grid control, fresh shell candidate and amplified difference PNGs, with shell-intersection/storage diagnostics. Is the new layout plausible before any movement claim?                                                                                  |
| V3b: layout cadence          | P3-C                                 | Fresh candidate/current-grid Flat 0/45/90/135/180 PNGs, compact/unculled results and focused method checks. Separate appearance changes from supported model claims.                                                                                                   |
| V3c: movement comparison     | P3-D                                 | Fresh/reused PNGs at non-cardinal poses and exact-time traces. Keep layout differences separate and identify the passing transforms/domain.                                                                                                                            |
| V4: app lighting and rebuild | P4                                   | Familiar six-box five-state plates plus before/during/after replacement PNGs. Inspect exact-state sky, source, receivers and ordinary shadows.                                                                                                                         |
| V5: qualification comparison | P5                                   | Selected-profile images, exact-time trajectory data and a claim-by-claim model/resource report for owner disposition.                                                                                                                                                  |
| V5a/V5b: celestial integration | P5-Celestial | Close/intermediate/far Sun-disc images, then a labeled star-only diagnostic, combined sky images and a short motion preview before owner visual review. |
| V6: full local-Sun film      | P6, final execution milestone        | Deliver the selected 90-second continuous San Jose winter-solstice film, with dynamic camera movement, a legible full circuit and true disc-size change, followed by owner inspection.                                                                   |

V0 establishes a visible control, not a reuse result. Prefer the selected
production profile when it can produce the first render promptly; otherwise
use a bounded diagnostic profile and label its exact orders/domains. Keep it
as a distinct control and later repeat the comparison at the selected profile.
A stalled selected-profile build must be reported through progress and status,
not allowed to hide the available diagnostic images. No milestone promises a
fixed wall-clock delivery time before the hardware baseline is known.

Freeze the render recipe for each comparison: physical state, camera, viewport,
sample count, profile, color response and exposure. Use common display settings
and common difference scales; do not normalize each image independently. Keep
physical error measurements separate from display-pixel differences and label
amplification. Identify profile/order, shell policy, source placement, radius,
revision, cache build/reuse state, run and numerical-review status beside every
artifact. A diagnostic or failed comparison must remain visibly marked as such.

The completed V3-V5 work used a pre-video boundary; the newly selected P6
work now includes its own previews and full recording. Use direct PNGs and compact
exact-time trajectory data for V3-V5. Historical clips remain unchanged.
Publish each new visual milestone as a sealed run with standalone images
and a compact Markdown/JSON record linking its matching controls, difference views,
parameters and current interpretation. Update experiment status with that link
and bring it to the owner's attention when available; preserve it when later
runs supersede its conclusions. Historical early clips show only the reused
path with paired stills at selected poses; retain that limitation. New V3-V5
deliveries use PNGs and numerical traces. P5 requires the frozen temporal
matrix, rather than treating selected stills as per-frame fresh/reused proof.

These are progress review points, not additional mandatory approval pauses.
Continue authorized execution after delivery unless the owner asks to stop or
changes direction. Visual feedback can revise the next candidate, but it does
not waive accuracy gates or complete an implementation phase before its
required source review. Rendering and presentation code belongs to the
experiment and follows its mapped review obligations.

## Standard Visual Scene Controls

Use the established Union Glacier flat/local-Sun fixtures for the main visual
matrix, rather than inventing a new scene composition. The
[frozen local fixture](../../../../../experiments/extraterrestrial/fixtures/union-glacier-flat-local-closest-approach-v1.json)
owns its source positions, geometry and camera; the
[GPU appearance fixture](../../../../../experiments/extraterrestrial/fixtures/production-sun-appearance-gpu-visual-v1.json)
records the close/medium/long mappings. These are read-only presentation-state
inputs, not geographic or observational validation.

| State                   | Visual role                       | Required use                                                                                          |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Flat 0 / `flat-close`   | Closest approach                  | First V0 image; base state for derived P2 rotations; P3/P4/P5 comparisons.                            |
| Flat 90 / `flat-medium` | Medium source distance            | Required P3/P4/P5 comparison, retaining its historical holdout role.                                  |
| Flat 180 / `flat-long`  | Long source distance              | Required P3/P4/P5 comparison and long-path appearance check.                                          |
| Flat 45                 | Intermediate source distance      | Required five-state visual cadence panel; intermediate numerical checks frozen in P1.                 |
| Flat 135                | Intermediate long source distance | Required five-state visual cadence panel; resolve and pin its missing historical fixture state in P1. |

The full degree-related time preset set is defined by
[production constants](../../../../../src/flat32/consts.js:32) and selected through
[LocationTimeController](../../../../../src/flat32/LocationTimeController.js:66).
These are clockwise orbital offsets from closest approach on the flat Sun's
24-hour orbit, as defined by
[FlatSynchronizer](../../../../../src/algorithm32/implementation/flat-earth/synchronization/FlatSynchronizer.js:209):

| Preset   | Nominal time offset from closest approach |
| -------- | ----------------------------------------- |
| Flat 0   | 0 hours                                   |
| Flat 45  | +3 hours                                  |
| Flat 90  | +6 hours                                  |
| Flat 135 | +9 hours                                  |
| Flat 180 | +12 hours                                 |

Use the production resolver to obtain the actual ISO instant for the pinned
location/date basis; do not infer UTC labels from this nominal table. Record
the orbital angle, resolved instant, source position and required domain for
every panel. These angles are neither solar elevation nor solar zenith, and
they are not the P2 rotation of an already-configured source around an observer.

The historical local fixture contains Flat 0/45/90/180 but no Flat 135. Resolve
all five cadence states through the pinned production location/time and source
placement path, then freeze them as new experiment inputs. Compare the four
overlapping states with the historical fixture and retain any differences as
explicit provenance. Preserve the historical positions for exact frozen-state
replays; distinguish those replays from the current-resolved cadence instead
of silently mixing them in one timeline. Flat 135 must not use a guessed
position or interpolated screenshot. Both fresh and reused candidates consume
the same frozen five-state input table. The three primary states retain their
numerical roles; the two intermediate panels complete the visual cadence.

Freeze tuning/validation assignments in P1 before candidate results. Do not
tune against Flat 90 and continue describing it as an untouched holdout.

Pin the fixture bytes/schema and copy or derive the selected inputs into the
new experiment with complete provenance. Start with the local fixture's
`720 × 414` viewport, `70°` vertical FOV and zero-degree azimuth/elevation.
Retain its declared source height, positions and scene scale. Record the
physical-to-renderer coordinate transform explicitly; the fixture's physical
coordinates and Three scene coordinates must not be treated as interchangeable.
Additional camera views are separate labeled controls, identical within each
fresh/reused pair. Freeze current production color/FP32 display selections in
P1 rather than silently adopting an older fixture's display configuration.

The owner selected **1024 by 768 pixels** for rendering going forward on
2026-10-10. This supersedes the initial fixture raster for new captures and
the future recording; historical images retain their original dimensions.
Keep the 70-degree vertical FOV for these stills, derive camera aspect from
the selected raster, and record the dimensions in each new recipe/result.
The celestial capture launcher now selects this size explicitly. Other
ordinary control runners retain this selection. Under the owner's later creative
latitude and AFK resource instruction, P6 selects its own cinematic raster
below. The current shadow revision selects a 4K raster to preserve
resolved disc detail while widening the composition; v4 remains 1080p evidence.

Keep both a sky-only view and, when receiver integration is ready in P4, the
familiar ground composition with six colored boxes: the near yellow box,
nearby blue building-sized box, mid white box, far orange box, distant cyan
box and mountain-sized orange marker. Preserve their identities, dimensions,
placements and colors from the fixture and reconcile them with the pinned
[production scene definitions](../../../../../src/flat32/consts.js) and
[endpoint scene](../../../../../src/flat32/EndpointScene.js). Preserve ordinary
shadow behavior as the control. Any neutral-material lighting diagnostic must
be separately labeled and must not replace the familiar colored-box plate.

Recompute direct and diffuse receiver spectra at each tested physical state.
The old fixture's fixed ambient/directional intensities and recorded image
pixels are historical comparison facts, not live lighting inputs for the new
reuse comparison. For V0–V5, do not introduce the recording's one-second interpolation,
shared desert shadow setup or a different ground transport boundary merely to
match an old image. P6 separately defines the film's scene-specific reproduction
boundary. Record intentional differences from historical appearance.

The flat labels do not describe pure rotations around a fixed offset magnitude:
their physical source distances and current cache radii differ. P2 therefore
uses explicitly derived rotations of Flat 0 at unchanged height/offset/radius.
Label those renders as derived rotation diagnostics, not as Flat 90/180.
P3 tests the frozen fixture controls and separately identified resolved cadence
placements with their translation/domain dependencies.

The fixture's current radii range from approximately 6.28 Mm to 31.41 Mm;
none of the primary states is the 4.8 Mm spatial diagnostic configuration.
Derive candidate fixed coverage from all required construction/query points
along the frozen views and trajectory, including ray support. The largest
fixture radius is an input, not by itself proof of complete coverage. Qualify
the resulting larger-domain node spacing and numerical accuracy. A diagnostic
profile may reduce computational resolution/order, but must retain the named
state's physical source placement and adequate coverage. Do not silently clamp
the standard scene into 4.8 Mm or claim that a reduced-order image qualifies N4.

For context, the established
[globe views](../../../../../experiments/extraterrestrial/fixtures/subjective-globe-context-scenes-v1.json)
are San Jose sunset and Union Glacier solar noon. The
[San Jose color cadence](../../../../../experiments/extraterrestrial/color-reset/fixtures/cr1-six-scene-visual-baseline-v1.json)
covers noon, 60/10 minutes before sunset, sunset and 10/60 minutes afterward,
with a two-hour dark control. They remain read-only comparison references;
this flat/local-cache experiment does not add a spherical twilight qualification
matrix. Include context panels only when useful and identify their different
geometry/source configuration explicitly.

## Development Sequence

Each phase produces a decision and bounded evidence before the next dependent
phase starts. Declare review units and capture their baselines before coding.
Adjacent implementation phases may share a coherent review milestone, but
their completion gates stay open until the required review validates.

P0-P2 below retain the completed investigation's scope and historical acceptance
basis; their independent-reference requirements do not override the current
owner-selected P3 evidence policy. P3-A records the versioned change without
altering their results. P0-P2 retain exact
outcomes owned by their execution records. Their old branch/optimization
instructions do not govern the recast P3-P7 work. New-layout qualification
cannot inherit a pass merely because the P2 control passed a rotation matrix.

### P0 — Activate The Contained Lane

The owner selected `start-experiment` on 2026-10-08. Establish the roots,
folder-resolved standards, local instructions, type-check configuration,
progress contract, dependencies and reproducible CPU/GPU launch commands.
Refresh reviewer context after the topic switch. Check that production stays
read-only and generated output is ignored.

**Exit:** a ready environment and experiment-local design, plan and status
documents. Creation alone does not execute the numerical experiment.

### P1 — Freeze Controls, Coverage And Acceptance Gates

Start by pinning the inputs for the standard Flat 0 control render and
delivering V0. Then finish the broader control matrix and gate manifest below
before evaluating
any candidate. This ordering gives the owner an early image without waiting
for the complete reference and resource qualification workload.

Pin the production revision/import closure, runtime/tool versions, backend and
target GPU. Record the actual Flat32 configuration, including source height
`4,828,032 m`, atmosphere top `100,000 m`, source radius/power, ground,
19-by-15 position fractions, W27 outgoing domain, current incoming quadrature,
Native15 basis, maximum order N4, path controls and shell implementation. The
earlier probe's `4,800,000 m` source height must not substitute for the app value.

Define a finite placement/camera trajectory and a fixed source-centered radius
that covers every construction/query point required by the chosen workload.
Include the final film's December 14, 2024 full-orbit placements and camera
score in coverage planning, even though film execution is last. Freeze its
year/date basis, clock, unchanged scene identity and recording recipe before P6.
The owner selected **December 14, 2024** for the final film. Resolve and record
the Flat 180 start instant for that date through the production location/time
path. This supersedes the earlier December-solstice selection. Preserve the
original frozen film clock/coverage evidence; derive updated film inputs and
full-trajectory coverage into a new run before P6.
Include the primary Flat 0/90/180 states in the eventual qualification workload,
with Flat 45/135 included in the visual cadence and their numerical obligations
frozen here. Pin the five resolved times/placements before candidate evaluation,
including the newly derived Flat 135 input. Keep synthetic fixed-offset P2
rotations distinct from that trajectory. The current-policy control retains
each state's own radius; candidate-fresh and candidate-reused comparisons share
the same candidate coverage. Record a changed domain as part of the policy
comparison, rather than attributing its error to reuse.
Use the current 4.8 Mm domain as a diagnostic control, not an assumption that
all real placements fit. Record the exact physical nodes for every radius;
larger radii require fresh spatial checks with the same node count.

Freeze three distinct comparisons before evaluating candidates:

| Comparison                                                   | Purpose                                                                                               |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Fresh current-production-policy builds at each placement     | Measure changes relative to today's discretized behavior.                                             |
| Fresh candidate-policy builds versus reused candidate fields | Isolate errors caused by transformation and reuse.                                                    |
| Selected independent CPU queries and spatial refinement      | Check physical/numerical accuracy rather than agreement between two copies of the same approximation. |

The independent queries must use readable continuous source/transport
calculations with declared quadrature, convergence checks and analytic
invariants; they must not simply resample candidate textures. Historical Star
results may be immutable compatibility comparisons, not the sole physical
authority. Spherical Bruneton scores do not qualify this flat/local workload.

Create a machine-readable gate manifest with per-quantity absolute-plus-relative
CPU/GPU and reuse tolerances, near-zero normalization, complete-ray bounds,
temporal error limits, memory ceilings and build/runtime timing criteria.
Include separate candidate-versus-independent-reference accuracy gates and
a reference convergence/error budget small enough to resolve their pass/fail
limits. Freeze how uncertainty is handled and what happens if the current
control fails a physical-accuracy gate: report the baseline failure, and require
the candidate to meet the fixed physical limit rather than accepting agreement
with that failing baseline. If the reference cannot resolve a comparison,
mark that cell inconclusive and keep its qualification gate open.
Name and hash any inherited policy, and verify its profile and quantity
compatibility first. The existing local spatial limits are maximum normalized
L-infinity `0.1` and maximum p95 normalized RMS `0.02`; use these for the same
spatial metric and extend the measurement to the proposed domains. Old packed
transport memory estimates and bounded browser build limits are not current
hardware admission evidence. Establish current allocations and timings before
freezing resource gates. Do not loosen gates after seeing a failing candidate;
a revised question requires a new recorded decision and comparison run.

**Exit:** pinned controls, coverage, exact sampling matrix, reference derivation
and acceptance manifest, with V0 published. Unresolved gates remain an explicit
execution blocker for candidate evaluation.

### P2 — Prove Reuse Under The Current Shell Policy

Build complete fresh fields for a small fixed-height, fixed-offset-magnitude
rotation matrix derived from the pinned Flat 0 placement. Compare these with
one canonical cache sampled through the corresponding horizontal transforms.
Begin with a bounded diagnostic profile,
then repeat the decisive checks with the selected N4/W27 configuration. A
small-profile pass cannot stand in for the selected-profile result.

Deliver V1 as soon as the first bounded fresh/reused pair can be rendered,
before expanding the field matrix. Deliver V2 during this phase, retaining
diagnostic and selected-profile results as distinct runs. Keep the image
harness small; complete application/lifecycle integration remains P4 work.

Compare J1, J2–J4, available transported fields, cumulative fields and complete
view rays. Include all 15 channels, on-node and off-grid samples, interpolation
knots, shell boundaries, ground/top/outer-cylinder boundaries, source-axis
fallback, angular cell seams and non-cardinal rotations. Test fixed world
observers as well as transformed observer/ray pairs; explicitly transform
vectors only for rotational equivalence comparisons.

Check finite/nonnegative quantities under their defined tolerances, source
distance and inverse-square invariants, CPU/GPU frames and ray endpoints.
Track field error separately from final display response.

**Exit:** a bounded full-field rotation result, or an identified counterexample.
If angular discretization breaks the needed invariance, diagnose it before
claiming that physical symmetry alone permits cache reuse.
Proceed to P3 only for an explicitly declared transform/domain region that
passes the required rotation gates. If no useful region passes, record rejection
of reuse and skip the P3 translation candidate. Qualify the fresh-build control
through P4/P5 for the still-requested P6 film, explicitly labeling it a no-reuse
result. If a correct full-profile control cannot be admitted, preserve that
failure and carry the film as an open deliverable into P7 rather than silently
dropping it. Changing angular reconstruction requires a separately scoped
decision; the bounded axis/frame correction below is the owner-requested
continuation, while broader redesign remains separately scoped. Publish
the V1/V2 evidence even when the candidate is rejected.

#### P2 Corrective Continuation

The owner requested these next steps after the original P2 counterexamples.
This remains P2; original runs and their rejection remain immutable. This plan
continuation was selected through independent-execution; its [correction record](p2-corrections.md)
owns measured results, limitations and the mandatory validated-review completion authority. Preserve the frozen P1 limits and compare
new candidates against the original control and independently built fresh
fields under the same candidate policy.

- [x] **P2-A: source-axis/frame correction.** Make construction and lookup use
      a consistent frame at and near the source axis, or establish azimuth-independent
      axis sampling. Test continuity into adjacent radial cells and CPU/GPU agreement.
      Publish a fresh/reused 17-degree PNG pair, labeled amplified difference and
      blink as soon as the first correction renders. This continuation permits a
      focused experiment-owned axis/frame correction; a general angular-grid redesign
      remains outside scope.
- [x] **P2-B: transported-field correction.** Isolate the L2/L3 failures from
      frame handling and precision effects. Recheck the failing 250 m axis samples
      and nearby points, then all J orders, transported and cumulative fields across
      all 15 channels. Do not infer that the axis correction fixes every residual.
- [x] **P2-C: complete coverage.** Derive a declared domain covering the intended
      fixed-offset rotation workload and complete viewing paths. Compare fresh
      current-policy controls with fresh candidate coverage, then fresh/reused
      candidates at identical coverage. Measure spatial accuracy and allocation
      impact; preserve radial resolution where needed. No out-of-domain query or
      silent clamp counts as a pass. Translation-dependent shell-policy changes
      remain P3 work.
- [x] **P2-D: endpoint precision.** Diagnose the zero-rotation baseline discrepancy
      separately from reuse. Test stable intersection calculations and a sufficiently
      precise endpoint representation against the unchanged 0.01 m bound. Separate
      calculation error from FP32 diagnostic/readback quantization; a single FP32
      distance cannot reliably meet that bound at million-metre distances.
- [x] **P2-E: repeat qualification.** Repeat the selected N4/W27/F68/Native15
      0/17/45/90/135/180/271-degree matrix with complete fields, reconstruction,
      boundary/seam/axis probes, CPU/GPU rays and explicit coverage admission.
      Deliver updated V1/V2 comparisons and a short motion clip. Retain the familiar
      five-state Flat 0/45/90/135/180 visual cadence, clearly separating orbital-time
      controls from synthetic rotation tests and labeling fresh controls outside any
      admitted reuse region. Declare the exact passing transform/domain region or
      the remaining counterexamples before P3.

Capture a new coherent review-unit baseline before implementation. Refresh
applicable reviewer context and validate primary/independent source review,
including canonical types.md, before reporting this continuation complete.
Use new immutable runs, direct PNG/native-video artifacts and disposable browser
profiles. Production and historical evidence remain read-only. Later physical,
resource, lifecycle and temporal gates retain their owning plan phases; rotation
parity alone does not qualify the complete solution.

**Historical scope:** culling was outside this completed P2 continuation.
The owner's recast now integrates empty-band omission into P3 construction;
the former deferred pre-recording schedule is superseded.

### Remaining Work And Execution Controls

P3–P5 and P5-Celestial are delivered; do not restart completed phases from
the retained specifications below. The [status](status.md) links their current
owners, and the [handoff](handoff.md) distinguishes current adapters from
superseded historical bundles. Recorded reviews retain their frozen scope.

The selected P6 shadow revision is complete: captured, media-qualified, reviewed
and accepted by the owner. Its record owns the acceptance and exact `CLEAN`
source-review authority, preserving v4 and all completed phase evidence. The
P6-only AFK resource authorization has expired; standard execution controls
apply and earlier 6 GiB exceptions remain expired. The P6 section owns the location, camera,
duration, scene and resource decisions and supersedes earlier film assumptions.

P7 has ended the experiment. The following controls are retained for a future
owner-selected reopening, not as an active task list.

For every diagnostic name one question, assumption/abstraction, input domain,
expected invariant, discriminator and stop condition before execution. Start
with a subset designed for a ten-minute maximum. Limit an unresolved question
to two planned diagnostic rounds before writing a disposition or revised
bounded hypothesis; do not automatically double resolution or launch an
overnight sweep. A larger run must be specifically justified in the current
plan with estimated cost and the claim it can resolve. The existing 45/90-minute
wrapper ceilings are not permission for open-ended reference development.
Report findings at these boundaries and keep visual delivery independent of
unrelated analysis. No numerical tolerance is loosened to make a result pass.

### P3 — Develop And Qualify The Shell Layout

This replaces the previous translation-policy branch investigation. Use a
correctness-first fresh build before testing reuse. Keep layout-change error,
empty-band omission error and movement/reuse error separate.

- [x] **P3-A0: analyze abstractions and defend mathematical transfer.** Completed
      in [abstraction-inventory.md](abstraction-inventory.md), with a hashed reading
      manifest, dependency map, derived equations, informative Dials/ozone context
      and bounded verification recommendations. This completes analysis only.
      The preserved step specification follows: produce
      an authored `abstraction-inventory.md` in this topic, source-bound to the
      selected distant/spherical and local implementations and actual evidence.
      This is analysis, not a new transport implementation. Inventory every
      relevant abstraction: atmosphere coefficients/density, geometry/path
      boundaries, source illumination/disk, spectral units, phase laws,
      attenuation, scattering-order recurrence, ground reflection, receiver
      integration, numerical discretization/truncation, cache coordinates and
      interpolation, empty-band admission, movement identity and presentation.
      Include each abstraction's responsibility, mathematical inputs/outputs
      and units, original equation and evidence, preserved mathematics,
      flat/local substitutions, their derived consequences, assumptions and
      validity domain, implementation mapping, defense, focused proof and open
      limitations. Classify each change as exact geometry/input substitution,
      inherited numerical approximation, new approximation or unsupported claim.
      Trace changed ray intervals/density arguments, finite-distance dilution
      and position-varying source/phase angles through the same transport laws;
      preserve ground terms, pure-order recurrence and spectral accounting.
      Explain why radius/altitude plus outgoing direction suffices only under
      the stated symmetry assumptions. Do not infer unchanged numerical error
      from unchanged equations or inherit spherical shadow/twilight behavior.
      Identify any implementation that actually changes the mathematics;
      defend it explicitly or leave it unresolved rather than silently adopting
      it. Exit with an inspectable inventory, dependency map, transfer gaps and
      bounded verification recommendations. Owner inspection is a touch-point;
      source implementation remains subject to its separate review gates.
      Include an informative subsection on compensating errors using the
      preserved `sky-accuracy-dials` findings. Explain how changes in path
      lengths, local source directions, density/phase reconstruction and order
      accounting could change cancellation; classify evidence versus hypothesis.
      Give ozone explicit treatment: pin enabled/disabled status, absorption
      spectrum/profile and source/view/recurrence paths, and identify missing
      evidence. The owner selects this material as informative only: no new
      cancellation campaign, ozone change, automatic correction adoption,
      acceptance oracle or resumption of the suspended experiment is selected.
- [x] **P3-A: freeze the layout and proof contract.** Deliverables are pinned in
      [p3-contract.md](p3-contract.md); its completion-authority section requires
      current validated source review before phase completion is reported.
      The layout, gate identity, small topology proofs and script monitor are
      recorded there. No P3-B capture or accuracy study was run.
      Preserved specification: specify Euclidean shell
      bounds, field-resolution nodes and altitude/cross-section sampling, without
      equating the 2,048 source-strength bands with full field layers. Derive
      conservative atmospheric intersections for the complete construction and
      query workload, including the film. Define boundary/tangent admission,
      retained interpolation support, physical-band-to-compact-address mapping,
      angular frames and cross-shell stencils. Inventory all pure, transported
      and cumulative fields and preserve recurrence across shells. Keep necessary
      source facts and vacuum ray segments even where scattering bands are empty.
      Use P3-A0 to freeze the claim/evidence map and compatible P1 limits,
      mathematical transfer/approximation defenses, ordinary correctness checks
      and layout/omission measurements
      before new scoring. Record a new gate identity and the superseded global
      reference prerequisite and current deferral of approximation error estimates;
      preserve prior results and compatible correctness/resource limits.
      Capture the review baseline and refresh reviewer context before coding.
- [x] **P3-B: build the first fresh candidate.** The owner-selected
      [fresh Flat0 delivery](p3-first-image.md) records V3a, construction/work
      observations and receipt-governed completion. Phase completion requires
      its matching exit-0 CLEAN source review; later qualification stays open.
      Allocate and compute only
      admitted scattering samples from the outset. Implement matching CPU/GPU
      construction and lookup, with explicit out-of-coverage rejection. Deliver
      V3a at Flat 0 promptly, labeling any bounded diagnostic profile. Record
      total/admitted/omitted bands, retained sample counts, actual allocated bytes
      and executed work; distinguish potential storage from actual GPU resources.
- [x] **Focused lower-band diagnostic, owner-selected supplemental request.**
      The [source trace](lower-band-source-trace.md) records measured Flat0
      order/path/spectral contributions, an analytic Flat180 source comparison
      and receipt-governed completion. The dedicated Flat180 trace is incomplete
      after its resource stop. This does not select the full P3-C matrix or tune
      rendering policies.
- [x] **P3-C: numerical delivery accepted; implementation completion is receipt-governed.**
      The [qualification record](p3-layout-qualification.md) owns the matching
      source-review gate. Preserved specification: deliver V3b across
      the frozen Flat 0/45/90/135/180 cadence. Compare fresh old-grid controls
      against fresh candidates as behavior controls. Separately evaluate the
      P3-A0 adaptation/approximation claims through their mathematical rationale,
      assumptions and ordinary analytic/implementation correctness checks.
      Spatial/angular/path/order sensitivity and quantified error estimates are
      deferred to later owner-selected work. Shared-path parity is labeled
      consistency, not independent physical truth.
      Verify complete required fields/rays, every spectral channel,
      axis limits, ground/top boundaries, curved valid-domain edges, band seams,
      compact-address round trips and off-grid support. In bounded proof runs,
      compare the compact candidate with an equivalent unculled candidate using
      identical occupied samples and physical equations. Tangent/uncertain bands
      remain admitted. Measure omission savings and whole-layout costs separately;
      fewer bands alone does not prove lower total memory or better accuracy.
- [x] **P3-D numerical delivery: prove source movement.** Compare transformed reuse against newly
      built shell candidates at identical candidate coverage and source policy.
      Recheck the P2 non-cardinal rotation matrix and physical axis continuity;
      then test horizontal translations and the standard orbital-time placements.
      Deliver V3c paired PNGs and exact-time traces. Derive shell policy and coverage
      identity independently of observer placement before excluding placement
      from construction identity. Include endpoint precision and complete rays;
      inherited P2 parity does not establish these new-layout properties.
      Numerical qualification is accepted in [P3-D movement](p3-movement.md).
      Implementation completion remains open until its matching primary/audit
      validation is exit-0 CLEAN; a missing or stale receipt keeps it open.
- [x] **P3-E: decide the candidate.** Delivered in [candidate disposition](p3-disposition.md),
      with combined source-review authority in [P5 qualification](p5-qualification.md).
      The retained specification follows: record distinct accuracy, omission,
      resource and reuse results, exact admitted domain and unresolved cells.
      Validate applicable primary/independent source review before completion.
      State whether each result supports inherited methods, adaptation
      consistency, approximation, omission or reuse, and its domain/limitations.
      A defensible fresh layout with limited or rejected reuse can advance with an
      explicit fresh-build fallback. Demonstrated mathematical or implementation
      defects and inadmissible queries still require correction or rejection.
      Unmeasured approximation error is disclosed and deferred; it does not by
      itself block this experiment's current defensibility goal.

Changing source height rebuilds nodes, intersections and compact addressing.
Out-of-coverage movement requests a replacement build; it never silently clamps
to existing fields. A source-centered reference alone does not prove translation
invariance when construction boundaries or the source-amplitude policy move.

**Exit:** a fresh shell-layout disposition under the revised evidence contract,
with defended assumptions/abstractions, disclosed unmeasured approximation error, validated
omission and an explicit reuse region, or documented rejection/incomplete claims.
Keep failed cells and old
controls immutable. If the new layout is rejected, record that result before
choosing an already qualified fallback for the still-required film; an attractive
fallback recording must not be labeled success of the new layout.

### P4 — Implement In-App Construction And Coherent Publication

Accepted behavior: [P4 application record](p4-application.md). Current source
completion is derived from the complete P3-E–P5 receipt linked by P5.

Keep experimental adapters and any adapted implementations inside the source
root. Read production collaborators without changing their contracts or adding
an experiment dependency to production.
Here, in-app integration means the experiment's running browser scene can build,
consume and replace the cache. Production application/API integration remains
a separately selected promotion step.

Separate canonical field identity from live horizontal source placement. The
identity must include height, atmosphere, source radius/power/spectrum, ground,
domain nodes/bounds, quadrature, path controls, order, shell policy, units,
precision, layout, schema, implementation and accepted backend capabilities.
Include shell-intersection policy, physical band identities, compact address
mapping and interpolation support. Exclude a placement only after P3 establishes
that it does not affect the new candidate's construction. Keep any remaining
placement-dependent field or source-policy identity explicit.

Build on the GPU in the app, retain complete interpolation support and define
ownership of shared fields, active/staging resources and their disposal.
Publish one compatible frame state: cache transform, exact current source
facts, direct light, receiver sky lighting and scene shadow
direction. Receiver lighting for this comparison is evaluated at the frame's
state; do not hide discrepancies with the recording's one-second interpolation.
Visible Sun-disc and stellar composition are qualified separately in
P5-Celestial; the completed P4/P5 application did not enable its celestial roster.

Exercise unchanged-cache reuse, horizontal movement, height/atmosphere/source
changes, camera coverage exits, supersession, failure, cancellation and
disposal. A failed or superseded build must preserve the previous complete
state and must not dispose fields still used by a live binding. Measure the
cost of preserving old and staging replacement caches simultaneously.

**Exit:** paired CPU/GPU proof through the experimental application path and
validated lifecycle evidence, including deliberate failed/cancelled builds,
with the V4 lighting/rebuild comparison published.

### P5 — Qualify Defensibility, Motion And Benefit

Accepted numerical delivery: [P5 claim matrix](p5-qualification.md), all ten
complete pairs. Its matching validated source receipt governs implementation
completion. P5 captures have ended; its temporary reserve exception is no
longer selected. P6 is now selected below. The retained P5 specification follows.

Run the revised P3-A claim matrix on the declared GPU with the selected profile.
Keep inherited method support, adaptation consistency, numerical approximation,
reuse, visual suitability and measured benefit as separate conclusions. Compare
fresh current-policy, fresh selected-candidate and reused selected-candidate
outputs under identical physical states, camera paths and display settings.
Capture physical fields/rays and displayed frames separately. Include Sun
motion, observer movement, domain-edge approach and a height change/rebuild.
Include the required five-state sky-only and colored-box cadence plates and
the primary three-state consistency comparisons. Record intermediate correctness
checks under the revised P3-A contract, preserving compatible P1 limits.
Absolute approximation error estimates are deferred; images do not supply them.
If only a narrower reuse region qualifies, explicitly report which standard
states it excludes; it does not satisfy the complete three-state claim.

For the 120-state exact-time trajectories, independently construct one canonical
control field and one reused field for each of the five frozen states, in both
sky-only and ordinary colored-box workloads. Each running application evaluates
all original exact-time states, all 96 view rays and Native15 receiver packets.
Authenticate complete input/source identities, check canonical field identity
and actual cache reuse at every frame, and compare spectra, displayed images
and first/second differences. This is independently constructed trajectory
consistency, not 120 fresh constructions per trajectory. The unchanged-policy
P3-D complete-field covariance proofs supply separate construction-invariance
support. This avoids hundreds of redundant builds while preserving the current
claim distinction. If bounded chunks are needed, retain every original slot and
join derivative comparisons across chunk boundaries. Each job has an explicit
ten-minute guard with the existing 8 GiB ceiling and default free-memory reserve.
On 2026-10-10 the owner approved a temporary 6 GiB machine reserve for the
remaining P5 captures only. Use the explicit P5 exception flag; omit it after
P5. The ten-minute deadline and 8 GiB process ceiling are unchanged.
The full matrix has 20 serialized jobs (five states, two workloads, two cache
instances) and 2,400 captures. The initial 120-state job indicates roughly
three minutes per job, so allow approximately one hour in total while retaining
the per-job guard and progress reporting. It resolves the finite declared P5
trajectory cells; it is not a reference-convergence or resolution sweep.

Measure cold build time, replacement latency, number of builds avoided,
per-frame lookup/receiver cost, logical and observed allocations, peak active
plus staging memory, and responsiveness while building. Record warm-up,
repetition policy, median and tail behavior; include harness overhead and
measurement uncertainty. Full-profile timeouts or allocation failures are
failed/incomplete cells, not evidence supplied by smaller profiles.

The owner accepts the observed approximately 30-36-second fresh build as a
startup cost and, on 2026-10-10, directs that performance checks be relaxed.
Startup/replacement latency, warm draw cost, page responsiveness and measured
build avoidance are informative observations, not completion thresholds.
Retain the original targets and report whether observations met them; do not
edit frozen fixtures or relabel historical results. Actual unchanged-cache
reuse, exact-state consistency, lifecycle correctness and coverage remain
required. The existing 8 GiB owned-memory ceiling, default 8 GiB machine reserve
(with the explicit remaining-P5 exception above),
exclusive heavy-job ownership and ten-minute job deadline remain execution
controls. No performance optimization campaign is required for completion.

Observe frame differences and lighting/shadow continuity along exact-time
trajectories. A layout must pass current mathematical/implementation correctness,
temporal, lifecycle and resource gates. Report layout cost and omission savings
separately from measured reuse/build avoidance. Preserve fresh/reused
consistency checks and report actual cache reuse; the historical percentage
target is informative under the current owner timing disposition. Do not infer
success from an attractive video or unchanged average frame time alone.

**Exit:** a claim-by-claim defensibility report linking the P3-A0 inventory,
assumptions, evidence and remaining extrapolation limits, plus an explicit
pass/fail/inconclusive matrix with no unmeasured required cell, source
and artifact identities, timing/memory results and an inspectable comparison
Markdown/JSON record and direct captures delivering V5.

#### Integrated Empty-Band Qualification

P3 owns empty-band omission from the first allocation and build. P5 revalidates
its admitted bands, interpolation support, skipped work, actual storage and
coverage along the full motion/film workload, including replacement builds at
changed height. There is no separate late culling retrofit. New intersection or
addressing changes invalidate affected qualification and review evidence.

### P5-Celestial — Integrate The Sun Disc And Stars

Selected before P6 at the owner's request on 2026-10-10. The completed P4/P5
application integrates the atmospheric source and scene illumination, but its
profile leaves the celestial roster unset. Neither the visible Sun disc nor
stars were enabled in that earlier application. Existing numerical evidence keeps its atmospheric-cache
and scene-lighting scope; preserve every sealed run and prior review artifact.

The [celestial delivery](p5-celestial.md) now owns accepted focused numerical
results, V5a/V5b images, the two-second preview and matching source-review
completion authority. The current selected adapter enables the Sun and flat
stars. Captures and cleanup have finished; the default 8 GiB reserve applies
again. Its former stop for owner visual review was superseded by the owner's
current P6 selection below.

1. **Correct the records and define the unit.** Distinguish atmospheric-cache
   qualification from celestial rendering readiness. Refresh governing reviewer
   context and capture a baseline before implementation. Extend the abstraction
   inventory with the stellar direction/transport assumptions; existing source
   receipts do not qualify the new integration or changed governing context.
   Trace the actual spherical stellar cache/generation path, including static
   input reuse, collision aggregation, attenuation ownership, compatibility,
   publication and disposal. The [operational design basis](p5-celestial-design.md#cache-and-runtime-operations)
   owns that trace separately from the flat placement notes.
2. **Connect the finite Sun disc.** Reuse the existing local-Sun celestial path
   through contained adapters. Share the atmosphere's source position, radius,
   spectrum and observation. Update live disc placement without rebuilding the
   atmospheric cache solely for horizontal movement. Include celestial resources
   in coherent publication, replacement, cancellation and disposal ownership.
3. **Deliver V5a early.** Publish direct close/intermediate/far Sun-disc PNGs at
   Flat0/90/180 using declared Sun-facing camera poses. Check angular size,
   position, spectral attenuation and scene occlusion before adding stars.
4. **Adapt stars to flat geometry.** Follow the owner-confirmed current
   [flat-star design notes](p5-celestial-design.md#governing-star-notes).
   Reuse the established catalog, spectra, rasterization and presentation
   machinery. Apply shared live pole rotation to canonical catalog directions,
   then the north-polar azimuthal-equidistant mapping onto the presentation dome.
   Preserve the base-epoch overhead invariant and keep the dome separate from
   physical flat-atmosphere transport. Record the concrete dome parameters and
   rotation period; qualify their CPU/GPU mapping. Replace spherical direction
   and transmission dependencies. Preserve the existing color/adaptation model. Stars
   may correctly remain invisible against a bright sky; do not force visibility
   or fabricate darkness to match the distant film.
5. **Deliver V5b.** Publish a clearly labeled star-only diagnostic and combined
   sky images under the actual lighting conditions, followed by a short motion
   preview. Diagnostic isolation is evidence for the star path, not a substitute
   for the combined physical state or the full P6 recording.
6. **Qualify and hand off.** Run focused CPU/GPU spectral, geometry, motion,
   occlusion, compatible-reuse, replacement and resource-cleanup proofs. Reuse
   unaffected P5 evidence rather than repeating the full matrix. Complete mapped
   primary review and independent audit for the new coherent unit, update status
   with measured results and limitations, and stop for owner visual review.

The owner explicitly relaxed the 8 GiB free-memory restriction for the upcoming
AFK integration work, clarifying that higher memory use would not cause a
hardship. Use a temporary **6 GiB machine free-memory reserve for P5-Celestial**
as the execution choice, consistent with the earlier bounded capture experience.
This is a new phase-scoped authorization; the old remaining-P5 exception stays
inactive. Implement and validate the scoped guard/qualification selection before
launching celestial jobs, and record the selected reserve and owner instruction
in new run provenance. The launcher now provides the explicit phase-scoped flag.
Restore the default 8 GiB reserve at phase completion or an owner-directed
restoration; this exception does not authorize P6 recording.

Prioritize integration over memory optimization. Keep GPU jobs serialized and
clean up between runs. The 8 GiB owned-process ceiling, fail-closed monitoring
and ten-minute job limit remain unchanged.
Performance measurements remain informative; correctness and execution controls
remain required. Keep implementation and evidence inside the experiment's
declared roots, with compact reproducible artifacts and no full browser profiles
or image-gallery pages. JavaScript remains the implementation language.

**Exit:** validated celestial integration with V5a/V5b, focused proof results,
explicit assumptions/limitations and fresh source-review evidence. Owner visual
review and selection are required before the full video; P6 is not started by
completion of this phase.

### P6 — Reproduce The Local-Sun Full-Orbit Film

The owner selected this creative film on 2026-10-11 and explicitly relaxed the
old identical-scene and original-camera requirements. The film must be
attractive, use dynamic camera movement, show the local Sun completing its
full circuit, and clearly reveal its physical apparent-size change with
distance. The owner chose **one continuous shot, no overlays**, and a duration
between one and two minutes. The selected target is **90 seconds**.

After inspecting v4, the owner liked the film and requested visible ground
shadows during the Sun's traverse, suggesting that walls could move outward.
The [shadow revision](p6-shadow-revision.md) owns this change's decisions,
progress and results. v4 remains immutable comparison evidence. Native stills,
the native motion excerpt and full preview 00777/00779 establish the composition.
The following **v5 recipe and acceptance gates were frozen before final capture**.
Final 00781/00783 media qualification passes. The revision record retains the
exact `CLEAN` source-review receipt and owner creative acceptance; P6 is complete.

This section supersedes earlier P6 references to the identical Union Glacier
observatory replay, original camera score, fixed 60-second duration and
1,800-frame delivery. Historical P0-P5 recipes and evidence retain their
original locations, rasters, time mappings and claims.

#### Selected Parameters And Location

| Parameter | Frozen v5 selection |
| --- | --- |
| Location | San Jose, latitude 37.3382 degrees, longitude -121.8863 degrees |
| Date basis | Winter solstice, December 21, 2024; production resolver basis `2024-12-21T09:20:00.000Z` |
| Source cycle | One increasing 24-hour circuit, Flat180 through Flat540; begin with the far-side boundary immediately before that date's closest approach |
| Delivery | 90 seconds, 30 fps, 3840 by 2160, 2,700 distinct rendered slots plus a separate exact endpoint |
| Editing | One continuous camera take; no cuts, captions, compass, orbit diagram, progress display or other overlays |
| Scene | `circular-meridian-observatory-v5`, seed `3202609`, retaining v4's architectural vocabulary and continuous floor with the expanded dimensions below |
| Camera | Moving dolly and crane with Sun-following bearing; smooth wide opening and closing |
| Lens | 60-degree vertical FOV at opening/closing; fixed 45-degree vertical FOV throughout the central full circuit; circuit Sun at NDC y=0.82, about 9% below the top |
| Sun | Existing fixed 16-statute-mile physical radius, 3,000-mile source-height policy, unchanged source power and spectra |
| Presentation | Current p2 and qualified human-vision celestial presentation; actual measured receiver illumination |
| Audio | Silent |
| Encoding | Existing deterministic recorder, streamed H.264 MP4 at 45 Mbps native |

San Jose is selected under the owner's permitted alternative because it places
the observer **inside** the source's projected orbit. The model's source
bearing therefore completes a full turn around the observer. Union Glacier
lies outside the source orbit: its apparent bearing swings roughly 84 degrees
across the northern sky, even while the source completes its full physical
circuit. That is a poorer match for an unmistakable full turn without overlays.

The source/evidence basis is production
[FlatEarthGeometry](../../../../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js)
and the preserved [Union Glacier recipe](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00725-p5-celestial/recipe.json)
and [San Jose recipe](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00716-p5-celestial/recipe.json).
San Jose's near/far distances are approximately 8,294/19,058 km, giving roughly
a **2.30-fold diameter change**. The selected 45-degree/4K composition gives
approximately **16 pixels near and 7 pixels far**, compared with v4's approximately
21/9 geometric pixels at 1080p. This deliberately trades some disc pixel size
for visible ground shadows. Both near and far discs must remain readable, with
the physical ratio preserved. New GPU and decoded-image measurements must
verify the estimates before acceptance; no size gain or changing physical radius
is selected. Frozen native minimum diameters are 14 near and 6 far pixels;
the decoded ratio must be within 15% relative to the exact geometric ratio
(approximately 2.2977). Every decoded frame retains the existing 3-pixel width
agreement, positive-contrast and support requirements. No tolerance is changed
by the low-resolution preview's pixel quantization.

Derive the actual start instant through the production location/time path;
if its Flat180 resolver selects the following far-side boundary, choose the
preceding boundary by moving back one day, then resolve every increasing
instant normally. Record the actual UTC interval and seasonal drift. Do not
repeat modulo-angle requests, impose a false astronomical sunset/darkness
schedule, or force equal beginning/end pixels.

The derived interval is `2024-12-21T08:05:23.319Z` through
`2024-12-22T08:05:23.319Z`. Exact-state proof 00752 measures approximately
359.921 degrees of apparent bearing winding for v4 over the nominal full circuit;
the small departure from exactly 360 degrees reflects the resolved seasonal
source motion. The [v4 execution record](p6-execution.md) owns those measurements.
The revised camera, larger scene and raster require new trajectory and coverage
evidence even though the physical-day selection is retained.

#### Scene And Continuous Camera Score

Use a fictional sculptural observatory at the selected model location:
warm pale stone, dark basalt accents, restrained brass details, open sky and
low terrain. Adapt existing deterministic scene construction and measured-light
collaborators where useful, with a pinned seed. This is an authored scene,
not a claim to reproduce the real San Jose landscape.

Create four visually distinct, unlabeled landmarks around the court: a split
gateway at the far-side starting bearing, a colonnade, a taller stepped tower
toward closest approach, and low terraces/offset arches. The opening establishes
the gateway; the full panorama passes the distinct landmarks and returns to
that gateway. Keep the Sun unobscured and include enough ground to read the
monuments' moving shadows along the actual trajectory. Do not enlarge the
Sun or alter its physical path to fit the scenery.

Retain v4's continuous stone floor, three flush brass bands and distinct
shadow-casting monuments. Its raised-seam correction and delivered evidence
remain preserved. The selected revision expands the court to about 430 m radius
and uses 36 perimeter pylons at 420 m with interrupted lintels. Place the gateway,
colonnade, tower and arches at 360, 380, 395 and 370 m respectively. Retain their
original absolute heights, derived at the old 258/216/229/238/232 m ring/landmark
radii; do not recalculate heights from the expanded placements. This gives
approximately 56-160 m ring pylons and a 147 m tower. Their predicted roughly
200 m shadows terminate around 196-207 m from the center, inside the visible
floor. Eight sparse 30 m gnomons at 180 m provide selected depth/shadow references.
The native stills and full preview qualify this composition; adjoining floor
regions must remain nonoverlapping.

v4's 18-degree circuit lens leaves even its bottom ray about 2.77-23.70 degrees
above the horizon. Moving walls alone therefore cannot reveal the floor during
that circuit. The selected 45-degree lens and higher Sun placement address the
ray geometry; the wider court then supplies useful receiving ground and room
for visible architectural shadows. The [revision record](p6-shadow-revision.md)
owns accepted native still and full-preview shadow measurements and inspection.

| Film time | Action |
| --- | --- |
| 0-10 seconds | Retain the courtyard move and rise from 6 to 8 m; smoothly narrow vertical FOV from 60 to 45 degrees. Hold the initial physical source instant while the camera moves. |
| 10-80 seconds | Complete the entire physical source circuit at the fixed 45-degree lens, with Sun NDC y=0.82. Retain the figure-eight dolly, approximately 12 m east/west and 8 m north/south, and 8-12 m camera altitude. Keep receiving ground and moving architectural shadows legible. |
| 80-90 seconds | Retain the return move and lower to 6 m, smoothly widening from 45 to 60 degrees to reveal the gateway and court. Hold the final source instant while the camera continues moving. |

Use smooth position/orientation/FOV curves, including matched zero-velocity
transitions at the opening, orbit and closing boundaries. Over the central
70 seconds, map one physical day monotonically with two-second smooth
acceleration/deceleration ramps and a constant rate between them. Normalize
the integrated ramp to exactly one day. The nominal unwrapped source phase is
`180 + 360 * progress`; resolve the actual source facts from the associated
instant. Keep both in the trace.

Keep the Sun at the same selected upper-screen position during the fixed-lens
circuit. Its growth and shrinkage must result from finite-source geometry,
not a changing radius, screen-space gain or compensating zoom. The full
far-near-far comparison occurs within that unchanged lens. The moving
foreground, coherent shadows and return to the starting landmark establish
the camera's continuous panorama.

#### Implementation And Lighting Boundary

Reuse the existing recording mechanics in
[`scripts/animation-evidence`](../../../../../scripts/animation-evidence/README.md).
Author only the experiment-owned scene, camera/clock score, shell-frame adapter,
host orchestration and focused qualification needed for this film. Production,
The Hours implementation, previous experiments, archives and sealed runs
remain read-only. The original scene's equality gate is replaced by a frozen,
reproducible **new film recipe** with source/asset/seed identities.

The film session owns one persistent scene/camera and bounded render/shadow
resources. Exact physical frames borrow that scene and compatible atmospheric
cache; disposing a frame must not dispose shared film resources. Serialize
publication and rendering so staging cannot mutate visible lighting/camera
state. Retain canonical field identity, compatible reuse and exact-state
replacement behavior. Verify the complete San Jose source/camera/ray domain;
the earlier Union Glacier P5 trajectory does not by itself qualify this route.

Preserve the qualified shared celestial transmission and contained Sun-disc
coverage correction. Use actual finite-source position for direct illumination,
disc placement and the scene shadow direction. Begin with one shared 4096-square
shadow map with a 1,100 m shared extent and focus
`[0, 40, 0]` for the expanded court. Admit actual scene resources and measure the local-source directional
approximation over the enlarged occupied scene. Qualify shadow coverage and
detail from actual renders; v4's smaller-scene measurements do not qualify it.

Retain the existing film presentation method of measured one-second diffuse
and adaptation endpoints with its established monotone cubic interpolation,
using new measurements for this scene and physical clock. Keep sky, source
position/disc and direct spectra at the exact rendered state. Keep unsmoothed
exact-state probes separate from presentation interpolation, and freeze endpoint
and interpolation identities before capture.

Use streamed, backpressured MP4 output through the existing bounded chunk sink
and deterministic canvas recorder. Keep explicit milestone capture slots:
the original The Hours wrapper's 60-second sparse-capture shortcut must not
silently retain all 2,700 native PNGs for this 90-second film. Record every
slot's compact trace and retain selected lossless stills.

#### Execution Budget And Review Milestone

P6 is complete and its resource exception has expired. The following records
the controls selected for the completed capture; subsequent work uses the
standard 8 GiB free-memory reserve, 8 GiB owned-process ceiling and ten-minute jobs.

The owner permitted greater computer-resource use while AFK for this
P6 work. The selection was a **P6-only 4 GiB machine free-memory reserve**, **12 GiB aggregate
owned-process ceiling**, and a **45-minute maximum for one final capture job**.
Preview/diagnostic jobs remain bounded to ten minutes. Keep one GPU/browser
job at a time, five-second telemetry, fail-closed monitoring, cancellation,
owned-process cleanup and progress events at least every 30 seconds. These
choices provide headroom on the inspected approximately 32 GiB machine; they
are execution choices under the owner's current instruction, not permanent
defaults. Restore the standard controls after this P6 work.

The initial 4K resource estimate adds about 0.77 GB to v4's approximately
1.38 GB logical peak. Select an explicit **P6-film-only 2.4 GB logical payload
bound** for the revised raster and its render targets before preview. This is
a declared composition/resource tradeoff; cache shapes and payloads are
unchanged, and the ordinary 1.6 GB application gate retains its scope. Record
actual logical allocations and sampled process memory separately. The 12 GiB
owned-process guard remains the independent execution ceiling; its headroom
does not establish physical VRAM consumption or replace allocation admission.

The accepted native motion excerpt supports an approximately 18-minute final
render estimate, including startup, within the selected 45-minute capture guard.
Its 31.6-second qualification supports a full native qualifier estimate below
five minutes; keep that job's ten-minute guard. These are workload estimates,
not revised limits or measured final-job results.

Do not compile or execute temporary native monitoring helpers. Existing media
encoding dependencies remain available. The resource authorization changes
neither the JavaScript requirement nor immutable-run boundaries. Generated
output uses this experiment's declared output root rather than the generic
independent-execution scratch location. Review artifacts use the existing
ignored review-service root.

The current coherent implementation unit is the P6 shadow/composition revision:
scene and camera framing, raster/media controls, affected trajectory/shadow
proofs and relevant unchanged frame/lighting/recording collaborators. Its baseline
at `62fd5f66` is `.codex-tmp/review-standards/session-HOgzfK/baseline.json`.
The delivered v4 baseline and receipt remain linked by [its record](p6-execution.md).
Refresh reviewer context before implementation. Stabilize the working preview,
run the local type check, then obtain mapped primary review and independent
audit and validate the evidence before claiming implementation completion.

#### Preview, Capture And Acceptance

Native stills 00767, native motion 00769/00771 and full preview 00777/00779
complete the preparatory composition/preview checks below. Final capture
00781 and complete qualification 00783 pass the frozen v5 recipe/media gates.
The retained workflow below states their requirements. Source review and owner
creative acceptance are separately satisfied, as recorded by the revision.

1. Retain the site/physical-clock/source selection and scene seed. Produce
   native-raster near/far/intermediate composition stills for the candidate
   lens, Sun placement and expanded court. Verify visible receiving ground and
   directional monument shadows together with an unobscured, readable Sun.
   Finalize scene dimensions, shadow extent, lens/framing and disc thresholds
   from those stills, recording the deliberate pixel-size tradeoff before capture.
2. Deliver a short representative moving preview, then an inexpensive complete
   orbit preview covering the continuous score. Inspect actual rendered frames,
   scene composition, visible ground-shadow movement across the circuit,
   camera motion, Sun size contrast and the returning gateway. Revise the
   scene/camera using that evidence and record changes.
3. Check CPU/GPU camera/source/coverage facts, complete trajectory admission,
   shared-cache reuse/replacement and cleanup. Record frame-time/memory estimates
   from the preview before the full bounded job. Freeze the final recipe and
   decoded-media gates before full capture.
4. Record 2,700 distinct ideal camera/render states at `slot / 30` seconds;
   use unique frame identities and no held/duplicated frames. The complete
   physical circuit finishes at film time 80 seconds, within the encoded slots.
   Retain an additional exact 90-second lossless endpoint control.
5. Verify 90-second duration, 30 fps cadence, 2,700 frames, raster, codec,
   increasing physical time during the circuit, the full source-phase/bearing
   winding, fixed circuit FOV, projected disc-size trace, cache/light coherence,
   absence of GL errors, and decoded motion/solar-edge continuity.
6. The final-raster near/far disc must remain clearly resolved, with a measured
   diameter ratio consistent with the approximately 2.30 geometric ratio.
   Frozen native gates require at least 14 near pixels and 6 far pixels at
   4K, replacing v4's 20/8 targets to admit the wider floor-visible composition.
   The ratio gate remains within 15% relative to the exact geometric ratio;
   every decoded frame retains 3-pixel width agreement, positive contrast and
   support checks. Failure requires recipe or presentation
   diagnosis before acceptance, not an arbitrary source-size gain.
   Inspect beginning, close approach, far side, each landmark and both lens
   transitions. No overlays, cuts or scene occlusions may substitute for a
   legible circuit. Visible ground shadows are a new acceptance requirement:
   inspect representative near, far and intermediate circuit views and the
   moving preview for readable cast shadows that move with the actual Sun,
   without floor seams, self-shadow artifacts or clipped shadow-map coverage.
   Each of the five matched shadow controls must retain at least
   `max(64, 0.1% of ground-region pixels)` with a positive luma difference of
   at least 8 byte levels and mean affected-pixel contrast at least 10. Controls
   run after primary-frame encoding and restore exact light settings; diagnostic
   PNG rerender equality remains informational, with mismatches retained.
7. Deliver the native MP4, a compact review copy, selected lossless stills,
   recipe, timing/resource report and complete derivation/source/media hashes.
   Keep media compression observations separate from physical/caching claims.
   Owner inspection of the film remains final creative acceptance.

**Exit:** a verified continuous 90-second cinematic film meeting the existing
visual requirements and new ground-shadow visibility requirement, validated
revision implementation-review evidence, recorded
limitations and owner visual acceptance. The owner subsequently selected P7
closeout; production promotion, push and publication remain separate actions.

**Exit satisfied:** the [revision record](p6-shadow-revision.md#owner-acceptance)
records owner acceptance and links completed media qualification and source review.

### Deferred Follow-Up — Shared Construction Values

Defer the distant-cache-inspired construction optimizations to potential later
work. The first candidate is a position/wavelength table containing the two
direct-light scattering coefficients, including the selected local source
falloff and attenuation, indexed by all outgoing directions. The local prototype
already indexes a precomputed Mie phase matrix and reuses its canonical field
across admitted horizontal Sun movement. A further candidate is reuse of path
interpolation and attenuation tables across scattering orders, subject to their
additional memory cost. Neither candidate has measured time savings, and
neither is a current completion or recording gate. Any later implementation
must preserve the selected equations and sampling policy and check output
consistency and measured build/memory benefit.

### Deferred Follow-Up — Gray Horizon Cast

The owner observes a gray cast near the horizon in both the local-Sun images
and the distant-Sun model, and identifies this as a motivation for the
Sky Accuracy Dials experiments. Investigate later; this observation does not
identify a cause or establish a defect in the new cache layout.

Existing investigations are the starting point: the
[earlier appearance review](../gpu-resident-shared-block-cache/design.md)
described a horizon too gray instead of white, visible in the live application;
the [ozone-free ablation](../distant-sun-shadow-animation-evidence/continuation-plan.md#f1--ozone-free-cache-ablation)
built the matched candidate without establishing ozone as the cause.
Accuracy Dials already investigated numerical cancellation, horizon-focused
angular sampling and [aerosol phase/albedo sensitivity](../sky-accuracy-dials/aerosol-sensitivity-results.md).
Its [scope limits](../sky-accuracy-dials/results.md#factors-not-resolved-by-this-campaign)
leave app color/display and grazing-horizon appearance unqualified.

Use those preserved results and the [current Dials hypotheses](../sky-accuracy-dials/follow-up-context.md)
as informative context. Distinguish insufficient brightness from low color
saturation; the recent local-Sun trace establishes near-neutral light plus
tone-curve compression, not the cause of the distant-Sun gray-versus-white
complaint. A future investigation should distinguish atmospheric transport and
shared approximations from spectral-to-display conversion and adaptation,
using matched low-elevation spectra and images. No correction,
Dials resumption or additional experiment is selected. This follow-up does
not add a completion or recording gate to the current plan.

### P7 — Decide And Close Or Suspend

**Complete:** the owner selected closeout after accepting the film. The
[P7 record](p7-closeout.md) reports the accepted contained outcome, final findings,
limitations, resource inventory, preserved interruptions and standards restoration.
Its separate review receipt owns closeout-documentation compliance. No next
execution topic is selected. The retained requirements follow.

Report layout accuracy and admission, omitted work/storage and whole-layout
resource results, the useful reuse region, chosen shell policy, required rebuild
inputs, failure behavior and remaining limitations. The
owner inspects the artifacts and decides whether to pursue production adoption.
Prepare that separate adaptation plan only if selected; the experiment does
not change production defaults.

Validate applicable source-review evidence and document the disposition.
Use `end-experiment` to record completion or suspension and restore identified
temporary standards. A suspension records exact resume inputs and outstanding
gates. Preserve accepted, rejected, failed and interrupted runs in both cases.

## Proof, Review And Run Contract

- Use JavaScript scripts and existing runtimes, with Python for suitable support.
  Do not compile native helpers or package executable binaries. A specific
  language/build exception requires explicit owner permission before proceeding.
  No exception is currently approved; Norton exclusions do not grant one.
- Use focused self-verifying proof runners. Do not create an experimental
  unit-test tree, test-framework dependency or suite.
- Keep an experiment-local `jsconfig.json` with `allowJs`, `checkJs` and `noEmit`.
  Run `npx --no-install tsc -p experiments/local-sun-cache-reuse/jsconfig.json`
  after authored code changes. Local type checking and validated canonical
  `types.md` review by `contracts-reviewer` are both required before an
  implementation milestone is complete. Other lanes follow actual folder
  mappings; use the primary review, independent audit and evidence verifier.
- Derive repository/source/output roots from repository identity, not the
  working directory. Real-path-check every read/write boundary, reject symlinks,
  junctions and reparse points, and enforce declared read-only input roots.
- Allocate evidence under the experiment output root as
  `runs/<five-digit-sequence>-<kebab-name>/`, starting at `00000`; names are at
  most 16 characters. Allocate the next sequence, never fill gaps or reopen a
  completed run, and reject malformed prefixed entries.
- Every result records commands, parent inputs and hashes, schemas, provenance,
  physical/configuration parameters, operation/equation, implementation closure,
  tools, hardware, gate identity and output hashes. Derivatives go into a new
  run; the earlier probe and all historical evidence remain unchanged.
- Long operations expected to exceed one minute flush `progress.jsonl` at start,
  phase transitions, at least every 30 seconds and at termination. Events contain
  timestamp, phase and message, plus completed/total where countable and terminal
  state on completion. Keep another process able to monitor progress.
- Close and hash artifacts before publishing the terminal manifest with state
  `accepted`, `rejected`, `failed` or `interrupted`. An experiment-run acceptance
  does not imply owner approval of production adoption. A post-run verifier
  reads without modifying the run; corrections and retries use a new run.

## Ownership And Existing Controls

- [Transfer assessment](../../../production-algorithm32/caches/local-sun-transfer-assessment.md): source findings and
  initial transform evidence.
- [Current local cache state](../../../production-algorithm32/caches/unresolved-research.md): selected spatial domain
  and limits, existing behavior and historical qualification boundaries.
- [Extension contract](../../../production-algorithm32/caches/extension-contract.md): current production identity and
  paired CPU/GPU obligations; unchanged until a separately selected promotion.
- [GPU transport offload plan](../../../production-algorithm32/caches/gpu-transport-offload-plan.md): current fused
  transport work; avoid repeating its completed optimization.
- [Experiment startup skill](../../../../../.agents/skills/start-experiment/SKILL.md)
  and [output contract](../../../../../.agents/skills/start-experiment/references/output-contract.md):
  actual activation, folder standards, environment and run rules.
- [Experiment lifecycle skill](../../../../../.agents/skills/end-experiment/SKILL.md):
  ending, suspension and standards restoration.

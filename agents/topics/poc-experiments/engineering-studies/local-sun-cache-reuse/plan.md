# Local-Sun Cache Reuse Experiment Plan

## Status And Acceptance Question

Activated on 2026-10-08 through `start-experiment` at the owner's request.
This is the canonical execution plan for the contained lane. The owner selected
P0-P1 through `independent-execution` on 2026-10-08; those phases are complete.
The original P2 investigation completed through its counterexample exit. The owner
requested the corrective continuation below on 2026-10-08 and selected
its independent execution. Its measured result and completion authority are recorded in [P2 corrections](p2-corrections.md).
The owner has now recast P3 onward around a new Euclidean source-centered shell
layout, integrating empty-inner-band omission from the first prototype and
retaining the final recording. Independent P3-P5 execution is selected, stopping
before P6 recording or a fatal flaw without a viable authorized workaround.
The [execution record](p3-execution.md) owns prototype progress and explicit
numerical correctness workarounds; phase completion gates remain open.
Production promotion remains unselected.
The owner reselected remaining-plan execution on 2026-10-09 after terminating
the overnight workload because of memory pressure and editor unresponsiveness.
The [status](status.md#next-action) owns the current resumption milestone.
Stop before generating the video.
Local checkpoints follow that skill's
authorization and actual approval gates; no push or publication is selected.

Experiment identity: `local-sun-cache-reuse`.

Determine whether a Euclidean source-centered shell layout can accurately
represent the local-Sun multiple-scattering fields with useful measured memory
and construction cost, omitting nonintersecting inner bands from both storage
and calculation. Then establish its horizontal reuse region and in-app
rebuilding with coherent lighting. Layout accuracy, resource benefit and reuse
are separate conclusions. A change of source height rebuilds the cache in the
app; a separate Sun-angle axis or precomputed height inventory is not planned.

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
  film preserves the original scene setup, including its shared shadow adapter
  and measured-light interpolation, as described in P6. This film-only recipe
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
| V3b: layout cadence          | P3-C                                 | Fresh candidate versus current-grid controls across Flat 0/45/90/135/180, plus bounded compact-versus-unculled checks and independent numerical results. Does layout construction retain accuracy and what allocation/work was omitted?                                |
| V3c: movement comparison     | P3-D                                 | Fresh versus reused shell-candidate stills and a short motion clip, with layout-change differences kept separate. Which transforms actually qualify?                                                                                                                   |
| V4: app lighting and rebuild | P4                                   | The familiar six-box ground scene across the five degree-based time presets, plus a height-change/rebuild clip. Do sky, Sun, atmospheric attenuation, receivers and ordinary scene shadows stay coherent during reuse and replacement?                                 |
| V5: qualification comparison | P5                                   | Selected-profile comparisons, motion clips and an accuracy/resource summary for the owner’s disposition.                                                                                                                                                               |
| V6: full local-Sun film      | P6, final execution milestone        | Reproduce The Hours with the identical scene setup, changing to the local Sun at Union Glacier on the December solstice and a full clockwise orbit from 180° through 540°, followed by owner inspection.                                                               |

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

Publish each visual milestone as a sealed run with a standalone image or clip
and a compact Markdown/JSON record linking its matching controls, difference views,
parameters and current interpretation. Update experiment status with that link
and bring it to the owner's attention when available; preserve it when later
runs supersede its conclusions. Early motion clips may show only the reused
path with paired stills at selected poses; label that limitation. P5 still
requires the frozen temporal matrix, rather than treating those clips as
per-frame fresh-versus-reused numerical proof.

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

P0-P2 below retain the completed investigation's scope and history, with exact
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
Include the final film's December-solstice, full-orbit placements and camera
score in coverage planning, even though film execution is last. Freeze its
year/date basis, clock, unchanged scene identity and recording recipe before P6.
The film uses December as explicitly selected by the owner; use 2024 as the
reference year to match the original film unless the owner selects another.
Resolve and record the exact December-solstice date/instant before execution;
do not substitute the standard fixture's December 14 date.
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

Before resuming numerical or browser work, complete these steps in order.
They supplement P3-P5; existing accuracy and completion gates remain open.

1. Reduce diagnostic retention: retain allocation events once, with compact
   per-frame measurements and event references, rather than repeating cumulative
   histories in every frame and aggregate. Preserve all prior evidence unchanged.
2. Establish and enforce an aggregate process-memory ceiling and free-memory
   reserve before launching jobs. Account for native arrays, JavaScript objects,
   browser/worker processes, verification and capture overhead, alongside the
   application's logical resource budget. Run one heavy job at a time, with
   bounded duration and a recorded stop condition; inspect interrupted runs
   without reopening or overwriting them.
3. Finish the decisive higher-order scattering and receiver-light reference
   convergence checks, then evaluate the candidate's physical accuracy. Old-cache
   renders explain behavioral changes; matching them is not an accuracy target.
4. Complete the five-state old/new visual cadence and remaining fresh/reused
   motion cells in bounded batches. Retain the completed Flat 0 temporal proof.
5. Finish repeated build/replacement performance, expanded-coverage accuracy
   and resource qualification through the experimental application path.
6. Validate required source reviews and current handoff documentation before
   reporting P3-P5 complete. P6 recording remains behind the owner approval
   boundary and retains the agreed scene and full-orbit setup.

### P3 — Develop And Qualify The Shell Layout

This replaces the previous translation-policy branch investigation. Use a
correctness-first fresh build before testing reuse. Keep layout-change error,
empty-band omission error and movement/reuse error separate.

- [ ] **P3-A: freeze the layout and proof contract.** Specify Euclidean shell
      bounds, field-resolution nodes and altitude/cross-section sampling, without
      equating the 2,048 source-strength bands with full field layers. Derive
      conservative atmospheric intersections for the complete construction and
      query workload, including the film. Define boundary/tangent admission,
      retained interpolation support, physical-band-to-compact-address mapping,
      angular frames and cross-shell stencils. Inventory all pure, transported
      and cumulative fields and preserve recurrence across shells. Keep necessary
      source facts and vacuum ray segments even where scattering bands are empty.
      Freeze compatible P1 limits and additional layout/omission measurements
      before candidate results, recording any new gate identity and rationale.
      Capture the review baseline and refresh reviewer context before coding.
- [ ] **P3-B: build the first fresh candidate.** Allocate and compute only
      admitted scattering samples from the outset. Implement matching CPU/GPU
      construction and lookup, with explicit out-of-coverage rejection. Deliver
      V3a at Flat 0 promptly, labeling any bounded diagnostic profile. Record
      total/admitted/omitted bands, retained sample counts, actual allocated bytes
      and executed work; distinguish potential storage from actual GPU resources.
- [ ] **P3-C: qualify fresh-layout accuracy and omission.** Deliver V3b across
      the frozen Flat 0/45/90/135/180 cadence. Compare fresh old-grid controls
      against fresh candidates, then candidates against the independent reference
      and spatial refinement. Verify complete fields/rays, every spectral channel,
      axis limits, ground/top boundaries, curved valid-domain edges, band seams,
      compact-address round trips and off-grid support. In bounded proof runs,
      compare the compact candidate with an equivalent unculled candidate using
      identical occupied samples and physical equations. Tangent/uncertain bands
      remain admitted. Measure omission savings and whole-layout costs separately;
      fewer bands alone does not prove lower total memory or better accuracy.
- [ ] **P3-D: prove source movement.** Compare transformed reuse against newly
      built shell candidates at identical candidate coverage and source policy.
      Recheck the P2 non-cardinal rotation matrix and physical axis continuity;
      then test horizontal translations and the standard orbital-time placements.
      Deliver V3c paired stills and a short clip. Derive shell policy and coverage
      identity independently of observer placement before excluding placement
      from construction identity. Include endpoint precision and complete rays;
      inherited P2 parity does not establish these new-layout properties.
- [ ] **P3-E: decide the candidate.** Record distinct accuracy, omission,
      resource and reuse results, exact admitted domain and unresolved cells.
      Validate applicable primary/independent source review before completion.
      A correct fresh layout with limited or rejected reuse can advance with an
      explicit fresh-build fallback. An inaccurate or inadmissible layout remains
      rejected/incomplete; memory savings cannot waive its accuracy gates.

Changing source height rebuilds nodes, intersections and compact addressing.
Out-of-coverage movement requests a replacement build; it never silently clamps
to existing fields. A source-centered reference alone does not prove translation
invariance when construction boundaries or the source-amplitude policy move.

**Exit:** a qualified fresh shell-layout candidate with validated omission and
an explicit reuse region, or documented rejection. Keep failed cells and old
controls immutable. If the new layout is rejected, record that result before
choosing an already qualified fallback for the still-required film; an attractive
fallback recording must not be labeled success of the new layout.

### P4 — Implement In-App Construction And Coherent Publication

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
facts, direct light, receiver sky lighting, source disk and scene shadow
direction. Receiver lighting for this comparison is evaluated at the frame's
state; do not hide discrepancies with the recording's one-second interpolation.

Exercise unchanged-cache reuse, horizontal movement, height/atmosphere/source
changes, camera coverage exits, supersession, failure, cancellation and
disposal. A failed or superseded build must preserve the previous complete
state and must not dispose fields still used by a live binding. Measure the
cost of preserving old and staging replacement caches simultaneously.

**Exit:** paired CPU/GPU proof through the experimental application path and
validated lifecycle evidence, including deliberate failed/cancelled builds,
with the V4 lighting/rebuild comparison published.

### P5 — Qualify Accuracy, Motion And Benefit

Run the frozen matrix on the declared GPU with the selected profile. Compare
fresh current-policy, fresh selected-candidate and reused selected-candidate
outputs under identical physical states, camera paths and display settings.
Capture physical fields/rays and displayed frames separately. Include Sun
motion, observer movement, domain-edge approach and a height change/rebuild.
Include the required five-state sky-only and colored-box cadence plates and
the primary three-state numerical comparisons. Record intermediate numerical
checks according to the frozen P1 matrix rather than inferring them from images.
If only a narrower reuse region qualifies, explicitly report which standard
states it excludes; it does not satisfy the complete three-state claim.

Measure cold build time, replacement latency, number of builds avoided,
per-frame lookup/receiver cost, logical and observed allocations, peak active
plus staging memory, and responsiveness while building. Record warm-up,
repetition policy, median and tail behavior; include harness overhead and
measurement uncertainty. Full-profile timeouts or allocation failures are
failed/incomplete cells, not evidence supplied by smaller profiles.

Observe frame differences and lighting/shadow continuity along exact-time
trajectories. A layout must pass numerical, temporal, lifecycle and resource
gates. Report layout cost and omission savings separately from reuse/build-avoidance
benefit; claim useful reuse only when its frozen benefit and accuracy gates pass. Do not infer
success from an attractive video or unchanged average frame time alone.

**Exit:** an explicit pass/fail matrix with no unmeasured required cell, source
and artifact identities, timing/memory results and an inspectable comparison
Markdown/JSON record and direct captures delivering V5.

#### Integrated Empty-Band Qualification

P3 owns empty-band omission from the first allocation and build. P5 revalidates
its admitted bands, interpolation support, skipped work, actual storage and
coverage along the full motion/film workload, including replacement builds at
changed height. There is no separate late culling retrofit. New intersection or
addressing changes invalidate affected qualification and review evidence.

### P6 — Reproduce The Local-Sun Full-Orbit Film

This is the final execution milestone, after P5 qualification of the layout,
its integrated empty-band omission and any claimed reuse, and before lifecycle closeout.
The owner requests the distant-Sun film reproduced for the local Sun at Union
Glacier on the **December solstice**, running a full **360° clockwise orbit
starting at Flat 180**. This selects December explicitly; it does not change
the standard Union Glacier December 14 visual controls in earlier phases.

Use the production
[The Hours adapter](../../../../../scripts/flat32/the-hours/README.md) as the
read-only presentation and recording reference. The owner requires the
**identical scene setup otherwise**. Preserve the original deterministic
observatory, seed/RNG sequence, assets, object identities and transforms,
geometry/terrain, portal orientations, materials/textures, visual reflectance,
local-bounce recipe, animation score, camera choreography, shadow setup,
presentation filters and recording settings. Do not flatten or rebuild the
visual terrain, reposition portals for the new Sun, retheme the observatory
for Antarctica, or substitute the earlier six-box review scene.

The allowed changed inputs are the local-Sun source/flat atmospheric model,
Union Glacier observation, December-solstice date and 180°–540° film clock.
Light direction, illumination, visibility and Sun-relative camera poses follow
those changed inputs through the original scene/presentation equations. Keep
the authored camera curves, key times, offsets, FOV and Sun-framing rule; do not
replay San Jose's old Sun direction or invent a new camera score. The original
sky pixels, light spectra and source trajectory are not reused as local-Sun
results.

Keep authored visual ground/terrain separate from the new flat atmosphere's
physical ground boundary. Preserve both the original visual geometry and the
qualified flat transport contract. Resolve any incompatible scene endpoint
or below-ground coverage during the composition proof; do not silently alter
terrain or the physical model and claim an identical reproduction. A required
scene change is an unresolved scope decision, not an automatic adaptation.

Pin an original-scene setup manifest and verify a new experiment-owned replay
against it: seed and construction inputs, object inventory, canonical mesh
attributes/indices and transforms, material/texture identities, portal
directions, camera-score constants, lighting/shadow configuration and recording
policy. Coordinate/unit conversions must preserve the represented scene points.
Derive or copy new replay assets under the experiment roots with hashes and
complete parent provenance; original sources and completed film evidence stay
read-only. Scene-setup equality does not imply equal final pixels or MP4 bytes
after the source/model and observation change.

Retain the original delivery format: **3840 × 2160**, **30 fps**, **60 seconds**,
with **1,800 distinct ideal scene states**. Use the existing repository-owned
animation-evidence recording capabilities through an experiment-local adapter.
Treat offline encoding as a film workflow, not evidence of live 30-fps runtime
performance. Deliver a native MP4, a smaller review copy, lossless milestone
stills and an inspectable index.

#### Film Clock And Coverage

Resolve the Flat 180 start instant for Union Glacier's pinned December-solstice
date/year through the production location/time path. Keep a monotonically
increasing clock and unwrapped orbital phase:

```text
u = animationSeconds / 60
unwrappedDegrees = 180 + 360 * u
displayedDegrees = unwrappedDegrees modulo 360
physicalInstant = startInstant + u * 24 hours
```

Pin the frame-sampling convention to the original ideal recorder: encoded
slots `i = 0..1799` use `animationSeconds = i / 30`. The declared interval ends
at 60 seconds / 540°, with the last encoded sample one frame interval before
that boundary. Render a separate lossless endpoint control at exactly 540° to
verify the complete interval without adding a duplicated playback frame.

The displayed sequence crosses `180 → 225 → 270 → 315 → 0 → 45 → 90 → 135 → 180`.
Derive physical source facts from each exact increasing instant, not repeated
modulo-angle requests that can jump the date backward. Record seasonal/source
drift across the day and the final-versus-initial physical differences; do not
force equal end pixels or create an artificial loop closure. The local Sun's
actual geometry and attenuation determine its appearance throughout the orbit.
Do not impose the distant film's dawn, sunset or darkness schedule on it.

Qualify the full film trajectory's cache/ray coverage and camera-relative
precision. Reuse only inside the P5-qualified region. Elsewhere, build a fresh
compatible cache and wait for that exact state before capturing its ideal slot.
Record each frame's reuse/rebuild choice and source/cache identity. A limited
reuse result can therefore still produce the full requested film, but the
film must not be labeled proof of unrestricted 360° reuse. If no correct,
admitted full-profile path can supply a frame, retain the failed run and keep
this milestone incomplete rather than filling it with a held or clamped state.

#### Lighting, Preview And Acceptance

Use Algorithm32 local-Sun sky transport, source disk, distant-object composition
and actual newly measured local-Sun receiver spectra. Adapt the
camera's Sun-relative direction from the actual finite source and camera
position; preserve the original smooth score and keep the Sun's motion legible.
Maintain coherent direct light, diffuse light, source position and shadows.
Preserve the original shared observatory shadow configuration and update it
from the local Sun through an experiment-owned scene adapter. Pin the parent
configuration, including its one 4096-by-4096 map, coverage/focus, full-strength
direct contribution, bias and filtering; validate complete coverage, memory
and the local-source directional approximation without retuning the setup.
This does not modify ordinary Flat32 shadows or generalize a shadow API.

Preserve the original one-second measured diffuse/adaptation endpoints and
the same cubic interpolation/end conditions as the film's presentation recipe,
using fresh local-Sun measurements rather than the distant-film sample values.
Keep sky transport, source position/disk and direct spectra at the exact frame
state. Retain the exact-state receiver comparison from P4/P5 and unsmoothed
short film diagnostics separately so presentation interpolation cannot supply
cache-accuracy or reuse evidence. The final film clearly declares the unchanged
interpolation policy and its measured local-Sun parent inputs.

Before a full native capture, validate the scene-setup equality manifest and
deliver a composition still, a low-resolution
whole-orbit preview and short selected-profile checks around the 360° angle
wrap and any cache replacement. These remain late-stage V6 previews and do
not postpone V0–V5. Freeze the film-specific temporal/source and decoded-video
limits before evaluating the full capture; reuse applicable P5 limits and
declare any image-region/encoder differences from the distant-film detector.
Retain source-frame observations separately from encoding artifacts.

Verify all ideal slots, increasing physical times, unwrapped phase span,
frame count/cadence, profile, cache/source/light coherence, complete coverage,
source and decoded temporal behavior, unchanged scene-setup identity, and
absence of render/GL errors.
Capture lossless stills at the quarter-orbit milestones and the endpoint.
Retain a per-frame trace of source position, phase/time, camera, field identity,
lighting, shadow policy and build/reuse status, with complete derivation and
artifact hashes. Owner inspection of the native video is the final visual
acceptance decision; it does not authorize production promotion.

**Exit:** the complete native and review films, preview/still artifacts,
validated scene-setup equality, trace and media checks, declared reuse
limitations, and owner visual
acceptance. A failed or suspended film remains an explicit open deliverable.

### P7 — Decide And Close Or Suspend

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

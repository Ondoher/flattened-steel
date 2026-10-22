# Flat32 sky, scene and elevation controls

State: M1 foundations implemented and evidenced on 2026-10-22; M2-M4 await selection.
The local stellar path remains active, but conspicuous local star visibility is
unproven under the unchanged physical daylight adaptation; retain that M1 finding.
The [execution record](sky-scene-controls-execution.md) owns current progress and evidence.
Planning method: [create-plan](C:/Users/gande/.codex/skills/create-plan/SKILL.md).
Mode: production implementation with a small initial feasibility check.

## Outcome and behavior

Add three independent controls to the supported Flat32 app, in both
spherical/distant and the default compact flat/local modes:

| Control            | Choices and initial state                 | Meaning                                                                                                                                                                                                                                                                                    |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sky rendering      | Full (initial), No atmosphere, Shader off | Full retains the current scene/atmosphere/celestial composition. No atmosphere keeps the existing celestial pipeline, including stars and the Sun, with atmospheric in-scattering zero and atmospheric view attenuation disabled. Shader off preserves the existing direct-scene behavior. |
| Scene objects      | On (initial), Off                         | Hide/show the current review boxes, their depth occlusion and their shadows. Ground and physical ground blocking remain.                                                                                                                                                                   |
| Observer elevation | Current (5 m, initial), 500 m, 2 km       | Change the actual observer/camera height above the model surface, consistently for geometry, rays and cache lookup. This is not camera pitch, extra height added to a location's terrain elevation, or an image-only translation.                                                          |

These are explicit planning assumptions for owner refinement. In particular,
No atmosphere removes scattering and extinction together, preserves existing
Sun rendering, and uses normal stellar intensity rather than artificially boosting
stars. Retain the current physical Sun-to-object receiver lighting: this control
changes atmospheric presentation along the view, not the scene's illumination model.
Objects means the review boxes, not the ground. Preserve location, absolute
observation time, camera yaw/pitch and the other selections when a control changes.
Keep choices during location/time/mode changes and context restoration within an
app instance; reload persistence is not requested. Native controls must expose
clear labels and keyboard/selected-state behavior, without an inaccurate boolean
aria-pressed contract for a three-state control.

Video scene presets are deferred pending a separate owner decision. Do not add
those scenes, a scene editor, new preset assets or a speculative scene registry.
Keep review-object visibility owned by EndpointScene so a later approved scene
selection has an appropriate integration point.

The retained rectangular local path has no stellar source. It receives compatibility
checks only: preserve its existing Full/Shader off behavior and expose No atmosphere
as unavailable with a clear explanation rather than claiming stars are rendered.
Do not add stars to that legacy path. Retain object/elevation controls where its
existing physical path supports them, with explicit unsupported-state handling.

## Baseline and scope

Baseline: local checkpoint 9423a854 activates Corrected60 + Sun-focused k=.35 as
the canonical distant-Sun default. [Promotion status](../../production-algorithm32/caches/sky-accuracy-promotion-status.md)
owns package, rollback and numerical qualification. Preserve that package and its
policy; no atmospheric parameter, cache format, default stellar catalog, exposure,
display model or default physical configuration is changed by this task.
ARM validation and Sky Accuracy Dials remain suspended.

Observed current owners:

- Flat32Application holds the boolean atmosphere choice, ModeController propagates
  it, and Algorithm32Runtime restores direct rendering when false. This drops
  stars along with atmosphere, so another boolean bypass cannot implement the new mode.
- Flat32View owns native controls. EndpointScene already accepts an initial
  reviewObjectsEnabled choice, but needs live visibility and correct shadow/depth
  bookkeeping; its ground, review objects and lighting currently share an owner.
- ATMOSPHERE_OBSERVER_HEIGHT is 5 m and CAMERA_POSITION_SCENE is y=0.005 at
  1000 meters per scene unit. Spherical scene construction and both local
  construction routes currently use the fixed height. Geometry mapping and camera
  placement must be inspected together to avoid applying the offset twice.
- The stellar palette consumer multiplies boundary radiance by view transmittance.
  Compact local composition has its own frame preparer. Both need tracing before
  choosing the smallest common production integration seam.

Likely authored scope: src/flat32 application/view/state/mode/runtime/endpoint
owners, their ambient declarations, stylesheet and existing tests; narrowly
required Algorithm32 shader/composition owners and declarations if the reusable
presentation control belongs there. Use existing product/runtime documentation.
No experimental runtime imports or edits to protected evidence. Generated proof
output goes into new children of .codex-tmp/flat32-sky-scene-controls/.

## M1 - Establish correct independent controls

Purpose: settle the two coupling risks before broad UI work: star rendering
without atmospheric transport and a single physical observer-height authority.
First executable step: capture a clean review-unit baseline, then trace complete
spherical/distant and compact flat/local frame composition and coordinate mappings.

1. Define one explicit render-mode contract and one unit-bearing observer-height
   selection in application state; retain a documented compatibility mapping for
   existing atmosphereShaderEnabled callers and proof harnesses. The old true/false
   behavior remains Full/Shader off. Replace internal duplicated flags with the
   canonical mode rather than accumulating independent contradictory booleans.
2. Map scattering, view extinction, celestial generation/composition, scene-color
   transport, physical ground occlusion and display adaptation to their owners.
   Select a typed runtime presentation control at the smallest correct shader seam;
   keep uniforms and engine details out of UI handlers. Avoid changing medium
   coefficients or rebuilding scattering caches to make the background black.
3. Prove a small actual shader slice in both supported app modes: atmosphere off
   retains finite stellar contributions with no haze and no view extinction.
   Retain ordinary resource ownership, readiness and error handling. Skipping
   atmospheric integration/query work is an optional optimization after correctness,
   not an acceptance gate. Do not promise cache-free startup or a new
   resource-management architecture.
4. Establish where the actual eye position resides. Thread selected height through
   distant scene geometry, compact/local geometry and camera mapping exactly once.
   Inspect shared-cache altitude coverage and local preparation support for 5, 500
   and 2000 m. Distant cache replacement is not expected; reuse local fields when
   their identity/support allows it and let existing owned staging prepare a new
   frame where needed. Never silently clamp height or relabel a 5 m frame.
   ModeController currently rebuilds endpoint geometry only when the mode kind
   changes; explicitly invalidate it on same-kind height changes and stage camera
   and endpoints together, with complete rollback if preparation fails.
5. Verify no-atmosphere display adaptation uses coherent selected-frame inputs;
   stale daylight sky adaptation must not make a valid stellar signal disappear.
   Preserve the selected display/filter policy and report its normal effects; do
   not introduce an arbitrary star gain or exposure correction. Adaptation uses
   coherent selected-mode inputs through existing owners; an adaptation redesign
   is outside this plan.

Evidence: concise ownership/coordinate table, machine-readable altitude/support
witnesses, and the first genuine full/no-atmosphere night pair. The images show
stellar positions/visibility, sky background and ground occlusion, which numeric
state alone cannot demonstrate. Link them when available.
Gate: both runtime paths have a justified production seam, actual stars render,
and all three heights map consistently. A failure holds the affected feature for
scoped repair; it does not authorize a new cache experiment. If a selected height
needs a material new physical model or package family, document the gap and obtain
owner scope direction before expanding. Complete unaffected controls.
Estimate: 40-80 minutes; revise after the composition/coordinate slice.

## M2 - Deliver atmosphere-free celestial rendering

Purpose: make the first requested feature usable through ordinary app controls.

1. Extend the current shader control to Full / No atmosphere / Shader off, with
   labels and state reporting that distinguish all three. Initial Full matches
   current behavior. Do not repurpose atmosphere failures as a selected mode.
2. Apply the mode in both spherical and compact local staging/composition, including
   the ordinary update path, frame publication, restoration and rollback. Preserve
   stellar positioning, sky-vs-object depth tests, ground blocking and Sun behavior.
   No atmosphere uses unity atmospheric transmission and zero atmospheric radiance;
   do not divide an already attenuated result by a near-zero transmission.
3. Restore Full without regenerating immutable offline packages. Reuse existing
   generation/resource owners and avoid duplicate stellar sources, stale uniforms
   or accumulating render passes during repeated cycling.
4. Add focused cases in existing controller/composition and Polylith browser tests:
   legacy true/false mapping, all mode transitions, actual nighttime stars, preserved
   positions, physical occlusion and failure recovery. Compare Full with the unchanged
   baseline at identical observation, view and display settings.

Deliverable/gate: working control and actual Full/No atmosphere/Shader off captures
for a star-rich nighttime case in both geometries, with a daylight smoke check.
Full remains equivalent within the existing applicable numerical/render tolerance;
No atmosphere has a nonzero stellar contribution while Shader off keeps its old
meaning. Report stage timing without asserting that every star must be perceptible
at every normal display exposure.
Estimate: 60-120 minutes, depending on whether one common engine seam covers both paths.

## M3 - Deliver object visibility and physical elevations

Purpose: expose the two remaining independent app controls with coherent frames.

1. Add Objects On/Off through EndpointScene's owned review-object group or a narrow
   equivalent. Retain resources for cheap reversible toggling. Ground and lights
   remain; hidden boxes neither occlude celestial sources nor leave shadow ghosts.
   Refresh static shadow maps when visibility changes. Depth endpoints and visible
   counts must describe the selected scene, not hidden bounds.
2. Add the three elevation presets, with Current explicitly restoring the existing
   5 m value. Ground and boxes stay anchored to the surface. Preserve yaw/pitch,
   field of view, location and absolute observation time as the observer moves.
   Geometric Sun direction/horizon and stellar projection follow each model's
   existing physical mapping, rather than freezing the wrong derived coordinates.
3. Stage physical geometry, camera origin, view bounds, receiver-light evaluation,
   cache lookup and celestial frame consistently. Use existing cancellation and
   frame-boundary publication: rapid 5 m -> 500 m -> 2 km requests cannot publish
   stale work, and failed preparation retains the previous complete observer state.
   Invalidate endpoint geometry on same-kind height changes, publish it with the
   corresponding camera, and restore both on failure. Commit selected labels only
   with accepted state, with pending feedback if needed.
4. Carry all three choices through location/time and geometry changes, context
   restoration and mode rebuilds. Invalidation must distinguish presentation-only
   changes from physical observer changes; do not rebuild an offline cache merely
   because a UI label changed. Update the explicit state merge in
   Flat32Application._commitLocationTimeState so reconstruction does not discard
   these selections. A sky/object toggle made while elevation preparation is
   pending must survive acceptance of that elevation; merge the newest independent
   choices rather than publishing the preparation's stale snapshot.
5. Extend existing tests with actual eye-height round trips, hidden-box shadow/depth
   behavior and one combined transition sequence. Include same-kind height changes,
   location/time reconstruction and independent toggles during pending elevation.
   Use both supported app geometries.

Evidence: matched actual scenes at 5/500/2000 m in both geometries and an objects
on/off pair that shows both object removal and shadow removal. Keep physical
coordinates, accepted selection, cache identity and preparation timings in JSON/text.
Gate: all six geometry/height combinations work, camera and atmospheric eye agree,
objects remain surface-anchored, and independent controls survive replacement.
Do not treat a distant horizon falling below a fixed camera pitch as a rendering bug.
Estimate: 80-140 minutes, with the height mapping and local staging as main unknowns.

## M4 - Qualify and hand off one coherent production change

1. Run relevant local type checks, existing focused unit/controller tests, Polylith
   browser tests and application/Worker builds. Verify ordinary defaults are Full,
   objects On and 5 m; the corrected distant package identity remains unchanged.
2. Cover a bounded combined matrix: both geometries; three sky modes; three heights;
   object visibility; day/night, plus twilight smoke. Use automated state/coordinate
   checks for combinations and representative real captures; do not require an
   exhaustive image gallery for every Cartesian combination. Exercise rapid changes,
   repeated cycles, failed preparation and context restoration, checking resource
   counts settle at the expected steady state for the accepted configuration
   (allowing valid cache retention), and no stale/default state replaces a newer
   choice. Keep legacy rectangular compatibility checks separate from the six
   supported geometry/height acceptance cases.
3. Complete primary self-review. Required production standards review is one stable
   unit under repository Review Timing: changed application controls/state,
   composition/height integration and contracts, plus only required collaborators.
   Trigger: implementation and local evidence stabilized. Question: conformance with
   each affected folder's mapped rules. Completion: required primary/audit evidence
   validates and findings resolve. This is the governing production review, not a
   new experiment review. Current stale reviewer calibration is a known readiness
   dependency; recheck at execution and report incomplete review honestly if blocked.
   Do not silently repair external governance or claim tests substitute for review.
   No additional discretionary review is planned.
4. Finish with one report in the owning execution record: completed behavior,
   screenshots and settings, verified physical heights, timings, tests, review state,
   outstanding limits and checkpoint identity. No remote push or deployment is
   implied. Video scene presets remain explicitly deferred.

Gate: all requested behavior is implemented and evidenced; distinguish functional
completion from any unresolved production-compliance gate. No completion claim
for an unsupported geometry/height. Estimate: 40-80 minutes excluding external
reviewer-infrastructure repair. Total initial estimate: roughly 4-7 hours;
reforecast after M1 using measured scope rather than treating the estimate as a cap.

## Progress, recovery and execution authority

Keep one execution record beside this plan, with a short report at each milestone:
completed work and evidence, observations versus interpretation, limitations and
checks, disposition and next step. Publish useful captures promptly; status and
numeric reports remain text/JSON. Preserve baseline captures and repair only failed
steps in new output children. No blind full rebuild/retry and no experimental test
suite. Use existing production test lanes.

Planning originally authorized this document and its one read-only critique.
The owner subsequently selected M1 for independent execution, including its source
changes, proofs and local checkpoints; M2-M4 and remote publication await selection.
When execution is selected, update the active topic to this plan, refresh
production reviewer context and capture the exact review-unit baseline before code
changes. Keep checkpoint-advisor monitoring independent of reviewer readiness and
consult it at coherent milestones under the applicable commit-authorization policy.

## Plan critique

One read-only create-plan critique was completed by the separate
sky_controls_plan_critique agent on 2026-10-22. It examined goal coverage,
consistency, physical coordinates/composition, verification and unnecessary scope.
All five recommendations were incorporated:

- Explicit same-kind height invalidation, coordinated camera/endpoint publication
  and complete rollback.
- Selection preservation during location/time reconstruction and elevation staging,
  including newer sky/object choices made while preparation is pending.
- A bounded lighting contract: preserve physical receiver lighting and use existing
  adaptation owners without redesigning adaptation.
- Acceptance in spherical/distant and default compact flat/local, with explicit
  unsupported handling for the starless legacy rectangular path.
- Proportional checks: optional query-skipping optimization and configuration-specific
  steady-state resource expectations.

No recommendation was rejected. No implementation was delegated during planning.

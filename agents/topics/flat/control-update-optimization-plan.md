# Flat Earth Elevation And Time Update Optimization

Status: complete under the owner's independent-execution invocation on
2026-11-06. The [execution record](control-update-optimization-execution.md) owns
milestone results, decisions and evidence. Local adviser-recommended checkpoints
are authorized; pushing and deployment are not. Preserve the uncommitted
startup-cache working-tree input and unrelated changes.

## Outcome And Completion

Make ordinary elevation and shared-time edits update the retained Flat Earth
scene instead of reconstructing it. FOV performance is satisfactory according
to the owner; preserve its existing projection/redraw path and test it for
regression only. This is implementation work with an initial measurement and
contract investigation, not an experiment or new product design.

Completion requires:

- After first readiness, supported elevation/time edits retain the canvas,
  renderer, scene, endpoint objects, composer/render targets, shader handle and
  compatible compiled programs, and canonical scattering-cache allocation.
  Frame-specific profiles, transforms, leases and measurement packets may change.
- Recompute necessary physical facts: receiver elevation, source placement,
  geometry/cache transforms, scene lighting, receiver measurement and color
  adaptation. Never substitute stale lighting or reduce sampling/scattering
  quality to obtain a speedup.
- Publish one coherent requested observation and camera height, with correct
  shader bindings and lighting. Preserve independent orientation/FOV/elevation
  in each view and one shared accepted timestamp. Keep the previous complete
  frame on cancellation or precommit failure. Cancelled/invalidated candidates
  cannot publish. Preserve current time-coalescing behavior: a complete in-flight
  intermediate time frame may publish as progress, remain marked preparing and
  report its actual rendered instant until the newest request completes.
- Measured warm edit-to-presentation latency improves against the preserved
  baseline for both elevation and time. Report necessary remaining lighting/GPU
  cost and actual sample counts rather than promising an unmeasured frame rate.
- Genuine structural incompatibility uses a documented rebuild path; ordinary
  supported time/height changes cannot silently fall back to rebuilding.
- Startup cache warming/reuse, resize, retry, context loss, resource cleanup,
  existing local-time entry and degrees-from-closest semantics remain correct.

No UI redesign, FOV optimization, new animation controls, timezone work, changed
physical models, cross-context cache sharing, server work, Flat32 changes or
experiment changes. Existing engineering standards review remains cancelled.
The single plan critique below is not a source standards review.

## Starting Point And Uncertainties

The [Flat entry](README.md) owns current behavior and verification. The
[alternate time note](flat-earth-time-input.md) owns editing semantics. Startup
proof under `.codex-tmp/flat-startup-cache/2026-11-06/` established real cache
reuse and independent comparison contexts. Its approximately 15.5-second cold
construction measurement is not an interactive-update baseline. Existing 119
browser tests and 15 focused frame-controller tests are reusable coverage, not
proof of a future changed implementation.

Source inspection establishes that:

- `FlatEarthSession.setObserverHeight` and shared observation changes enter the
  serial `runtime.prepare` lane. Time updates coalesce; height/location changes
  cancel obsolete work.
- `FlatEarthRuntime._stage` creates a fresh facade, scene/endpoints, composer,
  targets and shader setup. It measures receiver light, pre-renders, checks
  diagnostics, synchronously reads a pixel, and eventually disposes the previous
  scene. Compatible canonical cache resources are already reused.
- FOV changes only update the retained camera and request a redraw.
- `Algorithm32ShaderHandle` retains receiver-program and reduction resources
  within its lifetime. Replacing that handle defeats that reuse opportunity.
- Geometry exposes frame transform uniforms, but frame-cache leases capture
  immutable transforms. `LocalSunFrameController` currently owns whole-frame
  publication/retirement; sharing scene resources between its frames requires
  explicit lifetime ownership so retiring an old packet cannot dispose the
  displayed scene.

The exact latency split and the sufficiency of current public update contracts
are unknown. Do not assume `setConfig` is cheap: it invokes shader building.
Determine which observation-dependent facts affect generated shader structure
and which can be rebound. Do not mutate engine internals or simply reuse a
closure that still captures the old profile/geometry/observation.

## Ownership And Intended Structure

Keep React -> feature view -> controller -> registered models/services.
`FlatEarthSession` coordinates requests and generations; shared configuration
and the animation-loop service retain accepted time. The runtime owns one
long-lived rendering aggregate per canvas. Use an internal collaborator if
needed to separate its retained resources from disposable candidate data;
introduce no duplicate canonical camera/time state.

Engine-owned changes belong under `src/algorithm32`, with ambient public
contracts and focused existing tests. Prefer an additive update capability;
preserve existing consumers' whole-frame preparation/publication behavior,
including Flat32, without expanding this into a consumer migration. App
orchestration belongs under
`src/flat/features/flat-earth`, chiefly `FlatEarthSession`, `FlatEarthRuntime`,
`FlatEarthGraphics`, declarations and existing tests. Keep the workspace generic.

Define a compatibility decision from actual construction identity, shader
structure/binding layout, endpoint topology and context revision. Live time,
source translation or supported receiver height alone are not rebuild reasons.
Rebuild for initial setup, incompatible physical/shader/topology changes, or
renderer recovery. Resize should resize retained targets, not replace the scene.

For compatible updates, prepare candidate physical facts and receiver lighting
without changing the visible aggregate. Through an explicit engine capability,
acquire/rebind the correct live cache transform using the same GPU field. At
commit, install the complete candidate bindings, facade/observation facts,
endpoint lighting and camera height together. Retiring old candidate data must
release only its own lease/packet. Fallible preparation stays before commit;
any fallible installation needs a concrete rollback. After a successful commit,
retirement/cleanup errors are a separate outcome: align the model's accepted
height and rendered observation with the newly displayed frame, then report
cleanup failure without claiming the old frame is still displayed or rolling
back that completed commit. Preserve an actual render of the newly committed
state and truthful requested/rendered identities.

## Milestones

### M1 — Establish Cost And A Safe Reuse Contract

First executable step: capture a new baseline of the current dirty source and
build, then instrument the existing update lane without changing behavior.

- Use the existing real-browser harness approach and a fresh ignored root
  `.codex-tmp/flat-control-optimization/<execution-id>/`. Preserve earlier runs.
  Record source/build identities, viewport, device/GPU/browser, location, exact
  timestamps, elevations and FOV. Tests must exercise the actual production path.
- Time input acceptance, queue wait, profile/support/identity work, scene/shader
  setup/preparation, receiver sampling/reduction/readback, validation render,
  publication and first presentation. Distinguish CPU wall time, GPU measurements
  where available, and end-to-end latency. Do not sum overlapping timings or
  mistake asynchronous render submission for presentation completion. Identify
  the available browser presentation signal first. If display presentation
  cannot be observed directly, report submission, GPU completion where observable,
  and the browser-frame proxy separately with its limitation. Keep measurement
  overhead comparable and distinguish instrumented GPU readback from production
  readback work.
- Count allocations, shader setup/compile requests and real program changes,
  cache construction, render calls and readbacks. Include warm single-view
  elevation/time edits, rapid mixed input, and two-view shared-time updates.
  Separate cold startup/first-use costs from warmed repeated samples. Report
  median/max and counts; add percentiles only with enough samples to support them.
- Trace the public shader/binding, live cache-lease and whole-frame retirement
  contracts. Specify the smallest engine update/lease transaction needed,
  including compatibility, old-resource ownership and failure rollback. Existing
  uniforms alone are not proof that all captured owners can update correctly.
- Set concrete before/after latency targets from these measurements before M2;
  report both absolute and relative changes. Keep these targets and comparison
  conditions fixed; explain any later revised comparison separately.

Deliverable: baseline timing/allocation table and a short contract decision in
the execution record. Advance when dominant repeated work is measured and one
bounded compatible update path has a credible ownership/publication design.
If an existing public API cannot express it, implement the smallest engine
capability in M2. Do not silently accept rebuilding as the optimization.

Estimate: 30–90 minutes plus local build/GPU runs; GPU tooling and ownership
analysis dominate uncertainty. Update downstream estimates from this evidence.

### M2 — Deliver Retained Scene Updates For Both Controls

Depends on M1. Implement and demonstrate a working slice early: one height edit
and one time edit with stable scene/cache/shader identities and correct results.

- Separate retained rendering resources from frame-specific candidate facts.
  Add the public engine operation identified in M1, with precise lifecycle and
  ambient contracts. Do not bypass cache/frame ownership through private fields.
- Rebind live geometry/source/cache-transform uniforms and camera state through
  their proper owners. Refresh facade snapshots, observation identity, depth
  support and endpoint lighting where affected; replace closures that would
  otherwise retain stale geometry or source facts.
- Reuse the shader handle and its receiver programs/reducer. Recompute physically
  affected receiver light and adaptation. If this remains dominant after reuse,
  conditionally optimize program/scratch allocation or redundant measurements
  with exact dependency identities. Record the measured mechanism and bounded
  next change before extending that branch. Do not skip necessary sampling,
  cache approximate lighting, or change scientific precision.
- Keep structural setup/preflight/diagnostics on initial or incompatible builds.
  Avoid repeating scene construction, shader preparation, full preflight draws
  and diagnostic pixel readback on every compatible edit. Distinguish those
  diagnostics from readbacks still needed for actual receiver measurements;
  preserve physical support checks and normal error handling.
- Preparation must not overwrite FOV or pointer-look changes made while lighting
  work is pending. Validate against the latest camera/viewport at commit and
  incorporate current orientation/FOV/size without changing their existing control
  paths. Center on Sun still targets the currently displayed source when invoked;
  a later candidate preserves that resulting camera orientation.
- Preserve latest-request coalescing and cancellation for time, elevation and
  their combination. Identical effective requests should not start more work.
  A queued height edit must not be lost when time changes, and intermediate time
  samples must not build an unbounded queue or starve final publication.
  Preserve the distinction between valid intermediate time progress and
  invalidating height/location cancellation; assert both the actual rendered
  instant and eventual final requested instant.
- Keep the incompatible rebuild path and resource recovery explicit. Maintain
  rollback, pending/accepted height semantics and exact resource release when a
  view closes, the feature stops, or the graphics context is lost.

Deliverable: connected working slice, targeted engine/session assertions and
early before/after timings. Advance when both ordinary control paths retain the
required object/program/cache identities, publish matching physical state, and
improve against M1 without visual/lighting regressions. If churn is eliminated
but latency targets are missed, isolate remaining cost before broad M3 checks;
report the shortfall instead of declaring performance success.

Estimate: 3–6 hours after M1, provisional; transactional engine integration is
the largest unknown. A distinct numerical-method redesign is outside this plan.

### M3 — Verify Responsiveness, Equivalence And Lifecycle

Depends on a stable M2 slice; use existing test lanes and focused additions.

- Verify successful elevation/time updates first, then rapid scrubbing, mixed
  height/time requests, day-boundary/near-horizon observations, invalid or
  unsupported requests, stale completion, injected lighting/publication failure,
  detach/retry/context loss and cleanup. Assert that compatible updates never
  call structural scene/shader/cache construction and that cancelled/failed
  candidates cannot dispose or partially change the displayed aggregate.
- Exercise one view and two independent cameras at different elevations/FOVs.
  Both views must eventually show the final shared timestamp while each keeps
  its own height/orientation. Recheck FOV/pointer look/resize, startup warming,
  shared editor precision and missing-location behavior without redesigning them.
  Include FOV, pointer look, resize and Center on Sun during pending time/height
  preparation. Verify latest camera/support/depth facts at publication and the
  separate outcomes of precommit failure and post-commit retirement failure.
- Repeat M1 comparisons under matching warm/cold conditions. Report end-to-end
  latency, stage costs, program/cache build counts, allocations and resource
  stability over repeated edits. Verify the final requested state is actually
  rendered, not merely accepted by the clock or submitted to the GPU.
- Compare equivalent completed physical states against the preserved baseline.
  Compare receiver spectral packets, illuminance/adaptation values, source
  placement and representative cache-transform results numerically, in addition
  to images, so stale bindings cannot pass on visual similarity alone.
  Inspect actual scene images for sky/ground color, horizon placement and Sun
  positioning where visible; these images establish appearance, not timing.
  Choose numeric/pixel comparison tolerances from existing contracts and baseline
  repeatability before evaluating the candidate. Keep timings/tables in JSON/CSV
  and Markdown, not pictures of reports. No new comps are needed.
- Run client/engine type checks, the Flat browser lane and affected focused engine
  tests, plus a normal Flat build and formatting/whitespace checks. Expand testing
  only for changed contracts or unresolved failures. Existing unrelated server
  and scientific suites need not be repeated automatically.

Deliverable: final implementation report, actual visual comparisons, performance
table and targeted correctness/resource evidence. Complete only with retained
resources, correct coherent results and demonstrated latency improvement for
both controls. Disclose any remaining unavoidable receiver/rendering delay or
unmet target; propose a separately bounded follow-on if needed.

Estimate: 1–3 hours plus browser/GPU time, revised after M1/M2. No new test
framework, coverage target or engineering review pipeline is introduced.

## Evidence, Recovery And Resumption

On execution, create one `control-update-optimization-execution.md` beside this
plan. Maintain current milestone, completed work, findings, decisions, artifact
links, next action and outstanding verification. Each milestone closes with a
concise report of deliverables, observations versus interpretation, limitations
and disposition/next action. Link useful early timing and working-slice evidence
as it becomes available. That record also owns the overall final report.

Preserve the startup-cache working tree and original evidence. Reuse prior
checks only for unchanged source/contracts and their recorded claims. After an
interruption, reload active-topic, this plan and its execution record; resume
from the recorded next action rather than repeating completed milestones.
Diagnose and retry only affected failures, retain prior results, and avoid blind
whole-suite repeats. Estimates are guidance, not arbitrary stop/approval gates.

M1–M3 are complete; the execution record owns outcomes and final evidence.
No extra owner decision was required for ordinary
choices already covered by these milestones. No additional source reviews are
requested; existing owner cancellation remains in force.

## Plan Critique

One read-only critique by `control_optimization_plan_critique` on 2026-11-06
found the scope and retained-resource approach coherent and recommended five
clarifications. All were incorporated: preserve valid intermediate time
publication while rejecting cancelled candidates; separate committed cleanup
errors from rollback failures; cover camera/resize/Sun-centering interactions
during preparation; compare physical lighting/transform values numerically; and
identify an achievable presentation signal with explicit proxy limitations.
No suggestions were rejected. The primary checked the revised milestone sequence
and authority boundary; no implementation, profiling or source review was run.

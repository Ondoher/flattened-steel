# Flat Earth Control Optimization Execution

Status: M1 and M2 complete; entering M3 under the owner's independent-execution invocation on
2026-11-06. The [plan](control-update-optimization-plan.md) owns scope and gates.
Engineering standards review remains cancelled. Local checkpoints with adviser
messages are preapproved; pushing and deployment are not authorized.

## Current State And Resumption

M1 preserved 448 source files plus the dirty diff and an isolated build. M2 now
retains scene/facade/shader/targets and passes the first full GPU comparison.
Next: M3 pending-interaction, cancellation, failure/rollback, context recovery
and final verification. Evidence root:
`.codex-tmp/flat-control-optimization/2026-11-06-01/`.

## Decisions

- Preserve all uncommitted startup-cache implementation as the execution input.
  Keep unrelated `.prettierignore` and `transfer/` changes outside checkpoints.
- Use one execution record for milestone reports and the final report. Do not
  restart plan critique or engineering reviewers.
- Keep completed intermediate time frames as valid progress during continuous
  time changes; invalidating height/location changes cancel obsolete work.
- FOV is regression coverage only. Sampling/scattering accuracy and receiver
  lighting remain unchanged.
- Add an engine-owned observation preparation entry that derives a live profile
  from the active canonical entry and raw observation/elevation. This avoids
  reconstructing and revalidating the same canonical topology several times per
  edit, while keeping ordinary `prepareLocalFrame` behavior for existing callers.
  Candidate profiles still receive physical/support validation and mutation
  checks at publication. No private engine state is accessed by app code.
- Keep one runtime-owned scene/facade/shader aggregate. Prepared frame packets
  borrow it through explicit reference ownership; frame retirement releases the
  packet lease, not the displayed scene. A stable engine cache-binding adapter
  switches between compatible frame leases at commit without taking their
  disposal ownership. The shader gets live transform/dome uniforms from owners.
- Stage a compatible facade observation/config update without rebuilding shader
  resources. Measure the candidate receiver against its own geometry and lease;
  commit model facts, bindings, lights and camera height together, with rollback
  before publication. Post-commit retirement errors retain truthful new state.
- Performance acceptance fixed before M2: at least 50% lower warm median browser
  frame-proxy latency for each control versus the samples below, with no new
  scene/handle/targets or compatible program/cache construction per edit. First
  use of another supported elevation must not compile a new height variant.
  Preserve physics; source/direct/transform values use 1e-10 relative/absolute
  tolerance, GPU-derived light/adaptation 1e-6 relative plus 1e-10 absolute, and
  equivalent captures max one 8-bit channel step (record all differences).

## Milestone Reports

### M2 — Complete

The [candidate report](../../../.codex-tmp/flat-control-optimization/2026-11-06-01/candidate-fast/report.json)
and [comparison](../../../.codex-tmp/flat-control-optimization/2026-11-06-01/candidate-fast/comparison.json)
show stable scene/composer/handle/targets with zero new compatible programs for
height/time edits, including the first switch to 40 km. Warm frame-proxy medians
are 262.6 ms for elevation (65.5% lower than 761.8 ms baseline) and 261.85 ms for
time (64.5% lower than 736.7 ms). Two-view time is about 575 ms versus 1591 ms.
These are small local sample sets, not frame-rate or physical-display guarantees.

Across 20 corresponding frame snapshots, source/transform/observation values
match exactly. GPU-derived lighting/adaptation has maximum relative difference
5.22e-7, within the fixed 1e-6 tolerance. Three captures have maximum channel
difference 1/255, affecting respectively 1, 20 and 6 of 3,520,000 channels.
The remaining 30 readbacks per update are physical receiver sampling/reduction;
the repeated diagnostic readback and scene preflight were removed from updates.

Types, 119 Flat browser tests, 16 focused frame-controller tests, 93 facade/handle
tests and 29 geometry tests pass. The source-local Sun generator now rebinds its
physical source/geometry while retaining its programs; it was necessary to keep
the existing visible Sun capability rather than dropping it from the update path.
Two initial pilot failures (initial facade capture and an initially too-narrow
celestial compatibility check) remain preserved in their separate pilot folders.
Disposition: advance to M3. Failure/pending-interaction checks remain open.

M2 pilot: `candidate-pilot3/progress.json` demonstrates stable handle/scene/target
identities and zero program creation on ordinary height/time edits, including
40 km. Warm latency is still roughly 0.4–0.5 seconds, above the fixed 50% target.
Dominant remaining cost is repeated profile validation inside the candidate
facade path. Source/direct/transform checks match; small diffuse differences are
within the preselected GPU tolerance so far. Preserve this pilot separately.

Authorized refinement: extract an engine-internal prepared-model constructor so
the owned observation path can validate its newly derived compact profile once
and build the facade snapshot directly. Retain public full configuration ingress
checks and the frame controller's post-stage/publication mutation checks. The
canonical profile is private to its cache entry and need not be revalidated as
if newly supplied by an external caller on every observation derivation. This
removes repeated work without an unchecked app bypass or numerical change.

### M1 — Complete

[Baseline report](../../../.codex-tmp/flat-control-optimization/2026-11-06-01/baseline/report.json)
and progress trace retain all stages and GPU counters, environment and sample
states. Five warmed height samples (after the first new-height variant) and six
time samples are the comparison set. First new height and 40 km cost about
4.8/4.7 seconds; ordinary warmed requests cost roughly 0.7–0.8 seconds.
Two-view time took about 1.59 seconds to the frame proxy. Each edit created a
new scene/composer/handle and made 31 GPU readbacks. New heights compiled two
programs, while repeated time edits reused Three's program cache but rebuilt
the surrounding scene and handle.

The dominant warm cost is repeated physical-profile identity checking and
profile/canonical reconstruction: one representative time edit accumulated
about 479 ms in nested profile assertions, versus about 30 ms for receiver
measurement. These timings overlap their callers and must not be summed.
New-height shader preparation and receiver-program compilation explain the
multi-second first-use spikes. Dome center/radius currently enter shader source
as constants and must become live uniforms without changing their equations.

Presentation is measured as scene-ready observation followed by two browser
animation-frame callbacks, not physical display latency. Instrumentation has
matching overhead in later comparison runs; no separate GPU duration is claimed.
The baseline used local Chrome/ANGLE and a 1100x800 viewport, recorded in JSON.
Disposition: advance with the ownership and performance decisions above. M2 is
next; M3 has not begun. Estimates remain provisional until the first live slice.

## Verification And Checkpoints

Checkpoint `c9808d6b` preserves the startup-cache implementation and M1 baseline
using adviser message `feat(flat): reuse startup graphics cache for first view`.
The unrelated `.prettierignore` and `transfer/` changes remain outside commits.
M2 checkpoint advice and M3 verification are next. Earlier startup-cache evidence
is retained separately and is not a performance baseline for these edits.

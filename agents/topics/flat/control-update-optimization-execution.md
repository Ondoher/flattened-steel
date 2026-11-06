# Flat Earth Control Optimization Execution

Status: complete. M1–M3 were executed under the owner's independent-execution
invocation on 2026-11-06. The [plan](control-update-optimization-plan.md) owns scope and gates.
Engineering standards review remains cancelled. Local checkpoints with adviser
messages are preapproved; pushing and deployment are not authorized.

## Current State And Resumption

The application retains scene/facade/shader/targets/cache for supported
elevation/time updates. All required implementation and verification milestones
are complete; no further optimization or feature work is automatically selected.
The final report below owns current results and limitations. Evidence root:
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

### M3 — Complete And Final Report

[Final performance/physical comparison](../../../.codex-tmp/flat-control-optimization/2026-11-06-01/final/comparison.json)
and [live lifecycle results](../../../.codex-tmp/flat-control-optimization/2026-11-06-01/final-lifecycle2/behavior-report.json)
complete the plan. Ordinary edits retain the canvas, scene/endpoints, renderer,
facade/shader handle, composer/targets, compatible programs and canonical field.
Geometry, live cache transforms, source/Sun placement and receiver light remain
coherent. FOV uses its original projection/redraw path. Actual physical sampling,
precision, N4 scattering and the alternate time editor's meaning are unchanged.

| Warm control | Baseline frame proxy | Final comparison | Reduction |
| --- | ---: | ---: | ---: |
| Elevation | 761.8 ms | 263.5 ms | 65.4% |
| Time | 736.7 ms | 269.7 ms | 63.4% |

The comparison has five warmed elevation and six time samples at 1100×800 on
Chrome/ANGLE with the local RTX 2060; no p95 or physical-display latency claim
is made. First new-height compilation spikes of roughly 4.7 seconds are absent:
the first 40 km edit in the final comparison took about 260 ms. Two-view time
took about 557 ms versus 1591 ms baseline. Remaining work per edit includes
physical-profile identity checks and exact receiver sampling/reduction with 30
readbacks; this is not a promise of continuous 60 fps animation.

Across 20 paired frame snapshots, observation/source/transform values match
exactly; GPU-derived lighting/adaptation differs by at most 5.22e-7 relative,
within the predefined 1e-6 tolerance. Actual initial/high-elevation/comparison
captures differ by at most one 8-bit channel step, affecting 1, 14 and 6 of
3,520,000 channels. The timing run preceded final failure-only cleanup/rollback
guards; the separate lifecycle build exercises those final branches and the
same retained update path. Reports retain exact bundle hashes for their claims.

Twelve real-browser lifecycle cases pass: native pointer look, FOV, Center on
Sun and resize while preparation is held; mixed height/time invalidation;
identical-input no-op; receiver failure and retained recovery; failure after an
actual candidate render with previous-image redraw; truthful new state following
post-commit cleanup failure; unsupported physical elevation; near-horizon and
UTC-day-boundary source placement; comparison close during pending measurement;
real WebGL loss/restoration with Retry; and final complete resource release.
The rollback image comparison has maximum channel difference zero.

The failure pilot found that a rejected installation's prepared packet was kept
until the next request. The runtime now cancels/discards that candidate after
rollback, outside the controller's installation callback. Its resource borrow
returns immediately to one. Preserved failed runs remain under `final/` and
`final-lifecycle/`; the latter also preserves an overly specific harness error
text assertion, corrected to check cleanup semantics and committed state.
Retained facade rollback now rejects a stale generation, and all retired facade
owners receive cleanup attempts even when one owner throws.

Verification: both type checks and the normal Flat build pass; 121 browser
specifications, 18 frame-controller/retained-transaction specifications, 93
facade/handle specifications, 29 geometry specifications, six Sun-generation
specifications and 18 shader-builder specifications pass. Formatting and
whitespace/link/evidence checks pass. Required cases have no deferred tests.
Unchanged server suites and unrelated full scientific qualification were not
rerun. Engineering standards review remains owner-cancelled; this is primary
self-review and runtime evidence, not independent standards certification.

No further numerical-method or receiver algorithm branch was needed. The
remaining measured cost is recorded rather than hidden by stale-light reuse or
reduced quality. Use this record to select any later animation/latency work;
this execution does not authorize that follow-on or deployment.

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
Checkpoint `edc1963a` preserves M2 using adviser message
`feat(flat): retain scene resources during control updates`. The final M3
checkpoint hash/message and total observed wall time are saved in the
[handoff receipt](../../../.codex-tmp/flat-control-optimization/2026-11-06-01/handoff.json)
after checkpoint creation. This wall time includes implementation, tool/build/GPU
waits and recovery; it is not pure reasoning or GPU execution time. Earlier
startup-cache evidence remains separately preserved.

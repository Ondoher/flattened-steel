# Flat Earth Control Optimization Execution

Status: M1 complete; entering M2 under the owner's independent-execution invocation on
2026-11-06. The [plan](control-update-optimization-plan.md) owns scope and gates.
Engineering standards review remains cancelled. Local checkpoints with adviser
messages are preapproved; pushing and deployment are not authorized.

## Current State And Resumption

M1 preserved 448 source files plus the dirty diff and an isolated build. No
optimization source has changed yet. Next: implement the retained scene and
engine-owned observation transaction described below, then demonstrate one
height and one time update before expanding verification. Evidence root:
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

New optimization checks and checkpoints pending. Earlier startup-cache evidence
is retained separately and is not a performance baseline for these edits.

# Owned-content Cleanup Execution

Status: M1–M5 complete for the [plan](owned-content-cleanup-plan.md) under the owner's
independent-execution request on 2026-11-08. Local adviser-recommended checkpoints
are authorized for this work; pushing/deployment are not. Existing uncommitted
input remains preserved in `.codex-tmp/owned-content-cleanup/starting.patch` and
`starting-untracked/`, with HEAD/status and the built baseline recorded beside it.

## Current Position

- M1–M4: complete, with owned-path counters and boundary regressions passing.
- M5: numerical/images, configured checks, latency comparisons and regression
  investigation complete. All eight outcome rows in the plan are resolved.
- Next: owner-selected application work. No required implementation or verification
  remains for this cleanup.

## Decisions

1. Keep accepted stellar facts in a source-keyed private WeakMap populated by
   constructor-owned acceptance, after a one-time copy of nested catalog inputs.
   Generic providers continue through ordinary acceptance; a new source or basis
   cannot inherit another owner's accepted facts. Retain the exact identity facts
   and serialization; initial execution hashing remains unchanged.
2. Use internal underscore methods for typed, owned collaborators rather than
   a caller-controlled validation switch. External APIs keep genuine acceptance.
   The frame adapter must explicitly return an owned constructed aggregate;
   observation ownership alone does not establish callback output ownership.
3. Reuse the real pointer/GPU probe, extending it with physical snapshots and
   paired captures before source changes. Its built bundle is preserved, so
   baseline browser collection can finish while source implementation proceeds.
4. Receiver controllers can start pending without a dark publication when there
   is no initial identity. Candidate facade construction receives the completed
   measurement directly; generic initial-direct publication remains available.
   Typed internal sampling/reduction/calculation methods consume the same immutable
   packet array. The transport and GPU reduction validate newly computed numeric
   results; consumer metadata acceptance remains on external methods.
5. `LocalSunFrameContents` constructs celestial facts from the accepted request
   and completed light, alongside preflighted operations. Only this constructed
   aggregate is trusted at staging/publication, independently of profile ownership.
   Generic callback aggregates retain content and mutation checks. Identical
   observation references skip geometry equality hashes; different external
   observations retain semantic matching/mismatch detection.
6. A slower Shader off sample set triggered a bounded reverse-order investigation:
   candidate then baseline, twelve samples each, CPU profiler disabled. This tests
   whether the adverse timing repeats without altering rendering or introducing
   another optimization. The slowdown did not reproduce. Preserve the initial
   result and report both comparisons; do not select only favorable measurements.

## Milestone Evidence

M1: constructed sources own copied inputs and retain accepted catalog facts.
All 24 measured candidate updates have zero member scans; altered external input
and incompatible-basis tests pass. Initial execution identity serialization is
preserved. No constant-time claim is made for that initial hashing.

M2: completed receiver light is consumed directly. Per-view measured combinations
are 4 -> 1, immediately replaced dark publications 2 -> 0, adoption rebuilds
1 -> 0, and receiver-input scans 12 -> 0. The direct-publication API retains its
initial behavior for generic callers. Six receiver-controller tests pass,
including exact measurement reuse and pending initialization.

M3: the owned sampler's immutable packet array reaches reduction and sky median
without packet metadata acceptance in either consumer. New transport/reduction
numeric values retain finite/nonnegative checks at computation. Generic provider
cardinality/basis acceptance remains. GPU transport/parity tests pass, including
Flat/local N4's complete 32-by-15 batch. One new negative test initially omitted
required packet provenance; its fixture was corrected and its focused rerun
passed. Preserve both the failed log and successful rerun. The other 11 affected
GPU tests passed in the original run and their production source is unchanged.

M4: the constructed frame aggregate skips content/mutation revalidation; generic
callback aggregates remain checked even for engine-created observation profiles.
Measured owned frame-content validations are 2 -> 0, live-frame identities 3 -> 1,
and stellar observation-equality hashes 8 -> 0 in Full per view. Geometry still
constructs its new contribution identities; those are not equality rechecks.
All 20 frame tests and geometry external-observation regressions pass. No mutation
rejection promise was removed from generic callbacks.

## Integrated Verification

The final configured engine suite passes all 705 tests in 121.4 seconds.
Engine/app types pass; Flat's normal Polylith/Karma lane passes all 224 browser
tests. The production build passes. The targeted Three/Karma lane has 11 passing
receiver/stellar tests plus the corrected external-batch case passing separately;
24 unrelated GPU cases were filtered out. No test bundling was modified.

`candidate-02/physical-comparison.json` compares 24 warmed updates, three lighting
observations and four heights against preserved baselines. CPU facts and physical,
construction/execution identities match exactly. GPU-derived diffuse/total and
adaptation fields differ by at most 1.866e-7 relative in warmed updates. Two
independent baseline runs already differ by up to 1.712e-7. The pre-evaluation
`numeric-tolerance.json` selects 4.768e-7 relative (four float32 epsilons, at least
twice baseline variation) plus Number.EPSILON absolute, restricted to those
GPU-derived fields. There are no comparison failures. Dynamic generation-based
light identity strings are excluded from value equivalence; physical identity
strings remain exact.

The actual scene pixels match exactly in three paired captures at 0/90/150
degrees. All changed pixels in whole-app screenshots lie inside the slider thumb
(a 14–15-pixel-wide area) and inside the original repeated-baseline variability
mask. No scene pixel differs. See `candidate-02/image-comparison.json`; the first
candidate's whole-app captures were pixel-identical as well. Captures were
inspected for sky, ground, horizon and visible celestial content.

Global packet assertions drop from 4,150 to 17 per warmed view; basis assertions
from 8,382 to 269. These residual counts include new value construction and live
source acceptance; they are not claimed to be zero. Per-path counters confirm
zero metadata assertions in the owned combination, reduction and median consumers.

## M5 Performance And Final Report

Completed all identified cleanup while preserving physical/rendering behavior,
external-input boundaries and publication/resource handling. No numerical quality,
spectral basis, hemisphere sample count, cache dimension or GPU program variant
was changed. Startup, missing-location, cancellation, stale work, independent view
records, height/time coalescing, retry/context loss and retirement failure are
covered by the passing existing frame/app suites. Real-app runs also exercise
the four rendering configurations, comparison views and independent heights.
The full unrelated Flat32 UI/server and scientific qualification campaigns were
not rerun; shared spherical/stellar contracts are covered by the engine suite and
affected GPU tests. No agreed verification is deferred.

Separate lightweight timing runs omit the detailed assertion counters. Each row
has six warmed actual MUI time edits, Chrome 156/RTX 2060, 1100-by-800 viewport,
San Jose coordinates and fixed June 2024 observation inputs. Cold setup is
excluded. Values below are median frame proxy milliseconds (range):

| Configuration | Preserved baseline | Candidate |
| --- | ---: | ---: |
| Full, one view | 159 (145–203) | 140 (125–154) |
| No atmosphere | 136 (121–146) | 137 (111–192) |
| Shader off | 145 (128–228) | 178 (162–190) |
| Full, two views | 259 (247–262) | 263 (226–282) |

Full's retained runtime preparation falls from 136 to 111 ms median. This is a
local sample, not a universal speedup. Shader off's initial adverse result
coincides with median readPixels time rising from 24 to 70 ms despite identical
GL operation counts. The reverse-order, profiler-disabled follow-up has twelve
samples per implementation: frame proxy 150 ms baseline vs 137 ms candidate;
runtime preparation 126 vs 111 ms. GPU readback medians are 27 vs 31 ms. The
initial slowdown did not reproduce; readback variability limits attribution.
See `shader-off-followup.json` and both original timing reports. All results are
retained, including the unfavorable first comparison.

Six warmed independent height edits per preset, with the second view retained
at 5 m, give these median frame proxy milliseconds:

| First-view height | Baseline | Candidate |
| --- | ---: | ---: |
| 100 m | 143 | 130 |
| 500 m | 138 | 142 |
| 2,000 m | 138 | 136 |
| 5 m | 131 | 129 |

Every measured warm time/height edit compiles zero shaders, creates zero
programs, and enters no canonical cache construction. Readbacks remain exactly
30 per prepared view (60 for a shared-time edit in two views). All detailed
samples display the requested timestamp; height samples retain the independent
second-view height. Scene/cache/program lifetimes are preserved. These are
post-preparation two-animation-frame proxies, not physical display latency or
FPS claims. Method timers remain in both runs; broad timing runs also use CPU
profiling, which is disabled for the focused follow-up.

The major remaining Full-mode work is initial live-profile construction
(about 58 ms median) and receiver preparation (about 33 ms, including GPU
synchronization), followed by facade/publication/draw work. Those operations
create new physical state; they were not removed or replaced by stale results.
Initial execution identity hashing still serializes retained member facts.

Final evidence under `.codex-tmp/owned-content-cleanup/`:

- `performance-summary.json`: samples, ranges, phase timings and resource/timestamp
  assertions, with `baseline-timing/` and `candidate-timing/` raw reports.
- `baseline/`, `baseline-02/`, `candidate-01/`, `candidate-02/`: source-bundle identity,
  per-path counts, numerical snapshots and paired/repeat captures.
- `numeric-tolerance.json`, `candidate-02/physical-comparison.json` and
  `candidate-02/image-comparison.json`: declared numerical tolerance and actual
  physical/image equivalence findings.
- `final-engine-types`, `final-app-types`, `final-engine-tests`, `final-app-tests`,
  `final-build`, `final-gpu-tests`, `corrected-external-batch-test` logs/results,
  plus scoped `final-format-check.log`. Types, build, 705 engine tests, 224 app
  browser tests and all twelve selected GPU cases pass as described above.
- `starting.patch`, `starting-untracked/` and `starting-head/status`: preserved
  worktree input. Original audit/profile evidence remains untouched.

All browser profiles and Karma temporary browser directories are removed after
their runs, including failures. No cookies/cache/profile data is retained as
evidence. Standards reviewers remain cancelled; no independent compliance result
is claimed. The earlier single plan critique and checkpoint advice are distinct
from these self-checks.

## Checkpoints And Handoff

Adviser-recommended implementation checkpoint:
`398173ad21be39b22a0a80ccedfe12d049485ede` —
`perf(algorithm32): reuse owned observation content`.
It includes the coherent engine/runtime unit and its ownership records, including
the earlier related full-profile removal. Existing neutral ambient, slider,
visible-label and owner-authored transfer changes were excluded and preserved.
Nothing was pushed or deployed. Final verification documentation is a separate
checkpoint; the checkpoint ledger under the evidence root records its identity.

The current task is complete. Resumption requires no recovery step: reload the
active topic and select the next application task. New performance work can use
the remaining-cost measurements without reopening experiments or rebuilding
historical evidence.

## Evidence And Recovery

All new diagnostics live below `.codex-tmp/owned-content-cleanup/`. The setup
helper initially hit sandbox child-process `EPERM`; the authorized escalated run
succeeded. Browser execution uses a disposable profile removed in `finally`.
Historical audit/profile runs remain untouched. Standards reviewers remain
cancelled; the primary owns self-review and types/tests. Existing checkpoint
adviser monitoring remains active independently.

# Owned-content Cleanup Execution

Status: executing the [plan](owned-content-cleanup-plan.md) under the owner's
independent-execution request on 2026-11-08. Local adviser-recommended checkpoints
are authorized for this work; pushing/deployment are not. Existing uncommitted
input remains preserved in `.codex-tmp/owned-content-cleanup/starting.patch` and
`starting-untracked/`, with HEAD/status and the built baseline recorded beside it.

## Current Position

- M1–M4: complete, with owned-path counters and boundary regressions passing.
- M5: numerical/images and configured engine/app/GPU checks complete; separate
  lightweight latency runs and final handoff/checkpoint documentation remain.
- Next: run matching baseline/candidate latency samples, summarize remaining cost
  and finish the final report. No implementation blocker remains.

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

## Integrated Verification So Far

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

## Evidence And Recovery

All new diagnostics live below `.codex-tmp/owned-content-cleanup/`. The setup
helper initially hit sandbox child-process `EPERM`; the authorized escalated run
succeeded. Browser execution uses a disposable profile removed in `finally`.
Historical audit/profile runs remain untouched. Standards reviewers remain
cancelled; the primary owns self-review and types/tests. Existing checkpoint
adviser monitoring remains active independently.

# Distant-Sun Recording Strobing Experiment Plan

## Acceptance Gate

A candidate passes only when it removes recurring cache-aligned brightness
reversals from lossless source frames and the owner-visible recording,
preserves coherent atmosphere and scene lighting, reaches exact cache
endpoints, introduces no visible blur or new temporal artifact, and fits within
the qualified dual-atlas resource budget.

## Checkpoint Authorization

For the duration of this experiment, the owner authorizes the primary agent to
execute `$check-point` whenever the checkpoint adviser returns
`CHECKPOINT_RECOMMENDED` or `CHECKPOINT_URGENT` for the current repository state.
All suggested commit messages are preauthorized; present the message and scope
for visibility, then proceed without a separate message-approval round.

This explicit authorization supersedes the skill's per-message acceptance
pause and persists across resumed sessions until the experiment closes or the
owner revokes it. The skill's complete-repository scope, snapshot inspection,
drift checks, required validation, and post-commit verification remain in force.
If the snapshot changes, update its review, scope, and message under this same
authorization before committing. Refresh current-state documents before each
checkpoint. Pushes and history rewrites require separate authorization.

`NOT_READY` does not trigger a commit. Continue milestone-based work and
event-driven adviser evaluation under the repository's review timing policy.

## Autonomous Execution

The owner is away and authorizes independent implementation and execution.
Use best judgment for routine decisions, revise this plan when evidence
warrants it, and record material changes and their reasons in the design and
status. Continue independent work when owner inspection is pending, retaining
that acceptance gate explicitly; do not claim owner approval. Real-time
capture and performance qualification are outside this experiment. The owner
authorizes running through the entire experiment until the strobe is fixed,
using the strongest recommendation for uncertain decisions. If a fatal cache
design flaw prevents a sound correction, alternate cache representations may
be tested within this experiment. Experiment-local npm modules are authorized.

## Verification Strategy

Limit credit usage during this experiment by concentrating development
verification on representative positive cases: the supported control sweep,
successful synchronized capture and encoding, the intended cache transition,
and the selected correction's measured and visible result. Cache crossings
that reproduce the strobing are central acceptance cases and remain part of
these focused checks.

Defer broader edge-case exploration, malformed-input checks, fault injection,
and recovery-path verification until P4 final cleanup. Keep a concise list of
deferred checks in the status document as concrete cases arise; do not build
an exhaustive speculative failure matrix during iteration. Address observed
failures that block the control, correction, or trustworthy evidence when they
occur.

Use the smallest proof that answers the current decision and reuse valid
results from unchanged code and inputs. Repeat or broaden execution when a
change, observed failure, or unresolved acceptance question justifies it.
Batch reviewer work at the milestones below. Local type checking, required
types review and independent audit, containment and parent-evidence protection,
provenance, and the declared acceptance measurements remain in force.

Final cleanup verifies the relevant deferred cases against the settled
implementation using focused proof runners, resolves material defects, and
records any remaining limitations before final acceptance.

## Review Milestones

Apply the repository's [review timing policy](../../../../../AGENTS.md#review-timing)
at three stable implementation boundaries:

1. Review the completed P0-P1 control, capture, and measurement harness as one
   coherent unit after local type checking and short proofs pass. Both phases'
   implementation-completion gates remain open until review validates.
2. Review the settled P2 correction and changed contracts after the bounded
   candidate comparisons. The session agent-thread limit currently blocks
   reviewer execution. Under the owner's instruction to continue the whole
   experiment autonomously, scientific full-animation generation may proceed
   after local checks pass while every standards-completion gate stays open.
   Intermediate candidate edits and diagnostic renders remain within that unit.
3. Review any new or changed P3-P4 recording or verifier implementation once
   it stabilizes. If qualification only executes already-reviewed code, verify
   evidence freshness and run results without another source pass unless the
   review contract requires it.

Capture a baseline before each unit begins. Every required pass retains its
complete mapped-rule inventory, independent audit, and mechanical validation.
At final handoff, confirm coverage and current validity; request fresh review
where source, dependencies, contracts, or governing context invalidated prior
evidence. Keep scientific and owner-inspection gates throughout candidate work.

## P0 — Pin The Control

- [x] Authenticate the accepted creative film, diagnosis run, diagnosis artifact
      set, and every reused trace or frame.
- [x] Record the current cache package, application build, browser, GPU,
      renderer, codec, resolution, cadence, camera, exposure, and playback path.
- [x] Choose the shortest fixed-camera solar-zenith sweep that crosses enough
      one-degree boundaries to reproduce the measured pattern.
- [x] Pin region masks and quantitative gates before evaluating candidates.
- [x] Add progress reporting for every operation expected to exceed one minute.
- [x] Type-check all authored experiment JavaScript through the local
      `jsconfig.json`.
- [ ] Obtain required types-standard reviewer readiness and validated review
      evidence through `review-standards` for each implementation phase, following
      the repository's contained-experiment verification policy.

Gate: the control is deterministic, provenance-complete, and capable of
distinguishing cache-boundary reversals from the authored sunrise/sunset ramp.

## P1 — Separate Rendering From Recording

- [x] Capture lossless pre-encode frames with per-frame cache and scene traces.
- [x] Encode that exact image sequence offline with the target recording
      settings.
- [x] Capture the same control through the original deterministic recording workflow.
- [x] Decode both recordings and align their frames and timestamps to the
      lossless sequence.
- [x] Compare full-frame and regional adjacent-frame change, temporal
      curvature, strongest-event ranking, dropped or duplicated frames, and cache
      event correlation.

Gate: identify the earliest stage containing each recurring reversal. If the
lossless renderer frames are discontinuous, correction proceeds at the cache
transition. If only a later stage introduces the artifact, constrain P2 to
that stage and retain the renderer unchanged.

## P2 — Evaluate Bounded Corrections

- [x] Retain hard publication as the unchanged control.
- [x] Test whether bracketing cache views differ at an identical instant. They
      are byte-identical in `00005-cache-ablation`; blending cannot correct the
      shared-field oscillation.
- [x] Regenerate the same cache representation with stable surface roots, then
      evaluate the complete field and recorded control before any broader fallback.
- [x] Rule out publication identity as the cause using identical-instant
      cache views; a publish-time crossfade is unnecessary for this shared field.
- [x] Reject cache candidates that hide the discontinuity through unrelated exposure changes,
      need a third decoded atlas, exceed the admitted byte budget, or desynchronize
      atmosphere and source direction.
- [x] Record transition duration or angular width, interpolation quantity,
      endpoint behavior, resource use, and failure policy for every candidate.

Gate: select the smallest correction that meets the quantitative target in all
regions, produces no recurring cache-aligned reversal among the strongest
events, and reaches exact endpoints without oscillation, lag, or incoherence.

## P3 — Qualify The Recording

- [x] Repeat the synchronized lossless, offline-encode, and original-recording
      evidence paths with the selected candidate.
- [ ] Inspect native application playback and the encoded recording separately
      at their intended resolution and cadence.
- [x] Verify frame count, presentation timestamps, codec settings, hashes,
      provenance, and the absence of dropped or duplicated frames.
- [x] Compare the selected candidate with the control at cache crossings and at
      stable non-boundary intervals.
- [x] Retain and deliver control and candidate diagnostic animations, both
      recording paths, and synchronized comparisons under the
      [diagnostic animation contract](design.md#diagnostic-animation-deliverables).
- [x] Once the short-control checks pass and the problem appears fixed,
      regenerate the accepted **The Hours** animation with the selected correction
      under the [full animation qualification contract](design.md#full-animation-qualification).
- [ ] Verify the full film and matching choreography, retain its comparison
      evidence in a new experiment run, and provide the film path for owner
      inspection alongside the immutable original.

Gate: automated measures pass, the recurring flash is absent at normal
playback speed, and neither native rendering nor recording shows a new temporal
or spatial regression. The required full animation has been generated,
verified, and owner-inspected under the design's qualification contract.

## P4 — Verify And Decide

- [x] Run a read-only verifier against the sealed candidate run.
- [x] During final cleanup, run the relevant deferred edge-case and failure-path
      proofs against the settled implementation, resolve material defects, and
      record remaining limitations under the verification strategy.
- [x] Authenticate every evidence artifact and the complete derivation chain.
- [x] Finalize the run as accepted, rejected, failed, or interrupted.
- [x] Record the selected or rejected mechanism and remaining limitations.
- [x] Provide the artifact index linking all diagnostic animations, comparison
      videos, and the required full film, with run identities and outcomes.
- [x] If accepted, prepare a separate production-promotion design and plan;
      leave production unchanged during this experiment.

Gate: the result is repeatable, independently verifiable, owner-inspected, and
strong enough to support either rejection or a separately authorized
production promotion.

## Promotion Boundary

Experiment results are evidence, not production architecture. Promotion requires a separate production-owned design, implementation plan, and verification boundary.

## Handoff State

The replacement film qualifies the owner-reported horizon-color correction.
Its full source recurrence gate remains failed on unchanged early ground events,
as established by exact comparison with the previous film. The detector and
failed result remain intact. Overall experiment acceptance, required review/audit,
and owner inspection remain open; color-correction delivery is a narrower result.

## Horizon Color Continuation

- [x] Trace the sunset/sunrise excursion to the earliest discontinuous or
      excessively steep physical-to-display quantity.
- [x] Compare the unchanged p9 response, removal of its sunset boost, and a
      bounded monotone response with the identical corrected cache and camera.
- [x] Verify positive physical-to-display response slope, source and encoded
      horizon behavior, and retained daytime recurring-strobe qualification.
- [x] Regenerate the same native The Hours film with the selected response,
      qualify it, and publish all diagnostic animations and comparisons.
- [x] Update final evidence verification and promotion implications while
      explicitly retaining the unresolved full source recurrence gate.
- [ ] Obtain complete primary reviews and independent audits when reviewer
      infrastructure permits; validate the final cumulative review request.

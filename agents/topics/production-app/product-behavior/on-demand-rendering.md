# Flat32 on-demand rendering

Selected by the owner on 2026-10-22 to stop repeated atmosphere rendering when
the displayed scene has not changed. The application now defaults to on-demand
frames. Explicit `animation-frame` cadence remains available for continuous
animation callers; `manual` cadence remains caller-owned for deterministic
capture workflows.

## Scheduling contract

`ThreeSceneRuntime.requestRender()` schedules at most one browser animation
callback. Further requests before that frame coalesce. A completed frame does
not schedule a successor unless the selected cadence is continuous or a new
invalidation arose during rendering. The last composited image remains displayed.

Camera rotation wakes rendering through the actual PointerLockControls `change`
event. FOV changes, viewport resize, shadow refresh, composition installation,
shader-mode selection and Sun presentation changes request a redraw. Object
visibility already refreshes shadow maps and therefore wakes the same path.
Elevation, time, location and mode preparations wake the host when they queue
their existing atomic frame-boundary publication. Complete state publishes before
the one ensuing render; preparation of an unpublished candidate does not itself
request a display frame.

Sun and stellar generation completes synchronously within the prepared or
rendered pipeline; initial asynchronous preparation completes before publication.
They therefore do not need an idle polling render loop. Cache prediction retains
its normal asynchronous lifecycle, with frame-boundary publication waking the
renderer when it completes.

Hidden documents cancel their pending display callback. Invalidations and
publications remain queued. Visibility restoration requests a fresh frame and
consumes the latest accepted state. The initial synchronous resource frame is
retained even when hidden, because startup verifies the six allocated shadow maps.
Subsequent hidden frames are suspended. Context restoration still waits for resource
owners before requesting the resumed frame. Disposal removes visibility and
pointer listeners and cancels pending callbacks. GPU resources remain allocated
for reuse; this change reduces repeated rendering work rather than cache memory.

## Verification and current boundary

Flat32 type checking, app/Worker build and browser-test build pass. All 69 basic
browser cases pass, including six new cases covering initial resource allocation,
request coalescing, idle termination, invalidation during rendering, hidden publication/resumption,
explicit continuous cadence and pointer listener cleanup. Existing manual-frame,
cancellation and context-restoration checks remain active.

The retained continuous-render baseline drew 109 atmosphere frames in a
1.8-second idle sample. Current output draws zero frames in the same interval,
with no scheduled browser callback. The 1195-by-750 matched Sunset image at
2 km and 50-degree vertical FOV is byte-identical to the baseline.

The actual GPU pointer-change, FOV, object visibility, sky modes, Sun presentation,
resize, asynchronous elevation and time checks all redraw and then become idle.
The time check waits for the changed observation to publish, rather than accepting
the previous ready state. Genuine tab visibility passes: a hidden FOV change
produces zero draws, visibility restoration produces one draw, and the view then
remains idle. Flat/local mode publication, FOV and elevation changes also redraw
and then stop. Its unchanged view draws zero atmosphere frames in a 1.8-second
sample. No browser-page or renderer error is reported by the qualified runs.

Evidence remains under `.codex-tmp/flat32-sky-scene-controls/`:

- `on-demand-proof-01/` retains the continuous baseline and the candidate startup
  failure that identified the required synchronous resource frame. That defect is corrected.
- `on-demand-proof-02/` retains matching output and control checks; its time control
  targeted a disabled button and therefore did not request a change.
- `on-demand-proof-03/` retains matching output, all globe controls and the corrected
  time-publication proof. Its old headless browser did not mark background tabs hidden;
  this is a browser-harness limitation, not a renderer failure.
- `on-demand-proof-04/result.json` completes genuine tab-visibility and flat/local
  checks using modern headless Chrome and the exact same application bundle.
  Its `flat-local-idle.png` retains the final local view.
- `on-demand-qualification-01.json` asserts the completed results across these
  preserved runs, including matching bundle hashes and parent-evidence hashes.
- `on-demand-browser-tests-02.log` records 69 passing cases and one unselected
  full-cache acceptance case skipped by the basic suite.

The app is rebuilt locally. No cache rebuild or atmospheric equation change is
part of this work.

The coherent review unit uses the pre-edit repository baseline
`.codex-tmp/review-standards/session-P6I5Ou/baseline.json`. Primary self-review
includes unchanged Algorithm32 publication/rendering and celestial generation
collaborators. Dedicated standards reviewers cannot start because current
readiness still reports stale all-lane calibration; no compliance result is
claimed. Fresh checkpoint advice recommends preserving the coherent complete
Flat32 scene-quality/control/rendering update. This task does not create a commit.

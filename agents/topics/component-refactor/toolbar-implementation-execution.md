# Flat Toolbar Implementation Execution

Status: M1–M3 complete. Local task checkpoints are recorded below and in Git history. The owner authorized the saved toolbar plan through
independent-execution on 2026-11-08, including task-scoped local checkpoints with
the adviser's preapproved messages. No push or publication is authorized.

## Current State And Resumption

- Plan: [toolbar implementation](toolbar-implementation-plan.md).
- M1: complete. Types, 214 browser tests and the actual-app proof pass.
- M2: complete; 214 tests pass and both actual views have one seven-command row.
- M3: complete. Final-source types, 218 browser cases, normal production build and actual-app verification pass.
- Generated evidence: `.codex-tmp/component-refactor/toolbar-implementation/`.
- Starting HEAD: `56bcae7e496da16297e62b11806669e438d4ee6e`.
- The starting tree includes the owner's localization-service edit and the
  completed shared-control/localization foundation, format-hint adaptation and
  saved toolbar plan. Preserve those exact bytes; baseline identities/diff are
  below `baseline/`. Existing 209-test/type/build evidence belongs to that
  preceding source state and is not a toolbar pass.

## Decisions

1. Use the plan's proposed interactions under the owner's execution authority:
   single-row icon vocabulary, native MUI menus/popover, horizontal overflow,
   no collapse, and a separately reachable optional-view close action.
2. Keep the IntlDate/parser adaptation and model/utility reclassification
   deferred as directed. Models are exclusively services; no new model is
   needed for popup state.
3. Keep standards reviewers cancelled. Primary self-review, built-in checks,
   real-browser evidence and the existing checkpoint adviser remain active.
4. Preserve the existing MUI Popover and add declarative close/navigation
   completion rather than a parallel popup implementation or manual DOM focus.
5. The actual-app M1 proof exposed focus remaining on Popover's Paper despite
   the slider input's native autoFocus. Installed MUI 9.5.0's focus trap selects
   a descendant marked data-mui-focusable. Supply that marker through Slider's
   input slot when autofocus is requested; keep MUI responsible for focus.
   Preserve the failed proof logs/captures under `m1` and `m1-02`, and verify
   actual keyboard focus rather than only dispatching synthetic input events.
6. The checkpoint adviser recommends including the related preexisting shared
   foundation and owner localization edit with M1, establishing a clean resumable
   baseline. Every dirty path is in Flat or its owning topic documents. This is
   within the owner's independent-execution local-checkpoint authorization;
   baseline evidence retains the preexisting authorship boundary.
7. M3's missing-location navigation exposed the configuration host selecting
   a hidden coordinate input while the city input loads. Its visibility filter
   now includes CSS visibility. A provisional passive-effect popup bridge did
   not resolve the issue and was removed; retain MUI's existing transition
   callback and focus management. Failed proofs and diagnostics remain in the
   numbered `m3-*` directories. Installed Chrome verification passes after the focused correction.
8. The actual-app harness initially launched Puppeteer's bundled Chromium 112,
   while the built-in suite uses installed Chrome 156. Chromium 112 ignored
   visibilityProperty and kept selecting the hidden input. Match the actual
   proof to installed Chrome 156; its missing-location navigation now passes.
   Wait for native entry animations before pointer clicks/captures. Preserve
   earlier diagnostic runs rather than counting them as passes.
9. At 360px native focus left part of View settings clipped beside Close.
   CSS scroll padding and button scroll margins now expose the whole command
   through native keyboard scrolling, without custom scrolling or focus code.

## Milestone Reports

### M1 — Working Sky And Clock

Implemented shared localized IconButton, prepared IconButtonContent and
IconMenuButton; PanelButton retains its text mode and supports icon mode and
declarative dismissal/completion. The clock's render-prop content unmounts the
actual Slider at dismissal start, releasing MUI drag state and the service edit
token. Pending settings navigation waits for MUI exit and is invalidated by
unmount/reopening/owner changes. The clock remains available without a location.

Evidence: `m1-checks` passed 214 tests before the final declarative focus-marker
correction; `m1-final-browser` passes 214 and `m1-types` passes for the final source. The actual
app runs at `/tools/flat/` using the normal build/deployment components. In
`m1-03/proof.json`, one arrow key changes the real shared timestamp by 24 seconds
and configuration retains focus after the popup closes. Useful captures:
[closed](../../../.codex-tmp/component-refactor/toolbar-implementation/m1-03/closed.png)
and [clock](../../../.codex-tmp/component-refactor/toolbar-implementation/m1-03/clock.png).
These show the existing multi-row layout with the new working controls, not the
final toolbar. Real scene preparation was allowed to run; no completed-sky or
GPU-performance claim is made by these captures. Failed runs remain preserved.

Disposition: advance to M2 after final checks and the coherent local checkpoint.
Measured actual-app proof including its build: 35.6 seconds; successful browser
portion: 18.2 seconds. Earlier recoveries are recorded separately in the logs.

### M2 — Complete Single-Row Composition

ViewportFrame now composes generic scene/settings commands and feature-owned
controls through the shared Toolbar. Its view heading remains accessible and
the optional Close action stays outside the scroll region. Collapse state,
second-row layout and obsolete toolbar widths are removed. Flat composes Sky,
elevation, FOV, clock and Sun aiming together; its camera contribution now owns
the time-token cleanup formerly attached to the secondary time registration.
Configuration controls retain their existing presentation and scopes.

Evidence: `m2-browser` passes 214 cases, including exact-view scene/settings
routing, controlled numeric/custom choices and merged registration cleanup.
`m2-two-view/proof.json` verifies seven commands in a single row for each real
view and header height under 65px. Its preparation/cache-entry counters and
shared timestamp stay unchanged when merely opening/dismissing the Sky menu;
the same canvas is retained. The proof adds transparent call-count wrappers to
the built bundle, without replacing runtime behavior. Its actual-app build/run
took 44.3 seconds, with a 27.7-second browser portion.
Captures: [single](../../../.codex-tmp/component-refactor/toolbar-implementation/m2/closed.png)
and [two views](../../../.codex-tmp/component-refactor/toolbar-implementation/m2-two-view/two-views.png).
These do not claim completed sky preparation.

Disposition: advance to M3 for narrow/translated layouts, remaining lifecycle
cases and final integration verification. No model, parser or rendering changes
were needed.

### M3 — Integration And Final Handoff

The existing browser suite now has 218 passing cases. Added coverage verifies
disabled/controlled menu choices, pending/custom camera presets, long translated
popup copy, reopening and owner-change cancellation, and exact original-owner
release. Existing Slider cases cover pointer cancellation, late movement and
exactly-once release. The configuration focus regression now includes an input
hidden by CSS as well as a loading input and closed disclosure.

Actual-app diagnostics found two implementation issues: selecting a hidden
coordinate input during location navigation, and a partially clipped focused
settings command at 360px. CSS visibility filtering fixes the first; native
scroll padding/margins fix the second. No popup-owned manual focus, references
or timers were introduced. The provisional lifecycle bridge was removed.

Final checks: `m3-types-complete` passes (5.8 seconds), `m3-final-suite`
passes all 218 cases (26.2 seconds including its build), and `m3-final-build`
passes the normal production build (21.3 seconds). Existing build warnings about
algorithm32 circular dependencies and large third-party Babel inputs remain;
no new source-review/compliance claim is made. Primary self-review plus
`self-check.json` finds no inline JSX computations or authored style/sx props
in 33 changed presentation files and confirms the owner's localize.js bytes
match the starting baseline. Obsolete collapse/time-toolbar source references
are removed. No parser, utility classification or shader changes were needed.

`m3-final/proof.json` records the real app mounted at `/tools/flat/` in
installed Chrome 156, device/default locale and America/Los_Angeles time zone.
Both 720px views at a 1440px window retain seven commands in 49px headers;
800px views retain existing responsive stacking. At 360px the optional toolbar
scrolls 18px, fully exposes focused settings and leaves Close outside scrolling.
The settled clock popup is bounded at 24–344px
with no horizontal content overflow. Actual shared-time keyboard editing,
independent camera/Sky selections, settings focus with configuration closed or
already open, missing-location navigation, and page/view removal mid-edit pass.
Closed owners reject stale gestures and late pointer movement does not seek.
Opening/dismissing Sky preserves canvas, preparation counts and shared time.

The final browser portion took 86.0 seconds,
reusing the final built app. Earlier diagnostic attempts remain preserved;
they are not passes. One counter comparison overlapped startup work, so the
proof now separates the missing-location lifecycle and waits for initial
preparation entry before the menu-only comparison. This does not alter runtime
behavior. All disposable browser profiles are removed; no browser cookies or
caches are retained. Captures are UI evidence, not a new shader/scientific or
GPU-performance qualification.

Final inspected captures: [two views](../../../.codex-tmp/component-refactor/toolbar-implementation/m3-final/two-views.png),
[clock](../../../.codex-tmp/component-refactor/toolbar-implementation/m3-final/clock.png),
[narrow toolbar](../../../.codex-tmp/component-refactor/toolbar-implementation/m3-final/two-views-360.png),
and [narrow clock](../../../.codex-tmp/component-refactor/toolbar-implementation/m3-final/clock-360.png).
The full final proof includes missing-location/configuration and mid-edit
cleanup observations. The preceding `m3-10` proof independently passed the same
behavior; its popup capture was still entering, so final geometry uses the
settled capture instead.

Disposition: M1–M3 complete. The existing adviser recommends the final checkpoint
as a coherent verification/fix unit; reviewers remain cancelled. Advice is in
`.codex-tmp/component-refactor/checkpoint-monitor-toolbar/m3-toolbar-advice.md`.
No push/publication is authorized.

## Checkpoints

- `d6f58b2b` — `feat(flat): add icon toolbar controls` (M1 and its preserved,
  related shared-control foundation).
- `9f9927ae` — `feat(flat): compose single-row view toolbars` (M2).
- M3: `fix(flat): complete toolbar lifecycle and overflow handling`; its final
  identity is in Git history and `checkpoints.json` in the generated evidence root.

## Final Report

Implemented all seven icon commands in a single shared toolbar for each view,
including the shared-time clock popup. Workspace and feature ownership remain
separate. Native MUI modality/focus and native narrow scrolling are retained.
Types, 218 browser tests, the normal production build and final actual-app proof
pass. No toolbar blockers remain. The final local checkpoint is recorded in Git
history and generated checkpoint metadata alongside this execution evidence.

Major decisions and recoveries are recorded above. Engineering source reviews
remain owner-cancelled; primary checks do not establish formal compliance.
The transferred IntlDate parser adaptation and misclassified utility/model
corrections remain explicit follow-ons. Models are exclusively services. The
dome-cache experiment stays suspended. Future work resumes from the current
toolbar contracts in this topic; no deferred correction is silently completed.

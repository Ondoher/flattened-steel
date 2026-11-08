# Flat Toolbar Implementation Execution

Status: M2 complete; checkpoint and M3 verification next. The owner authorized the saved toolbar plan through
independent-execution on 2026-11-08, including task-scoped local checkpoints with
the adviser's preapproved messages. No push or publication is authorized.

## Current State And Resumption

- Plan: [toolbar implementation](toolbar-implementation-plan.md).
- M1: complete. Types, 214 browser tests and the actual-app proof pass.
- M2: complete; 214 tests pass and both actual views have one seven-command row.
- M3: not started.
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

## Checkpoints

- `d6f58b2b` — `feat(flat): add icon toolbar controls` (M1 and its preserved,
  related shared-control foundation).

## Final Report

Pending M1–M3 completion.

# Workspace Comps Execution

Status: complete, 2026-11-05. Executed the
[saved plan](workspace-comps-implementation-plan.md) under the owner's explicit
independent-execution invocation. No implementation work remains in this plan.

## Result And Evidence

The app implements the summary-led frame, generic shared/view settings sections,
independent Camera configuration and synchronized shared-time toolbar/panel
controls. Flat Earth owns the alternate editor through a registered model-service;
the existing clock owns the shared timestamp. App startup still permits an empty
workspace and an optional second view. The Time section works without a canvas.

[Open the actual application gallery](../../../.codex-tmp/flat-workspace-comps/2026-11-05/implementation/index.html).
These are real renderer captures, separate from the preserved designer comps.
All four frame/header/scene/panel rectangles match the assigned specification.
The selected palette is #121212 / #F2F2F2 / current #ABD3FA, with Arial/Helvetica,
14px base text and the specified compact controls. The primary agent inspected
all four final images; no required placement mismatch remains.

| Milestone | Disposition | Deliverables and evidence                                                                                                                                                                                                                                                                                      |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1        | Complete    | [Independent signed offsets and boundary proof](../../../.codex-tmp/flat-workspace-comps/2026-11-05/implementation/time-proof.json), public geometry reference/offset operations, generic section identities and exact mount tokens.                                                                           |
| M2        | Complete    | Working summaries, sections, focus/navigation and Camera provider; [early desktop slice](../../../.codex-tmp/flat-workspace-comps/2026-11-05/implementation/browser-pilot2/05-live-time-panel.png).                                                                                                            |
| M3        | Complete    | [Eight live integration checks](../../../.codex-tmp/flat-workspace-comps/2026-11-05/implementation/browser-final-v4/browser-report.json): numeric/range shared writes, actual rendered observation identities, independent cameras, view-specific settings, draft retention, manual location and focus return. |
| M4        | Complete    | [Final layout/token/containment report](../../../.codex-tmp/flat-workspace-comps/2026-11-05/implementation/browser-layout/layout-report.json), four real images, narrower-window checks, client/engine types, 118 browser tests and29 focused geometry tests.                                                  |

The final [editor proof](../../../.codex-tmp/flat-workspace-comps/2026-11-05/implementation/editor-final/report.json) also verifies precise
+45.125 acceptance, real live-clock ticks with an unfinished draft, cancellation
of a held pointer gesture after a location change, a scroll-reachable numeric
field at 600Ã—640, Time settings with no scene mounted and accepted time surviving
feature stop. It uses the final model/controller source without unnecessary GPU
initialization. Model tests cover restart tokens, invalid/incomplete input,
registry isolation, unavailable location and external-update reconciliation.

Measured frame geometry in CSS pixels:

| Target        | App header | View header            | Scene           | Configuration        |
| ------------- | ---------- | ---------------------- | --------------- | -------------------- |
| T1, 1440Ã—900 | 76 high    | 148 high               | y224, height676 | Closed               |
| T2, 1440Ã—900 | 76 high    | 184 high, each540 wide | y260, height640 | x1080, y76, 360Ã—824 |
| T3, 1100Ã—800 | 76 high    | 184 high, each550 wide | y260, height240 | y500, 1100Ã—300      |
| T4, 600Ã—900  | 116 high   | 184 high               | y300, height230 | y530, 600Ã—370       |

The configuration numeric fields also match the specified bounds: T2 at
(1100, 442), 144Ã—36; T3 at(414, 674), 120Ã—36; T4 at(16, 796), 128Ã—36.
The final capture report has no browser errors, document overflow or controls
crossing their assigned horizontal regions. The integration proof separately
checks widths1200, 1000, 760, 580 and390 with no horizontal document overflow.
Below the supplied targets, existing reflow/scroll behavior preserves reachability;
this does not establish a newly designed phone experience.

## Consequential Decisions

1. Preserve the 105-file dirty baseline, its hashes and relevant source copies.
   The first checkpoint includes the related preexisting Flat/clock/scene/build
   dependencies needed for this slice. `transfer/`, `.prettierignore` and
   unrelated governance remain outside both checkpoints. City dataset bytes
   retain their original identities; temporary formatting changes were restored.
2. The [time-input note](flat-earth-time-input.md) owns the implemented signed
   reference, day/gesture and acceptance policy. Use geometry's nearest daily
   closest occurrence; freeze it during a gesture. Â±180 are opposite endpoints,
   with no automatic drag wrap. Location changes preserve accepted time.
3. A shared Time section is registered for the activated Flat Earth feature's
   lifetime; Camera sections belong to exact open-view identities. Mount only
   the selected section. Generic navigation selects contribution id/scope and
   optional provider-owned focus intent, not a feature implementation.
4. Valid numeric input accepts on Enter/blur. Incomplete text remains a draft;
   Escape restores accepted text. Slider edits supersede the draft. External
   changes invalidate gesture tokens and retain unfinished text for fresh
   acceptance. Numeric entry retains more precision than the compact toolbar
   readout; dot-decimal syntax is the first-pass format, with localized labels.
5. Native input visibility includes closed disclosure state. Loading inputs
   receive focus only when visible/enabled and the user remains in the requested
   editor; exact observer cleanup prevents later focus stealing. Nested picker
   Escape precedes panel Escape. All interaction remains in React/view/controller
   boundaries, with model-services holding domain/draft rules.
6. Keep current device-local date/time entry and the existing clock/renderer
   machinery. No time-zone lookup, animation UI, MUI, new dependency, server
   route, experiment execution, publishing or deployment was added.

## Verification, Recovery And Limits

- `npm run typecheck:flat` and `npm run typecheck:algorithm32` pass.
- [Flat browser suite](../../../.codex-tmp/flat-workspace-comps/2026-11-05/implementation/tests-handoff.log):118 tests pass.
- [Focused production geometry suite](../../../.codex-tmp/flat-workspace-comps/2026-11-05/implementation/geometry-tests.log):29 tests
  pass. The full unrelated engine/cache qualification and unchanged server
  suites were not repeated; existing renderer/session/clock tests remain intact.
- The real browser checks validate shared accepted timestamps against both
  rendered observation identities rather than matching initial labels alone.
  The verified GPU build is retained under `browser-final-v4/build/`; its
  [bundle receipt](../../../.codex-tmp/flat-workspace-comps/2026-11-05/implementation/browser-final-v4/tested-bundle.json) records identity.
  Later precision/restart changes have targeted model/browser proof, and final
  source has a fresh application build and exact layout capture.
- The primary agent self-reviewed feature ownership, model-services, lifecycle,
  ambient types, JSX computation/wrapper rules, JSDoc/method spacing, braces and
  stylesheet assets. Engineering standards review remains cancelled; no
  independent compliance result is claimed. The plan's separate-agent critique
  and checkpoint advice are distinct from source review.

Recovery evidence is preserved: initial summary startup ordering failure;
native Chrome sandbox startup failure; focus diagnostics showing that closed
details fields can have layout rectangles despite not being visible; and the
browser driver's corrected second Escape after the picker consumed its first.
The summary now reads its view only at mounted readiness, focus uses actual
visibility, and the successful sequence retains all completed checks. Fixes
were scoped to the affected owner instead of restarting unrelated work.

The one-run integration measurement was 32.7s from loaded-app setup through the
first ready scene, including UI entry/search and renderer preparation, and 112.9s
for the eight-check sequence plus captures/narrow-width checks. These are wall
times on the current Windows/Chrome/GPU environment, not isolated GPU timings,
a benchmark or a continuous-animation guarantee. No reliable token/cost telemetry
was available. Build, implementation and recovery time are not pure reasoning
or scene-render time.

## Checkpoints And Resumption

- `8b8835df` â€” `Build Flat workspace settings and shared-time control slice`.
- Final checkpoint message: `Finalize Flat workspace time controls and responsive layout`.
  Its full hash is recorded in the
  [checkpoint receipt](../../../.codex-tmp/flat-workspace-comps/2026-11-05/implementation/checkpoint.json). Its adviser message is
  preapproved by the execution skill; nothing is pushed.

No required work or blocker remains. Follow-on time-zone, playback UI and richer
numeric-localization work require a new selection. Resume later work from the
Flat entry and owning design notes; do not rerun this completed plan or reopen
the suspended experiment automatically.

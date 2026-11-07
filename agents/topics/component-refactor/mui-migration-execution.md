# MUI Migration Execution

Scope: owner-authorized independent execution of M0–M1, followed by M2–M3 and
now the remaining M4 verification and handoff. Toolbar conversion remains separate.
Local checkpoints are authorized under the
independent-execution skill; pushes/publication are not.

## Current State

| Milestone                                | State    | Evidence / next action                                                                                                                                               |
| ---------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0: baseline and inventory               | Complete | Preserved dirty baseline; 133 browser tests, client types and Flat build pass; 31-path maintained catalog inventoried                                                |
| M1: foundation and visible location form | Complete | 181 browser tests, client types, normal build and actual local/discovered app proof pass; task-scoped local checkpoint: feat(flat): establish MUI control foundation |
| M2: shared controls                      | Complete | 199 browser tests, client types, normal build and actual interactive-panel proof pass                                                                                |
| M3: application migration                | Complete | 202 working-tree browser tests, client types, normal build and actual local/discovered app/GPU checks pass                                                           |
| M4                                       | Complete | Remaining nested-mount GPU, recovery, cleanup, server, sibling-build and standards-guide checks pass; final handoff below                                            |

Evidence root: `.codex-tmp/component-refactor/mui/run-20261107-01/`.
M2–M3 baseline/evidence root: `.codex-tmp/component-refactor/mui/run-20261107-02/`.
M4 baseline/evidence root: `.codex-tmp/component-refactor/mui/run-20261107-03/`.
The [plan](mui-migration-plan.md) owns requirements and advancement criteria.
HEAD at execution start: `7b2a888f`; baseline.patch and baseline-files preserve
the pre-existing dirty work. The catalog still selects 31 files, with only
the existing TestHarness path colliding. Both ignored operational stellar
packages are available. Engineering reviewers remain owner-cancelled.

## Decisions

- D1: implement the latitude/longitude inputs and their Apply action as M1's
  actual app slice. Keep city search, dates and toolbar layout in their present
  form until their later milestones.
- D2: retain current React/ReactDOM and repository tooling. Select MUI from
  the current registry's supported peers; record the resolved versions and
  compatibility handling before installation.
- D3: copy the maintained components and specs wholesale, then make only the
  authorized context-default and concrete integration fixes. Do not use this
  work to rewrite their local style or unrelated contracts.
- D4: use MUI Material/icons/styled-engine 9.5.0, Emotion 11 and react-is
  18.3.1, with an npm override matching the installed React 18.3.1. Existing
  dependency versions are retained. The lockfile contains 35 added packages;
  preserve its original two-space formatting to avoid unrelated churn.
- D5: keep fixed dark mode without storage persistence. The theme service owns
  one stable theme and derives supported component defaults from app-context.
  Application CSS owns the semantic MUI palette variables and resting field
  outline; isolate legacy native-control selectors from MUI slots.
- D6: checked JavaScript exposed untyped React context, an unknown phrase key,
  a select event type, a checkbox render return and dialog ARIA type issues in
  the copied source. Adapt only those concrete incompatibilities. Add the
  existing runtime's Service constructor/registry/implement capability to the
  retained local Polylith type shim so the new theme source is checked too.
  The runtime package itself still does not export types.
- D7: actual visual inspection found the legacy universal border-box reset
  compressing MUI inputs to 23 px despite correct size props. Remove that
  duplicate reset in favor of layered CssBaseline and apply the app's Arial
  family through supported CSS classes. Final fields are 40 px high.
- D8: per the owner's follow-up, browser profiles are disposable. Remove this
  run's saved profile and clean future profile directories in the runner's
  finalizer. Retain the requested screenshots and measured verification results.
- D9: exclude MUI's interactive slots from the legacy global focus-visible
  outline so MUI owns its focus presentation. A focused-coordinate browser
  check confirms no input outline, one blue 2 px MUI field border, and the
  native city input's retained focus ring. Evidence is under
  `.codex-tmp/component-refactor/mui/focus-fix/`; its browser profile was deleted.
- D10: keep Date/Time as controlled local-format text entry with MUI fields and
  helper feedback. Borrow the transferred field's presentation, without its
  render-time state writes, normalization or application dependencies. Show
  format hints below the field to fit the existing half-width settings columns;
  preserve drafts/caret naturally rather than introducing unspecified editing.
- D11: TypeAhead receives ranked options, controlled query and optional selected
  option. Report query changes only for typing/clear, selection by stable id,
  and consume the first Escape while its popup is open. CityPicker adapts city
  presentation without acquiring lookup/domain ownership.
- D12: shared Slider owns transient gesture cleanup and emits numeric values;
  the Flat feature retains its frozen reference/token and shared-time seeking.
  The new nonmodal PanelButton and common Toolbar are reusable controls only;
  their adoption into current toolbar containers remains deferred.
- D13: keep Polylith's built-in test generation and the existing Karma/Jasmine
  execution lane. Load its generated bundle as an ES module: Popper's flattened
  helper names otherwise overwrite browser globals under classic-script scope.
  The watch lane inherits the same configuration. No runner/framework was added.
- D14: a cancellation proof showed MUI's pointer drag could continue after
  pointercancel. The shared Slider retires only its transient MUI widget on
  cancellation, letting MUI's unmount cleanup release document listeners. The
  controlled value and feature-owned time reference remain outside the widget.
- D15: use MUI's editable-query mode to retain its clear action for an
  unfinished search. Unmatched Enter remains a query; Enter with ranked results
  selects the first prepared match, retaining the old picker behavior. Only a
  prepared option reports selection. Verified query clear independently
  from selection and MUI's internal reset events.
- D16: normalize select callbacks to values at the React boundary and carry the
  exact view id explicitly. Keep DOM button refs through Button's buttonRef.
  Extend the existing TestHarness with actual MUI-menu inspection/selection,
  adapting native-markup assertions without bypassing the interaction.
- D17: keep accepted custom elevation/FOV values represented in their select
  lists, rather than showing an out-of-range MUI value. This does not restrict
  valid camera values to presets or add domain state to presentation.
- D18: migrate configuration to a nonmodal MUI Paper surface and the coordinate
  disclosure to Accordion. Keep its mounted fields, owner-held drafts, scopes,
  sections, existing layout and focus restoration. Current toolbar containers
  and rows remain ordinary React hosts; Sun controls stay inline.
- D19: keep M3's checkpoint independent of earlier uncommitted Sky, collapse,
  stellar, engine and city-data features. Reconstruct only overlapping staged
  files against the M2 commit; retain the full migrated pending features in the
  working tree. Verify this isolated source snapshot through ordinary Polylith,
  Karma and TypeScript commands before committing. No builder hooks or alternate
  test framework are needed.
- D20: M4 reuses the completed M3 type/build/202-test and local/discovered
  workflows while their sources remain unchanged. Add targeted actual-app checks
  for the remaining gesture/recovery, GPU mode/resource and mount/cleanup cases.
  Recheck only evidence invalidated by a concrete fix. Server and sibling smoke
  checks verify shared integration without converting Flat32 or reopening science.
- D21: the final probe originally called nonexistent Registry.stop after all
  core checks passed. Preserve that failed attempt; use the actual app/feature
  controller stop methods for a focused cleanup follow-up. Do not change
  production lifecycle APIs or rerun unchanged GPU assertions to fix the probe.

## M4 Final Handoff

The MUI migration is complete. No additional production source changes were
needed during M4. Shared Button, TypeAhead, Slider, Date/Time, Toolbar and
PanelButton are available; configuration-specific CityPicker composes TypeAhead.
Active standard controls use the shared/MUI layer. Context owns small/outlined
defaults with supported explicit overrides. Toolbar layout and Sun-popup adoption
remain the separately selected follow-on described in the entry document's
[remaining-toolbar inventory](README.md#flat-toolbar-direction).

Verification is scoped to this migration and the preserved working tree:

| Area                                                        | Result and evidence                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client types, complete UI suite and normal repository build | Reused unchanged M3 results: types pass, 202 browser tests pass, normal build passes. The isolated M3 commit source also passes types and 190 applicable tests. The M4 identity check covers 723 unchanged source/configuration paths.                                                                                                                                                   |
| Shared controls/provider/defaults                           | Reused M1/M2 tests and real-provider proof for alternate context values, explicit overrides, nested recipients, pointer cancellation/blur/unmount, popup dismissal and focus.                                                                                                                                                                                                            |
| Local and discoverable app workflows                        | Reused M3 local/discovered city, coordinate, date/time, shared seeking, two independent cameras, collapse and settings evidence.                                                                                                                                                                                                                                                         |
| Nested discovered mount                                     | New `/tools/flat` build/host passes: all six CSS resources load below the correct base, selecting the page uses its mounted URL, deep-link response retains the correct base, and no failed HTTP responses or page/console errors occur.                                                                                                                                                 |
| Drafts, focus and gesture cleanup                           | New actual-app proof retains a partial date across settings close/reopen, restores opener focus, and ends a shared-time keyboard gesture exactly once after window blur.                                                                                                                                                                                                                 |
| GPU and cache preservation                                  | New height/FOV/time changes preserve runtime, canvas, retained frame, shader handle, existing programs and the physical cache. One cache is built before retry. Repeated Full/No-atmosphere/Shader-off switches add no preparations/cache builds and retain programs after the first direct-render use.                                                                                  |
| Sky, stars and ground                                       | Actual captures show colored daytime sky, the authenticated 2,000-star source with both human filters enabled, visible stars with atmosphere off and dim green ground in atmosphere-off/direct modes. This is integration evidence, not new scientific qualification.                                                                                                                    |
| Retry and close/reopen                                      | Injected recoverable graphics failure displays the shared MUI Retry button; clicking it renders successfully, disposes the failed runtime and releases its cache. A separate follow-up closes/reopens the second view during preparation, then app/feature lifecycle stops release every GPU owner. Retry intentionally replaces the graphics lifetime while retaining the React canvas. |
| Visual density and comparison layout                        | Reused 40 px fields/30.75 px buttons, theme/focus and 1100 px layout captures; new geometry/capture confirms all four camera controls remain inside each 720 px comparison view. The captured second scene is deliberately still preparing for the cancellation check.                                                                                                                   |
| Server and sibling integration                              | Existing server suite: 21/21 pass (11.7 s). Flat server suite: 5/5 pass (1.4 s), including asset authentication, retry and mounted routing. Explicit Flat32 build smoke passes (16.5 s); no Flat32 conversion.                                                                                                                                                                           |
| Standards reference and formatting                          | Maintained guide check reports current; Flat's browser mapping includes MUI/base-components, and all six local overlays remain unchanged. Scoped formatting and Git whitespace checks pass. The generated guide remains unstaged.                                                                                                                                                        |

New evidence lives in `.codex-tmp/component-refactor/mui/run-20261107-03/`:

- [Aggregate app proof](../../../.codex-tmp/component-refactor/mui/run-20261107-03/app-proof.json)
  links the retained core attempt and the successful cleanup follow-up. The core
  attempt passed rendering/mode/resource/Retry checks but failed at the probe's
  unsupported registry stop call; it is not relabeled as a successful full run.
- [Day sky](../../../.codex-tmp/component-refactor/mui/run-20261107-03/full-day-sky.png),
  [stars and dim ground](../../../.codex-tmp/component-refactor/mui/run-20261107-03/no-atmosphere-stars-ground.png),
  [direct mode](../../../.codex-tmp/component-refactor/mui/run-20261107-03/shader-off-ground.png),
  [recovered app](../../../.codex-tmp/component-refactor/mui/run-20261107-03/recovered-app.png)
  and [comparison controls](../../../.codex-tmp/component-refactor/mui/run-20261107-03/comparison-control-layout.png)
  were visually inspected. Atmosphere-off sampled ground RGB is (2,9,0), versus
  daytime (74,153,57); these display values document visibility, not radiometry.
- [Handoff identity/formatting record](../../../.codex-tmp/component-refactor/mui/run-20261107-03/handoff-verification.json)
  and [guide check](../../../.codex-tmp/component-refactor/mui/run-20261107-03/standards-guide-physical.log)
  retain evidence reuse and mapping provenance. The guide CLI was run through its
  physical path because its Codex-home junction spelling bypasses its main guard.

The first GPU attempt took 97.4 s including its build and the final probe error;
the focused follow-up reused that build and took 70.6 s. These are command wall
times including GPU/browser startup, not performance benchmarks or reasoning
time. Both browser profiles were removed. No browser user data is retained.

Local checkpoints: M1 `d375c058`, M2 `714320bc`, M3 `afda1c52`; the M4 adviser
recommends `docs(flat): complete MUI migration handoff`, restricted to these four
handoff documents. Earlier shader/star/collapse/city/engine/server work and its
overlapping MUI adaptations remain uncommitted. The handoff evidence tests that
preserved working tree; it does not silently promote those pending features.

No material migration requirement remains open. External parent-repository
deployment, published hosting, other browsers/devices and exhaustive responsive
acceptance were not tested. Standards reviewers remain owner-cancelled; no
standards-compliance claim is made. The dome-cache experiment stays suspended.
Toolbar redesign, timezone/localization expansion, rule promotion and unrelated
pending work remain outside this completed plan. Nothing was pushed or published.

## M3 Result and Verification

Global configuration, workspace actions/selectors and Flat Earth's camera,
retry and time controls now use the shared MUI layer in their existing positions.
The settings host is nonmodal Paper, with Typography, MUI feedback and an
Accordion for coordinate entry. No active feature JSX retains a native button,
select, input, textarea, option or disclosure control. Semantic layout, links,
canvas hosts and toolbar containers remain ordinary React markup by design.

All 202 working-tree browser tests pass using `npm run test:ui:flat`, which calls
the built-in `polylith test flat` builder and then the existing Karma runner.
New consumer regressions prove numeric camera callbacks reach the exact view,
custom values remain visible, and repeated slider keys retain one real model
reference until gesture release. A real app check exposed MUI's Enter handling
in editable-query mode; TypeAhead now selects the first prepared ranked result
when Enter supplies the query string. Unmatched text remains an unaccepted query.
The focused regression covers both cases.

Final client types pass in 5.9 s; the normal repository build passes in 28.9 s.
The full browser suite took 21.1 s including test build and Chrome startup.
Existing build warnings about circular dependencies and ignored use-client
directives remain. These are observed run timings, not controlled performance
comparisons. The isolated proposed M3 source snapshot independently passes client
types and all 190 applicable browser tests, using the ordinary CLI commands and
existing configuration. Pending feature suites account for the different count.

The actual app evidence exercises local hosting and discovered-source
normalization/build/hosting through Polylith, including real GPU rendering:

- City selection, invalid/valid coordinates and local date/time entry preserve
  accepted state and existing validation ownership.
- Two views retain independent elevation/FOV/sky values while sharing time.
  Three 0.1° slider steps advance shared time by 72,000 ms with one frozen
  reference; both rendered observations update.
- Closing a MUI menu consumes the first Escape before the configuration host.
  Collapse retains the existing mounted controls. These checks include earlier
  pending features without promoting them into this checkpoint.
- Runtime, canvas, retained frame, shader handle and theme identities stay the
  same. Both scenarios report no page/console errors.
- Fields measure 40 px with one MUI focus border; buttons measure 30.75 px.
  Existing toolbar hosts remain HEADER elements, with zero PanelButton adoption.
  The existing 1100 px settings layout has no horizontal shell/panel overflow.

Captures:
[settings](../../../.codex-tmp/component-refactor/mui/run-20261107-02/m3-app/discovered-settings.png),
[time settings](../../../.codex-tmp/component-refactor/mui/run-20261107-02/m3-app/discovered-time-settings.png),
[two views](../../../.codex-tmp/component-refactor/mui/run-20261107-02/m3-app/discovered-comparison.png),
[narrow settings](../../../.codex-tmp/component-refactor/mui/run-20261107-02/m3-app/discovered-narrow-settings.png).
The [aggregate proof](../../../.codex-tmp/component-refactor/mui/run-20261107-02/m3-app/result.json)
combines retained local core assertions with a local layout follow-up and a
complete discovered-source scenario. The original local attempt completed its
core assertions but timed out at the final layout step because the script
incorrectly assumed reopening settings resets the selected section. Its failure
record remains intact and is linked by the aggregate; it is not presented as a
wholly successful attempt. The corrected final run took 108.4 s and reused the
completed local build/core evidence. Menu-transition timing corrections belong
to the proof script. All browser profiles were deleted; only captures/results
are retained.

The checkpoint adviser recommends `feat(flat): migrate controls to shared MUI
components`. The scoped checkpoint contains M3 adaptations of the committed app;
earlier unrelated features and their overlapping migrated controls remain in the
working tree. Engineering review remains cancelled; no standards-compliance
claim is made. M4 has since completed the remaining verification above. Toolbar
conversion, timezone work and rule promotion remain deferred. Nothing is pushed
or published.

## M2 Result and Verification

The shared Button, TypeAhead, Slider, Toolbar, PanelButton and MUI Date/Time
fields are implemented, with explicit declarations and inherited base defaults.
CityPicker now composes TypeAhead while the catalog/model/controller/view keep
their existing ownership. The transferred Date source remains unchanged.

All 199 browser tests pass in the existing Polylith-built Karma/Jasmine lane.
They cover normal pointer/keyboard operation, ranking and stable result identity,
query-versus-selection/clear, literal labels, partial/invalid date/time drafts,
alternate context defaults and overrides, interrupted slider cleanup and nested
portalled interaction/focus behavior. Client types and the normal build pass.

The [interactive panel capture](../../../.codex-tmp/component-refactor/mui/run-20261107-02/m2-interactive-panel.png)
and [measured proof](../../../.codex-tmp/component-refactor/mui/run-20261107-02/m2-visual.json)
show the implemented controls through the real app theme/provider stack. The
isolated proof uses the installed Polylith builder and a temporary DOM mount,
without adding a production demo route or gallery. The slider reaches 54° by
pointer drag, a partial `11/` date remains untouched, and nested Escape first
dismisses results then the panel. Fields measure 40 px and the trigger 30.75 px.
The proof took 13.4 s including build/browser startup; its profile was deleted.

The checkpoint adviser recommends `feat(flat): add shared MUI controls`.
M3 completed the in-place consumers and non-toolbar settings surfaces; existing
toolbar containers, rows and inline Sun-slider placement remain unchanged.
Engineering review stays cancelled; no standards-compliance claim is made.
Local M2 checkpoint: `714320bc`, `feat(flat): add shared MUI controls`.

## M1 Result and Verification

The real shared-location coordinate form now uses BaseTextInput and BaseButton,
without reading control defaults itself. The catalog's literal/localized text
boundary is preserved. City search, DateField, TimeField and toolbar controls
remain their existing implementations, ready for M2 and later consumers.

- All 181 Flat browser tests pass, including all five maintained suites,
  context consumption without a theme, explicit/nested override precedence,
  compound recipients and portalled menus/dialogs under the provider stack.
- Client types pass, including the new theme implementation and all copied JSX.
  Existing untyped third-party Polylith boundaries still use the retained shim;
  this is not a claim of repository-wide strict typing or standards compliance.
- The normal repository build passes. Build logs retain existing Algorithm32
  circular-dependency warnings and MUI's ignored use-client directives.
- Actual local and discovered-source Flat builds were served through Polylith
  at `/flat` in isolated browser pages. Both accepted manual coordinate changes
  and rejected invalid latitude without changing the accepted location. The
  rendered observation updated while runtime, canvas, retained frame, shader
  handle and theme identities stayed the same. Neither page reported an error.
- Final CSS captures preserve background #121212, text/field borders #F2F2F2,
  action #ABD3FA and Arial. At 1440×1000, each input is 320×40 px and the
  outlined button is 320×30.75 px (13 px button text).

Final visual and measured evidence:
[local app](../../../.codex-tmp/component-refactor/mui/run-20261107-01/final/local-coordinate-form.png),
[discoverable app](../../../.codex-tmp/component-refactor/mui/run-20261107-01/final/discovered-coordinate-form.png),
[proof JSON](../../../.codex-tmp/component-refactor/mui/run-20261107-01/final/app-proof.json).
The [catalog provenance](../../../.codex-tmp/component-refactor/mui/run-20261107-01/final/catalog-provenance.json)
records maintained-source hashes, retained harness identity and final adapted
file hashes. The source-identities JSON records the measured working tree.
The final run took 75.9 s, including both actual GPU preparations and edits;
it reused the completed JS builds and copied the corrected app CSS into their
declared build outputs. Earlier diagnostic captures are retained separately.
This verifies discovered-source normalization/build/hosting with the real app,
not an external parent repository or a published deployment.

Final browser verification took 19.6 s including bundle/browser startup; final
client types took 6.6 s and the final normal repository build took 31.6 s. The
baseline build measured only Flat, so those build timings are not a controlled
before/after performance comparison. M0/M1 occupied roughly half an hour of
session wall time, including installation, integration, failed harness checks
and visual correction; this is not a measurement of pure reasoning time.
Retain M2's 4–10 hour focused-effort forecast as an unmeasured estimate: its
Date/Time and TypeAhead interactions remain the principal uncertainty.

Engineering review remains owner-cancelled. The checkpoint adviser recommends
`feat(flat): establish MUI control foundation`; its advice is retained with the
run evidence. At the M1 boundary, M2–M4 remained deferred; M2/M3 are now complete
as recorded above, followed by M4. Toolbar conversion, rule promotion, timezone
work and broader responsive/product acceptance remain deferred.
Tests and UI evidence use the preserved working tree, including earlier
uncommitted features. The local checkpoint contains M1 and its context/topic
prerequisites; unrelated earlier work remains uncommitted. Find the checkpoint
by its subject in Git history; the exact hash is also saved in the run's
`checkpoint.json`. Nothing was pushed or published.

## Execution Log

- 2026-11-07: started M0; captured the complete current patch/status and the
  maintained catalog hashes. Client types passed. Browser/build baseline and
  registry inspection started in parallel. No application migration edits yet.
- 2026-11-07: completed M0. Baseline client types took 4.7 s; 133 browser
  tests took 18.5 s including build/startup; Flat build took 14.9 s. Dependency
  installation took 108.9 s. MUI/base standards are mapped to the Flat browser
  set and the generated reference is refreshed without restarting reviewers.
- 2026-11-07: integrated M1's coordinate form and foundation. Client types
  pass (5.9 s); normal repository build passes (28.5 s). The initial expanded
  browser suite passed 179/180; the one new assertion expected a radio root
  class MUI does not emit for medium size. Corrected it to check actual icon
  recipients and retained the failed evidence. Popup/provider and actual app
  captures remain in progress.
- 2026-11-07: completed local/discovered visual and GPU preservation checks.
  Visual inspection caught the universal-sizing reset; the corrected final
  run passes, including a 38–42 px field-height bound and app font checks.
  Dependency audit confirms 35 additions and no changed existing package
  versions. The checkpoint adviser recommends the bounded M1 foundation unit.

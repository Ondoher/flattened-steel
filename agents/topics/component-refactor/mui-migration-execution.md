# MUI Migration Execution

Scope: owner-authorized independent execution through M1, including a real
latitude/longitude configuration form. Later controls and toolbar conversion
remain outside this execution. Local checkpoints are authorized under the
independent-execution skill; pushes/publication are not.

## Current State

| Milestone | State | Evidence / next action |
| --- | --- | --- |
| M0: baseline and inventory | Complete | Preserved dirty baseline; 133 browser tests, client types and Flat build pass; 31-path maintained catalog inventoried |
| M1: foundation and visible location form | Complete | 181 browser tests, client types, normal build and actual local/discovered app proof pass; task-scoped local checkpoint: feat(flat): establish MUI control foundation |
| M2–M4 | Deferred | Outside the through-M1 authorization |

Evidence root: `.codex-tmp/component-refactor/mui/run-20261107-01/`.
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
run evidence. M2–M4, toolbar conversion, rule promotion, timezone work and broader
responsive/product acceptance remain deferred. Resume with M2 in the saved plan.
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

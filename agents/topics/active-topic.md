# Active Topic

Current active topic: production-app.
Canonical entry: [Production app](production-app/README.md).
Focus: execute the owner's [elevation/time optimization plan](flat/control-update-optimization-plan.md)
under independent-execution. The [execution record](flat/control-update-optimization-execution.md)
owns current progress, decisions and evidence.
Ordinary compatible edits should retain the scene, shader and rendering resources
while refreshing necessary physical state and lighting. FOV performance is fine
according to the owner; preserve its existing path. The plan starts with a warm
update timing/allocation baseline and a safe engine publication/lease contract,
then implementation and focused correctness/performance verification. M1/M2 are
complete and M3 is next; the first live retained-scene slice cuts warm control
latency by about 65% with matching physical/visual state. Implementation,
profiling, checks and local adviser-recommended
checkpoints are authorized. Pushing and deployment are not.
Engineering standards review remains inactive.

The preceding startup-cache follow-up is implemented. The first view reuses the
cache/context built before page/location selection; comparison has independent
graphics resources. Preserve those uncommitted changes. The
[Flat entry](flat/README.md#verification) owns its current evidence.

The [workspace comps plan](flat/workspace-comps-implementation-plan.md) was
completed through the owner's independent-execution invocation. M1–M4 are complete. The
[execution record](flat/workspace-comps-execution.md) owns that milestone's evidence,
decisions and local checkpoints. The app implements shared summaries, generic
settings sections, independent Camera settings and shared-time toolbar/panel
editors. 118 browser tests, 29 focused geometry tests and client/engine types pass.
Four real captures match the specified frame/header/scene/panel rectangles, with
no horizontal control overflow. Final editor checks cover precise entry, actual
live ticks, stale pointer cancellation, no-canvas use, short-window reachability
and accepted time surviving feature stop. The time-input note owns the first-pass
editing policy. No required task remains; no next feature or experiment is
automatically selected. Refine-design and engineering standards review remain
inactive. Local checkpoints are authorized; nothing was published or deployed.

The earlier city-picker implementation and San Jose search correction remain
in place. The feature contributes city search, accepted-location
feedback, and explicit manual coordinate editing in workspace-wide configuration.
CityCatalog owns local data loading/search; LocationEditorModel owns drafts.
The app-level configuration model-service independently owns the accepted location
and changed notifications. Query edits do not mutate it; defaults remain with
consuming features. The workspace host remains generic; Flat Earth now renders through the shared observation capability.
The San Jose search follow-up now preserves all exact-name matches and supports
full state/region names plus punctuation, with region names shown in labels.
Client type checking, build, 75 browser tests, formatting, and focused served
Chrome search checks pass; the unchanged server's four tests passed in the prior
city-picker unit. Search baseline/report/screenshots are under
.codex-tmp/global-configuration/2026-11-05/san-jose-search. The earlier city-picker
baseline, report, and screenshots are
under .codex-tmp/global-configuration/2026-11-05/city-picker. Accepted location is
in memory only. Location-zone behavior, richer editing, further properties,
and rendering consumers remain future work, with no automatic implementation selected by this handoff.
The owner has saved [fuzzy city search and related discoverability ideas](flat/implementation-notes.md#deferred-city-search-improvements)
for later. Keep that work deferred; no implementation is selected.
The owner-requested [localized date-field adaptation note](flat/date-field-adaptation.md)
captures the useful behavior from transfer/Date.jsx and its supporting files,
the Flat ownership boundaries, and open date/time decisions. Its simple first
pass is implemented; the richer editing and location/time-zone adaptation remain design work.
The owner supplied no existing time-entry field; [time entry and location time](flat/date-field-adaptation.md#next-design-work-time-entry-and-location-time)
record the follow-on design work beyond the simple first pass. Entering time in the chosen location's zone is an
option to evaluate. Device-local entry-to-timestamp conversion is implemented;
location-zone lookup and explicit ambiguity policy remain unselected.
The date/time note also records a [unified coordinate lookup and optional zone picker](flat/date-field-adaptation.md#unified-location-lookup-and-optional-override),
with manual override as a possible correction path. No package or picker
implementation has been selected.

The accepted [global configuration design](flat/component-service-proposal.md#global-configuration-and-shared-values)
separates editor presentation from shared data. An editor feature contributes global settings presentation;
a main configuration service owns shared accepted values and notifications.
Page features consume that capability and supply defaults for absent properties;
per-view settings remain with their own models. This replaces the earlier
shared-observation feature proposal. The panel's accepted extension shape uses
registered configuration provider services returning mountable React content,
as described by the [provider contract](flat/component-service-proposal.md#configuration-provider-contract).
The provider now uses the existing contribution mount/release contract. The
location data capability and city/coordinate editor are now implemented;
location-zone date/time behavior and further controls remain future work.

The [Flat Earth base scene](flat/README.md) replaces the earlier placeholder;
its current implementation and verification are owned by the focus above.

The owner-authorized [first workspace implementation](flat/README.md) was
completed and corrected for feature ownership with local verification on
2026-10-29. Its model, controller/view, React frame, contribution service, styles,
types, and tests belong to features/workspace. The app feature retains activation
and navigation through public capabilities. The persistent frame has shared
contribution hosts, one empty view, optional comparison, and scoped nonmodal
configuration. Workspace state, workflow, view projection, and React presentation
follow the [component proposal](flat/component-service-proposal.md).
The base stylesheet now contains shared CSS color variables for the selected
#121212 background and #F2F2F2 text/borders; the blue action token is a
provisional visual approximation pending an exact swatch RGB value.
The [product description](flat/product-description.md) remains input for later
refinement. Location/time-zone-aware controls and additional Flat Earth content
remain future feature work. The intended first
scene integration stays recorded in the [implementation notes](flat/implementation-notes.md).
A focused [React/ReMVC self-review](flat/react-remvc-audit.md) reread both
standards and corrected React/service boundaries, view projection, semantic
render helpers, dependency readiness, and exact lifecycle cleanup. Current
local checks pass; independent standards review remains cancelled.
The owner subsequently added local React requirements in the
[standards overlay](standards/overlay.md#add-react-computations-before-jsx), pending
later canonical promotion. The owner-authorized application pass applies both
rules to the new Flat components. Lists, optional content, labels, and computed
attributes are prepared before JSX, and render helpers own their region wrappers.
Type checking, build, 64 browser tests, 4 server tests, and served UI checks pass.
The focused self-review records the follow-up and its evidence limits.
The accumulated local JSDoc, method/type spacing, control-flow brace, and React
rules have now been applied across all 71 Flat browser/server source and
declaration files, including tests. The [Flat entry](flat/README.md#verification)
owns the current scope and evidence. Client/server type checks, build, formatting,
65 browser tests, and 4 server tests pass. Global promotion remains future work.
Trusted internal page/contribution metadata and feature capabilities are no
longer revalidated. HTTP context resolution now follows registry readiness and
uses the current canonical locale without guessing a missing service contract.
Workspace CSS now ships through its feature-owned build descriptor as a copied,
HTML-linked stylesheet. Browser tests load source CSS explicitly. Build, type,
test, and served-layout checks pass; four captures match the prior rendering.
No further feature work, experiment resumption, or refine-design execution is
automatically selected by this workspace handoff.
The owner cancelled the current standards-review process while the review skill
is still in development. Its partial evidence is preserved; review execution is
stopped and no automatic resumption is selected.
The fresh Flat shell replaces the owner-deleted former shell and remains
separate from the Flat32 integration test bed.
The finished app will be deployed as a discoverable child beneath a separate
Polylith parent; the [deployment posture](production-app/README.md#deployment-posture)
owns that decision. Controlled standalone and discovered shell checks are
recorded by the Flat app entry. Actual parent deployment and production worker
integration remain future obligations.
The [application roles](production-app/README.md#application-roles-and-current-status)
own the current product boundary. Shell scaffolding and the workspace-only first
pass were explicitly authorized; further feature implementation and experiment
resumption are not selected.

Last experiment: poc-experiments/engineering-studies/clean-horizon-profiles,
suspended by the owner on 2026-10-26. Its
[suspension and resumption boundary](poc-experiments/engineering-studies/clean-horizon-profiles/status.md#suspension-and-resumption-boundary)
is retained as context, without an active execution queue. Resume only after
explicit owner selection. No production promotion or new application work is
authorized by the experiment handoff; the later owner request authorizes the Flat
shell and workspace separately.

## Minimal Reload Sources

1. [Repository instructions](../../AGENTS.md).
2. [Production app](production-app/README.md).
3. [Flat shell](flat/README.md).
4. [Elevation/time optimization plan](flat/control-update-optimization-plan.md).
5. [Control optimization execution](flat/control-update-optimization-execution.md).

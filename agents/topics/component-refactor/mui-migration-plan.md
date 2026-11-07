# Flat MUI Migration and Shared Controls

Status: M0–M3 implemented under independent-execution; see the
[execution record](mui-migration-execution.md) for evidence and scoped checkpoints.
M4 remains deferred pending owner selection.
Owner direction recorded: 2026-11-07.

## Outcome and Authority

Move Flat's standard application controls and settings presentation onto MUI,
using the maintained create-app base components and building the agreed shared
controls above that foundation. Work bottom-up while retaining the existing
React views, application behavior and graphics lifetimes.

The original request established the migration plan. The owner's clarification
separately authorized saving the defaults in the actual application context;
that narrow source update is complete. M1 must use those existing context values
when creating MUI controls and theme defaults. The owner subsequently authorized independent execution through M1, including
the real latitude/longitude form, then independently authorized M2–M3. That skill preapproves the checkpoint
adviser's suggested message and task-scoped local commits. Push, publication
and global standards promotion are not authorized.
The suspended dome-cache experiment remains suspended. Engineering standards
reviews remain owner-cancelled; primary verification and the existing checkpoint
adviser continue. The create-plan skill's one plan critique is separate from
standards review.

## Accepted Requirements and Boundaries

- Adopt MUI and the maintained base-component catalog wholesale. Do not make
  local-style or prop-type rewrites a prerequisite for using those sources.
  Fix concrete integration/build/runtime incompatibilities when required and
  document any necessary local deviations.
  The owner specifically requires the imported app-local base controls to read
  the application context defaults; this narrow integration change follows the
  wholesale copy and does not authorize unrelated source rewrites or toolkit edits.
- Shared controls: Button, TypeAhead, Toolbar, Time, Date, Slider and the
  text-and-open/close-arrow interactive panel button. CityPicker remains a
  configuration-specific control composed from TypeAhead.
- [Context defaults](README.md#control-defaults-and-context) are
  `controlSize: 'small'` and `controlVariant: 'outlined'`. Normalize the owner's
  word outline to MUI's outlined value. These are defaults for supporting
  controls, not unsupported props to send to every MUI primitive.
- Preserve the near-black, near-white and blue appearance, existing local date
  and time entry, accepted Unix timestamp, city ranking, shared observation,
  independent cameras and optional comparison view.
- Defer **toolbar conversion**: build the reusable Toolbar and panel-button
  controls now, but keep existing toolbar containers, rows, grouping and layout
  during this migration. Their hosted buttons/selects/sliders migrate to MUI
  in place. Moving the Sun-position slider into a popup and making Flat's
  toolbar a single line are later work.
- Settings surfaces and other application chrome can adopt suitable MUI
  primitives after their controls. Product layout, canvas presentation and
  feature ownership remain with the existing views and CSS.
- Date starts from the owner's transferred MUI Date reference and the existing
  [adaptation note](../flat/date-field-adaptation.md). Preserve the transferred
  files, current timestamp semantics and validated entry behavior. Location/time
  zones, DST policy, calendar/clock popups, animation UI and fuzzy city-search
  changes remain deferred. No MUI X/date-library addition is required for this
  migration's text-entry controls.
- Promote the six local rules only after the Polylith skills review work is
  complete. This migration does not perform that promotion.

## Baseline and Reuse

The inspected HEAD is `7b2a888f`; the meaningful baseline is the current dirty
working tree, not that commit alone. Preserve all existing application, engine,
topic and unrelated work. Capture status/diffs at execution start; do not reset
or require a clean worktree. Recent test/entry changes must also be preserved.

The [integration assessment](base-control-integration.md) found 31 selected
catalog paths for localization/testing: 30 new paths and one existing
TestHarness collision. It also records the provider, phrase, dependency and
test-entry integration. Refresh that inventory against the maintained source
at execution time; counts and source hashes identify what was copied, not a
qualification allow-list. Reuse new maintained controls if the catalog grows.

At M0, React/ReactDOM resolved to 18.3.1 and MUI/Emotion were not declared;
HTML text parsing and the app-specific Polylith/Karma infrastructure already
exist. Select compatible dependency versions and React-is handling from the
selected release's supported installation requirements. Do not upgrade React
or replace repository-wide tooling incidentally.

The app already has AppContext, a localization service with the expected text
boundary, shared date/time helpers, a city catalog, workspace contribution
services and retained rendering sessions. Build on these owners. No backend or
Algorithm32 implementation change is expected for this UI migration.

## Milestones

Initial effort forecasts below are focused engineering effort, not measured
agent wall-clock time or hard budgets. Dependency/build compatibility and the
Date/TypeAhead interaction work dominate uncertainty. Record actual timings
and revise the remaining forecast after the first working slice. Existing
runtimes, Polylith, Karma and the installed browser/GPU are the intended
resources; no native helper builds or new test framework are needed.

### M0 — Current Baseline and Integration Inventory

State: complete. Baseline and source identities are retained in the execution record.

Purpose: preserve the real starting state and find compatibility issues before
replacing controls. Forecast: 0.5–1.5 hours.

- Capture the current working-tree diff/status and affected UI/test/build
  inventory in ignored `.codex-tmp/component-refactor/mui/` output.
- Refresh the maintained catalog, dependency policy, context, harness, phrase
  and styles integration against the actual current files. Retain a source
  manifest with catalog identities and copy/adaptation provenance.
- Establish MUI/base-component applicability in the folder mappings before
  authoring new controls, while preserving local overlays, wholesale-source
  acceptance and the cancelled-reviewer state. Refresh guidance without starting
  engineering reviewers. M4 verifies the final mappings/guide.
- Run the existing Flat client type check, browser suite and normal build once
  to establish the current baseline. Preserve failures and identify their
  ownership instead of erasing unrelated work or calling them migration bugs.
- Inventory actual standard controls and their containing views, including
  toolbar-hosted controls. Mark toolbar containers/layout as deferred, and
  identify semantic HTML/canvas elements that remain ordinary React markup.
- Record version/peer-dependency and browser/build timing observations.
- Confirm availability of Flat's ignored operational stellar and human-vision
  packages for the later real-GPU checks. Preserve their bytes and provenance;
  provision from the established data contract if missing rather than reopening
  an experiment. Record availability as an execution dependency.

Deliverables: baseline inventory, recorded checks and a concrete integration
file list. Advance when the baseline and failure ownership are understood
well enough to distinguish migration regressions. A historical test count,
source hash or unrelated readiness issue is not an execution veto.

First executable step: capture this working-tree baseline and refresh the
catalog selection. No extra owner choice is needed to start that work once
implementation is authorized.

### M1 — MUI Foundation, Context Defaults and First Working Slice

State: implemented; final evidence is owned by the execution record.

Purpose: make the maintained controls work inside the existing app before
converting its consumers. Forecast: 2–5 hours; update from the first build.

- Add only the necessary compatible MUI/Emotion dependencies and lockfile
  changes, including the chosen release's React 18 compatibility requirements.
- Consume the implemented `controlSize` and `controlVariant` values from the
  application context when creating MUI components and deriving defaults.
  AppContextService, the React fallback, ambient type and harness already carry
  them. Preserve them through locale changes and defensive snapshots. No
  persistence, user-preferences screen or runtime preference editor is added.
- Integrate the standard registry-owned theme service and root provider stack
  into the existing main lifecycle. Derive compatible MUI defaults from the
  same context policy, with stable theme ownership and no competing defaults.
  Preserve the app context, ready/stop behavior and fixed dark appearance.
- Keep brand colors, density, typography and product layout in the CSS theme
  layer. Theme component defaults carry behavior/configuration; use supported
  imports, CSS variables/layers and slot APIs. Verify popup/theme behavior for
  local and discoverable app mounts without introducing a new shell type.
- Copy the selected maintained components, helper, declarations and behavioral
  specs wholesale into matching app paths. Reconcile the existing harness,
  preserve browser setup and register the copied specs in the existing suite.
  Add the missing common.close phrase. Do not copy toolkit-only mocks/resolvers
  or rerun new-app creation over Flat.
- Update applicable copied base components to resolve supported size/variant
  defaults from `AppContext.controlSize` and `AppContext.controlVariant`.
  A supplied top-level size or variant prop must always be used; context is a
  fallback only when that prop is absent/undefined. Explicit supported caller
  props take precedence; remove or reconcile any
  hard-coded base defaults that would mask the context policy. Apply the
  recipient and precedence contract below. Do not send outlined to a primitive
  with an unrelated variant API.
- Make this a base-layer responsibility. Product controls built on a base must
  inherit its behavior without separately reading context or forwarding the
  same size/variant defaults. New control foundations without a suitable
  maintained base should establish that boundary once at their lowest reusable
  level. Verify both a base and a concrete consumer inherit the defaults, and
  that supported explicit overrides continue to work. Check base consumption
  independently of theme defaults, then check the real provider stack separately.
- Prove a small outlined button and small outlined input in an existing React
  view or existing test-mounted app surface. Keep the rest of the view intact.

Deliverables: working foundation, runtime context defaults and a small real
application slice. Evidence: client types, copied component suites plus existing
tests, a normal build, and one actual UI capture showing compact dimensions and
the retained dark palette. Record the measured dimensions and source/settings
in text/JSON; the image demonstrates actual appearance, not a status table.

Advance when the foundation builds and its components behave correctly with
Flat's real context/registry. Repair the affected integration if a maintained
component encounters a concrete incompatibility; do not launch an unsolicited
standards rewrite. Report the first visible slice promptly.

### Base-control Default Contract

Apply defaults to the actual interactive MUI recipients, including children
created inside compound bases. An outer FormControl/Dialog alone is insufficient.
The override locations below are existing props where available and narrowly
specified integration additions where absent; consume/document them at the
base boundary rather than leaking them to an unrelated DOM/MUI container.

| Base               | Actual MUI recipients                                | Context policy                                     | Supported override location                                               |
| ------------------ | ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------- |
| BaseButton         | Button                                               | size and variant                                   | Top-level size/variant; explicit priority as described below              |
| BaseTextInput      | TextField and its consistent input/label composition | size and variant                                   | Top-level size/variant; preserve supported behavioral slot props          |
| BaseSelect         | FormControl, InputLabel and Select/input composition | Resolve size/variant consistently across the field | Top-level size/variant, then selectProps size/variant                     |
| BaseCheckbox       | The actual Checkbox passed to FormControlLabel       | size only                                          | Top-level size, then checkboxProps.size                                   |
| BaseRadioButtons   | Every actual Radio                                   | size only                                          | Top-level size, then documented radioProps.size integration               |
| BaseDialog actions | Each action Button                                   | size and variant                                   | action.size/action.variant; explicit action.priority uses the Button rule |
| BaseDialog close   | The actual IconButton                                | size only                                          | Documented closeButtonProps.size integration                              |

Supplied base size/variant props always take precedence. Supported nested
recipient props may supply a value only when the corresponding base prop is
absent; compatible AppContext defaults are the final fallback. Resolve each
property independently, using absence/undefined rather than a truthiness test.
Preserve Select label/input/outline
consistency when resolving a child override. Do not forward outlined to
Checkbox, Radio, RadioGroup or IconButton, or apply it as a Dialog variant.

Button variant precedence is deterministic: a supported explicit variant wins;
otherwise an explicitly supplied priority maps primary to contained and
secondary to outlined; otherwise consume context.controlVariant. An omitted
priority must not be defaulted early in a way that masks context. Size resolves
from an explicit supported size before context.controlSize. Use the same policy
for dialog action buttons. Test omitted priority, both explicit priorities,
explicit variant, and a conflicting explicit variant/priority pair.

For every row, verify absent caller props consume injected context, supported
overrides win, and the resolved values reach the actual inner MUI controls.
Include conflicting top-level versus nested values to prove a supplied base
size/variant cannot be masked by child props, priority mapping or theme defaults.
Use compatible synthetic alternate context values in focused tests to
distinguish a context read from coincidental small/outlined theme or hard-coded
defaults; this adds no runtime preference editor. Prove a concrete control
inherits without reading/forwarding defaults itself. Check these base cases
independently of the app theme and separately verify the real provider stack.
The button/input appearance slice remains early visual evidence, not the full
proof of default propagation.

### M2 — Agreed Shared and Configuration Controls

State: complete; verification and the local checkpoint are in the execution record.

Purpose: complete the control layer before replacing containing surfaces.
Forecast: 4–10 hours; re-estimate Date/TypeAhead work using M1 findings.

- Button: product-facing behavior on BaseButton, defaulting to small/outlined.
  Apply the explicit variant/priority/context precedence above; do not
  accidentally introduce contained defaults through wrapper or theme choices.
- TypeAhead: reusable MUI Autocomplete-based presentation receiving prepared
  options, text and intents. Keep domain lookup/search outside the control and
  preserve supplied ranking rather than re-filtering already ranked results.
  Keep query-change intent distinct from option selection and MUI's internal
  reset reasons: selecting an option must not cause an unintended new search
  or overwrite the owner's query. Preserve selection by stable ID when refreshed
  results contain new option objects. Escape closes/consumes the results popup
  before any containing panel handles that key.
- CityPicker: configuration-owned composition of TypeAhead, preserving city
  name/detail presentation, stable selection and the existing CityCatalog.
- Date: adapt the transferred MUI field/adornment/feedback and editing approach
  to current React/ReMVC ownership and selected MUI slot APIs. Keep validated
  local-format parsing, unfinished drafts and acceptance semantics; preserve
  current behavior where richer transferred editing details remain undefined.
  Remove the reference's render-time state changes and original app-specific
  context/data-cache assumptions in the adapted app component.
- Time: MUI-based local-format entry using the current shared clock/formatting
  helpers and prepared labels, drafts and feedback. Accept into the same shared
  timestamp through the existing owner.
- Slider: controlled MUI range presentation with change/commit and interaction
  start/end/cancel support. Preserve pointer, keyboard, blur and unmount cleanup;
  Flat's frozen time reference and shared seeking remain in its owning feature.
- Toolbar: a reusable MUI control container, ready for later adoption. Map
  compact density through supported Toolbar configuration/CSS; do not forward
  outlined as a Toolbar variant. Existing application toolbar hosts stay intact.
- Panel button: a small outlined text-and-arrow trigger for interactive content
  in an anchored panel. Implement/test it as a reusable control without moving
  any Flat controls into it yet. Use a nonmodal anchored panel as the initial
  assumption, with toggle and Escape/click-away dismissal. Escape or an explicit
  close returns focus to the trigger; clicking another focusable control keeps
  that new focus. Nested TypeAhead popup interactions must not accidentally
  dismiss the parent panel. Final placement/grouping remains deferred to toolbar
  conversion.
- Preserve literal versus phrase-key text contracts, supported disabled/error
  states, meaningful focus/ref capabilities and the source's native/MUI
  semantics. Inherit context defaults through the underlying base; do not
  duplicate context-default plumbing in every concrete control. Controls without
  size/outlined APIs receive deliberate composition/CSS treatment.

Deliverables: shared controls, configuration-specific CityPicker, declarations
and focused behavioral coverage in the existing test lane. Evidence includes
keyboard/pointer operation, date/time commit and invalid-draft cases, city
selection/ranking, context defaults and panel focus/closing behavior. Use the
TypeAhead cases above to verify query/selection separation, refreshed object
identity and first-Escape dismissal, including a TypeAhead inside the panel.
Use the
existing real-component harness for isolated controls; no demo route/gallery
or new test framework is required. Capture one implemented interactive-panel
example because anchoring, arrow state and control density require visual
inspection.

Advance when the agreed set is usable with current feature data and correctly
separated from domain behavior. The owner-selected reference files remain
unchanged. Resolve only affected control contracts before moving on.

### M3 — Bottom-up Application Usage and Settings Migration

State: complete. Consumer migrations, type/browser/build checks and actual
local/discovered app evidence are recorded in the execution record.

Purpose: get the application working through the completed MUI control layer.
Forecast: 4–9 hours, refined from the first migrated feature.

- Migrate global configuration's city, coordinate, date/time, apply/retry and
  feedback controls, preserving its model/controller/view contracts.
- Migrate Flat Earth's Sky, elevation, FOV, Center on Sun, retry, time slider
  and numeric entry to the shared controls in their existing positions. Keep
  the current toolbar rows and the Sun slider's current inline placement.
- Migrate workspace/app buttons, scene selectors, configuration scope/section
  selectors, close/collapse actions and other standard inputs in place.
- Adapt event/value boundaries: MUI select/slider callbacks differ from native
  currentTarget.value handlers. Preserve numeric types, exact view identities,
  selected values, drafts and shared-time gesture ownership.
- Preserve focus restoration and usable element/action refs across shared
  wrappers; use supported MUI capabilities or concrete adapters where class
  base components do not expose the native ref expected by an existing caller.
- After controls are converted, migrate suitable configuration/settings and
  other non-toolbar chrome to MUI surfaces, typography, feedback and dividers.
  Preserve nonmodal behavior and existing responsive/product layout.
- Keep existing toolbar containers and canvas hosts stable. Their controls can
  become MUI without replacing the containers or invoking new page lifetimes.
  Remove obsolete control-specific CSS only after its consumers are migrated.

Deliverables: completed consumer inventory, migrated features and settings with
toolbar-container exclusions explicitly marked. Acceptance requires standard
interactive controls to use the MUI/shared layer throughout Flat; semantic
HTML, custom graphics and the deliberately deferred toolbar containers are
valid remaining React markup, not incomplete control migrations.

Evidence: existing application and component tests with meaningful MUI/portal
queries; city/date/time/configuration workflows; both views' independent
controls; unchanged draft/collapse/close behavior; and captures of the actual
settings surfaces and unchanged toolbar arrangement. Advance after migration
regressions are fixed or bounded limitations are reported against the goal.

### M4 — Full Application Verification and Handoff

Purpose: demonstrate that the application works with the new control layer and
prepare a clear boundary for the later toolbar work. Forecast: 2–5 hours.

- Run final client types, the complete Flat UI/component suite, relevant server
  regressions if integration touches their collaborators, normal builds, scoped
  formatting and Git whitespace checks. Reuse valid unchanged engine/scientific
  evidence; this is not a new atmospheric qualification campaign.
  Smoke-check affected sibling build paths if shared dependency changes alter
  their resolution; converting Flat32 is outside this plan.
- Verify the supported standalone/local and discoverable-mounted app behavior,
  including CSS assets, theme variables, popup containers, routing and cleanup.
  Use a local staging host for composed mounts where needed; do not deploy or
  write into an external host repository. Label any untested deployment behavior.
- Exercise location and date/time changes, shared degrees-from-closest seeking,
  interrupted slider gestures, invalid drafts, one/two views, close/reopen,
  control collapse, page settings, retry and recoverable errors.
- Perform actual GPU application checks for Sky modes, dim atmosphere-off
  ground, human-filtered stars, elevation/time changes and independent cameras.
  Verify that UI interactions preserve the mounted canvas and retained scene,
  shader handle/programs and compatible cache construction except for already
  documented first-use direct-render compilation. Do not demand identity of
  physical observation lease wrappers across time/height updates.
- Verify context small/outlined defaults in real rendered controls and all
  relevant provider/test contexts. Check visual density and essential focus
  behavior at the existing normal/wide and comparison layouts.
  Confirm derived controls receive them through their base without redundant
  per-control context reads, and verify supported explicit override precedence.
- Verify the earlier MUI/base-component folder mappings and regenerate/check the standards
  guide while preserving local overlays, the deferred rule-promotion boundary
  and owner-cancelled reviewer state. Keep newly authored code under applicable
  local rules; preserve wholesale maintained-source acceptance.
- Finish the overall report, current topic state and remaining-toolbar inventory.
  The later toolbar conversion begins from these completed controls and is not
  silently started as the final action of this plan.

Completion: the agreed controls and active application usage work with MUI,
context defaults are authoritative, behavioral/visual/build evidence is linked,
and only the documented toolbar conversion and other explicitly deferred
features remain. Report any material unmet requirement instead of declaring
completion on test counts alone.

## Evidence, Recovery and Resumption

Create `mui-migration-execution.md` when execution starts. Maintain a compact
current-status table for M0–M4, current findings, the next concrete action,
outstanding checks/dependencies and links into the ignored output root. Keep
chronology in its execution log, not in current-state prose. Preserve baseline,
failed attempts and earlier evidence without overwriting them.

At each milestone, publish a short report with completed work/artifacts,
observations versus interpretation, tests/limitations, and the disposition and
next action. Report useful working slices and captures when available rather
than waiting for the end. Image artifacts are limited to actual appearance,
compact geometry, popup positioning or rendered scene preservation; use text
and JSON for inventories, measurements, timings and test results.

Diagnose and repair the affected dependency, copied-source integration, control
or consumer when checks fail; retain completed work and rerun only invalidated
checks. A broken dependency/behavior is a concrete compatibility problem; a
changed hash, elapsed estimate or unperformed cancelled review is not a veto.
Re-estimate remaining work from measured progress without inventing budgets or
approval pauses. Reuse valid unchanged evidence and record what invalidates it.

No further discretionary review rounds are planned. Substantial changes to
scope/acceptance or overall approach receive the create-plan skill's bounded
plan critique; routine fixes and evidence-driven implementation choices within
this scope do not restart it. Any new specialist request must name its precise
question, smallest scope, completion condition and whether it gates progress;
it cannot enable cancelled engineering reviewers.

## Plan Critique

One independent read-only critique was completed on 2026-11-07 by
`mui_migration_plan_critique`, as required by create-plan. It was a plan review,
not an engineering standards review. All recommendations were incorporated:

- Added the context-defaults owner and selected-MUI status to the topic entry,
  and reconciled the linked Date note's older native-presentation direction.
- Made TypeAhead query/selection/reset behavior, stable IDs and Escape
  consumption explicit, including nested popup cases.
- Moved standards-mapping preparation before new control authoring, retaining
  final guide verification without restarting cancelled reviewers.
- Defined panel focus restoration by dismissal reason so click-away does not
  steal newly placed focus.

No suggestions were rejected. The primary agent checked the reconciled plan
and its links before handoff. No further critique is required for these bounded
clarifications; the substantial-replanning trigger above still applies.

The owner subsequently requested another independent review of the updated
plan. On 2026-11-07, `mui_updated_plan_review` identified three focused gaps:
compound-control recipients, explicit Button precedence and discriminating
context-inheritance tests. All were incorporated in the Base-control Default
Contract and M1/M2 acceptance requirements. The
[updated-plan review record](mui-migration-updated-plan-review.md) preserves
the findings and disposition. No source implementation or standards review
was performed by this review, and no recommendations were rejected.

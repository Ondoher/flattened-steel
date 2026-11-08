# Flat Page Icon Toolbar Implementation

Status: execution authorized through independent-execution on 2026-11-08;
M1 in progress. See the [execution record](toolbar-implementation-execution.md).
Owner request: 2026-11-08.

## Outcome And Starting Point

Replace each view's multi-row controls with one compact row of icon commands,
using the direction and seven icons owned by the
[toolbar refactor notes](toolbar-refactor.md). The same controls work in the
single view and optional two-view workspace. Current selections appear inside
the opened choices, while common location/date/time remain in the app bar.

This is application implementation, not a new design-research or shader task.
The initial working slice is an actual Sky dropdown and clock slider popover in
the app. Completion means the full toolbar is usable, localized, visually
verified at representative widths, and retains existing state and scene
lifetimes. No application changes are part of creating this plan.

Reusable foundations:

- Shared Toolbar, Button, Slider and the MUI theme, with AppContext defaults
  `controlSize: small` and `controlVariant: outlined`.
- PanelButton now delegates its popup, dismissal and focus behavior to MUI
  Popover. It currently has a text/arrow trigger, so icon presentation still
  needs implementation.
- Existing camera/Sky actions, choices and per-view state in FlatEarthViewTools;
  shared-time editing and gesture handling in FlatEarthTimeControls and its
  owning view/controller/model-service.
- Generic workspace page selection, settings hosting and contribution lifetime
  management in ViewportFrame and the workspace services.
- Existing primary verification: 209 browser tests, Flat type checking and the
  production build passed for the format-hint control milestone. Evidence:
  `.codex-tmp/component-refactor/format-hint/`. This is a starting observation,
  not validation of toolbar changes. Recheck after relevant changes.

The working tree contains uncommitted control/localization work, including owner
edits. Preserve it. At execution start record HEAD, current diff and hashes of
the files in the selected unit. Do not reset to the last commit as a baseline.

## Boundaries And Deferred Corrections

- Workspace owns scene choice, settings navigation and optional-view closure.
  It must not import Flat's private components or identify Flat's commands.
- Flat owns Sky, elevation, FOV, shared-time entry and Sun aiming. Its React
  presentation talks to its own view; controllers coordinate services.
- Models are exclusively registered services. Utilities remain utilities;
  popup state is transient component state. This work needs no new model.
- The owner rejected the substituted date parser: adapting the transferred
  IntlDate parsing/editing behavior is deferred. Misclassified utilities under
  model names/folders are also deferred. Passing tests do not establish that
  those issues were correctly implemented. Neither repair is a prerequisite
  for moving the existing degrees-from-closest slider into a popup.
- Preserve the configuration panel's full slider/numeric editor and existing
  date/time/location entry. Do not redesign the app bar or configuration pages.
- Preserve timestamp ownership, scene mounting, caches, shaders, rendering
  algorithms and current control performance. The dome experiment stays paused.
- Engineering standards reviewers remain cancelled. Use primary self-review,
  local checks and checkpoint-adviser monitoring. This plan's one independent
  critique is a plan review, not source standards review.

## Proposed Interaction Defaults

These fill the open details in the design notes for this plan. They are proposed
implementation choices, not previously accepted product decisions. Owner edits
to the plan supersede them; execution may use them when this plan is authorized.

| Concern          | Proposed behavior                                                                                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Order            | Scene/model, separator, Sky, elevation, FOV, clock, Center on Sun, separator, view settings.                                                                                                                                                                                                                  |
| Trigger          | Small outlined icon control with localized tooltip and accessible name; no persistent value or dropdown arrow.                                                                                                                                                                                                |
| Choices          | MUI Menu/MenuItem with the selected item marked visually and semantically; retain disabled choices and MUI keyboard navigation. Selecting a choice closes the menu and invokes the existing command once.                                                                                                     |
| Time             | MUI Popover containing the existing slider, current degree readout, closest reference, shared-time explanation and settings shortcut. Full numeric editing remains in configuration.                                                                                                                          |
| Missing location | Keep the clock available. The panel explains that time positioning needs a location and offers the existing location-settings shortcut; disable only the unavailable slider.                                                                                                                                  |
| Popup behavior   | Retain MUI's modal behavior: Escape or backdrop dismisses and restores focus; outside clicks dismiss before another toolbar command can be activated. No click-through requirement.                                                                                                                           |
| Focus            | Use MUI focus management and declarative autofocus on the intended interactive child. No DOM queries or manual focus restoration in popup controls.                                                                                                                                                           |
| Settings handoff | Store one pending navigation intent, close the popup, finish its edit gesture and let MUI complete focus restoration before opening/focusing configuration. Use its transition lifecycle rather than a fixed timeout. Cancel the pending intent if its owner unmounts, its page changes or the popup reopens. |
| View identity    | Keep an accessible per-view heading; remove its persistent visible heading from this toolbar.                                                                                                                                                                                                                 |
| Optional view    | Keep a workspace-owned Close icon, distinct from the settings command, for the second view only.                                                                                                                                                                                                              |
| Collapse         | Remove collapse for the new one-row toolbar; there will be no hidden second control row.                                                                                                                                                                                                                      |
| Narrow widths    | Keep a single row. Let contribution wrappers shrink and put overflow inside a horizontal scrolling control region, with the optional-view close action outside it. Bound portalled popup width to the viewport and retain usable slider space. Keyboard focus must expose scrolled controls.                  |

Do not create a global popup registry. MUI's modal surface handles ordinary
exclusive pointer interaction. Programmatic page replacement or view closure
must release its own open popup and listeners through component lifetime.

## Component And Ownership Outline

Names below describe proposed files and can be adjusted without changing owners.

| Area                                              | Responsibility                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/IconButton.jsx`                       | Concrete shared MUI IconButton plus Tooltip; localized command name, supported explicit size override and context fallback. Forward native button attributes, including data-view-id and event handlers, to the actual button. Give the product's outlined appearance a CSS class: MUI IconButton has no Button-style variant prop to forward. |
| `components/IconMenuButton.jsx`                   | Shared icon trigger and MUI Menu for controlled choices. It owns open/anchor state; caller owns selection and command handling.                                                                                                                                                                                                                |
| `components/PanelButton.jsx`                      | Add an icon-trigger mode using the shared icon control, reusing the existing Popover lifecycle. Preserve the existing text/arrow mode for other callers. Supply a declarative close/completion path for navigation from inside the panel.                                                                                                      |
| Shared control contracts/styles/phrases           | Ambient named contracts; localized tooltips/menu names; CSS-variable colors and outlined/selected/disabled presentation. Explicit supported props win over context defaults. No `sx`, inline styles or localization switches/fallbacks.                                                                                                        |
| `flat-earth/components/FlatEarthViewTools.jsx`    | Feature-owned Sky/elevation/FOV menus and Sun action; compose the feature's clock control in the intended order. Keep its configuration presentation available.                                                                                                                                                                                |
| `flat-earth/components/FlatEarthTimeControls.jsx` | Toolbar mode uses the clock-triggered panel; configuration mode retains its existing full editor. Reuse the actual slider and time gesture owner.                                                                                                                                                                                              |
| `flat-earth/controller.js`, its view/contracts    | Route existing commands and expose existing presentation. Register a coherent feature toolbar contribution instead of a separate secondary time row; preserve removal tokens and edit-owner identities.                                                                                                                                        |
| `workspace/components/ViewportFrame.jsx`          | Compose shared Toolbar, generic scene menu, registered controls and generic settings/close actions into one row. It does not know Flat's control implementations.                                                                                                                                                                              |
| Workspace projection/contracts/styles             | Render existing contribution slots in the single row where needed for compatibility; remove the obsolete collapse/second-row layout without broad service API changes.                                                                                                                                                                         |

Models and runtime implementations should not need changes. If a presentation
refactor appears to require such a change, first check the existing view contract
and record the specific need; do not move orchestration into React.

Define a single text-resolution owner for each shared command control. Its public
label input is LocalizedText; resolve it once and reuse the resulting display
string for the tooltip, accessible name and popup name as applicable. A composed
icon trigger receives prepared display text through its internal presentation
contract, rather than treating that text as another phrase key.

## Milestones

### M1 — Real Sky Dropdown And Clock Popover

Purpose: prove the new trigger/choice controls and the largest interaction risk
in the actual app before converting all the chrome.

- [ ] First executable step: capture the current source/diff baseline and
      source-bound control inventory. Confirm the saved icons and current public
      view callbacks; preserve unrelated owner edits.
- [ ] Implement the shared icon control, menu control and PanelButton icon mode
      over MUI. Localize copy exactly once; pass names to both Tooltip and the
      icon-only button's accessible label. Suppress hover tooltips while their
      popup is open, and do not expose duplicate live text.
- [ ] Replace the real Sky select's toolbar presentation with its icon menu.
      Preserve configuration-mode selection and the existing per-view command.
- [ ] Put the real alternate-time slider behind the clock icon, removing the
      simultaneous inline copy. Preserve the full configuration editor.
- [ ] Add the unavailable-location explanation and location shortcut to this
      toolbar popup; retain clock access while only the slider is disabled.
- [ ] Resolve gesture release on Escape, backdrop, pointer cancellation,
      disabling and unmount at both layers: stop the actual Slider interaction and
      its MUI drag listeners as well as ending the feature's edit token. Dismissal
      must prevent further seeks while the Popover exit transition is running.
- [ ] Close the popup before handing focus to settings or location editing.
      Deliver one pending intent only after closure; cancel it on unmount, page
      replacement or reopening. Check configuration initially closed and already
      open using the existing configuration request/focus contract. Keep partial
      numeric editing in configuration intact.
- [ ] Check named/bound handlers, calculations before JSX, region ownership,
      ambient types, JSDoc format and CSS ownership against the applicable standards.

Deliverables/evidence: working Sky and clock controls, focused extensions to the
existing browser specs, and actual app screenshots of the Sky/clock controls
within the existing toolbar layout, with the popup closed and open. The complete
single-row composition is an M2 deliverable. These images establish icon size,
contrast, alignment and usable slider space, not just that DOM elements exist.
Link them promptly in the
execution record and progress update. Record state/callback observations as text.

Advance when choices reflect the controlled value, the Sky action targets its
view exactly once, time edits use the shared timestamp, all dismissal paths end
both gesture ownership layers, and closing/navigating does not steal
configuration focus or deliver stale/duplicate navigation. Use
`npm run typecheck:flat` and the existing `npm run test:ui:flat` lane; do not
rewrite the harness or generate an alternate test bundle. Repair the affected
control if this slice fails before expanding the conversion.

Estimate: 1–2 hours, principally depending on popup-to-settings handoff and
MUI transition behavior. Update this estimate from the working slice. No new
package or service should be required.

### M2 — Complete Single-Row Toolbar In Both Views

Purpose: compose the validated controls without coupling workspace to Flat.
Depends on M1's interaction evidence.

- [ ] Convert elevation/FOV to controlled icon menus and Center on Sun to its
      direct icon action. Retain non-preset camera values as selected choices and
      existing pending/disabled behavior.
- [ ] Compose Flat's toolbar controls, including the clock, as feature-owned
      content in the proposed order. Remove its old secondary-row registration;
      keep configuration contributions and their existing scopes. Update cleanup
      currently keyed to `flat-earth-time-toolbar` so the merged contribution still
      retires the correct interaction/token once, including mid-edit view closure.
- [ ] Convert workspace scene choice and settings to the selected icons through
      generic metadata/callbacks. Keep scene switching and configuration focus routed
      to the exact view. Keep the second-view close action with workspace.
- [ ] Adopt the shared Toolbar in ViewportFrame, retaining semantically named
      contribution regions. Preserve generic slot compatibility where necessary
      without rendering a second row or identifying feature-specific controls.
- [ ] Remove obsolete visible view headings, collapse controls and related
      state/styles. Keep accessible view names and optional-view close intent.
- [ ] Implement horizontal overflow and persistent access to Close on narrow
      views. Ensure nested contribution wrappers shrink rather than widening their
      viewport. Keep identical command vocabulary/order in one- and two-view layouts.

Deliverables/evidence: all seven commands available in the running app, with
single- and two-view captures showing real content. Extend existing workspace
and feature specs for scene/menu selection, scoped camera/Sky changes, shared
time updates, configuration routing, and optional-view closure.

Advance when both views have one toolbar row, every command is reachable,
popups stay inside the viewport, menu values match controller state, and opening
or dismissing UI does not recreate a scene/canvas, build a cache or seek time.
Actions themselves continue through their existing implementation. Compare
canvas/session identities and command/prepare counters where appropriate;
do not add a shader-performance experiment.

Estimate: 1–2 hours after M1, with contribution composition and narrow-view
layout as the dominant unknowns. Reuse shared controls; no parallel agent work
is required for these closely related host/feature changes.

### M3 — Verify And Hand Off

Purpose: verify appearance, lifetime safety and integration across the completed
toolbar. Depends on M2; it is not another design or standards-review pipeline.

- [ ] Exercise single view, two views, configuration open, no location, pending
      height, unsupported/custom presets, long translated labels and narrow widths.
      Start with 1440px single view, 1440px two views, 800px two views and a 360px
      window; record the actual per-view width rather than relying on window size.
- [ ] Verify mouse and keyboard invocation, selected menu items, Escape/backdrop,
      slider keyboard/pointer cancellation, open-popup page replacement and closing
      a view mid-edit. Check exactly-once gesture release and listener cleanup.
- [ ] Verify settings navigation after popup dismissal, nested interactive
      content and semantic names; respect MUI focus/backdrop behavior. Cover pending
      navigation cancellation on owner change/reopening, and settings already open.
      Check disabled choices, native data-view-id routing, selected-choice semantics,
      long translated popup copy and no seek after dismissal starts.
- [ ] Run Flat types, the existing browser suite and normal
      `polylith build flat`. Reuse earlier results only if their source/contracts
      remain applicable; rerun affected checks after fixes.
- [ ] Inspect actual rendered single/two-view and narrow appearances. Capture
      only the useful final examples proving one-row composition, popup geometry,
      focus visibility and overflow; keep explanations and results in text.
- [ ] Review removed CSS/props and source references for obsolete toolbar
      remnants; preserve other shared consumers and owner edits.
- [ ] Update the topic's current state, source contracts and execution record,
      and request the existing checkpoint adviser's milestone assessment. A commit
      requires its own authorization; there is no push/publication in this plan.

Complete when checks and visual inspection support the original outcome, with
material limitations named. Repair only affected parts after failures; do not
restart completed milestones or repeat unchanged suites without a reason.

Estimate: 1–2 hours, including real-browser/layout fixes. Overall estimate:
3–6 hours, advisory rather than a resource cap. GPU cache warm-up, if required
for a real scene capture, is an additional uncertain startup cost; use existing
compatible cached content and record that cost separately. Tooling/browser
access is the only external execution dependency; remove disposable profiles
on success and failure, and retain no cookies/caches as evidence.

## Execution Record, Recovery And Handoff

On authorization, create `toolbar-implementation-execution.md` beside this plan.
Store generated logs/screenshots below ignored
`.codex-tmp/component-refactor/toolbar-implementation/`. Do not write execution
artifacts while merely planning.

For rendered evidence record viewport and per-view widths, locale, selected
scene, one/two-view mode, location/time, open panel and relevant focus target.
Keep scene state consistent across meaningful layout comparisons.

At the end of each milestone record: completed work and links; what the evidence
shows versus interpretation; remaining limitations/failed checks; and the next
action/disposition. Keep an explicit current milestone, source identities and
unfinished items so another session can resume. Report useful intermediate
images as they become available, rather than holding them for final handoff.

If one MUI composition fails, diagnose and preserve its evidence, then repair
the affected control using the same standard components. An inability to get
the proposed interaction working should update the plan's recorded decision,
not silently reintroduce custom DOM focus management, change toolbar scope or
enable cancelled reviewers. Seek owner input only for a material change to
product behavior that cannot be resolved within this plan.

Final report: show the resulting toolbar, link evidence and checks, state which
milestones completed, and retain the deferred IntlDate/model-utility corrections
as explicit follow-ons. This plan does not authorize implementation until the
owner selects execution.

## Plan Critique

The create-plan skill's independent, read-only critique is complete. All six
recommendations are incorporated; the [review record](toolbar-implementation-plan-review.md)
owns the findings and reconciliation. No further critique or standards review is
requested by this plan.

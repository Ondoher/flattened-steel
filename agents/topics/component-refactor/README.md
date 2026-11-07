# Component Refactor

Status: M0–M4 are complete under the owner's independent-execution
authorization. Shared MUI controls are used throughout the app's existing
control positions and nonmodal configuration surfaces. The
[execution record](mui-migration-execution.md) owns verification and scoped
local checkpoints. The [saved migration plan](mui-migration-plan.md) is complete.
Toolbar conversion remains a separate follow-on task.

Focus: establish reusable controls for the Flat application, then use them to
fit the Flat page controls into a single-line toolbar. These are controls and
control containers, not full-page components.

## Control Scope

The owner identified these common controls:

| Control                     | Current implementation                                      | Intended responsibility                                                |
| --------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Button                      | Shared Button over maintained BaseButton                    | Common button presentation and interaction                             |
| Type ahead                  | Shared TypeAhead; CityPicker supplies prepared city results | Reusable controlled type-ahead presentation                            |
| Toolbar                     | Shared Toolbar available; existing workspace hosts retained | Common toolbar container for later toolbar conversion                  |
| Time                        | Shared MUI TimeField                                        | Reusable local-format time entry                                       |
| Date                        | Shared MUI DateField                                        | Reusable local-format date entry                                       |
| Slider                      | Shared Slider used by FlatEarthTimeControls                 | Reusable slider presentation and interaction                           |
| Text-and-arrow panel button | Shared PanelButton available; adoption deferred             | Open and close a small interactive panel from a labeled toolbar button |

Common controls belong under `src/flat/components`. PanelButton composes a
shared Button trigger and a nonmodal MUI Popper/Paper surface.

CityPicker is a configuration-specific control under the global-configuration
feature. It composes the common TypeAhead control, retaining city-specific
presentation and selection. CityCatalog continues to own city data and search.

Shared controls receive prepared values, labels and callbacks. Domain rules,
configuration writes, registry lookup and orchestration stay with the existing
models/services, controllers and owning views. Existing page/editor/workspace
components compose these controls and retain their current responsibilities.
WorkspaceToolbar remains the workspace's contribution/action host; the common
Toolbar supplies reusable control layout rather than workspace behavior.

## Control Defaults and Context

The owner selected these application-wide control defaults:

| AppContext field | Value    | Meaning                                                                 |
| ---------------- | -------- | ----------------------------------------------------------------------- |
| controlSize      | small    | Use small controls where the MUI component supports size                |
| controlVariant   | outlined | Use MUI's outlined appearance where the component supports that variant |

The owner's word outline is normalized to MUI's outlined spelling. These
values are implemented in the application-context service, React fallback
context, ambient contracts and test harness. Plan milestone M1 consumes
these actual AppContext values when constructing MUI controls and deriving
compatible theme defaults. The applicable copied base components consume these
fields. Controls
built on those bases inherit the defaults without separate context reads or
repeated size/variant forwarding. Supported explicit caller props override
the base defaults. This targeted app-local integration follows the wholesale
source copy; it is not a prerequisite style rewrite of the maintained catalog.
A supplied base size or variant prop must always be used. Resolve each
independently; context is the fallback for an absent/undefined prop. Nested
control props must not override an explicitly supplied base size or variant.
It must not blindly forward outlined to Toolbar, Slider, Typography
or another component with a different variant API. No user preference editor
or persistence is part of this work.

Context snapshot and locale-preservation checks remain in the existing suite.
M1 adds independent base/context and real-provider checks; its
[execution record](mui-migration-execution.md) owns current verification evidence.

The plan's [base-control default contract](mui-migration-plan.md#base-control-default-contract)
identifies the actual inner MUI recipients and override precedence, including
compound fields and dialog buttons. The [updated-plan review](mui-migration-updated-plan-review.md)
records the independent findings incorporated into that contract.

## Standard Base Controls and MUI Foundation

The owner selected MUI and create-app's maintained standard base controls as
its foundation. M1 installed that catalog, preserving the existing harness and
app lifecycle. Manual latitude/longitude inputs and their Apply action now use
BaseTextInput and BaseButton. M2/M3 migrated the remaining standard controls.

Start the planned migration with the shared create-app/initialize-project base-component
catalog and its declarations and behavioral specs. That catalog includes
BaseButton, BaseTextInput/TextInput, BaseSelect/Select, checkbox and radio
controls, helper/form messages, BaseDialog and localization-dependent text
components. Preserve existing application context and test-harness behavior
when integrating the maintained sources.

The owner accepts taking the maintained components wholesale when implementation
is authorized, without a preliminary rewrite for local styling or type-contract
preferences. The owner expects them to meet the standards; no completed review
has established otherwise. M0–M4 are complete without restarting engineering reviewers.
The narrow context-default integration and concrete compatibility
adaptations are recorded in the execution record.

The [base-control integration assessment](base-control-integration.md) records
the exact 31-path catalog selection, the existing harness collision, supporting
MUI wiring and phrase/test changes required for Flat. Its earlier suggested
local-rule rewrite prerequisite has been withdrawn in accordance with the
owner's wholesale-source acceptance.

The maintained catalog does not supply TypeAhead, Toolbar, Slider, Date/Time
fields or the text-and-arrow panel button. M2 implements those shared app
controls on MUI, with CityPicker composition, inherited defaults, interaction
checks and a real panel capture. M3 adopts the remaining consumers in place.

For Date, the owner selected the transferred
[Date.jsx](../../../transfer/Date.jsx) as the starting point to revisit. It
already uses MUI FormControl, TextField, InputAdornment and FormHelperText.
The existing [date-field adaptation note](../flat/date-field-adaptation.md)
owns the reusable editing behavior, known limitations and responsibility split.
Use that reference alongside the current DateField and date/time helpers when
adapting the control; preserve Flat's accepted timestamp and local-format entry
behavior. The transferred files remain reference material.

## Migration Direction

The preferred migration direction is bottom-up. Introduce MUI controls into
the existing standard React views first, then move their containing surfaces
over once the controls are ready. This keeps the initial work centered on
control behavior and avoids combining it with a surface/layout redesign.

Theme/provider integration is enabling infrastructure at the application root;
it does not require replacing the surrounding page components. Build upward
from the maintained base controls to shared and configuration-specific controls,
including Date, Time, TypeAhead and CityPicker. Toolbars, configuration surfaces
and broader workspace chrome follow their contained controls. The single-line
Flat toolbar redesign remains later work. The saved migration plan turns this
direction into milestones; M0/M1 are implemented and later migration milestones remain deferred.

During this plan, convert controls hosted by the current toolbars in place
while preserving their containers, rows, grouping and layout. Build the common
Toolbar and interactive panel-button controls, but adopt them into the actual
toolbars and relocate the Sun slider only in the deferred toolbar conversion.

## Deferred Rule Promotion

After the Polylith skills review work is complete, promote the six existing
repository-wide local additions: computations before JSX; render helpers owning
their region wrappers; JSDoc descriptions starting on the next line; braces for
control-flow bodies; blank lines before following methods' JSDoc; and blank
lines between named type definitions. Promotion is a later follow-up, not work
to perform during this planning discussion. Canonical typing requirements are
separate from these six local additions.

## Flat Toolbar Direction

The control migration is complete. This section owns the remaining-toolbar
inventory; implementing it requires a separately selected task.

| Existing host                  | Current controls                                                                   | Remaining conversion                                                                     |
| ------------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| WorkspaceToolbar               | Shared location/time summaries and MUI app actions                                 | Decide use of the shared Toolbar container while retaining workspace ownership           |
| ViewportFrame                  | MUI scene selector, page settings, collapse and close actions                      | Compose the selected single-line layout without changing view lifetimes                  |
| FlatEarthViewTools             | MUI Sky, elevation, FOV and Center on Sun                                          | Fit feature controls into the chosen toolbar arrangement                                 |
| FlatEarthTimeControls          | Shared inline Slider and settings shortcut; settings retains slider/numeric editor | Move the toolbar's Sun editor into shared PanelButton; retain shared timestamp ownership |
| Shared Toolbar and PanelButton | Implemented and independently verified                                             | Adopt them into the chosen hosts; no new primitive is required                           |

The owner wants all Flat page controls to fit on a single-line toolbar. The
toolbar redesign follows cleanup of the common controls; it is not the first
refactoring step.

Introduce a button with text and an arrow indicating whether its panel is open
or closed. The button opens a small interactive panel containing working
controls, rather than a tooltip or a list of menu commands. At least the Sun
position slider will use this panel. In the current Flat feature this is the
degrees-from-closest editor, which updates shared time for both views.

Which other controls use panels, the exact toolbar grouping, arrow appearance,
panel placement/dismissal, simultaneous-open behavior and narrow-screen handling
remain to be discussed. The single-line toolbar is the design goal; those
details have not been accepted implicitly.

## Existing Implementation References

- [DateField](../../../src/flat/components/DateField.jsx) and
  [TimeField](../../../src/flat/components/TimeField.jsx): existing app-wide controls.
- [Transferred MUI Date control](../../../transfer/Date.jsx): owner-selected
  starting point for date presentation and editing adaptation.
- [CityPicker](../../../src/flat/features/global-configuration/components/CityPicker.jsx):
  configuration-specific city presentation over the shared TypeAhead control.
- [WorkspaceToolbar](../../../src/flat/features/workspace/components/WorkspaceToolbar.jsx):
  workspace-specific composition and actions.
- [FlatEarthViewTools](../../../src/flat/features/flat-earth/components/FlatEarthViewTools.jsx):
  current Sky, elevation, FOV and Center on Sun presentation.
- [FlatEarthTimeControls](../../../src/flat/features/flat-earth/components/FlatEarthTimeControls.jsx):
  current degrees-from-closest slider and numeric editor.
- [Flat application context](../flat/README.md): current workspace and renderer behavior.
- [Time editing behavior](../flat/flat-earth-time-input.md): existing shared-time semantics.

## Continuity

This entry owns requirements and decisions; the saved migration plan owns the
implementation sequence. Keep the existing appearance and behavior as the
baseline, including the current toolbar arrangement. Continue using the
application's CSS variables while integrating the selected MUI foundation.
Folder-mapped React/ReMVC and local authoring rules remain applicable; topics
do not select standards.

Earlier app changes remain uncommitted and must be preserved, including the
stellar/human-presentation integration, shader modes, dim ground fill and
per-view control collapse. Engineering standards review remains owner-cancelled;
the topic change does not restart it. Checkpoint-adviser monitoring remains
active. The dome-cache experiment remains suspended.

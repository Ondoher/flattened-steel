# Flat Toolbar Design Review

Status: the owner selected the icon-only direction and suggested MUI icons,
using AccessTime for time instead of the Sun. The
[toolbar refactor notes](toolbar-refactor.md) own the current direction and
selected icons. This review and its comps remain design exploration; toolbar
implementation has not started. The completed MUI migration is the baseline.

## Current Owner Direction: Icon Buttons

The toolbar provides access to change scene/model, Sky, elevation and FOV;
the user does not need persistent labels/readouts for the current view, Sky
version, elevation or FOV. The main app already shows common date and time.
Use icon buttons that open choices, favoring the installed MUI icon catalog.
This removes the earlier rationale for a combined compact View controls popup:
separate icon affordances can fit both single- and two-view widths. Exact
grouping and interaction remain to be selected.

The selected icons and their visual previews are in the
[refactor notes](toolbar-refactor.md#selected-mui-icons). The owner chose the
clock for time because the angle slider is alternate time entry, preserving
the target icon for camera centering.

[Visual icon comparison](../../../.codex-tmp/component-refactor/toolbar-icons/mui-icon-candidates.png)
and [standalone HTML sheet](../../../.codex-tmp/component-refactor/toolbar-icons/index.html)
preserve the original comparison, with the initial suggestions highlighted.
Its highlighted Sun icon has since been replaced by the selected clock.
The comparison is not a validated user-recognition study.

Keep each icon stable for its command; show current selections in the opened
choices and identify each button with a tooltip/name. The alternate time panel can
explain its shared scope inside the panel without restoring a permanent value
readout. The selected clock distinguishes time entry from camera centering.

The following review/comps describe the earlier explored direction. Their
visible-value labels and combined compact panel are not current requirements.

## Scope and Evidence

The owner supplied the current per-view strip: view identity/scene selection,
Page settings, Sky, elevation, vertical FOV and Center on Sun, above a separate
shared-time angle slider and Time settings action. The review covers converting
this strip into a single-line toolbar within the full app's existing frame.
The app bar already presents shared location and clock information.

The UX and UI specialists worked in standalone-advice mode, without invoking
refine-design or restarting engineering reviewers. Their source reports are
[UX advice](../../../.codex-tmp/component-refactor/toolbar-review/ux-advice.md)
and [UI advice](../../../.codex-tmp/component-refactor/toolbar-review/ui-advice.md).
The original advice used the supplied screenshot and existing M4 comparison
capture/geometry. The owner subsequently requested visual comps; those previews
and their author inspection are linked below. No user study was performed.

Accepted constraints remain: one shared location/date/time, optional second
view, independently adjustable cameras and Sky modes; small/outlined controls
from AppContext; near-black/near-white/blue theme; generic workspace hosting
with feature-owned contributions. Degrees from closest changes the shared
timestamp. Its full slider and numeric editor remain in configuration.

## Rendered Comps

The UI designer authored four advisory scenes, rendered with the installed MUI
theme/shared controls in an isolated preview. The designer inspected every final
image after a bounded spacing adjustment and settled click-ripple captures.
Both comparison toolbars fit their 720 px allocation (the second has 719 px inside
its divider), with no wrapping/truncation identified. Open popups remain within
the 1440×480 preview. This is author visual inspection, not independent acceptance
or verified production behavior.

- [All four comps, standalone HTML board](../../../.codex-tmp/component-refactor/toolbar-comps/final/index.html)
  and [PNG board](../../../.codex-tmp/component-refactor/toolbar-comps/final/toolbar-comps-board.png).
- [Wide toolbar](../../../.codex-tmp/component-refactor/toolbar-comps/final/01-wide-closed.png).
- [Wide toolbar with shared Sun-time panel](../../../.codex-tmp/component-refactor/toolbar-comps/final/02-wide-sun-open.png).
- [Two views with local View controls open](../../../.codex-tmp/component-refactor/toolbar-comps/final/03-comparison-view-controls.png).
- [Two views with shared Sun time open](../../../.codex-tmp/component-refactor/toolbar-comps/final/04-comparison-sun-open.png).
- [UI inspection and limits](../../../.codex-tmp/component-refactor/toolbar-comps/visual-inspection.md),
  [authoring notes](../../../.codex-tmp/component-refactor/toolbar-comps/design-notes.md)
  and [capture qualifications](../../../.codex-tmp/component-refactor/toolbar-comps/capture-notes.md).

The app bar is simplified context, and the sky/ground is a static placeholder.
Dates, angles and scene values illustrate layout rather than a computed physical
observation. The comps show the proposed compact View controls popup, settings
icon and omission of the redundant collapse button; these remain choices for
the owner. No application files or global theme defaults changed, and no browser
user data was retained.

## Findings

- The strip has two competing rows, numerous floating labels, mixed field/button
  heights and two persistent settings entry points. These make it read as a
  collection of form fields and consume scene height.
- `View 1` and `Scene for View 1` repeat the same scope. A compact scene selector
  can retain its full semantic label without repeating that text visually.
- Camera aim and shared time need a visible distinction. Center on Sun changes
  one camera's direction; the angle slider changes time for both views.
- Actual comparison views are 720 px wide. Current Sky/elevation/FOV/centering
  controls alone occupy about 644 px with gaps, excluding scene selection,
  settings, shared time and lifecycle actions. A single line needs an explicit
  compact arrangement.
- An unavailable angle should remain an em dash. The screenshot does not
  establish why Sun-related controls are unavailable; their explanation should
  distinguish missing location from an unready scene as applicable.

## Recommended Composition

Both specialists recommend three semantic groups:

| Group                  | Wide toolbar                                             | Compact comparison toolbar                                                                     |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| View identity and page | View number, scene selector, View settings               | Same, with a named/tooltip-labeled settings icon if selected                                   |
| Local view controls    | Sky, elevation, FOV and Center on Sun directly available | A View controls panel containing all four, with a concise current-value summary on its trigger |
| Shared time            | Text/value/chevron PanelButton, visibly labeled shared   | Retain the shared-time trigger directly on the row                                             |

Keep workspace close actions at the far edge. Keep shared location and civil
date/time summaries in the main app bar. The generic workspace continues to
own view identity, scene selection, settings and lifetimes; Flat contributes
its rendering/camera controls and shared-time entry through the existing
interfaces.

The UI proposal uses a common 40 px control height in an approximately 52 px
toolbar, readable 13–14 px text, about 8 px between related controls, 12–16 px
between groups and 12 px edge padding. Retain outlined controls and MUI's own
focus treatment. Use blue for focus/open/selected state alongside chevrons and
expanded state. Avoid adding enclosing boxes around every group.

The fully exposed row has an estimated 1,000–1,100 px width requirement. The
compact proposal budgets about 656 px: 176 px for view/scene, 176 px for the
View controls summary, 176 px for shared time, 64 px for settings/optional close
and 64 px for spacing/padding. These are design estimates, not measured fits.
Choose the mode from the toolbar's own available width. Translated labels,
large values and widths below the comparison case still require fit decisions.

## Shared Sun-Time Panel

Use a labeled trigger such as `Shared time +0.5°` with an open/closed chevron.
The panel heading `Degrees from closest` supplies the domain meaning; final
trigger wording can make the Sun reference more explicit while retaining the
visible shared-time cue.

The UI proposal is a 320–360 px panel with 16 px padding, a signed value,
slider, Before −180° / 0° Closest / After +180° markers, and an explicit
`Updates both views` cue in comparison mode. Put Time settings in its footer,
removing that separate button from the closed toolbar. Precision numeric entry
continues in configuration; replacing the popup readout with a numeric field
is an optional extension requiring owner selection.

Preserve live shared-time seeking and the existing frozen reference for one
gesture. Keep the popup open during manipulation. Closing ends its gesture;
Escape returns focus to the trigger and click-away preserves the new target's
focus. Position the portalled panel within application bounds, allowing it to
extend beyond its narrow view without clipping. The UX recommendation is one
shared-time popup open across the app at a time; this policy is not yet accepted.

Keep an unavailable trigger usable enough to explain its state and offer the
existing Choose location route when appropriate. Do not substitute 0° for an
unavailable angle or introduce Apply/Cancel into the live slider interaction.

## Decisions Still Open

1. Accept the compact View controls panel, or prioritize specific controls for
   direct exposure at the cost of other space. Both specialists recommend the
   combined panel for the 720 px case.
2. Keep precision entry solely in configuration, or also allow numeric entry
   inside the Sun popup. The current recommendation preserves configuration as
   its existing home.
3. Select final shared-Sun trigger wording and whether View settings uses a
   compact icon.
4. Retire or explicitly redefine the old collapse action: after every control
   is on the top row, its previous top-row-only behavior has no second row to
   hide. Do not change it incidentally.
5. Select the cross-view popup policy and behavior below the comparison width.

The next design step is owner review of the rendered wide/compact proposals and
selection of these interaction choices before implementation. This review is
not an implementation plan or authorization to change the application.

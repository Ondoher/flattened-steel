# Flat Toolbar Refactor

Status: implemented and verified through M3 under the owner's independent-execution
selection on 2026-11-08. The
[implementation plan](toolbar-implementation-plan.md) owns milestones and
interaction defaults; the [execution record](toolbar-implementation-execution.md)
owns decisions, checks, captures and local checkpoints.

## Direction

Use one compact row of icon buttons to change the view's settings. Keep icons
stable for their command, with tooltips/names. Put choices and their current
selection inside the opened controls. Persistent view/model, Sky, elevation
and FOV labels or values are unnecessary on the toolbar. Common date and time
already appear in the app bar.

Prefer the same individual icon controls in single-view and two-view layouts.
The earlier value-bearing triggers and combined compact View controls panel
are superseded by this direction.

## Selected MUI Icons

| Icon                                                         | Control       | MUI component         | Purpose                                        |
| ------------------------------------------------------------ | ------------- | --------------------- | ---------------------------------------------- |
| ![Scene/model](assets/toolbar-icons/PublicOutlined.svg)      | Scene/model   | `PublicOutlined`      | Choose the scene/model displayed in this view. |
| ![Sky](assets/toolbar-icons/Brightness6Outlined.svg)         | Sky           | `Brightness6Outlined` | Choose the sky-rendering mode.                 |
| ![Elevation](assets/toolbar-icons/Height.svg)                | Elevation     | `Height`              | Change this view's observer elevation.         |
| ![Field of view](assets/toolbar-icons/ZoomOutMap.svg)        | FOV           | `ZoomOutMap`          | Change this view's vertical field of view.     |
| ![Time](assets/toolbar-icons/AccessTime.svg)                 | Time          | `AccessTime`          | Open the alternate shared-time editor.         |
| ![Center on Sun](assets/toolbar-icons/CenterFocusStrong.svg) | Center on Sun | `CenterFocusStrong`   | Aim this view's camera at the Sun.             |
| ![View settings](assets/toolbar-icons/Tune.svg)              | View settings | `Tune`                | Open settings for this view.                   |

These are the selected components from [MUI Material Icons](https://mui.com/material-ui/material-icons/).
The previews above are documentation assets; implementation uses the MUI
components.

## Time and Scope

Use the **clock**, not the Sun icon, for time. Degrees from closest is an
alternate way to enter time; it does not represent a separate Sun-only setting.
The clock opens the interactive degrees-from-closest slider panel. Its content
can identify the shared-time effect and provide access to time configuration.
The full slider and numeric editor remain available in configuration.

Location/date/time are shared. Changing time updates both views. Sky,
elevation, FOV and camera aiming remain independent for each view. Center on
Sun keeps its target icon so it is distinct from time entry.

## Refactor Boundaries

- Reuse the completed shared MUI control foundation, AppContext's small/outlined
  defaults and existing CSS-variable theme.
- Preserve workspace-owned scene/settings/lifetime hosting and feature-owned
  controls through the existing contribution interfaces.
- Move the inline time slider into its popup; keep accepted timestamp ownership,
  gesture behavior and scene resources intact.
- The authorized plan supplies grouping and native modal popup behavior. Collapse
  is removed; narrow toolbars scroll horizontally with Close outside overflow.
  Existing responsive workspace stacking remains unchanged.

The [earlier review and comps](toolbar-design-review.md) remain exploratory
references. This document owns the current toolbar direction and selected icons.

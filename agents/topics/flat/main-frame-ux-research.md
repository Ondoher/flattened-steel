# Flat Main-Frame UX Research

Research date: 2026-10-28. Status: preliminary advisory findings for discussion.
This is desk research and interaction analysis, without usability testing,
accepted screen designs, an implementation plan, or application changes. The
refine-design skill was not run.

## Research Boundary

The [selected view and control requirements](../production-app/product-behavior/README.md#views-and-main-frame-controls)
are the authority for owner decisions. The research evaluates how to arrange
those controls while retaining useful scene space in both single-view use and
optional side-by-side comparison. The specific content of the second view is
not selected by this research.

This report concerns arrangement and interaction. The separate
[ownership notes](implementation-notes.md#main-app-and-feature-ownership)
distinguish frame hosts from feature-owned controls and state; appearing in the
main toolbar does not make a control part of the main app view's implementation.

The product-researcher supplied comparative product research; the ux-planner
supplied a focused interaction assessment. The recommendations below synthesize
those contributions and remain proposals for owner discussion.

## Arrangement Comparison

| Arrangement                                                                        | Benefits for Flat                                                                                                                                              | Costs and risks                                                                                                                                          |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared toolbar, compact controls on each view, collapsible configuration inspector | Keeps observation controls visibly shared and viewing controls tied to their scene. Gives one or two views most of the workspace when configuration is closed. | Per-view strips must stay compact. An inspector must name its target whenever it edits one view.                                                         |
| Shared toolbar with a permanent configuration sidebar                              | Makes configuration discoverable and supports frequent detailed adjustments without opening a panel.                                                           | Consumes comparison width continuously. A single set of viewing controls can ambiguously target one of two views; duplicating all controls adds density. |
| Shared toolbar with floating controls over the scenes                              | Preserves the nominal viewport area and puts tools near the view they affect.                                                                                  | Controls cover scene content and can compete with camera gestures. Popovers can overlap each other or the view boundary.                                 |

The working recommendation is the first arrangement. Its advantage follows
from Flat's control scopes: shared observation above the workspace, independent
viewing controls at each view, and occasional configuration in a collapsible
surface. This is a design inference, not a measured usability result.

## Comparable Product Evidence

The following official sources were accessed and checked on 2026-10-28.

- QGIS 3.44 documents creating, duplicating, naming, opening, and closing 3D map
  views; it places tools and configuration access on each view and provides
  explicit synchronization choices between 2D and 3D views. This is evidence
  for explicit view ownership and synchronization controls. Its broader GIS
  interface and 2D/3D synchronization do not establish Flat's two-view behavior.
  [QGIS 3D Map View](https://docs.qgis.org/3.44/en/docs/user_manual/map_views/3d_map_view.html)
- Stellarium's official guide source describes separate date/time, location,
  viewing, and configuration windows, with time-rate controls on the main
  toolbar. It also describes location time zones and custom-zone settings.
  This is a close domain precedent for distinguishing observation controls
  from configuration, but does not establish a two-view layout. The guide
  source on the master branch was inspected; this is not a pinned release
  snapshot.
  [Stellarium interface guide source](https://raw.githubusercontent.com/Stellarium/stellarium/master/guide/ch_interface.tex)
- SunCalc's application help describes exploring the Sun for a selected day and
  place, with a time slider; its location information includes time-zone and
  daylight-saving information. This supports keeping observation context and
  time adjustment prominent. Its single-map task does not answer Flat's
  independent-view arrangement.
  [SunCalc application and help](https://www.suncalc.org/)

These sources document product behavior. The proposed arrangement is our
synthesis, rather than a layout prescribed by any source. This UX inquiry
assessed no product screenshots or rendered Flat prototypes. The subsequent
[UI research](main-frame-ui-research.md) separately inspects official source
images. Blender manual retrieval failed, so it is not used as evidence here.
No interviews or user tests were conducted.

## Proposed Main Frame

Use one persistent workspace. A single view can fill its scene area; opening
comparison divides that area into two peer views. Do not reserve an empty second
pane when comparison is closed.

```text
Shared toolbar:  Location | Date | Time + time zone | Compare | Configuration

Single view                         Optional comparison
View A: Height | FOV                 View A: Height | FOV   View B: Height | FOV

One large scene                     Scene A               Scene B

Configuration inspector: closed unless needed; its editing scope is explicit
```

The diagram illustrates control scope, rather than exact order, dimensions,
styling, or final labels. Camera direction is adjusted within its own view;
whether it also needs explicit toolbar controls remains open.

Opening or closing comparison should preserve the first view's camera, height,
and FOV. A second view should have a clear identity and a close action. How its
content and initial settings are chosen, and whether its settings survive
closing and reopening, remain decisions for discussion. Do not assume that the
two views must display Flat Earth and globe.

Equal pane sizes are a useful starting proposal for comparison. A resizable
divider could accommodate different tasks, but unequal aspect ratios and
independent FOV values would not guarantee matched framing.

## Control Scope And Configuration

Keep shared location, date, and time selection in the main toolbar. A compact
summary can open a richer editor instead of placing every editing field in the
bar. Keep the current observation understandable when those editors close.

Place height and FOV controls in a compact header or strip attached to each
view. This makes the target explicit and allows direct comparison of their
values. A slider can support exploration, but precise numeric input and units
should remain available. The chosen control forms are still open.

Use a collapsible, nonmodal inspector for configuration that benefits from
seeing its effect on the scene. Distinguish application settings from settings
for a named view. If the inspector follows the active view, show its target in
the heading and provide a clear way to change that target; clicking a scene
should not silently retarget an unrelated edit.

A separate configuration screen may suit infrequent application preferences,
but would interrupt scene comparison for appearance or rendering adjustments.
The exact configuration contents must be known before assigning them to an
inspector, dialog, or separate screen. The earlier collapsible setup-panel
direction supports the inspector as a starting hypothesis.

If later animation advances the shared observation time, its controls belong
with date/time so their effect on both views is clear. Camera animation and
export would involve different interactions; the intended animation behavior
remains open. Do not show an inert animation button now.

## Interaction Details That Affect The Frame

- Date and time need an explicit time basis or time-zone indication. Location
  local time, UTC, and device time must not be interchangeable implicit meanings.
  The default time basis and editing behavior remain open, including whether
  changing location preserves the instant or the displayed local clock time.
- Height needs a stated unit and reference, such as height above the selected
  surface. The actual physical meaning must agree with the engine contract.
- FOV needs a stated angle convention, including whether it is vertical or
  horizontal. Resizing the split must not silently change the meaning of the
  displayed value.
- Shared observation changes may finish rendering at different times in the two
  views. Show each view's updating, retained-old-result, ready, or failure state
  clearly enough that a mixed pair is not mistaken for a matched comparison.
  Whether to publish both results together is a later technical decision.
- On narrow screens, stacking the views is a reasonable fallback. Switching
  between retained views is another option when two useful scenes cannot fit.
  Breakpoints and the final fallback are unselected.
- Configuration should open and close without losing viewing state. Keyboard
  access, labelled controls, and sensible focus return apply to the chosen
  interaction pattern.

## Open Design Questions

The initial state and entry action for comparison, second-view content and
initialization, configuration contents and scope, camera-direction controls,
height and FOV input forms, time basis, and narrow-screen behavior still need
owner discussion. Optional linking between independent view controls is not
selected. This research establishes no execution queue or implementation gates.

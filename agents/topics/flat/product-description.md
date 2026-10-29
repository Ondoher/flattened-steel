# Flat Product Description

Status: initial draft for owner editing and later refine-design input.
Prepared on 2026-10-28 from the owner's design discussion. This description
gathers the current product intent; it is not an implementation plan or a
completed UX/UI design. The linked sources distinguish selected requirements
from research recommendations.

## Purpose

Flat is an interactive application for exploring a rendered atmospheric scene
at a chosen location, date, and time. Users can change their viewing direction,
observer height, and field of view, and optionally inspect two views side by
side under the same observation conditions.

The interactive scene is the main workspace. Controls should support exploring
that scene while keeping it visible.

## Workspace And Views

The application has one persistent workspace and one active location. Changing
the location replaces the active location.

The workspace supports a single view and an optional second view. When both
are open, they appear side by side. Users do not need a second view for ordinary
use.

Both views share location, date, and time. Each view has independently
adjustable camera direction, observer height, and field of view. The second
view's content and how it is chosen remain open; two views do not imply two
locations or a required Flat Earth/globe pairing.

## Main Controls

The main frame includes a toolbar and provides:

- Location selection for the shared observation.
- Date and time selection for the shared observation.
- Observer-height and field-of-view controls for each open view.
- Access to configuration.
- A way to open and close the optional second view.

Users should be able to understand whether a control affects the shared
observation or an individual view. The detailed input controls, units, ranges,
initial values, and camera gestures still need definition.

Configuration covers less frequent adjustments. The existing product direction
is a compact toolbar and collapsible setup panel, with the scene remaining
visible during adjustments. The configuration contents and exact presentation
are still open for refinement.

## Working Layout Proposal

The arrangement below describes where controls appear. It does not require the
main app view to implement every control shown in the frame.

The UX research recommends a shared toolbar above the scene area, compact
height/FOV controls attached to each view, and a collapsible, nonmodal
configuration inspector. One view would use the available scene area; opening
the second would divide that area for comparison.

The proposed behavior preserves the first view's settings when the second view
opens or closes. Configuration would clearly identify whether it edits the
application or a named view. Narrow-window arrangements, divider behavior, and
how the second view is initialized remain open.

This layout is a starting proposal for refinement. Its detailed arrangement
has not been accepted or tested with users. The
[main-frame UX research](main-frame-ux-research.md) contains the alternatives,
supporting sources, and limitations.

The separate [UI research](main-frame-ui-research.md) adds inspected visual
references and advisory presentation directions. The palette is now selected
below; typography, density, and exact control treatments remain open for later
refinement.

## Visual Direction

Use `#121212` interface backgrounds with `#F2F2F2` text and borders, the owner's
B2 + W2 selection. Use the
light blue from the owner's supplied swatch for selection, buttons, and other
action controls. Apply this direction consistently across the main frame and
feature-contributed controls. Scene colors continue to come from the renderer.

Define the base colors as shared CSS variables in the application base CSS
file. Frame and feature styles use those definitions consistently. The color
theming follows the familiar centralized MUI CSS palette approach without
using MUI.

The [selected palette](../production-app/product-behavior/README.md#visual-palette)
owns this decision and the remaining color-treatment details. The earlier
research suggestion to compare dark and light frame palettes is superseded.

## Frame And Feature Responsibilities

The working ownership proposal gives the workspace responsibility for layout,
view containers, opening and closing the optional second view, and hosting
toolbar, view-tool, configuration, and status contributions. Features supply
their content, controls, behavior, and state through defined interfaces. The
workspace frame is itself owned by the workspace feature; application startup
and navigation remain in the app feature.

A shared observation feature would own location/date/time selection and its
canonical state. A scene feature would own its rendering, camera behavior,
height/FOV controls, and settings for each open instance. Configuration can
therefore contain contributions from several owners while looking like one
coherent surface. Appearing in the main frame does not transfer a feature's
behavior into the main app view.

The [ownership notes](implementation-notes.md#main-app-and-feature-ownership)
define the proposed split and remaining contract questions. Exact feature
packaging is still open for discussion.

The separate [component and service proposal](component-service-proposal.md)
describes possible React components and supporting classes. It is technical
design input, rather than an additional set of product requirements.

## Initial Feature Direction

The first intended scene feature is a Flat Earth view with a real integration
of the production Algorithm32 shader. Flat Earth is the starting point because
it generates its own cache, whereas the globe requires loading its cache.

This selects the first integration to design. It does not settle the initial
observation, scene contents, cache configuration, or the scope of any later
globe feature. The [implementation notes](implementation-notes.md) retain the
technical composition discussion separately from the user experience.

Flat32 remains the temporary integration test bed. Its controls and features
are reference material for possible adaptation, rather than an automatic
feature list for Flat. The separate
[candidate inventory](../production-app/product-behavior/flat32-feature-review.md)
retains those possibilities for review.

## Product Foundations And Later Possibilities

Flat uses a custom application-owned workspace without MUI. UI text supports
localization, with en-US as the initial language. The selected
[scaffold capabilities](../production-app/product-behavior/README.md#scaffold-capabilities)
and [deployment posture](../production-app/README.md#deployment-posture) remain
supporting constraints.

An animation button is a possible later addition. Its purpose is not yet
defined: advancing observation time, moving a camera, and exporting an
animation would require different interactions. Animation is not included as a
current main-frame requirement.

## Questions For Later Refinement

- Who are the intended users, and which exploration or comparison tasks matter
  most to them?
- What location-selection methods and initial location, date, and time should
  the app offer?
- Which time basis is shown, and does changing location preserve the instant
  or the displayed local clock time?
- What are the height reference, units, supported values, and FOV convention?
- What can the second view display, and how are its settings initialized and
  retained after it closes?
- Which settings are application-wide, which belong to one view, and which
  belong in configuration?
- How should controls and views adapt to narrower windows?
- How should loading, updates, retained results, and failures be communicated,
  particularly when two views finish updating at different times?

## Source Context

The [selected product behavior](../production-app/product-behavior/README.md#selected-production-app-behavior)
records the owner decisions summarized here. Research findings remain advisory;
implementation notes remain technical discussion. These sources should be
reconciled with owner edits when this draft is taken into refinement.

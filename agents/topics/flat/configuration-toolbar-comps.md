# Flat Configuration And Toolbar Comps

Date: 2026-11-05. Status: owner-requested standalone visual proposals, outside the
refine-design pipeline. These comps illustrate the
[research recommendations](configuration-toolbar-research.md); they do not select
a final design, authorize application implementation, or establish usability.

[Open the current comp gallery](../../../.codex-tmp/flat-ui-comps/2026-11-05/shared-time/index.html).
The gallery links full-size PNGs and standalone HTML views. Native fields in the
HTML views are illustrative; they are not connected to application state.

## Shared-Time Slider Update

The latest owner request places a visible slider on each Flat Earth page toolbar
and a slider/numeric pair in Flat Earth configuration. The four updated comps
show a distinct **Shared time** toolbar row with the angle, zero reference,
before/after labels and **Time settings** access. Both views show the same angle;
both Time settings entries highlight when the shared pane is open. Camera
controls and Page settings retain their independent view scope.

The configuration host selects **Shared settings**, then distinguishes
**Location and time** from **Flat Earth time**. The latter shows the slider,
precise numeric entry, date basis, closest-approach explanation and resolved
device date/time. It is a shared contribution owned by Flat Earth, separate from
the page's view-specific Camera contribution. No new global Apply is introduced.

| Comp                                                                                                                                     | Size in CSS pixels | Arrangement                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| [T1: Single view](../../../.codex-tmp/flat-ui-comps/2026-11-05/shared-time/rendered/01-summary-single.png)                               | 1440 by 900        | Toolbar slider; configuration closed.                                            |
| [T2: Comparison and Flat Earth time](../../../.codex-tmp/flat-ui-comps/2026-11-05/shared-time/rendered/02-summary-comparison-config.png) | 1440 by 900        | Two toolbar sliders and a right-hand shared Time pane.                           |
| [T3: Compact comparison](../../../.codex-tmp/flat-ui-comps/2026-11-05/shared-time/rendered/03-summary-compact.png)                       | 1100 by 800        | Two toolbar sliders; bottom configuration with slider/numeric pair and readouts. |
| [T4: Smaller single-view window](../../../.codex-tmp/flat-ui-comps/2026-11-05/shared-time/rendered/04-summary-narrow.png)                | 600 by 900         | Visible toolbar slider and bottom shared Time pane.                              |

The [slider specification](design-comps/2026-11-05/shared-time/slider-spec.md)
owns exact placement and styling. Each toolbar adds an 88-pixel time row. This
preserves camera controls at the cost of scene height, particularly in T3/T4.
The palette and typography stay as described below.

The sample is +45 degrees from closest at San Jose, California, US, using
June 20, 2024 as the date basis. The production geometry resolver returns
`2024-06-20T23:08:48.339Z`, displayed as **Jun 20, 2024 · 4:08:48 PM** in device
America/Los_Angeles. A fresh real-renderer canvas capture at that instant supplies
the comp image. Its reuse/cropping illustrates layout rather than perspective
validation for every pane size. Matching static values illustrate intended
synchronization; the prototype does not connect controls, time or scene.

The -180 to +180 degree range, signed convention and 0.1-degree precision remain
working visual parameters. Numeric acceptance, unfinished drafts, wrap/day
selection and reconciliation with other editors remain open. These valid samples
do not settle those policies or establish additional responsive breakpoints.

The UI designer inspected all four actual PNGs and requested no further visual
corrections. The [inspection](design-comps/2026-11-05/shared-time/inspection.md)
binds their exact hashes and records advisory limits. Browser capture checks
passed for all assigned sizes: no capture errors, document overflow or controls
crossing their horizontal regions, with one painted scene hint per view. This
is author inspection, not independent acceptance or an application behavior test.

Current prototype, images, scene provenance and capture report live under
`.codex-tmp/flat-ui-comps/2026-11-05/shared-time/`. Prior comp roots and images
remain preserved. Application source is unchanged; no application suite was
required for this static comp update. The later
[implementation plan](workspace-comps-implementation-plan.md) now owns the
proposed implementation sequence; execution has not begun.

## Page-Specific Configuration

The owner identified that the first five comps omitted a visible path for
page-specific settings. The revised six-state set now includes **Page settings**
beside each page selector and a **Settings for** target selector in the common
configuration surface. Targets distinguish Shared settings from the exact open
view, for example View 2 - Flat Earth. The selected page shortcut is highlighted;
shared location/time remain visible and unchanged.

This makes the accepted [provider contract](component-service-proposal.md#configuration-provider-contract)
visible in the proposal: a feature contributes its own settings component with
the appropriate scope, and the generic workspace hosts it. View-specific controls
use the owning view's model-service values. Two views of the same page type need
independent configuration targets, not one shared page-type target.

The new F comp demonstrates a Flat Earth Camera contribution with the existing
Elevation and Vertical FOV controls for View 2. They illustrate the extension
using known controls, not a new required settings inventory, duplicate camera
state, global defaults, or a separate Apply transaction. The actual Flat Earth
configuration provider is not implemented by this design work. Comps assume an
illustrative provider exists; an actual page without contributions should not
present an enabled empty destination.

The [revision specification](design-comps/2026-11-05/page-settings/revision-spec.md)
owns exact additions and layout adjustments. The original shared-only family is
retained in the [earlier gallery](../../../.codex-tmp/flat-ui-comps/2026-11-05/index.html)
as history; the [page-settings gallery](../../../.codex-tmp/flat-ui-comps/2026-11-05/page-settings/index.html)
preserves this earlier revision. The shared-time update above is current.

## Earlier Page-Settings Comp Set

| Comp                                                                                                                                    | Size in CSS pixels | Proposal                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [A: Single view](../../../.codex-tmp/flat-ui-comps/2026-11-05/page-settings/rendered/01-summary-single.png)                             | 1440 by 900        | Accepted location/time summaries remain visible and open detailed editing; configuration is closed.                                              |
| [B: Comparison and configuration](../../../.codex-tmp/flat-ui-comps/2026-11-05/page-settings/rendered/02-summary-comparison-config.png) | 1440 by 900        | Two aligned view headers with independent camera controls, plus a right-hand shared inspector. Coordinates are expanded to show field treatment. |
| [C: Compact comparison](../../../.codex-tmp/flat-ui-comps/2026-11-05/page-settings/rendered/03-summary-compact.png)                     | 1100 by 800        | Configuration moves below both views, preserving enough width for contained camera groups. Coordinates are collapsed.                            |
| [D: Smaller single-view window](../../../.codex-tmp/flat-ui-comps/2026-11-05/page-settings/rendered/04-summary-narrow.png)              | 600 by 900         | Two-row shared header, one scene, and a bottom editor with task columns and stacked date/time fields.                                            |
| [E: Inline editing alternative](../../../.codex-tmp/flat-ui-comps/2026-11-05/page-settings/rendered/05-inline-comparison.png)           | 1440 by 900        | A shared editing strip replaces the inspector while open. More immediate input access uses additional permanent scene height.                    |
| [F: Page-specific settings](../../../.codex-tmp/flat-ui-comps/2026-11-05/page-settings/rendered/06-page-specific-settings.png)          | 1440 by 900        | View 2's Page settings shortcut opens the shared host at its Flat Earth provider; View 1 and shared conditions remain distinct.                  |

A-D form one proposed summary-led family. E is an alternative for comparing the
cost of persistent editing controls. A future decision about editing frequency
should choose between them; neither is accepted merely by being rendered.

## Earlier Family Design Intent And Constraints

The UI designer supplied a concrete
[visual specification](design-comps/2026-11-05/visual-spec.md): exact geometry,
typography, control sizes, label/value placement, palette roles, task grouping,
and proposed responsive arrangements. The coordinator translated that specification
into static HTML/CSS and captured the actual browser output.

The comps preserve #121212 backgrounds, #F2F2F2 ordinary text/borders, the current
provisional #ABD3FA action blue, Arial/Helvetica, one shared location/time, and
independent camera controls. Each camera shows 5 m and vertical 50 degrees with
Center on Sun; the optional-view close action is separate. The shared editor puts
Location before Date and time, removes redundant provider headings, and shows
explicit shared/view targeting, populated by the illustrative page providers.

The accepted sample is San Jose, California, US, on June 20, 2024 at noon in the
capture device's America/Los_Angeles time zone. City search remains distinct from
the accepted location. City choice, coordinate-pair acceptance, and date/time-pair
acceptance retain their separate meanings; no global Apply is introduced.

The canvas asset was captured from the existing real Flat renderer with only its
DOM mouse-look hint hidden during capture. The comp places one hint per scene.
The same asset is reused with centered cropping for different pane shapes. It is
visual context for the layout, not scientific evidence of perspective at each
new aspect ratio or a claim that cameras are linked.

Summary-to-editor entry, populated-scope filtering, coordinate disclosure, bottom
docking, and the inline alternative remain design proposals. No time-zone lookup,
animation UI, additional feature settings, camera linking, or new scene type is
selected. The fixed sizes shown here do not establish every responsive breakpoint,
phone/touch support, translated layout, or draft-retention guarantee.

## Earlier Family Inspection And Evidence

The UI designer inspected all six revised PNGs, including page shortcuts, target
selection, the shifted shared form in B, the compact header in D, and View 2's
contribution in F. No further visual corrections were requested. The
[revision inspection](design-comps/2026-11-05/page-settings/inspection.md)
binds the exact image hashes and records scope/limits. This is author inspection
of advisory comps, not independent acceptance or application verification.

The browser capture report records six assigned viewports and source/image hashes,
with no capture errors, document overflow, or controls crossing their assigned
horizontal regions. Each view retains one painted mouse-look hint. Mechanical
capture checks do not establish interaction behavior or prove a common state
owner behind matching values in a static picture.

The original five-image author specification, initial palette correction,
[initial inspection](design-comps/2026-11-05/inspection.md), and
[corrected inspection](design-comps/2026-11-05/inspection-final.md) remain preserved.
The original source family and revised artifacts have separate output roots.

The earlier gallery, HTML/CSS/JavaScript comp artifacts, six PNGs, scene provenance,
render helper/report, and inspection originals are under
`.codex-tmp/flat-ui-comps/2026-11-05/page-settings/`. The original family remains in
its parent folder. Durable design/inspection descriptions are linked above.
Application source is unchanged; no application suite was repeated for static
design artifacts. Existing engineering review remains cancelled. No execution
follows from the comp handoff. The later owner-requested
[implementation plan](workspace-comps-implementation-plan.md) is the current
implementation sequence; it has not been executed.

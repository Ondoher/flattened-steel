# Product Behavior

Focus: Feature candidates for owner review, selected controls and explicit product backlog.

The implemented Flat32 controls and behavior below belong to the integration
test bed. Their applicability to the finished app requires a product decision
under the [application roles](../README.md#application-roles-and-current-status).
Retained implementation evidence does not select the finished app's UI or features.

## Selected Production-App Behavior

### Location Scope

The owner selected one active location at a time on 2026-10-26. The app opens
and displays one location; changing location replaces the active location.
Simultaneous locations in separate in-app tabs, panes or comparison views are
outside the product scope. This decision does not select the location picker,
presets, arbitrary-coordinate support or the arrangement of views for that one
location.

### Views And Main-Frame Controls

On 2026-10-28 the owner selected a workspace with an optional second view,
supporting two views side by side when it is open. A second view is not required
for ordinary use. Both views share the active location, date, and time. Camera
direction, observer height, and field of view can be adjusted independently in
each view. This retains the single-location scope; the specific content or page
type of each view remains open.

The main frame must provide a toolbar, location selection, date and time
selection, height controls, FOV controls, and a configuration surface. The owner
described configuration as a screen of some sort; its exact presentation and
the arrangement of the controls are subjects of the current UX research.
An animation button is a possible later addition, rather than a current
requirement.

The [main-frame UX research](../../flat/main-frame-ux-research.md) records
advisory layout comparisons. Research recommendations are not accepted layout
decisions or an implementation plan.

### Flat Earth Time Input

The owner selected an alternate Flat Earth time editor on 2026-11-05: degrees
from the Sun's closest approach to the selected location, with zero at closest
approach and before/after orbit positions. Changing the angle updates the shared
timestamp for both views. The owner requests a visible page-toolbar slider and
a slider/numeric pair in a dedicated shared configuration pane. The feature owns the editor while the app-wide
current-time service remains the timestamp owner. The
[time-input note](../../flat/flat-earth-time-input.md) owns detailed UI, conversion,
date/wrap and open editing decisions. This is design intent, not implementation.

### Workspace And UI Foundation

The owner selected an app-owned workspace without MUI on 2026-10-26. Use an
app-directed shell with the interactive scene as the main workspace. A compact
toolbar exposes frequent actions; a collapsible setup panel holds less frequent
configuration. The scene remains visible while users adjust either set of
controls.

The owner accepted a global configuration editor feature on 2026-11-05. It
contributes mountable presentation to the existing configuration panel, while a
main configuration service owns location and exposes the shared animation-loop
current-time capability. Page features read
that public capability and supply their own defaults for absent properties.
Shared current location/date/time apply to both views; defaults for height/FOV
initialize view-owned settings without replacing existing independent values.
The [configuration architecture](../../flat/component-service-proposal.md#global-configuration-and-shared-values)
owns the technical responsibilities and contribution flow. This is a design
decision; the provider now includes city search and manual-coordinate editing,
with accepted location in configuration and one timestamp owned by the app-wide
animation-loop service (integer milliseconds since the Unix epoch).
The date/time fields are app-wide components using the browser's local date
order, separators, digits, and 12/24-hour time convention. Entry converts using
the device's local time zone for now; DST ambiguity policy, location-zone
conversion, and richer editing remain future work. The
[Flat entry](../../flat/README.md#current-scope) owns implementation status.
The owner selected the current device-local date and time as startup defaults.
Accepted edits remain shared and survive closing configuration; reopening the
panel does not reset them to the current clock. The shared animation service
starts fixed; enabling playback advances one timestamp and solar/sidereal cycle
frames for all views. Animation controls remain future UI work.

The Flat Earth base scene now consumes those shared location/time values. It
renders production atmospheric sky and flat ground, supports two independently
owned views, and updates when shared values change. Missing location prompts for
configuration; preparation failures offer Retry. Flat Earth now contributes
independent elevation/FOV presets, Center on Sun, and click-to-look camera input
for each view, matching Flat32. Shared time/location remain global; animation
controls remain future work. The [Flat entry](../../flat/README.md#current-scope)
owns implementation scope and verification.

Features supply configuration UI by registering a provider service that returns
mountable React content when requested. The configuration panel hosts those
contributions through the shared interface. The
[provider contract](../../flat/component-service-proposal.md#configuration-provider-contract)
owns the service, mounting, and presentation boundaries.

For create-app, these choices correspond to MUI disabled and the app-directed
shell. No replacement UI component library is selected. The required controls
are listed under [Views and main-frame controls](#views-and-main-frame-controls).
Their detailed interactions, grouping and placement, panel behavior on smaller
screens, and any tabs within the panel remain to be designed. This decision does
not select the pending Flat32 feature candidates. The owner subsequently
authorized the [Flat shell scaffold](../../flat/README.md) using these choices.

### Visual Palette

On 2026-10-29 the owner selected the following palette for the application
frame and feature-provided controls:

| Role                                          | Owner selection                                     |
| --------------------------------------------- | --------------------------------------------------- |
| Backgrounds                                   | `#121212` (B2)                                      |
| Text                                          | `#F2F2F2` (W2)                                      |
| Borders                                       | `#F2F2F2` (W2)                                      |
| Selection, buttons, and other action controls | The light blue in the owner's supplied color swatch |

The supplied swatch is the reference for the action color; this document does
not assign an unmeasured hex value to it. The owner selected B2 + W2 from the
color samples: the base background and text/border values above are settled.
How the accent is applied to each control and hover, focus, pressed, and
disabled treatments remain design details. This palette applies to the
interface; atmospheric scene colors remain the renderer's responsibility.

The palette is an owner decision and supersedes the UI research's earlier
suggestion to compare dark and light frame palettes. It does not select exact
spacing, typography, or control shapes.

The owner selected CSS custom properties for the base colors, defined centrally
in the application's base CSS file. Frame and feature styles use those shared
definitions, following the same centralized color-theming approach as MUI CSS
theming while the application remains independent of MUI. The
[component proposal](../../flat/component-service-proposal.md#shared-presentation-building-blocks)
records the stylesheet ownership.

### Workspace Composition

Flat uses one persistent application-owned workspace. Its scene area, toolbar
and setup panel belong to that workspace. App-directed composition does not
require installable pages or page switching.

Features contribute through application-wide workspace interfaces with defined
contracts. The workspace hosts those contributions without importing their
private implementations or identifying concrete features in its own behavior.
The contributing feature owns its implementation and lifecycle. For the first
shader integration, the owner selected a page feature, as recorded in the
[Flat implementation notes](../../flat/implementation-notes.md#first-shader-integration).
The exact extension contract still needs definition before implementation.

Reuse the page-management services supplied by create-app's tab and
left-navigation options, including contribution registration, selection and
controller-based mounting. Use those services behind Flat's custom workspace
without adopting either ready-made navigation UI. The persistent workspace
continues to own its layout and controls; exact contribution units and service
adaptations remain to be defined.

A separate create-app option for page management independent of a prescribed
navigation UI remains a future tooling capability to consider, not a global
skill change selected for implementation here.

The [workspace first pass](../../flat/README.md#current-scope) now adapts the page
catalog and controller/view machinery to independent view identities and
contribution hosts. The scaffold options below record the original generation
choices; the initial Workspace starter page has since been retired.

### Scaffold Capabilities

The owner completed the create-app choices on 2026-10-26:

| Capability                                | Selection |
| ----------------------------------------- | --------- |
| Application display name                  | Flat      |
| Application slug                          | flat      |
| Standalone, composed and configured mount | /flat     |
| Initial page                              | Workspace |
| Database persistence                      | No        |
| Strict accessibility mode                 | No        |
| Localization                              | Yes       |
| App-owned server router                   | Yes       |
| Default page routing                      | Yes       |
| Localized Markdown                        | No        |
| Socket.IO                                 | No        |
| Unit/UI testing                           | Yes       |
| Coverage reporting                        | No        |

Together with the selected app-directed shell, MUI disabled and the repository's
[discoverable deployment posture](../README.md#deployment-posture), these values
complete the create-app options. Localization applies to UI text; localized
Markdown is not included. These shell choices do not select the pending product
feature candidates. The owner authorized create-app to generate the shell with
these options; the [Flat app entry](../../flat/README.md) owns scaffold status.

## Retained Integration-Test-Bed Status

Stage 11.1-11.3 and parts of 11.4-11.6 are implemented. Remaining interaction/migration/reconciliation work and 11.8 acceptance are owner-deferred. Compatible-clock animation is now owned by [Production MVP requirement M1](../mvp/requirements.md#m1--compatible-time-and-location-animation).

## Working Documents

- [Initial Flat product description](../../flat/product-description.md) - Draft
  product input for later refinement, based on owner decisions and clearly
  identified advisory research.

- [Flat32 feature review](flat32-feature-review.md) - Source-backed candidates for possible inclusion or adaptation; all decisions and MVP dispositions remain pending.

- [Center on Sun](center-on-sun.md) - Aim the retained camera at the Sun in the published scene.

- [Twilight exposure](twilight-exposure.md) - Accepted altitude-aware display response and production qualification.
- [Twilight exposure promotion](twilight-exposure-promotion-plan.md) - Experiment closure and implementation evidence.

- [Interactive shader performance](shader-performance.md) - GPU frame-cost diagnosis and proposed motion-quality tier.

- [40 km elevation](forty-km-elevation.md) - Current elevation coverage, package selection and served GPU verification.
- [10 km elevation](ten-km-elevation.md) - Expanded elevation presets, fixed ground coverage and matching cache.
- [On-demand rendering](on-demand-rendering.md) â€” Idle scenes draw no frames; camera, controls, publication and visibility changes resume drawing. Matched GPU output is pixel-identical to the previous renderer.
- [Original Bruneton atmosphere](bruneton-atmosphere.md) - Current physical profile in both modes, retaining numerical corrections and full elevation support.
- [H2400 atmosphere](h2400-atmosphere.md) - Superseded physical selection; preserved integration evidence.
- [H2400 promotion plan](h2400-atmosphere-plan.md) ? Experiment closure and production integration.
- [Zero-aerosol atmosphere](zero-aerosol-atmosphere.md) â€” Prior zero-aerosol selection and rollback evidence; current default is original Bruneton.
- [Elevated horizon cache coverage](elevated-horizon-cache-coverage.md) â€” Exact-sunset black strip corrected by covering all solar bins through 2 km; old spectral bytes preserved and seven matched GPU views pass.
- [Shared-cache transition allocation](shared-cache-transition-status.md) â€” Remove policy-only transition failures while retaining real GPU failure handling.
- [Sky, scene and elevation controls execution](sky-scene-controls-execution.md) â€” Native controls and cache/scene-reusing elevations are implemented and locally qualified, with actual GPU comparisons and recovery checks. Standards sign-off awaits reviewer calibration.
- [Flat32 sky, scene and elevation controls plan](sky-scene-controls-plan.md) â€” Selected M1-M4 functionality is complete; the production review dependency remains open. Video scenes are deferred.
- [Algorithm32 Cache Interface Design](cache-design.md)
- [`flat32` Stage 11 Migration Inventory](flat32-migration-inventory.md)
- [Algorithm32 Production Implementation Plan](production-implementation-plan.md)

## Context Boundary

Load this entry and only the document required by the selected task. Use the
[primary topic](../README.md) to change focus. Standards follow affected source
folders through the [manifest](../../standards/manifest.md), never this topic.

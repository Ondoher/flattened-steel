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

### Workspace And UI Foundation

The owner selected an app-owned workspace without MUI on 2026-10-26. Use an
app-directed shell with the interactive scene as the main workspace. A compact
toolbar exposes frequent actions; a collapsible setup panel holds less frequent
configuration. The scene remains visible while users adjust either set of
controls.

For create-app, these choices correspond to MUI disabled and the app-directed
shell. No replacement UI component library is selected. Exact controls, their
grouping and placement, panel behavior on smaller
screens, and any tabs within the panel remain to be designed. This decision does
not select the pending Flat32 feature candidates. The owner subsequently
authorized the [Flat shell scaffold](../../flat/README.md) using these choices.

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

The existing generated page-based starter has not yet been aligned with this
decision. Its existing management services are the starting point for reuse;
the scaffold options below record what was generated.

### Scaffold Capabilities

The owner completed the create-app choices on 2026-10-26:

| Capability | Selection |
| --- | --- |
| Application display name | Flat |
| Application slug | flat |
| Standalone, composed and configured mount | /flat |
| Initial page | Workspace |
| Database persistence | No |
| Strict accessibility mode | No |
| Localization | Yes |
| App-owned server router | Yes |
| Default page routing | Yes |
| Localized Markdown | No |
| Socket.IO | No |
| Unit/UI testing | Yes |
| Coverage reporting | No |

Together with the selected app-directed shell, MUI disabled and the repository's
[discoverable deployment posture](../README.md#deployment-posture), these values
complete the create-app options. Localization applies to UI text; localized
Markdown is not included. These shell choices do not select the pending product
feature candidates. The owner authorized create-app to generate the shell with
these options; the [Flat app entry](../../flat/README.md) owns scaffold status.

## Retained Integration-Test-Bed Status

Stage 11.1-11.3 and parts of 11.4-11.6 are implemented. Remaining interaction/migration/reconciliation work and 11.8 acceptance are owner-deferred. Compatible-clock animation is now owned by [Production MVP requirement M1](../mvp/requirements.md#m1--compatible-time-and-location-animation).

## Working Documents

- [Flat32 feature review](flat32-feature-review.md) - Source-backed candidates for possible inclusion or adaptation; all decisions and MVP dispositions remain pending.

- [Center on Sun](center-on-sun.md) - Aim the retained camera at the Sun in the published scene.

- [Twilight exposure](twilight-exposure.md) - Accepted altitude-aware display response and production qualification.
- [Twilight exposure promotion](twilight-exposure-promotion-plan.md) - Experiment closure and implementation evidence.

- [Interactive shader performance](shader-performance.md) - GPU frame-cost diagnosis and proposed motion-quality tier.

- [40 km elevation](forty-km-elevation.md) - Current elevation coverage, package selection and served GPU verification.
- [10 km elevation](ten-km-elevation.md) - Expanded elevation presets, fixed ground coverage and matching cache.
- [On-demand rendering](on-demand-rendering.md) — Idle scenes draw no frames; camera, controls, publication and visibility changes resume drawing. Matched GPU output is pixel-identical to the previous renderer.
- [Original Bruneton atmosphere](bruneton-atmosphere.md) - Current physical profile in both modes, retaining numerical corrections and full elevation support.
- [H2400 atmosphere](h2400-atmosphere.md) - Superseded physical selection; preserved integration evidence.
- [H2400 promotion plan](h2400-atmosphere-plan.md) ? Experiment closure and production integration.
- [Zero-aerosol atmosphere](zero-aerosol-atmosphere.md) — Prior zero-aerosol selection and rollback evidence; current default is original Bruneton.
- [Elevated horizon cache coverage](elevated-horizon-cache-coverage.md) — Exact-sunset black strip corrected by covering all solar bins through 2 km; old spectral bytes preserved and seven matched GPU views pass.
- [Shared-cache transition allocation](shared-cache-transition-status.md) — Remove policy-only transition failures while retaining real GPU failure handling.
- [Sky, scene and elevation controls execution](sky-scene-controls-execution.md) — Native controls and cache/scene-reusing elevations are implemented and locally qualified, with actual GPU comparisons and recovery checks. Standards sign-off awaits reviewer calibration.
- [Flat32 sky, scene and elevation controls plan](sky-scene-controls-plan.md) — Selected M1-M4 functionality is complete; the production review dependency remains open. Video scenes are deferred.
- [Algorithm32 Cache Interface Design](cache-design.md)
- [`flat32` Stage 11 Migration Inventory](flat32-migration-inventory.md)
- [Algorithm32 Production Implementation Plan](production-implementation-plan.md)

## Context Boundary

Load this entry and only the document required by the selected task. Use the
[primary topic](../README.md) to change focus. Standards follow affected source
folders through the [manifest](../../standards/manifest.md), never this topic.

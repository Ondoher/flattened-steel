# Flat Implementation Notes

These notes capture the current design discussion and can inform a later
implementation plan. The owner subsequently authorized the first workspace pass,
whose [current implementation and verification](README.md) are recorded separately.
The owner subsequently authorized the Flat Earth page, global configuration,
localized date/time, and the global animation clock. The latest authorized step
adds Flat32-equivalent per-view camera controls to the production Flat/local base
scene, which uses current shared location and time. The [Flat entry](README.md#current-scope) owns implementation and
verification. Additional viewing tools, scene content, and location/time-zone
policies remain discussion; these notes do not independently authorize them.

The owner subsequently clarified that state-owning models must be services.
Flat now activates workspace, configuration-editing/catalog, and Flat Earth
models as registered feature services. Controllers resolve them in ready();
Flat Earth's model service scopes camera records by view identity. The
[component proposal](component-service-proposal.md) owns the packaging decision.

## Spherical Earth Feature

The owner requested a [Spherical Earth implementation plan](spherical-earth-implementation-plan.md).
It owns the proposed sequence, boundaries and verification for an independent
page using the existing production spherical/distant-Sun engine and deployed
shared cache. The [execution record](spherical-earth-implementation-execution.md)
owns the completed M1 cache-delivery slice and remaining rendering work. The
workspace remains generic; the feature consumes shared location/time and will
contribute its own view controls/settings in the later milestones.
The pending time-zone and IntlDate decisions are a separate design concern.

## Flat Earth Alternate Time Input

The owner selected a [degrees-from-closest time input](flat-earth-time-input.md)
for Flat Earth: a visible page-toolbar slider and a slider/numeric pair in a
dedicated shared configuration pane. Zero means the Sun's closest approach to
the selected location; before/after positions use the daily orbit. Changing it
updates the shared timestamp for both views. The feature owns the alternate
editor, while the app-wide current-time service owns accepted time. The
[updated comps](configuration-toolbar-comps.md#shared-time-slider-update) show the
shared scope separately from view-specific Camera settings. Date/wrap, precision
and draft/acceptance choices are now recorded by the [time-input note](flat-earth-time-input.md).
The [implementation plan](workspace-comps-implementation-plan.md) is complete;
the [execution record](workspace-comps-execution.md) owns results and evidence.

## First Shader Integration

The owner wants the first real shader integration in the production Flat app to
be a new Flat Earth page feature. Flat Earth comes first because it generates
its own cache, whereas the globe needs to load its cache. This gives the initial
integration a starting point without the globe's cache-loading dependency.

The feature should integrate the production Algorithm32 shader. Flat32 remains
the separate integration test bed and a source of implementation reference; its
existing controls and other features are not implicitly selected for Flat.

The base integration now uses shared selected location and the current animation
timestamp. It waits for a location, renders production compact native15/N4 sky and
ground, and reuses canonical cache leases for updates. This does not select the
globe or additional scene objects. The subsequent owner request explicitly adds
Flat32 camera controls: pointer-lock mouse look, Center on Sun, and the same
elevation/FOV presets. These belong to Flat Earth and contribute per-view tools
through the generic workspace capability, retaining independent camera models.

## Main App Frame Research

The follow-on [UI comps](configuration-toolbar-comps.md) now illustrate the
research through a designer-authored summary family and inline-edit alternative.
They are static review artifacts with documented inspection, not application
implementation or an accepted new interaction policy.
The owner identified the missing page-specific route. The current revision adds
Page settings entries and explicit shared/view targeting, plus an illustrative
View 2 configuration contribution, as recorded by the comp handoff.

The owner's 2026-11-05 [configuration and page-toolbar consultation](configuration-toolbar-research.md)
uses current full-app captures and standalone UX/UI researchers. It records
advisory hierarchy, scope, commit/draft, toolbar, and responsive guidance plus
observed containment defects. It does not select implementation or an accepted
new layout; the earlier frame research remains supporting evidence.

The owner's [view and control requirements](../production-app/product-behavior/README.md#views-and-main-frame-controls)
now define the shared observation and independent view settings. The
[main-frame UX research](main-frame-ux-research.md) evaluates arrangements for
those requirements. It remains advisory input to this design discussion.

## Workspace Composition

The selected [workspace composition](../production-app/product-behavior/README.md#workspace-composition)
owns the persistent workspace and feature contribution approach. For this
integration, the contribution is a page feature.

Reuse the page-management services from create-app's tab and left-navigation
options for registration, selection, and controller-based mounting, without
their prescribed navigation UI. The Flat Earth feature registers against that
application-wide contract. The workspace hosts the selected contribution
without importing the Flat Earth implementation or identifying it in its own
behavior.

App-directed applications in general do not have to support installable pages.
This is Flat's composition choice, rather than a requirement for every
app-directed workspace. A future create-app option for page management without
a fixed UI remains a tooling idea.

## Main App And Feature Ownership

Separate visual placement from behavior and state ownership. A feature's
control can appear in the main toolbar without becoming part of the main app
view's implementation. The workspace is implemented as its own feature under src/flat/features/workspace.
The app feature handles activation and navigation through the workspace's
public capability. This distinction describes responsibilities, rather than
placing application behavior outside the feature architecture.

The following split is a working proposal consistent with the selected
contribution approach. Exact service names and feature packaging remain open.

The [component, class, and service proposal](component-service-proposal.md)
develops this split into named responsibilities under the React and ReMVC
standards, without specifying detailed APIs or an execution plan.

| Concern                           | Workspace responsibility                                                                                                                                                  | Contributing feature responsibility                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main frame                        | Present the scene area, shared toolbar host, view containers, and configuration host; arrange them as available space changes.                                            | Provide content and controls through the hosts' public contracts.                                                                                                                                                       |
| Optional second view              | Own the workspace's view identities, open/close and selection behavior, split layout, and configuration target. Obtain available page contributions through registration. | Supply a mountable view and release its resources when that view is removed.                                                                                                                                            |
| Shared location, date, and time   | Host the shared controls and provide application-wide service access.                                                                                                     | The main configuration service owns shared values; a global configuration feature supplies editing UI. Scene features consume the public data capability.                                                               |
| Height, FOV, and camera direction | Provide a place for view-local tools and identify which view a contribution targets.                                                                                      | The relevant view feature owns the controls, supported values, camera behavior, and state for that view. Reusable camera controls could later be a shared capability; this does not move their behavior into the frame. |
| Configuration                     | Open/close the configuration surface and present its application or view scope.                                                                                           | Each owner contributes its settings UI, meaning, validation, and changes. Workspace-specific preferences belong to the workspace feature.                                                                               |
| Rendering and scene status        | Mount registered content and offer consistent places for contributed status.                                                                                              | Flat Earth owns its renderer adapter, shader/cache operations, preparation, cancellation, failures, retry behavior, and release. It reports status through a defined interface.                                         |
| Common visual treatment           | Supply shared presentation conventions for contributed controls, labels, focus, and status.                                                                               | Use those conventions while keeping domain-specific behavior within the owning feature.                                                                                                                                 |

The accepted [global configuration architecture](component-service-proposal.md#global-configuration-and-shared-values)
separates the editor feature from the main configuration service and consumer-owned
defaults. Each open view retains independent camera, height, and FOV state and an
independently owned rendering lifecycle, even if both views mount the same
feature. A registered feature definition is not a single shared view instance.
Whether compatible GPU/cache data can be reused is a separate engine/resource
decision; the workspace does not assume or manage those resources.

The main app view should not import Flat Earth's components, construct its
controls, or branch on a Flat Earth identity. It renders content supplied by
the registered page controller and contribution interfaces. Application
composition can explicitly choose an initial registered page without putting
that feature's implementation into the frame.

Features register against application-wide page, toolbar, view-tool, and
configuration contracts; they do not need to know which feature implements
the host. The page-management machinery from create-app remains the starting
point. Exact metadata, mounting and cleanup contracts, and how a contribution
is associated with a particular open view remain to be defined.

## ReMVC Boundaries Within Each Owner

The same separation applies inside the workspace feature and each scene or
shared-service feature:

- The model owns canonical state and invariants for its concern.
- Services own the operations and resources for that concern.
- The controller coordinates workflow and collaborators through their public
  interfaces.
- The view service projects state and relays presentation intents.
- React components present the result. Transient presentation state can remain
  local; React rendering does not construct caches or perform shader setup as
  a render side effect.

Workspace layout state is therefore owned by the workspace's model/controller,
rather than being folded into a scene feature or made canonical in the main
React view. Shared configuration stays with the main configuration service;
per-view state stays with its view owner. Physical geometry and coordinate
transforms remain engine responsibilities.

## Localized Date Field Adaptation

The owner requested a [date-field adaptation note](date-field-adaptation.md)
based on transfer/Date.jsx and its supporting date helper/converter. The source
is a model for compact localized date entry, rather than a package to integrate
unchanged. The note owns the behavior to borrow, responsibility split,
application-specific boundaries, and open date/time decisions. The simple
app-wide fixed-format date/time controls are implemented; richer adaptation
remains design work.
The [selected date parser](date-field-adaptation.md#selected-date-parser)
is an adaptation of IntlDate with explicit time-zone and locale constructor
inputs. The note owns that contract and the separation from the `localize` service.

The owner has no ready-made time field. The note records
[time entry and location time](date-field-adaptation.md#next-design-work-time-entry-and-location-time)
as follow-on design work beyond the simple first pass, including the possible use of the chosen location's
time zone instead of device-local time. The choice and conversion behavior
remain open.
The proposed [unified lookup and optional override](date-field-adaptation.md#unified-location-lookup-and-optional-override)
uses coordinates from either city selection or manual entry, with a possible
time-zone picker for correcting the automatic result. Implementation and override
lifetime remain unselected.

The note also records [modmod reference code](date-field-adaptation.md#additional-reference-modmod-date-and-time-zone-code)
for explicit-zone calendar conversion and locale date-format discovery, with
its scope and known cache limitation. The
[selected time-zone API](date-field-adaptation.md#selected-time-zone-api)
now owns the conversion direction; the reference helper is not the selected
conversion engine. Implementation remains deferred.

## Deferred City Search Improvements

Status: saved for later at the owner's request on 2026-11-05. No implementation
or execution plan is selected.

The owner wants to revisit city-search discoverability, including more fuzzy
type-ahead matching. Matching behavior, tolerance, ranking, and any supporting
library remain undecided. Preserve the distinction between search drafts and
the accepted shared location when this work is revisited.

Related advisory ideas from the discussion remain candidates for review:

- Optional country and state/region filters to narrow ambiguous city names.
- Readable country and region names in results.
- Deterministic ordering within equal match ranks instead of dataset order.
- A compact optional narrowing surface that preserves space for the scene.

The [current search implementation and verification](README.md#current-scope)
remain the baseline. The San Jose correction is implemented; the broader fuzzy
matching, filtering, and sorting ideas above are deferred.

## Details Still Open

Global configuration ownership is accepted as described by the
[component proposal](component-service-proposal.md#global-configuration-and-shared-values).
The exact configuration contracts, initial scene and observation,
renderer adapter, cache/profile selection, and loading, failure, and retry
presentation are not yet selected. Coordination of two views during observation
changes also remains open. These notes establish no milestones, execution
queue, or implementation-completion claims.

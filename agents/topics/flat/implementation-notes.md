# Flat Implementation Notes

These notes capture the current design discussion and can inform a later
implementation plan. The owner subsequently authorized the first workspace pass,
whose [current implementation and verification](README.md) are recorded separately.
The observation and scene-feature sections remain design discussion; these notes
do not independently authorize their implementation.

## First Shader Integration

The owner wants the first real shader integration in the production Flat app to
be a new Flat Earth page feature. Flat Earth comes first because it generates
its own cache, whereas the globe needs to load its cache. This gives the initial
integration a starting point without the globe's cache-loading dependency.

The feature should integrate the production Algorithm32 shader. Flat32 remains
the separate integration test bed and a source of implementation reference; its
existing controls and other features are not implicitly selected for Flat.

Starting with Flat Earth does not select the globe for implementation or settle
the initial location, time, scene contents, detailed control behavior, or cache
configuration.

## Main App Frame Research

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
| Shared location, date, and time   | Host the shared controls and provide application-wide service access.                                                                                                     | A shared observation feature owns the canonical observation, selection UI, validation, and change notifications. Scene features consume its public interface.                                                           |
| Height, FOV, and camera direction | Provide a place for view-local tools and identify which view a contribution targets.                                                                                      | The relevant view feature owns the controls, supported values, camera behavior, and state for that view. Reusable camera controls could later be a shared capability; this does not move their behavior into the frame. |
| Configuration                     | Open/close the configuration surface and present its application or view scope.                                                                                           | Each owner contributes its settings UI, meaning, validation, and changes. Workspace-specific preferences belong to the workspace feature.                                                                               |
| Rendering and scene status        | Mount registered content and offer consistent places for contributed status.                                                                                              | Flat Earth owns its renderer adapter, shader/cache operations, preparation, cancellation, failures, retry behavior, and release. It reports status through a defined interface.                                         |
| Common visual treatment           | Supply shared presentation conventions for contributed controls, labels, focus, and status.                                                                               | Use those conventions while keeping domain-specific behavior within the owning feature.                                                                                                                                 |

The proposed observation feature is an application-wide service, not part of
the main React view. There is one shared observation for the workspace. In
contrast, each open view needs independent camera, height, and FOV state and an
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
React view. Shared observation state stays with its proposed service owner;
per-view state stays with its view owner. Physical geometry and coordinate
transforms remain engine responsibilities.

## Details Still Open

The proposed ownership split still needs owner discussion. The exact
contribution and shared-observation contracts, initial scene and observation,
renderer adapter, cache/profile selection, and loading, failure, and retry
presentation are not yet selected. Coordination of two views during observation
changes also remains open. These notes establish no milestones, execution
queue, or implementation-completion claims.

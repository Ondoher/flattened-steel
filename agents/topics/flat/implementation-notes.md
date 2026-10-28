# Flat Implementation Notes

These notes capture the current design discussion and can inform a later
implementation plan. The owner has asked to remain in design mode. Application
implementation is not authorized by these notes.

## First Shader Integration

The owner wants the first real shader integration in the production Flat app to
be a new Flat Earth page feature. Flat Earth comes first because it generates
its own cache, whereas the globe needs to load its cache. This gives the initial
integration a starting point without the globe's cache-loading dependency.

The feature should integrate the production Algorithm32 shader. Flat32 remains
the separate integration test bed and a source of implementation reference; its
existing controls and other features are not implicitly selected for Flat.

Starting with Flat Earth does not select the globe for implementation or settle
the initial location, time, scene contents, controls, or cache configuration.

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

## Working Responsibility Boundaries

The following structure is a proposal for further discussion under the React
and ReMVC standards, rather than a settled file layout:

- The feature's model owns its scene configuration and canonical state.
- Application services own shader/cache operations and rendering resources.
- The controller coordinates registration, mounting, preparation, failure, and
  release through those services.
- The view service projects controller state and relays presentation intents.
- React components present the page and its current state. A renderer adapter
  connects the canvas to the engine; React rendering does not construct caches
  or perform shader setup as a render side effect.

The feature should own its shader and cache lifecycle, including cancellation
of obsolete preparation and release when its presentation is removed. Physical
geometry and coordinate transforms remain engine responsibilities.

## Details Still Open

The division between the page feature, application-wide services, and renderer
adapter still needs discussion. The exact contribution contract, initial scene
and observation, rendering adapter, cache/profile selection, and loading,
failure, and retry presentation are not yet selected. These notes establish no
milestones, execution queue, or implementation-completion claims.

# Feature Mechanics

## Purpose

Define how client features are owned, included in a Polylith build, activated
at runtime, and organized in source. Read this with
[Build And Assets](build-and-assets.md).

This is a starting standard. Audit imported features before restructuring
them, then make boundary changes deliberately and with corresponding tests.

## Feature Ownership And Removability

A feature is intended to be a self-contained, removable unit:

- It may consume documented common application capabilities.
- The surrounding app should not need knowledge of its internal files.
- Code, styles, tests, and assets under the feature are private by default.
- Another feature must not quietly import those internals.
- A deliberate cross-feature contract must be documented and exposed through
  an intentional public entry point or service.
- Removing the feature should remove its functionality without breaking
  unrelated application behavior.

Promote a component, helper, style, or asset into an app-shared or
repository-shared layer when it becomes a genuine cross-feature building
block. Move its supporting code with it so ownership remains coherent.

## Preferred Feature Shape

Use only the folders required by the feature:

```text
src/<app>/features/<feature>/
  index.js
  build.json
  test.json
  controller.js
  views/
  components/
  models/
  services/
  assets/
    css/
    images/
  _tests/
```

Responsibilities:

- `index.js` is the runtime activation boundary.
- `build.json` describes the feature's build contribution.
- `test.json` contributes feature-owned browser spec groups when needed.
- Controllers own flow; views organize presentation; components render it;
  models own domain state and interaction.
- `assets` contains files that must be copied as standalone build output.

## Build Inclusion Versus Runtime Activation

Feature inclusion has two independent requirements:

1. The app build definition must include the feature.
2. The feature entry module must import the implementations that register or
   activate its runtime behavior.

Including a feature in the build graph does not instantiate its services.
Importing source that is absent from the build definition does not make it a
shipped feature. Diagnose these two layers separately.

Keep most feature-crossing imports at the owning `index.js`. Feature, service,
and shared-model implementations should generally register by side effect and
be consumed through the registry. Concrete React components and
feature-private presentation helpers may be imported directly by their view or
component tree.

## Service Lifecycle

- `start()` initializes local state only.
- `ready()` resolves dependencies, subscribes to other services, installs
  listeners, and performs dependency-driven work.
- A non-service object waits for its runtime-ready point before locating a
  registry service.

See [REMVC](remvc.md#service-lifecycle) for the complete rationale.

## Repository Coding And Contract Conventions

[Code Conventions](../code-conventions.md) owns naming, placement, class and
utility modules, validation boundaries, and diagnostics. [Type Conventions]
(../types.md) owns ambient, class, and interface contracts. [JSDoc
Conventions](../jsdoc.md) owns runtime documentation. Apply those standards to
feature code; this document retains only feature structure and activation.

## Style And Asset Ownership

- Broad app stylesheets contain only genuinely broad foundations such as theme
  variables, typography defaults, and shared visual rules.
- Feature-specific and component-specific styles stay with their owner.
- A stylesheet or image that must exist in `dist` belongs under the relevant
  `assets` tree and must be declared by an app or feature build descriptor.
- Decorative or layout-affecting images generally belong in CSS backgrounds;
  semantic content images belong in `<img>` elements.
- Runtime URLs are derived from the build descriptor, not from source paths.

## Change Checklist

When adding or changing a feature:

1. Identify the feature's private boundary and any intentional shared API.
2. Add or update its app-build inclusion.
3. Keep the side-effect activation chain intact through `index.js`.
4. Put copied CSS and images under declared asset paths.
5. Add feature-local browser-spec globs when the feature owns browser tests.
6. Verify service work is split correctly between `start()` and `ready()`.
7. Confirm no other feature imports private implementation files.
8. Apply the relevant [Code Conventions](../code-conventions.md) and
   [Type Conventions](../types.md) before adding feature code.

# Architecture Overview

Use this as the compact architecture context card. The documents linked from
it contain the detailed rules.

This is the intended starting architecture for the repository. Extracted code
may initially differ; assess those differences explicitly instead of treating
this document as a description of code that has not yet been reconciled.

## Polylith Configuration Layers

The browser application topology has three declarative layers and one runtime
layer:

1. `polylith.json` selects app build definitions and owns repository-level
   builder and server settings.
2. `builds/<app>.json` defines one app's source, output, entry, template,
   copied assets, feature set, and optional test/server settings.
3. A feature-local `build.json` and optional `test.json` define what that
   feature contributes to app and browser-test builds.
4. App and feature entry modules activate runtime code through imports and
   registry startup.

Build inclusion and runtime activation are separate. A feature can be present
in a build but absent at runtime if its entry/import chain is broken.

See [Build And Assets](build-and-assets.md) for the full contract.

## Core Application Model

The intended client architecture is registry-centered REMVC:

- `Registry` locates app-facing services.
- `Executor` starts the app and selects the initial control flow.
- `Model` owns data access, transport, persistence, and domain interaction.
- `Service` presents application-facing capabilities over models and internal
  collaborators.
- `Controller` owns feature flow and application interaction orchestration.
- `View` translates controller intent into presentation structure.
- React is the concrete presentation layer, not the whole view layer.

An application can contain multiple scoped model/view/controller groupings,
usually aligned with feature boundaries. It is not one monolithic MVC stack.

See [REMVC](remvc.md) for the full role and lifecycle rules.

## Dependency Direction

Prefer registry lookup for independently located, app-facing services. Keep
dependency knowledge in the conceptual owner that understands why the
dependency exists.

Constructor or options-object injection is appropriate inside one tightly
owned helper cluster when it improves testability and does not expose internal
wiring as app architecture. Method parameters are runtime API and should not
be added only as test controls.

Service lifecycle is split deliberately:

- `start()` performs local initialization only.
- `ready()` performs cross-service lookup, subscriptions, and setup that
  depends on other services.

Views and React components should consume services or owner-provided props
rather than reaching into unrelated models or feature internals.

## Feature Boundaries

Features should be self-contained and removable:

- Feature-local code, styles, tests, and assets are private by default.
- Features do not quietly import another feature's internals.
- Reusable code moves to an intentional app-shared or repository-shared layer.
- Shared app-facing behavior is exposed through a service or common API.
- Removing a feature should remove its behavior without leaving unrelated
  application code broken.

See [Feature Mechanics](feature-mechanics.md) for layout, activation, and
placement guidance.

## Representative Source Shape

The exact folders may vary by app, but this is the preferred vocabulary:

```text
src/<app>/
  index.js
  <browser-test-entry>.js
  main/
  services/
  models/
  common/
  shared/
  assets/
  features/
    <feature>/
      index.js
      build.json
      test.json
      controller.js
      views/
      components/
      models/
      assets/
      _tests/
```

Only create folders that have a real owner and purpose. The tree is a guide to
responsibility, not a requirement for empty scaffolding.

## Build And Asset Snapshot

Source placement alone does not ship a file. App and feature build descriptors
own build inclusion and copied-output layout. Runtime asset URLs must be
derived from the descriptor's output destination, not guessed from the source
path.

Prefer the repository scripts for normal work:

- `npm run build` for configured application builds.
- `npm start` for configured application serving.
- `npm run dev` for the repository development loop.
- `npm run dev:watch` or `npm run dev:serve` when only one side is needed.

Use direct Polylith commands for focused work only after checking whether a
repository script already owns the workflow.

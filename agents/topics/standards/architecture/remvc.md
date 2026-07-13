# REMVC Architecture

## Purpose

Define the intended organization of client applications independently of the
build system and asset pipeline. This is the target for new work and gradual
cleanup; imported code may not yet observe every boundary.

## Core Framing

`REMVC` means:

- Registry
- Executor
- Model
- View
- Controller

Applications may contain several scoped MVC groupings. A feature or bounded
functional area can own its own model, controller, and view services while
using shared application services through the registry.

## Registry

The registry is the locator and lifecycle coordinator for app-facing services.
Service dependencies should normally be declared or located by the conceptual
owner close to where they are used.

This is not a blanket prohibition on dependency injection:

- Independently located app services use the registry.
- A complex internal implementation may inject its own helper collaborators
  through construction when the helper cluster remains one conceptual unit.
- Each helper should remain independently testable.
- Runtime method parameters describe caller-facing behavior; do not add them
  only to steer internals in tests.
- Tests should influence a decision through the same owner state or
  collaborator used in production.

## Executor

The executor starts the application and chooses the initial controller or
control flow. Its decision may use route, URL, configuration, or other startup
context. It should coordinate startup rather than absorb feature behavior.

## Models And Services

Use this preferred direction:

- A model owns raw data access, transport, persistence, or domain interaction.
- A service caches, adapts, and exposes app-facing behavior over models and
  internal collaborators.
- Controllers and views consume the service instead of bypassing it to reach
  transport or storage concerns.

Not every domain object needs a service wrapper. Introduce the boundary when
the rest of the app needs a stable capability, lifecycle, or subscription
surface.

## Controllers

Controllers own feature flow and application interaction orchestration. They
decide what the application should do, coordinate services and models, and
supply intent to a view. They should not become generic storage containers or
styling owners.

## Views And React Presentation

A view organizes controller state and intent into presentation decisions.
React renders that presentation.

Preferred flow:

```text
model/domain interaction
  -> app-facing service
  -> controller
  -> view service
  -> React component tree
```

React components receive data, callbacks, and presentation decisions from
their owner. They may own transient, presentation-local state, but durable
domain changes and application flow stay with controllers, services, or
models.

Some imported code may have controllers render components directly. Treat
that as an implementation fact to assess, not as the target definition of a
view.

## Service Lifecycle

Registry-backed services have two initialization phases:

### `start()`

- Initialize only local state and resources.
- Leave the service internally usable once dependencies become available.
- Do not call other services or assume they have completed startup.

### `ready()`

- Resolve or subscribe to other registry services.
- Install cross-service listeners.
- Perform dependency-driven precaching or setup.

This split is required because services may start in parallel. Registration or
existence in the registry does not prove a dependency is ready to call.

Non-service objects should wait until their own runtime-ready boundary before
locating registry services. For React class components, that is typically a
mount lifecycle rather than the constructor.

## Review Heuristics

When reviewing application code, ask:

1. Does each dependency live with the owner that understands it?
2. Does a model own raw domain or transport interaction?
3. Does a service present the stable app-facing capability?
4. Does the controller own flow rather than rendering detail?
5. Does the view organize presentation without owning domain behavior?
6. Does React receive props and callbacks instead of reaching through layers?
7. Are cross-service actions deferred until `ready()`?

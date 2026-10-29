# Flat Component, Class, And Service Proposal

Status: draft architecture for discussion, 2026-10-28. Names describe proposed
roles, not a required file count. This is not an execution plan. The owner later
authorized a workspace-only first pass; [current implementation status](README.md)
distinguishes that code from the proposed observation and scene features. It follows the [ownership notes](implementation-notes.md#main-app-and-feature-ownership)
and the canonical [React](/C:/Users/gande/.codex/documentation/standards/react.md)
and [ReMVC](/C:/Users/gande/.codex/documentation/standards/remvc.md)
standards read for this proposal.

## Overall Structure

Use four bounded feature groups: application activation/navigation, workspace,
shared observation, and Flat Earth. Each has its own controller and view service. Models own
canonical facts, controllers own workflow, view services adapt presentation,
and React components render content and report intent.

```text
React presentation <-> owning view service <-> owning controller
                                                  |
                                         models and capabilities

Workspace hosts <--- registered contributions --- Observation / Flat Earth
```

The workspace mounts registered content without importing the contributing
feature's components. Controls remain owned by their feature wherever they
appear in the frame.

## Application Feature

Keep features/app limited to application activation, navigation, and a minimal
presentation boundary. It uses the workspace's public registry capability and
does not import workspace models, views, components, services, or styles.

| Owner               | Purpose and function                                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AppController**   | Activates the workspace after the executor reaches registry readiness. Coordinates primary URL/default/not-found decisions through the page catalog and URL service, then delegates mounting to the workspace capability. |
| **AppView**         | Projects activated content and canonical app context from AppController into concrete root/shell presentation, and relays state events. React roots consume this view only.                                               |
| **AppShell**        | A tiny stateless React wrapper around activated content. Workspace chrome belongs to WorkspaceShell in the workspace feature.                                                                                             |
| **AppPagesService** | The existing application-wide page-definition catalog and public metadata contract, reused by application routing and workspace mounting.                                                                                 |

Startup remains the executor's responsibility. It explicitly activates the app
controller after registry readiness; registration order does not choose a page.
The existing AppContextService remains the canonical app-context owner.
AppController observes it through its public capability; AppView projects the
result into the root presentation without exposing services to React for
orchestration. Localization dependency resolution belongs in ready, not start.
The URL service owns URL mechanics. The optional second view is currently
in-memory workspace composition rather than URL state.

## Workspace Feature

The owner's explicit correction places workspace implementation under
src/flat/features/workspace. Its entry activates its controller, view,
contribution service, and stylesheet. Models, React components, types, styles,
and tests remain removable with that feature.

| Owner                      | Purpose and function                                                                                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WorkspaceModel**         | Canonical open-view identities, page selections, arrangement, and configuration target. A feature-private plain model in the current pass, without scene parameters.                                                          |
| **WorkspaceController**    | Owns view sessions, mounting and release, optional comparison, configuration, and contribution lifetimes. Native selection relays to application navigation; public mountPage performs workspace mounting without URL policy. |
| **WorkspaceView**          | Projects canonical workspace facts and opaque mount results into toolbar, view, configuration, and status hosts. Relays intents to its own controller and chooses WorkspaceShell.                                             |
| **UiContributionsService** | Workspace-owned implementation of the application-wide toolbar, view-tool, configuration, and status registration capability. Contributing features retain behavior and presentation ownership.                               |

The first pass adapts the existing page catalog for independent open-view
identities and explicit release. The generated placeholder page is retired;
the workspace itself is a persistent feature, not a registered scene page.

### React Components

| Proposed component     | Purpose and function                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WorkspaceShell**     | The persistent workspace frame. Composes the shared toolbar, workspace, and configuration surface using presentation supplied by WorkspaceView.                                             |
| **WorkspaceToolbar**   | Presents workspace actions and registered shared-toolbar content. It does not implement location or date/time behavior.                                                                     |
| **Workspace**          | Arranges one or two view containers and the optional divider. Reports workspace gestures through WorkspaceView; CSS owns the layout.                                                        |
| **ViewportFrame**      | A generic container for one open view: identity, feature-provided tools, content, and status. Reports frame actions such as closing the second view.                                        |
| **ConfigurationPanel** | Presents a clearly named application or view scope and the contributed settings content. Owns local DOM/focus presentation, while scope selection and settings workflows remain outside it. |

These components receive presentation through WorkspaceView and props/callbacks.
They do not discover registry services or mount arbitrary features during
render. They remain generic when Flat Earth is removed.

## Shared Observation Feature

This is an application-wide capability because all open views share one
location/date/time. Its toolbar UI is a contribution to the frame.

### Classes And Services

| Proposed owner            | Purpose and function                                                                                                                                                                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ObservationModel**      | The canonical location and observation instant, together with validation and normalization of the domain values. It does not contain localized labels or editing workflow.                                                                                                  |
| **ObservationService**    | The stable shared capability over that model. Exposes accepted observation snapshots and change notifications to scene controllers, and owns its subscription lifecycle. If this separation adds no independent behavior, a single observation model-service is sufficient. |
| **ObservationController** | Coordinates location and date/time editing, validation feedback, and committing user intent through the observation capability. Registers its UI contributions and owns their activation.                                                                                   |
| **ObservationView**       | Projects observation values, editing state, and controller actions into the feature's presentation. Supplies toolbar content and editors through the contribution mechanism.                                                                                                |

### React Components

| Proposed component     | Purpose and function                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ObservationToolbar** | The compact current-location and date/time presentation with actions to edit them. Appears inside WorkspaceToolbar while remaining observation-owned. |
| **LocationEditor**     | Presents location selection and any eventual search, preset, or coordinate controls selected for the product. Reports edits through ObservationView.  |
| **DateTimeEditor**     | Presents date/time editing with an explicit time basis. It may keep transient input drafts but does not become the canonical simulation clock.        |

The editor forms and their location in a popover, panel, or dialog remain UX
choices. They render beneath the normal application root.

## Flat Earth Feature

One registered feature can support multiple open view instances. The feature
controller is a registry service; a view instance is a scoped session, not a
second application registry or a second global controller.

### Classes And Services

| Proposed owner          | Purpose and function                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FlatEarthController** | Registers the page and its contributions, creates and closes scoped view sessions, consumes the shared observation capability, and coordinates preparation, updates, failure, retry, and cancellation.                                                                                                                         |
| **FlatEarthSession**    | A controller-owned helper grouping one open view's identity, model, and runtime lifetime. Keeps two instances distinct without duplicating controller policy or global observation state.                                                                                                                                      |
| **FlatEarthModel**      | One instance per session, owning that view's canonical height, FOV, camera direction, and feature-specific settings. It uses the shared observation rather than introducing another editable copy.                                                                                                                             |
| **FlatEarthRuntime**    | Feature-private renderer collaborator for one session. Owns the production engine attachment, renderer resources, cache/shader preparation, resize/render scheduling, and disposal. Physical geometry and coordinate transforms stay with Algorithm32. This helper does not need a registry-facing renderer service initially. |
| **FlatEarthView**       | Adapts controller/session state to page, tools, settings, and status presentation. Relays all component intent to FlatEarthController and distinguishes instances by their stable identity.                                                                                                                                    |

### React Components

| Proposed component     | Purpose and function                                                                                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FlatEarthPage**      | The feature page root. Receives its scoped presentation through FlatEarthView and composes the scene presentation. It does not locate observation or rendering services directly.                                                                   |
| **SceneCanvas**        | A narrow renderer/DOM adapter. Supplies a mounted surface and measured size, reports camera gestures through its owning view/controller, and releases its attachment on unmount. It does not decide scene policy or construct caches during render. |
| **FlatEarthViewTools** | Presents that instance's height/FOV controls and any later selected viewing tools. Can appear in ViewportFrame without becoming workspace-owned.                                                                                                    |
| **FlatEarthSettings**  | Presents feature-specific configuration for the named instance inside ConfigurationPanel. It does not own unrelated workspace or observation settings.                                                                                              |

The runtime is activated through the controller when its presentation surface
is ready; creating a React element alone does not start cache construction.
The precise Three/React adapter is still open. If an external framework needs
a hook bridge, keep that bridge narrowly scoped to the framework lifecycle
under the ReMVC adapter exception.

## Shared Presentation Building Blocks

Concrete components such as **NumberInput**, **Select**, **ControlGroup**, and
**StatusIndicator** can live under `src/flat/components` when their actual or
reasonably anticipated cross-feature use justifies it. They receive values,
labels, and callbacks; they do not subscribe to feature services. Feature-only
editors stay with their feature, including their styles and support files.

The application base stylesheet,
[`src/flat/styles/app.css`](../../../src/flat/styles/app.css), owns the base
color definitions as semantic CSS custom properties. This uses the centralized
palette approach familiar from MUI CSS color theming, implemented directly in
CSS for this application without MUI. Those variables represent the
[selected interface palette](../production-app/product-behavior/README.md#visual-palette):
near-black backgrounds, near-white text and borders, and the owner's blue
selection/action color. Frame and feature styles consume the shared definitions
through `var(...)`, keeping the base values in the application base file.
Component styles own how the colors are applied to their controls and states.
This is a CSS responsibility, without a theme service or a transfer of feature
behavior into the frame. The workspace pass defines the base tokens in that
file. Its blue action token is a provisional visual approximation until the
supplied swatch's exact numeric color is recorded; further state treatments
remain design work.

Substantial React components above are classes by default. Very small,
entirely stateless wrappers may be functions. Event handlers are named and
stable; render is side-effect free. Native semantic controls and component-owned
CSS are the presentation foundation. Major layout uses CSS Grid.

## Contributions, State, And Lifetime

A contributing controller registers against a host's public capability. The
WorkspaceController coordinates mounting the selected contribution through its owning
controller; that controller asks its view service to choose the component.
The host receives renderable presentation without knowing the implementation.
Service dispatch uses implemented capability methods or stable method names,
rather than passing bound service methods between services.

Shared observation changes reach FlatEarthController through ObservationService.
The controller coordinates its affected sessions; the runtime does the rendering
work, and FlatEarthView projects the result. The WorkspaceShell does not fan out shader
updates or infer whether a cache can be reused.

Closing a view ends its session and scoped contributions, invalidates pending
work, and releases that runtime's resources. Late results cannot publish into
another session. Compatible cache sharing, if supported, needs explicit resource
ownership and is not inferred from two panes using the same feature.

Registry services initialize local state in `start()` and resolve collaborators
and cross-service listeners in `ready()`. Non-service adapters wait for their
own mount/attachment boundary. Every listener, observer, timer, contribution,
and imperative resource has an exact, idempotent release path.

The existing independent application registry remains the locator. Installation
services continue through the explicit shared-registry attachment; no per-view
registry is introduced by this proposal.

## Remaining Design Choices

Exact contribution contracts, observation model-service packaging, session/URL
representation, camera input behavior, renderer adapter, and configuration
inventory remain open. These descriptions establish purpose and responsibility,
without prescribing properties, method lists, or an implementation sequence.

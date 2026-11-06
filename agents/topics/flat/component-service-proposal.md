# Flat Component, Class, And Service Proposal

Status: architecture discussion with owner-authorized implementations through
2026-11-05. Workspace, global configuration, shared date/time/animation, and the
Flat Earth base scene are implemented; [current status](README.md) owns their
scope and verification. Unimplemented controls and richer scene responsibilities
remain proposals. This is not an execution plan. The code follows the
[ownership notes](implementation-notes.md#main-app-and-feature-ownership),
[React](/C:/Users/gande/.codex/documentation/standards/react.md), and
[ReMVC](/C:/Users/gande/.codex/documentation/standards/remvc.md) boundaries.

Flat's state-owning application and feature models are registered Polylith
services. Feature entries activate them; `start()` initializes local state and
`ready()` resolves any service dependencies. Controllers resolve model
capabilities from the application registry in `ready()` and call implemented
methods. Private workflow/runtime helpers remain controller collaborators; pure
date/time parsing and formatting helpers do not own canonical application state.
There is one Flat Earth model service per application registry, with independent
camera records keyed by workspace view identity.

## Overall Structure

Use four bounded feature groups: application activation/navigation, workspace,
global configuration, and Flat Earth, plus application-wide configuration and
animation-loop services.
Features have their own controller and view service as needed. Models own
canonical facts, controllers own workflow, view services adapt presentation,
and React components render content and report intent.

```text
React presentation <-> owning view service <-> owning controller
                                                  |
                                         models and capabilities

Workspace hosts <--- registered contributions --- Global configuration / Flat Earth
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
| **WorkspaceModel**         | Canonical open-view identities, page selections, arrangement, and configuration target. A feature-owned registered model service, without scene parameters.                                                                   |
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

### Configuration Provider Contract

Status: owner-accepted extension shape on 2026-11-05. Features register a service
that, when asked, returns their configuration React content for the panel to
mount. Registration identifies the provider capability and its application-wide
or view-specific scope. The panel's contents come from these registrations.

WorkspaceController resolves registered provider services and requests their
mountable content for the selected scope. WorkspaceView passes the resulting
presentation to ConfigurationPanel. The React panel renders supplied content;
it does not discover services, import feature editors, or decide their behavior.

The configuration provider is a public service role. A feature controller can
implement it and delegate component selection to its owning view; a separate
facade is unnecessary when it adds no responsibility. The existing configuration
slot and mountContribution/unmountContribution capability can serve this role.
The provider owns editor workflow and the release of any resources associated
with its mounted contribution.

This provider capability is separate from the main configuration data service.
The global configuration feature supplies one such provider; other features can
supply their own through the same interface. Each editor writes through its
owning model/service boundary, and closing the panel does not discard accepted
configuration values. The first global provider now implements the existing
mountContribution/unmountContribution contract and registers through
ui-contributions. Its [current location-editor implementation](README.md#current-scope)
uses the app-level configuration model-service without changing the workspace host.

The workspace-comps implementation extends the existing catalog with optional
localized section labels and a generic secondary view-tools row. Configuration
uses a selected contribution id, separate from its registration lifetime token.
`openConfiguration(target, section, focus)` opens a registered section; focus is
a provider-owned editor key, not a workspace branch on feature names. The model
owns target/section selection and fallback, the controller mounts only selected
content, and the view projects available targets/sections and selected states.
React owns focus and loading-to-input handoff with exact observer cleanup.

Global configuration contributes accepted Location/time summaries and one shared
editor section. Flat Earth contributes an app-lifetime shared Time section and
Camera settings/tools for each mounted view. `FlatEarthTimeModel` is a registered
feature model-service for draft/reference rules, independent of canvas sessions;
the current-time service remains canonical. The
[time-input note](flat-earth-time-input.md) owns the implemented edit policy.

## Global Configuration And Shared Values

Status: owner-accepted architecture on 2026-11-05. The global configuration
provider, city editor, simple app-wide date/time fields, and the configuration
model-service for accepted location and the animation-loop current-time capability
are implemented. Configuration exposes the clock's timestamp without duplicating
its canonical state.
Other shared properties and scene consumers remain future work. This replaces the earlier shared-observation feature proposal. The
remaining class and service names are descriptive until implementation.

A global configuration feature contributes a mountable React editor to the
existing configuration panel. The main application configuration service owns
the accepted shared values and change notifications. Page features depend on
that public capability without importing or identifying the feature that edits
it. Do not introduce a separate observation/location owner that duplicates the
same accepted values.

| Owner                                    | Purpose and function                                                                                                                                                                                                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Main configuration service**           | Application-wide canonical configuration capability, backed by a model or implemented as a model-service when a separate facade adds no behavior. Owns accepted shared values, their domain rules, and change notifications; it does not own editor presentation.                  |
| **GlobalConfigurationController**        | Registers the workspace-wide configuration contribution, coordinates editor activation and user workflow, and passes edits through the owning model/service contracts.                                                                                                             |
| **GlobalConfigurationView**              | Projects accepted values and editing state into presentation, selects the contributed component, and relays editor intent to its controller.                                                                                                                                       |
| **CityCatalog model-service**            | Resolves HTTP in ready(), then loads and decodes city data through that capability and owns caching, search normalization, indexing, matching, and ranking. Those operations belong in a model, not the controller or JSX.                                                         |
| **GlobalConfiguration / LocationEditor** | Feature-owned React presentation for global properties, including location selection. Components render prepared values and report intent; transient popup, focus, and keyboard state can remain local.                                                                            |
| **CityPicker**                           | Search input and city-result presentation. If actual consumers need the control across features, promote it and its supporting presentation assets/contracts to shared components with explicit values and callbacks. Shared data consumers do not imply shared editor components. |

The controller registers against the configuration contribution capability with
workspace-wide scope (`viewId: null`). When the user opens global configuration,
the workspace asks the contributing controller to mount its content. That
controller asks its own view to supply the React component. Edits flow from component to owning view
to controller to model/service. Consumers receive configuration changes through
the public capability and coordinate their own affected view sessions. Closing
the configuration surface releases presentation, while accepted values remain
in the main configuration service.

Each consuming feature's model supplies its own defaults for absent properties.
An absent value is distinct from a legitimate zero or false value. The editor
feature is not responsible for defining every page feature's fallback behavior.

Shared current values and per-view defaults have different semantics:

- Location, date, and time are shared current values. Accepted changes apply to
  both open views without creating independent editable copies.
- Configured default height or FOV can initialize a new view. Each existing
  view's independently adjustable values stay with that view's model.
- Feature-specific application-wide settings can use the same contribution
  mechanism and main configuration service. Settings belonging to one mounted
  view stay with that view's model and use its explicit configuration scope.

The satellite-app picker has now informed the location editor without copying
its App component or introducing a runtime dependency on that repository. The
[current implementation](README.md#current-scope) owns the catalog snapshot,
search behavior, coordinate units, and verification. There is no initial selected
location. Date/time starts from the device-local clock on app startup. The
date/time fields are app-wide components consumed by the editor feature, with
prepared local entry hints and text. A shared LocalDateTimeFormat helper derives
parsing/formatting from the browser's default locale; the model owns drafts and
the view prepares accepted-value display. Valid local entry converts to integer
Unix epoch milliseconds through LocalDateTime helpers. The global animation-loop service owns
one timestamp. Configuration delegates setTimestamp and reads, and relays
['timestamp'] changes; derived calendar/clock parts are not additional canonical
properties. Device-local time
is the provisional entry basis. Explicit DST ambiguity policy, location-zone
conversion, and richer editing remain later design work. The [date-field note](date-field-adaptation.md)
owns that distinction.

## Shared Current Time And Animation

Implemented on 2026-11-05 at the owner's request. The app-wide service lives at
`src/flat/services/animation-loop.js` under registry name `animation-loop`. It
adapts the service and public value shapes from
`C:/dev/poly-gc-react/archives/flat-runtime-source-2026-08-25.zip`, entry
`src/flat/services/animation-loop.js`. The archive is read-only reference material;
there is no runtime dependency on it or the comparison repository. Archive SHA-256:
`25951a613c87f446b503e92e2d4868b3fa1a008ea50f2224414fbf40ae1aa1b5`.

AnimationLoopService is the sole shared current-time owner, available to all
features through its public registry capability. It initializes once from the
device clock at minute precision and starts in fixed mode. `getTimestamp` and
`setTimestamp` expose an absolute instant in integer Unix epoch milliseconds;
seeking retains the playback mode. Configuration owns location and delegates
its timestamp reads/writes to this service, retaining the existing public editor
flow and per-property changed events. Location changes do not change current time.

`setPlayback` selects live or fixed playback. A fixed pose can retain the current
time, select elapsed simulation seconds, or select a relative solar angle. Live
playback owns one interval only after registry readiness; monotonic
performance.now() samples drive advancement. Stop releases the timer, repeated
readiness replaces it, and restart does not charge the stopped interval to
simulation time. The executor releases the clock and configuration listener at
application shutdown. Features do not create independent clocks for each view.

The archived defaults are retained: 24 solar hours, 23.9344696 sidereal hours,
and 40 real seconds per solar rotation when animation is enabled. Both periods
share one simulation speed. A sidereal-only display duration can determine that
speed; two supplied display durations must agree with one common speed. This
prevents a frame's two phases from describing different current times. Numeric
clock/period checks reject nonfinite durations, nonpositive periods, and invalid
Date timestamps rather than silently substituting defaults.

`getFrame`, `listenFrame`, and `unlistenFrame` expose one coherent timestamp,
elapsed seconds, cycle timing, relative solar/sidereal phases, and frame deltas.
Consumers own their exact listener tokens; returned/emitted snapshots do not
expose internal mutable state. Phases are relative to the startup epoch and are
not calibrated astronomical orientation. Controllers subscribe through the
registry; their views project frame data to React. React performs no registry
or timer orchestration.

Date/time drafts remain editable during playback. Clean fields refresh from the
clock; a dirty editor retains unfinished text until explicit acceptance resets
it. The locale-aware display and device-local entry-to-timestamp conversion are
unchanged. Animation buttons, renderer subscriptions, location-zone conversion,
and explicit DST ambiguity policy remain future work.

## Flat Earth Feature

The base scene now realizes the controller/session/model/runtime/view split.
FlatEarthPage owns the canvas element directly in this first pass and relays
attachment through its view/controller; a separate SceneCanvas component is not
needed yet. FlatEarthRuntime uses Three and production Algorithm32 outside React
render, with a per-view LocalSunFrameController, canonical cache leases, complete
receiver/shader preparation, coherent publication, resize, cancellation, and
retirement. The registered model service derives unit-bearing location and exact ISO UTC instant
from shared configuration, retaining view-local camera state. Neither the
workspace nor React constructs a cache or owns simulation time. Clean global
date/time fields and unfinished drafts retain the preceding behavior.

The initial camera looks north with a five-meter observer height and a
50-degree vertical FOV. FlatEarthViewTools is now a mounted per-view contribution
with Flat32-equivalent elevation/FOV presets and Center on Sun. A private
PointerLookController owns native pointer lock and Three mouse input; the runtime
reports accepted orientation to the session model and redraws on demand. FOV and
mouse look reuse the displayed frame; elevation preparation publishes the new
height atomically with its complete physical frame. Retry restores the accepted
pose. Shared observation changes preserve independent cameras. The generic
workspace resolves these contributions through their public service contract.
Additional scene objects and feature-specific settings presentation remain later
work. Missing
shared location yields a prompt; errors yield Retry. Time-only updates coalesce
without canceling every in-flight frame, while location changes cancel obsolete
work. Shutdown/retry detaches the exact canvas and awaits its graphics release.

One registered feature can support multiple open view instances. The feature
controller is a registry service; a view instance is a scoped session, not a
second application registry or a second global controller.

### Classes And Services

| Proposed owner          | Purpose and function                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FlatEarthController** | Registers the page and its contributions, creates and closes scoped view sessions, consumes the main configuration capability, and coordinates preparation, updates, failure, retry, and cancellation.                                                                                                                         |
| **FlatEarthSession**    | A controller-owned helper grouping one open view's identity, registered model capability, and runtime lifetime. Keeps two instances distinct without duplicating controller policy or global observation state.                                                                                                                |
| **FlatEarthModel**      | One registered service per application, owning independent camera records keyed by view identity. It exposes defensive reads and scoped height/FOV/orientation writes, derives observations from shared configuration snapshots, and releases each record when its view closes.                                                |
| **FlatEarthRuntime**    | Feature-private renderer collaborator for one session. Owns the production engine attachment, renderer resources, cache/shader preparation, resize/render scheduling, and disposal. Physical geometry and coordinate transforms stay with Algorithm32. This helper does not need a registry-facing renderer service initially. |
| **FlatEarthView**       | Adapts controller/session state to page, tools, settings, and status presentation. Relays all component intent to FlatEarthController and distinguishes instances by their stable identity.                                                                                                                                    |

### React Components

| Proposed component     | Purpose and function                                                                                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FlatEarthPage**      | The feature page root. Receives its scoped presentation through FlatEarthView and composes the scene presentation. It does not locate configuration or rendering services directly.                                                                 |
| **SceneCanvas**        | A narrow renderer/DOM adapter. Supplies a mounted surface and measured size, reports camera gestures through its owning view/controller, and releases its attachment on unmount. It does not decide scene policy or construct caches during render. |
| **FlatEarthViewTools** | Presents that instance's height/FOV controls and any later selected viewing tools. Can appear in ViewportFrame without becoming workspace-owned.                                                                                                    |
| **FlatEarthSettings**  | Presents feature-specific configuration for the named instance inside ConfigurationPanel. It does not own unrelated workspace or global settings.                                                                                                   |

The runtime is activated through the controller when its presentation surface
is ready; creating a React element alone does not start cache construction.
The base implementation uses a feature-private Three renderer adapter with a
React-owned canvas and ResizeObserver-driven layout adaptation. It needs no
React Three Fiber hook bridge; additional presentation composition remains open.

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

Shared location/date/time changes reach FlatEarthController through the main
configuration service.
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

Further configuration contracts, scene content, and configuration inventory
remain open. Model-service packaging and the first camera/renderer integration
are now implemented. These descriptions establish purpose and responsibility,
without prescribing properties, method lists, or an implementation sequence.

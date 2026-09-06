# `flat32` Stage 11 Migration Inventory

Focus: Selected controls and explicit product backlog.

Related owners: [runtime-integration](../runtime-integration/flat32-migration-inventory.md).

## Behavior Classification

### Required in 11.2

| Behavior                            | Required 11.2 outcome                                                                                                                                                                                                                                                                                          | Destination owner                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Startup and repeat-load cleanup     | Start one application under `#main-content`; dispose an earlier local instance before replacement.                                                                                                                                                                                                             | `index.js` and `Flat32Application`                                                              |
| Minimal DOM                         | Own a canvas, setup/progress overlay, ready status, and failure status.                                                                                                                                                                                                                                        | `Flat32View`                                                                                    |
| Three runtime                       | Own the host-sized renderer, scene, perspective camera, viewport, frame scheduling, direct fallback, and lazy composer/base pass.                                                                                                                                                                              | `ThreeSceneRuntime`                                                                             |
| Fixed spherical/distant mode        | Create one current, unit-bearing spherical/distant configuration using the native production profile, full production domains, and ordinary N4 request.                                                                                                                                                        | `SphericalDistantMode`                                                                          |
| Algorithm32 attachment              | Own the facade, cache backend, shader handle, setup cancellation, atomic successful installation, and disposal order.                                                                                                                                                                                          | `Algorithm32Runtime`                                                                            |
| Live renderer bindings              | Refresh inverse projection/view and physical camera position through current binding contracts before rendering.                                                                                                                                                                                               | `Algorithm32Runtime`, using camera state supplied by `ThreeSceneRuntime`                        |
| Stage 10 captured-scene composition | Capture the Three scene in renderer-linear sRGB before the atmosphere pass and exercise both Star branches: scene RGB attenuated by RGB-band transmittance for an in-atmosphere endpoint and unchanged scene RGB for background. Combine it with E8-projected path linear sRGB at the single display boundary. | `ThreeSceneRuntime`, `Algorithm32Runtime`, `ShaderRuntimePass`, and `BrunetonColorDisplayModel` |
| Minimal endpoint scene              | Add the ground, six lightweight matte review shapes, source-derived seven-light flat/local Three set, and exact fixed six-map shadow result needed for a usable solid scene and later composition.                                                                                                             | `EndpointScene`, `LocalSunSceneLighting`, and `ThreeSceneRuntime`                               |
| Observable setup result             | Keep the solid Three scene as a visible setup/failure fallback; accept 11.2 only after an Algorithm32-produced frame is observed.                                                                                                                                                                              | `Flat32Application` and `Flat32View`                                                            |
| Runtime failure handling            | Report setup and WebGL-context failure without an unhandled rejection or a silent blank canvas.                                                                                                                                                                                                                | `Flat32Application`, `Flat32View`, and `ThreeSceneRuntime`                                      |
| Complete cleanup                    | Remove listeners and frames and dispose scene objects, shader/controller/cache resources, facade, composer-owned resources, renderer, and backend exactly once.                                                                                                                                                | Each owning class, coordinated by `Flat32Application`                                           |

The current checkpoint completes startup, DOM, host-sized direct Three runtime,
ordinary scene content, the complete initial seven-light renderer topology,
the fixed six-map shadow result, fixed spherical/distant configuration,
Algorithm32 construction and attachment, live bindings, the Stage 10
composition execution path, failure fallback, and coordinated cleanup. The
captured-scene implementation and strict Flat32 browser result complete 11.2.

The first atmospheric slice remains deliberately fixed. It does not require
location, clock, mode, profile, benchmark, or diagnostic controls.

### Required in later Stage 11 increments

| Behavior from the source app                                                              |                     Stage | Required migration decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------- | ------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flat geometry and finite local Sun                                                        |                      11.3 | Implemented through `FlatLocalMode`, using the same runtime and endpoint owners as the first slice. The production controller now fuses both N4 stored-field transport passes on the GPU and reports zero packed Flat transport bytes. The focused browser lane verifies selected values from its 285-position production realization.                                                                                                                                                                  |
| Flat-to-globe mode button and per-mode state                                              |                      11.3 | Complete through `ModeController`: an isolated composer prepares and preflights the candidate; publication installs it before the replaced runtime is disposed. The focused browser lanes verify spherical/distant → flat/local → spherical/distant, candidate failure restoration, and constructor-failure cleanup. Per-mode camera-pose persistence remains in 11.4.                                                                                                                                |
| Pointer lock, pointer speed and polar limits                                              |                      11.4 | Move to `PointerLookController`, including removable listeners and disposal.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Initial camera pose and per-mode saved poses                                              |                      11.4 | Keep in the interaction/camera owner; do not put camera policy in the Algorithm32 runtime.                                                                                                                                                                                                                                                                                                                                                                                                            |
| Shader enable/disable control                                                             |                      11.4 | Retain as interaction behavior while keeping the solid scene a fallback, not the atmospheric acceptance result.                                                                                                                                                                                                                                                                                                                                                                                       |
| Location presets                                                                          |                      11.5 | In progress: `LocationTimeController` owns San Jose/Union Glacier transitions and purely returns the derived distant direction and finite flat/local position. `Flat32Application` merges that result into one application-state snapshot, renders every control from it, then submits the same snapshot for transactional scene replacement after the retained delay.                                                                                                                                |
| Flat rotation presets and globe sunrise/noon/sunset plus offsets                          |                      11.5 | In progress: Flat 0/45/90/135/180 and Flat/Globe Sunrise/Solar-noon/Sunset controls retain the source application's solar-noon anchoring, polar fallback, hour/minute offsets, 450 ms coalescing delay, and finite flat-Sun calculation. The focused browser lane verifies immediate state-derived Flat 180 selection followed by publication of a different flat/local source position.                                                                                                              |
| Delayed time refresh                                                                      |                      11.5 | In progress: the source application's 450 ms latest-state delay is implemented with disposal cancellation. Requested control state is distinct from published atmosphere facts while a candidate builds; the setup panel reports the exact requested pairing, location, resolved time, and preset without overwriting those last-published facts. A failed current candidate restores the last published application state and rerenders its controls.                                                |
| Control-derived flat/local radial domain                                                  |                      11.5 | Implemented: `FlatLocalMode` retains the exact physical source position and sets the existing scaled cache rho maximum to `max(4.8 Mm, observer rho)` for each candidate. This prevents Union Glacier Flat 0 and Flat 180 from collapsing onto one 4.8 Mm cache row. The focused real-browser lane verifies approximately 37.538-degree versus 8.738-degree source-bearing elevations and different composed output; expanded-domain convergence beyond the measured 4.8 Mm case remains unqualified. |
| Geometry-owned ground visual and source-owned scene lighting                              | scene checkpoint and 11.6 | The initial seven-light topology and six-map result are present. The endpoint scene now rebuilds the visible ground through the active geometry: flat uses its plane and globe uses a local spherical patch. Spherical/distant source changes update light direction, production direct/twilight-aware ambient scales, and explicit shadow invalidation.                                                                                                                                              |
| Six reconciliation review boxes                                                           | scene checkpoint and 11.6 | Their lightweight matte shapes and per-object shadow layers are present. On a mode replacement, each center is now mapped through the active geometry's `mapGroundOffsetToScenePoint`, so globe objects follow the spherical surface and flat objects remain planar. Expanded dynamic shadow-frame work remains for `ReviewSceneContent`.                                                                                                                                                             |
| Geometry-projected shadow receivers, per-object shadow layers, and spherical ground patch | scene checkpoint and 11.6 | The flat checkpoint owns its fixed receiver and layers. Recast dynamic projection and the spherical ground patch in `ReviewSceneContent`, preserve geometry ownership, and keep resource limits explicit.                                                                                                                                                                                                                                                                                             |
| Mode, location, time, and shader UI labels                                                |                 11.3-11.5 | `Flat32ApplicationState` is the sole control-state snapshot. Events update it first, `Flat32View.showApplicationState` renders all controls second, and the scene candidate and its progress presentation consume that same snapshot third. Published atmosphere summaries no longer mutate controls, and ready text derives its pairing from the successfully published summary. Shader control remains with its later slice.                                                                        |
| Final inventory reconciliation and dependency scans                                       |                 11.7-11.8 | Close every row here and prove no source/build/output path reaches the former repository.                                                                                                                                                                                                                                                                                                                                                                                                             |

### Explicitly omitted

The following source behaviors do not migrate:

- `SHADER_QUALITY_PROFILES`, the `fast` default, the quality selector, quality
  labels, profile-derived numerical controls, user-selectable transport/cache
  optimizations, and profile reports. This omission does not include the
  mandatory engine-level fused transport implementation;
- the live performance toggle, timer-query sampling, performance panel,
  benchmark runner, benchmark viewport, benchmark report, and
  `window.flat32LastBenchmark`;
- the former custom five-by-seven local-cache node selection;
- the superseded Algorithm32 implementation and all runtime translation or
  compatibility paths to it;
- the atmosphere-only green-background diagnostic and the green-shell
  endpoint diagnostic, which were setup/debug probes rather than required
  application behavior; and
- the monolith's runtime-freezing and module-local class-support helpers.
  New code follows the current type-checking, class-helper, constant, and file
  organization rules directly.

Supported-hardware performance qualification remains later project work.
Removing the old in-app benchmark does not claim that qualification has
occurred.

### Future Application Cache Quality Profiles And Feature Policies

Status: proposed post-migration application design. It is not implemented and
is not part of the Stage 11 acceptance gate.

The omitted source application's `SHADER_QUALITY_PROFILES`, `fast` default,
profile-derived legacy controls, and benchmark UI remain omitted. This is a
new application-state design over the current production Algorithm32 owner
contracts, not a migration, alias, or compatibility layer for those profiles.

The
[archived local-Sun cache characterization](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/cache/local-sun-cache-design.md)
is intended to produce error, realized-node, projected-byte, measured-resource,
and descriptive slice-timing curves rather than select one global cache size.
Those curves can expose tuning levers for later application profiles. They do
not select a Flat32 profile, prove that different numerical controls compose
independently, or establish production GPU build latency.

The application-facing term is **cache quality profile** so it is not confused
with an atmosphere, ground, or boundary profile. The application separates
four categories:

| Category                           | Examples                                                                                                                                                                                                                       | Application rule                                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Physical state and invariants      | source position and other time-derived physical inputs, source spectrum and distance law, atmosphere, geometry, world boundary, and ground                                                                                     | Never changed to satisfy a quality profile or feature budget.                                                                                                           |
| Cache numerical configuration      | position family and retained level, maximum scattering order, independently validated angular domains and construction controls, or storage/precision/layout variants preserving the same declared quantity and spectral basis | Changes cache identity and requires evidence for the complete resolved combination.                                                                                     |
| Final-view numerical configuration | path interval count, path-sample distribution, and other independently validated view-only controls                                                                                                                            | Changes the application profile but must not numerically invalidate an unchanged cached field; actual reuse still depends on the attachment lifecycle.                  |
| Value-neutral execution policy     | scheduler yield cadence, request coalescing, cancellation, and build priority                                                                                                                                                  | May change responsiveness without changing cached values; it remains outside the numerical fingerprint only after that neutrality is proved and is reported separately. |

A changed spectral basis is a coordinated cross-owner change to the source,
atmosphere, cached field, layout, and display boundary. It is not merely a
cache storage knob and requires a separately selected application and
transport configuration.

#### Profile identity and application state

A cache quality profile is a versioned, content-addressed bundle of complete
resolved numerical values, not a mutable display label. Flat32 may expose a
profile only after that complete combination has its own accuracy, resident
and transition-peak memory, build-latency, steady-runtime, supported-hardware,
and applicable feature-cadence evidence. Parameters are not presumed
independently composable.

Profiles select validated owner configurations. They do not add
caller-selected position domains, layouts, or construction controls to the
generic cache-build request. The source, geometry, atmosphere, ground, and
cache owners continue to derive and fingerprint the concrete plan through the
existing typed boundaries.

Let $\mathcal{P}_{\mathrm{user}}$ be the persistent user-selected profile and
let $\mathcal{O}_{\mathrm{active}}$ be the ordered set of active
feature-scoped policies. Flat32 resolves one effective profile:

$$
\mathcal{P}_{\mathrm{effective}}
=
\operatorname{validate}
\left(
  \operatorname{resolve}
  \left(
    \mathcal{P}_{\mathrm{user}},
    \mathcal{O}_{\mathrm{active}}
  \right)
\right).
$$

Each feature policy is a registered, bounded transformation over eligible
quality axes. Resolution order, priority, and conflict behavior are
deterministic. The result must be one complete validated configuration;
Flat32 may not synthesize an untested combination by independently mixing
convenient parameter values.

The persistent user selection, active feature policies, effective requested
profile, staging generation, and published scene/cache descriptor are
distinct application state. Controls first update that authoritative state,
then render the persistent selection and any temporary effective override,
and finally request the scene represented by the same resolved state.
Progress and diagnostics report requested physical state/effective profile
separately from published physical state/profile. They must not present an old
cache as though it represented a newly requested time or source.

A feature override never mutates the stored user selection. If the user
changes their preferred profile while an override is active, releasing the
override resolves to the latest selection rather than a snapshot captured
when the feature began.

The source-controller owner derives the cache fingerprint from the complete
plan and result-field identity; source, atmosphere, geometry, and ground
identities; resolved cache numerical configuration; and complete backend
capability record. A profile label is never a fingerprint substitute. Clock
labels or timestamps are presentation metadata; their resolved source
position and any other time-dependent physical owner state participate
through the physical owner identities.

Value-neutral scheduler and coalescing policy do not belong in the numerical
fingerprint and do not invalidate cached values. Current attachment/controller
ownership may nevertheless rebuild when one of those objects changes unless a
separately implemented reuse rule proves that reuse is safe.

#### Time-animation feature policy

The selected recurrence and generic build graph support complete cumulative
cache requests for:

$$
N\in\{1,2,4\}.
$$

A future time-animation policy may temporarily resolve:

$$
N_{\mathrm{animation}}=1,
\qquad
J_{\mathrm{through}\,1}=J_1.
$$

This is a complete N1 cache, not a partial N4 build and not the shell study's
direct-$J_2$ authority packet. Any additional animation reduction, such as a
smaller position level or different construction control, requires its own
predeclared profile evidence.

The application lifecycle is:

1. Starting animation activates the feature policy without changing
   $\mathcal{P}_{\mathrm{user}}$.
2. Every requested time resolves a complete physical source state and N1
   effective profile. That pair receives one desired scene/cache generation.
3. Rapid time changes coalesce or cancel superseded generations. Only the
   newest complete matching source/cache candidate may publish. Source state,
   endpoint lighting, shadows, atmosphere cache, and displayed published-time
   status change as one consistent scene generation.
   A generation started under the animation policy may never publish after
   that policy has been released, even if its cache construction finishes
   later.
4. If construction cannot keep up, Flat32 skips or coalesces requested time
   samples or visibly reports the requested/published distinction. It never
   combines a new source time with a stale cache and labels the frame current.
5. Ending or cancelling animation releases the feature policy. The resolver
   applies the latest user-selected profile to the final physical time, stages
   that complete build, and publishes it atomically. The matching final-time
   N1 scene may remain active while the user-profile scene is staged.
   If restoration fails, the last internally consistent published generation
   remains visible, the failed requested state is reported, and the persistent
   user selection is not rewritten.

N1 reduces recurrence work but does not itself prove smooth animation. A
moving local source still invalidates its source-dependent cache. The feature
requires measured cadence, cancellation, coalescing, restoration, and
transition evidence. The N1-to-user-profile transition may visibly change
quality; any temporal blend is a separate numerical/display policy.

#### Ownership and lifecycle

| Owner                                                                | Responsibility                                                                                                                                                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Flat32Application` or a later focused application-state coordinator | Own persistent user profile, feature policies, effective requested state, latest scene generation, and source-changing candidate cancellation/publication.                   |
| A focused profile resolver, named only when implementation begins    | Resolve registered profiles and feature policies into one complete validated application configuration without owning cache resources.                                       |
| `Flat32View`                                                         | Render persistent, temporary-effective, staging, and published profile/state facts from application state; never infer them from controls or cache dimensions.               |
| Mode/configuration owners                                            | Instantiate validated production owner configurations from the resolved application profile; do not translate legacy profile objects or expose raw generic cache-plan knobs. |
| Source cache controller                                              | Remain the sole owner of cache fingerprinting, exact reuse, generation, and atomic cache publication.                                                                        |
| Application scene-generation coordinator                             | Stage source state, endpoint lighting, shadows, runtime attachment, and controller-completed cache, then publish them as one latest consistent scene generation.             |

Existing cache, configuration, and runtime primitives provide supersession,
cancellation, failure-isolation, exact-reuse, and atomic-publication
mechanisms within their current ownership scopes. They do not yet implement
this moving-source feature. The scene-generation coordinator must integrate
one latest-generation boundary across source-changing candidates without
creating a second cache lifecycle.

The profile-transition contract must retain at most one active scene/cache and
one staging build across the application generation. Resource evidence
includes their combined transition peak, especially an active N1 result while
N2 or N4 is staged. Current source-changing Flat32 candidates do not yet
establish that integrated bound. Cache history, multi-profile residency,
incremental N1-to-N4 construction, reuse across unequal fingerprints, and
transition blending are separate work and are not assumed.

Before implementation, freeze:

- registered profile contents, eligible axes, revision and content identity;
- feature-policy priority, conflict, nesting, release, failure, and
  user-change-during-override semantics;
- persistent-user, active-feature, effective-requested, staging, and published
  application-state records;
- complete profile and cache fingerprint rules, including which controls
  invalidate the cache and which are proved value-neutral;
- source/time and cache atomicity, latest-generation publication, coalescing,
  cancellation, exact final-state restoration, and stale-generation tests;
- per-profile accuracy, complete resident and active-plus-staging transition
  peak, build latency, steady runtime, supported-hardware, and feature-cadence
  gates; and
- any cache-history, cross-profile reuse, incremental-order, or transition-
  blend policy. None is inherited by default.

### Deferred to a later project stage

The 192 synthetic star analogs, A-H star calibration ladder, screen-space star
labels, magnitude styling, and direct dependency on `PocStars.js` belong to
Stage 12's extraterrestrial work. They must not be imported as ordinary
Stage 11 scene content merely because the source application displayed them.


## Completed Attachment And Remaining Stage 11 Checks

The strict Stage 11.2 gate passes:

1. the application builds and type-checks from repository-local inputs;
2. Chrome observes host-sized, device-pixel-ratio-aware output, including a
   resize, and the complete initial light, target, 4096 shadow-map, caster,
   and receiver diagnostics;
3. the direct scene advances across cache-layer scheduler yields;
4. setup reaches a spherical/distant Algorithm32 frame using ordinary N4,
   full Native-48/Fibonacci-34/W27/native-15 domains, and production
   15-interval construction and final-view controls;
5. the composer center scene-input pixel is nonzero and the final output pixel
   is nonzero and different through Star's display-boundary RGB-band
   attenuation;
6. no runtime, linker, or WebGL error occurs, and cleanup stops all frame
   counters; and
7. publication remains atomic with direct rendering as the failure path.

Stage 11.3's flat/local mode and transactional switching are complete,
including failure restoration and unowned-resource cleanup. The later fused
transport correction removes synchronous Flat transport-table construction
without moving atmospheric math into `FlatLocalMode` or `Algorithm32Runtime`.
Stage 11.8 has
already verified default N4 and Stage 9.6 scanned source and built output for
containment. The remaining final-closure work—11.7 inventory reconciliation,
confirmed 11.4 through 11.6 gaps, and a migration-wide final dependency
scan—is deferred to later follow-up. It must not be represented as completed
migration acceptance.

The source repository remains migration evidence, not a fallback
implementation or runtime/build dependency.

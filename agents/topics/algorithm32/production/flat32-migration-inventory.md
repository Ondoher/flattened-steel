# `flat32` Stage 11 Migration Inventory

Status: sufficient for immediate application use. Stages 11.1 through 11.3
are complete. The focused browser lanes verify both supported-pair
transitions, candidate failure restoration, constructor-failure cleanup, and
ordinary N4. The implemented portions of Stages 11.4 through 11.6 remain in
use. Every remaining Flat32 migration, reconciliation, and release-closure
item is deferred to later follow-up; Stage 11.7 is not active and Stage 11.8
is not closed or accepted.
This document owns the migration classification and destination-owner map for
the working `flat32` application. It also owns the proposed post-migration
application cache-quality profile and feature-policy state model below. The
[production implementation plan](production-implementation-plan.md#11-integrate-flat32)
owns sequencing and gates.

## Source And Local Baseline

The application-behavior source inspected for this inventory is:

- `C:\dev\poly-gc-react\src\flat32\index.js`;
- 94,661 bytes and 2,945 lines; and
- SHA-256
  `c58f9050a077567dbc7c2fb6e14f0538a0dabbce18dc2b626a51cacd6e90ca35`.

That file is an import-time monolith. It owns DOM creation, Three setup,
Algorithm32 configuration and attachment, both supported atmospheric modes,
mode and camera state, location and time controls, scene objects, diagnostics,
performance tooling, the render loop, and partial cleanup.

The local `src/flat32` baseline during the read-only 11.1 inspection was the
migration stub:

- `index.js` starts the Polylith registry;
- `spec.js` imports the Polylith test entry;
- `templates/index.html` supplies `#main-content`; and
- `README.md` records the replacement boundary.

That stub has now been replaced by the runnable Stage 11 application. The
active entry composes focused view, scene, direct-render, mode, and Algorithm32
runtime owners. Its Three renderer fills the host viewport at the browser
device-pixel ratio. It renders the source application's matte ground and six
review-object shapes with the complete initial flat/local Three light topology:
one ambient light, six per-review-object source directionals, and all six
directional targets. It also retains the matching six isolated
4096-by-4096 PCF-soft shadow maps through the exact recast focus points and
orthographic cameras, six review-object caster layers, and the ground receiver.
It owns context/frame and cleanup behavior, retains direct rendering throughout
atmosphere setup, and installs a full-domain ordinary-N4 spherical/distant
Algorithm32 pass only after a real composed-frame preflight.

## Completed Stage 11.2 Gate State

The corrected production-atmosphere attachment is implemented and verified.
The current
fixed slice uses:

- spherical geometry and the distant Sun;
- canonical black ground;
- complete Native-48, Fibonacci-34, W27, and native-15 production domains;
- the ordinary maximum scattering order of N4;
- a host-sized, browser-device-pixel-ratio scene and final-composition target;
  and
- the Three scene captured in renderer-linear sRGB before the atmosphere pass.

The direct Three scene remains active while cache programs asynchronously
reach compilation readiness and construction yields between wavelength
layers. The final Algorithm32 runtime program also has an explicit
asynchronous preparation boundary. Cache construction and final-view transport
use the production default of 15 intervals. The final-view count remains a
runtime integer uniform, avoiding ANGLE's pathological compile-time unrolling.

The composer captures the ordinary scene before the atmosphere pass.
`ShaderRuntimePass` binds that read-buffer texture each frame. The retained E8
projection maps atmospheric native-15 path radiance to linear sRGB, while the
pinned Star compositor projects spectral transmittance into RGB bands,
attenuates the captured scene only at an in-atmosphere endpoint, and combines
both terms at the single display boundary. Scene RGB is not atmospheric cache
or transport data.

The candidate becomes the active render operation only after an actual
composed frame reports a runnable installed program, at least one runtime
frame, no runtime, linker, or WebGL errors, and a nonzero output pixel. Failure
restores direct rendering and disposes candidate Algorithm32 resources.

`npm run typecheck:flat32` passes for this corrected code. The standalone
Stage 10 Karma gate remains green. After the fused Flat/local transport
correction, the strict `npm run test:ui:flat32` application lane passes `3/3`
in Chrome Headless 151 in 53.181 seconds. Timing is diagnostic and the current
headless renderer is software. The lane reads the composer's center
scene-input pixel, requires it nonzero, and requires the final output pixel to
be nonzero and different, alongside the existing light, shadow, domain,
runtime, WebGL, responsiveness, and lifecycle checks. The current application
uses the final ordinary N4 default.

### Completed source-light and shadow slice

The scene checkpoint recasts the source application's initial Union Glacier /
Flat 0 renderer-light result without importing the superseded light-source
implementation. The fixed source state is rigidly expressed in the
checkpoint's existing camera-relative review-object frame. The installed
observable result is:

- one `AmbientLight`;
- six per-review-object `DirectionalLight` objects;
- six directional targets;
- ambient intensity `0.37943331351924703`; and
- aggregate directional intensity `1.4677190896762844`, split equally across
  the six directionals.

No point light or optional endpoint-fill light participates in that source
state. `LocalSunSceneLighting` owns creation and disposal, and the browser
gate observes the counts, targets, aggregate intensities, advancing frames,
nonzero drawing buffer, and zero WebGL error.

The same slice installs all six source shadow configurations:

- one unique shadow-camera layer per review object, numbered 1 through 6;
- each review object casts and receives on its unique layer while retaining
  the ordinary camera's layer 0;
- the ground receives all six layers and does not cast;
- exact source-derived focus points, directional-light distances, and
  orthographic camera bounds for every review object;
- 4096-by-4096 maps, zero bias and normal bias, configured radius `4`, and
  per-object shadow intensity `6` so each isolated map can fully occlude its
  allocated direct-light contribution; and
- `PCFSoftShadowMap` under the installed Three version, with the source's PCF
  fallback retained.

The runtime rejects WebGL limits below 4096 rather than allowing Three to
silently clamp a map. The first completed scene frame allocates all six maps;
the current spherical/distant location/time control path maps its active
production source direction into the checkpoint lights, derives direct and
twilight-aware ambient intensity through `DistantSunLightSource` using the
application's `0.02` to `0.24` presentation range, and requests
one renderer shadow-map refresh for each source replacement. The configured
radius is retained for source parity even though Three's PCF-soft shader does
not consume it.

This checkpoint renderer-light recast is not a second atmospheric light-source
model. Its spherical/distant updates already take source direction and
light-scale facts from the production owner. When Stage 11.3 connects the
production flat/local mode, its dynamic source state must likewise flow from
that mode's production light-source owner; a parallel source policy is
prohibited.

This fixed shadow result is still a bounded scene checkpoint. It does not
complete Stage 11.3's production flat/local atmospheric configuration or
Stage 11.6's dynamic geometry/source ownership, spherical receiver content,
and shadow invalidation during object or source motion.

The fixed renderer-light result is visible in the direct fallback and is
captured into the composer's renderer-linear scene texture before the
atmosphere pass. Star's display-boundary compositor attenuates that captured
scene with its RGB-band projection of spectral transmittance. The lights and
shadow maps remain presentation data; they do not enter atmospheric cache
construction.

## Dependency And Build Inventory

### Direct imports

| Source dependency                                          | Observed use                                                                 | Migration disposition                                                                                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `three`                                                    | Renderer, scene, camera, materials, geometry, lights, math, and disposal     | Retain from this repository's installed `three` dependency.                                                                               |
| `PointerLockControls`                                      | Mouse-look interaction                                                       | Migrate in 11.4, not in the first slice.                                                                                                  |
| `EffectComposer` and `RenderPass`                          | Solid-scene pass followed by Algorithm32 composition                         | Retain from local Three examples; `ThreeSceneRuntime` creates them lazily for the Stage 11.2 attachment while preserving direct fallback. |
| Eleven modules under `../../shared/algorithm32/production` | The former Algorithm32 facade, owners, constants, profiles, and synchronizer | Do not migrate or import. Adapt the application directly to `src/algorithm32`.                                                            |
| `PocStars.js`                                              | Only supplies the magnitude range used by synthetic-star diagnostics         | Defer with the synthetic-star work to Stage 12. It is not an 11.2 dependency.                                                             |

The old application imports no image, model, shader, JSON, or generated
artifact and performs no runtime `fetch` or dynamic import. Its first slice
therefore needs no migrated asset tree.

At inventory time, the old and local `builds/flat32.json` files were
byte-identical, with SHA-256
`21307ee5a63634d80920cad9014535330aef78318f2113006a468ab0366f54a7`.
The local build now additionally owns the focused browser test group and the
`assets/css` stylesheet copy path. The two HTML templates remain equivalent.
No build file resolves through the source repository.

`npm run build:flat32` first removes only the generated `dist/flat32` and
`tests/flat32` trees through the repository-local cleaner. This prevents old
atmosphere/composer chunks from surviving a scene-only rebuild; both
directories are regenerated outputs and are excluded from Git.

The old `spec.js` contains only `import '@polylith/tests'`; it is not
application-behavior or browser-render evidence by itself. The local Polylith
test group now bundles the observable application spec, and the focused
Karma/Chrome lane runs that generated bundle against the built application.

### Engine adaptation boundary

The former engine imports are behavioral clues, not migration inputs. The
application must use the current:

- `Algorithm32`;
- `CanonicalAtmosphere`;
- `SphericalEarthGeometry` and, beginning in 11.3, `FlatEarthGeometry`;
- `DistantSunLightSource` and, beginning in 11.3,
  `LocalSunLightSource`;
- native production profile and unit-bearing quantities;
- `BrunetonColorDisplayModel`;
- `ThreeCacheBackend`;
- the composer read-buffer scene-color binding; and
- source-owned GPU cache controller and runtime sampler.

Do not translate the former config at runtime. In particular, the former
scalar unit-suffixed fields, quality-profile controls, hand-selected local
cache bins, and old shader-setup request are not current contracts.

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
[archived local-Sun cache characterization](../cache/local-sun-cache-design.md)
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

## Destination Owner Map

Create an owner only when its vertical increment begins. The target ownership
is nevertheless fixed before migration. Owners now exist for the entry,
application, view, Three runtime, endpoint scene, lighting, Algorithm32
runtime, both supported modes, transactional mode switching, pointer-look,
location/time state, constants, type-check support, CSS, and browser lanes.
The proposed `ReviewSceneContent` extraction remains absent pending the 11.6
ownership reconciliation. The temporary `MatteEndpointTexture` owner was
deleted when the Star compositor was restored.

| Target file                                               |               First stage | Sole responsibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------- | ------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/flat32/index.js`                                     |                      11.2 | Thin Polylith/startup composition entry; no application algorithms or scene helpers.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `src/flat32/Flat32Application.js`                         |                      11.2 | Top-level start, owner composition, setup state, failure routing, and reverse-order disposal. Exports only `Flat32Application`.                                                                                                                                                                                                                                                                                                                                                                  |
| `src/flat32/Flat32View.js`                                |                      11.2 | DOM shell, canvas access, progress/ready/error presentation, and later control presentation. Exports only `Flat32View`.                                                                                                                                                                                                                                                                                                                                                                          |
| `src/flat32/ThreeSceneRuntime.js`                         | scene checkpoint and 11.2 | Host-sized renderer, scene, camera, direct fallback, lazy composer/base pass, source shadow-map policy and capability gate, frame/context/resize listeners, render-operation replacement, and Three disposal. Exports only `ThreeSceneRuntime`.                                                                                                                                                                                                                                                  |
| `src/flat32/Algorithm32Runtime.js`                        |                      11.2 | Current facade/backend setup, live bindings, installed-handle publication, cancellation, and engine-resource disposal. Exports only `Algorithm32Runtime`.                                                                                                                                                                                                                                                                                                                                        |
| `src/flat32/SphericalDistantMode.js`                      |                      11.2 | Fixed native-production spherical geometry and distant-Sun config/description. Exports only `SphericalDistantMode`.                                                                                                                                                                                                                                                                                                                                                                              |
| `src/flat32/EndpointScene.js`                             |          scene checkpoint | Matte ground/review-object composition, fixed caster/receiver layers, installation, observable scene facts, and object/material/geometry disposal. Exports only `EndpointScene`.                                                                                                                                                                                                                                                                                                                 |
| `src/flat32/LocalSunSceneLighting.js`                     |          scene checkpoint | Recast the source application's initial one-ambient/six-directional light topology, targets, exact shadow focuses/cameras, and per-light map policy; report aggregate observable facts; and dispose owned lights/maps. It does not own atmosphere transport. Exports only `LocalSunSceneLighting`.                                                                                                                                                                                               |
| `src/flat32/ModeController.js`                            |                      11.3 | Supported-pair selection and prepare/publish/rollback lifecycle. Exports only `ModeController`.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/flat32/FlatLocalMode.js`                             |                      11.3 | Complete production flat geometry/local-Sun config/description using the selected 100 km, scaled 19-by-15 / paired-Fibonacci-34 / W27 / native-15 realization and ordinary N4 request. Each control-derived candidate preserves the physical Sun and scales the 15 radial fractions to at least the observer's source-subpoint rho, with 4.8 Mm as the minimum. Only the measured 4.8 Mm realization is convergence-qualified. Exports only `FlatLocalMode`.                                     |
| `src/flat32/PointerLookController.js`                     |                      11.4 | Implemented first independent interaction slice: pointer-lock listeners, migrated look sensitivity/polar bounds, camera rotation, lock-state reporting, and cleanup. Supported-mode pose persistence remains with the later mode controller. Exports only `PointerLookController`.                                                                                                                                                                                                               |
| `src/flat32/LocationTimeController.js`                    |                      11.5 | Substantially implemented location/time selection, source-app-compatible time resolution, globe offsets, and `FlatSynchronizer` distant-direction/finite-local-position derivation. `Flat32Application` submits the resulting active-pair candidate transactionally with requested-versus-published state and a 450 ms latest-state delay. Reconcile any location/source-specific failure assertion and remaining interaction behavior before acceptance. Exports only `LocationTimeController`. |
| `src/flat32/ReviewSceneContent.js`                        |                      11.6 | Extract mode-aware review boxes, dynamic ground/shadow projection requests, invalidation, and associated owned Three resources from the fixed checkpoint. Exports only `ReviewSceneContent`.                                                                                                                                                                                                                                                                                                     |
| `src/flat32/consts.js`                                    |                      11.2 | Application-owned constants only. No class exports.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `src/flat32/types.d.ts`                                   |                      11.2 | Shared application contracts used by more than one owner.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `src/flat32/assets/css/flat32.css`                        |          scene checkpoint | Built application-shell and state styling.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/flat32/jsconfig.json` and Polylith declaration shims |          scene checkpoint | Focused JavaScript type-check boundary without importing unchecked Polylith package source.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `src/flat32/_tests/flat32-application.browser.js`         |                      11.2 | Observable browser setup, actual shadow allocation/configuration, output, WebGL state, responsiveness, and disposal checks; no class-shape assertions.                                                                                                                                                                                                                                                                                                                                           |
| `spec/support/karma-flat32.conf.cjs`                      |                      11.2 | Focused real-Chrome application lane and browser-test entry.                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Class-specific helpers remain private methods, including pure helpers. Private
fields and methods follow the canonical single-underscore convention selected
by the [standards manifest](../../standards/manifest.md);
ECMAScript hash-private names are not used.
Reusable pure operations move to a focused utility file or namespace owner.
Class modules export only their class. Constants live in `consts.js`;
non-class filenames use kebab-case; and namespace-style method owners, if any
are later justified, use their PascalCase namespace name.

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

# Algorithm32 Production Implementation Plan

Focus: Selected controls and explicit product backlog.

Related owners: [architecture-contracts](../../production-algorithm32/architecture-contracts/production-implementation-plan.md), [transport-geometry](../../production-algorithm32/transport-geometry/production-implementation-plan.md), [qualification](../../production-algorithm32/qualification/production-implementation-plan.md), [protocols](../../poc-experiments/protocols/production-implementation-plan.md).

### 11. Integrate `flat32`

Status: sufficient for immediate application use. Stage 9.6 is complete and
no longer blocks this work. Stages 11.1, 11.2, and 11.3 are complete; the
implemented portions of 11.4 through 11.6 provide the current Flat32
application behavior. The user has deferred every remaining Flat32 migration,
reconciliation, and release-closure item to later follow-up. Consequently,
11.7 and the unfinished portions of 11.4 through 11.6 are not active work,
and 11.8 remains deferred rather than closed or accepted.

Execute Stage 11 as runnable vertical increments, not as a whole-application
copy or a component-first rewrite. The current working source is a large
import-time module that combines bootstrap, rendering, both atmospheric modes,
controls, scene content, diagnostics, performance tooling, and disposal.
Recast each behavior into its production owner while migrating it. Do not copy
that monolith here and postpone decomposition.

Keep `src/flat32/index.js` as a thin composition and startup entry. Separate
application lifecycle, Three renderer/scene/frame ownership, Algorithm32
runtime ownership, supported-mode configuration, UI/status controls, and
scene-content ownership into focused files as those capabilities move. Class
modules, helpers, constants, exports, and filenames follow the canonical code
rules selected by the [standards manifest](../../standards/manifest.md) during
migration rather than in a later cleanup.

After every implementation increment from 11.2 onward:

- the local application build succeeds;
- Chrome reaches a rendered frame through the capability accepted by that
  increment;
- setup progress and failure remain observable;
- frame, listener, Three, shader, cache, and backend ownership dispose cleanly;
- the implementation remains non-React and, whenever an increment uses
  Algorithm32, imports only the production implementation present here;
- no runtime, source, asset, generated reference, or build dependency resolves
  through `C:\dev\poly-gc-react`; and
- unsupported quality/performance-profile controls, the superseded
  Algorithm32 implementation, compatibility bridges, and old/new runtime
  switches remain absent.

#### 11.1 Inventory behavior and define target owners

**Status: complete.**

- Inspect `C:\dev\poly-gc-react\src\flat32\index.js`, its direct dependency
  closure, scene integration, assets, configuration, and build wiring.
- Classify each behavior as required for the first vertical slice, required in
  a later Stage 11 increment, explicitly omitted, or deferred to a later
  project stage.
- Define the focused destination owners before moving each behavior. Keep the
  existing local stub active while this read-only inventory and module map are
  completed.

The canonical classification and destination file map are the
[Stage 11 migration inventory](../runtime-integration/flat32-migration-inventory.md).

#### 11.2 Deliver the first spherical/distant vertical slice and cut over

**Status: complete.**

The local vertical slice now has these implemented boundaries:

- `ThreeSceneRuntime` sizes its CSS canvas, drawing buffer, camera, and
  composer targets from the host viewport at the browser device-pixel ratio.
  It owns the ordinary direct render fallback and lazily owns the composer and
  base scene pass when atmosphere setup begins. Host size changes affect only
  scene/final-composition pixels; they do not reduce the atmospheric cache or
  six 4096-by-4096 shadow maps.
- `SphericalDistantMode` creates current unit-bearing spherical geometry,
  distant-Sun configuration, native production profile, canonical black
  ground, complete Native-48/Fibonacci-34/W27/native-15 domains, and the
  ordinary N4 request. No reduced diagnostic domain or legacy quality profile
  enters the application.
- `Algorithm32Runtime` owns the facade, Three cache backend, live camera
  bindings, setup cancellation, shader handle, atomic publication,
  direct-render failure fallback, and ordered cleanup. It owns no spectral
  endpoint texture.
- `ThreeCacheBackend` awaits Three asynchronous compilation readiness when it
  is available, `CacheGpuExecutor` yields between wavelength layers and at
  pass boundaries through the application scheduler, and
  `ShaderRuntimePass`/`Algorithm32ShaderHandle` expose the same asynchronous
  final-program preparation boundary.
- Cache construction and final transport both use the production default of
  15 uniform intervals. The final-view
  integer count is a runtime uniform so ANGLE does not compile-time unroll the
  complete transport/W27 call graph.
- The ordinary Three scene is captured in renderer-linear sRGB before the
  atmosphere pass. `ShaderRuntimePass` binds that composer read-buffer texture
  each frame, and `BrunetonColorDisplayModel` applies Star's RGB-band
  transmittance only at the display boundary. Scene RGB is not atmospheric
  cache or transport data.
- Publication occurs only after an actual composed frame reports an installed
  runtime, at least one completed runtime frame, runnable programs, zero
  runtime/link/WebGL errors, and a nonzero output pixel. A failed setup restores
  the working direct scene without publishing a partial runtime.

The strict `npm run test:ui:flat32` lane passes `1/1` in Chrome Headless 150
on D3D11. It observes fixed
dimensions and complete production domain identities, responsive direct-frame
progress during cache construction, an installed Algorithm32
frame, zero runtime/link/WebGL errors, subsequent frame progress, and stopped
frames after cleanup. It also reads the composer's center scene-input pixel,
requires that input to be nonzero, and requires the final output pixel to be
nonzero and different. The
[baseline import status](../../production-algorithm32/qualification/baseline-import-status.md#focused-stage-112-flat32-browser-reproduction)
owns that historical result. Stage 9.6.5 restored and verified default N4
ahead of the broader Stage 11.8 acceptance work.

#### 11.3 Add flat/local and transactional mode switching

**Status: complete.** `FlatLocalMode` uses the selected production N4
flat/local configuration through the same application/runtime owners as
spherical/distant. `ModeController` prepares an isolated candidate, publishes
only after successful preflight, restores and republishes the last valid
runtime after setup failure, and disposes candidate or unowned
mode/composer/target resources. The focused browser coverage verifies
spherical/distant to flat/local to spherical/distant transitions and the
failure/cleanup paths. Per-mode camera-pose persistence remains an interaction
concern in 11.4, not an open mode-publication concern.

- Add a focused flat/local configuration owner through the same application
  and Algorithm32 runtime owners used by spherical/distant.
- Keep the last valid atmosphere and scene usable while a replacement mode is
  prepared. Publish the new mode only after setup succeeds; on failure,
  preserve the previous mode and report the error.
- Verify globe-to-flat-to-globe transitions, required-object replacement,
  camera state, cache/runtime disposal, and the absence of unsupported
  flat/distant or spherical/local paths.

#### 11.4 Migrate essential interaction in working slices

- **Deferred follow-up:** `PointerLookController` now provides the independent
  pointer-lock camera-rotation slice. It retains the legacy pointer speed and
  polar limits, locks from a canvas click, reports lock state accessibly, and
  disposes its listeners. Resize behavior and setup/status presentation also
  exist. Per-mode camera poses and shader enable/disable are the confirmed
  remaining interaction gaps.
- Migrate pointer-look, camera poses, resize behavior, shader enablement,
  setup/status presentation, and related controls in small coherent groups.
- Give each group its focused owner and observable browser check. Keep the
  already accepted atmospheric modes runnable after every group lands.

#### 11.5 Migrate location, time, and source updates

- **Deferred follow-up:** `LocationTimeController`
  retains the source
  application's location, flat-time, Flat/Globe basis, sunrise/noon/sunset,
  polar fallback, and globe-offset calculations and returns their derived
  source state without updating the view or scene. `Flat32ApplicationState`
  is now the sole control-state snapshot: events update it, all controls render
  from it, and the same snapshot enters the transactional mode/runtime
  replacement after the retained 450 ms latest-state delay. The focused browser
  lane checks immediate requested mode/time presentation separately from later
  atmospheric publication. The reload panel receives that same snapshot and
  reports its pairing, location, resolved UTC time, and preset while published
  atmosphere facts remain unchanged until successful replacement. The generic
  candidate and constructor failure paths are covered by `ModeController`.
  Reconcile whether any location/source-specific failure assertion or broader
  interaction behavior remains before acceptance.
- Migrate required location and time behavior into construction-time
  `FlatEarthGeometry` configuration. Its private synchronization support
  interprets those values; Algorithm32 mediates geometry-owned placement
  resolution and no application or light source performs the transform.
- **Implemented correction:** each flat/local candidate preserves the
  synchronized physical source and scales the selected 15-node radial profile
  to `max(4.8 Mm, observer source-subpoint rho)`. Union Glacier Flat 0 and
  Flat 180 now exercise 6.283427593 Mm and 31.412716893 Mm domains and
  approximately 37.538-degree and 8.738-degree source-bearing elevations
  instead of sharing the 4.8 Mm terminal cache row. The focused Chrome lane
  also requires their composed outputs to differ. This does not extend the
  Stage 9 convergence claim beyond its measured 4.8 Mm configuration.
- Fixed physical inputs from the first two vertical slices may remain until
  their corresponding control is migrated; do not translate a legacy config
  shape at runtime.
- Apply location, time, and source changes transactionally and preserve the
  last valid rendered state when replacement setup fails.

#### 11.6 Migrate required scene content incrementally

**Status: substantial implemented checkpoint; remaining reconciliation is
deferred follow-up.**
`EndpointScene` rebuilds geometry-owned flat or spherical ground, maps all six
review objects through the active geometry, and owns their caster/receiver
layers. `LocalSunSceneLighting` owns the seven-light topology, six 4096 shadow
maps, source updates, and explicit invalidation. Reconcile the retained dynamic
shadow-frame behavior and whether extraction to the proposed
`ReviewSceneContent` owner is still architecturally required before adding
scene code.

- Extend the checkpoint's fixed flat ground, review boxes, and source shadow
  maps into geometry/source-owned dynamic content in independently runnable
  groups. Preserve explicit shadow invalidation when objects or the source
  move.
- Migrate remaining review-object depth, geometry-projected receivers,
  spherical ground content, shadow tuning, or diagnostics only when the
  Stage 11 behavior inventory retains them.
- Leave synthetic stars and calibration for Stage 12 unless they are required
  solely as ordinary opaque scene geometry; do not import extraterrestrial
  behavior early merely to make this migration appear complete.

#### 11.7 Reconcile remaining application behavior

**Status: deferred follow-up.** Refresh the migration inventory from the
current source and observable browser coverage before selecting another
implementation increment.

- Close every item in the Stage 11 behavior inventory as migrated, explicitly
  omitted, or deferred to its owning later stage.
- Do not migrate quality selectors, performance-profile presets or labels,
  profile-driven configuration, benchmark controls, or performance panels.
  Performance qualification belongs to its declared later stage.
- Expose only controls backed by the current production configuration; do not
  replace removed controls with placeholder or unqualified choices.

#### 11.8 Verify and close the migration

**Status: deferred follow-up; partially satisfied.** Default N4, both supported pairings,
transactional transitions, setup/constructor failure handling, lifecycle
cleanup, build/type regressions, and Stage 9.6 source/built-output containment
have current passing evidence. Final closure still depends on 11.4 through
11.7 decisions and a migration-wide final scan.

- Add focused Karma/Chrome application checks for both supported pairings,
  mode transitions, visible output, setup failure, and lifecycle cleanup.
- Verify the final application uses the production default order and selected
  domains. Any lower-order integration checkpoint is temporary, is not
  exposed as a profile, and is absent at Stage 11 acceptance.
- Validate scoped outputs against Star only where Star has an independent
  producer. Do not manufacture whole-cache flat/local gold.
- Run the application build, type and engine regressions, then mechanically
  scan source, imports, assets, build inputs, and built output for the
  superseded shared implementation and `C:\dev\poly-gc-react`.
- Remove the bootstrap stub and make this repository the maintained
  application home.

**Gate:** the application demonstrates spherical/distant and flat/local-Sun
through the accepted production strategy; scoped outputs are validated against
Star only where Star has an independent producer; the local stub is gone; and
the built application has no runtime or build dependency on
`C:\dev\poly-gc-react`. Whole-cache flat/local Star parity is not required
because that Star cache does not exist.

The separately proposed
[post-migration cache quality profile and feature-policy model](flat32-migration-inventory.md#future-application-cache-quality-profiles-and-feature-policies)
is future application work. It does not restore the omitted legacy profile
system, alter the Stage 11 default-N4 gate, or authorize a profile selector
during migration.


### 14. Implement time/location animation with cache transforms

**Status: deferred mandatory MVP follow-up; not started.** The initial
geometry/source integration may construct a replacement geometry, facade,
scene, and cache set for a time/location change, but MVP completion requires an
in-place animation path.

- Define the external clock/configuration ingress and the facade-mediated
  update contract without allowing application code or light sources to perform
  coordinate transforms.
- Keep geometry as the sole owner of time/location interpretation and every
  source/receiver-to-model transform.
- Select and prove cache transforms or an equivalent reusable
  parameterization for both spherical/distant and flat/local families so a
  clock tick does not rebuild the complete source cache.
- Compare transformed/reused cache results against independent full rebuilds
  across representative locations, times, source elevations, azimuths, and
  near-horizon cases before changing cache identity or reuse policy.
- Retain the active facade, scene, GPU backend, compiled programs, and valid
  cache resources across compatible ticks. Publish geometry state, cache
  bindings, endpoint lighting, shadows, and displayed time atomically.
- Coalesce rapid clock updates, cancel superseded preparation, preserve the
  last published state on failure, and expose requested-versus-published time
  without allowing a mixed generation.

**Gate:** both MVP geometry/source families animate time and location through
the facade with geometry-owned transforms, no complete cache rebuild on a
compatible clock tick, rebuild-oracle parity under predeclared tolerances,
atomic publication, latest-request-wins behavior, failure preservation, and
passing CPU, browser, lifecycle, and resource gates. Failure blocks MVP
completion.

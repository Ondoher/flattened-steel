# Extraterrestrial Production Integration API Plan

Status: paused production-integration plan, current through 2026-08-22. Steps
1, 2, 2.5, 3, 4, 5, and 6 are complete. The focused
[Stellar Screen-Palette Production Port Plan](stellar-screen-palette-production-port-plan.md)
is preserved at its Step 7 resumption point, and the first Flat/local finite-
Sun Step 9 normal path remains implemented with later hardening open. The
Sun-appearance/ACES work is likewise preserved as backlog. Current execution
belongs to the
[Distant-Sun Solar-Zenith Branch-Integrated Spectral Cache Design](../algorithm32/cache/solar-zenith-cache-design.md)
and its contained plan; they authorize no production change. This document
retains the API-first production sequence for later resumption.
Production authorization does not permit copying experimental runners or
generated artifacts into runtime code. The canonical
production backlog remains the [Extraterrestrial production follow-up]
(promotion-plan.md); the architectural source of truth for visible celestial
resources remains the [Celestial Contribution Cache design](celestial-contribution-cache-design.md),
while the proposed spherical atmosphere replacement is owned by the
[Distant-Sun Solar-Zenith Branch-Integrated Spectral Cache Design](../algorithm32/cache/solar-zenith-cache-design.md),
and the
accepted API decisions are owned by the [Production API and Ownership
Contract](production-api-ownership-contract.md).

## Repository Conventions And Reload Requirement

Apply the repository [workflow instructions](../../../AGENTS.md), the
[standards manifest](../standards/manifest.md), the
[repository overlay](../standards/overlay.md), and
[Algorithm32 Production Architecture Boundaries]
(../algorithm32/production/architecture-boundaries.md), plus the
[Extraterrestrial Adoption Guidance](extraterrestrial.md), throughout this
plan.
The Algorithm32 document is the authoritative source for durable physical
contracts, including the rule that units are data rather than durable property
name suffixes. When this production plan is explicitly resumed and made the
active topic, its active-topic entry must list it in the minimal reload set
after the applicable standards and production follow-up plan. It is not in the
current solar-zenith topic's reload set. This is intentionally a planning and
ownership source: it does not override containment or authorize a production
implementation change.

## Purpose And Evidence Boundary

The production `src/algorithm32` tree has completed its independent
[standards reconciliation](../algorithm32/archive/reconciliation-2026-08-04/extraterrestrial/reconciliation.md) and is no longer byte-identical
to the sealed 285-file experiment baseline. The current feature-owned tree
contains 318 files and 3,392,859 bytes at Git tree identity
`50bd3a19682a3875b16057ab12b98f2c635a9721` and file-inventory identity
`sha256:390d291efd8f75e0f4af9142c65c2c80e5da93704f633d1de6c4eb0c9e286650`.
The candidate's recorded 48-file semantic delta remains historical
qualification evidence rather than a patch that can be merged directly.
Production integration must adapt accepted behavior to the reconciled owners,
types, naming, and documentation contracts. There is still no celestial
production implementation, production promotion record, or production
hardening coverage.

### 2026-08-10 production-delta reconciliation

The current production audit changes the integration mechanics without
changing the accepted celestial physics or ownership:

- Every facade configuration is now normalized into one complete
  `Algorithm32ExecutionProfile`, retained by `SharedModel`. Legacy callers may
  supply `celestialSources`, but downstream code must read the normalized
  roster from `model.profile.models.celestialSources`. Explicit-profile callers
  carry the same field inside their profile model bundle; no second top-level
  profile-form property is added.
- The direct-40 benchmark path proves that the profile contract is
  value-agnostic. Celestial behavior remains a Native-15 capability in this
  tranche. A non-Native profile therefore uses `celestialSources: null` and
  preserves its existing benchmark behavior.
- GPU scattering transport now integrates directly from geometry, atmosphere,
  and field inputs. The latest qualified extraterrestrial implementation keeps
  distant-Sun, stellar-point-set, and Flat finite-Sun caches as separate
  semantic resources with separate plans, controllers, identities, runtime
  keys, and shader consumers. They share only cache-build modules, shader-pass
  assembly, scalar texture allocation, GPU submission, diagnostics, and
  cleanup mechanics. They do not reuse scattering recurrence, incoming
  Fibonacci quadrature, W27 reconstruction, or the cumulative scattering
  field.
- The shared reflected-ordinary-68 production default is relevant to the
  already-computed atmospheric `pathRadiance`, not to direct celestial cache
  construction. Celestial field identity must include only executable
  dependencies and must not hash the complete execution-profile identity or
  incoming-scattering domain wholesale.
- The current production cache executor is generic in name but
  scattering-specific in its pass and descriptor contracts. Step 3 must
  extract a neutral one-field GPU execution seam beneath scattering rather
  than broaden the scattering-cache contract into a union of unrelated cache
  semantics. The experiment's temporary celestial `order: 1` values and use
  of `createScatteringCacheDescriptor()` for celestial artifacts are not
  promoted.
- Runtime assembly is contribution/symbol based. Step 3 must extend
  `ShaderState`, owner identities, ordered source slots, build context/result,
  and provider collection explicitly; a parallel celestial shader path is not
  acceptable.

The accepted experimental evidence establishes the spherical distant-Sun cache, its geometry domain, cache-render construction, live raster consumption, lifecycle behavior, normal Algorithm32/ShaderBuilder/Three installation, and the epoch-anchored 500-star cache/raster path at a fixed observation. The catalog directions remain tied to their epoch and must be transformed by receiver latitude/longitude plus observation-time offset. It also establishes bounded Flat/local finite-Sun slices and the HDR sky-meter bridge. Those accepted runs are evidence only; their runners, harnesses, generated artifacts, and candidate-only helpers are never production dependencies.

The production sequence has two mandatory, separately gated families. It ports
`spherical-sun-stars-radial-v1` first: one distant uniform Sun disk and the
accepted epoch-anchored 500-star roster over spherical geometry, transformed
for the configured location and observation time. It then ports
`flat-local-finite-sun-v1`: the simulator-configured finite local Sun over Flat
geometry. Neither family claims a Moon, finite celestial opacity, foreground
ordering, a profiled disk, calibrated release payloads,
or twilight-equivalent replacement scattering.

## API Assessment

The candidate is internally integrated but is not a complete public API:

- Runtime code reads `config.celestial`, while the candidate `Config`, `SharedModelDependencies`, `SharedModelSnapshot`, `GeometryModel`, and `ShaderBuildResult` declarations do not consistently declare celestial inputs or results.
- `CelestialRuntimeParticipant` currently combines an application roster, source factories, and cache-orchestration convenience methods. That is a useful candidate adapter, but not the final production ownership boundary.
- The candidate exposes sky-meter reads and manual refresh on the shader handle for qualification. They are not a stable application API.
- The existing design refers to `Config.celestialSources`, whereas the candidate implementation uses `config.celestial`. Promotion must choose one name and migrate it consistently instead of preserving both aliases.

These gaps make an ownership-and-type-contract review the first production step.

## Accepted API And Ownership Boundary

The [Production API and Ownership Contract]
(production-api-ownership-contract.md) is the sole owner of the accepted
public types and methods, internal interfaces, exact production owners,
static/live invalidation matrix, lifecycle behavior, complete 48-file
candidate classification, and required-family rejection boundaries. In
summary:

- the only public configuration name is `Config.celestialSources`;
- external code supplies unit-bearing latitude and longitude plus a canonical
  UTC instant through facade observation configuration; changes create
  replacement geometry, atmospheric light-source, celestial-source, facade,
  scene, and cache objects rather than updating an installed handle;
- `setConfig(config, options?)` owns static transactional replacement within a
  constructed facade;
- the atmospheric light source is configured through the separate Algorithm32
  construction boundary before cache work, without configuring its celestial
  capability or another celestial source;
- celestial source providers expose geometry-neutral definitions and placement
  states; geometry owns their model-frame resolution and query preparation;
  source-family cache controllers independently own their resource staging,
  exact reuse, replacement, and disposal, while the existing complete
  shader/scene preparation transaction publishes only a compatible complete
  set;
- the atmospheric distant Sun remains its sole radiometry and direct-transport
  owner;
- one finite local source definition supplies the radius, height, and surface
  radiance shared by its atmospheric-light and visible-disk paths; and
- candidate sky-meter APIs and the remaining deferred families are outside
  this port. The clock supplies a fixed observation snapshot for the required
  epoch-relative stellar placement, while camera/view regeneration belongs to
  the standard render pipeline. Live clock updates and all animation remain
  deferred.

## Detailed Integration Sequence

### Mandatory per-step B1 non-regression gate

Every numbered production integration step from Step 3 onward ends with a
complete 17-condition production GPU B1 regeneration and comparison against
the currently accepted production B1 baseline. The run must use that step's
final production source and normal shader/cache path, retain its reproducible
boundary and figures, and report aggregate and per-condition RMSE. Any
unexplained regression blocks closing the step. CPU/GPU parity remains an
additional gate when a step changes numerical construction; it does not
replace the production GPU B1 gate.

Atmospheric or shared Color changes also run the standard Bruneton sky-color
gate with `npm run gate:algorithm32:bruneton-sky-color`. This first regenerates
the production GPU B1 boundary, retains the measured B1 non-regression
requirement above, and then compares the same 1,377 atmosphere-only rays to the
sealed Bruneton dome oracle declared by
`scripts/extraterrestrial/fixtures/bruneton-b1-sky-color-gate-v1.json`. Both
requirements are mandatory: improving agreement with Bruneton cannot excuse a
regression against measurements, and preserving the aggregate measured RMSE
cannot excuse a visible color mismatch. Oracle identity, projection, and
tolerances are tracked review inputs rather than values inferred from the
candidate under test.

### 1. Decide the API and ownership contract

Status: complete on 2026-08-05 and architecture-reconciled on 2026-08-11. The
reviewed [Production API and Ownership Contract](production-api-ownership-contract.md)
reproduces the exact 48-file candidate delta at audit identity
`sha256:5c93c0d10a40c758ef3bba6f50d05254b82014f3e2a3e40540c1dfdfda2ad9ea`,
classifies every exported symbol, selects the exact public and internal
contracts, assigns production owners, and closes the invalidation, lifecycle,
and capability decisions below.

Inventory all 48 candidate-delta files and classify each exported symbol as public API, internal production interface, implementation detail, qualification-only, or deferred capability. Resolve the `celestialSources`/`celestial` naming decision and record the static/live invalidation matrix.

Specify and review roster, source-definition, placement-state,
observation-state, receiver, query-packet, source-family cache plan/resource,
cache-set, and runtime-binding types; the
source/geometry/atmosphere/cache/renderer/Color ownership boundaries; failure,
cancellation, supersession, reuse, replacement, and disposal behavior; and
both required-family capability envelopes and explicit rejections. Preserve
the latest experiment's separate distant-Sun, stellar-point-set, and Flat
finite-Sun controllers. Share only neutral one-field GPU execution mechanics;
do not promote the historical synthetic aggregate controller, fake celestial
scattering orders, or scattering descriptors for celestial resources.

**Exit condition:** one reviewed API contract and ownership record identifies every public type and method, every internal interface, the production module owner, and whether each input rebuilds, refreshes bindings, or is rejected.

### 2. Reconcile the production implementation with current standards

Status: complete on 2026-08-04. The canonical reconciliation ledger marks
R1-R9 complete, all ambiguity decisions implemented, and no exception. Both
type checks, formatting, the 456-spec Node regression, Flat32 production and
browser-test builds, Three/WebGL 5/5, Flat32 UI 3/3, policy integrity 1/1,
complete current standards scans, document consistency, and hygiene pass.

Before porting extraterrestrial behavior, bring the complete
`src/algorithm32` production implementation surface into conformance with the
current canonical standards selected by the
[manifest](../standards/manifest.md), the production-topic rules in the
[overlay](../standards/overlay.md), and the
[Algorithm32 Production Architecture Boundaries]
(../algorithm32/production/architecture-boundaries.md). This was a production
reconciliation step, not an attempt to modernize the archived experiment or
copy its code style into production. [Algorithm32 Standards Reconciliation]
(../algorithm32/archive/reconciliation-2026-08-04/extraterrestrial/reconciliation.md)
records the completed ambiguity decisions, work ledger, and exception result
for this phase.

Reconcile formatting, tabs, required semicolons, filenames, class and utility
structure, file-size boundaries, ambient type placement, public-versus-internal
class contracts, interface placement, named string unions, complete JSDoc, and
unit-bearing durable physical data. Split or reorganize code by coherent
ownership where necessary; do not retain a legacy exception merely because the
baseline predates the standard. Preserve observable behavior unless a separate
approved production change explicitly alters it.

**Exit condition:** the full production Algorithm32 tree has a recorded
standards audit with every exception resolved or explicitly accepted, and all
affected production type, build, and regression gates pass before celestial
behavior is ported.

### 2.5. Reorganize concrete implementations by feature

Status: complete on 2026-08-06. The archived
[feature-reorganization record](../algorithm32/archive/feature-implementation-reorganization-2026-08-06/implementation-feature-reorganization-plan.md)
owns migration evidence; the production
[source layout](../../../src/algorithm32/README.md#source-layout) and
[architecture boundaries](../algorithm32/production/architecture-boundaries.md#implementation-placement)
own current guidance.

Restore `src/algorithm32/implementation/` as the concrete public implementation
surface. Each immediate child names the feature it implements and contains the
complete implementation closure exposed by that feature, including its cache,
CPU/GPU support, shader contribution, renderer adapter, declarations, tests,
and fixtures. Keep global declarations interface-driven and free of executable
implementation.

This step changes organization and public import routing only. It preserves
the completed reconciliation behavior and does not implement celestial
functionality.

**Completed result:** the feature-owned tree, 14-symbol public implementation
export surface, interface coverage, external consumer migration, independent
static closure, and all required production/application gates pass. The
reviewed extraterrestrial contract is reconciled to the final owners, and Step
3 is no longer blocked by reorganization.

### 3. Establish typed optional production seams

**Mandatory retained-algorithm interlock:** the current production scattering
algorithm is the newly accepted Star-compatible authority. Step 3 may add
optional celestial types and extract demonstrably neutral GPU-field mechanics,
but it may not change scattering equations, reflected-ordinary-68 domains or
ordering, source-local frames, cache fields or pass graph, reconstruction,
interpolation, ground handling, shader mathematics, runtime binding values,
cache identities, resource dimensions, or numerical output. Any proposed
neutral-executor extraction must first preserve the existing scattering plan,
assembled cache shaders, runtime shader, bindings, selected CPU/GPU probes,
and complete current atmospheric-only resource behavior when
`celestialSources` is `null`. If exact preservation cannot be
demonstrated, leave the scattering executor intact and implement a separate
celestial executor rather than refactoring the accepted path. Verification
freezes current production authorities; it does not recreate or execute the
retired Star bridge.

Implement this step as the following independently reviewable groups:

1. **3.1 — complete.** Add the public celestial source, definition, roster, family, and replacement
   option contracts at `interfaces/celestial-source/types.d.ts` and the current
   facade declarations. `LegacyConfig.celestialSources` is optional;
   `Algorithm32ExecutionModels.celestialSources` is required and nullable;
   `ExecutionProfileConfig` receives no duplicate top-level property.
2. **3.2 — complete.** Update legacy Native-15 profile normalization, explicit-profile acceptance,
   `SharedModel`, and prepared configuration so downstream owners read only
   `model.profile.models.celestialSources`. Preserve the current
   atmospheric-only Native-15 content identity when the roster is null; add
   roster identity only when celestial sources are enabled.
3. **3.3 — complete.** Add the internal source, geometry, query, source-family plan, resource,
   controller-identity, and runtime-binding declarations at their accepted
   owners. Keep distant-Sun, stellar-point-set, and Flat finite-Sun cache
   contracts distinct. Add the geometry capability and source capability
   interfaces without porting their concrete cache or raster behavior.
   Preserve `LightSourceModel` and the existing `LocalSunLightSource`
   constructor and public methods; the finite-local interface is additive, not
   a replacement class. Do not add a nonexistent `SharedModelSnapshot`; the
   retained execution profile and existing `ConfigSnapshot` are the two
   current state boundaries.
4. **3.4 — complete.** Extract a neutral one-field GPU execution contract from the existing cache
   executor. It owns scalar field allocation, module/pass assembly, submission,
   bounded probes, diagnostics, cancellation, and cleanup, and returns a raw
   field artifact plus the caller-selected typed runtime binding. The
   scattering adapter retains scattering order, recurrence, cumulative-field
   selection, and `ScatteringCacheDescriptor` construction. Each celestial
   controller owns its own unordered direct-transport plan and celestial
   descriptor. Preserve the existing cumulative-scattering plan and disabled
   runtime behavior exactly. This extraction is conditional on the mandatory
   retained-algorithm interlock above; shared implementation is not itself a
   requirement.
5. **3.5 — complete.** Rename current `ShaderBuildContext` and `ShaderBuildResult`
   `cacheController`/`cache`/`cacheControllerIdentity` fields directly to their
   scattering-qualified names, then add typed optional slots for the distinct
   distant-Sun, stellar-point-set, and Flat finite-Sun controllers, resources,
   and identities. The build result may expose a read-only celestial cache-set
   view for installation, but that view is not a controller or a shared cache
   semantic. Update handle preservation/disposal and runtime binding
   installation without compatibility aliases.
6. **3.6 — complete.** Add `celestialCache` as a distinct shader-contribution owner; add ordered
   `sampleCelestialCache`, `evaluateCelestialRadiance`, and
   `composeSpectralRadiance` source slots; and extend the runtime `ShaderState`
   with zero-initialized `celestialRadiance` and `preDisplayRadiance`. Step 3
   installs no celestial evaluation hook when the roster is null.
7. **3.7 — complete.** Run type, Node, assembly, runtime-lifecycle, and both configuration-form
   invariance gates. The direct-40 benchmark profile must explicitly retain
   `celestialSources: null`, compile to the same shader, and allocate no
   celestial resource. Finish with the mandatory complete production GPU B1
   non-regression run before closing Step 3.

The existing atmospheric-only configuration with `celestialSources: null`
must retain its exact behavior, shader provider set, binding set, cache
allocation count, and resource profile. Enabled celestial configurations then
add their required resources and contributions.
Equality at an aggregate score is insufficient: the retained scattering plan,
assembled shader sources, identities, resource metadata, and selected
numerical probes must remain exact at the established production boundaries.

Do not copy candidate methods merely because they execute. In particular, remove qualification-only public handle reads for sky illuminance; retain diagnostic access only through a clearly labeled diagnostics/test surface if production qualification needs it.

**3.1–3.6 implementation result:** production now has the public roster and
source-definition contracts, caller-cancellable replacement option, nullable
profile-owned roster, conditional Native-15 roster identity, explicit-profile
single-authority validation, `SharedModel.celestialSources`, geometry/source
capability declarations, and distinct distant-Sun, stellar-point-set, and Flat
finite-Sun cache-family declarations. No scattering source, cache, shader, or
numerical method changed. Algorithm32 type checking, 11 focused facade/model/
handle specs, and all five direct-40 production-profile cases pass. Neutral
`GpuFieldExecutor` now owns scalar allocation, pass assembly invocation, GPU
submission, bounded probes, diagnostics, cancellation, and cleanup.
`CacheGpuExecutor` remains the scattering adapter and supplies the unchanged
`cache.cumulativeScatteringDensity` binding key; the backend accepts a typed
caller-selected value key for future independent celestial resources.

Shader build contexts and results now qualify the retained atmospheric fields
as scattering-owned and expose separate nullable controller, resource, and
identity slots for distant Sun, stellar point set, and Flat finite Sun. The
runtime installer collects their opaque bindings for one atomic backend
installation without imposing a shared controller or descriptor. Shader-handle
replacement preserves reused controllers independently and disposes every
retired family exactly once. The null-roster path constructs no celestial
controller or resource and retains the scattering-only provider and binding
set.

The assembler now recognizes `celestialCache` as a distinct owner and orders
`sampleCelestialCache`, `evaluateCelestialRadiance`, and
`composeSpectralRadiance` between scattering-cache transport and Color.
Enabled rosters receive zero-initialized `celestialRadiance` and
`preDisplayRadiance` state. Null rosters receive neither field nor a celestial
hook; toggling an assembly fixture back to null reproduces its exact prior
source and source hash.

The formerly stale reflected-68 native-N4 oracle was regenerated from current
production binary64 CPU recurrence in 49.17 minutes. The complete 750-value
R32F GPU comparison passes with maximum relative residual
`0.0014622160261850371`. The full Node lane passes 486/486, the complete real
Three/WebGL lane passes 8/8, type checking passes, and all five direct-40
production-profile cases pass.

The final contract reconciliation removes the proposed parallel
celestial-specific shader-build records. The established `ShaderBuildContext`
and `ShaderBuildResult` contracts own distinct, family-specific optional
controller, resource, and identity slots.

**3.7 closure result:** type checking passes; the complete production Node lane
passes 486/486; all 17 production B1/profile contract tests pass; and the real
Three/WebGL lane passes 8/8. The retained 750-value reflected-68 GPU comparison
passes with maximum relative residual `0.0014622160261850371`. The mandatory
complete 17-condition production GPU B1 run completed on the NVIDIA RTX 2060
in 95.84 seconds, reproduced the accepted table SHA-256
`d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`,
and therefore reproduced every per-condition value and aggregate RMSE
`11.820392` mW exactly. Its classification is favorable. The isolated run
manifest, report, boundary, provenance, cubes, and six figures are retained
under
`tmp/extraterrestrial/production-integration/000001-step-03-b1-closure/`.

**Exit condition:** production types represent every runtime celestial value;
legacy Native-15 and explicit direct-40 configurations with a null celestial
roster compile and preserve their existing output and resources; an enabled
celestial config cannot be
accepted with an undeclared or ambiguous source/geometry contract. The current
reflected-68 native-N4 CPU/GPU fixture and complete browser lane are green;
Step 3 preserves those gates and is complete.

### 4. Port the source and geometry boundaries

Implement this step as the following independently reviewable groups:

1. **4.1 — complete. Reconcile the qualified inputs.** Inspect the latest
   extraterrestrial candidate and current production read-only. Map each
   accepted source identity, source-frame transform, placement, support
   classification, build-sample, stencil, and query-packet symbol to its
   selected production owner. Record what is ported, adapted, rejected, or
   deferred before changing production source. Do not reopen or depend on the
   retired Star bridge.
2. **4.2 — complete.** Implement the concrete source
   identity, fragment description, and source-frame input behavior behind the
   Step 3 contracts under `celestial-source-support`. Keep this layer free of
   cache construction, geometry policy, raster behavior, and runtime resource
   ownership.
3. **4.3 — complete. Extend the existing distant Sun.** Make the existing
   `DistantSunLightSource` implement the additive celestial-source capability
   using its current physical Sun definition. Do not introduce a second Sun
   model or change atmospheric scattering, source direction, irradiance, or
   profile behavior.
4. **4.4 — complete. Add the stellar source feature.** Create the standard stellar source
   implementation and its private source-data closure under
   `implementation/star-field`. Port only the reviewed static 500-member
   selection, bounded native spectral packets, identities, and provenance
   needed by the source boundary. Defer the stellar GPU cache and point-raster
   consumer to Step 7.
5. **4.5 — complete. Implement spherical placement and support.** Add the selected
   spherical geometry operations for source placement, retained-frame
   transformation, horizon and ground-support classification, build samples,
   and exact-zero unsupported cases.
6. **4.6 — complete. Implement receiver and direction stencils.** Derive deterministic
   construction-time receiver samples, direction samples, interpolation
   coordinates, and stencil fingerprints. Do not add runtime camera
   calculations or construct a celestial cache.
7. **4.7 — complete. Assemble and validate query packets.** Connect the source and
   geometry boundaries to produce immutable deterministic query packets.
   Prove stable identity for unchanged inputs and replacement identity when a
   source, time, location, or geometry input changes.
8. **4.8 — complete. Close Step 4.** Run type, Node, assembly, lifecycle/resource, and
   real Three/WebGL gates. Finish with the mandatory complete 17-condition
   production GPU B1 regeneration and compare aggregate and every
   per-condition RMSE against the accepted baseline. Any unexplained
   regression blocks Step 4 closure.

The completed 4.1 mapping is owned by the
[Step 4 source and geometry reconciliation](step-4-source-geometry-reconciliation.md).
Groups 4.2 through 4.4 now provide canonical source-definition identity and
exact logical fragments, the additive celestial view on the existing
`DistantSunLightSource`, and the public `StellarPointSetSource`. The Sun derives
one uniform-disk radiance packet from its unchanged apparent irradiance and
angular support. The stellar feature retains the reviewed BSC V/50
brightest-500 selection, canonical J2000 `celestial-rh-v1` directions, the
accepted bracketed Pickles/Johnson native-15 materialization, source/input
SHA-256 provenance, and one canonical point-set identity. Neither source owns
geometry policy, cache packing, shaders, controllers, bindings, rasterization,
or runtime resources. Type checking, 28 focused source specs, and the complete
494-spec Node lane pass.

Groups 4.5 through 4.7 now make `SphericalEarthGeometry` the celestial
geometry capability owner and delegate its cohesive `(h,u)` domain work to a
feature-private collaborator. The geometry reuses its configured atmospheric
Sun direction, current observation/retained frame, current atmosphere-path
resolver, and current ground-contact classification. It resolves the optional
500-member static stellar placement without adding live Earth rotation,
constructs deterministic receiver and direction stencils with exact-zero
invalid support, and assembles one exact typed spherical query packet whose
SHA-256 identity changes with source, time, location, or geometry facts. No
celestial cache, controller, shader contribution, binding, or runtime resource
is constructed. Type checking, 114 focused geometry/facade specs, and the
complete 500-spec Node lane pass.

**4.8 closure result:** type checking passes; the complete production Node
lane passes 500/500; all 17 B1/profile contract tests pass; and the real
Three/WebGL lane passes 8/8. The retained 750-value reflected-68 GPU comparison
continues to pass with maximum relative residual
`0.0014622160261850371`. The mandatory complete 17-condition production GPU
B1 run completed on the NVIDIA GeForce RTX 2060 in 86.03 seconds of generation
time and reproduced the accepted table SHA-256
`d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`.
Every per-condition value and aggregate RMSE `11.820392` mW therefore remains
exact; classification is favorable. The isolated manifest, report, boundary,
provenance, cubes, and six figures are retained under
`tmp/extraterrestrial/production-integration/000002-step-04-b1-closure/`.
At that checkpoint Steps 4 and 5 were complete. Step 6 live distant-Sun
composition has since completed; current work is owned by the status and Step 9
sections.

Add distant-Sun celestial behavior to `implementation/distant-sun`, create the
standard stellar source implementation under `implementation/star-field`, and
place shared source behavior under `celestial-source-support`. Use
`celestial-contribution-cache` only for shared celestial cache data contracts,
binding constants, and composition support; it does not own one aggregate
cache controller. Do not recreate an `extraterrestrial/` technical-layer
source tree or move source behavior into the candidate
`CelestialRuntimeParticipant` shape. Step 4 ports no celestial cache
controller, GPU cache construction, or live raster consumer.

Use the current spherical geometry's Z-up retained frame, exact 0 m first
altitude node, and CPU-derived contact classification as the shared boundary
authority. Do not recreate the candidate's older ground/horizon convention in
a celestial-only domain.

Keep the module split explicit: each public source feature owns its static
facts, provenance, and private source-specific cache support; the selected
geometry feature owns transforms, domains, cache coordinates, and
construction-time query derivation; the neutral GPU-field runtime owns no
celestial meaning; and `rendering-runtime` owns complete-set installation
transactions, not cache physics or camera/raster math.

**Exit condition:** the configured geometry deterministically derives source
placement, receiver state, and the query-packet fingerprint during
construction; a time/location change is classified as complete scene/facade
and cache replacement; all production verification gates pass; and the full
GPU B1 result has no unexplained aggregate or per-condition regression.

### 5. Port the distant-Sun cache and lifecycle participant

Implement Step 5 as the following independently reviewable groups:

1. **5.1 — complete. Reconcile the qualified cache behavior.** Inspect the latest
   accepted extraterrestrial distant-Sun cache and current production seams
   read-only. Map the logical field, direct-transport inputs, construction
   domain, GPU pass, resource identity, binding, and lifecycle behavior to
   their selected production owners. Record each ported, adapted, rejected,
   or deferred candidate mechanism before changing production source.
2. **5.2 — complete. Define the exact distant-Sun cache contracts.** Add or refine the
   typed logical-cache, GPU resource, controller, descriptor, construction,
   and binding contracts needed by this family. Keep them distinct from the
   scattering cache and from the future stellar and Flat finite-Sun families;
   do not introduce an aggregate celestial cache contract.
3. **5.3 — complete. Implement the binary64 logical cache.** Port the accepted distant
   uniform-disk direct-transport cache through the Step 4 geometry domain,
   placements, and build samples. Verify exact-zero unsupported samples,
   bounded finite values, source identity, domain identity, and selected
   numerical probes before adding GPU construction.
4. **5.4 — complete. Implement scalar `R32F` GPU construction.** Add the source-owned
   GPU plan and cache-build module, invoke the neutral one-field executor, and
   publish the resulting field through the distant-Sun binding namespace.
   Reuse the external backend and generic execution mechanics only; do not
   reuse or change scattering recurrence, order, descriptors, plans, or
   bindings.
5. **5.5 — complete. Implement the dedicated controller and resource lifecycle.** Add
   transactional preparation, complete-only publication, exact reuse,
   last-valid preservation, cancellation, replacement, and idempotent
   disposal for the distant-Sun resource. Keep the externally supplied GPU
   backend externally owned.
6. **5.6 — complete. Integrate the independent ShaderBuilder participant.** Derive the
   Step 4 placements and query packet during configured-model setup, construct
   the enabled distant-Sun controller/resource beside the scattering
   participant, install its opaque binding atomically, and preserve the exact
   prior shader, resources, and controller set when `celestialSources` is
   `null`.
7. **5.7 — complete. Prove replacement and failure behavior.** Add focused production
   and browser coverage for construction, exact reuse, source/query
   replacement, allocation or build failure, last-valid preservation,
   binding replacement, supersession, context/resource cleanup, and final
   disposal. Prove that no case enters, replaces, or disposes the scattering
   controller incorrectly.
8. **5.8 — complete. Close Step 5.** Run type, complete Node, assembly,
   lifecycle/resource, and real Three/WebGL gates. Finish with the mandatory
   complete 17-condition production GPU B1 regeneration and compare aggregate
   and every per-condition RMSE with the accepted baseline. Any unexplained
   regression blocks Step 5 closure.

The completed 5.1 mapping is owned by the
[Step 5 distant-Sun cache reconciliation](step-5-distant-sun-cache-reconciliation.md).
It selects one distant-Sun-only 11 by 13 by 15 direct-transport radiance field,
the current Step 4 geometry authority, the neutral GPU field executor, a
family-specific controller/resource, and the existing distinct runtime slots.
It rejects the candidate aggregate cache/controller/participant architecture,
old binding key, FNV generation descriptors, private geometry reads,
CPU-upload production path, and live disk consumer.

Group 5.2 replaced the placeholder declarations with exact 13 by 11
construction-lattice, 13 by 11 by 15 native spectral field, binary64 field and
lookup, support-mask, source-family module, one-field/one-pass neutral GPU
plan, descriptor, resource, controller, binding, bounded-probe, and reuse-owner
contracts. The controller derives its plan from trusted placement and query
facts; callers cannot submit an arbitrary executable plan. The declarations
keep the celestial field separate from scattering and constrain its only
runtime key to `cache.celestial.sunTransport`. Type checking, all 79 focused
celestial/GPU seam specs, and the complete 500-spec Node lane pass. No cache
behavior changed, and the B1 closure gate remains scheduled for 5.8.

Group 5.3 adds the sealed feature-private `DistantSunCelestialCpuCache`. It
iterates only the exact Step 4 13 by 11 construction domain, consumes each
geometry-owned source path, and multiplies the existing native-15 Sun surface
radiance by the current atmosphere's binary64 transmittance. Unsupported nodes
remain exact zero and skip atmosphere integration. The cache retains canonical
source, domain, atmosphere, numerical, field, and support-mask identities,
keeps its resident `Float64Array` private, supplies validated scalar reads and
independent snapshots, and reconstructs spectral radiance only from the
geometry's receiver and direction stencils. Five focused proofs cover all
2,145 scalars, exact-zero control behavior, two-by-two interpolation,
classification, identity changes, and invalid transport rejection. Type
checking and the complete 505-spec Node lane pass. Group 5.4 is complete;
the B1 closure gate remains scheduled for 5.8.

Group 5.4 is complete. The feature now owns a
trusted one-field/one-pass GPU plan builder, exact source/geometry/atmosphere/
layout modules, 143-node CPU-derived support, direct 15-layer `R32F`
construction through `GpuFieldExecutor`, the distinct
`cache.celestial.sunTransport` binding, and bounded selected-scalar probes.
The GPU path uploads construction facts rather than the binary64 radiance
field. Geometry supplies CPU-derived exact support, path length, and radial
coordinate facts; the atmosphere evaluates the unchanged trapezoidal
extinction integral with a stable altitude-along-ray expression that avoids
subtracting Earth-scale radii. Three neutral builder proofs, type checking,
and all 508 Node specs pass. The focused real WebGL proof passes all 75
selected resident scalars against the sealed CPU reference with maximum
absolute residual `0.004548792177956784`, maximum relative residual
`0.0000037320928251543077`, and maximum normalized residual
`0.026760043316666437`. The complete real Three/WebGL lane passes 9/9,
including the unchanged distant- and local-Sun cache gates.

Group 5.5 is complete. `DistantSunCelestialCacheResource` owns only one
completed artifact and publishes its source id, SHA-256 plan identity,
descriptor, exact opaque binding, bounded selected-scalar reads, and
cache-owned two-by-two lookup contribution. It has no live disk consumer and
disposes the field idempotently without disposing the external backend.
`DistantSunCelestialCacheController` serializes generations over the stateless
builder, supersedes older work through linked cancellation, reuses the exact
active plan, publishes only after complete execution, preserves the last valid
resource after failure, and disposes a predecessor only after successful
replacement. Six focused lifecycle proofs pass, as do type checking, all
514 Node specs, and the complete 9/9 real Three/WebGL lane.

Group 5.6 is complete. Configured spherical builds derive placements and the
immutable query packet from the profile-owned observation, create or reuse the
dedicated distant-Sun celestial controller by exact source, geometry,
atmosphere, backend, and scheduler ownership, and build its resource beside
the unchanged scattering participant. Spherical geometry contributes the
two-axis bilinear stencil type; the resource contributes its cache-owned
lookup. `ShaderRuntimeInstaller` merges the celestial and scattering opaque
bindings into one backend installation. The null-roster assembly source and
controller/resource set remain exact. Focused construction, contribution,
reuse, atomic-install, construction-failure cleanup, and geometry stencil
proofs pass, as do type checking, the complete Node lane, and all 9 real
Three/WebGL specs.

Group 5.7 is complete. Production integration proofs cover geometry/query
replacement with scattering-controller reuse, shared-Sun replacement with
deliberate replacement of both source-owned controllers, failed celestial
construction, failed combined binding installation, preservation of the
installed runtime and both installed controllers, concurrent build
supersession, independent retirement, context cleanup, and idempotent final
disposal. Existing controller proofs retain allocation-failure preservation,
complete-only publication, and serialized generation cancellation. The real
WebGL lane now replaces two independently constructed opaque celestial
bindings, proves distinct resident textures, and verifies retired and final
resource liveness boundaries. No production lifecycle defect was exposed, so
Step 5.7 required proof expansion rather than an algorithm change. Type
checking, all 522 Node specs, and all 10 Three/WebGL specs pass.

Group 5.8 and Step 5 are complete. The closure reran type checking, all 522
Node specs, touched-scope formatting and diff integrity, and all 10 real
Three/WebGL specs. The fresh complete 17-condition production GPU B1 run on
the NVIDIA GeForce RTX 2060 completed in 90.395 seconds of recorded generation
time. Its complete table is byte-for-byte identical to the accepted Step 4
baseline with SHA-256
`d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`;
all 17 per-time RMSE rows are exact, aggregate RMSE remains `11.820392` mW,
and classification remains favorable. The completed output is retained under
`tmp/extraterrestrial/production-integration/000003-step-05-b1-closure/b1-directional-sky-radiance/gpu/b1-directional-sky-radiance/gpu/`.
The output-root helper appended its standard experiment/backend suffix to the
supplied parent; the completed evidence was preserved at that exact path.
Step 6 live distant-Sun composition has since completed; current work is owned
by the status and Step 9 sections.

Port the distant uniform-disk adapter, CPU logical cache, scalar `R32F`
cache-render construction, geometry-provided stencil lookup, and distinct
celestial binding namespace. Integrate its dedicated controller and resource
as a second ShaderBuilder participant beside, never inside, the existing
light-source-owned scattering cache. Reuse cache-build modules, pass assembly,
the neutral one-field GPU executor, and the external backend; do not reuse the
scattering plan, descriptor, order, recurrence, or cumulative-scattering
binding key.

Port transactional preparation, complete-only publication, exact reuse,
last-valid preservation, and idempotent disposal. The externally supplied GPU
backend remains externally owned.

**Exit condition:** fresh production tests and browser coverage prove Sun cache construction, exact reuse, replacement, allocation-failure preservation, binding replacement, and final disposal without affecting the scattering cache.

### 6. Port live Sun composition

Implement Step 6 as the following independently reviewable groups:

1. **6.1 — complete. Reconcile the qualified live-consumer behavior.** Inspect the
   accepted distant-Sun live raster proof and the current production shader
   seams read-only. Map geometry ray reconstruction, disk support, cache
   lookup, scene visibility, spectral accumulation, composition, live
   bindings, and refresh behavior to their production owners. Record every
   ported, adapted, rejected, or deferred mechanism before changing
   production source.
2. **6.2 — complete. Define the exact live-composition contracts.** Refine the typed
   shader contribution, state, binding, and ordering contracts required by
   the enabled distant Sun. Preserve the already installed conditional
   `celestialRadiance` and `preDisplayRadiance` vocabulary. Define one cache
   sample route, one live-raster evaluation route, and one composition route;
   do not add an aggregate cache, arbitrary caller data, or a parallel frame
   evaluator.
3. **6.3 — complete. Implement geometry-owned live ray and disk support.** Reconstruct
   the qualified ordered sub-pixel model rays from the live camera and
   viewport state, classify their relation to the apparent uniform Sun disk,
   and retain the current spherical ground/horizon authority. Prove full,
   partial, empty, and ground-horizon cases before sampling the cache or
   applying scene visibility.
4. **6.4 — complete. Implement the clear distant-Sun raster and cache lookup.** For each
   supported sub-pixel ray, obtain the geometry-owned celestial stencil,
   sample the completed distant-Sun resource once, apply the qualified disk
   coverage once, and accumulate only into `celestialRadiance`. Prove clear
   full, partial, and empty pixels plus exact-zero unsupported samples. Do not
   rebuild the cache for camera, projection, viewport, or pixel changes.
5. **6.5 — complete. Add matched live-scene visibility.** Read scene-hit information at
   the same sub-pixel rays used by the Sun integration and suppress only the
   corresponding celestial samples. Prove clear, partially blocked, fully
   blocked, off-frame, and ground/horizon behavior. Scene visibility must
   neither enter cache identity nor alter or erase `pathRadiance`.
6. **6.6 — complete. Add the single pre-Color spectral composition.** Form exactly one
   `preDisplayRadiance = pathRadiance + celestialRadiance` result after
   ordinary transport. Keep `pathRadiance` unchanged and make Color consume
   the completed pre-display value while remaining the sole
   spectral-to-display owner. Add negative controls for duplicate
   transmittance, coverage, accumulation, and composition.
7. **6.7 — complete. Integrate deterministic shader assembly and runtime bindings.**
   Collect the enabled geometry, celestial-resource, live-raster, and
   composition contributions in the existing ShaderBuilder order between
   scattering-cache transport and Color. Refresh live camera, viewport, and
   scene bindings through the current rendering runtime. Preserve exact
   atmospheric-only source and resources when `celestialSources` is `null`.
8. **6.8 — complete. Prove live refresh and resource independence.** Exercise camera,
   FOV, viewport, scene-hit, receiver/query, and supported placement changes.
   Prove which changes refresh only live bindings or the small geometry query
   packet, which require the Step 5 celestial resource replacement, and that
   none incorrectly rebuild, replace, or dispose the scattering cache.
9. **6.9 — complete. Run the production visual acceptance matrix.** Use real WebGL to
   cover clear, partial, empty, ground/horizon, partially scene-blocked, and
   fully scene-blocked Sun pixels. Compare against an independent CPU oracle
   and retain focused evidence that blocked celestial light leaves ordinary
   atmospheric path radiance intact.
10. **6.10 — complete. Close Step 6.** Run type checking, complete Node, assembly,
    lifecycle/resource, and real Three/WebGL gates. Finish with the mandatory
    complete 17-condition production GPU B1 regeneration. Aggregate and every
    per-condition RMSE must be equal to or better than the accepted Step 5
    baseline; any unexplained regression blocks closure.

The completed 6.1 mapping is owned by the
[Step 6 live distant-Sun composition reconciliation](step-6-live-sun-composition-reconciliation.md).
It retains the qualified four ordered equal-weight sub-pixel samples, current
geometry ray reconstruction, matched scene-hit texels, the completed Step 5
lookup, separate `celestialRadiance`, and one pre-Color addition. It replaces
the candidate's repeated per-sample stencil search with the already validated
production query-packet stencil because all four samples share one receiver
and Sun-center direction. It rejects the frame evaluator, aggregate cache,
parallel renderer, diagnostic scaling, and candidate identity machinery.
No ownership or algorithm ambiguity blocks 6.2; exact live-composition
contract definition is complete. ShaderBuilder now retains the exact geometry
query packet in its private build context and supplies it through the new
`CelestialCacheShaderContributionRequest`; the narrower
`DistantSunCelestialLiveShaderContributionRequest` adds only the configured
source. Live camera/viewport/scene values remain existing renderer bindings,
and no alternate composition or Color API was introduced.

Groups 6.3 through 6.9 are complete. Spherical geometry now publishes the
validated two-axis cache stencil and exact per-subray ground/horizon support.
The distant-Sun resource owns the fixed four-sample disk raster, rejects
off-frame, scene-blocked, outside-disk, invalid-stencil, and ground-blocked
samples before its one lookup, and accumulates only `celestialRadiance`.
`Algorithm32Transport` performs the sole spectral addition into
`preDisplayRadiance`; Color selects that value only for an enabled roster.
ShaderBuilder installs the geometry, resource, live raster, composition, and
Color contributions in the established order while leaving the null-roster
path exact.

The production scene-color bridge additionally retains half-float
renderer-linear input until Color. Ferwerda preserves its linear channel ratios
and uses source-owned `sourceBrightness` as the neutral conversion from
relative RGB to its luminance scale. It does not encode the capture to display
sRGB, normalize its peak, or apply Bruneton's inverse exponential; those
operations caused orders-of-magnitude foreground amplification when rods
activated. The explicit scale also prevents absolute atmospheric path radiance
from overwhelming dimensionless foreground RGB at noon. This is not the deferred sky-
irradiance or sky-derived exposure system. The older qualification counts in
this section predate the current stellar/Ferwerda port and remain historical
evidence rather than its current gate.

The focused real-WebGL matrix uses the complete production build path and an
independent four-sample CPU coverage oracle. Its maximum coverage residual is
`0.0000016689300537109375`; it observes 26 full, 18 partial, and 980 empty
pixels, rejects 98 ground/horizon samples, suppresses 22 pixels under partial
scene blocking while retaining 22, produces exact-zero celestial output for
full blocking and off-frame views, and retains positive atmospheric path
radiance in all 1,024 fully blocked pixels. Camera/FOV, viewport, and scene
changes retain the same celestial and scattering resources. Focused
replacement tests prove that changed receiver/geometry/query or supported
placement facts replace only the required owner while preserving the
independent scattering controller when its identity is unchanged. Algorithm32
type checking, all 526 Node specs, and all 11 real Three/WebGL specs pass.
Step 6.10 is closed. The complete 17-condition production GPU B1 regeneration
passes with unchanged aggregate RMSE `11.820392` mW m^-2 sr^-1 nm^-1.

Sun appearance Steps 1 through 4 are complete under the
[Sun-disk appearance implementation plan](sun-disk-appearance-implementation-plan.md).
They retain full direct extinction; the attempted extra sRGB transfer and
automatic-exposure candidate are rejected and disconnected, so production again
uses the fixed Figure-1 coefficient. Appearance Step 5 is selected but not
complete. Step 5.1 froze the output boundary. Runs `000240` and `000241` are
operational failures; run `000242` is a complete scientific rejection whose
valid 135 disk pairs were ordered but whose nine wide-view Flat labels had no
disk contribution. Step 5.2 first proves the one selected analytic
finite-disk coverage candidate at the unchanged viewports, then establishes
the actual output encoding and all 144 valid raw pair orders through the GPU
shader only. A contained faithful ACES GLSL must then pass bounded reference
gates before GPU-only views. Only an unchanged
candidate accepted at that visual checkpoint may be ported to Color. Final
verification restores CPU/reference/GLSL, refined convergence, and paired
CPU/GPU evidence; it uses concurrency `1`, host-resource reserve, progress
heartbeats, and inactivity rather than absolute-progress timeouts. The display
change does not reopen cache, composition, or atmospheric ownership. Its
accepted policy would feed the later Flat/local finite-Sun Step 9 and inform,
but not merge with, the Step 7 point-star response.

The candidate `CelestialFrameEvaluator` is a proof oracle only. Do not port it as a facade method, ShaderBuilder participant, or parallel renderer.

**Exit condition:** production browser tests cover clear, partial, ground/horizon, and blocked Sun cases, reject double transmittance/coverage and duplicate composition, and verify that scene visibility cannot erase path radiance.

### 7. Port stars as a separately enabled first-family layer

Status: authorized but paused at its resumption point. Detailed execution is
owned by the focused production-port plan. Celestial production steps 1
through 6 are complete. The production Ferwerda result from step 7 is visually
rejected; contained runs `000466` and `000467` qualify its Bruneton-derived
replacement, which remains pending production port. Step 8 is therefore
blocked.

The paused resumption order is owned by the
[Stellar Screen-Palette Production Port Plan](stellar-screen-palette-production-port-plan.md).
Current owner-directed work is the distant-Sun solar-zenith cache plan. This
section retains the promotion boundary and exit condition without acting as a
second work queue.

After source-data provenance and redistribution review, port the accepted
500-member BSC selection rule, bounded B/V-constrained native-15 packets,
screen-sized integer index, native-15 contribution palette, and catalog-epoch
through observation-time/location point projection. Re-home only reviewed
source inputs and parser/adapter logic;
never copy catalog proof runners or generated evidence. The older tiled `R32F`
member field and fragment catalog traversal are historical evidence, not the
current production representation.

The matrix and palette are produced by an ordered generation shader stage in
the standard Algorithm32 render pipeline, never by CPU projection/upload or the
cache-build subsystem. The base production layout is sparse and member-
addressed: slot zero is exact zero, candidate slot `memberIndex + 1` belongs to
that canonical member, and the lowest member index represents a collided pixel.
The contained compact CPU palette remains a resolved-spectrum/conservation
oracle, not a byte-layout oracle.

As the rapid follow-up in this same promotion tranche, port the resolved Sun as
a compact source-local continuous-coverage tile with one shared native-15
spectrum. The celestial shader places it over the stellar palette in O(1): any
positive coverage is the independent opaque claim, while the continuous
fraction scales Sun radiance. This is not the future fractional-claim merge.
Production implements the tile directly after the stellar palette contract
instead of first adopting the contained full-screen Sun flattening. Immutable
run `000435-sun-layer-screen-palette-three-scenes` is the support, energy,
transport, masking, and visual oracle.

That follow-up is complete. Production now generates a compact linearly
filtered `R32F` coverage tile with analytic circle/pixel overlap, publishes it
jointly with the optional stellar pair, and samples it before stars in the
shared fixed-cost consumer. The physical source remains spherical; the visible
renderer deliberately uses a circular disk and does not make camera
orientation an ellipse/conic cache identity. Successor setup must publish the
complete joint generation before atomic replacement disables the superseded
visible raster.

The production tree contains the separately exported
`FerwerdaColorDisplayModel`, but its cone/rod and diffuse-environment path is a
rejected appearance result and is not the selected Color architecture. The
contained replacement keeps `BrunetonColorDisplayModel` as its exact bright
base and derives one condition-wide global luminance lift from receiver-local
direct-source irradiance after atmosphere transmittance. The shared logarithmic
Hermite curve is gamma `1` at or above `5 cd m^-2`, gamma `0.125` at or below
`0.001 cd m^-2`, and smooth between them. It applies unchanged Bruneton first,
then scales all RGB channels together to the lifted photopic luminance. The
effective gain is globally capped at `32768`, preventing sub-byte residual
twilight from receiving unbounded relative amplification. It has
no rods, cones, scattered-light measurement, source type, location, time,
camera, viewport, or scene branch. Both paths retain the same source-independent
post-composition Color seam; no adaptation or display behavior belongs in the
stellar generator, Sun tile, or celestial consumer.

Keep the production tile seam reusable by a later Moon tile without enabling
Moon behavior in this tranche. That later source-local tile will add phase and
terminator geometry, grayscale lunar albedo, one shared native-15 lunar
reflectance spectrum, incident solar illumination, orientation/libration, and
an independent claim value so unlit lunar regions still occlude the Sun and
stars. It must merge through the same celestial shader rather than introduce a
sidecar renderer. Its separately gated lighting work must add a receiver-local
visible celestial-radiance field to ambient/adaptation alongside, but not
double-counted with, directional source irradiance. It must also qualify a
larger explicit moonlight shadow extent, including range/resolution precision
and cost or a cascaded alternative. None of this enables Moon behavior in the
current promotion tranche.

The later Moon gate must include a full-Moon, Sun-below-horizon control with
materially nonzero receiver-local scene lighting. Evidence must report direct
moonlight and its shadows separately from diffuse moonlit-sky ambient and the
visible-field adaptation input.

Canonical catalog directions remain immutable source data. The clock supplies
one fixed observation snapshot; receiver latitude/longitude plus its time offset
from catalog epoch determine stellar placement. Camera, projection, and viewport
remain runtime generation-stage inputs and may refresh an active/staging pair
without rebuilding the shader graph. Live clock updates, Earth-rotation
animation, source motion, interpolation, proper motion, source-roster mutation,
catalog expansion, and calibrated release claims remain deferred.

**Exit condition:** production coverage proves 500-member identity, packet and
palette conservation, exact point assignment, off-frame behavior, and matched
scene-hit suppression. Sun-tile coverage additionally proves continuous edge
radiance and total projected-area conservation against `000435`, compatible-
scale reuse, projection-scale invalidation, atomic replacement, context
restoration, and exactly-once disposal.

### 8. Promote the normal application path

Integrate the reviewed path through `Algorithm32.setupShader()`,
`Algorithm32ShaderHandle`, `ShaderBuilder`, and the existing `EffectComposer`
route. Define a production context-loss/restoration contract before enabling
it: stale resources must not be sampled, recovery must reallocate targets and
rerun the normal generation stage for the current identity, and generation must
not leak or double-dispose.

**Exit condition:** application-level browser tests cover setup, static
replacement, failed replacement, context loss/restoration, repeated disposal,
and the atmospheric-only compatibility path when the celestial roster is null.

### 9. Port the mandatory Flat/local finite-Sun family

Status: core normal path implemented on 2026-08-12; qualification remains in
progress. `FlatLocalMode` now enables the exact configured
`LocalSunLightSource` through `flat-local-finite-sun-v1`. The source exposes one
derived native-15 uniform-disk definition, Flat geometry owns placement and
finite atmosphere support, a dedicated controller constructs the scalar
`R32F` radiance field, and the live four-sample raster applies matched scene
visibility and contributes once through `celestialRadiance`. Focused N1
browser proofs reach `ready` and visibly render the disk. Current type checking,
all 538 Node specs, all 12 Three/WebGL specs, and the fresh complete GPU B1 gate
pass; B1 remains exact at aggregate RMSE `11.820392` mW. The full replacement,
context-restoration, clear/partial/blocked visibility matrix, and exact
solid-angle/direct-illumination parity portions of the exit condition remain
open.

Implement the reviewed `flat-local-finite-sun-v1` roster, the additive
`FiniteLocalSunCelestialSource` capability on the existing
`LocalSunLightSource`, shared static source definition,
Flat geometry placement/support/atmosphere-segment operations, scalar R32F
resource, construction-time center/radius bindings, direct illumination,
visible-disk composition, and a distinct finite-Sun controller lifecycle.

One definition owns radius, static center height, native-15 uniform surface
radiance, and profile. The configured light source and visible disk consume
that same definition. Receiver illumination integrates the source radiance
over exact visible solid angle; no second inverse-square factor is permitted.
External code supplies time/location while constructing the Flat geometry;
Algorithm32 mediates derivation of the model-frame center. Any time, location,
height, radius, radiance, atmosphere, or domain-policy change constructs a
complete successor geometry, facade, scene, and cache set while preserving the
installed scene on failure.

Keep the following isolated as later designs: in-place time/location animation
for non-stellar physical cache products and their required cache transforms;
any common transformed local/far source API or physical cache shape; the
separately owned
[distant-Sun point-local spectral scene cache](../algorithm32/cache/solar-zenith-cache-design.md);
HDR dark-twilight adaptation; Moon; opacity/order; profiled disks; and catalog
expansion.

**Exit condition:** production type, Node, browser, lifecycle, resource, and
application coverage proves source-radiance/solid-angle illumination parity,
exact apparent radius and ray-body support, clear/partial/blocked visibility,
horizontal live refresh without rebuild, static replacement, injected-failure
preservation, context restoration, and final disposal through the normal
runtime path.

The current reduced distant-source cache is known not to be twilight
equivalent. It may be retained only with its documented capability limit; it
cannot support a physical twilight-accuracy claim. The numerical replacement
is owned by the
[solar-zenith cache design](../algorithm32/cache/solar-zenith-cache-design.md);
the [distant-Sun plan](../algorithm32/cache/distant-sun-solar-zenith-cache-plan.md)
owns contained compiler and qualification work. Any live transformed-source
ingress is a later production integration track. Finite/local coordinates and
a common local/far interface are not prerequisites of the distant contained
plan and require a separate design.

### 10. Final promotion record and production hardening

Freeze the accepted candidate delta, compare it with the then-current production tree, and create a file-by-file ledger from baseline to candidate to production. The ledger must identify every ported file and every rejected experimental file.

Add durable production unit/regression, type, build, browser, lifecycle,
resource, import-closure, and document-consistency gates. Verify that
production has no runtime or build dependency on `scripts/extraterrestrial/`,
`tmp/extraterrestrial/`, `scripts/algorithm32-star/`, or the external stash.

Refresh the reflected-68 native-N4 binary64 CPU/GPU parity oracle before this
final gate and require the complete Three/WebGL lane to be green. This refresh
uses current production CPU output and does not reopen or depend on retired
Star material.

**Exit condition:** one production promotion record reports both mandatory
families, all fresh gates green, their accepted capability limits,
reproduction identities, and no incidental production mutation. Until then,
the work remains candidate-qualified rather than production-implemented.

## Explicit Non-Goals For The First Port

- No wholesale candidate-tree copy.
- No experimental runner, harness, immutable run artifact, or generated output becomes a production input.
- No public `CelestialFrameEvaluator` or sidecar renderer.
- No alias that preserves both obsolete candidate and selected production API names.
- No claim that the port resolves the known twilight cache discrepancy or
  enables Moon behavior. Flat/local finite Sun is required, but it does not
  imply another finite body or a generalized celestial-body API.

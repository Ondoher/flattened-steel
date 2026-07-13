# Algorithm32 Execution-Profile Method Inventory

Status: Stage 13 Step 2 inventory complete; authorized implementation groups
3.0 through 3.11 are implemented and Step 3.12 closure is active.

Implementation is divided into Steps 3.0 through 3.12 in the
[production implementation plan](production-implementation-plan.md#step-3-update-the-inventoried-methods).
That plan owns grouping, order, and per-group gates; this document remains the
canonical owner of method coverage and propagation requirements.

## Scope And Resolved Propagation

One complete `Algorithm32ExecutionProfile` enters through `Algorithm32`
configuration and is passed to `SharedModel` construction. `SharedModel`
validates and retains the exact object as `model.profile`; its component getters
return the same objects held by `profile.models`. Every downstream profile fact
is read from that retained authority.

`Config` becomes a union with two construction paths:

1. the existing application form supplies component models and an observation;
   the facade assembles a complete Native-15 execution profile after geometry
   resolves placement; and
2. the explicit form supplies one already-complete profile and may add only
   runtime shader and color collaborators.

The two forms cannot mix profile-owned component, observation, ground, or
execution fields. This prevents a partial comparison profile from falling back
to Native-15 values. `DEFAULT_NATIVE_PRODUCTION_PROFILE` remains the immutable
Native-15 value template used by the legacy/default construction path; a
complete default execution profile is per-model because it contains the
caller-selected component model objects and resolved placement.

The existing source-specific construction-domain selections remain the
executable adapters used by cache code. They are constructed from
`profile.domains` plus `profile.spectral.basis`; they are not independent
configuration. Incoming domains implement `WeightedDirectionDomain`, and
outgoing domains implement `ReconstructionDirectionDomain`. The latter owns
`resolveStencil`; this closes the former ambiguity in the generic
`DirectionDomain` shape.

View-path sample placement is profile-owned. `viewPath.sampleDistribution =
null` means the retained uniform endpoint/trapezoid schedule. Native-15 and B1
both select `null`. Renderer attachment, backend, scheduler, cancellation,
progress reporting, view ray, completed cache, scene resources, and output
targets remain transient request facts.

## Facade, Aggregate Model, And Evaluation

| Owner and method                                                                              | Current assumption                                                                               | Step 3 change and source                                                                                                                                                                                                                              | Downstream and verification                                                                                                         |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `Algorithm32._copyConfig`, `_copyPublicConfig`                                                | Copies separate component, observation, ground, Native-15 basis, and execution fields.           | Normalize the configuration union without copying a supplied profile; reject mixed forms. Preserve the public legacy snapshot shape for the legacy path and expose the selected profile on the explicit path.                                         | Constructor and `setConfig`; prove legacy snapshots and defaults are unchanged.                                                     |
| `Algorithm32._acceptObservation`, `_acceptConfigValues`                                       | Validates observation and only orders 1, 2, and 4 plus request-level numerical options.          | Split legacy-form validation from `_acceptExecutionProfile`; validate the complete profile once, including orders 1 through 5, basis semantics, packets, models, placement, numerical controls, and domain capabilities.                              | No resource may be created before rejection; add positive Native-15/direct-40 and mismatch checks.                                  |
| `Algorithm32._prepareConfig`                                                                  | Derives placement from observation and constructs `SharedModel` from five separate dependencies. | For legacy config, resolve ordinary placement and assemble the complete Native-15 profile. For explicit config, ask geometry to validate/install `models.sourcePlacement`. Construct `SharedModel({version, profile})`.                               | Exact profile/model object identity; observation-driven application placement and explicit B1 placement.                            |
| `createNativeProductionProfile` and the Native-15 default assembly helper                     | Produces a data template without component models, placement, domains, or view sample placement. | Preserve the existing template values, add `viewPath.sampleDistribution = null`, and assemble a complete per-model execution profile from the legacy facade's accepted component objects, resolved placement, and source-selected production domains. | Existing exported Native values remain exact; the completed default profile passes the same generic ingress as an explicit profile. |
| `Algorithm32._createShaderBuildRequest`, `evaluate`                                           | Carries a config snapshot whose ground and execution fields are reread downstream.               | Pass the aggregate model and only transient setup/evaluation facts.                                                                                                                                                                                   | No profile option in shader/evaluation requests.                                                                                    |
| `SharedModel.constructor` and getters                                                         | Stores separate components and constructs `SpectralModel` from `spectralBasis`.                  | Accept `{version, profile}`, retain exact profile, expose `profile`, derive component getters from `profile.models`, and construct spectral view from `profile.spectral.basis`. Add `groundBoundary`.                                                 | Exact identity assertions for profile and every component.                                                                          |
| `SpectralModel.constructor`, `replaceBasis`                                                   | Basis is independently replaceable.                                                              | Construct only from the retained model profile and remove mutable basis replacement from the model lifecycle.                                                                                                                                         | Replacement configuration creates a replacement aggregate model; native wavelength values remain exact.                             |
| `Reference.constructor`, `_resolvePathIntervalCount`, `evaluate`                              | Retains copied execution options and permits a per-evaluation path count.                        | Retain only the aggregate model; read `model.profile.numerical.viewPath.intervalCount`; remove the request override and resolver fallback. Keep view ray and completed CPU cache transient.                                                           | Reuse one B1 cache for 81 rays with a fixed 40-interval schedule.                                                                   |
| `SpectralCalculator.constructor`, `_acceptPacket`, `computeDirectRadiance`, `computeRadiance` | Receives separate models, basis, and execution options.                                          | Receive the aggregate model; derive component owners, basis, and source interval count from `model.profile`. Keep already-resolved path points and cache as method inputs.                                                                            | Direct-40 values remain point samples and all packet lengths follow the selected basis.                                             |

Affected declarations are `interfaces/algorithm32/types.d.ts`,
`implementation/algorithm32/types.d.ts`,
`implementation/algorithm32/model/types.d.ts`,
`reference-execution/types.d.ts`, and
`atmospheric-transport/spectral/types.d.ts`. `EvaluationRequest.pathIntervalCount`
and every internal `executionOptions` dependency are removed.

## Spectral And Physical Model Owners

| Owner and method                                                                                                                                 | Current assumption                                                                              | Step 3 change and source                                                                                                                                                                                                                                                | Downstream and verification                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `SpectralBasis._normalizeChannels`, constructor                                                                                                  | Accepts only contiguous bin-average channels.                                                   | Accept both declared semantics. Enforce contiguous support only for bin averages; point samples retain finite positive support widths and strictly increasing unique coordinates.                                                                                       | Exact Native-15 hash/source is invariant; direct-40 basis has 40 unchanged coordinates and point semantics.                                   |
| `SpectralPacket` constructor/assertions                                                                                                          | Already basis- and semantics-driven.                                                            | No math change; use it at profile ingress for source, atmosphere, ground, and result packets.                                                                                                                                                                           | Reject projection, padding, truncation, and semantics mismatch.                                                                               |
| `CanonicalAtmosphere.constructor`, `_assertConstants`, `_createAtmospherePacket`, `_atmosphereConstantsBlock`, coefficient/sample/shader methods | Constructor fixes Native-15 and derives coefficients only from the canonical formula constants. | Accept a selected basis and general physical coefficient definition at model construction. Retain either the current analytic Native-15 definition or exact aligned coefficient packets/functions supplied by a profile builder. All CPU and GLSL loops use that basis. | Native coefficients and shader bytes remain invariant; B1 Rayleigh/Mie/absorption values match the pinned paper inputs at all 40 coordinates. |
| `DistantSunLightSource.constructor`, `sampleDirectLighting`, cache-controller/provider construction                                              | Hard-codes `NATIVE_SOURCE_IRRADIANCE_DENSITY`.                                                  | Accept and retain the aligned source packet; cache methods receive the aggregate model rather than repeated profile values.                                                                                                                                             | Native packet identity is unchanged; B1 returns the exact paper packet.                                                                       |
| `LocalSunLightSource.constructor`, `sampleDirectLighting`, cache-controller/provider construction                                                | Also hard-codes the Native-15 source packet and owns a separate source interval count.          | Accept the selected packet; source-path interval count comes from the aggregate profile.                                                                                                                                                                                | Flat/local default remains byte-identical and profile alignment is checked once.                                                              |
| `SphericalEarthGeometry.configureLightSource` and placement helpers                                                                              | Always derives direction from observation.                                                      | Accept the profile placement union: retain current observation derivation or validate/install the exact geometry-resolved placement.                                                                                                                                    | Normal San Jose/time behavior is unchanged; each B1 condition uses its supplied direction exactly.                                            |
| `FlatEarthGeometry.configureLightSource` and placement helpers                                                                                   | Always derives local source position from observation.                                          | Consume the same placement union and preserve the current local derivation for Native-15.                                                                                                                                                                               | Flat32 default placement and local cache pairing remain unchanged.                                                                            |
| `UniformLambertianGroundBoundary.constructor`, `_createAlbedoPacket`, `evaluateBrdf`, `createCacheModule`                                        | Material selection constructs only Native-15 grass.                                             | Permit an exact aligned albedo packet at boundary construction; retain the material shortcut for the default. Cache/CPU methods use the retained packet.                                                                                                                | Native grass values remain exact; B1 direct-40 grass values and `albedo / pi` are unchanged.                                                  |

The physical component models are constructed before the complete profile is
assembled, but their selected executable packets and basis are retained by the
profile as the same component objects. Downstream callers never repeat those
construction options.

## Domain Selection, Geometry, Packing, And Reconstruction

| Owner and method                                                                                                   | Current assumption                                                                                               | Step 3 change and source                                                                                                                                                                          | Downstream and verification                                                              |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `DistantSunConstructionDomainSelection.constructor`, `resolveOutgoingDirectionStencil`                             | Is data-driven but declaration types name concrete Native/Fibonacci/W27 classes.                                 | Construct from profile position, weighted incoming, reconstruction outgoing, and basis owners; type against capabilities.                                                                         | Counts are 48/34/4374/15 for native and 48/34/4374/40 for B1; W27 taps remain exact.     |
| `LocalSunConstructionDomainSelection.constructor`, `fromGeometry`                                                  | Defaults its basis to Native-15.                                                                                 | Require the profile basis and selected domains; the default facade supplies current Flat domains explicitly.                                                                                      | No hidden Native-15 fallback.                                                            |
| `DistantSunFieldPacking` and local field packing constructors                                                      | Already use supplied dimensions.                                                                                 | No algorithm change; instantiate only from accepted profile-derived counts.                                                                                                                       | Round-trip every first/last coordinate for both 15 and 40 layers.                        |
| `SphericalScatteringCacheGeometry._createTransportQueryTaps`, `createTransportData`                                | Uses the Native-15 channel count.                                                                                | Read the construction selection/profile basis channel count.                                                                                                                                      | Packed transport offsets and layer bounds are valid for 40 channels.                     |
| `SphericalScatteringCacheGeometry.resolveScatteringCachePositionStencil`, `resolveScatteringCacheDirectionStencil` | Reads global Native-48 and W27 owners.                                                                           | Read the retained profile-derived domain selection; geometry still owns physical/source-local transforms.                                                                                         | Native stencils are bit-for-bit invariant; B1 uses its exact 48 nodes and W27 owner.     |
| `SphericalGeometryShaderContributor.constructor`, `createShaderContribution`                                       | Emits Native-48 nodes and fixed W27 facts.                                                                       | Retain the selected position/outgoing domains and emit their counts, nodes, and reconstruction facts. W27 remains the currently supported outgoing shader capability and is validated at ingress. | Compare native shader contribution byte-for-byte; compile the 40-layer B1 contribution.  |
| `SphericalGeometryCacheModuleProvider.createCacheModule`                                                           | Already consumes `context.domains`.                                                                              | Remove native labels only; continue using the profile-derived selection carried by build context.                                                                                                 | CPU/GPU coordinate and source-frame parity.                                              |
| `FlatScatteringCacheGeometry.resolveScatteringCachePositionStencil`, `resolveScatteringCacheDirectionStencil`      | Position reconstruction can accept selected axes, but final direction reconstruction reads the global W27 owner. | Retain/use the local profile-derived construction selection for both axes and outgoing reconstruction. Preserve W27 as the currently validated outgoing capability.                               | Existing Flat z/rho and W27 stencils remain exact; no global-domain fallback survives.   |
| `FlatGeometryShaderContributor.createShaderContribution`, `FlatGeometryCacheModuleProvider.createCacheModule`      | Shader geometry uses configured Flat axes while cache modules use request domains.                               | Bind both owners to the same accepted profile-derived local selection; keep the existing fused transport contribution unchanged.                                                                  | Native Flat shader source, cache layouts, and zero packed-transport result remain exact. |
| `DistantSunCache.constructor`, `createShaderContribution`                                                          | Samples the artifact correctly but does not retain selected profile/domain identity.                             | Cache publication retains basis and domain facts from the accepted plan; shader sampling dimensions remain artifact-driven.                                                                       | Cache/model compatibility rejects cross-profile reuse.                                   |
| `DistantSunCpuCache.constructor`, `sampleResolved`                                                                 | Allocates and publishes Native-15 packets.                                                                       | Retain the build result's profile-derived basis and allocate its channel count.                                                                                                                   | Direct-40 sampled packets have 40 values and point semantics.                            |

The generic outgoing-domain contract does not promise arbitrary shader code.
Stage 13 accepts the executable W27 reconstruction capability used by both
paths; adding another outgoing family requires its own contributor contract
and is not inferred from ids or descriptors.

## CPU Cache Construction And Recurrence

| Owner and method                                                                                                                                                                                    | Current assumption                                                                                 | Step 3 change and source                                                                                                                                     | Downstream and verification                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `DistantSunCacheProvider._resolveConstructionDomainSelection`, `_acceptCpuTransportIntervalCount`, `_acceptCpuRecurrenceProfile`                                                                    | Request overrides fall back independently to Native defaults.                                      | Replace them with one model/profile-context acceptance step. Domain selection, order, intervals, basis, models, and boundary come only from `model.profile`. | Requests contain no duplicate executable option.                                                        |
| `DistantSunCacheProvider.buildCpuPrimaryRadianceField`, `buildCpuScatteringCache`, `_buildCpuCache`, `_buildCumulativeResult`                                                                       | Accepts repeated profile/domain/order/transport facts and returns only explicit N1/N2/N4 branches. | Accept aggregate model plus transient progress; use one recurrence loop through the selected maximum and publish its cumulative field.                       | Exact N1-N5 field/order identities and one cache per B1 condition.                                      |
| `DistantSunCpuPrimaryEvaluator._selectNativeProfile`, `_assertNativeAtmosphereBasis`, request resolvers, `createSpectralCalculator`, `buildPrimaryRadiance`, `buildPrimaryScatteringDensity`        | Selects Native profile/basis and contains Native/Fibonacci labels.                                 | Remove native selection; read accepted model/profile facts and profile-derived domains. Keep physical evaluation order unchanged.                            | Native binary64 values remain exact; direct-40 J1 uses exact source/atmosphere values.                  |
| `DistantSunCpuMultipleScatteringEvaluator._assertAdapterRequest`, `_createPhysicalDirectionResolvers`, `createLaterOrderScatteringKernel`, `_normalizeTransportRequest`, `buildTransportedRadiance` | Defaults the domain selection and assumes concrete cubed-sphere face-center facts.                 | Receive model/profile context and use the reconstruction capability. Keep the W27 physical-frame assertion as a capability check, not an id-based selection. | Selected J2-J5 probes, source-local directions, and transport endpoints.                                |
| `LocalSunCacheProvider._acceptCpuProfile`, interval acceptors, `buildCpuScatteringCache`, recurrence helpers                                                                                        | Profile, order, intervals, and domains can be repeated independently; order gate is 1/2/4.         | Pull all executable facts from the aggregate model/profile and retain the existing generic recurrence loop for 1 through 5.                                  | Native Flat J4 authority and GPU-offload behavior stay unchanged; focused J3/J5 CPU checks.             |
| `LocalSunCpuCache.constructor`, `sampleResolved`                                                                                                                                                    | Allocates and publishes Native-15 packets.                                                         | Retain the build result's profile-derived basis and allocate its channel count, matching the distant CPU cache contract.                                     | Native sample packets remain exact; any generic local profile cannot silently truncate or pad channels. |

CPU field allocators, `ScatteringOrderFieldOperations`, later-order scattering
density, scattering-density transport, and field packing already operate on
provided counts and numeric order. They require declaration widening to orders
3 and 5 but no profile lookup or numerical formula change.

## GPU Cache Planning, Shader Assembly, And Final Display

| Owner and method                                                                                                                          | Current assumption                                                                                    | Step 3 change and source                                                                                                                                                                                                                                                                                               | Downstream and verification                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `DistantSunCacheController.constructor`, `_acceptBuildRequest`, `_acceptSpectralBasis`                                                    | Controller retains only source/backend, and requests repeat physical owners; basis must be Native-15. | Controller retains aggregate model plus transient backend/scheduler. Validate profile alignment at ingress, then remove request-level physical/profile facts and Native-only check.                                                                                                                                    | Reject mismatched resources before plan execution; compile 15- and 40-layer plans.                                     |
| `DistantSunCacheController._acceptMaximumScatteringOrder`, `_acceptConstructionDomainSelection`, `_acceptConstructionOptions`             | Applies independent defaults and accepts 1/2/4.                                                       | Read the already-accepted profile order, domains, and transport count.                                                                                                                                                                                                                                                 | No fallback path or duplicate request facts.                                                                           |
| `DistantSunCacheController.createBuildPlan`, `_createPureScatteringField`, `_createPureRadianceField`, `_createCumulativeScatteringField` | Layer count is 15 and the graph is hand-written for N1/N2/N4.                                         | Layer count follows the profile basis. Generate the recurrence graph through the selected order, including N3 and N5 as detailed below.                                                                                                                                                                                | Exact native N4 field/pass ids, ordering, and shader source remain unchanged; N3/N5 graph snapshots are deterministic. |
| `DistantSunCacheController._executeGeneration`, `createScatteringCache`                                                                   | Drops optional domain/options when re-forming a plan request.                                         | Build directly from retained model/profile and carry only cancellation to execution.                                                                                                                                                                                                                                   | Plan identity includes profile facts and reuse cannot cross profiles.                                                  |
| `LocalSunCacheController` constructor, request acceptance, plan helpers, `createBuildPlan`, generation                                    | Native basis, fixed interval constant, repeated physical owners, and 1/2/4 order gate.                | Mirror the model-owned propagation and dynamic basis/order rules while preserving fused Flat transport construction.                                                                                                                                                                                                   | Native local N4 plan and zero packed-transport policy remain exact.                                                    |
| `ShaderBuilder._createBuildContext`                                                                                                       | Reads ground and maximum order from facade config and repeats basis/models to the controller.         | Read the aggregate profile and pass the model once when creating the source controller.                                                                                                                                                                                                                                | Native setup plan is invariant; explicit profile creates its selected cache.                                           |
| `ShaderAssemblyPreparer._collectContributions`                                                                                            | Creates `executionOptions` from facade config.                                                        | Provider request carries the aggregate model and transient runtime context only. Transport, geometry, source, atmosphere, cache, and color contributors derive profile facts from the model.                                                                                                                           | No execution option remains in contribution assembly.                                                                  |
| `Algorithm32Transport._resolveTransportOptions`, `createShaderContribution`                                                               | Falls back to the Native numerical profile.                                                           | Remove fallback; read view interval count and sample distribution from `model.profile.numerical.viewPath`.                                                                                                                                                                                                             | Native GLSL is byte-identical and B1 emits interval count 40.                                                          |
| `BrunetonColorDisplayModel` packet acceptors, spectral projection helpers, transmittance bands, `createShaderContribution`                | All CPU/GLSL projection arrays and loop counts are Native-15.                                         | CPU methods derive basis from accepted packets; shader contribution derives it from the aggregate model. Cache projection weights by basis identity. Preserve an exact Native-15 compatibility path for current transmittance bands; define the general wavelength-driven path without recognizing benchmark identity. | Existing E8/native display fixtures remain exact; direct-40 projection/GLSL dimensions are checked independently.      |

`CacheGpuExecutor`, `CachePassAssembler`, `CacheOperations`, shader source
formatting, R32F array allocation, and runtime binding code already consume
plan-declared dimensions. They need order-union/type widening where exposed but
do not read the profile themselves.

## Explicit J3 And J5 Work

Order support is separate from spectral propagation. The accepted recurrence
is `J1`; for each `k >= 2`, scatter `L(k-1) -> Jk`, accumulate `J-through-k`,
and, when `k` is below the requested maximum, transport `Jk -> Lk`. Reflective
ground illumination for `Jk` uses the already-pure `L(k-2)` field, matching the
current J3/L1 and J4/L2 behavior.

| Requested maximum | Additional plan after current shared prefix                               | Published result        |
| ----------------- | ------------------------------------------------------------------------- | ----------------------- |
| J3                | `J2 -> L2`, `L2 -> J3`, accumulate through J3                             | `J-through-3`           |
| J4                | Existing `J3 -> L3`, `L3 -> J4`, accumulate through J4                    | unchanged `J-through-4` |
| J5                | `J4 -> L4`, `L4 -> J5`, accumulate through J5; reflective J5 uses pure L3 | `J-through-5`           |

`Algorithm32ExecutionScatteringOrder`, `SupportedCacheScatteringOrder`,
`CacheOrder`, cache result/request unions, controller field helpers, CPU field
order declarations, and related ambient types widen to 1 through 5. Application
configuration still defaults to J4. No interpolation, spectral, phase, or
transport equation changes are authorized by this widening.

## Requests That Lose Profile-Owned Fields

The following fields are removed from downstream requests wherever present:
`profile`, `spectralBasis`, `atmosphere`, `geometry`, `lightSource`,
`groundBoundary`, `maximumScatteringOrder`, `pathIntervalCount`,
`sourceTransmittanceIntervalCount`, `transportIntervalCount`,
`domainSelection`, and `constructionOptions`. Their replacement is one
`model: Algorithm32ExecutionModel` dependency at the owning lifecycle seam.

This affects declarations under:

- `interfaces/algorithm32`, `interfaces/light-source`, and `interfaces/geometry`;
- `implementation/algorithm32/model`;
- `reference-execution` and `rendering-runtime`;
- `atmospheric-transport` and `shader-assembly/cache-pass`;
- `implementation/distant-sun` and its `cache` declarations; and
- `implementation/local-sun` and its `cache` declarations.

Transient requests retain only values that vary without replacing the model:
view rays, completed cache handles, renderer/backend/scheduler resources,
cancellation signals, progress callbacks, scene inputs, shader attachment
options, and output destinations.

## Step 3 Verification Obligations

1. Type check every changed ambient contract and its production consumers.
2. Prove the legacy facade builds a complete Native-15 profile whose component
   objects, numerical values, domains, placement, and basis equal current
   defaults.
3. Compare Native-15 basis/profile hashes, CPU N1/N2/N4 selected values, cache
   plan identities and pass order, shader source/contributions, and Flat32
   application output with the pre-change authorities.
4. Construct one value-agnostic direct-40 profile and prove exact coordinate,
   semantics, packet, domain, packing, and explicit-placement propagation.
5. Verify deterministic CPU cumulative results for J2, J3, J4, and J5 with no
   request-level profile option and no Native-15 fallback.
6. Compile and execute focused 15- and 40-layer GPU plans within supported
   WebGL2 limits; compare selected CPU/GPU values where the existing parity
   boundary applies.
7. Verify one cache per B1 condition can serve all 81 view rays and that cache
   reuse rejects another profile or placement.
8. Search production source for remaining executable Native-15 channel-count,
   basis, domain, numerical-default, and request-level profile fallbacks. Named
   Native constants may remain only in the Native default builder and exact
   compatibility fixtures/display path.

The inventory has no unresolved profile value, owner, propagation edge,
default-preservation path, or J3/J5 requirement. Step 3 may change only the
methods and declarations named here; a newly discovered executable edge stops
implementation until this inventory is updated.

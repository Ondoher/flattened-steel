# Step 5 Distant-Sun Cache Reconciliation

Status: complete production-input reconciliation for production integration
Step 5.1, complete exact contract refinement for Step 5.2, and complete
binary64 logical-field implementation for Step 5.3. This document owns the
file-by-file and behavior-by-behavior mapping
from the accepted extraterrestrial distant-Sun cache evidence to current
production owners. It authorizes contract work in Step 5.2; it does not itself
change production implementation.

## Goal And Boundary

Step 5 ports one spherical distant-Sun celestial transport field and its
independent lifecycle participant. It does not change the atmospheric
scattering cache, add stellar or Flat finite-Sun resources, or make the Sun
visible in the final image. Live disk support, scene visibility, sampling, and
composition remain Step 6.

The selected field stores native-15 spectral radiance after direct
source-path attenuation:

```text
sunTransport(h, u, lambda)
    = supported(h, u)
        ? surfaceRadiance(lambda) * exp(-opticalDepth(h, u, lambda))
        : 0
```

The production domain is the Step 4 spherical domain:

- width: 11 horizon-normalized direction coordinates;
- height: 13 receiver-altitude nodes;
- layers: 15 native spectral channels;
- GPU storage: one `R32F` array field, 2,145 scalars or 8,580 resident bytes;
- CPU reference storage: binary64 values over the same logical coordinates.

No scattering order, scattering recurrence, phase function, ground reflection,
or cumulative-scattering value belongs to this field. Apparent disk coverage
also does not scale the stored field; geometry support and the live disk
consumer apply that later.

## Accepted Experimental Evidence

| Evidence                                            | Accepted conclusion                                                                                                                                                                                                                                                            | Production use                                                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `000027-g6a-primary-celestial-cache-proof`          | Six positive assertions and two negative controls established uniform-disk source radiance, direct atmospheric attenuation, clear/partial/empty query behavior, stable source selection, and duplicate/unknown-source rejection.                                               | Retain the distant-Sun-only physical field and CPU reference behavior; reject its aggregate multi-source container.                       |
| `000028-g6b-r32f-representation-proof`              | The 11 by 13 by 15 binary32 representation preserved the selected CPU values with maximum readback error `0.00000732421875682121`.                                                                                                                                             | Retain layout semantics as a reference oracle; do not upload a CPU-materialized full field in the production GPU path.                    |
| `000124-g6c-gpu-cache-render-proof`                 | A real WebGL2 cache-render pass produced an 11 by 13 by 15 `R32F` field, submitted 15 wavelength layers, matched CPU nodes with maximum error `3.7420860638829985e-7`, used explicit geometry stencils, and preserved the active generation after injected allocation failure. | Port GPU cache-render construction, bounded probes, distinct binding, and failure preservation through current production runtime owners. |
| `000144-pre-g9-celestial-replacement-runtime-proof` | Successful replacement changed the field, failed staging did not publish, prior resources retired only after success, and final handle disposal released the live field.                                                                                                       | Retain transactional replacement and disposal behavior through the existing family-specific build-result slots.                           |
| `000153-g7-three-atmosphere-integration`            | The candidate installed atmospheric and celestial resources together and rendered a live Sun.                                                                                                                                                                                  | Use only as lifecycle/integration evidence in Step 5. Live Sun evaluation and composition are deferred to Step 6.                         |

The candidate source files and ignored run records are evidence only. They are
not production dependencies or copy sources.

## Physical And Logical Field Ledger

| Candidate input                                                         | Disposition                            | Production owner and substep                                                | Required adaptation                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DistantSunCelestialSource` radiance derivation                         | Already replaced by current production | Existing `DistantSunLightSource.celestialSourceDefinition`, Step 4.3        | Use the one existing atmospheric Sun and its already-derived `surfaceRadiance`. Do not create a second source adapter or apply another solid-angle or inverse-square factor.                                                                                   |
| `buildCacheFragments()` uniform-disk fragment                           | Already replaced by current production | `createCelestialCacheFragment()` and `CelestialSourceSupport`, Step 4.2/4.3 | Consume the exact production fragment and source definition. Candidate anchors, offsets, width, height, copied values, and packing facts remain rejected.                                                                                                      |
| `CpuSunDiskRadianceCache._build()`                                      | Adapt                                  | Distant-Sun feature-private binary64 logical cache, 5.3                     | Iterate exact Step 4 domain indices, obtain every `CelestialBuildSample` from geometry, use current `AtmosphereModel.integrateOpticalDepth()`, multiply the accepted surface-radiance packet by transmittance, and write exact zero when `supported` is false. |
| Candidate CPU interpolation helper                                      | Adapt to production stencils           | Distant-Sun binary64 logical cache, 5.3                                     | Consume fixed two-tap `CelestialReceiverStencil` and `CelestialDirectionStencil` contracts. Do not infer or normalize another coordinate convention inside the cache.                                                                                          |
| `PrimaryCelestialCache` source maps, slots, fragments, and payload maps | Reject                                 | No production owner                                                         | Step 5 has exactly one distant-Sun field. Stellar and Flat caches remain separate resources; no aggregate primary cache or source-slot table is introduced.                                                                                                    |
| `PrimaryCelestialR32FRepresentation`                                    | Retain only as reference semantics     | CPU/GPU parity tests, 5.3/5.4                                               | Keep wavelength-major array-layer addressing and selected-value comparison. Production GPU construction renders directly into `R32F`; it does not build and upload the full CPU field.                                                                         |

## GPU Construction Ledger

| Candidate input                                     | Disposition                                | Production owner and substep                               | Required adaptation                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PrimaryCelestialGpuPlan`                           | Adapt and rename                           | Distant-Sun feature-private plan owner, 5.4                | Produce one `GpuFieldExecutionPlan` with one 11 by 13 by 15 result and one direct-transport pass. Use `CanonicalValueHash`/`CacheReuseIdentity`, current domain identity, source-definition identity, atmosphere transport identity, and numerical interval count.                                                      |
| Candidate `kind: 'celestial-direct'` and `order: 1` | Reject                                     | Neutral `GpuFieldPass`, 5.4                                | The neutral executor does not interpret scattering or celestial semantics. The family plan owns meaning; its pass needs only id, inputs, output, and modules.                                                                                                                                                           |
| Candidate geometry cache-build module               | Adapt through current geometry authority   | `implementation/spherical-earth/celestial`, 5.4            | Emit construction positions and directions from the Step 4 domain. Do not read `_configuration`, recreate the candidate `_topAtmospherePath()`, or select a second horizon convention. Supply a CPU-derived exact support mask so GPU node classification matches `createCelestialBuildSample()` at contact boundaries. |
| Candidate canonical-atmosphere celestial module     | Adapt through current atmosphere authority | Canonical-atmosphere private cache support, 5.4            | Use the current atmosphere's complete extinction semantics and the profile's typed source-path interval count. Do not fork an older Rayleigh/Mie-only formula or recover values from descriptors.                                                                                                                       |
| Candidate source cache-build module                 | Adapt behind the existing Sun              | Distant-Sun celestial cache provider, 5.4                  | Bind the existing native-15 `surfaceRadiance` and compute only radiance times transmittance or exact zero. Keep the atmospheric scattering `createCacheModule()` path unchanged.                                                                                                                                        |
| Candidate `CacheGpuExecutor` use                    | Replace with selected neutral seam         | `GpuFieldExecutor` plus existing `CachePassAssembler`, 5.4 | Invoke the neutral executor directly with the caller-selected celestial value key. Do not route the celestial plan through the scattering adapter.                                                                                                                                                                      |
| Candidate `cache.primaryCelestialRadiance` key      | Rename directly                            | `cache.celestial.sunTransport`, 5.2/5.4                    | Use the already-declared production key and a family-owned constant. No alias or fallback key is retained.                                                                                                                                                                                                              |
| Candidate full-field GPU readback                   | Reject                                     | Bounded `CacheProbeReader`, 5.4/5.7                        | Production may read only selected scalars for diagnostics and parity gates. Normal construction publishes the resident field without a full readback.                                                                                                                                                                   |

## Resource, Lookup, And Lifecycle Ledger

| Candidate input                                                  | Disposition                                 | Production owner and substep                                                           | Required adaptation                                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PrimaryCelestialGpuCache` resource wrapper                      | Adapt and rename                            | Distant-Sun celestial resource, 5.4/5.5                                                | Publish source id, resource identity, one opaque runtime binding, bounded probes, lookup contribution, and idempotent disposal. Do not publish the live disk contribution in Step 5.                                |
| Candidate bilinear lookup shader                                 | Adapt                                       | Distant-Sun resource plus spherical geometry shader support, 5.4/5.6                   | Retain explicit two-by-two texel lookup. Geometry owns stencil construction and invalid support; cache code only applies indices and weights to the field.                                                          |
| Candidate live four-sample disk raster                           | Defer                                       | Step 6                                                                                 | Camera rays, disk membership, scene-hit suppression, angular coverage, `celestialRadiance`, and final composition are not Step 5 resource behavior.                                                                 |
| `PrimaryCelestialGpuCacheController`                             | Adapt and rename                            | Dedicated distant-Sun celestial controller, 5.5                                        | Retain exact reuse and publish only after complete GPU execution. Add current production cancellation, serialized supersession, backend-capability reuse identity, last-valid preservation, and idempotent cleanup. |
| Current scattering `DistantSunCacheController` lifecycle pattern | Adapt behavior, do not reuse semantic class | Dedicated celestial controller, 5.5                                                    | Reuse the proven transaction pattern, not its scattering plan, controller instance, executor adapter, recurrence, descriptor, or binding.                                                                           |
| `CelestialContributionCacheController` aggregate generations     | Reject                                      | No production owner                                                                    | Do not require star and Sun layers, accept foreground edges, publish point/extended payload arrays, or create an aggregate generation descriptor.                                                                   |
| Candidate FNV generation/runtime fingerprints                    | Reject                                      | Production canonical value identity owners, 5.2-5.5                                    | Derive SHA-256 identity directly from executable source, domain, atmosphere, numerical, layout, plan, and backend-capability facts. Descriptors remain diagnostic metadata.                                         |
| `CelestialRuntimeParticipant`                                    | Reject                                      | Existing profile roster, `SharedModel`, and `ShaderBuilder`, 5.6                       | The accepted roster already selects the exact source. No participant, primary-source selector, or geometry-created controller is introduced.                                                                        |
| Candidate geometry-created cache/controller methods              | Reject                                      | Distant-Sun source-family provider, 5.2-5.6                                            | Geometry supplies only domain, samples, stencils, and geometry-owned shader modules. It does not construct or own the distant-Sun controller/resource.                                                              |
| Candidate replacement/runtime behavior                           | Adapt                                       | Existing distant-Sun build-result slots, runtime installer, and shader handle, 5.5-5.7 | Install the celestial binding atomically beside the scattering binding, preserve reusable controllers independently, dispose retired resources exactly once, and preserve the last installed build on failure.      |

## Current Production Seams Already Ready

The following production work is complete and must be used rather than
recreated:

- `DistantSunLightSource` owns the shared physical Sun, uniform-disk surface
  radiance, canonical definition identity, placement input, and logical
  fragment.
- `SphericalEarthGeometry` owns placements, the 13 by 11 domain, exact build
  samples, current atmosphere paths, contact classification, fixed stencils,
  and immutable query packets.
- `GpuFieldExecutor` owns renderer-neutral allocation, pass execution,
  cancellation boundaries, bounded probes, diagnostics, cleanup, and the
  caller-selected runtime value key.
- `CachePassAssembler` owns deterministic owner-module assembly.
- `ThreeCacheBackend` already accepts `cache.celestial.sunTransport` and
  publishes an opaque binding without exposing the raw texture.
- `ShaderBuildContext`, `ShaderBuildResult`, `ShaderRuntimeInstaller`,
  `Algorithm32ShaderHandle`, and facade supersession handling already have
  distinct distant-Sun controller/resource/identity slots.
- Shader assembly already has the separate `celestialCache` owner and
  `sampleCelestialCache` slot, while the null-roster path installs neither a
  celestial field nor a celestial hook.

## Remaining Production Work For Steps 5.6 Through 5.7

Step 5 still needs these concrete pieces after the completed 5.5 lifecycle:

1. the geometry-owned shader stencil representation and cache-owned bilinear
   lookup contribution, without the Step 6 live consumer;
2. enabled-roster construction and atomic installation in `ShaderBuilder`;
3. focused installation, supersession, context/resource, and disposal gates
   beyond the controller-local cancellation, reuse, replacement, and allocation
   failure proofs completed in 5.5.

## Contract Refinements Completed In Step 5.2

The placeholder declarations were replaced with these exact contracts:

- `DistantSunCelestialCachePlan` must carry the exact neutral field plan or the
  typed executable facts from which the controller constructs it; a descriptor
  alone is insufficient.
- The controller build request must carry the trusted model/source/geometry
  inputs needed to derive a plan, rather than accept an arbitrary caller-made
  plan as executable authority.
- The resource must expose its exact distant-Sun descriptor, runtime binding,
  bounded probe operation, and shader lookup contribution in addition to the
  common lifecycle surface.
- CPU field coordinates and query results need named exact contracts; no
  arbitrary records are permitted.
- A family-private atmosphere and geometry cache-module context must express
  the domain and source-path interval count without widening scattering
  `CachePassKind` or `CacheBuildContext`.
- The controller reuse identity must distinguish the source definition,
  geometry domain, atmosphere transport facts, numerical interval count,
  backend capabilities, and scheduler/backend ownership without treating a
  descriptor as executable input.

The completed declarations distinguish the 13 by 11 construction/support
lattice from the 13 by 11 by 15 native spectral field and statically constrain
the neutral GPU graph to one `R32F` field, one pass, and the sole
`cache.celestial.sunTransport` binding. The controller derives that graph from
trusted placement and query facts; no caller-made executable plan is accepted.
Type checking, 79 focused celestial/GPU seam specs, and all 500 Node specs pass.

## Binary64 Logical Field Completed In Step 5.3

`DistantSunCelestialCpuCache` is the sealed production CPU reference. It owns
one private 2,145-scalar `Float64Array`, one independently hashed 143-node
support mask, validated coordinate reads, copied snapshots, and two-by-two
lookup over geometry-supplied receiver and direction stencils. Construction
uses only `createCelestialBuildSample()` paths and
`AtmosphereModel.integrateOpticalDepth()` transmittance. Unsupported nodes
remain exact zero and do not invoke the atmosphere. No scattering recurrence,
phase, ground reflection, disk coverage, camera behavior, GPU allocation, or
runtime binding enters the field.

Five focused proofs cover the complete field, selected numerical values,
exact-zero controls, interpolation and invalid classifications, canonical
identity response to source/domain/atmosphere/numerical changes, and rejection
of nonfinite or out-of-range transport. Type checking and all 505 Node specs
pass.

No unresolved design choice blocks Step 5.4. The production port is a
distant-Sun-only feature-private cache using the existing neutral GPU executor
and existing family-specific runtime slots. The atmospheric-only null-roster
path remains the mandatory exact compatibility boundary.

## GPU Construction Implemented In Step 5.4

`DistantSunCelestialGpuBuilder` derives one exact 11 by 13 by 15 `R32F` field,
one direct-transport pass, canonical descriptor and reuse identity, and four
owner modules. Spherical geometry supplies construction altitudes, directions,
CPU-derived support, source-path lengths, and radial coordinates. The
canonical atmosphere supplies its existing extinction and trapezoidal
source-path transmittance semantics through a stable altitude-along-ray
expression that avoids Earth-radius cancellation. The
existing distant Sun supplies its native-15 surface radiance. The cache owner
supplies only layout and source-path interval controls. No scattering order,
recurrence, phase evaluation, ground reflection, or cumulative binding enters
the assembled shader.

The neutral proof executes 15 wavelength layers, retains an 8,580-byte field,
publishes only `cache.celestial.sunTransport`, preserves bounded probes, and
disposes staging and result resources exactly once. Type checking, three
focused builder specs, and the complete 508-spec Node lane pass. The real
WebGL proof passes all 75 selected scalars with maximum absolute residual
`0.004548792177956784`, maximum relative residual
`0.0000037320928251543077`, and maximum normalized residual
`0.026760043316666437`. The complete Three/WebGL lane passes 9/9, including
the existing distant- and local-Sun cache gates. Step 5.4 is complete; the
dedicated controller and resource lifecycle are completed below.

## Resource And Controller Lifecycle Completed In Step 5.5

`DistantSunCelestialCacheResource` takes ownership only after the one-field
artifact is complete. It publishes the source, descriptor, SHA-256 plan
identity, sole opaque runtime binding, bounded probe adaptation, and the
cache-owned half of two-by-two stencil lookup. It introduces no live disk
consumer and releases its artifact exactly once without disposing the external
backend.

`DistantSunCelestialCacheController` owns serialized generation state over the
stateless builder. New requests cancel and supersede older work, exact plan
identity reuses the active resource without another GPU execution, failed or
cancelled staging cannot publish, allocation failure preserves the last valid
resource, and successful replacement disposes the predecessor only after the
successor is complete. Six focused lifecycle proofs, type checking, all 514
Node specs, and all 9 real Three/WebGL specs pass.

## ShaderBuilder Integration Completed In Step 5.6

Configured spherical builds now derive celestial placements and the immutable
query packet from `model.profile.models.sourcePlacement.observation`. The
distant-Sun controller is reused only when source, geometry, atmosphere,
backend, and scheduler owners are all identical; otherwise the existing Sun
creates a dedicated controller. Its resource is built beside the unchanged
scattering resource.

Spherical geometry owns the `CelestialCacheBilinearStencil` shader type and the
cache resource owns the two-by-two field lookup. Assembly includes both only
for an enabled distant-Sun resource. The existing runtime installer combines
the celestial and scattering opaque bindings into one backend installation.
The null-roster path retains the exact prior shader source and publishes no
celestial controller, resource, identity, contribution, or binding. No live
Sun raster has been added.

Focused proofs cover geometry stencil publication, configured placement/query
derivation, controller construction and exact reuse, contribution assembly,
combined binding installation, and cleanup of both newly created controllers
when celestial construction fails. Type checking, the complete Node lane, and
all 9 real Three/WebGL specs pass.

## Replacement And Failure Matrix Completed In Step 5.7

The production integration matrix now proves both replacement classes. A
changed geometry/query owner replaces only the celestial controller while the
scattering controller is reused. A changed shared Sun owner deliberately
replaces both source-owned controllers. Neither build operation disposes the
previous controllers before a handle commits the completed successor.

Failed celestial construction and failed combined binding installation dispose
only newly created successor controllers and resources. The previously
installed runtime, celestial controller, and scattering controller remain
live. Concurrent handle replacement retires a completed-but-superseded runtime
and its distinct controllers while preserving any controller retained by the
current build. Existing controller proofs continue to cover allocation
failure, last-valid preservation, generation cancellation, complete-only
publication, exact plan reuse, and idempotent disposal.

The real Three/WebGL proof constructs two physical celestial fields with
different numerical identities, replaces the opaque
`cache.celestial.sunTransport` binding with a distinct resident texture, and
then verifies retired and final resource liveness boundaries independently.
The expanded focused matrix and complete suite exposed no production lifecycle
defect, so Step 5.7 changed proof coverage rather than cache or scattering
behavior. Type checking, all 522 Node specs, and all 10 Three/WebGL specs pass.

## Step 5 Closure Completed In Step 5.8

The closure reran type checking, all 522 Node specs, touched-scope formatting
and diff integrity, and all 10 real Three/WebGL specs. Every gate passed.

The fresh complete 17-condition production GPU B1 regeneration ran on the
NVIDIA GeForce RTX 2060 and completed in 90.395 seconds of recorded generation
time. The resulting TSV is byte-for-byte identical to the accepted Step 4
baseline and retains SHA-256
`d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`.
All 17 per-time RMSE rows compare exactly, aggregate RMSE remains `11.820392`
mW, and classification remains favorable.

The completed manifest, report, table, provenance, cube, and six figures are
retained under
`tmp/extraterrestrial/production-integration/000003-step-05-b1-closure/b1-directional-sky-radiance/gpu/b1-directional-sky-radiance/gpu/`.
The result resolver appended its standard experiment/backend suffix to the
supplied parent; the completed evidence remains preserved at that exact path.
Step 5 is complete. Step 6 live distant-Sun composition has since completed;
current work is owned by the active topic and production integration plan.

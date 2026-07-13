# Step 4 Source And Geometry Reconciliation

Status: Step 4.1 complete on 2026-08-11. This document is the canonical
port/adapt/reject/defer ledger for production-integration Step 4. It maps the
qualified extraterrestrial candidate behavior to the production contracts and
owners selected by the
[Production API and Ownership Contract](production-api-ownership-contract.md).

## Scope And Result

Step 4.1 inspected the qualified candidate and current production read-only.
It changed no production implementation. The mapping is complete and leaves
no unresolved ownership choice before Step 4.2.

The candidate is behavioral evidence, not a source-layout authority. Its
generic `caches/celestial/` technical layer, custom record names, default
exports, inline validation/hash helpers, recursive `Object.freeze()` policy,
aggregate controller, and renderer-facing conveniences are not copied into
production. Accepted formulas and invariants are adapted to the current
feature-owned tree, ambient contracts, ingress-validation policy, canonical
identity owner, and current spherical ground/contact behavior.

## Evidence Boundary

The selected evidence is:

- G1 run `000008-g1-geometry-transform-proof`, subsequently boundary-stencil
  requalified by run `000022`: named-frame transformation, geographic receiver
  mapping, the `(h, u)` reduction, horizon classification, full/partial/empty
  uniform-disk support, and deterministic query identity;
- G4 run `000024-g4-cpu-sun-disk-transport-proof`: surface radiance derived
  from the configured distant Sun's irradiance and apparent solid angle,
  geometry-owned paths, exact-zero unsupported samples, and shared Sun
  authority;
- run `000109-pre-g9-bright-star-catalog-contract-proof`: the checked BSC V/50
  source checksum, 9,096 valid parsed records, and the deterministic first 500
  valid members ordered by ascending V magnitude and ascending HR tie-break;
- run `000112-pre-g9-stellar-celestial-source-proof`: the placement-only
  catalog source boundary and stable 500-member identity;
- runs `000163-stellar-photometry-b-band-reconstruction-experiment` and
  `000164-pre-g9-stellar-photometry-proof`: the superseding bracketed B/V
  native-15 packet construction and bounded provenance; and
- the current production reflected-68 atmospheric algorithm and its completed
  Step 3.7 non-regression gates.

Later accepted cache, lifecycle, and raster runs remain evidence for Steps 5
through 7. They do not expand Step 4 into cache construction or rendering.
Retired Star material is neither an input nor a gate.

## Cross-Cutting Adaptation Rules

1. Production uses the exact public discriminators and field names already
   declared in `interfaces/celestial-source/types.d.ts`: `id`,
   `distant-uniform-sun`, `static-stellar-point-set`, `directionToSource`, and
   ISO-UTC `CelestialEpoch`. Candidate `sourceId`, `uniform-disk`,
   `catalog-point-set`, `point`, `extended`, and Unix-seconds record shapes are
   not compatibility aliases.
2. Production identity is derived through the current canonical value-identity
   owner. Candidate-local FNV-1a implementations and descriptor fingerprints
   are not ported. Required SHA-256 catalog and selection facts are pinned from
   reviewed source inputs; ignored generated run evidence is never a runtime
   input.
3. Production declarations express readonly intent. Candidate recursive
   `Object.freeze()` calls are not adopted as an immutability mechanism.
4. Runtime validation remains at real ingress. Candidate internal shape checks
   are retained only when they enforce physical bounds, scientific-input
   identity, family compatibility, or lifecycle state that static typing
   cannot prove.
5. Spherical implementation uses the current Z-up model frame, exact 0 m first
   altitude node, current `SphericalEarthGeometry` boundary calculations, and
   CPU-derived ground/contact classification. Candidate `_topAtmospherePath()`,
   `_muHorizon()`, and observation normalization are not copied as parallel
   geometry mathematics.
6. Step 4 constructs no celestial GPU field, controller, runtime binding,
   shader cache sampler, or visible raster. Those are owned by later steps.

## Source Ledger

| Candidate input                                                                       | Disposition                                                        | Production owner and substep                                              | Required adaptation                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DistantSunCelestialSource` class                                                     | Reject the parallel class; port its accepted source semantics      | Existing `implementation/distant-sun/DistantSunLightSource.js`, 4.3       | Add the declared celestial capability to the existing atmospheric Sun. Preserve its existing `id`, irradiance, angular radius, and geometry-resolved direction.                                                                                                                             |
| Distant-Sun irradiance divided by `2π(1-cos(radius))`                                 | Adapt                                                              | `DistantSunLightSource` definition construction, 4.3                      | Produce the declared `SpectralRadiancePacket` once from the existing apparent irradiance and uniform-disk support. No second radiometry owner or inverse-square term.                                                                                                                       |
| `describeStaticIdentity()`                                                            | Adapt and rename                                                   | `describeCelestialSourceIdentity()`, 4.2/4.3                              | Return `CelestialSourceIdentity` using production kinds and canonical definition identity. Do not retain the candidate descriptor shape.                                                                                                                                                    |
| `buildCacheFragments()`                                                               | Adapt to the typed logical fragment seam                           | `createCelestialCacheFragment()`, 4.2/4.3                                 | Return only the distant-Sun logical fragment facts declared in production. Do not include packing, anchors, texture dimensions, or copied spectral arrays.                                                                                                                                  |
| `createCacheBuildModule()`                                                            | Defer                                                              | Distant-Sun celestial cache implementation, Step 5                        | The shader module and direct-transport execution are cache behavior, not a Step 4 source boundary.                                                                                                                                                                                          |
| `BRIGHT_STAR_CATALOG_V50`, parser, coordinate conversion, and brightest-500 selection | Adapt after source/provenance review                               | Private closure under `implementation/star-field/`, 4.4                   | Retain source SHA-256 `d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759`, J2000 coordinate meaning, ascending-Vmag/HR selection, exact 500 count, and canonical `celestial-rh-v1` directions. Remove experimental runner and relative-V-flux output from runtime contracts. |
| `StellarCelestialSource`                                                              | Adapt, do not copy                                                 | Standard stellar capability class under `implementation/star-field/`, 4.4 | Implement `StellarPointSetCelestialSource` and the internal provider contract with one point-set definition containing 500 ordered members. Do not expose 500 unrelated public sources.                                                                                                     |
| Candidate catalog identity and `catalogFingerprint`                                   | Adapt                                                              | Stellar definition/identity support, 4.4                                  | Supply production `catalogVersion`, `catalogSha256`, `selectionId`, and canonical ordered-selection SHA-256. Do not substitute the candidate FNV fingerprint for either SHA-256 field.                                                                                                      |
| `describeCanonicalPointDirections()` and canonical latitude/longitude conversion      | Port semantics                                                     | Stellar source private support, 4.4                                       | Retain receiver-to-source unit directions in `celestial-rh-v1` and canonical selection order.                                                                                                                                                                                               |
| `describePointSourceDefinitions()` and 500 per-member definitions                     | Reshape                                                            | One `StellarPointSetSourceDefinition`, 4.4                                | Each member becomes a `StellarSourceMemberDefinition`; provider-contract fingerprints and candidate point/extended discriminators disappear.                                                                                                                                                |
| `createPointPlacementStates()` with Unix-seconds epoch                                | Reshape and bound                                                  | Stellar placement state plus spherical geometry mediation, 4.4/4.5        | Production accepts ISO-UTC construction state. Step 4 retains canonical static member directions; live Earth rotation and in-place refresh remain deferred.                                                                                                                                 |
| `StellarSpectralPhotometry` bracketed B/V policy                                      | Adapt behind the stellar feature                                   | Feature-private stellar photometry support, 4.4                           | Pin the reviewed BSC, Pickles, Johnson B/V, Vega, policy, and basis identities. Materialize exactly 500 finite nonnegative native-15 apparent irradiance packets. V magnitude and B-V are acquisition inputs, never runtime radiometry.                                                     |
| Candidate Pickles/filter loaders and checked inputs                                   | Re-home only reviewed scientific inputs and required adapter logic | `implementation/star-field/` private closure, 4.4                         | No runner, immutable run artifact, temporary materialization, or ignored generated packet file becomes production input.                                                                                                                                                                    |
| `CelestialRuntimeParticipant` source aggregation                                      | Reject                                                             | Existing profile roster, `SharedModel`, and Algorithm32 mediation         | Production already has the selected roster/model boundary. No parallel participant or factory is introduced.                                                                                                                                                                                |

## Geometry Ledger

| Candidate input                                                           | Disposition                                                           | Production owner and substep                                                            | Required adaptation                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SphericalCelestialContributionDomain` class                              | Adapt into a feature-private collaborator                             | `implementation/spherical-earth/celestial/SphericalCelestialContributionDomain.js`, 4.5 | The current `SphericalEarthGeometry` implements `CelestialGeometryCapability` and delegates cohesive celestial-domain operations. The collaborator neither creates controllers nor owns runtime resources.                                                         |
| `describe()` and `(h,u)` domain                                           | Adapt                                                                 | `describeCelestialContributionDomain()`, 4.5                                            | Emit the production `CelestialContributionDomainDescription`, unit-bearing altitude nodes beginning at exact 0 m, normalized direction coordinates, family, and canonical content identity.                                                                        |
| `resolveCelestialSourcePlacement()`                                       | Reshape from candidate per-member records                             | `resolveCelestialPlacements()`, 4.5                                                     | Consume the accepted roster and `GeometryObservation`, preserve roster order, return one distant-Sun placement and one optional 500-direction stellar point-set placement. Reuse the current atmospheric Sun placement rather than independently recalculating it. |
| Candidate celestial/body/model matrix chain                               | Adapt                                                                 | Spherical celestial collaborator, 4.5                                                   | Preserve named-frame direction semantics while using the current Z-up spherical model. Step 4's stellar placement is the selected canonical static epoch; live `Rz(-thetaEarth)` animation remains deferred.                                                       |
| `_normalizeObservation()` and manual geographic receiver projection       | Reject as parallel math                                               | Existing geometry observation and coordinate owners, 4.5                                | Use normalized `GeometryObservation`, current unit helpers, current configured receiver state, and current scene/model frames.                                                                                                                                     |
| `_muHorizon()` and `diskFraction()` support classification                | Port the accepted support behavior through current boundary authority | Spherical celestial collaborator, 4.5                                                   | Full, partial, empty, ground-horizon, and out-of-domain results must agree with current geometry contact classification; unsupported contributions are exact zero.                                                                                                 |
| `_topAtmospherePath()`                                                    | Reject as a duplicate path implementation                             | Current `SphericalEarthGeometry.resolveAtmospherePath()`, 4.5                           | `CelestialBuildSample.sourcePath` must use the current geometry-owned atmosphere path and sampling policy. Refine the Step 3 declaration from the too-narrow `RaySegment` if the actual returned contract is `AtmospherePath`; do not fork path equations.         |
| `resolveCelestialBuildSample()`                                           | Adapt                                                                 | `createCelestialBuildSample()`, 4.5                                                     | Use production request/index contracts, unit-bearing receiver position and atmosphere coordinate, current source path, placement identity, and an explicit supported flag.                                                                                         |
| `resolveCelestialReceiverStencil()`                                       | Adapt                                                                 | Feature-private stencil method and `CelestialReceiverStencil`, 4.6                      | Preserve bounded linear altitude reconstruction and exact/out-of-domain classification using production's fixed typed stencil representation.                                                                                                                      |
| `resolveCelestialDirectionStencil()`                                      | Adapt                                                                 | Feature-private stencil method and `CelestialDirectionStencil`, 4.6                     | Preserve horizon-normalized `u`, bounded linear reconstruction, and exact-zero invalid support using current contact classification.                                                                                                                               |
| `prepareCelestialContributionQuery()`                                     | Reshape                                                               | `createCelestialQueryPacket()`, 4.7                                                     | Build one immutable family packet from production roster-order placements and selected stencils. Identity is derived directly from executable query facts, not candidate generation IDs or runtime-compatibility descriptors.                                      |
| Candidate `layerQueries`, `receiverStencilState`, and per-member stencils | Adapt into named production query facts                               | Geometry support declarations and spherical collaborator, 4.6/4.7                       | The current Step 3 `CelestialQueryPacket` is intentionally minimal and must be refined with exact family-specific query fields before implementation. Do not retain an arbitrary record.                                                                           |
| `createCelestialContributionCacheController()`                            | Reject from geometry and defer behavior                               | Separate source-family controllers, Steps 5 and 7                                       | Geometry never constructs an aggregate cache controller.                                                                                                                                                                                                           |

## Explicitly Deferred Or Rejected Candidate Files

| Candidate file or family                                                                                                                                                      | Result                                                 | Later owner                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `CelestialContributionCacheController.js`                                                                                                                                     | Reject aggregate controller architecture               | Separate distant-Sun, stellar, and Flat controllers              |
| `CelestialFrameEvaluator.js`                                                                                                                                                  | Reject qualification-only sidecar evaluator            | No production owner                                              |
| `PrimaryCelestialCache.js`, `PrimaryCelestialGpuCache.js`, `PrimaryCelestialGpuPlan.js`, `PrimaryCelestialR32FRepresentation.js`, and `PrimaryCelestialGpuCacheController.js` | Defer semantics; reject generic aggregate names/shapes | Distant-Sun Step 5, neutral executor only where already selected |
| `CpuSunDiskRadianceCache.js`                                                                                                                                                  | Defer accepted transport behavior                      | Distant-Sun Step 5                                               |
| `CpuStarPointSetCache.js`, `TiledStarPointSetCache.js`, `StellarPointSetGpuCache.js`, and their controllers                                                                   | Defer accepted transport/packing behavior              | Stellar Step 7                                                   |
| Live stellar raster, camera footprint, scene visibility, and off-frame behavior                                                                                               | Defer                                                  | Step 7                                                           |
| `FiniteLocalSunCelestialSource.js` and all `FlatFiniteSun*` cache files                                                                                                       | Defer                                                  | Mandatory Flat/local Step 9                                      |
| Candidate Flat geometry celestial methods                                                                                                                                     | Defer                                                  | Step 9                                                           |
| Live Earth rotation, in-place placement refresh, and cache transform                                                                                                          | Defer                                                  | Mandatory Stage 14 MVP design                                    |
| HDR sky meter/adaptation, Moon, opacity/order, profiled disks, and catalog expansion                                                                                          | Reject from first promotion                            | Separate future designs                                          |

## Contract Refinements Scheduled By This Ledger

Step 4 implementation must refine, not bypass, three Step 3 declaration seams:

1. `CelestialSourcePlacementState` needs family-specific point-set and
   observation-derived distant-Sun forms; the candidate's one-direction form
   cannot represent one 500-member source without breaking the selected public
   source boundary.
2. `CelestialBuildSample.sourcePath` must name the existing geometry-owned
   atmosphere-path contract used for direct transport rather than introduce a
   parallel candidate path record.
3. `CelestialQueryPacket` must become an exact family-discriminated immutable
   packet containing the selected receiver/direction stencil facts. It may not
   become `Record<string, unknown>` or reproduce candidate generation/runtime
   descriptor fields.

These are semantic narrowings discovered by mapping concrete qualified
behavior onto the Step 3 seams. They do not change the current atmospheric
algorithm or its null-roster path.

## Step 4 Routing

- 4.2 owns shared identity/placement/fragment contract refinements and common
  source support.
- 4.3 owns the additive distant-Sun capability on the existing light source.
- 4.4 owns the reviewed stellar source, scientific-input closure, and 500
  native-15 member definitions.
- 4.5 owns spherical placement, support, and build samples using current
  production geometry.
- 4.6 owns typed receiver/direction stencil construction.
- 4.7 owns the exact immutable query packet and identity behavior.
- 4.8 owns all production closure gates and the full 17-condition GPU B1
  non-regression comparison.

Source and geometry groups 4.2 through 4.7 are complete. The implemented
spherical boundary follows this ledger: current production geometry owns the
retained frame, observation, atmosphere path, and contact classification; the
feature-private collaborator owns only the celestial domain, support,
stencils, and deterministic query packet. No celestial cache or runtime
resource was introduced. Step 4.8 is complete: type checking, 500 Node specs,
17 B1/profile contract tests, and 8 real Three/WebGL specs pass. The complete
GPU B1 boundary exactly retains table SHA-256
`d366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f`
and aggregate RMSE `11.820392` mW. Step 4 is closed.

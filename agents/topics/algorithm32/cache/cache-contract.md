# Selected Scattering Cache Contract

Status: implemented physical and numerical authority for the spherical
distant-source cache, current through PA7 owner selection, deployment catalog,
and obsolete receiver-column GPU-runtime cleanup. Final PA7 release closure is
still gated by one exact-asset migration in the broad WebGL test lane.

## Scope And Ownership

This document owns the selected cache's field meanings, recurrence and order
policy, frozen construction domains, physical ownership boundaries, ground
participation, invalidation semantics, runtime calculation, and required
evidence categories.

Focused documents own the details below this umbrella contract:

- [Distant-Sun solar-zenith cache design](solar-zenith-cache-design.md)
  owns the selected successor's point-local cumulative-density coordinates,
  one-cache-per-scene contract, Native15 representation, resource study, and
  replacement evidence and implemented production representation.
- [Distant-Sun point-local solar-zenith cache plan](distant-sun-solar-zenith-cache-plan.md)
  records the contained execution order and evidence gates. Its numbered
  execution is complete through P10; it selects no local-Sun layout and
  changes no local-Sun cache layout. The separate production-adoption topic is
  complete through PA6: its pairing-neutral physical sample seam, Z180 and
  exact-W27 domains, distant-specific ledger/manifest contracts, and offline
  compiler are implemented together with exact manifest-backed loading,
  immutable resident upload, point-local lookup, exact source placement, and
  quadratic-near-observer Q30 live transport are implemented.
- [Spatial reconstruction](spatial-reconstruction.md) owns the exact
  final-view position stencil, its evidence, and its CPU/shader completion
  requirements.
- [Outgoing reconstruction](outgoing-reconstruction.md) owns the exact W27
  direction reconstruction, selection evidence, and claim boundary.
- [Cache interface design](cache-design.md) owns JavaScript and ambient type
  surfaces, concrete class roles, plan and pass records, assembly, backend and
  executor APIs, controller mechanics, and the software realization of
  resource lifecycle.
- The [production implementation plan](../production/production-implementation-plan.md)
  owns delivery sequence and implementation status.

This document therefore does not define method names, capability interfaces,
class names, build-artifact shapes, renderer handles, or exact reconstruction
evidence. It also does not own external benchmark classification, ground BRDF
details, or future flat/local coordinate systems.

This contract selects the spherical distant-Sun cache. Its concrete
implementation is source-specific. The shared cache boundary is a logical
consumer contract, not a universal concrete cache class or packing scheme;
its capability split and methods are defined only in
[cache-design.md](cache-design.md#public-cache-capabilities). The implemented
local Sun owns a distinct concrete cache, layout, primary field, and lifecycle.
It consumes a compatible geometry-owned physical position domain and source-
relative mapping while reusing the compatible pure-order recurrence operations
defined here. A later successor may revisit that shape only through a
separately owned local design; the distant-Sun research plan does not change it
by implication.

Plain `Algorithm32` means `maximumScatteringOrder = 4`. The supported
first-release requested maxima are 1, 2, and 4. A non-default request causes a
complete cache rebuild and must be named explicitly when reporting results.
N=1 publishes first-order scattering only; N=2 publishes cumulative first-
plus second-order scattering; and N=4 publishes `J1 + J2 + J3 + J4`. Pure J3
is an internal dependency of N=4, not a standalone requested configuration.

## Stored Quantity And Recurrence

Let `Jk` be pure local spectral scattering density at order `k`, and let `Lk`
be the corresponding pure directional spectral radiance after atmospheric
transport. Construction is:

```text
J1 = primaryScatteringDensity(lightSource, atmosphere)
JthroughN = J1

if N >= 2:
  L1 = primaryTransportedRadiance(lightSource, atmosphere)

for k = 2 through N:
  Jk = scatter(L(k - 1))
  JthroughN += Jk
  if k < N:
    Lk = transport(Jk)
```

The historical pre-retirement Algorithm32-Star comparison implementation
constructed `J1` and `L1` as separate source-specific primary fields. Its
direct `L1` integrated continuous primary scattering along each Fibonacci-34
ray; generic stored-field `Jk -> Lk` transport started at `J2 -> L2`.
Production retains that field and recurrence behavior, but the retired
implementation is neither current authority nor a runtime input. Transporting
stored W27 `J1` is a diagnostic, not a production substitute for the direct
primary seed. Only the preceding pure order may feed the next order. Feeding a
cumulative field back into the recurrence double-counts lower-order paths and
is invalid. Scattering order is a construction iteration, not a retained
runtime axis.

The historical pre-retirement parity manifest formerly at
`../../../../src/algorithm32/light-sources/fixtures/algorithm32-star-legacy-l1-parity.json`
recorded the decisive comparison over 1,530 preserved values. Direct-primary
`L1` was within `6.591949208711867e-17` maximum absolute error. Transport of
stored W27/native-48 `J1` reached `0.027786648426056437` maximum absolute and
`0.4877257920870377` maximum relative error. That diagnostic was materially
outside parity and must not be promoted as an alternate L1 strategy. The
retired manifest is not a current production fixture, regression oracle,
authority, or runtime input.

The runtime cache stores camera-independent, point-local, scene-Sun-specific
cumulative local spectral scattering density:

```text
JthroughN(position, outgoingDirection, wavelength)
  = J1 + J2 + ... + JN
```

Camera state, object identity, object depth, display state, and post-exit
extraterrestrial sources are not cache axes.

## Current Working Domains

| Field concern              | Selected contract                                                       |
| -------------------------- | ----------------------------------------------------------------------- |
| Spectral basis             | 15 scalar spectral channels                                             |
| Position domain            | Ordered Native48 altitudes, including exact 0 m boundary node           |
| Incoming radiance          | Reflection-completed ordinary Fibonacci-68 quadrature and weights       |
| Outgoing density           | Source-aligned W27 cubed sphere with 4,374 stored directions            |
| Construction transport     | Production 15-interval control and retained construction lookup         |
| Final view position lookup | Exact rule owned by [spatial reconstruction](spatial-reconstruction.md) |
| Default cumulative order   | `J1 + J2 + J3 + J4`                                                     |

The frozen first-release comparison used a `2 m` boundary node and ordinary
Fibonacci-34 incoming quadrature. Those reduced domains, including the
[Star parity data set](../production/star-parity-data-set.md), remain
historical evidence only. They do not replace the current Native48/Fibonacci-
68/W27 working contract in this table.

Incoming quadrature and outgoing reconstruction perform different numerical
jobs. A physical direction index in one domain is never an identity in
another. The builder must support different and independently permuted `L`
and `J` executable direction domains.

## Ownership Boundary

| Owner                           | Responsibility                                                                                                                                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atmosphere                      | Medium profiles, spectral coefficients, phase functions, optical depth, and transmittance                                                                                                                                                 |
| Geometry                        | Physical nodes, node-to-position reconstruction, construction rays, boundary segments, source-relative frames, and world-position-to-position-stencil mapping                                                                             |
| Position-domain implementation  | Direct domain identity, executable readonly physical node table, and mapping/interpolation operations                                                                                                                                     |
| Direction-domain implementation | Direct domain identity, executable unit-vector/weight tables, frame transforms, topology, and reconstruction operations                                                                                                                   |
| Atmospheric light source        | Source-specific primary fields, executable domain selection, packing and storage facts, cache reuse-key policy, invalidation authority, and source-owned lifecycle; it creates the per-runtime controller defined by the interface design |
| Generic order builder           | Source-independent pure `L(k-1) -> Jk` scattering and optional `Jk -> Lk` transport                                                                                                                                                       |
| Shared cache boundary           | Completed cumulative-cache behavior and source-owned lifetime consumed by Algorithm32; the CPU/GPU capability split and exact methods belong to the interface design                                                                      |
| Concrete distant-Sun cache      | Direct field identity and physical provenance where sampled, resident resources, packing, and reconstruction using geometry- and direction-domain-owned rules                                                                             |
| Algorithm32                     | View traversal, view transmittance, cache queries, path quadrature, and spectral accumulation                                                                                                                                             |

Geometry never reads field resources. The cache never derives physical
altitude or weights from texture dimensions. The generic order builder has no
light-source, camera, object, renderer-material, RGB, or display dependency.
Sharing the order builder does not make distant-Sun and local-Sun caches the
same concrete type.

Throughout this contract, immutable describes a readonly public contract, not
runtime freezing. Cache implementations follow the repository
[Type Conventions](../../standards/types.md)
and do not use `Object.freeze` to enforce that contract.

Public cache requests validate only their externally supplied semantic values
and ranges. Builders, storage, packing, assemblers, backends, and samplers
trust the ambient/JSDoc contracts, accepted API values, internally constructed
records, and repository constants, as required by the repository
[validation convention](../../standards/code-conventions.md#validation).

## Direct Domain, Field, And Storage Contracts

Domain behavior stays on the executable position- and direction-domain
owners. Their direct IDs identify the selected domains where plans or reuse
comparisons need that fact; their node tables, vectors, weights, frames,
topology, and stencil operations remain the values that execute the
calculation. No copied domain snapshot is a parallel contract.

CPU directional fields expose their direct field ID, cumulative or pure
order, packing owner, and physical provenance identity where sampling needs
it. GPU plans request allocation with direct `CacheFieldSpec` values containing
the field ID and `CacheFieldStorage`. Packing owners calculate CPU addressing;
the GPU backend consumes storage width, height, layers, and format. Neither
path requires a second layout or field record.

The source-owned `CacheBuildPlan` contains direct field specifications,
passes, the selected result field ID, and a deterministic plan identity. A
successful GPU build returns its resident result, opaque runtime bindings,
diagnostics, and lifecycle operation directly. CPU builds return their sealed
fields and construction options directly. Consumers receive those executable
providers or build results rather than a second declaration of completed
cache parts.

Controller reuse compares a deterministic reuse key derived from the direct
plan identity and accepted backend capabilities. The plan identity includes
the selected domain IDs, ground-boundary selection, executable field storage,
passes, owner modules, and their binding values. Each participating owner
therefore supplies the fact once at its executable boundary; no public owner
snapshot or copied construction-identity packet is retained.

The precise descriptor-retirement and assembly-declaration boundary is owned
by [reconciliation Step 2.9](../archive/reconciliation-2026-08-04/algorithm32/reconciliation-plan.md#29-retire-descriptors-and-justify-assembly-declarations).
`ShaderContribution` and `CacheBuildModule` remain direct provider
declarations because their assemblers consume their exports and requirements.
This cache contract adds no nested declaration around either one.

## GPU Numerical Construction Contract

The atmospheric light source owns production GPU-cache construction through
the source-created per-runtime controller defined by the interface design.
The first selected scalar layout is an `R32F` array texture with cache-local
direction on `x`, position-node index on `y`, and one wavelength per array
layer. Texture channels are scalar storage lanes, never RGB semantics. A
conforming physical packing may differ only when the concrete cache implements
the selected executable mapping exactly and parity tests prove the resulting
logical position/direction/wavelength values.

GPU construction must realize the recurrence in
[Stored Quantity And Recurrence](#stored-quantity-and-recurrence) exactly.
Source-specific construction produces primary `J1` and, when required,
direct-primary `L1`. Generic scattering consumes only the preceding pure
`L(k-1)`, generic stored-field transport produces `Lk` only when a later order
needs it, and cumulative addition never feeds recurrence. Storage-specific
accumulation operations do not create new scattering orders. The concrete
software plan and pass representation belong to
[cache-design.md](cache-design.md#plan-conformance-to-the-numerical-contract).

The implemented source-owned plans realize these exact ordered field graphs:

| Request | Ordered produced fields                                       |
| ------- | ------------------------------------------------------------- |
| N1      | `J1, Jthrough1`                                               |
| N2      | `J1, L1, J2, Jthrough2`                                       |
| N4      | `J1, L1, J2, Jthrough2, L2, J3, Jthrough3, L3, J4, Jthrough4` |

N1 constructs no `L1`, N2 constructs no `L2`, and N4 constructs no `L4`.
For N4, spherical geometry packs the selected atmosphere-dependent
construction transport once using the production 15-interval control. The
generic transport operation reuses that same packed logical dataset for
`J2 -> L2` and `J3 -> L3`; it does not independently reconstruct path or
interpolation rules for either order. Exact pass ids, owner modules, resource
bindings, and last-consumer lifetimes are owned by the
[cache interface design](cache-design.md#plan-conformance-to-the-numerical-contract).

The historical project-lifetime Star parity artifact was captured with 40
construction intervals. Its retired offline comparison used an explicit
comparison-only construction control to reproduce that frozen input. The
production value remains 15. Neither the artifact nor its comparison control
is current authority, an executable conformance input, or part of
controller/runtime publication.

Wavelengths are independent storage layers scheduled by the executor;
positions and outgoing directions are parallel work within each layer. Each
scatter evaluation loops over the declared incoming directions and weights.
Normal construction performs no full CPU readback. Selected-value readback is
a parity/diagnostic-only probe seam.

Every successful construction artifact must report exact logical payloads as
unit-bearing byte values: peak live R32F field storage, peak packed data bound
by a pass, the peak tracked sum of those categories, and resident cumulative
result-field storage. These diagnostics include the allocate-before-release
transition required by the pass graph. They exclude renderer/driver
allocation, alignment, programs, framebuffers, and implementation
temporaries; the exact definitions belong to the
[GPU executor design](cache-design.md#gpu-executor).

Only a complete requested cumulative field may become active. Failure,
cancellation, or supersession must leave the previously active cache usable
and release abandoned staging resources. Construction may be staged across
frames to meet an explicitly measured responsiveness budget. The controller,
executor, artifact, and resource mechanics that realize those guarantees are
owned by [cache-design.md](cache-design.md#lifecycle-and-publication).

## Predeclared GPU Parity Policy

The
[production GPU cache parity policy](../../../../src/algorithm32/implementation/distant-sun/cache/fixtures/gpu-cache-parity-policy.json)
was checked into the repository before production R32F output was compared.
It compares selected GPU scalars with the production binary64 CPU oracle using

```text
allowed error = absolute bound + relative bound * abs(oracle)
```

| Field family                  | Absolute bound | Relative bound |
| ----------------------------- | -------------: | -------------: |
| Pure radiance                 |         `2e-9` |        `0.005` |
| Pure scattering density       |        `2e-12` |        `0.005` |
| Cumulative scattering density |        `8e-12` |        `0.005` |
| Exact copy                    |            `0` |            `0` |

The checked fixture fixes all 15 wavelength indices plus five W27
scattering-density and five Fibonacci-34 radiance logical queries. These
bounds are now the selected implementation-conformance policy; they are not a
claim of physical accuracy and must not be adjusted after seeing production
GPU output. The accepted real-browser run passed the policy unchanged.
The five Fibonacci-34 coordinates remain a frozen first-release evidence
surface, not an inventory of the current reflection-completed Fibonacci-68
domain.

## Ground Participation

The [ground-boundary topic](../ground/README.md) owns the selected reflection
algorithm, typed contract, current status, and CPU-to-GPU handoff. From the
cache contract's perspective, ground is an optional direct construction
contributor; its owner ID participates in the plan reuse identity, while
omission remains the direct canonical-black selection. Geometry, boundary,
profile, and builder responsibilities remain separated, and no cumulative
field may enter recurrence through the ground path.

## Cache Identity And Invalidation

Rebuild the complete cache when transport-relevant source state, atmosphere,
physical geometry/mapping, ground boundary, maximum order, domain, numerical
control, spectral basis/unit, precision/layout, or schema changes.

Camera movement, static-object view shortening, renderer surface shadows,
post-exit extraterrestrial sources, and display conversion do not invalidate
this atmospheric cache.

## Runtime Contract

For every view-path sample, Algorithm32:

1. updates observer-to-sample spectral transmittance;
2. obtains the position stencil defined by
   [spatial reconstruction](spatial-reconstruction.md) and the direction
   stencil defined by
   [outgoing reconstruction](outgoing-reconstruction.md);
3. performs one logical cumulative-density cache query;
4. multiplies by transmittance and path measure; and
5. accumulates spectral path radiance.

The promoted runtime has no incident-direction loop and no independently
computed direct `J1` term outside the cumulative facade. Static objects only
shorten the visible ray and contribute through the separate endpoint
composition boundary.

## Required Completion Evidence

- CPU pure-order and cumulative identities for requested N=1, N=2, and N=4,
  with N=4 covering the required J3 traversal, plus a manufactured
  cumulative-feedback failure case. J3 does not require a separate requested
  acceptance case.
- Physical-query tests with unequal and permuted incoming/outgoing domains.
- GPU selected-value parity for every pass and all 15 channels against the
  binary64 CPU oracle under the
  [predeclared binary32 bounds](#predeclared-gpu-parity-policy), including
  exact N1 copy, shared N2/N4 values, cumulative pure-order sums, and both N4
  transport passes.
- The exact position-reconstruction evidence and CPU/shader cases required by
  [spatial reconstruction](spatial-reconstruction.md#production-completion-requirements).
- The exact direction-reconstruction evidence required by
  [outgoing reconstruction](outgoing-reconstruction.md#implementation-requirements).
- Lifecycle tests for reuse-key changes, failed rebuilds, atomic
  publication, supersession, and disposal.
- Measured production hardware precision, build/rebuild time, peak/resident
  memory, steady lookup/runtime cost, and responsiveness.

The CPU implementation is retained after promotion only as an independent
oracle and conformance surface. The GPU builder is the sole production cache
construction strategy.

The executable Stage 4.1, 4.2, and 5 owner programs and N1/N2/N4 staging
graphs are implemented and browser-output accepted. The accepted
software-renderer evidence covers exact N1 copy, bit-identical shared N2/N4
values, selected-only readback, result-only retention, cleanup, and
staging-resource lifecycle under the unchanged bounds. The
[baseline import status](../production/baseline-import-status.md) owns the
exact comparison counts, observed error, and artifact-memory results. Exact
literal pinning of the ordinary Fibonacci-34 parent data plus the deterministic
reflection-completion policy keeps the current Fibonacci-68 executable domain
and spectral-basis identities deterministic across Node and browser runtimes.
The parent's former Star-compatibility characterization is historical
pre-retirement evidence only, not current authority or runtime provenance.

Source-owned lifecycle, atomic publication, and the final-view CPU/GPU
cumulative lookup are implemented through the coupled Stage 6/7 cutover. One
source-created controller and one opaque GPU-cache binding are the production
path; no incident-cache or CPU-upload alternative remains. The accepted
software-renderer results are conformance evidence, not supported-hardware
performance evidence.

The asset-backed point-local successor now applies the same lifecycle contract
to complete offline cache packages. Generation-local cancellation and
supersession cannot poison later work; failed and oversized replacements leave
the active cache usable; successful candidates publish before their predecessor
is retired; and disposal is idempotent. A WebGL context loss is the one boundary
where old resident objects cannot remain usable: they are released while their
own context is lost, the exact asset selection remains retained, and a complete
replacement is loaded after restoration. The PA5 RTX 2060 proof records
`150,235,908` steady logical bytes, `300,471,816` atomic-transition bytes, and
`450,707,724` transition-plus-staging bytes with zero final WebGL errors.

The focused Stage 7 real-WebGL gate covers the predeclared position/direction
surface, compares cumulative CPU and GLSL traversal over the same manufactured
R32F field, and exercises public setup for N1, N2, and N4. That shared-field
oracle isolates final-view addressing and transport; it is not the required
release-grade binary64 resident-cache complete-ray fixture. The
[baseline import status](../production/baseline-import-status.md) owns exact
run results and the combined nine-spec browser-lane environment limitation.

## Remaining Numerical And Runtime Evidence

The current cache domains, order policy, and predeclared GPU scalar-error
bounds are selected, and measured browser construction conformance to those
bounds is closed through N4. Still open are supported-hardware
resource/performance budgets, expanded release-level complete-ray coverage,
pinned-source provenance, and citation hardening. Future geometries and
finite-local sources must define their own sufficient position/source mapping
without changing this spherical distant-source contract by implication.

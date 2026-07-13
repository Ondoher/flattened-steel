# Algorithm32 Flat Geometry And Local Sources

Status: complete and accepted production engine stage within the explicit
configuration, control, angular, browser-domain, and hardware claim boundaries
below. The promoted position domain is the scaled 19-by-15 profile; v5
verifies its production realization without reopening the frozen v4 selection.

This topic owns the final capabilities required for a complete Algorithm32
implementation: flat atmosphere geometry and a finite-distance local Sun that
participates in atmospheric scattering. The local Sun is the first required
finite local atmospheric source; generalized additional local sources are not
part of the completion requirement. This topic does not own visible
extraterrestrial boundary sources, the spherical/distant core, or the generic
cumulative recurrence.

The production architecture defines
[spherical/distant and flat/local](../production/architecture-boundaries.md#supported-geometry-and-source-pairings)
as the only supported geometry/source pairings for the current project. Flat
geometry and the local Sun retain independent contracts and owners, but this
topic does not build or validate flat/distant or spherical/local as production
configurations.

## Current Boundary

- Flat geometry implements the existing `GeometryModel` contract. It owns
  plane intersections, physical atmosphere coordinates, source-relative
  framing, ground hits, and cache position/direction stencils.
- The finite-distance local Sun implements the existing `LightSourceModel`
  cache-factory contract. It constructs its own concrete
  `LocalSunCache` and owns its primary scattering field,
  spatial/source mapping, physical domains, layout, transport-relevant
  plan and reuse identity, build lifecycle, and atomic cache publication.
- `ScatteringCache` is only the common Algorithm32-facing consumer contract.
  The local-Sun cache does not reuse the distant-Sun concrete cache type.
- The selected cumulative `J1 + ... + J4` recurrence remains generic and is
  reused without a local-source branch inside later-order scattering.
- `J2 -> L2` and `J3 -> L3` use the generic
  `IntegratedCacheTransport` contributor with Flat geometry-owned rays and
  stencils plus atmosphere-owned extinction. Production constructs and
  uploads zero packed Flat transport bytes. Fixed and indexed CPU builders
  remain diagnostic authorities only.
- The binary64 CPU implementation is the deterministic oracle for the selected
  production composition. R32F GPU construction and runtime integration use
  the same selected position and direction domains.
- Completion uses the shared source-controller, cache, binding, and view-
  sampling contracts. The `flat32` adapter now consumes both supported
  pairings through transactional application modes.

The former Algorithm32-star/Bruneton phase-integrated `J2` cache is abandoned.
Its provisional flat/local grids, 512-direction integration, and cache
quantity are not a production starting point. Only geometry and invariance
lessons that can be revalidated against the selected Algorithm32 contracts are
retained here.

The archived Algorithm32-Star tree implemented the selected
`FlatAtmosphereGeometry` and `LocalPointSun` physical primitives, but no
integrated flat/local N-order cache model. Its retained primitive and
primary-output evidence remains path-pinned or archive-indexed; it is not an
active implementation surface. Do not reopen Star or create a second Star
cache solely to serve as gold. The source/geometry composition exists once in
production, and any future evidence change uses a new isolated lane.
Cache-specific domains and tolerances were selected and measured as Stage 9
promotion work; they are not a whole-output Star-parity claim.

Current Flat/local transport acceptance uses the sealed production binary64
selected values and the immutable indexed-R32F pre-fusion snapshot, together
with analytic geometry/source invariants, the accepted generic recurrence,
real-WebGL execution, and lifecycle checks. Retired Star comparisons remain
historical evidence only and are not a current executable gate.

The selected production position domain scales 19 altitude fractions by the
configured atmosphere top and 15 radial fractions by the configured local
cache radial maximum. The 100 km/4.8 Mm diagnostic instantiation has 285
positions and passed v4's predeclared spatial and logical-resource gates. The
same fractions make other configured bounds executable but do not
convergence-qualify them. The
[promotion-work owner](unresolved-research.md) records the exact nodes,
metrics, artifact hashes, rejected v1-v3 studies, two failing 15-versus-60
control characterizations, W9 supporting failure, and W27 claim boundary.

The dedicated Karma/WebGL lane executes the current bounded
paired-plus-rotated-Fibonacci-68 manufactured transport graph and separately
executes the complete sealed z19/rho15/paired-Fibonacci-34/W27/native-15 N4
transport graph. The sealed graph compares 960 selected `L2` and 960 selected
`L3` values independently with both immutable authorities. The current
68-direction production graph is covered by its direction invariants, Flat32
execution, and the retained Flat180 visual correction. These are not
supported-hardware performance claims.

## Working Documents

- [Extension contract](extension-contract.md) owns selected responsibility and
  physical boundaries.
- [Promotion work](unresolved-research.md) owns the selected coordinates,
  rejected studies, numerical controls, source policies, exact evidence, and
  validation limits.
- [Promotion plan](promotion-plan.md) owns prerequisites and the CPU-first,
  GPU-second implementation sequence.
- [GPU transport offload plan](gpu-transport-offload-plan.md) owns the fused
  production correction, sealed selected authorities, and remaining
  qualification caveats.
- [Local-Sun whole-flat-world cache design](../cache/local-sun-cache-design.md)
  owns the separate, design-only scattering-aligned shell proposal.

The [production plan](../production/production-implementation-plan.md) owns
repository-wide delivery order. The [cache topic](../cache/README.md) owns the
selected spherical/distant numerical contract and generic recurrence. Visible
sources outside the atmosphere are owned by the
[extraterrestrial topic](../../extraterrestrial/README.md).

## Evidence Boundary

The archived flat/local harness demonstrated that readable CPU calculations,
scalar spectral GPU resources, source-relative mappings, and GPU-resident
construction are mechanically possible. It did not select production grids,
interpolation, convergence tolerances, or the abandoned `J2` cache. Current
production selections come from the v4 production-owner convergence study,
not that harness.

The source studies remain available in the
[topic-documentation archive](../../../../archives/topic-documentation-archive-2026-07-19.zip).
They are historical evidence, not current guidance or runtime dependencies.

## Explicit Exclusions

- Do not adopt the abandoned Bruneton `J2` cache, its 16-by-32 quadrature, or
  its provisional coordinate grids by inheritance.
- Do not add flat-only coordinates to the generic cache interface.
- Do not make reusable atmospheric caches observer- or camera-specific unless
  a physical observer-centered boundary is deliberately selected.
- Do not store spectral cache values as RGB/RGBA semantics.
- Do not treat renderer lights, material shadows, or object PBR as
  atmospheric light-source infrastructure.

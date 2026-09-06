# Flat Geometry And Local-Source Extension Contract

Focus: Physical transport, geometry, ground, and source placement.

Related owners: [caches](../caches/extension-contract.md).

## Flat Geometry Responsibilities

A flat implementation of
[`GeometryModel`](../../../../src/algorithm32/interfaces/geometry/types.d.ts) owns:

- the flat model-space frame, length units, ground plane, and top-atmosphere
  plane;
- atmosphere and ground intersections and the finite segment of every view,
  source, and cache-build ray that lies inside the medium;
- altitude and any additional physical coordinates required by the selected
  cache domain;
- source-relative position and direction frames;
- reconstruction of physical positions into cache-node stencils; and
- ground-hit position and outward normal, while the `GroundBoundary` owns
  reflection.

The atmosphere remains responsible for profiles, coefficients, phase
functions, optical depth, and transmittance. A cache consumes
geometry-resolved stencils; it must not infer altitude or other physical
coordinates from a packed GPU layout.

The production flat atmosphere is horizontally uniform and vertically
stratified between configured ground and top planes. Its selected scaled
`z`/`rho` coordinates and clamped bilinear reduction are justified for the
configured finite local source by v4 selection and v5 post-promotion
verification. Distant-source symmetry is not a reason to add an unused
flat/distant cache or select an altitude-only spatial domain.


## Required Local-Sun Responsibilities

The finite-distance local point Sun implements `LightSourceModel` and
`GeometryConfigurableLightSource`, both declared in the
[global light-source contract](../../../../src/algorithm32/interfaces/light-source/types.d.ts),
and constructs a concrete `LocalSunCache`. The shared
`ScatteringCache` interface is only Algorithm32's consumer boundary; it does
not impose the distant-Sun cache's physical domain, geometry-owned mapping, or
storage layout on the local Sun. The local Sun owns:

- its existing typed spectral irradiance declared at a configured reference
  distance, with provenance;
- geometry-installed physical position, intrinsic inverse-square distance
  behavior, radius near-source clamp, and deterministic center behavior;
- the local-source primary scattering-density field `J1`;
- consumption of geometry-owned source-relative distance and direction facts
  when applying its inverse-square scale and constructing its primary field;
- every source fact that participates in cache identity and invalidation; and
- staged GPU construction, failure disposal, and atomic cache publication.

The source-independent recurrence consumes pure preceding orders and produces
the same cumulative local scattering-density quantity used by the distant
source:

```text
J1 = localSourcePrimaryField(...)
JthroughN = J1

for k = 2 through N:
  Jk = scatter(transport(J(k - 1)))
  JthroughN += Jk
```

Only the primary field, source-relative domain, ray bounds, and lifecycle are
extension-specific. Later-order transport must not gain a separate
local-source formula or feed the cumulative field back into the recurrence.
Reusing these mathematical operations does not reuse the distant-Sun concrete
cache type.

The local-Sun cache owns executable indexing, packing, allocation, and shader
addressing for its selected source-relative domain. CPU addressing remains on
the local-Sun packing owner, while each GPU `CacheFieldSpec` carries its direct
field ID and `CacheFieldStorage` allocation facts. The same source-owned plan
selects both paths; it does not publish a second layout snapshot.


## Selected Local Symmetry

For one fixed source above a horizontally uniform flat atmosphere, rotational
symmetry around the vertical line through the source selects the spatial
coordinates:

```text
z   = altitude above the ground plane
rho = horizontal distance from the source subpoint
```

The selected local direction frame uses vertical, horizontal radial, and
horizontal tangent axes. This reduces a single-source field without making it
observer-specific. Position reconstruction uses clamped bilinear interpolation
over 19 scaled `z` nodes and 15 scaled `rho` nodes. The exact fraction profile
reproduces the v4-selected 100 km/4.8 Mm diagnostic grid and scales to other
configured bounds.

The v4 result qualifies only that diagnostic instantiation. Scaling the
profile is an executable configuration policy, not evidence that every other
source height, atmosphere top, radial maximum, or physical configuration meets
the same convergence limits. The selected 15-interval source and stored-field
transport controls also retain measured 15-versus-60 accuracy limitations;
the [promotion-work owner](../caches/unresolved-research.md) records the exact evidence.

Each independently positioned source is expected to own its own cache unless
research establishes a reusable normalized representation. Source movement,
height, spectrum, radius policy, atmosphere, geometry, or ground policy must
invalidate any field whose value depends on those facts. Pure intensity
scaling is not assumed safe until the complete selected source and boundary
model is shown linear.


## Ground And Boundary Behavior

A ray that reaches the ground may still accumulate atmospheric radiance along
the segment before the hit. Ground intersection is therefore a path bound,
not an automatic zero contribution. At the hit:

- geometry supplies the physical point and normal;
- the configured ground boundary supplies the spectral BRDF/reflection; and
- the profile supplies spectral albedo or other retained material data.

Ground-reflected illumination participates in local-source cache construction
through the completed production ground contract at every applicable order.
Omitted ground remains canonical black. Failure to carry that behavior through
the local cache is a defect; no special flat/local policy or material system is
introduced.

Static scene objects shorten final view rays. Atmospheric object shadows,
volumetric shafts, moving-object cache construction, and general spectral PBR
remain outside this extension unless separately scoped.


## Observer Independence

Reusable scattering fields exclude camera and observer state. An
observer-centered dome or application scene-depth cap may bound final view
integration, but it must not silently truncate cache-build transport.

If an observer-centered dome is instead declared a physical boundary for all
scattering paths, the field becomes observer-dependent and requires an
explicitly different domain, cache reuse identity, and rebuild policy. That is
not the selected default.

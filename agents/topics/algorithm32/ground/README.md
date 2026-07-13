# Algorithm32 Ground Boundary

Historical links into non-retained `scripts/algorithm32-star/...` files or
runs are archive-internal and resolve through the
[Algorithm32-Star evidence index](../archive/algorithm32-star/README.md).

Status: Stages 8.1 and 8.2 are implemented. Their retained binary64 comparison
report and GPU evidence passed for the production sources they recorded, but
the report is now historical because production source hashes and
configuration paths changed. Regenerate the production comparison against the
unchanged sealed Star gold before renewing the current Star-validated,
accepted, or CPU-oracle claim.

This document owns the current ground-boundary design, implemented CPU/GPU
behavior, lifecycle contract, and completion claim. The
[production implementation plan](../production/production-implementation-plan.md)
owns sequencing, the [cache contract](../cache/cache-contract.md) owns the
surrounding cumulative recurrence, and the
[architecture boundaries](../production/architecture-boundaries.md) own
cross-cutting responsibility rules.

## Current State And Next Focus

The Stage 8 ground capability is complete. The direct
`evaluateBrdf` contract, implementation-owned grass albedo, uniform Lambertian boundary,
spherical ground intersection, selected binary64 `J2`/`J3`/`J4` ground
recurrence, reflective GPU construction, and boundary-dependent cache identity
are present through the one source-controller/cache strategy. Omitted ground
retains the exact canonical black numerical and field-identity path. The
final-view runtime requires no ground-specific branch because
the completed cumulative cache already contains the ground contribution.

The completed recurrence is now reused by the implemented flat/local CPU and
GPU cache at every applicable order. Stage 9 selected and promoted its scaled
19-by-15 position profile, and Stage 10 implements the Star captured-scene
display-boundary composition while retaining spectral path projection. The
next application-facing work is Stage 11's `flat32`
migration. The Stage 9/10 evidence record is current.

## Existing Production Surface

The following production surface is present:

- `Config` and cache-build requests accept an optional `groundBoundary`;
- `GroundBoundary.evaluateBrdf` returns a distinct typed spectral BRDF packet,
  and `UniformLambertianGroundBoundary` evaluates its pinned Native-15 grass
  albedo over the exact requested basis;
- the current native profile still contains its earlier custom-albedo field
  until that profile's contract transaction, but it is not a public ground-
  boundary construction ingress;
- spherical geometry implements the typed hit/normal/distance contract;
- the distant-Sun CPU implementation adds direct-source ground illumination to
  `J2`, pure `L1` ground illumination to `J3`, and pure `L2` ground illumination
  to `J4`, with no cumulative recurrence input or `L4`;
- the GPU implements the same order accounting: `J2` adds the direct-source
  ground term, `J3` reads its ordinary `L2` scatter input plus pure `L1` ground
  illumination, and `J4` reads `L3` plus pure `L2` ground illumination;
- geometry supplies each ground hit, normal, distance, and construction
  position index; atmosphere supplies source-path and finite-segment
  transmittance; reflective construction has a zero-BRDF guard; and the
  omitted-boundary module remains canonical black;
- CPU field, GPU plan, and cache identities include complete reflective-
  boundary content. A boundary-content change invalidates the controller,
  unchanged content reuses its active cache, and camera or display changes do
  not invalidate it; and
- reduced-domain parity enters only through the scoped construction-domain
  diagnostic seam defined by the
  [archived Star data-set contract](../production/star-parity-data-set.md).
  It cannot enter controller/runtime publication or final-view stencils.

The retained Bruneton grass spectrum is the production built-in ground
material. It is distinct from the later complete paper-comparison profile.

## Selected Contract

- `UniformLambertianGroundBoundary` requires the named material `"grass"`,
  constructs its pinned Native-15 `SpectralReflectancePacket`, and returns a
  typed spectral BRDF equal to `albedo / pi` for that exact basis.
- Callers may supply an optional boundary `id`; they do not supply spectral
  albedo. Snow is deferred until its physical profile and contract expansion
  are selected.
- Geometry owns ground hit position, normal, and distance.
- The source/cache builder owns direct-source sampling, angular quadrature,
  cosine factors, atmosphere transport, and recurrence order.
- The boundary's direct owner ID and its owned packet's physical content
  identity participate in the source-owned plan identity and controller cache
  reuse key. The executable boundary contribution supplies its BRDF value and
  bindings directly; no copied boundary snapshot validates packets,
  calculates values, allocates fields, or drives indexing.
- Omitting the boundary retains the exact canonical black-ground path.
- Ground behavior stays behind the boundary, geometry, source, and cache
  interfaces. Generic recurrence and final-view transport do not branch on a
  boundary kind, geometry kind, or source kind.

The boundary result needs a quantity-specific spectral BRDF packet with
inverse-solid-angle units. Add that packet to the canonical quantity system
rather than returning a bare array or reusing a phase packet merely because
the units match.

## Selected Recurrence Participation

Under the canonical
[algorithm source-promotion and conformance rules](../production/architecture-boundaries.md#algorithm-source-promotion-and-conformance),
the numerical and logical authority is the retained Algorithm32-star ground
branch, promoted through production ownership and typed packets rather than
copied source structure:

- `scripts/algorithm32-star/src/n-order-cache/build-cpu-distant-n-order-cache.js`
  at SHA-256
  `98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a`;
- `ground-boundaries/GroundBoundary.js` at SHA-256
  `cdfd261bef5c0b4857ebeb9d663cf4ee447dd48669ca06e438b8fd0952e154f1`;
  and
- `ground-boundaries/UniformLambertianGroundBoundary.js` at SHA-256
  `46d34ab696548722d2b0f21d01ce6adf217fd569d820db194f4fcaa8b3c048ae`.

The promoted order behavior is:

1. `J1` is unchanged; it contains no reflected-ground term.
2. While constructing `J2`, an incoming ray that reaches ground receives a
   direct-source Lambertian term. Source irradiance is attenuated from the
   source to the hit, multiplied by `max(dot(normal, directionToSource), 0)`
   and the spectral BRDF, then attenuated from the ground hit to the
   atmosphere sample.
3. While constructing `Jk` for `k >= 3`, ground illumination is integrated
   from the pure `L(k - 2)` field using the selected incoming directions,
   solid-angle weights, cosine term, and spectral BRDF. The reflected result
   is transported from the hit to the atmosphere sample and added to the pure
   `L(k - 1)` incoming radiance used to construct `Jk`.
4. Cumulative fields never illuminate the ground and never feed recurrence.
   Requested N1, N2, and N4 and the absence of `L4` remain unchanged.

This order accounting is selected behavior, not a new production derivation.

## Implemented CPU Work And Historical Evidence

The implemented Stage 8.1 path and retained focused binary64 checks cover the
typed BRDF quantity, `albedo / pi`, profile-to-boundary ownership, no implicit
default albedo, spherical hits including exact boundary contact, direct-source
and return-path attenuation, source occlusion, incidence cosine, higher-order
field sampling, `J3 <- L1`, `J4 <- L2`, cumulative isolation, N1/N2/N4
accounting, omitted-versus-zero numerical identity, and complete boundary-
dependent cache identity. The zero-distance return path now uses exact unit
transmittance, and higher-order ground illumination uses geometry's retained
construction-position lookup.

The independent Star corpus is sealed and reader-verified under the ignored
`archives/algorithm32-star-parity` directory. It includes the omitted, nonzero
reflective, and explicit-zero spherical/distant gold needed here. The
[Star parity data-set contract](../production/star-parity-data-set.md) owns the
artifact's exact manifest and payload hashes and the historical binary64
production report's path, hash, coverage, and zero-failure result. The sealed
gold remains current, but the production report must be regenerated before
this CPU result can again be called the accepted Stage 8.2 oracle. The CPU path
remains a reference and diagnostic surface, not a second production cache
builder. The
[baseline status](../production/baseline-import-status.md) owns the exact Node
and type-check results.

## Implemented GPU Work And Historical Evidence

The Lambertian boundary supplies an executable cache-build contribution with
typed reflectance/BRDF bindings, while the canonical black module remains the
omitted-boundary implementation. The source/cache passes own the direct and
higher-order illumination loops, and no cumulative field participates in
ground illumination or recurrence.
The same N2/N4 graph, controller, atomic publication, cancellation, reuse, and
disposal strategy serves omitted, zero-reflectance, and nonzero Lambertian
boundaries.

The dedicated reduced-domain Karma/WebGL gate compares omitted, reflective,
explicit-zero, and matching-omitted N4 builds. It passes selected
pure/cumulative fields, exact zero and omitted checks, Star differentials,
CPU/GPU reflective differentials, coordinate agreement, and WebGL cleanup.
The browser receives only an authenticated bounded projection of the offline
gold, never the archive. The Node lifecycle checks separately establish
boundary-content invalidation, unchanged reuse, and camera/display
non-invalidation.
The [baseline status](../production/baseline-import-status.md) owns the exact
command, environment, duration, case counts, scalar totals, and the honest
`Jthrough1` evidence boundary.

## Completion Boundary

The visible ground capability is implemented through the one
source-controller/cache strategy, and its retained focused parity and
lifecycle evidence passed. Current Star acceptance is pending regeneration of
the production comparison report against the unchanged sealed gold in a new
isolated evidence lane; the archived Star tree is not reopened. Flat geometry,
the finite-distance local Sun, and captured-scene display composition now
follow the same implemented ground behavior. The deferred Stage 11
application migration must not introduce a second ground or cache strategy.

The built-in grass packet uses the exact retained Bruneton table averaged onto
Native-15. Omitted ground remains black. Snow requires a later explicit source,
derivation, and contract expansion; no placeholder value is accepted.

## Future Ocean Ground Boundary

Ocean support is a stretch goal and is not represented as a uniform-
Lambertian material preset. Its initial design direction is a separate
`OceanGroundBoundary` implementation of the global `GroundBoundary` interface
that evaluates a wavelength- and direction-dependent, unpolarized ocean BRDF.

The first design pass should evaluate a physically bounded Fresnel/microfacet
surface model using the incoming direction, outgoing/view direction, surface
normal, wavelength-dependent water refractive properties, and a wave-slope or
roughness state driven by an explicit wind parameter. Foam and subsurface
water-leaving radiance should be separately selectable later contributions,
not values silently folded into a generic albedo.

The future contract must define parameter ranges, spectral data and citations,
cache identity and invalidation, CPU/GPU agreement, nonnegative finite output,
energy bounds, grazing-angle behavior, and Sun-glint cases before
implementation. It must also decide whether polarization remains deliberately
out of scope. Until that work is selected, create no ocean export, placeholder
class, preset albedo, or provisional numerical data.

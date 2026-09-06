# Algorithm32 Ground Boundary

Focus: Physical transport, geometry, ground, and source placement.

Related owners: [qualification](../qualification/ground-contract.md), [physics-numerics](../../pure-research/physics-numerics/ground-contract.md).

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
  [archived Star data-set contract](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/production/star-parity-data-set.md).
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
[algorithm source-promotion and conformance rules](../architecture-contracts/architecture-boundaries.md#algorithm-source-promotion-and-conformance),
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

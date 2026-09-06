# Selected Spatial Reconstruction

Status: selected and implemented in the production CPU resident-cache and
matching shader lookup paths; real-renderer CPU/GPU query parity remains open.


## Authority And Scope

This document is the canonical authority for final-view position
reconstruction: the exact position stencil, ownership and compatibility
rules, supporting evidence, current implementation state, and remaining
CPU/shader completion work.

The [selected cache contract](cache-contract.md) owns the enclosing field
meaning, recurrence, order policy, construction domains, and runtime
calculation. [Cache interface design](cache-design.md) owns the software
interfaces that consume an already-resolved stencil. The independent
[outgoing reconstruction contract](outgoing-reconstruction.md) owns the W27
direction stencil. The
[solar-zenith cache design](solar-zenith-cache-design.md) owns the proposed
successor coordinates and lookup; it does not amend this implemented
altitude-only rule before promotion. This document does not redefine any of
those contracts.


## Decision

At final view lookup, linearly interpolate between the two actual stored
physical altitude nodes that bracket the query. Apply this rule only to the
contract-defined position domain at final view lookup. The position nodes,
construction domains, recurrence, and construction-time lookup remain as
defined by the [selected cache contract](cache-contract.md).

This is a view-only reconstruction rule. It must never be supplied to cache
construction or an intermediate `Jk -> Lk` transport pass because changing
those off-node reads would construct a different cache.


## Ownership And Stencil

Geometry owns the selected position-domain ID, the executable readonly ordered
physical node coordinates, and resolution of the physical query. The direct
domain owner supplies every fact used by the lookup:

```text
query <= h[0]       -> [(0, 1)]
query >= h[47]      -> [(47, 1)]
query == h[i]       -> [(i, 1)]
h[i] < query < h[i + 1]
  t = (query - h[i]) / (h[i + 1] - h[i])
  -> [(i, 1 - t), (i + 1, t)]
```

The cache combines this resolved position stencil with the independent W27
direction stencil and reads the existing spectral values. It does not compute
altitude, infer a uniform bin width, or derive weights from texture size. The
current `0 m` boundary node and `1,875 m` first interior node are exact physical
coordinates, not representatives for inferred uniform bins. References below
to the former `2 m`/`1,250 m` surface are retained first-release evidence.

The source-owned cache plan records the selected position-domain ID alongside
its direct field-storage facts. Runtime compatibility comes from using the
same geometry-owned executable node table and mapping contract; there is no
copied domain or storage snapshot to compare.


## Evidence And Claim Boundary

The bounded CPU comparison sampled one unchanged in-memory cache through the
old containing-bin lookup and the selected two-node lookup. The selected
lookup preserved every cache payload and every exact node. Across all former
bin boundaries, its maximum excess normalized spectral L-infinity was at the
binary64 noise scale (`1.60e-15`). At the known 1,250 m crossing, the old
lookup measured `0.287173` excess normalized spectral L-infinity and
`7.860924` Delta E ITP, while the selected lookup reduced them to
`1.419846e-14` and `5.178543e-11` respectively.

This supports the narrow conclusion that the visible ring was a containing-
bin discontinuity and that actual-node interpolation removes it without
changing the cache. It does not prove that 48 nodes are an exact continuous
atmosphere, compare against a continuous-altitude physical authority, or
establish production GPU conformance.

The current live production-versus-Star engineering diagnostic also compares
six resolved resident queries: an exact position/direction node, off-grid
altitude, two-tap W27, complete two-position-by-four-direction interpolation,
a W27 face-seam tie, and an endpoint clamp. All position and direction stencil
indices matched; position weights matched within `1e-15`, and independently
framed direction weights matched within the declared `1e-14` binary64 bound.
All 90 cumulative N4 spectral values passed the `4e-18` absolute or `1e-12`
relative gate with zero mismatches. Maximum sampled error was
`1.0587911840678754e-22` absolute and `3.110146566194349e-16` relative. This is
implementation-parity evidence, not an external physical-validation claim or
an official experiment.


## Current Production State

`SphericalEarthGeometry.resolveScatteringCachePositionStencil` now uses its
selected executable Native-48 node table and returns exact/clamped single taps
or adjacent linear taps. Binary64 exact-node recognition uses Star's strict
equality over a required typed atmosphere coordinate that geometry has already
resolved for the physical position; there is no near-node snap.
`DistantSunCpuCache.sampleResolved`
combines that position stencil with the independent W27 stencil and reads only
the addressed rows.
The retained construction-time containing-bin lookup and cache payloads are
unchanged. Production Jasmine coverage exercises all 48 exact nodes, both
clamps, interior interpolation, continuity at the former 1,250 m boundary,
and a complete position-by-W27 resident read. The focused real-WebGL runtime
gate additionally checks all 48 nodes, both clamps, and 47 former boundaries
at `-0.25 m`, `0`, and `+0.25 m` across five W27 topology roles and all 15
wavelengths through an address-sensitive manufactured R32F field. The
[baseline import status](../architecture-contracts/baseline-import-status.md) owns the
exact run count and residual.

The shader path now resolves one geometry-owned `AtmosphereCoordinate` from
the view ray and path distance, uses that same coordinate for atmosphere
sampling and Native-48 reconstruction, and resolves W27 independently from
the physical position and direction. Spherical altitude is reconstructed from
the small `geometry.cameraGroundRelativePosition` vector plus the ray offset;
the rationalized radial/transverse formula never evaluates
`length(positionMeters) - bottomRadius` for final-view lookup. Focused source
and float32 checks establish that the former 1,250 m boundary remains distinct
at `-0.25 m` and `+0.25 m`, where Earth-scale position subtraction collapses
both values to 1,250 m. The concrete GPU cache receives only the resolved
position and direction stencils and performs the fixed tensor-product read;
it does not infer geometry or source behavior from field storage.


## Production Completion Requirements

The exact node table is exposed to both CPU and shader geometry, the shader
resolves adjacent/clamped stencils, and the cache blends only their addressed
rows. Construction metadata, construction lookup, and payload identities are
unchanged. Focused real-renderer proof now covers exact nodes, lower/upper
clamps, and every former-boundary offset in the predeclared policy. Release-
grade completion still requires the sparse binary64 resident-cache
complete-ray fixture and a capable-renderer full native lane; the focused
shared-R32F-field gate isolates reconstruction and transport but is not that
end-to-end oracle.

No new spatial coordinate, node ladder, Bruneton-invariant domain, quadrature,
phase factorization, or cache-key axis is part of this implementation.

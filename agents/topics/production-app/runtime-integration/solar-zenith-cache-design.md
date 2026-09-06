# Distant-Sun Solar-Zenith Scene-Cache Design

Focus: Application attachment, lifecycle, state, and asset delivery.

Related owners: [caches](../../production-algorithm32/caches/solar-zenith-cache-design.md).

## One Cache Per Scene

The scene cache is identified by:

- planet bottom/top radii and spherical geometry policy;
- atmosphere density profiles and spectral coefficients;
- ozone, aerosol, and ground identities;
- distant-source spectral shape, normalization, direction, and visibility
  policy;
- Native15 basis;
- maximum scattering order and recurrence identity;
- altitude, local-solar-zenith, incoming, and outgoing domains;
- scene-support definition and culling policy;
- packing, precision, and reconstruction rules; and
- compiler/tool/source identities and content hashes.

All blocks needed by the declared scene support become resident and publish as
one cache. The active design does not page the cache as the Sun moves. A
different scene Sun state selects or swaps a separately built cache.

Animation remains deferred. A future discrete Sun-state animation may swap
complete compatible scene caches atomically; interpolation between scene
caches requires separate continuity evidence.

Broad time-of-day coverage does not require every cache to be resident at once.
One selected scene cache remains the GPU resident unit. The offline/deployed
inventory grows approximately with the number of retained solar-angle bins,
while steady resident GPU size remains the size of one selected cache and
atomic swapping retains the already-qualified two-cache transition policy.

The production resolver owns half-up, half-open one-degree bins across
`[0, 108)`, with explicit darkness beginning at 108 degrees. Each runtime-only
package contains the union of ledger rows required at both interval edges.
All 5,494 coordinates shared by construction parents have byte-identical
Native15 rows, so assembly changes support coverage without approximating the
scattering field.


## Server Cache Resolution

The final product requires a server entry point that resolves one scene
solar-zenith angle to the correct qualified cache. The application owns the
location/time calculation and submits only that scalar angle, using the angle
convention and units fixed by the endpoint contract. The browser does not carry
the complete solar-angle catalog as handwritten application source. The
deployed endpoint/catalog version fixes the supported atmosphere, geometry,
spectral, recurrence, and codec identities; those identities remain explicit
in the returned manifest for independent client validation rather than becoming
resolver inputs.

The resolver response is small. It returns either:

- the exact selected solar-angle bin and scene-cache identity;
- the content-addressed manifest URL and manifest SHA-256;
- the package root used for its ledger, exact-seam payload, and direction index;
- the representative solar-zenith angle owned by that bin;
- cacheability/version facts and optional adjacent-bin prefetch identities; or
- an explicit dark, unsupported, or incompatible result.

The resolver service should not dynamically rebuild the atmosphere cache and
need not proxy approximately 150 MB through an application JSON response. The
offline builder publishes immutable content-addressed packages to static object
storage or a CDN. The server selects one package; the existing loader downloads
and verifies its manifest and payload hashes from those returned URLs. HTTP/CDN
caching can therefore share packages across clients while the application keeps
only the selected cache resident.

The server owns bin policy and catalog availability, but it does not calculate
the Sun position and cannot weaken the client's manifest compatibility checks.
A stale, malformed, hash-mismatched, or physically incompatible response still
fails before publication. Dark results must be distinguished from missing
assets so that complete darkness is an intentional supported outcome rather
than an accidental zero-spectrum fallback. All dark solar angles select one
procedural, texture-free cache contribution that returns zero cumulative
Native15 solar scattering. This is a valid cache implementation behind the
same generic controller/resource interface, not a disabled shader: the live
source placement, geometry, transmittance, scene composition, and celestial
sources remain assembled. No dark angle adds an offline package, resolver
descriptor payload, or resident cache texture.

Flat32's deployed namespace is `/flat32`: its resolver is
`/flat32/api/distant-sun-scene-cache`, and its immutable package namespace is
`/flat32/scene-caches/`. The endpoint is document-relative in the browser so
the application slug remains part of the request. The server package root is
deployment configuration, not a browser request parameter.

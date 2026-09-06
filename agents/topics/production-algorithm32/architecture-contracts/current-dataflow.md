# Algorithm32 Current Dataflow

Focus: Public engine capabilities, ownership, and dataflow.

Related owners: [caches](../caches/current-dataflow.md), [transport-geometry](../transport-geometry/current-dataflow.md), [color-celestial](../color-celestial/current-dataflow.md).

## Production Boundary

- `src/algorithm32` is the sole production implementation and declares no
  runtime dependency on the former source repository or the Algorithm32-star
  research tree. The final mechanical import audit confirms this boundary.
- Physical quantities cross durable boundaries with their units as data.
  Spectral packets identify quantity, units, native-15 basis, bin semantics,
  and provenance. Raw arrays remain internal to numerical kernels, packed
  cache data, resident cache storage, and fixed shader representations.
- The atmosphere owns medium coefficients, density profiles, phase functions,
  extinction, and Beer-Lambert transmittance. Spherical and flat geometry each
  own their physical cache positions, atmosphere and ground bounds,
  source-relative direction frames, construction lookup, and final-view
  physical stencils. The distant and local-Sun sources each own their
  radiometry and state, primary fields, concrete layouts, requested-order
  plans, cache controller, and publication lifecycle. The CPU source adapter accepts the
  canonical omitted boundary or an explicit profile-backed Lambertian BRDF,
  and GPU construction accepts the same choices through canonical-black and
  reflective boundary contributions. Generic cache operations own later-order
  scatter, stored-field transport, copy, and addition. The
  [ground topic](../qualification/ground-contract.md) owns the exact reflective ownership and
  order dependencies.
- Executable domain owners expose the direct IDs, nodes, vectors, weights,
  frames, and stencil behavior used by construction and sampling. CPU packing
  owners and direct GPU `CacheFieldStorage` values supply field extents,
  packed-data shapes, indexing, allocation, and shader addressing. Physical
  spectral and sampled-field provenance identities stay with the consumers
  that compare them.
- Atmospheric path radiance remains spectral through its retained E8
  projection. The ordinary Three scene is captured in renderer-linear sRGB
  before the atmosphere pass. At the single display boundary, the composition
  owner projects spectral transmittance into the retained red, green, and blue
  display bands selected during the historical comparison work, attenuates the
  captured scene color, combines it with projected path linear sRGB, and
  performs final display encoding. Scene RGB is not an atmospheric transport
  quantity.

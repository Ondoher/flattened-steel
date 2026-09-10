# Shared Packet Atlas Verification

P4 extends the production cache backend with opaque persistent-array allocation,
complete layer replacement, published-layer protection, state inspection, and
bounded exact texel probes. `ThreeCachePersistentArray` owns the Three texture,
raw WebGL transfer, paired context listeners, and resource disposal inside the
renderer adapter. Runtime callers receive only handles and stable bindings.

The default `648x1728x24 RGBA32F` allocation contains 429,981,696 payload bytes.
Dimensions, array-layer capacity, linear Float32 filtering, caller-declared
memory budget, and allocation status are checked before exposing the handle.
Three's `source.dataReady=false` allocates GPU storage without allocating or
uploading a full host atlas. Complete packet uploads retain no host packet copy.

Only successful uploads establish a layer identity. Protected published layers
cannot be overwritten. Uploads preserve pixel-unpack and texture-binding state.
All runtime bindings and target uniforms are validated before any uniform is
changed, so a later invalid binding cannot partially replace the installed set.

`RG16UI` row addresses and `RGBA32I` altitude ledgers use exact typed uploads.
The diagnostic boundary reads at most 256 selected RGBA texels and preserves
framebuffer and pixel-pack state. Context loss invalidates uploaded identities
and protection; restoration allocates empty storage under the same Three object
and binding. The P5 controller must rebuild its complete window before publishing
a restored scene.

## Focused Evidence

Two real Chrome GPU cases pass with `ALGORITHM32_THREE_GREP` set to
`Shared packet atlas GPU primitives` through `npm run test:algorithm32:three`:

- Actual 24-layer allocation; exact independently derived packet bits at slots
  0 and 23 across channel groups, face/seam boundaries, first/last populated
  rows, unused rows, and synthetic channel-15 padding.
- Exact unsigned slot/row addresses, the `65535` unavailable sentinel, and
  signed altitude-ledger values; protected-layer preservation, stable binding
  reuse, invalid-later-binding atomicity, foreign-handle rejection, disposal,
  malformed metadata types, and over-budget allocation rejection.

Seven existing backend Jasmine tests, the Algorithm32 type check, and focused
format checks pass. One focused review found no remaining actionable issue in
this phase's data, ownership, and resource-boundary scope.

This is current-machine functional evidence, not supported-device or native-4K
performance qualification. P7 still owns the complete immutable dense-control
oracle, shader metadata integration, context-loss/restoration fault execution,
injected allocation/upload failures, transition and driver-memory peaks, and
cross-cutting review. Deployment selection remains unchanged.

# Distant-Sun Cache Optimization Experiment Plan

## Acceptance Gate

Can a contained candidate reconstruct all 109 current scene payloads
byte-for-byte while meeting the selected storage, generation-time,
browser-latency, memory, cancellation, and transactional-publication gates?

## C0 - Freeze Controls And Measurements

- [x] Pin the deployed catalog, 109 manifests and payload identities, 5,494
  distinct coordinates, implementation inputs, and environment.
- [x] Define one result schema for storage, transfer, request count,
  encode/decode latency, generation stages, peak resources, and exactness.
- [x] Capture current cold, adjacent, nonadjacent, warm, supersession,
  cancellation, context-restoration, and dark-boundary controls.
- [x] Implement run allocation, terminal manifests, containment validation, and
  30-second progress heartbeats before any operation longer than one minute.

Gate: every result has immutable parents, comparable metrics, provenance, and a
terminal state.

Accepted run identities, artifact-set hashes, measurements, and verification
results are recorded only in the [experiment status](status.md).

## E1 - Format And Compression

- [ ] Extract the distinct coordinate set from immutable packages.
- [ ] Build `2x8`, `4x8`, `4x16`, and `8x8` candidates with complete v1 JSON
  metadata and content-addressed blocks.
- [ ] Compare byte shuffle plus pinned Zstandard profiles, including level 3.
- [ ] Reconstruct and authenticate all 109 scene payloads.
- [ ] Measure total size, metadata, block distribution, scene requests and
  bytes, neighboring reuse, overfetch, and encode/decode time.

Gate: zero byte differences, canonical coordinate ownership, valid artifact
chains, and an evidence-backed block and codec recommendation.

## E2 - Browser Transport

- [ ] Implement one decoder contract with optional native and mandatory
  WebAssembly implementations.
- [ ] Exercise one persistent module Worker with transferable buffers and
  one-block-at-a-time decode.
- [ ] Exercise four-request scheduling, artifact coalescing, independent
  subscribers, final-subscriber abort, tokens, and stale-response rejection.
- [ ] Exercise transaction/publication pins and a byte-weighted 64 MiB decoded
  LRU under deterministic latency, corruption, and failure injection.
- [ ] Measure cold and warm latency, main-thread responsiveness, cancellation,
  requests, Worker/main memory, and retained bytes.

Gate: exact bounded decode, effective coalescing, isolated cancellation, no
stale publication, and one pinned decoder dependency suitable for promotion.

## E3 - Bounded Generator

- [ ] Build the union ledger and preallocate exact temporary block files.
- [ ] Calculate the full field once per wavelength and scatter bounded readback
  tiles into final wavelength offsets.
- [ ] Validate, shuffle, compress, round-trip, and address one completed block
  at a time.
- [ ] Inject cancellation and failure at compute, readback, staging,
  compression, validation, and publication boundaries.
- [ ] Measure stage timings and peak GPU, browser, Node, and disk-staging use.

Gate: exact reconstruction from fresh calculation, bounded staging, no
per-scene accumulators, and no partial replacement after interruption.

## D0 - Decide

- [ ] Compare E1-E3 against the predeclared controls and bounds.
- [ ] Record accepted and rejected alternatives and the exact evidence runs.
- [ ] Recommend whether production should promote, revise, or reject the
  candidate.
- [ ] Update the production design only through a separately authorized
  production change.

Gate: one conclusion is supported by immutable evidence, with no unresolved
format, dependency, resource, or lifecycle choice concealed by promotion.

## Promotion Boundary

Experiment results are evidence, not production architecture. Promotion uses
the existing production-owned
[design](../../../production-algorithm32/caches/distant-sun-cache-optimization-design.md)
and
[implementation plan](../../../production-algorithm32/caches/distant-sun-cache-optimization-plan.md),
requires explicit production execution authority, and must adapt accepted
mechanisms without importing this experiment at runtime.

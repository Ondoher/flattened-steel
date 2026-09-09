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

- [x] Authenticate the sealed C0 run and every package manifest, ledger,
  payload, and logical-index identity before extraction.
- [x] Extract the distinct coordinate set from immutable packages.
- [x] Build `2x8`, `4x8`, `4x16`, and `8x8` candidates with complete v1 JSON
  metadata and content-addressed blocks.
- [x] Compare byte shuffle plus pinned Zstandard profiles, including level 3.
- [x] Reconstruct and authenticate all 109 scene payloads through the
  serialized publication graph under the decoded-retention limit.
- [x] Measure total size, metadata, block distribution, scene requests and
  bytes, neighboring reuse, overfetch, and encode/decode time.

Gate: zero byte differences, canonical coordinate ownership, valid artifact
chains, and an evidence-backed block and codec recommendation.

Accepted: `8x8` tiles with byte-lane shuffle and Zstandard level 6. The graph
owns its build, codec, configuration, and catalog-selection identities and
passes bounded independent verification, including closed candidate-subtree,
immutable-C0-oracle, artifact-addressed request, scene-allocation,
unit-vector-ingress, progress, terminal-summary, and total-time checks. The
[experiment status](status.md) owns the evidence identity and measurements.

## E2 - Browser Transport

- [x] Implement one decoder contract with optional native and mandatory
  WebAssembly implementations.
- [x] Exercise one persistent module Worker with transferable buffers and
  one-block-at-a-time decode.
- [x] Exercise four-request scheduling, artifact coalescing, independent
  subscribers, final-subscriber abort, tokens, and stale-response rejection.
- [x] Exercise transaction/publication pins and a byte-weighted 64 MiB decoded
  LRU under deterministic latency, corruption, and failure injection.
- [x] Measure cold and warm latency, main-thread responsiveness, cancellation,
  requests, Worker/main memory, and retained bytes.
- [x] Record every measured scene activation with required, reused, and newly
  decoded block counts; encoded and decoded bytes; Worker queue,
  decompression, and inverse-shuffle time; and transfer, upload, and
  publication elapsed time. Preserve the raw per-scene records for later
  animation-prefetch evaluation without making animation a gate in E2.

Gate: exact bounded decode, effective coalescing, isolated cancellation, no
stale publication, and one pinned decoder dependency suitable for promotion.

Terminally accepted: E2 run `000055-e2-browser-transport`, artifact set
`433594b98968aafe02eee61f77af73be73ca7c0a080122fad88285b6729eeade`.
Its independent post-seal verification authenticates all 12 sealed artifacts.
The run uses the Three r180 `zstddec` WebAssembly fallback, because
the qualifying Chrome had no native Zstandard decoder. It reconstructs every
measured scene exactly, preserves the last-good publication during corruption,
cancellation, and stale-response scenarios, and retains 62,330,880 decoded
bytes after the transaction pins release. The [status](status.md) owns current
measurements and raw-record references.

## E3 - Bounded Generator

- [x] Build the union ledger and preallocate exact temporary block files.
- [x] Calculate the full field once per wavelength and scatter bounded readback
  tiles into final wavelength offsets.
- [x] Validate, shuffle, compress, round-trip, and address one completed block
  at a time.
- [x] Inject cancellation and failure at compute, readback, staging,
  compression, validation, and publication boundaries.
- [x] Measure stage timings and peak GPU, browser, Node, and disk-staging use.

Gate: exact reconstruction from fresh calculation, bounded staging, no
per-scene accumulators, and no partial replacement after interruption.

Terminally accepted: E3 run `000064-e3-bounded-generator`, artifact set
SHA-256 `6f588d42127f92d95985cfc63ec215dd46aa31337215e3fd27ecd22c831b3905`.
It regenerated the common field once for each of 15 wavelengths, published 89
fresh 8x8 blocks only after exact shuffle/Zstandard-level-6 round trips, and
reconstructed all 109 C0 scenes exactly.

## D0 - Decide

- [x] Compare E1-E3 against the predeclared controls and bounds.
- [x] Record accepted and rejected alternatives and the exact evidence runs.
- [x] Recommend whether production should promote, revise, or reject the
  candidate.
- [x] Keep the production design unchanged; any update requires separately
  authorized production work.

Gate: one conclusion is supported by immutable evidence, with no unresolved
format, dependency, resource, or lifecycle choice concealed by promotion.

D0 recommends production promotion of the accepted mechanism, subject to the
explicit constraints in the [D0 decision](decision.md). This contained
experiment does not authorize or make production changes.

## Promotion Boundary

Experiment results are evidence, not production architecture. Promotion uses
the existing production-owned
[design](../../../production-algorithm32/caches/distant-sun-cache-optimization-design.md)
and
[implementation plan](../../../production-algorithm32/caches/distant-sun-cache-optimization-plan.md),
requires explicit production execution authority, and must adapt accepted
mechanisms without importing this experiment at runtime.

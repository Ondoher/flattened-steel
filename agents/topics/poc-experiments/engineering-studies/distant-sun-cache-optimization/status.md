# Distant-Sun Cache Optimization Experiment Status

Status: C0, E1, E2, and E3 are independently accepted. D0 recommends a
separately authorized production promotion; no production change has occurred.

## Current State

C0 run `000022-c0-production-control` remains the immutable production
control. E1 run `000041-e1-format-compression` is the accepted format decision
authority. It selects `8x8` tiles, `float32-byte-lane-v1`, and Zstandard level
6 for browser qualification in E2. Its graph owns immutable generator,
implementation-set, source-catalog, codec, configuration, and
catalog-selection identities. The independent consumer derives the executable
row layout from validated serialized configuration and bounds the complete
candidate before reads, decompressed output before allocation, the frozen
161,183,760-byte maximum scene payload before reconstruction allocation, and
the 900,000 ms total-time gate. Its ingress validators also close the frozen
candidate, source-manifest, derivation, ledger-support, coordinate-domain, and
verifier-construction contracts and validate scene-Sun unit-vector magnitude
and trigonometric domain at ingress. This is contained experiment evidence, not
a production promotion.

The accepted candidate contains 89 content-addressed blocks and 113 separately
hashed v1 metadata artifacts. Its 503,349,215 encoded block bytes plus
3,140,986 metadata bytes total 506,490,201 bytes, 97.0605% below the
17,230,493,726-byte deployed control. Zstandard plus shuffle reduces the
1,337,679,120-byte distinct raw payload by 62.3715%. The largest decoded block
is 15,582,720 bytes and passes the 16 MiB bound.

All 109 production scene payloads reconstructed exactly through the serialized
package-set, catalog, configuration, block-index, scene-manifest, and encoded
block graph under the 64 MiB decoded-block retention limit. The proof checked
17,227,670,880 payload bytes with zero differences, gave every one of the 5,494
coordinates one canonical owner, and round-tripped every block in all 12
layout/profile candidates.

The artifact model measures a 90-degree cold selection at 21 requests and
92,759,590 bytes including five metadata requests, a 91-degree adjacent
selection at two new requests and 7,787,309 bytes, a 30-degree nonadjacent
selection at 17 requests and 90,266,666 bytes, and exact warm reuse at zero.
Sixteen of the adjacent scene's 17 blocks are shared with its predecessor.
Mean row overfetch is 1.5485x. These are request and byte models; E2 owns real
browser latency, concurrency, caching, and cancellation evidence.

E2 run `000055-e2-browser-transport` is the independently accepted
browser-transport authority. It
uses one persistent module
Worker and transferred buffers, and selects Three r180's vendored `zstddec`
WebAssembly fallback because Chrome 153 exposed no native Zstandard decoder.
It validates bounded encoded and decoded block identities, inverse-shuffles,
reconstructs, and uploads selected scene payloads exactly. Four concurrent
requests, artifact-addressed coalescing, independent subscriber cancellation,
last-subscriber abort, stale response suppression, corruption rejection,
token-guarded last-good publication, and a byte-weighted 64 MiB LRU all pass.
The LRU retains 62,330,880 decoded bytes after transaction pins release.

The immutable raw records are
`000055-e2-browser-transport/evidence/browser-transport.json` (artifact-set
SHA-256 `433594b98968aafe02eee61f77af73be73ca7c0a080122fad88285b6729eeade`).
The independent post-seal verifier completed successfully on the sealed run:
all 12 artifacts authenticated and its artifact-set SHA-256 matched the
terminal claim. This qualifies E2 as independently accepted evidence.
Their per-block timing sums may exceed the scene wall time because four block
requests run concurrently. The primary scene activations were:

| Selection | Required / reused / new blocks | Encoded / decoded bytes | Worker queue / decode / inverse | Upload / wall time |
| --- | ---: | ---: | ---: | ---: |
| 90 cold | 16 / 0 / 16 | 92,335,510 / 249,323,520 | 582 / 423.8 / 695.9 ms | 179.2 / 2,724.9 ms |
| 91 adjacent | 17 / 4 / 13 | 100,096,794 / 264,906,240 | 440 / 365.6 / 566.6 ms | 95.9 / 2,413.2 ms |
| 90 repeat | 16 / 4 / 12 | 92,335,510 / 249,323,520 | 619 / 285.1 / 428.2 ms | 96.8 / 1,890.2 ms |
| 30 nonadjacent | 16 / 0 / 16 | 90,241,082 / 249,323,520 | 457 / 463.4 / 622.9 ms | 99.9 / 2,715.8 ms |

The 64 MiB retention target preserves only four of these roughly 15.6 MiB
blocks between large scene transactions, so E2's repeat selection is not a
zero-decode warm case. That is a measured retention-policy consequence, not a
format or exactness failure. The raw records also retain two concurrent 90-degree
coalescing subscribers and the superseded 91/92 transaction for later
animation-prefetch evaluation; continuous animation remains outside E2.

Level 6 adds about 6.7 seconds of whole-inventory encoding over level 3 in the
accepted comparison while saving 18.5 MB for the selected layout. This codec
cost is small relative to the current roughly 85-minute independent-package
generation history; E3 has since measured the selected codec inside the bounded
fresh generator.
The complete E1 run took 662,050 ms and passed the 15-minute comparison bound.
Its matrix also proves artifact-addressed coalescing: the `2x8` / level-1 row
contains 356 logical blocks backed by 355 unique content-addressed artifacts.

## D0 Decision

Checkpoint inspection identified a qualification limitation: E3's
`verifyFaultAndCancellationBoundaries()` constructs local synthetic outcomes
rather than injecting failures or cancellation into active generator work.
The shared verifier checks E3's sealed artifacts and progress but has no
E3-specific semantic branch. Retain the completed runs and original D0
decision as evidence, but do not treat their reported lifecycle pass as proof
of operational fault/cancellation safety. That proof remains required before
production promotion.

The checkpoint-time type check
`tsc -p experiments/distant-sun-cache-optimization/jsconfig.json` fails with
seven diagnostics: missing `E3BoundedStaging` and `E3UnionSource` type names,
an E3 host overload mismatch, a generator JSON-value mismatch, and three
missing imported compiler contract names. These remain unfixed; prior runtime
evidence does not establish a clean current type check.

D0 is complete. The contained experiment recommends production promotion of
the proven mechanism—not direct reuse of experimental code—through the
production-owned design and implementation plan. The decision compares the
accepted C0--E3 evidence against exactness, 600 MB complete-candidate,
15-minute generation, 16 MiB decoded-block, 64 MiB post-pin retention,
browser-lifecycle, and bounded-generation gates. Recorded results pass, subject
to the E3 qualification limitation above. The full rationale,
rejected alternatives, immutable evidence identities, and non-negotiable
production constraints are owned by [D0 decision](decision.md).

The salient operational constraint is generation disk capacity: E3 used
17,227,670,880 bytes of preallocated scene staging plus 1,337,679,120 bytes
of canonical staging. Production must either provision comparable capacity or
separately design and qualify a lower-disk generator. The selected decoder is
the Three r180 `zstddec` WebAssembly fallback, since the qualifying Chrome did
not provide native Zstandard. These are explicit promotion constraints, not
unresolved experiment questions.

## Accepted Evidence

- Production control: `000022-c0-production-control`; artifact-set SHA-256
  `0cbe7d12045136623a254852c19eb3eddc0e36127d404d8c63169c4147ee24a7`;
  16/16 artifacts verified.
- E1 format and compression: `000041-e1-format-compression`; artifact-set
  SHA-256
  `19d79885512d628ad874501b3c854b86eae2dfc374910bdae1dbc6569c96cf4a`;
  214/214 artifacts and the complete published graph verified independently;
  seven positive contract baselines and twelve negative mutations passed,
  including omitted, incomplete, and reset progress-count rejection plus
  preservation of partial progress for nonaccepted terminal evidence.
- E2 browser transport: `000055-e2-browser-transport`; artifact-set SHA-256
  `433594b98968aafe02eee61f77af73be73ca7c0a080122fad88285b6729eeade`;
  independently accepted after post-seal verification of all 12 artifacts. It
  records seven exact browser-worker scene activations, raw
  decompaction timings, 62,330,880 retained decoded bytes, a WebAssembly
  decoder, observed four-request concurrency, main-thread responsiveness,
  peak main heap, and successful corruption, isolated-cancellation,
  final-subscriber cancellation, and stale-publication controls.
- E3 bounded generator: `000064-e3-bounded-generator`; artifact-set SHA-256
  `6f588d42127f92d95985cfc63ec215dd46aa31337215e3fd27ecd22c831b3905`;
  independently verified after sealing all 101 artifacts. It ran one
  receiver-local full-field recurrence for each Native15 wavelength on the RTX
  2060 D3D11 WebGL2 path, scattered directly into 17,227,670,880 bytes of
  preallocated scene staging, and authenticated all 109 fresh scene payloads.
  Its 89 new 8x8 blocks round-tripped through float32 byte-lane shuffle and
  Zstandard level 6, then reconstructed all 109 C0 scenes byte-for-byte.
  Peak decoded block memory was 15,582,720 bytes; the fresh canonical union
  staging was 1,337,679,120 bytes; encoded blocks totalled 503,349,215 bytes.
  Browser recurrence elapsed 294,294.1 ms. The retained fault-boundary proof
  covers compute, readback, staging, compression, validation, publication,
  and cancellation before publication.
- Refreshed infrastructure proof: `000030-c0-infrastructure-proof`; 35 checks;
  artifact-set SHA-256
  `f3db277e0615ae3e22bd12099cd8f8b39c8f08958b43b31b6899a7471d4c7a63`;
  10/10 artifacts verified.
- Refreshed sealed infrastructure subject:
  `000031-c0-infrastructure-subject`; artifact-set SHA-256
  `1c2186072bd98220585a1d2313a816531846214aa8946acc7e6334ef236c6bdf`;
  9/9 artifacts verified.
- Environment: Node 25.4.0 with built-in Zstandard 1.5.7. C0 browser controls
  remain Chrome 153 on the RTX 2060 D3D11 WebGL2 path.

## Retained Iterative Evidence

- `000040-e1-format-compression` is exact, bounded evidence for the current
  `8x8` / level-6 candidate. Its artifact-set SHA-256 is
  `b58cee96882682cbd45373513cb6cef11aac0d5c7290db32a6a8f7c85421ab05`;
  all 213 artifacts and the complete graph independently authenticate. It is
  iterative because its source predates final graph-summary, immutable-C0
  oracle, candidate-subtree, artifact-addressed request, and progress closure.
- `000039-e1-format-compression` is exact, bounded evidence for the current
  `8x8` / level-6 candidate. Its artifact-set SHA-256 is
  `bc6f49ed07c1b9b92c4b3be74191c4f1dd7a0f20db403b5a32fb9b93492c5f8f`;
  all 213 artifacts and the complete graph independently authenticate. It is
  iterative because its source predates final scene-Sun unit-vector validation.
- `000037-e1-format-compression` is exact, bounded evidence for the current
  `8x8` / level-6 candidate. Its artifact-set SHA-256 is
  `65fa8c016c725adb812f3ace15dbd80ae8b6bb97abdbc589f16c204dfaaaf3ca`;
  all 213 artifacts and the complete graph independently authenticate. It is
  iterative because its source predates the strengthened frozen-contract and
  source-ingress validation required by review.
- `000038-e1-format-compression` is an incomplete interrupted run. Its launcher
  detached during input authentication, heartbeats stopped at package 61 of
  109, and its orphaned processes were terminated without reopening or
  modifying the run directory. It is not sealed or accepted evidence.
- `000023-e1-format-compression` is a sealed failed run that exposed the
  wavelength-major production payload layout; its eight artifacts verify.
- `000024-e1-format-compression` is the verified strict-storage comparison
  superseded by the approved 1% materiality policy.
- `000025-e1-format-compression` is the verified balanced-selection result
  superseded by the split v1 metadata artifact schema.
- `000026-e1-format-compression` is a sealed failed schema iteration. Its
  non-finite derived overfetch value correctly prevented accepted publication;
  a host I/O stall also exceeded that run's progress-heartbeat verification
  bound, so it is not an accepted evidence parent.
- `000027-e1-format-compression` is artifact-authenticated iterative evidence
  for the `8x8` / level-6 direction. Its artifact-set SHA-256 is
  `073520807717b40bf1f267931f0f2a79e50e87c5237efd33816dfc03c1dc2718`;
  all 212 artifacts authenticate, but its exactness path did not consume the
  published graph and therefore does not qualify E1.
- `000032-e1-format-compression` is a sealed failed input-contract iteration;
  the closed file-identity validator correctly rejected a production artifact
  reference carrying its additional required codec identity.
- `000033-e1-format-compression` is a sealed failed semantic-verifier
  iteration. It reconstructed the complete published graph but exposed both a
  redundant per-channel decode traversal and the invalid assumption that
  regenerated timing measurements must equal the selected comparison row.
- `000034-e1-format-compression` is verified provisional evidence for the
  selected `8x8` / level-6 format. Its artifact-set SHA-256 is
  `4d2d8a81f9ad32642a365d0c4fac69e2725a577e2f2ed5544c7377d3382786e2`;
  all 213 artifacts and 109 scene reconstructions authenticate, but its graph
  root predates the required build and catalog-selection ownership and its
  verifier predates the complete compressed/decompressed allocation bounds.
- `000035-e1-format-compression` is verified iterative evidence for the
  self-describing graph and compressed/decompressed block bounds. Its
  artifact-set SHA-256 is
  `d4991b0fc5991f51b52f4086b0d3c009c8699b37cc3332d82027454ba3605f96`;
  all 213 artifacts and 109 scene reconstructions authenticate, but its
  verifier predates the explicit reconstructed-scene allocation bound.
- `000036-e1-format-compression` is exact, allocation-bounded iterative
  evidence. Its artifact-set SHA-256 is
  `9ce7cefb6659fe8ed9d8b72cf73365284d0aa750c1595e492bad6ab1fb091af9`;
  all scene reconstructions matched, but its 952,234 ms wall time exceeded the
  900,000 ms acceptance bound and exposed that the terminal validator had not
  enforced that existing design gate.
- `000042` through `000048-e2-browser-transport` are sealed failed E2
  infrastructure iterations. They preserve the sandboxed browser-launch,
  loopback-host allowlist, Node-only module-boundary, remote-browser cleanup,
  endpoint, and initial scene-assembly findings without reopening any parent.
- `000049-e2-browser-transport` is accepted iterative E2 evidence with exact
  browser decoding and transport behavior, superseded only because its
  cross-context `performance.now()` queue values were not valid measurements.
  Run `000050` replaces it with shared-wall-clock queue records.

## Blockers

None recorded.

## Next Action

Await explicit authorization to begin the separately scoped production-promotion
lane. Until then, the accepted experiment evidence and all production surfaces
remain unchanged.

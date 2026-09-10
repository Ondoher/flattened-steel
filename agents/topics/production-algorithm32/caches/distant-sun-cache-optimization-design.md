# Distant-Sun Cache Optimization Design

Status: production promotion architecture selected through D1 and executable
format/compatibility contracts completed through P1. The contained storage,
generator, transport, GPU-residency, packet-rendering, and animation
experiments are complete; production generation through P2 and later runtime
implementation and qualification remain pending.

This document owns the proposed reduction of distant-Sun cache storage,
transfer size, and offline generation time. It is linked from the active
[production closeout plan](../../production-app/release/color-star-cache-closeout-plan.md). The accepted
[one-degree cache hookup](../../production-app/runtime-integration/flat32-one-degree-cache-hookup-plan.md) remains the
owner of current runtime behavior and qualification. The
[implementation plan](distant-sun-cache-optimization-plan.md) owns execution
order, gates, and promotion.


## Objective And Preservation Boundary

The owner considers the current behavior correct. The first objective is to
reduce individual cache files and the excessive size of the complete
inventory; the second is to generate the inventory faster.

The selected design stores shared, losslessly compressed spectral blocks
generated from one common atmospheric calculation per physical/numerical
configuration. Per-angle manifests select the required blocks. The browser
authenticates and decodes those blocks, expands each resident block into the
existing RGBA spectral-packet organization, and uploads it into a persistent
GPU atlas. Per-scene row-address metadata selects resident slots without
reconstructing or uploading a complete dense scene during ordinary use.

Preserve Native15 spectra, Native48 altitude nodes, Z180 local Sun angles,
W27 directions, F68 incoming quadrature, N4 recurrence, accumulation order,
Q30 final-view integration, interpolation-closed bin coverage, and the
texture-free dark state at and above 108 degrees. Existing catalog selection,
atomic replacement, failure preservation, and context restoration remain
acceptance requirements.

Existing packages, sealed experimental evidence, and archives remain immutable.
This design does not reopen their completed plans. Lossy codecs, temporal
interpolation, reduced spatial or angular resolution, and the known
near-horizon appearance defect remain separate work. The packet atlas is
selected for fast scene changes, not as a GPU-memory or frame-rate reduction:
its bounded residency is intentionally larger than one current dense scene,
and its 4K shader cost was experimentally comparable rather than faster.


## Proposals Ranked By Impact

The ranking reflects expected effect on the owner's storage and generation
objectives, not implementation effort. The first two changes remove inventory-
wide duplication. Compression then reduces the remaining bytes; shader setup
and synchronization address residual generation cost. This is an impact
ranking, not a schedule that promotes an easier task ahead of a larger benefit.

| Rank | Proposal | Impact supported by the evaluation | Evidence boundary |
| --- | --- | --- | --- |
| 1 | Store identical altitude/Sun-angle rows once across all packages. | Spectral payload falls from 17.23 GB to 1.34 GB before compression: 92.2353% fewer bytes. Neighboring selections reuse authenticated blocks. | E1 and E3 reconstructed all 109 package payloads exactly. |
| 2 | Generate the common atmospheric field once, then extract all required rows. | Complete wavelength calculations fall from 1,635 to 15. The accepted E3 durable run completed recurrence, staging, compression, and reconstruction in under nine minutes. | The production generator must independently reproduce the accepted result and retain its measured disk-staging requirement. |
| 3 | Apply reversible byte-lane shuffle and Zstandard level 6. | The accepted `8x8` candidate is 506,490,201 bytes including metadata, 97.0605% below the 17.23 GB control. | E1 selected the complete candidate and E2 qualified its browser fallback mechanism; production must own the dependency and implementation. |
| 4 | Reuse shader programs and reduce repeated compilation. | One retained 45.76-second compilation spent about 30.80 seconds between wavelength start and programs-compiled checkpoints. | This interval includes setup and shader compilation, not isolated shader compiler time. Savings after rank 2 are not additive to eliminating repeated inventory builds. |
| 5 | Reduce unnecessary GPU synchronization and progress round trips. | Current field traversal performs 21,600 strip-level gl.finish() calls per package, plus accumulation waits. | The count follows the executable loops; the achievable time reduction has not been measured. |

All MB and GB values in this document use decimal units. MiB denotes
1,048,576 bytes.


## Recommended V1 Architecture

The following defaults resolve the implementation decisions in this design.
They are ordered by their effect on storage reduction, generation time, and
runtime reliability rather than implementation effort.

| Decision | Recommended v1 default |
| --- | --- |
| Shared-block grouping | Fixed `8x8` coordinate tiles containing at most 64 populated rows. A full block is 15,582,720 decoded bytes and remains below the 16 MiB format ceiling. |
| Manifest and coordinate index | Versioned JSON metadata split into package-set report, runtime catalog, configuration manifest, block index, and per-scene manifest. |
| Browser decoder | One persistent module Worker behind a repository-owned decoder interface; prefer a feature-detected native Zstandard decoder and retain a pinned decoder-only WebAssembly fallback. |
| Request coalescing | One process-wide in-flight request per encoded artifact, at most four concurrent artifact requests, with subscriber-aware cancellation. |
| Client retention | Pin blocks used by the published and predicted windows and retain other decoded blocks in a byte-weighted 64 MiB least-recently-used cache. A declared animation-preparation budget may retain additional compressed, decoded, or packet-ready route data. |
| Generator staging | Calculate the common field once per wavelength and scatter union rows into preallocated temporary block files at final wavelength offsets; validate, shuffle, compress, and publish one completed block at a time. |
| GPU packet block | Expand one authenticated 64-row block to one `648x1728` `RGBA32F` array layer. Preserve Native15 channels in four RGBA packets and require exact zero padding in the unused sixteenth component. |
| Row metadata | Use an `RG16UI` scene-row address mapping to `{resident slot, block row}` and an `RGBA32I` scene/altitude ledger matching the accepted packet proof. |
| GPU residency | Use a 24-layer sliding atlas as the bounded default. Preload the initial current/predicted window; upload later blocks ahead of their deadline. A fully route-resident atlas is optional and route- and device-qualified. |
| Live publication | Keep one compiled runtime. Publish Sun direction, scene selection, row metadata, receiver lighting, and shadow-light placement coherently at a frame boundary. |
| Failure and publication | Generation-token and `AbortSignal` cancellation, full identity validation before slot upload, and one current-generation metadata publication that preserves the last good state. |

The numerical defaults are selected production inputs, not permanent
constants. A later value may replace one only when a separately declared
evidence set shows a material end-to-end improvement without weakening the
bounds or behavioral guarantees.

### D1 Production Promotion Freeze

D1 combines the accepted storage mechanism with the accepted GPU packet
mechanism. Production adapts both behind its existing cache and renderer
boundaries; it never imports experiment modules or writes to sealed runs.

The ordinary runtime path does not rebuild the wavelength-major scene payload.
Full dense reconstruction remains a qualification oracle and temporary
rollback bridge only. Each authenticated shared block is independently packed
and uploaded once per residency, and an eligible scene becomes visible only
when all of its row addresses resolve to authenticated resident slots.

The default 24-layer packet atlas occupies exactly 429,981,696 bytes before
driver overhead. This exceeds the current 185,326,380-byte maximum dense-scene
allocation and therefore requires an explicit production memory policy and a
safe dense fallback during rollout. The accepted 62-block sunrise-to-sunset
route occupies 1,110,786,048 bytes; that result qualifies only the reference
GPU and that route. The complete 89-block production inventory would occupy
1,594,515,456 bytes and is neither a default nor an experimentally qualified
whole-inventory mode.

Animation preparation has two eligible forms:

- preload every route block when the declared route fits a device-qualified
  atlas; or
- preload the initial 24-layer window and predictively fetch, authenticate,
  packetize, and upload later blocks before their presentation deadline.

Normal prepared playback performs metadata and live-light publication at the
frame boundary. A forced prediction miss holds the last-good scene until a
complete successor is ready; it never publishes an incomplete row map. The
first production qualification must combine the 24-layer RGBA packet atlas
with actual predictive replacement because the contained experiment proved
bounded sliding residency and final packet rendering in separate executions.

### Shared Block Shape

Partition each configuration's 48-by-180 coordinate domain into stable
eight-altitude-by-eight-Sun-angle tiles. Omit coordinates not present in the
inventory union rather than padding them with spectral data. Within a block,
order populated coordinates first by altitude index and then by local
Sun-angle index. Store wavelength-major float32 values for each coordinate so
the generator can write one contiguous coordinate span per wavelength and the
runtime can packetize an authenticated block without numerical reconstruction.

A full 64-row tile decodes to:

```text
64 * 4,058 directions * 15 channels * 4 bytes = 15,582,720 bytes
```

This approximately 14.86 MiB decoded block is the D0-selected result of the
completed `2x8`, `4x8`, `4x16`, and `8x8` comparison. Enforce the 16 MiB
decoded-size ceiling before allocation. Changing the block geometry or codec
is a new format decision and cannot occur as an implementation convenience.

### Canonical Packet Mapping

The decoded block is wavelength-major, then populated block-row-major, then
unique-direction-major. For channel `c`, populated block row `r`, and unique
direction `d`, its exact Float32 source index is:

```text
sourceIndex = (c * blockRowCount + r) * 4058 + d
```

Packet construction first expands each logical W27 direction `l` through the
authenticated 4,374-entry logical-to-unique map. With `face = floor(l / 729)`,
`faceLocal = l - face * 729`, `v = floor(faceLocal / 27)`, and
`u = faceLocal - v * 27`, the destination of channel `c` and block row `r` is:

```text
packetGroup = floor(c / 4)
component   = c % 4
x           = packetGroup * 162 + face * 27 + u
y           = r * 27 + v
layer       = residentSlot
```

The array texture is `648x1728`, uses x-fastest RGBA component order, and does
not flip the y axis during upload. Construction copies the source Float32 bit
pattern without numerical conversion. Channel indices 0 through 14 retain
Native15 basis order. Packet group 3 component 3, corresponding to synthetic
channel 15, is exact positive zero for every logical direction and populated
row. Unpopulated rows through row 63 are also exact zero.

The `RG16UI` row-address texel at `(scenePackedRow, sceneOrdinal)` stores
`{residentSlot, blockRow}`. Both components use `0xffff` for an unavailable
entry, and publication rejects a supported row containing that sentinel. The
`RGBA32I` ledger texel at `(altitudeIndex, sceneOrdinal)` stores
`{firstSolarZenithIndex, lastSolarZenithIndex, firstScenePackedRow, 0}`. These
equations, component assignments, origins, sentinels, and exact-copy semantics
are format contracts shared by the independent packer, shader, and verifier.

### Manifest And Coordinate-Index Ownership

Use versioned JSON metadata for v1 and binary files only for encoded spectral
blocks. JSON keeps deployment diagnostics and restoration practical while the
metadata remains small relative to payloads. Divide ownership as follows:

- The package-set report identifies the immutable build, parent evidence,
  generator and codec versions, configuration manifests, runtime catalog, and
  their artifact hashes.
- The runtime catalog maps a scene-selection key to a per-scene manifest and
  retains the current catalog-selection contract.
- A configuration manifest owns the physical and numerical configuration,
  coordinate domains, direction layout, spectral layout, block-grid rules,
  codec profile, and block-index identity.
- The block index maps each coordinate to exactly one block and row ordinal
  and maps each block id to its artifact path, ordered coordinate list,
  decoded byte length and SHA-256, encoded byte length and SHA-256, codec,
  shuffle, and derivation identity.
- A per-scene manifest owns the selected scene, interpolation-closed ledger,
  ordered coordinates, required block ids, and the expected reconstructed
  package identity.

Use a configuration hash plus tile coordinates as the logical block id. Keep
that logical decoded identity separate from the encoded artifact hash so a
codec or compression-level change does not alter the scientific identity.
Reject duplicate coordinates, gaps, out-of-domain indices, non-canonical
ordering, inconsistent lengths, unsupported schema or codec versions, and any
hash mismatch before publication.

### Browser Decode, Requests, And Retention

Put Zstandard behind a repository-owned asynchronous decoder contract that
accepts encoded bytes, an expected decoded bound, codec parameters, and an
abort signal. Browser support documentation is currently inconsistent:
[MDN lists `zstd`](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream/CompressionStream),
while the current [WHATWG Compression Standard](https://compression.spec.whatwg.org/)
does not define it. Therefore feature-detect native support at runtime rather
than making it a deployment assumption, and ship a pinned decoder-only
WebAssembly fallback. Qualify the exact fallback dependency before adoption.

Use one persistent module Worker for hash validation, decompression, inverse
shuffle, and decoded-hash validation. Transfer `ArrayBuffer` ownership at the
worker boundary and process one block at a time per worker to bound memory.
Add a second worker only if profiling shows decoder throughput on supported
devices blocks first publication and the additional memory remains within the
qualified bound.

Fetch complete immutable, content-addressed block files; do not make v1 depend
on byte ranges or dynamically assembled bundles. Maintain one process-wide
in-flight promise per encoded artifact hash and limit the request scheduler to
four concurrent block fetches. Multiple cache transactions subscribe to that
promise. A subscriber cancellation stops only its own continuation; abort the
underlying fetch or decode only after every subscriber has cancelled. Validate
both encoded and decoded hashes so HTTP caching, coalescing, and codec changes
cannot blur identity boundaries.

Host pins have explicit owners and lifetimes. A published pin lasts while the
active or predicted GPU window references the block. A candidate pin lasts
until that transaction publishes, fails, or is cancelled. A prediction pin
lasts until it becomes published or the predictor supersedes it. A declared
prepared-route pin lasts until consumption, explicit release, or route
replacement. After pins release, decoded or packet-ready data enters a
byte-weighted 64 MiB least-recently-used cache that evicts only unpinned
entries.

Current, candidate, and next-deadline prediction pins may temporarily exceed
the ordinary LRU target and must expose that excess in diagnostics. A prepared
route has a separate caller-declared host-memory ceiling. Admission stops at
that ceiling: excess future blocks remain encoded in the browser HTTP cache or
are scheduled later rather than growing memory without a bound. Correctness
must never depend on host retention or eviction. Do not add IndexedDB or Cache
Storage persistence in v1. Immutable cache headers and content-addressed URLs
let the browser HTTP cache retain encoded artifacts without a second
application-owned storage lifecycle.


## 1. Shared Storage Across The Inventory

### Measured Duplication

The deployed package set contains 109 independently packaged windows of the
same altitude/local-Sun-angle field. Each retained row contains 4,058 unique
directions, 15 spectral channels, and four bytes per value:

```text
rowBytes = 4,058 * 15 * 4 = 243,480
```

| Quantity | Evaluation result |
| --- | ---: |
| Complete deployed package bytes, including package metadata | 17,230,339,148 |
| Spectral payload bytes alone | 17,227,670,880 |
| Stored row occurrences | 70,756 |
| Distinct altitude/Sun-angle coordinates | 5,494 |
| Repeated rows with matching spectral hashes | 65,262 |
| Mismatching repeated coordinates | 0 |
| Distinct-row spectral payload bytes | 1,337,679,120 |
| Average copies per coordinate | 12.8788 |
| Maximum copies per coordinate | 18 |

The reduction is `1 - 5,494 / 70,756 = 92.23528746678727%` of spectral
payload bytes. The distinct-row total excludes new indexes, manifests,
compression framing, and any deliberate block padding.

The existing
[package assembler](../../../../scripts/algorithm32/solar-zenith-cache/assemble-bin-covered-runtime-packages.js)
already hashes shared coordinates to reject disagreement, but writes their
values into every consuming package. The evaluation independently reproduced
that check against the deployed files.

For the measured 90-to-91-degree selection change, 614 of 662 rows are shared.
Only 48 rows, or 11,687,040 uncompressed spectral bytes, are new. Transfer
savings require retained client blocks; the existing loader does not provide
this shared-block reuse.

### Proposed Representation

Store each distinct row once under a configuration-specific coordinate index.
Sharing requires compatible atmosphere, geometry, ground, source spectrum,
sampling domains, numerical parameters, and decoded values. A coordinate alone
is insufficient across different configurations.

Package manifests retain the selected scene and bin-coverage ledger and refer
to shared blocks. Each block records its ordered coordinates, spectral and
direction layout, decoded byte length and hash, encoded byte length and hash,
codec settings, and derivation identity. The recommended v1 schema and block
grouping are defined above; their numerical tuning remains subject to the
specified comparative qualification.

Use stable coordinate tiles and coalesced requests to balance transfer overhead
against overfetch. The loader fetches only blocks required by the selected and
predicted ledgers. It authenticates each wavelength-major block, expands it to
one production-compatible RGBA32F packet layer, and uploads it to a stable
resident slot. It must not reconstruct a complete dense scene or require a
download or GPU upload of the entire distinct inventory.

Bound retained decoded and packet-ready host blocks independently from the GPU
atlas and let the browser HTTP cache own ordinary encoded-file retention. A
declared animation-preparation request may use a larger bounded host budget.
Preserve transactional publication while blocks are fetched, decoded,
validated, packetized, and uploaded. Shared storage reduces total deployed
inventory; the initial selected view still needs its own working set.


## 2. One Atmospheric Calculation For The Inventory

### Finding

The
[inventory builder](../../../../scripts/algorithm32/solar-zenith-cache/build-one-degree-scene-cache-inventory.js)
loops over observer angles and invokes a complete compilation for each package.
The
[compiler input owner](../../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js)
uses the scene to select a retained-row ledger, while its executable build
request contains the same complete physical field for every deployed angle.

Reconstructing `createInputSet({sceneSun, support}).buildRequest` for all 109
deployed package manifests and ledgers produced one SHA-256 over UTF-8
`JSON.stringify(buildRequest)`:

```text
fdbae73006edd919d16760f0beac107342c6af759cab5d3087b945525f3c5811
```

The common construction domain is 48 altitudes by 180 local Sun angles.
Each wavelength constructs the full recurrence before extracting the scene
window. The current 109-by-15 wavelength executions therefore repeat the same
15 wavelength calculations.

The retained [production adoption record](../../../../archives/topics/topic-consolidation-20260906/agents/topics/algorithm32/production/solar-zenith-cache-adoption-plan.md)
reports 5,099,755.299999237 ms total compiler time across the original inventory,
with a 46,786.74587155263 ms mean per package. These are historical compiler
execution measurements, not a fresh end-to-end generation benchmark.

### Proposed Generator

Compute the union of required interpolation-closed ledgers first. For each
wavelength, execute the existing full recurrence once and accumulate the
required union rows in the existing J1, J2, J3, J4 order. Stream or tile the
result into shared storage before advancing to the next wavelength.

Keep the full recurrence construction domain initially: dependencies needed
by scattering and transport are broader than the final visible-row union.
Removing repeated complete calculations does not justify pruning those
dependencies.

Use a bounded union accumulator or tiled extraction. Passing all 109 requests
to the existing multi-cache interface without redesign would allocate two
accumulator textures for every package and retain much of the duplication.
The implementation must account for accumulator, recurrence, readback,
compression, and host staging memory separately.

### Bounded Staging And Finalization

Preallocate one temporary uncompressed file for every populated block using
its exact decoded length. For each of the 15 wavelengths, run the existing
full-domain recurrence once, read back only a bounded tile, and scatter each
required coordinate into its block file at the final wavelength offset. Do not
retain the 1.34 GB distinct inventory or all per-package accumulators in host
memory.

After all wavelengths complete, close and flush staging handles. Then process
one block at a time: validate its length and decoded hash, apply the reversible
byte shuffle, compress with the pinned Zstandard profile, validate a decode
round trip, and write the content-addressed encoded candidate. The intended
host-memory bound is one wavelength field plus one readback tile plus one
encoding block, with small metadata overhead. Record measured peak host and GPU
memory; the implementation must fail cleanly rather than exceed a declared
limit.

Write all candidates under a unique build staging directory. Only after every
block, index, manifest, catalog, and report passes schema, containment, length,
hash, and reconstruction checks may the generator atomically publish the new
package-set root or its single active pointer. On failure or cancellation,
leave the previously published set unchanged and retain or remove only the
unpublished staging directory according to the run-evidence policy.

The expected structural reduction is 1,635 to 15 wavelength calculations.
Measure final elapsed time including setup, calculation, readback, compression,
hashing, metadata, and disk writes. Preserve per-package decoded payload hashes
as the exact reconstruction oracle. New container hashes may differ.


## Runtime Failure, Cancellation, And Publication

Assign every requested scene transition a monotonically increasing generation
token and an `AbortController`. A newer request cancels the older transaction's
subscriptions and makes every older continuation ineligible to publish, even
if a shared fetch or worker operation completes later. Crossing into the
texture-free dark domain at or above 108 degrees immediately cancels the
candidate and atomically publishes the existing dark state without waiting for
cache I/O.

A candidate transaction must validate the complete catalog-to-manifest-to-
block identity chain, decoded bounds, coordinate coverage, and packet shape
before an uploaded slot can enter a published row map. Slot uploads may reuse
the persistent atlas, but their identities remain unpublished until one
current-generation metadata swap makes a complete scene visible. Reclaim
superseded unpinned slots only after their work settles. A fetch, decode,
validation, packetization, allocation, upload, context-loss, or cancellation
failure must preserve the last known-good scene and report a stage-specific
error. Full package reconstruction and its expected identity remain mandatory
offline qualification rather than an ordinary runtime allocation.

Shared request cancellation follows subscriber accounting: one cancelled
scene must not abort an artifact still needed by another transaction. Worker
messages carry transaction and artifact identities, and stale or mismatched
responses are discarded. Context restoration reuses validated retained blocks
when available but performs the same isolated upload and atomic-publication
checks as a fresh load.


## 3. Lossless Payload Compression

### Measured Results

The evaluation used Node v25.4.0 with Zstandard 1.5.7, compression level 3.
Plain Zstandard compressed each complete payload. The shuffled variant split
the payload into independent 1 MiB chunks, with a shorter final chunk, grouped
the four corresponding bytes of float32 words into four byte planes, then
compressed each chunk separately. This reorders bytes without changing values.

| Solar zenith | Original bytes | Plain Zstandard bytes | Shuffled Zstandard bytes | Shuffled encode ms | Shuffled decode ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| 60 degrees | 161,183,760 | 72,983,263 | 60,370,528 | 885.375 | 507.430 |
| 90 degrees | 161,183,760 | 75,186,308 | 62,451,997 | 846.436 | 507.368 |
| 100 degrees | 161,183,760 | 78,711,115 | 62,979,628 | 876.904 | 529.469 |
| 107 degrees | 161,183,760 | 68,806,894 | 54,578,516 | 799.978 | 465.204 |

Both variants reconstructed every original byte for all four complete
payloads. Shuffled encoding times include byte shuffling and compression;
decoding times include decompression and inverse shuffling. They exclude file
reads and the final equality assertion. Reported shuffled sizes sum compressed
chunk lengths and exclude an application-level chunk index. These are single
local diagnostic observations, not warmed browser performance guarantees.

### Codec And Loading Design

[Zstandard](https://github.com/facebook/zstd) is the first lossless codec
candidate. [Blosc's filter documentation](https://www.blosc.org/c-blosc2/reference/blosc1.html)
describes byte and bit shuffle for numerical data. Those sources explain the
codec/filter techniques; the repository measurements above establish the
observed cache-specific sizes.

The completed E1 comparison selected `8x8` blocks, the
`float32-byte-lane-v1` reversible transform, and Zstandard level 6. Its
506,490,201-byte complete candidate supersedes the earlier four-payload level-3
estimate as the production planning authority.

Decode and authenticate before packet packing. Prefer packet construction in
the persistent Worker and transfer one completed packet block to the renderer;
GPU upload remains renderer-owned. Bound the decoded, packet-ready, transferred,
and resident copies separately. The storage reduction does not reduce GPU
memory: one 24-layer packet atlas is approximately 430 MB before driver
overhead.


## 4. Shader Setup And Program Reuse

The retained
[Native15 host-regression compiler report](../../../../tmp/extraterrestrial/production-color-reset/p8/c1-4-native15-host-regression-000001/compiler-report.json)
records 45,761.5 ms of browser execution on the RTX 2060/D3D11 path.
Summing wavelength-start to `programs-compiled` progress intervals gives
30,797 ms; summing the reported field-pass durations gives 12,066.800 ms.
The remainder includes operations outside those measured intervals. Field-pass
durations include host synchronization and progress reporting and are not
isolated GPU timer-query measurements.

The
[GPU compiler](../../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js)
creates and destroys six programs per wavelength, with wavelength-specific
values embedded in shader source. Reusing identical programs within a retained
browser context avoids recompiling identical source across repeated requests.
Rank 2 already eliminates most repetition across inventory angles.

For remaining per-wavelength setup, evaluate shared program source with
wavelength coefficients supplied as uniforms, or overlapping shader
compilation where supported. Compare against unchanged output because changing
constant folding or arithmetic evaluation can affect float32 rounding. Do not
claim the full 30.8-second interval as removable shader compiler work.


## 5. GPU Synchronization And Progress Reporting

The current compiler draws eight fields per wavelength, in 180 Sun-angle
strips, for 15 wavelengths. It calls `gl.finish()` and checks WebGL errors
after every strip:

```text
8 * 180 * 15 = 21,600 strip-level completion waits per package
```

Additional waits occur during the four per-wavelength cache accumulations.
Progress reporting also awaits loopback HTTP responses throughout construction.

Evaluate bounded batches of strips, fewer completion waits, asynchronous
completion checks at necessary host-read boundaries, and throttled progress
reporting. Preserve command ordering, error attribution, cancellation,
responsiveness, and protection against excessively long GPU submissions.
Measure this after ranks 2 and 4 so previously removed overhead is not counted
again. No synchronization speedup has yet been measured.


## Evidence Identity And Reproduction

The accepted storage, transport, and generator identities are owned by the
[D0 decision](../../poc-experiments/engineering-studies/distant-sun-cache-optimization/decision.md).
The accepted atlas, packet-renderer, native-4K, animation, and final-audit
identities are owned by the
[GPU-resident decision](../../poc-experiments/engineering-studies/gpu-resident-shared-block-cache/decision.md).
Those runs remain immutable evidence and never become production runtime
dependencies.

The initial evaluation below was read-only and left source, payloads, and
historical reports unchanged. It predates the later immutable experiment runs
and is retained as reproduction context, not as the final promotion authority.

The input package root is owned by the
[Flat32 cache-data contract](../../../../server/flat32/data/README.md):

```text
server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1/
```

The catalog SHA-256 is
`2dbf92ad616c5461954fc15f8eb1654c49f4b1e3ddbd948aa7bda7a40c76d7ac`.
Its package report records 5,494 shared coordinates. The evaluation traversed
all catalog entries, checked each spectral payload length and SHA-256 against
its manifest, and calculated a spectral row hash by concatenating the 4,058
float32 direction values for each of the 15 channels in channel order.
Repeated `(altitudeIndex, solarZenithIndex)` keys had to match. The check read
17,227,670,880 authenticated spectral bytes and completed in 114.21 seconds;
that duration measures the integrity scan, not cache generation.

Compression input identities:

| Solar zenith | Original spectral payload SHA-256 |
| --- | --- |
| 60 degrees | `e81d10021183ca8bd5332174f7b9a672862e02373cf1ebc25456cd713959ed3b` |
| 90 degrees | `36eec029515e4c2f551b30afef2fd68b3ba1d8c576f86b5ce7ee3ab68d303a12` |
| 100 degrees | `be251354bf8cd8601f4250c5c807aa24b4b666c6fab3e0a0de74678e055a2e98` |
| 107 degrees | `bef946f3b054fb24fadc93cf3a9331c7d11b111e87534818429fda9b6e0575c2` |

Source and retained report identities at documentation time:

| Input | SHA-256 |
| --- | --- |
| `DistantSunSceneCacheCompilerInputs.js` | `c14472028478197891e6473c7fb1b5684c408189f334ff87d6fd5c32c225c885` |
| `DistantSunSceneCacheGpuCompiler.js` | `40ce3842a8950091ddcd0487d46b36a00351bb3309cede600b045f645328f268` |
| `build-one-degree-scene-cache-inventory.js` | `209891056b4eaea6cfd04fed518c6e1fedc076ff78727633cb347ecf4224cd8c` |
| `assemble-bin-covered-runtime-packages.js` | `973d4320798f8ac09d81fc3f617a26bc7c9563e8284517ddbd7a1f2b308d877e` |
| Linked Native15 host-regression `compiler-report.json` | `d61d2a5c0fbabd441eaf565ea20b140613aa0a0451cebe26ebcf85ad192eb3ac` |

The four source files are under `scripts/algorithm32/solar-zenith-cache/`.
These working-file identities are more specific than the repository HEAD
because the evaluation occurred in a pre-existing dirty worktree.


## Qualification And Remaining Decisions

Implementation qualification should establish:

- Exact decoded reconstruction of every existing package, including the
  overlap rows, interpolation boundaries, seams, and all spectral channels.
- End-to-end inventory size including indexes and block overhead; initial and
  neighboring-bin transfer sizes; and bounded host and GPU working sets.
- Browser decode and first-publication latency, failed/cancelled/superseded
  replacement behavior, same-context reuse, context restoration, and darkness.
- Exact RGBA packet probes, zero-padding checks, row-to-slot and altitude-ledger
  coverage, and same-frame dense/candidate render comparison.
- Combined 24-layer packet residency with preloaded initial state, predictive
  upload, reverse motion, direction change, and forced prediction misses.
- Request coalescing under overlapping and partially cancelled transactions;
  decoded and packet-ready retention at, below, and above their declared
  budgets.
- Stable-runtime animation in which Sun direction, cache selection, receiver
  environment light, celestial placement, and shadow-light placement change
  coherently without shader recompilation or whole-mode replacement.
- Native-4K GPU timer-query evidence separating stable frames, metadata-only
  transitions, predictive uploads, and misses. Recording and encoding remain
  separate from performance measurement.
- Capability and allocation behavior for the 24-layer default. Any fully
  route-resident atlas is qualified for its exact route and target; the
  62-layer experiment is not a general whole-inventory guarantee.
- Fresh generation output parity and full elapsed-time breakdowns on the
  selected hardware, with each optimization compared against its immediate
  parent to avoid double-counting benefits.
- Generator peak staging, host, and GPU memory; interrupted-build cleanup; and
  proof that a failed build cannot replace the last published package set.
- A new derivation record identifying immutable parent packages, operations,
  configuration, implementation/tool identities, and resulting artifacts.

The selected defaults establish the block layout, codec, decoding boundary,
request coalescing, retention policy, packet atlas, predictive preparation,
bounded staging, and transactional behavior needed to begin implementation.
Qualification must not relax decoded-size bounds, identity checks,
cancellation isolation, exact reconstruction, or last-good publication.
Quantization, float16 storage, reduced angular or spectral resolution,
temporal interpolation, and lossy codecs are outside this exact-value
promotion. The known horizon appearance problem must be disclosed and checked
for regression, but remains a separately owned visual/physical issue.

Current completion: D0 selected the shared storage/generation mechanism and D1
selects its production GPU-resident packet adaptation. Runtime, generator,
deployed package format, and production acceptance remain unchanged.

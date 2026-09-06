# Distant-Sun Cache Optimization Design

Status: design proposal with evaluation findings recorded on 2026-09-05 and
recommended v1 architecture recorded on 2026-09-06. Implementation and
qualification are pending.

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

The proposed design stores shared, losslessly compressed data blocks generated
from one common atmospheric calculation per physical/numerical configuration.
Per-angle manifests select the required blocks. The loader reconstructs the
same float32 samples and existing face-grid GPU representation.

Preserve Native15 spectra, Native48 altitude nodes, Z180 local Sun angles,
W27 directions, F68 incoming quadrature, N4 recurrence, accumulation order,
Q30 final-view integration, interpolation-closed bin coverage, and the
texture-free dark state at and above 108 degrees. Existing catalog selection,
atomic replacement, failure preservation, and context restoration remain
acceptance requirements.

Existing packages, sealed experimental evidence, and archives remain immutable.
This design does not reopen their completed plans. Lossy codecs remain a
separate closeout D4 decision; 4K rendering performance remains D1. No GPU
memory reduction or frame-rate improvement is claimed by the storage design.


## Proposals Ranked By Impact

The ranking reflects expected effect on the owner's storage and generation
objectives, not implementation effort. The first two changes remove inventory-
wide duplication. Compression then reduces the remaining bytes; shader setup
and synchronization address residual generation cost. This is an impact
ranking, not a schedule that promotes an easier task ahead of a larger benefit.

| Rank | Proposal | Impact supported by the evaluation | Evidence boundary |
| --- | --- | --- | --- |
| 1 | Store identical altitude/Sun-angle rows once across all packages. | Spectral payload falls from 17.23 GB to 1.34 GB before compression: 92.2353% fewer bytes. Neighboring selections can reuse downloaded blocks. | Full inventory payload hashes and all repeated coordinate hashes were checked; block/index overhead and browser loading are still unmeasured. |
| 2 | Generate the common atmospheric field once, then extract all required rows. | Complete wavelength calculations fall from 1,635 to 15 for the 109-package inventory. The recorded independent-package inventory took about 85 minutes. | All 109 reconstructed executable build requests were identical. The new generator has not been implemented or timed; 109-fold less repeated recurrence is not a 109-fold elapsed-time claim. |
| 3 | Apply reversible byte shuffle and Zstandard compression. | Four 161.18 MB payloads became 54.58-62.98 MB, a 60.93-66.14% reduction, with exact reconstruction. | Four complete payloads measured in Node; compressed distinct-inventory size, browser decode cost, and final shared-block layout remain open. |
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
| Shared-block grouping | Fixed coordinate tiles containing four altitude rows by eight local-Sun-angle rows, with no more than 32 populated rows or 16 MiB decoded data per block. |
| Manifest and coordinate index | Versioned JSON metadata split into package-set report, runtime catalog, configuration manifest, block index, and per-scene manifest. |
| Browser decoder | One persistent module Worker behind a repository-owned decoder interface; prefer a feature-detected native Zstandard decoder and retain a pinned decoder-only WebAssembly fallback. |
| Request coalescing | One process-wide in-flight request per encoded artifact, at most four concurrent artifact requests, with subscriber-aware cancellation. |
| Client retention | Pin blocks used by an unpublished transaction and retain published decoded blocks in a byte-weighted 64 MiB least-recently-used cache. Rely on the browser HTTP cache for encoded files. |
| Generator staging | Calculate the common field once per wavelength and scatter union rows into preallocated temporary block files at final wavelength offsets; validate, shuffle, compress, and publish one completed block at a time. |
| Failure and publication | Generation-token and `AbortSignal` cancellation, full identity validation before GPU upload, isolated candidate resources, and one atomic publication swap that preserves the last good cache. |

The numerical defaults are starting contracts, not permanent constants. The
qualification run must compare the block candidates and retention limits named
below. A different value may replace a default only when the same evidence set
shows a material end-to-end improvement without weakening the bounds or
behavioral guarantees.

### Shared Block Shape

Partition each configuration's 48-by-180 coordinate domain into stable
four-altitude-by-eight-Sun-angle tiles. Omit coordinates not present in the
inventory union rather than padding them with spectral data. Within a block,
order populated coordinates first by altitude index and then by local
Sun-angle index. Store wavelength-major float32 values for each coordinate so
the generator can write one contiguous coordinate span per wavelength and the
loader can reconstruct the current package ordering without numerical work.

A full 32-row tile decodes to:

```text
32 * 4,058 directions * 15 channels * 4 bytes = 7,791,360 bytes
```

This approximately 7.43 MiB decoded target is large enough for useful
compression and request amortization while allowing several neighboring
blocks within the client retention budget. Enforce a format-level decoded-size
ceiling of 16 MiB before allocation. Qualification must compare `2x8`, `4x8`,
`4x16`, and `8x8` tiles using total compressed inventory bytes, requests and
bytes for initial and neighboring selections, browser decode latency, and peak
memory. Keep `4x8` unless another candidate materially improves the combined
result.

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

Pin every decoded block referenced by the current published cache or an active
candidate transaction. After publication, retain other decoded blocks in a
byte-weighted 64 MiB least-recently-used cache, evicting only unpinned entries.
If pinned blocks exceed the budget, allow the temporary excess and expose it in
diagnostics; correctness must not depend on eviction. Do not add IndexedDB or
Cache Storage persistence in v1. Immutable cache headers and content-addressed
URLs let the browser HTTP cache retain encoded artifacts without a second
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
against overfetch. The loader fetches only blocks required by the selected
ledger and reconstructs the existing wavelength-major payload and RGBA32F
face-grid atlas. It must not require a download or GPU upload of the entire
distinct inventory.

Bound retained decoded blocks independently from the active GPU cache and let
the browser HTTP cache own encoded-file retention. Preserve transactional
publication while blocks are fetched, decoded, validated, and assembled.
Shared storage reduces the total deployed inventory; the initial selected view
still needs its own working set.


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
block identity chain, decoded bounds, coordinate coverage, and reconstructed
package identity before creating or updating published GPU resources. Assemble
and upload into isolated candidate resources, then make one atomic controller
swap only if the generation token is still current. Dispose superseded
candidate resources after their work settles. A fetch, decode, validation,
allocation, upload, context-loss, or cancellation failure must preserve the
last known-good published cache and report a stage-specific error.

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

Benchmark compression again on the selected shared-row block layout. The
measured 1 MiB wavelength-major chunks are not a finalized shared-block format,
and their compression ratios cannot establish the complete compressed
distinct-inventory size.

Decode before the existing GPU packing operation. Validate compressed framing
and bounded decoded size, then check the decoded identity before publication.
Qualify the browser decoder, its packaging, worker behavior, cancellation,
peak memory, and latency. The proposed file reduction does not reduce the
approximately 185 MB maximum existing GPU atlas allocation.


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

The evaluation was read-only and left source, payloads, and historical reports
unchanged. Its hash checks and compression timings were emitted to the session;
no standalone immutable qualification run was created. This document records
those findings and reproduction details, not a new production acceptance claim.

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
- Comparative `2x8`, `4x8`, `4x16`, and `8x8` block results; request
  coalescing under overlapping and partially cancelled transactions; decoded
  LRU behavior at, below, and above its 64 MiB target.
- Fresh generation output parity and full elapsed-time breakdowns on the
  selected hardware, with each optimization compared against its immediate
  parent to avoid double-counting benefits.
- Generator peak staging, host, and GPU memory; interrupted-build cleanup; and
  proof that a failed build cannot replace the last published package set.
- A new derivation record identifying immutable parent packages, operations,
  configuration, implementation/tool identities, and resulting artifacts.

The v1 defaults select the block layout, decoding boundary, request
coalescing, retention policy, bounded staging strategy, and transactional
behavior needed to begin implementation. Qualification may tune the numerical
defaults or select the exact decoder dependency, but it must not relax decoded
size bounds, identity checks, cancellation isolation, exact reconstruction, or
last-good publication. Quantization, float16 storage, reduced angular or
spectral resolution, and lossy codecs are outside this exact-value proposal.
Further scientific or display tradeoffs require their own error and appearance
acceptance boundary.

Current completion: evaluation findings, impact ranking, and recommended v1
architecture are documented; runtime, generator, deployed package format, and
acceptance status are unchanged.

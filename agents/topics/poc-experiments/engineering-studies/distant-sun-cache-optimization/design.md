# Distant-Sun Cache Optimization Experiment Design

## Objective

Determine the exact-value shared-block format, browser transport, retention
behavior, and bounded generation strategy that materially reduce distant-Sun
cache storage and generation time without changing accepted runtime results.

## Acceptance Question

Can a contained candidate reconstruct all 109 current scene payloads
byte-for-byte while meeting the selected storage, generation-time,
browser-latency, memory, cancellation, and transactional-publication gates?

## Isolation Boundary

Authored experiment work remains below
`experiments/distant-sun-cache-optimization/`. Generated output remains below
`tmp/experiments/distant-sun-cache-optimization/`. Production and other
experiment trees are read-only inputs unless their write scope is separately
authorized.

## Output and run rules

- The experiment source root is
  `experiments/distant-sun-cache-optimization/`. Authored implementation,
  fixtures, harnesses, runner source, configuration, and dependency manifests
  belong there.
- The generated-output root is
  `tmp/experiments/distant-sun-cache-optimization/`. Builds, caches, browser
  profiles, reports, captures, diagnostics, renders, logs, progress records,
  temporary files, and other generated intermediates belong only there and
  must remain ignored by Git.
- Derive repository, source, and output roots from the location of a checked-in repository marker rather than `process.cwd()`.
- Real-path-check every read and write boundary. Reject symlinks, junctions, reparse points, and any resolved path outside its declared root.
- Use a new `runs/<run-id>/` directory for each evidence-bearing execution. Never overwrite or reopen a completed run. Copy or derive reused material into the new run and retain its source identity.
- Record the command, inputs, relevant configuration, implementation revision or hashes, tool/runtime versions, environment facts that affect the result, parent artifacts, derivation operation, and resulting artifact identities.
- Finalize a run with an explicit terminal state: `accepted`, `rejected`, `failed`, or `interrupted`. Publish its terminal manifest only after all artifacts are closed and hashed.
- Cooperative cancellation and handled failures must finalize explicitly. An
  uncatchable process or host termination may leave an incomplete run; that
  directory is quarantined, is never evidence, and must never be reopened.
- A verifier may read the run it validates but must not mutate it. Corrections and retries create a new run.
- Keep production and other experiment trees read-only during experiment execution unless the engineer explicitly expands the write scope.
- The canonical one-shot generation and post-seal verification commands are
  owned by the [experiment entry](README.md#one-shot-commands).

## Monitorable progress

Every operation expected to run longer than one minute writes UTF-8 JSON Lines to:

```text
tmp/experiments/distant-sun-cache-optimization/runs/<run-id>/progress.jsonl
```

Append one event at process start, every phase transition, at least once every 30 seconds while active, and at terminal completion or failure. Flush each event so another process can tail the file while the operation runs. Each event contains:

```json
{
	"timestamp": "2026-09-04T12:00:00.000Z",
	"phase": "compute",
	"completed": 24,
	"total": 100,
	"message": "Processing sample batch 24 of 100."
}
```

`timestamp`, `phase`, and `message` are always required. Include `completed` and `total` when work is countable. Terminal events additionally include `state` with one of the allowed terminal states. Do not place secrets, credentials, or unnecessary personal data in progress records.

## Decisions

- Use the 109 immutable deployed scene packages as the primary exact-value
  oracle; do not regenerate or alter them.
- Compare `2x8`, `4x8`, `4x16`, and `8x8` coordinate tiles. Treat `4x8` as the
  initial default, not the foregone result.
- Evaluate reversible byte shuffle plus Zstandard level 3 and record complete
  metadata overhead as well as payload bytes.
- Require a browser-capable decoder behind one asynchronous contract. Native
  Zstandard support is optional; the WebAssembly fallback must pass.
- Evaluate one persistent module Worker, four concurrent requests,
  artifact-hash coalescing, subscriber-aware abort, and a 64 MiB decoded LRU.
- Prove wavelength-at-a-time calculation and scatter-to-file staging without
  retaining the distinct inventory or per-scene accumulators in memory.
- Use focused self-verifying proof runners, not an experimental unit-test tree.
- Treat experiment results as evidence only. Production may adapt an accepted
  mechanism but may never import this lane at runtime.

## Inputs And Comparison Authorities

- Current deployed package root:
  `server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1/`.
- Production architecture and candidate defaults:
  [cache optimization design](../../../production-algorithm32/caches/distant-sun-cache-optimization-design.md).
- Evidence gates and eventual promotion boundary:
  [production implementation plan](../../../production-algorithm32/caches/distant-sun-cache-optimization-plan.md).
- Current package hashes, manifests, catalog, loader behavior, generator
  sources, browser version, Node version, GPU path, and operating environment
  must be pinned by the first run rather than inferred from mutable filenames.

## Acceptance Bounds

- Exact byte reconstruction of every current scene payload is unconditional.
- Every coordinate has exactly one canonical block owner and every encoded and
  decoded artifact identity validates.
- The complete candidate, including metadata, should not exceed 600 MB.
- Complete generation on the comparison machine should not exceed 15 minutes.
- Cold publication latency and production GPU residency must not regress.
- Cancellation, corruption, supersession, context restoration, and the
  texture-free dark boundary must preserve the last-good behavior.

Missing a performance target produces a retained negative or iterative result;
it never relaxes exactness, containment, memory bounds, or publication safety.

## Accepted Production Control

C0 must authenticate the deployed package inventory, exercise every frozen
runtime scenario in a real browser, and emit every field in the measurement
contract. Candidate comparisons use that immutable control contract. Codec,
Worker, generation, and disk-staging metrics are explicitly `null` when they
do not apply to the current uncompressed control. These are control facts, not
candidate performance claims.

Run infrastructure is qualified separately for allocation locking,
construction authority, path and reparse containment, JSON and terminal
validation, recoverable progress failure, post-seal immutability, and missing,
extra, corrupt, or semantically invalid artifact sets. The
[experiment status](status.md) is the sole current owner of accepted run
identities, artifact-set hashes, measurements, and verification results.

## Accepted E1 Format Evidence

E1 selects `8x8` coordinate tiles, the `float32-byte-lane-v1` reversible
shuffle, and Zstandard level 6 for E2 evaluation. The accepted graph owns its
immutable build and catalog-selection identities. Its independent verifier
derives the executable row layout from validated serialized configuration and
enforces complete compressed and decompressed block-allocation bounds, the
frozen maximum scene payload before reconstruction allocation, and the
15-minute total evidence-run bound, rejects malformed scene-Sun unit vectors at
ingress, closes its candidate subtree, and independently authenticates its C0
oracle. This selection does not change production architecture before
promotion.

The selection rule first finds the smallest complete candidate, retains every
candidate within 1% of that minimum, then minimizes cold transfer bytes,
request count, and encoding time. Current measurements and their evidence
status are owned only by the [experiment status](status.md).

The candidate format materializes separately hashed package-set report, runtime
catalog, configuration manifest, block index, and per-scene manifests, plus
content-addressed Zstandard blocks. Payload bytes are wavelength-major within
each block. Every coordinate has one block and row ordinal; scene manifests
retain ordered segments and the expected reconstructed payload identity.

E1 request results are artifact-level models with immutable metadata retained
after first fetch. They are not browser latency or cache-policy qualification.
E2 must exercise the decoder, Worker, scheduler, coalescing, subscriber abort,
64 MiB LRU, and transaction behavior in a real browser.

E2 must retain raw per-scene decompaction records: required, reused, and newly
decoded block counts; encoded and decoded bytes; Worker queue, decompression,
and inverse-shuffle time; and transfer, upload, and publication elapsed time.
These records support a later animation-prefetch decision; E2 does not make
continuous animation behavior an acceptance gate.

## Accepted E2 Browser Evidence

E2 run `000055-e2-browser-transport` has an accepted terminal state and uses
one persistent module Worker with transferred buffers. Its independent
post-seal verification is recorded in [status](status.md). It
selects the already-vendored Three r180 `zstddec` WebAssembly implementation;
Chrome 153 did not expose native Zstandard decoding. The Worker validates the
bounded encoded and decoded identities, inverse-shuffles one block at a time,
and reconstructs selected scene payloads exactly before a measured WebGL2
`R32F` upload and token-guarded last-good publication.

The transport exercises four concurrent encoded-block requests, hash-addressed
coalescing, isolated subscriber abort, final-subscriber fetch abort, stale
result suppression, corruption rejection, and a byte-weighted 64 MiB LRU. A
transaction may temporarily retain its pinned blocks above that target; after
transactions complete, retained decoded bytes were 62,330,880. The complete
raw per-scene records are immutable evidence in the accepted run, with their
current measurements summarized only by [status](status.md).

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
- A verifier may read the run it validates but must not mutate it. Corrections and retries create a new run.
- Keep production and other experiment trees read-only during experiment execution unless the engineer explicitly expands the write scope.

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

# Shared Browser Transport Verification

P3 implements browser transport and packet preparation without activating the
shared runtime. `DistantSunSharedCacheTransport` owns one process-wide scheduler,
at most four complete network-to-packet jobs, encoded-artifact coalescing, and
independent subscriber cancellation. Browser artifact and Worker URLs must be
same-origin HTTP(S). Complete-file reads reject truncated or excessive bytes.

One persistent module Worker authenticates encoded and decoded SHA-256 values,
validates the bounded single-frame Zstandard layout, restores Float32 byte lanes,
and constructs canonical RGBA packets. Native Zstandard construction is detected
at runtime; the decoder-only Three r180 WASM fallback remains mandatory. The
build checks fallback source SHA-256
`5cbf818e842628a4464e748594a6deae18ceddda3c2f541e7b3a0ff5fc7611e2`.
The frame boundary follows the
[Zstandard frame specification](https://github.com/facebook/zstd/blob/dev/doc/zstd_compression_format.md).

`npm run build:algorithm32:shared-worker` produces the module Worker under the
ordinary ignored Flat32 build output. Both production build commands include
that step. No runtime import reaches an experiment or an external repository.

## Resource Contract

- Encoded and decoded block allocations each have a 16 MiB ceiling. Decoder
  window declarations above 16 MiB are rejected before decompression.
- Exactly one Worker block executes at a time. Transfer detaches input buffers
  and returns one 17,915,904-byte packet. Transient decoded storage remains in
  the Worker; only packet-ready data is retained on the main thread.
- Default pinned packet admission is 768 MiB, including pending reservations.
  Published, candidate, predicted, and prepared-route pins have explicit owners.
  Prepared routes additionally require a consistent caller-declared ceiling.
- Released packets enter a byte-weighted 64 MiB LRU. Pinned packets cannot be
  evicted. These are explicit payload budgets, not browser/driver RSS claims.
- A final cancellation prevents stale delivery. Active Worker cancellation
  settles before the pipeline slot is reused. Worker failure rejects pending
  jobs and permits a fresh Worker on the next request; disposal terminates it.
- Aggregate diagnostics expose queueing, coalescing, last-stage durations,
  decoder choice, admission, pins, eviction, cancellation, and failure without
  retaining unbounded per-request histories.

## Focused Verification

Seven focused Jasmine tests pass through:

```text
npx jasmine --config=spec/support/jasmine-algorithm32.json --filter="Shared-cache"
```

They compare exact signed-zero, subnormal, channel, seam-expanded, and padding
bits; reject framing, bound, and hash corruption; enforce same-origin ingress;
and prove four-job scheduling, coalescing, partial/final cancellation, reuse,
pin preservation, route admission, and LRU eviction.

Three real Chrome Worker cases pass through `npm run test:algorithm32:three`
with `ALGORITHM32_THREE_GREP` set to `Shared-cache module Worker`. They hash an
independently constructed full 64-row packet and a partial packet, prove input
buffer detachment and persistent reuse, and exercise corrupt-data rejection,
cancellation, disposal, actual Worker failure, and recovery.

The Algorithm32 type check and pinned Worker build pass. One focused review
found the missing same-origin guard; its correction and the browser error-event
correction were reviewed directly. No remaining actionable finding was reported
in that focused scope. Complete cross-cutting standards review, combined
renderer/runtime behavior, host/driver peaks, device qualification, and native-4K
performance remain P7 obligations. The unchanged P2 numerical evidence is reused.

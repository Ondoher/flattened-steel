# Distant-Sun Cache Optimization Implementation Plan

Status: proposed execution plan. The contained POC is created and active;
production implementation and qualification have not started.

This plan executes the
[distant-Sun cache optimization design](distant-sun-cache-optimization-design.md).
That design owns architecture and numerical defaults; this document owns work
order, gates, evidence, and promotion. The existing one-degree package set and
accepted runtime remain the control until the final publication gate passes.


## Completion Target

Replace the duplicated 109-package distant-Sun inventory with an immutable,
content-addressed set of shared, losslessly compressed blocks while preserving
the exact decoded float32 package values and existing runtime behavior. Build
the set from one common atmospheric calculation per wavelength using bounded
host staging. Load it through validated, coalesced browser requests and an
atomic last-good cache transition.

The work is complete only when:

- every current scene package reconstructs byte-for-byte from the new set;
- total deployed bytes, initial and neighboring-scene transfer, generation
  time, decode latency, host memory, and GPU memory are measured end to end;
- cancellation, corruption, supersession, context restoration, and the
  texture-free dark boundary retain their current behavior;
- the new package set is published transactionally with an explicit rollback
  path; and
- the temporary old-format compatibility and selection paths are removed after
  acceptance rather than becoming permanent architecture.


## Recommendation: Create A Narrow Contained POC Lane

Create a new contained engineering lane dedicated to cache packaging and
transport before modifying the production loader or generator. This is
recommended because four important choices remain empirically uncertain:

1. The `4x8` block default has not been compared with the required alternatives
   over the complete distinct-row inventory.
2. The browser Zstandard fallback, Worker transfer path, and peak decode memory
   have not been qualified in the supported browser.
3. Coalescing, subscriber-aware cancellation, decoded-block retention, and
   stale-result suppression interact and need deterministic fault injection.
4. The bounded scatter-to-files generator has not demonstrated exact
   reconstruction or its intended memory bound.

These are suitable POC questions because a wrong answer would otherwise harden
new file formats, dependency choices, and asynchronous behavior directly in
production. The atmospheric algorithm itself is not experimental: the POC must
reuse immutable current package bytes as its primary oracle and must not reopen
the accepted scientific or visual result.

The lane should be named `distant-sun-cache-optimization`. Its tracked source,
controls, proof runners, and manifests belong below the `start-experiment`
skill's standard source root:

```text
experiments/distant-sun-cache-optimization/
```

Its generated packages, browser bundles, profiles, reports, and immutable run
records belong below an isolated ignored namespace:

```text
tmp/experiments/distant-sun-cache-optimization/
```

The repository `start-experiment` skill created and activated the lane. It is
disposable evidence, never a runtime dependency. Production code may adapt an
accepted result but may not import the experiment or mutate its completed runs.


## Execution Order And Gates

The stages below are dependency ordered. Within a stage, work is ranked by the
impact order from the design: sharing, common generation, compression, then
residual compiler and synchronization improvements.

### C0 - Freeze Controls And Measurement Contract

- Record the current catalog, all 109 manifests and payload identities, the
  5,494-coordinate distinct-row inventory, tool versions, and supported browser
  and GPU environment as immutable parent inputs.
- Define one results schema for compressed size, request count and bytes,
  encode/decode time, generation stage timing, peak host and GPU memory, and
  exact reconstruction.
- Define representative cold-load, warm neighboring-selection, rapid
  supersession, cancellation, corruption, context-loss, and 108-degree-dark
  scenarios before measuring candidates.
- Capture current loader latency and memory as the behavioral performance
  control. Existing historical timing may inform expectations but cannot
  replace this fresh baseline.

Gate: every later result can name an immutable input, implementation identity,
command, environment, and comparable metric definition.

### E1 - Contained Format And Compression POC

- Read the immutable deployed inventory and construct the distinct coordinate
  set without changing source packages.
- Repack that set using `2x8`, `4x8`, `4x16`, and `8x8` coordinate tiles.
- Apply the specified byte shuffle and pinned Zstandard profiles, including
  level 3, and decode every candidate back to exact float32 bytes.
- Generate the proposed package-set report, configuration manifest, block
  index, runtime catalog, and per-scene manifests for each layout.
- Measure complete deployed bytes including metadata, block-size distribution,
  per-scene required blocks, cold transfer, and adjacent-scene overfetch.

Gate: zero reconstruction differences across all 109 scenes; every coordinate
has exactly one canonical owner; every artifact passes length and encoded and
decoded hash validation. Keep `4x8` unless another layout materially improves
the combined storage, transfer, request, decode, and memory result.

### E2 - Contained Browser Transport POC

- Put native and WebAssembly Zstandard implementations behind the same
  repository-shaped asynchronous decoder contract; the POC must prove the
  fallback because native browser support is optional.
- Decode and inverse-shuffle in one persistent module Worker using transferred
  buffers and one-block-at-a-time processing.
- Exercise four-request scheduling, artifact-hash coalescing, independent
  subscribers, last-subscriber abort, generation tokens, and stale-response
  rejection with deterministic latency and failure injection.
- Exercise a byte-weighted 64 MiB decoded LRU with transaction and publication
  pins, including temporary pinned-budget excess.
- Measure cold and warm latency, main-thread responsiveness, Worker and main
  heap peaks, request counts, cancellation latency, and retained bytes.

Gate: exact decoded bytes, bounded allocation before decode, no duplicate
network work for one artifact, no cross-subscriber cancellation, no stale
publication, and no correctness dependency on cache eviction. Select and pin
one decoder-only WebAssembly dependency with its license and build identity.

### E3 - Contained Bounded-Generator POC

- Build the union ledger before GPU work and preallocate exact-size temporary
  block files.
- Run the full recurrence once for each wavelength, read back bounded tiles,
  and scatter rows directly to their final wavelength offsets.
- Finalize one block at a time through decoded validation, shuffle,
  compression, round-trip validation, and content-addressed output.
- Inject cancellation and failures during recurrence, readback, staging,
  compression, validation, and final publication.
- Measure stage timings and peak GPU, browser, Node, and disk-staging resources.

Gate: the complete candidate reconstructs every control package byte-for-byte;
the generator retains neither the full distinct inventory nor per-scene
accumulators in memory; interrupted work cannot replace a completed set.

### D0 - POC Decision And Production Design Freeze

- Compare E1-E3 results against the predeclared measurement contract.
- Confirm or revise the block shape, codec profile, decoder dependency,
  concurrency, retention budget, and staging bounds in the design.
- Record accepted and rejected alternatives. A revision that changes fidelity
  or introduces lossy representation requires a separate study and is not
  eligible for this plan.
- Define the exact production schemas and public JavaScript contracts before
  copying or adapting POC mechanisms.

Gate: one evidence-backed v1 architecture is selected, its dependencies and
resource bounds are known, and no unresolved POC choice leaks into production
implementation.

### P1 - Implement Production Format Contracts

- Add schema identifiers, types, parsers, and validation for the package-set
  report, configuration manifest, block index, catalog, and scene manifests.
- Keep logical decoded block identity separate from encoded artifact identity.
- Validate canonical coordinate ordering, coverage, domains, lengths, hashes,
  codec settings, paths, derivation, and decoded allocation bounds.
- Add focused positive and negative tests for duplicates, gaps, overflow,
  unsupported versions, corrupt hashes, and unsafe artifact paths.

Gate: production validators reject every malformed or ambiguous structure
before network, decode, staging, or GPU allocation can trust it.

### P2 - Implement Shared Inventory Generation

- Refactor the offline compiler so common physical work is explicit and the
  union ledger is computed once.
- Implement wavelength-at-a-time calculation, bounded tile readback, direct
  block-file scatter, and one-block-at-a-time finalization.
- Preserve J1-J4 accumulation order and all existing numerical inputs.
- Implement unique staging roots, cancellation, complete verification, atomic
  publication, and last-good preservation.
- Generate deterministic reports with parent, implementation, tool, codec,
  configuration, and artifact identities.

Gate: fresh generation reconstructs all 109 current packages exactly and
passes the declared staging-memory bound. Record total elapsed time and every
major stage rather than inferring speedup from loop-count reduction.

### P3 - Implement Browser Block Transport

- Add the repository-owned decoder interface, persistent Worker, native
  feature detection, and pinned WebAssembly fallback.
- Add the process-wide four-request scheduler, encoded-artifact in-flight map,
  subscriber accounting, and transferable-buffer ownership rules.
- Add the byte-weighted decoded LRU and explicit candidate/published pins.
- Expose bounded diagnostics for requests, coalescing, decoded bytes, pins,
  evictions, Worker queueing, decode duration, and failures.

Gate: Node and browser tests cover exact decode, bounds, coalescing, partial and
complete cancellation, eviction, corruption, and Worker failure without an
unhandled rejection or leaked subscriber/resource.

### P4 - Integrate Transactional Runtime Publication

- Resolve scene manifests and required blocks through the existing Flat32
  catalog boundary.
- Reconstruct the current wavelength-major scene payload and existing RGBA32F
  face-grid resources from validated blocks.
- Build GPU resources in isolation and publish them with one current-generation
  swap. Preserve the last good cache on every failure.
- Preserve same-identity reuse, rapid supersession, disposal, context
  restoration, and immediate texture-free darkness at and above 108 degrees.
- Use a temporary explicit selection switch for qualification; do not silently
  change the ordinary deployed format.

Gate: the existing cache lifecycle suite and new fault cases pass against the
shared-block candidate, with no experimental runtime import.

### P5 - Generate And Qualify The Release Candidate

- Generate the complete candidate set from the production generator into an
  ignored, immutable qualification run.
- Verify all existing package identities by reconstruction and compare selected
  GPU inputs and rendered outputs against the current production control.
- Measure complete storage, manifest overhead, cold initial load, adjacent and
  nonadjacent changes, warm reuse, browser decode, main-thread responsiveness,
  generator time, disk staging, and peak host and GPU memory.
- Run corruption, truncation, oversize declaration, unavailable decoder,
  network failure, cancellation, supersession, context loss/restoration,
  disposal, and dark-boundary cases.
- Run the applicable Algorithm32, Flat32, server, type, format, and build gates.

Gate: exact reconstruction and behavior are unconditional. The performance
candidate should reduce the approximately 17.23 GB deployed inventory to no
more than 600 MB including metadata, complete generation in no more than 15
minutes on the comparison machine, and avoid a regression in qualified cold
publication latency or production GPU residency. Missing a performance target
causes review, not relaxation of correctness or safety gates.

### P6 - Publish, Observe, And Remove The Bridge

- Publish the immutable set under a new content-addressed root and verify the
  server's containment, caching, content type, and complete-file behavior.
- Switch the explicit catalog/package-set selection only after its deployed
  identities match the accepted qualification record.
- Retain the previous immutable package set as the rollback target during the
  observation window. Rollback changes selection; it never edits either set.
- After acceptance, remove the old-format loader, temporary selection switch,
  generation path, and duplicated deployed inventory from the active product
  surface. Preserve history and designated evidence according to repository
  archival policy.
- Update the cache design, current dataflow, deployment inventory, status, and
  release documentation to identify the new canonical format.

Gate: one production cache path remains, rollback evidence is recorded, and
documentation describes current behavior rather than the migration sequence.


## Verification Matrix

| Concern | Required evidence |
| --- | --- |
| Numerical identity | Byte-for-byte reconstruction of every existing scene payload and coordinate overlap. |
| Format integrity | Positive and negative schema, ordering, coverage, length, path, encoded-hash, decoded-hash, and decoded-bound tests. |
| Storage and transfer | Complete inventory including metadata; block distribution; cold scene; adjacent scene; nonadjacent scene; warm reuse. |
| Browser behavior | Native capability detection, mandatory WASM fallback, Worker transfer, responsiveness, decode latency, and peak retained bytes. |
| Concurrency | Coalesced subscribers, partial abort, final abort, supersession, stale Worker response, and request-limit enforcement. |
| Lifecycle | Same identity, changed identity, last-good preservation, context restoration, disposal, and texture-free darkness. |
| Generator | One calculation per wavelength, exact scatter offsets, bounded staging, deterministic identities, cancellation, failed finalization, and atomic publication. |
| Integration | Algorithm32, Flat32, server, type, format, build, runtime-dependency, and supported-hardware gates. |


## Checkpoint Boundaries

Use semantically reviewable checkpoints after C0, accepted E1-E3 evidence and
D0 selection, P1 contracts, P2 generator, P3 transport, P4 integration, P5
qualification, and P6 publication cleanup. Do not combine POC selection,
production adaptation, and deployment activation in one checkpoint.


## Current State And Next Action

The POC lane is active and C0 is accepted. Its current run identities,
artifact-set hashes, measurements, and verification results are owned by the
[experiment status](../../poc-experiments/engineering-studies/distant-sun-cache-optimization/status.md).
No decoder dependency, candidate format, generator, runtime loader, or package
artifact has been selected for production. The next action is E1; production
source remains unchanged.

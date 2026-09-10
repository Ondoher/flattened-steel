# Distant-Sun Shared-Block Cache Production Plan

Status: D1 production architecture and P1 executable format contracts are
complete. The contained experiments are closed; P2 production generation is
next.

This plan executes the
[distant-Sun cache optimization design](distant-sun-cache-optimization-design.md).
The design owns representation and architectural decisions. This document owns
dependency order, trackable work, completeness requirements, qualification,
and rollout. The existing one-degree package set and dense runtime remain the
production control until P8 accepts the replacement.

## Completion Target

Replace the duplicated 109-package inventory and per-selection dense-scene
reconstruction with a production-owned shared-block pipeline:

```text
8x8 Native15 spectral blocks
  -> byte-lane shuffle + Zstandard level 6
  -> authenticated Worker decode and packet construction
  -> bounded RGBA32F GPU block atlas
  -> frame-boundary row metadata and live-light publication
```

The promotion is complete only when:

- all 109 current scene payloads reconstruct byte-for-byte from the production
  shared set;
- ordinary runtime loading uses authenticated shared blocks without rebuilding
  a complete dense scene;
- a 24-layer packet atlas preloads its initial current/predicted window and
  keeps later blocks ahead of playback through predictive preparation;
- prepared animation changes metadata and coherent live lighting without
  recompiling the shader or replacing the whole mode;
- corruption, cancellation, prediction misses, supersession, context loss,
  allocation failure, and darkness preserve a valid last-good publication;
- storage, generator, transfer, decode, packet construction, upload, host
  memory, GPU memory, and native-4K frame behavior are measured separately;
- rollout has an explicit dense-cache fallback and recorded rollback; and
- the temporary dense bridge and duplicated deployed inventory are removed
  after acceptance so one production path remains.

## Selected Defaults And Boundaries

| Concern | Initial production selection |
| --- | --- |
| Shared storage | D0 `8x8` blocks, wavelength-major Native15 Float32 spectra, `float32-byte-lane-v1`, Zstandard level 6 |
| Complete candidate target | At most 600 MB including metadata; contained control was 506,490,201 bytes |
| Generator target | At most 15 minutes on the comparison machine; preserve at least 17.23 GB scene staging plus 1.34 GB canonical staging or qualify a lower-disk replacement |
| Browser transport | Persistent module Worker, feature-detected native decoder, pinned Three r180 `zstddec` WASM fallback, four-request scheduler |
| Ordinary decoded retention | Byte-weighted 64 MiB unpinned LRU; published, candidate, and predicted pins may exceed it and must be diagnosed |
| GPU packet block | One `648x1728` `RGBA32F` layer per authenticated 64-row block, with exact zero sixteenth component |
| Default GPU residency | 24-layer sliding atlas, 429,981,696 bytes before driver overhead |
| Prediction | Preload the initial window; at least one-scene look-ahead, expanded from declared route and animation velocity when preparation time permits |
| Route-resident option | Allowed only when the exact route fits a device-qualified allocation; the accepted 62-layer route is not a whole-inventory guarantee |
| Miss behavior | Hold the last-good scene until a complete successor is ready |
| Rollback | Current dense packages and loader remain selected by an explicit temporary switch through observation |

No stage may change spectral resolution, angular or altitude domains,
interpolation, recurrence order, or physical inputs. Temporal interpolation,
lossy representation, quality presets, the local-Sun cache, and correction of
the known horizon appearance defect are outside this plan.

## Verification Ownership And Placement

### Incremental Verification Cadence

The project owner selected this cadence during production promotion to limit
repeated testing and review. P3-P6 each receive targeted calculation and data
correctness checks and one focused review of the changed implementation before
checkpointing. A correction reopens only its affected checks and review;
unchanged source and documentation-only edits do not restart all review lanes.
Checks that prevent corrupt data or partial publication remain immediate.

P7 owns the complete integration, lifecycle, fault, memory, performance, and
cross-cutting standards review. Its final compliance ledger covers the complete
promotion scope. Earlier exactness evidence remains valid unless a change
affects its calculation, representation, or authenticated inputs; in particular,
the complete P2 generator run is not repeated for browser-only changes.
An intermediate focused review is not a claim that P7 qualification is complete.

The current session reports at its 30-minute effort assessment or the P3
checkpoint, whichever occurs first. Continue when verified implementation is
advancing at a reasonable rate. Stop for reevaluation if redundant work or
owner-provided periodic credit readings show excessive cost.

### Production Owners

All tests and evidence are production-owned. No P1-P8 work may create or use
an experimental unit-test tree.

| Evidence | Production owner and runner |
| --- | --- |
| Algorithm32 contracts, cache objects, controllers, shader assembly, and backend behavior | Co-located `src/algorithm32/**/_tests/` Jasmine specs through `npm run test:algorithm32`; renderer-backed browser cases through `npm run test:algorithm32:three` |
| Flat32 selection, stable-runtime, lighting, shadow, and application behavior | `src/flat32/_tests/` browser specs through `npm run test:ui:flat32:full` |
| Format generation, complete reconstruction, package service, containment, and post-run verification | Production runners and verifiers under `scripts/algorithm32/solar-zenith-cache/`, exposed by named package scripts |
| Native-4K prediction, frame timing, and trace/video evidence | Production drivers under `scripts/flat32/`, exposed by named package scripts and kept separate from runtime source |
| Generated P7 evidence | Ignored `tmp/production-algorithm32/distant-sun-shared-block-cache/runs/<run-id>/` |

Every P7 execution creates a new run directory and never overwrites or reopens
a finalized run. The runner derives repository and output roots from repository
identity, rejects links and escapes, writes monitorable progress, and records
parent artifacts, operations, equations, implementation/tool identities,
material parameters, and output hashes. A production post-run verifier may
inspect the finalized run and must validate its artifact index and terminal
result before the evidence is cited. P1-P6 unit and integration checks stay in
their mapped production test locations; durable measurements and generated
artifacts stay only in the P7 output root.

## Progress Summary

- [x] C0 — Freeze controls and measurement contract.
- [x] E1 — Select exact shared format and compression.
- [x] E2 — Prove browser transport and decoder behavior.
- [x] E3 — Prove bounded common-field generation.
- [x] D0 — Select the `8x8` storage/generator mechanism.
- [x] D1 — Select the production GPU packet, residency, publication, and live-runtime architecture.
- [x] P1 — Implement production format and compatibility contracts.
- [x] P2 — Implement and verify production shared-inventory generation.
- [x] P3 — Implement production browser transport and Worker preparation.
- [x] P4 — Implement renderer-owned packet-atlas primitives.
- [ ] P5 — Implement residency, predictive preparation, and atomic publication.
- [ ] P6 — Integrate the packet shader and stable live runtime.
- [ ] P7 — Generate and qualify the release candidate.
- [ ] P8 — Publish, observe, roll back if necessary, and remove the bridge.

Historical C0-E3 results and D0 identities are owned by the
[storage experiment decision](../../poc-experiments/engineering-studies/distant-sun-cache-optimization/decision.md).
The GPU-residency, packet-rendering, animation, and final-audit identities are
owned by the
[GPU-resident experiment decision](../../poc-experiments/engineering-studies/gpu-resident-shared-block-cache/decision.md).
Production may adapt those mechanisms but never imports experiment code at
runtime or modifies sealed evidence.

## D1 — Production Architecture Freeze

Goal: join the accepted shared storage format to the accepted packet-rendering
shape without preserving dense reconstruction as permanent architecture.

Completed work:

- [x] Reconcile the earlier `4x8` proposal with D0's selected `8x8` blocks.
- [x] Separate compressed spectral storage from RGBA packet GPU publication.
- [x] Select explicit `RG16UI` row-address and `RGBA32I` altitude-ledger metadata.
- [x] Select 24 layers as the bounded default and route-qualified larger atlases as optional.
- [x] Require initial-window preload and predictive off-critical-path preparation.
- [x] Require a stable compiled runtime with coherent cache, Sun, ambient, celestial, and shadow-light updates.
- [x] Record exact memory facts and retain the current dense path as rollout fallback.

Completeness: the design and this plan identify one production architecture,
its resource policy, its experimental evidence boundary, and every remaining
implementation and qualification gate.

## P1 — Production Format And Compatibility Contracts

Goal: make every external and internal cache identity executable and reject
ambiguous data before allocation.

Work:

- [x] Add schema identifiers, JavaScript types, parsers, and validation for the
  package-set report, runtime catalog, configuration manifest, block index,
  scene manifests, and codec profile.
- [x] Keep logical decoded block identity separate from encoded artifact
  identity and record complete derivation parents.
- [x] Validate canonical coordinate ordering, coverage, domains, lengths,
  hashes, paths, codec parameters, and the 16 MiB decoded allocation ceiling.
- [x] Define packet-block, resident-slot, row-address, altitude-ledger,
  prepared-route, and publication-snapshot contracts.
- [x] Freeze the design's canonical mapping from decoded
  `{channel, populated block row, unique direction}` to
  `{resident layer, y, x, RGBA component}`, including logical-to-unique seam
  expansion, x-fastest/no-y-flip upload order, exact Float32 bit copying,
  partial-block row stride, zero unpopulated rows, and synthetic channel 15 in
  packet 3 component 3.
- [x] Version the Flat32 resolution response so the dense and shared package
  sets cannot be confused during rollout.
- [x] Add focused positive and negative tests for duplicates, gaps, overflow,
  unsupported versions, unsafe paths, incompatible physics, and corrupt
  identities.

Completeness: malformed or incompatible data is rejected before network
continuation, decode, packet construction, or GPU allocation can trust it.

## P2 — Production Shared-Inventory Generation

Goal: generate the selected immutable shared set once per physical and
numerical configuration.

Work:

- [x] Compute the union ledger once and preserve the existing J1-J4 recurrence
  and accumulation order.
- [x] Run one common calculation per wavelength with bounded tile readback and
  direct scatter to exact block offsets.
- [x] Finalize one block at a time through validation, byte-lane shuffle,
  Zstandard level 6, decode round trip, and content-addressed publication.
- [x] Use unique staging roots, cancellation, complete final verification,
  atomic publication, and last-good preservation.
- [x] Emit deterministic provenance and timing reports covering computation,
  readback, staging, compression, hashing, reconstruction, and disk usage.

Completeness: a fresh production run reconstructs all 109 control payloads
byte-for-byte, stays within its declared memory and disk bounds, completes in
at most 15 minutes on the comparison machine, and publishes no partial set.

## P3 — Browser Transport And Worker Preparation

Goal: deliver authenticated decoded or packet-ready blocks without blocking
the visible animation path.

Work:

- [x] Implement the repository-owned decoder interface, persistent module
  Worker, native feature detection, and pinned WASM fallback.
- [x] Implement the process-wide four-request scheduler, encoded-artifact
  in-flight map, subscriber accounting, and transferable ownership.
- [x] Validate encoded framing/hash, decoded bound/hash, inverse shuffle, and
  exact spectral layout inside the Worker.
- [x] Add Worker-side RGBA packet construction where measurement confirms that
  transferring packet-ready blocks respects the selected memory bound.
- [x] Implement decoded and packet-ready retention with explicit published,
  candidate, predicted, and prepared-route pins.
- [x] Expose bounded diagnostics for requests, coalescing, queueing, decode,
  authentication, packet construction, transfer, pins, eviction, cancellation,
  and failure.

Completeness: Node and browser tests prove exact decode and packet construction,
bounded allocation, coalescing, partial/final cancellation, eviction,
corruption rejection, Worker failure, and absence of stale delivery or leaked
resources.

## P4 — Renderer-Owned Packet Atlas

Goal: provide production-owned persistent GPU storage with authenticated slot
updates and opaque runtime bindings.

Work:

- [x] Extend the cache-backend contract narrowly for persistent array
  allocation and layer replacement without exposing raw WebGL resources.
- [x] Add `RG16UI` and `RGBA32I` immutable metadata formats and their exact
  typed-array contracts.
- [x] Allocate the 24-layer `648x1728 RGBA32F` atlas only after texture-size,
  layer-count, float-filtering, and declared memory-policy checks.
- [x] Upload one packet layer into an unexposed slot, associate its authenticated
  block identity, and make it eligible for later metadata publication.
- [x] Preserve stable runtime bindings while slots change; implement disposal,
  allocation failure, context loss, and complete restoration.
- [x] Add exact Float32 packet probes, zero-padding probes, metadata readback,
  foreign-handle, malformed-shape, and failed-upload tests. An independent
  dense-control oracle must cover first/last populated rows, partial blocks,
  all 15 channels, every RGBA component, face and seam boundaries, duplicated
  logical seam directions, unavailable-row sentinels, and shader-side metadata
  decoding.

Under the selected incremental cadence, P4's focused GPU evidence uses an
independently constructed spectral fixture and exact metadata values. The
complete immutable dense-control oracle, shader-side integration, and injected
context/upload-failure matrix remain in P7 before activation.

Completeness: a slot is never addressable by a published scene until its exact
packet upload succeeds; allocation or upload failure preserves all currently
published bindings and state.

## P5 — Residency, Prediction, And Atomic Publication

Goal: keep cache preparation ahead of animation while bounding GPU residency.

Work:

- [ ] Port the deterministic 24-slot residency policy with required/predicted
  pins and least-recently-used eviction of unpinned slots.
- [ ] Build and authenticate the initial current/predicted window before
  declaring animation ready.
- [ ] Accept a declared route and velocity when available; otherwise infer
  direction from recent scene requests and maintain at least one-scene
  look-ahead.
- [ ] Fetch, decode, authenticate, packetize, and upload future blocks before
  their presentation deadlines. Ordinary prepared playback should perform
  metadata-only scene changes.
- [ ] Publish a complete current-generation row map and scene ordinal at one
  frame boundary. Preserve the last-good scene on every miss or failure.
- [ ] Handle reversal, seek, nonadjacent jumps, predictor cancellation,
  supersession, darkness at 108 degrees, disposal, and context restoration.
- [ ] Permit a route-resident atlas only after its exact block set passes the
  target's allocation and memory qualification; never infer whole-inventory
  support from the accepted 62-block route.

Completeness: forward and reverse animation, route changes, jumps, and injected
misses never expose a missing, corrupt, stale, evicted, or partially uploaded
row. Diagnostics show whether every change was preloaded, predicted, or held.

## P6 — Packet Shader And Stable Live Runtime

Goal: consume shared packet blocks through the existing spectral algorithm and
change time of day without rebuilding the atmosphere runtime.

Work:

- [ ] Replace dense packed-row addressing with altitude-ledger and row-to-slot
  metadata lookup while retaining the four hardware-filtered RGBA reads and
  Native15 spectral arithmetic.
- [ ] Remove the scalar `R32F` manual-bilinear candidate from production scope.
- [ ] Add live binding values for scene ordinal and distant-Sun direction and
  refresh them without recompilation.
- [ ] Reuse one source/cache controller and one installed shader across scene
  changes rather than constructing a new `SphericalDistantMode` for every bin.
- [ ] Publish cache selection, atmospheric Sun direction, celestial Sun
  placement, receiver environment light, endpoint illumination, shadow-light
  direction, and shadow refresh coherently.
- [ ] Preserve the immediate texture-free dark state and the direct-scene
  fallback on preparation failure.

Completeness: a production animation traverses multiple one-degree scenes with
one compiled shader/runtime. Captured state proves every rendered frame uses a
coherent cache, Sun, ambient-light, celestial, and shadow selection.

## P7 — Release-Candidate Qualification

Goal: prove exactness, lifecycle safety, memory bounds, and useful native-4K
animation behavior before deployment selection changes.

Work:

- [ ] Generate the complete shared set into an ignored immutable qualification
  run with full provenance and post-run verification.
- [ ] Reconstruct and hash all 109 control payloads; compare exact packet probes
  and representative full rendered outputs against the dense control. The
  independent verifier must exercise the complete canonical packet mapping,
  partial and full blocks, all channel/component assignments, zero padding,
  logical seam expansion, row-address sentinels, and altitude-ledger decoding.
- [ ] Run the combined 24-layer packet path with initial preload, predictive
  uploads, reverse motion, seeks, nonadjacent jumps, and forced misses.
- [ ] Measure cold publication, warm reuse, request/decode/packet/upload stages,
  main-thread responsiveness, host peaks, 429,981,696-byte atlas residency,
  context restoration, and transition peaks.
- [ ] Use WebGL GPU timer queries at native 3840x2160 to separate stable frames,
  metadata transitions, predictive uploads, and misses. Measure recording in a
  separate execution and retain trace-faithful viewable evidence.
- [ ] Qualify the 24-layer allocation on the supported target matrix. Qualify
  each larger route-resident policy separately; failure selects the bounded or
  dense fallback rather than weakening safety gates.
- [ ] Inject truncation, oversize declarations, decoder unavailability,
  network failure, corruption, cancellation, supersession, context loss,
  disposal, allocation/upload failure, and the 108-degree dark transition.
- [ ] Run applicable Algorithm32, Flat32, server, type, format, build, and
  runtime-dependency gates. Disclose the known horizon issue and reject any
  candidate-specific regression without assigning the pre-existing defect to
  this cache format.

Completeness: exactness and lifecycle gates pass unconditionally. The complete
set is at most 600 MB, generation is at most 15 minutes on the comparison
machine, normal prepared animation stays ahead of presentation, and accepted
targets remain within declared host/GPU memory. A missed performance target
causes review; it never relaxes correctness.

## P8 — Publish, Observe, And Remove The Bridge

Goal: activate the new format with a recoverable selection change, then leave
one production path.

Work:

- [ ] Publish the immutable set under a new content-addressed root and verify
  containment, caching, content type, and complete-file serving.
- [ ] Change only the explicit catalog/runtime selection after deployed
  identities match the P7 qualification record.
- [ ] Retain the previous immutable package set and dense loader as rollback
  during the observation window. Rollback changes selection and never edits
  either set.
- [ ] Record production observations, any rollback, and the final acceptance
  decision.
- [ ] After acceptance, remove the dense loader, old generator path, temporary
  switch, and duplicated active inventory while preserving designated evidence.
- [ ] Update cache design, current dataflow, deployment inventory, status, and
  release documents to describe only current production behavior.

Completeness: one production shared-block packet path remains, rollback evidence
is recorded, obsolete active assets and bridge code are removed, and current
documentation matches deployed behavior.

## Verification Matrix

| Concern | Required evidence |
| --- | --- |
| Numerical identity | All 109 dense payloads reconstruct byte-for-byte; packet and padding probes match exact Float32 bits. |
| Format integrity | Positive/negative schema, ordering, coverage, length, path, codec, encoded-hash, decoded-hash, and allocation-bound tests. |
| Storage and generation | Complete inventory bytes, deterministic identities, one recurrence per wavelength, bounded staging, cancellation, failed finalization, and atomic publication. |
| Browser transport | Native detection, mandatory WASM fallback, Worker transfer, responsiveness, coalescing, subscriber cancellation, retention, and failure. |
| GPU atlas | Capability checks, 24-layer allocation, exact slot uploads, stable bindings, metadata, disposal, and context restoration. |
| Prediction | Initial preload, forward/reverse look-ahead, route changes, jumps, misses, eviction pins, and deadline diagnostics. |
| Runtime coherence | Cache, Sun direction, celestial placement, ambient/receiver light, endpoint light, and shadow state share one frame-boundary selection. |
| Performance | Native-4K GPU query results for stable, transition, upload, and miss frames; recording measured separately. |
| Integration | Algorithm32, Flat32, server, type, format, build, containment, runtime-dependency, and supported-target gates. |

## Checkpoint Boundaries

Use one semantically reviewable checkpoint after D1 and after each of P1-P8.
Do not combine format contracts, generator changes, renderer primitives,
runtime activation, qualification evidence, or deployment selection in one
checkpoint.

## Current State And Next Action

D0, D1, P1, P2, P3, and P4 are implemented and verified at their selected phase scope. The production generator's
[qualified immutable run](shared-generation-qualification.md) reconstructs all
109 controls exactly, authenticates the persisted graph, and meets the
storage, generation-time, working-disk, and Node-memory bounds. Active
selection and deployed assets remain unchanged. The
[P3 transport checks](shared-transport-verification.md) prove exact decoded and
packet bytes, bounded retention, coalescing, cancellation, and real Worker
transfer/recovery. [P4 GPU probes](shared-atlas-verification.md) establish exact
packet and metadata storage with stable bindings and protected published layers.
Continue P5-P8 in the declared checkpoint order; P7 retains
the complete integration and cross-cutting review gate.

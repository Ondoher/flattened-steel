# Point-Local Compiler Promotion Plan

Status: accepted and complete.

## Objective

Promote the accepted point-local cache-builder behavior into production-owned
Algorithm32 offline compiler modules. The compiler must accept an input scene
list and wavelength selection, calculate the interpolation-closed receiver-local
coordinate union once per wavelength, stage a bounded shared inventory, and
serialize enough indexes and metadata to reconstruct each requested scene
without further scattering calculations.

The accepted contained experiment remains the algorithmic authority. Production
must adapt its behavior without importing experiment modules or modifying its
sealed runs.

## Scope And Compatibility

- Add a production point-local compiler API for explicit physical/numerical
  requests, arbitrary nonempty scene lists, and explicit wavelength indexes.
- Retain Native48, Z180, F68, W27, cumulative J4, exact W27 seam collapse, and
  the existing GPU recurrence implementation.
- Generalize scene count, spectral count, staging strides, block sizes, package
  metadata, and indexed expansion together.
- Keep the deployed Native15 shared-cache generator command, fixed runtime
  package schema, build-request identity, and ledger identity compatible.
- Keep the existing source-aligned Direct40 asset format readable; it is prior
  evidence and is not the correctness implementation for this point-local path.
- Do not change ozone policy, animation behavior, visual tuning, final-view
  integration, runtime cache loading, or published production assets in this
  promotion.

Generated qualification output belongs below
`tmp/algorithm32/point-local-cache-compiler/`. Existing experiment and
qualification output is read-only comparison evidence.

## Implementation

### P1. Production input and inventory owners

- [x] Add production-owned profile projection for the receiver-local Direct40
  construction request and explicit scene records.
- [x] Add the input-driven shared inventory planner with complete validation,
  bounded block planning, ordered duplicate-scene preservation, and scene-to-
  inventory indexes.

Gate: application Native15 inputs retain their pinned request and ledger hashes;
the 17 Direct40 scenes plan the accepted 1,951 coordinates and 96 bounded blocks.

### P2. Bounded compiler execution and package

- [x] Add generalized staging and a single-context browser/host execution path
  that executes each selected wavelength once for the complete union.
- [x] Add a production package writer/reader whose serialized dimensions drive
  validation, channel reads, and exact scene expansion.

Gate: focused fixtures prove ordering, seam-bit equality, bounded block shapes,
duplicate scene reuse, corrupt-index rejection, and exact bit reconstruction.

### P3. Direct40 production proof

- [x] Run the production compiler for the canonical 17-scene Direct40 input as
  one shared execution, or authenticate unchanged GPU output when implementation
  equivalence makes recalculation redundant.
- [x] Compare inventory identities, expanded values, and compiler/package
  metadata with the accepted contained no-ozone result. Use its declared
  radiance limits if a full calculation is required.

Gate: the production profile projection and inventory reproduce the accepted
scene indexes; qualification authenticates the unchanged accepted GPU output,
validates all bounded blocks, and checks indexed expansion without a redundant
Direct40 GPU execution.

### P4. Final compatibility and review

- [x] Run the focused Native15 compatibility, production compiler, Direct40
  calculation/data, type, and formatting checks.
- [x] Complete one consolidated correctness, lifecycle, and security review;
  update this plan with the final result and checkpoint the repository.

The owner has selected focused calculation/data verification plus consolidated
final review instead of a full repeated standards ledger. No exhaustive
standards-compliance claim is made.

## Result

Production now owns `DistantSunPointLocalCacheCompiler` and its profile,
inventory, browser/host, staging, package, and reader collaborators under
`scripts/algorithm32/solar-zenith-cache/`. The command
`npm run build:algorithm32:point-local-cache -- --input INPUT.json --output
REPOSITORY/RELATIVE/RUN --chrome ABSOLUTE_CHROME_PATH` compiles any accepted
nonempty scene list and unique wavelength selection in one browser and WebGL2
context. It executes one full recurrence per selected wavelength, independent
of scene count.

The final application end-to-end proof is
`tmp/algorithm32/point-local-cache-compiler/app-proof-20260910-2`. It compiled
three scene requests, two wavelengths, 1,240 shared coordinates, and 31 blocks
in 8,021.8115 milliseconds. Its coordinates, scene indexes, and every decoded
block hash match accepted experiment run `00002-app-proof`. This proof exercised
the final production compiler, writer, and encoded/decoded package bounds.

Direct40 qualification is recorded at
`tmp/algorithm32/point-local-cache-compiler/qualification-2026-09-11T02-08-49-331Z-291eaa6a-8d18-4311-aebb-ebbb34f167fa/`.
Its accepted terminal seal has SHA-256
`ad42fbb2378a49ed7746dc212a0461709ae8be498bedf80817103115f824be9f`.
The qualification reproduces the accepted 17-scene, 40-channel,
1,951-coordinate, 96-block inventory, authenticates all 96 decoded blocks, and
checks 156,360 indexed expansion bits across the first, middle, and last
selected channels.

The complete Direct40 GPU calculation was not repeated. The accepted parent and
current production path use the same GPU compiler bytes (SHA-256
`5a6b87f567b19112b6635dfee5bf72371fb2411095a35e5060c6996b867420de`),
and their effective shader inputs agree after WebGL Float32 conversion. The
qualification authenticates every decoded parent block before reuse. This
avoids a redundant full calculation while preserving the derivation chain.
It qualifies production profile projection, inventory construction, and reader
expansion over authenticated accepted results; it does not claim that the full
production compiler and package writer were executed for Direct40.

The consolidated final review found and resolved output-root confinement,
qualification trust-root and sealing, encoded/decoded block bounds, and setup
failure terminalization issues. Focused tests now cover source-path rejection,
both package ceilings, setup failure records, variable layout, exact Float32
expansion, corrupt indexes, duplicate-scene reuse, and pinned Native15
identities. No exhaustive standards-compliance claim is made.

The fixed Native15 build-request and ledger identities remain
`sha256:364d05afddbe0fec61f8941fa25ae71b70835706102946f025689d29ff65bf04`
and
`sha256:b5e38741359b0e60ce6155a47941a000192c7aec1b6240d48bf3ab3bb032f671`.
The existing Native15 generator, runtime schema, and published assets were not
changed.

## Acceptance

Promotion is complete when production owns the generalized point-local compiler
and package reader, one invocation can represent all canonical Direct40 scenes
through a shared indexed inventory, the accepted contained result is qualified
through authenticated reuse of unchanged calculation output, and the current
Native15 production path remains compatible. Runtime adoption of the new
package is a separate decision.

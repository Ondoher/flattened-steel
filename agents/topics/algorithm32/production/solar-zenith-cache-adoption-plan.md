# Solar-Zenith Cache Production Adoption

Status: active production-adoption planning topic, current through 2026-08-29.
The contained research plan is complete through P10. Production implementation
has not started, and this topic switch does not by itself authorize writes to
`src/algorithm32`, `src/flat32`, or application surfaces.

## Objective

Replace the implemented spherical distant-Sun receiver-column cache with the
qualified point-local scene cache while preserving Geometry's ray-termination
ownership and Algorithm32's live spectral path integration.

The selected production candidate is:

```text
C4(altitude, localSolarZenith, sourceRelativeOutgoingDirection, Native15)
Native48 / Z180 / W27 / reflection-completed F68 / N4 / Q30
one atomically published cache per scene Sun state
```

The uncompressed Native15 R32F representation remains the correctness oracle.
Exact cubed-sphere seam deduplication is the preferred stored representation
for adoption; lossy codecs remain deferred.

## Qualified Handoff

- Direct40 B1 RMSE: `11.554012538468113 mW m^-2 sr^-1 nm^-1`.
- Published/reproduced Bruneton context: `11.28323859` under the same score.
- Matched Native15 B1: point-local `12.293121003109862`, previous model
  `12.586323005727962`.
- Largest declared W27 scene: solar noon at `162,187,920 bytes`
  (`154.674 MiB`) uncompressed.
- Largest exact seam-deduplicated scene projection: `150,479,388 bytes`
  (approximately `143.508 MiB`) including its logical-direction index.
- Built nautical W27 cache: `161,925,480 bytes` uncompressed.
- Named RTX 2060 evidence: `161,925,480` steady texel bytes,
  `323,850,960` atomic-transition texel bytes, and `485,776,440`
  transition-plus-staging bytes.
- Exact seam codec: `7.219105973933194%` saving on the built nautical cache,
  zero mismatches across `40,481,370` scalars, and 63 exact GPU probes.

The canonical numerical design and contained evidence remain owned by the
[solar-zenith cache design](../cache/solar-zenith-cache-design.md) and
[completed execution plan](../cache/distant-sun-solar-zenith-cache-plan.md).

## Adoption Boundaries

- Distant collimated Sun only. The finite/local Sun remains unchanged.
- One complete cache per scene Sun state; continuous Sun animation remains
  deferred.
- Geometry continues to supply the first object, ground, or atmosphere-exit
  ray length.
- Algorithm32 continues to integrate actual path points using Q30.
- Native15 remains spectral through atmosphere and celestial composition.
- Camera state, object identity, object depth, and display state do not become
  cache dimensions.
- Object motion changes ray termination only and does not invalidate the
  atmospheric cache.
- Object-cast volumetric shadows remain outside the static cache.
- The current production cache remains the rollback baseline until the new
  path passes production gates and is explicitly selected.
- Historical Algorithm32-Star evidence remains immutable and comparison-only.

## Immediate Focus

Begin with a read-only production migration inventory. Map the qualified
contained owners onto the existing production source, geometry, cache,
controller, shader, renderer, profile, and application seams. The inventory
must identify direct replacements, retained owners, obsolete receiver-column
assumptions, asset/build-tool boundaries, runtime resource changes, and every
affected verification lane before production code changes.

Because the repository containment policy still restricts new implementation
to `scripts/extraterrestrial/` and generated output to
`tmp/extraterrestrial/`, the first production-source edit requires an explicit
owner authorization expanding that boundary.

## Adoption Sequence

### PA0 — Production migration inventory and frozen acceptance contract

- map every implemented receiver-column owner and consumer;
- freeze the selected point-local semantics, Q30 rule, seam codec, asset
  identity, failure behavior, and rollback boundary;
- identify production files and tests that would change;
- separate reusable production infrastructure from contained-only code; and
- predeclare production gates before candidate output is inspected.

### PA1 — Production contracts and executable domains

- add point-local cache, packed-row ledger, manifest, and scene-Sun identity
  contracts directly to the production architecture;
- retain Native48, Z180, W27, F68, Native15, and N4 executable ownership;
- implement exact logical-to-unique W27 seam mapping; and
- remove no old contract until its replacement consumer exists.

### PA2 — Offline asset compiler

- adapt the qualified GPU recurrence into a production-owned offline builder;
- emit independently loadable scene assets, ledgers, manifests, hashes, and
  complete derivation records;
- retain uncompressed output as the oracle and emit seam-deduplicated output
  as a separately identified derivative; and
- prove deterministic rebuilds without runtime construction requirements.

### PA3 — Resident cache and point-local lookup

- load and validate one complete scene cache;
- reconstruct altitude, local solar zenith, and source-relative W27 direction
  at each actual path point;
- decode exact seam indices without changing Native15 values;
- reject unsupported coordinates explicitly; and
- preserve opaque cache binding and ownership boundaries.

### PA4 — Geometry-length and Q30 runtime cutover

- retain Geometry's existing visible ray length;
- replace receiver-column lookup with point-local lookup inside the existing
  Algorithm32 path integration;
- adopt the qualified quadratic-near-observer Q30 interval rule;
- retain endpoint composition `L_atmosphere + T_view * L_surface`; and
- keep local Sun, Color, celestial sources, and scene-object ownership
  unchanged.

### PA5 — Publication and lifecycle

- prove reuse, failed replacement preservation, atomic publication,
  supersession, context restoration, cache swapping, and disposal;
- enforce measured steady and transition resource policies;
- retain the previous cache until the candidate is complete; and
- preserve an explicit rollback path during adoption.

### PA6 — Production qualification

- rerun the unchanged Direct40 and matched Native15 B1 gates;
- reproduce all six B1 figures regardless of outcome;
- compare the production path with sealed contained outputs and sparse probes;
- cover solar noon, sunset, twilight, complete rotation, ground, atmosphere,
  and object-shortened rays;
- verify exact uncompressed/seam-decoded parity; and
- measure supported-hardware load, upload, frame, steady, transition, and
  observed process/driver memory where the platform exposes it.

### PA7 — Selection and cleanup

- obtain owner selection of the qualified production path;
- remove the obsolete receiver-column runtime only after rollback and release
  gates close;
- update canonical production status and dataflow documents;
- preserve all historical and contained evidence; and
- make no local-Sun or continuous-animation claim by implication.

## Promotion Gates

- Direct40 aggregate B1 RMSE must remain at or below
  `11.820391604126252 mW m^-2 sr^-1 nm^-1`.
- Matched Native15 must not regress beyond the previous model's
  `12.586323005727962` score.
- Seam-decoded values must be exact relative to the uncompressed Native15
  cache.
- Production geometry endpoints and Q30 sampling must match the selected
  contained contract.
- All requested renders and B1 figures are written regardless of gates.
- Failure, cancellation, supersession, and context loss must preserve or
  restore a complete usable cache.
- Resource limits must be attached to named hardware evidence; opaque driver
  overhead may not be inferred from logical texel bytes.
- Production promotion and removal of the old path require explicit owner
  approval.

## Current Next Step

Execute PA0 as a read-only production migration inventory. Do not modify
production source until the owner explicitly authorizes expansion beyond the
current contained implementation boundary.

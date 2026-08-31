# Solar-Zenith Cache Production Adoption

Status: PA0 through PA7 complete as of 2026-08-29. A provisional complete
0-degree through 108-degree inventory is built and byte-verified but is not yet
eligible for nearest-degree deployment. The contained research plan is complete
through P10. Production now contains the direct PA1
contract/domain replacement, PA2 offline compiler, PA3 resident asset loader
and point-local cache, and the PA4 exact-asset/Q30 live transport and selected
Color path.

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

Offline cache building is the selected production plan. The spherical/distant
runtime will not execute the recurrence. It resolves an exact prebuilt scene
asset, validates and uploads it, and publishes it atomically. The production
offline compiler owns recurrence execution and emits the payload, ledger,
manifest, hashes, and derivation record.

## Qualified Handoff

- Fresh production-qualification Direct40 B1 RMSE:
  `11.554012508326005 mW m^-2 sr^-1 nm^-1`.
- Published/reproduced Bruneton context: `11.28323859` under the same score.
- Fresh matched Native15 B1: point-local `12.293120970348504`, previous model
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
- The shared Algorithm32 geometry/cache import contract remains generic across
  spherical/distant and flat/local. It carries physical sample context, not a
  solar-zenith-specific or source-specific cache shape.
- One complete cache per scene Sun state; continuous Sun animation remains
  deferred.
- The six qualified states are a deployment seed, not final product coverage.
  The final offline inventory must cover all non-dark hours at provisionally
  one-degree solar-angle increments. Its darkness cutoff, bin ownership, and
  within-bin error require explicit qualification.
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

PA1 through PA5 are complete. Shared transport passes pairing-neutral physical
sample context, each concrete cache interprets that context with its geometry,
and Flat/local retains its existing cache coordinates. The distant-Sun closure
owns executable Z180, exact W27 seam mapping, packed-row ledger, and manifest
acceptance. The production offline compiler emits independently loadable,
content-addressed oracle and exact-seam packages without importing contained
experiment code. The PA3 loader accepts only exact compatible manifests,
ledgers, hashes, payload shapes, spectra, and direction maps before eagerly
uploading the complete R32F/R16UI binding group. The resident cache derives
altitude, local solar zenith, and the source-relative W27 frame at each actual
path point and rejects missing ledger rows with a non-value rather than a
clamped or zero spectrum. Distant runtime cache creation now requires an exact
selected prebuilt asset, installs its manifest direction as the exact Geometry
source placement, and integrates the resident contribution with the qualified
quadratic-boundary/midpoint Q30 rule inside Geometry's unchanged endpoint.

PA6 production qualification is complete. Flat32
selects the accepted Bruneton-derived, source-luminance-driven global lift
qualified by runs `000466` and `000467`. Algorithm32 derives its one condition
scalar from geometry-supported, atmosphere-transmitted direct-source
irradiance; setup does not replace it with a diffuse sky measurement. Runtime
recurrence, a receiver-column/point-local switch, and a Flat/local solar-
zenith dimension remain prohibited. The owner selected the qualified offline
zenith-aware path for production on 2026-08-29. The strict six-state catalog is
now the normal Flat32 resolver, and run `000585` proves runtime-only package
emission for all six exact assets at `901,034,856` total bytes. The obsolete
receiver-column GPU cache/controller are removed while the CPU reference
recurrence remains. Selection does not broaden the local-Sun or animation
claims.

The final deployment catalog is generated rather than hand-maintained. The
first complete construction inventory covers integer solar-zenith angles from
0 through 108 degrees in
`tmp/extraterrestrial/production-adoption/one-degree-inventory-20260829-1`.
Its 109 unique cache packages contain `17,411,056,920` oracle bytes and
`16,154,147,172` exact-runtime bytes. Independent streaming verification in
`one-degree-inventory-verification-20260829-1` matched every manifest, ledger,
R32F payload, and R16UI index SHA-256. The largest exact package is
`150,966,348` bytes at 9 degrees. Mean GPU compiler time was
`46,786.74587155263 ms`; total measured GPU compiler time was
`5,099,755.299999237 ms`. Only one selected cache remains resident; total
shipped/offline storage scales with inventory count. This inventory remains
explicitly deployment-ineligible until its darkness cutoff, bin policy, and
within-bin error pass qualification. The current exact
resolver remains correct for its six records and must not silently become a
nearest-degree resolver before those gates exist.
The final application calculates the scene solar-zenith angle and submits only
that scalar to a server cache-resolution entry point. The endpoint applies the
qualified bin policy and returns a small exact descriptor and content-addressed
package URLs. Model and cache compatibility remain manifest facts validated by
the client, not resolver inputs. Immutable cache payloads remain static
CDN/object-store assets built offline rather than being generated or embedded
in the API response.

## Adoption Sequence

### PA0 — Production migration inventory and frozen acceptance contract

- [x] map every implemented receiver-column owner and consumer;
- [x] freeze the selected point-local semantics, Q30 rule, seam codec, asset
      identity, failure behavior, and rollback boundary;
- [x] identify production files and tests that would change;
- [x] separate reusable production infrastructure from contained-only code;
      and
- [x] predeclare production gates before candidate output is inspected.

PA0 result: [production migration inventory and frozen acceptance
contract](solar-zenith-cache-pa0-inventory.md).

### PA1 — Production contracts and executable domains

- [x] replace the shared sampling seam with one pairing-neutral physical sample
      context implemented by both spherical/distant and flat/local;
- [x] add point-local cache, packed-row ledger, manifest, and scene-Sun identity
      contracts only to the distant-Sun implementation closure;
- [x] retain Native48, Z180, W27, F68, Native15, and N4 executable ownership;
- [x] implement exact logical-to-unique W27 seam mapping; and
- [x] update both supported pairing consumers and their tests in the same direct
      contract replacement.

### PA2 — Offline asset compiler

- [x] adapt the qualified GPU recurrence into a production-owned offline builder;
- [x] emit independently loadable scene assets, ledgers, manifests, hashes, and
      complete derivation records;
- [x] retain uncompressed output as the oracle and emit seam-deduplicated output
      as a separately identified derivative; and
- [x] prove deterministic rebuilds without runtime construction requirements.

The first production rebuild is
`tmp/extraterrestrial/production-adoption/pa2-nautical-rebuild-20260829`. It
reproduces the sealed P9 oracle SHA-256
`d7948cd1611cf2b5949093e60340be51bff392aeaf3c882145f4521376080b66`,
the sealed P10 exact-seam SHA-256
`db662148ce282e890b547a4db5deddbbfe5fff980a4f604709ad4739c0bab8d3`,
and the exact logical-to-unique index SHA-256
`9b3873eb3529ecda1aa1569172ccb6bc85c4d22e3e037d3ddf8639452bfe34c8`.
Its cache identity is
`algorithm32-distant-sun-scene-cache-sha256:a9b3115f2ae57cc3aa5a262f87aee9d24176c7ee14ad08cc892171ba8126976b`.

### PA3 — Resident cache and point-local lookup

- [x] load and validate one complete scene cache;
- [x] reconstruct altitude, local solar zenith, and source-relative W27 direction
      at each actual path point;
- [x] decode exact seam indices without changing Native15 values;
- [x] reject unsupported coordinates explicitly; and
- [x] preserve opaque cache binding and ownership boundaries.

PA3 proof
`tmp/extraterrestrial/production-adoption/pa3-resident-cache-20260829`
loaded the exact PA2 nautical package on an NVIDIA GeForce RTX 2060 through
WebGL 2/ANGLE D3D11. It accepted cache identity
`algorithm32-distant-sun-scene-cache-sha256:a9b3115f2ae57cc3aa5a262f87aee9d24176c7ee14ad08cc892171ba8126976b`,
eagerly uploaded `4058 x 617 x 15 R32F` and `4374 x 1 R16UI` textures in
`2040.8000001907349 ms`, installed both opaque bindings, and reported zero
WebGL errors. The focused real-WebGL lane passed `2/2`; the deterministic Node
lane passed `596/596`.

### PA4 — Geometry-length and Q30 runtime cutover

- [x] retain Geometry's existing visible ray length;
- [x] replace receiver-column lookup with point-local lookup inside the existing
      Algorithm32 path integration;
- [x] adopt the qualified quadratic-near-observer Q30 interval rule;
- [x] retain endpoint composition `L_atmosphere + T_view * L_surface`; and
- [x] keep local Sun, Color, celestial sources, and scene-object ownership
      unchanged.

PA4 proof
`tmp/extraterrestrial/production-adoption/pa4-live-transport-20260829-9`
loaded the exact PA2 nautical asset and rendered the production-assembled path
on an NVIDIA GeForce RTX 2060 through WebGL 2/ANGLE D3D11. It retained cache
identity
`algorithm32-distant-sun-scene-cache-sha256:a9b3115f2ae57cc3aa5a262f87aee9d24176c7ee14ad08cc892171ba8126976b`,
used exact model direction
`[-0.7579900644516986, 0.6298667113517853, -0.16946677586889025]`,
executed 30 quadratic-near-observer midpoint intervals, completed two frames
in `60202.5 ms`, and reported zero render and WebGL errors. Its object-free
center ray had a zero hit mask; its opaque-object control had a full hit mask
and decoded `1352.4295511757794 m` against the independent Three ray/box
intersection at `1349.9018344197025 m`. Both requested renders were retained.
The current Ferwerda proof control saturates this twilight view, while a prior
plain-Bruneton control mapped it to black. Ferwerda was already rejected by
the owner and these captures are diagnostic only. PA4 cannot close until the
same live transport is rendered through the accepted contained
`BrunetonSourceLuminanceLiftColorDisplayModel` contract qualified by runs
`000466` and `000467`; no Ferwerda tuning is permitted as a repair.

The production-only proof is
`tmp/extraterrestrial/production-adoption/pa4-live-transport-20260829-14`.
It loads the exact PA2 cache, executes the production Q30 point-local path, and
selects the production `BrunetonSourceLuminanceLiftColorDisplayModel` through
Flat32's ordinary factory with no experiment adapter. It also
installs Geometry's production `local-spherical-patch` visual endpoint; a
lower-frame proof ray receives the full scene hit mask at
`2.9206279421601224 meters`, while the center horizon ray remains
unobstructed. Because
the scene Sun is below the local horizon, its atmosphere-transmitted direct-
source luminance is exact zero and the accepted curve selects gamma `0.125`
with its `32768` gain cap. The object-free center is `[194, 35, 37, 255]`; the
object-shortened center is `[255, 202, 77, 255]`; geometry endpoint checks and
WebGL execution pass. The object-free image retains the selected blue upper
sky, purple transition, and red-orange horizon. The `-13` contained-adapter
proof remains its visual target; `-12` omitted the Three spherical-ground
object and remains diagnostic only.

The refreshed deterministic lane passed `604/604`, both production typechecks
passed, and the Flat32 browser lane passed all `8/8` active tests with its
pre-existing full-production-cache case skipped.

### PA5 — Publication and lifecycle

- [x] prove reuse, failed replacement preservation, atomic publication,
      supersession, context restoration, cache swapping, and disposal;
- [x] enforce measured steady and transition resource policies;
- [x] retain the previous cache until the candidate is complete; and
- [x] preserve an explicit rollback path during adoption.

PA5 proof
`tmp/extraterrestrial/production-adoption/pa5-lifecycle-20260829-7`
loads the exact PA2 asset on an NVIDIA GeForce RTX 2060 through WebGL 2/ANGLE
D3D11. Exact reuse performs no second load; an incompatible replacement
preserves the active cache; a same-context full replacement publishes before
retiring its predecessor; and a real WebGL context cycle releases invalid
old-context resources during loss, retains the exact asset selection, and
reloads a complete cache after restoration. Initial load is `2212.7 ms`,
restoration load is `2198.8 ms`, and the final WebGL error is zero. The exact
nautical resident payload is `150,235,908 bytes`; its measured logical atomic
transition is `300,471,816 bytes`, and transition plus candidate staging is
`450,707,724 bytes`, within the respective `300,958,776` and `451,438,164`
qualified maxima. Deterministic lifecycle coverage, including cancellation,
supersession, failed replacement, resource rejection, swapping, restoration,
and idempotent disposal, passes in the `609/609` Node lane. The Flat32 browser
lane passes all `8/8` active tests with its existing full-cache case skipped.

### PA6 — Production qualification

- [x] rerun the unchanged Direct40 and matched Native15 B1 gates;
- [x] reproduce all six B1 figures regardless of outcome;
- [x] compare the production path with sealed contained outputs and sparse probes;
- [x] cover solar noon, sunset, twilight, complete rotation, ground, atmosphere,
      and object-shortened rays;
- [x] verify exact uncompressed/seam-decoded parity; and
- [x] measure supported-hardware load, upload, frame, steady, transition, and
      observed process/driver memory where the platform exposes it.

PA6 result:
`tmp/extraterrestrial/production-adoption/pa6-final-qualification-20260829-1`.
Direct40 passes at `11.554012508326005`; matched Native15 passes at
`12.293120970348504`, `0.29320203537945844` below the previous-model ceiling.
Run `000583` retains all six figures. The production nautical package matches
the sealed P9/P10 hashes and has zero mismatches across `40,481,370` decoded
scalars plus 63 named probes. Five newly built exact assets combine with the
nautical asset to cover all six requested Sun states; twelve live renders
cover atmosphere exit and object shortening, while every scene also proves
the spherical-ground endpoint and Q30. Solar noon is the largest resident
exact-seam asset at `150,479,388 bytes`. WebGL2/ANGLE exposes no opaque driver
allocation metric, so none is inferred from logical texel bytes.

### PA7 — Selection and cleanup

- [x] obtain owner selection of the qualified production path;
- [x] remove the obsolete receiver-column GPU runtime while preserving the CPU
      reference recurrence;
- [x] add the exact deployment catalog and runtime-only package emitter;
- [x] update canonical production status and dataflow documents;
- [x] preserve all historical and contained evidence; and
- [x] make no local-Sun or continuous-animation claim by implication.

PA7 implementation evidence is
`tmp/extraterrestrial/runs/000585-pa7-deployment-package`. Its six emitted
packages contain only each exact manifest, ledger, seam-deduplicated R32F
payload, and logical-to-unique R16UI index; oracle payloads are excluded. Both
typechecks, the `590/590` deterministic lane, the Flat32 build, and `10/10`
active Flat32 browser tests pass. The older distant-Sun celestial-composition
WebGL fixture now supplies a complete production-shaped exact scene asset
through the real controller and a fixture-local byte-loader seam, retains
Geometry's spherical-ground endpoint, and exercises the current three-pass
scene/celestial/atmosphere pipeline. Its independent continuous-disk oracle,
blocking, FOV, composition, and lifecycle checks pass without a skip or reduced
cache shape. The fixed 500-member stellar raster retains all members while
using a runtime-uniform loop bound and asynchronous Three compilation, avoiding
driver compile expansion and Karma heartbeat loss without reducing the shader
workload. The unfiltered `npm run test:algorithm32:three` gate passes `23/23`
in `108.409 seconds`; the refreshed deterministic lane passes `590/590`, and
the Algorithm32 typecheck passes.

### Post-PA7 one-degree inventory construction

- [x] add a resumable immutable production compiler driver for integer
      solar-zenith angles;
- [x] build one independent cache for every degree from 0 through 108;
- [x] finalize a generated inventory index with exact package identities and
      storage totals;
- [x] independently stream and verify every manifest, ledger, oracle payload,
      exact payload, and logical-direction index by SHA-256; and
- [ ] qualify darkness cutoff, bin ownership, and within-bin error before
      deployment or nearest-degree resolution.

The source inventory is
`tmp/extraterrestrial/production-adoption/one-degree-inventory-20260829-1`.
The verifier accepted all 109 unique packages in
`tmp/extraterrestrial/production-adoption/one-degree-inventory-verification-20260829-1`.

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

Production adoption and inventory construction are complete. Flat32 hookup,
generated deployment packaging, scalar-solar-zenith resolution, and the
remaining bin/darkness gates are owned by the focused
[Flat32 one-degree scene-cache hookup plan](flat32-one-degree-cache-hookup-plan.md).
Do not restore runtime recurrence, add a compatibility bridge, or add an
old/new distant-Sun switch.

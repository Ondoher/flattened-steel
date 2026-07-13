# Algorithm32 Feature Transaction Plan

Status: Step 5 active; `F01-bruneton-color` through
`P01-construction-boundary` are complete and green. This document owns the
dependency-ordered execution queue, transaction boundaries, feature manifests,
prospective-graph rules, and gates for the feature-implementation
reorganization. It authorizes no move by itself; Step 5 executes one listed
transaction at a time.

Baseline: commit `0fb9be9e625012e92ec1128c362f0f8cd1211d39`, source
identity
`sha256:7d7810f7b69b7516bfdd25058360d62cd4b586176d7692ca90fd5655f1398832`.

The canonical file destinations remain the
[target-owner map](implementation-feature-target-map.md). The canonical public
and construction contracts remain the
[interface and export contract](implementation-feature-contracts.md).

## Manifest Selection Rule

A transaction manifest contains every target-map row whose `Final owner`
matches the transaction owner, plus only the explicitly listed declaration
slice, public-barrel merge, newly created contract support, and affected
consumers. That row selection is exact; a transaction may not opportunistically
move another owner. Retained `profiles/native-15` and `repository-support` rows
are audited but never treated as moves.

The map contains 295 source files: 293 ordinary rows and the declared
`gpu-runtime/cache/types.d.ts` and `runtime/facade/types.d.ts` split rows. All 295 sources exist. Case-folded
source paths are unique. Planned destinations are case-fold unique except for
the intentional merge of `adapters/react/index.js` and
`ground-boundaries/index.js` into `implementation/index.js`. No different
planned destination currently exists. The merge is not a duplicate module:
each owning transaction contributes only its reviewed named exports to the one
barrel and removes its old barrel.

## Dependency-Ordered Queue

| Order | Transaction                     | Exact target-map selection                                                                                                                               | Additional scope and reason                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `F01-bruneton-color`            | All 6 `implementation/bruneton-color` rows plus the 1 `interfaces/color` row                                                                             | Create `implementation/index.js`; update the four exact consumers listed below. Independent leaf and first public export.                                                                                                                                                                                                                                                                   |
| 2     | `F02-uniform-lambertian-ground` | All 4 implementation rows, the 1 `interfaces/ground-boundary` row, and the `ground-boundaries/index.js` merge row                                        | Add only `UniformLambertianGroundBoundary` to the existing barrel and update its consumers.                                                                                                                                                                                                                                                                                                 |
| 3     | `F03-three-cache-backend`       | All 5 implementation rows plus the public cache-backend declarations from the one split row                                                              | Move public backend contracts to `interfaces/cache-backend`; leave only internal GPU-runtime declarations in the source file until `I10-gpu-cache-runtime`.                                                                                                                                                                                                                                 |
| 4     | `P01-construction-boundary`     | The `interfaces/geometry` and `interfaces/light-source` rows plus both targets of the split facade declaration row; no caller-facing implementation move | Implement the completed observation and geometry-to-light-source contract at current implementation paths, move Flat32 placement work into the two geometry classes, place facade-private declarations at the future `implementation/algorithm32` owner, and create the private shared solar-position support selected below. This is one cross-owner API prerequisite, not a feature move. |
| 5     | `F04-canonical-atmosphere`      | All 5 implementation rows plus the 1 `interfaces/atmosphere` row                                                                                         | Flat32 no longer imports canonical constants after `P01`; update remaining class consumers to the public barrel.                                                                                                                                                                                                                                                                            |
| 6     | `F05-flat-earth`                | All 18 `implementation/flat-earth` rows                                                                                                                  | Move the complete geometry closure, including `FlatSynchronizer`; add only `FlatEarthGeometry` to the barrel.                                                                                                                                                                                                                                                                               |
| 7     | `F06-spherical-earth`           | All 14 `implementation/spherical-earth` rows                                                                                                             | Move the complete geometry closure and add only `SphericalEarthGeometry`.                                                                                                                                                                                                                                                                                                                   |
| 8     | `F07-distant-sun`               | All 38 `implementation/distant-sun` rows                                                                                                                 | Move the complete source, cache, CPU, shader, Three, test, and fixture closure; add only `DistantSunLightSource`.                                                                                                                                                                                                                                                                           |
| 9     | `F08-local-sun`                 | All 33 `implementation/local-sun` rows                                                                                                                   | Move the complete local-source closure and add only `LocalSunLightSource`.                                                                                                                                                                                                                                                                                                                  |
| 10    | `I01-geometry-support`          | All 4 `geometry-support` rows                                                                                                                            | Rehome only after both geometry siblings prove the shared dependency. Include the `SolarPosition` support created by `P01`; it already resides at this final owner and is audited, not moved.                                                                                                                                                                                               |
| 11    | `I02-light-source-support`      | All 12 `light-source-support` rows                                                                                                                       | Rehome after both Sun implementations. No public export.                                                                                                                                                                                                                                                                                                                                    |
| 12    | `I03-ground-transport`          | The 1 `ground-transport` row                                                                                                                             | Rehome its complete current closure independently.                                                                                                                                                                                                                                                                                                                                          |
| 13    | `I04-sampling-domains`          | All 19 `sampling-domains` rows                                                                                                                           | Rehome domains only after geometry and Sun consumers have canonical paths.                                                                                                                                                                                                                                                                                                                  |
| 14    | `I05-physical-quantities`       | All 3 internal rows plus the 1 `interfaces/physical-quantities` row                                                                                      | Split public unit-bearing value aliases from executable unit operations.                                                                                                                                                                                                                                                                                                                    |
| 15    | `I06-spectral-values`           | All 7 internal rows plus the 1 `interfaces/spectral-quantities` row                                                                                      | Keep concrete builders internal and public readonly contracts declaration-only.                                                                                                                                                                                                                                                                                                             |
| 16    | `I07-math`                      | All 13 `math` rows                                                                                                                                       | Rehome one cohesive reusable mechanism; Flat32 may retain only approved public-value imports.                                                                                                                                                                                                                                                                                               |
| 17    | `I08-time-validation-identity`  | The 1 `time`, 2 `validation`, and 3 `value-identity` rows as three sequential green subtransactions                                                      | These are three distinct owners and checkpoints; the queue groups their dependency position, not their commits.                                                                                                                                                                                                                                                                             |
| 18    | `I09-atmospheric-transport`     | All 20 `atmospheric-transport` rows                                                                                                                      | Rehome after quantity, spectral, math, validation, and identity owners.                                                                                                                                                                                                                                                                                                                     |
| 19    | `I10-shader-assembly`           | All 17 `shader-assembly` rows                                                                                                                            | Rehome after feature shader contributors and transport contracts are stable.                                                                                                                                                                                                                                                                                                                |
| 20    | `I11-gpu-cache-runtime`         | All 5 ordinary rows plus the internal remainder of the split declaration row                                                                             | Finish the cache-backend declaration split; no public implementation export.                                                                                                                                                                                                                                                                                                                |
| 21    | `I12-rendering-runtime`         | All 20 `rendering-runtime` rows                                                                                                                          | Rehome after shader assembly, GPU runtime, backend, and feature adapters.                                                                                                                                                                                                                                                                                                                   |
| 22    | `I13-reference-execution`       | All 3 `reference-execution` rows                                                                                                                         | Rehome executable reference orchestration independently.                                                                                                                                                                                                                                                                                                                                    |
| 23    | `I14-reference-evidence`        | All 4 `reference-evidence` rows                                                                                                                          | Rehome retained current fixtures and evidence without altering values.                                                                                                                                                                                                                                                                                                                      |
| 24    | `F09-algorithm32`               | All 9 `implementation/algorithm32` rows; its public declaration row was moved by `P01`                                                                   | Move facade/model closure after every implementation and internal collaborator has a canonical path; add only `Algorithm32`.                                                                                                                                                                                                                                                                |
| 25    | `F10-react-three`               | All 9 implementation rows plus the `adapters/react/index.js` merge row                                                                                   | Move last; add its five reviewed public exports and update the remaining Flat32 runtime imports.                                                                                                                                                                                                                                                                                            |
| 26    | `R01-final-reconciliation`      | The 5 retained `profiles/native-15` and 4 retained `repository-support` rows                                                                             | Audit all 295 original rows, the split products, `SolarPosition`, public exports, external consumers, and gates; move nothing.                                                                                                                                                                                                                                                              |

The three owners at order 17 execute as `I08a-time`, `I08b-validation`, and
`I08c-value-identity`. No queue row permits two caller-facing feature moves in
one transaction.

## Construction-Boundary Prerequisite

`P01` is required because the new facade-mediated binding cannot be introduced
by moving either geometry or either Sun independently without leaving a broken
constructor or a temporary old/new contract. It changes the current paths in
place, returns all gates to green, and moves no caller-facing feature.

The shared calculation is partitioned as follows:

- `geometry-support/solar/SolarPosition.js` is a new non-public owner for the
  common UTC solar declination, equation-of-time, and subsolar geographic
  position calculation used by both geometries.
- `FlatSynchronizer` remains private to `flat-earth` and owns only its
  flat-orbit calibration and closest-approach time policy, delegating the
  common solar position calculation.
- `FlatEarthGeometry` owns the azimuthal-equidistant projection, observer-local
  finite-source position, local-source height, projection radius, and derived
  radial cache extent.
- `SphericalEarthGeometry` owns geographic receiver localization and the
  observer-frame distant-source direction.
- Flat32 retains location/time preset selection and labels and passes only
  `GeometryObservation`.

Before `P01` executes, its implementation manifest must enumerate the complete
static impact closure of the four changed constructors, two geometry classes,
facade preparation, shader/cache identity, Flat32 modes/controller/types, and
all affected current tests. It may not add a celestial-source method or modify
the accepted extraterrestrial placement-state contract.

## First Transaction Manifest: `F01-bruneton-color`

### Moves

| Current path under `src/algorithm32`                         | Target path under `src/algorithm32`                                         |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `color/bruneton/_tests/bruneton-color-display-model.spec.js` | `implementation/bruneton-color/_tests/bruneton-color-display-model.spec.js` |
| `color/bruneton/_tests/consts.js`                            | `implementation/bruneton-color/_tests/consts.js`                            |
| `color/bruneton/BrunetonColorDisplayModel.js`                | `implementation/bruneton-color/BrunetonColorDisplayModel.js`                |
| `color/bruneton/consts.js`                                   | `implementation/bruneton-color/consts.js`                                   |
| `color/bruneton/types.d.ts`                                  | `implementation/bruneton-color/types.d.ts`                                  |
| `color/bruneton/types/BrunetonColorDisplayModel.d.ts`        | `implementation/bruneton-color/types/BrunetonColorDisplayModel.d.ts`        |
| `color/types.d.ts`                                           | `interfaces/color/types.d.ts`                                               |

Create `src/algorithm32/implementation/index.js` with the sole public runtime
export `BrunetonColorDisplayModel` from
`./bruneton-color/BrunetonColorDisplayModel.js`. The class declares
`@implements {Color}`. No constant, test helper, declaration, default alias, or
private module enters the barrel.

### Exact consumer edits

- `src/flat32/FlatLocalMode.js` imports `BrunetonColorDisplayModel` from the
  new public implementation barrel.
- `src/flat32/SphericalDistantMode.js` imports it from the same barrel.
- `src/algorithm32/gpu-assembler/runtime/_tests/DistantSphericalOwnerShaderContributions.spec.js`
  uses the public implementation path.
- `src/algorithm32/runtime/rendering/three/_tests/stage10-spectral-composition.browser.js`
  uses the public implementation path.

The moved feature test updates only its relative imports. Archived
reconciliation documents remain unchanged. The current inventory and target
map retain their pre-move evidence until final reconciliation archives them.

### Prospective graph and collision result

- All eight new destinations—the seven move targets and new public barrel—are
  absent at the Step 4 baseline.
- The source paths are case-fold unique, and the targets introduce no
  case-only collision.
- Feature-private imports remain inside `bruneton-color`; imports of current
  shared spectral/math mechanisms remain at their still-valid owners until
  their dedicated transactions.
- The feature imports no sibling implementation private path, test module,
  archive, experiment, or retired Algorithm32-Star material.
- The four consumer changes create no production dependency on tests and no
  cycle. Flat32 depends only on the public implementation barrel.
- The old seven paths are removed in the same transaction; no alias,
  re-export, duplicate implementation, or default export remains.

### Required gates

Run all of the following after the move and before recording its checkpoint:

1. exact manifest verification: every listed source is absent, every target is
   present, and no unlisted Algorithm32 path moved;
2. stale-path and export audit for `color/bruneton`, the four consumers,
   default exports, and `implementation/index.js`;
3. prospective/import graph audit for unresolved imports, cycles,
   sibling-private edges, production-to-test edges, and archive/experiment
   dependencies;
4. `npm run typecheck:algorithm32` and `npm run typecheck:flat32`;
5. Prettier check over the moved feature, interface declaration, barrel, and
   four consumers, followed by `git diff --check`;
6. `npm run test:algorithm32`;
7. `npm run test:algorithm32:three` because the affected browser composition
   spec imports the implementation;
8. `npm run test:ui:flat32` and `npm run build` because both application modes
   change their public import path; and
9. source-identity/checkpoint recording only after every preceding gate is
   green.

### `F01` green checkpoint

Completed on 2026-08-05. All seven old paths are absent, all seven move
targets and the new barrel are present, and the only changed runtime consumers
are the four approved files. The barrel exports only
`BrunetonColorDisplayModel`; its class declares `@implements {Color}`. The
stale-path, default-export, unresolved-import, cycle, sibling-private,
production-to-test, archive, experiment, and retired-evidence audits are clean.

The post-transaction production tree contains 296 files. Its checkpoint
identity is
`sha256:19317acf392eb0da45495b9d6cca4666a313b27fa519607eda5de78ca122cc73`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The additional file is the new public implementation barrel; the
seven moves preserve the original inventory-row count.

Verification passed:

- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier check and `git diff --check`;
- `npm run test:algorithm32` with 456 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`F02-uniform-lambertian-ground`; its exact manifest and prospective graph must
be expanded and reviewed before any `F02` source edit.

## Second Transaction Manifest: `F02-uniform-lambertian-ground`

Status: complete and green. The initial public material set is grass only;
snow is deferred and is not an accepted value or placeholder.

### Moves and barrel merge

| Current path under `src/algorithm32`                                                     | Target path under `src/algorithm32`                                                          |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ground-boundaries/uniform-lambertian/_tests/uniform-lambertian-ground-boundary.spec.js` | `implementation/uniform-lambertian-ground/_tests/uniform-lambertian-ground-boundary.spec.js` |
| `ground-boundaries/uniform-lambertian/consts.js`                                         | `implementation/uniform-lambertian-ground/consts.js`                                         |
| `ground-boundaries/uniform-lambertian/types.d.ts`                                        | `implementation/uniform-lambertian-ground/types.d.ts`                                        |
| `ground-boundaries/uniform-lambertian/UniformLambertianGroundBoundary.js`                | `implementation/uniform-lambertian-ground/UniformLambertianGroundBoundary.js`                |
| `ground-boundaries/types.d.ts`                                                           | `interfaces/ground-boundary/types.d.ts`                                                      |

Merge `ground-boundaries/index.js` into the existing
`implementation/index.js`: retain its current Bruneton export, add only the
named `UniformLambertianGroundBoundary` export, and remove the old barrel in
the same transaction. No old-path re-export, default alias, constant,
declaration, or feature-private helper enters the public barrel.

`ground-boundaries/shared/cache/consts.js` is not part of `F02`; it remains at
its valid current path until `I03-ground-transport`.

### Required feature-contract changes

- The class declares `@implements {GroundBoundary}` and
  `@implements {CacheBuildContributor}`.
- `UniformLambertianGroundBoundaryOptions` contains required
  `material: UniformLambertianGroundMaterial` and optional `id`; caller-owned
  `albedo` is removed directly with no compatibility branch.
- `UniformLambertianGroundMaterial` is the documented closed literal type
  `"grass"`. Snow and ocean are not members.
- The feature's `consts.js` owns the exact native-15 grass values and
  `algorithm32-bruneton-grass-native-15-bin-average-v1` provenance identity.
  The class constructs and retains its native-15
  `SpectralReflectancePacket` internally.
- Omitted `Config.groundBoundary` remains the only canonical black-ground
  selection. The transaction adds no explicit black material.
- The moved feature spec is rewritten around grass construction, the exact
  owned native-15 packet, BRDF/cache behavior, optional-ID identity
  differences, and invalid material ingress. It retains no test of the removed
  caller-albedo option and no snow placeholder.

### Exact consumer edits

The moved feature spec's unchanged `../../index.js` spelling resolves to the
public implementation barrel after the move. These six additional current
consumers are the complete old-barrel import set:

- `src/algorithm32/profiles/native-15/_tests/native-15-profile.spec.js` removes
  the obsolete profile-albedo-to-boundary handoff and its concrete boundary
  import; the retained profile tests remain owned by their later contract
  transaction.
- `src/algorithm32/light-sources/distant-sun/cache/_tests/DistantSunGpuOwnerModules.spec.js`
  imports from `../../../../implementation/index.js` and uses grass or omission
  according to the behavior under test.
- `src/algorithm32/light-sources/distant-sun/cache/_tests/DistantSunCacheController.spec.js`
  removes its dependency on caller-configurable concrete albedo; grass covers
  the concrete implementation path, while controller-specific collaborator
  variations use current test-local interface fixtures rather than a public
  constructor escape hatch.
- `src/algorithm32/light-sources/local-sun/cache/_tests/local-sun-cache-controller.spec.js`
  imports from `../../../../implementation/index.js` and uses grass or
  omission.
- `src/algorithm32/light-sources/local-sun/cache/_tests/local-sun-cache-plan.spec.js`
  imports from `../../../../implementation/index.js` and uses grass or
  omission.
- `src/algorithm32/light-sources/local-sun/cache/_tests/local-sun-cpu-cache.spec.js`
  imports from `../../../../implementation/index.js` and derives reflective
  expectations from the selected owned material packet.

No Flat32 production module currently constructs a ground boundary. During
execution, the current ground design document and production README must be
updated to the live paths and named-material contract; the inventory and
target map retain their baseline evidence until final reconciliation.

### Collision and prospective-graph result

- All five new move destinations are absent. The sole existing target is the
  intentional `implementation/index.js` merge established by Step 4.
- The five move targets and barrel source are case-fold unique. The merge adds
  a distinct named export and creates no symbol or destination collision.
- The implementation and feature test remain at the same depth beneath
  `src/algorithm32`, so their shared-owner relative imports remain valid. The
  class additionally depends on the retained native-15 profile owner to build
  its fixed packet; no sibling implementation-private import is permitted.
- The changed graph has no reverse dependency from profiles, quantities,
  validation, or GPU assembly into this feature, so the new barrel edge creates
  no cycle. Production code imports no test, archive, experiment, or retired
  evidence path.
- Removing the old barrel and updating the six consumers leaves no resolving
  `ground-boundaries/index.js` import. The remaining
  `ground-boundaries/shared/cache` path is a different approved owner, not an
  alias or partial feature closure.

### Pinned grass record and required gates

The source authority is
`references/downloads/bruneton-clear-sky-models-4df2ec6/atmosphere.cc`, SHA-256
`cdc22ef5095ce4f5297055e3ad32301d0138f7b2ad8ef282761fcfce4d053888`.
Its `kGrassAlbedo` table contains 45 dimensionless samples at 10-nanometer
spacing from 360 through 800 nanometers, inclusive.

Native-15 uses bin-average semantics. For each canonical channel, production
must integrate the piecewise-linear interpolation of that source table over
the complete interval `center - width / 2` through `center + width / 2`, divide
by the channel width, and use constant endpoint extension outside 360-800
nanometers. In canonical channel order, the exact binary64 input literals are:

```text
[
  0.019048226950354637,
  0.02364468085106386,
  0.029747517730496487,
  0.03198794326241139,
  0.03727375886524819,
  0.07302127659574442,
  0.08300354609929061,
  0.0623652482269502,
  0.05144397163120558,
  0.03979361702127652,
  0.05599361702127641,
  0.24616808510638172,
  0.5058297872340412,
  0.5784297872340411,
  0.5869829787234028
]
```

This record closes the only initial material input. Snow remains a later
contract expansion and is not an `F02` dependency.

Execution must pass the exact-manifest, stale-path,
export, unresolved-import, cycle, sibling-private, production-to-test, archive,
experiment, and retired-evidence audits; both type checks; scoped Prettier and
`git diff --check`; `npm run test:algorithm32`;
`npm run test:algorithm32:three`; `npm run test:ui:flat32`; and
`npm run build`. The browser/application gates remain required because their
consumers import the shared public implementation barrel even though Flat32
does not yet instantiate this ground feature.

### `F02` green checkpoint

Completed on 2026-08-05. All six old feature/interface/barrel paths are absent,
all five move targets are present, and `implementation/index.js` exports only
the two completed public classes. `ground-boundaries/shared/cache/consts.js`
remains unchanged for its later `I03-ground-transport` transaction. The class
declares both required interfaces, accepts only the required `"grass"`
material plus optional `id`, constructs the pinned owned packet, and exposes no
caller-albedo or snow compatibility path.

The post-transaction production tree contains 295 files. Its checkpoint
identity is
`sha256:d15fe7465d5ac8a036db89fd158fe6933f94b9acd3b26a786c7d37a934d97eb7`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The count returns from 296 to 295 because this transaction merges
and removes the old ground barrel rather than creating another public barrel.

The exact manifest, stale-path, export, unresolved-import, cycle,
sibling-private, production-to-test, archive, experiment, and retired-evidence
audits are clean. Verification passed:

- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier check and `git diff --check`;
- `npm run test:algorithm32` with 453 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`F03-three-cache-backend`; its exact manifest, declaration split, consumers,
collision result, and prospective graph must be expanded and reviewed before
any `F03` production edit.

## Third Transaction Manifest: `F03-three-cache-backend`

Status: complete and green. Execution remained one feature transaction and
did not include `P01` or another implementation owner.

### Moves and barrel merge

| Current path under `src/algorithm32`                       | Target path under `src/algorithm32`                                   |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `gpu-runtime/cache/three/_tests/three-webgl.browser.js`    | `implementation/three-cache-backend/_tests/three-webgl.browser.js`    |
| `gpu-runtime/cache/three/_tests/ThreeCacheBackend.spec.js` | `implementation/three-cache-backend/_tests/ThreeCacheBackend.spec.js` |
| `gpu-runtime/cache/three/ThreeCacheBackend.js`             | `implementation/three-cache-backend/ThreeCacheBackend.js`             |
| `gpu-runtime/cache/three/types.d.ts`                       | `implementation/three-cache-backend/types.d.ts`                       |
| `gpu-runtime/cache/three/types/ThreeCacheBackend.d.ts`     | `implementation/three-cache-backend/types/ThreeCacheBackend.d.ts`     |

Merge one named export into the existing `implementation/index.js`:
`ThreeCacheBackend` from
`./three-cache-backend/ThreeCacheBackend.js`. Retain the existing Bruneton
color and uniform-Lambertian ground exports unchanged. No default export,
alias, renderer resource, declaration, diagnostic helper, or private type
enters the public barrel.

The class declares `@implements {CacheGpuBackend}` and
`@implements {CacheProbeReader}`. The second tag records the existing internal
diagnostic capability; it does not make `CacheProbeReader` a global public
contract.

### Exact declaration split

Create `interfaces/cache-backend/types.d.ts` by extracting exactly these nine
declarations from `gpu-runtime/cache/types.d.ts`, preserving their current
contracts and documentation:

- `GpuCacheField`;
- `CacheGpuProgram`;
- `CacheLayerSubmission`;
- `CacheRuntimeBinding`;
- `CacheRuntimeBindings`;
- `CacheRuntimeBindingInstallRequest`;
- `CacheGpuCapabilities`;
- `CacheGpuBackend`; and
- `CacheBuildScheduler`.

The current `gpu-runtime/cache/types.d.ts` remains live and retains every
other declaration, including `CacheAssembler`, `CacheProbeReader`, probe
request/result declarations, executor configuration/options, construction
plans and shaders, field ids/specifications/storage, diagnostics, and build
artifacts. Those declarations move only with `I11-gpu-cache-runtime`.

The extracted declarations continue to name ambient internal construction
types such as `CacheFieldId`, `CacheFieldStorage`, `CacheFieldSpec`,
`CacheShader`, and `CacheBinding`. This is an intentional declaration-only
edge into the still-current GPU construction contract, not a runtime import or
a promise of a third-party backend SDK. The split introduces no duplicate
declaration and no temporary alias.

### Exact consumer and relative-import edits

- `src/flat32/Algorithm32Runtime.js` imports `ThreeCacheBackend` from
  `../algorithm32/implementation/index.js`.
- `src/algorithm32/adapters/react/Algorithm32AtmosphereComposer.js` imports
  it from `../../implementation/index.js`.
- The moved Node feature spec retains its feature-relative
  `../ThreeCacheBackend.js` import.
- The moved browser spec retains its feature-relative backend import, changes
  its repository Three import to
  `../../../../../node_modules/three/build/three.module.js`, and changes its
  three GPU-assembler imports from four parent traversals to three.
- The moved implementation changes its two GPU-assembler imports from three
  parent traversals to two and changes its cache `consts.js` import to
  `../../gpu-runtime/cache/consts.js`.

No ambient declaration consumer requires a path import edit because the
Algorithm32 type-check configuration includes both declaration roots. The
Karma Algorithm32 Three lane uses recursive source and browser-spec patterns,
so its configuration needs no path change.

During execution, update the two current path-owning documents that still say
the concrete backend lives under `gpu-runtime/cache/three`:

- `agents/topics/algorithm32/cache/cache-design.md`; and
- `agents/topics/extraterrestrial/production-api-ownership-contract.md`.

Also update `src/algorithm32/README.md`, whose current-state summary must list
the third completed feature transaction.

The baseline inventory and target map remain immutable migration evidence
until final reconciliation.

### Collision and prospective-graph result

- All six new destinations (the five move targets and
  `interfaces/cache-backend/types.d.ts`) are absent. The sole existing target
  is the intentional `implementation/index.js` merge.
- Current Algorithm32 paths are case-fold unique; all move and split targets
  are distinct and introduce no case-only collision.
- The feature retains runtime dependencies only on the current shared
  `gpu-assembler/cache-pass` owner and `gpu-runtime/cache/consts.js`. Those are
  valid non-public collaborators until `I10-shader-assembly` and
  `I11-gpu-cache-runtime`; neither imports this feature, so the move creates no
  cycle.
- The declaration-only edge from `interfaces/cache-backend` to internal
  ambient construction values creates no JavaScript dependency and no
  declaration duplication.
- The React composer and Flat32 consumers depend only on the public
  implementation barrel. The barrel does not export the React composer yet,
  so its new import creates no reverse edge or cycle.
- The feature imports no sibling implementation private path, production code
  imports no test module, and no moved or changed source depends on an
  archive, experiment, generated output, or retired Algorithm32-Star material.
- Removing all five old feature paths and updating both production consumers
  leaves no live deep import or compatibility artifact. The retained
  `gpu-runtime/cache/types.d.ts` and `gpu-runtime/cache/consts.js` are distinct
  shared owners, not partial copies of the Three feature.

### Required gates

Execution must pass:

1. exact-manifest verification for the five moves, declaration extraction,
   retained internal declaration file, and barrel merge;
2. stale-path, public-export, declaration-uniqueness, default-export, and both
   consumer-import audits;
3. unresolved-import, cycle, sibling-private, production-to-test, archive,
   experiment, generated-output, and retired-evidence scans;
4. `npm run typecheck:algorithm32` and `npm run typecheck:flat32`;
5. scoped Prettier over the feature, interface declaration, barrel, two
   consumers, and two current documents, followed by `git diff --check`;
6. `npm run test:algorithm32` for the moved Node feature spec and all ambient
   consumers;
7. `npm run test:algorithm32:three` for the moved WebGL spec and React composer
   consumer;
8. `npm run test:ui:flat32` and `npm run build` for the Flat32 runtime consumer;
   and
9. source-identity and green-checkpoint recording only after every preceding
   gate passes.

The expected production-tree count after execution is 296 files: the five
moves preserve file count, the declaration split adds one file while retaining
the internal source, and the barrel is merged in place.

### `F03` green checkpoint

Completed on 2026-08-05. All five old Three-backend paths are absent, all five
feature targets and the new cache-backend interface declaration are present,
and `gpu-runtime/cache/types.d.ts` retains only the reviewed internal
remainder. The public barrel exports exactly the three completed concrete
features. `ThreeCacheBackend` declares both `CacheGpuBackend` and the internal
`CacheProbeReader` capability, while Flat32 and the React composer import the
class only through the public barrel.

The post-transaction production tree contains 296 files. Its checkpoint
identity is
`sha256:5af2c4d87d3ecb3b7ece1df66632b1942f71cd772301d1b21d26ba1fbef7eca1`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The five moves preserve count and the declaration split adds the
one new file.

The exact-manifest, stale-path, public-export, declaration-uniqueness,
default-export, unresolved-import, cycle, sibling-private,
production-to-test, archive, experiment, generated-output, and
retired-evidence audits are clean. The runtime graph contains 222 JavaScript
or JSX modules and 637 resolving internal edges with zero unresolved imports,
cycles, or production-to-test edges. Verification passed:

- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier check and `git diff --check`;
- `npm run test:algorithm32` with 453 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`P01-construction-boundary`; its exact static impact closure and prospective
graph must be expanded and reviewed before any `P01` production edit.

## Construction-Boundary Manifest: `P01-construction-boundary`

Status: reviewed execution boundary. P01 changes the spatial construction
contract at current implementation paths and moves no caller-facing concrete
implementation. Native-spectral constructor cleanup remains in the owning
`F04`, `F07`, and `F08` feature transactions; P01 removes only caller-computed
placement properties and the facade `spectral` property selected by the
completed public contract.

### Declaration moves, split, and new shared support

| Current path under `src/algorithm32` | P01 target or disposition                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `geometry/types.d.ts`                | Move to `interfaces/geometry/types.d.ts` and add observation, placement, request, and configuration behavior.                                                      |
| `light-sources/types.d.ts`           | Move to `interfaces/light-source/types.d.ts` and add `GeometryConfigurableLightSource`.                                                                            |
| `runtime/facade/types.d.ts`          | Move public declarations to `interfaces/algorithm32/types.d.ts`; extract the five reviewed facade-private declarations to `implementation/algorithm32/types.d.ts`. |
| None                                 | Create `geometry-support/solar/SolarPosition.js`, its internal declarations, and focused behavioral specification.                                                 |

The public `Config` gains required `observation` and removes `spectral`.
`Algorithm32` resolves the native-15 basis internally, validates and
normalizes observation once, and calls geometry-to-source configuration before
constructing model, reference, shader, or cache collaborators.

### Exact implementation and application closure

P01 changes these production modules in place:

- `runtime/facade/Algorithm32.js` and its facade specification;
- `geometry/flat/FlatEarthGeometry.js`, `geometry/flat/types.d.ts`, and
  `geometry/flat/consts.js`;
- `geometry/spherical/SphericalEarthGeometry.js` and
  `geometry/spherical/types.d.ts`;
- `light-sources/distant-sun/DistantSunLightSource.js` and its declarations;
- `light-sources/local-sun/LocalSunLightSource.js` and its declarations;
- `extraterrestrial/sun/FlatSynchronizer.js`, which retains flat-orbit and
  closest-time policy while delegating common solar position;
- `flat32/LocationTimeController.js`, `FlatLocalMode.js`,
  `SphericalDistantMode.js`, `Flat32Application.js`, `consts.js`, `index.js`,
  and `types.d.ts`.

The direct construction/test consumers are the current facade, flat-geometry,
spherical-geometry, distant-source, local-source, source-cache,
GPU-owner-module, and transport-cache specifications returned by the static
constructor scans. Their edits replace fixtures with current observation and
binding behavior; no test asserts removal of a historical property or path.

### Selected implementation boundary

- `SolarPosition` owns canonical UTC validation plus the shared NOAA-style
  declination, equation-of-time, world-anchor, and subsolar geographic result.
- `FlatSynchronizer` owns only flat daily-orbit calibration and
  closest-approach time policy.
- Spherical geometry converts the shared subsolar location and observation
  location into its observer/model frame.
- Flat geometry owns azimuthal-equidistant projection, local source height,
  projection radius, model position, and derived radial cache maximum.
- Each source accepts one exact geometry placement, treats an exact repeat as
  a no-op, and rejects placement-dependent operations before binding.
- Geometry rejects an incompatible source family before source or geometry
  mutation, stages its complete placement-dependent closure, installs the
  placement on the source, and only then publishes its own binding.
- Facade replacement retains the existing atomic preparation/publication
  lifecycle. A different observation requires fresh geometry and source
  objects; a non-spatial replacement may reuse an exact binding.

### Collision and prospective graph result

The four declaration/support destination roots are absent except for the
already established `implementation/algorithm32` parent namespace. The new
solar owner is non-public and imports only current angle/time operations.
Geometry depends on that shared owner; it does not import its sibling or an
application module. Sources receive geometry-resolved values and perform no
coordinate transform. Flat32 depends only on public facade/model constructors
at their still-current paths and retains no model-space placement. The
prospective graph contains no sibling-private cycle, production-to-test edge,
archive/experiment dependency, or compatibility alias.

Execution must pass exact declaration/constructor/consumer coverage, stale
placement and import scans, both type checks, scoped Prettier and
`git diff --check`, the complete Algorithm32 Node lane, Three/WebGL, Flat32 UI,
and production build before recording the P01 checkpoint.

### `P01` green checkpoint

Completed on 2026-08-06. Observation is a required facade input, each geometry
resolves and installs the compatible light-source placement before facade
collaborators are prepared, and exact-repeat binding is the only permitted
reuse. Flat32 retains observation selection but no longer computes model-space
source placement. The public geometry, light-source, and facade declarations
are under `interfaces`; facade-private declarations are under
`implementation/algorithm32`; and shared solar placement support is under
`geometry-support/solar`.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:7be56ff1e6489f9e4a9b1b70938ae0fcc65656c421f42cdbf77721d2d1a98921`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 602
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`F04-canonical-atmosphere`.

## Fourth Feature Transaction Manifest: `F04-canonical-atmosphere`

Status: reviewed execution boundary. Execution is limited to the canonical
atmosphere feature, its global atmosphere declaration, its public barrel
export, and the exact consumers below.

### Moves and barrel merge

| Current path under `src/algorithm32`                       | Target path under `src/algorithm32`                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `atmospheres/canonical/_tests/CanonicalAtmosphere.spec.js` | `implementation/canonical-atmosphere/_tests/CanonicalAtmosphere.spec.js` |
| `atmospheres/canonical/CanonicalAtmosphere.js`             | `implementation/canonical-atmosphere/CanonicalAtmosphere.js`             |
| `atmospheres/canonical/consts.js`                          | `implementation/canonical-atmosphere/consts.js`                          |
| `atmospheres/canonical/types.d.ts`                         | `implementation/canonical-atmosphere/types.d.ts`                         |
| `atmospheres/canonical/types/CanonicalAtmosphere.d.ts`     | `implementation/canonical-atmosphere/types/CanonicalAtmosphere.d.ts`     |
| `atmospheres/types.d.ts`                                   | `interfaces/atmosphere/types.d.ts`                                       |

Merge only `CanonicalAtmosphere` from
`./canonical-atmosphere/CanonicalAtmosphere.js` into
`implementation/index.js`. Constants, private declarations, and helpers do not
enter the public barrel. The class declares `@implements {AtmosphereModel}` and
`@implements {CacheBuildContributor}`.

### Constructor and consumer closure

`CanonicalAtmosphere` removes caller spectral-basis ingress and always owns
the native-15 basis. Its optional configuration accepts only a complete
`constants` override; omission selects the feature-owned canonical constants.
This preserves custom physical atmosphere parameters without exposing private
defaults and lets callers construct the standard implementation directly.

Flat32's two modes construct the default atmosphere through the public barrel
and no longer import canonical constants. All other class consumers in the
GPU-assembler, transport-cache, distant-Sun cache, and local-Sun cache
specifications also import the class through the barrel and remove their
spectral-basis constructor property. The native-15 profile and internal
fixtures that need physical constants update their direct private import to
the moved `consts.js`; those constants remain implementation data, not a
public export. The moved feature specification remains feature-relative and
is rewritten around the owned native-15 basis. Ambient declaration consumers
need no path import edits.

### Collision and prospective-graph result

All seven new destinations are absent except for the intentional existing
`implementation/index.js` merge. The destinations are case-fold unique. The
feature depends on the retained native-15 profile for its owned basis, while
that profile depends only on the feature's standalone `consts.js`; the class
module is not imported by the profile, so the prospective JavaScript graph is
acyclic. Consumers depend on the public implementation barrel for the class;
no moved module imports that barrel. No compatibility alias, default export,
sibling-feature private import, production-to-test edge, archive/experiment
dependency, or generated-output dependency is introduced.

### Required gates

Execution must pass exact move and stale-path audits; public-export,
constructor-ingress, declaration-uniqueness, unresolved-import, cycle, and
forbidden-edge scans; both type checks; scoped Prettier and `git diff --check`;
the complete Algorithm32 Node lane; the affected Three/WebGL and Flat32 UI
lanes; and the production build. Record source identity and the green
checkpoint before beginning `F05-flat-earth`.

### `F04` green checkpoint

Completed on 2026-08-06. All six old atmosphere paths are absent and all six
canonical destinations are present. `CanonicalAtmosphere` is the fourth named
export in `implementation/index.js`, declares its two reviewed interfaces,
owns the native-15 basis, accepts an optional physical-constants override, and
uses its feature-owned constants when constructed without configuration.
Flat32 imports neither the class nor constants through a private path.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:04be7e66e0ebcb807503ab3d26547f07053486e7c81966bebb142721d15f9beb`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 605
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- the focused feature specification with 11 specs and 0 failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`F05-flat-earth`; its exact manifest must be expanded and reviewed before its
production paths move.

## Fifth Feature Transaction Manifest: `F05-flat-earth`

Status: reviewed execution boundary. Execution is limited to the 18 exact
target-map rows owned by `implementation/flat-earth`, one public barrel export,
and the consumers below.

### Exact moves

The synchronization slice moves from `extraterrestrial/sun` to
`implementation/flat-earth/synchronization`: `FlatSynchronizer.js`,
`types.d.ts`, `types/FlatSynchronizer.d.ts`, and
`_tests/flat-synchronizer.spec.js`.

The complete `geometry/flat` closure moves to `implementation/flat-earth`:
`FlatEarthGeometry.js`, `FlatGeometryCacheModuleProvider.js`,
`FlatGeometryShaderContributor.js`, `FlatScatteringCacheGeometry.js`,
`consts.js`, `types.d.ts`, `types/FlatEarthGeometry.d.ts`,
`types/FlatScatteringCacheGeometry.d.ts`, the flat-geometry specification, and
the `three` subtree containing `ExactFlatGroundObject.js`,
`FlatGeometrySceneAdapter.js`, their declarations, and the exact-ground
specification.

Merge only `FlatEarthGeometry` from
`./flat-earth/FlatEarthGeometry.js` into `implementation/index.js`. The class
declares `GeometryModel`, `CacheBuildContributor`, and the flat-request
specialization `CacheTransportDataProvider<FlatCacheTransportDataRequest>`.
Synchronization, cache, shader, scene, exact ground, constants, and
declarations remain private to the feature.

### Exact consumer and import closure

- `FlatLocalMode` and the three local-Sun cache specifications import
  `FlatEarthGeometry` through `implementation/index.js`.
- `LocationTimeController` imports private `FlatSynchronizer` from the new
  feature-local synchronization path; it does not become a barrel export.
- Moved flat modules retarget their former `geometry/shared` imports while
  retaining valid shared geometry-support, domain, GPU assembly/runtime,
  math, validation, and Three edges.
- Moved synchronization modules retarget math, time, and solar-support imports
  for their additional path depth.
- Feature-relative test and declaration references remain feature-relative.
- The Algorithm32 Three Karma host retargets its two flat scene-module
  preprocessing keys so bare Three imports remain browser-resolvable.
- Current architecture, extension, extraterrestrial API, and production status
  documents that name either old source path update to the canonical owner.
  Historical archives, the baseline inventory, and target-map evidence remain
  unchanged.

### Collision and prospective-graph result

All 18 destinations are absent except for the intentional existing
`implementation/index.js` merge; destinations are case-fold unique. The moved
feature depends only on shared internal owners and does not import the public
barrel or a sibling concrete implementation. No retained shared owner imports
the feature, so the prospective runtime graph is acyclic. The one application
deep import is intentionally private synchronization use and does not widen
the API. No compatibility alias, duplicate implementation, new default
export, production-to-test edge, archive/experiment dependency, or generated
output dependency is introduced.

### Required gates

Execution must pass exact 18-row move and stale-path audits; public-export,
declaration-uniqueness, unresolved-import, cycle, sibling-private, and
forbidden-edge scans; both type checks; scoped Prettier and `git diff --check`;
focused flat geometry, synchronizer, and exact-ground specifications; the full
Algorithm32 Node and Three/WebGL lanes; Flat32 UI; and the production build.
Record source identity and the green checkpoint before beginning
`F06-spherical-earth`.

### `F05` green checkpoint

Completed on 2026-08-06. All 18 old flat-geometry and synchronization paths
are absent and all 18 canonical feature paths are present. The public barrel
exports `FlatEarthGeometry` and no feature-private collaborator.
`CacheTransportDataProvider` is request-generic so the class truthfully
declares its flat/local transport-request specialization while the spherical
implementation retains the default request contract. The Karma host follows
the moved flat Three modules.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:5baf3e1ec0d610a857483b7064fed4b2b45b124ff62c84d785056a9cd59f863c`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 600
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 40 focused flat geometry, synchronization, and exact-ground specs with 0
  failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`F06-spherical-earth`.

## Sixth Feature Transaction Manifest: `F06-spherical-earth`

Status: reviewed execution boundary. Execution is limited to all 14
`implementation/spherical-earth` target-map rows, one public barrel export,
and the exact consumers below.

### Exact moves and public merge

Move the complete `geometry/spherical` closure to
`implementation/spherical-earth`: `SphericalEarthGeometry.js`, its cache-module
provider, shader contributor, scattering-cache geometry, constants, root and
class declarations, geometry specification, and the complete `three` subtree
with scene adapter, exact sphere endpoint, declarations, and specification.

Merge only `SphericalEarthGeometry` into `implementation/index.js`. The class
declares `GeometryModel`, `CacheBuildContributor`, and
`CacheTransportDataProvider`. Every cache, shader, scene, exact-ground,
constant, and declaration collaborator remains private to the feature.

### Exact consumer and import closure

`SphericalDistantMode`, the GPU-owner and transport-cache specifications, and
the three distant-Sun cache specifications import `SphericalEarthGeometry`
through the public implementation barrel. Moved modules retarget only their
former `geometry/shared` edges; all other feature-relative and shared-owner
imports retain their relative meaning. The Algorithm32 Three Karma host
retargets its two spherical scene preprocessing keys. No ambient declaration
consumer needs a path import edit.

### Collision and prospective-graph result

All 14 destinations are absent except for the intentional existing public
barrel merge, and all are case-fold unique. The feature imports shared
geometry, solar, domain, GPU assembly/runtime, math, validation, and Three
owners; none introduces a reverse feature edge. Consumers use the public
barrel, while the moved feature never imports it. The prospective graph is
acyclic and adds no compatibility alias, duplicate implementation, sibling
private edge, production-to-test edge, archive/experiment dependency, or
generated-output dependency.

### Required gates

Execution must pass exact move and stale-path audits; public-export,
declaration-uniqueness, unresolved-import, cycle, sibling-private, and
forbidden-edge scans; both type checks; scoped Prettier and `git diff --check`;
focused spherical geometry and exact-ground specs; the full Algorithm32 Node
and Three/WebGL lanes; Flat32 UI; and the production build. Record source
identity and the green checkpoint before beginning `F07-distant-sun`.

### `F06` green checkpoint

Completed on 2026-08-06. All 14 old spherical-geometry paths are absent and
all 14 canonical feature paths are present. The public barrel exports
`SphericalEarthGeometry` and no private feature collaborator; the class
declares its three reviewed capability interfaces. All class consumers use the
public barrel and the Karma host follows the moved Three modules.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:56ee166abf090b9d6a793ee27f800dd0cd3d1188b5f7edad054c37135669cf50`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 598
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 31 focused spherical geometry and exact-ground specs with 0 failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`F07-distant-sun`.

## Seventh Feature Transaction Manifest: `F07-distant-sun`

Status: reviewed execution boundary. Execution is limited to all 38
`implementation/distant-sun` target-map rows, one public barrel export, the
owned native-15 constructor cleanup, and the exact consumers below.

### Exact move and public merge

Move the entire 38-file `light-sources/distant-sun` closure without splitting
it: public source class, shader contributor, cache/controller/provider, CPU
evaluators and fields, construction domains, Three lighting adapter, constants,
declarations, all specifications, and both checked-in parity fixtures. Merge
only `DistantSunLightSource` into `implementation/index.js`.

The class declares `LightSourceModel` and
`GeometryConfigurableLightSource`. It retains required intrinsic angular-radius
configuration, removes caller irradiance, and installs the canonical native-15
source packet internally. Geometry placement remains the one-shot P01 binding.
All other moved exports remain private implementation collaborators.

### Exact consumer and import closure

Flat32's spherical mode and local scene-lighting type check, plus external
GPU-assembler and transport-cache specifications, import the public class
through `implementation/index.js`. Transport field-operation specifications
retarget the private field-packing path; cache orchestration specifications
retarget private cache/controller paths. Every direct source construction
removes the obsolete irradiance argument. Moved modules retarget their shared
light-source support imports for the new owner depth while feature-relative
imports remain stable. Current cache-policy links and the extraterrestrial API
ownership path update to the canonical owner; historical and target-map
evidence remain unchanged.

### Collision and prospective-graph result

All 38 destinations are absent except for the intentional public barrel merge,
and all are case-fold unique. The feature imports shared support, profiles,
domains, transport, GPU, geometry contracts, validation, math, and Three; none
imports the feature through a reverse runtime edge. External consumers use the
barrel only for the public class and canonical private paths for explicitly
internal collaborators. No compatibility alias, duplicate implementation,
new default export, production-to-test edge, archive/experiment dependency, or
generated-output dependency is introduced.

### Required gates

Execution must pass exact 38-row move and stale-path audits; constructor-ingress,
public-export, fixture-path, declaration-uniqueness, unresolved-import, cycle,
sibling-private, and forbidden-edge scans; both type checks; scoped Prettier
and `git diff --check`; focused distant-Sun specs; the full Algorithm32 Node and
Three/WebGL lanes; Flat32 UI; and the production build. Record source identity
and the green checkpoint before beginning `F08-local-sun`.

### `F07` green checkpoint

Completed on 2026-08-06. All 38 old distant-Sun paths are absent and the full
feature closure occupies `implementation/distant-sun`. The public barrel
exports only `DistantSunLightSource`; it owns the canonical native-15
irradiance packet, accepts only intrinsic apparent-size configuration, and
receives direction from geometry through its existing one-shot binding.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:e96c2625f3e7c085e8a80ec8b2336b6fa828667602af6a66fce44a4e047568b0`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 596
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 71 focused distant-Sun specs with 0 failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`F08-local-sun`.

## Eighth Feature Transaction Manifest: `F08-local-sun`

Status: reviewed execution boundary. Execution is limited to all 33
`implementation/local-sun` target-map rows, one public barrel export, the
owned native-15 constructor cleanup, and the exact consumers below.

### Exact move and public merge

Move the entire 33-file `light-sources/local-sun` closure without splitting
it: public source, geometry pairing, shader and Three adapters, cache source,
controller/provider, CPU fields/cache, shell facts, construction light/domain,
field packing, constants, declarations, and specifications. Merge only
`LocalSunLightSource` into `implementation/index.js`.

The class declares `LightSourceModel` and
`GeometryConfigurableLightSource`. It retains its intrinsic source identity,
finite-body calibration, falloff, and integration controls, removes caller
irradiance, and installs the canonical native-15 packet internally. Geometry
continues to install its finite position through the one-shot P01 binding.

### Consumer and graph closure

Flat32 imports the public class through `implementation/index.js` and removes
its obsolete irradiance argument. Moved modules retarget shared light-source
support imports for the canonical owner depth; feature-relative imports remain
stable. Current extraterrestrial ownership documentation updates the public
class path. No other production module deep-imports the local feature.

All 33 destinations are absent except for the intentional barrel merge and
are case-fold unique. Shared support owners do not import the feature, so the
prospective graph is acyclic. No compatibility alias, duplicate
implementation, new default export, sibling-private edge, production-to-test
edge, archive/experiment dependency, or generated-output dependency is
introduced.

### Required gates

Execution must pass exact move, stale-path, constructor-ingress, public-export,
declaration-uniqueness, unresolved-import, cycle, sibling-private, and
forbidden-edge audits; both type checks; scoped Prettier and `git diff --check`;
focused local-Sun specs; the full Algorithm32 Node and Three/WebGL lanes;
Flat32 UI; and the production build. Record source identity and the green
checkpoint before beginning `I01-geometry-support`.

### `F08` green checkpoint

Completed on 2026-08-06. All 33 old local-Sun paths are absent and the full
feature closure occupies `implementation/local-sun`. The public barrel exports
only `LocalSunLightSource` from that feature. The built-in source owns the
canonical native-15 irradiance packet, accepts only intrinsic finite-body and
integration configuration, and receives its geometry-resolved position through
the one-shot construction binding.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:13b9f2a3f34e887fe4d852e2b361c602c13e123dd21788226caaaa9c42e11200`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 598
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- exact 33-row move, stale-path, constructor-ingress, public-export,
  declaration, sibling-private, archive/experiment, and generated-output
  audits;
- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 55 focused local-Sun specs with 0 failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`I01-geometry-support`.

## First Internal Rehome Manifest: `I01-geometry-support`

Status: reviewed execution boundary. Execution is limited to the four
`geometry-support` target-map rows and an audit of the already-canonical
`geometry-support/solar` prerequisite created by `P01`.

### Exact moves

| Current path under `src/algorithm32`                    | Target path under `src/algorithm32`                      |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `geometry/shared/GeometryDirections.js`                 | `geometry-support/GeometryDirections.js`                 |
| `geometry/shared/GeometryVisualRequestValues.js`        | `geometry-support/GeometryVisualRequestValues.js`        |
| `geometry/shared/types.d.ts`                            | `geometry-support/types.d.ts`                            |
| `geometry/shared/_tests/geometry-shared-values.spec.js` | `geometry-support/_tests/geometry-shared-values.spec.js` |

All four destinations are absent and case-fold unique. The existing
`geometry-support/solar/SolarPosition.js` and its declarations remain in place;
they neither collide with nor duplicate the moved direction, visual-request,
or ambient geometry contracts.

### Exact consumer and import closure

- `implementation/flat-earth/FlatEarthGeometry.js`,
  `FlatScatteringCacheGeometry.js`, and
  `three/FlatGeometrySceneAdapter.js` retarget their shared imports to
  `geometry-support`.
- `implementation/spherical-earth/SphericalEarthGeometry.js` and
  `three/SphericalGeometrySceneAdapter.js` retarget the same shared imports.
- The moved specification retains feature-relative imports.
- `GeometryDirections.js` and `GeometryVisualRequestValues.js` reduce their
  path depth by one when importing `utils/math` and `utils/validation`.
- Ambient declarations remain discovered by the existing Algorithm32 and
  Flat32 type-check configurations; no configuration path is pinned to the old
  declaration file.
- No application, public barrel, browser preprocessor, fixture, package, or
  external runtime consumer names the old path. The canonical inventory and
  target map retain the source-to-target rows as migration evidence.

The prospective graph preserves the current module and edge counts. It adds no
cycle, unresolved import, sibling-private dependency, production-to-test edge,
public export, compatibility alias, archive/experiment dependency, or
generated-output dependency.

### Required gates

Execution must pass exact four-row move and stale-path audits; the solar-owner,
public-export, declaration-uniqueness, unresolved-import, cycle,
sibling-private, and forbidden-edge scans; both type checks; scoped Prettier
and `git diff --check`; focused geometry-support, flat-earth, and
spherical-earth specifications; the full Algorithm32 Node and Three/WebGL
lanes; Flat32 UI; and the production build. Record source identity and the
green checkpoint before beginning `I02-light-source-support`.

### `I01` green checkpoint

Completed on 2026-08-06. The four former `geometry/shared` files now occupy
`geometry-support`; the old directory is absent, every production consumer uses
the canonical owner, and the pre-existing `geometry-support/solar` prerequisite
remains unchanged. No public export or application configuration changed.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:2952be6157b047b0324078d9dbaa04e40e1b70f0fb7256b378800420195401a4`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 598
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- exact four-row move, stale-path, solar-owner, public-export, declaration,
  sibling-private, and forbidden-edge audits;
- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 77 focused geometry-support, flat-earth, and spherical-earth specs with 0
  failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`I02-light-source-support`.

## Second Internal Rehome Manifest: `I02-light-source-support`

Status: reviewed execution boundary. Execution is limited to all 12
`light-source-support` target-map rows, their 15 exact source consumers, and
two current cache-design path references.

### Exact moves

| Current path under `src/algorithm32`                                    | Target path under `src/algorithm32`                                     |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `light-sources/shared/LightSourceRequestValues.js`                      | `light-source-support/LightSourceRequestValues.js`                      |
| `light-sources/shared/types.d.ts`                                       | `light-source-support/types.d.ts`                                       |
| `light-sources/shared/_tests/spectral-test-values.js`                   | `light-source-support/_tests/spectral-test-values.js`                   |
| `light-sources/shared/cache/consts.js`                                  | `light-source-support/cache/consts.js`                                  |
| `light-sources/shared/cache/CpuDirectionalSpectralField.js`             | `light-source-support/cache/CpuDirectionalSpectralField.js`             |
| `light-sources/shared/cache/index.js`                                   | `light-source-support/cache/index.js`                                   |
| `light-sources/shared/cache/types.d.ts`                                 | `light-source-support/cache/types.d.ts`                                 |
| `light-sources/shared/cache/_tests/CpuDirectionalSpectralField.spec.js` | `light-source-support/cache/_tests/CpuDirectionalSpectralField.spec.js` |
| `light-sources/shared/three/SceneLightingMath.js`                       | `light-source-support/three/SceneLightingMath.js`                       |
| `light-sources/shared/three/ThreeLighting.js`                           | `light-source-support/three/ThreeLighting.js`                           |
| `light-sources/shared/three/types.d.ts`                                 | `light-source-support/three/types.d.ts`                                 |
| `light-sources/shared/three/_tests/three-lighting-support.spec.js`      | `light-source-support/three/_tests/three-lighting-support.spec.js`      |

All 12 destinations are absent and case-fold unique. The source subtree is the
complete current shared light-source closure; no file remains under
`light-sources/shared` after the move.

### Exact consumer and import closure

- The distant-Sun root class, Three adapter, cache constants, controller,
  provider, and four cache specifications retarget their shared source,
  lighting, defaults, and CPU-field imports.
- The local-Sun root class, Three adapter, and CPU-field owner retarget their
  corresponding shared imports.
- `profiles/native-15/native-15-profile.js` retargets the common cache defaults;
  the two transport specifications retarget the common CPU field.
- Moved `LightSourceRequestValues`, test spectral values, and Three helpers
  reduce their path depth when importing quantities, math, and validation.
  Feature-relative cache and specification imports remain stable.
- The two current cache-design references change from
  `light-sources/shared/cache` to `light-source-support/cache`. The canonical
  inventory and target map retain their source-to-target evidence rows.
- No Flat32 source, public implementation barrel, Karma preprocessor, package
  configuration, fixture, or external runtime consumer names the old path.

The prospective graph preserves the current module and edge counts. Both Sun
features depend inward on the shared owner; the shared owner imports no Sun
feature. The move therefore adds no cycle, unresolved import, sibling-private
dependency, production-to-test edge, public export, compatibility alias,
archive/experiment dependency, or generated-output dependency.

### Required gates

Execution must pass exact 12-row move and stale-path audits; public-export,
declaration-uniqueness, unresolved-import, cycle, sibling-private, and
forbidden-edge scans; both type checks; scoped Prettier and
`git diff --check`; focused shared-light-source, distant-Sun, local-Sun, and
transport specifications; the full Algorithm32 Node and Three/WebGL lanes;
Flat32 UI; and the production build. Record source identity and the green
checkpoint before beginning `I03-ground-transport`.

### `I02` green checkpoint

Completed on 2026-08-06. All 12 former `light-sources/shared` files now occupy
`light-source-support`; the old directory is absent, all 15 code consumers use
the canonical owner, and the two current cache-design references are current.
No public export or application configuration changed.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:b3016a396428f363bc1c102630669378ad13af06abe1689a1ad7cd05d4b5f9e7`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 598
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- exact 12-row move, 15-consumer stale-path, public-export, declaration,
  sibling-private, and forbidden-edge audits;
- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 145 focused shared-light-source, distant-Sun, local-Sun, and transport specs
  with 0 failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`I03-ground-transport`.

## Third Internal Rehome Manifest: `I03-ground-transport`

Status: reviewed execution boundary. Execution is limited to the one
`ground-transport` target-map row, its two exact source-cache consumers, and
one current cache-design path reference.

### Exact move

| Current path under `src/algorithm32`       | Target path under `src/algorithm32` |
| ------------------------------------------ | ----------------------------------- |
| `ground-boundaries/shared/cache/consts.js` | `ground-transport/cache/consts.js`  |

The destination and its parent owner are absent. The source file is the entire
shared omitted-ground transport closure and has no runtime import of its own.

### Exact consumer and graph closure

- `implementation/distant-sun/cache/DistantSunCacheController.js` and
  `implementation/local-sun/cache/LocalSunCacheController.js` retarget their
  canonical black-ground module-definition import.
- The current cache-design placement description changes from
  `ground-boundaries/shared/cache` to `ground-transport/cache`. The canonical
  inventory, target map, and completed F02 manifest retain the old source path
  as migration evidence.
- No Flat32 source, public implementation barrel, declaration, test fixture,
  Karma preprocessor, package configuration, or external runtime consumer
  names the old path.

The prospective graph preserves the current module and edge counts. Both Sun
features depend inward on the ground-transport owner, which imports neither
feature. The move adds no cycle, unresolved import, sibling-private dependency,
production-to-test edge, public export, compatibility alias,
archive/experiment dependency, or generated-output dependency.

### Required gates

Execution must pass the exact one-row move and stale-path audits;
public-export, unresolved-import, cycle, sibling-private, and forbidden-edge
scans; both type checks; scoped Prettier and `git diff --check`; both Sun cache
controller specifications; the full Algorithm32 Node and Three/WebGL lanes;
Flat32 UI; and the production build. Record source identity and the green
checkpoint before beginning `I04-sampling-domains`.

### `I03` green checkpoint

Completed on 2026-08-06. The former
`ground-boundaries/shared/cache/consts.js` now occupies
`ground-transport/cache/consts.js`; the old shared directory is absent, both
Sun cache controllers use the canonical owner, and the current cache-design
placement is current. No public export, declaration, or application
configuration changed.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:c106eb49be9f59073bd206bbfcaccd457df9be8367a9d25459ddf0be51573da1`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 598
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- exact one-row move, two-consumer stale-path, public-export,
  sibling-private, and forbidden-edge audits;
- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 14 focused Sun cache-controller specs with 0 failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`I04-sampling-domains`.

## Fourth Internal Rehome Manifest: `I04-sampling-domains`

Status: reviewed execution boundary. Execution is limited to all 19
`sampling-domains` target-map rows, their 16 exact code consumers, and two
current production-plan path references.

### Exact moves

| Current path under `src/algorithm32`                                                | Target path under `src/algorithm32`                                                          |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `domains/index.js`                                                                  | `sampling-domains/index.js`                                                                  |
| `domains/types.d.ts`                                                                | `sampling-domains/types.d.ts`                                                                |
| `domains/direction/cubed-sphere/consts.js`                                          | `sampling-domains/direction/cubed-sphere/consts.js`                                          |
| `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js`                      | `sampling-domains/direction/cubed-sphere/CubedSphereDirectionDomain.js`                      |
| `domains/direction/cubed-sphere/types.d.ts`                                         | `sampling-domains/direction/cubed-sphere/types.d.ts`                                         |
| `domains/direction/cubed-sphere/types/CubedSphereDirectionDomain.d.ts`              | `sampling-domains/direction/cubed-sphere/types/CubedSphereDirectionDomain.d.ts`              |
| `domains/direction/cubed-sphere/_tests/cubed-sphere-direction-domain.spec.js`       | `sampling-domains/direction/cubed-sphere/_tests/cubed-sphere-direction-domain.spec.js`       |
| `domains/direction/cubed-sphere/_tests/cubed-sphere-w27-direction-domain.spec.js`   | `sampling-domains/direction/cubed-sphere/_tests/cubed-sphere-w27-direction-domain.spec.js`   |
| `domains/direction/fibonacci/consts.js`                                             | `sampling-domains/direction/fibonacci/consts.js`                                             |
| `domains/direction/fibonacci/Fibonacci34DirectionDomain.js`                         | `sampling-domains/direction/fibonacci/Fibonacci34DirectionDomain.js`                         |
| `domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js`                   | `sampling-domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js`                   |
| `domains/direction/fibonacci/types.d.ts`                                            | `sampling-domains/direction/fibonacci/types.d.ts`                                            |
| `domains/direction/fibonacci/_tests/Fibonacci34DirectionDomain.spec.js`             | `sampling-domains/direction/fibonacci/_tests/Fibonacci34DirectionDomain.spec.js`             |
| `domains/direction/fibonacci/_tests/paired-fibonacci-34-direction-domain.spec.js`   | `sampling-domains/direction/fibonacci/_tests/paired-fibonacci-34-direction-domain.spec.js`   |
| `domains/position/spherical-native/consts.js`                                       | `sampling-domains/position/spherical-native/consts.js`                                       |
| `domains/position/spherical-native/SphericalNativePositionDomain.js`                | `sampling-domains/position/spherical-native/SphericalNativePositionDomain.js`                |
| `domains/position/spherical-native/types.d.ts`                                      | `sampling-domains/position/spherical-native/types.d.ts`                                      |
| `domains/position/spherical-native/_tests/native-48-position-domain.spec.js`        | `sampling-domains/position/spherical-native/_tests/native-48-position-domain.spec.js`        |
| `domains/position/spherical-native/_tests/spherical-native-position-domain.spec.js` | `sampling-domains/position/spherical-native/_tests/spherical-native-position-domain.spec.js` |

All 19 destinations and the target owner are absent and case-fold unique. The
source subtree is the complete current position/direction domain closure.

### Exact consumer and import closure

- `FlatLocalMode` and `SphericalDistantMode` retarget the internal domain
  barrel used to construct their selected runtime configurations.
- Flat geometry retargets one source and one specification; spherical geometry
  retargets two sources and one specification.
- Distant-Sun cache constants, three numerical specifications, and the GPU
  parity-policy specification retarget domain constants or the internal barrel.
- Local-Sun construction-domain selection and its two cache specifications
  retarget their cubed-sphere and paired-Fibonacci constants.
- One transport specification retargets the cubed-sphere constant owner.
- All moved domain-relative imports remain stable. The cubed-sphere utility
  imports retain their existing depth because both old and new owners are one
  root segment.
- The active production plan and Stage 9.6 containment inventory retarget their
  live domain owner references. The canonical inventory and target map retain
  their source-to-target evidence rows.
- No public implementation barrel, Karma preprocessor, package configuration,
  generated fixture data, or external runtime consumer names the old path.

The prospective graph preserves the current module and edge counts. Domain
owners import only lower-level math support; geometry, source, transport, and
application consumers depend inward. The move adds no cycle, unresolved import,
sibling-private dependency, production-to-test edge, public export,
compatibility alias, archive/experiment dependency, or generated-output
dependency.

### Required gates

Execution must pass exact 19-row move and 16-consumer stale-path audits;
internal-barrel, declaration-uniqueness, unresolved-import, cycle,
sibling-private, and forbidden-edge scans; both type checks; scoped Prettier
and `git diff --check`; focused sampling-domain, affected geometry, source,
transport, and parity-policy specifications; the full Algorithm32 Node and
Three/WebGL lanes; Flat32 UI; and the production build. Record source identity
and the green checkpoint before beginning `I05-physical-quantities`.

### `I04` green checkpoint

Completed on 2026-08-06. All 19 former `domains` files now occupy
`sampling-domains`; the old owner is absent, all 16 code consumers use the
canonical paths, and the two current production-plan references are current.
No public implementation export or application configuration contract changed.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:bd86363bc8c95530d98bf7e96e807cd5d1015ebdbc83d9fbf17a0863334f20fd`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 598
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- exact 19-row move, 16-consumer stale-path, internal-barrel, declaration,
  sibling-private, and forbidden-edge audits;
- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 113 focused sampling-domain, geometry, source, transport, and parity-policy
  specs with 0 failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`I05-physical-quantities`.

## Fifth Internal Rehome Manifest: `I05-physical-quantities`

Status: reviewed execution boundary. Execution is limited to the three
`physical-quantities` executable/test rows, the one
`interfaces/physical-quantities` declaration row, and five exact runtime
consumer files.

### Exact moves and declaration split

| Current path under `src/algorithm32`          | Target path under `src/algorithm32`              |
| --------------------------------------------- | ------------------------------------------------ |
| `quantities/units/UnitMath.js`                | `physical-quantities/UnitMath.js`                |
| `quantities/units/consts.js`                  | `physical-quantities/consts.js`                  |
| `quantities/units/_tests/unit-values.spec.js` | `physical-quantities/_tests/unit-values.spec.js` |
| `quantities/units/types.d.ts`                 | `interfaces/physical-quantities/types.d.ts`      |

All four destinations and both target owners are absent and case-fold unique.
The declaration file contains only public readonly unit-bearing value, unit
spelling, series/position, candidate, family, and conversion data contracts;
it contains no executable implementation or behavioral interface. `UnitMath`,
conversion data, `UNIT_FAMILIES`, and their specification remain non-public.

### Exact consumer and graph closure

- The transitional `quantities/index.js` barrel retargets its `UnitMath` and
  `UNIT_FAMILIES` re-exports to `physical-quantities`; its spectral exports stay
  in place until `I06-spectral-values`.
- `profiles/native-15/native-15-profile.js`, both Sun Three adapters, and
  `quantities/spectral/SpectralBasis.js` retarget direct `UnitMath` imports.
- Moved `UnitMath.js` reduces its validation import depth by one. The moved
  constants and specification retain feature-relative imports.
- Ambient declaration discovery remains glob-based in both type-check
  configurations; no configuration path is pinned to the old declaration.
- No Flat32 source, public implementation barrel, Karma preprocessor, package
  configuration, fixture, or current design document names the old path.

The prospective graph preserves the current module and edge counts. The
physical operation owner imports only lower-level validation, while spectral,
profile, source, and transitional-barrel consumers depend inward. The move adds
no cycle, unresolved import, duplicate ambient name, sibling-private
dependency, production-to-test edge, public concrete export, compatibility
alias, archive/experiment dependency, or generated-output dependency.

### Required gates

Execution must pass exact four-row move, declaration-placement, five-consumer
stale-path, transitional-barrel, ambient-uniqueness, unresolved-import, cycle,
sibling-private, and forbidden-edge audits; both type checks; scoped Prettier
and `git diff --check`; focused unit, native-profile, spectral-basis, color,
source-adapter, and spectral-calculator specifications; the full Algorithm32
Node and Three/WebGL lanes; Flat32 UI; and the production build. Record source
identity and the green checkpoint before beginning `I06-spectral-values`.

### `I05` green checkpoint

Completed on 2026-08-06. The three executable/test unit files now occupy
`physical-quantities`; the data-only unit declaration occupies
`interfaces/physical-quantities`; the old `quantities/units` owner is absent;
and all five runtime consumers use canonical paths. The transitional
`quantities/index.js` barrel preserves its existing internal export set while
pointing at the new physical owner.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:93efbbd53085e4cd3e903858060f1bea9340e982d29b0426c025c91fb6025993`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 598
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- exact four-row move/split, five-consumer stale-path, transitional-barrel,
  declaration-placement, ambient-uniqueness, sibling-private, and
  forbidden-edge audits;
- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 83 focused unit, native-profile, spectral-basis, color, source, and
  spectral-calculator specs with 0 failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`I06-spectral-values`.

## Sixth Internal Rehome Manifest: `I06-spectral-values`

Status: reviewed execution boundary. Execution is limited to all seven
`spectral-values` executable/test rows, the one
`interfaces/spectral-quantities` declaration row, and 26 exact code consumers.

### Exact moves and declaration split

| Current path under `src/algorithm32`                 | Target path under `src/algorithm32`              |
| ---------------------------------------------------- | ------------------------------------------------ |
| `quantities/index.js`                                | `spectral-values/index.js`                       |
| `quantities/spectral/consts.js`                      | `spectral-values/consts.js`                      |
| `quantities/spectral/SpectralBasis.js`               | `spectral-values/SpectralBasis.js`               |
| `quantities/spectral/SpectralMath.js`                | `spectral-values/SpectralMath.js`                |
| `quantities/spectral/SpectralPacket.js`              | `spectral-values/SpectralPacket.js`              |
| `quantities/spectral/_tests/SpectralBasis.spec.js`   | `spectral-values/_tests/SpectralBasis.spec.js`   |
| `quantities/spectral/_tests/spectral-packet.spec.js` | `spectral-values/_tests/spectral-packet.spec.js` |
| `quantities/spectral/types.d.ts`                     | `interfaces/spectral-quantities/types.d.ts`      |

All eight destinations and both target owners are absent and case-fold unique.
The declaration file contains the public readonly basis, packet, quantity,
units, interpretation, operation, and provenance value contracts needed by the
API. Concrete builders, validation, hashing, arithmetic, constants, and tests
remain non-public under `spectral-values`.

### Exact consumer and graph closure

- The native-15 profile and its specification retarget the spectral barrel.
- Bruneton color, canonical atmosphere, uniform-Lambertian ground, and their
  specifications retarget it; local-Sun root/construction/cache and
  distant-Sun cache/evaluator/controller specifications do likewise.
- Shared light-source request and test-value support retarget the barrel.
- Facade, model, reference, rendering support/browser coverage, transport, and
  spectral-calculator consumers retarget the barrel. These groups comprise the
  exact 26 source, specification, and browser-support files discovered before
  execution.
- The moved barrel preserves its current internal export set and continues to
  re-export `UnitMath` and `UNIT_FAMILIES` from `physical-quantities`.
- Moved spectral classes reduce their math/validation/identity and physical
  import depth by one; all feature-relative imports remain stable.
- Ambient declaration discovery remains glob-based; no Flat32, package, Karma,
  fixture, or current design-document path is pinned to the old owner.

The prospective graph preserves the current module and edge counts. Spectral
values import only physical quantities and lower-level utility owners; all
feature/runtime consumers depend inward. The move adds no cycle, unresolved
import, duplicate ambient name, sibling-private dependency,
production-to-test edge, public concrete implementation export, compatibility
alias, archive/experiment dependency, or generated-output dependency.

### Required gates

Execution must pass exact eight-row move/split, 26-consumer stale-path,
internal-barrel, declaration-placement, ambient-uniqueness, unresolved-import,
cycle, sibling-private, and forbidden-edge audits; both type checks; scoped
Prettier and `git diff --check`; focused spectral-value and affected
profile/feature/runtime/transport specifications; the full Algorithm32 Node
and Three/WebGL lanes; Flat32 UI; and the production build. Record source
identity and the green checkpoint before beginning `I07-math`.

### `I06` green checkpoint

Completed on 2026-08-06. The seven executable/test spectral files now occupy
`spectral-values`; the data-only spectral declaration occupies
`interfaces/spectral-quantities`; the old `quantities` owner is absent; and all
26 code consumers use canonical paths. The internal spectral barrel preserves
its reviewed export set and re-exports physical operations from their canonical
owner.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:5296a6e67e6192df73b1deac7d85e46c1a1cde0d611978ff07a47bd435803e2e`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 598
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- exact eight-row move/split, 26-consumer stale-path, internal-barrel,
  declaration-placement, ambient-uniqueness, sibling-private, and
  forbidden-edge audits;
- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 136 focused spectral-value, profile, feature, runtime, and transport specs
  with 0 failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
`I07-math`.

## Seventh Internal Rehome Manifest: `I07-math`

Status: reviewed execution boundary. Execution is limited to all 13 `math`
target-map rows and their 41 exact Algorithm32/Flat32 code consumers.

### Exact move

Move the complete 13-file `utils/math` subtree to `math` without changing its
internal relative layout: the `AngleMath`, `ArrayMath`, `DistanceMath`,
`PixelMath`, `SampleMath`, `ScalarMath`, `SceneMath`, `VectorMath`, and
`WavelengthMath` namespaces; internal barrel; ambient declarations; and two
specifications. All 13 destinations and the target owner are absent and
case-fold unique.

### Exact consumer and graph closure

- Three Flat32 files retarget the math barrel, distance, and angle owners.
- The 38 Algorithm32 consumers discovered before execution span React
  adapters, geometry support, both geometry features, both Sun features,
  light-source support, sampling domains, spectral/transport operations,
  facade, and rendering runtime. Each retargets only its existing math import.
- Moved math modules and specifications retain feature-relative imports. Math
  remains a leaf owner and imports no feature, runtime, geometry, or source.
- Ambient declaration discovery remains glob-based. No public implementation
  barrel, Karma preprocessor, package configuration, fixture, or current design
  document is pinned to the old path. The canonical inventory and target map
  retain source-to-target evidence.

The prospective graph preserves the current module and edge counts and adds no
cycle, unresolved import, sibling-private dependency, production-to-test edge,
public export, compatibility alias, archive/experiment dependency, or
generated-output dependency.

### Required gates

Execution must pass exact 13-row move and 41-consumer stale-path audits;
internal-barrel, declaration, unresolved-import, cycle, sibling-private, and
forbidden-edge scans; both type checks; scoped Prettier and
`git diff --check`; focused math and affected geometry/source/transport/runtime
specifications; the full Algorithm32 Node and Three/WebGL lanes; Flat32 UI;
and the production build. Record source identity and the green checkpoint
before beginning `I08-time-validation-identity`.

### `I07` green checkpoint

Completed on 2026-08-06. All 13 former `utils/math` files now occupy `math`;
the old owner is absent and all 41 Algorithm32/Flat32 consumers use canonical
paths. No public implementation export or configuration contract changed.

The post-transaction production tree contains 299 files. Its checkpoint
identity is
`sha256:134dbec8a7ac3c238c819ee0307df64671a8cabd59102e55bfdd0163f8ee094d`,
computed over sorted Algorithm32-relative UTF-8 path, NUL, raw file bytes, and
NUL tuples. The runtime graph contains 207 JavaScript or JSX modules and 598
resolving internal edges with zero unresolved imports, cycles, or
production-to-test edges. Verification passed:

- exact 13-row move, 41-consumer stale-path, internal-barrel, declaration,
  sibling-private, and forbidden-edge audits;
- `npm run typecheck:algorithm32`;
- `npm run typecheck:flat32`;
- scoped Prettier and `git diff --check`;
- 155 focused math, geometry, source, transport, and runtime specs with 0
  failures;
- `npm run test:algorithm32` with 457 specs and 0 failures;
- `npm run test:algorithm32:three` with 5 specs and 0 failures;
- `npm run test:ui:flat32` with 3 specs and 0 failures; and
- `npm run build`.

No repository commit was created by this transaction. The next queue item is
the first `I08-time-validation-identity` subtransaction, `I08a-time`.

## Eighth Internal Rehome Manifest A: `I08a-time`

Status: reviewed execution boundary. Execution is limited to
`utils/time/TimeMath.js`, its target `time/TimeMath.js`, and three exact
consumers: `gpu-runtime/cache/CacheGpuExecutor.js`,
`runtime/rendering/three/ShaderPassPerformanceTimer.js`, and
`implementation/flat-earth/synchronization/FlatSynchronizer.js`.

The destination is absent. The time owner is a leaf, has no declarations or
test file of its own, and gains no public export. The three imports retain their
relative depth while replacing `utils/time` with `time`. The prospective graph
preserves module/edge counts and adds no unresolved import, cycle,
production-to-test edge, sibling-private dependency, compatibility alias, or
forbidden dependency.

Execution must pass the exact move and three-consumer stale-path audit; both
type checks; scoped formatting and hygiene; focused cache-executor,
performance-timer, and flat-synchronizer specs; full Node, Three/WebGL, Flat32
UI, and build gates; and static graph identity before `I08b-validation`.

### `I08a` green checkpoint

Completed on 2026-08-06. `TimeMath.js` occupies `time`, the old owner is
absent, and all three consumers use the canonical path. The 299-file tree has
identity
`sha256:5530e309af5c11ee24b04d0ccf9045907e2b2ca1ff649d48585257594accdf42`;
its 207-module, 598-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, formatting and hygiene, 29 focused
specs, Node 457/457, Three 5/5, Flat32 UI 3/3, and the build pass. No commit was
created. The next subtransaction is `I08b-validation`.

## Eighth Internal Rehome Manifest B: `I08b-validation`

Status: reviewed execution boundary. Execution is limited to
`utils/validation/ValueValidation.js`, its focused specification, their
corresponding `validation` targets, and the 16 exact Algorithm32 consumers
discovered before execution.

The two destinations and target owner are absent and case-fold unique. The
consumers span React resources, geometry visual support, spectral and physical
values, the native profile, ground, both geometry features, both Sun features,
and shared Three lighting. Each import retains its relative depth while
replacing `utils/validation` with `validation`. The moved specification retains
its feature-relative import. Validation remains a leaf owner and gains no
public implementation export.

The prospective graph preserves module and edge counts and adds no unresolved
import, cycle, production-to-test edge, sibling-private dependency,
compatibility alias, archive/experiment dependency, or generated-output
dependency.

Execution must pass the exact two-row move and 16-consumer stale-path audit;
both type checks; scoped formatting and hygiene; focused validation and
affected ingress specifications; full Node, Three/WebGL, Flat32 UI, and build
gates; and static graph identity before `I08c-value-identity`.

### `I08b` green checkpoint

Completed on 2026-08-06. `ValueValidation.js` and its focused specification
occupy `validation`, the old owner is absent, and all 16 consumers use the
canonical path. The identity consumer required its reviewed root-relative
depth (`../../validation`) while the other consumers retained their expected
depths. The 299-file tree has identity
`sha256:a27e55d83a7b4eda827da6e4c479d9f71eba3e0c9dd291fef469f247d03aed6e`;
its 207-module, 598-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, scoped formatting and hygiene, 61
focused validation and ingress specs, Node 457/457, Three 5/5, Flat32 UI 3/3,
and the build pass. No commit was created. The next subtransaction is
`I08c-value-identity`.

## Eighth Internal Rehome Manifest C: `I08c-value-identity`

Status: reviewed execution boundary. Execution is limited to these three
moves:

| Current path under `src/algorithm32`         | Target path under `src/algorithm32`          |
| -------------------------------------------- | -------------------------------------------- |
| `utils/identity/CanonicalValueHash.js`       | `value-identity/CanonicalValueHash.js`       |
| `utils/identity/StableValueHash.js`          | `value-identity/StableValueHash.js`          |
| `utils/identity/_tests/value-hashes.spec.js` | `value-identity/_tests/value-hashes.spec.js` |

The exact 11 production consumers are `spectral-values/SpectralBasis.js`,
`spectral-values/SpectralMath.js`, `spectral-values/SpectralPacket.js`,
`gpu-runtime/cache/CacheValues.js`,
`gpu-assembler/runtime/Algorithm32ShaderAssembler.js`,
`gpu-assembler/cache-pass/CacheBuildModules.js`,
`gpu-assembler/cache-pass/CachePassAssembler.js`, both
`implementation/distant-sun/cache` controller/provider modules, and both
`implementation/local-sun/cache` controller/provider modules. They replace
`utils/identity` with `value-identity` at their existing root-relative depth.
The moved specification retains feature-relative imports. After the move,
`CanonicalValueHash` imports the canonical validation owner at
`../validation/ValueValidation.js`.

All three destinations and the target owner are absent and case-fold unique.
The value-identity owner remains non-public and receives no implementation
barrel export. Its sole production dependency is the already-green validation
owner. The prospective graph preserves the 207-module, 598-edge identity and
adds no unresolved import, cycle, production-to-test edge, sibling-private
dependency, compatibility alias, archive/experiment dependency, or
generated-output dependency.

Execution must pass the exact three-row move and 11-consumer stale-path audit;
both type checks; scoped formatting and hygiene; focused hash, spectral-value,
cache-value, shader-assembly, and source-controller/provider specifications;
full Node, Three/WebGL, Flat32 UI, and build gates; and static graph identity
before `I09-atmospheric-transport`.

### `I08c` green checkpoint

Completed on 2026-08-06. Both hash utilities and their focused specification
occupy `value-identity`, the old owner is absent, and all 11 production
consumers use the canonical path. `CanonicalValueHash` uses the canonical
validation owner. The 299-file tree has identity
`sha256:55153c6307b5dc02dbac0f7d1050785cba82020d065ac8d0e388d7ca62281637`;
its 207-module, 598-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, scoped formatting and hygiene, 47
focused hash, spectral, cache, shader, and source specs, Node 457/457, Three
5/5, Flat32 UI 3/3, and the build pass. No commit was created. The next
transaction is `I09-atmospheric-transport`.

## Ninth Internal Rehome Manifest: `I09-atmospheric-transport`

Status: reviewed execution boundary. The exact 20-row closure is the complete
current `transport` tree: four root specifications, `Algorithm32Transport.js`,
`ScatteringOrderFieldOperations.js`, both scattering-density modules, root
constants and declarations, the five-file `cache` closure, and the three-file
runtime plus specification/declaration `spectral` closure. Every path moves
unchanged beneath `atmospheric-transport`; no file is split, created, or
discarded.

The exact 12 external consumers are the distant-spherical shader-contribution
specification; distant-Sun `DistantSunCacheController`,
`DistantSunCacheProvider`, `DistantSunCpuPrimaryEvaluator`, and
`DistantSunCpuMultipleScatteringEvaluator`; local-Sun
`LocalSunCacheController` and `LocalSunCacheProvider`; the two distant-Sun
transport-focused specifications; the local-Sun CPU-cache specification;
`runtime/reference/Reference.js`; and `runtime/rendering/ShaderBuilder.js`.
They replace only the root path segment `transport` with
`atmospheric-transport` at their existing relative depths. Internal relative
imports remain unchanged.

The target owner is absent and case-fold unique. Atmospheric transport remains
a non-public cross-feature mechanism and receives no implementation barrel
export. Its existing dependencies already occupy reviewed canonical owners,
and its consumers are feature, shader, reference, and rendering owners rather
than sibling-private imports. The prospective graph preserves the 207-module,
598-edge identity and adds no unresolved import, cycle, production-to-test
edge, compatibility alias, archive/experiment dependency, or generated-output
dependency.

Execution must pass the exact 20-row move and 12-consumer stale-path audit;
both type checks; scoped formatting and hygiene; focused transport, cache,
spectral, source-cache, reference, and shader-builder specifications; full
Node, Three/WebGL, Flat32 UI, and build gates; and static graph identity before
`I10-shader-assembly`.

### `I09` green checkpoint

Completed on 2026-08-06. The complete 20-file transport closure occupies
`atmospheric-transport`, the old owner is absent, and all 12 external consumers
use the canonical path. The 299-file tree has identity
`sha256:3c4e823f9744b22a387520bda79f62f62400b3e36d4c9a720fa26bb580e23ae8`;
its 207-module, 598-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, scoped formatting and hygiene, 84
focused transport, cache, spectral, source, reference, and rendering specs,
Node 457/457, Three 5/5, Flat32 UI 3/3, and the build pass. No commit was
created. The next transaction is `I10-shader-assembly`.

## Tenth Internal Rehome Manifest: `I10-shader-assembly`

Status: reviewed execution boundary. The exact 17-row closure is the complete
current `gpu-assembler` tree: the four-file `base` closure, the six-file
`cache-pass` closure, and the seven-file `runtime` closure. Every path moves
unchanged beneath `shader-assembly`; no file is split, created, or discarded.

Exactly 28 consumers outside that tree import it. They comprise three
atmospheric-transport modules/specifications; the GPU cache-executor
specification; the Bruneton color, canonical atmosphere, uniform ground,
flat-earth, spherical-earth, distant-Sun, local-Sun, and Three-cache-backend
feature modules/specifications shown by the checked import audit; and four
rendering-runtime modules/browser specifications. Each replaces only the root
path segment `gpu-assembler` with `shader-assembly` at its existing relative
depth. Internal relative imports remain unchanged.

The target owner is absent and case-fold unique. Shader assembly remains a
non-public cross-feature mechanism and receives no implementation barrel
export. Its consumers depend on its base contribution/source contracts or its
cache/runtime assemblers without importing a sibling feature's private
closure. The prospective graph preserves the 207-module, 598-edge identity and
adds no unresolved import, cycle, production-to-test edge, compatibility
alias, archive/experiment dependency, or generated-output dependency.

Execution must pass the exact 17-row move and 28-consumer stale-path audit;
both type checks; scoped formatting and hygiene; focused assembler,
contribution, transport, cache-runtime, feature-contribution, rendering, and
browser specifications; full Node, Three/WebGL, Flat32 UI, and build gates;
and static graph identity before `I11-gpu-cache-runtime`.

### `I10` green checkpoint

Completed on 2026-08-06. The complete 17-file assembler closure occupies
`shader-assembly`, the old owner is absent, and all 28 external consumers use
the canonical path. The 299-file tree has identity
`sha256:f182bb062364095ef4e6aecfe10db1f33b1dbae0b167d3dee76f45c7e8cc2e46`;
its 207-module, 598-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, scoped formatting and hygiene, 121
focused assembler, transport, cache, feature, and rendering specs, Node
457/457, Three 5/5, Flat32 UI 3/3, and the build pass. No commit was created.
The next transaction is `I11-gpu-cache-runtime`.

## Eleventh Internal Rehome Manifest: `I11-gpu-cache-runtime`

Status: reviewed execution boundary. The exact six-row closure consists of
`gpu-runtime/cache/_tests/CacheGpuExecutor.spec.js`, `CacheGpuExecutor.js`,
`CacheValues.js`, `consts.js`, `types/CacheGpuExecutor.d.ts`, and the internal
remainder of the split `types.d.ts`. They move directly beneath
`gpu-cache-runtime`, preserving `_tests` and `types` subfolders while removing
the obsolete `gpu-runtime/cache` nesting. The public cache-backend declaration
slice already occupies `interfaces/cache-backend` and is not duplicated or
changed.

Exactly 14 external consumers import the current owner: canonical atmosphere;
the distant-Sun cache, controller, and controller specification; both flat
geometry cache modules; the local-Sun cache, controller, source, and controller
specification; both spherical geometry cache modules; the Three cache backend;
and the shader cache-pass specification. Each replaces
`gpu-runtime/cache/` with `gpu-cache-runtime/` at its existing root-relative
depth. Within the moved owner, `CacheGpuExecutor` and `CacheValues` reduce their
time/value-identity import depth by one level, and the focused specification
reduces its shader-assembly import depth by one level; feature-relative imports
remain unchanged.

The target owner is absent and case-fold unique. GPU cache runtime remains a
non-public cross-feature mechanism and receives no implementation barrel
export. The declaration split is thereby complete: global backend interfaces
remain declaration-only, while execution-private cache contracts move with
their runtime. The prospective graph preserves the 207-module, 598-edge
identity and adds no unresolved import, cycle, production-to-test edge,
compatibility alias, archive/experiment dependency, or generated-output
dependency.

Execution must pass the exact six-row move and 14-consumer stale-path audit;
declaration ownership review; both type checks; scoped formatting and hygiene;
focused executor, cache-value, shader-pass, geometry-cache, source-controller,
atmosphere, and backend specifications; full Node, Three/WebGL, Flat32 UI, and
build gates; and static graph identity before `I12-rendering-runtime`.

### `I11` green checkpoint

Completed on 2026-08-06. The complete six-file GPU cache execution and private
declaration closure occupies `gpu-cache-runtime`, the obsolete nested owner is
absent, and all 14 external consumers use the canonical path. The public
cache-backend declaration slice remains unchanged under
`interfaces/cache-backend`. The 299-file tree has identity
`sha256:c19d4a7dca262e54355da9f20c944eca704a00a5e3effcfb1b198a7489918789`;
its 207-module, 598-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, scoped formatting and hygiene, 93
focused GPU, shader, geometry, source, atmosphere, and backend specs, Node
457/457, Three 5/5, Flat32 UI 3/3, and the build pass. No commit was created.
The next transaction is `I12-rendering-runtime`.

## Twelfth Internal Rehome Manifest: `I12-rendering-runtime`

Status: reviewed execution boundary. The exact 20-row closure is the complete
current `runtime/rendering` tree: its two root specifications and support
module; `ShaderAssemblyPreparer`, `ShaderBuilder`, root constants and
declarations; and the 13-file Three runtime, declaration, browser, and focused
specification closure. They move directly beneath `rendering-runtime`,
preserving `_tests` and `three` subfolders while removing the obsolete
`runtime/rendering` nesting.

The two external consumers are
`shader-assembly/runtime/_tests/DistantSphericalOwnerShaderContributions.spec.js`,
which replaces `runtime/rendering/` with `rendering-runtime/` at its existing
relative depth, and `runtime/facade/Algorithm32.js`, whose former sibling import
becomes `../../rendering-runtime/ShaderBuilder.js`. Eight moved modules need
one-level shallower imports:
`ShaderAssemblyPreparer`, `ShaderBuilder`, `ShaderBuilderTestSupport`,
`SceneInputCapture`, `ShaderPassPerformanceTimer`, `ShaderRuntimeInstaller`,
`ShaderRuntimePass`, and the Stage 10 browser specification. Feature-relative
imports inside the closure remain unchanged. The browser specification also
reduces its repository `node_modules`, implementation, profiles,
spectral-values, and shader-assembly depths by one, while its still-current
shared model import becomes `../../../runtime/model/SharedModel.js`.

The target owner is absent and case-fold unique. Rendering runtime remains a
non-public cross-feature mechanism and receives no implementation barrel
export. Its external dependency is a test-only composition seam rather than a
production-to-test edge or sibling-private feature import. The prospective
graph preserves the 207-module, 598-edge identity and adds no unresolved
import, cycle, production-to-test edge, compatibility alias,
archive/experiment dependency, or generated-output dependency.

Execution must pass the exact 20-row move, two external-consumer audit, and
eight internal-depth audit; both type checks; scoped formatting and hygiene;
focused builder, installer, pass, capture, timing, shader-owner, and browser
specifications; full Node, Three/WebGL, Flat32 UI, and build gates; and static
graph identity before `I13-reference-execution`.

### `I12` green checkpoint

Completed on 2026-08-06. The complete 20-file rendering closure occupies
`rendering-runtime`, the obsolete nested owner is absent, both external
consumers use the canonical path, and all eight internal depth changes resolve.
The 299-file tree has identity
`sha256:996bcc80d81d4ff892c70c11a7d777d6c7f46c3d5e2ef88b92b9fffe1bd078ab`;
its 207-module, 598-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, scoped formatting and hygiene, 53
focused rendering, facade, and shader-owner specs, Node 457/457, Three 5/5,
Flat32 UI 3/3, and the build pass. No commit was created. The next transaction
is `I13-reference-execution`.

## Thirteenth Internal Rehome Manifest: `I13-reference-execution`

Status: reviewed execution boundary. The exact three-row closure consists of
`runtime/reference/Reference.js`, its focused orchestration specification, and
its `types.d.ts`. They move directly beneath `reference-execution`, preserving
the `_tests` subfolder while removing the obsolete `runtime/reference`
nesting.

The sole external consumer is `runtime/facade/Algorithm32.js`, whose sibling
import becomes `../../reference-execution/Reference.js`. Within the moved
owner, `Reference.js` reduces its native-profile and atmospheric-transport
import depths by one level, and the focused specification reduces its
spectral-values import depth by one level. Feature-relative imports remain
unchanged.

The target owner is absent and case-fold unique. Reference execution remains a
non-public orchestration mechanism and receives no implementation barrel
export. The prospective graph preserves the 207-module, 598-edge identity and
adds no unresolved import, cycle, production-to-test edge, sibling-private
dependency, compatibility alias, archive/experiment dependency, or
generated-output dependency.

Execution must pass the exact three-row move, one external-consumer audit, and
two internal-depth audits; both type checks; scoped formatting and hygiene;
focused reference and facade specifications; full Node, Three/WebGL, Flat32
UI, and build gates; and static graph identity before
`I14-reference-evidence`.

### `I13` green checkpoint

Completed on 2026-08-06. The complete three-file reference orchestration
closure occupies `reference-execution`, the obsolete nested owner is absent,
the facade uses the canonical path, and both internal depth changes resolve.
The 299-file tree has identity
`sha256:ea8fe9527d3a9a0acb9cfd6f38aae27de661e308396b2931a6ddaca145eadb1a`;
its 207-module, 598-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, scoped formatting and hygiene, 16
focused reference and facade specs, Node 457/457, Three 5/5, Flat32 UI 3/3,
and the build pass. No commit was created. The next transaction is
`I14-reference-evidence`.

## Fourteenth Internal Rehome Manifest: `I14-reference-evidence`

Status: reviewed execution boundary. The exact four-row closure consists of
`references/README.md`, `fixtures/analytic-invariants.json`, the fixture
declaration file, and its focused specification. They move unchanged beneath
`reference-evidence`, preserving the `fixtures/_tests` structure. The root
Algorithm32 `references.md` citation owner is a repository-support row and
does not move in this transaction.

The sole external runtime consumer is
`atmospheric-transport/spectral/_tests/SpectralCalculator.spec.js`, which
replaces `references/fixtures/` with `reference-evidence/fixtures/` at its
existing relative depth. The moved specification and README retain their
feature-relative fixture and root-citation links without depth changes.

The target owner is absent and case-fold unique. Reference evidence remains
non-public retained fixture/document infrastructure and receives no
implementation barrel export. Fixture bytes and declarations are unchanged.
The prospective graph preserves the 207-module, 598-edge identity and adds no
unresolved import, cycle, production-to-test edge, sibling-private dependency,
compatibility alias, archive/experiment dependency, or generated-output
dependency.

Execution must pass the exact four-row move and one-consumer stale-path audit;
fixture byte identity and documentation-link review; both type checks; scoped
formatting and hygiene; focused fixture and spectral-calculator specifications;
full Node, Three/WebGL, Flat32 UI, and build gates; and static graph identity
before `F09-algorithm32`.

### `I14` green checkpoint

Completed on 2026-08-06. The complete four-row retained evidence closure
occupies `reference-evidence`, the old owner is absent, and the sole consumer
uses the canonical fixture path. The analytic fixture retains SHA-256
`38c921bccc3953f5cfdcc264a896c6f4b4ad7fcefd12c37b3fe1b48bf8dd0d91`.
The 299-file tree has identity
`sha256:515959c46617d894cc4d154caaa87217b10ff8a2bd83b1a497b2aaa1c49f18de`;
its 207-module, 598-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, scoped authored-file formatting
and hygiene, nine focused fixture and spectral specs, Node 457/457, Three 5/5,
Flat32 UI 3/3, and the build pass. No commit was created. The next transaction
is `F09-algorithm32`.

## Ninth Public Feature Manifest: `F09-algorithm32`

Status: reviewed execution boundary. The exact nine-row feature closure is the
four-file `runtime/facade` executable/specification set plus the five-file
`runtime/model` executable/declaration/specification set. The facade files move
to `implementation/algorithm32`; model files move beneath its `model`
subfolder. The public facade contracts already moved to
`interfaces/algorithm32` during `P01`; its implementation-private declaration
remainder already occupies `implementation/algorithm32/types.d.ts`. Neither
split product is duplicated or changed. No source is split, created, or
discarded.

Three caller-facing consumers—`adapters/react/Algorithm32AtmosphereComposer.js`,
`src/flat32/FlatLocalMode.js`, and `src/flat32/SphericalDistantMode.js`—replace
the facade deep import with the public `implementation/index.js` export. Each
merges `Algorithm32` into its existing import from that barrel. The Stage 10
rendering browser specification updates its test-only `SharedModel` import to
`implementation/algorithm32/model/SharedModel.js`. Within the feature,
`Algorithm32.js` changes its model import to `./model/SharedModel.js`;
`SpectralModel.js` and its two model specifications increase their shared
spectral-values import depths by one. Other root-owner imports retain their
depths.

Add exactly one public barrel export:
`Algorithm32` from `./algorithm32/Algorithm32.js`. Do not export
`Algorithm32ShaderHandle`, `SharedModel`, `SpectralModel`, declarations, tests,
or feature-private support. `Algorithm32` retains its reviewed
`@implements {Algorithm32Facade}` relationship and the additive shader-handle
facade relationship established by `P01`.

All nine move destinations are absent and case-fold unique; the existing
feature owner contains only the reviewed `P01` declaration remainder. The
public barrel merge has no symbol collision and expands the reviewed export set
from eight to nine. The reproduced prospective graph contains 207 modules and
598 module edges, with no unresolved import, cycle, production-to-test
edge, production sibling-private dependency, compatibility alias,
archive/experiment dependency, or generated-output dependency. The retained
browser-only model import does not expose the model publicly.

Execution must pass the exact nine-row move, four-consumer path audit, internal
depth audit, nine-export barrel audit, and interface/JSDoc audit; both type
checks; scoped formatting and hygiene; focused facade, shader-handle, model,
React-resource, rendering, and Flat32 specifications; full Node, Three/WebGL,
Flat32 UI, and build gates; and static graph identity before
`F10-react-three`.

### `F09` green checkpoint

Completed on 2026-08-06. The nine facade/model files occupy
`implementation/algorithm32` beside the preserved `P01` private declaration
remainder, and the obsolete `runtime` tree is absent. All caller-facing
consumers use the public barrel, the Stage 10 specification uses the reviewed
test-only model path, and the barrel exports exactly nine classes including
`Algorithm32`. The 299-file tree has identity
`sha256:1efe9d9a2c07772d04fb05d736d9b062adafb1ec2fd8ac50bd3a75d2f162b803`;
its 207-module, 598-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, scoped formatting and hygiene, 31
focused facade, handle, model, and React specs, Node 457/457, Three 5/5,
Flat32 UI 3/3, and the build pass. No commit was created. The next transaction
is `F10-react-three`.

## Tenth Public Feature Manifest: `F10-react-three`

Status: reviewed execution boundary. The exact nine-row feature closure is the
complete `adapters/react` tree except its barrel: the focused specification,
five executable implementation modules, constants, root declarations, and the
composer class declaration. They move unchanged beneath
`implementation/react-three`. The tenth row, `adapters/react/index.js`, merges
its reviewed public symbols into `implementation/index.js` and is removed; no
compatibility barrel remains.

The canonical public contract contains five React/Three exports, not six:
`Algorithm32AtmosphereComposer`, `Algorithm32R3FAtmosphereComposer`,
`Algorithm32Bindings`, `Algorithm32R3FValues`, and
`Algorithm32ThreeResources`. The two composer modules replace their default
exports with named exports, and their internal JSX/specification imports become
named imports. The final implementation barrel therefore exports exactly the
14 symbols in the Step 3 contract, with no default alias, constant,
declaration, test helper, or private module.

The R3F component's canonical target uses a `.js` module and
`React.createElement` rather than authored JSX. This is required because the
native ESM Node regression loads the aggregate public barrel and does not
install a `.jsx` loader. It preserves the component contract and behavior while
avoiding a loader dependency, wrapper, duplicate module, or compatibility
alias. The target map and public contract record the `.js` destination.

`src/flat32/Algorithm32Runtime.js` is the sole external runtime consumer; it
merges `Algorithm32Bindings` into its existing public implementation-barrel
import. The Three Karma entry updates the composer source path to
`implementation/react-three/Algorithm32AtmosphereComposer.js` and applies its
existing inert React/R3F native-host substitutions to the now-barrel-linked R3F
component as well. Within the feature, root-owner math and validation imports
retain their depths. To avoid
a public-barrel cycle, `Algorithm32AtmosphereComposer` replaces its current
barrel import with direct imports of the public sibling entry modules
`../algorithm32/Algorithm32.js` and
`../three-cache-backend/ThreeCacheBackend.js`; it imports no sibling-private
module.

All nine move destinations are absent and case-fold unique. The public barrel
has no symbol collision. Removing the old barrel reduces the Algorithm32 graph
to 206 modules; transferring its five export edges preserves those edges, and
splitting the composer dependency across two public feature entries produces
599 module edges. The Flat32 import consolidation is outside this graph. The
prospective graph has no unresolved import, cycle,
production-to-test edge, sibling-private dependency, compatibility alias,
archive/experiment dependency, or generated-output dependency.

Execution must pass the exact nine-row move, old-barrel removal, runtime/config
consumer audit, named-export/default-export audit, 14-export public-barrel
audit, and internal dependency audit; both type checks; scoped formatting and
hygiene; focused React/Three and Flat32 runtime specifications; full Node,
Three/WebGL, Flat32 UI, and build gates; and static graph identity before
`R01-final-reconciliation`.

### `F10` green checkpoint

Completed on 2026-08-06. The nine React/Three feature files occupy
`implementation/react-three`, the old adapter tree and barrel are absent, and
Flat32 uses the public implementation barrel. Both composer modules use named
exports; the R3F component is a native-ESM `.js` module using
`React.createElement`; the final barrel imports natively and exports exactly
the 14 reviewed symbols. The Three native host applies its existing inert
React/R3F substitutions to both barrel-linked component modules. The 298-file
tree has identity
`sha256:da449727d7994288052507aaf4fa463a58b50955c677eb9f128562172616abcf`;
its 206-module, 599-edge graph has zero unresolved imports, cycles, or
production-to-test edges. Both type checks, scoped formatting and hygiene, 26
focused React, facade, and backend specs, direct 14-export native import, Node
457/457, Three 5/5, Flat32 UI 3/3, and the build pass. No commit was created.
The next transaction is `R01-final-reconciliation`.

## Final Reconciliation Checkpoint: `R01-final-reconciliation`

Status: complete on 2026-08-06. Independent reconciliation found and corrected
one remaining application-to-private-feature edge: `LocationTimeController`
no longer imports `FlatSynchronizer`. The public
`FlatEarthGeometry.resolveObservationInstant()` entry point delegates daily
event selection to that feature-private synchronizer, preserves Flat32 preset
behavior, adds no public export, and leaves all model-coordinate resolution
inside geometry.

The final production tree contains 298 files at
`sha256:a63a5bbe6d9aae39f5d6868f57c50e17bd25ec2c49537bb3e27045f5e4fcf68f`.
Its 206-module, 600-edge graph has zero unresolved imports, cycles,
production-to-test edges, production sibling-private edges, or external deep
imports. The public barrel exports exactly the 14 reviewed symbols, all retired
technical-layer roots are absent, and no class implementation reaches 1,000
lines.

Both type checks, focused flat geometry/synchronization coverage, Node
458/458, Three/WebGL 5/5, Flat32 UI 3/3, the complete production build, both
Flat32 builds, the flat/local policy gate, scoped formatting, static ownership,
whitespace, and current-document link gates pass. Migration-only inventories,
contracts, maps, and transaction records are archived together after this
checkpoint. Extraterrestrial production integration resumes at Step 3.

## Protocol For Every Later Transaction

Before executing the next queue item, expand its exact owner-row selection
into a move table equivalent to `F01`, enumerate every affected runtime,
declaration, test, fixture, application, configuration, browser, and current
documentation consumer, and record a new collision/graph result. The manifest
must be reviewed before edits begin.

Each execution then:

1. verifies the prior green checkpoint and clean transaction scope;
2. applies only the approved moves, creations, splits, and consumer edits;
3. removes every old path in the same transaction without aliases;
4. runs focused numerical/lifecycle tests plus both type checks, format,
   static graph, stale-path, production Algorithm32, affected browser,
   affected Flat32, and build gates in proportion to the scope;
5. updates current status documents with changed paths, verification, and the
   next queue item; and
6. records one green checkpoint before another transaction begins.

Failure, an unresolved target collision, a new sibling-private edge, an
unplanned file, or a required red gate stops the transaction. It does not
authorize broad cleanup, a compatibility alias, or combining the next owner.

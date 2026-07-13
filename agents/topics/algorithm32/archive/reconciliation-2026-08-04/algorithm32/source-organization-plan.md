# Algorithm32 Source Organization Migration Plan

Status: complete on 2026-08-02. Step 4.3.1, implementation batches M1-M11,
and Step 4.3.3 verification and closure all pass. Reconciliation Steps
4.4.1-4.4.3 subsequently completed the geometry, light-source, and rendering
splits on 2026-08-03. Steps 4.5.1-4.5.6 and independent helper-ownership
closure are complete as of 2026-08-04. Reconciliation
[Step 5](./reconciliation-plan.md#5-reconcile-ambient-types) is also complete;
Steps 6.1-6.3 are complete; Step 7.1 is current.
This document is the canonical file-by-file migration plan for
[Algorithm32 reconciliation Step 4.3](./reconciliation-plan.md#43-reorganize-algorithm32-by-exclusive-ownership).
The reconciliation plan owns sequence and completion; this document owns final
source paths, ownership decisions, move batches, affected consumers, and
verification gates.

## Scope And Baseline

The migration starts from clean checkpoint `6ea7cf8` on 2026-08-02. The
current `src/algorithm32` tree contains exactly 245 files reported by
`rg --files src/algorithm32`. The path manifest below must contain every one of
those files exactly once. Paths in this document are relative to
`src/algorithm32/` unless stated otherwise.

This planning step changes no production path. Step 4.3.2 may move only the
current production implementation, its ambient declarations, colocated tests,
browser entries, retained fixtures/configuration, family barrels, and current
documentation directly required by those moves. It does not change numerical
algorithms, physical contracts, supported pairings, runtime ownership, public
behavior, or evidence authority.

The current empty directories under `camera`, `celestial-sources`,
`composition`, `descriptors`, `directional-visibility`, `errors`,
`extended-source-integration`, `physical-frame`, `point-source-raster`, and
`provenance`, including their empty `_tests` children, contain no tracked
migration input. Do not recreate them as scaffolds. A future capability
materializes a directory only with current owned code and its own accepted
scope.

## Selected Organization Decisions

### O1. Exclusive ownership controls placement

Place implementation, declarations, constants, tests, fixtures, and support
used exclusively by one capability inside that capability's containing
folder. Place shared code at the nearest common owner only when at least two
sibling owners currently consume its cohesive contract. Import count,
execution target, or the present flat path does not establish ownership.

### O2. Shared and utility folders require evidence

`shared` is never a miscellaneous folder. `utils/math` contains only cohesive
mathematical operations reused across top-level owners. Domain-specific math
stays with its domain, and class-only support remains a private instance
method. No move creates a single-function utility module, speculative barrel,
or empty directory.

The final map normalizes the seven remaining PascalCase ordinary modules:
pixel, unit-value, spectral-math, W27-domain, Native-48-domain, and distant-Sun
CPU-field operations receive kebab-case filenames; the single-function Three
shadow configurator merges into the existing cohesive Three lighting-support
module. `UNIT_FAMILIES` moves from the unit-value operation module to its
owner-local `consts.js`. Existing PascalCase math namespace modules remain only
where the module exports its one cohesive namespace symbol.

The map also retires the two remaining single-function utility modules.
`finiteNumberOrDefault` joins the existing accepted-value operations in
`utils/validation/value-assertions.js`. The canonical SHA-256 value identity
operation and the stable stringify/FNV operations join the cohesive
`utils/identity/value-hashes.js` owner. Their current algorithms and distinct
serialization semantics remain unchanged; colocation does not make one hash a
substitute for the other.

### O3. Assembly, execution, and renderer adaptation remain distinct

`gpu-assembler/base` owns the direct `ShaderContribution` declaration helpers.
The deterministic value-hash operations used by assemblers, physical spectral
values, and cache identities live in `utils/identity`.
`gpu-assembler/runtime` owns final-view compatibility validation and shader
assembly. `gpu-assembler/cache-pass` owns the direct `CacheBuildModule`
declarations, their binding-name contract, and cache-pass shader assembly.
`gpu-runtime/cache` separately owns cache data/plan values, plan identity,
field/pass/plan contracts, the executor collaborator contract,
renderer-neutral pass/layer execution, and runtime bindings, while
`gpu-runtime/cache/three` owns the concrete Three/WebGL backend. Generic
construction-domain and transport-data contracts live with
`transport/cache`. Assembly does not own plans or execution, and neither owns
a renderer implementation.

Atmosphere, geometry, light-source, ground, transport, cache, and color owners
retain the physical semantics, resources, shader contributions, and cache
modules they provide. In particular, generic recurrence operations live at
`transport/cache`, and the omitted-boundary module lives at
`ground-boundaries/shared/cache`. The proposed provider-named assembler
branches are not materialized because no current standalone adapter is
assembler-owned. A future `gpu-assembler/light-source`, `geometry`, `color`,
or `extraterrestrial` directory requires an actual mechanical adapter; it may
not absorb provider behavior merely because that behavior emits GLSL.

### O4. Light-source and extraterrestrial ownership do not overlap

`light-sources/distant-sun` and `light-sources/local-sun` own atmospheric
illumination, source-relative physical sampling, concrete caches, construction
domains selected by the source, renderer-lighting policy, and cache lifecycle.
`extraterrestrial/sun` owns solar/time synchronization that is independent of
one atmospheric cache implementation. No current code justifies
`extraterrestrial/shared` or `extraterrestrial/stars`, so those directories
remain absent. The `stars` name never authorizes restoration or use of retired
Algorithm32-Star evidence or code.

### O5. Geometry uses one owner tree

Rename `geometries` to singular `geometry`. General coordinate/request
normalization lives in `geometry/shared`. Flat and spherical implementations,
their constants and types, geometry-specific Three endpoint adapters, and
their tests live under `geometry/flat` and `geometry/spherical`. A helper is
shared only when both geometry owners currently consume it.

### O6. Executable domains remain a top-level family

Direction and position domains are consumed directly by geometry, both
source-cache families, transport tests, and parity fixtures. They therefore do
not belong inside one geometry implementation. `domains/direction` contains
the `cubed-sphere` and `fibonacci` owners, while
`domains/position/spherical-native` contains the current radial position
owner. The existing `domains/index.js` remains the one demonstrated family
barrel. A leaf does not import a sibling implementation.

Class-exclusive generator facts from `domains/domain-consts.js` are private
implementation of their sole executable class, not a shared constant surface.
M2 moves those values into private instance support and local literals on the
four domain classes. Each leaf `consts.js` owns only its module-level canonical
domain instances and derived compatibility values; configurable cubed-sphere
and native-position IDs are inline inputs to those canonical constructions.
This keeps direct class entry self-contained and gives the executable module
graph the acyclic order `class -> leaf consts -> leaf helper -> domains/index`.

### O7. Interfaces remain with their capability owner

The requested `types/interfaces` category is not materialized. Every current
interface has a semantic capability owner even when several other owners
consume it: atmosphere, color, geometry, ground boundary, light source,
source-cache contract, assembler, GPU runtime, transport, domain, model,
facade, reference, or Three runtime. Cross-owner consumption is not
ownerlessness. Each interface moves into that capability's nearest included
`types.d.ts`, and the six current one-interface files retire rather than being
recreated. Class-internal declarations remain in the nearest permitted
`types/<ClassName>.d.ts`.

Four destination family files already contain concrete-provider declarations.
M3 first merges the family interface into the existing file; M6 or M8 then
splits only the concrete declarations into leaf owners while retaining the
family interface and other family-wide contracts at the same root path. The
manifest marks these as cumulative M3/M6 or M3/M8 rows so a later move cannot
discard or misplace an earlier interface merge.

### O8. Constants follow their fact owner

The requested root `consts` category is reserved for a future fact genuinely
owned across multiple top-level Algorithm32 areas. No current constant
qualifies after the ownership trace, so Step 4.3 does not materialize a root
`consts/` directory. Mixed `Algorithm32CanonicalData.js` content splits among
the canonical atmosphere, native-15 profile, and Bruneton color owners;
profile-owned numerical defaults remain with `native-15`. Every other constant
moves with its nearest owner in an owner-local `consts.js`.

### O9. Tests, fixtures, and adapters follow the exercised boundary

Behavior specifications and retained fixtures move with their implementation
owner. A true cross-owner integration or browser gate lives with the adapter
or orchestration boundary it exercises, not with whichever fixture it imports.
Three-specific helpers remain inside their physical owner when that owner
defines renderer-lighting or endpoint behavior. The renderer-neutral executor
and the concrete Three backend belong under `gpu-runtime`, never under an
assembler.

The analytic fixture and its ledger contracts live with the existing
production evidence owner at `references/fixtures`, not with one calculator or
runtime path.
The GPU parity policy pins Native-48, W27, and Fibonacci-34 distant-Sun probes,
so it lives beside the native N4 oracle in the distant-Sun cache fixture owner.
Checked evidence may be consumed across owners without transferring its
authority to the consumer.

### O10. Moves are direct and behavior-preserving

Move one coherent ownership boundary at a time. Update all imports,
re-exports, ambient inclusions, Jasmine/Karma entries, and current-document
paths directly. Do not add compatibility re-exports, alias modules, duplicate
old/new trees, fallback imports, path switches, or temporary barrels.

### O11. Final paths precede class splitting

Step 4.3 establishes final owner paths without splitting the five over-limit
classes. Step 4.4 then splits `FlatEarthGeometry`,
`SphericalEarthGeometry`, `LocalSunLightSource`, `DistantSunLightSource`, and
`ShaderBuilder` inside their final folders. A move batch may update types and
JSDoc necessary for the move, but it may not use organization as authority to
change algorithms or public behavior.

### Post-Migration Step 4.4.1 Geometry Additions

Step 4.4.1 preserves the Step 4.3 owner tree and adds exactly 14 files inside
the already-selected flat and spherical owners:

- `geometry/flat/{FlatScatteringCacheGeometry,FlatGeometryCacheModuleProvider,FlatGeometryShaderContributor}.js`;
- `geometry/flat/three/FlatGeometrySceneAdapter.js`;
- `geometry/flat/types/{FlatEarthGeometry,FlatScatteringCacheGeometry}.d.ts`;
- `geometry/flat/three/types/FlatGeometrySceneAdapter.d.ts`;
- `geometry/spherical/{SphericalScatteringCacheGeometry,SphericalGeometryCacheModuleProvider,SphericalGeometryShaderContributor}.js`;
- `geometry/spherical/three/SphericalGeometrySceneAdapter.js`;
- `geometry/spherical/types/{SphericalEarthGeometry,SphericalScatteringCacheGeometry}.d.ts`; and
- `geometry/spherical/three/types/SphericalGeometrySceneAdapter.d.ts`.

The existing facades, owner-local constants and ambient declarations, shared
geometry public contracts, and Algorithm32 Three Karma configuration changed
in place. No barrel, compatibility path, descriptor, factory, manifest,
cross-geometry executable helper, or new directory category was added. The
live tree therefore advances from the Step 4.3 checkpoint's 268 files to 282
files, and the geometry owner tree advances from 19 to 33 files. The original
245-row migration manifest remains the immutable Step 4.3 checkpoint map; the
list above is the canonical post-migration addition set.

### Post-Migration Step 4.4.2 Light-Source Additions

Step 4.4.2 preserves the Step 4.3 owner tree and adds exactly 13 files inside
the already-selected local- and distant-Sun owners:

- `light-sources/local-sun/LocalSunShaderContributor.js`;
- `light-sources/local-sun/cache/LocalSunCacheProvider.js`;
- `light-sources/local-sun/cache/types/LocalSunCacheProvider.d.ts`;
- `light-sources/local-sun/three/LocalSunSceneLightingAdapter.js`;
- `light-sources/local-sun/three/types.d.ts` and
  `three/types/LocalSunSceneLightingAdapter.d.ts` beneath the local owner;
- `light-sources/distant-sun/DistantSunShaderContributor.js`;
- `light-sources/distant-sun/cache/DistantSunCacheProvider.js`;
- `light-sources/distant-sun/cache/types/DistantSunCacheProvider.d.ts`;
- `light-sources/distant-sun/three/{consts,DistantSunSceneLightingAdapter}.js`;
  and
- `light-sources/distant-sun/three/types.d.ts` and
  `three/types/DistantSunSceneLightingAdapter.d.ts` beneath the distant owner.

The existing facades, source/cache/shared ambient declarations, and one
distant-Sun specification changed in place. Local and distant roles have
matched names and responsibility boundaries without sharing executable source
behavior. No compatibility path, descriptor, factory, nested manifest,
barrel, assembler branch, bare Three import, Karma key, or new directory
category was added. Constructor-facing contracts occupy the nearest public
owner declarations and class-only types occupy their dedicated class files.
The live tree therefore advances from 282 to 295 files, and the light-source
owner tree advances from 79 to 92 files. The original 245-row migration
manifest remains the immutable Step 4.3 checkpoint map; this list is the
canonical Step 4.4.2 addition set.

### Post-Migration Step 4.4.3 Rendering Additions

Step 4.4.3 preserves the Step 4.3 runtime owner tree and adds exactly three
files inside the already-selected rendering owners:

- `runtime/rendering/ShaderAssemblyPreparer.js`;
- `runtime/rendering/three/ShaderRuntimeInstaller.js`; and
- `runtime/rendering/three/types/ShaderRuntimeInstaller.d.ts`.

The existing `ShaderBuilder.js`, rendering `types.d.ts`, and cross-provider
assembly specification changed in place. The public builder retains build and
cache lifecycle orchestration, deterministic assembly preparation occupies the
rendering root, and injected-Three installation occupies `rendering/three`.
No factory, descriptor, manifest, barrel, compatibility path, bare Three
import, Karma key, or new directory category was added. The live tree advances
from 295 to 298 files, the rendering owner advances from 15 to 18 files, and
the formatted JavaScript/JSX/declaration scope advances from 287 to 290 files.
The original 245-row migration manifest remains the immutable Step 4.3
checkpoint map; this list is the canonical Step 4.4.3 addition set.

## Selected Target Tree

Only directories with mapped current code are shown. Family-level `index.js`
barrels remain only where a current legitimate barrel already exists.

```text
src/algorithm32/
|-- runtime/
|   |-- facade/
|   |-- model/
|   |-- reference/
|   `-- rendering/
|       `-- three/
|-- atmospheres/
|   `-- canonical/
|-- light-sources/
|   |-- shared/
|   |   |-- cache/
|   |   `-- three/
|   |-- distant-sun/
|   |   |-- cache/
|   |   `-- three/
|   `-- local-sun/
|       |-- cache/
|       `-- three/
|-- extraterrestrial/
|   `-- sun/
|-- geometry/
|   |-- shared/
|   |-- flat/
|   |   `-- three/
|   `-- spherical/
|       `-- three/
|-- ground-boundaries/
|   |-- shared/
|   |   `-- cache/
|   `-- uniform-lambertian/
|-- domains/
|   |-- direction/
|   |   |-- cubed-sphere/
|   |   `-- fibonacci/
|   `-- position/
|       `-- spherical-native/
|-- transport/
|   |-- cache/
|   `-- spectral/
|-- quantities/
|   |-- spectral/
|   `-- units/
|-- profiles/
|   `-- native-15/
|-- color/
|   `-- bruneton/
|-- gpu-assembler/
|   |-- base/
|   |-- runtime/
|   `-- cache-pass/
|-- gpu-runtime/
|   `-- cache/
|       `-- three/
|-- adapters/
|   `-- react/
|-- utils/
|   |-- math/
|   |-- identity/
|   |-- validation/
|   `-- time/
|-- references/
|   `-- fixtures/
|-- README.md
|-- evidence.md
|-- references.md
`-- jsconfig.json
```

## Dependency Direction

The permitted high-level direction after migration is:

```text
utils -> quantities -> domains
utils + quantities -> profiles
profiles -> atmosphere + color + runtime defaults
quantities + domains -> geometry
quantities + family provider interfaces -> transport/spectral
transport/cache + transport/spectral + atmosphere + geometry + ground -> light-source caches

gpu-runtime/cache contracts -> source cache-plan builders
gpu-runtime/cache contracts -> gpu-assembler/cache-pass
gpu-runtime/cache contracts -> gpu-runtime/cache/three
gpu-assembler/base -> shader-contribution providers + gpu-assembler/runtime
gpu-assembler/cache-pass -> cache-module providers + source cache controllers

transport/spectral + runtime/model -> runtime/reference
provider contributions + gpu-assembler/runtime + active cache -> runtime/rendering
runtime/rendering -> runtime/rendering/three
runtime/model + runtime/reference + runtime/rendering -> runtime/facade
runtime/facade + Three/application boundaries -> adapters/react
```

Arrows point from a lower owner or contract to an owner permitted to import or
otherwise consume it; they do not transfer runtime ownership. Provider modules
may depend on declaration/creation helpers from an assembler, while an
assembler receives only their direct `ShaderContribution` or
`CacheBuildModule` values and never imports provider implementations. The
value flow back into an assembler is not a reverse source dependency.

### Ownership-Deciding Internal Consumers

Every internal importer is itself one of the 245 manifest rows. At the start
of each batch, resolve every relative import/re-export of that batch's current
paths, update those consumers with the move, and require the exact old-path
scan to be empty. The following cross-owner consumers are recorded separately
because they determine a shared or neutral placement rather than a leaf move:

| Current provider | Current ownership-deciding consumers | Final owner decision |
| --- | --- | --- |
| `implementation/SpectralCalculator.js` | `implementation/Reference.js`, `light-sources/distant-sun-primary-radiance.js`, `light-sources/LocalSunLightSource.js`, and the local-Sun CPU-cache specification | `transport/spectral`; reference and both source families consume the same physical calculator without depending on one another. |
| `caches/gpu/cache-build-contracts.js`: `createCachePlanIdentity` | Distant- and local-Sun cache-plan builders plus the cache-executor specification | `gpu-runtime/cache/cache-values.js`; the completed plan is an executor input, not an assembly declaration. |
| `caches/gpu/cache-build-contracts.js`: `createCacheData` | Canonical atmosphere, both geometry owners, `LocalSunCacheSource`, and cache assembly/controller specifications | `gpu-runtime/cache/cache-values.js`; the copied data record is a runtime binding value shared across providers. |
| `caches/gpu/cache-build-contracts.js`: module and binding helpers | Cache-pass assembly, `CacheOperations`, atmosphere, geometry, source and ground module providers, Three cache execution, and their specifications | `gpu-assembler/cache-pass`; these operations define the direct cache-module assembly protocol. |
| `light-sources/ThreeShadowObjectConfigurator.js` | Both concrete light sources and its shared Three specification | Merge into `light-sources/shared/three/three-lighting-support.js`; two sibling sources share the behavior and no standalone single-function owner survives. |
| `utils/PixelMath.js` | Rendering, scene capture/pass, React adaptation, and light-source request normalization | `utils/math/pixel-math.js`; pixel scalar/value operations are genuinely cross-owner math support. |
| `utils/numeric-values.js` and `utils/value-assertions.js` | Both geometry owners, both concrete light sources, shared light-source request acceptance, canonical identity serialization, and direct validation specifications | Merge into `utils/validation/value-assertions.js`; finite/default acceptance is one of the cohesive value-ingress operations, not a standalone utility. |
| `utils/canonical-value-identity.js` and `shader/stable-hash.js` | Spectral basis/packet/math identities, both source-cache reuse/build identities, cache data/module values, and both assemblers | Merge into `utils/identity/value-hashes.js`; retain the canonical SHA-256 and stable stringify/FNV contracts as distinct operations in one cohesive cross-owner identity module. |

Leaf-local consumers, tests, and barrels follow their manifest batch. The
exact out-of-tree consumers and configuration keys are enumerated under Live
External Consumers And Configuration rather than inferred from this table.

## Migration Batches

Every batch begins with an exact current-path scan, moves all colocated
implementation/declaration/test/fixture paths in its manifest rows, updates
every named consumer, runs its focused gates, and ends with `git diff --check`.
No unrelated batch begins with an open failure.

| Batch | Ownership surface | Dependency and consumer rule | Focused verification |
| --- | --- | --- | --- |
| M1 | `utils/{math,identity,validation,time}` | Move foundational operations first and update all production/test imports once. Merge the canonical SHA-256 and stable stringify/FNV operations into `value-hashes.js` in the same transaction, updating both still-unmoved assembler consumers; merge finite/default acceptance into `value-assertions.js`; and retain math, identity, accepted-value validation, and duration normalization as distinct cohesive owners. Rename the ordinary pixel module and its spec to kebab-case. | Utility, identity, validation, value, final-view assembler, and cache-pass assembler specs, including direct finite/default cases; type check; Prettier; old-path scan. |
| M2 | `quantities/{units,spectral}` and `domains/{direction/{cubed-sphere,fibonacci},position/spherical-native}` | Establish final unit, spectral, and executable-domain paths before moving physical owners. Rename the ordinary unit, spectral-math, W27, and Native-48 modules; move `UNIT_FAMILIES` to the unit owner constants; retire `domain-consts.js` into class-private generator support plus inline canonical IDs without introducing a class/constant initialization cycle; preserve only the existing family barrels as real public aggregators. | Quantity and domain specs plus the directly affected scattering-density transport spec; type check; Prettier; old-path scan. |
| M3 | Capability-owned ambient interfaces | Merge each dedicated interface into its semantic family owner and distribute the mixed root ambient file to the nearest mapped capability. Record every cumulative target that an earlier or later owner batch also populates; retarget the four moved facade class-type `import(...)` expressions to their still-pre-M9 implementations; do not materialize a syntax-based root interface bucket. | Algorithm32 and combined Algorithm32/Flat32 declaration-name preservation, duplicate-name and exact owner-placement scans; type checks; transient-inline-import, prohibited dedicated-interface, and root-bucket scans; diff check. |
| M4 | `gpu-assembler/{base,runtime,cache-pass}`, GPU cache contract/value foundations, and shared CPU source-cache storage | Move the shader declaration base; atomically split and retire both mixed cache build/type sources into cache-pass assembly, runtime data/plan values, transport construction data, and the final omitted-ground ID owner; then move the two distinct assemblers before higher-level consumers. Move the CPU field shared by both concrete source caches to their nearest common owner. The assemblers and runtime value owner retain their M1 dependency on `utils/identity/value-hashes.js`. | Shader contribution, runtime assembler/validator, cache-pass assembler, cache-value, executor plan-identity, canonical identity, and CPU field specs; type check; Prettier; exact declaration/export and dependency-direction scans. |
| M5 | `gpu-runtime/cache`, `gpu-runtime/cache/three`, `transport/{cache,spectral}`, retained generic `transport`, `ground-boundaries/shared/cache`, and the calculator's production analytic fixture | Begin only after M4's mixed cache sources are absent and all split targets exist. Move cache execution separately from assembly; move recurrence and the cross-source spectral calculator into transport owners, merging its exclusive numerical kernels as private instance support; move its checked fixture/ledger together to `references/fixtures` and retarget both readers; retarget and reverify retained generic transport paths; move the omitted-ground provider to its physical owner; and move the concrete backend below GPU runtime, including its deeper browser Three import. | Cache executor/operations and source-cache consumers, SpectralCalculator, analytic fixture, transport adapters, black-ground consumers, and Three backend specs; both type checks; full Node regression; full Three/WebGL lane; Prettier; exact fixture/browser/path/dependency scans. |
| M6 | `profiles/native-15`, `atmospheres/canonical`, `color/bruneton`, and ground-boundary owners | Split mixed canonical constants by fact owner, then move configured physical/display owners and their tests/types; retarget the Stage 10 browser spec's direct profile and color imports in the same transaction. | Profile, canonical-data replacement, atmosphere, color, and ground specs; both type checks; full Node regression; full Three/WebGL lane; Prettier. |
| M7 | `geometry/{shared,flat,spherical}` including geometry-owned Three endpoints | Establish the singular 19-file geometry tree and move shared helpers only where both concrete owners consume them. Merge spherical declarations into the M3 target rather than replacing it; split only the two endpoint declarations from M5's residual `three/types.d.ts`; retarget seven external Algorithm32 specs, two Flat32 modes, and exactly four geometry/endpoint Karma keys while leaving the React key unchanged. | Expected 56 flat/spherical/endpoint specs; both type checks; full Node and Three/WebGL lanes; exact 19-file, 42-declaration, consumer-edge, Karma-key, dependency and frozen-surface scans; Prettier. |
| M8 | `extraterrestrial/sun` and all light-source owner trees | Move 70 manifest inputs to 77 unique targets: common source contracts/helpers, distant and local source/cache families, their tests and checked fixtures, and independent solar synchronization. Split 29 local constants 4/25, normalize the distant CPU-field module, merge the single-function Three shadow configurator into five-function shared Three lighting support, and cumulatively split M3 declarations without replacing them. Preserve selected spherical/distant and flat/local behavior. | Expected 156 focused source/cache/transport/assembly specs; both type checks; full 429-spec Node and 5-spec Three/WebGL lanes; exact fixture URL/hash, 109-export, 158-declaration, 257 JavaScript-relative/258 declaration-inclusive relative imports, 10 external edges, target/retirement/dependency/cycle scans; Prettier. |
| M9 | `runtime/{model,reference,rendering,facade}` | Move 24 manifest inputs to 28 unique target references and an exact 30-file runtime tree after all providers have final paths. Split only the two implementation constant/type sources; retarget M3's four facade implementation links to their final runtime siblings; deepen the moved Stage-10 browser imports; and preserve the post-M7 Karma keys under recursive browser discovery. Reference consumes the neutral transport spectral calculator. `ShaderBuilder` moves intact and remains at the rendering owner until Step 4.4. | Expected 64 focused model/reference/rendering/facade specs; both type checks; full 429-spec Node and 5-spec Three/WebGL lanes; exact 30-file, 12-export, declaration, 52-import, external-edge, browser/Karma, dependency and cycle scans; Prettier. |
| M10 | `adapters/react` and retained integration/browser gates | Move the six React/R3F adapter paths, retarget the sole external Flat32 import, and replace exactly the existing React-composer Karma key. M10 moves no browser specification: M5 and M9 already own those moves, while M10 reverifies the retained browser lane and exact five final Algorithm32 preprocessor keys. | Expected 9 React-utility specs in one suite; both type checks; complete Node and Three/WebGL lanes; exact six-file/export/import/external-edge/Karma/dependency scans; Prettier. |
| M11 | Root documents/configuration and path closure | Move no source. Reverify the settled analytic-fixture path, update exactly the 14 current documents in the M11 contract, delete only the invalid frozen-study package exposure, and remove vacated physical empty directories without rewriting frozen evidence. | Expected 4 analytic-fixture specs across two suites; checkpoint 245-row/current-column and live 268-target manifest scans; scoped live-path/duplicate/empty-directory/document/package scans; both type checks; Prettier; complete Node, Three/WebGL, retained policy-integrity, and Flat32 UI gates; `git diff --check` plus untracked-file whitespace coverage. |

## File-By-File Migration Manifest

Each current path appears exactly once in the tables below. The batch supplies
the owner rationale, dependency direction, consumer-update rule, and focused
gate for its rows. `split ->` means the current mixed file is retired after
all named exports or declarations move to the listed owner files; it does not
authorize a compatibility wrapper.

### Package root and foundational utilities

| Current path | Target path | Batch | Classification and owner |
| --- | --- | --- | --- |
| `_tests/algorithm32-facade.spec.js` | `runtime/facade/_tests/algorithm32-facade.spec.js` | M9 | Facade behavior specification |
| `_tests/Algorithm32ShaderHandle.spec.js` | `runtime/facade/_tests/Algorithm32ShaderHandle.spec.js` | M9 | Facade-handle behavior specification |
| `_tests/fixtures.spec.js` | `references/fixtures/_tests/fixtures.spec.js` | M5 | Production analytic-fixture ledger specification; repository-root resolution retargeted with the move |
| `_tests/utils.spec.js` | `utils/math/_tests/utils.spec.js` | M1 | Math-barrel behavior specification |
| `Algorithm32.js` | `runtime/facade/Algorithm32.js` | M9 | Public lifecycle facade class |
| `Algorithm32ShaderHandle.js` | `runtime/facade/Algorithm32ShaderHandle.js` | M9 | Facade-owned runtime handle class |
| `evidence.md` | `evidence.md` | M11 | Package evidence document; retained root path |
| `jsconfig.json` | `jsconfig.json` | M11 | Recursive Algorithm32 type-check configuration; retained root path |
| `README.md` | `README.md` | M11 | Package layout document; retained root path and rewritten layout |
| `references.md` | `references.md` | M11 | Numbered production-reference owner; retained root path |
| `types.d.ts` | `references/fixtures/types.d.ts` | M5 | Production fixture-ledger ambient contracts moved with their reader |
| `references/README.md` | `references/README.md` | M11 | Reference-folder document; retained path |
| `utils/_tests/canonical-value-identity.spec.js` | `utils/identity/_tests/value-hashes.spec.js` | M1 | Canonical identity cases moved to the cohesive value-hash specification |
| `utils/_tests/PixelMath.spec.js` | `utils/math/_tests/pixel-math.spec.js` | M1 | Ordinary pixel-math specification; filename normalized |
| `utils/_tests/value-assertions.spec.js` | `utils/validation/_tests/value-assertions.spec.js` | M1 | Shared value-ingress specification |
| `utils/AngleMath.js` | `utils/math/AngleMath.js` | M1 | Cohesive math namespace |
| `utils/ArrayMath.js` | `utils/math/ArrayMath.js` | M1 | Cohesive math namespace |
| `utils/canonical-value-identity.js` | `utils/identity/value-hashes.js` | M1 | Canonical serialization and SHA-256 operation establish the cohesive cross-owner value-hash owner |
| `shader/stable-hash.js` | merge -> `utils/identity/value-hashes.js` | M1 | Stable stringify/FNV operations join the same owner in the same batch; both assembler imports update directly and the source retires |
| `utils/DistanceMath.js` | `utils/math/DistanceMath.js` | M1 | Cohesive math namespace |
| `utils/duration-values.js` | `utils/time/duration-values.js` | M1 | Cross-owner duration normalization module |
| `utils/MathUtils.js` | `utils/math/index.js` | M1 | Existing math-family barrel; kebab/barrel target |
| `utils/numeric-values.js` | merge -> `utils/validation/value-assertions.js` | M1 | Finite/default acceptance joins the existing cohesive value-ingress operations; source retired |
| `utils/PixelMath.js` | `utils/math/pixel-math.js` | M1 | Cohesive ordinary pixel-math module; filename normalized |
| `utils/SampleMath.js` | `utils/math/SampleMath.js` | M1 | Cohesive math namespace |
| `utils/ScalarMath.js` | `utils/math/ScalarMath.js` | M1 | Cohesive math namespace |
| `utils/SceneMath.js` | `utils/math/SceneMath.js` | M1 | Cohesive math namespace |
| `utils/types.d.ts` | `utils/math/types.d.ts` | M1/M3 | Math/sample ambient contracts; M3 later adds the shared `UnitVector3` contract |
| `utils/value-assertions.js` | `utils/validation/value-assertions.js` | M1 | Shared ingress assertion module |
| `utils/VectorMath.js` | `utils/math/VectorMath.js` | M1 | Cohesive math namespace |
| `utils/WavelengthMath.js` | `utils/math/WavelengthMath.js` | M1 | Cohesive math namespace |

Utility consumers may import only the focused owner they use. `utils/identity`
may depend on `utils/validation`; math leaves may depend on sibling math
owners and unit contracts. No utility imports a physical provider or runtime
orchestrator.

### Quantities and executable domains

| Current path | Target path | Batch | Classification and owner |
| --- | --- | --- | --- |
| `quantities/_tests/SpectralBasis.spec.js` | `quantities/spectral/_tests/SpectralBasis.spec.js` | M2 | Spectral-basis class specification |
| `quantities/_tests/spectral-packet.spec.js` | `quantities/spectral/_tests/spectral-packet.spec.js` | M2 | Spectral-packet specification |
| `quantities/_tests/UnitValue.spec.js` | `quantities/units/_tests/unit-values.spec.js` | M2 | Ordinary unit-value operation specification; filename normalized |
| `quantities/consts.js` | `quantities/spectral/consts.js` | M2 | Spectral quantity and units constants |
| `quantities/index.js` | `quantities/index.js` | M2 | Existing quantity-family barrel; retained and retargeted |
| `quantities/spectral-bases.js` | `quantities/spectral/spectral-bases.js` | M2 | Spectral-basis operations |
| `quantities/SpectralBasis.js` | `quantities/spectral/SpectralBasis.js` | M2 | Spectral-basis class |
| `quantities/spectral-basis-contract.js` | `quantities/spectral/spectral-basis-contract.js` | M2 | Spectral-basis normalization contract |
| `quantities/SpectralMath.js` | `quantities/spectral/spectral-math.js` | M2 | Cohesive ordinary spectral-operation module; filename normalized |
| `quantities/SpectralPacket.js` | `quantities/spectral/SpectralPacket.js` | M2 | Spectral-packet class |
| `quantities/spectral-packet-contract.js` | `quantities/spectral/spectral-packet-contract.js` | M2 | Spectral-packet normalization contract |
| `quantities/spectral-packets.js` | `quantities/spectral/spectral-packets.js` | M2 | Spectral-packet operations |
| `quantities/types.d.ts` | split -> `quantities/units/types.d.ts`<br>`quantities/spectral/types.d.ts` | M2 | Mixed unit and spectral ambient contracts; source retired |
| `quantities/UnitValue.js` | split -> `quantities/units/unit-values.js`<br>`quantities/units/consts.js` | M2 | Ordinary unit-value operations plus owner-local exported `UNIT_FAMILIES`; source retired |
| `domains/_tests/cubed-sphere-direction-domain.spec.js` | `domains/direction/cubed-sphere/_tests/cubed-sphere-direction-domain.spec.js` | M2 | Cubed-sphere domain specification |
| `domains/_tests/CubedSphereW27DirectionDomain.spec.js` | `domains/direction/cubed-sphere/_tests/cubed-sphere-w27-direction-domain.spec.js` | M2 | W27 ordinary domain-module specification; filename normalized |
| `domains/_tests/Fibonacci34DirectionDomain.spec.js` | `domains/direction/fibonacci/_tests/Fibonacci34DirectionDomain.spec.js` | M2 | Fibonacci domain specification |
| `domains/_tests/Native48PositionDomain.spec.js` | `domains/position/spherical-native/_tests/native-48-position-domain.spec.js` | M2 | Native-48 ordinary domain-module specification; filename normalized |
| `domains/_tests/paired-fibonacci-34-direction-domain.spec.js` | `domains/direction/fibonacci/_tests/paired-fibonacci-34-direction-domain.spec.js` | M2 | Paired-Fibonacci domain specification |
| `domains/_tests/spherical-native-position-domain.spec.js` | `domains/position/spherical-native/_tests/spherical-native-position-domain.spec.js` | M2 | Spherical-native position-domain specification |
| `domains/consts.js` | split/merge -> `domains/direction/cubed-sphere/consts.js`<br>`domains/direction/fibonacci/consts.js`<br>`domains/position/spherical-native/consts.js` | M2 | Canonical executable domain-owner constants and derived compatibility values split to their leaf owners; source retired |
| `domains/CubedSphereDirectionDomain.js` | `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js` | M2 | Cubed-sphere direction-domain class |
| `domains/CubedSphereW27DirectionDomain.js` | `domains/direction/cubed-sphere/cubed-sphere-w27-direction-domain.js` | M2 | W27 ordinary factory/selection module; filename normalized and constant re-exports removed |
| `domains/domain-consts.js` | split/merge -> `domains/direction/cubed-sphere/CubedSphereDirectionDomain.js`<br>`domains/direction/cubed-sphere/consts.js`<br>`domains/direction/fibonacci/Fibonacci34DirectionDomain.js`<br>`domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js`<br>`domains/position/spherical-native/SphericalNativePositionDomain.js`<br>`domains/position/spherical-native/consts.js` | M2 | Class-exclusive generator facts become private executable-owner support; configurable canonical IDs become inline leaf-constant construction inputs; source retired |
| `domains/Fibonacci34DirectionDomain.js` | `domains/direction/fibonacci/Fibonacci34DirectionDomain.js` | M2 | Fibonacci direction-domain class |
| `domains/index.js` | `domains/index.js` | M2 | Existing executable-domain family barrel; retained and retargeted |
| `domains/Native48PositionDomain.js` | `domains/position/spherical-native/native-48-position-domain.js` | M2 | Native-48 ordinary factory/selection module; filename normalized and constant re-exports removed |
| `domains/PairedFibonacci34DirectionDomain.js` | `domains/direction/fibonacci/PairedFibonacci34DirectionDomain.js` | M2 | Paired-Fibonacci direction-domain class |
| `domains/SphericalNativePositionDomain.js` | `domains/position/spherical-native/SphericalNativePositionDomain.js` | M2 | Spherical-native position-domain class |
| `domains/types.d.ts` | split -> `domains/types.d.ts`<br>`domains/direction/cubed-sphere/types.d.ts`<br>`domains/direction/fibonacci/types.d.ts`<br>`domains/position/spherical-native/types.d.ts` | M2 | Generic and leaf-domain ambient contracts; mixed source retired |

Quantities depend inward on utilities. Domain leaves depend on quantities and
math, while geometry, transport, source caches, and fixtures may consume the
root domain barrel or a direct leaf. No domain leaf imports a geometry or
source implementation.

### Capability-owned interface declarations

| Current path | Target path | Batch | Classification and owner |
| --- | --- | --- | --- |
| `types/AtmosphereModel.d.ts` | merge -> `atmospheres/types.d.ts` | M3 | Atmosphere-family provider interface; dedicated source retired |
| `types/Color.d.ts` | merge -> `color/types.d.ts` | M3 | Color-family provider interface; dedicated source retired |
| `types/GeometryModel.d.ts` | merge -> `geometry/types.d.ts` | M3 | Geometry-family provider interface; dedicated source retired |
| `types/GroundBoundary.d.ts` | merge -> `ground-boundaries/types.d.ts` | M3 | Ground-boundary-family provider interface; dedicated source retired |
| `types/LightSourceModel.d.ts` | merge -> `light-sources/types.d.ts` | M3 | Light-source-family provider interface; dedicated source retired |
| `types/ScatteringCache.d.ts` | merge -> `light-sources/shared/cache/types.d.ts` | M3 | Common source-cache consumer interface; dedicated source retired |
| `types/types.d.ts` | split -> `utils/math/types.d.ts`<br>`light-sources/shared/types.d.ts`<br>`light-sources/shared/three/types.d.ts`<br>`light-sources/shared/cache/types.d.ts`<br>`geometry/shared/types.d.ts`<br>`geometry/spherical/types.d.ts`<br>`atmospheres/types.d.ts`<br>`ground-boundaries/types.d.ts`<br>`color/types.d.ts`<br>`profiles/native-15/types.d.ts`<br>`runtime/facade/types.d.ts`<br>`runtime/facade/types/Algorithm32.d.ts`<br>`runtime/facade/types/Algorithm32ShaderHandle.d.ts` | M3 | Mixed Algorithm32 contracts; source retired after every declaration reaches its explicit owner target |

### Profiles and physical providers

| Current path | Target path | Batch | Classification and owner |
| --- | --- | --- | --- |
| `constants/_tests/Algorithm32CanonicalData.spec.js` | split/merge -> `profiles/native-15/_tests/native-15-profile.spec.js`<br>`atmospheres/canonical/_tests/CanonicalAtmosphere.spec.js`<br>`color/bruneton/_tests/bruneton-color-display-model.spec.js` | M6 | Mixed default-fact specification; source retired |
| `constants/Algorithm32CanonicalData.js` | split/merge -> `profiles/native-15/consts.js`<br>`atmospheres/canonical/consts.js`<br>`color/bruneton/consts.js` | M6 | Mixed profile, atmosphere, and display constants; source retired |
| `constants/types.d.ts` | merge -> `profiles/native-15/types.d.ts` | M3/M6 | Native spectral-channel constant contract merged after M3 establishes the profile target; source retired |
| `profiles/_tests/native-15-profile.spec.js` | `profiles/native-15/_tests/native-15-profile.spec.js` | M6 | Native-15 profile specification |
| `profiles/consts.js` | `profiles/native-15/consts.js` | M6 | Native-15 basis/cache/default constants; merge target |
| `profiles/index.js` | `profiles/index.js` | M6 | Existing profile-family barrel; retained and retargeted |
| `profiles/native-15-profile.js` | `profiles/native-15/native-15-profile.js` | M6 | Native-15 profile factory/default owner |
| `profiles/types.d.ts` | merge -> `profiles/native-15/types.d.ts` | M3/M6 | Native-15 profile ambient contracts merged into the M3 target |
| `atmospheres/_tests/CanonicalAtmosphere.spec.js` | `atmospheres/canonical/_tests/CanonicalAtmosphere.spec.js` | M6 | Canonical-atmosphere specification |
| `atmospheres/CanonicalAtmosphere.js` | `atmospheres/canonical/CanonicalAtmosphere.js` | M6 | Canonical atmosphere class and contribution provider |
| `atmospheres/consts.js` | `atmospheres/canonical/consts.js` | M6 | Canonical atmosphere cache-pass constants; merge target |
| `atmospheres/types.d.ts` | split in place -> `atmospheres/types.d.ts`<br>`atmospheres/canonical/types.d.ts` | M3/M6 | Retain the M3 family interface and shared atmosphere contracts at root; move existing canonical declarations to the leaf |
| `color/_tests/bruneton-color-display-model.spec.js` | `color/bruneton/_tests/bruneton-color-display-model.spec.js` | M6 | Bruneton display-model specification; merge target |
| `color/_tests/consts.js` | `color/bruneton/_tests/consts.js` | M6 | Bruneton E8 reference values |
| `color/BrunetonColorDisplayModel.js` | `color/bruneton/BrunetonColorDisplayModel.js` | M6 | Bruneton display-model class and contribution provider |
| `color/consts.js` | `color/bruneton/consts.js` | M6 | Bruneton color/display constants; merge target |
| `color/types.d.ts` | split in place -> `color/types.d.ts`<br>`color/bruneton/types.d.ts` | M3/M6 | Retain the M3 family interface and shared color contracts at root; move existing Bruneton declarations to the leaf |
| `ground-boundaries/_tests/uniform-lambertian-ground-boundary.spec.js` | `ground-boundaries/uniform-lambertian/_tests/uniform-lambertian-ground-boundary.spec.js` | M6 | Uniform-Lambertian boundary specification |
| `ground-boundaries/consts.js` | `ground-boundaries/uniform-lambertian/consts.js` | M6 | Uniform-Lambertian boundary constants |
| `ground-boundaries/index.js` | `ground-boundaries/index.js` | M6 | Existing ground-family barrel; retained and retargeted |
| `ground-boundaries/types.d.ts` | split in place -> `ground-boundaries/types.d.ts`<br>`ground-boundaries/uniform-lambertian/types.d.ts` | M3/M6 | Retain the M3 family interface and shared BRDF contract at root; move the existing Uniform-Lambertian options to the leaf |
| `ground-boundaries/UniformLambertianGroundBoundary.js` | `ground-boundaries/uniform-lambertian/UniformLambertianGroundBoundary.js` | M6 | Uniform-Lambertian boundary class and contribution provider |
| `geometries/_tests/flat-earth-geometry.spec.js` | `geometry/flat/_tests/flat-earth-geometry.spec.js` | M7 | Flat-geometry behavior specification |
| `geometries/_tests/spherical-earth-geometry.spec.js` | `geometry/spherical/_tests/spherical-earth-geometry.spec.js` | M7 | Spherical-geometry behavior specification |
| `geometries/consts.js` | split -> `geometry/flat/consts.js`<br>`geometry/spherical/consts.js` | M7 | Mixed flat/spherical geometry constants; source retired |
| `geometries/FlatEarthGeometry.js` | `geometry/flat/FlatEarthGeometry.js` | M7 | Flat geometry class and contribution provider |
| `geometries/geometry-coordinates.js` | `geometry/shared/geometry-coordinates.js` | M7 | Coordinate normalization shared by both geometries |
| `geometries/geometry-request-normalization.js` | `geometry/shared/geometry-request-normalization.js` | M7 | Request normalization shared by both geometries |
| `geometries/scattering-cache-direction-frames.js` | `geometry/spherical/scattering-cache-direction-frames.js` | M7 | Spherical-only cache-frame operations |
| `geometries/SphericalEarthGeometry.js` | `geometry/spherical/SphericalEarthGeometry.js` | M7 | Spherical geometry class and contribution provider |
| `geometries/types.d.ts` | split -> `geometry/flat/types.d.ts`<br>`geometry/spherical/types.d.ts` | M3/M7 | Mixed flat/spherical ambient contracts; the spherical target retains M3's shared spherical request; source retired |

Profiles provide typed defaults to physical owners and runtime configuration;
they do not import runtime orchestration. Atmosphere, color, geometry, and
ground own the semantics and resources of the contributions they construct.
They may depend on assembler declaration factories, but neither assembler
imports a concrete provider implementation.

### Assembly, GPU runtime, shared cache, and transport

| Current path | Target path | Batch | Classification and owner |
| --- | --- | --- | --- |
| `caches/_tests/CpuDirectionalSpectralField.spec.js` | `light-sources/shared/cache/_tests/CpuDirectionalSpectralField.spec.js` | M4 | CPU field specification shared by both source caches |
| `caches/consts.js` | `light-sources/shared/cache/consts.js` | M4 | Shared source-cache construction defaults |
| `caches/CpuDirectionalSpectralField.js` | `light-sources/shared/cache/CpuDirectionalSpectralField.js` | M4 | CPU field class shared by both source caches |
| `caches/gpu/_tests/CacheGpuExecutor.spec.js` | `gpu-runtime/cache/_tests/CacheGpuExecutor.spec.js` | M5 | Renderer-neutral GPU execution specification |
| `caches/gpu/_tests/CacheOperations.spec.js` | `transport/cache/_tests/CacheOperations.spec.js` | M5 | Generic cache-recurrence provider specification |
| `caches/gpu/_tests/CachePassAssembler.spec.js` | `gpu-assembler/cache-pass/_tests/CachePassAssembler.spec.js` | M4 | Cache-pass assembler specification |
| `caches/gpu/cache-build-contracts.js` | split -> `gpu-assembler/cache-pass/cache-build-contracts.js`<br>`gpu-assembler/cache-pass/consts.js`<br>`gpu-runtime/cache/cache-values.js`<br>`ground-boundaries/shared/cache/consts.js` | M4 | Cache-module assembly helpers, assembly binding constant, runtime data/plan values, and omitted-ground id split atomically to their final owners so the mixed source retires in M4 |
| `caches/gpu/CacheGpuExecutor.d.ts` | `gpu-runtime/cache/types/CacheGpuExecutor.d.ts` | M5 | GPU executor class declaration |
| `caches/gpu/CacheGpuExecutor.js` | `gpu-runtime/cache/CacheGpuExecutor.js` | M5 | Renderer-neutral GPU executor class |
| `caches/gpu/CacheOperations.d.ts` | `transport/cache/types/CacheOperations.d.ts` | M5 | Cache recurrence provider class declaration |
| `caches/gpu/CacheOperations.js` | `transport/cache/CacheOperations.js` | M5 | Generic scatter/transport/accumulate provider class |
| `caches/gpu/CachePassAssembler.d.ts` | `gpu-assembler/cache-pass/types/CachePassAssembler.d.ts` | M4 | Cache-pass assembler class declaration |
| `caches/gpu/CachePassAssembler.js` | `gpu-assembler/cache-pass/CachePassAssembler.js` | M4 | Provider-neutral cache-pass assembler class |
| `caches/gpu/cache-runtime-contracts.js` | `gpu-runtime/cache/consts.js` | M5 | Runtime cache-binding value constant |
| `caches/gpu/canonical-black-ground.d.ts` | `ground-boundaries/shared/cache/canonical-black-ground.d.ts` | M5 | Omitted-ground cache-module declaration |
| `caches/gpu/canonical-black-ground.js` | `ground-boundaries/shared/cache/canonical-black-ground.js` | M5 | Omitted-ground cache-module provider |
| `caches/gpu/consts.js` | `transport/cache/consts.js` | M5 | Generic cache-recurrence requirements and stencil constants |
| `caches/gpu/types.d.ts` | split -> `gpu-assembler/cache-pass/types.d.ts`<br>`gpu-runtime/cache/types.d.ts`<br>`transport/cache/types.d.ts` | M4 | Mixed cache assembly, runtime plan/execution, and construction-transport ambient contracts split atomically; source retired before M5 |
| `caches/index.js` | `light-sources/shared/cache/index.js` | M4 | Existing shared CPU cache barrel; moved to its actual common owner |
| `shader/_tests/algorithm32-shader-assembler.spec.js` | `gpu-assembler/runtime/_tests/algorithm32-shader-assembler.spec.js` | M4 | Final-view assembler specification |
| `shader/_tests/shader-compatibility-validator.spec.js` | `gpu-assembler/runtime/_tests/shader-compatibility-validator.spec.js` | M4 | Final-view compatibility specification |
| `shader/_tests/shader-contribution.spec.js` | `gpu-assembler/base/_tests/shader-contribution.spec.js` | M4 | Direct contribution contract specification |
| `shader/Algorithm32ShaderAssembler.js` | `gpu-assembler/runtime/Algorithm32ShaderAssembler.js` | M4 | Provider-neutral final-view assembler class |
| `shader/ShaderCompatibilityValidator.js` | `gpu-assembler/runtime/ShaderCompatibilityValidator.js` | M4 | Final-view compatibility-validator class |
| `shader/shader-contribution.js` | `gpu-assembler/base/shader-contribution.js` | M4 | Direct shader-provider declaration helpers |
| `shader/types.d.ts` | split -> `gpu-assembler/base/types.d.ts`<br>`gpu-assembler/runtime/types.d.ts` | M4 | Direct contribution and final-view assembly ambient contracts; source retired |
| `transport/_tests/algorithm32-transport.spec.js` | `transport/_tests/algorithm32-transport.spec.js` | M5 | Generic transport specification; retained owner path |
| `transport/_tests/scattering-density-transport.spec.js` | `transport/_tests/scattering-density-transport.spec.js` | M5 | CPU scattering transport specification; retained owner path |
| `transport/_tests/scattering-order-field-operations.spec.js` | `transport/_tests/scattering-order-field-operations.spec.js` | M5 | CPU recurrence-operation specification; retained owner path |
| `transport/Algorithm32Transport.js` | `transport/Algorithm32Transport.js` | M5 | Generic final-view transport class; retained owner path |
| `transport/consts.js` | `transport/consts.js` | M5 | Generic transport constants; retained owner path |
| `transport/later-order-scattering-density.d.ts` | `transport/later-order-scattering-density.d.ts` | M5 | Generic CPU recurrence module declaration; retained path |
| `transport/later-order-scattering-density.js` | `transport/later-order-scattering-density.js` | M5 | Generic CPU recurrence module; retained path |
| `transport/scattering-density-transport.js` | `transport/scattering-density-transport.js` | M5 | Generic CPU scattering transport; retained path |
| `transport/scattering-order-field-operations.js` | `transport/scattering-order-field-operations.js` | M5 | Generic CPU field recurrence operations; retained path |
| `transport/types.d.ts` | `transport/types.d.ts` | M5 | Generic transport ambient contracts; retained path |
| `three/_tests/ExactFlatGroundObject.spec.js` | `geometry/flat/three/_tests/ExactFlatGroundObject.spec.js` | M7 | Flat-geometry Three endpoint specification |
| `three/_tests/ExactSphereGroundObject.spec.js` | `geometry/spherical/three/_tests/ExactSphereGroundObject.spec.js` | M7 | Spherical-geometry Three endpoint specification |
| `three/_tests/stage10-spectral-composition.browser.js` | `runtime/rendering/three/_tests/stage10-spectral-composition.browser.js` | M9 | Final-view Three integration/browser specification |
| `three/_tests/ThreeCacheBackend.spec.js` | `gpu-runtime/cache/three/_tests/ThreeCacheBackend.spec.js` | M5 | Three cache-backend specification |
| `three/_tests/ThreeWebGL.browser.js` | `gpu-runtime/cache/three/_tests/three-webgl.browser.js` | M5 | Three/WebGL cache-runtime browser specification; ordinary filename normalized |
| `three/ExactFlatGroundObject.js` | `geometry/flat/three/ExactFlatGroundObject.js` | M7 | Flat-geometry Three raycast class |
| `three/ExactSphereGroundObject.js` | `geometry/spherical/three/ExactSphereGroundObject.js` | M7 | Spherical-geometry Three raycast class |
| `three/ThreeCacheBackend.d.ts` | `gpu-runtime/cache/three/types/ThreeCacheBackend.d.ts` | M5 | Three backend class declaration |
| `three/ThreeCacheBackend.js` | `gpu-runtime/cache/three/ThreeCacheBackend.js` | M5 | Concrete Three/WebGL cache backend class |
| `three/types.d.ts` | split -> `geometry/flat/three/types.d.ts`<br>`geometry/spherical/three/types.d.ts`<br>`gpu-runtime/cache/three/types.d.ts` | M5/M7 | Mixed Three adapter ambient contracts; source retired |

The runtime assembler and cache-pass assembler may depend on
`gpu-assembler/base`; neither imports a provider. `gpu-runtime/cache` depends
on the cache-pass assembler contract and an injected backend. The concrete
Three backend depends on GPU-runtime contracts and cache-pass binding names,
never on a source cache or physical provider. Generic transport remains
source- and geometry-neutral.

### Extraterrestrial synchronization and light-source owners

| Current path | Target path | Batch | Classification and owner |
| --- | --- | --- | --- |
| `light-sources/_tests/DistantSphericalOwnerShaderContributions.spec.js` | `gpu-assembler/runtime/_tests/DistantSphericalOwnerShaderContributions.spec.js` | M4 | Cross-provider final-view assembly specification |
| `light-sources/_tests/DistantSunCache.spec.js` | `light-sources/distant-sun/cache/_tests/DistantSunCache.spec.js` | M8 | Distant-Sun GPU cache specification |
| `light-sources/_tests/DistantSunCacheController.spec.js` | `light-sources/distant-sun/cache/_tests/DistantSunCacheController.spec.js` | M8 | Distant-Sun cache-controller specification |
| `light-sources/_tests/distant-sun-construction-domain-selection.spec.js` | `light-sources/distant-sun/cache/_tests/distant-sun-construction-domain-selection.spec.js` | M8 | Distant-Sun construction selection specification |
| `light-sources/_tests/DistantSunCpuCache.spec.js` | `light-sources/distant-sun/cache/_tests/DistantSunCpuCache.spec.js` | M8 | Distant-Sun CPU cache specification |
| `light-sources/_tests/DistantSunCpuFields.spec.js` | `light-sources/distant-sun/cache/_tests/distant-sun-cpu-fields.spec.js` | M8 | Distant-Sun ordinary CPU-field operation specification; filename normalized |
| `light-sources/_tests/DistantSunFieldPacking.spec.js` | `light-sources/distant-sun/cache/_tests/DistantSunFieldPacking.spec.js` | M8 | Distant-Sun packing specification |
| `light-sources/_tests/DistantSunGpuOwnerModules.spec.js` | `light-sources/distant-sun/cache/_tests/DistantSunGpuOwnerModules.spec.js` | M8 | Distant-Sun cache-module integration specification |
| `light-sources/_tests/distant-sun-later-order-scattering-density.spec.js` | `light-sources/distant-sun/cache/_tests/distant-sun-later-order-scattering-density.spec.js` | M8 | Distant-Sun CPU recurrence specification |
| `light-sources/_tests/distant-sun-light-source.spec.js` | `light-sources/distant-sun/_tests/distant-sun-light-source.spec.js` | M8 | Distant-Sun source specification |
| `light-sources/_tests/distant-sun-scattering-density-transport.spec.js` | `light-sources/distant-sun/cache/_tests/distant-sun-scattering-density-transport.spec.js` | M8 | Distant-Sun CPU transport specification |
| `light-sources/_tests/flat-synchronizer.spec.js` | `extraterrestrial/sun/_tests/flat-synchronizer.spec.js` | M8 | Solar/time synchronization specification |
| `light-sources/_tests/local-sun-cache.spec.js` | `light-sources/local-sun/cache/_tests/local-sun-cache.spec.js` | M8 | Local-Sun GPU cache specification |
| `light-sources/_tests/local-sun-cache-controller.spec.js` | `light-sources/local-sun/cache/_tests/local-sun-cache-controller.spec.js` | M8 | Local-Sun cache-controller specification |
| `light-sources/_tests/local-sun-cache-plan.spec.js` | `light-sources/local-sun/cache/_tests/local-sun-cache-plan.spec.js` | M8 | Local-Sun cache-plan specification |
| `light-sources/_tests/LocalSunConstructionLightSource.spec.js` | `light-sources/local-sun/cache/_tests/LocalSunConstructionLightSource.spec.js` | M8 | Local-Sun construction-source specification |
| `light-sources/_tests/local-sun-cpu-cache.spec.js` | `light-sources/local-sun/cache/_tests/local-sun-cpu-cache.spec.js` | M8 | Local-Sun CPU cache specification |
| `light-sources/_tests/LocalSunLightSource.spec.js` | `light-sources/local-sun/_tests/LocalSunLightSource.spec.js` | M8 | Local-Sun source specification |
| `light-sources/_tests/LocalSunShellFactCache.spec.js` | `light-sources/local-sun/cache/_tests/LocalSunShellFactCache.spec.js` | M8 | Local-Sun shell-fact cache specification |
| `light-sources/_tests/NativeN4CpuGpuParityOracle.spec.js` | `light-sources/distant-sun/cache/fixtures/_tests/NativeN4CpuGpuParityOracle.spec.js` | M8 | Distant-Sun native N4 oracle specification |
| `light-sources/_tests/spectral-test-values.js` | `light-sources/shared/_tests/spectral-test-values.js` | M8 | Test support shared by both source families |
| `light-sources/_tests/ThreeShadowObjectConfigurator.spec.js` | `light-sources/shared/three/_tests/three-lighting-support.spec.js` | M8 | Shared Three lighting-support specification; filename normalized with merged configurator coverage |
| `light-sources/consts.js` | `light-sources/distant-sun/cache/consts.js` | M8 | Distant-Sun construction/cache constants |
| `light-sources/create-local-sun-shell-fact-cache.js` | `light-sources/local-sun/cache/create-local-sun-shell-fact-cache.js` | M8 | Local-Sun shell-fact cache construction module |
| `light-sources/DistantSunCache.d.ts` | `light-sources/distant-sun/cache/types/DistantSunCache.d.ts` | M8 | Distant-Sun cache class declaration |
| `light-sources/DistantSunCache.js` | `light-sources/distant-sun/cache/DistantSunCache.js` | M8 | Distant-Sun GPU cache class |
| `light-sources/DistantSunCacheController.d.ts` | `light-sources/distant-sun/cache/types/DistantSunCacheController.d.ts` | M8 | Distant-Sun controller class declaration |
| `light-sources/DistantSunCacheController.js` | `light-sources/distant-sun/cache/DistantSunCacheController.js` | M8 | Distant-Sun cache-controller class |
| `light-sources/distant-sun-cache-plan.d.ts` | `light-sources/distant-sun/cache/distant-sun-cache-plan.d.ts` | M8 | Distant-Sun plan module declaration |
| `light-sources/distant-sun-cache-plan.js` | `light-sources/distant-sun/cache/distant-sun-cache-plan.js` | M8 | Distant-Sun GPU plan module |
| `light-sources/distant-sun-cache-reuse-key.js` | `light-sources/distant-sun/cache/distant-sun-cache-reuse-key.js` | M8 | Distant-Sun reuse identity module |
| `light-sources/DistantSunConstructionDomainSelection.js` | `light-sources/distant-sun/cache/DistantSunConstructionDomainSelection.js` | M8 | Distant-Sun construction selection class |
| `light-sources/DistantSunCpuCache.d.ts` | `light-sources/distant-sun/cache/types/DistantSunCpuCache.d.ts` | M8 | Distant-Sun CPU cache class declaration |
| `light-sources/DistantSunCpuCache.js` | `light-sources/distant-sun/cache/DistantSunCpuCache.js` | M8 | Distant-Sun CPU cache class |
| `light-sources/distant-sun-cpu-cache-build.d.ts` | `light-sources/distant-sun/cache/distant-sun-cpu-cache-build.d.ts` | M8 | Distant-Sun CPU build module declaration |
| `light-sources/distant-sun-cpu-cache-build.js` | `light-sources/distant-sun/cache/distant-sun-cpu-cache-build.js` | M8 | Distant-Sun CPU cache build module |
| `light-sources/DistantSunCpuFields.js` | `light-sources/distant-sun/cache/distant-sun-cpu-fields.js` | M8 | Cohesive ordinary distant-Sun CPU-field operations; filename normalized |
| `light-sources/DistantSunFieldPacking.js` | `light-sources/distant-sun/cache/DistantSunFieldPacking.js` | M8 | Distant-Sun field-packing class |
| `light-sources/distant-sun-later-order-scattering-density.d.ts` | `light-sources/distant-sun/cache/distant-sun-later-order-scattering-density.d.ts` | M8 | Distant-Sun recurrence module declaration |
| `light-sources/distant-sun-later-order-scattering-density.js` | `light-sources/distant-sun/cache/distant-sun-later-order-scattering-density.js` | M8 | Distant-Sun CPU recurrence module |
| `light-sources/DistantSunLightSource.js` | `light-sources/distant-sun/DistantSunLightSource.js` | M8 | Distant-Sun atmospheric light-source class |
| `light-sources/distant-sun-primary-radiance.js` | `light-sources/distant-sun/cache/distant-sun-primary-radiance.js` | M8 | Distant-Sun CPU primary-radiance module |
| `light-sources/distant-sun-primary-scattering-density.js` | `light-sources/distant-sun/cache/distant-sun-primary-scattering-density.js` | M8 | Distant-Sun CPU primary-scattering module |
| `light-sources/distant-sun-scattering-density-transport.js` | `light-sources/distant-sun/cache/distant-sun-scattering-density-transport.js` | M8 | Distant-Sun CPU transport module |
| `light-sources/fixtures/algorithm32-production-native-n4-cpu-gpu-parity-oracle.json` | `light-sources/distant-sun/cache/fixtures/algorithm32-production-native-n4-cpu-gpu-parity-oracle.json` | M8 | Distant-Sun native N4 checked oracle |
| `light-sources/FlatSynchronizer.js` | `extraterrestrial/sun/FlatSynchronizer.js` | M8 | Cache-independent solar/time synchronization class |
| `light-sources/light-source-request-values.js` | `light-sources/shared/light-source-request-values.js` | M8 | Request normalization shared by both source families |
| `light-sources/LocalSunCache.js` | `light-sources/local-sun/cache/LocalSunCache.js` | M8 | Local-Sun GPU cache class |
| `light-sources/LocalSunCacheController.js` | `light-sources/local-sun/cache/LocalSunCacheController.js` | M8 | Local-Sun cache-controller class |
| `light-sources/local-sun-cache-plan.js` | `light-sources/local-sun/cache/local-sun-cache-plan.js` | M8 | Local-Sun GPU plan module |
| `light-sources/local-sun-cache-reuse-key.js` | `light-sources/local-sun/cache/local-sun-cache-reuse-key.js` | M8 | Local-Sun reuse identity module |
| `light-sources/LocalSunCacheSource.js` | `light-sources/local-sun/cache/LocalSunCacheSource.js` | M8 | Local-Sun cache-construction source class |
| `light-sources/LocalSunConstructionDomainSelection.js` | `light-sources/local-sun/cache/LocalSunConstructionDomainSelection.js` | M8 | Local-Sun construction selection class |
| `light-sources/LocalSunConstructionLightSource.js` | `light-sources/local-sun/cache/LocalSunConstructionLightSource.js` | M8 | Local-Sun construction-light class |
| `light-sources/local-sun-consts.js` | split -> `light-sources/local-sun/consts.js`<br>`light-sources/local-sun/cache/consts.js` | M8 | Mixed source/runtime and cache-construction constants; source retired |
| `light-sources/LocalSunCpuCache.js` | `light-sources/local-sun/cache/LocalSunCpuCache.js` | M8 | Local-Sun CPU cache class |
| `light-sources/local-sun-cpu-cache-build.js` | `light-sources/local-sun/cache/local-sun-cpu-cache-build.js` | M8 | Local-Sun CPU cache build module |
| `light-sources/LocalSunCpuFields.js` | `light-sources/local-sun/cache/LocalSunCpuFields.js` | M8 | Local-Sun CPU fields class |
| `light-sources/LocalSunFieldPacking.js` | `light-sources/local-sun/cache/LocalSunFieldPacking.js` | M8 | Local-Sun field-packing class |
| `light-sources/local-sun-geometry-pairing.js` | `light-sources/local-sun/local-sun-geometry-pairing.js` | M8 | Pairing policy shared by the local source and its cache controller |
| `light-sources/local-sun-later-order-scattering-density.js` | `light-sources/local-sun/cache/local-sun-later-order-scattering-density.js` | M8 | Local-Sun CPU recurrence module |
| `light-sources/LocalSunLightSource.js` | `light-sources/local-sun/LocalSunLightSource.js` | M8 | Local-Sun atmospheric light-source class |
| `light-sources/local-sun-primary-radiance.js` | `light-sources/local-sun/cache/local-sun-primary-radiance.js` | M8 | Local-Sun CPU primary-radiance module |
| `light-sources/local-sun-primary-scattering-density.js` | `light-sources/local-sun/cache/local-sun-primary-scattering-density.js` | M8 | Local-Sun CPU primary-scattering module |
| `light-sources/local-sun-scattering-density-transport.js` | `light-sources/local-sun/cache/local-sun-scattering-density-transport.js` | M8 | Local-Sun CPU transport module |
| `light-sources/LocalSunShellFactCache.js` | `light-sources/local-sun/cache/LocalSunShellFactCache.js` | M8 | Local-Sun shell-fact cache class |
| `light-sources/three-lighting-support.js` | `light-sources/shared/three/three-lighting-support.js` | M8 | Three lighting operations shared by both source families |
| `light-sources/ThreeShadowObjectConfigurator.js` | merge -> `light-sources/shared/three/three-lighting-support.js` | M8 | Single shadow-configuration function merged into the cohesive shared Three lighting owner |
| `light-sources/types.d.ts` | split in place -> `light-sources/types.d.ts`<br>`light-sources/shared/types.d.ts`<br>`light-sources/shared/three/types.d.ts`<br>`light-sources/distant-sun/types.d.ts`<br>`light-sources/distant-sun/cache/types.d.ts`<br>`light-sources/local-sun/types.d.ts`<br>`light-sources/local-sun/cache/types.d.ts`<br>`extraterrestrial/sun/types.d.ts` | M3/M8 | Retain the M3 family interface at root; split existing shared/source/cache/synchronization contracts to their owners |

`light-sources/shared` may depend only on lower-level quantities, utilities,
and family contracts. Each concrete source owns and may depend on its nested
cache, but distant and local implementations do not import one another.
`extraterrestrial/sun` contains no atmospheric cache or renderer policy and
does not depend on a light-source implementation.

### Runtime, adapters, and retained fixtures

| Current path | Target path | Batch | Classification and owner |
| --- | --- | --- | --- |
| `models/_tests/SharedModel.spec.js` | `runtime/model/_tests/SharedModel.spec.js` | M9 | Shared configured-model specification |
| `models/_tests/SpectralModel.spec.js` | `runtime/model/_tests/SpectralModel.spec.js` | M9 | Spectral-model specification |
| `models/SharedModel.js` | `runtime/model/SharedModel.js` | M9 | Runtime configured-owner aggregation class |
| `models/SpectralModel.js` | `runtime/model/SpectralModel.js` | M9 | Runtime spectral-state class |
| `models/types.d.ts` | `runtime/model/types.d.ts` | M9 | Runtime model ambient contracts |
| `implementation/_tests/reference-orchestration.spec.js` | `runtime/reference/_tests/reference-orchestration.spec.js` | M9 | CPU reference orchestration specification |
| `implementation/_tests/scene-input-capture.spec.js` | `runtime/rendering/three/_tests/scene-input-capture.spec.js` | M9 | Three scene-capture specification |
| `implementation/_tests/shader-builder-assembly.spec.js` | `runtime/rendering/_tests/shader-builder-assembly.spec.js` | M9 | Rendering-build assembly specification |
| `implementation/_tests/shader-builder-runtime.spec.js` | `runtime/rendering/_tests/shader-builder-runtime.spec.js` | M9 | Rendering-build lifecycle specification |
| `implementation/_tests/ShaderBuilderTestSupport.js` | `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | M9 | ShaderBuilder namespace-style test support |
| `implementation/_tests/shader-pass-performance-timer.spec.js` | `runtime/rendering/three/_tests/shader-pass-performance-timer.spec.js` | M9 | Three/WebGL timer specification |
| `implementation/_tests/shader-runtime-pass.spec.js` | `runtime/rendering/three/_tests/shader-runtime-pass.spec.js` | M9 | Three runtime-pass specification |
| `implementation/_tests/SpectralCalculator.spec.js` | `transport/spectral/_tests/SpectralCalculator.spec.js` | M5 | Cross-source/reference spectral transport calculator specification |
| `implementation/consts.js` | split -> `runtime/rendering/consts.js`<br>`runtime/rendering/three/consts.js` | M9 | Mixed ShaderBuilder and Three-pass constants; source retired |
| `implementation/Reference.js` | `runtime/reference/Reference.js` | M9 | CPU reference evaluator class |
| `implementation/SceneInputCapture.js` | `runtime/rendering/three/SceneInputCapture.js` | M9 | Three scene-input capture class |
| `implementation/ShaderBuilder.js` | `runtime/rendering/ShaderBuilder.js` | M9 | Mixed rendering orchestration class pending Step 4.4 split |
| `implementation/ShaderPassPerformanceTimer.js` | `runtime/rendering/three/ShaderPassPerformanceTimer.js` | M9 | Three/WebGL performance-timer class |
| `implementation/ShaderRuntimePass.js` | `runtime/rendering/three/ShaderRuntimePass.js` | M9 | Three composer-compatible runtime-pass class |
| `implementation/SpectralCalculator.js` | `transport/spectral/SpectralCalculator.js` | M5 | Cross-source/reference spectral transport calculator class |
| `implementation/spectral-numeric-kernels.js` | merge -> `transport/spectral/SpectralCalculator.js` | M5 | SpectralCalculator-exclusive helpers merged during the owner move under the Step 4.5 rule |
| `implementation/types.d.ts` | split -> `transport/spectral/types.d.ts`<br>`runtime/reference/types.d.ts`<br>`runtime/rendering/types.d.ts`<br>`runtime/rendering/three/types.d.ts` | M5/M9 | Mixed spectral transport, reference, rendering, and Three ambient contracts; source retired after both batches |
| `react/_tests/Algorithm32ReactUtils.spec.js` | `adapters/react/_tests/algorithm32-react-utils.spec.js` | M10 | React/Three utility specification; ordinary filename normalized |
| `react/Algorithm32AtmosphereComposer.js` | `adapters/react/Algorithm32AtmosphereComposer.js` | M10 | React atmosphere-composer class |
| `react/Algorithm32R3FAtmosphereComposer.jsx` | `adapters/react/Algorithm32R3FAtmosphereComposer.jsx` | M10 | React Three Fiber component |
| `react/Algorithm32ReactUtils.js` | `adapters/react/algorithm32-react-utils.js` | M10 | React/Three ordinary utility module; filename normalized |
| `react/consts.js` | `adapters/react/consts.js` | M10 | React adapter constants |
| `react/index.js` | `adapters/react/index.js` | M10 | Existing React adapter barrel; moved and retargeted |
| `fixtures/_tests/GpuCacheParityPolicy.spec.js` | `light-sources/distant-sun/cache/fixtures/_tests/gpu-cache-parity-policy.spec.js` | M8 | Distant-Sun native-domain parity policy specification |
| `fixtures/analytic-invariants.json` | `references/fixtures/analytic-invariants.json` | M5 | Checked production analytic fixture ledger moved with both readers |
| `fixtures/gpu-cache-parity-policy.json` | `light-sources/distant-sun/cache/fixtures/gpu-cache-parity-policy.json` | M8 | Distant-Sun Native-48/W27/Fibonacci-34 GPU parity policy |

The model is shared only by facade, reference, and rendering siblings, so it
lives at their nearest common runtime owner. Both source-cache construction
and `runtime/reference` consume `transport/spectral`; neither source family
depends on the reference runtime. `runtime/reference` contains no Three or
React dependency. `runtime/rendering/three` depends on rendering contracts and
Three runtime values; `adapters/react` depends inward on the facade, rendering,
and concrete Three cache backend. No lower owner imports React.

## Mixed-File And Cumulative Target Contracts

The following export-level assignments and cumulative merge orders close every
multi-target or shared-target manifest row. They are mechanical ownership
splits and merges: names and runtime values remain unchanged unless a row
explicitly merges a class-exclusive helper.

| Current file | Exact distribution |
| --- | --- |
| `utils/numeric-values.js` and `utils/value-assertions.js` | M1 merges `finiteNumberOrDefault` with `isTypedArray`, `requiredString`, and `positiveInteger` at `utils/validation/value-assertions.js`; its direct cases join `value-assertions.spec.js`, and the single-function source retires. |
| `utils/canonical-value-identity.js` and `shader/stable-hash.js` | M1 creates `utils/identity/value-hashes.js` only when it can merge canonical serialization, `sha256Value`, `stableStringify`, `stableHash`, and both modules' private serialization support in the same transaction. Preserve both current encodings and hash algorithms exactly. The canonical cases move to `value-hashes.spec.js`; both still-unmoved assemblers update their imports in M1 and their specifications cover the stable-hash consumers. |
| `utils/types.d.ts` and `types/types.d.ts` | M1 moves the existing math/sample contracts to `utils/math/types.d.ts`; M3 adds the shared `UnitVector3` declaration to that same file without replacing the M1 declarations. |
| `constants/Algorithm32CanonicalData.js` and `constants/_tests/Algorithm32CanonicalData.spec.js` | `CANONICAL_ATMOSPHERE_CONSTANTS` -> `atmospheres/canonical/consts.js`; `CANONICAL_SPECTRAL_CHANNELS`, `RUNTIME_NUMERICAL_OPTIONS`, and private channel construction -> `profiles/native-15/consts.js`; `FIGURE1_DISPLAY_CONSTANTS` -> `color/bruneton/consts.js`. The corresponding specification cases merge into `atmospheres/canonical/_tests/CanonicalAtmosphere.spec.js`, `profiles/native-15/_tests/native-15-profile.spec.js`, and `color/bruneton/_tests/bruneton-color-display-model.spec.js`. |
| `atmospheres/types.d.ts` | M3 retains `AtmosphereModel` and the shared atmosphere contracts supplied by root `types/types.d.ts` at `atmospheres/types.d.ts`; M6 moves the file's existing `CanonicalAtmosphere*` declarations to `atmospheres/canonical/types.d.ts`. |
| `color/types.d.ts` | M3 retains `Color` and shared color conversion/composition/sample contracts at `color/types.d.ts`; M6 moves the existing `Figure1DisplayConstants` declaration to `color/bruneton/types.d.ts`. |
| `ground-boundaries/types.d.ts` | M3 retains `GroundBoundary` and `GroundBrdfRequest` at `ground-boundaries/types.d.ts`; M6 moves the existing `UniformLambertianGroundBoundaryOptions` declaration to `ground-boundaries/uniform-lambertian/types.d.ts`. |
| `types/ScatteringCache.d.ts` and `types/types.d.ts` | M3 merges the cache-provider interface and all generic cache reuse/options/field/packing/recurrence/sample/build contracts into `light-sources/shared/cache/types.d.ts` in one duplicate-free owner file. |
| `domains/consts.js` and `domains/domain-consts.js` | `domains/consts.js` splits its eight canonical owner constants and five derived compatibility values among the three leaf `consts.js` files. `CubedSphereDirectionDomain` privately owns supported widths, the exact face convention, face-count derivation, and both tolerances; its leaf constants construct W3/W9/W27 with inline stable IDs. `Fibonacci34DirectionDomain` and `PairedFibonacci34DirectionDomain` each privately own their fixed ID, count, weight, and pinned vectors, including the retained authority comment; their leaf constants export only the two canonical owners. `SphericalNativePositionDomain` privately owns supported counts, radii, and boundary-generation facts; its leaf constants construct N4/N16/N48 with inline stable IDs. The W27 and Native-48 factories use their canonical owner's readonly `id` as the omitted default. No raw fact export or family-root constants module survives. |
| `domains/types.d.ts` | Generic `PositionDomain*`, `PositionDomain`, `SolidAngleWeights`, and `DirectionDomain` contracts -> `domains/types.d.ts`; `SphericalNative*` -> the spherical-native leaf; `CubedSphere*` -> the cubed-sphere leaf; `Fibonacci34DirectionDomain` and `PairedFibonacci34DirectionDomain` -> the Fibonacci leaf. |
| `quantities/types.d.ts` | `UnitValue`, all unit-name aliases, dimensional scalar aliases, `PixelSize`, unit series/positions, and `UnitFamilyContract` -> `quantities/units/types.d.ts`; every `Spectral*` declaration -> `quantities/spectral/types.d.ts`. |
| `quantities/UnitValue.js` | `UNIT_FAMILIES` -> `quantities/units/consts.js`; unit construction, acceptance, copying, conversion, normalization, and their private conversion table -> `quantities/units/unit-values.js`. The quantities family barrel re-exports both owner paths directly. |
| `caches/gpu/cache-build-contracts.js` | `CANONICAL_BLACK_GROUND_MODULE_ID` -> `ground-boundaries/shared/cache/consts.js`; `CACHE_WAVELENGTH_LAYER_BINDING_NAME` -> `gpu-assembler/cache-pass/consts.js`; `cacheFieldInputBindingName`, `createCacheBuildModule`, and private binding identity -> `gpu-assembler/cache-pass/cache-build-contracts.js`; `createCacheData` and `createCachePlanIdentity` -> the cohesive runtime value owner `gpu-runtime/cache/cache-values.js`. |
| `caches/gpu/types.d.ts` | M4 atomically moves 15 names to `gpu-assembler/cache-pass/types.d.ts`: `CacheBuildOwner`, `CacheShaderPhase`, `CacheShaderBlock`, `CacheBindingKind`, `CacheBindingFrequency`, `CacheBindingValue`, `CacheBindingSpec`, `CacheUniformBinding`, `CacheDataBinding`, `CacheDefineBinding`, `CacheBinding`, `CacheBuildModuleDefinition`, `CacheBuildModule`, `CacheBuildContributor`, `CacheBuildContext`. Four names move to `transport/cache/types.d.ts`: `CacheTransportData`, `CacheConstructionDomains`, `CacheTransportDataRequest`, `CacheTransportDataProvider`. Thirty names move to `gpu-runtime/cache/types.d.ts`: `CachePassKind`, `CacheOrder`, `CacheData`, `CacheDataDefinition`, `CacheFieldId`, `CacheFieldStorage`, `CacheFieldSpec`, `CacheGroundReflection`, `CachePass`, `CacheBuildPlan`, `CacheShader`, `CacheAssembler`, `GpuCacheField`, `CacheGpuProgram`, `CacheLayerSubmission`, `CacheRuntimeBinding`, `CacheRuntimeBindings`, `CacheRuntimeBindingInstallRequest`, `CacheGpuCapabilities`, `CacheProbeRequest`, `CacheProbe`, `CacheProbeResult`, `CacheProbeReader`, `CacheGpuBackend`, `CacheBuildScheduler`, `CacheExecutionOptions`, `CachePassDiagnostic`, `CacheBuildMemoryDiagnostics`, `CacheBuildDiagnostics`, `CacheBuildArtifact`. The three sets are pairwise disjoint, retain ambient-global form, and total the source's 49 declarations. |
| `shader/types.d.ts` | Ten direct declaration names move to `gpu-assembler/base/types.d.ts`: `ShaderOwnerId`, `ShaderUpdateFrequency`, `ShaderBindingKind`, `ShaderSourceSlot`, `ShaderBindingRequirement`, `ShaderUniformDeclaration`, `ShaderTextureDeclaration`, `ShaderSourceBlock`, `ShaderContribution`, `ShaderContributionRequest`. Six runtime names move to `gpu-assembler/runtime/types.d.ts`: `ShaderSymbolValidationReport`, `ShaderAssemblyRequest`, `ShaderAssemblyResult`, `ShaderAssembler`, `ShaderAssemblerConfiguration`, `ShaderCompatibilityValidator`. The two disjoint ambient sets total all 16 source declarations. |
| `geometries/consts.js` and `geometries/types.d.ts` | Every `FLAT_*`, `Flat*`, and flat configuration/contract -> `geometry/flat`; every spherical/cache-frame constant plus `Spherical*` and `ScatteringCacheDirectionFrame` contract -> `geometry/spherical`. No shared constant remains. |
| `geometries/types.d.ts` and `types/types.d.ts` | M3 establishes `geometry/spherical/types.d.ts` with `SphericalGroundVisualMeshRequest`; M7 merges the current spherical geometry declarations into it while flat declarations move to `geometry/flat/types.d.ts`. |
| `three/types.d.ts` | `ExactFlatGroundObjectConfig` -> `geometry/flat/three/types.d.ts`; `ExactSphereGroundObjectConfig` -> `geometry/spherical/three/types.d.ts`; `ThreeCacheBackendRequest` -> `gpu-runtime/cache/three/types.d.ts`. |
| `light-sources/local-sun-consts.js` | `LOCAL_SUN_DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE`, `LOCAL_SUN_TRANSPORT_INTERVAL_COUNT`, `LOCAL_SUN_SOURCE_TRANSMITTANCE_INTERVAL_COUNT`, and `LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID` -> `light-sources/local-sun/consts.js`; every remaining shell, construction-domain, packing, cache-plan, field, pass-symbol, provenance, and reuse constant -> `light-sources/local-sun/cache/consts.js`. |
| `light-sources/types.d.ts` | M3 retains `LightSourceModel` at `light-sources/types.d.ts`; M8 moves `ThreeShadowNode` -> `light-sources/shared/three/types.d.ts`; `FlatSynchronizedPosition` -> `extraterrestrial/sun/types.d.ts`; distant source configuration and Three-lighting records -> `light-sources/distant-sun/types.d.ts`; every other `DistantSun*` construction/cache/field/packing/recurrence contract -> `light-sources/distant-sun/cache/types.d.ts`; local source configuration, endpoint-lighting, and Three-lighting records -> `light-sources/local-sun/types.d.ts`; every other `LocalSun*` shell/construction/cache/field/packing/recurrence contract -> `light-sources/local-sun/cache/types.d.ts`; genuinely source-family request values -> `light-sources/shared/types.d.ts`. |
| `light-sources/ThreeShadowObjectConfigurator.js` and `light-sources/three-lighting-support.js` | The one `configureThreeShadowObject` operation joins the existing layer, property, and scene-lighting operations at `light-sources/shared/three/three-lighting-support.js`; their combined specification moves to `three-lighting-support.spec.js`. No single-function module or compatibility re-export remains. |
| `types/types.d.ts`, `constants/types.d.ts`, and `profiles/types.d.ts` | M3 establishes `profiles/native-15/types.d.ts` with `Algorithm32NumericalOptions`; M6 merges the native spectral-channel and complete Native-15 profile declarations into the same file without duplicating that option contract. |
| `implementation/consts.js` | `EMPTY_SHADER_BUILD_CONTEXT` -> `runtime/rendering/consts.js`; `GLSL_DIRECTIVE_PREFIX` -> `runtime/rendering/three/consts.js`. |
| `implementation/spectral-numeric-kernels.js` | Every operation is consumed only by `SpectralCalculator`; M5 moves each operation onto `transport/spectral/SpectralCalculator.js` as private class support under the Step 4.5 rule and retires the ordinary helper module. |
| `implementation/types.d.ts` | `SpectralCalculator*`, `PathIntegrationPoint`, `PathRadiance`, and `ComputeRadianceOptions` -> `transport/spectral/types.d.ts`; `Reference*` -> `runtime/reference/types.d.ts`; `ShaderBuilder*`, `ShaderBuild*`, `ShaderCacheControllerIdentity`, and `ShaderBuildContext` -> `runtime/rendering/types.d.ts`; `SceneInputCapture*`, `ShaderRuntimeArtifact`, and `ShaderRuntimePassConfiguration` -> `runtime/rendering/three/types.d.ts`. |
| `types/types.d.ts` | `UnitVector3` -> `utils/math/types.d.ts`; direct-lighting and source-path contracts -> `light-sources/shared/types.d.ts`; light-source Three/scene request and result contracts -> `light-sources/shared/three/types.d.ts`; cache reuse/options/field/packing/recurrence/sample/build contracts -> `light-sources/shared/cache/types.d.ts`; geometry intersections, stencils, coordinates, paths, rays, projection, endpoint, and scene-depth contracts -> `geometry/shared/types.d.ts`, except `SphericalGroundVisualMeshRequest` -> `geometry/spherical/types.d.ts`; atmosphere phase/sample/optical-depth contracts -> `atmospheres/types.d.ts`; `GroundBrdfRequest` -> `ground-boundaries/types.d.ts`; color conversion/composition/sample contracts -> `color/types.d.ts`; `Algorithm32NumericalOptions` -> `profiles/native-15/types.d.ts`; facade configuration/setup/performance/handle/evaluation contracts -> `runtime/facade/types.d.ts`; `Algorithm32PreparedConfig` -> `runtime/facade/types/Algorithm32.d.ts`; `Algorithm32ShaderHandleState` -> `runtime/facade/types/Algorithm32ShaderHandle.d.ts`. |

### M4-M5 atomic cache-contract handoff

M4 creates all four final JavaScript targets from
`caches/gpu/cache-build-contracts.js` and all three ambient targets from
`caches/gpu/types.d.ts`, then removes both mixed sources in the same batch.
The black-ground provider remains at its current path through M4 but imports
its ID from `ground-boundaries/shared/cache/consts.js`; M5 moves that provider
without reopening a compatibility source. M5 begins by proving both old files
absent and every split target present.

The moved M4 cross-provider assembly specification uses paths to the providers'
still-current locations. M6-M9 retarget those imports only when each provider
moves; M4 does not jump a consumer to a nonexistent future path. The ambient
relationship between `CacheBuildContext`, transport/runtime contracts, and
`CachePass`/`CacheBuildModule` stays global and creates no executable import
cycle or type-import bridge.

M5 applies these two non-mechanical relative-path corrections with the owner
moves:

- `transport/spectral/_tests/SpectralCalculator.spec.js` reads
  `../../../references/fixtures/analytic-invariants.json`, while
  `references/fixtures/_tests/fixtures.spec.js` resolves
  `../analytic-invariants.json` owner-locally. The retained JSON `sourcePath`
  remains provenance and is not rewritten.
- `gpu-runtime/cache/three/_tests/three-webgl.browser.js` imports Three from
  `../../../../../../node_modules/three/build/three.module.js`; its former
  four-level path is invalid at the deeper owner. Recursive Karma discovery
  remains unchanged.

M5 merges the eight `spectral-numeric-kernels.js` operations into private
instance support on `SpectralCalculator`. Existing module-local support in
`CacheGpuExecutor` and `ThreeCacheBackend` moves unchanged with its class and
remains explicit Step 4.5 reconciliation work; the Three backend's current
size and private WeakMap state make mechanical inlining inappropriate during
this path-only batch.

### M6 cumulative physical-owner handoff

M6 preserves 26 exported constants across four final leaf owners:

- `atmospheres/canonical/consts.js` has the three existing cache symbols/maps
  plus `CANONICAL_ATMOSPHERE_CONSTANTS`, for four exports;
- `profiles/native-15/consts.js` has its eight current profile constants plus
  `CANONICAL_SPECTRAL_CHANNELS` and `RUNTIME_NUMERICAL_OPTIONS`, for ten
  exports. Its private helper must precede the canonical channel array, which
  must precede `NATIVE_15_SPECTRAL_CHANNEL_COUNT`; another order creates a TDZ
  failure;
- `color/bruneton/consts.js` has the existing CIE source rows plus
  `FIGURE1_DISPLAY_CONSTANTS`, for two exports; and
- `ground-boundaries/uniform-lambertian/consts.js` retains its ten exports.

The four canonical-data specification cases merge exactly once into the
profile, atmosphere, and color owner suites, yielding 36 M6 focused specs.
Preserve literal precision, array/object construction order, and
`1 / (5 * 683)`. The mixed constant source and its specification retire with
no wrapper.

M6 appends into, rather than rebuilds, M3's family declaration owners. Final
counts are ten declarations in `profiles/native-15/types.d.ts`; five family
and two canonical atmosphere declarations; four family and one Bruneton color
declaration; and two family and one uniform-Lambertian declaration. It updates
exactly nine Algorithm32 specifiers in three Flat32 modules. The Stage 10
browser spec's profile and color imports move in M6, so the full Three/WebGL
lane is required in addition to the 36 focused specs and full Node regression.

### M7 geometry closure contract

M7 converts 14 remaining `geometries`/endpoint inputs into the exact 19-file
geometry tree named by the manifest. The flat constants file exports nine
facts; the spherical constants file exports eight facts (roundoff ULPs, basis
tolerance, Fibonacci switch, three axes, cache-symbol map, and ground-reflection
symbol). No shared constant file or geometry barrel is created.

The 24 old geometry aliases split into 18 flat and six spherical declarations.
The six spherical declarations append after M3's
`SphericalGroundVisualMeshRequest`; M5's residual two endpoint declarations
split one per endpoint leaf. Together with the M3 root/shared declarations,
the six geometry declaration owners contain exactly 42 names with no
duplicates. Global name/kind totals remain 443 Algorithm32 and 464 combined.

Five still-pre-M8 light-source specs receive only their staged M7-relative
geometry paths; M8 retargets them again when it moves. M4/M5 integration specs
already live at their final owners. The Karma configuration must contain the
four new geometry/endpoint keys and the unchanged pre-M10 React composer key,
with exact preprocessors and existing target files. Passing the 5-spec browser
lane is not a substitute for that key scan because those browser specs do not
load the concrete geometry owners.

### M8 light-source transaction contract

M8 covers 70 manifest inputs, 78 target references, and 77 unique targets.
The only duplicate target is the deliberate merge of
`ThreeShadowObjectConfigurator.js` into `three-lighting-support.js`. After the
batch, the owner surface is exactly 79 files under `light-sources` and three
under `extraterrestrial/sun`, including M4's five shared-cache files. Sixty-nine
old paths retire; root `light-sources` retains only `types.d.ts` plus owner
directories. No `extraterrestrial/shared` or `extraterrestrial/stars` scope is
created.

Across the 61 moved JavaScript inputs, preserve 109 export bindings: 102 named
declarations, six default declarations, and the one existing default alias in
`distant-sun-cache-reuse-key.js`. The shared Three owner exports exactly
`layerIndexOrNull`, `applyLayerIndex`, `assertOnlyProperties`,
`addLightingObjectsToScene`, and `configureThreeShadowObject`; remove the
merged module's self-import. Distant cache constants retain all 22 exports.
Local constants split in source order: the four runtime/source constants named
in the mixed-file table go to `local-sun/consts.js`, and the remaining 25 go
to `local-sun/cache/consts.js`. Four consumers with mixed imports split their
clauses atomically.

M8 retains only `LightSourceModel` in root `light-sources/types.d.ts`. It
preserves M3's two shared types and 27 shared-cache declarations; appends
`ThreeShadowNode` after the eight shared-Three declarations; and distributes
four distant-source, 62 distant-cache, seven local-source, 45 local-cache, and
one extraterrestrial-sun declaration. The relevant owner union is exactly 158
declarations (145 types and 13 interfaces), with source order retained and no
duplicate. The seven dedicated function/class declaration exports remain in
their six mapped modules. The sibling import in
`DistantSunCacheController.d.ts` remains `./DistantSunCache.js`; no M8 inline
type import is introduced.

The native N4 oracle specification resolves both colocated JSON records with
`../<filename>`, and the parity-policy specification uses its owner-local JSON
path plus `../../../../../domains/index.js`. JSON bytes, hashes, source
provenance, and policy contents do not change.

Exactly ten source edges across eight external importers retarget in M8: four
edges in the final M4/M5 assembly/cache-operation specs, two field-packing
edges in retained transport specs, and one edge in each of four Flat32 modules.
The final M8-owned JavaScript has 262 static import clauses (257 relative and
five package); including the one declaration import gives 263 total and 258
relative clauses. The four constant-split consumer clauses and four removed
helper clauses balance, while the new cache constants owner adds the required
`../consts.js` dependency on its parent-owned transport interval count. The
earlier preflight count omitted that owner edge; duplicating its literal or
moving the fact would violate the selected ownership split. Every relative
clause must resolve, external edge count must be exact, and the
Algorithm32/Flat32 runtime graph must retain zero strongly connected
components. The focused gate is the 156-spec filter in the matrix, followed by
full Node and Three/WebGL lanes.

### M9 runtime transaction contract

M9 covers 24 manifest rows and 28 unique target references. It creates or
moves 27 targets alongside M3's three facade declaration files, yielding an
exact 30-file runtime tree: five model, three reference, six rendering-root,
nine rendering/three, and seven facade files. All 24 old input paths and their
vacated root directories retire. No runtime barrel or compatibility module is
created.

Preserve exactly 12 named JavaScript exports and no default/re-export surface:
the nine classes, `ShaderBuilderTestSupport`, `EMPTY_SHADER_BUILD_CONTEXT`, and
`GLSL_DIRECTIVE_PREFIX`. The two implementation constants split one per final
rendering constant owner. `ShaderBuilder` and its test-support namespace move
intact; Step 4.4, not M9, owns its responsibility split.

The final runtime declaration union is 28 names: four model, one reference,
six rendering, five rendering/three, ten facade-root, and the two facade
class-internal declarations. M5's five spectral declarations remain unchanged.
M9 applies the final column of Staged Ambient Implementation Links, leaving
exactly four relative facade `import(...)` expressions for Step 5.2. Global
ambient totals remain 443 Algorithm32 and 464 combined with zero duplicate.

The 22 moved JavaScript inputs retain 52 static import clauses: 51 relative
(50 repository paths plus the explicit Three build) and one `node:fs` import.
Thirty-two owned clauses change, 20 remain byte-stable, and exactly four
external static consumers plus the four facade type links retarget. Every
relative path must resolve and the production runtime graph must remain
acyclic with direction `facade -> model/reference/rendering -> lower owners`.

The moved Stage-10 browser spec imports Three from
`../../../../../../node_modules/three/build/three.module.js` and uses the final
color, rendering, model, profile, quantity, and shader-base paths. Recursive
Karma discovery finds it; M9 adds no preprocessor key and preserves the four
post-M7 geometry keys plus the unchanged pre-M10 React key. Browser inventory
remains two files/five specs. The exact focused gate is 64 specs across ten
suites, followed by full Node and Three/WebGL lanes.

### M10 React-adapter transaction contract

M10 moves six inputs one-to-one into an exact six-file `adapters/react` tree:
five production files and one specification. It preserves 16 export bindings:
two default declarations, seven named utility functions, one named constant,
and the existing six named barrel re-exports. It adds no declaration file or
type bridge; ambient totals remain 443 Algorithm32 and 464 combined names with
zero duplicates.

The six inputs retain 20 import clauses and three export-from clauses. Exactly
11 of their 23 specifiers retarget, all 15 relative specifiers resolve, and the
eight package specifiers retain their meaning. The only external source edit is
`src/flat32/Algorithm32Runtime.js`, whose React utility import moves to
`adapters/react/algorithm32-react-utils.js`. The exact reverse closure is nine
edges: eight within the moved owner surface and that one Flat32 edge. The
executable graph remains acyclic and no lower owner imports the adapter.

M10 replaces only the React-composer preprocessor key with
`src/algorithm32/adapters/react/Algorithm32AtmosphereComposer.js`, preserving
its `['algorithm32ReactComposerImport']` value and all replacement rules. The
four M7 geometry/endpoint keys remain unchanged. M10 moves no browser file;
recursive discovery still finds two files/five specs, and the exact Karma-key
scan is required independently of the browser result. The focused filter is
exactly nine specs in one suite, followed by both type checks and the full Node
and Three/WebGL lanes. The preserved portal replacement anchor contains spaced
`{ createPortal }` while the formatted source uses `{createPortal}`; neither
retained browser file imports the composer. M10 records that pre-existing
spacing sensitivity but does not change the replacement rules in a path-only
ownership move or infer composer coverage from the five passing browser specs.

The class declarations for `CacheGpuExecutor`, `CachePassAssembler`,
`CacheOperations`, `ThreeCacheBackend`, `DistantSunCache`,
`DistantSunCacheController`, and `DistantSunCpuCache` move to their mapped
nearest `types/<ClassName>.d.ts` paths. Ordinary function-module declarations
remain paired with their mapped function modules. No declaration alias,
ambient duplicate, or import-based type bridge survives.

### M11 root-and-document closure contract

M11 moves no source and leaves exactly 268 live Algorithm32 files. It deletes
only `scripts["study:algorithm32-flat-local-cache-domain"]` from `package.json`,
preserves the policy-integrity command, and does not modify `package-lock.json`.
It removes vacated physical empty directories rather than tracked source paths.
The frozen 13-file study root remains byte-stable and is never run.

M11 updates exactly 14 current documents:

- `src/algorithm32/README.md`;
- `agents/topics/algorithm32/cache/{cache-design.md,README.md,cache-contract.md}`;
- `agents/topics/algorithm32/production/{production-implementation-plan.md,current-dataflow.md}`;
- `agents/topics/algorithm32/flat-local/extension-contract.md`;
- `agents/topics/extraterrestrial/{README.md,interface-contract.md,celestial-contribution-cache-design.md,reconciliation.md}`; and
- `agents/topics/algorithm32/{source-organization-plan.md,reconciliation-plan.md}` plus `agents/topics/active-topic.md`.

Current layout claims link to this plan instead of maintaining duplicate trees.
Dead Star links and present-tense authority claims become explicitly historical
or retire; hashes, candidate paths, and provenance records do not retarget. No
`ExtraterrestrialSource` declaration or absent owner tree is invented.
`evidence.md`, `references.md`, `jsconfig.json`, `references/README.md`, the
Flat32 type configuration, Jasmine configuration, Prettier configuration,
package lock, and post-M7/M10 Karma file are reverified without an M11 edit.

Final equality has two independent inputs: the manifest's 245 current columns
must equal checkpoint `6ea7cf8`, while the live tree must equal its 268 unique
targets. The latter contains exactly 133 ordinary JavaScript files, 67
specifications, two browser files, one JSX file, 57 declarations, four JSON
records, and four Markdown files. Ambient totals remain 443 Algorithm32 and 464
combined declarations with zero duplicate names. Until Step 5.2, exactly six
files retain package-backed type expressions and the two facade class-type files
retain exactly four relative implementation expressions; Step 4.3 must not
incorrectly demand zero.

The focused filter selects exactly four specs across two suites. Final closure
then runs both type checks, the 260-file formatter scope, the complete 429-spec
Node and 5-spec Three/WebGL lanes, retained policy integrity, Flat32 UI, JSON
and package assertions, exact owner/path/export/declaration/import/cycle/current-
document scans, both frozen-surface scans, untracked-file whitespace/newline
coverage, and `git diff --check`. A no-match residual scan treats `rg` exit 1 as
success and any status above 1 as an error.

### M3 exact declaration distribution

M3 preserves the name and declaration kind of all 79 declarations leaving the
seven retiring root type sources. Existing destination declarations remain in
place and receive the named additions below; a later cumulative batch may
split only the declarations assigned to it by this plan.

| M3 target | Exact additions or new contents |
| --- | --- |
| `utils/math/types.d.ts` | Append `UnitVector3` to the 11 M1 declarations. |
| `light-sources/shared/types.d.ts` | `DirectLightingSample`, `SourcePathLimit`. |
| `light-sources/shared/three/types.d.ts` | `LightSourceSceneLightScalesRequest`, `LightSourceSceneLightScales`, `LightSourceThreeLightingRequest`, `LightSourceThreeLightingObjects`, `LightSourceSceneAmbientIntensityRange`, `LightSourceThreeShadowRequest`, `LightSourceThreeShadowObjectRequest`, `LightSourceThreeEndpointIndirectFillRequest`. |
| `light-sources/shared/cache/types.d.ts` | First the 22 foundational contracts `CacheReuseIdentity`, `SupportedCacheScatteringOrder`, `CacheConstructionOptions`, `SpectralFieldOrder`, `SpectralFieldOrderDefinition`, `DirectionalSpectralFieldCoordinates`, `DirectionalSpectralFieldPacking`, `CpuDirectionalSpectralFieldDefinition`, `CpuDirectionalSpectralFieldReader`, `CpuDirectionalSpectralFieldWriter`, `CpuDirectionalSpectralFieldContract`, `ScatteringOrderKernel`, `NextScatteringOrderBuildRequest`, `PureScatteringFieldAccumulationRequest`, `ScatteringCachePositionStencilRequest`, `ScatteringCachePositionStencil`, `ScatteringCacheDirectionRequest`, `ScatteringCacheFramedDirectionRequest`, `ScatteringCacheDirectionStencil`, `ScatteringCacheSampleRequest`, `ScatteringCacheBuildRequest`, and `CacheBuildCoordinate`; then provider/controller contracts `ScatteringCache`, `CpuScatteringCache`, `GpuScatteringCache`, `CacheControllerRequest`, and `CacheController`. |
| `geometry/types.d.ts` | `GeometryModel`. |
| `geometry/shared/types.d.ts` | `GroundIntersection`, `AtmosphereCoordinate`, `AtmospherePathSample`, `AtmospherePathRequest`, `AtmospherePath`, `SourceRelativePosition`, `Ray`, `RaySegment`, `GeometryViewRayRequest`, `GeometryGroundProjectionRequest`, `GeometryThreeEndpointObjectsRequest`, `GeometryEndpointShadowRequest`, `GeometryThreeEndpointObjects`, `GeometrySceneDepthMaxRequest`. |
| `geometry/spherical/types.d.ts` | `SphericalGroundVisualMeshRequest`; M7 later appends the spherical declarations from `geometries/types.d.ts`. |
| `atmospheres/types.d.ts` | Append `AtmosphereModel`, `ScatteringPhaseRequest`, `AtmosphereSample`, `OpticalDepthSample`, and `PhaseSample`; retain the two current canonical declarations until M6. |
| `ground-boundaries/types.d.ts` | Append `GroundBoundary` and `GroundBrdfRequest`; retain `UniformLambertianGroundBoundaryOptions` until M6. |
| `color/types.d.ts` | Append `Color`, `ColorConversionRequest`, `SceneDisplayCompositionRequest`, and `ColorSample`; retain `Figure1DisplayConstants` until M6. |
| `light-sources/types.d.ts` | Append `LightSourceModel`; retain all 120 existing declarations until M8. |
| `profiles/native-15/types.d.ts` | `Algorithm32NumericalOptions`; M6 later appends `SpectralChannelConstant` and the eight declarations from `profiles/types.d.ts` without duplicating this option type. |
| `runtime/facade/types.d.ts` | `ExecutionConfig`, `ShaderPathSampleDistribution`, `Config`, `ConfigSnapshot`, `ShaderRuntimeConfig`, `ShaderSetupRequest`, `ShaderPerformanceSample`, `ShaderHandle`, `EvaluationRequest`, `EvaluationResult`. |
| `runtime/facade/types/Algorithm32.d.ts` | `Algorithm32PreparedConfig`. |
| `runtime/facade/types/Algorithm32ShaderHandle.d.ts` | `Algorithm32ShaderHandleState`. |

Only after all targets are populated does M3 retire
`types/{AtmosphereModel,Color,GeometryModel,GroundBoundary,LightSourceModel,ScatteringCache,types}.d.ts`
and its empty directory. `constants/types.d.ts`, `profiles/types.d.ts`,
`geometries/types.d.ts`, and all pre-existing concrete light-source
declarations remain for their later owner batches.

### Staged ambient implementation links

M3 moves the two facade class-internal declaration files before M9 moves the
runtime implementations they reference. Their four existing `import(...)`
type expressions therefore require explicit staged paths rather than being
left to accidental relative resolution:

| Declaration target | M3 path while implementations retain their current owners | M9 path after runtime ownership moves |
| --- | --- | --- |
| `runtime/facade/types/Algorithm32.d.ts` | `../../../models/SharedModel.js` | `../../model/SharedModel.js` |
| `runtime/facade/types/Algorithm32.d.ts` | `../../../implementation/Reference.js` | `../../reference/Reference.js` |
| `runtime/facade/types/Algorithm32.d.ts` | `../../../implementation/ShaderBuilder.js` | `../../rendering/ShaderBuilder.js` |
| `runtime/facade/types/Algorithm32ShaderHandle.d.ts` | `../../../Algorithm32.js` | `../Algorithm32.js` |

M3 applies the middle column, and M9 applies the final column in the same
transaction as the corresponding implementation moves. Step 5.2 later
eliminates the prohibited import expressions; Step 4.3 preserves their current
type meaning only. Neither recursive ambient include configuration changes.

## Live External Consumers And Configuration

Direct moves cannot preserve the current import paths. Step 4.3.2 therefore
has a narrow companion-edit boundary outside `src/algorithm32`: the five live
`src/flat32` importers, the Algorithm32 Three Karma configuration, the one root
package command made invalid by frozen evidence, and current documentation.
These edits update paths, correct the one checkpoint-stale Native-48 named
import recorded below, or retire a now-invalid command only; they do not
authorize Flat32 behavior changes or changes to experiment evidence.

### Flat32 import-only edits

| Live importer | Batch | Direct specifier changes |
| --- | --- | --- |
| `src/flat32/Algorithm32Runtime.js` | M1, M5, M10 | `utils/MathUtils.js` -> `utils/math/index.js`; `three/ThreeCacheBackend.js` -> `gpu-runtime/cache/three/ThreeCacheBackend.js`; `react/Algorithm32ReactUtils.js` -> `adapters/react/algorithm32-react-utils.js`. |
| `src/flat32/FlatLocalMode.js` | M1, M2, M6-M9 | `Algorithm32.js` -> `runtime/facade/Algorithm32.js`; `atmospheres/CanonicalAtmosphere.js` -> `atmospheres/canonical/CanonicalAtmosphere.js`; `color/BrunetonColorDisplayModel.js` -> `color/bruneton/BrunetonColorDisplayModel.js`; `constants/Algorithm32CanonicalData.js` -> `atmospheres/canonical/consts.js`; `geometries/FlatEarthGeometry.js` -> `geometry/flat/FlatEarthGeometry.js`; `light-sources/LocalSunLightSource.js` -> `light-sources/local-sun/LocalSunLightSource.js`; `profiles/native-15-profile.js` -> `profiles/native-15/native-15-profile.js`; `utils/DistanceMath.js` -> `utils/math/DistanceMath.js`; `domains/index.js` remains unchanged. |
| `src/flat32/LocalSunSceneLighting.js` | M8 | `light-sources/DistantSunLightSource.js` -> `light-sources/distant-sun/DistantSunLightSource.js`. |
| `src/flat32/LocationTimeController.js` | M1, M6, M8 | `light-sources/FlatSynchronizer.js` -> `extraterrestrial/sun/FlatSynchronizer.js`; `utils/AngleMath.js` -> `utils/math/AngleMath.js`; its canonical atmosphere constant import -> `atmospheres/canonical/consts.js`. |
| `src/flat32/SphericalDistantMode.js` | M1-M2, M6-M9 | M1 corrects the checkpoint's stale `NATIVE_48_POSITION_DOMAIN` named import to the already-exported direct `NATIVE_48_POSITION_DOMAIN_OWNER`; `domains/index.js` remains path-stable. Later batches move `Algorithm32.js` -> `runtime/facade/Algorithm32.js`; `atmospheres/CanonicalAtmosphere.js` -> `atmospheres/canonical/CanonicalAtmosphere.js`; `color/BrunetonColorDisplayModel.js` -> `color/bruneton/BrunetonColorDisplayModel.js`; `constants/Algorithm32CanonicalData.js` -> `atmospheres/canonical/consts.js`; `geometries/SphericalEarthGeometry.js` -> `geometry/spherical/SphericalEarthGeometry.js`; `light-sources/DistantSunLightSource.js` -> `light-sources/distant-sun/DistantSunLightSource.js`; and `profiles/native-15-profile.js` -> `profiles/native-15/native-15-profile.js`. |

These rows account for all 24 current Algorithm32 specifiers in `src/flat32`:
22 change and the two `domains/index.js` imports remain stable. Run both
Algorithm32 and Flat32 type checks after every listed batch.

The initial M1 Flat32 type gate exposed the path-stable spherical import's
pre-existing named-export mismatch at checkpoint `6ea7cf8`. M1 replaces only
that stale symbol with the direct domain owner already consumed by the same
properties; it does not change the domain path, selected domain, or runtime
behavior.

### Test/build configuration

`spec/support/karma-algorithm32-three.conf.cjs` has five exact preprocessor
keys that move with their owner:

| Current key | Target key | Batch |
| --- | --- | --- |
| `src/algorithm32/geometries/FlatEarthGeometry.js` | `src/algorithm32/geometry/flat/FlatEarthGeometry.js` | M7 |
| `src/algorithm32/geometries/SphericalEarthGeometry.js` | `src/algorithm32/geometry/spherical/SphericalEarthGeometry.js` | M7 |
| `src/algorithm32/three/ExactFlatGroundObject.js` | `src/algorithm32/geometry/flat/three/ExactFlatGroundObject.js` | M7 |
| `src/algorithm32/three/ExactSphereGroundObject.js` | `src/algorithm32/geometry/spherical/three/ExactSphereGroundObject.js` | M7 |
| `src/algorithm32/react/Algorithm32AtmosphereComposer.js` | `src/algorithm32/adapters/react/Algorithm32AtmosphereComposer.js` | M10 |

The recursive file globs in that Karma configuration, the Jasmine recursive
spec glob, both Algorithm32 and Flat32 ambient include roots, and the existing
Algorithm32 type/test command roots survive without text changes. Their full
runs remain required discovery gates.

### Frozen experiment consequence

All 13 files under
`scripts/experiments/flat-local-cache-domain-convergence/` are immutable
experiment/provenance surfaces for this reconciliation: seven JavaScript
runner/test/support modules and six JSON records. Their policies name old
production paths that the study hashes into its reports, so rewriting imports
or path records would change the experiment identity and require separate
requalification. Compatibility aliases are forbidden. M11 therefore removes
only the root
`study:algorithm32-flat-local-cache-domain` package-script entry and leaves the
experiment, policies, reports, and hashes untouched. The independent
`test:algorithm32-flat-local-convergence-policy` record-integrity command
remains and must pass. Restoring an executable study later requires a newly
authorized and requalified experiment, not a migration shim.

### Current documents versus historical evidence

M11 updates current layout claims in:

- `src/algorithm32/README.md`;
- `agents/topics/algorithm32/cache/cache-design.md`, replacing its duplicate
  File Placement tree with a link here while retaining cache-role design;
- `agents/topics/algorithm32/production/production-implementation-plan.md`,
  replacing its duplicate current source-shape tree with a link here;
- `agents/topics/algorithm32/cache/README.md` and `cache/cache-contract.md`,
  retargeting the GPU parity policy to the distant-Sun cache fixture owner and
  removing or explicitly labeling the cache contract's already-retired Star
  fixture link as historical;
- `agents/topics/algorithm32/flat-local/extension-contract.md`, retargeting
  geometry and light-source interfaces to their family `types.d.ts` owners;
- `agents/topics/algorithm32/production/current-dataflow.md`, removing or
  explicitly labeling its already-retired `star-parity-consts.js` link as
  historical;
- current, non-candidate path guidance in the extraterrestrial README,
  interface contract, and `celestial-contribution-cache-design.md` without
  inventing an absent `ExtraterrestrialSource` declaration; and
- this plan, the canonical reconciliation plan, the reconciliation ledger,
  and the active-topic checkpoint.

Do not mechanically rewrite historical path evidence in the reconciliation
inventory, validation inventory/analysis, completed descriptor analysis,
completed plan/ledger rows, Stage 9.6 containment inventory, ground promotion
hash records, archives, evidence roots, reference artifacts, Algorithm32
experiment topics, or any `scripts/extraterrestrial` baseline/candidate/
manifest/harness path. Current documents may label such a passage as
historical; they may not silently retarget an old path while retaining its old
hash or provenance claim.

## Verification Command Matrix

Every implementation batch starts from the preceding passing gate. The common
gate after every batch is:

```powershell
npm run typecheck:algorithm32
npx prettier --check 'src/algorithm32/**/*.js' 'src/algorithm32/**/*.jsx' 'src/algorithm32/**/*.d.ts'
git diff --check
```

M1-M3 and M5-M10 also run `npm run typecheck:flat32` because they change at
least one live Flat32 import, redistribute ambient declarations visible to
Flat32, or reverify its surviving domain barrel. Include the five touched
Flat32 modules and the Karma configuration in the Prettier check whenever
their batch edits them.

| Batch | Focused behavior command | Required broader gate |
| --- | --- | --- |
| M1 | `npm run test:algorithm32 -- --filter="utilities|PixelMath|canonical value identity|value assertions|Algorithm32ShaderAssembler|CachePassAssembler"` | Algorithm32 and Flat32 type checks |
| M2 | `npm run test:algorithm32 -- --filter="UnitValue|SpectralBasis|SpectralPacket|cubed-sphere direction domains|CubedSphereW27DirectionDomain|Fibonacci34DirectionDomain|paired-Fibonacci-34 direction domain|Native48PositionDomain|spherical native position domains|pure scattering-density transport"` | Algorithm32 type check; Flat32 type check because its stable domain barrel is reverified |
| M3 | No behavior filter; declaration-only ownership move | Algorithm32 and Flat32 type checks plus duplicate/missing ambient-name scan |
| M4 | `npm run test:algorithm32 -- --filter="shader-contribution helpers|Algorithm32ShaderAssembler|ShaderCompatibilityValidator|CachePassAssembler|CpuDirectionalSpectralField|distant spherical owner shader contributions|CacheGpuExecutor|canonical value identity"` | Expected 31 focused specs; Algorithm32 type check; exact declaration/export, M1-identity-owner, and dependency-direction scans |
| M5 | `npm run test:algorithm32 -- --filter="CacheGpuExecutor|CacheOperations|SpectralCalculator|production fixtures|ThreeCacheBackend|Algorithm32Transport|scattering-density transport|scattering-order field operations|distant-Sun later-order scattering adapter|local-Sun binary64 scattering cache|distant-Sun executable GPU owner modules|local-Sun GPU cache plan|DistantSunCache|LocalSunCache|DistantSunCacheController|LocalSunCacheController"` | Expected 92 focused specs across 17 suites; Algorithm32 and Flat32 type checks; full Node regression; full `npm run test:algorithm32:three`; fixture/browser/dependency closure scans |
| M6 | `npm run test:algorithm32 -- --filter="native Algorithm32 production profile|CanonicalAtmosphere|BrunetonColorDisplayModel|UniformLambertianGroundBoundary"` | Expected 36 focused specs after canonical-data cases merge; Algorithm32 and Flat32 type checks; full Node regression; full Three/WebGL lane |
| M7 | `npm run test:algorithm32 -- --filter="FlatEarthGeometry|SphericalEarthGeometry|ExactFlatGroundObject|ExactSphereGroundObject"` | Expected 56 focused specs; Algorithm32 and Flat32 type checks; full 429-spec Node and 5-spec Three/WebGL lanes; exact four-new/one-unchanged Karma key scan |
| M8 | `npm run test:algorithm32 -- --filter="DistantSun|distant-Sun|LocalSun|local-Sun|FlatSynchronizer|ThreeShadowObjectConfigurator|native N4 CPU/GPU parity oracle|GPU cache parity policy|CacheOperations|pure scattering-density transport|scattering-order field operations|distant spherical owner shader contributions"` | Expected 156 focused specs across 25 suites; Algorithm32 and Flat32 type checks; full Node and Three/WebGL lanes |
| M9 | `npm run test:algorithm32 -- --filter="SharedModel|SpectralModel|Reference|ShaderBuilder|SceneInputCapture|ShaderRuntimePass|ShaderPassPerformanceTimer|Algorithm32ShaderHandle|^Algorithm32 (?!production |canonical |native |Three )"` | Expected 64 focused specs across 10 suites; Algorithm32 and Flat32 type checks; full 429-spec Node and 5-spec Three/WebGL lanes |
| M10 | `npm run test:algorithm32 -- --filter="Algorithm32ReactUtils"` | Expected 9 specs in one suite; Algorithm32 and Flat32 type checks; full Node and Three/WebGL lanes |
| M11 | `npm run test:algorithm32 -- --filter="production fixture|analytic"` | Expected 4 specs across two suites; every final gate below |

M3's declaration-only gate is exact rather than relying on TypeScript's
permitted interface merging:

- compare every top-level `type`, `interface`, `class`, `enum`, and `namespace`
  name plus kind with checkpoint `HEAD`; the Algorithm32 result must remain
  `expected=443 actual=443 delta=0`;
- scan the combined recursive `src/algorithm32` and `src/flat32` ambient
  surface; it must report `declarations=464 duplicate_names=0`;
- compare the 15 M3 targets with the exact owner lists above, including final
  declaration counts `12, 2, 8, 27, 1, 14, 1, 7, 3, 5, 121, 1, 10, 1, 1`
  in table order;
- require the seven retiring dedicated/root declaration files and the empty
  `src/algorithm32/types/` directory to be absent, and require that no
  `types/interfaces/` bucket was created; and
- require exactly the four M3 `import(...)` specifiers in Staged Ambient
  Implementation Links and no former `../models`, `../implementation`, or
  `../Algorithm32.js` specifier in those two class-type files.

Both ambient include configurations remain recursive and unchanged. Passing
type checks without these name, duplicate, placement, retirement, and staged
path results is not sufficient to close M3.

The final gate is:

```powershell
npm run typecheck:algorithm32
npm run typecheck:flat32
npx prettier --check 'src/algorithm32/**/*.js' 'src/algorithm32/**/*.jsx' 'src/algorithm32/**/*.d.ts' src/flat32/Algorithm32Runtime.js src/flat32/FlatLocalMode.js src/flat32/LocalSunSceneLighting.js src/flat32/LocationTimeController.js src/flat32/SphericalDistantMode.js spec/support/karma-algorithm32-three.conf.cjs
npm run test:algorithm32
npm run test:algorithm32:three
npm run test:algorithm32-flat-local-convergence-policy
npm run test:ui:flat32
git diff --check
```

The live external residual scans must return no output:

```powershell
rg -n 'algorithm32/(?:Algorithm32\.js|atmospheres/CanonicalAtmosphere\.js|color/BrunetonColorDisplayModel\.js|constants/Algorithm32CanonicalData\.js|geometries/(?:FlatEarthGeometry|SphericalEarthGeometry)\.js|light-sources/(?:DistantSunLightSource|FlatSynchronizer|LocalSunLightSource)\.js|profiles/native-15-profile\.js|react/Algorithm32ReactUtils\.js|three/ThreeCacheBackend\.js|utils/(?:AngleMath|DistanceMath|MathUtils)\.js)' src/flat32 spec/support
rg -n 'src/algorithm32/(?:geometries/(?:FlatEarthGeometry|SphericalEarthGeometry)|three/(?:ExactFlatGroundObject|ExactSphereGroundObject)|react/Algorithm32AtmosphereComposer)\.js' spec/support/karma-algorithm32-three.conf.cjs
rg -n '"study:algorithm32-flat-local-cache-domain"' package.json
```

The final source scan must also prove that no retired owner directory, old
module target, compatibility re-export, duplicate module, empty scaffold,
root `consts/`, or root `types/interfaces/` exists. Class/ordinary filename,
named-only class export, prohibited `Object.freeze`, and current-document
scans from the preceding reconciliation steps remain active. In particular,
the seven retired PascalCase ordinary module paths named in O2 must be absent,
and the Three shadow configuration operation must have only the cohesive
`three-lighting-support.js` owner.

The frozen-surface check must return no output:

```powershell
git diff --name-only 6ea7cf8 -- scripts/experiments scripts/extraterrestrial archives evidence references agents/topics/algorithm32/archive agents/topics/algorithm32/experiments
git diff --name-only 6ea7cf8 -- agents/topics/algorithm32/reconciliation-inventory.md agents/topics/algorithm32/validation-inventory.md agents/topics/algorithm32/validation-reconciliation-analysis.md agents/topics/algorithm32/descriptor-reconciliation-analysis.md agents/topics/algorithm32/production/stage-9.6-containment-inventory.md
```

Do not run `npm run study:algorithm32-flat-local-cache-domain`; M11 retires
that command for the reason recorded above.

## Planning Verification And Completion

The Step 4.3.1 manifest was compared mechanically with
`rg --files src/algorithm32` at checkpoint `6ea7cf8`. The result is:

```text
current paths: 245
manifest rows: 245
unique current paths: 245
missing paths: 0
extra paths: 0
duplicate current paths: 0
```

Intentional target merges are limited to the export-, declaration-,
specification-, and class-helper-level splits named under Mixed-File And
Cumulative Target Contracts. No two unrelated implementation modules have the
same target.
Every selected directory contains mapped current code or a mapped ambient
contract; no requested placeholder directory is created.

The corrected target scan finds 298 target references, 268 unique target paths,
and 26 duplicate target groups. All 26 are the intentional constant, type,
specification, or class-helper merges defined by the mixed-file and cumulative
contracts, including the two cohesive utility merges required to eliminate
single-function modules. The increase from 245 current paths to 268 unique
targets comes from explicit owner splits of mixed files, not placeholders or
scaffolds; there is no unrelated target collision.

Step 4.3.1 is complete. Its planning step moved no production path. M1 then
merged 20 utility inputs into 18 final files under
`utils/{math,identity,validation,time}`, leaving 243 Algorithm32 files. Its
25-of-429 focused specs, Algorithm32 and Flat32 type checks, formatting,
old-path, target, and diff gates pass. M2 split 30 quantity/domain inputs into
36 final owner files, leaving 249 Algorithm32 files. Its corrected 47-of-429
focused gate, Algorithm32 and Flat32 type checks, formatting, old-path/import,
target, class-entry/export, exact-literal, diff, and frozen-surface gates pass.
M3 moved 79 declarations into 15 capability owners and retired the seven-file
root type bucket, leaving 252 Algorithm32 files. Both type checks, formatting,
443-of-443 Algorithm32 name/kind preservation, 464 unique combined ambient
declarations with zero duplicates, exact owner placement, four staged imports,
retirement, scope, and diff gates pass. M4 retired 17 assembly/shared-cache
paths into 23 final targets, leaving 258 Algorithm32 files. Its corrected
31-of-429 focused gate, Algorithm32 type check, formatting, exact 49- and
16-name ambient splits, import/export/target, sole-hash-owner, dependency,
cycle, frozen-surface, and diff gates pass. M5 moved 32 manifest inputs to 33
live paths under GPU runtime, cache and spectral transport, the shared ground
cache owner, and production references, leaving 259 Algorithm32 files. Its
92-of-429 focused gate, both type checks, formatting, complete 429-spec Node
regression, 5-spec Three/WebGL lane, exact target/subtree and ambient splits,
fixture-identity, private-kernel, relative-import, dependency, cycle,
frozen-surface, and diff gates pass. M6 moved and cumulatively merged its 22
physical-owner inputs into 22 final targets under Native-15 profiles, canonical
atmosphere, Bruneton color, and uniform-Lambertian ground. Because two retiring
declaration inputs merge into the already-live M3 profile target, the batch is
intentionally net minus one and leaves 258 Algorithm32 files. Its 36-of-429
focused gate, both type checks, formatting, complete 429-spec Node regression,
5-spec Three/WebGL lane, exact 26-constant and 25-declaration distributions,
initialization/literal/import/dependency/cycle/frozen-surface/diff gates, and
independent closure audit pass. M7 combined 14 remaining geometry/endpoint
inputs with three already-live M3 declaration owners into the exact 19-file
shared/flat/spherical tree, leaving 260 Algorithm32 files. Its 56-of-429
focused gate, both type checks, formatting, complete 429-spec Node regression,
5-spec Three/WebGL lane, exact 9/8 constants, 42 declarations, 5/6/2/2 consumer
edges, four-new/one-unchanged Karma keys, relative-import, dependency, cycle,
frozen-surface, and diff gates pass. M8 moved 70 light-source and solar inputs
to 77 unique targets, leaving exact 79-file light-source and three-file
extraterrestrial/Sun surfaces and 265 Algorithm32 files. Its 156-of-429 focused
gate, both type checks, formatting, complete 429-spec Node regression, 5-spec
Three/WebGL lane, exact 109 exports, 22/4/25 constants, five shared Three
operations, 158 declarations, fixture identities, corrected 262/257 JavaScript
import counts, ten external edges, dependency/cycle/frozen-surface/diff gates,
and two independent declaration/import audits pass. M9 moved and split 24
runtime inputs into 28 target references and the exact 30-file
model/reference/rendering/facade tree, leaving 268 Algorithm32 files. Its
64-of-429 focused gate, both type checks, formatting, complete 429-spec Node
regression, 5-spec Three/WebGL lane, exact 12 exports, 28 declarations, 52
owned imports, four external edges, four facade links, browser/Karma,
dependency/cycle/frozen-surface/diff gates, and independent import audit pass.
M10 moved its six React/R3F inputs one-to-one into the exact six-file adapter
tree without changing the 268-file total. Its 9-of-429 focused gate, both type
checks, formatting, complete 429-spec Node regression, 5-spec Three/WebGL lane,
exact 16 exports, 23 owned clauses, nine reverse edges, single Flat32 import,
single Karma-key move, browser/dependency/cycle/frozen-surface/diff gates, and
independent preflight/configuration audits pass. M11 moved no source, removed
only the invalid frozen-study package exposure, updated exactly its 14 current
documents, and removed 26 validated fileless legacy directories. The live tree
remains exactly 268 files with no empty subtree. Its 4-of-429 focused gate,
both type checks, exact 260-file Algorithm32 code/declaration formatter scope,
complete 429-spec Node regression in 112.131 seconds, 5-spec Three/WebGL lane,
retained 1-spec policy-integrity check, and 3-spec Flat32 UI lane pass. The
checkpoint-manifest/live-target equality, owner/path/export/declaration/import/
cycle, JSON/package/current-document, frozen-surface, untracked whitespace and
newline, and diff checks also pass. Step 4.3.2 is complete. Step 4.3.3 then
independently reproduced the exact 268-file tree, 245-row checkpoint manifest,
268 live targets, 26 intentional merge groups, owner/class-export rules,
443/464 declaration totals, 577 resolved relative clauses, zero runtime SCCs
and forbidden edges, exact browser/Karma/package/fixture/frozen facts, and
tracked/untracked hygiene. Its focused document follow-up corrected seven
archival stub-anchor links, retired-Star authority wording, and one stale
pending-import claim; all 195 relative file links and 54 relative anchors now
resolve. Step 4.3 is complete. The subsequent Step 4.4.1-4.4.3 addition sets
above bring the live tree to 298 files, the geometry owner to 33 files, the
light-source owner to 92 files, and the rendering owner to 18 files without
changing the checkpoint manifest. Reconciliation Steps 4.5.1-4.5.3 are
complete. The canonical
[helper-ownership target plan](./helper-ownership-target-plan.md) assigns all
711 rows an exact final owner and atomic batch without changing the live tree;
Step 4.5.4 then implemented all 89 immediate rows, and Step 4.5.5 implemented
all 264 gated rows. The live tree now contains 287 files, including 279
formatted code/declaration files and 131 production modules. Step 4.5.6 then
independently reproduced that exact tree, all class/namespace/ordinary-owner
dispositions, 599 resolved relative clauses, zero runtime cycles, 601 unique
ambient names across 76 declaration files, and every required behavior and
hygiene gate. Step 4.5 is complete. The ambient declaration tree then closed
under reconciliation [Step 5](./reconciliation-plan.md#5-reconcile-ambient-types),
and Steps 6.1-6.3 are complete; Step 7.1 is current.

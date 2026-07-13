# Algorithm32 Feature-Implementation Reorganization Plan

Status: completed and archived on 2026-08-06. Inventory Step 1, target
ownership Step 2, contract Step 3, transaction-planning Step 4, all Step 5
transactions, and final reconciliation are complete. `F01-bruneton-color` through
`F08-local-sun`, the `P01` construction prerequisite, and
`I01-geometry-support`, `I02-light-source-support`, and
`I03-ground-transport`, `I04-sampling-domains`, and
`I05-physical-quantities`, `I06-spectral-values`, `I07-math`, `I08a-time`,
`I08b-validation`, `I08c-value-identity`, `I09-atmospheric-transport`, and
`I10-shader-assembly`, `I11-gpu-cache-runtime`, `I12-rendering-runtime`, and
`I13-reference-execution`, `I14-reference-evidence`, `F09-algorithm32`, and
`F10-react-three` and `R01-final-reconciliation` are complete and green.
Extraterrestrial production integration Step 3 is the current production work.

## Purpose

Restore `src/algorithm32/implementation/` as the home of concrete exported
implementations that API callers can instantiate or select. Every immediate
child of `implementation/` names the feature being implemented, such as
`local-sun`, `distant-sun`, or `star-field`, and owns that feature's complete
implementation closure: public class, cache, CPU/reference support, GPU
construction, renderer adapter, constants, internal declarations, tests, and
fixtures where applicable.

The global contract layer specifies substitutable behavior through interfaces.
It does not own concrete caches, adapters, controllers, or other executable
implementation. Data types necessarily exposed by those interfaces remain in
the declaration-only contract layer; class-internal declarations remain with
their implementation feature.

`implementation/` is not required to contain every executable Algorithm32
module. Existing or former contents such as orchestration, reference,
renderer, assembly, and shared infrastructure are re-evaluated and may be
rehomed to a more appropriate internal owner outside `implementation/` when
they are not private to one caller-facing implementation.

This is an ownership and public-surface reorganization. It does not authorize
numerical, physical, lifecycle, rendering, or supported-capability changes.

## Current Baseline

The reconciled production tree contains exactly 295 files under
`src/algorithm32`, including 287 JavaScript, JSX, and ambient-declaration files,
at source identity
`sha256:7d7810f7b69b7516bfdd25058360d62cd4b586176d7692ca90fd5655f1398832`.
It currently has 16 immediate directories, 67 JavaScript modules declaring an
exported class (54 named exports and 13 default exports), and 45 ambient
interfaces.

The current immediate directories primarily describe technical layers or
broad categories:

```text
adapters               gpu-assembler          profiles
atmospheres            gpu-runtime            quantities
color                   ground-boundaries      references
domains                 light-sources          runtime
extraterrestrial        transport              utils
geometry
```

That layout obscures the caller-facing implementation owner. For example, the
distant- and local-Sun caches are already partly colocated with their light
sources, while generic runtime, assembler, transport, domain, and utility
owners hold other parts of the behavior those implementations expose.

The previous reconciliation organization remains valid evidence of exact
behavior, imports, and file ownership at its checkpoint. Its technical-layer
target tree is superseded as current path guidance by this plan.

## Current Status And Next Action

This plan is the current work authority. Rules F1-F8 are selected. The first
seven caller-facing feature transactions and the construction-boundary
prerequisite are complete; all later paths remain at their current owners until
their own approved transactions.

Repository checkpoint `0fb9be9e625012e92ec1128c362f0f8cd1211d39`
(`0fb9be9`, `- pre another folder reorganization`) is the clean committed
baseline for this work. It contains the completed reconciliation, current
extraterrestrial API decisions, this reorganization plan, and its active-topic
handoff. Do not compare the reorganization against an older reconciliation
commit or treat those completed changes as pending work.

Step 1 is complete in the
[canonical feature inventory](implementation-feature-inventory.md). It covers
all 295 files, all 67 exported-class modules, all 45 ambient interfaces, the
current caller-selected surface, all 25 resolving external runtime import
edges, and non-runtime configuration, browser, experiment, reference, and
current-document path consumers. The audit corrected the earlier class count:
54 is the named-export subset and omits 13 default-export classes.

Step 2 is complete in the
[canonical target-owner map](implementation-feature-target-map.md). It assigns
all 295 inventory rows to 10 public implementation features, declaration-only
interface owners, the single public implementation surface, or specifically
named non-public owners. The map has no unassigned row, unintended target
collision, or forbidden immediate implementation folder.

Step 3's interface/export audit is recorded in the
[canonical interface and public-export contract](implementation-feature-contracts.md).
Latitude, longitude, and a canonical UTC instant are externally supplied in
facade observation configuration; changes create replacement geometry,
light-source, facade, scene, and cache objects. Algorithm32 passes the
observation and configured atmospheric light source to geometry before any
source-cache build. Geometry retains and installs the canonical placement
directly on that source through `GeometryConfigurableLightSource`. Celestial
source contracts are unchanged and remain deferred to the extraterrestrial
production stage.
Time/location animation and in-place synchronization are deferred from this
reorganization but remain mandatory production Stage 14 MVP work whose cache
transforms must avoid a full rebuild per clock tick.
`FlatSynchronizer` is private `flat-earth` support and is absent from the
public export list. Flat32's flat projection and spherical observer-frame
direction calculations move into the corresponding geometry feature closures;
Flat32 retains only its UI/preset responsibilities. Step 3 is complete: the
readonly placement union, constructor splits, observation validation,
one-shot binding, cache identity, and replacement publication rules are exact.

Step 4 is complete in the
[canonical transaction plan](implementation-feature-transaction-plan.md). It
records the dependency queue, partitions every target-map owner, resolves the
shared solar-position owner, and supplies the exact collision-checked
`F01-bruneton-color` manifest and gates. Step 5 has completed all eight leaf
feature transactions plus the construction prerequisite. The public barrel
now exposes the eight reviewed concrete classes; each feature owns its private
cache, shader, scene, declaration, fixture, and test closure. Both built-in Sun
classes own their canonical native-15 irradiance, geometry owns their
construction-time placement, and every transaction checkpoint is green. Snow
remains deferred and receives no placeholder or accepted constructor value.
The shared geometry direction, visual-request, declaration, and test closure
now occupies `geometry-support` beside the existing solar prerequisite; `I01`
is green. The next action is to expand and review
`I02-light-source-support` is also green: the shared source request, CPU field,
cache contract/default, Three-lighting, declaration, and test closure now
occupies its canonical non-public owner. The next action is to expand and
review `I03-ground-transport`, which is now green at its canonical non-public
owner. The full position/direction domain closure now occupies
`sampling-domains`; `I04` is also green. The next action is to expand and
review `I05-physical-quantities`, whose internal operations and global
data-contract split is now green. The next action is to expand and review
`I06-spectral-values`, whose internal values and global data-contract split is
now green. The complete shared math closure now occupies `math`; `I07` is also
green. `TimeMath` now occupies `time`, and the validation closure now occupies
`validation`, and the hash closure occupies `value-identity`; all three `I08`
subtransactions are green. The complete transport closure occupies
`atmospheric-transport`; `I09` is green. The complete assembler closure
occupies `shader-assembly`; `I10` is green. The GPU cache execution and private
declaration closure occupies `gpu-cache-runtime`; `I11` is green. The complete
rendering closure occupies `rendering-runtime`; `I12` is green. Reference
orchestration occupies `reference-execution`; `I13` is green. Retained
fixtures and documentation occupy `reference-evidence`; `I14` is green. The
public facade/model closure occupies `implementation/algorithm32`; `F09` is
green. The React/Three closure occupies `implementation/react-three`; `F10` is
green. The next action is `R01-final-reconciliation`.

### Selected Step 2 ownership decisions

- `CanonicalAtmosphere` is a public concrete implementation. Its final owner
  is `src/algorithm32/implementation/canonical-atmosphere/`, and it will be
  exported through `src/algorithm32/implementation/index.js` when its feature
  transaction completes.
- `AtmosphereModel` remains a global behavioral interface so callers may
  provide other atmosphere implementations. `CanonicalAtmosphere` declares
  `@implements {AtmosphereModel}` at migration.
- The canonical-atmosphere feature owns its class-specific constants,
  declarations, tests, and exclusive implementation support. Its use of a
  genuinely shared quantity, shader-assembly, or GPU mechanism does not make
  that shared mechanism part of the feature closure.
- `SpectralBasis` and `SpectralPacket` are public readonly value contracts, not
  public implementation features or caller-implementation seams. The current
  concrete builders and operations belong to the non-public `spectral-values`
  owner.
- The target `Config` has no caller-supplied spectral-basis property. The
  Algorithm32 facade selects and constructs the native-15 spectral values.
  Supporting another basis later requires an explicit API revision rather than
  a speculative override today.
- Caller-authored spectral bases, packets, irradiance distributions,
  reflectance distributions, and other custom spectral inputs are deferred.
  Built-in public constructors resolve their required native-15 values from
  the owned default profile or accept only separately approved non-spectral
  physical controls; Step 3 adds no public spectral builder or factory.
- This deferral does not remove repository-owned validation profiles. The
  fixed Bruneton paper-comparison profile, including its direct 40-coordinate
  basis, solar spectrum, atmosphere, and grass reflectance, must remain
  constructible through a non-public validation entrypoint so the production
  candidate boundaries and comparison images can be regenerated from pinned
  inputs at any time.
- The initial built-in ground-material set is grass only, selected as a named
  uniform-Lambertian profile rather than a caller-authored spectral packet.
  Grass uses the retained Bruneton comparison-paper reference. Snow is a later
  contract expansion after its citation and numerical profile are selected;
  no provisional snow value closes the current API. Ocean, including its
  directional BRDF, data, and citations, is a stretch goal.
- Interfaces type the capabilities consumed by Algorithm32 and implemented by
  its built-in classes. This reorganization does not promise a supported
  third-party implementation SDK and does not expose internal cache,
  construction-domain, or shader machinery for caller implementations.
- Cubed-sphere, Fibonacci, paired-Fibonacci, and spherical-native domain
  classes are non-public cache-construction mechanisms under
  `sampling-domains`; no current public configuration accepts them.
- Native-15 is public readonly profile configuration under
  `profiles/native-15`, not an implementation feature.

The execution model after planning is one vertical caller-facing feature per
transaction. A transaction includes that feature's complete exclusive closure
and returns every required gate to green before another feature begins. Shared
internal prerequisites and later internal rehomes are separate transactions.
Temporary coexistence of completed feature folders and untouched legacy
folders is allowed; aliases, duplicate implementations, and two-feature moves
are not.

Extraterrestrial production integration remains paused before Step 3. Its API
and behavioral decisions remain inputs, but no celestial production source is
implemented during this reorganization.

## Selected Organization Rules

### F1. `implementation/` contains concrete API implementations

Every immediate child of `src/algorithm32/implementation/` identifies one
concrete feature, model, backend, adapter family, or selectable profile that an
API caller can instantiate or select. An immediate child named only for a
technical layer—such as `runtime`, `cache`, `gpu`, `shader`, `utils`, `shared`,
or `types`—is prohibited.

### F2. A feature folder owns its complete implementation closure

The class or exported value through which callers select a feature owns all
code used only to implement that feature. Its cache types and controllers,
field packing, CPU evaluators, shader contributors, Three adapters, constants,
internal types, tests, and fixtures remain beneath the same immediate feature
folder.

An internal class being exported from its own JavaScript module does not make
it public API and does not justify a separate immediate folder.

### F3. Global declarations specify contracts, not implementations

Cross-feature behavioral contracts are ambient interfaces in the global
declaration layer. Each concrete class declares every intended interface with
class-level `@implements` tags. Public request, result, configuration, state,
quantity, and discriminated-union types required by those interfaces may live
beside them as declaration-only support.

Concrete class declarations and implementation-only types remain inside their
feature folder. No cache implementation, default controller, adapter class,
factory, executable constant, or implementation selector lives in the global
contract layer.

### F4. Public exports are explicit

`src/algorithm32/implementation/index.js` becomes the canonical runtime export
surface for caller-instantiable classes and selectable implementation values.
It exports only reviewed public implementations. Internal classes may retain
named module exports for testing and composition but are absent from the
public barrel.

Application code, including Flat32, imports public Algorithm32 implementations
through this surface rather than reaching into implementation internals.
Public declarations name interfaces and value contracts directly; they do not
create runtime type barrels.

### F5. Sibling implementations compose through interfaces

One immediate implementation folder does not import another folder's private
class, cache, controller, or adapter. Cross-feature composition uses a public
or internal interface declared at the common contract boundary. The
`algorithm32` implementation may orchestrate caller-supplied implementations
through those interfaces, but it does not recover their facts from descriptors
or select a concrete implementation by hidden inference.

### F6. Shared executable code requires a named implementation owner

Code used by multiple features is first evaluated for return to an owning
class. A genuinely reusable executable contract that is itself a
caller-selectable implementation may receive its own immediate implementation
folder only when that folder names the concrete capability it implements. A
shared internal mechanism that is not caller-selectable is rehomed outside
`implementation/` under its appropriate architectural owner. It does not
receive a misleading public implementation folder. Generic catch-all folders
remain prohibited.

### F7. Moves preserve behavior and history is not retained in tests

The migration changes paths, imports, declarations, and public export routing
without changing observable behavior. Tests continue to assert current public
and numerical contracts; they do not assert that an old path or name was
removed. Static migration audits own exact file coverage, stale-path scans,
dependency direction, and closure.

### F8. Migration proceeds one complete feature at a time

The migration unit is one vertical feature, never one technical layer across
the repository. A feature transaction moves its public implementation,
exclusive internal closure, declarations, constants, tests, fixtures, public
export, and affected external consumers together. The complete repository
returns to green before another feature begins.

During migration, completed feature folders may coexist with untouched legacy
technical-layer folders. That temporary hybrid tree is not a compatibility
surface: moved modules have one live path, all consumers change atomically, and
no old-path re-export remains. Shared internal code stays at its current owner
until a feature transaction proves it exclusive or a later dedicated internal
rehome transaction resolves its genuine cross-feature owner.

No transaction moves two caller-facing features together. If a feature needs a
shared contract or internal mechanism changed first, that prerequisite lands as
its own green transaction before the feature transaction begins.

## Selected Target Shape

The exact package set and every file-level destination are owned by the
[canonical target-owner map](implementation-feature-target-map.md). The target
root has this form:

```text
src/algorithm32/
|-- interfaces/                       declaration-only global contracts
|-- implementation/
|   |-- index.js                      reviewed public runtime exports
|   |-- algorithm32/                  Algorithm32 facade and orchestration
|   |-- canonical-atmosphere/         CanonicalAtmosphere closure
|   |-- bruneton-color/               BrunetonColorDisplayModel closure
|   |-- distant-sun/                  DistantSunLightSource and all caches
|   |-- local-sun/                    LocalSunLightSource and all caches
|   |-- flat-earth/                   FlatEarthGeometry closure
|   |-- spherical-earth/              SphericalEarthGeometry closure
|   |-- uniform-lambertian-ground/    ground implementation closure
|   |-- three-cache-backend/          ThreeCacheBackend closure
|   `-- react-three/                  public React/R3F integration closure
|-- shader-assembly/                  non-public cross-feature mechanisms
|-- gpu-cache-runtime/
|-- rendering-runtime/
|-- atmospheric-transport/
|-- geometry-support/
|-- light-source-support/
|-- ground-transport/
|-- physical-quantities/
|-- spectral-values/                 non-public standard value builders
|-- sampling-domains/                non-public cache domain implementations
|-- profiles/
|   `-- native-15/                    public readonly configuration data
|-- reference-execution/
|-- reference-evidence/
|-- value-identity/
|-- math/
|-- time/
|-- validation/
|-- README.md
|-- evidence.md
|-- references.md
`-- jsconfig.json
```

No `star-field` folder is part of this target. A future implementation creates
it only when that implementation has an approved feature transaction.

## Reshuffling Transaction Plan

The [target-owner map](implementation-feature-target-map.md) defines the final
destination of every current file. The following phases define how that map is
realized without a repository-wide move. Step 3 must close the exact interface
and export contract before Phase 1 begins, and Step 4 must turn each listed
transaction into a collision-checked source-to-target manifest.

### Phase 1: detach application consumers from internals

Complete separate green prerequisite transactions before moving their current
owners:

1. Replace Flat32's placement calculations with the required facade
   `observation` value. Move its flat local-source projection and spherical
   observer-frame direction calculation into the corresponding geometry
   feature transactions. Move `FlatLocalMode`'s placement-derived radial cache
   extent into `FlatEarthGeometry`. Remove the placement inputs and retained
   placement diagnostics from both mode constructors. Flat32 retains selection
   state, labels, and UI preset behavior, passes only latitude, longitude, and
   the selected instant, and imports no geometry-private synchronization
   support.
2. Replace Flat32's direct sampling-domain imports with facts owned by its
   configured public implementations or with Flat32-owned fixed display facts.
   Do not expose `sampling-domains` merely to preserve those imports.
3. Normalize Flat32's native-profile import through `profiles/index.js` while
   keeping `profiles/native-15` outside `implementation`.
4. Record the Karma path-specific preprocessors, Node/browser roots, retained
   convergence references, and current documentation paths affected by each
   later transaction. Path updates land with their owning transaction rather
   than through aliases.

### Phase 2: migrate leaf public implementations

Move one complete feature per green transaction, in this dependency-oriented
queue:

1. `canonical-atmosphere`;
2. `bruneton-color`;
3. `uniform-lambertian-ground`;
4. `flat-earth`;
5. `spherical-earth`;
6. `three-cache-backend`;
7. `distant-sun`; and
8. `local-sun`.

The first completed feature creates `implementation/index.js`; each later
feature adds only its reviewed public exports. Feature-private caches,
controllers, shader contributors, renderer adapters, declarations, tests, and
fixtures move with their feature. Shared mechanisms remain at their current
valid paths during this phase.

### Phase 3: rehome proven shared mechanisms

After the sibling features that demonstrate each sharing relationship have
moved, rehome one non-public owner per green transaction:

1. `geometry-support` after both geometry features;
2. `light-source-support`, `ground-transport`, and `sampling-domains` as three
   independent transactions after both Sun features;
3. `atmospheric-transport` after its source consumers are stable;
4. `gpu-cache-runtime` and `shader-assembly` as independent transactions after
   cache-producing features and the Three backend expose their final imports;
5. `physical-quantities`, `spectral-values`, `math`, `time`, `validation`, and
   `value-identity` as independent transactions in the dependency order proven
   by the prospective graph;
6. `reference-execution` and `rendering-runtime` as independent transactions
   before the Algorithm32 facade moves; and
7. `reference-evidence` as a non-executable evidence rehome with all current
   links updated in the same transaction.

No numbered group above authorizes a multi-owner commit. Step 4 may reorder
independent transactions when its prospective graph proves a safer dependency
order, but it may not combine them.

### Phase 4: migrate facade and public adapter

1. Move `algorithm32` after its reference, rendering, transport, value, and
   assembly dependencies have their final owners.
2. Move `react-three` last, after `Algorithm32`, `ThreeCacheBackend`, and every
   implementation it exposes or composes have canonical public exports.
3. Update every remaining Flat32 runtime import to an approved public
   implementation or public value surface. No external consumer may retain a
   deep import into a feature-private or non-public owner.

### Phase 5: reconcile and close

Run documentation reconciliation, archive the migration-only inventory and
manifests, perform the full independent closure in Steps 8 and 9, and then
resume extraterrestrial production integration at its paused Step 3. The
profile tree and root support files remain in place unless their exact map row
specifies a move; absence of a move is not an omitted transaction.

Every source-moving transaction uses the required transaction gates below and
records a green checkpoint before the next transaction starts. No phase uses
old-path aliases, duplicate implementations, placeholder directories, or a
test that preserves a retired path.

## Work Plan

### 1. Inventory the actual public and internal surface — complete

Record every one of the 295 current files exactly once and reproduce the
current source identity. For each runtime export, determine whether it is:

- a caller-instantiable or caller-selectable public implementation;
- an internal class exposed only for composition or focused testing;
- a global behavioral interface;
- a public data type required by an interface;
- an implementation-local type, constant, fixture, test, or support module; or
- repository documentation/configuration.

Trace every consumer outside `src/algorithm32`, including Flat32, Karma/browser
entries, package scripts, and current documents. Module-level `export` syntax
alone is not evidence of public API.

**Completed result:** the
[canonical feature inventory](implementation-feature-inventory.md) covers all
295 files exactly once, all 67 exported-class modules (54 named and 13
default), all 45 interfaces, every current externally selected value, and
every resolving or path-pinned external consumer with no duplicate or
unclassified row. It reproduces source identity
`sha256:7d7810f7b69b7516bfdd25058360d62cd4b586176d7692ca90fd5655f1398832`.

### 2. Select the exact implementation-feature set — complete

For every caller-facing class or selectable value, name its immediate
`implementation/<feature>/` owner and assign its complete dependency closure.
`CanonicalAtmosphere` is selected as the public
`implementation/canonical-atmosphere` implementation of the global
`AtmosphereModel` interface; its row and exclusive closure must be represented
that way in the complete target map.
Resolve the provisional packages above and specifically decide:

- which Algorithm32 facade, model, reference, transport, shader-assembly, and
  runtime files are private to `implementation/algorithm32` and which should be
  rehomed to a non-public internal owner;
- whether each domain and spectral/quantity class is a public implementation
  or an internal dependency of another implementation;
- whether the current `FlatSynchronizer` is public or private support and which
  feature owns its behavior;
- which Three and React classes are public adapters versus internals;
- which current utilities return to feature classes and which demonstrate a
  separately named reusable implementation contract; and
- the future `star-field` boundary without recreating retired Algorithm32-Star
  evidence or creating a placeholder directory.

No immediate implementation folder may be named for an architectural layer.
An internal architectural owner outside `implementation/` must have a genuine
cross-feature responsibility and cannot expose a competing public
implementation surface. No file may be assigned to more than one owner.

**Completed result:** the
[canonical target-owner map](implementation-feature-target-map.md) classifies
every one of the 295 inventory rows. Step 3 subsequently partitions one mixed
cache declaration row between its internal owner and a global interface owner;
every other row retains one final owner and planned target. The map
selects 10 public implementation features, keeps shared executable mechanisms
under specifically named non-public owners, assigns
`FlatSynchronizer` as private `flat-earth` synchronization support, assigns cache domains to
`sampling-domains`, retains native-15 under public `profiles`, and contains no
immediate implementation bucket named `shared`, `utils`, `runtime`, `cache`,
`gpu`, `shader`, or `types`.

### 3. Define the incremental interface and public export contracts — complete

Specify the declaration-only `interfaces/` tree, including every behavioral
interface and only the public data contracts needed to express those
interfaces. Assign class-internal declarations to their feature folders.

Define the intended final `implementation/index.js` export list and the public
import path for each caller-instantiable class or selectable implementation
value. The barrel grows one completed feature at a time. Record which currently
exported module symbols are internal-only and therefore never enter that
barrel; do not remove internal named exports merely to make that distinction.

Update the repository type and JSDoc rules as needed so interface placement,
implementation-local declarations, and `@implements` enforcement are
unambiguous.

The interface contract covers built-in implementations and public values. Do
not enlarge it solely to make third-party light sources, geometries,
atmospheres, cache controllers, sampling domains, or spectral implementations
constructible. Such extension support is deferred to a separately designed API
revision.

Do not design a public constructor, factory, configuration record, or facade
override for caller-authored spectral data. That capability is deferred; the
Step 3 contract must make native-15 default ownership sufficient for every
built-in public constructor. The non-public Bruneton paper-comparison profile
and regeneration path belong to mandatory post-extraterrestrial production
Stage 13 and are not a Step 3 exit condition.

For ground construction, define the named built-in grass selection on the
uniform-Lambertian implementation; callers do not construct spectral albedo
packets. Treat the retained comparison-paper grass reference as the grass data
authority. Snow citation and numerical-data selection are deferred to a later
contract expansion. Do not add a snow or ocean placeholder; ocean remains a
separately designed stretch goal.

**Exit condition:** every public behavior and implementation has a selected
final interface/export contract, the first feature can publish its canonical
path without waiting for unrelated features, and no executable module is
planned for the global contract layer.

**Completed result:** the
[canonical interface and public-export contract](implementation-feature-contracts.md)
defines 9 declaration-only global interface owners, 32 target interfaces
before the later celestial contracts, the 14 currently reviewed named public
implementation exports, native-15-backed constructor changes, the named grass
ground selection, all declaration splits, and every intended
`@implements` relationship. It exhaustively classifies the 45 current
interfaces and adds `Algorithm32Facade` plus the additive
`GeometryConfigurableLightSource`. It also fixes the exact observation,
placement, constructor, one-shot binding, cache-identity, publication, and
Flat32 migration contracts. Celestial source behavior remains deferred. No
production source, export barrel, placeholder, or speculative extension API
was created.

### 4. Select the feature order and per-feature transaction protocol — complete

Order features by their actual dependencies and external-consumer impact.
Prefer leaf implementations before the Algorithm32 facade and orchestration
owner, but do not move a nominal leaf before its interface and public export
contract are ready.

Before each feature begins, create an exact source-to-target manifest only for
that feature, its exclusive closure, and affected consumers. Derive the
post-transaction import graph and reject target collisions, case-only hazards,
cycles, sibling-private imports, production-to-test edges, and archived or
experimental dependencies.

Every feature transaction follows the same protocol:

1. reproduce the current checkpoint and select one feature;
2. trace its public implementation, interfaces, exclusive internals, tests,
   fixtures, and external consumers;
3. approve that feature's exact target manifest and prospective graph;
4. move the complete feature and update all affected imports and exports;
5. run focused, type, format, graph, regression, and affected application
   gates; and
6. record the green checkpoint before selecting the next feature.

**Exit condition:** the dependency-ordered feature queue is recorded, the
first transaction has an exact manifest, and no transaction requires an
old-path alias, duplicate implementation, or simultaneous unrelated feature
move.

**Completed result:** the
[canonical transaction plan](implementation-feature-transaction-plan.md)
partitions all 295 source rows across the dependency queue, records the sole
intentional barrel-merge collision and both declaration splits, selects the private
shared solar-position owner, and defines the exact seven-move, one-creation,
four-consumer `F01-bruneton-color` manifest. All sources exist, destinations
are collision-free, and no production source moved during planning.

### 5. Migrate caller-facing features individually

Migrate one caller-facing implementation feature per transaction. Move only
the portion of the declaration-only interface layer required by that feature;
unrelated interfaces wait for their own feature transaction. Add only the
completed feature's public exports to `implementation/index.js` and update all
of its external consumers in that same transaction.

Each transaction includes that feature's complete exclusive physical and
runtime closure. For example, the distant-Sun transaction includes
`DistantSunLightSource` and its exclusive cache, controller, provider, CPU
evaluators, packing, shader contribution, Three adapter, constants,
declarations, tests, and fixtures. The local-Sun transaction follows the same
rule independently.

Shared operations do not move merely because the first feature consumes them.
They remain at their valid current owner until exclusivity or a genuine shared
internal owner is established.

**Exit condition:** each selected feature has one canonical public path, one
complete colocated private closure, no live old path, green required gates, and
a recorded checkpoint before the next feature begins.

### 6. Rehome shared internal mechanisms individually

After enough caller-facing features have moved to prove the remaining sharing
relationships, rehome one non-public cross-feature mechanism at a time. Each
transaction names the mechanism's actual responsibility, moves its complete
closure, updates all implementation consumers, and returns the repository to
green.

Reference execution, transport, shader assembly, GPU execution, renderer
installation, quantities, domains, and utilities are not moved as a single
layer sweep. Each survives at its current valid owner, moves into one feature
when exclusive, or receives a separately reviewed internal owner when shared.

**Exit condition:** every completed internal transaction has one justified
owner, no public export, no feature-private residue, and a green checkpoint.

### 7. Migrate Algorithm32 orchestration and application adapters

Move the public facade into the reviewed `algorithm32` implementation folder.
Move only its class-private closure with it. Rehome shared model, reference
execution, transport, shader assembly, runtime installation, and similar
mechanisms according to the Step 2 ownership decisions: inside
`implementation/algorithm32` when exclusively owned there, or outside
`implementation/` when they are genuine non-public cross-feature
infrastructure. Move Three backend and React/R3F implementations to their
selected caller-facing feature folders when they remain public selectable
implementations.

Publish the final `implementation/index.js` surface and update Flat32 and every
other external consumer to use it. External consumers may not deep-import an
implementation-private module.

**Exit condition:** every external runtime import uses an approved public
implementation export, while internal composition remains interface-driven
and contains no sibling-private dependency.

### 8. Reconcile current architecture and integration documents

Replace technical-layer path guidance in current documents with the completed
feature-implementation tree. Update:

- repository type, code, and JSDoc standards;
- Algorithm32 architecture boundaries and production README;
- package/application import guidance;
- the extraterrestrial production API ownership contract; and
- the extraterrestrial production integration plan and active-topic handoff.

Archive migration inventories and manifests after closure; current documents
retain only the final organization and active work.

**Exit condition:** one current document owns the final tree, all current links
and anchors resolve, and no current guidance names a retired technical-layer
path as an implementation owner.

### 9. Independent closure and production handoff

Independently reproduce:

- complete source-to-target coverage and final source identity;
- the exact public implementation export set;
- interface and `@implements` coverage;
- immediate-folder naming and feature-closure rules;
- zero caller-facing concrete implementations outside `implementation/`, and
  zero implementation-private files stranded in a shared internal owner;
- every executable file outside `implementation/` assigned to a reviewed
  non-public cross-feature responsibility;
- zero external deep imports, stale paths, duplicate owners, cycles,
  production-to-test edges, or experimental dependencies; and
- class-size, formatting, documentation, and naming conformance.

Run both type checks, the complete Node regression, Three/WebGL and Flat32 UI
browser lanes, Flat32 production and browser-test builds, policy integrity,
and `git diff --check`.

**Exit condition:** every gate passes, the previous technical-layer layout is
removed without compatibility artifacts, and extraterrestrial production
integration resumes at Step 3 against the new feature-owned paths.

## Required Transaction Gates

Every feature or internal source-moving transaction runs:

1. its focused behavioral and numerical specifications;
2. `npm run typecheck:algorithm32` and the Flat32 type check;
3. the exact repository formatter scope and `git diff --check`;
4. source/target coverage, stale-path, export, declaration, import, and cycle
   scans; and
5. the directly affected application or browser lane.

The final closure transaction additionally runs the complete
456-spec-or-later Node lane,
Three/WebGL, Flat32 UI, both Flat32 builds, policy integrity, public-export
closure, external-import closure, class-size, document-link, whitespace, and
newline checks.

## Explicit Non-Goals

- No extraterrestrial production behavior is implemented during this reorg.
- No retired Algorithm32-Star fixture, source, path, or evidence is restored.
- No numerical algorithm, physical formula, cache packing, shader contract,
  supported pairing, constructor behavior, or lifecycle policy changes.
- No old-path aliases, re-export bridges, duplicate trees, or old/new switches.
- No test asserts that a historical path, class, or variable name disappeared.
- No empty `star-field` or other speculative implementation folder is created.

## Completion Criteria

The reorganization is complete only when every current file has one accepted
feature owner, every public implementation is exported through
`implementation/index.js`, every behavioral implementation declares its
interface, every implementation's complete closure is colocated beneath its
feature folder, global API contracts contain no concrete implementation, every
remaining executable module outside `implementation/` has a justified
non-public owner, and every required production and application gate passes.

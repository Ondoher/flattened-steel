# Algorithm32 Reconciliation Plan

Status: complete on 2026-08-04. This document records the completed execution
sequence that brought the production `src/algorithm32` tree into the current
repository and Algorithm32 authoring standards. The detailed findings,
ambiguity register, exception log, and completion record are owned by the
[Algorithm32 Standards Reconciliation](../extraterrestrial/reconciliation.md).

## Scope And Guardrails

This plan changes production Algorithm32 code and its directly associated
Algorithm32 tests, type/build configuration, and current Algorithm32
documentation. Step 4.3 may also make only the path, named-import, and command companion
edits enumerated by the
[source-organization migration plan](./source-organization-plan.md): imports in
five live `src/flat32` modules, the M1 Native-48 direct-owner import repair,
five Algorithm32 Three Karma preprocessor keys, the now-invalid root
frozen-experiment study command, and current documentation. It does not
otherwise evaluate, copy from, modernize, change,
or depend on another application, experiment, archive, runner, fixture root
outside `src/algorithm32`, or generated output.

The completed A1 retirement batch was the earlier narrow exception to that
file boundary. It removed the Star-backed root commands, affected
`spec/support` Karma wiring, and now-unused path-pinned files under
`scripts/algorithm32-star/` and `evidence/algorithm32-star/` after their
production consumers were retired or recast. Neither that completed exception
nor the Step 4.3 companion edits authorize new Star implementation,
diagnostics, runs, or mutation of any retained experiment, archive, policy,
report, provenance record, or hash.

Preserve observable behavior throughout. A standards reconciliation is not
authority to alter numerical algorithms, physical contracts, runtime ownership,
or supported capabilities. Record any unavoidable behavior change as a
separate approved production decision before implementing it.

## Summary Sequence

The following is the dependency order. The implementation-sized work and its
completion evidence are defined in Detailed Execution Steps below.

### 1. Freeze the audit baseline

Record the current `src/algorithm32` identity, the type-check result, the
incomplete 120-second Jasmine baseline, and the source-file inventory. Do not
treat the inherited baseline as an exception to a newly adopted standard.

### 2. Resolve audit decisions before broad edits

Apply the resolved A1 through A3 decisions in the reconciliation ledger:
retire all Star conformance material, retain the documented JSON
classifications, and grant no test-support size exception. No rename, deletion,
or generated-file treatment proceeds without its recorded disposition.

### 3. Reconcile validation boundaries

Build an ingress map for public Algorithm32 configuration, renderer attachment,
fixture/policy parsing, and browser capability inputs. Retain semantic checks
for supported values, finite physical quantities, resource limits, lifecycle,
and real environment capabilities at those entries.

Classify the 72 non-test modules that contain runtime validation patterns. A
check remains only when that map identifies its value as an external ingress or
an operating-environment/lifecycle capability. Ambient contracts own JavaScript
object shape, required members, unions, and assignability.

Remove or relocate confirmed unneeded validation:

- the test-only `assertDenseScalarArrayLayout()` and its
  `assertImmutableDescriptorRecord()` descriptor-shape path;
- source-shape assertions in `_tests/scaffold.spec.js`; and
- repeated downstream object/member checks in `Reference`, `SpectralCalculator`,
  `CanonicalAtmosphere`, and geometry code once the ingress map proves the
  values are trusted.

The initial audit found no confirmed missing semantic check. Add one only when
the ingress map proves a semantic fact can enter unchecked; static object shape
and assignability remain ambient/JSDoc responsibilities.

### 4. Apply JSON classification; reconcile format, filenames, and constants

The root now adopts Prettier 3.9.6 with the repository configuration in
`.prettierrc.json`. The complete 237-file Algorithm32 JavaScript, JSX, and
ambient-declaration surface has been formatted with tabs and required
semicolons; checked JSON and Markdown remain outside that code-formatting
scope. The 15 former camelCase non-class files now use kebab-case, and all
current production imports and current-path documentation follow the renamed
modules. The resolved JSON classification and its retention or retirement
disposition are fully applied. The 12 former `Object.freeze` calls in
`atmospheres/consts.js` are removed; the two pass maps use explicit readonly
JSDoc contracts with unchanged literal contents.

### 5. Reconcile module structure and file size

The duplicate class exports are removed, the former over-limit specification
is split, and the Star harness is retired. The complete 245-file
[source-organization migration plan](./source-organization-plan.md) now assigns
every current path one owner and target. Move code through its M1-M11
dependency-safe batches, then split the five over-limit production classes in
their resulting owner folders and reconcile utility, namespace, factory,
profile, helper, type, and constant placement as each affected module moves.

### 6. Reconcile ambient types

Move interface declarations into nearest `types.d.ts` files, place class API
contracts in `types.d.ts` and class-internal contracts in their dedicated class
type file, remove `import(...)` expressions, name each string union, and
replace all inline complex parameter/return shapes. Update consumers directly;
do not add compatibility aliases.

### 7. Reconcile JSDoc and physical-data expression

Document every type, function, method, callback, generator, constructor,
accessor, error, and asynchronous outcome under the current JSDoc rules.
Use the canonical conservative unit-bearing-name inventory; retain only
documented normalized locals, shader bindings, and unit-explicit computational
operations, converting each durable contract to a neutral property carrying a
unit-bearing value with the required physical metadata.

### 8. Replace unclear short variable names

Rename unclear short bindings across the complete Algorithm32 source and
support surface. Retain the standard and unambiguous contextual conventions
owned by the code standard, plus externally documented formula symbols whose
original notation is clearer than a descriptive replacement.

### 9. Verify every coherent set and close

After each coherent change set, run the affected Algorithm32 type and behavior
gates. Before closing, complete the Node, build, browser, lifecycle, and
document-consistency baselines that the ledger requires. Mark the ledger
complete only when every work item and ambiguity is resolved and no unaccepted
exception remains.

## Detailed Execution Steps

The ledger remains the evidence owner. For every implementation batch, record
the affected paths, standard, focused verification command, and completed
result before moving to unrelated work.

### 0. Baseline and evidence

Status: complete on 2026-08-01. The committed source identity, inventory,
standard-scan baseline, type-check result, bounded Jasmine timeout, completed
507-spec Jasmine run, and batch verification record are recorded in the
reconciliation ledger.

#### 0.1 Preserve the before state

Retain the source inventory, type-check result, incomplete Jasmine result, and
scan counts as the before state. An inherited implementation or prior result is
not an exception to a standard.

Complete when the ledger identifies the command, date, outcome, and inventory
used to compare every later batch.

#### 0.2 Record each implementation batch

Identify affected public contracts, numerical paths, fixtures, and lifecycle
behavior before editing. Run focused checks after editing; a failure or timeout
remains open until a completed result supersedes it.

Complete when every implemented batch has its paths, commands, and outcomes
recorded. An unrelated earlier result is not evidence.

### 1. Finish inventory and resolve prerequisites

#### 1.1 Categorize every scoped file

Status: complete on 2026-08-01. The 285-file category, subsystem-owner, and
surface classification is recorded in the
[Algorithm32 reconciliation inventory](./reconciliation-inventory.md).

Classify each scoped file as production implementation, ambient declaration,
test/specification, browser/harness support, fixture/policy, build/type
configuration, or current documentation. Record owner and public-contract
status.

Complete when R1 has a file-by-file classification and no scoped file is
uncategorized.

#### 1.2 Implement A1: retire Star references

Status: complete on 2026-08-01. Retired the Star fixtures, policies,
provenance, browser harnesses, tests, two Karma configurations, six root
commands, 66-file bridge, and evidence capsule. The retained native N4
CPU/GPU oracle now has production-owned identities; type checking and the
472-spec Node regression pass. The detailed retirement map and evidence are in
the reconciliation ledger.

No Algorithm32-Star reference remains an approved production-conformance
bridge. Map every path, name, provenance string, fixture, policy, browser
suite, Karma entry, and root command to its retirement action. Retire Star-fed
tests, or recast a retained test with an independent production-owned oracle.
Archive historical provenance rather than retaining it in production fixtures,
contracts, or executable assertions; do not create new runtime dependencies on
the archive.

First retire or recast all production consumers and verify no active command,
Karma configuration, or regression test can load Star evidence. Then remove
the path-pinned bridge and evidence capsule under the retirement condition.

Complete when scoped scans find no Star fixture, policy, provenance, harness,
command, Karma wiring, or production regression dependency; retained tests use
only production-owned inputs and oracles; and the evidence-index retirement
removal is recorded. A1 is already decision-resolved; this step closes its
implementation.

#### 1.3 Apply A2: JSON classification

Status: complete on 2026-08-01. Step 1.2 retired eight Star-derived JSON
records; Step 1.3 retired the empty source registry, its registry-only ambient
types, and its source-shape scaffold specification. Four classified JSON files
remain: `jsconfig.json`, the analytic fixture, the production parity policy,
and the native N4 oracle.

Apply the recorded producer, consumer, source-of-truth, regeneration, and
retention facts. Preserve the configuration file and classified non-Star
fixtures; retire the eight Star-derived files through A1; then retire the
empty source-registry scaffold and its source-shape test.
Agent-authored files are not generated files.

Complete when every file matches its recorded classification, no retired Star
JSON remains in the production scope, and all retained readers pass focused
verification. A2 is decision-resolved and implementation-complete.

#### 1.4 Apply A3: test-support size

Status: complete on 2026-08-01. Step 1.2 retired
`StarGroundGpuParityHarness.js`. The 1,186-line ShaderBuilder specification
is now three cohesive files: a 371-line assembly specification, a 379-line
runtime specification, and a 480-line shared `ShaderBuilderTestSupport`
namespace.

Retire StarGroundGpuParityHarness under A1; it receives no split work and no
exception because it is not a retained production test-support module. Monitor
shader-builder.spec and split it before it exceeds the 1,200-line warning
boundary.

Complete when the Star harness is retired, the specification remains below the
warning boundary or is split, and no test-support size exception is recorded.

### 2. Reconcile validation and descriptors

#### 2.1 Build the ingress map

Status: complete on 2026-08-01. The reconciliation ledger identifies one
validation owner and explicit semantic-check list for public configuration,
physical models, renderer attachment, Three/WebGL capabilities, cache/runtime
lifecycle, React/Three adaptation, and every retained JSON reader.

Map each public configuration, model/source/geometry constructor, renderer
attachment/build input, fixture/policy parser, and browser/WebGL capability
boundary. Record its supported-value, finite-physical-value, resource,
lifecycle, and environment-capability checks.

Complete when every external boundary has one validation owner and an explicit
semantic-check list.

#### 2.2 Classify the validation inventory

Status: complete on 2026-08-01. The
[validation candidate inventory](./validation-inventory.md) records all 72
executable candidates as keep semantic, keep environment/lifecycle, mixed,
rehome/remove, or no-local-check. No missing semantic ingress validation was
found.

Classify all 72 candidates as ingress semantic validation,
environment/lifecycle capability validation, or removable downstream JavaScript
type/shape/member/union validation. Classify descriptor use separately;
descriptor metadata cannot validate executable behavior.

Complete when every candidate has a disposition, owner, and rationale in the
ledger.

#### 2.3 Remove known invalid validation paths

Status: complete on 2026-08-01. Removed the test-only
`assertDenseScalarArrayLayout()` API, its structural metadata-copy tests, and
the unused `assertImmutableDescriptorRecord()` descriptor assertion. The
factory retains all caller-ingress validation and construction of the
unit-bearing, content-addressed descriptor. Algorithm32 type checking and the
460-spec Node regression pass.

Remove or relocate assertDenseScalarArrayLayout and
assertImmutableDescriptorRecord after retaining genuine factory-ingress
behavior at the factory. Retire or replace source-shape assertions in
_tests/scaffold.spec with behavior-focused tests and the audit record.

Complete when tests no longer validate source layout, neither assertion API has
a production validation role, and focused checks pass.

#### 2.4 Remove confirmed downstream revalidation

The [method-level Step 2.4 analysis](./validation-reconciliation-analysis.md)
Status: complete on 2026-08-01. The method-level analysis defined three
independent batches. Batch 2.4.1 removed trusted Reference/SpectralCalculator
shape checks while retaining interval, cache, packet, unit, and basis
semantics. Batch 2.4.2 removed trusted CanonicalAtmosphere shape checks while
retaining its physical configuration semantics. Batch 2.4.3 removed the Flat
descriptor path and the named internal geometry request/member checks while
retaining physical boundaries, resource limits, and numerical-degeneracy
handling.

Trace Reference, SpectralCalculator, CanonicalAtmosphere, and geometry checks
to the ingress map. Remove only repeated contract-shape checks; retain
semantic and lifecycle checks at their owning boundary.

Complete when every retained check has an ingress/capability/lifecycle owner,
removed checks have focused coverage, and any newly found semantic gap is
addressed only at ingress.

#### 2.5 Analyze remaining validation candidates

Status: complete on 2026-08-01. The
[method-level validation analysis](./validation-reconciliation-analysis.md#step-25-remaining-candidate-dispositions)
traced every remaining **Mixed** or **Rehome/remove** candidate. It found
three bounded follow-up batches: one unused structural assertion API, trusted
internal shader-composition handoffs, and type/shape-only guards at typed
configuration and adapter boundaries.

Complete when each remaining candidate has a method-level owner/disposition,
all newly confirmed redundant checks have their own implementation batch, and
no undocumented module-level candidate is implied to be reconciled.

#### 2.6 Retire the unused CPU field assertion API

Status: complete on 2026-08-01. Removed
`assertCpuDirectionalSpectralField()`, its cache barrel export, and its
assertion-only expectation. The `CpuDirectionalSpectralField` storage,
finite-scalar, offset-bound, and mutable/sealed lifecycle checks remain. Type
checking and the 460-spec Node regression pass.

Remove `assertCpuDirectionalSpectralField()` from its helper module, public
barrel export, and assertion-only test expectation. Preserve the field's
storage, offset, finite-scalar, and mutable/sealed lifecycle checks.

Complete when production has no structural CPU-field assertion API, the barrel
does not export it, and field behavior coverage passes.

#### 2.7 Reconcile trusted shader-composition handoffs

Status: complete on 2026-08-01. Retired the collection-normalization module
and removed repeated dependency, request, setup, descriptor, configuration,
Color-member, validator, and contribution-shape checks from the trusted shader
handoffs. Retained shader contribution construction, compatibility, symbol
conflict, deterministic assembly, viewport/resource, cancellation, and
disposal behavior. Type checking and the 453-spec Node regression pass.

Remove repeated type/shape/member/array checks from `ShaderBuilder`,
`Algorithm32ShaderAssembler`, `shaderCollectionValidation`, and
`ShaderDescriptorBuilder`, whose production callers are the accepted facade
and shared-model path. Retain shader contribution construction, compatibility,
symbol conflict, deterministic assembly, viewport/resource, cancellation, and
disposal semantics.

Complete when these internal handoffs trust their ambient contracts, tests no
longer assert rejected internal shapes, and shader behavior and full Node
regression gates pass.

#### 2.8 Reconcile typed configuration and adapter shape checks

Status: complete on 2026-08-01. Removed typed configuration, callback-packet,
RGB-tuple, scene/camera/renderer, cache-option, request-record, local-source,
and React viewport shape wrappers. `Algorithm32.js`,
`local-sun-cache-plan.js`, and `SpectralModel.js` were reviewed and already
trusted their typed contracts without a removable wrapper. Physical values,
supported options, Three capabilities, resource bounds, and lifecycle checks
remain. Algorithm32 type checking and the 450-spec Node regression pass.

Remove type/shape-only wrappers from the facade, display model, scene capture,
cache plans, light-source request helpers, local source, spectral model, and
React adapter. Retain each named physical, supported-value, resource,
environment-capability, and lifecycle check listed in the method-level
analysis.

Complete when every retained check has that semantic owner, no removed guard
merely re-proves an ambient contract, and focused plus full regression evidence
passes.

#### 2.9 Retire descriptors and justify assembly declarations

Status: complete on 2026-08-02. Steps 2.9.1 through 2.9.5 and every required
closure gate pass. All of Step 3, Steps 4.1-4.2, and Step 4.3.1 are also
complete; Step 4.3.2 batches M1-M11, Step 4.3.3, and Steps 4.4.1-4.4.3 now
pass. Step 4.5 is the current work item.

This plan owns the Step 2.9 decision and execution sequence. The
[descriptor reconciliation analysis](./descriptor-reconciliation-analysis.md)
owns the supporting consumer trace and completed evidence.

All Algorithm32 descriptors retire. Do not preserve a descriptor through a
rename, alias, wrapper, compatibility reader, or descriptor-shaped replacement.
Identity, hashing, copying, provenance, diagnostics, validation, and public
snapshots do not by themselves justify a replacement object.

A **manifest** is a provider's declaration of what it exports and what it
requires. It is justified only when all of the following are true:

1. A consumer must assemble or configure something from a provider.
2. That provider cannot be assumed at the assembly boundary; providers are
   substitutable or otherwise selected independently of the consumer.
3. The consumer actually reads the provider's declared exports and
   requirements to perform that assembly or configuration.

When any condition is false, use the executable owner or a direct typed
request, result, plan, handle, identity, or capability contract. A known typed
collaborator does not need a manifest. A manifest is not an owner snapshot,
configuration copy, content hash, fingerprint, compatibility tag, provenance
record, diagnostic record, validator, cache key, or executable implementation.
Do not add a nested `.manifest` when the provider object already is the
assembly declaration.

The current inventory requires manifest behavior at exactly two boundaries:

| Assembly boundary | Direct provider declaration consumed by the assembler | Decision |
| --- | --- | --- |
| Shader assembly | `ShaderContribution` supplies `provides`, `requires`, source blocks, uniforms, textures, and binding requirements. | Retain `ShaderContribution` as the direct assembly declaration. Rename descriptor-named uniform/texture records to direct declarations; do not add or retain a shader descriptor or nested manifest. |
| Cache-pass assembly | `CacheBuildModule` supplies `provides`, `requires`, shader blocks, and bindings. | Retain `CacheBuildModule` as the direct assembly declaration, including its actively consumed deterministic module content identity; do not add or retain a cache-module manifest wrapper. |

No current production `*Manifest` object meets the manifest criterion. Retire
the current named manifest modules and ambient types according to this map:

| Current contract | Why it is not a manifest | Direct disposition |
| --- | --- | --- |
| `PositionDomainManifest` and `DirectionDomainManifest` | Geometry, source, and cache code receive known executable domain owners. No provider-neutral assembler discovers a domain from declared requirements. | Keep domain IDs and the directly consumed nodes, vectors, weights, frames, stencils, resolvers, and counts on their executable owners or direct selection contracts. |
| Dense/scalar-array and texture layout manifests | CPU packers and the GPU backend are known collaborators that directly consume packing or storage facts. | Keep addressing on the CPU packing owner and allocation shape in direct `CacheFieldStorage`; remove layout snapshots and manifest identity. |
| `DirectionalSpectralFieldManifest` | Field construction and cache execution receive a selected field contract directly. No unknown provider is assembled from its requirements. | Use direct field ID, storage, packing, and physically required provenance/compatibility facts only at their consuming boundary. `CacheFieldSpec` remains the direct allocation request. |
| `ScatteringCacheManifest` | Cache consumers already receive the executable cache provider or build result. They do not assemble it from declared requirements. | Return direct cache result, runtime bindings, resources, diagnostics, and lifecycle behavior. Do not expose a second cache-part declaration. |
| `CacheManifestIdentity` | Reuse identity compares direct executable inputs; identity is not an assembly declaration. | Rename or reduce it to a direct cache reuse identity derived from the build plan and demonstrated source/backend reuse facts. |
| `BLACK_GROUND_BOUNDARY_IDENTITY` inside `ScatteringCacheManifest.js` | Omitted reflective ground is a direct cache selection fact, not a manifest or content-addressed object. | Relocate the selection fact to its cache/ground owner. Use direct absence or owner ID semantics and remove the synthetic `contentHash: "omitted-black-ground"`. |
| `LocalSunShellFactDescriptor` or a proposed shell-fact manifest | The local-Sun cache directly consumes executable shell facts; no provider is discovered or configured from declared requirements. | Remove the descriptor without replacement. Use a direct source/owner ID for resource naming and each `CacheData` value's own identity for content; retain the shell arrays, bounds, lookup behavior, and resource use. |
| Native-profile domain descriptor references | No production consumer uses the copied position/incoming/outgoing domain identities to select or assemble a provider. | Remove the profile references and their types/tests. Add a direct selection ID later only if an active consumer is first demonstrated. |
| `ShaderUniformDescriptor` and `ShaderTextureDescriptor` | Their values are actively consumed as uniform and sampler declarations within `ShaderContribution`; the records are not diagnostic descriptors. | Rename their types/factories to direct `ShaderUniformDeclaration` and `ShaderTextureDeclaration` contracts without changing assembly behavior. |
| `SelectedCacheContract` | It is test-only metadata, not a provider declaration used by production assembly. | Remove it and construct direct typed test fixtures around the behavior under test. |

`CacheBuildPlan`, `CacheFieldSpec`, `CacheRuntimeBinding`, and
`CacheGpuCapabilities` remain direct executable plan, allocation request,
backend-handle mapping, and measured-capability contracts respectively. None is
a manifest.

Canonical copy or hash operations receive no blanket descriptor replacement.
Delete descriptor-only clone, copy, and hash operations when their consumers
retire. Retain or re-home an operation only after tracing an active executable
consumer, such as physical spectral compatibility/provenance or cache
plan/module/data reuse. The consuming physical or cache owner defines the
identity inputs; a generic helper must not recreate an owner snapshot or a
manifest-shaped identity packet.

`CacheBuildModule.contentHash` currently has active executable identity
behavior: it breaks otherwise equal deterministic module-order ties and feeds
pass, plan, and owner reuse identities. Preserve that behavior using the
module's direct assembly declaration as the hash input. Likewise, retain a
`CacheData` content identity where executable value reuse or provenance
consumes it. Neither fact justifies a manifest.

Preserve numerical behavior, unit-bearing physical data, spectral-basis
compatibility, cache storage and packing, shader required/provided symbol
validation, deterministic source assembly, resource limits, cancellation, and
disposal. Complete Step 2.9 only when every descriptor is removed, the current
named manifests are gone, the two direct assembly declarations remain
executable, and all required gates pass.

##### 2.9.1 Inventory descriptor consumers and replacements

Status: complete and decision-corrected on 2026-08-02. The initial inventory
correctly found the consumers but treated several known-provider direct
contracts as manifest candidates. The provider-unknown assembly test above
supersedes that classification. No current `*Manifest` survives; only
`ShaderContribution` and `CacheBuildModule` retain manifest behavior as their
existing direct assembly declarations.

Complete when every descriptor and current manifest path has the direct
contract, assembly-declaration, or removal disposition recorded above.

##### 2.9.2 Reconcile cache and domain contracts

Status: complete on 2026-08-02. `CacheConstructionOptions` remains the direct
transport-interval and maximum-scattering-order contract. The rejected
descriptor-to-manifest intermediate was rolled forward completely into
executable domain owners, packing owners, direct field/storage specifications,
direct cache artifacts, and plan/controller reuse identities. No compatibility
alias or wrapper remains.

The completed direct-contract migration:

1. Remove the production position-domain, direction-domain, directional-field,
   scattering-cache, dense-layout, and texture-layout manifest modules and
   ambient types; remove descriptor aliases rather than keeping bridges.
2. Pass executable domain owners or direct domain selections through geometry,
   source, cache construction, and tests. Remove the unused native-profile
   domain descriptor references; add a direct profile selection ID only after
   demonstrating an active consumer. Keep generator schema or revision only
   where the generator itself consumes it as input. Move
   `domainDescriptorSupport.canonicalZero()` onto
   `CubedSphereDirectionDomain` as class-private numerical support without
   losing signed-zero canonicalization.
3. Keep CPU addressing on the packing owners. Pass GPU allocation through
   direct `CacheFieldSpec` values containing field ID and `CacheFieldStorage`.
   Pass CPU field ID, packing, and physical provenance only where sampled.
4. Return executable CPU/GPU cache providers and direct build artifacts rather
   than `ScatteringCacheManifest`. Replace cache-pass shader naming inputs with
   direct field ID/storage facts.
5. Derive cache reuse from direct plan identity, backend capabilities, selected
   ground boundary, and demonstrated source-specific facts. Remove public
   construction-identity copies and manifest hashes. Preserve direct
   `CacheBuildModule` deterministic content identity and its module-order,
   pass/plan, and owner-reuse consumers.
6. Relocate the omitted-black-ground selection out of
   `ScatteringCacheManifest.js`; use direct absence or owner ID semantics and
   delete its synthetic `"omitted-black-ground"` content hash.
7. Remove `LocalSunShellFactDescriptor` and its `.manifest.identity` access.
   Use a direct source/owner ID for resource naming and each `CacheData` value's
   identity for content. Remove `SelectedCacheContract` and use local direct
   test fixtures.

Cache/domain focused suites, type checking, and the full Node regression pass.
The final integrated evidence is recorded under Step 2.9.5.

##### 2.9.3 Remove shader descriptors and owner snapshots

Status: complete on 2026-08-02. Shader assembly now receives live owners and
direct execution options. Uniform and texture declarations have direct names,
owner snapshots and aggregate hashes are gone, and controller reuse first
compares source/backend/scheduler ownership before plan reuse keys decide cache
reuse. The focused shader/provider suite passed 172 specs with zero failures.

Remove `ShaderDescriptorBuilder`, `Algorithm32ShaderDescriptor`, descriptor
sections, contribution fingerprints/tags, owner `describe()` snapshots, and
public descriptor snapshots with no active executable consumer. Pass live
owners and direct typed shader build facts instead. Retain `ShaderContribution`
as the provider-neutral assembly declaration consumed by the assembler. Rename
the actively consumed `ShaderUniformDescriptor`/`ShaderTextureDescriptor` types
and factories to direct `ShaderUniformDeclaration`/
`ShaderTextureDeclaration` contracts without changing their assembly behavior.

Controller reuse must follow direct ownership and executable reuse facts:
reuse a controller by source/backend/scheduler ownership identity, then let the
controller's build plan or reuse key decide cache reuse. Do not hash aggregate
owner snapshots to make that decision.

Complete when shader assembly has no descriptor builder, descriptor-driven
field, owner snapshot, fingerprint, or compatibility tag; contribution
requirements still drive deterministic assembly; controller/cache reuse uses
direct executable facts; and focused shader behavior passes.

##### 2.9.4 Remove residual descriptor support

Status: complete on 2026-08-02. Descriptor-only ambient declarations, tests,
factories, clone/hash support, terminology, test doubles, and current named
manifest surfaces are gone. Physical spectral identities and the actively
consumed cache value/module identities remain with direct owners.

Retire remaining descriptor-only ambient types, tests, factories, copy/hash
helpers, and terminology. Move `requiredString`, `positiveInteger`, typed-array
recognition, or another genuinely shared value operation only if a remaining
non-descriptor consumer demonstrates its cohesive contract. Keep physical
spectral and cache identity operations with their direct owners or a genuinely
shared non-descriptor utility; do not create a generic descriptor-replacement
identity layer.

Complete when no descriptor support remains, no current `*Manifest` type or
module remains, and every retained helper has a named direct consumer and
cohesive non-descriptor owner.

##### 2.9.5 Verify descriptor retirement

Status: complete on 2026-08-02. Type checking passes; the final complete Node
regression passed 426 specs with zero failures in 117.61 seconds; and the
Three/WebGL browser lane passed 5 of 5 specs, including Stage 10 scene
composition. Production source terminology, filename, and owner-snapshot
scans are empty. Direct assembly-declaration consumers remain active, current
normative documents agree, and `git diff --check` passes.

Run focused cache/domain and shader gates, `npm run typecheck:algorithm32`, the
complete `npm run test:algorithm32` Node regression,
`npm run test:algorithm32:three`, descriptor/manifest terminology and reference
scans, and `git diff --check`.

Complete when every gate exits successfully; no descriptor or unjustified
`*Manifest` path remains; `ShaderContribution` and `CacheBuildModule`
requirements remain actively consumed by their assemblers; and the plan,
analysis, active-topic checkpoint, and reconciliation ledger agree.

### 3. Reconcile formatting, names, and JSON treatment

Status: complete on 2026-08-02. Steps 3.1 and 3.2 completed the
formatter-backed tab and semicolon work, Step 3.3 renamed every remaining
ordinary camelCase module, and Step 3.4 was already satisfied by the completed
A2 JSON classification.

#### 3.1 Close the tab finding

Status: complete on 2026-08-02. The initial leading-space finding was the
conventional JSDoc star marker rather than code indentation. Prettier 3.9.6 is
installed as an exact root development dependency, and the root
`.prettierrc.json` configures tab indentation. All 237 Algorithm32 JavaScript,
JSX, and ambient-declaration files were formatted through explicit globs;
checked JSON and Markdown were deliberately excluded. The subsequent
formatter check, type check, 426-spec Node regression, 5-spec Three/WebGL
lane, and diff check pass.

Keep code and declaration indentation tab-based. The earlier finding matched
the conventional JSDoc star marker, not code indentation.

Complete when the scan reports zero leading-space code/declaration lines and
git diff --check succeeds.

#### 3.2 Apply adopted semicolon formatting

Status: complete on 2026-08-02. The user-authorized root Prettier adoption
supersedes the former manual-only constraint. The configured formatter applied
required semicolons across the same 237-file Algorithm32 code/declaration
surface. `prettier --check` passes; Algorithm32 type checking passes; the Node
regression passes 426 specs with zero failures in 81.583 seconds; and the
Three/WebGL lane passes 5 of 5 specs.

Use the adopted root formatter configuration for JavaScript, JSX, and ambient
declarations. Keep checked JSON fixtures/policies and Markdown outside this
formatting batch.

Complete when every candidate is corrected or documented as a non-required
statement boundary without introducing new formatting defects.

#### 3.3 Rename ordinary modules in dependency-safe batches

Status: complete on 2026-08-02. Renamed all 15 targets leaf-to-root in three
dependency-safe batches:

- `numeric-values.js`, `duration-values.js`, `stable-hash.js`,
  `spectral-basis-contract.js`, `spectral-bases.js`, and
  `spectral-numeric-kernels.js`;
- `cache-build-contracts.js`, `cache-runtime-contracts.js`,
  `geometry-coordinates.js`, `geometry-request-normalization.js`,
  `spectral-test-values.js`, `light-source-request-values.js`, and
  `three-lighting-support.js`; and
- `shader-contribution.js` and `shader-contribution.spec.js`.

All static imports, re-exports, tests, browser entries, and current-path
documentation now use the kebab-case paths. No declaration, package export,
Jasmine/Karma configuration, dynamic import, or `require()` pinned one of the
old filenames. The explicitly historical baseline inventory and isolated
experimental copies retain their own original paths and remain outside the
current production residual scan.

Type checking passed after every batch. The three focused Jasmine groups
passed 42, 131, and 26 specs with zero failures. Final Prettier and type checks
pass; the complete Node regression passes 426 specs with zero failures in
102.385 seconds; the Three/WebGL lane passes 5 of 5 specs; current production
and current-path document scans find no old filename or remaining ordinary
camelCase filename; and `git diff --check` passes.

#### 3.4 Apply A2 decisions

Status: complete on 2026-08-01 through Step 1.3. The four retained JSON files
match their recorded configuration, checked-fixture, and production-policy
classifications; the Star-derived records and empty registry were retired,
and the retained readers pass focused verification. Step 3 required no
additional JSON move or content change.

### 4. Reconcile module shape, ownership organization, constants, and size

Status: complete on 2026-08-04. Steps 4.1-4.5 are complete.

#### 4.1 Normalize class exports

Status: complete on 2026-08-02. Removed the redundant default aliases from
`DistantSunCache`, `DistantSunCacheController`, `CacheGpuExecutor`, and
`CachePassAssembler`. The two cache class declarations already exposed only
their named classes; the executor and assembler declarations lost their
matching default aliases. No consumer edit was required because every current
production, test, declaration, and browser consumer already used a named
import. The touched implementation and declaration class descriptions now use
noun phrases that state what each class is.

Each of the eight implementation/declaration modules now has exactly one
export: its named class. The focused cache, controller, geometry, and assembly
group passed 87 specs with zero failures. Type checking and Prettier pass; the
complete Node regression passes 426 specs with zero failures in 102.482
seconds; the Three/WebGL lane passes 5 of 5 specs; default export, default
import, default re-export, and export-count scans pass; and
`git diff --check` passes.

#### 4.2 Replace freeze-based constant contracts

Status: complete on 2026-08-02. Removed the two outer map freezes and ten
nested-array freezes from the now-final `atmospheres/canonical/consts.js`
owner. Both exported pass maps now use
`Readonly<Record<CachePassKind, readonly string[]>>` JSDoc contracts.
Their pass keys, string values, ordering, and distinct per-pass arrays are
unchanged. No consumer observes frozen state or mutates the maps; cache-module
construction copies both selected arrays before sorting and hashing them. The
touched constant descriptions now state what each value is.

The focused cache-construction group passed 17 specs with zero failures in
68.33 seconds. Type checking and Prettier pass; the complete Node regression
passes 426 specs with zero failures in 99.306 seconds; and the Three/WebGL lane
passes 5 of 5 specs after the initial sandboxed Chrome launch was denied with
`spawn EPERM` and the approved unsandboxed rerun succeeded. The production
JavaScript/JSX freeze scan is empty and `git diff --check` passes.

#### 4.3 Reorganize Algorithm32 by exclusive ownership

Status: complete on 2026-08-02. The
[canonical source-organization migration plan](./source-organization-plan.md)
completes the directional sketch with a 245-row current-to-target manifest,
eleven selected ownership decisions, M1-M11 dependency-safe batches, live
consumer/configuration edits, frozen-evidence treatment, and focused plus
final verification gates.

The resolved target keeps provider-neutral assembly separate from GPU
execution and renderer adaptation; keeps physical contribution construction
with atmosphere, geometry, light-source, ground, transport, and color owners;
and distinguishes atmospheric light-source behavior from independent solar
synchronization. Every interface and constant has a capability owner, so no
root `types/interfaces/` or root `consts/` bucket is created. No current code
justifies provider-named assembler placeholders, `extraterrestrial/shared`, or
`extraterrestrial/stars`, so those directories also remain absent. The source
plan is the sole owner of the final tree and path assignments.

##### 4.3.1 Produce the complete reorganization plan

Status: complete on 2026-08-02. The focused canonical
[Algorithm32 source-organization migration plan](./source-organization-plan.md)
inventories every current implementation,
ambient declaration, specification, browser entry, retained fixture or
configuration reader, barrel, type/build configuration, and current-document
path. Map each path exactly once and record:

- its current and target paths;
- its exclusive owner or nearest-common shared owner;
- its current consumers and allowed dependency direction;
- its class, ordinary-module, constant, interface, ambient-type, test,
  fixture, configuration, or documentation classification;
- the demonstrated reason for any `shared`, `utils`, `gpu-assembler`, root
  `types/interfaces`, or root `consts` placement;
- every import, re-export, type-check, Jasmine, Karma/browser, and current
  documentation path that must move with it; and
- its dependency-safe move batch and focused verification gates.

The plan must expand the directional tree to cover every current Algorithm32
owner omitted from the sketch, resolve every ambiguous owner and target
collision, define the assembler/provider and light-source/extraterrestrial
boundaries, and reconcile the target type and constant roots with their
standards before executing a move. It must sequence moves so Step 4.4 splits
the large classes only after their final owner paths are established. Do not
create compatibility re-exports, duplicate old and new trees, alias modules,
speculative barrels, or intermediate catchall directories.

The mechanical comparison reports 245 current paths, 245 manifest rows, 245
unique current paths, and zero missing, extra, or duplicate current paths.
Every proposed directory has mapped current code or a mapped ambient contract;
all target collisions are explicit split/merge contracts; and no ownership or
path decision remains implicit. The two former single-function utility owners
have explicit cohesive merge targets rather than receiving renamed standalone
modules. This planning substep changed no production path.

##### 4.3.2 Execute dependency-safe ownership moves

Status: complete on 2026-08-02. M1-M11 completed on 2026-08-02. Utilities,
quantities, executable domains, capability-owned ambient declarations, assemblers, cache
value/transport foundations, and shared CPU source-cache storage now occupy
their final owners. Cache execution, the Three/WebGL cache backend, cache
recurrence, spectral transport, the omitted-ground provider, and the analytic
fixture also occupy their final owners. Native-15 profiles, canonical
atmosphere, Bruneton color, and uniform-Lambertian ground occupy their final
owners with their cumulative declarations. The singular
shared/flat/spherical geometry tree and its Three endpoints also occupy their
final owners. Shared, distant-Sun, local-Sun, source-cache, Three-lighting,
fixture, and solar-synchronization code also occupies its final light-source
and extraterrestrial/Sun owners. The final
model/reference/rendering/facade runtime tree also occupies its selected
owners. The six-file React/R3F adapter tree also occupies its final owner.
M11 moved no source; it removed the invalid frozen-study package exposure,
updated the 14 current documents named by its contract, and removed 26
validated fileless legacy directories. The final tree contains exactly 268
files and no empty subtree. Every required M1-M11 gate passes, including the
M11 4-spec focused gate, both type checks, the exact formatter scope, the
429-spec Node regression, the 5-spec Three/WebGL lane, retained policy
integrity, the 3-spec Flat32 UI lane, and all manifest, static, document,
frozen-surface, whitespace, newline, and diff checks.

Move one coherent owner or shared boundary at a time according to the accepted
Step 4.3.1 map. Move implementation, declarations, tests, fixtures, barrels,
and directly associated current documentation together; update imports,
re-exports, type/build configuration, and Jasmine/Karma/browser paths directly.
Run focused behavior and type gates after each batch and broad gates after a
public, renderer, physical, or cross-owner boundary move.

Complete when every planned path occupies its final owner folder, every
consumer uses that path directly, and no compatibility or duplicate path
remains.

##### 4.3.3 Verify and close the reorganization

Status: complete on 2026-08-02 after the completed Step 4.3.2 M1-M11
migration. The independent read-only audit reproduced the exact 268-file tree,
245-row checkpoint manifest, 268 live targets, 26 intentional merge groups,
owner and class-export rules, 443/464 declaration totals, 577 resolved relative
clauses, zero runtime SCCs and forbidden edges, browser/Karma configuration,
fixture hashes, package state, frozen-surface state, and tracked/untracked
hygiene. A focused document audit then exposed and corrected seven archival
stub-anchor links, present-tense retired-Star authority wording, and one stale
pending-import claim. Its rerun resolves all 195 relative file links and 54
relative anchors, and `git diff --check` passes.

Run path, owner, empty-scaffold, duplicate-module, filename, export, type,
formatting, Node, Three/WebGL, build/configuration, current-document, and diff
checks. Confirm that every `shared`, utility, assembler, type, interface, and
constant placement has the owner and reuse evidence required by Step 4.3.1.

Complete when every gate exits successfully, the canonical organization plan
records the final paths and evidence, and the active checkpoint advances to
Step 4.4.

#### 4.4 Split every over-limit class by coherent responsibility

Status: complete on 2026-08-03 after the completed Step 4.3 organization
migration and audit. Steps 4.4.1-4.4.3 all pass their focused, broad, and
structural closure gates.

For FlatEarthGeometry, SphericalEarthGeometry, LocalSunLightSource,
DistantSunLightSource, and ShaderBuilder: after Step 4.3 establishes their
final owner folders, identify public/internal seams, extract one responsibility
at a time within that owner, reconcile its types and JSDoc in that batch, and
run focused numerical, lifecycle, and shader/runtime coverage.

Complete when each implementation is below 1,000 lines or has an accepted
exception with owner and removal condition. No extraction changes physical
algorithms, cache ownership, or public behavior without separate approval.

##### 4.4.1 Split the flat and spherical geometry facades

Status: complete on 2026-08-03.

Keep `FlatEarthGeometry` and `SphericalEarthGeometry` as the sole public
geometry entry points and retain every current getter and method as an
ordinary prototype member. Each facade continues to own normalized
configuration, its geometry-specific physical boundary and atmosphere-path
algorithms, and any facade-level diagnostics. Extract the following matched
internal responsibilities beneath each geometry owner:

- `FlatScatteringCacheGeometry` and `SphericalScatteringCacheGeometry` own
  construction positions, cache coordinate/frame/stencil transforms, cache
  build rays where applicable, and packed transport construction;
- `FlatGeometryCacheModuleProvider` and
  `SphericalGeometryCacheModuleProvider` own the exact direct
  `CacheBuildModule` declarations, including their source blocks, binding
  order, symbol declarations, IDs, and content identity;
- `FlatGeometryShaderContributor` and
  `SphericalGeometryShaderContributor` own the exact final-view
  `ShaderContribution` declarations; and
- `three/FlatGeometrySceneAdapter` and
  `three/SphericalGeometrySceneAdapter` own renderer-scene mapping, visual
  material and endpoint construction, ground projection, and scene-depth
  resolution beside their existing exact Three ground objects.

The two owner trees use matched roles and names so their architecture can be
read together, but they do not share executable implementations. Flat
plane/dome/local-source behavior and spherical radial/distant-source behavior
remain on their respective owners; similar method names alone do not justify
a new `geometry/shared` dependency. The collaborators are known typed
implementation owners, not descriptors, factories, or manifests. Only their
returned `ShaderContribution` and `CacheBuildModule` values have manifest
behavior at the existing provider-neutral assembly boundaries.

Move the bare Three imports and matching Karma preprocessing keys with the
two scene adapters. Preserve configuration normalization and reference
semantics, diagnostic order and limits, cache-domain object freshness and
reuse rules, floating-point evaluation and packing order, source strings,
symbol and binding order, content hashes, error timing, and every public
method default. Reconcile class and callable JSDoc on the moved code without
changing contracts.

Implement shader contributors, cache-module providers, scene adapters, and
scattering-cache geometry collaborators as independent extraction batches,
then verify the integrated facades. Complete when all ten geometry classes
export only their named class, every class implementation is below 1,000
lines, all relative imports resolve without a cycle, the old facade Karma
keys are absent, the two new scene-adapter keys are exact, and focused
geometry/cache, both type, formatter, full Node, Three/WebGL, and Flat32 gates
pass.

The two facades now delegate to the eight matched collaborators named above
without sharing flat/spherical executable physics. `FlatEarthGeometry` is 849
lines and its four collaborators are 636, 594, 484, and 355 lines;
`SphericalEarthGeometry` is 671 lines and its four collaborators are 422,
488, 379, and 760 lines. Every one of the ten class modules exports only its
named class. Class-only request and intermediate shapes occupy the nearest
dedicated class type files, while the shared public geometry surface owns the
named source-relative, scene-scale, and ground-offset request contracts.

The preflight comparison reproduces the exact flat and spherical public
prototype names, declaration order, defaults, and arities. It also reproduces
the exact shader-contribution, primary cache-module, packed-transport, all-pass
cache-module, and five per-geometry module-content hashes. The integrated
focused gate passes 98 of 98 specs; both type checks and the complete
Algorithm32 formatter scope pass; the full Node regression passes 429 of 429
specs in 97.816 seconds; the Three/WebGL lane passes 5 of 5; the Flat32 UI lane
passes 3 of 3; and policy integrity passes 1 of 1. Both browser lanes first
encountered sandbox `spawn EPERM`; their approved unsandboxed reruns passed.
All 613 relative clauses resolve, the 139-node production runtime graph has no
cycle, the combined Algorithm32/Flat32 ambient surface has 490 unique names
with no duplicate, the two scene-adapter Karma keys are exact, the old facade
keys are absent, and `git diff --check` passes. The live Algorithm32 tree now
contains 282 files, including the 14 class/type files added by this split.
The final independent read-only audit confirmed every runtime boundary,
prototype/default/arity, class export, line limit, dependency, and Karma fact.
It found three declaration-only placement/documentation defects; moving the
flat constructor collaborator to the public owner, moving the spherical mesh
union to its public owner, and completing one callback contract closed them.
Both type checks, formatting, declaration uniqueness, and the exact snapshot
pass after those corrections.

##### 4.4.2 Split both concrete light-source classes

Status: complete on 2026-08-03.

Split `LocalSunLightSource` and `DistantSunLightSource` by their demonstrated
source, cache, shader, and Three-lighting responsibilities without merging
the two supported source implementations or changing their public facades.

Both public facades now retain normalized configuration plus their direct
physical sampling and source-path behavior. Beneath each facade, matched
source-local collaborators own the extracted responsibilities:

- `LocalSunCacheProvider` and `DistantSunCacheProvider` own controller
  construction, direct cache modules where applicable, CPU cache construction,
  and source-specific recurrence orchestration;
- `LocalSunShaderContributor` and `DistantSunShaderContributor` own the exact
  final-view `ShaderContribution` declarations; and
- `three/LocalSunSceneLightingAdapter` and
  `three/DistantSunSceneLightingAdapter` own scene-light scaling, Three light
  construction, endpoint fill and shadow policy, and app-authored shadow-object
  configuration.

The matched roles do not share local/distant executable source behavior. Each
collaborator is a known typed owner, not a descriptor, factory, manifest, or
barrel. Only the returned direct `ShaderContribution` and `CacheBuildModule`
values retain manifest behavior at their existing provider-neutral assembly
boundaries. Three namespaces remain injected by the caller, so no Karma key
or browser-entry move is required.

The local facade is 262 lines and its cache, shader, and scene collaborators
are 203, 43, and 892 lines. The distant facade is 194 lines and its matched
collaborators are 537, 55, and 562 lines. All eight class modules export only
their named class and remain below 1,000 lines. Constructor-facing contracts
occupy the nearest owner `types.d.ts`; class-internal recurrence and Three
shapes occupy dedicated class type files; and the two local endpoint-policy
unions have one documented shared Three owner.

The exact pre-split public prototype order, kinds, defaults, and arities match.
All ten configuration/shader/direct-light/scene-scale/path hashes, all twelve
normalized cache-module hashes, all twelve direct module content hashes, and
every configuration, facade, shell-cache, source, contribution, controller,
and cache-source identity/freshness observation match. The combined focused
gate passes 157 of 430 specs; both type checks and the complete 287-file
Algorithm32 formatter scope pass; the full Node regression passes 430 of 430
specs; the Three/WebGL lane passes 5 of 5; Flat32 UI passes 3 of 3; and policy
integrity passes 1 of 1. Independent audits found only declaration-placement
and collaborator-wording defects, all corrected before the final type,
formatter, declaration, import, cycle, and snapshot reruns. The 295-file tree
has 518 unique combined Algorithm32/Flat32 ambient declarations, 627 resolved
relative clauses, 146 production runtime nodes, and zero duplicate ambient
names, runtime cycles, or cross-source sibling edges.

##### 4.4.3 Split ShaderBuilder

Status: complete on 2026-08-03.

Split `ShaderBuilder` by deterministic assembly preparation, renderer/runtime
installation, and lifecycle orchestration while retaining its public build
contract and exact shader assembly behavior.

`ShaderBuilder` remains the public build and cache-lifecycle coordinator.
`ShaderAssemblyPreparer` now owns explicit/automatic assembly selection,
transport symbol requirements, runtime GLSL declarations, provider
contribution collection, and deterministic assembler invocation.
`three/ShaderRuntimeInstaller` now owns binding resolution and live refresh,
scene-input capture, cache runtime binding installation, pass construction,
composer ordering, returned runtime hooks, and failure rollback. Source-cache
controller identity, reuse, asynchronous construction, ownership, and failure
cleanup remain on `ShaderBuilder` because they are the build lifecycle
transaction rather than deterministic assembly or renderer installation.

The three implementations are 320, 328, and 489 lines. Each class module
exports only its named class and contains no module-local class helper. The
five request-ingress helpers moved onto `ShaderBuilder`; the nine binding,
capture, uniform, composer, and cleanup helpers moved onto
`ShaderRuntimeInstaller`. Public assembly/configuration/result contracts remain
in `runtime/rendering/types.d.ts`, while installer-only intermediate types
occupy `three/types/ShaderRuntimeInstaller.d.ts`. No factory, descriptor,
manifest, barrel, compatibility alias, or Karma key was added.

The exact public `ShaderBuilder` constructor/getter/method surface and arities
match the pre-split checkpoint. Direct assembly retains source hash
`fnv1a32:66f47b06` and fragment SHA-256
`sha256:ddd6b8e2fdffa4629b9b117108356e68861d9ec51635dd233327ce67270b1be5`;
automatic configured-model assembly retains source hash `fnv1a32:2d516ab4`,
fragment SHA-256
`sha256:84fd67faf221dde5e2829fd58f6e34ba63eb9b63852e65a48549f84be8826f19`,
and exact runtime/geometry/light/atmosphere/cache/transport/color contribution
order. Controller reuse remains exact by source, backend, and scheduler object
identity, and runtime installation retains cache-binding, capture-before-pass,
removal, and disposal order.

The combined focused gate passes 21 of 430 specs after the cross-provider
assembly fixture moved from the retired private builder method to the new
preparer's public assembly surface. Both type checks and the complete 290-file
Algorithm32 formatter scope pass. The full Node regression passes 430 of 430
specs in 101.24 seconds; the Three/WebGL lane passes 5 of 5; Flat32 UI passes
3 of 3; and policy integrity passes 1 of 1. Both browser lanes first
encountered sandbox `spawn EPERM`; their approved unsandboxed reruns passed.
The 298-file tree has 526 unique combined Algorithm32/Flat32 ambient names,
634 resolved relative clauses, 148 production runtime nodes, zero duplicate
ambient names or runtime cycles, zero over-limit class files, and passing
syntax, export, helper, residual, whitespace, newline, and diff checks.

#### 4.5 Reconcile helper ownership as code moves

Status: complete on 2026-08-04. Steps 4.5.1-4.5.6 and all helper-ownership
closure gates pass.

Audit the settled tree after Steps 4.3 and 4.4. First decide whether each
helper belongs outside its class: its inputs, outputs, semantics, and lifecycle
must demonstrate broad applicability independent of that class's
responsibility. Purity, similar naming, a possible future consumer, or a
namespace needing another method does not meet that threshold. Class-specific
support stays on its class. For the operations that do qualify, favor
namespace-style modules by collecting methods with a similar domain under
their nearest cohesive namespace owner rather than leaving them distributed
across ordinary function modules. Each namespace remains one named export and
must not absorb unrelated methods. Evaluate every existing multi-function
module at the function level: current co-location is not proof of common
ownership. Move each qualifying function into an existing namespace when its
domain matches, or collect it with other qualifying functions in a new
cohesive namespace. An existing ordinary module may therefore split across
several namespace owners. Introduce no single-function module. Remove factories
without independent lifecycle or reusable orchestration; profiles remain
caller-supplied typed options with documented defaults and paper differences.

Complete when every helper has a clear owner, every extracted helper has a
broadly applicable class-independent contract, reusable similar-domain methods
are consolidated into cohesive existing or new namespaces, every exported
function in an ordinary multi-function module has been classified separately,
every surviving ordinary utility has a contract that would be misstated by a
namespace, and no prohibited module or factory shape remains.

##### 4.5.1 Inventory helpers and exported operations

Status: complete on 2026-08-03. This was a read-only inventory and
classification-input step; it changed no implementation path or behavior.

Inventory every production class support method, production module-local
function, exported function, namespace method, factory, and profile. Include
an exported test-support operation when it is reused outside its own
specification. For each symbol, record its current path and form, owner and
domain, consumers, inputs and outputs, dependence on class state or lifecycle,
and whether another module currently uses its contract.

Complete when every scoped helper and exported operation appears exactly once,
every current multi-function module has all of its exports listed separately,
and the inventory has no untraced consumer or implicit owner.

The canonical [helper-ownership inventory](./helper-ownership-inventory.md)
covers all 148 production JavaScript/JSX modules at source identity
`4aeeb00102d4713f3f31f219cdf9d71092a64d241279fd7e60411f0e84e090af`.
Its three mutually exclusive appendices record 697 production operations;
three exported profile values and eleven reused test-support operations bring
the complete classification input to 711 authoritative rows. All 24
multi-export function modules list every export separately. Consumer tracing
is explicit for every row, including the sole operation with no current
consumer, `sourcePathLimitDistanceToMeters`. No production source changed.

##### 4.5.2 Classify class-independent applicability

Status: complete on 2026-08-03 after Step 4.5.1 completed.

Classify every inventory row before designing a target. Keep support on its
class, or return it to that class, when its contract is specific to the
class's responsibility, state, lifecycle, or collaborator transaction. Mark a
function as independently reusable only when its inputs, outputs, semantics,
and lifecycle demonstrate broad applicability across class boundaries. Purity,
similar naming, possible future reuse, and namespace population are not
sufficient evidence.

Complete when every row has one recorded keep-on-class, return-to-class, or
class-independent disposition with rationale, and no extraction decision is
based only on implementation convenience or hypothetical reuse.

The canonical
[helper-ownership classification](./helper-ownership-classification.md)
assigns all 711 authoritative rows exactly once: 286 `keep-on-class`, 211
`return-to-class`, and 214 `class-independent`. Of 290 class operations, 286
remain on their classes; the four independently reusable class-support
methods have demonstrated equivalent current contracts across owner
boundaries. Every return row names an existing class. All 24 multi-export
modules were decided function-by-function, including two mixed-disposition
modules. The 95 construction-shaped candidates and ten profile operations or
values are classified without pre-deciding Step 4.5.5. No production source,
path, export, declaration, or behavior changed.

##### 4.5.3 Build the namespace ownership plan

Status: complete on 2026-08-03. This substep planned targets and batches
without changing production code.

Assign each class-independent operation to its nearest cohesive domain owner.
Prefer an existing namespace when it already owns that domain. Otherwise,
create a new namespace only when several qualifying methods form a genuine
method-set contract. Evaluate every existing multi-function module at the
function level and distribute its exports across existing or new namespaces
when their domains differ. Record any ordinary utility that must survive and
why expressing its contract as namespace methods would be inaccurate.

For every move, record the target path and namespace symbol, method name,
affected imports and call sites, declarations and JSDoc, dependency direction,
focused behavior coverage, and execution batch. Do not plan a compatibility
alias, duplicate export, speculative barrel, single-function module, or
unrelated namespace grouping.

Complete when every Step 4.5.2 disposition has exactly one final owner, every
target collision and multi-function split is explicit, and all migration
batches and focused gates are defined.

The canonical
[helper-ownership target plan](./helper-ownership-target-plan.md) and its four
appendices assign all 711 identities exactly once at the unchanged source
identity. They select 20 cohesive namespace modules, return private support to
instance methods while reusing recorded public class contracts, retain the
ordinary algorithm/component/profile/test owners, resolve all 24 multi-export modules
and seven row-to-row target consolidations, and remove only
`sourcePathLimitDistanceToMeters`. The distant CPU cohort has a size-safe
provider plus two configured evaluator owners; all physical and runtime
receiving classes project below 1,000 lines. All 95 production construction
candidates defer callable form with their inseparable cohorts, while the two
additional profile operations, three profile values, and ten supplemental
test-only construction rows remain separately accounted for in Step 4.5.5.
Exact row, source-identity, construction, collision, namespace, size,
document-hygiene, link, type, and diff gates pass. No production or test
source, path, export, declaration, or behavior changed.

##### 4.5.4 Execute namespace migrations

Status: complete on 2026-08-04.

Execute one dependency-safe domain batch at a time. Move class-specific
support onto its class and consolidate qualifying operations into the selected
existing or new namespaces. Update imports, call sites, declarations, JSDoc,
tests, and directly affected current documentation without compatibility
re-exports or temporary paths. Preserve call order, defaults, numerical
evaluation, identity, allocation, lifecycle, error timing, and public behavior.

After each batch, run its focused behavior gate, Algorithm32 type checking,
the complete Algorithm32 formatter check, exact old-owner and export scans,
relative-import and cycle checks, and `git diff --check`. Also run Flat32 type
or browser gates whenever the batch changes a contract or path they consume.

Complete when every accepted move occupies its planned owner, every consumer
uses the new namespace directly, no retired helper path or duplicate export
remains, and every batch gate passes.

All 89 immediate rows are complete: 20 foundation rows, 51 physical rows,
and 18 runtime rows. Ten cohesive namespace owners now hold their complete
Step 4.5.4 method sets; 31 class-specific rows returned to their classes; and
the sole unused `sourcePathLimitDistanceToMeters` export was removed. Six
superseded ordinary modules were deleted without compatibility exports. The
two-method pixel-default seam remains exactly where planned for `FC6`, and no
Step 4.5.5 construction, profile, `PixelMath`, or R3F owner was implemented
early.

The live tree contains 303 files, including 295 JavaScript, JSX, and ambient
declaration files. Focused batch gates pass, both type checks pass, the
complete formatter scope passes, and the full Node regression passes 438 of
438 specs in 90.188 seconds. The Three/WebGL lane passes 5 of 5, Flat32 UI
passes 3 of 3, and policy integrity passes 1 of 1. All ten namespaces have
one named namespace export, all retired paths and symbols have zero current
source references, all relative imports resolve across 152 production
modules, runtime cycles remain zero, and all 52 classes remain below 1,000
lines with a largest current class of 887 lines. Whitespace, final-newline,
and diff checks pass.

##### 4.5.5 Reconcile factories and profiles

Status: complete on 2026-08-04.

Remove a factory unless construction has an independent lifecycle or reusable
orchestration contract. Update its consumers directly rather than retaining a
factory alias or wrapper. Verify each retained profile is a named type with one
documented default, caller-supplied overrides, every relevant configurable
option, and explicit differences from the paper or reference configuration it
represents.

Complete when every factory and profile has an explicit disposition, no
unjustified construction layer remains, retained profiles satisfy the complete
typed-default contract, and focused plus affected broad behavior gates pass.

All 264 gated rows are complete: 57 foundation, 115 physical, 78 runtime,
and 14 profile/test-support rows. All 157 non-deferred rows occupy their exact
planned owner and symbol. Of 95 production construction candidates, 80 survive
with demonstrated lifecycle, allocation, reusable orchestration,
cohesive-namespace, inseparable-algorithm, or typed profile-construction
contracts; 15 identity wrappers or one-shot callables were removed. The two
additional profile acceptance operations remain private to their owner, and
all ten test construction rows remain test-only. Thirty-seven superseded paths
are absent with zero current source references. No compatibility alias,
duplicate factory path, unsupported ordinary factory module, descriptor, or
manifest remains.

Native-15 now has one typed default: 15 view-path intervals, 20 source-path
transmittance intervals, 15 cache-transport intervals, scattering through
order 4, and no reflective ground. Its override contract includes every
configurable selection and documents fixed facts, runtime-owned exclusions,
and direct-40 paper differences. The basis/source identities remain exact;
the complete default profile hash is
`sha256:a0174e3f8cfb02103d6c18af94a4fd11dbec0a1c84d6ad981b2a5b9fb37852d3`.

Focused transaction gates pass. Both type checks, the 279-file Algorithm32
formatter scope, 456-spec Node regression, 5-spec Three/WebGL lane, 3-spec
Flat32 UI lane, and 1-spec policy lane pass. Exact row, owner, export,
retired-path, test-containment, import, cycle, class-size, whitespace,
final-newline, and diff gates pass. The 287-file tree has 131 production
JavaScript/JSX modules, and all 67 class files remain below 1,000 lines with
`ThreeCacheBackend` largest at 915 lines.

##### 4.5.6 Audit and close helper ownership

Status: complete on 2026-08-04.

The independent audit ran directly against the complete, uncommitted Step
4.5.5 tree relative to committed baseline `d973e2f`; it did not reset, replay,
or reimplement the settled work or reuse Step 4.5.5 review claims as closure
evidence. The live inventory reproduces exactly 287 Algorithm32 files, 279
formatted code/declaration files, 131 production modules, 67 matching-name
sole-class modules below 1,000 lines, 20 planned namespace owners, and 601
unique combined Algorithm32/Flat32 ambient names across 76 declaration files.

Independently rescan the settled tree for class-only support outside its class,
module-local class helpers, unclassified exported functions, arbitrary
multi-function groupings, single-function modules, namespace filename/export
violations, duplicate or compatibility exports, unjustified factories, and
incomplete profiles. Confirm that every surviving ordinary utility has the
recorded non-namespace contract required by Step 4.5.3.

Run both type checks, the complete Algorithm32 formatter scope, focused helper
and namespace coverage, the full Node regression, Three/WebGL and Flat32 UI
lanes, retained policy integrity, exact import/export/declaration/cycle scans,
whitespace and newline checks, and `git diff --check`. Update the reconciliation
ledger and active checkpoint with the final inventory, migrations, evidence,
and next step.

Complete when every scan and required gate passes, the inventory and live tree
agree, Step 4.5 has no pending disposition or exception, and the current work
advances to Step 5.1.

The independent semantic and AST/static rescans found zero class-file
module-local callable or class helpers, zero unclassified exported functions,
zero arbitrary multi-function groupings, zero one-method namespace holders,
zero namespace filename/export violations, zero duplicate or compatibility
exports, and zero factory owner. All 20 planned named namespaces are exact,
multi-method, sole-export owners; the eight retained default-object math
namespaces remain exact multi-method sole-export owners. Exactly five ordinary
production callable owners survive: the React component, Native-15 profile,
local-Sun pairing invariant, closure-producing later-order recurrence, and
ordered scattering-density integration owners. Each is the recorded entity,
profile, invariant, or inseparable-algorithm exception. The Native-15 default
reproduces its 15/20/15 interval selections, scattering order 4, omitted
ground, complete override and direct-40 documentation, and identity
`sha256:a0174e3f8cfb02103d6c18af94a4fd11dbec0a1c84d6ad981b2a5b9fb37852d3`.

The structural closure resolves all 599 relative clauses, reports a 131-node,
347-edge production graph with zero cycles or production-to-test edges, and
finds zero duplicate names in the 601-name ambient surface. All 37 retired
paths remain absent. The focused helper/namespace gate passes 166 of 166
specs; both type checks and the exact 279-file formatter scope pass; the full
Node regression passes 456 of 456 specs in 85.651 seconds; approved browser
reruns pass 5 of 5 Three/WebGL specs and 3 of 3 Flat32 UI specs after their
sandboxed Chrome launches were denied with `spawn EPERM`; policy integrity
passes 1 of 1; and whitespace, final-newline, and diff checks pass. Step 4.5
is closed with no pending disposition or exception and supplied the settled
input for completed Step 5.

### 5. Reconcile ambient types

Status: complete on 2026-08-04. Steps 5.1-5.3 and the independent
public/private placement, imported-type, union-documentation, callable-shape,
duplicate-name, parse, type, formatter, regression, browser, policy, and
hygiene closure gates pass and supplied the Step 6.1 inventory input.

#### 5.1 Re-home interfaces and class contracts

Status: complete on 2026-08-04.

Move interface declarations into their nearest types.d.ts file. Put public
class method/property contracts in nearest types.d.ts and class-internal
contracts in their class type file. Remove duplicates during the move.

Complete when no standalone interface remains outside nearest types.d.ts, every
public class API type is declared there, and type checking has no missing or
duplicate declaration.

All 45 Algorithm32 interfaces now occupy their nearest basename `types.d.ts`.
All 34 dedicated class declaration files match their implementation class,
and their 155 aliases are dependency-closed to that owner. Transitive closure
over every public constructor, method, property, result, and collaborator
finds zero dedicated private alias, while the reverse scan finds zero
private-only alias in a public declaration owner. The combined Algorithm32 and
Flat32 declaration surface has 722 unique global ambient names and 728 unique
scope-aware declaration keys across 84 files, with zero duplicate.

#### 5.2 Remove imported type expressions

Status: complete on 2026-08-04.

Replace every import(...) type expression with a canonical ambient contract or
explicit runtime-value boundary, updating runtime, declaration, and browser
users together.

Complete when the scoped scan has zero such expressions and type checking
passes without import-based substitutes.

The settled Step 5 input contained 63 `import(...)` expressions across the
adapter, facade, rendering, and GPU/Three boundaries. Canonical ambient
contracts now express directly assignable values, and explicit public runtime
boundaries adapt caller-owned Three values once to class-private exact
protocols. The complete Algorithm32 surface has zero `import(...)`,
`import type`, type-only export/specifier, `declare`, `any`, or local JSDoc
typedef substitute, and neither public boundary references a dedicated
private protocol.

#### 5.3 Name unions and complex callable contracts

Status: complete on 2026-08-04.

Replace inline literal string unions with named ambient types and required
member documentation. Replace inline complex parameter and return shapes with
named ambient contracts and update all use sites.

Complete when scans find no inline union or complex callable shape and every
replacement type documents properties and union members.

The settled audit found 67 string-union occurrences: 24 already named and 43
inline. Thirty-seven new semantic aliases plus the corrected existing owners
leave exactly 61 named ambient string unions. Every union has one exact bolded
member bullet per allowed literal, with no missing, extra, or malformed item.
The 27 inline callable shapes found across JSDoc parameters, JSDoc returns,
and declaration parameters now use named ambient contracts; the final
TypeScript/JSDoc AST scan finds zero inline union or callable parameter/return
type literal.

Both type checks and the exact 287-file Algorithm32 formatter scope pass. The
complete Node regression passes 456 of 456 specs in 92.879 seconds; approved
browser reruns pass 5 of 5 Three/WebGL specs and 3 of 3 Flat32 UI specs after
their sandboxed Chrome launches were denied with `spawn EPERM`; policy
integrity passes 1 of 1; and declaration parsing, whitespace, final-newline,
and diff checks pass. The independent closure found and corrected 19
transitive placement defects plus one residual inline test artifact contract
before reproducing every final result above.

### 6. Reconcile JSDoc

Status: complete on 2026-08-04. Steps 6.1-6.3, 7.1-7.2, 8.1-8.5, and 9.1-9.3
are complete.

#### 6.1 Build a documentation inventory

Status: complete on 2026-08-04.

Inventory every type, class, interface, property, accessor, field, constant,
function, method, callback, generator, and constructor, identifying its
documentation form.

Complete when every documented entity, value, and callable has an inventory
entry and required description form.

The canonical
[documentation inventory](./documentation-inventory.md) and its ambient,
production, and test/browser appendices cover all 287 Algorithm32 JavaScript,
JSX, and declaration files at source identity
`sha256:1268df865e9cbecd99f9d56c35a9d4a92acf74505011b23648d0368ec8c3c68f`.
They record 6,475 unique documentable rows: 3,057 declaration, 1,742
production, and 1,676 test/browser rows. The inventory includes every named
entity and callable plus function types, call signatures, assigned function
values, production closures, and anonymous Jasmine/browser callbacks; seven
re-export-only barrels are explicitly recorded with zero target.

Every row records its current documentation form, required description form,
parameter/return/yield/throw evidence, asynchronous-outcome state, overload
membership, and string-union member coverage. The settled surface has 4,383
rows with a description or tag block and 2,092 without one; 1,534 `@param`
tag lines have zero separator defect, while 350 of 1,008 `@returns` tag lines
lack the required separator. The AST inventory identifies 768 callable rows
with at least one untagged syntactic parameter, 1,142 value-returning rows
without a return tag, and 73 async rows, 68 without current outcome language.
No generator or error class exists. Both independent AST passes reproduce all
6,475 syntax nodes with zero missing, extra, duplicate, parse, location, or
JSDoc-presence mismatch; all 61 named string unions and 183 members retain
exact documentation. Both type checks and inventory document gates pass.

#### 6.2 Rewrite descriptions and type documentation

Status: complete on 2026-08-04.

Use the required active description forms for methods, internal methods and
callbacks, constructors, and generators. Describe types, classes, interfaces,
properties, accessors, fields, constants, parameters, return values, union
members, and other non-callable entities or values with noun phrases or noun
clauses that state what they are or represent rather than actions. Document
accessors as properties with the same get/set description.
Document every ambient type and property, including required bolded
union-member lists.

Complete when every entity, value, and callable uses its applicable form and
no legacy description remains.

The comment-only rewrite retained the exact 6,475-row Step 6.1 AST surface and
closed every description cohort: 3,398 entity/value noun descriptions, 99
`Creates ...` constructors, 2,235 `Called by <owner> to ...` internal methods
and callbacks, and 743 `Call this method/function to ...` public callables.
All 61 named union lists and 183 members remain exact. Independent stable-row,
parse, documentation-presence, appendix, and normalized semantic-AST passes
find zero mismatch across all 287 files. Both type checks and formatting pass;
Node passes 456/456, Three/WebGL 5/5, Flat32 UI 3/3, and policy integrity 1/1.
The two browser lanes required approved reruns after sandboxed Chrome launches
failed with `spawn EPERM`.

#### 6.3 Complete tags, errors, and asynchronous outcomes

Status: complete on 2026-08-04.

Document all parameters and returns as name - description. Explain complex
return selection in the general description. Document error classes,
rejected/cancelled async behavior, and overloads as specified.

Complete when every callable has complete tags and all applicable error and
asynchronous outcomes are documented.

The refreshed 6,475-row inventory closes with 2,739 `@param`, 2,272
`@returns`, and 288 `@throws`/`@exception` tag lines across JavaScript, JSX,
and declarations. No callable lacks a syntactic parameter or required value-
return tag, and no parameter, return, or throw tag lacks the required
separator. All 73 async callables state rejection and cancellation or explicit
non-cancellability in their general descriptions. The two ambient renderer
overload groups distinguish their vector and scalar call shapes.

An independent body audit finds 248 directly throwing callables and zero
without an error tag, plus 201 branched or conditional value-return contracts
and zero without selection language. No error class or generator exists.
Stable rows, syntax kinds, description forms, parse results, union coverage,
and normalized semantic AST tokens match the pre-rewrite baseline at current
source identity
`sha256:410a525fc7afc56001b3a14d75e0181440c1f99b3e625ead136a2e6e9b85acdc`.
Both type checks and the 287-file formatter scope pass; Node passes 456/456,
Three/WebGL 5/5, Flat32 UI 3/3, and policy integrity 1/1. The browser gates
passed through approved reruns after sandboxed Chrome launch returned
`spawn EPERM`. Whitespace and diff hygiene pass. Steps 6 through 9 are
complete.

### 7. Reconcile durable physical data and units

#### 7.1 Classify unit-suffixed names

Status: complete on 2026-08-04. Step 7.2 is also complete.

The canonical [unit-bearing name inventory](./unit-bearing-name-inventory.md)
replaced the unmaterialized initial 90-candidate count with a reproducible
172-name conservative superset. It classifies 88 JavaScript normalized locals,
52 shader-local bindings, 22 explicit unit conversion/construction/clock/wrap
callables, seven private unit-normalizing computational methods, two platform
API false positives, and one durable result-property violation. Baseline and
current AST inventories are identical.

Complete when all candidates are classified and each retained suffix is a
documented permitted local value. Complete: every retained name has a recorded
computational, shader, callable, private-method, or platform rationale, and the
sole durable violation was migrated by Step 7.2.

#### 7.2 Migrate durable contracts

Status: complete on 2026-08-04. `BrunetonColorDisplayModel` now publishes the
neutral diagnostic property `cieTableResolution` carrying
`{value: 1, units: 'nanometers'}`. Focused coverage asserts this positive
unit-bearing contract.

For every durable violation, use a neutral property name and carry unit,
physical quantity, spectral basis, point/bin interpretation, and provenance in
the contract. Use Algorithm32 radiometric stage names such as sourceIrradiance
and incidentIrradiance where applicable.

Complete when no durable property encodes a unit in its name, migrated values
carry required metadata, fixtures/serialization are updated, and focused
numerical parity checks pass. Complete: the residual production scan finds no
durable unit-bearing property name. The focused Bruneton lane passes 8/8; both
type checks and the full formatter scope pass; Node passes 456/456; approved
browser reruns pass Three/WebGL 5/5 and Flat32 UI 3/3 after sandboxed Chrome
launch returned `spawn EPERM`; policy integrity passes 1/1; and diff hygiene
passes.

### 8. Replace unclear short variable names

Status: complete on 2026-08-04. Steps 8.1-8.5 are complete.

Rename unclear single-letter and short bindings throughout Algorithm32
JavaScript, JSX, ambient declarations, tests/browser support, and authored
shader source. Cover module/local variables, parameters, loop and catch
bindings, destructured aliases, and embedded shader identifiers. Use a
reproducible one-to-three-character scan to seed the work, then inspect longer
opaque abbreviations that do not communicate the value's role.

Retain `config` and `props` as standard abbreviations. Retain `id`, `row`,
`key`, `min`, `max`, and `sum` only when the lexical context contains one
unambiguous role of that kind, and retain coordinate `x`, `y`, and `z` only
when the lexical context contains one coordinate system. Otherwise retain a
short name only where the implementation directly expresses an externally
documented formula and that exact symbol is clearer than a descriptive
replacement. Record the external authority and symbol mapping at the
implementation or its owning design document. A small scope or familiar loop,
callback, or temporary convention is not an exception.

Complete when every short or opaque binding outside the accepted unambiguous
conventions and formula symbols has been renamed descriptively in
implementation and affected tests, every retained contextual convention is
unambiguous, every retained formula symbol has external evidence, observable
behavior is unchanged, and focused plus affected type, formatter, regression,
browser, policy, and hygiene gates pass. The inventory is supporting evidence;
the completed source migration is the required outcome.

#### 8.1 Build the exact migration map

Status: complete on 2026-08-04.

Scan every Algorithm32 JavaScript, JSX, ambient-declaration, test/browser, and
authored shader source for one-to-three-character bindings, then manually add
longer opaque abbreviations. Context-audit the accepted conventions and exclude
them from migration tables. Give every remaining candidate an exact
declaration, semantic role, replacement or formula-exception disposition,
affected references, owning implementation batch, and focused gate. A retained
formula symbol must cite an external authority and map the code symbol to that
formula.

Complete when the audit covers every scoped binding, accepted unambiguous
conventions are absent from migration tables, every migration row has a
descriptive replacement or qualifying formula exception, and Steps 8.2-8.4
have exact non-overlapping source ownership.
This is migration preflight; it does not complete Step 8 without the source
changes below.

The canonical [short-name migration map](./short-variable-migration-map.md) and
its Step 8.2-8.4 appendices cover the complete JavaScript, JSX, ambient-
declaration, test/browser, and authored-shader surface at source identity
`sha256:b523e1ed23e5d77fc768f53d3d35184d248d02816e716ccf0fd7d889c92387c5`.
The reproducible scan found 302 one-to-three-character AST bindings and 28
authored-shader declarations; manual review of all 2,311 four-to-six-character
declarations added 118 context-review rows. The audit covers all 448 unique
declarations: 198 accepted unambiguous conventions are excluded from the
migration tables, leaving 250 exact migration/formula rows. Step 8.2 owns 55
rows, Step 8.3 owns 107, and Step 8.4 owns 88. Exactly 242 rows require
descriptive renames. Only the eight SHA-256 working variables `a` through `h`
survive in the migration tables as formula symbols under NIST FIPS 180-4
sections 2.2.1 and 6.2.2, recorded as production reference [6]. The contextual
`id` audit excludes 51 unambiguous identifiers and maps the three scopes
containing distinct identifier roles to `shaderIdentifier`, `planIdentifier`,
and `fieldIdentifier`. No test or compatibility artifact preserves a retired
name. Step 8.1 changed no runtime source; Steps 8.2-8.3 are complete and Step
8.4 is current.

#### 8.2 Rename foundation, adapter, GPU, and runtime bindings

Status: complete on 2026-08-04.

Apply the migration map to `adapters`, `gpu-assembler`, `gpu-runtime`,
`ground-boundaries`, `profiles`, `quantities`, `references`, `runtime`, and
`utils`. Update each owner's ambient declarations, tests/browser support,
JSDoc parameter names, destructuring aliases, and embedded authored source in
the same transaction. Preserve external object keys and third-party API member
names by aliasing them to descriptive local bindings where necessary.

Complete when this ownership set has no non-exempt mapped binding, its focused
specifications pass, both type checks and affected formatting pass, and no
public shape or observable behavior changed.

All 47 mapped declarations are renamed across the exact Step 8.2 ownership
set, while external object keys and third-party members retain their current
names through local aliases. The eight SHA-256 working variables `a`-`h`
remain under their adjacent FIPS 180-4 citation. The post-edit discovery at
source identity
`sha256:80d7ce9b636b18046b88d6baf7f2a0cbe310aef8e3a9a84cab8347185e42fc83`
finds zero residual mapped declaration in its original semantic scope. The
focused lane passes 61/61; both type checks and the complete formatter scope
pass; Node passes 456/456 in 93.735 seconds; approved browser reruns pass
Three/WebGL 5/5 and Flat32 UI 3/3 after sandboxed Chrome launch returned
`spawn EPERM`; policy integrity passes 1/1; and diff hygiene passes.

#### 8.3 Rename atmosphere, color, domain, and geometry bindings

Status: complete on 2026-08-04.

Apply the migration map to `atmospheres`, `color`, `domains`, and `geometry`,
including their declarations, specifications, Three adapters, and embedded
GLSL. Preserve only externally sourced formula symbols selected by Step 8.1;
rename ordinary coordinate, ray, intersection, interpolation, accumulation,
and cache-sampling abbreviations descriptively.

Complete when this ownership set has no non-exempt mapped binding, every shader
producer/consumer or exact-source expectation is updated atomically, focused
CPU and Three/WebGL behavior passes, and type and formatting gates pass.

All 107 mapped declarations are renamed across atmosphere, color, domain, and
geometry implementation, declaration, specification, Three, and authored-GLSL
surfaces. Paired CPU and shader quadratic, phase, direction-domain,
intersection, interpolation, and cache-sampling names now communicate their
roles while public object keys remain unchanged. The post-edit discovery at
source identity
`sha256:810b2c0f0478b341baa76ce8c56f672a2a9eacd2988639d4fc671ef60ea20eed`
finds zero same-path/name residual for the exact 107-row map. The focused
owner lane passes 107/107; both type checks and the complete formatter scope
pass; Node passes 456/456 in 106.412 seconds; approved browser reruns pass
Three/WebGL 5/5 and Flat32 UI 3/3 after sandboxed Chrome launch returned
`spawn EPERM`; policy integrity passes 1/1; and diff hygiene passes.

#### 8.4 Rename extraterrestrial, light-source, and transport bindings

Status: complete on 2026-08-04.

Apply the migration map to `extraterrestrial`, `light-sources`, and
`transport`, including Sun synchronization, cache controllers/providers, CPU
and GPU evaluators, Three lighting adapters, declarations, specifications, and
authored shaders. Distinguish scattering order and radiometric-stage domain
terms from convenient local abbreviations; retain a short symbol only with
the Step 8.1 formula evidence.

Complete when this ownership set has no non-exempt mapped binding, affected
cache identities and serialized/public keys remain unchanged, focused source,
cache, and transport behavior passes, and type and formatting gates pass.

All 88 mapped declarations are renamed across extraterrestrial Sun
synchronization, distant/local/shared light-source implementation and support,
cache controllers/providers/evaluators, field-oriented specifications, Three
lighting adapters, and transport specifications. Serialized identities,
public object keys, scattering-order semantics, and radiometric stages remain
unchanged. The post-edit discovery at source identity
`sha256:cb9ee9cc20b896b2ca504fe74063859b6e32bc41d27dea1635b9f9af4aa5825d`
finds zero same-path/name residual for the exact 88-row map. The focused owner
lane passes 175/175; both type checks and the complete formatter scope pass;
Node passes 456/456 in 85.803 seconds; approved browser reruns pass Three/WebGL
5/5 and Flat32 UI 3/3 after sandboxed Chrome launch returned `spawn EPERM`;
policy integrity passes 1/1; and diff hygiene passes.

#### 8.5 Audit and close the short-name migration

Status: complete on 2026-08-04.

Independently rescan all scoped AST bindings and authored shader tokens, inspect
longer opaque abbreviations missed by the length seed, validate every retained
formula citation/mapping, and confirm no property key or external API contract
changed accidentally. Run the complete Algorithm32 and Flat32 type, formatter,
Node regression, Three/WebGL, Flat32 UI, policy-integrity, and hygiene gates.

Complete when the independent scan has no unexplained short or opaque binding,
all formula exceptions reproduce their recorded authority, every required gate
exits successfully, and the ledger records exact migration and verification
evidence.

The independent current-state audit reproduced all 242 descriptive migrations
across the exact Step 8.2-8.4 maps at source identity
`sha256:cb9ee9cc20b896b2ca504fe74063859b6e32bc41d27dea1635b9f9af4aa5825d`.
Across all 287 JavaScript, JSX, and ambient-declaration files it found 7,948
AST bindings, including 161 one-to-three-character bindings: 153 accepted
contextual conventions and exactly the eight `a`-`h` SHA-256 working variables
confined to `sha256Value` beside their FIPS 180-4 citation. The authored-source
scan found 690 shader declarations and zero one-to-three-character shader
declarations. Independent review of the 2,190 current four-to-six-character
AST declarations (222 unique names) and 26 unique shader names found no opaque
binding requiring migration. Thirteen representative destructuring/public-key
aliases remain exact. All 597 relative import/export clauses resolve exactly,
with zero cycle or production-to-test edge.

Both type checks and the complete formatter scope pass. The Node regression
passes 456/456 in 89.031 seconds; approved browser reruns pass Three/WebGL 5/5
and Flat32 UI 3/3 after sandboxed Chrome launch returned `spawn EPERM`; policy
integrity passes 1/1; and whitespace, final-newline, and diff hygiene pass. No
implementation correction, historical rename assertion, compatibility alias,
ambiguity, or exception was needed. Steps 8 and 9 are complete.

### 9. Verify and close

Status: complete on 2026-08-04. Steps 9.1-9.3 are complete.

#### 9.1 Verify every work group

Status: complete on 2026-08-04.

Run focused type and behavior gates after each group. Re-run broader gates after
public-contract, fixture, build, shader-integration, or lifecycle changes.

Complete when each group has passing focused evidence or a visible recorded
blocker.

The independent ledger audit covers all 57 recorded implementation and
closure batches through Step 8.5. Every row records its scope, verification,
completed outcome, and resolved or absent blocker; R1-R7 and R9 are complete,
and R8 is intentionally held open only for the final Step 9.2 gate matrix.
All three ambiguity decisions are resolved and implemented, and the exception
log is empty. The audit corrected the stale Step 4 parent status after
confirming Steps 4.1-4.5 complete. A fresh 6,475-row documentation AST pass
also found and corrected three stale Step 8 parameter-tag names before Step
9.2. No other work group lacks focused evidence or has an open blocker.

#### 9.2 Run final gates to completion

Status: complete on 2026-08-04.

Run Algorithm32 type checking, Node regression to completion, required build,
browser/runtime, lifecycle/resource, and document-consistency gates. A timeout
or partial progress output is not a passing regression result.

Complete when every required gate exits successfully against the reconciled
revision.

The final corrected revision passes both Algorithm32 and Flat32 type checks,
the complete Algorithm32 formatter scope, and the 456-spec Node regression in
81.154 seconds. The Three/WebGL lane passes 5/5 and the Flat32 build plus UI
lane passes 3/3 through approved reruns after sandboxed Chrome launch returned
`spawn EPERM`; policy integrity passes 1/1. Independent static scans cover 295
Algorithm32 files, including 287 code/declaration files and 67 class modules,
with zero parse, filename, class-export, class/specification-size, freeze,
private-static/hash-private, inline-union, inline-callable, ambient-placement,
or duplicate-name finding. Naming and import closure finds 161 accepted/formula
short bindings, zero short shader declaration, 242 exact completed migrations,
597 resolved relative clauses, and zero cycle or production-to-test edge. The
6,477-row documentation inventory has zero missing description, tag, union
member, error, complex-return, async-outcome, parse, appendix, or location
finding. All 441 relative links and 23 anchors across the 29 current standards,
continuity, inventory, and dependent-plan documents resolve; whitespace,
final-newline, and diff hygiene pass.

#### 9.3 Close ledger and dependent planning

Status: complete on 2026-08-04.

Re-scan all standards, update counts and paths, resolve or accept ambiguities
and exceptions, mark R1 through R9 complete, and update dependent production
planning to cite the completed reconciliation.

Complete when the definition of reconciliation complete is satisfied and this
plan has no planned or in-progress substep.

The final standards rescan corrected three stale renamed parameter tags and
replaced twelve inline ambient callback signatures with seven named callable
contracts before reproducing every Step 9.2 result. The current globally
path-sorted documentation source identity is
`sha256:7d7810f7b69b7516bfdd25058360d62cd4b586176d7692ca90fd5655f1398832`.
The ledger now marks R1-R9 complete, all three ambiguity decisions are resolved
and implemented, and no exception exists. The dependent production integration
plan records reconciliation Step 2 as complete and leaves its API and ownership
contract decision as the next uncompleted production-planning step. The
definition of reconciliation complete is satisfied with no planned or
in-progress reconciliation substep.

# Algorithm32 Standards Reconciliation

Status: reconciliation complete on 2026-08-04. This document is the canonical
completed work ledger for Phase 2 of the
[Extraterrestrial Production Integration API Plan]
(../../../../extraterrestrial/production-integration-api-plan.md#2-reconcile-the-production-implementation-with-current-standards).
It records the Algorithm32-only standards audit required before a dependent
production plan can proceed. Its execution sequence is owned by the
[Algorithm32 Reconciliation Plan](../algorithm32/reconciliation-plan.md).

## Scope

The reconciliation evaluates the complete production `src/algorithm32` tree
and the Algorithm32 test, type, build, and documentation files directly
required to verify it. Step 4.3 additionally permits only the path, named-import, and command
companion edits enumerated by the
[source-organization migration plan](../algorithm32/source-organization-plan.md):
five live `src/flat32` importers, the M1 Native-48 direct-owner import repair,
five Algorithm32 Three Karma preprocessor keys, the now-invalid root
frozen-experiment study command, and current documentation. It excludes every
other source tree, application behavior,
experiment or evidence mutation, archive, runner, generated-output root, and
topic outside that bounded scope.

The controlling standards are [Code Conventions]
(../../../../standards/code-conventions.md), [Type Conventions](../../../../standards/types.md),
[JSDoc Conventions](../../../../standards/jsdoc.md), and [Algorithm32 Standards]
(../../../standards.md).

## Standards Evaluation

| Standard | Evaluated rule set | Initial result |
| --- | --- | --- |
| Code Conventions: formatting, filenames, modules, sizes, constants, generated files | Tabs, semicolons, naming, class/utility shape, export count, file size, `Object.freeze`, fixture classification | Violations found; see Formatting, Naming, And File Structure. |
| Code Conventions: validation | Validate semantics only at external ingress; trust accepted internal contracts; descriptors do not validate executable behavior | 72 non-test modules contain runtime validation patterns. The initial ingress classification found confirmed unneeded checks and no confirmed missing semantic ingress check; see Validation Findings. |
| Type Conventions | Ambient placement, public/internal class types, interfaces, import expressions, named unions | Violations found; see Types And Ambient Declarations. |
| JSDoc Conventions | Named complex contracts, active descriptions, complete tags, tag separator | Violations found; see JSDoc. |
| Algorithm32 Standards | Unit-bearing durable data, neutral property names, local-scalar exception, radiometric naming | 90 unit-suffix candidates require durable-versus-local classification; see Physical Data, Validation, And Descriptors. |

## Initial Audit Baseline

The current `src/algorithm32` tree contains 285 files: 229 JavaScript files,
one JSX file, 38 ambient declaration files, 13 JSON fixtures or policies, and
four Markdown files. The lexical test-file inventory contains 90 test, browser,
or test-support files. `src/algorithm32/jsconfig.json` and the root
`typecheck:algorithm32` command are the current type-check entry. The current
tree is the baseline being reconciled; this audit does not treat its legacy
structure as an implicit exception.

`npm run typecheck:algorithm32` passed on 2026-08-01. The focused
`npm run test:algorithm32` Jasmine command started and emitted passing-progress
output but did not complete within the 120-second audit timeout. No build or
browser baseline has been run yet.


### Step 0 Baseline Execution

Step 0 completed on 2026-08-01 against production commit
f3654aa02847b469b9c9d0dcb25aa4d559c6031d and Algorithm32 tree
5f17471509162e6877de2cc45d0daf0e0ec2cb99. The current worktree has zero
uncommitted src/algorithm32 changes and the tree contains 285 tracked files:
229 JavaScript files, one JSX file, 38 ambient declaration files, 13 JSON
files, and four Markdown files.

The inherited standard-scan baseline for that exact tree is: zero code or
declaration leading-space indentation findings; 20 ordinary camelCase filename
findings; five production class files over 1,000 lines; four duplicate class
exports; 12 Object.freeze uses; nine import(...) type expressions; 77 inline
literal string unions; 34 inline complex parameter shapes; 42 inline complex
return shapes; six parameter-tag separator findings; 838 return-tag separator
findings; 90 unit-suffix candidates; and 72 non-test validation candidates.
The lexical test/browser/test-support inventory is 90 files.

npm run typecheck:algorithm32 completed successfully in 3.7 seconds on this
baseline. npm run test:algorithm32 was rerun with a 120-second bound and exited
with timeout code 124 after 120.04 seconds; it emitted Jasmine passing-progress
dots but did not report completion. It remains an incomplete baseline and must
not be reported as a passing regression result.

The completed Node regression baseline supersedes that bounded-run result:
`npm run test:algorithm32` completed successfully after 265 seconds, reporting
507 specs, zero failures, and a Jasmine execution time of 262.665 seconds. The
120-second timeout remains historical evidence that the prior bound was too
short; it is not the current regression outcome.

### Batch Verification Record

Every reconciliation implementation batch records the following before an
unrelated batch begins: batch id and date, changed paths, affected contracts or
standards, focused verification command, completed outcome, and every still
open failure, timeout, or unavailable gate.

| Batch | Changed paths | Verification | Completed outcome | Open result |
| --- | --- | --- | --- | --- |
| Step 0 baseline, 2026-08-01 | None; record-only | npm run typecheck:algorithm32; npm run test:algorithm32 with 120-second bound | Type check passed in 3.7 seconds. | Jasmine timed out with exit code 124 after 120.04 seconds; incomplete. |
| Step 0 extended Node baseline, 2026-08-01 | None; record-only | npm run test:algorithm32 with a 600-second bound | 507 specs, 0 failures; Jasmine finished in 262.665 seconds. | None. |
| Step 1.2 A1 retirement, 2026-08-01 | Star fixtures, policies, provenance, harnesses, tests, commands, Karma wiring, bridge, evidence capsule, and current ownership documentation | `npm run typecheck:algorithm32`; `npm run test:algorithm32`; scoped Star-reference scan; `git diff --check` | Type check passed before and after bridge removal. Post-removal Node regression passed: 472 specs, 0 failures, 107.765 seconds. The production scope and active command/Karma wiring have no Star reference; retained native N4 oracle uses production-owned provenance. | None. |
| Step 1.3 A2 classification, 2026-08-01 | Empty source registry, registry-only ambient types, and source-shape scaffold specification | `npm run typecheck:algorithm32`; `npm run test:algorithm32`; JSON/reference scan; `git diff --check` | Type check passed. JSON/reference scan found exactly four retained JSON files and no retired registry reference. Node regression passed: 461 specs, 0 failures, 109.887 seconds. | None. |
| Step 1.4 A3 test-support size, 2026-08-01 | ShaderBuilder specification split into assembly, runtime, and shared test support | `npm run typecheck:algorithm32`; `npm run test:algorithm32`; line-count check; `git diff --check` | Type check passed. Node regression passed: 461 specs, 0 failures, 95.791 seconds. The split files are 371, 379, and 480 lines; the combined specification is gone. | None. |
| Step 2.1 ingress map, 2026-08-01 | Reconciliation ledger and plan only | Runtime JSON-ingress scan; ingress-map row count; `git diff --check` | 15 external boundaries mapped to one validation owner and explicit semantic checks. The only production `JSON.parse` is an internal descriptor clone, not serialized-data ingress. | None. |
| Step 2.2 validation disposition, 2026-08-01 | 72-module validation inventory and plan/ledger status | Candidate-module path comparison; `git diff --check` | All 72 executable lexical candidates have a recorded keep, mixed, rehome/remove, or no-local-check disposition. The raw 74-match scan excludes one re-export and one declaration-only false positive. | None. |
| Step 2.3 known invalid validation removal, 2026-08-01 | `DenseScalarArrayLayout`, its specification, and descriptor support | `npm run typecheck:algorithm32`; `npm run test:algorithm32`; retired-API scan; `git diff --check` | The test-only dense-layout assertion and unused descriptor-record assertion are removed. Factory ingress validation and unit-bearing descriptor construction remain. Type checking passed; Node regression passed: 460 specs, 0 failures, 101.395 seconds. | None. |
| Step 2.4.1 trusted Reference/SpectralCalculator checks, 2026-08-01 | `Reference`, `SpectralCalculator`, and their behavior specifications | `npm run typecheck:algorithm32`; `npm run test:algorithm32`; retired-helper scan; `git diff --check` | Removed Reference dependency/request wrapper checks and SpectralCalculator dependency, ray, path-point, and collaborator revalidation. Interval, cache-state, packet, unit, and basis semantics remain. Type checking passed; Node regression passed: 460 specs, 0 failures, 102.07 seconds. | None. |
| Step 2.4.2 trusted CanonicalAtmosphere checks, 2026-08-01 | `CanonicalAtmosphere` and its behavior specification | `npm run typecheck:algorithm32`; `npm run test:algorithm32`; retired-check scan; `git diff --check` | Removed configuration/constants wrapper checks and downstream coordinate/path/sample/phase shape checks. Finite constants, positive scale heights, accepted spectral basis, and positive wavelengths remain. Type checking passed; Node regression passed: 460 specs, 0 failures, 110.229 seconds. | None. |
| Step 2.4.3 trusted geometry handoffs, 2026-08-01 | Flat/Spherical geometry, shared geometry-coordinate normalization, and geometry behavior specifications | `npm run typecheck:algorithm32`; `npm run test:algorithm32`; retired-check scan; `git diff --check` | Removed Flat descriptor validation and internal atmosphere/source/cache request/member/unit-shape checks. Shared trusted-direction normalization retains zero-vector handling. Type checking passed; Node regression passed: 460 specs, 0 failures, 110.62 seconds. | None. |
| Step 2.5 remaining validation trace, 2026-08-01 | Validation inventory, method-level analysis, plan, and ledger only | Production call-site scan; candidate-to-analysis comparison; `git diff --check` | Every remaining Mixed/Rehome candidate now has a method-level disposition. The trace found three bounded batches: retire the unused CPU-field assertion API; reconcile trusted shader-composition handoffs; and remove type/shape-only checks at typed configuration/adapter boundaries. No missing semantic ingress check was found; `git diff --check` passed. | Implementation batches 2.6 through 2.8 remain. |
| Step 2.6 unused CPU-field assertion retirement, 2026-08-01 | `caches/cpuDirectionalSpectralFields.js` (retired), `caches/index.js`, and `caches/_tests/CpuDirectionalSpectralField.spec.js` | Retired-API/reference scan; `npm run typecheck:algorithm32`; `npm run test:algorithm32`; `git diff --check` | No retired API/module reference remains. Type checking passed. Node regression passed: 460 specs, 0 failures, 96.418 seconds. Field storage, finite-scalar, offset-bound, and mutable/sealed behavior remains covered. | None. |
| Step 2.7 trusted shader-composition handoffs, 2026-08-01 | `ShaderBuilder`, shader assembler/validator/descriptor builder, collection-normalization module (retired), and their behavior specifications | Retired-module/check scan; `npm run typecheck:algorithm32`; `npm run test:algorithm32`; `git diff --check` | Removed trusted dependency/request/setup/configuration/descriptor/Color/contribution shape checks and retired collection normalization. Type checking passed. The first regression run had one obsolete custom-Color-diagnostic expectation; after replacing it with the retained rejection behavior, the completed regression passed: 453 specs, 0 failures, 99.144 seconds. | None. |
| Step 2.8 typed configuration and adapter shapes, 2026-08-01 | Display model, scene capture, distant cache plan, light-source request helpers, LocalSun source and constants, React utilities, and their behavior specifications | Retired-check scan; `npm run typecheck:algorithm32`; `npm run test:algorithm32`; `git diff --check` | Removed configuration, callback-packet, RGB-tuple, scene/camera/renderer, cache-option, request-record, extra-property, and React viewport shape guards. `Algorithm32.js`, `local-sun-cache-plan.js`, and `SpectralModel.js` were reviewed and already had no qualifying wrapper. Physical/unit, supported-value, renderer-capability, resource, and lifecycle checks remain. Type checking passed; final Node regression passed: 450 specs, 0 failures, 92.345 seconds. | None. |
| Step 2.9.1 descriptor consumer inventory, 2026-08-01 | Descriptor reconciliation analysis, plan, and ledger only | Production import/consumer scan; descriptor/type path review; `git diff --check` | Recorded every current descriptor consumer and an initial direct-contract, manifest-candidate, or removal disposition. No executable source changed. | The initial domain/layout/field/cache manifest classification was superseded by the 2026-08-02 manifest-boundary decision. |
| Step 2.9.2a direct cache options, 2026-08-01 | Cache options, cache plans/builds/constants, profile, ambient contracts, and affected specifications | Retired-factory/term scan; `npm run typecheck:algorithm32`; `npm run test:algorithm32`; `git diff --check` | Replaced `CacheConstructionOptionsDescriptor` with direct `CacheConstructionOptions`. Retired the factory, schema, content hash, synthetic identifiers, cache-profile identity reference, and structural metadata expectations. Plans/builds retain only transport interval count and maximum scattering order. Type checking passed; Node regression passed: 450 specs, 0 failures, 104.832 seconds. | None. |
| Step 2.9.2b operational-option terminology, 2026-08-01 | Numerical defaults, facade/reference execution configuration, transport, cache-build helpers, profiles, ambient contracts, specifications, and current reconciliation documents | Operational-name/reference scan; `npm run typecheck:algorithm32`; `npm run test:algorithm32`; `git diff --check` | Renamed every settings-bearing `controls` contract to `options`, including `RUNTIME_NUMERICAL_OPTIONS`, `Algorithm32NumericalOptions`, `executionOptions`, resolved transport options, and cache-construction option helpers. Retained `Controller` lifecycle owners, `yieldControl()` scheduling, the imperative verb describing the shader handle, and the scientific isolation-control test. Type checking passed; Node regression passed: 450 specs, 0 failures, 99.541 seconds. | None. |
| Step 2.9 manifest-boundary decision, 2026-08-02 | Reconciliation plan, descriptor analysis, active-topic checkpoint, and ledger only | Provider/consumer assembly trace; current manifest inventory; document terminology/reference scan; `git diff --check` | A manifest now requires a provider-neutral consumer that reads provider-declared exports and requirements to assemble or configure something when the provider cannot be assumed. Only `ShaderContribution` and `CacheBuildModule` have that behavior, directly; no current production `*Manifest` survives. The partial descriptor-to-manifest migration must roll forward to direct contracts. | Superseded by the completed direct-contract implementation and closure batch below. |
| Step 2.9 direct-contract implementation and closure, 2026-08-02 | Algorithm32 cache/domain, shader/model, geometry, atmosphere/color, ground/source, profile, direct identity, ambient contract, test/browser, native-oracle metadata, and current design/status surfaces | Focused cache/domain/source/geometry/shader/ground suites; `npm run typecheck:algorithm32`; `npm run test:algorithm32`; `npm run test:algorithm32:three`; retired-term, filename, owner-snapshot, and assembly-consumer scans; `git diff --check` | Removed every Algorithm32 descriptor, current production `*Manifest`, owner snapshot, descriptor-only helper, and compatibility bridge. Direct executable owners, plans, field/storage requests, artifacts, bindings, capabilities, physical provenance, and reuse keys remain. `ShaderContribution` and `CacheBuildModule` are the only direct provider declarations with manifest behavior; their assemblers consume `provides`/`requires`, and module content identity remains active. Type checking passed. The final Node regression passed 426 specs with zero failures in 117.61 seconds. The final Three/WebGL lane passed 5 of 5 specs, including Stage 10; its first sandboxed Chrome launch was denied with `spawn EPERM`, and the approved unsandboxed rerun passed. All final scans and `git diff --check` passed. | None. |
| Steps 3.1-3.2 formatter-backed tab and semicolon closure, 2026-08-02 | Root `package.json`/`package-lock.json`, root `.prettierrc.json`, all 237 Algorithm32 JavaScript/JSX/ambient-declaration files, repository formatting standard, and current continuity documents | Explicit `src/algorithm32/**/*.js`, `src/algorithm32/**/*.jsx`, and `src/algorithm32/**/*.d.ts` Prettier write/check globs; `npm run typecheck:algorithm32`; `npm run test:algorithm32`; `npm run test:algorithm32:three`; `git diff --check` | Installed Prettier 3.9.6 as an exact root development dependency and formatted the complete code/declaration surface with the adopted tab-and-semicolon configuration. The explicit scope excluded four checked JSON/configuration files and four Markdown files. `prettier --check` and type checking passed. The Node regression passed 426 specs with zero failures in 81.583 seconds, the Three/WebGL lane passed 5 of 5 specs, and the diff check passed. | None. |
| Step 3.3 dependency-safe ordinary-module renames, 2026-08-02 | 15 ordinary Algorithm32 modules, all production import/re-export and browser consumers, affected validation/cache documentation, and current continuity documents | Three focused Jasmine groups; type checking after each group; `prettier --check`; `npm run test:algorithm32`; `npm run test:algorithm32:three`; exact old-path and ordinary-filename scans; `git diff --check` | Renamed all 15 camelCase ordinary modules to kebab-case without changing exports or behavior. Focused groups passed 42, 131, and 26 specs with zero failures. Final formatting and type checks passed; the Node regression passed 426 specs with zero failures in 102.385 seconds; the Three/WebGL lane passed 5 of 5 specs; current production and current-path document scans found zero old filenames and zero remaining ordinary camelCase filenames; and the diff check passed. Step 3.4 was already satisfied by completed A2/Step 1.3 and required no additional JSON change. | None. |
| Step 4.1 named-only class exports, 2026-08-02 | `DistantSunCache`, `DistantSunCacheController`, `CacheGpuExecutor`, and `CachePassAssembler` implementation/declaration modules plus current continuity documents | Export/default-consumer scans; focused cache/controller/geometry/assembly specifications; `npm run typecheck:algorithm32`; `prettier --check`; `npm run test:algorithm32`; `npm run test:algorithm32:three`; `git diff --check` | Removed six redundant default aliases while retaining the four named class exports. Every current consumer already used a named import, so no compatibility alias or consumer edit was required. Updated the eight touched class descriptions to noun phrases. Each implementation/declaration module now exports exactly its named class. The focused group passed 87 specs with zero failures; type checking and formatting passed; the Node regression passed 426 specs with zero failures in 102.482 seconds; the Three/WebGL lane passed 5 of 5 specs; export/default-consumer scans and the diff check passed. | None. |
| Step 4.2 readonly atmosphere constants, 2026-08-02 | `atmospheres/consts.js` plus current plan, ledger, and active-topic documents | Consumer, mutation, and hash trace; focused cache-operation and distant/local source-plan specifications; `npm run typecheck:algorithm32`; `prettier --check`; production JavaScript/JSX freeze scan; `npm run test:algorithm32`; `npm run test:algorithm32:three`; `git diff --check` | Removed two outer map freezes and ten nested-array freezes. Both pass maps now use `Readonly<Record<CachePassKind, readonly string[]>>`; their keys, values, ordering, and distinct array identities are unchanged. The focused group passed 17 specs with zero failures in 68.33 seconds; type checking and formatting passed; the Node regression passed 426 specs with zero failures in 99.306 seconds; and the approved Three/WebGL rerun passed 5 of 5 specs after the sandboxed Chrome launch was denied with `spawn EPERM`. The production freeze scan is empty and the diff check passed. | None. |
| Step 4.3.1 source-organization plan, 2026-08-02 | New canonical source-organization migration plan plus reconciliation plan, ledger, and active-topic checkpoint; no production path | Bounded manifest/current-tree comparison; target-collision classification; live Flat32 import, Karma-key, root-command, and frozen-evidence consumer audits; current-status scan; `git diff --check` | Mapped all 245 current Algorithm32 files exactly once: 245 manifest rows, 245 unique current paths, and zero missing, extra, or duplicate current paths. Classified all 23 duplicate target groups as explicit mixed-file or cumulative in-place merges, including the two cohesive utility merges that retire the remaining single-function modules; resolved final ownership and dependency direction; defined M1-M11 with focused/final gates; and bounded every required companion edit without moving production code or changing frozen evidence. The current-status scan and diff check passed. | None. |
| Step 4.3.2 M1 foundational utilities, 2026-08-02 | Twenty utility/hash source inputs, their 52 live Algorithm32 consumers, three Flat32 utility consumers, and one bounded Flat32 named-import gate repair | 25-of-429 focused utility/identity/assembler specs; `npm run typecheck:algorithm32`; `npm run typecheck:flat32`; full Algorithm32 plus touched Flat32 Prettier check; exact old-path/import and target scans; `git diff --check` | Consolidated the inputs into 18 final files under `utils/{math,identity,validation,time}`, leaving 243 Algorithm32 files. Canonical SHA-256 and stable stringify/FNV remain distinct in one multi-operation identity module; finite/default acceptance joined the cohesive validation owner with direct cases. All live imports moved directly. The first Flat32 type check exposed the checkpoint's stale `NATIVE_48_POSITION_DOMAIN` import; replacing it with the already-exported `NATIVE_48_POSITION_DOMAIN_OWNER` preserved the selected domain and the rerun passed. Every final gate passed. | None. |
| Step 4.3.2 M2 preflight correction, 2026-08-02 | Source-organization plan and current continuity documents only; no production path | 110-edge quantity/domain consumer trace; ESM initialization and ownership analysis; Jasmine-name audit; corrected target scan | Retiring `domain-consts.js` into private support on the four executable classes and inline canonical IDs in leaf `consts.js` preserves exclusive ownership and avoids the rejected class/constant initialization cycle and family-root back-edge. The corrected manifest remains 245 rows and 268 unique targets, with 298 target references and 26 intentional duplicate groups. The focused filter now includes the three directly affected pure scattering-density transport specs for an expected 47-spec gate. | None. |
| Step 4.3.2 M2 quantities and executable domains, 2026-08-02 | Thirty quantity/domain inputs, their 110 live import/re-export edges, and the directly affected transport specification | 47-of-429 focused quantity/domain/transport specs; `npm run typecheck:algorithm32`; `npm run typecheck:flat32`; Algorithm32 Prettier check; exact old-path/import and 36-target scans; direct-class/export/fresh-copy/alias/literal checks; frozen-surface scan; `git diff --check` | Split the inputs into 36 final files under `quantities/{units,spectral}` and `domains/{direction/{cubed-sphere,fibonacci},position/spherical-native}`, leaving 249 Algorithm32 files. The four domain classes own class-exclusive generator facts privately; leaf constants own canonical instances and derived compatibility values; W27 and Native-48 helpers have only their approved named functions. Both family barrels preserve their prior named surface. Every required gate passed. | None. |
| Step 4.3.2 M3 capability-owned ambient interfaces, 2026-08-02 | Seven root ambient sources containing 79 declarations, 15 capability-owner targets, and four staged facade implementation links | Algorithm32 and Flat32 type checks; full Algorithm32 Prettier check; 443 name/kind identity comparison; combined 464-name duplicate scan; exact owner placement/count scan; retired-file/root-bucket and four-inline-import scans; protected-scope audit; `git diff --check` | Moved all 79 declarations to their 15 semantic owners with original names, kinds, order, and cumulative append behavior. Retargeted the four facade imports to their exact transient M3 paths, retired all seven legacy type files and the empty root `types/` bucket, and left later M6-M8 declaration roots intact. The tree contains 252 Algorithm32 files. Every gate passed with zero missing, duplicate, misplaced, or extra declaration. | None. |
| Step 4.3.2 M4 assemblers and cache foundations, 2026-08-02 | Seventeen old shader/cache paths, 23 final assembler/runtime-value/transport-contract/ground-constant/shared-cache targets, and all live consumers | Corrected 31-of-429 focused assembly/cache/identity specs; Algorithm32 type check; full Algorithm32 Prettier check; exact target/path/import/export scans; 15/4/30 cache and 10/6 shader declaration splits; M1 identity-owner, dependency-direction, runtime-cycle, frozen-surface, and diff scans | Atomically retired both mixed cache build/type sources, moved the direct shader base and two assemblers, established runtime cache values and transport construction contracts, and moved shared CPU source-cache storage. All 65 split ambient names occur exactly once, all 204 JavaScript/JSX relative-import owners resolve, the four hash consumers use only `utils/identity/value-hashes.js`, and the reachable M4 runtime graph is acyclic. The tree contains 258 Algorithm32 files. Every gate passed. | None. |
| Step 4.3.2 M5 GPU runtime and neutral transport owners, 2026-08-02 | Thirty-two manifest inputs moved to 33 live paths under GPU cache runtime/Three, cache and spectral transport, shared ground cache, and production references; one Flat32 backend import | Corrected 92-of-429 focused specs across 17 suites; Algorithm32 and Flat32 type checks; full Algorithm32 Prettier check; complete Node and Three/WebGL regressions; exact subtree/path/declaration/fixture/private-kernel/import/dependency/cycle/frozen-surface/diff scans | Separated cache execution from assembly, moved the concrete Three backend, recurrence provider, omitted-ground provider, and analytic fixture to their final owners, and merged all eight calculator-exclusive numerical kernels into private `SpectralCalculator` support. Focused specs passed 92/92; the full Node regression passed 429/429; and the approved Three/WebGL rerun passed 5/5 after the sandboxed Chrome launch was denied with `spawn EPERM`. Both type checks and formatting pass. The fixture blob is unchanged, all 443 Algorithm32 and 464 combined ambient names remain unique, every relative import resolves, runtime SCC and forbidden-edge counts are zero, frozen surfaces are unchanged, and `git diff --check` passes. The tree contains 259 Algorithm32 files. | None. |
| Step 4.3.2 M6 profiles and physical providers, 2026-08-02 | Twenty-two profile/canonical-atmosphere/Bruneton-color/uniform-Lambertian manifest inputs, their cumulative M3 declaration targets, nine Flat32 specifiers, and two Stage 10 imports | 36-of-429 focused physical-owner specs; Algorithm32 and Flat32 type checks; full Algorithm32 Prettier check; complete Node and Three/WebGL regressions; exact target/constant/declaration/initialization/literal/import/dependency/cycle/frozen-surface/diff scans; independent closure audit | Split and retired the mixed canonical constants and specification, moved all four physical owners to their final leaf directories, and preserved exact constant values, channel-row ordering, `1 / (5 * 683)`, and helper-to-channel-to-count initialization. Focused specs passed 36/36; the full Node regression passed 429/429; and the approved Three/WebGL rerun passed 5/5 after the sandboxed Chrome launch was denied with `spawn EPERM`. Both type checks and formatting pass. All 22 final targets exist, constant exports are exactly 4/10/2/10, declarations are exactly 10, 5/2, 4/1, and 2/1, every relative import resolves, runtime SCC and forbidden-edge counts are zero, frozen surfaces are unchanged, and `git diff --check` passes. The cumulative profile declaration merge intentionally leaves 258 Algorithm32 files. | None. |
| Step 4.3.2 M7 geometry owners, 2026-08-02 | Fourteen remaining geometry/endpoint inputs, three cumulative M3 declaration owners, seven external Algorithm32 specs, two Flat32 modes, and four Karma keys | 56-of-429 focused flat/spherical/endpoint specs; Algorithm32 and Flat32 type checks; full Algorithm32/touched-companion Prettier check; complete Node and Three/WebGL regressions; exact 19-file/constant/declaration/consumer/Karma/import/dependency/cycle/frozen-surface/diff scans | Established the singular shared/flat/spherical geometry tree and moved the geometry-specific Three endpoints without splitting either over-limit geometry class. Focused specs passed 56/56; the full Node regression passed 429/429; and the approved Three/WebGL rerun passed 5/5 after the sandboxed Chrome launch was denied with `spawn EPERM`. Both type checks and formatting pass. The tree has exactly 19 files and 42 geometry declarations, constants split 9/8, consumer edges are 5/6/2/2, all relative imports resolve, the four geometry Karma keys moved while the React key remained unchanged, runtime SCC and forbidden-edge counts are zero, frozen surfaces are unchanged, and `git diff --check` passes. The Algorithm32 tree contains 260 files. | None. |
| Step 4.3.2 M8 light-source and extraterrestrial/Sun owners, 2026-08-02 | Seventy light-source/fixture/synchronization inputs, 77 unique targets, four Flat32 consumers, and ten external edges across eight importers | 156-of-429 focused source/cache/transport/assembly specs across 25 suites; Algorithm32 and Flat32 type checks; full Algorithm32/touched-companion Prettier check; complete Node and Three/WebGL regressions; exact tree/target/retirement/export/constant/helper/declaration/fixture/import/external-edge/dependency/cycle/frozen-surface/diff scans; independent declaration and import audits | Established exact 79-file light-source and three-file extraterrestrial/Sun surfaces, merged the shadow configurator into five shared Three operations, split local constants 4/25, and distributed the cumulative ambient owner union without splitting either over-limit source class. Focused specs passed 156/156; the full Node regression passed 429/429; and the approved Three/WebGL rerun passed 5/5 after the sandboxed Chrome launch was denied with `spawn EPERM`. Both type checks and formatting pass. All 109 exports, 158 declarations, fixture bytes/hashes, and ten external edges are exact; every relative import resolves; runtime SCC and forbidden-edge counts are zero; frozen surfaces are unchanged; and `git diff --check` passes. The corrected final import count is 262 JavaScript clauses/257 relative, or 263/258 including the declaration import. The Algorithm32 tree contains 265 files. | None. |
| Step 4.3.2 M9 runtime owners, 2026-08-02 | Twenty-four model/reference/rendering/facade inputs, 28 target references, four external source edits, and four staged facade declaration links | 64-of-429 focused runtime specs across ten suites; Algorithm32 and Flat32 type checks; full Algorithm32/touched-companion Prettier check; complete Node and Three/WebGL regressions; exact tree/target/retirement/export/declaration/import/external-edge/browser/Karma/dependency/cycle/frozen-surface/diff scans; independent split and import audits | Established the exact 30-file runtime tree, split the mixed constants/declarations to reference and rendering owners, and moved `ShaderBuilder` intact for Step 4.4. Focused specs passed 64/64; the full Node regression passed 429/429; and the approved Three/WebGL rerun passed 5/5 after the sandboxed Chrome launch was denied with `spawn EPERM`. Both type checks and formatting pass. All 12 named exports, 28 runtime declarations, 52 owned import clauses, four external edges, and four final facade links are exact; every relative import resolves; browser inventory remains two files/five specs with unchanged Karma keys; runtime SCC and forbidden-edge counts are zero; frozen surfaces are unchanged; and `git diff --check` passes. The Algorithm32 tree contains 268 files. | None. |
| Step 4.3.2 M10 React adapter owner, 2026-08-02 | Six React/R3F inputs, one Flat32 runtime import, and one React-composer Karma key | 9-of-429 focused React-utility specs in one suite; Algorithm32 and Flat32 type checks; full Algorithm32/touched-companion Prettier check; complete Node and Three/WebGL regressions; exact tree/retirement/export/declaration/import/external-edge/Karma/browser/dependency/cycle/frozen-surface/diff scans; independent preflight and configuration audits | Moved the six inputs one-to-one into the exact six-file adapter tree, normalized the two ordinary filenames, retained the existing barrel surface, and moved no browser or declaration file. Focused specs passed 9/9; the full Node regression passed 429/429; and the approved Three/WebGL rerun passed 5/5 after the sandboxed Chrome launch was denied with `spawn EPERM`. Both type checks and formatting pass. All 16 export bindings, 23 owned clauses, nine reverse edges, the sole Flat32 import, and sole Karma-key replacement are exact; ambient totals remain unchanged; every relative import resolves; runtime SCC count is zero; frozen surfaces are unchanged; and `git diff --check` passes. The Algorithm32 tree remains 268 files. The unchanged portal replacement anchor remains spacing-sensitive and is not exercised by the retained browser inventory; the path-only batch did not alter its rules. | None. |
| Step 4.3.2 M11 root and document closure, 2026-08-02 | Root `package.json`, ten non-continuity current documents, four continuity owners, and 26 validated fileless legacy directories; no source, configuration, fixture, or frozen evidence path moved | Four focused analytic-fixture specs across two suites; Algorithm32 and Flat32 type checks; exact 260-file Algorithm32 code/declaration Prettier scope plus five Flat32 companions and Karma; complete Node, Three/WebGL, policy-integrity, and Flat32 UI lanes; exact manifest, tree, owner, path, export, declaration, import, cycle, JSON, package, current-document, frozen-surface, untracked whitespace/newline, and diff scans | Removed only `study:algorithm32-flat-local-cache-domain` from the package scripts, retained the policy-integrity command and unchanged lockfile, updated exactly the 14 current documents named by the M11 contract, and removed 26 verified fileless legacy directories. The live tree remains exactly 268 files with no empty subtree. Focused specs passed 4/4; both type checks and formatting pass; the full Node regression passed 429/429 in 112.131 seconds; the approved Three/WebGL rerun passed 5/5 and the approved Flat32 UI rerun passed 3/3 after their sandboxed Chrome launches were denied with `spawn EPERM`; policy integrity passed 1/1. All static, document, frozen-surface, whitespace, newline, and diff checks pass. | None. |
| Step 4.3.3 source-organization closure, 2026-08-02 | Independent read-only audit plus current-state corrections in four M11-authorized documents and final updates to the four continuity owners; no production, configuration, fixture, package, or frozen surface | Exact tree/kind/owner, checkpoint-manifest/live-target, class/export/filename/freeze, declaration, import resolution, runtime graph, Karma/browser, package, fixture-hash, frozen-surface, residual, document-link/anchor, tracked/untracked hygiene, and diff scans; completed M11 behavior evidence reverified as applicable | Reproduced the exact 268-file tree, 245 checkpoint rows, 298 target references, 268 live targets, 26 intentional merge groups, 443/464 declaration totals with zero duplicates, 577 resolved relative clauses, 131 runtime nodes with zero SCCs or forbidden edges, five Karma keys, two browser files, exact fixture hashes, retained 13-file frozen study, and clean package/frozen/hygiene state. A focused document audit found seven links that targeted archival stubs rather than archived headings, present-tense retired-Star authority wording, and one stale pending-import claim. The current documents were corrected; the rerun resolves all 195 relative file links and 54 relative anchors, treats Star evidence only as history, and passes `git diff --check`. Step 4.3 is complete. | None. |
| Step 4.4.1 matched geometry splits, 2026-08-03 | Both geometry facades; eight matched cache-coordinate, cache-module, shader-contribution, and Three scene collaborators; six class-local declaration files; shared public geometry request contracts; owner constants/types; and two Karma keys | Exact preflight prototype/arity and shader/cache/transport/content-hash comparison; 98-of-429 focused geometry/cache specs; both type checks; full Algorithm32 Prettier check; 429-spec Node regression; 5-spec Three/WebGL lane; 3-spec Flat32 UI lane; retained policy-integrity check; exact class/export/Karma/declaration/import/cycle/descriptor residual scans; independent read-only structure/type/JSDoc audit; `git diff --check` | Split the 2,664-line flat and 2,551-line spherical classes into ten named-only classes ranging from 355 to 849 lines. The facades retain their exact public prototypes and geometry-specific physical cores; collaborators have matched roles without shared executable physics. Exact declaration hashes and all five cache-module content hashes per geometry are unchanged. Focused specs passed 98/98; both type checks and formatting pass; Node passed 429/429 in 97.816 seconds; approved browser reruns passed 5/5 and 3/3 after sandbox `spawn EPERM`; policy integrity passed 1/1. The independent audit confirmed every runtime boundary and found three declaration-only placement/documentation defects, all corrected before the final type, formatter, uniqueness, and snapshot reruns. The 282-file tree has 490 unique combined ambient declarations, 613 resolved relative clauses, 139 runtime nodes, zero cycles, exact new Karma keys, no old facade key, and no descriptor/manifest/factory residual in the collaborators. | None. |
| Step 4.4.2 matched light-source splits, 2026-08-03 | Local- and distant-Sun facades; six matched cache, shader-contribution, and Three scene collaborators; one distant Three constant owner; four class-local and two public Three declaration owners; shared endpoint-policy unions; and one recast/extended distant specification | Exact preflight prototype/default/arity, ten facade-result hashes, twelve normalized module hashes, twelve cache-module content hashes, and identity/freshness comparison; 157-of-430 focused source/cache/transport/assembly specs; both type checks; full 287-file Algorithm32 Prettier check; 430-spec Node regression; 5-spec Three/WebGL lane; 3-spec Flat32 UI lane; retained policy-integrity check; exact class/export/declaration/import/cycle/descriptor residual scans; two independent read-only structure/type/JSDoc audits; `git diff --check` | Split the 1,233-line local and 1,228-line distant source classes into eight named-only classes ranging from 43 to 892 lines. Each facade retains its exact public prototype and physical core; matched cache, shader, and Three roles share no source-specific executable behavior. Every preflight hash and identity/freshness observation is exact. Focused specs pass 157/157; both type checks and formatting pass; the final Node rerun passes 430/430 in 98.23 seconds; approved browser gates pass 5/5 and 3/3; and policy integrity passes 1/1. Independent audits found only constructor-contract placement, duplicated inline unions, return-tag separators, and collaborator wording defects, all corrected before final type, formatter, declaration, import, cycle, snapshot, and Node reruns. The 295-file tree has 518 unique combined ambient declarations, 627 resolved relative clauses, 146 production runtime nodes, zero cycles or cross-source edges, unchanged Karma configuration, and no descriptor/manifest/factory/barrel residual in the collaborators. | None. |
| Step 4.4.3 ShaderBuilder split, 2026-08-03 | Public `ShaderBuilder`; deterministic `ShaderAssemblyPreparer`; Three `ShaderRuntimeInstaller`; one installer-local declaration file; rendering public contracts; and the cross-provider assembly fixture | Exact public prototype/arity, direct and automatic assembly/source/fragment hashes, contribution and binding order, cache-controller identity/reuse, runtime installation/disposal sequence; 21-of-430 focused rendering/cross-provider specs; both type checks; full 290-file Algorithm32 Prettier check; 430-spec Node regression; 5-spec Three/WebGL lane; 3-spec Flat32 UI lane; retained policy-integrity check; exact class/export/helper/declaration/import/cycle/residual/whitespace/newline/diff scans | Split the 1,073-line mixed builder into three named-only classes of 320, 328, and 489 lines. The facade retains its exact public API and cache lifecycle transaction; deterministic assembly and Three installation now have separate owners. Direct and automatic source/fragment hashes, provider/binding order, controller reuse, cache-binding order, capture-before-pass installation, rollback, and disposal match the pre-split checkpoint. The stale cross-provider fixture now exercises the preparer's public assembly method instead of a retired private builder helper. Focused specs pass 21/21; both type checks and formatting pass; Node passes 430/430 in 101.24 seconds; approved browser reruns pass 5/5 and 3/3 after sandbox `spawn EPERM`; and policy integrity passes 1/1. The 298-file tree has 526 unique combined ambient declarations, 634 resolved relative clauses, 148 production runtime nodes, zero duplicate ambient names, cycles, over-limit classes, or descriptor/manifest/factory/barrel residual in the collaborators, and passing hygiene checks. | None. |
| Step 4.5.1 helper-ownership inventory, 2026-08-03 | Canonical helper-ownership inventory, three mutually exclusive production-row appendices, and current continuity documents; no production source | TypeScript-AST inventory; three independent domain partitions; exact source-identity, module-coverage, row-uniqueness, role-count, multi-export, profile, test-support, and consumer checks; both type checks; `git diff --check` | Covered all 148 production JavaScript/JSX modules at SHA-256 source identity `4aeeb00102d4713f3f31f219cdf9d71092a64d241279fd7e60411f0e84e090af`. Recorded 697 production operations plus three exported profile values and eleven reused test-support operations for 711 authoritative rows. Listed all 24 multi-export function modules separately, eight existing namespace owners, no named factory owner, and 95 lexical construction candidates without treating names as dispositions. Every consumer trace is explicit; `sourcePathLimitDistanceToMeters` is the sole operation with no current consumer. No implementation path or behavior changed. | None. |
| Step 4.5.2 class-independent applicability classification, 2026-08-03 | Canonical helper-ownership classification, four exact classification appendices, inventory checkpoint update, and current continuity documents; no production source | Exact source-identity, 711-key equality/uniqueness, disposition/role/partition totals, return-owner, multi-export, construction-candidate, profile, test-support, rationale, whitespace, newline, link, and diff checks; three independent partition/support audits; both type checks | Classified all 711 rows as 286 `keep-on-class`, 211 `return-to-class`, and 214 `class-independent`. Of 290 class operations, 286 stay on class and four have demonstrated equivalent current contracts across owner boundaries. Every return row names an existing class. All 24 multi-export modules were decided function-by-function; two have mixed dispositions. The 95 construction-shaped candidates classify as 4 keep, 67 return, and 24 independent without pre-deciding factory retention. All ten profile operations/values and eleven reused test-support rows are independent. No ambiguity, exception, production path, export, declaration, or behavior change remains in this decision-only step. | None. |
| Step 4.5.3 helper-ownership target design, 2026-08-03 | Canonical helper-ownership target plan, four exact target appendices, inventory/classification checkpoint updates, and current continuity documents; no production or test source | Exact source-identity, 711-key equality/uniqueness, target/action/batch completeness, 95-candidate production construction closure, separate profile/test-support scope, 24-module split, seven-collision, namespace cohesion, class-method target, class-size, whitespace, newline, link, and diff checks; independent runtime/support and cross-partition audits; both type checks | Assigned every row one exact semantic owner and atomic batch. Selected 20 cohesive namespace modules, returned private support to instance methods while reusing recorded public class contracts, retained only justified ordinary owners, planned the sole unused removal, and kept every receiving class below 1,000 projected lines through the distant provider/evaluator refinement. The independent audit moved the generic viewport-count normalizer from the proposed R3F owner into the nine-method cross-partition `PixelMath` cohort and corrected supplemental test/JSDoc scope before closure. All 95 production construction candidates defer callable form without contaminating the ten test-only rows. No production/test source, path, export, declaration, or behavior changed. | None. |
| Step 4.5.4 namespace migrations, 2026-08-04 | Eighty-nine immediate foundation, physical, and runtime rows; ten namespace owners; 31 receiving class rows; six superseded ordinary modules; directly affected declarations, tests, Flat32 companions, and current continuity documents | Focused transaction gates; both type checks; 295-file Algorithm32 Prettier check; complete Node, Three/WebGL, Flat32 UI, and policy-integrity lanes; exact namespace/export/path/deferred-seam/import/cycle/class-size/whitespace/newline/diff scans | Implemented all 89 immediate rows: 20 foundation, 51 physical, and 18 runtime. Ten complete namespaces occupy their planned owners, 31 class-specific rows returned to their classes, the sole unused export and six superseded ordinary modules are gone, and no Step 4.5.5 construction/profile decision was introduced early. The Node regression passed 438/438; browser lanes passed 5/5 and 3/3; policy integrity passed 1/1; both type checks, formatting, and every static and hygiene gate passed. | None. |
| Step 4.5.5 factory and profile reconciliation, 2026-08-04 | Two hundred sixty-four gated foundation, physical, runtime, profile, and test-support rows; their exact production owners, declarations, specifications, Flat32 companions, and current continuity documents | Focused transaction and identity/freshness gates; both type checks; 279-file Algorithm32 Prettier check; complete 456-spec Node, 5-spec Three/WebGL, 3-spec Flat32 UI, and 1-spec policy-integrity lanes; exact row/owner/export/retired-path/test-containment/import/cycle/class-size/whitespace/newline/diff scans; independent ledger and static audits | Implemented all 264 gated rows and all 157 non-deferred exact owner/symbol assignments. Of 95 production construction candidates, 80 survive with demonstrated lifecycle, allocation, orchestration, cohesive-namespace, inseparable-algorithm, or typed-profile contracts; 15 wrapper or one-shot callables and 37 superseded paths are gone. All ten test construction rows remain test-only. Native-15 now has one complete typed default with every supported override and explicit direct-40 differences. The 287-file tree has 131 production modules; all focused, type, formatter, regression, browser, policy, independent-audit, static, and hygiene gates passed. | None. |
| Step 4.5.6 independent helper-ownership closure, 2026-08-04 | Settled live Step 4.5.5 tree plus reconciliation ledger, plan, helper continuity owners, source-organization status, and active checkpoint; no production, test, declaration, Flat32, package, fixture, or configuration source changed | Independent semantic and TypeScript-AST/static ownership audits; exact tree/class/namespace/ordinary-owner/factory/profile/export/retired-path/test-containment/import/cycle/declaration/class-size/hygiene scans; 166 focused helper/namespace specs; both type checks; exact 279-file Prettier scope; complete Node, Three/WebGL, Flat32 UI, and policy-integrity lanes; `git diff --check` | Reproduced the exact 287-file tree, 131 production modules, 67 sole-class modules, 20 planned named namespaces plus eight retained math namespaces, five justified ordinary callable owners, 599 resolved relative clauses, zero cycles or production-to-test edges, and 601 unique ambient names across 76 declaration files. All 37 retired paths remain absent; the Native-15 default and identity are exact; no helper disposition, compatibility export, factory owner, ambiguity, or exception remains. Focused specs passed 166/166; both type checks and formatting passed; Node passed 456/456 in 85.651 seconds; approved browser reruns passed 5/5 and 3/3 after sandbox `spawn EPERM`; policy integrity passed 1/1; and all hygiene gates passed. Step 4.5 is complete. | None. |
| Step 5 ambient-type reconciliation and independent closure, 2026-08-04 | Complete Algorithm32 ambient declaration and directly typed JSDoc surface, the one affected Flat32 renderer boundary, and current continuity documents | Independent public/private transitive-placement audit; TypeScript/JSDoc AST interface, imported-type, union, member-documentation, callable-shape, duplicate-name, parse, dependency-closure, and residual scans; both type checks; exact 287-file Algorithm32 formatter scope plus affected Flat32 companions; complete Node, Three/WebGL, Flat32 UI, and policy-integrity lanes; whitespace, final-newline, and `git diff --check` | Re-homed every interface and public/class-only contract, removed all 63 `import(...)` expressions through canonical ambient or explicit runtime boundaries, and replaced all 43 inline string-union occurrences plus 27 inline callable shapes. The final 295-file tree has 81 Algorithm32 declaration files, 61 documented named string unions, 722 unique global ambient names and 728 unique scope-aware declaration keys across 84 combined Algorithm32/Flat32 declaration files, with zero duplicate or prohibited residual. The independent audit found and corrected 19 transitive placement defects and one residual inline test artifact contract before closing cleanly. Both type checks and formatting pass; Node passes 456/456 in 92.879 seconds; approved browser reruns pass 5/5 and 3/3 after sandbox `spawn EPERM`; policy integrity passes 1/1; and all static and hygiene gates pass. Step 5 is complete and supplied the settled Step 6.1 input. | None. |
| Step 6.1 documentation inventory, 2026-08-04 | Canonical documentation inventory, three row appendices, reconciliation plan, ledger, active checkpoint, and current continuity pointers; no implementation, declaration, test, fixture, configuration, or behavior source changed | Two independent TypeScript-AST target scans; exact source identity, file/surface, row-key, syntax-node, documentation-presence, location, parse, union-member, appendix-row, and appendix-file closure; both type checks; link, whitespace, final-newline, and `git diff --check` | Inventoried all 287 Algorithm32 JavaScript, JSX, and declaration files at source identity `sha256:1268df865e9cbecd99f9d56c35a9d4a92acf74505011b23648d0368ec8c3c68f`. The 6,475 unique rows comprise 3,057 declaration, 1,742 production, and 1,676 test/browser entities and callables; seven re-export-only barrels are explicitly targetless. Both AST passes agree with zero missing, extra, duplicate, parse, location, documentation-presence, or appendix mismatch. The inventory records 4,383 currently documented/tagged rows, 2,092 missing rows, exact current/required forms and callable-tag evidence, 73 async rows, no generator or error class, two ambient overload groups, and exact documentation for all 61 named string unions and 183 members. Both type checks and all document/hygiene gates pass. Step 6.1 is complete and Step 6.2 is current. | None. |
| Step 6.2 description and type-documentation closure, 2026-08-04 | All 287 inventoried Algorithm32 JavaScript, JSX, and declaration files; refreshed documentation inventory and appendices; reconciliation plan, ledger, and active checkpoint; comments and formatter layout only | Stable per-file AST-row comparison; independent syntax-node, documentation-presence, parse, appendix, union, legacy-wording, and normalized semantic-AST checks; both type checks; exact formatter scope; complete Node, Three/WebGL, Flat32 UI, and policy-integrity lanes; whitespace, final-newline, and `git diff --check` | Retained all 6,475 rows and closed exactly 3,398 entity/value noun descriptions, 99 `Creates ...` constructors, 2,235 `Called by <owner> to ...` internal/callback descriptions, and 743 `Call this method/function to ...` public callables. The before/after audit finds zero missing/extra stable row, changed kind, semantic-AST token, parse, documentation, appendix, union, or legacy-form mismatch across current identity `sha256:263668a3391b56ed1b6b2143af9d7cecbf41d5bf7a54c263b4ec99b69633b824`. Both type checks and formatting pass; Node passes 456/456 in 90.148 seconds; approved browser reruns pass 5/5 and 3/3 after sandbox `spawn EPERM`; policy integrity passes 1/1; and hygiene gates pass. Step 6.2 is complete and Step 6.3 is current. | None. |
| Step 6.3 callable-contract closure, 2026-08-04 | All 287 inventoried Algorithm32 JavaScript, JSX, and declaration files; refreshed documentation inventory and appendices; reconciliation plan, ledger, and active checkpoint; JSDoc and semantics-preserving formatter layout only | Exact parameter/return/throw separator and tag closure; direct-throw, complex-return-selection, overload, async rejection/cancellation, stable-row, syntax-kind, parse, appendix, union, description-form, and normalized semantic-AST audits; both type checks; exact formatter scope; complete Node, Three/WebGL, Flat32 UI, and policy-integrity lanes; whitespace and `git diff --check` | Closed 2,739 parameter, 2,272 return, and 288 error tag lines with zero missing required tag, excess callable tag, or separator defect. All 73 async rows state rejection and cancellation or explicit non-cancellability. Both renderer overload groups distinguish vector and scalar call shapes. The independent body audit finds 248 directly throwing callables and 201 complex return-selection contracts with zero missing error or selection documentation. All 6,475 stable rows and normalized semantic AST tokens match the pre-rewrite baseline at source identity `sha256:410a525fc7afc56001b3a14d75e0181440c1f99b3e625ead136a2e6e9b85acdc`. Both type checks and formatting pass; Node passes 456/456 in 94.129 seconds; approved browser reruns pass 5/5 and 3/3 after sandbox `spawn EPERM`; policy integrity passes 1/1; and hygiene gates pass. Step 6 is complete and supplied the settled Step 7.1 input. | None. |

| Step 7.1 unit-bearing-name classification, 2026-08-04 | Canonical unit-bearing name inventory, reconciliation plan, ledger, and active checkpoint; no implementation, declaration, test, fixture, configuration, or behavior source changed | TypeScript-AST identifier scan; embedded-shader lexical scan; method/function/member/object-key, quoted-key, JSON, class/type-property, and durable-boundary review; inventory arithmetic; document and diff hygiene | Classified the conservative unit-bearing-name surface as normalized JavaScript locals, shader-local bindings, explicit unit operations, private unit-normalizing computations, platform APIs, and one durable diagnostic contract requiring a neutral unit-bearing value. | None. |
| Step 7.2 durable unit-bearing contract migration, 2026-08-04 | Bruneton color display diagnostic result, focused specification, canonical unit-bearing name inventory, reconciliation plan, ledger, and active checkpoint | Current-property scan; 8-spec focused Bruneton lane; both type checks; full Algorithm32 formatter scope; 456-spec Node regression; 5-spec Three/WebGL lane; 3-spec Flat32 UI lane; 1-spec policy-integrity lane; `git diff --check` | Published neutral diagnostic `cieTableResolution: {value: 1, units: 'nanometers'}` and added focused positive coverage of that current contract. Focused specs pass 8/8; both type checks and formatting pass; Node passes 456/456 in 92.512 seconds; approved browser reruns pass 5/5 and 3/3 after sandboxed Chrome launch returned `spawn EPERM`; policy integrity passes 1/1; and hygiene passes. Step 7 is complete. | None. |
| Step 8.2 foundation, adapter, GPU, and runtime binding migration, 2026-08-04 | Exact 55-row Step 8.2 appendix; 47 mapped implementation, declaration, test/browser, destructuring, and authored-shader renames; adjacent SHA-256 formula citation; current continuity documents | Post-edit TypeScript-AST and authored-shader discovery; exact mapped semantic-scope residual review; 61 focused specs; both type checks; complete Algorithm32 formatter scope; 456-spec Node regression; 5-spec Three/WebGL lane; 3-spec Flat32 UI lane; 1-spec policy-integrity lane; `git diff --check` | Applied all 47 descriptive renames without changing external object keys or third-party members. Retained only the eight FIPS 180-4 SHA-256 working variables `a`-`h` and added their adjacent citation. The current source identity is `sha256:80d7ce9b636b18046b88d6baf7f2a0cbe310aef8e3a9a84cab8347185e42fc83`, with zero mapped residual in its original semantic scope. Focused specs pass 61/61; both type checks and formatting pass; Node passes 456/456 in 93.735 seconds; approved browser reruns pass 5/5 and 3/3 after sandboxed Chrome launch returned `spawn EPERM`; policy integrity passes 1/1; and hygiene passes. Step 8.2 is complete. | None. |
| Step 8.3 atmosphere, color, domain, and geometry binding migration, 2026-08-04 | Exact 107-row Step 8.3 appendix; mapped implementation, declaration, specification, Three-adapter, and authored-GLSL renames; current continuity documents | Post-edit TypeScript-AST and authored-shader discovery; exact same-path/name residual review; complete 107-spec atmosphere/color/domain/geometry focused lane; both type checks; complete Algorithm32 formatter scope; 456-spec Node regression; 5-spec Three/WebGL lane; 3-spec Flat32 UI lane; 1-spec policy-integrity lane; `git diff --check` | Applied all 107 descriptive renames, including paired CPU/GLSL phase, quadratic, direction-domain, intersection, interpolation, and cache-sampling bindings, without changing public object keys. The current source identity is `sha256:810b2c0f0478b341baa76ce8c56f672a2a9eacd2988639d4fc671ef60ea20eed`, with zero same-path/name residual for the exact map. Focused specs pass 107/107; both type checks and formatting pass; Node passes 456/456 in 106.412 seconds; approved browser reruns pass 5/5 and 3/3 after sandboxed Chrome launch returned `spawn EPERM`; policy integrity passes 1/1; and hygiene passes. Step 8.3 is complete. | None. |
| Step 8.4 extraterrestrial, light-source, and transport binding migration, 2026-08-04 | Exact 88-row Step 8.4 appendix; mapped Sun-synchronization, distant/local/shared source, cache-controller/provider/evaluator, field-support, Three-adapter, declaration, specification, and transport renames; current continuity documents | Post-edit TypeScript-AST and authored-shader discovery; exact same-path/name residual review; complete 175-spec extraterrestrial/light-source/transport focused lane; both type checks; complete Algorithm32 formatter scope; 456-spec Node regression; 5-spec Three/WebGL lane; 3-spec Flat32 UI lane; 1-spec policy-integrity lane; `git diff --check` | Applied all 88 descriptive renames without changing serialized identities, public object keys, scattering-order semantics, or radiometric stages. The current source identity is `sha256:cb9ee9cc20b896b2ca504fe74063859b6e32bc41d27dea1635b9f9af4aa5825d`, with zero same-path/name residual for the exact map. Focused specs pass 175/175; both type checks and formatting pass; Node passes 456/456 in 85.803 seconds; approved browser reruns pass 5/5 and 3/3 after sandboxed Chrome launch returned `spawn EPERM`; policy integrity passes 1/1; and hygiene passes. Step 8.4 is complete. | None. |
| Step 8.5 independent short-name closure, 2026-08-04 | Settled Step 8 implementation tree; canonical migration map and three appendices; reconciliation plan, ledger, and active checkpoint; no implementation, declaration, test, browser, fixture, configuration, or behavior source changed | Independent TypeScript-AST and authored-shader discovery; exact 242-row replacement/residual audit; retained-context, longer-name, formula-authority, public-key alias, import/export/cycle/test-containment, type, formatter, complete Node, Three/WebGL, Flat32 UI, policy-integrity, whitespace, final-newline, and diff gates | Reproduced all 242 descriptive migrations at source identity `sha256:cb9ee9cc20b896b2ca504fe74063859b6e32bc41d27dea1635b9f9af4aa5825d`. All 287 code/declaration files contain 7,948 AST bindings; the remaining 161 short bindings are exactly 153 accepted contextual conventions plus the eight cited SHA-256 variables. The 690 shader declarations contain zero short name; 2,190 current four-to-six-character AST declarations and 26 unique shader names contain no unexplained opaque binding. Thirteen representative public-key aliases remain exact; all 597 relative clauses resolve with zero cycle or production-to-test edge. Both type checks and formatting pass; Node passes 456/456 in 89.031 seconds; approved browser reruns pass 5/5 and 3/3 after sandbox `spawn EPERM`; policy integrity passes 1/1; and hygiene passes. Step 8 and R9 are complete with no ambiguity or exception. | None. |
| Step 9 final verification and reconciliation closure, 2026-08-04 | Complete reconciled Algorithm32 tree, affected Flat32 build/runtime companions, canonical standards and inventories, reconciliation plan and ledger, dependent production integration plan, and active checkpoint | Independent 57-batch evidence audit; complete code/type/JSDoc/naming/unit/import/class/module/document standards rescans; both type checks; full formatter scope; 456-spec Node regression; Flat32 production and browser-test builds; 5-spec Three/WebGL and 3-spec Flat32 UI lanes; 1-spec policy-integrity lane; 29-document link/anchor audit; whitespace, final-newline, and diff hygiene | Corrected one stale parent status, three renamed parameter tags, and twelve inline ambient callback signatures through seven named callable contracts. The final 295-file tree contains 287 code/declaration files, 67 class modules, and 6,477 fully documented rows with zero standards finding. Naming closure retains only 153 accepted contextual short bindings and eight cited SHA-256 symbols; all 597 relative clauses resolve without cycle or production-to-test edge. Both type checks and formatting pass; Node passes 456/456 in 81.154 seconds; approved browser reruns pass 5/5 and 3/3 after sandbox `spawn EPERM`; the Flat32 builds and policy 1/1 pass; 441 links and 23 anchors resolve; and hygiene passes. R1-R9 are complete, all ambiguity decisions are implemented, and no exception remains. | None. |

## Observed Reconciliation Work

### Formatting, Naming, And File Structure

- The initial leading-space scan matched only the conventional ` *` JSDoc
  marker. Steps 3.1 and 3.2 adopted exact root development dependency Prettier
  3.9.6 and root `.prettierrc.json`, then formatted all 237 Algorithm32
  JavaScript, JSX, and ambient-declaration files with tabs and required
  semicolons. Explicit file globs excluded the four checked JSON/configuration
  files and four Markdown files. The formatter check passes.
- Step 3.3 renamed all 15 surviving ordinary camelCase modules to kebab-case
  in three dependency-safe batches. All production imports, re-exports,
  tests, and browser entries use the new paths. The current source scan finds
  zero ordinary camelCase JavaScript or JSX filenames; historical baseline
  inventories and isolated experiment copies retain their original evidence
  paths outside this current-production finding.
- Steps 4.4.1-4.4.3 split both former over-limit geometry classes into
  matched five-class owner groups, both former over-limit light sources into
  matched four-class owner groups, and `ShaderBuilder` into its public
  lifecycle facade plus deterministic assembly and Three installation owners.
  All 21 resulting classes are below 1,000 lines, and the complete current
  class scan has no over-limit implementation.
- Step 4.1 removed the redundant default aliases from `DistantSunCache.js`,
  `DistantSunCacheController.js`, `CacheGpuExecutor.js`, and
  `CachePassAssembler.js`, plus the matching executor and assembler ambient
  declarations. Every implementation and declaration now exports exactly its
  named class; no current consumer required migration.
- Step 4.2 removed all 12 `Object.freeze` calls from the now-final
  `atmospheres/canonical/consts.js` owner: two outer map freezes and ten
  nested-array freezes.
  Both pass maps now use
  `Readonly<Record<CachePassKind, readonly string[]>>` JSDoc contracts while
  retaining their literal keys, values, ordering, and distinct arrays.
- Step 4.3 now precedes the production class splits. Its completed
  [source-organization migration plan](../algorithm32/source-organization-plan.md)
  maps all 245 current files to exclusive or demonstrated nearest-common
  owners, resolves assembly/execution/provider and light-source/solar
  boundaries, defines M1-M11 with gates, and records every live companion
  consumer. No root interface/constant bucket or unsupported placeholder
  directory is created. Step 4.3.2 batches M1-M11 and Step 4.3.3 are complete
  and fully gated. Steps 4.4.1-4.4.3 are also complete and fully gated.
  Steps 4.5.1-4.5.3 completed the read-only helper inventory,
  class-independent applicability classification, and exact namespace/class
  target plan. Step 4.5.4 implemented and gated all 89 immediate rows, and
  Step 4.5.5 implemented and gated all 264 construction/profile/test-support
  rows. Step 4.5.6 independently reproduced the settled helper-ownership tree
  and closed every required gate with no finding or exception. Step 5 then
  reconciled and independently closed the complete ambient type surface.
  Step 6.1 then inventoried the full documentation surface, Step 6.2
  completed every description form, and Step 6.3 completed all callable tags,
  error/overload contracts, complex return selection, and async outcomes
  without changing behavior. Steps 7 through 9 are complete.
- The former 1,186-line `shader-builder.spec.js` was split into the
  371-line assembly specification, 379-line runtime specification, and
  480-line `ShaderBuilderTestSupport.js` namespace. The 1,651-line
  `StarGroundGpuParityHarness.js` was retired under A1; neither module has a
  size exception.
- The baseline 13 JSON files are classified in the A2 trace. Step 1.2 retired
  eight Star-derived records and Step 1.3 retired the empty scaffold. The four
  remaining configuration, checked-fixture, and policy files have recorded
  non-generated classifications.

### Types And Ambient Declarations

- Step 5 is complete. All 45 Algorithm32 interfaces occupy their nearest
  basename `types.d.ts`; all 34 dedicated class declaration files match their
  implementation owner; and all 155 dedicated aliases are class-only and
  dependency-closed. Transitive public-API closure reaches zero dedicated
  private alias, while the reverse scan finds zero private-only alias in a
  public declaration owner.
- All 63 imported type expressions from the settled Step 5 input are gone.
  Canonical ambient contracts and explicit public runtime boundaries replace
  them without `import type`, type-only export/specifier, `declare`, `any`,
  local JSDoc typedef bridge, or public dependency on a class-private protocol.
- The final surface has 61 named ambient string unions and zero inline string
  union. Every permitted literal has one exact bolded member bullet. The final
  callable scan likewise has zero inline TypeScript or JSDoc parameter/return
  type literal after naming all 27 settled occurrences.
- Algorithm32 contains 81 declaration files. Together with Flat32, the 84-file
  declaration surface has 722 unique global ambient names and 728 unique
  scope-aware declaration keys, with zero duplicate or parse diagnostic. The
  tree has no current `ExtraterrestrialSource` declaration and no syntax-based
  root interface bucket.

### JSDoc

- Steps 6.1-6.3 are complete. The canonical
  [documentation inventory](../algorithm32/documentation-inventory.md) covers
  all 287 Algorithm32 code/declaration files at current source identity
  `sha256:410a525fc7afc56001b3a14d75e0181440c1f99b3e625ead136a2e6e9b85acdc`
  in 6,475 unique rows: 3,057 declaration, 1,742 production, and 1,676
  test/browser entities and callables. Its appendices retain every completed
  description form, required form, and callable contract.
- All 6,475 rows now have their required description form: 3,398 entity/value,
  99 constructor, 2,235 internal/callback, and 743 public-callable rows. The
  source contains 2,739 `@param`, 2,272 `@returns`, and 288 error tag lines
  with zero missing required tag, excess callable tag, or separator defect.
  All 73 async rows define rejected and cancelled or explicitly non-
  cancellable outcomes.
- No generator or error class exists in the settled source. Exactly two
  ambient method overload groups distinguish vector and scalar call shapes.
  All 61 named string unions and their 183 members retain exact documentation.
  The 248 directly throwing callables and 201 complex value-return contracts
  have complete error and selection documentation. Stable-row and normalized
  semantic-AST comparisons find zero mismatch from the Step 6.1 input. Steps
  7 through 9 are complete.

### Physical Data, Validation, And Descriptors

- Step 7.1's canonical
  [unit-bearing name inventory](../algorithm32/unit-bearing-name-inventory.md)
  conservatively supersedes the unmaterialized initial 90-candidate count. Its
  172-name superset retains 88 normalized JavaScript locals, 52 shader-local
  bindings, 29 unit-explicit callables/private methods, and two platform API
  false positives. Step 7.2 leaves the Bruneton diagnostic contract as neutral
  `cieTableResolution` carrying `{value: 1, units: 'nanometers'}`. Focused and
  complete verification gates pass.
- Step 8.1's canonical
  [short-name migration map](../algorithm32/short-variable-migration-map.md)
  covers 448 exact declarations: 302 one-to-three-character AST bindings, 28
  authored-shader declarations, and 118 manually selected context-review
  rows. The audit excludes 198 accepted unambiguous conventions from the
  migration tables. The remaining 250 rows comprise 242 descriptive renames
  and only the eight SHA-256 working-variable formula symbols `a`-`h` under
  NIST FIPS 180-4 sections 2.2.1 and 6.2.2 [6]. The non-overlapping migration
  appendices assign 55 rows to Step 8.2, 107 to Step 8.3, and 88 to Step 8.4;
  their actionable rename counts are 47, 107, and 88. Step 8.2 applied all
  47 renames, retained the eight cited SHA-256 symbols, and closed its focused
  and complete verification gates at source identity
  `sha256:80d7ce9b636b18046b88d6baf7f2a0cbe310aef8e3a9a84cab8347185e42fc83`.
  Step 8.3 applied all 107 atmosphere, color, domain, and geometry renames and
  passed its focused and complete verification gates at source identity
  `sha256:810b2c0f0478b341baa76ce8c56f672a2a9eacd2988639d4fc671ef60ea20eed`.
  Step 8.4 applied all 88 extraterrestrial, light-source, and transport
  renames and passed its focused and complete verification gates at source
  identity
  `sha256:cb9ee9cc20b896b2ca504fe74063859b6e32bc41d27dea1635b9f9af4aa5825d`.
  Step 8.5 independently reproduced all 242 migrations, found only the 153
  accepted contextual bindings and eight cited SHA-256 symbols, and passed
  every type, formatter, regression, browser, policy, import, and hygiene gate.
  Step 8 and R9 are complete.
- The initial descriptor scan found no runtime use of descriptor metadata as a
  validation input. It found an explicit descriptor non-validation assertion
  in `shader-compatibility-validator.spec.js`. Complete a manual ingress and
  descriptor-use trace before accepting this area.

### Validation Findings

- 72 non-test Algorithm32 modules contain `assert*`, `validate*`, `typeof`,
  `Array.isArray`, or finite-value checks. This is an inventory of validation
  candidates, not proof that all 72 violate the rule. Classify every check as
  a true external ingress semantic check, an allowed operating-environment or
  lifecycle capability check, or unneeded downstream type/shape validation.
- Step 2.2 records the owner and disposition of every candidate in the
  [Algorithm32 validation candidate inventory](../algorithm32/validation-inventory.md).
  Of the raw 74 lexical matches, `caches/index.js` is an assertion re-export
  and `three/types.d.ts` is declaration-only `typeof import(...)`; the
  remaining 72 are executable candidates.
- Step 2.3 removed the test-only `assertDenseScalarArrayLayout()` API and its
  `assertImmutableDescriptorRecord()` descriptor-shape dependency. The dense
  layout factory remains the sole owner of its caller-ingress semantics;
  metadata copies are ambient-contract data rather than a validation boundary.
- The [method-level validation analysis](../algorithm32/validation-reconciliation-analysis.md)
  completed Step 2.4's three removal batches and Step 2.5's trace of every
  remaining Mixed/Rehome candidate. It preserves required ingress, physical,
  numerical-degeneracy, lifecycle, and renderer-adapter checks, and owns the
  three bounded implementation batches 2.6 through 2.8. No missing semantic
  ingress check was found.
- The initial ingress set includes public facade configuration in
  `Algorithm32.js`, renderer attachment/build inputs in `ShaderBuilder.js` and
  `SceneInputCapture.js`, Three/WebGL capability inputs in
  `ThreeCacheBackend.js`, and public model/source/geometry configuration
  constructors. Preserve their finite-value, supported-value, resource,
  lifecycle, and environment-capability checks; do not preserve a check merely
  because it tests JavaScript object shape or member presence.
- `assertDenseScalarArrayLayout()` is only called by its own tests. Its
  descriptor-field, hash, and plain-object checks, plus the supporting
  `assertImmutableDescriptorRecord()` path, are unused by production code.
  Remove or move that legacy validation API out of production after preserving
  the behavior that the actual descriptor factory requires at its ingress.
- The source-shape `_tests/scaffold.spec.js` was retired in Step 1.3. Its
  filename, declaration-placement, interface-shape, and import assertions are
  source-audit concerns under the current Code and Type Conventions, not
  observable-behavior tests.
- `Reference.js`, `SpectralCalculator.js`, `CanonicalAtmosphere.js`, and the
  geometry classes contain repeated object-shape and member checks after their
  collaborators or values have crossed an earlier owner boundary. Trace each
  call site and remove downstream type/shape validation while retaining
  semantic checks at the actual external ingress.
- No missing semantic validation is confirmed by the initial lexical scan.
  The required next audit maps every public Algorithm32 configuration, renderer
  attachment, fixture/policy loader, and browser capability boundary to its
  finite-value, supported-value, resource, lifecycle, and capability checks.
  Add only a missing semantic check identified by that map; do not add runtime
  object-shape checks that ambient contracts already own.

### Ingress Map (Step 2.1)

The table identifies the one owner for every external Algorithm32 boundary.
“Candidate in 2.2” means a check at that boundary may still be necessary for
runtime capability or lifecycle facts, but its JavaScript object/member shape
is owned by the ambient contract and must be classified separately.

| Boundary | External input | Validation owner | Retained semantic checks | Static-shape disposition |
| --- | --- | --- | --- | --- |
| Facade configuration | `new Algorithm32(config)` and `setConfig(config)` | `Algorithm32._acceptConfigValues()` | Positive interval counts; supported scattering orders and path distributions; rejection of the unsupported debug-view feature. | Config wrapper and collaborator member shape are candidates in 2.2. |
| Spectral and unit data | `createUnitValue()`, `SpectralBasis`, `SpectralPacket`, and `createNativeProductionProfile()` inputs | Quantity/profile constructors and normalizers | Supported physical units and quantities; finite channel values; bin ordering and widths; compatible basis/semantics; supported profile options. | Do not revalidate these packet shapes downstream. |
| Atmosphere configuration | `new CanonicalAtmosphere(configuration)` | `CanonicalAtmosphere` constructor and constant helpers | Physical scale heights, supported spectral basis, and sourced coefficient semantics. | Constructor wrapper/member checks are candidates in 2.2; accepted constants are trusted by later sampling. |
| Flat geometry configuration | `new FlatEarthGeometry(configuration)` | `FlatEarthGeometry` constructor | Unit-bearing positions/distances; positive atmosphere/cache extents; nonnegative optional ray limits; ordered cache-node semantics. | Downstream geometry-coordinate checks are candidates in 2.2. |
| Spherical geometry configuration | `new SphericalEarthGeometry(configuration)` | `SphericalEarthGeometry` constructor | Positive ordered radii; finite normalized directions; positive cache-bin and integration counts; physical boundary altitude. | Downstream geometry-coordinate checks are candidates in 2.2. |
| Light-source configuration | `new DistantSunLightSource(configuration)` and `new LocalSunLightSource(configuration)` | Respective source constructor plus `acceptSourceIrradiance()` | Finite normalized direction/position; spectral irradiance contract; nonnegative angular radius or source radius; positive reference distance; supported source interval count. | String/boolean/object checks are candidates in 2.2 when they duplicate ambient contracts. |
| Ground and display configuration | `UniformLambertianGroundBoundary` and `BrunetonColorDisplayModel` constructors | Respective constructor acceptance methods | Nonempty boundary identity; reflectance within [0, 1]; finite display constants and valid color conversion data. | Packet/configuration member checks are candidates in 2.2 after acceptance. |
| Facade shader attachment | `Algorithm32.setupShader(request)` and `ShaderBuilder.build(request)` | `ShaderBuilder._assertBuildRequest()` | Positive pixel viewport; supported optional build options; fulfilled required binding values; cancellation and superseded-build lifecycle. | Composer, scene, camera, and collaborator object-shape checks are candidates in 2.2. |
| Scene capture attachment | `new SceneInputCapture(configuration)`, `capture(renderer)`, and resize calls | `SceneInputCapture` | Available Three constructors; positive scene depth; valid scene scale and viewport; render-target resource lifecycle. | Scene/camera/renderer object-member checks are candidates in 2.2. |
| GPU capability and allocation | `new ThreeCacheBackend({ THREE, renderer })` and `allocateField(spec)` | `ThreeCacheBackend.inspectCapabilities()` and allocation method | WebGL2; float-render extension; positive texture/layer limits; highp fragment precision; framebuffer completeness; requested storage within capability limits. | `THREE` and renderer object shape are runtime-capability candidates, not a general structural contract. |
| GPU execution and cache controllers | Cache executor/assembler construction and source cache-controller requests | `CacheGpuExecutor`, `CachePassAssembler`, and source cache-controller lifecycle methods | Backend availability; cache-plan/resource limits; cancellation; ownership and disposal state. | Trusted plan/backend collaborator shape is candidate in 2.2. |
| Runtime pass and handle lifecycle | Shader runtime pass, performance timer, and `Algorithm32ShaderHandle` operations | `ShaderRuntimePass`, `ShaderPassPerformanceTimer`, and handle lifecycle guards | Disposal, resize, active-pass ownership, timer-query availability, and cancelled/superseded build state. | Internal state packet shape is not revalidated after installation. |
| React/Three application adapter | React utility props and Three object requests | `Algorithm32ReactUtils` and `Algorithm32AtmosphereComposer` | Required Three runtime constructors; supported render priority; pixel size; scene-depth resource lifecycle. | React prop packet shape is candidate in 2.2. |
| Analytic fixture reader | `fixtures/analytic-invariants.json` in `_tests/fixtures.spec.js` and `SpectralCalculator.spec.js` | Each Jasmine fixture reader | JSON parse success; fixture-reference numbers; analytic expected-value semantics and tolerances. | Fixture record member shape belongs to ambient/test contracts, not production runtime validation. |
| GPU policy and native N4 oracle readers | `gpu-cache-parity-policy.json` and the native N4 oracle in Jasmine specs | `GpuCacheParityPolicy.spec.js` and `NativeN4CpuGpuParityOracle.spec.js` | Query indices in selected domains; finite nonnegative oracle values; declared error bounds and production provenance. | JSON object shape belongs to fixture contracts; these readers are test-only. |

No production runtime module ingests serialized JSON. `ShaderDescriptorBuilder`
uses an internal JSON-compatible clone for already accepted descriptor facts;
it is not a serialized-data ingress. The three retained JSON readers are
Jasmine-only evidence boundaries; their semantic assertions do not authorize
duplicate runtime packet-shape checks.

### Star Conformance Retirement Decision

Step 1.2 completed on 2026-08-01. No Algorithm32-Star fixture, policy,
provenance string, browser parity harness, Node specification, Karma entry, or
root command remains an approved production-conformance bridge. The 66-file
bridge and its evidence capsule were removed after the production consumers
were retired and the retained native N4 oracle was recast to production-owned
provenance.

The retirement map is: remove the legacy L1 fixture/specifications, all
local-Sun comparison policy/gold/report inputs, the local-Sun and ground
browser suites, `StarGroundGpuParityHarness.js`, their support constants, two
dedicated Karma configurations, and six root commands. Retain only the native
N4 CPU/GPU regression fixture after replacing every historical provenance
identity and retaining its Jasmine specification. Historical experimental
provenance no longer resides in production fixtures, runtime contracts, or
executable assertions.

### JSON File Trace (A2)

The baseline scoped tree contained 13 JSON files, including `jsconfig.json`.
Step 1.2 retired eight Star-derived records; Step 1.3 retired the empty
source-registry scaffold. Four JSON files remain: type-check configuration,
an analytic fixture, a production parity policy, and the native N4 oracle.
No retained JSON file has an in-repository utility producer.

| File | Current classification and disposition | Executable consumer or reader | Producer trace |
| --- | --- | --- | --- |
| `jsconfig.json` | Hand-maintained TypeScript configuration; not fixture/policy data. | `npm run typecheck:algorithm32` invokes `tsc -p src/algorithm32/jsconfig.json`. | Hand-maintained. |
| `fixtures/algorithm32-star-legacy-34-j2-compatibility.json` | Retired under A1. | No remaining reader. | Historical experimental payload; no production producer. |
| `fixtures/analytic-invariants.json` | Checked immutable analytic reference fixture. | Jasmine `fixtures.spec.js` and `SpectralCalculator.spec.js` via `npm run test:algorithm32`. | No in-repository producer located; records its Flat reference source path. |
| `fixtures/gpu-cache-parity-policy.json` | Hand-maintained production parity policy with neutral evidence metadata. | Jasmine `GpuCacheParityPolicy.spec.js` and `NativeN4CpuGpuParityOracle.spec.js`. | No in-repository producer located. |
| `fixtures/local-sun-gpu-cache-parity-policy-v1-rejected-z5-rho5.json` | Retired under A1. | No remaining reader. | No production producer. |
| `fixtures/local-sun-gpu-cache-parity-policy.json` | Retired under A1. | No remaining reader. | No production producer. |
| `fixtures/runtime-cache-parity-policy.json` | Retired under A1. | No remaining reader. | No production producer. |
| `light-sources/fixtures/algorithm32-production-native-n4-cpu-gpu-parity-oracle.json` | Checked immutable production CPU oracle; retained with production-owned provenance. | Jasmine `NativeN4CpuGpuParityOracle.spec.js`. | No in-repository producer located; it records the production binary64 CPU recurrence. |
| `light-sources/fixtures/algorithm32-star-legacy-l1-parity.json` | Retired under A1. | No remaining reader. | Historical experimental comparison metadata; no production producer. |
| `light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-comparison-policy.json` | Retired under A1. | No remaining reader. | Historical comparison input; no production producer. |
| `light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-comparison-report.json` | Retired under A1. | No remaining reader. | Historical generated report; no production producer. |
| `light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-gold.json` | Retired under A1. | No remaining reader. | Historical generated output; no production producer. |
| `references/source-registry.json` | Retired under Step 1.3 with its registry-only ambient types and source-shape scaffold specification. | No remaining reader. | Empty hand-maintained scaffold; no production producer. |

## Current Algorithm32 Reconciliation Checkpoint

Steps 2.9, 3.1 through 3.4, 4.1-4.3, 4.4.1-4.4.3, 4.5.1-4.5.6, 5.1-5.3,
and 6.1 are complete. Algorithm32 has no retired descriptor or manifest
surface. Its
complete 287-file JavaScript, JSX, and ambient-declaration surface is formatted
by exact root dependency Prettier 3.9.6, all ordinary module filenames comply with
kebab-case, and each class module exports only its named class. The atmosphere
cache-pass maps now express readonly intent through JSDoc and production
JavaScript/JSX has no `Object.freeze` call. Checked JSON/configuration records
and Markdown remain outside the code-formatting scope; their A2 classification
is complete.

The current formatter and both type checks pass, the 456-spec Node regression,
5-spec Three/WebGL lane, retained 1-spec policy-integrity check, and 3-spec
Flat32 UI lane pass, and the final organization static, document, frozen-
surface, whitespace, newline, and diff checks pass. The completed 245-row
[source-organization migration plan](../algorithm32/source-organization-plan.md)
assigns every current path exactly one owner and target, resolves the
assembler/provider and light-source/extraterrestrial boundaries, and defines
M1-M11 plus their verification. M1 has moved and consolidated the foundational
utilities, M2 split quantities and executable domains, and M3 distributed all
capability-owned ambient declarations, and M4 established assembler/cache
foundations. M5 established GPU cache runtime, neutral cache/spectral transport,
the omitted-ground owner, and production fixture owners. M6 established the
Native-15 profile, canonical atmosphere, Bruneton color, and uniform-Lambertian
ground owners. M7 established the singular shared/flat/spherical geometry tree
and geometry-specific Three endpoints. M8 established the final light-source
and extraterrestrial/Sun owner trees. M9 established the final runtime owner
tree. M10 established the final React/R3F adapter owner. M11 closed the root
package exposure and current documents and removed verified fileless legacy
directories without moving source or frozen evidence. All M1-M11 gates pass,
and Step 4.3.2 is complete. The independent Step 4.3.3 audit and corrected
document-link/authority follow-up also pass. Step 4.4.1 subsequently added the
14 matched geometry class/type owners, Step 4.4.2 added 13 matched light-source
cache, shader, Three, constant, and declaration owners, and Step 4.4.3 added
three rendering assembly/installation owners. Both geometry facades, both
light-source facades, `ShaderBuilder`, and all sixteen collaborators are below
1,000 lines while preserving exact public, numerical, shader, cache, identity,
binding, and lifecycle behavior. At the Step 4.4.3 checkpoint, the live tree
contained exactly 298 files, including 33 geometry files, 92 light-source
files, and 18 rendering files. Its focused, type, formatter, full Node,
Three/WebGL, Flat32, policy-integrity, declaration, import, cycle, Karma, and
diff gates passed.
Step 4.5.1 is complete: the canonical
[helper-ownership inventory](../algorithm32/helper-ownership-inventory.md)
covers all 148 production modules at source identity
`4aeeb00102d4713f3f31f219cdf9d71092a64d241279fd7e60411f0e84e090af`
and records 697 production operations, three exported profile values, and
eleven reused test-support operations in 711 authoritative rows. It lists all
24 multi-export modules function-by-function and explicitly traces every
consumer, including the sole unused export. The canonical
[helper-ownership classification](../algorithm32/helper-ownership-classification.md)
then assigned all 711 rows exactly once: 286 keep on class, 211 return to an
existing class, and 214 are class-independent. Only four of 290 class
operations qualify as independent, through demonstrated equivalent current
contracts. All 24 multi-export modules were decided function-by-function, the
95 construction-shaped candidates and ten profile operations/values have
explicit ownership dispositions, and no ambiguity remains. The canonical
[helper-ownership target plan](../algorithm32/helper-ownership-target-plan.md)
now assigns all 711 rows exact owners and batches, selects 20 cohesive
namespace modules, resolves all target collisions and multi-export splits,
and keeps every receiving class below the size limit. Step 4.5.4 is complete:
20 foundation, 51 physical, and 18 runtime rows reached their exact owners;
ten immediate namespaces are complete; 31 class rows returned to their
classes; and the sole unused export was removed. The integrated 438-spec Node,
5-spec Three/WebGL, 3-spec Flat32 UI, type, format, policy, ownership, import,
cycle, class-size, and hygiene gates pass. Step 4.5.5 is also complete: all
264 gated rows and all 157 non-deferred owner/symbol assignments close
exactly. Eighty of 95 production construction candidates survive with
demonstrated contracts; 15 wrappers or one-shot callables and 37 superseded
paths are gone; and all ten test construction rows remain test-only. The
Native-15 profile has one complete typed default, every supported override,
and explicit direct-40 differences; its complete default profile identity is
`sha256:a0174e3f8cfb02103d6c18af94a4fd11dbec0a1c84d6ad981b2a5b9fb37852d3`.
The live 287-file tree contains 279 formatted code/declaration files, 131
production modules, and no over-limit class. Both type checks, formatting,
456 Node specs, 5 Three/WebGL specs, 3 Flat32 UI specs, policy integrity,
independent ledger/static audits, exact ownership/import/cycle/class-size
scans, and hygiene gates pass. Step 4.5.6 is also complete: its independent
semantic and AST/static audits reproduce all 287 files, 131 production
modules, 67 sole-class owners, 20 exact planned namespaces, five justified
ordinary callable owners, 599 resolved relative clauses, zero cycles, and 601
unique ambient names across 76 declaration files. Its focused 166-spec gate,
both type checks, exact formatter scope, 456-spec Node regression, 5-spec
Three/WebGL lane, 3-spec Flat32 UI lane, policy integrity, and hygiene gates
pass. No helper disposition or exception remains; that checkpoint supplied
the settled input for completed Step 5.

Step 5 is also complete. Its public/private transitive placement closure,
imported-type removal, named-union/member-documentation conversion, and named
callable-shape conversion leave 295 Algorithm32 files, including 287 formatted
JavaScript/JSX/declaration files and 81 declarations. The combined recursive
Algorithm32/Flat32 declaration surface has 722 unique global ambient names and
728 unique scope-aware declaration keys across 84 files. Both type checks,
the exact formatter scope, 456-spec Node regression, 5-spec Three/WebGL lane,
3-spec Flat32 UI lane, policy integrity, independent AST/semantic audits, and
hygiene gates pass.

Steps 6.1 and 6.2 are also complete. The canonical inventory and three row appendices
cover all 287 Algorithm32 JavaScript, JSX, and declaration files at source
current identity
`sha256:410a525fc7afc56001b3a14d75e0181440c1f99b3e625ead136a2e6e9b85acdc`
in 6,475 unique documentation rows. Two independent AST passes reproduce
every syntax node, row location, documentation-presence state, appendix row,
and file heading with zero missing, extra, duplicate, parse, or union-member
finding. Steps 6.2 and 6.3 close every required description, tag, error,
overload, complex-return, and async-outcome contract with zero stable-row or
semantic-AST mismatch. Both type checks, formatting, complete regression,
browser, policy, and hygiene gates pass. Steps 7 through 9 are complete.

## Ambiguities And Decisions

Record an item here before applying a rule that is unclear, conflicts with
another standard, or would require a deliberate production exception.

| ID | Question or conflict | Candidate resolution | Decision owner | Status |
| --- | --- | --- | --- | --- |
| A1 | Which `algorithm32-star` fixtures, policies, provenance strings, and browser parity harnesses remain an approved temporary production-conformance bridge? | **None.** All Star-derived test data, commands, Karma wiring, browser harnesses, and production-scope provenance were retired. The retained native N4 test uses only a production-owned oracle. | Production evidence owner | Resolved and implemented 2026-08-01 |
| A2 | Which of the 13 JSON files are utility-generated files versus checked immutable fixtures or ordinary hand-maintained policies? | Resolved: baseline 13 files comprised 1 configuration, 2 checked immutable non-Star fixtures, 1 hand-maintained production policy, 1 empty scaffold, 4 Star policies, 2 Star evidence fixtures, and 2 utility-generated Star outputs. Step 1.2 retired the 8 Star-derived records; Step 1.3 retired the empty scaffold. | Production cache/evidence owner | Resolved and implemented 2026-08-01 |
| A3 | Are any over-limit test-support modules sufficiently cohesive to justify a time-bounded exception? | **No.** `StarGroundGpuParityHarness.js` was retired under A1. The former `shader-builder.spec.js` was coherently split under the warning boundary. | Production test owner | Resolved and implemented 2026-08-01 |

## Work Items

| ID | Work | Evidence of completion | Status |
| --- | --- | --- | --- |
| R1 | Inventory every production Algorithm32 source, declaration, test, build/type configuration, and directly supporting document in scope. | The [file-by-file category assignment](../algorithm32/reconciliation-inventory.md) and completed Step 1.2 retirement map classify every scoped baseline file and every retired Star consumer. | Complete |
| R2 | Reconcile formatting, tabs, required semicolons, filename conventions, and generated-file classification. | Steps 3.1 and 3.2 installed exact root dependency Prettier 3.9.6 and formatted all 237 Algorithm32 code/declaration files. Step 3.3 renamed all 15 surviving ordinary camelCase modules and updated every current production consumer. Step 3.4 is satisfied by completed A2. Formatter, type, focused Node, full Node, Three/WebGL, filename, path, and diff gates pass. | Complete |
| R3 | Reconcile class, utility, namespace, factory, profile, helper, constant, and file-size rules. | Step 1.4 retired the A1 Star harness and split the ShaderBuilder test support. Step 4.1 removed all six redundant default aliases from the four affected implementation/declaration surfaces; every class module now exports exactly its named class. Step 4.2 removed all 12 runtime freezes from the atmosphere pass maps and replaced their immutability mechanism with readonly JSDoc contracts. Steps 4.3.1-4.3.3 completed and independently audited the full M1-M11 ownership migration. Step 4.4.1 split both geometry facades into matched five-class groups, Step 4.4.2 split both light-source facades into matched four-class groups, and Step 4.4.3 split `ShaderBuilder` into its public lifecycle facade plus deterministic assembly and Three installation owners. All 21 resulting classes are below 1,000 lines with exact public, physical, shader, cache, binding, and lifecycle behavior. Step 4.5.1 recorded the complete 711-row classification input, Step 4.5.2 assigned 286 keep, 211 return, and 214 class-independent dispositions, and Step 4.5.3 assigned exact owners, actions, dependency-safe batches, and focused gates with exact row closure and no source change. Step 4.5.4 implemented all 89 immediate rows, established ten complete namespaces, returned 31 class rows, and removed the one unused export plus six superseded ordinary modules. Step 4.5.5 implemented all 264 gated rows, retained 80 justified production construction operations, removed 15 wrappers or one-shot callables and 37 superseded paths, contained every test construction row, and completed the Native-15 typed-default contract. Step 4.5.6 independently reproduced every settled owner, ordinary-module, namespace, factory, profile, export, class-size, import, cycle, declaration, test-containment, and hygiene disposition with no finding or exception. | Complete |
| R4 | Reconcile ambient declarations, public class API contracts, internal class types, interfaces, components, and string unions. | Step 5 places all 45 Algorithm32 interfaces and every transitive public/class-only contract at its canonical owner; removes all 63 settled `import(...)` expressions without a prohibited substitute; leaves 61 named, exactly documented string unions with zero inline occurrence; and replaces its 27 identified inline callable shapes. Step 9 broadened the callable scan, found twelve nested property/method callback signatures, and replaced them with seven named ambient callable contracts. The final scan has zero inline union or callable shape, prohibited ambient form, duplicate name, parse diagnostic, or public/private boundary violation. | Complete |
| R5 | Reconcile JSDoc for types, classes, interfaces, properties, values, functions, methods, callbacks, generators, constructors, accessors, errors, and asynchronous outcomes. | Step 6 initially closed 6,475 documentable rows. The final Step 9 rescan corrected three stale renamed parameter tags and replaced twelve inline callbacks with seven named callable contracts, producing 6,477 fully documented rows: 3,059 declaration, 1,742 production, and 1,676 test/browser rows. All 3,405 entity/value, 99 constructor, 2,230 internal/callback, and 743 public-callable descriptions pass; all parameter, return, error, async-outcome, overload, direct-throw, complex-return, union, parse, location, and appendix checks are clean. | Complete |
| R6 | Reconcile durable Algorithm32 physical-data names, unit-bearing values, local normalized scalars, and radiometric transport-stage names. | Step 7.1's initial 172-name conservative inventory classified every candidate. Step 7.2 migrated the sole durable violation to neutral `cieTableResolution` carrying `{value: 1, units: 'nanometers'}`. The final Step 9 scan contains 173 current names after two Step 8 descriptive normalized-radial locals were added; all remain classified and no durable violation exists. | Complete |
| R7 | Reconcile validation and descriptor use at production ingress and internal seams. | Steps 2.1 through 2.8 mapped every ingress, classified and method-traced all 72 executable candidates, and removed the dense-layout/descriptor assertion path, unused CPU-field assertion API, trusted shader-composition revalidation, typed configuration/adapter shape guards, plus Reference, SpectralCalculator, CanonicalAtmosphere, and named geometry downstream revalidation. Step 2.9 removed every descriptor and every current production `*Manifest`. Manifest behavior remains only where a provider-neutral assembler consumes provider-declared exports and requirements: direct `ShaderContribution` and `CacheBuildModule` contracts, with no nested manifest. Known collaborators use executable owners or direct plans, requests, results, handles, capabilities, identities, and physical contracts. Step 1.3 already retired the source-shape scaffold assertions. | Complete |
| R8 | Run the required type, build, regression, and document-consistency gates after each coherent reconciliation set and at completion. | Step 2.9 closure gates pass. Steps 3.1-3.3 passed formatter, type, focused/full Node, Three/WebGL, path/filename, and diff gates. Step 4.1 passed export/default-consumer scans, 87 focused specs, type checking, formatting, the 426-spec Node regression in 102.482 seconds, the 5-spec Three/WebGL lane, and the diff check. Step 4.2 passed consumer/hash tracing, the zero-freeze scan, 17 focused specs, type checking, formatting, the 426-spec Node regression in 99.306 seconds, the 5-spec Three/WebGL lane, and the diff check. Step 4.3.1 defined the per-batch/final verification matrix. Every M1-M11 gate and the independent Step 4.3.3 closure audit pass. Step 4.4.1 adds passing exact declaration/prototype checks, 98 focused specs, both type checks, formatting, the 429-spec Node regression, 5-spec Three/WebGL lane, 3-spec Flat32 UI lane, policy integrity, and export/declaration/import/cycle/Karma/diff checks. Step 4.4.2 adds exact public/hash/identity snapshots, 157 focused specs, both type checks, formatting, the 430-spec Node regression, the same 5/3/1 browser and policy lanes, and passing export/declaration/import/cycle/diff checks. Step 4.4.3 adds exact public/assembly/runtime lifecycle snapshots, 21 focused specs, both type checks, the 290-file formatter gate, the 430-spec Node regression, the same 5/3/1 browser and policy lanes, and passing class/export/helper/declaration/import/cycle/residual/hygiene checks. Step 4.5.1 adds passing source-identity, exact coverage, row-uniqueness, multi-export, profile, test-support, consumer, type, and diff checks. Step 4.5.2 adds passing exact 711-key/disposition, return-owner, multi-export, construction/profile, rationale, independent-audit, type, document-hygiene, link, and diff checks for its decision-only classification. Step 4.5.3 adds passing exact 711-key/target/action/batch, source-identity, construction/profile/test-scope, collision, namespace, class-size, independent-audit, type, document-hygiene, link, and diff checks for its planning-only target design. Step 4.5.4 adds passing focused batch gates, both type checks, the 295-file formatter gate, the 438-spec Node regression in 90.188 seconds, the 5-spec Three/WebGL lane, 3-spec Flat32 UI lane, 1-spec policy lane, and exact namespace/export/path/deferred-seam/import/cycle/class-size/hygiene checks. Step 4.5.5 adds passing focused transaction and identity/freshness gates, both type checks, the 279-file formatter gate, the 456-spec Node regression, the same 5/3/1 browser and policy lanes, independent ledger/static audits, and exact row/owner/export/retired-path/test-containment/import/cycle/class-size/hygiene checks. Step 4.5.6 adds passing independent semantic and AST/static audits, 166 focused specs, both type checks, exact formatting, the 456-spec Node regression in 85.651 seconds, the same 5/3/1 browser and policy lanes, and exact namespace/ordinary-owner/export/retired-path/test-containment/import/cycle/declaration/class-size/hygiene closure. Step 5 adds passing independent placement/type AST audits, both type checks, exact 287-file formatting, the 456-spec Node regression in 92.879 seconds, the same 5/3/1 browser and policy lanes, and exact import/union/callable/declaration/class-size/hygiene closure. Steps 6.1-6.3 add exact 6,475-row documentation, tag, error, overload, complex-return, async-outcome, and semantic-AST closure; both type checks; exact formatting; the 456-spec Node regression in 94.129 seconds; the same 5/3/1 browser and policy lanes; and document/hygiene closure. Steps 7 and 8 add passing unit-contract and complete short-name migration gates, including the independent 242-row current-name audit, both type checks, exact formatting, the 456-spec Node regression in 89.031 seconds, the same 5/3/1 browser and policy lanes, 597 resolved relative clauses, and hygiene closure. Step 9 reproduced every final type, build, regression, browser, policy, document-consistency, static, and hygiene gate. | Complete |

| R9 | Replace unclear short Algorithm32 variable names across implementation, declarations, tests/browser support, and authored shader source. | The canonical Step 8.1 audit covers 448 exact declarations at source identity `sha256:b523e1ed23e5d77fc768f53d3d35184d248d02816e716ccf0fd7d889c92387c5`, excludes 198 accepted unambiguous conventions from the migration tables, and retains 250 rows: 242 descriptive renames plus the eight NIST FIPS 180-4 SHA-256 working-variable formula exceptions `a`-`h`. Its exact non-overlapping appendices contain 55 Step 8.2 rows with 47 renames, 107 Step 8.3 renames, and 88 Step 8.4 renames. Steps 8.2-8.4 applied all 242 renames. Step 8.5 independently reproduced them at completed source identity `sha256:cb9ee9cc20b896b2ca504fe74063859b6e32bc41d27dea1635b9f9af4aa5825d`, found exactly 153 accepted contextual short bindings plus the eight cited formula symbols and zero short shader declaration, resolved all 597 relative clauses with zero cycle or production-to-test edge, preserved required public-key aliases, and passed every type, formatter, regression, browser, policy, and hygiene gate. No ambiguity or exception remains. | Complete |

## Exception Log

An exception is valid only when its owner, reason, affected paths, expiration
or review condition, and acceptance are recorded here. Existing legacy code is
not an implicit exception.

| ID | Rule | Affected paths | Reason | Review condition | Accepted by |
| --- | --- | --- | --- | --- | --- |
| None | None | None | None | None | None |

## Completion Criteria

Phase 2 completes only when every work item is complete, every ambiguity is
resolved, every exception is either removed or explicitly accepted, and the
required production type, build, and regression gates pass. The resulting
record becomes the standards-audit evidence cited by the production integration
plan before Phase 3 begins.

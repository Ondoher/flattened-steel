# Algorithm32 Descriptor Reconciliation Analysis

Status: complete on 2026-08-02. The consumer inventory, corrected
manifest-boundary decision, direct-contract implementation, and closure gates
are complete. The
[reconciliation plan](./reconciliation-plan.md#29-retire-descriptors-and-justify-assembly-declarations)
owns the decision and execution sequence; this document owns its supporting
consumer trace and completed Step 2.9 evidence.

## Consumer-Test Result

All Algorithm32 descriptors retire. Applying the plan's provider-unknown
assembly test found manifest behavior at only two active boundaries:

| Consumer | Provider declaration it consumes | Active assembly behavior |
| --- | --- | --- |
| `Algorithm32ShaderAssembler` and `ShaderCompatibilityValidator` | `ShaderContribution` | Read provider-declared symbols, source blocks, uniforms, textures, and binding requirements to validate and assemble substitutable shader contributions. |
| `CachePassAssembler` | `CacheBuildModule` | Reads provider-declared `provides`, `requires`, shader blocks, and bindings to dependency-order and assemble substitutable cache modules. |

The contribution or module itself is the assembly declaration. Neither
boundary needs a nested `.manifest` or a new `*Manifest` type. Every current
production `*Manifest` represents known-provider data, identity, or a snapshot
rather than provider-neutral assembly requirements and therefore retires.

## Inventory And Disposition

| Current path or contract | Consumer finding | Disposition |
| --- | --- | --- |
| `DirectionDomainDescriptor` / `DirectionDomainManifest` and `PositionDomainDescriptor` / `PositionDomainManifest` | Geometry, source, and cache code already receive known executable domain owners and directly use their nodes, vectors, weights, frames, stencils, resolvers, counts, or IDs. | Remove descriptor and manifest modules/types. Pass executable owners or direct selections; retain generator schema/revision only as generator input. |
| Dense/scalar-array and texture layout descriptors/manifests | CPU packing owners calculate addressing; the GPU backend consumes explicit storage extent and format. No provider discovery occurs. | Remove layout descriptors/manifests. Keep CPU addressing on packing owners and GPU allocation in direct `CacheFieldStorage`. |
| Cache-construction options descriptor | Cache plans and build loops directly consume maximum scattering order and transport interval count. | Retain direct `CacheConstructionOptions`; its descriptor factory, schema, hash, synthetic ID, and profile reference remain retired. |
| Directional spectral-field descriptor/manifest | CPU/GPU construction directly receives the selected field and needs field ID, storage, packing, or physical provenance at specific boundaries. | Remove the descriptor/manifest. Use direct `CacheFieldSpec` for GPU allocation and direct CPU field/packing facts where sampled. |
| Scattering-cache descriptor/manifest | Consumers receive an executable cache provider or build artifact. They do not assemble the cache from declared requirements. | Remove the descriptor/manifest and `.manifest` accessors. Return direct result, runtime bindings, resources, diagnostics, and lifecycle behavior. |
| `CacheManifestIdentity` | Cache reuse compares direct executable plan, backend, ground-boundary, and source-specific facts. | Rename or reduce to direct reuse identity; do not retain manifest terminology or construction snapshots. |
| `BLACK_GROUND_BOUNDARY_IDENTITY` inside `ScatteringCacheManifest.js` | CPU/GPU cache plans use it to represent omitted reflective ground, but its `"omitted-black-ground"` hash is synthetic rather than value content. | Relocate the selection fact to its cache/ground owner. Compare direct absence or owner ID; remove the fake content hash. |
| `LocalSunShellFactDescriptor` | The local-Sun cache directly consumes shell arrays, bounds, lookup behavior, and resource facts. `LocalSunCacheSource` reads `.manifest.identity` only to name boundary `CacheData`. | Remove without a manifest replacement. Use a direct source/owner ID for naming and the created `CacheData` object's identity for content. |
| Native-profile domain descriptor references | No production consumer uses the copied position/incoming/outgoing descriptor identities to select or assemble a provider. | Remove the references and their types/tests. Introduce a direct selection ID only after demonstrating a consumer. |
| `ShaderDescriptorBuilder`, `Algorithm32ShaderDescriptor`, descriptor sections, contribution fingerprints/tags, and owner `describe()` snapshots | Shader compatibility consumes contribution symbols and binding requirements, not the descriptor annotations. Owner snapshots otherwise feed aggregate identity hashes or public metadata without an active in-repository executable consumer. | Remove. Pass live owners and direct typed build facts. Retain `ShaderContribution` itself as the assembly declaration. |
| `ShaderUniformDescriptor` and `ShaderTextureDescriptor` | Their records are active uniform/sampler declarations embedded in `ShaderContribution`, not diagnostic metadata. | Rename the types/factories to direct `ShaderUniformDeclaration` and `ShaderTextureDeclaration` contracts while preserving their assembly use. |
| `SelectedCacheContract` | Barrel-exported test metadata has no production assembly consumer. | Remove and use direct local test fixtures. |
| `CacheBuildPlan`, `CacheFieldSpec`, `CacheRuntimeBinding`, and `CacheGpuCapabilities` | These are an explicit executable plan, allocation request, opaque handle mapping, and measured environment result supplied to known consumers. | Retain as direct contracts, not manifests. |
| `contentHash`, fingerprints, compatibility tags, descriptor references, and descriptor copies | Descriptor composition and provenance stamping are not assembly behavior. Physical spectral compatibility and cache reuse may still need direct identity operations. | Delete metadata-only uses. Retain/re-home only an operation traced to an active physical or cache consumer, using inputs owned by that consumer. |
| `descriptors/descriptorSupport.js` | Descriptor clone/hash operations serve retiring metadata. `requiredString`, `positiveInteger`, and typed-array recognition may have non-descriptor consumers. | Delete descriptor-only operations and the descriptor-named owner. Move only demonstrated shared operations to a cohesive non-descriptor owner. |
| `domains/domainDescriptorSupport.js` | After direction-manifest removal, `canonicalZero()` remains executable support for `CubedSphereDirectionDomain`. | Move the operation onto `CubedSphereDirectionDomain` as private class support; remove the descriptor-named single-function module without losing signed-zero canonicalization. |

## Execution Batches

1. **2.9.1 - Inventory and boundary classification.** Complete and corrected.
   The initial consumer trace remains valid; the former domain/layout/field/
   cache manifest recommendation is superseded by the provider-unknown test.
2. **2.9.2 - Cache and domain direct contracts.** Complete. Executable domain
   and packing owners, direct field/storage specifications, direct artifacts,
   and reuse identities replaced the rejected manifest intermediate.
3. **2.9.3 - Shader descriptors and owner snapshots.** Complete. Shader
   contributions consume direct declarations and execution options; owner
   snapshots and aggregate hashes are gone.
4. **2.9.4 - Helper and public-contract closure.** Complete. Descriptor-only
   support, ambient types, tests, metadata, and terminology are retired.
5. **2.9.5 - Verify.** Complete. Focused behavior, type, Node, Three/browser,
   terminology/reference, assembly-consumer, and diff checks pass.

## Completion Checkpoint

Step 2.9 is complete. Cache/domain code uses executable owners and direct
plans, storage, packing, artifacts, bindings, capabilities, physical
provenance, and reuse identities. Shader providers use live owners and direct
execution options. Controller reuse compares source/backend/scheduler
ownership before source-specific plan reuse keys decide cache reuse.

`ShaderContribution` and `CacheBuildModule` remain the only direct provider
declarations with manifest behavior. Their assemblers actively consume
`provides` and `requires`; `CacheBuildModule.contentHash` also remains active
for deterministic module ordering and pass/plan reuse identity. Neither has a
nested manifest.

Final verification on 2026-08-02 passed:

- `npm run typecheck:algorithm32`;
- `npm run test:algorithm32`: 426 specs, zero failures, 117.61 seconds;
- `npm run test:algorithm32:three`: 5 of 5 specs, including Stage 10 scene
  composition;
- production source content and filename scans: zero descriptor, manifest,
  fingerprint, compatibility-tag, or owner-`describe()` residuals; and
- `git diff --check` plus current-document consistency checks.

Subsequent reconciliation progress and the current focus are owned by the
[canonical reconciliation plan](./reconciliation-plan.md); they do not alter
this completed descriptor-retirement analysis.

## Non-Negotiable Preservation

- Unit-bearing physical data and spectral-basis compatibility remain direct
  physical contracts.
- Cache owners retain storage, packing, addressing, allocation, lifecycle,
  source-specific sampling, and direct reuse behavior.
- Shader assembly retains required/provided symbol checks, conflict handling,
  deterministic source order, binding requirements, resource limits,
  cancellation, and disposal.
- `ShaderContribution` and `CacheBuildModule` continue to declare the exports
  and requirements their provider-neutral assemblers actually consume.
- No descriptor is replaced by a manifest merely to preserve identity,
  provenance, diagnostics, copies, hashes, or a public snapshot.

# Algorithm32 Helper Ownership Classification: Profile And Test-Support Rows

Status: canonical Step 4.5.2 supplemental classification. This file classifies
the 3 exported profile values and 11 reused exported test-support operations
recorded by the
[Step 4.5.1 inventory](./helper-ownership-inventory.md). Production namespace
targets and migration batches are now recorded in the
[support target appendix](./helper-ownership-target-plan-support.md); profile
completeness remains deferred to Step 4.5.5.

The decisions belong to production source identity
`4aeeb00102d4713f3f31f219cdf9d71092a64d241279fd7e60411f0e84e090af`.
The authoritative row identity is `current path + symbol + role`.

## Profile Values

| Current path | Symbol | Role | Disposition | Rationale |
| --- | --- | --- | --- | --- |
| `profiles/native-15/native-15-profile.js` | `DEFAULT_NATIVE_PHYSICAL_PROFILE` | `profile-value` | `class-independent` | Caller-supplied typed physical configuration whose geometry and atmosphere facts have meaning without any consuming class or lifecycle. |
| `profiles/native-15/native-15-profile.js` | `DEFAULT_NATIVE_NUMERICAL_PROFILE` | `profile-value` | `class-independent` | Caller-supplied typed numerical configuration whose transport and cache-construction choices are independent of a consuming class. |
| `profiles/native-15/native-15-profile.js` | `DEFAULT_NATIVE_PRODUCTION_PROFILE` | `profile-value` | `class-independent` | Shared typed production configuration consumed across distant/local cache providers and Flat32 modes without owning their state or lifecycle. |

## Reused Exported Test Support

These are class-independent within the test-support domain. That disposition
does not promote them into production; the support target appendix preserves
their test-only owners and batches.

| Current path | Symbol | Role | Disposition | Rationale |
| --- | --- | --- | --- | --- |
| `light-sources/shared/_tests/spectral-test-values.js` | `createTestSourceIrradiance` | `exported-test-support` | `class-independent` | Explicit spectral values and basis produce the same typed test packet for distant-Sun, local-Sun, and construction-source specifications without class state. |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | `ShaderBuilderTestSupport.pixelSize` | `namespace-test-support` | `class-independent` | Width and height produce a test pixel value shared by assembly and runtime specifications without a production owner. |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | `ShaderBuilderTestSupport.createAutomaticShaderModel` | `namespace-test-support` | `class-independent` | An explicit controller produces a protocol-level model graph spanning geometry, atmosphere, light-source, spectral, and cache collaborators; no production class state is captured. |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | `ShaderBuilderTestSupport.createShaderCacheDouble` | `namespace-test-support` | `class-independent` | The operation constructs the cache contribution and runtime-binding protocol used by rendering tests, with lifecycle behavior owned by the returned double rather than a production class. |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | `ShaderBuilderTestSupport.createCacheControllerDouble` | `namespace-test-support` | `class-independent` | An explicit cache produces a controller-protocol double whose orchestration is reusable test support and does not depend on production class internals. |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | `ShaderBuilderTestSupport.createCacheBackendDouble` | `namespace-test-support` | `class-independent` | The returned backend-protocol double installs supplied runtime bindings and uniforms without reading a production class or module lifecycle. |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | `ShaderBuilderTestSupport.createTransportDouble` | `namespace-test-support` | `class-independent` | The returned transport-protocol double declares symbols and a shader contribution through public contracts rather than a production class implementation. |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | `ShaderBuilderTestSupport.createColorDouble` | `namespace-test-support` | `class-independent` | The returned color-contribution double is shared by assembly and runtime specifications and is expressed entirely through the public contribution contract. |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | `ShaderBuilderTestSupport.createContribution` | `namespace-test-support` | `class-independent` | Explicit overrides produce the common `ShaderContribution` contract used across independent shader-owner doubles and both rendering specifications. |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | `ShaderBuilderTestSupport.createComposerDouble` | `namespace-test-support` | `class-independent` | The returned add/remove-pass protocol double owns its own test state and does not depend on rendering-class internals. |
| `runtime/rendering/_tests/ShaderBuilderTestSupport.js` | `ShaderBuilderTestSupport.createThreeDouble` | `namespace-test-support` | `class-independent` | The returned fake Three namespace supplies constructors and resource lifecycle behavior used through public runtime protocols, independent of one production class. |

## Partition Closure

- Profile values: 3 rows.
- Reused exported test support: 11 rows.
- Total: 14 unique authoritative rows.
- Dispositions: 14 `class-independent`; zero `keep-on-class`; zero
  `return-to-class`.

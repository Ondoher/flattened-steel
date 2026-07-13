# Algorithm32 Helper Ownership Classification

Status: Step 4.5.2 complete on 2026-08-03. This document and its four
classification appendices are the canonical disposition record for
[reconciliation Step 4.5](./reconciliation-plan.md#45-reconcile-helper-ownership-as-code-moves).
They classify ownership only. Namespace targets, final paths, migration
batches, and compatibility-free consumer edits are now owned by the completed
[Step 4.5.3 target plan](./helper-ownership-target-plan.md).

## Decision Boundary

The classification covers all 711 authoritative rows in the
[Step 4.5.1 inventory](./helper-ownership-inventory.md) at production source
identity:

`4aeeb00102d4713f3f31f219cdf9d71092a64d241279fd7e60411f0e84e090af`

Each `current path + symbol + role` identity has exactly one disposition:

- `keep-on-class`: a current class operation whose responsibility, state,
  lifecycle, value invariant, or collaborator transaction belongs to that
  class.
- `return-to-class`: an operation currently outside the existing class whose
  responsibility, state, lifecycle, value invariant, or collaborator
  transaction it exclusively implements. The row rationale names that class;
  Step 4.5.3 selected the exact method form and migration batch.
- `class-independent`: an operation whose explicit inputs, outputs, semantics,
  and lifecycle demonstrate applicability across class boundaries. This is an
  ownership finding, not an instruction to export the operation, create a
  module, or choose a namespace.

Purity, naming similarity, current co-location, a possible future consumer,
or the desire to populate a namespace did not establish independence. A
single current consumer did not by itself establish class ownership when a
typed domain or provider-neutral protocol demonstrated a broader contract.

## Classification Summary

| Partition | Rows | Keep on class | Return to class | Class-independent |
| --- | ---: | ---: | ---: | ---: |
| [Foundation](./helper-ownership-classification-foundation.md) | 193 | 44 | 17 | 132 |
| [Physical](./helper-ownership-classification-physical.md) | 323 | 159 | 120 | 44 |
| [Runtime](./helper-ownership-classification-runtime.md) | 181 | 83 | 74 | 24 |
| [Profile and test support](./helper-ownership-classification-support.md) | 14 | 0 | 0 | 14 |
| **Total** | **711** | **286** | **211** | **214** |

### Dispositions by current role

| Current role | Rows | Keep on class | Return to class | Class-independent |
| --- | ---: | ---: | ---: | ---: |
| `class-support` | 245 | 241 | 0 | 4 |
| `class-public-internal` | 41 | 41 | 0 | 0 |
| `class-static-operation` | 4 | 4 | 0 | 0 |
| `module-local-function` | 207 | 0 | 169 | 38 |
| `exported-function` | 128 | 0 | 42 | 86 |
| `namespace-method` | 72 | 0 | 0 | 72 |
| `profile-value` | 3 | 0 | 0 | 3 |
| `exported-test-support` | 1 | 0 | 0 | 1 |
| `namespace-test-support` | 10 | 0 | 0 | 10 |
| **Total** | **711** | **286** | **211** | **214** |

The 286 keep decisions and four independently reusable class-support methods
account for all 290 inventoried class operations. The 211 return decisions
comprise 169 module-local functions and 42 exported functions. The 214
class-independent decisions comprise 200 production operations plus the 14
profile-value and reused test-support rows.

## Class-Boundary Findings

Every public/accessor internal-use candidate and every public static operation
remains on its class. Of the 245 underscore class-support methods, only four
have demonstrated current equivalents across owner boundaries:

| Current class operation | Demonstrated independent contract |
| --- | --- |
| `CubedSphereDirectionDomain._dot` | The existing cross-owner vector dot-product contract is equivalent for every current three-vector call. |
| `CubedSphereDirectionDomain._clamp` | The existing cross-owner scalar clamp contract is equivalent for every current ordered finite bound. |
| `SpectralCalculator._multiplySpectralValues` | CPU scattering-density transport independently performs the identical componentwise `Float64Array` multiplication. |
| `SpectralCalculator._addScaled` | CPU scattering-density transport independently performs the same unit-bearing ray-position translation. |

These four decisions rest on current input, output, unit, and evaluation
semantics rather than purity or similar names. The other 241 class-support
methods remain class-specific, including stateless validation, formatting,
copying, and construction methods whose contracts are defined by their owning
class.

Two current module-local `nowMilliseconds` operations are also
`class-independent`: `CacheGpuExecutor` and `ShaderPassPerformanceTimer`
independently implement the identical zero-input monotonic-millisecond
contract. Their shared classification does not choose a target.

Every `return-to-class` rationale names an existing class. The returned rows
include module-local support already in a class file as well as separate
source-specific construction, cache, geometry, spectral-value, rendering, and
adapter operations. Their current standalone form, direct tests, or purity did
not outweigh the owning class responsibility.

## Multi-Export Module Closure

All 24 production modules with multiple exported functions were classified
function-by-function. Thirteen modules have only `class-independent` exports;
nine have only `return-to-class` exports. Two modules have mixed ownership:

| Current module | Return to class | Class-independent |
| --- | --- | --- |
| `adapters/react/algorithm32-react-utils.js` | `acceptAlgorithm32RequiredThreeObjectsPacket` | Its other six exported functions |
| `light-sources/shared/three/three-lighting-support.js` | `assertOnlyProperties` | Its other four exported functions |

The mixed results demonstrate that current co-location was not treated as an
ownership decision. Step 4.5.3 planned each export independently and does not
preserve either module merely for convenience.

## Factory, Profile, And Unused-Export Inputs

The 95 lexical `create*`, `build*`, or public `from*` candidates have the
following ownership classifications:

| Disposition | Construction-shaped rows |
| --- | ---: |
| `keep-on-class` | 4 |
| `return-to-class` | 67 |
| `class-independent` | 24 |
| **Total** | **95** |

These are ownership decisions, not factory-retention decisions. Step 4.5.5
must still decide whether each construction operation has an independent
lifecycle or reusable orchestration contract.

All seven native-15 profile operations and all three exported profile values
are `class-independent` typed configuration contracts; no existing class is a
defensible owner. Step 4.5.5 still owns profile completeness and default/
override conformance. All eleven reused exported test-support operations are
class-independent within the test-support domain and are not production
migration targets merely because they appear in this record.

The unused `sourcePathLimitDistanceToMeters` export is class-independent
because its explicit source-path-limit conversion is geometry-neutral, not
because of hypothetical reuse. Step 4.5.3 assigns it the sole `remove-unused`
action rather than inventing a speculative owner.

## Completion Checks

- Production source identity remains unchanged from Step 4.5.1.
- All 711 authoritative identities occur exactly once with one allowed
  disposition and a nonempty rationale.
- The four partitions close as `193 + 323 + 181 + 14 = 711`.
- All 290 class operations, 207 module-local functions, 128 exported
  functions, 72 namespace methods, 3 profile values, and 11 reused
  test-support operations are classified.
- All 24 multi-export modules are classified function-by-function.
- All 95 construction-shaped candidates and 10 profile operations/values are
  classified without pre-deciding Step 4.5.5.
- No disposition rests only on purity, naming, hypothetical reuse, current
  co-location, or namespace population.
- No production source, path, export, declaration, or behavior changed.

Step 4.5.2 is complete. The canonical
[Step 4.5.3 target plan](./helper-ownership-target-plan.md) assigns final owners
and migration batches without reopening the applicability test. Step 4.5.4
implemented and gated all 89 immediate rows on 2026-08-04 without changing
these dispositions. Step 4.5.5 implemented and gated all 264
construction/profile/test-support rows on 2026-08-04 without reopening the
classification. The independent Step 4.5.6 audit reproduced every settled
disposition with no finding or exception. Reconciliation
[Step 5](./reconciliation-plan.md#5-reconcile-ambient-types) then closed the
ambient declaration surface. Steps 6.1-6.3 are complete, and Step 7.1 is current.

# Algorithm32 Production

This directory is the sole maintained source for the production Algorithm32
implementation. Production models, contracts, CPU/reference execution,
renderer integration, and GPU/runtime work belong here. Archived and
experimental implementations may inform research, but production code must not
depend on them at runtime.

The authoritative implementation sequence and completion criteria live in
[`agents/topics/algorithm32/production/production-implementation-plan.md`](../../agents/topics/algorithm32/production/production-implementation-plan.md).

## Current State

Stages 3.1 through 3.5 of the CPU cache path have landed. Production now owns
the cache field structure and layouts, physical first-order `J1`, direct
primary `L1`, pure later-order recurrence through requested N2 and default N4,
the resident CPU cache, and geometry-owned final-view reconstruction and
sampling. That CPU path is the diagnostic and CPU/GPU parity oracle.

Stage 2 physical/spectral normalization and GPU construction Stages 4.0 through
5 are complete. The accepted source-owned N1, N2, and N4 graphs run through the
deterministic assembler, executor, bounded probes, and opaque Three/WebGL2
backend. The software-renderer browser lane passed 7/7 specs and 1,200
selected produced-field comparisons against 825 unique oracle scalars across
N1, N2, and N4 under the unchanged bounds, with a worst
allowed-error ratio of `0.150138`; exact N1 copy, bit-identical shared N2/N4
values, result-only retention, cleanup, `44,562,816` bytes of peak tracked
logical payload, and `12,597,120` bytes of resident logical payload also
passed. Exact literal pinning of the selected Star-compatible Fibonacci-34
data keeps descriptor/profile content identity deterministic across Node and
browser runtimes.

The immediate work is the coupled Stage 6 source-owned lifecycle and Stage 7
cache-backed runtime-sampler cutover. The complete cache capability, atomic
publication, and supported-hardware performance evidence remain open. The
accepted software-renderer run is conformance evidence, not hardware timing or
resource-budget evidence. Ground reflection and the later delivery phases
remain sequenced by the production implementation plan.

Imported flat-geometry and local-source surfaces establish integration
boundaries, but their presence does not satisfy the flat/local completion
requirement. CPU and GPU work for each implementation phase must both meet the
plan's completion criteria.

The current project supports only the production architecture's selected
[spherical/distant and flat/local pairings](../../agents/topics/algorithm32/production/architecture-boundaries.md#supported-geometry-and-source-pairings).
The geometry and source contracts remain independent; unused flat/distant and
spherical/local cross-pairings are not completion or parity requirements.

## Source Layout

- `Algorithm32.js` owns the public lifecycle facade.
- `types/` and ambient `types.d.ts` files own public and internal contracts.
- `quantities/` and `utils/` own unit-bearing values and deterministic numeric
  operations.
- `models/` owns shared spectral and configuration state.
- `atmospheres/`, `geometries/`, and `light-sources/` own their physical and
  spatial domains.
- `transport/` owns radiative-transport execution.
- `caches/gpu/` owns renderer-neutral construction contracts, validation,
  assembly, execution, and shared operation modules.
- `implementation/` owns CPU/reference orchestration and shader/runtime setup.
- `three/` and `react/` adapt production contracts to renderer and application
  boundaries.
- `fixtures/` contains checked-in production test data.

## Contract Rules

Durable configuration, request, result, sample, descriptor, and class
properties use neutral physical names. Their values carry units as data. For
example, use `sceneScale`, `sceneDepthMax`, and `resolveSceneDepthMax`; do not
encode a unit in those property or method names.

Once a unit-bearing value has been accepted and normalized to a known unit, a
local scalar can and should name that unit when it clarifies arithmetic, such as
`altitudeMeters`. This exception applies only to local implementation values,
including shader-facing normalized scalars, and not to durable object shapes.

Contracts are replaced directly when they change. Do not retain aliases,
fallback field names, alternate packet shapes, re-export adapters, or other
backwards-compatibility bridges.

Cache shader resources accept one payload descriptor containing a required
texture packet. A texture packet by itself is not an alternate public input.

The owner of a boundary validates a value when it enters the system. Internal
code then relies on the accepted contract, JSDoc, and static type checking
instead of repeatedly validating the same value. `Object.freeze` is not a
contract or immutability mechanism in Algorithm32; it adds unnecessary
complexity and must not be used for that purpose.

Complex contracts belong in the nearest ambient `.d.ts` file and receive
property-level documentation. JavaScript classes and non-trivial functions use
JSDoc with explicit parameter and return types. Ambient contracts are named
directly in declaration files and JSDoc; do not add `import(...).Type`,
`import type`, or local alias bridges for them. Runtime module imports and
external package types remain module-scoped where they are not ambient
contracts. A class implementation file is named for and exports that class;
reusable stateless helpers live in focused neighboring modules, and lower-level
helpers precede the composed class or operation that uses them.

Class-specific support operations use private methods, including private static
methods for pure operations. A class module exports only its class; reusable
operations move to focused utility modules, and module constants live in the
owning `consts.js`. Use setters only for direct assignment with no processing;
use a named method when a state change validates, normalizes, derives,
coordinates, or otherwise performs work.

Type checking owns class and module shape. Unit tests cover observable
behavior rather than parsing class exports, private members, or declarations.

## References and Experiments

Published external references and official experiment records are the only
citation authorities:

- [`/references/references.md`](../../references/references.md) owns the AMA
  reference list used by source and fixture citations.
- [`/references/experiments.md`](../../references/experiments.md) owns the
  referenceable official experiment list.

Production physics, formulas, algorithm choices, meaningful variations, and
fixture values require a citation to one of those authorities. Tests of API
shape, validation behavior, module boundaries, and other implementation
mechanics do not require physics citations.

## Verification

Run the production Jasmine lane with:

```text
npm run test:algorithm32
```

The current result is recorded in the
[baseline import status](../../agents/topics/algorithm32/production/baseline-import-status.md).
Specs live beside the source they exercise in `_tests/` directories.

Run focused Three/WebGL browser conformance with:

```text
npm run test:algorithm32:three
```

Browser-only Jasmine specs use the adjacent `*.browser.js` suffix and run
through Karma and headless Chrome without a Polylith or application build.
They cover real renderer and GPU contracts that Node cannot establish. A
software-renderer pass is conformance evidence only, not hardware performance
evidence. The [testing topic](../../agents/topics/testing/README.md) owns the
runner boundaries and conventions.

Run the JavaScript/JSDoc type-checking lane with:

```text
npm run typecheck:algorithm32
```

The baseline import status owns the current verification result; future
contract changes must preserve that lane without introducing compatibility
contracts.

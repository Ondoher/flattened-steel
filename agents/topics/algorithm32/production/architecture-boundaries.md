# Algorithm32 Production Architecture Boundaries

Status: current production ownership and authority contract.

This document owns cross-cutting production boundaries. Numerical cache
details belong to the [cache topic](../cache/README.md); sequencing and gates
belong to the [implementation plan](production-implementation-plan.md); and
the [ground topic](../ground/README.md) owns the active boundary design and
implementation handoff.

Repository-wide [Code Conventions](../../standards/code-conventions.md),
[Type Conventions](../../standards/types.md), and [JSDoc Conventions]
(../../standards/jsdoc.md) apply without exception. This document defines only
the Algorithm32-specific physical, numerical, cache, lifecycle, and production
ownership rules that supplement them.

## Authority

- `src/algorithm32` is implementation truth, but implementation alone is not
  physical or evidentiary authority.
- The CPU path is a deterministic selected-ray construction reference and,
  after the required independent conformance passes, the GPU oracle. It is not
  the product frame renderer.
- The GPU path consumes the same canonical physical and numerical facts, but
  owns its own resource construction and runtime orchestration.
- Production scattering-cache construction ultimately runs on the GPU. CPU
  construction remains the reference/parity surface, not a second production
  strategy.
- External sources and standalone official experiments justify facts and
  claims; production tests establish implementation conformance.

### Algorithm Source Promotion And Conformance

These rules apply whenever production adds, ports, changes, reviews, or
accepts numerical Algorithm32 behavior.

#### Evidence authority

- The closed Algorithm32-Star experiment is historical only. Its path-pinned
  bridge, evidence capsule, commands, gates, fixtures, policies, provenance,
  and browser harnesses were retired by reconciliation Step 1.2 on
  2026-08-01. None is a production regression oracle or future executable
  authority.
- Production identities must not retain an Algorithm32-Star source pin,
  immutable gold, comparison report, or conformance claim. A new numerical
  selection requires a new isolated evidence lane.
- Before a new numerical capability is implemented, its owning plan names the
  independent authority appropriate to that capability: an official
  experiment, analytic oracle, external reference solver/data set, or a sealed
  isolated baseline-and-candidate qualification boundary. Production source,
  design prose, tests, and comments alone are not numerical authority.
- If no independent authority exists, record the gap and obtain an explicit
  numerical design and evidence decision. Do not manufacture a retired
  experimental producer or infer a missing algorithm.

#### Required production recast

- Production implements the selected numerical contract through this
  repository's current ownership boundaries and the Algorithm32 physical,
  cache, GPU, and lifecycle contracts in this document. An evidence
  implementation's class layout, module structure, untyped values, and
  physical packing are not production architecture.
- Statement order, class structure, and CPU/GPU packing may differ only when
  the recast preserves the selected logical position, direction, wavelength,
  field, recurrence, and output behavior within a declared parity boundary.
- Production runtime modules must not import a retired experiment, experiment
  runner, candidate tree, or sealed result tree. Checked production tests
  consume only explicitly retained production-owned fixtures or comparison
  reports produced at the selected evidence boundary.

#### Required independent output evidence

- Every promoted algorithmic capability must compare its affected production
  outputs with the predeclared independent authority selected for that
  capability. The comparison must exercise the capability itself; adjacent
  output or a disabled branch, such as black ground for a reflective-ground
  capability, is not evidence for that capability.
- An evidence generator must import no live `src/algorithm32` production
  module unless its explicitly designed role is to measure production itself
  against a separate oracle. Its immutable gold artifact or durable report
  records the authority identity and hashes, harness identity, complete
  relevant inputs, profile and spectral basis, domains, controls, requested
  orders, boundary/source configuration, numerical precision, extraction
  policy, expected values or field hashes, and the acceptance rule.
- Tolerances and probe/query selection are declared before production output
  is observed. Coverage includes every affected order and output kind plus
  relevant omitted, zero, nonzero, boundary, and numerical-edge cases. Large
  fields may use content-addressed whole-field data or hashes together with a
  predeclared set of diagnostic values rather than embedding every scalar in
  a checked source fixture.
- The production binary64 CPU result becomes an accepted GPU oracle only after
  it passes the selected independent comparison for the affected capability.
  The GPU path is then compared against the same accepted gold or oracle under
  its declared precision bounds as well as against the accepted CPU reference
  where useful.
- Analytic formula tests, manufactured collaborators, type checking, aggregate
  spec counts, production-generated fixtures, CPU/GPU agreement, and visual
  images are useful evidence but do not replace the capability's selected
  independent output evidence.
- A change to an accepted authority, selected input, domain, control,
  extraction policy, or production algorithm requires a new versioned pin and
  affected comparison before acceptance.

#### Completion and audit language

- `Implemented` means the production path exists. An algorithmic stage may be
  called `complete`, `accepted`, or an `oracle` only when its required
  implementation, independent evidence, and other declared gates pass.
- Focused independent output evidence is an algorithmic stage gate, not
  follow-on release hardening. Broader integration coverage, scientific
  benchmarks, citations, and performance qualification may remain later
  gates.
- A conformance audit traces each production algorithm to its pinned authority,
  classifies the recast and any explicit deviation, identifies its independent
  output evidence, and records uncovered branches or edge behavior. Existing
  production code and passing tests are not presumed conformant without that
  trace.
- Implementation parity establishes fidelity to the selected authority, not
  physical truth. External references and registered official experiments
  remain the authority for scientific and publication claims.

## Ownership

### Implementation placement

- Concrete caller-instantiable or caller-selectable implementations live under
  `src/algorithm32/implementation/`.
- The current declaration-only interface tree and public implementation
  surface are summarized by the production [README](../../../../src/algorithm32/README.md#source-layout);
  `interfaces/`, `implementation/index.js`, and class-level `@implements` tags
  are executable truth.
- Each immediate child names the feature it implements and owns that feature's
  complete private closure, including caches, controllers, CPU/GPU support,
  shader contributions, renderer adapters, constants, internal declarations,
  tests, and fixtures.
- Global behavioral contracts are interfaces. Implementing JavaScript classes
  declare every intended interface through class-level `@implements` tags.
- Every coordinate transform is owned by the selected geometry and mediated by
  Algorithm32. For the first implementation, external code supplies
  unit-bearing latitude and longitude plus a canonical UTC instant through
  facade `Config`. Before any source-cache build, Algorithm32 passes that
  observation and the atmospheric light source to
  `GeometryModel.configureLightSource`. Geometry retains the canonical
  readonly placement and installs it directly on the
  `GeometryConfigurableLightSource`. Applications, sources, caches, and renderer
  adapters must not independently project between coordinate systems. A
  time/location change creates replacement geometry, source, facade, scene,
  and cache objects. In-place time/location animation is deferred
  mandatory MVP work and requires a separately accepted cache transform in
  production Stage 14.
- Atmosphere behavior is externally implementable through the global
  `AtmosphereModel` interface. `CanonicalAtmosphere` is the standard public
  concrete implementation and belongs under
  `implementation/canonical-atmosphere`; it is not the only atmosphere class
  callers may supply.
- Spectral basis and packet behavior is expressed by the public
  readonly `SpectralBasis` and `SpectralPacket` value interfaces. Their standard
  concrete builders are shared internals rather than selectable implementation
  features. The current Algorithm32 API exposes no spectral-basis override; the
  facade constructs the native-15 values. A different basis requires a future
  explicit API revision.
- Caller-authored spectral bases, packets, and distributions are deferred.
  Built-in public implementations resolve native-15 values from owned defaults;
  the API exposes no spectral constructor, factory, or configuration
  ingress for custom caller data.
- A benchmark owns its particular validation values. The Bruneton comparison
  owns its pinned direct 40-coordinate basis, spectral packets, atmosphere,
  ground, observations, directions, and numerical selections. Algorithm32
  accepts typed, basis-compatible execution configuration without recognizing
  a Bruneton profile name or embedding benchmark constants. Candidate
  generation remains separate from scoring and must regenerate the production
  boundary before rebuilding comparison images; retained candidate output
  alone is not the regeneration authority.
- Interfaces specify capabilities consumed by Algorithm32 and implemented by
  built-in classes. They are not a promise that
  callers can implement arbitrary light-source, cache, geometry, atmosphere,
  domain, shader, or spectral extensions using public internals.
- Cache position/direction domain classes are non-public construction
  mechanisms under `sampling-domains`; their executable behavior does not make
  them caller-facing implementation features without a public selection seam.
- Native-15 is readonly public profile configuration under
  `profiles/native-15`, not a behavioral implementation.
- The initial named ground-material set is grass only, represented by the
  uniform-Lambertian implementation with an internally owned native-15 albedo
  packet. The retained Bruneton comparison-paper input owns the grass
  reference. Snow requires a later contract expansion after its citation and
  numerical profile are selected; no provisional values may enter production.
  Ocean and its directional BRDF are a separately designed stretch goal, not
  an initial export or placeholder.
- Technical layers such as runtime, cache, GPU, shader, utilities, shared code,
  and types do not justify immediate implementation folders. Such code belongs
  to the feature that exposes it when exclusively owned there. A genuinely
  cross-feature, non-public mechanism may instead remain outside
  `implementation/` under its specific architectural owner; it must not be
  presented as a caller-selectable implementation.
- The completed feature reorganization has no live compatibility tree. Every
  executable module outside `implementation/` belongs to a responsibility-
  specific non-public owner named in the production README; migration
  inventories and checkpoints are archived evidence, not current path
  guidance.

- Atmosphere owns medium profiles, coefficients, phase functions, optical
  depth, and transmittance.
- Geometry owns physical ray bounds, ground intersections, node positions,
  source-relative framing, and resolved cache position/direction stencils.
- Each atmospheric light source owns its primary field, concrete cache type,
  source-specific physical domains and mapping, storage/layout decisions, and
  cache lifecycle inputs. Distant Sun and local Sun caches are distinct
  concrete implementations.
- Stored-field transport is integrated by the shared GPU operation from
  geometry-owned rays and stencils, atmosphere-owned extinction, and the
  source-owned stored-field layout. Geometry-expanded binary64 transport data
  remains a reference calculation, not a production GPU upload.
- The ground boundary owns typed BRDF evaluation; profiles own spectral
  albedo. Geometry owns the hit and normal, while the source/cache builder owns
  illumination quadrature, incidence cosine, and transport. A boundary does
  not accept incident radiance and return a fully integrated reflection.
- The shared `ScatteringCache` type is only Algorithm32's consumer contract.
  Each source-specific concrete cache owns its direct field identity and
  physical provenance where sampled, executable `CacheFieldStorage`, mapping,
  addressing, runtime binding, sampling, and lifecycle implementation. Cache
  code reads resolved stencils and does not infer physics from texture indices.
- Algorithm32 owns view traversal, transmittance, cache queries, path measure,
  and spectral accumulation.
- Composition/color owns endpoints and the single final spectral-to-display
  boundary.

### Supported Geometry And Source Pairings

Geometry and atmospheric-source implementations remain intentionally
independent behind their own contracts. Current production, parity, and
application scope nevertheless contains exactly two supported pairings:

- spherical geometry with the distant Sun; and
- flat geometry with the finite-distance local Sun.

That architectural independence does not create a Cartesian-product support
requirement. Spherical/local and flat/distant are not implementation,
conformance, application-integration, or release gates for the current
project. Adding either cross-pairing is a separately scoped future capability,
not implicit work required to prove the existing abstractions.

## Durable Contract Rules

- [Algorithm32 Standards: Durable Physical Data And Units](../standards.md#durable-physical-data-and-units)
  owns the unit-bearing physical-data and radiometric naming rules.
- Each fact has one canonical owner. Direct physical, spectral, field, plan,
  and packed-data identities remain only where an active consumer compares or
  reuses them; evidence fixtures may retain their own hashes without becoming
  shadow configuration.
- Executable domain owners expose their direct IDs and numerical behavior;
  concrete cache owners retain indexing, packing, allocation, storage,
  runtime-binding, and shader-addressing facts. Controller reuse derives from
  the direct source-owned plan identity and accepted backend capabilities.
  The exact retirement and assembly-declaration boundary is owned by
  [reconciliation Step 2.9](../archive/reconciliation-2026-08-04/algorithm32/reconciliation-plan.md#29-retire-descriptors-and-justify-assembly-declarations).
- Shader assembly is deterministic and mechanical. Domain owners provide
  shader semantics and resources.
- Configuration, setup, capability, compatibility, and awaited update failures
  fail loudly. An installed runtime preserves its last valid state or follows
  an explicitly designed safe failure path.
- Production runtime code never imports experiment runners, sealed records,
  archived code, topic documentation, or another repository.
- Physical expectations and tolerances live in checked fixtures and cite an
  external reference or registered official experiment.

## Integration Rule

Each capability is implemented on CPU first, followed by its GPU construction
or runtime path and focused parity/lifecycle checks. CPU-only work is an
intermediate state. Full citation coverage and broad unit/integration testing
remain follow-on hardening before release or publication.

## Explicit Exclusions

- Historical Mark I, abandoned-reference, reconciliation, and experimental
  class structures are not production architecture.
- A passing aggregate spec count is not physical validation or CPU/GPU parity.
- Renderer RGB, camera-specific pixels, and application state are not
  atmospheric cache data.
- Rolled-back extraterrestrial production modules are not current behavior.

## Archive Source

These boundaries were recovered from the archived extraction audit after
removing chronology, stale source paths, and superseded implementation advice.
The immutable source is the
[topic-documentation archive](../../../../archives/topic-documentation-archive-2026-07-19.zip).

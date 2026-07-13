# Extraterrestrial Adoption Guidance

Status: active cross-cutting guidance for adopting extraterrestrial-source
evidence into production. It supplements the [Extraterrestrial production
follow-up](promotion-plan.md) and the [Celestial Contribution Cache
design](celestial-contribution-cache-design.md); it does not define a source,
cache layout, or runtime owner.

## Scope

Apply this guidance whenever an extraterrestrial source, cache, renderer path,
or experiment result is proposed for Algorithm32 production. It carries forward
the reusable promotion discipline of closed experiments without retaining an
experiment, its runners, generated output, or its source tree as a production
dependency.

## What A Source Proposal Must Include

- A source definition identifies the physical quantity, units, spectral basis,
  point/bin meaning, provenance, licensing/redistribution status, and capability
  limit. Apply the [Algorithm32 durable physical-data and unit rules]
  (../algorithm32/standards.md#durable-physical-data-and-units) to every
  durable contract.
- The proposal names whether the source is distant or finite, resolved or
  unresolved, static or live, and the geometry/source pairings it supports. It
  does not imply unsupported pairings merely because another source has a
  similar logical shape.
- The proposal separates static source facts from geometry-owned live placement
  and receiver state. A static fact or cache-domain change may replace a
  generation; a compatible live transform updates bindings without rebuilding
  a cache.
- The proposal identifies the transport stage and composition boundary. It
  preserves atmospheric path radiance and adds celestial radiance exactly once
  before Color performs the sole spectral-to-display conversion.

## Evidence And Production Recast

- A closed experiment is evidence, not production architecture. Its class
  layout, source paths, runners, fixtures, generated artifacts, and diagnostic
  helpers are never runtime or build dependencies.
- Before promotion, select an independent authority appropriate to the source:
  an official experiment, analytic oracle, external solver/data set, or a
  sealed isolated qualification boundary. Record the authority identity,
  complete relevant inputs, domains, profiles, spectral basis, precision, and
  claim limit.
- Declare comparison tolerances, query/probe selection, controls, and required
  zero, nonzero, boundary, and edge coverage before observing production output.
  CPU/GPU agreement alone does not establish physical fidelity.
- Recast only the accepted semantic contract through the current production
  source, geometry, cache, ShaderBuilder, renderer, and Color owners. Create a
  file-by-file promotion record that distinguishes ported behavior from rejected
  experiment-only material.

## CPU, GPU, And Runtime Qualification

- The CPU calculation is the deterministic selected-ray/reference surface; it
  is not a parallel product renderer. It becomes a GPU oracle only after the
  selected independent comparison accepts the affected capability.
- The GPU owns its resource construction, publication, and runtime
  orchestration. It consumes the same physical and numerical facts under a
  declared precision boundary.
- Cache construction publishes only a complete successor generation, preserves
  the last valid generation when staging fails or is superseded, and disposes
  idempotently without assuming ownership of an externally supplied backend.
- Qualification covers the normal renderer route, matched scene visibility,
  no-source fallback, replacement failure, disposal, and context
  loss/restoration. Camera, viewport, scene-hit, and display state are renderer
  inputs, not cached source facts.

## Explicit Exclusions

- Do not treat a historical experiment name, its terminology, or a retained
  source path as an authority for a new extraterrestrial capability.
- Do not promote a qualification-only evaluator, meter, report reader, or
  manual refresh control as a public runtime API.
- Do not make a visual capture, CPU/GPU parity result, or source catalog
  selection a physical-release claim without its separately selected authority
  and declared qualification.

## Related Current Owners

- [Extraterrestrial production follow-up](promotion-plan.md) owns the active
  production backlog and promotion status.
- [Extraterrestrial Production Integration API Plan]
  (production-integration-api-plan.md) owns the API-first integration sequence
  and ownership assessment.
- [Celestial Contribution Cache design](celestial-contribution-cache-design.md)
  owns the current cache-design boundary.

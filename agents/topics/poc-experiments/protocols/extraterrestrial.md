# Extraterrestrial Adoption Guidance

Focus: Bounded experiment admission, evidence, and promotion.

Related owners: [qualification](../../production-algorithm32/qualification/extraterrestrial.md).

## Scope

Apply this guidance whenever an extraterrestrial source, cache, renderer path,
or experiment result is proposed for Algorithm32 production. It carries forward
the reusable promotion discipline of closed experiments without retaining an
experiment, its runners, generated output, or its source tree as a production
dependency.


## What A Source Proposal Must Include

- A source definition identifies the physical quantity, units, spectral basis,
  point/bin meaning, provenance, licensing/redistribution status, and capability
  limit. Experimental work may voluntarily carry over the
  [production Algorithm32 scientific-data practice](../../standards/overlay.md#add-production-algorithm32-scientific-quantities-provenance-and-profile-completeness),
  but that production-folder entry does not govern an experimental lane.
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


## Explicit Exclusions

- Do not treat a historical experiment name, its terminology, or a retained
  source path as an authority for a new extraterrestrial capability.
- Do not promote a qualification-only evaluator, meter, report reader, or
  manual refresh control as a public runtime API.
- Do not make a visual capture, CPU/GPU parity result, or source catalog
  selection a physical-release claim without its separately selected authority
  and declared qualification.


## Related Current Owners

- [Production Color and celestial contracts](../../production-algorithm32/color-celestial/README.md)
  own the selected implementation.
- [Production architecture](../../production-algorithm32/architecture-contracts/README.md)
  owns current API and lifecycle boundaries.
- [Release closeout](../../production-app/release/color-star-cache-closeout-plan.md)
  owns the cross-surface backlog; the former integration plans are archived.

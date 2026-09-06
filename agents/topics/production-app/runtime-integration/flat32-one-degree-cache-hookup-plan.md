# Flat32 One-Degree Scene-Cache Hookup

Focus: Application attachment, lifecycle, state, and asset delivery.

Related owners: [qualification](../../production-algorithm32/qualification/flat32-one-degree-cache-hookup-plan.md).

## Goal

Connect Flat32's spherical/distant mode to the generated one-degree cache
inventory through a scalar-solar-zenith server resolver while preserving the
actual scene Sun direction, exact package validation, one-cache residency, and
atomic runtime replacement.

The completed production-adoption work remains the implementation baseline.
This plan does not reopen cache construction, spectral representation, Q30,
Color, geometry endpoints, or the local-Sun path.


## Fixed Decisions

- Solar azimuth is not a cache dimension. Spherical symmetry, the
  source-relative cache frame, the Bruneton/B1 directional evidence, the six
  scene builds, and complete-rotation tests establish the rotational contract.
  A focused covariance regression records that contract; no additional
  azimuth inventory is built.
- Flat32 derives the actual distant-Sun direction once from its observation by
  using the existing production placement equations. That live direction owns
  scene lighting and Geometry source placement.
- The cache package owns its representative solar-zenith bin and canonical
  build provenance. Its manifest direction does not replace the live scene
  azimuth.
- The resolver request contains one finite scalar solar-zenith angle in
  degrees. Location, time, azimuth, model identity, and cache identity are not
  resolver inputs.
- The resolver returns a small descriptor. Immutable manifest, ledger, exact
  R32F payload, and R16UI index files remain static content-addressed assets.
- Only one complete cache is resident. Existing candidate isolation, failed-
  replacement preservation, cancellation, supersession, and atomic
  publication remain the lifecycle.
- The verified source inventory is immutable. Runtime-only derivatives are
  emitted into a new output root; generated payloads are not committed as
  source.
- Angles beyond the qualified non-dark range return an explicit dark or
  unsupported result. They never clamp silently to 108 degrees. A dark result
  selects the one shared texture-free zero-scattering cache and remains a
  successfully published Algorithm32 state; unsupported remains a failure.


## Target Flow

```text
Flat32 observation
  -> production distant-Sun placement owner
  -> actual direction + observer solar zenith
  -> GET resolver(solarZenithDegrees)
  -> exact bin/package descriptor
  -> manifest and payload hash validation
  -> immutable R32F/R16UI upload
  -> candidate preflight
  -> atomic Flat32 publication
```


## Stop Conditions

Stop only for a defect that changes the selected cache representation, requires
an azimuth dimension despite the fixed rotational contract, violates the
immutable inventory, or prevents a safe recommendation. Ordinary endpoint,
packaging, asynchronous-lifecycle, and application-integration defects remain
part of this plan.

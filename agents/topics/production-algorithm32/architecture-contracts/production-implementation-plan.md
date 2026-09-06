# Algorithm32 Production Implementation Plan

Focus: Public engine capabilities, ownership, and dataflow.

Related owners: [transport-geometry](../transport-geometry/production-implementation-plan.md), [qualification](../qualification/production-implementation-plan.md), [product-behavior](../../production-app/product-behavior/production-implementation-plan.md), [protocols](../../poc-experiments/protocols/production-implementation-plan.md).

## Frozen First-Release Contract

| Concern                   | Selected contract                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spectral core             | 15 scalar spectral channels; no atmospheric RGB/RGBA semantics                                                                                                                                    |
| Scattering order          | cumulative `J1 + J2 + J3 + J4` by default                                                                                                                                                         |
| Spherical/distant domains | ordered Native-48 altitude positions, pinned Fibonacci-34 incoming quadrature, and source-aligned W27 outgoing directions                                                                         |
| Flat/local domains        | source-subpoint z19/rho15 positions, pinned paired-Fibonacci-34 incoming quadrature, and source-aligned W27 outgoing directions                                                                   |
| Flat/local primary fields | 2,048-shell arithmetic-mean held inverse-square amplitude in `J1` only; separate continuous finite-source `L1`                                                                                    |
| Transport control         | production 15-interval construction and final-view controls                                                                                                                                       |
| Final view lookup         | geometry-owned physical-position stencil plus W27 direction interpolation; Native-48 actual-neighbor linear for spherical and clamped z/rho bilinear for flat                                     |
| Construction lookup       | retained construction-time behavior; view-only interpolation never enters recurrence transport                                                                                                    |
| Cache value               | observer-independent cumulative local spectral scattering density                                                                                                                                 |
| Runtime work              | view transmittance, one cache lookup per path sample, path measure, spectral accumulation                                                                                                         |
| Ground                    | geometry owns hit/normal; boundary owns BRDF; profile owns spectral albedo; uniform Lambertian first                                                                                              |
| Lifecycle                 | atmospheric light source defines plan/reuse and lifecycle policy and creates one controller per runtime; that controller stages, rebuilds, and atomically publishes its active cache              |
| Display                   | E8 projects atmospheric path radiance once; captured renderer-linear scene sRGB is attenuated by the retained red/green/blue display-band transmittance and combined at the same display boundary |

The retired Star parity corpus historically used 40 construction intervals.
Its comparison-only control and capture are not a current executable or rerun
surface. Neither changed the production 15-interval default or entered
controller/runtime publication.

The recurrence remains:

```text
J1 = primaryScatteringDensity(lightSource, atmosphere)
JthroughN = J1

if N >= 2:
  L1 = primaryTransportedRadiance(lightSource, atmosphere)

for k = 2 through N:
  Jk = scatter(L(k - 1))
  JthroughN += Jk
  if k < N:
    Lk = transport(Jk)
```

`J1` and `L1` are separate source-specific primary fields in the retained
production implementation selected during the historical Star work. Generic
stored-field transport begins with `J2 -> L2`; it
does not replace the direct primary `L1` seed. Only a pure preceding order
feeds the next order. The cumulative field never feeds the recurrence.


## Ownership Boundaries

- **Atmosphere** owns medium profiles, spectral coefficients, phase functions,
  optical depth, and transmittance.
- **Geometry** owns physical nodes, atmosphere/ground ray bounds,
  node-to-physical reconstruction, physical-position stencils, and
  source-relative framing. It never reads cache values.
- **Atmospheric light source** owns its concrete cache type, source-specific
  `J1`/`L1`, physical domains and mapping, storage/layout implementation,
  direct source-owned plan identity and reuse-key policy, and the controller
  factory. Each source-created per-runtime controller owns build scheduling,
  invalidation, staging, publication, failure isolation, and disposal for one
  consumer. Distant Sun and local Sun caches remain distinct concrete
  implementations.
- **Generic order builder** owns source-independent `L(k-1) -> Jk` and optional
  `Jk -> Lk`. It has no camera, object, RGB, or display dependency.
- **Ground boundary** owns reflection evaluation, not geometry or profile data.
- **Shared cache contract** defines completed-cache behavior and lifetime. The
  CPU capability adds synchronous sampling and direct sample provenance for
  the oracle; the GPU capability adds opaque runtime bindings and a final-view
  shader contribution without a synchronous readback sampler. No shared
  interface is a universal concrete cache class.
- **Concrete source cache** owns direct field identity, logical layout,
  packing, shader-addressing definition, reconstruction mapping, and physical
  provenance where sampled. The renderer backend owns physical allocation,
  and the executor owns pass/layer submission. No cache infers physical
  coordinates from texture dimensions.
- **Algorithm32** owns view traversal, view transmittance, cache queries, path
  quadrature, and spectral accumulation.
- **Composition/color adapter** owns scene endpoints, accepted
  extra-atmosphere contributions, and the one final RGB boundary.

The core stays renderer-neutral. A renderer adapter supplies GPU resources,
object hit distance, and presentation. Three.js may own object materials and
shadows in the Flat app, but is not atmospheric-physics infrastructure.


## Extension Boundaries

- Static objects shorten view rays and do not enter cache construction.
- Renderer materials and shadows remain renderer concerns. Atmospheric object
  shadows and volumetric shafts are deferred.
- Extra-atmosphere point and extended sources compose after atmosphere exit
  and neither seed nor invalidate this cache.
- The required finite-distance local Sun reuses the generic later-order
  builder, consumes geometry-owned source-relative mapping, and owns a new
  primary field and full-rebuild lifecycle.
- Required flat geometry implements the geometry contract; it does not add
  flat-only coordinates to the generic cache.


## Production Source Shape

The final production paths and ownership boundaries are maintained only by the
[canonical selected target tree](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/source-organization-plan.md#selected-target-tree).
This implementation plan does not duplicate that layout. Production must not
retain imports from `scripts/`, sealed run directories, or
`C:\dev\poly-gc-react`; required constants, algorithms, and fixtures are
standalone production assets with their direct source and evidence identities.

The completed Stage 0 through Stage 11 records below preserve exact
pre-retirement Star paths, hashes, runs, comparisons, and then-current gate
language as historical evidence. They are not instructions to reopen the
retired experiment, regenerate its output, or treat it as current authority.


### 16. Verify the single production strategy

- Verify that the Stage 7 source-owned GPU cache and runtime sampler remain the
  only production Algorithm32 strategy across the later ground, integration,
  extraterrestrial, flat-geometry, and local-Sun work. Plain Algorithm32
  continues to request order 4.
- Audit for obsolete sampler fields or incident-strategy artifacts and treat
  any finding as an earlier direct-cutover defect. Contract aliases, fallback
  readers, translation bridges, and old/new switches are prohibited
  throughout implementation and are never deferred to this stage.
- Retain only the independent CPU oracle and fixtures needed for conformance.

**Gate:** one strategy remains, supported builds/tests pass, and production
has no import from research or legacy repositories.

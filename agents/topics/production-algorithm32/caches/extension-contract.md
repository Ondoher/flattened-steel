# Flat Geometry And Local-Source Extension Contract

Focus: Cache construction, storage, reconstruction, loading, and optimization.

Related owners: [transport-geometry](../transport-geometry/extension-contract.md).

## Cache Reuse Identity

The local source-owned plan identity includes every value that can change
transport:

- atmosphere profiles, coefficients, phase behavior, and spectral basis;
- geometry family, frames, bounds, and physical boundary policy;
- source kind, position, height, spectrum/power, radius and distance policy;
- ground boundary and profile data;
- position, incoming, and outgoing domains and weights;
- construction quadrature and path controls;
- maximum scattering order, quantity/unit, precision, layout, and schema; and
- source-owned primary-field implementation revision.

Camera, ordinary scene objects, display controls, and final-view-only dome
state remain excluded unless they physically enter construction.

The controller combines that direct plan identity with accepted backend
capabilities to derive its deterministic reuse key. Equality may reuse only
that controller's active cache; no copied owner snapshot or public
construction-identity packet participates.


## CPU And GPU Completion Contract

CPU implementations own readable physical quantities, unit accounting,
analytic invariants, recurrence behavior, and high-accuracy selected queries.
The production cache is then built on the GPU using the same executable
physical domains, selected options, and direct field/storage facts. GPU
resources remain scalar spectral quantities; RGBA lanes may be temporary
arithmetic or display output but are not spectral cache semantics. Each
completed GPU cache is published through the shared source-controller/runtime
binding and sampled through the shared view-transport contract before the
capability is complete. This engine gate does not depend on the later
`flat32` application adapter.

Focused CPU/GPU comparison must cover primary-field samples, pure and
cumulative orders, complete rays, interpolation boundaries, ground-bound
segments, lifecycle invalidation, and failure publication. A geometry-only or
source-only implementation is not a completed phase. Algorithm32 is not
complete until the paired flat/local configuration has accepted CPU, GPU, and
shared-runtime paths while the two owners remain independently testable.

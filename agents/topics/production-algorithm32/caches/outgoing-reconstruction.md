# Selected Outgoing Reconstruction

Status: W27 selected and integrated for the first spherical, distant-source
CPU/GPU cache; release-level combined-browser and supported-hardware hardening
remain open.


## Decision

Use a source-aligned, boundary-inclusive gnomonic cubed sphere with
`faceWidth = 27` and dominant-face seam-consistent bilinear lookup for the
outgoing scattering-density domain.

- Stored directions: `6 * 27^2 = 4,374`.
- Unique physical directions after seam/corner duplication: `4,058`.
- The frame is right-handed and its `+X` face center points toward the
  atmospheric light source.
- Reflection-completed ordinary Fibonacci-68 remains the separate current
  incoming angular quadrature.
- W27 applies to pure `Jk` and cumulative `JthroughN` reconstruction; it does
  not change the recurrence or the incoming integration.

Widths 4 through 26 failed the frozen candidate criteria; W27 is the smallest
passing width and an independent repeat reached the same conclusion. Width 27
has a narrow selected margin at the topology-boundary gate, so the exact
executable domain definition, generator inputs, node table, lookup, and
thresholds are part of the decision and must not drift during implementation.


## Frozen Selection Gate

The binary64 authority evaluated physical outgoing queries directly from the
pinned incoming field rather than sampling an outgoing cache. It covered all
15 channels, pure orders through `J4`, cumulative `Jthrough2` and
`Jthrough4`, low/interior/high positions, whole-sphere withheld directions,
source and anti-source axes, horizon/nadir/zenith cases, seams, corners, cell
boundaries, and completed spectral view rays.

| Measurement | Limit | W27 result |
| --- | ---: | ---: |
| Fixed/general local p95 normalized RMS | `<= 0.02` | `0.00478725` |
| Fixed/general local maximum normalized L-infinity | `<= 0.10` | `0.0326460` |
| Topology local maximum normalized L-infinity | `<= 0.10` | `0.0337060` |
| Tangent-gradient p95 normalized error | `<= 0.02` | `0.000207378` |
| Maximum excess boundary-gradient jump | `<= 0.01` | `0.00975495` |
| Completed-ray p95 normalized RMS | `<= 0.01` | `0.00848924` |
| Completed-ray maximum normalized L-infinity | `<= 0.05` | `0.0136149` |
| Maximum completed-ray Delta E ITP plus display uncertainty | `< 1` | `0.397654` |

These are project engineering limits for reconstruction of the pinned
discrete algorithm. They are not universal atmospheric-accuracy or human-
visibility thresholds.


## Resource Boundary

For 48 positions, 15 scalar channels, and 32-bit storage:

- one W27 `J` field is `12,597,120` bytes;
- one 34-direction `L` field is `97,920` bytes; and
- a `3J + 2L` core estimate is `37,987,200` bytes before metadata, transient
  resources, and driver overhead.

Those values are layout arithmetic and a research peak estimate, not measured
production GPU budgets. Production must report cold and rebuild time,
peak/resident memory, lookup cost, and staging behavior on supported hardware.


## Implementation Requirements

- Keep W27 on the executable `CubedSphereDirectionDomain` owner with its
  direct domain ID, readonly vector table, face topology, and stencil
  resolution.
- Preserve physical vectors, source-relative frame, face topology, duplicated
  seam/corner semantics, and dominant-face bilinear interpolation.
- Exercise exact nodes, both sides of seams, corners, constants, nonnegative
  weights summing to one, and manufactured smooth fields in CPU and shader
  tests.
- Compare CPU and GPU at identical physical queries; never compare different
  domains by texel index.
- Keep the 34-node incoming loop independent of the 4,374-node outgoing work.
  Increasing outgoing width changes work and memory approximately linearly,
  not exponentially with scattering order.

The focused Stage 7 real-WebGL gate now exercises exact axes, a face interior,
a seam tie, and a corner across every policy position and all 15 wavelengths
through an address-sensitive manufactured R32F field. Those checks establish
the production shader addressing seam. A capable-renderer full native lane and
the sparse binary64 complete-ray fixture remain release hardening.


## Claim Boundary

W27 is selected only as an outgoing interpolation representation inside the
pinned spherical, distant-source recurrence. The evidence does not validate
the incoming quadrature (historically Fibonacci-34 and currently reflected
Fibonacci-68), the altitude-node placement, construction intervals, release
order, flat geometry, local sources, or continuous atmospheric truth. The
[solar-zenith cache design](solar-zenith-cache-design.md) owns a proposed
factored successor representation and does not silently extend this W27 claim.

The coherent outer-limb artifact seen in a W27 dome was traced to the former
nearest/floor altitude lookup. It did not reject W27. The selected correction
is the separate [view-only spatial reconstruction](spatial-reconstruction.md),
which leaves every W27 field value and construction read unchanged.

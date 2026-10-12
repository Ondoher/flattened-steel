# Local-Sun Per-Tap Directional Qualification

This bounded P1 slice adapts the retained compact spatial/angular lookup to the
existing flat geometry owners. The [port status](local-sun-cache-promotion-status.md)
owns completion and its matching primary/audit receipt. It supplies interpolation
support; spectral density restoration, field sampling and transport remain open.

## Executable Behavior

`FlatEarthGeometry.resolveCompactLocalSunCacheStencil` delegates to
`FlatScatteringCacheGeometry`. It accepts a configured finite source, a paired
`CompactLocalCacheTopology`, unit-bearing physical position and outgoing direction.
It validates matching unit-bearing source height/slab, topology operations and complete
spatial support before returning positive compact position weights and a separate
W27 directional stencil for every spatial tap. Invalid topology/direction or
outside slab/cylinder support rejects; no missing-tap renormalization or clamp.

The retained CPU helper `shellNodeDirectionStencil` and preserved shader in
`00529-p3-frame-policy/source-shell-geometry.js` establish the exact rule:

- Ordinary spatial taps use the query's radial/tangent/vertical geometry frame.
- Axis taps replace horizontal azimuth by the geometry's canonical meridian,
  preserving horizontal magnitude and vertical direction. Their local direction
  is `(hypot(dx,dy),0,dz)` after accepted direction normalization.
- W27 remains the shared outgoing reconstruction owner. Joint interpolation
  weights are spatial weight times that tap's angular weight.

This is separate angular selection per spatial tap; it does not invent a new
rotation to each physical node or add an independent Sun-angle position axis.
Geometry retains coordinate ownership. Source/geometry coupling redesign remains
deferred. The capability does not activate a compact profile or change defaults.

## Independent Controls And Gates

The [angular fixture](../../../../src/algorithm32/implementation/flat-earth/fixtures/local-sun-directional-controls.json)
contains 65 predeclared combinations: thirteen physical directions in five radial
frames, including both vertical limits, cardinal directions, general directions
and probes on either side of a cube-face seam. Independent dominant-face
projection and bilinear equations supply scalar gold, without production numerical
imports or historical source execution. First-face tie order, W27 face-major
addressing and the retained 1e-10 exact-grid convention are explicit. Equivalent
seam addresses compare through exact independent cube-lattice coordinates.

Authenticated retained source, snapshot inputs/manifest and ended experiment
helper establish the rule. Their complete original derivation records accompany
the fixture. The existing P0 fixture supplies all 1,049 node and selected-query
spatial gold, including its immutable ancestry. Portable proof needs only the
checked fixtures, not the generated historical tree. Authoring requires those
read-only parents. Producer/documentation corrections preserved earlier draft
authorities under the task's ignored root; numerical controls and gates did not
change after scoring. Final authority SHA-256 is
`3950f22be0b4a43ed1237ecde3cf00219a201a9648bace1306bd6dc2fd6413b1`.

Dimensionless angular-weight and joint-sum limits are 1e-12. Spatial exact-node
weights retain P0's 1e-10 allowance, including tiny adjacent support. Synthetic
near-axis fan continuity uses 1e-10, chosen before scoring. These are binary64
interpolation gates, not physical field accuracy bounds. Exact cylinder queries
use representable canonical positions; rotated binary64 endpoints can lie a few
ulps outside support and must reject. This slice does not qualify arbitrary
boundary rotations or complete horizontal reuse.

## Selected Comparison

New immutable
[00011-directional-support](../../../../tmp/production-local-sun-cache-promotion/runs/00011-directional-support/comparison.json)
records 13,936 spatial/angular comparisons, 208 mixed axis/ordinary queries and
all 4,374 exact W27 logical directions, including equivalent seam aliases.
Maximum spatial-weight error is 4.8298032240268185e-12; angular-weight error is
3.552713678800501e-15. Near-axis bounded synthetic fan discrepancy is
2.220446049250313e-16. Three outside-support positions and a zero direction
explicitly reject. The synthetic continuity check covers the vanishing fan
contribution, not smoothness or accuracy of a physical scattering field.
An equivalent structural topology with kilometre pairing facts is accepted;
a mismatched source height rejects. The public interface carries behavior rather
than a private concrete-class identity. Five numerical/interface rejection cases
are covered in total.

```text
node scripts/algorithm32/local-sun-cache/directional/LocalSunDirectionalProof.js
npx --no-install tsc -p scripts/algorithm32/local-sun-cache/directional/jsconfig.json
```

Engine/proof type checks and six focused existing W27 regressions pass. The proof
also runs from another working directory. `--out <new-plan-run-directory>` rejects
existing runs before scoring and writes only new plan-owned ignored evidence.
Paths derive from repository identity and reject traversal, symlinks and junctions.
The copied authority and manifest retain input/equation/configuration/tool and
current source identities. Failed partial writes remain inspectable without a
passed manifest. `--derive` is explicit fixture authoring and rejects an existing
fixture. This subsecond support proof performs no field construction or GPU work.

Remaining P1 acceptance includes normalization/restoration, selected column
transport, pure/cumulative fields and independent field/ray outputs, complete
profile activation and changed-profile support. GPU, reuse/frame publication and
application consumers retain their later plan gates.

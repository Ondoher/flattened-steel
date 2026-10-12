# Local-Sun Incoming Quadrature Qualification

This bounded P1 slice ports the selected flat incoming measure and compares it
with independent retained controls. The [port status](local-sun-cache-promotion-status.md)
owns completion. Per-node geometry transforms, directional reconstruction,
normalization, transport and scattering fields remain separate P1 gates.

## Selected Executable Owner

`FlatHorizonPartitionedDirectionDomain` is exported through the existing
`sampling-domains` facade and implements `WeightedDirectionDomain`. It owns a
fixed immutable 1,920-sample measure: 40 Gaussian polar nodes and 48 cyclic
midpoint azimuths. No profile/default selection is changed by the export.

Polar partitions use vertical cosine edges
`[-1,-0.1,-0.01,-0.001,0,0.001,0.01,0.1,1]`, with eight Gaussian nodes in each
outer band and four in each of the six inner bands. Azimuth is
`phi=2*pi*(a+0.5)/48`. The positive steradian weight is the Gaussian polar weight
times the band half-width times `2*pi/48`. Ordering is band ascending, Gaussian
root descending and azimuth ascending, preserving the historical sample order.
The retained bounded Newton/Legendre calculation rejects nonconvergence; these
fixed four/eight-point rules converge under the selected policy.

Coordinates are the flat radial/tangent/vertical cache basis, with positive Z
up through the slab. Geometry retains physical-frame transforms; the domain
introduces no Sun-angle position axis or source/geometry coupling redesign.
The [P0 applicability inventory](local-sun-cache-p0-contract.md#parameter-applicability)
owns why the flat horizon/cylinder policy differs from distant F68. Correctness
of this measure does not establish that F68 is universally invalid or quantify
physical integration error. Other quadratures/counts require separate selection
and controls; this owner has no tuning interface.

## Independent Control

The [checked fixture](../../../../src/algorithm32/sampling-domains/direction/horizon-partitioned/fixtures/local-sun-incoming-controls.json)
projects all 1,920 `shiftedNodes` from immutable `00093-p3-angular-diag/result.json`.
It authenticates the complete result, diagnostic inputs and manifest by SHA-256.
The historical helper identity equals the retained `00529-p3-frame-policy`
source snapshot; the selected `00478-p3-contract` preserves the same incoming
policy. Original diagnostic/snapshot/contract ancestry, source snapshot,
operations, parameters and tool identities accompany the projected values.

The offline producer neither executes historical source nor imports live
production numerical code. No experiment run is reopened. The vector, weight
data, input identities and comparison limits were frozen and repository-formatted
before candidate scoring. Portable comparison reads only this checked fixture;
authoring alone needs the historical generated tree.

## Predeclared Gates

Every ordered vector component compares within 1e-12 (dimensionless), every
weight within 1e-14 sr, and constant/hemisphere measure within 1e-11 sr. The mass
limit retains the original helper's normalization gate. Analytic band moments
compare within 1e-12 sr. The distinct component/weight/moment allowances cover
binary64 algebra, were selected before scoring and are not physical-error bounds.

The proof verifies positive finite weights, unit vectors, exact count/policy/band
identities, no horizon/pole endpoint sample, full `4*pi` and half-sphere `2*pi`
measure, zero first moments, equal `4*pi/3` diagonal second moments, and all
80 Gaussian band moments through each band's degree `2*n-1`. Published arrays,
vectors and weights are immutable; mutation attempts reject.

```text
node scripts/algorithm32/local-sun-cache/incoming-quadrature/LocalSunIncomingQuadratureProof.js
npx --no-install tsc -p scripts/algorithm32/local-sun-cache/incoming-quadrature/jsconfig.json
```

Controls `--derive` explicitly authors only a new fixture and rejects an existing
one; format that fixture before freezing its byte identity. Proof
`--out <new-plan-run-directory>` writes new immutable comparison evidence only
below `tmp/production-local-sun-cache-promotion/runs/`. Repository-derived paths
reject traversal and links. Partial failed writes remain inspectable without a
passed manifest; earlier runs remain unchanged.

The selected comparison is
[00008-incoming-quadrature](../../../../tmp/production-local-sun-cache-promotion/runs/00008-incoming-quadrature/comparison.json).
Status links the matching complete primary/audit receipt. Proof success does not
alone establish standards-review completion or acceptance of fields, transport,
GPU, complete profiles, reuse or application consumers.

# Flat-World Atmosphere Boundary Input Decision

Status: selected and Stage 1-verified engineering-experiment input. This
decision and its accepted implementation supplied the boundary for accepted
Stage 2 and the now-terminal Stage 3 candidate study. They remain the physical
boundary of the retained Stage 3 evidence, do not select the proposed cache
for production, and do not claim that `poly-gc-react` already implemented or
accepted the map-centered whole-world boundary.

The Star input files and runs referenced below are archive-internal historical
evidence. Resolve them through the
[Algorithm32-Star evidence index](../../../../evidence/algorithm32-star/README.md);
do not reopen this decision as an implementation lane.

## Decision

Stage 1 uses the retained
[boundary profile](../../../../scripts/algorithm32-star/cases/flat-world-atmosphere-boundary-profile-v1.json)
and
[execution policy](../../../../scripts/algorithm32-star/cases/flat-local-dome-cache-index-stage1-policy.json).
The first deciding calculation also uses the retained
[case matrix](../../../../scripts/algorithm32-star/cases/flat-local-dome-cache-index-stage1-matrix-v1.json).
Their SHA-256 identities are:

| Input | SHA-256 |
| --- | --- |
| `flat-world-atmosphere-boundary-profile-v1.json` | `59241f0ada85b08ea8264f36d31317dbd01a3ad0c784d21434b7ca27ef0af46c` |
| `flat-local-dome-cache-index-stage1-matrix-v1.json` | `903b3b0dbeaabe612b8298fca8eaac335815655acafd6974bf514e8d108fda6b` |
| `flat-local-dome-cache-index-stage1-policy.json` | `3200b1f3a9b131a7c8aeaaa9251618665dc4714e543fafa1581a47465351e431` |

The selected physical inputs are:

| Fact | Selected value |
| --- | --- |
| Fixed frame | `north-pole-aeqd-fixed-map-z-up-meters-v1` |
| Map center `C` | `[0, 0] m`, the North-Pole AEQD projection origin |
| Ground origin | `[0, 0, 0] m` |
| Horizontal map mapping | `x = rho sin(lon)`, `y = rho cos(lon)` |
| Vertical coordinate | `z = altitudeMeters` |
| Whole-world footprint | Closed circular North-Pole AEQD disc |
| Projection sphere radius | `6,371.0088 km` |
| Map radius `R` | `(Math.PI * 6371.0088) * 1000 = 20,015,114.442035925 m` |
| Geographic rim | The projection-degenerate South Pole |
| Flat boundary profile | `earth-clear-day` |
| Optical medium | Star's already pinned 15-channel `canonical-atmosphere` |
| Atmosphere apex `H` | `100,000 m` |
| Atmosphere surface | The map-centered shallow spherical cap selected by the cache design |

`R` retains the source's kilometer-first JavaScript evaluation order. The
stored executable value, rather than a separately rounded decimal rendering
of `pi * 6,371,008.8 m`, is the experiment input.

## Boundary Meaning

The physical atmosphere domain is the volume between the finite ground disc
and the selected cap:

```text
centerZ      = (H^2 - R^2) / (2H)
sphereRadius = (H^2 + R^2) / (2H)

0 <= rho <= R
0 <= z <= capAltitude(rho)
```

The cap is a transparent atmosphere exit. It terminates density, scattering,
absorption, and optical-depth integration without compressing or rescaling
the altitude-based medium. Transport then continues through vacuum to the
unchanged finite source. Source direction, inverse-square falloff, and
source-radius behavior retain the complete sample-to-source distance.

The ground disc is the separate opaque boundary. The rim is the
zero-thickness seam where the ground and cap meet:

- it is not an opaque or reflective vertical wall;
- crossing out of the selected atmosphere volume across the cap or rim is a
  transparent atmosphere exit;
- entering the ground half-space is an opaque ground hit; and
- an exact seam contact is reported as `rim-contact`, preserving both the
  ground-contact and atmosphere-exit facts instead of hiding the tie.

There is no ground outside the whole-world disc. A future reflective or
transmissive rim material would be a different selected boundary and is not
part of this experiment.

The same physical exit is required for view, source-transmittance,
direct-primary, and reusable cache-construction paths. Camera position,
observer-local presentation transforms, the camera far plane, a scalar
no-hit limit, cache radius, and cache node envelope do not change it.

## Frozen Stage 1 Numerical Matrix

Before physical output, the deciding matrix fixes the exact center, low-
altitude, axial, transverse, ground, apex, tangent, inward, outward, rim,
source-axis, oblique, and outside-domain cases. It also fixes the
`local-sun-basic.js` finite-source diagnostic values used only to prove that
atmosphere exit is followed by vacuum without changing the source, and it
requires the actual pinned `CanonicalAtmosphere` and `LocalPointSun`
primitives to participate in those checks.

Binary64 retains the selected `1e-9 m` absolute-or-`1e-12` relative geometry
gate. The binary32 CPU model preserves subnormals, rounds every declared
scalar operation to IEEE-754 binary32, and uses an algebraically identical
map-radius-scaled implicit sphere. Its factored radial and vertical terms
avoid subtracting meter-scale altitude from the roughly two-billion-meter
sphere center. Near the rim, it evaluates the two radial factors as
`(r - R) / R` and `(r + R) / R` before multiplication, so rounding `r / R`
cannot discard the last represented meters of physical clearance. This is an
algebraic reassociation of the frozen `(q - 1) * (q + 1)` term, not a boundary
change. The quadratic retains `a = dot(D, D)` because step-rounded binary32
normalization does not guarantee an exactly unit represented direction.
Exact classifications, flags, and zero contacts must match;
non-contact distance and cap-altitude results must remain within 32 positive-
binary32 ULPs of an independent analytic calculation evaluated from the same
once-quantized inputs. GPU flush-to-zero and shader execution remain later
work.

## Authority Split

`poly-gc-react` supplies the fixed map and atmosphere-profile inputs. At
observed HEAD `514d5f6080d2dd485efdb07b5da9a203357a40c0`:

- `src/flat/shared/consts.js` owns `6371.0088 km`, profile
  `earth-clear-day`, and its inherited `100 km` top;
- `src/flat/features/flat-simulation/models/consts.js` selects
  `north-pole-azimuthal-equidistant` and defines the whole-map radius as
  `pi` times that mean radius;
- `src/flat/shared/projection/earth/NorthPoleAzimuthalEquidistantEarthProjection.js`
  owns the projection equation and North-Pole center;
- its focused spec proves North Pole at the origin, equator at half radius,
  and South Pole at the outer radius;
- `CanonicalAtmosphere.js` and `Algorithm32CanonicalData.js` identify the
  Algorithm32 optical medium; and
- the reconciliation and production flat geometries establish the recovered
  behavior in which ground blocks while atmosphere exits truncate optical
  integration without moving the finite source.

The retained profile records SHA-256 values for every source above. Star
does not read or import `C:\dev\poly-gc-react` at runtime.

The source repository does **not** supply an accepted map-centered physical
dome implementation. Its implemented dome is observer-centered, and archived
`ext-025` leaves the full-world southern-edge implementation and verification
pending. This decision therefore combines recovered `C`, `R`, footprint,
profile, and `H` with the explicitly selected map-centered cap and rim
classification owned by the
[cache design](../cache/cache-design.md#proposed-flatlocal-dome-aware-nonlinear-position-index).
That distinction is part of the claim boundary.

## Rejected Substitutes

These existing values are not Stage 1 boundary inputs:

| Value or policy | Why it is excluded |
| --- | --- |
| `4,800,000 m` local-cache radial maximum | Cache approximation domain, not whole-world radius |
| `1,926,774 m` legacy sky-ray limit | Renderer/no-hit fallback, not atmosphere physics |
| `875,656.645... m` M2 observer extent | Observer-skydome diagnostic extent |
| `60,000 m` canonical spherical shell thickness | Not the selected flat profile top |
| `6,360,000 m` flat32 placement radius | Local placement scale, not the app's whole-map projection radius |
| Observer-centered dome | Camera/observer-relative diagnostic, not a reusable world boundary |
| Camera far plane or endpoint-ground size | Raster/presentation policy |

## Stage 1 Verification

Focused run
[`000180`](../../../../scripts/algorithm32-star/runs/000180-flat-local-dome-cache-index-stage1-tests/report.md)
passes all 52 tests with stable sources and a valid terminal manifest.
Deciding run
[`000181`](../../../../scripts/algorithm32-star/runs/000181-flat-local-dome-cache-index-stage1-boundary/report.md)
passes all 8 frozen gates. Its maximum binary64 distance error is
`7.450580596923828e-9 m`, maximum binary32 distance error is `2 ULP`, and
maximum binary32 cap-altitude error is `1 ULP`; its lane-local cache, GPU, and
render counters are all zero. Their terminal manifest SHA-256 identities are
`b2758414c55fd086cc03b886fcadfdb9863c10f906d44d9db618c591a6538dd5`
and
`6ed1543644730b449cccdbddb7ad8439c9554565bf24b274fb6fce998de35a97`.

This accepts the analytic boundary only within the frozen Stage 1 engineering
claim. It selects no cache topology, GPU realization, rendering result, or
production change. Rejected focused runs `000178` and `000179` remain the
immutable pre-acceptance attribution history owned by the experiment plan.

# Local-Sun Cache Normalization Qualification

This bounded P1 slice ports the retained geometric-density interpolation rule.
The owner clarified and approved its scope on 2026-10-12: implementation stays
in cache reconstruction and geometry-owned cache transforms. Existing atmosphere,
source, scattering equations and celestial models are reused unchanged. The
[port status](local-sun-cache-promotion-status.md) owns completion and review.

## Cache Rule And Owners

For Native15 channel c, `f_c(p)=kappa_c(z)*(h/r(p))^2`, where existing atmosphere
sampling supplies extinction in m^-1 and geometry supplies source distance in
metres. `LocalSunCompactReconstruction` owns node log factors and lookup. It
obtains canonical physical nodes through
`FlatEarthGeometry.resolveCompactLocalSunCacheNodePosition`, which delegates to
the flat scattering-cache geometry owner and checks structural topology pairing,
units, allocated addresses and complete node support. Existing per-tap compact
spatial/angular support retains the ordinary query frame and axis meridian rule.

Physical lookup is `J_c(q)=sum_i w_i*f_c(q)/f_c(p_i)*J_c(p_i)`, including each
tap's own W27 angular weights. This interpolates the smoother `J/f` and restores
physical J at the query. The implementation evaluates the ratio in the log domain
relative to 1 m^-1; that reference unit cancels. Ratios remain positive finite
and are never renormalized as spatial/angular weights. There is no direct-beam
attenuation term, fitted brightness correction or stored-field rewrite.

The existing Native15 basis and atmosphere packet owner validate channel order,
quantity and units. The policy requires positive extinction; vacuum and changed
bases are unsupported by this selected policy. Read-only physical-field scalar
samples produce a Native15 scattering-density packet in W m^-3 sr^-1 nm^-1,
retaining the parent field provenance. Finite zero and signed samples retain their
meaning; nonfinite support/ratios/field samples reject. Returned node logs are
copies rather than mutable cache storage. The node log allocation for the selected
topology is 125,880 bytes, separate from any field or GPU allocation.

This owner is available for later compact-cache integration. The ordinary
`LocalSunCpuCache` and profile/default selections remain unchanged. No ragged
topology is passed silently into the existing rectangular field pipeline.

## Independent Controls

The [checked authority](../../../../src/algorithm32/implementation/local-sun/cache/fixtures/local-sun-normalization-controls.json)
contains all 15,735 node/channel factors and seven admitted P0 query sentinels.
Its SHA-256 is
`cb1097c038b416023a3f8ca67eee2d7d95c307b3784b70e0cb48ec1f0b81b3df`.
The offline producer imports only shared literal Native15/atmosphere data,
authenticates their complete source hashes and reads the independent P0 fixture.
It computes `f=kappa*h^2/(rho^2+(h-z)^2)` directly, independently of production
log factors, medium sampling and geometry distance operations.

Authenticated `00217-p3-layout-v2/source-shell-reconstruction.js` establishes the
retained rule without executing historical source. Original snapshot input and
manifest ancestry and P0 derivation accompany the fixture. Existing independent
directional controls supply W27 angular gold for combined reconstruction. The
numerical controls and limits were formatted and frozen before candidate scoring.
Portable proof needs only checked fixtures; authoring alone needs historical runs.

Synthetic stored J is `f_node*(1+0.25*r_node/h+z_node/H)*(channel+1)` in declared
physical J units. Independent P0 Euclidean-radius/altitude moments give analytic
restored query values. A seam-consistent bounded function of physical W27
direction adds mixed axis/ordinary angular controls. These prove reconstruction
algebra, not physical scattering-field accuracy. No production numerical routine
supplies expected factors, ratios or J.

## Gates And Selected Comparison

Predeclared log-factor absolute tolerance is 1e-12. Ratios use absolute 1e-14
plus relative 1e-12. Synthetic physical J uses absolute 1e-12 W m^-3 sr^-1 nm^-1
plus relative 1e-12; exact spatial nodes retain the P0 relative 1e-10 allowance
for tiny adjacent taps. These are algebraic binary64 gates, not physical accuracy
bounds. Spatial/angular support and packet interpretations retain exact identities.

Immutable
[00012-normalization](../../../../tmp/production-local-sun-cache-promotion/runs/00012-normalization/comparison.json)
passes all 15,735 node factors and exact-node channels, 135 query/node spectral
ratios and 1,365 direction-dependent synthetic J comparisons. Maximum log error
is 3.552713678800501e-15, ratio error 1.4432899320127035e-15 and synthetic J error
2.168404344971009e-19 W m^-3 sr^-1 nm^-1. Input physical-value hashes remain
unchanged; zero/signed sample and defensive-copy checks pass. Unallocated factor
address, outside-cylinder query and nonfinite field sample reject.

```text
node scripts/algorithm32/local-sun-cache/normalization/LocalSunNormalizationProof.js
npx --no-install tsc -p scripts/algorithm32/local-sun-cache/normalization/jsconfig.json
```

Proof/engine type checks and fifteen existing CPU-cache/W27 Jasmine regressions
pass. The existing directional-support proof also passes after factoring out the
shared topology-pairing guard. Selected normalization proof runs from another
working directory and takes about 1.5 seconds including startup; existing small
CPU-field regressions take 48.48 seconds. Those controls do not qualify compact
physical-field construction, GPU or new transport.

`--out <new-plan-run-directory>` rejects existing runs before scoring and writes
only new plan-owned immutable evidence. Paths derive from repository identity
and reject traversal or linked ancestors. Partial failures remain inspectable
without a passed manifest. Copied authority, inputs, equations, configurations,
tool versions and all current implementation identities accompany results.
Explicit control authoring `--derive` rejects an existing fixture.

Remaining P1 work includes selected column transport, independently compared
field/ray outputs, pure/cumulative recurrence and complete profile integration.
GPU, complete horizontal reuse/frames, celestial consumers and changed physical
profiles retain their later gates. This qualification changes cache lookup and
cache-coordinate transforms only.

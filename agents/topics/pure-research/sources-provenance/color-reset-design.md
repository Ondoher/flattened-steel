# Production Color Reset Design

Focus: Sources, datasets, licenses, and canonical claim registers.

Related owners: [color-celestial](../../production-algorithm32/color-celestial/color-reset-design.md), [qualification](../../production-algorithm32/qualification/color-reset-design.md).

## Authority Classification And Reasonable Inference

The design distinguishes facts that can be derived or recomputed from facts
that require an external source. Reasonable inference may support design and
implementation planning, but it does not override the repository's citation,
official-experiment, or independent-conformance requirements. The
[project-wide research-status index](../../../../references/followup.md#color-reset-research-register)
owns the researched/unresearched fact classification and every unresolved
source and registration action.

### Analytic or definitional relationships

The following relationships may be established from geometry, radiometric
definitions, or energy conservation rather than selected from an empirical
paper:

```text
directHorizontal(lambda) = directNormal(lambda) *
                           max(0, up dot sourceDirection)

diffuseHorizontal(lambda) = integralUpperHemisphere
                            L(lambda,omega) *
                            max(0, up dot omega) dOmega

totalHorizontal(lambda) = directHorizontal(lambda) +
                          diffuseHorizontal(lambda)

LambertianOutgoingRadiance(lambda) = rho/pi *
                                      incidentIrradiance(lambda)
```

The external and analytic bases for projected irradiance and Lambertian
`rho/pi` are recorded in the
[project-wide researched-fact inventory](../../../../references/followup.md#color-reset-researched-facts).
The selected `rho=0.18` remains a declared neutral test parameter rather than a
universal physical constant. These relationships still require checked
analytic tests, unit-bearing contracts, and focused production conformance;
their derivability does not make a production implementation its own
authority.

### Deterministic recomputations from authenticated inputs

Once their external inputs are authenticated, the following results are
deterministic and can be independently reproduced without another scientific
model:

- sorting finite BSC V/50 records by `Vmag` and then HR, selecting the first
  2,000, checking endpoints, and proving the first-500 prefix;
- applying the declared Pickles/Johnson materialization equations, counting
  the `1,993/7` retained/proxy partition, checking all 30,000 Native15 values
  for finiteness and nonnegativity, and reproducing declared photometric
  residuals;
- calculating the selected GPU package size as
  `2000 * 4 * 4 + 2000 * 15 * 4 = 152000` bytes;
- deriving a 2,001-entry sparse-palette capacity from 2,000 catalog members
  plus the exact-zero entry; and
- verifying canonical collision ownership and additive inclusion of each
  colliding member exactly once.

This determinism does not establish catalog authenticity, source licensing,
spectral physical adequacy, browser capability, GPU readback correctness, or
performance. Those remain separate source and production gates.

### Engineering behavior established by contracts and tests

The following are software policies rather than claims about nature:

- `gl_PointSize=1.0` and the integer screen-index contract express one-pixel
  stellar occupancy;
- unknown selections fail closed;
- Color, source roster, catalog, and filter selections remain independent;
- compatible state publishes atomically and a failed replacement preserves the
  prior generation;
- empty or disabled filter lists are exact identity; and
- mesopic luminance precedes chroma contraction so the two filters retain
  separate responsibilities.

These facts need typed contracts, deterministic tests, real-browser checks
where rasterization or GPU resources are involved, and lifecycle tests. They
do not need a third-party paper merely to justify the chosen software
architecture. `gl_PointSize=1.0` still requires supported browser and DPR
qualification before making a universal one-device-pixel claim.

### Owner-selected presentation policy

The following values are approved project presentation selections, not values
that can be derived from first principles or retroactively proven by an
external publication:

- the `slope-078/p9` Color response;
- one-pixel stellar calibration `q=24`;
- maximum stellar chroma retention `0.65`;
- maximum rod contribution `0.5`;
- the registered filter ids, stages, targets, and order;
- the decision to keep unresolved stars at one raster pixel; and
- the complete brightest-2,000 roster as the production catalog target.

Their contained brackets, invariant checks, and owner reviews explain the
selection. Production must reproduce and independently qualify them, and their
first-party evidence must be promoted under repository policy, but later
source research must not misrepresent them as externally prescribed physical
constants.

### Unresolved physical and perceptual premises

The qualitative premises, source-dependent facts, and interpretation limits
that still require research are owned by the
[project-wide reference follow-up](../../../../references/followup.md#color-reset-unresearched-facts).
That same register retains the exact source or official-experiment closure
work. These unresolved premises are not design facts and do not authorize
broader physical, physiological, location-independent, or appearance claims
while that work remains open.


## Evidence Authorities

The contained runs below are promotion candidates, not yet official repository
experiments. Their missing external sources and registration work are tracked
only in the [project-wide research register](../../../../references/followup.md#missing-first-party-official-experiment-authority). Until the
applicable rows close, these identities preserve evidence and selected intent
but do not authorize production numerical acceptance.

- Receiver light: `000007-available-light-inventory`.
- Neutral scene lighting: `000011-neutral-geometry-ambient-proof`.
- Slope-limited Color: `000033-cr4g-slope-limited-nautical-response-bracket`.
- One-pixel `q=24`: `000049-cr6c-one-pixel-brightness-calibration-narrowed`.
- Chroma filter: `000052-cr6d-toggleable-low-light-stellar-chroma`.
- Mesopic filter: `000054-cr6e-toggleable-mesopic-stellar-luminance`.
- 2,000 packets: `000055-cr6f-brightest-2000-spectral-materialization`.
- 2,000 GPU package: `000057-cr6g-brightest-2000-runtime-capacity`.
- Integrated 500-star appearance control: `000062-integrated-color-reset-sequence`.
- Final qualification: `000065-color-reset-qualification`, artifact-set
  SHA-256 `1f5fa1226d1520847fa900fea14870144e6c07f1cbecd11dc0ff4246d2b8bfe1`.

The rejected `000058-cr6h-brightest-2000-appearance` run remains required
negative evidence for the claim boundary; it does not invalidate the accepted
roster, spectra, or capacity contracts.

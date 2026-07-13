# Algorithm32 Reference Follow-up

Status: current citation-hardening follow-up. This document records source
leads, claim boundaries, and unresolved reference work. It is not a citation
authority; accepted external references belong in [references.md](references.md)
and official experiment evidence belongs in [experiments.md](experiments.md).

## Trapezoidal Path Finding

The catalog contains a suitable, previously overlooked mathematical authority
for the endpoint-trapezoid integration schedule:

- Talvila E, Wiersma M. *Simple derivation of basic quadrature formulas*.
  arXiv:1202.0249. https://arxiv.org/abs/1202.0249.
- The paper states the uniform composite trapezoidal rule in the form
  `deltaS * (0.5 * f_0 + sum(f_i) + 0.5 * f_N)`. This supports a finite
  interval divided into `N` uniform intervals, `N + 1` sample points,
  half-weight endpoints, unit-weight interior points, and sample measure equal
  to interval length times trapezoid weight.
- The source was retained as `SOURCE-EXT-000133` in
  [r0-second-pass.json](catalog-inputs/r0-second-pass.json), but the catalog
  classified it only as a candidate midpoint-family source and did not verify
  its composite-trapezoid formula. Primary-source review resolves that
  formula-level gap.

The paper-facing statement should describe the selected numerical method. A
statement that the production dependency happens to use the method is an
implementation observation and does not itself belong in the paper-facing
facts register.

## Fact-level Source Assessment

| Working fact | Source finding | Required follow-up or claim boundary |
| --- | --- | --- |
| `FACT-A32-000018` | Talvila and Wiersma directly support the uniform composite trapezoidal schedule and weights. Bruneton's pinned implementation supplies published-software precedent for the same schedule. | Rewrite as a numerical-method statement rather than a production observation. Add Talvila and Wiersma to the canonical AMA bibliography before citing it. |
| `FACT-A32-000021` | PBRT supports optical depth and Beer-Lambert transmittance. Talvila and Wiersma support applying trapezoidal quadrature to the segment extinction integral. | Divide attribution between transport physics and numerical quadrature. The selected interval count still requires convergence evidence. |
| `FACT-A32-000035` | PBRT supports `tau = integral(sigma_t ds)` and `T = exp(-tau)`. Talvila and Wiersma support the discrete trapezoidal sum. | Divide attribution as above. Do not treat an implementation sum or passing unit test as physical authority. |
| `FACT-A32-000026` | Gonzalez supports a nearly equal-area spherical Fibonacci lattice and equal point weights. For a full sphere, `4*pi/N` follows by distributing the sphere's `4*pi` solid-angle measure across `N` equal-weight samples. | Limit the claim to the nearly equal-area Fibonacci quadrature family. Verify correspondence of each Algorithm32 direction sequence with the cited construction. Direction-count adequacy and radiative error require convergence evidence. |
| `FACT-A32-000027` | Bruneton's 2016 clear-sky comparison supports an approximate exponential atmospheric-density profile and the comparison profile's 8 km molecular and 1.2 km aerosol scale heights. | Split out `max(0, h)`. Clamping negative altitude to sea-level density is an Algorithm32 boundary policy, not an externally supported atmospheric fact. |
| `FACT-A32-000034` | Bruneton's pinned implementation explicitly sets transmittance to zero when a segment intersects the ground. | State the physical/model result as zero source visibility or transmittance. Positive-infinite optical depth is only Algorithm32's sentinel encoding and should not be presented as atmospheric physics. |
| `FACT-A32-000210` | PBRT supports ray parameterization, ray-plane intersection reasoning, and selection of the nearest positive boundary. | No located external source supports the combined ground, top-atmosphere, observer-dome, request-cap, and source-cap precedence. Keep that precedence as an Algorithm32 Methods/design decision. Any claim of physical adequacy requires a bounded experiment. |

## External Sources Located

### Composite trapezoidal rule

Talvila and Wiersma provide the direct numerical-analysis authority for the
schedule underlying `FACT-A32-000018`, `FACT-A32-000021`, and
`FACT-A32-000035`:

- https://arxiv.org/abs/1202.0249
- Catalog lead: [r0-second-pass.json](catalog-inputs/r0-second-pass.json)

The formula's stated error result assumes the paper's regularity conditions.
It does not select an Algorithm32 interval count or demonstrate convergence of
an atmospheric calculation.

### Spherical Fibonacci quadrature

Gonzalez A. *Measurement of Areas on a Sphere Using Fibonacci and
Latitude-Longitude Lattices*. Mathematical Geosciences. 2009.
doi:10.1007/s11004-009-9257-x. https://arxiv.org/abs/0912.4540.

The reviewed construction and equal-weight locators are recorded for
`SOURCE-EXT-000016` in
[step-032-completion.json](catalog-inputs/step-032-completion.json). The paper
supports the nearly equal-area Fibonacci family; it does not select the
Algorithm32 sample count or establish atmospheric-radiance accuracy.

### Exponential atmosphere profiles

Bruneton E. *A Qualitative and Quantitative Evaluation of 8 Clear Sky
Models*. IEEE Transactions on Visualization and Computer Graphics. 2017.
doi:10.1109/TVCG.2016.2622272. https://arxiv.org/abs/1612.04336.

This source supports approximate exponential molecular density with altitude
and records the selected comparison profile's scale heights. It does not
support extending the profile below the ground by clamping altitude.

### Pinned Bruneton software

AMA reference 12 already identifies Bruneton's pinned precomputed-atmosphere
software. The retained
[functions.glsl](downloads/bruneton-precomputed-atmosphere-34f14e7/functions.glsl)
provides published-software precedent for:

- a uniform endpoint-trapezoid optical-length integral with `500` intervals;
- `N + 1` evaluations with endpoint weight `0.5` and interior weight `1`;
- summing constituent optical lengths and applying exponential
  transmittance; and
- returning zero transmittance for a ground-intersecting segment.

This is strong implementation precedent and Algorithm32 lineage. It does not
replace a numerical-analysis citation, prove that `500` is converged, or make
the Bruneton implementation an independent validation of Algorithm32.

The retained Bruneton comparison implementations also carry older endpoint
averaging precedent in `nishita93.cc` and `nishita96.cc`. The corresponding
Nishita 1993 and 1996 publications are plausible scholarly leads, but their
papers have not been verified as stating the exact discretization used by the
comparison code.

## `poly-gc-react` Lineage

The `poly-gc-react` `atmosflat-019` evidence records attributed exponential
density optical length, trapezoidal integration, and Beer-Lambert
transmittance to Bruneton. It also recorded Gonzalez as the source for the
full-sphere Fibonacci direction family.

Those records used mutable `master` GitHub links and some stale line locators.
Use the pinned Bruneton payload retained in this repository for exact software
citations. The POC and later production implementations share the same
lineage, so they are not independent corroboration of one another.

The older Nishita implementations and the Bruneton/Gonzalez source records
are useful provenance. Project documentation, production code, and historical
tests remain lineage rather than paper authority.

## Interval-count Evidence Boundary

Retained run
`000142-n-order-bruneton-j1-transmittance-interval-diagnostic` found material
differences between 20 and 500 source-transmittance intervals on one frozen
Algorithm32 corpus. Its mapped-500 representation reconstructed its exact-500
comparison within the run's existing gates.

This run is not registered in [experiments.md](experiments.md), so it is not
an official citable experiment. It demonstrates interval sensitivity only. It
does not prove that 500 intervals are converged, physically accurate, or
universally required. Promotion would require a standalone experiment with an
independent convergence oracle and an explicit claim boundary.

## Canonical Follow-up

1. Add Talvila and Wiersma to [references.md](references.md), with the exact
   composite-trapezoid equation or page locator.
2. Add Gonzalez to the canonical bibliography, retaining the reviewed
   construction and equal-weight locators from `SOURCE-EXT-000016`.
3. Add Bruneton's clear-sky comparison paper to the canonical bibliography
   for exponential-density and comparison-profile claims.
4. Reshape the affected working-fact rows so each row owns one paper-worthy
   proposition and separates physical authority, quadrature, and local policy.
5. Check the production distant and local direction generators against the
   cited Gonzalez construction.
6. Define an official convergence experiment for path and source-path
   interval counts if production or paper claims depend on particular counts.
7. Treat flat-domain caps and their precedence as declared Methods/design
   choices unless a future experiment makes and bounds a physical-adequacy
   claim.


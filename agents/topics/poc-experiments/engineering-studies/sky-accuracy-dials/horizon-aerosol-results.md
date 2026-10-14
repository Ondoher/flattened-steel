# H7: Aerosol Handling And Horizon Response

The measured aerosol phase warms the sampled horizon in both geometries while
leaving the sampled upper sky blue. Phase shape supplies most of the change;
higher single-scattering albedo (SSA) adds a smaller effect. This supports aerosol
angular distribution as a cause of the current gray balance. It does not establish
the correct San Jose aerosol, a numerical cache bug, or a production fix.

## Comparison

The [H7 plan](horizon-diagnosis-plan.md#h7-measured-aerosol-handling-and-horizon-response)
registers the package. The continuous reference recomputes N1 at 0.25/3/20-degree
elevations and Sun-relative headings 0/90/180 degrees, in actual finite-Sun flat
and actual distant-source spherical configurations. Four material cases give
72 rows: baseline Cornette-Shanks g=0.7/SSA=0.8; measured phase only; measured SSA
only; both. Every case retains the same extinction coefficients, density profiles,
geometry, source irradiance and path boundary as its authenticated H5 baseline.
Changing SSA changes scattering versus absorption at fixed total extinction.

The material is the [earlier aerosol experiment's](aerosol-sensitivity-results.md)
Toronto AERONET Level 1.5 retrieval, 2013-05-27 13:19:01 UTC, instrument 614.
It is a regional physical alternative rather than San Jose atmospheric calibration.
The same 83-node, normalized piecewise-linear cosine phase representation is used
in both geometries. Phase and SSA interpolate linearly between measured bands.
The three Native15 centers below 440 nm retain the original phase and SSA exactly;
there is no unsupported shortwave extension. Their contribution remains in RGB,
so this is explicitly a partial-band material intervention.

The read-only parents are accepted 00235's optical tables, 00246's physical ray
inputs and 00239's baseline display illuminance. No cache was built. Spherical
results here are N1; the current distant application still uses N4.

## Horizon And Upper-Sky Response

These are **signed linear sRGB red/blue ratios**, using the installed midpoint
matching-function convention and four-decimal XYZ matrix. Heading 180 degrees
is away from the Sun, matching the default camera witness. R/B is a compact
diagnostic, not a complete hue or saturation metric.

| Geometry / elevation | Baseline | Phase only | SSA only | Both |
| --- | ---: | ---: | ---: | ---: |
| Flat / 0.25 degrees | 0.8139 | 1.0936 | 0.8605 | 1.1787 |
| Flat / 3 degrees | 0.9742 | 1.1231 | 0.9975 | 1.1685 |
| Flat / 20 degrees | 0.4310 | 0.4901 | 0.4409 | 0.5093 |
| Sphere / 0.25 degrees | 0.8483 | 1.1382 | 0.8960 | 1.2250 |
| Sphere / 3 degrees | 0.8943 | 1.0506 | 0.9189 | 1.0981 |
| Sphere / 20 degrees | 0.4342 | 0.4961 | 0.4451 | 0.5167 |

The registered Flat 3-degree prediction passes. Joint material changes increase
its linear red by **26.8%**, green by **21.3%**, blue by **5.7%**, and luminance
by **21.3%**. Its installed display values change from approximately
`(0.577, 0.582, 0.587)` to `(0.664, 0.652, 0.607)`: neutral becomes warm tan.
This is a moderate warm shift, not evidence that a strongly orange horizon has
been reproduced. At equal baseline luminance the combined display color remains
warm, approximately `(0.593, 0.582, 0.537)`, separating hue change from brightness.

The response is shared by these two N1 physical witnesses. The spherical 3-degree
joint case increases luminance by **23.9%** and crosses from blue-dominant to
red-dominant raw R/B. All eighteen physical rays become warmer in raw R/B under
the joint intervention; all six 20-degree rays remain blue-dominant. At 3 degrees,
joint R/B ranges from **1.1685 to 1.3126** for flat and **1.0981 to 1.2203** for
spherical across the three headings. The effect is angular, not a uniform color
offset. The complete spectra, chromaticities and species contributions remain in
the numerical artifact.

Independent bin-integrated CIE checks give Flat 3-degree R/B **0.9892 to 1.1867**
and spherical **0.9079 to 1.1150**, with the same qualitative conclusion. These
assume constant radiance inside each wide Native15 bin; fine spectral resolution
remains unqualified. Earlier H3-H6 tables use this bin-integrated convention,
which explains their slightly different baseline ratios.

## Color Comparisons

- [Physical brightness at fixed baseline display illuminance](../../../../../tmp/experiments/sky-accuracy-dials/runs/00249-h7-aerosol/comparison.svg).
- [Equal-luminance hue diagnostic](../../../../../tmp/experiments/sky-accuracy-dials/runs/00249-h7-aerosol/equal-luminance.svg).
- [Complete numerical evidence](../../../../../tmp/experiments/sky-accuracy-dials/runs/00249-h7-aerosol/aerosol.json).

The charts show sampled away-Sun rays, not full scenes or app screenshots. Display
uses the installed p2 response with each geometry's original receiver illuminance:
84,840.611 lux flat and 117,791.532 lux distant. That gain is held fixed to isolate
the radiance response; this package does not recompute changed diffuse receiver
illuminance. The equal-luminance chart additionally scales each variant to the
same ray's baseline Y and is explicitly a hue diagnostic. The display compresses
the Flat 3-degree R/B separation from raw **0.9742 to 1.1685** to encoded
**0.9838 to 1.0943**, but it does not erase or create the warming.

## Verification And Evidence

Accepted [00248](../../../../../tmp/experiments/sky-accuracy-dials/runs/00248-h7-aerosol/sealed.json)
holds the initial comparison. Accepted
[00249](../../../../../tmp/experiments/sky-accuracy-dials/runs/00249-h7-aerosol/sealed.json)
repeats it with explicit identities for the read-only static display/profile
import closure and original CIE CSV, plus forward-cosine controls. All 72 result
rows, including display colors and numerical checks, are exactly equal to 00248.
The first record remains immutable. This is a provenance-completion repeat,
not an independent physical corroboration or a response-driven parameter change.

The second seal SHA-256 is
`147d7c90769cda6621221a6528686d971d36b71a7190d175e20feca024a2c7ea`.

Both immutable verifiers pass. Material replay against the earlier supported
target bands differs by at most **5.46e-16** relative; interpolated phase masses
equal one within **2.22e-16**, with positive densities and cosine +1 verified as
the forward peak. View/column refinement from 2048/64 to 4096/128 differs by at
most **1.204e-6** relative, below the frozen 1e-4 criterion. Baseline replay is
bit-exact; Rayleigh emission and the three unsupported channels remain bit-exact
under every intervention.

The predicted spectral interaction is
`L_both - L_phase - L_SSA + L_baseline = (SSA(lambda)/0.8 - 1) * (L_phase - L_baseline)`.
It holds with maximum absolute residual **4.35e-16 W m^-2 sr^-1 nm^-1**. The joint
effect is not the sum of the two isolated effects. Fixed extinction makes this
N1 identity exact apart from numerical roundoff.

Recorded windows from runner setup through artifact retention are **23.715 s**
and **26.167 s**, totalling **49.882 s** within the 180-second package. They exclude
module loading, final sealing/verifier work, reviews and orchestration. New
retained evidence totals **905,657 bytes**, below 4 MiB; total retained evidence
is **405,753,609 bytes**, below 512 MiB. Scratch is absent and free disk remains
about 140 GB. No GPU/browser work, cache rebuild, dependency installation or
experimental unit-test tree was needed.

The complete experiment type check passes. The
[H7 implementation receipt](../../../../../.codex-tmp/review-standards/session-UQDsIf/summary.md)
owns the batched mapped primary/audit completion gate. The baseline was captured
before authored code changes. Scientific acceptance alone does not close that gate.

## Meaning And Remaining Boundary

Richer, wavelength-dependent aerosol handling produces the expected direction
of horizon change without the artificial zero-g endpoint. The evidence supports
continuing with aerosol phase as the principal physical sensitivity and treating
SSA as a coupled secondary control. It does not yet justify adopting this
retrieval as a default: actual atmospheric measurement, the unsupported shortwave
range, higher scattering orders and the application's receiver/display response
remain separate questions. The earlier selected-visible Kider improvement is
background evidence, not a new score from this package. Production is unchanged;
no further compute package is automatically selected.

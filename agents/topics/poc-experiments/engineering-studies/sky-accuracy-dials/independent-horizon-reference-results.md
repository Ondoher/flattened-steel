# Independent Horizon Reference: H21–H26 Results

The selected [plan](independent-horizon-reference-plan.md) has been executed at
its bounded scientific scope. A cache-free reference confirms that distant light
is strongly reddened on its final trip, **but that does not make the combined
local horizon orange under these inputs**. The local app closely follows its N1
physical model. The distant app has an additional, substantial N4 excess relative
to this independent calculation, strongest toward blue wavelengths.

Accepted reference 00267, qualification 00268 and assessment 00269 are immutable.
Setup failure 00266 is preserved. No production file or prior evidence changed.
These results qualify the stated model and numerical comparisons; they do not
provide a matched libRadtran horizon score or prove a unique production cause.

## What The Distance Test Found

“Distance” below is the observer-to-final-atmospheric-scattering distance.
The reference estimates radiance before and after that final segment directly;
it never divides attenuated Monte Carlo values by tiny transmittance.

| Away-Sun ray | Luminance from final scattering beyond 100 km | N5-and-later fraction of total luminance | All-order CIE x, y |
| --- | ---: | ---: | --- |
| Local, 0.05° | 0.186% | 0.838% | 0.28116, 0.29422 |
| Local, 3° | 13.847% | 0.660% | 0.28742, 0.30299 |
| Local, 20° | 0.927% | 0.523% | 0.24487, 0.25016 |
| Distant, 0.05° | 0.697% | 0.763% | 0.28233, 0.29383 |
| Distant, 3° | 10.916% | 0.638% | 0.28264, 0.29917 |
| Distant, 20° | 0.762% | 0.470% | 0.24509, 0.25039 |

For the local 0.05° ray, the beyond-100-km component moves from CIE
**(0.23670, 0.23701)** before the final trip to **(0.51003, 0.43146)** afterward:
a large, resolved shift toward red/orange. Its remaining luminance is only
**6.26 cd/m²**, compared with **3366.77 cd/m²** for the complete ray. The
reddening mechanism is present; very little of that far light survives.

At local 3°, the far component is less extinguished and contributes
**649.11 / 4687.68 cd/m²**. Its chromaticity is **(0.39691, 0.41724)**, whereas
the complete ray is **(0.28742, 0.30299)**. Nearer contributions and additional
scattering prevent the far component from setting the whole sky's hue.

The local 3° N1 result is nearly neutral: **(0.31186, 0.33070)**. Including
later orders moves it toward blue, to **(0.28742, 0.30299)**. The corresponding
distant change is **(0.30622, 0.32633)** to **(0.28264, 0.29917)**. Most of this
change occurs by N4; the remaining order tail is small at these witnesses.
Thus simply adding omitted scattering does not supply the anticipated orange.

These are CIE projections of the declared spectrum, not an inference from three
red/green/blue samples. Marginal sampling half-widths for all-order x/y are at
most approximately **0.00071 / 0.00119** across the six rays. Physical-model and
spectral-input uncertainty are separate from those intervals.

## App And Component Comparisons

The three retained center rays are joined at 0.05°, 3° and 20°. Local N1 uses
the normalized retained physical direction and an independently calculated
observer-dome endpoint. Its app/reference spectral residual ranges are:

| Elevation | Local app N1 minus matched continuous N1 | Distant app N4 minus independent N4 |
| --- | ---: | ---: |
| 0.05° | −0.011% to +0.667% | +6.89% to +41.56% |
| 3° | +0.114% to +0.833% | +7.60% to +34.78% |
| 20° | +0.318% to +1.553% | +8.50% to +16.51% |

Distant values include sampling uncertainty and the retained/generated direction
rounding distinction. Independent N1 sensitivity to that rounding is below
0.000019% for these spherical rays; N4 angular sensitivity was not separately
certified. This is a diagnostic comparison, not bit-exact N4 parity. The 3°
distant app chromaticity is **(0.27827, 0.29249)** versus independent N4
**(0.28404, 0.30140)**: the app adds a visible blue bias. The independent model
itself still predicts a blue-tinted sky rather than a uniformly white horizon.

The reference also evaluates pure P2 at the exact H19 receiver points and
directions. It independently reproduces the main distant angular problem:
F68 Mie source estimates are **33.1–45.8% below** the new reference across the
six receiver/channel cells. Rayleigh means are **4.9–17.6% above** it; the
Rayleigh red-channel intervals are much wider, so not every sign is resolved.
The earlier boundary-split Mie result is within approximately **1.1%** of the
new independent mean at all six distant cells, comparable with its sampling
uncertainty. This supports the earlier component diagnosis without using its
incoming-field evaluator as the oracle.

Local P2 species estimates are consistent with the earlier continuous results
at their wider sampling resolution. The new local incoming paths use the
infinite slab, while the earlier comparison retained a finite domain. Those
scopes remain identified; this is not a claimed sub-percent local P2 proof.
Neither P2 comparison uniquely explains the final N4 excess. Correct recurrence
regeneration and component interventions remain necessary for that attribution.

## Is Source Proximity Responsible?

H25 compares the original point source, twice its observer distance along the
same direction, and a parallel-source limit. Unattenuated observer irradiance
and spectral shape are held fixed; the doubled-distance emitter has four times
the original intensity. Each configuration retains its physical source-path
attenuation and local direction changes.

At 3° and 20°, the three registered bands change by about **−1.19% to +0.26%**
in the parallel limit, and **−0.76% to +0.18%** at twice the distance. Some of
those differences remain within sampling uncertainty. No large proximity-driven
red shift appears. This sparse intervention cannot establish a complete color
difference, but challenges source proximity as the dominant explanation here.

## Independence And Qualification

The new source is contained in
[horizon-reference](../../../../../experiments/sky-accuracy-dials/horizon-reference/).
It imports no production transport evaluator, phase/density helper, view/source
integrator, coordinate transform, cache field or shell adapter. It shares
authenticated physical data, original CIE tables, provenance I/O, the previous
reference's mathematical Gauss generator and its PCG/rejection-sampling method.
Independence concerns the transport implementation; it is not a claim of
independent physical inputs, random-number theory or color standards.

The first scattering position uses a logarithmic distance proposal with its
exact Jacobian. Continuations sample scattering directions and free flights.
Flat free flights invert the analytic exponential-mixture optical depth;
spherical paths use a valid ray-minimum-altitude extinction majorant. Cornette–
Shanks is sampled by rejection from HG; Rayleigh uses uniform-cosine rejection.
Roulette compensates surviving weights and imposes no scattering-order cutoff.
A sampler/path safety-cap hit fails the estimate rather than dropping paths.
Opaque black ground terminates paths; ground-reflection interactions are zero.

The physical hypothesis uses the original San Jose instant
**2024-06-20T20:08:46.261Z**, observer height 5 m, finite point illumination in
an infinite 100 km flat slab, and the original parallel source in a 60 km
spherical shell. Aerosols retain alpha 0.8, beta 0.04, g 0.7, SSA 0.8 and
1.2 km scale height; Rayleigh retains the authenticated canonical 8 km profile
and molecular coefficients; ozone is off. This is the app-matched molecular/
solar packet, not a claim that every detail equals the paper's Penndorf/ground
benchmark. The separate benchmark boundary remains governed by the
[metric owner](reference-model-target.md#current-accuracy-metric).

Qualification retained:

- 34 binary64 analytic/Simpson checks: vacuum/zero source, Beer constant-source
  integral, exponential columns and attenuation reversal, phase normalization,
  slab/shell ground/tangent exits and inverse-square normalization. Maximum
  column discrepancy was **6.02 × 10⁻¹⁴**.
- Separate HG-to-Cornette–Shanks rejection-density identities and compensated
  roulette identities; GPU vacuum and homogeneous-medium controls. The GPU
  homogeneous N1 estimate differs from its analytic integral by **+0.221%**.
- Binary64 N1 checks on every non-P2 original/proximity query, plus 64→128
  quadrature refinement. The largest Monte Carlo/CPU difference is **4.07
  estimated standard errors** among 120 cells; this is not universal marginal
  95% coverage or proof that all systematic error is absent.
- Paired 64/128 source/view quadrature controls; the flat values agree exactly
  because their columns are analytic. Spherical differences are negligible
  relative to the stated 1% aim. Independent seed controls agree within their
  sampling resolution; order-8/order-16 roulette differences are negligible
  at the selected controls.
- Direct additive checks for distance, species, pure orders and residual tail.
  Histories record earlier excursions beyond 100 km and radiance-weighted
  observer-side walk distance/optical depth. They **exclude the direct-solar
  leg**, so are not total source-to-observer path statistics.
- Native30/60 transport-coefficient refinement on both 3° away rays. The local
  all-order x changes **0.28708→0.28731**, y **0.30286→0.30291**; distant x
  **0.28219→0.28243**, y **0.29818→0.29844**. These changes are within the
  retained sampling intervals and do not produce an orange horizon.

Full-color estimates retain all 15 original visible bins. Fine spectral controls
preserve each bin's irradiance energy and use constant source density within
that bin while refining the analytic molecular/aerosol coefficients. They do
not recover unknown within-bin solar structure or certify a continuous paper
spectrum. No three-band proximity probe is presented as a full-color solution.
The original CIE 1 nm table is integrated exactly under its piecewise-linear
interpretation. Swatches use one fixed D65 matrix and exposure; no case is fitted.

## H26 Coverage And Remaining Limits

| Question | Independent oracle and coverage | Remaining uncertainty |
| --- | --- | --- |
| Local horizon color | Direct N1 plus unlimited-order path sampling, finite source, flat slab; full Native15 on three away rays | Physical/material and within-bin spectral assumptions; app remains N1 |
| Distant horizon color | Independent spherical N1–N4 and unlimited-order sampling | No matched external libRadtran horizon output; no corrected cache regeneration |
| Endpoint/domain | Independent slab/shell roots, matched local dome N1 join | Local all-order hypothesis deliberately removes observer dome |
| Source/view extinction | Analytic slab columns, refined spherical quadrature, CPU64 and manufactured checks | Highp GPU arithmetic and marginal sampling limits |
| Order tail | Pure N1/N2/N3/N4 and compensated unbounded continuation | N5+ estimates have their own variance; no universal order bound |
| Angular/species compensation | Independent pure P2 at H19 receivers | Does not uniquely attribute propagated N4 color |
| Spectral/display projection | Original CIE data, fixed projection/exposure; Native30/60 subset | Shared color standard and Native15 source reconstruction |

The retained libRadtran cube contains 17 old Toronto conditions and 31 wavelengths,
with minimum elevation approximately **12.115°**. Its source zeniths, geometry/
ground/profile details and spectral boundary do not match these San Jose horizon
queries. Its provenance names libRadtran 2.0.1 and the executable hash, but that
does not qualify a new query. No substituted ray or invented score is used.

The smallest later external comparison is a **new spherical distant-source
San Jose deck at the actual source zenith**, black ground, 5 m observer,
0.05°/3°/20° away rays, matching molecular/solar data, aerosol phase/SSA/profile
and no absorption, with independently checked angular-moment/stream and vertical
profile refinement. It must retain those settings and output provenance before
being called a numerical oracle. Standard distant-source libRadtran is not
asserted to support this finite local emitter. No installation or solver build
was attempted under this plan.

## Evidence, Resources And Decisions

- [Assessment and swatches](../../../../../tmp/experiments/sky-accuracy-dials/runs/00269-h21-h26-report/)
  contain `assessment.json.gz` and `comparison.svg`.
- [Reference](../../../../../tmp/experiments/sky-accuracy-dials/runs/00267-h21-h26-ref/)
  retains physical packets, kernel, pilot, prospective confirmation registration,
  independent batch means, CPU and seed/roulette controls.
- [Qualification](../../../../../tmp/experiments/sky-accuracy-dials/runs/00268-h22-h26-qual/)
  retains fine spectral batches, local P2 and manufactured controls.
- [Setup failure](../../../../../tmp/experiments/sky-accuracy-dials/runs/00266-h21-h26-ref/)
  preserves the Windows path-normalization error before GPU launch.

The pilot used 16 batches × 1024 paths on 12 ray/band cells. It prospectively
selected **16 × 11264 paths** for 126 confirmation queries, with disjoint seed
states. Fine controls use 16 × 4096 paths. **107/126** confirmation cells meet the
1% marginal radiance half-width aim; the worst is **1.57%**. Wider cells remain
explicitly unresolved at that target. No selection was based on favorable hue,
agreement, or significance. GPU adapter: RTX 2060 / ANGLE D3D11; qualification
browser: Chrome 154.0.8037.98.

The four numerical commands took an observed **246.331 seconds** including
setup, failed setup, retention and cleanup. Seals record **238.877 seconds**
before their final cleanup/manifest overhead; that distinction is retained.
There were **two serial GPU jobs**, approximately **3.9 MiB** new retained
evidence including seals, and zero remaining scratch. The largest owned scratch
tree was about **13.8 MiB**. The 20-minute / 16 MiB allowance was not exhausted;
the registered matrix was completed without a full cache or full-sky render.
Implementation and review wall time are separate from those numerical timings.

Questions and decisions made during execution:

1. **How independent should the oracle be?** Reuse mathematical quadrature/RNG
   methods and authenticated data, but implement all transport and geometry
   independently of production; add differently coded analytic/Simpson controls.
2. **What local source?** Match the existing point emitter, not an unregistered
   extended disk. Keep source/geometry coupling explicit for later work.
3. **Which flat boundary?** Test the physical infinite slab separately from the
   app's observer dome; use the dome only in the matched local N1 comparison.
4. **How to estimate before attenuation?** Sample final scattering locations
   directly with a known proposal/Jacobian and retain both contributions. Avoid
   noisy division by tiny transmission.
5. **Which pilot wavelengths?** Use actual Native15 centers near 438/564/658 nm
   rather than silently resampling to exactly 450/550/650 nm. H19 retains its
   separate 438/595/752 nm component channels.
6. **How much computation?** Freeze counts from measured pilot throughput and
   variance. Preserve the 1% aim as a reported per-cell condition, not a claim
   that every estimate met it.
7. **How to refine color without changing the source?** Preserve original bin
   energy and declare the within-bin reconstruction; refine coefficients at
   30/60 wavelengths. Do not import a different solar table as if identical.
8. **What does proximity hold fixed?** Observer irradiance and spectrum, with
   emitted intensity explicitly adjusted. Do not conflate distance with dimming.
9. **How to qualify later scattering?** Retain pure orders, compensated roulette,
   independent seeds and exact-receiver P2 comparisons; do not clamp the tail.
10. **How to handle the setup error?** Normalize the absolute Windows Chrome
    path, retain 00266, repair in a new run within the remaining allowance. The
    resumed run repeated the compact CPU qualification; no accepted scientific
    estimate was reopened.
11. **How to join old app rays?** Independently derive endpoints and quantify
    Float32 direction differences; distinguish matched local N1 from the
    rounding-qualified distant N4 comparison.
12. **What about incomplete history/spectral/reference scope?** State that solar
    legs, unknown sub-bin solar structure and external matched libRadtran output
    remain unqualified. Do not label those missing cells complete.
13. **Should the result be forced toward orange?** No physical, exposure or
    white-balance fitting. Treat the expected hue as the hypothesis being tested.
14. **Which reviews?** One stable experiment implementation milestone under the
    mapped architecture/types lanes and their independent audits; no per-ray
    reviews or production-capability lanes. The receipt below owns completion.

## Verification And Handoff

All four immutable seals passed the experiment verifier and their owned scratch
was removed. The experiment type check passed after the authored implementation.
No experimental unit-test suite or new dependency was introduced. The matching
implementation review baseline is
`.codex-tmp/review-standards/session-5dobur/baseline.json`; the generated
`validation.json` in that session is the authority for source-review completion.
Numerical completion does not waive that implementation gate. The execution
summary in the same session records final review, checkpoint and timing facts.

The useful next diagnosis is to explain the **distant app N4 excess** with
targeted, order/component-matched interventions against this retained oracle.
The local gray N1 result already agrees with the chosen physical model; changing
it requires a separately selected model/algorithm experiment, rather than assuming
that long paths alone require an orange combined horizon. No production fix is
selected by these results.

# Reference Model Accuracy Target

The subsequent [matched comparison](reference-comparison-results.md) adds
authenticated production baselines, full regional scores and the limited
direct-reference cancellation decomposition. It owns those newer conclusions;
the selected direct/reference comparison below remains valid.

## Current Accuracy Metric

On 2026-10-14 the owner selected **spectral-radiance agreement with a verified,
matched libRadtran solution as the primary accuracy metric**, replacing Kider
agreement for judging numerical accuracy. Compete with Bruneton on the paper's
specified atmosphere and benchmark conditions. Kider remains a secondary empirical
comparison; a gain or regression against Kider does not determine numerical merit.
This section owns the current metric; historical scores below retain their
original definitions and are not rescored or reinterpreted as libRadtran errors.

### Fixed Problem And Reference Qualification

For the paper comparison, freeze its physical parameters: aerosol Angstrom
alpha 0.8 and beta 0.04, Cornette-Shanks shape parameter 0.7, SSA 0.8, aerosol
scale height 1.2 km, and the remaining authenticated molecular, solar, ground,
geometry and observation inputs. Do not refit them to Kider or substitute Toronto
material while claiming the same paper benchmark. Alternative physical inputs
remain separately labelled sensitivity studies.

Before treating libRadtran as a numerical reference, authenticate the exact
input packet, code/version and solver settings. Match spectral sampling and
units, medium/profile representation, phase normalization and angle convention,
source and observer geometry, boundaries, absorption and scattering-order scope.
Check convergence of the chosen reference settings and quantify remaining error
or uncertainty. Differences in formulation or configuration must be identified
before attributing a candidate/libRadtran gap solely to numerical approximation.
No software name or published RMSE by itself certifies a reference.

Retained published-code libRadtran spectra are available through the provenance
below. They are comparison data; this metric decision does not establish their
configuration equivalence or convergence for every intended query. Until those
checks pass, label comparisons as agreement with the retained libRadtran outputs,
with numerical-reference qualification still open. Reuse verified evidence where
applicable rather than requiring a fresh full reference run by default.

### Scoring And Interpretation

For the full paper boundary, use the same frozen sample selection, preprocessing
and equal weighting: 17 times, 81 directions, scoring channels 0-30. Retain all
40 transported wavelengths as before. For N matched scoring scalars, the primary
score is `1000 * sqrt(sum((L_candidate - L_libRadtran)^2) / N)`, reported in
spectral mW m^-2 sr^-1 nm^-1 when input densities are W m^-2 sr^-1 nm^-1.
The reference is libRadtran radiance, not its aggregate Kider score. No target
of 11.5 mW or arbitrary acceptable numerical gap is adopted for this new metric.
Declare tolerances prospectively using the intended application error budget
and qualified reference uncertainty.

Report signed spectral residuals and time, elevation, Sun-angle and wavelength
breakdowns alongside aggregate RMSE, preserving near-Sun and horizon witnesses.
Partial probes remain diagnostic and cannot claim the full score. A different
spectral basis, bin interpretation or order target needs an explicit compatible
comparison; Native15/N1 horizon swatches are not the paper's full spectral result.

Keep four comparisons distinct:

- Candidate minus matched libRadtran: primary reference-radiance agreement,
  qualified as numerical accuracy only within the established common problem.
- Candidate minus an independent continuous reference: component, cache and
  integration attribution, with that reference's own scope and uncertainty.
- LibRadtran minus Kider: remaining reference-model/input/observation discrepancy,
  including reference uncertainty; not automatically an aerosol error.
- Candidate minus Kider: secondary empirical benchmark, preserved for paper
  comparability and interpretation of compensation.

Rank numerical accuracy by the qualified primary comparison and explain cost
versus error separately. Conservation, normalization, nonnegativity and limiting
cases remain correctness constraints. A Kider improvement cannot justify adding
known numerical bias, and a Kider regression cannot veto a demonstrated numerical
improvement. Agreement with libRadtran alone does not establish the real atmosphere.

The spherical distant-source paper reference does not certify a finite local-Sun
flat scene. Those cases continue to use independently checked continuous references
with matching geometry/source/order until an equivalent libRadtran configuration
is qualified. Retain that limitation explicitly; do not force a mismatched oracle.

This is a documentation and assessment-policy change. No scorer implementation,
new reference qualification, simulation, production change or compute package is
completed or selected by adopting it. A later bounded package must register its
exact comparison and resource allowance before execution.

## Future Validation Sources

The owner retained **AERONET (Aerosol Robotic Network)** as a future observational
validation source beyond the Kider and Bruneton-paper comparisons. The
[NASA AERONET database](https://aeronet.gsfc.nasa.gov/) provides globally distributed
aerosol optical-depth observations and inversion products. This future work is
not restricted to the earlier regional retrieval or the Kider capture.

Potential uses include constraining aerosol loading and wavelength-dependent
properties, then testing our predictions against suitably matched independent
observations. Keep measured quantities distinct from inversion-derived properties,
and distinguish data used to set atmospheric inputs from data held out to assess
predictions. Match station, time, spectral bands, viewing geometry and uncertainty.
Prefer Version 3 quality-assured Level 2.0 data where available, checking the
requirements and availability of each product separately. The
[existing source catalog](follow-up-context.md#regional-data-sources-for-the-kider-capture)
retains inversion-service links and the limitations of the earlier regional use.

This is a saved future direction. The current fixed-paper-atmosphere/libRadtran
metric remains in force; no new acquisition, experiment, parameter change or
production work is selected by this note.

## Historical Kider Comparability

The owner notes that the current algorithm already scores favorably and
suspects this depends on balancing errors. Existing controlled experiments
demonstrate beneficial cancellation in the tested components: removing known
numerical error can worsen Kider agreement. They do not establish that every
favorable full-benchmark result is wholly explained by cancellation.
Reference-model scores are therefore a target for a numerically justified
implementation, not a reason to accept the current algorithm's known errors.

The preceding empirical goal was to approach the reference-model
scores from Bruneton's Kider comparison. The full matched benchmark was to be
competitive with the
Bruneton/Elek **11.3 mW** and libRadtran **11.5 mW** aggregate spectral-radiance
RMSE results, while avoiding improvements obtained by balancing known
numerical inaccuracies. These values remain empirical comparators, not thresholds
for the newly selected libRadtran-radiance accuracy metric.

The existing [published score oracle](../../../../../scripts/experiments/b1-directional-sky-radiance/published-oracle.js)
owns the paper transcription. The [retained benchmark report](../../../../../references/results/experiments/b1-directional-sky-radiance/result.md)
records local published-code aggregate reproduction: Bruneton/Elek
11.28323859 mW, libRadtran 11.48054694 mW. This is the full **17 times × 81
directions × 31 scoring wavelengths** boundary. Use its preprocessing,
wavelength selection and aggregation. A five-ray score is not comparable
directly with those aggregate numbers.

## Existing-data comparison on the selected rays

Read-only inspection joins the retained published-code spectra to the exact
five diagnostic ray identities and channels 0, 8, 24, 30 used in 00230.
All 20 measured values match the retained benchmark measurement table within
1e-14 W. No new atmospheric model was executed or parameter changed.

At 454 nm, spectral radiance in mW m^-2 sr^-1 nm^-1:

| Ray |   Kider | Direct stochastic reference | Bruneton/Elek | libRadtran |
| --- | ------: | --------------------------: | ------------: | ---------: |
| A   | 185.531 |                     214.270 |       229.724 |    230.041 |
| B   | 400.727 |                     210.979 |       228.855 |    227.489 |
| C   | 139.004 |                     154.903 |       167.967 |    166.944 |
| D   | 144.043 |                     119.603 |       121.341 |    123.408 |
| E   |  99.535 |                      95.801 |       104.793 |    101.446 |

Across the same selected 20 scalars, with equal weighting:

| Model                       | Selected-subset RMSE, mW |
| --------------------------- | -----------------------: |
| Direct stochastic reference |                   63.535 |
| Bruneton/Elek               |                   59.702 |
| libRadtran                  |                   60.131 |

These are deliberately difficult selected rays. The direct score uses Monte
Carlo point estimates; its uncertainty is retained in the
[convergence report](direct-convergence-results.md). This inspection does
not create a new full-dataset score or establish a global ranking.

## Corrected interpretation

The main local Kider residuals survive numerical refinement, but the strong
reference models share much of that disagreement. In particular, their large
B deficit and C excess show that this pair alone does not establish that our
physical formulation is unacceptable relative to the paper's standard.

The direct solver remains worse on this selected subset. Its gap to reference
models is much smaller than its absolute Kider residual. Assess that gap and
the full matched aggregate before assigning failure to the formulation.
Keep numerical convergence, empirical benchmark performance and the causes of
any residual gap as separate questions. This narrows the earlier interpretation
without changing any completed numerical finding or lifting the adoption hold.

For matched samples, keep three quantities distinct: current implementation
minus direct reference (numerical approximation error), direct reference minus
Kider (remaining model/input/observation residual), and current implementation
minus Kider (the scored total). Opposing first and second terms identify
beneficial cancellation. The direct-reference uncertainty must accompany that
decomposition. Compare reference models on the same samples as an empirical
performance control. The older `previous` field in the diagnostic input is a
corrected-first/frozen-higher hybrid, not automatically the current production
algorithm; do not relabel that comparison as current production evidence.

## Reproduction and provenance

Sources, read without modification:

- `references/results/experiments/b1-directional-sky-radiance/published-models.tsv`:
  10,368,278 bytes; SHA-256
  `4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4`.
  Hash matches its retained sidecar and benchmark report. Values are local
  published-code outputs, not per-ray numbers transcribed from the paper.
- The same directory's `measurement-boundary.tsv`: 1,168,155 bytes; SHA-256
  `a751d56dc0d8deb87958cbc9e811204a38f2b86101c732109c3503dfcfedad74`.
- `tmp/experiments/sky-accuracy-dials/runs/00230-direct-converge/results.json.gz`:
  6,573 bytes; SHA-256
  `c05faa6d5682edd885d756c4811fa77bc40abad663e45c1d0bd061fbac0352d0`.
  Its sealed producer and computation identities are in the convergence report.

Inspection used Node v25.4.0 and the existing real-path-checked repository
reader. Split TSV rows by tab, join unique `(model,time,grid_x,grid_y)` keys
and select `lambda_<channel>`. Decode each probe id as `p-HHMM-x-y`.
Compute `1000 * sqrt(sum((prediction - measurement)^2) / 20)` in binary64;
displayed spectral values are multiplied by 1,000 and rounded to three decimals.
No statistical weighting, fitting, rescaling or observation repair is added.
This document is a current interpretation of existing evidence, not a new
sealed model execution. Original artifacts and historical scores remain intact.

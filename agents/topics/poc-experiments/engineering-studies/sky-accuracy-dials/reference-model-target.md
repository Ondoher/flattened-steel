# Reference Model Accuracy Target

The subsequent [matched comparison](reference-comparison-results.md) adds
authenticated production baselines, full regional scores and the limited
direct-reference cancellation decomposition. It owns those newer conclusions;
the selected direct/reference comparison below remains valid.

## Owner criterion

The owner notes that the current algorithm already scores favorably and
suspects this depends on balancing errors. Existing controlled experiments
demonstrate beneficial cancellation in the tested components: removing known
numerical error can worsen Kider agreement. They do not establish that every
favorable full-benchmark result is wholly explained by cancellation.
Reference-model scores are therefore a target for a numerically justified
implementation, not a reason to accept the current algorithm's known errors.

The owner requires empirical correctness to approach the reference-model
scores from Bruneton's Kider comparison. Numerical convergence alone is
insufficient. The full matched benchmark should be competitive with the
Bruneton/Elek **11.3 mW** and libRadtran **11.5 mW** aggregate spectral-radiance
RMSE results, while avoiding improvements obtained by balancing known
numerical inaccuracies. No arbitrary acceptable percentage gap is assumed.

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

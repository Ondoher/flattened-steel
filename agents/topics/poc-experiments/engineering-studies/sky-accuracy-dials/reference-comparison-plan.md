# Matched Reference Comparison Plan

The owner's "let's do that" authorizes a bounded comparison of retained
production, direct-reference and published-model outputs. Reuse existing data;
no new transport integration, GPU job, parameter fit or production edit.
Near-Sun differences remain in aggregate scores but are set aside as a work
priority. Define that diagnostic region prospectively as separation <20 degrees.

## Boundaries

One CPU reporting run, at most 10 minutes, 768 KiB retained output, charged to
the existing C6 reporting allocation. C5's small remaining attribution reserve
is not used. Admission must verify all campaign limits and preserve historical
runs. Review unit: new retained-data comparison and reporting runner under
`experiments/sky-accuracy-dials/continuation/reference-comparison/`.
Baseline HEAD: `c7803b241f0f8f409226354dc4fb72484f25a5ec`; preexisting changes
are preserved. Formal reviewers remain owner-suspended; checkpoint adviser
remains blocked by its previously recorded calibration gate.

## Inputs and identity

- Authenticated 00000-inputs Native48 GPU control and physical scene controls.
- Published production GPU capture identified by score manifest 000004 and
  its exact boundary/provenance hashes. It is a separately labeled capture:
  its output differs from the experiment's Native48 control, and its source
  inventory does not exactly match today's tree. Do not claim a fresh current
  production score or silently substitute the corrected-first/frozen-higher hybrid.
- Retained published-model and measurement tables, authenticated against their
  established hashes. Bruneton and Elek are the same spectral implementation;
  use Bruneton and libRadtran as the two reference outputs, not three witnesses.
- Accepted 00230 direct stochastic results and inputs, including uncertainties.

Validate all 17 x 81 x 40 table keys and finite spectra, all 20 selected
measurement identities, original physical coefficients, and the selected
source-frame geometry. Differences in saved baselines must remain visible.

## Comparisons

1. Full boundary, 31 scoring wavelengths: retain each model's RMSE, signed
   mean, and pairwise residual correlation and sign agreement. Report all sky,
   near Sun, away from Sun, and the away-from-Sun elevation strata <20,
   20-60 and >=60 degrees. Also retain per-time and blue (<500 nm), middle
   (500-600 nm), red (>=600 nm) summaries. Equal spectral/directional weighting
   follows the benchmark; no solid-angle or fitted weighting is added.
2. Compare production residuals with the arithmetic mean of Bruneton and
   libRadtran residuals as a descriptive shared pattern. That mean is not
   physical ground truth. Use 0.01 mW as the sign-comparison floor and report
   the eligible denominator. Report model differences directly as well.
3. Only the five rays/four wavelengths have a direct reference. For each saved
   baseline compute n = baseline - direct, p = direct - measurement,
   r = baseline - measurement. Verify r = n+p and r^2=n^2+p^2+2np.
   Report opposite-sign terms separately from an actual reduction in squared
   error; an overcorrection can reverse the residual and make it worse.
4. Propagate each direct value's reported sampling half-width into sign and
   squared-error comparisons. An interval envelope is not a joint confidence
   interval and excludes physical and systematic numerical uncertainties.
   The baseline/direct difference includes finite-order truncation as well as
   other approximations; do not call all of it an implementation bug.

## Acceptance and limits

The run succeeds when authenticated joins, manufactured algebra checks,
geometry/physical-input compatibility and accounting pass and complete tables
are retained. Conclusions may remain unresolved. Shared residuals alone do
not identify their cause or prove cancellation in competing models. Only D/E
lie outside the chosen near-Sun region among the direct-reference rays, so
do not extrapolate their decomposition into an all-sky direct-reference score.

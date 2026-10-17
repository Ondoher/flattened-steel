# H55 Bruneton B1: Normalized60

Completed: [H55 results](paper-b1-results.md) retain all requested scores, images and verification. Scientific execution succeeded; the joint candidate regresses aggregate paper RMSE by0.3921% and is not promoted.

Selected by the owner on 2026-10-17: run the new diagnostic algorithm against
the Bruneton B1 paper benchmark, report RMSE for every time interval, and render
the dome comparison. The owner explicitly requires the Bruneton setup and its
larger spectral inventory. This is a contained experiment, not promotion.

## Frozen Comparison

- Reuse accepted angular-study baseline `00007-q2-base-full`: paper physical
  atmosphere, Penndorf Rayleigh spectrum, paper aerosol extinction/SSA/phase,
  wavelength-dependent grass boundary, disabled ozone, Native51 positions,
  Z180, W27 outgoing directions, F68 incoming directions, source20 and Q30
  quadratic final views with monotone-cubic solar interpolation.
- Baseline transport is already40. Candidate changes transport40 to60 and
  normalizes discrete Mie phase mass in each higher-order scattering pass.
  No Toronto optics, spectral projection, fitted exposure, geometry change,
  ground change, alternate cache stencil or additional correction is selected.
- Compute all40 original paper wavelengths, all17 benchmark times and all81
  canonical directions through N4. Retain the nine existing extra horizon
  witnesses as diagnostics. Use the paper's existing 31-channel B1 scoring
  boundary, 42,687 scalar residuals, with its original time/ray traversal.
- Permit experimental transport60 in the existing dial validator without
  changing existing counts. Classify that validation-only source difference
  explicitly, and freshly reproduce baseline channel16, including all cumulative
  spectra and pure/cumulative field hashes, before reusing the saved baseline.
  Candidate J1 witnesses and N1 viewed spectra must remain identical.

## Evidence And Execution

Implementation unit: `experiments/sky-accuracy-dials/paper-b1/`, the narrow
transport60 validator/declaration amendment and these owning topic documents;
baseline Git `afb7f50d`. Reuse the authenticated browser/scoring/Figure5 code
read-only. Adapt its GPU host into this lane only to use this experiment's
owned scratch root. Use JavaScript helpers, hardware GPU, one wavelength/job
at a time and monitorable progress. No dedicated reviewers or audits.

Write new immutable runs below the declared output root; preserve all parent
evidence. Retain compact spectra/metadata rather than full fields or cache
packages. Keep recipe parameters compact so sealed derivations do not repeat
full domain controls for every artifact. Reuse existing disk/scratch budgets;
amend only a measured, bounded shortage required for these requested outputs.
Use 30-minute execution guidance and a 60-minute outer allowance for monitored
positive progress. Fix actual execution failures and continue within scope.

## Deliverables And Checks

- Exact baseline qualification, complete40-channel candidate, J1 invariance,
  finite/nonnegative spectra, matched quantities/units/physical inputs, accepted
  run verification, local type checking and owned-resource cleanup.
- Aggregate and17 per-interval RMSE values with baseline, candidate, signed
  change and percent change; self-contained CSV/TSV and score image.
- Paper Figure5 dome comparison at10:15/11:15/13:15 with the new candidate,
  plus a focused baseline/candidate/published-Bruneton/libRadtran comparison.
  Preserve published panel images exactly and use the existing directional
  band-integrated error palette separately from spectral RMSE labels.
- Inspect images and report the outcome regardless of improvement. No automatic
  follow-on sweep, production adoption, local-Sun transfer or twilight claim.

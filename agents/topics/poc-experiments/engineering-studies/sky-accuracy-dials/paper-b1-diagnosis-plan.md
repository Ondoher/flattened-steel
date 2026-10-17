# H56: Diagnose The B1 Regression

Completed: [H56 diagnosis results](paper-b1-diagnosis-results.md) own accepted00348-00351, both complete ablations, final score/order/reference accounting and common-scale images. No production promotion or further campaign is selected.

The owner selected diagnosis after H55: retain the corrections justified by the
Toronto independent references and determine why their joint application slightly
regresses the fixed paper benchmark. Baseline Git: `759b6a97`. This remains a
contained experiment; production and sealed evidence stay unchanged.

## Questions And Controlled Cases

1. Does the regression originate in transport refinement, phase normalization,
   or their interaction? Complete the fixed 2x2 factorial:

   | Case | Transport intervals | Mie normalization | Evidence |
   | --- | ---: | --- | --- |
   | Baseline | 40 | Original | Reuse accepted angular baseline00007 |
   | Transport only | 60 | Original | New full Direct40 GPU build |
   | Normalization only | 40 | Normalized | New full Direct40 GPU build |
   | Joint | 60 | Normalized | Reuse accepted H55 run00347 |

2. Which wavelengths, times, elevations, Sun angles and cumulative scattering
   increments drive the change? Start with saved H55 data, then repeat attribution
   for each factorial contrast. Retain signed residuals and changes, not just RMSE.
3. Does the original calculation compensate an existing error? Evaluate the exact
   identity `deltaSSE = 2 * baselineResidual * change + change^2`. Quantify where
   dimming deepens an existing deficit and where it removes excess radiance.
   Compensation of an observed residual is evidence; the physical cause of the
   remaining residual is a separate question.
4. What does normalization mathematically guarantee? Compare the analytic
   Cornette-Shanks phase integral with F68 zeroth, first and second moments over
   all outgoing directions. Check a refined independent one-dimensional Simpson
   integral. Unit phase mass does not guarantee correct angular redistribution
   for anisotropic incoming radiance.
5. Is the change only a consequence of the measurement target? Compare with the
   already retained published Bruneton and libRadtran spectral boundaries,
   authenticated by their fixed SHA-256 and reproduced paper aggregate scores.
   Decompose the measurement SSE change into model-to-retained-reference and
   retained-reference-to-measurement cross terms. Label this retained-output
   agreement; it is not a newly matched or convergence-qualified reference.

## Fixed Boundaries And Interpretation

Keep H55's complete paper atmosphere, Direct40 spectral inventory, all17 times,
all81 canonical rays, Native51/Z180/W27/F68/source20/Q30 and four scattering
orders. Change only one factor in each new corner. Copy the exact accepted H55
normalized compiler into a new run at the same path depth. Require exact J1
field hashes and viewed N1 spectra for every wavelength. Transport controls
incoming L1 as well as later transport, so changes may begin at J2.

The scored B1 grid has a minimum elevation of12.115117462 degrees. The earlier
Toronto horizon witness is0.05 degrees. Do not describe a B1 score regression
as evidence that the independently justified near-horizon correction is wrong.
The paper RMSE gate remains unchanged, with no fitted atmospheric compensation.

Use exact telescoping increments of reconstructed cumulative results for the
order score ledger. Nonlinear cubic reconstruction means these are distinct
from separately integrated pure physical orders. Split interaction terms
symmetrically only as declared bookkeeping, not a unique causal allocation.
Separate spectral factorial interaction from quadratic score interaction.

## Execution, Artifacts And Verification

One hardware GPU job at a time, all40 wavelengths per new case, monitorable
progress and intermediate spectral images every10 channels. Two builds are
expected to take roughly20-25 minutes from H55 timing. Use30-minute guidance
per build and continue monitoring positive progress. Fix actual failures in
new runs without altering parent evidence. No automatic parameter sweep.

The measured retained inventory after H55 is554,682,907 bytes. Two analogous
captures need approximately27.4 MB; attribution ledgers/images need a small
additional allowance. Raise the retained ceiling from544 to592 MiB, bounded
to preserve this requested diagnosis. Keep1 GiB scratch and40 GiB free disk.
This changes a disk-evidence allowance, not system memory or cache budgets.

Deliver an initial saved-data attribution image, complete factorial scores,
time/wavelength heatmaps, selected measured/model spectra, spatial and order
budgets, phase-moment checks, a clear diagnosis and remaining uncertainties.
Run local type checking; verify exact score, group-partition, telescoping-order
and SSE identities; inspect images; verify immutable runs and cleanup. Keep
checkpoint advice active. No dedicated reviewers, production changes or
adoption decision are included.

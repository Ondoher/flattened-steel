# Sun-angle Residual Analysis: Fixed Retained-data Plan

The owner authorizes analysis of whether retained model-minus-Kider residuals
follow angular separation from the Sun. This resumes the existing contained
experiment. No new atmospheric integration, GPU capture, physical parameter
fit, empirical production correction or source promotion is included.

## Scope and resources

One CPU analysis record after accepted 00232, at most 10 minutes and 1.5 MiB of
retained output, charged to existing C6 reporting capacity. Preserve all prior
evidence. Baseline HEAD is c7803b241f0f8f409226354dc4fb72484f25a5ec; preserve
preexisting edits. Review unit: new angular analysis, proof, plot requests
and runner. Formal reviewers remain owner-suspended; checkpoint advice remains
blocked by the recorded calibration gate. No automatic retry or adaptive search.

## Inputs

Authenticate the 00231 comparison seal and its exact parent identities for
Native48 controls/capture, Kider measurements, Bruneton/libRadtran predictions,
and the separately labeled published production capture. Reuse its complete
1377-ray geometry. Authenticate 00230 and 00232 direct estimates as sparse
cross-checks, retaining their uncertainties and selection bias. These are not
a full-sky direct reference. Use original fitted solar geometry, not a newly
estimated orientation. Geometry uncertainty remains a limitation.

## Fixed comparisons

Use channels 0–30 (360–712.5 nm), equal benchmark scalar weighting, and
residual = model minus measurement. Four model identities remain separate.
The mean of Bruneton/libRadtran is a descriptive shared residual, not truth.

1. Summarize residual bias and RMSE by Sun separation bins
   [0,20), [20,40), [40,60), [60,80), [80,100), [100,120),
   [120,140), [140,180]. Keep near-Sun data visible but exclude it from
   attribution fits. Record ray/time/elevation coverage and spectral results;
   bands are blue <500, middle 500–600, red >=600 nm.
2. Remove each exact time/elevation-ring/wavelength residual mean from both
   residuals and explanatory variables. Rings are defined by canonical grid
   radius max(abs(x-4),abs(y-4)), not rounded floating-point elevation.
   Exclude the zenith ring and strata with fewer than four available rays.
   This isolates variation around a ring at the same time and wavelength.
3. Fit one fixed cubic in cos(Sun separation), without an intercept after
   centering, independently per wavelength/model. Ordinary least squares,
   no regularization tuning or degree selection. Leave one entire time out:
   train on the other 16 times, then evaluate centered residuals at the held
   time. Held-time ring means use held observations, so this is a conditional
   angular-pattern diagnostic, not independent prediction of sky brightness.
   Compare squared error with zero prediction of centered residuals. Report
   negative skill, per-time and per-band results, not only aggregate skill.
4. Repeat the same fixed comparison with bounded fractional residual
   2*(model-measured)/(model+measured), to check brightness weighting. No
   wavelength or ray is treated as an independent repeated experiment for
   confidence claims. No significance p-values or causal attribution.
5. Retain time-by-angle-by-band and elevation-by-angle-by-band means. Compare
   matched same-time/elevation pairs separated by >=30 degrees, for each band,
   reporting descriptive slopes and time consistency. These pairs overlap;
   they are not independent measurements.
6. Cross-check the old/new direct estimates at their available angles and
   wavelengths. Do not fit an angular correction to this selected subset.

## Verification and interpretation

Manufactured checks must recover a known angular polynomial after arbitrary
time/ring offsets, remove pure offsets, reject singular designs, preserve
the held-time split and verify residual/aggregation arithmetic. Reproduce the
existing full benchmark reference scores. Type-check authored JavaScript,
authenticate sources before sealing, verify the new seal and campaign debits.
Plot signed raw and centered angular/spectral residuals with counts and units.

An angular pattern that transfers across times supports angular structure in
the mismatch. It does not uniquely identify aerosol phase error: attenuation,
ground, pointing and other angular effects remain possible. A poor transfer
or strong time/elevation dependence argues against a universal angle-only
correction. Preserve the numerical-correction adoption hold.

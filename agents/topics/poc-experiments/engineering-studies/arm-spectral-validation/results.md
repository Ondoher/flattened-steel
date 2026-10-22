# ARM spectral validation: first comparison

Disposition: **conditional comparison completed; absolute observational accuracy
is inconclusive**. Corrected production-cache probes are close to matched
libRadtran, and vastly less bright than the legacy control. Both corrected
production and libRadtran remain substantially brighter than SASZe. The shared
mismatch needs input/instrument investigation before attributing it to production.
No production source, asset, default or deployment changed.

## Reviewable results

- [Matched zenith color swatches](color-swatches.md), with common exposure and
  equal-luminance views from the later 400–800 nm spectral extension.
- [Pilot spectra, 22:20-22:24 UTC](../../../../../tmp/experiments/arm-spectral-validation/runs/00032-comparison/pilot-spectra.svg)
- [Reserved spectra, 22:00-22:04 UTC](../../../../../tmp/experiments/arm-spectral-validation/runs/00032-comparison/reserved-spectra.svg)
- [Pilot residuals](../../../../../tmp/experiments/arm-spectral-validation/runs/00032-comparison/pilot-residuals.svg)
- [Selectable score table](../../../../../tmp/experiments/arm-spectral-validation/runs/00032-comparison/scores.tsv)
- [Spectral values and diagnostics](../../../../../tmp/experiments/arm-spectral-validation/runs/00032-comparison/scores.json)
- [Atmosphere projection](../../../../../tmp/experiments/arm-spectral-validation/runs/00025-physical-inputs/profiles.svg)
- [Read-only verification](../../../../../tmp/experiments/arm-spectral-validation/runs/00033-verification/result.json)

The numerical curves join nine continuum-band predictions; the ARM curve retains
native measured spectral structure. These are zenith spectral comparisons,
not horizon or scene renders. No RGB/exposure transformation enters the scores.

## Measurements and selection

The case is ARM SGP C1 on22 August2023. Four authenticated files contain calibrated
SASZe visible zenith spectra, morning/evening radiosondes and Raman-lidar profiles.
The co-located AERONET site is `ARM_SGP`. Its Level2 AOD constrains aerosol loading;
complete phase/SSA/spectral surface-albedo inputs use the22:21:37 Level1.5 inversion.
Level2 SSA is missing at the low AOD and its phase export masks many angles.
Missing values were never interpreted as zero.

The [frozen observations](../../../../../tmp/experiments/arm-spectral-validation/runs/00023-case-freeze/cases.json)
and [stability selection](../../../../../tmp/experiments/arm-spectral-validation/runs/00021-stable-windows/result.json)
precede all model predictions. Pilot:120 spectra, apparent solar zenith56.6-57.3
degrees; reserved:126 spectra, around53 degrees. Both pass the fixed lidar
cloud/rain and temporal-stability rule. The initially proposed21:50 interval
varied15-50% across visible bands and was excluded before scoring. The reserved
interval uses the same physical mapping and numerical settings without tuning.
Its proximity means correlated repeatability, not independent calibration or
validation across atmospheric regimes.

## Matching and its limits

The [physical contract](../../../../../tmp/experiments/arm-spectral-validation/runs/00025-physical-inputs/contract.json)
owns exact coefficients, profiles, phase tables, source, geometry, operator and
scenario controls. No atmospheric parameter was fitted to measured radiance.

Nine4nm rectangular continuum bands are centered at440,470,500,530,550,580,610,
640 and675nm. Native SASZe W/(m2 um sr) is numerically equal to output
mW/(m2 nm sr). A common band-averaged installed solar spectrum is explicitly
converted toW for production and mW for libRadtran, with the same declared
Earth-distance approximation. Actual instrument bandpass and air/vacuum
wavelength convention remain operator uncertainties.

The measured-constrained profile uses evening-sonde pressure/temperature,
an identified AFGL molecular extension above its27.2km support, and lidar
extinction shape normalized to independent AOD. The near-field150m is filled
from the first included lidar height; aerosol above12km is assumed zero. These
are reconstruction assumptions, not measured bounds. Production projection
preserves molecular column and aerosol column/first height moment with
exponential scale heights9096m and1442m. AERONET ancillary ozone is297.86DU;
libRadtran's full-profile case uses a column-normalized AFGL ozone shape and
the projected case uses production's triangular shape. Neither vertical ozone
shape is measured by these inputs.

Both solvers use the same normalized piecewise-linear aerosol phase, SSA,
Lambertian albedo, scalar Rayleigh coefficient and ozone cross sections. Phase
normalization and libRadtran Legendre moments are explicitly integrated in cosine
space; asymmetry factors were not substituted for analytic phase parameters.
Other gas absorption and polarization are omitted. Surface-reflectance and
altitude-dependent aerosol optics remain approximate.

Production results use the actual production compiler, N4 cache package,
Reader and W27/monotone-cubic solar reconstruction. The contained host adapter
changes the output boundary only. The offline zenith probe uses240/480 midpoint
view intervals including declared ozone extinction; it is not a bitwise test of
the running application's frame shader. Legacy15/ordinary outgoing is a
matched-input control, not the byte-identical deployed default-atmosphere asset.
libRadtran2.0.1-MYSTIC runs DISORT with pseudo-spherical direct-beam geometry,
32/64 streams and128 phase moments. Its full scattering differs from productionN4.

## Descriptive scores

Absolute RMSE is in mW m^-2 nm^-1 sr^-1. Relative RMS is the RMS of per-band
fractional residuals, with a1mW denominator floor that is inactive for these bands.
The two cases and nine channels are not statistically independent samples.

| Comparison                                  | Pilot absolute RMSE | Pilot relative RMS | Reserved absolute RMSE | Reserved relative RMS |
| ------------------------------------------- | ------------------: | -----------------: | ---------------------: | --------------------: |
| Corrected production / ARM                  |              15.384 |             63.06% |                 16.596 |                60.00% |
| libRadtran measured-constrained / ARM       |              14.961 |             59.31% |                 15.008 |                52.50% |
| libRadtran projected / ARM                  |              14.946 |             59.25% |                 14.991 |                52.44% |
| Corrected production / libRadtran projected |               0.876 |              3.15% |                  1.811 |                 5.37% |
| libRadtran full / projected                 |              0.0152 |             0.039% |                 0.0173 |                0.040% |
| Legacy control / ARM                        |             402.772 |           1311.13% |                not run |               not run |

Corrected production's mean relative brightness bias against ARM is+62.97%
in the pilot and+59.91% in the reserved interval. Projected libRadtran is+59.12%
and+52.30%, respectively. The pilot ARM/libRadtran band ratios are0.602-0.647.
That broadly common scale difference is useful diagnostic evidence; it does not
identify a calibration error. No gain, exposure, atmosphere or mask was fitted
or applied to improve these scores.

## Numerical and input sensitivity

View240/480 refinement changes production results by at most0.0086% in these
cases. libRadtran32/64 streams changes results by at most0.0063%;250/125m layer
refinement changes its pilot full-profile result by at most0.00026%. Those
checks do not certify every production cache dimension or the omitted physics.

Two bounded production-cache numerical leads were followed at550nm, without
changing the primary comparison or tuning against ARM:

| Construction diagnostic               | Radiance | Change from primary |
| ------------------------------------- | -------: | ------------------: |
| Primary Native48 / source-path20      |   36.513 |            baseline |
| Source-path40                         |   37.537 |              +2.80% |
| Source-path80                         |   37.819 |              +3.58% |
| Source-path160                        |   37.891 |              +3.77% |
| Native51 near-ground / source-path20  |   35.164 |              -3.69% |
| Native51 near-ground / source-path160 |   36.255 |              -0.71% |
| libRadtran projected                  |   35.517 |  independent solver |

The last source-path doubling changes the diagnostic by0.19%. Finer source-path
integration and finer altitude reconstruction move in opposite directions.
Their combined change is much smaller than either alone: cancellation persists
at the few-percent level here. These single-band diagnostics do not establish a
globally optimal grid or fully converged cache, and are not production changes.

Eight coherent input scenarios perturb AOD by±0.02, SSA by±0.05, albedo by±0.03,
and selected joint combinations, with physical clipping and spectral correlation.
This is a deterministic scenario envelope, not a confidence interval or total
uncertainty bound. Even its lowest pilot predictions remain30-51% above ARM
across these bands. Full/projected profile differences are tiny for these zenith
cases; that result cannot be extended to grazing horizon rays.

The historical libRadtran job named `view-halfdegree` actually shifts **solar
zenith** by+0.5degrees and leaves `umu=-1`. It is a solar-geometry sensitivity,
not a field-of-view or tilted-camera test. Its deck is preserved; the current
runner's future label is corrected. Collector tilt/FOV remains unbounded by
that diagnostic.

## Why the accuracy verdict stays inconclusive

SASZe identifies calibration file `sgpsaszevisC1.20220508.200ms.dat`. Applicable
DQR D210830.12 warns of transient saturation without a calibrated-stream QC
flag. The pilot's reconstructed dark-subtracted signal is far below the cited
detector threshold, but raw-count proof was unavailable: the legitimate raw
query returned403, and the cataloged TWST tar download returned404. No access
restriction was bypassed.

The [SASZe handbook](https://www.arm.gov/publications/tech_reports/handbooks/sasze_handbook.pdf)
discusses instrument effects beyond the reference-lamp calibration. The
[ARM uncertainty guide](https://www.osti.gov/servlets/purl/1347746) lists SASZe
calibration uncertainty as10% or more, which is not a finite upper bound for
this specific2022 calibration applied in2023. The case therefore does not
support a definitive absolute accuracy claim. Conditional Level1.5 optics,
approximate bandpass/FOV, gases and profile reconstruction add further limits.

Supported: corrected production strongly improves on this legacy control under
the frozen inputs, and its conditional spectra are close to libRadtran. Both
share a large measured-data mismatch that is not explained by the numerical
refinements or selected input scenarios tested. It remains unresolved whether
instrument response/calibration, atmospheric inputs, measurement matching or
shared omitted physics explains it. Solver agreement alone does not settle it.

The next useful work is independent confirmation of the SASZe calibration and
measurement operator for this epoch, ideally with accessible raw counts or a
second calibrated instrument, followed by better-qualified aerosol/surface/gas
constraints. Rebuilding the same caches at progressively higher resolution is
unlikely to explain a roughly60% shared brightness offset by itself.

## Execution, preservation and verification

Measured central cache builds took101.4s corrected and52.6s legacy for nine
channels. The five one-band cache diagnostics took6.7-7.1s each. Sixteen
libRadtran cases used82.1s of solver time. Acquisition, startup, parsing,
verification and reporting are separate costs. In particular, sealing4283
libRadtran artifacts through WSL took349s after the numerical body finished.
It completed before an identity-guarded interruption could occur; no process was
interrupted and no recovery run or repeated physics was required. The source
helper now maintains its heartbeat through artifact hashing; the historical
sealing heartbeat gap remains disclosed and unchanged.

Verification authenticates33 preceding runs,7461 artifacts and1067230155 bytes,
including retained failed attempts. It checks exact file sets, sizes, SHA256,
physical-input matching, finite/nonnegative reported production radiances,
the N4 contract, current Python AST parsing and local TypeScript. The native
SVG was rasterized and visually inspected. The primary comparison/report is
sealed in00032; verification is sealed in00033. No standards-compliance claim,
reviewer pass or experimental unit-test suite is implied.

Local checkpoints include77d78 (access feasibility) and8a8f42fb (acquired and
screened inputs); Git history owns the final result checkpoint. Experiment
source and generated output remain contained. This lane stays selected for
owner-directed follow-on work; no experiment lifecycle closure is implied.

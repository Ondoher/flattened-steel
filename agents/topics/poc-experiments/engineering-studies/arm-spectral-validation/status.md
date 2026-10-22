# ARM Spectral Validation Status

State: M1 acquisition/screening complete for conditional characterization;
M2 physical matching in progress. Independent execution remains authorized.
No ARM-matched production or libRadtran accuracy scores exist yet.

## M1 report

Authenticated ARM access resolved the download dependency. Four complete,
hashed 22 August 2023 SGP files are retained: calibrated SASZe visible zenith
radiance, 11:30/23:31 UTC radiosondes and Raman-lidar profiles. Their combined
size is 276593308 bytes. Credentials are absent from source and evidence.
Native NetCDF decoding uses the existing Ubuntu libnetcdf; no package was installed.

The [frozen case](../../../../../tmp/experiments/arm-spectral-validation/runs/00023-case-freeze/cases.json)
selects 22:20-22:24 UTC as pilot and 22:00-22:04 as reserved confirmation.
Selection used measured temporal variability, lidar cloud/rain flags and
proximity to a co-located 22:21:37 AERONET inversion, before any prediction.
The originally proposed 21:50 window varied by15-50% across visible bands and
was rejected. The [stability proof](../../../../../tmp/experiments/arm-spectral-validation/runs/00021-stable-windows/result.json)
owns the fixed eligibility rule and all candidate windows. Nearby intervals
share calibration and atmosphere errors; they establish repeatability only.

The pilot has120 spectra, apparent solar zenith56.6-57.3 degrees, no lidar
cloud/rain flags and roughly1-4% standard deviation at440/550/675/780 nm.
The reserved window has126 spectra and passes the same stability rule.
Native W/(m2 um sr) is numerically equal to mW/(m2 nm sr). Heights in lidar
are km above ground; sonde heights are meters above mean sea level.

- [Measured spectra](../../../../../tmp/experiments/arm-spectral-validation/runs/00023-case-freeze/spectra.svg)
- [Measured particulate extinction](../../../../../tmp/experiments/arm-spectral-validation/runs/00023-case-freeze/extinction.svg)
- [Case derivation and seal](../../../../../tmp/experiments/arm-spectral-validation/runs/00023-case-freeze/sealed.json)

## Quality and interpretation gates

The calibrated stream identifies responsivity file
`sgpsaszevisC1.20220508.200ms.dat`. DQR D210830.12 warns of transient saturation
and the calibrated stream has no saturation flag. Pilot reconstructed
dark-subtracted counts peak around2516 versus the cited65536 detector limit;
this supports a low-signal subset but does not prove absence of raw saturation.
The legitimate raw-data query returned403; TWST's cataloged raw tar returned404.
Neither restriction was bypassed. Those attempts remain immutable evidence.

The ARM handbook describes absolute-calibration discrepancies around10% and
additional instrument effects; the1-3% reference-lamp figure is not a whole
instrument uncertainty. A defensible absolute upper bound for this particular
calibration has not been established. Consequently this case does **not** pass
the gate for a definitive observational accuracy verdict. Conditional spectra
and represented-atmosphere solver comparisons may be reported with this limit;
agreement must not be called validation within a fabricated confidence band.

Co-located ARM_SGP AERONET Level2 AOD and retrieved asymmetry/albedo are available.
Level2 SSA is missing at the low aerosol loading. A complete Level1.5 SSA and
phase table is available at22:21:37; the Level2 phase export masks many values.
The [nearby-date inventory](../../../../../tmp/experiments/arm-spectral-validation/runs/00019-phase-coverage/result.json)
and frozen case preserve both levels. Level1.5 optical inputs remain conditional,
with scenario sensitivity required; no missing value is interpreted as zero.

Lidar extinction below its trustworthy overlap region, its smoothing/uncertainty,
sonde time/altitude support, upper-atmosphere extension, spectral response,
ozone/other gases and surface reflectance need explicit M2 treatment. Raw
near-ground lidar spikes must not silently become a production aerosol profile.

## M2 readiness and next work

The [libRadtran operational smoke](../../../../../tmp/experiments/arm-spectral-validation/runs/00022-solver-smoke/result.json)
passes: the pinned installed2.0.1-MYSTIC executable produced finite positive
zenith radiance at450/550/650 nm. The three-wavelength DISORT solve took0.123 s,
excluding startup, input preparation and dependency hashing. This smoke uses a
default atmosphere and is **not** an ARM or production comparison. The new
contained runner retains executable and complete installed-data identities.

Next: derive measured-constrained and production-representable profiles from
atmospheric inputs alone; freeze source, phase, gases and common spectral
operator; then judge which limited comparisons the remaining uncertainty permits.
M3/M4 are not complete. Production and all other experiments remain read-only.

## Evidence and verification

Runs00000-00007 preserve the earlier access-feasibility inventory, including
superseded conclusions before credentials were supplied. Runs00008 onward own
authenticated measurements, optical retrievals, quality screening and smoke.
An accepted seal denotes operation integrity, not scientific acceptance.
Run00005's historical JSON Lines defect remains disclosed and unmodified.
No experimental unit-test suite, dedicated standards reviewer or independent
review audit was started. Checkpoint-advisor monitoring remains active.

## Boundaries

Tracked source: `experiments/arm-spectral-validation/`. Ignored output:
`tmp/experiments/arm-spectral-validation/`. No production deployment/default
change is authorized. Sky Accuracy Dials remains suspended. The permanent
experiment standards mapping remains; no temporary overlay was added or needs
restoration. Git history owns checkpoint identities.

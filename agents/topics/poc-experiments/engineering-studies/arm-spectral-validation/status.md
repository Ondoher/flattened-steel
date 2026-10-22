# ARM Spectral Validation Status

State: **suspended on 2026-10-21**, awaiting the owner's response from the AMUDIS
researchers. The owner reports that the data-request email has been sent to
Jens Duffert. This is a suspension, not closure; resume only after owner selection.
The planned pilot and reserved-interval conditional characterization completed.
Absolute observational accuracy remains inconclusive. The
[results report](results.md) owns scores, figures, numerical/input sensitivity,
interpretation limits and follow-on recommendations. No production change or
deployment occurred. No numerical process remains active.

The owner-requested [matched zenith swatches](color-swatches.md) are complete
for both windows, with common exposure and a separate equal-luminance view.
Runs00034-00038 extend visible coverage to400-800nm without changing the original
nine-band comparison. The swatch report owns conversion details and limitations.

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

The physical contract retains assumptions about lidar overlap and smoothing,
sonde time/altitude support, upper-atmosphere extension, spectral response,
ozone/other gases and surface reflectance. Their remaining uncertainty limits
interpretation. Raw near-ground lidar spikes were excluded from the projection.

## M2-M4 report and next boundary

The [physical contract](../../../../../tmp/experiments/arm-spectral-validation/runs/00025-physical-inputs/contract.json)
freezes nine visible continuum bands, shared optical inputs, measured-constrained
and exponential profiles, geometry, measurement operator and sensitivity scenarios.
Both corrected and legacy-control caches were built with the actual production
GPU compiler. Matched libRadtran full/projected cases, numerical refinements,
input scenarios and the unchanged reserved-interval evaluation are complete.
The absolute-accuracy gate remains unmet; results are conditional characterization,
with uncertainty and operator limitations disclosed, rather than certification.

The [comparison](../../../../../tmp/experiments/arm-spectral-validation/runs/00032-comparison/result.json)
and [verification](../../../../../tmp/experiments/arm-spectral-validation/runs/00033-verification/result.json)
are sealed. Corrected cache probes differ from projected libRadtran by3.15%/5.37%
relative RMS in pilot/reserved windows. Both are much brighter than ARM. The
results report owns the complete table and why the shared mismatch remains
unattributed. No fitted exposure, gain, atmosphere or mask was applied.

## Suspension and resumption

The owner's priority is measured spectral radiance across the full sky hemisphere,
including low elevations, together with corresponding atmospheric information.
The intended benchmark should improve on the atmospheric reconstruction used for
the Kider/Bruneton comparison; it need not establish a fully certified atmosphere.
Uncertainty is reported rather than made an automatic obstacle to useful comparison.
The existing ARM zenith campaign remains useful supplemental evidence and does not
establish whole-sky coverage.

The next unconsumed task, after the owner selects resumption, is to inspect the
AMUDIS reply and any offered files for complete clear-sky directional spectra,
wavelengths, timestamps, angular/FOV information, quality/calibration metadata and
coincident atmospheric profiles or aerosol optical properties. Request context:
the [Hannover preprint](https://egusphere.copernicus.org/preprints/2025/egusphere-2025-1118/egusphere-2025-1118.pdf)
uses January 2024 measurements and states that data/code are available on request.
The owner requested a recent replacement or supplement for Kider measurements,
including both sky-wide spectra and atmospheric profiles. No reply or dataset
access has yet been confirmed. No automatic acquisition, numerical run, outreach
or monitoring is queued.

Other retained leads are [SKYSPECTRA](https://zenodo.org/records/8147546), whose
Berlin export contains a nominal 145-patch grid with low-elevation centers at
6 degrees and some missing directions, and the owner's downloaded
[OpenHSI paper](../../../../../references/downloads/1-s2.0-S0038092X23004462-main.pdf).
OpenHSI describes dense measured sky coverage but does not identify a numerical
dataset download or a contemporaneous atmospheric profile in the paper. These
are leads, not acquired or qualified whole-sky validation datasets.

Minimal resumption reload: repository instructions, this status, the experiment
entry, design and plan, then the owner's reply/files. Check current production
compiler/policy identities, dataset provenance and spectral/angular/time matching
before deriving new results. Reuse sealed ARM evidence read-only rather than
repeating the completed campaign. SASZe calibration/operator investigation remains
a possible separately selected follow-on, not the immediate queue.

All 39 existing run directories through 00038 have seals. No unfinished run or
owned Python, Node, Chrome, WSL or solver process was found during suspension.
No resource termination was needed. No temporary experiment-specific standards
entry was present to deactivate; the permanent experiment mapping and types.md
remain. Folder resolution was checked for experiment, topic and production paths.
There is no standards-review gate for this contained experiment and no production
adoption or deployment is authorized. No next execution topic is selected.

## Evidence and verification

Runs00000-00007 preserve the earlier access-feasibility inventory, including
superseded conclusions before credentials were supplied. Runs00008 onward own
authenticated measurements, optical retrievals, quality screening and smoke.
An accepted seal denotes operation integrity, not scientific acceptance.
Run00005's historical JSON Lines defect remains disclosed and unmodified.
Python AST and local TypeScript pass. Verification authenticates33 earlier runs,
7461 artifacts and1067230155 bytes, including retained failed attempts. The native
spectral plot was rendered and inspected. The historical00029 sealer has a349second
heartbeat gap during hashing; the helper now keeps its heartbeat through hashing.
No experimental unit-test suite, dedicated standards reviewer or independent
review audit was started. Checkpoint-advisor monitoring remains active.

## Boundaries

Tracked source: `experiments/arm-spectral-validation/`. Ignored output:
`tmp/experiments/arm-spectral-validation/`. No production deployment/default
change is authorized. Sky Accuracy Dials remains suspended. The permanent
experiment standards mapping remains; no temporary overlay was added or needs
restoration. Git history owns checkpoint identities.

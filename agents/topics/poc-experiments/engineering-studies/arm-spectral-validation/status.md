# ARM Spectral Validation Status

State: execution authorized, M1 advancement held for ARM data access, 2026-10-21.
The plan is incomplete. Public metadata acquisition and reporting are complete;
no measured spectra/profile payload, production cache build or libRadtran
comparison has been accepted or run.

## M1 report: a real candidate exists; access and quality remain open

Exact public catalog queries confirm these 22 August 2023 SGP C1 files:

| Role                                        | File                                        | Catalog bytes |
| ------------------------------------------- | ------------------------------------------- | ------------: |
| Calibrated visible zenith spectra candidate | `sgpsaszevisC1.a1.20230822.000001.nc`       |     210641156 |
| Morning radiosonde                          | `sgpsondewnpnC1.b1.20230822.113000.cdf`     |        582872 |
| Evening radiosonde                          | `sgpsondewnpnC1.b1.20230822.233100.cdf`     |        537216 |
| Aerosol extinction/profile                  | `sgprlproffex1thorC1.c0.20230822.000000.nc` |      64832064 |

The four complete files total 276593308 bytes. Prefer a small authenticated
subset where the service supports one. Exact filenames/byte counts are provider
metadata, not content hashes or proof of calibration/clear sky/physical matching.
The candidate is supported by actual file inventory; it remains scientifically
unqualified. The 11:30 and 23:31 UTC soundings do not establish a simultaneous noon
profile. Assess evolution and spatial/temporal uncertainty after acquisition.

Prefer SASZe `a1` over TWST `00`: the instrument handbook identifies `a1` as
calibrated zenith radiance; TWST's listed candidate is a 172871680-byte raw tar
file. Actual SASZe response, calibration epoch, quality notices and cloud masks
still need examination. The older handbook warns that absolute radiance
uncertainty may be substantial; do not apply a 1-3% lamp uncertainty alone as
whole-instrument uncertainty. Phase/SSA, surface albedo, gases/solar source and
upper-profile extensions remain unqualified.

The PI archive contents API returned HTTP 401. The documented ordinary download
route without required credentials returned HTTP 400. The public application
uses authenticated data access, and ARM documents registration/token requirements.
`limited_access:false` in product metadata does not mean anonymous downloading.
The owner reports having neither an ARM account nor local files. No account was
created, authentication bypass attempted or credential stored in evidence.

- [Authoritative M1 report](../../../../../tmp/experiments/arm-spectral-validation/runs/00007-m1-report/result.json)
- [Candidate file inventory](../../../../../tmp/experiments/arm-spectral-validation/runs/00007-m1-report/candidate-files.tsv)
- [Exact metadata acquisition](../../../../../tmp/experiments/arm-spectral-validation/runs/00003-exact-coverage/result.json)
- [Documented access/calibration sources](../../../../../tmp/experiments/arm-spectral-validation/runs/00004-reference-access/result.json)
- [Report seal](../../../../../tmp/experiments/arm-spectral-validation/runs/00007-m1-report/sealed.json)

Disposition: **M1 held for external access, not rejected for missing science**.
M2 matched contracts, M3 scoring and M4 confirmation are not advanced. No RMSE,
color swatch or libRadtran accuracy conclusion exists. Zenith remains the
measurement direction; no horizon appearance is inferred.

## Resumption point and decisions

1. Owner registers a free [ARM account](https://adc.arm.gov/armuserreg/) and
   provides an authorized access route or the identified data files. The
   [Live Data service](https://adc.arm.gov/armlive/) documents token acquisition.
   Keep credentials out of chat, source, command histories and evidence. No
   further permission to execute the saved plan is needed after access resolves.
2. Acquire the smallest useful SASZe/profile interval into a new immutable run,
   verify actual units/calibration/response/quality and choose a clear-sky case.
   Choose held-out data before numerical tuning. Nearby dates remain permitted.
3. Complete profile/optics/solar/albedo constraints and uncertainty bounds before
   production or libRadtran computation. The installed Windows Python lacks
   netCDF4/scipy/h5py/xarray; use an existing suitable decoder or authenticated
   service conversion where available. Do not create a dependency install or
   external configuration repair implicitly.
4. Reuse the retained exact metadata and acquired documentation while fresh;
   do not repeat completed requests merely to resume. Authenticate changed
   metadata or newly selected files separately.

A unit-conversion witness was recorded without a physical solve:
100 W m^-2 sr^-1 um^-1 = 0.1 W m^-2 sr^-1 nm^-1 = 100 mW m^-2 sr^-1 nm^-1.
Actual file units still require verification. This is not a measured spectrum.

## Execution record and verification

The owner requested independent execution on 2026-10-21. Five bounded public
acquisition runs retained 32 requests; total measured acquisition wall time was
18.593 seconds, excluding research, implementation, approvals and reporting.
Current retained output is 6487752 bytes. No GPU allocation or solver process
was started; no experiment-owned process remains.

Runs 00000-00004 retain raw HTTP responses and documentation, including failed
access attempts. Broad catalog text searches were provisional; exact field/date
queries in 00003 supersede their suitability for coverage claims. Inclusive date
queries also returned 23 August files, which the report explicitly excludes.
Runs 00005-00007 are report derivatives; 00005's progress JSON Lines formatting
was repaired in new reports without modifying its sealed bytes. 00007 preserves
exact tool/request-source snapshots and verifies all seven preceding seals.
An accepted run seal denotes inventory/report integrity only, never acceptance
of a scientific case. No unit-test suite was created.

Local type checking and Python AST parsing pass. Scaffold/folder mapping,
ignore-boundary, source/output separation, local file links and whitespace are
verified. Direct Prettier API checking passes for 14 authored Markdown/configuration files;
67 retained artifacts across eight runs pass hash verification. The superseded
00005 progress-format defect is disclosed above. The local checkpoint preserves
this bounded setup/acquisition slice; Git history owns its exact identity. The initial create-plan critique was incorporated;
no dedicated standards reviewers/audits were started and no compliance claimed.

## Boundaries and standards restoration

Source: `experiments/arm-spectral-validation/`. Output:
`tmp/experiments/arm-spectral-validation/`. Production and other experiments
remain read-only. Sky Accuracy Dials and its eight reserved tuples remain
unselected/suspended. The [production promotion status](../../../production-algorithm32/caches/sky-accuracy-promotion-status.md)
retains corrected-versus-deployed legacy identities and admission boundaries;
this experiment neither deploys nor changes either.

The permanent `experiments/` -> `experiment` set supplies base documentation,
project-foundation and types.md. The only matching overlay is the shared
experiment-lifetime rule. No lane-only assignment, set or overlay was added;
there is nothing temporary to restore. Topic documents inherit `agents/` ->
`base`. Normalization remains valid. Checkpoint-advisor monitoring is active
independently; experimental calibration/compliance gates remain disabled.

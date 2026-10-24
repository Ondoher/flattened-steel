# Measured Clean Horizon Profiles Experiment Status

Status: M1 execution concluded with partial/inconclusive qualification on 2026-10-24;
selected for owner review. The experiment is not closed or promoted.

## Current State

The [results](results.md) own source findings, color controls and the milestone
disposition. ARM's 2023-12-05 SGP observations are the strongest new low-aerosol
lead. Official ATom numerical access needs Earthdata; acquired public derivatives
do not supply complete ambient optics. ARM surface measurements, AERONET and
lidar were downloaded and paired, but humidity growth, near-field calibration,
spectral/angular phase and upper-column completion remain unresolved. No complete
measured profile is qualified for the 5 m scene claim.

Matched Bruneton/molecular-only color controls at 5 and 500 m show meaningful
clarity opportunity. Candidate M2, M3 adapter and M4 actual scenes were not
triggered under the plan's input-completeness gate. No production or prior
experiment source/evidence was modified by this lane.

## Latest Verification

- Scaffold check passed; normalization marker validates and effective mapping is experiment/base/types.
- Output root remains Git-ignored. Runs 00000–00025 are terminal; failed attempts remain intact.
- Local authored-source JavaScript/TypeScript check passes.
- Final proof rehashed 2,330 artifacts from the preceding 25 runs, verified color controls and image artifacts.
- Paired surface optics use simultaneous QC=0 samples, separate impactor states, explicit STP/ambient-density conversion and retained humidity differences.
- Raw near-field audit and primary handbooks establish the limits of the inherited 150 m screening convention and the lidar's 355 nm wavelength.
- One independent plan critique completed; all seven recommendations incorporated in the plan.
- Checkpoint monitoring remains active; local commit details belong in the execution log.
- Type-check configuration: `experiments/clean-horizon-profiles/jsconfig.json`.
- Output root: `tmp/experiments/clean-horizon-profiles/`.
- Latest verification: `tmp/experiments/clean-horizon-profiles/runs/00025-verify/` (accepted).

## Claim limits

The acquired data support a low-aerosol lead, not a complete ambient profile or
an appearance prediction. There is no account question pending. The user supplied
ARM access; its credentials were used ephemerally and were not logged. Earthdata
access would enable the official ATom numerical file but not its missing surface
observations. These are evidence limits, not new runtime or update prohibitions.

## Resumption boundary

The bounded M1 investigation is reported for owner review. The strongest follow-on
is an explicitly constrained ARM December reconstruction: establish humidity and
near-field completion bounds before candidate M2 spectra or scene construction.
Do not repeat downloads, controls or failed-access attempts without changed inputs.
Reuse sealed evidence read-only. [Execution log](execution-log.md) owns decisions.

## Standards provenance and lifecycle

Inherited permanent assignment: `experiments/` -> `experiment` (base plus types.md).
No experiment-specific set, deeper assignment or overlay entry was introduced;
there is no temporary standards configuration to restore on closure/suspension.
Production reviewer context is invalidated by this topic switch. Under repository
policy no experiment standards reviewer or independent audit is started or refreshed.
The create-plan critique is planning advice, not standards sign-off. Checkpoint
adviser monitoring remains active and is refreshed with this selected context.

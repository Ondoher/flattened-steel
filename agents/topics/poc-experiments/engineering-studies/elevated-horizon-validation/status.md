# Elevated Horizon Validation Status

State: prepared on 2026-10-23. The scaffold and libRadtran-first plan are saved;
no solver, numerical scan or production update has begun. No result is accepted.

## Current scope and next action

The [plan](plan.md) owns the sequence and scientific decision thresholds; the
[design](design.md) owns comparison conditions and run/output boundaries.
Next executable step: register the current production profile and exact 10 km
ray geometry, then check the existing libRadtran installation and pilot it under
M1 when execution is requested. Sun/view conventions, surface equivalence and
spectral-bin matching must be qualified before appearance comparisons.

## Setup verification

[Setup run 00000-setup-checks](../../../../../tmp/experiments/elevated-horizon-validation/runs/00000-setup-checks/manifest.json)
passes scaffold checking, durable normalization validation, folder resolution,
ignored-output verification, ambient type checking and formatting diagnostics.
This is an accepted setup proof, not a scientific result. There is no numerical
implementation, experimental test suite or accepted atmospheric comparison yet.
Production files were not changed. No solver or browser process was launched.

Dedicated standards reviewers and independent compliance audits are disabled.
Checkpoint-advisor monitoring remains active through the existing session adviser.
No compliance result is claimed. Plan execution has not begun.

## Plan critique incorporated

A separate agent performed one read-only critique of the plan/design and the
minimum libRadtran/baseline context. All six recommendations were incorporated:

1. Inspect actual app depth/input, transmittance, path radiance and compositing
   even when black-ground transport agrees; include a small independent optical
   depth check so controlled agreement cannot conceal an app-only problem.
2. Make adaptation of both the libRadtran launcher and Python worker a definite
   M1 task before even doctor, because both enforce the old output boundary.
   Keep the internal worker and outer host-finalized manifests separate.
3. Register actual rendered mesh/depth silhouettes, pixel rays, antialiasing and
   angular footprint alongside the analytic spherical horizon.
4. Publish an early, explicitly approximate three-wavelength appearance strip
   after geometry qualification; reserve photometric claims for matched bands.
5. Specify replicate-based uncertainty/covariance handling, batch stability and
   N4-versus-all-orders truncation limits before diagnosing implementation error.
6. Audit surface equivalence incrementally and finish a shared-boundary comparison
   before paying for a new neutral-ground scan or large controlled calculation.

The scaffold's relative folder-identity link was corrected. No recommendations
were rejected. No additional critique, standards pass or independent audit is
requested. Routine adaptive branches follow the plan's recorded decision process.

## Standards restoration provenance

Inherited assignment before creation: `experiments/` -> `experiment`, extending
base and retaining types.md. Relevant inherited overlay: temporary experiment
standards lifetime. No folder assignment, set definition, waiver or overlay was
changed. There is no temporary configuration to restore at suspension/closure;
the permanent experiment mapping remains. Source, output and topic paths share
the identical unnumbered slug `elevated-horizon-validation`.

Topic refresh selects this contained lane and invalidates previous production
review context. No reviewer starts or compliance ledger is required for this
experiment. This is separate from the one bounded plan critique.

## Baseline and preservation

Starting production commit: `e4b21c447598e783de22108f1afb73a5a47b1361`.
Production app, tools and operational package remain unchanged by setup. Prior
10 km capture records and earlier solver methods are read-only candidate inputs;
execution must hash/authenticate them before reuse. Sky Accuracy Dials and ARM
Spectral Validation remain suspended; Sky Aerosol Properties remains ended.
No scientific run, accepted artifact or result from those lanes is modified.

## Blockers and uncertainties

No setup blocker. WSL/tool operational availability and elevated-reference
throughput have not been checked live during this setup. The app's RGB ground
material is not automatically equivalent to a spectral Lambertian boundary.
The design defines how to keep those comparisons honest.

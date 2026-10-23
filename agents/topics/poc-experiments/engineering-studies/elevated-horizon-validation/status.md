# Elevated Horizon Validation Status

State: plan execution complete and verified on 2026-10-23. The baseline and earned
aerosol-loading branch are reported in [results](results.md). Production is
unchanged. The experiment remains selected for owner follow-up; no closure,
suspension or promotion is implied.

## Current outcome and next action

libRadtran reproduces a low-contrast 10 km horizon with the current Bruneton
profile. Six limb rays agree with installed GPU N4 brightness within 1.3%; native
band residuals reach about 6.3%, so no perfect spectral match is claimed. The
actual depth silhouette is sharp, direct optical-depth checks support the strong
attenuation and the component display arithmetic replays within 1.01e-7.

Aerosols strengthen the effect, while molecular-only transport still produces
substantial haze. No profile or algorithm is promoted. The [results](results.md)
own numerical tables, appearance links, uncertainty, limits and measured costs.
The [execution log](execution-log.md) owns consequential choices and recovery.
No numerical work remains running. Next action is owner review of the report;
new profile selection or production changes would be separately authorized work.

## Latest verification

- Accepted final proof: `tmp/experiments/elevated-horizon-validation/runs/00020-final-verify/`.
- Authenticated: 4402 artifacts and 79 successful external scientific cases.
- Actual production GPU readback/scene/depth: run 00008.
- Final matched baseline report: run 00019; aerosol mechanism report: run 00018.
- Source type checking, solver input matching, geometry, package identity,
  finite-path transmission and color-composition checks pass.
- All earlier accepted and failed runs are preserved; incomplete report 00012 is
  not accepted or consumed. No dedicated standards reviewers/audits ran.
- Checkpoint-advisor monitoring remains active. No standards-compliance or new
  B1 score is claimed. All owned app browsers/servers have closed.

## Milestone dispositions

M1 complete: qualified elevated spherical reference and independent ray-sign proof.
M2 complete: matched spectra/contrast and mandatory actual-app component checks.
M3 complete: evidence-earned loading controls; smaller loading/glow differences
are explicitly inconclusive at retained precision. No neutral-ground feedback,
order-by-order rebuild or vertical redistribution was earned.
M4 complete: synthesis and follow-on boundaries recorded. Other times/azimuths,
observed atmosphere validation and production promotion were not triggered.

## Setup verification

The initial setup-only run 00000-setup-checks passes scaffold, durable
normalization, folder mapping, ignored-output, initial ambient configuration and
format checks. It predates execution and remains preserved separately from the
accepted scientific evidence above. The existing experiment standards assignment
and checkpoint-advisor monitoring remain active; dedicated standards review and
independent compliance audits remain disabled.

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
10 km capture records and earlier solver methods are read-only inputs;
execution authenticated all reused scientific parent artifacts. Sky Accuracy Dials and ARM
Spectral Validation remain suspended; Sky Aerosol Properties remains ended.
No scientific run, accepted artifact or result from those lanes is modified.

## Blockers and remaining limits

No blocker to the completed comparison. Sampling intervals are empirical, N4 versus
all-orders is not isolated, and the actual green scene is not an exactly matched
spectral Lambertian surface. No validation of actual San Jose conditions, all
heights/times or cube lighting is claimed. The initial partial source-inventory
limitation and actual retained disk costs are explicit in the results.

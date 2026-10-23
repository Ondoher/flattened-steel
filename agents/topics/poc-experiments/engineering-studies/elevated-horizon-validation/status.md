# Elevated Horizon Validation Status

State: baseline and published-profile follow-on complete and verified on
2026-10-23. Owner-authorized higher-altitude numerical checks are complete and verified.
Production is unchanged. No closure, suspension or promotion is implied.

## Current outcome and next action

The [baseline results](results.md) establish independently low 10 km contrast with
Bruneton, a sharp actual depth silhouette, and matched GPU N4 brightness within
1.3%. The [published-profile results](alternate-profiles-results.md) own all new
candidate measurements and image links. Continental-clean improves the 5 m
horizon and retains a stronger concentrated solar aureole, but does not fix the
10 km horizon; its dusk brightness is an important tradeoff.

Final combined report 00046 has 309 comparison cases. Accepted proof 00047
validates 311 successful scientific cases including the pilot, 16,478 artifact
records, source types/syntax and physical/input/color contracts. Spectral and
layer refinements are separated; dark-ground 1% absolute precision remains
unproven. Conditional full app scenes were not triggered because current profile
configuration cannot faithfully represent the layered, height-dependent mixture.
The compatibility finding and unmeasured integration costs are in the report.

Latest evidence: [higher-altitude results](high-altitude-results.md). Current
Native48/Sun035 recurrence remains numerically stable at 30/40 km in the tested
noon anti-Sun rays. Q120 agrees with independent luminance within 0.5%; Q30 can
suppress very narrow horizon contrast. Neither solver predicts a crisp horizon.
Report 00058 authenticates 48 reference cases and 45 GPU wavelength builds; final
proof 00059 passes replay, source types/syntax and resource-release checks. No higher-altitude package or app scene is activated.
Next action: owner review. Production integration or another viewing condition
is separate work. Completed checkpoint unit:
`feat(experiment): qualify high-altitude horizon resolution` (exact identity in
local Git history and final handoff). The execution log owns
recovery/checkpoint identities.
M1 recovery checkpoint: fa042599. Final checkpoint unit:
`feat(experiment): evaluate published aerosol profiles`; exact identity is in local
Git history and the execution handoff.

## Published-profile planning and completion

The [follow-on results](alternate-profiles-results.md) own current milestone
findings and links. Runs 00022/00023 preserve failed connections and successful
acquisition; 00024 qualifies properties and 00025 is the accepted spherical pilot.
Downloaded optical data and source recipes remain independent of production.
Final proof 00047 passes. All existing completed/failed evidence is preserved.

The follow-on preserves the completed baseline plan/results. Initial candidates
are OPAC continental clean, maritime tropical and maritime clean, with documented
50% RH scenarios and conditional 80% RH sensitivities. Their actual optical loading must be
measured before claiming that a profile is lower aerosol than production.
The canonical sequence, sources, gates, estimates and adaptive ACTIVATE route
are in the [new plan](alternate-profiles-plan.md). One read-only create-plan agent
critique is complete. All five recommendations were incorporated:

1. Define signed contrast, candidate-minus-baseline gain, 95% difference intervals
   and the exact offset pairs eligible for follow-up.
2. Pin near-Sun sampling directions/footprints/source convention and converge the
   forward phase peak before claiming preserved solar glow.
3. Prefer complete externally defined scenarios; distinguish any published
   reconstruction from a newly assembled hybrid, which cannot satisfy this request.
4. Bound vertical-placement attribution: different mixtures change more than height
   distribution, even at similar AOD.
5. Publish the initial 50% RH comparisons before conditional 80% RH sensitivities.

No suggestions were rejected. Primary self-review checked the revised sequence;
no additional critique or standards review is enabled. Numerical work follows
the owner's execution authorization, with download failures logged and skipped.

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

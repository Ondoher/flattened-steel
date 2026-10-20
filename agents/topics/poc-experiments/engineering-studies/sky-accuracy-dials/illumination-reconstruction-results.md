# H134-H140: illumination reconstruction results

Status: active. This report records completed local and builder evidence;
continuous integration and transfer work remain active. The
[execution record](illumination-reconstruction-execution.md) owns decisions,
milestones and the live resumption boundary; the
[plan](illumination-reconstruction-plan.md) owns the scientific gates.

## Completed local development evidence

All comparisons below use the same 36 exposed physical fields (six geometries,
two profiles, three bands) and seed684729181. The metric is the outgoing-Mie-
weighted absolute incoming-origin reconstruction budget A_origins, normalized
to matched local J2/reference floors. This is not observer radiance or paper RMSE.

| Method | Incoming nodes | Paper error reduction | Toronto error reduction |
| --- | ---: | ---: | ---: |
| Phase-factored polar cubic, active-profile raw-curvature rings | 4864 | 60.8% | 73.0% |
| Phase-factored polar and azimuth cubic, same rings | 4864 | 77.4% | 81.4% |
| Two-axis cubic, amplitude-curvature ring alternative | 4864 | 74.4% | 74.5% |
| Two-axis cubic, raw-curvature rings plus doubled azimuth samples | 9728 | 86.8% | 86.8% |

All component protections pass on this development panel. Selecting rings from
amplitude curvature is weaker than the raw-curvature control across both pools;
that allocation branch is rejected. Positive interpolation in azimuth and then
denser within-sector azimuth sampling each address additional measured error.
Every original physical node remains in the refined grid. Construction cost is
measured and reported, not used as an accuracy rejection gate.

[Native profile table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00659-h135-progress/summary.tsv)
and [native field table](../../../../../tmp/experiments/sky-accuracy-dials/runs/00659-h135-progress/fields.tsv)
preserve all measured cases, signed error estimates and uncertainty.

The first polar-only wave resolves two adverse total-error witnesses despite
its lower component error. The two-axis variant removes those resolved adverse
decisions, but uncertainty remains in other physical comparisons.

## Independent-stream confirmation

[Accepted00658](../../../../../tmp/experiments/sky-accuracy-dials/runs/00658-h135-confirm/summary.json)
uses 32768 new directions per field and a disjoint seed. The 4864-node method
reduces the reconstruction pool by **77.38% paper / 81.60% Toronto**; the 9728-node
method reduces it by **86.78% / 87.07%**. Every component protection passes.
Against the matched midpoint, all36 physical-total protections pass per method.
Against complete Sun4096, that initial wave passes33 and leaves three
inconclusive per method. Targeted precision00673 and the separately derived
[physical recovery00678](../../../../../tmp/experiments/sky-accuracy-dials/runs/00678-h135-phys-close/summary.json)
resolve every remaining protection: **36/36 pass for each method**. Earlier
decisions remain immutable. The recovery combines a converged model integral
with independently sampled model-minus-direct error, preserving common physical
reference covariance. All recovered comparisons overlap increased independent
path histories. These are finite empirical local-J2 protections, not certificates.

## Transfer evidence

[Accepted00670](../../../../../tmp/experiments/sky-accuracy-dials/runs/00670-h137-transfer/summary.json)
adds24 fields over four exposed geometries beyond the original six. The4864-node
method reduces the error pool69.0% paper /72.7% Toronto; the9728-node method
reduces it80.3% /83.2%. Every component and midpoint physical protection passes.
Complete-Sun physical checks are running; paper/node-90/red is borderline for
the denser variant despite its smaller component errors. It is inconclusive,
not silently passed. The smaller grid passes that case.

[Accepted00674](../../../../../tmp/experiments/sky-accuracy-dials/runs/00674-h137-repeat/summary.json)
rebuilds every original/additional direction under an independent construction
at the exposed near-Sun witness. Both profiles pass their gain, component and
midpoint physical checks. No old light was copied into changed directions by index.

## Builder evidence

Actual native-input, complete15-band local-J2 rows are accepted for
[paper00667](../../../../../tmp/experiments/sky-accuracy-dials/runs/00667-h136-native-row/summary.json)
and [Toronto00669](../../../../../tmp/experiments/sky-accuracy-dials/runs/00669-h136-native-row/summary.json),
each covering4374 outgoing directions. Selected hardware-GPU/double-precision
finite-sum comparisons pass. These are scattering-density rows, not observer
spectra or sky colors. Their angular sum is not yet independently qualified as
the continuous integral.

Unpartitioned integration probes00660/00661/00666 show that nearly correct phase
mass can coexist with unresolved illumination-integral error. The analytic
phase-moment controls00664 pass; the control-variate trial00665 does not establish
an improvement. Boundary-partitioned integration00668 is active: the paper
near-Sun red witness changes by less than2e-8 of reference between its last two
levels. Completed00671 resolves the paper opposite-Sun bands;00676 checks
actual native-input red fields with last-level changes around1e-7. The actual
streamed GPU source operation passes selected same-function comparisons in00682
after fixing final partial-upload padding; failed00681 remains preserved. The
earlier8192 finite row sum remains unqualified for continuous accuracy.

A shared spherical-harmonic phase convolution passes manufactured controls00684
and selected whole-outgoing GPU parity00689 (4374 directions, one band). It
does not yet qualify as a complete spectral operator: Toronto degree64/128
residuals remain around2.8e-4 of reference, with opposite signs, while projection
refinement changes only2.6e-7 in00690. Further degree convergence is required.
Runs00685/00686 retain post-verifier heartbeat failures; their numerical data
are not relabeled fully verified. Worker orchestration repair00687 and exact
paper replay00688 preserve their numerical work with an independently verified
monitoring route. Higher-order manufactures00683 are not actual recurrence.

[Frame-contract proof00679](../../../../../tmp/experiments/sky-accuracy-dials/runs/00679-h136-frame-proof/summary.json)
confirms the original native controls use receiver-local cube vectors. Extra
rotated-direction run00677 is a diagnostic, not a correction to that layout.
Its initial recipe interpretation is explicitly superseded by this contract proof.

## Scope and next evidence

This is spherical distant-Sun, black-boundary L1-to-local-pure-J2. Toronto is
the registered optical profile, not a reconstruction of Toronto weather. All
eight H97 reserved physical tuples remain unexposed. No later-order, reflective-
ground, twilight, observer-color or B1 result is claimed. No physical sky image
is derived from the three diagnostic bands.

H134's reconstruction replay and exact retained B1 arithmetic pass in accepted00653.
H135's completed development runs00654-00657 and native report00659 are immutable.
Confirmation00658 is accepted. Finite-sum builder parity passes; continuous
operator qualification remains active. Production is unchanged; no standards reviewers/audits
are enabled for this contained experiment.

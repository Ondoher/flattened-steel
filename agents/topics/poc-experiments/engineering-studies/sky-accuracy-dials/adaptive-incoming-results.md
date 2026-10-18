# H69-H70 adaptive incoming-grid results

Status: completed through the planned H70 early rejection. All3 registered
methods were evaluated in paper and Toronto material, including the fine-count
rescue. None advances. Accepted00454 owns264 numerical cases;00455 owns the
full replay, rejection decisions and images;00456 independently qualifies
profile/kernel/reference identities. Production and earlier runs are unchanged.
The [plan](adaptive-incoming-plan.md) and
[execution summary](adaptive-incoming-execution.md) own scope and decisions.

## Main result

At the finest registered standalone budget, mean/worst absolute relative local
J2 errors against matched independent estimates are:

| Method | Budget | Paper mean / worst | Toronto mean / worst |
| --- | ---: | ---: | ---: |
|H68 Sun-focused control|1024|0.87% /1.75%|1.37% /3.78%|
|H68 Sun/horizon control|1024|0.94% /1.54%|1.05% /4.13%|
|A fixed base/Sun/horizon|1024|1.00% /1.67%|6.18% /25.00%|
|B geometry-driven allocation|1024|0.96% /1.75%|4.53% /12.61%|
|C response-driven allocation|1024 charged|1.14% /2.66%|3.62% /13.92%|

C's1024 budget is352 pilot directions plus672 fresh production directions per
pilot band/location. The pilot is charged, not mixed into the scored integral.
Validation or full-build amortization savings are not claimed.

Paper fine-count differences are mostly below the independent reference's
precision. Toronto's worst-case regressions are much larger than that uncertainty
and remain resolved using conservative reference-sensitivity envelopes. The
joint no-regression rule rejects all configurations. No gain in the paper
profile can hide a Toronto regression, and no pooled profile score is used.

The cheap configurations also fail to earn advancement:

| Method | Budget | Paper mean / worst | Toronto mean / worst |
| --- | ---: | ---: | ---: |
|Sun-focused control|256|0.75% /2.28%|4.27% /18.56%|
|A fixed layering|256|2.90% /11.04%|46.17% /187.57%|
|B geometry allocation|256|3.51% /13.69%|51.53% /201.37%|
|C response allocation|512 charged|5.12% /12.06%|16.82% /38.45%|

The finer A/B/C comparisons were performed despite coarse failure. This is a
rejection of these frozen constructions and allocation heuristic, not a proof
that every layered/adaptive grid fails. In particular, the candidates use
midpoint-latitude nodes while the retained H68 controls use their original
placement; the comparison is between complete designs, not a clean attribution
of all differences solely to sample allocation.

## Images and evidence

- [Two-atmosphere case comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00455-h70-final-report/comparison.png)
- [Mean/worst errors and charged work](../../../../../tmp/experiments/sky-accuracy-dials/runs/00455-h70-final-report/errors.png)
- [Base, Sun and horizon node placement](../../../../../tmp/experiments/sky-accuracy-dials/runs/00452-h69-registration/geometry.png)
- [All cases, sensitivity envelopes and decisions](../../../../../tmp/experiments/sky-accuracy-dials/runs/00455-h70-final-report/analysis.json)
- [Summary TSV](../../../../../tmp/experiments/sky-accuracy-dials/runs/00455-h70-final-report/summary.tsv)
- [Final post-seal qualification](../../../../../tmp/experiments/sky-accuracy-dials/runs/00456-h70-qualify/qualification.json)

All3 images were inspected. The heatmap shows local source-density ratios at
469.7/532.3/626.3nm, not sky swatches or full-scene appearance. The aggregate
figure's `qualified` label means numerical/grid/reference controls pass;
it does not mean the candidate passed the scientific advancement gate.

The largest Toronto red witness at the sunlit89.5degree ground node gives
J2/reference ratios2.876/3.014 at coarse A/B,1.250/1.125 at fine A/B, and0.861
for fine C. The Sun1024 control is1.038. Fine C has moved to an undershoot;
reducing an excess is not sufficient if the resulting absolute error is larger.

The patterns are consistent with spending too little of a fixed budget on the
narrow, direction-dependent Toronto integrand, while the smoother paper phase
is less sensitive. That is an interpretation, not an isolated proof of which
component allocation or node placement is responsible. No threshold/width was
tuned after these results to rescue a method.

## Scope and numerical qualification

The4 physical H67 locations and3 bands were used in both profiles. Paper uses
the exact H55 atmosphere coefficients, scale heights, analytic phase and.8SSA;
Toronto retains its measured phase/SSA and loading. Local source/geometry and
native15 spectral sampling remain fixed across the atmospheric contrast. These
are isolated atmospheric J2 integrals with H67/H68's black boundary. They do
not qualify B1 grass reflection or replace a40-wavelength full paper benchmark.

New paper references use the unchanged validated full cache-free path kernel,
retaining its local N2 prefix only for this comparison.3840 microbatches produce
12 qualified paper means; empirical95% half-widths span1.20-2.59%. The paired
64/128 optical control changes the paper references by at most5.70e-7 relative.
The12 Toronto references are reused exactly from H67. They are not substitutes
for the paper references. Reference intervals are empirical sampling estimates,
not formal bounds on every shared physical or numerical assumption.

Every one of264 case geometries and raw/normalized scattering reductions is
replayed. The8 C pilot choices are regenerated from their3-band residuals,
without consulting external references. All historical control replays are
exact: maximum relative residual0. Largest64/128 view-integration change is
0.01505%; no256 refinement is triggered. All rendering is hardware-backed.

H69's96 A/B manufactured regime/count rows pass the2% area/first-moment screen;
all32 A/B1024 rows pass.5%. One C512 geometry, Toronto view-0, has a2.0594%
first moment, exceeding the2% gate in all3 band records. Those atmospheric
evaluations were already performed before this gate was assessed. Retain them
as unqualified negative diagnostics; this does not satisfy the planned prelaunch
gate. Every fine-count candidate passes the local grid gate and independently
fails the accuracy gate, so the early rejection does not rely on those3 rows.

No C repeat-placement validation, held-out atmospheric campaign, native
row-dependent boundary implementation/proof, N4 cache rebuild, full B1 score or
new scene render is claimed. These conditional stages were not reached because
all fine-count candidates already have resolved Toronto regressions. The
existing H68 Sun-focused result remains the stronger local control; this work
does not promote it or automatically select another campaign.

## Execution and resource qualifications

Failed00453 preserves the initial shortened reference shader's context loss
before usable samples.00454 uses the unchanged full kernel successfully; the
precise context-loss cause is not established. No unchanged failed shader was
repeated and no prior evidence was modified.

The first post-seal report comparison rejected omitted JSON `undefined` fields
in the regenerated object. The read-only verifier now compares exact JSON-
representable analysis; every arithmetic reduction remains exact and no numerical
result or tolerance changed.00455 additionally derives sensitivity bounds with
the variable reference in both numerator and denominator.00454's central-reference
denominator bounds stay immutable. Nominal errors are identical and all rejection
decisions remain resolved. These envelopes are not simultaneous95% coverage.

The successful numerical campaign took187.372seconds from allocation to terminal
event. Measured new case work totals101.195seconds, pilots10.632seconds, and paper
reference GPU stages43.056seconds. These include their recorded setup/readback
costs, not a complete production cache build.242784 new incident evaluations
were performed;63072 control evaluations were reused. Paper Monte Carlo histories
are separate from those direction counts. Authoring, verification, plotting and
Git work are separate from numerical execution time.

Final scientific evidence after00456 is776671024bytes (740.691MiB), under the
owner-approved768MiB limit; scratch0. Local types, immutable-run checks and image
inspection pass. Dedicated experiment reviewers/audits were not run. The
checkpoint adviser provides semantic checkpoint advice only.

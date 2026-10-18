# H75-H82 geometry-driven incoming-grid refinement

Status: completed with a negative candidate disposition. H75-H79 and H82 are
complete; no candidate qualified to trigger H80/H81. The
[results](geometry-incoming-results.md) own the scientific disposition. The
[execution record](geometry-incoming-execution.md) owns completed work, verification and decisions.
The owner requested improvements to option B and
explicit room to investigate promising alternatives after the initial hypotheses
are exhausted. This is a new follow-on within `sky-accuracy-dials`; it does not
reopen completed H69/H70 runs or automatically resume their conditional H71-H74.
The owner has selected execution. Production remains unchanged.

The owner-requested secondary critique is incorporated: distinct development
geometry, paired-reference comparisons, actual Toronto phase-mass/component
diagnostics, mandatory repeat placements, early builder-cost feasibility and
evidence requirements for renewing exploration leads.

## Aim and evidence

Find a geometry-driven incoming integration rule that retains H68's concentrated
Sun sampling while improving useful coverage near the ground horizon, at a
defensible cost. The [adaptive-grid results](adaptive-incoming-results.md) own
the previous rejection: fine B gives Toronto mean/worst4.53%/12.61% versus
Sun 1024's1.37%/3.78%. Paper fine differences are much smaller and mostly below
reference precision. Redistributing counts, node placement and horizon width
have not yet been independently attributed.

The first tests distinguish those mechanisms. The exploration phase then
follows evidence rather than ending merely because a list of variants is empty.
Reject configurations promptly; do not infer that every geometry-driven method
fails from one allocation or placement failure.

## Fixed comparison contract

- Test exact paper atmosphere and retained Toronto material separately at the
  same physical targets and spectral bands. Freeze complete profile requests,
  source/geometry, loading, phase/SSA and compatibility hashes. Never pool
  profile scores or let a gain in one hide a resolved regression in the other.
- Start with H67/H70's4 physical locations and 3 bands, including the red sunlit
  ground and near-ground view witnesses. Reuse authenticated H70 paper and H67
  Toronto references. These observed targets are a development set, not held-out
  validation. Local continuous-L1 probes retain the declared atmospheric-only
  black boundary; full paper validation must restore the exact B1 grass physics.
- Keep corrected60 transport, current phase-mass normalization and outgoing
  representation fixed within every contrast. Report raw angular sums and
  Rayleigh/Mie contributions alongside normalized J2. No exposure, atmosphere,
  normalization or outgoing-grid tuning to rescue incoming-grid scores.
- Treat Sun-only, Sun/horizon and candidate grids as complete measured controls.
  Match node generator, physical frame and charged evaluation budget when
  isolating a mechanism. Never construct an artificial comparator by combining
  different rules' best statistics. Retain the historical H68 controls as well.
- Combine proposals using their correct normalized densities, rotation
  Jacobians and overlap-aware balance weights. Preserve whole-sphere support.
  Extra samples change the combined weights; adding a layer does not preserve
  the old integral unchanged or guarantee improvement.
- Area, first moments, positivity, inverse/Jacobian and mixture proofs run
  **before atmospheric evaluation of each actual generated grid**, including
  new widths and allocations. Keep H69's2% local and.5% fine-finalist moment/
  area screens initially. A failed grid gets only mathematical diagnostics until
  repaired; avoid repeating H70's late C512 gate assessment. Never renormalize
  manufactured errors away.

### Development geometry distinct from fresh validation

The4 existing near-ground dusk targets cannot identify daytime allocation or an
altitude taper. Freeze this additional6-target development panel before scoring:

| Altitude above ground | Solar-center elevation above local horizontal |
| ---: | ---: |
|250m|30degrees|
|250m|+0.25degrees|
|2500m|30degrees|
|2500m|+0.25degrees|
|12000m|30degrees|
|12000m|-0.75degrees|

These are synthetic spherical geometry probes, not claimed San Jose observation
instants. Register exact world positions, Sun vectors and outgoing directions
before computing radiance. Use near-horizontal and side/away outgoing coverage
across the panel. The same panel applies to both atmospheres at all 3 bands.
It adds18 spectral cases per profile to the 12 existing development cases.

H75 may start with the existing targets; H76's geometry-versus-fixed attribution
must include this development panel. Acquire new matched independent references
only when that stage needs them. Freeze H80's reserved inputs at the same time
and verify that none of these development position/direction/material tuples
duplicates a reserved case. Do not move a useful validation case into development
after looking at its radiance and still describe it as held out.

Check allocation rounding and smooth transitions with inexpensive manufactured
probes immediately around500m/5000m and the 8degree source-horizon transition.
Add a small paired atmospheric boundary contrast only where those checks or
development residuals suggest a discontinuity. Compare geometry B with the
fixed-allocation control over this panel, not just at its near-ground dusk limit.

### Actual phase-mass and component ledger

Before atmospheric evaluation, compute each actual grid's phase-mass denominator
for every outgoing development witness and both materials. Obtain the reference
mass independently from the exact piecewise-linear Toronto table integral in
cosine, including the 2*pi convention; retain the table identity and verify its
normalization. The full-sphere mass is independent of outgoing orientation,
but the grid's approximation is not. Check the analytic paper phase separately.
Isotropic area and first moments alone do not qualify a sharp Toronto phase lobe.

For every atmospheric result retain the raw Rayleigh/Mie numerator, sampled
phase denominator, normalized aerosol contribution and signed species residuals
where component references are available. Plot numerator and denominator changes
separately at decisive witnesses. On any witness deciding advancement or an
apparent normalization-driven gain, independently qualify species integrals
where feasible using phase-aware integration with its own refinement/placement
controls, or retained species-resolved path tallies of matching order/units.
The candidate's finest grid is not that component reference.

Distinguish improved numerator accuracy, improved phase-mass accuracy and
opposing Rayleigh/Mie or numerator/denominator errors. A small total residual
alone cannot establish mathematical improvement of each component. Report
remaining cancellation explicitly; do not silently change normalization during
an allocation/placement contrast. A proposed operator correction needs its own
registered H79 contrast and both-profile evaluation.

## Initial controlled tests

### H75: isolate node placement

Perform a small native-builder feasibility audit before extensive local search,
without implementing the full adaptive compiler. Register how per-location
directions/weights would be shared by L transport and J integration, and how
ground/support rows would preserve physical direction. Estimate stored direction
records, intermediate L fields, padding/buckets, boundary evaluations and peak
live storage at 1024/1408/2048/4096. Use actual native dimensions and supported GPU
limits rather than a direction-count-only estimate. Record which costs are
measured, derived or unknown; a bounded synthetic probe may resolve a decisive
unknown. Update the estimate if a new exploration family changes the contract.

An impractical family may still receive one cheap mechanism diagnostic, but
cannot earn extensive refinement or full-build advancement without a feasible
implementation route. A numerical winner is not automatically an economical
builder. Include measured path-transport work, GPU/host timing and preparation/
boundary overhead in error/cost comparisons, not just node count.

Compare at 256 and 1024 total directions:

1. Original H68 Sun-only nodes versus midpoint-latitude Sun-only nodes, with
   identical Sun map k=.35 and corresponding correct integration weights.
2. B's existing allocation under original endpoint placement versus midpoint
   placement, with identical geometry, counts, widths and proposal mixture.

Keep azimuth origin and reflection convention fixed where the contrast permits.
If an original-placement layered rule fails the manufactured screen, report its
placement defect without qualifying atmospheric scores from that level. Do not
silently substitute another placement in the same contrast.

Freeze the retained placement for the next test using both profiles and complete
mean/worst/cost results. If placement changes the apparent winner, repeat only
the minimum necessary next allocation contrast with both placements. Do not
attribute an allocation benefit to a placement change. Retain unresolved ties;
prefer simpler, better-controlled sampling rather than the best noisy score.

Register at least2 equal-cost azimuth offsets or symmetry-preserving scrambles
before scoring. Apply paired placements to candidates and controls. Initial
screens may use the primary placement; every prospective finalist must repeat
on the second placement before exposing fresh validation. Apply manufactured
and actual phase-mass checks to both. For additive grids, preserve the matching
Sun-control positions within each placement contrast.

The advancement conclusion must survive both placements without a new resolved
protected-case regression. Do not select the lucky offset after scoring or
average away a placement failure. If an ensemble is proposed as the actual rule,
register its complete direction/evaluation cost and test it as a new H79 variant.

Output: node diagrams, manufactured residuals and per-profile signed spectral
error/ratio panels, with the red witnesses visible individually.

### H76: preserve a larger Sun share at fixed total count

Test a geometry-driven Sun-heavy B with these initial256-direction allocations:

| Regime | Base | Sun | Horizon |
| --- | ---: | ---: | ---: |
|Near-ground daytime|32|192|32|
|Near-ground dusk|32|160|64|
|Higher atmosphere|64|176|16|

Scale to 1024. Initially retain B's smooth .5-5km altitude transition and dusk
weight that tapers from the physical source center on the ground horizon to
zero at 8degrees separation. Keep k=.35 and horizon width .1. Preserve paired
counts with recorded deterministic rounding.

Add a fixed32/160/64 allocation, scaled identically, as the control separating
the new allocation from geometry-driven adaptation. Compare against old B and
Sun-only using H75's controlled placement. This first trial changes Sun share,
not concentration width or total work. A further allocation such as32/128/96
belongs to the registered exploration phase if the observed response supports it.

Reject a coarse configuration that is clearly dominated, but give a mathematically
qualified family one1024 rescue before rejecting its initial allocation hypothesis.
Output: allocation-versus-error plots, mean/worst tables and actual charged cost.

### H77: add horizon coverage without removing successful Sun nodes

Preserve the exact physical directions of the strongest1024-node Sun-only control;
add128 base and 256 horizon directions, total 1408. Initially retain the .1 horizon
width and the selected placement for the added components. Recompute all balance
weights correctly. Compare with both:

- the unchanged1024-node Sun-only control, to expose the added cost;
- a1408-node Sun-only control with the same generator, to distinguish coverage
  from simply increasing count.

The additive grid's inherited Sun positions are fixed; its weights are not.
If the extra layers do not improve accuracy/cost relative to simply increasing
Sun-only count, do not expand this additive construction into a full cache.
Record useful per-case improvements as possible exploration leads even if its
joint aggregate gate fails.

### H78: make the horizon band more selective

With the most informative H76 or H77 allocation, compare radial-cosine horizon
width .1 against .03. Width is in cosine coordinates, not degrees; plot the
actual angular density at each altitude. Center it on the physical depressed
ground horizon. Keep the Sun map, node generator, allocations and total count
unchanged in each contrast.

Use .01 only when .03 yields a useful trend or a directional residual points to
an unresolved narrower band. Test both profiles and inspect directions outside
the band, including the shadowed ground case. Do not turn narrower sampling into
a hard angular cutoff or remove broad support. A gain on the lowest red ray
alone does not qualify the band.

If earlier allocations are all poor, run one bounded width diagnostic on the
best-understood B configuration before rejecting the width hypothesis. It can
identify a new lead without earning expensive recurrence work.

## H79: evidence-driven exploration, not list exhaustion

After each initial contrast, and whenever the initial list is exhausted, review
the residuals, contribution-versus-direction plots, area/moment checks, placement
sensitivity and measured cost. Maintain a short lead register: unique lead id,
observation/evidence-run identities, proposed mechanism, distinct quantitative
or directional prediction, smallest discriminating next test, and outcome.
Select the next test from this evidence.

Promising alternatives within this plan can include:

- a narrower or stronger Sun map with broad background support retained;
- another base/Sun/horizon allocation suggested by the observed tradeoff;
- a different altitude taper or source-horizon transition, tested across its
  boundaries rather than fitted only to the four development locations;
- a modest azimuth shift, improved equal-area placement or stratification when
  residuals reveal placement sensitivity rather than insufficient count;
- total-count refinement, initially1024 to 2048, preferentially in difficult
  near-ground/source-horizon geometry. Compare the same counts with Sun-only;
- a diagnostic sampling distribution informed by the product of incident light
  and scattering phase, if existing proposals miss an important lobe. If it
  depends on outgoing direction, first measure the loss of incoming-evaluation
  reuse; do not silently turn it into a cheap shared-grid candidate.

These examples are permitted directions, not a requirement to run every one.
Fresh alternatives are allowed when the observations justify them. Initially
keep no more than 3 active branches and design waves of at most3 new variants.
Before each wave, write its exact parameters, motivating evidence, predicted
effect, falsification condition, both-profile controls and estimated resource
cost into a new immutable registration. Do not edit old registrations or tune
against results while labeling the same run as preregistered validation.

### Exploration continuation versus full qualification

A variant earns another **cheap development test** when at least one of these
conditions holds without a new resolved material regression elsewhere:

1. It resolves a placement, quadrature-measure or support defect and produces
   a repeatable improvement against the predecessor it was intended to fix.
2. Mean or worst error improves by about 20% against that predecessor in a
   profile, with the other statistic protected. The predecessor need not yet
   be the best H68 control; a clear path toward it is a legitimate lead.
3. Comparable accuracy is achieved with materially fewer evaluations, or a
   targeted count refinement shows a repeatable error reduction worth bracketing.
4. A directional/component residual reveals a concrete missing mechanism and
   one small contrast can distinguish it, even when nominal gains are currently
   below reference precision.

These are exploration permissions, not adoption claims. Use paired-reference
uncertainty below and mandatory repeat placements before finalist selection.
A single apparently lucky low error, improvement
in one band offset by a new failure elsewhere, or a fitted display exposure is
not positive progress. An identified correction can merit a diagnostic contrast
despite a temporary regression; register that exception and compare the complete
balance rather than silently advancing a regressing configuration.

Do not stop just because H75-H78 or one exploration wave has run out of named
hypotheses. Continue while there is measurable positive progress or a concrete,
discriminating new lead. At each wave, record whether another wave is justified.
Use60 minutes as a progress review, not a hard stop; continue monitoring when
progress is strong. Avoid an unattended parameter sweep.

End unproductive exploration after two consecutive waves yield neither a
repeatable improvement nor a credible new mechanism with a discriminating test.
Reset that unproductive-wave counter only for new recorded evidence supporting
a distinct prediction. Renaming a lead, recycling an unresolved tweak or changing
one parameter without a new mechanism does not reset it. A measured sign change
that justifies bracketing a parameter can be new evidence; record that contrast
and its predicted outcome explicitly.
Also stop a branch when a cheaper complete control dominates it, a numerical
contract cannot be qualified, or available references cannot resolve the claimed
benefit at a defensible cost. Exhausted compute alone is not scientific rejection;
preserve an explicit resumable resource dependency if one genuinely remains.

## H80: fresh validation and independent accuracy decision

Before any development scoring, freeze a separate validation set: the 8 unused
H69 geometry targets covering exact noon, sunset minus10 minutes, sunset
plus 30 minutes and elevated sunset, plus one outgoing holdout at each original
development location. Record exact source instants/vectors, altitudes and
material identities; verify that all intended altitude and shadow regimes are
covered. Reserve them from allocation/width tuning. Include inexpensive
sunset-plus 60minute witnesses before full builds.

Select at most2 nondominated finalists from development; freeze their entire
algorithm before evaluating these cases in both profiles. If validation fails,
reject that finalist. Exploration may continue, but those exposed validation
cases are now development evidence. Register a genuinely new validation set
before testing another revised finalist; never reuse an exposed set as unseen.

Use local matched independent references, per-profile radiance floors and the
paired-reference procedure below, with the variable reference in numerator and
denominator. Show absolute errors for dark cases. A finer candidate grid is a
convergence control, not an independent oracle. Reuse qualified references
without recalculation when compatibility identities match.

### Paired-reference comparison and attainable precision

Candidate and control predictions are fixed numbers when compared against one
uncertain physical reference. For each case use the **same variable reference**
in both errors:

```text
eCandidate(r) = abs(candidate - r) / max(r, registeredFloor)
eControl(r)   = abs(control   - r) / max(r, registeredFloor)
```

Evaluate decision margins jointly, such as candidate mean error minus0.8times
control mean error for the 20% improvement route. Do not subtract independently
chosen worst candidate/control envelopes and treat that avoidable pessimism as
proof that improvement cannot be resolved. For mean comparisons, joint extrema
can be bounded case by case over the same reference interval. Worst-error
comparisons require a coupled treatment of the shared vector of references;
separately optimizing two maxima is not a paired result.

Register an inexpensive paired batch analysis before scoring finalists. A
practical option is 2000 bootstrap replicates of retained independent-reference
batches: form one reference vector per replicate, apply it to both predictions,
and recompute mean, worst and threshold margins together. Preserve aligned batch
covariance across quantities/cases where the reference sampling shares histories;
resample independent groups separately where it does not. Keep the method,
seed, resampling unit and empirical decision interval fixed. Label these as
empirical uncertainty estimates, not formal or simultaneous95% guarantees.
The analysis must not invent covariance absent from retained evidence. A claimed
improvement requires the chosen procedure's upper bound on its threshold margin
to be at or below zero; register analogous paired margins for non-regression
and lower-cost equivalence before scoring.

Use the coupled interval envelope as a conservative check and paired batch
analysis when its sampling assumptions qualify. Report any differing disposition
explicitly; do not choose whichever method makes a candidate win. Freeze which
qualified procedure decides each threshold before candidate selection. Report
development comparisons as exploratory, and use the frozen finalists and fresh
cases for qualification; uncorrected comparisons across many tuned variants do
not establish a global confidence claim.

Before adding reference histories, estimate whether the expected precision can
resolve the actual candidate/control margin and freeze a target margin/interval
width. If the available cost cannot resolve it, retain the explicit disposition
`reference-limited/inconclusive`. A genuine gain may justify a further cheap
mechanism test without earning full-build qualification. Never silently relax
the error target or count additional histories as candidate evaluation savings.

Spend additional reference effort only when it can change a live decision.
For development, permit up to 4 decision-critical case refinements per profile
per wave, with seeds/history counts and attainable precision registered first.
If improvement is too small to resolve economically, report that limit and
prefer the simpler complete control. An independently formulated deterministic
integral may be qualified against the path estimator and its own coordinate/
quadrature controls; it must not be the candidate's own finest grid relabeled
as independent truth. No local-J2/libRadtran observer-radiance unit mismatch.

Full-build advancement requires a resolved gain against a competitive complete
Sun-only/Sun-horizon control, not merely recovery relative to rejected B:

- at matched actual evaluation cost, at least20% lower mean or worst error with
  no resolved material regression in the other statistic or protected cases; or
- at least25% fewer evaluations with mean/worst accuracy comparable within
  qualified uncertainty and a10% relative error-statistic margin.

Apply this separately in each profile: a resolved benefit in one and no
resolved material regression in the other are required. Initially use the
previous definition of material error regression: increase greater than both
20% relative and 2percentage points, assessed with uncertainty. A pooled score
cannot override either profile. Check the full control frontier for domination.
Reference-limited differences are inconclusive, not a claimed win.

## H81: native recurrence, paper RMSE and scenes for survivors

Only qualified finalists reach this stage. Carry forward the
[adaptive plan's native contract](adaptive-incoming-plan.md#builder-contract-for-location-dependent-grids):
one per-location direction/weight identity shared by L transport and J
integration; explicit active counts/padding or buckets; no unlike-index
cross-row or ground-boundary interpolation. Prove manufactured physical-direction
and ground-boundary consistency before microbuilds. Record padding, boundary
evaluation and intermediate-storage costs.

At each fixed grid, compare native analytic incoming-path L1 with accurate
continuous L1. Do not invent a reconstructable L1 field from retained F68 samples.
Then rebuild actual J2/J3/J4 and separately diagnose L2-from-J2 and L3-from-J3
reconstruction. Keep the chosen geometry rule shared across outgoing probes,
wavelengths and orders initially. Any outgoing-dependent alternative needs an
explicitly costed contract before it can be a finalist.

Start with both-profile3-band microbuilds, then selected15-band rays if benefits
survive recurrence. Preserve pure and cumulative orders with independent N1/N4
or all-order references labeled correctly. A local J2 improvement does not
qualify final N4 radiance. Reject resolved native/recurrence regressions promptly;
an identified new mechanism may feed H79 for another registered development wave.

For a joint survivor, use exact paper B1 material/ground/source, all 40 wavelengths,
all 17 intervals and 81 dome samples. Score the registered31-band RMSE convention
and use all 40 bands for paper colors. Match or improve both retained H61
Focused60 and H55 Original40 aggregates at full scoring precision; publish every
interval change and the dome comparison. Toronto retains its own matched
independent scores; never score Toronto material against paper targets as a
matched benchmark. Start with one full candidate; a second is allowed only if
its already demonstrated mechanism justifies the expense. Do not tune against
B1 while still calling it independent qualification.

Finally render matched paper/Toronto scenes at noon, sunset and plus 30/60 minutes,
with common display context and correct material labels. Apply the
[existing twilight disposition](adaptive-incoming-plan.md#twilight-acceptance-and-justified-changes):
material luminance/shape changes require qualified physical support or an
explicit owner visual decision, not silent acceptance or automatic rejection
against production as an oracle. Build all reviewable images before requesting
an owner decision. No production promotion is part of this plan.

## H82: progress, completion and resource management

Produce useful reviewable figures after placement attribution, the first
allocation/additive comparisons, and each exploration wave with a material new
finding. Use node plots, directional contribution/residual plots and both-profile
error/cost tables early. Three bands are numerical diagnostics, not full-color
sky swatches. Use15-band swatches/spectra at recurrence milestones, then full
scene comparisons for finalists. Do not generate an image per batch.

GPU is preferred for incident radiance, independent probes, microbuilds and
renders. One owned GPU job runs at a time; use bounded draws and stream channels.
Reuse retained payloads and compact derivation recipes. CPU handles inexpensive
analytic proofs/reduction and verification. Use the validated full reference
kernel unless a new estimator is explicitly qualified; preserve usable work
and diagnose failures before retrying, rather than repeating unchanged faults.

Initial total-count exploration ceiling is 4096 directions per location, allowing
1024/1408/2048 comparisons and a4096 discriminating rescue when justified. Counts
beyond that need an explicit recorded benefit/cost rationale before execution;
do not spend simply because a larger count is available. Review cost and projected
time after each wave, including failed attempts, reference work and validation.

Current approved retained allowance is 768 MiB; H70 ended at 740.691 MiB. Measure
actual use before execution and estimate each phase with sealing reserve. Keep
the existing1 GiB live scratch and free-disk rules. The owner's AFK instruction
permits justified space-budget decisions needed to proceed: record the measured
need and amend the retained allowance rather than repeatedly asking. This does
not authorize altering/deleting old evidence, uncontrolled memory use, production
writes or unrelated work. Clean only owned reproducible scratch after its
dependent evidence is secured. Runtime lookup/final storage stay separate from
measured builder and intermediate-storage costs.

Keep monitorable progress/heartbeats under the existing immutable-run contract.
Record every decision, exploration-wave registration, failed prediction, next
lead and remaining uncertainty. Runs and parents stay immutable; regenerate
only affected work into new runs. New reference or validation families must
retain their complete material/geometry/order/units/derivation identities.

Source remains under `experiments/sky-accuracy-dials/`, generated output under
`tmp/experiments/sky-accuracy-dials/`, and owning documentation here. No native
helpers, experiment unit-test tree or new test framework. Run required local
types after code changes; self-review and proof verification remain mandatory.
No dedicated standards reviewers/audits; checkpoint-adviser monitoring remains.

Complete with either a qualified candidate and its limits, an evidence-backed
negative result after unproductive leads have been exhausted, or a specific
external dependency with all unaffected work complete. Merely reaching the end
of H75-H78 is not a completion condition. Preserve a concise execution summary,
images, cost/accuracy frontier, complete decisions and local checkpoint. The
experiment remains open unless the owner separately ends or suspends it.

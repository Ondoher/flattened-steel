# H69-H74 adaptive incoming-grid comparison

Status: completed at the planned H70 early rejection. All3 methods and both
profiles were screened with fine-count rescue; none advances. The
[results](adaptive-incoming-results.md) own264 cases and accepted00455/00456.
H71-H74 are untriggered conditional work, not pending execution obligations.
The [execution record](adaptive-incoming-execution.md) owns decisions and timing.
The owner requested a plan for all three layered
incoming-grid designs, with early rejection when improvement is absent. This
document authorizes no execution by itself. H68 is complete; its
[results](incoming-sun-results.md) and immutable00449/00450 remain unchanged.

Revised after the owner-requested secondary-agent critique: native L1 evaluation
is distinguished from later-order cache reconstruction; C uses a fresh
production rule after its pilot; row-dependent direction identities, fair
comparators, uncertainty, fine-grid rescue and twilight acceptance are explicit.

## Question and scope

Can a whole-sphere base, a rotating Sun layer and a ground-horizon layer improve
incoming angular integration at lower cost than H68's focused rules, without
creating new recurrence errors or sacrificing paper RMSE and twilight behavior?

The first objective is accurate incoming integration, not a predetermined sky
color. All three methods get a local trial. Expensive recurrence and paper work
is conditional on measured benefit. Failure is a valid completed experiment
outcome; no requirement exists to keep modifying a rejected method until it wins.

Keep production, outgoing-cache layout/interpolation, source spectrum,
path integration and scattering equations fixed. Within each registered
atmosphere, keep its physical material parameters fixed. Use the corrected60
transport and normalization as the common experimental operator. Report raw
angular sums separately. Do not combine this test with another aerosol, outgoing
grid, density reconstruction or color-model change. Initially use one incoming
policy across orders; per-order allocation is deferred.

## Required atmosphere matrix

Every atmospheric screening and recurrence stage tests both profiles, at the
same physical locations, instants, incoming budgets and outgoing probe vectors:

| Profile | Frozen material identity | Role |
| --- | --- | --- |
|Paper|Exact Bruneton/B1 atmosphere and optical parameters used by H55/H61|Local independent checks, regression protection and full B1 qualification|
|Toronto|Existing H63-H68 measured Toronto aerosol phase/SSA and their registered loading, vertical profiles and remaining material parameters|Local independent checks, regression protection and dusk/twilight qualification|

Authenticate both complete atmosphere requests in H69. Toronto is the retained
experimental material configuration, not a claim to reproduce Toronto weather.
Do not substitute its phase/SSA into an otherwise unspecified atmosphere, retune
loading to help a candidate, or assume the paper and Toronto material identities
are interchangeable. Preserve the source/geometry registration within each
paired candidate/control contrast.

The A/B allocation policy and parameters stay identical across profiles. C may
select different grids from each profile's own pilot radiance, using the exact
same frozen selection algorithm; charge both pilots. No profile-specific tuning
of allocation thresholds or normalization is allowed in this campaign.

Publish per-profile mean/worst errors, protected-case residuals, uncertainty,
cost and disposition. Never pool profile errors for an advancement decision.
A candidate must show an accuracy/cost advantage in at least one profile and
no resolved material regression in the other against that profile's matched
competitive controls. A neutral or uncertainty-limited second profile permits
conditional advancement only when the first profile's gain is resolved; it is
not proof of equivalence. If both gains are unresolved, do not expand. A resolved
regression in either profile rejects the configuration for general advancement;
record a profile-limited result without silently selecting a switching policy.
Full qualification still requires the separate paper-RMSE and twilight gates.

## Three candidates

All candidates combine these physical proposals:

- Base: uniform whole-sphere coverage in the local geometry frame.
- Sun: H68's full-support Sun map, k=.35, rotated toward the local source.
- Horizon: H68's full-support horizon map, radial-cosine width .1, centered on
  the actual ground tangent at the evaluation location. In spherical geometry
  this is the depressed horizon at altitude; do not substitute camera elevation
  or a universal zero radial cosine.

These are integration directions, separate from the outgoing lookup grid.
Preserve coverage below the geometric horizon and apply the existing physical
ground/atmosphere transport there; do not discard directions merely because
they intersect the ground.

### A: fixed layered allocation

| Total directions | Base | Sun | Horizon |
| --- | ---: | ---: | ---: |
|256|64|96|96|
|512|128|192|192|
|1024|256|384|384|

Counts stay fixed across altitude and source position. Sun orientation and the
physical horizon still change with location. This tests the value of reliable
background coverage independently of adaptation.

### B: geometry-driven allocation

Use these prototype allocations at256, scaled proportionally at larger budgets:

| Regime | Base | Sun | Horizon |
| --- | ---: | ---: | ---: |
|Near-ground daylight|64|96|96|
|Near-ground dusk|64|64|128|
|Higher atmosphere|96|128|32|

Blend daylight/dusk and low/high-altitude fractions smoothly before rounding to
paired counts. Initial altitude transition is .5-5km above ground; initial dusk
weight decreases smoothly from1 at the physical solar center on the ground
horizon to0 at8degrees separation above or below it. These are frozen prototype
parameters, not measured optimal thresholds. Retain the minimum base/horizon
coverage even above the transition or below the source horizon. Record actual
fractions, rounding and grid identity at each location.

H69 must specify the exact blend and deterministic rounding once, before
radiance scoring. Probe rounding boundaries explicitly; a smooth allocation
formula alone does not guarantee continuous numerical results.

### C: response-driven allocation

Use a pilot/production split. Start with the256-direction fixed layered pilot;
add one32-direction diagnostic block to each component, for352 pilot evaluations
per pilot wavelength/location. Compare the three fixed diagnostic estimates
over representative outgoing directions, species and the3 H68 wavelengths.
Freeze the statistic, absolute floor, block placement and tie-breaking in H69.
These changes are difficulty indicators, not independent error bounds.

Use those indicators to choose a production allocation: retain at least25% base,
12.5% Sun and12.5% horizon; distribute the other50% by the registered residual
rule, using fixed A proportions if the pilot gives no resolved distinction.
Round deterministically to paired counts. Freeze that allocation before
evaluating a fresh, separately placed production rule. Only this production
rule supplies the scored integral. Do not retrospectively reweight or include
response-selected pilot values in that integral. Adaptive reuse would require
a separate estimator design and qualification, outside this campaign.

Test total budgets512 and1024:352 pilot plus160 or672 production directions.
Repeat-placement validation evaluates a separate production placement with the
allocation held fixed; charge that extra work too. No continuous search or
response-dependent early stop on production values. Reuse the same authenticated
pilot across these registered budgets where inputs are identical, but show
both standalone cost and amortized campaign cost. Charge all3 pilot wavelengths,
diagnostic blocks, discarded work and validation; compare actual total incident
evaluation counts and wall time with matched fixed rules. Final-node count alone
is not C's cost, particularly when scoring/building more wavelengths.

The grid is shared across outgoing probes and wavelengths. In full recurrence,
select it once per location from native L1 pilots at the3 frozen bands, then
freeze directions, counts and weights through J2/J3/J4. Later-order reselection
is deferred. Charge pilot costs across the full build rather than treating them
as free. Local continuous/native-L1 contrasts hold the selected grid fixed.
Validate the allocation policy on held-out physical cases and outgoing probes;
do not claim unbiasedness or convergence from the fixed-mixture identity.

## Weights, metrics and controls

For proposal densities qBase, qSun, qHorizon per steradian and actual counts
nBase, nSun, nHorizon, the balance weight for a sample at direction omega is:

```text
w(omega) = 1 / (nBase*qBase(omega)
                + nSun*qSun(omega)
                + nHorizon*qHorizon(omega))
```

This assumes each component's nodes represent its declared proposal measure.
Verify that construction, including rotation and Jacobians. Positive weights,
whole-sphere support and correct overlap treatment are mandatory. Do not
silently rescale the rule to pass area/moment checks or fit a radiance reference.
For C this identity applies to the fresh, frozen production rule, not a
retrospective mixture of response-selected pilot and production samples.

## Builder contract for location-dependent grids

Before recurrence implementation, register one grid identity per native spatial/
solar location. It includes the physical frame, directions, weights, counts,
proposal parameters and C's pilot/selection identity. L transport and J angular
integration consume exactly that same identity. H69 must choose explicit active
counts plus padding/masking, or count buckets; padded entries have zero active
weight and are never treated as incident samples. Record intermediate storage
and branch/padding costs. Preserve the stored outgoing-cache layout.

An incoming array index is not a physical-direction identity across locations.
Audit every ground-boundary and cross-row intermediate-L read, including
`sampleLAtGround`. Never interpolate equal indices from neighboring solar rows
when their directions differ. For the first experiment, evaluate required
ground-boundary transport at the requested physical direction on each support
row before spatial/solar blending, retaining the existing ground physics; a
proven physical-direction-aware reconstruction is an alternative only if
registered explicitly. Charge extra boundary evaluations and retain a same-
direction proof. If neither fits the experiment, stop before a microbuild and
report a builder-contract dependency rather than silently reuse indices.

Manufactured constant and directional fields must retain their meaning across
neighboring rows, ground crossings, allocation-rounding transitions and order
changes. Include an identity-grid replay of the unchanged native boundary path.
Native L1 is computed from the analytic direct-scattering source along incoming
paths, as established by [H67](sunset-j2-results.md); the retained68 L1 samples
are not an angularly reconstructable continuous field. Previous-J reconstruction
enters L2 and L3, which feed J3 and J4 respectively.

## Comparator policy and decision uncertainty

Reuse ordinary68/256/1024 and H68 Sun/hybrid256/1024 where physical inputs match.
H67/H68 Toronto references cannot serve as paper-atmosphere references. Build
the corresponding matched paper controls and independent references if absent;
reuse retained paper material only after checking the complete compatibility
identity, including geometry, wavelengths and scattering quantity/order.
Replay ordinary68 and the retained focused controls before interpreting changes.
Add a matched-cost fixed control when C's charged count differs; evaluate the
same continuous L1 operator. Reuse authenticated parent data rather than rerun
qualified references.

Treat each control as a complete measured point: mean error, worst error,
per-case errors and charged cost. Register the nondominated H68 Sun/hybrid
frontier separately for each atmosphere before candidate scoring; never
assemble a comparator from one rule's
best mean and another's best worst error. Compare a candidate against every
eligible frontier point. Advancement requires one of the routes below against
at least one competitive complete control and no material domination by another.
A fixed control that already matches/exceeds the candidate's accuracy at lower
cost prevents advancement on added complexity alone. Rescore all retained
controls with the same radiance floors and uncertainty procedure. A new matched-
cost control is a complete measured configuration, not an interpolated score.

Score local J2 using mean and worst absolute relative error, signed errors,
per-species contributions and measured cost. Freeze a common absolute radiance
floor per reference group before candidate scoring so nearly dark cases do not
dominate relative errors. Show unclipped radiances and absolute errors too.
Do not average away a failing near-ground red witness, high-altitude case or
shadowed node. Distinguish independent sampling uncertainty, integration
convergence and repeat-placement sensitivity.

Two improvement routes qualify a candidate within a profile. Apply the required
cross-profile non-regression rule before advancing it to further work:

1. At matched charged evaluations, reduce mean or worst error by at least20%
   against one eligible complete focused control, while the other statistic
   does not materially regress.
2. Use at least25% fewer charged evaluations while matching that control's
   mean and worst error within qualified reference uncertainty and a10%
   relative margin on the error statistics.

For route1, a material regression in the other statistic means an increase
larger than both20% relative and2percentage points, unless qualified reference
uncertainty already prevents that conclusion. Examine per-case uncertainty;
do not assign a confidence interval to a max/mean without a justified method.
Improvements smaller than reference resolution are inconclusive, not wins.
No family advances on aggregate improvement alone if a protected case has a
resolved degradation beyond the same material-regression rule.

Use a conservative reference envelope initially: for each fixed candidate and
control, bound its absolute-relative-error statistic over the retained reference
mean plus/minus its qualified empirical interval, with the registered fixed
denominator floor. Aggregate per-case extrema to bound mean/worst statistics.
A threshold is resolved only if it holds throughout those envelopes; overlap
means inconclusive. These are sensitivity envelopes, not simultaneous95%
coverage or a confidence interval inferred from a max. Preserve paired reference
batches if a later registered paired analysis can tighten the comparison.

Before new expensive reference work, estimate whether its attainable precision
can resolve the decision. Permit at most4 decision-critical case refinements
per atmosphere,8 across the campaign,
each one additional independent batch set no larger than its initial history
count. Freeze seeds, count and estimated cost before starting. This is additional
precision work, separate from H71's preregistered initial references. If that
budget leaves the decision unresolved, mark it inconclusive and do not expand
the branch. Do not buy arbitrary precision to establish a tiny nominal gain.

The simple Sun-focused rule remains an eligible fallback. A more complicated
layered method need not be selected if it adds no accuracy/cost advantage.

## Stages and early rejection hatches

### H69: register designs and cheap correctness proofs

- [ ] Freeze all formulas, physical cases, allocation rules, metrics, budgets,
  matched controls and reference identities before atmospheric scoring.
- [ ] Register the complete paper and Toronto material requests, the shared
  physical target matrix, separate independent authorities and per-profile
  comparator frontiers. Include both profiles in reference/cost/storage estimates.
- [ ] Freeze exact full-B1 comparator requests/artifact hashes and scoring
  identities: H55 Original40 in00347 (aggregate11.62291402828908) is the original
  paper-configured baseline; H61 Focused60 k=.35 in00395/00397 (reported11.593959)
  is the best accepted experimental outgoing configuration. H73 uses its
  outgoing layout and corrected60 operator, changing only incoming integration.
  Authenticate full-precision retained values; rounded prose is not the gate.
  Original production scene captures remain a separate visual comparator.
- [ ] Verify map inverses/Jacobians, mixture identity, finite positive weights,
  deterministic reproduction and rotation equivariance. Verify a constant
  field and first moments; report residuals rather than normalize them away.
- [ ] Manufactured controls include isotropic light and declared Rayleigh/Mie
  phase lobes, including a lobe away from the Sun. Check near-ground, elevated,
  Sun-above and Sun-below configurations.
- [ ] Reject a grid level from atmospheric work if constant-field error exceeds
  2% or any normalized first-moment magnitude exceeds2% of4*pi. Test the next
  registered finer level once; reject the method if1024 still fails. Require
  .5% area/moment errors at1024 before a full-build finalist. These are screening
  tolerances, not claims of atmospheric accuracy.
- [ ] Plot the actual three layers, weights and geometry-dependent allocations.
- [ ] Qualify the location-dependent grid contract, physical-direction ground/
  cross-row reads, padded-count handling and C's pilot/production split before
  any recurrence work. Retain manufactured and identity-path proofs.

An inverse/Jacobian, overlap or accounting defect is an implementation failure:
fix it and rerun only affected proofs in a new run. A mathematically correct
rule that repeatedly fails the manufactured screen is a candidate rejection.

### H70: two-profile local same-input sunset screen for all three methods

- [ ] Use the4 H67 physical locations and3 bands in each atmosphere:12 cases
  per profile,24 overall. Reuse qualified Toronto J2 estimates; obtain matched
  independent paper estimates where absent. Use continuous L1 first to isolate
  the incoming operator. A Toronto mean must never be reused for paper material.
- [ ] Test A/B at256; test C's fresh-production designs at charged512/1024
  budgets. Every mathematically qualified A/B family gets one1024 fine rescue,
  even if256 is dominated. An infeasible resource bound is reported separately,
  not as a scientific family rejection. H68 showed nonmonotonic coarse behavior.
- [ ] Use512 only to bracket an actual passing/failing transition or provide
  C's matched-cost control; no open-ended count/width/allocation search.
- [ ] Pair view64/128, refine to256 only above1% J2 change, as in H68. A failure
  to qualify path integration is inconclusive angular evidence.
- [ ] Apply the accuracy/cost routes above. Stop a family after its fine
  comparison across both profiles if it has no resolved cross-profile advantage.
  Reject individual configurations
  early without rejecting their untested finer family members. Stop C's
  allocation policy if it is dominated after pilot work is charged or fails
  placement validation. Distinguish a failed allocation heuristic from failure
  of the underlying layered quadrature; A remains its independent fixed test.
- [ ] Show both profiles in the per-case/error-cost plots and report each
  method's advance/reject/inconclusive result separately and jointly. Every
  mathematically qualified method receives the registered local comparison in
  both profiles; do not skip paper solely because Toronto is disappointing.
  A proven regression can stop later expensive stages. If none survives the
  joint gate, finish with the negative result; do not build full caches.

Only the bounded decision-critical reference refinements registered above are
allowed to clarify advancement. Report remaining ambiguity explicitly.

### H71: held-out daytime, altitude and twilight controls

- [ ] Freeze8 additional physical targets before H70 scoring:2 noon,2 sunset
  minus10minutes,2 sunset plus30minutes, and2 elevated sunset targets. Cover
  ground/1.2km/8km and at least one source-shadowed location across the set.
  Use the same3 bands, geometry/material registration and outgoing physical
  directions as the corresponding controls. Evaluate all8 in both atmospheres:
  24 cases per profile,48 overall. No winner-specific target choice.
- [ ] At the original4 H70 locations also freeze one outgoing probe each that
  was excluded from C's pilot. Cover toward-Sun, side/away and near-horizontal
  directions across those4 probes; record their exact vectors before scoring.
  Do not let C choose an allocation using these validation radiances. Include
  them as protected cases in each atmosphere, not just a diagnostic display.
- [ ] Obtain matched independent local references only where retained ones are
  unavailable. Qualify uncertainty; a finer version of the candidate rule is
  a convergence control, not the independent authority.
- [ ] Check B across altitude/solar-angle transition boundaries; check C's stop
  decisions and evaluation counts on these previously unscored cases.
- [ ] Reject an adaptation that loses its joint H70 accuracy/cost advantage or
  has a resolved protected-case regression in either profile. Do not repair it
  by fitting thresholds
  to held-out results within this campaign.
- [ ] Advance at most2 nondominated configurations, including a simple fixed
  focused control if it remains competitive. Prefer fewer evaluations and
  simpler rules when gains cannot be resolved.

A candidate can pass one regime and fail another. Record that limited result;
do not silently turn it into an untested regime-switching production policy.

### H72: actual cache-input and recurrence test

- [ ] Perform the native/continuous-L1 contrasts and later-order microbuilds
  for both atmospheres, using each profile's matched control and independent
  evidence. Retain separate pure/cumulative order residuals and costs; passing
  Toronto cannot excuse a paper regression or vice versa.
- [ ] At each candidate/control's actual incoming directions, evaluate native
  compiler L1 transport and accurate continuous L1. Hold the angular rule fixed
  within each contrast. Compare J2 at the same physical points to separate
  native path-transport error from incoming integration error. Never interpolate
  the retained F68 L1 array and label it native L1 at new directions.
- [ ] If the advantage disappears with native L1, stop whole-build advancement
  and report the transport/cancellation bottleneck. Preserve the continuous-L1
  result; this is not by itself evidence of previous-cache interpolation error.
- [ ] For survivors, run representative wavelength microbuilds throughN4 with
  the selected rule used inside J2/J3/J4 construction. Preserve N1 and the
  outgoing grid; no readout-only substitution or post hoc order replacement.
- [ ] Separately diagnose L2-from-J2 and L3-from-J3 reconstruction at fixed
  physical direction/position probes. Where an independently qualified exact-
  direction source is unavailable, label the result as a reconstruction or
  convergence diagnostic, not isolated mathematical truth. Do not attribute
  all N3/N4 error to interpolation from the final radiance difference alone.
- [ ] Retain pure and cumulative order spectra at the registered rays, actual
  directions/weights or exact regeneration recipes, build cost and intermediate
  storage high-water marks. Use the same policy across orders initially.
- [ ] Compare saved matched independent N1/N4 or all-order references with
  explicit labels. Missing independent N2/N3 stays unavailable; do not invent
  order-specific external authority.
- [ ] Reject if benefits are erased/reversed through recurrence or matched
  reference fit materially regresses in either profile. A lower J2 error alone
  does not qualifyN4. Stop a generally regressing candidate before full B1.
- [ ] Include cheap sunset plus60minute witnesses before full B1/scene work,
  alongside noon/sunset/plus30minute controls. Use the existing physical rays,
  instants and atmosphere identities. Apply the twilight gate below; do not
  spend on full scenes for an already resolved unacceptable regression.
- [ ] For at most2 survivors, expand selected rays to15 camera wavelengths and
  provide paper and Toronto shared-exposure swatches, spectra and order-residual
  plots with matched control/candidate columns in each profile. Three-band
  plots earlier in the campaign must not be presented as full-color predictions.

### H73: full paper gate for the best surviving configuration

- [ ] Advance only the strongest accuracy/cost survivor. A second survivor is
  eligible only if the first fails the paper gate and the second offers a
  distinct, already demonstrated local/recurrence advantage. Maximum2 full runs.
- [ ] Use the exact B1 paper atmosphere,40 paper wavelengths, all17 intervals
  and all81 dome samples. Keep spectrum, measurement identities, equations,
  weighting and color conversion fixed; publish interval RMSE and aggregate.
- [ ] Compare against the exact H61 Focused60 and H55 Original40 baselines
  frozen in H69. Aggregate RMSE must match or improve both
  at retained scoring precision; no tolerance is invented to excuse regression.
  Disclose every interval change and any adverse cancellation even if aggregate
  passes. Isolated independent agreement remains a separate result.
- [ ] Stop expansion of a failed configuration. Only the distinct second
  survivor allowed above may receive the remaining full run. Do not tune
  incoming allocations or change atmosphere against B1 inside this campaign.
  Preserve useful physical corrections even if the paper gate rejects them.
- [ ] Render the matched dome comparison with one shared display mapping.

The B1 RMSE gate uses the exact paper atmosphere only. Toronto retains its
independent-reference and paired-control scores; do not label a Toronto-material
comparison against paper target values as a matched Bruneton benchmark. H73
paper success never overrides a failed Toronto regression/twilight gate.

### H74: visual and final disposition

- [ ] For a jointly surviving, paper-qualified configuration, render matched
  paper-atmosphere and Toronto
  scenes at solar noon, sunset and sunset plus30/60minutes, using the existing
  scene registrations and camera. Keep current production twilight behavior
  visible as a comparison, not an assumed correctness oracle.
- [ ] Label material identities in every image. Only matching atmospheres form
  algorithm before/after pairs. Retained canonical-production material may be
  shown as separately labeled context; it is not a substitute for the required
  paper-atmosphere scene. Use one display context across matched comparisons,
  and preserve actual exposure values when comparing the two profiles.
- [ ] Apply the explicit twilight disposition below to the full-spectrum
  witnesses and actual captures. Publish any unresolved owner-visual decision
  with complete reviewable images; do not silently mark twilight accepted.
- [ ] Publish side-by-side scenes, clearly amplified/labeled difference images,
  build/runtime costs, all gate decisions and limitations. No black placeholder
  may be labeled as an actual difference result. Preserve measured spectral
  changes separately from display appearance.
- [ ] If no method survives, publish the figures already earned and a concise
  rejection report; no full scenes are required merely to finish the plan.
- [ ] Verify all new runs, derivation chains, replay/accounting, local types
  after authored-code changes, image inspection and owned-process cleanup.
  No dedicated standards reviewers/audits. Checkpoint advice at a coherent
  implementation milestone remains separate from scientific acceptance.

## Twilight acceptance and justified changes

Register the existing plus30/60minute witness geometry in H69 and evaluate it
under both paper and Toronto material. Freeze exact instants, luminance/spectral
floors and common display mapping. Compare against same-profile focused
controls, retaining H61/H62/H63 and deployed-production context where material
identities match. If retained canonical material differs from the exact paper
atmosphere, generate the missing paper control rather than relabel it. Keep
those identities separate. The cheap3-band H72 controls
can reject a clear problem but cannot qualify display color; final assessment
uses15 camera wavelengths, spectra and shared-exposure images.
Apply all following dispositions separately in each atmosphere; a resolved
failure in either prevents joint qualification. Publish both decisions.

Flag a material behavior change when luminance changes by more than10%, or
unit-luminance spectral shape changes by more than5% relative L2 norm, above the
registered low-signal floors. Use absolute measures below the floors. These are
preservation triggers, not tolerances declaring production physically correct.
Evaluate any matched independent N1-N4 reference as that prefix; an all-order
reference retains its tail qualification.

- Accept preserved behavior when changes remain below the triggers and no
  resolved independent-reference regression exceeds the earlier protected-case
  rule. The image must also be free of new seams, discontinuities or clipping
  artifacts hidden by the common display mapping.
- Accept a substantial change as physically justified only when matched,
  qualified independent spectra/luminance support the change without a resolved
  regression in protected twilight cases. Show the spectral and image evidence.
- Reject a resolved worsening against qualified independent twilight references
  beyond the protected-case rule; stop that branch before expensive scenes.
- If a material change lacks sufficient independent authority or is only an
  appearance concern, complete the permitted reviewable comparisons and mark
  `owner visual decision required`. Do not claim full qualification or treat
  production as the physical oracle. Paper success alone cannot clear this gate.

## Resource, progress and scope controls

Favor hardware GPU for incident radiance, reference probes, recurrence and
renders. CPU work is appropriate for analytic proofs, control registration,
compact reduction/verification and reporting. Experimental code need not adopt
production interfaces, but must preserve the experiment's declared boundaries.

One GPU job at a time; bounded direction batches; evaluate one wavelength at a
time. Retain compact radiance/weight payloads and exact recipes rather than full
fields or repeated large manifests. Stream reproducible fields through owned
scratch, with authenticated lifecycle cleanup after dependent evidence is saved.
The owner approved768MiB retained disk for execution;1GiB scratch/free-disk rules
remain unchanged. H68 ended at731.419MiB;
that is historical accounting, not proof that the entire new campaign fits.
Before execution, measure current use, estimate each stage plus sealing reserve,
and declare its footprint. Do not start an expensive stage that cannot finish
and seal within the approved allocation. A needed amendment is a resource
dependency, not a numerical rejection; preserve completed work without deleting
immutable evidence. The owner subsequently authorized justified further budget
decisions while AFK; record any amendment and its measured need explicitly.

Write monitorable progress under the established run contract at least every
30seconds, with sample counts, last completed result and next milestone. Report
useful visual progress after H69 geometry, H70 local scores, H71 held-out scores,
H72 spectra/swatches and any H73/H74 renders. Do not render an image per batch.

Use60minutes as a progress review, not an automatic stop: continue while strong
positive progress is measurable and gates/resources remain satisfied. Stop an
unproductive branch promptly. Execution faults permit a diagnosed, bounded
repair/retry preserving all evidence; do not automatically repeat unchanged
failures, and do not confuse an execution retry with permission to tune a failed
scientific method.

Source will remain under `experiments/sky-accuracy-dials/`; generated evidence
under `tmp/experiments/sky-accuracy-dials/`; owning documents remain here. Use new
immutable runs and preserve every parent. This is an experimental comparison,
not production integration. The owner has selected execution of this plan.

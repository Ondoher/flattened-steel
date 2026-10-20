# H134-H140: reconstruct incoming illumination through the cache recurrence

Status: active; owner requested independent execution. The
[execution record](illumination-reconstruction-execution.md) owns progress,
decisions and evidence. The experiment remains open. This plan follows the completed
[H126-H133 reconstruction investigation](reconstruction-mechanisms-results.md).

## Outcome and authority

Test whether separating the known first-scattering source phase, reconstructing
the remaining amplitude accurately, and refining the incoming grid from cached
curvature can produce a more accurate four-order experimental cache. Establish
which gains survive into observer spectra, paper B1 scores and twilight scenes.

This is exploratory implementation within the existing sky-accuracy-dials lane.
The owner explicitly makes cache-building complexity a reporting dimension,
not an advancement or rejection gate; see [design](design.md#cache-building-complexity-report-do-not-gate).
Slow construction, difficult integration, extra coefficients, storage or repeated
phase integration cannot by themselves reject a scientifically promising route.
Measure and report them. Do not reinstate earlier speed/accuracy or whole-build
saving requirements. Scientific failures and unresolved precision remain distinct.

A later execution request authorizes the contained implementation and conditional
stages described here, not production promotion. Saving this plan authorizes no
runs. Production and historical source remain read-only. The proposed final
runtime consumes a completed cache through lookups; no per-frame tracing is proposed.

Completion means answering the reconstruction, recurrence and full-cache questions
with the evidence each reached gate permits, including a justified negative or
inconclusive result. Full-cache success requires the exact paper RMSE gates and
protected twilight checks below, not just improved local components.

## Evidence and baselines

Facts: H126-H133's fixed composition reduced absolute incoming reconstruction
error 61.5% paper / 72.7% Toronto across 36 exposed fields. All component
protections passed; physical-total protection passed 9 and was inconclusive in
27. The baseline was an experimental 4096-node midpoint, not deployed production.
Its 4864-node refinement shared allocation across two profiles and three bands.
It did not establish a single-profile builder, later-order accuracy or paper RMSE.

Authenticate accepted00652 and its linked source/parent inventories. Reuse
00647/00649/00650's paired decisions and actual donor/query data, 00651's tables,
and the inherited independent direct-light and physical-history machinery.
Preserve original failed seals and their successful numerical recovery records.
Recompute only derivatives invalidated by changed topology, physical inputs,
wavelengths, source, conventions, reconstruction or query measure. No copying
light into different directions by equal array index.

Before new results, register distinct comparator identities:

| Comparator | Purpose |
| --- | --- |
| H126 experimental midpoint with matched physical inputs | Isolate the new representation and grid changes |
| Complete Sun4096 with matched inputs | Guard against improving only a weak experimental baseline |
| Current production algorithm, adapted inside the experiment with frozen controls | Whole-cache and twilight comparison; do not relabel a paper setup as deployed output |
| H55 Original40 and H61 Focused60 | Retained paper-score acceptance controls, authenticated through their owning reports |

For paper scoring use [H55's exact contract](paper-b1-results.md) and
[H61's results](outgoing-focus-results.md). Reuse complete spectra only
under matching inputs and compiler identities; otherwise rebuild the affected
control in a new run. A sentinel reproduction supplements, not replaces,
authentication. Record differences among production, paper and corrected
experimental settings rather than merging them into one baseline.

Toronto means the registered AERONET phase/SSA variant, not Toronto weather.
Paper and Toronto remain separate profiles. No optical, atmosphere, exposure,
mixture or color fitting to improve a score. Local probes start in spherical,
distant-Sun, black-boundary conditions. Paper scoring uses its registered ground
reflection and spectrum. Flat geometry/local-Sun transfer is outside this plan:
the exact source-phase argument must not be assumed valid there.

## Candidate and scientific comparisons

1. Retain separate incoming Rayleigh-origin and aerosol-origin L1 values.
   For the distant Sun, test the exact factorization
   `L1_s(w) = P_source,s(w) * T_s(w)` in the actual builder conventions.
   Reconstruct T with positive monotone four-ring polar Hermite interpolation,
   retaining the tested azimuth/support treatment, then restore source phase.
   T is integrated transport amplitude, not local density. Do not renormalize
   effective factored weights as though they were constant-radiance weights.
   Keep ground-reflected/boundary light as a separately identified contribution;
   it is not automatically covered by the atmospheric single-scattering factor.
2. Begin with all original 4096 incoming directions and add 12 complete 64-node
   polar rings, 768 nodes / 18.75% more. Select gaps using only the active
   atmosphere's actual cached values, physical angular widths and a frozen
   equal-normalized spectral/origin curvature rule. Never train on interior
   oracle light, outgoing phase, reference totals or the other atmosphere.
   Initially use bands 3/5/8; before full-spectrum construction freeze how the
   active wavelength set contributes to allocation. No selection by best score.
   Default topology is local to each physical receiver/solar-geometry row and
   active atmosphere, shared by all outgoing directions, both origins and all
   active wavelengths within that row/order. Later-order allocations may change
   only under the frozen algorithm applied to that order's own computed values.
   Register the exact spectral/origin normalization and zero-signal handling in
   H134, without reference/oracle inputs; trace additional nodes only after the
   allocation is frozen. Record the topology/frame identity with every field.
3. Treat outgoing phase integration as a separate numerical operation. Compare
   the intended phase-weighted reconstruction against an independent continuous
   integral of that same function, then compare the result with independent
   physical light. Correct phase mass alone is not physical accuracy.
   Cubic slopes depend on sampled values: old fixed linear weights are invalid.
   Construct coefficients per actual illumination field; integrate accurately
   using cell moments or refined quadrature. Do not allocate a global dense
   row-by-band-by-outgoing-by-incoming weight tensor merely for convenience;
   streaming/recomputation can represent the same integral.
4. Do not assume `P_source * T` is the physical factorization of N2 or later
   aggregate light. First propagate the improved L1 through otherwise unchanged
   later-order reconstruction. Separately test positive reconstruction/refinement
   of actual higher-order radiance, without falsely dividing it into a single
   Sun-shaped source lobe. Retain the first-order-only variant as an explicit
   control. A new higher-order representation needs its own correctness checks.

Freeze local ablations: original, phase-factor/cubic only, active-profile density
only, and their composition. Use earlier results to avoid retracing identical
controls. Carry at most two science-distinct survivors into expensive recurrence;
report any additional variant as a bounded diagnostic rather than a full survivor.

## Decision rules

Keep unchanged original decisions under their original criteria. New comparisons:

- Local reconstruction: retain signed E_R/E_M, A_R/A_M, A_sum and A_origins,
  outgoing-Rayleigh counterparts, raw phase-weighted numerators and phase mass.
  Normalize to the frozen matched reference/floor, never candidate brightness.
  Pool equally weighted normalized field errors within each profile; compare
  ratios of means, not means of ratios. No pooling across atmospheres to hide loss.
- Replication target: at least 20% lower pooled A_origins in each profile versus
  the matched midpoint, with no case/component or combined A regression over
  0.1 percentage point. Also report complete Sun4096 physical accuracy separately.
  This is a reconstruction gate, not a full physical qualification claim.
- Physical protection: candidate-minus-control absolute-error change must not
  exceed 0.1 percentage point of matched reference/floor, casewise, against both
  matched midpoint and complete Sun4096. Reuse correlated baseline/delta bounds.
  Write protection delta as candidate absolute error minus control absolute error:
  its upper bound must be <=0.1 percentage point. Define improvement gain separately
  as control absolute error minus candidate absolute error: a positive gain claim
  requires its lower bound above zero. An unresolved interval is inconclusive,
  never evidence of no regression.
- Use paired common directions/history indices where valid, 32 batches and
  2000 paired resamples; preserve covariance across models/bands at a receiver,
  with independent physical receiver/profile groups. Carry separate empirical
  view, column, GPU and reconstruction-evaluation envelopes. Numerical envelopes
  should be <=10% of the margin supporting a decision. Report sequential sampling
  and finite, non-simultaneous coverage; do not promise global error certificates.
- Refine precision at the actual decision driver. Inherited 8192/32768/131072
  angular clouds are starting waves, not this plan's hard sampling ceiling.
  Freeze the next precision wave before examining it and record why it can resolve
  the margin. Continue while convergence/uncertainty improves. If a reference is
  structurally unsuitable or refinement stops reducing relevant uncertainty,
  change estimator with controlled overlap or report the unresolved quantity.
- Resolved adverse accuracy rejects that configuration, not unaffected hypotheses.
  Inconclusive local totals may proceed to a correctly implemented recurrence
  pilot for diagnostic evidence, but do not silently pass physical admission.
  Full qualification remains withheld unless its required protections resolve.

| Decision | Pass / reject / inconclusive | Diagnostic advancement |
| --- | --- | --- |
| Operator correctness | Independent same-function integral agrees within the registered numerical envelope; resolved mismatch rejects the implementation; unresolved precision remains inconclusive | Repair/refine before claiming that operator correct |
| Local reconstruction | Paired profile error-ratio upper bound <=0.8 versus midpoint, with every registered component protection; resolved adverse bound rejects that configuration | Unresolved physical totals do not invalidate an established reconstruction result |
| Physical protection | Against each named control, delta upper bound <=0.1 percentage point passes; lower bound >0.1 rejects; otherwise inconclusive | Correct slices may run diagnostic recurrence/B1, but cannot claim complete qualification |
| Recurrence | Candidate's own prior-order fields, order identities and registered physical protections pass; resolved defect rejects the configuration | Algebraic identity alone permits no physical-accuracy claim |
| Paper B1 | Aggregate RMSE matches/improves all three named controls below; a resolved worsening rejects full-cache acceptance; unresolved numerical sign is inconclusive | Preserve useful local and order evidence even if paper acceptance fails |
| Twilight | Per protected ray/profile, physical delta against frozen production control passes the 0.1-point rule; unresolved reference remains inconclusive | Appearance can be reported without calling it physically protected |

Passing one row does not silently pass another. The final report records each
disposition separately. Construction cost is absent from these scientific gates.

## Milestones

Estimates are elapsed guidance in roughly 20-minute increments, not deadlines.
Initial local work is approximately 100-220 minutes, with substantial uncertainty.
Full recurrence, 40-band scoring and rendering cannot be estimated honestly until
their measured pilots exist. Reforecast before each expansion and at 60-minute
progress reviews. Continue beyond guidance while strong positive progress is
being made; construction cost alone is not a stopping rule.

| Milestone | Outcome and deliverable | Initial estimate |
| --- | --- | --- |
| H134 | Authenticated inputs, frozen baselines/metrics, runnable small slice design | 20 min |
| H135 | Active-profile allocation and local physical/reference decisions | 40-80 min; precision extension unknown |
| H136 | Actual builder integration reproduces the intended reconstructed-light integral | 40-120 min |
| H137 | Broader/repeated local transfer; freeze inputs for recurrence development | Unknown until H135/H136 pilot |
| H138 | Measured pure/cumulative four-order cache and protected twilight spectra | Unknown until a complete row/order pilot |
| H139 | Full paper B1 interval scores, domes and matched scenes | Unknown until complete wavelength pilot |
| H140 | Actual-route replay, local types, scientific synthesis and handoff | 20-40 min, update after H138 |

### H134: register and reuse before new light

Authenticate accepted00652, report/control parents and current sources. Inventory
local total-protection drivers and available independent pure/cumulative order
references. Freeze all comparator settings, profile identities, random streams,
normalizations and canonical paper/scene selectors in a new immutable run.
Register an order/reference matrix for atmospheric L1, local J2-J4, pure viewed
L1-L4 and cumulative N4: estimator and historical source, measured quantity,
order cutoff, ground-bounce convention, units/normalization, geometry and
attainable precision. Existing pure-J2 qualification does not automatically
cover other orders or twilight. Record unsupported cells and the targeted new
estimator/overlap check needed, without inventing a qualified reference.
Define pure L and cumulative N explicitly under the inherited order convention;
map atmospheric event count and ground bounces to that convention on both sides.
Air-only L1 has one atmospheric scattering and no reflective-ground contribution;
direct ground-return and later boundary terms retain separate provenance/tallies.
Reproduce one small existing cubic/density result, then measure the missing
active-profile slice only. Register which source or convention differences require
new control spectra. Deliver the baseline compatibility table, first executable
command/recipe, pilot timing and next-wave estimate in the execution record.
Replay the retained H55 score arithmetic cheaply: 17 x 81 x 31 = 42,687 scalar
residuals, spectral RMSE units mW m^-2 sr^-1 nm^-1 and root-mean-square interval
aggregation. This arithmetic check needs no new physical campaign.
Failure of an identity pauses only affected reuse; repair or rebuild that input.

### H135: make allocation independent of the other atmosphere

Implement the active-profile-only curvature rule, preserving all original nodes
and physical support. Train using the actual original cached nodal light; compare
independent-nodal controls to isolate input error. Freeze ring selection before
tracing additional nodes. Evaluate the four ablations on the original 36 exposed
fields with a disjoint, preregistered query cloud, reusing exact physical truth
where compatible. Reconfirm phase/amplitude manufactures, positivity, nodal
reproduction and constant-amplitude limits; constant radiance is a different test.

Resolve the inherited physical-total uncertainty using targeted reference and
angular refinements, preserving matched quantities: observer radiance cannot
validate local J2 density. Use the independent solver; reuse libRadtran only for
matched, supported observer quantities. Deliver profile/case/component tables,
paired total decisions and reference precision, not a decorated image of a table.
If the active-profile method loses the supported gain, inspect the allocation
mechanism and follow one evidence-supported correction before broadening.

### H136: prove the build operation before global recurrence

Author a contained builder slice with actual cached inputs, generated adaptive
directions and reconstruction coefficients. Prefer resident GPU evaluation and
small independent binary64 checks. Cover both profiles, near/opposite/sideways
outgoing directions and high-curvature/support witnesses. Preserve physical
direction/frame identity across rows, wavelengths, orders and ground terms.

Compare emitted J2 against (a) independent quadrature of the exact same
reconstructed illumination and (b) direct physical reference separately. Check
phase conventions, unit directions, support, finite/nonnegative outputs, source
factor restoration, pure/cumulative bookkeeping and relevant analytic limits.
Refine angular integration until the numerical decision envelope qualifies.
Do not adjust normalization to fit truth or call an algebraic closure physical proof.

Test at least one actual whole spectral row/order tile, including coefficient
preparation, upload, phase integration, reduction and output. Record elapsed,
GPU/CPU stages, peak memory and work scaling; publish the full-cache estimate.
An expensive but correct slice advances. A wrong slice receives a targeted fix.
No new compiled/native helper or experimental unit-test tree is permitted.

### H137: freeze and test transfer

Freeze the L1 reconstruction method, active-spectrum allocation and thresholds
before local transfer. This is not the final higher-order policy freeze. Extend
to compatible exposed geometries beyond the six original
receivers and repeat at least one independently constructed/shifted sampling grid
to detect favorable alignment; baseline and candidate must share that construction.
Publish exact field counts/selection before tracing. Do not describe inspected
development evidence as fresh.

Keep all eight reserved H97 tuples unexposed throughout this milestone and the
H138 development pilot. Their one-time evaluation follows the final order-policy
freeze in H138, avoiding a fresh-validation claim for a subsequently changed method.
Respect all local correctness/component/total rules. An adverse case earns
diagnosis or rejects that variant; cost does not. An unresolved reference triggers
precision work or explicit inconclusive status.

### H138: determine what later scattering actually does

Implement the complete recurrence only inside contained source. First build the
first-order-only intervention with unchanged later interpolation. Retain pure
L1-L4 radiance and J2-J4 source-density witnesses separately from cumulative N1-N4.
Show which error enters during source integration, path transport, reconstruction
or recurrence rather than inferring it from final brightness.

Compare the bounded higher-order generalization with that control on the same
rows/directions. Its initial falsifiable candidate is positive polar cubic on
the actual higher-order radiance, with the same cached-curvature ring rule and
no source-phase division. Prediction: lower reconstruction error under matched
continuous outgoing-phase integration and no protected physical regression.
Check manufactured constant radiance, nonnegative smooth angular fields, nodal
reproduction, support, linear-control equivalence and independent phase moments
before interpreting real later-order results. Reject or adapt this candidate if
it repeats raw-radiance cubic's adverse behavior; keep the L1-only control.

Every complete candidate recurrence consumes its own computed previous-order
fields, never independent truth substituted as an input. Physical-field
substitution may isolate a mechanism only as a separately labeled diagnostic
ablation. Do not use an N1 source phase factor as a later-order illumination
model. Recompute adaptive
rules or coefficients when their inputs change; reuse geometry/moments only under
proved identity. Verify each global order is available before dependent work.
Audit the paper grass/ground recurrence separately from the original black-boundary
controls, including direct ground light and later reflected contributions. Do not
apply the atmospheric N1 factorization to an aggregated ground-plus-atmosphere field.

Freeze matched independent order-reference checks and their attainable precision
before evaluating candidate results. Use existing high-order independent probes
where compatible; obtain targeted matched histories if needed. libRadtran full
radiance is not an order-4 oracle and is not assumed valid for spherical twilight.
Correct summation alone cannot establish accurate N4. Require all relevant
protection claims to carry their uncertainty and quantitative disposition.

Produce full observer spectra early at solar noon and sunset, then sunset-10,
sunset+30 and sunset+60 minutes for both profiles. Freeze the existing San Jose
scene registration, camera, ground, Sun position, exposure and display mapping.
For protected twilight rays, name the unchanged current production algorithm
under the same atmosphere/scene inputs as the protection control. Before viewing
new twilight results, freeze ray selectors, both-profile coverage, spectral or
linear-radiance quantities, reference/floor and independent estimator. Test
candidate-minus-production absolute error against the matched physical reference
with the 0.1-percentage-point allowance above. Report the unchanged experimental
order control separately. If no suitable reference can qualify a witness,
keep its protection inconclusive; production brightness alone is not truth.
Record full build time/peak memory separately from accuracy. Freeze at most two
order-policy survivors for paper/scene comparison.

After all exposed development, including twilight policy decisions, freeze the
complete candidates' order policies, topology algorithms and thresholds. Then
expose the eight reserved H97 tuples once with prespecified profile/band/order
quantities and matched references. Record their transition to exposed. These
tuples validate only the quantities they support; local J2 checks alone cannot
be called fresh full-N4 validation. Frozen data-dependent adaptation to a tuple's
own nodal values is part of the algorithm; tuning its rules using held-out errors
is not. A repair following these results converts the tuples to development and
requires new disjoint physical validation for the changed claim; unchanged L1
claims retain their earlier valid evidence.

### H139: paper scores and reviewable appearance

Use the exact paper atmosphere, solar spectrum, grass/ground, observer and score
contract: Direct40, 360-818.25 nm, 17 intervals from 09:30 to 13:30 every 15 minutes,
81 canonical directions; score channels 0-30 in the inherited 360-720 nm boundary.
Retain all 40 wavelengths and cumulative order4. Aggregate RMSE is the square
root of the mean of interval squared RMSEs, not their arithmetic mean.

Gate: match or improve the aggregate score of each of three controls:
authenticated H55 Original40, H61 Focused60, and the freshly registered current
production algorithm evaluated under the same paper inputs. A current-control
comparison is a required nonregression gate, not just a reported number.
Use paired numerical sensitivity on each candidate-minus-control RMSE difference;
an upper bound <=0 passes, a lower bound >0 rejects, and a zero-straddling bound
is inconclusive. Exact identical reproduced results can establish equality;
do not introduce an unregistered permitted RMSE regression. Publish
all 17 interval changes, worst-ray changes and numerical sensitivity; interval
improvements cannot hide an aggregate failure, nor does aggregate success erase
a failed physical/twilight protection. Do not change the atmosphere to rescue B1.

Render original Figure5-selector error domes with the registered error palette;
published paper panels stay byte-identical and labeled as historical. Separately
render matched full-spectrum production/experimental-control/candidate scenes
for both profiles at the registered noon, sunset-10, sunset, +30 and +60 times.
Use the existing full display wavelength path (15 or directly integrated 40 bands,
explicitly identified), identical color/exposure on every side, and no per-panel
brightness normalization. These images communicate spatial error and actual
appearance, which native numeric tables cannot replace. Include native spectra,
linear luminance/chromaticity and settings alongside images.

Publish a completed full-spectrum scene pair or a complete interval/dome as soon
as available, before the entire campaign finishes. Never synthesize physical sky
colors from three diagnostic bands, fill missing data with black rectangles,
or turn numeric progress into SVG/PNG tables. Visual preference alone does not
establish physical correctness or justify tuning a horizon toward white/orange.

### H140: verify, synthesize and preserve a resumption boundary

Replay the actual selected numerical route, adaptive allocations, source/parent
and query identities, order fields, uncertainty, paper score arithmetic, display
settings, generated imagery and cleanup. Run local TypeScript after authored
source changes. Use focused self-verifying proof runners, not a new test suite.
Separate numerical/operator correctness, component gains, physical total accuracy,
full B1 acceptance, twilight protection and visible appearance in the final report.
List rejected and inconclusive branches and untriggered conditional work.

An inconclusive/negative report can complete this selected investigation without
claiming a replacement cache. Preserve evidence, state what could resolve each
open question and leave production promotion separate. No reviewer/compliance
handoff is a completion gate. Keep checkpoint advice separate; do not repeat
science if local Git permissions prevent an authorized checkpoint.

## Adaptive scope, reporting and recovery

Use `illumination-reconstruction-execution.md` for registration, decisions,
milestone reports, current action and artifact links, created when execution is
requested. Use `illumination-reconstruction-results.md` for final synthesis.
After each milestone report completed work/evidence, observation versus
interpretation, uncertainty/measurements, disposition and the next action.
Publish useful evidence promptly, with text/CSV/JSON for numerical information.

Permit supported alternatives within incoming reconstruction, refinement,
phase integration and order recurrence. Before each branch record evidence,
changed mechanism, falsifiable prediction, frozen controls, protected cases and
the next measurable diagnostic. One new branch at a time; no more than two full
survivors. Two adverse variants with no distinct mechanistic prediction end that
branch, not the entire investigation. Cost is forecast and monitored, never its
accuracy exit gate. Improve sampling, representation or integration when new
evidence supports it; no fitted reference-dependent rule or weakened old threshold.

Use new helpers under `experiments/sky-accuracy-dials/illumination-reconstruction/`;
existing helpers remain read-only unless an explicitly identified experiment-local
adapter is required. All generated evidence and owned scratch stay below
`tmp/experiments/sky-accuracy-dials/`, allocated and sealed through the existing
immutable run contract. Real-path-check roots and reject junctions/symlinks.
Preserve old runs and exact derivation chains; copy derivatives into new runs.

Prefer GPU for large traces, integration and renders, CPU for small analyses and
independent checks. One GPU job at a time; retain live phase/count progress and
the existing heartbeat contract. Release owned browser/GPU resources and scratch.
Diagnose actual device/allocation failures, reduce resident tiles or stream,
preserve completed work and retry only affected operations with a new run.
Do not invent new system/GPU reserve guards or automatic retry prohibitions.

Current allowance is 1536 MiB retained evidence (H135 execution amendment),
1 GiB live scratch, 40 GiB free disk minimum. These are actual storage
constraints, not scientific construction-cost gates. Forecast new-wave retention
and use standing owner authority for justified allowance amendments before
allocation. Do not delete prior evidence to make space. Large conditional stages
require updated measured forecasts, not a new approval for ordinary choices.

## Plan critique

Completed one read-only critique by
`/root/illumination_reconstruction_plan_critique`, scoped to this plan, the owner
goals and minimum reconstruction/design/paper evidence. All five required and
three optional recommendations are incorporated:

1. Define improvement gain and protection delta with opposite, explicit signs.
2. Keep H97 held-out results unexposed until all higher-order/twilight policy
   development is complete and the complete candidate is frozen.
3. Require the current matched-input production paper score as a third B1 gate,
   and name production as the physical twilight protection control.
4. Separate ground/boundary light from the exact atmospheric L1 factorization,
   with explicit inherited scattering-order and ground-bounce conventions.
5. Register estimator/quantity/order/precision compatibility early; require the
   recurrence to consume its own prior-order fields; specify a falsifiable
   later-order reconstruction candidate and manufactured controls.
6. Define adaptive topology sharing and active-profile spectral normalization.
7. Add the compact pass/reject/inconclusive and diagnostic-advancement table.
8. Reproduce H55's exact residual count, units and score arithmetic before builds.

No recommendation was rejected. Primary self-review additionally places held-out
exposure after exposed twilight development and limits its claims to actually
supported quantities. This is not standards review or an independent audit.
Neither is scheduled during execution. If a materially different overall approach needs a further critique,
first record its trigger, exact question, smallest affected scope, completion
condition and whether it gates work. Anticipated evidence-driven branches use
the adaptive decision process above without recurring reviews.

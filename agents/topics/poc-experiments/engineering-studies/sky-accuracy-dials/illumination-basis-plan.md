# H105-H112: positive illumination bases and integrated phase weights

Status: completed selected investigation, exploratory/cost-limited. The
[execution record](illumination-basis-execution.md) owns current milestone state,
decisions and resumption; the [results](illumination-basis-results.md) own the
scientific disposition. The owner selected this plan after its recast and
critique; production promotion remains separate. The original planning request
followed the [H97-H104 findings](phase-cell-integration-results.md).

This is an exploratory investigation with conditional implementation. Recast
under `create-plan`; H105-H112 identifiers and the original scientific gates
are retained. Execution status is owned by the linked record. The preceding H97-H104 runs remain
immutable starting evidence, not results of this plan.

## Objective and predictions

Represent incoming illumination between angular samples, then integrate that
representation against the outgoing Mie phase function. Establish separately:

1. Whether a practical weight engine accurately integrates a fixed illumination
   reconstruction. Reproducing the H100 bilinear field must reproduce its
   strengths AND regressions; a different implementation is not a new physical
   correction.
2. Whether an improved, positive reconstruction reduces physical error across
   views and both atmospheres without relying on cancellation.
3. Whether the complete builder can afford the method and retain current
   runtime lookup behavior.

Start with spherical geometry, distant Sun and pure local atmospheric J2 with
the inherited black boundary. Local-Sun/flat geometry requires a separately
registered matched extension; this plan does not establish its appearance.

For outgoing direction v, define an outgoing-independent positive basis:

```text
L_hat(w) = sum_i L_i b_i(w),  b_i(w) >= 0,  sum_i b_i(w) = 1
K_i(v)  = integral b_i(w) P(w dot v) dOmega
D(v)    = sum_i K_i(v)
M_raw   = beta_M sum_i L_i K_i(v)
J(v)    = R_A(v) + M_raw / D(v)
```

Keep original Rayleigh R_A and the shared Mie normalization fixed initially.
Retain raw Mie, D, normalized Mie and total J independently. Exact integration
gives D=1; preserve the numerical defect rather than fitting it away. Accurate
integration of L_hat does not prove that L_hat approximates physical L well.

Completion means a supported answer to these three questions, not necessarily
a successful candidate. A negative or cost-limited result can complete the
investigation after its applicable checks and bounded leads. Local J2 parity
alone cannot establish physical improvement, N4 benefit, B1 success or a
production correction. Preserve unchanged production and its twilight behavior;
full-cache qualification still requires matching or improving both named paper
RMSE controls below. libRadtran is an isolated matched reference, not a
replacement for that full-cache acceptance criterion.

| Hypothesis | Supporting evidence | Contradiction or unresolved result |
| --- | --- | --- |
| Shared basis weights can reproduce the same H100 illumination model economically | H106 independent parity and H107 measured practical cost route | Numerical failure rejects that engine; excessive cost limits that implementation |
| A positive representation can reduce physical error without transferring it elsewhere | H108 joint gains and protected cases in both profiles, then H109 qualification | A resolved protected regression rejects the variant; insufficient reference precision is inconclusive |
| Local gains survive global recurrence and paper scoring | H110 pure/cumulative order evidence and H111 full B1 plus protected twilight | A local-only gain cannot pass; recurrence or aggregate regression prevents qualification |

## Milestones, estimates and evidence contract

H105-H107 earn the first cost-feasibility decision;
H108 may be a bounded scientific follow-on even after a cost failure. H109-H111
are earned expansions. H112 monitoring applies throughout, with a final report
for every executed route, including early rejection.

| Milestone | Outcome and dependency | Reviewable evidence | Initial elapsed estimate |
| --- | --- | --- | --- |
| H105 | Authenticate the starting representation and controls | Reuse/identity ledger and an annotated inherited-support image | About 20 min |
| H106 | Qualify integration of the identical H100 model after H105 | Basis/moment proofs, independent parity and error/work image | 20-60 min |
| H107 | Establish provisional cost feasibility after H106 | GPU block timings, reuse/storage schedule and cost plot | 20-40 min |
| H108 | Test whether a new reconstruction improves physical accuracy | Signed component/gain/protection comparisons in both profiles | 20-60 min for the first bounded wave |
| H109 | Qualify robustness and then genuinely fresh cases | Frozen controls, confidence bounds and protected-case report | Unknown until H107/H108 throughput and reference demand are measured |
| H110 | Establish recurrence and native practicality after H109 | Pure/cumulative J2-J4, twilight witness and actual native cost | Unknown until a survivor and native pilot exist |
| H111 | Establish full paper score and scene behavior after H110 | Interval RMSE, dome comparisons and matched scene captures | Unknown until an admitted native build is timed |
| H112 | Preserve progress and close the executed investigation | Final replay, concise results and linked decision history | About 20 min for local-only closure; update for earned expansions |

These are rough predictions including implementation/analysis gaps, not measured
GPU times or deadlines. The preceding campaign spanned 39m10s from first run
allocation to final proof, but did not implement or benchmark this new engine.
Initially allow roughly 60-120 minutes to the H107 decision, or 100-200 minutes
including one H108 wave and local closure if earned; early rejection may finish
sooner. Do not add unknown conditional stages into a fabricated total estimate.
H105 checks these ranges against available assets; update them after the first
H106 block and H107 pilot. Before each unknown stage, measure its needed pilot
or retained throughput and publish a time/storage estimate before expansion.
The 60-minute point is an advisory progress assessment, not a stopping rule.

Use one owning `illumination-basis-execution.md`, created only when execution is
selected and before H105 authentication or allocation begins. Record
consequential questions/decisions, completed work, evidence
identities, estimates versus measurements, limitations, exact next action and
outstanding checks. At every milestone end, add a short report there covering:
completed deliverables and links; observations versus interpretation; remaining
uncertainty/verification; and disposition plus next action. Reports do not
request owner approval, enable reviewers, or require separate report files.
The final `illumination-basis-results.md` may summarize and link this same record
to satisfy both create-plan and independent-execution reporting.

Publish useful artifacts through commentary and the execution record as soon as
available, including partial milestone evidence; do not wait for completion.
H105 first links and annotates inherited geometry/illumination evidence, clearly
labeled reused. H106 adds actual candidate support/parity images as soon as a
qualified block exists; H107 adds measured error/work. H108 and later stages
publish new physical comparisons when available. Retain settings, provenance and
common comparison conditions. Numerical three-band maps are not sky-color
swatches; actual colors/scenes require the conditional 15/40-band spectra.

Resource admission remains shared across milestones: the inherited retained
limit is 1152 MiB, with an initial campaign estimate of 4-12 MiB for local
math/reuse/figures, not a fresh allowance for each stage. H105 measures current
use; H106/H107 stream bounded K blocks. Broad references and native/B1 output
sizes remain unknown until their row/control counts and pilot sizes are known.
Apply H112's standing-authority amendment and preservation rules before any
needed expansion; this plan revision itself changes no resource limit.

## H105: register representation, controls and reuse

Purpose: establish exactly what can be reused before building a new operator.
First executable step, after owner selection: initialize the execution record,
measure retention and authenticate the listed source artifacts, beginning with
accepted00581 and its parent ledger.

Authenticate accepted00566 geometry/materials,00570 actual-angle illumination,
00575 refined output checks,00576 reconstruction,00578 finite-path contrasts,
00579 final decisions and00581 verification. Preserve earlier runs unchanged.
Record artifact hashes, schemas, spectral/source/transport identities and exact
equations for every derivative. Do not infer radiance from summary scores.

Begin with k=.5, construction1, and the exposed near-Sun red/sideways green
witnesses in both profiles. Expand to all3bands at those points only after
mathematical admission, then the complete six-point panel. Keep k=.35 as a
small known-adverse control; another warp sweep is not the initial proposal.
Bands3/5/8 are469.6667/532.3333/626.3333nm. Preserve frozen floors:
paper4.742795497816345e-14, Toronto4.888931382758012e-14.

Register these distinct controls before new results:

| Control | Question it answers |
| --- | --- |
| A, original point quadrature | Does the whole change improve the inherited calculation? |
| C, constant-per-cell integrated phase | What changes when illumination varies inside a cell? |
| H100 bilinear reconstruction, independently integrated | Does the new engine integrate the SAME model correctly? |
| Cache-free continuous physical J2 reference | Does that model improve physical accuracy? |
| Complete Sun1024/1408/2048/4096 rules | What is the actual accuracy/work tradeoff? |

Choose whole comparators, never different controls' best statistics. Reserve
the eight still-unexposed H97 physical tuples by reference to that registration;
do not use them for development or call old targets fresh validation.

Deliver a registration/reuse ledger, the exact witness/control schedule and the
first annotated inherited-support image. Reuse fails if hashes, schemas,
geometry, material, source spectrum, path operator/resolution or reconstruction
identity do not support the intended claim; authenticate unchanged portions and
derive replacements only in new runs. Do not replace missing radiance with scores.
Gate: only a registered compatible model/control set advances to H106. A missing
or incompatible parent holds the affected comparison, not all independent work;
an unattainable required baseline ends that route with the limitation recorded.
Finish with the H105 execution-record report and measured/revised estimates.

## H106: prove a weight engine for the existing reconstruction

First expose H100's existing reconstruction as explicit basis coefficients,
including its sector support, clamped endpoints, row fallback and limiting
cases. Those choices depend on geometry, not on outgoing direction or L values.
Prove nonnegative coefficients, partition of unity, field-scale nodal
reproduction and that coefficient assembly reproduces the old evaluator.
Do not silently replace its boundary behavior while claiming parity.

Integrate the basis weights on the GPU in bounded outgoing/patch blocks.
At a quadrature direction, evaluate its small donor stencil and distribute
P*dOmega among those donors. Alternatively accumulate the constant and slope
moments of each patch, then derive equivalent nodal weights. Final weights must
be finite and nonnegative; signed intermediate moments require stability checks.
Do not clip negative weights or globally rescale a failed mass check to pass.

For Toronto, split at the actual83cosine knots and turning points. Use analytic
azimuth moments only where the basis and coordinate map permit them; retain
the correct solid-angle Jacobian. Paper's analytic phase needs its own qualified
quadrature. Near forward scattering, qualify float32 cosine/phase evaluation
against binary64: the earlier few-ppm GPU mass failure must not be inherited.
GPU is preferred; binary64 CPU is a small calibration/oracle route, not evidence
that an expensive CPU prototype is a practical builder.

Use an independently implemented outgoing-coordinate reference that evaluates
the same L_hat directly, without consuming candidate K or its membership code.
Check constants, smooth fields with independent phase-moment targets, displaced
narrow lobes, and steps on/near physical and patch boundaries. Distinguish
continuous manufactured targets from their nodal reconstruction errors.

Admission: nonnegative finite weights; abs(sum K-1)<=1e-6; two successive
sum(abs(delta K))<=5e-4. Numerical integration must agree independently within
an empirical normalized-output envelope<=0.1% of reference/frozen-floor scale.
These refinements are diagnostics, not rigorous bounds. Before any resolved
decision, the numerical/path envelope must also be<=10% of the nearest relevant
one-sided decision-bound distance and preserve the decision over that envelope.
Otherwise refine the affected calculation or label it unresolved.

Early hatch: diagnose signs, measure, support and precision before tracing any
new illumination. If parity fails, do not attribute the discrepancy to physics.
Allow one specifically diagnosed numerical repair, preserving useful payloads.

Deliver serialized basis identities and proof results plus independently checked
fixed-model parity at both profile witnesses. Publish candidate support and
parity/convergence images when the first usable block exists. Gate: parity and
numerical admission permit the H107 cost pilot; a resolved engine failure rejects
that engine and blocks its physical claims. An unresolved envelope holds only
the affected decision while a justified attainable refinement is evaluated.
After the diagnosed repair, do not repeat the same failed mechanism blindly;
any distinct alternative follows H112's bounded-branch rule. Report numerical
correctness separately from physical accuracy in the H106 milestone entry.

## H107: measure builder cost before a broad sweep

Measure representative blocks for near-Sun/sideways outgoing directions, low/
high Sun, ground/altitude, both profiles and several bands. Include an outgoing
block-size sweep, warm/cold setup and at least3timing repeats for prospective
settings. Separate GPU execution, uploads/readback, basis setup, L transport,
reduction and persistent/scratch memory. Batch outgoing directions and keep
reductions resident where useful; avoid turning per-direction browser dispatch
overhead into an alleged intrinsic cost.

Use the inherited8640rows,4374outgoing directions and40bands for explicit work
and storage estimates. Never allocate the earlier22.5TiB dense weight tensor.
For the initial implementation, stream K and reduce immediately. L samples
are reused across outgoing directions. K reuse across bands/rows requires exact
geometry/material identity; K reuse across orders requires retaining it across
global recurrence passes. Otherwise charge recomputation on every order.

Benchmark the complete point-rule calculation at matching L budgets and report
the cost against the authenticated native baseline separately. Faster than the
H100 high-sample oracle alone is not a practical success. Freeze a timing model,
its observed variability and whole comparator before broad scoring. Proposed
practical route: >=20% mean/worst error gain with projected total build time
<=1.25x its comparator, or >=25% less total build time with mean/worst within10%,
without protected regressions. Confirm actual native time before qualification;
do not promote an extrapolation to a measured full-build result.

H107's cost admission is provisional: measure feasibility without requiring the
unchanged H100 model to pass H108's new-representation physical gates. Identify
which part of the combined accuracy/cost criterion is still unmeasured. H108
must reprice its actual representatives, basis and required integration precision
against the frozen whole comparator before any H109 advancement; do not carry
an obsolete H100 cost estimate into a changed model's qualification.

Early hatch: an accurate but presently expensive engine may earn one bounded
scientific reconstruction test. A prospective practical method needs a measured
route through this cost gate. Reject a tested implementation's scaling without
claiming that every future basis method is inherently impractical.

Deliver the measured complete-comparator cost model, storage/reuse schedule and
error-versus-measured-work image. Gate: a prospective cost-supported route earns
H108's bounded physical screen, not a passed combined accuracy/cost claim.
Cost failure may earn only one bounded scientific H108
wave, with its projected work declared first; it does not earn H109/native/B1.
Record whether the route is practical, scientific-only, rejected or inconclusive
in the H107 report, with updated estimates for the next permitted step.

## H108: improve the illumination model in a controlled wave

Keep the exact H100 representation as the parity control. Test one new positive
piecewise-linear representation using triangles or quadrilateral patches with
explicit angular maps. The patch mesh must cover each physical region without
overlap/gaps; curved ground/horizontal boundaries must remain actual boundaries.
Straight connections between samples must not cross a curved physical boundary.
Prove partition of unity and correct Jacobians, including poles/tangencies and
changing ring/sector topology.

Before physically interpreting each new or nested-refined basis, apply the
relevant H106 mass/TV, positivity, independent same-model parity and normalized-
output/decision-envelope checks to that actual basis and support. Reuse unchanged
engine evidence; verify only the affected representation and numerical work.
These are focused numerical proof checks, not another reviewer pass or a rerun
of every H106 calculation. A fixed engine alone does not qualify a changed map.

Original Gauss samples do not automatically form boundary vertices or measured
cell averages. Register one-sided boundary extension where it is justified, or
add and trace explicit representatives on the required side. Do not extrapolate
with negative coefficients, mix opposite support regions or assign zero light
merely because a sample is labeled ground. Charge every new representative.

Initial scientific screen: the two exposed witnesses, both profiles,3bands at
k=.5; then all six points (36fields) if no resolved rejection is already clear.
Require the Toronto near-Sun red raw-Mie defect to fall>=50% and sideways green
total-J error>=20% versus the registered base-grid A. Protect every other case/profile
against complete Sun4096 using errorCandidate-errorControl-max(.2*errorControl,
.02). A baseline defect too small for the reference precision is inconclusive.
H100 bilinear already passes one near-Sun exploratory gain: do not count its
reproduction as a newly discovered physical improvement.

Use the inherited2000 shared-history bootstrap resamples, seed1013904223,
preserving band covariance and independent group/profile histories. Register
paired quantities and precision rules before exposure. Raw species/numerator,
normalization and total error must all remain visible.

If the new model reveals a specific representation defect, allow one controlled
nested-refinement variant. Select patches by geometry or outgoing-independent
illumination variation; never tune nodes to a reference outgoing ray. Keep at
most two live new model variants. Changed node counts receive whole controls
at their actual trace budgets, with every new L evaluation charged. Keep the
engine fixed while testing representation, and representation fixed while
testing integration precision.

Retain64/128path comparisons. Any species/raw/normalized change>1% triggers256;
closer decisions require tighter margin-sensitive checks even below1%. For a
linear basis, integrate signed nodal path differences with shared angular points
to avoid a loose max-node bound. This remains a finite-path contrast, not a
continuous physical error certificate.

Separate numerical error from reconstruction/path residual:

```text
J_candidate-J_true = (R_A-R_true)
                   + (m_candidate-m_same-model-oracle)
                   + (m_same-model-oracle-M_true)
```

The last term combines model representation and finite-path transport. If a
live decision needs pure attribution, acquire a separately refined continuous
angular integral of the SAME finite-path actual-angle L operator at at most two
critical witnesses per profile. Charge those traces. Previous-cache
interpolation is not that oracle, and small64/128changes do not prove truth.

Publish signed error/contribution and reconstruction comparisons after this
wave and earlier when useful contrasts are available. Stop a configuration on
a resolved protected failure; refine references
only when an attainable unresolved margin could change its disposition.

Deliver a joint decision for the raw-Mie and total-J gain tests and the protected
panel, retaining the original metric/units of the inherited error criteria.
The protected expression above must have a nonpositive upper decision bound;
no isolated passing witness or corrected phase mass substitutes for the joint
gate. Reprice the actual method at the frozen comparator and require H107's
unchanged combined accuracy/cost criterion before H109; the earlier feasibility
admission is not its result. Resolved adverse effects reject that variant;
precision-limited evidence is inconclusive, with the attainable resolving
measurement and cost stated.
Only joint physical gains/protection plus an H107 practical cost route earn
H109. A scientific-only result may complete the local investigation or support
an explicitly bounded new lead, but cannot bypass admission to broad work.
Publish the H108 report with each tested variant's disposition and unearned work.

## H109: broad robustness and genuinely fresh qualification

Only a useful, cost-supported survivor earns the21unique exposed geometries,
both physical constructions, both profiles and3bands. Retain held-6; held-7 is
the known duplicate. Acquire missing repeat-construction illumination in new
runs. Test complete Sun1024/1408/2048/4096 controls as whole points, plus relevant
inherited corrected/outgoing-grid controls without mixing their statistics.
Apply both profile-level mean/worst and joint maximum protected margins.

For at most two finalists, freeze basis/grid construction, comparator, gain
profile/statistic, exact cost model, precision/refinement limits and seeds before
exposing the eight H97 reserved tuples. Use one-sided95% with one finalist,
97.5% each with two; require upper gain and joint protected bounds to pass.
Acquire matched cache-free pure-J2 physical histories in both atmospheres.
Old targets remain exploratory. Limited night signals need a registered
absolute criterion or justified bound; zero sampled paths alone are insufficient.

Deliver exposed-panel robustness separately from fresh qualification, including
whole-comparator mean/worst errors, paired confidence bounds, actual trace cost
and protected failures in both atmospheres. Publish broad error maps when useful;
do not expose the fresh eight until the frozen method and broad gate earn them.
Gate: a resolved broad failure rejects the candidate before fresh work; a fresh
failure rejects qualification without reusing those cases as fresh tuning data.
Unresolved bounds hold advancement, not permission to claim success. Only a
jointly qualified cost-supported finalist earns H110. Record the H109 report
and the exposure status of every reserved tuple.

## H110: conditional recurrence and native builder

Adapt a validated practical method within contained source. Prove physical
direction and basis identity across rows, wavelength, order and ground-support
evaluation; equal indices in different grids are not interchangeable directions.
Build pure/cumulative J2/J3/J4 microcases in both atmospheres, separating L1
transport from L2/L3 previous-cache reconstruction. Include a separately
registered sunset+60minute protected witness and full native timing/memory.
No local J2 gain alone implies an N4 improvement.

Before exposing the native pilot's results, register pure J2/J3/J4 and cumulative
N4 quantities, matched whole-native comparator, error units, uncertainty rule and
pass/fail/inconclusive conditions. Define the sunset+60-minute protected metric
and comparison settings then, using an applicable inherited criterion/reference
where available. Identify which decisions check recurrence identity, which test
physical accuracy, and which establish cost. Do not invent a broad new higher-
order reference campaign by default. If only recurrence correctness and cost
are established, report that limit and leave global accuracy to H111; do not
claim physical N4 improvement from correct identities or brighter spectra alone.

Deliver recurrence identities, pure/cumulative order spectra, the registered
late-twilight comparison and measured native time/memory against the frozen
whole comparator. Gate: recurrence identities and the preregistered protected
checks must pass, and actual full-builder cost must satisfy the H107 practical
route. Any physical-transfer claim requires its registered matched reference
and precision; leave unmeasured global accuracy to H111. An unresolved required
protected check holds advancement rather than silently passing.
A recurrence, identity, protected-case or practical failure rejects this native
configuration and skips H111; retain useful local findings. If a native pilot
changes the estimate materially, publish that fact before a large build.
Publish the H110 report and order/contribution images as evidence becomes useful.

## H111: conditional paper score and scene comparison

Only a native survivor earns the exact paper atmosphere/source/grass B1 test:
40wavelengths,31scored bands, all17intervals x81dome rays. Match or improve
authenticated H61Focused60 AND H55Original40 aggregate RMSE, publishing interval
changes and domes. Use libRadtran only for matched quantities/geometry it can
independently support; observer radiance is not local J2 source density.

Render matched15band paper/Toronto noon, sunset,+30/+60minute scenes with common
display/exposure. Preserve current production twilight comparisons. No atmosphere
or exposure fitting to pass. Runtime remains lookup-only; experimental basis
integration is a cache-building operation. Production promotion stays separate.

Deliver the 17-interval RMSE table, aggregates against both named controls, dome
comparisons and matched captures. Publish interval/dome progress from completed
spectra rather than waiting for every interval; never render incomplete bands
as completed physical color. Gate: a resolved aggregate regression fails
full-cache qualification even if isolated physical tests improved. Do not tune
atmosphere/exposure to rescue the score. The H111 report distinguishes paper
acceptance, protected twilight/scene observations, and remaining limitations;
an experimental pass still requires a separate production-promotion decision.

## H112: monitoring, adaptive follow-ons and completion

Prefer GPU for substantial integrations/tracing and renders; CPU for small
geometry/analytic checks and an independent calibration. One numerical GPU job
at a time, bounded dispatch and the existing30second progress contract. Publish
meaningful geometry, error/work and component images as soon as useful evidence
is available, including before milestone completion, without rendering every
batch. Real spectral colors require15/40band spectra; early3band errors remain
clearly labeled numerical diagrams. Separate setup, queue, GPU, readback, proof
and analysis/recovery time where observable; reuse telemetry rather than
rerunning scientific work only to obtain cleaner timing numbers.

The60minute point is a progress/resource review, not an automatic stop while
distinct useful progress continues. After the first measured pilot, update the
stage estimate. Follow a promising alternative only after recording a distinct
mechanism, falsifiable prediction, protected cases, cost and bounded next wave
before its results. Normally keep two live variants and one repair wave; two
waves merely transferring error require reassessment. Diagnose failures, reuse
completed payloads and retry in new runs when evidence supports a correction;
there is no blanket prohibition on justified retries.

Before a branch starts, record which gate it addresses, its supporting evidence,
measurement/comparator, estimated work and a continuation/rejection condition.
Prefer one small discriminating pilot to another broad grid sweep. An engine,
representation or scheduling alternative must isolate its changed mechanism
while retaining the other controls. An inherited resolved failure does not
become a new pass by changing its criterion. Scope of exits: reject a variant
on a resolved protected failure; skip its dependent expansion on failed admission;
hold only uncertainty-limited claims for attainable refinement. End the selected
investigation when its questions are answered and no cost-supported survivor or
distinct worthwhile bounded lead remains. If an actual governing limit prevents
required evidence, finish unaffected work and report the unresolved blocker and
resumption action; do not relabel missing evidence as a scientific rejection.
A justified negative answer is completion; there is no obligation to exhaust
every conceivable future method or revive failed routes.

Measure retention before allocation: last campaign ended near1137.3MiB under
1152MiB, so the remaining allowance is small. Initial math/reuse/figures are
estimated4-12MiB; measure manifests and actual payloads. Keep2MiB seal reserve,
1GiB live scratch disk and40GiB free disk. Record a justified allowance amendment
under standing owner authority if needed; preserve earlier evidence rather
than deleting it or seeking repeated routine budget approval.

All authored implementation stays below experiments/sky-accuracy-dials; output
below tmp/experiments/sky-accuracy-dials; owning documents stay here. Derive/check
canonical roots, reject links/junctions, preserve full derivation chains and
never edit existing source during an active snapshot-bound run. No experimental
unit-test tree or native helper compilation. Use local types, focused scientific
proof runners and checkpoint advice; no dedicated standards reviewers/audits.

Final replay covers the following checks applicable to the executed route:
basis coverage/positivity/identity, fixed-model parity,
independent physical precision, path contrasts, actual trace reuse, work/storage,
protected decisions, immutable artifacts, figures and cleanup. Complete with a
qualified candidate or a justified negative/cost-limited result after useful
bounded leads; label unresolved evidence honestly. Record every conditional
stage not triggered. An early registration/parity rejection does not owe the
unearned physical, recurrence or paper artifacts; identify those as untriggered
rather than passed. Save concise results and full decisions. The experiment
remains open unless the owner explicitly ends or suspends it.

## Plan critique and additional-review limits

The create-plan skill requires one read-only second-agent critique of this
recast before handoff. Trigger: the coherent planning-only draft is ready.
Question: does it preserve the scientific goals and original gates while making
evidence, costs, adaptive exits, reports and resumption executable and bounded?
Scope: this plan, its pre-recast snapshot, H97-H104 results and only the prior
execution timing/recovery context needed to assess estimates and reuse. No
source-code, full-artifact or repository-wide compliance review is requested.
Completion: the primary agent incorporates suggestions unless contrary to the
goals or explicit scope, records the disposition below, and checks coherence.
This gates the planning handoff, not an owner approval or experiment execution.

No additional reviews are scheduled. Milestone reports, numerical oracle
comparisons, self-verifying proof runners and checkpoint advice are distinct
from reviewer passes. Anticipated adaptive branches follow H112 without another
critique. If substantial replanning outside those bounds needs a further plan
critique, first record its reason/trigger, exact question, smallest affected
decision/artifact scope, necessary context, completion condition and whether it
gates further work. That cannot enable disabled standards reviewers/audits or
expand into reviewing the whole experiment by default.

Critique disposition: completed one read-only
[independent plan critique](../../../../../.codex-tmp/illumination-basis-recast/critique.md).
It found the original scientific gates preserved. All five recommendations were
incorporated: provisional H107 cost admission and H108 repricing; numerical
admission for each changed basis; preregistered H110 recurrence/twilight decisions;
route-specific final replay; and execution-record creation before H105 work.
No suggestions were rejected. The primary agent checked the resulting plan for
coherence; no further review round is scheduled. This is planning evidence,
not experimental results or a standards-compliance claim.

## Current resumption boundary

- Execution status: complete for the selected route; see results and execution
  record. No new numerical work is selected by retaining this plan.
- Starting scientific evidence: H97-H104, accepted00581 and immutable parents.
  The new results own accepted00594 and the executed bounded follow-ons.
- The allowed H112 continuation included the fixed convex midpoint registered
  in execution decision12; original numerical/physical criteria were unchanged.
- Conditional work: H109-H111 were unearned, not unfinished implementation
  obligations. Future practical methods require a new selected continuation.
- Final report: map the outcome to the three original questions; link evidence,
  complete consequential decisions, timings, scientific/local-type verification,
  checkpoints, limits and all untriggered work. Preserve unresolved questions and
  what new evidence would justify reopening a rejected route. Do not claim
  standards compliance. Production promotion and ending/suspending the experiment
  remain separate owner decisions.

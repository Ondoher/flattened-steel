# H126-H133: isolate and repair angular illumination reconstruction

Status: completed under owner-authorized independent execution. The
[results](reconstruction-mechanisms-results.md) and
[execution record](reconstruction-mechanisms-execution.md) own conclusions,
verification and decisions. All five screens and earned local follow-ons are
complete; physical-total admission remains incomplete. Production is unchanged.
This is an exploratory
follow-on to the completed [interior illumination diagnosis](interior-illumination-results.md),
not a reopening of its failed repair or acceptance criteria.

## Outcome, scope and ranking

Determine which calculations create the measured between-direction L1 reconstruction
error, then test whether a mechanism-based representation reduces it without hiding
error through cancellation. A defensible negative or inconclusive result completes
this investigation; a replacement cache is not required.

Promise is ranked by present evidence and ability to distinguish a cause, not by
an assumed likelihood of passing. Execute the screens in this order; a failed
repair does not cancel the remaining hypothesis screens.

| Rank | Hypothesis | Why it merits this position | Discriminating result |
| --- | --- | --- | --- |
| 1 | Source phase and transport amplitude need separate reconstruction | Accurate nodes and phase integration leave substantial interior bias; changing only phase-coordinate weights helped little | Factoring the exact source phase exposes amplitude curvature and improves an independently evaluated reconstruction |
| 2 | Azimuth interpolation, polar interpolation, or their interaction causes the residual | The failed phase-coordinate intervention retained azimuth donors; this calculation remains unisolated | Exact-coordinate substitutions resolve which interpolation operation contributes error |
| 3 | Cells straddle physical path/support transitions | Errors vary with altitude and Sun position; prior boundary-aware grids helped selectively but did not qualify broadly | True transition-crossing cells have excess error, and a controlled boundary treatment beats sham splits |
| 4 | Incoming Rayleigh-origin and aerosol-origin light need different representations | Their errors demonstrably cancel or reinforce, but cancellation alone does not establish different optimal models | A physically prescribed origin-specific rule improves both component and combined measures |
| 5 | Node placement misses important features more than node count alone suggests | Earlier grids traded errors between geometries; alignment may matter, but this is a broader and more expensive intervention | Repeated equal-count placements show sensitivity, and targeted refinement transfers better than equal-cost uniform refinement |

These hypotheses overlap. Report interactions rather than assign the same error
independently to multiple causes. Physical transitions can create amplitude or
azimuth curvature; species separation is a representation choice, not a new
physical scattering process.

Scope remains spherical distant-Sun, black-boundary L1-to-local-pure-J2, both
registered paper and Toronto optical profiles. Toronto is the registered aerosol
phase/SSA variant, not actual Toronto weather. Use bands 3/5/8 (469.6667,
532.3333, 626.3333 nm), construction 1, k=.5 and the existing 4096-node grid as
the starting point. No atmosphere, source, exposure or mixture-fraction fitting.
No runtime shader integration, production writes, flat/local extrapolation, N3/N4,
40-wavelength B1 or scenes are authorized by this plan. Local gains cannot claim
improved paper RMSE or horizon appearance. Those need a later selected plan.

## Baselines, reuse and scientific contract

Authenticate accepted00634 and its source/parent inventory. Reuse independent
nodal/interior tables and actual query measures from 00620, 00623-00629, causal
results00630, derivatives00631-00633, and compatible physical references/operators
reached through those inventories. Preserve every original seal, progress failure,
recovery qualification and precision label. In particular, 00622 did not pass its
monitoring contract; 00623 independently qualifies its numerical derivatives.
Recompute derivatives into new immutable runs, never patch an old artifact.

The primary same-node representation baseline is the fixed .5 midpoint. Unchanged
H100 and sector are explanatory controls; complete Sun4096 remains an accuracy/cost
comparator, not interchangeable donor values. Diagnose with independent nodal light;
for an earned practical candidate also replay the actual retained old nodal light.
Do not attribute the small old-node input error to a new interpolation scheme.

Initial panel: node-89 and reserved-out-1, two profiles, three bands =12 physical
fields. Transfer panel adds held-0 through held-3 for36 physical fields total.
All are exposed development cases. All eight H97 fresh physical tuples remain
unexposed. Use prior full-support queries for economical descriptive screens;
register disjoint new streams before decisive intervention claims. Do not rename
already inspected queries as independent validation.

For each incoming origin s, direct light L*_s and reconstructed light R_s, report:

```text
e_s(w) = R_s(w) - L*_s(w)
E_s    = beta_M integral P_M(w,v) e_s(w) dw
A_s    = beta_M integral P_M(w,v) abs(e_s(w)) dw
E_sum  = E_R + E_M
A_sum  = beta_M integral P_M(w,v) abs(e_R(w)+e_M(w)) dw
A_origins = A_R + A_M
```

Include outgoing-Rayleigh-weighted counterparts, combined local J2 error against
matched physical truth, signed angular regions and component cancellation. Report
raw numerators and phase mass, not just normalized totals. Keep all values in
physical units and normalized by the original matched reference/floor. Never use
the candidate's output as its own normalization. Outgoing reweightings without
matched physical truth remain reconstruction diagnostics only.

Use common queries and paired32-batch estimates. Carry conservative finite
view/column/GPU and reconstruction-evaluation envelopes, including uncertainty
in sampled envelopes; retained old errors are not sampling noise. Refinements
are empirical controls, not certified global bounds. New-query ceilings are
8192/32768/131072 per physical field,32 batches, applied only where necessary.
Additional donor evaluations count separately and must be costed before tracing.
Sequential precision selection is disclosed; do not claim simultaneous coverage.

New diagnostic gates, frozen before new results:

- Mechanism support is separate from repair admission. Resolve a material,
  predicted response under controlled substitutions and protections, or bound
  its absence at the tested scope; structural association alone is suggestive.
  A supported cause can have an unsuccessful repair. Inconclusive measurement
  cannot reject the cause. Every hypothesis receives a reported screen even
  when its conditional repair is skipped.
- A material signed effect exceeds0.2% of the matched J2/floor, with combined
  halfwidth/envelope <=0.1 percentage point and numerical envelope <=10% of its
  resolved threshold distance. Preserve prior decisions under their old gates.
- A mechanism screen is promising if its paired lower bound shows >=20% reduction
  in A_origins at a preregistered material witness. If the baseline absolute error
  is below numerical resolution, its percentage gain is undefined. Absence of a
  20% gain rejects that tested intervention, not automatically the hypothesis.
- Practical local admission requires >=20% pooled A_origins reduction within
  each profile separately, no field/component A_s or A_sum regression greater
  than0.1 percentage point, and no signed local-J2 absolute-error regression
  greater than0.1 percentage point, all using combined bounds. Near-zero baseline
  totals do not permit unbounded relative ratios. Both profiles and every field
  remain visible; gains are not averaged across profiles to hide a regression.
- Define that pool as the equally weighted mean of fieldwise normalized A_origins,
  over six geometries times three bands within each profile. Compare candidate
  versus baseline means (ratio of these means), not the mean of fieldwise ratios.
  A pilot pool uses its two geometries and is not the full-panel admission.
  Preserve paired covariance across reused models/bands; independent receiver/
  profile streams remain distinct. Freeze a joint/batch resampling procedure
  before new results, and retain all casewise uncertainty/protection decisions.
- To call a cause principal, use a closed factorial/component budget with joint
  bounds. A large ablation response or correlation alone is not causal attribution.
- Pass, reject and inconclusive are distinct. At the declared precision ceiling,
  retain unresolved decisions; do not relax thresholds or keep increasing samples.

These are diagnostic/practical-local gates, not inherited full-cache qualification.
Positive weights, finite values, physical support, exact nodal reproduction and
appropriate constant/analytic limits must pass before physical candidate claims.
For a factored representation, test constants of its reconstructed amplitude and
analytic phase-times-constant fields; disclose if arbitrary constant radiance is
not preserved. Do not silently claim both properties are identical. The physical
outgoing phase remains normalized; factored effective nodal weights need not sum
to one for constant radiance. Do not renormalize those effective weights and
silently change the physical integral. Verify the restored phase-times-constant
amplitude integral against an independent analytic/numerical control.

## Milestones and early evidence

| Milestone | Decision and reviewable deliverable | Initial elapsed estimate |
| --- | --- | --- |
| H126 | Authenticate reuse; freeze witnesses, metrics and probe cost; first residual/region table | 20 min |
| H127 | Rank1: source-phase/amplitude diagnosis and one factored representation | 20-40 min |
| H128 | Rank2: polar/azimuth factorial isolation | 20-60 min |
| H129 | Rank3: true/sham boundary attribution and earned repair | 20-40 min |
| H130 | Rank4: origin-specific reconstruction screen using earned mechanisms | 20-40 min |
| H131 | Rank5: placement sensitivity and equal-cost targeted refinement | 40-80 min, conditional new tracing |
| H132 | Earned survivors: both-profile36-field transfer and measured practical cost | Unknown until H126/H128 donor timings and survivor count |
| H133 | Replay actual route, types, cleanup and final conclusions | 20 min |

Approximately160-300 minutes for screens and final reporting, with substantial
uncertainty in extra oracle directions; conditional transfer is estimated before
launch. These are elapsed estimates, not pure GPU timings or additive promises.
At60 minutes and subsequent meaningful boundaries assess progress, uncertainty,
remaining work and resources; productive work may continue beyond guidance.

Publish useful tables/results as available, starting with reused evidence at
H126. Every milestone adds a concise report to one execution record: completed
work and links, observations versus interpretation, uncertainty/cost, disposition
and next step. Native CSV/JSON and Markdown are the default evidence. An angular
residual map is optional only if its spatial relation to seams, boundaries or
lobes cannot be adequately conveyed in native data/text; state that need first.
No table/status image, swatch or scene is required by these local three-band tests.

## H126: registration and economical first evidence

1. Verify exact geometry, optical inputs, frame/signs, bands, nodes, source hashes,
   query PDF/Jacobian, refinements and parent provenance. Invalid identities hold
   only affected comparisons until repaired; do not regenerate compatible light.
2. Freeze the12-field pilot and36-field transfer list. Primary witnesses include
   the three qualified prior midpoint cases: paper opposite-Sun blue/red and
   Toronto near-Sun green. Keep all other pilot bands as protections, including
   unresolved Toronto near-Sun red; do not promote its earlier point estimate.
3. Tabulate retained error by ring/sector, Sun angle, azimuth, physical transitions
   and origin. Weight by physical solid angle and actual phase/PDF; oversampled
   counts are not physical contributions. Record overlap between classifications.
4. Freeze a geometry-stratified selection of diagnostic cells, including seams,
   smooth controls and transition candidates before new light is inspected.
   Measure a256-direction GPU pilot plus required donor values; estimate distinct
   new directions, deduplication, bytes and time for each remaining screen.
   Before mixed-coordinate expansion, record measured per-field donor counts and
   a concrete maximum direction/elapsed allocation for the next diagnostic block.
   Full-support confirmation requires a revised forecast; reaching a block cap
   triggers a recorded value/progress decision, not an automatic whole-run retry.

First executable step is parent/query authentication and the reused residual table.

## H127: rank1, reconstruct transport amplitude separately from source phase

1. In this distant-Sun L1 scope, establish analytically and with direct controls
   `L*_s(w)=P_source,s(dot(w,Sun))*T_s(w)`. Here T_s is a path-integrated amplitude,
   not local density. Audit source-angle conventions and actual Toronto phase
   tables. This factorization is not assumed valid for local Sun or later orders.
2. Compare amplitude and radiance curvature on the same donor/interior directions.
   Distinguish divisions near negligible phase/light from a physical improvement;
   use analytical limiting evaluations or mark unresolved, without a fitted floor.
   Phase division changes units/scales: judge smoothness through interpolation
   residuals after restoring the exact phase, with the original physical weights
   and denominator. Include phase-times-known-amplitude manufactures and selected
   independently integrated phase-free amplitudes; analytic factorization alone
   does not prove that the remaining amplitude is easy to interpolate.
3. Freeze the positive factored model: interpolate donor T_s with the original
   basis, then multiply by the exact source phase at the query direction. This
   differs from H124, which changed ring weights while still blending radiance.
   Test manufacture, support, nodal and positivity controls before physical metrics.
4. Evaluate on retained queries descriptively; if promising, register and measure
   a new-seed paired confirmation. Reject this repair if its gain gate fails.
   Remaining amplitude curvature is a finding, not proof that all factoring fails.

## H128: rank2, isolate coordinate interpolation and interactions

Use each actual original stencil with query coordinates (m,phi), donor coordinates
(m_i,phi_i), positive weights b_i and independent direct light. Construct four
diagnostic reconstructions without changing weights, physical medium or phase:

```text
R00 = sum b_i L*(m_i,phi_i)       original interpolation
R10 = sum b_i L*(m,phi_i)         exact polar coordinate at each donor azimuth
R01 = sum b_i L*(m_i,phi)         exact azimuth at each donor polar coordinate
R11 = L*(m,phi)                  both coordinates exact
```

1. Use the exact physical inverse of the retained Sun-aligned frame and audit
   poles, azimuth wrap and seam/support cases independently. These substitutions
   need not remain within one physical support region; classify such crossings.
2. Verify signed closure of `(R10-R00)+(R01-R00)+interaction=R11-R00`, with
   `interaction=R11-R10-R01+R00`. Also compare absolute errors; never add their
   absolute reductions as independent causes. Use both origin components.
   Report both conditional paths R00->R10->R11 and R00->R01->R11. The first-step
   effects are conditional on the other coordinate; a dominant interaction
   supports coupled error rather than a unique polar/azimuth culprit. R11 is
   truth by construction: closure checks bookkeeping, not independent physics.
3. Apply the same diagnostic to the factored model if H127 supports it; otherwise
   preserve the original radiance baseline. Keep results labeled by baseline.
4. Trace only deduplicated mixed-coordinate directions needed for registered
   cells initially. Expand to unbiased full-support paired estimates only after
   measuring donor cost. Targeted cells alone cannot establish sphere-wide gain.
5. A resolved dominant coordinate earns one fixed higher-resolution or
   shape-preserving local interpolation test, costed and registered first.
   Oracle substitutions are diagnostic tools, never proposed runtime lookups.

## H129: rank3, test physical transitions without conflating seams

1. Distinguish ground-hit versus atmosphere-exit rays, tangent geometry, changes
   in directly illuminated path support, mesh seams and smooth control regions.
   Compute labels from independent geometry, not candidate membership. Ray path
   changes are not automatically discontinuities in integrated radiance.
2. Compare error concentration at true transitions with smooth matched controls
   and sham boundaries matched in angular area, donor spacing and sample count.
   Reuse support categories from H126; control for Sun angle and ring density.
3. If concentration and a material effect resolve, register one boundary-split
   reconstruction. New one-sided values require independent evaluation and cost;
   never invent samples by clipping old donor weights or setting a region to zero.
4. A split must beat its equal-cost sham/control, preserve continuity where physics
   requires it, and pass both-profile/component gates. Failure rejects that split;
   absent concentration weakens this cause only at measured resolution.

## H130: rank4, origin-specific representation

1. Use prior and new A_R/A_M, curvature, coordinate and support results to identify
   whether the two origins require different operations. Opposing signed errors
   alone do not earn a special rule or a fitted mixture.
2. If distinct behavior resolves, freeze one origin-specific representation using
   the earned physical mechanisms, with no per-reference coefficient fitting.
   Compare original, shared-repair and split-repair results on identical queries.
3. Require both origin errors and combined metrics to meet the registered gates.
   If only cancellation improves, reject the claimed correction. If no distinct
   behavior resolves, report the screen as unsupported/inconclusive and skip the
   candidate. Separate caches or a new runtime layout are not built here.

## H131: rank5, placement and targeted density

1. Freeze three same-count placements: original and two deterministic azimuth
   offsets preserving polar rings, Sun axis and horizon/support rules. Charge
   independent nodal evaluations; do not interpolate old L to populate new nodes.
   This isolates azimuth placement, not all possible grid alignment errors.
2. Start with registered cells and same old/new physical queries. If H128 identifies
   polar error, add one bounded ring-position perturbation preserving hard support
   boundaries. Record its distinct prediction before tracing; do not silently
   rotate the physical atmosphere or move the source.
3. Only if material placement/curvature sensitivity resolves, compare a20% added-node
   budget allocated by geometry/training residuals against the same added-node
   cost spread uniformly. Use geometry-only rules or frozen development training;
   candidate confirmation directions and transfer cells must not train allocation.
4. Freeze placement/refinement rules before new-seed confirmation. Report nodes,
   direct-L calls, weights, memory and total elapsed work. A local win without
   cost/transfer protection remains a diagnostic. If there is no sensitivity,
   skip costly refinement while retaining all placement results.

## H132: conditional transfer, practical alternatives and stopping

Carry at most two scientifically distinct survivors at once. Freeze their rules
before the24 additional physical fields. Require the complete36-field, both-profile
local admission gates above. Report best/worst cases, cancellation and uncertainty;
do not rescue a failure by choosing a favorable subset or tuning mixtures.

Distinguish direct oracle assistance from build-feasible candidates. Time preparation,
distinct illumination traces, weight generation, transfer/readback and evaluation.
Prefer resident hardware GPU batches; use binary64 CPU for independent calibration
and small analysis. No production architectural rules are imposed on this prototype.
No per-frame tracing is proposed. Full-cache/native feasibility remains unqualified.

Evidence may open a new mechanism within this local scope. Before executing it,
record supporting data, changed calculation, falsifiable prediction, frozen controls,
bounded cost and gain/protection gate. Permit one new branch at a time, initially
one20-minute diagnostic block; extend only for distinct positive progress. A new
branch cannot weaken old gates, change physical inputs, consume fresh H97 tuples
or silently enter full-cache work. Two unsuccessful variants without a new
mechanistic prediction end that branch, not unaffected screens. New questions
outside this scope are recorded for later owner selection.

## H133: verification, report and resumption

Write a final report ranking supported causes, interventions and unresolved
questions against all five original hypotheses. Distinguish exact decomposition,
physical attribution, practical candidate and untested production consequences.
Replay actual derivatives, query/source/parent identities, candidate controls,
uncertainty, gates, numerical closures and cleanup; local type checking is required
after authored code changes. No experimental unit-test tree or native helper build.

New authored code belongs under `experiments/sky-accuracy-dials/reconstruction-mechanisms/`;
reuse existing helpers read-only. Generated runs/scratch remain under the established
ignored experiment root and its immutable run contract. Use the existing allocator,
real-path/junction protections, progress/heartbeat contract and one GPU job at a
time. Preserve accepted source snapshots. Diagnose and retry only affected work
with new evidence; do not impose a blanket retry ban or overwrite partial runs.

The last accepted retention measurement is about1292.1MiB under1408MiB, scratch0.
Re-measure before execution; initial compact screens are estimated at20-60MiB,
while new donor tables can cost more. Respect the allocator's current allowance,
2MiB sealing reserve,1GiB scratch and40GiB free-disk minimum. Use the owner's
standing authority for justified retention amendments, documenting measured use,
forecast and new limit before allocation. Add no new system/GPU reserve guard;
respond to actual allocation/device failures. Release browser/GPU resources and
only owned reproducible scratch; never delete prior evidence to fit the budget.

Use `reconstruction-mechanisms-execution.md` for milestones, decisions, estimates,
artifact links and next action, and `reconstruction-mechanisms-results.md` for the
final synthesis, created when execution begins. Keep this plan as the canonical
sequence; update current topic status at material boundaries. No numerical work
is authorized solely by saving or critiquing this plan.

## Plan critique

Completed one read-only second-agent critique of this plan's hypothesis ranking,
discriminating interventions, statistical gates, cost, reuse and alignment with
the owner's goals, supported by the interior-illumination and positive-mixture
results. The critique supports retaining the ranking. All five recommendations
are incorporated: separate mechanism conclusions from repair gates; define the
equal-field profile pool and paired covariance; report both coordinate paths and
interaction; compare restored amplitudes in physical units with manufactured
controls; and cost/cap mixed-coordinate oracle expansion before launch. Primary
self-review also makes factored effective-weight normalization explicit. No
recommendation was rejected. This was not a standards review or audit.
No further review is scheduled during execution. A materially changed overall
approach receives only the bounded plan critique required by create-plan; expected
evidence-driven adaptations use the recorded decision process without new reviews.

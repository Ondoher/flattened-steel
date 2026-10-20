# H120-H125: independent illumination probes inside angular cells

Status: completed diagnostic; see [results](interior-illumination-results.md).
Material reconstruction bias is supported; the tested repair is rejected and
unresolved precision remains explicit. The
[execution record](interior-illumination-execution.md) owns decisions and verification.
This investigation follows [H113-H119](positive-mixture-results.md) without
reopening that completed plan, changing its gates or authorizing production work.

## Question and completion

Test the inference that illumination reconstructed between incoming angular
samples explains a material part of the remaining local scattering error, and
why a reconstruction can help Toronto while worsening the paper atmosphere.
Distinguish that inference from errors already present at the stored nodes,
angular integration of the chosen reconstruction, and unchanged Rayleigh error.

Completion means a qualified signed error decomposition at the selected witnesses,
a both-atmosphere transfer assessment at the scope earned, and a supported
accept/reject/inconclusive conclusion about the inference. A working replacement
cache is not required to answer this diagnostic question. A positive result earns
one bounded causal repair experiment; a negative result earns investigation of
the identified competing cause. Full recurrence, B1 scoring and promotion remain
separate work, rather than automatic consequences of a local gain.

The initial scope is spherical, distant-source, black-boundary L1-to-J2, with
the exact registered paper and Toronto optical profiles. It is not a new
flat/local-source calculation or a measured Toronto-weather validation. Here
"paper" names the physical inputs; local J2 errors are not paper RMSE scores.

## Starting evidence and reuse

- [Phase-cell results](phase-cell-integration-results.md): accurate phase weights
  can converge while the piecewise-constant illumination remains inaccurate.
- [Basis results](illumination-basis-results.md): H100 and curved-sector positive
  interpolation give different physical residuals with identical sampled light.
- [Positive-mixture results](positive-mixture-results.md): the fixed midpoint
  improves Toronto's 36-field mean from 1.7380% to 0.8152%, while paper worsens
  from 0.5212% to 0.6427%. These are exposed local development comparisons.
- [Sunset attribution](sunset-j2-results.md): a large error can enter the incoming
  angular integral at an exact cache node, before later-order interpolation.

Authenticate accepted 00566 registration, retained incident packets reached by
`phase-cells/field.mjs`, calibrated weights and same-model oracles in 00587/00590/
00593/00596/00600/00608, final physical references in 00613, and final decisions/
replay 00615/00618. Reuse only compatible geometry, material, source, boundary,
band, direction and implementation identities. Earlier uncertainty labels are
historical; use the latest qualified reference scope. Preserve the disclosed
00610 progress exception and 00611 numerical recovery, not a blanket claim that
00610 passed monitoring. No historical run or artifact may be changed.

Retain construction 1, k=.5, the same 4096 nodal directions, and bands 3/5/8
(469.6667/532.3333/626.3333 nm). The initial 12 fields are node-89 and
reserved-out-1, both profiles, all three bands. This includes the paper sideways
blue regression as well as the original Toronto witnesses; do not select only
the two formerly favorable bands. Conditional transfer adds held-0 through
held-3 for the existing 36-field panel. All are exposed development geometries.
All eight reserved H97 physical tuples remain unexposed and outside this plan.

Primary reconstructions are unchanged H100, curved-sector and fixed .5 midpoint.
Keep the constant-cell model and original candidate-grid point sum as diagnostics.
Complete Sun4096 is the unchanged physical-accuracy comparator; its different
nodes must not be substituted into a candidate basis. No mixture fitting, phase
fitting, atmosphere changes, exposure changes or outgoing-dependent donor choice.

## Sequence, evidence and estimates

| Milestone | Outcome and dependencies | Initial elapsed estimate |
| --- | --- | --- |
| H120 | Register exact comparisons, query sets and a measured probe pilot | 20 min |
| H121 | Qualify independent nodal/interior L1 evaluations; after H120 | 20-40 min |
| H122 | Close signed integration/input/reconstruction error budgets; after H121 | 20-40 min |
| H123 | Test spatial, spectral and outgoing-direction transfer; conditional on useful H122 precision | 20-40 min |
| H124 | Test one mechanism-specific causal repair or competing-cause intervention | 20-60 min, conditional |
| H125 | Verify and report the actual route, including negative results | 20 min |

First useful text/table evidence should arrive in about 20-40 minutes. Expect
roughly 100-180 minutes for the initial diagnostic route including authoring and
analysis; H120 throughput determines whether H123/H124 require a revised estimate.
Do not add these estimates as pure GPU time. At 60 minutes assess evidence,
uncertainty and resources, and continue while distinct useful progress warrants it.

Default deliverables are Markdown, selectable tables and compact CSV/JSON:
per-direction L errors, signed/absolute weighted contributions, confidence and
refinement envelopes, component closure and measured work. Publish useful evidence
when available; each milestone reports observations, interpretation, limitations
and advance/refine/reject/inconclusive disposition in one execution record.

Do not generate images of tables, text, status or numerical summaries. H123 may
add a spatial angular map only if understanding the placement of residuals against
physical boundaries and the Sun/outgoing lobes requires that visual relationship.
Record that specific need first; otherwise use data and text. No color swatch or
scene can be inferred from three bands, and none is scheduled by this plan.

## H120: freeze the diagnostic and measure its first block

1. Authenticate parent identities and deduplicate work by physical receiver,
   source, atmosphere, band and queried direction. Illumination is independent of
   the eventual outgoing direction; share each direct L evaluation accordingly.
2. Freeze the 12-field pilot, conditional 36-field transfer set, reference floors,
   basis versions and original finite-path inputs. Retain incoming Rayleigh/Mie
   illumination separately before summing them. Log source/view direction signs
   and units explicitly; L is radiance, J2 is local source density. Define w as
   the backward query from the receiver into the incoming sky; photons arrive
   along -w. Define v as the backward viewing/lookup ray; scattered photons leave
   along -v, so the phase cosine is dot(-w,-v)=dot(w,v). Verify that the retained
   source/frame conventions implement these definitions. Forward single-beam
   w=v and reversed w=-v sentinels must recover P(+1) and P(-1), respectively;
   include an independently calculated one-sided ground-tangent sentinel.
3. Register direction sets before evaluating new light. Use a small, stratified
   interior set plus one-sided probes approaching ground/horizontal boundaries,
   Sun-facing features, sector edges, ring seams and fallback regions. Select
   diagnostic cells from geometry and retained predictions, not new oracle values.
   These targeted probes describe mechanisms; they do not estimate a sphere-wide
   error without a valid integration measure.
4. Separately register a full-support angular estimation set. A suitable frozen
   mixture has equal shares of uniform sphere, a common outgoing-Mie proposal,
   Sun-focused and ground-horizon proposals. The common Mie proposal is the equal
   mixture of the three registered band phase distributions for that profile and
   outgoing direction; freeze it before samples. This permits identical physical
   queries across bands despite their different phase laws. Authenticate every
   component and the complete normalized density,
   inverse sampler, physical solid-angle measure and balance-mixture weight.
   Keep proposal parameters fixed; no source-dependent clipping or mass repair.
   These outgoing-dependent *diagnostic queries* do not change the fixed basis.
5. Begin with 256 interior queries and their required donor nodes for the two
   pilot geometries, both profiles and three bands. Measure setup, direct path
   work, readback, reuse, retained bytes and timing. No complete native cache is
   built. Update the work estimate before completing more nodes or integration
   samples; cost each genuinely new illumination evaluation. Project distinct
   donor coverage, the full node-table cost and the maximum angular-stage cost.
   If donor coverage is nearly saturated, deliberately finish/reuse that table;
   if nested solar-column work dominates, repair batching/redundant work before
   expansion. Register the next wave's estimate and resource bound before launch.
   If full-panel work is disproportionate to its decision value, complete a
   smaller explicitly qualified attribution rather than call unmeasured cases
   passed or the representation intrinsically impractical.

The first block is an operational/timing pilot. Its raw values remain provisional
until H121 qualifies the oracle; it cannot itself establish reconstruction error.

Gate: incompatible reference or physical-coordinate conventions hold the affected
comparison. Repair that issue before interpreting residuals; do not count geometry
or unit errors as evidence for interpolation bias.

## H121: build an independent illumination oracle

Adapt the existing independent continuous first-scattering integration to arbitrary
physical incoming directions at the registered receiver. The oracle may consume
authenticated physical coefficients and phase tables, but must not read a cached
radiance field, candidate interpolation stencil, production coordinate transform
or production source/transport evaluator to obtain L.

Prefer batched hardware GPU evaluation with bounded buffers and host-side binary64
calibration at selected nodes/interiors and boundary limits. Existing
`horizon-reference/math.mjs` provides independent boundary/column/direct math,
but its default direct evaluator has canonical analytic phase/albedo assumptions:
do not silently use that unadapted evaluator for Toronto. Reuse the qualified
Toronto phase/SSA conventions from the independent solver and qualify the adapted
direct integral in both profiles. The old incoming GPU packet generator is an
input comparator, not automatically a new independent oracle.

Retain view-path and solar-column refinement independently, initially 64/128 and
128/256, then 512 only for affected unresolved quantities. Cross-check phase
normalization, shadow/ground tangents, positivity, vacuum/constant-medium limits,
and actual node reproduction. Do not share the basis membership decision with the
oracle's physical boundary calculation. GPU/host agreement at identical finite
quadrature is arithmetic parity, not convergence to continuous transport.

At queried nodes compare old L with oracle L. At interior points compare each
unchanged reconstruction with direct oracle L. Also reconstruct from oracle nodal
values; this is a labeled diagnostic substitution, not a new cache candidate.
Compute only needed donor values first; a global angular estimate may eventually
require all 4096 reference nodes, which must be charged rather than assumed free.

Gate: quantitative decisions need separate empirical path/column and GPU/host
envelopes. Initial target is 0.1% of the relevant reference/floor in their J2
effect, and at most 10% of a resolved decision-bound distance for close conclusions.
An unresolved bound remains inconclusive. Refine the weighted *effect* of a nodal
contrast instead of spending heavily to bound a dark, irrelevant relative error.
For each decision combine angular sampling intervals with an explicit conservative
empirical numerical envelope: path plus solar-column plus GPU arithmetic plus
applicable basis/operator evaluation errors. Add each effect once; isolate
refinements so a combined change is not counted again as an individual one.
Push fixed nodal-oracle envelopes through the actual shared stencils/phase weights,
preserving dependence, and expand the sampling interval by that total envelope.
Include physical-reference uncertainty separately where the decision uses it.
The materiality/precision gates apply to this combined result, not to each small
budget independently. These empirical envelopes are not certified error bounds.

## H122: attribute the error under the same physical integral

Let P be the normalized physical aerosol phase function for outgoing direction v,
beta the frozen local aerosol scattering coefficient, b_i the unchanged positive
basis, L_i the old nodal illumination and L*_i independently evaluated nodal light.
Define:

```text
L_old(w)  = sum_i b_i(w) L_i
L_node(w) = sum_i b_i(w) L*_i
C_old     = beta integral P(w,v) L_old(w) dw
C_node    = beta integral P(w,v) L_node(w) dw
C_direct  = beta integral P(w,v) L*(w) dw

M_calc - C_direct = (M_calc - C_old) + (C_old - C_node)
                    + (C_node - C_direct)
```

The terms identify integration/mass/reduction error, nodal-input transport error,
and reconstruction error with independently evaluated donor nodes. M_calc retains
its actual sum(K) denominator; do not assume it is exactly one or hide its effect.
Integrate signed differences on shared queries, preserving covariance, rather
than subtracting noisy independent integral estimates. Report absolute weighted
residual as well: a small signed total may conceal cancellation within the sphere.

Add the original fixed Rayleigh residual against independently integrated
Rayleigh using the same direct L*. Compare the resulting continuous total with
the independently coded local-J2 path histories. Keep that physical-reference
remainder separate. Algebraic telescoping alone does not validate the oracle.
Retain the old sum's numerator, phase mass and normalized Mie separately.

Use at least 32 independent angular batches with identical within-case samples
for model contrasts, bands and component sums, and independent receiver/profile
streams. Retain the actual covariance of reused node/column errors; fixed nodal
oracle bias does not become sampling noise. Report 95% empirical intervals.
Register a geometric refinement schedule of 512/2048/8192/32768/131072 total
angular queries per field, with divisible batch counts; use nested prefixes for
efficiency, a separately seeded check for any decisive claim, and disclose
precision-driven selection rather than calling sequential intervals guaranteed
coverage. Stop only the affected field at its declared ceiling if unresolved.

Freeze these inference tests before results:

- **Material reconstruction error:** at a witness its resolved absolute signed
  J2 effect exceeds 0.2% of max(abs(J2_reference), profileFloor). A material effect
  earns a bounded reconstruction diagnostic. Call it the principal measured Mie
  error source only when the lower bound of
  `abs(E_reconstruction)/(abs(E_integration)+abs(E_input)+abs(E_reconstruction))`
  is at least .5, using joint estimates and combined envelopes. At a near-zero
  absolute budget leave that ratio undefined. Separately require resolved signed
  alignment with `R_original + M_calc - J2_path_reference`, including its reference
  uncertainty, before saying it explains the original total error;
  an opposing contribution is measured cancellation. This avoids defining the
  denominator as the same residual after removing every competing term.
- **Input-dominated alternative:** node substitution produces the material
  response while the full reference-node reconstruction envelope is inside the
  +/-0.2% materiality band. A wide interval merely crossing zero is inconclusive,
  not equivalence evidence. Follow nodal transport/source generation when this
  alternative is resolved, keeping reconstruction unchanged.
- **Disproved at measured precision:** the uncertainty envelope puts the absolute
  reconstruction effect below 0.2% on every pilot witness. Reject a material
  reconstruction explanation for those witnesses only, and investigate the
  competing measured residual. Larger sampling intervals mean inconclusive.
- **Atmosphere tradeoff explained:** reconstructed-minus-direct changes across
  the unchanged models reproduce the sign and magnitude of their observed
  paper/Toronto differences within combined envelopes. This establishes a local
  mechanism, not that all error in either model is reconstruction bias.

The 0.2% criterion is a new diagnostic materiality threshold, not a relaxation of
any inherited candidate-protection, phase-mass or full-cache gate.

## H123: test spatial and outgoing-direction transfer

If H122 yields useful attribution, extend that unchanged diagnostic to held-0
through held-3, both profiles and all three bands, reusing direct nodal/interior
values only under exact identity. Do not automatically repeat maximum precision
everywhere. Expand the independent integration/reference precision only for
identified decisions; retain the existing path-reference uncertainty where enough.

Classify signed and absolute residual contributions by physical support,
distance to a boundary/seam, ring/sector, incoming Sun angle and outgoing phase
angle. Keep selection measures explicit; a deliberately oversampled region must
not masquerade as a large physical contribution. Sparse probes cannot establish
absence of a defect in unmeasured cells.

At the same two pilot receivers, freeze two additional outgoing queries by rotating
the receiver-local azimuth by +90 and +180 degrees at the original elevation.
Reuse the same physical L/oracle and fixed donors; change only P and its diagnostic
sampling density. These extra integrals assess phase weighting of the same
illumination residual. They have no retained matched J2 Monte Carlo truth unless
new references are explicitly registered and measured; do not borrow a reference
from the original outgoing direction.

Gate: distinguish a transferable boundary/curvature mechanism from grid-placement
or material-specific cancellation. If the pilot inference does not transfer,
report its narrower scope and follow at most one newly supported local mechanism.
A small average cannot hide an adverse witness or opposite signed species errors.

## H124: one bounded causal intervention, if earned

Register supporting evidence, changed variable, falsifiable prediction, parameters,
work estimate and protected cases before a repair result. Examples, chosen from
the measured cause rather than run as a mandatory sweep:

- One-sided boundary/support reconstruction if the residual lies across a physical
  discontinuity; preserve positivity and constant/nodal reproduction.
- A positive local curvature representation or a small fixed interior enrichment
  if smooth within-cell structure is demonstrably missed. Charge new samples,
  basis integration and storage separately.
- A nodal source/path refinement if input errors dominate; keep reconstruction
  fixed while testing that competing explanation.

Freeze on exposed development evidence and use new, predeclared interior query
locations/seeds for the repair evaluation. These are additional development checks,
not the reserved H97 prospective panel. Do not fit mixture fractions to physical
reference totals. Keep at most two live hypotheses; a second repair needs new
mechanism evidence rather than another parameter trial.

A repair supports its mechanism if it reduces the identified absolute
phase-weighted residual by at least 50%, with a paired upper contrast <=0 and
qualified combined uncertainty. Separately label candidate admissibility: it must
not violate the unchanged both-profile protection comparison against complete
Sun4096 on evaluated fields. A repair can support the mechanism while failing
total-error protection because it removes cancellation; preserve both verdicts.
For candidate advancement, apply the inherited
2000 shared-history resamples and numerical/path envelope <=10% of the resolved
bound distance; positivity, mass <=1ppm and successive K-TV <=.0005 remain
required where K changes. Failure rejects the tested repair, not the attribution.
An oracle-nodal substitution may prove a mechanism while remaining impractical.

No full-cache accuracy/cost qualification follows from this pilot. Report new
illumination count, complete local cost and practical blockers without confusing
GPU arithmetic with host preparation or claiming a native build speedup. Any later
N4, twilight, 40-wavelength B1 or production work requires its own selected scope.

## H125: verification, reports and resumption

Keep one `interior-illumination-execution.md` during execution for decisions,
milestone reports, timings, actual sample counts, scope changes and recovery.
Finish with `interior-illumination-results.md` linking the decisive tables/data,
signed closure, reference qualifications, failed alternatives and untriggered work.
Do not create fictional execution/results documents during planning.

Verify actual-source and parent identities; query frames/measures; nodal/basis
controls; independent physical/finite-path checks; component/covariance replay;
exact derivation chains; reported decisions; types after code changes; immutable
inventories, progress and cleanup. Self-verifying runners only, no experimental
unit-test tree, native helper binaries or dedicated standards reviewers/audits.
Checkpoint advice remains separate and active under the normal experiment policy.

Keep future source under `experiments/sky-accuracy-dials/interior-illumination/`,
generated output under the experiment's existing ignored output root, and owning
documents here. Use its allocator, real-path/root checks, symlink/junction rejection,
progress and immutable-run contract. Do not modify captured source during a live
snapshot-bound run. Preserve every earlier seal and failure. Diagnose and retry
only affected work in new allocations; authenticated compatible payload reuse is
allowed. Use the physical Node runtime and existing authorized hardware-browser
route. Prefer bounded GPU batches; CPU is for small independent calibrations.

Initial retained allowance is 1184MiB; the last measured retained size was
1167.40MiB, with scratch zero and about108GiB free disk. Remeasure at H120 and
estimate an additional8-24MiB initially. Preserve the2MiB seal reserve,1GiB live
scratch and40GiB free-disk limits. Standing owner authority permits justified
recorded retention increases without repeated routine approval. Do not add
frontend memory guards or alter production cache policy.

End this diagnostic when the inference and its measured alternatives have a
supported disposition, with no distinct worthwhile bounded lead left in scope.
If evidence opens a promising branch, record its mechanism/prediction and smallest
discriminating test, then continue within this plan. Do not end merely because
the first hypothesis failed or the60minute guidance elapsed. Do not invent an
unbounded grid search or a full cache build to avoid a useful negative result.

## Scoped plan critique

Required once by create-plan after this draft. Read-only independent agent scope:
this plan, the positive-mixture and phase-cell conclusions, and only necessary
local solver/basis context. Question: can this design distinguish true interior
reconstruction bias from nodal-input, integration, boundary, Rayleigh and reference
errors, with honest sampling/precision and both-profile evidence? Identify missing
controls, circular validation, excessive cost, weak gates and concrete improvements.
Completion: primary incorporates suggestions unless they oppose stated goals,
records disposition here and self-checks coherence before planning handoff.
This gates the plan handoff only; execution still needs owner selection.

No additional review is scheduled. Any newly necessary discretionary review must
name reason, trigger, precise question, completion condition, smallest affected
artifacts and whether it gates work before dispatch. Anticipated evidence-driven
branches use the decision process above without restarting critique.

Critique disposition: completed one read-only independent-agent pass. All seven
recommendations were incorporated: non-tautological absolute-component attribution
with separate signed cancellation; executable directional sentinels; a common
cross-band phase proposal; equivalence evidence for input dominance; distinct
mechanism/admissibility verdicts; a combined numerical uncertainty budget without
double-counting; and measured donor/table/maximum-wave cost gates. No suggestions
were rejected. Primary self-review checks scope, equations, links, evidence formats
and the proposed sequence. The owner selected execution and H120-H125 are now
complete, as recorded in the results and execution record. The critique above
remains planning evidence; no additional critique or standards review was run.

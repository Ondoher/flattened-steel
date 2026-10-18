# H89-H96: structured and boundary-aware Sun-focused incoming grids

Completed with an evidence-backed negative disposition. The
[results](structured-incoming-results.md) own outcomes and images; the
[execution record](structured-incoming-execution.md) preserves all decisions.
Accepted00564 verifies the campaign. H94native recurrence and H95B1/scenes
remain conditional and untriggered. The experiment stays open; production and
prior evidence remain unchanged. The plan below preserves the executed contract.

The owner-requested independent critique is incorporated: polar as well as
azimuthal horizon splitting, explicit fresh-validation decisions, a repair route
for finite-resolution admission failures, and off-axis narrow-lobe diagnostics.

## Goal and starting evidence

Find an incoming angular quadrature that improves accuracy or build cost over
the strongest complete Sun-focused controls, across both paper and Toronto
atmospheres. Test a structured Sun-centered grid, its polar/azimuthal allocation
and explicit treatment of the physical ground-horizon boundary. Follow other
promising mechanisms revealed by the data, rather than treating this initial
list as exhaustive.

The [F68-overlay results](f68-sun-overlay-results.md) reject retaining a sparse
original backbone under the tested formulas. Compact overlays retain an exterior
moment error; weakening the balanced backbone approaches the cheaper complete
Sun rule. The [earlier geometry campaign](geometry-incoming-results.md) also
shows that stronger concentration and additional layers can transfer error to
sideways/high-altitude cases. These are reasons to investigate the numerical
construction of one full-sphere rule, not assumptions that a production horizon
is wrong.

The demonstrated development controls use moderate concentration `k=.35`:

| Complete control | Directions | Paper mean / worst | Toronto mean / worst |
| --- | ---: | ---: | ---: |
| Sun1024 | 1024 | 0.68% / 2.66% | 1.66% / 5.32% |
| Sun2048 | 2048 | 0.65% / 1.82% | 0.68% / 2.04% |

These are local atmospheric J2 source-density errors against uncertain
independent references. Neither control is thereby qualified as a full-cache
production replacement or a new paper-RMSE result.

## Initial hypotheses

| Hypothesis | Discriminating evidence | Failure or next lead |
| --- | --- | --- |
| Structured nodes reduce placement/measure error at useful cost. | Compare complete A1024/A2048 with matched Sun controls, manufactured integrals and both physical placements. | Reject the tested configuration if gains disappear under placement or move error to protected cases; inspect the directional residual before changing the rule. |
| The remaining error has a preferential polar or azimuthal resolution. | Compare 64x32 and 32x64 at the same2048 count, with species and directional errors visible. | If neither shows a transferable benefit, investigate the integrand or frame instead of assuming another count increase will solve it. |
| Aligning integration panels to ground tangency resolves a missed transition. | Compare azimuth-only and polar-plus-azimuth B with periodic A and matched non-boundary panel controls. | A benefit against A alone does not establish a boundary mechanism; azimuth-only failure cannot reject a transition lying in the polar coordinate. |

These predictions are tested, not presumed true. H89 freezes the exact
configuration-level predictions and decision margins before numerical scoring.

## Fixed comparison contract

- Initial probes use the retained spherical/distant-Sun development geometry.
  Its ground-tangency formula is not a flat/local-Sun boundary contract. Any
  later geometry extension needs its own matched path/reference identities and
  correct intersection rule; no transfer of accuracy is assumed.
- Test exact paper atmosphere and Toronto AERONET phase/SSA separately, with
  authenticated complete material/loading/source/geometry requests. No pooled
  atmosphere score, fitted exposure or silent atmosphere change.
- Keep corrected60 native transport, current aerosol phase normalization and
  outgoing representation fixed within each angular contrast. This work changes
  incoming integration during building; it does not replace final-view N1 or
  increase outgoing cache resolution.
- Begin with continuous, cache-free L1 evaluated at actual incoming directions
  and the registered black-boundary atmospheric J2 quantity. Later native and
  paper tests restore their declared boundaries. Never compare local J2 units
  directly to libRadtran observer radiance.
- Use a location-dependent rule shared across outgoing directions, wavelengths,
  species and scattering orders initially. Boundary geometry and Sun orientation
  can vary by location. A later outgoing-dependent proposal must first account
  for lost incoming-L reuse and a feasible builder contract.
- Integrate the entire sphere with nonnegative weights and complete angular
  measure. No hard Sun cap, unaccounted overlap, fitted integration weights or
  post-hoc area rescaling. Keep raw species contributions and actual phase mass
  separate from the existing normalized total.

## H89: mathematical registration and builder feasibility

### Structured rule A

Construct a source-centered orthonormal frame. Its polar axis is the physical
direction to the Sun; choose a deterministic azimuth origin from local up's
projection, with a stable explicit fallback when the two axes align. Register
the incoming look/travel-direction sign convention against the actual path
solver before tracing. Check continuity and quadrature behavior around the
frame fallback before native use.

Use Gauss-Legendre nodes in polar cosine and a periodic equally spaced azimuth
rule. For `Nmu` nodes and `Nphi` azimuths, initial unwarped weights are
`wMu * 2*pi/Nphi`, with `wMu` integrating on `[-1,1]`. Apply the same smooth
Sun warp at `k=.35` and multiply every weight by its physical solid-angle
Jacobian. Keep full-sphere support. Verify transformed weights and moments;
exact unwarped symmetry does not prove exactness after a nonlinear map.

Register the initial configurations:

| Rule | Polar nodes | Azimuth nodes | Total |
| --- | ---: | ---: | ---: |
| A32x32 | 32 | 32 | 1024 |
| A64x32 | 64 | 32 | 2048 |
| A32x64 | 32 | 64 | 2048 |

The two 2048 rules distinguish polar from azimuth refinement. Keep frame, warp,
phase/material and transport identical across that contrast. Record whether
nodes are nested; do not claim reuse or hierarchical error estimates for
non-nested Gauss rules without an actual compatibility proof.

### Boundary-aware rule B

Split each source-centered ring at the actual incoming ray's ground-tangency
boundary. For radius `R` and altitude `h`, the look-direction threshold relative
to local up is `muGround = -sqrt(h*(2*R+h))/(R+h)`, subject to the verified
solver sign convention. Find crossing azimuths on each **physical warped ring**,
not in unwarped coordinates by index. Classify sectors with the same geometric
intersection predicate used to define the reference path.

Integrate each nonempty sector using mapped positive Gauss weights in azimuth.
The union must cover the circle once, with sector weights summing to `2*pi`;
retain the polar/warp factors. Keep the same nominal azimuth-node budget per
ring initially, allocate deterministically by sector length with a declared
minimum per nonempty sector, and charge rounding/padding. Handle no crossing,
tangent crossing, ground-level limits, wrapped sectors and polar degeneracies
without dropped solid angle or infinitesimal-sector explosions.

Also register a polar-split diagnostic. Let `m` be physical cosine to the Sun,
`a` the Sun/local-up cosine and `c=muGround`. In the frame whose zero azimuth
points toward projected local up, boundary crossings obey:

```text
a*m + sqrt(1-a*a)*sqrt(1-m*m)*cos(phi) = c
mMinus, mPlus = a*c +/- sqrt((1-a*a)*(1-c*c))
```

The polar tangencies bound the rings that can cross the horizon. Validate each
candidate root against the actual geometric predicate, including coalescent
and endpoint roots. At `a=+1` or `-1`, there are no azimuth crossings, yet the
horizon lies at the polar boundary `m=c` or `m=-c`. Include manufactured cases
at and near both alignments; a stable frame fallback alone does not resolve
this integration transition.

Map valid physical roots through the inverse Sun warp before splitting the
base polar-cosine panels. Apply positive Gauss weights on each nonempty panel
with its interval-length factor, then the original physical warp Jacobian.
Keep the nominal **total** polar budget32 or64 per location initially; allocate
it across panels by a preregistered deterministic rule with minimum counts.
Do not silently spend32 or64 nodes per panel. Charge extra minima, rounding and
padding if exact budget preservation is impossible. Prove polar panels cover
`[-1,1]` once and preserve the combined polar/azimuth measure.

Call the original azimuth-only variant `Bphi` and the combined polar/azimuth
variant `Bmuphi`. Use a polar-only `Bmu` diagnostic when needed to attribute a
combined improvement. These are controlled variants, not an automatic full
factorial. An azimuth-only failure cannot reject boundary-aware integration
without checking whether the unresolved transition is polar.

The ground-hit boundary is not automatically every illumination/shadow boundary
along an incoming path. Test what the split actually resolves; do not claim
that geometry splitting eliminates all near-horizon or source-visibility error.

### Admission, controls and frozen decisions

Before atmospheric scoring, freeze source/frame/material identities, all
formulas, numerical floors, protected cases, comparator/cost selection,
uncertainty rules and advancement margins below in an immutable registration.
Authenticate the retained reference inputs and exact complete Sun1024/2048
control geometries; use Sun1408 as another complete frontier point where useful.

Prove inverse/rotation/Jacobian and sector coverage. Test constant fields, first
moments, smooth Sun lobes and horizon bands against analytic or independently
converged integrals. Use the inherited 2% local / 0.5% finalist area/first-moment
screens, normalized by `4*pi`, and 5% local / 2% finalist smooth-lobe screens.
Freeze exact manufactured fields and independently verify their integrals
before scoring. Retain actual paper/Toronto phase-mass errors at every outgoing
witness using the exact tabulated cosine integral or independent analytic
reference. Phase normalization must not hide manufactured integration defects.

Add cheap off-axis narrow-lobe diagnostics at frozen axes away from the Sun,
including a sideways direction. Use independently normalized smooth lobes with
declared widths representative of the Toronto phase profile, or rotate the
actual tabulated phase function and use its exact unit-mass integral. Freeze
axes, widths and formulas in H89; apply them to candidates and complete controls.
Record orientation-dependent aliasing independently of atmospheric radiance.
These additional phase-width diagnostics are not an unannounced extension of
the 5%/2% smooth-lobe gate; any admission use needs explicit H89 tolerances and
the same treatment of controls before scoring.

For structured A, register azimuth offsets zero and half an azimuth step. For B,
a rotation that merely changes coordinates is not a second physical placement.
Use two valid, equal-budget within-sector constructions, for example whole
sectors versus predetermined bisected subpanels with redistributed Gauss nodes.
Both preserve the true boundary. Verify that they produce genuinely different
physical samples, and apply admission to both before radiance work. A candidate
cannot qualify from a lucky placement. Polar-split variants must retain their
true polar boundaries in both constructions as well.

Classify admission failures before deciding the next action. An incorrect
Jacobian, missing support, overlap or invalid weights is a construction defect
that must be corrected before atmospheric evaluation. A valid finite rule
that undersamples a manufactured horizon transition is under-resolved: record
its failed admission without qualifying or expensively scoring that version,
then permit a separately registered split/refined repair. B can proceed when
A fails a horizon accuracy screen, provided B independently passes admission.
Failure of a predecessor is not a prerequisite failure for its proposed repair.

Reuse the native dimensional audit, updating per-location metadata, active
counts, padding/buckets, incoming-L fields and ground-support evaluation costs.
Estimate at 1024/2048 actual directions and each boundary-rule maximum. Show how
L transport and J integration consume the same physical directions/weights.
Full native implementation stays conditional; an obviously infeasible rule can
receive one cheap mechanism diagnostic, not an extensive search.

First images: physical node/weight maps at near-ground dusk, noon and altitude;
show the true horizon and split sectors, plus manufactured residuals and cost.

## H90: structured-grid local screen

Use the ten-target development panel in accepted00457, all three retained bands
3/5/8, and both profiles: 30 spectral cases per atmosphere. Reuse the qualified
total/species references in00461, verified through00495. These observed cases
are development, not held out.

Test A32x32 first, then both 2048 allocations if mathematically admitted. A
coarse loss alone does not reject structured quadrature: the polar-versus-
azimuth fine contrast is part of the initial hypothesis test. Classify failed
admission using H89's construction-versus-resolution distinction. Correct an
invalid measure before radiance; register a targeted split/refinement for an
under-resolved transition without relaxing the failed version's gate. Preserve
H91's repair route even if no unsplit A grid earns atmospheric admission.

Compare complete rules at the same actual work with existing Sun1024/2048.
Keep their exact retained frames and placements visible. If structured A helps,
do not automatically attribute the gain solely to Gauss nodes: its source-frame
orientation and azimuth placement also differ from the original Fibonacci
control. Use a small frame-matched contrast if that distinction matters to the
next decision.

For every candidate/control retain actual-angle incident radiance, raw Rayleigh
and Mie sources, phase mass, normalized J2 and signed component residuals.
Combine all angular sectors' raw Mie numerators and phase masses **before**
division. Keep inherited coefficients/conventions; never normalize sectors
individually and sum the results.

Retain 64/128 incoming-path convergence checks. A species/raw/total change above
1% triggers 256 and a 128/256 check, using frozen absolute floors. Require any
decisive improvement to survive both path resolutions even below that trigger;
otherwise refine or label the result path-limited. Corrected60 native transport
does not substitute for qualifying continuous-L1 probe accuracy.

Publish mean/worst and individual protected-case errors for each atmosphere,
phase-mass/numerator separation, and measured error versus work. Show the
2048 allocation contrast before choosing which direction to refine.

## H91: isolate the boundary split

Start B at 32x32 and the more informative 2048 allocation from H90. Choose that
allocation by a recorded both-profile rule; if the two allocations have distinct
protected-case strengths, keep both rather than selecting a pooled winner. If
A fails horizon admission before atmospheric screening, select the repair's
allocation from the manufactured polar/azimuth residuals and preregister it;
do not require an admitted A as a condition for independently qualifying B.

For the initial azimuth-only contrast keep polar nodes, warp, frame, node budget
and material fixed. Compare:

1. A's periodic azimuth quadrature.
2. Boundary-split Gauss azimuth quadrature Bphi.
3. An equal-work Gauss-azimuth control with predetermined non-boundary splits
   or unsplit panels, needed to distinguish boundary alignment from merely
   changing the azimuth integration rule. Register which control is used before
   scoring; do not select the favorable one afterward.

Then compare Bphi with Bmuphi at the same total polar/azimuth budgets. This
contrast deliberately changes polar nodes to align panels with the mapped
tangencies; retain warp, frame, material and the declared azimuth integration
policy. Include aligned and near-aligned Sun/up manufactured cases even if
the retained atmospheric panel does not contain exact alignment. If combined
splitting helps, use Bmu or a fixed non-boundary polar-panel control at matched
work to distinguish polar boundary alignment from merely changing quadrature
placement. Register the discriminating control before its result is exposed.

If sector minima or padding change actual counts, retain nominal controls and
add complete controls at the actual work, bracketing supported counts where
necessary. Do not label rounded counts equal cost. Separate active traces,
path samples, qualification overhead, GPU/host time and projected native storage.

On decisive near-horizon cases, partition the raw contribution around the
boundary using an independent-coordinate integral or matching path tallies,
with its own refinement checks. This tests whether a narrow angular transition
was missed or whether the error lies elsewhere. A finest candidate grid is not
an independent partitioned reference. Acquire this diagnostic only if it can
change a live decision; do not require expensive new references for a rule
already rejected by elementary geometry.

Output sector/node plots and directional contribution/error panels. Report
whether splitting helps both sides of the physical boundary and whether a
gain is offset in sideways, high-altitude or below-Sun-horizon cases.

## H92: evidence-driven continuation

The initial configurations are starting hypotheses, not a stopping boundary.
After each meaningful wave, update a lead register with:

- Observation and immutable evidence identities.
- Proposed calculation responsible and a distinct falsifiable prediction.
- Smallest discriminating next contrast, including both-profile controls.
- Exact parameters, uncertainty target, cost estimate and early rejection rule.
- Outcome, remaining uncertainty and why another wave is or is not justified.

Choose the next action from the evidence. Examples include refining polar nodes
when polar error dominates, improving azimuth placement when a phase lobe is
aliased, or adding a geometrically justified shadow/tangent subdivision. These
examples do not restrict other promising incoming-integration mechanisms.
Concentration changes, alternative single-map rules, properly costed phase-aware
sampling or different positive-weight quadratures may be investigated if new
evidence motivates them. Preserve an unchanged complete control within each
contrast so a new source of improvement can be identified.

A lead earns another cheap development test when it has a repeatable useful
accuracy/cost trend, fixes a demonstrated mathematical defect, or supplies a
concrete component/directional diagnosis that one bounded contrast can test.
It need not already beat the strongest control to earn that diagnostic. A
temporary regression may receive an explicitly registered mechanism test; it
cannot be silently advanced as a successful candidate.

Keep at most three active branches and normally at most three new variants in
a wave. Begin with a 4096-direction exploration ceiling; an extension requires
a recorded benefit/cost rationale and updated builder/resource estimate before
execution, not an automatic large-count sweep. A pilot-selected sampling rule
must separate pilot from production measurements initially, charge the pilot,
freeze its rule across all outgoing probes and avoid tuning on external truth.
Response-dependent sample reuse requires its own estimator/selection validation.

Reject an individual configuration early for invalid measure/support, resolved
protected regressions, infeasible cost or domination. Give a mathematically sound
mechanism a targeted refinement/placement rescue when the response supports it.
Do not repeatedly rename the same failed parameter adjustment as a new lead.
After two waves without transferable progress, reassess the mechanism and
controls. Continue only with genuinely new discriminating evidence; this is a
review point, not an unconditional two-wave stop.

Do not stop solely because the initial hypotheses are exhausted or 60 minutes
have elapsed. Continue monitoring while positive progress or a concrete live
lead warrants it. Conversely, numerical noise, growing cost without useful
accuracy, exposure tuning or recovery only at one already-seen ray are not
reasons for indefinite continuation. End with a justified negative disposition
when no viable lead remains, not merely when the named list is empty.

## H93: robust selection and fresh validation

The following development comparisons guide adaptive exploration. Their
bootstrap intervals are not confirmatory guarantees after trying and selecting
many variants. Fresh qualification uses the separately frozen comparison below.

Use the inherited paired procedure, frozen in H89: per-profile absolute floors
derived as `1e-8 * max(development reference mean)`, 2000 fixed-seed bootstrap
replicates, shared draws for quantities/bands sharing histories and independent
group resampling otherwise. Register seed1013904223 and one-sided empirical95%
decision margins. Coupled reference-interval bounds are sensitivity checks,
not a second acceptance rule. Protect every case; no atmosphere pooling.

At matched actual standalone work, seek at least20% lower mean or worst error;
alternatively seek at least25% less work with both statistics within10% of a
competitive complete control. Require a resolved gain in one profile and no
resolved material regression in the other profile, other statistic or protected
cases. Material regression exceeds both20% relative and two percentage points,
assessed jointly with uncertainty. Compare the complete frontier; do not combine
different controls' best statistics or qualify a candidate dominated by another
competitive rule. Repeat prospective finalists with the second registered
physical placement/construction before exposing reserved radiance.

Reference-limited differences are inconclusive, not a failed mathematical
hypothesis or a claimed win. Refine up to four decision-critical references per
profile in an initial wave only after estimating the precision needed to decide
the live margin. A further wave requires a demonstrated attainable decision,
recorded cost and new registration. An independently formulated deterministic
reference can supplement retained path estimates only after its own coordinate,
refinement and physical matching checks; never relabel a candidate as truth.

### Frozen reserved-panel decision

Freeze at most two finalists before exposing the twelve reserved H80 cases,
which remain unobserved after H88. Register exact material/geometry/direction
identities, bands and boundary conventions; check nonoverlap with development
and protect every case. For each finalist name one complete comparator and its
matched-work/count-generation policy, one advancement route, and, for the
20% route, the gain statistic (mean or worst) and profile that must show it.
Do not select these from reserved results. Also freeze the second-placement
comparison and how standalone costs are aggregated on the reserved panel.

Acquire matched candidate/control and qualified independent references on the
reserved panel in both atmospheres. Reuse H89's absolute floors. Within each
shared-reference bootstrap draw compute `e=abs(prediction-reference)/max(reference,
floor)`, mean and worst errors, and each case's candidate-minus-control error.
Apply the same20% improvement or25%-less-work/10%-accuracy margins as above to
this panel, not to a development/validation pool. Calculate the selected gain
margin and the maximum protected non-regression margin across both profiles,
mean/worst statistics and individual cases, using the existing material allowance
`max(0.2*controlError, 0.02)`. The gain margin is `candidateStat-0.8*controlStat`;
the lower-cost route requires `candidateWork<=0.75*controlWork` and both margins
`candidateStat-1.1*controlStat<=0`. Require upper decision bounds at or below zero
for the chosen gain/equivalence and protected margins; a resolved failure
rejects advancement, while an unresolved required margin is inconclusive and
may receive only a registered decision-critical reference refinement.

Predeclare finalist ordering, seeds and reference-refinement/stopping rules.
With one finalist use one-sided empirical95% bounds; if either of two finalists
may earn a success claim, allocate the two comparisons in advance and use
one-sided empirical97.5% bounds for each. Use the paired construction and
preserved covariance, including the maximum protected margin, consistently.
This is the declared multiplicity decision rule, not a claim of rigorous finite-
sample bootstrap coverage. Publish both finalists' outcomes and do not spend
the same reserved data on additional tuned candidates under the original claim.

Require the frozen reserved-panel disposition and second-construction robustness
before substantial native implementation. Include a cheap matched +60-minute
twilight witness as a separately registered protected check before a large
native commitment; state whether it enters the aggregate rather than deciding
that after seeing its result. A failed or inconclusive validation may generate
a new H92 lead, but its exposed cases then become development data and a revised
method needs genuinely new validation. If a narrow native microprobe is needed
earlier to resolve a specific recurrence/boundary question, register it as a
development diagnostic and charge it; it does not waive this qualification gate.

## H94: conditional native recurrence and spectral checks

Only survivors receive substantial native implementation. Preserve the physical
direction identity shared by incoming-L transport and J integration at every
position/solar row. Ground/support-row evaluation must not interpolate unlike
directions by equal index. Prove cross-row, padding and ground-boundary behavior
with manufactured fields before atmospheric microbuilds. Angular tables may
be procedural, but their intermediate-L storage and reconstruction costs remain.

Test both-profile three-band J2/J3/J4 microbuilds, separating native L1 path
accuracy, angular integration, L2-from-J2 and L3-from-J3 reconstruction. Retain
pure and cumulative orders. Then obtain selected full15-band observer spectra
if the benefit survives recurrence, using matched independent references and
libRadtran where its geometry/solver support qualifies. Distinguish N1-N4 from
all-orders references. Local J2 improvement alone cannot establish N4 accuracy.

A newly identified propagation defect can feed H92 as a separately registered
incoming/recurrence diagnostic. Keep changed factors attributable. No production
writes, fitted atmosphere, outgoing representation rewrite or unrelated feature
work is authorized by this plan.

## H95: conditional full paper scoring and scenes

For a qualified native survivor, use exact paper atmosphere/source/grass setup,
all40 wavelengths, the registered31-band RMSE scoring convention and all17
intervals with81 dome rays each. Match or improve both authenticated retained
H61 Focused60 and H55 Original40 aggregate scores at full precision. Publish
every interval change and the dome comparison. Do not tune against B1 while
calling it independent qualification. Toronto retains separate matched
reference results and must not be scored against paper material as a match.

Render matched baseline/candidate paper and Toronto scenes at noon, sunset,
and +30/+60minutes with common display/exposure. Preserve current production
twilight as a protected comparison; material changes need qualified physical
support or a concrete owner visual decision. Production is not a physical
oracle. Assemble the reviewable images before requesting that decision.
Runtime remains cache lookup; no live incoming integration or exact-ray N1
substitution is introduced. Production promotion requires separate work.

## H96: progress, evidence, resources and completion

Prefer GPU for actual-angle radiance, independent paths, microbuilds and renders;
one owned GPU job at a time. CPU handles cheap analytic proofs/reduction and
verification. Use bounded dispatch and existing30-second progress contracts,
with measured/projected work updated after each wave. Diagnose failures, preserve
usable work and retry into new runs after correcting the cause. Use unique CLI
verbs or import-safe entry points to avoid the H88 imported-runner dispatch error.

Publish meaningful images at mathematical admission, initial structured-grid
comparison, boundary attribution and each material new lead. Use node/sector maps,
per-case error/cost and component plots early. Three-band diagnostics are not
sky-color swatches. Use15/40-band spectra/swatches and actual scenes at qualified
later milestones; an image per batch is unnecessary.

Measure retention before execution. H88 ended at873.41MiB under896MiB; preserve
the2MiB sealing reserve,1GiB live scratch and40GiB free-disk minimum. Estimate
each wave and later reference/build phases before starting them. The owner's
standing AFK authority permits justified recorded retention amendments needed
to proceed, not deleting or altering old evidence. No amendment is made here.

Source stays below `experiments/sky-accuracy-dials/`, generated artifacts below
`tmp/experiments/sky-accuracy-dials/`, and owning documentation here. Real-path-
check roots and reject links/junctions. Every derivative records exact parent,
operation, material parameters, implementation/tool identity and output identity.
All completed runs remain immutable. Reuse compatible inputs and incident values;
charge standalone work independently of campaign reuse savings.

Keep local types, self-review and focused self-verifying proof runners. No
experimental unit-test tree, native helper executable or dedicated standards
review/audit; checkpoint-adviser monitoring remains at coherent milestones.

Complete with a qualified candidate and explicit limits, an evidence-backed
negative result after useful leads are exhausted, or a specific external
dependency with all independent work complete. Save results, images, complete
lead/decision records, timing/resource facts, failed attempts, verification and
a concise execution summary/checkpoint. Explain which expensive stages were
conditional and untriggered. The experiment stays open unless the owner
separately ends or suspends it.

# Sky Accuracy Dials: Compensation Attribution Plan

## Objective And Execution Authority

Continue the [scientific goals](continuation-goals.md) by identifying what the
verified first-order correction was compensating for, then developing numerical
and operational controls whose individual and combined effects are predictable.
The owner authorizes independent execution and adjustment of the plan as evidence
requires. Completing a batch does not complete that objective.

This document owns the adaptive extension to the completed C0-C6 batch in the
[continuation plan](continuation-plan.md). Earlier registrations, predictions,
failed gates, reference allowances and the C5 skip remain immutable evidence.
New work receives new run identities, explicit predictions and its own results.
The [status](status.md) owns the current frontier and review gates; the
[design](design.md) retains the production, evidence and storage boundaries.

## Questions And Discriminating Tests

| Package                                             | Hypothesis and initial prediction                                                                                                               | Test and decision                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1: separate incoming angular coordinates           | The unresolved local J2 refinement is driven mainly by radial/elevation resolution; fine azimuth agreement shares that radial error.            | Hold independently admitted continuous L1 fixed. Vary radial count at fixed azimuth and azimuth count at fixed radial nodes, using exact parent-node reuse where possible. Report the signed correction vectors and their relative sizes; do not infer angular convergence from azimuth agreement.                                         |
| A2: resolve the grazing region                      | Integrating directly over the nonzero hemisphere should reduce the radial error caused by using only the positive half of a full-interval rule. | Compare equal active-node counts for the two rules, and a differently mapped hemisphere rule. Independently refine radial and azimuth coordinates. Freeze the prediction before the finer target; preserve a rejection or unresolved outcome rather than choosing a convenient convergence factor afterward.                               |
| B: connect local errors to measured radiance        | A material part of the discrepancy exposed by the J1 correction is generated in second-order scattering.                                        | First decompose retained cumulative orders into signed increments. Then construct a small independent second-order viewing-ray reference with explicit positive-altitude and ground-boundary treatment. A local ground-density improvement alone cannot establish a Kider-radiance improvement.                                            |
| C: identify propagation and reconstruction          | Remaining errors arise from higher-order source/transport integration, sampled-field reconstruction, or their interaction.                      | Compare independently resolved contributions with matched cached contributions, first at order two and then subsequent orders. Vary one numerical operation while keeping the others independently resolved or explicitly frozen; quantify propagation separately from the score cross term.                                               |
| D: separate missing orders and physical assumptions | Some residual may persist after the represented orders are accurate, or may be removed by omitted orders.                                       | Use compatible retained N5/N6 increments as bounded diagnostics, develop an order-remainder estimate where supported, and separate boundary/geometry from medium and measurement assumptions. Do not identify the unexplained remainder as physics. New physical-parameter experiments require a separately registered matched comparison. |
| E: qualify useful dials                             | Correcting related errors together can provide a more stable accuracy/cost relationship than adjusting an isolated count for its Kider fit.     | Seal new predictions from the established component model, test held settings and related combinations, and qualify only the numerical and measurement scopes supported by adequate references. Retain per-time and angular regressions.                                                                                                   |

The packages may overlap when independent work is useful. A failed reference
admission redirects effort to a smaller or different reference formulation; it
does not end all investigation. The selected next test must distinguish live
explanations rather than merely repeat a denser setting.

## First Executable Matrix

Use the original local J2 parent `00113-c2-local-j2`, its exact two ground
origins, four outgoing probes and channels 0/8/24/30. These outputs are scattering
source densities in W m^-3 sr^-1 nm^-1, not sky radiance or Kider RMSE. Preserve
the exact-ground convention of zero inward first-order radiance.

1. Reauthenticate the retained incident records and replay their original sums.
   Derive azimuth 32/64/128 midpoint/endpoint comparisons at the original 64-node
   full-interval radial rule using exact parent geometries and new weights.
2. Supply the missing full-interval radial32/azimuth32 midpoint rule. Together
   with compatible retained nodes this separates radial16/32/64 at fixed
   azimuth32 from azimuth refinement at fixed radial64. About 512 new incident
   representatives are expected over the two origins.
3. If radial sensitivity remains material, develop hemisphere rules with 8 and
   16 active radial nodes at fixed azimuth64. Compare with the full-interval
   method at matched active-node counts. Register the finer-target prediction.
4. Execute the held hemisphere32 rule at azimuth128 endpoint placement and
   derive its azimuth64 endpoint and midpoint controls from identical physical
   nodes. Add an independently mapped radial check, initially mu=u^2 with
   Jacobian 2u, at azimuth128. Their agreement alone is insufficient: retain
   radial/azimuth refinement evidence, propagated incident allowances and the
   method-disagreement term. Approximately 8,320 new incident representatives
   are expected for this held matrix, before bounded pilot adjustment.
5. If the reference or prediction remains unresolved, inspect the separated
   correction pattern and select another bounded discriminating test. Candidate
   responses include additional azimuth support, a horizon-focused interval
   split, a finer independent radial member, or a moment-based prediction
   supported by manufactured cases. Specify that case before its output exists.

Reuse an incident value only at its authenticated physical geometry, spectrum
and numerical policy. Use original vectors when subsampling; record the exact
index/weight transformation. Interpolating parent radiance is not an independent
angular reference. Distinct mirrored phase weights must be preserved.

Keep development, predictions and target executions in separate sealed records.
A qualitative prediction is not a passed quantitative response forecast.
Record the density-unit significance floor and every group before execution;
do not apply the sky-radiance implementation floor to a different quantity.

## Reference And Attribution Gates

### Error-allocation control

The first volume pilot `00153-volume-l1-pilot` and angular development attempt
`00155-j2-ang-dev` reached the independent Simpson recursion-depth cap on a
grazing witness. Read-only tracing located the rejected leaf comparisons in
the auxiliary propagated optical-column error estimate. The radiance components
passed those local comparisons. Adaptive column trees make their own error
estimate discontinuous; allocating the whole tolerance by interval length can
demand excessive accuracy on a tiny jump in that estimate. This is a reference
integration limitation, not evidence of a radiance or Kider regression.

Test a selectable `local`/`global` outer-error allocation while preserving the
same absolute and relative tolerances, independent Gauss/Simpson formulations,
inner column integrations, empirical allowance equation, work caps and physical
admission. The global variant sums the complete partition's error estimates and
refines the largest normalized contributor to a failing component. Every
component must meet its original whole-integral tolerance. Keep the previous
complete partition and explicit nonconvergence if a refinement is interrupted;
do not discard an unresolved contribution or extrapolate its value.

Predict that the unchanged eight volume witnesses will all resolve and retain
their original surface-parity, zero-ground and ground-limit predicates. Every
formerly admitted atmosphere, direct-ground and total component must also agree
with its original local-allocation estimate within summed empirical allowances
plus 1e-12 W m^-2 sr^-1 nm^-1. The
durable stage is `volume-global-witnesses`; reserve another 4 MiB and one CPU
hour within the unchanged cumulative limits. Then restart the angular chain
under the revised plan identity, using global allocation for newly evaluated
incident rays. Previously admitted parent values retain their original policy
and allowances. Predict that the failed hemisphere16 incident witness now
resolves; a complete angular matrix remains a separate requirement. Preserve
`00153` and `00155`, including their unresolved results, as historical evidence.

Manufactured proofs must cover an integrable tiny discontinuity in an auxiliary
error estimate, a material discontinuity, smooth polynomials, multiple components,
peaks, signed cancellation, and partial-refinement work limits. Confirm both
formulations' final global error sums satisfy the unchanged thresholds. A passed
global error estimator is empirical evidence, not a rigorous integral bound.
If a remaining failure comes from an actual radiance component or an inner
column, diagnose it separately instead of loosening admission.

### Physical reference requirements

Retain the continuation plan's numerical-reference principles: independent
formulations, explicit empirical allowances U, missing terms represented as
unresolved, and no extrapolation factor without supporting evidence. A claimed
numerical reduction D must satisfy U <= 0.20D and D > 2U in the declared norm.
Roundoff checks scale with their actual operands and never replace a numerical
reference allowance.

For a reference radiance P, compute n = L - P and r = P - M on identical
samples and weights. Retain ||n||^2, ||r||^2 and 2 n dot r. For order increments,
retain their signed spectral vectors and pairwise dot products. An increment's
size or alignment with the measurement residual does not establish its error.

Before claiming that higher-order numerics explain the lost compensation,
demonstrate the correction with an adequate reference at the same viewing-ray
boundary. Exact-ground J2 is an initial mechanism diagnostic. Elevated incoming
rays, direct ground reflection, ray termination and transport along the final
view must be accounted for in any second-order sky-radiance reference.

Package B begins with two bounded steps that can develop alongside A1/A2:
an exact signed decomposition of the existing 160 component values and a
general first-order incident-ray evaluator with separated atmospheric and
direct-ground contributions. Its independent witnesses cover surface-outward
parity, positive-altitude outward, inward ground-hit and inward escaping rays.
The positive-height reflected-ground limit is compared with the original
exact-ground convention without changing either historical result. This tests
whether interpolation of that boundary difference could be material; it does
not assume dominance or a Kider benefit. Manufactured zero-albedo checks verify
the separated term and are not physical-parameter fitting to measurements.

The first physical pilot uses channels 0/8 and at most sixteen witnesses:
the original surface-outward rays p-0930-4-7 and p-1230-3-5; inward ground-hit
rays with local cosine -0.5 at 1 mm, 1 m, 100 m and 1000 m above the 09:30
origin; and elevated outward and inward-escaping controls. Predict agreement
with the admitted surface reference within combined allowances, no direct-ground
term for top-exit rays, and convergence toward a finite direct Lambertian
surface limit for illuminated ground-hit rays as height decreases. Keep
atmosphere, ground and total estimates and allowances separately. Reserve
4 MiB and at most one CPU-job hour for this pilot, inside the existing C5 and
global ceilings. Its outcome selects the next full second-order pilot scope;
it does not itself qualify a sky-radiance or Kider correction.

Its durable extension-stage identity is `volume-witnesses`. The separate
retained-order decomposition uses `order-decomposition` and a 3 MiB record
ceiling; both debit new C5 reference work under this extension.

For the ground-limit witness, require successive lower heights not to increase
the absolute discrepancy beyond the joint empirical allowances. At 1 mm,
require discrepancy <= 1e-5 times the absolute independently integrated
Lambertian limit + 1e-12 W m^-2 sr^-1 nm^-1 + joint allowance. Unresolved
component or limit admission remains unresolved, rather than passing because
a permissive numerical comparison happens to hold.

The original prospective spectral and Kider gates continue to apply to their
registered radiance scopes. A new density/reference prediction must declare its
own dimensionally appropriate criterion before the target. Keep numerical
accuracy, response predictability, useful Kider benefit and transfer claims
separate.

## Positive-height Second-order Pilot

The next package B stage is `volume-j2-pilot`. Use the frozen C0 viewing rays
`p-0930-5-7` and `p-1230-3-5`, which have opposite remaining residual signs in
the retained decomposition. At radial heights 0.001, 1, 1000 and 8000 metres
along each original outward ray, evaluate local second-order source density in
channels 0 and 8. This pilot does not yet integrate the final viewing ray.

At radius r, split incoming cosine at `mu_ground = -sqrt((r-R)(r+R))/r` and
zero: ground-hit, inward-escaping and outward intervals. Use Gauss8 on each
interval and 16 midpoint azimuth samples. Reuse reflection symmetry about the
local source/radial plane, with separate phase weights for the two directions;
this requires 192 incident representatives per position, 1536 in total.
Independently evaluate two reflected witness rays per position, one ground-hit
and one inward-escaping, for 16 additional evaluations. Check their separated
components against the representative within joint empirical allowances and
1e-12 W m^-2 sr^-1 nm^-1. Keep these actual symmetry checks separate from the
manufactured geometry and phase-weight proofs.

Use the admitted volume L1 evaluator with global outer-error allocation and
unchanged physical admission. Retain atmospheric/direct-ground incident light
times Rayleigh/Mie scattering as four separate components. The angular integral
uses solid angle and phase, without an incoming cosine factor. Predict all
incident components are admitted, all four contributions are nonnegative, and
their sum agrees with an independently accumulated combined channel to binary64
roundoff. Any unresolved incident makes the affected angular component unresolved.

At 1 mm, predict the Rayleigh contribution from direct ground light agrees
with `beta_R(0) * B0 / 2` within 0.1% plus propagated empirical allowances and
1e-15 W m^-3 sr^-1 nm^-1. Here B0 is the independently evaluated direct
Lambertian boundary radiance at the original surface point. The one-half follows
from normalized, antipodally even Rayleigh phase over a hemisphere; it is not
assumed for the forward-peaked Mie phase. This is a boundary-limit prediction,
not a complete angular-accuracy qualification at positive height.

Reserve 4 MiB and one CPU-job hour within C5 and the unchanged cumulative
limits. Require twice the slowest measured incident cost times the remaining
incident count to fit the scientific deadline, retaining a one-minute
finalization reserve. Retain compact incident values/allowances and work counts;
keep full diagnostics only for bounded unresolved witnesses. No GPU fields or
scratch are required. A failed pilot redirects the reference work rather than
qualifying partial sums. After the pilot, preregister independent radial/azimuth
refinements and the viewing-ray integration matrix from its measured costs.

## Positive-height Angular Factorial

After accepted pilot `00161-volume-j2-pilot`, stage `volume-j2-angular` tests
radial and azimuth refinement separately and together. Use its same two probes,
channels 0/8 and heights 0.001, 1000 and 8000 m. Retain the original Gauss8 /
azimuth16 midpoint values as the baseline, then run Gauss16/azimuth16,
Gauss8/azimuth32 and Gauss16/azimuth32. This is a complete 2 x 2 comparison;
the three new cells require 9,216 representatives plus 36 mirrored checks.
Use the same intervals, incident admissions and four-component accounting.

Before these outputs exist, predict the joint correction is approximately the
sum of the individual corrections. For each of the four physical components,
over the twelve target/channel scalars, require
`norm(L_AB-L_A-L_B+L_0) <= 0.25*max(norm(L_A-L_0)+norm(L_B-L_0), 1e-15)`
plus the norm of summed propagated incident allowances. Record the interaction
vector as well as its norm; this is a numerical-response prediction, not an
angular reference or Kider forecast. Report unresolved comparisons when incident
allowances exceed 20% of the measured correction scale.

For the four 1-mm atmospheric scalars, predict the joint-refined
atmosphere-Rayleigh plus atmosphere-Mie sum agrees with the corresponding
exact-ground outward reference from `00160-j2-ang-fine` within 0.05% of its
absolute value plus both empirical incident/reference allowances and 1e-15
density units. This is an explicitly approximate positive-height-limit
prediction; the surface reference is not silently relabelled as a reference at
the elevated point. Preserve any failure and its signed residual.

Retain the original pilot and all inputs unchanged. The new run's definition
freezes these formula predictions before evaluating any of the three new cells.
Reserve 4 MiB and one CPU-hour, with unchanged cumulative admission and hard
deadline. The original pilot's complete positions cost 9.9-14.7 seconds per 194
incident evaluations, although individual maxima reach 264 ms. For this larger
balanced matrix, after each complete position project twice the largest observed
whole-position milliseconds per incident times the remaining count. This avoids
charging every ray as the rare slowest ray; it changes only the resource
forecast, not any numerical tolerance or hard limit. Cooperative per-ray
deadline/headroom checks remain active throughout the first and later positions.
Store rule counts and deterministic construction
equations in the recipe, and exact evaluated directions in compact node evidence;
do not duplicate the full planned direction arrays throughout provenance.

The completed positive-height factorial admits the next
[second-order viewing-ray reference stages](second-order-reference-plan.md).
That owner freezes their physical quadratures, operational controls, predictions
and per-stage limits; each new run retains both plan identities.

## Resources And Registration

Preserve the design's hard limits: 512 MiB total retained evidence, 1 GiB live
scratch, 40 GiB free-space floor, and one GPU job at a time. Keep the original
continuation cumulative limits of 256 MiB new evidence, 36 GPU attempts,
8 full captures, 18 GPU-job hours and 8 CPU-job hours for the initial extension.
Authenticate actual usage before every admitted job.

Allocate the extension's initial reference work from the unused C5 allocation.
The accounting phase remains C5, with explicit extension identity
`compensation-attribution-v1` and a distinct package/stage identifier. This is
new reference development under this amendment, not a retroactive C5 accuracy
qualification. Each record consumes the original C0 registration, the existing
allocation amendment, this plan's exact snapshot, relevant parent artifacts,
implementation identities and actual tool identity.

Initially reserve at most 24 MiB for A1/A2 evidence including failed attempts,
with a conservative per-record forecast and protected terminal reserve. Each
new CPU stage has a one-hour ceiling, further restricted by the remaining
cumulative allowance. Use a measured pilot and a conservative projection before
expansion. Historical timings suggest minutes rather than hours for this
matrix, but do not constitute admission evidence. Retain compact incident and
component results; do not retain GPU fields or large cache packages.

Before packages B-E execute, record a concrete scope, numerical prediction,
reference requirements, memory/time/storage forecast and admission decision.
Reassign unused allocations as needed through a new explicit prospective
amendment; do not silently bypass the resource ledger. Resource limits prevent
the next job when exhausted; they do not turn a partial scientific result into
a completed objective.

## Adaptive Execution And Completion

After each coherent result, update the hypothesis, eliminated explanations,
remaining uncertainty and the next discriminating test. If more accurate
numerics worsen Kider, continue attribution and evaluate related corrections;
do not restore favorable bias and describe it as accuracy.

Stop a particular refinement when its effect is unresolved and no identified
mechanism justifies another test. Continue other informative work. Stop all
execution for a user-directed pause, an actual resource boundary, an unresolved
implementation/provenance gate that prevents safe dependent work, or achievement
of the scientific goals. Report the exact unfinished frontier for a limited
handoff. A completed report or exhausted case list alone is not a scientific
stopping criterion.

Source review is batched at coherent implementation milestones under the
repository review lifecycle. Preserve all historical evidence and production
behavior. Checkpoint advice retains whole-repository scope and the owner's
standing preapproval of recommended checkpoints.

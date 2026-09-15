# Independent Second-order Viewing-ray Reference

Status: the pilot and first complete coarse viewing rule are accepted as
`00163`/`00164`. The [refinement registration](second-order-refinement-plan.md)
owns the next held outer comparisons and reference-admission requirements.
The positive-height angular factorial selected Gauss16/azimuth32 as the initial
ordinary angular rule. This document develops package B of the
[attribution plan](attribution-plan.md), within the existing production,
immutable-evidence and resource boundaries.

## Quantity And Attribution Boundary

For the original frozen surface viewing rays `p-0930-5-7` and `p-1230-3-5`,
evaluate channels 0 and 8 with the original atmosphere, ground reflectance,
collimated source and spectral coefficients. The top altitude is 60,000 m.

```text
P2 = integral_view T_view(s) * J2(x(s), v) ds
J2 = integral_sphere [beta_R(x)*p_R(v.w) + beta_M(x)*p_M(v.w)] * L1(x,w) dOmega
L1 = atmospheric_first_scattering + attenuated_direct_Lambertian_ground
```

Retain atmosphere/Rayleigh, atmosphere/Mie, ground/Rayleigh and ground/Mie as
four distinct components through both integrations. There is no incoming cosine
factor in J2 and no reflected-ground endpoint term on the final outward view.
The source delta beam is excluded from diffuse L1. No higher diffuse-ground
recursion belongs in this pure second-order contribution.

Compare P2 to the original H `grouped N2 - grouped N1`, including both original
view-reference allowances. The retained order decomposition already uses that
grouped representation. Keep cumulative reconstruction separate: nonlinear
solar interpolation prevents treating the two groupings as interchangeable.

For attribution, replace only the effective J2 increment with P2 while retaining
the independently evaluated P1 and original effective J3/J4 increments. Report
the signed replacement, remaining residual and compensation cross terms. This
is a frozen-increment diagnostic, not a fully regenerated corrected N4 solver.
Keep all four component scalars and per-probe outcomes visible; no full Kider or
seventeen-time score claim follows from these four selected spectra.

## Outer Geometry And Independent Rules

Use radial-height boundaries 0, 1,875, 8,000, 24,000 and 60,000 m. The first
boundary is H's first positive cache altitude; it allows the near-ground path
contribution to be reported separately. These are physical integration splits,
not sampled cache values.

For original surface point o, frozen unit viewing vector v, p=o.v>0 and ground
radius R, map height h to path distance using

```text
delta = h*(2*R+h)
s(h) = delta / (sqrt(p*p+delta)+p)
y = sqrt(h)
ds/dy = 2*y*(R+y*y) / sqrt(p*p+y*y*(2*R+y*y))
```

The transformed integrand at y=0 is zero because its Jacobian vanishes for
these strictly outward rays. Do not evaluate the stored exact-ground inward-zero
convention there or assign an arbitrary near-ground epsilon to the endpoint.
Independent manufactured proofs must verify the mapped path length and a
constant-source, constant-extinction integral, including this endpoint.

Evaluate final-view optical columns by Gauss and Simpson with the original
coarse/fine tolerance multipliers 4/1. At optical depth tau, retain
`t(tau)=1e-9+1e-8*abs(tau)`. Require column convergence, column error within
its pass tolerance, coarse/fine difference at most `4*t(coarse)+t(fine)` and
fine-method difference at most the sum of their tolerances. Propagate the
finite column intervals through exp(-tau), adding method/pass attenuation
differences to the empirical view allowance. Keep it separate from incident,
angular and outer-integration uncertainty.

Prepare composite Gaussian and Simpson rules on the physical intervals, with
distinct distance/height formulations where practical. Freeze every physical
query before evaluating its incident field. Reuse a value only for an identical
physical point, outgoing vector, spectrum and angular policy, retaining the
exact parent identity. Simpson refinements can reuse their nested endpoints;
new Gaussian nodes require new incident evaluations.

## Angular Error And Qualification

Select the initial rule from the completed positive-height factorial. Its
additive-law or near-surface checks alone do not establish angular convergence
at all future viewing-ray points. Each material point therefore needs a local
angular comparison and propagated incident allowances. An independently mapped
cosine rule should concentrate support at the ground horizon and compare with
the ordinary split-interval rule; retain its actual Jacobian and positive weights.

Do not interpret agreement between outer quadrature methods as a bound on shared
angular error. Carry angular, incident-column and final-view allowances separately.
Use explicit coarse/fine and independent-placement or coordinate comparisons,
without assuming a Richardson exponent for Gaussian sampling. If the allowance
cannot distinguish the proposed cached-to-physical correction under the original
reference gates, keep that attribution unresolved and refine the limiting axis.

## Bounded Execution Sequence

### First registered execution

The completed `00162-volume-j2-ang` passes all 308 checks. Its largest resolved
interaction is 1.16% of the individual-response scale, in atmospheric light
followed by Mie scattering. Three joint-refined near-surface atmospheric sums
agree with the fine ground reference within the combined incident allowance;
morning channel 0 is slightly outside it. All four pass the preregistered
0.05% plus incident-allowance comparison.
This supports beginning the whole-view reference at Gauss16/azimuth32, while
retaining explicit angular comparisons at every new physical point.

Stage `second-order-view-pilot` uses the 09:30 ray and channels 0/8. Prepare
four Gauss4 nodes in sqrt(height) on each of the four stated height intervals,
giving sixteen physical queries. Evaluate the first node of the lowest interval
and first node of the highest interval as the initial cost/geometry pilot. A
subsequent stage completes the same sixteen-node whole-view rule, reusing only
the exact accepted pilot positions and numerical policies.

At each point compute ordinary Gauss8/azimuth16, ordinary Gauss16/azimuth32 and
an independently mapped Gauss16/azimuth32 rule. For mapped ground-hit cosines
use `mu = mu_ground - (mu_ground+1)*u^2`; for inward-escaping and outward
intervals use `mu = a + (b-a)*u^2`, with `u` in [0,1] and positive Jacobian
`2*(b-a)*u`. This concentrates nodes at the grazing boundaries without changing
the physical integral. The three rules require 1,728 representatives per point.
The initial pilot therefore requires 3,456 incident evaluations.

Predict all incident/geometry/attenuation admissions pass and all four resulting
contributions are nonnegative and sum to the combined integral. Keep the
ordinary-coarse change, mapped-fine discrepancy and incident allowances as
separate observations. A pilot is not a completed view reference. Do not call a
large coarse/fine angular difference an error bound without subsequent
refinement and adequate independent agreement.

For the later complete first-interval integral, prospectively predict the
direct-ground Rayleigh plus Mie contribution is at most 1.1 times the accepted
near-surface ground-density sum times the exact path length to 1,875 m, plus
the propagated numerical allowance. The 10% envelope tests the observed decay
of this component; it is not asserted as a rigorous bound. This gives a
specific test of the ground term's size relative to the retained residual.

Use at most four independent Node workers on the observed twelve logical CPUs.
The parent preserves incident summation order and must pass an exact
sequential/parallel parity proof before new physical evidence. Record both wall
duration and summed worker task durations, worker count, work counters and
resident memory. The existing CPU-job ledger continues to debit complete job
elapsed time; parallelism never relaxes numerical or storage admission.

Each stage reserves 4 MiB and one CPU-job hour, with a one-minute finalization
reserve and the same cumulative C5 admission. Project twice the slowest complete
position cost per incident times remaining work after each point. The parent
owns deadline/headroom checks, source/input authentication, progress and sealed
evidence; workers own no filesystem output. Retain compact angular component
sums and bounded failed witnesses, keeping reproducible incident arrays in RAM.

### Follow-through

1. Completed: local angular factorial and registration of the first viewing-ray
   rule and mapped angular comparison above. The findings retain unresolved
   small interactions and the scope of near-surface agreement.
2. Run a small outer-node pilot on one probe, including the first altitude
   interval and an upper-atmosphere control. Record actual complete local-J2
   costs before expanding to an entire view. Bound each CPU job by one hour,
   four MiB and the existing cumulative C5 allocation.
3. Complete the first whole-view coarse estimate in bounded batches; retain
   local component sums, error estimates and reproducible source/input identities.
   Large incident arrays may remain in memory when not needed for later reuse;
   do not save full GPU fields or disposable scratch to disk.
4. Freeze the outer and angular correction forecasts before the finer target.
   Test the independent outer formulation and any necessary angular refinement.
   A partial job cannot contribute a fabricated zero or a complete reference.
5. Apply the same admitted comparison to the second frozen probe. Quantify the
   J2 substitution and cross terms against the retained P1 and grouped J2-J4
   values. Use their signs and component locations to choose subsequent
   reconstruction, transport, missing-order or physical-assumption experiments.

Before each batch, authenticate actual cumulative use. Split a job when its
measured expansion forecast exceeds the one-hour ceiling; a split changes no
numerical tolerance or scientific gate. Preserve terminal capacity and the
40 GiB free-space floor. This plan does not authorize production edits, alter
earlier failed predictions, or reopen the historical C5 qualification skip.

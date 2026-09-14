# Compensation Attribution: Active Findings

The [attribution plan](attribution-plan.md) owns the adaptive experiment and
prospective tests. This document owns its findings; the earlier
[continuation findings](continuation-results.md) retain the completed C0-C6
results. The broader accuracy-control objective remains active.

## Retained-order decomposition

[00152-a-order-split](../../../../../tmp/experiments/sky-accuracy-dials/runs/00152-a-order-split/report.md)
exactly decomposes the same 160 retained component values used for the original
compensation finding. No new atmospheric integration is involved. Each group
contains 32 selected values; this is neither the full dome nor the seventeen-time
Kider score.

For an independent physical first order P1, measurement M and reconstructed
cumulative orders L1 through L4, the remainder after replacing first order is

`r = (P1 - M) + (L2 - L1) + (L3 - L2) + (L4 - L3)`.

The added-order terms are reconstructed effective contributions. They have not
yet been independently established as accurate higher-order radiances.

| Selected group | Mean P1 - M | Mean order-two addition | Mean order-three addition | Mean order-four addition | Mean remaining residual | RMS remaining residual |
| -------------- | ----------: | ----------------------: | ------------------------: | -----------------------: | ----------------------: | ---------------------: |
| All 160        |     -26.269 |                  13.152 |                     4.351 |                    1.735 |                  -7.031 |                 32.050 |
| 09:30          |     -18.463 |                  15.441 |                     4.686 |                    1.816 |                   3.480 |                 28.019 |
| 10:15          |     -12.530 |                  11.928 |                     3.776 |                    1.525 |                   4.699 |                 13.582 |
| 11:15          |     -18.772 |                  10.907 |                     3.577 |                    1.447 |                  -2.842 |                 25.946 |
| 12:30          |     -40.420 |                  12.832 |                     4.504 |                    1.810 |                 -21.273 |                 52.036 |
| 13:30          |     -41.159 |                  14.654 |                     5.212 |                    2.076 |                 -19.217 |                 28.028 |

All table values are mW m^-2 sr^-1 nm^-1. Positive residual means brighter than
measurement. Across the selected values, 90 residuals are positive and 70 are
negative. Their signs therefore cannot be explained or corrected by adding a
uniform positive contribution alone. Physically nonnegative missing orders
cannot reduce an already-positive residual while all represented contributions
remain fixed. This observation does not establish the actual missing tail or
the accuracy of the retained orders.

## Positive-altitude boundary pilot

[00153-volume-l1-pilot](../../../../../tmp/experiments/sky-accuracy-dials/runs/00153-volume-l1-pilot/reference.json)
evaluated eight incident rays in channels 0 and 8, separating atmospheric first
scattering from direct Lambertian ground reflection. Both original surface
witnesses agree with the previous independent first-order reference within
their combined allowances. The four inward ground-hit heights approach the
finite direct-ground limit as predicted; both one-millimetre checks pass.

The inward escaping ray at 1000 metres is unresolved because the independent
Simpson method reached its subdivision-depth cap. Accordingly, the complete
pilot did **not** pass all scientific predicates. It does not qualify a
second-order viewing-ray reference or a Kider improvement.

Read-only tracing of the experiment's actual recurrence confirms that its
positive-height incoming L1 field already includes direct ground reflection.
The J2 scatter step reads L1 at the same retained position; it does not
interpolate L1 before that scatter. The exact-ground inward-zero convention
therefore creates a difference in the ground J2 knot, and subsequent altitude
interpolation of J2 spreads that difference into the first interval. The
relevant source owners are the experiment's [order kernels](../../../../../experiments/sky-accuracy-dials/orders/kernels.js)
and [view reconstruction](../../../../../experiments/sky-accuracy-dials/numerics/view.js).
This identifies a possible boundary representation error, without establishing
its magnitude or explaining the previous altitude-sampling score regression.

For the frozen outward views from the ground, the physical second-order target
is the view integral of the scattered continuous L1 field, including its
direct-ground part. There is no extra ground-reflection term at the final view's
boundary because that view exits the atmosphere. At the observer endpoint, an
integration rule must distinguish the positive-height limit from the separate
stored inward-zero convention; a single mathematical endpoint has zero path
measure. Compare that reference with grouped N2 minus grouped N1, preserving
the original grouped reconstruction and subtraction allowances.

## Angular development and reference error allocation

[00154-j2-ang-derive](../../../../../tmp/experiments/sky-accuracy-dials/runs/00154-j2-ang-derive/reference.json)
completed the original-sum replay, derived azimuth comparisons and the missing
full-interval radial32/azimuth32 midpoint rule. The subsequent
[00155-j2-ang-dev](../../../../../tmp/experiments/sky-accuracy-dials/runs/00155-j2-ang-dev/reference.json)
stopped after seven new incident evaluations because its first hemisphere16
grazing witness was unresolved. That incomplete development record does not
qualify the later held target.

Read-only instrumentation of both failed witnesses found that their radiance
components passed the deepest local error comparisons. The auxiliary integrand
carrying the optical-column error estimate failed instead. Its small jumps
occur when the inner adaptive column integrators change subdivisions. A local
tolerance proportional to interval length can shrink as quickly as the error
from a jump, so subdividing further does not necessarily satisfy the local test.
These traces are diagnostic observations, not sealed reference results.

The registered global-allocation control is now complete.
[00156-volume-l1-global](../../../../../tmp/experiments/sky-accuracy-dials/runs/00156-volume-l1-global/reference.json)
admits all eight witnesses and passes all 78 predicates without changing the
equations, inner column integrations, quadrature methods, depth cap or final
admission thresholds. Each formerly admitted atmospheric, direct-ground and
total component agrees within its combined comparison allowance. The largest
mean change is 1.672e-9 W m^-2 sr^-1 nm^-1, against an allowance of 6.675e-7.

The allocator retains a complete interval partition and refines its largest
normalized error contribution until every summed component estimate meets its
original whole-integral tolerance. This resolves the auxiliary-error jumps
without discarding them or relaxing the accuracy requirement. Manufactured
global-allocation proofs pass 157 checks; the existing physical and volume
proofs pass 115 and 212 checks. Material discontinuities can still hit the depth
cap, and such failures remain explicit. These are empirical error estimates,
not rigorous bounds.

## Held angular reference

The revised chain comprises
[00157-j2-ang-derive](../../../../../tmp/experiments/sky-accuracy-dials/runs/00157-j2-ang-derive/reference.json),
[00158-j2-ang-dev](../../../../../tmp/experiments/sky-accuracy-dials/runs/00158-j2-ang-dev/reference.json),
[00159-j2-ang-predict](../../../../../tmp/experiments/sky-accuracy-dials/runs/00159-j2-ang-predict/reference.json)
and [00160-j2-ang-fine](../../../../../tmp/experiments/sky-accuracy-dials/runs/00160-j2-ang-fine/reference.json).
The prediction record was sealed before the held fine evaluations. All new
incident rays are admitted; the fine record includes 8,320 new unique incident
rays and 4,160 reused records.

The comparison covers four ground probes, two at 09:30 and two at 12:30, in
channels 0, 8, 24 and 30. At fixed 32 midpoint azimuth samples, full-interval
radial count gives this aggregate local second-order source-density trend:

| Radial samples | RMS difference / RMS held reference |
| -------------- | ----------------------------------: |
| 16             |                            0.34410% |
| 32             |                            0.07659% |
| 64             |                            0.01731% |

These are equally weighted norms over 16 component scalars, not Kider RMSE or
whole-view radiance. The approximately 4.5-fold reductions per doubling are a
retrospective trend, not a prospectively qualified convergence rate.

All 16 held comparisons pass correction-shrinkage, proximity to the independently
mapped radial rule, forecast-envelope and angular-adequacy predicates. However,
the final hemisphere16-to-hemisphere32 improvement is smaller than comparison
uncertainty in every scalar. Consequently none qualifies a resolved magnitude
prediction for that final refinement. The maximum relative reference allowance
is about 0.000990%; small agreement below it is not established true accuracy.

Across six older angular controls and 16 scalars, 83 of 96 comparisons show a
qualified numerical-error reduction and 13 regress. Twelve regressions are
channel 30 at the two morning probes across all six controls; the remaining
one is channel 30 at `p1230-4-4` for full32/azimuth32 midpoint sampling. Thus
angular quadrature also contains compensating errors: strong aggregate
improvement does not imply every individual spectral value improves.

Runs `00152` through `00160` added 14,675,874 retained bytes, with zero scratch
remaining. Total retained evidence is 279,251,030 bytes. No GPU run was added.

## Current conclusion

The remaining discrepancy has mixed signs, so one missing positive scattering
term cannot explain every selected error. Error allocation is now a tested
operational control that resolves reference failures at unchanged tolerances.
Radial sampling substantially reduces aggregate local second-order angular
error, while the individual regressions expose further cancellation.

The ground-boundary mechanism is traced but its viewing-ray impact remains
unmeasured. The next step is a positive-height local second-order pilot and then
an independently qualified second-order viewing-ray reference, comparing like
order groupings. Neither has started. These component findings do not establish
a new overall Kider improvement or yet separate all higher-order numerical
error, missing orders and physical or measurement assumptions. Work is paused
at the owner's requested manual checkpoint; formal verification remains deferred.

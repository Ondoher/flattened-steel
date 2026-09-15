# Angular Endpoint And Azimuth Cancellation Control

Status: prospective `compensation-attribution-v1` diagnostic, frozen before
evaluating these new components or rules. The preceding
[placement control](angular-frame-control-plan.md), `00218`, identifies a large
error caused by polar node placement. This package distinguishes endpoint
regularity and lost azimuth cancellation from a generic lack of samples.

## Governing Expectation

Retain the same morning h1000 geometry and phase-product field
`F(w)=p_CS(s dot w)*p_CS(o dot w)`, with its authenticated analytic convolution
from `00210`. Define the half-turn about the Sun `T(w)=(-wx,-wy,wz)` and
`E=(F+F(Tw))/2`, `O=(F-F(Tw))/2`. Exactly, the sphere integral of O is zero
and the integral of E equals the known integral of F. Decompose each discrete
error as `(QE-I)+QO`, retaining its arithmetic identity and uncertainties.
This is an attribution control, not an atmospheric symmetry assumption.

Also integrate the smooth Cartesian polynomial
`f(w)=(1+w.z)^4*(w dot e1)`, where e1 is the radial projection perpendicular
to the Sun. Its exact sphere integral is zero. In polar cosine mu it becomes
`(1+mu)^4*sqrt(1-mu^2)*cos(phi)`. Shared-mu rings cancel its azimuth dependence;
the physical interval construction uses different mu nodes at different phi.

Near the upper endpoint this polynomial is
`16*sqrt(2)*cos(phi)*(1-mu)^(1/2)` to leading order. The known endpoint
expansion motivates a leading `(n+1/2)^-3` Gaussian error. See Sidi,
[Asymptotic expansions of Gauss-Legendre quadrature rules for integrals with endpoint singularities](https://www.researchgate.net/publication/220576304_Asymptotic_expansions_of_Gauss-Legendre_quadrature_rules_for_integrals_with_endpoint_singularities),
Mathematics of Computation 78 (2009), 241-253, DOI
`10.1090/S0025-5718-08-02135-2`, Theorem 1.1. This asymptotic result does not
guarantee the finite-count thresholds below.

Our sign prediction follows from the interval geometry: the terminal interval
is wider where cos(phi) is positive. Its positive square-root quadrature bias
therefore need not cancel the opposite azimuth's bias. In polar angle theta,
including the sin(theta) solid-angle Jacobian, the same integrand becomes
`(1+cos(theta))^4*sin(theta)^2*cos(phi)`, analytic at both endpoints.
The coordinate control keeps the same physical partitions and count.

## Fixed Matrix

| Rule | Polar coordinate and nodes per interval | Azimuth count | Purpose |
| --- | --- | ---: | --- |
| ring32-a64 | Unpartitioned mu, Gauss32 | 64 | Exact azimuth cancellation control |
| mu8-a16 | Physical splits, Gauss8 in mu | 16 | Replay coarse 00218 and separate E/O |
| mu16-a32 | Physical splits, Gauss16 in mu | 32 | Replay medium 00218 and separate E/O |
| mu16-a64 | Physical splits, Gauss16 in mu | 64 | Fixed-azimuth polar ladder |
| mu32-a64 | Physical splits, Gauss32 in mu | 64 | Replay fine 00218; polar ladder |
| mu64-a64 | Physical splits, Gauss64 in mu | 64 | Genuinely new held polar count |
| mu32-a128 | Physical splits, Gauss32 in mu | 128 | Azimuth-only control |
| theta16-a64 | Same physical splits, Gauss16 in theta with sin(theta) Jacobian | 64 | Matched-count endpoint control |

All mu splits must use the unchanged `sunFrameGroups` implementation and
explicit mirror members. The theta implementation derives and checks the
same analytic boundary equations, unit directions, branch classifications,
positive weights and solid angle. No phase or weight renormalization is used.

## Frozen Predictions And Checks

Keep geometry, replay and sum-identity checks separate from scientific gates.
Replay the three original product integrals within joint arithmetic allowances.
Use the previous operand-scaled arithmetic convention and analytic reference
allowance. A comparison below its allowance remains unresolved.

1. The ring rule's polynomial and O integrals are zero within arithmetic
   allowances, as required by their exact azimuth symmetries.
2. For each of the three replayed split rules, QO is negative and accounts for
   at least 80% of the absolute phase-product error: require
   `abs(QE-I)+U_even <= 0.2*(abs(QF-I)-U_full)`. Keep a failure if the even
   component remains material. This tests a specific cause, not merely a sign.
3. The polynomial integral is positive and resolved for mu16/32/64 at fixed
   azimuth64. Its successive conservative ratios lie in `[1/16,1/4]`, around
   the expected leading one-eighth ratio. Use complete interval comparisons,
   not only a fitted central value.
4. At polar32, doubling azimuth64 to128 changes both the polynomial bias and
   QO by at most 1% of their azimuth64 magnitudes, including allowances. This
   tests whether azimuth error still contaminates the inferred polar rate.
5. The held mu64 polynomial and QO values are predicted from mu32 by
   `((32+0.5)/(64+0.5))^3`. Require the same resolved signs and at most 25%
   relative prediction discrepancy against each held magnitude, including
   propagated allowances. Keep this prospective new-count test distinct from
   retrospective comparison of the already-known full phase-product values.
6. At matched 16-by-64 counts, theta reduces absolute polynomial bias and
   phase-product error by at least 99%, including allowances. A failure limits
   the proposed endpoint explanation; it is not repaired by changing counts
   or the tolerance after execution.

Preserve every failed/unresolved gate and all signed E/O and polynomial values.
No result establishes an atmospheric angular reference, a Kider improvement,
or the correctness of averaging actual incident light across the half-turn.

## Implementation And Resources

Use only a new `continuation/angular-endpoint-control/` source unit and
unchanged experiment helpers. Its deferred source-review baseline is
`871690d334b4339f7aaee516dcc140dd00a3edaf`. Run focused manufactured geometry,
Jacobian, cancellation and gate proofs and the complete POC type check.
Formal standards review remains deferred. No production source is modified.

One immutable C5 record is capped at 2 MiB and five CPU-job minutes, including
failed evidence, inside the unchanged campaign allocation. Authenticate
`00210`, `00212`, `00218`, C0 and every reused collaborator. Reuse the `00210`
source snapshot with a complete delta and derivation chain. Retain compact
sums and counts; no atmospheric integrations, GPU work, large cache, scratch
or deletion is required. Keep the existing 40 GiB disk floor and write guards.

For this compact analytic diagnostic, the prospective prediction is the fixed
dimensionless formula in this plan. Construct and retain its scalar forecast
from mu32 before computing mu64, and retain both in the single evidence record.
This explicitly adapts the earlier separate prediction-record sequence; do not
claim a separately sealed scalar forecast. No coefficient is fitted after the
held result. The new setting tests the preregistered formula and its tolerance.

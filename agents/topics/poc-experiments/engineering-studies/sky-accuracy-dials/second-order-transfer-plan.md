# Second-order Accuracy And Compensation Transfer

Extension: `compensation-attribution-v1`. This registers a second physical
condition before computing its viewing-ray reference. Execution is conditional
on first resolving the morning reference in the
[angular plan](second-order-angular-plan.md). Historical candidate outputs and
Kider measurements are known; the new continuous second-order reference is
the held output.

## Question And Fixed Comparison

Use original C0 `p-1230-3-5`, channels 0/8, with the identical physical model,
global independent L1 admission and original numerical tolerances. This ray
has a negative remaining measurement residual, contrasting with the positive
residual at `p-0930-5-7`.

The authenticated H effective second-order values are
0.015625420547034335 and 0.012078198164031051 W m^-2 sr^-1 nm^-1.
The original physical-P1-plus-cached-higher residuals are
-0.056528532608610266 and -0.18914411397258157 W in these channels.

Two existing numerical controls lower the cached contribution:

| Control                     |         Channel 0 P2 |         Channel 8 P2 |
| --------------------------- | -------------------: | -------------------: |
| P55 raw                     | 0.014842349304839755 | 0.010777761909458033 |
| P48 query-density factoring | 0.014734266519391553 | 0.010752083480511876 |

Their lower Kider brightness is not enough to decide numerical accuracy. The
new reference tests whether they remove the same interpolation bias as at the
morning ray, and whether that bias was compensating for a larger deficit here.

## Registered Matrix And Admission

Keep physical height splits [0,1875,8000,24000,60000] m and use the same exact
square-root-height constructors, omitted analytic zero ground Jacobian, three
original angular placements and component separation as the morning tests.
The new ray's source frame and view attenuation must be recomputed at its own
coordinates. Never reuse the morning physical values by altitude alone.

Stages are `transfer-gauss4`, `transfer-simpson4`, `transfer-gauss8-low`,
`transfer-gauss8-high`, `transfer-simpson8`, `transfer-az64-low` and
`transfer-az64-high`. Each first-stage rule requires sixteen physical queries;
the Simpson8 stage reuses the sixteen exact Simpson4 queries and solves only
the sixteen new queries. Each Gaussian8 and angular64 half has sixteen nodes.
Full-view integrals remain null until all required interval terms exist.

Use the morning frozen outer inequalities, with these new ray values G4/S4/G8/S8:
one-percent initial independent agreement; Gaussian correction at most half
the initial disagreement plus the original inner terms and 1e-7 W; refined
independent disagreement at most one-quarter of the initial disagreement plus
all four inner terms and 1e-7 W. Assess both fine angular placements and channels.

At fixed Gaussian8 physical nodes, apply the same ten angular predicates and
same positive-path absolute difference allowance equations from the angular
plan, including the 20% response multiplier and 1e-8 W floor. Require complete
physical admission and the same U_R ceilings of 5e-5 W and 20% of abs(H-R).
No gate is weakened to obtain transfer. Any failed predicate redirects a new
bounded test; it does not become a successful transfer by changing its factor.

## Held Accuracy And Score Predictions

1. The complete admitted R is below original H in both channels by more than
   their combined numerical allowances.
2. P55 raw and P48 query-density factoring each reduce absolute second-order
   numerical error by at least 80% relative to H and raw-split, respectively,
   in both channels. Use the original uncertainty-aware inequality from the
   outer plan, including the candidate/control view allowances and U_R.
3. Replacing effective cached J2 by R after physical P1 substitution makes
   both existing negative measurement residuals more negative and increases
   their individual squared errors. Require the correction sign and remaining
   residual sign to be separated from combined numerical allowances.
4. The exact identity `deltaSSE=2*e*delta+delta^2` reproduces the score change
   to operand-scaled arithmetic roundoff. Here e is the original residual
   after physical P1 substitution, and delta=R-H. Preserve the compensation
   cross term and the separate joint P1/P2 replacement relative to raw N4.

Prediction 3 is a forecast of losing beneficial numerical compensation while
improving the component's numerical accuracy. It does not seek a lower Kider
score by keeping that bias. P3/P4 remain explicitly frozen; the reference is
second order only. Compare all eight already registered numerical controls at
this ray and report their responses, uncertainty limits and differences from
the morning condition without inventing withheld candidate-output claims.

## Cost, Evidence And Next Decision

Before each physical stage, authenticate remaining C5, CPU-job and retained
budgets. Reserve 4 MiB and one CPU-job hour with a one-minute terminal reserve,
four workers and twice-slowest-point forecasting. Keep the 40 GiB free-space
floor, immutable parent/source policy and original total ceilings. These stage
caps are not new cumulative authorizations. Retain compact sums and exact
derivations; incident arrays remain reproducible in memory.

If transfer succeeds, the altitude/representation controls have numerical
support across two contrasting conditions, and the compensation explanation
has a prospective opposite-score test. Their range remains these selected
channels and rays. Then select a new, unexecuted setting or relevant joint
configuration to test a candidate-output prediction, while separating the
remaining higher-order and physical/measurement discrepancy. Matched N5/N6
work is a separate missing-order diagnostic; historical unmatched tails cannot
be silently added to either reference.

If the reference or dial prediction fails, localize the discrepancy by physical
interval, component and angular response before choosing another setting. A
failure is useful evidence about the dial's range, not a reason to retune an
empirical convergence exponent. Formal source review remains deferred, and
production remains read-only.

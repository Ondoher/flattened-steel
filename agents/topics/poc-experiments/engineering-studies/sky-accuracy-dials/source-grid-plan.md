# Original Solar Grid And Finite Source Integration

Status: registered before evaluating the combined representation controls.
This case continues `compensation-attribution-v1` after `00204` validated
density-factored sunlight columns at exact solar cosines.

## Question And Controls

The successful exact-solar control used extra diagnostic columns. Reconstruct
the same first-order density using only the original sixteen altitude/solar
column anchors from `00188`/`00189`, with the original solar cubic and altitude
weights. Apply analytic query phase and density, and reconstruct each species'
finite-top-adjusted normalized geometric sunlight column. Restore transmission
only after forming spectral optical depth. Keep every original sample and
projection weight. No new GPU cache or physical integration is required.

At each altitude/solar anchor define
`Q_i=exp(h/H_i)*(C_i+(H_i/mu)*exp(-A/H_i))`. Interpolate Q with the original
solar cubic and altitude weights, then recover the query column as
`exp(-h_query/H_i)*Q_query-(H_i/mu_query)*exp(-A/H_i)`.
Use relative altitude exponentials for numerical stability. Reconstruct
independent-reference, S80, and S160 columns separately. These controls leave
source-grid angular reconstruction present; they do not use the exact-solar
crossed columns to form a candidate.

Also propagate a geometric Euler-Maclaurin S80-to-S160 prediction through the
same nonlinear reconstruction. For each original geometric column,
`deltaC=-(L/80)^2*(f'(L)-f'(0))/16`, where
`f'(s)=-exp(-altitude(s)/H)*mu(s)/H`. Predict the new combined output from
`C80+deltaC`; do not infer the response from brightness or Kider values.
The S160 columns are existing known evidence: this is a registered propagation
test of a new combination, not a newly withheld source-count experiment.

## Frozen Predictions

For each of the four ray/channel projections:

1. With independent columns, the combined representation removes at least 99%
   of the earlier density-factored error from `00202`, including allowances.
2. S80 and S160 errors against the continuous query field are both negative.
3. S160/S80 absolute error ratio lies in [3/16,5/16], conservatively using
   propagated error intervals. Unresolved controls stay unresolved.
4. The endpoint-derivative response prediction has at most 2% relative error,
   comparing prediction discrepancy plus allowances with the resolved actual
   response minus its allowance. No response coefficient is fitted.

Retain all twenty group predicates and every local sign, error and prediction.
Component-field correctness is independent of Kider agreement. Failure of a
combined prediction does not invalidate an analytically correct component;
it identifies residual interactions that need attribution.

## Evidence And Bounds

Authenticate and exactly replay `00204` and its prior decompositions. Read
original source columns with their existing immutable identities. Derive
per-species reference allowances from both adaptive methods/scales and their
geometry discrepancy; finite columns carry explicit arithmetic allowances.
Propagate bounds through cubic solar reconstruction, positive altitude sums,
optical depth and exponential attenuation. Preserve all source and target
identities. Do not interpret the empirical allowances as physical-model bounds.

Manufactured checks cover finite-top plane-parallel normalization, zero
illumination, constant-column reconstruction, and the endpoint derivative
prediction sign and its known exponential-integral response. Run the full POC
type check. Preserve existing numerical evaluator files for replay. Formal
standards review remains deferred under the owner's credit-use instruction.

One run may retain 4 MiB and consume five CPU-job minutes, with a 30-second
finalization reserve, within existing cumulative allocations. No new column
solve, GPU work or large scratch is allowed. One accepted result, including
failed scientific predictions, completes this test. It does not automatically
authorize a broad parameter sweep, physical fitting or production modification.

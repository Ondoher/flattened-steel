# Matched H finite-order assessment

This contained, read-only assessment authenticates original attribution run
`00152-a-order-split` and matched H capture `00171-matched-h-n6`. The latter must
reproduce the complete original H N4 prefix. Two frozen C0 rays and channels 0/8
are assessed; all original P1-minus-measurement, effective J2/J3/J4 and N4 values
are retained unchanged.

For original residual `r`, P1 correction `c = -firstNumerical`, and finite matched
addition `t = N6 - N4`, the two interventions are `r -> r+t` and
`r+c -> r+c+t`. Each squared-residual change is exactly `2*r*t+t*t` on its own
baseline. Their difference is `2*c*t`: a dependence on the residual baseline,
not a recomputed interaction in the recurrence. Both effective added increments
and cumulative N4/N5/N6 are retained.

Allowances propagate the existing empirical view envelopes and physical P1
allowance, preserving nulls. Shared N4 terms cancel in the final N6 residual
allowance. Model and measurement uncertainty are excluded. The two increments
do not bound the infinite tail, establish higher-order accuracy, or determine
the full benchmark score. Effective grouped differences include the original
nonlinear reconstruction. Physical P1/P2 substitution remains unresolved until
a separately adequate physical P2 reference exists.

`readMatchedOrderAssessment(registration)` authenticates the input;
`assessMatchedOrders(original, diagnostics)` is the pure assessment;
`matchedOrderAssessmentProof()` checks algebra, signs, allowance propagation,
unchanged input identity, unresolved references and malformed prefixes.

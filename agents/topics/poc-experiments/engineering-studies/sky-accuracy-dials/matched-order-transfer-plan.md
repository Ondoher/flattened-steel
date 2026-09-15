# Altitude-by-order Response Prediction

Extension: `compensation-attribution-v1`. Register after matched H run `00171`
and before any matched P55 N5/N6 calculation. The original H and P55 N1-N4
outputs are known. This is a held intervention response test, not unseen Kider
data and not an independent accuracy reference for the higher orders.

## Inputs And Mechanism

Use the original grouped seven-method envelopes at `p-0930-5-7` and
`p-1230-3-5`, channels 0/8. Authenticate H N1-N4 from `00103`, P55 N1-N4 from
`00132`, and matched H N5/N6 from `00171`. Require exact matched H N4 prefix.
The existing matched-order plan owns physical controls, raw P55 construction,
prefix parity, partial spectral scope and the six-MiB/fifteen-minute GPU cap.

Let Hk and Pk denote effective increments Ek-E(k-1), and qk=Pk/Hk for
k=2,3,4. In all four selected comparisons, q2<q3<q4<=1 within the observed
central values: altitude refinement's relative dimming weakens with order.
Scattering redistributes incident light, so an initial spatial bias can change
relative importance as the recurrence progresses. This motivates a transient
response model; it does not establish a spectral eigenmode or asymptotic law.

## Frozen Models And Held Predictions

Write uk=log(qk), d3=u3-u2 and d4=u4-u3. The primary **damped log-ratio**
model requires 0<d4<d3 and defines beta=d4/d3:

```text
u5 = u4 + beta*d4
u6 = u5 + beta*beta*d4
predicted P5 = exp(u5)*H5
predicted P6 = exp(u6)*H6
```

The registered comparison model, **last log step**, holds the latest slope:
u5=u4+d4 and u6=u4+2*d4. Retain both predictions and all their failures;
never choose the better model after seeing P55 and call it the original model.

The held quantities are the separate altitude responses
delta5=P5-H5 and delta6=P6-H6, plus their sum deltaTail. Do not dilute their
error by scoring the much larger, already-known N4 altitude response. Retain
the known N4 difference separately when reconstructing the N6 contrast.

Propagate each original cumulative envelope interval through increment,
division, logarithm, subtraction, multiplication and exponential using outward
roundoff padding. Require positive increment intervals and the entire d3/d4
and beta intervals to satisfy model admission. Missing/invalid input remains
unresolved. This interval describes input numerical uncertainty, not unknown
model error or recurrence-field accuracy.

For the primary model, prospectively require:

1. All four model inputs are admitted and all eight target increments have
   admitted view envelopes and exact matched N4 prefixes.
2. Across the eight separate responses, the L2 prediction-error norm is at
   most 25% of the predicted-response norm plus the L2 norm of summed prediction
   and target input allowances. Apply the same threshold separately to each
   of the four two-order ray/channel groups; an aggregate pass cannot hide a
   group failure.
3. At least 90% of resolved individual signs agree beyond the per-scalar floor
   `predictionAllowance + targetAllowance + 1e-10 W`. A predicted or observed
   response inside its floor remains unresolved and does not count as a passed
   sign. Report all eight states and require at least four resolved signs for
   a sign-rate qualification; the claim covers those resolved responses only.
4. The primary prediction-error norm is no greater than the comparison
   model's error norm plus both models' and the target's L2 input allowances.
   A difference inside that allowance is explicitly unresolved as superiority,
   even if this noninferiority predicate passes.

Compare known original N4 radiance and finite tail responses through the exact
SSE identity at identical measurements. Keep response predictability, numerical
accuracy, Kider improvement and an infinite-tail bound separate. No successful
response forecast establishes any of the latter three.

## Execution And Evidence

Seal the numerical predictions and exact inputs in a separate immutable
`matched-p55-predict` record before GPU construction. The prediction calculation
uses no P55 N5/N6 fields, values or spectra. A later `matched-p55-assess` record
replays the original model and evaluates every registered predicate. Each
CPU record is capped at 3 MiB and five minutes with thirty seconds reserved for
finalization, charging the existing C5 and cumulative budgets. Prediction and
assessment code stays contained, with focused manufactured proofs and local
type checking; formal review remains deferred by the owner's instruction.

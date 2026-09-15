# Prospective altitude-by-order response

`predictMatchedAltitudeOrders` accepts cumulative H1..H6 and P55 N1..N4
envelopes. It rejects P55 target orders and emits both models registered in
`matched-order-transfer-plan.md`: damped log-ratio and last log step.

Each response is P55 minus H at actual order five or six; the summed tail keeps
their signed cancellation. Outward-padded interval arithmetic propagates only
input-envelope uncertainty. Model bias, recurrence-field accuracy and the
infinite scattering tail remain separate. Nonpositive or unresolved increments
and unsupported slope intervals prevent admission.

`matchedOrderTransferProof()` verifies a manufactured geometric transient,
all 1024 input-interval corners, and missing/invalid/target-input rejection.
It creates no evidence run or atmospheric calculation. The caller owns original
input authentication, a separate sealed prediction before target execution,
every held assessment predicate, and immutable output provenance.

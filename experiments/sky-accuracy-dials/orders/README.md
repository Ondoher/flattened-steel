# Six-order diagnostic

This contained route executes real receiver-local pure orders J1 through J6.
It reuses the authenticated production common shader and exact retained fragment
templates. It preserves the original direct-base, J1, and independently integrated
L1 stages, then repeats the existing scatter/transport equations. Each Ln transports
Jn and reflects the previous L(n-1) at the ground; L1 retains direct ground illumination.
The source-aligned coordinate contract is rejected.

The original request remains an authenticated N4 input. The separate driver/result
schemas and `actualOrders: [1, 2, 3, 4, 5, 6]` identify the executed extension. This
does not claim that changing the production maximum-order parameter executes N6.

Only channels 0 and 8 execute. `screen` covers 09:30, 11:15, and 13:30;
`all-times` covers all seventeen registered conditions. Six-order spectra are
binary64 W m^-2 sr^-1 nm^-1 in representation/view/order/scene/X/Y order.
Two-channel measurement scores are diagnostics, not full B1 scores.

The callable entry is `executeOrders(caseId, selection = 'screen')` in
`orders/run/execute.mjs`. The CLI is:

```text
node experiments/sky-accuracy-dials/orders/run/execute.mjs baseline screen
node experiments/sky-accuracy-dials/orders/run/execute.mjs t160 all-times
node experiments/sky-accuracy-dials/orders/run/execute.mjs i512 all-times
```

Execute through the repository's configured Node and explicit system Chrome only
after the source-freeze and single-GPU execution gates are satisfied.

The browser captures the union of primary Q30 supports and the matched historical
screen supports. It requires exact J1..J4 and Float32-left-fold C1..C4 hashes against
that authenticated parent, plus exact four-order spectra on its original views.
Every primary six-order evaluator prefix is also checked against the unchanged
four-order evaluator using the same actually captured fields. Source-template
equality and manufactured evaluator parity are retained separately from GPU parity.

The driver retains one J and at most two L textures, just as N4 does. Sparse fields
live for one channel only; no full recurrence texture or scene package is written.
The existing loopback host owns the browser lifecycle, and the experiment run
recorder owns immutable evidence, progress, storage gates, and scratch cleanup.

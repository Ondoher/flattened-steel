# Nonnegative Scattering-order Residual Bound

Extension: `compensation-attribution-v1`. This is a retrospective diagnostic
of already observed component references, not a held prediction or a new
physical experiment. It addresses whether unknown higher-order numerical error
could account for the entire remaining morning measurement excess.

For the declared scalar, fixed-medium radiative-transfer model, every physical
scattering order is nonnegative: illumination, scattering coefficients, phase
functions, attenuation and ground reflection are nonnegative. With physical
first and second orders P1/P2, all later orders Q>=0 and fixed measurement M,

```text
P1 + P2 + Q - M >= P1 + P2 - M
lower = (estimated P1 + estimated P2 - M) - U1 - U2 - Uroundoff
```

A strictly positive lower value means no choice of nonnegative later physical
orders can remove that excess under the admitted component error budgets.
Cached third/fourth increments are not used in the bound. Retain them only to
show how much of the current substituted residual they contribute. A negative
lower value is uninformative about the unknown tail and is not a passed fit.

Use exact C0 rays `p-0930-5-7` and, only after its independent reference is
adequate, `p-1230-3-5`, channels 0/8. Authenticate original order attribution
`00152-a-order-split`, original registration and the adequate P2 reference.
Require all twelve outer and ten angular gates, both channel adequacy gates,
the original reference ceilings, and unchanged 22-file physical numerical core.
Retain exact parent identities, equations, source/runtime identities and inputs.

The first-order allowance comes from the physical reference, not from a cache
view error or the measured residual. The second-order allowance is the complete
admitted empirical reference allowance. Add an operand-scaled binary64
roundoff allowance. Missing component allowances leave the bound unresolved.

This is a conditional numerical bound, not a confidence interval for measurement
or all physical assumptions. Measurement uncertainty is unquantified. Report
the upward measurement shift needed to erase a positive lower bound, in
absolute units and as a fraction of the original measurement, without claiming
that such a shift occurred. Shared reference bias outside the empirical
allowances, model/parameter mismatch, geometry and observation comparison
remain possible explanations. No specific aerosol or measurement cause is
identified. Altering the assumed physical problem is a separate intervention.

Reserve at most 3 MiB and five CPU-job minutes per diagnostic, including a
thirty-second finalization reserve, within existing C5 and cumulative limits.
No GPU construction, retained texture or new physical integration is required.
Use immutable new runs, preserved parent evidence, exact source snapshots and
focused algebra proofs. Production stays read-only; formal review is deferred.

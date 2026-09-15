# Registered second-condition reference

The topic's second-order-transfer-plan.md registers the original 12:30 ray and
channels 0/8 before their new physical reference exists. This wrapper consumes
an accepted adequate morning reference, then serially executes Gauss4,
Simpson4, both Gauss8 halves, Simpson8, both azimuth64 halves and assessments.
Every child owns a fresh immutable run and charges the existing budgets.

The existing outer/azimuth runners accept the optional morning-admission run.
Their default remains the original morning geometry. The shared numerical core,
physical L1 equations, quadrature constructors, integration tolerances and
original reference/prediction inequalities remain unchanged. Physical values
are reused only at exactly matching world geometry and numerical policy.

The transfer report additionally checks a lower physical P2 and the predicted
loss of numerical compensation at the already negative noon measurement
residual. Third/fourth effective contributions remain frozen. A reference or
prediction failure remains explicit and requires a new bounded diagnostic.

```text
node experiments/sky-accuracy-dials/continuation/second-order-transfer/sequence.mjs <accepted-adequate-morning-report> [existing-transfer-gauss4-run]
```

To continue one outer stage after an accepted parent without repeating the
earlier stages, use the explicit optional admission argument. A literal dash
means no parent only for the fresh Gauss4 stage:

```text
node experiments/sky-accuracy-dials/continuation/second-order-refine/run.mjs <stage> <C0> <attribution-plan> <refinement-plan> <parent-run-or-dash> <accepted-adequate-morning-report>
```

Production and historical evidence remain read-only. Formal source review is
deferred as directed; local proofs and type checks do not close that gate.

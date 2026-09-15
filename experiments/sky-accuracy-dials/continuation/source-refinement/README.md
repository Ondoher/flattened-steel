# Held source refinement

This bounded scientific component test predicts S160-to-S320 after correcting
the identified original-grid first-order reconstruction errors. The
[plan](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/source-refinement-plan.md)
owns its prospective gates, empirical reference scope and resource limits.

Use the pinned C0 Node tool. Each command allocates an immutable record:

```text
node experiments/sky-accuracy-dials/continuation/source-refinement/run.mjs predict <C0> <00205-source-grid>
node experiments/sky-accuracy-dials/continuation/source-refinement/run.mjs target <C0> <accepted-prediction-run>
```

Do not modify source or the registered plan between forecast and target. The
target authenticates the prior accepted forecast and unchanged implementation
before evaluating atmospheric S320. Manufactured proofs use synthetic fields.
Group projections are W m^-2 sr^-1 nm^-1; local densities are
W m^-3 sr^-1 nm^-1. Neither is a complete viewing integral or a Kider score.

Production and historical evidence remain unchanged. Formal source review is
deferred; local proofs and type checking do not close that gate.

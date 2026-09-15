# Independent second-order viewing integral

The [reference plan](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/second-order-reference-plan.md)
owns prospective geometry, comparisons and interpretation. This runner samples
physical local J2 along the original C0 view, retaining four source components,
three angular placements and independently evaluated final-view attenuation.

Use the original pinned Node v25.4.0. Each evidence stage creates an immutable
record with a four MiB forecast, a one-hour ceiling, a one-minute terminal
reserve and cumulative C5 admission. Four workers preserve serial summation
order; their exact numerical and cancellation proof is retained in each run.
Incident arrays remain in memory. No GPU fields or production writes are used.

```text
node experiments/sky-accuracy-dials/continuation/second-order-view/run.mjs proof <C0-run>
node experiments/sky-accuracy-dials/continuation/second-order-view/run.mjs pilot <C0-run> <attribution-plan>
node experiments/sky-accuracy-dials/continuation/second-order-view/run.mjs coarse <C0-run> <attribution-plan> <accepted-pilot>
```

The pilot evaluates two of sixteen prepared queries. The coarse stage verifies
the exact pilot source/geometry/policy identities and evaluates the other
fourteen. Incomplete intervals retain null integrals. Passing inner numerical
admission does not qualify angular or outer quadrature accuracy. A whole-view
coarse estimate must be refined before use as an accuracy reference.

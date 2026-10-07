# Retained Reference Comparison

This analysis joins authenticated production captures, published-model
spectra, Kider measurements and the five-ray stochastic reference. It performs
no transport integration, fitting or production writes. Region definitions,
identities, uncertainty treatment and interpretation limits are frozen in the
[plan](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/reference-comparison-plan.md).

```text
node experiments/sky-accuracy-dials/continuation/reference-comparison/run.mjs proof
node experiments/sky-accuracy-dials/continuation/reference-comparison/run.mjs preflight
```

The single `execute` allocation is consumed by accepted 00231. Its
`analysis.json.gz` retains regional, band, time and directional summaries plus
all 20 signed-error decompositions. See the
[results](../../../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/reference-comparison-results.md).
Further evidence execution needs a new prospective reporting allocation;
historical inputs and sealed outputs remain immutable.

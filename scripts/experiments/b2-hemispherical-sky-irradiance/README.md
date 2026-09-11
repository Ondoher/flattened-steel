# B2 - Hemispherical Sky-Irradiance Benchmark

This directory reconstructs Bruneton Figure 8's 360--720 nm diffuse-sky
irradiance curve from the same 17-by-81 Kider directional spectral-radiance
field used by B1. The official production workflow scores the current
cache-backed cumulative-J4 boundary selected by the authenticated B1 manifest.
The retained five-profile Default/J2--J5 workflow remains available for
historical order comparisons. Every candidate passes through the same Figure
8 transform; B2 does not apply a candidate-specific correction.

It deliberately does not treat the separate Kider broadband global-horizontal
pyranometer series as the Figure 8 measurement. This stage is an aggregate of
B1's measurement field, not an independent measured observable.

Run from the repository root:

The current official GPU result consumes the same corrected production
manifest as B1 and is favorable: RMSE `2.406574 W m^-2`, bias
`-0.825717 W m^-2`, and worst absolute residual `4.452763 W m^-2` at
11:00. Reproduce B2 alone or publish the complete B-family record with:

```text
npm run score:algorithm32:b2-production:official
npm run score:algorithm32:b1-b3-production:official
```

The combined command is the official publication workflow. It proves that B2
integrates the exact table scored by B1 and used to derive B3.

```text
node --test --test-isolation=none scripts/experiments/b2-hemispherical-sky-irradiance/run.test.js
node scripts/experiments/b2-hemispherical-sky-irradiance/run.js
node scripts/experiments/b2-hemispherical-sky-irradiance/save-result.js
node scripts/experiments/b2-hemispherical-sky-irradiance/save-result.js --canonical
```

A freshly generated CPU-reference or GPU-shader production boundary is
selected as one immutable unit rather than as five unrelated table paths. The
manifest enforces one backend for every order:

```text
node scripts/experiments/b2-hemispherical-sky-irradiance/run.js --production-run references/results/experiments/b1-directional-sky-radiance/gpu/manifest.json
```

The production manifest selects one current production J4 boundary. It does
not require the legacy five-profile comparison to accept the official B2 run.

These default commands use the published Figure 8 result as the external
reference and do not regenerate the paper's model curves.

As an optional diagnostic, an already generated B1 nine-model spectral boundary
can be integrated into corresponding Figure 8 diffuse-sky curves with:

```text
node scripts/experiments/b2-hemispherical-sky-irradiance/run.js --published-models scripts/experiments/b1-directional-sky-radiance/published-models.tsv
node scripts/experiments/b2-hemispherical-sky-irradiance/save-result.js --published-models scripts/experiments/b1-directional-sky-radiance/published-models.tsv
```

The table is integrated directly on its canonical 9-by-9 direction grid; the
measurement-only north-sample repair is not applied to model output. Generating
these columns does not invent a plot-extraction tolerance. The canonical
durable result includes separate Algorithm32 Default and Algorithm32 J2
through J5 columns. The paper-model columns remain optional numeric
cross-checks.

Legacy results are written to
`references/results/experiments/b2-hemispherical-sky-irradiance/result.md`.
A production-run result is written beneath
`b2-hemispherical-sky-irradiance/cpu/` or its `gpu/` counterpart.
`--output-root PATH` changes the experiment-tree parent while preserving that
backend split inside B2.
The paper's Figure 8 is the primary external reference. The report may include
locally regenerated paper-model columns as an optional cross-check and records
the predeclared classification separately from benchmark acceptance.

A candidate table uses the same TSV shape with exactly one model named
`proposed`. Each candidate is accepted only alongside its own judgment record
written before that candidate result was examined. The canonical command binds
the durable Default and J2 through J5 tables, the optional nine-model table,
and all five rule files:

```text
node scripts/experiments/b2-hemispherical-sky-irradiance/save-result.js --published-models references/results/experiments/b1-directional-sky-radiance/published-models.tsv --proposed references/results/experiments/b1-directional-sky-radiance/algorithm32-proposed.tsv --judgment-rules scripts/experiments/whole-algorithm-judgment-rules.json --proposed-j2 references/results/experiments/b1-directional-sky-radiance/algorithm32-j2-proposed.tsv --j2-judgment-rules scripts/experiments/whole-algorithm-j2-judgment-rules.json --proposed-j3 references/results/experiments/b1-directional-sky-radiance/algorithm32-j3-proposed.tsv --j3-judgment-rules scripts/experiments/whole-algorithm-j3-judgment-rules.json --proposed-j4 references/results/experiments/b1-directional-sky-radiance/algorithm32-j4-proposed.tsv --j4-judgment-rules scripts/experiments/whole-algorithm-j4-judgment-rules.json --proposed-j5 references/results/experiments/b1-directional-sky-radiance/algorithm32-j5-proposed.tsv --j5-judgment-rules scripts/experiments/whole-algorithm-j5-judgment-rules.json
```

Each cumulative-order profile uses `--proposed-jN` and
`--jN-judgment-rules`. `--canonical` requires Default and J2 through J5 and
scores each independently under its pre-result rule record. Their
reported RMSE, bias, worst residual, and classification are properties of the
generated boundary data and are not hard-coded into this experiment contract.

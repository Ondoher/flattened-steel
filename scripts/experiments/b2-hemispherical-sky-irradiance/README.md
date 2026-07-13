# B2 - Hemispherical Sky-Irradiance Benchmark

This directory reconstructs Bruneton Figure 8's 360--720 nm diffuse-sky
irradiance curve from the same 17-by-81 Kider directional spectral-radiance
field used by B1 and independently scores the production Algorithm32 Default
boundary and the retained Algorithm32 J2 through J5 cumulative caches. All
five candidates pass through the same
Figure 8 transform; B2 does not apply a candidate-specific correction.

It deliberately does not treat the separate Kider broadband global-horizontal
pyranometer series as the Figure 8 measurement. This stage is an aggregate of
B1's measurement field, not an independent measured observable.

Run from the repository root:

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
node scripts/experiments/b2-hemispherical-sky-irradiance/run.js --production-run references/results/experiments/b1-directional-sky-radiance/cpu
```

The combined `score:algorithm32:b1-b3-production` command documented by B1 is
the preferred complete workflow. It guarantees that B2 integrates the same
tables scored by B1 and converted into B3 cubes.

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

# B1 - Directional Sky-Radiance Benchmark

This directory owns the independent B1 benchmark boundary. It does not import,
invoke, or instrument production Algorithm32.

The benchmark-owned mapping into the generic production execution contract is
defined in [`execution-profile-mapping.md`](execution-profile-mapping.md).
Candidate generation may import production Algorithm32 only in a separate
generator boundary; scoring in this directory remains independent.

## Current-production regeneration

The Stage 13 generator constructs the benchmark-owned direct-40 profile and
has an explicit `--backend cpu|gpu` switch. Both backends emit the same
40-channel table and cube schemas for the same 17 times and 81 exact benchmark
view directions at the paper/default cumulative scattering order J4:

- `cpu` builds the binary64 production reference cache and evaluates the
  binary64 final-view reference. It is the default for compatibility.
- `gpu` builds the production R32F cache through `ThreeCacheBackend`, executes
  the assembled production final-view transport shader, and replaces only the
  display conversion with a benchmark-owned float spectral readout. It does
  not perform final-view integration on the CPU.

The complete commands select J4 and all 17 conditions:

```text
npm run generate:algorithm32:b1-production:cpu
npm run generate:algorithm32:b1-production:gpu
```

The canonical production profile uses the selected Z-up spherical/distant
frame and exact-0 m first altitude node. Promotion run 043 completed all 17
conditions in 127.3 seconds, scored `11.925778` mW aggregate RMSE, and produced
the same J4 table SHA-256
`50a6df87d73bf0b7979faa21675ecdb50099f4be02229313ab65518727bcd486`
as the isolated retained-parity qualification.

A complete canonical generation also scores B1 and writes all six figures
owned by the original B1 experiment beneath the selected `cpu/figures/` or
`gpu/figures/` directory: the per-time and aggregate RMSE charts, three local
Figure 5 PNG panels, and the complete Figure 5 comparison chart. Bounded runs
do not generate figures because the original charts require all 17 conditions.
To publish the B1 report and figures from an already completed production run
without rebuilding its cache, use:

```text
npm run score:algorithm32:b1-production -- PATH_TO_RUN
```

The unsuffixed command remains the CPU default. An explicitly requested order
sweep is diagnostic rather than part of the canonical Bruneton reproduction.
Pass bounded selections after the npm argument separator, for example:

```text
npm run generate:algorithm32:b1-production:gpu -- --orders 2 --conditions 09:30 --output-root tmp/b1-j2-diagnostic
```

### Reflection-completed quadrature diagnostic

The benchmark generator also owns an isolated diagnostic profile that replaces
the production 34-direction incoming domain with the reflection-completed
136-direction domain from the Flat180 investigation. It changes only the
profile-supplied incoming quadrature; production defaults remain unchanged.
It is intentionally noncanonical and therefore requires an explicit output
root:

```text
node scripts/experiments/b1-directional-sky-radiance/generate-production-boundary.js --backend gpu --orders 4 --incoming-direction-variant reflection-completed-136 --output-root tmp/algorithm32-bruneton-paper/reflection-completed-136
```

Publish the B1 report and all six original figures from the completed boundary
without rebuilding its caches:

```text
node scripts/experiments/b1-directional-sky-radiance/publish-production-result.js tmp/algorithm32-bruneton-paper/reflection-completed-136/b1-directional-sky-radiance/gpu/manifest.json --output-root tmp/algorithm32-bruneton-paper/reflection-completed-136
```

The completed GPU diagnostic has aggregate RMSE `12.058524`, compared with
`12.225715` for the current production-34 boundary and `11.925783` for the
older retained result. It improves 11 of 17 time conditions, but its three
displayed Figure 5 values are mixed: 10:15 improves from `10.979203` to
`9.993825`, while 11:15 changes from `10.872635` to `11.670230` and 13:15 from
`11.823653` to `12.212165`. This is diagnostic evidence only; it does not
select the 136-direction domain for production.

### Dense paired-Fibonacci convergence diagnostic

The same benchmark-only profile seam accepts `paired-fibonacci-272` and
`paired-fibonacci-544` for bounded convergence tests. These variants preserve
uniform `4π/N` weights and exact antipodal pairs while changing only incoming
direction density. They are diagnostic profiles, leave production defaults
unchanged, and require an explicit output root. For example:

```text
node scripts/experiments/b1-directional-sky-radiance/generate-production-boundary.js --backend gpu --orders 4 --conditions 10:15 --incoming-direction-variant paired-fibonacci-272 --output-root tmp/algorithm32-bruneton-paper/paired-272-1015
```

Large dense J4 shaders can exhaust a retained WebGL driver's compiler
resources after multiple conditions even when owned textures and materials
have been disposed. Use one bounded process per condition for diagnostic
captures; each process creates a fresh WebGL context. This affects diagnostic
execution strategy, not the calculated values.

### Bruneton angular-grid diagnostic

The benchmark seam also accepts zenith-oriented midpoint product grids derived
from Bruneton's scattering-density integral: `bruneton-angular-512` (16x32),
`bruneton-angular-392` (14x28), and `bruneton-angular-288` (12x24). Each grid
is aligned to the Sun-zenith plane, completed with exact antipodes and plane
reflections, and normalized to total solid angle `4π`. The production
scattering algorithm and application defaults remain unchanged.

On the RTX 2060 qualification host, the one-pass J4 integral exceeds the GPU
watchdog for 512 and 392 directions. The 288-direction grid completes the
10:15 condition but is not robust across the required condition set. Its valid
10:15 result reduces mirror relative RMS from production's `0.032399` to
`0.010635`, while worsening spectral RMSE from `10.979203` to `18.700868` mW.
It is therefore rejected as an accuracy/performance compromise; do not treat
the interrupted 512, 392, or other 288 outputs as scored boundaries.

Generate matching selections with both backends, then compare every native
spectral value with:

```text
npm run compare:algorithm32:b1-production-backends -- PATH_TO_CPU_RUN PATH_TO_GPU_RUN
```

The comparator rejects mixed conditions or order sets and requires exactly
one CPU-reference manifest and one GPU-shader manifest.

Every complete canonical J4 execution publishes its files and manifest directly under
`references/results/experiments/b1-directional-sky-radiance/cpu/`
or
`references/results/experiments/b1-directional-sky-radiance/gpu/`.
Construction uses an isolated temporary staging directory, so an interrupted
run does not publish a complete manifest. The finalized manifest records
`cpu-reference-binary64` or
`gpu-production-shaders-r32f`, hashes each 40-channel B1 table, provenance
sidecar, and derived 31-channel B3 cube, and records WebGL capabilities for a
GPU run. Every provenance sidecar must match the manifest backend. A bounded
diagnostic may select work explicitly, for example
`--orders 1 --conditions 09:30`, but a bounded run must supply an explicit
`--output-root`; incomplete runs are rejected by the canonical scorers.

GPU generation retains one browser, WebGL2 context, renderer, cache backend,
and readback target across all 17 times. It constructs one J4 cache per time
and reuses that cache for all 81 directions. Live cache-field progress is
written to
`tmp/algorithm32-bruneton-paper/b1-production-gpu-progress.log`; each reported
layer count is emitted after the corresponding GPU submission completes.
Shader-preparation diagnostics report constant data-texture bytes only; live
input/output cache textures are accounted separately by executor memory
diagnostics.

Score one complete immutable generation through B1, B2, and B3 with:

```text
npm run score:algorithm32:b1-b3-production -- references/results/experiments/b1-directional-sky-radiance/cpu
```

Scoring creates a separate sortable record under
`references/results/experiments/b1-b3-production-scores/cpu/` or `gpu/`; it never
modifies the generation record. It also publishes each experiment's original
`result.md`, materializes the paper-profile tables, provenance, and cubes, and
regenerates the B1-through-B3 figures under that same backend root. Its
directory and manifest retain the selected backend, so CPU and GPU results
cannot overwrite or be mistaken for one another. B1 and B2 consume the exact
same finalized spectral tables.
B3 consumes cubes derived directly from those tables and verifies its
candidate aggregates against the B1 report produced in that scoring run.
Each individual runner also accepts `--production-run PATH`; B3 additionally
requires the same-run `--b1-result PATH`.

Pass `--output-root PATH` to generation, combined scoring, an individual
`save-result.js`, or B3 `--save` to move the experiment trees beneath an
alternate parent. Each experiment still owns its `cpu/` and `gpu/`
subdirectories. The backend is always derived from the validated
production-run manifest; callers cannot label CPU data as GPU data.

The ready stage validates all 17 x 81 official Kider spectra, reproduces the
retained Bruneton preprocessing, resamples each 1 nm source record onto the
external source's 40-sample representation, and implements its 31-sample RMSE
and RMS-over-time aggregate. It also pins the three Figure 5 per-time tables and
the paper's aggregate numeric oracle.

Run the ready stage and tests from the repository root:

```text
node scripts/experiments/b1-directional-sky-radiance/run.js
node --test --test-isolation=none scripts/experiments/b1-directional-sky-radiance/run.test.js scripts/experiments/b1-directional-sky-radiance/figure5.test.js
node scripts/experiments/b1-directional-sky-radiance/save-result.js
node scripts/experiments/b1-directional-sky-radiance/export-measurements.js
node scripts/experiments/generate-benchmark-figures.js
```

These default commands adopt and report the paper's published values; they do
not execute any of the eight comparison algorithms or libRadtran. The external
spectra table and C++ driver below are retained only for an explicitly requested
diagnostic cross-check.

The export command writes the validated, repaired, canonical 17 x 9 x 9 x 40
measurement boundary to the durable B1 result directory. Other independent
experiments may consume this physical boundary data without importing an
atmosphere implementation. A sibling `.sha256` file pins the generated table.

The published-reference-only default remains useful as a readiness check. The
canonical contract scores five complete boundaries: unchanged Algorithm32
Default `40/20/34/48` from sealed run `000074`, plus cumulative
`Algorithm32₂`, `Algorithm32₃`, `Algorithm32₄`, and `Algorithm32₅`. J2
through J5 retain pinned-34 incoming integration, the
W27 outgoing cache, 48 physical altitude nodes, and view-only actual-node
altitude interpolation; only the maximum cumulative scattering order differs.
J2 through J5 come from sealed runs `000152`, `000153`, `000151`, and `000154`,
respectively. Before a candidate name is attached, the runner verifies its
provenance sidecar says model `proposed`, 15 native spectral channels, 1,377
rows, and the exact numerical and cache controls. All five boundaries are
favorable
under independently pinned rule files. The paper's published values remain the
primary external reference, and local external-model execution remains an
optional diagnostic.

## Figure 5 relative-error visualization

The durable
[`b1-figure5-relative-error-domes.svg`](../../../references/results/experiments/b1-directional-sky-radiance/figures/b1-figure5-relative-error-domes.svg)
contains the nine published models followed by the selected cumulative-J4
boundary, displayed solely as Algorithm32 in column ten. Default and J5 are
omitted from the active figure; all five candidates remain fully scored in the
durable tables. This is a presentation and default-naming decision, not a
change to the experiment, its numerical evidence, or its classification.

The nine published columns are the 27 unchanged 256 by 256 RGBA image XObjects
embedded in the pinned paper PDF. They are retained with explicit page,
XObject, object-number, byte-hash, and attribution metadata under
`references/downloads/bruneton-clear-sky-models-arxiv-1612.04336/figure5-relative-error`.
They are not regenerated from the optional local model table, whose known
Nishita96 and libRadtran display differences would no longer reproduce the
published figure exactly.

Only the three displayed Algorithm32 panels are persisted locally.
`figure5.js` applies the published procedure independently to
`measurement-boundary.tsv` and the selected candidate boundaries: integrate
each 9 by 9 directional spectrum over
360--720 nm, compute `(model - measured) / measured`, use Bruneton's spherical
bicubic interpolation and equidistant disk projection, select the exact
41-color -200 through +200 percent palette, and draw the fitted Sun and 81
direction-sample marks. The displayed number remains the separate
81-direction by 31-wavelength spectral RMSE. Deterministic panel calculations
and pinned hashes for all five scored candidates remain test evidence even
though only J4 is written into the active figure set.

## Optional external spectra cross-check

Optional model boundary data is a tab-separated table with this header and one
row per model, capture, and canonical direction:

```text
model  time  grid_x  grid_y  lambda_0 ... lambda_39
```

There must be exactly 17 x 81 rows for every model. Values are spectral
radiance density in `W m^-2 sr^-1 nm^-1` at
`lambda_i = 360 + (830 - 360) i / 40` nm. Score an already available complete
nine-model table with:

```text
node scripts/experiments/b1-directional-sky-radiance/run.js --published-models path/to/models.tsv
node scripts/experiments/b1-directional-sky-radiance/save-result.js --published-models path/to/models.tsv
```

The save command copies the complete table and a SHA-256 sidecar into the
durable B1 result directory before writing the report.

Each proposed table has the same shape and exactly one model named `proposed`.
The no-argument readiness command and one-candidate options remain available.
The canonical save is explicit: `--canonical` requires all five tables,
provenance sidecars, and judgment-rule files, then scores the candidates
independently.

```text
node scripts/experiments/b1-directional-sky-radiance/save-result.js --canonical --published-models references/results/experiments/b1-directional-sky-radiance/published-models.tsv --proposed references/results/experiments/b1-directional-sky-radiance/algorithm32-proposed.tsv --proposed-provenance references/results/experiments/b1-directional-sky-radiance/algorithm32-boundary-provenance.json --judgment-rules scripts/experiments/whole-algorithm-judgment-rules.json --proposed-j2 references/results/experiments/b1-directional-sky-radiance/algorithm32-j2-proposed.tsv --proposed-j2-provenance references/results/experiments/b1-directional-sky-radiance/algorithm32-j2-boundary-provenance.json --j2-judgment-rules scripts/experiments/whole-algorithm-j2-judgment-rules.json --proposed-j3 references/results/experiments/b1-directional-sky-radiance/algorithm32-j3-proposed.tsv --proposed-j3-provenance references/results/experiments/b1-directional-sky-radiance/algorithm32-j3-boundary-provenance.json --j3-judgment-rules scripts/experiments/whole-algorithm-j3-judgment-rules.json --proposed-j4 references/results/experiments/b1-directional-sky-radiance/algorithm32-j4-proposed.tsv --proposed-j4-provenance references/results/experiments/b1-directional-sky-radiance/algorithm32-j4-boundary-provenance.json --j4-judgment-rules scripts/experiments/whole-algorithm-j4-judgment-rules.json --proposed-j5 references/results/experiments/b1-directional-sky-radiance/algorithm32-j5-proposed.tsv --proposed-j5-provenance references/results/experiments/b1-directional-sky-radiance/algorithm32-j5-boundary-provenance.json --j5-judgment-rules scripts/experiments/whole-algorithm-j5-judgment-rules.json
```

## J1 and order-increment diagnostics

The retained-parity diagnostic replaces only the saved GPU boundary's
W27-reconstructed direct J1 with production's continuous binary64 J1. It
builds only a J1 cache, logs progress to its numbered output folder, and does
not rebuild J2-J4:

```text
node scripts/experiments/b1-directional-sky-radiance/diagnose-j1-representation.js
node scripts/experiments/b1-directional-sky-radiance/analyze-order-residuals.js
node scripts/experiments/b1-directional-sky-radiance/diagnose-j2-angular-interpolation.js --output-root tmp/algorithm32-bruneton-paper/exact-j1-diagnostic/007-j2-angular-resolution-gpu
```

The first command rejects an existing output root; use `--output-root` for a
new numbered run. The second command compares the retained three-time order
sweep and reports W27 J1 error, the remaining exact-J1 J2 residual, and the
lower-order-cancelling `J3 - J2` and `J4 - J3` residuals. Generated tables and
reports remain ignored diagnostics under
`tmp/algorithm32-bruneton-paper/exact-j1-diagnostic/`; they are not benchmark
or implementation inputs.

The GPU J2 angular diagnostic constructs exact outgoing J2 and only the sparse
cubed-sphere nodes touched by 15 predeclared B1 rays. It compares W27, W39,
W55, and W81 at six elevation nodes and eight wavelengths through production
cache shaders. The checked sparse-W27 domain preserves production directions
and weights. This measures local J2 reconstruction error; it does not replace
the complete final-view B1 parity gate.

## Optional pinned external C++ driver

`external-reference/b1_reference_driver.cc` is a thin, non-rendering adapter
for Bruneton's pinned external revision. It regenerates the eight CG model
spectra and prints their per-time and aggregate scores while producing the TSV
consumed by this runner. Passing an optional `uvspec` executable also generates
the ninth, libRadtran, table with the retained external adapter.

On a Unix-like system with GNU Make and a C++11 compiler, from the repository
root:

```text
make -f scripts/experiments/b1-directional-sky-radiance/external-reference/Makefile
mkdir -p output/cache/bruneton output/cache/haber output/cache/nishita
scripts/experiments/b1-directional-sky-radiance/external-reference/build/b1_reference_driver \
  references/downloads/kider-clear-sky-framework-2014/radiance-2013-05-27-bruneton-subset/extracted \
  scripts/experiments/b1-directional-sky-radiance/published-models.tsv \
  all \
  /home/ondoher/flattened-steel-libradtran-2.0.1-build-20260717/bin/uvspec
```

For bounded or resumable work, select one model and one output file per call,
for example `... nishita93.tsv nishita93` or
`... libradtran.tsv libradtran /home/ondoher/.../bin/uvspec`. Combine only complete
model files (one header followed by each file's data rows) before giving the
table to the JS scorer. This avoids treating a timeout-truncated model as a
published reproduction.

Run it from the repository root because the published models use relative
`output/cache/...` paths. The first run is computationally expensive: it
performs the original Nishita96, Haber, and Bruneton precomputations. Later
runs reuse those exact external caches. The direct Windows shell had no C++
compiler and denied this worker's WSL access. The shared project WSL lane then
compiled the driver against the pinned source on 2026-07-17 and ran all nine
models. A second isolated Nishita96 run from an empty cache produced exactly
the same table rows and score as the full run.

## Scientific status

- Measurement payload and exact scoring oracle: ready and run.
- Published paper values and pinned comparison source: adopted as the external
  reference; local reproduction is not an acceptance gate.
- Eight external CG model regeneration: complete.
- libRadtran model regeneration: complete.
- Published numeric comparison: 31/36 predeclared one-decimal checks pass. The
  pinned source yields Nishita96 aggregate RMSE 18.00470098 versus the paper's
  18.3, and libRadtran 13:15 rounds to 11.0 versus the figure's 10.9. The fixed
  libRadtran aggregate 11.48054694 reproduces the paper's 11.48.
- Production Algorithm32 proposed-method scoring: complete; aggregate RMSE
  `14.635671 mW m^-2 sr^-1 nm^-1` over 42,687 samples.
- `Algorithm32₂` scoring: complete; aggregate RMSE
  `14.311678 mW m^-2 sr^-1 nm^-1` over its 42,687-sample boundary.
- `Algorithm32₃` scoring: complete; aggregate RMSE
  `12.991564 mW m^-2 sr^-1 nm^-1` over its 42,687-sample boundary.
- `Algorithm32₄` scoring: complete; aggregate RMSE
  `12.810328 mW m^-2 sr^-1 nm^-1` over its 42,687-sample boundary.
- `Algorithm32₅` scoring: complete; aggregate RMSE
  `12.795853 mW m^-2 sr^-1 nm^-1` over its 42,687-sample boundary.
- Classifications: Algorithm32 Default and J2 through J5 are all `favorable`.
  Each
  aggregate and its three printed Figure 5 times are below the corresponding
  published-model medians.
- The active Figure 5 visualization is a self-contained ten-column SVG that
  reuses the 27 published panels unchanged and adds J4 as Algorithm32.
- Five-candidate B1 acceptance: complete. The durable `result.md` retains the
  full Default/J2/J3/J4/J5 scoring and adjacent-order comparison.

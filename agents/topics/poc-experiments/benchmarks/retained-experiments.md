# Retained Algorithm32 Experiment Definitions

Focus: Independent B-family execution and scoring.

Related owners: [engineering-studies](../engineering-studies/retained-experiments.md).

## Post-Promotion Whole-Algorithm Benchmarks

These benchmarks are required for a whole-algorithm or evidence-backed release
claim. They do not block visible feature development. Before scoring the
promoted method, predeclare the combined favorable, limited-scope, and adverse
judgment rules. Calibration conditions used to select a numerical control are
not independent validation conditions.

### B1 -- Directional Sky-Radiance Benchmark

- ID: `EXPERIMENT-A32-WF-000008`.
- Question: what directional spectral-radiance residuals result on the same
  Bruneton/Kider 17-time, 81-direction, common-wavelength boundary and scoring
  method used for the published clear-sky comparison?
- Required output: per-condition residuals plus aggregate and worst-case RMSE
  beside the published models, with input mismatches explicit.
- Claim limit: the aerosol parameters were fitted to the same measurements;
  this is an objective in-sample comparison, not out-of-sample validation.
- Current artifacts: [runner](../../../../scripts/experiments/b1-directional-sky-radiance/run.js)
  and [result](../../../../references/results/experiments/b1-directional-sky-radiance/result.md).

### B2 -- Hemispherical Sky-Irradiance Benchmark

- ID: `EXPERIMENT-A32-WF-000009`.
- Question: what 360--720 nm diffuse hemispherical sky-irradiance residuals
  result when measured, published-model, and proposed directional fields use
  the same wavelength integration, interpolation, horizon repair, and
  cosine-weighted solid-angle integration?
- Required output: absolute/relative error, time-series RMSE, signed energy
  bias, and worst timestamp.
- Claim limit: this is an integral transformation of the B1 directional
  measurement field, not an independent instrument or out-of-sample result;
  broadband global-horizontal direct-Sun data is not its reference quantity.
- Current artifacts: [runner](../../../../scripts/experiments/b2-hemispherical-sky-irradiance/run.js)
  and [result](../../../../references/results/experiments/b2-hemispherical-sky-irradiance/result.md).

### B3 -- Matched-Atmosphere Solver Benchmark

- ID: `EXPERIMENT-A32-WF-000010`.
- Question: what directional spectral-radiance error does the proposed method
  produce under mutually representable libRadtran/Bruneton inputs, and how
  does its aggregate score compare with the published libRadtran result?
- Required output: exact solver/input pedigree, a complete mismatch map,
  measurement residuals, and the proposed aggregate beside the published
  coarse/refined values. A local libRadtran execution is an optional
  cross-check rather than the authority.
- Claim limit: when B3 consumes the B1 proposed cube it is the same in-sample
  observable, not pointwise proposed-versus-libRadtran agreement or a third
  independent measurement result.
- Current artifacts: [runner](../../../../scripts/experiments/b3-matched-atmosphere-solver/run.js)
  and [result](../../../../references/results/experiments/b3-matched-atmosphere-solver/result.md).

B1, B2, and B3 are complete as a publication evidence set only after all
three production-backed records are accepted and registered. Acceptance means
the benchmark ran as declared; the combined judgment may still be favorable,
scope-limited, or adverse.

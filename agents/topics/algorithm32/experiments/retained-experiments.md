# Retained Algorithm32 Experiment Definitions

Status: current reusable definitions recovered from archived research.

These definitions retain questions, boundaries, and claim limits. Detailed
run chronology and superseded variants remain archived. Existing runners and
results are local scientific artifacts; none is publication-canonical until
it is entered in `/references/experiments.md` through the
[promotion checklist](promotion-checklist.md).

## Core Experiments

### E1 -- Finite-Object Atmospheric Transfer

- ID: `EXPERIMENT-A32-WF-000002`; scientific state: accepted retained
  evidence.
- Question: what invariants follow from channel-wise endpoint radiance times
  transmittance plus path in-scatter at an opaque matte endpoint?
- Boundary: explicit compatible 15-channel endpoint-radiance, path-radiance,
  and transmittance packets; optional extinction and segment records.
- Required cases: zero distance, black endpoint, linearity, Beer--Lambert,
  segment composition, and spectrally distinct endpoints.
- Acceptance: reproduce the finite-transfer and segment-composition
  identities and state why an RGB band-average proxy is outside the result.
- Artifacts: [runner](../../../../scripts/experiments/e1-finite-object-transfer/run.js)
  and [current result](../../../../references/results/experiments/e1-finite-object-transfer/result.md).

### E2 -- Display-Referenced Convergence Criterion

- ID: `EXPERIMENT-A32-WF-000015`; scientific state: accepted retained
  evidence.
- Question: what display-referred difference scale and endpoint contract let
  a numerical experiment compare continuous SDR sRGB results without a
  spectral-error proxy?
- Boundary: continuous clamped linear-display sRGB under the declared ICC sRGB
  reference display, converted independently through absolute XYZ and
  ITU-R BT.2124 ITP.
- Acceptance: reproduce the BT.2124 example at both its printed and original
  input precision, bound two independent transforms, and characterize the
  reachable `Delta E ITP = 1` boundary without making quantized RGB governing.
- Retained interpretation: strict total error below `1 Delta E ITP` is a
  potential-indistinguishability diagnostic. The scoped reference-display
  relation is `observed Delta E ITP + U(reference) + U(display transform) < 3`.
  Neither value is an automatic atmospheric-model correctness gate.
- Retained transform uncertainty:
  `U(display transform) = 1.485163121927885e-10 Delta E ITP`.
- Artifacts: [runner](../../../../scripts/experiments/e2-display-referenced-convergence/run.js)
  and [current result](../../../../references/results/experiments/e2-display-referenced-convergence/result.md).
- Promotion gap: the ITU-R and ICC authorities used by this definition must be
  present in the canonical AMA bibliography before E2 becomes official.

### E3 -- Bruneton-Referenced Sky-Ray Direction Characterization

- ID: `EXPERIMENT-A32-WF-000003`; scientific state: accepted retained
  evidence.
- Question: how does completed sky-ray output differ from a pinned
  Bruneton 16-by-32 angular benchmark as source-oriented Fibonacci direction
  count varies through the declared practical range?
- Boundary: 24 observer-to-top-atmosphere sky rays under one declared
  atmosphere, four solar zeniths, fixed non-angular controls, the same spectral
  and display mapping, and every integer direction count from 4 through 68.
- Acceptance: report spectral and display differences, luminance relationship,
  below-one/below-three diagnostic counts, and work relative to count 34.
- Retained conclusion: count 34 remains the selected cost-neutral incoming
  direction count; 68 is only a two-times-work comparison point. Low-Sun
  horizon error is an explicit limitation. The benchmark is not the exact
  continuous angular integral and does not establish broad physical accuracy.
- Artifacts: [runner](../../../../scripts/experiments/e3-sky-ray-direction-characterization/run.js)
  and [current result](../../../../references/results/experiments/e3-sky-ray-direction-characterization/result.md).

### E4 -- Point-Source Flux Conservation

- ID: `EXPERIMENT-A32-WF-000011`; scientific state: accepted retained
  evidence.
- Question: what response normalization and raster-boundary accounting
  conserve a transported point spectral flux when represented as pixel
  spectral radiance?
- Boundary: a transported spectral flux packet and a complete response
  footprint containing normalized weight, exact pixel solid angle, and
  on/off-raster classification.
- Acceptance: per wavelength, prove `L_i = F p_i / Omega_i`, total response
  mass one, conservation `sum_i(L_i Omega_i) = F`, explicit off-raster loss,
  and linear addition of overlapping sources.
- Artifacts: [runner](../../../../scripts/experiments/e4-point-source-flux-conservation/run.js)
  and [current result](../../../../references/results/experiments/e4-point-source-flux-conservation/result.md).

### E5 -- Extended-Source Angular Conservation

- ID: `EXPERIMENT-A32-WF-000012`; scientific state: accepted retained
  evidence.
- Question: what angular-integration relationship conserves extended spectral
  radiance over ordinary and cosine-projected solid angle?
- Boundary: declared directional radiance packets, solid-angle weights,
  optional projection cosines, and analytic disk/cap or normalized
  limb-profile descriptors.
- Acceptance: match independent closed-form ordinary and projected integrals,
  preserve clipped/off-raster support without renormalization, and reconcile
  resolved and collapsed small-angle cases.
- Artifacts: [runner](../../../../scripts/experiments/e5-extended-source-angular-conservation/run.js)
  and [current result](../../../../references/results/experiments/e5-extended-source-angular-conservation/result.md).

### E6 -- Direction-Resolved Extended-Source Transport

- ID: `EXPERIMENT-A32-WF-000013`; scientific state: accepted retained
  evidence.
- Question: what integrated spectrum results when visibility and atmospheric
  transmittance are applied independently to each extended-source direction?
- Boundary: each direction supplies spectral radiance, integration weight,
  scalar visibility, and spectral transmittance directly.
- Acceptance: match `sum_j(v_j T_j L_j w_j)` for visible, blocked, partial,
  wavelength-dependent, and direction-dependent cases; prove permutation
  invariance and the exact contribution of a one-direction change.
- Non-claims: no geometry, atmosphere implementation, cache, GPU, browser, or
  production promotion is validated.
- Artifacts: [runner](../../../../scripts/experiments/e6-direction-resolved-extended-source-transport/run.js)
  and [current result](../../../../references/results/experiments/e6-direction-resolved-extended-source-transport/result.md).

### E7 -- Physical Spectral Transport Closure

- ID: `EXPERIMENT-A32-WF-000014`; scientific state: accepted retained
  evidence.
- Question: what channel-wise rule composes the observable pre-display
  spectrum?
- Boundary: compatible path, already transported endpoint, already integrated
  extended-source, and already rasterized point-source spectral-radiance
  packets.
- Acceptance: prove component isolation, linearity, ordering invariance, and
  closure for `L_final = L_path + L_endpoint + L_extended + L_point`, with no
  display transform inside the boundary.
- Artifacts: [runner](../../../../scripts/experiments/e7-physical-spectral-transport-closure/run.js)
  and [current result](../../../../references/results/experiments/e7-physical-spectral-transport-closure/result.md).

### E8 -- Spectral-to-RGB Boundary Correctness

- ID: `EXPERIMENT-A32-WF-000001`; scientific state: accepted retained
  evidence.
- Question: what one declared output transformation converts the completed
  canonical 15-channel spectral-radiance packet to reproducible RGB while
  preserving quantity, unit, channel, and bin semantics?
- Boundary: the exact spectral basis, official CIE data, declared efficacy and
  matrix, explicit display policy, all basis packets, arbitrary signed and
  positive combinations, and separated contribution packets.
- Acceptance: two independent binary64 paths agree; bin widths and units apply
  exactly once; the linear projection is additive; composition precedes one
  display conversion; labels cannot alter the result; nonlinear gamut/clamp
  behavior remains a separate declared policy.
- Non-claim: E8 does not establish that 15 channels approximate every
  continuous spectrum; C1 owns that question.
- Artifacts: [runner](../../../../scripts/experiments/e8-spectral-to-rgb-boundary-correctness/run.js)
  and [current result](../../../../references/results/experiments/e8-spectral-to-rgb-boundary-correctness/result.md).

## Conditional Experiments

### C1 -- Spectral Resolution Characterization

Status: conditional. Run when a paper or product claims a quantitative
accuracy bound for the 15-channel representation or supports spectra beyond
the declared smooth-spectrum scope.

Compare the same authoritative smooth and stress spectra on the canonical
15-bin basis and a sufficiently refined basis under the same CIE data and
display policy. Report separately the effects of transport sampling, CIE
interpolation, spectral quadrature, matrix rounding, gamut, and nonlinear
display handling. The result must state the supported spectral class or narrow
the claim.

### C2 -- Model-Boundary Sensitivity

Status: conditional. Run when claims extend beyond the named no-ozone,
spherical, distant-source comparison scope or depend materially on resolved
solar discs, higher scattering orders, flat geometry, or finite local sources.

For each omission or approximation, hold all other physical inputs fixed and
compare a simplified boundary with a fuller control at the same observable.
Report effect size and failure region for absorption, observer-dome clipping,
one-direction source transport, order truncation, and center-distance local
extinction. The conclusion either supports the bounded scope or narrows it.

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

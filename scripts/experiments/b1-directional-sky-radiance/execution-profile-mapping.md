# B1 Algorithm32 Execution-Profile Mapping

Status: official Q30 reproduction through current production GPU code passes
the original radiance/score tolerances against the owner-selected run-65 and
point-local run-6 baselines.

This benchmark owns the Bruneton/Kider values. It will construct complete
`Algorithm32ExecutionProfile` instances and pass them through Algorithm32's
generic ingress. No value or identity in this document belongs in an
Algorithm32 production constant or benchmark-specific branch.

The generator passes each complete profile once to the aggregate model
constructor. Algorithm32 retains it on that model; cache and evaluation code
reads the required values from the model instead of receiving a parallel list
of benchmark options from the generator.

## Publication Authority And Production Adaptation

The published comparison and its pinned reference implementation own the
benchmark's physical and spectral inputs. Production defaults, earlier cache
results, and the current runner's validation rules do not override those inputs.
Sections III-D and IV-B of the
[comparison paper](https://arxiv.org/html/1612.04336v1) establish common
atmospheric parameters and common 40-wavelength execution for the compared
models. The pinned implementation below resolves the exact stored spectra,
coordinates, and other implementation-level reference values.

The numerical rows below describe the current Algorithm32 candidate. Its
F68 quadrature, W27 representation, 48 altitude nodes, and Q30/20/40 integration
counts must not be called publication requirements solely because this runner
or its manifests enforce them. The paper compares several algorithms with
different discretizations. Each claimed publication-derived numerical setting
requires its own section or reference-code citation; Algorithm32-specific
choices require an explicit mismatch/approximation declaration.

Production must accept the paper-required configuration through generic
execution-profile, compiler, cache, and evaluation contracts. When a current
implementation cannot represent a required value, extend its owning production
contract and implementation and verify that the value reaches the executed
calculation. Reject unsupported configurations explicitly until supported;
never substitute production defaults, resample onto Native15, apply an output
scale fit, or label a different calculation as the paper configuration.

The reproducibility gate covers the complete path from authenticated paper
inputs to newly compiled assets, production final-view radiances, and the
original independent reports and six figures. Cache compatibility with a
retained run is additional evidence, not a substitute for this gate.

## Baseline And Future Refinements

Treat the existing parameter values as researched decisions. Reproduction
should match the selected previous run's paper and non-paper parameters so
the comparison uses the same baseline. This does not require retrospectively
reopening the reasoning behind existing choices.

The selected baseline is Color Reset run
`000065-color-reset-qualification`, independently reproduced by point-local
cache-builder run `00006-b1-qualification`. Both use 30 quadratic intervals
with midpoint scattering density and midpoint extinction applied in two half
steps. The interval boundaries are `L * (i / 30)^2`. The old official runner
used 40 uniform endpoint/trapezoid intervals; retaining those values did not
reproduce the selected baseline. Selecting the existing production quadratic
transport corrects that mismatch. Other retained quadrature diagnostics keep
their historical uniform-40 view settings. This is baseline restoration, not
a new parameter search. The reference runs remain immutable comparison evidence.

Future changes to non-paper parameters require a technical rationale and an
expected effect stated before execution, such as correcting a demonstrated
defect or reducing measured integration or sampling error. Evaluate the full
benchmark against the preserved baseline and retain the changed parameters,
correctness/convergence evidence, and score. An improved score may support
adoption of a justified refinement; score improvement alone is insufficient.
Paper parameters and scoring rules retain their established authority.

Ozone-free execution is the owner's selected Bruneton algorithm/profile
baseline, consistent with the comparison setup. The owner has not accepted
the ozone implementation as sufficiently validated, and the diagnostic ozone
run worsened benchmark agreement. That result does not by itself identify an
implementation defect. Reintroducing ozone is a separate future proposal
requiring a technical reason and independent validation; it is not part of
reproducing the selected baseline. Preserve the existing ozone diagnostic
evidence without treating it as an adopted algorithm configuration.

## GPU Evaluation Precision

The selected receiver-local B1 cache uses the ordinary production scene-cache
`directionInterpolation: shader-bilinear` option. It evaluates the four W27
texels with explicit binary32 bilinear weights. The same precision path computes
solar zenith from the vector dot/cross ratio with a range-reduced degree-17 atan
series. Its reduced argument satisfies `|r| <= tan(pi/8)`; the alternating-series
remainder is bounded by `|r|^19 / 19`. Default Native15 texture filtering and
angle evaluation remain unchanged.

These choices restore the reference interpolation equation at GPU precision.
They were selected after direct radiance comparisons exposed residual error
with hardware filtering, and an isolated GPU probe measured inaccurate built-in
inverse trigonometry. They do not change cache payloads, physical parameters,
W27 nodes, Q30 samples, or the scoring metric. Run provenance records both
`outgoingInterpolation` and `solarZenithEvaluation`; the
[production promotion plan](../../../archives/topics/production-algorithm32-release-20260911/agents/topics/production-algorithm32/caches/point-local-compiler-promotion-plan.md)
owns measured precision and whole-table compatibility evidence.

## Pinned Authorities

- Physical profile and spectra: pinned `clear-sky-models` revision
  `4df2ec6609bc0127a478bd34fff29c94352579cc`, retained in
  `references/downloads/bruneton-clear-sky-models-4df2ec6/atmosphere.h` and
  `atmosphere.cc`.
- Conditions, source-direction calculation, fitted solar azimuth, 81 view
  directions, and spectral coordinates:
  `scripts/experiments/b1-directional-sky-radiance/benchmark.js`.
- Current Algorithm32 numerical and domain boundary (candidate choices, not
  independent evidence of paper requirements):
  `references/results/experiments/b1-directional-sky-radiance/algorithm32-paper-j4-boundary-provenance.json`
  and the retained whole-algorithm conclusion. These are retained evidence of
  the selected candidate inputs, not an executable producer or publication authority.

## Exact Mapping

| Profile field       | Benchmark-owned value and construction                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`              | `algorithm32-execution-profile`                                                                                                                                                                                                       |
| identity            | A condition/order-specific id and revision; the builder hashes every normalized fact and records the pinned source revision as provenance                                                                                             |
| `spectral.basis`    | 40 coordinates `360 + 470 i / 40 nm`, `i = 0..39` (`360` through `818.25 nm`), support width `11.75 nm`, semantics `point-sampled-spectral-density`                                                                                   |
| source packet       | The exact 40 `kSpectralIrradiance` values in pinned `atmosphere.cc`, quantity `spectral-irradiance-density`, units `W m^-2 nm^-1`, unchanged on the direct-40 basis                                                                   |
| `models`            | Benchmark-constructed distant Sun, paper atmosphere, spherical geometry, Lambertian grass boundary, and exact placement; Algorithm32 retains these same objects with the profile                                                      |
| atmosphere geometry | Spherical Earth radius `6360 km` and atmosphere radius `6420 km` from pinned `atmosphere.h`                                                                                                                                           |
| Rayleigh            | `8000 m` scale height and the pinned Penndorf coefficient table/correction/interpolation in `atmosphere.cc`                                                                                                                           |
| Mie                 | `1200 m` scale height, Angstrom alpha `0.8`, beta `0.04`, single-scattering albedo `0.8`, and Cornette-Shanks `g = 0.7`                                                                                                               |
| absorption          | No ozone/other absorption in this paper-comparison profile                                                                                                                                                                            |
| ground              | The exact pinned 45-sample grass spectrum from `atmosphere.cc`, evaluated on the direct-40 coordinates and supplied to a uniform Lambertian boundary                                                                                  |
| observation         | Date `2013-05-27`, location latitude `42.44337 degrees`, longitude `-76.48163 degrees`, and each of the 17 local times `09:30` through `13:30` converted to the exact UTC instant by the retained four-hour rule                      |
| placement           | `explicit-geometry-placement` with the benchmark's condition-specific fitted distant-Sun direction; the observation remains present for receiver/provenance facts                                                                     |
| numerical           | 30 quadratic midpoint view intervals (`viewPath.sampleDistribution.kind = quadratic-near-observer-v1`), 20 source-transmittance intervals, 40 cache-transport intervals, and cumulative order J4 for the canonical paper reproduction |
| positions           | The selected 48 physical altitude nodes with the exact ground node and view-only linear interpolation over actual neighbors                                                                                                           |
| incoming            | Source-oriented reflection-completed Fibonacci-68 with its executable weights                                                                                                                                                         |
| outgoing            | Receiver-local W27 cubed-sphere domain, face width 27 and 4,374 directions                                                                                                                                                            |

The 17 profiles differ only in identity, UTC observation, and explicit
distant-Sun direction. A cache is constructed once for each profile and reused
for all 81 directions. The view directions come directly from the retained
Shirley-Chiu 9-by-9 mapping in `benchmark.js`; they are evaluation requests,
not profile or cache-construction fields.

## Mapping Completion Boundary

The profile builder copies or derives values only from the pinned authorities
above and emits their hashes in run provenance. It does not read a retained
candidate TSV, cube, image, or sealed output as an implementation input. The
executable builder is [`production-profile.js`](production-profile.js); the
production boundary generator and replaceable official run manifest are owned by
[`generate-production-boundary.js`](generate-production-boundary.js) and
[`ProductionRun.js`](ProductionRun.js).

# B1 Algorithm32 Execution-Profile Mapping

Status: Stage 13 mapping implemented by the current-production generator;
canonical paper/default J4 generation remains to be executed and retained.

This benchmark owns the Bruneton/Kider values. It will construct complete
`Algorithm32ExecutionProfile` instances and pass them through Algorithm32's
generic ingress. No value or identity in this document belongs in an
Algorithm32 production constant or benchmark-specific branch.

The generator passes each complete profile once to the aggregate model
constructor. Algorithm32 retains it on that model; cache and evaluation code
reads the required values from the model instead of receiving a parallel list
of benchmark options from the generator.

## Pinned Authorities

- Physical profile and spectra: pinned `clear-sky-models` revision
  `4df2ec6609bc0127a478bd34fff29c94352579cc`, retained in
  `references/downloads/bruneton-clear-sky-models-4df2ec6/atmosphere.h` and
  `atmosphere.cc`.
- Conditions, source-direction calculation, fitted solar azimuth, 81 view
  directions, and spectral coordinates:
  `scripts/experiments/b1-directional-sky-radiance/benchmark.js`.
- Numerical and domain boundary:
  `references/results/experiments/b1-directional-sky-radiance/algorithm32-paper-j4-boundary-provenance.json`
  and the retained whole-algorithm conclusion. These are retained evidence of
  the selected inputs, not an executable producer.

## Exact Mapping

| Profile field       | Benchmark-owned value and construction                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `kind`              | `algorithm32-execution-profile`                                                                                                                                                                                    |
| identity            | A condition/order-specific id and revision; the builder hashes every normalized fact and records the pinned source revision as provenance                                                                          |
| `spectral.basis`    | 40 coordinates `360 + 470 i / 40 nm`, `i = 0..39` (`360` through `818.25 nm`), support width `11.75 nm`, semantics `point-sampled-spectral-density`                                                                |
| source packet       | The exact 40 `kSpectralIrradiance` values in pinned `atmosphere.cc`, quantity `spectral-irradiance-density`, units `W m^-2 nm^-1`, unchanged on the direct-40 basis                                                |
| `models`            | Benchmark-constructed distant Sun, paper atmosphere, spherical geometry, Lambertian grass boundary, and exact placement; Algorithm32 retains these same objects with the profile                                   |
| atmosphere geometry | Spherical Earth radius `6360 km` and atmosphere radius `6420 km` from pinned `atmosphere.h`                                                                                                                        |
| Rayleigh            | `8000 m` scale height and the pinned Penndorf coefficient table/correction/interpolation in `atmosphere.cc`                                                                                                        |
| Mie                 | `1200 m` scale height, Angstrom alpha `0.8`, beta `0.04`, single-scattering albedo `0.8`, and Cornette-Shanks `g = 0.7`                                                                                            |
| absorption          | No ozone/other absorption in this paper-comparison profile                                                                                                                                                         |
| ground              | The exact pinned 45-sample grass spectrum from `atmosphere.cc`, evaluated on the direct-40 coordinates and supplied to a uniform Lambertian boundary                                                               |
| observation         | Date `2013-05-27`, location latitude `42.44337 degrees`, longitude `-76.48163 degrees`, and each of the 17 local times `09:30` through `13:30` converted to the exact UTC instant by the retained four-hour rule   |
| placement           | `explicit-geometry-placement` with the benchmark's condition-specific fitted distant-Sun direction; the observation remains present for receiver/provenance facts                                                  |
| numerical           | 40 uniform endpoint/trapezoid view intervals (`viewPath.sampleDistribution = null`), 20 source-transmittance intervals, 40 cache-transport intervals, and cumulative order J4 for the canonical paper reproduction |
| positions           | The selected 48 physical altitude nodes with the exact ground node and view-only linear interpolation over actual neighbors                                                                                        |
| incoming            | Source-oriented reflection-completed Fibonacci-68 with its executable weights                                                                                                                                      |
| outgoing            | Source-aligned W27 cubed-sphere domain, face width 27 and 4,374 directions                                                                                                                                         |

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
production boundary generator and immutable run manifest are owned by
[`generate-production-boundary.js`](generate-production-boundary.js) and
[`ProductionRun.js`](ProductionRun.js).

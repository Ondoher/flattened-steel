# Color Reset Production Promotion Manifest

Status: P0 complete; provisional algorithmic authority; release authority open.

This manifest is the production inventory and evidence-identity owner required
by P0 of the [Color Reset implementation plan](color-reset-implementation-plan.md).
The [production design](color-reset-design.md) remains the owner of equations,
parameters, behavior, and claim boundaries. The
[source-gap register](color-reset-source-gaps.md) remains the owner of missing
third-party and official-experiment authority.

## Promotion Boundary

- Accepted contained results provisionally authorize deterministic production
  reproduction and engineering verification through P8.
- Open source-gap rows block final scientific or numerical-authority claims,
  release qualification, and P9 default selection for affected capabilities.
- Contained implementation code is an adaptation reference and never a
  production runtime dependency.
- External BSC, Pickles, Johnson/SVO, Vega, and CIE source or derived bytes may
  be exercised locally but may not enter a publicly distributed tracked surface
  or release package until license and redistribution clearance is recorded.

## Authenticated Contained Authorities

Each row was read from the immutable run's `artifact-manifest.json`. Artifact
set identity uses the run-owned
`utf8-lines-v1:path-null-byteLength-null-sha256-newline` encoding.

| Increment | Immutable run                                           | Artifacts |      Bytes | Artifact-set SHA-256                                               |
| --------- | ------------------------------------------------------- | --------: | ---------: | ------------------------------------------------------------------ |
| CR2       | `000007-available-light-inventory`                      |        41 |  5,121,712 | `dcd6cdd8146094d05427ad180af7fccefdbaa67e290d1b5f21e6a0d4b03697ba` |
| CR3       | `000011-neutral-geometry-ambient-proof`                 |        57 | 52,550,399 | `6d3c23060973e14e325e1fb87d28d1e61efe9a445f2fe57c101d2db04eb0d8a5` |
| CR4G      | `000033-cr4g-slope-limited-nautical-response-bracket`   |        61 |  5,453,199 | `fd180391714f77ba2365d7f9ee487f63a61cb664170016f048caf0cc6c24108a` |
| CR6B      | `000047-cr6b-brightest-2000-catalog-proof`              |        33 |  2,293,026 | `ce50de53045f1e6f0ef33dcdc2b935a7023d5e28095b3d5f13add4980c370c57` |
| CR6C      | `000049-cr6c-one-pixel-brightness-calibration-narrowed` |        65 |  8,888,747 | `bcd129d7484bbec696c8a3877d9822e4a3cdf89e0d17c3e8614909f4ad62c001` |
| CR6D      | `000052-cr6d-toggleable-low-light-stellar-chroma`       |        67 | 13,123,366 | `032ab071dc21477b0cffb2eea7cda1f7378ed736370d7867e443b6ee82f3a089` |
| CR6E      | `000054-cr6e-toggleable-mesopic-stellar-luminance`      |        79 | 24,029,241 | `2dcbf0fea5bf4edc0d667d437ab853ffbb9401cb8214f4a4e1d2be01c1359df5` |
| CR6F      | `000055-cr6f-brightest-2000-spectral-materialization`   |        13 |  2,069,625 | `a380716366661c7b9bddcd6b025bd1c111d9e60b8a03cde6445e6cd0a61649c4` |
| CR6G      | `000057-cr6g-brightest-2000-runtime-capacity`           |        23 |    472,769 | `ae7224f0b85859a08d896f32b7be24c33472b9b3e034f07b365f96024af90627` |
| CR7       | `000062-integrated-color-reset-sequence`                |        30 |  1,038,395 | `bc1759ab26dad40ae620d4997b2713bd7f3f283bc88721ef78fa753df7909adb` |
| CR8       | `000065-color-reset-qualification`                      |        47 |  4,685,928 | `1f5fa1226d1520847fa900fea14870144e6c07f1cbecd11dc0ff4246d2b8bfe1` |

The rejected CR6H run remains negative appearance evidence and does not
authorize changing `q=24` to expose the added 1,500 members.

## Selected Algorithm Identities

The exact equations and responsibilities are linked rather than duplicated:

- receiver measurement and total-horizontal condition:
  [Receiver-light state](color-reset-design.md#receiver-light-state);
- neutral direct and diffuse lighting:
  [Scene lighting](color-reset-design.md#scene-lighting);
- `basic-bruneton` and `color-reset-slope-078-p9`:
  [Color selection and response](color-reset-design.md#color-selection-and-response);
- brightest-2,000 ordering, packet partition, and GPU representation:
  [Brightest-2,000 stellar catalog](color-reset-design.md#brightest-2000-stellar-catalog);
- one-pixel `q=24` presentation:
  [One-pixel stellar presentation](color-reset-design.md#one-pixel-stellar-presentation);
- mesopic `0.5` followed by chroma `0.65`:
  [View-presentation filters](color-reset-design.md#view-presentation-filters).

CR8 additionally authenticates the B1 table SHA-256
`e6d62e23ec0184cc9941e8305d4ea9e69691cf996d5bce8523afb641830ce634`,
aggregate RMSE `11.554012538468113`, and threshold
`11.820391604126252`.

## Pre-P1 Production Inventory

The following hashes identify the inspected pre-P1 files, not permanent
authorities after implementation changes:

| Surface                                                              | Pre-P1 SHA-256                                                     |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/algorithm32/implementation/star-field/consts.js`                | `d13575deca80e425c287606d3ff260d935165d7e58630d3a1b3838fa1cb2c7ba` |
| `src/algorithm32/implementation/star-field/StellarPointSetSource.js` | `dfe3448373984babbc7a4d4ba73901af2878348125849417c076aa8f60341268` |
| `src/flat32/Flat32ColorDisplayModel.js`                              | `6f088ed7a3bcc09a426ce4c0b4c8ce49c85fb6822e3059fb08a5cf120ed3f07b` |
| `src/flat32/SphericalDistantMode.js`                                 | `18351ecb219b3458d66db5495034ef4c2b18187aba19fba50532b8b2df176737` |
| `src/flat32/FlatLocalMode.js`                                        | `ce0e12b74645a2400f4256b0b684113f68dfd782c70a3b93cca2a935ee3cca1d` |

Current production ownership is:

| Responsibility                            | Production owner                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Color construction                        | `src/flat32/Flat32ColorDisplayModel.js`                                                                                             |
| Application selection and mode forwarding | `src/flat32/Flat32Application.js`                                                                                                   |
| Spherical/distant facade assembly         | `src/flat32/SphericalDistantMode.js`                                                                                                |
| Flat/local facade assembly                | `src/flat32/FlatLocalMode.js`                                                                                                       |
| Receiver measurement                      | `src/algorithm32/implementation/scene-lighting/LocalLightLevelCalculator.js`                                                        |
| Receiver publication lifecycle            | `src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightController.js`                                               |
| Distant scene-light adapter               | `src/algorithm32/implementation/distant-sun/three/DistantSunSceneLightingAdapter.js`                                                |
| Local scene-light adapter                 | `src/algorithm32/implementation/local-sun/three/LocalSunSceneLightingAdapter.js`                                                    |
| Stellar catalog and spectra               | `src/algorithm32/implementation/star-field/consts.js`                                                                               |
| Stellar source construction               | `src/algorithm32/implementation/star-field/StellarPointSetSource.js`                                                                |
| Palette policy and identity               | `src/algorithm32/implementation/star-field/StellarScreenPaletteGenerationPolicy.js` and `StellarScreenPaletteGenerationIdentity.js` |
| Palette GPU execution                     | `src/algorithm32/rendering-runtime/three/StellarScreenPaletteGenerationPass.js`                                                     |

The pre-P1 500-star identity is catalog SHA-256
`d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759`,
selection SHA-256
`3356dfa973a860bd91430010d77704d304abedbed92691f9faa58007ddb4d67e`,
and photometry identity
`a8c450336b45106ccbc33f40630555c23a4077748751d1488ee38cec4bf19b42`.

## Fixed-500 Assumptions Reserved For P5

P0 found explicit production assumptions in:

- `src/algorithm32/celestial-source-support/CelestialSourceRoster.js`;
- `src/algorithm32/celestial-source-support/CelestialSourceSupport.js` and
  its declaration file;
- `src/algorithm32/rendering-runtime/celestial-generation-types.d.ts`;
- `src/algorithm32/implementation/star-field/consts.js`;
- `src/algorithm32/implementation/star-field/StellarPointSetCpuCache.js`;
- `src/algorithm32/implementation/star-field/StellarGenerationSourceTable.js`;
- `src/algorithm32/implementation/star-field/types.d.ts`; and
- their focused Node and browser fixtures, including the exact 501-entry
  palette assertion.

The general palette policy, generation stages, and Three generation pass
already derive capacity and iteration from `memberCount`; P5 must preserve that
generic behavior while replacing the fixed source contracts.

## Qualification Matrix

- Host: established Windows production lane.
- Browser: current pinned Chrome Headless executable; P0/P1 observed
  `153.0.0.0` reporting Windows 10.
- Graphics: WebGL2 through ANGLE/D3D11 on the NVIDIA GeForce RTX 2060
  reference path.
- Full-frame appearance/performance: 1920 by 1080 drawing buffer at DPR 1.
- DPR 2: bounded viewport for one-pixel occupancy, screen-index rebuild,
  resize, context, and lifecycle gates; drawing buffer no larger than 1920 by 1080.
- Explicit non-claims: arbitrary browser, GPU, operating system, viewport,
  DPR, and 4K performance.

## P0 Gate Result

P0 is complete. All required contained runs and the CR6B roster parent have
authenticated artifact-set identities; every open source gap retains an
explicit provisional/release effect; production ownership and fixed-500
assumptions are inventoried; and the qualification and redistribution
boundaries are pinned. No source-gap row is claimed closed by this manifest.

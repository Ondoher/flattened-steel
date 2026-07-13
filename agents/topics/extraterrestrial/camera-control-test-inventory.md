# Camera-Control Test Inventory

## Purpose

This document is the prerequisite inventory for Stage 8c.2 camera-control
factorization. It defines what will be tested and what must happen before any
new proof runner or appearance candidate is executed.

The inventory is deliberately non-factorial. Tests consist of one frozen
baseline, baseline-relative one-control sweeps, a few physically necessary
interaction cases, and a curated set of frequent combined uses.

## Test-data provenance register

Every numeric input is classified as measured/inherited, published, derived,
or authored. “Published” means that the exact value appears in the linked
standard, manufacturer document, paper, or retained EXIF record. “Derived”
means a stated equation is applied to published or inherited inputs. Authored
diagnostics test implementation boundaries and may not be described as camera
observations.

| Source ID | Class | Data used | Source |
|---|---|---|---|
| `SRC-LOCAL-FIELD` | measured/inherited | Complete noon and sunset native-15 radiance fields, camera geometry, and production reference images | Accepted immutable production run `000352-spectral-color-production-wide-light-adapted-log`, artifact set `a563b4366dd465ff4d6a6c7a496594fec4e21c0f0659113887d04ff04f6ffb49`. |
| `SRC-STAGE8C` | derived/inherited | Generic QE shape, photon weights, D55 WB, matrix, nominal electron counts, clipping counts, and the explicitly authored generic sensor envelope | Accepted immutable run `000363-camera-generic-phone-stage8c`, artifact set `06c581d4802ffc2598a76147edac62db0c4b93e2c3c954d562f8159a71242829`. |
| `SRC-RADIOMETRY` | published | Irradiance integrated over shutter time and pixel area yields the camera measurement; exposure time scales received energy | [PBRT 4e, Film and Imaging](https://pbr-book.org/4ed/Cameras_and_Film/Film_and_Imaging). |
| `SRC-CONTROLS` | published | `N=f/D`; aperture area scales as `1/N^2`; a full f-stop changes light by two; ISO is post-sensor voltage amplification in the stated simplified digital model; standard f-number and power-of-two ISO sequences | Stanford CS178, [Variables that affect exposure](https://graphics.stanford.edu/courses/cs178/applets/exposure.html). |
| `SRC-ISO-12232` | standard | ISO speed ratings, standard output sensitivity, and recommended exposure index are standardized reported camera quantities | [ISO 12232:2019](https://www.iso.org/cms/live/live/en/sites/isoorg/contents/data/standard/07/37/73758.html). |
| `SRC-EMVA` | standard/published example | QE, system gain, noise, and electron saturation capacity are separate quantities; example values include `65.2%` QE, `2.17 e-` temporal dark noise, and `10,704 e-` saturation capacity | [EMVA 1288 Release 3.1 flyer](https://www.emva.org/wp-content/uploads/EMVA1288_R3_1_Flyer.pdf) and [Release 3.0](https://www.emva.org/wp-content/uploads/EMVA1288-3.0.pdf). |
| `SRC-SMALL-PIXEL` | published paper | Small BSI-pixel simulated full-well examples `1,289 e-` and `6,390 e-` | Sun et al., [Full well capacity and quantum efficiency optimization](https://www.jos.ac.cn/article/doi/10.1088/1674-4926/33/12/124006). |
| `SRC-ISET` | published paper | Physical-camera simulation precedent: `2.2 um` pixel and `9,000 e-` well | Farrell et al., [Digital camera simulation](https://opg.optica.org/ao/abstract.cfm?uri=ao-51-4-a80). |
| `SRC-ADC` | manufacturer | Real sensor supports 10-bit and 12-bit ADC/readout | Sony Semiconductor Solutions, [IMX485LQJ flyer](https://www.sony-semicon.com/files/62/flyer_security/IMX485LQJ_Flyer.pdf). |
| `SRC-WB` | standard dataset; accepted for D55/D65/D75 | Official CIE D55, D65, and D75 spectra, plus the CIE 1931 2-degree observer, match their advertised MD5 values and are retained in verified run `000373`. Illuminant A is quarantined because the CSV served by the official link hashes to `ed0e4effb55d82b950c0912b6278a9d1`, not the advertised `6c33a1c3caff2d774f0f2025f3001a56`. | [CIE D55](https://cie.co.at/datatable/relative-spectral-power-distributions-cie-illuminant-d55), [D65](https://cie.co.at/datatable/cie-standard-illuminant-d65), [D75](https://cie.co.at/datatable/relative-spectral-power-distributions-cie-illuminant-d75), [A](https://cie.co.at/datatable/cie-standard-illuminant-1-nm), and [1931 observer](https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer). |
| `SRC-CAMERA-RELATIVE` | measured relative dataset; accepted | Canon EOS 5D Mark IV effective relative R/G/B response, `380--780 nm` at 5 nm, identified as relative rather than absolute QE | Academy Software Foundation [rawtoaces-data](https://github.com/AcademySoftwareFoundation/rawtoaces-data), commit `e9b8503cf8a0641f40e5345d9757bde60c15f423`, Apache-2.0 profile authored by Weta Digital; retained by run `000373`. PBRT's embedded response remains comparison evidence. |
| `SRC-TRAINING-190` | measured/library dataset; accepted | 190 relative reflectance spectra, `380--780 nm` at 5 nm, used only to fit the initial matrix | Academy Software Foundation rawtoaces-data `training_spectral.json` at the pinned commit, attributed to Sci-Tech and licensed Apache-2.0; retained by run `000373`. |
| `SRC-CHART` | standard/library dataset; accepted | All 24 `ColorChecker N Ohta` reflectances, `380--780 nm` at 5 nm, with fixed names/order, used only as independent validation | Pinned Colour 0.4.6 states the N Ohta values are from Ohta (1997) and are identical to ISO 17321-1:2012 data. Exact source-module/license identity and values are retained and hash-checked by run `000373`. |
| `SRC-COLOR-ORACLE` | accepted prerequisite evidence | Independent 1 nm relative camera-RGB and CIE XYZ integration, perfect-diffuser WB, 190-patch D55 least-squares fit, independent 24-patch validation, D65/D75 generalization, native-15 comparison, and CIEDE2000 diagnostics | Verified immutable run `000373-camera-t5-colorimetric-prerequisite`, artifact set `8249584487fa29fc8d819792188c8df5ec2ed56aaeb4fb720f7d69b1895531f1`. |
| `SRC-RAW-VALIDATION` | empirical; not acquired | Black-subtracted linear RAW chart captures paired with measured camera sensitivity, illuminant, exposure metadata, and repeats | Required only for a named-camera claim. Existing JPEG and video references do not satisfy it. |
| `SRC-DEVELOPMENT` | accepted identity boundary; non-identity research prerequisite | Versioned `camera-development-v1` interface with exact `identity-clamp`, `[0,1]` Rec.709 boundary, and sRGB output encoding | Identity is accepted in verified run `000378`. No non-identity tone/gamut/look candidate is selected. |
| `SRC-ND` | manufacturer | AstroSolar photographic film OD 3.8 and safety/imaging film OD 5.0 | Baader Planetarium, [Solar Filter manual](https://www.baader-planetarium.com/en/downloads/dl/file/id/1578/product/2986/instruction_manual_baader_solar_filter_v_1_7.pdf) and retained official [2026 price list](https://www.baader-planetarium.com/en/downloads/dl/file/id/1908/baader-planetarium-price-list-04-2026.pdf), which identifies both exact OD products. |
| `SRC-NOON-PHONE` | retained EXIF | Samsung SM-M015G: `f/2.2`, `1/6444 s`, ISO 102, 2.26 mm | Wikimedia Commons, [Sun at noon](https://commons.wikimedia.org/wiki/File:Sun_at_noon.jpg). |
| `SRC-NOON-DSLR` | retained EXIF | Nikon D3200 manual exposure: `f/7.1`, `1/1000 s`, ISO 200, 18 mm, auto WB | Wikimedia Commons, [Sun at noon time](https://commons.wikimedia.org/wiki/File:Sun_at_noon_time.jpg). |
| `SRC-SUNSET-PHONE` | retained EXIF | iPhone 6 Plus: `f/2.2`, `1/100 s`, ISO 32, 4.15 mm, normal-program auto exposure | Wikimedia Commons, [Sunsetbeach](https://commons.wikimedia.org/wiki/File:Sunsetbeach.jpg). |
| `SRC-SUNSET-DSLR` | retained EXIF | Nikon D100 manual exposure: `f/5`, `1/125 s`, ISO 200, 28 mm, manual WB | Wikimedia Commons, [Sunset Beach](https://commons.wikimedia.org/wiki/File:Sunset_Beach_(2333571055).jpg). |
| `SRC-HDR` | manufacturer | Three-shot AEB order and configurable range through `+/-3` stops in 1/3-stop increments | Canon EOS R5 manual, [Auto Exposure Bracketing](https://cam.start.canon/id/C003/manual/html/UG-03_Shooting-1_0060.html). |
| `SRC-TIMELAPSE` | manufacturer | Interval shooting exposes each frame; optional exposure smoothing adjusts exposure toward the previous frame | Nikon Z9 manual, [Interval Timer Shooting](https://onlinemanual.nikonimglib.com/z9/en/psm_interval_timer_shooting_120.html). |

The nominal Stage 8c sensor is still an **authored generic profile**, not a
measured device. Its `1.12 um`, `50%`, `70%`, and `5,000 e-` values are retained
as already accepted concept-proof inputs with the source envelope recorded in
`SRC-STAGE8C`; they must never be attributed to the Galaxy M01, Canon response
profile, or another named sensor.

## Unresolved terminal failure evidence

The inventory was not sufficient for real-setting prediction when the project
owner declared the camera-emulation experiment a failure and stopped it. The
following gaps remain recorded; they are not an active acquisition queue:

1. **Generic exposure calibration.** A complete equation and reference point
   connecting spectral scene radiometry, aperture/shutter/transmission, ISO or
   exposure index, electron saturation, and normalized RAW. The ISO 12232
   overview establishes standardized speed concepts but the current
   `ISO / 100` post-well gain does not implement such a calibration.
2. **Development specification.** A minimal published or explicitly generic
   camera-linear-to-developed-sRGB transform, including exposure normalization,
   tone/highlight behavior, Color/gamut treatment, and output encoding. Identity
   clamp remains the regression control.
3. **Independent calibration fixtures.** Analytic neutral/chromatic spectra and
   the retained chart corpus at common exposure, with expected unsaturated and
   saturated results through the new calibration and development boundaries.
4. **Controlled clear-sky references.** At least representative noon and
   low-Sun cases with enough acquisition/development provenance to justify sky
   chromaticity and luminance relationships. Uncontrolled JPEG/video frames
   remain qualitative and cannot set numerical parameters.

The accepted native-15 atmosphere fields, camera-control equations, clipping
order, and render parity remain historical evidence and must not be
regenerated merely to resume this stopped lane.

Before execution, the proof run must acquire or copy every external source it
actually consumes into its immutable `references/` evidence, record the final
resolved URL or document revision, hash the bytes, and extract the exact rows
or EXIF fields used. A web-page summary or this Markdown table is not runtime
test data. If an original reference cannot be retained and hashed, its case is
not executable. Local run artifacts are referenced by accepted run ID,
artifact-set hash, artifact path, and artifact hash and are never modified.

## Frozen boundaries

Unless a case explicitly says otherwise, use:

- production wide-view native-15 `preDisplayRadiance` from accepted run
  `000352`;
- solar-noon condition;
- Stage 8c generic sensor: `1.12 um` pitch, `50%` peak QE, `70%` optical
  transmission, `5,000 e-` full well, 12-bit ADC;
- `f/2.2`, `1/6444 s`, no ND, ISO-relative gain `1.02`;
- fixed Stage 8c D55 white balance `[1.9100690064, 1, 1.5608106089]`;
- fixed accepted generic-sensor-to-D65 matrix;
- identity development followed by Rec.709 boundary handling and sRGB
  encoding;
- deterministic evaluation with read noise, shot-noise realization, black
  drift, glare, motion blur, depth of field, diffraction, vignetting, rolling
  shutter, metering, temporal smoothing, and HDR merge disabled.

These values together form the complete frozen baseline
`CameraColorProfile`. Every case level derives another complete immutable
profile, retaining its parent identity, changed field, derivation, and result
identity. A runner may not pass loose parameter overrides directly to
`CameraColorModel`.

Every case records at least disk center, upper-quarter sky, top-center sky,
full-frame raw-clipped pixel count, full-frame ADC-clipped pixel count, and all
intermediate values at the boundary owned by the changed control.

## Complete camera color-influence ranking

This ranking includes per-shot controls, fixed physical camera/lens
characteristics, and fixed processing characteristics. Rank means potential
influence on the displayed color of this Sun-and-sky experiment, not ease of
implementation or whether the user can adjust it.

| Rank | Quantity | Kind | Principal color influence | Inventory treatment |
|---|---|---|---|---|
| 1 | Sensor QE plus CFA spectral response | Fixed physical characteristic | Defines which wavelengths generate electrons in each raw channel; establishes the camera's fundamental raw color coordinates. | Stage 8a/8c generic profile is the current control. A named-camera claim requires measured absolute channel QE. |
| 2 | Sensor cover glass, IR/UV-cut stack, and wavelength-dependent optical transmission | Fixed physical characteristic | Changes the spectrum before the photodiode and can materially alter red/near-IR and blue response. | Not separately known for the generic profile; currently folded into its authored effective QE shapes. Must be measured or sourced before a named-camera profile. |
| 3 | White-balance calibration and selected WB preset | Fixed processing calibration plus per-shot control/policy | Applies the largest routine direct change to raw channel balance and warmth/coolness. | `C-WB`; raw capture must remain invariant. |
| 4 | Camera characterization/color matrix | Fixed processing characteristic or selectable profile | Maps sensor RGB into XYZ/working color and can rotate hue and change saturation. | `C-MATRIX`; all earlier intermediates must remain invariant. |
| 5 | Development/picture profile, tone curve, gamut mapping, and output encoding | Processing characteristic/control | Controls displayed brightness, saturation, highlight color, and boundary compression. | `D-IDENTITY` and blocked `D-CANDIDATE`; it may not alter capture evidence. |
| 6 | Full-well capacity and channel saturation behavior | Fixed physical/electronic characteristic | Determines when individual raw channels lose spectral ratios; all-channel clipping can erase disk color completely. | `E-FULLWELL`; clipping must precede gain, WB, and Color. |
| 7 | Optical exposure from shutter, aperture, and physical filters | Per-shot controls | Ideally scales all wavelengths equally, but changes displayed color indirectly by moving channels across full-well, noise, and black thresholds. | `O-SHUTTER`, `O-APERTURE`, `O-ND`, reciprocity, and composition cases. |
| 8 | Lens/filter spectral transmission and color cast | Fixed lens/filter characteristic; filter may be selectable | A real lens or ND/solar filter is not perfectly neutral and may reshape the captured spectrum. | Initial scalar/ideal-neutral control only. Real filter Color requires a sourced spectral transmission curve; OD alone qualifies attenuation, not chromatic neutrality. |
| 9 | Pixel area, fill factor, microlens efficiency, and angular response | Fixed physical characteristic | Primarily controls photon collection, but wavelength/channel-dependent efficiency or incidence-angle response can change color spatially. | Pixel area is included in Stage 8c. Fill factor, microlens, and angular response are deferred and may not be inferred from pitch alone. |
| 10 | ISO, analog gain, per-channel gain, and conversion gain | Per-shot electronic control plus fixed electronics | Ideally preserves pre-gain color; real channel gain, ADC saturation, and amplified noise can shift highlights and shadows. | `E-ISO` and `X-EXPOSURE-ISO`; photons, electrons, and full-well clipping remain invariant. |
| 11 | Black level, dark current, read noise, shot noise, PRNU, and channel crosstalk | Fixed physical/electronic characteristics | Most important in weak channels and shadows; can desaturate or tint low-signal sky and post-sunset fields. | Deterministic noise-off control only in Stage 8c.2. A later sourced stochastic profile must test these independently. |
| 12 | ADC transfer, precision, and digital range | Fixed electronic characteristic, sometimes output-selectable | Quantization and ADC clipping affect weak gradients and high-gain channel relationships. | `E-ADC`; no earlier physical quantity may change. |
| 13 | Lens flare, veiling glare, ghosts, chromatic aberration, vignetting, and PSF | Fixed optical/spatial characteristics affected by aperture and field angle | Redistributes colored energy spatially and can dominate the visible region around the Sun without changing atmosphere transport. | Explicitly deferred spatial-optics stage; never simulated by altering spectral Color. |
| 14 | Shutter architecture, rolling shutter, motion integration, diffraction, and depth of field | Fixed mechanism plus per-shot interactions | Usually secondary for a static centered sky, but can mix colors spatially or temporally in real images. | Deferred; initial reciprocity claims exclude these effects explicitly. |

The first five ranks are the primary direct-color owners. Ranks 6–12 influence
color mainly through capture limits, signal level, channel asymmetry, and
quantization. Ranks 13–14 are spatial or temporal effects and remain outside
the first constant-radiance pixel proof.

Physical characteristics are configurable **profile inputs** for testing, not
camera-setting sliders. The UI may expose named camera profiles later, but it
must not imply that users can change QE, CFA dyes, full well, pixel pitch,
cover-glass transmission, or read noise independently on a real camera.

## Prioritized test queue

This is the execution priority. It is dependency-ordered, so it differs
slightly from the color-influence ranking: upstream physical characteristics
must be established before downstream controls can be interpreted.

| Priority | Test group | Included characteristics/controls | Status and entry condition |
|---|---|---|---|
| `P0` | Provenance and units | Native spectral units, bin semantics, radiance-to-photon equation, source/profile hashes | Ready through `B-01`; every later group depends on it. |
| `P1` | Spectral capture profile | Sensor QE, CFA response, sensor cover glass, IR/UV-cut stack, wavelength-dependent lens/filter transmission | Generic effective QE/CFA shape is ready from Stage 8c. Cover-stack and ordinary-lens response are folded into that effective profile and cannot be varied independently without sourced curves. Named-camera work is blocked on measured absolute data. |
| `P2` | Photon-collection geometry | Pixel area, fill factor, microlens efficiency, angular response, aperture, shutter, scalar transmission, physical-filter attenuation | Pixel area plus aperture/shutter and sourced OD filters are ready. Fill factor, microlens, angular response, and real chromatic filter/lens response are deferred until sourced. Execute `O-*` and reciprocity only within the declared scalar/on-axis limits. |
| `P3` | Charge capacity and raw clipping | Full-well capacity, per-channel saturation behavior, blooming/charge spill if modeled | Full-well envelope and clipping order are ready through `E-FULLWELL`. Blooming/spill is not modeled and may not be inferred from clipped pixels. |
| `P4` | Sensor electronics and low-signal behavior | Conversion gain, ISO/analog gain, black level, dark current, read noise, shot noise, PRNU, crosstalk, ADC transfer/precision | Deterministic ISO and 10/12-bit ADC cases are ready. Noise-off repeatability is ready. Stochastic/noise/crosstalk qualification is blocked on a sourced profile and comes before post-sunset camera claims. |
| `P5` | Raw color calibration | White-balance calibration, WB presets, channel gains, camera characterization matrix | CIE-derived D55/D65/D75 WB and the generic relative characterization are accepted in verified run `000376`; they preserve all `P0`–`P4` boundaries. |
| `P6` | Development and display | Exposure/look operator, tone curve, saturation, highlight handling, gamut mapping, output encoding | Versioned identity development is accepted in verified run `000378`. Any non-identity candidate remains blocked until sourced or explicitly authored with frozen equations and expectations. |
| `P7` | Spatial and temporal camera physics | Flare, veiling glare, ghosts, PSF, chromatic aberration, vignetting, diffraction, depth of field, shutter architecture, rolling shutter, motion integration | Deferred. These require spatial/temporal kernels and may not be approximated in spectral Color or scalar capture tests. |
| `P8` | Interaction proofs | Reciprocity, optical product, exposure versus ISO, clipping versus WB, downstream isolation, direct composition | Ready only after the participating upstream groups pass. Execute only the six inventoried interaction families. |
| `P9` | Frequent combined uses | Sourced noon phone/DSLR, sunset phone/DSLR, OD 5 disk diagnostic, standard AEB members, later timelapse checkpoints | Execute only ready cases whose component groups passed. Development-free mechanical results may precede appearance review; timelapse and final looks remain blocked as declared. |

No lower-priority group can repair a failed higher-priority group. In
particular, WB, matrices, development, HDR, or glare may not compensate for an
incorrect spectral response, photon count, saturation boundary, or electronic
ordering.

### Physical-profile characteristic cases

| ID | Priority | Characteristic | Current test/expectation |
|---|---|---|---|
| `P-QE-CFA` | `P1` | Effective sensor QE/CFA spectral response | Ready generic control: reproduce Stage 8c photon weights and raw chromatic progression. Stage 8a ideal-observer response remains a diagnostic comparison, not a camera. A named profile requires measured absolute per-channel QE. |
| `P-SENSOR-STACK` | `P1` | Cover glass and IR/UV-cut transmission | Blocked as an independent test: no separate curve is present. Current effective QE profile must state that the stack is folded in rather than zero or neutral. |
| `P-LENS-SPECTRAL` | `P1/P2` | Lens and real-filter spectral transmission | Scalar transmission and sourced optical density are ready for photon-count tests. Color-cast testing is blocked until a wavelength-resolved curve is retained. |
| `P-PIXEL-GEOMETRY` | `P2` | Pitch/area, fill factor, microlens, angular response | Pixel-area scaling is ready and must follow area exactly. Pitch alone may not stand in for fill factor, microlens efficiency, or oblique-ray response. |
| `P-SATURATION` | `P3` | Full well and channel saturation | Ready: pre-clip electrons invariant, lower full well never reduces clipping, clipping precedes gain and Color. Blooming is excluded. |
| `P-GAIN-BLACK-NOISE` | `P4` | Conversion gain, black level, noise, PRNU, crosstalk | Gain-order and deterministic noise-off controls are ready. Physical low-signal behavior is blocked on sourced values. |
| `P-ADC` | `P4` | ADC bit depth and transfer | Ready 10/12-bit diagnostic; only codes/quantization change. Nonlinear ADC behavior requires a sourced transfer. |
| `P-SPATIAL-OPTICS` | `P7` | Glare, ghosts, aberrations, vignetting, PSF | Deferred and separate from Color; requires its own sourced optical model and evidence. |

## Common numerical rules

The tolerances below are authored verification thresholds, not published
camera performance. They are set well above the accepted Stage 8a/8c
independent-oracle discrepancies (approximately `1e-14`) while remaining tight
enough to detect a duplicated or reordered scalar operation.

- Scalar-law and reciprocity relative error: at most `1e-12` in binary64.
- Independently recomputed matrix maximum absolute error: at most `1e-10`.
- ADC quantization error: at most half a code after the declared rounding rule.
- An invariant described as byte-identical must have the same serialized
  binary or canonical JSON representation and hash.
- Every full-frame intermediate must be finite.
- Clipping counts must be monotonic when the tested control monotonically
  increases exposure or gain.
- No test may use a rendered-image judgment to replace its numerical gate.

## Color-reference inventory

| ID | Initial contents | Permitted claim |
|---|---|---|
| `CR-ANALYTIC` | Zero, neutral, fifteen native-bin impulses, channel-biased spectra, and scaled copies | Exact algebra, neutrality, scaling, and clipping boundaries. |
| `CR-COLORCHECKER-STRESS` | Accepted D3 ColorChecker-derived spectra under A/D55/D65/D75, each patch independently scaled to `75%` of nominal full well | Spectrally varied saturation and clipping mechanics only. Independent patch scaling destroys chart-relative lightness; these records may not qualify WB, characterization, or camera-color accuracy. |
| `CR-COLORCHECKER-COLORIMETRIC` | Accepted prerequisite corpus: 190 rawtoaces reflectances fit the D55 matrix; all 24 Ohta patches are independent D55 validation; D65/D75 are untouched cross-illuminant cases; a perfect diffuser is separate; all patches retain common relative scale 1 per illuminant | Run `000373` retains independent sensor/XYZ projection, WB, matrix fitting, validation performance, cross-illuminant behavior, and native-15 discretization loss before development. Illuminant A remains excluded until its official checksum conflict is resolved. |
| `CR-CAMERA-PROFILES` | Accepted PBRT and later rawtoaces responses with declared semantics | Cross-profile differences, not named-camera physical exposure without absolute data. |
| `CR-SKY-SPECTRA` | Accepted native-15 noon, minus-30, minus-10, and sunset fields | Physical scene spectra; production RGB is not expected camera RGB. |
| `CR-PHOTOGRAPHIC` | Sourced noon/sunset phone/DSLR images and EXIF plus labelled owner frames | Qualitative relationships only. |
| `CR-PRODUCTION-RGB` | Accepted production GPU images and exact replays | Identity/non-regression only; never sole Color correctness evidence. |

Every used source, transform, oracle/tool version, and hash must be retained in
immutable evidence before its case executes.

## Baseline and provenance cases

| ID | Case | Input/change | Expected result |
|---|---|---|---|
| `B-01` | Unit and derivation audit | Read-only audit of the same contained production and Stage 8c inputs. | Native values remain bin-average `W m^-2 sr^-1 nm^-1`; bin width and photon conversion occur exactly once; every input identity matches its accepted parent. |
| `B-02` | Stage 8c baseline replay | No change from the frozen baseline. | Reproduce run `000363`: disk raw full-well ratios approximately `[6972.54, 12932.47, 8194.23]`; both named sky samples have zero raw-clipped channels; full frame has 9 raw-clipped pixels, all clipped in three channels; disk encoded sRGB is approximately `[0.990965, 0.997621, 0.989130]`. |
| `B-03` | Zero spectrum | Authored boundary diagnostic: replace one spectrum with fifteen exact zeros. | Exact-zero photons, electrons, DN, XYZ, and output; no clipping or offset is introduced while deterministic noise/black level are disabled. |

## T1 spectral-response qualification cases

These cases qualify the compiled spectral-response stage through the public
`CameraColorModel` before optical controls are varied.

| ID | Case | Frozen inputs | Expected result |
|---|---|---|---|
| `R-ORACLE` | Compiled response identity | Baseline profile `3 x 15` QE photon-integral matrix and retained pinned Colour 0.4.6 Stage 8c oracle | Every weight agrees within `1e-12` relative error and the response kind remains `quantum-efficiency-photon-integral`; no second photon-conversion factor is introduced. |
| `R-SCALE` | Pre-clip linearity | Top-center spectrum from each of `solar-noon`, `sunset-minus-30-minutes`, `sunset-minus-10-minutes`, and `sunset`, scaled by authored diagnostic factors `[0.25, 0.5, 1, 2, 4]` | `sensorPhotonIntegrals` and `photoelectrons` scale by the exact factor within `1e-12` relative error. Normalized pre-clip sensor chromaticity remains invariant within `1e-12`. All selected top-center levels remain below full well. |
| `R-CLOCK` | Captured-clock response | Disk-center, upper-quarter, and top-center spectra from all four accepted production wide fields | All three sensor-response channels agree with the independent pinned-Python evaluation within `1e-12` relative error. The disk-center sunset/noon raw red-to-blue-ratio multiplier is greater than one and agrees with the independent result within `1e-12`; intermediate conditions are retained without imposing an invented monotonic rule. |
| `R-PUBLIC` | Public/trace parity and finite-field control | Every pixel of all four captured fields through the unchanged baseline profile | Public display RGB equals the trace terminal RGB exactly for every pixel; all retained sensor and public values are finite. Downstream stages do not participate in oracle response comparisons. |

## Independent optical-control cases

These are numeric sweeps, not factorial render grids. Full-frame renders are
required only for the baseline and declared endpoints; all levels retain named
sample evidence.

| ID | Control | Levels relative to baseline | Expected result |
|---|---|---|---|
| `O-SHUTTER` | Shutter time | Derived validation levels `[0.25, 0.5, 1, 2, 4] * 1/6444 s` from `SRC-NOON-PHONE` and full-stop ratios in `SRC-CONTROLS` | Every pre-clip electron channel scales by exactly the time ratio. Raw chromaticity is invariant before clipping. Raw-clipped counts are nondecreasing with time. |
| `O-APERTURE` | f-number | Published/observed values `[1.4, 2.2, 4, 8, 16]`; `2.2` is the EXIF baseline and the remaining standard stops come from `SRC-CONTROLS` | Relative pre-clip electrons equal `(2.2/N)^2`. Closing the aperture never increases raw or ADC clipping. Secondary aperture effects are explicitly absent. |
| `O-ND` | Solar-filter attenuation | Baseline OD 0 plus published AstroSolar OD 3.8 and OD 5.0 from `SRC-ND`; derived stops are `OD/log10(2)`, approximately `12.62` and `16.61` | Pre-clip electrons scale by `10^-OD`; pre-clip chromaticity is invariant in the declared ideal-neutral model. OD 5 gives baseline-noon disk full-well ratios approximately `[0.06973, 0.12932, 0.08194]`, so disk center has zero raw-clipped channels; named sky is near black. |
| `O-PIXEL-AREA` | Pixel collection area | Published/authored Stage 8c pitch envelope `[0.8, 1.12, 1.4] um`, with the baseline at `1.12 um` | Profile pixel area is the square of pitch and pre-clip electrons scale by `(pitch/1.12)^2` within `1e-12`; pre-clip chromaticity is invariant. No fill-factor, microlens, or angular-response claim is added. |

## Independent sensor/electronic cases

| ID | Control | Levels | Expected result |
|---|---|---|---|
| `E-ISO` | Relative analog/system gain | Full-stop ISO-derived gains `[1, 2, 4, 8, 16]`, corresponding to ISO `[100, 200, 400, 800, 1600]` under the simplified `SRC-CONTROLS` model | Incident photons, pre-gain electrons, full-well clipping, and raw-clipped counts are byte-identical at every level. Pre-ADC signal and DN scale with gain until ADC clipping; ADC-clipped counts are nondecreasing. This tests the declared model, not exact behavior of every camera covered by ISO 12232. |
| `E-FULLWELL` | Device full-well diagnostic | Derived/sourced envelope `[1289, 5000, 6390, 9000, 10704] e-` from `SRC-SMALL-PIXEL`, authored Stage 8c nominal, `SRC-ISET`, and `SRC-EMVA` | Pre-clip electrons are identical. Normalized raw values and raw-clipped counts change only at the full-well boundary. Lower full well cannot reduce raw clipping. This is a cross-device profile diagnostic, not a shot setting. |
| `E-ADC` | ADC precision/range diagnostic | Published `[10, 12]` bits from `SRC-ADC` | Photons, electrons, raw clipping, white-balanced floating values, and matrix output remain identical. Only quantized codes and quantization error change. |
| `E-NOISE-OFF` | Deterministic control | Noise parameters present but realization disabled | Repeated runs are byte-identical. Stochastic sensor qualification remains a later stage. |

## Independent Color and development cases

| ID | Control | Cases | Expected result |
|---|---|---|---|
| `C-WB` | White-balance preset | Exact perfect-diffuser multipliers compiled from official CIE D55, D65, and D75 spectra in `SRC-WB`; A remains quarantined | Accepted by verified run `000376`: capture through ADC is byte-identical, perfect diffuser is neutral within `1.110223025e-16`, and only post-raw Color changes. |
| `C-MATRIX` | Camera characterization | Accepted `CR-COLORCHECKER-COLORIMETRIC`: 190-patch D55 training fit, independent 24-patch Ohta validation, and D65/D75 generalization sets; accepted Stage 8c matrix remains a regression input only | Accepted by verified run `000376`: JavaScript/oracle fit error `1.620925616e-14`, exact projection parity on 72 validation rows, and byte identity through WB. The identity matrix remains diagnostic and makes no camera claim. |
| `D-IDENTITY` | Identity development control | Versioned `camera-development-v1` / `identity-clamp`; no look or tone curve | Accepted in verified run `000378`: exact in-range identity, analytic boundary clamp, zero earlier-stage mutation, monotonicity, and retained dark weak-blue diagnostic. |
| `D-CANDIDATE` | Fixed development candidate | Candidate list not yet frozen | All values through camera characterization must be byte-identical to `D-IDENTITY`; only developed/display output may change. No candidate is executable until its equation, source or authored status, parameters, and expected monotonic/highlight behavior are added to this inventory. |

## Required interaction and composition cases

| ID | Interaction | Inputs | Expected result |
|---|---|---|---|
| `X-RECIPROCITY` | Aperture/shutter reciprocity | Baseline `(N=2.2,t=1/6444)` plus exact pairs `(N=2.2*sqrt(2),t=2/6444)`, `(N=4.4,t=4/6444)`, and `(N=2.2/sqrt(2),t=0.5/6444)` | Every deterministic pre-clip electron value and raw-clipping decision is equal to baseline within `1e-12` relative error. Do not add depth-of-field, diffraction, or motion claims. |
| `X-OPTICAL-PRODUCT` | Combined optical factors | Two derived diagnostics using only registered inputs: `(f/4, 2x baseline shutter, OD 3.8, fixed baseline transmission)` and `(f/8, 0.5x baseline shutter, OD 5.0, fixed baseline transmission)` from `SRC-CONTROLS`, `SRC-NOON-PHONE`, and `SRC-ND` | Direct evaluation equals baseline radiance multiplied once by the declared shutter ratio, `(2.2/N)^2`, and `10^-OD`; sequentially assembled and direct forms agree within `1e-12`. Transmission is held fixed because no measured transmission curve is claimed. |
| `X-EXPOSURE-ISO` | Optical exposure versus post-well ISO | Baseline; published OD 5 attenuation from `SRC-ND`; and the attenuated result followed by a derived compensating gain of `100000` | Baseline Sun raw-clips; OD 5 Sun does not. Post-well gain may reach ADC/display clipping but must not change the attenuated case's photons, electrons, or raw-clipping record. The extreme gain is an authored ordering diagnostic, not a real-camera ISO claim. |
| `X-CLIP-WB` | Raw clipping versus white balance | Baseline clipped Sun under every frozen WB preset | Raw clipped `[1,1,1]` and clipping counts remain identical. WB is applied afterward. Any highlight-neutralization rule must be general sensor processing, never a Sun mask. |
| `X-DOWNSTREAM-ISOLATION` | Matrix/development isolation | Baseline through each matrix and future development candidate | Parent capture, raw, ADC, and WB artifacts are byte-identical. Each downstream stage changes only its owned output. |
| `X-DIRECT-COMPOSITION` | Combined implementation parity | Each curated use case below | One direct pipeline evaluation must equal composition of the individually proven control operations at every retained boundary. |

All six `X-*` interaction families are accepted in verified immutable run
`000379-camera-color-model-d7-t7` (artifact set
`82262da32dedea97a18f41658643323e9b057e59b07fa4fce9dd2f1837d29fc5`).
The controlling maxima are `3.667965e-16` for reciprocity,
`1.560929e-16` for optical products, and exact zero for the 11-case direct
composition comparison. The proof also accepts OD 5/raw-gain ordering,
clipped-Sun/WB invariance, downstream isolation, and public/trace parity.

## Curated frequent-use configurations

These are not a cross product. Each configuration is one integration case.
Exact values marked `pending` must be frozen from a source or explicitly
accepted as authored before execution.

| ID | Frequent use | Settings/status | Physics-backed expectation | Appearance expectation |
|---|---|---|---|---|
| `U-PHONE-DAYLIGHT` | Bright-daylight generic phone | Ready settings from `SRC-NOON-PHONE`: `f/2.2`, `1/6444 s`, ISO 102, no ND; applied to the authored Stage 8c sensor rather than claimed as an SM-M015G reproduction | Reproduce `B-02`: Sun clips all raw channels; named sky does not; only 9 wide-noon pixels raw-clip. | Disk is unrecoverable and near white after WB/Color. Current identity development remains dark and is not the original phone JPEG look. |
| `U-DSLR-NOON` | Noon DSLR settings | Ready settings from `SRC-NOON-DSLR`: `f/7.1`, `1/1000 s`, ISO 200, auto-WB policy; evaluated with the generic sensor and fixed derived WB | Must obey the independently proven exposure and gain equations. Predict clipping from the source spectrum before rendering; do not fit to the Wikimedia JPEG. | The external photograph is context only because its Nikon sensor, lens transmission, clouds, raw processing, and Adobe Camera Raw development are not reproduced. |
| `U-PHONE-SUNSET` | Phone sunset | Ready settings from `SRC-SUNSET-PHONE`: `f/2.2`, `1/100 s`, ISO 32, normal-program auto exposure; use the captured production sunset field | Exact raw clipping is predicted from the frozen spectrum and settings before rendering. | Preserve warm sky relationships; the source iPhone JPEG is qualitative context, not a pixel oracle or iPhone reproduction. |
| `U-DSLR-SUNSET` | Manual DSLR sunset | Ready settings from `SRC-SUNSET-DSLR`: `f/5`, `1/125 s`, ISO 200, manual-WB source flag; use fixed CIE-derived WB rather than inventing the photographer's missing preset | Exact raw clipping is predicted before rendering and must follow the independent optical/ISO laws. | Preserve warm sky relationships; an unrecoverable disk is acceptable. No Nikon D100 or source-development claim is made. |
| `U-DISK-MANUAL` | Filtered manual disk-recovery diagnostic | Ready filter data from `SRC-ND`: baseline settings plus idealized AstroSolar OD 5 attenuation and ISO-relative gain 1 | Noon disk center remains below full well at approximately `[0.06973,0.12932,0.08194]`; named sky is extremely dark. | Disk boundary/color may become recoverable; scene underexposure is expected and not corrected by a Sun branch. The ideal-neutral approximation must be stated because a real filter's full spectral transmission curve is not supplied. |
| `U-TIMELAPSE-CHECKPOINT` | Passing-time automatic exposure | Sourced behavior only from `SRC-TIMELAPSE`; not executable in Stage 8c.2 because exact aperture/shutter/ISO checkpoints are not yet frozen | When Stage 8d freezes the policy, each checkpoint resolves to explicit settings and uses the same single-capture pipeline. | Exposure smoothing follows prior-frame exposure behavior qualitatively; its exact project equation and timing remain Stage 8d work. |
| `U-HDR-MEMBERS` | Standard three-member AEB diagnostic | Ready capability from `SRC-HDR`: baseline, `-3`, and `+3` exposure members, each retained separately; no merge | Each member independently satisfies the single-capture model. The `-3` member is expected to leave the noon Sun raw-clipped because baseline disk center is thousands of wells above saturation; standard AEB is therefore not a disk-recovery mechanism here. | No merge appearance is claimed in Stage 8c.2. |

All ready configurations above except the intentionally blocked
`U-TIMELAPSE-CHECKPOINT` are accepted in verified immutable run
`000382-camera-color-model-d8-t8` (artifact set
`c2cf6efab91308d86e58d0a2123b2fb35fed85b46fb4406f77e90f085bbed275`).
The run confirms every pre-render clipping prediction in an independent render
pass. It also confirms the two discriminating expectations: OD 5 recovers the
noon disk center, while the `-3 EV` AEB member does not. These results accept
configuration mechanics with identity development, not the final camera look.

## D8.1 application exposure-selection policies

The selector consumes complete evaluated profiles; it never edits a profile or
adds a pixel transform. Initial authored policies are versioned in
`camera-exposure-selection-d8-1-v1.json`:

- `normal`: raw and ADC clipping fractions at most `0.001`, display-high
  clipping at most `0.05`, and exact-white fraction at most `0.001`; select the
  greatest mean encoded field luminance among qualifying profiles;
- `disk-visible`: the same field constraints plus no clipped disk-center raw
  channel; select the greatest mean encoded field luminance;
- `manual`: return the explicitly requested complete profile without ranking;
- optional continuity: reject a candidate farther than a supplied maximum EV
  step from the prior optical-exposure factor.

These thresholds are transparent application choices. `0.001` permits a
compact solar image while rejecting broad physical clipping; `0.05` requires
at least `95%` of the field below the display high boundary. They are not
anatomical, manufacturer, or photographic-standard claims. A no-qualified
result is valid and may not be silently replaced by a least-bad profile.

`D8.1/T8.1` is accepted in verified immutable run
`000384-camera-exposure-selection-d8-1-t8-1` (artifact set
`8b47a56b8eb9aa9f0dd13601fee7351a502e5c0f24258cb0d88789ff71317a39`).
The normal policy selects `U-DSLR-NOON` and `U-DSLR-SUNSET`; disk-visible
selects `U-DISK-MANUAL`; manual returns `U-PHONE-SUNSET`; and the authored
zero-clipping sunset control returns no candidate. The result ranks only the
registered authored profiles. It proves selector mechanics, not real-camera
exposure prediction. Its "normal" winners remain uncalibrated historical
selector outputs; no current result may be described as the photographically
best setting.

## Execution inventory and budget

The first runner may execute the sourced/derived numerical cases `B-*`, `O-*`,
`E-*`, `C-WB`, `C-MATRIX`, `D-IDENTITY`, and `X-*`. It may render only the
baseline, declared sweep endpoints, and ready curated uses. `D-CANDIDATE` and
`U-TIMELAPSE-CHECKPOINT` remain blocked until their exact configurations and
expectations are added here. The camera-emulation lane is stopped; no remaining
camera tranche is executable from this inventory.

The budget is additive:

```text
one baseline
+ sum of independently selected levels
+ six required interaction families
+ ready curated frequent-use configurations
```

No implementation may silently expand this into a Cartesian or factorial
matrix. A new case requires a real product mode, a common photographic use, or
a diagnosed interaction that the existing inventory does not cover.

## Acceptance boundary

Stage 8c.2 mechanics are accepted only when every ready numerical case passes,
derivation and containment evidence is immutable, and direct combined
evaluations match the independently proven operations. That acceptance does
not select a final development curve, named camera, automatic exposure policy,
HDR merge, glare model, or human-observer mode.

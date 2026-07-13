# Camera Controls Development Plan

## Purpose

This document owns the implementation plan for the contained camera-controls
concept proof. All functionality is implemented as one configurable
`CameraColorModel`. It turns the accepted Stage 8a--8c work into a reusable,
factorized spectral-radiance-to-display Color model whose controls can be
tested independently and composed without changing their physical meaning.

The companion [Camera Controls Testing Plan](camera-controls-testing-plan.md)
owns execution and acceptance. The
[Camera-Control Test Inventory](camera-control-test-inventory.md) owns exact
cases, levels, sources, and expected values. This document does not duplicate
those facts.

## Scope and boundary

Development remains under `scripts/extraterrestrial/`; generated builds,
reports, captures, and run evidence remain under `tmp/extraterrestrial/`.
Production and application sources remain read-only until explicit promotion.

This stage creates the programmatic `CameraColorModel` and its single
serializable `CameraColorProfile` input. It does not create production UI, but it freezes the
meanings and constraints a later UI must expose.

The initial implementation includes:

- effective `3 x 15` camera spectral response;
- photon collection from shutter, aperture, pixel area, and declared optical
  transmission;
- full-well clipping;
- post-well ISO/system gain;
- ADC quantization;
- white balance and camera characterization;
- an identity development stage and a slot for later fixed development;
- composed named configurations made only from proven controls; and
- complete intermediate diagnostics and derivation records.

Stochastic noise, separate cover-stack and lens spectral curves, microlens and
angular response, glare/PSF, motion, automatic metering, temporal smoothing,
HDR merge, named-camera fidelity, production UI, and production integration
remain later work unless their prerequisites are added to the inventory.

## Research-derived implementation decisions

The
[Camera Spectral-Color Prior-Art Research](camera-spectral-color-prior-art-research.md)
is a development input, not background reading. Its following findings are
binding unless later evidence explicitly supersedes them:

| Research result | Development consequence |
|---|---|
| PBRT v4 `PixelSensor` makes sensor response a data/profile choice and compiles spectral response before runtime. | `CameraColorProfile.device.spectralResponseMatrix3x15` is compiled offline; switching profiles does not create another rendering topology. |
| PBRT's `imagingRatio` and `maxComponentValue` are not a physical electron/full-well model. | Do not copy either as the camera exposure or saturation implementation. Retain shutter, aperture, photon conversion, full well, and gain as distinct profile fields and ordered model stages. |
| The published linear camera equation integrates spectral radiance against channel sensitivity and exposure time. | Preserve native-15 bin coordinates and absolute scale; do not normalize input spectra. Compile the integral to three 15-term dot products. |
| Energy responsivity, quantum efficiency, and arbitrary relative matching functions have different units. | Every spectral response records its response kind. Apply `lambda/(h*c)` only to QE-based photon conversion and never infer electrons from an arbitrary relative curve. |
| rawtoaces uses measured sensitivities and illuminants to derive WB and camera transforms, with unit-aware spectral records. | Adopt its structural separation and provenance discipline for profile compilation and characterization; do not import a hidden runtime pipeline. |
| EMVA 1288 separates QE, photon exposure, system gain, read/dark noise, and saturation. | Preserve those as separate profile quantities and diagnostic boundaries. Never fold them into the fitted `3 x 3` Color matrix. |
| Colour is the strongest reviewed reference implementation. | Keep pinned Colour offline as the primary independent oracle for resampling, profile compilation, WB, and characterization. It is not a runtime dependency. |
| CIE-JS, jsColorEngine, Color.js, and ICC/LUT systems cover only portions of the boundary. | They may provide later independent or post-capture evidence, but none owns `CameraColorModel` or replaces its absolute spectral capture stages. |
| Generic wavelength-to-RGB and pigment/reflection packages normalize or solve a different problem. | Do not use `color-spectrum`, Spectral.js, or an equivalent normalized mapper in the model. |
| Stage 8a accepted PBRT-style relative response compilation and camera characterization. | Reuse its compiled-matrix construction, accepted profile evidence, and oracle gates; do not redo the profile mathematics from scratch. |
| Stage 8c accepted a generic QE-scale photon/full-well relationship but not a named device. | Reuse its radiance-to-sensor equation, authored generic envelope, clipping order, and accepted Sun-clipped/sky-unclipped relationship. Preserve the generic-only claim. |
| The identity/no-tone-curve result is dark and weakly blue while sourced photographs show a clipped Sun can coexist with useful blue sky. | Treat control ordering and relative mechanics as historical evidence, while absolute exposure calibration and development remain unresolved terminal failures. Do not alter atmosphere spectra or tune blindly to a JPEG. |

## Existing evidence and code to consolidate

`CameraColorModel` begins from recent accepted work rather than a clean-room
rewrite:

- adapt `scripts/extraterrestrial/color/RelativeCameraSpectralProfile.js`
  for offline bin integration, `3 x 15` projection, matrix operations, and
  characterization helpers;
- consume the accepted Stage 8a compiled response/matrix evidence from run
  `000358-camera-relative-projection-stage8a`, retaining its source and
  derivation identities;
- translate the complete values and equations in
  `camera-generic-phone-stage8c-v1.json` into the first versioned
  `CameraColorProfile` rather than leaving them as runner-local parameters;
- extract the physical operations proven by
  `run-camera-generic-phone-stage8c.js` into the Color model's internal stages;
  the runner remains evidence/orchestration and does not become runtime code;
- reuse `camera-stage8a-colour-oracle.py` and
  `camera-stage8c-colour-oracle.py` as independent offline checks, updating
  them only when the new profile schema requires an explicitly versioned
  adapter; and
- retain run `000363-camera-generic-phone-stage8c` as the baseline physical
  relationship that the first complete profile must reproduce.

Generated artifacts may be copied into a new run or compiled profile because
cross-run reuse is allowed. Their original runs remain immutable, and every
copy or derivative retains its complete parent, equation, tool, parameter,
and result identity.

The initial development should therefore be mainly consolidation and
factorization: move already proven calculations behind one Color-model/profile
contract, then add the independently inventoried controls. Research libraries
remain offline or evidentiary unless a later promotion decision accepts them
as product dependencies.

## Color-reference corpus

Production framebuffer output is a regression control, not the sole Color
authority. Development maintains a separate versioned
`CameraColorReferenceCorpus`; its stimuli are evidence inputs, never
`CameraColorModel` parameters.

The corpus combines: analytic zero/neutral/native-bin/channel-biased spectra;
the rawtoaces 190-patch set for fitting; all 24 ColorChecker N Ohta patches as
independent validation under CIE D55, D65, and D75; PBRT and rawtoaces camera
responses; accepted native-15 noon and twilight sky fields; and sourced
photographs/EXIF for qualitative appearance only. Illuminant A is excluded
until its official checksum conflict is resolved. Each record declares whether
it is an exact oracle, physical relationship, regression control, or
qualitative reference. The corpus is compiled offline, versioned, and hashed.

## Ownership model

### `CameraColorModel`

`CameraColorModel` is the single public Color owner from transported native-15
spectral radiance through encoded display RGB. Sensor capture, clipping,
electronics, white balance, characterization, and development are internal
stages of that Color model rather than independent application subsystems.
Its normalized-raw trace boundary invokes the same WB, matrix, development,
and encoding implementation as the ordinary spectral path. It exists to
qualify and diagnose those owned stages directly; it is not a second renderer
or an alternate public appearance result.

Its sole configuration input is one validated, immutable
`CameraColorProfile`. It exposes normal Color-model operations plus an
evidence-only trace operation:

```text
describe() -> model identity, configuration, assumptions, and provenance
radianceToLinearOutput(spectrum15) -> linear output RGB
radianceToDisplayRgb(spectrum15) -> encoded display RGB
traceRadiance(spectrum15) -> every retained internal boundary
transformField(native15Field) -> display field + aggregate diagnostics
```

The ordinary renderer calls the Color result. Proof runners may inspect
`traceRadiance`; application code must not reconstruct or reorder the model's
internal stages.

### `CameraColorProfile`

Every parameter consumed by `CameraColorModel` is specified in this one
versioned profile. The profile is structured by ownership:

```text
id and provenance
device:
  spectralResponseMatrix3x15
  pixelAreaM2
  effectiveOpticalTransmission
  fullWellElectrons
  conversionGain
  adcBits and adcTransfer
  blackLevel
  noiseProfile
capture:
  shutterSeconds
  apertureFNumber
  filter or optical-density specification
  iso or declared post-well gain
color:
  whiteBalancePreset or explicit channel multipliers
  cameraToOutputMatrix3x3
  output color-space identity
development:
  operator identity and parameters
  highlight policy
  gamut policy
output:
  encoding and display assumptions
```

The generic profile may fold the cover glass, IR/UV cut, CFA, and other
unresolved wavelength-dependent losses into its effective response. The
profile must say so explicitly. Unknown characteristics may not silently
default to measured or neutral behavior.

There are no loose constructor parameters for these values. A control change
creates or selects another complete profile. Derived profiles retain the base
profile identity, changed field, derivation, and resulting identity.

### Policy owners

Manual Camera, Auto Timelapse, and HDR Timelapse select or derive explicit
complete profiles. They do not pass side-channel settings or add an invisible
pixel transform. Policy development begins only after the static model is
accepted.

## Frozen processing order

```text
native-15 spectral radiance
  -> sensor spectral projection and photon conversion
  -> shutter * aperture * pixel area * optical/filter transmission
  -> pre-clip electrons
  -> full-well clipping
  -> ISO/system gain and conversion gain
  -> ADC clipping and quantization
  -> white balance
  -> camera characterization matrix
  -> development
  -> output gamut handling and encoding
```

No downstream stage may modify, replace, or conceal an upstream intermediate.
ISO is not optical exposure; white balance is not sensor response; development
is not raw recovery; and glare is not Color.

## Model and internal operator plan

Create `CameraColorModel` under the contained Color implementation area. It
composes small pure internal operators. Exact helper filenames may follow the
existing layout, but there is one public model owner and responsibilities
remain separated:

```text
compileCameraColorProfile(profileSource) -> CompiledCameraColorProfile
new CameraColorModel(compiledProfile)
projectSpectrumToSensor(spectrum15, compiledProfile) -> sensorPhotonRates3
applyOpticalCapture(photonRates3, compiledProfile) -> electrons3
clipFullWell(electrons3, compiledProfile) -> clippedElectrons3 + clipMask3
applySensorElectronics(clippedElectrons3, compiledProfile) -> signal3
quantizeADC(signal3, compiledProfile) -> codes3 + adcClipMask3
applyWhiteBalance(raw3, compiledProfile) -> balanced3
applyCameraCharacterization(balanced3, compiledProfile) -> linearOutput3
applyDevelopment(linearOutput3, compiledProfile) -> developed3
encodeOutput(developed3, compiledProfile) -> encoded3
CameraColorModel.radianceToDisplayRgb(spectrum15) -> encoded3
CameraColorModel.traceRadiance(spectrum15) -> internal-boundary record
CameraColorModel.transformField(field) -> image + aggregate diagnostics
```

Internal operators accept explicit immutable inputs and return owned outputs.
They do not read UI state, clocks, atmosphere state, or hidden globals. Their
composition order is private to `CameraColorModel`; tests reach it through the
model's trace contract rather than assembling an alternate renderer.

## Diagnostic contract

Every evaluated sample and retained full-frame summary makes these boundaries
observable:

```text
source spectrum identity
sensor photon rates
pre-clip electrons
raw clip mask and normalized raw
post-gain signal
ADC codes and ADC clip mask
white-balanced channels
characterized linear color
developed linear color
encoded output
```

The full-frame diagnostic includes finite counts, per-channel raw and ADC
clipping counts, exact-zero counts, and configured named samples. Diagnostics
are scientific evidence, not optional debug logging.

## Configuration and provenance format

Every `CameraColorProfile` is a versioned, machine-readable fixture. Each
records:

- schema and semantic version;
- stable identifier and human-readable role;
- source classification: inherited, measured, published, derived, or authored;
- parent artifact IDs, paths, and hashes;
- equations, material parameters, and units;
- assumptions and folded/deferred characteristics; and
- compatible pipeline version.

Named configurations are complete profiles or traced derivatives of a complete
base profile. They may not copy a camera brand into their name unless evidence
supports that claim.

## Incremental work packages

Development and testing proceeded as vertical slices through `D8.2/T8.2`.
The table retains the original package structure for history; `D8.3`, `D9`,
and `D10` are canceled and not executable.

| Package | Development result | Companion proof |
|---|---|---|
| `D0` | Freeze the `CameraColorModel` public contract, sole `CameraColorProfile` schema, derivation rules, units, provenance, internal boundaries, and diagnostics. | `T0` provenance/unit audit and baseline identities. |
| `D1` | Create the model shell and compile accepted Stage 8c values into the first complete profile. | `T1` response/oracle replay, zero, and scaling through the model. |
| `D2` | Implement shutter, aperture, pixel area, scalar transmission, and ideal/sourced OD before electron collection. | `T2` optical laws and endpoint renders. |
| `D3` | Compile the multi-source `CameraColorReferenceCorpus`, then implement full-well capacity and per-channel raw clipping. | `T3` saturation and channel-selective clipping across analytic, ColorChecker, and transported-sky stimuli. |
| `D4` | Implement post-well ISO/gain, deterministic noise-off state, and 10/12-bit ADC. | `T4` ordering, gain, invariance, and quantization. |
| `D5` | Implement CIE-derived white balance and pluggable characterization matrices. | `T5` isolation, neutral, and matrix-oracle checks. |
| `D6` | Implement identity development and a versioned development interface; select no new look yet. | `T6` identity replay and ownership isolation. |
| `D7` | Complete the `CameraColorModel` composition without fusing away diagnostic boundaries. | `T7` reciprocity, non-commutativity, public-result parity, and composition parity. |
| `D8` | Add only ready curated configurations from the inventory. | `T8` source-backed integration cases and review plate. |
| `D8.1` | Add a deterministic exposure evaluator/selector over complete profiles. It owns field clipping and brightness/chroma diagnostics plus explicit application-policy selection; it adds no camera physics or development look. | `T8.1` prediction, selection, no-qualified, disk-visible, manual, and optional continuity proof. |
| `D8.2` | Render the verified selected complete profiles without changing policy or Color. | `T8.2` prediction-to-render parity, prior same-profile PNG identity, and review plate. |
| `D8.3` | Freeze a justified generic exposure calibration and the camera-linear-to-developed-sRGB boundary. Replace real-setting use of the provisional `ISO / 100` interpretation without disturbing the accepted post-well-gain mechanic. Add trace outputs needed to distinguish capture chromaticity from development. | `T8.3` calibration, ordering-regression, independent Color/development, and controlled noon/sunset sky checks. |
| `D9` | Only after `D8.3/T8.3` acceptance, freeze and implement development candidates individually. | `T9` numerical behavior and owner appearance review. |

`D10` would have introduced Manual Camera, Auto Timelapse, and HDR Timelapse
policies. It was canceled with the camera-emulation lane.

## Runtime and performance shape

The target runtime work per pixel is bounded and independent of atmosphere
complexity:

- three 15-term spectral-response dot products;
- bounded scalar optical/electronic operations;
- fixed three-channel clipping and quantization;
- one `3 x 3` color conversion; and
- one fixed development/encoding operation.

Profile compilation, matrix fitting, independent Colour calculations, and
configuration validation occur offline. Automatic timelapse should preferably
precompute its exposure schedule instead of analyzing every rendered frame.

## Promotion and UI boundary

The proof establishes a contained Color-model contract and reusable
algorithms, not production APIs. Promotion requires a separate decision covering ownership,
GPU/CPU placement, serialization compatibility, regression tests, performance,
UI design, and licensing.

A later UI may expose profile selection and controls for shutter, aperture,
ISO, filter, white balance, development, and exposure compensation. Each UI
change resolves to a validated derived profile before the Color model consumes
it. It must not present QE, CFA dyes, pixel pitch, full well, sensor stack, or
read noise as ordinary adjustable settings on a real camera.

## Completion criteria

Stage 8c.2 development is complete when:

- `D0`--`D8` exist under containment and their matching tests pass;
- `CameraColorModel` is the only public spectral-radiance-to-camera-display
  owner and has no hidden state or ambiguous operation order;
- direct composition equals individually proven operations;
- every intermediate needed to explain clipping or Color remains observable;
- curated configurations contain only proven components;
- evidence retains an unbroken derivation chain; and
- deferred functionality is absent or fails explicitly.

This does not accept a final development look, automatic exposure, HDR merge,
glare, a named camera, product UI, or production integration.

## Current implementation status

`D0/T0` is accepted in immutable run
`000366-camera-color-model-d0-t0` (artifact set
`185f9eb2a23485705c1b3269bfdf2beb7ab0d638738241de654d1fb08b346d4c`).
It adds the contained `CameraColorProfile` compiler,
`CameraColorModel`, and complete baseline profile. The model owns the QE photon
integral, optical capture, full-well clipping, post-well gain, ADC, white
balance, characterization, identity development, and sRGB encoding behind one
public Color interface and one evidence-only trace interface.

The accepted proof processed all `257,041` wide-noon pixels. Its public
framebuffer is byte-identical to accepted Stage 8c hash
`5401f47222c9bc55dce30aa8d23156fad45948e0674749a35c96079f4ba8f81e`;
raw-clipped and all-channel-clipped pixel counts both reproduce as `9`; all
public results equal their trace terminal values; all values are finite; and
exact-zero native-15 input remains exact zero through every tested boundary.

The run retains the Stage 8a compiled profile, PBRT response source and
license, Stage 8c unit audit and proof, prior reference render, complete new
profile, implementation identities, field-packet parents, equations, and
derivation. This completes `D0/T0` and establishes the `D1` model/profile
surface.

`D1/T1` is accepted in immutable run
`000367-camera-color-model-d1-t1` (artifact set
`8bf33764f0ead4524653035284582a98050657e4fa2e7b7adc19ebb7df96ca0f`).
The baseline matrix agrees with retained Colour to
`1.9615082665263662e-16` relative and named/scaled model response agrees with
the independent pinned-Python application to `3.9032126778829944e-16`.
Pre-clip response/electron scaling and sensor-chromaticity errors are exactly
zero across five scales and all four captured clock states. All `1,028,164`
full-field evaluations are finite and have zero public/trace mismatches. The
sunset/noon disk red-to-blue response multiplier is `5.656144728329872`,
agreeing with the oracle to `1.5702894150701547e-16` relative. Proceed to
`D2/T2` after retaining the exact exposure and filter references it consumes.

`D2/T2` is accepted in immutable run
`000370-camera-color-model-d2-t2` (artifact set
`85e39815201169ecf0c56b35bd8c4551bfd5ffeaa7aed31cbfede3375dec5e88`).
Shutter, aperture, ideal-neutral OD attenuation, and pixel area are now
complete derived-profile parameters consumed by the unchanged
`CameraColorModel`. Thirteen unique profiles produced `3,341,533` full-field
pixel evaluations and nine endpoint renders. Maximum electron-factor error is
`6.199757029814731e-16`; maximum pre-clip chromaticity error is
`1.1102230246251565e-16`; all clipping monotonicity, profile-derivation,
finite-value, and public/trace gates pass. OD 5 leaves disk center and the
complete field below raw full well. The run retains and hashes the exact
Stanford exposure reference and official Baader OD product document.

Runs `000368` and `000369` are retained source-acquisition failures: Node HTTPS
failed in the former, and Windows Schannel could not perform a certificate
revocation lookup in the latter. Accepted run `000370` used curl with normal
certificate validation and only the Windows `--ssl-no-revoke` exception.
Proceed to `D3/T3` full-well capacity and raw-clipping profiles.

`D2/T2` is mechanical qualification, not acceptance of production RGB as
camera Color truth. `D3/T3` begins by materializing the first multi-source
reference corpus before testing saturation.

`D3/T3` is accepted in immutable run
`000371-camera-color-model-d3-t3` (artifact set
`ec5a8b3b330a5864d79aa949000ce96438f9a40023ce4043786e13d80eb315ad`).
The first versioned corpus contains `132` labelled records: `21` analytic,
`96` ColorChecker cases across A/D55/D65/D75, `12` transported sky spectra,
two camera-profile records, and one retained qualitative photograph. Five
full-well profiles produced `645` stimulus evaluations with exact pre-clip
invariance, zero non-finite values, zero public/trace mismatches, monotonic
clipping, and explicit zero-, one-, two-, and three-channel clipping cases.
Proceed to `D4/T4` sensor gain and ADC behavior.

The `D5/T5` source and oracle prerequisite is accepted and independently
verified in immutable run `000373-camera-t5-colorimetric-prerequisite`
(artifact set
`8249584487fa29fc8d819792188c8df5ec2ed56aaeb4fb720f7d69b1895531f1`).
It retains the selected source pack, rank-3 190-patch D55 fit, 72 independent
Ohta D55/D65/D75 validation cases, exact perfect-diffuser WB, and the measured
native-15 loss distribution. It supplies the generic relative-color evidence
used by accepted `D5/T5`; A, development appearance, and named-camera claims
remain outside it. Run `000372` preserves the sandbox-blocked environment
attempt.

`D4/T4` is implemented and accepted on the current shared Color-stage code in
verified immutable run `000375-camera-color-model-d4-t4` (artifact set
`04ccb783237087984ea0c000f5b21f7d98e781fed1bccbb268d65a957a6a8afb`).
`CameraColorProfile` now permits traced `postWellGain` and `adcBits`
derivations. Five gain profiles and 10/12-bit ADC profiles preserve every
upstream boundary, obey the exact gain and half-code equations, and repeat
byte-identically with noise disabled. Run `000374` is retained accepted
pre-refactor evidence; `000375` requalifies the current implementation.

`D5/T5` is implemented and accepted in verified immutable run
`000376-camera-color-model-d5-t5` (artifact set
`12e756b300ddeb73b472a28aa8e588cb6807de77f2b0bc5119f6ffe4cc279330`).
`CameraColorModel.traceNormalizedRaw()` and the ordinary spectral path now
share one Color-stage implementation. Profiles own their CIE-derived WB and
characterization matrix. The independent JavaScript/Python fit, 72 oracle
rows, WB/matrix isolation, and public/trace parity all pass. Identity
development is unchanged; proceed to `D6/T6` without selecting a look.

`D6/T6` is implemented and accepted in verified immutable run
`000378-camera-color-model-d6-t6` (artifact set
`b4e3df1903b362891e02cb9345d1255b4f07e06899d18d9eee466922e5edebb4`).
`CameraDevelopment` now owns versioned interface `camera-development-v1` and
the sole allowed `identity-clamp` operation. `CameraColorModel` delegates both
spectral and normalized-raw development to it. Direct, spectral, and raw-
boundary cases prove exact in-range identity, analytic Rec.709 boundary clamp,
zero mutation of every earlier stage, monotonicity, and rejection of an
unfrozen operator. Run `000377` retains the failed runner assertion that
mistakenly classified intentional out-of-range clamp cases as in-range
identity. No appearance candidate was added.

`D7/T7` is implemented and accepted in verified immutable run
`000379-camera-color-model-d7-t7` (artifact set
`82262da32dedea97a18f41658643323e9b057e59b07fa4fce9dd2f1837d29fc5`).
The existing traced model boundaries required no fusion or replacement. One
focused runner qualifies all six registered interaction families using the
tracked Stage 1 source-Sun spectrum, CIE-derived WB profiles, independently
derived optical variants, and a separately authored equation evaluator.
Reciprocity, optical composition, exposure/gain ordering, clipped-Sun/WB
invariance, downstream isolation, direct composition, and public/trace parity
all pass.

`D8/T8` is implemented and accepted in verified immutable run
`000382-camera-color-model-d8-t8` (artifact set
`c2cf6efab91308d86e58d0a2123b2fb35fed85b46fb4406f77e90f085bbed275`).
The runner compiles eight complete derived profiles for sourced phone/DSLR
noon and sunset settings, OD 5 manual disk recovery, and three separate AEB
members. Each case reuses the accepted production wide native-15 field with
parent and packet hashes retained, performs a full prediction pass, and then
renders independently through the public model. No development look, HDR
merge, automatic exposure, glare, noise, or timelapse policy was added. Stage
8c.2 capture and composition mechanics through `D8/T8` are complete. The owner
inserted `D8.1/T8.1`: predict complete-profile results and choose the brightest
candidate satisfying explicit clipping and optional disk-visible or continuity
constraints. Noise, motion blur, depth of field, diffraction, camera-specific
JPEG processing, and lens artifacts are outside the application scope. Run
`000386` subsequently demonstrated that exposure calibration and the
development boundary must be qualified before a non-identity candidate can be
selected.

`D8.1/T8.1` is implemented and accepted in verified immutable run
`000384-camera-exposure-selection-d8-1-t8-1` (artifact set
`8b47a56b8eb9aa9f0dd13601fee7351a502e5c0f24258cb0d88789ff71317a39`).
`CameraExposureEvaluator` predicts every complete profile through the public
`CameraColorModel`, retains full-field raw/ADC/display clipping, brightness,
chroma, and named-sample diagnostics, and selects only from profiles satisfying
the declared application policy. Under the initial policy it selects the
`f/7.1`, `1/1000 s`, ISO 200 DSLR-settings profile at noon; the `f/5`,
`1/125 s`, ISO 200 DSLR-settings profile at sunset; and the baseline plus OD 5
profile for disk-visible noon. Manual selection is exact, a no-qualified result
has no fallback, and the optional EV continuity constraint passes. Aperture,
shutter, ISO, and ND are decisive capture controls: the exclusion applies only
to their secondary blur/depth/diffraction/noise behavior. The selector and its
rankings are accepted under the authored generic profiles, not as predictions
of the best real-camera settings.

`D8.2/T8.2` is accepted in verified immutable run
`000385-camera-exposure-selected-renders-d8-2-t8-2` (artifact set
`1c5f79f457b0aa5e243c77dc7594e0676f9cabab0705a1598bc793a45b396348`).
Normal noon, normal sunset, disk-visible, manual, and continuity selections
were regenerated through `CameraColorModel`. Every raw, ADC, display-high, and
mean-luminance result matches its D8.1 prediction, and each PNG is byte-identical
to D8's earlier rendering of the same complete profile. The no-qualified
control produces no fallback render. This accepts prediction-to-render parity,
not photographic calibration.

Setting-backed review run `000386-camera-wikimedia-noon-reproduction`
(artifact set
`1ab2e6b8e2d747be9b2c5205cdc8d81c436bae90ec08777f69b64433652ece8f`)
is the decisive boundary result. Its setting algebra and render execution are
valid, but its weak gray-blue field does not reproduce the reference's sky or
circumsolar appearance. The current profile maps ISO 102 to a relative
post-well gain while retaining authored generic pixel area, QE magnitude,
transmission, and full well; its identity-clamp path is also not a developed
camera image. Consequently absolute real-setting prediction, photographic
ranking, and `D9/T9` are suspended.

The project owner has declared the camera-emulation experiment a failure and
stopped it. `D8.3/T8.3`, `D9/T9`, `D10`, and all other camera continuation are
not active work. The following items are retained only as the unresolved
boundaries exposed by the failure:

1. choose and source one generic exposure calibration connecting scene
   radiometry, exposure index/ISO, sensor saturation, and normalized RAW;
2. preserve `D0`--`D8.2` control equations and ordering, treating the existing
   post-well gain proof as mechanics rather than an ISO calibration;
3. freeze a minimal, versioned camera-linear-to-developed-sRGB transform with
   independent numerical expectations rather than fitting one JPEG;
4. expose trace points for predevelopment camera RGB, calibrated normalized
   RAW, developed linear RGB, and encoded output; and
5. qualify representative noon and sunset sky chromaticity and luminance with
   analytic/chart evidence plus controlled clear-sky references.

Clouds, glare, point-spread enlargement, and lens artifacts remain separate
and do not reinterpret the failure. The production atmosphere spectra are not
reopened. Accepted `D0`--`D8.2` results retain only their narrow historical
mechanical claims and are not a camera-emulation candidate.

Runs `000380` and `000381` permanently retain failed containment starts: both
were stopped before spectral input by sandbox denial of Node-spawned
`git ls-files`. The accepted runner instead records matching pre/post SHA-256
inventories of the explicitly protected production surfaces plus its static
module closure. Broader Git-containment policy is deferred for separate work.

Runs `000364` and `000365` are permanently retained failed attempts. `000364`
was blocked by sandbox denial of the harness's read-only `git ls-files` tracked
protection inventory. `000365` completed the calculations but failed static
closure declaration because `node:child_process`, used by that same
containment check, was omitted from the runner's allowed-built-in list. Neither
failure changes the accepted `000366` result.

# Camera Spectral-Color Prior-Art Research

Status: historical research record. The camera-emulation experiment was
declared a failure and stopped by the project owner after run `000386`. This
record identifies software, equations, datasets, and reference implementations
that were evaluated for camera and passing-time Color modes. It authorizes no production
dependency, production implementation, redistribution, or license expansion.
Contained concept-proof acquisition is governed by the execution plan and
retains source, attribution, stated license, and derivation for later
productization review.

This document owns the evidence behind the camera spectral-to-color reuse
decision. The
[Sun Disk Appearance Design](sun-disk-appearance-design.md#spectral-to-camera-prior-art-and-reuse-boundary)
owns the architecture selected from that evidence. The
[Spectral Color-Transform Experiment Plan](spectral-color-transform-experiment-plan.md)
owns execution order.

## Question And Required Boundary

The question is whether prior software or published equations can translate
the project's absolute, unit-bearing spectral radiance into flexible ideal-eye
or physical-camera RGB without constructing an unnecessarily large runtime
pipeline.

The required camera boundary is broader than wavelength-to-RGB:

```text
absolute spectral radiance
  -> optical exposure and sensor spectral response
  -> sensor charge / raw channels
  -> noise floor and full-well clipping
  -> white balance and camera characterization
  -> fixed development and display conversion
```

A useful source must preserve wavelength coordinates and radiometric scale. A
library that normalizes every spectrum, stretches an unlabelled array over a
default wavelength interval, reconstructs pigment reflectance from RGB, or
starts only from display RGB cannot own this boundary.

## Repository Inventory

The repository has no installed general-purpose JavaScript spectral-color or
camera-simulation package. The contained experiment already has the narrower
pieces required for current proofs: the fixed Algorithm32 spectral basis,
official CIE tables, Bruneton's native-15 projection, CIECAM16 equations, RGB
matrices, and focused proof runners. None is presently a generic named-camera
profile system.

## Primary Architectural Reference: PBRT v4

PBRT v4's
[Film and Imaging / `PixelSensor`](https://pbr-book.org/4ed/Cameras_and_Film/Film_and_Imaging)
is the closest prior implementation to the desired architecture. It:

- projects spectral radiance through three selectable sensor-response curves;
- scales those responses by an imaging ratio;
- includes CIE-1931 and measured Canon, Nikon, Sony, and Hasselblad response
  profiles;
- projects color-chart reflectances through both the sensor and reference XYZ
  observer; and
- fits an over-constrained sensor-RGB-to-XYZ matrix by linear least squares.

PBRT then applies a matrix from sensor RGB to the requested output RGB space.
Its source and book demonstrate that changing the sensor can be a data/profile
change rather than a different rendering topology.

PBRT does not by itself supply the complete desired physical sensor. Its
`imagingRatio` combines shutter time and ISO while aperture is handled by the
camera model, and its `maxComponentValue` is a rendering clamp rather than a
measured electron full-well model. Read noise, dark signal, analog/digital
gain, ADC behavior, and a photographic development look require separate
definitions.

## Camera-Response Equations

The linear camera equation is well established. Buettner, Bobey, and
Schlichting's
[Spectral Sensitivity Estimation of Digital Cameras](https://library.imaging.org/admin/apis/public/api/ist/website/downloadArticle/cgiv/3/1/art00014)
expresses channel response as exposure time multiplied by the wavelength
integral of incoming spectral energy and channel sensitivity. Jiang et al.'s
[camera-sensitivity-space research](https://infoscience.epfl.ch/entities/publication/8e02e5df-5035-4803-a77c-e25da9e94446/conferencedetails)
uses the same relationship between scene radiance, camera spectral
sensitivity, and captured RGB.

For the fixed Algorithm32 bin-average spectral basis, the continuous integral
can be compiled offline:

```text
K[c,i] = integral over bin i of energyResponsivity[c](lambda)
raw[c] = exposureScale * sum over i of radiance[i] * K[c,i]
```

If the available profile is quantum efficiency, the physically relevant
electron estimate instead includes photon conversion:

```text
Kqe[c,i] = integral over bin i of
  opticalTransmission(lambda)
  * quantumEfficiency[c](lambda)
  * lambda / (h*c)

electrons[c] = shutterTime * opticalEtendue
  * sum over i of radiance[i] * Kqe[c,i]
```

The exact geometric factor depends on whether the input is radiance at the
camera, irradiance at the sensor, or another declared quantity. The profile
must declare whether its curve is quantum efficiency, energy responsivity, or
an arbitrary relative matching function so `lambda/(h*c)` is neither omitted
nor applied twice.

This compiles every observer or camera to three fixed 15-term dot products.
It does not require a general spectral library in the frame loop.

## Physical Sensor Limits: EMVA 1288

[EMVA 1288](https://www.emva.org/standards-technology/emva-1288/emva-standard-1288-downloads-2/)
is the strongest reviewed authority for separating photon exposure, quantum
efficiency, system gain, temporal dark/read noise, saturation, and related
sensor measurements. These quantities surround the linear spectral response;
they do not belong in the fitted camera-to-XYZ matrix.

The first reasonable generic camera need not reproduce every EMVA measurement,
but its profile must keep at least these concepts separate:

- optical exposure and photon-to-electron conversion;
- black/read-noise floor;
- per-channel or shared saturation/full-well limit;
- analog/digital gain or ISO behavior; and
- raw clipping versus later display clipping.

## RAW-to-ACES Method And Data

The Academy Software Foundation's
[rawtoaces](https://github.com/AcademySoftwareFoundation/rawtoaces) prefers
camera spectral sensitivities and illuminant SPDs when those measurements are
available. It derives white-balance factors and a camera-to-ACES transform,
falling back to camera metadata or LibRaw matrices when spectral data is not
available.

The separate
[rawtoaces-data](https://github.com/AcademySoftwareFoundation/rawtoaces-data)
repository contains camera response curves, illuminants, CIE-1931 functions,
and training patches. Its schema is unit-aware and uses a `380-780 nm`, `5 nm`
shape. The repository is Apache-2.0, while each spectral record also carries a
required license field. Concept proofs may use an acquired record when its
exact source, attribution, stated license, and derivation are retained.
Record-level redistribution and production-use clearance are deferred to
productization and do not gate Stage 8a.

The method and schema are directly useful. Higher-resolution response curves
can be integrated conservatively over the existing Algorithm32 bin boundaries
offline and stored with source, basis, numerical, and license fingerprints.

## Software Candidate Assessment

### CIE-JS

[CIE-JS](https://www.gerardharbers.com/cie_book/preface/) is a spectral-first
Rust/WebAssembly library exposed to JavaScript. Its public documentation shows
configurable observers, spectral color representations, and display models.
It is the closest browser-oriented library conceptually.

It is not yet an accepted dependency. Before concept-proof reuse, establish a
pinned source repository and release, offline build/availability, absolute-unit
behavior, wavelength resampling rules, deterministic outputs, and agreement
with the project's official tables; retain any stated license for later
productization review. Importing an unversioned remote WebAssembly module is
not acceptable for production or immutable evidence.

### jsColorEngine

[jsColorEngine](https://github.com/glennwilton/jsColorEngine) is an MPL-2.0,
pure-JavaScript ICC engine with optional WebAssembly kernels. It supports ICC
profiles, float and baked-LUT paths, custom pipeline stages, standard observers,
and spectral utilities for measurement workflows.

It is promising after sensor RGB or XYZ for independent ICC/display testing
and possibly for offline LUT construction. Its documented spectral conversion
focus is reflectance/transmittance under a selected illuminant, not absolute
emitted radiance passed through a physical sensor. That path must be audited
before using it at the spectral boundary. Its performance and accuracy claims
are project claims and require local independent reproduction.

### Colour

[Colour](https://github.com/colour-science/colour) is Python, not a runtime
JavaScript option, but it is the strongest broad reference implementation found.
It provides spectral distributions and alignment, standard observers,
spectral-to-XYZ integration, camera characterization, chromatic adaptation,
RGB spaces, appearance models, and extensive tests.

Use Colour as the primary offline numerical oracle for profile construction.
It must remain independent of the project implementation it verifies and does
not belong in the runtime shader.

### Color.js

[Color.js](https://colorjs.io/docs/) is useful after the spectrum has already
become XYZ or RGB. It supplies broad color-space conversion, chromatic
adaptation, gamut mapping, and modern display-space support. It does not supply
the required absolute spectral sensor integration, physical exposure, or
full-well behavior. Its existing use as independent CAM16 algebra does not
expand its role into camera capture.

### color-spectrum

The npm package
[color-spectrum](https://www.npmjs.com/package/color-spectrum) exposes a
`380-780 nm`, `5 nm` CIE-1931 table and generic spectrum/wavelength-to-XYZ/RGB
helpers. Its documented defaults normalize the input and stretch the supplied
list across its assumed visible range. Both behaviors conflict with the
project's absolute radiance and explicit fixed-bin contract.

It may serve as a small independent diagnostic only if normalization is
disabled and wavelength/bin interpretation is explicitly reconciled. It is not
a camera model and must not become the primary oracle.

### Spectral.js

[Spectral.js](https://github.com/rvanwijnen/spectral.js/) reconstructs spectral
reflectance from display RGB and applies Kubelka-Munk pigment mixing. It then
converts the resulting reflectance under D65 to XYZ. That is a materially
different inverse/pigment problem. It is unsuitable for transported
atmospheric radiance, absolute exposure, or camera capture.

## Reuse Finding

No reviewed package should own the complete runtime pipeline. The smallest
justified reuse strategy is:

1. adapt PBRT/rawtoaces profile construction and characterization equations;
2. obtain or author a unit-declared sensor-response profile, retaining its
   source, attribution, and stated license for later productization review;
3. integrate it offline into the exact 15-bin basis;
4. fit or import a qualified `3 x 3` camera-to-XYZ/working-space matrix;
5. validate both matrices against Colour and at least one independent
   implementation or published vector;
6. keep exposure, photon conversion, noise/full-well clipping, white balance,
   development, and display encoding as visible separate contracts; and
7. execute only the compiled matrices and bounded scalar operations at runtime.

Every retained evidence product must be derivable rather than merely
attributable. Its record identifies and hashes the parent data, states the
equation or operation and numerical method, identifies the implementation and
tool versions, records all material parameters, and identifies the resulting
artifact. This applies equally to acquired response curves, resampled profiles,
fitted matrices, Colour oracle values, comparisons, and rendered outputs.
Derivation records qualify evidence; they do not restrict reuse of preserved
artifacts.

An ICC library or baked LUT may later implement the post-capture display path.
It may not normalize the spectral input, hide raw clipping, or infer physical
exposure from a pleasing image.

## Stage 8a Qualification Result

Immutable run `000358-camera-relative-projection-stage8a` (artifact set
`69607f8d1a9339f6cc9d69a0c568cba85bd41ec25e80e55e66b2906d55b9d249`)
accepts the relative projection concept. The proof retained the fetched PBRT
source and Apache-2.0 license, extracted Canon EOS 5D Mark IV relative response
arrays, the exact source production-packet identities and hashes, equations,
fixture and implementation hashes, tool versions, matrices, oracle results,
full-field diagnostics, and the resulting artifact identity.

The frozen configuration is PBRT relative response, D55 sensor
characterization, D65 linear Rec.709 output, Colour 0.4.6 with ColorChecker N
Ohta, eighteen fixed training patches, and six fixed held-out patches. Colour
and JavaScript agree on the compiled `3 x 15` camera weights within
`5.557567351869024e-16` relative and on the fitted `3 x 3` matrix within
`7.993605777301127e-14` absolute. Held-out mean and maximum Delta E 2000 are
`0.7508652161238495` and `1.3858401494799768`. All `2,056,328` focused
and wide production pixels projected finitely; zero and linear-scaling gates
passed; and the raw sunset/noon disk-center red-to-blue ratio increased by
`6.211529447797385`. Post-run verification accepted all seventeen artifacts
and reproduced the artifact-set identity.

This result confirms the PBRT-style offline compilation and runtime dot-product
architecture for relative camera color. It does not convert PBRT's arbitrary
relative response into quantum efficiency or justify electrons, noise,
full-well capacity, ISO/ADC behavior, or physical named-camera exposure.

## Stage 8b Fixed-Exposure Result

Immutable run `000359-camera-fixed-exposure-stage8b` (artifact set
`279c374cc5d3396603c31a29d281e84fc8b0bcd5602e7f238015abeed75ba7d3`)
technically qualifies the relative-camera output for project-owner review. It
reuses the exact Stage 8a profile and hashed production spectra, derives one
exposure anchor from the complete wide noon field, and applies the same
`[-4, -2, 0, +2]` bracket to all four times and both views. Its derivation
record identifies every source packet, matrix, equation, code and fixture
hash, parameter, intermediate sample, render, and result identity.

The proof deliberately leaves relative sensor raw unclipped. A physical raw
ceiling cannot be inferred from PBRT's arbitrarily scaled response without
inventing Stage 8c sensor data. Final Rec.709 boundary clipping is reported
independently. The 32 renders preserve strong pre-clip noon-to-sunset
chromatic separation and contain no exact-white pixels, while showing that
single-exposure highlight loss varies materially with clock condition. This
validates the separation between relative camera color, display clipping, and
later physical full-well behavior; it does not qualify a physical camera body.

## Qualitative Sunrise Video Reference

The project owner supplied
[this sunrise video](https://www.youtube.com/watch?v=mT_bZm-lkmM) and three
frame observations as qualitative camera evidence:

- around `32:15`, the Sun is at the horizon and a small bright source region
  remains distinguishable amid an orange horizon glow;
- around `42 minutes`, the source has become a large white/yellow clipped or
  bloomed region with no clearly resolved disk boundary; and
- around `1:02`, the elevated source remains a large white clipped/bloomed
  region with no clearly resolved disk boundary.

The supplied frames also retain a darker foreground and ocean while the
source highlight expands, which is qualitatively consistent with a camera
sacrificing direct-Sun detail to retain useful scene exposure. This is not
evidence for a particular clipping threshold, exposure schedule, tone curve,
or optical point-spread function.

The YouTube description identifies the recording camera as the **Sony RX10
II/M2**, says the video was shot in **4K** at Belmar, New Jersey on a November
morning, and states that audio was recorded separately with a Tascam DR-05.
The page does not state the focal length, aperture, shutter, ISO/gain,
white-balance setting, picture profile/transfer function, exposure mode,
metering mode, or whether exposure changed during the 71:57 recording.
Indexed photographer posts for the same sunrise additionally state
**Fotodiox WonderPana System 1000x ND filter**. Because that filter statement
comes from a related still-image caption rather than the YouTube description,
treat it as strong same-session context rather than proven continuous-video
configuration.

Treat the timestamps and appearance descriptions as owner-supplied
observations. Do not fit Stage 8b or Stage 8c parameters to this example. Its
legitimate use is to reject the assumption that a convincing passing-time
camera mode must preserve a visibly bounded solar disk at every daylight
elevation.

The project owner subsequently supplied two additional high-Sun video-frame
references with no source URL or camera metadata; the second is visibly
watermarked Adobe Stock. Both show a saturated blue sky, clipped white solar
core with no recoverable disk boundary, veiling glow, strong radial
diffraction/starburst rays, and colored lens ghosts. In the owner's comparison,
their gross scene exposure again favors the Stage 8b `EV +2` row. Treat the
white-core size and overall sky exposure as qualitative camera-presentation
evidence. Do not ask the spectral Color transform to reproduce the radial
rays, ghosts, or spatial glow: those are optics/sensor/display-spread phenomena
requiring an explicit glare/point-spread stage or an application overlay. With
no settings or source identity, these frames cannot calibrate exposure or
optical kernel parameters.

Because the two independent high-Sun captures show similar deep-blue sky
appearance despite their unknown origins, the project owner accepts them as a
paired **subjective sky-color reference**. They establish a qualitative
relationship rather than an RGB target: at useful bright-scene exposure, the
sky should remain materially more saturated blue than the current Stage 8b
`EV +2` output even while the direct Sun is clipped and spatial glare is
present. Their agreement raises confidence in that relationship, but unknown
white balance, picture profiles, compression, display capture, atmosphere, and
optics prohibit pixel matching or parameter derivation.

### Sourced Noon Still With EXIF

The owner supplied Wikimedia Commons'
[Sun at noon](https://commons.wikimedia.org/wiki/File:Sun_at_noon.jpg), an
original `2576 x 1932` sRGB JPEG dated 2020-08-24 11:38 and licensed
CC BY-SA 4.0. Its retained EXIF records:

- Samsung Galaxy M01 / `SM-M015G`;
- `ISO 102`;
- `f/2.2`;
- `1/6444 s`;
- `2.26 mm` physical focal length;
- auto exposure with average metering;
- auto white balance; and
- flash suppressed.

The aperture, shutter, and ISO correspond to approximately `EV100 14.9`.
Despite that very short daylight exposure, the original shows a deep blue sky
and a completely clipped, spatially enlarged white Sun region with colored
flare; the disk boundary is unrecoverable. Clouds materially affect the field,
and the JPEG includes the phone's undisclosed development, so it is not a
pixel target for the clear Algorithm32 scene. It is nevertheless stronger than
the metadata-free screenshots: it demonstrates with recorded settings that a
usefully exposed, saturated blue daylight sky can coexist with total direct-Sun
clipping. It supports the paired subjective sky-color relationship and the
separation of capture/development from optical glare. It cannot map Stage 8b's
relative `EV +2` to physical EV because the PBRT response still lacks
absolute sensor scale.

### Generic-phone parameter evidence and Stage 8c result

The first physical proof intentionally uses a broad authored envelope instead
of pretending that undisclosed Galaxy M01 sensor specifications are known.
The envelope is grounded by independent precedents:

- [EMVA 1288 Release 3.0](https://www.emva.org/wp-content/uploads/EMVA1288-3.0.pdf)
  defines wavelength-dependent quantum efficiency, electron saturation
  capacity, and noise as distinct measured quantities.
- [Raspberry Pi camera documentation](https://www.raspberrypi.com/documentation/accessories/camera.html)
  identifies the Sony IMX219 precedent at `1.12 x 1.12 um` pixels. This is a
  sourced small-pixel scale, not evidence about the Galaxy M01 sensor.
- Sun et al.,
  [Full well capacity and quantum efficiency optimization for small size BSI CMOS image pixels](https://www.jos.ac.cn/article/doi/10.1088/1674-4926/33/12/124006),
  reports simulated small-pixel full-well examples from `1,289 e-` to
  `6,390 e-`.
- Farrell et al.,
  [Digital camera simulation](https://opg.optica.org/ao/abstract.cfm?uri=ao-51-4-a80),
  demonstrates a physical-camera simulation with measured spectral QE,
  `2.2 um` pixels, and a manufacturer-specified `9,000 e-` well.
- PBRT's
  [realistic-camera radiometry](https://www.pbr-book.org/3ed-2018/Camera_Models/Realistic_Cameras)
  supports converting incoming scene radiance to sensor-plane irradiance.

The authored nominal profile uses `1.12 um` pitch, `50%` peak QE, `70%`
optical transmission, and `5,000 e-` full well. The proof sweeps pitches
`[0.8, 1.12, 1.4] um`, peak QE `[0.3, 0.5, 0.7]`, transmission
`[0.5, 0.7, 0.9]`, and full well `[1,300, 5,000, 9,000] e-`. PBRT's accepted
Canon response supplies only the overlapping response shapes; global
normalization plus authored QE amplitude explicitly prevent a Canon or phone
sensor claim.

Immutable run `000363-camera-generic-phone-stage8c` (artifact set
`06c581d4802ffc2598a76147edac62db0c4b93e2c3c954d562f8159a71242829`)
accepts the physical relationship. With `f/2.2` and `1/6444 s`, nominal
disk-center photoelectrons are about `34.9M`, `64.7M`, and `41.0M`, or
`6,972x`, `12,932x`, and `8,194x` a `5,000 e-` well. Upper-quarter sky is
only `3.05%`, `6.74%`, and `5.09%` of full well; top-center sky is `1.35%`,
`3.27%`, and `2.70%`. All `81/81` envelope combinations retain the same
Sun-clipped/sky-unclipped relationship. The source can therefore be
unrecoverable at raw capture while useful sky remains available.

The no-tone-curve diagnostic remains dark and weakly blue. That is localized
to post-capture development rather than missing physical exposure scale. Fixed
D55 white balance is derived from the same QE profile and applied after raw
clipping; fully saturated raw `[1,1,1]` then maps to near-white sRGB. The next
question is the smallest fixed standard development operator that raises and
shapes the sky without changing capture, adding a Sun-specific branch, or
adding deferred glare.

## T5 Colorimetric Prerequisite Research Result

The immediate source and method research is complete. It changes the proposed
characterization corpus, but it does not invalidate the earlier Stage 8a
PBRT/Colour parity proof or the accepted Stage 8c physical-capture proof.
Those remain evidence for their narrower claims.

### Selected source set

The primary relative camera profile is the Academy Software Foundation
[rawtoaces-data Canon EOS 5D Mark IV profile](https://github.com/AcademySoftwareFoundation/rawtoaces-data/blob/e9b8503cf8a0641f40e5345d9757bde60c15f423/data/camera/Canon_EOS_5D_Mark_IV_380_780_5.json).
Its own header identifies relative R/G/B response, `380--780 nm` at 5 nm,
Weta Digital authorship, `lightsaber` measurement equipment, and Apache-2.0.
The repository state inspected for this decision is commit
`e9b8503cf8a0641f40e5345d9757bde60c15f423`. Because the values are relative
effective responses rather than absolute quantum efficiency, they support
color ratios and characterization but not electron-count or named-camera
saturation claims. The acquired profile bytes have SHA-256
`c3d5bc6a271fa2d0270386e27aa5dcf258c64223322a1730b03815497375be29`.

The fit set is rawtoaces-data's
[190-patch training spectrum set](https://github.com/AcademySoftwareFoundation/rawtoaces-data/blob/e9b8503cf8a0641f40e5345d9757bde60c15f423/data/training/training_spectral.json),
also `380--780 nm` at 5 nm and Apache-2.0. Using this dedicated fit set permits
all 24 `ColorChecker N Ohta` patches in pinned Colour 0.4.6 to remain an
independent validation chart. Colour's dataset source states that these Ohta
(1997) reflectances are identical to the ISO 17321-1:2012 values. This is
stronger than the former provisional 18-training/6-held-out split, because no
ColorChecker patch now influences the matrix it evaluates. The acquired
training file has SHA-256
`1b63cc85f7cf521bf80450fc60172a424a551cc690fdb05313b2cfa7aaa66da1`;
the retained rawtoaces-data license has SHA-256
`c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4`.
The inspected Colour dataset module has SHA-256
`fca45b3c8c3644f361755b56bce1358c4f61737c6a2073603535acdc3233d80d`.

The observer and illuminant sources are official CIE datasets:

- [CIE 1931 2-degree observer](https://cie.co.at/datatable/cie-1931-colour-matching-functions-2-degree-observer),
  DOI `10.25039/CIE.DS.xvudnb9b`, acquired MD5
  `17cca777db64b17170f06f67ce9d3ab7`;
- [Illuminant D55](https://cie.co.at/datatable/relative-spectral-power-distributions-cie-illuminant-d55),
  DOI `10.25039/CIE.DS.qewfb3kp`, MD5
  `8b5678358f265567a0759b9800f17d7f`;
- [Illuminant D65](https://cie.co.at/datatable/cie-standard-illuminant-d65),
  DOI `10.25039/CIE.DS.hjfjmt59`, MD5
  `03d4eb9b837c60671627c946fb534deb`; and
- [Illuminant D75](https://cie.co.at/datatable/relative-spectral-power-distributions-cie-illuminant-d75),
  DOI `10.25039/CIE.DS.9fvcmrk4`, MD5
  `fc2ae36ece39ad1729696ab2833bd013`.

Each acquired hash matches the value advertised on its CIE page. Illuminant A
is not yet accepted: the [official A dataset page](https://cie.co.at/datatable/cie-standard-illuminant-1-nm)
advertises MD5 `6c33a1c3caff2d774f0f2025f3001a56`, but the CSV currently
served by that page's own download link hashes to
`ed0e4effb55d82b950c0912b6278a9d1`. This is an
upstream provenance inconsistency. The initial D55/D65/D75 proof does not need
A, so A is excluded rather than replaced with an unverified copy.

PBRT remains a valuable architectural and implementation comparison. Its
retained `spectrum.cpp` source and Apache-2.0 license already identify the
Canon EOS 5D Mark IV curves as arbitrary-scale relative spectral
energy-response matching functions. The direct rawtoaces-data profile is now
preferred as the primary dataset because it retains its own structured
identity and measurement metadata.

### Frozen oracle method

The reference operates on the inclusive `380--780 nm` overlap. Sources are
linearly resampled to 1 nm without extrapolation. With surface reflectance
`R`, illuminant `E`, camera channel response `S_c`, and CIE matching function
`xbar_j`, it computes:

```text
C_c(R,E) = integral R(lambda) E(lambda) S_c(lambda) d lambda
W_c(E)   = integral E(lambda) S_c(lambda) d lambda
Cwb_c    = C_c / W_c

k(E)     = 1 / integral E(lambda) ybar(lambda) d lambda
XYZ_j    = k(E) integral R(lambda) E(lambda) xbar_j(lambda) d lambda
```

There is no `lambda/(h c)` factor in this relative response calculation. Such
a factor belongs in the separately declared quantum-efficiency photon model;
adding it here would reinterpret an energy-response dataset and double-count
conversion already folded into that response.

The initial profile fits one unconstrained `3 x 3` ordinary least-squares
matrix from the 190 D55 white-balanced camera rows to D65-referred target
tristimuli. A perfect diffuser defines per-channel WB. All Ohta patches are
then independent D55 validation, and D65/D75 are untouched cross-illuminant
checks. One common scalar per illuminated chart is permitted; no patch may be
independently normalized. No clipping, development, tone curve, gamut map, or
display encoding participates.

The camera response, 190-patch reflectances, and Ohta chart are tabulated at
5 nm. The 1 nm path is therefore a numerical integration oracle over their
pinned piecewise-linear interpolation, not a claim that the underlying
measurements resolve 1 nm spectral features. It can measure added native-15
reduction error; it cannot recover spectral structure absent from the sources.

The 1 nm reference and native-15 representation must be evaluated as separate
paths through the same corpus. Report sensor-channel residual, matrix
residual, and the incremental native-15 color error separately. Pinned Colour
0.4.6 is a cross-check, while a contained independent runner owns expected
values so `CameraColorModel` cannot grade itself.

The pinned cross-check environment is Python `3.10.1`, Colour `0.4.6`, and
NumPy `2.2.6`. These versions and hashes describe how the research result was
derived; the later immutable run must retain them again with its executable
outputs.

[CIEDE2000](https://www.cie.co.at/publications/colorimetry-part-6-ciede2000-colour-difference-formula-1)
with `kL = kC = kH = 1` is retained as a diagnostic after both predictions are
expressed in Lab under the same D65 reference. CIE describes it as an
approximate relative magnitude, not a universal just-noticeable-difference or
pass boundary. The former provisional `approximately 1 DeltaE00` gate is
therefore withdrawn. A project acceptance budget may be selected only after
the independent error distribution is measured and must be labelled as an
authored engineering criterion.

### Prerequisite execution result

Verified immutable run `000373-camera-t5-colorimetric-prerequisite` (artifact
set `8249584487fa29fc8d819792188c8df5ec2ed56aaeb4fb720f7d69b1895531f1`)
materializes the exact selected bytes, licenses, URLs, commit/DOI identities,
hashes, tool versions, equations, independent oracle, common-scale corpus, and
per-patch results. Its 190-row D55 least-squares fit is rank 3. All 24 Ohta
patches remain independent under each of D55, D65, and D75, producing 72
validation cases; perfect-diffuser WB error is exactly zero in both paths.

Across the combined validation set, the 1 nm numerical path has mean/maximum
target `DeltaE00` `1.1263537242 / 3.1943921125`; native-15 has
`1.3518946099 / 3.0396253605`. The direct native-15-versus-1 nm difference is
mean/p95/maximum `0.7444356038 / 1.2774968035 / 2.3446275440`. Target XYZ RMSE
changes from `0.0088872737` to `0.0092759775`. Native-15 therefore introduces
a bounded, nonzero approximation smaller on average than the underlying
matrix-to-target error; the data do not justify calling it invisible in every
patch or declaring a universal perceptual threshold. This is adequate evidence
to proceed with the generic relative-color concept while retaining the exact
loss distribution for review.

Run `000372` is permanently retained as a failed environment-only attempt:
the sandbox denied the harness's read-only tracked-file inventory before the
oracle ran. It does not change the accepted calculation. Empirical linear RAW
captures and absolute sensor quantities remain necessary only for a named-
camera physical claim. Illuminant A remains excluded pending reconciliation of
the official checksum conflict.

The exact source-to-test mapping for the next control proof is canonical in
[Camera-Control Test Inventory](camera-control-test-inventory.md). It includes
retained noon and sunset EXIF examples, official camera-control and bracketing
manuals, CIE illuminants, EMVA sensor quantities, published sensor envelopes,
and the distinction between sourced observations, equation-derived validation
levels, and authored diagnostics. Do not duplicate those test values here.

## Remaining Qualification Work

The generic physical-capture relationship is qualified, but the accepted D3
ColorChecker-derived spectra are saturation stress data rather than a
colorimetric chart exposure: each patch was independently scaled to `75%` of
nominal full well. They cannot validate chart-relative lightness, white
balance, a characterization matrix, or camera-color accuracy.

The live, dependency-ordered research and acquisition backlog is canonical in
[Camera Controls Testing Plan](camera-controls-testing-plan.md#outstanding-research-and-data-acquisition).
In summary, remaining work is:

- materialize the now-selected rawtoaces 190-patch training set, Canon relative
  response, Ohta validation chart, and official CIE D55/D65/D75/observer bytes
  with source, hash, and license identity in immutable evidence;
- implement the frozen independent 1 nm sensor/XYZ/WB/matrix oracle and measure
  the information loss introduced by the native-15 basis;
- fit only the 190 D55 training reflectances and regenerate the independent
  24-patch Ohta D55 plus D65/D75 cases with one common scale per illuminant;
- reconcile the official Illuminant A checksum conflict before using A as
  qualification evidence;
- select a sourced fixed development operator and preserve raw capture as an
  unchanged control;
- qualify sky luminance ordering, chromaticity/colorfulness, highlight
  behavior, and temporal suitability before automatic exposure is introduced;
- retain raw-channel saturation separately from development and display
  clipping;
- benchmark the eventual compiled CPU and GPU paths; and
- obtain measured spectral sensitivity plus repeated black-subtracted linear
  RAW chart captures and actual QE, full-well, gain, noise, black level, ADC,
  optical, and development data before making any physical named-camera claim.

PBRT's Canon relative profile and Colour remain accepted Stage 8a
source/oracle inputs, not runtime dependencies and not physical sensor-scale
authorities. The pinned rawtoaces-data Canon response and 190-patch set are now
the selected T5 characterization sources once materialized in immutable run
evidence. CIE-JS and jsColorEngine remain references or future evaluation
candidates.

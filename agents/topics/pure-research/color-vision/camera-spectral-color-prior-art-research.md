# Camera Spectral-Color Prior-Art Research

Focus: Colorimetry, perception, adaptation, and camera premises.

Related owners: [sources-provenance](../sources-provenance/camera-spectral-color-prior-art-research.md).

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

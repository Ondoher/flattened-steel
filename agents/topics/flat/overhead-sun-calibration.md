# Overhead Sun calibration assessment

Status: deferred by the owner on 2026-11-09 after read-only feasibility checks.
Leave the existing source calibration and rendering behavior unchanged. The
intended target and assessment remain available for a later owner-selected task.

The [public model explanation](../../../README.md#basic-flat-model-assumptions)
owns the target: local solar noon at the subsolar latitude, Sun overhead in
both models, matched viewing/ground/atmosphere/display conditions, and matched
ground-level sunlight spectrum. Disc size is explicitly excluded for now.
This note owns the preliminary engineering assessment, not an execution plan.

## Quick follow-up: match the spectrum above the atmosphere

Consider an alternative reference condition: with the Sun overhead, match the
incoming spectral irradiance immediately above each model's atmosphere, then
let its transport calculation determine the ground-level result. This is a
saved option for investigation, not a replacement of the recorded ground-level
target or authorization to implement a change.

Both sources already use the same reference spectral shape. For this option,
normalize the local Sun's inverse-square distance scale at atmosphere entry;
no wavelength-specific atmospheric compensation is needed. With the current
geometry, the overhead reference distance is **4,728.032 km**: Sun height
4,828.032 km minus atmosphere height 100 km. Ground-level brightness and color
may then differ as predictions of the respective atmosphere/transport models.
Disc size remains excluded. Calibration changes remain deferred.

## Existing support and remaining work

`LocalSunLightSource` already accepts a spectral source packet and a reference
incident scale. `LocalSunCompactProfileSelection` currently supplies a scale
of one at a 4,800 km reference distance for a Sun 4,828.032 km above the plane.
A calibrated source can therefore enter the existing physical pipeline.
The compact construction identity already includes source spectrum and scale;
changed calibration requires a newly prepared compatible Flat cache. Preserve
existing cache/evidence bytes and let startup preparation use the new identity.

Before deriving correction factors, compare converged receiver measurements
with the actual CPU/GPU paths used by the app. The default CPU source-path
quadrature is too coarse to use blindly as calibration authority. A per-channel
ratio of distant/local overhead direct sunlight is a possible calibration
operation after that consistency check. Derive/reuse it for the selected
source/atmosphere configuration, not for every time or camera update.

Verification needs the matched overhead spectra, live ground-lighting and Sun
render paths, and retained time/elevation behavior away from the calibration
condition. Equal total diffuse sky illumination or identical whole-sky pixels
are not established by matching direct sunlight. With unequal disc sizes,
matching integrated sunlight at the receiver also does not by itself establish
equal radiance per pixel of the visible Sun.

## Preliminary CPU diagnostic

The probe used existing public geometry/source/receiver APIs, canonical
atmosphere, ground-level observers (0 m), and
`2026-11-09T20:00:00.000Z` at its computed subsolar location
(-16.6522024223 degrees, -123.9991708333 degrees). Both source-center upward
cosines were one. Direct-normal and horizontal sunlight coincide at zenith.
The probe created local instances only; it did not build a GPU cache or change
application source. Lux is the photopic integral of the measured spectrum.

| CPU path intervals | Flat direct sunlight (lux) | Globe direct sunlight (lux) | Per-channel distant/local ratio range |
| --- | ---: | ---: | --- |
| Each geometry's default | 89,101.602 | 100,925.660 | 1.094769–1.215501 |
| 64 for each | 109,558.652 | 111,491.045 | 1.015936–1.020770 |
| 256 for each | 110,497.557 | 111,840.278 | 1.011998–1.012555 |
| 1,024 for each | 110,558.085 | 111,862.354 | 1.011744–1.012026 |
| 4,096 for each | 110,561.876 | 111,863.735 | 1.011728–1.011993 |

These are internal feasibility diagnostics, not independent scientific
qualification, GPU measurements, or final calibration coefficients. The
sampling sensitivity must be resolved before claiming an overhead match.

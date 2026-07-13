# Sunset-Disk Reference Summary

Status: supporting research for diagnosing the weak or disappearing local and
distant Sun disk near the horizon. The physical transport/display diagnosis is
bounded but not closed: retained production-resolution evidence shows large,
smoothly warming direct-disk attenuation, and sampled inputs demonstrate the
current channel-wise mapper's white plateau. Hardware-GPU run `000242` adds a
separate established Flat/local raster defect: the intended wide view's four
quarter-pixel rays can all miss a finite disk that overlaps the pixel. One exact
screen-space conic-overlap candidate is now the required proof before the
canonical normal-path disk/sky ledger. The automatic-exposure candidate is
rejected and disconnected. ACES 2 remains the one selected display reference,
subject first to the raster proof, corrected GPU ledger, bounded reference, and
faithful-GLSL gates, then GPU-only visual review; CPU/reference/refined and
paired CPU/GPU work is reserved for final verification. These sources inform
diagnostics; none is presently a calibration oracle for Algorithm32.

Design synthesis: [Sun-disk appearance design](sun-disk-appearance-design.md).

## Acceptance Standard

Solar-disk rendering is an aesthetic feature rather than part of the validated
atmospheric comparison claim. Its target is the most realistic appearance that
can be achieved with physically motivated, stable, and affordable behavior; it
does not require the atmosphere's numerical level of proof or absolute
photometric calibration.

This relaxed evidence standard does not permit the disk feature to degrade or
silently change the validated atmospheric algorithm. Disk geometry, spectral
attenuation, horizon behavior, exposure, and glare should remain physically
plausible and consistent between local and distant sources wherever they model
the same phenomenon. Perceptual approximations such as tone mapping or glare are
acceptable when their ownership and claim limits are explicit. Any proposed
change to atmospheric transport still requires the atmosphere's existing
comparison and regression gates.

## Sources And Lessons

### [Taking Pictures of the Sun](https://lyncean.education/projects/astronomy/solar-photography/)

This is an educational photography account, not a calibrated radiometric study.
It demonstrates that an ordinary exposure turns the Sun into a broad glare patch,
while a strong solar filter reveals the disk but makes the surrounding scene
black. Its sunrise and sunset sequences combine separately exposed and stacked
images. Use it as evidence of the scene's extreme dynamic range, not as a disk,
sky, color, or glare reference.

### [A Novel Automatic White Balance Method for Color Constancy Under Different Color Temperatures](https://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=9509540)

The linked sunrise-to-sunset figure illustrates changing color temperature and
the effect of white-balance correction. The publication does not establish the
figure as a calibrated measurement sequence with controlled exposure and camera
response. It supports the general expectation that low-Sun illumination becomes
warmer, but its images cannot validate disk visibility, luminance, or disk-to-sky
contrast. The [ResearchGate figure](https://www.researchgate.net/figure/Color-temperature-changes-at-various-times-from-sunrise-to-sunset-a-Original-images_fig1_353781295)
is the same evidence, not an independent source.

### [Realistic Solar Disc Rendering](https://naos-be.zcu.cz/server/api/core/bitstreams/59c50f89-7916-4475-ae3b-dbd0e8d63a8f/content)

This method models a spectral solar disk with limb darkening, layered atmospheric
extinction, aerosol properties, refraction, dispersion, and temperature-dependent
mirages. For a disk ray, it replaces ordinary aerosol extinction with a reduced
`(1 - g)` term because strongly forward-scattered aerosol light remains close to
the apparent source direction. This supports testing whether production's full
Mie extinction makes the disk too dim after a long near-horizon path.

The published approximation must not be copied literally: it reduces total
aerosol extinction, including absorption, although absorbed light cannot remain
in the apparent disk. A defensible test must preserve aerosol absorption and
reduce only the scattering excluded from a defined angular acceptance region.
The paper also uses a simple luminance gamma transform and identifies calibrated
photographic validation and proper HDR tone mapping as future work, so its
rendered pictures are not appearance or luminance oracles.

### _Realistic Rendering and Reconstruction of Astronomical Objects and an Augmented Reality Application for Astronomy_

The user-supplied 2007 Andrei Lintu dissertation contains the preceding solar-disk
method as Chapter 4; it is expanded documentation, not independent confirmation.
It specifies a 35 km layered atmosphere, OPAC climate and humidity aerosol data,
eight wavelengths from 380--720 nm, typically 300--30,000 layers, atmospheric
refraction and dispersion, and the same reduced-aerosol-extinction equation. It
reinforces both the forward-scattering hypothesis and the method's limitations.

### [Influence of color on glare perception revealed when seeing the sun through colored glazing](https://www.nature.com/articles/s41598-025-21737-5.pdf)

This is calibrated evidence about solar glare and HDR capture, but it observes
the Sun through colored glazing rather than validating an unfiltered sunset.
Neutral glazing transmitted about 0.38% or 2.37% while measured mean disk
luminance remained approximately 3.41 or 25.8 million cd/m2, respectively. The
HDR camera required a neutral-density factor of 3134.8 to avoid pixel overflow;
the spectroradiometer used a factor of 755.7 and a 1-degree aperture around the
approximately 0.533-degree disk.

This establishes that the visible Sun is an extreme-HDR source and that display
saturation can erase disk-to-sky contrast even when raw transport is strong. It
also finds color-dependent perceived glare at similar photometric luminance, so
white clipping or generic bloom is not a complete perceptual model. Because the
Sun was filtered and the experiments were not a controlled horizon sequence,
the reported luminances are sanity evidence rather than a sunset oracle.

## Human Visual Adaptation And Solar Appearance

No reviewed source provides a calibrated universal curve for the perceived Sun
disk as a function of solar elevation. The available vision research instead
supports composing three mechanisms: physical atmospheric attenuation, visual
adaptation to the surrounding field, and intraocular glare.

The pupil is only a limited exposure control. Natural-vision measurements report
approximately 2--8 mm pupil diameters, corresponding to about a 16-fold change in
retinal illuminance. Most of the visual system's much larger operating range
comes from photoreceptor and retinal or neural adaptation to background
luminance and contrast:

- [Regulation of pupil size in natural vision across the human lifespan](https://pmc.ncbi.nlm.nih.gov/articles/PMC11295891/)
- [Functional Circuitry of the Retina](https://pmc.ncbi.nlm.nih.gov/articles/PMC5749398/)
- [Adaptation and visual coding](https://pmc.ncbi.nlm.nih.gov/articles/PMC3245980/)

Adaptation is temporally asymmetric and occurs at multiple rates. Much useful
light adaptation can be rapid, while recovery after a strong photopigment bleach
can take substantially longer:

- [Rapid Adaptation of Night Vision](https://pmc.ncbi.nlm.nih.gov/articles/PMC5787096/)
- [Human retinal dark adaptation tracked in vivo with the electroretinogram](https://pmc.ncbi.nlm.nih.gov/articles/PMC9796346/)

A bright source also scatters inside the eye. This retinal straylight creates a
veiling luminance that reduces nearby contrast and produces disability glare; it
is not atmospheric scattering and therefore belongs to a later optical or
perceptual response rather than `pathRadiance`:

- [Glare's causes, consequences, and clinical challenges after a century of ophthalmic study](https://pubmed.ncbi.nlm.nih.gov/22445628/)
- [Effect of corneal light scatter on vision: a review of the literature](https://pmc.ncbi.nlm.nih.gov/articles/PMC4844042/)

The low Sun is not governed by adaptation alone. Its long atmospheric path
attenuates direct irradiance and preferentially removes shorter wavelengths;
aerosol optical thickness and water vapor make the resulting disk brightness and
color strongly condition-dependent. [Direct solar radiation: spectrum and
irradiance derived from sun-photometer
measurements](https://pubmed.ncbi.nlm.nih.gov/20531745/) supports treating this
as physical transport rather than a time-of-day display rule.

These findings support a realistic default in which a high Sun may naturally
overexpose toward white, while an atmospherically attenuated sunrise or sunset
disk becomes resolved and warm only when its transported radiance falls into the
adapted display range. The renderer must not guarantee disk visibility.

Direct solar viewing can damage the retina, and pupil constriction provides
little protection at solar irradiance. Apparent comfort or visibility near the
horizon is not a safety criterion; see [Ocular hazard from viewing the sun
unprotected and through various windows and
filters](https://pubmed.ncbi.nlm.nih.gov/20125678/).

## Production Evidence And Bounded Diagnosis

Immutable run `000240-production-sun-appearance-paired-diagnostic` is verified
`operational-failed`. Its 67 artifacts total 14,675,300 bytes at artifact-set
SHA-256
`cbce14c9ea1ebc652db200cea8e2eb0aa058551045127e555dd8fc25c56da63b`.
Five distant shards completed, but all three Flat shards reached approximately
`4,500,000 ms` while their CPU calculation was still advancing; two concurrent
CPU-heavy Chrome shards also made the host UI unresponsive. The fixture
identity changed during execution. With no `gates.json` or complete aggregate,
the run establishes no raw-order, CPU/GPU-parity, convergence, ACES, or
appearance conclusion. Production is unchanged.

GPU-only run `000241-production-sun-appearance-gpu-visual-evidence` completed
all eight browser shards but failed operationally when aggregate validation
detected a fixture/profile identity mismatch. GPU-only run
`000242-production-sun-appearance-gpu-visual-evidence` corrected that mismatch
and reached a complete hardware-GPU scientific rejection. It retained 104
unique rows and 144 nominal pair identities, but only 135 had positive disk
coverage and positive direct celestial Y; all 135 valid pairs were strictly
ordered. Nine wide-view Flat labels had no disk contribution. Its center rays
were aligned within `1.1e-7` radians, while the wide quarter-pixel diagonal
(`0.0818149` degrees) exceeded both the medium (`0.0637118` degrees) and long
(`0.0464212` degrees) apparent radii. The missing disk is therefore a real
finite-source sampling failure, not a transport, aim, or Color result.

The selected correction analytically intersects the exact forward
finite-sphere screen conic with the pixel, then uses that continuous coverage
to weight the existing four transport samples. Geometric disk-hit count is
measured before blockers and remains distinct from visible transport count. A
positive-overlap pixel missed by all four rays uses one scene-checked
source-center transport sample. A focused GPU-only proof must establish
coverage, tile energy, phase continuity, partial/full blockers, and unchanged
cache/path/distant behavior before the canonical capture is repeated. Raising
the evidence resolution or forcing the center pixel to full coverage is not an
accepted alternative.

The immutable production transport diagnostic under
`tmp/extraterrestrial/runs/000221-production-sun-disk-transport-diagnostic/`
evaluates a full-extinction center path independently of screenshot judgment.
Its runner imports the live dirty production tree, records only a hard-coded
commit label, and uses production's 20-interval source path, so the values are
production-resolution evidence rather than numerical ground truth. Its stored
RGB-derived luminance differs from direct CIE Y by less than `0.0061%`, but it
should still be named a luminance proxy rather than exact photopic luminance.
For the retained San Jose sequence it reports:

| Condition               | Solar elevation | Reported center-path luminance proxy |
| ----------------------- | --------------: | -----------------------------------: |
| Sunset minus 30 minutes |  5.3169 degrees |                     `3.0866e8 cd/m2` |
| Sunset minus 20 minutes |  3.5351 degrees |                     `1.6192e8 cd/m2` |
| Sunset minus 10 minutes |  1.7763 degrees |                     `4.2455e7 cd/m2` |
| Sunset                  |  0.0421 degrees |                     `3.7757e5 cd/m2` |

The disk therefore remains present and extremely luminous while its radiance
falls continuously as the atmospheric path grows. Its spectrum also warms
continuously: short wavelengths are attenuated much more strongly than long
wavelengths. This is the expected Beer-Lambert behavior for wavelength-
dependent Rayleigh, aerosol, and absorption optical depth. NOAA's
[red-sky explanation](https://gml.noaa.gov/grad/about/redsky/) independently
describes the same long-path preferential removal of short wavelengths. The
normal reduced cache is a separate approximation: at exact sunset run `000221`
reports cached luminance `7.86631` times the 20-interval center-path result.
Color must not be tuned to hide that transport discrepancy.

The abrupt displayed sequence is introduced after transport. Production first
projects the physical spectrum to linear sRGB. At sunset minus 10 minutes that
projection has a negative blue component. The physical spectrum is not
negative; the negative coordinate means the strongly warm color lies outside
the linear-sRGB gamut. The current display operation then clamps each RGB
channel independently and applies:

```text
displayChannel = 1 - exp(-max(linearChannel, 0) * K)
```

The implementation is owned by
[BrunetonColorDisplayModel](../../../src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js).
The retained screenshots record the following code-value sequence:

- at minus 30 minutes, the sampled disk and nearby sky are both nearly white and
  the disk is not visually distinct;
- at minus 20 minutes, a white-versus-pale-yellow code difference makes the disk
  barely visible;
- at minus 10 minutes, the disk center reaches approximately `[255, 255, 0]`
  while adjacent sky is approximately `[255, 254, 80]`; and
- at sunset, the disk returns only because the surrounding sky finally leaves
  the plateau.

These observations prove severe channel saturation and weak, unstable visual
separation, but not display-luminance rank inversion. The captures contain no
paired raw disk/sky luminance or declared framebuffer transfer. Applying Rec.709
weights directly to the code values and first decoding them as sRGB produces
different rank conclusions. Tone-mapping research establishes that independent
clipping can cause HDR hue and luminance distortion, but does not fill this
missing application evidence; see
[Kinoshita et al.](https://arxiv.org/abs/1908.06557).

The real sky should contain three distinct components:

1. a roughly `0.53`-degree direct disk whose radiance dims and warms with
   increasing optical depth;
2. a bright circumsolar field dominated by aerosol forward scattering; and
3. a near-horizon radiance distribution that includes higher-order scattering.

Measured clear-sky work confirms that the horizon radiance maximum changes with
solar elevation, relative azimuth, and aerosol optical depth, and that second-
order scattering can reproduce it; see
[Horizon brightness revisited](https://opg.optica.org/ao/abstract.cfm?uri=AO-33-21-4620).
HDR sky measurements likewise find a small saturated solar region surrounded by
large non-saturated circumsolar gradients; see
[García et al.](https://www.sciencedirect.com/science/article/pii/S0038092X2200305X).
The 2025
[RAW-HDR circumsolar comparison](https://www.mdpi.com/2313-433X/11/12/442)
additionally finds that nonlinear ISP-domain HDR increases near-Sun saturation
and flattens radial aureole gradients compared with radiance-linear RAW fusion.
It performs quantitative evaluation before visualization tone mapping. That
supports retaining spectrum/XYZ/Y and post-display values together instead of
using screenshots as a radiometric oracle.
Exact naked-eye or camera appearance is not universal because aerosols,
humidity, clouds, exposure, glare, and observer adaptation vary. The renderer
must nevertheless preserve the contrast produced by its own physical model and
must not create disappearance or luminance reversal merely because an RGB
coordinate crosses the display gamut.

The selected display candidate is the official ACES 2 architecture, pinned to
release [`v2.0.0+2025.04.04`](https://github.com/aces-aswf/aces/releases/tag/v2.0.0%2B2025.04.04).
Its rendering transform converts scene color into a simplified Hellwig-2022 JMh
space, tone-maps lightness `J`, compresses colorfulness `M`, and then compresses
`J` and `M` into hue slices of the target gamut before separate display
encoding. ACES requires a continuous, continuously increasing, non-asymptotic
[tone scale](https://docs.acescentral.com/system-components/output-transforms/technical-details/tone-mapping/)
and explicitly separates
[rendering from display encoding](https://docs.acescentral.com/system-components/output-transforms/implementer-notes/).
The relevant official details are the
[output structure](https://docs.acescentral.com/system-components/output-transforms/technical-details/rendering-overview/),
[chroma compression](https://docs.acescentral.com/system-components/output-transforms/technical-details/chroma-compression/),
[gamut compression](https://docs.acescentral.com/system-components/output-transforms/technical-details/gamut-compression/),
and [100-nit Rec.709/D65 presets](https://docs.acescentral.com/system-components/output-transforms/parameters/).

This is a color-volume architecture and production-vetted reference, not proof
of physical Sun accuracy or a unique perceptual oracle. ACES maps perceptual
`J`, not physical CIE Y; constant model `h` is not exact spectral hue; and the
complete gamut operation can change both `J` and `M`. The final disk/sky ordering
must therefore be tested after the complete transform, declared display
encoding, and quantization. The transform remains global and source-independent.
If its sealed reference result cannot represent the required low-Sun contrast,
reject it unchanged; the next justified design is not another curve but an
explicit surround-adaptation or optical-glare investigation.

Before viewing that candidate, record matched pre-display spectral radiance,
direct CIE XYZ/Y, signed linear RGB, mapper float output, framebuffer readback,
and final code values at disk center, inside limb, and circumsolar samples near
`0.5`, `1`, and `2` degrees for the retained local and distant sequences using
the actual GPU cache and shader. Declare the output transfer and quantizer, and
require the contained faithful ACES GLSL to pass bounded CTL/OCIO reference,
ordering, continuity, encoding, quantization, and Bruneton non-regression gates.
Generate the first candidate captures through that GPU shader only. Separate
CPU N4 atmospheric-scattering/cache regeneration, refined source-path
convergence, CPU full-frame preview, and paired CPU/GPU evidence return once at
final verification. The bounded binary64 direct-celestial reference/support
helper constructed by the sealed normal distant-GPU builder remains part of GPU
setup and is disclosed rather than counted as that deferred CPU-heavy lane.

## Rejected Bounded Sky-Derived Exposure Curve

The observer-local sky probe and retained Figure-1 exponential mapping were
used to derive and test a first global exposure curve. This section preserves
that research; the resulting candidate is not the production policy.
The meter samples ordinary atmospheric sky radiance and excludes the Sun disk,
stars, scene geometry, camera FOV, and viewport. Its photopic sky illuminance is
`E_v` in lux.

For the current display mapping `f(L) = 1 - exp(-K L)`, select the reference
illuminance that maps an 18%-reflectance Lambertian surface under the measured
sky illuminance to the conventional 18% display key:

```text
rho = 0.18
E_ref = pi * [-ln(1 - 0.18)] / (K * rho)
      ~= 11,828 lux
```

The rejected reciprocal curve used `E_ref / E_v` over the entire range. That is
a gray-card metering equation, not a human-adaptation model: it forces the mean
sky toward nearly constant display brightness. After the reflectance correction
it amplified the retained sunset control by `8.32x`, producing an implausibly
pale sky.

Bound dark-scene gain with the binocular light-adapted pupil-area response from
[Watson and Yellott (2012)](https://doi.org/10.1167/12.10.12). Evaluate their
reference-age (`28.58` years) equation with the upper hemisphere's adapting-field
area and `L = E_v / pi`. If `D(E)` is its predicted pupil diameter:

```text
grayCardExposure = E_ref / max(E_v, E_floor)
pupilAreaExposure = [D(E_v) / D(E_ref)]^2

exposure = clamp(
  min(grayCardExposure, pupilAreaExposure),
  1 / 64,
  16,384
)
```

The minimum keeps the daylight gray-card/highlight constraint but prevents it
from inventing unlimited twilight gain. The pupil model naturally approaches
approximately `13.56x` in darkness for this reference observer; the wider clamp
remains only a numerical safeguard. Neural adaptation is not represented as a
thousands-fold linear exposure multiplier because it changes retinal sensitivity
and contrast coding rather than making a dark exterior look like noon.

Applied to the retained extraterrestrial sky-meter evidence, this gives:

| Condition                  | Sky illuminance | Bounded exposure         |
| -------------------------- | --------------: | ------------------------ |
| Retained bright control    |      15,329 lux | `0.772x` / `-0.37` stops |
| Solar depression 0 degrees |       1,421 lux | `1.136x` / `+0.18` stops |
| Solar depression 3 degrees |         252 lux | `1.380x` / `+0.46` stops |
| Solar depression 6 degrees |        7.99 lux | `2.842x` / `+1.51` stops |
| Solar depression 9 degrees |      0.0398 lux | `9.231x` / `+3.21` stops |

Smooth the exposure in stop space so multiplicative changes have uniform
temporal behavior:

```text
nextStops = currentStops
  + (targetStops - currentStops) * (1 - exp(-deltaTime / tau))
```

An initial response may use approximately `0.5 s` when reducing exposure for a
brighter scene and `2 s` when increasing exposure for a darker scene. These time
constants are provisional presentation values, not deductions from the retained
radiometric data. They must be tuned and reported separately from the exposure
curve itself.

The rejected candidate applied one resulting scalar to completed scene-linear
radiance before the final display mapping. Atmosphere, Sun, stars, and captured
geometry shared it.

Visual qualification rejected even the bounded version. Two hours after sunset
it amplified small residual atmospheric radiance into a bright blue daytime-
looking sky. The pupil-area bound prevents an unbounded mathematical gain, but
it does not make the result a valid model of retinal adaptation, local contrast,
or camera exposure. Production therefore restores the fixed Bruneton Figure-1
coefficient and does not publish the exposure texture binding; the Three runtime
does not construct or execute the meter passes. The implementation remains only
as contained research that may inform a separately designed star-visibility
system.

The experiment also confirms that exposure alone cannot guarantee a colored
disk. A sufficiently bright Sun may still overexpose realistically. If a
strongly warm and sufficiently attenuated disk becomes exact white under the
fixed production coefficient, the remaining issue is global highlight/gamut
handling rather than celestial transport.

### Future solar-filter presentation

Consider reusing the eventual one-factor display infrastructure for an explicit
solar-filter presentation. A physical neutral-density approximation would
multiply the entire completed scene by `10^-opticalDensity` and would disable or
constrain automatic exposure so adaptation does not cancel the filter. A colored
filter would require spectral transmission before RGB conversion. Any future
disk-only attenuation belongs to a separately named educational inspection mode,
not a physical full-aperture solar filter or atmosphere-validation result.

## Conclusions For The Current Diagnosis

1. Treat raw celestial transport and display appearance as separate questions.
2. First accept the selected Flat/local analytic finite-disk raster against its
   independent geometry, energy, phase, blocker, and non-regression gates; stop
   for redesign if it fails rather than trying another sampler.
3. At each selected time, record disk-center, inside-limb, and `0.5`, `1`,
   and `2` degree circumsolar spectrum, direct CIE XYZ/Y, signed linear RGB,
   mapper float result, framebuffer readback, and final codes through the GPU
   path under a declared transfer and quantizer.
4. If raw disk contrast is large but displayed contrast vanishes, diagnose the
   display transform. If raw contrast is small or inverted, diagnose direct or
   circumsolar transport first.
5. Retain full direct extinction. The stored finite-cone result is too small to
   be an appearance fix under the current aerosol profile, but its phase model
   is not a universal bound on the real aureole. Any future atmospheric change
   requires production Cornette-Shanks consistency and its own evidence.
6. Qualify only the pinned ACES 2 global transform, with the current fixed scene
   scale and one declared 100-nit Rec.709/D65 output path. Add no
   project-authored input clamp: preserve signed project RGB through conversion
   to ACES2065-1, then invoke and record the official core's AP1 `[0, 1024]`
   clamp unchanged.
7. Keep the rejected automatic-exposure candidate disconnected. Any later
   star-adaptation or user-exposure design must be qualified independently and
   may not silently reactivate it.
8. Accept the sealed ACES candidate unchanged or reject it without parameter or
   curve shopping. Prove disk-to-sky ordering and GPU-vs-reference parity after
   the complete gamut transform, actual encoding, and quantization before
   judging GPU screenshots.
9. At final verification, restore the CPU/reference/GLSL, refined source-path,
   and paired CPU/GPU authorities. Run CPU-heavy work at concurrency `1`, below-
   normal priority where supported, with UI resource headroom and progress-
   heartbeat/inactivity supervision; do not abort while measurable progress
   continues.

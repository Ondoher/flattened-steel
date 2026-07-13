# Celestial Appearance And Sun-Disk Architecture

Status: retained and paused architectural redesign, current through
2026-08-22. The prior Sun-appearance experimental lane failed its visual
objective and is stopped. This document preserves the resulting architecture
decisions and resumption requirements. It authorizes no production change and
delegates the current spherical atmosphere-cache representation work to
the [Distant-Sun Solar-Zenith Branch-Integrated Spectral Cache Design](../algorithm32/cache/solar-zenith-cache-design.md).

The historical implementation chronology remains in the
[implementation plan](sun-disk-appearance-implementation-plan.md), and immutable
run evidence remains under `tmp/extraterrestrial/runs/`. The reviewed external
basis is [Physically Based Sky, Atmosphere and Cloud Rendering in Frostbite](https://media.contentapi.ea.com/content/dam/eacom/frostbite/files/s2016_pbs_frostbite_sky_clouds.pdf),
especially its separate atmospheric-radiance, transmittance, and celestial-disk
composition.

## Current Outcome

The stopped lane did not produce the requested current, centered San Jose
spherical/distant sequence at sunset, sunset minus 10, minus 20, and minus 30
minutes. Old off-center application captures do not answer that request. Run
`000242-production-sun-appearance-gpu-visual-evidence` retained only one current
spherical full-frame preview, at sunset minus 10 minutes, and was a scientific
rejection. The later two-image visual loop was Flat/local-only and therefore did
not answer the spherical/distant question.

The evidence established two separable limitations:

1. fixed four-quarter-ray coverage can miss or quantize a projected disk; and
2. the current channel-wise display mapper can collapse extreme warm HDR values
   onto an exact-white plateau.

The first limitation is no longer an active defect merely because it can make
the displayed disk disappear. Persistent disk rendering has been removed from
the requirements. It matters only to a later feature that explicitly needs
continuous disk coverage, energy conservation, or a source locator. The second
remains evidence about the global display transform, not a mandate to recover
the disk.

The first contained replacement of that final mapper is now also resolved as a
negative result. Runs `000349` and `000350` keep production spectral transport
and Bruneton's CIE 1931 projection, evaluate the existing Figure-1 curve once
on luminance, and apply one common RGB gain. This restores the disk's warm
channel ratios, proving that the independent channel shoulders are the direct
white-disk mechanism. However, Figure 1 is already saturated at display
luminance `1` over much of these HDR fields. Scaling every resulting pixel by
its peak channel therefore destroys relative brightness and produces broad
orange gamut-boundary fields. The architectural rule is now stronger: Color
may use a common RGB gain, but it may not use per-pixel peak normalization as
gamut containment. A replacement highlight mapper must preserve field-relative
luminance as well as chromatic ratios; adaptation from local light is a later
movement of that mapper, not part of the first repair.

The contained Flat analytic-coverage experiment repaired support in two viewed
cases but did not establish a credible appearance or a general architecture.
Its planned ACES continuation, exhaustive raster proof, and formal evidence grid
are not active work.

## Goal

Produce stable, physically coherent celestial appearance while keeping the main
runtime shader essentially `O(1)` and generally cache-hit limited. The design
may support the distant Sun, finite/local Sun, Moon, planets, and unresolved
stars without making the atmosphere or display transform source-specific, but
it does not guarantee that every body, especially the Sun disk, remains
visibly resolved in every rendered condition.

The preserved Color resumption path is the measurement-first
[Spectral Color-Transform Experiment Plan](spectral-color-transform-experiment-plan.md).
It records wavelength-resolved Sun and surrounding-sky values before developing
a new Color lane from fixed inputs. It is paused behind the current solar-
zenith cache work. Full-frame visual qualification follows only after that work
is resumed and isolated disk plus recorded-sky composition are credible.

## Ownership Invariants

- The clock owns time progression and publishes an observation time.
- Geometry interprets time and location according to its world model and owns
  light-source placement.
- A light source owns spectral radiometry and emitter profile, not placement.
- Geometry owns projected support, path endpoints, horizon/ground
  classification, scene visibility, and transport lookup coordinates.
- Atmosphere owns medium coefficients, optical-depth/transmittance semantics,
  and atmospheric path radiance.
- Celestial rasterization owns whatever projected-coverage semantics a feature
  explicitly requires; ordinary output has no universal continuous-coverage or
  persistent-disk guarantee.
- HDR composition remains additive before one global Color boundary.
- Color owns the global display transform and may not inspect source identity.
- The full-screen runtime shader does not ray-march atmosphere, iterate a star
  catalog, run convergence, or perform variable-work integration.

## Time And Placement

Time flows through geometry:

```text
clock observation
  -> geometry-owned light-source placement
       -> source binding
       -> atmosphere-path resolution
       -> projected celestial support
       -> scene lighting and shadows
       -> reflections and other views
```

Downstream consumers do not read the clock or independently derive solar
placement. They consume the same immutable placement published by geometry.
Spherical geometry may derive a distant direction from observation time and
location. Flat geometry may derive a finite source position. Another geometry
may define different celestial rules without changing the clock or source.

### Spectral Scene Illumination

The same geometry-resolved celestial and atmospheric field also supplies scene
lighting. Keep its two incident-light terms distinct:

```text
direct spectral irradiance  = attenuated celestial disk integrated over support
diffuse spectral irradiance = integral of sky radiance * cosine over the surface hemisphere
```

The first term drives directional sunlight and shadows. The second is the
sky-ambient/environment term. Ground and scene interreflection are later terms;
they are not silently included in either atmosphere result. Both remain
wavelength-resolved until the receiving material or lighting Color boundary.

Camera-location direct irradiance is immediately useful as the direct-light
metric and as a coarse local-lighting context, but it is not by itself scene
ambient. Ambient requires the directional sky field at the shaded point (or a
declared camera-local approximation) and a deterministic hemispherical
integration. A runtime implementation may consume a fixed-cost spectral
irradiance lookup or bounded directional representation; it need not perform a
live hemisphere integration.

Production now exposes `LocalLightLevelCalculator`, promoted from the accepted
contained local-light record. Given transported uniform-disk radiance, local
disk elevation, and angular radius, it derives visible projected support,
direct spectral irradiance, CIE 1931 photopic illuminance, and the coarse
`E_v / pi` local-light proxy. It performs no sky probe and does not modify the
Bruneton Color model. Ambient consumers may use this as a bounded local-light
input or approximation, but must not relabel direct irradiance as complete
diffuse-sky irradiance.

For Ferwerda display control, its separate `measureBrightnessProxy` operation
uses the configured source's receiver-local irradiance after geometry-owned
visible support and projects the native-15 packet photopically. It contains no
source-elevation or twilight formula. It is intentionally a coarse brightness signal rather than a
direct, diffuse, ambient, or physiological measurement. Camera rotation, field
of view, and viewport are irrelevant. The facade recomputes it when it accepts
a replacement configuration with changed source radiometry, source placement,
or receiver position; the currently fixed observation does not add a frame-loop
calculation.

The calculator is receiver-local composition rather than state owned by one
Sun implementation. The primary `Algorithm32` facade now creates and
lifecycle-owns one calculator with each prepared configuration, alongside the
facade-owned shared model, reference execution, and shader builder. Its
higher-level integration will accept the active celestial-source roster and
obtain each
source's source-owned incident-light sample, including distance falloff for a
finite local Sun. Geometry, atmospheric transport, horizon support, and scene
occlusion remain separate inputs. Contributions are accumulated spectrally
before photopic projection. This boundary must later include phase-dependent
transported moonlight when deriving local lighting and an adaptation signal.
Direct Sun and Moon irradiance remain distinct from diffuse sky ambient; a
complete ambient result requires the directionally integrated sky field driven
by those sources and must avoid counting a direct contribution twice.

The first contained implementation of the selected non-probe diffuse data path
is accepted in immutable run
`000421-stellar-ferwerda-diffuse-data-adapted-full-scene-sunset-noon`
(`2eca12746506c053335f25ff0df0ee39031d742f412945693a0a6f8c13f3302b`).
It consumes the accepted camera-independent 32-direction native-15 atmospheric
path-radiance hemisphere, cosine-integrates it once per scene, and derives
diffuse spectral irradiance, photopic illuminance, and equivalent `E_v / pi`
luminance. It obtains `3632.4668027619023 cd m^-2` at sunset and
`5070.201700912994 cd m^-2` at noon. In the contained full-scene Ferwerda
comparison this removes sunset's `142080` exact-white pixels and raises noon's
maximum byte from `161` to `255` without producing an exact-white pixel. This
does not restore the abandoned framebuffer probe or select a final adaptation
policy: it excludes direct celestial, stellar, and scene-geometry radiance and
does not yet drive ambient scene lighting. Production remains direct-source
only.

Contained run
`000424-stellar-ferwerda-sunset-facing-solar-noon-sunset-plus-three-hours`
(`bb25bb1e23d4953ebcc20e8d1d9078bf24680dfcd75939bb732645a8358d324b`)
holds the camera at the synchronized sunset bearing for solar noon, sunset,
and sunset plus three hours. Noon and sunset retain the data-derived values
above. The accepted atmosphere ledger contains no exact three-hour hemisphere,
so the night comparison explicitly reuses the already-qualified Ferwerda
`0.001 cd m^-2` starlight reference from run `000417`; it is not relabeled as
a measured diffuse or ambient value. The night capture visibly renders stellar
points. This result selects no final adaptation policy and changes no
production Color path. Preserved predecessor run `000423` used the wrong sign
for camera-local north and placed the sunset at the right edge; it is rejected
as centering evidence.

Production moonlight and diffuse-sky ambient aggregation remain deferred from
the current Sun/star round and are now explicit parts of the later Moon round.
That work must augment source-owned direct irradiance with a receiver-local,
solid-angle/cosine-weighted visible celestial-radiance field containing the
Moon tile, Sun tile, stellar palette, and atmospheric sky. It must retain
separate direct, diffuse-ambient, and visible-field/adaptation ledgers so direct
Sun or Moon energy is not counted twice. The Moon round must also evaluate a
larger explicit directional-shadow extent, including resolution, precision,
cost, and a cascaded-shadow alternative if one enlarged map is inadequate. They
do not block the first exposure connection, which may use the
existing direct-light `E_v / pi` proxy as a provisional coarse local-light
input. That input must not be described as complete ambient, and the eventual
multi-source/diffuse integration must replace or extend it without double
counting.

The future full-Moon control must produce materially nonzero receiver-local
scene lighting with the Sun below the horizon. Phase-dependent transported
moonlight supplies directional illumination and shadows; atmospheric scattering
of that moonlight supplies a distinct diffuse ambient fill; the visible Moon
and sky also enter the adaptation field. These quantities share physical source
data but are not interchangeable and must remain separately inspectable.

When the Sun contributes no receiver-local light and no secondary source is
present, the current model's ambient-light value is exactly zero. This is the
declared three-hours-after-sunset state until Moon, stellar, airglow, artificial,
or other secondary-source contributions are introduced. Any positive numerical
floor used by exposure mathematics is domain protection only; it is not a
physical light measurement. The exposure policy must define a finite
dark-adapted endpoint for the semantic zero input.

`LocalLightLevelCalculator.modifyExposure` composes the unchanged positive
Bruneton baseline exposure with one separate positive achromatic modifier and
returns both inputs with their effective product. Its
`deriveExposureModifier` operation now owns the provisional normalized Ward
policy:

```text
g(L) = 1,                                                    L >= 5 cd m^-2
g(L) = ((1.219 + 5^0.4) / (1.219 + L^0.4))^2.5,             0 <= L < 5 cd m^-2
```

The additive `1.219` term makes semantic zero finite without inventing a
positive physical floor: `g(0) = 10.50268593548108`. The explicit photopic
branch returns exact identity for every daytime input at or above `5 cd m^-2`,
so it cannot increase daytime exposure. The `Algorithm32` facade owns and
publishes the unsmoothed live target as `color.exposureModifier`; callers cannot
override that key. Bruneton Color multiplies the uniform globally around the
unchanged Figure-1 coefficient on both CPU and GLSL paths. This is adaptation of
the complete composed result, not a Sun or stellar branch. Accepted run
`000402-production-local-light-exposure-qualification`
(`0696e2a69cb9179763a7de9cce0d058afe88944959f43b3c47872a5cdb0d46a2`)
covers the curve endpoint, monotonicity, exact photopic identity, invalid
inputs, facade ownership/live binding, CPU and shader Color connection, both
production typechecks, and stable source fingerprints. The facade-created
calculator now receives the configured primary source and initializes its live
target from source-owned incident scale, finite-source distance falloff where
applicable, and geometry-owned horizon support. Flat32 mode replacement repeats
that initialization for each published placement/time state. Atmospheric
attenuation within a nonzero proxy is explicitly absent, so this remains a
coarse direct-source context; the exact-zero night state is unaffected by that
omission. Failed runs `000400` and `000401` preserve type-boundary corrections.
No run produced a render. Moon/diffuse aggregation and temporal smoothing remain
deferred.

The current code is close to this flow: `LocationTimeController` publishes
`observation.instant`, geometry derives placement, and application lighting uses
the resulting geometry direction or position. The remaining weakness is that
consumers receive individual configuration values through separate calls rather
than the same published placement object.

## Shared Emitter Contract

Local and distant Suns are two placements of one emitter interface. The common
contract owns spectral radiometry, physical or angular support, and an optional
radial emission profile.

| Concern | Finite/local placement | Distant placement |
| --- | --- | --- |
| Location | finite position | direction abstraction |
| Apparent support | radius and distance | angular radius |
| Parallax | present | absent |
| Celestial ray endpoint | finite body | direction at infinity |
| Atmospheric path endpoint | atmosphere boundary | atmosphere boundary |
| Inverse-square behavior | placement-dependent | absent |

"Very far away" is an abstraction, not an enormous coordinate. A distant
placement retains parallel-ray and infinite-boundary semantics. Sharing this
emitter interface does not imply shared atmospheric-cache coordinates, layout,
or a transformed local-Sun shell.

For a uniform disk, source surface radiance remains derived from irradiance and
solid angle. A ground-level zenith-illuminance adapter may be added for authoring
without replacing the canonical unit-bearing spectral source representation.
Limb darkening is an optional radial emission profile, not a correction to
atmosphere or raster support.

## Atmospheric Boundary Composition

Atmospheric sky radiance and external celestial radiance are distinct physical
contributions. For a body beyond the atmosphere:

```text
camera radiance
  = atmospheric path radiance
  + view-path transmittance * external celestial boundary radiance
```

The external boundary term may contain the distant Sun, Moon, stars, planets,
or another object. Atmosphere does not need to know which body produced it. It
knows the geometry-resolved pixel path, atmospheric radiance scattered toward
the camera, and the fraction of boundary radiance surviving that path.

The local Sun is always outside the atmosphere. Its finite placement affects
parallax, apparent support, visibility, and the radiance arriving at the top of
the atmosphere, but it does not create an in-atmosphere source path. Both Sun
placements and all other external celestial objects therefore enter the same
boundary-radiance composition:

```text
preDisplayRadiance
  = pathRadiance
  + viewTransmittance * celestialBoundaryRadiance
```

For a local Sun, geometry traces the celestial ray to the finite body and
resolves where that ray enters the atmosphere. Atmospheric transport covers
only the segment from the camera to that boundary point. Travel between the
body and the atmosphere is outside the atmospheric model.

## First-Class Transmittance

The CPU atmosphere interface already exposes
`integrateOpticalDepth(path) -> opticalDepth, transmittance, blockedByGround`.
Runtime ownership is inconsistent:

- ordinary transport integrates view transmittance;
- the Flat/local celestial resource contains its own source-path extinction
  loop; and
- distant celestial construction uses a separate atmosphere-owned integration
  module and stores transported radiance.

Atmosphere coefficients are first-class today, and CPU optical-depth integration
is first-class. GPU optical-depth/transmittance integration is not consistently
first-class. The local Sun currently samples atmosphere-owned extinction but
owns the integration procedure, so quadrature, path handling, and numerical
policy can diverge from other paths.

The target capability has construction and runtime sides:

```text
construction/update:
  geometry-resolved paths + atmosphere extinction
    -> transport/transmittance representation

runtime:
  geometry-resolved lookup coordinates
    -> fixed atmosphere-owned lookup
    -> spectral transmittance
```

"Atmosphere returns transmittance" does not authorize runtime integration. The
expensive operation occurs during construction or update; the runtime shader
uses fixed-cost lookups. Geometry owns endpoints, ground/horizon classification,
and lookup coordinates. The Sun shader consumes transmittance and does not
contain an extinction integral.

Multiple scattering affects atmospheric path radiance, not Beer-Lambert
transmittance of the direct unscattered beam. Ozone absorption and other
extinction changes affect both sky radiance and direct transmittance through
their appropriate atmosphere-owned operations. Horizon-focused lookup
parameterization is a representation decision, not a Sun-specific correction.

### Frostbite-Informed Ozone Revisit

Production and the canonical ozone-off atmosphere remain unchanged. A
contained atmosphere extension now implements the retained Bruneton Earth-demo
ozone model: 300 DU at 233 K with the documented linear 10--25--40 km density
profile and the retained wavelength-dependent cross sections. The extension
adds ozone only to total extinction in CPU sampling, runtime atmosphere GLSL,
and the shared construction `cacheExtinction`; Rayleigh/Mie scattering,
scattering-density sources, and phase functions remain unchanged. Exact
ozone-off CPU, shader, cache-module, and identity compatibility is covered by
the contained authority and atmosphere audits under
`scripts/extraterrestrial/ozone/`.

Accepted immutable run
`000483-b1-reflection-completed-fibonacci68-bruneton-ozone`
(`7c61134472c49662845b2f2661cd19ea50b8a48f8e8741ea598582fbc3235bbb`)
owns the complete 17-condition, cumulative-J4, reflection-completed-Fibonacci-68
ozone-on B1 diagnostic and all six standard figures. Against the identical
ozone-off run `000480`, aggregate spectral RMSE changes from
`11.82039160412625` to `11.827368292002886 mW m^-2 sr^-1 nm^-1`
(`+0.059022%`): eight conditions improve and nine worsen. Ozone decreases all
55,080 recorded boundary values, as absorption requires, but this daylight B1
comparison is essentially neutral overall and does not support adopting ozone
from aggregate accuracy alone.

Accepted immutable run
`000484-b1-ordinary-fibonacci34-bruneton-ozone`
(`e4ad9093de498ea3765c157ee2f16b3d122287ff5f3183be26ce01f6e5111628`)
repeats the same complete ozone-on B1 diagnostic with the original ordinary
Fibonacci-34 incoming domain. Against its exact retained ozone-off control,
aggregate RMSE changes from `11.925778001729508` to
`11.902566898186711 mW m^-2 sr^-1 nm^-1` (`-0.194630%`): eight conditions
improve and nine worsen. Ozone again decreases all 55,080 boundary values.
The sign of ozone's small aggregate effect therefore depends on incoming
quadrature, while reflection-completed Fibonacci-68 remains better overall:
its ozone-on aggregate is lower than Fibonacci-34 ozone-on by
`0.07519860618382523 mW m^-2 sr^-1 nm^-1` (`0.631785%`). The standard dome
figures retain the same broad contour/lobe geometry, so neither ozone control
supports ozone as the cause or cure of those discontinuities.

Completed contained diagnostic run
`000493-san-jose-nautical-twilight-ozone-f68-w39-preview`
(`63ccccc8ce9e2796781dc6ac0fbd4c912c4340815050215f85dd263ea8ea966f`)
holds the exact run-`000466` San Jose sunset-plus-one-hour scene, celestial
screen product, source-luminance-lift Color, Native48 positions, Native15
basis, and N4 recurrence. It combines the 300-DU ozone extension with
reflection-completed Fibonacci-68 incoming quadrature and W39 outgoing
storage, renders one unpaired image with no appearance acceptance gate, and
reads 585 diffuse `state.pathRadiance` spectra before celestial composition
and Color. All 585 probes, including all 195 at 0--2 degrees elevation, retain
positive 407, 438.33, and 469.67 nm radiance and a positive signed linear-blue
component. No probe is blue-dominant. Near the horizon, the 407--470 nm sum is
only 3.63--5.70 percent of the sampled 407--689 nm energy and the 470/626 nm
ratio is 0.200--0.312; the relative blue fraction increases with elevation.
The raw horizontal path-radiance profile still has two peaks near source-
relative azimuth offsets minus and plus 50 degrees, each about four times the
source-axis value and equal within binary32-scale residual. Thus reflection
completion removes the earlier left/right imbalance but not the lobe topology,
and the feature exists before Color. Because ozone, incoming quadrature, and
outgoing resolution changed together relative to the oldest control, this run
does not independently attribute their effects and does not qualify a
production atmosphere or cache.

Accepted diagnostic run
`000494-san-jose-nautical-twilight-ozone-f68-camera-patch-preview`
(`74f1724881af45188802a178819a8e737bb94f5c3d05c7b3112a18e365b84084`)
isolates a further outgoing-reconstruction change from run `000493`. It keeps
ozone, F68, W39 fallback storage, scene, N4, Native48, Native15, Color, and the
celestial product fixed, then appends a `103 x 65` camera-aligned patch at W77
linear density. The outgoing domain grows from `9126` to `15821`; all
`256000` pixel-center view rays resolve only through the patch. Nevertheless,
`98.0391%` of displayed pixels remain exact and every changed channel differs
by only one byte. The left-lobe contrast increases about `0.62%`, the visible
right shoulder about `0.23%`, and smoothed horizontal horizon variation about
`0.46%`; lobe positions are unchanged and no new seam appears. The raw horizon
peak-to-center topology likewise changes by substantially less than one
percent. All 585 spectra retain positive shortwave radiance and positive
signed linear-blue, but none becomes blue-dominant; camera-patch horizon probes
carry only about `3.6--4.5%` of sampled 407--689 nm energy in the 407--470 nm
band. Thus denser outgoing interpolation over the complete rendered view does
not smooth the lobes and is not a supported causal explanation at this tested
resolution.

Accepted diagnostic run
`000495-san-jose-nautical-twilight-ozone-f68-front-back`
(`b00b3ab3e0f8641ebf6668a35bb888cf00f098e971400e9a3967502a938fca3c`)
holds the exact run-`000493` F68/W39/ozone N4 cache and installed shader
handle fixed, renders the existing sunset-facing camera, then changes only the
camera azimuth by 180 degrees and renders the opposite view. The front capture
is byte-identical to run `000493`. Excluding the 43 copied screen-space
celestial-product pixels, mean near-horizon display luminance is about 6.69
times higher toward sunset. The sunset-facing smoothed horizontal
peak-to-center ratio is about 4.22, versus only 1.47 behind. More decisively,
the sunset-facing minimum lies on the projected azimuth of the below-horizon
Sun, and the retained run-`000493` constant-elevation Native15 probes place
equal maxima roughly 51--54 degrees from the Sun direction as elevation
changes. The apparent pair is therefore best described as the two visible
flanks of a source-axis luminance depression or annular shoulder, not as two
independent screen-fixed lobes. This orientation control does not establish
whether that source-relative depression is physical twilight structure or an
error in scattering recurrence or transport. Production remains unchanged.

The B1 executions above are not the matched ozone-on Bruneton reference or the
sunset/twilight tangent-path convergence qualification. Those remain required
before ozone becomes a production/default atmosphere composition or the
present twilight color is treated as representative of the architecture.

The revisit must use a documented ozone density profile and wavelength-dependent
absorption data with explicit units. Ozone becomes an atmosphere-owned
extinction component. It must affect both atmospheric path radiance and direct
celestial view transmittance through the same atmosphere operations; it may not
be introduced as a Sun tint, display correction, or source-specific cache term.

Hold observation, geometry, non-ozone atmosphere parameters, source radiometry,
exposure, and output transform fixed. Compare ozone off and on across the San
Jose spherical/distant sunset matrix retained by the paused spectral Color
resumption plan,
including its two-hours-after-sunset night control. Record transmittance and
path-radiance spectra, XYZ/Y, and signed linear RGB before the display mapper,
followed by matched display output. This isolates whether ozone improves
physical twilight color even when the current mapper collapses both variants
toward white.

Changing observation time does not rebuild the atmosphere. Changing the ozone
model is an atmosphere-definition change and may rebuild its construction-time
representations once per comparison variant. Do not tune ozone parameters from
screenshots; compare a sourced physical model against the unchanged ozone-off
baseline.

### Named Atmosphere Compositions

The contained experiment now exposes a small named composition catalog rather
than requiring callers to assemble loose atmosphere constants. Immutable run
`000297-named-atmosphere-composition-contract-proof` accepts its configuration
and representability contract (artifact set
`b300ec7e0667aeb1695044632cc467e8e907a130b449157e0cbb3e1af0670c1a`).
The executable compositions are:

| id | Mie loading | `tau_mie(550 nm)` |
| --- | ---: | ---: |
| `molecular-only` | `0x` | `0` |
| `canonical-aerosol-1x` | `1x` | `0.06453121464482371` |
| `canonical-aerosol-2x` | `2x` | `0.12906242928964742` |
| `canonical-aerosol-4x` | `4x` | `0.25812485857929485` |

This is a controlled aerosol-column sweep. It holds geometry, Rayleigh,
aerosol scale height, Angstrom exponent, single-scattering albedo, phase
asymmetry, and ozone state fixed and changes only `mieAngstromBeta`. Under the
current sea-level-normalized exponential profile,
`tau_mie(lambda_um) = beta * lambda_um^(-alpha)`. The names therefore describe
exact model inputs; they do not claim to reconstruct a named weather,
visibility, pollution, climate, or historical San Jose condition.

`ozone-reference` and `elevated-aerosol-layer` are also reserved names but fail
loudly as unsupported. The current implementation returns zero absorption and
has only one ground-anchored exponential aerosol profile. Enabling those names
requires real ozone absorption/density and aerosol-layer profile support in
both path radiance and direct transmittance; neither may silently degrade to the
canonical atmosphere.

Each composition is one atmosphere definition and may require one construction
or cache build. All observation times for that definition reuse it: moving the
Sun does not select or rebuild an atmosphere.

## Essentially O(1) Runtime

The target direct-celestial path is:

```text
placement
  -> fixed-cost projected support and visibility
  -> fixed-cost lookup-coordinate transform
  -> bounded transport/transmittance cache hit
  -> source radiance * transmittance * coverage
  -> additive HDR composition
```

The runtime shader may use fixed arithmetic, a fixed spectral channel count,
and fixed interpolation taps. Those operations remain `O(1)` but still require
an explicit frame-cost budget. It may not contain an atmosphere ray march,
source-distance loop, convergence loop, variable sample count, or catalog loop.

The current distant path is broadly fixed-work: it performs a bounded stencil
lookup and four disk tests. Its problem is that the four tests define coverage
and its stored quantity fuses source appearance with transported radiance. The
current local path violates the intended runtime bound by integrating atmosphere
over `sourcePathTransmittance.intervalCount` for each successful quarter ray and
each spectral channel.

Per-pixel transmittance remains compatible with `O(1)`: each covered pixel maps
its ray to lookup coordinates and samples a precomputed representation. For a
partially covered or unresolved emitter, one bounded representative ray, such
as the disk center or coverage centroid, may supply transport while analytic
coverage supplies energy.

## Projected Support And Visibility

Geometry owns projected center, apparent extent, horizon support, and scene
visibility when a consumer needs them. A finite sphere may use its screen
conic; a distant emitter may use its angular disk. A later diagnostic, locator,
energy-conserving source pass, or scientific measurement may request analytic
coverage in `[0,1]` and qualify it independently.

Ordinary rendering is not required to use analytic coverage or to keep a
subpixel Sun visible across phase, field of view, resolution, horizon
crossings, exposure, and display mapping. A bounded sampling scheme may return
no displayed disk in some conditions without failing the architecture.
Horizon/scene blocking and physical source availability must still remain
truthful; no layer may invent or enlarge support solely to force visibility.
When geometry classifies a distant Sun disk as `empty`, its visible renderer
must publish no screen claim even if the unmasked camera projection would land
inside the viewport. Scene masking remains a later occlusion operation and is
not a substitute for this geometry-owned source-availability classification.

## Celestial Object Families

### Distant Sun

The distant Sun is an emissive extended boundary disk. Geometry supplies its
direction placement, angular support, analytic coverage, horizon state, scene
visibility, and atmosphere lookup coordinates. The source supplies unattenuated
spectral boundary radiance. The atmosphere supplies view transmittance.

Its physical emitter is a sphere; the visible rendering contract intentionally
projects that sphere as a circular disk. Off-axis perspective does not turn the
renderer representation into an ellipse. This is a support/raster
simplification only and does not alter the source's illumination or atmospheric
scattering role.

### Local Sun

The local Sun is an emissive finite body outside the atmosphere. Geometry
supplies its finite position, physical support, ray/body intersection, analytic
coverage, visibility, and the corresponding atmosphere-boundary lookup
coordinates. Its unattenuated contribution becomes celestial boundary radiance
at that boundary and consumes the same view-transmittance operation as the
distant Sun, without performing a live extinction integral.

The finite source likewise remains physically spherical while its first visible
raster uses the shared circular-disk simplification. Finite distance still owns
parallax and apparent circular radius; it does not authorize an elliptical
screen primitive.

### Moon And Planets

The Moon and planets are reflective extended boundary bodies. Geometry owns
their placements, orientation, apparent support, parallax, phase relationships,
and eclipse/occlusion geometry. Their body models own surface albedo, texture,
and reflectance. Solar illumination and body reflectance produce unattenuated
boundary radiance; the observer's atmosphere then applies the same view-path
transmittance as for other external bodies.

### Stars

Stars are unresolved sources and do not reuse Sun-disk coverage or invented
physical radii. Catalog magnitude and spectrum produce integrated flux. A
normalized point-response kernel converts that flux to screen energy and must
conserve energy across FOV and resolution.

The selected first production kernel assigns each projected member to exactly
one screen pixel. It does not draw a disk, quad, sprite, or multi-pixel point.
Same-pixel collisions sum spectra without increasing raster support.

The accepted contained stellar-rendering experiment is owned by the completed
[Stellar Rendering Plan](stellar-rendering-plan.md), with its representation
owned by the
[Stellar Screen-Palette Cache Design](stellar-screen-palette-design.md). The
selected view product is one unsigned-integer screen matrix indexing a
native-15 palette, never a persistent `width x height x 15` spectral field.
The first exact path uses one `Uint16` palette entry per occupied pixel and adds
all same-pixel stellar spectra channel by channel. Qualified-close palette
sharing and `Uint8` matrix rewriting are later independent optimizations.

The full-screen shader does not iterate the star catalog. An instanced, tiled,
direction-indexed, or pre-rasterized stellar boundary-radiance representation
supplies a bounded runtime lookup. Atmospheric refraction or extinction belongs
to geometry/atmosphere; optical glare and display response remain later global
appearance layers.

## Display And Appearance Layers

Physical HDR composition precedes one source-independent Color boundary. The
current display mapper's exact-white plateau remains a separate defect. A
corrected celestial architecture cannot guarantee a credible final image until
the global output transform preserves useful warm-highlight relationships.

The production tree contains the experimental Ferwerda cone/rod changes as
`FerwerdaColorDisplayModel`, but their daylight and twilight appearance is
rejected and they are not the selected Color architecture.
`BrunetonColorDisplayModel` remains the unchanged comparison implementation.
The accepted contained replacement consumes the complete composed native-15
field and one condition-wide receiver-local direct-source luminance after
atmosphere transmittance, without inspecting whether a pixel contains Sun,
stars, sky, ground, or scene geometry. Shared spectral-projection utilities may
be extracted where ownership supports it, but model-specific response and
display equations remain owned by the new implementation.

Flat32 still constructs the production Ferwerda model until a separately gated
port replaces it; production is unchanged by the contained Color lane. The
selected contained model projects atmosphere-transmitted receiver-local
native-15 direct-source irradiance to `E_v / pi`. A smooth logarithmic Hermite
curve maps that value from exact gamma `1` at `5 cd m^-2` to exact gamma
`0.125` at `0.001 cd m^-2`. Color applies unchanged Bruneton Figure 1 first,
then changes only photopic luminance and scales RGB together. Its effective
luminance gain is capped at `32768`, preventing arbitrarily small nonzero
values from receiving arbitrarily large relative amplification. The calculation
contains no elevation, twilight, source-kind, time, location, camera, viewport,
scattered-light, rod, or cone policy and therefore supports both
spherical/distant and Flat/local sources.

This also forbids treating the solar disk as a separate Color subject. The
renderer may retain atmospheric path radiance and celestial boundary radiance
as distinct physical contributions before their additive composition, but
Color receives only the composed per-pixel stimulus. One condition state and
one transform apply to every pixel, whether its radiance came from the Sun,
circumsolar scattering, ordinary sky, ground, or several of those terms. A Sun
mask, separate disk grade, disk-only exposure, or post-Color overlay would
violate this boundary.

### Light-Adapted Bruneton Primary Color

The retained Color architecture begins with the exact contained production
`BrunetonColorDisplayModel`. Its CIE 1931 native-spectrum projection and
unadjusted display mapping are the primary engine and the frozen visual base.
Earlier CAM16-output, receptor, MacLeod-Boynton, independent-channel,
fixed-exposure, endpoint, and scalar candidates are historical evidence only;
none is composed into the selected path.

Light adaptation is not modeled by truncating independently selected RGB high
and low values. Human adaptation changes sensitivity and response continuously
over the operating range. In photopic operation, model that first as one smooth
achromatic response controlled by valid condition-wide local-light luminance:

```text
composed native-15 radiance
  -> Bruneton CIE 1931 projection
  -> Bruneton scene-linear RGB and luminance Y
  -> smooth response Y_display = f(Y, L_A)
  -> one common RGB gain Y_display / Y
  -> Bruneton display mapping
```

The curve's effective low and high points are derived crossings, not clips or
free channel parameters. The curve must remain monotonic and continuous, and
the runtime state update remains fixed-cost: local light changes a bounded set
of global parameters while every pixel performs the same work. The transform
does not identify celestial objects or treat disk and sky separately.

Luminance adaptation and chromatic adaptation are distinct. The first candidate
uses local-light magnitude only and keeps a fixed neutral adapting white. The
direct solar spectrum is not automatically the adapting white; treating the
warm sunset Sun as white could discount the very chromatic relationship being
rendered. A later chromatic-adaptation step requires a defensible diffuse or
scene-illumination estimate and may use CAT16/CIECAM16 as its reference.

CIECAM16 is therefore a reference evaluator, not the selected rendering engine.
For fixed physical stimuli, sweep adapting luminance and retain its predicted
brightness, lightness, colorfulness, chroma, saturation, and hue. Those
relationships constrain the smallest Bruneton-compatible smooth response.
They do not authorize reuse of the prior rejected CAM16 mastering candidates.
This use follows the viewing-condition role of
[CIECAM16](https://www.cie.co.at/publications/cie-2016-colour-appearance-model-colour-management-systems-ciecam16),
while [human cone-adaptation evidence](https://doi.org/10.1167/6.11.5)
precludes claiming that one pair of hard thresholds reproduces the underlying
physiology.

This first lane is photopic. Mesopic/scotopic behavior is separate: rods change
spectral brightness sensitivity toward shorter wavelengths and color
discrimination progressively weakens. When the post-sunset control is enabled,
use a sourced photopic-to-mesopic model, beginning with
[CIE 191:2010](https://www.cie.co.at/publications/recommended-system-mesopic-photometry-based-visual-performance),
rather than imitating the Purkinje effect with RGB range endpoints.

Immutable reference run `000348-bruneton-light-adaptation-reference-sweep`
qualifies the initial photopic relationships without selecting a renderer. For
fixed absolute chromatic stimuli, increasing `L_A` from `1` to `10,000 cd/m2`
reduces CIECAM16 brightness `Q` to about `76%` and colorfulness `M` to about
`23-24%`, with defined hue drift below `0.563 degrees`. That asymmetric patch
experiment is not a claim about a real sky: the patch is held fixed while its
adapting field becomes thousands of times brighter. When stimulus intensity
instead increases in direct proportion to `L_A`, which is closer to an
illuminated field brightening coherently, relative lightness `J` remains nearly
constant while `Q` grows about `6.7x`, `M` about `2.17x`, and hue remains stable.
The architecture therefore needs an achromatic response that is smoothly
compressive rather than a moving clip, and it must not use relative lightness
alone as its absolute brightness coordinate. Luminance-dependent colorfulness
remains a separate later operation; the first curve-selection step changes
brightness only. Correct production sky fields remain the required visual
validation.

Research `3R-G` in
[Global Normal Color-Rendering Research](global-normal-color-rendering-research.md)
clarifies that source-independent does not mean spatially context-free. A
global Color owner may derive bounded adaptation fields from the complete
composed view and use them uniformly without identifying objects. The rejected
preserve-`M` candidate instead applied a single direct-Sun-derived adapting
state pointwise and drove most atmosphere pixels to the display boundary.
Deterministic full-view measurement `2B-M` is therefore required before another
`Normal` candidate.

### Normal Observer, Camera, And Diagnostic Modes

The default experiential output is `Normal`: a referenced population-average
human observer, not a camera exposure and not an individually configurable eye.
Standard-observer and appearance-model references define how a declared viewing
condition is processed, but they do not supply one universal outdoor adapting
state. Differences among individual observers remain outside the default
requirement. The retained reasonable-`Normal` lane uses Bruneton's CIE 1931
projection and display model as its primary Color engine, with a future smooth
achromatic response controlled by valid condition-wide local-light magnitude.
CIECAM16 supplies reference appearance relationships only. The first candidate
keeps the adapting white fixed neutral and explicitly excludes mesopic rods,
ground bounce, scene content, and temporal history.

A later full-view adaptation mode will require the actual pre-display view field
and remains separate from the existing sparse sky-illuminance quadrature. That
deferred work does not gate direct-disk Color.

The prerequisite data audit, observer components, evidence requirements,
observer-proxy review, and one-variable comparison matrix are owned by the
[Normal Mode Test Plan](normal-mode-test-plan.md).
The authoritative findings and claim limits are owned by the
[Stage 2B Normal Reference Research](normal-color-stage2b-reference-research.md).

The existing Bruneton comparison is retained atmosphere qualification for the
paused Color resumption experiment. The
[Sun And Circumsolar Physics Expectations](sun-circumsolar-physics-expectations.md)
preserve optional future transport work but do not gate Stage 0 or lane `A`.
Frostbite remains subjective implementation evidence and does not set physical
acceptance tolerances.

All appearance modes consume the same wavelength-resolved camera radiance:

```text
physical spectral radiance
  -> Normal: population-average human response and referenced adaptation
  -> Camera: exposure plus sensor spectral response and development
  -> Diagnostic: spectral, XYZ/Y, chromaticity, and minimally mapped output
```

`Normal` may use referenced temporal and luminance adaptation, chromatic
adaptation, contrast response, and bounded glare needed to reproduce average
human appearance on a finite display. It must not be implemented as sky-derived
automatic camera exposure. The application declares one canonical viewing
condition and display target rather than asking users to configure observer age,
adaptation history, or physiological variation.

The camera-emulation experiment that pursued aperture, shutter time, ISO,
exposure compensation, metering, white balance, sensor profiles, and
development was declared a failure and stopped after run `000386`. Its
accepted mechanical results remain historical evidence only. `Diagnostic`
keeps a fixed declared exposure and preserves intermediate values for physical
validation. No stopped camera result changes atmosphere or celestial radiance.

### Camera Passing-Time And Timelapse Modes -- stopped

This proposed continuation is retained as historical architecture only. The
camera-emulation lane stopped before passing-time or timelapse implementation;
none of the modes or equations below is active work.

```text
clock
  -> geometry and physical composed spectral radiance
  -> deterministic camera metering
  -> target exposure in stops
  -> temporally smoothed exposure state
  -> sensor spectral integration, noise floor, and full-well clipping
  -> fixed white balance and camera-to-display conversion
  -> fixed development/tone response
  -> display
```

This is consistent with real interval-camera behavior. Nikon time-lapse
exposure smoothing explicitly smooths abrupt exposure changes, and Sony's
interval mode exposes low/mid/high AE tracking sensitivity so lower sensitivity
produces smoother exposure changes:

- <https://onlinemanual.nikonimglib.com/z7II_z6II/en/09_menu_guide_03_33.html>
- <https://helpguide.sony.net/ilc/2410/v1/en/contents/0407P_interval_shoot_setting.html>

Three named camera modes share the same physical spectral field:

1. **Manual Camera.** Aperture, shutter, ISO/gain, neutral density, white
   balance, and development remain fixed. This intentionally reveals the large
   physical brightness change over time and may underexpose dawn or clip noon.
2. **Auto Timelapse.** Aperture and white balance remain fixed; deterministic
   metering selects a target exposure, shutter ramps first, and ISO/gain changes
   only after a declared shutter limit. Target changes are smoothed in stop
   space. This is the default convincing sunrise-to-sunset camera presentation.
3. **HDR Timelapse.** Several declared simulated exposures are captured and
   combined before development. This may retain both disk and wider field, but
   it is explicitly computational photography rather than a single-exposure
   camera claim.

Camera metering must not be driven by direct solar irradiance alone. That value
remains useful physical evidence and lighting state, but reciprocal exposure
from the same direct source can normalize away the disk variation and does not
describe the viewed sky. Geometry instead owns a fixed angular metering pattern
such as center-weighted, whole-view average, or highlight-weighted. The pattern
queries the composed pre-display field at a bounded number of fixed directions;
it is independent of framebuffer resolution and source identity. Its sample
count is fixed and its transport values may be cache hits, so the runtime
remains essentially `O(1)`.

The baseline target exposure maps a declared metered luminance to a declared
camera middle gray:

```text
targetExposure = middleGray / meteredLuminance
targetExposure *= 2 ^ exposureCompensationEV
targetStops = log2(targetExposure)
```

The first baseline uses `middleGray = 0.18`. Metering pattern, middle gray, and
exposure compensation are named camera configuration, not values inferred from
a pleasing screenshot. A first-order stop-space state provides continuous
tracking:

```text
nextStops = currentStops
  + (targetStops - currentStops) * (1 - exp(-deltaTime / timeConstant))
```

The time constant belongs to a named AE tracking mode such as `Fast`, `Normal`,
or `Timelapse Smooth`; it is never changed because a particular Sun image looks
wrong. Offline animation may precompute and smooth the complete exposure
schedule so seeking, reverse playback, and repeated renders are deterministic.

The first Auto Timelapse reference keeps aperture near `f/8`, starts at
`ISO 100`, ramps shutter within declared bounds, and holds a daylight white
balance near `5500 K`. These are an authored generic-camera configuration, not
claims about every camera. Fixed white balance is required for the reference so
automatic white balance cannot remove sunrise/sunset warmth or introduce frame
to frame hue pumping. Auto white balance remains an optional separate camera
behavior.

Sensor capture precedes development:

```text
sensor electrons = integral(spectrum * sensor response)
  * aperture transmission * shutter time * optical transmission
raw signal = clamp(sensor electrons, black/read-noise floor, full well)
```

White balance, a documented camera-RGB-to-XYZ/display matrix, and a fixed
development curve follow that clip. RAW-channel clipping genuinely destroys
disk color; display clipping after RAW conversion does not. The reference must
report both boundaries separately.

The expected single-exposure Auto Timelapse behavior is deliberately
camera-like: a daytime disk may clip white, descend through pale yellow at low
elevation, and become yellow/orange only when atmospheric attenuation and the
current exposure bring its sensor channels below full well. The atmosphere and
sky should remain smoothly exposed. A mode that keeps the disk colored at all
times is HDR Timelapse, not the single-exposure default.

### Spectral-To-Camera Prior Art And Reuse Boundary

The canonical evidence and candidate audit for this section is the
[Camera Spectral-Color Prior-Art Research](camera-spectral-color-prior-art-research.md).

The first relative-camera architecture proof is accepted in immutable run
`000358-camera-relative-projection-stage8a` (artifact set
`69607f8d1a9339f6cc9d69a0c568cba85bd41ec25e80e55e66b2906d55b9d249`).
It confirms that one offline-compiled PBRT Canon EOS 5D Mark IV relative
`3 x 15` response matrix plus one fitted `3 x 3` output matrix preserves
the production field's noon-to-sunset raw chromatic separation across both
focused and wide views. This is an architectural and relative-color result,
not a physical named-camera exposure or saturation model. Stage 8b now owns
fixed-exposure full-frame presentation; absolute sensor behavior remains
separate Stage 8c work.

Stage 8b is technically qualified for owner review in immutable run
`000359-camera-fixed-exposure-stage8b` (artifact set
`279c374cc5d3396603c31a29d281e84fc8b0bcd5602e7f238015abeed75ba7d3`).
It proves that one fixed relative exposure calibration and stop bracket can be
applied uniformly to the complete focused and wide production spectra while
preserving their clock-dependent chromatic relationships. It also confirms
that relative PBRT response cannot justify raw full-well clipping: raw remains
unbounded and unclipped here, while the output display boundary is measured
separately. Physical raw clipping remains exclusively Stage 8c-owned.

The project owner does **not require a recoverable displayed solar disk under
any particular rendering condition**. Loss of the disk through occlusion,
bounded raster sampling, useful scene exposure, sensor/display clipping,
glare, or the global output transform is not by itself a transport, Color, or
appearance failure. Retain physical spectral radiance, geometry, and unclipped
contribution internally only where an existing physical or diagnostic contract
needs them.

Disk-preserving presentation is optional and feature-specific:

- Manual Camera may underexpose or apply a declared solar/neutral-density
  filter;
- HDR Timelapse may combine a short disk exposure with the scene exposure;
- diagnostic/source-inspection modes may expose direct-source radiance; and
- a geometry-owned locator or outline may provide application discoverability
  without changing the physical image.

Do not modify the spectrum, atmosphere transport, raster support, camera
matrix, or general Color transform merely to keep a visible disk. None of the
listed optional modes is required to recover it.

The first physical-camera-scale experiment is an EXIF-anchored generic-phone
case. It adopts the sourced Galaxy M01 photograph's exposure configuration
(`f/2.2`, `1/6444 s`, ISO 102, 2.26 mm, auto average metering, auto white
balance, sRGB) but does not claim that device. Absolute sensor quantities and
development remain individually sourced or visibly authored. Its central
physical test is pre-development: the sky remains below generic full well
while the Sun clips. Later white balance, development, and glare cannot be used
to conceal failure of that capture relationship.

That relationship is now accepted in immutable run
`000363-camera-generic-phone-stage8c` (artifact set
`06c581d4802ffc2598a76147edac62db0c4b93e2c3c954d562f8159a71242829`).
Across the complete declared `81`-combination sensor envelope, disk center
clips all raw channels while the named blue-sky samples clip none. In the
nominal case the disk is thousands of full wells above saturation and only
nine full-frame pixels clip. Raw clipping precedes fixed D55 white balance,
camera characterization, and display conversion; the fully clipped sensor
triplet becomes near white without any Sun-specific branch. Ordinary Camera
mode may therefore lose the disk boundary for a physically defensible reason.
The remaining appearance problem belongs to general post-capture development,
not atmosphere transport or disk preservation.

Camera emulation must now expose factorized controls rather than one opaque
global camera adjustment. Aperture, shutter, and ideal ND own photon exposure;
full well owns electron clipping; ISO/gain and ADC operate afterward; white
balance and the camera matrix own Color processing; development owns the final
look. Equal `t/N^2` settings must be reciprocal in the deterministic model,
while ISO must demonstrably not recover or create pre-gain electrons. Named
camera modes are compositions of these proven controls, never independent
Sun-rendering branches. Qualification uses baseline-relative independent
sweeps and a small curated set of frequent combinations; it must not enumerate
the factorial or Cartesian product of camera settings.

Glare is not part of the first Stage 8c case. Bloom, veiling glare, starbursts,
and lens ghosts remain a later optional optical-presentation concern after
capture scale, raw clipping, and sky development are qualified.

The repository currently has no general-purpose JavaScript spectral-color or
camera-simulation dependency. It has contained, purpose-specific CIE tables,
Bruneton projection weights, CIECAM16 equations, and proof code. A review of
available software also found no single drop-in JavaScript package that owns
the complete required path from absolute spectral radiance through physical
exposure, sensor saturation, white balance, camera characterization,
development, and display. The useful prior art divides cleanly into an offline
profile builder/reference oracle and a very small runtime transform.

The closest architectural reference is PBRT v4's
[PixelSensor](https://pbr-book.org/4ed/Cameras_and_Film/Film_and_Imaging).
PBRT projects spectral radiance through selectable measured camera response
curves, scales the result by an imaging ratio, and converts sensor RGB to XYZ
with a matrix fitted by linear least squares over measured color-chart
reflectances. It includes measured profiles for multiple Canon, Nikon, Sony,
and Hasselblad cameras as well as a CIE-1931 ideal observer. This supplies a
directly adaptable design and equations, although PBRT is not a complete
full-well, read-noise, or camera-development simulator.

For the fixed Algorithm32 basis, profile construction reduces the continuous
sensor integrals to three precomputed rows:

```text
K[c,i] = integral over bin i of sensorResponsivity[c](lambda)
raw[c] = exposureScale * sum over i of spectralRadiance[i] * K[c,i]
```

If the profile contains quantum efficiency rather than an energy
responsivity, construction must also include photon conversion
`lambda / (h*c)`, bin width, and the declared optical throughput/etendue. It
must not apply photon conversion twice when a measured responsivity already
contains it. The runtime therefore remains three fixed 15-term dot products,
followed by declared channel clipping, white balance, a `3 x 3` camera-to-XYZ
or camera-to-working-space matrix, and fixed development. Changing from an
ideal observer to a named camera changes data, not shader topology.

PBRT's least-squares camera characterization is also a good initial generic
profile method. Offline, project a set of measured reflectance patches under a
declared illuminant into both sensor RGB and reference XYZ, then solve one
over-constrained `3 x 3` map. Preserve the fitted matrix, illuminant identity,
sensor-response fingerprint, spectral-basis fingerprint, error report, and
stated license/provenance in the named camera profile. A measured manufacturer or
laboratory matrix may replace the fit when its conditions are compatible.

The Academy Software Foundation's
[rawtoaces](https://github.com/AcademySoftwareFoundation/rawtoaces) and
[rawtoaces-data](https://github.com/AcademySoftwareFoundation/rawtoaces-data)
provide a second strong reference. They prefer camera spectral sensitivities
and illuminant SPDs when available, derive white balance and a camera-to-ACES
matrix, and publish a unit-aware JSON spectral schema plus camera, illuminant,
CIE-1931, and training-patch datasets on a `380-780 nm`, `5 nm` grid. Adapt the
method and schema ideas. A contained concept proof may copy a dataset while
retaining its exact source, attribution, stated license, and measurement
provenance; redistribution and production-use clearance occur during
productization. Their higher-resolution curves
would be conservatively integrated into the existing 15 bins offline.

[EMVA 1288](https://www.emva.org/standards-technology/emva-1288/emva-standard-1288-downloads-2/)
is the reference for the later physical sensor limits. It separates quantum
efficiency, photon exposure, system gain, dark/read noise, saturation, and
full-well-related measurements. These parameters belong around the linear
spectral projection; they are not part of the camera-to-XYZ matrix. The camera
response literature states the same basic capture equation explicitly, for
example Buettner, Bobey, and Schlichting's
[spectral-sensitivity model](https://library.imaging.org/admin/apis/public/api/ist/website/downloadArticle/cgiv/3/1/art00014),
in which each channel is the exposure time multiplied by the wavelength
integral of incoming spectrum and channel sensitivity.

Useful software components have narrower roles:

- [CIE-JS](https://www.gerardharbers.com/cie_book/preface/) is a
  spectral-first Rust/WebAssembly library exposed to JavaScript. It supports
  configurable observers and displays and is the most conceptually aligned
  browser library found. Treat it as an evaluation/reference candidate until
  its source, versioning, offline availability, absolute-unit behavior, and
  reproducibility are audited; retain its stated license for productization
  review and do not depend on an unpinned remote module.
- [jsColorEngine](https://github.com/glennwilton/jsColorEngine) is an MPL-2.0
  JavaScript ICC engine with float and baked-LUT paths, standard observers,
  spectral measurement utilities, ICC profiles, and custom pipeline stages.
  It is promising after sensor RGB or XYZ for independent ICC/display testing
  and possibly offline LUT generation. Its advertised spectral path is aimed
  primarily at reflectance/transmittance under an illuminant, so it must not
  be assumed to preserve absolute emitted radiance without a focused audit.
- [Colour](https://github.com/colour-science/colour), although Python rather
  than JavaScript, is the strongest broad reference oracle found for spectral
  alignment/integration, observers, camera characterization, chromatic
  adaptation, RGB spaces, and appearance models. Use it in offline proof, not
  in the frame loop.
- [Color.js](https://colorjs.io/docs/) remains useful after XYZ for color-space
  conversion, chromatic adaptation, and gamut experiments. It does not replace
  the spectral sensor integration or physical exposure model.
- The npm package
  [color-spectrum](https://www.npmjs.com/package/color-spectrum) can integrate
  a generic list against a `5 nm` CIE-1931 table, but its default normalization
  and implicit stretching of the supplied list across `380-780 nm` conflict
  with the unit-bearing fixed Algorithm32 bins. It is suitable only as a small
  independent diagnostic after those behaviors are disabled and verified.
- [Spectral.js](https://github.com/rvanwijnen/spectral.js/) solves the inverse
  and materially different problem of reconstructing reflectance from RGB for
  Kubelka-Munk pigment mixing. It must not be used for atmospheric radiance or
  camera capture.

The reuse decision is therefore to retain an explicit project-owned runtime
boundary rather than adopt a monolithic color package. Adapt PBRT/rawtoaces
profile construction offline, validate it against Colour and at least one
independent implementation, and compile every accepted observer or camera to a
versioned `3 x 15` response matrix plus a `3 x 3` output matrix. A library may
own ICC conversion or bake a LUT after sensor capture, but exposure,
full-well/noise behavior, and preservation of absolute radiance remain explicit
project contracts. This gives the requested camera flexibility without adding
per-frame spectral-library machinery.

The previously selected contained ACES 2.0-referenced transform remains useful
research, but its short loop and formal qualification are paused. It is not an
accepted production transform, and this architecture decision does not resume
its CTL/OpenColorIO grid.

### Frostbite-Informed Exposure Revisit

Revisit exposure after the boundary-radiance and raw-color path can be observed
without ambiguity. The rejected sky-derived automatic-exposure experiment does
not establish that exposure is irrelevant: its twilight gain could amplify a
dark sky by orders of magnitude and drive the independently mapped RGB channels
onto the same white plateau. That is materially different from Frostbite's
stated use of a low-exposure dusk or dawn setup to prevent the directly visible
Sun from blooming out the image.

The revisit must test Frostbite's complete relationship rather than an isolated
exposure knob:

1. derive unattenuated celestial boundary radiance from a unit-bearing source
   quantity and projected solid angle;
2. apply atmosphere-owned per-pixel transmittance before display;
3. inspect the resulting raw spectrum, XYZ/Y, and signed scene-linear RGB;
4. apply one deliberately low, global dusk/dawn exposure with automatic
   adaptation disabled; and
5. pass the exposed result through a joint highlight/chroma/gamut operation and
   declared display encoding.

Compare the disk and circumsolar field at matched sample locations before and
after every stage. The experiment must determine whether correct transmittance
and a low global exposure retain the warm disk relationship before evaluating a
replacement output transform. It may not introduce a Sun-specific exposure,
brightness correction, independently tuned RGB curve, or screenshot-derived
physical parameter. Frostbite does not document its complete final output
transform, so its screenshots are architectural evidence for this revisit, not
a display-color oracle.

Circumsolar atmospheric light is path radiance, not direct-Sun transmittance.
Optical or perceptual glare is a camera/eye/display response, not atmospheric
transport. Limb darkening is an emitter profile. Refraction and horizon shape
are geometry/atmosphere concerns. None may be inserted as a Sun-specific
brightness correction.

Offline construction, diagnostics, and proof runners may use bounded iteration.
Any runtime appearance pass, including future glare, retains a fixed per-pixel
bound and measured frame cost.

## Paused Color Resumption Gate

No production implementation or exhaustive qualification begins from this
document alone. On explicit resumption, the retained plan first freezes
spectral Sun and surrounding-sky measurements across the declared spherical
and Flat noon/sunset matrices. A new Color lane consumes those values without
live atmosphere, first for an isolated analytic disk and then for recorded
spectral sky composition.

The existing Bruneton-derived Color implementation remains an unchanged `B`
comparison. Only the new `A` lane is an experiment surface. Live atmosphere and
full-frame rendering return after lane `A` preserves credible chromatic
relationships for the frozen inputs. Acceptance still does not qualify caches,
production integration, or every output device.

The first isolated-disk diagnostic is accepted in immutable run
`000263-spectral-color-stage2-isolated-disk`. Its source-independent logarithmic
luminance map plus joint same-luminance gamut intersection preserved all 25
eligible disk distinctions without an exact-white result, while frozen lane `B`
mapped all 25 to exact white. This proves the Color boundary can preserve the
transported relationships; it does not establish that the diagnostic scale is
population-average vision. Research `2B-R` subsequently established that a
published fixed example condition cannot qualify outdoor population-average
vision. Direct wavelength-resolved irradiance remains retained source evidence.
The project has narrowed the objective to a reasonable global receptor model;
full-view prerequisite `2B-M` is optional future image-appearance research and
does not block the retained candidate.

The unchanged official ACES 2/Hellwig 2022 100-nit comparison was subsequently
rejected in run `000265-spectral-color-stage2-normal-comparison`: its prior
fixed scene scale collapsed all 25 absolute-luminance disk inputs to the same
near-white triplet. The architecture remains correct—one Color boundary sees
the transported spectrum—but an appearance transform still needs a referenced
normalization from absolute spectral luminance and declared adaptation state.
This normalization is Color-owned and global; it is not a Sun correction or an
atmosphere/cache concern.

The observer equations, destination display, direct-solar metric, and optional
equivalent diffuse-luminance proxy are fixed by the Stage 2B research record.
The retained disk candidate needs no new atmosphere or viewport measurement
when that work resumes.

## Disk-Persisted Cache Revisit

The focused
[solar-zenith cache design](../algorithm32/cache/solar-zenith-cache-design.md)
now owns the spherical branch-integrated atmosphere field, its unresolved
coordinate-chunk fork, Native15 payload, bounded residency, codec study, and
compatibility identity. It does not yet select `mu_s` pages as the physical
layout. This section retains the general persistence, atomicity, and immutable-
evidence requirements shared by appearance-related cache artifacts.

The Stage 1 acquisition confirms that repeated current Flat/local construction
is expensive: the complete sharded matrix took `877.726 s` even though its
spectral ledger is now frozen and Color iteration no longer pays that cost.
The cache revisit should evaluate building reusable caches once and persisting
them to disk, especially for retry, restart, and offline authoring workflows.

A persisted cache is valid only when addressed by all facts that can change its
physical or numerical contents. Its key must include the atmosphere definition,
spectral basis, source radiometry and support, geometry/cache parameterization,
the applicable canonical-shell/source-frame policy, numerical profile and
maximum scattering order, backend representation, precision, and cache schema
version. A finite/local placement may be identity-bound; the solar-zenith
distant asset deliberately excludes changing Sun direction and selects
coordinates/chunks instead. The canonical solar-zenith design owns that exact
distinction.
Records must be written atomically with a manifest, byte lengths, per-artifact
checksums, and a completed-state marker. A partial, stale, incompatible, or
unverifiable record is a cache miss, never a best-effort input.

The revisit must distinguish two reuse claims:

- exact reuse of identical cache content after restart; and
- transform reuse of one canonical local-Sun or distant-shell field across
  placements.

The second claim needs its own proof that the transform preserves source,
observer, atmosphere-boundary, and any observer-centered dome semantics. Disk
persistence does not make an invalid transform correct. Cache loading may occur
offline or during bounded initialization; the runtime shader still performs
only fixed-cost lookups.

Under current experiment containment, generated cache files remain below
`tmp/extraterrestrial/` and may be reused by later contained experiments. The
source run and cache artifacts remain immutable and intact; copies, derivatives,
and new results go into a new run. A consuming experiment records the source
and physical/numerical compatibility identities needed to support its claim.
Promotion of a cache into production remains a separate explicit decision.

## Ozone Qualification Status

The sourced canonical ozone profile and contained ozone-off/on B1 diagnostics
described above are complete. Production remains unchanged and ozone remains
separate from Color; those executions are diagnostic evidence, not a production
atmosphere selection.

Acceptance also requires Bruneton transport non-regression. Against a reference
with matched ozone physics and numerical configuration, aggregate physical
spectral-radiance RMSE must be no greater than the accepted `11.820392`
`mW m^-2 sr^-1 nm^-1` except for the comparison's existing numerical tolerance.
Ozone-off remains an exact compatibility control. Display-RGB RMSE is reported
separately and cannot stand in for this physical transport gate.

The existing pinned 17-condition Bruneton comparison is a deliberate no-ozone
profile. This differs from Bruneton's downloaded Earth demo, which enables a
`300 DU` ozone layer by default with bin-averaged cross sections and a linear
10--25--40 km density profile. The ozone-on gate therefore needs a new matched
Bruneton reference while preserving the existing no-ozone table as the exact
compatibility control.

For the first implementation and qualification run, Bruneton's ozone definition
is the comparison parameter rather than merely external context. Algorithm32
and Bruneton both use its `300 DU`, 10--25--40 km density profile and retained
bin-averaged `233 K` cross sections. All non-ozone B1 comparison parameters stay
matched. A different ozone climatology, measured column, temperature series, or
cross-section dataset is a later named composition and cannot be mixed into
this qualification.

## Deferred Work

- implementation and qualification of the separately selected solar-zenith
  cache topology, transformed-source reuse, and invalidation contract;
- exact public placement and transmittance types;
- production port and regression coverage;
- Frostbite-informed low-exposure dusk/dawn evaluation, with automatic
  adaptation disabled;
- focused selection and qualification of the referenced population-average
  `Normal` observer and canonical viewing condition;
- camera exposure, sensor-profile, and diagnostic appearance modes;
- output-transform selection and qualification;
- CPU/GPU and refined transport parity;
- limb darkening, atmospheric refraction, dispersion, and green flash;
- circumsolar approximation, glare, and exposure controls;
- Moon reflectance and eclipse model; and
- stellar appearance work beyond the accepted screen-palette representation
  and paused production-port round.

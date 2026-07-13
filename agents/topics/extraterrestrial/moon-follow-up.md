# Resolved Moon Follow-Up

Status: deferred capability design note. This work is not part of the active
Sun-and-stars implementation family or its Stage 12 acceptance boundary.

## Deferred Decision

The active `spherical-sun-stars-radial-v1` family contains no Moon source,
finite-body layer, Moon/star foreground edge, lunar placement state, or lunar
acceptance fixture. Stage 12 may implement and qualify the Sun and aggregate
star field without selecting a lunar ephemeris, shape, texture, radiometry, or
renderer path.

The later Moon should be treated as an oriented finite celestial surface
behind the terrestrial atmosphere, not as an authored screen-space disk or an
RGB overlay. The analytic sphere/disk work and the closed external experiment
remain useful mechanics evidence, but neither is an implementation dependency
or a claim that the resolved Moon has been designed.

## Intended Spectral Render Path

For a surface point `q`, outgoing direction toward the observer `v`, and
incident directions over the visible solar disk `omegaSun`, the lunar
surface-radiance owner must eventually evaluate a declared spectral reflection
model:

```text
L_moon_toa(q, v, lambda)
  = integral over visible solar disk of
      f_moon(q, omegaSun, v, lambda)
      * L_sun(omegaSun, lambda)
      * max(0, normal(q) dot omegaSun)
    dOmegaSun
```

The terrestrial atmosphere then transports that still-spectral result:

```text
L_camera(lambda)
  = L_atmosphere_path(lambda)
    + T_atmosphere(observer, directionToMoon, lambda)
      * L_moon_toa(lambda)
```

Pixel-footprint integration occurs before the one Color boundary. A dark or
unlit lunar sample remains opaque; zero radiance must never be interpreted as
transparency.

## Intended Renderer Shape

A resolved Moon may use a separate celestial 3D surface pass:

1. Geometry places and orients a sphere or qualified lunar shape from the
   evaluated Moon state, observation state, and body-fixed frame.
2. Rasterization supplies surface coverage, body-fixed texture coordinates,
   normal/tangent data, and a celestial depth or mask.
3. A spectral lunar material evaluates the body-fixed surface data under the
   current spectral Sun illumination.
4. A cache-owned transport query applies the terrestrial atmospheric response
   to that live spectral surface radiance.
5. Algorithm32 adds the transported Moon result to atmosphere path radiance.
6. Color performs the only spectral-to-display conversion.

The renderer may use a scaled or camera-relative Moon mesh to avoid ordinary
depth-buffer precision loss, but geometry must retain the physical
observer-to-Moon placement, apparent support, and ordering facts. An ordinary
RGB material behind a scalar-alpha atmosphere is not an equivalent path.

## Ownership To Freeze Before Implementation

- The **Moon state provider** owns position and body orientation in named
  frames at a declared epoch and time scale.
- **Geometry** owns observer-relative transforms, apparent support, physical
  depth, ray/shape intersections, surface normals, body-fixed coordinates,
  Sun and observer directions at the surface, and lunar opacity used for
  celestial ordering.
- The **Sun source** remains the sole owner of incident solar spectral
  radiometry.
- The **Moon radiometry owner** owns the spectral albedo or radiance texture,
  BRDF/photometric model, normalization, provenance, and uncertainty. It must
  declare whether illumination is live or already baked; the two paths cannot
  be applied together.
- The **celestial transport cache** owns application of terrestrial
  atmospheric transport. A resolved-surface family may privately cache a
  channel-wise unit-radiance transport operator, but its public query must
  return the complete transported spectrum so the caller cannot apply
  transmittance twice.
- The **renderer** owns surface rasterization, sampling/filtering policy,
  pixel integration, and live scene visibility.
- **Algorithm32 and Color** own pre-display spectral composition and the one
  display conversion.

## Required Follow-Up Design Decisions

Before implementation, select and fingerprint:

- lunar shape, radius convention, body-fixed axes, texture projection, and
  mesh-versus-analytic intersection contract;
- ephemeris/body-orientation provider, celestial frames, epoch, time scale,
  observer state, and objective accuracy cases;
- spectral texture or reflectance reconstruction, BRDF/photometric law,
  normal/topography policy, and source-data provenance;
- finite versus extended solar illumination, phase/terminator behavior, and
  whether eclipses, Earthshine, terrain shadows, opposition behavior, and
  thermal emission are in the first resolved-Moon family;
- the cache-private transport factorization and its invalidation boundary;
- celestial depth/mask precision, Moon-over-star exact-direction visibility,
  partial-pixel limb integration, and CPU/GPU parity policy; and
- numerical, resource, build-time, and frame-time budgets.

An RGB lunar texture may be used only by a separately labeled presentation
path. A physical path requires spectral reflectance/radiance data or a
declared and independently qualified spectral reconstruction.

## Observable Entry And Exit

The follow-up is ready to implement only when one executable contract freezes
all owners and decisions above and proves that camera/FOV/viewport changes do
not enter the atmospheric-field fingerprint.

The first resolved-Moon family is complete only when reproducible CPU and GPU
evidence shows:

- named lunar landmarks have the expected observer-specific orientation at
  multiple epochs and geographic receivers;
- full, quarter, crescent, and new-Moon fixtures produce the declared
  terminator and phase behavior from spectral Sun illumination;
- the unlit Moon remains opaque and blocks only exact star directions behind
  its physical support;
- limb coverage and surface filtering converge under camera rotation, FOV,
  projection, and resolution changes;
- atmospheric attenuation and path brightening satisfy
  `L_path + T * L_moon` in every spectral channel without a second
  transmittance, lighting, coverage, or Color operation; and
- publication, replacement, failure, context restoration, and disposal meet
  the selected lifecycle and resource budgets.

Until that record exists, Moon rendering, Moon/star occlusion, lunar surface
lighting, and lunar calibration remain deferred and must not be inferred from
the active Sun-and-stars family.

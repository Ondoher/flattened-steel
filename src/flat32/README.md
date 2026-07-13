# `flat32` Application Migration

This directory contains the runnable Stage 11 application and the completed
Stage 11.2 production-atmosphere attachment. Focused local owners
provide the DOM shell, a host-sized Three renderer at the browser device-pixel
ratio,
camera, direct-render fallback, ordinary matte scene content, setup/failure
state, frame lifecycle, and owned cleanup.

The source lights retain the checkpoint's six isolated review-object shadow
maps, but their direction and direct/twilight-aware ambient intensities now
follow the active spherical/distant source time.
The checkpoint also installs the source application's six isolated
4096-by-4096 PCF-soft shadow maps with the source's PCF fallback, exact
per-object orthographic cameras and tuning, and focus points. The six review
objects cast and receive on unique layers 1 through 6, while the ground
receives every layer. Because this checkpoint's scene and source are fixed,
the renderer generates all six maps once and reuses them on later frames. A
future scene, object, or source update must explicitly invalidate the affected
maps.

`SphericalDistantMode` supplies the current unit-bearing spherical geometry,
distant Sun, native production profile, canonical black ground, complete
Native-48/reflection-completed-Fibonacci-68/W27/native-15 domains, and the ordinary N4 request.
`FlatLocalMode` supplies the same reflection-completed source-oriented Fibonacci-68 incoming quadrature as
the validated spherical/distant path, with the source-derived 2,048-shell local-Sun path at N4.
It also enables the exact configured local light source as the finite visible
Sun. Algorithm32 constructs its dedicated scalar `R32F` radiance field and
the final shader resolves the finite body, atmosphere segment, four-sample
pixel coverage, and matched scene visibility before the shared pre-Color
composition.
Its final-view geometry uses the accepted
observer-centered dome with a 100 km apex and 1,926,774 m maximum view-ray
extent; this removes the sharp near-horizon discontinuity without changing
cache construction.
`Algorithm32Runtime` keeps direct rendering active while it builds the
source-owned GPU cache, prepares the final runtime program, and preflights an
actual composed frame. It installs the Algorithm32 render operation only after
that frame reports runnable programs and zero runtime/link/WebGL errors.
Failure leaves the direct scene active and disposes the candidate resources.

The retained direct-scene and composed-output pixels are diagnostic telemetry,
not publication tests. Completely black scene and output color are valid;
runtime execution health alone owns preflight acceptance.

Cache programs use Three's asynchronous compilation readiness, and the
application scheduler yields between completed wavelength layers. The final
transport and cache construction use the production default of 15 uniform
intervals. The final-view count remains a runtime integer uniform to avoid
ANGLE's pathological compile-time unrolling. The host viewport determines
scene capture and final-composition resolution only. It does not reduce the
production cache domains or the six 4096 shadow maps.

The composer captures the ordinary Three scene in a half-float renderer-linear
sRGB target before the atmosphere pass. Ferwerda preserves those linear channel
ratios and multiplies them by source-owned `sourceBrightness` to place the
relative renderer result on its luminance scale. It does not display-encode the
capture or apply Bruneton's inverse exponential. The retained E8 projection maps atmospheric native-15 path radiance to linear sRGB;
the compositor averages spectral
transmittance into RGB bands, attenuates the captured scene for an
in-atmosphere endpoint, and combines both terms at the single display
boundary. Scene RGB is not atmospheric cache or transport data.

Both Flat32 modes always use `FerwerdaColorDisplayModel`. During setup,
Algorithm32 asks `LocalLightLevelCalculator` for a camera-independent
`brightnessProxy`. It photopically projects receiver-local native-15 source
irradiance after geometry-owned visible support; it has no elevation or
twilight curve. The result drives the one condition-wide Ferwerda
mapping; an externally supplied exact zero is protected at `1e-6 cd m^-2`.
There is no atmosphere-cache readback, sky quadrature, location/time control
table, framebuffer measurement, or Bruneton runtime fallback.

The demonstration's distant-Sun ambient light reaches exact zero with its
twilight scale. There is no positive nighttime fill for Ferwerda's rod response
to amplify.

The current Stage 9.6 browser lane passes `3/3` in Chrome Headless 150 on
D3D11 at N4. It covers the application transition/source/update path and both
transactional failure paths. Failed candidates preserve and republish the
last valid runtime, while unowned mode, composer, and render-target resources
are disposed. The exact flat/local diagnostic reached ready state in 108.656
seconds with zero page errors and no sharp white horizon line. These timings
use the software ANGLE renderer and do not qualify supported hardware.

The application being adapted remains in `C:\dev\poly-gc-react`, with its
entry at `C:\dev\poly-gc-react\src\flat32\index.js`. It is migration evidence,
not a runtime or build dependency. Its earlier shader captured the Three scene
color, kept atmospheric path radiance and transmittance spectral, and combined
scene RGB at the final display boundary. Current production preserves that
Star algorithm while recasting it through the local ownership and type
contracts. The temporary `MatteEndpointTexture` and composer endpoint adapter
were removed.

The canonical migration boundary and acceptance gate are owned by the
[Algorithm32 production implementation plan](../../agents/topics/algorithm32/production/production-implementation-plan.md#11-integrate-flat32).

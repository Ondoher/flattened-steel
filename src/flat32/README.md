# `flat32` Application Migration

This directory contains the runnable Stage 11 application and the completed
Stage 11.2 production-atmosphere attachment. Focused local owners
provide the DOM shell, a host-sized Three renderer at the browser device-pixel
ratio,
camera, direct-render fallback, ordinary matte scene content, setup/failure
state, frame lifecycle, and owned cleanup.

The source lights retain the checkpoint's six isolated review-object shadow
maps. In spherical/distant mode their direction and signed linear color/
intensity now come from the installed receiver generation's Native15 direct-
normal and diffuse-horizontal packets before composed-frame preflight. Distant
diffuse uses a black-ground upper-hemisphere light, preserving the measured
horizontal response while giving vertical and downward surfaces distinct
uniform-upper-sky responses. Before assigning Three's unitless renderer-linear
light values, the adapter maps physical E8 channels through the unchanged
Figure-1 exponential and inverse sRGB; the normal captured-scene bridge
reverses that representation without changing Color. The `Atmosphere Shader`
button can bypass only
final Algorithm32 composition to inspect this lit Three scene. The inspection
path retains linear HDR scene rendering and applies only the fixed Bruneton
renderer-linear-to-display conversion and sRGB encoding, preventing HDR values
from clipping the default framebuffer white without reapplying the physical-
radiance exposure to renderer-scale lights.
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
`Algorithm32Runtime` keeps direct rendering active while spherical/distant
loads its exact offline cache or flat/local builds its source-owned GPU cache,
prepares the final runtime program, and preflights an actual composed frame.
It installs the Algorithm32 render operation only after that frame reports
runnable programs and zero runtime/link/WebGL errors. Failure leaves the direct
scene active and disposes the candidate resources.

The browser derives the live distant-Sun direction and scalar solar zenith,
then resolves the latter through the document-relative
`api/distant-sun-scene-cache` endpoint. Under the ordinary Polylith host this
is `/flat32/api/distant-sun-scene-cache`; returned immutable files live below
`/flat32/scene-caches/`. The server validates the package report and catalog
hash once, and the browser independently validates every selected manifest and
payload. Set `FLAT32_DISTANT_SUN_CACHE_ROOT` to the deployed package-set root;
local omission selects the qualified generated package set at
`server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1`.

The retained direct-scene and composed-output pixels are diagnostic telemetry,
not publication tests. Completely black scene and output color are valid;
runtime execution health alone owns preflight acceptance.

Cache programs use Three's asynchronous compilation readiness, and the
application scheduler yields between completed wavelength layers. Flat/local
retains the production 15-interval controls; spherical/distant consumes its
offline cache with the qualified quadratic-near-observer Q30 final transport.
The final-view count remains a runtime integer uniform to avoid ANGLE's
pathological compile-time unrolling. Its point-local cache validates the
exact-seam source package, transposes unchanged Native15 values into a logical
W27 RGBA32F face-grid atlas, and lets hardware bilinear filtering replace four
manual outgoing-direction taps. Four packed rows and four RGBA spectral groups
leave at most 16 atlas reads per Q30 path point. The host viewport determines
scene capture and
final-composition resolution only. It does not reduce the production cache
domains or the six 4096 shadow maps.

The composer captures the ordinary Three scene in a half-float renderer-linear
sRGB target before the atmosphere pass. The retained E8 projection maps
atmospheric native-15 path radiance to linear sRGB;
the compositor averages spectral
transmittance into RGB bands, attenuates the captured scene for an
in-atmosphere endpoint, and combines both terms at the single display
boundary. Scene RGB is not atmospheric cache or transport data.

The ordinary application uses the fixed `ColorResetSlope078P9ColorDisplayModel`.
Algorithm32 publishes one camera-independent total-horizontal photopic-
illuminance condition from the same atomic receiver-light generation as the
direct and diffuse spectra. Color Reset applies its fixed common source-linear
gain before the unchanged Bruneton Figure-1 display encoding. It does not read
time labels, solar zenith, the camera, framebuffer pixels, or source classes.
`basic-bruneton` remains the exact unadjusted physical and B1 control.

Color, celestial enablement, stellar catalog, and ordered presentation filters
now use independent exact selections. `basic-bruneton` no longer disables
celestial sources, and `color-reset-slope-078-p9` selects the implemented fixed
candidate and is now the omission/default behavior. The live application
retains `?colorModel=basic-bruneton` as its exact control query value; the
superseded source-luminance-lift route has been removed and unknown values
fail closed. Brightest-2,000 and enabled-
filter selections are recognized independently. Brightest-2,000 is implemented
through an authenticated local-only package and may be exercised with
`?stellarCatalog=brightest-2000`; absence or mutation of that package fails
closed. `?stellarCatalog=brightest-500` selects the retained catalog control.
P7 installs the enabled source-linear stellar hook and authenticates
its local scotopic-weight input.
`?stellarPresentation=physical|chroma|mesopic|human` selects the exact
physical, chroma-only, mesopic-only, or ordered full-chain path. Missing or
altered mesopic data fails closed, as do enabled filters in unsupported
Flat/local and Ferwerda control combinations. The catalog default is
brightest-2,000, presentation defaults to `human`, and neither
catalog nor filter selection changes one-pixel `q=24` behavior.
The application strips stellar-only filters while operating in Flat/local,
which has no star source, and restores them on return to spherical/distant.
The production policy applies q24 as the effective boundary scale
`1,463,996.1476640578` derived from the retained q1 reference scale and fixed
CR6C multiplier; it does not enlarge the one-pixel raster footprint.
The `spherical-color-reset-sunset-facing-production-n4` diagnostic retains the
ordinary architecture but fixes the CR6/CR7 640-by-400 comparison camera at
78 degrees vertical field of view, azimuth `-59.99625193137896` degrees, and
elevation `5` degrees without overriding the production Color/catalog
defaults. The `-bruneton-n4` variant explicitly selects Basic Bruneton.

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

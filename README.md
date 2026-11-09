# Flattened Steel: Flat Earth and Globe Earth

Flattened Steel compares what two specified models predict for the same location
and time. **Flat Earth** uses a polar map, a nearby Sun and a rotating stellar
dome. **Globe Earth** uses a spherical surface, a distant Sun and a rotating
celestial coordinate system.

This page explains where the Sun and stars are placed and how illumination is
calculated. Its purpose is to make the assumptions and calculations inspectable,
including for someone skeptical of either model. A rendered image is a prediction
of the selected geometry, source parameters and display settings; its appearance
alone does not establish that those choices describe the real world.

The current views include the Sun and a catalog of 2,000 stars, including Polaris.
They do not currently calculate Moon or planet positions. Atmospheric scattering
is used to render the sky, but its simulation is outside this explanation.

## Contents

- [Basic Flat model assumptions](#basic-flat-model-assumptions)
- [Reading the equations](#reading-the-equations)
- [The Sun: a shared date and time calculation](#the-sun-a-shared-date-and-time-calculation)
- [Flat Earth: placing the Sun over a polar map](#flat-earth-placing-the-sun-over-a-polar-map)
- [Globe Earth: expressing the distant Sun in the local sky](#globe-earth-expressing-the-distant-sun-in-the-local-sky)
  - [A placement comparison you can check by hand](#a-placement-comparison-you-can-check-by-hand)
- [Stars: the same catalog, two different placements](#stars-the-same-catalog-two-different-placements)
  - [Globe stars: precession, sidereal rotation, then local direction](#globe-stars-precession-sidereal-rotation-then-local-direction)
  - [Flat stars: a rotating polar dome](#flat-stars-a-rotating-polar-dome)
- [How light levels are calculated](#how-light-levels-are-calculated)
  - [Direct sunlight: source strength, distance and transmission](#direct-sunlight-source-strength-distance-and-transmission)
  - [Diffuse sky light and total illumination](#diffuse-sky-light-and-total-illumination)
  - [From energy to lux, ground color and screen brightness](#from-energy-to-lux-ground-color-and-screen-brightness)

## Basic Flat model assumptions

These are the model choices and calibration intent, collected here for review.
The sections below give the current equations and links to their implementation.

| Assumption | Choice or intended target |
| --- | --- |
| Distance above the surface | The Sun's center stays **4,828.032 km** above the flat plane. It does not rise or fall during its daily orbit. |
| Radius | The Sun's physical radius is **25.749504 km**. The polar map uses a **6,360 km** scale radius, placing the disk's outer rim about **19,980 km** from the North Pole. |
| Latitude calculation | Distance from the North Pole is proportional to **90° minus latitude**. The Sun's seasonal latitude comes from the same solar-declination calculation used by Globe, then maps onto the disk. |
| Time synchronization | Both views share one timestamp. The local Sun is anchored over Greenwich at the date's **calculated solar noon** (12:00 UTC minus the equation-of-time correction), then moves west **15° per elapsed hour**. Its seasonal latitude sets the orbit radius; reaching the observer's longitude marks closest approach. |
| Luminance synchronization | **Intended calibration:** at local solar noon at the date's subsolar latitude, the Sun is directly overhead in both views. Its brightness, color and sunlight reaching the ground should match under the same viewing conditions. Disc size is excluded for now. The current **4,800 km** source normalization has not been verified against that target. |
| Stars synchronization | Both views use the **same 2,000-star catalog and timestamp**. Flat projects stars onto a finite dome and rotates it once per **86,164.0905 seconds**, with zero rotation at Unix epoch. Its stellar phase is **not automatically aligned with Globe's** sidereal/precession calculation. |

## Reading the equations

Start with latitude $\phi$, longitude $\lambda$, an absolute timestamp $t$ and
observer height $h$. Latitude is positive north; longitude is positive east.
The clock supplies one instant to both views. A time-zone label changes how that
instant is written, not where the objects are placed.

Unless marked otherwise, angles in the equations are **radians**: $\pi$ radians
is 180°. Lengths in one equation must use the same units. Sine and cosine turn
angles into coordinate components; $\sqrt{x^{2}+y^{2}+z^{2}}$ is a vector's length.
Dividing a vector by its length keeps its direction and gives it length one.

Both views ultimately need a direction $(e,n,u)$: east, north and up. From that
direction, altitude $a$ and compass bearing $A$ are:

$$
a=\mathrm{atan2}\left(u,\sqrt{e^{2}+n^{2}}\right),\qquad
A=\mathrm{atan2}(e,n)\pmod{2\pi}.
$$

Altitude is 0° at the local horizontal and 90° overhead. Bearing is 0° north,
90° east, 180° south and 270° west. `atan2` selects the correct quadrant.
Exactly overhead or underfoot, a compass bearing has no unique meaning.
Moving the camera changes the view of these directions; it does not move the
celestial objects or change the measured illumination.

## The Sun: a shared date and time calculation

First, both models calculate the same **subsolar latitude and longitude**:
the geographic coordinates directly beneath the Sun in the chosen model.
The geographic result is shared; its conversion into a physical position is not.

The code uses a NOAA-style approximation for solar declination and the equation
of time. Declination $\delta$ is the Sun's seasonal north/south angle. The
equation of time $q$ corrects the difference between a uniform 24-hour clock and
apparent solar time; it is expressed in minutes here.

Let $N$ be the one-based UTC day of the year and $Y$ its number of days, 365 or
366. **The implementation evaluates the seasonal terms at UTC noon for that
date**, so:

$$
\gamma=\frac{2\pi}{Y}(N-1).
$$

$$
\begin{aligned}
\delta={}&0.006918-0.399912\cos\gamma+0.070257\sin\gamma\\
&-0.006758\cos2\gamma+0.000907\sin2\gamma\\
&-0.002697\cos3\gamma+0.001480\sin3\gamma,\\[3pt]
q={}&229.18\bigl(0.000075+0.001868\cos\gamma-0.032077\sin\gamma\\
&\qquad-0.014615\cos2\gamma-0.040849\sin2\gamma\bigr).
\end{aligned}
$$

Let $t_{0}$ be that date's Greenwich apparent solar noon: UTC midnight plus
$(720-q)$ minutes. With time differences expressed in seconds, the subsolar
coordinates are:

$$
\phi_{s}=\delta,\qquad
\lambda_{s}=\mathrm{wrap}_{[-\pi,\pi)}
\left(-2\pi\frac{t-t_{0}}{86400}\right).
$$

Thus the Sun's subpoint moves westward once every 24 hours, while its latitude
changes seasonally. `wrap` means adding or subtracting full turns to express a
longitude between −180° and +180°. This is an approximate calendar model, not a
full orbital ephemeris: seasonal values are held constant within each UTC date.

**Code:** [shared solar calendar and subsolar coordinates](src/algorithm32/geometry-support/solar/SolarPosition.js).
This calculation runs on the CPU. The shaders receive its resulting placement;
they do not independently infer the date or run a second solar calendar.

## Flat Earth: placing the Sun over a polar map

The map is an azimuthal equidistant projection centered on the North Pole.
That means distance from the center is proportional to angular distance from
the North Pole. The equator is a circle; the South Pole maps to the outer rim,
rather than to one point. This choice fixes the model's geography.

The current map scale is $R=6{,}360\,\text{km}$. A geographic point maps to:

$$
r(\phi)=R\left(\frac{\pi}{2}-\phi\right),\qquad
x=r\sin\lambda,\qquad y=r\cos\lambda.
$$

Apply this once to the observer $(\phi,\lambda)$ and once to the Sun's subpoint
$(\phi_{s},\lambda_{s})$. The Sun's center is placed at the latter map coordinates
and a fixed height **$H=4{,}828.032\,\text{km}$** above the plane. Its physical
radius is **$r_{\odot}=25.749504\,\text{km}$**. These are selected model parameters,
not quantities recovered from the location entered by the user.

Subtract the observer's map coordinates from the Sun's, giving $\Delta x$ and
$\Delta y$. Rotate that displacement into the observer's compass frame:

$$
\begin{aligned}
e&=\Delta x\cos\lambda-\Delta y\sin\lambda,\\
n&=-\Delta x\sin\lambda-\Delta y\cos\lambda,\\
u&=H-h,\\
d&=\sqrt{e^{2}+n^{2}+u^{2}}.
\end{aligned}
$$

The apparent direction is $(e,n,u)/d$. The angle formulas above give its
altitude and bearing. This is ordinary perspective: the Sun looks lower as its
horizontal distance grows. Its geometric angular radius is:

$$
\alpha_{\odot}=\arcsin\left(\frac{r_{\odot}}{d}\right).
$$

The finite Sun therefore also looks smaller when farther away. For an observer
below $H$, its center remains geometrically above the flat plane at every
horizontal distance. Perspective alone does not move it below that plane;
attenuation and what the renderer makes visible are separate questions.

The **Degrees from closest** control is another way to select shared time. It
sets the angular offset along this daily orbit: 15° corresponds to one hour,
and 0° means the Sun's subpoint has the observer's longitude. For this circular
orbit, that is the closest horizontal approach. It does not change the Sun's
height or independently override one view's clock.

**Code:** [CPU Sun position and observer-relative projection, `_resolveLocalSourcePosition`](src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js#L170),
[selected Sun height, radius and distance calibration](src/algorithm32/implementation/local-sun/cache/LocalSunCompactProfileSelection.js#L46),
[closest-approach time conversion](src/algorithm32/implementation/flat-earth/synchronization/FlatSynchronizer.js).
The [geometry shader modules](src/algorithm32/implementation/flat-earth/FlatGeometryCacheModuleProvider.js)
use the finite source's position; [the Sun's GPU field builder](src/algorithm32/implementation/local-sun/celestial/FlatFiniteSunGpuBuilder.js)
and [screen shader](src/algorithm32/celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js)
provide the visible disk's rendering path.

## Globe Earth: expressing the distant Sun in the local sky

The globe uses a sphere of radius **$R=6{,}360\,\text{km}$**, rather than an
ellipsoid or terrain model. The Sun is treated as distant: its incoming rays
are parallel, and moving a few kilometers higher does not appreciably move its
calculated direction. Its selected angular radius is **0.004675 radians**, about
0.268°, giving an apparent diameter of about 0.536°.

Let $\Delta\lambda=\lambda_{s}-\lambda$. Projecting the shared subsolar direction
onto the observer's east, north and up axes gives:

$$
\begin{aligned}
e&=\cos\delta\sin\Delta\lambda,\\
n&=\cos\phi\sin\delta-\sin\phi\cos\delta\cos\Delta\lambda,\\
u&=\sin\phi\sin\delta+\cos\phi\cos\delta\cos\Delta\lambda.
\end{aligned}
$$

This vector already has length one. Its up component determines whether the
Sun's center is above or below the local horizontal. At ground level the
solid globe blocks rays below that horizon. At height $h$, the geometric
horizon dips below horizontal by:

$$
\beta=\arccos\left(\frac{R}{R+h}\right).
$$

The renderer also accounts for the disk being partly hidden, rather than
switching the whole Sun on or off when its center crosses the horizon.

The Globe clock menu selects sunrise, solar noon or sunset by changing the
shared timestamp. Its sunrise/sunset condition is the upper edge meeting that
geometric horizon: Sun-center altitude $a=-\beta-\alpha_{\odot}$. It uses the
requested view elevation and the selected device-local date; unavailable polar
events remain unavailable. The [event calculation](src/flat/features/spherical-earth/solar-events.js)
uses the same Sun placement above and adds no atmospheric-refraction correction.

**Code:** [CPU distant-Sun direction and local coordinate conversion](src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js#L40),
[application Sun-size selection](src/flat/features/spherical-earth/runtime/SphericalEarthRuntime.js#L323),
[CPU and shader horizon/disk support](src/algorithm32/implementation/spherical-earth/celestial/SphericalCelestialContributionDomain.js),
and [shader's distant-source direction](src/algorithm32/implementation/distant-sun/DistantSunShaderContributor.js).

### A placement comparison you can check by hand

Consider an idealized instant with the Sun's subpoint at latitude 0°, longitude
0°, and an observer at latitude 0°, longitude 180°, at ground level. This fixes
the inputs without relying on an approximate equinox date.

| Result | Flat Earth | Globe Earth |
| --- | --- | --- |
| Separation used | Opposite points of the equatorial map circle: $\pi R\approx19{,}980\,\text{km}$ horizontally | Opposite sides of the sphere |
| Sun-center altitude | $\arctan(H/(\pi R))\approx13.6°$ above horizontal | −90°, directly underfoot |
| Ground obstruction | The plane does not obstruct the Sun above it | The globe obstructs it |

This difference follows from the geometry before any atmosphere or display
exposure is applied. It is a prediction to compare with observation, not a
brightness setting used to force a particular sunrise or sunset.

## Stars: the same catalog, two different placements

Both views use the same 2,000-star selection from the Bright Star Catalogue,
with J2000 mean-equatorial directions and stored spectral brightness values.
**Right ascension** $\alpha$ is a star's angle around the celestial pole;
**declination** $\delta_{\ast}$ is its angle north or south of the celestial equator.
The catalog direction is:

$$
\mathbf{c}=(\cos\delta_{\ast}\cos\alpha,\ \cos\delta_{\ast}\sin\alpha,\ \sin\delta_{\ast}).
$$

Polaris is a catalog member, not a separate light fixed exactly on the pole.
The Focus → Polaris action aims at its direction calculated by the selected
geometry. [Catalog inputs and selection](src/algorithm32/implementation/star-field/Brightest2000StellarCatalogPackage.js)
and [application catalog access](src/flat/services/stellar-catalog.js) identify
the data used by both views.

### Globe stars: precession, sidereal rotation, then local direction

First, the globe transforms the catalog's J2000 coordinates to mean-of-date
coordinates. This **precession** correction models the slow change in the
celestial reference axes. The code applies three time-dependent rotation
angles, $\zeta$, $\theta$ and $z$, with their polynomial coefficients shown in
the linked CPU and shader implementations. The resulting right ascension and
declination are $\alpha'$ and $\delta'$.

Next, it calculates Greenwich mean sidereal time $s$. Sidereal time tracks
rotation relative to the stars, rather than a 24-hour solar day. Let:

$$
\begin{aligned}
J&=2440587.5+t_{\mathrm{ms}}/86400000,\\
J_{0}&=\lfloor J-0.5\rfloor+0.5,\\
D&=J_{0}-2451545,\qquad U=24(J-J_{0}),\\
T&=(J-2451545)/36525.
\end{aligned}
$$

Here $t_{\mathrm{ms}}$ is milliseconds since the Unix epoch, $J$ is the Julian date,
$U$ is UTC hours since midnight, and $T$ is centuries since J2000. The code uses:

$$
s_{\mathrm{hours}}=6.697375+0.065707485828D+1.0027379U
 +0.0854103T+0.0000258T^{2}.
$$

Convert $s$ to radians by multiplying hours by $\pi/12$. The star's **hour
angle** is $B=s+\lambda-\alpha'$: how far it has rotated past the observer's
meridian. Its local direction is:

$$
\begin{aligned}
e&=-\cos\delta'\sin B,\\
n&=\sin\delta'\cos\phi-\cos\delta'\cos B\sin\phi,\\
u&=\sin\delta'\sin\phi+\cos\delta'\cos B\cos\phi.
\end{aligned}
$$

The current calculation uses UTC as its time input and does not add separate
UT1 corrections, nutation, aberration, stellar proper motion or stellar parallax.
These are limits of this implementation's position calculation.

<details>
<summary>The precession rotation, for readers checking the full calculation</summary>

Using the centuries $T$ defined above, the three angles below are first
calculated in arcseconds, then multiplied by $\pi/(180\times3600)$ to obtain
radians:

$$
\begin{aligned}
\zeta={}&2.650545+2306.083227T+0.2988499T^{2}+0.01801828T^{3}\\
 &-0.000005971T^{4}-0.0000003173T^{5},\\
z={}&-2.650545+2306.077181T+1.0927348T^{2}+0.01826837T^{3}\\
 &-0.000028596T^{4}-0.0000002904T^{5},\\
\theta={}&2004.191903T-0.4294934T^{2}-0.04182264T^{3}\\
 &-0.000007089T^{4}-0.0000001274T^{5}.
\end{aligned}
$$

With the catalog angles $\alpha,\delta_{\ast}$, form:

$$
\begin{aligned}
a_{p}&=\cos\delta_{\ast}\sin(\alpha+\zeta),\\
b_{p}&=\cos\theta\cos\delta_{\ast}\cos(\alpha+\zeta)-\sin\theta\sin\delta_{\ast},\\
c_{p}&=\sin\theta\cos\delta_{\ast}\cos(\alpha+\zeta)+\cos\theta\sin\delta_{\ast},\\
\alpha'&=\mathrm{atan2}(a_{p},b_{p})+z,\qquad
\delta'=\arcsin(c_{p}).
\end{aligned}
$$

The code wraps angular cycles and clamps inverse-trigonometric inputs against
floating-point roundoff. This rotation changes the coordinate axes; it does
not model an individual star's physical motion through space.

</details>

**Code:** [CPU precession and direction, `_precessDirection` and `resolveDirection`](src/algorithm32/implementation/spherical-earth/SphericalStellarGenerationShaderContributor.js#L45),
and [matching shader precession, sidereal time and local direction](src/algorithm32/implementation/spherical-earth/SphericalStellarGenerationShaderContributor.js#L240).

### Flat stars: a rotating polar dome

Flat uses the catalog angles differently. A star's angular distance from the
north celestial pole becomes its map radius; its right ascension becomes a
longitude that rotates westward:

$$
\begin{aligned}
\theta_{\ast}&=\frac{\pi}{2}-\delta_{\ast},\\
\omega(t)&=2\pi\frac{t-t_{\mathrm{epoch}}}{P}\pmod{2\pi},\\
\lambda_{\ast}&=\alpha-\omega(t),\\
x_{\ast}&=R\theta_{\ast}\sin\lambda_{\ast},\qquad
y_{\ast}=R\theta_{\ast}\cos\lambda_{\ast},\\
z_{\ast}&=\pi R\sqrt{\max\left(0,1-(\theta_{\ast}/\pi)^{2}\right)}.
\end{aligned}
$$

The selected period is **$P=86{,}164.0905$ seconds**. The epoch is **Unix time
zero, 1970-01-01 00:00 UTC**, with zero rotation angle. That is an explicit phase
choice; this path does not use the globe's sidereal-time/precession calculation
or automatically align the dome with it at J2000.

Subtract the observer's projected position, rotate into local east/north using
the same map rotation as for the flat Sun, subtract observer height from
$z_{\ast}$, and normalize. Moving the observer therefore changes the apparent star
directions through this finite-dome construction. The dome's height is
$\pi R\approx19{,}980\,\text{km}$ at the north celestial pole and zero at its rim.
**This is the stellar placement surface, not a definition of the atmosphere's
boundary.** It is a chosen projection of the catalog, not measured star distances.

**Code:** [CPU dome position and observer-relative direction](src/algorithm32/implementation/flat-earth/FlatStellarGenerationShaderContributor.js#L28),
[matching shader, `flatStarLocalDirection`](src/algorithm32/implementation/flat-earth/FlatStellarGenerationShaderContributor.js#L131),
and [selected epoch, period and dome height](src/algorithm32/implementation/flat-earth/FlatStellarGenerationShaderContributor.js#L192).

## How light levels are calculated

Placement answers **where to look**. Illumination answers **how much light
arrives at the observer or a surface**. The calculation distinguishes direct
sunlight from diffuse sky light, and keeps physical measurements separate from
the brightness of the final image.

### Direct sunlight: source strength, distance and transmission

The source spectrum specifies energy per unit area and per wavelength interval,
in $\text{W}\,\text{m}^{-2}\,\text{nm}^{-1}$. Both Sun models start from the
[same 15-channel source spectrum](src/algorithm32/profiles/native-15/consts.js).

For the flat Sun, the unattenuated incident spectrum at distance $d$ is:

$$
E_{\mathrm{source}}(w)=E_{\mathrm{ref}}(w)
 \left(\frac{d_{\mathrm{ref}}}{\max(d,r_{\odot})}\right)^{2},
\qquad d_{\mathrm{ref}}=4800\,\text{km}.
$$

Here $w$ denotes wavelength. Doubling distance reduces incident energy to one
quarter. The radius limit prevents evaluating the inverse-square law inside
the source. The configured reference multiplier is one. The globe's distant
source uses the reference spectrum without a changing local inverse-square
factor; this implementation does not model the annual Earth–Sun distance change.

The intended calibration target is **the same sunlight spectrum reaching the
ground with the Sun directly overhead in each model**, including each model's
atmospheric attenuation. The visual reference is **local solar noon at the
date's subsolar latitude**: match brightness, color and ground illumination
with the same observer height, camera, ground material, atmosphere and display
settings. **Disc size is excluded from this calibration for now.** The
comparison must use the same receiver quantity. The current reference-distance
normalization above does not establish that ground-level match; implementing
and verifying that calibration is **deferred for now**. The current lighting
remains unchanged. The target is an overhead
reference condition; agreement at other Sun positions remains a model
prediction. Whole-sky equivalence has not been established by this calibration
target because the models' atmospheric geometries differ.

At the receiver, source obstruction and wavelength-dependent transmission give:

$$
E_{\mathrm{direct,normal}}(w)
 =E_{\mathrm{source}}(w)\,f_{\mathrm{visible}}\,\tau(w).
$$

$f_{\mathrm{visible}}$ represents the visible disk support; $\tau$, between zero and
one, represents transmission along the source path. This names the atmosphere's
input to the lighting calculation without describing its simulation. “Normal”
means a receiving surface facing the Sun directly. For a horizontal surface,
multiply by the Sun direction's upward component:

$$
E_{\mathrm{direct,horizontal}}(w)
 =E_{\mathrm{direct,normal}}(w)\max(0,u).
$$

A low Sun delivers less direct light per square meter of horizontal ground even
before accounting for transmission: the same beam is spread over a larger area.

**Code:** [flat inverse-square calculation, `sampleDirectLighting`](src/algorithm32/implementation/local-sun/LocalSunLightSource.js#L396),
[distant-source CPU calculation](src/algorithm32/implementation/distant-sun/DistantSunLightSource.js),
and [receiver visibility, transmission and horizontal projection](src/algorithm32/implementation/scene-lighting/LocalLightLevelCalculator.js#L51).
The GPU Sun paths are [finite-Sun source shader](src/algorithm32/implementation/local-sun/LocalSunLightSource.js#L315),
[its field builder](src/algorithm32/implementation/local-sun/celestial/FlatFiniteSunGpuBuilder.js)
and [distant-Sun CPU reference](src/algorithm32/implementation/distant-sun/celestial/DistantSunCelestialCpuCache.js)/[GPU builder](src/algorithm32/implementation/distant-sun/celestial/DistantSunCelestialGpuBuilder.js).
The flat disk's emitted radiance is derived separately from the reference
irradiance and its reference solid angle in
[`celestialSourceDefinition`](src/algorithm32/implementation/local-sun/LocalSunLightSource.js#L129);
per-pixel disk brightness and receiver illuminance are different quantities.

### Diffuse sky light and total illumination

The sky also illuminates the ground from many directions. For a horizontal
receiver, its spectral irradiance is the incoming sky radiance $L_{\mathrm{sky}}$
integrated over the upper hemisphere:

$$
E_{\mathrm{diffuse}}(w)=\int_{\text{upper sky}}
 L_{\mathrm{sky}}(w,\mathbf{d})\cos\theta\,d\Omega.
$$

$\theta$ is the angle from up, and $d\Omega$ describes a small patch of sky.
The cosine discounts grazing light. The implementation approximates this with
32 fixed, cosine-weighted directions, independent of where the camera looks:

$$
E_{\mathrm{diffuse}}(w)\approx\frac{\pi}{32}\sum_{i=1}^{32}L_{\mathrm{sky},i}(w),
\qquad
E_{\mathrm{total}}(w)=E_{\mathrm{direct,horizontal}}(w)+E_{\mathrm{diffuse}}(w).
$$

The cosine is already incorporated into the sample distribution, so it must
not be multiplied in again in that sum. Twilight can still have sky illumination
when direct sunlight is absent.

**Code:** [direction/weight selection](src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightQuadrature.js),
[CPU reference sky sampler](src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportCpuSampler.js),
[GPU sky-sampling shader](src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightTransportShader.js),
[CPU irradiance reduction](src/algorithm32/implementation/scene-lighting/LocalLightLevelCalculator.js#L313),
[matching shader reduction](src/algorithm32/implementation/scene-lighting/ReceiverEnvironmentLightGpuReducer.js#L118),
and [direct/diffuse combination](src/algorithm32/implementation/scene-lighting/LocalLightLevelCalculator.js#L169).

### From energy to lux, ground color and screen brightness

**Lux** weights arriving energy by the sensitivity of human daylight vision.
For each spectral channel $i$, with center wavelength $w_{i}$ and width
$\Delta w_{i}$, the code calculates:

$$
E_{v}\approx683\sum_{i} E(w_{i})V(w_{i})\Delta w_{i}.
$$

$V$ is the CIE photopic sensitivity curve. This is why equal radiant energy in
two colors need not produce equal lux. Direct, diffuse and total illumination
are measured separately. [CPU spectral-to-lux calculation](src/algorithm32/implementation/scene-lighting/LocalLightLevelCalculator.js#L539).

For a matte surface, reflected radiance follows the Lambertian relation:

$$
L_{\mathrm{surface}}(w)=\frac{\rho(w)}{\pi}
 \left[E_{\mathrm{direct,normal}}(w)\max(0,\mathbf{n}\cdot\mathbf{s})
 +E_{\mathrm{diffuse,surface}}(w)\right].
$$

$\rho$ is reflectance, $\mathbf{n}$ is the surface normal and $\mathbf{s}$ points
toward the Sun. A dot product measures alignment: one means facing the Sun,
zero means edge-on. The ground material is green; its rendered brightness and
tint come from the measured illumination. The renderer uses a neutral
Lambertian spectral bridge and applies material color through Three.js; its
diffuse ground fill represents the measured horizontal sky illumination.
See the [CPU Lambertian calculation](src/algorithm32/implementation/scene-lighting/NeutralLambertianSceneLighting.js),
[Flat light conversion](src/flat/features/flat-earth/runtime/FlatEarthSceneLighting.js),
and [Globe light conversion](src/flat/features/spherical-earth/runtime/SphericalEarthRuntime.js#L568).

Finally, display adaptation and tone mapping convert those light quantities
into pixels. This includes an empirical exposure response and, for the globe,
an altitude-dependent display adjustment between 10 and 40 km. Flat supplies
zero height to that particular display adjustment. These change the image,
not the physical receiver measurement. The
[CPU exposure calculation and shader contribution](src/algorithm32/implementation/color-reset-altitude-half-v1/ColorResetAltitudeHalfV1ColorDisplayModel.js)
and [CPU/shader gain curve](src/algorithm32/implementation/color-reset-slope-078-p9/ColorResetSlope078P9ColorDisplayModel.js)
with the [selected response constants](src/algorithm32/implementation/color-reset-slope-078-p2/consts.js)
make that distinction inspectable.

Stars use stored spectral irradiance, without an extra inverse-square factor
based on their flat-dome projection distances. Their unresolved points also use
a fixed, calibrated one-pixel presentation scale and human-vision presentation
filters. Their pixel brightness is therefore not a literal photograph or a
measurement of a finite luminous dome. See
[stellar point calibration](src/algorithm32/implementation/star-field/StellarPointPresentation.js)
and [shader conversion to point radiance](src/algorithm32/implementation/star-field/StellarScreenPaletteGenerationStages.js#L130).

For a physical comparison, use **Full** sky mode. **No atmosphere** and
**Shader off** intentionally disable Sun-derived ground lighting and supply
neutral fill; they are inspection modes, not independent physical illumination
predictions. Changing field of view or display exposure is likewise distinct
from changing the location, time or light reaching the observer.

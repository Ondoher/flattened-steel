# Production Color Reset Design

Focus: Color, receiver light, visible sources, and stellar presentation.

Related owners: [qualification](../qualification/color-reset-design.md), [sources-provenance](../../pure-research/sources-provenance/color-reset-design.md).

## Selected Outcome

Production will retain the existing atmosphere, Native15 transport, cache,
geometry, final-view integration, and Bruneton display architecture while
promoting these independently owned behaviors:

1. receiver-local direct, diffuse, and total-horizontal light state;
2. the global achromatic `slope-078/p9` Color response;
3. receiver-light-driven direct and diffuse scene lighting;
4. the complete brightest-2,000 stellar catalog;
5. one-pixel stellar presentation at `q=24`; and
6. optional, ordered human-vision presentation filters.

Basic Bruneton remains a stable explicit Color selection for B1 and production
comparison. Color selection, celestial-source selection, catalog selection,
and presentation-filter selection are independent configuration decisions.


## Goals

- Preserve the qualified Bruneton daytime and physical B1 relationships.
- Progress smoothly from daylight through nautical twilight without consulting
  time, named scenes, source kind, framebuffer pixels, or a hard twilight mode.
- Illuminate scene receivers from the direct and diffuse light physically
  available at their location.
- Preserve stellar photometry, spectral ordering, transport, and exact
  one-pixel occupancy while providing the selected screen calibration.
- Make perceptual presentation optional and exactly reversible.
- Provide a typed filter architecture that can later host non-night modes such
  as a physical or presentation-only solar filter.


## Preserved Architecture

The promotion does not change atmospheric scattering or make the experimental
tree part of production:

```text
source + atmosphere + geometry + cache
  -> Native15 path radiance and transmittance
  -> celestial and captured-scene composition
  -> optional stage-owned presentation filters
  -> selected Color model
  -> one display encoding
```

Production implementations and data live under `src/algorithm32` and
`src/flat32`. Material below `experiments/extraterrestrial` and immutable run output
may be inspected and adapted, but production must not import it at runtime.

### Promotion precedence

The accepted experiment is the authority for the selected algorithmic result:
its equations, numerical parameters, operation order, catalog ordering, and
approved behavioral outcomes win when they conflict with the older production
algorithm. This precedence does not extend to experimental code organization,
interfaces, ownership, lifecycle, or implementation technique.

The existing production architecture remains authoritative for component
responsibilities, dataflow, typed boundaries, configuration, resource
management, atomic publication, failure behavior, and integration with
Algorithm32 and Flat32. Repository guidance and coding standards remain
authoritative for source layout, implementation quality, testing, evidence,
provenance, and documentation. Experimental implementation code is reference
material and must be adapted to those production constraints rather than used
as an architectural template or runtime dependency.

An algorithmic conflict is escalated instead of resolved automatically only
when there is a concrete concern about incorrect units or inputs, numerical
instability, violation of a preserved physical invariant, unverifiable or
legally unusable data, unacceptable production cost, or failure to reproduce
the accepted result. Architectural inconvenience by itself is not a reason to
replace the selected algorithm; it is an integration problem to solve within
the preserved architecture.

### Deferred authority and distribution

Source research and official-experiment registration are deferred. That
deferral does not block production implementation, deterministic reproduction,
or engineering verification of the accepted algorithms. Until the applicable
rows in the
[project-wide research register](../../../../references/followup.md#missing-third-party-sources-or-canonical-registrations)
close, however, each affected result remains a
provisionally authorized reproduction: it cannot receive final scientific or
numerical-authority acceptance, support a stronger physical claim than the
contained evidence, or authorize release qualification and default selection.

External-data licensing and redistribution are a separate hard boundary.
Derived BSC, Pickles, Johnson/SVO, Vega, and CIE material may be generated,
integrated, and exercised locally for production development, but neither the
source payloads nor their production derivatives may be publicly distributed
or included in a release package until their applicable license and
redistribution rows close. Placement in a production-owned local data shape
does not itself grant redistribution rights. If the repository or an artifact
destination is publicly distributed, these bytes must remain outside its
tracked or packaged surface pending clearance.


## Responsibility Boundaries

### Physical sky and celestial transport

Atmosphere and celestial composition produce Native15 pre-display radiance.
Color may consume that result but may not retune scattering, source radiometry,
cache values, quadrature, Q30 integration, geometry, or the 108-degree dark
cache boundary.

The candidate changes display response, not the physical atmosphere color
curve. Physical B1 scoring therefore remains upstream of the candidate.

### Receiver-light state

The receiver-light owner retains separate Native15 quantities:

```text
directNormal(lambda)
directHorizontal(lambda) = directNormal(lambda) * max(0, up dot sourceCenter)
diffuseHorizontal(lambda) = integralUpperHemisphere L(lambda, omega) *
                            max(0, up dot omega) dOmega
totalHorizontal(lambda) = directHorizontal(lambda) + diffuseHorizontal(lambda)
```

The authoritative Color condition is the photopic projection of
`totalHorizontal`, expressed in lux. Direct-normal must not be added to a
horizontal diffuse term without its orientation projection. Spectra remain
available to scene lighting even when a scalar projection is published.

Receiver-light publication is atomic and keyed by all atmosphere, observation,
source-placement, cache, spectral-basis, and quadrature identities that can
change it. A failed or superseded calculation preserves the prior complete
publication. It may not derive state from a framebuffer or named time.

Production realizes this contract through the existing
`LocalLightLevelCalculator` and `ReceiverEnvironmentLightController`. The
retained direct-normal calculation is not changed: horizontal projection is a
separate derived packet, and the environment reduction contributes only the
diffuse-horizontal packet before exact addition. A newly prepared model starts
with a complete zero-diffuse publication; Flat32 replaces it atomically with
the cache-derived complete publication before its first accepted composed
frame. Live invalidation covers the canonical profile/model state, exact
runtime cache object generation, packet and basis hashes, and the fixed
quadrature identity. The selected Color Reset model consumes the published
photopic total-horizontal lux directly. The superseded source-luminance-lift
path has been removed; Basic Bruneton remains the independent physical/B1
control.

Questions about resolved-disk horizon accuracy, quadrature convergence,
absolute twilight authority, the temporary `E_v / pi` interpretation, and
cross-process cache identity are retained in the
[project-wide research backlog](../../../../references/followup.md#color-reset-research-questions).
They are research boundaries, not permission to modify the selected equations
during production promotion.

### Color selection and response

The production selector exposes stable, explicit identities. At minimum:

- `basic-bruneton` selects the unchanged Bruneton Figure-1 display path; and
- `color-reset-slope-078-p9` selects the qualified candidate.

Unknown identities fail closed. Selecting either Color model must not enable
or disable the Sun, stars, captured scene, or another source.

For total-horizontal photopic illuminance `E` in lux, the selected response is:

```text
base(E) = 1 + 3.5 / (1 + (E / 980 lux)^9)
x(E) = ln(385 lux / (E + 0.02 lux)) / 0.1
adapt(E) = exp(0.78 * 0.1 * softplus(x(E)))
g(E) = base(E) * adapt(E)
```

The scene-global achromatic gain acts at the qualified pre-tone Color boundary
and is followed by the unchanged Bruneton exponential/display mapping. The
same `E`, equation, and gain apply to every pixel and channel. The function is
finite and continuously differentiable at zero, tends toward unit gain at high
light, and has bounded deep-response logarithmic elasticity.

The response cannot inspect source kind, solar zenith, clock, camera, viewport,
pixel class, local background, or output codes. It introduces no independent
RGB curves, per-frame grading, per-pixel normalization, or hidden gamut clamp.

Production implements this as the fixed
`ColorResetSlope078P9ColorDisplayModel`; the curve is not a caller-configurable
family. Algorithm32 owns the live
`color.totalHorizontalIlluminance.value` binding and publishes it from the
same complete receiver-light generation as the direct, diffuse, and total
packets. Flat32 selects this model when Color configuration is omitted and
publishes the resolved identity for diagnostics. Basic Bruneton remains
separately selectable as the physical/B1 control. Unknown and removed
identities fail closed.

### Scene lighting

Neutral Lambertian lighting consumes receiver-state spectra before Color:

```text
L_direct(lambda,n) = rho/pi * E_directNormal(lambda) * max(0,n dot s)
L_diffuse(lambda,n) = rho/pi * integralUpperHemisphere
                      L(lambda,omega) * max(0,n dot omega) dOmega
L_combined = L_direct + L_diffuse
```

The accepted proof used wavelength-independent `rho=0.18`. Production must
preserve exact direct-only, diffuse-only, and additive combined modes at the
declared neutral-material boundary. This does not claim general spectral PBR,
interreflection, arbitrary materials, shadows, or long object-path transport.

Production realizes the exact Color-free spectral relationship in
`NeutralLambertianSceneLighting`. Its diffuse input is explicitly irradiance
already integrated for the evaluated surface. Flat32 supplies P2's
`diffuseHorizontal` packet to the selected black-ground upper-hemisphere
light. It is exact for the upward receiver-horizontal neutral surface and a
normal-dependent approximation for other renderer normals. Direct lighting
remains directional and uses the exact direct-normal packet with
`max(0,n dot s)`. Only after those spectral equations does the scene-light
adapter project the result for Three. Full directional-sky diffuse response
for arbitrary normals is deferred and tracked in the
[project-wide research backlog](../../../../references/followup.md#color-reset-research-questions).

### Brightest-2,000 stellar catalog

The ordinary production selection replaces the brightest-500 roster with the
accepted ordered brightest-2,000 BSC V/50 roster:

- source catalog SHA-256:
  `d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759`;
- order: ascending finite `Vmag`, then ascending HR;
- endpoints: HR `2491`, `Vmag=-1.46`, through HR `7474`, `Vmag=5.17`;
- the current production 500 are an exact ordered prefix;
- all 2,000 directions and members remain present; and
- all 30,000 Native15 spectral scalars are finite and nonnegative.

The spectral partition is exactly 1,993 retained Pickles/Johnson packets plus
seven declared photometry-constrained continuum proxies. The proxy members are
HR `868`, `8316`, `1845`, `4163`, `2289`, `4846`, and `9004`. Their continuum
approximation does not claim carbon-star molecular bands, emission lines, or
variability.

The accepted GPU-capacity representation uses one `2000x1 RGBA32F` member
texture and one `2000x15 R32F` spectrum texture, totaling 152,000 bytes. The
screen-palette zero entry makes the sparse palette capacity 2,001 entries.
Catalog identity and member count participate in cache and generation
compatibility identities.

Production realizes this as an authenticated local-only package beneath
`server/flat32/data/brightest-2000-stellar-package-v1`. The tracked
materializer copies only hash-verified accepted artifacts, and the runtime
loader rechecks every byte length and SHA-256 before constructing a source.
The exact roster and Native15 packets remain available for binary64 identity
and prefix verification; the two accepted float32 payloads are the GPU upload
authority. This ownership layout does not grant redistribution permission:
the package remains ignored and excluded from releases until the source-gap
license rows close.

Catalog completeness and appearance are separate claims. The rejected CR6H
appearance run showed that the extra 1,500 members increase occupied pixels
but do not become two-code robust under `q=24`. Production will include them
without raising brightness merely to expose the larger roster.

### One-pixel stellar presentation

Every unresolved star occupies exactly one raster pixel:

```text
gl_PointSize = 1.0
presentedStellarLinearRgb = 24 * transportedStellarLinearRgb
```

The wavelength-independent `q=24` scalar is presentation calibration, not a
change to source irradiance. It cannot depend on time, scene, solar zenith,
catalog size, magnitude, pixel, viewport, or framebuffer. Collision groups
retain the canonical representative index while accumulating every colliding
member's transported Native15 contribution exactly once.

Production represents this without a second shader branch: the retained q1
base scale is `60,999.839486002405`, the fixed multiplier is `24`, and the
palette-generation constant is their product `1,463,996.1476640578`. The
presentation identity includes the CR6C run and multiplier so q1 and q24
cannot alias one compatible generation.

Supported viewport and device-pixel-ratio behavior must be qualified in
production. The contained appearance evidence alone does not establish
arbitrary-view equivalence.

### View-presentation filters

Filters use a stage-aware registry rather than night-specific shader branches:

```text
physical spectral outputs
  -> spectral-view filters
  -> per-source linear RGB projection
  -> source-linear filters
  -> source/sky/scene composition
  -> composed-linear filters
  -> selected Color mapping
  -> display-output filters
```

Each filter declares a stable id and version, stage, semantic target, enabled
state, parameter schema, ordered compatibility, inputs, outputs, and derivation
identity. Empty or fully disabled lists are exact identity. Unsupported stages,
targets, combinations, or orderings fail closed.

The selected stellar chain, enabled by default in the ordinary application but
reversibly disabled by the physical presentation selection, is:

1. `human-mesopic-luminance-v1`, `stage=source-linear`, `target=stellar`,
   `maximumRodContribution=0.5`;
2. `human-low-light-chroma-v1`, `stage=source-linear`, `target=stellar`,
   `maximumChromaRetention=0.65`.

The mesopic approximation uses receiver-local physical sky luminance before
stars, exposure, and Color. Production approximates the contained experiment's
unmasked framebuffer median with the median photopic luminance of the existing
fixed 32 receiver-hemisphere radiance samples. This avoids a framebuffer
dependency and shares the receiver-light generation; its equivalence and
sensitivity remain a recorded research question:

```text
t = clamp((log10(5) - log10(max(La, 0.005))) / 3, 0, 1)
rodWeight = 0.5 * t^2 * (3 - 2*t)
Yp = authenticated E8 photopic luminance
Ys = 1700 * integral(stellar Native15 radiance * CIE V'(lambda) dlambda)
Ymes = Yp + rodWeight * (Ys - Yp)
adjustedRgb = transportedRgb * (Ymes / Yp)
```

The chroma approximation follows it:

```text
t = clamp((3.2 - apparentMagnitude) / 3.2, 0, 1)
h = t^2 * (3 - 2*t)
k = 0.65 * h
filteredRgb = equalLuminanceNeutral + k *
              (sourceRgb - equalLuminanceNeutral)
```

Both are presentation approximations. They do not mutate physical packets or
claim a complete CIE 191, temporal adaptation, or retinal simulation. Finite
signed wide-gamut RGB components retain their signs; no hidden clamp is added.
Physical stellar color and each intermediate toggle state remain selectable.

Production ownership is `ViewPresentationFilterRegistry`. It registers the
four stage names and five semantic-target names as closed design boundaries,
while implementing only `source-linear/stellar`. It assigns list position as
the deterministic order, hashes the complete normalized configuration, and
emits the fixed stellar GLSL hook installed by P7. The promoted parameter
surface accepts only rod contribution `0.5` and chroma retention `0.65`; other
experimental strengths are not production aliases. P7 binds registry and
scotopic-weight identities, Color, receiver light, screen index, and palette
into one compatible stellar runtime generation. Unsupported Color/mode/filter
combinations fail closed.

The registry does not embed the CIE-derived Native15 scotopic weight vector in
tracked production source. Mesopic CPU or shader execution requires an exact,
finite, nonnegative 15-value vector supplied from an authenticated local
production package, and the generated hook records that vector's content
identity. This preserves the no-public-redistribution boundary until the
source-gap licensing rows close.

A future optical solar filter belongs at `spectral-view` and requires
provenance-backed transmission for every affected radiance. A Sun-only
false-color or glare-reduction mode is a presentation filter with an explicit
solar target and cannot make an optical-transmission or eye-safety claim.


## Supported Initial Scope

The first appearance-qualified production pairing is spherical geometry with a
distant Sun. Shared types and Color math may support flat/local, but that mode
does not inherit an appearance-acceptance claim without its own captures and
gates.

The initial production qualification matrix is the established Windows lane
using the current pinned Chrome Headless executable, WebGL2 through
ANGLE/D3D11, and the NVIDIA GeForce RTX 2060 reference device. The promotion
manifest records the exact browser version used by each gate; P0 observed
Chrome Headless 153. Full-frame appearance and performance qualification
uses a 1920-by-1080 drawing buffer at DPR 1. DPR 2 is included for one-pixel
raster occupancy, screen-index rebuild, resize, and lifecycle qualification
with a bounded CSS viewport whose drawing buffer does not exceed 1920 by 1080.
This matrix does not establish browser-, GPU-, operating-system-, arbitrary-
viewport-, or 4K-wide support; broader qualification remains follow-up work.

Moon illumination, light pollution, automatic exposure, bloom, PSFs, halos,
camera emulation, sensor noise, planets, arbitrary material lighting, and
population-level psychophysical validation remain deferred.

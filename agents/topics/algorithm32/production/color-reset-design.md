# Production Color Reset Design

Status: selected production design; implementation has not started.

This document is the current design authority for promoting the accepted Color
Reset result into Algorithm32 and Flat32. The closed
[contained design](../../extraterrestrial/color-reset-design.md) and
[experiment plan](../../extraterrestrial/color-reset-experiment-plan.md) retain
the complete chronology, rejected alternatives, equations, figures, and
immutable evidence identities. They are evidence inputs, not production
runtime dependencies or current work instructions.

The paired [production implementation plan](color-reset-implementation-plan.md)
owns sequencing, gates, and completion state.
The [source-gap register](color-reset-source-gaps.md) owns missing third-party
citations and unregistered first-party experiment authority.

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
`src/flat32`. Material below `scripts/extraterrestrial` and immutable run output
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
rows in the source-gap register close, however, each affected result remains a
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

### Brightest-2,000 stellar catalog

The production target replaces the current brightest-500 roster with the
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

The selected optional stellar chain is:

1. `human-mesopic-luminance-v1`, `stage=source-linear`, `target=stellar`,
   `maximumRodContribution=0.5`;
2. `human-low-light-chroma-v1`, `stage=source-linear`, `target=stellar`,
   `maximumChromaRetention=0.65`.

The mesopic approximation uses the median physical, unmasked sky luminance
before stars, exposure, and Color:

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

## Qualification Invariants

- B1 Native15/Q30/cache values remain unchanged; aggregate RMSE remains within
  the established threshold and all six figures regenerate.
- Basic Bruneton remains independently selectable and authenticated.
- Candidate daylight and low-Sun output remains within the frozen preservation
  envelope.
- Identity filters reproduce the unfiltered path exactly.
- The 2,000-member roster, prefix, packet set, proxy partition, GPU readback,
  collision sums, and resource identities reproduce their accepted contracts.
- Stars remain exactly one pixel and use `q=24` without catalog-size tuning.
- Resize, DPR changes, context loss, replacement, supersession, and failures
  never publish mixed receiver, catalog, palette, filter, or Color generations.
- Production has no runtime import from the contained experiment.

## Authority Classification And Reasonable Inference

The design distinguishes facts that can be derived or recomputed from facts
that require an external source. Reasonable inference may support design and
implementation planning, but it does not override the repository's citation,
official-experiment, or independent-conformance requirements. The
[source-gap register](color-reset-source-gaps.md) remains the canonical owner
of every unresolved source and registration action.

### Analytic or definitional relationships

The following relationships may be established from geometry, radiometric
definitions, or energy conservation rather than selected from an empirical
paper:

```text
directHorizontal(lambda) = directNormal(lambda) *
                           max(0, up dot sourceDirection)

diffuseHorizontal(lambda) = integralUpperHemisphere
                            L(lambda,omega) *
                            max(0, up dot omega) dOmega

totalHorizontal(lambda) = directHorizontal(lambda) +
                          diffuseHorizontal(lambda)

LambertianOutgoingRadiance(lambda) = rho/pi *
                                      incidentIrradiance(lambda)
```

The direct projection follows projected-area geometry. The diffuse integral is
the definition of irradiance over the receiving hemisphere. Total horizontal
irradiance is the additive combination of components expressed in the same
orientation. The Lambertian `rho/pi` relationship follows from constant
outgoing radiance and hemispherical energy conservation. Bibliography entry
`[8]` may support the Lambertian derivation; `rho=0.18` remains a declared
neutral test parameter rather than a universal physical constant.

These relationships still require checked analytic tests, unit-bearing
contracts, and focused production conformance. Their derivability does not
make a production implementation its own authority.

### Deterministic recomputations from authenticated inputs

Once their external inputs are authenticated, the following results are
deterministic and can be independently reproduced without another scientific
model:

- sorting finite BSC V/50 records by `Vmag` and then HR, selecting the first
  2,000, checking endpoints, and proving the first-500 prefix;
- applying the declared Pickles/Johnson materialization equations, counting
  the `1,993/7` retained/proxy partition, checking all 30,000 Native15 values
  for finiteness and nonnegativity, and reproducing declared photometric
  residuals;
- calculating the selected GPU package size as
  `2000 * 4 * 4 + 2000 * 15 * 4 = 152000` bytes;
- deriving a 2,001-entry sparse-palette capacity from 2,000 catalog members
  plus the exact-zero entry; and
- verifying canonical collision ownership and additive inclusion of each
  colliding member exactly once.

This determinism does not establish catalog authenticity, source licensing,
spectral physical adequacy, browser capability, GPU readback correctness, or
performance. Those remain separate source and production gates.

### Engineering behavior established by contracts and tests

The following are software policies rather than claims about nature:

- `gl_PointSize=1.0` and the integer screen-index contract express one-pixel
  stellar occupancy;
- unknown selections fail closed;
- Color, source roster, catalog, and filter selections remain independent;
- compatible state publishes atomically and a failed replacement preserves the
  prior generation;
- empty or disabled filter lists are exact identity; and
- mesopic luminance precedes chroma contraction so the two filters retain
  separate responsibilities.

These facts need typed contracts, deterministic tests, real-browser checks
where rasterization or GPU resources are involved, and lifecycle tests. They
do not need a third-party paper merely to justify the chosen software
architecture. `gl_PointSize=1.0` still requires supported browser and DPR
qualification before making a universal one-device-pixel claim.

### Owner-selected presentation policy

The following values are approved project presentation selections, not values
that can be derived from first principles or retroactively proven by an
external publication:

- the `slope-078/p9` Color response;
- one-pixel stellar calibration `q=24`;
- maximum stellar chroma retention `0.65`;
- maximum rod contribution `0.5`;
- the registered filter ids, stages, targets, and order;
- the decision to keep unresolved stars at one raster pixel; and
- the complete brightest-2,000 roster as the production catalog target.

Their contained brackets, invariant checks, and owner reviews explain the
selection. Production must reproduce and independently qualify them, and their
first-party evidence must be promoted under repository policy, but later
source research must not misrepresent them as externally prescribed physical
constants.

### Qualitative approximations suitable for bounded experiments

The following expectations are reasonable premises for an optional
human-vision approximation:

- rod contribution can shift relative apparent luminance so blue-green stars
  may brighten while red stars may dim;
- perceived chroma generally contracts as adaptation luminance falls;
- mesopic behavior may be approximated by a smooth blend of photopic and
  scotopic response; and
- stellar color can become difficult to perceive while the star remains
  detectable.

These premises justify bounded experiments, not exact equations or parameter
values. They do not independently authorize `0.65`, `0.5`, `V=3.2`, the
`0.005–5 cd/m^2` interval, or the selected interpolation functions. The filters
remain explicitly optional approximations rather than physiological
simulations.

San Jose is likewise a reasonable fixed summer geometry for repeatable review.
It does not supply a light-pollution model or make the selected response
location-independent evidence.

### Facts that must not be inferred

The following require the source investigation recorded in the source-gap
register:

- the CIE 1931 color-matching tables and exact `683 lm/W` convention;
- the CIE scotopic `V'(lambda)` data and `1700 lm/W` convention;
- applicability of the `0.005–5 cd/m^2` boundaries to the selected viewing
  conditions;
- Koomen and Patat values, valid domains, and extraction;
- BSC, Pickles, Johnson/SVO, and Vega identity, version, license,
  redistribution, and semantic provenance;
- the claimed stellar-color threshold near `V=3`;
- physical applicability of the seven red-member continuum proxies; and
- credibility of the integrated brightest-2,000 appearance.

An existing URL, DOI, retained payload, plausible expectation, or passing
contained run cannot substitute for the canonical source registration and
official-experiment boundary required for these claims.

## Evidence Authorities

The contained runs below are promotion candidates, not yet official repository
experiments. Their missing external sources and registration work are tracked
only in the [source-gap register](color-reset-source-gaps.md). Until the
applicable rows close, these identities preserve evidence and selected intent
but do not authorize production numerical acceptance.

- Receiver light: `000007-available-light-inventory`.
- Neutral scene lighting: `000011-neutral-geometry-ambient-proof`.
- Slope-limited Color: `000033-cr4g-slope-limited-nautical-response-bracket`.
- One-pixel `q=24`: `000049-cr6c-one-pixel-brightness-calibration-narrowed`.
- Chroma filter: `000052-cr6d-toggleable-low-light-stellar-chroma`.
- Mesopic filter: `000054-cr6e-toggleable-mesopic-stellar-luminance`.
- 2,000 packets: `000055-cr6f-brightest-2000-spectral-materialization`.
- 2,000 GPU package: `000057-cr6g-brightest-2000-runtime-capacity`.
- Integrated 500-star appearance control: `000062-integrated-color-reset-sequence`.
- Final qualification: `000065-color-reset-qualification`, artifact-set
  SHA-256 `1f5fa1226d1520847fa900fea14870144e6c07f1cbecd11dc0ff4246d2b8bfe1`.

The rejected `000058-cr6h-brightest-2000-appearance` run remains required
negative evidence for the claim boundary; it does not invalidate the accepted
roster, spectra, or capacity contracts.

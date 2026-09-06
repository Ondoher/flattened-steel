# Production Color Reset Implementation Plan

Focus: Color, receiver light, visible sources, and stellar presentation.

Related owners: [release](../../production-app/release/color-reset-implementation-plan.md), [sources-provenance](../../pure-research/sources-provenance/color-reset-implementation-plan.md), [runtime-integration](../../production-app/runtime-integration/color-reset-implementation-plan.md), [product-behavior](../../production-app/product-behavior/color-reset-implementation-plan.md).

## P2 - Publish Total Receiver Light

Status: complete.

- Extend the existing `LocalLightLevelCalculator` and
  `ReceiverEnvironmentLightController` rather than introducing a parallel
  lighting subsystem.
- Publish direct-normal, direct-horizontal, diffuse-horizontal, and
  total-horizontal Native15 packets with explicit units and provenance.
- Derive total-horizontal photopic lux for Color from the combined packet.
- Replace the facade's direct-only initial brightness proxy and ensure an
  environmental build adds rather than substitutes diffuse light.
- Key invalidation to observation, source placement, atmosphere, cache,
  spectral basis, and quadrature identity.
- Preserve the last complete measurement on rejection, failure, cancellation,
  or supersession.

Gate: analytic direct-only, diffuse-only, combined, darkness, orientation, and
atomic lifecycle tests pass on CPU and the application exposes no
framebuffer-derived or named-time state.

Result: production retains the existing geometry-supported and atmosphere-
transmitted direct-normal algorithm unchanged, derives a separately identified
direct-horizontal packet with the selected source-center cosine equation,
reduces the fixed 32-direction cosine-weighted cache sample to diffuse-
horizontal, and publishes their exact total. Every complete state carries all
four Native15 packets, their physical packet units and derivation provenance,
the four photopic lux projections, and the temporary pre-P3 total `E_v / pi`
input used by the still-live source-luminance-lift Color. Model/profile, exact
runtime cache generation, basis, direct packets, diffuse result, and
quadrature identity participate in invalidation. Rejection, failure,
cancellation, disposal, and latest-request-wins supersession cannot replace
the last complete publication.

Flat32 now performs this measurement from the installed scattering cache
before its composed-frame preflight, so the first published application frame
uses total receiver light. The two type checks pass, Algorithm32 passes its
complete Node lane, the Algorithm32 WebGL lane passes `23/23`, the basic Flat32
lane passes `21/21`, and the full exact-cache Flat32 lane passes `22/22` when
its required local cache-server proxy is supplied. The deferred physical and
authority questions remain explicit in the
[project-wide research backlog](../../../../references/followup.md#color-reset-research-questions) and
do not alter the selected algorithm. The complete Node result is `598/598`.


## P3 - Promote `slope-078/p9` Color

Status: complete.

- Implement the fixed qualified response under the production Color interface.
- Bind total-horizontal lux as facade-owned live state.
- Preserve the existing Native15 projection, scene/celestial composition, and
  Bruneton exponential/display encoding beneath the new response.
- Keep basic Bruneton byte- and identity-stable.
- Add CPU equation tests, shader-source contracts, finite/range tests, and
  selected-value CPU/GPU parity.

Gate: response values and slopes reproduce the accepted binary64 authority;
daytime and low-Sun preservation gates pass; basic Bruneton remains exact and
independently selectable.

Result: production owns the fixed `color-reset-slope-078-p9` model and its
seven immutable response constants. It applies the accepted common scalar to
signed Native15-projected linear sRGB before the inherited, unchanged
Bruneton exponential/display encoding. The model consumes the P2 photopic
total-horizontal lux through the facade-owned live
`color.totalHorizontalIlluminance.value` binding; callers cannot replace that
binding, and complete receiver-light publication updates it with the matching
packet generation. Flat32 now routes the explicit candidate identity while
retaining `BrunetonSourceLuminanceLiftColorDisplayModel` and `basic-bruneton`
as separate exact controls. The later default activation selects this Color
Reset model when configuration is omitted.

All six accepted cadence gains, derivatives, and logarithmic elasticities
reproduce the CR4G binary64 values exactly. Darkness is finite at gain
`9887.08997070112`, the sampled 200,000-lux daylight point is identity, signed
pre-tone values remain signed until the existing Bruneton clamp, and shader
source/binding contracts pass. Both type checks pass, Algorithm32 passes
`602/602`, the Chrome Headless 153 WebGL lane passes `24/24` including
selected-value CPU/GPU parity, and the rebuilt focused Flat32 lane passes
`21/21` with its full-cache application case intentionally excluded. P3
introduced no new source-gap research question.


## P5 - Replace The 500-Star Roster With 2,000 Stars

Status: complete.

- Materialize production-owned data for the exact CR6B ordered roster and CR6F
  Native15 packet set; do not import experiment fixtures at runtime.
- Keep externally derived catalog and spectral bytes local and out of public
  tracked or release-package surfaces until their applicable license and
  redistribution rows close.
- Preserve the first 500 ids, directions, and packet values exactly.
- Retain all seven declared proxy spectra and their provenance.
- Generalize source tables, layouts, identities, textures, palette capacity,
  diagnostics, and tests from 500 members/501 palette entries to 2,000
  members/2,001 palette entries.
- Retain the accepted `2000x1 RGBA32F` plus `2000x15 R32F` representation or
  prove an exactly equivalent production representation.
- Preserve canonical collision ownership and sum every colliding spectrum once.
- Keep `q=24`; do not tune brightness from member count or CR6H robust counts.

Gate: exact roster endpoints and prefix, all 30,000 finite nonnegative values,
the `1,993/7` partition, selected GPU readbacks, collision conservation,
resource bounds, context restoration, and replacement lifecycle pass.

Result: production owns a tracked materializer and verifier plus the ignored
local package `server/flat32/data/brightest-2000-stellar-package-v1`. The
package authenticates immutable CR6B/CR6F/CR6G parents and retains the exact
double-precision roster and packets alongside the accepted 152,000-byte split
float32 representation. Runtime imports only production code and local package
bytes; no contained module is a dependency. Missing or altered package bytes
fail closed, and the licensing-sensitive derivatives remain outside Git and
release packaging.

The explicit `brightest-2000` selection constructs all 2,000 members, preserves
the first 500 ids, directions, and packet scalars exactly, retains all seven
declared proxy derivations, and exposes separate `2000x1 RGBA32F` member and
`2000x15 R32F` spectrum textures. The sparse palette derives its 2,001-entry
capacity from member count. The older tiled stellar transport architecture is
retained and generalized to a 2,048-member capacity with `704x419x15` R32F
storage. Canonical collision ownership and ordered accumulation are unchanged;
the catalog increment does not alter `gl_PointSize=1.0` or the P7-owned
executable `q=24` calibration.

The exact local proof confirms endpoints HR 2491 and HR 7474, prefix boundary
HR 7590, first added HR 2012, all 30,000 finite nonnegative values, the exact
`1,993/7` partition, 152,000 source bytes, and expanded transport bounds. A
Chrome Headless 153 production recast proves selected GPU readback, collision
conservation, 2,001-entry allocation, replacement, disposal, and context
restoration. Both type checks pass; Algorithm32 passes `605/605`, Algorithm32
WebGL passes `25/25`, Flat32 basic passes `22/22`, Flat32 exact-cache passes
`23/23`, and the Flat32 build passes.


## P6 - Add The Ordered Presentation-Filter Registry

Status: complete.

- Implement typed stage and semantic-target registration, deterministic order,
  configuration identities, exact identity mode, and fail-closed compatibility.
- Implement only the source-linear hooks required for the selected stellar
  filters; reserve other stages as types/design boundaries until used.
- Promote `human-mesopic-luminance-v1` at rod contribution `0.5` before
  `human-low-light-chroma-v1` at retention `0.65`.
- Preserve physical color, chroma-only, and full selected-chain toggle paths.
- Preserve finite signed wide-gamut components without a hidden clamp.

Gate: identity is exact, filter order is enforced, nonstellar pixels are
unchanged, luminance/chroma invariants reproduce accepted equations, and
unsupported combinations fail closed.

Result: `ViewPresentationFilterRegistry` now owns the versioned stage and
semantic-target vocabulary, implements only the selected
`source-linear/stellar` registrations, assigns deterministic array order, and
hashes the complete normalized configuration. Empty, fully disabled, and
nonstellar paths return the original RGB object without arithmetic. The
selected mesopic implementation accepts an authenticated local Native15
scotopic-weight vector and uses fixed `0.5` maximum rod contribution; it does
not track or release the CIE-derived coefficients. Missing or malformed weights
fail closed. The following low-light chroma implementation uses fixed `0.65`
retention and preserves E8 linear luminance. Both retain finite signed RGB
without an output clamp.

The registry emits the fixed source-linear stellar GLSL hook for P7. Flat32
normalizes and identifies filter selections now, rejects alternate strengths,
stages, targets, duplicates, and reversed order, but enabled selections remain
fail-closed until P7 can publish the hook with a compatible stellar generation.
Both type checks pass, Algorithm32 passes `613/613`, the Flat32 build passes,
and Chrome Headless 153 passes the basic Flat32 lane `22/22` with its full-cache
case intentionally skipped. No new research fact was introduced; the scotopic
dataset and mesopic-authority limitations remain owned by the existing rows in
the [project-wide research register](../../../../references/followup.md#missing-third-party-sources-or-canonical-registrations).


## P7 - Integrate One-Pixel Stellar Presentation

Status: complete.

- Keep `gl_PointSize=1.0` and apply the fixed wavelength-independent `q=24`
  presentation calibration at the source-owned pre-composition boundary.
- Rebuild screen indices and palettes transactionally for catalog, view,
  observation, resize, DPR, and context changes.
- Publish catalog, screen index, palette, filter configuration, receiver light,
  and Color as one compatible runtime generation.
- Exercise the 108-degree scattering-cache transition without switching stars
  from time, solar angle, or cache darkness.

Gate: every star occupies one raster pixel, supported viewport/DPR cases retain
the declared calibration and collision behavior, no stellar pixel clips or
becomes exact white in the qualified cadence, and failed rebuilds preserve the
prior compatible generation.

Result: the live celestial consumer retains the transported stellar Native15
packet separately from other path radiance, reads collision-combined apparent
magnitude from palette row 15, and lets Bruneton Color replace only that
stellar projection with the selected source-linear filter result before the
unchanged scene composition and display encoding. Spectral rows 0-14,
`gl_PointSize=1.0`, and wavelength-independent `q=24` are retained. The
corrected production policy stores the historical q1 base
`60,999.839486002405`, the CR6C multiplier `24`, and their effective
`1,463,996.1476640578` boundary scale under a new presentation identity. The
first P7 promotion pass had left the q1 scale executable despite documenting
q24; live appearance review exposed the mismatch.

The screen index and 16-row R32F palette rebuild transactionally for view,
viewport/DPR, observation/configuration, and context changes. Their generation
identity includes catalog/policy, exact view, Color, registry configuration,
scotopic-weight content, receiver-light generation, and adaptation luminance.
Failed staging retains the prior publication but exposes exact-zero stellar
bindings while that publication is incompatible. The 108-degree cache
transition changes scattering state without selecting stars from solar angle,
time labels, or cache darkness.

Flat32 exposes `physical`, `chroma`, `mesopic`, and ordered `human` selections;
the mesopic paths authenticate an ignored local CIE-derived 15-weight package.
Unsupported Flat/local and Ferwerda/filter combinations fail closed. The fixed
32-direction receiver-sky median is the documented production approximation to
the experiment's unmasked sky-pixel median; its sensitivity is deferred in the
[project-wide research backlog](../../../../references/followup.md#color-reset-research-questions).

Corrected verification passes Algorithm32 Node `614/614`, Chrome Headless 153
Algorithm32 WebGL `26/26`, Flat32 basic `23/23` with the full-cache case
intentionally skipped, the configured exact-cache Flat32 lane `24/24`, both
type checks, and the Flat32 build. The WebGL lane covers 500/2,000-member palette generation,
collision-conserved spectra and magnitude, one-pixel invariance, resize/view
replacement, context restoration, the enabled mesopic-then-chroma GPU equation,
and no exact-white/clipping regression in the retained qualified one-pixel
control. Explicit `colorModel=color-reset-slope-078-p9` routing permits a
live qualification capture independent of the application default. Corrective
640-by-400 captures with the experiment's exact camera show the promoted sunset
response and visible one-pixel stars at sunset plus one hour. Shared-sky RGB-
byte RMSE is `4.4705308752784809` at sunset and `1.23266099354202` at plus one
hour; full production cadence captures and owner appearance review remain P8
rather than being inferred from this gate.

# Production Color Reset Implementation Plan

Focus: Application attachment, lifecycle, state, and asset delivery.

Related owners: [release](../release/color-reset-implementation-plan.md), [sources-provenance](../../pure-research/sources-provenance/color-reset-implementation-plan.md), [color-celestial](../../production-algorithm32/color-celestial/color-reset-implementation-plan.md), [product-behavior](../product-behavior/color-reset-implementation-plan.md).

## P1 - Make Selections Explicit And Independent

Status: complete.

- Define typed Color identifiers `basic-bruneton` and
  `color-reset-slope-078-p9`.
- Define independent celestial enablement, stellar catalog, and ordered
  presentation-filter configuration.
- Remove the current coupling in which selecting Bruneton disables celestial
  sources.
- Reject unknown model, catalog, stage, target, filter, parameter, and
  incompatible-order selections.
- Initially defer the production default to P9 and use explicit selection
  during qualification. The later owner-directed activation is recorded under
  P9 and supersedes only this sequencing decision.

Gate: selector tests prove exact routing, no aliases, fail-closed behavior, and
independence among Color, sources, catalog, and filters.

Result: `Flat32ProductionSelections` owns typed exact identities and ordered
validation. Basic Bruneton no longer disables celestial sources in either
mode. Unknown selections and recognized P3/P5/P6 selections fail closed rather
than aliasing to current behavior. The initial pre-P9 default was the explicitly
identified source-luminance-lift model; the later owner-directed P9 selection
changes that default without changing P1's selection architecture. Both type checks pass, Algorithm32
passes `594/594`, and the focused Chrome Headless 153 Flat32 lane passes
`21/21` with its full-cache application case intentionally outside the basic-
cache run.


## P4 - Connect Receiver Light To Scene Lighting

Status: complete.

- Route direct-normal and diffuse-horizontal spectra to the existing scene
  lighting owner.
- Implement the accepted neutral Lambertian direct, diffuse, and additive
  combined relationships without using Color or photopic labels in spectral
  lighting equations.
- Preserve captured-scene composition at the single display boundary.
- Keep arbitrary materials, interreflection, new shadows, and local-Sun
  appearance outside this increment.

Gate: production reproduces the CR3 neutral direct-only, diffuse-only, and
combined relationships, including exact additivity and zero direct support
after sunset, while pixels outside the geometry mask remain unchanged.

Result: `NeutralLambertianSceneLighting` now owns the Color-free, unit-bearing
spectral equations. It accepts direct-normal irradiance, diffuse irradiance
already integrated for the evaluated surface, surface/source directions, and
the fixed neutral reflectance `rho=0.18`; it publishes separate direct,
diffuse, and exactly additive combined Native15 irradiance and outgoing-
radiance packets. Direct support is clamped only by `max(0,n dot s)`, while
the Lambertian scale is exactly `rho/pi`.

Flat32's existing scene-light owner now consumes the installed P2 direct-
normal and diffuse-horizontal spectra. The selected Color owner performs only
the subsequent Native15-to-linear-sRGB projection needed by Three; it does not
enter the spectral lighting equations. The derived directional and ambient
lights are installed before composed-frame preflight, retain the receiver-
light and packet identities, preserve the existing six-shadow lifecycle, and
are restored from the last published mode after a failed replacement. The
captured scene still enters the atmosphere at the single existing display
boundary.

The production Three black-ground upper-hemisphere adapter is exact for the
upward horizontal neutral surface represented by `diffuseHorizontal`; it is a
normal-dependent approximation for other surface normals because P2 does not
publish the full directional sky field. That non-horizontal directional-
diffuse question is recorded in the
[project-wide research backlog](../../../../references/followup.md#color-reset-research-questions)
and no broader claim is made.

Both type checks pass. Algorithm32 passes `605/605`, the Chrome Headless 153
WebGL lane passes `24/24`, the rebuilt focused Flat32 lane passes
`22/22`, and the full exact-cache application lane passes `23/23`.

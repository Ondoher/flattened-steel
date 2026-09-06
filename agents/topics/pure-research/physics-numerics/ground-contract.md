# Algorithm32 Ground Boundary

Focus: Physical and numerical claim authority.

Related owners: [qualification](../../production-algorithm32/qualification/ground-contract.md), [transport-geometry](../../production-algorithm32/transport-geometry/ground-contract.md).

## Future Ocean Ground Boundary

Ocean support is a stretch goal and is not represented as a uniform-
Lambertian material preset. Its initial design direction is a separate
`OceanGroundBoundary` implementation of the global `GroundBoundary` interface
that evaluates a wavelength- and direction-dependent, unpolarized ocean BRDF.

The first design pass should evaluate a physically bounded Fresnel/microfacet
surface model using the incoming direction, outgoing/view direction, surface
normal, wavelength-dependent water refractive properties, and a wave-slope or
roughness state driven by an explicit wind parameter. Foam and subsurface
water-leaving radiance should be separately selectable later contributions,
not values silently folded into a generic albedo.

The future contract must define parameter ranges, spectral data and citations,
cache identity and invalidation, CPU/GPU agreement, nonnegative finite output,
energy bounds, grazing-angle behavior, and Sun-glint cases before
implementation. It must also decide whether polarization remains deliberately
out of scope. Until that work is selected, create no ocean export, placeholder
class, preset albedo, or provisional numerical data.

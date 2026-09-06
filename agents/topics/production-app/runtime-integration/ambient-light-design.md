# Production Ambient-Light Design

Focus: Application attachment, lifecycle, state, and asset delivery.

Related owners: [appearance-review](../../poc-flat32/appearance-review/ambient-light-design.md), [release](../release/ambient-light-design.md).

## Problem

The receiver-light facade publishes a Native15 diffuse-horizontal irradiance
packet. The prior Three adapter placed its projected RGB in `AmbientLight`,
which applies the same indirect illumination to every surface normal. That is
exact only for the horizontal neutral surface represented by the measured
packet. It over-lights vertical and downward-facing surfaces and erases useful
shape cues.


## Selected First Approximation

Use one upper-hemisphere diffuse field:

- the `HemisphereLight` sky color is the existing projected
  diffuse-horizontal packet;
- the ground color is black, so this increment invents no lower-hemisphere
  bounce;
- the light axis is scene up;
- the existing receiver quadrature, neutral-Lambertian conversion, direct
  lights, materials, shadows, scene capture, and display boundary are retained.

Under a uniform upper-sky approximation, the horizontal upward surface receives
the complete measured diffuse-horizontal value, a vertical surface receives
one half, and a downward surface receives zero. This is a normal-dependent
approximation, not a reconstruction of directional sky radiance.

Returning to flat/local lighting resets both hemisphere colors and every
directional-light color to the local constants. This prevents distant-mode
spectral tint from leaking across a mode transition.

The receiver packets project through E8 to physical linear sRGB. Three's light
intensities are unitless renderer-linear values, so the adapter must not copy
those physical numbers directly. For each projected incident-light channel it
now applies the unchanged Bruneton Figure-1 exponential and then the inverse
standard-sRGB transfer before assigning the Three color/intensity pair. The
existing captured-scene bridge reverses those two operations during normal
composition, while the selected Color model remains unchanged. This operation
belongs to the scene-light adapter; it does not alter the atmosphere or Color
implementation.


## Deferred Scope

- directional or spatially varying sky-radiance reconstruction;
- lower-hemisphere ground bounce;
- arbitrary spectral materials and interreflection;
- tone/display changes or retuning the accepted atmosphere curve;
- moonlight and light pollution.

# Production Ambient-Light Design

Status: lighting-only bridge candidate implemented; owner appearance review
remains open.

This lane is production-owned. The completed Color Reset experiment provides
no ambient-light authority, and experimental algorithm precedence does not
apply. The accepted atmosphere, Color, stellar catalog, and presentation
filters remain unchanged.

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

## Isolation Control

The application exposes an `Atmosphere Shader: On/Off` diagnostic button. Off
bypasses only the final Algorithm32 atmosphere-composition render operation.
It renders the ordinary Three scene and lights into linear HDR, then applies
the existing renderer-linear-to-display conversion: clamp negative channels,
normalize a pixel only when its peak channel exceeds one, and encode sRGB.
This is the same scene-input display boundary used by the production
compositor. It does not apply the Bruneton physical-radiance exposure a second
time to renderer-scale Three light values. No atmospheric scattering,
transmittance, Color Reset gain, celestial source, or presentation filter is
evaluated. The path intentionally retains receiver ambient and direct light,
geometry, materials, camera, shadows, and already prepared Algorithm32
resources. The selection persists across transactional mode replacement and
can be reversed without rebuilding. The control is disabled while a candidate
runtime is being prepared, so it cannot expose transient capture passes.

This button is diagnostic instrumentation, not a second atmosphere or lighting
algorithm and not a release-mode selection.

## Deferred Scope

- directional or spatially varying sky-radiance reconstruction;
- lower-hemisphere ground bounce;
- arbitrary spectral materials and interreflection;
- tone/display changes or retuning the accepted atmosphere curve;
- moonlight and light pollution.

## Acceptance Boundary

Contract and browser tests establish routing, lifecycle, and exact toggle
behavior. Matched images with the shader both enabled and bypassed are required
before judging whether the remaining ambient-light magnitude or chromaticity is
credible. Runs `000016` and `000017` are the matched plus-one-hour lighting-
bridge candidate; runs `000018` and `000019` are its matched sunset endpoint.
At plus one hour the bridged hemisphere intensity is
`0.000010643550067986926` and direct intensity is zero. At sunset they are
`0.0902917757354653` and `0.0017027433434433892`, respectively. The new
shader-on captures no longer saturate scene geometry. Owner appearance review,
including whether plus-one-hour geometry is now too dark, remains open. Visual
dissatisfaction is not permission to alter the atmosphere or Color algorithm.

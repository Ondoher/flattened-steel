# Production Ambient-Light Design

Focus: Exploratory captures and qualitative candidate review.

Related owners: [runtime-integration](../../production-app/runtime-integration/ambient-light-design.md), [release](../../production-app/release/ambient-light-design.md).

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

# Earth Scene Resizing

Both Earth runtimes use the renderer's drawing-buffer dimensions for their
postprocessing targets, shader viewport and scene-input capture. These are
physical pixels. The shared `createSceneComposer` factory fixes the composer's
pixel ratio at one; only the renderer converts CSS dimensions using the device
pixel ratio. Camera aspect continues to follow the canvas's CSS bounds.

Previously, EffectComposer inherited the renderer's device pixel ratio and
applied it again to already scaled dimensions. At 200% scaling a 1000 by 575 CSS
canvas had a 2000 by 1150 drawing buffer, but the shader received 4000 by 2300.
Initially the supplied target retained its correct physical size while passes
were doubled; subsequent resizing doubled the targets as well. This made the
visible failure change after layout updates even though camera aspect was
already being updated correctly.

The fix preserves both runtimes' existing resize observers, projection updates,
retained scenes and physical cache behavior. Configuration, comparison views,
directional ribbons and window changes resize the existing render resources
without preparing another physical observation.

## Verification

Flat types, the normal application build and all 240 maintained browser tests
pass. The new regression uses the actual Three EffectComposer and targets to
check initial pass sizes and subsequent target/pass resizing at pixel ratios
1, 1.25, 1.5 and 2.

The native Chrome [200% live report](../../../.codex-tmp/scene-resize/20261108/proof-2/report.json)
checks configuration opened during initial preparation, one/two spherical views,
mixed Earth views, repeated configuration and ribbon toggles, narrow stacking,
wide layout restoration, and comparison closure/reopening. Camera/frame/binding
aspect ratios agree with CSS bounds. Composer targets, shader viewport,
scene-input capture and the native framebuffer viewport agree with the drawing
buffer. Layout changes retain canvases, renderers, frames and shader programs,
with no additional physical preparation calls or render errors.

The same live checks pass at [100% scaling](../../../.codex-tmp/scene-resize/20261108/proof-1/report.json)
and [125% scaling](../../../.codex-tmp/scene-resize/20261108/proof-1.25/report.json),
including fractional CSS-to-buffer rounding.

A daylight mixed-view [capture](../../../.codex-tmp/scene-resize/20261108/proof-2/day-mixed.png)
was inspected. Native pixel readback confirms green ground near the bottom of
both canvases, rather than an unrendered lower region. Browser profiles are
disposable and removed after runs. The earlier DPR-2 baseline remains under
`.codex-tmp/scene-resize/20261108/baseline/` for comparison.

Engineering standards reviewers remain cancelled. Primary self-review and the
focused checks above own this update; no independent compliance result is
claimed. Whole-repository checkpoint disposition is recorded in the
[camera-sync service final report](camera-sync-service-plan.md#m2-and-final-report).

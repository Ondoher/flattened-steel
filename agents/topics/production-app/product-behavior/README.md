# Product Behavior

Focus: Selected controls and explicit product backlog.

Stage 11.1-11.3 and parts of 11.4-11.6 are implemented. Remaining interaction/migration/reconciliation work and 11.8 acceptance are owner-deferred. Compatible-clock animation is now owned by [Production MVP requirement M1](../mvp/requirements.md#m1--compatible-time-and-location-animation).

## Working Documents

- [Center on Sun](center-on-sun.md) - Aim the retained camera at the Sun in the published scene.

- [Twilight exposure](twilight-exposure.md) - Matched-frame confirmation of excessive display gain at 40 km.

- [Interactive shader performance](shader-performance.md) - GPU frame-cost diagnosis and proposed motion-quality tier.

- [40 km elevation](forty-km-elevation.md) - Current elevation coverage, package selection and served GPU verification.
- [10 km elevation](ten-km-elevation.md) - Expanded elevation presets, fixed ground coverage and matching cache.
- [On-demand rendering](on-demand-rendering.md) — Idle scenes draw no frames; camera, controls, publication and visibility changes resume drawing. Matched GPU output is pixel-identical to the previous renderer.
- [Original Bruneton atmosphere](bruneton-atmosphere.md) - Current physical profile in both modes, retaining numerical corrections and full elevation support.
- [H2400 atmosphere](h2400-atmosphere.md) - Superseded physical selection; preserved integration evidence.
- [H2400 promotion plan](h2400-atmosphere-plan.md) ? Experiment closure and production integration.
- [Zero-aerosol atmosphere](zero-aerosol-atmosphere.md) — Prior zero-aerosol selection and rollback evidence; current default is original Bruneton.
- [Elevated horizon cache coverage](elevated-horizon-cache-coverage.md) — Exact-sunset black strip corrected by covering all solar bins through 2 km; old spectral bytes preserved and seven matched GPU views pass.
- [Shared-cache transition allocation](shared-cache-transition-status.md) — Remove policy-only transition failures while retaining real GPU failure handling.
- [Sky, scene and elevation controls execution](sky-scene-controls-execution.md) — Native controls and cache/scene-reusing elevations are implemented and locally qualified, with actual GPU comparisons and recovery checks. Standards sign-off awaits reviewer calibration.
- [Flat32 sky, scene and elevation controls plan](sky-scene-controls-plan.md) — Selected M1-M4 functionality is complete; the production review dependency remains open. Video scenes are deferred.
- [Algorithm32 Cache Interface Design](cache-design.md)
- [`flat32` Stage 11 Migration Inventory](flat32-migration-inventory.md)
- [Algorithm32 Production Implementation Plan](production-implementation-plan.md)

## Context Boundary

Load this entry and only the document required by the selected task. Use the
[primary topic](../README.md) to change focus. Standards follow affected source
folders through the [manifest](../../standards/manifest.md), never this topic.

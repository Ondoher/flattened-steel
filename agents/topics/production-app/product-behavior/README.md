# Product Behavior

Focus: Selected controls and explicit product backlog.

Stage 11.1-11.3 and parts of 11.4-11.6 are implemented. Remaining interaction/migration/reconciliation work and 11.8 acceptance are owner-deferred. Compatible-clock animation is now owned by [Production MVP requirement M1](../mvp/requirements.md#m1--compatible-time-and-location-animation).

## Working Documents

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

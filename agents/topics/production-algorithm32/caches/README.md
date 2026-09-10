# Caches

Focus: Cache construction, storage, reconstruction, loading, and optimization.

The one-degree distant-Sun cache is implemented and adopted. The current task
is production promotion of the accepted shared-block storage and GPU-resident
packet-atlas mechanism. Its contained storage, generator, transport,
residency, packet-rendering, animation, and final-audit experiments are closed.
D0 and D1 select the production architecture, and P1 implements the production
format, packet-mapping, runtime-publication, and rollout-response contracts.
P2 shared-inventory generation is implemented and
[qualified against all 109 controls](shared-generation-qualification.md).
P3 browser transport and Worker preparation is implemented and
[checked at its production boundaries](shared-transport-verification.md).
P4 renderer-owned packet-atlas primitives are implemented and
[checked through exact GPU probes](shared-atlas-verification.md).
P5 residency and atomic publication are implemented and
[checked against exact metadata and ownership boundaries](shared-residency-verification.md).
P6 shader and stable live-runtime integration are next. Historical POC, P0-P10, and PA0-PA7
execution remains archived and is not reopened.

## Working Documents

- [Selected Scattering Cache Contract](cache-contract.md)
- [Algorithm32 Cache Interface Design](cache-design.md)
- [Algorithm32 Current Dataflow](current-dataflow.md)
- [Distant-Sun Cache Optimization Design](distant-sun-cache-optimization-design.md)
- [Distant-Sun Cache Optimization Implementation Plan](distant-sun-cache-optimization-plan.md)
- [Flat Geometry And Local-Source Extension Contract](extension-contract.md)
- [Flat/Local GPU Transport Offload Plan](gpu-transport-offload-plan.md)
- [Selected Outgoing Reconstruction](outgoing-reconstruction.md)
- [Distant-Sun Solar-Zenith Scene-Cache Design](solar-zenith-cache-design.md)
- [Selected Spatial Reconstruction](spatial-reconstruction.md)
- [Stage 9.6 Containment Inventory](stage-9.6-containment-inventory.md)
- [Superseded Cache Alternatives](superseded-alternatives.md)
- [Flat/Local Cache Promotion Work](unresolved-research.md)

## Context Boundary

Load this entry and only the document required by the selected task. Use the
[primary topic](../README.md) to change focus. Standards follow affected source
folders through the [manifest](../../standards/manifest.md), never this topic.

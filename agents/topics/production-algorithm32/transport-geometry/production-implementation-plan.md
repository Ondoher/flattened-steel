# Algorithm32 Production Implementation Plan

Focus: Physical transport, geometry, ground, and source placement.

Related owners: [architecture-contracts](../architecture-contracts/production-implementation-plan.md), [qualification](../qualification/production-implementation-plan.md), [product-behavior](../../production-app/product-behavior/production-implementation-plan.md), [protocols](../../poc-experiments/protocols/production-implementation-plan.md).

## Spectral Quantity Policy

Bare arrays are not a general production boundary. Spectral packets carry the
physical quantity, unit as data, wavelength basis, point/bin semantics,
channel values, and required normalization/provenance identity.

Supported alternate units normalize before arithmetic. Addition and
comparison require compatible normalized units; multiplication and division
derive units; spectral integration applies wavelength-bin units exactly once.
The public quantity API validates and normalizes accepted packets before they
enter construction. Shaders consume that fixed canonical scalar
representation without revalidating it at the CPU/GPU seam. Spectral packets
and fields retain their direct quantity, unit, basis, precision, and
provenance contracts only where the calculation or compatibility checks
consume them. The complete retirement and direct assembly-declaration
boundary is owned by
[reconciliation Step 2.9](../../../../archives/topics/retired-20260906/agents/topics/algorithm32/archive/reconciliation-2026-08-04/algorithm32/reconciliation-plan.md#29-retire-descriptors-and-justify-assembly-declarations).

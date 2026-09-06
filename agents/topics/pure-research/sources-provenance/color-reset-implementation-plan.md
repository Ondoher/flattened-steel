# Production Color Reset Implementation Plan

Focus: Sources, datasets, licenses, and canonical claim registers.

Related owners: [release](../../production-app/release/color-reset-implementation-plan.md), [runtime-integration](../../production-app/runtime-integration/color-reset-implementation-plan.md), [color-celestial](../../production-algorithm32/color-celestial/color-reset-implementation-plan.md), [product-behavior](../../production-app/product-behavior/color-reset-implementation-plan.md).

## Promotion Precedence

When the accepted experiment and current production behavior disagree about an
algorithm, the experiment controls the equations, numerical parameters,
operation order, catalog ordering, and approved behavioral result. This rule
does not authorize copying the experiment's architecture or coding approach.

Production component ownership, interfaces, dataflow, lifecycle, resource
management, atomic publication, failure behavior, and integration boundaries
remain controlling. Repository guidance and coding standards control source
layout, implementation, verification, evidence, provenance, and documentation.
Contained code is an adaptation reference only and may not become a production
runtime dependency.

Stop for explicit review only when reproducing the selected algorithm raises a
concrete concern about units or inputs, numerical stability, a preserved
physical invariant, data verifiability or legal use, production performance or
resources, or failure to reproduce the accepted result. Otherwise, resolve the
conflict by implementing the experimental algorithm through the existing
production architecture and standards.


## P0 - Freeze Promotion Authorities And Inventory Production

Status: complete. The canonical evidence and ownership record is the
[production promotion manifest](../../production-algorithm32/color-celestial/color-reset-promotion-manifest.md).

- Record every accepted parent run, artifact identity, schema, source hash,
  derivation, equation, and selected parameter in one production promotion
  manifest.
- Record every unresolved third-party citation and first-party official-
  experiment boundary from the canonical
  [project-wide research register](../../../../references/followup.md#missing-third-party-sources-or-canonical-registrations). Apply the selected
  provisional-authority boundary: unresolved rows do not block P1-P7, but a
  URL, DOI, local payload, or contained run is not final authority and cannot
  close release qualification or the final P9 gate. Owner-directed application
  default activation does not change that boundary.
- Inventory current owners for Color construction, facade runtime bindings,
  receiver-environment state, direct source state, scene lighting, stellar
  source data, palette generation, collision handling, configuration, and
  Flat32 composition.
- Record the current 500-star source and palette identities and every fixed
  member-count or `501`-entry assumption.
- Pin the selected Windows/current-Chrome-Headless/WebGL2/ANGLE-D3D11/RTX 2060
  matrix in the promotion manifest, recording the exact browser version for
  each gate, including the 1920-by-1080 DPR 1 full-frame case and the bounded
  DPR 2 raster/lifecycle case.

Gate: the manifest authenticates CR2, CR3, CR4G, CR6C-G, CR7, and CR8; records
the provisional status and release effect of every open source-gap row; pins
the selected qualification matrix and no-public-redistribution boundary; and
the inventory has no unresolved owner or hidden fixed-500 assumption.

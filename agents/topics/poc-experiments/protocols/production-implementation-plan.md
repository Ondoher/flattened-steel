# Algorithm32 Production Implementation Plan

Focus: Bounded experiment admission, evidence, and promotion.

Related owners: [architecture-contracts](../../production-algorithm32/architecture-contracts/production-implementation-plan.md), [transport-geometry](../../production-algorithm32/transport-geometry/production-implementation-plan.md), [qualification](../../production-algorithm32/qualification/production-implementation-plan.md), [product-behavior](../../production-app/product-behavior/production-implementation-plan.md).

### 17. Establish standalone official experiments and archive exploration

- Build B1, B2, and B3 from the promoted production Algorithm32
  implementation, not an experimental implementation or compatibility lane.
- Make every official experiment independently runnable with its declared
  fixtures, references, controls, scorer, and output boundary owned here.
- Consolidate final retained references under `/references`, then archive the
  reference-tracking support scripts and meta documentation that were used to
  collect or reconcile them.
- Maintain source and fixture AMA citations in
  `/references/references.md`, and register every referenceable official
  experiment in `/references/experiments.md`.
- Archive exploratory work in this repository and in `C:\dev\poly-gc-react`
  without deleting the official evidence required to reproduce claims.

**Gate:** the official B-level suite runs against production Algorithm32 with
no exploratory runtime dependency, and every retained official experiment has
a standalone reproduction path. `/references` contains the final retained
reference collection before its tracking support is archived.

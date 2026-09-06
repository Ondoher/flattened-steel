# Algorithm32 Production Implementation Plan

Focus: Engine conformance and production benchmark export.

Related owners: [architecture-contracts](../architecture-contracts/production-implementation-plan.md), [transport-geometry](../transport-geometry/production-implementation-plan.md), [product-behavior](../../production-app/product-behavior/production-implementation-plan.md), [protocols](../../poc-experiments/protocols/production-implementation-plan.md).

### 0. Establish the imported production baseline — in progress

- The source implementation has been copied into `src/algorithm32`; establish
  parity for its retained physical behavior while current contracts replace
  retired boundary shapes directly.
- Identify and record the exact source revision and complete imported file,
  fixture, and test surface.
- Record the source revision, original relative paths, and content hashes in a
  durable import manifest.
- The standalone Jasmine configuration and
  `npm run test:algorithm32` command are integrated and execute all
  current adjacent production specs. Add the public entry point and establish
  pinned-source parity for the retained tests and fixtures.
- Record a small stable set of native-15 CPU outputs at bottom/interior/high
  positions, representative directions, and all channels.
- Remove any retained runtime import or filesystem dependency on the source
  repository; the copied baseline must run standalone here.
- Repair stale local allowlists/snapshots so failures in the imported baseline
  are distinguishable from historical experiment files.

**Gate:** the copied package builds and passes its imported tests here; selected
outputs match both the source implementation and sealed research values; the
import manifest is complete; and no runtime import reaches either the source
repository or research code.


### 15. Harden spherical/distant Algorithm32

This is follow-on release acceptance, not a blocker between visible ground,
flat/local, composition, `flat32`, and extraterrestrial implementation stages.

- Run full CPU/GPU ray parity and former-altitude-boundary continuity.
- Reproduce sealed native-15 and direct-40 order-4 boundaries before scoring.
- Measure cold/rebuild time, peak/resident memory, frame cost, lookup cost, and
  staged-build responsiveness on supported hardware.
- Declare release budgets before readiness judgment. A performance miss blocks
  promotion; it does not silently change order 4 or a selected domain.

**Gate:** parity, continuity, lifecycle, dome sanity, and declared performance
budgets pass for the exact production build.


## Verification Ladder

1. typed quantity contracts and executable storage invariants;
2. analytic atmosphere, phase, transport, boundary, and color identities;
3. CPU selected-value and complete-ray fixtures;
4. GPU scalar probes for every pass and order;
5. lifecycle and invalidation tests;
6. runtime CPU/shader parity and altitude continuity;
7. sealed native-15 and direct-40 boundary reproduction;
8. mandatory B1/B2/B3 scoring and figures;
9. full Figure 1 sanity; and
10. measured build, memory, and steady-state performance.

Images diagnose coherent artifacts but do not replace pre-display spectral
checks. Implementation parity proves faithful implementation, not physical
truth; external benchmarks retain that role.


## Follow-On Hardening Work

1. Complete the import manifest and standalone parity record.
2. Complete source and fixture AMA citations and verify the canonical
   reference and experiment registers.
3. Expand the integrated production suite for CPU/GPU parity and lifecycle
   acceptance, and clear the package-wide JSDoc/static-type baseline.
4. Run the complete release and official-experiment acceptance ladder.

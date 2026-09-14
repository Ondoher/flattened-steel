# Algorithm32 Production Implementation Plan

Focus: Engine conformance and production benchmark export.

Related owners: [architecture-contracts](../architecture-contracts/production-implementation-plan.md), [transport-geometry](../transport-geometry/production-implementation-plan.md), [product-behavior](../../production-app/product-behavior/production-implementation-plan.md), [protocols](../../poc-experiments/protocols/production-implementation-plan.md).

## Current Selected Work

The [distant-Sun strobing promotion](../caches/distant-sun-strobing-promotion-plan.md)
is the next selected production work. It owns the bounded cache/interpolation
Bruneton qualification and separate color/recording checks; its
[status](../caches/distant-sun-strobing-promotion-status.md) owns execution state.
The broader deferred hardening scope below remains with MVP M2.

### 0. Establish the imported production baseline — implementation established; remaining evidence relocated

- The source implementation has been copied into `src/algorithm32`; parity for
  its retained physical behavior is part of M2 while current contracts replace
  retired boundary shapes directly.
- The standalone Jasmine configuration and
  `npm run test:algorithm32` command are integrated and execute all
  current adjacent production specs. The outstanding import manifest,
  pinned-source parity, stable native-15 CPU outputs, dependency audit, and
  stale-fixture reconciliation are deferred under
  [Production MVP requirement M2](../../production-app/mvp/requirements.md#m2--algorithm32-production-hardening).

### 15. Harden spherical/distant Algorithm32

**Status: deferred and relocated.** Parity, continuity, lifecycle, dome sanity,
sealed-boundary reproduction, resource measurement, and declared performance
budgets are now owned by
[Production MVP requirement M2](../../production-app/mvp/requirements.md#m2--algorithm32-production-hardening).

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

This work is deferred and consolidated under
[Production MVP requirement M2](../../production-app/mvp/requirements.md#m2--algorithm32-production-hardening).
The verification ladder above remains the definition consumed by that gate.

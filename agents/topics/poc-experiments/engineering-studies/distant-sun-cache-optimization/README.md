# Distant-Sun Cache Optimization Experiment

Status: C0 controls accepted; E1 is next.

## Objective

Determine the exact-value shared-block format, browser transport, retention
behavior, and bounded generation strategy that materially reduce distant-Sun
cache storage and generation time without changing accepted runtime results.

## Governing Documents

- [Design](design.md)
- [Plan](plan.md)
- [Status](status.md)
- [Production design](../../../production-algorithm32/caches/distant-sun-cache-optimization-design.md)
- [Production implementation plan](../../../production-algorithm32/caches/distant-sun-cache-optimization-plan.md)

## Repository Surfaces

- Authored source and controls: `experiments/distant-sun-cache-optimization/`
- Generated output: `tmp/experiments/distant-sun-cache-optimization/`
- Production and other experiments: read-only unless separately authorized

The production documents provide requirements and candidate defaults. This
experiment owns only contained comparison evidence and does not select or
modify production architecture.

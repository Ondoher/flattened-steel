# Distant-Sun Cache Optimization Experiment

Status: C0, E1, E2, and E3 are independently accepted. D0 recommends a
separately authorized production promotion.

## Objective

Determine the exact-value shared-block format, browser transport, retention
behavior, and bounded generation strategy that materially reduce distant-Sun
cache storage and generation time without changing accepted runtime results.

## Governing Documents

- [Design](design.md)
- [Plan](plan.md)
- [Status](status.md)
- [D0 decision](decision.md)
- [Production design](../../../production-algorithm32/caches/distant-sun-cache-optimization-design.md)
- [Production implementation plan](../../../production-algorithm32/caches/distant-sun-cache-optimization-plan.md)

## Repository Surfaces

- Authored source and controls: `experiments/distant-sun-cache-optimization/`
- Generated output: `tmp/experiments/distant-sun-cache-optimization/`
- Production and other experiments: read-only unless separately authorized

The production documents provide requirements and candidate defaults. This
experiment owns only contained comparison evidence and does not select or
modify production architecture.

## One-Shot Commands

Generate a new immutable E1 comparison run from the repository root:

```text
npm run experiment:distant-sun-cache:e1
```

Generate a new immutable E2 browser-transport run against an externally
started loopback Chrome DevTools endpoint:

```text
npm run experiment:distant-sun-cache:e2
```

Generate a new immutable E3 bounded-generator run:

```text
npm run experiment:distant-sun-cache:e3
```

Independently verify one sealed run by its complete directory identity:

```text
npm run verify:experiment:distant-sun-cache:run -- <six-digit-run-id-and-slug>
```

Exercise the positive and negative E1 contract probes against a sealed E1 run:

```text
npm run verify:experiment:distant-sun-cache:e1-contracts -- <six-digit-e1-format-compression-run-id>
```

All commands terminate nonzero on failed contracts or evidence. Generated
artifacts remain below the ignored experiment output root.

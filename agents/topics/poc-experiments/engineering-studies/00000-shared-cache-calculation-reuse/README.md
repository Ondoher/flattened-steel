# Shared Cache Calculation Reuse Experiment

Focus: Additional calculation reuse and retained GPU execution, beginning with existing application data.

## Objective

Plan unique calculation requirements and shared result inventories for input-driven scene lists, minimizing repeated GPU work and setup while preserving qualified cache results.

## Governing Documents

- [Design](design.md)
- [Plan](plan.md)
- [Status](status.md)

## Repository Surfaces

- Authored source and controls: `experiments/00000-shared-cache-calculation-reuse/`
- Generated output: `tmp/experiments/00000-shared-cache-calculation-reuse/`
- Production and other experiments: read-only unless separately authorized

## Starting Point

Use the 109 prevalidated application caches and their qualified shared package.
The baseline already shares common fields; additional savings must be measured
against that generator. The separate 17-scene, 40-spectrum Bruneton set follows
after the application proofs. Scene counts come from inputs, not fixed limits.

The application inventory, planner, retained GPU calculation, bounded residency,
and host lifecycle proofs have passed. Direct-40 compatibility is in progress.
See [status](status.md) for exact run identities and remaining work.

The separate production qualification decision remains with the
[ground-contact investigation](../../benchmarks/production-b-family-ground-contact-investigation.md).
This experiment does not change its acceptance rules or resolve its open gate.

# Algorithm32 Validation

Status: current validation-design topic; production validation and official
experiment promotion remain open.

This topic owns whole-algorithm scientific claim boundaries, external
benchmark definitions, qualitative dome diagnostics, and the path by which
retained research evidence becomes standalone production evidence. It does
not own cache numerical design, implementation sequence, unit-test
architecture, citations, or the canonical official-experiment index.

## Current Evidence State

Retained CPU research boundaries exist for the native 15-channel calculation
and a direct 40-coordinate paper profile. They provide useful order-selection
and implementation-planning evidence, but they do not establish production
GPU parity, release acceptance, or official publication status in this
repository. Presence under `/references/results` does not by itself make an
experiment official; registration and standalone reproduction are owned by
[`/references/experiments.md`](../../../../references/experiments.md).

The production cache separately has accepted selected-scalar N1/N2/N4
CPU/GPU construction parity under its predeclared bounds. That is focused
implementation-conformance evidence; it does not establish whole-runtime
output parity, supported-hardware performance, an external physical benchmark,
or publication readiness.

The production default remains cumulative order 4 by project policy. External
benchmarks inform that policy but do not prove convergence or choose an
optimal release order by themselves.

## Working Documents

- [External benchmark contract](external-benchmarks.md) defines B1, B2, and
  B3, summarizes the retained CPU evidence, records claim limits, and specifies
  production promotion.
- [Figure 1 diagnostic](figure1-diagnostic.md) defines the retained dome
  comparison and its strictly qualitative role.

## Production Validation Sequence

1. Finish the production capability's CPU contract and deterministic oracle.
2. Finish the matching GPU construction/runtime path and focused parity.
3. Export durable CPU-oracle and production-GPU spectral boundaries with
   complete descriptors and provenance.
4. Run the benchmark scorers as separate consumers of those exported values;
   scorers must not import either implementation.
5. Register the accepted standalone experiment and artifacts in
   `/references/experiments.md` before using them in source, fixture, or paper
   citations.

Full benchmark and official-experiment hardening follows visible integration,
but is required before release acceptance or publication. CPU-only benchmark
evidence cannot complete a GPU production phase.

## Archive Sources

The prior benchmark and dome narratives remain in the
[topic-documentation archive](../../../../archives/topic-documentation-archive-2026-07-19.zip).
This topic contains their durable contracts and current claim boundaries, not
their chronology or old execution paths.

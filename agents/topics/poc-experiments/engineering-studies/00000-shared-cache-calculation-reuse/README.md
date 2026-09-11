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

The immediate task is a fresh [evaluation of the current production builder](current-builder-evaluation.md).
The first candidate's E0-E6 plan is complete. Application reconstruction, retained GPU
calculation, bounded residency, lifecycle, and direct-40 compatibility proofs
have passed. Retain this candidate as exactness and lifecycle evidence;
overall runtime improvement is not established. See [status](status.md) for
run identities, measured results, and the candidate disposition. The original
runtime-improvement objective remains open. Diagnosis found that the B1 adapter
bypasses the accepted local Sun-angle cache dimension. Optimization evaluation
starts with the correct production shared builder; later B1 work must adapt that
path and qualify against accepted Color Reset run 65.

The separate production qualification decision remains with the
[ground-contact investigation](../../benchmarks/production-b-family-ground-contact-investigation.md).
This experiment does not change its acceptance rules or resolve its open gate.

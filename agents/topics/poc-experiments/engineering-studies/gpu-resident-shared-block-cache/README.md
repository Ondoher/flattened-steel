# GPU-Resident Shared-Block Cache Experiment

Status: accepted and closed. S6, S7, and the S9 animation evidence are
complete; remaining S8 candidates and S9.7 are explicitly deferred. Post-close
R0 extraction released the reusable machinery at
`scripts/animation-evidence/` without changing this experiment or its evidence.

## Objective

Measure whether a GPU-resident atlas of decompressed shared distant-Sun cache blocks can support rapid animated scene switching without changing exact sampled values.

## Governing Documents

- [Design](design.md)
- [Plan](plan.md)
- [Status](status.md)
- [Decision](decision.md)

## Repository Surfaces

- Authored source and controls: `experiments/gpu-resident-shared-block-cache/`
- Generated output: `tmp/experiments/gpu-resident-shared-block-cache/`
- Production and other experiments: read-only unless separately authorized

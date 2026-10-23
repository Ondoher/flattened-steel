# Elevated Horizon Validation

Status: baseline execution complete and verified on 2026-10-23; published-profile
follow-on executing with acquired OPAC data and 5 m/10 km probes. Production unchanged.

Determine whether the low-contrast elevated globe horizon is justified by the
selected atmosphere or arises from numerical transport or rendering. Start with
matched libRadtran calculations; follow other leads when evidence supports them.
A sharp shader-off boundary and pale shader-on ground are observations, not a
verdict that production or the Bruneton profile is wrong.

## Governing documents

- [Results](results.md): matched comparison, profile controls and conclusions.
- [Alternate profiles plan](alternate-profiles-plan.md): download and test
  published clean aerosol models; conditional scene renders and measured-data route.
- [Execution log](execution-log.md): consequential choices and recovery.

- [Design](design.md): baseline, comparison semantics and immutable output contract.
- [Completed baseline plan](plan.md): original libRadtran-first milestones and decisions.
- [Status](status.md): current evidence, plan critique and the next executable step.

## Repository surfaces

- Authored source and controls: `experiments/elevated-horizon-validation/`.
- Generated output: `tmp/experiments/elevated-horizon-validation/`.
- Existing [libRadtran tool](../../../../../scripts/libradtran/README.md): read-only tool dependency.
- [Current production baseline](../../../production-app/product-behavior/ten-km-elevation.md): read-only.
- Other experiments and all earlier evidence remain read-only; none is reopened.

The owner authorized the completed baseline execution through independent-execution.
The published-profile follow-on is also authorized through independent-execution. Neither
plan authorizes production promotion or reopening another experiment.

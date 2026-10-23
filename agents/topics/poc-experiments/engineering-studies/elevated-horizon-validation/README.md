# Elevated Horizon Validation

Status: prepared on 2026-10-23; no numerical execution has begun.

Determine whether the low-contrast elevated globe horizon is justified by the
selected atmosphere or arises from numerical transport or rendering. Start with
matched libRadtran calculations; follow other leads when evidence supports them.
A sharp shader-off boundary and pale shader-on ground are observations, not a
verdict that production or the Bruneton profile is wrong.

## Governing documents

- [Design](design.md): baseline, comparison semantics and immutable output contract.
- [Plan](plan.md): libRadtran-first milestones, decisions and permitted follow-ons.
- [Status](status.md): setup verification and the next executable step.

## Repository surfaces

- Authored source and controls: `experiments/elevated-horizon-validation/`.
- Generated output: `tmp/experiments/elevated-horizon-validation/`.
- Existing [libRadtran tool](../../../../../scripts/libradtran/README.md): read-only tool dependency.
- [Current production baseline](../../../production-app/product-behavior/ten-km-elevation.md): read-only.
- Other experiments and all earlier evidence remain read-only; none is reopened.

Creation authorizes this scaffold and plan. Solver execution and production
promotion are separate steps. No production update is proposed by this setup.

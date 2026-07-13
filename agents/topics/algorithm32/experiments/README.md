# Algorithm32 Experiments

Status: active scientific-experiment and engineering-evidence topic.

This topic owns the working definitions, lane boundaries, readiness,
engineering-study plans, and publication-promotion work for Algorithm32
experiments. It does not own production implementation tests or the
publication-facing experiment index.

## Experiment Lanes

| Lane                                      | Purpose                                                                                                                       | Implementation boundary                                                                                                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preimplementation fact experiments        | Establish a formula, value, conservation identity, numerical choice, sensitivity, or claim boundary before it is implemented. | Use external sources, analytic inputs, and experiment-local calculations. Do not import Algorithm32, `flat32`, a renderer, generated shaders, or another repository.                                |
| Archived Star engineering feasibility     | Historical Algorithm32 calculation, cache-coordinate, storage, and CPU/GPU evidence from the closed Star lane.                | The retired documentation is [archived](../archive/algorithm32-star/README.md); the executable bridge and evidence capsule no longer exist. Any new engineering study requires a new isolated lane. |
| Post-promotion whole-algorithm benchmarks | Compare the promoted Algorithm32 output with published measurements or reference solvers.                                     | B1--B3 may obtain their proposed-method boundary from production Algorithm32 after promotion. Their external reference data, scorer, criteria, and report remain independently reviewable.          |
| Production tests                          | Verify that CPU and GPU implementations conform to accepted contracts and fixtures.                                           | These are Jasmine unit/integration tests owned by the [testing topic](../../testing/README.md), not scientific experiments.                                                                         |

The existing preimplementation scientific runners and their `node:test`
self-checks are scientific-artifact infrastructure. A later conversion of
those self-checks to Jasmine does not turn the experiments into production
tests or make a test result scientific authority. The archived Star
engineering runners followed a separate dedicated lane contract.

The closed Star engineering lane remains separate from the official
preimplementation lane. Its use of the selected test bed's executable
primitives and GPU infrastructure means an archived immutable run alone cannot
satisfy the independence rule. A separately written independent reference or
official experiment must still pass the experiment contract and promotion
checklist before a paper-facing claim is registered.

## Current Working Documents

- [Experiment contract](experiment-contract.md) defines admission,
  independence, output, and claim-boundary rules.
- [Retained experiments](retained-experiments.md) gives the reusable current
  definitions for E1--E8, C1--C2, and B1--B3.
- [Extraterrestrial promotions](extraterrestrial-promotions.md) defines the
  open XA1--XA3 work without relying on another repository.
- [Promotion checklist](promotion-checklist.md) defines when a retained or new
  experiment becomes official and citable.
- [Local-Sun shell-cache characterization plan](local-sun-shell-cache-experiment-plan.md)
  owns the terminal engineering sequence and accepted history for the
  scattering-aligned family.
- [Terminal Star flat/local dome-cache plan](star-flat-local-cache-plan.md)
  owns the accepted boundary/coordinate prerequisites and rejected v2-v4
  evidence. It is not the current execution plan.
- The retired Star lane has no runnable tree. Its historical documentation is
  [archived](../archive/algorithm32-star/README.md).

## Current Register

| Set                                           | Scientific state                                                                                                                                                                                                                                                                                                                                         | Publication state                                                                                      | Next action                                                                                                                                                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local-Sun scattering-aligned shell facts      | The terminal [shell-cache plan](local-sun-shell-cache-experiment-plan.md) and historical documentation are [archived](../archive/algorithm32-star/README.md). The path-pinned CPU-gold/report closure was retired and is not a production validation input.                                                                                              | Not official or citable; it is historical engineering evidence, not an independent physical authority. | Closed. Any new study receives a new isolated lane and identity rather than extending the archived tree.                                                                                                            |
| Terminal Star flat/local dome cache           | The [archived plan](star-flat-local-cache-plan.md) records accepted Stages 0 through 2 and the rejected Stage 3 node-additive path: focused run `000201` accepts 165/165 tests, deciding run `000202` rejects candidate-v4 on its four frozen accuracy gate IDs, and the unchanged resident ceiling closes further refinement under this representation. | Not official or citable; Star has no integrated flat/local N-order producer                            | No continuation of this candidate lineage is authorized. Its accepted prerequisites may be reused only through the pins declared by the new shell-cache plan.                                                       |
| E1--E3, E8                                    | Retained runnable local evidence                                                                                                                                                                                                                                                                                                                         | Not canonical until individually registered in `/references/experiments.md`                            | Audit each standalone boundary and promote it through the checklist.                                                                                                                                                |
| E4--E7 (`EXPERIMENT-A32-WF-000011`--`000014`) | Retained promotion candidates; 27 direct tests currently pass                                                                                                                                                                                                                                                                                            | Not official or citable; imported records and passing runners do not confer publication status         | Repair terminology/units, stable IDs, exact command/input identity, hashes, and claim limits, then promote and register each experiment. E6/E7 also require explicit weight semantics.                              |
| C1--C2                                        | Conditional definitions                                                                                                                                                                                                                                                                                                                                  | Not run or registered                                                                                  | Run only when the corresponding broader accuracy claim is made.                                                                                                                                                     |
| B1--B3                                        | Retained benchmark definitions and artifacts                                                                                                                                                                                                                                                                                                             | Production-backed official rerun pending                                                               | After production promotion, regenerate the proposed-method boundary from production Algorithm32 and register the accepted runs.                                                                                     |
| XA1--XA2                                      | Defined and ready for implementation                                                                                                                                                                                                                                                                                                                     | Required; not created                                                                                  | Implement as standalone preimplementation experiments atop independently restated E4--E7 identities.                                                                                                                |
| XA3                                           | Planned; protocol research incomplete                                                                                                                                                                                                                                                                                                                    | Required; not created and not citable                                                                  | Make Sun/Sirius outcomes independently classifiable or split the deferred Moon branch, then predeclare the applicable domains, operators, oracles, uncertainties, tolerances, and source-specific comparison roles. |

The ER6/ER8 San Jose and Union Glacier eight-case matrix is a subjective
rendering fixture, not an experiment domain. It cannot support a scientific,
numerical, implementation, or publication claim, and it is forbidden as an
oracle or case domain for XA3. It must not be promoted as XA4 or cited as
official evidence.

Only the repository-level [official experiment index](../../../../references/experiments.md)
makes an experiment referenceable by source, fixture, or paper prose. A
historical acceptance label, archived run, current runner, or passing
self-check does not do that by itself.

Detailed discovery chronology and superseded experiment variants remain in
[the topic-documentation archive](../../../../archives/topic-documentation-archive-2026-07-19.zip).

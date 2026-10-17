# Predictable Sky Accuracy Dials Experiment

Keep authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests below this directory. Write every generated artifact below `../../tmp/experiments/sky-accuracy-dials/`; never write generated output into this source tree.

Read the experiment [topic](../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/README.md), [design](../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/design.md), [plan](../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/plan.md), and [status](../../agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/status.md) before implementation.

Production and other experiments are read-only unless the engineer separately authorizes a broader write scope. Every long-running process must follow the design's monitorable-progress contract. Run `npx --no-install tsc -p experiments/sky-accuracy-dials/jsconfig.json` after authored code changes.

Follow the [repository experiment verification policy](../../AGENTS.md#contained-experiment-verification): dedicated standards reviewers and independent review audits are disabled for experiments and their owning topic documents. Keep checkpoint-advisor monitoring active and continue local checks, self-review, and experiment proof/evidence validation. Reviewer readiness or compliance ledgers are not experiment completion gates.

The owner explicitly authorizes deletion of this experiment's unneeded,
reproducible scratch. The design defines that scratch boundary, ownership
checks, cleanup record, and disk budgets. This does not authorize deletion of
prior evidence or files being copied by the owner. Retained runs are immutable.

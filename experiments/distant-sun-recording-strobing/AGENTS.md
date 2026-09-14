# Distant-Sun Recording Strobing Experiment

Keep authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests below this directory. Write every generated artifact below `../../tmp/experiments/distant-sun-recording-strobing/`; never write generated output into this source tree.

Read the experiment [topic](../../agents/topics/poc-experiments/engineering-studies/distant-sun-recording-strobing/README.md), [design](../../agents/topics/poc-experiments/engineering-studies/distant-sun-recording-strobing/design.md), [plan](../../agents/topics/poc-experiments/engineering-studies/distant-sun-recording-strobing/plan.md), and [status](../../agents/topics/poc-experiments/engineering-studies/distant-sun-recording-strobing/status.md) before implementation.

Production and other experiments are read-only unless the engineer separately authorizes a broader write scope. Every long-running process must follow the design's monitorable-progress contract.

Run `npx --no-install tsc -p experiments/distant-sun-recording-strobing/jsconfig.json`
after authored code changes. Follow the repository's contained-experiment
verification policy: canonical `types.md` review by `contracts-reviewer` is
required in addition to type checking, with readiness, context refresh, and
validated evidence managed through `review-standards`. Experiment-specific
evidence gates in the design and plan still apply.

# Testing

Focus: Bounded experiment admission, evidence, and promotion.

Related owners: [qualification](../../production-algorithm32/qualification/testing-contract.md), [runtime-integration](../../production-app/runtime-integration/testing-contract.md).

## Experiment Migration

Current experiments use Node-based runners. The contained extraterrestrial
lane remains runner-only under [its instructions](../../../../experiments/extraterrestrial/AGENTS.md):
do not create or run an experimental unit-test tree or migrate its checks to
Jasmine. Closed lanes remain closed; archived runners are historical evidence,
not an instruction to execute them.

For a separately authorized experiment outside that contained lane, a future
explicit testing decision may convert checks to Jasmine without changing the
scientific boundary:

1. preserve the experiment's declared inputs, oracle, iteration definition,
   acceptance criteria, output schema, and durable result;
2. move deterministic assertions into adjacent Jasmine specs or an
   experiment-local Jasmine configuration;
3. keep the experiment runner responsible for producing the independently
   reproducible published artifact; and
4. register the accepted result in `/references/experiments.md`.

Do not turn an experiment into a test that imports production Algorithm32 or
an application. Production tests and experiments remain separate evidence
lanes even when both use Jasmine.

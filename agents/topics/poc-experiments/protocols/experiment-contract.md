# Algorithm32 Scientific Experiment Contract

Status: current contract.


## Admission Boundary

Create a scientific experiment only when a paper-facing fact needs empirical
selection, convergence, sensitivity, conservation, calibration, or
output-boundary evidence that cannot be closed by an external authority or an
analytic derivation alone. Ordinary implementation work, test coverage,
dimensional derivation, citation cleanup, and project status do not qualify.

An experiment establishes an observable fact at its declared boundary. Its
acceptance criterion may concern a physical value or type, formula,
transformation, invariant, error, uncertainty, or output. It must not require
a particular class, helper, call count, module path, cache layout, export
surface, or internal execution order.


## Independence

A preimplementation experiment:

- starts from completely declared physical boundary data;
- computes its expected result with an independent analytic, external, or
  separately written oracle;
- runs from a fresh checkout of this repository without another repository;
- does not import or invoke production Algorithm32, `flat32`, an application,
  generated shader, or renderer; and
- reports shared-code risk whenever the runner and oracle use common logic.

It may start at an intermediate boundary. For example, a composition
experiment may receive completed spectral packets rather than run atmospheric
transport. That validates the stated composition fact, not the upstream
producer of those packets.

B1--B3 are the deliberate exception to the production-import restriction.
After Algorithm32 is promoted, those whole-algorithm benchmarks use its
declared output as the proposed-method boundary. Their published measurements,
reference values, input mapping, scorer, criteria, and result interpretation
must remain independent of the implementation being scored.


## Standalone Shape

An official experiment owns, directly or by exact repository-local links:

1. a stable experiment ID and paper-facing name;
2. the question and facts supported;
3. complete external inputs, local payload identities, units, geometry, and
   interpretation;
4. an explicit iteration unit and complete case domain;
5. the runner and any experiment-local deterministic data generator;
6. an independent oracle and predeclared tolerances or classification rules;
7. one current result with the input identity, result rows, conclusion, and
   artifact hashes; and
8. explicit non-claims and known limitations.

Every run reports the experiment ID/name/question, complete input identity,
iteration count, one row per iteration, and a conclusion that directly
answers the question. An accepted result is current state rather than a
rolling run log. Superseded or rejected runs belong in archival evidence when
they remain useful.

Large or systematic inputs may be created by an experiment-local generator.
The result records its parameters, ranges, algorithm, and explicit random
seed. Randomized coverage supplements named edge cases; it never replaces
deterministic acceptance cases.


## Scientific Status

- `planned`: required definition or runner is not complete.
- `research-blocked`: the question is known but an external authority or input
  boundary is still missing.
- `ready`: the question, inputs, and oracle are sufficient to implement.
- `in-progress`: a standalone runner exists but its acceptance work is open.
- `accepted`: the declared run satisfied its predeclared scientific criterion.
- `rejected`: the run completed and rejected its criterion.
- `conditional`: required only if its named broader claim is made.

Scientific acceptance and publication promotion are separate. An experiment
becomes citable only after it also satisfies the
[promotion checklist](promotion-checklist.md) and is registered in
`/references/experiments.md`.


## Tests Are A Different Boundary

Experiment self-checks verify the runner, oracle invariants, parsing, and
report construction. They may later move from `node:test` to Jasmine, but
remain part of the scientific artifact.

Jasmine tests under the production test lane verify Algorithm32 CPU behavior,
GPU behavior, CPU/GPU parity, lifecycle, and application integration against
accepted facts. A passing Jasmine test proves conformance to its oracle for
the identified implementation; it cannot establish the physical fact that
supplied the oracle.

# Official Experiment Promotion Checklist

Status: current publication gate.

An experiment is referenceable only after every applicable item below is
complete and its entry is added to `/references/experiments.md`.

## Definition And Evidence

- [ ] Assign one stable ID and paper-facing name; do not reuse or renumber an
  existing ID.
- [ ] State one answerable question, the facts it supports, and explicit
  non-claims.
- [ ] Declare the physical input/output boundary, units, basis, geometry,
  iteration unit, and complete case domain.
- [ ] Pin every external authority in `/references/references.md` and every
  retained payload by repository-local path, version, hash, license, and exact
  locator.
- [ ] Predeclare the independent oracle, shared-code risk, tolerance,
  uncertainty budget, and any favorable/limited/adverse classification rules
  before viewing the deciding result.
- [ ] Keep preimplementation experiments free of production, application,
  renderer, shader, cache, and external-repository dependencies.
- [ ] For B1--B3 only, identify the exact promoted production revision and
  proposed-method output boundary while keeping the external scorer and
  reference independent.

## Runnable Artifact

- [ ] Run from a fresh checkout of this repository using only declared local
  inputs and documented external acquisition steps, if any.
- [ ] Report ID, name, question, complete input identity, iteration count, one
  result row per iteration, and a direct conclusion.
- [ ] Use experiment-local deterministic generators and explicit seeds where
  generated cases are needed.
- [ ] Make failure to execute or failure of the scientific criterion return a
  nonzero status.
- [ ] Retain one current result and hash every result-bearing artifact needed
  by the claim; archive superseded chronology separately.
- [ ] Verify runner self-checks independently of the production Jasmine lane.
  Migrating these self-checks from `node:test` to Jasmine later does not change
  the scientific boundary.

## Publication And Consumers

- [ ] Review the result and set its scientific status without treating a pass
  label, image, or historical result as authority.
- [ ] Add the experiment to `/references/experiments.md` with definition,
  inputs, command, controls, output, result, artifact hashes, and claim limit.
- [ ] Update each supported row in
  `/references/algorithm32-working-facts.md` to cite the official experiment;
  remove any `not yet created` placeholder only then.
- [ ] Cite the experiment ID directly from source or fixtures. Do not give a
  first-party experiment an AMA number.
- [ ] Confirm that no topic document, archived record, source-repository path,
  test pass count, or package-local reference list is acting as a parallel
  citation authority.

## Set-Specific Work

- E1--E8: audit the existing runner/result pairs against this checklist and
  register only the facts each boundary actually establishes.
- C1--C2: leave conditional until the corresponding broader claim is proposed.
- B1--B3: retain current artifacts as research evidence; after production
  promotion, regenerate the proposed boundary from production Algorithm32 and
  accept the three-record set under predeclared combined judgment rules.
- XA1--XA3: implement from the current standalone definitions.
- ER6/ER8 subjective globe cases: never promote them as experiment evidence;
  they remain rendering fixtures only.

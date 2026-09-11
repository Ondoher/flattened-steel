# Official Experiment Promotion Checklist

Status: current publication gate.

An experiment is referenceable only after every applicable item below is
complete and its entry is added to `/references/experiments.md`. This checklist
implements the binding
[official-experiment policy](../../../../references/citation-and-retention-policy.md#official-experiments);
it does not create a second authority.


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
- [ ] Preserve accepted non-paper parameters for comparable reruns, or record
  a technical reason and supporting evidence for each change before viewing
  the deciding result. Score improvement alone is not sufficient.
- [ ] Assign a protocol revision and, when the paper-facing question changes,
  a new experiment ID for changes to the observable, case domain, external
  source, oracle, threshold, or classification meaning.
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
- [ ] Retain exactly one registered current result set and hash every
  result-bearing artifact needed by the claim. Preserve numbered or sealed
  source and score records as immutable audit evidence.
- [ ] Verify runner self-checks independently of the production Jasmine lane.
  Migrating these self-checks from `node:test` to Jasmine later does not change
  the scientific boundary.


## Publication And Consumers

- [ ] Review the result and set its scientific status without treating a pass
  label, image, or historical result as authority.
- [ ] Add the experiment to `/references/experiments.md` with definition,
  inputs, command, controls, output, result, artifact hashes, and claim limit.
- [ ] For an official rerun, update the stable report, manifest, figures,
  hashes, status, register, and affected fact consumers as one publication
  change; reject mixed-run artifact sets.
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
- B1--B3: the current production-backed three-record set is official. Future
  reruns must consume one authenticated production manifest, preserve B1 as
  the primary real-sky comparison, and retain B2/B3 as dependent views under
  the predeclared combined judgment rules.
- XA1--XA3: implement from the current standalone definitions.
- ER6/ER8 subjective globe cases: never promote them as experiment evidence;
  they remain rendering fixtures only.

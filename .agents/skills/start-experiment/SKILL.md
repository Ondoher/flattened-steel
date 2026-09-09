---
name: start-experiment
description: Create and activate a repository-contained proof-of-concept experiment with its source, topic documentation, folder-resolved standards, generated-output boundary, and monitorable progress contract. Use when starting a new side experiment; do not use to add ordinary production features or resume an existing experiment.
---

# Start Experiment

Create one isolated experiment without granting it authority over production code or repository engineering standards.

## Establish the experiment

1. Resolve the repository root and read the applicable instructions, active topic, standards manifest, and overlay.
2. Obtain or infer a descriptive kebab-case slug, title, one-sentence objective, and initial acceptance question. Ask only when a missing choice would materially change the experiment.
3. Resolve the intended source paths with the installed `review-standards/scripts/folder-standards.mjs` helper and read their assigned canonical standards. If the intended capability needs a different set, stop for a folder-manifest audit and explicit reconciliation. Do not create topic exclusions, modify standards configuration, or refresh attestations from this skill. Before creating a new source root, confirm the user's request authorizes it under applicable `AGENTS.md`; the generic scaffold does not expand this repository's contained-experiment boundary.
4. Read [the output contract](references/output-contract.md). Use it as the initial output and progress contract in the experiment design.
5. Validate existing normalization, then run `node <this-skill>/scripts/scaffold-experiment.mjs` with the repository, slug, title, objective, and acceptance question. The helper allocates the next folder prefix, uses the installed shared folder parser, and reports the complete experiment folder plus the source folder's selected set; it never changes applicability.
6. Add the experiment to `agents/topics/poc-experiments/engineering-studies/README.md`, creating that concise routing index when absent.
7. Unless the engineer requests scaffold-only creation, update `agents/topics/active-topic.md` to route to `agents/topics/poc-experiments/engineering-studies/<experiment-folder>/README.md`. Its minimal reload sources are repository `AGENTS.md`, then the experiment `README.md`, `design.md`, `plan.md`, and `status.md`.
8. Treat activation as a governing-topic lifecycle event and run `$review-standards topic-refresh` before implementation.

The scaffold command must stop rather than overwrite any existing topic, source, or output root. Never reuse an old output directory for a new experiment.

## Folder identity

Every new experiment uses one identical folder name in all three managed roots. Its form is `<sequence>-<slug>`, where `sequence` is exactly five decimal digits. The first allocated sequence is `00000`; every later allocation is one greater than the highest five-digit experiment prefix found in any managed root. Never fill a gap or reuse a prior value.

The scaffold helper performs this allocation automatically. Its creation result reports `prefix` and `experimentFolder`; pass that reported prefix back with `--prefix <sequence>` when running `--check`. Existing legacy experiment folders without a five-digit prefix remain valid and must not be renamed.

## Required result

The new experiment owns:

```text
agents/topics/poc-experiments/engineering-studies/<sequence>-<slug>/
  README.md
  design.md
  plan.md
  status.md
experiments/<sequence>-<slug>/
  AGENTS.md
tmp/experiments/<sequence>-<slug>/
```

The topic entry states the objective, governing documents, and repository surfaces; it never selects or excludes standards. The design owns boundaries, the complete output/run contract, and architectural decisions. The plan owns ordered work and acceptance gates. The status owns current state, latest verification, output/run identities, blockers, and next action.

Keep authored implementation, fixtures, harnesses, and runner source under `experiments/<experiment-folder>/`. Keep every generated build, cache, capture, profile, report, log, progress record, and intermediate under `tmp/experiments/<experiment-folder>/`. Production and other experiments are read-only inputs unless the engineer separately authorizes promotion or cross-experiment changes.

Every operation expected to run longer than one minute must write append-only progress events to its run's `progress.jsonl` at phase transitions and at least once every 30 seconds while active. Console output may supplement that file but cannot replace it. A monitor must be able to tail the file without attaching to the process.

## Verification

After creation:

- run the scaffold helper in `--check` mode;
- resolve the generated source paths with the folder helper; a new `AGENTS.md` changes the audited instruction surface, so obtain explicit normalization reconciliation before reviewer startup;
- confirm the output root is ignored by Git;
- confirm no generated file was written beneath the source root;
- run `quick_validate.py` when this skill itself changes.
- run `node <this-skill>/scripts/verify-scaffold-experiment.mjs` when the scaffold helper or folder-identity contract changes.

Do not run an experiment merely because it was scaffolded. Implementation, dependency installation, long-running execution, production promotion, and Git writes retain their normal authorization boundaries.

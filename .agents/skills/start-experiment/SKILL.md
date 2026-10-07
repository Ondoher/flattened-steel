---
name: start-experiment
description: Create and activate a repository-contained proof-of-concept experiment with its source, topic documentation, folder-resolved standards, generated-output boundary, and monitorable progress contract. Use when starting a new side experiment; do not use to add ordinary production features or resume an existing experiment.
---

# Start Experiment

Create one isolated experiment without granting it authority over production code or repository engineering standards.

## Establish the experiment

1. Resolve the repository root and read the applicable instructions, active topic, standards manifest, and overlay.
2. Obtain or infer a descriptive kebab-case slug, title, one-sentence objective, and initial acceptance question. Ask only when a missing choice would materially change the experiment.
3. Resolve the intended source paths with the installed `review-standards/scripts/folder-standards.mjs` helper and read their assigned canonical standards. A contained experiment starts with the repository's narrow experiment set even when its proof uses a browser or local HTTP host. Broaden applicability only through a deliberate experiment-specific folder assignment; do not infer it from capability use. Before creating a new source root, confirm the user's request authorizes it under applicable `AGENTS.md`; the generic scaffold does not expand this repository's contained-experiment boundary.
4. Read [the output contract](references/output-contract.md). Use it as the initial output and progress contract in the experiment design.
5. Validate existing normalization, then run `node <this-skill>/scripts/scaffold-experiment.mjs` with the repository, slug, title, objective, and acceptance question. The helper uses the slug as the experiment folder, uses the installed shared folder parser, and reports the complete experiment folder plus the source folder's selected set; it never changes applicability.
6. Add the experiment to `agents/topics/poc-experiments/engineering-studies/README.md`, creating that concise routing index when absent.
7. Unless the engineer requests scaffold-only creation, update `agents/topics/active-topic.md` to route to `agents/topics/poc-experiments/engineering-studies/<experiment-folder>/README.md`. Its minimal reload sources are repository `AGENTS.md`, then the experiment `README.md`, `design.md`, `plan.md`, and `status.md`.
8. Follow the repository's contained-experiment verification policy: every experiment requires both its local type check and a `contracts-reviewer` review against canonical `types.md`. Initialize or refresh reviewer context through the global `review-standards` skill after its eligibility gates pass. Run the type check after authored code changes and require validated review evidence before reporting an implementation phase complete. Report blocked readiness or review honestly; a passing type check does not replace review. Follow any additional standards, checks, or reviewer lanes assigned to that specific experiment.

The scaffold command must stop rather than overwrite any existing topic, source, or output root. Never reuse an old output directory for a new experiment.

## Standards lifetime and handoff

Before introducing experiment-specific standards configuration, record the current folder assignment, any experiment-only set definitions, and relevant overlay entries in the experiment status as restoration provenance. Effective standards still come only from the manifest and overlay. Any temporary entry must identify its experiment folder and the lifecycle event or phase that ends its authorization; broader applicability requires a deliberate folder assignment and must retain `types.md`. Unless the owner specifies another lifetime, temporary configuration is active only during execution and is restored on suspension or final closure.

Use the repository [end-experiment](../end-experiment/SKILL.md) skill when the owner ends or suspends the lane. It distinguishes a final outcome from a resumable suspension, restores identified temporary configuration, preserves evidence, and refreshes context when returning to another topic. The permanent experiment mapping remains in place; production work always resolves standards from its own destination folders.

## Folder identity

Every new experiment uses its descriptive kebab-case `<slug>` as the identical, unnumbered folder name in all three managed roots. Sequence numbers belong to run folders, not experiment folders. The scaffold helper reports `experimentFolder: <slug>`; pass the same slug when running `--check`.

Existing numbered or otherwise legacy experiment folders remain valid and must not be renamed by this skill.

## Run folder identity

Every evidence-bearing execution uses a folder named `<sequence>-<name>` directly below the experiment's `runs/` directory. `sequence` is exactly five decimal digits followed by `-`. `name` is descriptive kebab-case and contains at most 16 characters; the six-character `#####-` sequence string does not count toward that limit. A complete run folder name is therefore at most 22 characters.

The first run sequence is `00000`. Allocate each later run as one greater than the highest five-digit prefix already present in that experiment's `runs/` directory. Never fill a gap, reuse a prior sequence, overwrite a run folder, or use one experiment's run sequence to allocate another experiment's run. Reject malformed entries that begin with a five-digit prefix rather than silently allocating around them.

## Required result

The new experiment owns:

```text
agents/topics/poc-experiments/engineering-studies/<slug>/
  README.md
  design.md
  plan.md
  status.md
experiments/<slug>/
  AGENTS.md
  jsconfig.json
  types.d.ts
tmp/experiments/<slug>/
```

The topic entry states the objective, governing documents, and repository surfaces; it never selects or excludes standards. The design owns boundaries, the complete output/run contract, and architectural decisions. The plan owns ordered work and acceptance gates. The status owns current state, latest verification, output/run identities, blockers, and next action.

Keep authored implementation, fixtures, harnesses, and runner source under `experiments/<experiment-folder>/`. Keep every generated build, cache, capture, profile, report, log, progress record, and intermediate under `tmp/experiments/<experiment-folder>/`. Production and other experiments are read-only inputs unless the engineer separately authorizes promotion or cross-experiment changes.

Each experiment owns `experiments/<experiment-folder>/jsconfig.json` with JavaScript type checking enabled and no emission. The repository's contained-experiment verification policy owns the required types review and its lifecycle. Every experiment folder assignment must retain `types.md`; a more-specific assignment may add standards but cannot remove this requirement. The experiment's own scientific, visual, performance, recording, and evidence gates still apply when its design or plan requires them.

Every operation expected to run longer than one minute must write append-only progress events to its run's `progress.jsonl` at phase transitions and at least once every 30 seconds while active. Console output may supplement that file but cannot replace it. A monitor must be able to tail the file without attaching to the process.

## Verification

After creation:

- run the scaffold helper in `--check` mode;
- resolve the generated source paths with the folder helper; a repository that has already normalized retains its durable completion marker when the new experiment `AGENTS.md` is added, so do not request another audit, reconciliation, or attestation refresh solely for that file;
- confirm the output root is ignored by Git;
- confirm no generated file was written beneath the source root;
- run `npx --no-install tsc -p experiments/<experiment-folder>/jsconfig.json` after authored implementation exists and before an implementation phase is reported complete;
- confirm required types-review readiness and applicable context refresh through `review-standards`, or report the blocking gate; require validated review evidence for completed implementation phases;
- run `quick_validate.py` when this skill itself changes.
- run `node <this-skill>/scripts/verify-scaffold-experiment.mjs` when the scaffold helper or folder-identity contract changes.

Do not run an experiment merely because it was scaffolded. Implementation, dependency installation, long-running execution, production promotion, and Git writes retain their normal authorization boundaries.

# Extraterrestrial Run Contract

Status: current operational contract; selected experiment source and output roots
remain unchanged. This file owns run allocation and finalization, not standards
applicability. [Experiment instructions](AGENTS.md) own containment.

## Immutable Run Records

Every experiment calculation, proof-runner execution, qualifying build,
browser/GPU run, render, evidence command, failed attempt, or interrupted
attempt receives a new run initialized before that work begins. The default
namespace is:

```text
tmp/extraterrestrial/runs/NNNNNN-descriptive-kebab-slug/
```

Its historical `000001` through `000585` directories are retired in the
verified
[pre-color-reset archive set](../../archives/extraterrestrial-pre-color-reset-20260831/README.md).
Only the live allocator tombstone `.last-run-number = 000585` remains in the
default root, preventing reuse while keeping the archived directories out of
the working tree.

An owner-approved lane may declare a separate namespace below
`tmp/extraterrestrial/` when isolation from the large default ledger is itself
part of the lane contract. The active additional namespace is:

```text
color-reset:
  tmp/extraterrestrial/color-reset/runs/NNNNNN-descriptive-kebab-slug/
```

Each namespace owns an independent counter and allocation lock in its `runs`
root. All initialization, finalization, containment, derivation, and
immutability rules below apply unchanged. Because the same six-digit number may
exist in more than one namespace, every cross-run reference to a non-default
run records its namespace or complete contained path in addition to its run id.

Run identity rules:

- `NNNNNN` is six decimal digits, starts at `000001`, and is monotonic within
  its owning run namespace through `999999`.
- Allocate `1 + max(.last-run-number, greatest existing six-digit prefix)`
  while holding the exclusive `.run-allocation-lock`; update the counter
  atomically. Only the allocator may change these two control entries.
- Never fill a gap or reuse a number, even if a directory is missing. The run
  number is identity, not proof of stage order or acceptance.
- Normalize the requested slug with Unicode NFKD, remove combining marks,
  lowercase it, spell `*` as `star`, collapse each non-`[a-z0-9]` sequence to
  one hyphen, and trim hyphens. The result must be 1-96 characters, match
  `[a-z0-9]+(?:-[a-z0-9]+)*`, and describe purpose rather than outcome.
- Create the run directory exclusively. No manual numbering or nested
  numbered run directories are allowed.

The owning runner writes only inside its newly allocated directory. Before
physical calculation, candidate scoring, proof evaluation, browser launch, or
GPU work, it records `result.json`, `report.md`, `command.txt`, `inputs.json`,
`provenance.json`, `environment.json`, and `references/manifest.json`. It
finalizes exactly once as `accepted`, `rejected`, `failed`, or `interrupted`,
then writes `artifact-manifest.json` last over the terminal artifact set.

After terminal manifest creation, never modify, rename, delete, repair,
complete, reuse, or reopen the run. Preserve malformed, failed, interrupted,
and partial attempts as they are; every correction or unchanged retry gets
the next number.

The owner-approved pre-color-reset relocation is not deletion of evidence: a
live historical copy may leave its former directory only after complete
entry/SHA-256 verification and archive-set indexing under `archives/`. The ZIP
then becomes the immutable run location, its original repository-relative path
remains the restoration identity, and the archived entry may never be changed
or replaced. This exception does not apply to active color-reset runs.

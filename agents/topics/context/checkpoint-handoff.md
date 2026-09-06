# Documentation Checkpoint Handoff

Status: documentation restructuring and approved standards reconciliation are
complete. The owner preapproved the commit message and recommendations, then
explicitly approved checking in the identified large files at their new
locations after their previous committed identities were verified. The owner
also approved the two-file CRLF whitespace exception below, preserving the
historical fixture bytes. This document records checkpoint scope and approvals;
the resulting commit identity belongs to Git history.
The owner then corrected archive placement: readable history is now local-only
under root `archives/topics/`, not part of the checkpoint. The remaining retired
topic roots and all 23 reference stubs are also archived locally, with the 66
protected historical files verified unchanged. The
[retired-topic archive index](retired-topic-archive-index.md) records restoration.
The approved `.gitattributes` exception applies only to these relocated
historical fixtures, whose line 90 CRLF endings triggered the whitespace check:

- `experiments/extraterrestrial/color-reset/fixtures/cr6c-one-pixel-brightness-calibration-v1.json`
- `experiments/extraterrestrial/color-reset/fixtures/cr6c-one-pixel-brightness-calibration-v2.json`

Both flagged lines end in CRLF, with no trailing space or tab before the CR.
The per-file whitespace attribute enables `cr-at-eol` while retaining
`blank-at-eol`, `blank-at-eof`, and `space-before-tab` checks. It does not set
text conversion or change fixture bytes. The owner explicitly approved this
exception because historical experimental data must not be rewritten.
Archive-copy warnings were resolved by local archival. No hook bypass or
repository-wide whitespace relaxation is authorized.

## Intended Checkpoint Scope

Include the complete nonignored repository state, not only this documentation
task: the five-topic migration and archive index, folder standards and guide,
experiment-scaffold repair, existing experimental-root relocation, and existing
production/source/test/configuration changes. Do not push.

The assignment-only setter promotion was applied to the global canonical
code-conventions standard outside this Git repository and is not in this commit.
Generated cache packages, scientific runs, the original-topic ZIP, and readable
archived documents remain ignored. Previously committed retired documents
remain in Git history; do not rewrite history or recommit archive duplicates.
Protected evidence was not changed by the document migration.

Proposed message (already preapproved by the owner):

```text
Consolidate work topics and reconcile folder standards

- Split current engine, application, experiment, and research context into five work topics and archive retired documentation
- Install accepted folder-based standards, promote assignment-only setters, and repair experiment scaffolding
- Preserve the existing experimental-root relocation and production, cache, application, test, and configuration updates
```

The canonical setter itself is an external edit; the repository records its
accepted disposition and generated standards projection.

## Large-File Confirmation

All paths below were untracked at their new location under
`experiments/extraterrestrial/` when reviewed. They are intentional retained
fixtures, provenance, source/reference archives, and comparison data from the
pre-existing relocation, not output created by document restructuring.

| Relative path under experiments/extraterrestrial/ | Size | Kind |
| --- | ---: | --- |
| baseline/src/algorithm32/light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-gold.json | 1.54 MiB | Protected historical numerical fixture |
| candidate/src/algorithm32/light-sources/fixtures/algorithm32-star-local-sun-shell-cpu-gold.json | 1.54 MiB | Protected historical numerical fixture |
| baseline-manifest.json | 1.25 MiB | Historical source/provenance inventory |
| catalogs/pickles-v1998/dat.tar.gz | 6.16 MiB | Third-party spectral data archive |
| references/bruneton-step5-nonregression-v1/algorithm32-current-production-gpu-j4.tsv | 1.13 MiB | Retained numerical comparison table |
| references/bruneton-step5-nonregression-v1/bruneton-published-model.tsv | 1.12 MiB | Retained numerical reference table |
| references/ctl-1.5.3/ctl-a63c7ec4c1e3cc2c66df4fd8f2f083d9eb1c2f35.tar.gz | 2.93 MiB | Third-party source archive |
| references/frostbite-s2016-sky-clouds/s2016_pbs_frostbite_sky_clouds.pdf | 50.21 MiB | Third-party reference PDF |

Structured-data candidates total 20.19 MiB, plus the 50.21 MiB PDF. All eight
already existed under `scripts/extraterrestrial/` in commit
`8e9a11ab8d78dd02a53eb73a5e0c991cc99a4e32`. Seven have identical Git blob
hashes and therefore reuse existing stored content. Only `baseline-manifest.json`
differs, through relocation path-prefix updates. This is retained repository
weight, not an equivalent amount of newly added Git content. Third-party
redistribution gates remain unchanged. No file was excluded or altered to
resolve the warning; the owner explicitly approved this relocation set.

## Verification And Resume

The [migration archive index](topic-migration-archive-index.md) owns document
coverage, links, and protected hashes. The
[reconciliation report](../standards/reconciliation.md) owns accepted standards
and helper/guide evidence. Formatting passes. Independent reviewer refresh is
partial because of the environment thread limit; no full source audit is claimed.

The approved checkpoint procedure uses the check-point skill to inspect the
complete current state, secrets and binary risks, final scope,
and fingerprint before staging. Then stage all nonignored changes, inspect the
staged diff, run required checks, commit once with the approved message, and
verify the final commit and remaining worktree. Do not infer future approval
or bypass a failed check.

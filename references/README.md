# Algorithm32 Reference Store

This directory owns the repository's paper-facing facts, external
bibliography, official experiment register, and admitted reference payloads.
A formula or value is referenceable only when its working-fact row points to
an authoritative external reference or an official standalone experiment.
Retained files, imported records, and former-repository results are not
evidence merely because they are present here.

## Canonical Owners

- [algorithm32-working-facts.md](algorithm32-working-facts.md) owns the
  standalone paper-facing formulas and values.
- [references.md](references.md) owns the numbered AMA-style external
  bibliography used by source and fixture citations.
- [experiments.md](experiments.md) owns the official, repository-standalone
  experiment register.
- [downloads/manifest.json](downloads/manifest.json) owns admission of local
  reference payloads, including identity, provenance, checksum, exact
  consumer, transformation, and license disposition.
- [followup.md](followup.md) owns the project-wide research-status index:
  source-backed fact summaries, unresolved source leads, unresearched factual
  premises, and claim boundaries. It is an index and research queue, not
  citation authority.

Presence outside one of these owners does not confer canonical status. In
particular, a bibliography entry does not by itself admit or clear a local
copy for publication or redistribution.

## Retained Noncanonical Material

- [inputs/experiments](inputs/experiments) contains imported records and
  bounded reproduction candidates. They become referenceable only after
  standalone review and registration in `experiments.md`. The retained
  `065-er8-cpu-convergence-and-poc-cleanup` material is subjective rendering
  evidence only.
- [catalog.json](catalog.json) and [catalog-inputs](catalog-inputs) are frozen
  discovery artifacts. Their historical acceptance state is not current
  authority.
- [extraterrestrial-sources-2026-07-12](downloads/extraterrestrial-sources-2026-07-12/README.md)
  is a research-only payload bundle. Its hashes have been verified, but none
  of its files is admitted to the canonical downloads manifest; publication
  and redistribution remain blocked pending file-by-file review.

The ER6/ER8 eight-case globe matrix is subjective presentation material and
cannot support scientific, numerical, ephemeris, convergence, or
implementation claims.

## Maintenance

There is no live reference-generation script pipeline in this repository;
the former support scripts and rolling review metadata were archived. Update
the canonical owners deliberately, preserve stable fact and experiment IDs,
and validate affected Markdown links, JSON, checksums, and standalone
experiment commands as part of each change.

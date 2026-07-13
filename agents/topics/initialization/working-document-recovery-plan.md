# Working-Document Recovery Plan

Status: complete. Durable archive content has been recovered into focused
current topics, and every archived Markdown file has a recorded disposition.

The topic-documentation archive preserves source material that must be
recovered into focused working documents. This plan coordinates that recovery;
the resulting decisions, contracts, evidence, and work plans belong to their
destination topics, not to initialization.

## Objective

Extract durable current information from
[`/archives/topic-documentation-archive-2026-07-19.zip`](../../../archives/topic-documentation-archive-2026-07-19.zip)
without restoring rolling history, obsolete source-repository paths, failed
alternatives, or duplicate authorities. Retain the ZIP permanently as
provenance.

## 1. Build an Extraction Inventory

For every archived section, classify each item as one of:

- current decision or contract;
- active or planned work;
- evidence pointer or claim boundary;
- unresolved question; or
- historical narrative, failed alternative, or obsolete tooling.

Assign its future canonical owner before copying it. Do not delete or alter
the archive during extraction.

## 2. Establish Working-Topic Documents

| Destination topic | Working documents to create or expand | Archive material to mine |
| --- | --- | --- |
| `algorithm32/production` | baseline-import status, production architecture boundaries, delivery/hardening plan | extraction audit, overview |
| `algorithm32/cache` | cache contract, incoming/outgoing-domain decision, spatial-lookup decision, GPU cache-building plan | cache history, outgoing fit criteria/result, spatial criteria |
| `algorithm32/experiments` | active experiment register, concise definition for each open experiment, promotion checklist | experiment backlog history, E2 research |
| `algorithm32/flat-local` | inactive extension design, explicit unknowns, prerequisites after extraterrestrial work | flat/local cache design, star-cache plan |
| `algorithm32/validation` | benchmark claim boundaries and B1/B2/B3 standalone-promotion plan | mandatory benchmarks, dome comparison |
| `extraterrestrial` | interface contract, source inventory, unresolved-fact register, promotion plan | reset design, reset plan, object inventory |
| `references` | citation and retention rules only; `/references` remains bibliography/fact/experiment owner | catalog contract/checkpoint where still applicable |
| `testing` | Jasmine lane design, CPU-to-GPU completion checks, experiment-runner migration | durable testing policy only |

## 3. Extract Decisions, Not Narrative

Every recovered working document uses this shape:

1. status;
2. scope and canonical ownership;
3. current decisions or contracts;
4. evidence and claim boundary;
5. open questions or planned work;
6. explicit exclusions; and
7. archive source pointers.

Do not copy historical sequences, completed-run narration, old source paths,
obsolete scripts, or stale pass counts. Link to the archive when provenance is
needed.

## 4. Reconcile Ownership

- Cache owns numerical domains, recurrence, and GPU cache construction.
- Production owns implementation order and actual code state.
- Validation owns benchmark claim boundaries; `/references/experiments.md`
  owns official experiment registration.
- Extraterrestrial owns source-interface decisions and unresolved source facts.
- Flat/local owns its future extension assumptions.
- `/references` owns bibliographic entries and fact citations.
- Testing owns runner policy and test boundaries.

Each fact has one canonical owner. Other documents link to it rather than
restate it.

## 5. Promote Experiments Deliberately

Extract open or reusable experiment definitions into `algorithm32/experiments`.
Promote accepted experiment descriptions and results to
`/references/experiments.md` only after they are standalone and runnable from
this repository. Keep exploratory, invalid, and superseded records archived
with an explicit non-current classification.

## 6. Check Present Decisions

Before accepting a recovered document, reconcile it with:

- visible-integration-first sequencing;
- the CPU-then-GPU completion rule for every capability;
- GPU production cache building with CPU retained as oracle/parity surface;
- the rolled-back extraterrestrial production promotion; and
- canonical `/references` ownership.

Resolve conflicts in the recovered working document; do not rewrite archive
evidence to conceal them.

## 7. Close the Migration

Publish a compact disposition for every archived file: extracted to a current
owner, retained as archive-only evidence, superseded, or awaiting further
research. Then update routing, cross-topic links, and minimal reload sources.

## Recommended Order

1. cache;
2. production;
3. extraterrestrial;
4. flat/local;
5. experiments and validation;
6. references; and
7. final routing audit.

## Completion

Recovery produced current owners for production, cache, validation,
experiments, extraterrestrial sources, flat/local extensions, references, and
testing. The [archive disposition](archive-disposition.md) accounts for every
archived Markdown file. The ZIP remains immutable provenance and is no longer
required for ordinary topic work.

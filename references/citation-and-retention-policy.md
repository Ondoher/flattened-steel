# Citation And Retention Policy

Status: current repository policy.

## Authority Direction

External authority, analytic derivation, or an official independent experiment
supports a paper-facing physical claim. The CPU implementation is verified
against that claim; GPU and browser paths are verified against the declared CPU
and physical boundary. Code, shaders, rendered images, and passing Jasmine
tests cannot originate physical authority or prove themselves correct.

## Paper-Facing Fact Boundary

`/references/algorithm32-working-facts.md` retains only material worth citing
in a paper. Each row contains:

1. one independently reviewable fact;
2. its value, formula, units, scope, or explicit bounded proposition; and
3. an external AMA reference or an official experiment ID.

Implementation structure, status, historical run outcomes, source identity,
policy narration, test declarations, pass counts, cache wiring, rendering
mechanics, and project chronology do not belong in the working-facts table.
An eligible formula or value with missing authority remains visible as
`reference required`; the gap does not become evidence and the row is not
paper-citable until resolved.

## External References

- `/references/references.md` is the only numbered bibliography. Use
  AMA-style entries and append new entries so existing citation numbers remain
  stable.
- Record authorship or publisher, title, version/edition, publication or data
  date, DOI or stable URL, and an accessed date when the cited resource is
  mutable.
- Cite the exact supporting section, equation, page, table, row, wavelength,
  dataset member, or immutable locator in the consuming fact or fixture when
  the bibliography entry alone is too broad.
- Source and fixture prose uses bracketed AMA numbers such as `[8]` for
  third-party authority. A code location demonstrates implementation, not the
  truth of the formula it contains.
- A duplicate payload or source entry links to one canonical owner. It does
  not receive a second citation identity.

## Official Experiments

- `/references/experiments.md` is the only publication-facing first-party
  experiment index. Experiment IDs are stable and never reused or silently
  renumbered.
- Cite an official experiment by its full ID, not an AMA number.
- A runner, result file, archived record, historical acceptance label, or
  passing self-check is not citable until the standalone definition and
  current result are registered.
- The registered entry identifies the question, inputs, iteration domain,
  official runner command, oracle, controls, tolerances, current result,
  artifact hashes, claim boundary, and non-claims. Follow the
  [experiment promotion checklist](../agents/topics/poc-experiments/protocols/promotion-checklist.md).
- Production Jasmine tests are conformance evidence, not official scientific
  experiments. Experiment runner self-checks remain part of the experiment
  even if they later use Jasmine.

### Admission Rules

An experiment becomes official only when all of these conditions hold:

1. Its stable ID, paper-facing question, supported claims, and explicit
   non-claims are registered in `/references/experiments.md`.
2. Its complete physical and numerical boundary is declared before the
   deciding run: source data, units, spectral basis, geometry, case domain,
   parameters, oracle, tolerances, classification rules, and uncertainty or
   mismatch treatment.
3. Every external input has canonical source provenance. Every consumed local
   payload and generated boundary has a content identity and derivation chain.
4. A fresh clone can execute the documented official command using tracked
   inputs and documented acquisitions. Missing prerequisites or a failed
   acceptance criterion produce a nonzero exit status.
5. The registered current result includes the complete case set, conclusion,
   provenance, and hashes for every result-bearing table, report, manifest,
   and figure needed to assess the claim.
6. Independent scientific authority remains separate from the implementation
   under test. A production-backed experiment may call production code only
   when its registered question explicitly tests that production boundary;
   its scorer, measurements, oracle, and judgment rules remain independent.

Passing tests, producing a plausible image, matching a historical value, or
placing output below `/references` satisfies none of these conditions by
itself.

### Parameter And Protocol Changes

- Published-paper parameters and source-defined processing are authoritative
  wherever the registered question claims to reproduce that publication.
- Preserve previously accepted non-paper parameters for comparable reruns.
  Change one only after recording a technical reason before the deciding run.
  The new result must identify the changed value and evidence supporting the
  change; score improvement alone is not a sufficient reason.
- A change to the question, physical observable, case domain, external source,
  oracle, acceptance threshold, or classification meaning creates a new
  protocol revision. Assign a new experiment ID when old and new results no
  longer answer the same paper-facing question.
- An implementation change that preserves the registered scientific boundary
  may keep the experiment ID. The replacement result must truthfully record
  the new implementation, compiler, runtime, inputs, and artifact hashes.
- Judgment rules and parameter-change rationales must exist before viewing the
  result they judge. A later rule change cannot retroactively accept a failed
  run.

### Current Results And Historical Evidence

- Each registered ID has exactly one citable current result set. Stable result
  links in `/references/experiments.md` resolve to that set.
- An authorized official rerun may replace those stable current-result files
  only as one reviewed publication update. Update the report, manifest,
  figures, hashes, status, and register together; never mix artifacts from
  different runs.
- Git history preserves earlier versions of replaced current-result files.
  Numbered or sealed source and score records remain immutable and may coexist
  as audit evidence. They are not current citation targets unless the register
  explicitly selects them.
- Failed, interrupted, bounded, diagnostic, and superseded runs remain clearly
  labeled and cannot replace the current result or support its claim.
- Rerunning a derived experiment never alters its parent evidence. The child
  records the exact parent manifest and hashes it consumed.
- If the official rerun changes a reported value, classification, limitation,
  or supported fact, update every affected working-fact and documentation
  consumer in the same change.

## Retained Payloads

Retain external bytes only when they directly support a working fact, source
or fixture citation, or official experiment. For each retained payload:

- preserve the original filename or an unambiguous canonical name;
- record its external source entry, exact version/release, original locator,
  byte length, and SHA-256;
- record license, attribution, authenticity, and redistribution status;
- record any extraction, filtering, interpolation, or other transformation
  from source bytes to the consumed fixture;
- keep one canonical local copy and link duplicates to it; and
- block publication or redistribution when identity or license review is
  unresolved.

Discovery leads, broad reference collections, obsolete tracking metadata, and
payloads with no retained consumer are archived or excluded rather than kept
as implied authorities.

## Consumer Rules

- Source comments and fixture metadata cite the canonical external reference
  number or official experiment ID that supports the exact value or formula.
- A derived fixture also records its transformation and exact source payload
  identity so another reader can reproduce it.
- Missing units, uncertainty, spectral basis, source version, or locator are
  explicit blockers; do not infer them from a matching filename or value.
- Competing claims remain separate until resolved. The selected claim has one
  canonical owner; current docs link to it rather than repeating its value.
- Current reference files describe current authority. Chronology, rejected
  alternatives, catalog-discovery records, and obsolete tooling stay in the
  archive.

## Follow-On Citation Hardening

Before release acceptance or publication:

1. reconcile package-local reference and evidence lists into the canonical
   repository-level bibliography and experiment index;
2. fill all `reference required` and `not yet created` placeholders used by
   production facts or fixtures;
3. verify every retained payload identity, license, and transformation;
4. verify that every source and fixture citation resolves to its exact
   canonical owner; and
5. confirm that no archive, catalog, another repository, or test result acts
   as a parallel authority.

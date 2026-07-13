# Topic Routing

Use this routing table only when the active topic does not supply enough
context for the task.

## Areas

- `context/`: session bootstrap, active-topic continuity, and routing.
- `initialization/`: the completed repository-extraction record.
- `algorithm32/production/`: current production implementation, sequencing,
  code-facing state, and gates.
- `algorithm32/ground/`: active profile-supplied ground-boundary contract,
  implementation status, and CPU-to-GPU handoff.
- `algorithm32/cache/`: selected cache contract and numerical-domain decisions.
- `algorithm32/experiments/`: forward-looking preimplementation research.
- `algorithm32/validation/`: external benchmarks, whole-output diagnostics,
  and scientific claim boundaries.
- `algorithm32/flat-local/`: planned flat-geometry and finite-local-source
  extension contracts and research gaps.
- `testing/`: repository test architecture, runner boundaries, and experiment
  test migration.
- [Standards](../standards/README.md): conventions that apply across the
  repository.
- `products/`: durable domain or product knowledge shared by one or more
  application surfaces.
- `apps/`: deployable application surfaces, integration, and operations.
- `references/`: routing and metadata for external sources and collected
  supporting material.
- `extraterrestrial/`: visible point and extended sources transported after
  atmospheric exit.
- `/archives/topic-documentation-archive-2026-07-19.zip`: superseded or
  historical topic documents retained for reference.

## Ownership Rules

- Route a fact to the narrowest area that can own it durably.
- Keep cross-cutting policy in standards and domain behavior in products.
- Keep application documents focused on the deployable surface rather than
  duplicating product or repository policy.
- Keep source identity, provenance, and collected material with references;
  promote accepted conclusions into the current document that owns the claim.
- Keep historical narrative out of current-state documents. If history must be
  retained, move it to a designated log or archive and link back to the current
  authority.
- When a subject spans areas, select one canonical owner and link to it from
  the others.

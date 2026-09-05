# Agent Topics

This tree contains agent-facing documentation organized by purpose. Topic
documents should make the current repository understandable without loading
unrelated code, history, or evidence into every session.

## Taxonomy

- [Context](context/README.md) owns session bootstrap and topic routing.
- The [standards manifest](standards/manifest.md) selects applicable canonical
  engineering standards, and the [repository overlay](standards/overlay.md)
  owns the approved local additions and replacements.
- `products/` owns durable product and domain knowledge that can span more
  than one deployable application.
- `apps/` owns deployable application surfaces and their integration or
  operational guidance.
- [References](references/README.md) routes to external sources, collected
  materials, and supporting evidence.
- [Testing](testing/README.md) owns repository test architecture and runner
  boundaries.
- [Topic documentation archive](../../archives/topic-documentation-archive-2026-07-19.zip)
  contains historical, non-authoritative topic material.
- [Initialization](initialization/README.md) preserves the completed repository
  extraction record. Current Algorithm32 work is routed by the
  [Algorithm32 topic](algorithm32/README.md).

Use the narrowest durable owner. Cross-repository rules belong in the canonical
standards library, repository-specific standards differences belong in the
overlay, domain meaning belongs in products, and deployment-surface details
belong in apps. References support claims but do not own current product or
engineering policy.

## Bootstrap

The canonical bootstrap contract is [AGENTS.md](../../AGENTS.md). Start with
[Active Topic](active-topic.md), then load only its minimal reload sources.
Use this index and [Topic Routing](context/routing.md) on demand, not as default
session context.

## Topic Document Shape

A working topic should have:

- one canonical entry document that states its purpose and routes to focused
  documents;
- a current-state or status document when the entry document is not sufficient;
- focused design, plan, contract, runbook, or evidence documents only when
  their responsibilities are distinct; and
- an explicit log or archive location if chronology must be retained.

The active-topic file is a session pointer, not a second status tracker. Keep
facts in their owning topic documents and keep reload sets as small as the
current work permits.

# Folder Standards Reviewer Lifecycle

Review mode: **enabled at the owner's request on 2026-10-07**. The former
session suspension is revoked. Runtime readiness and later source reviews
remain separate; no production or experimental source is declared clean by
reactivating the roster.

The [repository experiment verification policy](../../../AGENTS.md#contained-experiment-verification)
disables dedicated standards reviewers and audits for all existing and future
contained experiments, their owning topic documents, and experiment workflow
changes as of 2026-10-16. Do not initialize or refresh reviewer lanes for that
work. Checkpoint-advisor monitoring remains active; local verification and
immutable evidence checks continue. Production work retains the review mode
above.

## Activation Evidence

The activation session is
`.codex-tmp/review-standards/session-GFYgV4/`, with its baseline captured at
`16ce31e2482657731115e5abd7d2279fe6252711` and a clean initial worktree.
Its current lane fingerprints and readiness receipts are retained there.

Renewed calibration passed the independent synthetic primary and audit:
32 obligations, 14 seeded violations and all compliant controls.
The request fingerprint is
`3194e2808efcab2224dab2aa1c33ef9f782b5e8c4fed4e3362c8265fc4a7c354`.
All 91 reviewer-helper regression tests pass. The new global record was sealed
from these reports; the exact previous record remains preserved beside it.
Infrastructure pins, durable normalization and folder configuration validate.
Generated-guide and formatting checks follow the review skill's gates.

The roster follows the union of current folder assignments: architecture,
contracts, UI, verification and privacy/security. A task uses only the lanes
and rules mapped to its own complete review unit. Readiness is refreshed when
governing instructions, mappings, standards or work context change.

## Experiment And Production Handoff

The [manifest](manifest.md) and [overlay](overlay.md) remain the repository's
standards configuration. The permanent `experiments/` assignment retains the
narrow experiment set and `types.md` for authoring and self-review guidance.
Experiment mappings do not activate reviewers. Production paths retain their
own broader sets. The
[temporary lifetime rule](overlay.md#add-temporary-experiment-standards-lifetime)
owns experiment-specific restoration requirements; the repository
[end-experiment skill](../../../.agents/skills/end-experiment/SKILL.md) performs
the handoff with distinct ended and suspended outcomes.

The [Sky Accuracy Dials lifecycle](../poc-experiments/engineering-studies/sky-accuracy-dials/status.md#experiment-lifecycle)
owns its execution disposition. Reviewer readiness does not adopt candidates,
reopen historical runs or close deferred source-review gates. Production phase
review and appearance acceptance remain governed by their production owners.

Checkpoint monitoring retains its independent policy and the owner's standing
advised-checkpoint approval. Reviewer startup and final compliance results
remain governed by the global `review-standards` skill and its evidence ledger.

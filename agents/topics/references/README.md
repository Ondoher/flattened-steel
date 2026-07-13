# References

Status: current citation-governance and routing topic.

The repository-level `/references` directory is the sole owner of retained
external sources, paper-facing facts, and official scientific experiments.
This topic defines how those owners are used; it does not maintain a second
bibliography, fact list, experiment index, or reference catalog.

## Canonical Owners

| Owner | Responsibility |
| --- | --- |
| [AMA references](../../../references/references.md) | Stable numbered external authorities used by source, fixtures, facts, and paper prose. |
| [Official experiments](../../../references/experiments.md) | Stable first-party experiment IDs and their standalone definitions, inputs, controls, results, and claim limits. |
| [Working facts](../../../references/algorithm32-working-facts.md) | The compact paper-facing `fact / value-or-formula / reference` register. |
| [Downloaded payloads](../../../references/downloads/) | Retained external bytes, provenance, license information, and content hashes. |
| [Experiment results](../../../references/results/experiments/) | Current result artifacts for retained scientific experiments. |

Use [Citation And Retention Policy](citation-and-retention-policy.md) for
admission, citation, payload, and authority rules. Use the
[Algorithm32 experiment topic](../algorithm32/experiments/README.md) for
working definitions and promotion readiness.

## Transition Boundary

Package-local source reference/evidence files are imported transitional
material. During follow-on citation hardening, reconcile their external
entries and experiment names into the canonical repository-level owners, then
replace local authority claims with links or citation tokens. Until that work
is complete, they may explain imported provenance but must not receive new
canonical entries.

The frozen catalog JSON, catalog inputs, archive ZIP, old source-repository
paths, tracking scripts, taxonomy audits, handoffs, and discovery counts are
historical evidence. They are not citation authorities, implementation gates,
or proof that a fact or experiment is accepted.

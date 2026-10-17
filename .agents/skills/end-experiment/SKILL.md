---
name: end-experiment
description: End a contained experiment or suspend it for later resumption, preserve its evidence, restore temporary folder standards changes, and hand work back to the selected repository topic. Use for experiment lifecycle transitions, not completing an individual run, promoting code, or deleting evidence.
---

# End Experiment

Close or suspend one experiment without treating its findings as production acceptance.

## Select the disposition

Follow the owner's wording:

- **Ended:** the experiment is over. Record its outcome as accepted, rejected, inconclusive, or otherwise supported by its evidence. Ending does not mean every planned task or review passed. Record remaining work without presenting it as an active execution plan.
- **Suspended:** execution stops with the possibility of future resumption. Preserve the remaining plan and a focused resumption record. Resume only when the owner selects the experiment again.

If the owner says only "stop" or "end" and the disposition cannot be inferred, ask which outcome they intend while performing read-only inventory. Do not turn suspension into completion or start another experiment.

## Establish the boundary

Read repository instructions, the active topic, and the selected experiment's local instructions, design, plan, and status. Resolve the topics folder from root `AGENTS.md`; use the existing canonical experiment documents rather than assuming a newly scaffolded location.

Inventory active processes, owned resources, unfinished runs, the last retained evidence, outstanding review gates, and the experiment's temporary standards changes. Use the current manifest and overlay plus the experiment's recorded pre-change configuration or Git history to identify exact temporary entries. A topic name or a narrow standards set is not itself an exception to remove.

## Stop execution and preserve evidence

Stop only the selected experiment's owned work, release its owned browsers, servers and GPU resources through their lifecycle controls, and finalize an interrupted run only as its existing run contract permits. If ownership is uncertain, leave the process untouched and report the uncertainty.

Preserve every sealed run, artifact, manifest, provenance record, archive and failed attempt. Never rewrite an immutable run to label it ended or suspended. Write lifecycle disposition in current-state documents. Cleanup, relocation, new runs, production changes and publication require their own authorization; this skill grants none of them.

## Restore temporary standards changes

Resolve effective standards with the installed `review-standards/scripts/folder-standards.mjs` helper. Standards applicability remains controlled by folders throughout the transition.

The default temporary lifetime is active execution, ending on suspension or final closure unless the owner explicitly selected another lifetime.

Restore only temporary experiment-specific assignments and overlay entries whose lifetime ends at this transition. Restore their recorded prior state while preserving permanent mappings and unrelated concurrent changes. If a temporary entry has no trustworthy prior state or conflicts with a later change, leave that entry unchanged and report the unresolved restoration; do not guess or claim that restoration passed.

Restore an experiment-only named set declaration only when its prior state is recorded and no surviving assignment or set inheritance depends on it. Preserve shared sets; report an unresolved dependency rather than removing a set still in use.

Keep the repository's permanent `experiments/` assignment and mandatory `types.md`. Retained experimental source stays governed by its folder. Production files use their own broader folder mappings regardless of the active topic. Ending or suspending does not move source to production, grant a global waiver, or reopen historical review evidence.

For suspension, retain the exact removed temporary entries and their prior configuration in the resumption record as provenance. That record is not active standards authority. A future resumption must check current mappings and compatibility before reinstating any still-authorized entries in the manifest or overlay while keeping dedicated experiment reviewers and audits disabled under the repository experiment policy.

Validate the manifest, overlay and representative experiment and destination paths after restoration. Refresh root `STANDARDS.md` through `write-standards-guide`; do not edit the generated guide manually or rewrite the durable first-normalization attestation.

## Record the handoff

Update the experiment's status with its explicit disposition, date, outcome or latest accepted milestone, interrupted work, retained evidence identities and locations, resources released or still uncertain, unresolved review/acceptance gates, and the standards changes restored or still unresolved. Link existing result owners instead of duplicating findings.

For **ended** work, replace the active next action with the final disposition and any separately owned follow-up. Reopening needs a new owner selection; it is not an automatic continuation.

For **suspended** work, also record the smallest useful reload set, the next unconsumed task, compatibility checks needed before resuming, and any temporary standards configuration that was deactivated. Preserve the experiment's production adoption hold.

Select the next topic from the owner's request. If none is selected, update `active-topic.md` to state that no execution topic is selected and that the last experiment is ended or suspended awaiting owner selection. Retain links to its handoff as context, not an active execution queue; do not invent a production task. When changing topics, update `active-topic.md` with the canonical entry and minimal reload sources and reload the destination's instructions. For another contained experiment, keep dedicated reviewers and audits disabled. When returning to production, run `review-standards` topic-refresh before further implementation under the destination's review policy.

The repository's [contained-experiment verification policy](../../../AGENTS.md#contained-experiment-verification) disables dedicated experiment reviewers and audits. Preserve historical review records without treating their open gates as new experiment completion requirements. Production reviewer startup and source-review evidence remain governed by `review-standards`; report any blocked production refresh honestly while preserving the requested experiment disposition. Consult an already-active checkpoint adviser after the coherent handoff under its existing policy. This skill does not independently authorize a commit.

## Handoff result

Report whether the experiment is **ended** or **suspended**, where its evidence and optional resumption record are retained, whether temporary standards restoration and reviewer refresh succeeded, and the selected next topic or unresolved routing decision. Do not claim experiment success, clean standards review, or production promotion unless the corresponding evidence gates actually passed.

# Sky aerosol properties status

Status: active experiment; profile-only scenes at production settings complete.
Production source, atmosphere selection and cache assets remain unchanged.

## Current outcome

The [refinement report](refinement-results.md) is the canonical owner of M1-M3
findings, physical/numerical controls, reference precision, gate dispositions,
artifact links, corrections and costs. H2400 at fixed aerosol column is the
strongest ground-level brightness lead while retaining solar glow; elevated
views have a measured tradeoff. The H1800 compromise stopped at its registered
early gate. No profile has been selected for production.

The [first-campaign report](results.md) retains its independent N1 scope.
The [refinement plan](refinement-plan.md) is completed with explicit limitations,
not universally passing numerical or external-reference targets.

## Verification and resumption boundary

- Final analysis: `tmp/experiments/sky-aerosol-properties/runs/00044-refine-analysis/`.
- Accepted immutable proof: `runs/00046-refine-verify/` below the same output root.
- Bounded compromise decision: `runs/00040-refine-midpoint/`.
- Corrected finalist color report: `runs/00041-refine-colors/`.
- Source: `experiments/sky-aerosol-properties/`; local type checking passes.
- All earlier sealed runs and protected evidence remain intact. Explicit invalidations,
  failures and progress-cadence exceptions are recorded in the refinement report.
- Corrected scene builds: runs00055/00056; primary physical-height/packet proof00057.
- [Complete scene gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00060-scene-brackets/comparison.html): five primary pairs plus common Sun exposure brackets00058/00059.
- Runs00047-00054 are preserved but excluded from scene conclusions; the report
  explains corrected lighting and altitude-index adapter errors.
- Latest profile-only builds:00061 production atmosphere,00062 combo025,00063 H2400,
  all using unchanged production Native48/F68 controls. Complete equality/packet
  proof00064 and shared-exposure derivation proof00068 pass.
- [Current profile-only gallery](../../../../../tmp/experiments/sky-aerosol-properties/runs/00068-scene-brackets/comparison.html)
  supersedes the earlier diagnostic gallery for profile-only visual selection.
- All owned jobs are closed and scratch is empty. No run is queued.
- Recovery checkpoints: `b00c7f40`, `6368bb3a`; final handoff uses
  `docs(experiment): conclude aerosol refinement study` (see Git history).

No blockers remain for the completed investigation. External solar-surround
precision and a few cache/reference discrepancies remain scientific limitations,
not unfinished mandatory transport jobs. Profile-only full-scene comparisons are complete. Production integration, additional scenes or a new
campaign still require a separately selected scope.

## Governance

Source/output writes remain in this experiment's declared roots; production and
suspended studies are read-only. No temporary standards set or overlay was added.
Dedicated standards reviewers/audits are disabled; checkpoint advice remains active.
Do not claim standards compliance from that policy. The experiment has not been
closed or suspended. Use the lifecycle skill if the owner later selects either.

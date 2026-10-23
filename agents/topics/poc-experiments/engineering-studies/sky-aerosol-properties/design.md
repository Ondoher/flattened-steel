# Sky aerosol properties Experiment Design

## Objective

Identify aerosol properties that retain solar glow while reducing the brown or gray horizon, using matched physical and display comparisons.

## Acceptance Question

Can absorption, loading or phase-function changes improve the desired appearance with internally matched transport and independent spectral support?

## Isolation Boundary

Authored experiment work remains below `experiments/sky-aerosol-properties/`. Generated output remains below `tmp/experiments/sky-aerosol-properties/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- `sky-aerosol-properties` is the unnumbered `<slug>` identity defined by the skill's [folder-identity contract](../../../../../.agents/skills/start-experiment/SKILL.md#folder-identity).
- The experiment source root is `experiments/sky-aerosol-properties/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The experiment source root owns `jsconfig.json` with `allowJs`, `checkJs`, and `noEmit` enabled. Run its type check after authored code changes and self-review against the folder-mapped standards, including `types.md`. Dedicated standards reviewers, independent audits, and compliance-ledger gates are disabled under the repository experiment policy. Keep checkpoint-advisor monitoring active and complete the experiment's own scientific and evidence checks. A more-specific folder assignment may add standards guidance without enabling reviewers.
- The generated-output root is `tmp/experiments/sky-aerosol-properties/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
- Derive repository, source, and output roots from the location of a checked-in repository marker rather than `process.cwd()`.
- Real-path-check every read and write boundary. Reject symlinks, junctions, reparse points, and any resolved path outside its declared root.
- Use a new `runs/<sequence>-<name>/` directory for each evidence-bearing execution. `sequence` is exactly five decimal digits followed by `-`; `name` is descriptive kebab-case and is limited to 16 characters, excluding the `#####-` sequence string. Allocate the next sequence within this experiment only, never fill a gap or reuse a sequence, and reject malformed prefixed entries. Never overwrite or reopen a completed run. Copy or derive reused material into the new run and retain its source identity.
- Record the command, inputs, relevant configuration, implementation revision or hashes, tool/runtime versions, environment facts that affect the result, parent artifacts, derivation operation, and resulting artifact identities.
- Finalize a run with an explicit terminal state: `accepted`, `rejected`, `failed`, or `interrupted`. Publish its terminal manifest only after all artifacts are closed and hashed.
- A verifier may read the run it validates but must not mutate it. Corrections and retries create a new run.
- Keep production and other experiment trees read-only during experiment execution unless the engineer explicitly expands the write scope.

## Monitorable progress

Every operation expected to run longer than one minute writes UTF-8 JSON Lines to:

```text
tmp/experiments/sky-aerosol-properties/runs/<sequence>-<name>/progress.jsonl
```

Append one event at process start, every phase transition, at least once every 30 seconds while active, and at terminal completion or failure. Flush each event so another process can tail the file while the operation runs. Each event contains:

```json
{
	"timestamp": "2026-09-04T12:00:00.000Z",
	"phase": "compute",
	"completed": 24,
	"total": 100,
	"message": "Processing sample batch 24 of 100."
}
```

`timestamp`, `phase`, and `message` are always required. Include `completed` and `total` when work is countable. Terminal events additionally include `state` with one of the allowed terminal states. Do not place secrets, credentials, or unnecessary personal data in progress records.

## Decisions

The first campaign is an independent N1 sensitivity study with spherical geometry,
Native15 spectra, black ground and no gas absorption, refraction or polarization.
It answers parameter mechanisms, not full production N4 accuracy or measured-sky truth.
The first campaign retained the original exponential vertical profile. The selected
follow-up varies its scale height at fixed column; no aerosol-free ground layer is
introduced. Production source, assets and package selection remain read-only.

Use the existing independent binary64 reference equations and a separately evaluated
GPU N1 implementation. Reuse prior physical source/geometry and original CIE inputs
only with path/hash identities; do not invoke old runners that write to suspended roots.
New observations, builds and browser profiles belong to the new output root.
Record cumulative-N1 and radiance units explicitly in every comparison manifest.

The create-plan critique is a single explicitly scoped scientific plan critique,
not a standards-review exception. Checkpoint advice remains enabled. Effective
standards remain the inherited experiment set; no temporary overlay is introduced.

The [follow-up plan](refinement-plan.md) tested full-scattering `combo025`
confirmation, fixed-column scale-height and spectral changes, finer loading and
SSA tests, then conditional finalist comparisons. It retains these isolation and
evidence rules. The first campaign's N1 claim boundary remains unchanged. The
follow-up was independently critiqued and has completed independent execution;
its refinement report owns the findings and qualification limits.
Production changes remain outside this selection.

## Open Questions

- Which intervention changes horizon hue rather than brightness alone?
- Which settings retain solar-glow contrast without excessive horizon attenuation?
- Which initial effects survive a later full-N4 and matched libRadtran comparison?

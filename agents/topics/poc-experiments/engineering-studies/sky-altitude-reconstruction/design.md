# Sky Inter-Order Altitude Reconstruction Experiment Design

## Objective

Isolate legacy altitude-bin selection versus current linear reconstruction during higher-order cache transport and measure its horizon effect.

## Acceptance Question

Does changing only inter-order altitude reconstruction explain the historical whitening without altering the production angular rule, view integration, material or display?

## Isolation Boundary

Authored experiment work remains below `experiments/sky-altitude-reconstruction/`. Generated output remains below `tmp/experiments/sky-altitude-reconstruction/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- `sky-altitude-reconstruction` is the unnumbered `<slug>` identity defined by the skill's [folder-identity contract](../../../../../.agents/skills/start-experiment/SKILL.md#folder-identity).
- The experiment source root is `experiments/sky-altitude-reconstruction/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The experiment source root owns `jsconfig.json` with `allowJs`, `checkJs`, and `noEmit` enabled. Run its type check after authored code changes and satisfy the repository's required canonical `types.md` review through `review-standards` before reporting an implementation phase complete. A specific experiment may deliberately add standards, checks, or reviewer lanes through its folder mapping and governing instructions; capability use alone does not add them.
- The generated-output root is `tmp/experiments/sky-altitude-reconstruction/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
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
tmp/experiments/sky-altitude-reconstruction/runs/<sequence>-<name>/progress.jsonl
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

Reuse the established production-renderer capture host and immutable-run machinery in this lane. Keep the old lane's implementation and sealed evidence untouched. A reversible bundler transform selects only the existing single-bin altitude-stencil branch and renames the diagnostic export; all other compiler branches retain production behavior.

## Open Questions

- Does the isolated stencil change materially brighten or whiten the rendered horizon?
- If it does, how much is attributable to J3 versus J4? A later matched correctness reference would still be needed to determine whether any whitening is beneficial.

## Registered Hypothesis And One-Factor Intervention

The legacy stored-field transport used `floor(48*h/60000)` to select one altitude row. Native48 stores heights 0,1875,3125,... metres. Current receiver-local construction linearly reconstructs between those heights. At h=1000m the old reader chooses the ground row while the new reader blends ground and1875m. This may change aerosol-weighted light reaching J3/J4 and the horizon. It is a hypothesis, not a proven explanation of the archived white image.

A is unchanged deployed production construction. B is the same receiver-local compiler with only its `positionStencilSource` selection forced to the existing legacy single-bin branch. Preserve incoming F68, outgoing construction/storage grids, solar interpolation, medium/source/black-ground controls, branch paths, frame transforms and accumulation order. The generated variant is bundled only in this experiment; production compiler bytes remain read-only. Retain the exact original and derived compiler hashes and reversible textual transform. No unsuccessful horizon2048 angular control is used.

Prediction: J1/J2 sampled source-density fields remain bit-identical; only L2 onward can respond. Compare matched baseline/candidate pure-order values and cumulative density on registered cache nodes. This tests construction between scattering orders, not final-view altitude interpolation and not merely observer-column versus actual-point source placement.

## Matched Visual Evidence

Use the existing actual production-renderer capture method at San Jose solar noon,1024x768,60-degree horizontal FOV,pitch5degrees,cross-Sun heading. Keep production receiver lighting and P2 display/adaptation fixed. Publish the production image early, then actual counterfactual and side-by-side PNGs. Report brightness/color change without treating whitening as physical correctness. Pure-order probes are source densities, not pixel colors. The original archived view has other unmatched controls and is not an oracle.

## Execution Allocation And Gates

One serial hardware-GPU proof, at most15minutes execution including setup/repair,16MiB retained new evidence,64MiB total lane retention,1GiB scratch and existing40GiB disk floor. No arbitrary host/GPU free-memory admission guard. Report logical candidate atlas bytes separately from unmeasured transient/whole-process peak. Retain failed attempts and repair actual failures in fresh runs, with aggregate allocation accounting. No repeated successful science solely for verification.

Before variants, fresh F68 channel7 must match deployed required-row probes within relative1e-4 above1e-12 floor. Compile all15 production channels for baseline pure-order probes and the single-bin variant; require J1/J2 equality at every registered probe. Preserve all J1..J4 probe spectra and channel/packet hashes. Observe J3/J4 and actual horizon changes. A causal sufficiency claim requires a meaningful changed horizon, not merely a nonzero source delta. The intervention may reveal old numerical whitening rather than greater physical accuracy.

Current production twilight must remain available for any later adoption. The noon diagnostic neither qualifies candidate twilight nor supplies a paper RMSE. Full-cache promotion still requires matching/improving paper RMSE; libRadtran supports matched isolated correctness tests.

## Owner-Authorized Paper RMSE Extension

The owner requested full-paper scoring after observing a slight subjective noon improvement. Compare the same single-bin stencil policy against unchanged production on the established paper benchmark: Native51 altitude positions, Z180/W27/F68, Direct40 wavelengths, source20/transport40, Q30 monotone-cubic cumulative N1-N4, paper atmosphere with ozone disabled and paper grass ground. These benchmark controls differ from the Native48/Native15/transport15/black-ground noon capture; the results measure the policy under benchmark conditions, not the screenshot colors.

Reuse accepted baseline `tmp/experiments/sky-angular-quadrature/runs/00007-q2-base-full` only after verifying its seal, authenticating every served numerical source against current bytes, and reproducing all cumulative spectra and J1-J4 sparse hashes for channel16 on the GPU. Require exact parity. Compile all40 candidate channels and require unchanged J1/J2 pure and cumulative field hashes at every channel. Preserve all cumulative/pure-order spectra and exact reversible compiler derivation. Score exactly17 times,81 directions and channels0-30 with the canonical paper scorer; retain per-time RMSE and signed spatial SSE changes. The expected baseline aggregate is11.622914028288646 mW m^-2 sr^-1 nm^-1.

Allocate15minutes aggregate execution including qualification/repair,20MiB new retained evidence within the existing64MiB lane limit,1GiB scratch and the existing40GiB disk floor. No arbitrary host/GPU free-memory guard. Separate qualification and candidate browser scratch children under this lane's owned scratch. Reuse the old browser/scorer read-only; adapt only the GPU host's scratch boundary into this lane. Show spectral progress figures every10channels and a final fixed-exposure witness comparison. Existing actual noon PNGs remain the matched visual evidence; benchmark swatches are not application captures. No production change or twilight qualification is authorized.

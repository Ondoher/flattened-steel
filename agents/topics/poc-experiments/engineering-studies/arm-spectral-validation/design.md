# ARM Spectral Validation Experiment Design

## Objective

Compare the production distant-Sun algorithm with recent measured ARM sky spectra using independently constrained, matched atmospheric profiles.

## Acceptance Question

Can a recent clear-sky ARM case support a defensible absolute spectral comparison, and where does production depart from the observations beyond measurement and atmospheric-input uncertainty?

## Isolation Boundary

Authored experiment work remains below `experiments/arm-spectral-validation/`. Generated output remains below `tmp/experiments/arm-spectral-validation/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- `arm-spectral-validation` is the unnumbered `<slug>` identity defined by the skill's [folder-identity contract](../../../../../.agents/skills/start-experiment/SKILL.md#folder-identity).
- The experiment source root is `experiments/arm-spectral-validation/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The experiment source root owns `jsconfig.json` with `allowJs`, `checkJs`, and `noEmit` enabled. Run its type check after authored code changes and self-review against the folder-mapped standards, including `types.md`. Dedicated standards reviewers, independent audits, and compliance-ledger gates are disabled under the repository experiment policy. Keep checkpoint-advisor monitoring active and complete the experiment's own scientific and evidence checks. A more-specific folder assignment may add standards guidance without enabling reviewers.
- The generated-output root is `tmp/experiments/arm-spectral-validation/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
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
tmp/experiments/arm-spectral-validation/runs/<sequence>-<name>/progress.jsonl
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

### References and scope

Test absolute spectral radiance with spherical geometry and a distant Sun. ARM
observations are the empirical reference; libRadtran is a required independent
solver comparison, not a replacement for observations. Solver agreement alone
does not establish truth. Zenith measurements cannot directly validate a horizon.
No premise that production is broken or a particular color is expected applies.

Start with SGP 2023, including22 August 2023 as an unqualified lead. Check nearby
dates, then SGP 2020-2024 if needed. Distinguish measurement/publication dates.
Use another ARM site only with a recorded coverage advantage. Do not substitute
infrared-only spectra or broadband irradiance for visible directional radiance.

Source leads, to be qualified against actual files:

- [TWST September 2024 deployment report](https://www.arm.gov/publications/programdocs/doe-sc-arm-24-022.pdf): archived SGP observations3 April 2020 through 2 June 2024 and instrument changes; no individual day is qualified by this report.
- [TWST instrument report, 2023](https://asr.science.energy.gov/meetings/stm/posters/pdf/2023/P003144.pdf): approximately 400-1700 nm absolute spectral radiance, narrow zenith field of view. Verify usable response/calibration for the selected epoch.
- [ArcticShark 2025 report of 2023 measurements](https://acp.copernicus.org/articles/25/3425/2025/): meteorological/aerosol profiles, lidar/radiosonde comparisons and22 August 2023 case. Dry aerosol sampling requires ambient-humidity treatment.
- [ARM shortwave instrument overview](https://journals.ametsoc.org/view/journals/bams/102/3/BAMS-D-19-0227.1.xml): calibrated SASZe/SWS alternatives; actual overlap must be verified.
- [ARM Data Discovery](https://adc.arm.gov/discovery/): versioned data and quality information, not values digitized from publication figures.
- [ARM closure study](https://doi.org/10.1029/2020JD033663): input/uncertainty methodology; broadband closure is not directional spectral validation.
- [libRadtran](https://www.libradtran.org/): pin installed executable, solver, documentation and data versions. Reuse `scripts/libradtran/` read-only with all output in this lane.

### Algorithm identity and atmospheric representation

Freeze source revision, policy, configuration, spectral basis and numerical
controls before execution. Primary is the production-owned Corrected60 + Mie
phase-mass normalization + Sun-focused outgoing k=.35 implementation. The
still-deployed legacy15/ordinary-grid policy is a separately labeled control.
The [production status](../../../production-algorithm32/caches/sky-accuracy-promotion-status.md)
owns deployment/admission state; recheck it rather than treating a prepared
candidate as deployed. No activation is authorized here.

Both algorithms need atmosphere-specific experimental caches. Existing default
canonical/Toronto assets are not ARM-matched. Use actual production compiler and
lookup code without changing its equations. An experiment-owned input/output
adapter is allowed; a modified solver is a separately labeled research variant.

Maintain two tracks:

1. Observations versus libRadtran under the best independently constrained full
   measured atmosphere, and production where that atmosphere is representable.
2. Production versus libRadtran under the same production-representable
   atmosphere, with projection differences from measured profiles separated.

Outputs distinguish corrected/ARM, legacy/ARM when run,
libRadtran-full-profile/ARM, libRadtran-projected-profile/ARM,
production/libRadtran-projected-profile and the full-minus-projected libRadtran
diagnostic. If full and projected profiles are identical, record that identity
and reuse the result instead of duplicating computation. The legacy control is
required for the first pilot only; expansion needs an explicit interpretation
benefit and measured cost assessment.

Current compiler inputs expose exponential Rayleigh/Mie scale heights and
per-channel aerosol optics. Arbitrary vertical-profile support is unproven.
Derive any projection from atmospheric observations alone, retaining full and
projected profiles. Compare both with libRadtran to estimate representation
effects. Unbounded dominant inputs prevent definitive algorithm attribution.

### Matched observations and uncertainty

Record radiance units, wavelength basis/air-vacuum convention, response/bandpass,
view direction and angular acceptance, integration time, UTC/solar ephemeris,
site altitude/datum and calibration epochs. Apply the same spectral response,
field-of-view average and time integration to both predictions. Channel-center
interpolation is an explicit approximation unless the instrument justifies it.

Record pressure/temperature/humidity, molecular scattering, aerosol extinction
versus height/wavelength, phase function, SSA, ozone/relevant absorbers, solar
spectrum and ground spectral albedo. Classify each as measured, retrieved,
modeled, assumed or missing, with spatial/temporal support and uncertainty.
AERONET angular moments are not a particular analytic phase-shape parameter.
Expose phase, gas, polarization and geometry differences; no match-by-label.
Retain unobserved altitude/spectral regions and extensions explicitly.

Score only a valid visible-band intersection. No extrapolation is observation.
Treat significant gas bands compatibly or predeclare a continuum-only score,
explicit exclusion list and separate full residual display. Freeze masks before
seeing residuals. No per-spectrum scale/exposure/white-balance fit and no
atmosphere fitting to held-out evaluation radiances. Separate exploratory from
at least one unconsumed evaluation interval before tuning mappings or controls.

Primary metrics are absolute spectral RMSE, signed bias, wavelength residuals,
per-case and aggregate results, and relative errors with a declared low-signal
floor. Report corrected/ARM, legacy/ARM, libRadtran/ARM and solver differences.
Keep instrument uncertainty, atmospheric-input uncertainty and numerical
sensitivity distinct; correlated systematic errors are not independent channel
noise. Kider/B1 thresholds do not transfer to a different observable.

After ranking uncertainty sources, evaluate a small bounded ensemble or coherent
low/high perturbations of the dominant two to four inputs. Preserve vertical
and spectral correlations, column constraints and physically allowed coupled
changes. Document the basis for each bound. Add selected joint perturbations
where nonlinear coupling matters; otherwise disclose that individual effects
do not bound combined uncertainty. Do not call an envelope a statistical
confidence interval without justified distributions/covariance. Stable numerical
differences beyond documented uncertainty bounds support a discrepancy under
those bounds; overlap supports compatibility, not proof of model correctness.
If dominant uncertainty is unbounded, attribution remains inconclusive.

Held-out sampling uses an explicit separation/eligibility rule based on observed
variability. Adjacent samples can confirm repeatability in similar conditions,
but share calibration and atmospheric structure. They do not independently
validate calibration or establish generality across conditions.

Spectral/profile plots communicate essential wavelength/layer structure. Color
swatches are secondary evidence only if measured visible coverage supports an
honest color estimate: use one documented spectral/display transform, common
exposure and explicit gamut handling. Do not invent missing wavelengths or
horizon/full-dome scenes from zenith samples. Keep reports/numbers in text,
TSV/JSON and native tables; no text-as-image progress artifacts.

### Authority, resources and verification

The owner authorized independent execution of the reviewed plan on 2026-10-21.
Acquisition, contained runner work and numerical execution follow its evidence
gates; scaffolding alone had not authorized those steps. No dependency installation, external configuration repair,
account creation, researcher contacts or production edits are implicit in setup.

Retain raw files, provider/product/DOI/version, selection and acquisition time,
calibration/quality metadata and checksums as immutable parents. Keep credentials
outside source/artifacts. Derivations retain operation/parameters/tool/source
identities and resulting hashes. File existence alone is not qualification.

Favor GPU production builds and batched probes. Installed libRadtran CPU solvers
and CPU parsing/small proofs are appropriate. One heavy GPU/browser job at a
time; record stage wall/GPU time separately when available and release only
owned resources. Report cost/memory/disk without inventing a retention cap or
rejecting scientific value solely for build complexity. Sixty minutes is a
progress review, not a forced stop while strong progress continues.

Dedicated standards reviewers/audits remain disabled. One initial create-plan
critique applies to this plan, not a standards pass. Retain checkpoint-advisor
monitoring, self-review, local type checks and scientific/evidence verification;
use proof runners, never an experimental test suite.

## Open Questions

- Which recent interval has overlapping calibrated visible spectra, aerosol
  optics/profile, radiosonde and adequate cloud screening?
- How much of the atmosphere can production express, and how much does projection
  affect predicted spectra?
- Is the installed libRadtran solver adequate for geometry/phase/gas treatment,
  and can numerical refinement bound its uncertainty?
- Does the valid spectral range support color evidence? Zenith is not horizon.

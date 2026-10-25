# Measured Clean Horizon Profiles Experiment Design

## Objective

Produce ARM-informed low-aerosol full-scene comparisons at San Jose noon and
sunset at 5 m, 100 m, 500 m, 2 km and 40 km, retaining the near-ground clarity and
solar-glow question and reporting reconstruction uncertainty.

## Acceptance Question

How does a documented ARM-informed reconstruction change actual horizon and Sun
appearance versus Bruneton across the requested heights and times? A complete
measured-atmosphere claim remains distinct from a renderable model with explicit
assumptions. The current [scene plan](scene-plan.md) owns this follow-on sequence;
the earlier [M1 results](results.md) retain their original qualification boundary.

## Owner-directed non-regression requirement

Every accepted change must maintain or improve the existing Bruneton comparison
scores. Improvements for this ARM-informed atmosphere cannot compensate for a
Bruneton regression. This is an explicit owner acceptance requirement.

Before each candidate, freeze the current production Bruneton/B1 baseline and
its existing scoring definitions. Recheck the full established time/interval
matrix using the original paper-atmosphere setup, including its larger spectral
configuration and unchanged reference data, ray selection and scoring. Maintain
or improve each existing scored interval and aggregate; a better overall mean
does not conceal a worse interval. Preserve baseline and candidate evidence.
Do not change benchmark optics, exposure or scoring to manufacture a pass.

Keep the ARM atmosphere fixed while diagnosing its rendering issues. Evaluate
its reference agreement and appearance alongside Bruneton non-regression.
Exploratory trials may reveal regressions and remain useful diagnostic evidence;
they are not accepted fixes under this requirement. Report incomplete checks as
incomplete rather than assuming unchanged scores. No new candidate or production
update is authorized merely by recording this requirement.

## Isolation Boundary

Authored experiment work remains below `experiments/clean-horizon-profiles/`. Generated output remains below `tmp/experiments/clean-horizon-profiles/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- `clean-horizon-profiles` is the unnumbered `<slug>` identity defined by the skill's [folder-identity contract](../../../../../.agents/skills/start-experiment/SKILL.md#folder-identity).
- The experiment source root is `experiments/clean-horizon-profiles/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The experiment source root owns `jsconfig.json` with `allowJs`, `checkJs`, and `noEmit` enabled. Run its type check after authored code changes and self-review against the folder-mapped standards, including `types.md`. Dedicated standards reviewers, independent audits, and compliance-ledger gates are disabled under the repository experiment policy. Keep checkpoint-advisor monitoring active and complete the experiment's own scientific and evidence checks. A more-specific folder assignment may add standards guidance without enabling reviewers.
- The generated-output root is `tmp/experiments/clean-horizon-profiles/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
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
tmp/experiments/clean-horizon-profiles/runs/<sequence>-<name>/progress.jsonl
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

This is exploratory reconstruction and contained rendering, not a production
numerical correction. The owner's follow-on request makes actual noon and sunset
images at 5, 100, 500, 2,000 and 40,000 m above common ground the goal. Use common
San Jose app noon and ground-defined sunset instants at every height; elevated
observer sunset is a different event. The SGP air mass is an idealized transplant,
not a claim about measured San Jose weather. Pre-sunset work from the earlier
qualification plan is optional only if it answers a distinct new uncertainty.

M1 did not qualify a complete observed ambient profile. The new scene sequence
can proceed with labeled, defensible reconstruction assumptions and sensitivity
images. Missing observations limit measured-profile claims rather than alone
ending the image campaign. Do not silently turn a fitted exponential or g-only
proxy into the observed ARM atmosphere. No image-quality or clarity threshold
replaces delivery of the requested conditions.

Baseline: current canonical Bruneton molecular/aerosol optics and source spectra.
Retain a molecular-only control. First comparison changes only aerosols; measured
pressure/temperature or surface-albedo changes are separate factors. Keep spherical
Earth, gas choices, source, surface and display identical within a comparison.
Phase, absorption and vertical distribution changes belong to the selected profile.

Primary source: [NASA ATom aerosol properties V2](https://doi.org/10.3334/ORNLDAAC/2111),
2016-2018 observations, described by
[Brock et al. 2021](https://acp.copernicus.org/articles/21/15023/2021/).
The [NASA catalog](https://catalog.data.gov/dataset/atom-comprehensive-aerosol-properties-2016-2018-version-2)
lists ten optical wavelengths, one-minute data and one-kilometer profile bins.
These are measurement-derived optics, not measured directional sky radiances.
Resolve current revisions, access terms, units and quality flags before use.
The completed M1 access audit found Earthdata authentication required for the
official numerical file. Public derivatives and ARM inputs have been acquired;
the results own their coverage and uncertainty. The current rendering lead is
ARM SGP on December 5, 2023. Credentials stay outside source/logs/chat.

Select contiguous observed ascents/descents or documented profile products using input properties before rendering:
cloud-free validity, ambient near-surface extinction, coverage and column loading.
Record date, location, season, time span, cloud screening and rank; include a representative control.
Keep observed coverage, supplied derived-optics coverage and unresolved assumptions
as separate qualification fields. M1 may legitimately find no qualified candidate.
Do not splice cleanest layers from unrelated flights. AOD about 0.01-0.02 at 550 nm
is a search target, not a discovered value or a fitted parameter.

Critical completeness checks:

- Flights commonly reach about 160 m, not 5 m. This is the first scientific
  feasibility check: inspect one-minute data before kilometer-binned products;
  record actual minimum altitude, vertical resolution and ambient-RH coverage.
  Inspect contemporaneous surface constraints and compare two observationally
  supported completions. If support is absent, only a labeled extrapolation
  sensitivity study is possible; withhold a measured-atmosphere 5 m claim.
- Coverage commonly ends near 12 km. Audit every interval from the highest sample
  to the upper aerosol boundary, including gaps below a stratospheric product.
  A GLOSSAC citation alone does not supply complete altitude/date/latitude/
  wavelength/phase coverage. Label measured, derived and background segments;
  bracket supported backgrounds. Never fill missing aerosol with zero or
  confuse aircraft-column AOD with completed total AOD.
- Inventory extinction, absorption, SSA, phase/asymmetry, particle sizes and
  refractive indices by wavelength/height. A g value does not determine angular
  phase uniquely. Derive phase through documented compatible particle optics,
  or label an approximate proxy and bracket its effect.
- Preserve ambient humidity optics and point/bin units. Dry optics and fitted
  distributions have distinct identities. No hidden spectral extrapolation.

Reference: fully spherical libRadtran/MYSTIC. Plane-parallel radiance is not a
near-limb authority. Authenticate earlier evidence before reuse; black-ground
swatches do not prove the green app ground's appearance. The current altitude-half
gain equals p2 below 10 km, but confirm the complete display/filter/source context.

Register away-Sun (180-degree relative azimuth), Sun-facing (0-degree) and the
actual scene viewing direction; add a distinct second direction only to resolve
a tradeoff. State solar offsets from disk center and account for finite disk
overlap. Fix 1024x576, DPR 1 and 50-degree vertical FOV for primary scene comparisons.
Sample/integrate that camera's finite angular pixel footprint before sharpness ranking.

Measure actual geometric-limb-relative radiance, direct surface transmission,
path radiance, physical luminance, contrast and transition width. Brightening
alone does not establish sharpness. Images are necessary for actual limb color,
edge appearance and Sun glow; metrics/status remain selectable text/CSV/JSON.

Faithful height-dependent optics may need an experiment-owned adapter for cache
construction and live transport. A fitted exponential is a different labeled
model. Complexity, build time, memory and retained size are reportable, not vetoes.
No production source, default, operational-cache or other-experiment modifications.

## Open Questions

- Which central ARM reconstruction and uncertainty completions are defensible?
- How do those assumptions affect actual horizon and Sun appearance at all five heights?
- What contained renderer adaptations are needed for the same optics in cache and live transport?
- How much of each visible change is physical radiance versus the retained display response?

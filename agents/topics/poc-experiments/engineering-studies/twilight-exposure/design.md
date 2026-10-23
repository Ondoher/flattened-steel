# Twilight Exposure Experiment Design

## Objective

Reduce excessive twilight display gain and horizon washout across observer elevations while preserving physical atmospheric fields, daylight appearance and useful stellar visibility.

## Acceptance Question

Can a revised display response prevent the expanding white twilight band at San Jose 40 km without transferring the defect to lower elevations, other views or stars?

## Isolation Boundary

Authored implementation and controls remain below `experiments/twilight-exposure/`. The experiment also owns and may update its topic documents under `agents/topics/poc-experiments/engineering-studies/twilight-exposure/`. Generated output remains below `tmp/experiments/twilight-exposure/`. Production and other experiments are read-only inputs; expanding scope requires explicit owner authorization and cannot grant permission to alter protected historical evidence.

## Output and run rules

- `twilight-exposure` is the unnumbered `<slug>` identity defined by the skill's [folder-identity contract](../../../../../.agents/skills/start-experiment/SKILL.md#folder-identity).
- The experiment source root is `experiments/twilight-exposure/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The experiment source root owns `jsconfig.json` with `allowJs`, `checkJs`, and `noEmit` enabled. Run its type check after authored code changes and self-review against the folder-mapped standards, including `types.md`. Dedicated standards reviewers, independent audits, and compliance-ledger gates are disabled under the repository experiment policy. Keep checkpoint-advisor monitoring active and complete the experiment's own scientific and evidence checks. A more-specific folder assignment may add standards guidance without enabling reviewers.
- The generated-output root is `tmp/experiments/twilight-exposure/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
- Derive repository, source, and output roots from the location of a checked-in repository marker rather than `process.cwd()`.
- Real-path-check every read and write boundary. Reject symlinks, junctions, reparse points, and any resolved path outside its declared root.
- Use a new `runs/<sequence>-<name>/` directory for each evidence-bearing execution. `sequence` is exactly five decimal digits followed by `-`; `name` is descriptive kebab-case and is limited to 16 characters, excluding the `#####-` sequence string. Allocate the next sequence within this experiment only, never fill a gap or reuse a sequence, and reject malformed prefixed entries. Never overwrite or reopen a completed run. Copy or derive reused material into the new run and retain its source identity.
- Record the command, inputs, relevant configuration, implementation revision or hashes, tool/runtime versions, environment facts that affect the result, parent artifacts, derivation operation, and resulting artifact identities.
- Finalize a run with an explicit terminal state: `accepted`, `rejected`, `failed`, or `interrupted`. Publish its terminal manifest only after all artifacts are closed and hashed.
- A verifier may read the run it validates but must not mutate it. Corrections and retries create a new run.
- Keep production and other experiment trees read-only during experiment execution unless the owner explicitly authorizes expanded write scope.

## Monitorable progress

Every operation expected to run longer than one minute writes UTF-8 JSON Lines to:

```text
tmp/experiments/twilight-exposure/runs/<sequence>-<name>/progress.jsonl
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

## Baseline and reusable evidence

The production response is `color-reset-slope-078-p2`: sunset amplitude3.5,
transition980 lux, rolloff power2, adaptation pivot385 lux, floor0.02 lux,
softness0.1 log units and exponent0.78, followed by Bruneton exponential encoding.
Pin the actual source bytes, not just this descriptive parameter list.

The existing diagnostic at `.codex-tmp/flat32-twilight-exposure/` records
San Jose / Globe / 40 km / 50-degree vertical FOV and a fixed local heading with
pitch -6 degrees. Horizontal illuminance falls from22.0701 lux at sunset+30 to
1.90429 at+40 and0.00787084 at+50; display gain rises41.80,280.63 and7632.29.
At+50, keeping the +30 gain reduces near-white pixels from52.49% to4.34%.
These are display observations, not independent physical ground truth.

Reuse the authenticated result JSON, PNGs and scripts read-only, copying parents
into the first new run with hashes and derivations. Earlier scratch records lack
a contained experiment seal and must not be relabeled as sealed runs. Existing
PNG clipping is irreversible: do not invert these images to invent HDR radiance.
Record the dirty worktree and relevant source hashes, including the uncommitted
Center on Sun integration, rather than treating HEAD alone as the implementation.

Preserve the selected original Bruneton atmosphere and package identity
`1e35e0ce4b064690d48ff9639c4c7a1ad557e1eb752716c9f2105a3ac8354e4b`.
Keep optics, scattering orders, grid, Sun geometry, local/distant source spectrum,
source brightness, scene surface materials, stellar catalog/filter configuration
and numerical view integration matched to the baseline at each condition.

## Mechanisms to separate

1. Curve-only response: vary adaptation strength, transition and gain growth,
   holding the horizontal-illuminance meter and highlight encoder fixed.
2. Exposure metering: if curve-only results cannot distinguish bright depressed
   limb from genuine darkness, compare camera-visible luminance measures while
   holding the candidate curve and tone encoder fixed.
3. Highlight encoding: compare a smooth luminance-based shoulder with the same
   exposure meter/curve. Inspect hue, contrast and detail rather than white area alone.

Use frozen +30-minute exposure as a diagnostic control, never as a claim of
correct exposure at every time/elevation. Keep a genuinely dark night control:
a one-dimensional illuminance curve may be unable to distinguish a bright limb
below local horizontal from a dark scene with similar measured illumination.
This is an early falsification question, not a reason to fit unlimited parameters.

Only after isolated results support them may combinations be compared. A Sun-disc
brightness control, saturation slider, artificial halo, changed aerosol profile or
altitude-indexed cosmetic gain is outside this experiment's initial mechanisms.
A separate stellar presentation branch may be examined only after recording why
ordinary exposure transfers the defect to stars; do not automatically amplify
stars to restore every point visible in the overexposed baseline.

## Measurement and rendering architecture

Prefer one authenticated pre-gain, pre-tone, lossless linear RGB capture per
physical scene/view, plus source-resolved layers when needed for stellar or Sun
claims, then cheap candidate display evaluation over the same data. Qualify that
capture and re-encoding against the actual production GPU output before relying
on offline variants. Preserve signed linear RGB; do not silently clamp negatives
or substitute gamma-encoded color. Retain exact transfer functions and source
filter order. Record precision and encoding error separately from candidate gain.
If exact reusable HDR capture is not available, use direct isolated GPU renders
for the affected branch rather than approximating from clipped PNGs.

The experiment may import production owners read-only into its own bundle and
serve operational assets read-only. Its browser, builds, profiles, logs and captures
are wholly experiment-owned; do not rebuild or replace `dist/flat32`, mutate
`src/`, server selection, package contents, another experiment, or an earlier run.
No new dependency or experimental test-framework tree is required. Use focused
self-verifying runners and the configured local JavaScript type check.

Prefer a low-resolution visible-field meter evaluated on relevant state changes,
avoiding synchronous full-frame CPU readback on camera movement. A clearly labeled
diagnostic implementation may first establish whether the mechanism works; do
not reject that mechanism solely because its pilot is not production-efficient.
Then measure added cost with the same physical render and describe practical
integration alternatives. Keeping the currently slow renderer
from becoming slower is a measured design concern; arbitrary time/disk allowances
are not execution vetoes. Report resource consumption and revise estimates.

## Registered case matrix

Primary pilot: Globe / San Jose /40 km at sunset+30,+40,+50, fixed pose and50-degree
vertical FOV, matched1024x576 pixels. Retain native and locked +30 exposure controls.
The Sun may be below local horizontal yet visible above the depressed ground limb.
Read actual observation timestamps and physical directions; sunset is the app's
surface-reference preset, not observer-altitude sunset or an assumed clock value.

Only advancing candidates expand to5 m,2 km,10 km,40 km at sunset,+10,+20,+30,+40,
+50,+60 minutes, followed by one daytime and one genuine-night control per height.
Use the same local viewing convention and report occlusion; never recenter an
occluded Sun above the ground. Protect away-from-Sun and zenith views as well as
Sun-facing horizon. Compare a5-degree close-up at selected failing/control times
separately from the50-degree wide view. New meter candidates need a fixed-exposure
comparison to separate FOV-dependent metering from framing changes.

Register these held-out endpoints before M3 candidate scoring; pin actual UTC
instants resolved by the app rather than treating named controls as timestamps:

| Location | Geometry | Initial controls | Heights |
| --- | --- | --- | --- |
| Union Glacier | Globe/distant | app solar noon, sunset, sunset+50 minutes | 5 m,40 km |
| Union Glacier | Flat/local | Flat0,Flat180 | 5 m,40 km |
| San Jose | Flat/local | Flat0,Flat180 | 5 m,40 km |

Also capture San Jose Globe at sunset+3 hours as an initial genuine-night
control, verifying Sun elevation below -18 degrees at every protected height;
if that condition is not met, choose the next later instant before candidate
scoring and register the actual value. Flat has a local source that may remain
above its plane, so do not relabel Flat180 as a genuine-night equivalence.
The separate Globe night/source-only controls protect true low-light behavior.
Expand a held-out discrepancy only for a recorded prediction. Once a held-out
failure is used to tune a candidate, label it refinement and reserve a new
independent check before claiming generalization. Flat does not share Globe's
surface-reference sunset geometry: do not apply its minute offsets as physically
matched conditions.

## Evidence and decision criteria

Measure raw linear brightness distribution, actual meter value, display gain,
near-white fraction in the atmospheric limb outside the true Sun footprint,
highlight hue/chroma and contrast, ground/midtone luminance, stellar point flux
and visibility in protected source-separated controls, and CPU/GPU/memory cost.
Keep numeric summaries in JSON/CSV/Markdown. Images are required to assess actual
horizon color, clipping, detail and star appearance; do not render text tables
or status reports into images. Match pose, FOV, pixels, display transfer and
exposure policy within each declared comparison. Label any differing meter/gain.

Qualify baseline re-encoding before screening. M1 must include pinned daytime
and genuine-night linear controls with exact timestamps, pose and stellar setup,
so those anchors cannot be chosen after candidate outputs are inspected.
The historical52.49% measure covers the whole image; the candidate band mask is
a different metric. Recompute the native/frozen baseline with that same registered
mask rather than comparing its fraction directly with the historical number.

Check candidate gain densely around every transition, splice and low-light floor,
including the entire observed illumination range. Require finite/positive output,
continuous response and no unexpected reversal in illuminance-times-gain. A
view-meter branch also needs a repeatable camera/FOV sequence with settled values;
if it introduces temporal state, measure overshoot, oscillation and final settled
brightness rather than accepting a delay that only postpones washout.

Qualify baseline re-encoding before screening. Initially require at most one
8-bit code-value difference per channel for at least99.9% of corresponding pixels;
classify separately documented raster-edge differences rather than ignoring a
large transfer mismatch. If this fails, repair the capture or render candidates
directly; the failure rejects evidence reuse, not the scientific hypothesis.

Pilot advancement requires a clear reduction in the +50-minute broad white band
and retained visible horizon color/structure. Use a provisional target of at least
50% less near-white atmospheric-band area versus native baseline, alongside a
fixed-exposure control and actual image inspection. A scene made uniformly black
fails even if white fraction falls. Compare midtone loss and star behavior explicitly;
white-area reduction alone never selects a winner. Register exact masks and guard
thresholds from baseline/control calibration before scoring any candidates; seal
that definition and retain it when a branch fails. Later criteria changes define
a new comparison and do not relabel earlier failures as passes.

Daylight, lower-elevation dusk and genuine-night controls must not acquire a new
washout, large hue shift, loss of all useful stars or unstable response to small
camera/FOV changes. Resolve observed tradeoffs in the report rather than hiding
them in an aggregate score. No replacement curve is physical validation, and no
new Bruneton radiance-RMSE or libRadtran calculation is required or claimed for
this display-only study.

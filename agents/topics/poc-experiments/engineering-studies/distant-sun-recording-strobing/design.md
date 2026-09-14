# Distant-Sun Recording Strobing Experiment Design

## Objective

Determine and correct the recurring brightness reversals associated with discrete atmosphere-cache publication while preserving native application quality and qualifying the result through the recording path where the defect is most visible.

## Acceptance Question

Can a bounded cache-field correction eliminate the recurring brightness reversals in both source frames and the encoded recording without visible blur, incoherent lighting, temporal regressions, or an unacceptable cache and GPU resource cost?

## Initial Diagnosis

The inherited diagnosis associated the discontinuity with publication of
one-degree atmosphere-cache states. Fresh controls now locate the recurring
reversal in the source field; see Current Causal Finding below.
Accepted diagnostic run `1789171222384-creative-strobing-diagnosis` measured
all 1,800 frames of the immutable `1788974488678-creative-animation` film. At
cache boundaries, two-sided temporal curvature was 5.08 times the stable-frame
level over the full image, 7.01 times in the upper sky, 3.98 times at the
horizon, and 3.72 times in the lower region. Cache-adjacent frames supplied 33
of the 40 strongest full-frame curvature events even though they represented
about 10.6 percent of eligible frames. Thirty of those 40 extrema reversed
brightness direction.

The retained camera curves are continuous. Retained ambient, ground-bounce,
directional, and combined scene-light values are smoother at cache transitions
than between them. These observations isolate the recurring flash pattern;
they do not qualify the broader sunrise/sunset color response. Owner inspection
of the later film identifies a separate brightness excursion at those crossings,
which now requires its own causal control and acceptance measurement.

Recording is where the defect is most obvious, but the accepted diagnosis does
not prove that encoding or playback causes it. The measurement used decoded
video frames, so a new control must separate four stages:

1. the image produced by the renderer before encoding;
2. deterministic frame delivery to the original recording workflow;
3. compression into the target recording; and
4. playback or presentation of that recording.

The fresh control confirms that the renderer creates the discontinuity and
both recording paths preserve it. The identical-instant cache-view ablation
then excludes publication identity as the cause of the shared-field error.
The ozone-free production cache changes atmosphere content but retains the
discrete publication boundary, so the experiment must demonstrate the problem
against the package used by its control rather than infer that the older film
and current application are identical.

## Evidence Authorities

- Immutable creative-film control:
  `tmp/experiments/distant-sun-shadow-animation-evidence/runs/1788974488678-creative-animation/`.
- Immutable diagnosis:
  `tmp/experiments/distant-sun-shadow-animation-evidence/runs/1789171222384-creative-strobing-diagnosis/`.
- Diagnosis artifact set:
  `d11dfb90549a3d0df8dc9a540b2c416ace03dc01a4c5774c25449d68cf9cd4e0`.
- Current ozone-free cache package:
  `2243c1ab2c2d529131759b32d72cee2a2e4b32098e1cc450c0d48cf34ed4edc7`.
- Every reused trace, frame, or configuration must be copied into a new run
  with its source identity and derivation recorded. The parent runs remain
  read-only.

## Experimental Approach

### Reproduce Before Correcting

Create a short deterministic sweep that crosses enough one-degree cache
boundaries to reproduce the recurring signature without rendering a full day.
Hold the camera, geometry, stellar state, exposure policy, output resolution,
frame cadence, and non-atmosphere lighting behavior fixed. Record requested and
published cache identities, continuous solar zenith, transition state, frame
number, and presentation timestamp beside every frame.

Produce three synchronized evidence paths from the same declared control:

- lossless renderer frames acquired before video compression;
- an offline encode made from that exact lossless sequence; and
- the original deterministic recording workflow used for the owner-visible animation.

Real-time capture and real-time performance qualification are outside this
experiment. The original film uses ideal offline choreography; a separate
encode from retained lossless frames tests encoding independently of that
workflow.

A reversal present in lossless frames belongs upstream of the codec. A
reversal introduced only by offline encoding belongs to compression. A
reversal seen only in the original recording workflow points to deterministic
frame delivery or capture ordering. Playback-only differences require the same encoded bytes
to be inspected through a second decoder or frame extractor.

### Candidate Corrections

The retained hard-publication control reproduces the source defect. An
identical-instant comparison excludes blending adjacent cache views because
their overlapping physical rows produce byte-identical images.

The selected correction combines stable sphere roots, a four-metre one-sided
surface-limit estimate for the logical zero-altitude row, and monotone cubic
solar-angle interpolation of cumulative scattering density. Current Causal
Finding records the supporting probes and rejected candidates. It retains
Native15 channels, N4 scattering, all coordinate grids, scene-light policy,
source direction, exposure, and directional image sampling. Complete cubic
support is required before atomic publication. At most two existing 24-layer
atlases may be resident; no third atlas is introduced.

The selected short diagnostic passes all pinned source and encoded gates in
`00019-capture-analysis`. Full-film and owner visual acceptance remain required.

### Measurement And Acceptance

For every control and candidate, calculate adjacent-frame luma change and
two-sided temporal curvature for the full frame, upper sky, horizon, and lower
region. Correlate extrema with cache availability and publication events.
Retain the strongest-event table, region traces, source/encoded frame pairs,
and exact frame timestamps. Inspect the recording at native cadence under the
same presentation conditions where the owner observed the defect.

The initial quantitative target is to reduce cache-boundary mean temporal
curvature to no more than 1.5 times the non-boundary mean in every measured
region, with no recurring cache-aligned direction reversals among the strongest
events. P0 may tighten this target after measuring a fresh current-package
control, but it may not weaken it merely to admit a candidate. Visual
acceptance also requires that the recurring flash is absent at normal playback
speed.

The selected candidate must reach the exact destination state after each
bounded transition, preserve the intended long-term brightness curve, avoid
new oscillation or lag, and stay within the admitted dual-atlas GPU budget.
Native application inspection and recording inspection are separate gates.

### Diagnostic Animation Deliverables

Deliver the short diagnostic animations alongside the regenerated full film.
Include the unchanged hard-publication control and every evaluated correction
candidate, with each sequence's offline encode from lossless frames and its
original deterministic recording. Preserve the corresponding lossless frames, scene and
cache traces, and measurements as supporting evidence.

Provide synchronized control-versus-candidate comparison videos for the
selected correction, including the cache crossings responsible for the
strongest measured reversals. Label each comparison with the candidate,
capture path, frame or timestamp, and cache-transition state so the owner can
connect visible behavior to the diagnosis. Keep unannotated recordings
available for normal-speed inspection.

At handoff, provide an artifact index with direct paths to every diagnostic
animation, comparison video, and full film, identifying each run, correction,
capture path, and outcome. Retain rejected candidates with their disposition;
do not present only the successful result. Write every artifact and derivative
into a new run under this experiment's output root, preserving parent evidence
and recording the complete derivation chain.

### Full Animation Qualification

Once the selected correction passes the short-control checks and appears to
remove the strobing, regenerate **The Hours** from accepted parent run
`1788974488678-creative-animation` under
`tmp/experiments/distant-sun-shadow-animation-evidence/runs/`. This full film
is a required deliverable before final acceptance.

Reproduce the parent's deterministic scene and seed, geometry, camera score,
astronomical timeline, exposure and lighting policies, and recording settings:
3840 by 2160, 60 seconds, 30 fps, and 1,800 frames. Apply the selected correction
with the current-package control's cache package, recording both differences
from the accepted parent explicitly. Preserve the complete per-frame scene and
cache trace so matching choreography can be verified independently of the
changed atmosphere appearance. The retained
[creative source guide](../../../../../experiments/distant-sun-shadow-animation-evidence/creative/README.md)
documents the original reproduction workflow; adapt its controls within this
experiment's boundaries.

Write the regenerated `captures/creative-full-day.mp4`, traces, provenance,
and comparison artifacts into a new run below this experiment's declared
output root. Keep the original experiment source and all accepted parent runs
read-only. Record reused source and artifact identities and the full derivation
chain; identical encoded bytes are not required.

Verify the full film's frame count, timestamps, recording settings, scene
trace, and cache-correlated brightness behavior. Provide the resulting film
path for owner inspection at native resolution and normal playback speed,
alongside the immutable original. Final acceptance requires the recurring
strobing to be absent throughout the full animation without new visible
regressions; a passing short sweep alone is insufficient.

## Isolation Boundary

Authored experiment work remains below `experiments/distant-sun-recording-strobing/`. Generated output remains below `tmp/experiments/distant-sun-recording-strobing/`. Production and other experiment trees are read-only inputs unless their write scope is separately authorized.

## Output and run rules

- `distant-sun-recording-strobing` is the unnumbered `<slug>` identity defined by the skill's [folder-identity contract](../SKILL.md#folder-identity).
- The experiment source root is `experiments/distant-sun-recording-strobing/`. Authored implementation, fixtures, harnesses, runner source, configuration, and dependency manifests belong there.
- The source root owns `jsconfig.json` with JavaScript type checking enabled
  and no emission. Type checking and the repository's required types-standard
  review both apply; experiment-specific evidence gates remain in force.
- The generated-output root is `tmp/experiments/distant-sun-recording-strobing/`. Builds, caches, browser profiles, reports, captures, diagnostics, renders, logs, progress records, temporary files, and other generated intermediates belong only there and must remain ignored by Git.
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
tmp/experiments/distant-sun-recording-strobing/runs/<sequence>-<name>/progress.jsonl
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

- Recording is part of the acceptance surface and causal-isolation method.
- Lossless renderer frames, separate encoding, and deterministic recording are evaluated
  separately before a correction is selected.
- If the discontinuity exists before encoding, correction belongs at the cache
  transition rather than in exposure or recording compensation.
- The resource ceiling is the server-admitted dual-atlas budget for the tested
  environment; the experiment does not hardcode an asset identity allowlist.
- The previous creative film and diagnosis remain immutable parent evidence.

## Remaining Qualification Questions

- Does the correction pass throughout the native full-day choreography,
  including both travel directions through the cache and twilight?
- Does owner inspection find a visible regression absent from region means?
- Before production promotion, what full-spectrum physical-error bound should
  govern the four-metre surface-limit approximation?

## Authorized Representation Fallback

If fresh evidence exposes a fatal limitation in the existing cache design,
test an alternate representation within this experiment and record its
physical interpolation, memory cost, and provenance. The owner authorizes this
fallback and experiment-local npm dependencies. Preserve the original
resource target for ordinary candidates; explicitly qualify any alternative
rather than silently claiming it fits the dual-atlas design.

## Current Causal Finding

The accepted 120-frame control (`00003-control-capture`) and three-path analysis
(`00004-capture-analysis`) reproduce the defect before encoding: source
curvature ratios are 11.87 full, 17.11 upper, 7.26 horizon, and 17.46 lower.
Both encodes preserve those reversals. In `00005-cache-ablation`, changing
only the cache scene from 82 to 83 at a fixed instant produces byte-identical
PNGs, including the repeated scene-82 control. Adjacent views share the same
physical field, so blending their identical overlapping values cannot fix it.

`00006-field-probe` authenticates encoded and decoded blocks and finds large
solar-angle oscillations in the zero-altitude cumulative scattering row; the
1875-metre row is far smoother. The first stable-root-only candidate (`00007-stable-ground`) did not remove
the field oscillation and is rejected by `00011-capture-analysis`; its movie
and separate encode remain deliverables. GPU probe `00010-ground-probe`
confirms false half-metre outward surface intersections in the original.

The second candidate evaluates the logical zero-altitude row as a
one-sided surface limit four metres above the ideal sphere. This is an
explicit numerical approximation, rather than an exact zero-height sample.
It avoids the ambiguous Earth-scale Float32 surface classification while
retaining atmosphere physics, all spectral channels and scattering orders,
coordinate grids, cache layout, admitted memory, exposure, and image filtering.
Single-channel probes at 2, 4, and 8 metres (`00013`, `00012`, and `00014`)
remove the large oscillation. Over tested altitudes 0-8 and zenith knots
65.5-85.5 degrees, direction-mean density differs from the 4-metre result by
at most 0.290% at 2 metres and 0.566% at 8 metres. This sensitivity result is
limited to spectral channel 6 and the declared sampled range.

The full-spectrum four-metre package (`00015-stable-ground`) passes package
verification. Its 120-frame capture (`00016-fixed-capture`) has no reversing
source boundary peaks, but `00017-capture-analysis` still rejects it: source
curvature ratios are 2.38 full, 3.52 upper, 2.56 horizon, and 1.25 lower.

The third candidate retains that exact field and replaces linear solar-angle
interpolation with monotone cubic Hermite interpolation of cumulative
scattering density. Harmonic-mean tangents are shared across knot boundaries;
opposite-signed neighboring differences give a zero tangent. Exact knot
values, positive monotone intervals, source direction, and image sampling are
preserved. The four angular samples use complete scene support within two
neighboring scenes on each side. Across all 109 scenes this requires at most
20 blocks in the existing 24-layer atlas. The existing controller owns atomic
preparation, dual-atlas transitions, cancellation, and release. The complete
cubic support is required and protected, rather than discardable prediction.
Missing inner samples remain unsupported. A missing outer sample at the
physical package boundary uses a one-sided secant. This is an angular field
interpolant, with no temporal accumulation or exposure treatment.

## Local Media Tooling

### Horizon Color Gate

Owner inspection identified a broader color excursion missed by the recurring
cache-event detector. A separate gate measures the maximum wrong-direction
upper-sky luminance excursion over the complete solar zenith 89.5-91.5 degree
interval, in the original 10-14 second sunrise and 46-50 second sunset windows.
The allowance is one regional mean display-code value on the 0-255 scale.
It uses running extrema, so a gradual multi-frame jump cannot escape by lacking
a sharp reversal or cache alignment. Other image regions and the maximum
opposing single-frame step are retained as diagnostics. Native source means and
both short-film encodes must pass, followed by source and encoded full-film
qualification. This targeted gate does not assert that every sky region must
be monotonic throughout the entire day.

The p2 candidate retains the existing gain amplitude 3.5, 980-lux pivot,
adaptation response, spectral projection, and tone mapping. It changes only
the sunset Hill exponent from 9 to 2, shared by CPU and generated GLSL. A
separate no-boost ablation sets the amplitude to zero to isolate causality.
The selected response requires an analytic positive-slope proof for
`E * gain(E)` at every nonnegative illuminance, plus actual spectral sky
captures; proportional-radiance monotonicity alone cannot qualify the sky.
This is an explicit display-response correction for the owner-reported color
artifact, independent of the earlier cache-field correction.

The experiment-local npm manifest owns FFmpeg for independent encoding,
decoding, and synchronized comparisons, and PNG access for lossless artifact
inspection. The original recorder continues to use its pinned WebCodecs and
Mediabunny implementation. `npm run check` in the experiment runs the local
JavaScript type check; the manifest exposes capture, generation, film,
analysis, and field-probe commands. Generated output remains under the ignored
experiment output root.

## Selected Short Result

The combined candidate (`00018-fixed-capture`) passes `00019-capture-analysis`
without weakening the original gates. Curvature ratios are 1.006/0.872/0.843/1.213
for source full/upper/horizon/lower regions; 0.819/1.270/0.915/0.577 through the
original recorder; and 1.146/0.977/0.948/1.222 through independent PNG encoding.
`00020-cubic-proof` verifies support over all 109 scenes, exact sampled knot
endpoints, shared knot slopes, and no overshoot or reversal across 100 samples
per retained physical interval. Full-film qualification remains separate.

## Full-Film Residual Refinement

The first full film (`00021-fixed-film`) matches all original camera and
astronomical states and all 1,800 presentation slots, but is rejected by
`00023-film-analysis`. Encoded curvature ratios pass; two reversing events
remain at 9 and 51 seconds, where the original one-second physical-light
interpolation changes slope. A matched twilight isolation retains the corrected
cache and replaces only linear diffuse-spectrum/sky-adaptation interpolation
with monotone cubic interpolation through the same measured physical knots.
Direct spectra remain exact-time and the native adaptation equation remains
unchanged. This removes the twilight reversing knot events in `00028`.
The supplemental 7-11 second interval still has ratio failures during its
steep monotonic sunrise ramp; it is retained with that result. The original
pinned diagnostic and full-film gates remain unchanged and must pass.

The legacy source meter used the browser's default 320x180 downsample, which
can alias moving ground detail. New captures compute exact native-pixel means
for the same four masks. This modifies measurement only. The first film,
legacy measurements, and all failed candidates remain immutable. A new full
film must qualify the refined physical-light interpolation and exact source
meter before selection.

## Recurrence Counting And Isolated Event

The refined 4K film (`00031-fixed-film`) has source curvature ratios
0.632/0.479/0.662/0.871 and encoded ratios 0.604/0.550/0.700/0.667 for
full/upper/horizon/lower masks. The initial full-film report (`00033`) still
fails because the detector counts both centered extrema of one source-only
pulse as separate recurring events.

Recurrence now counts distinct physical cache publications producing the
strongest reversing extrema, while retaining every raw extremum. Both sides
of one pulse at publication frame 112 count as one isolated event. Different
publications still count separately. `00034-recurrence-proof` verifies that
the first film's morning and evening publications remain a failure, and that
the selected film's adjacent extrema (frames 111 and 112) belong to one
publication. The 1.5 curvature-ratio limit, masks, ranking, raw measurements,
and maximum of one nonrecurring publication event are retained. All earlier
reports remain immutable; new qualification records the revised detector.

The isolated lower-region native-source dip is 0.1521 on the 0-255 mean
code-value scale at 3.73 seconds. It is not a reversing event in the decoded
film. This experiment claims removal of the recurring strobe, not absence of
every isolated native-source fluctuation. Owner visual inspection remains a
separate acceptance gate.

## Horizon Color Causal Finding

Owner inspection of film `00031` identifies an apparent sudden brightening
after sunset and the reverse change at sunrise. The largest native upper-sky
steps occur near 48.6 and 11.37 seconds, around zenith 90.8-90.9 degrees.
The color response is continuous; its steep gain creates the visible excursion.

The sunset part of the pre-tone-map gain is
`1 + 3.5 / (1 + (E / 980)^p)`, multiplied by the unchanged low-light adaptation
factor, where `E` is receiver illuminance in lux. With production `p = 9`,
`d(log gain) / d(log E)` falls below -1, so even a proportional decline in
physical radiance can increase the displayed result. The revised `p = 2`
retains the same limiting gains and pivot while changing intermediate
brightness over a broader illumination range. It does not preserve the old
intermediate gain values or apply a temporal image/exposure filter.

`00053-color-proof` derives executable models from the native source using
the same constants patch as the browser and records the native dependency
inventory. Generated GLSL and CPU use the same
selected exponent. Three analytic illuminance intervals bound the negative
gain elasticity strictly below 1 for every nonnegative input; the most
conservative bound is 0.981084. A 6,001-point logarithmic check from 1e-6 to
1e7 lux gives minimum proportional-response log slope 0.133899 for p2 and
-2.232946 for p9. The analytic bound, not the sampled minimum, supports the
global monotonicity claim.

Matched sunset captures `00038`, `00040`, and `00042` retain exactly identical
physical illuminance, adaptation luminance, observation times, geometry, and
camera. Only the selected color constants differ. The original upper-sky
wrong-direction excursion is 53.765 mean display-code values. Removing the
sunset boost or changing to p2 gives zero excursion. The p2 sunrise `00044`
also gives zero. Native source means, source PNGs, original recorder output,
and independent encodes all agree. `00051-horizon-proof` authenticates these
comparisons with the complete-crossing guard and retains the plotted traces.
`00052-horizon-guards` verifies rejection of incomplete/misaligned/nonfinite
evidence and missing/duplicated color-patch anchors. The selected p2 daytime
diagnostic `00046` passes the original recurring-strobe gates in `00049`.
The complete moving-camera film is qualified separately below.

## Replacement Film And Preserved Source Failure

Film `00050` and qualification `00054` match every original choreography and
presentation slot. Source curvature ratios are 0.826/0.526/0.776/1.029 and
encoded ratios are 0.688/0.613/0.740/0.786. Both horizon gates have zero
wrong-direction regional excursion. Encoded recurrence passes, including one
ranked full-region event at publication 221.

The aggregate source recurrence gate remains failed: lower-region events
111/112 and 125 map to two publications. The early ground fluctuation at 125
was already present in `00031`; removing the large color excursion promotes
it into the strongest forty. `00055-color-delta` authenticates both complete
films and analyses and proves exact equality of every regional RGB mean,
instant, camera, and cache identity in all flagged three-frame neighborhoods.
The color correction is therefore qualified without treating the full source
gate as passed. The detector, ranking, limits, and rejected result are retained.
Delivery is allowed with this explicit limitation and the separate color-delta
proof; overall experiment and production-promotion gates remain open.

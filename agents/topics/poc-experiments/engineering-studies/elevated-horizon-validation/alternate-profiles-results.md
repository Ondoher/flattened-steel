# Published Alternate Profile Results

State: completed and verified on 2026-10-23, including the owner's 5 m horizon.
Production and its default Bruneton profile are unchanged. The experiment remains
selected for owner review; completion does not close, suspend or promote it.
The [plan](alternate-profiles-plan.md) owns scope; the earlier
[Bruneton baseline result](results.md) remains intact. Consequential decisions
and recovery are in the [execution log](execution-log.md).

Continental-clean is the most useful published alternative for a low-altitude
comparison. It has less total aerosol optical loading, improves 5 m horizon
contrast, and retains a strong solar aureole. It does **not** fix the 10 km fuzzy
horizon and makes the immediate solar neighborhood considerably brighter,
particularly at sunset. None of the tested profiles is a general replacement
recommendation for the requested elevated-horizon appearance.

[Open all horizon strips and directional swatches](../../../../../tmp/experiments/elevated-horizon-validation/runs/00046-opac-report/comparison.html).
These are registered libRadtran samples using the production display transform,
not full app scenes. Numeric spectra and replicate data remain selectable in
[analysis.json](../../../../../tmp/experiments/elevated-horizon-validation/runs/00046-opac-report/analysis.json)
and [brightness.csv](../../../../../tmp/experiments/elevated-horizon-validation/runs/00046-opac-report/brightness.csv).

## M1 - Acquired and qualified data

The initial Node HTTPS connections failed for both sources (run 00022); those
failures were logged and skipped. Python system HTTPS succeeded using verified
TLS and authoritative endpoints (00023), without credentials or an installed
solver modification. Downloaded archives:

- [Original OPAC 4.0b, Zenodo](https://doi.org/10.5281/zenodo.7275005):
  1,004,668 bytes; SHA-256
  `561d95f60e7151861f0114f7e654b85fb763ed367263ba76255780fc735d110d`.
- [Official libRadtran optical-property library](https://www.libradtran.org/doku.php?id=download),
  `optprop_v2.1.tar.gz`: 743,391,266 bytes; SHA-256
  `11daa1f1f4be0fd4ddf7e881ec2005498049674a1540d37b4b1e8f5e16052c7e`.

Only 14 OPAC NetCDF entries were extracted from the combined optical archive.
The complete archives and retrieval/derivation records remain immutable. The
small original archive supplies compositions/documentation; executable cases
use **libRadtran's distributed OPAC-derived mass-concentration presets**, whose
headers explicitly distinguish them from original OPAC number concentrations.
They are complete published model recipes, not measured San Jose atmospheres.

Recipe layers/concentrations are unchanged, including upper-atmosphere components.
Common physical optics use the supplied 50% RH class. Scalar F11, all original
wavelengths, angular samples, extinction and SSA are retained exactly in the
reader-compatible slices. A singleton humidity coordinate is an addressing
convention; it does not turn the physical optics into a 0% RH atmosphere. No
fitted HG/CS phase function or fitted exponential replaces the candidate data.
The published compressed angular tables' maximum phase-integral error is about
0.32% over the library wavelength range; that limitation is retained.

[Final optical/path inventory](../../../../../tmp/experiments/elevated-horizon-validation/runs/00036-opac-paths/inventory.json):

| Executed aerosol model | Aerosol optical depth at 550 nm | Aerosol column above 10 km |
| --- | ---: | ---: |
| Bruneton, native-bin coefficients | 0.06328 | about 0.0000152 |
| Continental clean, 50% RH | 0.05326 | 0.007002 |
| Maritime tropical, 50% RH | 0.07581 | 0.007002 |
| Maritime clean, 50% RH | 0.13709 | 0.007002 |

The underlying continuous Bruneton formula gives AOD 0.06453; the executed
native-15 bin containing 550 nm uses its 563.6667 nm coefficient and gives
0.06328. Continental-clean is about **16% lower than the executed baseline**.
The marine models are composition/loading controls, not lower-column replacements.
A lower total column does not mean a cleaner upper atmosphere: these published
presets retain substantially more aerosol above 10 km than Bruneton's exponential.
Phase, absorption and placement all change, so this is not a placement-only test.

The fully spherical 10 km pilot succeeded on both sides of the limb (00025).
Disposition: all three presets were usable for screening; continental-clean
qualified as the lower-loading candidate. No profile was selected for production.

## M2 - Horizon appearance, including 5 m

Common molecular coefficients, piecewise-constant native-bin solar inputs, Earth
radius 6,360 km, black ground, geometry and fixed display context isolate the
complete aerosol model change. Horizon offsets are -1, -.1, -.02, +.02, +.1 and
+1 degrees relative to each observer's actual spherical limb. Its elevation is
-0.0718446 degrees at 5 m and -3.210885 degrees at 10 km. These are not rays about
the local horizontal. Candidate optics vary spectrally within each source bin.

Initial screen: three full-spectrum replicate vectors per case, two Gaussian
samples per native bin (30 wavelengths), 256 layers, 100,000 photons. Contrast
is C=(Y_above-Y_below)/(Y_above+Y_below). Values below are mean C at +/-0.1 degree
with empirical Student 95% half-widths:

| Model | 5 m | 10 km |
| --- | ---: | ---: |
| Bruneton | 0.8017 +/- 0.0092 | 0.01564 +/- 0.00092 |
| Continental clean | 0.8965 +/- 0.0076 | 0.01488 +/- 0.00371 |
| Maritime tropical | 0.8313 +/- 0.0086 | 0.01374 +/- 0.00225 |
| Maritime clean | 0.7327 +/- 0.0232 | 0.01132 +/- 0.00328 |
| Molecular only | 0.9543 +/- 0.0069 | 0.05259 +/- 0.00150 |

Continental-clean's 5 m gain is **+0.09475 +/- 0.01544**, passing the original
screening gate. The narrow 10 km difference is unresolved. Across the wider
+/-1 degree pair at 10 km, contrast falls from 0.1311 for Bruneton to 0.0985
for continental-clean; both marine presets are lower still. None makes this
high-altitude horizon crisp. Molecular-only transport also retains haze.
Black-ground contrast is not a prediction of the green app ground's contrast.

[5 m colors](../../../../../tmp/experiments/elevated-horizon-validation/runs/00046-opac-report/horizon-5m.png)
and [10 km colors](../../../../../tmp/experiments/elevated-horizon-validation/runs/00046-opac-report/horizon-10000m.png)
use shared exposure and nearest registered rays without invented smoothing.
Visible bands reflect the sparse angular samples.

Independent direct-path integration, rather than inference from total radiance,
gives combined molecular+aerosol transmission at 550 nm for a ray 0.1 degree below
the limb:

| Height | Bruneton | Continental clean |
| --- | ---: | ---: |
| 5 m | 0.8928 | 0.9476 |
| 500 m | 0.07010 | 0.2365 |
| 2 km | 0.01188 | 0.04223 |
| 10 km | 0.005571 | 0.01605 |

More surface transmission alone does not guarantee a stronger visible boundary;
the accumulated path radiance matters too. The inventory retains molecular and
aerosol contributions separately and integration-refinement evidence.

### Refinement and uncertainty

Runs 00031 and 00045 separate 60-wavelength spectral sampling and 512-layer
refinement from the original 30-wavelength/256-layer screen. Continental-clean
mean Y changes, below/above the +/-0.1 degree pair:

| Height | Spectral refinement at 256 layers | Layer refinement at 60 wavelengths |
| --- | ---: | ---: |
| 5 m | +0.856% / -0.001% | -0.812% / -0.057% |
| 10 km | -0.004% / -0.045% | -0.310% / -0.286% |

The layer check also doubles photons, changing sampling precision. At 5 m the
refined continental contrast remains 0.8964 versus refined Bruneton 0.8075.
The dark ground radiance has roughly 5-10% empirical intervals in retained cases;
**1% absolute photometric convergence is not established**. The gross contrast
benefit survives. In analysis.json, baselineDifference always references the
original Q2/256-layer Bruneton screen, including on refinement rows; matched
fine-versus-fine contrast values must be compared directly.

Shared seeds can induce covariance. Final intervals use empirical differences
between matching replicate vectors, rather than assume independent errors or
perfect cancellation. Three replicates do not establish rare-history coverage
or include physical-model/systematic uncertainty. Early progress reports
00027-00037 are superseded by final report 00046 and remain preserved.

Disposition: continental-clean earned bounded low-altitude and sunset controls.
Maritime-tropical is a valid control with smaller 5 m benefit and higher total
loading; maritime-clean worsens 5 m contrast. Neither earned a cache build.

## M3 - Other elevations and solar-neighborhood tradeoffs

At 2 km, continental-clean improves narrow-pair contrast modestly: 0.02225 versus
0.01609, paired gain +0.00616 +/- 0.00401. Molecular-only is 0.1571. This is far
from restoring a sharply contrasting boundary.

At 500 m noon, diffuse center rays lie 1, 3 and 10 degrees from the Sun toward
zenith on the Sun-zenith great circle. They exclude the direct disk and have zero
angular footprint; actual scene pixels have finite footprints. Mean luminance:

| Separation | Bruneton, cd/m2 | Continental clean, cd/m2 | Continental / Bruneton |
| --- | ---: | ---: | ---: |
| 1 degree | 8,843 | 34,499 | 3.90 |
| 3 degrees | 8,574 | 12,077 | 1.41 |
| 10 degrees | 6,677 | 5,864 | 0.88 |

The 1-degree molecular-only control is about 1,648 cd/m2. Continental-clean
therefore retains and strengthens a concentrated solar aureole, satisfying H3.
This may be excessive brightness for the owner's preference; it is not a reason
to label the published atmosphere invalid.

[Noon swatches](../../../../../tmp/experiments/elevated-horizon-validation/runs/00046-opac-report/directions-500-noon.png),
[ten minutes before sunset](../../../../../tmp/experiments/elevated-horizon-validation/runs/00046-opac-report/directions-500-pre10.png)
and [sunset swatches](../../../../../tmp/experiments/elevated-horizon-validation/runs/00046-opac-report/directions-500-sunset.png)
share the fixed production display policy. The dusk context is the same retained
1,530.3246 lux value for both times/profiles; brightness is not normalized away.

| App preset, 500 m | Bruneton C | Continental C | Paired gain, 95% half-width | 1-degree Y ratio |
| --- | ---: | ---: | ---: | ---: |
| Ten minutes before sunset | 0.0372 | 0.1111 | +0.07394 +/- 0.01177 | about 4.03 |
| Sunset | 0.0286 | 0.1124 | +0.08379 +/- 0.02960 | about 5.21 |

Preset UTC instants are 2024-06-21T03:16:03.503Z and 03:26:03.503Z. They are the
app's ground-defined times, not the elevated observer's physical sunset: the
Sun remains above the 500 m geometric limb. Refraction is not included. Near-Sun
radiance grows strongly in the candidate; a saturated swatch alone is not proof
of a resolved difference, but the paired numerical intervals support it.

The [phase audit](../../../../../tmp/experiments/elevated-horizon-validation/runs/00041-opac-phase/phase.json)
checks original versus exported scalar phase samples. All original angular nodes
are retained exactly. Continental-clean's normalized 550 nm phase at 1 degree
is about 3.65/sr at 500 m and 16.0/sr at 3-10 km, versus Bruneton's 1.80/sr.
This supports a sharper forward peak but does not causally isolate phase from
all other profile changes. No synthetic finer grid creates missing original
Mie detail; underlying table-compression uncertainty and near-Sun absolute
precision remain limitations. No two-refinement 1% forward-radiance claim is made.

Disposition: useful low-altitude reference, adverse elevated-horizon and dusk
brightness tradeoffs. Additional high-sky scans, 80% RH, measured ACTIVATE profiles
and further angular scans were not triggered: no candidate solves the principal
10 km question, and the earned low-altitude tradeoffs are already resolved.
This does not exhaust all real clean atmospheres or validate San Jose weather.

## M4 - Scene compatibility and recommendation

The [source compatibility audit](../../../../../tmp/experiments/elevated-horizon-validation/runs/00047-opac-verify/scene-compatibility.json)
finds that current profile configuration supplies one exponential aerosol density
and a global phase/SSA description. Published layers change species proportions,
absorption spectra and phase with height. The current cache compiler supports
phase tables, but that alone does not supply this height-dependent mixture.

A faithful implementation needs layered aerosol contributors, extinction,
scattering and phase handling in both cache construction and runtime path
transport. This is possible future work, not a claim that the architecture
cannot support it. A constants-only profile swap or fitted exponential would not
be the downloaded model. Under the plan's conditional scene gate, no alternate
GPU cache, full app scene or new B1 score was produced. Implementation effort,
cache size/build time, peak memory and render cost are consequently unmeasured.
They are reported limitations, not complexity-based rejection criteria.

Recommendation: retain continental-clean as an externally defined low-altitude
reference if a faithful integration is wanted. Do not adopt it to fix the 10 km
horizon: these results give no such benefit. If that appearance remains the main
goal, seek an observed or published atmosphere with appropriate vertical loading,
rather than reduce an arbitrary scalar until the image looks right. Production
keeps its current Bruneton profile pending an owner decision and separate work.

## Verification, cost and checkpoint

[Accepted final proof 00047](../../../../../tmp/experiments/elevated-horizon-validation/runs/00047-opac-verify/verification.json)
authenticates 16,478 artifact records and **311 successful scientific cases**:
309 comparison cases plus two pilot cases. It replays source/input identities,
optical projection, geometry/band/color contracts and immutable parent hashes.
Local JavaScript type checking, JavaScript syntax and Python AST checks pass.
The constant-spectrum CIE control agrees within 3.78e-15 relative error.
Dedicated standards reviewers/audits were disabled; no compliance claim is made.

Measured solver-tool invocation time is 2,083.214 seconds (34.72 minutes), including
launching, input copies and hashing; it is not pure solver CPU time or total task
time. Final verification took 61.5 seconds. Retained experiment output at that
snapshot is 3,830,911,133 bytes (3.57 GiB), including earlier baseline browser/cache
evidence and the newly retained 743 MB archive; this is not new cache size.
Streaming archive hashes avoid allocating the whole download in memory.

M1 recovery checkpoint: fa042599, acquisition and qualified adapters. The final
checkpoint unit is `feat(experiment): evaluate published aerosol profiles`, covering
completed analysis, controls and this report; local Git history and the execution
handoff provide its exact identity. No solver jobs, browser
or server are left running by this follow-on. No blocker remains for this plan's
solver-only completion; faithful production integration is a separate task.

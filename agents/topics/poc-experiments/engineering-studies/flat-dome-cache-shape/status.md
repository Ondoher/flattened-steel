# Flat Dome Cache Shape Experiment Status

Status: scene-render R1-R4 complete, with qualified near-rim accuracy.

## Current Focus

The latest owner-selected camera height is 20 m. Run `00054-r4-three-final`
contains the new [outward](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00054-r4-three-final/outward.png)
and [inward](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00054-r4-three-final/inward.png)
1280x720 renders. Location, closest-approach Sun, 90-degree FOV, common exposure
and warm-gray ground are retained. The camera has 29.95575 m shortest dome
clearance; the ground cutoff is approximately 2.56 pixels below the horizon.
Local geometry, transmission, spectral composition, display and resource checks
pass. No independent-probe accuracy campaign was repeated for the new height.

The completed [scene-render plan](scene-render-plan.md) demonstrates a complete
live cache, the updated atmosphere shader, and actual Three.js finite-ground
rendering in two opposite directions from the same inside-dome observer. The
[scene report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00053-r4-scene-report/index.html)
links the original 45 m PNGs, settings, timing and raw evidence. That final run
`00050` is verified by `00051`; `00053` verifies its immutable artifacts and the
rendered report. No numerical work is running. The experiment remains contained
and open; no promotion or lifecycle closure was selected.

The original 45 m near-rim rays expose a material accuracy limitation: N12 query
errors reach 37.25%, and actual scene-air samples reach 37.53% against the matched
independent probe. This is separate from exact Three/raw port parity and does
not inherit the earlier broad-study 2% result. The report retains this
qualification. No unselected count or distribution search was performed.
These original error numbers do not quantify the latest 20 m pose.

For the original 45 m run, the cache owns 18.212 MiB of resident textures (72.691 MiB peak construction/
verification targets). Final compilation took 10.592 s; field construction and
inspection took 7.643 s. Outward/inward tiled shader wall times were 0.546/0.297 s;
totals including readback, PNG and checks were 1.642/1.319 s. These synchronized
workstation measurements exclude opaque driver memory and do not establish FPS.

## Current Result

The [corrected final report](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00041-m4-report/index.html)
and [summary](../../../../../tmp/experiments/flat-dome-cache-shape/runs/00041-m4-report/summary.md)
contain thirteen quadratic slice counts, full development/held-out comparisons,
three fresh middle-Sun builds per count, measured memory, and real three-method
colors across seven altitudes and three Sun positions. The [execution
record](execution.md) owns decisions, measurements, recovery, and qualifications.
The [plan](plan.md) is complete.

N12 is a provisional balanced study configuration; N6 is the lower-cost
comparison. This is a conditional result for the studied representation,
not a production cache selection or a universal optimum. Angular sampling
contributes to the residual error. Experimental directional resolution differs
substantially from production; measured sizes/times cannot be transferred
directly to production at its current resolution.

Native guides are actual local-height slab/parallel-source/all-orders
libRadtran calculations. They are not a finite-cap J4 oracle. Corrected run
`00038` replaces 189 away-azimuth cases; merged spectra `00039` and the
additional shared-physics proof `00040` support the final report. Preliminary
reports `00035`/`00037` are superseded for native away-view columns and remain
immutable. Missing native precision and historical monitoring gaps are
explicitly reported.

## Verification

Latest render `00054` is accepted. Both views share one completed cache; local
geometry/display/resource checks pass. Maximum transmission discrepancy is
1.69e-6, maximum spectral composition discrepancy 2.36e-9, and display discrepancy
zero code values. Both actual images were inspected. Source types/formatting
pass. The earlier report and sealed runs remain unchanged.

Scene run `00043` matches raw/Three builds exactly on 34 rays, all four orders
and 15 channels. `00044` supplies the pilot pair and final-projection rim crop;
`00045` supplies independent scene-ray probe batches. Initial failed check
`00046` is preserved; `00047` separates ideal-camera direction quantization
from intersection-solver error without widening the original solver bound.
Final run `00050` reproduces both `00048` PNGs and GLSL byte-for-byte and records
zero owned geometries/textures after disposal. `00051` confirms real ground
hits, cap intervals, spectral composition, transmission and display conversion.
Display discrepancy is zero code values. Height/FOV changes preserve cache and
shader identities; vacuum/outside-entry controls pass. The visible cutoff agrees
with the predicted rim; natural framing does not produce a large apparent cliff.
Report `00053` authenticates 1,259 files (86,453,084 bytes), checks both images at
native dimensions in the browser, and records observed progress intervals.

Local scene-source types, Prettier/curly formatting, Git whitespace and current
documentation links pass. Dedicated standards reviewers/audits remain disabled;
no standards-compliance claim is made. Checkpoint-adviser monitoring remains
active; the scoped checkpoint uses `feat(experiments): render flat dome cache scene`.

### Prior slice-study verification

Final `00042-m4-verification` is accepted. It verifies new/transitive immutable
evidence and reuses exact unchanged manifest checks from `00036`. Current
generated shaders match discovery/repeated timing; cached mirror values agree
exactly, cap rotations agree, and optimized reference-batch grouping preserves
the retained observations. The final standalone HTML rendered without errors;
filters and both exposures were exercised, and actual swatches inspected.

Local experiment types, repository Prettier/curly formatting, Python syntax,
Git whitespace, and current documentation links pass. The source root retains
its permanent experiment mapping; no temporary standards configuration needs
restoration. Dedicated standards reviewers/audits remain disabled; no
standards-compliance result is claimed. Checkpoint-adviser monitoring remains
active. Checkpoints `4b7be2d9` and `dd6ced12` preserve earlier coherent units;
the final adviser-recommended local checkpoint contains this completed state.

## Next Action

Review the two renders and the qualified near-rim accuracy result with the owner.
No required implementation work remains in the selected scene plan. Stronger
directional/spatial convergence, other distance distributions, production
integration, and experiment closure remain separate selections.
Production, prior evidence, city data, and unrelated working changes remain
outside this experiment checkpoint. Generated evidence remains under ignored
`tmp/experiments/flat-dome-cache-shape/runs/`; never reopen sealed runs.

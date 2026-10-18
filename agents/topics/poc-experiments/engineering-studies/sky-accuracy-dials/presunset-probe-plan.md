# H65 Independent probe at sunset and ten minutes before

Status: complete through accepted00441 verification and00442 image derivative.
[Results](presunset-probe-results.md) own the final figures, numerical findings,
precision controls and preserved partial-run resumption.

Owner-selected comparison, following H64. Measure our cache-free independent
solver at the exact sunset rays and add ten minutes before sunset for every
method. Production and prior evidence remain unchanged.

## Frozen comparison

| Time | UTC instant | Solar zenith degrees |
| --- | --- | ---: |
| Sunset -10minutes |2024-06-21T03:16:03.503Z|88.2237421377953|
| Sunset |2024-06-21T03:26:03.503Z|89.9579152265|

Use San Jose, observer5m, elevations0.05/3/20degrees and relative azimuth5degrees
for every source. Toronto phase/SSA above440nm, canonical extinction/profiles,
Native15 source, scalar spherical geometry, black ground and no refraction/ozone
match H64. Compute the new instant through the unchanged production observation
owner with a-10minute offset, never by interpolating radiance or solar angle.

Methods: Corrected60, Focused60, our independent cache-free GPU solver and
fully spherical libRadtran with VROOM off. Reuse immutable H64 sunset cache and
external results; new numerical builds are needed only for the pre-sunset cache
and external reference. Newly measure the independent solver at both times.

## Execution

1. Extend existing contained compiler/probe and external runners with explicit
   injected controls. Preserve their default H64 command behavior and scientific
   equations. Snapshot controls, inputs and source identities in new runs.
2. Independent GPU pilot: three bands,2048paths/batch,4batches, all six rays.
   Validate the original Toronto inverse-CDF/phase normalization proofs, hardware
   execution and nonnegative ordered tallies. No production cache/evaluator is
   imported by this kernel.
3. Independent measurement: all15bands,24batches of8192paths per ray; optical
   quadrature128, compensated roulette from order8, separate pure N1-N4 and
   all-order estimate. Paired8-batch quadrature64 control. Target3% luminance and
   10% per-band empirical95% half-width; disclose misses and numerical limits.
   Preserve batch means and common seed identities for cumulative/color intervals.
   Add deterministic binary64 N1 controls with the same independent boundary and
   optical-column mathematics at Gauss64/128, retaining the original phase/SSA.
4. Pre-sunset corrected/focused GPU builds query Q30/Q120 view controls. External
   reference uses four seeds at50000photons/band,256 layers and a512-layer horizon
   control. Reuse H64 sunset main/refined spectra without reopening their runs.
5. Report both times and all rays, physical Y, pure/cumulative order budgets,
   independent N1-N4 versus all-order tail and external residuals. Render matched
   swatches and spectra with uncertainty. Use one common H64 sunset P2 display
   context for all methods/times; no claim of a separately captured pre-sunset
   app exposure or full scene image. No per-solver fitting or white balance.
6. Strict immutable verification, input/library hashes, batch reductions and
   source/material/geometry matching. Local types, self-review, image inspection
   and checkpoint adviser only; no dedicated experiment reviewers.

Owner approved728MiB retained disk for this extension; scratch remains1GiB.
Retain compact selected-ray outputs and compressed bundles, never full fields.
Record shared-tool-owned external case storage separately. GPU work is serial;
CPU libRadtran uses the established tool. Sixty minutes is guidance: continue
monitoring while strong useful progress is being made. Precision misses do not
become silent successes, zero samples do not establish zero physical radiance,
and source changes may occur only between finalized runs.

# H63 Matched Toronto Scene Results

Status: complete under the [registered plan](toronto-scene-plan.md). All six
views and18GPU captures compare fresh Toronto Original15, Corrected60 and
Focused60 caches. All four capture runs and final verification pass strict
immutable/progress checks. Production and all earlier evidence remain unchanged;
no owned GPU/browser job remains active.

Toronto means the registered measured aerosol phase/SSA above440nm with canonical
optics below440nm and unchanged aerosol amount/extinction/profile. Geometry and
times remain San Jose. The canonical deployed startup image is not a Toronto
baseline. All final comparison columns carry explicit labels.

## Final Comparison Images

| Scene | Three cases and amplified grid difference | Source-density spectra |
| --- | --- | --- |
| Noon: toward, side and away |[Comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00421-h63-tor-report/toronto-noon-comparison.png)|[Spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00421-h63-tor-report/toronto-noon-source-spectra.png)|
| Sunset toward Sun |[Comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00421-h63-tor-report/toronto-sunset-comparison.png)|[Spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00421-h63-tor-report/toronto-sunset-source-spectra.png)|
| Sunset +30minutes |[Comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00423-h63-tor-report/toronto-twilight-comparison.png)|[Spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00423-h63-tor-report/toronto-twilight-source-spectra.png)|
| Sunset +60minutes |[Comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00425-h63-tor-report/toronto-twilight60-comparison.png)|[Spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00425-h63-tor-report/toronto-twilight60-source-spectra.png)|

Each sheet shows Toronto Original15, ordinary Corrected60, Sun-focused Focused60
and absolute Focused-minus-Corrected display-code differences amplified8x. The
near-black final column indicates small differences, not a failed scene capture.
Images use identical exposure/display within each comparison, without individual
brightness normalization. All final images and plots were inspected; noon's
recomposed final images are byte-identical to the inspected progress versions.

## Findings And Controls

The large change is from Original15 to the corrected numerical configuration.
Original15 has a much brighter/cyan noon appearance and much stronger localized
bright horizon patches at sunset/twilight. Both corrected versions retain the
broad warm evening glow. Focused60 adds a small visible change in these views;
no new obvious seam, lobe or missing-atmosphere region was observed. This is an
image observation, not owner appearance approval or independent physical truth.

| View | Maximum Focused/Corrected display-code difference | Focused/Corrected horizon-band display Y change | Focused/Original15 horizon-band display Y change |
| --- | ---: | ---: | ---: |
| Noon toward |2|-0.10%|-15.58%|
| Noon side |2|-0.23%|-31.67%|
| Noon away |2|-0.32%|-40.29%|
| Sunset |4|+0.009%|-47.55%|
| Sunset +30minutes |4|+0.97%|-88.48%|
| Sunset +60minutes |5|+2.54%|-88.91%|

The fixed narrow horizon band is y451-458,x20-1003. It can include review-object
occlusion and Original15's localized bright patch. In particular, the large
twilight percentages describe this band, not the whole sky's brightness or a
physical radiance ratio. Display Y uses the sRGB inverse transfer and standard
luminance weights after the fixed production mapping. Ratios are100*(Focused Y /
comparison Y-1); exact band values and all-pixel statistics remain in each report's
`toronto-<scene>-metrics.json`.

Native15/48,F68, source20, N1-4, W27slot count and Q30view stay fixed. Every
configuration uses the exact same registered Toronto phase/SSA material.
Original15 uses15transport intervals with the original scatter rule;
Corrected60 uses60intervals plus discrete Mie phase-mass normalization;
Focused60 additionally uses the k=.35construction/recurrence/final lookup map.
All three caches are rebuilt for each lighting window and reused across the
three noon headings. The actual production renderer, scene objects, receiver
lighting and display remain unchanged.

Noon's horizon-facing cameras do not contain the elevated Sun disc. The
source-direction density plot shows a much stronger grid response near the Sun
than these images. Those plots use the first altitude anchor and cumulative
scattering source density in cache units; they are not integrated pixel spectra.
The Native15 Toronto boundary changes to measured phase/SSA only above440nm;
the resulting spectral transition is not a smooth complete-atmosphere retrieval.

## Runtime And Verification

| View | Original15 GPU ms | Corrected60 GPU ms | Focused60 GPU ms |
| --- | ---: | ---: | ---: |
| Noon toward |42.07|42.07|42.74|
| Noon side |42.22|42.16|42.69|
| Noon away |43.14|42.72|43.56|
| Sunset |43.11|43.07|45.74|
| Sunset +30minutes |41.93|42.35|44.46|
| Sunset +60minutes |42.13|42.41|44.83|

RTX2060,1024x768,12valid warmed GPU timer samples per view. CPU submit times are
separate in the reports; no fallback timing was used. The grid increment ranges
from0.52to2.67ms here, not a universal or2K estimate. Cache build, upload, warmup
and screenshot work lie outside the timed renderer. Accepted paired jobs take
516.97s noon,508.92s sunset,549.16s +30minutes and467.94s +60minutes. These are
whole-job elapsed measurements, not pure GPU compiler benchmarks. Atlas capacity
stays429,981,696bytes per case; this does not qualify production cache memory.

Accepted [00426 verification](../../../../../tmp/experiments/sky-accuracy-dials/runs/00426-h63-tor-verify/verification.json)
checks all18captures, exact H62 observations/location, matched physical and numeric
controls, Toronto material identity, source graph, the three authenticated compiler
transforms, complete source-density spectra, real lookup replay, report derivation,
12finite GPU/CPU samples per view and scratch cleanup. Original15/Corrected60 N1
witnesses are bit-identical in all15channels. Real packed CPU/GPU replay maxima
are3.86e-7noon,2.58e-6sunset,4.925e-6at+30minutes and3.15e-6at+60minutes. All
meet the unchanged5e-6relative limit with1e-12floor. The +30minute replay has
little margin; actual absolute errors remain recorded in each capture result.

The final verifier's own strict seal/progress verification passes. There are no
H63 monitoring qualifications or rejected/failed numerical runs. Required assets
and complete frames are present; the only404 is the recorded/favicon.ico.
Local source types, self-review and diff checks pass. Dedicated experiment
reviewers/audits remain disabled; checkpoint advice is separate.

Final retained evidence746,196,585bytes (711.63MiB), scratch0 and102,762,864,640bytes
free disk. The additional27.12MiB fits the registered32MiBestimate and the existing
720MiBallowance. Owned Chrome/Node/GPU jobs have exited. No production promotion,
new paper RMSE score, full twilight sweep, new libRadtran reference or complete
measured Toronto-atmosphere claim follows from these captures.

## Accepted Run Record

Noon capture00418 and final report00421 are accepted, with all three headings and cases.
The [noon comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00421-h63-tor-report/toronto-noon-comparison.png)
and [source-density spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00421-h63-tor-report/toronto-noon-source-spectra.png)
were inspected. The original/corrected J1 witnesses are bit-identical for all15
channels; identity re-publication is pixel-exact and the old H53 Toronto corrected
image differs in five pixels by at most one code. Focused versus Corrected60 is at
most2codes in each heading; Original15's much brighter/cyan appearance differs
substantially from both. Near-Sun source density changes more strongly than these
horizon-facing images, which do not contain the elevated noon Sun disc.

Sunset capture00420 and report00421 are accepted. The
[sunset comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00421-h63-tor-report/toronto-sunset-comparison.png)
and [spectra](../../../../../tmp/experiments/sky-accuracy-dials/runs/00421-h63-tor-report/toronto-sunset-source-spectra.png)
were inspected. Original15 is much brighter/more saturated; Focused60 versus
Corrected60 differs by at most4display codes. No new appearance acceptance or
independent physical-reference claim follows from these images.

Thirty-minute twilight capture00422 and report00423 are accepted. The
[comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00423-h63-tor-report/toronto-twilight-comparison.png)
and [source-density plot](../../../../../tmp/experiments/sky-accuracy-dials/runs/00423-h63-tor-report/toronto-twilight-source-spectra.png)
were inspected. Corrected versions retain the broad warm glow and reduce the
localized bright horizon patch in Original15. Focused versus Corrected60 differs
by at most4codes. This remains a bounded image observation, not an external
physical-accuracy verdict.

One-hour twilight capture00424 and report00425 are accepted; both final images
were inspected. Final00426 accepts the complete six-view campaign.

## Execution Notes

Progress report00419 remains immutable. Final report00421 additionally records
the historical Toronto H53 parent used by the legacy identity metric; its noon
image and source plot are byte-identical to the inspected progress versions.
This provenance correction did not require a numerical rerun. The original H62
monitoring qualification is unchanged and does not apply to these accepted H63
runs, whose strict progress verification passes throughout the completed campaign.

Every requested numerical run completed once; no GPU retry was needed. Authored
source was held fixed while each capture ran. Between completed runs, the report
parent-list repair added the historical Toronto image identity, and local types
were rerun successfully. Earlier evidence and the prior uncommitted H62 extension
were preserved. Checkpoint monitoring remains separate from these scientific
checks; no dedicated standards reviewer or audit was started.

Checkpoint adviser recommends this as a coherent unit with the prior H62
extension, suggesting "Compare Toronto cache scenes". The UTF-8 source had no
mojibake bytes, but scientific table symbols were converted to ASCII for readers
that default to the Windows legacy encoding. No numerical evidence changed.

## Reproduction

Use the existing Node runtime. Every command allocates a new immutable run; run
the GPU jobs serially and preserve previous outputs:

```text
node experiments/sky-accuracy-dials/outgoing-scene/run.mjs noon toronto
node experiments/sky-accuracy-dials/outgoing-scene/run.mjs sunset toronto
node experiments/sky-accuracy-dials/outgoing-scene/run.mjs twilight toronto
node experiments/sky-accuracy-dials/outgoing-scene/run.mjs twilight60 toronto
node experiments/sky-accuracy-dials/outgoing-scene/report.mjs <capture-root> [<capture-root> ...]
node experiments/sky-accuracy-dials/outgoing-scene/toronto-verify.mjs <noon-capture> <noon-report> <sunset-capture> <sunset-report> <twilight30-capture> <twilight30-report> <twilight60-capture> <twilight60-report>
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```

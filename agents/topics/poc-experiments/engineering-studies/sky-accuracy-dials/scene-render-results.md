# H53 Full Scene: Original15 And Normalized60

Completed on 2026-10-17 under the [scene capture plan](scene-render-plan.md).
The owner selected actual before/after scene renders following the completed
[Toronto component attribution](toronto-order-attribution-results.md).

## Images And Meaning

[Combined comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00345-h53-scene-report/comparison.png):
canonical production atmosphere on top, Toronto optical material below;
original15 on the left, normalized60 on the right. The overview stacks the
two accepted comparison PNGs without resampling or changing their colors.

| Pair | Before, full 1024 x 768 scene | After, full 1024 x 768 scene | Side by side |
| --- | --- | --- | --- |
| Canonical production atmosphere | [Original15](../../../../../tmp/experiments/sky-accuracy-dials/runs/00343-h53-scene-prod/baseline-noon.png) | [Normalized60](../../../../../tmp/experiments/sky-accuracy-dials/runs/00343-h53-scene-prod/candidate-noon.png) | [Comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00343-h53-scene-prod/comparison.png) |
| Toronto phase/SSA intervention | [Original15](../../../../../tmp/experiments/sky-accuracy-dials/runs/00344-h53-scene-tor/baseline-noon.png) | [Normalized60](../../../../../tmp/experiments/sky-accuracy-dials/runs/00344-h53-scene-tor/candidate-noon.png) | [Comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00344-h53-scene-tor/comparison.png) |

In each capture run, `deployed-noon.png` is the startup reference using the
canonical deployed atmosphere. `baseline-noon.png` uses the original compiler
with that run's selected optical material. Those images are identical in
00343. They intentionally differ in 00344 because Toronto optics were applied
only inside the experiment. The Toronto before/after pair is baseline to
candidate; it is not deployed to baseline. Toronto has never been deployed.

The canonical candidate is modestly darker and less blue near the horizon.
The Toronto response is much larger: the strong cyan cast recedes, and the
near-horizon band becomes nearly neutral in display RGB. Neither result
demonstrates that the numerical change should cosmetically whiten production.
These are scene appearances, with physical qualification still owned by the
component/reference results and separate full-cache promotion gates.

## Fixed Scene And Controlled Change

Both pairs use the actual unchanged Flat32 production renderer and shader,
spherical geometry and distant Sun, San Jose solar noon at the registered
2024-06-20T20:08:46.261Z preset, solar zenith 13.890169 degrees, 1024 x 768,
horizontal FOV 60 degrees, camera pitch 5 degrees and heading 180 degrees away
from the Sun. Scene objects, receiver lighting, optical extinction, source,
source-path attenuation integration, view integration and P2 display are fixed
within each pair. The application continues using its existing production
view-ray lookup/integration path; this experiment changes cache construction.

The before cache uses Native48/Native15/F68 and 15 transport intervals. The after
cache uses the same complete physical domains with 60 intervals and discrete
aerosol phase-mass normalization at every higher-order scattering pass. All
15 wavelengths and four orders were built on the RTX 2060. Full scene-atlas
support was extracted and packed through the existing layout. Separate
transient arrays use the original address metadata; deployed assets and
production source remain unchanged. Atlas capacity is unchanged at 429,981,696
bytes in this capture configuration; this is not the on-disk package size or
an application memory qualification.

Toronto remains the registered measured phase/SSA intervention above 440 nm,
with canonical optics below 440 nm, original aerosol amount/extinction and
San Jose geometry. It is not a complete measured Toronto atmosphere.

## Measured Image Response

Measurements use unobstructed pixel columns 880 through 999 and pixel-center
camera elevations. RGB is mean encoded sRGB, rounded here. Display Y applies
the inverse sRGB transfer and D65 luminance coefficients, relative to display
white. It is not atmospheric spectral luminance or a paper RMSE score.

| Atmosphere | Elevation | Before RGB | After RGB | Display Y change |
| --- | --- | --- | --- | --- |
| Canonical | 0.05-1 degrees | 176,189,219 | 166,176,200 | -14.43% |
| Canonical | 1-3 degrees | 187,201,226 | 181,192,211 | -9.91% |
| Canonical | 3-10 degrees | 169,197,230 | 165,192,223 | -6.22% |
| Canonical | 10-25 degrees | 118,156,214 | 114,152,208 | -5.83% |
| Toronto | 0.05-1 degrees | 244,254,253 | 204,207,208 | -36.24% |
| Toronto | 1-3 degrees | 240,254,253 | 210,215,218 | -30.12% |
| Toronto | 3-10 degrees | 213,248,250 | 188,208,226 | -30.40% |
| Toronto | 10-25 degrees | 154,218,236 | 135,169,211 | -39.36% |

The [lossless analysis](../../../../../tmp/experiments/sky-accuracy-dials/runs/00345-h53-scene-report/analysis.json)
owns exact values, counts, differences and timings. Production baseline and
deployed image differ by zero decoded byte components. The Toronto baseline
differs substantially from deployed because the atmosphere differs; the owner
identified this labeling ambiguity during execution and the distinction above
is the canonical interpretation.

## Verification, Performance And Limits

Accepted immutable captures 00343/00344 and derived report 00345 verify with
no source failures or heartbeat failures. Scratch cleanup passes and all owned
browsers/hosts exited. Local type checking passed on the final authored source.
Both paired images and the final overview were inspected. Canonical fresh
compiler/deployed witnesses match exactly, its full scene is pixel-identical,
and both interventions retain bit-identical J1 at all registered witnesses
for all 15 channels. The report verifies camera/observation equality and that
the candidate request changes only its identity and transport count; contained
compiler transformations separately record phase-mass normalization. All
parent evidence remains immutable.

Canonical elapsed capture time was 728.18 seconds (12.14 minutes); Toronto
759.73 seconds (12.66 minutes). These include setup, full-scene extraction,
packing, image capture and derivation checks, rather than pure GPU time or a
controlled production build benchmark. Canonical baseline phase was 320.50
seconds; its following candidate phase, including the intervening screenshot,
was 363.74 seconds. Toronto phases were 360.79 and 348.17 seconds respectively.
Their variation demonstrates why a precise production build-time multiplier
is not established by these captures. No independent transport or libRadtran
campaign was rerun. No paper RMSE, twilight, local-source or production-adoption
qualification is claimed. The experiment remains open with no further campaign
selected automatically.

## Execution Decisions And Recovery

1. Which atmosphere should be shown? Capture both actual canonical production
   and the Toronto intervention, in separate matched pairs. This preserves the
   app question and the atmosphere with the demonstrated component discrepancy.
2. Which view? San Jose noon away from the Sun, matching the diagnostic ray's
   heading. Use the existing scene objects and production display, with no
   fitted exposure, color adjustment or camera changes between panels.
3. How to obtain a real scene? Adapt the earlier full-scene capture pattern
   read-only into this experiment's `distant-horizon/scene-*` sources. Compile
   complete fields, extract every required atlas value, and publish separately
   owned arrays through the existing facade. Preserve source/control hashes.
4. How to verify before? Rebuild the complete baseline, compare registered
   canonical values against the deployed atlas, and compare decoded screenshots.
   Both canonical comparisons are exact. Toronto deliberately has different
   material and therefore is not expected to match deployed.
5. What differs in the candidate? Only transport15 to60 and higher-order Mie
   phase-mass normalization. Retain J1 witnesses and the original source/view
   integration controls. Neither atmosphere nor display is fitted.
6. Why allow more than the initial time guidance? The canonical pair took about
   12 minutes with steady progress. Give Toronto a 30-minute outer allowance
   while monitoring, and release unneeded baseline totals after packing.
   Toronto completed in 12.66 minutes; no timeout or numerical retry occurred.
7. Why did baseline differ from deployed for the owner? The owner was viewing
   Toronto run00344. Explain that its deployed image is the canonical startup
   reference, while its baseline is production calculations with Toronto
   material. Preserve all files and clarify labels in this final owner.
8. How to finish when report allocation failed? No new run had been allocated.
   The second capture's 11,086,416-byte final seal exceeded the allocator's
   2 MiB reserve, bringing retained evidence to 540,116,069 bytes. Amend the
   retained allowance from 512 to544 MiB, record the available 115,277,656,064
   disk bytes, and generate only the small report. No earlier evidence or
   numerical result is changed; this is disk retention, not GPU/system memory.
9. What checks apply? Self-review, final local type checking, image inspection,
   immutable-run verification and checkpoint advice. Dedicated standards
   reviewers/audits stay disabled under experiment policy. Do not claim a
   standards-compliance result.

The checkpoint adviser rates the completed H53 unit `CHECKPOINT_URGENT` and
suggests `Add matched Toronto and canonical scene capture evidence`. The
independent-execution authorization covers this local checkpoint. Git history
owns the resulting commit identity; the final handoff reports it after
verification. No push or deployment is selected. Any later work begins from
these images and the component-attribution owner with an explicitly selected
next task.

# H40: Distant Sun Without Aerosol

Owner-selected continuation of [H39](flat-local-aerosol-results.md). Compare
100% and zero of the same exponential aerosol profile in the authenticated
H16 spherical/parallel-source San Jose solar-noon physical packet. Hold the
molecular atmosphere, source spectrum/direction, observer height, ray endpoints,
color projection and display gain fixed. No production setting changes.

## Registered Method

Use independent N1 transport, matching the scattering order of H39. Removing
aerosol removes both its extinction and its scattering. Retain the 1.2 km
profile height, albedo and phase parameters; they have no effect at zero amount.
Measure 0.05, 0.25, 1, 3, 10 and 20 degrees in the toward/cross/away headings,
using binary64 64/128-node refinement with a 0.2% relative spectral bound and
1% practical luminance threshold. Preserve spectral/species/distance partitions.

Render two actual independent GPU sky images covering elevations 0.05 to 25
degrees and headings 150 to 210 degrees from the Sun. These are angular sky
views, not app screenshots or interpolated swatches. Use 64 view nodes and 32
column nodes, with Float32 spherical height evaluated in a stable local frame.
Check all 18 registered rays and all 15 channels against binary64 with a
0.2% relative bound. Retain image pixels as linear RGB and use the unchanged
production p2 display model at the historical distant-view baseline illuminance.
Exposure stays fixed between images. This isolates physical N1 sensitivity;
it does not predict the all-order production cache or benchmark RMSE.

Write every derivative into a new immutable run. Authenticate prior runs,
material artifacts, CIE data, display implementation and tool/source identities.
Keep a ten-minute monitored job budget, favor GPU image integration, preserve
failed attempts and close browser/server before scratch finalization. No new
free-memory guard and no unit-test suite. Batch required mapped source review
at the completed code/report milestone.

## Outcome

Accepted [run 00288](../../../../../tmp/experiments/sky-accuracy-dials/runs/00288-h40-distant/sealed.json)
shows a similar qualitative response to H39. The
[actual GPU comparison](../../../../../tmp/experiments/sky-accuracy-dials/runs/00288-h40-distant/comparison.svg)
places 100% aerosol on the left and zero on the right. The subdued lowest band
becomes a brighter, warmer, nearly white horizon. These are independently
integrated sky views; they contain no ground or production-cache rendering.

At the 0.05-degree horizon:

| Heading | Baseline luminance, cd/m² | Zero aerosol, cd/m² | Change | Horizon / 3-degree brightness, baseline → zero |
| --- | ---: | ---: | ---: | ---: |
| Toward Sun | 2930.55 | 7292.16 | +148.8% | 0.744 → 1.185 |
| Cross Sun | 2321.15 | 6890.55 | +196.9% | 0.713 → 1.211 |
| Away from Sun | 2187.13 | 7283.11 | +233.0% | 0.695 → 1.240 |

The away horizon changes from 30.5% dimmer than the 3-degree band to 24.0%
brighter. The 3-degree away ray itself brightens by 86.6%; this is a change in
vertical contrast, not just a uniform exposure increase. At 20 degrees,
toward/cross/away changes are −13.6%, −2.3% and +3.8%, respectively.

For comparison, H39's local away horizon brightened by 258.7% at zero aerosol,
and its horizon/3-degree ratio rose from 0.650 to 1.166. The two tests have
exactly matching molecular/aerosol coefficients, source spectrum, scale heights,
albedo and phase g. Their geometry, source placement/type and upper boundary
differ; these are parallel physical sensitivity findings, not an attribution
of their numerical difference solely to source distance.

## Physical Attribution

For the distant away horizon, Rayleigh luminance rises from 1440.52 to 7283.11
cd/m², a gain of 5842.59. Aerosol luminance falls from 746.61 to zero. The net
gain is 5095.98 cd/m². Removing aerosol lets substantially more molecularly
scattered light reach the observer than the aerosol had supplied itself.
Source-path and viewing-path attenuation change together; they were not
separately intervened on.

The share originating within 50 km falls from 94.6% to 48.9%, showing that much
more distant light survives. The away-horizon chromaticity changes from
(0.30170, 0.31619) to (0.32687, 0.34442), consistent with the warmer near-white
appearance in the fixed-display images. This is not evidence that zero aerosol
is the preferable real atmosphere. It supports aerosol loading as a common
physical cause of the dark low horizon at N1, without adding evidence of a
cache defect or establishing the full all-order production response.

Full spectra, species and distance partitions are retained in
[rays.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00288-h40-distant/rays.json);
[summary.json](../../../../../tmp/experiments/sky-accuracy-dials/runs/00288-h40-distant/summary.json)
owns all 36 ray/case measurements. Both raw linear RGB images and display PNGs
are retained; the exposure was not fitted to the result.

## Qualification And Handoff

All binary64 64/128-node controls pass the registered 0.2% bound; the largest
relative spectral refinement difference is below 1.4e-13. All 18 rays and all
15 GPU channels pass independent CPU parity in both cases. The largest GPU
relative spectral residual is 0.000126%, well below 0.2%. Manufactured transport
and CIE controls pass. Parent artifacts and source integrity remain intact.

The accepted seal records 310.569 seconds through cleanup; the complete command
including final evidence verification took 312.774 seconds. GPU compile/render/
readback took 15.173 seconds on the NVIDIA RTX 2060. The binary64 spherical ray
control dominates the remaining time; columns are independently integrated for
each channel. No rerun was performed to obtain timing. Scratch high-water was
11,296,883 bytes and cleanup left zero scratch. Retained scientific artifacts
total 1,712,753 bytes, excluding the seal; lane storage remains below 512 MiB.
The first launch rejected an overlong run suffix before allocation; shortening
the suffix allowed the only allocated attempt. No failed run was overwritten.

Run with `node experiments/sky-accuracy-dials/distant-horizon/aerosol.mjs`.
The local type check and configured formatting check pass. Required source
completion is separate from numerical acceptance: its request, baseline and
final validation live under `.codex-tmp/review-standards/session-h42EtU/`.
One coherent mapped review covers the new runner/kernel/contracts, topic
reporting and relevant unchanged collaborators. No production composition,
cache rebuild, all-order extension or paper-RMSE campaign is selected.

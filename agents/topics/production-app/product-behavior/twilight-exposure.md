# High-altitude twilight exposure

Status: diagnosis complete on 2026-10-23. Owner confirmed Globe / San Jose /
40 km, at 30, 40 and 50 minutes after the app sunset preset. Production code,
cache, optical profile and build remain unchanged by this diagnosis.

The production p2 exposure response causes most of the expanding white region.
Five actual served GPU captures reproduce the issue with a fixed local camera
and compare later native frames with display exposure held at the +30-minute
value. Matched pairs keep the same time, physical state, camera and native
illuminance; only `color.totalHorizontalIlluminance.value` is overridden for
presentation in the owned diagnostic browser, then restored.

| Time after sunset | Native horizontal illumination | Display gain |
| --- | ---: | ---: |
| +30 minutes | 22.0701 lux | 41.80 |
| +40 minutes | 1.90429 lux | 280.63 |
| +50 minutes | 0.00787084 lux | 7632.29 |

The +50-minute display gain is approximately 183 times the +30-minute gain.
At +50, native exposure puts 52.49% of image pixels near white; holding the
+30-minute exposure reduces that to 4.34%. At +40 the respective fractions are
16.73% and 7.06%. Near white means every RGB byte is at least250; this is a
simple display diagnostic, not a radiometric saturation metric. The fixed-exposure
images still contain a bright, partly clipped atmospheric band; the test does
not validate all physical radiance or establish an ideal exposure value.

[Comparison gallery](../../../../.codex-tmp/flat32-twilight-exposure/captures-01/comparison.html)
shows the native +30/+40/+50 frames and the two locked-exposure counterfactuals.
[Analysis](../../../../.codex-tmp/flat32-twilight-exposure/analysis.json)
records image/result identities, the actual production gain evaluation and
paired-state equality checks. The helper scripts, logs, raw facts and source
capture operation are retained under `.codex-tmp/flat32-twilight-exposure/`.
All five frames have zero page/WebGL errors and the expected production p2 model.
The owned verification browser and server are closed. A late progress inspection
found the already-closed browser; it did not invalidate the completed captures.

## Mechanism

`ColorResetSlope078P2ColorDisplayModel` inherits the p9 gain implementation with
p2 curve constants. Its global achromatic pre-tone gain increases as total
receiver-horizontal illumination falls, with adaptation exponent0.78 and a
0.02 lux floor. Gain is applied to the complete composed linear RGB before
Bruneton exponential encoding, `1-exp(-gain*linearRGB*K)`. Increasing gain therefore
moves a wider portion of an existing radiance field toward display white; it
does not demonstrate a physically expanding Sun disc or a growing bloom radius.

The numerical curve yields about460 at1 lux,2444 at0.1 lux and9887 atzero lux.
The growing gain can outweigh the decrease of particular directional radiances.
A positive slope for illuminance-times-gain does not guarantee that each image
pixel darkens monotonically: directional radiance is not proportional to that
single global illuminance measurement.

At40 km, a bright limb and the Sun can remain visible below local horizontal.
The direct-horizontal light calculation clamps the source-center cosine tozero
there, as appropriate for an upward horizontal receiver. Such a measurement
can be a poor proxy for adaptation when the camera sees a bright region below
that plane. This is a likely contributor to the mismatch; this diagnostic does
not isolate a replacement adaptation metric or prove that horizontal projection
is the only cause.

## Disposition

Keep physical cache/spectral calculations unchanged for this issue. Next work
should compare exposure/adaptation and highlight-preserving display responses,
including full-view and directional measures, while preserving independent
stellar visibility and distinguishing the Sun disc from atmospheric path light.
Slower temporal adaptation alone would delay the settled overexposure rather
than remove it. A Sun-disc brightness adjustment alone would leave most of the
broad clipped atmosphere unaffected. No replacement curve is selected or promoted.

The separate [interactive shader performance diagnosis](shader-performance.md)
remains complete with no optimization applied. Its recommended motion-quality
work is still a separate follow-on.

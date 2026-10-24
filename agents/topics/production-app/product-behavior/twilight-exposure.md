# High-altitude twilight exposure

Status: the owner accepted the completed experiment and authorized production
promotion on 2026-10-23. `color-reset-altitude-half-v1` is implemented as the
Flat32 default; actual served qualification is complete in the
[promotion plan](twilight-exposure-promotion-plan.md). The contained experiment
is ended and all sealed evidence is preserved.

## Current display response

The default retains the p2 gain/encoding and supplies it a separate display-only
adaptation value. A smooth height weight is zero through 10 km and reaches its
full correction at 40 km. At low twilight illumination this value restrains the
large exposure increase that previously whitened the limb. The correction fades
back to p2 by 385 lux and preserves the zero-light night anchor. Flat geometry
and elevations through 10 km retain the previous response. Explicit p2/p9
controls remain available; the new default retains float32 scene color.

The raw receiver illuminance, stellar adaptation inputs, source/scene lighting,
physical atmosphere and cache are unchanged. Illustrative No-atmosphere scaling
is applied exactly once before deriving the display value. Both ordinary and
staged compact frames refresh this value from their own facade. The additional
calculation runs on the CPU during binding updates and introduces no GPU pass,
ray sampling, atlas allocation or cache rebuild.

At 40 km the accepted gain changes from about 280.63 to 63.40 at sunset +40
minutes and from 7632.29 to 71.73 at +50. This is an empirical display correction,
not validation of the complete high-altitude radiance field. Twilight stars
remain dimmer and a narrow late bright limb remains. The completed
[experiment results](../../poc-experiments/engineering-studies/twilight-exposure/results.md)
own the 70-case comparison and limitations. Production source documents the
exact [response parameters](../../../../src/algorithm32/implementation/color-reset-altitude-half-v1/README.md).

Ten actual default-app images match the accepted prototype within one byte in
every RGB channel, including 5 m, 25 km, 40 km and compact Flat controls. All 25
live presentation/scale checks pass. Changing elevation from 40 km to 5 m and
back retains the scene, runtime, cache backend, shader and composer. Types,
formatting, 11 focused engine Color specs, 72 basic browser specs, 70 retained
gain cases and app/worker/browser builds pass. There are no page/WebGL errors.
The [production gallery](../../../../.codex-tmp/twilight-exposure-promotion/index.html)
and [qualification report](../../../../.codex-tmp/twilight-exposure-promotion/report.json)
retain matched images, physical/display controls, input identities and derivation.
Standards reviewer calibration is stale; no standards sign-off is claimed.

## Original diagnostic evidence

The original diagnosis below established the p2 failure before promotion. Its
native gain numbers describe the retained p2 control, not the new default.

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

The exposure experiment is closed with altitude-half selected for the separately
authorized production promotion above. Physical cache/spectral calculations stay
unchanged. Slower temporal adaptation alone would delay settled overexposure;
a Sun-disc brightness adjustment alone would leave the broad atmosphere affected.

The separate [interactive shader performance diagnosis](shader-performance.md)
remains complete with no optimization applied. Its recommended motion-quality
work is still a separate follow-on.

# H62 Sun-Focused Cache Scene Results

Status: complete. All five planned views, matched cache/lookup checks, runtime
measurements and immutable verification are complete. Production is unchanged.
The experiment stays open; additional owner-selected scenes may follow.
The [plan](outgoing-scene-plan.md) owns scope and the
[execution record](outgoing-scene-execution.md) owns decisions and recovery history.

## Reviewable Scene Images

- [Three noon headings: toward, side and away](../../../../../tmp/experiments/sky-accuracy-dials/runs/00408-h62-report/noon-comparison.png)
- [Sunset toward the Sun](../../../../../tmp/experiments/sky-accuracy-dials/runs/00408-h62-report/sunset-comparison.png)
- [Thirty minutes after sunset](../../../../../tmp/experiments/sky-accuracy-dials/runs/00408-h62-report/twilight-comparison.png)

Each sheet shows deployed Original15, Corrected60 ordinary W27, Focused60 k=.35,
and absolute Focused-minus-Corrected display differences amplified8x. Individual
1024x768 scene PNGs remain in accepted00401-h62-noon,00406-h62-sunset and
00407-h62-twilight. These are actual scene renders, not reconstructed swatches.
All final sheets and plots were inspected; noon/sunset sheets are byte-identical
to the previously inspected progress sheets.

## What Changed Visually

The grid change is subtle in these witnesses. Against Corrected60, the maximum
change in any8-bit display channel is1code at noon,2codes at sunset and1code at
twilight. The sunset/twilight glow and broad gradients remain visible; no new
obvious lobes, seams, bands or missing-atmosphere regions were observed here.
These are bounded visual observations, not owner approval of the appearance or
proof of all-sky accuracy. Noon's5-degree-pitch cameras do not contain the elevated
Sun disc or its entire forward lobe.

The complete change from deployed production is larger. For the fixed narrow
image band just above the horizon, Focused60's relative display luminance is21.5%
lower at sunset and10.1% lower at twilight than deployed. Relative to Corrected60,
the grid alone raises those values by0.46% and0.093%. Most of that brightness
difference therefore belongs to the earlier transport/phase normalization changes,
not this outgoing warp. Review objects can occlude parts of this fixed image
band; the regions match within each comparison. The full numeric maps remain in
[noon metrics](../../../../../tmp/experiments/sky-accuracy-dials/runs/00408-h62-report/noon-metrics.json),
[sunset metrics](../../../../../tmp/experiments/sky-accuracy-dials/runs/00408-h62-report/sunset-metrics.json)
and [twilight metrics](../../../../../tmp/experiments/sky-accuracy-dials/runs/00408-h62-report/twilight-metrics.json).
Display luminance uses the sRGB inverse transfer and luminance weights after the
fixed production display mapping; it is not pre-display physical sky radiance.

## Lookup And Scientific Controls

All configurations use the app's canonical atmosphere, Native48/Native15,
incoming F68, source20, N1-4, existing ground, Q30 view integration and production
display. Corrected60 and Focused60 both use transport60 and discrete Mie phase-mass
normalization. The latter additionally warps every J construction/recurrence lookup
and each final solar-row tap using the exact H61 mapping. Four row-specific
coordinates are reused across altitude and spectral groups. The coherent atlas
publication carries its mapping scalar. Packet layout and texture-tap count stay
fixed; runtime does no exact-angle N1 tracing.

Accepted00399 validates the actual coordinate/cubic GLSL against independent CPU
warp/stencil/Hermite reconstruction on synthetic packets, including solar endpoints
and seams. Worst relative error1.94e-7 is within5e-6. Accepted00403-h62-noon-probe
adds actual packed595nm values for ten directions; its nonzero channel agrees
within2.84e-7. Compiler/helper hashes match the full noon run. Other planes are
zero in that bounded single-channel probe, not full-spectrum evidence.

Sunset and twilight validate actual packed values in all four planes/all15 native
channels. Worst relative errors are2.16e-6 and4.98e-6, within the registered5e-6
limit with1e-12 denominator floor. Twilight has little relative margin; its focused
plane maxima have absolute errors of order2.2e-14 to5.7e-14 in cache units.
This is floating-point lookup replay, not uncertainty in the atmospheric model.

Identity re-publication is pixel-exact. Against H53's ordinary-grid Corrected60
capture through the unchanged renderer, the new k=1 helper differs in only two
pixels by one red-channel code. No coordinate-induced appearance change is hidden
in the control. Required atlas support, matching scene directions/instants,
finite outputs and unchanged physical controls are checked.

Observer-level cumulative source-density plots supplement the images:
[noon](../../../../../tmp/experiments/sky-accuracy-dials/runs/00408-h62-report/noon-source-spectra.png),
[sunset](../../../../../tmp/experiments/sky-accuracy-dials/runs/00408-h62-report/sunset-source-spectra.png),
[twilight](../../../../../tmp/experiments/sky-accuracy-dials/runs/00408-h62-report/twilight-source-spectra.png).
Plots use altitude index0 and the observer solar coordinate; they are not
integrated pixel spectra or new libRadtran calculations. H61's
separate Direct40 full B1 result remains11.593959; H62 does not rescore paper RMSE.

## Runtime And Build Cost

RTX2060 hardware GPU;1024x768, horizontal FOV60degrees, pitch5degrees. Each primary
measurement has12 valid warmed GPU timer samples. CPU submission times are retained
separately. No query-timeout fallback was needed in the accepted captures.

| View | Deployed GPU ms | Corrected60 GPU ms | Focused60 GPU ms | Grid increment ms |
| --- | ---: | ---: | ---: | ---: |
| Noon toward |42.93|42.42|43.48|1.05|
| Noon side |42.78|42.55|43.66|1.11|
| Noon away |43.78|43.51|43.51|about0|
| Sunset toward |43.95|44.03|46.30|2.27|
| Twilight toward |43.48|43.09|45.40|2.31|

These are per-view medians, not a universal overhead estimate or2K qualification.
Cache build, upload and warmup are outside the measured rendering operation;
initial scene shader compilation was not separately isolated. Accepted paired
capture jobs take518.16s noon,412.39s sunset and475.71s twilight. Summed wavelength
build/extraction times are250.09/148.20s,161.57/149.69s and193.03/191.34s for
ordinary/focused respectively. Their ordering, driver warming and extraction
overhead prevent treating those ratios as pure compiler speedups. Atlas uploads
take1.17-1.79s. Reuse covers the three noon camera headings; different lighting
windows extract different required rows without retaining full native textures.

Atlas capacity is unchanged at429,981,696bytes (410.06MiB) per case. This is not
a new production cache memory qualification. Final retained evidence is
711,878,921bytes (about678.90MiB), below the owner-approved720MiB; scratch is zero
and free disk104,873,959,424bytes. Owned browsers and GPU jobs have exited.

## Verification And Limits

Accepted [00414 verification](../../../../../tmp/experiments/sky-accuracy-dials/runs/00414-h62-verify/verification.json)
checks accepted parents, hashes, controls, capture coverage, lookup replay, times,
source/heartbeat failures and cleanup. Source types, self-review and diff checks
pass; dedicated experiment reviewers/audits remain disabled. Checkpoint advice is
separate from these scientific checks.

Two qualifications remain explicit. Historic report00407-h62-report and capture
00407-h62-twilight share a numeric prefix after concurrent allocation; their full
paths and hashes are distinct and unchanged. A new exclusive allocator lock and
accepted00409-h62-allocation with concurrent children00410/00411 prevent a new
collision. Also, the original capture logs retain one generic404 without URLs.
Accepted00413-h62-network replays startup with URL logging and identifies
/favicon.ico as the only404; required render assets/frame readiness and zero
server/page errors are verified independently. Failed verifier00412 and other
failed attempts remain preserved, with recovery in the execution record.

No production promotion, flat/local qualification, new atmosphere tuning, full
twilight sweep or new external-reference campaign is claimed. Owner assessment
of the darker full-pipeline appearance remains separate from technical completion.
Additional scenes were deferred as requested and have not been started.

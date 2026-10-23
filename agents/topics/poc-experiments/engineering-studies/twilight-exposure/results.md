# Twilight Exposure Results

The best prototype is **altitude-half**: retain the current response in Flat and
through10 km, then smoothly introduce a gentler twilight correction toward40 km.
It reduces the reported high-altitude washout while preserving the tested lower
views, daylight and genuine-night stars. It still dims twilight stars and leaves
a bright atmospheric limb. This is a qualified display prototype, not a physical
calibration or an automatic production promotion. The authorized M1–M4 campaign
is complete; production files, selected response and operational caches are unchanged.

## Review the appearance

- [Final70-case gallery](../../../../../tmp/experiments/twilight-exposure/runs/00011-regressions/comparison.html): native, fixed +30 gain, altitude-half.
- [Per-case CSV](../../../../../tmp/experiments/twilight-exposure/runs/00011-regressions/summary.csv) and [full results](../../../../../tmp/experiments/twilight-exposure/runs/00011-regressions/results.json).
- [Rejected global-curve comparison](../../../../../tmp/experiments/twilight-exposure/runs/00008-regressions/comparison.html).
- [Final verification](../../../../../tmp/experiments/twilight-exposure/runs/00013-verify/verification.json).
- [Complete decisions and recovery log](execution-log.md).

Start with `sj40000-p50`, `sj25000-p50`, `sj25000-p80`, and `sj5-p80` in the
galleries. Those show the original problem, a fresh intermediate-height check,
late twilight and the lower-elevation regression that rejected the global curves.
Images contain actual matched pixels; numeric tables remain selectable text.

## What the evidence establishes

At40 km the physical horizontal-illuminance input falls22.07→1.904→0.00787 lux
from sunset+30→+40→+50, driving native gain41.80→280.63→7632.29. The bright limb is
below the observer's local horizontal; a horizontal receiver value does not
necessarily represent the brightness in that view. Holding exposure fixed changes
the washout dramatically without changing atmospheric transport. Excessive display
gain is therefore sufficient to explain much of the expanding white region.
This does not establish that every underlying atmospheric radiance is correct.

Two global curve lifts initially passed the pilot. The broad sweep rejected them
as universal replacements: they also darken ordinary dusk that was not washed
out. At5 m/+80, the half-lift gain falls from4374.37 to71.59 and the view becomes
almost black. Preserving daytime and a zero-light night endpoint alone was an
insufficient safeguard. The altitude refinement follows this evidence rather than
fitting a single exposure curve indefinitely.

All fractions below use the registered±3-degree geometric horizon band, excluding
the0.6-degree Sun guard. They are not the historical whole-image white fraction.

| Case | Native gain | Altitude-half gain | Native near-white band | Candidate near-white band |
| --- | ---: | ---: | ---: | ---: |
|40 km/+30 |41.80 |30.47 |40.38% |38.92% |
|40 km/+40 |280.63 |63.40 |48.78% |34.28% |
|40 km/+50 |7632.29 |71.73 |99.10% |30.75% |
|40 km/+60 |9327.76 |71.77 |94.77% |21.77% |
|40 km/+70 |9788.47 |73.93 |55.65% |4.56% |
|40 km/+80 |9864.55 |118.48 |36.02% |0% |
|40 km/+100 |9886.68 |1881.70 |17.88% |3.65% |
|40 km/+120 |9887.09 |9887.09 |0% |0% |
|25 km/+50, fresh |2423.69 |121.35 |61.07% |21.90% |
|25 km/+80, fresh |9670.59 |123.14 |27.17% |0% |

At40 km/+50 this is a69% relative reduction in near-white band area. Ground/lower
scene median luminance falls from0.989 to0.0414, versus0.0244 under the registered
fixed-exposure control: the overexposed ground becomes dark rather than turning
the entire image black. Pilot brightness/contrast/chroma guards remain satisfied.
At25 km/+50 the near-white band reduction is64%; that altitude was not used to
choose the refinement's parameters.

## The retained function

Let `G(E)` be the unchanged production p2 gain and `h` the physical observer height.
The candidate feeds that gain a display-control value:

```text
w = smoothstep(10000, 40000, h) in Globe; 0 in Flat
t = smoothstep(88.28045178070643, 385, E)
Edisplay = E + w * 11.031121053719228
                 * (1 - exp(-E / 0.00007870837738151098)) * (1 - t)
candidate gain = G(Edisplay)
```

The lift/activation/taper constants came from the registered M1/M2 controls.
Height bounds came from the highest protected ordinary preset and the target
problem preset. They are empirical display choices. `Edisplay` is not an amended
physical measurement and must never replace the reported physical illuminance.
Daylight above385 lux and exactly zero illuminance retain native response.
The smooth height blend is tested numerically; only25 km is freshly rendered
inside that transition. Other interior heights remain unrendered.

## Coverage, safeguards and limitations

The70 cases include San Jose Globe at5 m,2 km,10 km,40 km; sunset through+60 in
10-minute steps; daytime and genuine night at each height; away/zenith views and
5-degree Sun close-ups; Union Glacier Globe and both locations' Flat0/Flat180
endpoints. Five later-twilight checks and seven fresh25 km cases extend the
original matrix. Each case retains exact UTC, camera, meter, medium and settings.
For example, San Jose/+50 is2024-06-21T04:16:03.503Z. “Sunset” is the app's
surface-reference preset, not elevated-observer sunset.

The fresh25 km cases use a page-only extension of the elevation setter and the
ordinary state/publication/cache path, inside the existing0–40 km envelope.
The app source and cache are unchanged. Native final-view integration is Q30 at
25 km and Q120 at40 km; comparisons within each case use identical settings.
This does not newly validate physical integration accuracy at25 km.

- Lower elevations through10 km and all Flat cases retain the native function;
  replayed images match within the established capture precision.
- All seven daytime and five genuine-night controls pass. Source-only night
  stellar flux/visible-pixel ratios are1.0. No candidate introduces a view meter
  or temporal state; five matched physical-state groups confirm meter invariance
  across the captured views/FOVs. No temporal-adaptation sequence was triggered.
- Twilight stars dim substantially. At25 km/+80, source-only visible sky pixels
  fall52→12 and displayed source flux to3.25% of native. At40 km/+50 zenith,
  they fall132→18. Those are pixels, not counts of distinct stars. Some useful
  stars remain, satisfying the registered all-visible-stars loss guard, but this
  tradeoff is not equivalent to preserving native twilight stellar appearance.
- The +80→+100 return toward night gain produces a narrow brighter limb again
  (0→3.65% band white). The original broad white lower scene does not return in
  these samples. No claim of monotonic brightness for every pixel is made.
- Union Glacier's December “sunset” resolves to polar daylight, coinciding with
  solar noon. It protects daylight behavior, not twilight at a second location.
  Flat/local is a different geometry and is not relabeled as Globe night.
- Some close-up Sun directions are ground-occluded. The camera uses the actual
  direction and never moves the Sun above the limb to manufacture a visible disc.
- There is no photographic exposure ground truth, new libRadtran calculation or
  new Bruneton radiance-RMSE claim. Atmospheric spectra/profile/scattering are fixed.

## Branch dispositions

| Branch | Disposition |
| --- | --- |
| Global half/matched lift | Reject universal use: ordinary dusk becomes too dark. |
| Double lift | Early reject: pilot lower-scene brightness guard. |
| P90/RMS field metering | Early reject: pilot lower-scene brightness guards. |
| Highlight shoulder | Early reject: daylight change and lost band contrast. |
| Altitude-half | Retain as the best prototype, with twilight-star and late-limb limits. |

The fresh25 km refinement did not lose all useful stars or fail daylight/night
anchors, so its early rejection gate did not trigger. No transition bounds were
retuned after seeing the fresh cases. Separate star exposure remains a possible
follow-on if preserving more twilight stars becomes an explicit goal; no such
composition change is claimed or hidden in this result.

## Verification, performance and evidence

Native HDR replay qualifies within one byte per channel. The first screen has18
direct-original-GPU candidate comparisons; final altitude-half has12 comparisons,
including three fresh25 km renders, each within one byte. Eight evidence manifests
and their artifact/parent hashes pass final verification, including the failed
partial capture's reusable qualified payloads. Twelve production source/build/
package parents remain unchanged. Browser profiles and owned server are closed.

Dense checks cover2401 illuminance values at seven heights, with finite positive
gain and monotone illuminance-times-gain. This mathematical property does not
promise a monotone time sequence for a differently oriented radiance field.
Local JavaScript type checking passes. Contained-experiment standards reviewers
and audits are disabled; no standards-compliance result is claimed.

Measured stage wall times: qualified M1 capture143 s; M2 screen6 s; first M3
capture477 s including its recoverable Flat probe failure; recovery379 s; fresh
25 km capture148 s. Replay took50 s for63 cases and46 s for70 cases. These are
runner timings, not total agent time. The failed composer lookup and the earlier
wrong-buffer HDR attempts remain preserved and explicitly identified in the log.

Node response microbenchmark medians were119 ns native and274 ns altitude-half
over five batches of200,000 calls. At1024×576, three interleaved40 km/Q120 shader
render/readback samples had medians141.9 ms native and142.0 ms half-lift. These
include blocking readback and browser work, are not isolated GPU timer queries,
and support no FPS speedup claim.25 km/Q30 medians58.1/51.6 ms are similarly noisy.
The existing expensive transport shader is not optimized by this experiment.

A production adaptation can compute the scalar display-control value once per
changed illumination/height and keep the original display pass. It needs no extra
view-meter pass, image texture or scattering-cache rebuild. This is an integration
description, not code already attached to the app. Verifier peak RSS was145.2 MiB
(verifier only; Chrome capture peak was not measured). Retained experiment evidence,
including failures, totals about1.12 GiB; browser work profiles were removed.
00013 repeats final verification with explicit assertions for every original
pilot guard, the registered twilight-star guard and unchanged ordinary/Flat
response; all pass. No images or physical calculations were rerun.

## Handoff

Local checkpoint51202f0e preserves M1/M2 and the earlier Center on Sun control.
A final local checkpoint records M3/M4 and this report; its hash is reported at
handoff. No push. No required campaign checks remain open.

Before production integration, carry the versioned response and its physical-height/
geometry inputs into existing Color ownership, keep the physical meter separately
observable, retain lower-elevation/Flat behavior, and preserve these regression
fixtures. The next owner choice is whether the remaining bright limb and dimmer
twilight stars are acceptable, or whether a separate presentation study is wanted.

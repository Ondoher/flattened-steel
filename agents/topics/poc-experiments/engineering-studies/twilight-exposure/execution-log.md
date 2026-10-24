# Twilight Exposure Execution Log

## 2026-10-23 ? M1 launch

Owner invoked independent-execution for the reviewed plan. No production promotion
is authorized. Production and all earlier evidence remain read-only.

Decision: capture RGBA32F at the pre-gain encoding boundary in an isolated owned
browser, retaining the original scene-input precision and native material. Reuse
that same linear data for display-only comparisons only after native re-encoding
passes the registered parity gate. Extract transported/filtered stellar and
atmosphere-only layers where needed; do not infer HDR from clipped PNGs.

Decision: use the already built production app and authenticated operational
assets read-only, avoiding an app rebuild or duplicate scattering calculation.
An experiment-owned server and private browser profile are generated under the
new run. The ephemeral profile/cache is removed only from the current unsealed
run after browser.close(); all scientific capture artifacts are retained and hashed.

Implementation: checked-root run allocator, heartbeat and exclusive artifact
writer, production-derived image probe, baseline capture runner and display
re-encoding helpers. Local JavaScript type checking passes before launch.

## M1/M2 evidence and decisions

00000-baseline failed the strict replay comparison (max5 bytes;11.54% of channels
more than one).00001 retained direct-GPU controls but revealed that equal gain
still differed over ground. Inspection found the probe's wrong composer input:
ShaderRuntimePass.needsSwap=false means the actual input is readBuffer, not
writeBuffer. No production change was made.00002 asserts sampler identity and
all five captures pass maximum one-byte replay error; earlier runs are preserved.
This restores the planned efficient HDR route rather than relaxing a gate.

00003-calibrate failed during sandbox Git spawn before measurements. Recovery
sealed only that uncompleted run;00004-calibrate succeeds via the host route.
Run initialization now resolves its read-only Git metadata before allocation.

00005-curve-screen registers parameter values before producing candidate images.
The curve family adds a smooth virtual input lift in the low-light response,
scaled from the measured p30/p50 illuminance gap. A very low activation threshold
retains the zero-input genuine-night anchor; a smooth high-light taper restores
exact native response by385 lux. Half and matched lift pass all pilot guards.
Double lift is too dark at+30. P90/RMS atmosphere-visible meters over-darken the
lower scene; the highlight-only shoulder changes daylight and loses band contrast.

Decision: advance the two successful curve variants to the full registered M3
regressions before adding another mechanism. This is cheaper and more faithful
to the owner request than expanding the rejected metering/shoulder branches now.
No physical spectrum or cache changes are contemplated. Exact all-view and
lower-height behavior remains to be measured.

## M3 launch and checkpoint

Local checkpoint51202f0e preserves the complete repository state through M2,
including the previously verified Center on Sun control. No push.

The sealed registry in00006-matrix defines54 new captures plus4 exact M1 reuses
before held-out scoring: four elevations, sunset-through+60, daylight and genuine
night, away/zenith/5-degree Sun views, and Union Glacier/Flat endpoints. San Jose
timeline headings retain M1's +30 local azimuth. Held-out endpoints reset Sun
azimuth per endpoint; Sun close-ups use the actual direction including occlusion.
The Union Glacier location index was checked against the app's preset owner
before launch. Actual UTC instants are retained from the app in every case.

Only curve-half/curve-match are scored. Three representative scenes additionally
render each candidate three times through the original GPU shader, interleaved
with native response, for strict replay checks and matched timing observations.
Camera-dependent metering and temporal adaptation were rejected in M2, so no new
meter pass or temporal state is introduced. Views/FOV cannot change scalar gain
at a fixed illuminance; matched captures still check this consequence.

00006-matrix stopped after39 qualified captures at the first Flat endpoint: the
probe preferred a runtime composer reference rather than the actual composer
most recently used to render. Its completed case metadata, float payloads and
native/candidate GPU images remain immutable and reusable. The recovery prefers
the render-hook's actual composer and resumes only missing cases in a new run.
The failed run is retained as failed; no execution failure is relabeled accepted.

Adaptive validation registered before further scoring: the curve restores the
large genuine-night anchor below its tiny activation scale. At40 km E is already
0.00155 lux at+60. Prediction: glare could recur between+60 and the+180 night
anchor even if the original pilot passes. Add40 km +70,+80,+100,+120 and a5 m +80
control (five captures, estimated2-4 minutes including setup). Retain both frozen
curves without tuning. This tests the transition directly and stays display-only.

## M3 findings and one bounded refinement

00007-matrix resumes successfully after selecting the actual render-hook composer.
00008-regressions scores63 cases;00009-verify verifies their lineage, anchors and18
direct-GPU candidate checks. Both global curves preserve daytime/genuine night,
but visual inspection shows unacceptable darkening at5 m +60/+80, including lost
visible stars at+80. Reject their universal replacement claim. The gain input
alone does not distinguish the dark ordinary-elevation sky from the bright limb
below the high-altitude observer's horizontal plane.

Registered new mechanism before execution: altitude-half preserves the native
response in Flat and at/below10 km, smoothly blends the gentler half-lift between
10 km and40 km, and retains its measured40 km correction. Bounds come from the
highest tested ordinary preset and the target failing preset, not a parameter
search. Prediction: protect ordinary dusk while correcting high-altitude washout.
Fresh25 km +30/+40/+50/+60/+80, noon and night check the interior independently.
The ordinary app offers no25 km option. An isolated page-only setter extension
uses the same state/publication/physical-cache path at25 km, inside the existing
0–40 km cache range; no production file or asset is changed. Retain actual Q30
integration at25 km, Q120 at40 km, with matched settings within each comparison.

Early rejection: retain the original pilot and anchor guards; reject loss of all
visible twilight stellar pixels when the native source-only control has at least
five visible pixels. Add this explicit measurement to source-separated cases
alongside visual inspection. Report lower-scene losses rather than hiding them.
If the fresh interior fails, stop this altitude parameterization rather than
fitting its boundaries to that failure. Estimate3-5 minutes for seven captures.

## M3/M4 disposition

00010-matrix captures all seven25 km controls in148 s, all within one-byte native
HDR parity.00011-regressions evaluates70 cases. Altitude-half preserves the lower
and Flat functions, reduces25 km/+50 band clipping61.07%→21.90%, and retains the
40 km/+50 reduction99.10%→30.75%. Daylight and genuine-night controls pass. No
source-separated case triggers the all-visible-twilight-stars-loss guard, so the
registered early rejection did not trigger. No height bounds were retuned.

Decision: retain altitude-half as the best prototype, explicitly accepting no
universal appearance claim.25 km/+80 source-only visible pixels fall52→12 and
flux to3.25% of native; a narrow clipped band returns at40 km/+100. These are
material tradeoffs, not hidden passes. New independent star composition was not
triggered by loss of all useful stars and is not claimed implemented.

00012-verify passes eight manifest lineages, unchanged production parents,
12 direct-original-GPU comparisons,70 capture qualifications, anchors and dense
response checks. All browser/server resources are closed. No required checks
remain deferred; unrendered interior heights, a second-location twilight control,
photographic validation and isolated GPU timing remain reported limitations.
The results document owns the final conclusions and measured costs. M1-M4 are
complete. The final local checkpoint records this milestone and its report;
no push or production promotion is authorized.

Final self-review added explicit assertions of the unchanged registered pilot,
twilight-star and ordinary/Flat response guards to the verifier.00013-verify
passes them all in a new immutable record, without rerendering scenes. The earlier
00012 record remains preserved. Final source formatting is LF-only and local
JavaScript type checking passes. Checkpoint adviser recommends this completed
unit with the preapproved message `feat(experiment): complete twilight exposure campaign`.

## Selected images page

Owner requested a page of recommended solution images.00014-selected-images
copies14 native/prototype pairs without changing image bytes and assembles a
recommended-only gallery with comparison/elevation controls. Desktop and mobile
browser checks pass. The first synchronous copy phase delayed the heartbeat;
the generator now reports each image copy. Verification initially waited on
offscreen lazy images; a recorded, page-only eager-loading intervention releases
that wait. The generator now sets eager loading during verification itself.
The page's ordinary lazy loading and every scientific image remain unchanged.
No new physical rendering or production change. Local type checking passes.

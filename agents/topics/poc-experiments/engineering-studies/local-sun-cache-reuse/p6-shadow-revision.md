# P6 Ground-Shadow Revision

Current state, 2026-10-11: the owner liked the delivered v4 film and selected a
revision that makes ground shadows visible as the Sun traverses the sky,
suggesting that walls could move outward. This record owns revision decisions,
progress and results. The [P6 plan](plan.md#p6--reproduce-the-local-sun-full-orbit-film)
owns current acceptance and execution requirements. The [v4 record](p6-execution.md)
preserves its 1080p film, measurements, source identities and review receipt.
Native 4K v5 stills, the ten-second motion excerpt and corrected full preview
00777/00779 are accepted. The v5 recipe and gates were frozen before final
capture. Native recording 00781 and complete qualification 00783 are accepted;
the revised film is delivered for owner creative acceptance. Implementation
completion is determined by the exact source-review receipt below. P7 remains
unselected.

## Delivery

- [Native 4K MP4](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/native.mp4):
  187,274,269 bytes, independently decoded as 90 seconds, 30 fps and 2,700 frames.
- [Compact review MP4](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00783-p6-film-report/review.mp4):
  3,732,672 bytes. Use the native film to assess full-resolution Sun and shadow detail.
- Lossless controls: [opening](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/milestone-0.png),
  [far Sun](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/milestone-300.png),
  [first quarter](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/milestone-825.png),
  [near Sun](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/milestone-1350.png),
  [second quarter](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/milestone-1875.png),
  [return](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/milestone-2400.png)
  and [exact endpoint](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/endpoint90.png).
- [Capture result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/result.json),
  [frozen recipe](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/recipe.json),
  [artifact inventory](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00781-p6-film/manifest.json)
  and [capture resource report](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00780-resource-bound/result.json).
- [Complete decoded qualification](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00783-p6-film-report/result.json)
  and [qualification resource report](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00782-resource-bound/result.json).

All 2,700 native frames and the five shadow controls pass qualification. Every
final milestone and the separate endpoint were visually inspected, with clear
floor shadows and an unobscured Sun. Media acceptance does not substitute for
the conditional implementation-review gate or owner creative acceptance.

## Frozen V5 Recipe And Gates

Retain the 90-second, 30-fps San Jose winter-solstice film and one increasing
physical day. Keep one continuous shot, no overlays, the fixed 16-mile Sun,
current p2/human-vision presentation, figure-eight dolly and 6-12 m camera crane.
Sun-size change must still follow actual finite-source distance.

v4's fixed 18-degree circuit lens places its bottom ray approximately
2.77-23.70 degrees above the horizon. Moving walls outward alone cannot bring
the floor into those rays. The revision therefore widens the lens and places
the Sun higher in the image, then expands the receiving court and landmarks.

Native stills, motion and full-preview inspection support this **frozen v5 recipe**:

| Element | Frozen selection |
| --- | --- |
| Native raster | 3840 by 2160 |
| Native media | 90 seconds, 30 fps, 2,700 frames plus separate exact endpoint; streamed H.264 MP4 at 45 Mbps |
| Scene identity | `circular-meridian-observatory-v5`, seed `3202609` |
| Circuit framing | Fixed 45-degree vertical FOV; Sun NDC y=0.82, about 9% below the top |
| Opening/closing lens | 60 degrees, with smooth transitions into/out of the fixed circuit lens |
| Court | Approximately 430 m radius, retaining the continuous floor and flush brass bands |
| Perimeter | 36 pylons at 420 m radius with interrupted lintels; original absolute heights derived at the previous 258 m radius |
| Four landmark groups | Gateway/colonnade/tower/arches at 360/380/395/370 m; original absolute heights derived at the previous 216/229/238/232 m radii |
| Inner references | Eight selected 30 m gnomons at 180 m for depth and clear cast-shadow references |
| Shadows | One shared 4096-square map; 1,100 m shared extent and focus `[0, 40, 0]` |

Preserving absolute heights while moving the monuments outward gives ring
pylons approximately 56-160 m high and a tower approximately 147 m high. Their
predicted roughly 200 m shadows end around 196-207 m from the court center,
within the intended visible floor. These are planning predictions for this
single candidate. Accepted native stills show clear long shadows on smooth floor
with an unobscured Sun. The accepted full preview preserves clear cast shadows,
distinct landmarks and a clean floor; the final native film passes its frozen
media gates. Owner creative acceptance remains separate.

The candidate predicts approximately 16 near / 7 far geometric Sun pixels at
4K, compared with v4's approximately 21 / 9 at 1080p. The wider view intentionally
exchanges some pixel diameter for readable ground shadows while retaining the
approximately 2.30 physical diameter ratio and visible discs at both extremes.
Frozen native minimum diameters are 14 near / 6 far pixels. The decoded ratio
must remain within 15% relative to the exact geometric ratio, approximately
2.2977. Every decoded frame retains the existing 3-pixel width agreement,
positive-contrast and support gates. The low-resolution preview's 6/2-pixel
diameters are raster quantization observations and do not revise native gates.
No physical radius, source
power or screen-space gain adjustment is selected.

All five matched shadow controls require at least `max(64, 0.1% of ground-region
pixels)` with positive luma difference at least 8 byte levels and mean
affected-pixel contrast at least 10. Exact light configuration restoration and
post-encode control ordering remain mandatory. The previous diagnostic PNG
equality outcome remains informational and retains its mismatch evidence.

## Verification And Completion Authority

The recorded proofs, native stills, motion, full preview and final-media result
satisfy steps 1-4 below. Step 5's source-completion outcome is determined by the
exact receipt in the next section, followed by owner creative acceptance.
The retained verification sequence is:

1. Inspect native-raster near, far and intermediate stills together with the
   opening/closing composition. Require an unobscured Sun, useful receiving
   ground and readable monument shadows. Use the stills to finalize court,
   landmark, lens, framing and shadow-map dimensions.
2. Recheck the complete revised camera/scene ray domain, cache admission and
   actual scene-direction approximation. Prior v4 trajectory and shadow checks
   retain their original scope and do not qualify the enlarged scene.
3. Inspect a moving excerpt and complete inexpensive orbit preview. Ground
   shadows must remain legible through representative circuit phases and move
   coherently with the exact-state Sun. Reject distracting floor seams,
   self-shadow artifacts, shadow clipping or loss of near/far disc readability.
4. Freeze the new recipe and media gates, then capture and independently decode
   all 2,700 native frames plus the separate exact endpoint. Retain the existing
   cadence, continuous-shot, fixed circuit lens, physical-day, source-size ratio,
   publication, resource and cleanup requirements. Qualify new media at its
   actual raster and preserve compact reproduction/derivation information.
5. Validate fresh mapped primary review and independent audit for the revision
   and relevant unchanged collaborators before reporting implementation complete.
   Deliver the revised video and evidence for owner creative acceptance.

## Review And Execution Boundary

The review baseline was captured at `62fd5f66` before revision implementation:
`.codex-tmp/review-standards/session-HOgzfK/baseline.json`. Reviewer context must
be refreshed from the updated current documents before code changes. The prior
v4 receipt is preserved and supplies no new-scope completion authority. Revision
implementation completion requires the exact
[source-review receipt](../../../../../.codex-tmp/review-standards/session-HOgzfK/validation-shadow.json)
to exist and report `CLEAN` for its matching primary-review and independent-audit
request. This conditional requirement anticipates no result; media acceptance
alone cannot close it.

The selected P6 capture used a 4 GiB machine free-memory
reserve, 12 GiB owned-process ceiling, 45-minute final-capture limit and
ten-minute preview/diagnostic jobs. These limits require explicit P6 scope, serialized heavy
execution, existing telemetry and cleanup. JavaScript implementation and
immutable-run boundaries remain in force. New output belongs in new runs under
`tmp/experiments/local-sun-cache-reuse/`; never reopen or alter v4's evidence.

The 4K estimate added about 0.77 GB above the previous approximately 1.38 GB
logical peak, exceeding the ordinary 1.6 GB application bound. The selected
**P6-film-only 2.4 GB logical payload bound** was frozen before preview, with
unchanged cache shapes/payloads and the ordinary application gate preserved.
Actual peak allocation is recorded below. This explicit raster/resource tradeoff keeps logical
payload, sampled process memory and the 12 GiB owned-process ceiling remain
distinct quantities. It makes no physical VRAM claim.

The pre-capture estimates were approximately 18 minutes for final recording
and below five minutes for full qualification. Actual durations below replace
those estimates for this delivered run; the 45-minute and ten-minute guards
were retained.

## Questions And Decisions

1. **Are the inner gnomons part of v5?** Yes. Select all eight 30 m gnomons at
   180 m as sparse depth and cast-shadow references. Source height and material
   policies remain unchanged.
2. **Why did the first 4K still run fail?** Run 00762 failed its diagnostic
   restoration check at film time 45 seconds after toggling `castShadow` off
   and on. Its initial far, quarter and near images show clear long floor
   shadows and an unoccluded Sun. Preserve this failed run; those useful images
   do not turn its failed diagnostic into accepted qualification.
3. **How was the shadow control isolated initially?** The next trial toggled
   the existing Three shadow `intensity` from 1 to 0 to 1 while keeping
   `castShadow` true, preserving shadow-program topology. It retained the exact
   PNG restoration gate and added failure captures. Run 00765 exposed a separate
   pixel-reproducibility issue; the structural correction below supersedes that
   gate while preserving both failed runs.
4. **What did the 00765 restoration failure measure?** At film time 27.5 seconds,
   read-only native-PNG comparison found only 87 of 8,294,400 pixels different,
   by one channel byte, within sky bounds `(11,24)..(3795,1096)`. The ground is
   identical. The small sky-only differences are consistent with quantization
   variation; their precise cause was not established. No floor-shadow change
   was measured by this comparison.
5. **How are diagnostics kept from altering the movie?** For encoded frames,
   all shadow controls now execute only after `await encoder.addFrame` accepts
   the primary frame. Controls retain the frame lease and must restore the
   exact light configuration before the next frame. Thus they cannot change
   already encoded pixels. PNG rerender equality is recorded as informational,
   with mismatches retained; no arbitrary tolerance replaces the old equality
   gate. The source and qualifier contracts carry this ordering and restoration
   requirement.
6. **Why did full-preview qualification reject 00773?** All five shadow-control
   derivation hashes match, but the film-time 10-second `cameraIdentity` differs:
   `CanonicalValueHash` preserves negative zero while JSON serialization drops
   the sign in `cameraDirection[0]`. Restoring that one `-0` reproduces the
   captured hash exactly; the image and physical camera are unaffected. Normalize
   zero trace components before hashing and serialization in the browser, then
   capture and qualify a new preview. Retain the exact qualifier gate; no
   compatibility waiver is selected. Preserve the old capture and failed report.
7. **Why retain the wider lens despite smaller Sun pixels?** Accepted native
   stills and motion keep both Sun extremes readable while showing long ground
   shadows. The 4K 45-degree lens, high Sun placement, expanded court and selected
   gnomons meet the requested composition without altering physical Sun size.
   Freeze the 14/6-pixel native minimums before capture; preserve the existing
   ratio, per-frame width, contrast and support gates.
8. **Does the coarse preview's 6/2-pixel ratio change native acceptance?** No.
   Its low raster quantizes the small disc. The preview qualifies continuous
   composition and motion; complete 4K decoding separately applies the frozen
   native gates and measures the final 18/8-pixel ratio.
9. **What does the remaining restored-PNG mismatch mean?** The final 62.5-second
   control retains 86 differing pixels with maximum one-byte difference.
   The movie frame was already encoded and exact light settings were restored.
   Keep this diagnostic fact informational; it neither changes encoded pixels
   nor requires a new arbitrary equality tolerance.
10. **Does delivery close the experiment?** No. Deliver the qualified film for
    owner creative acceptance. Source completion follows its exact review receipt;
    P7, closure/suspension, promotion, push and publication remain unselected.

## Progress And Results

- Initial CPU proof 00760 is accepted. The final typed-source
  [CPU proof 00763](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00763-p6-film-proof/result.json)
  records 359.9207547 degrees of bearing winding, geometric Sun diameters
  16.18894 near / 7.04568 far pixels and ratio 2.29771. Every circuit bottom ray
  points below the horizon, ranging from -26.5854 to -5.6629 degrees, and all
  59,422 compact-stencil queries are admitted. These geometric/support results
  do not replace rendered shadow or decoded-media acceptance.
- Initial 4K v5 still run 00762 under guard 00761 failed only the diagnostic
  restoration check described above. The guard recorded approximately 5.115 GB
  peak private memory and 14.263 GB minimum machine-free memory; this was not a
  resource failure. The failed run and its initial images remain immutable.
- Still run 00765 under guard 00764 failed the exact PNG restoration check;
  its one-byte sky-only diagnosis and structural correction are recorded above.
  Preserve that run and all mismatch captures.
- [Native 4K still run 00767](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00767-p6-film/result.json)
  under [guard 00766](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00766-resource-bound/result.json)
  is accepted: seven views, five shadow-control pairs and zero Sun occlusion.
  Geometric/GPU disc diameters are approximately 16.1881 near / 7.04577 far
  pixels. Rendered inspection confirms clear long ground shadows and an
  unobscured Sun at near, far, both quarters, opening and return.
- The accepted still run took 116.5 seconds. Peak logical allocation was
  2,144,158,424 bytes, sampled private memory 4,666,683,392 bytes and minimum
  machine-free memory 13,922,672,640 bytes. It reports zero GL errors, one
  atmospheric cache and zero remaining owned resources. Logical and sampled
  memory observations retain their distinct scopes.
- [Native motion run 00769](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00769-p6-film/result.json)
  under guard 00768 and [qualification 00771](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00771-p6-film-report/result.json)
  under guard 00770 are accepted. The excerpt contains ten seconds / 300 4K
  frames, with no duplicate decoded pixel frames, zero timestamp error and
  minimum solar contrast 44.533 byte levels. Capture took about 175 seconds;
  qualification took 31.6 seconds. Peak capture private memory was
  5,036,593,152 bytes and minimum machine-free memory 13,511,438,336 bytes.
- The motion's film-time 45-second shadow control measures 60,063 pixels with
  luma difference at least 8 byte levels, covering 5.431% of the ground region;
  mean affected-pixel difference is 46.899. All controls run after frame encoding
  and restore the exact light configuration. This excerpt does not qualify the
  complete orbit or replace final native-film decoding.
- After successful motion qualification, two stale before-encode comments in
  `types.d.ts` were corrected. These are annotation-only changes; executable
  code is unchanged and the local type check passes again. Preview/final inputs
  retain the final comments without rewriting earlier run identities. The
  annotation update made no executable change.
- Full 90-second, 960-by-540, 6-fps preview 00773 completed under guard 00772
  in 176.673 seconds, with peak private memory 4,377,878,528 bytes and minimum
  machine-free memory 13,782,183,936 bytes. It records zero GL errors, one cache
  and zero remaining owned resources. Its [failed qualification 00775 inventory](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00775-p6-film-report/manifest.json)
  under guard 00774 failed the signed-zero identity check described above; the
  capture is not a qualified full preview. Both runs remain immutable.
- Corrected full [preview 00777](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00777-p6-film/result.json)
  under guard 00776 and [qualification 00779](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00779-p6-film-report/result.json)
  under guard 00778 are accepted. All 540 frames / 90 seconds at 960 by 540 and
  6 fps pass with zero timestamp error and zero duplicate decoded pixel frames.
  Bearing winding is 359.9207547 degrees. Decoded diameters are 6 near / 2 far
  pixels at preview resolution; native 14/6 and ratio gates remain unchanged.
- All five preview shadow pairs pass, with affected-pixel counts
  2,884 / 3,321 / 3,813 / 2,926 / 2,885 and mean affected contrasts
  75.729 / 54.094 / 47.328 / 55.211 / 75.275. Actual opening, far, both quarters,
  near and return frames were inspected. Independent scene inspection confirms
  clear cast shadows, distinct landmarks and no floor artifacts.
- Corrected preview capture took 178.659 seconds, with peak private memory
  4,861,775,872 bytes and minimum machine-free memory 13,873,283,072 bytes.
  Qualification took approximately 10.3 seconds.
- The v5 recipe and gates above were frozen before final native capture 00781
  under guard 00780. Capture is accepted: 2,700 frames at 3840 by 2160, 30 fps,
  90 seconds; the native MP4 contains 187,274,269 bytes. Browser execution took
  1,364,463.2 ms, approximately 22.74 minutes. Peak logical allocation was
  2,144,158,424 bytes; the run reports zero GL errors, one atmospheric cache,
  zero remaining owned resources and no cleanup errors. It prepared 2,792
  frames and created/disposed all 16,479 celestial targets.
- The final capture guard records peak private memory 5,081,497,600 bytes,
  peak working set 1,602,985,984 bytes and minimum machine-free memory
  13,138,890,752 bytes. Rendered final near and both quarter views show clear
  ground shadows and an unobscured Sun. The measured capture exceeds the
  approximately 18-minute estimate and remains within the selected 45-minute
  guard; neither the estimate nor captured stills replace full media decoding.
- Complete native qualification 00783 under guard 00782 is accepted: all
  2,700 frames decode as 90 seconds, 30 fps, 3840 by 2160 AVC, with zero
  timestamp error and zero duplicate pixel frames. Source-bearing winding is
  359.92075472069143 degrees over an exact nominal 360-degree phase circuit.
  The actual seasonal source motion accounts for the small bearing difference.
- Decoded near/far core diameters are 18 / 8 pixels, ratio 2.25 against exact
  geometric ratio 2.2977109559461084, passing the unchanged relative tolerance.
  Minimum measured solar contrast is 44.53316710526411 byte levels. The native
  gates remain those frozen before recording.
- All five final shadow controls pass, with affected-pixel counts
  45,603 / 52,419 / 60,063 / 45,773 / 45,545 and mean affected contrasts
  74.9802 / 54.7787 / 46.8994 / 55.6630 / 74.5839. All controls execute after
  encoding and restore exact light configuration. Only the 62.5-second restored
  diagnostic PNG differs: 86 pixels, maximum one byte, retained informationally.
- Final qualification took 251.4 seconds. Its guard records peak private
  memory 1,572,999,168 bytes, peak working set 1,545,900,032 bytes and minimum
  machine-free memory 15,907,004,416 bytes. The compact review copy contains
  3,732,672 bytes. All final native milestones and the exact endpoint were
  visually inspected successfully. Media is qualified and delivered for owner
  creative acceptance; implementation completion follows the exact review receipt.
- P7, experiment closure/suspension, production promotion, push and publication
  remain unselected.

## Verification, Limits And Handoff

The complete experiment JavaScript type check passed after the signed-zero
correction: `npx --no-install tsc -p experiments/local-sun-cache-reuse/jsconfig.json`.
No executable change followed that check. Scoped documentation formatting and
whitespace checks pass. The required mapped primary review and independent
audit are governed by the exact conditional receipt above, without relabeling
the v4 receipt or any earlier source/evidence identities.

This is an offline cinematic capture, not measured live 30-fps performance or
empirical validation of the flat/local model. Black atmospheric ground, omitted
ozone, the finite view boundary, shared directional scene-shadow approximation
and measured one-second diffuse/adaptation interpolation retain their declared
limits. Sky, physical Sun position/disc and direct illumination remain exact-state
consumers. Quantitative atmospheric error bounds, gray-horizon investigation and
production adoption remain deferred. Prior failed attempts and all v4 media stay
immutable; no completed run is reopened.

The local delivery checkpoint is identified by Git history for this record;
its own hash is not embedded in the committed file. No push or publication is
selected. Resume with the delivered native/review video and this record for
owner creative inspection. P7 requires a separate selection.

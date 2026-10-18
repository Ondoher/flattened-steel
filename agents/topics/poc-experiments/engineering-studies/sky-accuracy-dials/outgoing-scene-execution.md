# H62 Execution Summary

Status: complete. The [results](outgoing-scene-results.md) own findings, images,
measurements and qualifications; the [plan](outgoing-scene-plan.md) owns scope.
Initial source baseline:cc15df4c. Production is unchanged; no job is active.
Additional owner scenes remain unselected.

## Questions And Decisions

1. How to supply the mapping without production edits? Authenticate contained
   bundle substitutions. The cache facade publishes its scalar with the atlas;
   its helper computes four solar-row-specific coordinates once per view sample,
   shared across altitude/spectral taps. Preserve exact H61 placement rather than
   substitute a rotated canonical grid with different nodes.
2. Which comparison isolates the grid? Rebuild normalized60 ordinary and focused
   N1-4 caches; show deployed Original15 separately. Use canonical Native15/48/F68,
   source20, unchanged atmosphere, ground, Q30 and production display. Keep H61's
   Direct40 paper RMSE as separate evidence.
3. Which scenes? San Jose2024-06-20 solar noon at20:08:46.261Z, headings0/90/180;
   sunset2024-06-21T03:26:03.503Z and+30minutes toward the Sun. These are UTC
   instants for the retained San Jose date. All camera/display settings match
   within pairs. Do not add the owner's later scenes before finishing.
4. Can retention fit? Starting681,305,932bytes, scratch zero, free disk
   106,245,005,312bytes. Owner approved720MiB retained, replacing656MiB. Compact
   recipe/control hashes avoid H53's repeated full-domain manifests; actual
   additional retention is about29.2MiB, below the conservative40-60MiB estimate.
5. How to check lookup? Actual scene GLSL versus independent CPU warp/stencil/
   Hermite reconstruction, first synthetic across endpoints/seams, then real
   packed builder values. Use5e-6 relative with1e-12 floor; no tolerance changed.
6. How much real-data coverage? Noon gets a bounded595nm replay with identical
   compiler/helper hashes after its full15-channel captures; sunset/twilight
   check all15 channels/four planes during publication. Zero planes in the
   one-channel noon probe are explicitly not full-spectrum validation.
7. Which timing? Freeze animation, warm five frames and measure12 GPU queries per
   primary view. Bound query availability to1second with a labeled CPU fallback;
   accepted captures use valid GPU results throughout. Keep CPU submit, cache
   build/extraction and upload separate. Do not claim shader compilation was
   independently measured or extrapolate to2K.
8. Which spectra? Retain compact first-altitude-anchor source-density spectra at
   the observer solar coordinate plus display-pixel photometry and sRGB-relative
   display luminance. These are not integrated pixel spectra or physical sky
   luminance before tone mapping. Preserve actual scene PNGs as primary visuals.
9. Where do temporary files belong? Follow the owner's explicit experiment
   output/scratch boundary over the skill's generic `.codex-tmp/` convention. No
   old evidence is deleted; only owned reproducible scratch is cleaned.
10. How to handle concurrent allocation? Report/capture concurrency exposed a
    shared00407 numeric prefix. Preserve both distinct full paths/hashes, serialize
    subsequent orchestration, and add a short exclusive allocator lock. Two real
    concurrent same-name Node workers validate distinct next sequences. Do not
    rename old evidence or claim historical numeric-prefix uniqueness.
11. What caused the404 verification failure? Old console logs omit URLs and each
    has one generic404. Replay startup with URL logging: only/favicon.ico404s.
    Required render-asset hashes, complete frames and zero server/page exceptions
    are checked independently. Record the replay-based classification and original
    metadata limitation; do not silently discard console errors.
12. Does technical completion approve the darker appearance? No. Preserve the
    deployed comparison and report its brightness differences. Owner visual
    acceptance and production promotion remain separate from completed captures.

## Recovery Record

- 00399-h62-proof accepted synthetic lookup replay, worst1.94e-7 relative.
- 00400-h62-noon was agent-interrupted during timing diagnosis. Inspection saw
  production-ready without capture progress, suggesting a stalled query. By
  shutdown the deployed views and first channel's J2 had progressed. Preserve
  this as an interrupted failed attempt, not evidence of a confirmed timer stall
  or broken cache. No complete corrected/focused cache was lost. Added bounded
  waits, explicit flush, foreground flags and capture-start/per-view records.
- 00401-h62-noon accepted all nine primary captures and timings;00403-h62-noon-probe
  accepted real-packet replay, worst2.84e-7 in its populated595nm channel.
- 00402-h62-report preserved a sandbox child-process launch failure;00404-h62-report
  preserved an older-Python junction-API mismatch. Use authorized child launch
  and file-attribute reparse checks.00405-h62-report accepted noon progress images;
  no solver rerun was required to repair reports.
- 00406-h62-sunset accepted all15 channels per rule and actual packet replay;
  00407-h62-report accepted sunset progress images. Concurrent allocation also
  created00407-h62-twilight, with a different full path and no overwrite.
- 00407-h62-twilight accepted all15 channels per rule, captures and lookup checks.
- 00408-h62-report accepted all final sheets, source-density plots and display/
  timing metrics. All final images were inspected; noon/sunset images match their
  previously inspected progress images byte-for-byte.
- 00409-h62-allocation plus00410/00411-h62-lock-child verify the allocator safeguard.
- 00412-h62-verify failed on the generic404 log gate. Investigated instead of
  rerendering:00413-h62-network accepted route replay identifying/favicon.ico.
- 00414-h62-verify accepts fixed controls, hashes, complete scene coverage, matched
  queries, finite measurements, sources/heartbeats and cleanup. Failed runs remain
  unchanged. Historical00407 prefix collision remains explicitly qualified.

## Verification And Cost

Local authored-source types and self-review pass. Dedicated standards reviewers
and audits remain disabled. No test-framework suite was added. Checkpoint advice
is independent of the scientific proof; the completed milestone receives a local
checkpoint under the skill's preapproved message policy, without a push.
Checkpoint adviser returned CHECKPOINT_URGENT for this coherent completed unit,
with message "Capture sun-focused cache scenes"; Git history owns its identifier.

Accepted paired capture wall times:518.16s noon,412.39s sunset,475.71s twilight.
These include setup, builds, extraction, upload, warmup and screenshots; they are
not pure GPU build timings. The results own phase timings and12-sample medians.
Final retained711,878,921bytes, scratch0, free disk104,873,959,424bytes. Spot system
free memory was4.7-4.9GiB during execution, not a continuous memory qualification.
Atlas capacity is429,981,696bytes with unchanged slots. All owned jobs exited.

## Reproduction And Resumption

Use the existing Node runtime and these contained source entry points:

```text
node experiments/sky-accuracy-dials/outgoing-scene/run.mjs proof
node experiments/sky-accuracy-dials/outgoing-scene/run.mjs noon
node experiments/sky-accuracy-dials/outgoing-scene/run.mjs noon-probe
node experiments/sky-accuracy-dials/outgoing-scene/run.mjs sunset
node experiments/sky-accuracy-dials/outgoing-scene/run.mjs twilight
node experiments/sky-accuracy-dials/outgoing-scene/report.mjs <noon-root> <sunset-root> <twilight-root>
node experiments/sky-accuracy-dials/outgoing-scene/allocation-proof.mjs
node experiments/sky-accuracy-dials/outgoing-scene/run.mjs network
node experiments/sky-accuracy-dials/outgoing-scene/verify.mjs <00399-root> <noon-root> <noon-probe-root> <sunset-root> <twilight-root> <report-root> <allocation-root> <network-root>
node node_modules/typescript/bin/tsc -p experiments/sky-accuracy-dials/jsconfig.json
```

Every execution creates a new run; do not reopen saved runs. Allocation-proof
parents deliberately identify the historical collision by full path. No execution
remains to resume. Additional scenes require the owner's next selection; no new
scene or production promotion was started.

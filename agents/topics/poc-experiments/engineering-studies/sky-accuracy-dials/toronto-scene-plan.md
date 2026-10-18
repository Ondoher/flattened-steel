# H63 Matched Toronto Scene Comparisons

Owner-selected execution on2026-10-17. Repeat all H62 scene comparisons with the
existing Toronto AERONET phase/SSA material from immutable00310-h45-toronto-prod.
This retains canonical aerosol amount/extinction, altitude profile, molecular
atmosphere and unsupported wavelengths below440nm. It is not complete measured
Toronto weather. Keep San Jose geometry, times, objects and display.

Status: complete. [Results](toronto-scene-results.md) own all four comparison
sheets, eight inspected final images/plots, measurements and accepted00426 proof.

## Registered Scene Matrix

| Scene | Exact UTC instant | Heading from Sun |
| --- | --- | --- |
| Solar noon |2024-06-20T20:08:46.261Z|0,90,180degrees|
| Sunset |2024-06-21T03:26:03.503Z|0degrees|
| Sunset +30minutes |2024-06-21T03:56:03.503Z|0degrees|
| Sunset +60minutes |2024-06-21T04:26:03.503Z|0degrees|

All six views use1024x768,60degree horizontal FOV,5degree pitch and the fixed
production display. Render three genuinely matched Toronto cases:

1. Original15: original ordinary-grid compiler,15transport intervals.
2. Corrected60: ordinary grid,60intervals and discrete Mie phase-mass normalization.
3. Focused60: the same corrected controls plus H61's k=.35 outgoing map through
   construction/recurrence/final lookup.

Rebuild all15native spectral channels and N1-4 for every case. F68incoming,
Native48altitude, W27slot count, source20 and Q30view remain fixed. Original15
is a fresh Toronto build, never the canonical deployed startup image. Retain
startup package provenance separately. Verify original/corrected N1 witnesses
are bit-identical and actual cache GLSL agrees with packed CPU reconstruction
within5e-6relative with1e-12floor, without changing tolerances.

## Execution And Evidence

- [x] Adapt the existing contained runner and report with explicit Toronto labels.
- [x] Pass local types and self-review before expensive execution.
- [x] Serial hardware-GPU captures, reusing the noon cache across three headings.
- [x] Publish and inspect a three-way/difference sheet and source-density plot
      after each completed lighting window, with fixed exposure.
- [x] Validate immutable hashes, authenticated phase/SSA and compiler transforms,
      all six views, timings, lookup replay, source graph and scratch cleanup.
- [x] Update results and request checkpoint advice; no dedicated reviewers.

Initial Git baseline0ed61466 plus the already completed, uncommitted H62 +60minute
extension. Preserve that work. The coherent implementation unit covers only
the Toronto extension under outgoing-scene and its owning topic documents.
No production change, paper rescore, atmosphere tuning or external solver run.

Starting retained evidence717,759,251bytes (684.51MiB), scratch0 and104.46GBfree.
The existing720MiBallowance leaves35.49MiB. Budget at most32MiBadditional for four
compact capture runs, four progress reports and one verifier, retaining no full
cache textures. Measure costs after each scene; keep the existing2MiBseal reserve,
1GiBscratch,40GiBfree-disk and owner-relaxed system-memory guidance. Stop new
allocation if evidence cannot fit; never delete old runs. Use GPU first, one
heavy job at a time, and keep monitoring beyond60minutes if progress is strong.
Recovery preserves failures and describes any monitoring qualification honestly.

The [results](toronto-scene-results.md) own current progress and final images.

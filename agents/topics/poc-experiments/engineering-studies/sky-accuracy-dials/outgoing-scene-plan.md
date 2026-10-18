# H62 Sun-Focused Cache Scene Renders

Status: complete. The [results](outgoing-scene-results.md) own accepted images,
lookup checks, runtime findings and qualifications; the
[execution summary](outgoing-scene-execution.md) owns decisions and recovery.
The experiment stays open; additional owner scenes follow this completed plan.
Production and earlier evidence remain unchanged.

- [x] Register the initial scenes and adapt the contained harness.
- [x] Pair the builder mapping with the scene lookup.
- [x] Validate synthetic/real lookup replay and identity images.
- [x] Capture three noon views, sunset and twilight on the GPU.
- [x] Assess display changes and warmed runtime cost.
- [x] Preserve final images, immutable proof, cleanup and local source checks.

## Objective And Comparison

Show how the qualified [H61 outgoing grid](outgoing-focus-results.md) appears
in actual scene rendering, measure its lookup cost, and check that the production
twilight appearance is preserved. This is a contained rendering qualification,
not production integration or another angular-parameter search.

Keep three configurations explicitly distinct:

- Deployed: current production cache and lookup, captured as the visual reference.
- Corrected60: ordinary W27, transport60 and discrete aerosol phase-mass
  normalization, with all four scattering orders rebuilt.
- Focused60: the same corrected controls with the H61 k=.35 outgoing warp,
  applied throughout construction and lookup, with all four orders rebuilt.

The primary pair is Corrected60 versus Focused60, isolating the outgoing grid.
Also show Deployed versus Focused60 so the complete proposed change is visible.
Use the canonical app atmosphere, Native48 altitude layout, Native15 spectral
configuration, F68 incoming, existing source integration, ground, view integration
and production display mapping. Record exact identities instead of assuming the
paper Direct40 configuration is the deployed configuration. H61's full B1 score
remains separate evidence; these app renders do not repeat that qualification.

## S1 Register Scenes And Reuse The Capture Harness

Adapt the contained [H53 scene harness](scene-render-results.md), retaining its
hardware-GPU builds, actual Flat32 scene renderer, separately owned cache atlas,
asset provenance and browser cleanup. Production source is a read-only bundling
input. Keep new source below experiments/sky-accuracy-dials and all generated
output below tmp/experiments/sky-accuracy-dials, in newly allocated runs.

Freeze the initial scene manifest before numerical work:

| Scene | Time | Camera heading relative to Sun |
| --- | --- | --- |
| Noon toward | San Jose solar noon | 0 degrees |
| Noon side | Same instant | 90 degrees |
| Noon away | Same instant | 180 degrees |
| Sunset toward | San Jose sunset | 0 degrees |
| Twilight toward | 30 minutes after that sunset | 0 degrees |

Use H53's date, 2024-06-20, and exact noon instant
2024-06-20T20:08:46.261Z. Derive sunset from the existing app time/placement
machinery, freeze its exact instant and solar zenith, and derive twilight from
that frozen instant. Reuse H53's 1024x768 viewport, 60-degree horizontal FOV and
5-degree camera pitch. Record the actual camera vector, location, altitude,
Sun placement, exposure, display configuration and scene objects for each view.
Keep every such setting identical across a comparison. Additional owner scenes
are deferred until this plan finishes; do not expand the initial scene matrix.

## S2 Let The Cache Own Its Angular Lookup

Derive a versioned experimental mapping descriptor and matching shader helper
from the builder's controls: receiver-local W27 topology, k, solar-row convention
and orientation. Use the exact H61 forward warp and inverse, rather than replacing
it with a rotated canonical node set whose placement has not been qualified.

Apply the forward map at every stored J construction node and the inverse in
every recurrence J lookup. In final rendering, transform the physical outgoing
direction separately for each solar-row tap before cubic solar interpolation.
Reuse those coordinates across altitude taps and spectral groups where valid.
Do not reuse a single row's coordinate for all four solar taps.

Keep packet layout, slot count, spectral packing, interpolation policy and texture
tap count fixed. No outgoing Jacobian weights apply; incoming integration remains
F68. The shader still samples the cache at each view sample. This plan does not
introduce exact-angle N1 tracing or any runtime scattering-cache construction.
Select the matching helper and atlas together so a warped atlas cannot be sampled
through the ordinary lookup. Contained bundle substitutions must be authenticated
and recorded; they do not edit production files or deployed assets.

## S3 Prove The Builder/Renderer Agreement

Before accepting candidate images:

1. Exercise k=1 through the new builder/helper path and compare it with ordinary
   Corrected60. Verify node, inverse, seam and solar-row identities, including
   first/last supported rows and directions near the Sun and in the background.
2. Compare actual scene shader cache samples against the experiment's numerical
   reconstruction for the same coordinates, rows and channels. Start with the
   H61 5e-6 relative replay tolerance and 1e-12 denominator floor; report absolute
   errors and investigate any miss before interpreting visual differences.
3. Capture identity/control images, report pixel differences and attribute any
   differences beyond display rounding. Verify finite output, complete required
   atlas support, matching uniforms, successful shader compilation and no browser
   or GPU errors. Never present missing or fallback atmosphere as a valid render.

Use focused self-verifying proof runners, not an experimental unit-test suite.

## S4 Build Once Per Configuration And Capture Progress

Use the hardware GPU, one heavy job at a time. Reuse a built cache across camera
headings and times when its retained atlas support covers the required rows.
Determine the union of required blocks before extraction; add builds only when
necessary support differs. Do not retain full cache textures merely to preserve
screenshots. Keep reproducible transient data in owned scratch and dispose of
superseded browser/GPU resources before further heavy work.

Publish the first validated noon pair as soon as available, then the three-view
noon sheet, then sunset/twilight sheets. Keep exposure fixed across each pair;
do not normalize individual images to make them resemble one another. Alongside
each pair provide a clearly labeled amplified difference image and representative
near-Sun, horizon and background sample spectra/photometry.

All display images must be real scene captures. Any swatches or diagrams are
supplementary and must identify their derivation. Include deployed reference
images with clear labels, rather than calling Corrected60 production.

## S5 Assess Appearance, Twilight And Runtime Cost

Record per-view luminance/color differences and spectral differences at registered
samples. Inspect continuity at cube seams and across the horizon, solar alignment,
near-Sun structure, background loss, dusk transitions and unexpected lobes or bands.
Changes in color are observations, not evidence that the old appearance was wrong.

Measure warmed rendering cost at the same viewport and camera with fixed scene
state. Prefer GPU timer queries when available and valid; otherwise label frame
timings as CPU/presentation measurements. Separate shader compilation, cache build,
upload and steady rendering. Record GPU identity, timing sample count/distribution,
texture capacity and transient proof overhead. Do not infer zero runtime cost from
unchanged texture taps or unchanged cache size.

Compare sunset and twilight against Deployed as well as Corrected60. Record
spectral/brightness changes and any visible loss of production twilight behavior;
owner visual acceptance remains necessary for an appearance claim. Do not adjust
the atmosphere, exposure or warp to conceal a regression. If preservation fails,
report the failing scene and likely component and retain the images for follow-up.

## S6 Handoff And Bounds

Write outgoing-scene-results.md and an execution record with scene manifest,
parent identities, builder/helper versions, controls, checks, timings, image links,
actual failures/recoveries and remaining limits. Validate immutable runs, derivation
chains, cleanup and authored-source types; inspect every final comparison image.
Dedicated reviewers/audits remain disabled; keep checkpoint advice separate.

The owner approved720MiB retained evidence for H62; other bounds remain1GiB scratch and at least
40GiB free disk. H61 ended at649.65MiB retained, so measure headroom and estimate
image/bundle/manifest retention before expensive work. Prefer compact single-copy
artifacts and derived contact sheets. If the complete planned evidence cannot fit,
prepare a concrete bounded retention amendment before allocation; do not silently
raise the allowance or remove earlier evidence. System-memory operation guidance
remains the owner's relaxed4GiB floor, separate from cache-size qualification.

Use60minutes as guidance, continuing while monitored progress is strong. Report
channel/build/capture progress and meaningful updates at least every60seconds.
Recover from understood transient failures while preserving failed runs; avoid
repeating unchanged failing work. No production promotion, flat/local adaptation,
new libRadtran campaign or additional owner scene campaign is included.

Completion means validated initial scene comparisons, disclosed runtime/twilight
findings and a reviewable report. Then collect the owner's additional scenes.
Planning approval alone does not start builds or captures.

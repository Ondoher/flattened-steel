# Flat32 zero-aerosol atmosphere

Historical zero-aerosol deployment and rollback evidence. H2400 followed it; the
current selection is the [restored original Bruneton atmosphere](bruneton-atmosphere.md).

The owner selected the Bruneton atmosphere with 0% aerosol on 2026-10-22.
This is an application atmosphere choice, not an atmospheric-algorithm correction
or a claim that the previous cache was physically wrong. The molecular atmosphere,
solar spectrum, density scale heights, phase parameters, ground boundary, numerical
accuracy and display response retain their current owners and values.

## Preserved preceding selection

The rebuilt globe package uses `mieAngstromBeta=0`, anchored
radial geometry, monotone-cubic solar interpolation and `corrected60-sun035`.
It retains Native48 positions, Native15 wavelengths and cumulative N4, with all
109 scene reconstructions verified before publication. The preceding local default was
`0d7d357bd477c8b1ded2182c606433e58162dc275a793630c65066aeadd54e36`, with
coverage through 2 km at both edges of every solar bin. It contains 717772319
bytes and took 589080 ms (9.82 minutes) to build, compress and verify. Its report
is 3268 bytes, SHA-256
`13bffe23ea93396626f5b95a8adbae375ea8f074b5d715865a729e638c6305d2`.
All previous spectral values are bit-identical. The
[elevated-horizon coverage correction](elevated-horizon-cache-coverage.md) owns
the diagnosis and exact-value comparison. [Activation and rollback](../../../../.codex-tmp/flat32-elevated-cache/activation.json)
and [live server identity](../../../../.codex-tmp/flat32-sky-scene-controls/elevated-live-selection-01.json)
confirm local selection. All seven matched sunset, elevation, zoom, resize and
DPR captures pass with no black strip or non-finite spectral output. Elevation
changes retain the installed cache and scene. All eight server tests pass.

The preceding zero-aerosol package
`e5a748ca6bb90125d7781ccbf33d9d43ba6bd769e6a288b4ecc6cd8386184f8e`
remains intact for comparison: 714079361 bytes, built in 791968 ms (13.20 minutes).
Its original build and atmosphere-composition comparisons remain under
`.codex-tmp/flat32-zero-aerosol/`; those do not qualify elevated sunset coverage.

Both app modes selected the same zero aerosol amount for cache construction and
live atmospheric transport. Removing the aerosol amount removes its scattering
and absorption together. Canonical library defaults remain the original paper
values; the compact local selector accepts an explicitly supplied medium.
The previous full-aerosol package remains intact for rollback. The rebuilt app
and Worker are available locally. All 13 compiler tests, 12 focused scene-control
browser checks and eight server tests pass; Flat32, engine, shared-generation and
shared-runtime type checks pass. Standards reviewer readiness remains blocked by
stale global calibration; no standards-compliance result is claimed.
[Original atmosphere activation evidence](../../../../.codex-tmp/flat32-zero-aerosol/activation.json)
retains the first zero-aerosol package report, publication command and before/after
selection hashes. The current activation above owns the later coverage correction.
Rolling back the coverage correction alone restores
`.codex-tmp/flat32-elevated-cache/rollback-selection.js`; this reintroduces the
elevated-sunset coverage defect but does not change the medium. Returning to the
full-aerosol atmosphere requires restoring both its package selection and the app
medium's `mieAngstromBeta=0.04`, then rebuilding; the cache and live medium must agree.

## Actual scene comparison

Matched GPU views use San Jose at 2024-06-21 20:00 UTC, identical camera direction,
1000 by 650 pixels, the existing P2 display response, and Full atmosphere. Left
is the retained full-aerosol corrected cache; right is zero aerosols. The same
physical atmosphere is used for each cache and its live view transport. These
captures do not apply the separate diagnostic flat-ground cutoff override.

- Globe: [5 m](../../../../.codex-tmp/flat32-zero-aerosol/scenes-02/spherical-distant-5-comparison.png),
  [100 m](../../../../.codex-tmp/flat32-zero-aerosol/scenes-02/spherical-distant-100-comparison.png),
  [500 m](../../../../.codex-tmp/flat32-zero-aerosol/scenes-02/spherical-distant-500-comparison.png),
  [2 km](../../../../.codex-tmp/flat32-zero-aerosol/scenes-02/spherical-distant-2000-comparison.png).

At 500 m and 2 km the zero-aerosol globe has a visibly whiter, more distinct
horizon. Removing aerosols also makes the ground mesh's coarse silhouette more
visible; sharpness alone does not establish numerical or physical accuracy.
All 16 matched Full-atmosphere views across both geometries and all four heights
pass with zero WebGL and runtime rendering errors. The actual app medium
reports zero aerosol extinction at every spectral channel in the new views.
The zero-aerosol local cache identity differs from the full-aerosol identity and
remains unchanged across all elevation updates.

- Flat/local: [5 m](../../../../.codex-tmp/flat32-zero-aerosol/scenes-02/flat-local-5-comparison.png),
  [100 m](../../../../.codex-tmp/flat32-zero-aerosol/scenes-02/flat-local-100-comparison.png),
  [500 m](../../../../.codex-tmp/flat32-zero-aerosol/scenes-02/flat-local-500-comparison.png),
  [2 km](../../../../.codex-tmp/flat32-zero-aerosol/scenes-02/flat-local-2000-comparison.png).
- [Complete scene observations](../../../../.codex-tmp/flat32-zero-aerosol/scenes-02/result.json)
  retain the matched controls, actual physical heights, media and package identity.
- [Final verification](../../../../.codex-tmp/flat32-zero-aerosol/verification.json)
  authenticates the captures and replays the current compiler's serialized request
  exactly against the generated cache inputs.

The first image attempt began while the app rebuild had temporarily removed its
Worker file; it produced bundles but no scene captures. Its log and partial run
remain intact, and the second run uses the completed rebuilt Worker. No cache
recomputation or source-evidence modification was needed.

Rebuild command:

```text
node scripts/algorithm32/solar-zenith-cache/generate-shared-cache.js --numerical-policy anchored-radial --solar-interpolation monotone-cubic --scattering-accuracy corrected60-sun035 --mie-angstrom-beta 0
```

The owner observes a clear geometric horizon at 2 km with the atmosphere disabled,
and a sharper globe horizon at 100 m than at 500 m. These observations locate the
visible obscuring in the atmospheric render path; they do not independently
validate its amount. The separate flat ground depth-cutoff defect remains tracked
in [controls execution](sky-scene-controls-execution.md).

The scientific precedent is [H40](../../poc-experiments/engineering-studies/sky-accuracy-dials/distant-aerosol-results.md)
and the [matched libRadtran follow-up](../../poc-experiments/engineering-studies/sky-accuracy-dials/libradtran-horizon-results.md).
Those historical runs and both suspended experiments remain unchanged.

The later [ground precision correction](sky-scene-controls-execution.md#current-state)
fixes the independent pixel-dependent attenuation defect without rebuilding this
cache. The comparisons above remain the original zero-aerosol selection evidence
and predate that rendering correction.

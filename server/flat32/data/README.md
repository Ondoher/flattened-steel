# Flat32 Distant-Sun Cache Data

This directory owns the extracted runtime data served by
`DistantSunSceneCachePackageService`. Large generated packages are ignored by
Git; this README is the tracked contract for their location and provenance.

It also owns the local-only Color Reset P5 stellar package at
`brightest-2000-stellar-package-v1/`. Run
`npm run materialize:algorithm32:brightest-2000-stars` once from an unchanged
copy of accepted CR6B run `000047`, CR6F run `000055`, and CR6G run `000057`;
then run `npm run verify:algorithm32:brightest-2000-stars`. The package retains
the exact double-precision roster and Native15 packets plus the accepted
`2000x1 RGBA32F` member and `2000x15 R32F` spectrum payloads. It is ignored and
must not enter a public repository or release package until the source and
redistribution gaps named by the production Color Reset design close.

The local-only P7 human-vision package lives at
`human-vision-filter-package-v1/`. Run
`npm run materialize:algorithm32:human-vision-filters` from the retained CIE
scotopic sensitivity payload, then run
`npm run verify:algorithm32:human-vision-filters`. The package contains the
15 Native15 scotopic integration weights used by the optional mesopic filter.
It is authenticated by the browser loader, remains ignored, and must not enter
a public repository or release package until the CIE source and redistribution
rows in the
[project-wide research register](../../../references/followup.md#missing-third-party-sources-or-canonical-registrations)
close.

The qualified local package root is:

```text
server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1/
```

It contains 109 one-degree packages, the accepted package report, and the
content-addressed runtime catalog. `FLAT32_DISTANT_SUN_CACHE_ROOT` may still
select a deployed package root without changing application code.

## Retained Offline Builder

The canonical inventory builder and its complete production-owned compiler
implementation remain under:

```text
scripts/algorithm32/solar-zenith-cache/
```

The primary entry point is
`build-one-degree-scene-cache-inventory.js`. It uses
`DistantSunSceneCacheOfflineCompiler.js`,
`DistantSunSceneCacheGpuCompiler.js`, and
`DistantSunSceneCacheCompilerInputs.js`. The resulting inventory is checked by
`verify-one-degree-scene-cache-inventory.js`, and
`assemble-bin-covered-runtime-packages.js` produces the bin-covered runtime
package set. Construction and assembly remain offline operations under
`tmp/extraterrestrial`; only an accepted immutable runtime derivative is
promoted here.

The current package set is also preserved in the local pre-color-reset archive
as `extraterrestrial-production-adoption-runtime-active-output-2026-08-31.zip`.

# Flat32 Distant-Sun Cache Data

This directory owns the extracted runtime data served by
`DistantSunSceneCachePackageService`. Large generated packages are ignored by
Git; this README is the tracked contract for their location and provenance.

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

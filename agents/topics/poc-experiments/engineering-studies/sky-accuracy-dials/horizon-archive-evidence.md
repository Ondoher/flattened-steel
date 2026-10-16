# Recovered Historical Horizon Evidence

## H33 Metadata Authentication

Further read-only inspection authenticated these selected JSON entries against
the same external run-output ZIP manifest (whole-ZIP hashing is still unperformed):

| Entry below `tmp/extraterrestrial/runs/` | SHA256 |
| --- | --- |
| `000466-bruneton-source-luminance-lift-spherical-comparison/browser/config.json` | `fd7d6772644ea810a7c331e92e85e53495cdf7ea9e252df8ee9eb466a21d54d7` |
| `000466-bruneton-source-luminance-lift-spherical-comparison/evidence/spherical-comparison.json` | `9d4849fd99269b5bfc7394f38281730bbf9a40f83298ca3b6f0c9e4ffca4ac1a` |
| `000520-point-local-scene-cache-p3-compiler/cache/solar-noon-cache-manifest.json` | `25df17973edf6c96943e3efd73b58380963c456ef502564810570fc30993e5ad` |
| `000520-point-local-scene-cache-p3-compiler/evidence/source-identities.json` | `3421da1adbe0611c86becb506b169bfa79fd30dd9f05833457f40a535e54f8c3` |

The original 000466 white-horizon Bruneton control used San Jose at
`2024-06-20T20:08:00.000Z`, camera azimuth -59.99625193137896 degrees,
elevation 5 degrees, and 640 x 400 output. Its recorded direct source gamma is 1.
The 000524 gray-band image also records source-luminance-lift gamma 1, weakening
that scalar gamma as an explanation of their noon difference. This does not
prove equality of all projection, exposure and framebuffer operations.

The old control's 15 source irradiances match the current 00264 physical packet
element for element. The newer 000520 cache manifest uses the same archived noon
instant/source direction and an observer at 1.7 m. Current synthetic references
use 5 m and the resolved noon at approximately 20:08:46; they are distinct witnesses.
The archived cache states Native48/Z180/F68/W39/N4, 15 construction intervals,
linear solar-zenith interpolation, and explicitly **ozone enabled**. H33's
two-species continuous reference has no ozone term. This is a compatibility
question, not evidence that ozone changed during the migration or caused the
appearance change. The manifest alone does not supply all per-channel material
coefficients or authenticate the earlier cache's complete numerical contract.

The source-identities entry points to the then-current `CanonicalAtmosphere.js`
with SHA256 `899fc32e85c379273b3e18985501449f17b610ca262780e3bd23cc190d4e7e05`.
Its bytes have not been recovered in this package. Before a historical matched
spectral comparison, authenticate both historical atmosphere implementations,
observer state, ground and transport policies. Do not claim the screenshots form
a one-factor cache comparison from their metadata alone.

## Discovery And Source Boundary

On 2026-10-15, after H28-H32 closed its local-data comparisons, the owner
identified **`D:\flattened-steel`** as an external archive location. Read it
without modification. Earlier evidence that the working repository's archive
directory and former output root were empty remains correct; it did not cover
this external location. Original run 00271 and all historical records remain
immutable. This document owns the newly discovered availability, not a new
controlled transport result or reopened historical run.

The relevant archive set is:

```text
D:\flattened-steel\archives\extraterrestrial-pre-color-reset-20260831\
  archive-set-index.json
  extraterrestrial-run-output-000001-000585-2026-08-31.zip
  extraterrestrial-run-output-000001-000585-2026-08-31.zip.manifest.json
```

The index identifies source commit
`cd9d8a44044ef5f09a4163b22a98e3de55f88d4c` and the original repository-relative
restoration paths. The ZIP contains the manifest's `tmp/extraterrestrial/runs/`
entries directly. Selected entries can be read in memory without restoring the
whole archive or changing the current production checkout.

## Verified Selected Entries

Three original PNGs were read directly from the ZIP, checked for exact manifest
byte length and SHA-256, and visually inspected without extraction:

| Run / entry below its run root | Observation | SHA-256 |
| --- | --- | --- |
| `000466-bruneton-source-luminance-lift-spherical-comparison/captures/bruneton-solar-noon.png` | Earlier bright whitish gradient toward the horizon. | `0c47901abe2b06c020b2300548f01d17478960765314b52ee07521cb21a870bb` |
| `000524-point-local-scene-cache-p5-renders/captures/solar-noon.png` | Later gray/brown immediate-horizon strip. | `d8328ec44a7651d792057ed5475a6447ada92508b84fdcd3a874738730b54261` |
| `000529-point-local-scene-cache-p6-view-quadrature/captures/quadratic-30.png` | Dark strip substantially corrected; horizon remains bluer than the earlier image. | `2a626ec4a0a8bfa7f0d0d40c9226d02b334dff43bf3d22b656d6d70f8b5fa5b3` |

Five JSON entries also pass their manifest byte/hash checks:

- 000524 `evidence/visual-comparison.json` and `evidence/proof.json`.
- 000529 `evidence/view-quadrature-analysis.json`.
- 000558 `evidence/fair-native15-comparison.json`.
- 000559 `evidence/figure-set.json`.

The 000524 proof records solar-noon rendering with the complete point-local
cache, 15 view intervals, retained source-luminance-lift display and gamma one.
The 000529 analysis identifies the unchanged run-000520 cache and an intervention
limited to view interval placement/count. These source records replace reliance
on topic summaries alone for that historical view-sampling result.

This verifies selected entry contents against the available manifest. The entire
3.3 GB ZIP has not been newly streamed to verify its archive-level hash, and other
entries have not been authenticated by this inspection. The observed manifest
SHA-256 is `f30774278ced4668bafd33671ad013a44f8617386690855911292781cc181e67`.

## Additional Inputs Located, Not Yet Qualified

The run manifest lists the 338,392,080-byte point-local solar-noon N4 field:

```text
tmp/extraterrestrial/runs/000520-point-local-scene-cache-p3-compiler/
  cache/solar-noon-native15-c4-w39.f32
  cache/solar-noon-cache-manifest.json
  cache/solar-noon-packed-row-ledger.json
```

The verified 000558 comparison points to run 000556's `browser/dom.html`
(2,374,478 bytes) as its previous-model GPU output. Its stated scope is 34
completed benchmark cache outputs. It is a lead for historical data recovery,
not yet an authenticated old San Jose solar-noon N4 field. The 000558/000559
spectral tables and figures are benchmark comparisons with their original
atmosphere/ground/observation identities, not immediate-horizon app spectra.

## Consequence For The Diagnosis

The owner's remembered visual change now has concrete earlier/later image
witnesses. These are not established as the last-white/first-dark pair or a
matched one-factor comparison: authenticate camera, scene, medium, spectral
basis, source, orders, integration and display before attributing differences
to solar-zenith cache construction. The earlier display-policy confound remains.

A subsequent bounded continuation can authenticate the old render metadata,
recover selected cache samples/trace spectra and compare them under common
view/display settings. Reuse the archived view analysis before considering
reconstruction. Keep every derivative in a new experiment run, record complete
external archive/manifest/entry identities and preserve the source archive.
Do not copy a full cache into retained evidence by default; existing global
storage budgets still apply. No cache build, extraction, new numerical solve,
production edit or archive write was performed during this discovery.

# Active Topic

Current active topic: `algorithm32-production-closeout`.

Canonical entry document:
[Color, Stellar Rendering, And Distant-Sun Closeout Plan](algorithm32/production/color-star-cache-closeout-plan.md).

## Immediate Focus

The active production task is to disposition the remaining Color Reset,
stellar-rendering, ambient-light, and distant-Sun follow-ups without reopening
their closed experimental or cache plans. Release-critical items C1-C6 remain
open or dependency-blocked; candidates D1-D11 await owner decisions to execute,
defer to their linked follow-up owner, or close as out of scope. The first
decision pair is full-cadence Color/star appearance acceptance and the separate
lighting-only sunset/plus-one-hour appearance review.

The one-degree Flat32 distant-Sun scene-cache hookup is complete through P10
and production adoption PA7. Exact prebuilt packages, scalar solar-zenith
resolution, manifest validation, face-grid GPU upload, actual-point lookup,
Q30 final-view integration, transactional replacement, and the shared
texture-free dark state at and above 108 degrees are implemented.

The selected face-grid runtime removes the earlier sub-one-FPS regression. On
the qualified RTX 2060/D3D11 path, the atmosphere pass measures `22.22 ms`
mean and `22.30 ms` p95 at 1920 by 1080. The 3840-by-2160 diagnostic remains
about `123.32 ms` mean, so 4K 30-FPS work is still open. The documented green
closure is Algorithm32 `591/591`, Algorithm32 WebGL `23/23`, the full exact-
cache Flat32 lane `16/16`, both type checks, and the Flat32 build.

Stage 9.6 is implemented through 9.6.6, including the N=2048 shell-held local
Sun cache, continuous direct `L1`, replacement GPU graph, lifecycle,
publication, ordinary N4 Flat32 cutover, and containment. Omitted-ground
acceptance is established. Reflective local CPU/GPU behavior is implemented
and agrees under bounded probes, but renewed physical acceptance requires a
new independent authority; retired Star evidence is historical only.

Stage 10's captured-scene display-boundary composition is implemented. Stage
11 is sufficient for immediate application use: 11.1-11.3 are complete and
parts of 11.4-11.6 are implemented. Remaining interaction, migration,
reconciliation, and release closure is owner-deferred; 11.7 and unfinished
11.4-11.6 are inactive, and 11.8 is deferred rather than accepted.

The contained color-reset experiment is complete through accepted CR8 run
`000065-color-reset-qualification`, and production promotion is now selected
under the production-owned Color Reset design and implementation plan.
P0 through P7 are complete: the promotion manifest authenticates the contained
parents and inventories production ownership/fixed-500 assumptions, while
Flat32 now owns exact independent Color, celestial, catalog, and ordered-filter
selections with fail-closed staged availability. Production now publishes
atomic direct-normal, direct-horizontal, diffuse-horizontal, and total-
horizontal receiver light and Flat32 measures it before first-frame
publication. The fixed `color-reset-slope-078-p9` model now consumes that
facade-owned lux directly before unchanged Bruneton encoding and reproduces
the accepted response values and slopes. Receiver scene lighting now consumes
the same generation's direct-normal and diffuse-horizontal spectra through a
Color-free neutral Lambertian owner before the existing single display
boundary. Production now also owns an authenticated, local-only brightest-2,000
package and exact explicit catalog selection. Its split `2000x1 RGBA32F` and
`2000x15 R32F` source textures, 2,001-entry palette, collision conservation,
resource bounds, replacement, and context restoration pass production gates.
Production now owns the ordered `view-presentation-filter-registry-v1`, the
selected mesopic and low-light chroma equations, exact identity paths, fixed
configuration identities, authenticated local scotopic weights, and the live
source-linear stellar shader hook. Catalog, screen index, 16-row palette,
filter/weight configuration, receiver light, adaptation luminance, and Color
publish as one compatible stellar generation. By project-owner direction, the
ordinary Flat32 application now defaults to `color-reset-slope-078-p9`, the
brightest-2,000 catalog, and the ordered `human-mesopic-luminance-v1` then
`human-low-light-chroma-v1` stellar presentation. Basic Bruneton and
brightest-500 remain explicit controls; `stellarPresentation=physical`
disables the default perceptual chain. The superseded source-luminance-lift
production implementation and route are removed.
The stellar palette applies the accepted `q=24` calibration as the exact
`1,463,996.1476640578` effective boundary scale while retaining one-pixel
rasterization; the earlier promoted implementation had incorrectly retained
only the historical `q=1` base scale. Default-route captures `000015` and
`000016` prove the selected Color/catalog identities, accepted bright sunset
response, and visible one-pixel stars at sunset plus one hour. P8 now has its
complete nine-condition production cadence and engineering gates; fresh GPU B1
regeneration and owner appearance acceptance remain open.
Run `000017` is the current no-override plus-one-hour proof and publishes and
executes both ordered human-vision filters; `000015` and `000016` remain the
otherwise matching physical-presentation controls.

Other open boundaries include 4K performance, broader supported-hardware
resource/performance qualification, renewed Stage 8/reflective evidence,
the cross-stage pinned-source audit, import provenance, citations, expanded
release hardening, and the public entry point. Visible extraterrestrial source
composition machinery is present for the current Sun and both stellar
catalogs. P9 implementation and documentation cleanup, including superseded-
path removal, are complete. Deferred P9 source/licensing research, fresh GPU
B1 qualification, owner appearance acceptance, and final release closure
remain open; application default activation is complete.

## Minimal Reload Sources

Read these files in order and no others during bootstrap:

1. [Repository workflow instructions](../../AGENTS.md)
2. [Algorithm32 production status](algorithm32/production/README.md)
3. [Production closeout plan](algorithm32/production/color-star-cache-closeout-plan.md)
4. [Project reference follow-up](../../references/followup.md)

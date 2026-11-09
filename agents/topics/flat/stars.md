# Flat Earth stars

Status: implemented and locally verified.

Flat Earth supplies Algorithm32's standard stellar source alongside its finite
local Sun. It uses the same authenticated brightest-2,000 package as Flat32,
retaining its ordered catalog, Native15 spectra and original 1,993/7
supported/proxy partition. The existing display model and stellar
screen-index/palette pipeline own composition.

Flat explicitly enables Algorithm32's existing human presentation, matching
Flat32's default: `human-mesopic-luminance-v1` followed by
`human-low-light-chroma-v1`, with maximum rod contribution 0.5 and maximum
chroma retention 0.65. These are engine-owned filters; this integration adds
no new filtering equations. Algorithm32's optional registry defaults to absent,
so both the facade and color model must receive the same configured registry.

## Ownership and deployment

The app-owned registered `stellar-catalog` service under `src/flat/services/` uses the
app's `io` capability, authenticates payload lengths and SHA-256 hashes, then
invokes the engine package adapter. It also authenticates Flat32's CIE-derived
Native15 scotopic weight package before publishing the source and presentation
registry together. One immutable CPU source and filter registry are shared across
both Earth features and the application's views; each view owns its GPU resources. Loads share one
in-flight promise and completed source. Cancelling a view stops its wait without
cancelling another view. Service stop prevents stale publication. Failed loads
can be retried through the existing scene Retry action.

The controller injects the catalog capability into its runtime factory. Catalog
loading and graphics warming run concurrently; independent startup cache
construction is preserved. React and the workspace acquire no star-specific
logic or registry lookups.

Flat owns app-relative server routes under
`stellar-catalogs/brightest-2000-stellar-package-v1/` and
`presentation-filters/human-vision-filter-package-v1/`. The narrow router delegates
filesystem access to a feature service exposing a completely authenticated
package inventory. Missing/corrupt data returns 503; unknown assets return 404.
Manifest path validation and ordinary-file/root checks reject traversal and
linked files/directories.

The [operational data contract](../../../server/flat/data/README.md) owns the
locations, provenance, provisioning and `FLAT_STELLAR_CATALOG_ROOT` /
`FLAT_HUMAN_VISION_ROOT` overrides. Flat32's bytes were copied and SHA-256 verified into Flat's own
directory. Flat has no runtime import or data-directory dependency on Flat32.
The owner selected Git tracking of Flat's catalog and human-vision packages,
so app checkouts include their seven files. They remain server-served assets
rather than inline browser-bundle content. Their source/redistribution status
remains with the operational data contract and T13.

## Retained updates and shader modes

Initial execution profiles and retained observation updates contain the same
stellar source. Engine retained flat/local assembly now allows unchanged stellar
topology. Stellar geometry and observation update reversibly alongside the Sun;
catalog identity, generation program sources/policy and uniform layout are
checked before publication. Rollback restores the previous geometry and
observation. Source textures and materials remain owned by the original pass.

Time/location/elevation edits regenerate compatible stellar output while
retaining physical cache construction, scene, shader handle and programs.
Camera/FOV edits use the existing on-demand generation path. No height-specific
shader variants were added.

Full composes stars with the existing atmospheric/display path. No atmosphere
retains stars, Sun illumination 0% and disc brightness 100%. Shader off renders
the Three scene directly, omitting shader-owned stars and disc. Existing
physical sky brightness can mask stars in Full. Human presentation applies only
to stars; scene lighting, the atmospheric cache and solar presentation retain
their existing behavior.

The [spherical execution record](spherical-earth-implementation-execution.md)
owns the app-service promotion and current integration checks.

## Verification

Client and server types pass; all 133 Flat browser tests, five server tests and
eight existing engine filter tests pass. The prior 63 focused engine tests
remain evidence for the unchanged retained engine implementation. New coverage includes shared loading,
independent cancellation, stale-lifetime rejection, retry, app-relative IO,
corrupt/unsafe payloads, reversible physical updates, resource reuse and
incompatible sources. Server tests exercise `/flat` and `/group/flat`, route
ordering, complete authentication and explicit failures.

The actual hardware-GPU [proof](../../../.codex-tmp/flat-human-vision/gpu-final-proof.json)
and [runner](../../../.codex-tmp/flat-human-vision/gpu-proof.mjs) retain diagnostics and
captures. Visible [No atmosphere output](../../../.codex-tmp/flat-human-vision/final-no-atmosphere.png)
contains 543 bright pixels in the initial upward view, 563 after time/elevation
changes and 331 after camera/FOV changes. Location changes produce 458 bright
pixels with the same resource reuse. These updates preserve the frame,
handle, source and cache construction with zero additional programs or shader
compiles. Shader off has zero bright scene pixels; its first direct-scene
material creates the single program already documented for shader options.
Stellar generation has zero failed generations. Full captures verify normal
composition; their night filename denotes the local clock time, not a claim
that the existing flat-Sun sky becomes dark then.

The [comparison capture](../../../.codex-tmp/flat-human-vision/final-comparison.png) verifies
both views ready with the same catalog and separate scene resources. Across
both views there are only seven package requests (five catalog assets and two
human presentation assets).
Closing comparison completes graphics release; all four allocated stellar
targets are disposed. The normal application build and scoped formatting pass.

The matched [before/after measurement](../../../.codex-tmp/flat-human-vision/color-comparison.json)
uses the same scene crop and excludes the pointer-lock hint from both images.
For pixels with maximum RGB above 32, mean normalized channel spread
`(max - min) / max` falls from 0.44878 to 0.001005; near-neutral pixels rise from
22/512 to 543/543. This is a display-pixel comparison of this view, not a
perceptual calibration or a physical accuracy claim. The inline baseline
measurement in the GPU proof includes the hint overlay and is superseded by
this corrected matched-crop measurement. Earlier unfiltered evidence remains
unchanged under `.codex-tmp/flat-stars/`.

Earlier harness measurement/serialization failures and the discovered retained
assembly guard failure remain preserved as failed evidence. Engineering reviews
remain owner-cancelled; primary self-review and local checks make no independent
standards-compliance claim. The owner has now requested a whole-repository
checkpoint preserving this integration; the later
[M4 verification](../component-refactor/mui-migration-execution.md#m4-final-handoff)
also exercises stars, sky modes, retained resources and cleanup. The dome-cache
experiment remains suspended. No publication was requested.

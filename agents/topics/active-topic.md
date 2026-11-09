# Active Topic

Current active topic: deploy.
Canonical entry: [Cache deployment runbook](deploy/README.md).
Focus: local GPU cache generation from a Git checkout, transfer of only the
completed package and build receipts, then activation at Flat's data root on
Ubuntu. This replaces the proposed host-side generation workflow. The owner
handles hosting and parent integration; no remote host was contacted.

The runbook folder includes a compact tracked control-metadata seed, its
producer/manifest, a Node deployment helper, tests and type-check configuration.
It restores the formerly ignored compiler inputs, checks the local GPU, invokes
the current 40 km/canonical production compiler, and installs/selects freshly
generated identities on Ubuntu. The web host does not need Chrome or a GPU.
Cache files remain generated and ignored; the seed contains metadata only.
The owner selected Git tracking of Flat's seven stellar/vision package files
(about 3.41 MB); their ignore rules are removed. Default app checkouts now carry
them, and only the Globe cache needs a separate data build/copy. Original
Flat32 copies, asset bytes/provenance and T13 clearance status are preserved.
Compiler launcher backend selection is configurable and disposable generation
profiles are cleaned up. Preserve all sealed generation runs and old packages.

Cache input fingerprints now cover selected settings, control metadata and
conservative engine/generator/deployment source scope, excluding app UI, docs
and tests. The build and fingerprint share cache-build-settings.json. `check`
and `check --installed` work without Chrome; matching available local output
skips GPU work in `build`, with `build --force` available. Transfer last-build.json
with the package; activation persists installed-build.json for later checks.
Receipts are separate from sealed runs and replaced atomically. Cheap checks
read metadata and file lengths, not the full payload. Older packages remain
usable but report unrecorded until an input receipt is available.

Three helper tests pass on Windows and Ubuntu WSL2 (native Linux filesystem).
Reuse/invalidation, force bypass, UI/docs exclusions, settings/control/engine
changes and missing files are covered. Actual Windows/Ubuntu fingerprints agree.
Local RTX 2060 hardware float-rendering preflight and real installed-package
verification pass. Production inputs resolve to 109 scenes/5,847 rows/95 blocks.
Deployment and compiler type checks pass. The full cache was not regenerated;
Ubuntu GPU generation and remote deployment were not tested or selected.
The [alpha handoff](production-app/release/alpha-status.md) links this runbook
and retains operational-data/public-distribution concerns. Calibration and
refraction remain deferred; current physical model behavior is unchanged.

[Flat32 production exclusion](production-app/runtime-integration/flat32-production-exclusion.md)
is implemented and locally verified. Production/discovery advertises only Flat;
explicit development commands preserve Flat32. All 31 server tests, type checks,
production Flat build, local Flat32 test build and production-host HTTP smoke
check pass. No remote host was changed; parent stale-output cleanup is a
separate deployment concern recorded by the owning note.

[F08](production-app/mvp/requirements.md#f08) remains a required scene-objects
goal, with content options open in increasing complexity/decreasing priority:
boxes, generated terrain, then geographic data with imagery and three LOD
levels. Historical terrain-source notes are linked. Open a contained experiment
when the owner is ready to investigate; none has been started.

The Globe sunrise/sunset investigation is concluded for now. Its
[owner note](flat/solar-time-controls.md#horizon-timing-investigation) preserves
the native San Jose reproduction and the decision to retain geometric
upper-limb events. Refraction remains deferred. The shared view selector is
now labeled "Choose mode".

The previous task replaced broad MVP phases with independently trackable feature
and technical goals. The canonical requirements.md now records F01–F07 and
T01–T13 with outcome/acceptance, status, evidence/remaining work and actual
dependencies. Stable IDs do not imply execution order. New owner-selected goals
can be added using the next unused identifier; unselected ideas remain proposals.

Existing MVP obligations remain intact. Former M1–M3 anchors redirect through
an explicit mapping; current release/research/ownership routes use the goals.
Six delivered app capabilities and retained-update/recovery goals are complete
within their stated scope. Playback and numerical/release/research/distribution
acceptance remain partial or open. This documentation update selects no next
implementation, qualification campaign, deployment or experiment resumption.

The Flat entry owns current application implementation and verification,
including solar-event/ten-minute controls, camera synchronization, measured
ground lighting and both scenes. Latest maintained browser result: 288 passing
tests, with Flat types/build and native controls/layout verification recorded
by their owning notes. The root README owns the public model equations.
These task results do not constitute exact-MVP-build qualification.

Engineering standards reviewers remain cancelled; checkpoint-adviser monitoring
remains separate and active. Models are exclusively registered services; all
.d.ts declarations are ambient and export no symbols. Local authoring-rule
promotion remains deferred until Polylith skills review is complete. The
dome-cache experiment remains suspended. Preserve pending implementation,
documentation, immutable evidence and all unrelated working-tree changes.

## Minimal Reload Sources

1. [Repository instructions](../../AGENTS.md).
2. [Deployment runbook](deploy/README.md).
3. [Alpha scope and handoff](production-app/release/alpha-status.md).

Load MVP goal details or other evidence only when further work requires it.

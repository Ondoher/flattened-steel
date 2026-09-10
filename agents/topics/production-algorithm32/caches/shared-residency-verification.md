# Shared Residency Verification

P5 implements authenticated browser metadata ingress, deterministic bounded
residency, predictive window preparation, and complete frame-boundary publication.
P6 integrates these capabilities into the shader and live application. P7 owns
the combined real-GPU lifecycle, fault, memory, timing, and final review gates.

## Implemented Behavior

The package loader authenticates every metadata edge under a same-origin root
and a 32 MiB cumulative byte ceiling before constructing a private graph.
The controller uses required blocks first, then complete predicted scenes while
capacity permits. Declared routes, explicit route positions, velocity, and
inferred direction select look-ahead. Prepared scene changes reuse their GPU
layers and host pins without block requests or packet uploads. After a window
was constrained by the previous visible scene, requesting the published scene
again refills prediction after its obsolete visible pins have been released.

Visible slots are protected from eviction. Unprotected slots use deterministic
LRU replacement. Metadata becomes eligible only after all required packet
uploads succeed; publication changes the complete scene at a frame boundary.
Callers install its borrowed bindings and matching live-light state before
rendering. Supersession and failure retain the last complete publication.
Darkness creates no metadata or atlas and releases the previous allocation at
publication. Lost contexts yield no renderable frame until complete reupload.

The actual inventory needs at most 18 blocks per scene and 18 for every adjacent
pair. A distant pair can need 36. The default 24-layer allocation holds the
visible scene if a jump cannot fit; an isolated candidate atlas requires explicit
target qualification for 859,963,392 simultaneous atlas bytes. Optional larger
atlases require their exact qualified route block set and memory ceiling.
Prediction alone cannot force an additional allocation.

## Focused Evidence

- Ten focused controller/metadata tests pass: exact coordinate and altitude
  lookup, prepared reuse, deterministic sliding replacement, bounded and
  qualified jumps, upload failure, supersession, darkness, restoration,
  route reversal/position, disposal, and malformed metadata ingress.
- One targeted runtime-contract regression passes for slot 61 in a declared
  62-layer atlas and rejects slot 62. The previous fixed-24 publication check
  now uses the validated row table's actual layer count.
- Algorithm32 type checking passes.
- One focused changed-code review found no actionable defects. Full review
  ledger and independent cross-cutting audits remain deferred to P7 under the
  owner-selected incremental cadence.

A read-only run of the new package loader and metadata builder against the
[P2 immutable package](shared-generation-qualification.md) authenticated 114
metadata artifacts totaling 2,374,864 bytes. Independent coordinate comparisons
accepted all 70,115 packed rows in scenes 0-107 and the scene-108 dark state in
approximately 1.93 seconds. The trusted root hash was
`eee22091d2f1deb8e992f22be47243a07e7f4bc9462d25ee89683352cca19069`.
This check exercises new metadata consumption; P2's exact spectral generation
and all-control reconstruction evidence is reused without regeneration.

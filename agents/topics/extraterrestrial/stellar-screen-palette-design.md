# Stellar Screen-Palette Cache Design

Status: accepted experimental representation and production-promotion oracle.
The contained lane is successful. Its
[Stellar Screen-Palette Production Port Plan](stellar-screen-palette-production-port-plan.md)
retains the production resumption order but is paused while the owner-directed
distant-Sun solar-zenith cache design and plan are active.

This document owns the current stellar screen-cache representation. The paused
[production-port plan](stellar-screen-palette-production-port-plan.md) owns its
resumption order; the completed [Stellar Rendering Plan](stellar-rendering-plan.md)
owns experimental qualification. The older
[Celestial Contribution Cache Design](celestial-contribution-cache-design.md)
is retained read-only as historical evidence for the rejected dense
member-by-transport field; it does not define this cache.

## Development Boundary

The accepted reference implementation remains contained below
`scripts/extraterrestrial/`, and its generated builds, readbacks, measurements,
caches, and proof records remain below `tmp/extraterrestrial/`. These surfaces
are immutable promotion evidence, not production runtime dependencies.

The project owner has now explicitly authorized the production port. Scoped
writes to `src/algorithm32` and `src/flat32` are permitted under the
[production-port plan](stellar-screen-palette-production-port-plan.md), with
repository standards and Algorithm32 production boundaries as gates. The port
adapts accepted contracts into production owners; it does not import contained
runners, generated artifacts, or experimental modules at runtime.

The existing sealed baseline, candidate, and immutable runs are historical
evidence and are not production implementation surfaces. The contained
reference implementation remains at:

```text
scripts/extraterrestrial/stellar-screen-palette/
```

New production qualification evidence uses new immutable runs. Existing runs
are never reopened or rewritten.

## Qualification State

Work Plan steps 1 and 2 are accepted by immutable run
`000406-stellar-screen-palette-fixed-observation-projection-proof`
(`7dd00b078d6a058cb7feabe95df9d86c148ee1048c92ce4d484610a750d41620`).
The contained contract uses FK5/J2000 mean catalog directions, IAU 2000
three-angle precession, USNO mean sidereal time with UTC approximating UT1/TT,
local east/north/up, an explicit perspective camera, and top-left row-major
half-open pixel assignment. All 500 fixed-fixture members were classified once
with no invalid or unsupported result. The run does not qualify the palette or
collision algorithm because its 52 in-frame members occupied distinct pixels.

Work Plan step 3 is accepted by immutable run
`000409-stellar-screen-palette-exact-cpu-builder-proof`
(`e1b684575f10d9b6ca6ea6abe4ab756c167bc6c697a9fdb65f66e68623a93572`).
The contained builder reproduces the accepted 500-packet native-15 radiometry
identity from the checked catalog, Pickles, and Johnson B/V inputs. For the
fixed 640 by 400 view it publishes a 512,000-byte `Uint16` matrix and a
53-entry, 3,180-byte `Float32` palette: reserved zero plus one entry for each
of 52 occupied pixels. Binary64 point conversion and accumulation conserved
all 15 channels exactly in the accepted run; maximum binary32 packing relative
residual was `5.8398511095706926e-8`. A constructed same-pixel control added
three positive packets across all channels, classified a fourth zero packet
without adding it, and produced one occupied palette entry with two
collisions. Atomic replacement, derived view identity, failure preservation,
capacity rejection, and exactly-once CPU-generation disposal were also
accepted. The sealed nine-artifact run was independently reverified. It uses
direct Algorithm32 and Flat32 byte inventories and has no Git inventory
dependency. Runs `000407` and `000408` remain preserved historical records.
This CPU construction is a qualification oracle only. Production construction
is owned by the dedicated screen-palette generation shader defined below.

Work Plan step 4 is accepted by immutable run
`000411-stellar-screen-palette-indexed-gpu-resource-proof`
(`ebca4daac3175e4486db60c51b6cef0cd64207c934cff7aeff13efe6b7a3cfe0`).
Real WebGL2 uploaded the fixed screen matrix as a 640 by 400 `R16UI` texture
and its palette as a 15 by 53 `R32F` texture. Direct readback and shader
`texelFetch` reproduced the CPU `Float32` oracle with zero error for empty,
unique, constructed-collision, and post-context-restoration pixels across all
15 wavelengths. Exact-identity reuse avoided a new upload. Changed view and
source-product identities atomically replaced the active resources; an
injected failure deleted its partial matrix texture and retained the published
generation. Real `WEBGL_lose_context` loss abandoned the invalid generation,
restoration republished the retained CPU product, and every successfully
created GPU resource reached exactly one disposal or context-loss terminal
state. The sealed 19-artifact, 1,570,250-byte run was independently verified.
Run `000410` is a preserved browser-launch setup failure that did not reach a
GPU assertion.

Work Plan step 5 is accepted by immutable run
`000412-stellar-screen-palette-atmosphere-composition-proof`
(`cab927484f049014ef8e648564188bea80c79a767af1ded898ef4ac641ec19af`).
The contained WebGL2 consumer performs one `R16UI` screen-index fetch and one
fixed 15-channel loop whose single palette-fetch site resolves the indexed
native-15 boundary spectrum. It performs no catalog iteration or palette
search. Seven empty, unique, scene-masked, horizon-masked,
zero-transmittance, unit-transmittance, and collision controls matched the
binary32 operational oracle exactly and the binary64 physical equation within
`6.03144705474324e-8` relative error. Empty and suppressed boundary terms
preserved atmospheric path radiance exactly. Fractional-transmittance controls
for both unique and collided pixels distinguished the required single
transmittance multiplication from accidental squaring. Composition remains
native-15 and pre-Color; Bruneton, exposure, and subjective rendering were not
executed. The sealed 17-artifact, 1,069,640-byte run was independently
verified and retained the complete derivation from accepted run `000411`.

Work Plan step 13 is accepted by immutable run
`000427-sun-over-stellar-screen-palette-proof`
(`8a459d0dcd6d462c1c5e66f560ee1b8aacfbafdb0e05a937979c1775257c5315`).
The contained compositor reused accepted run `000411`'s stellar matrix and
palette, derived uniform native-15 Sun radiance from the unchanged production
irradiance and `0.004675`-radian support, and applied the production four-sample
coverage pattern. A declared `(0.05, 0.35)`-pixel controlled center offset
exercised every coverage class: one quarter-coverage pixel, one half-coverage
pixel, two three-quarter-coverage pixels, two full-coverage pixels, and exact
zero elsewhere. All six positive-coverage pixels were Sun-owned; a controlled
stellar contribution behind one full pixel was suppressed, while the accepted
off-disk stellar probe remained bit-exact.

Real WebGL2 `R16UI`/`R32F` readback matched the CPU product exactly. Shared
native-15 atmospheric composition matched the binary32 operational oracle and
binary64 physical equation, including a scene-masked control. The cache-only
unchanged Bruneton Figure-1 render contained six nonblack pixels at maximum byte
`255`; its shader contained one index-fetch site, one palette-fetch site, no
catalog loop, and no independent Sun contribution. The final product occupied
`512,000` matrix bytes plus `3,540` palette bytes and took `4.755 ms` to compose
in the recorded run. All 16 artifacts and 559,129 bytes were independently
reverified, and Algorithm32 and Flat32 inventories were unchanged.

Run `000425` is the preserved sandbox-denied Chrome-launch predecessor. Run
`000426` is an accepted centered-disk predecessor whose real projection happened
to contain only zero and full coverage; `000427` supersedes it as step 13
qualification because it exercises every fractional class through the full
projected/GPU path. Neither predecessor is modified or discarded.

Owner-directed immutable run
`000431-sun-layer-screen-palette-three-scenes`
(`e44822b5d0f7357103ab7b3d515b23ccb5687fa0d755c074489e2d5262446f19`)
accepts the contained full-scene visual-review adapter. At solar noon, sunset,
and sunset plus three hours, the screen index and native-15 palette are the
sole visible celestial input to the retained atmosphere/Color shader. The
physical `DistantSunLightSource` remains only as the atmospheric-scattering
illuminant; its disk raster and the retained stellar raster are disabled. The
Sun introduces no separate image or transported field: construction places
its coverage-scaled native-15 spectrum into the same palette used by stars,
replacing the back-layer stellar spectrum at any positive-coverage pixel, and
runtime resolves both through the same O(1) lookup and one transmittance
multiplication. The sunset frame contains four Sun-owned cache pixels; the
fixed sunset-facing noon and night frames contain none. The night frame
contains 32 visible stellar pixels. Runs `000428`, `000429`, and `000430`
remain immutable failed predecessors for input identity, black-render, and
integer-sampler precision diagnostics respectively. Production is unchanged.

Immutable run `000435-sun-layer-screen-palette-three-scenes`
(`15a983c091886402d6a5a3cd0110f9c02b6682697513ec90c267ac59d6c026b0`)
supersedes `000431` as the current visual-review qualification for Sun
rasterization. It replaces the four-point hit estimate with geometric projected
disk/pixel overlap. A 512-segment projection of the angular boundary is clipped
against every pixel square in its conservative footprint; any positive area
owns the pixel, and its continuous `[0,1]` area fraction scales all 15 Sun
radiance channels. No source-side horizon sample rejection occurs. The sunset
disk covers 12 cache pixels, comprising 10 fractional and two full pixels, and
the sum of the fractions (`4.235592398319568` pixel areas) matches the projected
polygon area (`4.235592398305016`) within `1.46e-11`. The below-horizon
three-hour disk remains in the celestial palette until ordinary scene masking;
the final night PNG is byte-identical to accepted run `000431`, demonstrating
that it contributes no visible light. Runs `000432` through `000434` remain
immutable failed predecessors for an obsolete zero-cache assertion, a mistyped
reference identity, and omitted zero-coverage evidence fields respectively.
Production remains unchanged.

Run `000435` does not qualify fractional scene-object or horizon-edge masking.
Its contained runtime samples the already-resolved celestial palette for the
pixel and then suppresses the complete contribution when
`state.sceneHitMask >= 0.5`. Geometric Sun coverage therefore owns 12 cache
pixels even though whole-pixel scene masking can make the horizon image appear
smaller. The production port initially preserves this accepted boundary.
Subpixel combination of celestial coverage with geometry coverage is a separate
future policy and may not be folded into tile filtering without its own energy,
occlusion, and edge-parity proof.

The sparse member-addressed generation shader and its placement in the standard
render pipeline are owner-directed production design decisions made after these
contained runs. Production-port Work Plan steps 3 and 4 now qualify its
immutable source layout, fixed-observation projection, sparse stage sources,
capacity and numerical policies, exact compatibility identities,
classification, collision spectra, conservation, binary32 packing, production
active/staging allocation, standard-pipeline execution, refresh, failure
retention, real context restoration, live shader fetch, and exactly-once
cleanup. Step 5 additionally qualifies the fixed-cost unsigned-index/native-15
consumer, one atmosphere-transmittance application, scene masking, common Color
entry, Flat32 activation, resize refresh, full context rebuild, and
atmospheric-only compatibility. Step 6 now qualifies the compact source-local
continuous-coverage Sun tile, circular-disk raster simplification, joint
publication, atomic visible-Sun cutover, scale reuse/invalidation, and shared
consumer ordering. The immutable runs remain physical, projection, resolved-
spectrum, format, composition, lifecycle, and visual oracles for the completed
celestial port and the separate Color work in production step 7.

## Objective

Project every eligible star into the current view and publish one O(1)-addressed
top-of-atmosphere boundary contribution for each screen pixel without storing a
`width x height x 15` spectral field. The shader-built stellar result is the
additive back layer. Production places the resolved Sun in front through its
separate source-local tile and the same standard pipeline's O(1) layer merge.

The persistent output is:

```text
pixelIndex[width * height] -> palette index
palette[entryCapacity][15] -> native-15 stellar boundary spectrum
```

These are the persistent stellar outputs. Binary stellar occupancy is
generation-shader transient state, independent of radiance. The later standard
pipeline consumer fetches the stellar spectrum, merges the independently
generated source-local Sun tile in O(1), applies shared view-path transmittance
once, applies the existing scene/horizon policy, and composes the result before
common Color. The production Sun does not require flattening into or dynamically
allocating entries in the stellar palette.

The source-local-tile Sun replaces the renderer's existing independent Sun-disk
contribution when the production pipeline is enabled. The contained oracle
disabled that legacy path before drawing its full-screen composed cache; it did
not draw both implementations and rely on masking, ordering, or Color to hide
the duplicate. This remains a single-owner rule: one frame receives exactly one
Sun boundary contribution, transported by the atmosphere and mapped by Color
exactly once. The existing production visible path stays active until the new
complete standard pipeline is installed atomically.

Color remains downstream of that complete native-15 composition. Bruneton is
preserved unchanged as the production comparison model. The accepted
experimental condition-wide Ferwerda cone/rod behavior is a separate Color
model and may not be folded into the stellar palette, Sun tile, atmosphere
consumer, or Bruneton implementation. Both models receive the same composed
spectral field through the same single Color boundary.

The production tree still contains `FerwerdaColorDisplayModel`, but its visual
result is rejected and it is not the selected Color architecture. The accepted
contained replacement is `BrunetonSourceLuminanceLiftColorDisplayModel`.
Production porting remains a later explicit step.

The replacement consumes one receiver-local direct-source quantity. Source
irradiance is attenuated by the atmosphere along the receiver-to-source path,
photopically projected, and divided by pi. A smooth logarithmic Hermite curve
maps that luminance to a condition-wide gamma: exact `1` at and above
`5 cd m^-2`, exact `0.125` at and below `0.001 cd m^-2`. There is no source-type,
time, location, elevation, night, scene, camera, or viewport branch and no
scattered-light, rod, or cone input. Finite/local distance falloff enters only
through the physical projected solid angle.

Color applies the unchanged Bruneton Figure-1 exponential first. When gamma is
below one, it raises the mapped photopic luminance to that gamma and multiplies
all RGB channels by the same ratio. The effective gain is
`min(Y^(gamma - 1), 32768)`, which bounds amplification of arbitrarily small
nonzero values without adding a pixel classification. Thus the lift is global and
chroma-preserving; gamma one emits the original Bruneton shader block exactly.
Atmosphere-transmitted extraterrestrial Sun/star radiance remains part of the
ordinary composed stimulus before Color, so the same seam extends to a Moon.
Runs `000466` and `000467` own the accepted paired visual and numeric evidence.
Run `000468` owns their immutable derivation from the visually rejected
uncapped one-hour frame in run `000464`.

Renderer-linear scene RGB enters the Ferwerda composition without display
encoding or Bruneton's inverse exponential. Because renderer RGB is relative
and the atmospheric field is absolute, Color multiplies the linear scene
channels by source-owned `sourceBrightness` to express them on the
luminance scale expected by Ferwerda. This neutral scalar preserves photopic
channel ratios; it is not a color grade. Display-encoded scene input may still
use the explicit inverse conversion at the typed CPU seam. Flat32's distant-Sun
scene-light demonstration uses no positive ambient-intensity floor after its
twilight scale reaches zero.

## Ownership And Quantities

- The stellar source owns stable member identity, catalog-frame position and
  epoch, and one native-15 top-of-atmosphere spectral irradiance packet per
  member.
- The Sun source retains the current production disk's direction, angular
  support, and native-15 top-of-atmosphere disk radiance. This extension may
  adapt that implementation into containment but may not redefine or tune it.
- Geometry owns celestial-to-local time/location transformation, camera
  projection, viewport placement, horizon classification, pixel solid angle,
  resolved-disk support, and the binary any-positive-coverage occupancy test.
  For stars, that transformation must include receiver latitude/longitude and
  the observation-time offset from the catalog epoch; catalog directions are
  not time-frozen model directions.
- Geometry also owns the explicit model-to-renderer-scene direction mapping.
  A geometry-resolved celestial direction must be expressed in the inverse of
  the configured scene-to-model frame before a renderer camera matrix projects
  it. Model `north` is not screen/scene `up` in Flat32's observer-local frame;
  both resolved Sun disks and stellar points use this same mapping.
- The dedicated screen-palette generation shader owns per-view stellar point
  assignment, spectral collision aggregation, palette construction,
  index-width selection, and production of the complete stellar matrix/palette
  pair. CPU code may validate or read back its result but is not the production
  author of either texture.
- The source-local Sun-tile stage owns continuous disk coverage. The later
  standard pipeline consumer owns the fixed-cost stars-then-Sun merge; neither
  stage dynamically rewrites the stellar palette.
- Atmosphere owns path radiance and the shared per-pixel spectral
  transmittance. Atmospheric transport is not duplicated per star or stored in
  the stellar palette.
- Scene depth/hit remains renderer-owned live state. It masks the fetched
  stellar contribution during composition and does not enter palette identity.
- Color receives only the common composed native-15 result and remains pure
  Bruneton for this work.

## Standard Shader-Pipeline Placement

The screen-palette generation shader is a first-class stage of the standard
Algorithm32 render-shader pipeline. It is not a cache-build-subsystem job, a
sidecar renderer, a private Three.js pass launched outside `ShaderBuilder`, or
CPU-prepared texture data. `ShaderBuilder` and the normal runtime assembly and
installation path install it ahead of the atmosphere/Color consumer in the
same ordered frame pipeline.

The pipeline stage has these inputs:

- immutable member identity, catalog-frame direction, catalog epoch, and
  native-15 source packet from the stellar source;
- geometry-owned latitude/longitude and epoch-relative observation-time
  transform;
- renderer-neutral camera, projection, and viewport identity;
- point-response, collision, palette, capacity, and numerical policies.

CPU ingress may normalize and upload the immutable catalog/member table as a
standard read-only shader data binding. That table preserves canonical member
order and carries catalog-frame direction, epoch identity, and all 15 source
channels. It contains no projected pixel, collision result, palette index, or
screen-product value. Observation/location values are fixed bindings of the
installed configuration; camera/view values are normal frame bindings.
Geometry contributes the executable transform/projection shader operations
that consume them. This port adds no clock-driven observation update, Earth-
rotation animation, source motion, interpolation, or other animation API.

It owns these outputs:

- the persistent screen-sized unsigned-integer pixel-index texture;
- the persistent entry-major native-15 floating-point palette texture;
- exact generation, compatibility, capacity, precision, and completion
  metadata; and
- opaque transient GPU resources needed only while the standard generation
  pass sequence is executing.

The standard runtime-shader assembly contracts must describe this ordered
generation stage, its integer index output, floating-point palette output,
multiple retained outputs, and any fixed intermediate passes required by
deterministic shader-side collision reduction and palette assignment. The
stage declaration must also describe vertex and fragment sources, point versus
fullscreen draw topology, viewport, depth/order state, clear policy, target
formats, input/output dependencies, and completion boundary. The
stellar path must not bypass runtime assembly, masquerade its outputs as
atmospheric wavelength fields, or expose renderer textures to source, geometry,
facade, or Flat32 code.

One standard generation proceeds as follows:

1. `ShaderBuilder` assembles and installs the generation stage and O(1)
   atmosphere/Color consumer as ordered participants in one standard runtime
   pipeline.
2. At a frame boundary, runtime coordination combines the installed fixed
   source/observation identity with the current camera/view identity.
3. If that identity differs from the completed screen product, the generation
   stage runs first and writes the matrix and palette through its fixed shader
   pass sequence and opaque transient targets.
4. Completion validation marks the output pair usable only for the captured
   identity; incomplete, failed, or superseded work cannot be sampled.
5. The later atmosphere/Color stage consumes the matching pair in O(1), applies
   scene masking and transmittance once, and proceeds through common Color.

A changed camera, projection, or viewport therefore marks the screen products
dirty; it does not rebuild the entire `ShaderBuilder` graph or invoke a CPU
matrix/palette builder. The standard pipeline refreshes the products before
their next valid use. Source, observation instant/location, or relevant-policy
changes use the explicit static configuration-replacement transaction; live or
animated updates for those inputs are deferred. A frame may sample only outputs
tagged with its exact captured identity;
otherwise the stellar contribution is exact zero. An unchanged identity may
reuse the prior completed pair without rerunning the generation stage. Context
restoration reallocates the targets and lets the same standard generation stage
repopulate them before consumption.

Refresh uses an active pair and a staging pair. The generation stage never
writes into textures that a later stage may sample. After all required passes
complete, the standard frame pipeline swaps the completed staging pair into the
consumer bindings at the stage boundary. Failure or supersession discards only
the staging work. An old pair may remain active only for a frame whose captured
identity still matches it; it is never sampled with changed configured
observation or view bindings.

Each star is an unresolved mathematical point. Its integrated spectral
irradiance is converted to its assigned pixel's spectral radiance using the
qualified normalized point response and that pixel's solid angle. Contributions
assigned to the same pixel are added independently in all 15 channels. Stellar
contributions are never multiplied together. The current qualified response is
exactly one destination pixel per projected member (`gl_PointSize = 1.0`); a
star is never represented by the Sun's disk tile, a quad, an invented angular
radius, or a multi-pixel visibility enlargement. Adjacent projected members may
occupy adjacent pixels, and same-pixel members may collide, but neither case
changes the point-source raster rule.

Extended opaque bodies are not added into the stellar palette. Each projected
layer owns native-15 radiance and an independent transient `occupiesPixel`
boolean. The later standard pipeline consumer composes front over back as:

```text
Rfront[lambda] = coverage * Rsun[lambda]
Rout[lambda]   = front.occupiesPixel ? Rfront[lambda] : Rback[lambda]
```

A Sun disk pixel with any positive geometric coverage is occupied and receives
the Sun spectrum scaled by that fractional coverage; it replaces every stellar
contribution behind it. Only exact zero coverage leaves the stellar pixel
unchanged. The uncovered fraction of an occupied pixel does not admit stellar
radiance. Occupancy is never inferred from radiance.

This any-positive-coverage rule is the provisional Sun-over-stars policy, not a
permanent extended-body composition constraint. A later Sun/Moon-overlap round
will likely require depth-ordered subpixel composition: at each retained sample,
select the nearest covering body (Moon before Sun), evaluate that body's
radiance independently from its coverage, and average the selected sample
radiances into the pixel. That future policy can represent a dark lunar limb
partially covering a bright Sun without adding either source through the other.
It may replace the binary policy without changing the shader-built stellar
screen-index/native-15 palette pair or its source-local tile seam.

## Required Base Representation And Shader Algorithm

The first implementation is correctness-first and executes as the dedicated
generation stage of the standard render-shader pipeline, ordered before the
live atmosphere/Color stage. Both persistent outputs are shader-built. The base
palette uses stable sparse addresses so WebGL2 never has to dynamically append
or atomically allocate a palette entry:

```text
0                         -> exact-zero entry
1 .. stellarMemberCount  -> canonical stellar member candidate slots
```

For a stellar pixel, the selected representative is the lowest canonical
member index assigned to that pixel. Its stored matrix value is
`canonicalMemberIndex + 1`. Other members colliding with it contribute to that
representative's spectrum but do not require their own live matrix reference.
Unused and nonrepresentative candidate slots contain exact zero. This sparse
layout is deterministic, bounded by source capacity, and avoids GPU-side
variable-length palette allocation. A later qualified compaction pass may
remap it without changing the logical output.

The standard generation stage uses this ordered shader sequence:

1. Clear the screen-sized unsigned-integer matrix target to zero and its
   transient ordering/depth target to the empty value.
2. Run one point-projection pass with one vertex per canonical stellar member.
   The vertex shader applies catalog-epoch through observation-time/location
   transformation and the current camera projection. Unsupported, below-
   horizon, and off-frame members emit no covered fragment. Eligible members
   rasterize exactly one pixel and write `memberIndex + 1`; deterministic depth
   ordering makes the lowest colliding canonical index win.
3. Run the palette pass over the fixed entry-major `entryCapacity x 15`
   address space. Entry zero writes exact zero. For a stellar candidate entry,
   the shader reprojects its member, confirms that the matrix selected that
   candidate at the projected pixel, and otherwise writes zero.
4. For a selected representative, the palette shader visits the bounded
   canonical source roster in order, adds the requested native wavelength
   channel for every eligible member assigned to the same pixel, and writes the
   deterministic binary32 sum to that representative slot.
5. Finalize the stellar matrix/palette identity and completion metadata. The
   pair becomes consumable only after every required stellar generation pass
   finishes for one exact frame identity.

The shader implementation must prove that one-pixel point rasterization,
top-left matrix coordinates, half-open viewport assignment, depth ordering,
and floating-point projection reproduce the declared projection policy. If
native point rasterization cannot meet that contract on a supported backend,
the standard generation stage must use an equivalent shader-owned deterministic
pixel-address pass; it may not fall back to CPU matrix construction.

Construction uses the declared generation-shader numerical profile for
projection, solid angle, deterministic member-order collision accumulation,
and palette packing. The immutable CPU result remains an independent oracle;
qualification reports GPU residuals against it separately from any later
palette-compression error.

`Uint16` supplies 65,536 indices including reserved zero. The initial
500-member source cannot exhaust it. Every generation validates its highest
member slot before execution. A configuration whose stable slot layout can
exceed 65,535 must select `Uint32` before construction or fail loudly; overflow
may never wrap, overwrite, or discard a source.

## Contained Ordered-Layer Oracle: Production Sun Disk

The accepted contained compositor uses this transient layer value:

```text
layerPixel = {
  radiance[15],
  occupiesPixel
}
```

The accepted contained full-screen compositor did not change the published
palette schema. Reserved palette entry zero remained exact zero, and its Sun
adapter:

1. projects the production disk center and angular radius into the current
   camera;
2. visits only its screen-space bounding rectangle;
3. classifies the pixel as Sun-occupied whenever geometric coverage is greater
   than zero;
4. projects a 512-segment angular-disk boundary, clips it against each candidate
   pixel square, and multiplies unchanged production native-15 disk radiance by
   that continuous overlap fraction;
5. overwrites an occupied pixel with that coverage-scaled Sun radiance, or
   leaves the stellar entry unchanged otherwise; and
6. constructs or reuses the final logical palette value and writes its index.

The production port does not repeat that dynamic full-screen palette rewrite;
it uses the source-local tile below. The current production Sun is not treated
as an unresolved point and its disk
radiance is not divided by pixel solid angle. Occupied pixels have continuous
coverage in `(0,1]`; numerically equal spectra may share a palette entry under
the ordinary palette policy. Atmospheric transmittance is absent
from the palette and is still applied once by the existing consumer after
lookup.

Layer order follows physical distance, not display brightness or source kind.
The first extension fixes stars behind the Sun. The schema permits a later
closer opaque Moon layer because transient occupancy remains independent of
radiance: an occupied Moon pixel may overwrite the back composite with an exact
zero spectrum. Once all layers are flattened, opaque black and empty black may
share the final zero palette entry because no behind-layer decision remains.
No Moon projection, texture, illumination, material, control, or qualification
work belongs to the Sun round.

### Future fractional-claim palette extension

For later overlap among resolved celestial layers, extend each logical palette
entry with one scalar `claimedFraction` in addition to its 15-channel spectrum.
The fraction records pixel area already claimed by opaque source support and is
independent of spectral magnitude. A black lunar texel can therefore claim and
occlude an area even when its spectrum is exact zero. Palette equality and
qualified-close sharing must include this scalar; entries with equal spectra
but different claims are not interchangeable while composition remains open.

For back-to-front composition of a nearer opaque layer with coverage `c`,
pixel-averaged spectrum `L`, back composite `R`, and prior claim `q`:

```text
R' = c * L + (1 - c) * R
q' = c + (1 - c) * q
```

This permits partial Sun/Moon overlap to combine spectra without allowing
light from a covered region to leak through. The claim may be discarded only
after all ordered layers have been flattened and no later compositor needs it.
This is a future contract change, not part of the accepted Sun-only schema or
current implementation.

### Production source-local Sun-disk tile

The resolved Sun should be prerasterized once into a compact disk-local tile
for a scene's viewport and projection scale instead of being flattened into the
full screen matrix whenever its screen location changes. The celestial shader
would transform the current pixel into Sun-tile coordinates, perform one
bounded tile lookup, and merge the returned coverage/claim and native-15
contribution over the stellar palette at the projected Sun location. This
remains O(1) per destination pixel and introduces no source or catalog loop.

For the current uniform disk, the minimal tile stores continuous coverage; one
shared native-15 Sun spectrum supplies radiance. The current any-positive-
coverage rule uses coverage greater than zero as the independent opaque claim
and coverage itself only to scale Sun radiance. If a later disk
has spatially varying radiometry, the tile may instead contain indices into a
small source-local spectral palette rather than a dense `tileWidth x tileHeight
x 15` field. A future Moon/overlap round may extend the tile with the fractional-
claim equations above; that future rule is not used by the current Sun-only
merge.

The tile is reusable while viewport resolution, projection/FOV, disk angular
radius, raster policy, and required sampling scale remain compatible. Camera
orientation changes only its placement transform. Source motion and every
other celestial animation are deferred. A scale,
projection, support, or tile-policy change rebuilds the tile. Scene depth still
masks the merged celestial result afterward. This changes the contained runtime
resource contract but is the selected production implementation. Production
ports it directly and does not first adopt the full-screen flattened Sun
representation. Its tile generator and fixed-cost merge are ordered standard
render-pipeline stages alongside the stellar generation and atmosphere/Color
consumer. Immutable run `000435` remains its correctness and visual oracle.

The physical Sun source is a sphere. The visible renderer deliberately reduces
that sphere to a circular projected disk; it does not promote the general
perspective conic of a sphere into an elliptical raster. The tile therefore
stores continuous circle/pixel-square overlap at the compatible apparent
radius. Camera orientation translates the disk center without changing that
circular support or forcing a rebuild when viewport, FOV/projection scale,
source support, and sampling policy remain compatible. This rendering
simplification does not change finite-source distance, parallax, atmospheric
illumination, or any source-owned spherical radiometry.
Promotion requires parity, filtering, edge-energy, invalidation, and resource-
lifecycle qualification.

### Later source-local Moon-disk tile

The Moon will use the same source-local tile and celestial-shader placement
architecture, but its tile setup is a separate, more complex stage. The Moon
tile owns projected disk coverage, `claimedFraction`, phase/terminator geometry,
and a grayscale lunar-albedo sample. The albedo sample scales a shared native-15
lunar reflectance spectrum and the physically derived incident solar
illumination; a dark or unlit texel still retains its geometric claim and
therefore occludes the Sun and stars behind it.

The celestial shader places the Moon tile in front of the Sun tile and stellar
palette, then applies the same fractional-claim composition. Spatially varying
Moon results should use a compact source-local palette/index tile when useful,
not a dense 15-channel screen field. Moon tile identity and invalidation must
add phase geometry, illumination direction, albedo-texture identity, lunar
orientation/libration policy, angular support, and the shared reflectance
spectrum to the Sun tile's projection-scale inputs. This architecture is a
declared future consumer of the tile seam; Moon implementation and qualification
remain outside the current Sun/star promotion round.

The Moon round also extends receiver-local lighting beyond source-owned direct
irradiance. Its ambient/adaptation input must include the visible celestial
radiance field represented by the Moon tile, Sun tile, stellar palette, and
atmospheric sky, integrated with declared solid-angle/cosine weights. Direct
Sun and Moon irradiance remains directional and must not be counted again in
the diffuse ambient term. The result must publish separate direct, diffuse-
ambient, and visible-field/adaptation ledgers so the same celestial luminance
cannot enter twice under different names.

A full Moon is a materially nonzero local-light condition, not merely a visible
disk or exposure cue. Its phase-dependent transported irradiance must drive
directional scene illumination and its associated shadowing. Moonlight scattered
through the atmosphere contributes a separate diffuse sky-ambient term that
fills surfaces outside the direct beam. The receiver-local lighting result must
therefore change continuously with lunar phase, elevation, atmospheric
transport, and occlusion; it may not collapse every Sun-below-horizon scene to
the current zero-secondary-source endpoint.

Moonlight is directional enough to cast scene shadows. The Moon round should
therefore evaluate a larger receiver-centered shadow extent than the current
local review region, with explicit distance/extent, resolution, precision, and
cost controls. A cascaded or otherwise partitioned shadow representation may be
selected if one enlarged orthographic map cannot preserve useful nearby detail.
The choice and its maximum supported range require visual and numerical proof;
an arbitrary increase to a hidden distance constant is not sufficient.

## Base Sparse Member-Addressed Palette

The required production representation reserves one candidate palette address
per canonical member but stores exact zero for unused or nonrepresentative
slots. It eliminates the screen-sized spectral field while preserving exact
collision sums and O(1) destination lookup. Its generation cost is the bounded
point-projection pass plus the declared `entryCapacity x 15 x memberCount`
palette pass; it is not the contained CPU builder's linear append algorithm.

This sparse shader-built path is the only path required for the initial
implementation and proof. Dense compaction remains optional.

## Optimization Path 2: Share Similar Palette Values

After exact per-pixel aggregation, qualified-close final spectra may share one
palette entry. Similarity is a physical native-15 error policy, not screenshot
similarity. It must bound at least:

- every channel's absolute residual;
- every materially nonzero channel's relative residual; and
- integrated spectral irradiance residual.

If this path is resumed, its simplest candidate is a standard-pipeline shader
compression pass after exact sparse aggregation:

1. retain each selected sparse representative's exact final spectrum;
2. assign qualified representatives with a deterministic bounded GPU
   algorithm; and
3. shader-write the remapped palette and matrix into a staging pair.

CPU palette construction or rewrite remains prohibited. Any future online GPU
compression must retain an exact per-pixel accumulator or equivalent
provenance; adding to an already approximated shared representative would
compound error.

Compression never removes a member or changes its pixel assignment. Exact
member-count and integrated-flux ledgers are evaluated before and after it.

This optimization is deferred and may not be necessary. No similarity policy
is selected. Do not add a compression implementation unless the project owner
explicitly resumes this path.

## Optimization Path 3: Reduce Matrix Index Width

After the final palette is complete, an optional standard-pipeline compaction
stage may construct a dense remap and shader-write a narrower successor matrix:

- if the remapped highest index is at most `255`, write an eight-bit unsigned-
  integer texture;
- otherwise retain the sixteen-bit unsigned-integer texture;
  or
- use the already selected wider representation when the qualified capacity
  requires it.

The threshold includes reserved entry zero. CPU rewriting/upload is not a
production path. Shader-side index-width rewriting changes no palette value or
pixel association and must reproduce every remapped index exactly.

## View Identity And Lifecycle

The matrix and its final palette are view products. Their identity includes:

- source roster and native-15 radiometry identity;
- complete celestial frame/epoch and observation time/location transform;
- camera and projection state;
- viewport dimensions and point-response policy; and
- screen-cache schema, numerical profile, palette policy, and index width.

Atmosphere definition and scene depth are not part of this cache identity:
shared transmittance and scene masking are applied by the consumer. Camera,
projection, or viewport changes invalidate the screen product for sampling and
make the standard pipeline generation stage refresh it, but do not rebuild the
pipeline, source photometry, or atmosphere transport. Observation time/location
is fixed for the installed configuration; changing it uses static replacement,
not animation.
A generation is consumable only when the generation shader's source,
epoch-relative time/location, camera, projection, and viewport identities all
match the frame.

The generation stage publishes the matrix, palette, identities, counts, and
precision metadata atomically at its standard stage boundary. Failure,
cancellation, or supersession preserves the last complete compatible
generation; a changed frame identity samples exact zero until a matching pair
is ready. Refresh and disposal release each GPU resource exactly once.

## Backend Boundary

Production must build the pixel-index matrix and native-15 palette in their own
first-class standard runtime-pipeline generation shader rather than
constructing either product on the CPU and uploading it. WebGL2 fragment
blending cannot directly combine palette indices or dynamically allocate
palette entries, so the generation stage must own an explicit deterministic
GPU algorithm, its transient resources, pass ordering, capacity handling,
synchronization, and cleanup through normal runtime assembly, installation, and
frame execution. Those mechanics may not leak into the atmosphere/Color
consumer. The contained CPU builder remains the independent correctness and
conservation oracle.

The runtime consumer samples an unsigned-integer screen texture (`R16UI` for
the base representation, `R8UI` after path 3) and a sampled native-15 palette
resource using exact texel addressing. Palette physical packing may span
multiple texture rows or layers, but logical addressing remains
`paletteIndex * 15 + wavelengthIndex`. Binary stellar occupancy is resolved by
the matrix-generation pass and creates no additional persistent GPU resource.

The source-driven generation shader must produce the same resolved per-pixel
stellar spectra and conservation ledger as the oracle. Its sparse member-
addressed indices and unused zero slots need not reproduce the contained CPU
builder's compact numeric index assignment. It may use transient working
storage, reduction, or fixed multipass construction, but it cannot replace the
persistent indexed contract with a full screen-sized native-15 field.

## Qualification Invariants

- Every eligible in-view stellar member is assigned exactly once.
- Off-frame, below-horizon, unsupported, and zero-radiometry members have
  explicit classified outcomes.
- Pixel collisions add every native wavelength channel; no overwrite,
  multiplication, or brightest-member selection occurs.
- Index zero and every empty pixel resolve to the exact zero spectrum.
- Every nonzero matrix index is in palette range.
- Base-path aggregate native-15 flux equals the eligible projected input under
  the declared point-response calculation.
- Similarity compression stays within its accepted physical error bounds.
- Index-width rewriting changes no resolved palette value.
- Atmosphere transport is applied once after palette lookup.
- Any positive Sun coverage transmits exactly zero stellar radiance and scales
  Sun radiance by its own coverage fraction; only exact zero coverage leaves
  the stellar pixel unchanged.
- Sun-layer occupancy is exactly boolean and is evaluated independently from
  the 15 radiance channels before the fixed-cost tile merge.
- Generation-pass cost, matrix bytes, palette capacity and active-entry counts,
  occupied pixels, collision counts, and optional compression ratios are
  reported.

## Explicitly Rejected Representations

- a persistent `width x height x 15` stellar spectral field;
- the historical member-by-receiver-by-direction transported field;
- atmospheric transport duplicated per member;
- a full catalog loop in each atmosphere fragment;
- index blending as though palette indices were additive;
- fixed-capacity collision buckets that can drop members;
- palette approximation driven by final display RGB or Color tuning;
- inferring celestial coverage or occlusion from nonzero luminance; and
- adding stellar radiance to an opaque Sun or future Moon pixel.

## Addendum: Unresolved Production Appearance Reconciliation

Status: superseded Ferwerda rejection record, 2026-08-19. The production visual
audit rejected the stellar brightness, daylight/sunset adaptation, and
foreground luminance balance even though their mechanical tests passed. The
owner has since selected the contained direct-source Bruneton luminance-lift
model defined above; runs `000466` and `000467` qualify its current spherical
and Flat/local capture matrices. The subsections below preserve the rejected
diagnosis and constraints but are not the active Color tuning path. Step 8
remains ineligible until the selected model is owner-accepted and separately
ported.

This superseded addendum preserves the former sky/celestial resumption order.
If the stellar/Color work is explicitly resumed, subsections A and B precede
subsection C. None is active while the solar-zenith cache plan owns current
execution. Foreground color and luminance in subsection C remain excluded as
tuning inputs, acceptance criteria, or compensating changes for the sky path.

### Governing sky objective

Keep the represented sky close to the unchanged Bruneton result while
increasing the visibility of dim celestial objects as the receiver-local light
level fades. Bruneton remains the physical atmosphere and daylight-appearance
reference. Ferwerda is a source-independent display/visibility response layered
after transport; it must not change atmospheric composition, scattering,
transmittance, celestial placement, or source radiometry.

In bright daylight the result should remain cone-dominant and converge toward
the Bruneton reference rather than visibly remapping an already legible sky.
Through sunset and night, a light-based adaptation input should progressively
increase dim-object visibility and introduce the accepted rod response without
washing out the remaining sky, flattening catalog brightness differences, or
clipping the stellar field to uniform white. The transition must be continuous
under changing light, independent of camera direction and viewport size, and
valid for both distant and finite/local source configurations. Foreground
appearance is outside this objective.

### A. One-pixel stellar brightness

Implementation status, 2026-08-19: the live pixel-solid-angle conversion has
been removed from the production screen-palette generator. The selected
camera-independent presentation policy is
`stellar-one-pixel-presentation-000435-v1`: multiply every native-15 catalog
irradiance channel by `60999.839486002405`, sum collisions in canonical member
order, and store the result as the palette's boundary radiance. The value is
anchored to run `000435`'s `1.639348576039236e-5 sr` center reference pixel for
continuity; that reference angle is provenance, not a live geometry input.
Atmospheric transmittance, masking, and the common Color path are unchanged.

The desired raster contract is now explicit:

- project each eligible catalog direction to exactly one screen pixel;
- assign that pixel a camera-independent native-15 palette value derived from
  the catalog member data, summing catalog values for collisions;
- apply the view-path atmospheric transmittance once;
- reject the contribution when scene geometry blocks the pixel;
- pass the transported result through the normal common Ferwerda Color path;
  and
- do not change stellar brightness as viewport dimensions or camera field of
  view change.

The confirmed defect is the live point-radiance calculation:

```text
stellar pixel radiance = catalog stellar irradiance
                         / live projected pixel solid angle
```

The ray-to-pixel projection is correct. The ray determines visibility, pixel
assignment, atmospheric path, and scene masking. It must not determine stellar
brightness through the angular size of the live pixel. The current division
makes a one-pixel star brighter when resolution increases or field of view
narrows.

Immutable run `000435-sun-layer-screen-palette-three-scenes` used the same
catalog spectra as production but only at its fixed `640 x 400`, 78-degree
vertical-field-of-view reference. Its three-hours-after-sunset frame contains
32 nonblack stellar pixels, no exact-white pixel, and peak byte values from 43
through 235. At the approximately `1460 x 821`, 50-degree production view from
the rejecting audit, the center live pixel solid angle is about 12.7 times
smaller than the experiment's center reference pixel; the old equation
therefore raises stellar radiance by about 12.7 before Color. Production's
`1e-6 cd m^-2` zero guard also produces a night rod scale about 1.33 times the
experiment's fixed `0.001 cd m^-2` condition.

The production correction must remove live pixel solid angle from stellar
brightness while retaining exact one-pixel placement. No separate stellar tone
mapper, post-Ferwerda gain, per-star adjustment, blur, point-spread footprint,
or additional renderer is selected. The unresolved contract detail is the one
camera-independent catalog-to-palette calibration needed to express a
point-source irradiance as the value consumed by the common Color path. That
calibration must be explicit, common to all unresolved point sources, preserve
catalog ratios and spectral color, and be qualified against run `000435`; it
must not be disguised as a live geometric solid angle.

This subsection supersedes earlier wording in this document that requires
live projected-pixel-solid-angle normalization or live-viewport integrated-flux
conservation for the one-pixel stellar presentation. Those statements remain
historical context until the palette quantity and calibration contract are
reconciled.

The production WebGL gate now proves the assigned value is identical across
viewport and FOV changes while placement and collision membership remain
view-owned. The exact `640 x 400`, 78-degree, sunset-facing Ferwerda control
peaks at byte `207` with zero exact-white pixels, versus the immutable peak
`235`. It shows `52` nonblack pixels over `6..207`, versus immutable run
`000435`'s `32` over `43..235`. That difference is an explicit pending visual
review item, not permission to reintroduce live solid angle or add a faint-star
threshold.

Before brightness-proxy work begins, the production Ferwerda survival gate
tracks all 500 fixed one-pixel spectra across eight adaptation levels from
`5070.201700912994` through `0.001 cd m^-2`. More than 96 percent of distinct
pre-Color luminances remain distinct after display conversion, rank correlation
remains above `0.9999`, no star collapses to full black or full white, and a
fixed faint-spectrum brightness ladder remains strictly ordered. This is the
required separation of concerns: Step C may change the condition-wide
adaptation input, but it may not repair stellar variation inside Ferwerda.

Required resolution gates are:

1. production reproduces the accepted `000435` night stellar value range at
   its reference camera and viewport;
2. the corresponding stars retain the same palette and display values across
   declared viewport-size and field-of-view changes, apart from changes caused
   by atmospheric path, visibility, collision membership, or scene masking;
3. every star remains exactly one raster pixel and collisions retain every
   native-15 member contribution; and
4. source identity comparison continues to prove zero difference between all
   500 experimental and production catalog spectra.

### B. World-adaptation brightness proxy

The experiment did not derive its successful daylight and sunset Ferwerda
conditions from direct-source brightness. It selected transported diffuse-sky
`E_v / pi`: `5070.201700912994 cd m^-2` at noon and
`3632.4668027619023 cd m^-2` at sunset. Its recorded direct-source proxies were
`33496.75245260507 cd m^-2` and `38.03611664763064 cd m^-2` respectively. The
direct contribution therefore changed by about 880 times while the selected
adaptation changed by only about 1.4 times. Three hours after sunset used the
separate fixed qualified reference `0.001 cd m^-2`.

Consequently, receiver-local direct-source brightness alone cannot reproduce
the accepted relationship. The production `brightnessProxy` must remain owned
by the lighting calculator and ultimately be light-based, source-agnostic, and
valid for spherical/distant and Flat/local configurations. Atmosphere must not
publish a diffuse-irradiance adaptation product, and no named time, Sun kind,
or scene-condition branch is acceptable. The missing ambient/diffuse lighting
contribution and zero-light policy remain unresolved; do not tune a scalar
direct-source ratio around them.

The existing source-owned renderer `ambientLightScale` is also rejected as
that missing contribution. Distant/spherical derives it from a source/up
smoothstep, while Flat/local uses a relative endpoint-lighting scale. Neither
is a unit-bearing measurement of received environmental light. A live Step C
audit confirmed that fitting a nonlinear response to those values can force
the recorded noon/sunset numbers or early stellar emergence, but cannot do so
without recreating the abrupt or washed-out twilight behavior. Those fitted
candidates were removed from production; Step C still requires a physical
receiver-local environmental-light input to `LocalLightLevelCalculator`.

Both current production pairings already retain the physical precursor:
their published native-15 cumulative scattering-density cache, transported to
the receiver by the common Algorithm32 path-radiance integration. They do not
retain environmental irradiance itself. The selected derivation is a
lighting-owned upper-hemisphere cosine integral of receiver incoming spectral
radiance, reduced to one native-15 irradiance packet after cache publication.
`LocalLightLevelCalculator` then applies the existing CIE photopic projection
and divides illuminance by pi. The reduction is fixed and camera-independent;
it does not read the framebuffer, camera, viewport, or Color output, and it
does not make Atmosphere an adaptation-data publisher. Spherical/distant and
Flat/local share this contract and shader topology while supplying their
normal geometry and scattering-cache contributions.

The renderer-neutral portion is implemented as a frozen 32-direction
cosine-weighted quadrature, `LocalLightLevelCalculator` native-15
radiance-to-irradiance reduction, and atomic
`ReceiverEnvironmentLightController`. Its weights sum to pi and uniform
radiance produces `E = pi L`. The first renderer-specific slice is also
implemented: `ReceiverEnvironmentLightGpuReducer` performs the same weighted
native-channel reduction in one real `R32F` array pass and reads back only the
resulting native-15 irradiance packet. A real WebGL2 comparison matches the CPU
reducer for a nonuniform 32-direction batch. This proves the reduction and
bounded-readback contract only; it does not yet claim transport parity. The
remaining sampler must obtain those 32 radiance packets by executing the common
path-radiance transport against the active GPU scattering cache for both
geometry pairings, then compare them with the independent CPU oracle before the
measurement can replace the live direct-source-only proxy.

The common-transport shader and CPU/GPU sampling surfaces now exist. They retain
the production geometry, atmosphere, source, cache, and transport contributions
and replace only camera-ray ingress with the fixed direction texture and Color
output with one selected native radiance channel. A real WebGL2 manufactured
constant-density gate matches CPU geometry path lengths for spherical/distant
and Flat/local. The gate also corrected the required Z-up quadrature to Y-up
scene-local conversion and proves a nonzero manufactured `R32F` field survives
the opaque runtime binding into transported radiance. Production-cache
interpolation with its complete domain context now passes for all 32 directions
by 15 channels on both spherical/distant and Flat/local N4 caches against the
independent CPU `Reference.evaluate` transport path. The maximum absolute
residuals are `1.262631788082058e-7` and `1.5092505500913234e-7`, respectively.
This is a compositional proof: its CPU cache adapter reads the complete active
cumulative field, while the sealed binary64-versus-R32F gates own
cache-construction parity. A fresh independent binary64 N4 browser construction
exceeded 15 minutes before sampling and is not a pass. The zero-output guard
remains intentional. The sampler and GPU reducer are now atomically bound
through the installed handle and controller/facade before the preflight Color
frame. Runtime binding values, rather than static defaults, supply live source
and geometry state. Exact-zero transported environment is accepted as a value,
not mistaken for failed execution.

The first live visual gate rejects the resulting Flat/local display behavior.
Spherical/distant sunset plus three hours publishes
`0.06158098018022135 cd m^-2` and exposes faint stellar points. Flat/local Flat
180 publishes exact zero and the current Ferwerda equations produce a white
frame. These are two separate questions: validate whether the transported
Flat/local environment truly integrates to zero, then correct the general
Ferwerda exact-zero condition without adding source kind, position, or named
scene policy.

Flat/local is a co-equal acceptance target. Its finite source must prove
inverse-square distance response, equal-distance orientation independence,
geometry-owned support/occlusion, bright-to-zero cone/rod continuity, and
camera/viewport/FOV invariance through the same lighting-calculator and
Ferwerda contracts used by spherical/distant. Passing only the distant-Sun
San Jose sequence is insufficient. The current absence of stars from a
Flat/local roster must be reported honestly; it does not permit the shared
one-pixel point-source contract to acquire spherical-only assumptions.

### C. Renderer foreground luminance

Run `000435` does not qualify locally illuminated foreground appearance. Its
review scene installs Lambert geometry but no Three ambient or directional
lights, and its noon and sunset foreground is black. The successful evidence
therefore covers atmosphere, Sun, stellar presentation, masking, and Ferwerda
for those fixed conditions, not a renderer-RGB-to-physical-luminance bridge.

The current production candidate scales Flat32 scene lights by
`sourceBrightness` and then multiplies the captured renderer-linear scene RGB
by `sourceBrightness` again at the Ferwerda composition boundary. This
double-applies source scale and makes finite/local response effectively
quadratic. Remove that assumption before selecting a replacement calibration.
The replacement must give renderer-linear scene RGB one declared relationship
to the absolute atmospheric/celestial domain, preserve material channel ratios,
and apply source variation exactly once. This is new production qualification,
not behavior recoverable from run `000435`.

### Resolution order

Resolve and qualify the issues independently:

1. correct the one-pixel stellar palette contract and prove reference parity
   plus viewport/FOV invariance;
2. define the lighting-calculator-owned aggregate brightness proxy and prove
   daylight, sunset, and night transitions for both distant and finite/local
   sources.

Stop active implementation at accepted sky/celestial appearance. Foreground
work remains deferred within this same production-port topic and working tree;
it does not move to a separate lane. When the owner resumes it here, define the
renderer-unit luminance bridge and prove that local scene light scale is
applied once.

Sky acceptance does not qualify foreground appearance. The combined Ferwerda
scene and Step 8 production-promotion evidence remain ineligible until the
deferred foreground contract is eventually resolved.

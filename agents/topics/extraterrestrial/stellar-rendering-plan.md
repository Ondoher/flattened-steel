# Stellar Rendering Plan

Status: successfully completed experimental lane. Immutable run `000435`
accepts the final contained visual review. Production porting was subsequently
completed through its accepted stellar/Sun stages; current residual decisions
are owned by the
[production closeout plan](../algorithm32/production/color-star-cache-closeout-plan.md).

The current representation contract is owned by the
[Stellar Screen-Palette Cache Design](stellar-screen-palette-design.md). This
plan derives its execution order from that design. The older celestial-cache
document and dense-cache runs remain read-only historical evidence.

## Closed Execution State

Current milestone: Work Plan steps 1 through 5 and 13, the owner-directed
data-derived diffuse-adaptation comparison, and the fixed-sunset-bearing
three-time render are complete. The exact indexed
cache, GPU lifecycle, and constant-time atmosphere composition boundary are
qualified in containment, as is the ordered production Sun-over-stars
extension. Immutable run `000435-sun-layer-screen-palette-three-scenes`
extends the step-13 evidence with solar-noon, sunset, and sunset-plus-three-hour
full-scene renders using the same indexed native-15 palette as the sole visible
celestial path. It supersedes the four-point visual review in `000431` by
geometrically clipping the projected Sun disk to pixel squares and multiplying
the Sun spectrum by each continuous overlap fraction. Step 6, qualified-close
palette sharing, is deferred and may not be necessary; do not execute it
without new project-owner direction. At contained-lane closure, production
promotion, Flat32 integration, temporal adaptation, acuity, ambient scene-
lighting integration, and Moon work were outside this plan. Subsequent
production work does not reopen that contained boundary. Immutable run `000427`
accepts step 13 and immutable run `000435` accepts its three-scene visual
review. Generated evidence remains under `tmp/extraterrestrial/` and the
contained evidence remains immutable.

Immutable run
`000421-stellar-ferwerda-diffuse-data-adapted-full-scene-sunset-noon`
(`2eca12746506c053335f25ff0df0ee39031d742f412945693a0a6f8c13f3302b`)
implements the camera-independent, non-framebuffer receiver-local diffuse
measurement selected after run `000420`. A contained calculator integrates the
accepted 32 upper-hemisphere atmospheric path-radiance samples with their
projected-solid-angle weights in all 15 channels and photopic luminance. The
weights sum to pi; the uniform-sky control exactly reproduces its input
luminance through `E_v / pi`. Sunset produces `11411.731021965596 lux` and
`3632.4668027619023 cd m^-2`; noon produces `15928.508415806737 lux` and
`5070.201700912994 cd m^-2`. With only those condition-wide Ferwerda inputs
changed, sunset exact-white pixels fall from `142080` to zero and noon maximum
byte rises from `161` to `255` with zero exact-white pixels. The measurement
contains atmospheric path radiance only. Direct celestial, stellar, and scene
geometry radiance, temporal adaptation, ambient Three lighting, tuning, and
production changes are excluded. The black ground remains an unqualified
missing-lighting region rather than a Color result. The sealed 16-artifact,
1,036,133-byte run was independently verified.

Immutable run
`000424-stellar-ferwerda-sunset-facing-solar-noon-sunset-plus-three-hours`
(`bb25bb1e23d4953ebcc20e8d1d9078bf24680dfcd75939bb732645a8358d324b`)
derives the camera bearing from the synchronized sunset direction and holds
that `-59.99625193137896` degree azimuth and `5` degree elevation fixed at
solar noon, sunset, and sunset plus three hours. Noon and sunset retain run
`000421`'s diffuse-data Ferwerda inputs. Because the accepted atmosphere
ledger has no exact three-hour hemisphere and Ferwerda requires positive
adaptation, the night scene reuses run `000417`'s qualified `0.001 cd m^-2`
starlight reference rather than inventing or interpolating diffuse data. The
three-hour capture contains 38 nonblack pixels and visibly renders the stellar
points; two reach exact white. Noon has 3,979 exact-white pixels in the
sunset-facing horizon field, while sunset has none. Ground remains black
because ambient Three lighting is still excluded. The sealed 17-artifact,
980,110-byte run was independently verified. Run `000423` is preserved as the
rejected first bearing conversion, which incorrectly treated local north as
positive camera Z and placed the sunset at the right edge. Run `000422` is the
preserved sandbox-denied Chrome-launch predecessor.

Immutable run `000414-stellar-screen-palette-san-jose-bruneton-render`
(`b716a5e6069eb9eb3be72a7563d15f2ebb903477f63dfec39a9cc5a84f0ec369`)
is the first render of the accepted screen-index/palette representation. It is
a deliberately isolated upper-bound diagnostic at the fixed San Jose
sunset-plus-three-hours view: zero path radiance, unit view transmittance,
clear visibility, and unchanged Bruneton Figure-1 Color with exposure modifier
`1`. Real WebGL2 consumed the `52` occupied pixels and `53` palette entries via
one index fetch and one fixed native-15 palette-fetch loop. All `52` stellar
pixels were nonzero before framebuffer quantization, with maximum display
channel `0.00009357929229736328`; the final unsigned-byte PNG contained zero
nonblack pixels because every value rounded to zero. This is not a full
atmosphere or scene integration claim. The sealed 16-artifact, 541,051-byte run
was independently verified, and no visibility or Color tuning followed it.

Immutable run `000415-stellar-screen-palette-san-jose-bruneton-render`
(`23d0e9b2b9e6f255143c7a5caff4b9f7396a313acd8a1f17c49a243193f7f2ac`)
adds the requested contained adaptation of production's exposure-only
`LocalLightLevelCalculator` policy. The fixed Sun is below the horizon, so the
provisional direct-source adapting luminance is exact zero; the production
Ward relationship derives modifier `10.50268593548108`. The shader multiplies
the unchanged Figure-1 coefficient by that one positive achromatic modifier,
with no sky probe, temporal smoothing, secondary ambient source, or spectral
change. A paired WebGL2 run held cache, radiometry, and composition fixed. The
baseline maximum display channel was `0.00009357929229736328`; production
exposure raised it to `0.0009818673133850098`. Both variants retained all `52`
nonzero floating-point stellar pixels, but both unsigned-byte PNGs remained
exact black because even the adapted maximum was below the half-code threshold.
The sealed 17-artifact, 563,290-byte run was independently verified. It remains
an unattenuated star-only upper bound, not full atmosphere or scene integration.

Immutable run `000416-stellar-screen-palette-san-jose-bruneton-render`
(`668376005750054f0944bc22d9a20a2de9f42880b973571c57a573edeebbe84d`)
accepts the temporary contained output-encoding hypothesis test. It adds the
standard piecewise sRGB OETF after unchanged Bruneton mapping behind a render
control and executes a `2 x 2` matrix: baseline/production exposure crossed
with direct-linear/sRGB output. Both direct-linear variants remained exact
black. Baseline plus sRGB encoding also remained exact black, with maximum
encoded float `0.001209044479764998`. Production exposure plus sRGB encoding
raised the maximum encoded float to `0.012685725465416908` and produced `7`
nonblack pixels with maximum unsigned-byte value `3`. Every variant retained
all `52` nonzero floating-point stellar pixels. This confirms that output
encoding and production exposure together cross the current 8-bit boundary;
it does not establish full atmospheric visibility or authorize a production
Color change. The temporary branch exists only in the contained renderer. The
sealed 19-artifact, 597,485-byte run was independently verified.

Immutable run `000412-stellar-screen-palette-atmosphere-composition-proof`
(`cab927484f049014ef8e648564188bea80c79a767af1ded898ef4ac641ec19af`)
accepts step 5. The real WebGL2 consumer uses one integer index fetch and one
fixed 15-channel palette-fetch loop, with no catalog iteration or palette
search. Seven numerical controls matched the binary32 oracle exactly and the
binary64 physical equation within `6.03144705474324e-8` relative error.
Empty, scene-masked, horizon-masked, and zero-transmittance cases preserved
path radiance exactly; unique and collided fractional controls proved that
shared transmittance is applied once rather than squared. The output remained
native-15 pre-Color radiance. The sealed 17-artifact, 1,069,640-byte run was
independently verified from accepted run `000411` artifacts.

Immutable run `000411-stellar-screen-palette-indexed-gpu-resource-proof`
(`ebca4daac3175e4486db60c51b6cef0cd64207c934cff7aeff13efe6b7a3cfe0`)
accepts step 4. Real WebGL2 uploaded the fixed cache as a 640 by 400 `R16UI`
matrix and a 15 by 53 `R32F` palette. Direct readback and exact shader
`texelFetch` matched the CPU `Float32` oracle with zero error for empty,
unique, constructed-collision, and restored-collision pixels across all 15
wavelengths. Exact reuse, view/source invalidation, atomic replacement,
partial-allocation cleanup, real context restoration, and exactly-once
terminal handling passed. The sealed 19-artifact, 1,570,250-byte run was
independently verified. Run `000410` is a preserved browser-launch setup
failure that did not reach GPU evaluation.

Immutable run `000409-stellar-screen-palette-exact-cpu-builder-proof`
(`e1b684575f10d9b6ca6ea6abe4ab756c167bc6c697a9fdb65f66e68623a93572`)
accepts step 3. It reproduced the accepted 500 native-15 packet set, published
the fixed 640 by 400 view as a 512,000-byte `Uint16` matrix plus a 53-entry,
3,180-byte `Float32` palette, and conserved every binary64 channel exactly.
The maximum relative binary32 packing residual was
`5.8398511095706926e-8`. Its constructed collision control added three
positive spectra channel by channel into one pixel, retained one explicit
zero-radiometry member as zero, and recorded two collisions without loss.
View-identity change, atomic replacement, injected-failure preservation,
Uint16 capacity rejection, and exactly-once disposal passed. The sealed
nine-artifact, 18,182-byte run was independently reverified. It directly
inventories Algorithm32 and Flat32 without invoking Git. Runs `000407` and
`000408` remain preserved historical records; `000407` did not reach
scientific evaluation.

Immutable run
`000406-stellar-screen-palette-fixed-observation-projection-proof`
(`7dd00b078d6a058cb7feabe95df9d86c148ee1048c92ce4d484610a750d41620`)
accepts steps 1 and 2. The checked 500-member FK5/J2000 roster was transformed
through the fixed San Jose observation, local ENU, perspective camera, NDC, and
top-left row-major viewport. Results were 52 occupied/in-frame, 188
above-horizon/off-frame, 260 below horizon, zero invalid, and zero unsupported.
All 52 occupied projections used distinct pixels, so that run alone did not
qualify collision aggregation; accepted step 3 subsequently supplied the
constructed collision controls. The sealed 9-artifact, 136,227-byte run was
independently reverified, and complete Algorithm32/Flat32 inventories were
unchanged.

Runs `000403` through `000405` are preserved non-qualifying records for a
sandbox-denied read-only Git process, durable-JSON schema correction, and an
unsealed finalization attempt respectively. They do not reject the transform.

### Cache Representation Revisit

The retained accepted cache evidence used one dense `352 x 208 x 15` `R32F`
array: 512 member tiles, each containing the complete `11 x 13 x 15`
receiver/direction/spectral transported field. It holds `1,098,240` scalar
slots (`4.19 MiB` at binary32), of which `1,072,500` belong to the 500 active
members and `25,740` to twelve zero-capacity tiles. Construction integrates
only one shared `11 x 13 x 15` atmospheric transmittance field, then spends CPU
time and memory multiplying and copying that same field across all 500 source
spectra. The GPU construction pass only copies the packed binary32 payload into
the `R32F` resource.

The current dirty production work is unaccepted. It removes the full-payload
canonical hash and preserves the packed payload as a typed array, which avoids
diagnostic-only traversal and scalar boxing. It also provisionally expands the
physical field to `352 x 210 x 15` and stores 500 placed direction triplets in
two additional rows of layers zero through two. That layout contains
`1,108,800` scalar slots (`4.23 MiB` at binary32); the direction-row change was
not qualified and is not the selected representation. A focused browser build
of the preceding fixed-constant shader exceeded five minutes, and the
direction-row attempt was stopped before it produced a result. This compile
observation motivates keeping member directions out of generated GLSL, but it
does not accept the expanded dense cache.

The project owner has clarified the intended design boundary:

1. `StellarPointSetSource` owns one ordered array of 500 extraterrestrial point
   sources. Each member carries its identity, celestial-sphere position in a
   declared frame and epoch (encoded as a unit vector), and native-15
   top-of-atmosphere spectral irradiance packet.
2. Geometry combines each canonical celestial position with the observation's
   geographic anchor and instant, expresses the star in the active model and
   camera frames, and projects each eligible member as one unresolved point.
3. Atmosphere owns one source-independent transmittance representation over
   receiver and ray direction. It is not replicated per stellar member.
4. A screen-palette builder transforms every eligible member with the current
   celestial, camera, projection, and viewport state and assigns the unresolved
   point to a destination pixel. The first reference builder is CPU-owned; a
   later source-driven GPU builder must reproduce it. The required persistent
   output is one screen-sized integer palette-index texture plus its native-15
   palette, not a screen-sized native-15 field.
5. The atmosphere shader performs one fixed screen-pixel fetch of that spectral
   index and its palette entry, applies shared transport and the existing
   scene-hit policy, and adds it before the common Color stage. It never searches
   the stellar catalog.

Conceptually the members are independent light sources. In the current type
system they are immutable `StellarSourceMemberDefinition` records rather than
500 instances of the general Sun-oriented `LightSource` class. That distinction
preserves the intended ownership without requiring 500 controllers or caches.

“Unit direction” is the Cartesian encoding of a point on the celestial sphere,
not a replacement for celestial coordinates. Right ascension/declination and a
unit vector are equivalent only when the vector remains attached to its named
frame and epoch. The geographic anchor is observation state used to derive a
topocentric/local placement; it is not implicitly baked into the catalog
vector. Current production records `celestial-rh-v1` and the epoch
`2000-01-01T12:00:00Z`, but its
`SphericalEarthGeometry.expressCelestialDirectionInModel` implementation uses
observer latitude and longitude and does not use either the observation instant
or source epoch. That is an incomplete placement transform: it leaves the
stellar field Earth-fixed. Cache-representation qualification must first name
and test the complete celestial-frame/epoch/geographic-anchor/observation-time
transform whose output the indirection represents.

The project owner has fixed the per-star source-radiometry boundary. Static
source storage contains exactly one native-15 packet per member. At `Float32`, this is
`15 * 4 = 60` bytes per star and is addressed by
`memberIndex * 15 + wavelengthIndex`. It stores no celestial coordinates,
transformed directions, receiver nodes, support, angular extent, template
parameters, or atmospheric transport.

Canonical celestial position and member identity remain source/catalog data,
outside the screen cache. Geometry owns observation-specific placement and
point projection. A catalog-scale spatial index may accelerate
view selection, but the atmosphere shader does not perform ray-to-member lookup.
Index storage is reported separately from the native-15 contribution palette.

Every active stellar member is an unresolved point. General celestial contracts
may support extended sources for the Sun, Moon, or later bodies, but must not
cause stars to acquire a disk radius, surface profile, or extended-support cache
entry. Runtime point-footprint conversion may distribute the point's integrated
flux to a pixel; it does not change the source into an extended emitter.

The point assignment and accumulation path are lossless. Every catalog member
whose celestial point lies in the active view footprint and has valid geometry
and horizon support contributes exactly once. A star outside the view or below
the geometry horizon is a classified zero, not a missing render. Scene depth is
applied later by the consumer and does not alter the screen cache. Multiple
members in one spatial cell or pixel add all 15
channels; no single-member overwrite is permitted. Fixed bucket capacity,
overflow loss, magnitude cutoff, brightest-N selection, and silent subpixel
discard are prohibited. Qualification must conserve the eligible member count
and native-15 integrated flux through indexing, point assignment, collisions,
and accumulation.

The persistent screen representation is a dense integer matrix plus a palette
of native-15 final pixel contributions. Index zero is reserved for the exact
zero/empty packet. The initial correctness path uses `Uint16`; it creates one
exact palette entry for each occupied pixel, writes that entry's index into the
pixel matrix, and adds every later stellar contribution landing on the same
pixel channel by channel. No star is overwritten. If the number of palette
entries exceeds the `Uint16` address space, construction widens or fails
loudly; it never drops a member.

Palette representation may later merge close native-15 final pixel
contributions. This is a lossy value approximation, not permission to omit a
catalog member. “Close” must be defined by an accepted physical spectral error
bound, including integrated irradiance and per-channel absolute/relative
residuals before Color. Palette construction may not use screenshot similarity
or tune Bruneton. Similarity matching occurs only after exact per-pixel
aggregation, or construction retains a separate exact accumulator per occupied
pixel; using an already approximated shared entry as the input to another
collision would compound error. An incremental implementation therefore uses
reference counts and copy-on-write: a uniquely referenced entry may be replaced
by its exact combined sum, while a shared entry causes lookup or insertion of a
new combined value and repoints only the colliding pixel.

After the complete palette is known, the matrix may be rewritten from
`Uint16Array` to `Uint8Array` when the palette length, including reserved zero,
is at most 256. Index width is a storage optimization and is not part of the
physical result. Canonical celestial coordinates and source native-15 packets
remain catalog/geometry inputs rather than screen-cache payload.

The new stellar stage lies between geometry-data production and final
atmosphere composition. Its selected output contract is a screen-sized integer
texture plus an associated native-15 palette. The output matrix and palette are
view products: camera, projection, viewport, geographic anchor, or observation
time changes require them to be regenerated unless a later GPU construction
path produces the equivalent result directly each frame. Source radiometry and
canonical catalog data remain reusable. The atmosphere shader performs constant
screen-pixel composition work. Scene depth/hit remains the authoritative
foreground mask.

The staged construction paths are:

1. correctness: exact unique final value per occupied pixel in a `Uint16`
   matrix, with channel-wise collision sums;
2. palette compression: share qualified-close final pixel values, using exact
   aggregation plus reference-counted copy-on-write or a post-aggregation
   deduplication pass; and
3. matrix compression: rewrite the finished matrix to `Uint8` when its palette
   has at most 256 entries.

Only path 1 is required for the first implementation. Paths 2 and 3 must remain
separable optimizations with identical member and flux conservation semantics.
Integer palette indices are not additively composable: fixed-function blending
cannot turn two indices into the index of their summed native-15 contribution,
and ordinary WebGL2 raster shaders cannot safely read-modify-write the same
index texture or dynamically allocate palette entries. The CPU screen-palette
builder owns exact aggregation and palette allocation for path 1. A later GPU
builder must demonstrate equivalent semantics. A full screen-sized native-15
persistent output is not an acceptable fallback; any transient working
representation must be separately justified and measured.

The rejected canonical-sphere inverse lookup remains design evidence. It avoids
rebuilding a view product but replaces ordinary point projection with spherical
footprint, hierarchy, seam, and filtering logic. The selected screen cache
accepts view regeneration in exchange for simple point assignment and O(1)
atmosphere-pixel lookup.

This rejects both problematic properties of the current WIP: do not construct
a member-by-transport dense field, and do not loop over catalog members for
every fragment. The cache/representation round must qualify the view-specific
pixel-index/palette scheme, screen-palette builder, exact spectral
aggregation, and shared transmittance field. Their identities
remain separate: catalog/photometry changes affect the source roster; placement
or geometry-partition changes affect the indirection; atmosphere/domain/
numerical-profile changes affect transmittance. Publication must expose one
compatible set and preserve the prior set on failure, cancellation, or
supersession.

The 500-member roster is an initial qualification dataset, not a cardinality
contract. Remove `500`, capacity `512`, the `32 x 16` member tiling, and a fixed
fragment catalog loop from the long-term representation. Catalog-scale view
selection may use a persistent hierarchical or cell-sorted index in the
canonical celestial frame, after which geometry projects every selected point
forward. Its cost is output-sensitive in selected stars; atmosphere-pixel cost
remains constant.

The scalability gate must report payload and index bytes per member, occupied
cell overhead, build/load time, query candidate counts, worst observed bucket
occupancy, view-footprint expansion, and behavior at multiple catalog sizes.
Any level-of-detail or unresolved aggregate representation must conserve all 15
spectral channels and remain a separately reviewed policy; silently dropping
faint members is not an indexing solution.

The next evidence is representation-only. It must verify all 500 transformed
members and their classified outcomes, exact empty and occupied pixel queries,
boundary and collision cases, `Uint16` capacity enforcement, per-channel
conservation, palette packing residuals, storage and construction cost, view
invalidation, replacement, failure, and disposal.
A live raster or subjective capture is explicitly outside this gate.

Immutable run `000402-production-local-light-exposure-qualification`
(`0696e2a69cb9179763a7de9cce0d058afe88944959f43b3c47872a5cdb0d46a2`)
accepted both production typechecks, twelve focused production specifications,
and stable authorized-source fingerprints. `LocalLightLevelCalculator` now
derives the normalized Ward target from receiver-local adapting luminance:
semantic zero maps to `10.50268593548108`, values below `5 cd m^-2` decrease
monotonically to identity, and all values at or above `5 cd m^-2` return exactly
`1`. The `Algorithm32` facade owns the unsmoothed live target and rejects caller
override. Bruneton Color consumes it as one global achromatic uniform multiplied
around the unchanged Figure-1 coefficient. The CPU path exposes the same
operation. The configured primary Sun is automatically measured from its
source-owned incident scale, finite-source falloff where applicable, and
geometry-owned horizon support during facade preparation. Atmospheric
attenuation inside a nonzero direct-light proxy is not yet included. Failed
runs `000400` and `000401` preserve two type-boundary corrections; all of their
focused behavioral specs passed. No render was produced.

The project owner authorized direct `src/algorithm32` and `src/flat32` work
from the current commit baseline. Immutable runs `000396` and `000397` preserve
qualification setup failures caused respectively by Windows `.cmd` launch
`EINVAL` and sandbox-denied child-process `EPERM`; neither evaluated the code.
That earlier authorization is superseded for the active stellar screen-palette
subsystem: its first implementation and qualification are contained outside
production.
Escalated immutable run
`000398-production-local-light-exposure-qualification`
(`6224d66305d231271a7e540eb14687f18ac91acda0fa06eedce38d3859442af6`)
accepted Algorithm32 and Flat32 typechecks, five focused production specs, and
stable authorized-source fingerprints. The `Algorithm32` facade now creates a
`LocalLightLevelCalculator` with each prepared configuration. Its new
`modifyExposure` operation returns the unchanged baseline, one caller-supplied
positive achromatic modifier, and their effective product. No automatic curve,
smoothing, Color connection, tuning, or render was added. Both Flat32 modes
already create this facade and therefore receive the calculator without a
separate Flat32 code change.

Latest accepted evidence: run `000389-pre-g9-stellar-photometry-proof`
(`fbf1fda5458c93a63690bbf4c1d760a7cf1c3d3c75f5f9df52f518427c5b1c6e`)
revalidated all 500 source-owned native-15 photometry packets. Runs `000387`
and `000388` are preserved failed setup attempts caused respectively by the
sandbox denying the runner's read-only Git process and the containment policy
not yet naming this canonical plan as mutable. The policy now names the plan;
neither failure reached scientific evaluation.

Run `000390-pre-g9-stellar-celestial-source-proof`
(`61a22db09b2c55dfdb36c81a488a7c6d1e933410a21e28130b5c10158ad779f3`)
revalidated the 500-member source/definition/placement boundary and its live
placement refresh without changing static catalog identity.

Work Plan step 2 is complete. Run
`000391-pre-g9-stellar-tiled-cache-cpu-proof`
(`819e3696bccc275c0fbabe452caa2320da47ed802388c3c9efab6194b78f2f3a`)
revalidated the complete binary64 transport field, 500 active member tiles,
twelve exact-zero slots, binary32 packing conservation, and placement-only
identity stability for the selected 352 by 208 by 15 plan.

Run `000392-pre-g9-stellar-tiled-cache-proof` is a preserved failed GPU setup
record. It exposed fixture drift: the browser-only structural source supplied
transport packets but not the canonical-direction method now required by the
tiled cache. The bounded repair adds deterministic unit directions to that
synthetic structural fixture; it changes neither scientific input nor cache
semantics.

Work Plan step 3 is complete. Run
`000393-pre-g9-stellar-tiled-cache-proof`
(`6434883b022e8db69bb21cfcf2d21c82f29f5de079babbf87036e6c7bf4f55aa`)
accepted the real WebGL2 352 by 208 by 15 `R32F` resource, all-layer cache
construction, selected binary32 readback, exact-zero unused tiles, scheduler
yielding, and preservation of the published generation after injected failure.

Work Plan step 4 is complete. Run
`000394-pre-g9-stellar-live-raster-proof`
(`c7da6e67f25aa97e5f05d4ab4efad22b9303e64597cd86f711b644ca0f8a8fd9`)
accepted the normal runtime's complete stellar binding, bounded exact-footprint
`E / Omega_pixel` raster, exact pixel-solid-angle calculation, live scene-hit
suppression, and off-frame control. This was a numerical raster gate, not a
subjective scene capture. No visibility or Color tuning followed it.

Work Plan step 5 was executed exactly once. Run
`000395-stellar-first-render-san-jose-sunset-plus-three-hours-pure-bruneton`
(`65ddd198b881fd171e0e0da81e92b49635fe43e23f1168f9989d24dced9c54a2`)
is the terminal spherical San Jose capture at synchronized sunset plus three
hours. Its shader contains cumulative atmosphere, live Sun, live stars, and
pure Bruneton Figure-1 Color; it contains no sky probe or visual-adaptation
gain and uses display scale `1`. The 640 by 400 framebuffer contains zero
non-black pixels and mean RGB `[0, 0, 0]`. The retained capture is
`captures/san-jose-globe-sunset-plus-three-hours-pure-bruneton.png` inside the
run.

The finest evidenced boundary is deliberately limited. Run `000394` proves a
selected transported stellar cache value of `4.601594452702251e-11` and a
clear-minus-blocked live-raster response of `1.1270073763114397e-8`. Run
`000395` proves the requested scene assembled that stellar consumer but its
final framebuffer was exact black. The requested scene did not record a
per-star pre-display probe, so the exact intermediate collapse point is not
claimed. Do not rerender, tune, add instrumentation, change Color, change
exposure, strengthen stars, or alter raster/atmosphere behavior from this
result unless the project owner starts a new task.

Post-run read-only diagnosis localizes the black result to display scale and
scene lighting rather than a runtime failure. Run `000395` completed one frame,
completed one scene-input capture, and reported zero render errors. The Sun's
up component was `-0.4157173763191899` (about `-24.6` degrees altitude), so the
scene is well into astronomical night. The pure-Bruneton harness contains no
ambient or directional scene light and uses a pure-black background, making
the ground and review boxes black by construction. Independently, an
optimistic no-atmosphere upper bound evaluated all 500 source packets at the
center-pixel solid angle for the retained 640 by 400, 78-degree view. The
brightest result, `bsc-v50-hr-2491`, mapped through fixed Figure-1 Bruneton to
peak display value `0.00031853709448970147`, only `0.08122695909487387` of one
8-bit code and below the half-code rounding threshold `0.00196078431372549`.
Atmospheric attenuation only lowers that bound. Therefore all stars quantize
to zero in the captured unsigned-byte framebuffer even if they are correctly
transported and rasterized. No corrective change was made.

The repository was clean at the 2026-08-17 execution start. The project owner
authorized carrying the contained path through exactly one spherical San Jose
render at local sunset plus three hours. Preserve the render even if no stars
are visible, report the first boundary reached, and stop without visibility,
exposure, Color, source-strength, point-response, or atmosphere tuning.

No production promotion has occurred. Until the contained result is accepted,
implementation remains below `scripts/extraterrestrial/` and generated evidence
remains below `tmp/extraterrestrial/`.

Work Plan step 1 is complete in
[`scripts/extraterrestrial/stellar-production-reconciliation-ledger.md`](../../../scripts/extraterrestrial/stellar-production-reconciliation-ledger.md).
It selects the retained 512-slot tiled `R32F` representation without redesign.
The exact current production disconnect is `ShaderBuilder` returning every
stellar controller/resource/identity field as null after constructing the
spherical celestial query packet. The contained candidate is compatible for
the bounded proof rerun; later production adaptation must preserve production's
Vmag/HR member order and must not port the candidate's abandoned sky-probe or
Color path.

The then-mutable contained candidate was aligned with that Color decision. Its
Bruneton shader uses the fixed Figure-1 coefficient directly, declares no sky
illuminance texture, computes no visual-adaptation gain, and installs no sky
probe. The first-render harness fixes its display scale to `1`, supplies the
canonical Figure-1 constants unchanged, and records these facts as shader
assertions. No production Color source was changed.

This document is the canonical plan for getting stars to render. It extracts
the usable stellar work formerly distributed across the Stage 12 experiment,
the promotion backlog, and production-integration Step 7. Those documents and
their immutable runs remain evidence; they are not the active work queue.

## Goal

Render the reviewed stellar point set through the normal spherical Algorithm32
path in one controlled night scene:

```text
stellar source packets
  -> geometry placement and screen-pixel assignment
  -> exact per-pixel native-15 aggregation
  -> integer screen matrix plus native-15 palette
  -> shared atmosphere transmittance and scene masking
  -> additive pre-display spectral composition
  -> fixed Bruneton Figure-1 Color
```

The first success is a correct end-to-end result, not universal visibility.
Stars may disappear below the horizon, behind scene geometry, outside the
view, under bright atmospheric scattering, or below the fixed display
threshold. The implementation must not add a star-specific exposure, magnitude
cutoff, overlay, invented angular radius, or daylight visibility rule.

## Current Production Boundary

Production already owns:

- `StellarPointSetSource`, containing the reviewed 500 brightest valid BSC
  V/50 members in stable V-magnitude/HR order;
- fixed native-15 apparent irradiance packets produced by the accepted
  bracketed Pickles/Johnson B/V policy;
- the `spherical-sun-stars-radial-v1` roster and canonical static stellar
  directions;
- spherical placement, per-member direction stencils, and the celestial query
  packet;
- renderer/build-context types and the distinct
  `cache.celestial.starTransport` binding slot; and
- common additive celestial composition followed by fixed Bruneton Color.

The first disconnected boundary is the stellar cache implementation. The
production types declare a stellar plan, controller, resource, and runtime
binding, but `ShaderBuilder` currently returns all stellar cache fields as
`null`. Production has no stellar cache controller/resource implementation and
no live point-raster shader contribution. The source data is therefore valid
but cannot reach a pixel.

This is the restart point. Do not redo catalog acquisition, photometry fitting,
Sun-disc work, or Color work unless a current compatibility check exposes a
specific defect.

## Fixed First Capability

The first capability is deliberately bounded:

- spherical geometry only;
- the existing 500-member source and its declared catalog epoch;
- one complete celestial-frame/epoch to fixed-observation placement transform;
- current native-15 basis and atmosphere profile;
- one separately owned stellar cache and binding;
- unresolved point response with conserved integrated flux;
- current scene-hit visibility and additive HDR composition; and
- fixed Bruneton Figure-1 Color with no exposure adaptation.

Animated Earth rotation, dynamic placement refresh, Flat-dome stars, catalog
expansion, diffuse Milky Way content, and release-grade real-sky alignment are
later capabilities.

## Selected Design

The selected representation is the
[Stellar Screen-Palette Cache Design](stellar-screen-palette-design.md): one
view-sized unsigned-integer index matrix and one native-15 palette of final
stellar pixel contributions. The first implementation reserves zero, uses
`Uint16`, owns one exact palette entry per occupied pixel, and adds colliding
stellar spectra channel by channel. Qualified-close palette sharing and
`Uint8` rewriting are later independent optimizations.

The accepted step-13 schema composes ordered celestial layers into the same
screen index and native-15 palette without adding a persistent field. Binary
occupancy is independent, builder-owned transient state. Stars are the additive
back layer. The current production Sun disk is the first resolved opaque front
layer. A pixel belongs to the Sun whenever disk coverage is positive; it then
belongs entirely to the Sun while its Sun radiance is scaled by the measured
coverage fraction. Only exact zero coverage retains the stellar pixel. The
uncovered fraction of a Sun-owned pixel does not admit stellar radiance. The
coverage/radiance separation allows a later opaque Moon layer, but Moon work is
not part of this round. The any-positive rule is
provisional: a later Sun/Moon-overlap step may replace it with depth-ordered
fractional composition. The selected future direction is to associate one
`claimedFraction` scalar with every logical native-15 palette entry. Composition
updates both the pixel-averaged spectrum and claimed area; occupancy remains
independent of radiance so an exact-black Moon texel can still occlude the Sun.
Palette sharing must compare both fields. The current Sun-only schema remains
unchanged until that future overlap step is authorized.

The prior `352 x 208 x 15` member-by-transport field, its 512-slot capacity,
and its fragment catalog traversal are rejected as the current representation.
They remain immutable comparison evidence only. Never import a runner,
generated artifact, candidate facade, aggregate controller, or historical
cache file into production.

## Work Plan

### 1. Freeze the screen-cache contract — complete

Use the canonical design to define contained contract types that mirror the
intended production seams for:

- `width`, `height`, and row/coordinate convention;
- reserved zero and native-15 palette layout;
- `Uint16` base indices and explicit overflow behavior;
- source, geometry/view, numerical, schema, and palette-policy identities; and
- atomic generation publication, replacement, failure, and disposal.

Reconcile these types read-only with the current production source, geometry,
ShaderBuilder, and cache-resource seams. Retained dense-cache modules are
comparison evidence, not adaptation targets. Create the new implementation
surface below `scripts/extraterrestrial/`; do not modify the sealed baseline or
candidate.

### 2. Complete fixed-observation stellar projection — complete

Implement and prove the declared catalog-frame/epoch through observation time,
San Jose geographic anchor, local/model, camera, clip, viewport, and pixel
transform. For every source member, record exactly one classified result:
occupied pixel, off-frame, below horizon, unsupported, or invalid input. The
500-member fixture is the first dataset, not a hard-coded loop or capacity.

### 3. Implement the exact `Uint16` CPU builder — complete

Build the required base representation only:

1. allocate the zeroed `Uint16Array(width * height)` and zero palette entry;
2. project every eligible member exactly once;
3. create one exact native-15 entry for the first member in an occupied pixel;
4. add later colliding contributions channel by channel in place; and
5. publish the complete matrix/palette pair atomically.

Use high-precision working accumulation and explicitly pack the accepted GPU
palette precision. Prove index validity, empty zero, occupied-pixel count,
collision count, all-member classification, per-channel conservation, packing
residuals, capacity behavior, construction time, and storage. Do not implement
similarity compression or `Uint8` rewriting in this step.

### 4. Upload and qualify indexed GPU resources — complete

Upload the matrix as an unsigned integer texture (`R16UI` for the base path)
and the palette as an exactly addressed native-15 sampled resource. Read back
selected empty, unique, and collided pixels and all 15 wavelengths against the
CPU builder. Qualify exact reuse, invalidation on view changes, atomic
replacement, injected failure, context restoration, and disposal.

### 5. Connect constant-time atmosphere composition — complete

At each atmosphere pixel, fetch one integer index and one palette spectrum,
apply shared view transmittance once, apply the existing horizon/scene-hit mask,
and add the result to atmospheric path radiance before unchanged Bruneton
Color. The atmosphere shader may not traverse the catalog, search the palette,
or apply star-specific display behavior.

Accepted run `000412` qualifies this numerical boundary only; it does not
authorize a subjective render during the cache round.

### 6. Optimize palette sharing separately — deferred

After the exact base path is accepted, define the physical native-15 similarity
thresholds. Compress exact final per-pixel spectra in a post-aggregation pass,
or use reference-counted copy-on-write while retaining exact per-pixel working
sums. Prove error bounds, reference accounting, deterministic output,
conservation, and measured memory/time benefit before accepting it. This step
may not be necessary and requires new project-owner direction before execution.

### 7. Optimize matrix width separately — deferred

After the final palette is known, rewrite `Uint16` indices to `Uint8` only when
the entry count including reserved zero is at most 256. Prove every rewritten
index resolves to the same palette entry and report the exact matrix-memory
reduction. Otherwise retain `Uint16`; select `Uint32` before construction when
the declared occupied-pixel capacity requires it.

### 8. Promotion decision — complete

After the contained indexed cache, lifecycle, GPU resources, and constant-time
consumer are accepted, request explicit authorization before adapting any code
into `src/algorithm32` or `src/flat32`. Promotion must preserve the contained
oracle and qualification evidence as independent controls.

### 9. Resume rendering only by owner direction — complete

After the indexed cache, lifecycle, and constant-time consumer are accepted,
request or follow explicit direction before Flat32 integration, a controlled
night render, visibility investigation, exposure, ambient-light, or Color work.

### 10. Evaluate a sourced low-light visibility model — complete

Owner direction authorizes one contained, source-independent Ferwerda 1996
steady-state threshold-mapping experiment. Reuse the accepted screen-index and
native-15 palette without rebuilding physical stellar data. Integrate the
official CIE scotopic luminous-efficiency function across the 15 wavelength
bins, then compare pure Bruneton, production Ward-modified Bruneton, Ferwerda
cone-only, and Ferwerda cone-plus-achromatic-rod outputs on the fixed San Jose
sunset-plus-three-hours observation. Use the paper's reference display
conditions (80 cd m^-2 maximum, 40 cd m^-2 adaptation) and its starlight
adaptation example (0.001 cd m^-2). Preserve standard sRGB output encoding for
all four comparisons.

This step is an evaluation, not color tuning or production promotion. Its
claim is limited to steady-state threshold mapping on the unattenuated
star-only upper bound. Temporal adaptation, spatial acuity, atmosphere, scene
occlusion, and ambient-source aggregation remain outside the experiment.

### 11. Compare exact sunset and solar noon — complete

Owner direction authorizes a follow-up cone-plus-achromatic-rod comparison at
San Jose exact sunset and solar noon. Reproject and rebuild the screen palette
at each exact instant. Use the accepted exact-time receiver-local direct-light
records from immutable run `000302` as the Ferwerda world-adaptation inputs;
do not tune or interpolate them. Render the star-only layers on black so this
step isolates source visibility. Record explicitly that atmospheric sky
background, stellar attenuation, scene geometry, temporal adaptation, and
acuity remain absent.

### 12. Review complete-scene color at sunset and noon — complete

Owner clarification requires complete spherical scene renders, not isolated
stellar layers. Render the normal contained atmosphere, Sun, stars, spherical
ground, and two distant review objects at exact sunset and solar noon. Apply
the same condition-wide Ferwerda cone-plus-achromatic-rod transform to the
completed Color input without identifying celestial sources. Reuse step 11's
accepted exact-time adaptation inputs and apply no tuning. Because captured
renderer geometry reaches Color as linear RGB rather than native-15 spectra,
declare and record the use of completed linear-sRGB luminance as its rod proxy.
Retain image summaries that expose clipping and color balance.

### 13. Compose the production Sun disk over the stellar palette — complete

Extend the contained screen-palette builder from stellar aggregation to ordered
binary layer composition while preserving the published native-15 palette
schema. Use an independent transient `occupiesPixel` flag during construction.
Preserve the accepted stellar builder as the back-layer oracle. Adapt the
current production Sun-disk direction, angular support, spectral radiance, and
coverage input into the contained implementation without changing or tuning
them.

Implement and qualify this sequence:

1. build the accepted stellar spectrum as the initial back layer;
2. project the resolved Sun disk, visit its bounded screen footprint, and
   calculate geometric pixel coverage;
3. classify every positive coverage value as full Sun ownership and only exact
   zero coverage as no Sun ownership;
4. overwrite owned pixels with Sun radiance multiplied by the geometric
   projected disk/pixel overlap fraction and otherwise retain the stellar value
   unchanged before final palette assignment;
5. upload and resolve the unchanged native-15 palette schema while retaining
   O(1) destination lookup and no occupancy GPU resource;
6. disable the contained renderer's existing independent Sun-disk contribution
   whenever the palette-composed Sun is active, proving that exactly one Sun
   implementation contributes to the frame;
7. pass the final boundary radiance through shared atmospheric transmittance
   exactly once and common Color; and
8. render controlled Sun/star overlap evidence without changing production.

Acceptance requires every pixel with positive coverage to contain its
coverage-scaled Sun spectrum and no stellar radiance, every exact-zero pixel to
retain its prior stellar value exactly, and all off-disk stars to remain
unchanged. The initial discrete controls for coverage `0`, `0.25`, `0.5`,
`0.75`, and `1` remain historical arithmetic evidence. Current rasterization
must conserve projected disk area across continuous pixel-overlap fractions.
The rendered integration must also prove that the prior independent Sun path is
inactive and that no pixel receives a duplicate Sun contribution.
Report disk coverage classifications, suppressed stellar pixels, palette
cardinality, matrix/palette bytes, construction cost, GPU readback, and
atmosphere composition parity. Perform no Moon projection, texture,
illumination, material, or qualification work in this step.

Do not generalize step 13 into the final Sun/Moon overlap policy. Record the
any-positive occupancy rule and geometric overlap scale as versioned policy
inputs so a later extended-body compositor can replace them without changing
stellar photometry, atmosphere transport, or the published screen-palette
schema.

Accepted by immutable run `000427-sun-over-stellar-screen-palette-proof`
(`8a459d0dcd6d462c1c5e66f560ee1b8aacfbafdb0e05a937979c1775257c5315`).
The real projected control exercised coverage `0`, `0.25`, `0.5`, `0.75`, and
`1`; every positive class exclusively wrote its coverage-scaled production Sun
spectrum. GPU matrix/palette readback was exact, shared atmospheric composition
matched both numerical oracles, and the cache-only unchanged Bruneton render
contained exactly one Sun implementation. Production inventories were
unchanged. Run `000425` remains the sealed sandbox-denied browser predecessor;
accepted centered predecessor `000426` remains valid but is superseded for this
gate by `000427` because the latter exercises all fractional coverage classes.

## Acceptance Invariants

- Catalog magnitude and spectrum define integrated flux; pixel footprint only
  distributes it.
- Atmosphere applies stellar transport once. Color receives only the common
  composed result.
- Geometry owns placement, horizon support, pixel footprint, and scene
  visibility relationships.
- Camera and viewport enter the screen-cache identity and invalidate its view
  product. Scene-hit state remains a live consumer input and does not.
- Empty capacity, unsupported domain, blocked visibility, and zero input remain
  exact zero.
- The contained Sun adapter must preserve the production Sun disk's radiometry
  and support; layer composition cannot introduce a Sun- or star-specific Color
  branch.
- A render using the palette-composed Sun must disable the prior independent
  Sun contribution. The two implementations may never contribute in the same
  frame.
- The schema keeps transient occupancy independent from radiance; no Moon
  behavior is evaluated and no occupancy resource is published.
- Historical Algorithm32-Star fixtures and all immutable extraterrestrial runs
  remain unchanged.

## Rapid Follow-Up During Production Promotion

Treat the source-local prerendered Sun-disk tile as part of the first
production-promotion tranche, not as open-ended future optimization. Once the
screen-index/native-15 stellar palette contract is established at its production
owners, production may port the Sun directly as a compact disk-local
coverage/claim tile plus one shared native-15 spectrum rather than first
shipping the contained full-screen flattened Sun matrix.

The celestial shader places the tile using the current Sun/camera transform and
fractionally merges it over the stellar palette in O(1). Immutable run `000435`
is the oracle for projected support, continuous edge radiance, total disk
energy, atmospheric transmittance, scene masking, and final images. The port
must additionally prove tile filtering, compatible-scale reuse, FOV/viewport/
support invalidation, context restoration, atomic replacement, and disposal.
Define the tile interface narrowly enough that a later Moon implementation can
provide its own source-local coverage/claim and indexed spectral tile without a
second celestial rendering architecture. The future Moon setup additionally
owns phase/terminator geometry, grayscale albedo, shared native-15 lunar
reflectance, illumination, orientation/libration, and their invalidation. It
also extends the receiver-local lighting calculation with a separately ledgered
visible celestial-radiance field for ambient/adaptation, without double-counting
directional Sun or Moon irradiance, and evaluates a larger explicit shadow
extent for directional moonlight. Shadow range, resolution, precision, and cost
must be qualified together; cascades remain an allowed candidate. This
follow-up does not authorize Moon work or change the common Color path.

Qualification must include a full-Moon control demonstrating materially
nonzero receiver-local scene lighting when the Sun is below the horizon. It
must distinguish direct phase-dependent moonlight, moon-cast shadows, diffuse
moonlit-sky ambient fill, and visible-field adaptation rather than replacing
them with one undifferentiated brightness scalar.

## Deferred

- automatic exposure or sky-probe adaptation;
- daylight or all-condition visibility;
- live Earth rotation and real-sky calibration;
- Flat/local dome placement;
- acquisition and production enablement of catalogs beyond the reviewed 500
  members; the representation itself must still qualify scalable capacity;
- magnitude-based runtime culling or acceleration beyond the first measured
  need;
- point-spread functions, seeing, scintillation, diffraction, bloom, glare,
  lens artifacts, and artistic star shapes;
- Milky Way and other diffuse backgrounds;
- Moon and planet rendering, including the deferred per-palette-entry
  `claimedFraction` overlap extension and the source-local Moon tile described
  by the cache design, visible-celestial ambient/adaptation aggregation, and
  extended-range directional shadow qualification;
- UI, labels, constellation lines, and selection.

## Evidence Sources

These are read-only inputs to reconciliation, not current instructions:

- [Stage 12 implementation record](stage-12-implementation-topic.md)
- [Extraterrestrial promotion record](promotion-plan.md)
- [Production integration plan](production-integration-api-plan.md#7-port-stars-as-a-separately-enabled-first-family-layer)
- [Celestial contribution cache design](celestial-contribution-cache-design.md)
- retained candidate modules and proof runners under `scripts/extraterrestrial/`

Retired `scripts/algorithm32-star` material is a different historical lane and
may be inspected only when a named comparison is needed.

## Immediate Next Step

No further work is scheduled in this experimental plan. Preserve every source
and immutable run unchanged as implementation and comparison evidence. Triage
any proposed follow-up through the
[production closeout plan](../algorithm32/production/color-star-cache-closeout-plan.md)
and create a new focused plan before execution.

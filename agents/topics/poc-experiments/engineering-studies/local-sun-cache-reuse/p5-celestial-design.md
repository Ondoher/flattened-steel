# P5-Celestial Design Basis

The owner confirmed on 2026-10-10 that the existing flat-geometry star design
notes are correct and current. Their archived storage location does not make
their selected design obsolete. P5-Celestial follows those notes; it does not
substitute the spherical observer's apparent sky for the flat mapping.

## Governing Star Notes

The owner-selected [central-view capture](central-view-capture.md) optionally
uses a 60-degree horizontal field derived into vertical FOV from the actual
buffer aspect. Existing 70-degree vertical framing remains the default. The
prepared frame applies projection before bindings and celestial generation;
its record owns actual-camera checks and the calibrated-size Flat180 image.

The owner-selected [optional Sun-size calibration](sun-size-calibration.md)
adds a physical radius derived from current source height and the mean real
solar angular diameter for an overhead ground observer. The fixed 16-mile
radius remains selectable and default. Its owning record defines power
preservation, derivation, controls and verification; production is unchanged.

The owner-selected [ground and object capture](celestial-ground-scene.md)
returns to the actual Sun-facing camera at 1024 by 768, retaining the shared
human-vision filters and p2 response. Its explicit scene preset uses the existing
ordinary endpoint scene, exact receiver lighting and six per-object shadows.
Scene-color and preserved-frame buffers follow the actual viewport; resource
admission includes the corresponding raster allocations. This selection does
not change stellar placement, atmospheric transport or source brightness.

The read-only [celestial contribution cache design](D:/flattened-steel/archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/celestial-contribution-cache-design.md#deferred-live-transform-contract)
owns the mapping and live-transform contract. Its SHA-256 is
`d064c6b95b9ce20ec1dad6290c3a1d60d1f768b2fda78db4ff1f64df20a4c543`.
The read-only [promotion plan](D:/flattened-steel/archives/topics/topic-consolidation-20260906/agents/topics/extraterrestrial/promotion-plan.md)
corroborates that selection; its SHA-256 is
`71d52bdfc1cfb01fc25e2b0c353eee9357eaccfaf141af192c9537ccfc4de5a1`.

The required boundaries are:

- Retain canonical catalog directions in `celestial-rh-v1`, source photometry
  and calibrated spectral packets. Geometry owns their placement and projection.
- Apply the shared live pole rotation
  `d_body = Rz(-thetaEarth(t)) * d_celestial` before geometry mapping. Record
  the rotation period explicitly. The base rotation epoch is
  `1970-01-01T00:00:00Z`, with longitude zero aligned to canonical `+X` and
  dome azimuth zero. This is the documented simulator convention; an additional
  astronomical alignment offset is a separate future selection.
- Convert rotated celestial latitude and longitude through the north-polar
  azimuthal-equidistant map: normalized planar radius is `pi/2 - latitude`.
  Geometry then maps the projected sky onto its dome.
- Preserve the base-epoch overhead invariant: equal celestial and terrestrial
  latitude/longitude place the catalog member overhead for that receiver.
- The owner's subsequent boundary clarification selects the geometry-resolved
  camera-ray termination as the end of atmospheric view transport, including
  the configured observer dome. Celestial boundary spectra consume the existing
  ray transmission once; never extend their attenuation beyond that boundary.
  The projected star mapping supplies placement, not stellar emission distance,
  inverse-square attenuation or an atmospheric-cache coordinate.
- Keep live placement, camera/viewport rasterization, stellar source content
  and atmospheric transport as separate identities and responsibilities.
  Time changes refresh placement; they do not by themselves require rebuilding
  the catalog or the local-Sun atmospheric field.
- Keep the finite local Sun's 3D position/radius and visibility separate from
  the projected directional star field. Combined rendering must preserve source
  ordering and scene occlusion without altering atmospheric path radiance.

## Integration And Verification

Reuse the current production catalog, spectra, one-pixel generation and
presentation machinery through contained adapters. Replace the spherical
placement with the selected flat mapping. Use the shared celestial consumer
unchanged with transmission supplied by existing flat view transport up to its
geometry-resolved endpoint. Preserve the current color/adaptation model.

Before captures, record the concrete dome parameters and rotation period used
by the adapter, with their derivation or implementation choice. The notes
establish the mapping contract; they are not evidence that the current
production Flat/local mode already implements stars. Verify the overhead
invariant, rotation sign, CPU/GPU projection agreement, horizon handling,
transport and resource ownership in focused experiment proofs.

## Cache And Runtime Operations

Placement is only one part of the adapter. The operational baseline is the
current spherical stellar path, traced through the production implementations
below. Reuse its separation of inputs, generated outputs and consumers; do not
infer cache behavior from the dome mapping.

| Operation | Spherical implementation | Flat integration obligation |
| --- | --- | --- |
| Static source input | [StellarGenerationSourceTable](../../../../../src/algorithm32/implementation/star-field/StellarGenerationSourceTable.js) keeps canonical member order, directions, magnitudes and Native15 spectra in separately identified binary32 tables. | Retain authenticated catalog/spectral content. Apply live rotation and flat projection through geometry, without rewriting the source table. |
| GPU point assignment | [StellarScreenPaletteGenerationStages](../../../../../src/algorithm32/implementation/star-field/StellarScreenPaletteGenerationStages.js) writes a viewport-sized R16UI index; depth ordering chooses the lowest canonical member when several stars occupy a pixel. Entry zero is empty. | Reuse the one-pixel assignment and deterministic ownership with the flat geometry contributor. Verify pixel orientation and off-frame handling. |
| GPU spectral aggregation | The second generation stage writes an R32F palette. It sums every member assigned to a representative pixel exactly once, retains the fixed one-pixel presentation scale, and stores collision-combined magnitude in row 15. | Preserve spectral addition and magnitude accounting. A representative identifies a pixel's sum; it must not discard the other colliding members. |
| Lookup and attenuation | [CelestialScreenPaletteConsumerShaderContribution](../../../../../src/algorithm32/celestial-source-support/CelestialScreenPaletteConsumerShaderContribution.js) performs an index lookup followed by a palette lookup. The current palette contains boundary source values; the consumer multiplies by view-path transmittance once. | Reuse the consumer unchanged. Check transmission against the actual geometry-owned ray endpoint, including the observer dome; do not add a separate full-slab attenuation calculation. Never apply attenuation both during palette construction and again in consumption. |
| Compatibility and reuse | [StellarScreenPaletteGenerationIdentity](../../../../../src/algorithm32/implementation/star-field/StellarScreenPaletteGenerationIdentity.js) separates source, observation/geometry, exact view and optional presentation identities. Unchanged complete generations can be reused; time, view or receiver-adaptation changes can require new screen outputs. | Do not equate reuse of the local-Sun atmospheric field with reuse of camera-dependent stellar pixels. Preserve the static source while regenerating only incompatible products. |
| Publication and cleanup | [StellarScreenPaletteGenerationPass](../../../../../src/algorithm32/rendering-runtime/three/StellarScreenPaletteGenerationPass.js) stages both outputs, commits their pair together, exposes zero bindings while incompatible and disposes replaced/staging resources. Context loss and restoration invalidate publication. | Reuse coherent publication, observation updates, resize, failure handling and disposal. Include these operations in focused proofs, rather than qualifying only a still image. |
| Joint composition | [CelestialGenerationPass](../../../../../src/algorithm32/rendering-runtime/three/CelestialGenerationPass.js) coordinates the star and Sun products. The shared consumer applies scene masking before lookup and gives positive Sun coverage precedence over a star pixel. | Preserve the separately placed finite Sun, star occlusion and all-or-zero compatible celestial publication. Do not suppress atmosphere path radiance when a celestial contribution is occluded. |

There is also an older tiled transport-cache implementation:
[StellarPointSetCpuCache](../../../../../src/algorithm32/implementation/star-field/StellarPointSetCpuCache.js)
precomputes the common altitude/direction transmittance grid before multiplying
each member spectrum; its GPU builder packs/copies that field.
The current normal [ShaderBuilder](../../../../../src/algorithm32/rendering-runtime/ShaderBuilder.js)
leaves the tiled stellar cache/controller unset and installs the screen-palette
generation path through its runtime installer instead. The older classes are
useful algorithmic references, but their presence does not establish that a
normal spherical render builds or consumes that tiled field. P5-Celestial must
follow the actual active path and explicitly justify any different transport
cache it introduces.

The [P5-Celestial plan](plan.md#p5-celestial--integrate-the-sun-disc-and-stars)
owns execution, delivery and completion gates. The prior P4/P5 cache evidence
retains its atmospheric and scene-lighting scope. Recording remains unselected.

## Concrete Contained Adapter

The selected hemisphere has planar radius `pi * R` and apex height `pi * R`,
where `R` is the frozen flat-map projection radius. For colatitude `rho`, its
height is `pi * R * sqrt(1 - (rho / pi)^2)`. This reversible presentation
choice supplies the shape and scale left unspecified by the governing notes.
The projected mapping does not replace the configured observer-dome ray boundary
or introduce stellar distance dilution or calibration. Rotation period is
86,164,090.5 milliseconds; the documented Unix-zero
epoch remains the simulator's alignment convention. The equivalent polar-angle
form `atan2(length(direction.xy), direction.z)` avoids the near-pole loss of
precision associated with `acos(direction.z)` in binary32.

The finite Sun tile receives observer-relative scene-axis metres:
`(source.x - observer.x, source.z - observer.z, -(source.y - observer.y))`.
The shared tile executor then applies the existing metres-per-scene-unit scale.
The physical atmosphere/cache source remains the original z-up position.
Neither the production geometry nor the tile executor is changed.

Stellar boundary spectra use the existing one-pixel palette calibration and
collision sums. Physical presentation remains available as the frozen comparison.
The owner selected the globe application's human-vision stellar filters for
the new upward Flat180 capture; the current p2 display model is retained. The
shared consumer attenuates Sun and stars once using `state.transmittance` from
the same view transport that accumulates atmospheric path radiance. Geometry
owns its top/ground/dome endpoint. The earlier separate full-slab override is
superseded by the owner-selected [boundary correction](celestial-boundary-correction.md);
historical captures retain their original policy and are not requalified.
Ozone remains disabled. Scene-hit masking occurs before celestial lookup and
does not change the atmospheric path-radiance calculation.

The two-second preview is a small camera pan of one combined physical state.
It exercises view-dependent regeneration while retaining the atmospheric field;
it is not the selected Union Glacier full-orbit recording.

The camera's actual physical position, including its five-metre eye height in
these captures, updates the flat projection uniforms before generation. Camera
translation therefore changes dome parallax and the compatibility identity.
The static catalog remains unchanged; screen products regenerate as required.
Focused CPU/GPU raster agreement uses a predeclared 0.1-pixel continuous
projection criterion for the selected viewport, with integer-boundary movement
reported separately. Direction residuals are observations, not absolute physical
accuracy. Exact dome-rim coincidence is outside this sampled workload.

## Shared Human-Vision Stellar Presentation

The contained `p2-human-away-up` preset uses the existing production
`ViewPresentationFilterRegistry` with the globe's ordered selections:
`human-mesopic-luminance-v1` (maximum rod contribution 0.5), followed by
`human-low-light-chroma-v1` (maximum chroma retention 0.65). It loads the
authenticated production `human-vision-filter-package-v1` through the existing
package loader. Shared production implementation and assets are read-only.

These source-linear filters consume the transported Native15 stellar packet,
the palette's collision-aggregated visual magnitude, and the facade's measured
receiver adaptation luminance. The p2 model then performs its ordinary ambient
gain and display encoding. No extra stellar gain is introduced. The stellar
filter does not recolor atmospheric radiance or the Sun disc.

The facade remains the owner of receiver-light identity and adaptation bindings.
The flat stellar executor now includes color, registry, scotopic-weight and
receiver identities plus adaptation luminance in publication compatibility,
using the spherical executor's presentation tuple and schema. Incomplete values
cannot publish. Changed presentation regenerates screen products while retaining
the immutable catalog table and textures. Geometry, observer parallax and
observation retain their separate flat identities.

The focused proof reads physical and filtered RGB from the actual assembled
shader at an occupied pixel, compares the shared CPU and GPU equations at the
measured adaptation, and checks six synthetic adaptation values spanning dark
through bright light. Synthetic cases do not change the image's lighting state.
It also changes only the executor's proof callback to verify publication
replacement, then restores the actual facade-owned tuple before capture.
The [human-vision delivery](celestial-human-vision.md) owns numerical results,
image visibility and the new source-review receipt.

# Sun-Facing Ground And Object Capture

The latest owner-selected case is
[Union Glacier at closest approach](#union-glacier-at-closest-approach-flat0).
All cases below retain the ordinary scene, current p2 color and human-vision
stellar presentation. None adjusts physical brightness.

## Union Glacier Flat180

The owner selected a return from the upward stellar view to the Sun, including
the ordinary ground and six review objects. Immutable
[00714 combined image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00714-p5-celestial/flat-180-combined.png)
uses the same Flat180 physical state, p2 color, shared human-vision filters,
catalog and corrected celestial ray boundary at 1024 by 768. The camera is
5 metres above ground and points directly at the Sun's actual elevation,
8.73779 degrees. The Sun is centred and 31,781,576.85 metres away.
No brightness adjustment was introduced. Production is unchanged.

The existing `ShellEndpointScene` supplies ground, six ordinary boxes, exact
receiver lighting and six existing 4096-square per-object shadow maps. This
explicit preset routes celestial drawing through its complete scene-color and
scene-depth path. Color and preserved-frame targets resize to the actual raster;
resource admission charges the actual viewport. Other presets retain their
existing scene selection.

## Measured Lighting

The [result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00714-p5-celestial/result.json)
retains receiver spectra, identities and photopic measurements:

| Measurement | Value |
| --- | ---: |
| Direct illuminance normal to the Sun | 1,006.18 lux |
| Direct horizontal illuminance | 152.85 lux |
| Diffuse horizontal illuminance | 145.56 lux |
| Total horizontal illuminance | 298.41 lux |
| Median sky adaptation luminance | 31.0953 cd/m² |

The total-horizontal luminance proxy is 94.9872 cd/m², distinct from median sky
adaptation. Distance dilution and spectral attenuation reduce the light, but
the Sun remains above the flat horizon. The selected state lacks the globe's
below-horizon source occlusion. These measurements support diagnosis of the
owner's concern about excessive light; they do not establish that brightness
normalization or diffuse-scattering magnitude is correct. Ground and objects
look dark, with illuminated haze and long shadows. The selected p2 response
controls displayed brightness. The 0.4443-pixel-radius disc has four white
central PNG pixels.

## Verification And Reproduction

Sun/view transmission, scene masking, all 2,000 stellar projections, palette
and consumer checks, shared human-vision filters, publication, staging rollback,
resize, cancellation and disposal pass. The field has 1,031 occupied stellar
index pixels. Palette relative residual is 1.27e-7, consumer residual 5.32e-8,
and human-vision residual 1.70e-7. The scene record confirms six lights and
complete rendered state. The ordinary `flat-180-stars.png` diagnostic removes
Sun and atmospheric path radiance while retaining scene color; for this preset
it is **not a pure star-only image**. Use the combined image for scene assessment.

Browser execution took 80.434 seconds, with zero WebGL error. The
[00713 guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00713-resource-bound/result.json)
passes: 4.49 GiB sampled peak private memory and 12.29 GiB minimum free memory.
Profile and heavy lock are absent after cleanup. The
[inputs](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00714-p5-celestial/inputs.json)
retain parent controls, layout, source/tool hashes and bundle derivation.
Earlier evidence is immutable; no video or promotion was performed.

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-human-scene-180
```

Local JavaScript type checking and repository formatting pass. Numerical delivery
is accepted. Source completion requires matching exit-0 CLEAN primary/audit
validation at `.codex-tmp/review-standards/session-vKFhP6/validation.json`.
Its baseline was captured before edits. Missing, stale or non-CLEAN evidence
keeps completion open; previous receipts retain their original scope.

## San Jose At Winter-Solstice Flat180

Immutable [00716 combined image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00716-p5-celestial/flat-180-combined.png)
uses San Jose latitude 37.3382 degrees, longitude -121.8863 degrees, and the
existing published-minute December solstice basis, `2024-12-21T09:20:00.000Z`.
Ordinary `FlatEarthGeometry.resolveObservationInstant` selects closest-angle
180 degrees; `resolveShellState` resolves fresh physical owners. Its instant is
`2024-12-22T08:05:23.319Z`, or December 22 at 12:05:23 a.m. PST, twelve hours
after closest approach on the solstice date. This date basis follows the frozen
controls; no subminute astronomical accuracy is claimed.

The camera faces the Sun at its actual elevation, 14.67491 degrees, from the
same five-metre eye height at 1024 by 768. Distance is 19,057,929.36 metres.
Ground, six objects, exact lighting, existing shadows, source height/radius,
brightness normalization, atmosphere, p2 and shared human-vision filters retain
their existing policies. New placement lies inside the pinned cache domain:
maximum radial extent 33,378,000 m minus source offset 18,436,236.79 m minus
maximum view-ray extent 1,926,774 m leaves 13,014,989.21 m of coverage margin.
This bounds this camera's finite view; it is not a new all-location claim.

| Measurement | Value |
| --- | ---: |
| Direct normal illuminance | 4,321.55 lux |
| Direct horizontal illuminance | 1,094.80 lux |
| Diffuse horizontal illuminance | 524.32 lux |
| Total horizontal illuminance | 1,619.12 lux |
| Median sky adaptation luminance | 101.4489 cd/m² |

The [result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00716-p5-celestial/result.json)
retains the exact observation and all receiver spectra/lighting. It verifies
Sun-centred projection, actual view transmission, scene masking, all 2,000
catalog projections, 405 occupied stellar pixels, palette/consumer agreement,
human-vision filters, publication/lifecycle, cancellation and disposal. The
scene-inclusive diagnostic limitation stated above also applies here. WebGL
error is zero. The separate median adaptation value exceeds the same 5 cd/m²
low-light threshold; ground illuminance is about 5.43 times the Union Glacier
capture. This measures model output without validating its physical brightness.

The [inputs](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00716-p5-celestial/inputs.json)
retain a controls derivation, selected location/date/angles/instants, resulting
control-state hash, and the complete host-control dependency graph collected
by Rollup. Original Union Glacier controls are unchanged; all derivative
controls and images are in this new run. Browser execution took 85.561 seconds.
The [00715 guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00715-resource-bound/result.json)
passes with sampled private peak 4.26 GiB and minimum free memory 11.16 GiB.
Browser profile and heavy lock are absent after cleanup. No video or promotion
was performed. Production remains unchanged.

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-human-san-jose-winter-scene-180
```

Local JavaScript type checking and formatting pass; numerical delivery is
accepted. Fresh source completion requires matching exit-0 CLEAN primary/audit
validation at `.codex-tmp/review-standards/session-E3gyXR/validation.json`, whose
baseline preceded edits. Earlier receipts retain their original scope.

## Union Glacier At Closest Approach Flat0

Immutable [00718 combined image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00718-p5-celestial/flat-0-combined.png)
uses original frozen Union Glacier Flat0, `2024-12-14T17:27:41.487Z`.
The five-metre camera faces the Sun at its actual elevation, 37.53777 degrees,
at 1024 by 768 with the same field of view, scene, source radius, current p2,
shared human-vision presentation and corrected ray boundary as 00714.
Pointing at the higher Sun puts the ground below the image and leaves the tops
of the ordinary objects at the bottom. The complete ground/object scene is
still rendered; its physical scene setup was not changed.

The [result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00718-p5-celestial/result.json)
records centre-ray distance 7,924,096.61 metres and angular diameter
0.372368 degrees. Projected diameter is 3.56415 pixels, versus 0.888644 pixels
in Union Glacier 00714: 4.01077 times the diameter, approximately 16.09 times
the geometric image area. These are geometric disc measurements, separate
from saturated pixel brightness or the atmospheric halo. The disc remains
small at this raster.

Direct normal illumination is 36,819.86 lux; direct horizontal is 22,433.76 lux,
diffuse horizontal 3,927.67 lux, and total horizontal 26,361.43 lux. Median sky
adaptation is 809.0887 cd/m2. These are model outputs with unchanged source
normalization, not independent brightness validation.

The bounded preset selects only Flat0 and moves scene-occlusion, stellar,
lifecycle and cancellation proofs to that control; it generates no preview.
Sun transmission, all 2,000 catalog projections, palette/consumer checks,
human-vision filters, scene masking, complete six-light scene, publication,
cancellation, resize and disposal pass. There are 1,833 occupied stellar index
pixels and zero WebGL error. The scene-inclusive stars diagnostic limitation
above applies here. Browser execution took 81.281 seconds.

The [00717 guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00717-resource-bound/result.json)
passes with 4.48 GiB sampled peak private memory and 12.29 GiB minimum free
memory. Profile and heavy lock are absent. The
[inputs](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00718-p5-celestial/inputs.json)
retain frozen parent controls/layout, complete source/tool identities and exact
bundle transformations. Previous runs remain immutable; production is unchanged.

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-human-scene-0
```

Local JavaScript type checking and formatting pass; numerical delivery is
accepted. Fresh source completion requires matching exit-0 CLEAN primary/audit
validation at `.codex-tmp/review-standards/session-UAChCA/validation.json`, whose
baseline preceded edits. Earlier receipts retain their original scope.

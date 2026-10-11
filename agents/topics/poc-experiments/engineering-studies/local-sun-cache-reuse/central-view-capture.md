# Union Glacier Flat180 Central-View Capture

The owner selected a Union Glacier Flat180 render with the previously discussed
60-degree horizontal central-view framing. Accepted
[00725 combined image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00725-p5-celestial/flat-180-combined.png)
retains current p2, shared human-vision filters, the ordinary ground/six-object
scene, exact lighting and Sun-facing camera at 1024 by 768. This capture uses
the new [overhead-calibrated Sun size](sun-size-calibration.md); fixed 16-mile
radius remains the default selectable source size.

## Camera Contract

The optional `--fov=human-central` selects 60 degrees horizontally; omit it or
use `--fov=standard` to retain 70 degrees vertically. For actual buffer aspect
`a = width / height`, derive `vertical = 2 * atan(tan(horizontal / 2) / a)`.
The prepared frame validates the supplied horizontal range and updates its
camera projection before shader bindings, scene capture and celestial
generation. Both ordinary ground scenes and sky-only captures use that path.
The option is propagated through complete staging and cancellation recipes.

This is practical central-view framing, based on the convention of central
vision extending 30 degrees from fixation, rather than the full peripheral
visual field. [Reference](https://www.ncbi.nlm.nih.gov/books/NBK207559/)
Source placement, physical size, atmosphere, receiver sampling, light power,
scene geometry and shadow settings retain their separate owners. The FOV
changes image framing and projected pixel size.

## Measured Delivery

The [result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00725-p5-celestial/result.json)
records actual camera horizontal FOV 60 degrees, vertical FOV 46.82644889
degrees, and aspect 4/3. The host qualifies actual camera dimensions rather than
trusting the requested preset. The original December 14 trajectory's Flat180
instant is `2024-12-15T05:27:41.487Z`; its source placement is unchanged.

The calibrated Sun's angular diameter is 0.08097774 degrees and projected
diameter 1.25335 pixels. It remains very small; PNG readback finds four white
central pixels. Direct normal illumination is 1,006.18347 lux and total
horizontal illumination 298.41093 lux, matching the original 00714 scene.
These values diagnose the selected model; they do not add brightness tuning or
independent physical validation.

All 2,000 stellar projections pass with 446 occupied stellar index pixels.
Sun/view transmission, shared palette/consumer and human-vision checks, scene
masking, publication, rollback, resize, cancellation and disposal pass; WebGL
error is zero. Human-vision relative residual is 1.22e-7. Browser execution
took 81.308 seconds. The scene-inclusive stars diagnostic retains ground/object
color; its scope remains that of the [ground capture](celestial-ground-scene.md).

The [00724 guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00724-resource-bound/result.json)
passes with 4.28 GiB sampled peak private memory and 12.66 GiB minimum free
memory. Profile and heavy lock are absent. The
[inputs](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00725-p5-celestial/inputs.json)
and recipe retain camera policy, viewport, radius calibration, frozen controls,
source identities and exact bundle derivations. No preview, full recording or
production promotion was generated. Historical evidence remains immutable.

```text
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-human-scene-180 --sun-size=overhead-calibrated --fov=human-central
```

Local JavaScript type checking and formatting pass. Numerical delivery is
accepted; implementation completion requires matching exit-0 CLEAN primary/audit
validation at `.codex-tmp/review-standards/session-tH8W5P/validation.json`.
The baseline preceded edits; previous receipts retain their original scope.

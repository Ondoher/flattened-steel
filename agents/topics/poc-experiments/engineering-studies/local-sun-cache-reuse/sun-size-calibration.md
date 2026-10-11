# Optional Local-Sun Size Calibration

The owner selected an optional physical radius that matches the real Sun's
angular diameter when the local Sun is directly overhead at its current
altitude. The fixed 16-statute-mile radius remains the default and selectable
comparison. This is contained experiment configuration; production is unchanged.

## Calibration Contract

Use the [NASA mean apparent diameter at one astronomical unit](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html),
1,919 arcseconds, or 0.53305556 degrees. It is a fixed mean reference, not a
date-dependent solar ephemeris. Calibration uses a ground observer at zero
altitude directly below the source; the five-metre capture eye does not alter
the reference size.

The existing finite spherical source uses `diameter = 2 * asin(radius / distance)`.
For an overhead source at height `h`, choose `radius = h * sin(diameter / 2)`,
with the angle in radians. The helper derives a radius for each state's current
height; it does not resize by camera distance, orbit phase or screen position.
After calibration the source retains one physical radius at a fixed altitude,
so its apparent disc shrinks as it moves farther from the observer.

At the current 4,828,032-metre (3,000-mile) altitude:

| Mode | Radius | Overhead angular diameter |
| --- | ---: | ---: |
| `fixed-16mi` | 25,749.504 m / 16 miles | 0.61115788 degrees |
| `overhead-calibrated` | 22,458.89680 m / 13.95531 miles | 0.53305556 degrees |

The helper validates normalized metres, positive height, agreeing source and
geometry placements, and radius below height/reference distance. Changing
altitude still requires the existing compatible atmosphere-cache rebuild; the
capture runner's pinned layout must match its source height. Size calibration
does not bypass that gate.

## Power And Evidence Boundaries

Keep source irradiance, calibration distance, incident scale and inverse-square
falloff. The ordinary finite-source owner recomputes uniform-disc spectral
radiance from the selected radius and solid angle. A smaller disc therefore has
higher surface radiance for the same calibrated source power. This selection
changes physical size; it does not impose an arbitrary visible-disc gain.

The host derives new control records without modifying frozen parents. Capture
inputs retain mode, equation, angular reference, ground-observer convention,
per-state heights/input radii/output radii, parent identity, before/after control
hashes and complete executable source identities. The selected radius reaches
the same ordinary source constructor, celestial definition and GPU projection.

## Verification And Reproduction

Accepted focused proof [00723](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00723-sun-size-proof/result.json)
checks both selections, overhead angle through an independent `atan2` recovery,
radius scaling at 1.5 times altitude, unchanged source power/geometry, rejection
of zero height and immutable parents. Earlier proof attempts remain preserved.

Accepted GPU [00721 result](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00721-p5-celestial/result.json)
and [closest-approach image](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00721-p5-celestial/flat-0-combined.png)
use Union Glacier December 14 Flat0, current p2, human-vision filters and the
ordinary 1024-by-768 Sun-facing ground/object scene. Measured angular diameter
is 0.32478194 degrees and projected diameter 3.10867 pixels. Historical 00718
with fixed 16-mile radius remains immutable comparison: 0.37236813 degrees and
3.56415 pixels. Direct normal and total horizontal illumination are numerically
unchanged: 36,819.86389 and 26,361.43344 lux respectively. This supports retained
power calibration, not independent physical brightness validation.

Sun transport/projection, 2,000 stellar projections, palette/consumer and human
vision checks, scene masking, publication, staging rollback, resize,
cancellation and disposal pass; WebGL error is zero. Browser execution took
74.245 seconds. The [00720 guard](../../../../../tmp/experiments/local-sun-cache-reuse/runs/00720-resource-bound/result.json)
passes with 4.10 GiB sampled peak private memory and 12.36 GiB minimum free
memory. Browser profile and heavy lock are absent. No video was generated.

The GPU capture precedes an additional invalid-input placement/unit validation
check. Its valid-input radius equation and executable rendering path are
unchanged; focused 00723 uses the final helper. No earlier run was reopened.

```text
node experiments/local-sun-cache-reuse/prove-sun-size.js
node experiments/local-sun-cache-reuse/run-resource-bounded.js --minutes=10 -- run-celestial.js --stage=p2-human-scene-0 --sun-size=overhead-calibrated
```

The optional flag works with existing celestial stages; omit it or use
`--sun-size=fixed-16mi` to retain the historical radius.
Local JavaScript type checking and formatting pass. Numerical delivery is
accepted; source completion requires matching exit-0 CLEAN primary/audit
validation at `.codex-tmp/review-standards/session-IWnZ82/validation.json`.
The baseline preceded edits; earlier receipts retain their original scope.

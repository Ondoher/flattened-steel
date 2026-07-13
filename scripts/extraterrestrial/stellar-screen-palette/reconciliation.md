# Stellar Screen-Palette Step 1 Reconciliation

Status: contained contract selected; production remains read-only.

## Contained implementation surface

All implementation for the current round is below
`scripts/extraterrestrial/stellar-screen-palette/`. Generated proof evidence is
below `tmp/extraterrestrial/`. The existing baseline, candidate, historical
runs, `src/algorithm32`, and `src/flat32` are not implementation surfaces.

## Read-only production findings

| Concern | Current production seam | Contained contract decision |
| --- | --- | --- |
| Catalog | `StellarPointSetSource` owns 500 ordered native-15 members and `celestial-rh-v1` unit directions. The underlying catalog is FK5/J2000. | Consume the checked contained V/50 catalog and use the explicit `eq-fk5-j2000-mean` frame. No production runtime import. |
| Epoch | Production labels the catalog epoch `2000-01-01T12:00:00Z` in UTC. Astronomical J2000.0 is JD 2451545.0 TT. | Declare J2000.0 as JD 2451545.0 TT. The first profile treats the catalog as static and does not invent proper motion. |
| Celestial placement | `SphericalEarthGeometry.expressCelestialDirectionInModel` applies observer latitude/longitude directly to the catalog vector. It does not apply precession or Earth rotation from observation time. | Precess FK5/J2000 mean coordinates to mean-of-date, derive Greenwich/local mean sidereal time, then convert to local ENU. |
| Camera | Runtime setup owns one camera and a unit-bearing viewport, but the atmosphere shader exposes only full-screen ray state rather than a point-source projection contract. | The contained contract owns explicit azimuth/elevation, perspective vertical FOV, aspect ratio, camera basis, NDC, and top-left row-major pixel conversion. |
| Cache identity | Current stellar WIP keys a member-by-transport cache using source, geometry, atmosphere, backend, and scheduler. | The screen product keys source roster, celestial/time/location placement, camera/projection, viewport, schema, and numerical policy. Atmosphere and scene depth remain consumer inputs. |
| GPU output | Current WIP builds a dense layered `R32F` transported field. | Contained step 4 uploads `R16UI` pixel indices plus a 15-by-entry-count `R32F` palette. No persistent screen-sized native-15 field. |
| Collision | Existing fragment logic traverses member transport values. | The accepted exact builder adds all 15 wavelength channels in the pixel's unique palette entry. Indices are never blended or multiplied. |
| Lifecycle | `ShaderBuilder` already coordinates controller reuse, complete build publication, and disposal seams. | Contained CPU/GPU controllers now prove atomic publication, preservation on failure, replacement, context restoration, and terminal disposal before promotion. |
| Atmosphere composition | Existing stellar WIP traverses the catalog and consumes already transported member fields. | Contained step 5 fetches one screen index, resolves one native-15 palette row in a fixed spectral loop, applies shared view transmittance once, masks only the stellar boundary term, and adds it to path radiance before unchanged Color. |

## Fixed first astrometric profile

The contained transform uses the IAU 2000 three-angle precession polynomial in
USNO Circular 179 and the USNO approximate Greenwich mean sidereal-time
equation. UTC supplies the first proof's UT1 and TT approximations. This is
adequate for the initial roughly arcminute-scale pixel assignment but is not an
observatory-grade apparent-place model.

The profile explicitly excludes proper motion, nutation, aberration,
gravitational deflection, refraction, polar motion, finite-distance parallax,
and measured UT1−UTC. A later accuracy profile may replace the transform data
without changing screen-cache topology.

Primary references:

- USNO Circular 179: <https://aa.usno.navy.mil/publications/Circular_179>
- USNO approximate sidereal time: <https://aa.usno.navy.mil/faq/GAST>
- IAU SOFA current software and model overview:
  <https://www.iausofa.org/current-software>

## Step 1 result

The production ownership seams are sufficient to start contained work. The
first missing physical operation is the epoch/time-aware catalog-to-local
transform. The first missing representation operation is exact per-pixel
palette construction, which belongs to Work Plan step 3 and is not implemented
by steps 1 or 2.

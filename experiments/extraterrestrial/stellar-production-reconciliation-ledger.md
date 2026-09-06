# Stellar Production Reconciliation Ledger

Status: accepted for the bounded first-render execution on 2026-08-17.

This ledger reconciles the retained contained stellar implementation with the
current production contracts. It does not promote code into `src/algorithm32`.

## Selected Boundary

The accepted contained representation remains compatible with the current
production model:

- 500 reviewed apparent top-of-atmosphere native-15 irradiance packets;
- capacity 512, with a 32 by 16 member grid and twelve exact-zero slots;
- an 11 by 13 `(u,h)` domain packed as a 352 by 208 by 15 scalar `R32F`
  array texture;
- atmosphere direct transmittance applied once before publication;
- exact spherical-pixel ownership and `E / Omega_pixel` point response;
- matching scene-hit visibility; and
- additive spectral composition before the unchanged Bruneton Color boundary.

No materially different representation is required for the bounded first
render. The retained contained proof lane can therefore be rerun without
inventing a new design.

## Exact Current Disconnect

`src/algorithm32/rendering-runtime/ShaderBuilder.js` constructs the spherical
distant-Sun resource and the complete spherical celestial query packet, then
returns `stellarPointSetCacheController`, `stellarPointSetCache`, and
`stellarPointSetCacheIdentity` as `null`. The first missing production call is
the construction or reuse of a stellar controller from the roster's
`StellarPointSetSource`, followed by `build()` of the stellar plan using the
already-created spherical query/domain, atmosphere, backend, and scheduler.

Production already carries the downstream controller/resource fields through
`ShaderBuildContext`, disposal, shader-handle ownership, and the Three runtime
binding installer. The missing resource, rather than another runtime facade,
is the first implementation boundary.

## File Reconciliation

| Retained contained owner | Current production owner | Decision |
| --- | --- | --- |
| `StellarCelestialSource.js` and `StellarSpectralPhotometry.js` | `implementation/star-field/StellarPointSetSource.js` | Do not port. Production already owns the reviewed 500 members, native-15 packets, identity, and Vmag/HR order. |
| `CpuStarPointSetCache.js` | new star-field CPU transport owner behind `StellarPointSetCachePlan` | Adapt the atmosphere-once field equation and exact-zero support. Preserve production member order instead of the candidate's lexical member-id sort. |
| `TiledStarPointSetCache.js` | new star-field packing/plan owner | Adapt the 512/32x16/352x208x15 layout, zero slots, identity inputs, and scalar copy plan to current `CacheBuildModules` and cache-plan contracts. |
| `TiledStarPointSetGpuCacheController.js` | new `StellarPointSetCacheController` implementation | Adapt atomic publication, exact reuse, failure preservation, replacement disposal, and final idempotent disposal. |
| `StellarPointSetGpuCache.js` | new `StellarPointSetCacheResource` implementation | Adapt the runtime binding to `cache.celestial.starTransport` and current `ShaderContributions`; retain bounded raster, exact solid angle, cache lookup, and scene-hit semantics. |
| candidate `ShaderBuilder.js` | `rendering-runtime/ShaderBuilder.js` | Reject wholesale. Port only stellar controller creation/reuse and contribution selection. The candidate aggregates celestial ownership and contains the abandoned sky-probe/Color adaptation path. |
| `CelestialSpectralComposer.js` | current runtime spectral composition | Do not port as a parallel composer. Production already orders celestial evaluation before the shared spectral composition and Bruneton Color boundary. |
| candidate browser harnesses and runners | contained proof/evidence support only | Reuse for the bounded rerun. Never make them production runtime dependencies. |

## Accepted Evidence Commands

The bounded rerun uses these focused immutable-run commands in order:

1. `npm run proof:pre-g9:stellar-photometry`
2. `npm run proof:pre-g9:stellar-celestial-source`
3. `npm run proof:pre-g9:stellar-tiled-cache-cpu`
4. `npm run proof:pre-g9:stellar-tiled-cache`
5. `npm run proof:pre-g9:stellar-live-raster`
6. `node runners/render-subjective-globe-sunset-stars.js --three-hours-after-sunset`

The final command is the sole subjective render. Its scene is spherical San
Jose at synchronized sunset plus three hours. Whether stars appear or not, the
capture is retained and execution stops without tuning.

## Rejected Changes

- no catalog reacquisition or photometry refit;
- no Sun-disc change;
- no sky probe or automatic exposure;
- no Color change or star-specific display branch;
- no magnitude cutoff, flux multiplier, invented angular radius, sprite, bloom,
  or daylight/night visibility rule;
- no Flat-dome or live Earth-rotation expansion; and
- no production promotion as part of this contained first-render execution.

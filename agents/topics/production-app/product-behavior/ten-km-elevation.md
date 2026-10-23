# 10 km elevation option

Status: complete and locally activated on 2026-10-23. Served GPU checks pass.
No remote deployment or push occurred.

The elevation dropdown includes 10 km in both app modes. Physical camera and
receiver elevation change together, reusing the installed scene and cache.
The original Bruneton medium, numerical corrections, display behavior and
on-demand rendering are retained.

## Coverage and runtime support

The fixed ground patch is 900 km across, covering the roughly 357 km globe
horizon from 10 km. Every preset uses this one mesh. The generator covers both
solar-bin edges and cubic halo support through 10000 m. Its inventory has 5694
coordinate rows (87 additional), 91 blocks and 109 verified scenes. Maximum scene
residency remains 24 blocks, fitting the existing GPU atlas.

A fixed CPU packet admission budget rejected the expanded working set during the
first served check. Retention now treats that value as a soft eviction target:
required live packets remain pinned, while unused packets are evicted in LRU
order. Route estimates no longer veto required pins. Ownership, decoded identity,
packet shape, cancellation and actual allocation failure checks remain active.
The legacy `maximumPinnedBytes` field is retained for API compatibility and is
documented as a soft target. This does not reserve or allocate unlimited memory;
actual consumption follows active owners and releases.

## Cache and local activation

Selected package:
`f2c37c079d41f212a3905b4cccb18c0da84766ad374324c9ae8734b4ba1b4b42`.
It contains 732384838 bytes (about 698.5 MiB). The full GPU generation,
compression and reconstruction verification took 394465 ms (6.57 minutes).
Peak measured generator Node RSS was 277082112 bytes. Package report: 3682 bytes,
SHA-256 `a157fb905ccb8d15e03ce33e722554eddf2038c6965026c3ba310212e1e19b56`.

The immutable accepted run is
`tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-10-23T13-32-15-511Z-df4411f8-7875-4d49-912b-302942419227/`.
The [package result](../../../../.codex-tmp/flat32-elevation-10km/package-result.json)
and [runtime activation](../../../../.codex-tmp/flat32-elevation-10km/activation-runtime-02.json)
identify generated data, installed app files and matching server selection.

## Verification

The [input proof](../../../../.codex-tmp/flat32-elevation-10km/input-proof.json)
confirms an identical serialized physical/numerical request and preservation of
all prior coordinates. The [complete old-value comparison](../../../../.codex-tmp/flat32-elevation-10km/old-values-comparison.json)
compares 1365192360 bytes across all 5607 previously supported coordinates,
15 channels and 4058 unique outgoing directions: every old value is bit-identical.
Only coverage is extended; no new Bruneton RMSE score is claimed.

All 109 reconstruction checks, 15 focused browser checks, eight transport cases
and eight server tests pass. App and shared-runtime type checks and scoped
format checks pass. The browser checks cover dropdown dispatch, physical height,
cache reuse and fixed ground coverage at every preset.

The initial CPU horizon test missed an exact triangle seam at 45 degrees.
An analytic sphere and rays one millionth of a degree on both sides confirm
coverage. The test now pairs samples around each diagonal seam and retains
cardinal checks. No product mesh lift was introduced for that CPU edge artifact.

Live verification covers globe noon and sunset at 10 km, a 2 km sunset regression,
and flat San Jose and Union Glacier at 10 km. All seven captures pass with the
canonical medium, zero page/WebGL errors and stable idle frame counts. The
[final verification](../../../../.codex-tmp/flat32-elevation-10km/final-verification.json)
authenticates installed app files, actual HTTP-selected package and capture
identities. The [scene gallery](../../../../.codex-tmp/flat32-elevation-10km/live-scenes-03/comparison.html)
and [observations](../../../../.codex-tmp/flat32-elevation-10km/live-scenes-03/result.json)
record controls, physical height and GPU state. Visual inspection found no black
horizon strip in the checked globe views.
The first attempt is preserved with the CPU pin-budget failure; the second hit a
sandbox browser-launch restriction. The third uses the authorized host GPU route.
The owned verification browser and server are closed. Standards calibration remains
stale, so no standards-compliance result is claimed.

## Preservation and rollback

Earlier packages and immutable evidence remain intact. Sky Aerosol Properties
remains ended; ARM Spectral Validation and Sky Accuracy Dials remain suspended.
No experiment was reopened and no Sun-disc appearance change was made.

The prior 2 km selection is package
`1edb5237d6ecaa161225e4b76892e996071acba47a524a82dc34e584e2931ec7`.
Task evidence and rollback copies are below `.codex-tmp/flat32-elevation-10km/`.
For a full rollback, restore the previous elevation controls, fixed ground extent,
generator setting and server selection together and rebuild the app from that
coherent source state. Preserve both package directories. Saved `rollback-dist/`
contains the preceding app build; `rollback-dist-runtime-02/` preserves the first
10 km app build before the retention fix.
